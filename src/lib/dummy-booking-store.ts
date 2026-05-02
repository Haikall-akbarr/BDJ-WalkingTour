import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

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
const DUMMY_BOOKINGS_FILE = path.join(process.cwd(), '.cache', 'dummy-bookings.json');
let hasLoadedFromDisk = false;

// In-memory fallback cache for production/serverless where file persistence may fail
const RUNTIME_MEMORY_CACHE = new Map<string, { data: DummyBooking; expiry: number }>();
const RUNTIME_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

function ensureCacheDir() {
  try {
    fs.mkdirSync(path.dirname(DUMMY_BOOKINGS_FILE), { recursive: true });
  } catch {
    // Ignore errors if directory creation fails (e.g., read-only filesystem)
  }
}

function loadBookingsFromDisk() {
  if (hasLoadedFromDisk) {
    return;
  }

  hasLoadedFromDisk = true;

  try {
    if (!fs.existsSync(DUMMY_BOOKINGS_FILE)) {
      return;
    }

    const raw = fs.readFileSync(DUMMY_BOOKINGS_FILE, 'utf8');
    if (!raw.trim()) {
      return;
    }

    const parsed = JSON.parse(raw) as DummyBooking[];
    if (!Array.isArray(parsed)) {
      return;
    }

    for (const booking of parsed) {
      if (booking?.id) {
        DUMMY_BOOKINGS.set(booking.id, booking);
      }
    }
  } catch (error) {
    console.error('[dummy-booking-store] Failed to load local bookings:', (error as any)?.message);
  }
}

function saveBookingsToDisk() {
  try {
    ensureCacheDir();
    fs.writeFileSync(DUMMY_BOOKINGS_FILE, JSON.stringify(Array.from(DUMMY_BOOKINGS.values()), null, 2), 'utf8');
  } catch (error) {
    // Silently fail on read-only filesystems (e.g., Vercel production)
    console.warn('[dummy-booking-store] Failed to save to disk, using runtime memory cache:', (error as any)?.message);
  }
}

function addToRuntimeCache(booking: DummyBooking) {
  RUNTIME_MEMORY_CACHE.set(booking.id, {
    data: booking,
    expiry: Date.now() + RUNTIME_CACHE_TTL,
  });
}

function nowIso() {
  return new Date().toISOString();
}

function buildId() {
  return `local-${crypto.randomUUID().replace(/-/g, '').slice(0, 20)}`;
}

export function createDummyBooking(data: Omit<DummyBooking, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) {
  loadBookingsFromDisk();

  const id = data.id || buildId();
  const createdAt = nowIso();

  const booking: DummyBooking = {
    ...data,
    id,
    createdAt,
    updatedAt: createdAt,
  };

  DUMMY_BOOKINGS.set(id, booking);
  addToRuntimeCache(booking);
  saveBookingsToDisk();
  return booking;
}

export function getDummyBooking(id: string) {
  loadBookingsFromDisk();
  
  // Check in-memory Map first
  const fromMap = DUMMY_BOOKINGS.get(id);
  if (fromMap) {
    return fromMap;
  }

  // Fallback to runtime memory cache (for production/serverless)
  const cached = RUNTIME_MEMORY_CACHE.get(id);
  if (cached && cached.expiry > Date.now()) {
    return cached.data;
  }

  return null;
}

export function updateDummyBooking(id: string, patch: Partial<DummyBooking>) {
  loadBookingsFromDisk();

  const current = DUMMY_BOOKINGS.get(id);
  if (!current) return null;

  const next: DummyBooking = {
    ...current,
    ...patch,
    updatedAt: nowIso(),
  };

  DUMMY_BOOKINGS.set(id, next);
  addToRuntimeCache(next);
  saveBookingsToDisk();
  return next;
}

export function findDummyBookingByAttendanceCode(attendanceCode: string) {
  loadBookingsFromDisk();

  // Check in-memory Map first
  for (const booking of DUMMY_BOOKINGS.values()) {
    if (booking.attendanceCode === attendanceCode) {
      return booking;
    }
  }

  // Fallback to runtime memory cache
  for (const cached of RUNTIME_MEMORY_CACHE.values()) {
    if (cached.expiry > Date.now() && cached.data.attendanceCode === attendanceCode) {
      return cached.data;
    }
  }

  return null;
}

function generateAttendanceCode(orderId: string) {
  const randomPart = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `BDJ-${orderId.slice(0, 8).toUpperCase()}-${randomPart}`;
}

export function initializeDummyBookings() {
  loadBookingsFromDisk();

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
