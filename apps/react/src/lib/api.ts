import { auth } from "./firebase";

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:4000";

// ── Low-level fetch ────────────────────────────────────────────

async function buildHeaders(extra?: HeadersInit): Promise<HeadersInit> {
  const idToken = await auth.currentUser?.getIdToken().catch(() => null);
  const sessionToken = localStorage.getItem("sessionToken");
  return {
    "Content-Type": "application/json",
    ...(idToken       && { Authorization: `Bearer ${idToken}` }),
    ...(sessionToken  && { "X-Session-Token": sessionToken }),
    ...extra,
  };
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const headers = await buildHeaders(init.headers);
  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });

  if (res.status === 401) {
    // The server rejected our session; clean up local state.
    // auth-context's Firestore listener will sign the user out.
    localStorage.removeItem("sessionToken");
    throw new SessionExpiredError();
  }

  if (!res.ok) {
    const body: { error?: string } = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export class SessionExpiredError extends Error {
  constructor() {
    super("Session expired — please sign in again");
    this.name = "SessionExpiredError";
  }
}

// ── Auth helpers (called by auth-context, no pre-existing token needed) ──

export async function createSession(idToken: string): Promise<string | null> {
  const existingSessionToken = localStorage.getItem("sessionToken") ?? undefined;
  try {
    const res = await fetch(`${API_BASE}/auth/session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken, existingSessionToken }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { sessionToken?: string };
    return data.sessionToken ?? null;
  } catch {
    // API unreachable in dev without the server running — degrade gracefully
    return null;
  }
}

export async function deleteSession(): Promise<void> {
  const idToken = await auth.currentUser?.getIdToken().catch(() => null);
  const sessionToken = localStorage.getItem("sessionToken");
  if (!idToken || !sessionToken) return;
  await fetch(`${API_BASE}/auth/session`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${idToken}`,
      "X-Session-Token": sessionToken,
    },
  }).catch(() => {});
}
