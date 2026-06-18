import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { isDatabaseProviderEnabled } from '@/lib/database-provider';
import { getBookingById, updateBooking } from '@/lib/data-store';
import { buildAttendanceQrUrl, generateAttendanceCode, sendAttendanceEmail, verifyMidtransSignature } from '@/lib/payment-helpers';
import { getSupabaseAdmin } from '@/lib/supabase';

export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json({ ok: true, message: 'Webhook endpoint is ready' });
}

export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

export async function PUT() {
  return NextResponse.json({ ok: true, message: 'Webhook endpoint is ready' });
}

export async function PATCH() {
  return NextResponse.json({ ok: true, message: 'Webhook endpoint is ready' });
}

export async function DELETE() {
  return NextResponse.json({ ok: true, message: 'Webhook endpoint is ready' });
}

export async function POST(request: NextRequest) {
  try {
    if (!isDatabaseProviderEnabled()) {
      return NextResponse.json({ error: 'Backend database wajib aktif untuk webhook ini.' }, { status: 400 });
    }

    const payload = await request.json();
    const orderId = payload?.order_id;
    const statusCode = payload?.status_code;
    const grossAmount = payload?.gross_amount;
    const signatureKey = payload?.signature_key;
    const transactionStatus = payload?.transaction_status;
    const transactionId = payload?.transaction_id;

    if (!orderId || !statusCode || !grossAmount || !signatureKey) {
      return NextResponse.json({ error: 'Payload webhook tidak lengkap.' }, { status: 400 });
    }

    if (!verifyMidtransSignature({ orderId, statusCode, grossAmount, signatureKey })) {
      return NextResponse.json({ error: 'Signature webhook tidak valid.' }, { status: 401 });
    }

    if (['settlement', 'capture'].includes(transactionStatus)) {
      const bookingData = await getBookingById(orderId);

      if (!bookingData) {
        return NextResponse.json({ error: 'Booking tidak ditemukan.' }, { status: 404 });
      }

      const attendanceCode = bookingData.attendanceCode || generateAttendanceCode(orderId);
      const qrImageUrl = bookingData.attendanceQrImageUrl || buildAttendanceQrUrl(attendanceCode);

      await updateBooking(orderId, {
        paymentStatus: 'paid',
        status: 'paid',
        paymentGateway: 'midtrans',
        paymentTransactionId: transactionId || payload?.transaction_id || null,
        attendanceCode,
        attendanceQrImageUrl: qrImageUrl,
        paidAt: new Date().toISOString(),
      });

      if (bookingData.userEmail) {
        try {
          await sendAttendanceEmail({
            to: bookingData.userEmail,
            name: bookingData.userName,
            tourName: bookingData.tourName,
            attendanceCode,
            qrImageUrl,
            orderId,
            totalAmount: Number(grossAmount),
          });

          await updateBooking(orderId, {
            barcodeSentAt: new Date().toISOString(),
          });
          
          try {
            const admin = getSupabaseAdmin();
            const { data: userData } = await admin.from('users').select('id').eq('email', bookingData.userEmail).maybeSingle();
            if (userData?.id) {
              // Notification: payment success
              await admin.from('notifications').insert({
                id: randomUUID(),
                recipient_id: userData.id,
                type: 'payment_success',
                title: 'Pembayaran Berhasil',
                message: `Pembayaran untuk tur ${bookingData.tourName} berhasil. Barcode absensi Anda sudah siap.`,
                related_id: orderId,
                action_url: `/payments/success/${orderId}`
              });

              // Notification: barcode ready
              await admin.from('notifications').insert({
                id: randomUUID(),
                recipient_id: userData.id,
                type: 'barcode_ready',
                title: 'Barcode Tersedia',
                message: `Barcode untuk tur ${bookingData.tourName} siap dipakai saat check-in.`,
                related_id: orderId,
                action_url: `/payments/success/${orderId}`
              });
            }

            // Notify owner/admin about payment
            const { data: adminUsers } = await admin.from('users').select('id').in('role', ['owner', 'admin']);
            if (adminUsers && adminUsers.length > 0) {
              const adminNotifs = adminUsers.map((u: any) => ({
                id: randomUUID(),
                recipient_id: u.id,
                type: 'payment_received',
                title: 'Pembayaran Diterima',
                message: `${bookingData.userName} telah membayar tur ${bookingData.tourName} (Rp ${Number(grossAmount).toLocaleString('id-ID')}).`,
                related_id: orderId,
                action_url: '/dashboard/owner',
              }));
              await admin.from('notifications').insert(adminNotifs);
            }
          } catch (notifErr) {
            console.error('[payments/webhook] Failed to insert notification:', notifErr);
          }
        } catch (emailError) {
          console.error('[payments/webhook] Failed to send email:', emailError);
        }
      }
    } else if (['deny', 'cancel', 'expire'].includes(transactionStatus)) {
      const bookingData = await getBookingById(orderId);

      await updateBooking(orderId, {
        paymentStatus: transactionStatus,
        status: transactionStatus,
      });

      // Notify user about failed/cancelled/expired payment
      if (bookingData?.userEmail) {
        try {
          const admin = getSupabaseAdmin();
          const { data: userData } = await admin.from('users').select('id').eq('email', bookingData.userEmail).maybeSingle();
          if (userData?.id) {
            const statusLabels: Record<string, string> = {
              deny: 'ditolak',
              cancel: 'dibatalkan',
              expire: 'kedaluwarsa',
            };
            await admin.from('notifications').insert({
              id: randomUUID(),
              recipient_id: userData.id,
              type: 'payment_failed',
              title: `Pembayaran ${statusLabels[transactionStatus] || transactionStatus}`,
              message: `Pembayaran untuk tur ${bookingData.tourName} telah ${statusLabels[transactionStatus] || transactionStatus}. Silakan coba lagi.`,
              related_id: orderId,
              action_url: `/payments/success/${orderId}`
            });
          }
        } catch (notifErr) {
          console.error('[payments/webhook] Failed to insert failure notification:', notifErr);
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Webhook processing failed.' }, { status: 500 });
  }
}
