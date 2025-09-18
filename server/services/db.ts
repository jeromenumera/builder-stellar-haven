import { Pool, PoolClient } from "pg";

import { Pool, PoolClient } from "pg";

const DATABASE_URL = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL || null;
const NETLIFY_DATABASE_URL = process.env.NETLIFY_DATABASE_URL || null;

let pool: Pool | null = null;
let neonSql: ((strings: TemplateStringsArray, ...values: any[]) => Promise<any[]>) | null = null;

function toTemplate(text: string, params: any[] = []): [TemplateStringsArray, any[]] {
  const parts: string[] = [];
  const values: any[] = [];
  let idx = 0;
  const regex = /\$(\d+)/g;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(text))) {
    const start = m.index;
    parts.push(text.slice(idx, start));
    const pIndex = parseInt(m[1], 10) - 1;
    values.push(params[pIndex]);
    idx = start + m[0].length;
  }
  parts.push(text.slice(idx));
  const tpl = parts as unknown as TemplateStringsArray;
  (tpl as any).raw = parts.slice();
  return [tpl, values];
}

async function ensureNeon() {
  if (neonSql) return neonSql;
  const mod = await import("@netlify/neon");
  const factory = (mod as any).neon as (url?: string) => any;
  const sql = factory(NETLIFY_DATABASE_URL || undefined);
  neonSql = (strings: TemplateStringsArray, ...values: any[]) => sql(strings, ...values);
  return neonSql!;
}

export function initDbPool() {
  if (NETLIFY_DATABASE_URL) return null;
  if (pool) return pool;
  if (!DATABASE_URL) return null;
  pool = new Pool({ connectionString: DATABASE_URL });
  return pool;
}

export async function query(text: string, params?: any[]) {
  if (NETLIFY_DATABASE_URL) {
    const sql = await ensureNeon();
    const [tpl, values] = toTemplate(text, params || []);
    const rows = await (sql as any)(tpl, ...values);
    return { rows } as { rows: any[] };
  }
  if (!pool) {
    const p = initDbPool();
    if (!p) throw new Error("DATABASE_URL not configured");
  }
  return pool!.query(text, params);
}

export async function testConnection() {
  try {
    if (NETLIFY_DATABASE_URL) {
      const { rows } = await query('SELECT 1 as ok');
      return { ok: true, rowCount: rows.length };
    }
    const p = initDbPool();
    if (!p) return { ok: false, error: "DATABASE_URL not set" };
    const res = await p.query('SELECT 1 as ok');
    return { ok: true, rowCount: res.rowCount };
  } catch (err: any) {
    return { ok: false, error: err.message || String(err) };
  }
}

export async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
  neonSql = null;
}

export async function withTransaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  if (NETLIFY_DATABASE_URL) {
    const client = {
      query: async (text: string, params?: any[]) => query(text, params),
      release: () => {},
    } as unknown as PoolClient;
    return fn(client);
  }
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
