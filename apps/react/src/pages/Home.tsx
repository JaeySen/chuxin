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

      {/* New exercises — from teacher uploads */}
      <h2 className="section-h" style={{ marginTop: 28 }}>Bài tập</h2>
      {classes.length === 0 ? (
        <div className="feedback feedback-info">
          Bạn chưa được xếp lớp. Liên hệ giáo viên để được thêm vào lớp học.
        </div>
      ) : (
        <div className="sh-exercise-empty muted">
          Giáo viên chưa thêm bài tập mới. Hãy kiểm tra lại sau.
        </div>
      )}

      {/* Old exercises — disabled */}
      <h2 className="section-h" style={{ marginTop: 36 }}>Hoạt động học tập</h2>
      <p className="muted" style={{ marginBottom: 16, fontSize: 14 }}>
        Các hoạt động sau đang tạm thời không khả dụng. Giáo viên sẽ mở khi cần thiết.
      </p>
      <div className="sh-old-grid">
        {OLD_EXERCISES.map((ex) => (
          <div key={ex.to} className="sh-old-card sh-old-card--disabled">
            <span className="sh-old-icon">{ex.icon}</span>
            <span className="sh-old-title">{ex.title}</span>
            <span className="sh-old-badge">Tạm khóa</span>
          </div>
        ))}
      </div>
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

interface QuizSummary { id: string; slug: string; title: string; mcq: number; total: number; created_at: string; }
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

function TeacherQuizList() {
  const [quizzes, setQuizzes] = useState<QuizSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState<QuizDetail | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [savingTitle, setSavingTitle] = useState(false);
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
        <div key={q.id} className="th-quiz-row">
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
                <button
                  className="th-quiz-rename"
                  title="Đổi tên"
                  onClick={() => { setEditingId(q.id); setEditTitle(q.title); }}
                >✎</button>
              </div>
            )}
            <span className="th-quiz-meta">{q.mcq} trắc nghiệm · {q.total - q.mcq} tự luận</span>
          </div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => openPlay(q.id)}
            disabled={loadingId === q.id}
          >
            {loadingId === q.id ? "…" : "▶ Thử làm"}
          </button>
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
