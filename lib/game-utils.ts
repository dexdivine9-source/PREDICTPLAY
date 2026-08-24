/**
 * Canonical game identifiers used throughout PredictPlay.
 * All raw input — from UI, AI output, or API — must pass through normalizeGame().
 */
export type CanonicalGame = "DLS" | "eFootball";

const DLS_ALIASES = new Set([
  "dls",
  "DLS",
  "dream league soccer",
  "Dream League Soccer",
  "dreamleaguesoccer",
  "DreamLeagueSoccer",
  "DREAM LEAGUE SOCCER",
]);

const EFOOTBALL_ALIASES = new Set([
  "efootball",
  "eFootball",
  "eFootball™",
  "eFootball™ 2024",
  "eFootball™ 2025",
  "EFOOTBALL",
  "e-football",
  "E-Football",
  "pes",
  "PES",
  "pro evolution soccer",
]);

/**
 * Normalizes any game string representation into a canonical value.
 * Returns null if the value cannot be recognized.
 */
export function normalizeGame(raw: string | undefined | null): CanonicalGame | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (DLS_ALIASES.has(trimmed)) return "DLS";
  // Partial match for "DLS" prefix/suffix (handles versions like "DLS 24")
  if (/^dls/i.test(trimmed) || /dream.?league.?soccer/i.test(trimmed)) return "DLS";
  if (EFOOTBALL_ALIASES.has(trimmed)) return "eFootball";
  if (/efootball/i.test(trimmed) || /e.?football/i.test(trimmed)) return "eFootball";
  return null;
}

/**
 * Type-guard that confirms a string is a canonical game value.
 */
export function isCanonicalGame(val: string | undefined | null): val is CanonicalGame {
  return val === "DLS" || val === "eFootball";
}
