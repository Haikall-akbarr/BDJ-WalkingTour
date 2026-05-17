import { randomUUID } from 'crypto';
import { getSupabaseAdmin } from '@/lib/supabase';

type AnyRow = Record<string, any>;

function toIso(value: Date | string | null | undefined) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function mapUser(row: AnyRow) {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    passwordHash: row.password_hash,
    isActive: Boolean(row.is_active),
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

export async function getUserByEmail(email: string) {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin.from('users').select('*').eq('email', email).maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return mapUser(data);
}

export async function getUserById(id: string) {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin.from('users').select('*').eq('id', id).maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return mapUser(data);
}

export async function listUsers() {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin.from('users').select('*');

  if (error) throw error;
  return (data || []).map(mapUser).sort((left, right) => String(right.createdAt || '').localeCompare(String(left.createdAt || '')));
}

export async function deleteUserById(id: string) {
  const admin = getSupabaseAdmin();
  const { error } = await admin.from('users').delete().eq('id', id);
  if (error) throw error;
  return true;
}

export async function upsertUser(input: {
  id?: string;
  email: string;
  name: string;
  role: string;
  passwordHash: string;
  isActive?: boolean;
}) {
  const admin = getSupabaseAdmin();
  const existing = await getUserByEmail(input.email);
  const row = {
    id: existing?.id || input.id || randomUUID(),
    email: input.email,
    name: input.name,
    role: input.role,
    password_hash: input.passwordHash,
    is_active: input.isActive === false ? 0 : 1,
    updated_at: new Date().toISOString(),
  };

  const result = existing
    ? await admin.from('users').update(row).eq('id', existing.id).select('*').maybeSingle()
    : await admin.from('users').insert(row).select('*').single();

  if (result.error) throw result.error;
  return result.data ? mapUser(result.data) : null;
}

export async function updateUserPasswordHash(userId: string, passwordHash: string) {
  const admin = getSupabaseAdmin();
  const { error } = await admin.from('users').update({ password_hash: passwordHash, updated_at: new Date().toISOString() }).eq('id', userId);
  if (error) throw error;
}

export async function createSession(input: { userId: string; tokenHash: string; expiresAt: Date }) {
  const admin = getSupabaseAdmin();
  const id = randomUUID();

  const { error } = await admin.from('sessions').insert({
    id,
    user_id: input.userId,
    token_hash: input.tokenHash,
    expires_at: input.expiresAt.toISOString(),
    last_seen_at: new Date().toISOString(),
  });

  if (error) throw error;
  return { id };
}

export async function getSessionByTokenHash(tokenHash: string) {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin.from('sessions').select('*').eq('token_hash', tokenHash).maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    id: data.id,
    userId: data.user_id,
    tokenHash: data.token_hash,
    expiresAt: toIso(data.expires_at),
    createdAt: toIso(data.created_at),
    lastSeenAt: toIso(data.last_seen_at),
  };
}

export async function touchSession(sessionId: string) {
  const admin = getSupabaseAdmin();
  const { error } = await admin.from('sessions').update({ last_seen_at: new Date().toISOString() }).eq('id', sessionId);
  if (error) throw error;
}

export async function deleteSessionByTokenHash(tokenHash: string) {
  const admin = getSupabaseAdmin();
  const { error } = await admin.from('sessions').delete().eq('token_hash', tokenHash);
  if (error) throw error;
  return true;
}

export async function deleteSessionsByUserId(userId: string) {
  const admin = getSupabaseAdmin();
  const { error } = await admin.from('sessions').delete().eq('user_id', userId);
  if (error) throw error;
}

export async function deleteExpiredSessions() {
  const admin = getSupabaseAdmin();
  const { error } = await admin.from('sessions').delete().lt('expires_at', new Date().toISOString());
  if (error) throw error;
}

export async function createPasswordResetToken(input: { userId: string; tokenHash: string; expiresAt: Date }) {
  const admin = getSupabaseAdmin();
  const id = randomUUID();

  const { error } = await admin.from('password_reset_tokens').insert({
    id,
    user_id: input.userId,
    token_hash: input.tokenHash,
    expires_at: input.expiresAt.toISOString(),
    used_at: null,
  });

  if (error) throw error;
  return { id };
}

export async function getPasswordResetTokenByHash(tokenHash: string) {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin.from('password_reset_tokens').select('*').eq('token_hash', tokenHash).maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    id: data.id,
    userId: data.user_id,
    tokenHash: data.token_hash,
    expiresAt: toIso(data.expires_at),
    usedAt: toIso(data.used_at),
    createdAt: toIso(data.created_at),
  };
}

export async function markPasswordResetTokenUsed(tokenId: string) {
  const admin = getSupabaseAdmin();
  const { error } = await admin.from('password_reset_tokens').update({ used_at: new Date().toISOString() }).eq('id', tokenId);
  if (error) throw error;
}

export async function deleteExpiredPasswordResetTokens() {
  const admin = getSupabaseAdmin();
  const { error } = await admin.from('password_reset_tokens').delete().lt('expires_at', new Date().toISOString());
  if (error) throw error;
}
