// Despite the filename (kept for import-path stability), this module now talks
// to the self-hosted API instead of Firebase. Public export surface is preserved
// so existing HTML/JS call sites continue to work.

const API_BASE = window.HANAI_API_URL ?? "http://localhost:4000";
const JWT_KEY = "jwt";
const SESSION_KEY = "sessionToken";

function getJwt() {
  return localStorage.getItem(JWT_KEY);
}
function getSessionToken() {
  return localStorage.getItem(SESSION_KEY);
}
function storeCredentials(jwt, sessionToken) {
  localStorage.setItem(JWT_KEY, jwt);
  localStorage.setItem(SESSION_KEY, sessionToken);
  notifyAuthChanged();
}
function clearCredentials() {
  localStorage.removeItem(JWT_KEY);
  localStorage.removeItem(SESSION_KEY);
  _cachedUser = null;
  notifyAuthChanged();
}

let _cachedUser = null;
const _authListeners = new Set();

function notifyAuthChanged() {
  for (const fn of _authListeners) {
    try { fn(_cachedUser); } catch { /* swallow listener errors */ }
  }
}

export async function apiFetch(path, init = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(getJwt() && { Authorization: `Bearer ${getJwt()}` }),
    ...(getSessionToken() && { "X-Session-Token": getSessionToken() }),
    ...(init.headers ?? {}),
  };
  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  if (res.status === 401) {
    clearCredentials();
    throw new Error("Session expired");
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }
  return res.json();
}

// ── auth state surface (compat with Firebase Auth shape) ────────

export const auth = {
  get currentUser() {
    return _cachedUser;
  },
};

export const googleProvider = {}; // placeholder — Google sign-in not yet implemented

export function onAuthStateChanged(_authArg, callback) {
  _authListeners.add(callback);
  // Fire once asynchronously with the current state, mirroring Firebase behavior.
  Promise.resolve().then(() => callback(_cachedUser));
  return () => _authListeners.delete(callback);
}

// Hydrate current user from the API on module load.
(async function bootstrap() {
  if (!getJwt()) {
    notifyAuthChanged();
    return;
  }
  try {
    _cachedUser = await apiFetch("/auth/me");
  } catch {
    _cachedUser = null;
  }
  notifyAuthChanged();
})();

// ── sign-in / sign-up / sign-out ────────────────────────────────

export async function signInWithEmailAndPassword(_auth, email, password) {
  const data = await apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  storeCredentials(data.jwt, data.sessionToken);
  _cachedUser = data.user;
  notifyAuthChanged();
  return { user: data.user };
}

export async function createUserWithEmailAndPassword(_auth, email, password) {
  const displayName = email.split("@")[0] || "Học viên";
  const data = await apiFetch("/auth/signup", {
    method: "POST",
    body: JSON.stringify({ email, password, displayName }),
  });
  storeCredentials(data.jwt, data.sessionToken);
  _cachedUser = data.user;
  notifyAuthChanged();
  return { user: data.user };
}

export async function signInWithPopup() {
  throw new Error("Google sign-in is not configured yet.");
}

export async function signOut() {
  try {
    await apiFetch("/auth/session", { method: "DELETE" });
  } catch {
    // best-effort
  }
  clearCredentials();
}

// ── user doc bootstrap (no-op now — server creates user row on signup) ──

export async function ensureUserDoc(_user) {
  // No-op — the API creates the user row at signup time.
}

// ── lesson reads ────────────────────────────────────────────────

export async function fetchLesson(lessonId) {
  try {
    return await apiFetch(`/lessons/${encodeURIComponent(lessonId)}`);
  } catch (err) {
    if (/HTTP 404/.test(err.message)) return null;
    throw err;
  }
}

export async function fetchCourseLessons(courseId) {
  return apiFetch(`/courses/${encodeURIComponent(courseId)}/lessons`);
}

// ── progress reads (for me.html) ────────────────────────────────

export async function fetchAllProgress() {
  return apiFetch("/progress");
}
