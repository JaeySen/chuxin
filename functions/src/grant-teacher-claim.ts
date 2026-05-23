import { beforeUserCreated } from "firebase-functions/v2/identity";
import { initializeApp, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

if (!getApps().length) initializeApp();

/**
 * Hard-coded teacher allowlist. Edit this list (or replace with a Firestore lookup)
 * and redeploy when the team changes.
 *
 * Anyone signing in for the first time with an email in this set gets
 * `role: "teacher"` as a custom claim, which the Firestore rules use to grant
 * write access to /lessons/* and /courses/*.
 */
const TEACHER_EMAILS = new Set<string>([
  "jasson.testapp@gmail.com",
]);

export const onUserCreate = beforeUserCreated(async (event) => {
  const email = event.data.email?.toLowerCase();
  if (!email) return;
  if (!TEACHER_EMAILS.has(email)) return;
  await getAuth().setCustomUserClaims(event.data.uid, { role: "teacher" });
});
