import { NextRequest, NextResponse } from 'next/server';
import { isDatabaseProviderEnabled } from '@/lib/database-provider';
import { getCurrentSessionUser } from '@/lib/server-auth';
import { listBookings } from '@/lib/data-store';
import { getSessionCookieName, hashSessionToken } from '@/lib/auth-session';
import { getSessionByTokenHash, getUserById } from '@/lib/auth-store';

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

    if (booking.reportReply) {
      items.push({
        id: `${booking.id}-report-reply`,
        title: 'Balasan Laporan Tur',
        message: `Laporan Anda untuk ${booking.tourName} telah dibalas oleh Owner: "${booking.reportReply}"`,
        type: 'report_reply',
        createdAt: booking.reportReplySubmittedAt || createdAt,
        actionUrl: baseUrl,
        isRead: false,
      });
    }

    if (booking.report) {
      items.push({
        id: `${booking.id}-report-submitted`,
        title: 'Laporan Tur Terkirim',
        message: `Laporan Anda untuk ${booking.tourName} telah berhasil dikirim ke Owner.`,
        type: 'report_submitted',
        createdAt: booking.reportSubmittedAt || createdAt,
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

export async function GET(request: NextRequest) {
  try {
    if (!isDatabaseProviderEnabled()) {
      console.log('[notifications API] DB not enabled');
      return NextResponse.json({ notifications: [] });
    }

    let user = await getCurrentSessionUser();
    console.log('[notifications API] initial user session:', user);

    if (!user) {
      const token = request.cookies.get(getSessionCookieName())?.value;
      console.log('[notifications API] read token from request cookies:', token ? 'exists' : 'empty');
      if (token) {
        const tokenHash = hashSessionToken(token);
        const session = await getSessionByTokenHash(tokenHash);
        console.log('[notifications API] session found:', session ? 'yes' : 'no');
        if (session && (!session.expiresAt || new Date(session.expiresAt).getTime() > Date.now())) {
          user = await getUserById(session.userId);
          console.log('[notifications API] user found by session:', user ? 'yes' : 'no');
        }
      }
    }

    if (!user) {
      return NextResponse.json({ notifications: [] });
    }

    const isStaff = ['admin', 'owner', 'guide'].includes(user.role);
    const bookings = await listBookings();
    console.log('[notifications API] total bookings found:', bookings.length);
    const visibleBookings = isStaff ? bookings : bookings.filter((booking) => booking.userEmail?.toLowerCase() === user.email.toLowerCase());
    const notifications = buildNotificationsFromBookings(visibleBookings);

    if (user.role === 'user') {
      notifications.unshift({
        id: `${user.id}-welcome`,
        title: 'Selamat Bergabung!',
        message: `Selamat bergabung dengan BDJ Walking Tour, ${user.name || 'Peserta'}! Siapkan cerita lokal terbaik Anda dan jelajahi keindahan Banjarmasin bersama kami.`,
        type: 'welcome',
        createdAt: (user as any).createdAt || new Date().toISOString(),
        actionUrl: '/dashboard/user',
        isRead: false,
      });
    }

    const slicedNotifications = notifications.slice(0, 12);
    console.log('[notifications API] returning notifications count:', slicedNotifications.length);

    return NextResponse.json({
      notifications: slicedNotifications,
      unreadCount: slicedNotifications.length,
    });
  } catch (error: any) {
    console.error('[notifications API] ERROR:', error);
    return NextResponse.json({ error: error?.message || 'Gagal mengambil notifikasi.' }, { status: 500 });
  }
}
