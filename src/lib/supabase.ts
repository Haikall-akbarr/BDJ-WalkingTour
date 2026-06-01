import { createClient, type SupabaseClient } from '@supabase/supabase-js';

declare global {
  // eslint-disable-next-line no-var
  var __bdjSupabaseAdmin: SupabaseClient | undefined;
}

function getSupabaseUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || '';
}

function getSupabaseAnonKey() {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';
}

function getSupabaseServiceRoleKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || '';
}

export function hasSupabaseConfig() {
  return Boolean(getSupabaseUrl() && getSupabaseAnonKey() && getSupabaseServiceRoleKey());
}

export function isSupabaseEnabled() {
  return (process.env.DB_PROVIDER || '').toLowerCase() === 'supabase' && hasSupabaseConfig();
}

function assertSupabaseClientConfig() {
  const url = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();

  if (!url || !anonKey) {
    const missing = [];
    if (!url) missing.push('NEXT_PUBLIC_SUPABASE_URL');
    if (!anonKey) missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY (atau NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)');

    throw new Error(`Konfigurasi Supabase client belum lengkap. Missing: ${missing.join(', ')}`);
  }

  return { url, anonKey };
}

function assertSupabaseAdminConfig() {
  const { url } = assertSupabaseClientConfig();
  const serviceRoleKey = getSupabaseServiceRoleKey();

  if (!serviceRoleKey) {
    throw new Error('Konfigurasi Supabase admin belum lengkap. Missing: SUPABASE_SERVICE_ROLE_KEY (atau SUPABASE_SECRET_KEY)');
  }

  return { url, serviceRoleKey };
}

export function getSupabaseClient() {
  const { url, anonKey } = assertSupabaseClientConfig();
  return createClient(url, anonKey);
}

export function getSupabaseAdmin() {
  if (global.__bdjSupabaseAdmin) {
    return global.__bdjSupabaseAdmin;
  }

  const { url, serviceRoleKey } = assertSupabaseAdminConfig();

  global.__bdjSupabaseAdmin = createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return global.__bdjSupabaseAdmin;
}

export async function checkSupabaseConnection() {
  const admin = getSupabaseAdmin();

  // Query ringan untuk memastikan koneksi database Supabase berjalan.
  const { error } = await admin.from('tours').select('id', { count: 'exact', head: true });

  if (error) {
    return {
      ok: false,
      message: error.message,
      hint: 'Pastikan tabel tours sudah dibuat di Supabase SQL Editor.',
    };
  }

  return {
    ok: true,
    message: 'Koneksi Supabase berhasil.',
  };
}
