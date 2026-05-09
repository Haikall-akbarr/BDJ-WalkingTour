import { randomUUID } from 'crypto';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { getMySqlPool } from '@/lib/mysql';

type DbTourRow = RowDataPacket & {
  id: string;
  name: string;
  price: number;
  date: string | null;
  description: string | null;
  distance: string | null;
  duration: string | null;
  created_at: Date | string;
  updated_at: Date | string;
};

type DbBookingRow = RowDataPacket & {
  id: string;
  user_name: string;
  user_whatsapp: string;
  user_email: string | null;
  domicile: string;
  custom_domicile: string | null;
  tour_id: string;
  tour_name: string;
  pax: number;
  price_per_pax: number;
  gross_amount: number;
  status: string;
  payment_status: string;
  payment_gateway: string;
  payment_order_id: string | null;
  payment_transaction_id: string | null;
  payment_checkout_url: string | null;
  guide_id: string | null;
  guide_name: string | null;
  report: string | null;
  report_submitted_at: Date | string | null;
  attendance_code: string | null;
  attendance_qr_image_url: string | null;
  attendance_scanned_at: Date | string | null;
  attendance_scanned_by: string | null;
  attendance_status: string | null;
  paid_at: Date | string | null;
  barcode_sent_at: Date | string | null;
  created_at: Date | string;
  updated_at: Date | string;
};

function toIso(value: Date | string | null | undefined) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function mapTour(row: DbTourRow) {
  return {
    id: row.id,
    name: row.name,
    price: Number(row.price || 0),
    date: row.date || '',
    description: row.description || '',
    distance: row.distance || '3 KM',
    duration: row.duration || '2 Jam',
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

function mapBooking(row: DbBookingRow) {
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

export async function listTours() {
  const pool = getMySqlPool();
  const [rows] = await pool.query<DbTourRow[]>('SELECT * FROM tours ORDER BY name ASC');
  return rows.map(mapTour);
}

export async function getTourById(id: string) {
  const pool = getMySqlPool();
  const [rows] = await pool.query<DbTourRow[]>('SELECT * FROM tours WHERE id = ? LIMIT 1', [id]);
  if (!rows[0]) return null;
  return mapTour(rows[0]);
}

export async function createTour(input: {
  name: string;
  price: number;
  date?: string;
  description?: string;
  distance?: string;
  duration?: string;
}) {
  const pool = getMySqlPool();
  const id = randomUUID();

  await pool.execute(
    `INSERT INTO tours (id, name, price, date, description, distance, duration, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
    [
      id,
      input.name,
      Number(input.price || 0),
      input.date || null,
      input.description || null,
      input.distance || '3 KM',
      input.duration || '2 Jam',
    ]
  );

  return getTourById(id);
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
  const pool = getMySqlPool();
  const fields: string[] = [];
  const values: any[] = [];

  if (typeof input.name !== 'undefined') {
    fields.push('name = ?');
    values.push(input.name);
  }
  if (typeof input.price !== 'undefined') {
    fields.push('price = ?');
    values.push(Number(input.price || 0));
  }
  if (typeof input.date !== 'undefined') {
    fields.push('date = ?');
    values.push(input.date || null);
  }
  if (typeof input.description !== 'undefined') {
    fields.push('description = ?');
    values.push(input.description || null);
  }
  if (typeof input.distance !== 'undefined') {
    fields.push('distance = ?');
    values.push(input.distance || null);
  }
  if (typeof input.duration !== 'undefined') {
    fields.push('duration = ?');
    values.push(input.duration || null);
  }

  if (fields.length === 0) {
    return getTourById(id);
  }

  values.push(id);
  await pool.execute(`UPDATE tours SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ?`, values);
  return getTourById(id);
}

export async function deleteTour(id: string) {
  const pool = getMySqlPool();
  const [result] = await pool.execute<ResultSetHeader>('DELETE FROM tours WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

export async function listBookings(params?: { status?: string; guideId?: string; unassigned?: boolean }) {
  const pool = getMySqlPool();
  const values: unknown[] = [];
  let sql = 'SELECT * FROM bookings';
  const conditions: string[] = [];

  if (params?.status) {
    if (params.status === 'pending') {
      conditions.push('status IN (?, ?)');
      values.push('pending', 'pending_payment');
    } else {
      conditions.push('status = ?');
      values.push(params.status);
    }
  }

  if (params?.unassigned) {
    conditions.push('guide_id IS NULL');
  }

  if (params?.guideId) {
    conditions.push('guide_id = ?');
    values.push(params.guideId);
  }

  if (conditions.length > 0) {
    sql += ` WHERE ${conditions.join(' AND ')}`;
  }

  sql += ' ORDER BY created_at DESC';

  const [rows] = await pool.query<DbBookingRow[]>(sql, values);
  return rows.map(mapBooking);
}

export async function getBookingById(id: string) {
  const pool = getMySqlPool();
  const [rows] = await pool.query<DbBookingRow[]>('SELECT * FROM bookings WHERE id = ? LIMIT 1', [id]);
  if (!rows[0]) return null;
  return mapBooking(rows[0]);
}

export async function getBookingByAttendanceCode(attendanceCode: string) {
  const pool = getMySqlPool();
  const [rows] = await pool.query<DbBookingRow[]>(
    'SELECT * FROM bookings WHERE attendance_code = ? LIMIT 1',
    [attendanceCode]
  );
  if (!rows[0]) return null;
  return mapBooking(rows[0]);
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
  const pool = getMySqlPool();
  const id = input.id || randomUUID();

  await pool.execute(
    `INSERT INTO bookings (
      id, user_name, user_whatsapp, user_email, domicile, custom_domicile,
      tour_id, tour_name, pax, price_per_pax, gross_amount,
      status, payment_status, payment_gateway, payment_order_id,
      payment_transaction_id, payment_checkout_url,
      attendance_code, attendance_qr_image_url,
      attendance_scanned_at, attendance_scanned_by, attendance_status,
      paid_at, barcode_sent_at, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
    [
      id,
      input.userName,
      input.userWhatsApp,
      input.userEmail || null,
      input.domicile,
      input.customDomicile || null,
      input.tourId,
      input.tourName,
      Number(input.pax || 0),
      Number(input.pricePerPax || 0),
      Number(input.grossAmount || 0),
      input.status,
      input.paymentStatus,
      input.paymentGateway,
      input.paymentOrderId || null,
      input.paymentTransactionId || null,
      input.paymentCheckoutUrl || null,
      input.attendanceCode || null,
      input.attendanceQrImageUrl || null,
      input.attendanceScannedAt ? new Date(input.attendanceScannedAt) : null,
      input.attendanceScannedBy || null,
      input.attendanceStatus || null,
      input.paidAt ? new Date(input.paidAt) : null,
      input.barcodeSentAt ? new Date(input.barcodeSentAt) : null,
    ]
  );

  return getBookingById(id);
}

const BOOKING_COLUMN_MAP: Record<string, string> = {
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

function normalizeBookingValue(key: string, value: unknown) {
  if (key === 'pax' || key === 'pricePerPax' || key === 'grossAmount') {
    return Number(value || 0);
  }

  if (key === 'attendanceScannedAt' || key === 'paidAt' || key === 'barcodeSentAt' || key === 'reportSubmittedAt') {
    if (!value) return null;
    return value instanceof Date ? value : new Date(String(value));
  }

  return value ?? null;
}

export async function updateBooking(id: string, patch: Record<string, unknown>) {
  const pool = getMySqlPool();
  const entries = Object.entries(patch).filter(([key, value]) => typeof BOOKING_COLUMN_MAP[key] !== 'undefined' && typeof value !== 'undefined');

  if (entries.length === 0) {
    return getBookingById(id);
  }

  const sets = entries.map(([key]) => `${BOOKING_COLUMN_MAP[key]} = ?`);
  const values: any[] = entries.map(([key, value]) => normalizeBookingValue(key, value));
  values.push(id);

  await pool.execute(`UPDATE bookings SET ${sets.join(', ')}, updated_at = NOW() WHERE id = ?`, values);
  return getBookingById(id);
}
