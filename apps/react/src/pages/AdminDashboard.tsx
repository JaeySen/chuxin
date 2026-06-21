import { useEffect, useState, useCallback } from "react";
import { Navigate } from "react-router-dom";
import { apiFetch, invalidateAuthConfigCache } from "../lib/api";
import { useAuth } from "../lib/auth-context";
import { COURSES } from "@sotam/shared";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Settings {
  enforce_cross_ip_lock?: boolean;
  allow_signup?: boolean;
  disable_email_login?: boolean;
  allow_phone_login?: boolean;
  guest_games_enabled?: boolean;
}

interface AuthEvent {
  id: number;
  userId: string;
  userEmail: string;
  userLocked: boolean;
  eventType: "cross_ip_blocked" | "soft_cross_ip" | "admin_unlock";
  attemptedIp: string | null;
  attemptedUserAgent: string | null;
  existingSessionIp: string | null;
  resolved: boolean;
  resolvedAt: string | null;
  note: string | null;
  createdAt: string;
}

interface UserRow {
  id: string;
  email: string;
  displayName: string;
  role: "student" | "teacher" | "admin";
  locked: boolean;
  lockedAt: string | null;
  lockedReason: string | null;
  createdAt: string;
}

type WeekDay = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";

interface ClassSchedule {
  days: WeekDay[];
  clock_in: string;
  clock_out: string;
}

interface ClassRow {
  id: string;
  name: string;
  classCode: string | null;
  courseId: string;
  status: string;
  teacherId: string | null;
  teacherName: string | null;
  schedule: ClassSchedule | null;
  startDate: string | null;
  endDate: string | null;
  enrolled: number;
  createdAt: string;
}

const DAY_LABELS: Record<WeekDay, string> = {
  Mon: "T2", Tue: "T3", Wed: "T4", Thu: "T5", Fri: "T6", Sat: "T7", Sun: "CN",
};
const ALL_DAYS: WeekDay[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleString("vi-VN");
}

function eventLabel(t: AuthEvent["eventType"]): string {
  if (t === "cross_ip_blocked") return "Đăng nhập khác IP — đã khóa";
  if (t === "soft_cross_ip") return "Đăng nhập khác IP (soft mode)";
  return "Đã mở khóa";
}

const COURSE_LABEL: Record<string, string> = Object.fromEntries(
  COURSES.map((c) => [c.id, c.title]),
);

// ── Main dashboard ────────────────────────────────────────────────────────────

export function AdminDashboard() {
  const { user, role, loading } = useAuth();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [events, setEvents]     = useState<AuthEvent[] | null>(null);
  const [showResolved, setShowResolved] = useState(false);
  const [users, setUsers]       = useState<UserRow[] | null>(null);
  const [classes, setClasses]   = useState<ClassRow[] | null>(null);
  const [err, setErr]           = useState<string | null>(null);
  const [busyKey, setBusyKey]   = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setErr(null);
    try {
      const [s, e, u, cl] = await Promise.all([
        apiFetch<Settings>("/admin/settings"),
        apiFetch<AuthEvent[]>(`/admin/auth-events?resolved=${showResolved}`),
        apiFetch<UserRow[]>("/admin/users"),
        apiFetch<ClassRow[]>("/admin/classes"),
      ]);
      setSettings(s); setEvents(e); setUsers(u); setClasses(cl);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : String(e));
    }
  }, [showResolved]);

  useEffect(() => { if (role === "admin") refresh(); }, [role, refresh]);

  if (loading) return <div className="container" style={{ padding: 40 }}><span className="muted">Đang tải…</span></div>;
  if (!user) return <Navigate to="/" replace />;
  if (role !== "admin") {
    return (
      <div className="container" style={{ padding: 40 }}>
        <h1 style={{ color: "var(--c-red-dark)" }}>Bảng quản trị</h1>
        <div className="feedback feedback-bad">Chỉ quản trị viên mới được truy cập trang này.</div>
      </div>
    );
  }

  async function patchSettings(patch: Partial<Settings>) {
    setBusyKey("settings");
    try {
      const s = await apiFetch<Settings>("/admin/settings", { method: "PATCH", body: JSON.stringify(patch) });
      setSettings(s);
      invalidateAuthConfigCache();
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : String(e)); }
    finally { setBusyKey(null); }
  }

  async function unlockFromEvent(eventId: number) {
    setBusyKey(`event-${eventId}`);
    try {
      await apiFetch(`/admin/auth-events/${eventId}/unlock`, { method: "POST", body: JSON.stringify({}) });
      await refresh();
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : String(e)); }
    finally { setBusyKey(null); }
  }

  async function unlockFromUserList(userId: string) {
    setBusyKey(`user-${userId}`);
    try {
      await apiFetch(`/admin/users/${userId}/unlock`, { method: "POST" });
      await refresh();
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : String(e)); }
    finally { setBusyKey(null); }
  }

  const enforce     = !!settings?.enforce_cross_ip_lock;
  const allowSignup = settings?.allow_signup !== false;
  const disableEmail = !!settings?.disable_email_login;
  const allowPhone  = settings?.allow_phone_login !== false;
  const guestGames  = !!settings?.guest_games_enabled;

  const TOGGLES: Array<{ key: keyof Settings; label: string; onDesc: string; offDesc: string; value: boolean }> = [
    { key: "enforce_cross_ip_lock", label: "Tự động khóa khi đăng nhập từ mạng khác (hard mode)", onDesc: "BẬT: khóa tài khoản + đăng xuất phiên cũ ngay lập tức.", offDesc: "TẮT (soft mode): chỉ ghi log, vẫn cho đăng nhập.", value: enforce },
    { key: "allow_signup", label: "Cho phép học viên tự tạo tài khoản", onDesc: "BẬT: nút \"Tạo tài khoản\" hiển thị trên form đăng nhập.", offDesc: "TẮT: ẩn nút tạo tài khoản.", value: allowSignup },
    { key: "disable_email_login", label: "Tắt đăng nhập bằng email", onDesc: "BẬT: form chỉ hiển thị trường số điện thoại.", offDesc: "TẮT: form hiển thị email như bình thường.", value: disableEmail },
    { key: "allow_phone_login", label: "Cho phép đăng nhập bằng số điện thoại", onDesc: "BẬT: người dùng có thể đăng nhập bằng số điện thoại.", offDesc: "TẮT: tùy chọn đăng nhập bằng số điện thoại bị ẩn.", value: allowPhone },
    { key: "guest_games_enabled", label: "Cho phép khách tham gia trò chơi qua link mời", onDesc: "BẬT: khách vào Bingo / Tìm từ bằng link mời.", offDesc: "TẮT: bắt buộc đăng nhập mới được tham gia.", value: guestGames },
  ];

  const teachers = (users ?? []).filter((u) => u.role === "teacher");

  return (
    <div className="container" style={{ padding: "28px 20px 80px" }}>
      <h1 style={{ color: "var(--c-red-dark)", marginTop: 0 }}>Bảng quản trị</h1>
      <p className="muted">Tạo tài khoản, quản lý lớp học, cấu hình đăng nhập.</p>

      {err && <div className="feedback feedback-bad" style={{ marginTop: 12 }}>{err}</div>}

      {/* Create user */}
      <section className="lesson-card" style={{ marginTop: 20 }}>
        <h3 style={{ marginTop: 0 }}>Tạo tài khoản mới</h3>
        <CreateUserForm classes={classes ?? []} teachers={teachers} onCreated={refresh} />
      </section>

      {/* Classes */}
      <section className="lesson-card" style={{ marginTop: 20 }}>
        <h3 style={{ marginTop: 0 }}>Quản lý lớp học ({classes?.length ?? 0})</h3>
        <ClassesSection classes={classes ?? []} teachers={teachers} onChanged={refresh} />
      </section>

      {/* Settings */}
      <section className="lesson-card" style={{ marginTop: 20 }}>
        <h3 style={{ marginTop: 0 }}>Cấu hình đăng nhập & bảo mật</h3>
        {TOGGLES.map((t) => (
          <label key={t.key} className="ws-checkbox-row" style={{ gap: 12, marginBottom: 14 }}>
            <input type="checkbox" checked={t.value}
              disabled={busyKey === "settings" || !settings}
              onChange={(e) => patchSettings({ [t.key]: e.target.checked })} />
            <div>
              <div style={{ fontWeight: 600 }}>{t.label}</div>
              <div className="muted" style={{ fontSize: 13 }}>{t.value ? t.onDesc : t.offDesc}</div>
            </div>
          </label>
        ))}
      </section>

      {/* Auth events */}
      <section className="lesson-card" style={{ marginTop: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0 }}>Sự kiện đăng nhập {events && `(${events.length})`}</h3>
          <label className="ws-checkbox-row" style={{ margin: 0, fontSize: 13 }}>
            <input type="checkbox" checked={showResolved} onChange={(e) => setShowResolved(e.target.checked)} />
            <span className="muted">Hiện cả đã xử lý</span>
          </label>
        </div>
        {!events && <div className="muted">Đang tải…</div>}
        {events?.length === 0 && <div className="feedback feedback-info" style={{ marginTop: 12 }}>Không có sự kiện nào cần xử lý.</div>}
        {events && events.length > 0 && (
          <div style={{ overflowX: "auto", marginTop: 12 }}>
            <table className="admin-table">
              <thead><tr><th>Thời gian</th><th>Học viên</th><th>Loại</th><th>IP cũ</th><th>IP mới</th><th>Trạng thái</th><th></th></tr></thead>
              <tbody>
                {events.map((e) => (
                  <tr key={e.id} className={e.resolved ? "row-resolved" : "row-unresolved"}>
                    <td>{fmt(e.createdAt)}</td>
                    <td>{e.userEmail}{e.userLocked && <span className="badge-locked">khóa</span>}</td>
                    <td>{eventLabel(e.eventType)}</td>
                    <td><code>{e.existingSessionIp ?? "—"}</code></td>
                    <td><code>{e.attemptedIp ?? "—"}</code></td>
                    <td>{e.resolved ? "Đã xử lý" : "Chờ xử lý"}</td>
                    <td>
                      {!e.resolved && e.eventType !== "admin_unlock" && (
                        <button className="btn btn-secondary btn-sm"
                          disabled={busyKey === `event-${e.id}`}
                          onClick={() => unlockFromEvent(e.id)}>Mở khóa</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Users */}
      <section className="lesson-card" style={{ marginTop: 20 }}>
        <h3 style={{ marginTop: 0 }}>Người dùng ({users?.length ?? 0})</h3>
        {!users && <div className="muted">Đang tải…</div>}
        {users && (
          <div style={{ overflowX: "auto" }}>
            <table className="admin-table">
              <thead><tr><th>Email</th><th>Tên</th><th>Vai trò</th><th>Trạng thái</th><th>Lý do khóa</th><th></th></tr></thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className={u.locked ? "row-unresolved" : ""}>
                    <td>{u.email}</td>
                    <td>{u.displayName}</td>
                    <td>{u.role}</td>
                    <td>{u.locked ? <span className="badge-locked">Đã khóa</span> : "OK"}</td>
                    <td className="muted" style={{ fontSize: 12 }}>{u.lockedReason ?? "—"}</td>
                    <td>
                      {u.locked && (
                        <button className="btn btn-secondary btn-sm"
                          disabled={busyKey === `user-${u.id}`}
                          onClick={() => unlockFromUserList(u.id)}>Mở khóa</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

// ── Create user form ──────────────────────────────────────────────────────────

function CreateUserForm({
  classes,
  teachers,
  onCreated,
}: {
  classes: ClassRow[];
  teachers: { id: string; displayName: string }[];
  onCreated: () => void;
}) {
  const [email, setEmail]           = useState("");
  const [phone, setPhone]           = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword]     = useState("");
  const [role, setRole]             = useState<"student" | "teacher" | "admin">("student");
  const [busy, setBusy]             = useState(false);
  const [err, setErr]               = useState<string | null>(null);
  const [createdUser, setCreatedUser] = useState<{ id: string; displayName: string; role: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null); setCreatedUser(null);
    try {
      const created = await apiFetch<{ id: string; displayName: string; role: string }>(
        "/admin/users", {
          method: "POST",
          body: JSON.stringify({ email, phone: phone.replace(/\D/g, ""), displayName, password, role }),
        }
      );
      setCreatedUser(created);
      setEmail(""); setPhone(""); setDisplayName(""); setPassword(""); setRole("student");
      onCreated();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally { setBusy(false); }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div className="doc-form-row">
          <label>
            <span>Tên hiển thị *</span>
            <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} required maxLength={80} />
          </label>
          <label>
            <span>Email *</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label>
            <span>Số điện thoại *</span>
            <input type="tel" inputMode="numeric" placeholder="0901234567"
              value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))} required />
          </label>
          <label>
            <span>Mật khẩu * (tối thiểu 8 ký tự)</span>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
          </label>
          <label>
            <span>Vai trò</span>
            <select value={role} onChange={(e) => setRole(e.target.value as typeof role)}
              style={{ padding: "9px 12px", border: "1.5px solid var(--c-divider)", borderRadius: 8, fontSize: 14 }}>
              <option value="student">Học viên</option>
              <option value="teacher">Giáo viên</option>
              <option value="admin">Quản trị viên</option>
            </select>
          </label>
        </div>
        {err && <div className="feedback feedback-bad">{err}</div>}
        <button type="submit" className="btn btn-primary" disabled={busy} style={{ alignSelf: "flex-start" }}>
          {busy ? "Đang tạo…" : "Tạo tài khoản"}
        </button>
      </form>

      {/* Class assignment step shown right after creation */}
      {createdUser && (
        <div className="adm-class-assign">
          <div className="adm-class-assign-title">
            ✓ Đã tạo <strong>{createdUser.displayName}</strong> ({createdUser.role})
            — Thêm vào lớp:
          </div>
          {createdUser.role === "student" ? (
            <EnrollStudentInline userId={createdUser.id} classes={classes} onDone={onCreated} />
          ) : createdUser.role === "teacher" ? (
            <AssignTeacherInline userId={createdUser.id} classes={classes} onDone={onCreated} />
          ) : (
            <span className="muted" style={{ fontSize: 13 }}>Admin không cần gán lớp.</span>
          )}
        </div>
      )}
    </div>
  );
}

// ── Enroll student into existing class ───────────────────────────────────────

function EnrollStudentInline({ userId, classes, onDone }: { userId: string; classes: ClassRow[]; onDone: () => void }) {
  const [classId, setClassId] = useState("");
  const [busy, setBusy]       = useState(false);
  const [ok, setOk]           = useState(false);

  async function enroll() {
    if (!classId) return;
    setBusy(true);
    try {
      await apiFetch(`/admin/classes/${classId}/enroll`, { method: "POST", body: JSON.stringify({ studentId: userId }) });
      setOk(true); onDone();
    } finally { setBusy(false); }
  }

  if (ok) return <span className="adm-ok">✓ Đã thêm vào lớp</span>;

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
      <select value={classId} onChange={(e) => setClassId(e.target.value)} className="adm-select">
        <option value="">— chọn lớp —</option>
        {classes.filter((c) => c.status === "active").map((c) => (
          <option key={c.id} value={c.id}>{c.name} ({COURSE_LABEL[c.courseId] ?? c.courseId})</option>
        ))}
      </select>
      <button className="btn btn-primary btn-sm" onClick={enroll} disabled={!classId || busy}>
        {busy ? "…" : "Thêm vào lớp"}
      </button>
    </div>
  );
}

// ── Assign teacher: existing class or create new ──────────────────────────────

function AssignTeacherInline({ userId, classes, onDone }: { userId: string; classes: ClassRow[]; onDone: () => void }) {
  const [mode, setMode]       = useState<"existing" | "new">("existing");
  const [classId, setClassId] = useState("");
  const [newName, setNewName] = useState("");
  const [newCourse, setNewCourse] = useState<string>(COURSES[0]?.id ?? "");
  const [busy, setBusy]       = useState(false);
  const [ok, setOk]           = useState<string | null>(null);

  async function assignExisting() {
    if (!classId) return;
    setBusy(true);
    try {
      await apiFetch(`/admin/classes/${classId}/teacher`, { method: "PATCH", body: JSON.stringify({ teacherId: userId }) });
      setOk(`Đã gán vào lớp "${classes.find((c) => c.id === classId)?.name}"`);
      onDone();
    } finally { setBusy(false); }
  }

  async function createAndAssign() {
    if (!newName.trim()) return;
    setBusy(true);
    try {
      const created = await apiFetch<{ id: string; name: string }>(
        "/admin/classes", { method: "POST", body: JSON.stringify({ name: newName.trim(), courseId: newCourse, teacherId: userId }) }
      );
      setOk(`Đã tạo lớp "${created.name}" và gán giáo viên`);
      onDone();
    } finally { setBusy(false); }
  }

  if (ok) return <span className="adm-ok">✓ {ok}</span>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", gap: 6 }}>
        {(["existing", "new"] as const).map((m) => (
          <button key={m} type="button"
            className={`btn btn-sm ${mode === m ? "btn-secondary" : "btn-ghost"}`}
            onClick={() => setMode(m)}>
            {m === "existing" ? "Gán vào lớp có sẵn" : "Tạo lớp mới (nhanh)"}
          </button>
        ))}
      </div>

      {mode === "existing" ? (
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <select value={classId} onChange={(e) => setClassId(e.target.value)} className="adm-select">
            <option value="">— chọn lớp —</option>
            {classes.filter((c) => c.status === "active").map((c) => (
              <option key={c.id} value={c.id}>{c.name}{c.classCode ? ` [${c.classCode}]` : ""}</option>
            ))}
          </select>
          <button className="btn btn-primary btn-sm" onClick={assignExisting} disabled={!classId || busy}>
            {busy ? "…" : "Gán giáo viên"}
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap" }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1, minWidth: 180 }}>
            <span style={{ fontSize: 13, color: "var(--c-text-soft)" }}>Tên lớp *</span>
            <input className="adm-input" value={newName} onChange={(e) => setNewName(e.target.value)}
              placeholder="VD: HSK1 - Thứ 2/4/6 19h30" />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 13, color: "var(--c-text-soft)" }}>Khoá học</span>
            <select className="adm-select" value={newCourse} onChange={(e) => setNewCourse(e.target.value)}>
              {COURSES.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </label>
          <button className="btn btn-primary btn-sm" onClick={createAndAssign} disabled={!newName.trim() || busy}>
            {busy ? "…" : "Tạo & gán"}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Classes management section ────────────────────────────────────────────────

function formatSchedule(s: ClassSchedule | null): string {
  if (!s) return "—";
  const days = s.days.map((d) => DAY_LABELS[d]).join(", ");
  return `${days} · ${s.clock_in}–${s.clock_out}`;
}

// ── Date helpers ──────────────────────────────────────────────────────────────

const DAY_JS: Record<WeekDay, number> = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 0 };

function localDate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// ── Calendar range picker ─────────────────────────────────────────────────────

function ClassDateRangePicker({
  days,
  start,
  end,
  onChange,
}: {
  days: WeekDay[];
  start: string;
  end: string;
  onChange: (start: string, end: string) => void;
}) {
  const now = new Date();
  const [viewYear,  setViewYear]  = useState(() => start ? localDate(start).getFullYear()  : now.getFullYear());
  const [viewMonth, setViewMonth] = useState(() => start ? localDate(start).getMonth()      : now.getMonth());

  const todayStr  = toDateStr(now);
  const allowedNums = new Set(days.map((d) => DAY_JS[d]));

  const MONTHS_VI = ["Tháng 1","Tháng 2","Tháng 3","Tháng 4","Tháng 5","Tháng 6",
                     "Tháng 7","Tháng 8","Tháng 9","Tháng 10","Tháng 11","Tháng 12"];
  const DOW_VI = ["T2","T3","T4","T5","T6","T7","CN"];

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  }

  // Build grid cells (Mon-first)
  const firstDow = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array<null>(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  function isAllowed(day: number): boolean {
    const date = new Date(viewYear, viewMonth, day);
    return allowedNums.size === 0 || allowedNums.has(date.getDay());
  }

  function handleClick(day: number) {
    if (!isAllowed(day)) return;
    const ds = toDateStr(new Date(viewYear, viewMonth, day));
    if (!start || (start && end)) {
      onChange(ds, "");
    } else if (ds >= start) {
      onChange(start, ds);
    } else {
      onChange(ds, "");
    }
  }

  function cellState(day: number | null): string {
    if (!day) return "cal-empty";
    const ds = toDateStr(new Date(viewYear, viewMonth, day));
    if (!isAllowed(day))               return "cal-cell cal-disabled";
    if (ds === start && ds === end)    return "cal-cell cal-start cal-end";
    if (ds === start)                  return "cal-cell cal-start";
    if (ds === end)                    return "cal-cell cal-end";
    if (start && end && ds > start && ds < end) return "cal-cell cal-range";
    if (ds === todayStr)               return "cal-cell cal-today";
    return "cal-cell";
  }

  return (
    <div className="cal-picker">
      <div className="cal-header">
        <button type="button" className="cal-nav" onClick={prevMonth}>‹</button>
        <span className="cal-month-label">{MONTHS_VI[viewMonth]} {viewYear}</span>
        <button type="button" className="cal-nav" onClick={nextMonth}>›</button>
      </div>
      <div className="cal-grid">
        {DOW_VI.map((d) => (
          <div key={d} className={`cal-dow${days.some((wd) => DAY_LABELS[wd] === d) ? " cal-dow--active" : ""}`}>{d}</div>
        ))}
        {cells.map((day, i) => (
          <div key={i} className={cellState(day)} onClick={() => day && handleClick(day)}>
            {day}
          </div>
        ))}
      </div>
      <div className="cal-summary">
        <span>{start ? `Từ: ${start}` : "Chưa chọn ngày khai giảng"}</span>
        {start && <span>{end ? ` → ${end}` : " (click ngày bế giảng)"}</span>}
        {(start || end) && (
          <button type="button" className="cal-clear" onClick={() => onChange("", "")}>✕ Xoá</button>
        )}
      </div>
    </div>
  );
}

// ── Class dots (session timeline) ─────────────────────────────────────────────

function ClassDots({ schedule, startDate, endDate }: {
  schedule: ClassSchedule | null;
  startDate: string | null;
  endDate: string | null;
}) {
  if (!schedule || !startDate || !endDate) return <span className="muted" style={{ fontSize: 11 }}>—</span>;
  const allowedNums = new Set(schedule.days.map((d) => DAY_JS[d]));
  const todayMs = new Date().setHours(0, 0, 0, 0);
  const dates: Date[] = [];
  const cur = localDate(startDate);
  const last = localDate(endDate);
  while (cur <= last && dates.length < 80) {
    if (allowedNums.has(cur.getDay())) dates.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
  }
  const excess = Math.max(0, dates.length - 60);
  return (
    <div className="class-dots">
      {dates.slice(0, 60).map((d, i) => (
        <span key={i}
          className={`class-dot ${d.getTime() < todayMs ? "class-dot--past" : "class-dot--future"}`}
          title={toDateStr(d)}
        />
      ))}
      {excess > 0 && <span className="muted" style={{ fontSize: 10 }}>+{excess}</span>}
    </div>
  );
}

// ── Classes management section ────────────────────────────────────────────────

function ClassesSection({ classes, teachers, onChanged }: { classes: ClassRow[]; teachers: { id: string; displayName: string }[]; onChanged: () => void }) {
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName]           = useState("");
  const [classCode, setClassCode] = useState("");
  const [courseId, setCourseId]   = useState<string>(COURSES[0]?.id ?? "");
  const [teacherId, setTeacherId] = useState("");
  const [days, setDays]           = useState<WeekDay[]>([]);
  const [clockIn, setClockIn]     = useState("19:30");
  const [clockOut, setClockOut]   = useState("21:00");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate]     = useState("");
  const [busy, setBusy]           = useState(false);
  const [err, setErr]             = useState<string | null>(null);

  function toggleDay(d: WeekDay) {
    setDays((prev) => prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]);
  }
  function resetForm() {
    setName(""); setClassCode(""); setTeacherId("");
    setDays([]); setClockIn("19:30"); setClockOut("21:00");
    setStartDate(""); setEndDate(""); setErr(null);
  }

  async function createClass(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true); setErr(null);
    try {
      const schedule = days.length > 0
        ? { days, clock_in: clockIn, clock_out: clockOut }
        : undefined;
      await apiFetch("/admin/classes", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          classCode: classCode.trim() || undefined,
          courseId,
          teacherId: teacherId || undefined,
          schedule,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        }),
      });
      resetForm(); setShowCreate(false); onChanged();
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {classes.length === 0 && !showCreate && <div className="muted">Chưa có lớp học nào.</div>}

      {classes.length > 0 && (
        <div style={{ overflowX: "auto" }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Mã</th><th>Tên lớp</th><th>Khoá</th>
                <th>Lịch học</th><th>Buổi học</th>
                <th>Giáo viên</th><th>HV</th><th>TT</th>
              </tr>
            </thead>
            <tbody>
              {classes.map((c) => (
                <tr key={c.id}>
                  <td><code style={{ fontWeight: 700, fontSize: 11 }}>{c.classCode ?? "—"}</code></td>
                  <td style={{ fontWeight: 600 }}>{c.name}</td>
                  <td style={{ fontSize: 12 }}>{COURSE_LABEL[c.courseId] ?? c.courseId}</td>
                  <td style={{ whiteSpace: "nowrap", fontSize: 12 }}>{formatSchedule(c.schedule)}</td>
                  <td><ClassDots schedule={c.schedule} startDate={c.startDate} endDate={c.endDate} /></td>
                  <td>{c.teacherName ?? <span className="muted">—</span>}</td>
                  <td>{c.enrolled}</td>
                  <td><span className={`adm-status adm-status--${c.status}`}>{c.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreate ? (
        <form onSubmit={createClass} className="adm-class-form">
          {/* Row 1: name + code */}
          <div className="adm-form-row">
            <label className="adm-field adm-field--grow">
              <span>Tên lớp *</span>
              <input className="adm-input" value={name} onChange={(e) => setName(e.target.value)}
                placeholder="VD: HSK1 Thứ 2/4/6 19h30" required />
            </label>
            <label className="adm-field">
              <span>Mã lớp</span>
              <input className="adm-input" value={classCode} onChange={(e) => setClassCode(e.target.value)}
                placeholder="HSK1-A" maxLength={20} style={{ width: 110 }} />
            </label>
          </div>

          {/* Row 2: course + teacher */}
          <div className="adm-form-row">
            <label className="adm-field">
              <span>Khoá học</span>
              <select className="adm-select" value={courseId} onChange={(e) => setCourseId(e.target.value)}>
                {COURSES.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </label>
            <label className="adm-field">
              <span>Giáo viên</span>
              <select className="adm-select" value={teacherId} onChange={(e) => setTeacherId(e.target.value)}>
                <option value="">— tuỳ chọn —</option>
                {teachers.map((t) => <option key={t.id} value={t.id}>{t.displayName}</option>)}
              </select>
            </label>
          </div>

          {/* Schedule: days + times */}
          <div className="adm-field">
            <span>Lịch học</span>
            <div className="adm-day-row">
              {ALL_DAYS.map((d) => (
                <button key={d} type="button"
                  className={`adm-day-btn ${days.includes(d) ? "adm-day-btn--on" : ""}`}
                  onClick={() => toggleDay(d)}>
                  {DAY_LABELS[d]}
                </button>
              ))}
              <label className="adm-field-inline">
                <span>Vào</span>
                <input type="time" className="adm-input adm-input--time" value={clockIn}
                  onChange={(e) => setClockIn(e.target.value)} />
              </label>
              <label className="adm-field-inline">
                <span>Ra</span>
                <input type="time" className="adm-input adm-input--time" value={clockOut}
                  onChange={(e) => setClockOut(e.target.value)} />
              </label>
            </div>
          </div>

          {/* Calendar range picker */}
          <div className="adm-field">
            <span>Khai giảng → Bế giảng</span>
            <ClassDateRangePicker
              days={days}
              start={startDate}
              end={endDate}
              onChange={(s, e) => { setStartDate(s); setEndDate(e); }}
            />
          </div>

          {err && <div className="feedback feedback-bad">{err}</div>}
          <div style={{ display: "flex", gap: 8 }}>
            <button type="submit" className="btn btn-primary btn-sm" disabled={busy}>{busy ? "Đang tạo…" : "Tạo lớp"}</button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => { resetForm(); setShowCreate(false); }}>Huỷ</button>
          </div>
        </form>
      ) : (
        <button className="btn btn-secondary btn-sm" style={{ alignSelf: "flex-start" }} onClick={() => setShowCreate(true)}>
          + Tạo lớp mới
        </button>
      )}
    </div>
  );
}
