/**
 * Firebase bootstrap — browser side.
 *
 * Nothing here runs until a real config is present, so the whole site builds
 * and renders with no Firebase project attached. Drop the keys into
 * `.env.local` (see `.env.local.example`).
 *
 * This file deliberately exposes **Auth only**. There is no client Firestore
 * accessor, because `firestore.rules` denies every client request: any query
 * from a browser fails by design. Reads and writes go through the server routes
 * in `app/api/`, which use the Admin SDK (`lib/firebase-admin.js`). If you find
 * yourself wanting a `getDb()` here, you want an API route instead.
 */
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/** True once the six required keys are all present. */
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    firebaseConfig.appId &&
    firebaseConfig.authDomain
);

let app = null;

export function getFirebaseApp() {
  if (!isFirebaseConfigured) return null;
  if (!app) app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  return app;
}

export function getFirebaseAuth() {
  const a = getFirebaseApp();
  return a ? getAuth(a) : null;
}
