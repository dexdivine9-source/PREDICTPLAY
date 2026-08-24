"use server";

import { adminDb } from "@/lib/firebase-admin";
import * as FirebaseFirestore from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";
import { getAuthUser } from "@/lib/auth-server";

export async function createWalletAction() {
  const user = await getAuthUser();
  const userId = user.uid;

  const walletRef = adminDb.collection("virtual_wallets").doc(userId);
  await walletRef.set({
    userId,
    balance: 1000,
    createdAt: FieldValue.serverTimestamp(),
  });
}

export async function createMarketAction(matchId: string) {
  const user = await getAuthUser();
  // Any authenticated user can create a market for their match if it doesn't exist.
  // We should verify they are a participant.
  const matchRef = adminDb.collection("matches").doc(matchId);
  const matchDoc = await matchRef.get();
  if (!matchDoc.exists) throw new Error("Match not found");
  if (matchDoc.data()!.creatorId !== user.uid && matchDoc.data()!.player2Id !== user.uid) {
    throw new Error("Unauthorized");
  }

  const marketRef = adminDb.collection("markets").doc(matchId);
  await marketRef.set({
    matchId,
    totalPool: 0,
    p1Pool: 0,
    p2Pool: 0,
    drawPool: 0,
    status: "OPEN",
    createdAt: FieldValue.serverTimestamp(),
  });
}

export async function placePredictionAction(matchId: string, outcome: "p1" | "p2" | "draw", amount: number) {
  const user = await getAuthUser();
  const userId = user.uid;

  if (!matchId || !outcome || amount <= 0) {
    throw new Error("Invalid prediction data");
  }

  await adminDb.runTransaction(async (transaction: FirebaseFirestore.Transaction) => {
    const walletRef = adminDb.collection("virtual_wallets").doc(userId);
    const marketRef = adminDb.collection("markets").doc(matchId);
    
    const [walletSnap, marketSnap] = await Promise.all([
      transaction.get(walletRef),
      transaction.get(marketRef)
    ]);

    if (!walletSnap.exists || walletSnap.data()!.balance < amount) {
      throw new Error("Insufficient virtual points.");
    }

    if (!marketSnap.exists || marketSnap.data()!.status !== "OPEN") {
      throw new Error("Market is not open.");
    }

    const currentBalance = walletSnap.data()!.balance;
    const marketData = marketSnap.data()!;

    // Update Wallet
    transaction.update(walletRef, {
      balance: currentBalance - amount
    });

    // Update Market Pools
    const poolUpdates: any = { totalPool: marketData.totalPool + amount };
    if (outcome === "p1") poolUpdates.p1Pool = marketData.p1Pool + amount;
    if (outcome === "p2") poolUpdates.p2Pool = marketData.p2Pool + amount;
    if (outcome === "draw") poolUpdates.drawPool = marketData.drawPool + amount;
    
    transaction.update(marketRef, poolUpdates);

    // Record Transaction
    const txRef = adminDb.collection("transactions").doc();
    transaction.set(txRef, {
      userId,
      amount: -amount,
      type: "PREDICTION_PLACED",
      referenceId: matchId,
      createdAt: FieldValue.serverTimestamp()
    });

    // Record Prediction
    const predRef = adminDb.collection("predictions").doc();
    transaction.set(predRef, {
      marketId: matchId,
      userId,
      outcome,
      amount,
      status: "PENDING",
      createdAt: FieldValue.serverTimestamp()
    });
  });
}

export async function submitMatchResultAction(matchId: string, reportedScore1: number, reportedScore2: number, evidenceUrl: string) {
  const user = await getAuthUser();
  const userId = user.uid;

  await adminDb.runTransaction(async (transaction: FirebaseFirestore.Transaction) => {
    const matchRef = adminDb.collection("matches").doc(matchId);
    const matchDoc = await transaction.get(matchRef);
    if (!matchDoc.exists) throw new Error("Match not found");
    
    const data = matchDoc.data()!;
    
    if (data.state === "COMPLETED" || data.state === "MANUAL_REVIEW") {
      throw new Error("Match is already resolved or in manual review.");
    }

    // Determine role based on actual match data
    if (data.player1Id !== userId && data.player2Id !== userId) {
      throw new Error("Unauthorized: You are not a participant.");
    }
    const isCreator = data.player1Id === userId;
    
    const updateData: any = {};
    
    if (isCreator) {
      updateData.p1Score1 = reportedScore1;
      updateData.p1Score2 = reportedScore2;
      updateData.p1Evidence = evidenceUrl;
      updateData.p1Submitted = true;
    } else {
      updateData.p2Score1 = reportedScore1;
      updateData.p2Score2 = reportedScore2;
      updateData.p2Evidence = evidenceUrl;
      updateData.p2Submitted = true;
    }

    const isP1NowSubmitted = isCreator ? true : data.p1Submitted;
    const isP2NowSubmitted = !isCreator ? true : data.p2Submitted;

    let resolveState = null;
    let winningOutcome = null;

    if (isP1NowSubmitted && isP2NowSubmitted) {
      const p1Final1 = isCreator ? reportedScore1 : data.p1Score1;
      const p1Final2 = isCreator ? reportedScore2 : data.p1Score2;
      
      const p2Final1 = !isCreator ? reportedScore1 : data.p2Score1;
      const p2Final2 = !isCreator ? reportedScore2 : data.p2Score2;

      if (p1Final1 === p2Final1 && p1Final2 === p2Final2) {
        updateData.state = "COMPLETED";
        updateData.finalScore1 = p1Final1;
        updateData.finalScore2 = p1Final2;
        resolveState = "COMPLETED";
        
        if (p1Final1 > p1Final2) winningOutcome = "p1";
        else if (p1Final2 > p1Final1) winningOutcome = "p2";
        else winningOutcome = "draw";

        // Update Reputation
        const p1ProfileRef = adminDb.collection("player_profiles").doc(data.player1Id);
        const p2ProfileRef = adminDb.collection("player_profiles").doc(data.player2Id);
        
        const [p1Snap, p2Snap] = await Promise.all([
          transaction.get(p1ProfileRef),
          transaction.get(p2ProfileRef)
        ]);

        if (p1Snap.exists && p2Snap.exists) {
           let p1RepChange = 0;
           let p2RepChange = 0;
           if (winningOutcome === "p1") {
             p1RepChange = 25; p2RepChange = -20;
           } else if (winningOutcome === "p2") {
             p1RepChange = -20; p2RepChange = 25;
           } else {
             p1RepChange = 5; p2RepChange = 5;
           }
           transaction.update(p1ProfileRef, { reputation: (p1Snap.data()!.reputation || 100) + p1RepChange });
           transaction.update(p2ProfileRef, { reputation: (p2Snap.data()!.reputation || 100) + p2RepChange });
        }

      } else {
        updateData.state = "DISPUTED";
        resolveState = "DISPUTED";
      }
    }
    
    transaction.update(matchRef, updateData);

    if (resolveState === "COMPLETED" && winningOutcome) {
      await settleMarket(transaction, matchId, winningOutcome);
    } else if (resolveState === "DISPUTED") {
      const marketRef = adminDb.collection("markets").doc(matchId);
      const marketDoc = await transaction.get(marketRef);
      if (marketDoc.exists) {
        transaction.update(marketRef, { status: "LOCKED" });
      }
    }
  });
}

export async function settleMarket(transaction: FirebaseFirestore.Transaction, matchId: string, winningOutcome: string) {
  const marketRef = adminDb.collection("markets").doc(matchId);
  const marketDoc = await transaction.get(marketRef);
  
  if (!marketDoc.exists) return;
  const marketData = marketDoc.data()!;
  
  if (marketData.status === "SETTLED") return; // Idempotent check

  const winningPool = winningOutcome === "p1" ? marketData.p1Pool : (winningOutcome === "p2" ? marketData.p2Pool : marketData.drawPool);
  const nonWinningPool = marketData.totalPool - winningPool;

  const predictionsSnapshot = await adminDb.collection("predictions").where("marketId", "==", matchId).get();
  
  const settlementId = adminDb.collection("settlements").doc().id;

  for (const predDoc of predictionsSnapshot.docs) {
    const predData = predDoc.data();
    const predRef = predDoc.ref;

    if (predData.outcome === winningOutcome) {
      let payout = predData.amount;
      if (winningPool > 0) {
        const share = predData.amount / winningPool;
        payout += Math.floor(share * nonWinningPool);
      }

      transaction.update(predRef, {
        status: "WON",
        payout,
        settledAt: FieldValue.serverTimestamp(),
        settlementId
      });

      const walletRef = adminDb.collection("virtual_wallets").doc(predData.userId);
      transaction.update(walletRef, { balance: FieldValue.increment(payout) });

      const txRef = adminDb.collection("transactions").doc();
      transaction.set(txRef, {
        userId: predData.userId,
        amount: payout,
        type: "PREDICTION_WON",
        referenceId: matchId,
        settlementId,
        createdAt: FieldValue.serverTimestamp()
      });

    } else {
      transaction.update(predRef, {
        status: "LOST",
        payout: 0,
        settledAt: FieldValue.serverTimestamp(),
        settlementId
      });
    }
  }

  transaction.update(marketRef, {
    status: "SETTLED",
    winningOutcome,
    winningPool,
    totalPool: marketData.totalPool,
    settlementId,
    settledAt: FieldValue.serverTimestamp()
  });
}
