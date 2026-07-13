import { NextRequest, NextResponse } from 'next/server';
import { getBookingById, updateBooking } from '@/lib/data-store';
import { requireRole } from '@/lib/api-auth-guard';
import { sendWhatsAppRefundNotification } from '@/lib/payment-helpers';

export const runtime = 'nodejs';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireRole('admin', 'owner');
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const bookingId = params.id;
    const booking = await getBookingById(bookingId);

    if (!booking) {
      return NextResponse.json({ error: 'Booking tidak ditemukan.' }, { status: 404 });
    }

    if (booking.paymentStatus !== 'refund_requested') {
      return NextResponse.json({ error: 'Booking ini tidak dalam status meminta refund.' }, { status: 400 });
    }

    await updateBooking(bookingId, {
      paymentStatus: 'refunded',
      status: 'cancelled'
    });

    if (booking.userWhatsApp) {
      await sendWhatsAppRefundNotification({
        whatsapp: booking.userWhatsApp,
        name: booking.userName || 'Peserta',
        tourName: booking.tourName || 'Tur',
        totalAmount: Number(booking.grossAmount || 0)
      }).catch(err => console.error("Gagal mengirim WA refund:", err));
    }

    return NextResponse.json({ success: true, message: 'Refund berhasil disetujui.' });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Gagal menyetujui refund.' }, { status: 500 });
  }
}
