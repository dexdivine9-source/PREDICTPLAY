import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBHN47Sw6NccvV_1Cm5lkPfQ8mKdqFzuL4",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "pharma-e-493405.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "pharma-e-493405",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "pharma-e-493405.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "677434018745",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:677434018745:web:1518b793e6be73e9cc8468"
};

const databaseId = process.env.NEXT_PUBLIC_FIREBASE_FIRESTORE_DATABASE_ID || "ai-studio-predictplay-f47b832e-a0f9-4c78-9648-5d8cf0dd0763";

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app, databaseId);
const storage = getStorage(app);

export { app, auth, db, storage };

