"use client";

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { BadgeCheck, Loader2, Wallet } from 'lucide-react';

type ManualPaymentConfig = {
  title: string;
  description: string;
  instructions: string[];
  bankName: string;
  accountName: string;
  accountNumber: string;
  qrImageUrl: string;
  supportContact: string;
};

const DEFAULT_CONFIG: ManualPaymentConfig = {
  title: 'Manual Payment Checkout',
  description: 'Gunakan mode ini untuk transfer manual saat Midtrans belum aktif atau masih menunggu verifikasi.',
  instructions: [
    'Transfer sesuai nominal yang tampil di halaman booking.',
    'Simpan bukti transfer untuk arsip Anda.',
    'Klik tombol konfirmasi setelah transfer selesai.',
  ],
  bankName: 'Bank tujuan',
  accountName: 'Nama pemilik rekening',
  accountNumber: 'Nomor rekening / e-wallet',
  qrImageUrl: '',
  supportContact: '',
};

export default function ManualPaymentPage() {
  const router = useRouter();
  const { bookingId } = useParams<{ bookingId: string }>();
  const [loading, setLoading] = useState(false);
  const [configLoading, setConfigLoading] = useState(true);
  const [config, setConfig] = useState<ManualPaymentConfig>(DEFAULT_CONFIG);
  const [success, setSuccess] = useState(false);
  const [attendanceCode, setAttendanceCode] = useState<string | null>(null);
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null);
  const [emailDeliveryStatus, setEmailDeliveryStatus] = useState<string | null>(null);
  const [emailDeliveryDetail, setEmailDeliveryDetail] = useState<string | null>(null);
  const [emailRecipient, setEmailRecipient] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadConfig = async () => {
      try {
        const response = await fetch('/api/payments/config');
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result?.error || 'Gagal memuat konfigurasi pembayaran.');
        }

        if (!cancelled) {
          setConfig({
            title: result?.manual?.title || DEFAULT_CONFIG.title,
            description: result?.manual?.description || DEFAULT_CONFIG.description,
            instructions: Array.isArray(result?.manual?.instructions) && result.manual.instructions.length > 0
              ? result.manual.instructions
              : DEFAULT_CONFIG.instructions,
            bankName: result?.manual?.bankName || DEFAULT_CONFIG.bankName,
            accountName: result?.manual?.accountName || DEFAULT_CONFIG.accountName,
            accountNumber: result?.manual?.accountNumber || DEFAULT_CONFIG.accountNumber,
            qrImageUrl: result?.manual?.qrImageUrl || '',
            supportContact: result?.manual?.supportContact || '',
          });
        }
      } catch (error) {
        console.error(error);
      } finally {
        if (!cancelled) {
          setConfigLoading(false);
        }
      }
    };

    loadConfig();

    return () => {
      cancelled = true;
    };
  }, []);

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
        throw new Error(result?.error || 'Konfirmasi pembayaran gagal.');
      }

      setAttendanceCode(result?.attendanceCode || null);
      setQrImageUrl(result?.qrImageUrl || null);
      setEmailDeliveryStatus(result?.emailDelivery?.status || null);
      setEmailDeliveryDetail(result?.emailDelivery?.detail || null);
      setEmailRecipient(result?.emailDelivery?.to || null);
      setSuccess(true);
    } catch (error) {
      console.error(error);
      alert('Konfirmasi pembayaran gagal. Cek server log untuk detail.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(152,221,202,0.18),_transparent_36%),linear-gradient(180deg,_#f7f4ee_0%,_#ecece7_100%)] px-4 py-10 md:px-8">
      <div className="mx-auto max-w-2xl">
        <Card className="rounded-[28px] border-none bg-white/95 shadow-[0_24px_80px_rgba(16,34,31,0.12)]">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-black uppercase">{config.title}</CardTitle>
            <CardDescription>{config.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 text-center">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-2xl bg-zinc-100">
              {success ? <BadgeCheck className="h-12 w-12 text-emerald-600" /> : <Wallet className="h-12 w-12 text-[#10221f]" />}
            </div>

            <div className="space-y-2 text-sm text-zinc-600">
              <p>
                Booking ID: <span className="font-mono text-zinc-800">{bookingId}</span>
              </p>
              <p>
                {config.bankName} {config.accountNumber ? `• ${config.accountNumber}` : ''}{config.accountName ? ` • a.n. ${config.accountName}` : ''}
              </p>
              {config.supportContact && <p>Kontak bantuan: {config.supportContact}</p>}
            </div>

            {!success ? (
              <div className="space-y-4 rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-4 text-left text-sm text-zinc-700">
                <div>
                  <p className="font-semibold text-zinc-900">Langkah cepat:</p>
                  <ol className="mt-2 space-y-1 pl-5 list-decimal">
                    {config.instructions.map((instruction) => (
                      <li key={instruction}>{instruction}</li>
                    ))}
                  </ol>
                </div>
                {(config.qrImageUrl || configLoading) && (
                  <div className="flex items-center justify-center">
                    {configLoading ? (
                      <div className="flex h-40 w-40 items-center justify-center rounded-2xl bg-white text-sm text-zinc-500">Memuat konfigurasi...</div>
                    ) : (
                      <div className="mx-auto h-40 w-40 overflow-hidden rounded-2xl border bg-white p-2">
                        <Image src={config.qrImageUrl} alt="Payment QR" width={160} height={160} className="h-full w-full object-contain" />
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-emerald-700">Pembayaran manual berhasil. Barcode dan email akan diproses otomatis.</p>
                {emailDeliveryStatus === 'sent' && (
                  <p className="text-sm text-emerald-700">Email barcode terkirim{emailRecipient ? ` ke ${emailRecipient}` : ''}.</p>
                )}
                {emailDeliveryStatus === 'skipped' && (
                  <p className="text-sm text-amber-700">Email belum dikirim karena provider belum aktif.</p>
                )}
                {emailDeliveryStatus === 'failed' && (
                  <p className="text-sm text-red-700">Pengiriman email gagal{emailDeliveryDetail ? `: ${emailDeliveryDetail}` : ''}.</p>
                )}
                {attendanceCode && (
                  <p className="text-sm text-zinc-700">
                    Kode Absensi: <span className="font-mono font-semibold">{attendanceCode}</span>
                  </p>
                )}
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
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Memproses...</> : 'Saya Sudah Transfer'}
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