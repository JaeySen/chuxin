import { z } from "zod";

export const CourseIdSchema = z.enum(["han1", "han2", "han3", "han4"]);
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
  { id: "han1", title: "Hán ngữ 1", subtitle: "Khởi đầu — Bài 1 → 15", order: 1, color: "#FF8C00", lessonIds: [] },
  { id: "han2", title: "Hán ngữ 2", subtitle: "Tiếp nối — Bài 16 → 25", order: 2, color: "#0EA5E9", lessonIds: [] },
  { id: "han3", title: "Hán ngữ 3", subtitle: "Mở rộng vốn từ", order: 3, color: "#10B981", lessonIds: [] },
  { id: "han4", title: "Hán ngữ 4", subtitle: "Đọc — Nói — Tranh luận", order: 4, color: "#8B5CF6", lessonIds: [] },
];
