import { NextRequest, NextResponse } from 'next/server';
import { listBookings } from '@/lib/data-store';
import { requireRole } from '@/lib/api-auth-guard';
import { sendWhatsAppAnnouncement } from '@/lib/payment-helpers';

export const runtime = 'nodejs';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireRole('admin', 'owner', 'guide');
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const tourId = params.id;
    const body = await request.json();
    const { message, tourDate } = body;

    if (!message) {
      return NextResponse.json({ error: 'Pesan pengumuman tidak boleh kosong.' }, { status: 400 });
    }

    // Get all bookings (we will filter in memory)
    const allBookings = await listBookings();
    
    // Filter paid/settlement bookings for THIS specific tour
    const validBookings = allBookings.filter(b => {
      const isPaid = b.paymentStatus === 'paid' || b.paymentStatus === 'settlement' || b.status === 'paid' || b.status === 'completed';
      const matchesTour = b.tourId === tourId;
      const matchesGuide = auth.user?.role === 'guide' ? b.guideId === auth.user.id : true;
      
      // If the frontend passed a tourDate, we should strictly match it to avoid broadcasting to past/future schedules
      // Note: tourDate from frontend is usually formatted as DD/MM/YYYY or similar based on toLocaleDateString("id-ID")
      let matchesDate = true;
      if (tourDate && b.createdAt) {
        const bDate = new Date(b.createdAt).toLocaleDateString("id-ID");
        if (bDate !== tourDate && tourDate !== b.tourDate) {
          // If neither creation date nor the tour's package date matches exactly, we exclude it
          // Actually, BDJ WalkingTour groups by package date (tourDate from package) or creation date.
          // In the frontend: group.tourDate = toursDateMap[tId] || new Date(booking.createdAt).toLocaleDateString("id-ID")
          // Let's match against the exact string sent by the frontend
          const frontendMappedDate = b.tourDate || new Date(b.createdAt).toLocaleDateString("id-ID");
          matchesDate = frontendMappedDate === tourDate;
        }
      }

      return isPaid && matchesTour && matchesGuide && matchesDate;
    });

    // If a specific date is provided, filter by that date if possible
    // Note: in BDJ WalkingTour, tour date might be parsed differently, 
    // but we'll extract all unique WhatsApp numbers from the valid bookings.
    // If the system separates them by date, we might need a stricter filter.
    // Assuming guide is broadcasting to the entire assigned group.
    
    const whatsappSet = new Set<string>();
    
    for (const booking of validBookings) {
      if (booking.userWhatsApp) {
        whatsappSet.add(booking.userWhatsApp);
      }
    }

    const whatsappList = Array.from(whatsappSet);

    if (whatsappList.length === 0) {
      return NextResponse.json({ error: 'Tidak ada kontak peserta yang valid untuk dikirimi pesan.' }, { status: 404 });
    }

    const announcementMsg = `*[PENGUMUMAN TOUR]*\n\nPesan dari Pemandu Anda:\n\n${message}`;

    await sendWhatsAppAnnouncement({
      whatsappList,
      message: announcementMsg
    });

    return NextResponse.json({ 
      success: true, 
      count: whatsappList.length,
      message: 'Pengumuman berhasil dikirim.' 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Gagal memproses pengumuman.' }, { status: 500 });
  }
}
