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
