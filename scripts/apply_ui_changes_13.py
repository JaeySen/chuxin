import re

base_dir = "/Users/tranngochienlong/chuxin/apps/react/src"

# ═══════════════════════════════════════════════════════════════════════
# 1. Home.tsx changes
# ═══════════════════════════════════════════════════════════════════════
home_path = base_dir + "/pages/Home.tsx"
with open(home_path, "r") as f:
    home = f.read()

# --- 1a. Update games intro text ---
home = home.replace(
    """        <p className="games-intro">
          Nghiên cứu giáo dục cho thấy học qua trò chơi giúp ghi nhớ từ vựng lâu hơn 40% so với
          phương pháp truyền thống. Tại Sơ Tâm, trò chơi không phải phần thưởng — chúng
          <em> là</em> bài học.
        </p>""",
    """        <p className="games-intro">
          Nhiều nghiên cứu giáo dục cho thấy hoạt động học tập qua trò chơi có thể tăng cường sự hứng thú và khả năng ghi nhớ của người học.
          <br /><br />
          Tại Sơ Tâm, trò chơi không phải là phần thưởng sau giờ học — mà chính là một phần của bài học.
        </p>"""
)

# --- 1b. Replace GAMES_INFO with 6 games, no desc, with images ---
OLD_GAMES_INFO = """const GAMES_INFO = [
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
];"""

NEW_GAMES_INFO = """const GAMES_INFO = [
  {
    image: "https://placehold.co/400x250/a71e22/FFF?text=Bingo",
    title: "Bingo",
  },
  {
    image: "https://placehold.co/400x250/e55c2f/FFF?text=Ghep+the+bai",
    title: "Ghép thẻ bài",
  },
  {
    image: "https://placehold.co/400x250/c0392b/FFF?text=Tiep+suc+noi+tu",
    title: "Tiếp sức nối từ",
  },
  {
    image: "https://placehold.co/400x250/8e1a1a/FFF?text=Chiec+hop+bi+mat",
    title: "Chiếc hộp bí mật",
  },
  {
    image: "https://placehold.co/400x250/d35400/FFF?text=Sap+xep+cau",
    title: "Sắp xếp trật tự câu",
  },
  {
    image: "https://placehold.co/400x250/c0392b/FFF?text=Tim+tu+dap+bang",
    title: "Tìm từ đập bảng",
  },
];"""

home = home.replace(OLD_GAMES_INFO, NEW_GAMES_INFO)

# --- 1c. Remove desc rendering from game cards ---
home = home.replace(
    """            <div key={g.title} className="game-card">
              
              {g.image && <img src={g.image} alt={g.title} className="game-card-img" />}
              <h3 className="game-card-title">{g.title}</h3>
              <p className="game-card-desc">{g.desc}</p>
            </div>""",
    """            <div key={g.title} className="game-card">
              {g.image && <img src={g.image} alt={g.title} className="game-card-img" />}
              <h3 className="game-card-title">{g.title}</h3>
            </div>"""
)

# --- 1d. Fix scroll-to anchors - change href targets to smooth scroll ---
# Giới thiệu trung tâm → /#gioi-thieu, Đội ngũ giáo viên → /#giao-vien
# These are already correct in PUBLIC_LINKS, but we need them to use
# window.location for same-page navigation. The Link component handles that.
# The issue is the Link to="/#gioi-thieu" from another page.
# Actually the issue might be that the id is "gioi-thieu" but the Link scrolls to top.
# Let's check if there's a scroll behavior in the router.

# --- 1e. Change "Thương mại" and "Trẻ em" in footer ---
# (these are in App.tsx, handled below)

with open(home_path, "w") as f:
    f.write(home)

print("Done Home.tsx")

# ═══════════════════════════════════════════════════════════════════════
# 2. App.tsx changes
# ═══════════════════════════════════════════════════════════════════════
app_path = base_dir + "/App.tsx"
with open(app_path, "r") as f:
    app = f.read()

# Fix course labels in navbar
app = app.replace('{ to: "/course/thuong-mai", label: "Thương mại" }',
                  '{ to: "/course/thuong-mai", label: "Tiếng Trung Thương mại" }')
app = app.replace('{ to: "/course/tre-em", label: "Trẻ em" }',
                  '{ to: "/course/tre-em", label: "Tiếng Trung Trẻ em" }')

# Fix "Giới thiệu trung tâm" and "Đội ngũ giáo viên" scroll targets.
# Use <a href> instead of <Link to> for same-page fragment scrolling
# Currently sub items use <Link key={s.to} to={s.to} className="subnav-item">
# The issue: React Router's Link adds to history but doesn't scroll.
# We need to detect same-page links and scroll manually.
# Simplest fix: replace Link with <a> for # links in sub-navbar
app = app.replace(
    """{PUBLIC_LINKS[activeMenu].sub.length > 0 && PUBLIC_LINKS[activeMenu].sub.map((s) => (
            <Link key={s.to} to={s.to} className="subnav-item">{s.label}</Link>
          ))}""",
    """{PUBLIC_LINKS[activeMenu].sub.length > 0 && PUBLIC_LINKS[activeMenu].sub.map((s) => (
            s.to.startsWith("/#")
              ? <a key={s.to} href={s.to} className="subnav-item" onClick={(e) => {
                  e.preventDefault();
                  const id = s.to.replace("/#", "");
                  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
                }}>{s.label}</a>
              : <Link key={s.to} to={s.to} className="subnav-item">{s.label}</Link>
          ))}"""
)

with open(app_path, "w") as f:
    f.write(app)

print("Done App.tsx")

# ═══════════════════════════════════════════════════════════════════════
# 3. styles.css changes
# ═══════════════════════════════════════════════════════════════════════
styles_path = base_dir + "/styles.css"
with open(styles_path, "r") as f:
    styles = f.read()

# Increase nav-dropdown-btn font size (first occurrence — main definition)
styles = styles.replace(
    "  font-size: 14px; font-weight: 500;\n  color: var(--c-text-soft);\n  padding: 6px 10px; border-radius: 8px;\n  font-family: inherit;\n  transition: background 0.15s, color 0.15s;\n  white-space: nowrap;\n}",
    "  font-size: 15.5px; font-weight: 500;\n  color: var(--c-text-soft);\n  padding: 6px 12px; border-radius: 8px;\n  font-family: inherit;\n  transition: background 0.15s, color 0.15s;\n  white-space: nowrap;\n}"
)

# Update game-card to be without desc — make image bigger and title at bottom
styles = styles + """
/* Game card update: no desc, image dominant */
.games-grid {
  grid-template-columns: repeat(3, 1fr);
}
.game-card {
  padding: 0;
  overflow: hidden;
  border-radius: 12px;
  position: relative;
}
.game-card-img {
  width: 100%;
  height: 160px;
  object-fit: cover;
  display: block;
  border-radius: 12px 12px 0 0;
}
.game-card-title {
  margin: 0;
  padding: 12px 14px;
  font-size: 0.95rem;
  font-weight: 600;
  text-align: center;
}
.game-card-desc { display: none; }
@media (max-width: 768px) {
  .games-grid { grid-template-columns: repeat(2, 1fr); }
}
"""

with open(styles_path, "w") as f:
    f.write(styles)

print("Done styles.css")
