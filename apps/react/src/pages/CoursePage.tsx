import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { fetchCourseLessons } from "../lib/lessons";
import type { Lesson } from "@hanai/shared";
import { INTERACTION_LABELS } from "@hanai/shared";

export function CoursePage() {
  const { courseId } = useParams();
  const [lessons, setLessons] = useState<Lesson[] | null>(null);
  useEffect(() => {
    if (!courseId) return;
    fetchCourseLessons(courseId).then(setLessons);
  }, [courseId]);

  return (
    <div className="container" style={{ padding: "36px 20px 80px" }}>
      <Link to="/" className="muted" style={{ textDecoration: "none" }}>← Tất cả khoá</Link>
      <h1 style={{ color: "var(--c-blue-dark)" }}>{courseId?.toUpperCase()}</h1>
      {!lessons && <div className="muted">Đang tải…</div>}
      <div className="lesson-list">
        {lessons?.map((l) => (
          <Link key={l.id} to={`/lesson/${l.id}`} className="lesson-row">
            <div>
              <strong>{l.title}</strong>
              <div className="muted" style={{ fontSize: 13 }}>{l.subtitle}</div>
            </div>
            <span className="badge">{INTERACTION_LABELS[l.interactionType]}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
