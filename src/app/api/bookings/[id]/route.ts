import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { getBookingById, updateBooking } from '@/lib/data-store';
import { isDatabaseProviderEnabled } from '@/lib/database-provider';
import { logAuditEvent } from '@/lib/audit-log';
import { getCurrentSessionUser } from '@/lib/server-auth';
import { sendEmail } from '@/lib/email';
import { getSupabaseAdmin } from '@/lib/supabase';

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

    const user = await getCurrentSessionUser();
    if (user?.role === 'user' && booking.userEmail?.toLowerCase() !== user.email.toLowerCase()) {
      return NextResponse.json({ error: 'Akses booking ditolak.' }, { status: 403 });
    }

    return NextResponse.json({ booking });
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

    const user = await getCurrentSessionUser();
    const body = await request.json();

    let patch: Record<string, unknown> = {};
    if (user?.role === 'user') {
      if (existingBooking.userEmail?.toLowerCase() !== user.email.toLowerCase()) {
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

      // Insert notification: report submitted (notify owner/admin)
      try {
        const admin = getSupabaseAdmin();
        const { data: adminUsers } = await admin.from('users').select('id').in('role', ['owner', 'admin']);
        if (adminUsers && adminUsers.length > 0) {
          const notifs = adminUsers.map((u: any) => ({
            id: randomUUID(),
            recipient_id: u.id,
            type: 'report_submitted',
            title: 'Laporan Tur Baru',
            message: `${booking.userName} mengirim laporan untuk tur ${booking.tourName}.`,
            related_id: id,
            action_url: '/dashboard/owner',
          }));
          await admin.from('notifications').insert(notifs);
        }
      } catch (notifErr) {
        console.error('[booking PATCH] Failed to insert report notification:', notifErr);
      }
    }

    // Insert notification: report reply from owner (notify user)
    if (isNewReply && booking.userEmail) {
      try {
        const admin = getSupabaseAdmin();
        const { data: userData } = await admin.from('users').select('id').eq('email', booking.userEmail).maybeSingle();
        if (userData?.id) {
          await admin.from('notifications').insert({
            id: randomUUID(),
            recipient_id: userData.id,
            type: 'report_reply',
            title: 'Balasan Laporan Tur',
            message: `Laporan Anda untuk ${booking.tourName} telah dibalas oleh Owner: "${booking.reportReply}"`,
            related_id: id,
            action_url: `/payments/success/${id}`,
          });
        }
      } catch (notifErr) {
        console.error('[booking PATCH] Failed to insert reply notification:', notifErr);
      }
    }

    if (user?.role !== 'user' && (body?.guideId || body?.guideName)) {
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

      try {
        const admin = getSupabaseAdmin();
        const { data: guideData } = await admin.from('guides').select('id').eq('user_id', body.guideId).maybeSingle();
        const actualGuideId = guideData?.id || body.guideId;

        // Get the actual tour date from the tours table
        let tourDate = booking.createdAt;
        if (booking.tourId) {
          const { data: tourData } = await admin.from('tours').select('date').eq('id', booking.tourId).maybeSingle();
          if (tourData?.date) {
            tourDate = tourData.date;
          }
        }

        const assignmentNow = new Date().toISOString();

        // Upsert guide_tour_assignments with generated UUID id
        const { error: assignError } = await admin.from('guide_tour_assignments').upsert({
          id: randomUUID(),
          booking_id: id,
          guide_id: actualGuideId,
          tour_date: tourDate,
          pax_count: booking.pax || 1,
          status: 'assigned',
          notes: `Ditugaskan untuk tur ${booking.tourName} (${booking.pax || 1} pax)`,
          assigned_at: assignmentNow,
          accepted_at: assignmentNow,
        }, { onConflict: 'booking_id' });

        if (assignError) {
          console.error('[guide_tour_assignments] Upsert error:', assignError);
        }

        // Insert notification for guide assignment
        const { error: notifError } = await admin.from('notifications').insert({
          id: randomUUID(),
          recipient_id: body.guideId,
          type: 'guide_assignment',
          title: 'Penugasan Tur Baru',
          message: `Anda telah ditugaskan untuk memandu tur ${booking.tourName} (${booking.pax || 1} pax).`,
          related_id: id,
          action_url: '/dashboard/guide'
        });

        if (notifError) {
          console.error('[notifications] Guide assignment notification error:', notifError);
        }
      } catch (err) {
        console.error("Failed to insert assignment or notification:", err);
      }
    }

    return NextResponse.json({ booking });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Gagal memperbarui booking.' }, { status: 500 });
  }
}
