import { z } from "zod";

export const CourseIdSchema = z.enum(["han1", "han2", "han3", "han4", "han5", "han6", "thuong-mai", "tre-em"]);
export type CourseId = z.infer<typeof CourseIdSchema>;

export type CourseStatus = "ongoing" | "opening-soon" | "enrolling" | "full" | "coming-soon";

export const CourseSchema = z.object({
  id: CourseIdSchema,
  title: z.string(),
  subtitle: z.string().optional(),
  order: z.number().int().nonnegative(),
  color: z.string(),
  status: z.custom<CourseStatus>().optional(),
  lessonIds: z.array(z.string()).default([]),
});
export type Course = z.infer<typeof CourseSchema>;

export const COURSES: Course[] = [
  { id: "han1", title: "Hán ngữ 1", subtitle: "HSK 1 — Khởi đầu",               order: 1, color: "#a71e22", status: "ongoing",      lessonIds: [] },
  { id: "han2", title: "Hán ngữ 2", subtitle: "HSK 2 — Tiếp nối",               order: 2, color: "#c64a1f", status: "ongoing",      lessonIds: [] },
  { id: "han3", title: "Hán ngữ 3", subtitle: "HSK 3 — Mở rộng vốn từ",         order: 3, color: "#d97a1b", status: "enrolling",    lessonIds: [] },
  { id: "han4", title: "Hán ngữ 4", subtitle: "HSK 4 — Đọc · Nói · Tranh luận", order: 4, color: "#e6a316", status: "opening-soon", lessonIds: [] },
  { id: "han5", title: "Hán ngữ 5", subtitle: "HSK 5 — Nâng cao",               order: 5, color: "#ffc60b", status: "coming-soon",  lessonIds: [] },
  { id: "han6", title: "Hán ngữ 6", subtitle: "HSK 6 — Thành thạo",             order: 6, color: "#8a6900", status: "coming-soon",  lessonIds: [] },
  { id: "thuong-mai", title: "Tiếng Trung Thương mại", subtitle: "Giao tiếp kinh doanh & đàm phán", order: 7, color: "#2563eb", status: "coming-soon", lessonIds: [] },
  { id: "tre-em",     title: "Tiếng Trung Trẻ em",    subtitle: "Dành cho học sinh tiểu học & THCS",  order: 8, color: "#16a34a", status: "opening-soon", lessonIds: [] },
];
