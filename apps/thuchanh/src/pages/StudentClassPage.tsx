import { useParams } from "react-router-dom";
import { useState } from "react";
import { Shell } from "../components/Shell";

export function StudentClassPage() {
  const { id } = useParams();
  const [tab, setTab] = useState<"schedule" | "exercises">("schedule");

  return (
    <Shell title={`Lớp học ${id?.toUpperCase()}`}>
      <div className="gv-card" style={{ marginBottom: 20 }}>
        <h2>Lớp {id?.toUpperCase()}</h2>
        <p className="muted">Giáo viên: Nguyễn Văn A</p>
      </div>

      <div className="gv-tabs" style={{ display: 'flex', gap: 16, marginBottom: 20, borderBottom: '1px solid var(--border)' }}>
        <button 
          className={`btn btn-ghost ${tab === "schedule" ? "active" : ""}`} 
          style={{ borderBottom: tab === "schedule" ? '2px solid var(--c-primary)' : '2px solid transparent', borderRadius: 0 }}
          onClick={() => setTab("schedule")}
        >
          Thời khóa biểu
        </button>
        <button 
          className={`btn btn-ghost ${tab === "exercises" ? "active" : ""}`} 
          style={{ borderBottom: tab === "exercises" ? '2px solid var(--c-primary)' : '2px solid transparent', borderRadius: 0 }}
          onClick={() => setTab("exercises")}
        >
          Bài tập trực tuyến
        </button>
      </div>

      {tab === "schedule" && (
        <div className="gv-card">
          <h3>Thời khóa biểu</h3>
          <table className="gv-table" style={{ width: '100%', marginTop: 12 }}>
            <thead>
              <tr>
                <th>Ngày</th>
                <th>Giờ học</th>
                <th>Bài học</th>
                <th>Điểm danh</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Thứ 3, 10/10</td>
                <td>19:00 - 20:30</td>
                <td>Bài 1: Xin chào</td>
                <td><span style={{ color: 'green' }}>Có mặt</span></td>
              </tr>
              <tr>
                <td>Thứ 5, 12/10</td>
                <td>19:00 - 20:30</td>
                <td>Bài 2: Cảm ơn</td>
                <td>-</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {tab === "exercises" && (
        <div className="gv-card">
          <h3>Bài tập trắc nghiệm</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
            <div style={{ padding: 16, border: '1px solid var(--border)', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong>Bài tập Bài 1</strong>
                <p className="muted" style={{ margin: '4px 0 0', fontSize: 13 }}>20 câu hỏi • Trắc nghiệm</p>
              </div>
              <button className="btn btn-primary btn-sm">Làm bài</button>
            </div>
            <div style={{ padding: 16, border: '1px solid var(--border)', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong>Bài tập Bài 2</strong>
                <p className="muted" style={{ margin: '4px 0 0', fontSize: 13 }}>15 câu hỏi • Trắc nghiệm</p>
              </div>
              <button className="btn btn-primary btn-sm">Làm bài</button>
            </div>
          </div>
        </div>
      )}
    </Shell>
  );
}
