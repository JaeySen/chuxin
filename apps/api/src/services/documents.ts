/**
 * Google Docs ingestion — extract the doc id from a Google Docs URL,
 * fetch the plain-text export (works for "Anyone with the link can view"
 * documents without OAuth), and compute a content hash so we can detect
 * real content changes vs just timestamp pokes.
 *
 * For richer metadata (last-modifying user, true revision id) we'd need the
 * Drive API with OAuth or a service account — out of scope for v1.
 */

import crypto from "node:crypto";

/** Pull the document ID from any Google Docs URL shape. */
export function extractDocId(url: string): string | null {
  // Matches /document/d/<id>, /document/d/e/<id> (published), and the bare id.
  const m = url.match(/\/document\/d\/(?:e\/)?([a-zA-Z0-9_-]+)/);
  if (m) return m[1];
  // Last-resort: a bare 20+ char id-looking string
  if (/^[a-zA-Z0-9_-]{20,}$/.test(url)) return url;
  return null;
}

export function previewUrl(docId: string): string {
  return `https://docs.google.com/document/d/${docId}/preview`;
}

export interface FetchResult {
  ok: boolean;
  hash?: string;
  bytes?: number;
  error?: string;
}

/**
 * Fetch the plain-text export of a Google Doc. Works without auth iff the
 * doc is shared as "Anyone with the link". Otherwise Google returns an
 * HTML sign-in page; we detect that via Content-Type and surface a useful
 * error to the teacher.
 */
export async function fetchDocContent(docId: string): Promise<FetchResult> {
  const url = `https://docs.google.com/document/d/${docId}/export?format=txt`;
  let res: Response;
  try {
    res = await fetch(url, { redirect: "follow" });
  } catch (err) {
    return { ok: false, error: `Network error: ${(err as Error).message}` };
  }

  if (!res.ok) {
    return { ok: false, error: `Google returned HTTP ${res.status}. Make sure the doc is shareable as "Anyone with the link".` };
  }

  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("text/plain")) {
    return {
      ok: false,
      error: `Got Content-Type "${contentType}". Doc is probably private — set sharing to "Anyone with the link can view".`,
    };
  }

  const text = await res.text();
  const buf = Buffer.from(text, "utf8");
  const hash = crypto.createHash("sha256").update(buf).digest("hex");
  return { ok: true, hash, bytes: buf.length };
}
