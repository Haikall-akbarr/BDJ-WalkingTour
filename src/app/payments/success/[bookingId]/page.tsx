"use client";

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { BadgeCheck, Loader2, QrCode, RefreshCw } from 'lucide-react';

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

  const booking = payload?.booking;
  const isPaid = booking?.paymentStatus === 'paid' || booking?.status === 'paid';
  const hasBarcode = Boolean(booking?.attendanceCode && booking?.attendanceQrImageUrl);
  const paymentTargetUrl = booking?.paymentCheckoutUrl || (booking?.paymentGateway === 'manual' ? `/payments/manual/${bookingId}` : booking?.paymentGateway === 'dummy' ? `/payments/dummy/${bookingId}` : null);

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

  useEffect(() => {
    if (isPaid && hasBarcode) {
      return;
    }

    const timer = window.setInterval(() => {
      loadStatus(true);
    }, 3000);

    return () => window.clearInterval(timer);
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
            <CardTitle className="text-2xl font-black uppercase">Pembayaran Berhasil</CardTitle>
            <CardDescription>
              {booking?.tourName ? `${booking.tourName} • ` : ''}Barcode akan tampil setelah webhook memproses pembayaran.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 text-center">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-2xl bg-zinc-100">
              {isPaid ? <BadgeCheck className="h-12 w-12 text-emerald-600" /> : <QrCode className="h-12 w-12 text-[#10221f]" />}
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
              <div className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-6 text-sm text-zinc-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                Memuat status pembayaran...
              </div>
            ) : isPaid ? (
              !hasBarcode ? (
                <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700">
                  Pembayaran sudah diterima, barcode sedang dibuat. Tunggu sebentar atau klik refresh.
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
              <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700">
                Pembayaran belum terverifikasi. Halaman ini akan otomatis mengecek status setiap beberapa detik.
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