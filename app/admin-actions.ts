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

export async function checkIsAdminAction() {
  try {
    const user = await getAuthUser();
    return { isAdmin: Boolean(user.admin), userId: user.uid, email: user.email };
  } catch {
    return { isAdmin: false, userId: null, email: null };
  }
}

export async function getPendingVerificationsAction(
  filter: "PENDING" | "VERIFIED" | "REJECTED" | "ALL" = "PENDING"
) {
  const user = await getAuthUser();
  if (!user.admin) {
    throw new Error("Unauthorized: Admin claims required");
  }

  const supabase = await createClient();

  let query = supabase
    .from("player_profiles")
    .select("*")
    .order("updated_at", { ascending: false });

  if (filter === "PENDING") {
    // Return profiles that have submitted fields and are not yet verified
    query = query
      .not("game_profile_screenshot_url", "is", null)
      .eq("is_verified", false)
      .neq("verification_status", "REJECTED");
  } else if (filter === "VERIFIED") {
    query = query.eq("is_verified", true);
  } else if (filter === "REJECTED") {
    query = query.eq("verification_status", "REJECTED");
  } else {
    // ALL: return all profiles that have some verification data
    query = query.not("game_profile_screenshot_url", "is", null);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching verifications:", error);
    throw new Error(error.message);
  }

  return (data || []).map((row: any) => ({
    id: row.id || row.user_id,
    userId: row.user_id || row.id,
    username: row.username || row.gamertag || "Unknown",
    gameUsername: row.game_username || row.gamertag || "",
    trackerId: row.tracker_id || "",
    team: row.team || row.tracker_team_name || "",
    gameProfileScreenshotUrl: row.game_profile_screenshot_url || "",
    isVerified: Boolean(row.is_verified),
    verificationStatus: row.verification_status || (row.is_verified ? "VERIFIED" : "PENDING"),
    rejectionReason: row.rejection_reason || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function adminApproveVerificationAction(targetUserId: string) {
  const user = await getAuthUser();
  if (!user.admin) {
    throw new Error("Unauthorized: Admin claims required");
  }

  if (!targetUserId) {
    throw new Error("Target user ID is required");
  }

  const supabase = await createClient();
  const now = new Date().toISOString();

  // 1. Update player_profiles
  const { error: profileError } = await supabase
    .from("player_profiles")
    .update({
      is_verified: true,
      verification_status: "VERIFIED",
      rejection_reason: null,
      last_verified_at: now,
      updated_at: now,
    })
    .eq("id", targetUserId);

  if (profileError) {
    console.error("Error approving verification in player_profiles:", profileError);
    throw new Error(profileError.message);
  }

  // VERIFICATION_BONUS: +1500 points, awarded once when is_verified first flips
  // to true. Guard via verification_bonus_granted so re-approving never
  // double-credits. Non-fatal — a wallet error must not block admin approval.
  try {
    const { data: profileRow } = await supabase
      .from("player_profiles")
      .select("verification_bonus_granted")
      .eq("id", targetUserId)
      .maybeSingle();

    if (!profileRow?.verification_bonus_granted) {
      const { data: wallet } = await supabase
        .from("virtual_wallets")
        .select("balance")
        .eq("user_id", targetUserId)
        .maybeSingle();

      if (wallet) {
        await supabase
          .from("virtual_wallets")
          .update({
            balance: (wallet.balance || 0) + 1500,
            updated_at: now,
          })
          .eq("user_id", targetUserId);
      }

      await supabase.from("transactions").insert({
        user_id: targetUserId,
        amount: 1500,
        type: "VERIFICATION_BONUS",
        reference_id: targetUserId,
        created_at: now,
      });

      await supabase
        .from("player_profiles")
        .update({ verification_bonus_granted: true, updated_at: now })
        .eq("id", targetUserId);
    }
  } catch (err) {
    console.error("VERIFICATION_BONUS credit failed (non-fatal):", err);
  }

  // 2. Also update player_verification if it exists
  try {
    await supabase
      .from("player_verification")
      .update({
        is_verified: true,
        updated_at: now,
      })
      .eq("user_id", targetUserId);
  } catch (err) {
    console.warn("player_verification sync note:", err);
  }

  // 3. Record in admin_actions
  try {
    await supabase.from("admin_actions").insert({
      admin_id: user.uid,
      action: "VERIFICATION_APPROVED",
      reason: `Admin approved verification for player ${targetUserId}`,
      created_at: now,
    });
  } catch {
    // Ignore if admin_actions has non-nullable match_id
  }

  return { success: true };
}

export async function adminRejectVerificationAction(
  targetUserId: string,
  reason?: string
) {
  const user = await getAuthUser();
  if (!user.admin) {
    throw new Error("Unauthorized: Admin claims required");
  }

  if (!targetUserId) {
    throw new Error("Target user ID is required");
  }

  const supabase = await createClient();
  const now = new Date().toISOString();
  const rejectionReason = (reason || "").trim() || "Verification rejected by administrator";

  // 1. Update player_profiles
  const { error: profileError } = await supabase
    .from("player_profiles")
    .update({
      is_verified: false,
      verification_status: "REJECTED",
      rejection_reason: rejectionReason,
      updated_at: now,
    })
    .eq("id", targetUserId);

  if (profileError) {
    console.error("Error rejecting verification in player_profiles:", profileError);
    throw new Error(profileError.message);
  }

  // 2. Also update player_verification if it exists
  try {
    await supabase
      .from("player_verification")
      .update({
        is_verified: false,
        updated_at: now,
      })
      .eq("user_id", targetUserId);
  } catch (err) {
    console.warn("player_verification sync note:", err);
  }

  return { success: true };
}

export async function getUsersListAction(
  searchQuery?: string,
  roleFilter?: "all" | "admin" | "player"
) {
  const user = await getAuthUser();
  if (!user.admin) {
    throw new Error("Unauthorized: Admin role required");
  }

  const supabase = await createClient();

  let query = supabase
    .from("player_profiles")
    .select("id, user_id, username, gamertag, role, is_admin, is_verified, verification_status, created_at, updated_at")
    .order("created_at", { ascending: false });

  if (roleFilter === "admin") {
    query = query.or("role.eq.admin,is_admin.eq.true");
  } else if (roleFilter === "player") {
    query = query.or("role.eq.player,role.is.null").neq("is_admin", true);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching user list:", error);
    throw new Error(error.message);
  }

  const list = (data || []).map((row: any) => {
    const isRowAdmin = row.role === "admin" || row.is_admin === true;
    return {
      id: row.id || row.user_id,
      userId: row.user_id || row.id,
      username: row.username || row.gamertag || "Anonymous Player",
      gamertag: row.gamertag || row.username || "",
      role: (isRowAdmin ? "admin" : "player") as "admin" | "player",
      isVerified: Boolean(row.is_verified),
      verificationStatus: row.verification_status || (row.is_verified ? "VERIFIED" : "UNVERIFIED"),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  });

  if (!searchQuery || !searchQuery.trim()) {
    return list;
  }

  const q = searchQuery.toLowerCase().trim();
  return list.filter(
    (u) =>
      u.username.toLowerCase().includes(q) ||
      u.gamertag.toLowerCase().includes(q) ||
      u.userId.toLowerCase().includes(q)
  );
}

export async function updateUserRoleAction(
  targetUserId: string,
  newRole: "admin" | "player"
) {
  const user = await getAuthUser();
  if (!user.admin) {
    throw new Error("Unauthorized: Admin role required");
  }

  if (!targetUserId) {
    throw new Error("Target user ID is required");
  }

  if (newRole !== "admin" && newRole !== "player") {
    throw new Error("Invalid role specified. Role must be 'admin' or 'player'.");
  }

  const supabase = await createClient();
  const now = new Date().toISOString();

  // Update role on player_profiles
  const { error: updateError } = await supabase
    .from("player_profiles")
    .update({
      role: newRole,
      is_admin: newRole === "admin",
      updated_at: now,
    })
    .eq("id", targetUserId);

  if (updateError) {
    console.error("Error updating user role in player_profiles:", updateError);
    throw new Error(updateError.message);
  }

  // Record audit log in admin_actions
  try {
    await supabase.from("admin_actions").insert({
      admin_id: user.uid,
      action: newRole === "admin" ? "ROLE_PROMOTED_ADMIN" : "ROLE_DEMOTED_PLAYER",
      reason: `Admin ${user.uid} updated role of user ${targetUserId} to ${newRole}`,
      created_at: now,
    });
  } catch {
    // Ignore non-fatal log insert
  }

  return { success: true, targetUserId, newRole };
}

function generateMatchCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function createAdminMatchAction(data: {
  player1Id?: string;
  player2Id?: string;
  game?: string;
  scheduledStartTime?: string;
  question?: string;
}): Promise<{ success: boolean; matchId?: string; matchCode?: string; error?: string }> {
  try {
    const user = await getAuthUser();
    if (!user.admin) {
      return { success: false, error: "Unauthorized: Admin role required." };
    }

    const { player1Id, player2Id, scheduledStartTime } = data;
    const game = (data.game || "DLS").toUpperCase();

    // Mode A: Both players provided directly
    const isModeA = Boolean(player1Id && player2Id);

    if (isModeA && player1Id === player2Id) {
      return { success: false, error: "Player 1 and Player 2 must be different players." };
    }

    const supabase = await createClient();
    const now = new Date().toISOString();

    let p1Id: string | null = player1Id || null;
    let p2Id: string | null = player2Id || null;
    let p1Name = "Player 1";
    let p2Name = "Player 2";
    let matchCode: string | null = null;

    if (isModeA) {
      // Fetch both player profiles
      const { data: players, error: playersError } = await supabase
        .from("player_profiles")
        .select("id, username, gamertag")
        .in("id", [player1Id!, player2Id!]);

      if (playersError || !players || players.length < 2) {
        return { success: false, error: "Could not find profile details for both selected players." };
      }

      const p1 = players.find((p) => p.id === player1Id);
      const p2 = players.find((p) => p.id === player2Id);

      p1Name = p1?.gamertag || p1?.username || "Player 1";
      p2Name = p2?.gamertag || p2?.username || "Player 2";
    } else {
      // Mode B: Generate booking code for players to join
      matchCode = generateMatchCode();

      // Normalize if only 1 player was selected in slot 2
      if (!p1Id && p2Id) {
        p1Id = p2Id;
        p2Id = null;
      }

      if (p1Id) {
        const { data: p1Profile } = await supabase
          .from("player_profiles")
          .select("id, username, gamertag")
          .eq("id", p1Id)
          .maybeSingle();

        if (p1Profile) {
          p1Name = p1Profile.gamertag || p1Profile.username || "Player 1";
        }
      }
    }

    let defaultQuestion = `Will ${p1Name} defeat ${p2Name}?`;
    if (!isModeA) {
      if (p1Id) {
        defaultQuestion = `Will ${p1Name} win this match?`;
      } else {
        defaultQuestion = `Will Player 1 defeat Player 2 in this match?`;
      }
    }

    const finalQuestion = data.question?.trim() || defaultQuestion;
    const matchState = isModeA ? "OPEN" : "AWAITING_PLAYERS";

    // 1. Insert into matches table
    const { data: match, error: matchError } = await supabase
      .from("matches")
      .insert({
        creator_id: user.uid,
        player1_id: p1Id,
        player2_id: p2Id,
        game,
        stake_amount: 0, // No entry fee for curated matches
        state: matchState,
        is_admin_match: true,
        match_code: matchCode,
        scheduled_start_time: scheduledStartTime ? new Date(scheduledStartTime).toISOString() : null,
        question: finalQuestion,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (matchError || !match) {
      console.error("Failed to insert admin match:", matchError);
      return {
        success: false,
        error: matchError?.message || "Failed to create match in database.",
      };
    }

    // 2. Insert into markets table with YES/NO market_type
    const { error: marketError } = await supabase.from("markets").upsert({
      id: match.id,
      match_id: match.id,
      market_type: "YES_NO",
      question: finalQuestion,
      total_pool: 0,
      yes_pool: 0,
      no_pool: 0,
      p1_pool: 0,
      p2_pool: 0,
      draw_pool: 0,
      status: "OPEN",
      created_at: now,
      updated_at: now,
    });

    if (marketError) {
      console.warn("Market insert warning:", marketError);
    }

    // 3. Broadcast notification announcement if Mode A (fully assigned)
    if (isModeA) {
      try {
        await supabase.from("notifications").insert({
          type: "ADMIN_MATCH_LIVE",
          title: "⚡ New Live Curated Match!",
          message: `${p1Name} vs ${p2Name} is live for predictions! Question: "${finalQuestion}"`,
          reference_id: match.id,
          is_read: false,
          created_at: now,
        });
      } catch (notifErr) {
        console.warn("Notification broadcast note:", notifErr);
      }
    }

    // 4. Record audit log in admin_actions
    try {
      await supabase.from("admin_actions").insert({
        admin_id: user.uid,
        match_id: match.id,
        action: isModeA ? "ADMIN_MATCH_CREATED" : "ADMIN_MATCH_CODE_CREATED",
        reason: isModeA
          ? `Admin created curated match: ${p1Name} vs ${p2Name} (${game}) with YES/NO market.`
          : `Admin created code-based curated match [Code: ${matchCode}] (${game}) with YES/NO market.`,
        created_at: now,
      });
    } catch {
      // Non-fatal audit log
    }

    return { success: true, matchId: match.id, matchCode: matchCode || undefined };
  } catch (err: any) {
    console.error("createAdminMatchAction unexpected error:", err);
    return {
      success: false,
      error: err?.message || "An unexpected error occurred while creating the curated match.",
    };
  }
}

export async function joinAdminMatchByCodeAction(
  code: string
): Promise<{ success: boolean; matchId?: string; redirectUrl?: string; error?: string }> {
  try {
    const user = await getAuthUser();
    const userId = user.uid;

    if (!code || !code.trim()) {
      return { success: false, error: "Please enter a valid match code." };
    }

    const cleanCode = code.trim().toUpperCase();
    const supabase = await createClient();

    // Check verification status (bypass for admins)
    const { data: profile } = await supabase
      .from("player_profiles")
      .select("is_verified, role, is_admin, gamertag, username")
      .eq("id", userId)
      .maybeSingle();

    const isAdmin = user.admin || profile?.role === "admin" || profile?.is_admin === true;
    if (!isAdmin && (!profile || !profile.is_verified)) {
      return {
        success: false,
        error: "Profile verification required: You must complete profile verification to join matches.",
      };
    }

    // Lookup match by match_code OR by exact id OR short prefix
    const { data: matchesByCode } = await supabase
      .from("matches")
      .select("*")
      .eq("match_code", cleanCode)
      .limit(1);

    let match = matchesByCode && matchesByCode.length > 0 ? matchesByCode[0] : null;

    if (!match) {
      const { data: matchesById } = await supabase
        .from("matches")
        .select("*")
        .eq("id", code.trim())
        .limit(1);
      match = matchesById && matchesById.length > 0 ? matchesById[0] : null;
    }

    // Fallback: search by ID prefix (e.g. first 8 characters)
    if (!match && cleanCode.length >= 6) {
      const { data: prefixMatches } = await supabase
        .from("matches")
        .select("*")
        .ilike("id", `${code.trim()}%`)
        .limit(1);
      if (prefixMatches && prefixMatches.length > 0) {
        match = prefixMatches[0];
      }
    }

    if (!match) {
      return { success: false, error: "Invalid or expired match code." };
    }

    const now = new Date().toISOString();

    // 1. Admin-Curated Match handling
    if (match.is_admin_match) {
      // Check if both player slots are already filled
      if (match.player1_id && match.player2_id) {
        // If the user is one of the players, redirect directly
        if (match.player1_id === userId || match.player2_id === userId) {
          return { success: true, matchId: match.id, redirectUrl: `/live/${match.id}` };
        }
        // Match is full, redirect as viewer/predictor
        return {
          success: true,
          matchId: match.id,
          redirectUrl: `/live/${match.id}`,
        };
      }

      // Check if calling user is already player1
      if (match.player1_id === userId) {
        return { success: true, matchId: match.id, redirectUrl: `/live/${match.id}` };
      }

      // Assign user to available slot
      let newP1 = match.player1_id;
      let newP2 = match.player2_id;

      if (!newP1) {
        newP1 = userId;
      } else if (!newP2) {
        newP2 = userId;
      }

      const bothFilled = Boolean(newP1 && newP2);
      const newState = bothFilled ? "OPEN" : "AWAITING_PLAYERS";

      // Update match
      const { error: updateError } = await supabase
        .from("matches")
        .update({
          player1_id: newP1,
          player2_id: newP2,
          state: newState,
          updated_at: now,
        })
        .eq("id", match.id);

      if (updateError) {
        return { success: false, error: "Failed to join match. Please try again." };
      }

      // Insert participant entry
      await supabase.from("match_participants").upsert({
        id: `${match.id}_${userId}`,
        match_id: match.id,
        user_id: userId,
        role: "PLAYER",
        joined_at: now,
      });

      // If both slots are now filled, update market question with real gamertags and broadcast
      if (bothFilled) {
        try {
          const { data: players } = await supabase
            .from("player_profiles")
            .select("id, gamertag, username")
            .in("id", [newP1!, newP2!]);

          const p1 = players?.find((p) => p.id === newP1);
          const p2 = players?.find((p) => p.id === newP2);
          const p1Gamertag = p1?.gamertag || p1?.username || "Player 1";
          const p2Gamertag = p2?.gamertag || p2?.username || "Player 2";

          const dynamicQuestion = `Will ${p1Gamertag} defeat ${p2Gamertag}?`;

          await supabase
            .from("matches")
            .update({ question: dynamicQuestion })
            .eq("id", match.id);

          await supabase
            .from("markets")
            .update({ question: dynamicQuestion, status: "OPEN" })
            .eq("id", match.id);

          await supabase.from("notifications").insert({
            type: "ADMIN_MATCH_LIVE",
            title: "⚡ Match Ready for Predictions!",
            message: `${p1Gamertag} vs ${p2Gamertag} is now filled and live!`,
            reference_id: match.id,
            is_read: false,
            created_at: now,
          });
        } catch (e) {
          console.warn("Post-fill announcement note:", e);
        }
      }

      return { success: true, matchId: match.id, redirectUrl: `/live/${match.id}` };
    }

    // 2. Standard Peer-to-Peer Match handling
    if (match.state === "OPEN" && !match.player2_id && match.creator_id !== userId) {
      // Check wallet balance (unless admin)
      const stake = match.stake_amount || match.stake || 0;
      if (!isAdmin && stake > 0) {
        const { data: wallet } = await supabase
          .from("virtual_wallets")
          .select("balance")
          .eq("user_id", userId)
          .maybeSingle();

        if (!wallet || (wallet.balance ?? 0) < stake) {
          return {
            success: false,
            error: "Insufficient virtual points for the match entry fee.",
          };
        }
      }

      // Join standard match
      await supabase
        .from("matches")
        .update({
          player2_id: userId,
          state: "PLAYER_JOINED",
          updated_at: now,
        })
        .eq("id", match.id);

      await supabase.from("match_participants").upsert({
        id: `${match.id}_${userId}`,
        match_id: match.id,
        user_id: userId,
        role: "JOINER",
        joined_at: now,
      });

      return { success: true, matchId: match.id, redirectUrl: `/matches/${match.id}` };
    }

    // If already joined or match in progress, redirect to lobby
    return {
      success: true,
      matchId: match.id,
      redirectUrl: `/matches/${match.id}`,
    };
  } catch (err: any) {
    console.error("joinAdminMatchByCodeAction error:", err);
    return {
      success: false,
      error: err?.message || "An unexpected error occurred while processing match code.",
    };
  }
}

export const loadMatchByCodeAction = joinAdminMatchByCodeAction;



