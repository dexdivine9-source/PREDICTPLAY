"use server";

import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth-server";
import { parseTrackerId, fetchDlsTrackerProfile } from "@/lib/dls-tracker";

export interface LinkTrackerResult {
  success: boolean;
  error?: string;
  profile?: {
    teamName: string;
    division: number;
    played: number;
    won: number;
    lost: number;
    winRate: number;
  };
}

export async function linkDlsTrackerAction(
  trackerInput: string
): Promise<LinkTrackerResult> {
  const user = await getAuthUser();
  const userId = user.uid;

  const trackerId = parseTrackerId(trackerInput);
  if (!trackerId) {
    return {
      success: false,
      error:
        "That doesn't look like a valid tracker link or code. Paste the link from your DLS profile's tracker icon.",
    };
  }

  const trackerProfile = await fetchDlsTrackerProfile(trackerId);
  if (!trackerProfile) {
    return {
      success: false,
      error:
        "Couldn't fetch that tracker profile right now. You can try again, or continue with manual profile verification instead.",
    };
  }

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("player_profiles")
    .select("verification_status")
    .eq("id", userId)
    .maybeSingle();

  const updateData: any = {
    id: userId,
    user_id: userId,
    tracker_id: trackerProfile.trackerId,
    tracker_team_name: trackerProfile.teamName,
    tracker_division: trackerProfile.division,
    tracker_played: trackerProfile.played,
    tracker_won: trackerProfile.won,
    tracker_lost: trackerProfile.lost,
    tracker_linked_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (!existing || !["VERIFIED", "MANUAL_REVIEW"].includes(existing.verification_status)) {
    updateData.verification_status = "LINKED";
  }

  await supabase
    .from("player_profiles")
    .upsert(updateData, { onConflict: "id" });

  return {
    success: true,
    profile: {
      teamName: trackerProfile.teamName,
      division: trackerProfile.division,
      played: trackerProfile.played,
      won: trackerProfile.won,
      lost: trackerProfile.lost,
      winRate: trackerProfile.winRate,
    },
  };
}
export async function createInitialProfileAction(
  username: string,
  referralCode?: string
) {
  const user = await getAuthUser();
  const userId = user.uid;

  if (!username || username.trim().length === 0) {
    throw new Error("Username is required.");
  }

  const cleanUsername = username.trim().slice(0, 20);
  const cleanReferral = referralCode ? referralCode.trim().slice(0, 30) : null;

  const supabase = await createClient();

  const profileData: any = {
    id: userId,
    user_id: userId,
    username: cleanUsername,
    gamertag: cleanUsername,
    referral_code: cleanReferral,
    is_verified: false,
    reputation: 100,
    trust_score: 100,
    game: "DLS",
    updated_at: new Date().toISOString(),
  };

  const { error: profileError } = await supabase
    .from("player_profiles")
    .upsert(profileData, { onConflict: "id" });

  if (profileError) {
    console.error("Error creating initial profile:", profileError);
    throw new Error(profileError.message);
  }

  return { success: true };
}

export async function saveVerificationAction(data: {
  gameUsername: string;
  gameProfileScreenshotUrl: string;
  trackerId: string;
  team: string;
  allowPartial?: boolean;
}) {
  const user = await getAuthUser();
  const userId = user.uid;

  const {
    gameUsername,
    gameProfileScreenshotUrl,
    trackerId,
    team,
    allowPartial = false,
  } = data;

  const cleanGameUsername = (gameUsername || "").trim();
  const cleanScreenshotUrl = (gameProfileScreenshotUrl || "").trim();
  const cleanTrackerId = (trackerId || "").trim();
  const cleanTeam = (team || "").trim();

  // All four are required to be marked verified
  const hasAllFields = Boolean(
    cleanGameUsername && cleanScreenshotUrl && cleanTrackerId && cleanTeam
  );

  if (!allowPartial && !hasAllFields) {
    throw new Error(
      "All 4 verification fields are required to complete profile verification."
    );
  }

  const supabase = await createClient();

  const { data: existingProfile } = await supabase
    .from("player_profiles")
    .select("is_verified, verification_status")
    .eq("id", userId)
    .maybeSingle();

  const isAlreadyVerified = existingProfile?.is_verified === true;

  const updateData: any = {
    id: userId,
    user_id: userId,
    game_username: cleanGameUsername || null,
    gamertag: cleanGameUsername || undefined,
    game_profile_screenshot_url: cleanScreenshotUrl || null,
    tracker_id: cleanTrackerId || null,
    team: cleanTeam || null,
    is_verified: isAlreadyVerified, // Only admins approve to make is_verified = true
    verification_status: isAlreadyVerified ? "VERIFIED" : hasAllFields ? "PENDING" : "IN_PROGRESS",
    rejection_reason: null, // Clear any previous rejection on new submission
    updated_at: new Date().toISOString(),
  };

  // Update player_profiles
  const { error: profileError } = await supabase
    .from("player_profiles")
    .upsert(updateData, { onConflict: "id" });

  if (profileError) {
    console.error("Error saving verification to player_profiles:", profileError);
    throw new Error(profileError.message);
  }

  // Also attempt to upsert to player_verification if the table exists
  try {
    await supabase.from("player_verification").upsert(
      {
        user_id: userId,
        game_username: cleanGameUsername || null,
        game_profile_screenshot_url: cleanScreenshotUrl || null,
        tracker_id: cleanTrackerId || null,
        team: cleanTeam || null,
        is_verified: hasAllFields,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );
  } catch (err) {
    // Graceful fallback if player_verification table is not in supabase schema
    console.warn("player_verification table write note:", err);
  }

  return {
    success: true,
    isVerified: hasAllFields,
  };
}
