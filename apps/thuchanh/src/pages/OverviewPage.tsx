import { Shell } from "../components/Shell";
import { useAuth } from "../lib/auth-context";

export function OverviewPage() {
  const { user } = useAuth();
  return (
    <Shell title="Tổng quan">
      <div className="gv-card">
        <h2>Xin chào, {user?.displayName}</h2>
        <p className="muted" style={{ marginTop: 8 }}>Vui lòng chọn một lớp học từ menu bên trái để xem thời khóa biểu và làm bài tập.</p>
      </div>
    </Shell>
  );
}
