import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

const projectId = "pharma-e-493405";
const databaseId = "ai-studio-predictplay-f47b832e-a0f9-4c78-9648-5d8cf0dd0763";

if (!getApps().length) {
  initializeApp({ projectId });
}

export const adminDb = getFirestore();
adminDb.settings({ databaseId });
export const adminAuth = getAuth();
