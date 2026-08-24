"use server";

import { adminDb } from "@/lib/firebase-admin";
import * as FirebaseFirestore from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";
import { EvidencePhase } from "@/lib/types";

// This is called by the client AFTER they successfully upload to Firebase Storage
export async function registerEvidenceAction(
  userId: string,
  matchId: string,
  phase: EvidencePhase,
  storagePath: string
) {
  if (!userId || !matchId || !phase || !storagePath) {
    throw new Error("Missing required evidence fields");
  }

  // 1. Verify match participation
  const matchRef = adminDb.collection("matches").doc(matchId);
  const matchDoc = await matchRef.get();
  
  if (!matchDoc.exists) throw new Error("Match not found");
  const matchData = matchDoc.data()!;
  
  if (matchData.player1Id !== userId && matchData.player2Id !== userId) {
    throw new Error("Unauthorized: You are not a participant in this match.");
  }

  // 2. Determine Evidence Session
  const sessionRef = adminDb.collection("match_evidence_sessions").doc(matchId);
  
  await adminDb.runTransaction(async (transaction) => {
    const sessionDoc = await transaction.get(sessionRef);
    if (!sessionDoc.exists) {
      // Create session if it doesn't exist
      transaction.set(sessionRef, {
        matchId,
        game: matchData.game,
        player1Id: matchData.player1Id,
        player2Id: matchData.player2Id,
        status: "ACTIVE",
        createdAt: FieldValue.serverTimestamp()
      });
    }

    // 3. Find if previous evidence exists to increment attempt number
    const existingEvidenceSnap = await adminDb.collection("match_evidence")
      .where("matchId", "==", matchId)
      .where("userId", "==", userId)
      .where("phase", "==", phase)
      .orderBy("attemptNumber", "desc")
      .limit(1)
      .get();
    
    let attemptNumber = 1;
    let supersedesEvidenceId = null;

    if (!existingEvidenceSnap.empty) {
      const prevDoc = existingEvidenceSnap.docs[0];
      attemptNumber = prevDoc.data().attemptNumber + 1;
      supersedesEvidenceId = prevDoc.id;
    }

    // 4. Create new evidence record
    const evidenceRef = adminDb.collection("match_evidence").doc();
    transaction.set(evidenceRef, {
      evidenceId: evidenceRef.id,
      matchId,
      userId,
      type: "SCREENSHOT",
      phase,
      attemptNumber,
      supersedesEvidenceId,
      storagePath,
      uploadedAt: FieldValue.serverTimestamp(),
      analysisStatus: "QUEUED"
    });
    
    // Update match state
    if (phase === "START") {
      transaction.update(matchRef, { state: "START_EVIDENCE_PROCESSING" });
    } else if (phase === "END") {
      transaction.update(matchRef, { state: "END_EVIDENCE_PROCESSING" });
    }
  });
}

// --- AI ABSTRACTION ---
// In a real production environment, this would call Gemini Vision.
// For the MVP, we will abstract this and return a simulated structured JSON.
export async function analyzeEvidenceAction(evidenceId: string, simulatedPayload?: any) {
  const evidenceRef = adminDb.collection("match_evidence").doc(evidenceId);
  
  await adminDb.runTransaction(async (transaction) => {
    const doc = await transaction.get(evidenceRef);
    if (!doc.exists) throw new Error("Evidence not found");
    
    // Simulate AI extraction delay
    // In production, we'd fetch the image from Firebase Storage and pass to Gemini.
    const mockAiPayload = simulatedPayload || {
      game: "DLS", 
      gameConfidence: 0.98,
      visiblePlayerNames: ["Player1"], 
      playerNameConfidence: 0.9,
      visibleOpponentNames: ["Player2"], 
      opponentNameConfidence: 0.9,
      score: { player1: 3, player2: 1 }, 
      scoreConfidence: 0.97,
      screenType: doc.data()!.phase === "END" ? "FINAL_RESULT" : "PRE_MATCH",
      screenTypeConfidence: 0.96,
      uiConsistency: 0.95,
      possibleManipulation: false,
      manipulationSignals: [],
      notes: ["Auto-analyzed by AI abstraction layer"]
    };

    transaction.update(evidenceRef, {
      analysisStatus: "COMPLETE",
      aiPayload: mockAiPayload,
      imageHash: "mock-sha256-hash-" + Date.now(), // Simulated
      perceptualHash: "mock-phash-" + Date.now() // Simulated
    });
  });
}

// --- DETERMINISTIC VERIFICATION ENGINE ---
export async function verifyMatchAction(matchId: string) {
  const matchRef = adminDb.collection("matches").doc(matchId);
  
  await adminDb.runTransaction(async (transaction) => {
    const matchDoc = await transaction.get(matchRef);
    if (!matchDoc.exists) throw new Error("Match not found");
    const matchData = matchDoc.data()!;

    if (matchData.state === "COMPLETED" || matchData.state === "CANCELLED") {
      throw new Error("Match is already resolved");
    }

    // Fetch all evidence for this match
    const evidenceSnap = await transaction.get(
      adminDb.collection("match_evidence").where("matchId", "==", matchId)
    );
    
    // Group evidence by active (latest attempt)
    const activeEvidence = new Map<string, any>(); // key: `${userId}_${phase}`
    
    evidenceSnap.docs.forEach(doc => {
      const data = doc.data();
      const key = `${data.userId}_${data.phase}`;
      if (!activeEvidence.has(key) || activeEvidence.get(key).attemptNumber < data.attemptNumber) {
        activeEvidence.set(key, data);
      }
    });

    const p1Start = activeEvidence.get(`${matchData.player1Id}_START`);
    const p2Start = activeEvidence.get(`${matchData.player2Id}_START`);
    const p1End = activeEvidence.get(`${matchData.player1Id}_END`);
    const p2End = activeEvidence.get(`${matchData.player2Id}_END`);

    // Check completeness
    if (!p1Start || !p2Start || !p1End || !p2End) {
      transaction.update(matchRef, { state: "MANUAL_REVIEW", resolutionReason: "Missing evidence" });
      return;
    }

    // Ensure all are processed
    if (
      p1Start.analysisStatus !== "COMPLETE" || p2Start.analysisStatus !== "COMPLETE" ||
      p1End.analysisStatus !== "COMPLETE" || p2End.analysisStatus !== "COMPLETE"
    ) {
      // Still processing
      return;
    }

    // HARD CONSTRAINTS
    const p1Payload = p1End.aiPayload;
    const p2Payload = p2End.aiPayload;

    if (p1Payload.game !== matchData.game || p2Payload.game !== matchData.game) {
      transaction.update(matchRef, { state: "MANUAL_REVIEW", resolutionReason: "Game mismatch" });
      return;
    }

    // We assume the AI returns normalized scores like { player1: 3, player2: 1 } from the perspective of the uploader.
    // Or we assume standard absolute representation. Let's assume AI outputs absolute P1/P2 based on identity.
    // For simplicity, we just check if the scores match identically.
    
    const p1ScoreReport = p1Payload.score;
    const p2ScoreReport = p2Payload.score;

    if (
      p1ScoreReport.player1 !== p2ScoreReport.player1 ||
      p1ScoreReport.player2 !== p2ScoreReport.player2
    ) {
      transaction.update(matchRef, { state: "DISPUTED", resolutionReason: "Contradictory scores" });
      return;
    }

    // Soft confidence calculation (simplified)
    let confidence = 100;
    if (p1Payload.possibleManipulation || p2Payload.possibleManipulation) confidence -= 50;
    
    if (confidence >= 90) {
      // AUTO VERIFY
      const p1Final1 = p1ScoreReport.player1;
      const p1Final2 = p1ScoreReport.player2;
      
      let winningOutcome = "draw";
      if (p1Final1 > p1Final2) winningOutcome = "p1";
      else if (p1Final2 > p1Final1) winningOutcome = "p2";
      
      transaction.update(matchRef, { 
        state: "AUTO_VERIFIED",
        verifiedScoreP1: p1Final1,
        verifiedScoreP2: p1Final2,
        verifiedOutcome: winningOutcome,
        verificationConfidence: confidence,
        analysisCompletedAt: FieldValue.serverTimestamp()
      });
    } else {
      transaction.update(matchRef, { state: "MANUAL_REVIEW", resolutionReason: "Low confidence", verificationConfidence: confidence });
    }
  });

  // We must trigger settlement OUTSIDE the transaction since it's a separate process,
  // OR we can export `triggerSettlementAction` to handle the final `AUTO_VERIFIED` -> `COMPLETED` phase.
}

// --- SETTLEMENT BRIDGE ---
import { settleMarket } from "./actions"; // Need to export settleMarket from actions.ts

export async function finalizeVerifiedMatchAction(matchId: string) {
  let winningOutcomeToSettle: string | null = null;

  await adminDb.runTransaction(async (transaction) => {
    const matchRef = adminDb.collection("matches").doc(matchId);
    const matchDoc = await transaction.get(matchRef);
    if (!matchDoc.exists) throw new Error("Match not found");
    const data = matchDoc.data()!;

    if (data.state !== "AUTO_VERIFIED" && data.state !== "MANUAL_REVIEW_VERIFIED") {
      throw new Error("Match not ready for completion");
    }

    winningOutcomeToSettle = data.verifiedOutcome;

    transaction.update(matchRef, { 
      state: "COMPLETED",
      resolvedAt: FieldValue.serverTimestamp()
    });

    // We do NOT settle inside this same transaction lock if it's too large, but for atomic consistency,
    // we can either bundle them or run sequentially. The existing `settleMarket` takes a transaction.
    // So let's actually just call it here!
    if (winningOutcomeToSettle) {
      await settleMarket(transaction, matchId, winningOutcomeToSettle);
    }
  });
}
