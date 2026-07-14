import { randomUUID } from 'crypto';
import { getSupabaseAdmin } from '@/lib/supabase';

type AnyRow = Record<string, any>;

function toIso(value: Date | string | null | undefined) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function mapTour(row: AnyRow) {
  return {
    id: row.id,
    name: row.name,
    price: Number(row.price || 0),
    priceHemat: row.price_hemat != null ? Number(row.price_hemat) : null,
    priceRegulerDesc: row.price_reguler_desc || '',
    priceHematDesc: row.price_hemat_desc || '',
    date: row.date || '',
    description: row.description || '',
    distance: row.distance || '3 KM',
    duration: row.duration || '2 Jam',
    imageUrl: row.image_url || '',
    imageHint: row.image_filename || '',
    descriptionFull: row.description_full || '',
    historyCulture: row.history_culture || '',
    historyHighlights: row.history_highlights || '[]',
    routeDetail: row.route_detail || '',
    routeMapUrl: row.route_map_url || '',
    poiList: row.poi_list || '[]',
    maxPax: row.max_pax != null ? Number(row.max_pax) : null,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

async function loadTourImages(tourIds: string[]) {
  if (tourIds.length === 0) return new Map<string, AnyRow[]>();

  const admin = getSupabaseAdmin();
  const { data, error } = await admin.from('tour_images').select('*').in('tour_id', tourIds);

  if (error || !data) {
    return new Map<string, AnyRow[]>();
  }

  const grouped = new Map<string, AnyRow[]>();
  for (const row of data) {
    const tourId = String(row.tour_id);
    const list = grouped.get(tourId) || [];
    list.push(row);
    grouped.set(tourId, list);
  }

  return grouped;
}

function withTourImage(row: AnyRow, images: AnyRow[] | undefined) {
  const coverImage = images?.find((item) => Boolean(item.is_cover)) || images?.[0] || null;
  return {
    ...mapTour(row),
    imageUrl: coverImage?.url || '',
    imageHint: coverImage?.filename || '',
    images: images ? images.map(img => ({
      id: img.id,
      url: img.url,
      filename: img.filename,
      isCover: Boolean(img.is_cover)
    })) : []
  };
}

function mapBooking(row: AnyRow) {
  return {
    id: row.id,
    userName: row.user_name,
    userWhatsApp: row.user_whatsapp,
    userEmail: row.user_email || '',
    domicile: row.domicile,
    customDomicile: row.custom_domicile || '',
    tourId: row.tour_id,
    tourName: row.tour_name,
    pax: Number(row.pax || 0),
    pricePerPax: Number(row.price_per_pax || 0),
    grossAmount: Number(row.gross_amount || 0),
    status: row.status,
    paymentStatus: row.payment_status,
    paymentGateway: row.payment_gateway,
    paymentOrderId: row.payment_order_id,
    paymentTransactionId: row.payment_transaction_id,
    paymentCheckoutUrl: row.payment_checkout_url,
    guideId: row.guide_id,
    guideName: row.guide_name,
    report: row.report,
    reportSubmittedAt: toIso(row.report_submitted_at),
    reportReply: row.report_reply,
    reportReplySubmittedAt: toIso(row.report_reply_submitted_at),
    attendanceCode: row.attendance_code,
    attendanceQrImageUrl: row.attendance_qr_image_url,
    attendanceScannedAt: toIso(row.attendance_scanned_at),
    attendanceScannedBy: row.attendance_scanned_by,
    attendanceStatus: row.attendance_status,
    paidAt: toIso(row.paid_at),
    barcodeSentAt: toIso(row.barcode_sent_at),
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
    participantNames: row.participant_names || '',
  };
}

function normalizeBookingValue(key: string, value: unknown) {
  if (key === 'pax' || key === 'pricePerPax' || key === 'grossAmount') {
    return Number(value || 0);
  }

  if (key === 'attendanceScannedAt' || key === 'paidAt' || key === 'barcodeSentAt' || key === 'reportSubmittedAt' || key === 'reportReplySubmittedAt') {
    if (!value) return null;
    return value instanceof Date ? value.toISOString() : new Date(String(value)).toISOString();
  }

  return value ?? null;
}

function bookingPatchToRow(patch: Record<string, unknown>) {
  const map: Record<string, string> = {
    userName: 'user_name',
    userWhatsApp: 'user_whatsapp',
    userEmail: 'user_email',
    domicile: 'domicile',
    customDomicile: 'custom_domicile',
    tourId: 'tour_id',
    tourName: 'tour_name',
    pax: 'pax',
    pricePerPax: 'price_per_pax',
    grossAmount: 'gross_amount',
    status: 'status',
    paymentStatus: 'payment_status',
    paymentGateway: 'payment_gateway',
    paymentOrderId: 'payment_order_id',
    paymentTransactionId: 'payment_transaction_id',
    paymentCheckoutUrl: 'payment_checkout_url',
    guideId: 'guide_id',
    guideName: 'guide_name',
    report: 'report',
    reportSubmittedAt: 'report_submitted_at',
    reportReply: 'report_reply',
    reportReplySubmittedAt: 'report_reply_submitted_at',
    attendanceCode: 'attendance_code',
    attendanceQrImageUrl: 'attendance_qr_image_url',
    attendanceScannedAt: 'attendance_scanned_at',
    attendanceScannedBy: 'attendance_scanned_by',
    attendanceStatus: 'attendance_status',
    paidAt: 'paid_at',
    barcodeSentAt: 'barcode_sent_at',
    participantNames: 'participant_names',
  };

  return Object.entries(patch).reduce<Record<string, unknown>>((accumulator, [key, value]) => {
    const column = map[key];
    if (!column || typeof value === 'undefined') {
      return accumulator;
    }

    accumulator[column] = normalizeBookingValue(key, value);
    return accumulator;
  }, {});
}

function mapUser(row: AnyRow) {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    passwordHash: row.password_hash,
    isActive: Boolean(row.is_active),
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

export async function listTours() {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin.from('tours').select('*');

  if (error) throw error;
  const rows = data || [];
  const imagesMap = await loadTourImages(rows.map((row) => String(row.id)));

  return rows
    .map((row) => withTourImage(row, imagesMap.get(String(row.id))))
    .sort((left, right) => left.name.localeCompare(right.name));
}

export async function getTourById(id: string) {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin.from('tours').select('*').eq('id', id).maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const imagesMap = await loadTourImages([id]);
  return withTourImage(data, imagesMap.get(id));
}

export async function createTour(input: {
  name: string;
  price: number;
  priceHemat?: number | null;
  priceRegulerDesc?: string | null;
  priceHematDesc?: string | null;
  date?: string;
  description?: string;
  distance?: string;
  duration?: string;
  descriptionFull?: string;
  historyCulture?: string;
  historyHighlights?: string;
  routeDetail?: string;
  routeMapUrl?: string;
  poiList?: string;
  maxPax?: number;
}) {
  const admin = getSupabaseAdmin();
  const row = {
    id: randomUUID(),
    name: input.name,
    price: Number(input.price || 0),
    price_hemat: input.priceHemat != null ? Number(input.priceHemat) : null,
    price_reguler_desc: input.priceRegulerDesc || null,
    price_hemat_desc: input.priceHematDesc || null,
    date: input.date || null,
    description: input.description || null,
    distance: input.distance || '3 KM',
    duration: input.duration || '2 Jam',
    description_full: input.descriptionFull || null,
    history_culture: input.historyCulture || null,
    history_highlights: input.historyHighlights || null,
    route_detail: input.routeDetail || null,
    route_map_url: input.routeMapUrl || null,
    poi_list: input.poiList || null,
    max_pax: input.maxPax || null,
  };

  const { data, error } = await admin.from('tours').insert(row).select('*').single();
  if (error) throw error;
  
  // VERIFICATION: Check if price_hemat was silently ignored by Supabase (PostgREST schema cache issue)
  if ('price_hemat' in row && row.price_hemat != null && data.price_hemat === undefined) {
    throw new Error("Gagal menyimpan Harga Hemat. Kolom price_hemat tidak terdeteksi. Silakan jalankan: NOTIFY pgrst, 'reload schema'; di Supabase SQL Editor.");
  }
  if ('max_pax' in row && row.max_pax != null && data.max_pax === undefined) {
    throw new Error("Gagal menyimpan Maksimal Pax. Kolom max_pax tidak terdeteksi. Silakan jalankan: NOTIFY pgrst, 'reload schema'; di Supabase SQL Editor.");
  }

  return mapTour(data);
}

export async function updateTour(
  id: string,
  input: Partial<{
    name: string;
    price: number;
    priceHemat: number | null;
    priceRegulerDesc: string | null;
    priceHematDesc: string | null;
    date: string;
    description: string;
    distance: string;
    duration: string;
    descriptionFull: string;
    historyCulture: string;
    historyHighlights: string;
    routeDetail: string;
    routeMapUrl: string;
    poiList: string;
    maxPax: number;
  }>
) {
  const admin = getSupabaseAdmin();
  const patch: Record<string, unknown> = {};

  if (typeof input.name !== 'undefined') patch.name = input.name;
  if (typeof input.price !== 'undefined') patch.price = Number(input.price || 0);
  if (typeof input.priceHemat !== 'undefined') patch.price_hemat = input.priceHemat != null ? Number(input.priceHemat) : null;
  if (typeof input.priceRegulerDesc !== 'undefined') patch.price_reguler_desc = input.priceRegulerDesc || null;
  if (typeof input.priceHematDesc !== 'undefined') patch.price_hemat_desc = input.priceHematDesc || null;
  if (typeof input.date !== 'undefined') patch.date = input.date || null;
  if (typeof input.description !== 'undefined') patch.description = input.description || null;
  if (typeof input.distance !== 'undefined') patch.distance = input.distance || null;
  if (typeof input.duration !== 'undefined') patch.duration = input.duration || null;
  if (typeof input.descriptionFull !== 'undefined') patch.description_full = input.descriptionFull || null;
  if (typeof input.historyCulture !== 'undefined') patch.history_culture = input.historyCulture || null;
  if (typeof input.historyHighlights !== 'undefined') patch.history_highlights = input.historyHighlights || null;
  if (typeof input.routeDetail !== 'undefined') patch.route_detail = input.routeDetail || null;
  if (typeof input.routeMapUrl !== 'undefined') patch.route_map_url = input.routeMapUrl || null;
  if (typeof input.poiList !== 'undefined') patch.poi_list = input.poiList || null;
  if (typeof input.maxPax !== 'undefined') patch.max_pax = input.maxPax != null ? Number(input.maxPax) : null;

  if (Object.keys(patch).length === 0) {
    return getTourById(id);
  }

  patch.updated_at = new Date().toISOString();

  console.log('updateTour patch payload:', patch);

  const { data, error } = await admin.from('tours').update(patch).eq('id', id).select('*').maybeSingle();

  if (error) {
    console.error('Error updating tour in Supabase:', error);
    throw new Error(error.message);
  }

  if (!data) return null;

  console.log('[updateTour] Supabase returned data:', JSON.stringify({
    price: data.price,
    price_hemat: data.price_hemat,
    price_reguler_desc: data.price_reguler_desc,
    price_hemat_desc: data.price_hemat_desc,
    max_pax: data.max_pax,
  }));

  // VERIFICATION: Check if price_hemat or descriptions were silently ignored by Supabase (PostgREST schema cache issue)
  if ('price_hemat' in patch && data.price_hemat === undefined) {
    throw new Error("Gagal menyimpan Harga Hemat. Kolom price_hemat tidak terdeteksi. Silakan jalankan: NOTIFY pgrst, 'reload schema'; di Supabase SQL Editor.");
  }
  if ('price_reguler_desc' in patch && data.price_reguler_desc === undefined) {
    throw new Error("Gagal menyimpan Deskripsi. Kolom price_reguler_desc tidak terdeteksi. Silakan jalankan: NOTIFY pgrst, 'reload schema'; di Supabase SQL Editor.");
  }
  if ('max_pax' in patch && patch.max_pax != null && data.max_pax === undefined) {
    throw new Error("Gagal menyimpan Maksimal Pax. Kolom max_pax tidak terdeteksi. Silakan jalankan: NOTIFY pgrst, 'reload schema'; di Supabase SQL Editor.");
  }

  return mapTour(data);
}

export async function deleteTour(id: string) {
  const admin = getSupabaseAdmin();
  const { error } = await admin.from('tours').delete().eq('id', id);
  if (error) throw error;
  return true;
}

export async function listBookings(params?: { status?: string; paymentStatus?: string; guideId?: string; unassigned?: boolean }) {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin.from('bookings').select('*');

  if (error) throw error;

  const rows = (data || []).filter((row) => {
    if (params?.status) {
      if (params.status === 'pending') {
        if (!['pending', 'pending_payment'].includes(String(row.status))) return false;
      } else if (String(row.status) !== params.status) {
        return false;
      }
    }

    if (params?.paymentStatus) {
      if (String(row.payment_status) !== params.paymentStatus && String(row.status) !== params.paymentStatus) {
        return false;
      }
    }

    if (params?.unassigned && row.guide_id != null) {
      return false;
    }

    if (params?.guideId && String(row.guide_id) !== params.guideId) {
      return false;
    }

    return true;
  });

  return rows.sort((left, right) => String(right.created_at || '').localeCompare(String(left.created_at || ''))).map(mapBooking);
}

export async function getBookingById(id: string) {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin.from('bookings').select('*').eq('id', id).maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return mapBooking(data);
}

export async function getBookingByAttendanceCode(attendanceCode: string) {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin.from('bookings').select('*').eq('attendance_code', attendanceCode).maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return mapBooking(data);
}

export async function createBooking(input: {
  id?: string;
  userName: string;
  userWhatsApp: string;
  userEmail: string;
  domicile: string;
  customDomicile?: string;
  tourId: string;
  tourName: string;
  pax: number;
  pricePerPax: number;
  grossAmount: number;
  status: string;
  paymentStatus: string;
  paymentGateway: string;
  paymentOrderId?: string | null;
  paymentTransactionId?: string | null;
  paymentCheckoutUrl?: string | null;
  attendanceCode?: string | null;
  attendanceQrImageUrl?: string | null;
  attendanceScannedAt?: string | null;
  attendanceScannedBy?: string | null;
  attendanceStatus?: string | null;
  paidAt?: string | null;
  barcodeSentAt?: string | null;
  participantNames?: string | null;
}) {
  const admin = getSupabaseAdmin();
  const id = input.id || randomUUID();
  const row = {
    id,
    user_name: input.userName,
    user_whatsapp: input.userWhatsApp,
    user_email: input.userEmail || null,
    domicile: input.domicile,
    custom_domicile: input.customDomicile || null,
    tour_id: input.tourId,
    tour_name: input.tourName,
    pax: Number(input.pax || 0),
    price_per_pax: Number(input.pricePerPax || 0),
    gross_amount: Number(input.grossAmount || 0),
    status: input.status,
    payment_status: input.paymentStatus,
    payment_gateway: input.paymentGateway,
    payment_order_id: input.paymentOrderId || null,
    payment_transaction_id: input.paymentTransactionId || null,
    payment_checkout_url: input.paymentCheckoutUrl || null,
    guide_id: null,
    guide_name: null,
    report: null,
    report_submitted_at: null,
    attendance_code: input.attendanceCode || null,
    attendance_qr_image_url: input.attendanceQrImageUrl || null,
    attendance_scanned_at: input.attendanceScannedAt || null,
    attendance_scanned_by: input.attendanceScannedBy || null,
    attendance_status: input.attendanceStatus || null,
    paid_at: input.paidAt || null,
    barcode_sent_at: input.barcodeSentAt || null,
    participant_names: input.participantNames || null,
  };

  const { data, error } = await admin.from('bookings').insert(row).select('*').single();
  if (error) throw error;

  // Auto-sync ke 3 tabel
  syncBookingToTables(data).catch(err => console.error('[syncBookingToTables] Error:', err));

  return mapBooking(data);
}

export async function updateBooking(id: string, patch: Record<string, unknown>) {
  const admin = getSupabaseAdmin();
  const rowPatch = bookingPatchToRow(patch);

  if (Object.keys(rowPatch).length === 0) {
    return getBookingById(id);
  }

  rowPatch.updated_at = new Date().toISOString();

  const { data, error } = await admin.from('bookings').update(rowPatch).eq('id', id).select('*').maybeSingle();
  if (error) throw error;
  if (!data) return null;

  // Auto-sync ke 3 tabel setelah setiap update booking
  syncBookingToTables(data).catch(err => console.error('[syncBookingToTables] Error:', err));

  return mapBooking(data);
}

export async function deleteBookingsByTourId(tourId: string) {
  const admin = getSupabaseAdmin();
  const { error } = await admin.from('bookings').delete().eq('tour_id', tourId);
  if (error) throw error;
  return true;
}

// ============================================================
// AUTO-SYNC: barcode_scans, guide_tour_assignments, notifications
// Dipanggil otomatis setiap kali booking di-update
// ============================================================

const MONTHS_ID: Record<string, number> = {
  januari: 0, februari: 1, maret: 2, april: 3, mei: 4, juni: 5,
  juli: 6, agustus: 7, september: 8, oktober: 9, november: 10, desember: 11,
};

function parseDate(dateStr: string | null | undefined): string {
  if (!dateStr) return new Date().toISOString();
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) return d.toISOString();
  // Parse Indonesian format like "17 Januari 2026"
  const parts = dateStr.toLowerCase().replace(/,/g, '').trim().split(/\s+/)
    .filter(p => !['senin','selasa','rabu','kamis','jumat','sabtu','minggu'].includes(p));
  if (parts.length >= 3) {
    const day = parseInt(parts[0]);
    const month = MONTHS_ID[parts[1]];
    const year = parseInt(parts[2]);
    if (!isNaN(day) && month !== undefined && !isNaN(year)) {
      return new Date(year, month, day, 8, 0, 0).toISOString();
    }
  }
  return new Date().toISOString();
}

async function resolveGuideId(admin: any, guideUserId: string | null): Promise<string | null> {
  if (!guideUserId) {
    // Fallback: ambil guide pertama yang ada
    const { data: fallback } = await admin.from('guides').select('id').limit(1).maybeSingle();
    return fallback?.id || null;
  }
  // Cari di guides table by user_id
  const { data } = await admin.from('guides').select('id').eq('user_id', guideUserId).maybeSingle();
  if (data?.id) return data.id;
  // Cari langsung by id (mungkin sudah UUID)
  const { data: d2 } = await admin.from('guides').select('id').eq('id', guideUserId).maybeSingle();
  if (d2?.id) return d2.id;
  // Auto-create guide entry jika belum ada
  const { data: userData } = await admin.from('users').select('id, name, email').eq('id', guideUserId).maybeSingle();
  if (userData) {
    const newGuideId = randomUUID();
    await admin.from('guides').insert({
      id: newGuideId,
      user_id: userData.id,
      name: userData.name || 'Guide',
      email: userData.email || '',
      is_active: true,
    });
    return newGuideId;
  }
  // Final fallback: ambil guide pertama yang ada
  const { data: fallback } = await admin.from('guides').select('id').limit(1).maybeSingle();
  return fallback?.id || null;
}

async function findRecipientId(admin: any, email: string | null): Promise<string | null> {
  if (!email) return null;
  const { data } = await admin.from('users').select('id').eq('email', email).maybeSingle();
  return data?.id || null;
}

export async function syncBookingToTables(bookingRow: AnyRow) {
  try {
    const admin = getSupabaseAdmin();
    const bookingId = bookingRow.id;

    // --- 1. SYNC barcode_scans ---
    if (bookingRow.attendance_scanned_at && bookingRow.attendance_code) {
      const { data: existingScan } = await admin
        .from('barcode_scans')
        .select('id')
        .eq('booking_id', bookingId)
        .maybeSingle();

      if (!existingScan) {
        const guideId = await resolveGuideId(admin, bookingRow.guide_id || bookingRow.attendance_scanned_by);
        if (guideId) {
          const { error } = await admin.from('barcode_scans').insert({
            id: randomUUID(),
            booking_id: bookingId,
            guide_id: guideId,
            attendance_code: bookingRow.attendance_code,
            scanned_at: bookingRow.attendance_scanned_at,
            location: 'Banjarmasin',
            notes: `Scan absensi: ${bookingRow.user_name || '-'} - ${bookingRow.tour_name || '-'}`,
          });
          if (error) console.error('[sync barcode_scans]', error.message);
          else console.log(`[sync barcode_scans] ✅ ${bookingId}`);
        }
      }
    }

    // --- 2. SYNC guide_tour_assignments ---
    if (bookingRow.guide_id) {
      const guideId = await resolveGuideId(admin, bookingRow.guide_id);
      if (guideId) {
        const { data: existingAssign } = await admin
          .from('guide_tour_assignments')
          .select('id')
          .eq('booking_id', bookingId)
          .maybeSingle();

        // Get tour date
        let tourDate = bookingRow.created_at;
        if (bookingRow.tour_id) {
          const { data: tourData } = await admin.from('tours').select('date').eq('id', bookingRow.tour_id).maybeSingle();
          if (tourData?.date) tourDate = parseDate(tourData.date);
        }

        if (!existingAssign) {
          const { error } = await admin.from('guide_tour_assignments').insert({
            id: randomUUID(),
            booking_id: bookingId,
            guide_id: guideId,
            tour_date: tourDate,
            pax_count: bookingRow.pax || 1,
            status: 'assigned',
            notes: `Ditugaskan untuk tur ${bookingRow.tour_name} (${bookingRow.pax || 1} pax)`,
            assigned_at: new Date().toISOString(),
            accepted_at: new Date().toISOString(),
          });
          if (error) console.error('[sync guide_tour_assignments]', error.message);
          else console.log(`[sync guide_tour_assignments] ✅ ${bookingId}`);
        } else {
          // Update existing assignment
          await admin.from('guide_tour_assignments').update({
            guide_id: guideId,
            tour_date: tourDate,
            pax_count: bookingRow.pax || 1,
            status: 'assigned',
          }).eq('booking_id', bookingId);
        }
      }
    }

    // --- 3. SYNC notifications ---
    const recipientId = await findRecipientId(admin, bookingRow.user_email);
    const { data: adminUsers } = await admin.from('users').select('id').in('role', ['owner', 'admin']);
    const ownerIds = (adminUsers || []).map((u: any) => u.id);

    // Payment success notification
    if ((bookingRow.payment_status === 'paid' || bookingRow.status === 'paid') && recipientId) {
      const { data: existingNotif } = await admin
        .from('notifications')
        .select('id')
        .eq('related_id', bookingId)
        .eq('recipient_id', recipientId)
        .eq('type', 'payment_success')
        .maybeSingle();

      if (!existingNotif) {
        await admin.from('notifications').insert({
          id: randomUUID(),
          recipient_id: recipientId,
          type: 'payment_success',
          title: 'Pembayaran Berhasil',
          message: `Pembayaran untuk tur ${bookingRow.tour_name} berhasil. Barcode absensi Anda sudah siap.`,
          related_id: bookingId,
          action_url: `/payments/success/${bookingId}`,
          created_at: bookingRow.paid_at || bookingRow.updated_at || new Date().toISOString(),
        });
      }
    }

    // Barcode ready notification
    if ((bookingRow.barcode_sent_at || bookingRow.attendance_code) && recipientId) {
      const { data: existingNotif } = await admin
        .from('notifications')
        .select('id')
        .eq('related_id', bookingId)
        .eq('recipient_id', recipientId)
        .eq('type', 'barcode_ready')
        .maybeSingle();

      if (!existingNotif) {
        await admin.from('notifications').insert({
          id: randomUUID(),
          recipient_id: recipientId,
          type: 'barcode_ready',
          title: 'Barcode Tersedia',
          message: `Barcode untuk ${bookingRow.tour_name} siap dipakai saat check-in.`,
          related_id: bookingId,
          action_url: `/payments/success/${bookingId}`,
          created_at: bookingRow.barcode_sent_at || bookingRow.paid_at || new Date().toISOString(),
        });
      }
    }

    // Attendance scanned notification
    if (bookingRow.attendance_scanned_at && recipientId) {
      const { data: existingNotif } = await admin
        .from('notifications')
        .select('id')
        .eq('related_id', bookingId)
        .eq('recipient_id', recipientId)
        .eq('type', 'attendance_scanned')
        .maybeSingle();

      if (!existingNotif) {
        await admin.from('notifications').insert({
          id: randomUUID(),
          recipient_id: recipientId,
          type: 'attendance_scanned',
          title: 'Absensi Berhasil',
          message: `Peserta ${bookingRow.user_name} telah berhasil di-scan untuk tur ${bookingRow.tour_name}.`,
          related_id: bookingId,
          action_url: `/payments/success/${bookingId}`,
          created_at: bookingRow.attendance_scanned_at,
        });

        // Notify owner/admin
        for (const ownerId of ownerIds) {
          await admin.from('notifications').insert({
            id: randomUUID(),
            recipient_id: ownerId,
            type: 'attendance_scanned',
            title: 'Peserta Sudah Absen',
            message: `Peserta ${bookingRow.user_name} sudah discan untuk tur ${bookingRow.tour_name}.`,
            related_id: bookingId,
            action_url: '/dashboard/owner',
            created_at: bookingRow.attendance_scanned_at,
          });
        }
      }
    }

    // Guide assigned notification
    if (bookingRow.guide_id) {
      const { data: existingNotif } = await admin
        .from('notifications')
        .select('id')
        .eq('related_id', bookingId)
        .eq('recipient_id', bookingRow.guide_id)
        .eq('type', 'guide_assignment')
        .maybeSingle();

      if (!existingNotif) {
        await admin.from('notifications').insert({
          id: randomUUID(),
          recipient_id: bookingRow.guide_id,
          type: 'guide_assignment',
          title: 'Penugasan Tur Baru',
          message: `Anda telah ditugaskan untuk memandu tur ${bookingRow.tour_name} (${bookingRow.pax || 1} pax).`,
          related_id: bookingId,
          action_url: '/dashboard/guide',
          created_at: bookingRow.updated_at || new Date().toISOString(),
        });
      }

      // Payment received notification for owner
      if (bookingRow.payment_status === 'paid' || bookingRow.status === 'paid') {
        for (const ownerId of ownerIds) {
          const { data: existingNotif } = await admin
            .from('notifications')
            .select('id')
            .eq('related_id', bookingId)
            .eq('recipient_id', ownerId)
            .eq('type', 'payment_received')
            .maybeSingle();

          if (!existingNotif) {
            await admin.from('notifications').insert({
              id: randomUUID(),
              recipient_id: ownerId,
              type: 'payment_received',
              title: 'Pembayaran Diterima',
              message: `${bookingRow.user_name} telah membayar tur ${bookingRow.tour_name}.`,
              related_id: bookingId,
              action_url: '/dashboard/owner',
              created_at: bookingRow.paid_at || bookingRow.updated_at || new Date().toISOString(),
            });
          }
        }
      }
    }

    // Report submitted notification
    if (bookingRow.report) {
      for (const ownerId of ownerIds) {
        const { data: existingNotif } = await admin
          .from('notifications')
          .select('id')
          .eq('related_id', bookingId)
          .eq('recipient_id', ownerId)
          .eq('type', 'report_submitted')
          .maybeSingle();

        if (!existingNotif) {
          await admin.from('notifications').insert({
            id: randomUUID(),
            recipient_id: ownerId,
            type: 'report_submitted',
            title: 'Laporan Tur Baru',
            message: `${bookingRow.user_name} mengirim laporan untuk tur ${bookingRow.tour_name}.`,
            related_id: bookingId,
            action_url: '/dashboard/owner',
            created_at: bookingRow.report_submitted_at || bookingRow.updated_at || new Date().toISOString(),
          });
        }
      }
    }

    // Report reply notification
    if (bookingRow.report_reply && recipientId) {
      const { data: existingNotif } = await admin
        .from('notifications')
        .select('id')
        .eq('related_id', bookingId)
        .eq('recipient_id', recipientId)
        .eq('type', 'report_reply')
        .maybeSingle();

      if (!existingNotif) {
        await admin.from('notifications').insert({
          id: randomUUID(),
          recipient_id: recipientId,
          type: 'report_reply',
          title: 'Balasan Laporan Tur',
          message: `Laporan Anda untuk ${bookingRow.tour_name} telah dibalas oleh Owner: "${bookingRow.report_reply}"`,
          related_id: bookingId,
          action_url: `/payments/success/${bookingId}`,
          created_at: bookingRow.report_reply_submitted_at || bookingRow.updated_at || new Date().toISOString(),
        });
      }
    }

  } catch (err) {
    console.error('[syncBookingToTables] Fatal error:', err);
  }
}

