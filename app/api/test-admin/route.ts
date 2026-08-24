import { NextResponse } from "next/server";
import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

export async function GET() {
  try {
    const projectId = "pharma-e-493405";
    const databaseId = "ai-studio-predictplay-f47b832e-a0f9-4c78-9648-5d8cf0dd0763";

    if (!getApps().length) {
      initializeApp({ projectId });
    }

    const adminDb = getFirestore();
    adminDb.settings({ databaseId });

    const snap = await adminDb.collection("matches").limit(1).get();
    return NextResponse.json({ success: true, count: snap.size });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message, stack: e.stack });
  }
}
