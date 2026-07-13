import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { getBookingById, updateBooking } from '@/lib/data-store';
import { isDatabaseProviderEnabled } from '@/lib/database-provider';
import { logAuditEvent } from '@/lib/audit-log';
import { requireRole } from '@/lib/api-auth-guard';
import { sendEmail } from '@/lib/email';
import { getSupabaseAdmin } from '@/lib/supabase';
import { getUserByEmail } from '@/lib/auth-store';

export const runtime = 'nodejs';

function assertMySql() {
  if (!isDatabaseProviderEnabled()) {
    throw new Error('Backend database belum aktif. Set DB_PROVIDER=mysql atau supabase di environment.');
  }
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertMySql();
    const { id } = await params;
    const booking = await getBookingById(id);

    if (!booking) {
      return NextResponse.json({ error: 'Booking tidak ditemukan.' }, { status: 404 });
    }

    const auth = await requireRole('admin', 'owner', 'guide', 'user');
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    if (auth.user.role === 'user' && booking.userEmail?.toLowerCase() !== auth.user.email.toLowerCase()) {
      return NextResponse.json({ error: 'Akses booking ditolak.' }, { status: 403 });
    }

    // Enrich with userEmergencyContact
    let userEmergencyContact = null;
    if (booking.userEmail) {
      try {
        const u = await getUserByEmail(booking.userEmail);
        if (u && u.emergencyContact) {
          userEmergencyContact = u.emergencyContact;
        }
      } catch { /* ignore */ }
    }

    return NextResponse.json({ booking: { ...booking, userEmergencyContact } });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Gagal mengambil booking.' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertMySql();
    const { id } = await params;
    const existingBooking = await getBookingById(id);
    if (!existingBooking) {
      return NextResponse.json({ error: 'Booking tidak ditemukan.' }, { status: 404 });
    }

    const auth = await requireRole('admin', 'owner', 'guide', 'user');
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();

    let patch: Record<string, unknown> = {};
    if (auth.user.role === 'user') {
      if (existingBooking.userEmail?.toLowerCase() !== auth.user.email.toLowerCase()) {
        return NextResponse.json({ error: 'Akses booking ditolak.' }, { status: 403 });
      }
      patch = {
        report: body?.report,
        reportSubmittedAt: body?.reportSubmittedAt,
      };
    } else {
      patch = {
        status: body?.status,
        paymentStatus: body?.paymentStatus,
        paymentGateway: body?.paymentGateway,
        paymentOrderId: body?.paymentOrderId,
        paymentTransactionId: body?.paymentTransactionId,
        paymentCheckoutUrl: body?.paymentCheckoutUrl,
        guideId: body?.guideId,
        guideName: body?.guideName,
        report: body?.report,
        reportSubmittedAt: body?.reportSubmittedAt,
        reportReply: body?.reportReply,
        reportReplySubmittedAt: body?.reportReplySubmittedAt,
        attendanceCode: body?.attendanceCode,
        attendanceQrImageUrl: body?.attendanceQrImageUrl,
        attendanceScannedAt: body?.attendanceScannedAt,
        attendanceScannedBy: body?.attendanceScannedBy,
        attendanceStatus: body?.attendanceStatus,
        paidAt: body?.paidAt,
        barcodeSentAt: body?.barcodeSentAt,
      };
    }

    const isNewReport = body?.report && body.report !== existingBooking.report;
    const isNewReply = body?.reportReply && body.reportReply !== existingBooking.reportReply;

    const booking = await updateBooking(id, patch);
    if (!booking) {
      return NextResponse.json({ error: 'Booking tidak ditemukan.' }, { status: 404 });
    }

    if (isNewReport && booking.userEmail) {
      const emailHtml = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
          <h2 style="color: #10221f;">Halo, ${booking.userName || 'Peserta'}!</h2>
          <p>Laporan tur Anda untuk <strong>${booking.tourName || 'Tur'}</strong> telah berhasil kami terima.</p>
          <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #98DDCA; border-radius: 4px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #333;">Isi Laporan Anda:</h3>
            <p style="white-space: pre-wrap; color: #555; line-height: 1.6;">${booking.report}</p>
          </div>
          <p>Laporan Anda telah diteruskan ke Owner untuk ditinjau. Kami akan mengirimkan notifikasi kembali segera setelah Owner memberikan balasan.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #888; text-align: center;">BDJ Walking Tour - Siap Menemani Petualangan Anda!</p>
        </div>
      `;
      sendEmail(
        booking.userEmail,
        `[BDJ Walking Tour] Laporan Tur Anda Telah Diterima`,
        emailHtml
      ).catch(err => console.error("Gagal mengirim email laporan ke user:", err));

      // NOTE: notifications otomatis di-sync oleh syncBookingToTables() dari updateBooking()
    }

    // NOTE: notifications untuk report reply juga otomatis di-sync oleh syncBookingToTables()

    if (auth.user.role !== 'user' && (body?.guideId || body?.guideName)) {
      await logAuditEvent({
        action: 'guide_assigned',
        entityType: 'booking',
        entityId: id,
        actorId: body?.assignedById || body?.actorId || null,
        actorRole: body?.assignedByRole || body?.actorRole || 'owner',
        actorName: body?.assignedByName || body?.actorName || 'owner',
        details: {
          guideId: body?.guideId || null,
          guideName: body?.guideName || null,
          status: body?.status || null,
          paymentStatus: body?.paymentStatus || null,
        },
      });

      // NOTE: guide_tour_assignments dan notifications otomatis di-sync oleh
      // syncBookingToTables() yang dipanggil dari updateBooking() di atas
    }

    return NextResponse.json({ booking });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Gagal memperbarui booking.' }, { status: 500 });
  }
}
