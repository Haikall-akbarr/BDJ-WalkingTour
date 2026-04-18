"use client";

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, CreditCard, Loader2 } from 'lucide-react';

export default function DummyPaymentPage() {
  const router = useRouter();
  const { bookingId } = useParams<{ bookingId: string }>();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [attendanceCode, setAttendanceCode] = useState<string | null>(null);
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null);
  const [emailDeliveryStatus, setEmailDeliveryStatus] = useState<string | null>(null);
  const [emailDeliveryDetail, setEmailDeliveryDetail] = useState<string | null>(null);
  const [emailRecipient, setEmailRecipient] = useState<string | null>(null);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/payments/dummy/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.error || 'Konfirmasi pembayaran dummy gagal.');
      }

      setAttendanceCode(result?.attendanceCode || null);
      setQrImageUrl(result?.qrImageUrl || null);
      setEmailDeliveryStatus(result?.emailDelivery?.status || null);
      setEmailDeliveryDetail(result?.emailDelivery?.detail || null);
      setEmailRecipient(result?.emailDelivery?.to || null);
      setSuccess(true);
    } catch (error) {
      console.error(error);
      alert('Konfirmasi dummy payment gagal. Cek server log untuk detail.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(152,221,202,0.18),_transparent_36%),linear-gradient(180deg,_#f7f4ee_0%,_#ecece7_100%)] px-4 py-10 md:px-8">
      <div className="mx-auto max-w-xl">
        <Card className="rounded-[28px] border-none bg-white/95 shadow-[0_24px_80px_rgba(16,34,31,0.12)]">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-black uppercase">Dummy Payment Checkout</CardTitle>
            <CardDescription>
              Mode simulasi untuk pengujian alur pembayaran, barcode, dan email tanpa Midtrans.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 text-center">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-2xl bg-zinc-100">
              {success ? <CheckCircle2 className="h-12 w-12 text-emerald-600" /> : <CreditCard className="h-12 w-12 text-[#10221f]" />}
            </div>
            <p className="text-sm text-zinc-600">Booking ID: <span className="font-mono text-zinc-800">{bookingId}</span></p>
            {!success ? (
              <p className="text-sm text-zinc-600">Klik tombol di bawah untuk mensimulasikan pembayaran berhasil.</p>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-emerald-700">Pembayaran dummy berhasil. Barcode sudah digenerate dan email akan dikirim jika email provider aktif.</p>
                {emailDeliveryStatus === 'sent' && (
                  <p className="text-sm text-emerald-700">
                    Email barcode terkirim{emailRecipient ? ` ke ${emailRecipient}` : ''}.
                  </p>
                )}
                {emailDeliveryStatus === 'skipped' && (
                  <p className="text-sm text-amber-700">
                    Email belum dikirim karena provider belum aktif. Isi RESEND_API_KEY dan RESEND_FROM_EMAIL di .env.local.
                  </p>
                )}
                {emailDeliveryStatus === 'failed' && (
                  <p className="text-sm text-red-700">
                    Pengiriman email gagal{emailDeliveryDetail ? `: ${emailDeliveryDetail}` : ''}
                  </p>
                )}
                {attendanceCode && <p className="text-sm text-zinc-700">Kode Absensi: <span className="font-mono font-semibold">{attendanceCode}</span></p>}
                {qrImageUrl && (
                  <div className="mx-auto h-48 w-48 overflow-hidden rounded-2xl border bg-white p-2">
                    <Image src={qrImageUrl} alt="Attendance QR" width={176} height={176} className="h-full w-full object-contain" />
                  </div>
                )}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            {!success ? (
              <Button
                onClick={handleConfirm}
                disabled={loading}
                className="w-full rounded-full bg-[#98DDCA] text-[#16302c] hover:bg-[#b8eadc]"
              >
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Memproses...</> : 'Simulasikan Pembayaran Berhasil'}
              </Button>
            ) : (
              <Button onClick={() => router.push('/')} className="w-full rounded-full bg-[#10221f] text-white hover:bg-[#1a3531]">
                Kembali ke Beranda
              </Button>
            )}
            <Link href="/" className="text-xs text-zinc-500 hover:text-zinc-700">Batalkan & kembali</Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
