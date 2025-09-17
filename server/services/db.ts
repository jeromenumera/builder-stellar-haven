import { Pool, PoolClient } from "pg";

const DATABASE_URL = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL || null;

let pool: Pool | null = null;

export function initDbPool() {
  if (pool) return pool;
  if (!DATABASE_URL) return null;
  pool = new Pool({ connectionString: DATABASE_URL });
  // optional: configure pool here (max, idleTimeoutMillis)
  return pool;
}

export async function query(text: string, params?: any[]) {
  if (!pool) {
    const p = initDbPool();
    if (!p) throw new Error("DATABASE_URL not configured");
  }
  return pool!.query(text, params);
}

export async function testConnection() {
  try {
    const p = initDbPool();
    if (!p) return { ok: false, error: "DATABASE_URL not set" };
    const res = await p.query('SELECT 1 as ok');
    return { ok: true, rowCount: res.rowCount };
  } catch (err: any) {
    return { ok: false, error: err.message || String(err) };
  }
}

export async function closePool() {
  if (!pool) return;
  await pool.end();
  pool = null;
}

export async function withTransaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const p = initDbPool();
  if (!p) throw new Error("DATABASE_URL not configured");
  const client = await p.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (e) {
    try { await client.query('ROLLBACK'); } catch {}
    throw e;
  } finally {
    client.release();
  }
}
