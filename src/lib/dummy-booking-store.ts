import crypto from 'crypto';

type DummyBooking = {
  id: string;
  userName: string;
  userWhatsApp: string;
  userEmail: string;
  domicile: string;
  customDomicile: string;
  tourId: string;
  tourName: string;
  pax: number;
  pricePerPax: number;
  grossAmount: number;
  status: string;
  paymentStatus: string;
  paymentGateway: string;
  paymentOrderId: string | null;
  paymentTransactionId: string | null;
  paymentCheckoutUrl: string | null;
  attendanceCode: string | null;
  attendanceQrImageUrl: string | null;
  attendanceScannedAt: string | null;
  attendanceScannedBy: string | null;
  attendanceStatus?: string;
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
  barcodeSentAt?: string;
};

const DUMMY_BOOKINGS = new Map<string, DummyBooking>();

function nowIso() {
  return new Date().toISOString();
}

function buildId() {
  return `local-${crypto.randomUUID().replace(/-/g, '').slice(0, 20)}`;
}

export function createDummyBooking(data: Omit<DummyBooking, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) {
  const id = data.id || buildId();
  const createdAt = nowIso();

  const booking: DummyBooking = {
    ...data,
    id,
    createdAt,
    updatedAt: createdAt,
  };

  DUMMY_BOOKINGS.set(id, booking);
  return booking;
}

export function getDummyBooking(id: string) {
  return DUMMY_BOOKINGS.get(id) || null;
}

export function updateDummyBooking(id: string, patch: Partial<DummyBooking>) {
  const current = DUMMY_BOOKINGS.get(id);
  if (!current) return null;

  const next: DummyBooking = {
    ...current,
    ...patch,
    updatedAt: nowIso(),
  };

  DUMMY_BOOKINGS.set(id, next);
  return next;
}

export function findDummyBookingByAttendanceCode(attendanceCode: string) {
  for (const booking of DUMMY_BOOKINGS.values()) {
    if (booking.attendanceCode === attendanceCode) {
      return booking;
    }
  }

  return null;
}
