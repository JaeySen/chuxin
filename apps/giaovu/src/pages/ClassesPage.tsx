import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Shell } from "../components/Shell";
import { apiFetch, type GvClass } from "../lib/api";
import { useAuth } from "../lib/auth-context";

const STATUS_LABELS: Record<string, string> = {
  active: "Đang học", completed: "Đã xong", cancelled: "Đã huỷ",
};

function fmtDate(s: string | null) {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("vi-VN");
}

export function ClassesPage() {
  const { user } = useAuth();
  const [classes, setClasses] = useState<GvClass[]>([]);
  const [err, setErr] = useState<string | null>(null);

  // Create class form (staff/admin only)
  const [showForm, setShowForm] = useState(false);
  const [name, setName]         = useState("");
  const [courseId, setCourseId] = useState("han1");
  const [startDate, setStartDate] = useState("");
  const [busy, setBusy]         = useState(false);

  const canCreate = user?.role === "staff" || user?.role === "admin";

  async function load() {
    try {
      setErr(null);
      setClasses(await apiFetch<GvClass[]>("/classes"));
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : String(e)); }
  }

  useEffect(() => { load(); }, []);

  async function createClass(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    try {
      await apiFetch("/classes", { method: "POST", body: JSON.stringify({ name, courseId, startDate: startDate || undefined }) });
      setName(""); setCourseId("han1"); setStartDate(""); setShowForm(false);
      load();
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  }

  const COURSES = ["han1","han2","han3","han4","han5","han6","thuong-mai","tre-em"];

  return (
    <Shell title="Lớp học">
      <div className="gv-page-header">
        <h1>Lớp học</h1>
        {canCreate && (
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>+ Tạo lớp mới</button>
        )}
      </div>

      {err && <div className="feedback feedback-bad" style={{ marginBottom: 12 }}>{err}</div>}

      {showForm && (
        <div className="gv-card" style={{ marginBottom: 16 }}>
          <div className="gv-card-title">Tạo lớp mới</div>
          <form className="gv-form" onSubmit={createClass}>
            <div className="gv-form-row">
              <div className="gv-field">
                <label>Tên lớp *</label>
                <input value={name} onChange={(e) => setName(e.target.value)} required
                  placeholder="HSK 1 – Thứ 2/4/6 19h30" />
              </div>
              <div className="gv-field">
                <label>Khoá học</label>
                <select value={courseId} onChange={(e) => setCourseId(e.target.value)}>
                  {COURSES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="gv-field">
                <label>Ngày khai giảng</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button type="submit" className="btn btn-primary btn-sm" disabled={busy}>
                {busy ? "Đang tạo…" : "Tạo lớp"}
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>Huỷ</button>
            </div>
          </form>
        </div>
      )}

      <div className="gv-card">
        {classes.length === 0
          ? <div className="muted">Chưa có lớp nào.</div>
          : <div className="gv-table-wrap">
              <table className="gv-table">
                <thead><tr>
                  <th>Tên lớp</th><th>Khoá</th><th>Giáo viên</th>
                  <th>Học viên</th><th>Khai giảng</th><th>Trạng thái</th><th></th>
                </tr></thead>
                <tbody>
                  {classes.map((c) => (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 600 }}>{c.name}</td>
                      <td>{c.course_id}</td>
                      <td>{c.teacher_name ?? <span className="muted">—</span>}</td>
                      <td>{c.student_count} / {c.max_students}</td>
                      <td>{fmtDate(c.start_date)}</td>
                      <td>
                        <span className={`gv-badge ${c.status === "active" ? "gv-badge-active" : "gv-badge-dropped"}`}>
                          {STATUS_LABELS[c.status] ?? c.status}
                        </span>
                      </td>
                      <td><Link to={`/classes/${c.id}`} className="btn btn-sm btn-secondary">Mở</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
        }
      </div>
    </Shell>
  );
}
