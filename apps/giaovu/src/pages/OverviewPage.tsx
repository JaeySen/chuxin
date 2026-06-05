import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Shell } from "../components/Shell";
import { apiFetch, type GvClass, type GvSession } from "../lib/api";
import { useAuth } from "../lib/auth-context";

function fmtDate(s: string | null) {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("vi-VN");
}
function fmtTime(t: string) {
  return t.slice(0, 5);
}

export function OverviewPage() {
  const { user } = useAuth();
  const [classes, setClasses] = useState<GvClass[]>([]);
  const [sessions, setSessions] = useState<GvSession[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      apiFetch<GvClass[]>("/classes"),
      apiFetch<GvSession[]>("/calendar"),
    ]).then(([cls, sess]) => {
      setClasses(cls);
      setSessions(sess);
    }).catch((e: unknown) => setErr(e instanceof Error ? e.message : String(e)));
  }, []);

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = sessions
    .filter((s) => s.session_date >= today)
    .slice(0, 5);

  const activeClasses = classes.filter((c) => c.status === "active");

  const roleLabel: Record<string, string> = {
    teacher: "Giáo viên", admin: "Quản trị viên", staff: "Nhân viên", assistant: "Trợ giảng",
  };

  return (
    <Shell title="Tổng quan">
      <div className="gv-page-header">
        <h1>Xin chào, {user?.displayName} 👋</h1>
        <span className="gv-badge gv-badge-active">{roleLabel[user?.role ?? ""] ?? user?.role}</span>
      </div>

      {err && <div className="feedback feedback-bad" style={{ marginBottom: 16 }}>{err}</div>}

      <div className="gv-stat-row">
        <div className="gv-stat">
          <div className="gv-stat-val">{activeClasses.length}</div>
          <div className="gv-stat-label">Lớp đang hoạt động</div>
        </div>
        <div className="gv-stat">
          <div className="gv-stat-val">{upcoming.length}</div>
          <div className="gv-stat-label">Buổi học sắp tới</div>
        </div>
        <div className="gv-stat">
          <div className="gv-stat-val">
            {activeClasses.reduce((s, c) => s + (c.student_count ?? 0), 0)}
          </div>
          <div className="gv-stat-label">Tổng học viên</div>
        </div>
      </div>

      {/* Upcoming sessions */}
      <div className="gv-card">
        <div className="gv-card-title">📅 Buổi học sắp tới</div>
        {upcoming.length === 0 ? (
          <div className="muted" style={{ fontSize: 14 }}>Không có buổi học nào được lên lịch.</div>
        ) : (
          <div className="gv-table-wrap">
            <table className="gv-table">
              <thead>
                <tr>
                  <th>Ngày</th>
                  <th>Giờ</th>
                  <th>Lớp</th>
                  <th>Chủ đề</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {upcoming.map((s) => (
                  <tr key={s.id}>
                    <td>{fmtDate(s.session_date)}</td>
                    <td>{fmtTime(s.start_time)} – {fmtTime(s.end_time)}</td>
                    <td><Link to={`/classes/${s.class_id}`} style={{ color: "var(--c-red-dark)", fontWeight: 600 }}>{(s as unknown as Record<string, string>).class_name ?? "—"}</Link></td>
                    <td className="muted">{s.topic ?? "—"}</td>
                    <td><Link to={`/sessions/${s.id}`} className="btn btn-sm btn-secondary">Điểm danh</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Active classes */}
      <div className="gv-card" style={{ marginTop: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div className="gv-card-title" style={{ margin: 0 }}>🏫 Lớp học của bạn</div>
          <Link to="/classes" className="btn btn-sm btn-ghost" style={{ color: "var(--c-red)" }}>Xem tất cả →</Link>
        </div>
        {activeClasses.length === 0 ? (
          <div className="muted" style={{ fontSize: 14 }}>Chưa có lớp nào.</div>
        ) : (
          <div className="gv-table-wrap">
            <table className="gv-table">
              <thead>
                <tr>
                  <th>Tên lớp</th>
                  <th>Khoá</th>
                  <th>Học viên</th>
                  <th>Khai giảng</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {activeClasses.map((c) => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 600 }}>{c.name}</td>
                    <td className="muted">{c.course_id}</td>
                    <td>{c.student_count} / {c.max_students}</td>
                    <td>{fmtDate(c.start_date)}</td>
                    <td><Link to={`/classes/${c.id}`} className="btn btn-sm btn-secondary">Mở lớp</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Shell>
  );
}
