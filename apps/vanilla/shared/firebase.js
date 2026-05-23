import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import {
  getAuth,
  connectAuthEmulator,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";
import {
  getFirestore,
  connectFirestoreEmulator,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

const app = initializeApp(window.HANAI_FIREBASE_CONFIG);
export const auth = getAuth(app);
export const db = getFirestore(app);

if (window.HANAI_USE_EMULATOR) {
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
}

export const googleProvider = new GoogleAuthProvider();
export {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
};

export async function ensureUserDoc(user) {
  if (!user) return;
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      displayName: user.displayName ?? user.email ?? "Học viên",
      email: user.email ?? null,
      role: "student",
      createdAt: serverTimestamp(),
    });
  }
}

export async function fetchLesson(lessonId) {
  const snap = await getDoc(doc(db, "lessons", lessonId));
  return snap.exists() ? snap.data() : null;
}

export async function fetchCourseLessons(courseId) {
  const q = query(
    collection(db, "lessons"),
    where("course", "==", courseId),
    orderBy("order"),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data());
}
