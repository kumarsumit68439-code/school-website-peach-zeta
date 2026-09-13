import { initializeApp, getApps } from "firebase/app";
import { getDatabase } from "firebase/database";

/**
 * Firebase project: umit-jilowa
 * Realtime Database (asia-southeast1)
 */
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCc2EE3QS27fF9Jhd-h-yqAeMhGsZgWmwk",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "umit-jilowa.firebaseapp.com",
  databaseURL:
    process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL ||
    "https://umit-jilowa-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "umit-jilowa",
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "umit-jilowa.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "76391524954",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:76391524954:web:c615ce7241cdacbe6e8663",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-J9SEBYLSZR",
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.databaseURL
);

let app = null;
let rtdb = null;

if (typeof window !== "undefined" && isFirebaseConfigured) {
  try {
    app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
    rtdb = getDatabase(app);
  } catch (e) {
    console.warn("Firebase init failed", e);
  }
}

export { rtdb };
export default app;
