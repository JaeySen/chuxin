import { useHead } from "../lib/useHead";

const TEACHER_BRIEFS = [
  { file: "/chuxin-teacher-1-trungnd.jpg", name: "Nguyễn Đức Trung" },
  { file: "/chuxin-teacher-2-haltg.jpg",  name: "Lê Thiên Giao Hạ" },
  { file: "/chuxin-teacher-3-huetv.jpg",  name: "Triệu Văn Huệ" },
  { file: "/chuxin-teacher-4-hantg.jpg",  name: "Trần Gia Hân" },
  { file: "/chuxin-teacher-5-dongmv.jpg", name: "Mã Vũ Đồng" },
];

const FEEDBACKS = [
  {
    name: "Nguyễn Thị Lan Anh",
    course: "HSK 1-2",
    avatar: "🎓",
    text: "Mình đã học ở Sơ Tâm được 6 tháng. Thầy Trung dạy rất tận tâm, giải thích ngữ pháp dễ hiểu và luôn sửa phát âm tỉ mỉ. Bây giờ mình tự tin nói chuyện cơ bản với người Trung rồi!",
    rating: 5,
  },
  {
    name: "Trần Minh Khôi",
    course: "HSK 3-4",
    avatar: "📚",
    text: "Hệ thống bài tập online rất hay, nhất là phần flashcard và đố vui — học mà không thấy nhàm chán. Cô Hạ dạy phát âm chuẩn lắm, mình được khen ngữ âm tốt khi thi HSK 4.",
    rating: 5,
  },
  {
    name: "Phạm Thu Hương",
    course: "HSK 2-3",
    avatar: "✨",
    text: "Lớp online qua VOOV nhưng không khí học vẫn rất sôi nổi. Giáo viên phản hồi bài nhanh và nhiệt tình. Mình đặc biệt thích phần trò chơi Bingo từ vựng — cả lớp cùng chơi vui lắm!",
    rating: 5,
  },
  {
    name: "Lê Quốc Huy",
    course: "HSK 4-5",
    avatar: "🌟",
    text: "Đội ngũ giáo viên toàn Thạc sĩ chuyên ngành, kiến thức vững và cách dạy rất thực tế. Sau 3 tháng mình đã có thể xem phim Trung không cần phụ đề và giao tiếp được trong công việc.",
    rating: 5,
  },
  {
    name: "Nguyễn Bảo Châu",
    course: "HSK 1-2",
    avatar: "💫",
    text: "Mình zero tiếng Trung khi vào học, nhưng chỉ sau 2 tháng đã biết Pinyin và nhớ được hơn 300 từ vựng. Phương pháp dạy kết hợp lý thuyết và trò chơi rất hiệu quả!",
    rating: 5,
  },
  {
    name: "Võ Thanh Tùng",
    course: "HSK 3",
    avatar: "🏆",
    text: "Lộ trình học được thiết kế rất khoa học, từng bước từng bước. Giáo viên bản xứ của trung tâm phát âm chuẩn và thân thiện — được thực hành hội thoại với người bản ngữ là một lợi thế lớn.",
    rating: 5,
  },
];

export function AboutPage() {
  useHead({
    title: "Về chúng tôi · Hán ngữ Sơ Tâm",
    description: "Tìm hiểu về Hán ngữ Sơ Tâm — sứ mệnh, tinh thần Chuxin, và đội ngũ giảng viên giàu kinh nghiệm. Trung tâm tiếng Trung uy tín tại Việt Nam.",
    canonical: "https://www.hanngusotam.com/ve-chung-toi",
  });
  return (
    <div className="container" style={{ padding: "28px 20px 80px" }}>
      <h1 style={{ color: "var(--c-red-dark)", marginTop: 0 }}>Về chúng tôi</h1>

      {/* Mission */}
      <section className="about-mission">
        <h2 className="section-h" style={{ marginTop: 0 }}>Sứ mệnh</h2>
        <div className="about-mission-body">

          {/* Tinh thần Chuxin */}
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
      </section>

      {/* Team — show brief info-card images directly */}
      <h2 className="section-h">Đội ngũ giảng viên</h2>
      <p style={{ color: "var(--c-text-soft)", marginTop: 0, marginBottom: 20 }}>
        Toàn bộ giáo viên của Sơ Tâm là các Thạc sĩ chuyên ngành Hán ngữ Quốc tế,
        được đào tạo tại các trường đại học hàng đầu tại Trung Quốc.
      </p>
      <div className="teacher-brief-grid">
        {TEACHER_BRIEFS.map((t) => (
          <div key={t.name} className="teacher-brief-card">
            <img
              src={t.file}
              alt={`Giới thiệu giáo viên ${t.name}`}
              className="teacher-brief-img"
            />
          </div>
        ))}
      </div>

      {/* Student Feedback */}
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
  );
}
