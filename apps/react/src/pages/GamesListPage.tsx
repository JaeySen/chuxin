import { useHead } from "../lib/useHead";

const GAMES_INFO = [
  { image: "/games/bingo.webp", title: "Bingo" },
  { image: "/games/ghep-the-bai.webp", title: "Ghép thẻ bài" },
  { image: "/games/tiep-suc-noi-tu.webp", title: "Tiếp sức nối từ" },
  { image: "/games/chiec-hop-bi-mat.webp", title: "Chiếc hộp bí mật" },
  { image: "/games/sap-xep-cau.webp", title: "Sắp xếp trật tự câu" },
  { image: "/games/tim-tu-dap-bang.webp", title: "Tìm từ đập bảng" },
];

export function GamesListPage() {
  useHead({
    title: "Học qua trò chơi · Hán ngữ Sơ Tâm",
    description: "Các trò chơi giúp bạn luyện tập tiếng Trung hiệu quả.",
  });

  return (
    <div className="container" style={{ padding: "28px 20px 80px" }}>
      <h1 style={{ color: "var(--c-red-dark)", marginTop: 0, textAlign: "center" }}>Học qua trò chơi</h1>
      <p style={{ color: "var(--c-text-soft)", textAlign: "center", marginBottom: 40, maxWidth: 600, margin: "0 auto 40px" }}>
        Nhiều nghiên cứu giáo dục cho thấy hoạt động học tập qua trò chơi có thể tăng cường sự hứng thú và khả năng ghi nhớ của người học.
      </p>

      <div className="games-grid">
        {GAMES_INFO.map((g) => (
          <div key={g.title} className="game-card">
            {g.image && <img src={g.image} alt={g.title} className="game-card-img" />}
            <h3 className="game-card-title">{g.title}</h3>
          </div>
        ))}
      </div>
    </div>
  );
}
