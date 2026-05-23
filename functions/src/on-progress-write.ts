import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

if (!getApps().length) initializeApp();

/**
 * When a /users/{uid}/progress/{lessonId} document is written, recompute the
 * user's per-course completion summary at /users/{uid}/_summary/courses.
 *
 * Stored shape:
 *   { han1: { completed: 3, total: 8, lastSeenAt: 1700000000000 }, ... }
 */
export const onProgressWrite = onDocumentWritten(
  "users/{uid}/progress/{lessonId}",
  async (event) => {
    const { uid, lessonId } = event.params;
    const db = getFirestore();

    const lessonSnap = await db.collection("lessons").doc(lessonId).get();
    if (!lessonSnap.exists) return;
    const course = (lessonSnap.data() as { course?: string }).course;
    if (!course) return;

    const progressSnap = await db
      .collection("users")
      .doc(uid)
      .collection("progress")
      .get();

    let completed = 0;
    let lastSeenAt = 0;
    for (const doc of progressSnap.docs) {
      const data = doc.data() as { completed?: boolean; lastSeenAt?: number };
      const lessonRef = await db.collection("lessons").doc(doc.id).get();
      if (!lessonRef.exists) continue;
      if ((lessonRef.data() as { course?: string }).course !== course) continue;
      if (data.completed) completed++;
      if (data.lastSeenAt && data.lastSeenAt > lastSeenAt) lastSeenAt = data.lastSeenAt;
    }

    const total = (
      await db.collection("lessons").where("course", "==", course).count().get()
    ).data().count;

    await db.collection("users").doc(uid).collection("_summary").doc("courses").set(
      {
        [course]: { completed, total, lastSeenAt },
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  },
);
