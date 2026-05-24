import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { fetchAllLessons } from "../lib/lessons";
import type { Lesson } from "@hanai/shared";
import { INTERACTION_LABELS, COURSES } from "@hanai/shared";

export function Home() {
  const [lessons, setLessons] = useState<Lesson[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    fetchAllLessons().then(setLessons).catch((e) => setErr(e.message));
  }, []);

  return (
    <div className="container" style={{ padding: "12px 20px 80px" }}>
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
            <Link to="/course/han1" className="btn btn-primary">Bắt đầu HSK 1</Link>
            <Link to="/me" className="btn btn-secondary">Tiến độ của tôi</Link>
          </div>
        </div>
        <div className="hero-art">
          <img src="/chuxin-logo.jpg" alt="Sơ Tâm — Han ngữ" />
        </div>
      </section>

      {/* Courses */}
      <h2 style={{ marginTop: 48, color: "var(--c-red-dark)" }}>Các khoá học</h2>
      <div className="course-grid">
        {COURSES.map((c) => (
          <Link key={c.id} className="course-tile" to={`/course/${c.id}`}>
            <h3>{c.title}</h3>
            <div className="muted">{c.subtitle}</div>
            <div className="tile-bar" style={{ background: c.color }} />
          </Link>
        ))}
      </div>

      {/* Showcase: curriculum + schedule */}
      <h2 style={{ marginTop: 48, color: "var(--c-red-dark)" }}>Chương trình &amp; Lịch học</h2>
      <div className="showcase-grid">
        <div className="showcase-card">
          <img src="/chuxin-curriculum.jpg" alt="Chương trình giảng dạy Sơ Tâm" />
          <div className="showcase-card-body">
            <h3>Chương trình giảng dạy</h3>
            <p className="muted">Tổng quan giáo trình HSK 1 → HSK 6, theo từng bài và chủ đề.</p>
          </div>
        </div>
        <div className="showcase-card">
          <img src="/chuxin-first_class_schedule.jpg" alt="Lịch lớp khai giảng" />
          <div className="showcase-card-body">
            <h3>Lịch khai giảng</h3>
            <p className="muted">Thời khóa biểu lớp đầu tiên — đăng ký để giữ chỗ.</p>
          </div>
        </div>
      </div>

      {/* All lessons */}
      <h2 style={{ marginTop: 48, color: "var(--c-red-dark)" }}>Tất cả bài học</h2>
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
    </div>
  );
}
