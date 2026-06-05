import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Shell } from "../components/Shell";
import { apiFetch, type GvSession } from "../lib/api";

type CalSession = GvSession & { class_name: string; class_id: string };

const DAYS = ["CN", "Th2", "Th3", "Th4", "Th5", "Th6", "Th7"];
const MONTHS = ["Tháng 1","Tháng 2","Tháng 3","Tháng 4","Tháng 5","Tháng 6","Tháng 7","Tháng 8","Tháng 9","Tháng 10","Tháng 11","Tháng 12"];

export function CalendarPage() {
  const [sessions, setSessions] = useState<CalSession[]>([]);
  const [current, setCurrent] = useState(() => new Date());
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<CalSession[]>("/calendar")
      .then(setSessions)
      .catch((e: unknown) => setErr(e instanceof Error ? e.message : String(e)));
  }, []);

  const year  = current.getFullYear();
  const month = current.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date().toISOString().slice(0, 10);

  function pad(n: number) { return String(n).padStart(2, "0"); }
  function dateKey(d: number) { return `${year}-${pad(month + 1)}-${pad(d)}`; }

  const byDate: Record<string, CalSession[]> = {};
  sessions.forEach((s) => {
    const k = s.session_date?.slice(0, 10);
    if (!k) return;
    (byDate[k] ??= []).push(s);
  });

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  function prev() { setCurrent(new Date(year, month - 1, 1)); }
  function next() { setCurrent(new Date(year, month + 1, 1)); }

  return (
    <Shell title="Lịch dạy">
      <div className="gv-page-header">
        <h1>Lịch dạy</h1>
      </div>

      {err && <div className="feedback feedback-bad" style={{ marginBottom: 12 }}>{err}</div>}

      <div className="gv-card">
        {/* Month nav */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
          <button className="btn btn-sm btn-secondary" onClick={prev}>◀</button>
          <strong style={{ fontSize: 16, flex: 1, textAlign: "center" }}>
            {MONTHS[month]} {year}
          </strong>
          <button className="btn btn-sm btn-secondary" onClick={next}>▶</button>
        </div>

        {/* Day headers */}
        <div className="gv-calendar">
          {DAYS.map((d) => <div key={d} className="gv-cal-day-header">{d}</div>)}

          {cells.map((day, i) => {
            if (!day) return <div key={`e${i}`} />;
            const k = dateKey(day);
            const evts = byDate[k] ?? [];
            return (
              <div key={k} className={`gv-cal-cell ${k === today ? "gv-cal-cell--today" : ""}`}>
                <div className="gv-cal-date">{day}</div>
                {evts.map((e) => (
                  <Link key={e.id} to={`/sessions/${e.id}`} className="gv-cal-event" title={e.class_name}>
                    {e.start_time.slice(0, 5)} {e.class_name}
                  </Link>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </Shell>
  );
}
