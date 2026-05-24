import { useEffect, useState, useCallback } from "react";
import { Navigate } from "react-router-dom";
import { apiFetch } from "../lib/api";
import { useAuth } from "../lib/auth-context";

interface Settings {
  enforce_cross_ip_lock?: boolean;
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

  async function toggleEnforce(next: boolean) {
    setBusyKey("settings");
    try {
      const s = await apiFetch<Settings>("/admin/settings", {
        method: "PATCH",
        body: JSON.stringify({ enforce_cross_ip_lock: next }),
      });
      setSettings(s);
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

  const enforce = !!settings?.enforce_cross_ip_lock;

  return (
    <div className="container" style={{ padding: "28px 20px 80px" }}>
      <h1 style={{ color: "var(--c-red-dark)", marginTop: 0 }}>Bảng quản trị</h1>
      <p className="muted">Bảo mật đăng nhập học viên, kiểm tra và mở khóa tài khoản.</p>

      {err && <div className="feedback feedback-bad" style={{ marginTop: 12 }}>{err}</div>}

      {/* Settings card */}
      <section className="lesson-card" style={{ marginTop: 20 }}>
        <h3 style={{ marginTop: 0 }}>Cấu hình bảo mật</h3>
        <label className="ws-checkbox-row" style={{ gap: 12 }}>
          <input
            type="checkbox"
            checked={enforce}
            disabled={busyKey === "settings" || !settings}
            onChange={(e) => toggleEnforce(e.target.checked)}
          />
          <div>
            <div style={{ fontWeight: 600 }}>
              Tự động đăng xuất khi phát hiện đăng nhập từ mạng khác (hard mode)
            </div>
            <div className="muted" style={{ fontSize: 13 }}>
              {enforce
                ? "Đang BẬT: học viên đăng nhập từ IP khác sẽ bị khóa tài khoản + đăng xuất phiên cũ. Phải mở khóa thủ công."
                : "Đang TẮT (soft mode): cho phép đăng nhập đa IP, chỉ ghi log để xem xét."}
            </div>
          </div>
        </label>
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
