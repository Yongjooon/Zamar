import { initializeApp } from 'firebase/app';
import {
  browserLocalPersistence, browserSessionPersistence, connectAuthEmulator,
  indexedDBLocalPersistence, initializeAuth,
} from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';

const options = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const firebaseReady = Object.values(options).every(Boolean);
const app = firebaseReady ? initializeApp(options) : null;
// Password sign-in needs persistence, but no popup/redirect scripts or iframes.
export const auth = app ? initializeAuth(app, {
  persistence: [indexedDBLocalPersistence, browserLocalPersistence, browserSessionPersistence],
}) : null;
export const db = app ? getFirestore(app) : null;

if (app && import.meta.env.DEV && import.meta.env.VITE_FIREBASE_EMULATORS === 'true') {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
}
