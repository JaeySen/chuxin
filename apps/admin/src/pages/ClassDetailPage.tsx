import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Shell } from "../components/Shell";
import { apiFetch, type GvClass, type GvStudent, type GvMaterial, type GvSession, type GvStudentSearch } from "../lib/api";
import { useAuth } from "../lib/auth-context";

function fmtDate(s: string | null) {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("vi-VN");
}

const MAT_ICONS: Record<string, string> = {
  lesson: "📖", homework: "📝", reference: "📎", announcement: "📢",
};

export function ClassDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [cls, setCls]           = useState<GvClass | null>(null);
  const [students, setStudents] = useState<GvStudent[]>([]);
  const [sessions, setSessions] = useState<GvSession[]>([]);
  const [materials, setMaterials] = useState<GvMaterial[]>([]);
  const [tab, setTab]           = useState<"roster" | "sessions" | "materials">("roster");
  const [err, setErr]           = useState<string | null>(null);

  // Create session form
  const [showAddSession, setShowAddSession] = useState(false);
  const [sDate, setSDate] = useState("");
  const [sStart, setSStart] = useState("19:30");
  const [sEnd, setSEnd]     = useState("21:00");
  const [sTopic, setSTopic] = useState("");
  const [sBusy, setSBusy]   = useState(false);

  // Create material form
  const [showAddMat, setShowAddMat] = useState(false);
  const [mTitle, setMTitle]   = useState("");
  const [mType, setMType]     = useState<"lesson"|"homework"|"reference"|"announcement">("lesson");
  const [mUrl, setMUrl]       = useState("");
  const [mDesc, setMDesc]     = useState("");
  const [mDue, setMDue]       = useState("");
  const [mBusy, setMBusy]     = useState(false);

  const canWrite = user?.role === "teacher" || user?.role === "admin" || user?.role === "staff";

  async function load() {
    if (!id) return;
    try {
      setErr(null);
      const [c, st, sess, mat] = await Promise.all([
        apiFetch<GvClass>(`/classes/${id}`),
        apiFetch<GvStudent[]>(`/classes/${id}/students`),
        apiFetch<GvSession[]>(`/classes/${id}/sessions`),
        apiFetch<GvMaterial[]>(`/classes/${id}/materials`),
      ]);
      setCls(c); setStudents(st); setSessions(sess); setMaterials(mat);
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : String(e)); }
  }

  useEffect(() => { load(); }, [id]);

  async function addSession(e: React.FormEvent) {
    e.preventDefault(); setSBusy(true);
    try {
      await apiFetch(`/classes/${id}/sessions`, { method: "POST",
        body: JSON.stringify({ sessionDate: sDate, startTime: sStart, endTime: sEnd, topic: sTopic || undefined }) });
      setSDate(""); setSTopic(""); setShowAddSession(false);
      load();
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : String(e)); }
    finally { setSBusy(false); }
  }

  async function addMaterial(e: React.FormEvent) {
    e.preventDefault(); setMBusy(true);
    try {
      await apiFetch(`/classes/${id}/materials`, { method: "POST",
        body: JSON.stringify({ title: mTitle, type: mType, googleUrl: mUrl || undefined,
          description: mDesc || undefined, dueDate: mDue || undefined }) });
      setMTitle(""); setMUrl(""); setMDesc(""); setMDue(""); setShowAddMat(false);
      load();
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : String(e)); }
    finally { setMBusy(false); }
  }

  if (!cls) return <Shell title="Lớp học"><div className="muted" style={{ padding: 40 }}>Đang tải…</div></Shell>;

  return (
    <Shell title={cls.name}>
      <div className="gv-page-header">
        <div>
          <Link to="/classes" className="muted" style={{ fontSize: 13, textDecoration: "none" }}>← Lớp học</Link>
          <h1 style={{ marginTop: 4 }}>{cls.name}</h1>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <span className="gv-badge gv-badge-active">{cls.course_id}</span>
          <span className="muted" style={{ fontSize: 13 }}>
            {cls.student_count}/{cls.max_students} học viên
          </span>
        </div>
      </div>

      {err && <div className="feedback feedback-bad" style={{ marginBottom: 12 }}>{err}</div>}

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 16, borderBottom: "1px solid var(--c-divider)", paddingBottom: 0 }}>
        {(["roster", "sessions", "materials"] as const).map((t) => {
          const labels = { roster: "👥 Học viên", sessions: "📅 Buổi học", materials: "📚 Học liệu" };
          return (
            <button key={t} onClick={() => setTab(t)}
              className={`btn btn-sm ${tab === t ? "btn-primary" : "btn-ghost"}`}
              style={{ borderRadius: "8px 8px 0 0" }}>
              {labels[t]}
            </button>
          );
        })}
      </div>

      {/* Roster */}
      {tab === "roster" && (
        <div className="gv-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div className="gv-card-title" style={{ margin: 0 }}>Danh sách học viên ({students.length})</div>
          </div>

          <AddStudentToClass classId={id!} onAdded={load} />

          {students.length === 0
            ? <div className="muted" style={{ marginTop: 16 }}>Chưa có học viên nào.</div>
            : <div className="gv-table-wrap" style={{ marginTop: 16 }}>
                <table className="gv-table">
                  <thead><tr>
                    <th>#</th><th>Họ tên</th><th>SĐT</th><th>Phụ huynh</th>
                    <th>Ngày sinh</th><th>Trạng thái</th><th></th>
                  </tr></thead>
                  <tbody>
                    {students.map((s, i) => (
                      <tr key={s.id}>
                        <td className="muted">{i + 1}</td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{s.display_name}</div>
                          <div className="muted" style={{ fontSize: 12 }}>{s.email}</div>
                        </td>
                        <td>{s.phone ?? "—"}</td>
                        <td>
                          <div>{s.parent_name ?? "—"}</div>
                          <div className="muted" style={{ fontSize: 12 }}>{s.parent_phone ?? ""}</div>
                        </td>
                        <td>{s.date_of_birth ? fmtDate(s.date_of_birth) : "—"}</td>
                        <td><span className={`gv-badge gv-badge-${s.enrollment_status}`}>{s.enrollment_status}</span></td>
                        <td>
                          <DropStudentButton classId={id!} student={s} onDropped={load} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
          }
        </div>
      )}

      {/* Sessions */}
      {tab === "sessions" && (
        <div className="gv-card">
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
            <div className="gv-card-title" style={{ margin: 0 }}>Buổi học ({sessions.length})</div>
            {canWrite && (
              <button className="btn btn-sm btn-primary" onClick={() => setShowAddSession(!showAddSession)}>
                + Thêm buổi
              </button>
            )}
          </div>

          {showAddSession && (
            <form className="gv-form" onSubmit={addSession} style={{ marginBottom: 16, background: "var(--c-red-bg)", padding: 14, borderRadius: 10 }}>
              <div className="gv-form-row">
                <div className="gv-field">
                  <label>Ngày học</label>
                  <input type="date" value={sDate} onChange={(e) => setSDate(e.target.value)} required />
                </div>
                <div className="gv-field">
                  <label>Chủ đề</label>
                  <input value={sTopic} onChange={(e) => setSTopic(e.target.value)} placeholder="Bài 1: Xin chào…" />
                </div>
                <div className="gv-field">
                  <label>Giờ bắt đầu</label>
                  <input type="time" value={sStart} onChange={(e) => setSStart(e.target.value)} required />
                </div>
                <div className="gv-field">
                  <label>Giờ kết thúc</label>
                  <input type="time" value={sEnd} onChange={(e) => setSEnd(e.target.value)} required />
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button type="submit" className="btn btn-sm btn-primary" disabled={sBusy}>
                  {sBusy ? "Đang lưu…" : "Lưu buổi học"}
                </button>
                <button type="button" className="btn btn-sm btn-ghost" onClick={() => setShowAddSession(false)}>Huỷ</button>
              </div>
            </form>
          )}

          {sessions.length === 0
            ? <div className="muted">Chưa có buổi học nào.</div>
            : <div className="gv-table-wrap">
                <table className="gv-table">
                  <thead><tr><th>Ngày</th><th>Giờ</th><th>Chủ đề</th><th></th></tr></thead>
                  <tbody>
                    {sessions.map((s) => (
                      <tr key={s.id}>
                        <td>{fmtDate(s.session_date)}</td>
                        <td>{s.start_time.slice(0,5)} – {s.end_time.slice(0,5)}</td>
                        <td>{s.topic ?? <span className="muted">—</span>}</td>
                        <td><Link to={`/sessions/${s.id}`} className="btn btn-sm btn-secondary">Điểm danh</Link></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
          }
        </div>
      )}

      {/* Materials */}
      {tab === "materials" && (
        <div className="gv-card">
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
            <div className="gv-card-title" style={{ margin: 0 }}>Học liệu & Bài tập</div>
            {canWrite && (
              <button className="btn btn-sm btn-primary" onClick={() => setShowAddMat(!showAddMat)}>
                + Thêm tài liệu
              </button>
            )}
          </div>

          {showAddMat && (
            <form className="gv-form" onSubmit={addMaterial} style={{ marginBottom: 16, background: "var(--c-red-bg)", padding: 14, borderRadius: 10 }}>
              <div className="gv-form-row">
                <div className="gv-field" style={{ gridColumn: "1 / -1" }}>
                  <label>Tiêu đề</label>
                  <input value={mTitle} onChange={(e) => setMTitle(e.target.value)} required maxLength={300} />
                </div>
                <div className="gv-field">
                  <label>Loại</label>
                  <select value={mType} onChange={(e) => setMType(e.target.value as typeof mType)}>
                    <option value="lesson">Bài giảng</option>
                    <option value="homework">Bài tập</option>
                    <option value="reference">Tài liệu tham khảo</option>
                    <option value="announcement">Thông báo</option>
                  </select>
                </div>
                <div className="gv-field">
                  <label>Google Docs URL</label>
                  <input type="url" value={mUrl} onChange={(e) => setMUrl(e.target.value)} placeholder="https://docs.google.com/…" />
                </div>
                <div className="gv-field" style={{ gridColumn: "1 / -1" }}>
                  <label>Mô tả</label>
                  <textarea value={mDesc} onChange={(e) => setMDesc(e.target.value)} />
                </div>
                {mType === "homework" && (
                  <div className="gv-field">
                    <label>Hạn nộp</label>
                    <input type="datetime-local" value={mDue} onChange={(e) => setMDue(e.target.value)} />
                  </div>
                )}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button type="submit" className="btn btn-sm btn-primary" disabled={mBusy}>
                  {mBusy ? "Đang lưu…" : "Lưu tài liệu"}
                </button>
                <button type="button" className="btn btn-sm btn-ghost" onClick={() => setShowAddMat(false)}>Huỷ</button>
              </div>
            </form>
          )}

          {materials.length === 0
            ? <div className="muted">Chưa có tài liệu nào.</div>
            : <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {materials.map((m) => (
                  <div key={m.id} style={{ display: "flex", gap: 12, alignItems: "flex-start",
                    padding: "12px 14px", background: "white", border: "1px solid var(--c-divider)",
                    borderRadius: 10 }}>
                    <span style={{ fontSize: 20 }}>{MAT_ICONS[m.type]}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600 }}>
                        {m.google_url
                          ? <a href={m.google_url} target="_blank" rel="noreferrer" style={{ color: "var(--c-red-dark)" }}>{m.title}</a>
                          : m.title}
                      </div>
                      {m.description && <div className="muted" style={{ fontSize: 13 }}>{m.description}</div>}
                      <div style={{ display: "flex", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
                        <span className={`gv-badge gv-badge-${m.type}`}>{m.type}</span>
                        {m.due_date && <span className="muted" style={{ fontSize: 12 }}>Hạn: {new Date(m.due_date).toLocaleString("vi-VN")}</span>}
                        {m.created_by_name && <span className="muted" style={{ fontSize: 12 }}>✍ {m.created_by_name}</span>}
                      </div>
                    </div>
                    {m.type === "homework" && (
                      <Link to={`/homework/${m.id}`} className="btn btn-sm btn-secondary">Chấm bài</Link>
                    )}
                  </div>
                ))}
              </div>
          }
        </div>
      )}
    </Shell>
  );
}

// ── Add student search + enroll ────────────────────────────────────────────────

function AddStudentToClass({ classId, onAdded }: { classId: string; onAdded: () => void }) {
  const [q, setQ]             = useState("");
  const [results, setResults] = useState<GvStudentSearch[]>([]);
  const [msg, setMsg]         = useState<{ text: string; ok: boolean } | null>(null);
  const [busy, setBusy]       = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleInput(val: string) {
    setQ(val); setMsg(null);
    if (timer.current) clearTimeout(timer.current);
    if (val.trim().length < 2) { setResults([]); return; }
    timer.current = setTimeout(async () => {
      try {
        setResults(await apiFetch<GvStudentSearch[]>(`/students/search?q=${encodeURIComponent(val.trim())}`));
      } catch { setResults([]); }
    }, 300);
  }

  async function enroll(s: GvStudentSearch) {
    setBusy(true); setMsg(null);
    try {
      await apiFetch(`/classes/${classId}/students`, {
        method: "POST",
        body: JSON.stringify({ studentId: s.id }),
      });
      setMsg({ text: `✓ Đã thêm ${s.displayName}`, ok: true });
      setQ(""); setResults([]);
      onAdded();
    } catch (e: unknown) {
      setMsg({ text: e instanceof Error ? e.message : String(e), ok: false });
    } finally { setBusy(false); }
  }

  return (
    <div style={{ marginBottom: 4 }}>
      <input
        placeholder="Tìm học viên theo tên, email hoặc SĐT…"
        value={q}
        onChange={(e) => handleInput(e.target.value)}
        style={{ padding: "8px 12px", border: "1.5px solid var(--c-divider)", borderRadius: 8,
          fontSize: 14, fontFamily: "inherit", width: "100%", maxWidth: 360, boxSizing: "border-box" }}
      />
      {results.length > 0 && (
        <div style={{ border: "1.5px solid var(--c-divider)", borderRadius: 8, overflow: "hidden",
          maxWidth: 360, marginTop: 4 }}>
          {results.map((r) => (
            <button key={r.id} disabled={busy} onClick={() => enroll(r)}
              style={{ display: "flex", flexDirection: "column", gap: 2, width: "100%",
                padding: "10px 14px", background: "#fff", border: "none",
                borderBottom: "1px solid var(--c-divider)", cursor: "pointer",
                textAlign: "left", fontFamily: "inherit" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}>
              <span style={{ fontWeight: 600, fontSize: 14 }}>{r.displayName}</span>
              <span style={{ fontSize: 12, color: "var(--c-text-soft)" }}>
                {r.email}{r.phone ? ` · ${r.phone}` : ""}
              </span>
            </button>
          ))}
        </div>
      )}
      {msg && (
        <div style={{ marginTop: 6, fontSize: 13, fontWeight: 600,
          color: msg.ok ? "#15803d" : "#991b1b" }}>
          {msg.text}
        </div>
      )}
    </div>
  );
}

// ── Drop student button ───────────────────────────────────────────────────────

function DropStudentButton({ classId, student, onDropped }: { classId: string; student: GvStudent; onDropped: () => void }) {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const canDrop = user?.role === "teacher" || user?.role === "staff" || user?.role === "admin";
  if (!canDrop || student.enrollment_status !== "active") return null;

  async function drop() {
    if (!confirm(`Xoá ${student.display_name} khỏi lớp?`)) return;
    setBusy(true);
    try {
      await apiFetch(`/classes/${classId}/students/${student.id}`, { method: "DELETE" });
      onDropped();
    } finally { setBusy(false); }
  }

  return (
    <button className="btn btn-ghost btn-sm" disabled={busy} onClick={drop}>Xoá</button>
  );
}
