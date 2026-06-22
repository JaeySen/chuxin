import { Link, Navigate, useNavigate } from "react-router-dom";
import { COURSES, type CourseStatus } from "@sotam/shared";
import { useAuth } from "../lib/auth-context";
import { useHead } from "../lib/useHead";
import { JsonLd } from "../components/JsonLd";
import { useEffect, useRef, useState } from "react";
import { getStoredJwt, getStoredSessionToken } from "../lib/api";

const STATUS_LABEL: Record<CourseStatus, string> = {
  "ongoing":      "Đang học",
  "opening-soon": "Sắp khai giảng",
  "enrolling":    "Đang tuyển sinh",
  "full":         "Đã đủ lớp",
  "coming-soon":  "Sắp ra mắt",
};

const STATUS_CLASS: Record<CourseStatus, string> = {
  "ongoing":      "status-ongoing",
  "opening-soon": "status-opening-soon",
  "enrolling":    "status-enrolling",
  "full":         "status-full",
  "coming-soon":  "status-coming-soon",
};

const OLD_EXERCISES = [
  { title: "Ngữ âm Pinyin", icon: "🔊", to: "/pinyin" },
  { title: "Tìm từ",        icon: "🔍", to: "/word-search" },
  { title: "Bingo",         icon: "🎯", to: "/bingo" },
];

export function Home() {
  const { role, loading } = useAuth();

  useHead({
    title: "Hán ngữ Sơ Tâm · Học tiếng Trung tại Việt Nam",
    description: "Trung tâm tiếng Trung Sơ Tâm — Các khoá học Hán ngữ từ HSK 1 đến HSK 6.",
    canonical: "https://www.hanngusotam.com/",
  });

  if (loading) return null;

  if (role === "admin")   return <Navigate to="/admin" replace />;
  if (role === "teacher") return <TeacherHome />;
  if (role === "student") return <StudentHome />;
  return <GuestHome />;
}

// ── Guest ─────────────────────────────────────────────────────────────────────

function GuestHome() {
  return (
    <div className="container" style={{ padding: "12px 16px 80px" }}>
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "EducationalOrganization",
        "name": "Hán ngữ Sơ Tâm",
        "url": "https://www.hanngusotam.com",
        "logo": "https://www.hanngusotam.com/chuxin-logo.jpg",
        "description": "Trung tâm tiếng Trung Sơ Tâm — Hán ngữ HSK 1–6.",
      }} />

      {/* Hero */}
      <section className="hero">
        <div className="hero-copy">
          <h1>Học tiếng Trung cùng <span className="hero-accent">Sơ Tâm</span></h1>
          <p>
            Các khóa học được chuẩn hóa với trải nghiệm học tương tác: Flashcard, đố vui,
            ghép cặp, thực hành nghe - nói và trò chơi đồng đội.
          </p>
          <div className="hero-cta">
            <Link to="/courses" className="btn btn-primary">Xem các khoá học</Link>
            <Link to="/ve-chung-toi" className="btn btn-secondary">Về chúng tôi</Link>
          </div>
        </div>
        <div className="hero-art">
          <img src="/chuxin-logo.jpg" alt="Hán ngữ Sơ Tâm" />
        </div>
      </section>

      {/* Courses — static, no auth gate */}
      <h2 className="section-h">Các khoá học</h2>
      <div className="course-grid">
        {COURSES.map((c) => (
          <Link key={c.id} className="course-tile" to={`/course/${c.id}`}>
            {c.status && (
              <span className={`course-status-badge ${STATUS_CLASS[c.status]}`}>
                {STATUS_LABEL[c.status]}
              </span>
            )}
            <h3>{c.title}</h3>
            <div className="muted">{c.subtitle}</div>
            <div className="tile-bar" style={{ background: c.color }} />
          </Link>
        ))}
      </div>
    </div>
  );
}

// ── Student ───────────────────────────────────────────────────────────────────

interface SQQuestion {
  num: number; text: string; type: string;
  options: Record<string, string>; answer: string | null;
}
interface StudentQuiz { id: string; title: string; mcq: number; total: number; }
interface StudentQuizDetail extends StudentQuiz {
  slug: string; created_at: string; questions: SQQuestion[];
}
interface AttemptAnswer { questionNum: number; selected: string; isCorrect: boolean; }
interface AttemptState {
  attemptId: string; lastQuestionNum: number; score: number; answers: AttemptAnswer[];
}

// Student quiz player with full progress tracking.
function StudentQuizPlayer({ quiz, onClose }: { quiz: StudentQuizDetail; onClose: () => void }) {
  const mcq = (quiz.questions ?? []).filter((q) => q.type === "mcq");
  const [attempt, setAttempt] = useState<AttemptState | null>(null);
  const [idx, setIdx] = useState(0);
  const [picks, setPicks] = useState<Record<number, { selected: string; isCorrect: boolean }>>({});
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const questionStartRef = useRef<number>(Date.now());

  // Start / resume attempt on mount
  useEffect(() => {
    let cancelled = false;
    fetch(`${API}/quiz/${quiz.id}/start`, { method: "POST", credentials: "include", headers: authHeaders() })
      .then((r) => r.json())
      .then((data: AttemptState) => {
        if (cancelled) return;
        setAttempt(data);
        setScore(data.score);
        // Rebuild picks from server answers
        const restored: Record<number, { selected: string; isCorrect: boolean }> = {};
        for (const a of data.answers) restored[a.questionNum] = { selected: a.selected, isCorrect: a.isCorrect };
        setPicks(restored);
        // Resume from last shown question
        if (data.lastQuestionNum > 0) {
          const resumeIdx = mcq.findIndex((q) => q.num >= data.lastQuestionNum);
          if (resumeIdx !== -1) setIdx(resumeIdx);
        }
      })
      .catch(() => { if (!cancelled) setStartError("Không kết nối được máy chủ."); });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quiz.id]);

  // Reset timer whenever question changes
  useEffect(() => { questionStartRef.current = Date.now(); }, [idx]);

  const q = mcq[idx];
  const picked = q ? picks[q.num] : undefined;
  const correct = q?.answer ?? null;

  async function pick(letter: string) {
    if (!attempt || picks[q.num] || saving) return;
    const reactionMs = Date.now() - questionStartRef.current;
    const isCorrect = letter === correct;
    const isLast = idx + 1 >= mcq.length;
    const nextQ = !isLast ? mcq[idx + 1] : null;

    setSaving(true);
    setPicks((p) => ({ ...p, [q.num]: { selected: letter, isCorrect } }));
    if (isCorrect) setScore((s) => s + 1);

    try {
      await fetch(`${API}/quiz/attempts/${attempt.attemptId}/answer`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          questionNum: q.num,
          selected: letter,
          isCorrect,
          reactionMs,
          nextQuestionNum: nextQ?.num ?? null,
        }),
      });
    } catch {} // answer persists optimistically; server reconciles on next start
    setSaving(false);
  }

  async function next() {
    if (idx + 1 < mcq.length) {
      setIdx((i) => i + 1);
    } else {
      // Complete
      if (attempt) {
        try {
          await fetch(`${API}/quiz/attempts/${attempt.attemptId}/complete`, {
            method: "POST", credentials: "include", headers: authHeaders(),
          });
        } catch {}
      }
      setDone(true);
    }
  }

  if (startError) {
    return (
      <div className="qp-shell">
        <div className="qp-empty">{startError}</div>
        <button className="btn btn-ghost" onClick={onClose}>← Quay lại</button>
      </div>
    );
  }

  if (!attempt) {
    return (
      <div className="qp-shell">
        <div className="qp-empty">Đang tải bài tập…</div>
      </div>
    );
  }

  if (mcq.length === 0) {
    return (
      <div className="qp-shell">
        <div className="qp-empty">Bài này không có câu trắc nghiệm.</div>
        <button className="btn btn-ghost" onClick={onClose}>← Quay lại</button>
      </div>
    );
  }

  if (done) {
    const pct = mcq.length > 0 ? Math.round((score / mcq.length) * 100) : 0;
    return (
      <div className="qp-shell">
        <div className="qp-result">
          <div className="qp-score">{score} / {mcq.length}</div>
          <div className="qp-pct">{pct}%</div>
          <div className="qp-result-label">
            {pct >= 80 ? "Xuất sắc! 🎉" : pct >= 60 ? "Khá tốt! 👍" : "Cần ôn luyện thêm 💪"}
          </div>
          <button className="btn btn-ghost" style={{ marginTop: 20 }} onClick={onClose}>← Quay lại</button>
        </div>
      </div>
    );
  }

  return (
    <div className="qp-shell">
      <div className="qp-top">
        <button className="btn btn-ghost btn-sm" onClick={onClose}>← Quay lại</button>
        <span className="qp-progress">{idx + 1} / {mcq.length}</span>
      </div>
      <div className="qp-bar-track">
        <div className="qp-bar-fill" style={{ width: `${(idx / mcq.length) * 100}%` }} />
      </div>
      <div className="qp-card">
        <div className="qp-num">Câu {q.num}</div>
        <div className="qp-text">{q.text}</div>
        <div className="qp-options">
          {(["A", "B", "C", "D"] as const).map((letter) => {
            const text = q.options[letter];
            if (!text) return null;
            const isCorrect = letter === correct;
            const isPicked = letter === picked?.selected;
            let cls = "qp-opt";
            if (picked) {
              if (isPicked && isCorrect) cls += " qp-opt--correct";
              else if (isPicked && !isCorrect) cls += " qp-opt--wrong";
              else if (isCorrect) cls += " qp-opt--reveal";
            }
            return (
              <button key={letter} className={cls} onClick={() => pick(letter)} disabled={!!picked || saving}>
                <span className="qp-opt-letter">{letter}</span>
                <span className="qp-opt-text">{text}</span>
              </button>
            );
          })}
        </div>
        {picked && (
          <div className={`qp-feedback ${picked.isCorrect ? "qp-feedback--correct" : "qp-feedback--wrong"}`}>
            {picked.isCorrect ? "✓ Chính xác!" : `✗ Đáp án đúng: ${correct}`}
          </div>
        )}
      </div>
      {picked && (
        <button className="btn btn-primary qp-next" onClick={next}>
          {idx + 1 < mcq.length ? "Câu tiếp →" : "Xem kết quả"}
        </button>
      )}
    </div>
  );
}

function StudentQuizList({ courseId, teacherId }: { courseId: string; teacherId: string | null }) {
  const [quizzes, setQuizzes] = useState<StudentQuiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [playing, setPlaying] = useState<StudentQuizDetail | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams({ courseId });
    if (teacherId) params.set("teacherId", teacherId);
    fetch(`${API}/quiz?${params}`, { credentials: "include", headers: authHeaders() })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(`${r.status}: ${data?.error ?? JSON.stringify(data)}`);
        if (!Array.isArray(data)) throw new Error(`Unexpected response: ${JSON.stringify(data)}`);
        setQuizzes(data);
      })
      .catch((e) => setFetchError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false));
  }, [courseId, teacherId]);

  async function openPlay(id: string) {
    setLoadingId(id);
    try {
      const res = await fetch(`${API}/quiz/${id}`, { credentials: "include", headers: authHeaders() });
      const data = await res.json();
      if (!res.ok || !Array.isArray(data.questions)) throw new Error("Không tải được bài tập");
      setPlaying(data);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Lỗi");
    }
    setLoadingId(null);
  }

  if (playing) return <StudentQuizPlayer quiz={playing} onClose={() => setPlaying(null)} />;
  if (loading) return <div className="muted" style={{ fontSize: 14 }}>Đang tải…</div>;
  if (fetchError) return <div className="muted" style={{ fontSize: 13, color: "red" }}>Lỗi tải bài tập: {fetchError}</div>;
  if (quizzes.length === 0) return <div className="muted" style={{ fontSize: 14 }}>Giáo viên chưa thêm bài tập. Hãy kiểm tra lại sau.</div>;

  return (
    <div className="th-quiz-list">
      {quizzes.map((q) => (
        <div key={q.id} className="th-quiz-row">
          <div className="th-quiz-info">
            <span className="th-quiz-title">{q.title}</span>
            <span className="th-quiz-meta">{q.mcq} trắc nghiệm · {q.total - q.mcq} tự luận</span>
          </div>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => openPlay(q.id)}
            disabled={loadingId === q.id}
          >{loadingId === q.id ? "…" : "▶ Làm bài"}</button>
        </div>
      ))}
    </div>
  );
}

function StudentHome() {
  const { user } = useAuth();
  const classes = user?.classes ?? [];
  const primaryClass = classes[0];

  return (
    <div className="container" style={{ padding: "24px 16px 80px" }}>
      <div className="sh-greeting">
        Xin chào, <strong>{user?.displayName}</strong>
        {primaryClass && (
          <span className="sh-class-badge">{primaryClass.name}</span>
        )}
      </div>

      <h2 className="section-h" style={{ marginTop: 28 }}>Bài tập</h2>
      {classes.length === 0 ? (
        <div className="feedback feedback-info">
          Bạn chưa được xếp lớp. Liên hệ giáo viên để được thêm vào lớp học.
        </div>
      ) : (
        <StudentQuizList courseId={primaryClass.courseId} teacherId={primaryClass.teacherId} />
      )}
    </div>
  );
}

// ── Teacher ───────────────────────────────────────────────────────────────────

const API = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

const TEACHER_EXERCISES = [
  { title: "Ngữ âm Pinyin", icon: "🔊", to: "/pinyin",     desc: "Luyện thanh mẫu / vận mẫu / thanh điệu" },
  { title: "Tìm từ",        icon: "🔍", to: "/word-search", desc: "Tạo & quản lý trò chơi Tìm từ" },
  { title: "Bingo",         icon: "🎯", to: "/bingo",       desc: "Tạo & quản lý trò chơi Bingo" },
];

interface QuizSummary { id: string; slug: string; title: string; mcq: number; total: number; created_at: string; course_id?: string; }
interface QuizDetail extends QuizSummary {
  questions: { num: number; text: string; type: string; options: Record<string, string>; answer: string | null }[];
}

function authHeaders() {
  const jwt = getStoredJwt();
  const sessionToken = getStoredSessionToken();
  return {
    ...(jwt && { Authorization: `Bearer ${jwt}` }),
    ...(sessionToken && { "X-Session-Token": sessionToken }),
  };
}

function QuizPlayerInline({ quiz, onClose }: { quiz: QuizDetail; onClose: () => void }) {
  const mcq = (quiz.questions ?? []).filter((q) => q.type === "mcq");
  const [idx, setIdx] = useState(0);
  const [picks, setPicks] = useState<Record<number, string>>({});
  const [done, setDone] = useState(false);

  const q = mcq[idx];
  const picked = q ? picks[q.num] : undefined;
  const correct = q?.answer ?? null;

  function pick(letter: string) {
    if (picks[q.num]) return;
    setPicks((p) => ({ ...p, [q.num]: letter }));
  }
  function next() {
    if (idx + 1 < mcq.length) setIdx((i) => i + 1);
    else setDone(true);
  }
  const score = mcq.filter((q) => picks[q.num] === q.answer).length;

  if (mcq.length === 0) {
    return (
      <div className="qp-shell">
        <button className="btn btn-ghost btn-sm" onClick={onClose}>← Quay lại</button>
        <div className="qp-empty">Bài này không có câu trắc nghiệm.</div>
      </div>
    );
  }

  if (done) {
    const pct = Math.round((score / mcq.length) * 100);
    return (
      <div className="qp-shell">
        <div className="qp-result">
          <div className="qp-score">{score} / {mcq.length}</div>
          <div className="qp-pct">{pct}%</div>
          <div className="qp-result-label">
            {pct >= 80 ? "Xuất sắc! 🎉" : pct >= 60 ? "Khá tốt! 👍" : "Cần ôn luyện thêm 💪"}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
            <button className="btn btn-primary" onClick={() => { setPicks({}); setIdx(0); setDone(false); }}>Làm lại</button>
            <button className="btn btn-ghost" onClick={onClose}>← Quay lại</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="qp-shell">
      <div className="qp-top">
        <button className="btn btn-ghost btn-sm" onClick={onClose}>← Quay lại</button>
        <span className="qp-progress">{idx + 1} / {mcq.length}</span>
      </div>
      <div className="qp-bar-track"><div className="qp-bar-fill" style={{ width: `${(idx / mcq.length) * 100}%` }} /></div>
      <div className="qp-card">
        <div className="qp-num">Câu {q.num}</div>
        <div className="qp-text">{q.text}</div>
        <div className="qp-options">
          {(["A", "B", "C", "D"] as const).map((letter) => {
            const text = q.options[letter];
            if (!text) return null;
            const isCorrect = letter === correct;
            const isPicked = letter === picked;
            let cls = "qp-opt";
            if (picked) {
              if (isPicked && isCorrect) cls += " qp-opt--correct";
              else if (isPicked && !isCorrect) cls += " qp-opt--wrong";
              else if (isCorrect) cls += " qp-opt--reveal";
            }
            return (
              <button key={letter} className={cls} onClick={() => pick(letter)} disabled={!!picked}>
                <span className="qp-opt-letter">{letter}</span>
                <span className="qp-opt-text">{text}</span>
              </button>
            );
          })}
        </div>
        {picked && (
          <div className={`qp-feedback ${picked === correct ? "qp-feedback--correct" : "qp-feedback--wrong"}`}>
            {picked === correct ? "✓ Chính xác!" : `✗ Đáp án đúng: ${correct}`}
          </div>
        )}
      </div>
      {picked && (
        <button className="btn btn-primary qp-next" onClick={next}>
          {idx + 1 < mcq.length ? "Câu tiếp →" : "Xem kết quả"}
        </button>
      )}
    </div>
  );
}

interface QuizStat {
  studentId: string; name: string; email: string;
  score: number; totalMcq: number;
  startedAt: string; completedAt: string | null;
  avgReactionMs: number | null; answeredCount: number;
}

function QuizStatsPanel({ quizId }: { quizId: string }) {
  const [stats, setStats] = useState<QuizStat[] | null>(null);

  useEffect(() => {
    fetch(`${API}/quiz/${quizId}/stats`, { credentials: "include", headers: authHeaders() })
      .then(async (r) => { const d = await r.json(); setStats(Array.isArray(d) ? d : []); })
      .catch(() => setStats([]));
  }, [quizId]);

  if (!stats) return <div className="muted" style={{ padding: "12px 16px", fontSize: 13 }}>Đang tải…</div>;
  if (stats.length === 0) return <div className="muted" style={{ padding: "12px 16px", fontSize: 13 }}>Chưa có học viên nào làm bài.</div>;

  return (
    <div className="th-stats-panel">
      <table className="th-stats-table">
        <thead>
          <tr>
            <th>Học viên</th><th>Điểm</th><th>Tgian PƯ TB</th><th>Trạng thái</th>
          </tr>
        </thead>
        <tbody>
          {stats.map((s) => {
            const pct = s.totalMcq > 0 ? Math.round((s.score / s.totalMcq) * 100) : 0;
            const reactionSec = s.avgReactionMs != null ? (s.avgReactionMs / 1000).toFixed(1) + "s" : "—";
            return (
              <tr key={s.studentId}>
                <td>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{s.name}</div>
                  <div style={{ fontSize: 11, color: "var(--c-text-muted)" }}>{s.email}</div>
                </td>
                <td>
                  <span style={{ fontWeight: 700 }}>{s.score}/{s.totalMcq}</span>
                  <span className="muted" style={{ fontSize: 11, marginLeft: 4 }}>({pct}%)</span>
                </td>
                <td style={{ fontSize: 13 }}>{reactionSec}</td>
                <td>
                  {s.completedAt
                    ? <span className="th-stats-badge th-stats-badge--done">Hoàn thành</span>
                    : <span className="th-stats-badge th-stats-badge--prog">Đang làm ({s.answeredCount}/{s.totalMcq})</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function TeacherQuizList() {
  const [quizzes, setQuizzes] = useState<QuizSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState<QuizDetail | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [savingTitle, setSavingTitle] = useState(false);
  const [statsId, setStatsId] = useState<string | null>(null);
  const [savingCourseId, setSavingCourseId] = useState<string | null>(null);
  const editRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(`${API}/admin/quiz`, { credentials: "include", headers: authHeaders() })
      .then((r) => r.json())
      .then(setQuizzes)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (editingId) setTimeout(() => editRef.current?.focus(), 50);
  }, [editingId]);

  async function openPlay(id: string) {
    setLoadingId(id);
    try {
      const res = await fetch(`${API}/admin/quiz/${id}`, { credentials: "include", headers: authHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      if (!Array.isArray(data.questions)) throw new Error("Dữ liệu bài tập không hợp lệ");
      setPlaying(data);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Không tải được bài tập");
    }
    setLoadingId(null);
  }

  async function saveTitle(id: string) {
    if (!editTitle.trim()) return;
    setSavingTitle(true);
    try {
      const res = await fetch(`${API}/admin/quiz/${id}/title`, {
        method: "PATCH", credentials: "include",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ title: editTitle.trim() }),
      });
      if (res.ok) {
        const { title } = await res.json();
        setQuizzes((qs) => qs.map((q) => q.id === id ? { ...q, title } : q));
        setEditingId(null);
      }
    } catch {}
    setSavingTitle(false);
  }

  async function saveCourse(id: string, courseId: string | null) {
    setSavingCourseId(id);
    try {
      const res = await fetch(`${API}/admin/quiz/${id}/course`, {
        method: "PATCH", credentials: "include",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ courseId: courseId || null }),
      });
      if (res.ok) {
        const data = await res.json();
        setQuizzes((qs) => qs.map((q) => q.id === id ? { ...q, course_id: data.courseId } : q));
      }
    } catch {}
    setSavingCourseId(null);
  }

  if (playing) return <QuizPlayerInline quiz={playing} onClose={() => setPlaying(null)} />;

  if (loading) return <div className="muted" style={{ fontSize: 14 }}>Đang tải…</div>;

  if (quizzes.length === 0) {
    return (
      <div className="muted" style={{ fontSize: 14 }}>
        Chưa có bài tập nào. <Link to="/admin/quiz-import" style={{ color: "var(--c-red)" }}>Tải lên bài tập mới →</Link>
      </div>
    );
  }

  return (
    <div className="th-quiz-list">
      {quizzes.map((q) => (
        <div key={q.id} className="th-quiz-item">
          <div className="th-quiz-row">
            <div className="th-quiz-info">
              {editingId === q.id ? (
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <input
                    ref={editRef}
                    className="th-quiz-edit-input"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveTitle(q.id);
                      if (e.key === "Escape") setEditingId(null);
                    }}
                  />
                  <button className="btn btn-primary btn-sm" onClick={() => saveTitle(q.id)} disabled={savingTitle}>
                    {savingTitle ? "…" : "Lưu"}
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setEditingId(null)}>Hủy</button>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span className="th-quiz-title">{q.title}</span>
                  {q.course_id && (
                    <span className="th-quiz-course">{COURSES.find((c) => c.id === q.course_id)?.title ?? q.course_id}</span>
                  )}
                  <button
                    className="th-quiz-rename"
                    title="Đổi tên"
                    onClick={() => { setEditingId(q.id); setEditTitle(q.title); }}
                  >✎</button>
                </div>
              )}
              <div className="th-quiz-meta-row">
                <span>{q.mcq} trắc nghiệm · {q.total - q.mcq} tự luận</span>
                <select
                  className="th-quiz-course-select"
                  value={q.course_id ?? ""}
                  disabled={savingCourseId === q.id}
                  onChange={(e) => saveCourse(q.id, e.target.value || null)}
                  title="Gán khoá học"
                >
                  <option value="">— Chưa gán khoá —</option>
                  {COURSES.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
              <button
                className={`btn btn-ghost btn-sm${statsId === q.id ? " btn-ghost--active" : ""}`}
                title="Xem thống kê học viên"
                onClick={() => setStatsId(statsId === q.id ? null : q.id)}
              >📊</button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => openPlay(q.id)}
                disabled={loadingId === q.id}
              >{loadingId === q.id ? "…" : "▶ Thử làm"}</button>
            </div>
          </div>
          {statsId === q.id && <QuizStatsPanel quizId={q.id} />}
        </div>
      ))}
      <div style={{ marginTop: 8 }}>
        <Link to="/admin/quiz-import" className="btn btn-ghost btn-sm">+ Tải lên bài mới</Link>
      </div>
    </div>
  );
}

function TeacherHome() {
  const { user } = useAuth();
  const nav = useNavigate();

  return (
    <div className="container" style={{ padding: "24px 16px 80px" }}>
      <div className="sh-greeting">
        Xin chào, <strong>{user?.displayName}</strong>
        <span className="sh-class-badge" style={{ background: "var(--c-red-bg)", color: "var(--c-red)" }}>Giáo viên</span>
      </div>

      <h2 className="section-h" style={{ marginTop: 28 }}>Quản lý lớp học</h2>
      <button className="btn btn-primary" style={{ marginBottom: 8 }} onClick={() => nav("/giaovu")}>
        🏫 Mở cổng giáo vụ
      </button>
      <p className="muted" style={{ fontSize: 13, marginTop: 4 }}>
        Xem danh sách lớp, học viên, điểm danh và tài liệu.
      </p>

      <h2 className="section-h" style={{ marginTop: 36 }}>Bài tập đã tải lên</h2>
      <TeacherQuizList />

      <h2 className="section-h" style={{ marginTop: 40 }}>Công cụ bài tập</h2>
      <div className="sh-old-grid">
        {TEACHER_EXERCISES.map((ex) => (
          <Link key={ex.to} to={ex.to} className="sh-old-card">
            <span className="sh-old-icon">{ex.icon}</span>
            <span className="sh-old-title">{ex.title}</span>
            <span className="muted" style={{ fontSize: 12 }}>{ex.desc}</span>
          </Link>
        ))}
      </div>

      <h2 className="section-h" style={{ marginTop: 40 }}>Khoá học</h2>
      <div className="course-grid">
        {COURSES.map((c) => (
          <Link key={c.id} className="course-tile" to={`/course/${c.id}`}>
            {c.status && (
              <span className={`course-status-badge ${STATUS_CLASS[c.status]}`}>
                {STATUS_LABEL[c.status]}
              </span>
            )}
            <h3>{c.title}</h3>
            <div className="muted">{c.subtitle}</div>
            <div className="tile-bar" style={{ background: c.color }} />
          </Link>
        ))}
      </div>
    </div>
  );
}
