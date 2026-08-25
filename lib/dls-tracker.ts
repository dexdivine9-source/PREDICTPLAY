// Integration with First Touch Games' DLL (Dream League Live) tracker.
//
// This is an UNDOCUMENTED, UNOFFICIAL endpoint discovered by inspecting
// network traffic on https://tracker.ftgames.com — it is not a published
// API and FTG could change or block it without notice. Every caller of
// this module MUST treat failures as expected and fall back gracefully
// (e.g. to the manual profile-screenshot flow) rather than blocking
// signup or any other flow on this succeeding.
//
// It also does NOT prove account ownership — a tracker id/link is not a
// login credential. Anyone who has a player's tracker id can fetch their
// stats. Only use this to LINK a profile to real match data, never to
// fully VERIFY identity on its own.

const TRACKER_API_URL = "https://st.cf.api.ftpub.net/StatsTracker_Frontline";

export interface DlsTrackerProfile {
  trackerId: string;
  teamName: string;
  division: number;
  played: number;
  won: number;
  lost: number;
  winRate: number; // 0-100
}

/**
 * Accepts either a raw tracker id ("6lpcgvsf") or a full tracker URL
 * (e.g. "https://tracker.ftgames.com/?idx=6lpcgvsf") and returns the id.
 * Returns null if nothing that looks like a tracker id can be found.
 */
export function parseTrackerId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  try {
    const url = new URL(trimmed);
    const idx = url.searchParams.get("idx") ?? url.searchParams.get("id");
    if (idx) return idx;
  } catch {
    // Not a URL — fall through and treat it as a raw id.
  }

  // Raw ids seen in the wild are short alphanumeric tokens (e.g. "6lpcgvsf").
  if (/^[a-zA-Z0-9]{4,20}$/.test(trimmed)) {
    return trimmed;
  }

  return null;
}

/**
 * Fetches a player's DLL stats from the tracker API. Server-side only —
 * the endpoint's CORS policy only allows requests from
 * https://tracker.ftgames.com, so this cannot be called from the browser
 * (which is fine, since it also should never be called from the client:
 * this is server-only lookup logic).
 *
 * Returns null on any failure (network error, unexpected shape, 4xx/5xx)
 * rather than throwing, so callers can treat "no data" as a normal,
 * expected outcome and fall back accordingly.
 */
export async function fetchDlsTrackerProfile(
  trackerId: string
): Promise<DlsTrackerProfile | null> {
  try {
    const res = await fetch(TRACKER_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // A browser-like User-Agent is REQUIRED: the endpoint sits behind a
        // CloudFront WAF that returns 403 to requests without one (verified
        // against the live endpoint). These headers are NOT auth — the
        // endpoint has none, it's keyed entirely off the tracker id; they
        // just mirror what the real tracker page sends.
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "application/json, text/plain, */*",
        Origin: "https://tracker.ftgames.com",
        Referer: "https://tracker.ftgames.com/",
      },
      body: JSON.stringify({
        queryType: "AWSGetUserData",
        queryData: { TId: trackerId, hideOpponentName: null },
        analytics: { idx: trackerId },
      }),
      // Don't let a slow/hanging third-party call stall a signup flow.
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) return null;

    const data = await res.json();

    const played = typeof data.Pla === "number" ? data.Pla : null;
    const lost = typeof data.Los === "number" ? data.Los : null;
    const teamName = typeof data.Tnm === "string" ? data.Tnm : null;

    if (played === null || lost === null || !teamName) {
      // Response shape didn't match what we expect — treat as unavailable
      // rather than guessing, since FTG could have changed the format.
      return null;
    }

    const won = Math.max(0, played - lost);
    const winRate = played > 0 ? Math.round((won / played) * 1000) / 10 : 0;

    return {
      trackerId,
      teamName,
      division: typeof data.Div === "number" ? data.Div : 0,
      played,
      won,
      lost,
      winRate,
    };
  } catch {
    // Network error, timeout, JSON parse failure, etc. — all treated the
    // same: no data available, caller falls back to manual verification.
    return null;
  }
}
