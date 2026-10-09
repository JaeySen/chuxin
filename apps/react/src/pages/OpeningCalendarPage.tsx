import { useHead } from "../lib/useHead";
import { OpeningCalendar } from "../components/OpeningCalendar";

export function OpeningCalendarPage() {
  useHead({
    title: "Lịch khai giảng · Hán ngữ Sơ Tâm",
    description: "Lịch khai giảng các khóa học Hán ngữ Sơ Tâm trong tháng.",
  });

  return (
    <div className="container" style={{ padding: "28px 20px 80px" }}>
      <h1 style={{ color: "var(--c-red-dark)", marginTop: 0, textAlign: "center" }}>Lịch khai giảng</h1>
      <p style={{ color: "var(--c-text-soft)", textAlign: "center", marginBottom: 40, maxWidth: 600, margin: "0 auto 40px" }}>
        Lịch dự kiến khai giảng các khóa học trong tháng.
      </p>

      <OpeningCalendar />
    </div>
  );
}
