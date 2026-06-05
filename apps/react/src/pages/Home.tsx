import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { fetchAllLessons } from "../lib/lessons";
import type { Lesson } from "@hanai/shared";
import { INTERACTION_LABELS, COURSES, type CourseStatus } from "@hanai/shared";
import { useAuth } from "../lib/auth-context";
import { ScheduleTable } from "../components/ScheduleTable";

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

export function Home() {
  const { user } = useAuth();
  const [lessons, setLessons] = useState<Lesson[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    if (!user) { setLessons(null); return; }
    fetchAllLessons().then(setLessons).catch((e) => setErr(e.message));
  }, [user]);

  return (
    <div className="container" style={{ padding: "12px 16px 80px" }}>
      {/* Hero */}
      <section className="hero">
        <div className="hero-copy">
          <h1>
            Học tiếng Trung cùng <span className="hero-accent">Sơ Tâm</span>
          </h1>
          <p>
            Lộ trình HSK 1 → HSK 6, học qua tương tác — flashcard, đố vui, ghép cặp,
            nghe nói và trò chơi đồng đội. Tiến độ và điểm số được lưu khi bạn đăng nhập.
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

      {/* Courses */}
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

      {/* Schedule */}
      <h2 className="section-h">Lịch khai giảng</h2>
      <ScheduleTable />

      {/* All lessons — only for authenticated users */}
      {user ? (
        <>
          <h2 className="section-h">Tất cả bài học</h2>
          {err && <div className="feedback feedback-bad">{err}</div>}
          {!lessons && !err && <div className="muted">Đang tải…</div>}
          {lessons?.length === 0 && (
            <div className="feedback feedback-info">
              Chưa có bài học nào. Hãy chạy <code>pnpm sync</code> để nạp dữ liệu.
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
        </>
      ) : (
        <div className="feedback feedback-info" style={{ marginTop: 32 }}>
          <strong>Đăng nhập để xem nội dung bài học.</strong>{" "}
          Tất cả khoá học, danh sách bài, và phòng game đều mở sau khi đăng nhập.
        </div>
      )}
    </div>
  );
}
