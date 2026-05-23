import { initializeApp } from "firebase/app";
import {
  getAuth,
  connectAuthEmulator,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import {
  getFirestore,
  connectFirestoreEmulator,
  doc,
  getDoc,
  getDocs,
  setDoc,
  collection,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";

const config = {
  apiKey: import.meta.env.VITE_FB_API_KEY ?? "REPLACE_ME_API_KEY",
  authDomain: import.meta.env.VITE_FB_AUTH_DOMAIN ?? "sotamhsk.firebaseapp.com",
  projectId: import.meta.env.VITE_FB_PROJECT_ID ?? "sotamhsk",
  storageBucket: import.meta.env.VITE_FB_STORAGE_BUCKET ?? "sotamhsk.appspot.com",
  messagingSenderId: import.meta.env.VITE_FB_SENDER_ID ?? "0000000000",
  appId: import.meta.env.VITE_FB_APP_ID ?? "1:0000000000:web:0000000000",
};

const app = initializeApp(config);
export const auth = getAuth(app);
export const db = getFirestore(app);

if (import.meta.env.VITE_USE_EMULATOR === "true") {
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
}

export const googleProvider = new GoogleAuthProvider();

export {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  doc,
  getDoc,
  getDocs,
  setDoc,
  collection,
  query,
  where,
  orderBy,
  serverTimestamp,
};
export type { User };

export async function ensureUserDoc(user: User) {
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
