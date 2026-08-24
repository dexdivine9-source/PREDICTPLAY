import { adminDb } from "./lib/firebase-admin";
import { submitMatchResultAction } from "./app/actions";

async function runTests() {
  console.log("Starting tests...");
  
  // 1. Setup mock match
  const matchId = "test-match-" + Date.now();
  
  await adminDb.collection("matches").doc(matchId).set({
    creatorId: "user1",
    player1Id: "user1",
    player2Id: "user2",
    state: "PLAYER_JOINED",
    p1Submitted: false,
    p2Submitted: false
  });

  // 2. Setup profiles
  await adminDb.collection("player_profiles").doc("user1").set({ reputation: 100 });
  await adminDb.collection("player_profiles").doc("user2").set({ reputation: 100 });
  
  // 3. Setup market & predictions
  await adminDb.collection("markets").doc(matchId).set({
    matchId,
    status: "OPEN",
    p1Pool: 200,
    p2Pool: 100,
    drawPool: 0,
    totalPool: 300
  });

  await adminDb.collection("predictions").doc("pred1").set({
    marketId: matchId,
    userId: "predUser1",
    outcome: "p1",
    amount: 200,
    status: "PENDING"
  });

  await adminDb.collection("predictions").doc("pred2").set({
    marketId: matchId,
    userId: "predUser2",
    outcome: "p2",
    amount: 100,
    status: "PENDING"
  });

  await adminDb.collection("virtual_wallets").doc("predUser1").set({ balance: 0 });
  await adminDb.collection("virtual_wallets").doc("predUser2").set({ balance: 0 });

  // 4. Submit matching results
  await submitMatchResultAction(matchId, "user1", 3, 1, true, "");
  await submitMatchResultAction(matchId, "user2", 3, 1, false, "");

  // 5. Verify outcomes
  const market = await adminDb.collection("markets").doc(matchId).get();
  console.log("Market Status:", market.data().status);
  console.log("Winning Outcome:", market.data().winningOutcome);

  const pred1 = await adminDb.collection("predictions").doc("pred1").get();
  console.log("Pred1 Status (should be WON):", pred1.data().status);
  console.log("Pred1 Payout (should be 300):", pred1.data().payout);

  const pred2 = await adminDb.collection("predictions").doc("pred2").get();
  console.log("Pred2 Status (should be LOST):", pred2.data().status);
  console.log("Pred2 Payout (should be 0):", pred2.data().payout);

  const wallet1 = await adminDb.collection("virtual_wallets").doc("predUser1").get();
  console.log("Wallet1 Balance (should be 300):", wallet1.data().balance);

  console.log("Done testing.");
}

runTests().catch(console.error);
