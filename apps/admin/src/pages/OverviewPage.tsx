import { Shell } from "../components/Shell";
import { useAuth } from "../lib/auth-context";

export function OverviewPage() {
  const { user } = useAuth();
  return (
    <Shell title="Tổng quan">
      <div className="gv-card">
        <h2>Xin chào, {user?.displayName}</h2>
        <p className="muted" style={{ marginTop: 8 }}>Chào mừng bạn đến với Cổng Quản Trị Hệ Thống. Vui lòng chọn chức năng từ menu bên trái.</p>
      </div>
    </Shell>
  );
}
