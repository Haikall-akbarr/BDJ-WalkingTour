"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { BadgeCheck, Loader2, RefreshCw, Clock } from 'lucide-react';

type PaymentStatusResponse = {
  source: string;
  bookingId: string;
  booking: {
    paymentStatus: string;
    status: string;
    paymentGateway?: string | null;
    paymentCheckoutUrl?: string | null;
    attendanceCode?: string | null;
    attendanceQrImageUrl?: string | null;
    attendanceScannedAt?: string | null;
    attendanceScannedBy?: string | null;
    paidAt?: string | null;
    barcodeSentAt?: string | null;
    tourName?: string | null;
    userName?: string | null;
    userEmail?: string | null;
    grossAmount?: number | null;
    createdAt?: string | null;
  };
};

export default function PaymentSuccessPage() {
  const router = useRouter();
  const { bookingId } = useParams<{ bookingId: string }>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<PaymentStatusResponse | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const mountTimeRef = useRef(Date.now());
  const pollCountRef = useRef(0);

  const booking = payload?.booking;
  const isPaid = booking?.paymentStatus === 'paid' || booking?.status === 'paid';
  const hasBarcode = Boolean(booking?.attendanceCode && booking?.attendanceQrImageUrl);
  const paymentTargetUrl = booking?.paymentCheckoutUrl || (booking?.paymentGateway === 'manual' ? `/payments/manual/${bookingId}` : booking?.paymentGateway === 'dummy' ? `/payments/dummy/${bookingId}` : null);

  // Detect if user just returned from payment gateway (within first 30 seconds)
  const isRecentRedirect = useMemo(() => {
    return !isPaid && (Date.now() - mountTimeRef.current < 30000);
  }, [isPaid]);

  const formattedAmount = useMemo(() => {
    if (!booking?.grossAmount) return null;
    return booking.grossAmount.toLocaleString('id-ID');
  }, [booking?.grossAmount]);

  const loadStatus = async (silent = false) => {
    if (!silent) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    try {
      const response = await fetch(`/api/payments/status?bookingId=${encodeURIComponent(String(bookingId))}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error || 'Gagal mengambil status pembayaran.');
      }

      setPayload(result as PaymentStatusResponse);
      setError(null);
    } catch (loadError) {
      setError((loadError as any)?.message || 'Gagal mengambil status pembayaran.');
    } finally {
      if (!silent) {
        setLoading(false);
      } else {
        setRefreshing(false);
      }
    }
  };

  useEffect(() => {
    loadStatus();
  }, [bookingId]);

  // Aggressive polling: 1.5s for the first 30 seconds (to catch webhook quickly after
  // redirect from Pakasir), then slow down to 3s. Stops once payment is confirmed.
  useEffect(() => {
    if (isPaid && hasBarcode) {
      return;
    }

    const getInterval = () => {
      const elapsed = Date.now() - mountTimeRef.current;
      // First 30 seconds: poll every 1.5s to quickly catch webhook
      if (elapsed < 30000) return 1500;
      // Next 2 minutes: poll every 3s
      if (elapsed < 150000) return 3000;
      // After that: poll every 5s
      return 5000;
    };

    let timerId: ReturnType<typeof setTimeout>;

    const poll = () => {
      pollCountRef.current += 1;
      loadStatus(true);
      timerId = setTimeout(poll, getInterval());
    };

    // Start first poll faster (500ms) to give webhook a moment
    timerId = setTimeout(poll, 500);

    return () => clearTimeout(timerId);
  }, [bookingId, isPaid, hasBarcode]);

  useEffect(() => {
    if (!booking || isPaid) {
      setTimeLeft(null);
      return;
    }

    const createdTime = booking.createdAt ? new Date(booking.createdAt).getTime() : Date.now();
    const expiryTime = createdTime + 10 * 60 * 1000;

    const updateTimer = () => {
      const remaining = Math.max(0, Math.floor((expiryTime - Date.now()) / 1000));
      setTimeLeft(remaining);
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [booking, isPaid]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(152,221,202,0.18),_transparent_36%),linear-gradient(180deg,_#f7f4ee_0%,_#ecece7_100%)] px-4 py-10 md:px-8">
      <div className="mx-auto max-w-2xl">
        <Card className="rounded-[28px] border-none bg-white/95 shadow-[0_24px_80px_rgba(16,34,31,0.12)]">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-black uppercase">
              {isPaid ? 'Pembayaran Berhasil' : loading ? 'Memverifikasi Pembayaran...' : 'Status Pembayaran'}
            </CardTitle>
            <CardDescription>
              {isPaid
                ? (booking?.tourName ? `${booking.tourName} • ` : '') + 'Pembayaran Anda sudah dikonfirmasi.'
                : 'Halaman ini akan otomatis memperbarui status setelah pembayaran diproses.'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 text-center">
            <div className={`mx-auto flex h-24 w-24 items-center justify-center rounded-2xl ${isPaid ? 'bg-emerald-50' : 'bg-amber-50'}`}>
              {isPaid ? <BadgeCheck className="h-12 w-12 text-emerald-600" /> : loading ? <Loader2 className="h-12 w-12 text-amber-500 animate-spin" /> : <Clock className="h-12 w-12 text-amber-500" />}
            </div>

            <div className="space-y-2 text-sm text-zinc-600">
              <p>
                Booking ID: <span className="font-mono text-zinc-800">{bookingId}</span>
              </p>
              {booking?.userEmail && <p>Email pembeli: {booking.userEmail}</p>}
              {formattedAmount && <p>Total: Rp {formattedAmount}</p>}
              <p>
                Status: <span className={isPaid ? 'font-semibold text-emerald-700' : 'font-semibold text-amber-700'}>{booking?.paymentStatus || 'pending_payment'}</span>
              </p>
            </div>

            {!isPaid && timeLeft !== null && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 text-center">
                <p className="text-xs font-semibold uppercase tracking-wider text-amber-800">Sisa Waktu Pembayaran</p>
                <p className="mt-1 font-mono text-2xl font-black text-amber-900">
                  {timeLeft > 0 ? (
                    `${Math.floor(timeLeft / 60).toString().padStart(2, '0')}:${(timeLeft % 60).toString().padStart(2, '0')}`
                  ) : (
                    "Waktu Pembayaran Habis"
                  )}
                </p>
                <p className="mt-1 text-[11px] text-amber-700">Pemesanan otomatis ditolak setelah 10 menit jika belum dibayar.</p>
              </div>
            )}

            {loading ? (
              <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-amber-200 bg-amber-50/50 p-6 text-sm text-amber-800">
                <Loader2 className="h-5 w-5 animate-spin text-amber-600" />
                <p className="font-semibold">Memverifikasi status pembayaran...</p>
                <p className="text-xs text-amber-600">Mohon tunggu, kami sedang mengecek pembayaran Anda dari Pakasir.</p>
              </div>
            ) : isPaid ? (
              !hasBarcode ? (
                <div className="flex flex-col items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                  <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
                  <p className="font-semibold">Pembayaran sudah diterima!</p>
                  <p className="text-xs">Barcode sedang dibuat. Tunggu sebentar atau klik refresh.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {booking?.attendanceScannedAt ? (
                    <>
                      <div className="space-y-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                        <p className="font-semibold">Barcode sudah di-scan</p>
                        <p>Barcode ini sudah digunakan dan telah di-scan oleh guide pada saat check-in.</p>
                        {booking?.attendanceCode && (
                          <p>Kode Absensi: <span className="font-mono font-semibold">{booking.attendanceCode}</span></p>
                        )}
                        <p>Waktu scan: <span className="font-semibold">{new Date(booking.attendanceScannedAt).toLocaleString('id-ID')}</span></p>
                        {booking?.attendanceScannedBy && (
                          <p>Dipindai oleh: <span className="font-semibold">{booking.attendanceScannedBy}</span></p>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                        <p className="font-semibold">Barcode sudah aktif</p>
                        <p>Tunjukkan barcode ini ke guide saat check-in. Barcode juga dikirim ke email pembeli.</p>
                        {booking?.attendanceCode && (
                          <p>Kode Absensi: <span className="font-mono font-semibold">{booking.attendanceCode}</span></p>
                        )}
                      </div>
                      <div className="mx-auto h-56 w-56 overflow-hidden rounded-2xl border bg-white p-3">
                        <Image
                          src={booking.attendanceQrImageUrl!}
                          alt="Barcode Absensi"
                          width={224}
                          height={224}
                          className="h-full w-full object-contain"
                        />
                      </div>
                    </>
                  )}
                </div>
              )
            ) : error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-amber-200 bg-amber-50/50 p-5 text-sm text-amber-800 space-y-3">
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-amber-600" />
                  <p className="font-semibold">Menunggu konfirmasi pembayaran...</p>
                </div>
                <p className="text-xs text-amber-600 text-center">
                  Jika Anda sudah membayar di Pakasir, status akan otomatis berubah dalam beberapa detik.
                  Halaman ini mengecek status secara otomatis.
                </p>
                {refreshing && (
                  <p className="text-[10px] text-amber-500 text-center animate-pulse">Mengecek status terbaru...</p>
                )}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            {!isPaid && paymentTargetUrl && (
              <Button
                onClick={() => {
                  if (paymentTargetUrl.startsWith('/')) {
                    router.push(paymentTargetUrl);
                    return;
                  }

                  window.location.href = paymentTargetUrl;
                }}
                className="w-full rounded-full bg-[#10221f] text-white hover:bg-[#1a3531]"
              >
                Bayar Sekarang
              </Button>
            )}
            <Button onClick={() => loadStatus(true)} disabled={refreshing} className="w-full rounded-full bg-[#98DDCA] text-[#16302c] hover:bg-[#b8eadc]">
              {refreshing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Memperbarui...</> : <><RefreshCw className="mr-2 h-4 w-4" /> Refresh Status</>}
            </Button>
            <Button onClick={() => router.push('/')} variant="outline" className="w-full rounded-full">
              Kembali ke Beranda
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}