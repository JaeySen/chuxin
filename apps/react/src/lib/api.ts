const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:4000";

export interface AuthUser {
  id: string;
  email: string;
  phone: string | null;
  displayName: string;
  role: "student" | "teacher" | "admin";
}

export interface AuthConfig {
  allowSignup: boolean;
  disableEmailLogin: boolean;
  allowPhoneLogin: boolean;
}

const JWT_KEY = "jwt";
const SESSION_KEY = "sessionToken";

export function getStoredJwt(): string | null {
  return localStorage.getItem(JWT_KEY);
}
export function getStoredSessionToken(): string | null {
  return localStorage.getItem(SESSION_KEY);
}
export function storeCredentials(jwt: string, sessionToken: string): void {
  localStorage.setItem(JWT_KEY, jwt);
  localStorage.setItem(SESSION_KEY, sessionToken);
}
export function clearCredentials(): void {
  localStorage.removeItem(JWT_KEY);
  localStorage.removeItem(SESSION_KEY);
}

function buildHeaders(hasBody: boolean, extra?: HeadersInit): HeadersInit {
  const jwt = getStoredJwt();
  const sessionToken = getStoredSessionToken();
  return {
    ...(hasBody && { "Content-Type": "application/json" }),
    ...(jwt && { Authorization: `Bearer ${jwt}` }),
    ...(sessionToken && { "X-Session-Token": sessionToken }),
    ...extra,
  };
}

export class SessionExpiredError extends Error {
  constructor() {
    super("Session expired — please sign in again");
    this.name = "SessionExpiredError";
  }
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { ...init, headers: buildHeaders(!!init.body, init.headers) });

  if (res.status === 401) {
    clearCredentials();
    throw new SessionExpiredError();
  }
  if (!res.ok) {
    const body: { error?: string; message?: string } = await res.json().catch(() => ({}));
    const err = new Error(body.message ?? body.error ?? `HTTP ${res.status}`);
    (err as Error & { code?: string; status?: number }).code = body.error;
    (err as Error & { code?: string; status?: number }).status = res.status;
    throw err;
  }
  return res.json() as Promise<T>;
}

interface AuthResponse {
  jwt: string;
  sessionToken: string;
  user: AuthUser;
}

// Cached so every modal open doesn't re-fetch.
let configCache: AuthConfig | null = null;

export async function apiAuthConfig(): Promise<AuthConfig> {
  if (configCache) return configCache;
  try {
    const cfg = await fetch(`${API_BASE}/auth/config`).then((r) => r.json() as Promise<AuthConfig>);
    configCache = cfg;
    return cfg;
  } catch {
    return { allowSignup: true, disableEmailLogin: false, allowPhoneLogin: true };
  }
}

export function invalidateAuthConfigCache(): void {
  configCache = null;
}

export async function apiSignup(input: {
  email?: string;
  phone?: string;
  password: string;
  displayName: string;
}): Promise<AuthUser> {
  const data = await apiFetch<AuthResponse>("/auth/signup", {
    method: "POST",
    body: JSON.stringify(input),
  });
  storeCredentials(data.jwt, data.sessionToken);
  return data.user;
}

export async function apiLogin(input: { email?: string; phone?: string; password: string }): Promise<AuthUser> {
  const data = await apiFetch<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
  storeCredentials(data.jwt, data.sessionToken);
  return data.user;
}

export async function apiLogout(): Promise<void> {
  try {
    await apiFetch("/auth/session", { method: "DELETE" });
  } catch {
    // best-effort
  } finally {
    clearCredentials();
  }
}

export async function apiMe(): Promise<AuthUser | null> {
  if (!getStoredJwt()) return null;
  try {
    return await apiFetch<AuthUser>("/auth/me");
  } catch {
    return null;
  }
}
