"use server";

import { adminDb } from "@/lib/firebase-admin";
import * as FirebaseFirestore from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";
import { EvidencePhase } from "@/lib/types";
import { getAuthUser } from "@/lib/auth-server";
import { settleMarket } from "./actions"; 

export async function registerEvidenceAction(
  matchId: string,
  phase: EvidencePhase,
  storagePath: string
) {
  const user = await getAuthUser();
  const userId = user.uid;

  if (!matchId || !phase || !storagePath) {
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

export async function analyzeEvidenceAction(evidenceId: string, simulatedPayload?: any) {
  // Normally called by internal backend processes or Cloud Tasks, NOT by clients directly.
  // But if called by client, we MUST verify admin. For MVP, we'll just verify auth.
  const user = await getAuthUser();
  if (!user.admin) {
    throw new Error("Unauthorized: Only admins or system processes can analyze evidence directly");
  }

  const evidenceRef = adminDb.collection("match_evidence").doc(evidenceId);
  
  await adminDb.runTransaction(async (transaction) => {
    const doc = await transaction.get(evidenceRef);
    if (!doc.exists) throw new Error("Evidence not found");
    
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
      aiPayload: mockAiPayload
    });
  });
}

export async function verifyMatchAction(matchId: string) {
  const user = await getAuthUser();
  // We can let any auth user trigger the deterministic engine, it relies only on trusted AI payload, not client data.
  // But ideally, only admin or system process triggers this. We will enforce admin claim.
  if (!user.admin) {
     throw new Error("Unauthorized");
  }

  const matchRef = adminDb.collection("matches").doc(matchId);
  
  await adminDb.runTransaction(async (transaction) => {
    const matchDoc = await transaction.get(matchRef);
    if (!matchDoc.exists) throw new Error("Match not found");
    const matchData = matchDoc.data()!;

    if (matchData.state === "COMPLETED" || matchData.state === "CANCELLED") {
      throw new Error("Match is already resolved");
    }

    const evidenceSnap = await transaction.get(
      adminDb.collection("match_evidence").where("matchId", "==", matchId)
    );
    
    const activeEvidence = new Map<string, any>(); 
    
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

    if (!p1Start || !p2Start || !p1End || !p2End) {
      transaction.update(matchRef, { state: "MANUAL_REVIEW", resolutionReason: "Missing evidence" });
      return;
    }

    if (
      p1Start.analysisStatus !== "COMPLETE" || p2Start.analysisStatus !== "COMPLETE" ||
      p1End.analysisStatus !== "COMPLETE" || p2End.analysisStatus !== "COMPLETE"
    ) {
      return;
    }

    const p1Payload = p1End.aiPayload;
    const p2Payload = p2End.aiPayload;

    if (p1Payload.game !== matchData.game || p2Payload.game !== matchData.game) {
      transaction.update(matchRef, { state: "MANUAL_REVIEW", resolutionReason: "Game mismatch" });
      return;
    }

    const p1ScoreReport = p1Payload.score;
    const p2ScoreReport = p2Payload.score;

    if (
      p1ScoreReport.player1 !== p2ScoreReport.player1 ||
      p1ScoreReport.player2 !== p2ScoreReport.player2
    ) {
      transaction.update(matchRef, { state: "DISPUTED", resolutionReason: "Contradictory scores" });
      return;
    }

    let confidence = 100;
    if (p1Payload.possibleManipulation || p2Payload.possibleManipulation) confidence -= 50;
    
    if (confidence >= 90) {
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
}

export async function finalizeVerifiedMatchAction(matchId: string) {
  // Should ideally be admin only
  const user = await getAuthUser();
  if (!user.admin) {
    throw new Error("Unauthorized");
  }

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

    if (winningOutcomeToSettle) {
      await settleMarket(transaction, matchId, winningOutcomeToSettle);
    }
  });
}
