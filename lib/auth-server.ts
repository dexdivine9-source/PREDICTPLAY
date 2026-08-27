/**
 * ============================================================================
 * PREDICTPLAY AUTH & ACCOUNT MODEL
 * ============================================================================
 * Admin accounts are manually flagged via direct DB update (is_admin / role
 * column on player_profiles) and are intended for developer/testing use — they
 * retain full gameplay ability (match creation, predictions, verification)
 * alongside moderation privileges and testing bypasses.
 *
 * Regular player accounts go through normal signup, verification, and balance
 * rules with no admin capabilities.
 * ============================================================================
 */

import { createClient } from "@/lib/supabase/server";

export async function getAuthUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    throw new Error("Unauthorized: Invalid or missing auth session");
  }

  // 1. Check user metadata / app metadata
  let isAdmin = user.user_metadata?.role === "admin" || user.app_metadata?.role === "admin" || user.user_metadata?.is_admin === true;

  // 2. Check admin email / id allowlists if configured
  const adminEmails = (process.env.ADMIN_EMAILS || "").split(",").map(e => e.trim().toLowerCase()).filter(Boolean);
  const adminIds = (process.env.ADMIN_USER_IDS || "").split(",").map(id => id.trim()).filter(Boolean);

  if (user.email && adminEmails.includes(user.email.toLowerCase())) {
    isAdmin = true;
  }
  if (adminIds.includes(user.id)) {
    isAdmin = true;
  }

  // 3. Check role / is_admin column in player_profiles
  if (!isAdmin) {
    try {
      const { data: profile } = await supabase
        .from("player_profiles")
        .select("role, is_admin")
        .eq("id", user.id)
        .maybeSingle();

      if (profile?.role === "admin" || profile?.is_admin === true) {
        isAdmin = true;
      }
    } catch {
      // Ignore column lookup if missing
    }
  }
  
  return {
    ...user,
    uid: user.id,
    admin: isAdmin,
    role: isAdmin ? ("admin" as const) : ("player" as const),
  };
}
