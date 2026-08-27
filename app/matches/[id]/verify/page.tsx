"use client";

import { useState, use, useEffect } from "react";
import Link from "next/link";
import { 
  ShieldAlert, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  RefreshCw,
  UploadCloud,
  AlertCircle,
  ExternalLink,
  Check
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import { EvidenceUpload } from "@/components/evidence-upload";

export const dynamic = "force-dynamic";

export default function MatchVerificationPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const matchId = resolvedParams.id;

  const { user } = useAuth();
  const [match, setMatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const [reportedScore1, setReportedScore1] = useState<number | "">("");
  const [reportedScore2, setReportedScore2] = useState<number | "">("");
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [evidenceError, setEvidenceError] = useState<string | null>(null);

  const loadMatch = async () => {
    try {
      const { data } = await supabase
        .from("matches")
        .select("*")
        .eq("id", matchId)
        .maybeSingle();

      if (data) {
        setMatch({
          id: data.id,
          creatorId: data.creator_id || data.player1_id,
          player1Id: data.player1_id || data.creator_id,
          player2Id: data.player2_id,
          game: data.game || "DLS",
          state: data.state || "OPEN",
          p1Submitted: data.p1_submitted ?? false,
          p2Submitted: data.p2_submitted ?? false,
          p1Score1: data.p1_score1,
          p1Score2: data.p1_score2,
          p2Score1: data.p2_score1,
          p2Score2: data.p2_score2,
          p1Evidence: data.p1_evidence,
          p2Evidence: data.p2_evidence,
          verifiedScoreP1: data.verified_score_p1,
          verifiedScoreP2: data.verified_score_p2,
          verificationConfidence: data.verification_confidence,
          resolutionReason: data.resolution_reason,
          ...data,
        });
      } else {
        setMatch(null);
      }
    } catch (err) {
      console.error("Error fetching match:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMatch();

    const channel = supabase
      .channel(`match-verify-${matchId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "matches", filter: `id=eq.${matchId}` },
        () => loadMatch()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [matchId]);

  if (loading) {
    return <div className="p-24 text-center font-bold text-white animate-pulse">Loading Verification...</div>;
  }

  if (!match) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center">
        <h1 className="text-4xl font-black text-red-500 mb-4">MATCH NOT FOUND</h1>
        <p className="text-pp-text-muted mb-8">The match you are looking for does not exist.</p>
        <Link href="/matches" className="text-pp-primary hover:underline font-bold">RETURN TO MATCHES</Link>
      </div>
    );
  }

  const isCreator = user?.id === match.creatorId || user?.id === match.player1Id;
  const isJoined = user?.id === match.player2Id;
  const isParticipant = isCreator || isJoined;

  if (!user || !isParticipant) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center">
        <h1 className="text-3xl font-black text-white mb-4">NOT AUTHORIZED</h1>
        <p className="text-pp-text-muted mb-6">You are not a registered participant in this match.</p>
        <Link href={`/matches/${matchId}`} className="text-pp-primary hover:underline font-bold">BACK TO MATCH</Link>
      </div>
    );
  }

  const hasSubmittedScore = isCreator ? match.p1Submitted : match.p2Submitted;
  const submittedEvidenceUrl = isCreator ? match.p1Evidence : match.p2Evidence;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null;
    setEvidenceError(null);

    if (selected) {
      if (!selected.type.startsWith("image/")) {
        setEvidenceError("Only image files (JPEG, PNG, WebP) are allowed.");
        setEvidenceFile(null);
        return;
      }
      if (selected.size > 5 * 1024 * 1024) {
        setEvidenceError("Screenshot file size must be less than 5MB.");
        setEvidenceFile(null);
        return;
      }
      setEvidenceFile(selected);
    } else {
      setEvidenceFile(null);
    }
  };

  const handleScoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (reportedScore1 === "" || reportedScore2 === "") {
      setError("Please enter both scores.");
      return;
    }

    if (!evidenceFile) {
      setEvidenceError("Please select a screenshot of the final match result.");
      return;
    }

    setActionLoading(true);
    setError("");
    setEvidenceError(null);

    try {
      // 1. Upload screenshot to Supabase Storage bucket 'evidence'
      const sanitizedFileName = evidenceFile.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const storagePath = `${matchId}/${user.id}/result_${Date.now()}_${sanitizedFileName}`;

      const { error: uploadError } = await supabase.storage
        .from("evidence")
        .upload(storagePath, evidenceFile, {
          contentType: evidenceFile.type,
          upsert: true,
        });

      if (uploadError) {
        console.warn("Storage upload note:", uploadError.message);
      }

      // 2. Retrieve public URL
      const { data: publicUrlData } = supabase.storage
        .from("evidence")
        .getPublicUrl(storagePath);

      const evidenceUrl = publicUrlData?.publicUrl || storagePath;

      // 3. Submit match result with the real uploaded evidence URL
      const { submitMatchResultAction } = await import("@/app/actions");
      await submitMatchResultAction(matchId, Number(reportedScore1), Number(reportedScore2), evidenceUrl);
      
      setEvidenceFile(null);
      await loadMatch();
    } catch (err: any) {
      setError(err.message || "Failed to submit score report.");
    } finally {
      setActionLoading(false);
    }
  };

  // Determine evidence phase based on match lifecycle
  const isStartPhase =
    match.state === "OPEN" ||
    match.state === "PLAYER_JOINED" ||
    match.state === "AWAITING_START_EVIDENCE";

  const isEndPhase =
    match.state === "START_EVIDENCE_VERIFIED" ||
    match.state === "READY_TO_PLAY" ||
    match.state === "IN_PROGRESS" ||
    match.state === "AWAITING_END_EVIDENCE";

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <Link href={`/matches/${matchId}`} className="text-xs text-pp-primary hover:underline font-bold uppercase tracking-wide">
            &larr; Back to Match Lobby
          </Link>
          <h1 className="text-3xl font-extrabold tracking-tight mt-2 uppercase">MATCH VERIFICATION</h1>
          <p className="text-pp-text-muted text-sm mt-1">Multi-Phase Anti-Rigging Evidence & Verification Engine</p>
        </div>
        <div className="bg-pp-surface border border-pp-border px-4 py-2 rounded-xl text-right">
          <span className="text-[10px] text-pp-text-muted block uppercase font-bold tracking-wider">STATE</span>
          <span className="font-mono font-bold text-white text-sm uppercase">{match.state}</span>
        </div>
      </div>

      {error && (
        <div className="p-4 mb-8 text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl text-center text-sm font-bold">
          {error}
        </div>
      )}

      {/* State: COMPLETED */}
      {match.state === "COMPLETED" && (
        <div className="bg-pp-surface border border-pp-primary/30 rounded-2xl p-8 md:p-12 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pp-primary to-pp-accent"></div>
          <div className="w-20 h-20 bg-pp-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-pp-primary/20">
            <ShieldCheck size={40} className="text-pp-primary" />
          </div>
          <h2 className="text-3xl font-black text-white mb-2 uppercase">MATCH COMPLETED & SETTLED</h2>
          <p className="text-pp-text-muted mb-8 max-w-md mx-auto text-sm">
            Consensus reached and verified by the deterministic engine. Virtual points have been distributed.
          </p>

          <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto bg-pp-bg p-4 rounded-xl border border-pp-border mb-8">
            <div>
              <span className="text-xs text-pp-text-muted uppercase font-bold">Creator</span>
              <span className="block text-2xl font-black text-white mt-1">
                {match.verifiedScoreP1 ?? match.reportedScore1 ?? "—"}
              </span>
            </div>
            <div>
              <span className="text-xs text-pp-text-muted uppercase font-bold">Challenger</span>
              <span className="block text-2xl font-black text-white mt-1">
                {match.verifiedScoreP2 ?? match.reportedScore2 ?? "—"}
              </span>
            </div>
          </div>

          <Link
            href={`/matches/${matchId}`}
            className="inline-block px-8 py-3 bg-pp-primary text-black font-bold rounded-lg hover:bg-pp-primary-dark transition-colors uppercase text-sm"
          >
            Back to Match Overview
          </Link>
        </div>
      )}

      {/* State: DISPUTED or MANUAL_REVIEW */}
      {(match.state === "DISPUTED" || match.state === "MANUAL_REVIEW") && (
        <div className="bg-pp-surface border border-red-500/30 rounded-2xl p-8 md:p-12 text-center mb-8 relative overflow-hidden">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
            <AlertTriangle size={32} className="text-red-500" />
          </div>
          <h2 className="text-2xl font-black text-white mb-2 uppercase">
            {match.state === "DISPUTED" ? "SCORE CONFLICT / DISPUTE" : "MANUAL REVIEW QUEUED"}
          </h2>
          <p className="text-pp-text-muted mb-6 max-w-md mx-auto text-sm">
            {match.resolutionReason ||
              "The reported match scores or evidence require administrative audit."}
          </p>
        </div>
      )}

      {/* Main Verification Actions */}
      {match.state !== "COMPLETED" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left: Score Reporting with Final Match Result Screenshot */}
          <div className="bg-pp-surface border border-pp-border rounded-xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4 border-b border-pp-border pb-3">
                <ShieldAlert className="text-pp-accent" size={20} />
                <h3 className="font-bold text-lg text-white uppercase">Self-Report Result</h3>
              </div>
              <p className="text-xs text-pp-text-muted mb-6">
                Enter the final score from your perspective and upload screenshot proof of the final match result.
              </p>

              {hasSubmittedScore ? (
                <div className="bg-pp-bg border border-pp-border rounded-lg p-6 text-center space-y-3">
                  <CheckCircle2 size={32} className="text-pp-primary mx-auto mb-2" />
                  <h4 className="font-bold text-white mb-1">Score & Evidence Submitted</h4>
                  <p className="text-xs text-pp-text-muted">
                    Your report: Creator {isCreator ? match.p1Score1 : match.p2Score1} -{" "}
                    {isCreator ? match.p1Score2 : match.p2Score2} Challenger
                  </p>
                  {submittedEvidenceUrl && (
                    <div className="pt-2">
                      <a
                        href={submittedEvidenceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-pp-primary hover:underline font-bold"
                      >
                        <span>View Submitted Screenshot</span>
                        <ExternalLink size={12} />
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <form onSubmit={handleScoreSubmit} className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-pp-text-muted uppercase mb-1">
                        Creator Score
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={reportedScore1}
                        onChange={(e) =>
                          setReportedScore1(e.target.value === "" ? "" : Number(e.target.value))
                        }
                        required
                        className="w-full bg-pp-bg border border-pp-border rounded-lg p-3 text-white font-mono font-bold text-center text-xl focus:outline-none focus:border-pp-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-pp-text-muted uppercase mb-1">
                        Challenger Score
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={reportedScore2}
                        onChange={(e) =>
                          setReportedScore2(e.target.value === "" ? "" : Number(e.target.value))
                        }
                        required
                        className="w-full bg-pp-bg border border-pp-border rounded-lg p-3 text-white font-mono font-bold text-center text-xl focus:outline-none focus:border-pp-primary"
                      />
                    </div>
                  </div>

                  {/* Final Match Result Screenshot Upload */}
                  <div className="border-t border-pp-border pt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-pp-text-muted uppercase">
                        Final Match Result Screenshot <span className="text-pp-primary">*</span>
                      </label>
                      <span className="text-[11px] text-pp-text-muted">Max 5MB</span>
                    </div>

                    <div className="relative">
                      <input
                        type="file"
                        accept="image/jpeg, image/png, image/webp"
                        onChange={handleFileChange}
                        disabled={actionLoading}
                        className="w-full text-sm text-pp-text-muted file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-pp-primary file:text-black hover:file:bg-pp-primary-dark cursor-pointer bg-pp-bg/50 rounded-lg border border-pp-border p-2"
                      />
                    </div>

                    {evidenceFile && (
                      <div className="text-xs text-green-400 bg-green-500/10 border border-green-500/30 rounded-lg p-2.5 flex items-center justify-between">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <Check size={14} className="flex-shrink-0 text-green-400" />
                          <span className="truncate font-bold text-white">{evidenceFile.name}</span>
                        </div>
                        <span className="text-pp-text-muted ml-2 flex-shrink-0">
                          {(evidenceFile.size / (1024 * 1024)).toFixed(2)} MB
                        </span>
                      </div>
                    )}

                    {evidenceError && (
                      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-2.5 flex items-center gap-2 text-red-400 text-xs font-bold">
                        <AlertCircle size={14} className="flex-shrink-0" />
                        <span>{evidenceError}</span>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={
                      actionLoading || 
                      reportedScore1 === "" || 
                      reportedScore2 === "" || 
                      !evidenceFile
                    }
                    className="w-full py-3 bg-pp-primary text-black font-bold rounded-lg hover:bg-pp-primary-dark transition-colors uppercase text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {actionLoading ? (
                      <>
                        <div className="w-4 h-4 rounded-full border-2 border-black border-t-transparent animate-spin" />
                        <span>UPLOADING & SUBMITTING...</span>
                      </>
                    ) : (
                      <span>Submit Score & Evidence</span>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Right: Anti-Rigging Evidence Upload */}
          <div className="space-y-6">
            {isStartPhase && (
              <EvidenceUpload
                matchId={matchId}
                userId={user.id}
                phase="START"
                onSuccess={loadMatch}
              />
            )}

            {isEndPhase && (
              <EvidenceUpload
                matchId={matchId}
                userId={user.id}
                phase="END"
                onSuccess={loadMatch}
              />
            )}

            {!isStartPhase && !isEndPhase && (
              <div className="border border-pp-border rounded-xl p-6 bg-pp-surface text-center text-pp-text-muted text-sm">
                <Clock className="mx-auto mb-2 text-pp-text-muted" size={24} />
                Evidence submission is closed for the current state ({match.state}).
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
