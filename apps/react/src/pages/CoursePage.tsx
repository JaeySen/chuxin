import { Link, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import type { CourseId, Chapter } from "@sotam/shared";
import { COURSES, CHAPTERS_BY_COURSE } from "@sotam/shared";
import { useHead } from "../lib/useHead";
import { useAuth } from "../lib/auth-context";
import { QuizImportPage } from "./QuizImportPage";
import { apiFetch } from "../lib/api";

interface SavedQuiz {
  id: string;
  slug: string;
  title: string;
  source: string | null;
  course_id: string | null;
  created_at: string;
  total: number;
  mcq: number;
  open: number;
}

const OLD_EXERCISES = [
  { title: "Ngữ âm Pinyin", icon: "🔊", to: "/pinyin" },
  { title: "Tìm từ",        icon: "🔍", to: "/word-search" },
  { title: "Bingo",         icon: "🎯", to: "/bingo" },
];

const URL_TO_COURSE_ID: Record<string, string> = {
  "hsk1": "han1",
  "hsk2": "han2",
  "hsk3": "han3",
  "hsk4": "han4",
  "hsk5": "han5",
  "hsk6": "han6",
  "tieng-trung-tre-em": "tre-em",
  "tieng-trung-thuong-mai": "thuong-mai",
};

export function CoursePage() {
  const { courseId } = useParams();
  const { role } = useAuth();

  const mappedCourseId = URL_TO_COURSE_ID[courseId || ""] || courseId;
  const course = COURSES.find((c) => c.id === mappedCourseId);
  const chapters: Chapter[] = mappedCourseId ? CHAPTERS_BY_COURSE[mappedCourseId as CourseId] ?? [] : [];

  useHead({
    title: course ? `${course.title} · Hán ngữ Sơ Tâm` : "Khoá học · Hán ngữ Sơ Tâm",
    description: course
      ? `Học ${course.title} — ${course.subtitle ?? ""}.`
      : "Khoá học tiếng Trung tại Hán ngữ Sơ Tâm.",
    canonical: courseId ? `https://www.hanngusotam.com/course/${courseId}` : undefined,
  });

  if (role === "teacher" || role === "admin") {
    return <TeacherCourseView courseId={mappedCourseId} course={course} chapters={chapters} />;
  }

  return <GuestCourseView courseId={mappedCourseId} course={course} chapters={chapters} />;
}


function BrochureModal({ url, close }: { url: string; close: () => void }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [close]);

  const modal = (
    <div className="sotam-modal" style={{ background: "rgba(0,0,0,0.85)" }} onClick={close}>
      <button className="btn btn-ghost close-x" style={{ color: "white", fontSize: 24, top: 20, right: 20 }} onClick={close}>✕</button>
      <div className="brochure-theatre" onClick={e => e.stopPropagation()}>
        <iframe src={url} className="brochure-iframe" title="Brochure" />
      </div>
    </div>
  );
  return createPortal(modal, document.body);
}

// ── Shared header ────────────────────────────────────────────────────────────

function CourseHeader({ course, courseId }: { course: typeof COURSES[number] | undefined; courseId?: string }) {
  const [openBrochure, setOpenBrochure] = useState(false);
  return (
    <>
      <Link to="/" className="muted" style={{ textDecoration: "none" }}>← Tất cả khoá</Link>
      <h1 style={{ color: "var(--c-red-dark)", marginTop: 8 }}>
        {course?.title ?? courseId?.toUpperCase()}
      </h1>
      {course?.subtitle && <p className="muted" style={{ fontSize: 16 }}>{course.subtitle}</p>}
      {course?.brochureUrl && (
        <div style={{ marginTop: 24, marginBottom: 40, width: '100%', borderRadius: 16, overflow: 'hidden', boxShadow: '0 8px 30px rgba(0,0,0,0.12)', border: '1px solid var(--c-border)' }}>
          <img src={course.brochureUrl} alt={`Brochure ${course.title}`} style={{ width: '100%', display: 'block', height: 'auto' }} />
        </div>
      )}
    </>
  );
}

// ── Guest / Student view (static, no login gate) ─────────────────────────────

function GuestCourseView({
  courseId,
  course,
  chapters,
}: {
  courseId?: string;
  course: typeof COURSES[number] | undefined;
  chapters: Chapter[];
}) {
  return (
    <div className="container" style={{ padding: "28px 20px 80px" }}>
      <CourseHeader course={course} courseId={courseId} />


    </div>
  );
}

// ── Teacher / Admin view ──────────────────────────────────────────────────────

function TeacherCourseView({
  courseId,
  course,
  chapters,
}: {
  courseId?: string;
  course: typeof COURSES[number] | undefined;
  chapters: Chapter[];
}) {
  const [tab, setTab] = useState<"exercises" | "upload" | "curriculum">("exercises");
  const [quizzes, setQuizzes] = useState<SavedQuiz[]>([]);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [reorderError, setReorderError] = useState<string | null>(null);

  useEffect(() => {
    const qs = courseId ? `?courseId=${courseId}` : "";
    apiFetch<SavedQuiz[]>(`/admin/quiz${qs}`).then(setQuizzes).catch(() => {});
  }, [courseId, tab]); // re-fetch when switching back to exercises after upload

  function handleDragStart(id: string) {
    setDragId(id);
    setReorderError(null);
  }

  function handleDragOver(e: React.DragEvent, id: string) {
    e.preventDefault();
    if (id !== dragOverId) setDragOverId(id);
  }

  function handleDrop(targetId: string) {
    if (!dragId || dragId === targetId) {
      setDragId(null);
      setDragOverId(null);
      return;
    }
    const fromIdx = quizzes.findIndex((q) => q.id === dragId);
    const toIdx = quizzes.findIndex((q) => q.id === targetId);
    if (fromIdx === -1 || toIdx === -1) {
      setDragId(null);
      setDragOverId(null);
      return;
    }
    const next = [...quizzes];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    setQuizzes(next);
    setDragId(null);
    setDragOverId(null);

    if (!courseId) return; // reorder is per-course only
    apiFetch("/admin/quiz/reorder", {
      method: "POST",
      body: JSON.stringify({ courseId, quizIds: next.map((q) => q.id) }),
    }).catch(() => setReorderError("Không lưu được thứ tự mới. Vui lòng thử lại."));
  }

  function handleDragEnd() {
    setDragId(null);
    setDragOverId(null);
  }

  return (
    <div className="container" style={{ padding: "28px 20px 80px" }}>
      <CourseHeader course={course} courseId={courseId} />

      {/* Tab bar */}
      <div className="cp-tabs">
        <button className={`cp-tab${tab === "exercises" ? " cp-tab--active" : ""}`} onClick={() => setTab("exercises")}>
          Bài tập
        </button>
        <button className={`cp-tab${tab === "upload" ? " cp-tab--active" : ""}`} onClick={() => setTab("upload")}>
          Tải lên đề thi
        </button>
        <button className={`cp-tab${tab === "curriculum" ? " cp-tab--active" : ""}`} onClick={() => setTab("curriculum")}>
          Chương trình
        </button>
      </div>

      {/* Exercises tab */}
      {tab === "exercises" && (
        <div style={{ marginTop: 24 }}>
          {quizzes.length === 0 ? (
            <div className="feedback feedback-info" style={{ marginBottom: 20 }}>
              Chưa có bài tập mới. Dùng tab <strong>Tải lên đề thi</strong> để thêm bài tập từ PDF/DOCX.
            </div>
          ) : (
            <>
              {reorderError && (
                <div className="feedback feedback-error" style={{ marginBottom: 12 }}>{reorderError}</div>
              )}
              <div className="cp-quiz-grid">
                {quizzes.map((q) => (
                  <div
                    key={q.id}
                    className={`cp-quiz-card${dragId === q.id ? " cp-quiz-card--dragging" : ""}${dragOverId === q.id && dragId !== q.id ? " cp-quiz-card--dragover" : ""}`}
                    draggable={!!courseId}
                    onDragStart={() => handleDragStart(q.id)}
                    onDragOver={(e) => handleDragOver(e, q.id)}
                    onDrop={() => handleDrop(q.id)}
                    onDragEnd={handleDragEnd}
                  >
                    {courseId && <span className="cp-quiz-drag" title="Kéo để sắp xếp lại">⠿</span>}
                    <div className="cp-quiz-body">
                      <div className="cp-quiz-title">{q.title}</div>
                      <div className="cp-quiz-meta">
                        {q.mcq > 0 && <span>{q.mcq} trắc nghiệm</span>}
                        {q.open > 0 && <span>{q.open} tự luận</span>}
                      </div>
                      {q.source && <div className="cp-quiz-source">{q.source}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          <h3 className="cp-section-label">Hoạt động cũ (đang tắt cho học sinh)</h3>
          <div className="sh-old-grid">
            {OLD_EXERCISES.map((ex) => (
              <Link key={ex.to} to={ex.to} className="sh-old-card sh-old-card--teacher">
                <span className="sh-old-icon">{ex.icon}</span>
                <span className="sh-old-title">{ex.title}</span>
                <span className="sh-old-badge sh-old-badge--teacher">Chỉ giáo viên</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Upload tab */}
      {tab === "upload" && <QuizImportPage standalone={false} courseId={courseId} />}

      {/* Curriculum tab */}
      {tab === "curriculum" && (
        <div style={{ marginTop: 24 }}>
          {chapters.length > 0 ? (
            <div className="chapter-list">
              {chapters.map((ch) => (
                <article key={ch.bai} className="chapter-card">
                  <header className="chapter-header">
                    <span className="chapter-number">Bài {ch.bai}</span>
                    <span className="chapter-hanzi">{ch.hanzi}</span>
                    <span className="chapter-vi">{ch.vi}</span>
                  </header>
                </article>
              ))}
            </div>
          ) : (
            <div className="feedback feedback-info">Khoá học này chưa có chương trình chi tiết.</div>
          )}
        </div>
      )}
    </div>
  );
}
