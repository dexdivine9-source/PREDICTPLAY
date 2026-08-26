import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';

const projectId = process.env.FIREBASE_PROJECT_ID ?? "predictplay-10230";
const databaseId = process.env.FIREBASE_DATABASE_ID ?? process.env.NEXT_PUBLIC_FIREBASE_FIRESTORE_DATABASE_ID;
const storageBucket = process.env.FIREBASE_STORAGE_BUCKET ?? `${projectId}.firebasestorage.app`;

if (!getApps().length) {
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (clientEmail && privateKey) {
    // Vercel / any environment with explicit service-account vars
    initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
      storageBucket,
    });
  } else {
    // Cloud Run / AI Studio — Application Default Credentials are available
    initializeApp({ projectId, storageBucket });
  }
}

export const adminDb = databaseId ? getFirestore(databaseId) : getFirestore();
export const adminAuth = getAuth();
export const adminStorage = getStorage();

