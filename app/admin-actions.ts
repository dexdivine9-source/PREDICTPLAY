"use server";

import { createClient } from "@/lib/supabase/server";
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

  const supabase = await createClient();

  const { data: matchData } = await supabase
    .from("matches")
    .select("*")
    .eq("id", matchId)
    .maybeSingle();

  if (!matchData) throw new Error("Match not found");

  if (matchData.state === "COMPLETED" || matchData.state === "CANCELLED") {
    throw new Error("Match is already finalized");
  }

  const previousState = matchData.state;
  const newState = resolutionOutcome === "CANCELLED" ? "CANCELLED" : "COMPLETED";

  await supabase.from("admin_actions").insert({
    admin_id: adminId,
    match_id: matchId,
    action: "MANUAL_RESOLUTION",
    previous_state: previousState,
    new_state: newState,
    resolution_outcome: resolutionOutcome,
    reason,
    created_at: new Date().toISOString(),
  });

  await supabase
    .from("matches")
    .update({
      state: newState,
      verified_outcome: resolutionOutcome !== "CANCELLED" ? resolutionOutcome : null,
      resolution_reason: `Admin resolved: ${reason}`,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", matchId);

  if (newState === "COMPLETED" && resolutionOutcome !== "CANCELLED") {
    await settleMarket(matchId, resolutionOutcome);
  } else if (newState === "CANCELLED") {
    await refundMarket(matchId);
  }
}

async function refundMarket(matchId: string) {
  const supabase = await createClient();

  const { data: marketData } = await supabase
    .from("markets")
    .select("*")
    .eq("id", matchId)
    .maybeSingle();

  if (!marketData || marketData.status === "REFUNDED" || marketData.status === "SETTLED") {
    return;
  }

  const { data: predictions } = await supabase
    .from("predictions")
    .select("*")
    .eq("market_id", matchId);

  if (predictions) {
    for (const pred of predictions) {
      await supabase
        .from("predictions")
        .update({
          status: "REFUNDED",
          payout: pred.amount,
          settled_at: new Date().toISOString(),
        })
        .eq("id", pred.id);

      // Refund to wallet
      const { data: wallet } = await supabase
        .from("virtual_wallets")
        .select("balance")
        .eq("user_id", pred.user_id)
        .maybeSingle();

      if (wallet) {
        await supabase
          .from("virtual_wallets")
          .update({
            balance: (wallet.balance || 0) + pred.amount,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", pred.user_id);
      }

      await supabase.from("transactions").insert({
        user_id: pred.user_id,
        amount: pred.amount,
        type: "PREDICTION_REFUNDED",
        reference_id: matchId,
        created_at: new Date().toISOString(),
      });
    }
  }

  await supabase
    .from("markets")
    .update({
      status: "REFUNDED",
      settled_at: new Date().toISOString(),
    })
    .eq("id", matchId);
}
