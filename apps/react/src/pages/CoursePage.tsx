import { Link, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import type { CourseId, Chapter } from "@hanai/shared";
import { COURSES, CHAPTERS_BY_COURSE } from "@hanai/shared";
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

export function CoursePage() {
  const { courseId } = useParams();
  const { role } = useAuth();

  const course = COURSES.find((c) => c.id === courseId);
  const chapters: Chapter[] = courseId ? CHAPTERS_BY_COURSE[courseId as CourseId] ?? [] : [];

  useHead({
    title: course ? `${course.title} · Hán ngữ Sơ Tâm` : "Khoá học · Hán ngữ Sơ Tâm",
    description: course
      ? `Học ${course.title} — ${course.subtitle ?? ""}.`
      : "Khoá học tiếng Trung tại Hán ngữ Sơ Tâm.",
    canonical: courseId ? `https://www.hanngusotam.com/course/${courseId}` : undefined,
  });

  if (role === "teacher" || role === "admin") {
    return <TeacherCourseView courseId={courseId} course={course} chapters={chapters} />;
  }

  return <GuestCourseView courseId={courseId} course={course} chapters={chapters} />;
}

// ── Shared header ────────────────────────────────────────────────────────────

function CourseHeader({ course, courseId }: { course: typeof COURSES[number] | undefined; courseId?: string }) {
  return (
    <>
      <Link to="/" className="muted" style={{ textDecoration: "none" }}>← Tất cả khoá</Link>
      <h1 style={{ color: "var(--c-red-dark)", marginTop: 8 }}>
        {course?.title ?? courseId?.toUpperCase()}
      </h1>
      {course?.subtitle && <p className="muted" style={{ fontSize: 16 }}>{course.subtitle}</p>}
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

      {/* Chapter list — visible to everyone, content is static */}
      {chapters.length > 0 ? (
        <div className="chapter-list">
          {chapters.map((ch) => (
            <article key={ch.bai} className="chapter-card">
              <header className="chapter-header">
                <span className="chapter-number">Bài {ch.bai}</span>
                <span className="chapter-hanzi">{ch.hanzi}</span>
                <span className="chapter-vi">{ch.vi}</span>
              </header>
              <div className="chapter-body">
                <span className="chapter-stub">Nội dung sẽ cập nhật sớm</span>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="feedback feedback-info" style={{ marginTop: 16 }}>
          Khoá học này đang được biên soạn.
        </div>
      )}
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

  useEffect(() => {
    const qs = courseId ? `?courseId=${courseId}` : "";
    apiFetch<SavedQuiz[]>(`/admin/quiz${qs}`).then(setQuizzes).catch(() => {});
  }, [courseId, tab]); // re-fetch when switching back to exercises after upload

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
            <div className="cp-quiz-grid">
              {quizzes.map((q) => (
                <div key={q.id} className="cp-quiz-card">
                  <div className="cp-quiz-title">{q.title}</div>
                  <div className="cp-quiz-meta">
                    {q.mcq > 0 && <span>{q.mcq} trắc nghiệm</span>}
                    {q.open > 0 && <span>{q.open} tự luận</span>}
                  </div>
                  {q.source && <div className="cp-quiz-source">{q.source}</div>}
                </div>
              ))}
            </div>
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
