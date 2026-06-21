const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:4000";

export type GiaoVuRole = "teacher" | "admin" | "staff" | "assistant";

export interface GiaoVuUser {
  id: string;
  email: string;
  displayName: string;
  role: GiaoVuRole;
}

function getJwt(): string | null { return localStorage.getItem("gv_jwt"); }
function getSession(): string | null { return localStorage.getItem("gv_session"); }

export function storeAuth(jwt: string, sessionToken: string) {
  localStorage.setItem("gv_jwt", jwt);
  localStorage.setItem("gv_session", sessionToken);
}
export function clearAuth() {
  localStorage.removeItem("gv_jwt");
  localStorage.removeItem("gv_session");
}

export async function apiFetch<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
  const jwt = getJwt();
  const session = getSession();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string> ?? {}),
  };
  if (jwt) headers["Authorization"] = `Bearer ${jwt}`;
  if (session) headers["X-Session-Token"] = session;

  const res = await fetch(`${API_BASE}/giaovu${path}`, { ...init, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as Record<string, unknown>;
    throw new Error((body.message as string) || (body.error as string) || `HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export async function apiLogin(email: string, password: string): Promise<{ user: GiaoVuUser; jwt: string; sessionToken: string }> {
  const res = await fetch(`${API_BASE}/giaovu/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as Record<string, unknown>;
    throw new Error((body.message as string) || (body.error as string) || `HTTP ${res.status}`);
  }
  return res.json();
}

// ── Domain types ────────────────────────────────────────────────────────────

export interface GvClass {
  id: string;
  name: string;
  class_code: string | null;
  course_id: string;
  teacher_id: string | null;
  teacher_name: string | null;
  schedule: { days: string[]; clock_in: string; clock_out: string } | null;
  start_date: string | null;
  end_date: string | null;
  status: "active" | "completed" | "cancelled";
  max_students: number;
  student_count: number;
}

export interface GvStudentSearch {
  id: string;
  displayName: string;
  email: string;
  phone: string | null;
}

export interface GvSession {
  id: string;
  class_id: string;
  session_date: string;
  start_time: string;
  end_time: string;
  topic: string | null;
  notes: string | null;
}

export interface GvStudent {
  id: string;
  email: string;
  display_name: string;
  phone: string | null;
  date_of_birth: string | null;
  parent_name: string | null;
  parent_phone: string | null;
  enrollment_id: string;
  enrollment_status: "active" | "dropped" | "completed";
  enrolled_at: string;
  notes: string | null;
}

export interface GvCheckin {
  id: string;
  session_id: string;
  student_id: string;
  student_name: string;
  student_email: string;
  status: "present" | "absent" | "late" | "excused";
  note: string | null;
  marked_at: string;
}

export interface GvMaterial {
  id: string;
  class_id: string;
  session_id: string | null;
  title: string;
  type: "lesson" | "homework" | "reference" | "announcement";
  google_url: string | null;
  description: string | null;
  due_date: string | null;
  created_by_name: string | null;
  session_date: string | null;
  session_topic: string | null;
  created_at: string;
}

export interface GvSubmission {
  id: string;
  material_id: string;
  student_id: string;
  student_name: string;
  student_email: string;
  google_url: string | null;
  note: string | null;
  submitted_at: string;
  status: "submitted" | "reviewed" | "needs_revision";
  score: number | null;
  feedback: string | null;
  reviewer_name: string | null;
  reviewed_at: string | null;
}

export interface GvStaffUser {
  id: string;
  email: string;
  display_name: string;
  role: string;
  phone: string | null;
  date_of_birth: string | null;
  parent_name: string | null;
  parent_phone: string | null;
  address: string | null;
  notes: string | null;
}
