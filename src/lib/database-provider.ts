export type DatabaseProvider = 'mysql' | 'supabase';

export function getDatabaseProvider(): DatabaseProvider {
  const provider = (process.env.DB_PROVIDER || 'mysql').trim().toLowerCase();

  if (provider === 'supabase') {
    return 'supabase';
  }

  return 'mysql';
}

export function isMysqlProvider() {
  return getDatabaseProvider() === 'mysql';
}

export function isSupabaseProvider() {
  return getDatabaseProvider() === 'supabase';
}

export function isDatabaseProviderEnabled() {
  return isMysqlProvider() || isSupabaseProvider();
}
