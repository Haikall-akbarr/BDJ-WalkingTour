import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

function splitInstructions(raw: string | undefined) {
  return (raw || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

export async function GET() {
  return NextResponse.json({
    mode: (process.env.PAYMENT_MODE || 'dummy').toLowerCase(),
    manual: {
      title: process.env.PAYMENT_MANUAL_TITLE || 'Manual Payment Checkout',
      description:
        process.env.PAYMENT_MANUAL_DESCRIPTION ||
        'Gunakan mode ini untuk transfer manual saat Midtrans belum aktif atau masih menunggu verifikasi.',
      instructions: splitInstructions(
        process.env.PAYMENT_MANUAL_INSTRUCTIONS ||
          'Transfer sesuai nominal yang tampil di halaman booking.\nSimpan bukti transfer untuk arsip Anda.\nKlik tombol konfirmasi setelah transfer selesai.'
      ),
      bankName: process.env.PAYMENT_MANUAL_BANK_NAME || 'Bank tujuan',
      accountName: process.env.PAYMENT_MANUAL_ACCOUNT_NAME || 'Nama pemilik rekening',
      accountNumber: process.env.PAYMENT_MANUAL_ACCOUNT_NUMBER || 'Nomor rekening / e-wallet',
      qrImageUrl: process.env.PAYMENT_MANUAL_QR_IMAGE_URL || '',
      supportContact: process.env.PAYMENT_MANUAL_SUPPORT_CONTACT || '',
    },
  });
}
