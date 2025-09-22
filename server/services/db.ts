import { Pool, PoolClient } from "pg";

import type { PoolClient } from "pg";

const DATABASE_URL =
  process.env.NETLIFY_DATABASE_URL ||
  process.env.NEON_DATABASE_URL ||
  process.env.DATABASE_URL ||
  null;

let neonSql:
  | ((strings: TemplateStringsArray, ...values: any[]) => Promise<any[]>)
  | null = null;

function toTemplate(
  text: string,
  params: any[] = [],
): [TemplateStringsArray, any[]] {
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
  if (!DATABASE_URL) throw new Error("DATABASE_URL not configured");
  const mod = await import("@neondatabase/serverless");
  const factory = (mod as any).neon as (url: string) => any;
  const sql = factory(DATABASE_URL);
  neonSql = (strings: TemplateStringsArray, ...values: any[]) =>
    sql(strings, ...values);
  return neonSql!;
}

export async function query(text: string, params?: any[]) {
  const sql = await ensureNeon();
  const [tpl, values] = toTemplate(text, params || []);
  const rows = await (sql as any)(tpl, ...values);
  return { rows } as { rows: any[] };
}

export async function testConnection() {
  try {
    const { rows } = await query("SELECT 1 as ok");
    return { ok: true, rowCount: rows.length };
  } catch (err: any) {
    return { ok: false, error: err.message || String(err) };
  }
}

export async function closePool() {
  neonSql = null;
}

export async function withTransaction<T>(
  fn: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = {
    query: async (text: string, params?: any[]) => query(text, params),
    release: () => {},
  } as unknown as PoolClient;
  return fn(client);
}
