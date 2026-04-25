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

function generateAttendanceCode(orderId: string) {
  const randomPart = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `BDJ-${orderId.slice(0, 8).toUpperCase()}-${randomPart}`;
}

export function initializeDummyBookings() {
  // Jika sudah ada booking, jangan reinitialize
  if (DUMMY_BOOKINGS.size > 0) {
    return;
  }

  // Buat sample bookings dengan attendance codes
  createDummyBooking({
    userName: "Budi Santoso",
    userWhatsApp: "08123456789",
    userEmail: "budi@example.com",
    domicile: "Banjarmasin",
    customDomicile: "",
    tourId: "mock-1",
    tourName: "Susur Sungai Martapura",
    pax: 2,
    pricePerPax: 125000,
    grossAmount: 250000,
    status: "approved",
    paymentStatus: "paid",
    paymentGateway: "midtrans",
    paymentOrderId: "BDJ-LOCAL-08",
    paymentTransactionId: "TXN-001",
    paymentCheckoutUrl: null,
    attendanceCode: "BDJ-LOCAL-08-A1B2C3",
    attendanceQrImageUrl: "https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=BDJ-LOCAL-08-A1B2C3",
    attendanceScannedAt: null,
    attendanceScannedBy: null,
    attendanceStatus: "not_present",
    paidAt: nowIso(),
    barcodeSentAt: nowIso(),
  });

  createDummyBooking({
    userName: "Siti Rahma",
    userWhatsApp: "08987654321",
    userEmail: "siti@example.com",
    domicile: "Banjarbaru",
    customDomicile: "",
    tourId: "mock-2",
    tourName: "Pacinan Walking Tour",
    pax: 4,
    pricePerPax: 150000,
    grossAmount: 600000,
    status: "approved",
    paymentStatus: "paid",
    paymentGateway: "midtrans",
    paymentOrderId: "BDJ-LOCAL-09",
    paymentTransactionId: "TXN-002",
    paymentCheckoutUrl: null,
    attendanceCode: "BDJ-LOCAL-09-D4E5F6",
    attendanceQrImageUrl: "https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=BDJ-LOCAL-09-D4E5F6",
    attendanceScannedAt: null,
    attendanceScannedBy: null,
    attendanceStatus: "not_present",
    paidAt: nowIso(),
    barcodeSentAt: nowIso(),
  });

  createDummyBooking({
    userName: "Ahmad Wijaya",
    userWhatsApp: "08555666777",
    userEmail: "ahmad@example.com",
    domicile: "Martapura",
    customDomicile: "",
    tourId: "mock-1",
    tourName: "Susur Sungai Martapura",
    pax: 3,
    pricePerPax: 125000,
    grossAmount: 375000,
    status: "approved",
    paymentStatus: "paid",
    paymentGateway: "midtrans",
    paymentOrderId: "BDJ-LOCAL-10",
    paymentTransactionId: "TXN-003",
    paymentCheckoutUrl: null,
    attendanceCode: "BDJ-LOCAL-10-G7H8I9",
    attendanceQrImageUrl: "https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=BDJ-LOCAL-10-G7H8I9",
    attendanceScannedAt: null,
    attendanceScannedBy: null,
    attendanceStatus: "not_present",
    paidAt: nowIso(),
    barcodeSentAt: nowIso(),
  });
}
