import mysql, { Pool } from 'mysql2/promise';

declare global {
  // eslint-disable-next-line no-var
  var __bdjMysqlPool: Pool | undefined;
}

function parsePort(rawPort?: string) {
  const parsed = Number(rawPort || '3306');
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 3306;
}

export function hasMySqlConfig() {
  return Boolean(process.env.MYSQL_HOST && process.env.MYSQL_USER && process.env.MYSQL_DATABASE);
}

export function isMySqlEnabled() {
  return (process.env.DB_PROVIDER || '').toLowerCase() === 'mysql' && hasMySqlConfig();
}

function assertMySqlConfig() {
  const host = process.env.MYSQL_HOST;
  const user = process.env.MYSQL_USER;
  const database = process.env.MYSQL_DATABASE;
  const port = process.env.MYSQL_PORT || '3306';

  console.log('[MySQL] Config check:', {
    host: host ? `${host.substring(0, 20)}...` : 'MISSING',
    user: user ? `${user.substring(0, 10)}...` : 'MISSING',
    database: database || 'MISSING',
    port: port,
    env: process.env.NODE_ENV,
    provider: process.env.DB_PROVIDER,
  });

  if (!host || !user || !database) {
    const missing = [];
    if (!host) missing.push('MYSQL_HOST');
    if (!user) missing.push('MYSQL_USER');
    if (!database) missing.push('MYSQL_DATABASE');
    
    throw new Error(
      `Konfigurasi MySQL belum lengkap. Missing: ${missing.join(', ')}. ` +
      `Set DB_PROVIDER=mysql, MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE di Vercel Environment Variables.`
    );
  }

  // Support SSL for cloud databases (Aiven, AWS RDS, etc.)
  const sslEnabled = (process.env.MYSQL_SSL || '').toLowerCase() === 'true';
  const ssl = sslEnabled ? { rejectUnauthorized: false } : undefined;

  return {
    host,
    user,
    database,
    password: process.env.MYSQL_PASSWORD || '',
    port: parsePort(port),
    ssl,
  };
}

export function getMySqlPool() {
  if (global.__bdjMysqlPool) {
    return global.__bdjMysqlPool;
  }

  try {
    const config = assertMySqlConfig();
    console.log('[MySQL] Creating connection pool with host:', config.host);
    
    const poolConfig: any = {
      host: config.host,
      user: config.user,
      password: config.password,
      database: config.database,
      port: config.port,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      timezone: 'Z',
    };

    // Add SSL if configured
    if (config.ssl) {
      poolConfig.ssl = config.ssl;
      console.log('[MySQL] SSL enabled for connection');
    }

    global.__bdjMysqlPool = mysql.createPool(poolConfig);
    console.log('[MySQL] Connection pool created successfully');

    return global.__bdjMysqlPool;
  } catch (err: any) {
    console.error('[MySQL] Failed to create pool:', err?.message);
    throw err;
  }
}
