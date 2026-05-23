import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { fetchAllLessons } from "../lib/lessons";
import type { Lesson } from "@hanai/shared";
import { INTERACTION_LABELS } from "@hanai/shared";

const COURSES = [
  { id: "han1", title: "Hán ngữ 1", subtitle: "Khởi đầu", color: "#FF8C00" },
  { id: "han2", title: "Hán ngữ 2", subtitle: "Tiếp nối", color: "#0EA5E9" },
  { id: "han3", title: "Hán ngữ 3", subtitle: "Mở rộng", color: "#10B981" },
  { id: "han4", title: "Hán ngữ 4", subtitle: "Đọc — Nói", color: "#8B5CF6" },
];

export function Home() {
  const [lessons, setLessons] = useState<Lesson[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    fetchAllLessons().then(setLessons).catch((e) => setErr(e.message));
  }, []);

  return (
    <div className="container" style={{ padding: "36px 20px 80px" }}>
      <h1 style={{ marginTop: 0, color: "var(--c-blue-dark)" }}>Lớp học tiếng Trung trực tuyến</h1>
      <p className="muted" style={{ fontSize: 18, maxWidth: 640 }}>
        Chọn một khoá học bên dưới để bắt đầu. Tiến độ và điểm số được lưu tự động khi bạn đăng nhập.
      </p>

      <h2 style={{ marginTop: 36, color: "var(--c-blue)" }}>Các khoá học</h2>
      <div className="course-grid">
        {COURSES.map((c) => (
          <Link key={c.id} className="course-tile" to={`/course/${c.id}`}>
            <h3>{c.title}</h3>
            <div className="muted">{c.subtitle}</div>
            <div className="tile-bar" style={{ background: c.color }} />
          </Link>
        ))}
      </div>

      <h2 style={{ marginTop: 48, color: "var(--c-blue)" }}>Tất cả bài học</h2>
      {err && <div className="feedback feedback-bad">{err}</div>}
      {!lessons && !err && <div className="muted">Đang tải…</div>}
      {lessons?.length === 0 && (
        <div className="feedback feedback-info">
          Chưa có bài học nào. Hãy chạy <code>pnpm sync:emulator</code> để nạp dữ liệu mẫu.
        </div>
      )}
      <div className="lesson-list">
        {lessons?.map((l) => (
          <Link key={l.id} to={`/lesson/${l.id}`} className="lesson-row">
            <div>
              <strong>{l.title}</strong>
              <div className="muted" style={{ fontSize: 13 }}>
                {l.course} · ~{l.estimatedMinutes ?? 10} phút
              </div>
            </div>
            <span className="badge">{INTERACTION_LABELS[l.interactionType]}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
