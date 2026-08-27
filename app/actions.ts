"use server";

import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth-server";

export async function ensureUserAccountAction(): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getAuthUser();
    if (!user || !user.uid) {
      return { success: false, error: "Not authenticated" };
    }

    const userId = user.uid;
    const supabase = await createClient();
    const now = new Date().toISOString();

    // 1. Ensure player_profiles exists
    const { data: profile } = await supabase
      .from("player_profiles")
      .select("id, signup_bonus_granted")
      .eq("id", userId)
      .maybeSingle();

    if (!profile) {
      const emailPrefix = user.email ? user.email.split("@")[0].slice(0, 20) : `Player_${userId.slice(0, 5)}`;
      const displayName = user.user_metadata?.full_name || user.user_metadata?.name || emailPrefix;

      await supabase.from("player_profiles").insert({
        id: userId,
        user_id: userId,
        username: displayName.slice(0, 20),
        gamertag: displayName.slice(0, 20),
        game: "DLS",
        is_verified: false,
        reputation: 100,
        trust_score: 100,
        signup_bonus_granted: true,
        created_at: now,
        updated_at: now,
      });
    }

    // 2. Ensure virtual_wallets exists with 1000 PTS signup bonus
    const { data: wallet } = await supabase
      .from("virtual_wallets")
      .select("user_id, balance")
      .eq("user_id", userId)
      .maybeSingle();

    if (!wallet) {
      await supabase.from("virtual_wallets").insert({
        user_id: userId,
        balance: 1000,
        created_at: now,
        updated_at: now,
      });

      try {
        await supabase.from("transactions").insert({
          user_id: userId,
          amount: 1000,
          type: "SIGNUP_BONUS",
          reference_id: userId,
          created_at: now,
        });

        await supabase
          .from("player_profiles")
          .update({ signup_bonus_granted: true, updated_at: now })
          .eq("id", userId);
      } catch (logErr) {
        console.warn("SIGNUP_BONUS transaction log warning:", logErr);
      }
    }

    return { success: true };
  } catch (err: any) {
    console.error("ensureUserAccountAction error:", err);
    return { success: false, error: err?.message || "Failed to initialize account" };
  }
}

export async function createWalletAction() {
  return await ensureUserAccountAction();
}

export async function createMatchAction(data: {
  game?: string;
  stakeAmount: number;
}): Promise<{ success: boolean; matchId?: string; error?: string }> {
  try {
    const user = await getAuthUser();
    const userId = user.uid;
    const game = (data.game || "DLS").toUpperCase();
    const stakeAmount = Number(data.stakeAmount);

    if (isNaN(stakeAmount) || stakeAmount < 10) {
      return { success: false, error: "Minimum entry fee is 10 PTS." };
    }

    const supabase = await createClient();

    // Fetch player profile to check verification & admin status
    const { data: profile } = await supabase
      .from("player_profiles")
      .select("is_verified, role, is_admin")
      .eq("id", userId)
      .maybeSingle();

    const isAdmin = user.admin || profile?.role === "admin" || profile?.is_admin === true;

    // 1. Verification Requirement Check
    // ADMIN/DEV BYPASS — for testing purposes:
    // Admins are exempt from the profile verification requirement when creating matches.
    if (!isAdmin && (!profile || !profile.is_verified)) {
      return {
        success: false,
        error: "Profile verification required: You must complete profile verification before creating matches.",
      };
    }

    // 2. Open Match Rate Limit / Cap Check
    // Regular players are restricted to 1 active OPEN challenge at a time to prevent spam.
    // ADMIN/DEV BYPASS — for testing purposes:
    // Admins have unlimited match creation and can spin up multiple open challenges for testing.
    if (!isAdmin) {
      const { count, error: countError } = await supabase
        .from("matches")
        .select("*", { count: "exact", head: true })
        .eq("creator_id", userId)
        .eq("state", "OPEN");

      if (countError) {
        console.error("Error checking open matches count:", countError);
      } else if ((count ?? 0) >= 1) {
        return {
          success: false,
          error: "You already have an active open match challenge. Wait for an opponent to join or cancel it before creating another.",
        };
      }
    }

    // 3. Balance Check
    // ADMIN/DEV BYPASS — admins have unlimited points, balance checks and wallet deductions do not apply to admin accounts.
    if (!isAdmin) {
      const { data: wallet } = await supabase
        .from("virtual_wallets")
        .select("balance")
        .eq("user_id", userId)
        .maybeSingle();

      if (!wallet || (wallet.balance ?? 0) < stakeAmount) {
        return {
          success: false,
          error: "Insufficient virtual points for the entry fee.",
        };
      }
    }

    // Create match row
    const { data: match, error: matchError } = await supabase
      .from("matches")
      .insert({
        creator_id: userId,
        player1_id: userId,
        game,
        stake_amount: stakeAmount,
        state: "OPEN",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (matchError || !match) {
      console.error("Failed to create match:", matchError);
      return {
        success: false,
        error: matchError?.message || "Failed to create match in database. Ensure the matches table exists.",
      };
    }

    // Initialize prediction market for the match immediately
    try {
      await supabase.from("markets").upsert({
        id: match.id,
        match_id: match.id,
        total_pool: 0,
        p1_pool: 0,
        p2_pool: 0,
        draw_pool: 0,
        status: "OPEN",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    } catch (mErr) {
      console.warn("Market init note:", mErr);
    }

    return { success: true, matchId: match.id };
  } catch (err: any) {
    console.error("createMatchAction unexpected error:", err);
    return {
      success: false,
      error: err?.message || "An unexpected error occurred while creating the match.",
    };
  }
}

export async function createMarketAction(matchId: string) {
  const user = await getAuthUser();
  const supabase = await createClient();

  const { data: matchDoc } = await supabase
    .from("matches")
    .select("*")
    .eq("id", matchId)
    .maybeSingle();

  if (!matchDoc) throw new Error("Match not found");
  if (matchDoc.creator_id !== user.uid && matchDoc.player2_id !== user.uid) {
    throw new Error("Unauthorized");
  }

  await supabase.from("markets").upsert({
    id: matchId,
    match_id: matchId,
    total_pool: 0,
    p1_pool: 0,
    p2_pool: 0,
    draw_pool: 0,
    status: "OPEN",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
}

export async function placePredictionAction(
  matchId: string,
  outcome: "p1" | "p2" | "draw" | "yes" | "no",
  amount: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getAuthUser();
    const userId = user.uid;

    if (!matchId || !outcome || amount <= 0) {
      return { success: false, error: "Invalid prediction data" };
    }

    const supabase = await createClient();

    const { data: profile } = await supabase
      .from("player_profiles")
      .select("is_verified, role, is_admin")
      .eq("id", userId)
      .maybeSingle();

    const isAdmin = user.admin || profile?.role === "admin" || profile?.is_admin === true;

    // 1. Verification Gate
    // ADMIN/DEV BYPASS — for testing purposes:
    // Admins are exempt from the profile verification requirement when placing predictions.
    if (!isAdmin && (!profile || !profile.is_verified)) {
      return {
        success: false,
        error: "Profile verification required: You must complete profile verification before placing predictions.",
      };
    }

    // 2. Participant Self-Betting Restriction Gate
    // Normal players cannot bet on their own matches to prevent conflict of interest / manipulation.
    // ADMIN/DEV BYPASS — for testing purposes:
    // Admins can place predictions on any match for testing market dynamics, even if they are Player 1 or Player 2.
    if (!isAdmin) {
      const { data: matchDoc } = await supabase
        .from("matches")
        .select("creator_id, player1_id, player2_id, is_admin_match")
        .eq("id", matchId)
        .maybeSingle();

      if (matchDoc && !matchDoc.is_admin_match) {
        if (
          matchDoc.creator_id === userId ||
          matchDoc.player1_id === userId ||
          matchDoc.player2_id === userId
        ) {
          return {
            success: false,
            error: "Conflict of interest: Match participants cannot place predictions on their own matches.",
          };
        }
      }
    }

    // 3. Balance Check
    // ADMIN/DEV BYPASS — admins have unlimited points, balance checks and wallet deductions do not apply to admin accounts.
    let nonAdminWallet: any = null;
    if (!isAdmin) {
      const { data: wallet } = await supabase
        .from("virtual_wallets")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (!wallet || (wallet.balance ?? 0) < amount) {
        return { success: false, error: "Insufficient virtual points." };
      }
      nonAdminWallet = wallet;
    }

    const { data: market } = await supabase
      .from("markets")
      .select("*")
      .eq("id", matchId)
      .maybeSingle();

    if (!market || market.status !== "OPEN") {
      return { success: false, error: "Market is not open." };
    }

    const isYesNo = market.market_type === "YES_NO";
    if (isYesNo && outcome !== "yes" && outcome !== "no") {
      return { success: false, error: "This curated market only accepts 'yes' or 'no' predictions." };
    }
    if (!isYesNo && outcome !== "p1" && outcome !== "p2" && outcome !== "draw") {
      return { success: false, error: "This match market accepts 'p1', 'p2', or 'draw' predictions." };
    }

    // Deduct from wallet for non-admin accounts
    // ADMIN/DEV BYPASS — admins have unlimited points, balance checks and wallet deductions do not apply to admin accounts.
    if (!isAdmin && nonAdminWallet) {
      const newBalance = nonAdminWallet.balance - amount;
      await supabase
        .from("virtual_wallets")
        .update({ balance: newBalance, updated_at: new Date().toISOString() })
        .eq("user_id", userId);
    }

    // Update market pools based on market type
    const poolUpdates: any = {
      total_pool: (market.total_pool || 0) + amount,
      updated_at: new Date().toISOString(),
    };

    if (isYesNo) {
      if (outcome === "yes") poolUpdates.yes_pool = (market.yes_pool || 0) + amount;
      if (outcome === "no") poolUpdates.no_pool = (market.no_pool || 0) + amount;
    } else {
      if (outcome === "p1") poolUpdates.p1_pool = (market.p1_pool || 0) + amount;
      if (outcome === "p2") poolUpdates.p2_pool = (market.p2_pool || 0) + amount;
      if (outcome === "draw") poolUpdates.draw_pool = (market.draw_pool || 0) + amount;
    }

    await supabase.from("markets").update(poolUpdates).eq("id", matchId);

    // Record Transaction
    await supabase.from("transactions").insert({
      user_id: userId,
      amount: -amount,
      type: "PREDICTION_PLACED",
      reference_id: matchId,
      created_at: new Date().toISOString(),
    });

    // Record Prediction
    await supabase.from("predictions").insert({
      market_id: matchId,
      user_id: userId,
      outcome,
      amount,
      status: "PENDING",
      created_at: new Date().toISOString(),
    });

    return { success: true };
  } catch (err: any) {
    console.error("placePredictionAction unexpected error:", err);
    return {
      success: false,
      error: err?.message || "An unexpected error occurred while placing your prediction.",
    };
  }
}

export async function submitMatchResultAction(
  matchId: string,
  reportedScore1: number,
  reportedScore2: number,
  evidenceUrl: string
) {
  const user = await getAuthUser();
  const userId = user.uid;

  const supabase = await createClient();
  const { data: matchData } = await supabase
    .from("matches")
    .select("*")
    .eq("id", matchId)
    .maybeSingle();

  if (!matchData) throw new Error("Match not found");

  if (matchData.state === "COMPLETED" || matchData.state === "MANUAL_REVIEW") {
    throw new Error("Match is already resolved or in manual review.");
  }

  if (matchData.player1_id !== userId && matchData.player2_id !== userId) {
    throw new Error("Unauthorized: You are not a participant.");
  }

  const isCreator = matchData.player1_id === userId;
  const updateData: any = { updated_at: new Date().toISOString() };

  if (isCreator) {
    updateData.p1_score1 = reportedScore1;
    updateData.p1_score2 = reportedScore2;
    updateData.p1_evidence = evidenceUrl;
    updateData.p1_submitted = true;
  } else {
    updateData.p2_score1 = reportedScore1;
    updateData.p2_score2 = reportedScore2;
    updateData.p2_evidence = evidenceUrl;
    updateData.p2_submitted = true;
  }

  const isP1NowSubmitted = isCreator ? true : matchData.p1_submitted;
  const isP2NowSubmitted = !isCreator ? true : matchData.p2_submitted;

  let resolveState = null;

  if (isP1NowSubmitted && isP2NowSubmitted) {
    const p1Final1 = isCreator ? reportedScore1 : matchData.p1_score1;
    const p1Final2 = isCreator ? reportedScore2 : matchData.p1_score2;

    const p2Final1 = !isCreator ? reportedScore1 : matchData.p2_score1;
    const p2Final2 = !isCreator ? reportedScore2 : matchData.p2_score2;

    if (p1Final1 === p2Final1 && p1Final2 === p2Final2) {
      updateData.state = "MANUAL_REVIEW";
      updateData.reported_score1 = p1Final1;
      updateData.reported_score2 = p1Final2;
      resolveState = "MANUAL_REVIEW";
    } else {
      updateData.state = "DISPUTED";
      resolveState = "DISPUTED";
    }
  }

  await supabase.from("matches").update(updateData).eq("id", matchId);

  if (resolveState === "DISPUTED" || resolveState === "MANUAL_REVIEW") {
    await supabase.from("markets").update({ status: "LOCKED" }).eq("id", matchId);
  }
}

export async function settleMarket(matchId: string, winningOutcome: string) {
  const supabase = await createClient();

  const { data: marketData } = await supabase
    .from("markets")
    .select("*")
    .eq("id", matchId)
    .maybeSingle();

  if (!marketData || marketData.status === "SETTLED") return;

  const isYesNo = marketData.market_type === "YES_NO";
  const normalizedOutcome = winningOutcome.toLowerCase();

  let winningPool = 0;
  if (isYesNo) {
    winningPool = normalizedOutcome === "yes" ? (marketData.yes_pool || 0) : (marketData.no_pool || 0);
  } else {
    winningPool =
      winningOutcome === "p1"
        ? (marketData.p1_pool || 0)
        : winningOutcome === "p2"
        ? (marketData.p2_pool || 0)
        : (marketData.draw_pool || 0);
  }

  const nonWinningPool = (marketData.total_pool || 0) - winningPool;

  const { data: predictions } = await supabase
    .from("predictions")
    .select("*")
    .eq("market_id", matchId);

  if (predictions) {
    for (const pred of predictions) {
      const isWinner = isYesNo
        ? pred.outcome.toLowerCase() === normalizedOutcome
        : pred.outcome === winningOutcome;

      if (isWinner) {
        let payout = pred.amount;
        if (winningPool > 0) {
          const share = pred.amount / winningPool;
          payout += Math.floor(share * nonWinningPool);
        }

        await supabase
          .from("predictions")
          .update({
            status: "WON",
            payout,
            settled_at: new Date().toISOString(),
          })
          .eq("id", pred.id);

        // Update user wallet
        const { data: wallet } = await supabase
          .from("virtual_wallets")
          .select("balance")
          .eq("user_id", pred.user_id)
          .maybeSingle();

        if (wallet) {
          await supabase
            .from("virtual_wallets")
            .update({
              balance: (wallet.balance || 0) + payout,
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", pred.user_id);
        }

        await supabase.from("transactions").insert({
          user_id: pred.user_id,
          amount: payout,
          type: "PREDICTION_WON",
          reference_id: matchId,
          created_at: new Date().toISOString(),
        });
      } else {
        await supabase
          .from("predictions")
          .update({
            status: "LOST",
            payout: 0,
            settled_at: new Date().toISOString(),
          })
          .eq("id", pred.id);
      }
    }
  }

  await supabase
    .from("markets")
    .update({
      status: "SETTLED",
      winning_outcome: winningOutcome,
      winning_pool: winningPool,
      total_pool: marketData.total_pool,
      settled_at: new Date().toISOString(),
    })
    .eq("id", matchId);
}

