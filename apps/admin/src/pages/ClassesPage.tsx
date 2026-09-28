import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Shell } from "../components/Shell";
import { apiFetch, type GvClass } from "../lib/api";
import { useAuth } from "../lib/auth-context";

const STATUS_LABELS: Record<string, string> = {
  active: "Đang học", completed: "Đã xong", cancelled: "Đã huỷ",
};

const ALL_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
type WeekDay = typeof ALL_DAYS[number];
const DAY_VI: Record<WeekDay, string> = {
  Mon: "T2", Tue: "T3", Wed: "T4", Thu: "T5", Fri: "T6", Sat: "T7", Sun: "CN",
};
const COURSES = ["han1","han2","han3","han4","han5","han6","thuong-mai","tre-em"];

function fmtDate(s: string | null) {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("vi-VN");
}

function fmtSchedule(s: GvClass["schedule"]): string {
  if (!s) return "—";
  const days = s.days.map((d) => DAY_VI[d as WeekDay] ?? d).join(", ");
  return `${days} · ${s.clock_in}–${s.clock_out}`;
}

export function ClassesPage() {
  const { user } = useAuth();
  const [classes, setClasses] = useState<GvClass[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Form fields
  const [name, setName]           = useState("");
  const [classCode, setClassCode] = useState("");
  const [courseId, setCourseId]   = useState("han1");
  const [days, setDays]           = useState<WeekDay[]>([]);
  const [clockIn, setClockIn]     = useState("19:30");
  const [clockOut, setClockOut]   = useState("21:00");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate]     = useState("");
  const [busy, setBusy]           = useState(false);

  const canCreate = user?.role === "staff" || user?.role === "admin";

  function toggleDay(d: WeekDay) {
    setDays((prev) => prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]);
  }

  function resetForm() {
    setName(""); setClassCode(""); setDays([]);
    setClockIn("19:30"); setClockOut("21:00");
    setStartDate(""); setEndDate(""); setCourseId("han1");
  }

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
      const schedule = days.length > 0
        ? { days, clock_in: clockIn, clock_out: clockOut }
        : undefined;
      await apiFetch("/classes", {
        method: "POST",
        body: JSON.stringify({
          name, courseId,
          classCode: classCode.trim() || undefined,
          schedule,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        }),
      });
      resetForm(); setShowForm(false);
      load();
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  }

  return (
    <Shell title="Lớp học">
      <div className="gv-page-header">
        <h1>Lớp học</h1>
        {canCreate && (
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? "Huỷ" : "+ Tạo lớp mới"}
          </button>
        )}
      </div>

      {err && <div className="feedback feedback-bad" style={{ marginBottom: 12 }}>{err}</div>}

      {showForm && (
        <div className="gv-card" style={{ marginBottom: 16 }}>
          <div className="gv-card-title">Tạo lớp mới</div>
          <form className="gv-form" onSubmit={createClass}>
            {/* Row 1: name + code */}
            <div className="gv-form-row">
              <div className="gv-field" style={{ gridColumn: "1 / 3" }}>
                <label>Tên lớp *</label>
                <input value={name} onChange={(e) => setName(e.target.value)} required
                  placeholder="HSK 1 – Thứ 2/4/6 19h30" />
              </div>
              <div className="gv-field">
                <label>Mã lớp</label>
                <input value={classCode} onChange={(e) => setClassCode(e.target.value)}
                  placeholder="VD: HSK1-A" maxLength={20} />
              </div>
              <div className="gv-field">
                <label>Khoá học</label>
                <select value={courseId} onChange={(e) => setCourseId(e.target.value)}>
                  {COURSES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {/* Row 2: schedule */}
            <div className="gv-field">
              <label>Lịch học</label>
              <div className="gv-day-row">
                {ALL_DAYS.map((d) => (
                  <button key={d} type="button"
                    className={`gv-day-btn ${days.includes(d) ? "gv-day-btn--on" : ""}`}
                    onClick={() => toggleDay(d)}>
                    {DAY_VI[d]}
                  </button>
                ))}
                <label className="gv-time-field">
                  <span>Vào</span>
                  <input type="time" value={clockIn} onChange={(e) => setClockIn(e.target.value)} className="gv-time-input" />
                </label>
                <label className="gv-time-field">
                  <span>Ra</span>
                  <input type="time" value={clockOut} onChange={(e) => setClockOut(e.target.value)} className="gv-time-input" />
                </label>
              </div>
            </div>

            {/* Row 3: dates */}
            <div className="gv-form-row">
              <div className="gv-field">
                <label>Ngày khai giảng</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div className="gv-field">
                <label>Ngày bế giảng</label>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button type="submit" className="btn btn-primary btn-sm" disabled={busy}>
                {busy ? "Đang tạo…" : "Tạo lớp"}
              </button>
              <button type="button" className="btn btn-ghost btn-sm"
                onClick={() => { resetForm(); setShowForm(false); }}>Huỷ</button>
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
                  <th>Mã</th><th>Tên lớp</th><th>Khoá</th><th>Lịch học</th>
                  <th>Khai – Bế giảng</th><th>Giáo viên</th>
                  <th>Học viên</th><th>Trạng thái</th><th></th>
                </tr></thead>
                <tbody>
                  {classes.map((c) => (
                    <tr key={c.id}>
                      <td><code style={{ fontSize: 12 }}>{c.class_code ?? "—"}</code></td>
                      <td style={{ fontWeight: 600 }}>{c.name}</td>
                      <td>{c.course_id}</td>
                      <td style={{ whiteSpace: "nowrap", fontSize: 13 }}>{fmtSchedule(c.schedule)}</td>
                      <td style={{ fontSize: 12, whiteSpace: "nowrap" }}>
                        {fmtDate(c.start_date)} → {fmtDate(c.end_date)}
                      </td>
                      <td>{c.teacher_name ?? <span className="muted">—</span>}</td>
                      <td>{c.student_count} / {c.max_students}</td>
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
