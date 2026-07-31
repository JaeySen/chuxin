import { Link, Navigate, useNavigate, useLocation } from "react-router-dom";
import { COURSES, type CourseStatus } from "@sotam/shared";
import { useAuth } from "../lib/auth-context";
import { useHead } from "../lib/useHead";
import { JsonLd } from "../components/JsonLd";
import { useEffect, useRef, useState } from "react";
import { getStoredJwt, getStoredSessionToken } from "../lib/api";
import { SignInModal } from "../lib/SignInModal";

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

const GAMES_INFO = [
  {
    icon: "🎯",
    title: "Bingo từ vựng",
    desc: "Giáo viên đọc từ, học viên đánh dấu ô tương ứng trên bảng Bingo cá nhân. Trò chơi rèn kỹ năng nghe — nhận diện từ nhanh trong môi trường áp lực vui vẻ, buộc học viên phải tập trung liên tục suốt tiết học.",
  },
  {
    icon: "🔍",
    title: "Tìm từ (Word Search)",
    desc: "Học viên tìm và khoanh từ tiếng Trung ẩn trong ô chữ. Hoạt động củng cố nhận diện mặt chữ Hán, phân biệt nét tương đồng và ghi nhớ hình dạng ký tự — đặc biệt hiệu quả cho người mới bắt đầu.",
  },
  {
    icon: "🔊",
    title: "Luyện Pinyin",
    desc: "Bài tập tương tác chọn thanh điệu và âm vần cho từng từ. Phản hồi tức thì giúp học viên sửa lỗi phát âm ngay lập tức, xây dựng nền tảng ngữ âm vững chắc trước khi chuyển sang hội thoại.",
  },
];

// ── Guest ─────────────────────────────────────────────────────────────────────

type LoginTarget = null | "student" | "teacher";

function GuestHome() {
  const location = useLocation();
  const [loginTarget, setLoginTarget] = useState<LoginTarget>(null);

  useEffect(() => {
    if (location.pathname === "/courses") {
      setTimeout(() => {
        document.getElementById("courses")?.scrollIntoView({ behavior: "smooth" });
      }, 80);
    }
  }, [location.pathname]);

  function scrollToCourses(e: React.MouseEvent) {
    e.preventDefault();
    document.getElementById("courses")?.scrollIntoView({ behavior: "smooth" });
    window.history.pushState({}, "", "/courses");
  }

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
            <a href="#courses" className="btn btn-primary" onClick={scrollToCourses}>Xem các khoá học</a>
            <Link to="/ve-chung-toi" className="btn btn-secondary">Về chúng tôi</Link>
          </div>
        </div>
        <div className="hero-art">
          <img src="/chuxin-logo.jpg" alt="Hán ngữ Sơ Tâm" />
        </div>
      </section>

      {/* Games section */}
      <section className="games-section">
        <h2 className="section-h">Học qua trò chơi — hiệu quả hơn bạn nghĩ</h2>
        <p className="games-intro">
          Nghiên cứu giáo dục cho thấy học qua trò chơi giúp ghi nhớ từ vựng lâu hơn 40% so với
          phương pháp truyền thống. Tại Sơ Tâm, trò chơi không phải phần thưởng — chúng
          <em> là</em> bài học.
        </p>
        <div className="games-grid">
          {GAMES_INFO.map((g) => (
            <div key={g.title} className="game-card">
              <div className="game-card-icon">{g.icon}</div>
              <h3 className="game-card-title">{g.title}</h3>
              <p className="game-card-desc">{g.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Portal cards */}
      <section className="portal-section">
        <div className="portal-grid">
          {/* Student card */}
          <div className="portal-card portal-card--student">
            <div className="portal-card-icon">📚</div>
            <h3 className="portal-card-title">Bài tập trực tuyến</h3>
            <p className="portal-card-desc">
              Học viên đăng nhập để truy cập bài tập, theo dõi tiến trình học tập
              và tham gia các hoạt động tương tác trong lớp.
            </p>
            <button
              className="btn btn-primary portal-card-btn"
              onClick={() => setLoginTarget("student")}
            >
              Đăng nhập học viên
            </button>
          </div>

          {/* Teacher card */}
          <div className="portal-card portal-card--teacher">
            <div className="portal-card-icon">🏫</div>
            <h3 className="portal-card-title">Tham gia với chúng tôi</h3>
            <p className="portal-card-desc">
              Giáo viên đăng nhập để quản lý lớp học, tạo bài tập và theo dõi
              kết quả học viên qua bảng điều khiển giáo vụ.
            </p>
            <button
              className="btn btn-secondary portal-card-btn"
              onClick={() => setLoginTarget("teacher")}
            >
              Đăng nhập giáo viên
            </button>
          </div>
        </div>
      </section>

      {loginTarget && (
        <SignInModal
          close={() => setLoginTarget(null)}
          redirectTo={loginTarget === "teacher" ? "/giaovu" : undefined}
          heading={loginTarget === "teacher" ? "Đăng nhập giáo viên" : "Đăng nhập học viên"}
        />
      )}

      {/* Courses */}
      <h2 className="section-h" id="courses">Các khoá học</h2>
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

// ── Pinyin helper ─────────────────────────────────────────────────────────────

export type PinyinPairs = [string, string][];
export type QuestionMeta = {
  text_pairs?: PinyinPairs;
  options_pairs?: Record<string, PinyinPairs>;
  areAllAnswerPinyin?: boolean;
} | null;

export function RubyText({ pairs, fallback }: { pairs?: PinyinPairs; fallback: string }) {
  if (!pairs || pairs.length === 0) return <>{fallback}</>;
  return (
    <>
      {pairs.map(([ch, py], i) =>
        py
          ? <ruby key={i}>{ch}<rt>{py}</rt></ruby>
          : <span key={i}>{ch}</span>
      )}
    </>
  );
}

// A string is "pinyin-only" when it has no CJK characters and contains at
// least one Latin/pinyin letter (tone marks included) — i.e. it reads as a
// pinyin transcription rather than Hán tự or Vietnamese meaning text.
const CJK_RE = /[一-鿿㐀-䶿豈-﫿]/;
const PINYIN_LETTER_RE = /[a-zA-ZüÜāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/;
function isPinyinOnlyText(s: string | null | undefined): boolean {
  if (!s) return false;
  const t = s.trim();
  if (!t || CJK_RE.test(t)) return false;
  return PINYIN_LETTER_RE.test(t);
}

// Detect "find the pinyin of <hán tự>" style MCQ questions: every option is
// a pinyin transcription. Showing ruby pinyin above the Chinese characters
// in the question text would hand the student the answer, so callers should
// suppress RubyText pairs for the question text in that case.
function isPinyinAnswerQuestion(q: { type: string; options: Record<string, string> }): boolean {
  if (q.type !== "mcq") return false;
  const vals = (["A", "B", "C", "D"] as const)
    .map((l) => q.options[l])
    .filter((v): v is string => !!v && v.trim().length > 0);
  if (vals.length < 2) return false;
  return vals.every(isPinyinOnlyText);
}

// ── Student ───────────────────────────────────────────────────────────────────

interface SQQuestion {
  num: number; text: string; type: string;
  options: Record<string, string>; answer: string | null;
  meta?: QuestionMeta;
}
interface StudentQuiz { id: string; title: string; mcq: number; total: number; }
export interface StudentQuizDetail extends StudentQuiz {
  slug: string; created_at: string; questions: SQQuestion[];
}
interface AttemptAnswer { questionNum: number; selected: string; isCorrect: boolean; }
interface AttemptState {
  attemptId: string; lastQuestionNum: number; score: number; answers: AttemptAnswer[];
}

// Student quiz player with full progress tracking.
export function StudentQuizPlayer({ quiz, onClose }: { quiz: StudentQuizDetail; onClose: () => void }) {
  const allQ = [...(quiz.questions ?? [])].sort((a, b) => a.num - b.num);
  const mcqCount = allQ.filter((q) => q.type === "mcq").length;
  const openCount = allQ.length - mcqCount;
  const hasMixed = mcqCount > 0 && openCount > 0;
  const [attempt, setAttempt] = useState<AttemptState | null>(null);
  const [idx, setIdx] = useState(0);
  const [activeTab, setActiveTab] = useState<"mcq" | "open">(mcqCount > 0 ? "mcq" : "open");
  const [picks, setPicks] = useState<Record<number, { selected: string; isCorrect: boolean }>>({});
  const [essays, setEssays] = useState<Record<number, string>>({});
  const [essaySubmitted, setEssaySubmitted] = useState<Record<number, boolean>>({});
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
          const resumeIdx = allQ.findIndex((q) => q.num >= data.lastQuestionNum);
          if (resumeIdx !== -1) {
            setIdx(resumeIdx);
            setActiveTab(allQ[resumeIdx].type === "open" ? "open" : "mcq");
          }
        }
      })
      .catch(() => { if (!cancelled) setStartError("Không kết nối được máy chủ."); });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quiz.id]);

  // Reset timer whenever question changes
  useEffect(() => { questionStartRef.current = Date.now(); }, [idx]);

  const q = allQ[idx];
  const picked = q ? picks[q.num] : undefined;
  const correct = q?.answer ?? null;
  const isAnswered = q
    ? (q.type === "mcq" ? !!picks[q.num] : !!essaySubmitted[q.num])
    : false;

  function isDoneAt(i: number): boolean {
    const qq = allQ[i];
    return qq.type === "mcq" ? !!picks[qq.num] : !!essaySubmitted[qq.num];
  }
  const sectionIndices = hasMixed
    ? allQ.reduce<number[]>((acc, qq, i) => { if (qq.type === activeTab) acc.push(i); return acc; }, [])
    : allQ.map((_, i) => i);
  const posInSection = sectionIndices.indexOf(idx);
  const otherTabType: "mcq" | "open" = activeTab === "mcq" ? "open" : "mcq";
  const otherIndices = hasMixed
    ? allQ.reduce<number[]>((acc, qq, i) => { if (qq.type === otherTabType) acc.push(i); return acc; }, [])
    : [];
  const mcqDoneCount = allQ.reduce((n, qq, i) => n + (qq.type === "mcq" && isDoneAt(i) ? 1 : 0), 0);
  const openDoneCount = allQ.reduce((n, qq, i) => n + (qq.type === "open" && isDoneAt(i) ? 1 : 0), 0);
  const otherSectionDone = otherIndices.length === 0 || otherIndices.every(isDoneAt);
  const isLastInSection = hasMixed && posInSection !== -1 && posInSection === sectionIndices.length - 1;
  const nextLabel = hasMixed
    ? (isLastInSection
        ? (otherSectionDone ? "Xem kết quả" : `Xong phần này · Sang ${otherTabType === "mcq" ? "Trắc nghiệm" : "Tự luận"} →`)
        : "Câu tiếp →")
    : (idx + 1 < allQ.length ? "Câu tiếp →" : "Xem kết quả");

  function switchTab(type: "mcq" | "open") {
    if (type === activeTab) return;
    const indices = allQ.reduce<number[]>((acc, qq, i) => { if (qq.type === type) acc.push(i); return acc; }, []);
    if (indices.length === 0) return;
    const target = indices.find((i) => !isDoneAt(i)) ?? indices[0];
    setActiveTab(type);
    setIdx(target);
  }

  async function pick(letter: string) {
    if (!attempt || picks[q.num] || saving) return;
    const reactionMs = Date.now() - questionStartRef.current;
    const isCorrect = letter === correct;
    const nextQ = idx + 1 < allQ.length ? allQ[idx + 1] : null;

    setSaving(true);
    setPicks((p) => ({ ...p, [q.num]: { selected: letter, isCorrect } }));
    if (isCorrect) setScore((s) => s + 1);

    try {
      await fetch(`${API}/quiz/attempts/${attempt.attemptId}/answer`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          questionNum: q.num, selected: letter, isCorrect, reactionMs,
          nextQuestionNum: nextQ?.num ?? null,
        }),
      });
    } catch {} // answer persists optimistically; server reconciles on next start
    setSaving(false);
  }

  async function submitEssay() {
    if (!attempt || essaySubmitted[q.num] || saving) return;
    const text = essays[q.num] ?? "";
    const reactionMs = Date.now() - questionStartRef.current;
    const nextQ = idx + 1 < allQ.length ? allQ[idx + 1] : null;

    setSaving(true);
    setEssaySubmitted((e) => ({ ...e, [q.num]: true }));

    try {
      await fetch(`${API}/quiz/attempts/${attempt.attemptId}/answer`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          questionNum: q.num, selected: text, isCorrect: false, reactionMs,
          nextQuestionNum: nextQ?.num ?? null,
        }),
      });
    } catch {}
    setSaving(false);
  }

  async function completeAttempt() {
    if (attempt) {
      try {
        await fetch(`${API}/quiz/attempts/${attempt.attemptId}/complete`, {
          method: "POST", credentials: "include", headers: authHeaders(),
        });
      } catch {}
    }
    setDone(true);
  }

  async function next() {
    if (hasMixed) {
      const pos = sectionIndices.indexOf(idx);
      if (pos !== -1 && pos + 1 < sectionIndices.length) {
        setIdx(sectionIndices[pos + 1]);
        return;
      }
      if (!otherSectionDone) {
        const target = otherIndices.find((i) => !isDoneAt(i)) ?? otherIndices[0];
        setActiveTab(otherTabType);
        setIdx(target);
        return;
      }
      await completeAttempt();
      return;
    }
    if (idx + 1 < allQ.length) {
      setIdx((i) => i + 1);
    } else {
      await completeAttempt();
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

  if (allQ.length === 0) {
    return (
      <div className="qp-shell">
        <div className="qp-empty">Bài này chưa có câu hỏi.</div>
        <button className="btn btn-ghost" onClick={onClose}>← Quay lại</button>
      </div>
    );
  }

  if (done) {
    const essayCount = allQ.length - mcqCount;
    const pct = mcqCount > 0 ? Math.round((score / mcqCount) * 100) : 0;
    return (
      <div className="qp-shell">
        <div className="qp-result">
          {mcqCount > 0 ? (
            <>
              <div className="qp-score">{score} / {mcqCount}</div>
              <div className="qp-pct">{pct}%</div>
              <div className="qp-result-label">
                {pct >= 80 ? "Xuất sắc! 🎉" : pct >= 60 ? "Khá tốt! 👍" : "Cần ôn luyện thêm 💪"}
              </div>
            </>
          ) : (
            <div className="qp-result-label">Hoàn thành bài tập! 🎉</div>
          )}
          {essayCount > 0 && (
            <div style={{ marginTop: 10, fontSize: 13, color: "var(--c-text-muted)" }}>
              + {essayCount} câu tự luận (không tính điểm tự động)
            </div>
          )}
          <button className="btn btn-ghost" style={{ marginTop: 20 }} onClick={onClose}>← Quay lại</button>
        </div>
      </div>
    );
  }

  return (
    <div className="qp-shell">
      <div className="qp-top">
        <button className="btn btn-ghost btn-sm" onClick={onClose}>← Quay lại</button>
        <span className="qp-progress">
          {hasMixed ? `${posInSection + 1} / ${sectionIndices.length}` : `${idx + 1} / ${allQ.length}`}
        </span>
      </div>
      {hasMixed && (
        <div className="qp-tabs">
          <button
            className={`qp-tab${activeTab === "mcq" ? " qp-tab--active" : ""}`}
            onClick={() => switchTab("mcq")}
          >
            Trắc nghiệm <span className="qp-section-badge">{mcqDoneCount}/{mcqCount}</span>
          </button>
          <button
            className={`qp-tab${activeTab === "open" ? " qp-tab--active" : ""}`}
            onClick={() => switchTab("open")}
          >
            Tự luận <span className="qp-section-badge">{openDoneCount}/{openCount}</span>
          </button>
        </div>
      )}
      <div className="qp-bar-track">
        <div
          className="qp-bar-fill"
          style={{ width: `${hasMixed ? (posInSection / sectionIndices.length) * 100 : (idx / allQ.length) * 100}%` }}
        />
      </div>
      <div className="qp-card">
        <div className="qp-num">
          Câu {q.num}
          {q.type === "open" && <span className="qp-type-badge">Tự luận</span>}
        </div>
        <div className="qp-text">
          <RubyText pairs={(q.meta?.areAllAnswerPinyin ?? isPinyinAnswerQuestion(q)) ? undefined : (q.meta?.text_pairs ?? undefined)} fallback={q.text} />
        </div>
        {q.type === "mcq" ? (
          <>
            <div className={`qp-options${isShortOptionSet(q.options) ? " qp-options--grid" : ""}`}>
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
                    <span className="qp-opt-text">
                      <RubyText pairs={q.meta?.options_pairs?.[letter] ?? undefined} fallback={text} />
                    </span>
                  </button>
                );
              })}
            </div>
            {picked && (
              <div className={`qp-feedback ${picked.isCorrect ? "qp-feedback--correct" : "qp-feedback--wrong"}`}>
                {picked.isCorrect ? "✓ Chính xác!" : `✗ Đáp án đúng: ${correct}`}
              </div>
            )}
          </>
        ) : (
          <>
            <textarea
              className="qp-essay-area"
              placeholder="Nhập câu trả lời của bạn…"
              value={essays[q.num] ?? ""}
              onChange={(e) => setEssays((es) => ({ ...es, [q.num]: e.target.value }))}
              disabled={!!essaySubmitted[q.num]}
              rows={4}
            />
            {!essaySubmitted[q.num] && (
              <button
                className="btn btn-primary"
                style={{ marginTop: 12 }}
                onClick={submitEssay}
                disabled={saving || !(essays[q.num] ?? "").trim()}
              >
                Nộp câu trả lời
              </button>
            )}
            {essaySubmitted[q.num] && (
              <div className="qp-essay-reveal">
                <div className="qp-essay-reveal-label">Đáp án tham khảo</div>
                <div className="qp-essay-reveal-text">{correct ?? "—"}</div>
              </div>
            )}
          </>
        )}
      </div>
      {isAnswered && (
        <button className="btn btn-primary qp-next" onClick={next}>
          {nextLabel}
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

export const API = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

const TEACHER_EXERCISES = [
  { title: "Ngữ âm Pinyin", icon: "🔊", to: "/pinyin",     desc: "Luyện thanh mẫu / vận mẫu / thanh điệu" },
  { title: "Tìm từ",        icon: "🔍", to: "/word-search", desc: "Tạo & quản lý trò chơi Tìm từ" },
  { title: "Bingo",         icon: "🎯", to: "/bingo",       desc: "Tạo & quản lý trò chơi Bingo" },
];

interface QuizSummary { id: string; slug: string; title: string; mcq: number; total: number; created_at: string; course_id?: string; }
export interface QuizDetail extends QuizSummary {
  questions: { num: number; text: string; type: string; options: Record<string, string>; answer: string | null; meta?: QuestionMeta }[];
}

function isShortOptionSet(options: Record<string, string>): boolean {
  const vals = (["A", "B", "C", "D"] as const).map((l) => options[l]).filter(Boolean) as string[];
  if (vals.length < 2) return false;
  return vals.every((v) => v.trim().split(/\s+/).length <= 3 && v.length <= 12);
}

export function authHeaders() {
  const jwt = getStoredJwt();
  const sessionToken = getStoredSessionToken();
  return {
    ...(jwt && { Authorization: `Bearer ${jwt}` }),
    ...(sessionToken && { "X-Session-Token": sessionToken }),
  };
}

export function QuizPlayerInline({ quiz, onClose }: { quiz: QuizDetail; onClose: () => void }) {
  const allQ = [...(quiz.questions ?? [])].sort((a, b) => a.num - b.num);
  const mcqCount = allQ.filter((q) => q.type === "mcq").length;
  const openCount = allQ.length - mcqCount;
  const hasMixed = mcqCount > 0 && openCount > 0;
  const [idx, setIdx] = useState(0);
  const [activeTab, setActiveTab] = useState<"mcq" | "open">(mcqCount > 0 ? "mcq" : "open");
  const [picks, setPicks] = useState<Record<number, string>>({});
  const [essays, setEssays] = useState<Record<number, string>>({});
  const [essaySubmitted, setEssaySubmitted] = useState<Record<number, boolean>>({});
  const [done, setDone] = useState(false);

  const q = allQ[idx];
  const picked = q ? picks[q.num] : undefined;
  const correct = q?.answer ?? null;
  const isAnswered = q
    ? (q.type === "mcq" ? !!picks[q.num] : !!essaySubmitted[q.num])
    : false;

  function isDoneAt(i: number): boolean {
    const qq = allQ[i];
    return qq.type === "mcq" ? !!picks[qq.num] : !!essaySubmitted[qq.num];
  }
  const sectionIndices = hasMixed
    ? allQ.reduce<number[]>((acc, qq, i) => { if (qq.type === activeTab) acc.push(i); return acc; }, [])
    : allQ.map((_, i) => i);
  const posInSection = sectionIndices.indexOf(idx);
  const otherTabType: "mcq" | "open" = activeTab === "mcq" ? "open" : "mcq";
  const otherIndices = hasMixed
    ? allQ.reduce<number[]>((acc, qq, i) => { if (qq.type === otherTabType) acc.push(i); return acc; }, [])
    : [];
  const mcqDoneCount = allQ.reduce((n, qq, i) => n + (qq.type === "mcq" && isDoneAt(i) ? 1 : 0), 0);
  const openDoneCount = allQ.reduce((n, qq, i) => n + (qq.type === "open" && isDoneAt(i) ? 1 : 0), 0);
  const otherSectionDone = otherIndices.length === 0 || otherIndices.every(isDoneAt);
  const isLastInSection = hasMixed && posInSection !== -1 && posInSection === sectionIndices.length - 1;
  const nextLabel = hasMixed
    ? (isLastInSection
        ? (otherSectionDone ? "Xem kết quả" : `Xong phần này · Sang ${otherTabType === "mcq" ? "Trắc nghiệm" : "Tự luận"} →`)
        : "Câu tiếp →")
    : (idx + 1 < allQ.length ? "Câu tiếp →" : "Xem kết quả");

  function switchTab(type: "mcq" | "open") {
    if (type === activeTab) return;
    const indices = allQ.reduce<number[]>((acc, qq, i) => { if (qq.type === type) acc.push(i); return acc; }, []);
    if (indices.length === 0) return;
    const target = indices.find((i) => !isDoneAt(i)) ?? indices[0];
    setActiveTab(type);
    setIdx(target);
  }

  function pick(letter: string) {
    if (picks[q.num]) return;
    setPicks((p) => ({ ...p, [q.num]: letter }));
  }
  function submitEssay() {
    if (essaySubmitted[q.num] || !(essays[q.num] ?? "").trim()) return;
    setEssaySubmitted((e) => ({ ...e, [q.num]: true }));
  }
  function next() {
    if (hasMixed) {
      const pos = sectionIndices.indexOf(idx);
      if (pos !== -1 && pos + 1 < sectionIndices.length) {
        setIdx(sectionIndices[pos + 1]);
        return;
      }
      if (!otherSectionDone) {
        const target = otherIndices.find((i) => !isDoneAt(i)) ?? otherIndices[0];
        setActiveTab(otherTabType);
        setIdx(target);
        return;
      }
      setDone(true);
      return;
    }
    if (idx + 1 < allQ.length) setIdx((i) => i + 1);
    else setDone(true);
  }
  function reset() {
    setPicks({}); setEssays({}); setEssaySubmitted({}); setIdx(0); setDone(false); setActiveTab(mcqCount > 0 ? "mcq" : "open");
  }

  const score = allQ.filter((q) => q.type === "mcq" && picks[q.num] === q.answer).length;

  if (allQ.length === 0) {
    return (
      <div className="qp-shell">
        <button className="btn btn-ghost btn-sm" onClick={onClose}>← Quay lại</button>
        <div className="qp-empty">Bài này chưa có câu hỏi.</div>
      </div>
    );
  }

  if (done) {
    const essayCount = allQ.length - mcqCount;
    const pct = mcqCount > 0 ? Math.round((score / mcqCount) * 100) : 0;
    return (
      <div className="qp-shell">
        <div className="qp-result">
          {mcqCount > 0 ? (
            <>
              <div className="qp-score">{score} / {mcqCount}</div>
              <div className="qp-pct">{pct}%</div>
              <div className="qp-result-label">
                {pct >= 80 ? "Xuất sắc! 🎉" : pct >= 60 ? "Khá tốt! 👍" : "Cần ôn luyện thêm 💪"}
              </div>
            </>
          ) : (
            <div className="qp-result-label">Hoàn thành bài tập! 🎉</div>
          )}
          {essayCount > 0 && (
            <div style={{ marginTop: 10, fontSize: 13, color: "var(--c-text-muted)" }}>
              + {essayCount} câu tự luận (không tính điểm tự động)
            </div>
          )}
          <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
            <button className="btn btn-primary" onClick={reset}>Làm lại</button>
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
        <span className="qp-progress">
          {hasMixed ? `${posInSection + 1} / ${sectionIndices.length}` : `${idx + 1} / ${allQ.length}`}
        </span>
      </div>
      {hasMixed && (
        <div className="qp-tabs">
          <button
            className={`qp-tab${activeTab === "mcq" ? " qp-tab--active" : ""}`}
            onClick={() => switchTab("mcq")}
          >
            Trắc nghiệm <span className="qp-section-badge">{mcqDoneCount}/{mcqCount}</span>
          </button>
          <button
            className={`qp-tab${activeTab === "open" ? " qp-tab--active" : ""}`}
            onClick={() => switchTab("open")}
          >
            Tự luận <span className="qp-section-badge">{openDoneCount}/{openCount}</span>
          </button>
        </div>
      )}
      <div className="qp-bar-track">
        <div
          className="qp-bar-fill"
          style={{ width: `${hasMixed ? (posInSection / sectionIndices.length) * 100 : (idx / allQ.length) * 100}%` }}
        />
      </div>
      <div className="qp-card">
        <div className="qp-num">
          Câu {q.num}
          {q.type === "open" && <span className="qp-type-badge">Tự luận</span>}
        </div>
        <div className="qp-text">
          <RubyText pairs={(q.meta?.areAllAnswerPinyin ?? isPinyinAnswerQuestion(q)) ? undefined : (q.meta?.text_pairs ?? undefined)} fallback={q.text} />
        </div>
        {q.type === "mcq" ? (
          <>
            <div className={`qp-options${isShortOptionSet(q.options) ? " qp-options--grid" : ""}`}>
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
                    <span className="qp-opt-text">
                      <RubyText pairs={q.meta?.options_pairs?.[letter] ?? undefined} fallback={text} />
                    </span>
                  </button>
                );
              })}
            </div>
            {picked && (
              <div className={`qp-feedback ${picked === correct ? "qp-feedback--correct" : "qp-feedback--wrong"}`}>
                {picked === correct ? "✓ Chính xác!" : `✗ Đáp án đúng: ${correct}`}
              </div>
            )}
          </>
        ) : (
          <>
            <textarea
              className="qp-essay-area"
              placeholder="Nhập câu trả lời của bạn…"
              value={essays[q.num] ?? ""}
              onChange={(e) => setEssays((es) => ({ ...es, [q.num]: e.target.value }))}
              disabled={!!essaySubmitted[q.num]}
              rows={4}
            />
            {!essaySubmitted[q.num] && (
              <button
                className="btn btn-primary"
                style={{ marginTop: 12 }}
                onClick={submitEssay}
                disabled={!(essays[q.num] ?? "").trim()}
              >
                Nộp câu trả lời
              </button>
            )}
            {essaySubmitted[q.num] && (
              <div className="qp-essay-reveal">
                <div className="qp-essay-reveal-label">Đáp án tham khảo</div>
                <div className="qp-essay-reveal-text">{correct ?? "—"}</div>
              </div>
            )}
          </>
        )}
      </div>
      {isAnswered && (
        <button className="btn btn-primary qp-next" onClick={next}>
          {nextLabel}
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

// ── Re-upload modal ──────────────────────────────────────────────────────────

interface ReuploadPreview {
  questions: { num: number; text: string; type: string; options: Record<string, string>; answer: string | null }[];
  meta: { total: number; mcq: number; open: number };
  previous: { total: number; mcq: number; open: number };
  revisionSaved: boolean;
}

function ReuploadModal({
  quiz,
  onClose,
  onDone,
}: {
  quiz: QuizSummary;
  onClose: () => void;
  onDone: (updated: { mcq: number; total: number }) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging]   = useState(false);
  const [parsing, setParsing]     = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [preview, setPreview]     = useState<ReuploadPreview | null>(null);
  const [error, setError]         = useState<string | null>(null);
  const [done, setDone]           = useState(false);

  async function upload(file: File) {
    setParsing(true); setError(null); setPreview(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`${API}/admin/quiz/${quiz.id}/reupload`, {
        method: "POST", body: form, credentials: "include",
        headers: authHeaders(),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? `HTTP ${res.status}`);
      setPreview(body as ReuploadPreview);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload thất bại");
    } finally {
      setParsing(false);
    }
  }

  function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    upload(file);
  }

  if (done && preview) {
    return (
      <div className="ru-overlay" onClick={onClose}>
        <div className="ru-modal" onClick={(e) => e.stopPropagation()}>
          <div className="ru-success">
            <div className="ru-success-icon">✓</div>
            <div className="ru-success-title">Cập nhật thành công!</div>
            <div className="ru-success-body">
              <b>{quiz.title}</b> đã được cập nhật.
              Phiên bản cũ ({preview.previous.mcq} TN · {preview.previous.total - preview.previous.mcq} TL)
              đã được lưu vào lịch sử.
            </div>
            <div className="ru-success-new">
              Phiên bản mới: <b>{preview.meta.mcq} trắc nghiệm · {preview.meta.open} tự luận</b>
            </div>
            <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={onClose}>
              Đóng
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ru-overlay" onClick={onClose}>
      <div className="ru-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="ru-header">
          <div>
            <div className="ru-title">🔄 Tải lại PDF</div>
            <div className="ru-subtitle">{quiz.title}</div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>

        {/* Step 1 — file drop */}
        {!preview && (
          <div
            className={`ru-dropzone${dragging ? " ru-dropzone--active" : ""}`}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
            onClick={() => !parsing && inputRef.current?.click()}
            role="button" tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
          >
            <input ref={inputRef} type="file" accept=".pdf,.docx" style={{ display: "none" }}
              onChange={(e) => handleFiles(e.target.files)} />
            {parsing ? (
              <div className="ru-loading"><span className="qi-spinner" />Đang phân tích…</div>
            ) : (
              <>
                <div style={{ fontSize: 32 }}>📄</div>
                <div className="ru-drop-label">Kéo thả PDF / DOCX hoặc <span className="qi-link">chọn file</span></div>
                <div className="ru-drop-hint">Dữ liệu cũ sẽ được lưu vào lịch sử trước khi thay thế</div>
              </>
            )}
          </div>
        )}

        {error && <div className="qi-error">{error}</div>}

        {/* Step 2 — preview diff */}
        {preview && !confirming && (
          <div className="ru-diff">
            <div className="ru-diff-title">Xem lại thay đổi</div>

            <div className="ru-diff-row">
              <div className="ru-diff-col ru-diff-col--old">
                <div className="ru-diff-label">Phiên bản cũ</div>
                <div className="ru-diff-count">
                  <span>{preview.previous.mcq}</span> TN &nbsp;·&nbsp; <span>{preview.previous.total - preview.previous.mcq}</span> TL
                </div>
              </div>
              <div className="ru-diff-arrow">→</div>
              <div className="ru-diff-col ru-diff-col--new">
                <div className="ru-diff-label">Phiên bản mới</div>
                <div className="ru-diff-count">
                  <span>{preview.meta.mcq}</span> TN &nbsp;·&nbsp; <span>{preview.meta.open}</span> TL
                </div>
              </div>
            </div>

            {/* Question type breakdown */}
            <div className="ru-q-list">
              {preview.questions.map((q) => (
                <div key={q.num} className={`ru-q-row${q.type === "open" ? " ru-q-row--open" : ""}`}>
                  <span className="ru-q-num">Câu {q.num}</span>
                  <span className={`ru-q-badge ru-q-badge--${q.type}`}>
                    {q.type === "mcq" ? "TN" : "TL"}
                  </span>
                  <span className="ru-q-text">{q.text.slice(0, 80)}{q.text.length > 80 ? "…" : ""}</span>
                </div>
              ))}
            </div>

            <div className="ru-diff-actions">
              <button className="btn btn-ghost" onClick={() => { setPreview(null); setError(null); }}>
                ← Chọn file khác
              </button>
              <button className="btn btn-primary" onClick={() => { setConfirming(true); setDone(true); onDone({ mcq: preview.meta.mcq, total: preview.meta.total }); }}>
                ✓ Xác nhận cập nhật
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Teacher quiz list ─────────────────────────────────────────────────────────

function TeacherQuizList() {
  const [quizzes, setQuizzes] = useState<QuizSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [savingTitle, setSavingTitle] = useState(false);
  const [statsId, setStatsId] = useState<string | null>(null);
  const [savingCourseId, setSavingCourseId] = useState<string | null>(null);
  const [reuploadQuiz, setReuploadQuiz] = useState<QuizSummary | null>(null);
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
                className="btn btn-ghost btn-sm"
                title="Tải lại PDF (re-upload)"
                onClick={() => setReuploadQuiz(q)}
              >🔄</button>
              <button
                className={`btn btn-ghost btn-sm${statsId === q.id ? " btn-ghost--active" : ""}`}
                title="Xem thống kê học viên"
                onClick={() => setStatsId(statsId === q.id ? null : q.id)}
              >📊</button>
              <Link
                to={`/admin/quiz/${q.id}/play`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary btn-sm"
              >▶ Thử làm</Link>
            </div>
          </div>
          {statsId === q.id && <QuizStatsPanel quizId={q.id} />}
        </div>
      ))}
      <div style={{ marginTop: 8 }}>
        <Link to="/admin/quiz-import" className="btn btn-ghost btn-sm">+ Tải lên bài mới</Link>
      </div>

      {/* Re-upload modal */}
      {reuploadQuiz && (
        <ReuploadModal
          quiz={reuploadQuiz}
          onClose={() => setReuploadQuiz(null)}
          onDone={({ mcq, total }) => {
            setQuizzes((prev) =>
              prev.map((q) =>
                q.id === reuploadQuiz.id ? { ...q, mcq, total } : q
              )
            );
          }}
        />
      )}
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
