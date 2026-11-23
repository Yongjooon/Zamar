import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

export function getFirebaseAdmin() {
  const emulator = process.env.FIREBASE_AUTH_EMULATOR_HOST && process.env.FIRESTORE_EMULATOR_HOST;
  const key = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const projectId = process.env.FIREBASE_PROJECT_ID;
  if (!projectId) throw new Error('FIREBASE_PROJECT_ID is required.');
  if (process.env.VERCEL && (!key || emulator)) {
    throw new Error('A production Firebase Admin credential is required on Vercel.');
  }
  let serviceAccount = null;
  try {
    if (key) serviceAccount = JSON.parse(key);
  } catch {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON must be a valid service account JSON.');
  }
  if (serviceAccount && serviceAccount.project_id !== projectId) {
    throw new Error('Firebase Admin credential and project ID do not match.');
  }
  const app = getApps()[0] ?? initializeApp({
    projectId,
    ...(emulator ? {} : { credential: serviceAccount ? cert(serviceAccount) : applicationDefault() }),
  });
  return { auth: getAuth(app), db: getFirestore(app) };
}
