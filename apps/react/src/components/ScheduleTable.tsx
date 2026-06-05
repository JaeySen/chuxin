import { useEffect, useState } from "react";

export interface ScheduleRow {
  code: string;
  name: string;
  days: string;
  time: string;
  startDate: string;
}

const FALLBACK: ScheduleRow[] = [
  { code: "K1H1", name: "HSK 1 + giao tiếp SC1", days: "Thứ 2-4-6", time: "19h30 - 21h",  startDate: "" },
  { code: "K2H1", name: "HSK 1 + giao tiếp SC1", days: "Thứ 2-4",   time: "21h - 22h30",  startDate: "" },
  { code: "K3H1", name: "HSK 1 + giao tiếp SC1", days: "Thứ 2-4",   time: "22h - 23h30",  startDate: "" },
  { code: "K4H1", name: "HSK 1 + giao tiếp SC1", days: "Thứ 3-5-7", time: "19h30 - 21h",  startDate: "" },
  { code: "K5H1", name: "HSK 1 + giao tiếp SC1", days: "Thứ 3-5",   time: "21h - 22h30",  startDate: "" },
  { code: "K1H2", name: "HSK 2 + giao tiếp SC2", days: "Thứ 2-4",   time: "19h30 - 21h",  startDate: "" },
  { code: "K2H2", name: "HSK 2 + giao tiếp SC2", days: "Thứ 3-5",   time: "19h30 - 21h",  startDate: "" },
];

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:4000";

// Column widths as CSS fractions — code is narrow, name gets most space
const GRID_COLS = "80px 1fr 100px 110px 120px";

const HEADERS = ["Mã", "Tên", "Thứ", "Ca học", "Khai giảng"];

export function ScheduleTable() {
  const [rows, setRows] = useState<ScheduleRow[]>(FALLBACK);
  const [source, setSource] = useState<"fallback" | "sheet">("fallback");

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_BASE}/schedule`)
      .then((r) => r.ok ? r.json() : null)
      .then((data: { rows?: ScheduleRow[]; source?: string } | null) => {
        if (cancelled || !data) return;
        if (Array.isArray(data.rows) && data.rows.length > 0) {
          setRows(data.rows);
          setSource("sheet");
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="schedule-card">
      {/* CSS-grid schedule — no <table>, no text wrapping */}
      <div className="sg-grid" style={{ "--sg-cols": GRID_COLS } as React.CSSProperties}>
        {/* Header */}
        <div className="sg-header">
          {HEADERS.map((h) => <div key={h} className="sg-cell sg-hcell">{h}</div>)}
        </div>

        {/* Rows */}
        {rows.map((r, i) => (
          <div key={r.code} className={`sg-row ${i % 2 === 1 ? "sg-row--alt" : ""}`}>
            <div className="sg-cell sg-code">{r.code}</div>
            <div className="sg-cell sg-name">{r.name}</div>
            <div className="sg-cell">{r.days}</div>
            <div className="sg-cell">{r.time}</div>
            <div className="sg-cell">{r.startDate || <span className="muted">—</span>}</div>
          </div>
        ))}
      </div>

      <div className="schedule-highlights">
        <div className="schedule-hl">
          <strong>🎥 Học ONLINE trực tiếp</strong>
          <p>Học qua phần mềm VOOV; giáo viên tương tác và sửa bài thời gian thực.</p>
        </div>
        <div className="schedule-hl">
          <strong>📗 Chuẩn HSK 3.0</strong>
          <p>Tặng kèm bộ học liệu số tích hợp công nghệ giúp ghi nhớ từ vựng hiệu quả.</p>
        </div>
        <div className="schedule-hl">
          <strong>💬 Hỗ trợ 24/7</strong>
          <p>Cung cấp video xem lại (Record) sau mỗi buổi học và hỗ trợ giải đáp qua nhóm lớp.</p>
        </div>
      </div>

      {source === "fallback" && (
        <div className="schedule-source-note">
          Hiển thị lịch mẫu — cấu hình <code>SCHEDULE_CSV_URL</code> trên server để đồng bộ từ Google Sheet.
        </div>
      )}
    </div>
  );
}
