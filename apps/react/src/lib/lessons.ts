import { db, doc, getDoc, getDocs, collection, query, where, orderBy } from "./firebase";
import type { Lesson } from "@hanai/shared";

export async function fetchLesson(id: string): Promise<Lesson | null> {
  const snap = await getDoc(doc(db, "lessons", id));
  return snap.exists() ? (snap.data() as Lesson) : null;
}

export async function fetchCourseLessons(course: string): Promise<Lesson[]> {
  const snap = await getDocs(
    query(collection(db, "lessons"), where("course", "==", course), orderBy("order")),
  );
  return snap.docs.map((d) => d.data() as Lesson);
}

export async function fetchAllLessons(): Promise<Lesson[]> {
  const snap = await getDocs(query(collection(db, "lessons"), orderBy("course"), orderBy("order")));
  return snap.docs.map((d) => d.data() as Lesson);
}
