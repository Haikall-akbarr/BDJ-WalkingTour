import mysql, { Pool } from 'mysql2/promise';

declare global {
  // eslint-disable-next-line no-var
  var __bdjMysqlPool: Pool | undefined;
}

function parsePort(rawPort?: string) {
  const parsed = Number(rawPort || '3306');
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 3306;
}

export function isMySqlEnabled() {
  return (process.env.DB_PROVIDER || '').toLowerCase() === 'mysql';
}

function assertMySqlConfig() {
  const host = process.env.MYSQL_HOST;
  const user = process.env.MYSQL_USER;
  const database = process.env.MYSQL_DATABASE;

  if (!host || !user || !database) {
    throw new Error('Konfigurasi MySQL belum lengkap. Isi MYSQL_HOST, MYSQL_USER, MYSQL_DATABASE, dan set DB_PROVIDER=mysql.');
  }

  return {
    host,
    user,
    database,
    password: process.env.MYSQL_PASSWORD || '',
    port: parsePort(process.env.MYSQL_PORT),
  };
}

export function getMySqlPool() {
  if (global.__bdjMysqlPool) {
    return global.__bdjMysqlPool;
  }

  const config = assertMySqlConfig();
  global.__bdjMysqlPool = mysql.createPool({
    host: config.host,
    user: config.user,
    password: config.password,
    database: config.database,
    port: config.port,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    timezone: 'Z',
  });

  return global.__bdjMysqlPool;
}
