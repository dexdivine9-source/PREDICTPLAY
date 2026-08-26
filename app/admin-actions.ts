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


