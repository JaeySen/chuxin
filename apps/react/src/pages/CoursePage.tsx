import { Link, useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { fetchCourseLessons } from "../lib/lessons";
import type { Lesson, CourseId } from "@hanai/shared";
import { INTERACTION_LABELS, COURSES, CHAPTERS_BY_COURSE } from "@hanai/shared";
import { useAuth } from "../lib/auth-context";

export function CoursePage() {
  const { courseId } = useParams();
  const { user } = useAuth();
  const [lessons, setLessons] = useState<Lesson[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!courseId || !user) { setLessons(null); return; }
    setLessons(null);
    setErr(null);
    fetchCourseLessons(courseId).then(setLessons).catch((e) => setErr(e.message));
  }, [courseId, user]);

  const course = COURSES.find((c) => c.id === courseId);
  const chapters = courseId ? CHAPTERS_BY_COURSE[courseId as CourseId] ?? [] : [];

  // Group lessons by their order field (treated as the bài number).
  const lessonsByBai = useMemo(() => {
    const map = new Map<number, Lesson[]>();
    for (const l of lessons ?? []) {
      const arr = map.get(l.order) ?? [];
      arr.push(l);
      map.set(l.order, arr);
    }
    return map;
  }, [lessons]);

  return (
    <div className="container" style={{ padding: "28px 20px 80px" }}>
      <Link to="/" className="muted" style={{ textDecoration: "none" }}>← Tất cả khoá</Link>
      <h1 style={{ color: "var(--c-red-dark)", marginTop: 8 }}>
        {course?.title ?? courseId?.toUpperCase()}
      </h1>
      {course?.subtitle && <p className="muted" style={{ fontSize: 16 }}>{course.subtitle}</p>}

      {err && <div className="feedback feedback-bad" style={{ marginTop: 16 }}>{err}</div>}
      {user && !lessons && !err && <div className="muted">Đang tải…</div>}

      {!user && (
        <div className="feedback feedback-info" style={{ marginTop: 16 }}>
          <strong>Đăng nhập để xem nội dung khoá học.</strong>{" "}
          Cấu trúc bài và chi tiết bài học sẽ hiển thị sau khi bạn đăng nhập.
        </div>
      )}

      {/* Chapter list — gated entirely; guests don't see headings either. */}
      {user && chapters.length > 0 ? (
        <div className="chapter-list">
          {chapters.map((ch) => {
            const matching = lessonsByBai.get(ch.bai) ?? [];
            return (
              <article key={ch.bai} className="chapter-card">
                <header className="chapter-header">
                  <span className="chapter-number">Bài {ch.bai}</span>
                  <span className="chapter-hanzi">{ch.hanzi}</span>
                  <span className="chapter-vi">{ch.vi}</span>
                </header>
                <div className="chapter-body">
                  {matching.length === 0 ? (
                    <span className="chapter-stub">Đang biên soạn</span>
                  ) : (
                    matching.map((l) => (
                      <Link key={l.id} to={`/lesson/${l.id}`} className="lesson-row">
                        <div>
                          <strong>{l.title}</strong>
                          {l.subtitle && (
                            <div className="muted" style={{ fontSize: 13 }}>{l.subtitle}</div>
                          )}
                        </div>
                        <span className="badge">{INTERACTION_LABELS[l.interactionType]}</span>
                      </Link>
                    ))
                  )}
                </div>
              </article>
            );
          })}
        </div>
      ) : user ? (
        // Fallback for courses without curriculum metadata yet (HSK2-6) — auth users only.
        <div className="lesson-list" style={{ marginTop: 16 }}>
          {lessons?.length === 0 && (
            <div className="feedback feedback-info">Khoá học này đang được biên soạn.</div>
          )}
          {lessons?.map((l) => (
            <Link key={l.id} to={`/lesson/${l.id}`} className="lesson-row">
              <div>
                <strong>{l.title}</strong>
                {l.subtitle && <div className="muted" style={{ fontSize: 13 }}>{l.subtitle}</div>}
              </div>
              <span className="badge">{INTERACTION_LABELS[l.interactionType]}</span>
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
