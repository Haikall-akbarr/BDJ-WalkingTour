import { randomUUID } from 'crypto';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { getMySqlPool } from '@/lib/mysql';

type DbUserRow = RowDataPacket & {
  id: string;
  email: string;
  name: string;
  role: string;
  phone: string | null;
  emergency_contact: string | null;
  address: string | null;
  password_hash: string;
  is_active: number;
  created_at: Date | string;
  updated_at: Date | string;
};

type DbSessionRow = RowDataPacket & {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: Date | string;
  created_at: Date | string;
  last_seen_at: Date | string;
};

type DbPasswordResetRow = RowDataPacket & {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: Date | string;
  used_at: Date | string | null;
  created_at: Date | string;
};

function toIso(value: Date | string | null | undefined) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function mapUser(row: DbUserRow) {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    phone: row.phone || null,
    emergencyContact: row.emergency_contact || null,
    address: row.address || null,
    passwordHash: row.password_hash,
    isActive: Boolean(row.is_active),
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

export async function getUserByEmail(email: string) {
  const pool = getMySqlPool();
  const [rows] = await pool.query<DbUserRow[]>('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
  if (!rows[0]) return null;
  return mapUser(rows[0]);
}

export async function getUserById(id: string) {
  const pool = getMySqlPool();
  const [rows] = await pool.query<DbUserRow[]>('SELECT * FROM users WHERE id = ? LIMIT 1', [id]);
  if (!rows[0]) return null;
  return mapUser(rows[0]);
}

export async function listUsers() {
  const pool = getMySqlPool();
  const [rows] = await pool.query<DbUserRow[]>('SELECT * FROM users ORDER BY created_at DESC');
  return rows.map(mapUser);
}

export async function deleteUserById(id: string) {
  const pool = getMySqlPool();
  const [result] = await pool.execute<ResultSetHeader>('DELETE FROM users WHERE id = ?', [id]);
  return (result as ResultSetHeader).affectedRows > 0;
}

export async function upsertUser(input: {
  id?: string;
  email: string;
  name: string;
  role: string;
  passwordHash: string;
  isActive?: boolean;
}) {
  const pool = getMySqlPool();
  const id = input.id || randomUUID();

  await pool.execute(
    `INSERT INTO users (id, email, name, role, password_hash, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
     ON DUPLICATE KEY UPDATE
       name = VALUES(name),
       role = VALUES(role),
       password_hash = VALUES(password_hash),
       is_active = VALUES(is_active),
       updated_at = NOW()`,
    [id, input.email, input.name, input.role, input.passwordHash, input.isActive === false ? 0 : 1]
  );

  return getUserByEmail(input.email);
}

export async function updateUserProfile(userId: string, data: { name?: string; phone?: string; emergencyContact?: string; address?: string }) {
  const pool = getMySqlPool();
  const sets: string[] = ['updated_at = NOW()'];
  const values: any[] = [];
  if (data.name !== undefined) { sets.push('name = ?'); values.push(data.name); }
  if (data.phone !== undefined) { sets.push('phone = ?'); values.push(data.phone); }
  if (data.emergencyContact !== undefined) { sets.push('emergency_contact = ?'); values.push(data.emergencyContact); }
  if (data.address !== undefined) { sets.push('address = ?'); values.push(data.address); }
  values.push(userId);
  await pool.execute(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`, values);
  return getUserById(userId);
}

export async function updateUserPasswordHash(userId: string, passwordHash: string) {
  const pool = getMySqlPool();
  await pool.execute('UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?', [passwordHash, userId]);
}

export async function createSession(input: { userId: string; tokenHash: string; expiresAt: Date }) {
  const pool = getMySqlPool();
  const id = randomUUID();

  await pool.execute(
    `INSERT INTO sessions (id, user_id, token_hash, expires_at, created_at, last_seen_at)
     VALUES (?, ?, ?, ?, NOW(), NOW())`,
    [id, input.userId, input.tokenHash, input.expiresAt]
  );

  return { id };
}

export async function getSessionByTokenHash(tokenHash: string) {
  const pool = getMySqlPool();
  const [rows] = await pool.query<DbSessionRow[]>('SELECT * FROM sessions WHERE token_hash = ? LIMIT 1', [tokenHash]);
  if (!rows[0]) return null;

  return {
    id: rows[0].id,
    userId: rows[0].user_id,
    tokenHash: rows[0].token_hash,
    expiresAt: toIso(rows[0].expires_at),
    createdAt: toIso(rows[0].created_at),
    lastSeenAt: toIso(rows[0].last_seen_at),
  };
}

export async function touchSession(sessionId: string) {
  const pool = getMySqlPool();
  await pool.execute('UPDATE sessions SET last_seen_at = NOW() WHERE id = ?', [sessionId]);
}

export async function deleteSessionByTokenHash(tokenHash: string) {
  const pool = getMySqlPool();
  const [result] = await pool.execute<ResultSetHeader>('DELETE FROM sessions WHERE token_hash = ?', [tokenHash]);
  return result.affectedRows > 0;
}

export async function deleteSessionsByUserId(userId: string) {
  const pool = getMySqlPool();
  await pool.execute('DELETE FROM sessions WHERE user_id = ?', [userId]);
}

export async function deleteExpiredSessions() {
  const pool = getMySqlPool();
  await pool.execute('DELETE FROM sessions WHERE expires_at < NOW()');
}

export async function createPasswordResetToken(input: { userId: string; tokenHash: string; expiresAt: Date }) {
  const pool = getMySqlPool();
  const id = randomUUID();

  await pool.execute(
    `INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at, used_at, created_at)
     VALUES (?, ?, ?, ?, NULL, NOW())`,
    [id, input.userId, input.tokenHash, input.expiresAt]
  );

  return { id };
}

export async function getPasswordResetTokenByHash(tokenHash: string) {
  const pool = getMySqlPool();
  const [rows] = await pool.query<DbPasswordResetRow[]>('SELECT * FROM password_reset_tokens WHERE token_hash = ? LIMIT 1', [tokenHash]);
  if (!rows[0]) return null;

  return {
    id: rows[0].id,
    userId: rows[0].user_id,
    tokenHash: rows[0].token_hash,
    expiresAt: toIso(rows[0].expires_at),
    usedAt: toIso(rows[0].used_at),
    createdAt: toIso(rows[0].created_at),
  };
}

export async function markPasswordResetTokenUsed(tokenId: string) {
  const pool = getMySqlPool();
  await pool.execute('UPDATE password_reset_tokens SET used_at = NOW() WHERE id = ?', [tokenId]);
}

export async function deleteExpiredPasswordResetTokens() {
  const pool = getMySqlPool();
  await pool.execute('DELETE FROM password_reset_tokens WHERE expires_at < NOW()');
}
