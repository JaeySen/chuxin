import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { fetchLesson } from "../lib/lessons";
import type { Lesson } from "@hanai/shared";
import { useAuth } from "../lib/auth-context";
import { LessonRenderer } from "../engines/LessonRenderer";

export function LessonPage() {
  const { lessonId } = useParams();
  const { user, loading } = useAuth();
  const [lesson, setLesson] = useState<Lesson | null | "missing">(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!lessonId) return;
    setLesson(null);
    fetchLesson(lessonId)
      .then((d) => setLesson(d ?? "missing"))
      .catch((e) => setErr(e.message));
  }, [lessonId]);

  if (loading) return null;
  if (!user) {
    return (
      <div className="lesson-shell">
        <div className="feedback feedback-info">Vui lòng đăng nhập để học bài.</div>
      </div>
    );
  }

  return (
    <div className="lesson-shell">
      <Link to="/" className="muted" style={{ textDecoration: "none" }}>← Tất cả bài học</Link>
      <div className="lesson-card" style={{ marginTop: 14 }}>
        {err && <div className="feedback feedback-bad">{err}</div>}
        {!lesson && !err && <div className="muted">Đang tải…</div>}
        {lesson === "missing" && (
          <div className="feedback feedback-bad">Không tìm thấy bài học «{lessonId}». Đã chạy sync chưa?</div>
        )}
        {lesson && lesson !== "missing" && (
          <>
            <h1 className="lesson-title">{lesson.title}</h1>
            {lesson.subtitle && <p className="lesson-subtitle">{lesson.subtitle}</p>}
            <div className="engine-host">
              <LessonRenderer lesson={lesson} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
