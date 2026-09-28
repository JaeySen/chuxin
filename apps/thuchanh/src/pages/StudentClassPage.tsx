import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { Shell } from "../components/Shell";
import { apiFetch, buildStudentQuizUrl } from "../lib/api";

interface ClassRow { id: string; name: string; course_id: string; teacher_name: string; teacher_id: string; }
interface QuizSummary { id: string; title: string; total: number; mcq: number; open: number; }


export function StudentClassPage() {
  const { id } = useParams();
  const [tab, setTab] = useState<"schedule" | "exercises">("schedule");
  const [cls, setCls] = useState<ClassRow | null>(null);
  const [quizzes, setQuizzes] = useState<QuizSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    apiFetch<ClassRow>(`/classes/${id}`)
      .then(async (c) => {
        setCls(c);
        if (c.course_id) {
          const qs = await apiFetch<QuizSummary[]>(`/quiz?courseId=${c.course_id}`);
          setQuizzes(qs);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Shell title="Đang tải..."><div className="muted">Đang tải...</div></Shell>;
  if (!cls) return <Shell title="Lỗi"><div className="muted">Không tìm thấy lớp học.</div></Shell>;


  return (
    <Shell title={`${cls.name}`}>
      <div className="gv-card" style={{ marginBottom: 20 }}>
        <h2>{cls.name}</h2>
        <p className="muted">Giáo viên: {cls.teacher_name || "Chưa phân công"}</p>
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
          <h3>Bài tập trực tuyến</h3>
          {quizzes.length === 0 ? (
            <div className="muted" style={{ marginTop: 12 }}>Chưa có bài tập nào cho khóa học này.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
              {quizzes.map(q => (
                <div key={q.id} style={{ padding: 16, border: '1px solid var(--border)', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong>{q.title}</strong>
                    <p className="muted" style={{ margin: '4px 0 0', fontSize: 13 }}>
                      {q.total} câu hỏi {q.mcq > 0 ? `(${q.mcq} trắc nghiệm)` : ""} {q.open > 0 ? `(${q.open} tự luận)` : ""}
                    </p>
                  </div>
                  {/* Link to the landing page quiz player just like Admin preview */}
                  <a href={buildStudentQuizUrl(q.id)} target="_blank" className="btn btn-primary btn-sm">Làm bài</a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Shell>
  );
}
