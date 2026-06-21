import { useEffect, useState, useRef } from "react";
import { Navigate } from "react-router-dom";
import { apiFetch } from "../lib/api";
import { useAuth } from "../lib/auth-context";

// ── Types ──────────────────────────────────────────────────────────────────────

interface ClassItem {
  id: string;
  name: string;
  class_code: string | null;
  course_id: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
  schedule: { days: string[]; clock_in: string; clock_out: string } | null;
  student_count: number;
}

interface Student {
  id: string;
  display_name: string;
  email: string;
  phone: string | null;
  enrollment_id: string;
  enrollment_status: string;
  enrolled_at: string;
}

interface StudentResult {
  id: string;
  displayName: string;
  email: string;
  phone: string | null;
}

const DAY_VI: Record<string, string> = {
  Mon: "T2", Tue: "T3", Wed: "T4", Thu: "T5", Fri: "T6", Sat: "T7", Sun: "CN",
};

function fmtSchedule(s: ClassItem["schedule"]): string {
  if (!s) return "";
  const days = s.days.map((d) => DAY_VI[d] ?? d).join(", ");
  return `${days} · ${s.clock_in}–${s.clock_out}`;
}

// ── Page ───────────────────────────────────────────────────────────────────────

export function GiaovuPage() {
  const { user, role, loading } = useAuth();
  const [classes, setClasses] = useState<ClassItem[] | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!role || role === "student") return;
    apiFetch<ClassItem[]>("/giaovu/classes")
      .then(setClasses)
      .catch((e: unknown) => setErr(e instanceof Error ? e.message : String(e)));
  }, [role]);

  if (loading) return null;
  if (!user || role === "student") return <Navigate to="/" replace />;

  const activeClass = classes?.find((c) => c.id === activeId) ?? null;

  return (
    <div className="container" style={{ padding: "24px 16px 80px" }}>
      <h1 style={{ color: "var(--c-red-dark)", marginTop: 0 }}>Lớp học của tôi</h1>

      {err && <div className="feedback feedback-bad">{err}</div>}

      {classes === null && !err && <div className="muted">Đang tải…</div>}

      {classes?.length === 0 && (
        <div className="feedback feedback-info">Chưa có lớp nào được gán cho bạn.</div>
      )}

      {classes && classes.length > 0 && (
        <div style={{ display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap" }}>
          {/* Class list */}
          <div className="gv-class-list">
            {classes.map((c) => (
              <button
                key={c.id}
                className={`gv-class-card ${activeId === c.id ? "gv-class-card--active" : ""}`}
                onClick={() => setActiveId(activeId === c.id ? null : c.id)}
              >
                <div className="gv-class-name">{c.name}</div>
                {c.class_code && <div className="gv-class-code">{c.class_code}</div>}
                {c.schedule && <div className="gv-class-sched">{fmtSchedule(c.schedule)}</div>}
                {(c.start_date || c.end_date) && (
                  <div className="gv-class-dates">
                    {c.start_date ?? "?"} → {c.end_date ?? "…"}
                  </div>
                )}
                <div className="gv-class-count">{c.student_count} học viên</div>
                <span className={`adm-status adm-status--${c.status}`}>{c.status}</span>
              </button>
            ))}
          </div>

          {/* Student panel */}
          {activeClass && (
            <div className="gv-students-panel">
              <StudentsPanel cls={activeClass} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Students panel ─────────────────────────────────────────────────────────────

function StudentsPanel({ cls }: { cls: ClassItem }) {
  const [students, setStudents] = useState<Student[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const reload = () => {
    setStudents(null);
    apiFetch<Student[]>(`/giaovu/classes/${cls.id}/students`)
      .then(setStudents)
      .catch((e: unknown) => setErr(e instanceof Error ? e.message : String(e)));
  };

  useEffect(() => { reload(); }, [cls.id]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
        <h2 style={{ margin: 0, fontSize: "1.1rem", color: "var(--c-red-dark)" }}>{cls.name}</h2>
        {cls.class_code && <code style={{ fontSize: 12, color: "var(--c-text-soft)" }}>{cls.class_code}</code>}
      </div>

      {err && <div className="feedback feedback-bad">{err}</div>}

      {/* Add student */}
      <AddStudentForm classId={cls.id} onAdded={reload} />

      {/* Student table */}
      {students === null && !err && <div className="muted" style={{ fontSize: 14 }}>Đang tải…</div>}
      {students?.length === 0 && (
        <div className="feedback feedback-info">Chưa có học viên nào trong lớp này.</div>
      )}
      {students && students.length > 0 && (
        <div style={{ overflowX: "auto" }}>
          <table className="admin-table">
            <thead>
              <tr><th>#</th><th>Họ tên</th><th>Email / SĐT</th><th>Trạng thái</th><th>Ngày vào</th><th></th></tr>
            </thead>
            <tbody>
              {students.map((s, i) => (
                <StudentRow key={s.id} idx={i + 1} student={s} classId={cls.id} onRemoved={reload} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Single student row ─────────────────────────────────────────────────────────

function StudentRow({
  idx, student, classId, onRemoved,
}: { idx: number; student: Student; classId: string; onRemoved: () => void }) {
  const [busy, setBusy] = useState(false);

  async function drop() {
    if (!confirm(`Xoá ${student.display_name} khỏi lớp?`)) return;
    setBusy(true);
    try {
      await apiFetch(`/giaovu/classes/${classId}/students/${student.id}`, { method: "DELETE" });
      onRemoved();
    } finally { setBusy(false); }
  }

  return (
    <tr className={student.enrollment_status !== "active" ? "row-resolved" : ""}>
      <td className="muted">{idx}</td>
      <td style={{ fontWeight: 600 }}>{student.display_name}</td>
      <td style={{ fontSize: 13 }}>{student.email}{student.phone ? ` · ${student.phone}` : ""}</td>
      <td>
        <span className={`adm-status adm-status--${student.enrollment_status === "active" ? "active" : "archived"}`}>
          {student.enrollment_status}
        </span>
      </td>
      <td className="muted" style={{ fontSize: 12 }}>
        {new Date(student.enrolled_at).toLocaleDateString("vi-VN")}
      </td>
      <td>
        <button className="btn btn-ghost btn-sm" disabled={busy} onClick={drop}>Xoá</button>
      </td>
    </tr>
  );
}

// ── Add student form ───────────────────────────────────────────────────────────

function AddStudentForm({ classId, onAdded }: { classId: string; onAdded: () => void }) {
  const [q, setQ]             = useState("");
  const [results, setResults] = useState<StudentResult[]>([]);
  const [busy, setBusy]       = useState(false);
  const [msg, setMsg]         = useState<string | null>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleInput(val: string) {
    setQ(val); setMsg(null);
    if (debounce.current) clearTimeout(debounce.current);
    if (val.trim().length < 2) { setResults([]); return; }
    debounce.current = setTimeout(async () => {
      try {
        const r = await apiFetch<StudentResult[]>(`/giaovu/students/search?q=${encodeURIComponent(val.trim())}`);
        setResults(r);
      } catch { setResults([]); }
    }, 300);
  }

  async function enroll(student: StudentResult) {
    setBusy(true); setMsg(null);
    try {
      await apiFetch(`/giaovu/classes/${classId}/students`, {
        method: "POST",
        body: JSON.stringify({ studentId: student.id }),
      });
      setMsg(`✓ Đã thêm ${student.displayName}`);
      setQ(""); setResults([]);
      onAdded();
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : String(e));
    } finally { setBusy(false); }
  }

  return (
    <div className="gv-add-student">
      <div className="gv-search-wrap">
        <input
          className="adm-input"
          placeholder="Tìm học viên theo tên, email hoặc SĐT…"
          value={q}
          onChange={(e) => handleInput(e.target.value)}
          style={{ flex: 1 }}
        />
      </div>

      {results.length > 0 && (
        <div className="gv-search-results">
          {results.map((r) => (
            <button key={r.id} className="gv-search-item" disabled={busy} onClick={() => enroll(r)}>
              <span className="gv-search-name">{r.displayName}</span>
              <span className="gv-search-sub">{r.email}{r.phone ? ` · ${r.phone}` : ""}</span>
            </button>
          ))}
        </div>
      )}

      {msg && (
        <div className={`feedback ${msg.startsWith("✓") ? "feedback-good" : "feedback-bad"}`} style={{ marginTop: 4 }}>
          {msg}
        </div>
      )}
    </div>
  );
}
