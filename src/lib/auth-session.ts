import { createHash, randomBytes } from 'crypto';

const SESSION_COOKIE_NAME = 'bdj_session';

function getSessionSecret() {
  return process.env.AUTH_SESSION_SECRET || 'dev-session-secret-change-me';
}

function getPasswordSalt() {
  return process.env.AUTH_PASSWORD_SALT || 'dev-password-salt-change-me';
}

export function getSessionCookieName() {
  return SESSION_COOKIE_NAME;
}

export function hashPassword(rawPassword: string) {
  return createHash('sha256').update(`${getPasswordSalt()}:${rawPassword}`).digest('hex');
}

export function generateSessionToken() {
  return randomBytes(32).toString('hex');
}

export function hashSessionToken(token: string) {
  return createHash('sha256').update(`${getSessionSecret()}:${token}`).digest('hex');
}

export function generateResetToken() {
  return randomBytes(32).toString('hex');
}

export function hashResetToken(token: string) {
  return createHash('sha256').update(`${getSessionSecret()}:reset:${token}`).digest('hex');
}

export function getSessionExpiryDate(days = 14) {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + days);
  return expiresAt;
}
