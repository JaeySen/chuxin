import { useEffect, useState, useCallback } from "react";
import { Navigate } from "react-router-dom";
import { apiFetch, invalidateAuthConfigCache } from "../lib/api";
import { useAuth } from "../lib/auth-context";

interface Settings {
  enforce_cross_ip_lock?: boolean;
  allow_signup?: boolean;
  disable_email_login?: boolean;
  allow_phone_login?: boolean;
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

function fmt(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleString("vi-VN");
}

function eventLabel(t: AuthEvent["eventType"]): string {
  if (t === "cross_ip_blocked") return "Đăng nhập khác IP — đã khóa";
  if (t === "soft_cross_ip") return "Đăng nhập khác IP (soft mode)";
  return "Đã mở khóa";
}

export function AdminDashboard() {
  const { user, role, loading } = useAuth();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [events, setEvents] = useState<AuthEvent[] | null>(null);
  const [showResolved, setShowResolved] = useState(false);
  const [users, setUsers] = useState<UserRow[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setErr(null);
    try {
      const [s, e, u] = await Promise.all([
        apiFetch<Settings>("/admin/settings"),
        apiFetch<AuthEvent[]>(`/admin/auth-events?resolved=${showResolved}`),
        apiFetch<UserRow[]>("/admin/users"),
      ]);
      setSettings(s);
      setEvents(e);
      setUsers(u);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : String(e));
    }
  }, [showResolved]);

  useEffect(() => {
    if (role === "admin") refresh();
  }, [role, refresh]);

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
      const s = await apiFetch<Settings>("/admin/settings", {
        method: "PATCH",
        body: JSON.stringify(patch),
      });
      setSettings(s);
      invalidateAuthConfigCache(); // so modal picks up new config on next open
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally { setBusyKey(null); }
  }

  async function unlockFromEvent(eventId: number) {
    setBusyKey(`event-${eventId}`);
    try {
      await apiFetch(`/admin/auth-events/${eventId}/unlock`, { method: "POST", body: JSON.stringify({}) });
      await refresh();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally { setBusyKey(null); }
  }

  async function unlockFromUserList(userId: string) {
    setBusyKey(`user-${userId}`);
    try {
      await apiFetch(`/admin/users/${userId}/unlock`, { method: "POST" });
      await refresh();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally { setBusyKey(null); }
  }

  const enforce   = !!settings?.enforce_cross_ip_lock;
  const allowSignup     = settings?.allow_signup !== false;
  const disableEmail    = !!settings?.disable_email_login;
  const allowPhone      = settings?.allow_phone_login !== false;

  const TOGGLES: Array<{
    key: keyof Settings;
    label: string;
    onDesc: string;
    offDesc: string;
    value: boolean;
  }> = [
    {
      key: "enforce_cross_ip_lock",
      label: "Tự động khóa khi đăng nhập từ mạng khác (hard mode)",
      onDesc: "BẬT: khóa tài khoản + đăng xuất phiên cũ ngay lập tức. Phải mở khóa thủ công.",
      offDesc: "TẮT (soft mode): chỉ ghi log, vẫn cho đăng nhập.",
      value: enforce,
    },
    {
      key: "allow_signup",
      label: "Cho phép học viên tự tạo tài khoản",
      onDesc: "BẬT: nút \"Tạo tài khoản\" hiển thị trên form đăng nhập.",
      offDesc: "TẮT: ẩn nút tạo tài khoản — chỉ admin/giáo viên mới tạo được.",
      value: allowSignup,
    },
    {
      key: "disable_email_login",
      label: "Tắt đăng nhập bằng email (dùng số điện thoại thay thế)",
      onDesc: "BẬT: form chỉ hiển thị trường số điện thoại (ẩn email).",
      offDesc: "TẮT: form hiển thị email như bình thường.",
      value: disableEmail,
    },
    {
      key: "allow_phone_login",
      label: "Cho phép đăng nhập bằng số điện thoại",
      onDesc: "BẬT: người dùng có thể đặt mật khẩu và đăng nhập bằng số điện thoại.",
      offDesc: "TẮT: tùy chọn đăng nhập bằng số điện thoại bị ẩn.",
      value: allowPhone,
    },
  ];

  return (
    <div className="container" style={{ padding: "28px 20px 80px" }}>
      <h1 style={{ color: "var(--c-red-dark)", marginTop: 0 }}>Bảng quản trị</h1>
      <p className="muted">Tạo tài khoản, cấu hình đăng nhập, kiểm tra và mở khóa tài khoản.</p>

      {err && <div className="feedback feedback-bad" style={{ marginTop: 12 }}>{err}</div>}

      {/* Create user */}
      <section className="lesson-card" style={{ marginTop: 20 }}>
        <h3 style={{ marginTop: 0 }}>Tạo tài khoản mới</h3>
        <CreateUserForm onCreated={refresh} />
      </section>

      {/* Settings card */}
      <section className="lesson-card" style={{ marginTop: 20 }}>
        <h3 style={{ marginTop: 0 }}>Cấu hình đăng nhập &amp; bảo mật</h3>
        {TOGGLES.map((t) => (
          <label key={t.key} className="ws-checkbox-row" style={{ gap: 12, marginBottom: 14 }}>
            <input
              type="checkbox"
              checked={t.value}
              disabled={busyKey === "settings" || !settings}
              onChange={(e) => patchSettings({ [t.key]: e.target.checked })}
            />
            <div>
              <div style={{ fontWeight: 600 }}>{t.label}</div>
              <div className="muted" style={{ fontSize: 13 }}>
                {t.value ? t.onDesc : t.offDesc}
              </div>
            </div>
          </label>
        ))}

      </section>

      {/* Auth events */}
      <section className="lesson-card" style={{ marginTop: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0 }}>
            Sự kiện đăng nhập {events && `(${events.length})`}
          </h3>
          <label className="ws-checkbox-row" style={{ margin: 0, fontSize: 13 }}>
            <input
              type="checkbox"
              checked={showResolved}
              onChange={(e) => setShowResolved(e.target.checked)}
            />
            <span className="muted">Hiện cả đã xử lý</span>
          </label>
        </div>

        {!events && <div className="muted">Đang tải…</div>}
        {events && events.length === 0 && (
          <div className="feedback feedback-info" style={{ marginTop: 12 }}>
            Không có sự kiện nào cần xử lý.
          </div>
        )}
        {events && events.length > 0 && (
          <div style={{ overflowX: "auto", marginTop: 12 }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Thời gian</th>
                  <th>Học viên</th>
                  <th>Loại</th>
                  <th>IP cũ</th>
                  <th>IP mới</th>
                  <th>Trạng thái</th>
                  <th></th>
                </tr>
              </thead>
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
                        <button
                          className="btn btn-secondary btn-sm"
                          disabled={busyKey === `event-${e.id}`}
                          onClick={() => unlockFromEvent(e.id)}
                        >
                          Mở khóa
                        </button>
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
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Tên</th>
                  <th>Vai trò</th>
                  <th>Trạng thái</th>
                  <th>Lý do khóa</th>
                  <th></th>
                </tr>
              </thead>
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
                        <button
                          className="btn btn-secondary btn-sm"
                          disabled={busyKey === `user-${u.id}`}
                          onClick={() => unlockFromUserList(u.id)}
                        >
                          Mở khóa
                        </button>
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

function CreateUserForm({ onCreated }: { onCreated: () => void }) {
  const [method, setMethod] = useState<"email" | "phone">("email");
  const [email, setEmail]           = useState("");
  const [phone, setPhone]           = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword]     = useState("");
  const [role, setRole]             = useState<"student" | "teacher" | "admin">("student");
  const [busy, setBusy]             = useState(false);
  const [err, setErr]               = useState<string | null>(null);
  const [ok, setOk]                 = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null); setOk(null);
    try {
      const body =
        method === "phone"
          ? { phone: phone.replace(/\D/g, ""), displayName, password, role }
          : { email, displayName, password, role };
      const created = await apiFetch<{ email: string; displayName: string; role: string }>(
        "/admin/users", { method: "POST", body: JSON.stringify(body) }
      );
      setOk(`Đã tạo tài khoản: ${created.displayName} (${method === "phone" ? phone : email}) — vai trò: ${role}`);
      setEmail(""); setPhone(""); setDisplayName(""); setPassword(""); setRole("student");
      onCreated();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally { setBusy(false); }
  }

  return (
    <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", gap: 8 }}>
        {(["email", "phone"] as const).map((m) => (
          <button key={m} type="button"
            className={`btn btn-sm ${method === m ? "btn-secondary" : "btn-ghost"}`}
            onClick={() => setMethod(m)}>
            {m === "email" ? "📧 Email" : "📱 Điện thoại"}
          </button>
        ))}
      </div>

      <div className="doc-form-row">
        <label>
          <span>Tên hiển thị *</span>
          <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} required maxLength={80} />
        </label>
        <label>
          <span>{method === "email" ? "Email *" : "Số điện thoại *"}</span>
          {method === "email" ? (
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          ) : (
            <input type="tel" inputMode="numeric" pattern="[0-9]*" placeholder="0901234567"
              value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))} required />
          )}
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
      {ok  && <div className="feedback feedback-ok">{ok}</div>}

      <button type="submit" className="btn btn-primary" disabled={busy}
        style={{ alignSelf: "flex-start" }}>
        {busy ? "Đang tạo…" : "Tạo tài khoản"}
      </button>
    </form>
  );
}
