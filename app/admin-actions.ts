"use server";

import { adminDb } from "@/lib/firebase-admin";
import * as FirebaseFirestore from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";
import { settleMarket } from "./actions";
import { getAuthUser } from "@/lib/auth-server";

export async function adminResolveMatchAction(
  matchId: string,
  resolutionOutcome: "p1" | "p2" | "draw" | "CANCELLED",
  reason: string
) {
  const user = await getAuthUser();
  const adminId = user.uid;
  
  if (!user.admin) {
    throw new Error("Unauthorized: Admin claims required");
  }

  if (!matchId || !resolutionOutcome || !reason) {
    throw new Error("Missing required parameters for admin resolution");
  }

  await adminDb.runTransaction(async (transaction) => {
    const matchRef = adminDb.collection("matches").doc(matchId);
    const matchDoc = await transaction.get(matchRef);
    if (!matchDoc.exists) throw new Error("Match not found");
    const data = matchDoc.data()!;

    if (data.state === "COMPLETED" || data.state === "CANCELLED") {
      throw new Error("Match is already finalized");
    }

    const previousState = data.state;
    const newState = resolutionOutcome === "CANCELLED" ? "CANCELLED" : "COMPLETED";

    const actionRef = adminDb.collection("admin_actions").doc();
    transaction.set(actionRef, {
      actionId: actionRef.id,
      adminId,
      matchId,
      action: "MANUAL_RESOLUTION",
      previousState,
      newState,
      resolutionOutcome,
      reason,
      createdAt: FieldValue.serverTimestamp()
    });

    transaction.update(matchRef, {
      state: newState,
      verifiedOutcome: resolutionOutcome !== "CANCELLED" ? resolutionOutcome : null,
      resolutionReason: `Admin resolved: ${reason}`,
      resolvedAt: FieldValue.serverTimestamp()
    });

    if (newState === "COMPLETED" && resolutionOutcome !== "CANCELLED") {
      await settleMarket(transaction, matchId, resolutionOutcome);
    } else if (newState === "CANCELLED") {
      await refundMarket(transaction, matchId);
    }
  });
}

async function refundMarket(transaction: FirebaseFirestore.Transaction, matchId: string) {
  const marketRef = adminDb.collection("markets").doc(matchId);
  const marketDoc = await transaction.get(marketRef);
  
  if (!marketDoc.exists) return;
  const marketData = marketDoc.data()!;
  
  if (marketData.status === "REFUNDED" || marketData.status === "SETTLED") return;

  const predictionsSnapshot = await adminDb.collection("predictions").where("marketId", "==", matchId).get();
  const settlementId = adminDb.collection("settlements").doc().id;

  for (const predDoc of predictionsSnapshot.docs) {
    const predData = predDoc.data();
    const predRef = predDoc.ref;

    transaction.update(predRef, {
      status: "REFUNDED",
      payout: predData.amount,
      settledAt: FieldValue.serverTimestamp(),
      settlementId
    });

    const walletRef = adminDb.collection("virtual_wallets").doc(predData.userId);
    transaction.update(walletRef, { balance: FieldValue.increment(predData.amount) });

    const txRef = adminDb.collection("transactions").doc();
    transaction.set(txRef, {
      userId: predData.userId,
      amount: predData.amount,
      type: "PREDICTION_REFUNDED",
      referenceId: matchId,
      settlementId,
      createdAt: FieldValue.serverTimestamp()
    });
  }

  transaction.update(marketRef, {
    status: "REFUNDED",
    settlementId,
    settledAt: FieldValue.serverTimestamp()
  });
}
