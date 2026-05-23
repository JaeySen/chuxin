import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

if (!getApps().length) {
  if (process.env.FB_SERVICE_ACCOUNT_JSON) {
    // CI / Cloud Run: pass JSON content as env var
    initializeApp({ credential: cert(JSON.parse(process.env.FB_SERVICE_ACCOUNT_JSON)) });
  } else {
    // Local dev: set GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json
    // Cloud Run (attached service account): ADC picks it up automatically
    initializeApp();
  }
}

export const adminAuth = getAuth();
export const db = getFirestore();
