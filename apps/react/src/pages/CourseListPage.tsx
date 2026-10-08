import { Link } from "react-router-dom";
import { COURSES } from "@sotam/shared";
import { useHead } from "../lib/useHead";

export function CourseListPage() {
  useHead({
    title: "Tất cả khóa học · Hán ngữ Sơ Tâm",
    description: "Khóa học phù hợp cho mọi lứa tuổi, mọi nhu cầu của người học.",
  });

  return (
    <div className="container" style={{ padding: "28px 20px 80px" }}>
      <h1 style={{ color: "var(--c-red-dark)", marginTop: 0, textAlign: "center" }}>Tất cả khóa học</h1>
      <p style={{ color: "var(--c-text-soft)", textAlign: "center", marginBottom: 40 }}>
        Khóa học phù hợp cho mọi lứa tuổi, mọi nhu cầu của người học.
      </p>

      <div className="course-cards-grid">
        {COURSES.map((c) => (
          <Link key={c.id} className="course-card" to={`/khoa-hoc/${c.id === 'han1' ? 'hsk1' : c.id === 'han2' ? 'hsk2' : c.id === 'han3' ? 'hsk3' : c.id === 'han4' ? 'hsk4' : c.id === 'han5' ? 'hsk5' : c.id === 'han6' ? 'hsk6' : c.id === 'tre-em' ? 'tieng-trung-tre-em' : c.id === 'thuong-mai' ? 'tieng-trung-thuong-mai' : c.id}`}>
            <div className="course-card-img-wrap">
              {c.image && <img src={c.image} alt={c.title} className="course-card-img" />}
            </div>
            <div className="course-card-body">
              <h3 className="course-card-title">{c.title}</h3>
              <p className="course-card-desc">{c.subtitle}</p>
              <div style={{ fontSize: '0.85rem', color: 'var(--c-text-soft)', marginTop: -6, marginBottom: 12, display: 'flex', gap: 16 }}>
                <span style={{ fontWeight: 500 }}>Số buổi: 25</span>
                <span style={{ fontWeight: 500 }}>Hình thức: Online</span>
              </div>
              <div className="course-card-btn" style={{ borderColor: c.color, color: c.color }}>Xem chi tiết</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
