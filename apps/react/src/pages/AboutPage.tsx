import { useHead } from "../lib/useHead";

const TEACHERS = [
  {
    name: "Thầy Nguyễn Đức Trung",
    role: "Founder · Giảng viên trưởng",
    photo: "/founder.jpg",
    bio: "Thạc sĩ ngôn ngữ Trung, hơn 10 năm kinh nghiệm giảng dạy HSK 1 → HSK 6.",
  },
  {
    name: "Cô Lê Thiên Giao Hạ",
    role: "Co-founder · Phụ trách chuyên môn",
    photo: "/co-founder.jpg",
    bio: "Cử nhân Hán ngữ Đại học Bắc Kinh, chuyên luyện thi HSKK và phiên dịch.",
  },
];

export function AboutPage() {
  useHead({
    title: "Về chúng tôi · Hán ngữ Sơ Tâm",
    description: "Tìm hiểu về Hán ngữ Sơ Tâm — sứ mệnh, tinh thần Chuxin, và đội ngũ giảng viên giàu kinh nghiệm. Trung tâm tiếng Trung uy tín tại Việt Nam.",
    canonical: "https://hanngusotam.com/ve-chung-toi",
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

      {/* Team */}
      <h2 className="section-h">Đội ngũ giảng viên</h2>
      <div className="teacher-grid">
        {TEACHERS.map((t) => (
          <article key={t.name} className="teacher-card">
            <img src={t.photo} alt={t.name} className="teacher-photo" />
            <div className="teacher-body">
              <h3>{t.name}</h3>
              <div className="teacher-role">{t.role}</div>
              <p className="muted">{t.bio}</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
