import pg from 'pg';
import { env } from './env.js';

const remote = !/@(localhost|127\.0\.0\.1)[:/]/.test(env.databaseUrl);

export const pool = new pg.Pool({
  connectionString: env.databaseUrl,
  ssl: remote ? { rejectUnauthorized: false } : undefined,
});

pool.on('error', (error) => {
  console.error('Error de Postgres', error);
});

export async function query<T>(sql: string, params: unknown[] = []): Promise<T[]> {
  const result = await pool.query(sql, params);
  return result.rows as T[];
}

export async function one<T>(sql: string, params: unknown[] = []): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] ?? null;
}
