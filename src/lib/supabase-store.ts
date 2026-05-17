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
    date: row.date || '',
    description: row.description || '',
    distance: row.distance || '3 KM',
    duration: row.duration || '2 Jam',
    imageUrl: row.image_url || '',
    imageHint: row.image_filename || '',
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
    attendanceCode: row.attendance_code,
    attendanceQrImageUrl: row.attendance_qr_image_url,
    attendanceScannedAt: toIso(row.attendance_scanned_at),
    attendanceScannedBy: row.attendance_scanned_by,
    attendanceStatus: row.attendance_status,
    paidAt: toIso(row.paid_at),
    barcodeSentAt: toIso(row.barcode_sent_at),
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

function normalizeBookingValue(key: string, value: unknown) {
  if (key === 'pax' || key === 'pricePerPax' || key === 'grossAmount') {
    return Number(value || 0);
  }

  if (key === 'attendanceScannedAt' || key === 'paidAt' || key === 'barcodeSentAt' || key === 'reportSubmittedAt') {
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
    attendanceCode: 'attendance_code',
    attendanceQrImageUrl: 'attendance_qr_image_url',
    attendanceScannedAt: 'attendance_scanned_at',
    attendanceScannedBy: 'attendance_scanned_by',
    attendanceStatus: 'attendance_status',
    paidAt: 'paid_at',
    barcodeSentAt: 'barcode_sent_at',
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
  date?: string;
  description?: string;
  distance?: string;
  duration?: string;
}) {
  const admin = getSupabaseAdmin();
  const row = {
    id: randomUUID(),
    name: input.name,
    price: Number(input.price || 0),
    date: input.date || null,
    description: input.description || null,
    distance: input.distance || '3 KM',
    duration: input.duration || '2 Jam',
  };

  const { data, error } = await admin.from('tours').insert(row).select('*').single();
  if (error) throw error;
  return mapTour(data);
}

export async function updateTour(
  id: string,
  input: Partial<{
    name: string;
    price: number;
    date: string;
    description: string;
    distance: string;
    duration: string;
  }>
) {
  const admin = getSupabaseAdmin();
  const patch: Record<string, unknown> = {};

  if (typeof input.name !== 'undefined') patch.name = input.name;
  if (typeof input.price !== 'undefined') patch.price = Number(input.price || 0);
  if (typeof input.date !== 'undefined') patch.date = input.date || null;
  if (typeof input.description !== 'undefined') patch.description = input.description || null;
  if (typeof input.distance !== 'undefined') patch.distance = input.distance || null;
  if (typeof input.duration !== 'undefined') patch.duration = input.duration || null;

  if (Object.keys(patch).length === 0) {
    return getTourById(id);
  }

  patch.updated_at = new Date().toISOString();

  const { data, error } = await admin.from('tours').update(patch).eq('id', id).select('*').maybeSingle();
  if (error) throw error;
  if (!data) return null;
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
  };

  const { data, error } = await admin.from('bookings').insert(row).select('*').single();
  if (error) throw error;
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
  return mapBooking(data);
}
