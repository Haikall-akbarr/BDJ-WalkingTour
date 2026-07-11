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

    // Get all bookings for this tour
    const allBookings = await listBookings({ tourId });
    
    // Filter paid/settlement bookings
    const validBookings = allBookings.filter(b => 
      b.paymentStatus === 'paid' || 
      b.paymentStatus === 'settlement' || 
      b.status === 'paid' || 
      b.status === 'completed'
    );

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
