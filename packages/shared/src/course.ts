import { z } from "zod";

export const CourseIdSchema = z.enum(["han1", "han2", "han3", "han4", "han5", "han6"]);
export type CourseId = z.infer<typeof CourseIdSchema>;

export const CourseSchema = z.object({
  id: CourseIdSchema,
  title: z.string(),
  subtitle: z.string().optional(),
  order: z.number().int().nonnegative(),
  color: z.string(),
  lessonIds: z.array(z.string()).default([]),
});
export type Course = z.infer<typeof CourseSchema>;

export const COURSES: Course[] = [
  { id: "han1", title: "Hán ngữ 1", subtitle: "HSK 1 — Khởi đầu",           order: 1, color: "#a71e22", lessonIds: [] },
  { id: "han2", title: "Hán ngữ 2", subtitle: "HSK 2 — Tiếp nối",           order: 2, color: "#c64a1f", lessonIds: [] },
  { id: "han3", title: "Hán ngữ 3", subtitle: "HSK 3 — Mở rộng vốn từ",     order: 3, color: "#d97a1b", lessonIds: [] },
  { id: "han4", title: "Hán ngữ 4", subtitle: "HSK 4 — Đọc · Nói · Tranh luận", order: 4, color: "#e6a316", lessonIds: [] },
  { id: "han5", title: "Hán ngữ 5", subtitle: "HSK 5 — Nâng cao",           order: 5, color: "#ffc60b", lessonIds: [] },
  { id: "han6", title: "Hán ngữ 6", subtitle: "HSK 6 — Thành thạo",         order: 6, color: "#8a6900", lessonIds: [] },
];
