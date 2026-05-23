import fs from 'fs';
import admin from 'firebase-admin';
import { env } from './env.js';

let firebaseApp = null;

function loadServiceAccount() {
  if (env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    const raw = fs.readFileSync(env.FIREBASE_SERVICE_ACCOUNT_PATH, 'utf8');
    return JSON.parse(raw);
  }

  if (env.FIREBASE_PROJECT_ID && env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PRIVATE_KEY) {
    return {
      projectId: env.FIREBASE_PROJECT_ID,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
      privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    };
  }

  throw new Error(
    'Firebase Admin not configured. Set FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY',
  );
}

export function getFirebaseAdmin() {
  if (!firebaseApp) {
    const credential = admin.credential.cert(loadServiceAccount());
    firebaseApp = admin.initializeApp({ credential });
  }
  return firebaseApp;
}

export function getFirebaseAuth() {
  return getFirebaseAdmin().auth();
}
