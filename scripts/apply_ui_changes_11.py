import os
import re

base_dir = "/Users/tranngochienlong/chuxin/apps/react/src"

# 1. Update Home.tsx
home_path = os.path.join(base_dir, "pages", "Home.tsx")
with open(home_path, "r") as f:
    home_tsx = f.read()

# Fix feedbacks
home_tsx = home_tsx.replace(
    'text: "Mình đã học ở Sơ Tâm được 6 tháng. Thầy Trung dạy rất tận tâm, giải thích ngữ pháp dễ hiểu và luôn sửa phát âm tỉ mỉ. Bây giờ mình tự tin nói chuyện cơ bản với người Trung rồi!"',
    'text: "Đã học ở Sơ Tâm được 6 tháng. Thầy Trung dạy rất tận tâm, giải thích ngữ pháp dễ hiểu và luôn sửa phát âm tỉ mỉ. Bây giờ tự tin nói chuyện cơ bản với người Trung rồi!"'
)
home_tsx = home_tsx.replace(
    'text: "Hệ thống bài tập online rất hay, nhất là phần flashcard và đố vui — học mà không thấy nhàm chán. Cô Hạ dạy phát âm chuẩn lắm, mình được khen ngữ âm tốt khi thi HSK 4."',
    'text: "Hệ thống bài tập online rất hay, nhất là phần flashcard và đố vui — học mà không thấy nhàm chán. Cô Hạ dạy phát âm chuẩn lắm, được khen ngữ âm tốt khi thi HSK 4."'
)
home_tsx = home_tsx.replace(
    'text: "Lớp online qua VOOV nhưng không khí học vẫn rất sôi nổi. Giáo viên phản hồi bài nhanh và nhiệt tình. Mình đặc biệt thích phần trò chơi Bingo từ vựng — cả lớp cùng chơi vui lắm!"',
    'text: "Lớp online qua VOOV nhưng không khí học vẫn rất sôi nổi. Giáo viên phản hồi bài nhanh và nhiệt tình. Đặc biệt thích phần trò chơi Bingo từ vựng — cả lớp cùng chơi vui lắm!"'
)
home_tsx = home_tsx.replace(
    'text: "Đội ngũ giáo viên toàn Thạc sĩ chuyên ngành, kiến thức vững và cách dạy rất thực tế. Sau 3 tháng mình đã có thể xem phim Trung không cần phụ đề và giao tiếp được trong công việc."',
    'text: "Đội ngũ giáo viên toàn Thạc sĩ chuyên ngành, kiến thức vững và cách dạy rất thực tế. Sau 3 tháng đã có thể xem phim Trung không cần phụ đề và giao tiếp được trong công việc."'
)
home_tsx = home_tsx.replace(
    'text: "Mình zero tiếng Trung khi vào học, nhưng chỉ sau 2 tháng đã biết Pinyin và nhớ được hơn 300 từ vựng. Phương pháp dạy kết hợp lý thuyết và trò chơi rất hiệu quả!"',
    'text: "Bắt đầu từ con số 0 khi vào học, nhưng chỉ sau 2 tháng đã biết Pinyin và nhớ được hơn 300 từ vựng. Phương pháp dạy kết hợp lý thuyết và trò chơi rất hiệu quả!"'
)

# Fix Sứ mệnh
home_tsx = home_tsx.replace(
    '<h2 className="section-h" style={{ marginTop: 0 }}>Sứ mệnh</h2>',
    '<h2 className="section-h" style={{ marginTop: 0, textAlign: "center", fontSize: "2rem" }}>Về chúng tôi</h2>\n        <h3 style={{ textAlign: "center", fontSize: "1.3rem", marginTop: "-10px", marginBottom: "30px", color: "var(--c-text-soft)" }}>Sứ mệnh</h3>'
)

# Fix Đội ngũ
home_tsx = home_tsx.replace(
    '<h2 className="section-h">Đội ngũ giảng viên</h2>',
    '<h2 className="section-h" style={{ textAlign: "center" }}>Đội ngũ giáo viên</h2>'
)
home_tsx = home_tsx.replace(
    '<h2 className="section-h">Đội ngũ giáo viên</h2>',
    '<h2 className="section-h" style={{ textAlign: "center" }}>Đội ngũ giáo viên</h2>'
)

with open(home_path, "w") as f:
    f.write(home_tsx)

# 2. Update App.tsx
app_path = os.path.join(base_dir, "App.tsx")
with open(app_path, "r") as f:
    app_tsx = f.read()

# Fix PUBLIC_LINKS
app_tsx = app_tsx.replace('"Đội ngũ giảng viên"', '"Giới thiệu giáo viên"')
app_tsx = app_tsx.replace('"Giới thiệu giảng viên"', '"Giới thiệu giáo viên"')
app_tsx = app_tsx.replace('label: "Đội ngũ giảng viên"', 'label: "Giới thiệu giáo viên"')

# Fix mobile hamburger behavior
# Remove sub-nav state and logic
MOBILE_NAV_NEW = """      <nav className="sotam-nav--mobile">
        <Link to="/" className="sotam-brand" onClick={() => setMobileOpen(false)}>
          <span className="brand-primary">Hán ngữ</span> Sơ Tâm
        </Link>
        <button className="mobile-menu-btn" onClick={() => setMobileOpen(true)}>
          <span className="hamburger">☰</span>
        </button>

        {mobileOpen && (
          <div className="mobile-drawer">
            <div className="mobile-drawer-header">
              <span className="brand-primary" style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Hán ngữ Sơ Tâm</span>
              <button className="mobile-drawer-close" onClick={() => setMobileOpen(false)}>✕</button>
            </div>
            
            <div className="mobile-drawer-body">
              <div className="sotam-nav--mobile-grid">
                <a href="/#gioi-thieu" className="mobile-grid-item" onClick={() => setMobileOpen(false)}>
                  <div className="grid-icon">🏫</div>
                  <div className="grid-label">Về chúng tôi</div>
                </a>
                <a href="/#courses" className="mobile-grid-item" onClick={() => setMobileOpen(false)}>
                  <div className="grid-icon">📚</div>
                  <div className="grid-label">Các khóa học</div>
                </a>
                <a href={PUBLIC_LINKS[2].to} target="_blank" rel="noreferrer" className="mobile-grid-item" onClick={() => setMobileOpen(false)}>
                  <div className="grid-icon">🎵</div>
                  <div className="grid-label">Thư viện</div>
                </a>
                <a href={CONTACT.zalo} target="_blank" rel="noreferrer" className="mobile-grid-item" style={{ background: '#0068FF', color: '#FFF' }} onClick={() => setMobileOpen(false)}>
                  <div className="grid-icon" style={{ fontSize: '1.8rem' }}>💬</div>
                  <div className="grid-label">Tư vấn Zalo</div>
                </a>
              </div>
            </div>
          </div>
        )}
      </nav>"""

app_tsx = re.sub(r'      <nav className="sotam-nav--mobile">[\s\S]*?</nav>', MOBILE_NAV_NEW, app_tsx)

with open(app_path, "w") as f:
    f.write(app_tsx)


# 3. Update styles.css
styles_path = os.path.join(base_dir, "styles.css")
with open(styles_path, "r") as f:
    styles = f.read()

# Make courses 1 column on mobile, and make 'course-view-btn' visible
NEW_CSS = """
@media (max-width: 768px) {
  .course-grid {
    grid-template-columns: 1fr;
  }
  .course-view-btn {
    opacity: 1 !important;
    position: relative !important;
    transform: none !important;
    margin-top: 16px;
    background: #f8f9fa;
    padding: 12px;
    border-radius: 8px;
    text-align: center;
    font-weight: 600;
  }
}
"""
styles += NEW_CSS

with open(styles_path, "w") as f:
    f.write(styles)

print("Done script 11")
