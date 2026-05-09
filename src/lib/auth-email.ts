import nodemailer from 'nodemailer';

function getAppBaseUrl() {
  if (process.env.APP_BASE_URL) {
    return process.env.APP_BASE_URL;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return 'http://localhost:9002';
}

function getEmailProvider() {
  return (process.env.EMAIL_PROVIDER || '').trim().toLowerCase();
}

function getSmtpConfig() {
  const host = (process.env.SMTP_HOST || '').trim();
  const port = Number(process.env.SMTP_PORT || 587);
  const user = (process.env.SMTP_USER || '').trim();
  const pass = process.env.SMTP_PASS || '';
  const fromEmail = (process.env.SMTP_FROM_EMAIL || '').trim();

  if (!host || !user || !pass || !fromEmail) {
    return null;
  }

  return {
    host,
    port,
    secure: (process.env.SMTP_SECURE || '').toLowerCase() === 'true' || port === 465,
    user,
    pass,
    fromEmail,
  };
}

async function sendViaSmtp(params: { to: string; subject: string; html: string }) {
  const smtpConfig = getSmtpConfig();

  if (!smtpConfig) {
    return { skipped: true, provider: 'smtp' as const };
  }

  const transporter = nodemailer.createTransport({
    host: smtpConfig.host,
    port: smtpConfig.port,
    secure: smtpConfig.secure,
    auth: {
      user: smtpConfig.user,
      pass: smtpConfig.pass,
    },
  });

  const info = await transporter.sendMail({
    from: smtpConfig.fromEmail,
    to: params.to,
    subject: params.subject,
    html: params.html,
    headers: {
      'X-Mailer': 'BDJ-WalkingTour/1.0',
      'X-Priority': '3',
    },
  });

  return {
    provider: 'smtp' as const,
    messageId: info.messageId,
  };
}

async function sendViaResend(params: { to: string; subject: string; html: string }) {
  const resendKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;

  if (!resendKey || !fromEmail) {
    return { skipped: true, provider: 'resend' as const };
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${resendKey}`,
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [params.to],
      subject: params.subject,
      html: params.html,
      headers: {
        'X-Mailer': 'BDJ-WalkingTour/1.0',
        'X-Priority': '3',
      },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    const error = new Error(`Resend request failed: ${response.status} ${text}`);
    (error as any).status = response.status;
    throw error;
  }

  return response.json();
}

export async function sendAuthEmail(params: { to: string; subject: string; html: string }) {
  const preferredProvider = getEmailProvider();
  const smtpConfig = getSmtpConfig();
  const resendConfigured = Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL);

  const providerOrder: Array<'smtp' | 'resend'> =
    preferredProvider === 'smtp'
      ? ['smtp', 'resend']
      : preferredProvider === 'resend'
        ? ['resend', 'smtp']
        : smtpConfig
          ? ['smtp', 'resend']
          : ['resend', 'smtp'];

  let lastError: unknown;

  for (const provider of providerOrder) {
    try {
      if (provider === 'smtp') {
        if (!smtpConfig) {
          continue;
        }

        return await sendViaSmtp(params);
      }

      if (!resendConfigured) {
        continue;
      }

      return await sendViaResend(params);
    } catch (error) {
      lastError = error;
    }
  }

  if (lastError) {
    throw lastError instanceof Error ? lastError : new Error('Gagal mengirim email auth.');
  }

  return { skipped: true, provider: providerOrder[0] };
}

export function buildWelcomeEmailHtml(params: { name: string }) {
  const appBaseUrl = getAppBaseUrl();
  return `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#10221f;max-width:600px;margin:0 auto;">
      <h2 style="margin-bottom:20px;">Akun berhasil dibuat</h2>
      <p>Halo ${params.name}, akun peserta BDJ WalkingTour sudah aktif.</p>
      <p>Silakan login kembali melalui halaman peserta untuk memesan tur, atau gunakan Google jika akun Anda terhubung.</p>
      <p>
        <a href="${appBaseUrl}/login" style="display:inline-block;background:#98DDCA;color:#10221f;text-decoration:none;padding:12px 20px;border-radius:999px;font-weight:bold;">Buka Login</a>
      </p>
      <p style="font-size:12px;color:#777;margin-top:24px;">Jika Anda tidak merasa membuat akun ini, abaikan email ini.</p>
    </div>
  `;
}

export function buildPasswordResetEmailHtml(params: { name: string; resetUrl: string }) {
  return `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#10221f;max-width:600px;margin:0 auto;">
      <h2 style="margin-bottom:20px;">Atur ulang kata sandi</h2>
      <p>Halo ${params.name}, kami menerima permintaan reset password untuk akun BDJ WalkingTour.</p>
      <p>
        <a href="${params.resetUrl}" style="display:inline-block;background:#98DDCA;color:#10221f;text-decoration:none;padding:12px 20px;border-radius:999px;font-weight:bold;">Atur Ulang Password</a>
      </p>
      <p style="font-size:12px;color:#777;margin-top:18px;">Tautan ini hanya berlaku sementara untuk keamanan akun Anda.</p>
      <p style="font-size:12px;color:#999;word-break:break-all;">${params.resetUrl}</p>
    </div>
  `;
}
