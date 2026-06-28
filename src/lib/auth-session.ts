import { createHash, randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';

const SESSION_COOKIE_NAME = 'bdj_session';
const BCRYPT_ROUNDS = 12;

function getSessionSecret() {
  const secret = process.env.AUTH_SESSION_SECRET;
  if (!secret) {
    throw new Error(
      'AUTH_SESSION_SECRET environment variable belum di-set. ' +
      'Tambahkan AUTH_SESSION_SECRET di .env.local (development) atau di environment variables hosting Anda (production).'
    );
  }
  return secret;
}

function getPasswordSalt() {
  const salt = process.env.AUTH_PASSWORD_SALT;
  if (!salt) {
    throw new Error(
      'AUTH_PASSWORD_SALT environment variable belum di-set. ' +
      'Tambahkan AUTH_PASSWORD_SALT di .env.local (development) atau di environment variables hosting Anda (production).'
    );
  }
  return salt;
}

export function getSessionCookieName() {
  return SESSION_COOKIE_NAME;
}

/**
 * Hash a password using bcrypt. This is the primary hashing method.
 * Returns a bcrypt hash string starting with "$2a$" or "$2b$".
 */
export async function hashPassword(rawPassword: string): Promise<string> {
  return bcrypt.hash(rawPassword, BCRYPT_ROUNDS);
}

/**
 * Verify a password against a stored hash.
 * Supports both bcrypt hashes (new) and legacy SHA-256 hashes (old) for backward compatibility.
 * If a legacy hash matches, the caller should re-hash and update the stored hash to bcrypt.
 */
export async function verifyPassword(rawPassword: string, storedHash: string): Promise<{ valid: boolean; needsRehash: boolean }> {
  // Detect bcrypt hash (starts with $2a$ or $2b$)
  if (storedHash.startsWith('$2a$') || storedHash.startsWith('$2b$')) {
    const valid = await bcrypt.compare(rawPassword, storedHash);
    return { valid, needsRehash: false };
  }

  // Legacy SHA-256 check for backward compatibility
  const legacySalt = getPasswordSalt();
  const legacyHash = createHash('sha256').update(`${legacySalt}:${rawPassword}`).digest('hex');
  const valid = legacyHash === storedHash;
  return { valid, needsRehash: valid }; // If valid legacy hash, mark for rehash to bcrypt
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
