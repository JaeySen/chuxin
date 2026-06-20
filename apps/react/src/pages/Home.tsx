import { Link } from "react-router-dom";
import { COURSES, type CourseStatus } from "@hanai/shared";
import { useAuth } from "../lib/auth-context";
import { useHead } from "../lib/useHead";
import { JsonLd } from "../components/JsonLd";

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

  if (role === "student") return <StudentHome />;
  if (role === "teacher" || role === "admin") return <TeacherHome />;
  return <GuestHome />;
}

// ── Guest ─────────────────────────────────────────────────────────────────────

function GuestHome() {
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
            <Link to="/courses" className="btn btn-primary">Xem các khoá học</Link>
            <Link to="/ve-chung-toi" className="btn btn-secondary">Về chúng tôi</Link>
          </div>
        </div>
        <div className="hero-art">
          <img src="/chuxin-logo.jpg" alt="Hán ngữ Sơ Tâm" />
        </div>
      </section>

      {/* Courses — static, no auth gate */}
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
    </div>
  );
}

// ── Student ───────────────────────────────────────────────────────────────────

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

      {/* New exercises — from teacher uploads */}
      <h2 className="section-h" style={{ marginTop: 28 }}>Bài tập</h2>
      {classes.length === 0 ? (
        <div className="feedback feedback-info">
          Bạn chưa được xếp lớp. Liên hệ giáo viên để được thêm vào lớp học.
        </div>
      ) : (
        <div className="sh-exercise-empty muted">
          Giáo viên chưa thêm bài tập mới. Hãy kiểm tra lại sau.
        </div>
      )}

      {/* Old exercises — disabled */}
      <h2 className="section-h" style={{ marginTop: 36 }}>Hoạt động học tập</h2>
      <p className="muted" style={{ marginBottom: 16, fontSize: 14 }}>
        Các hoạt động sau đang tạm thời không khả dụng. Giáo viên sẽ mở khi cần thiết.
      </p>
      <div className="sh-old-grid">
        {OLD_EXERCISES.map((ex) => (
          <div key={ex.to} className="sh-old-card sh-old-card--disabled">
            <span className="sh-old-icon">{ex.icon}</span>
            <span className="sh-old-title">{ex.title}</span>
            <span className="sh-old-badge">Tạm khóa</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Teacher / Admin ───────────────────────────────────────────────────────────

function TeacherHome() {
  const { role } = useAuth();

  return (
    <div className="container" style={{ padding: "24px 16px 80px" }}>
      <h2 className="section-h">Quản lý khoá học</h2>
      <p className="muted" style={{ marginBottom: 20, fontSize: 14 }}>
        Chọn khoá học để xem bài tập, tải lên đề thi và quản lý nội dung.
      </p>
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

      {role === "admin" && (
        <div style={{ marginTop: 32 }}>
          <Link to="/admin" className="btn btn-ghost btn-sm">⚙ Bảng quản trị</Link>
        </div>
      )}
    </div>
  );
}
