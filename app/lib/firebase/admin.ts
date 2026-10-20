import "server-only";
import { applicationDefault, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

export function firebaseAdmin() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  if (!projectId) throw new Error("Firebase project configuration is required.");
  const existing = getApps().find(app => app.name === "apna-property");
  if (existing) {
    if (existing.options.projectId !== projectId) throw new Error("Firebase project configuration changed; restart the server.");
    return existing;
  }
  // App Hosting uses its runtime service identity. Local development uses ADC.
  // Never put a service-account private key in source or browser environment variables.
  return initializeApp({ projectId, credential: applicationDefault(), ...(process.env.FIREBASE_STORAGE_BUCKET ? { storageBucket: process.env.FIREBASE_STORAGE_BUCKET } : {}) }, "apna-property");
}
export const firebaseAuth = () => getAuth(firebaseAdmin());
export const firebaseDb = () => getFirestore(firebaseAdmin());
export function firebaseBucket() {
  if (!process.env.FIREBASE_STORAGE_BUCKET) throw new Error("Firebase Storage bucket configuration is required.");
  return getStorage(firebaseAdmin()).bucket();
}
