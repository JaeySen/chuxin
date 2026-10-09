import React from 'react';

export const OPENING_CLASSES = [
  {
    name: "HSK 1 — Lớp 1.1",
    date: "01.10.2026",
    schedule: "Tối 3-5 (T3 & T5), 22:00 – 23:30",
    status: "upcoming" as const,
    statusLabel: "Sắp diễn ra",
  },
  {
    name: "HSK 1 — Lớp 1.2",
    date: "04.10.2026",
    schedule: "Cuối tuần (T7 & CN), 16:00 – 17:30",
    status: "enrolling" as const,
    statusLabel: "Đang tuyển sinh",
  },
];

export function OpeningCalendar() {
  return (
    <div className="lich-grid">
      {OPENING_CLASSES.map((cls) => (
        <div key={cls.name} className={`lich-card lich-card--${cls.status}`}>
          <div className={`lich-status lich-status--${cls.status}`}>
            <span className="lich-status-dot" />
            {cls.statusLabel}
          </div>
          <h3 className="lich-name">{cls.name}</h3>
          
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <span style={{ background: 'var(--c-bg-soft)', color: 'var(--c-text-soft)', padding: '2px 8px', borderRadius: 4, fontSize: '0.8rem', fontWeight: 600 }}>💻 Online</span>
            <span style={{ background: 'var(--c-bg-soft)', color: 'var(--c-text-soft)', padding: '2px 8px', borderRadius: 4, fontSize: '0.8rem', fontWeight: 600 }}>⏳ 25 buổi</span>
          </div>

          <div className="lich-row">
            <span className="lich-row-icon">📅</span>
            <div>
              <div className="lich-row-label">NGÀY KHAI GIẢNG</div>
              <div className="lich-row-value">{cls.date}</div>
            </div>
          </div>
          <div className="lich-row">
            <span className="lich-row-icon">🕐</span>
            <div>
              <div className="lich-row-label">THỜI GIAN</div>
              <div className="lich-row-value lich-row-value--normal">{cls.schedule}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
