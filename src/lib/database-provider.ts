export type DatabaseProvider = 'mysql' | 'supabase';

import { hasMySqlConfig } from '@/lib/mysql';
import { hasSupabaseConfig } from '@/lib/supabase';

export function getDatabaseProvider(): DatabaseProvider {
  const provider = (process.env.DB_PROVIDER || 'mysql').trim().toLowerCase();

  if (provider === 'supabase') {
    return hasSupabaseConfig() ? 'supabase' : hasMySqlConfig() ? 'mysql' : 'supabase';
  }

  if (provider === 'mysql') {
    return hasMySqlConfig() ? 'mysql' : hasSupabaseConfig() ? 'supabase' : 'mysql';
  }

  if (hasMySqlConfig()) {
    return 'mysql';
  }

  if (hasSupabaseConfig()) {
    return 'supabase';
  }

  return 'mysql';
}

export function isMysqlProvider() {
  return getDatabaseProvider() === 'mysql' && hasMySqlConfig();
}

export function isSupabaseProvider() {
  return getDatabaseProvider() === 'supabase' && hasSupabaseConfig();
}

export function isDatabaseProviderEnabled() {
  return isMysqlProvider() || isSupabaseProvider();
}
