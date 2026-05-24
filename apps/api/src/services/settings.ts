import { query } from "../db/index.js";

// Tiny in-process cache. Invalidated on update — single-instance deploy, so safe.
const cache = new Map<string, unknown>();

export async function getSetting<T = unknown>(key: string, fallback: T): Promise<T> {
  if (cache.has(key)) return cache.get(key) as T;
  const { rows } = await query<{ value: T }>("SELECT value FROM settings WHERE key = $1", [key]);
  const value = rows[0]?.value ?? fallback;
  cache.set(key, value);
  return value;
}

export async function setSetting<T>(key: string, value: T): Promise<void> {
  await query(
    `INSERT INTO settings (key, value, updated_at)
     VALUES ($1, $2::jsonb, now())
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
    [key, JSON.stringify(value)],
  );
  cache.set(key, value);
}

export async function getAllSettings(): Promise<Record<string, unknown>> {
  const { rows } = await query<{ key: string; value: unknown }>("SELECT key, value FROM settings");
  const out: Record<string, unknown> = {};
  for (const r of rows) out[r.key] = r.value;
  return out;
}
