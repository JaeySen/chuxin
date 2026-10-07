import { useHead } from "../lib/useHead";

const TEACHER_BRIEFS = [
  { file: "/chuxin-teacher-1-trungnd.webp", name: "Nguyễn Đức Trung" },
  { file: "/chuxin-teacher-2-haltg.webp",  name: "Lê Thiên Giao Hạ" },
  { file: "/chuxin-teacher-3-huetv.webp",  name: "Triệu Văn Huệ" },
  { file: "/chuxin-teacher-4-hantg.webp",  name: "Trần Gia Hân" },
  { file: "/chuxin-teacher-5-dongmv.webp", name: "Mã Vũ Đồng" },
  { file: "/chuxin-teacher-6-haint.webp",  name: "Hải Nguyễn Thị" },
  { file: "/chuxin-teacher-7-trangptt.webp", name: "Phan Thị Thu Trang" },
];

export function TeacherPage() {
  useHead({
    title: "Đội ngũ giáo viên · Hán ngữ Sơ Tâm",
    description: "Đội ngũ giáo viên tại Hán ngữ Sơ Tâm.",
  });

  return (
    <div className="container" style={{ padding: "28px 20px 80px" }}>
      <h1 style={{ color: "var(--c-red-dark)", marginTop: 0, textAlign: "center" }}>Đội ngũ giáo viên</h1>
      <p style={{ color: "var(--c-text-soft)", textAlign: "center", marginBottom: 40 }}>
        Toàn bộ giáo viên của Sơ Tâm là các Thạc sĩ chuyên ngành Hán ngữ Quốc tế,
        được đào tạo tại các trường đại học hàng đầu tại Trung Quốc.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: 32 }}>
        {TEACHER_BRIEFS.map((t, idx) => (
          <div key={idx} style={{ borderRadius: 12, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
            <img src={t.file} alt={t.name} style={{ width: '100%', display: 'block' }} />
          </div>
        ))}
      </div>
    </div>
  );
}
