import { NextRequest, NextResponse } from 'next/server';
import { getBookingById, updateBooking } from '@/lib/data-store';
import { getCurrentSessionUser } from '@/lib/server-auth';

export const runtime = 'nodejs';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Sesi tidak valid.' }, { status: 401 });
    }

    const bookingId = params.id;
    const body = await request.json();
    const { bankName, accountNumber, accountName } = body;

    if (!bankName || !accountNumber || !accountName) {
      return NextResponse.json({ error: 'Data bank tidak lengkap.' }, { status: 400 });
    }

    const booking = await getBookingById(bookingId);
    if (!booking) {
      return NextResponse.json({ error: 'Booking tidak ditemukan.' }, { status: 404 });
    }

    // Hanya user yang memiliki booking atau admin/owner yang bisa request refund
    if (user.role === 'user' && booking.userEmail?.toLowerCase() !== user.email.toLowerCase()) {
      return NextResponse.json({ error: 'Anda tidak berhak membatalkan booking ini.' }, { status: 403 });
    }

    if (booking.paymentStatus !== 'paid' && booking.paymentStatus !== 'settlement') {
      return NextResponse.json({ error: 'Hanya pesanan yang sudah dibayar yang bisa di-refund.' }, { status: 400 });
    }

    // Simpan data bank di paymentCheckoutUrl (karena sudah tidak dipakai setelah paid)
    const refundData = JSON.stringify({ bankName, accountNumber, accountName });

    await updateBooking(bookingId, {
      paymentStatus: 'refund_requested',
      paymentCheckoutUrl: refundData
    });

    return NextResponse.json({ success: true, message: 'Permintaan refund berhasil dikirim.' });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Gagal memproses refund.' }, { status: 500 });
  }
}
