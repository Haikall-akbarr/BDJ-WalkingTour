import nodemailer from 'nodemailer'

function getSmtpConfig() {
  const host = (process.env.SMTP_HOST || '').trim();
  const port = Number(process.env.SMTP_PORT || 587);
  const user = (process.env.SMTP_USER || '').trim();
  const pass = process.env.SMTP_PASS || '';
  const fromEmail = (process.env.SMTP_FROM_EMAIL || '').trim();

  if (!host || !user || !pass || !fromEmail) return null;

  return { host, port, user, pass, fromEmail, secure: (process.env.SMTP_SECURE || '').toLowerCase() === 'true' };
}

export async function sendEmail(to: string, subject: string, html: string, text?: string) {
  const cfg = getSmtpConfig();
  if (!cfg) {
    return { skipped: true };
  }

  const transporter = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: { user: cfg.user, pass: cfg.pass },
  });

  const info = await transporter.sendMail({ from: cfg.fromEmail, to, subject, html, text });
  return { messageId: info.messageId };
}
