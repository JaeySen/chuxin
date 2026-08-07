import { Link } from "react-router-dom";

// Landing page listing the "Bài tập tương tác" (interactive exercises) —
// ported standalone HTML mini-apps from chuxin-teachers-docs/k34, kept
// distinct from the "homework from word files" (quiz-import) feature.

const EXERCISES = [
  {
    to: "/bai-tap-tuong-tac/du-bao-thoi-tiet",
    icon: "🌦️",
    title: "Dự báo thời tiết",
    subtitle: "Nghe & đọc hiểu thời tiết Trung Quốc (HSK 1-2)",
    color: "#2563eb",
  },
  {
    to: "/bai-tap-tuong-tac/di-cho-sang",
    icon: "🧺",
    title: "Đi chợ sáng — Câu chữ 比",
    subtitle: "Ghép câu so sánh giá 比 / 没有 (HSK 2)",
    color: "#4CAF50",
  },
  {
    to: "/bai-tap-tuong-tac/goi-mon-an",
    icon: "🍜",
    title: "Gọi món ở nhà hàng",
    subtitle: "Nhập vai gọi món từng bước (HSK 1)",
    color: "#d35400",
  },
  {
    to: "/bai-tap-tuong-tac/hoc-gia-tien",
    icon: "🛍️",
    title: "Học giá tiền — Cửa hàng Taobao",
    subtitle: "Mua sắm & thanh toán qua hội thoại (HSK 1)",
    color: "#ff5000",
  },
];

export function InteractiveExercisesPage() {
  return (
    <div className="ie-shell">
      <div className="ie-hero">
        <h1>🎮 Bài tập tương tác</h1>
        <p>
          Các bài luyện tập tương tác trực tiếp trên trình duyệt — khác với phần{" "}
          <strong>bài tập từ file Word</strong> (đề trắc nghiệm/tự luận do giáo viên tải lên).
        </p>
      </div>
      <div className="ie-grid">
        {EXERCISES.map((ex) => (
          <Link key={ex.to} to={ex.to} className="ie-card">
            <span className="ie-card-icon">{ex.icon}</span>
            <h3>{ex.title}</h3>
            <div className="ie-card-sub">{ex.subtitle}</div>
            <div className="ie-card-bar" style={{ background: ex.color }} />
          </Link>
        ))}
      </div>
    </div>
  );
}
