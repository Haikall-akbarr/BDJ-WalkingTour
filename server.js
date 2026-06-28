import crypto from "crypto";
import express from "express";
import next from "next";
import {
  createPasswordResetToken,
  createSession,
  deleteSessionByTokenHash,
  deleteSessionsByUserId,
  getPasswordResetTokenByHash,
  getSessionByTokenHash,
  getUserByEmail,
  getUserById,
  listUsers,
  markPasswordResetTokenUsed,
  touchSession,
  updateUserPasswordHash,
  upsertUser,
} from "./src/lib/auth-store";
import {
  buildPasswordResetEmailHtml,
  buildWelcomeEmailHtml,
  sendAuthEmail,
} from "./src/lib/auth-email";
import {
  getSessionCookieName,
  getSessionExpiryDate,
  generateResetToken,
  generateSessionToken,
  hashPassword,
  verifyPassword,
  hashResetToken,
  hashSessionToken,
} from "./src/lib/auth-session";
import { signJwt, JWT_COOKIE_NAME } from "./src/lib/jwt";
import { listAuditLogs, logAuditEvent } from "./src/lib/audit-log";
import {
  getDatabaseProvider,
  isDatabaseProviderEnabled,
} from "./src/lib/database-provider";
import {
  createTour,
  deleteTour,
  getBookingByAttendanceCode,
  getBookingById,
  getTourById,
  listBookings,
  listTours,
  updateBooking,
  updateTour,
} from "./src/lib/data-store";
import {
  initializeDummyBookings,
  findDummyBookingByAttendanceCode,
  getDummyBooking,
  updateDummyBooking,
} from "./src/lib/dummy-booking-store";
import { resolveGoogleMapsUrl } from "./src/lib/maps";
import {
  buildAttendanceQrUrl,
  generateAttendanceCode,
  sendAttendanceEmail,
} from "./src/lib/payment-helpers";
import { sendEmail } from "./src/lib/email";

const port = Number(process.env.PORT || 9002);
const isDev = process.env.NODE_ENV !== "production";
const app = express();
const nextApp = next({ dev: isDev, hostname: "localhost", port });
const handleNextRequest = nextApp.getRequestHandler();
const jsonBody = express.json({ limit: "10mb" });

function asyncHandler(handler) {
  return (req, res, next) => {
    void Promise.resolve(handler(req, res, next)).catch(next);
  };
}

function parseCookieHeader(cookieHeader) {
  const cookies = new Map();

  if (!cookieHeader) {
    return cookies;
  }

  for (const part of cookieHeader.split(";")) {
    const index = part.indexOf("=");
    if (index < 0) {
      continue;
    }

    const name = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();

    if (name) {
      cookies.set(name, decodeURIComponent(value));
    }
  }

  return cookies;
}

function getCookie(req, name) {
  return parseCookieHeader(req.headers.cookie).get(name) || null;
}

function buildPublicBaseUrl(req) {
  if (process.env.APP_BASE_URL) {
    return process.env.APP_BASE_URL;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  const origin = req.get("origin");
  if (origin) {
    return origin;
  }

  const proto = (req.get("x-forwarded-proto") || req.protocol || "http")
    .split(",")[0]
    .trim();
  const host =
    req.get("x-forwarded-host") || req.get("host") || `localhost:${port}`;
  return `${proto}://${host}`;
}

function splitInstructions(raw) {
  return (raw || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function getResolvedPaymentMode() {
  const hasPakasirCredentials = Boolean(
    (process.env.PAKASIR_PROJECT_SLUG || process.env.PAKASIR_PROJECT) &&
    process.env.PAKASIR_API_KEY,
  );

  if (hasPakasirCredentials) {
    return "pakasir";
  }

  const explicitMode = (process.env.PAYMENT_MODE || "").trim().toLowerCase();
  if (explicitMode === "manual" || explicitMode === "dummy") {
    return explicitMode;
  }

  if (explicitMode === "midtrans" && process.env.MIDTRANS_SERVER_KEY) {
    return "midtrans";
  }

  const hasManualConfig = Boolean(
    process.env.PAYMENT_MANUAL_BANK_NAME ||
    process.env.PAYMENT_MANUAL_ACCOUNT_NAME ||
    process.env.PAYMENT_MANUAL_ACCOUNT_NUMBER ||
    process.env.PAYMENT_MANUAL_QR_IMAGE_URL,
  );

  if (hasManualConfig) {
    return "manual";
  }

  return "dummy";
}

function getTimestamp(row) {
  const raw =
    row.createdAt ||
    row.created_at ||
    row.timestamp ||
    row.time ||
    row.updatedAt;
  const time = raw ? new Date(String(raw)).getTime() : 0;
  return Number.isFinite(time) ? time : 0;
}

function buildDailySeries(rows, valueKey) {
  const counts = new Map();
  const threshold = Date.now() - 30 * 24 * 60 * 60 * 1000;

  for (const row of rows) {
    const time = getTimestamp(row);
    if (!time || time < threshold) {
      continue;
    }

    const day = new Date(time).toISOString().slice(0, 10);
    counts.set(day, (counts.get(day) || 0) + 1);
  }

  return Array.from(counts.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([day, count]) => ({ day, [valueKey]: count }));
}

function buildMonthlyRevenueSeries(bookings) {
  const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
  const counts = {};
  const monthBookings = {};

  for (const booking of bookings) {
    const time = getTimestamp(booking);
    if (!time) continue;
    const date = new Date(time);
    const monthName = months[date.getMonth()];
    counts[monthName] = (counts[monthName] || 0) + (Number(booking.grossAmount) || 0);

    if (!monthBookings[monthName]) {
      monthBookings[monthName] = [];
    }
    monthBookings[monthName].push({
      id: booking.id,
      tourName: booking.tourName,
      userName: booking.userName,
      userEmail: booking.userEmail,
      pax: booking.pax,
      grossAmount: Number(booking.grossAmount || 0),
      paidAt: booking.paidAt || booking.createdAt,
    });
  }

  const result = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const mName = months[d.getMonth()];
    result.push({ 
      name: mName, 
      value: counts[mName] || 0,
      bookings: monthBookings[mName] || []
    });
  }

  return result;
}

function buildNotificationsFromBookings(bookings) {
  const items = [];

  for (const booking of bookings) {
    const detailUrl = `/payments/success/${booking.id}`;
    const paymentUrl = booking.paymentCheckoutUrl || detailUrl;
    const createdAt = booking.updatedAt || booking.createdAt || null;

    if (booking.paymentStatus === "paid" || booking.status === "paid") {
      items.push({
        id: `${booking.id}-payment`,
        title: "Pembayaran diterima",
        message: `${booking.tourName} atas nama ${booking.userName} sudah dibayar. Barcode sedang diproses / sudah dikirim ke email.`,
        type: "payment_received",
        createdAt: booking.paidAt || createdAt,
        actionUrl: detailUrl,
        ctaLabel: "Lihat Detail",
        isRead: false,
      });
    } else if (
      booking.paymentStatus === "pending_payment" ||
      booking.status === "pending_payment"
    ) {
      items.push({
        id: `${booking.id}-pending`,
        title: "Menunggu pembayaran",
        message: `${booking.tourName} atas nama ${booking.userName} masih menunggu pembayaran.`,
        type: "payment_pending",
        createdAt,
        actionUrl: paymentUrl,
        ctaLabel: "Bayar Sekarang",
        isRead: false,
      });
    }

    if (booking.barcodeSentAt || booking.attendanceCode) {
      items.push({
        id: `${booking.id}-barcode`,
        title: "Barcode tersedia",
        message: `Barcode untuk ${booking.tourName} siap dipakai saat check-in.`,
        type: "barcode_ready",
        createdAt: booking.barcodeSentAt || booking.paidAt || createdAt,
        actionUrl: detailUrl,
        ctaLabel: "Lihat Detail",
        isRead: false,
      });
    }

    if (booking.attendanceScannedAt) {
      items.push({
        id: `${booking.id}-scan`,
        title: "Peserta sudah absen",
        message: `Peserta ${booking.userName} sudah discan oleh guide pada ${booking.attendanceScannedAt}.`,
        type: "attendance_scanned",
        createdAt: booking.attendanceScannedAt,
        actionUrl: detailUrl,
        ctaLabel: "Lihat Detail",
        isRead: false,
      });
    }

    if (booking.guideName) {
      items.push({
        id: `${booking.id}-guide`,
        title: "Guide ditugaskan",
        message: `${booking.guideName} ditugaskan untuk ${booking.tourName}.`,
        type: "guide_assigned",
        createdAt,
        actionUrl: detailUrl,
        ctaLabel: "Lihat Detail",
        isRead: false,
      });
    }

    if (booking.reportReply) {
      items.push({
        id: `${booking.id}-report-reply`,
        title: "Balasan Laporan Tur",
        message: `Laporan Anda untuk ${booking.tourName} telah dibalas oleh Owner: "${booking.reportReply}"`,
        type: "report_reply",
        createdAt: booking.reportReplySubmittedAt || createdAt,
        actionUrl: detailUrl,
        ctaLabel: "Lihat Balasan",
        isRead: false,
      });
    }

    if (booking.report) {
      items.push({
        id: `${booking.id}-report-submitted`,
        title: "Laporan Tur Terkirim",
        message: `Laporan Anda untuk ${booking.tourName} telah berhasil dikirim ke Owner.`,
        type: "report_submitted",
        createdAt: booking.reportSubmittedAt || createdAt,
        actionUrl: detailUrl,
        ctaLabel: "Lihat Detail",
        isRead: false,
      });
    }
  }

  return items.sort((left, right) => {
    const leftTime = left.createdAt ? new Date(left.createdAt).getTime() : 0;
    const rightTime = right.createdAt ? new Date(right.createdAt).getTime() : 0;
    return rightTime - leftTime;
  });
}

async function getCurrentSessionUser(req) {
  if (!isDatabaseProviderEnabled()) {
    return null;
  }

  const token = getCookie(req, getSessionCookieName());
  if (!token) {
    return null;
  }

  const session = await getSessionByTokenHash(hashSessionToken(token));
  if (
    !session ||
    !session.expiresAt ||
    new Date(session.expiresAt).getTime() < Date.now()
  ) {
    return null;
  }

  await touchSession(session.id);

  const user = await getUserById(session.userId);
  if (!user || !user.isActive) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    createdAt: user.createdAt,
  };
}

function setSessionCookie(res, token, expiresAt) {
  res.cookie(getSessionCookieName(), token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

function clearSessionCookie(res) {
  res.cookie(getSessionCookieName(), "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

function ensureDatabase(res) {
  if (!isDatabaseProviderEnabled()) {
    res
      .status(400)
      .json({
        error:
          "Backend database belum aktif. Set DB_PROVIDER=mysql atau supabase di environment.",
      });
    return false;
  }

  return true;
}

function isPublicApiPath(pathname, method) {
  if (pathname === "/api/health/express") return true;
  if (pathname.startsWith("/api/auth/")) return true;
  if (pathname === "/api/tours" && method === "GET") return true;
  if (pathname.startsWith("/api/tours/") && method === "GET") return true;
  if (pathname === "/api/payments/config" && method === "GET") return true;
  return false;
}

function isProtectedPagePath(pathname) {
  return (
    pathname.startsWith("/dashboard/") ||
    pathname.startsWith("/book/") ||
    pathname.startsWith("/payments/")
  );
}

function needsAuthForApi(pathname, method) {
  if (pathname.startsWith("/api/admin/")) return true;
  if (pathname.startsWith("/api/analytics/")) return true;
  if (pathname.startsWith("/api/attendance/")) return true;
  if (pathname.startsWith("/api/bookings/")) return true;
  if (pathname === "/api/notifications") return true;
  if (pathname === "/api/tours/images") return true;
  if (pathname === "/api/payments/status") return true;
  if (pathname === "/api/payments/create") return true;
  if (
    pathname.startsWith("/api/payments/") &&
    pathname !== "/api/payments/config"
  )
    return true;
  if (pathname === "/api/tours" && method !== "GET") return true;
  if (pathname.startsWith("/api/tours/") && method !== "GET") return true;
  return false;
}

function getLoginUrl(req, mode) {
  const loginUrl = new URL("/login", `${req.protocol}://${req.get("host")}`);
  loginUrl.searchParams.set("mode", mode);
  loginUrl.searchParams.set("next", req.originalUrl || req.url || "/");
  return loginUrl.toString();
}

app.use(
  asyncHandler(async (req, res, next) => {
    const pathname = req.path;
    const method = req.method.toUpperCase();

    const pageProtected = isProtectedPagePath(pathname);
    const apiProtected =
      pathname.startsWith("/api/") && needsAuthForApi(pathname, method);

    if (!pageProtected && !apiProtected) {
      return next();
    }

    if (isPublicApiPath(pathname, method)) {
      return next();
    }

    const user = await getCurrentSessionUser(req);
    if (!user) {
      if (pathname.startsWith("/api/")) {
        res.status(401).json({ error: "Login diperlukan." });
        return;
      }

      res.redirect(
        getLoginUrl(req, pathname.startsWith("/dashboard/") ? "staff" : "user"),
      );
      return;
    }

    if (pathname.startsWith("/dashboard/admin") && user.role !== "admin") {
      if (pathname.startsWith("/api/")) {
        res.status(403).json({ error: "Akses admin ditolak." });
        return;
      }

      res.redirect(getLoginUrl(req, "staff"));
      return;
    }

    if (pathname.startsWith("/dashboard/owner") && user.role !== "owner") {
      if (pathname.startsWith("/api/")) {
        res.status(403).json({ error: "Akses owner ditolak." });
        return;
      }

      res.redirect(getLoginUrl(req, "staff"));
      return;
    }

    if (pathname.startsWith("/dashboard/guide") && user.role !== "guide") {
      if (pathname.startsWith("/api/")) {
        res.status(403).json({ error: "Akses pemandu ditolak." });
        return;
      }

      res.redirect(getLoginUrl(req, "staff"));
      return;
    }

    if (pathname.startsWith("/dashboard/user") && user.role !== "user") {
      if (pathname.startsWith("/api/")) {
        res.status(403).json({ error: "Akses peserta ditolak." });
        return;
      }

      res.redirect(getLoginUrl(req, "user"));
      return;
    }

    if (pathname.startsWith("/api/admin/") && !["admin", "owner"].includes(user.role)) {
      res.status(403).json({ error: "Akses admin ditolak." });
      return;
    }

    if (
      pathname.startsWith("/api/analytics/") &&
      !["admin", "owner", "guide"].includes(user.role)
    ) {
      res.status(403).json({ error: "Akses analytics ditolak." });
      return;
    }

    if (
      pathname.startsWith("/api/attendance/") &&
      !["guide", "admin"].includes(user.role)
    ) {
      res.status(403).json({ error: "Akses absensi ditolak." });
      return;
    }

    if (
      (pathname.startsWith("/api/bookings/") || pathname === "/api/bookings") &&
      !["admin", "owner", "guide", "user"].includes(user.role)
    ) {
      res.status(403).json({ error: "Akses booking ditolak." });
      return;
    }

    if (
      pathname === "/api/tours/images" &&
      !["admin", "owner"].includes(user.role)
    ) {
      res.status(403).json({ error: "Akses unggah gambar ditolak." });
      return;
    }

    if (
      (pathname === "/api/payments/status" ||
        pathname === "/api/payments/create" ||
        pathname.startsWith("/api/payments/")) &&
      pathname !== "/api/payments/config" &&
      !["user", "admin", "owner", "guide"].includes(user.role)
    ) {
      res.status(403).json({ error: "Akses pembayaran ditolak." });
      return;
    }

    if (
      pathname === "/api/notifications" &&
      !["user", "admin", "owner", "guide"].includes(user.role)
    ) {
      res.status(403).json({ error: "Akses notifikasi ditolak." });
      return;
    }

    return next();
  }),
);

app.disable("x-powered-by");

app.get("/api/health/express", (_, res) => {
  res.json({
    ok: true,
    backend: "express",
    provider: getDatabaseProvider(),
  });
});

app.get(
  "/api/tours",
  asyncHandler(async (_, res) => {
    if (!ensureDatabase(res)) {
      return;
    }

    const tours = await listTours();
    res.json({ tours });
  }),
);

app.post(
  "/api/tours",
  jsonBody,
  asyncHandler(async (req, res) => {
    if (!ensureDatabase(res)) {
      return;
    }

    if (!req.body?.name || typeof req.body?.price === "undefined") {
      res.status(400).json({ error: "name dan price wajib diisi." });
      return;
    }

    let routeMapUrl = req.body.routeMapUrl ? String(req.body.routeMapUrl) : "";
    if (routeMapUrl) {
      routeMapUrl = await resolveGoogleMapsUrl(routeMapUrl);
    }

    const tour = await createTour({
      name: String(req.body.name),
      price: Number(req.body.price || 0),
      priceHemat: req.body.priceHemat !== undefined ? Number(req.body.priceHemat) : null,
      priceRegulerDesc: req.body.priceRegulerDesc ? String(req.body.priceRegulerDesc) : null,
      priceHematDesc: req.body.priceHematDesc ? String(req.body.priceHematDesc) : null,
      date: req.body.date ? String(req.body.date) : "",
      description: req.body.description ? String(req.body.description) : "",
      distance: req.body.distance ? String(req.body.distance) : "3 KM",
      duration: req.body.duration ? String(req.body.duration) : "2 Jam",
      descriptionFull: req.body.descriptionFull
        ? String(req.body.descriptionFull)
        : "",
      historyCulture: req.body.historyCulture
        ? String(req.body.historyCulture)
        : "",
      historyHighlights: req.body.historyHighlights
        ? String(req.body.historyHighlights)
        : "[]",
      routeDetail: req.body.routeDetail ? String(req.body.routeDetail) : "",
      routeMapUrl: routeMapUrl,
      poiList: req.body.poiList ? String(req.body.poiList) : "[]",
    });

    res.status(201).json({ tour });
  }),
);

app.get(
  "/api/tours/:id",
  asyncHandler(async (req, res) => {
    if (!ensureDatabase(res)) {
      return;
    }

    const tourId = String(req.params.id);
    const tour = await getTourById(tourId);
    if (!tour) {
      res.status(404).json({ error: "Tur tidak ditemukan." });
      return;
    }

    // Resolve on the fly if it is a short link or unconverted long URL
    if (
      tour.routeMapUrl &&
      (tour.routeMapUrl.includes("maps.app.goo.gl") ||
        (tour.routeMapUrl.includes("google.com/maps") &&
          !tour.routeMapUrl.includes("output=embed") &&
          !tour.routeMapUrl.includes("/embed")))
    ) {
      tour.routeMapUrl = await resolveGoogleMapsUrl(tour.routeMapUrl);
    }

    res.json({ tour });
  }),
);

app.put(
  "/api/tours/:id",
  jsonBody,
  asyncHandler(async (req, res) => {
    if (!ensureDatabase(res)) {
      return;
    }

    const tourId = String(req.params.id);
    let routeMapUrl =
      typeof req.body?.routeMapUrl === "undefined"
        ? undefined
        : String(req.body.routeMapUrl || "");
    if (routeMapUrl) {
      routeMapUrl = await resolveGoogleMapsUrl(routeMapUrl);
    }

    const tour = await updateTour(tourId, {
      name:
        typeof req.body?.name === "undefined"
          ? undefined
          : String(req.body.name),
      price:
        typeof req.body?.price === "undefined"
          ? undefined
          : Number(req.body.price),
      priceHemat:
        typeof req.body?.priceHemat === "undefined"
          ? undefined
          : (req.body.priceHemat != null ? Number(req.body.priceHemat) : null),
      priceRegulerDesc:
        typeof req.body?.priceRegulerDesc === "undefined"
          ? undefined
          : (req.body.priceRegulerDesc ? String(req.body.priceRegulerDesc) : null),
      priceHematDesc:
        typeof req.body?.priceHematDesc === "undefined"
          ? undefined
          : (req.body.priceHematDesc ? String(req.body.priceHematDesc) : null),
      date:
        typeof req.body?.date === "undefined"
          ? undefined
          : String(req.body.date || ""),
      description:
        typeof req.body?.description === "undefined"
          ? undefined
          : String(req.body.description || ""),
      distance:
        typeof req.body?.distance === "undefined"
          ? undefined
          : String(req.body.distance || ""),
      duration:
        typeof req.body?.duration === "undefined"
          ? undefined
          : String(req.body.duration || ""),
      descriptionFull:
        typeof req.body?.descriptionFull === "undefined"
          ? undefined
          : String(req.body.descriptionFull || ""),
      historyCulture:
        typeof req.body?.historyCulture === "undefined"
          ? undefined
          : String(req.body.historyCulture || ""),
      historyHighlights:
        typeof req.body?.historyHighlights === "undefined"
          ? undefined
          : String(req.body.historyHighlights || "[]"),
      routeDetail:
        typeof req.body?.routeDetail === "undefined"
          ? undefined
          : String(req.body.routeDetail || ""),
      routeMapUrl: routeMapUrl,
      poiList:
        typeof req.body?.poiList === "undefined"
          ? undefined
          : String(req.body.poiList || "[]"),
    });

    if (!tour) {
      res.status(404).json({ error: "Tur tidak ditemukan." });
      return;
    }

    res.json({ tour });
  }),
);

app.delete(
  "/api/tours/:id",
  asyncHandler(async (req, res) => {
    if (!ensureDatabase(res)) {
      return;
    }

    const tourId = String(req.params.id);
    const deleted = await deleteTour(tourId);
    if (!deleted) {
      res.status(404).json({ error: "Tur tidak ditemukan." });
      return;
    }

    res.json({ ok: true });
  }),
);

app.get(
  "/api/bookings",
  asyncHandler(async (req, res) => {
    if (!ensureDatabase(res)) {
      return;
    }

    const status =
      typeof req.query.status === "string" ? req.query.status : undefined;
    const paymentStatus =
      typeof req.query.paymentStatus === "string"
        ? req.query.paymentStatus
        : undefined;
    const user = await getCurrentSessionUser(req);
    const guideId =
      user?.role === "guide"
        ? user.id
        : (typeof req.query.guideId === "string" ? req.query.guideId : undefined);
    const unassigned = String(req.query.unassigned || "") === "true";
    let bookings = await listBookings({
      status,
      paymentStatus,
      guideId,
      unassigned,
    });

    if (user?.role === "user") {
      bookings = bookings.filter(
        (b) => b.userEmail?.toLowerCase() === user.email.toLowerCase()
      );
    }

    res.json({ bookings });
  }),
);

app.get(
  "/api/bookings/:id",
  asyncHandler(async (req, res) => {
    if (!ensureDatabase(res)) {
      return;
    }

    const bookingId = String(req.params.id);
    const booking = await getBookingById(bookingId);
    if (!booking) {
      res.status(404).json({ error: "Booking tidak ditemukan." });
      return;
    }

    const user = await getCurrentSessionUser(req);
    if (
      user?.role === "user" &&
      booking.userEmail?.toLowerCase() !== user.email.toLowerCase()
    ) {
      res.status(403).json({ error: "Akses booking ditolak." });
      return;
    }

    res.json({ booking });
  }),
);

app.patch(
  "/api/bookings/:id",
  jsonBody,
  asyncHandler(async (req, res) => {
    if (!ensureDatabase(res)) {
      return;
    }

    const bookingId = String(req.params.id);
    const existingBooking = await getBookingById(bookingId);
    if (!existingBooking) {
      res.status(404).json({ error: "Booking tidak ditemukan." });
      return;
    }

    const user = await getCurrentSessionUser(req);
    let patch = {};
    if (user?.role === "user") {
      if (
        existingBooking.userEmail?.toLowerCase() !== user.email.toLowerCase()
      ) {
        res.status(403).json({ error: "Akses booking ditolak." });
        return;
      }
      patch = {
        report: req.body?.report,
        reportSubmittedAt: req.body?.reportSubmittedAt,
      };
    } else {
      patch = {
        status: req.body?.status,
        paymentStatus: req.body?.paymentStatus,
        paymentGateway: req.body?.paymentGateway,
        paymentOrderId: req.body?.paymentOrderId,
        paymentTransactionId: req.body?.paymentTransactionId,
        paymentCheckoutUrl: req.body?.paymentCheckoutUrl,
        guideId: req.body?.guideId,
        guideName: req.body?.guideName,
        report: req.body?.report,
        reportSubmittedAt: req.body?.reportSubmittedAt,
        reportReply: req.body?.reportReply,
        reportReplySubmittedAt: req.body?.reportReplySubmittedAt,
        attendanceCode: req.body?.attendanceCode,
        attendanceQrImageUrl: req.body?.attendanceQrImageUrl,
        attendanceScannedAt: req.body?.attendanceScannedAt,
        attendanceScannedBy: req.body?.attendanceScannedBy,
        attendanceStatus: req.body?.attendanceStatus,
        paidAt: req.body?.paidAt,
        barcodeSentAt: req.body?.barcodeSentAt,
      };
    }

    const isNewReport = req.body?.report && req.body.report !== existingBooking.report;

    const booking = await updateBooking(bookingId, patch);
    if (!booking) {
      res.status(404).json({ error: "Booking tidak ditemukan." });
      return;
    }

    if (isNewReport && booking.userEmail) {
      const emailHtml = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
          <h2 style="color: #10221f;">Halo, ${booking.userName || 'Peserta'}!</h2>
          <p>Laporan tur Anda untuk <strong>${booking.tourName || 'Tur'}</strong> telah berhasil kami terima.</p>
          <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #98DDCA; border-radius: 4px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #333;">Isi Laporan Anda:</h3>
            <p style="white-space: pre-wrap; color: #555; line-height: 1.6;">${booking.report}</p>
          </div>
          <p>Laporan Anda telah diteruskan ke Owner untuk ditinjau. Kami akan mengirimkan notifikasi kembali segera setelah Owner memberikan balasan.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #888; text-align: center;">BDJ Walking Tour - Siap Menemani Petualangan Anda!</p>
        </div>
      `;
      sendEmail(
        booking.userEmail,
        `[BDJ Walking Tour] Laporan Tur Anda Telah Diterima`,
        emailHtml
      ).catch(err => console.error("Gagal mengirim email laporan ke user:", err));
    }

    if (
      user?.role !== "user" &&
      (req.body?.guideId || req.body?.guideName)
    ) {
      await logAuditEvent({
        action: "guide_assigned",
        entityType: "booking",
        entityId: bookingId,
        actorId: req.body?.assignedById || req.body?.actorId || null,
        actorRole: req.body?.assignedByRole || req.body?.actorRole || "owner",
        actorName: req.body?.assignedByName || req.body?.actorName || "owner",
        details: {
          guideId: req.body?.guideId || null,
          guideName: req.body?.guideName || null,
          status: req.body?.status || null,
          paymentStatus: req.body?.paymentStatus || null,
        },
      });
    }

    res.json({ booking });
  }),
);

app.patch(
  "/api/bookings/:id/status",
  jsonBody,
  asyncHandler(async (req, res) => {
    if (!ensureDatabase(res)) {
      return;
    }

    const user = await getCurrentSessionUser(req);
    if (user?.role === "user") {
      res.status(403).json({ error: "Akses ditolak." });
      return;
    }

    if (!req.body?.status) {
      res.status(400).json({ error: "status wajib diisi." });
      return;
    }

    const bookingId = String(req.params.id);
    const booking = await updateBooking(bookingId, {
      status: String(req.body.status),
    });

    if (!booking) {
      res.status(404).json({ error: "Booking tidak ditemukan." });
      return;
    }

    res.json({ booking });
  }),
);

app.get(
  "/api/auth/me",
  asyncHandler(async (req, res) => {
    const user = await getCurrentSessionUser(req);
    res.json({ user: user || null });
  }),
);

app.post(
  "/api/auth/login",
  jsonBody,
  asyncHandler(async (req, res) => {
    if (!ensureDatabase(res)) {
      return;
    }

    const email = String(req.body?.email || "")
      .trim()
      .toLowerCase();
    const password = String(req.body?.password || "");

    if (!email || !password) {
      res.status(400).json({ error: "Email dan password wajib diisi." });
      return;
    }

    const user = await getUserByEmail(email);
    if (!user || !user.isActive) {
      res.status(401).json({ error: "Email atau password salah." });
      return;
    }

    const { valid, needsRehash } = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Email atau password salah." });
      return;
    }

    if (needsRehash) {
      try {
        const newHash = await hashPassword(password);
        await updateUserPasswordHash(user.id, newHash);
      } catch (e) {}
    }

    const token = generateSessionToken();
    const tokenHash = hashSessionToken(token);
    const expiresAt = getSessionExpiryDate(14);

    await createSession({ userId: user.id, tokenHash, expiresAt });
    setSessionCookie(res, token, expiresAt);

    const jwtToken = await signJwt({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });
    res.cookie(JWT_COOKIE_NAME, jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: expiresAt,
    });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  }),
);

app.post(
  "/api/auth/register",
  jsonBody,
  asyncHandler(async (req, res) => {
    if (!ensureDatabase(res)) {
      return;
    }

    const name = String(req.body?.name || "").trim();
    const email = String(req.body?.email || "")
      .trim()
      .toLowerCase();
    const password = String(req.body?.password || "");
    const confirmPassword = String(req.body?.confirmPassword || "");

    if (!name || !email || !password || !confirmPassword) {
      res.status(400).json({ error: "Nama, email, dan password wajib diisi." });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({ error: "Password minimal 8 karakter." });
      return;
    }

    if (password !== confirmPassword) {
      res.status(400).json({ error: "Konfirmasi password tidak sama." });
      return;
    }

    const existing = await getUserByEmail(email);
    if (existing) {
      res
        .status(409)
        .json({
          error: "Email sudah terdaftar. Silakan login atau reset password.",
        });
      return;
    }

    const user = await upsertUser({
      id: crypto.randomUUID(),
      email,
      name,
      role: "user",
      passwordHash: await hashPassword(password),
      isActive: true,
    });

    if (user) {
      try {
        await sendAuthEmail({
          to: user.email,
          subject: "Akun BDJ WalkingTour berhasil dibuat",
          html: buildWelcomeEmailHtml({ name: user.name }),
        });
      } catch {
        // Keep registration non-blocking when email is unavailable.
      }
    }

    const token = generateSessionToken();
    const tokenHash = hashSessionToken(token);
    const expiresAt = getSessionExpiryDate(14);

    await createSession({ userId: user.id, tokenHash, expiresAt });
    setSessionCookie(res, token, expiresAt);

    const jwtToken = await signJwt({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });
    res.cookie(JWT_COOKIE_NAME, jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: expiresAt,
    });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  }),
);

app.post(
  "/api/auth/logout",
  asyncHandler(async (req, res) => {
    const token = getCookie(req, getSessionCookieName());

    if (token) {
      await deleteSessionByTokenHash(hashSessionToken(token));
    }

    clearSessionCookie(res);
    res.cookie(JWT_COOKIE_NAME, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
    res.json({ ok: true });
  }),
);

app.post(
  "/api/auth/password-reset/request",
  jsonBody,
  asyncHandler(async (req, res) => {
    if (!ensureDatabase(res)) {
      return;
    }

    const email = String(req.body?.email || "")
      .trim()
      .toLowerCase();
    if (!email) {
      res.status(400).json({ error: "Email wajib diisi." });
      return;
    }

    const user = await getUserByEmail(email);
    if (!user || user.role !== "user") {
      res.json({ ok: true });
      return;
    }

    const token = generateResetToken();
    const tokenHash = hashResetToken(token);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await createPasswordResetToken({
      userId: user.id,
      tokenHash,
      expiresAt,
    });

    const resetUrl = `${buildPublicBaseUrl(req)}/reset-password?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;

    try {
      await sendAuthEmail({
        to: user.email,
        subject: "Reset password BDJ WalkingTour",
        html: buildPasswordResetEmailHtml({ name: user.name, resetUrl }),
      });
    } catch {
      // Keep the flow non-blocking.
    }
    res.json({
      ok: true,
      resetUrl: process.env.NODE_ENV === "production" ? undefined : resetUrl,
    });
  }),
);

app.post(
  "/api/auth/password-reset/confirm",
  jsonBody,
  asyncHandler(async (req, res) => {
    if (!ensureDatabase(res)) {
      return;
    }

    const email = String(req.body?.email || "")
      .trim()
      .toLowerCase();
    const token = String(req.body?.token || "").trim();
    const password = String(req.body?.password || "");
    const confirmPassword = String(req.body?.confirmPassword || "");

    if (!email || !token || !password || !confirmPassword) {
      res
        .status(400)
        .json({ error: "Email, token, dan password wajib diisi." });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({ error: "Password minimal 8 karakter." });
      return;
    }

    if (password !== confirmPassword) {
      res.status(400).json({ error: "Konfirmasi password tidak sama." });
      return;
    }

    const user = await getUserByEmail(email);
    if (!user || user.role !== "user") {
      res.status(404).json({ error: "Akun tidak ditemukan." });
      return;
    }

    const tokenRecord = await getPasswordResetTokenByHash(
      hashResetToken(token),
    );
    if (!tokenRecord || tokenRecord.userId !== user.id) {
      res.status(400).json({ error: "Token reset tidak valid." });
      return;
    }

    if (tokenRecord.usedAt) {
      res.status(400).json({ error: "Token reset sudah dipakai." });
      return;
    }

    if (
      !tokenRecord.expiresAt ||
      new Date(tokenRecord.expiresAt).getTime() < Date.now()
    ) {
      res.status(400).json({ error: "Token reset sudah kedaluwarsa." });
      return;
    }

    await updateUserPasswordHash(user.id, hashPassword(password));
    await markPasswordResetTokenUsed(tokenRecord.id);
    await deleteSessionsByUserId(user.id);

    const sessionToken = generateSessionToken();
    const sessionTokenHash = hashSessionToken(sessionToken);
    const expiresAt = getSessionExpiryDate(14);

    await createSession({
      userId: user.id,
      tokenHash: sessionTokenHash,
      expiresAt,
    });

    setSessionCookie(res, sessionToken, expiresAt);
    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  }),
);

app.post(
  "/api/auth/seed",
  asyncHandler(async (_, res) => {
    if (!ensureDatabase(res)) {
      return;
    }

    const users = [
      {
        id: "admin-1",
        email: "admin@bdjwalkingtour.com",
        name: "Admin BDJ",
        role: "admin",
        password: "admin123",
      },
      {
        id: "owner-1",
        email: "owner@bdjwalkingtour.com",
        name: "Owner BDJ",
        role: "owner",
        password: "owner123",
      },
      {
        id: "g1",
        email: "guide@bdjwalkingtour.com",
        name: "Guide BDJ",
        role: "guide",
        password: "guide123",
      },
      {
        id: "user-1",
        email: "user@bdjwalkingtour.com",
        name: "User BDJ",
        role: "user",
        password: "user123",
      },
    ];

    for (const item of users) {
      await upsertUser({
        id: item.id,
        email: item.email,
        name: item.name,
        role: item.role,
        passwordHash: await hashPassword(item.password),
        isActive: true,
      });
    }

    res.json({ ok: true, seeded: users.length });
  }),
);

app.get(
  "/api/admin/users",
  asyncHandler(async (req, res) => {
    if (!ensureDatabase(res)) {
      return;
    }

    const role = String(req.query.role || "")
      .trim()
      .toLowerCase();
    const users = await listUsers();
    const filtered = role
      ? users.filter((user) => String(user.role || "").toLowerCase() === role)
      : users;
    res.json({ users: filtered });
  }),
);

app.post(
  "/api/admin/users",
  jsonBody,
  asyncHandler(async (req, res) => {
    if (!ensureDatabase(res)) {
      return;
    }

    const email = String(req.body?.email || "")
      .trim()
      .toLowerCase();
    const name = String(req.body?.name || "").trim() || email;
    const role = String(req.body?.role || "user");

    if (!email) {
      res.status(400).json({ error: "Email wajib diisi." });
      return;
    }

    const password = String(
      req.body?.password || `${Math.random().toString(36).slice(2, 10)}A!`,
    );
    const user = await upsertUser({
      email,
      name,
      role,
      passwordHash: await hashPassword(password),
    });

    try {
      const html = `
        <p>Halo ${name},</p>
        <p>Akun Anda telah dibuat di BDJ WalkingTour.</p>
        <p><strong>Email:</strong> ${email}<br/><strong>Password:</strong> ${password}</p>
        <p>Silakan login di <a href="${process.env.APP_BASE_URL || "/"}">${process.env.APP_BASE_URL || ""}</a></p>
      `;
      await sendEmail(email, "Akun BDJ WalkingTour dibuat", html);
    } catch {
      // ignore send error
    }
    res.json({ user, password });
  }),
);

app.get(
  "/api/admin/audit-logs",
  asyncHandler(async (_, res) => {
    if (!ensureDatabase(res)) {
      return;
    }

    const logs = await listAuditLogs();
    res.json({ logs });
  }),
);

app.get(
  "/api/analytics/bookings",
  asyncHandler(async (_, res) => {
    if (!ensureDatabase(res)) {
      return;
    }

    const bookings = await listBookings();
    res.json({ data: buildDailySeries(bookings, "bookings") });
  }),
);

app.get(
  "/api/analytics/users",
  asyncHandler(async (_, res) => {
    if (!ensureDatabase(res)) {
      return;
    }

    const users = await listUsers();
    res.json({ data: buildDailySeries(users, "users") });
  }),
);

app.get(
  "/api/notifications",
  asyncHandler(async (req, res) => {
    if (!isDatabaseProviderEnabled()) {
      res.json({ notifications: [] });
      return;
    }

    const user = await getCurrentSessionUser(req);
    if (!user) {
      res.json({ notifications: [] });
      return;
    }

    const isStaff = ["admin", "owner", "guide"].includes(user.role);
    const bookings = await listBookings();
    const visibleBookings = isStaff
      ? bookings
      : bookings.filter(
          (booking) =>
            booking.userEmail?.toLowerCase() === user.email.toLowerCase(),
        );
    const notifications = buildNotificationsFromBookings(visibleBookings).slice(
      0,
      12,
    );

    res.json({
      notifications,
      unreadCount: notifications.length,
    });
  }),
);

app.get(
  "/api/payments/config",
  asyncHandler(async (_, res) => {
    res.json({
      mode: getResolvedPaymentMode(),
      manual: {
        title: process.env.PAYMENT_MANUAL_TITLE || "Manual Payment Checkout",
        description:
          process.env.PAYMENT_MANUAL_DESCRIPTION ||
          "Gunakan mode ini untuk transfer manual jika Anda memilih pembayaran non-gateway.",
        instructions: splitInstructions(
          process.env.PAYMENT_MANUAL_INSTRUCTIONS ||
            "Transfer sesuai nominal yang tampil di halaman booking.\nSimpan bukti transfer untuk arsip Anda.\nKlik tombol konfirmasi setelah transfer selesai.",
        ),
        bankName: process.env.PAYMENT_MANUAL_BANK_NAME || "Bank tujuan",
        accountName:
          process.env.PAYMENT_MANUAL_ACCOUNT_NAME || "Nama pemilik rekening",
        accountNumber:
          process.env.PAYMENT_MANUAL_ACCOUNT_NUMBER ||
          "Nomor rekening / e-wallet",
        qrImageUrl: process.env.PAYMENT_MANUAL_QR_IMAGE_URL || "",
        supportContact: process.env.PAYMENT_MANUAL_SUPPORT_CONTACT || "",
      },
    });
  }),
);

app.post(
  "/api/payments/dummy/confirm",
  jsonBody,
  asyncHandler(async (req, res) => {
    initializeDummyBookings();

    const bookingId = String(req.body?.bookingId || "").trim();
    if (!bookingId) {
      res.status(400).json({ error: "bookingId wajib diisi." });
      return;
    }

    if (isDatabaseProviderEnabled()) {
      const bookingData = await getBookingById(bookingId);
      if (!bookingData) {
        res.status(404).json({ error: "Booking tidak ditemukan." });
        return;
      }

      const attendanceCode =
        bookingData.attendanceCode || generateAttendanceCode(bookingId);
      const qrImageUrl =
        bookingData.attendanceQrImageUrl ||
        buildAttendanceQrUrl(attendanceCode);
      let emailDeliveryStatus = bookingData.userEmail
        ? "failed"
        : "not-requested";
      let emailDeliveryDetail;

      await updateBooking(bookingId, {
        paymentStatus: "paid",
        status: "paid",
        paymentGateway: bookingData.paymentGateway || "dummy",
        paymentTransactionId: `dummy-${bookingId}`,
        attendanceCode,
        attendanceQrImageUrl: qrImageUrl,
        paidAt: new Date().toISOString(),
      });

      if (bookingData.userEmail) {
        try {
          const emailResult = await sendAttendanceEmail({
            to: bookingData.userEmail,
            name: bookingData.userName,
            tourName: bookingData.tourName,
            attendanceCode,
            qrImageUrl,
            orderId: bookingId,
            totalAmount: Number(bookingData.grossAmount || 0),
          });

          if (emailResult?.skipped) {
            emailDeliveryStatus = "skipped";
            emailDeliveryDetail =
              "Provider email belum dikonfigurasi (RESEND_API_KEY/RESEND_FROM_EMAIL).";
          } else {
            emailDeliveryStatus = "sent";
          }

          await updateBooking(bookingId, {
            barcodeSentAt: new Date().toISOString(),
          });
        } catch (emailError) {
          emailDeliveryStatus = "failed";
          emailDeliveryDetail =
            emailError?.message || "Gagal mengirim email barcode.";
        }
      }

      res.json({
        ok: true,
        bookingId,
        attendanceCode,
        qrImageUrl,
        source: "database",
        emailDelivery: {
          status: emailDeliveryStatus,
          detail: emailDeliveryDetail,
          to: bookingData.userEmail || null,
        },
      });
      return;
    }

    const localBooking = getDummyBooking(bookingId);
    if (!localBooking) {
      res.status(404).json({ error: "Booking tidak ditemukan di mode lokal." });
      return;
    }

    const attendanceCode =
      localBooking.attendanceCode || generateAttendanceCode(bookingId);
    const qrImageUrl =
      localBooking.attendanceQrImageUrl || buildAttendanceQrUrl(attendanceCode);

    updateDummyBooking(bookingId, {
      paymentStatus: "paid",
      status: "paid",
      paymentGateway: localBooking.paymentGateway || "dummy",
      paymentTransactionId: `dummy-${bookingId}`,
      attendanceCode,
      attendanceQrImageUrl: qrImageUrl,
      paidAt: new Date().toISOString(),
    });

    res.json({
      ok: true,
      bookingId,
      attendanceCode,
      qrImageUrl,
      source: "local",
    });
  }),
);

app.get(
  "/api/attendance/scan",
  asyncHandler(async (_, res) => {
    res.json({ status: "ok", message: "Attendance scan endpoint is ready" });
  }),
);

app.post(
  "/api/attendance/scan",
  jsonBody,
  asyncHandler(async (req, res) => {
    initializeDummyBookings();

    const attendanceCode = String(req.body?.attendanceCode || "").trim();
    const scannedBy = req.body?.scannedBy || "guide";

    if (!attendanceCode) {
      res.status(400).json({ error: "attendanceCode wajib diisi." });
      return;
    }

    let booking = null;
    let bookingId = null;
    let usedDatabase = false;

    if (isDatabaseProviderEnabled()) {
      const databaseBooking = await getBookingByAttendanceCode(attendanceCode);
      if (databaseBooking) {
        booking = databaseBooking;
        bookingId = databaseBooking.id;
        usedDatabase = true;
      }
    }

    if (!booking) {
      const localBooking = findDummyBookingByAttendanceCode(attendanceCode);
      if (localBooking) {
        booking = localBooking;
        bookingId = localBooking.id;
      }
    }

    if (!booking || !bookingId) {
      res.status(404).json({ error: "Kode tidak ditemukan (fallback lokal)." });
      return;
    }

    if (booking.paymentStatus !== "paid") {
      res
        .status(400)
        .json({
          error:
            "Pembayaran belum berhasil. Barcode belum valid untuk absensi.",
        });
      return;
    }

    if (booking.attendanceStatus === "present") {
      res
        .status(409)
        .json({ error: "Barcode sudah pernah digunakan untuk absensi." });
      return;
    }

    if (usedDatabase) {
      await updateBooking(bookingId, {
        attendanceScannedAt: new Date().toISOString(),
        attendanceScannedBy: scannedBy,
        attendanceStatus: "present",
      });
    } else {
      const updated = updateDummyBooking(bookingId, {
        attendanceScannedAt: new Date().toISOString(),
        attendanceScannedBy: scannedBy,
        attendanceStatus: "present",
      });

      if (updated) {
        booking = updated;
      }
    }

    await logAuditEvent({
      action: "ticket_scanned",
      entityType: "booking",
      entityId: bookingId,
      actorId: scannedBy || null,
      actorRole: "guide",
      actorName: scannedBy || "guide",
      details: {
        attendanceCode,
        source: usedDatabase ? "database" : "local",
        bookingUserName: booking?.userName || null,
        tourName: booking?.tourName || null,
      },
    });

    res.json({
      ok: true,
      bookingId,
      booking,
      source: usedDatabase ? "database" : "local",
    });
  }),
);

app.get(
  "/api/notifications",
  asyncHandler(async (req, res) => {
    if (!isDatabaseProviderEnabled()) {
      res.json({ notifications: [] });
      return;
    }

    const user = await getCurrentSessionUser(req);
    if (!user) {
      res.json({ notifications: [] });
      return;
    }

    const isStaff = ["admin", "owner", "guide"].includes(user.role);
    const bookings = await listBookings();
    const visibleBookings = isStaff
      ? bookings
      : bookings.filter(
          (booking) =>
            booking.userEmail?.toLowerCase() === user.email.toLowerCase(),
        );
    const notifications = buildNotificationsFromBookings(visibleBookings).slice(
      0,
      12,
    );

    res.json({
      notifications,
      unreadCount: notifications.length,
    });
  }),
);

app.get(
  "/api/analytics/bookings",
  asyncHandler(async (_, res) => {
    if (!ensureDatabase(res)) {
      return;
    }

    const bookings = await listBookings();
    res.json({ data: buildDailySeries(bookings, "bookings") });
  }),
);

app.get(
  "/api/analytics/users",
  asyncHandler(async (_, res) => {
    if (!ensureDatabase(res)) {
      return;
    }

    const users = await listUsers();
    res.json({ data: buildDailySeries(users, "users") });
  }),
);

app.get(
  "/api/analytics/revenue",
  asyncHandler(async (req, res) => {
    if (!ensureDatabase(res)) {
      return;
    }

    const user = await getCurrentSessionUser(req);
    if (!user) {
      res.status(401).json({ error: "Login diperlukan." });
      return;
    }

    const bookings = await listBookings();
    const paidBookings = bookings.filter((b) => b.paymentStatus === "paid" || b.status === "paid");

    if (user.role === "guide") {
      const myBookings = paidBookings.filter((b) => b.guideId === user.id);
      const myRevenue = myBookings.reduce((sum, b) => sum + (Number(b.grossAmount) || 0) * 0.35, 0);
      res.json({ totalRevenue: myRevenue });
      return;
    }

    if (user.role === "owner" || user.role === "admin") {
      const totalRevenue = paidBookings.reduce((sum, b) => sum + (Number(b.grossAmount) || 0), 0);
      const totalGuideRevenue = paidBookings
        .filter((b) => b.guideId)
        .reduce((sum, b) => sum + (Number(b.grossAmount) || 0) * 0.35, 0);
      const monthlyData = buildMonthlyRevenueSeries(paidBookings);

      res.json({
        totalRevenue,
        totalGuideRevenue,
        monthlyData,
      });
      return;
    }

    res.status(403).json({ error: "Akses ditolak." });
  }),
);

app.get(
  "/api/admin/users",
  asyncHandler(async (req, res) => {
    if (!ensureDatabase(res)) {
      return;
    }

    const role = String(req.query.role || "")
      .trim()
      .toLowerCase();
    const users = await listUsers();
    const filtered = role
      ? users.filter((user) => String(user.role || "").toLowerCase() === role)
      : users;
    res.json({ users: filtered });
  }),
);

app.post(
  "/api/admin/users",
  jsonBody,
  asyncHandler(async (req, res) => {
    if (!ensureDatabase(res)) {
      return;
    }

    const email = String(req.body?.email || "")
      .trim()
      .toLowerCase();
    const name = String(req.body?.name || "").trim() || email;
    const role = String(req.body?.role || "user");

    if (!email) {
      res.status(400).json({ error: "Email wajib diisi." });
      return;
    }

    const password = String(
      req.body?.password || `${Math.random().toString(36).slice(2, 10)}A!`,
    );
    const user = await upsertUser({
      email,
      name,
      role,
      passwordHash: await hashPassword(password),
    });

    try {
      const html = `
        <p>Halo ${name},</p>
        <p>Akun Anda telah dibuat di BDJ WalkingTour.</p>
        <p><strong>Email:</strong> ${email}<br/><strong>Password:</strong> ${password}</p>
        <p>Silakan login di <a href="${process.env.APP_BASE_URL || "/"}">${process.env.APP_BASE_URL || ""}</a></p>
      `;
      await sendEmail(email, "Akun BDJ WalkingTour dibuat", html);
    } catch {
      // ignore send error
    }
    res.json({ user, password });
  }),
);

app.get(
  "/api/admin/audit-logs",
  asyncHandler(async (_, res) => {
    if (!ensureDatabase(res)) {
      return;
    }

    const logs = await listAuditLogs();
    res.json({ logs });
  }),
);

app.get(
  "/api/auth/me",
  asyncHandler(async (req, res) => {
    const user = await getCurrentSessionUser(req);
    res.json({ user: user || null });
  }),
);

app.post(
  "/api/auth/login",
  jsonBody,
  asyncHandler(async (req, res) => {
    if (!ensureDatabase(res)) {
      return;
    }

    const email = String(req.body?.email || "")
      .trim()
      .toLowerCase();
    const password = String(req.body?.password || "");

    if (!email || !password) {
      res.status(400).json({ error: "Email dan password wajib diisi." });
      return;
    }

    const user = await getUserByEmail(email);
    if (
      !user ||
      !user.isActive ||
      !(await verifyPassword(password, user.passwordHash)).valid
    ) {
      res.status(401).json({ error: "Email atau password salah." });
      return;
    }

    const token = generateSessionToken();
    const tokenHash = hashSessionToken(token);
    const expiresAt = getSessionExpiryDate(14);

    await createSession({ userId: user.id, tokenHash, expiresAt });
    setSessionCookie(res, token, expiresAt);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  }),
);

app.post(
  "/api/auth/register",
  jsonBody,
  asyncHandler(async (req, res) => {
    if (!ensureDatabase(res)) {
      return;
    }

    const name = String(req.body?.name || "").trim();
    const email = String(req.body?.email || "")
      .trim()
      .toLowerCase();
    const password = String(req.body?.password || "");
    const confirmPassword = String(req.body?.confirmPassword || "");

    if (!name || !email || !password || !confirmPassword) {
      res.status(400).json({ error: "Nama, email, dan password wajib diisi." });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({ error: "Password minimal 8 karakter." });
      return;
    }

    if (password !== confirmPassword) {
      res.status(400).json({ error: "Konfirmasi password tidak sama." });
      return;
    }

    const existing = await getUserByEmail(email);
    if (existing) {
      res
        .status(409)
        .json({
          error: "Email sudah terdaftar. Silakan login atau reset password.",
        });
      return;
    }

    const user = await upsertUser({
      id: crypto.randomUUID(),
      email,
      name,
      role: "user",
      passwordHash: await hashPassword(password),
      isActive: true,
    });

    if (user) {
      try {
        await sendAuthEmail({
          to: user.email,
          subject: "Akun BDJ WalkingTour berhasil dibuat",
          html: buildWelcomeEmailHtml({ name: user.name }),
        });
      } catch {
        // Keep registration non-blocking when email is unavailable.
      }
    }

    const token = generateSessionToken();
    const tokenHash = hashSessionToken(token);
    const expiresAt = getSessionExpiryDate(14);

    await createSession({ userId: user.id, tokenHash, expiresAt });
    setSessionCookie(res, token, expiresAt);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  }),
);

app.post(
  "/api/auth/logout",
  asyncHandler(async (req, res) => {
    const token = getCookie(req, getSessionCookieName());

    if (token) {
      await deleteSessionByTokenHash(hashSessionToken(token));
    }

    clearSessionCookie(res);
    res.json({ ok: true });
  }),
);

app.post(
  "/api/auth/password-reset/request",
  jsonBody,
  asyncHandler(async (req, res) => {
    if (!ensureDatabase(res)) {
      return;
    }

    const email = String(req.body?.email || "")
      .trim()
      .toLowerCase();
    if (!email) {
      res.status(400).json({ error: "Email wajib diisi." });
      return;
    }

    const user = await getUserByEmail(email);
    if (!user || user.role !== "user") {
      res.json({ ok: true });
      return;
    }

    const token = generateResetToken();
    const tokenHash = hashResetToken(token);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await createPasswordResetToken({
      userId: user.id,
      tokenHash,
      expiresAt,
    });

    const resetUrl = `${buildPublicBaseUrl(req)}/reset-password?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;

    try {
      await sendAuthEmail({
        to: user.email,
        subject: "Reset password BDJ WalkingTour",
        html: buildPasswordResetEmailHtml({ name: user.name, resetUrl }),
      });
    } catch {
      // Keep the flow non-blocking.
    }
    res.json({
      ok: true,
      resetUrl: process.env.NODE_ENV === "production" ? undefined : resetUrl,
    });
  }),
);

app.post(
  "/api/auth/password-reset/confirm",
  jsonBody,
  asyncHandler(async (req, res) => {
    if (!ensureDatabase(res)) {
      return;
    }

    const email = String(req.body?.email || "")
      .trim()
      .toLowerCase();
    const token = String(req.body?.token || "").trim();
    const password = String(req.body?.password || "");
    const confirmPassword = String(req.body?.confirmPassword || "");

    if (!email || !token || !password || !confirmPassword) {
      res
        .status(400)
        .json({ error: "Email, token, dan password wajib diisi." });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({ error: "Password minimal 8 karakter." });
      return;
    }

    if (password !== confirmPassword) {
      res.status(400).json({ error: "Konfirmasi password tidak sama." });
      return;
    }

    const user = await getUserByEmail(email);
    if (!user || user.role !== "user") {
      res.status(404).json({ error: "Akun tidak ditemukan." });
      return;
    }

    const tokenRecord = await getPasswordResetTokenByHash(
      hashResetToken(token),
    );
    if (!tokenRecord || tokenRecord.userId !== user.id) {
      res.status(400).json({ error: "Token reset tidak valid." });
      return;
    }

    if (tokenRecord.usedAt) {
      res.status(400).json({ error: "Token reset sudah dipakai." });
      return;
    }

    if (
      !tokenRecord.expiresAt ||
      new Date(tokenRecord.expiresAt).getTime() < Date.now()
    ) {
      res.status(400).json({ error: "Token reset sudah kedaluwarsa." });
      return;
    }

    await updateUserPasswordHash(user.id, hashPassword(password));
    await markPasswordResetTokenUsed(tokenRecord.id);
    await deleteSessionsByUserId(user.id);

    const sessionToken = generateSessionToken();
    const sessionTokenHash = hashSessionToken(sessionToken);
    const expiresAt = getSessionExpiryDate(14);

    await createSession({
      userId: user.id,
      tokenHash: sessionTokenHash,
      expiresAt,
    });

    setSessionCookie(res, sessionToken, expiresAt);
    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  }),
);

app.post(
  "/api/auth/seed",
  asyncHandler(async (_, res) => {
    if (!ensureDatabase(res)) {
      return;
    }

    const users = [
      {
        id: "admin-1",
        email: "admin@bdjwalkingtour.com",
        name: "Admin BDJ",
        role: "admin",
        password: "admin123",
      },
      {
        id: "owner-1",
        email: "owner@bdjwalkingtour.com",
        name: "Owner BDJ",
        role: "owner",
        password: "owner123",
      },
      {
        id: "g1",
        email: "guide@bdjwalkingtour.com",
        name: "Guide BDJ",
        role: "guide",
        password: "guide123",
      },
      {
        id: "user-1",
        email: "user@bdjwalkingtour.com",
        name: "User BDJ",
        role: "user",
        password: "user123",
      },
    ];

    for (const item of users) {
      await upsertUser({
        id: item.id,
        email: item.email,
        name: item.name,
        role: item.role,
        passwordHash: await hashPassword(item.password),
        isActive: true,
      });
    }

    res.json({ ok: true, seeded: users.length });
  }),
);

app.get(
  "/api/payments/config",
  asyncHandler(async (_, res) => {
    res.json({
      mode: getResolvedPaymentMode(),
      manual: {
        title: process.env.PAYMENT_MANUAL_TITLE || "Manual Payment Checkout",
        description:
          process.env.PAYMENT_MANUAL_DESCRIPTION ||
          "Gunakan mode ini untuk transfer manual jika Anda memilih pembayaran non-gateway.",
        instructions: splitInstructions(
          process.env.PAYMENT_MANUAL_INSTRUCTIONS ||
            "Transfer sesuai nominal yang tampil di halaman booking.\nSimpan bukti transfer untuk arsip Anda.\nKlik tombol konfirmasi setelah transfer selesai.",
        ),
        bankName: process.env.PAYMENT_MANUAL_BANK_NAME || "Bank tujuan",
        accountName:
          process.env.PAYMENT_MANUAL_ACCOUNT_NAME || "Nama pemilik rekening",
        accountNumber:
          process.env.PAYMENT_MANUAL_ACCOUNT_NUMBER ||
          "Nomor rekening / e-wallet",
        qrImageUrl: process.env.PAYMENT_MANUAL_QR_IMAGE_URL || "",
        supportContact: process.env.PAYMENT_MANUAL_SUPPORT_CONTACT || "",
      },
    });
  }),
);

app.post(
  "/api/payments/dummy/confirm",
  jsonBody,
  asyncHandler(async (req, res) => {
    initializeDummyBookings();

    const bookingId = String(req.body?.bookingId || "").trim();
    if (!bookingId) {
      res.status(400).json({ error: "bookingId wajib diisi." });
      return;
    }

    if (isDatabaseProviderEnabled()) {
      const bookingData = await getBookingById(bookingId);
      if (!bookingData) {
        res.status(404).json({ error: "Booking tidak ditemukan." });
        return;
      }

      const attendanceCode =
        bookingData.attendanceCode || generateAttendanceCode(bookingId);
      const qrImageUrl =
        bookingData.attendanceQrImageUrl ||
        buildAttendanceQrUrl(attendanceCode);
      let emailDeliveryStatus = bookingData.userEmail
        ? "failed"
        : "not-requested";
      let emailDeliveryDetail;

      await updateBooking(bookingId, {
        paymentStatus: "paid",
        status: "paid",
        paymentGateway: bookingData.paymentGateway || "dummy",
        paymentTransactionId: `dummy-${bookingId}`,
        attendanceCode,
        attendanceQrImageUrl: qrImageUrl,
        paidAt: new Date().toISOString(),
      });

      if (bookingData.userEmail) {
        try {
          const emailResult = await sendAttendanceEmail({
            to: bookingData.userEmail,
            name: bookingData.userName,
            tourName: bookingData.tourName,
            attendanceCode,
            qrImageUrl,
            orderId: bookingId,
            totalAmount: Number(bookingData.grossAmount || 0),
          });

          if (emailResult?.skipped) {
            emailDeliveryStatus = "skipped";
            emailDeliveryDetail =
              "Provider email belum dikonfigurasi (RESEND_API_KEY/RESEND_FROM_EMAIL).";
          } else {
            emailDeliveryStatus = "sent";
          }

          await updateBooking(bookingId, {
            barcodeSentAt: new Date().toISOString(),
          });
        } catch (emailError) {
          emailDeliveryStatus = "failed";
          emailDeliveryDetail =
            emailError?.message || "Gagal mengirim email barcode.";
        }
      }

      res.json({
        ok: true,
        bookingId,
        attendanceCode,
        qrImageUrl,
        source: "database",
        emailDelivery: {
          status: emailDeliveryStatus,
          detail: emailDeliveryDetail,
          to: bookingData.userEmail || null,
        },
      });
      return;
    }

    const localBooking = getDummyBooking(bookingId);
    if (!localBooking) {
      res.status(404).json({ error: "Booking tidak ditemukan di mode lokal." });
      return;
    }

    const attendanceCode =
      localBooking.attendanceCode || generateAttendanceCode(bookingId);
    const qrImageUrl =
      localBooking.attendanceQrImageUrl || buildAttendanceQrUrl(attendanceCode);

    updateDummyBooking(bookingId, {
      paymentStatus: "paid",
      status: "paid",
      paymentGateway: localBooking.paymentGateway || "dummy",
      paymentTransactionId: `dummy-${bookingId}`,
      attendanceCode,
      attendanceQrImageUrl: qrImageUrl,
      paidAt: new Date().toISOString(),
    });

    res.json({
      ok: true,
      bookingId,
      attendanceCode,
      qrImageUrl,
      source: "local",
    });
  }),
);

app.get(
  "/api/attendance/scan",
  asyncHandler(async (_, res) => {
    res.json({ status: "ok", message: "Attendance scan endpoint is ready" });
  }),
);

app.post(
  "/api/attendance/scan",
  jsonBody,
  asyncHandler(async (req, res) => {
    initializeDummyBookings();

    const attendanceCode = String(req.body?.attendanceCode || "").trim();
    const scannedBy = req.body?.scannedBy || "guide";

    if (!attendanceCode) {
      res.status(400).json({ error: "attendanceCode wajib diisi." });
      return;
    }

    let booking = null;
    let bookingId = null;
    let usedDatabase = false;

    if (isDatabaseProviderEnabled()) {
      const databaseBooking = await getBookingByAttendanceCode(attendanceCode);
      if (databaseBooking) {
        booking = databaseBooking;
        bookingId = databaseBooking.id;
        usedDatabase = true;
      }
    }

    if (!booking) {
      const localBooking = findDummyBookingByAttendanceCode(attendanceCode);
      if (localBooking) {
        booking = localBooking;
        bookingId = localBooking.id;
      }
    }

    if (!booking || !bookingId) {
      res.status(404).json({ error: "Kode tidak ditemukan (fallback lokal)." });
      return;
    }

    if (booking.paymentStatus !== "paid") {
      res
        .status(400)
        .json({
          error:
            "Pembayaran belum berhasil. Barcode belum valid untuk absensi.",
        });
      return;
    }

    if (booking.attendanceStatus === "present") {
      res
        .status(409)
        .json({ error: "Barcode sudah pernah digunakan untuk absensi." });
      return;
    }

    if (usedDatabase) {
      await updateBooking(bookingId, {
        attendanceScannedAt: new Date().toISOString(),
        attendanceScannedBy: scannedBy,
        attendanceStatus: "present",
      });
    } else {
      const updated = updateDummyBooking(bookingId, {
        attendanceScannedAt: new Date().toISOString(),
        attendanceScannedBy: scannedBy,
        attendanceStatus: "present",
      });

      if (updated) {
        booking = updated;
      }
    }

    await logAuditEvent({
      action: "ticket_scanned",
      entityType: "booking",
      entityId: bookingId,
      actorId: scannedBy || null,
      actorRole: "guide",
      actorName: scannedBy || "guide",
      details: {
        attendanceCode,
        source: usedDatabase ? "database" : "local",
        bookingUserName: booking?.userName || null,
        tourName: booking?.tourName || null,
      },
    });

    res.json({
      ok: true,
      bookingId,
      booking,
      source: usedDatabase ? "database" : "local",
    });
  }),
);

app.get(
  "/api/notifications",
  asyncHandler(async (req, res) => {
    if (!isDatabaseProviderEnabled()) {
      res.json({ notifications: [] });
      return;
    }

    const user = await getCurrentSessionUser(req);
    console.log("[server.js /api/notifications] user:", user);
    if (!user) {
      res.json({ notifications: [] });
      return;
    }

    const isStaff = ["admin", "owner", "guide"].includes(user.role);
    const bookings = await listBookings();
    const visibleBookings = isStaff
      ? bookings
      : bookings.filter(
          (booking) =>
            booking.userEmail?.toLowerCase() === user.email.toLowerCase(),
        );
    let notifications = buildNotificationsFromBookings(visibleBookings);

    if (user.role === "user") {
      notifications.unshift({
        id: `${user.id}-welcome`,
        title: "Selamat Bergabung!",
        message: `Selamat bergabung dengan BDJ Walking Tour, ${user.name || "Peserta"}! Siapkan cerita lokal terbaik Anda dan jelajahi keindahan Banjarmasin bersama kami.`,
        type: "welcome",
        createdAt: user.createdAt || new Date().toISOString(),
        actionUrl: "/dashboard/user",
        isRead: false,
      });
    }

    const slicedNotifications = notifications.slice(0, 12);

    res.json({
      notifications: slicedNotifications,
      unreadCount: slicedNotifications.length,
    });
  }),
);

app.use((error, _req, res, _next) => {
  const message =
    error instanceof Error
      ? error.message
      : "Terjadi kesalahan pada backend Express.";
  console.error("[express-backend]", error);
  res.status(500).json({ error: message });
});

async function start() {
  await nextApp.prepare();

  app.use((req, res) => {
    void handleNextRequest(req, res);
  });

  app.listen(port, () => {
    console.log(
      `[express-backend] ready on http://localhost:${port} (${isDev ? "dev" : "production"})`,
    );
  });
}

void start();
