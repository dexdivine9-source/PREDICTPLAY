import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';

const projectId = process.env.FIREBASE_PROJECT_ID ?? "pharma-e-493405";
const databaseId = "ai-studio-predictplay-f47b832e-a0f9-4c78-9648-5d8cf0dd0763";
const storageBucket = `${projectId}.firebasestorage.app`;

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

export const adminDb = getFirestore();
adminDb.settings({ databaseId });
export const adminAuth = getAuth();
export const adminStorage = getStorage();
