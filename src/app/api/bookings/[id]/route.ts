import { NextRequest, NextResponse } from 'next/server';
import { getBookingById, updateBooking } from '@/lib/mysql-store';
import { isMySqlEnabled } from '@/lib/mysql';

export const runtime = 'nodejs';

function assertMySql() {
  if (!isMySqlEnabled()) {
    throw new Error('MySQL backend belum aktif. Set DB_PROVIDER=mysql di environment.');
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

    return NextResponse.json({ booking });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Gagal mengambil booking.' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertMySql();
    const { id } = await params;
    const body = await request.json();

    const patch: Record<string, unknown> = {
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
      attendanceCode: body?.attendanceCode,
      attendanceQrImageUrl: body?.attendanceQrImageUrl,
      attendanceScannedAt: body?.attendanceScannedAt,
      attendanceScannedBy: body?.attendanceScannedBy,
      attendanceStatus: body?.attendanceStatus,
      paidAt: body?.paidAt,
      barcodeSentAt: body?.barcodeSentAt,
    };

    const booking = await updateBooking(id, patch);
    if (!booking) {
      return NextResponse.json({ error: 'Booking tidak ditemukan.' }, { status: 404 });
    }

    return NextResponse.json({ booking });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Gagal memperbarui booking.' }, { status: 500 });
  }
}
