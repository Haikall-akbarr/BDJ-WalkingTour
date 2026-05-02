import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

function splitInstructions(raw: string | undefined) {
  return (raw || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function getResolvedPaymentMode() {
  const hasPakasirCredentials = Boolean(
    (process.env.PAKASIR_PROJECT_SLUG || process.env.PAKASIR_PROJECT) && process.env.PAKASIR_API_KEY
  );

  if (hasPakasirCredentials) {
    return 'pakasir';
  }

  const explicitMode = (process.env.PAYMENT_MODE || '').trim().toLowerCase();
  if (explicitMode === 'manual' || explicitMode === 'dummy') {
    return explicitMode;
  }

  if (explicitMode === 'midtrans' && process.env.MIDTRANS_SERVER_KEY) {
    return 'midtrans';
  }

  const hasManualConfig = Boolean(
    process.env.PAYMENT_MANUAL_BANK_NAME ||
    process.env.PAYMENT_MANUAL_ACCOUNT_NAME ||
    process.env.PAYMENT_MANUAL_ACCOUNT_NUMBER ||
    process.env.PAYMENT_MANUAL_QR_IMAGE_URL
  );

  if (hasManualConfig) {
    return 'manual';
  }

  return 'dummy';
}

export async function GET() {
  return NextResponse.json({
    mode: getResolvedPaymentMode(),
    manual: {
      title: process.env.PAYMENT_MANUAL_TITLE || 'Manual Payment Checkout',
      description:
        process.env.PAYMENT_MANUAL_DESCRIPTION ||
        'Gunakan mode ini untuk transfer manual jika Anda memilih pembayaran non-gateway.',
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
