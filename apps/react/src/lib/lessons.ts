import { apiFetch } from "./api";
import type { Lesson } from "@sotam/shared";

export async function fetchLesson(id: string): Promise<Lesson | null> {
  try {
    return await apiFetch<Lesson>(`/lessons/${encodeURIComponent(id)}`);
  } catch (err) {
    if (err instanceof Error && /HTTP 404/.test(err.message)) return null;
    throw err;
  }
}

export async function fetchCourseLessons(course: string): Promise<Lesson[]> {
  return apiFetch<Lesson[]>(`/courses/${encodeURIComponent(course)}/lessons`);
}

export async function fetchAllLessons(): Promise<Lesson[]> {
  return apiFetch<Lesson[]>("/lessons");
}
