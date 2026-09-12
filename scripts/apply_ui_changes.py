import os

base_dir = "/Users/tranngochienlong/chuxin/apps/react/src"

# 1. Update App.tsx
app_tsx_path = os.path.join(base_dir, "App.tsx")
with open(app_tsx_path, "r") as f:
    app_tsx = f.read()

app_tsx = app_tsx.replace("""const PUBLIC_LINKS = [
  {
    to: "/ve-chung-toi",
    label: "Về chúng tôi",
    icon: "🏫",
    sub: [
      { to: "/ve-chung-toi#gioi-thieu", label: "Giới thiệu trung tâm" },
      { to: "/ve-chung-toi#giao-vien",  label: "Giới thiệu giáo viên" },
      { to: "/ve-chung-toi#feedback",   label: "Feedback của học viên" },
    ],
  },
  {
    to: "/courses",
    label: "Các khóa học",
    icon: "📚",
    sub: [
      { to: "/course/han1-2", label: "Hán ngữ 1 & 2 (HSK 1-2)" },
      { to: "/course/han3", label: "Hán ngữ 3 (HSK 3)" },
      { to: "/course/han4", label: "Hán ngữ 4 (HSK 4)" },
      { to: "/course/han5", label: "Hán ngữ 5 (HSK 5)" },
      { to: "/course/han6", label: "Hán ngữ 6 (HSK 6)" },
      { to: "/course/thuong-mai", label: "Tiếng Trung Thương mại" },
      { to: "/course/tre-em", label: "Tiếng Trung Trẻ em" },
    ],
  },
  {
    to: "/thu-vien",
    label: "Thư viện",
    icon: "📄",
    sub: [
      { to: "/thu-vien?cap=so",    label: "Sơ cấp" },
      { to: "/thu-vien?cap=trung", label: "Trung cấp" },
      { to: "/thu-vien?cap=cao",   label: "Cao cấp" },
    ],
  },
];""", """const PUBLIC_LINKS = [
  {
    to: "/#gioi-thieu",
    label: "Về chúng tôi",
    icon: "🏫",
    sub: [
      { to: "/#gioi-thieu", label: "Giới thiệu trung tâm" },
      { to: "/#giao-vien",  label: "Giới thiệu giáo viên" },
      { to: "/#feedback",   label: "Feedback của học viên" },
    ],
  },
  {
    to: "/#courses",
    label: "Các khóa học",
    icon: "📚",
    sub: [
      { to: "/course/han1-2", label: "Hán ngữ 1 & 2 (HSK 1-2)" },
      { to: "/course/han3", label: "Hán ngữ 3 (HSK 3)" },
      { to: "/course/han4", label: "Hán ngữ 4 (HSK 4)" },
      { to: "/course/han5", label: "Hán ngữ 5 (HSK 5)" },
      { to: "/course/han6", label: "Hán ngữ 6 (HSK 6)" },
      { to: "/course/thuong-mai", label: "Tiếng Trung Thương mại" },
      { to: "/course/tre-em", label: "Tiếng Trung Trẻ em" },
    ],
  },
  {
    to: "/thu-vien",
    label: "Thư viện",
    icon: "📄",
    sub: [
      { to: "/thu-vien?cap=so",    label: "Sơ cấp" },
      { to: "/thu-vien?cap=trung", label: "Trung cấp" },
      { to: "/thu-vien?cap=cao",   label: "Cao cấp" },
    ],
  },
];

const ALL_SUB_LINKS = PUBLIC_LINKS.flatMap(l => l.sub);""")

app_tsx = app_tsx.replace("""{PUBLIC_LINKS.map((l) => <NavDropdown key={l.to} link={l} />)}""", """{PUBLIC_LINKS.map((l) => (
                <Link key={l.to} to={l.to} className="nav-class-tab">
                  {l.icon} {l.label}
                </Link>
              ))}""")

app_tsx = app_tsx.replace("""{consultOpen && <ConsultModal close={() => setConsultOpen(false)} />}
    </header>""", """{consultOpen && <ConsultModal close={() => setConsultOpen(false)} />}
      
      {/* Marquee sub-navbar */}
      <div className="sotam-subnav-marquee">
        <div className="marquee-content">
          {ALL_SUB_LINKS.map((s, i) => (
            <Link key={i} to={s.to} className="marquee-item">{s.label}</Link>
          ))}
          {/* Duplicate for seamless infinite scroll */}
          {ALL_SUB_LINKS.map((s, i) => (
            <Link key={i + 100} to={s.to} className="marquee-item">{s.label}</Link>
          ))}
          {ALL_SUB_LINKS.map((s, i) => (
            <Link key={i + 200} to={s.to} className="marquee-item">{s.label}</Link>
          ))}
        </div>
      </div>
    </header>""")

with open(app_tsx_path, "w") as f:
    f.write(app_tsx)


# 2. Update Home.tsx
home_tsx_path = os.path.join(base_dir, "pages/Home.tsx")
with open(home_tsx_path, "r") as f:
    home_tsx = f.read()

ABOUT_DATA = """
const TEACHER_BRIEFS = [
  { file: "/chuxin-teacher-1-trungnd.jpg", name: "Nguyễn Đức Trung" },
  { file: "/chuxin-teacher-2-haltg.jpg",  name: "Lê Thiên Giao Hạ" },
  { file: "/chuxin-teacher-3-huetv.jpg",  name: "Triệu Văn Huệ" },
  { file: "/chuxin-teacher-4-hantg.jpg",  name: "Trần Gia Hân" },
  { file: "/chuxin-teacher-5-dongmv.jpg", name: "Mã Vũ Đồng" },
];

const FEEDBACKS = [
  { name: "Nguyễn Thị Lan Anh", course: "HSK 1-2", avatar: "🎓", text: "Mình đã học ở Sơ Tâm được 6 tháng. Thầy Trung dạy rất tận tâm, giải thích ngữ pháp dễ hiểu và luôn sửa phát âm tỉ mỉ. Bây giờ mình tự tin nói chuyện cơ bản với người Trung rồi!", rating: 5 },
  { name: "Trần Minh Khôi", course: "HSK 3-4", avatar: "📚", text: "Hệ thống bài tập online rất hay, nhất là phần flashcard và đố vui — học mà không thấy nhàm chán. Cô Hạ dạy phát âm chuẩn lắm, mình được khen ngữ âm tốt khi thi HSK 4.", rating: 5 },
  { name: "Phạm Thu Hương", course: "HSK 2-3", avatar: "✨", text: "Lớp online qua VOOV nhưng không khí học vẫn rất sôi nổi. Giáo viên phản hồi bài nhanh và nhiệt tình. Mình đặc biệt thích phần trò chơi Bingo từ vựng — cả lớp cùng chơi vui lắm!", rating: 5 },
  { name: "Lê Quốc Huy", course: "HSK 4-5", avatar: "🌟", text: "Đội ngũ giáo viên toàn Thạc sĩ chuyên ngành, kiến thức vững và cách dạy rất thực tế. Sau 3 tháng mình đã có thể xem phim Trung không cần phụ đề và giao tiếp được trong công việc.", rating: 5 },
  { name: "Nguyễn Bảo Châu", course: "HSK 1-2", avatar: "💫", text: "Mình zero tiếng Trung khi vào học, nhưng chỉ sau 2 tháng đã biết Pinyin và nhớ được hơn 300 từ vựng. Phương pháp dạy kết hợp lý thuyết và trò chơi rất hiệu quả!", rating: 5 },
  { name: "Võ Thanh Tùng", course: "HSK 3", avatar: "🏆", text: "Lộ trình học được thiết kế rất khoa học, từng bước từng bước. Giáo viên bản xứ của trung tâm phát âm chuẩn và thân thiện — được thực hành hội thoại với người bản ngữ là một lợi thế lớn.", rating: 5 },
];
"""

if "const TEACHER_BRIEFS" not in home_tsx:
    home_tsx = home_tsx.replace("const GAMES_INFO = [", ABOUT_DATA + "\nconst GAMES_INFO = [")

home_tsx = home_tsx.replace("""const GAMES_INFO = [
  {
    icon: "🎯",
    title: "Bingo từ vựng",
    desc: "Giáo viên đọc từ, học viên đánh dấu ô tương ứng trên bảng Bingo cá nhân. Trò chơi rèn kỹ năng nghe — nhận diện từ nhanh trong môi trường áp lực vui vẻ, buộc học viên phải tập trung liên tục suốt tiết học.",
  },
  {
    icon: "🔍",
    title: "Tìm từ (Word Search)",
    desc: "Học viên tìm và khoanh từ tiếng Trung ẩn trong ô chữ. Hoạt động củng cố nhận diện mặt chữ Hán, phân biệt nét tương đồng và ghi nhớ hình dạng ký tự — đặc biệt hiệu quả cho người mới bắt đầu.",
  },
  {
    icon: "🔊",
    title: "Luyện Pinyin",
    desc: "Bài tập tương tác chọn thanh điệu và âm vần cho từng từ. Phản hồi tức thì giúp học viên sửa lỗi phát âm ngay lập tức, xây dựng nền tảng ngữ âm vững chắc trước khi chuyển sang hội thoại.",
  },
];""", """const GAMES_INFO = [
  {
    icon: "🎯",
    image: "https://placehold.co/400x250/a71e22/FFF?text=Bingo",
    title: "Bingo từ vựng",
    desc: "Giáo viên đọc từ, học viên đánh dấu ô tương ứng trên bảng Bingo cá nhân. Trò chơi rèn kỹ năng nghe — nhận diện từ nhanh trong môi trường áp lực vui vẻ, buộc học viên phải tập trung liên tục suốt tiết học.",
  },
  {
    icon: "🔍",
    image: "https://placehold.co/400x250/ffc60b/FFF?text=Word+Search",
    title: "Tìm từ (Word Search)",
    desc: "Học viên tìm và khoanh từ tiếng Trung ẩn trong ô chữ. Hoạt động củng cố nhận diện mặt chữ Hán, phân biệt nét tương đồng và ghi nhớ hình dạng ký tự — đặc biệt hiệu quả cho người mới bắt đầu.",
  },
  {
    icon: "🔊",
    image: "https://placehold.co/400x250/2563eb/FFF?text=Pinyin",
    title: "Luyện Pinyin",
    desc: "Bài tập tương tác chọn thanh điệu và âm vần cho từng từ. Phản hồi tức thì giúp học viên sửa lỗi phát âm ngay lập tức, xây dựng nền tảng ngữ âm vững chắc trước khi chuyển sang hội thoại.",
  },
];""")

home_tsx = home_tsx.replace("""<div className="game-card-icon">{g.icon}</div>""", """<div className="game-card-icon">{g.icon}</div>
              {g.image && <img src={g.image} alt={g.title} className="game-card-img" />}""")


home_tsx = home_tsx.replace("""Học viên đăng nhập để truy cập bài tập, theo dõi tiến trình học tập
              và tham gia các hoạt động tương tác trong lớp.""", """Học viên đăng nhập để truy cập bài tập, theo dõi tiến trình học tập
              và tham gia các hoạt động tương tác trong lớp. Tại đây bạn có thể xem lại kết quả học tập, ôn luyện từ vựng qua flashcard, làm bài tập về nhà và nhận feedback trực tiếp từ giáo viên nhanh chóng.""")

home_tsx = home_tsx.replace("""Giáo viên đăng nhập để quản lý lớp học, tạo bài tập và theo dõi
              kết quả học viên qua bảng điều khiển giáo vụ.""", """Giáo viên đăng nhập để quản lý lớp học, tạo bài tập và theo dõi
              kết quả học viên qua bảng điều khiển giáo vụ. Hệ thống cung cấp công cụ chấm điểm tự động, quản lý học viên tiện lợi và hỗ trợ tổ chức các hoạt động lớp học trực tuyến chuyên nghiệp.""")

ABOUT_SECTION = """
      <div id="gioi-thieu" style={{ paddingTop: 60 }}>
        <h2 className="section-h" style={{ marginTop: 0 }}>Sứ mệnh</h2>
        <div className="about-mission-body">
          <div className="about-spirit">
            <div className="about-spirit-label">初心 · Chuxin</div>
            <h3 className="about-spirit-title">Tinh thần Chuxin</h3>
            <p>
              <strong>Chuxin – Hán ngữ Sơ Tâm</strong> được thành lập với niềm tin rằng mỗi người
              học tiếng Trung đều khởi đầu bằng một "sơ tâm" riêng biệt — đó có thể là một ước mơ,
              một mục tiêu nghề nghiệp, hay niềm yêu thích thuần túy dành cho ngôn ngữ và văn hóa
              Trung Hoa.
            </p>
            <p>
              Chúng tôi hy vọng có thể tạo ra một môi trường học tập truyền cảm hứng, nơi mỗi học
              viên đều được đồng hành, định hướng và phát triển theo lộ trình cá nhân hóa, tối ưu
              hóa cho từng mục tiêu cụ thể. Tại Chuxin, chúng tôi không chỉ giảng dạy ngôn ngữ, mà
              còn giúp học viên xây dựng sự tự tin, làm chủ kỹ năng giao tiếp thực tế và duy trì
              nguồn cảm hứng học tập bền bỉ.
            </p>

            <p className="about-commit-heading"><strong>Cam kết của chúng tôi:</strong></p>
            <ul className="about-commit-list">
              <li>
                <span className="about-commit-icon">🤝</span>
                <div>
                  <strong>Đồng hành</strong> — Sát cánh cùng học viên trên hành trình chinh phục tiếng Trung.
                </div>
              </li>
              <li>
                <span className="about-commit-icon">🏅</span>
                <div>
                  <strong>Chất lượng</strong> — Đảm bảo kiến thức vững chắc theo chuẩn đầu ra của từng khóa học.
                </div>
              </li>
              <li>
                <span className="about-commit-icon">🚀</span>
                <div>
                  <strong>Ứng dụng</strong> — Trang bị nền tảng để học viên tự tin sử dụng tiếng Trung hiệu quả trong học tập, công việc và cuộc sống.
                </div>
              </li>
            </ul>
          </div>

          <div className="about-values">
            <div className="about-value-card">
              <span className="about-value-icon">🎯</span>
              <div>
                <strong>Đúng trọng tâm</strong>
                <p>Nội dung bám sát đề thi HSK 3.0 — không lan man, không lãng phí thời gian.</p>
              </div>
            </div>
            <div className="about-value-card">
              <span className="about-value-icon">💬</span>
              <div>
                <strong>Tương tác thật sự</strong>
                <p>Lớp học trực tuyến qua VOOV, giáo viên sửa bài và phản hồi trong thời gian thực.</p>
              </div>
            </div>
            <div className="about-value-card">
              <span className="about-value-icon">📈</span>
              <div>
                <strong>Theo dõi tiến độ</strong>
                <p>Hệ thống ghi nhận từng bài học, điểm số, và hỗ trợ video xem lại sau mỗi buổi.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div id="giao-vien" style={{ paddingTop: 60 }}>
        <h2 className="section-h">Đội ngũ giảng viên</h2>
        <p style={{ color: "var(--c-text-soft)", marginTop: 0, marginBottom: 20 }}>
          Toàn bộ giáo viên của Sơ Tâm là các Thạc sĩ chuyên ngành Hán ngữ Quốc tế,
          được đào tạo tại các trường đại học hàng đầu tại Trung Quốc.
        </p>
        <div className="teacher-slider-container">
          <div className="teacher-slider">
            {TEACHER_BRIEFS.map((t) => (
              <div key={t.name} className="teacher-slider-card">
                <img
                  src={t.file}
                  alt={`Giới thiệu giáo viên ${t.name}`}
                  className="teacher-brief-img"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div id="feedback" style={{ paddingTop: 60, paddingBottom: 60 }}>
        <h2 className="section-h">Học viên nói gì về Sơ Tâm?</h2>
        <p style={{ color: "var(--c-text-soft)", marginTop: 0, marginBottom: 20 }}>
          Hàng trăm học viên đã tin tưởng và gắn bó cùng Sơ Tâm trên hành trình chinh phục tiếng Trung.
        </p>
        <div className="feedback-grid">
          {FEEDBACKS.map((f) => (
            <div key={f.name} className="feedback-card">
              <div className="feedback-header">
                <span className="feedback-avatar">{f.avatar}</span>
                <div className="feedback-meta">
                  <div className="feedback-name">{f.name}</div>
                  <div className="feedback-course">Khoá {f.course}</div>
                </div>
                <div className="feedback-stars">{"⭐".repeat(f.rating)}</div>
              </div>
              <p className="feedback-text">"{f.text}"</p>
            </div>
          ))}
        </div>
      </div>
"""

home_tsx = home_tsx.replace("""<div className="course-grid">
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
    </div>""", """<div className="course-grid">
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

""" + ABOUT_SECTION + """
    </div>""")

with open(home_tsx_path, "w") as f:
    f.write(home_tsx)


# 3. Update CoursePage.tsx
course_path = os.path.join(base_dir, "pages/CoursePage.tsx")
with open(course_path, "r") as f:
    course_tsx = f.read()

course_tsx = course_tsx.replace("""import { Link, useParams } from "react-router-dom";
import { useState, useEffect } from "react";""", """import { Link, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";""")

BROCHURE_MODAL = """
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
"""

if "function BrochureModal" not in course_tsx:
    course_tsx = course_tsx.replace("""// ── Shared header""", BROCHURE_MODAL + "\n// ── Shared header")


course_tsx = course_tsx.replace("""function CourseHeader({ course, courseId }: { course: typeof COURSES[number] | undefined; courseId?: string }) {
  return (
    <>
      <Link to="/" className="muted" style={{ textDecoration: "none" }}>← Tất cả khoá</Link>
      <h1 style={{ color: "var(--c-red-dark)", marginTop: 8 }}>
        {course?.title ?? courseId?.toUpperCase()}
      </h1>
      {course?.subtitle && <p className="muted" style={{ fontSize: 16 }}>{course.subtitle}</p>}
      {course?.brochureUrl && (
        <a href={course.brochureUrl} target="_blank" rel="noreferrer" className="btn btn-primary" style={{ marginTop: 12, textDecoration: "none" }}>
          📄 Xem Brochure Khóa học
        </a>
      )}
    </>
  );
}""", """function CourseHeader({ course, courseId }: { course: typeof COURSES[number] | undefined; courseId?: string }) {
  const [openBrochure, setOpenBrochure] = useState(false);
  return (
    <>
      <Link to="/" className="muted" style={{ textDecoration: "none" }}>← Tất cả khoá</Link>
      <h1 style={{ color: "var(--c-red-dark)", marginTop: 8 }}>
        {course?.title ?? courseId?.toUpperCase()}
      </h1>
      {course?.subtitle && <p className="muted" style={{ fontSize: 16 }}>{course.subtitle}</p>}
      {course?.brochureUrl && (
        <>
          <div className="brochure-thumbnail" onClick={() => setOpenBrochure(true)} title="Xem Brochure">
            <div className="brochure-thumb-overlay">🔍 Xem chi tiết</div>
            <img src="https://placehold.co/300x400/a71e22/FFF?text=Brochure" alt="Brochure Thumbnail" />
          </div>
          {openBrochure && <BrochureModal url={course.brochureUrl} close={() => setOpenBrochure(false)} />}
        </>
      )}
    </>
  );
}""")

course_tsx = course_tsx.replace("""      {/* Chapter list — visible to everyone, content is static */}
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
      )}""", """      {/* Chương trình tĩnh bị ẩn đi theo yêu cầu */}
      <div className="feedback feedback-info" style={{ marginTop: 16 }}>
        Đăng nhập tài khoản học viên để xem bài tập và nội dung chi tiết.
      </div>""")

with open(course_path, "w") as f:
    f.write(course_tsx)


# 4. Update styles.css
styles_path = os.path.join(base_dir, "styles.css")
with open(styles_path, "r") as f:
    styles = f.read()

CSS_ADDITIONS = """
/* Marquee Sub-navbar */
.sotam-subnav-marquee {
  overflow: hidden;
  white-space: nowrap;
  background: var(--c-red-dark);
  color: white;
  padding: 8px 0;
  border-top: 1px solid rgba(255,255,255,0.1);
  display: flex;
}
.marquee-content {
  display: flex;
  animation: scrollMarquee 25s linear infinite;
}
.marquee-item {
  display: inline-block;
  padding: 0 30px;
  color: white;
  text-decoration: none;
  font-weight: 600;
  font-size: 14px;
}
.marquee-item:hover {
  text-decoration: underline;
}
@keyframes scrollMarquee {
  0% { transform: translateX(0); }
  100% { transform: translateX(-33.333%); }
}

/* Teacher Slider */
.teacher-slider-container {
  overflow: hidden;
  width: 100%;
  padding: 20px 0;
}
.teacher-slider {
  display: flex;
  gap: 20px;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  padding-bottom: 20px;
  padding-left: 20px;
  padding-right: 20px;
}
.teacher-slider::-webkit-scrollbar {
  height: 8px;
}
.teacher-slider::-webkit-scrollbar-thumb {
  background: var(--c-divider);
  border-radius: 4px;
}
.teacher-slider-card {
  scroll-snap-align: center;
  flex: 0 0 280px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 30px var(--c-shadow);
  transition: transform 0.3s;
  overflow: hidden;
  position: relative;
}
.teacher-slider-card:hover {
  transform: translateY(-5px) scale(1.02);
}
.teacher-slider-card img {
  width: 100%;
  height: 400px;
  object-fit: cover;
  display: block;
}

/* Game Card Image */
.game-card-img {
  width: 100%;
  height: 160px;
  object-fit: cover;
  border-radius: 12px;
  margin-top: 12px;
  border: 1px solid var(--c-divider);
}

/* Brochure Theatre */
.brochure-thumbnail {
  width: 150px;
  margin-top: 16px;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  position: relative;
  box-shadow: 0 4px 12px var(--c-shadow);
  transition: transform 0.2s;
}
.brochure-thumbnail:hover {
  transform: scale(1.05);
}
.brochure-thumbnail img {
  width: 100%;
  display: block;
}
.brochure-thumb-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.5);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  opacity: 0;
  transition: opacity 0.2s;
}
.brochure-thumbnail:hover .brochure-thumb-overlay {
  opacity: 1;
}
.brochure-theatre {
  width: 90vw;
  height: 90vh;
  max-width: 1200px;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  margin: 0 auto;
}
.brochure-iframe {
  width: 100%;
  height: 100%;
  border: none;
}
"""

if "/* Marquee Sub-navbar */" not in styles:
    styles += "\n" + CSS_ADDITIONS

with open(styles_path, "w") as f:
    f.write(styles)

print("Done")
