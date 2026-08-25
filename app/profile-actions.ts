"use server";

import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
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

/**
 * Links the signed-in user's DLS Live tracker profile to their
 * player_profiles doc, so signup pulls real match history instead of
 * relying on a self-typed username.
 *
 * This is a LINK, not a VERIFICATION — the tracker id is not a login
 * credential, so this does not prove the caller owns that DLS account.
 * verificationStatus is set to "LINKED", a distinct status from
 * "VERIFIED", which should still require the existing profile-screenshot
 * flow (or some other ownership check) to be reached.
 *
 * Never throws on tracker-lookup failure — returns { success: false }
 * so the UI can fall back to manual profile setup without blocking
 * account creation.
 */
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

  const profileRef = adminDb.collection("player_profiles").doc(userId);
  const existing = await profileRef.get();

  const update = {
    userId,
    trackerId: trackerProfile.trackerId,
    trackerTeamName: trackerProfile.teamName,
    trackerDivision: trackerProfile.division,
    trackerPlayed: trackerProfile.played,
    trackerWon: trackerProfile.won,
    trackerLost: trackerProfile.lost,
    trackerLinkedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    // Only bump verificationStatus to LINKED if this profile hasn't
    // already gone further (e.g. VERIFIED, or mid-MANUAL_REVIEW) — don't
    // let a tracker link downgrade a stronger status.
    ...(existing.exists &&
    ["VERIFIED", "MANUAL_REVIEW"].includes(
      existing.data()?.verificationStatus
    )
      ? {}
      : { verificationStatus: "LINKED" as const }),
    ...(existing.exists ? {} : { createdAt: FieldValue.serverTimestamp() }),
  };

  await profileRef.set(update, { merge: true });

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
