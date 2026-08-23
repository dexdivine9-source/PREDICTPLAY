import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBHN47Sw6NccvV_1Cm5lkPfQ8mKdqFzuL4",
  authDomain: "pharma-e-493405.firebaseapp.com",
  projectId: "pharma-e-493405",
  storageBucket: "pharma-e-493405.firebasestorage.app",
  messagingSenderId: "677434018745",
  appId: "1:677434018745:web:1518b793e6be73e9cc8468"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app, "ai-studio-predictplay-f47b832e-a0f9-4c78-9648-5d8cf0dd0763");

export { app, auth, db };
