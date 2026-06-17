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

async function sendViaSmtp(params: { to: string; subject: string; html: string; text?: string }) {
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

  const fromName = process.env.SMTP_FROM_NAME || 'BDJ Walking Tour';
  const info = await transporter.sendMail({
    from: `"${fromName}" <${smtpConfig.fromEmail}>`,
    to: params.to,
    subject: params.subject,
    html: params.html,
    text: params.text,
  });

  return {
    provider: 'smtp' as const,
    messageId: info.messageId,
  };
}

async function sendViaResend(params: { to: string; subject: string; html: string; text?: string }) {
  const resendKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;

  if (!resendKey || !fromEmail) {
    return { skipped: true, provider: 'resend' as const };
  }

  const fromName = process.env.SMTP_FROM_NAME || 'BDJ Walking Tour';
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${resendKey}`,
    },
    body: JSON.stringify({
      from: `"${fromName}" <${fromEmail}>`,
      to: [params.to],
      subject: params.subject,
      html: params.html,
      text: params.text,
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

export async function sendAuthEmail(params: { to: string; subject: string; html: string; text?: string }) {
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

export function buildWelcomeEmailHtml(params: { name: string; email: string; password?: string }) {
  const appBaseUrl = getAppBaseUrl();
  return `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#10221f;max-width:600px;margin:0 auto;padding:20px;border:1px solid #eee;border-radius:8px;">
      <h2 style="color: #10221f; margin-bottom:20px;">Selamat Bergabung dengan BDJ Walking Tour!</h2>
      <p>Halo <strong>${params.name}</strong>,</p>
      <p>Akun peserta Anda telah sukses dibuat dan aktif. Selamat bergabung di komunitas petualang BDJ Walking Tour!</p>
      
      <div style="background-color:#f9f9f9;padding:15px;border-left:4px solid #98DDCA;border-radius:4px;margin:20px 0;">
        <h3 style="margin-top:0;color:#333;font-size:15px;">Detail Login Akun Anda:</h3>
        <p style="margin:5px 0;font-size:14px;color:#555;"><strong>Email/Username:</strong> ${params.email}</p>
        ${params.password ? `<p style="margin:5px 0;font-size:14px;color:#555;"><strong>Password:</strong> ${params.password}</p>` : ''}
      </div>

      <p>Silakan login melalui tautan di bawah ini untuk mulai memesan tur jalan kaki terbaik Anda:</p>
      <p style="margin-top:20px;">
        <a href="${appBaseUrl}/login" style="display:inline-block;background:#98DDCA;color:#10221f;text-decoration:none;padding:12px 24px;border-radius:999px;font-weight:bold;font-size:14px;">Buka Login</a>
      </p>
      <hr style="border:0;border-top:1px solid #eee;margin:24px 0;" />
      <p style="font-size:12px;color:#777;text-align:center;">BDJ Walking Tour - Menelusuri Jejak Sejarah Banjarmasin</p>
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
