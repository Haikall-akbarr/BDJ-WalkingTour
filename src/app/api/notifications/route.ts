import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { isDatabaseProviderEnabled } from '@/lib/database-provider';
import { getCurrentSessionUser } from '@/lib/server-auth';
import { listBookings } from '@/lib/data-store';
import { getSessionCookieName, hashSessionToken } from '@/lib/auth-session';
import { getSessionByTokenHash, getUserById } from '@/lib/auth-store';
import { getSupabaseAdmin } from '@/lib/supabase';

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

// Fallback: generate notifications from bookings if DB table is empty
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

async function resolveUser(request: NextRequest) {
  let user = await getCurrentSessionUser();

  if (!user) {
    const token = request.cookies.get(getSessionCookieName())?.value;
    if (token) {
      const tokenHash = hashSessionToken(token);
      const session = await getSessionByTokenHash(tokenHash);
      if (session && (!session.expiresAt || new Date(session.expiresAt).getTime() > Date.now())) {
        user = await getUserById(session.userId);
      }
    }
  }

  return user;
}

export async function GET(request: NextRequest) {
  try {
    if (!isDatabaseProviderEnabled()) {
      return NextResponse.json({ notifications: [] });
    }

    const user = await resolveUser(request);

    if (!user) {
      return NextResponse.json({ notifications: [] });
    }

    // Try reading from the notifications table first
    let dbNotifications: NotificationItem[] = [];
    try {
      const admin = getSupabaseAdmin();
      const { data, error } = await admin
        .from('notifications')
        .select('*')
        .eq('recipient_id', user.id)
        .order('created_at', { ascending: false })
        .limit(30);

      if (!error && data && data.length > 0) {
        dbNotifications = data.map((row: any) => ({
          id: row.id,
          title: row.title,
          message: row.message,
          type: row.type,
          createdAt: row.created_at || null,
          actionUrl: row.action_url || null,
          isRead: Boolean(row.is_read),
        }));
      }
    } catch (dbErr) {
      console.error('[notifications API] DB query failed, falling back to bookings:', dbErr);
    }

    // If we got notifications from DB, use them
    if (dbNotifications.length > 0) {
      // Add welcome notification for user role
      if (user.role === 'user') {
        const hasWelcome = dbNotifications.some(n => n.type === 'welcome');
        if (!hasWelcome) {
          dbNotifications.push({
            id: `${user.id}-welcome`,
            title: 'Selamat Bergabung!',
            message: `Selamat bergabung dengan BDJ Walking Tour, ${user.name || 'Peserta'}! Siapkan cerita lokal terbaik Anda dan jelajahi keindahan Banjarmasin bersama kami.`,
            type: 'welcome',
            createdAt: (user as any).createdAt || new Date().toISOString(),
            actionUrl: '/dashboard/user',
            isRead: false,
          });
        }
      }

      const sliced = dbNotifications.slice(0, 20);
      const unreadCount = sliced.filter(n => !n.isRead).length;

      return NextResponse.json({
        notifications: sliced,
        unreadCount,
        source: 'database',
      });
    }

    // Fallback: generate notifications from bookings (backward-compatible)
    const isStaff = ['admin', 'owner', 'guide'].includes(user.role);
    const bookings = await listBookings();
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

    return NextResponse.json({
      notifications: slicedNotifications,
      unreadCount: slicedNotifications.length,
      source: 'bookings_fallback',
    });
  } catch (error: any) {
    console.error('[notifications API] ERROR:', error);
    return NextResponse.json({ error: error?.message || 'Gagal mengambil notifikasi.' }, { status: 500 });
  }
}

// PATCH: Mark notification(s) as read
export async function PATCH(request: NextRequest) {
  try {
    if (!isDatabaseProviderEnabled()) {
      return NextResponse.json({ ok: true });
    }

    const user = await resolveUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const notificationId = body?.id;
    const notificationIds = body?.ids;

    const admin = getSupabaseAdmin();

    if (notificationId) {
      // Mark single notification as read
      const { error } = await admin
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId)
        .eq('recipient_id', user.id);

      if (error) {
        console.error('[notifications PATCH] Error:', error);
      }
    } else if (Array.isArray(notificationIds) && notificationIds.length > 0) {
      // Mark multiple notifications as read
      const { error } = await admin
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .in('id', notificationIds)
        .eq('recipient_id', user.id);

      if (error) {
        console.error('[notifications PATCH] Error:', error);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Gagal memperbarui notifikasi.' }, { status: 500 });
  }
}

// DELETE: Remove notification
export async function DELETE(request: NextRequest) {
  try {
    if (!isDatabaseProviderEnabled()) {
      return NextResponse.json({ ok: true });
    }

    const user = await resolveUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const notificationId = searchParams.get('id');

    if (!notificationId) {
      return NextResponse.json({ error: 'id wajib diisi.' }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    const { error } = await admin
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('recipient_id', user.id);

    if (error) {
      console.error('[notifications DELETE] Error:', error);
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Gagal menghapus notifikasi.' }, { status: 500 });
  }
}
