// Firebase web config — replace with your project's values.
// Both vanilla and react apps read from the same project.
window.HANAI_FIREBASE_CONFIG = {
  apiKey: "REPLACE_ME_API_KEY",
  authDomain: "sotamhsk.firebaseapp.com",
  projectId: "sotamhsk",
  storageBucket: "sotamhsk.appspot.com",
  messagingSenderId: "0000000000",
  appId: "1:0000000000:web:0000000000",
};

// Set window.HANAI_USE_EMULATOR = true (e.g. via /shared/local-config.js)
// to point Auth and Firestore at the local Firebase emulators.
window.HANAI_USE_EMULATOR = window.HANAI_USE_EMULATOR ?? false;
