import { NextResponse } from 'next/server';
import { isDatabaseProviderEnabled } from '@/lib/database-provider';
import { getCurrentSessionUser } from '@/lib/server-auth';
import { listBookings } from '@/lib/data-store';

export const runtime = 'nodejs';

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  type: string;
  createdAt: string | null;
  actionUrl: string | null;
  isRead: boolean;
};

function buildNotificationsFromBookings(bookings: Awaited<ReturnType<typeof listBookings>>): NotificationItem[] {
  const items: NotificationItem[] = [];

  for (const booking of bookings) {
    const baseUrl = `/payments/success/${booking.id}`;
    const createdAt = booking.updatedAt || booking.createdAt || null;

    if (booking.paymentStatus === 'paid' || booking.status === 'paid') {
      items.push({
        id: `${booking.id}-payment`,
        title: 'Pembayaran diterima',
        message: `${booking.tourName} atas nama ${booking.userName} sudah dibayar. Barcode sedang diproses / sudah dikirim ke email.`,
        type: 'payment_received',
        createdAt: booking.paidAt || createdAt,
        actionUrl: baseUrl,
        isRead: false,
      });
    } else if (booking.paymentStatus === 'pending_payment' || booking.status === 'pending_payment') {
      items.push({
        id: `${booking.id}-pending`,
        title: 'Menunggu pembayaran',
        message: `${booking.tourName} atas nama ${booking.userName} masih menunggu pembayaran.`,
        type: 'payment_pending',
        createdAt,
        actionUrl: baseUrl,
        isRead: false,
      });
    }

    if (booking.barcodeSentAt || booking.attendanceCode) {
      items.push({
        id: `${booking.id}-barcode`,
        title: 'Barcode tersedia',
        message: `Barcode untuk ${booking.tourName} siap dipakai saat check-in.`,
        type: 'barcode_ready',
        createdAt: booking.barcodeSentAt || booking.paidAt || createdAt,
        actionUrl: baseUrl,
        isRead: false,
      });
    }

    if (booking.attendanceScannedAt) {
      items.push({
        id: `${booking.id}-scan`,
        title: 'Peserta sudah absen',
        message: `Peserta ${booking.userName} sudah discan oleh guide pada ${booking.attendanceScannedAt}.`,
        type: 'attendance_scanned',
        createdAt: booking.attendanceScannedAt,
        actionUrl: baseUrl,
        isRead: false,
      });
    }

    if (booking.guideName) {
      items.push({
        id: `${booking.id}-guide`,
        title: 'Guide ditugaskan',
        message: `${booking.guideName} ditugaskan untuk ${booking.tourName}.`,
        type: 'guide_assigned',
        createdAt,
        actionUrl: baseUrl,
        isRead: false,
      });
    }
  }

  return items.sort((a, b) => {
    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return bTime - aTime;
  });
}

export async function GET() {
  try {
    if (!isDatabaseProviderEnabled()) {
      return NextResponse.json({ notifications: [] });
    }

    const user = await getCurrentSessionUser();
    if (!user) {
      return NextResponse.json({ notifications: [] });
    }

    const isStaff = ['admin', 'owner', 'guide'].includes(user.role);
    const bookings = await listBookings();
    const visibleBookings = isStaff ? bookings : bookings.filter((booking) => booking.userEmail?.toLowerCase() === user.email.toLowerCase());
    const notifications = buildNotificationsFromBookings(visibleBookings).slice(0, 12);

    return NextResponse.json({
      notifications,
      unreadCount: notifications.length,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Gagal mengambil notifikasi.' }, { status: 500 });
  }
}
