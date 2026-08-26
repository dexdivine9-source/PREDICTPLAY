"use server";

import { createClient } from "@/lib/supabase/server";
import { EvidencePhase } from "@/lib/types";
import { getAuthUser } from "@/lib/auth-server";
import { analyzeImageWithGemini, type AiPayload } from "@/lib/gemini-vision";
import { settleMarket } from "./actions";

export async function registerEvidenceAction(
  matchId: string,
  phase: EvidencePhase,
  storagePath: string
) {
  const user = await getAuthUser();
  const userId = user.uid;

  if (!matchId || !phase || !storagePath) {
    throw new Error("Missing required evidence fields");
  }

  const supabase = await createClient();

  // 1. Verify match participation
  const { data: matchData } = await supabase
    .from("matches")
    .select("*")
    .eq("id", matchId)
    .maybeSingle();

  if (!matchData) throw new Error("Match not found");

  if (matchData.player1_id !== userId && matchData.player2_id !== userId) {
    throw new Error("Unauthorized: You are not a participant in this match.");
  }

  // 2. Determine Evidence Session
  await supabase.from("match_evidence_sessions").upsert({
    id: matchId,
    match_id: matchId,
    game: matchData.game,
    player1_id: matchData.player1_id,
    player2_id: matchData.player2_id,
    status: "ACTIVE",
    created_at: new Date().toISOString(),
  });

  // 3. Find if previous evidence exists to increment attempt number
  const { data: existingEvidence } = await supabase
    .from("match_evidence")
    .select("*")
    .eq("match_id", matchId)
    .eq("user_id", userId)
    .eq("phase", phase)
    .order("attempt_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  const attemptNumber = existingEvidence ? (existingEvidence.attempt_number || 1) + 1 : 1;
  const supersedesEvidenceId = existingEvidence ? existingEvidence.id : null;

  // 4. Create new evidence record
  const { data: newEvidence } = await supabase
    .from("match_evidence")
    .insert({
      match_id: matchId,
      user_id: userId,
      type: "SCREENSHOT",
      phase,
      attempt_number: attemptNumber,
      supersedes_evidence_id: supersedesEvidenceId,
      storage_path: storagePath,
      uploaded_at: new Date().toISOString(),
      analysis_status: "QUEUED",
    })
    .select()
    .single();

  // Update match state
  if (phase === "START") {
    await supabase
      .from("matches")
      .update({ state: "START_EVIDENCE_PROCESSING", updated_at: new Date().toISOString() })
      .eq("id", matchId);
  } else if (phase === "END") {
    await supabase
      .from("matches")
      .update({ state: "END_EVIDENCE_PROCESSING", updated_at: new Date().toISOString() })
      .eq("id", matchId);
  }

  return newEvidence;
}

async function performEvidenceAnalysis(
  evidenceId: string,
  simulatedPayload?: AiPayload
): Promise<void> {
  const supabase = await createClient();

  const { data: evidence } = await supabase
    .from("match_evidence")
    .select("*")
    .eq("id", evidenceId)
    .maybeSingle();

  if (!evidence) throw new Error("Evidence not found");

  if (evidence.analysis_status === "COMPLETE") return;

  if (simulatedPayload) {
    await supabase
      .from("match_evidence")
      .update({
        analysis_status: "COMPLETE",
        ai_payload: simulatedPayload,
        analysis_completed_at: new Date().toISOString(),
      })
      .eq("id", evidenceId);
    return;
  }

  const storagePath: string | undefined = evidence.storage_path;
  if (!storagePath) {
    await supabase
      .from("match_evidence")
      .update({
        analysis_status: "FAILED",
        analysis_failure_reason: "Evidence record has no storage_path",
      })
      .eq("id", evidenceId);
    return;
  }

  let imageBytes: Buffer;
  let mimeType = "image/jpeg";

  try {
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("evidence")
      .download(storagePath);

    if (downloadError || !fileData) {
      throw new Error(downloadError?.message || "Failed to download image from storage");
    }

    const arrayBuffer = await fileData.arrayBuffer();
    imageBytes = Buffer.from(arrayBuffer);
    mimeType = fileData.type || "image/jpeg";
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    await supabase
      .from("match_evidence")
      .update({
        analysis_status: "FAILED",
        analysis_failure_reason: "Could not read evidence from Storage: " + msg,
      })
      .eq("id", evidenceId);
    return;
  }

  const outcome = await analyzeImageWithGemini(imageBytes, mimeType, storagePath);

  if (outcome.success) {
    await supabase
      .from("match_evidence")
      .update({
        analysis_status: "COMPLETE",
        ai_payload: outcome.payload,
        image_hash: outcome.imageHash,
        mime_type: mimeType,
        analysis_completed_at: new Date().toISOString(),
      })
      .eq("id", evidenceId);
  } else {
    await supabase
      .from("match_evidence")
      .update({
        analysis_status: "FAILED",
        analysis_failure_reason: outcome.reason,
      })
      .eq("id", evidenceId);
  }
}

export async function analyzeEvidenceAction(evidenceId: string, simulatedPayload?: AiPayload) {
  const user = await getAuthUser();
  if (!user.admin) {
    throw new Error("Unauthorized: Only admins can analyze evidence directly");
  }

  await performEvidenceAnalysis(evidenceId, simulatedPayload);
}

export async function verifyMatchAction(matchId: string) {
  const user = await getAuthUser();
  if (!user.admin) {
    throw new Error("Unauthorized");
  }

  const supabase = await createClient();

  const { data: matchData } = await supabase
    .from("matches")
    .select("*")
    .eq("id", matchId)
    .maybeSingle();

  if (!matchData) throw new Error("Match not found");

  if (matchData.state === "COMPLETED" || matchData.state === "CANCELLED") {
    throw new Error("Match is already resolved");
  }

  const { data: evidenceList } = await supabase
    .from("match_evidence")
    .select("*")
    .eq("match_id", matchId);

  const activeEvidence = new Map<string, any>();
  if (evidenceList) {
    evidenceList.forEach((item) => {
      const key = `${item.user_id}_${item.phase}`;
      if (!activeEvidence.has(key) || activeEvidence.get(key).attempt_number < item.attempt_number) {
        activeEvidence.set(key, item);
      }
    });
  }

  const p1Start = activeEvidence.get(`${matchData.player1_id}_START`);
  const p2Start = activeEvidence.get(`${matchData.player2_id}_START`);
  const p1End = activeEvidence.get(`${matchData.player1_id}_END`);
  const p2End = activeEvidence.get(`${matchData.player2_id}_END`);

  if (!p1Start || !p2Start || !p1End || !p2End) {
    await supabase
      .from("matches")
      .update({ state: "MANUAL_REVIEW", resolution_reason: "Missing evidence" })
      .eq("id", matchId);
    return;
  }

  if (
    p1Start.analysis_status !== "COMPLETE" ||
    p2Start.analysis_status !== "COMPLETE" ||
    p1End.analysis_status !== "COMPLETE" ||
    p2End.analysis_status !== "COMPLETE"
  ) {
    return;
  }

  const p1Payload = p1End.ai_payload;
  const p2Payload = p2End.ai_payload;

  if (p1Payload?.game !== matchData.game || p2Payload?.game !== matchData.game) {
    await supabase
      .from("matches")
      .update({ state: "MANUAL_REVIEW", resolution_reason: "Game mismatch" })
      .eq("id", matchId);
    return;
  }

  const p1ScoreReport = p1Payload?.score;
  const p2ScoreReport = p2Payload?.score;

  if (
    !p1ScoreReport ||
    !p2ScoreReport ||
    p1ScoreReport.player1 !== p2ScoreReport.player1 ||
    p1ScoreReport.player2 !== p2ScoreReport.player2
  ) {
    await supabase
      .from("matches")
      .update({ state: "DISPUTED", resolution_reason: "Contradictory scores" })
      .eq("id", matchId);
    return;
  }

  let confidence = 100;
  if (p1Payload.possibleManipulation || p2Payload.possibleManipulation) confidence -= 50;

  if (confidence >= 90) {
    const p1Final1 = p1ScoreReport.player1;
    const p1Final2 = p1ScoreReport.player2;

    let winningOutcome = "draw";
    if (p1Final1 > p1Final2) winningOutcome = "p1";
    else if (p1Final2 > p1Final1) winningOutcome = "p2";

    await supabase
      .from("matches")
      .update({
        state: "AUTO_VERIFIED",
        verified_score_p1: p1Final1,
        verified_score_p2: p1Final2,
        verified_outcome: winningOutcome,
        verification_confidence: confidence,
        analysis_completed_at: new Date().toISOString(),
      })
      .eq("id", matchId);
  } else {
    await supabase
      .from("matches")
      .update({
        state: "MANUAL_REVIEW",
        resolution_reason: "Low confidence",
        verification_confidence: confidence,
      })
      .eq("id", matchId);
  }
}

export async function finalizeVerifiedMatchAction(matchId: string) {
  const user = await getAuthUser();
  if (!user.admin) {
    throw new Error("Unauthorized");
  }

  const supabase = await createClient();

  const { data: matchData } = await supabase
    .from("matches")
    .select("*")
    .eq("id", matchId)
    .maybeSingle();

  if (!matchData) throw new Error("Match not found");

  if (matchData.state !== "AUTO_VERIFIED" && matchData.state !== "MANUAL_REVIEW_VERIFIED") {
    throw new Error("Match not ready for completion");
  }

  const winningOutcomeToSettle = matchData.verified_outcome;

  await supabase
    .from("matches")
    .update({
      state: "COMPLETED",
      resolved_at: new Date().toISOString(),
    })
    .eq("id", matchId);

  if (winningOutcomeToSettle) {
    await settleMarket(matchId, winningOutcomeToSettle);
  }
}
