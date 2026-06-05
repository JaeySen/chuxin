/**
 * Schedule loader — reads a Google Sheet "Published to the web" as CSV.
 *
 * Setup on the sheet side (one-time):
 *   1. Open the sheet → File → Share → Publish to web
 *   2. Choose "Entire Document" or a specific sheet, format "Comma-separated values (.csv)"
 *   3. Click Publish, copy the URL (looks like:
 *      https://docs.google.com/spreadsheets/d/e/<long-id>/pub?gid=0&single=true&output=csv)
 *   4. Paste it into the API's .env as SCHEDULE_CSV_URL
 *
 * Expected header row (case-insensitive, English or Vietnamese accepted):
 *   code | mã        — class code (e.g. K1H1)
 *   name | tên       — class name
 *   days | thời gian — days of week
 *   time | ca học    — time slot
 *   start | dự kiến khai giảng | startDate — expected start date
 */

const CACHE_TTL_MS = 5 * 60 * 1000;

export interface ScheduleRow {
  code: string;
  name: string;
  days: string;
  time: string;
  startDate: string;
}

let cache: { rows: ScheduleRow[]; loadedAt: number } | null = null;

function parseCsv(text: string): string[][] {
  // RFC 4180-style: handles quoted fields with commas + escaped quotes ("").
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else { inQuotes = false; }
      } else {
        field += c;
      }
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ",") { row.push(field); field = ""; }
      else if (c === "\n") {
        row.push(field); rows.push(row);
        row = []; field = "";
      } else if (c === "\r") {
        // swallow — next \n will flush the row
      } else {
        field += c;
      }
    }
  }
  // Flush final field/row if no trailing newline
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}

const HEADER_ALIASES: Record<keyof ScheduleRow, string[]> = {
  code:      ["code", "mã", "ma"],
  name:      ["name", "tên", "ten"],
  days:      ["days", "day", "thời gian", "thoi gian"],
  time:      ["time", "ca học", "ca hoc"],
  startDate: ["start", "startdate", "dự kiến khai giảng", "du kien khai giang", "khai giảng", "khai giang"],
};

function indexFromHeader(header: string[]): Record<keyof ScheduleRow, number> {
  const norm = header.map((h) => h.trim().toLowerCase());
  const out = {} as Record<keyof ScheduleRow, number>;
  for (const [key, aliases] of Object.entries(HEADER_ALIASES) as [keyof ScheduleRow, string[]][]) {
    const idx = norm.findIndex((h) => aliases.includes(h));
    out[key] = idx;
  }
  return out;
}

async function fetchAndParse(url: string): Promise<ScheduleRow[]> {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`Schedule fetch failed: HTTP ${res.status}`);
  const text = await res.text();
  const rows = parseCsv(text);
  if (rows.length < 2) return [];

  const idx = indexFromHeader(rows[0]);
  return rows.slice(1).map((r) => ({
    code:      idx.code      >= 0 ? (r[idx.code]      ?? "").trim() : "",
    name:      idx.name      >= 0 ? (r[idx.name]      ?? "").trim() : "",
    days:      idx.days      >= 0 ? (r[idx.days]      ?? "").trim() : "",
    time:      idx.time      >= 0 ? (r[idx.time]      ?? "").trim() : "",
    startDate: idx.startDate >= 0 ? (r[idx.startDate] ?? "").trim() : "",
  })).filter((r) => r.code || r.name);
}

export async function getSchedule(): Promise<ScheduleRow[]> {
  const url = process.env.SCHEDULE_CSV_URL;
  if (!url) return [];

  const now = Date.now();
  if (cache && now - cache.loadedAt < CACHE_TTL_MS) return cache.rows;

  try {
    const rows = await fetchAndParse(url);
    cache = { rows, loadedAt: now };
    return rows;
  } catch (err) {
    // If the fetch fails, serve stale cache rather than nothing.
    if (cache) return cache.rows;
    throw err;
  }
}

export function clearScheduleCache(): void {
  cache = null;
}
