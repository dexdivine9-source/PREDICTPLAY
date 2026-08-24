import { adminDb } from "./lib/firebase-admin";
import { submitMatchResultAction, refundMarketAction } from "./app/actions";

async function clearTest(matchId: string) {
   const preds = await adminDb.collection("predictions").where("marketId", "==", matchId).get();
   for (let doc of preds.docs) await doc.ref.delete();
   await adminDb.collection("markets").doc(matchId).delete();
   await adminDb.collection("matches").doc(matchId).delete();
}

async function setupScenario(scenarioName: string, predictions: {id: string, user: string, outcome: string, amount: number}[]) {
  const matchId = "test-" + scenarioName;
  await clearTest(matchId);
  
  await adminDb.collection("matches").doc(matchId).set({
    creatorId: "user1", player1Id: "user1", player2Id: "user2", state: "PLAYER_JOINED",
    p1Submitted: false, p2Submitted: false
  });

  let p1Pool = 0, p2Pool = 0, drawPool = 0, totalPool = 0;
  for(let p of predictions) {
    if(p.outcome === "p1") p1Pool += p.amount;
    if(p.outcome === "p2") p2Pool += p.amount;
    if(p.outcome === "draw") drawPool += p.amount;
    totalPool += p.amount;
    
    await adminDb.collection("virtual_wallets").doc(p.user).set({ balance: 0 }); // Init
    await adminDb.collection("predictions").doc(p.id).set({
      marketId, userId: p.user, outcome: p.outcome, amount: p.amount, status: "PENDING"
    });
  }

  await adminDb.collection("markets").doc(matchId).set({
    matchId, status: "OPEN", p1Pool, p2Pool, drawPool, totalPool
  });
  
  return { matchId, totalPool };
}

async function assertConservation(matchId: string, initialPool: number) {
  const preds = await adminDb.collection("predictions").where("marketId", "==", matchId).get();
  let totalPaidOut = 0;
  preds.docs.forEach(d => totalPaidOut += (d.data().payout || 0));
  
  if(totalPaidOut !== initialPool && initialPool > 0) {
     console.error(`❌ Accounting Invariant FAILED in ${matchId}. Initial: ${initialPool}, Paid out: ${totalPaidOut}`);
  } else {
     console.log(`✅ Accounting Invariant PASSED in ${matchId}. Total paid: ${totalPaidOut} (Expected: ${initialPool})`);
  }
}

async function runAdvancedTests() {
  console.log("=== STARTING ADVANCED SETTLEMENT TESTS ===");

  // 1. Normal Win (Rounding Test)
  // P1 = 300, P2 = 100. P1 Wins. 
  // Winner A (100) gets 100 + 33.33 -> 133
  // Winner B (100) gets 100 + 33.33 -> 133
  // Winner C (100) gets 100 + 33.33 -> 133
  // Total paid = 399. Remainder 1 -> Given to Winner A.
  const s1 = await setupScenario("rounding", [
    {id: "pA", user: "uA", outcome: "p1", amount: 100},
    {id: "pB", user: "uB", outcome: "p1", amount: 100},
    {id: "pC", user: "uC", outcome: "p1", amount: 100},
    {id: "pD", user: "uD", outcome: "p2", amount: 100}
  ]);
  await submitMatchResultAction(s1.matchId, "user1", 2, 1, true, "");
  await submitMatchResultAction(s1.matchId, "user2", 2, 1, false, "");
  await assertConservation(s1.matchId, s1.totalPool);

  // 2. No Winner 
  const s2 = await setupScenario("no-winner", [
    {id: "pE", user: "uE", outcome: "p2", amount: 100}
  ]);
  await submitMatchResultAction(s2.matchId, "user1", 2, 1, true, "");
  await submitMatchResultAction(s2.matchId, "user2", 2, 1, false, "");
  const m2 = await adminDb.collection("markets").doc(s2.matchId).get();
  console.log(`No-Winner Status: ${m2.data()!.status}`); // Should be SETTLED_NO_WINNER
  await assertConservation(s2.matchId, s2.totalPool);

  // 3. Cancellation Refund
  const s3 = await setupScenario("cancel", [
    {id: "pF", user: "uF", outcome: "p1", amount: 500}
  ]);
  await refundMarketAction(s3.matchId);
  const m3 = await adminDb.collection("markets").doc(s3.matchId).get();
  console.log(`Cancel Status: ${m3.data()!.status}`); // Should be CANCELLED
  await assertConservation(s3.matchId, s3.totalPool);

  // 4. Missing Wallet Safe Fail
  const s4 = await setupScenario("missing-wallet", [
    {id: "pG", user: "uG_missing", outcome: "p1", amount: 100} // Missing wallet doc
  ]);
  await adminDb.collection("virtual_wallets").doc("uG_missing").delete();
  try {
     await submitMatchResultAction(s4.matchId, "user1", 2, 1, true, "");
     await submitMatchResultAction(s4.matchId, "user2", 2, 1, false, "");
     console.error("❌ Missing wallet did NOT throw error!");
  } catch(e: any) {
     if(e.message.includes("Wallet not found")) console.log("✅ Missing wallet threw safe error: " + e.message);
     else console.error("❌ Wrong error for missing wallet: ", e);
  }

  // 5. Duplicate Settlement (Idempotency)
  console.log("Checking Idempotency...");
  await submitMatchResultAction(s1.matchId, "user1", 2, 1, true, ""); // Running S1 again
  await assertConservation(s1.matchId, s1.totalPool); // Should STILL exactly match

  console.log("=== TESTS COMPLETE ===");
}

runAdvancedTests().catch(console.error);
