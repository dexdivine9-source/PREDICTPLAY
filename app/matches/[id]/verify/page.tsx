"use client";

import { useState, use, useEffect } from "react";
import Link from "next/link";
import { ShieldAlert, ShieldCheck, CheckCircle2, AlertTriangle, Clock, RefreshCw } from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
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

  useEffect(() => {
    const docRef = doc(db, "matches", matchId);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setMatch({ id: docSnap.id, ...docSnap.data() });
      } else {
        setMatch(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
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

  const isCreator = user?.uid === match.creatorId;
  const isJoined = user?.uid === match.player2Id;
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

  const handleScoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (reportedScore1 === "" || reportedScore2 === "") return;

    setActionLoading(true);
    setError("");

    try {
      const { submitMatchResultAction } = await import("@/app/actions");
      // Calls server action with server-authoritative authentication
      await submitMatchResultAction(matchId, Number(reportedScore1), Number(reportedScore2), "");
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
          <div className="inline-block p-6 bg-pp-bg rounded-xl border border-pp-border mb-8">
            <span className="block text-[10px] text-pp-text-muted font-bold mb-2 uppercase tracking-widest">OFFICIAL FINAL SCORE</span>
            <span className="text-5xl font-black font-mono text-white">
              {match.verifiedScoreP1 ?? match.finalScore1 ?? match.p1Score1} - {match.verifiedScoreP2 ?? match.finalScore2 ?? match.p1Score2}
            </span>
          </div>
          <div>
            <Link href="/matches" className="inline-block px-8 py-3.5 bg-pp-primary text-black font-bold rounded-lg hover:bg-pp-primary-dark transition-colors uppercase tracking-wide text-sm">
              VIEW OTHER MATCHES
            </Link>
          </div>
        </div>
      )}

      {/* State: AUTO_VERIFIED */}
      {match.state === "AUTO_VERIFIED" && (
        <div className="bg-pp-surface border border-green-500/30 rounded-2xl p-8 md:p-12 text-center">
          <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/20">
            <CheckCircle2 size={40} className="text-green-400" />
          </div>
          <h2 className="text-3xl font-black text-green-400 mb-2 uppercase">AUTO-VERIFIED BY AI ENGINE</h2>
          <p className="text-pp-text-muted mb-6 max-w-md mx-auto text-sm">
            Both players&apos; evidence screenshots were analyzed and verified with confidence ({match.verificationConfidence ?? 100}%).
          </p>
          <div className="inline-block p-6 bg-pp-bg rounded-xl border border-pp-border mb-6">
            <span className="block text-[10px] text-pp-text-muted font-bold mb-2 uppercase tracking-widest">VERIFIED OUTCOME</span>
            <span className="text-4xl font-black font-mono text-white uppercase">
              {match.verifiedOutcome === "p1" ? "CREATOR WIN (P1)" : match.verifiedOutcome === "p2" ? "CHALLENGER WIN (P2)" : "DRAW"}
            </span>
          </div>
          <p className="text-xs text-pp-text-muted">Settlement is queued and will execute automatically.</p>
        </div>
      )}

      {/* State: MANUAL_REVIEW */}
      {match.state === "MANUAL_REVIEW" && (
        <div className="bg-pp-surface border border-yellow-500/50 rounded-2xl p-8 md:p-12 text-center">
          <div className="w-20 h-20 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-yellow-500/20">
            <Clock size={40} className="text-yellow-500" />
          </div>
          <h2 className="text-3xl font-black text-yellow-500 mb-2 uppercase">UNDER MANUAL REVIEW</h2>
          <p className="text-pp-text-muted max-w-md mx-auto text-sm mb-4">
            An anomaly or low verification confidence was detected. Platform arbiters are reviewing the immutable evidence records.
          </p>
          {match.resolutionReason && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs font-bold p-3 rounded-lg max-w-md mx-auto">
              Reason: {match.resolutionReason}
            </div>
          )}
        </div>
      )}

      {/* State: DISPUTED */}
      {match.state === "DISPUTED" && (
        <div className="bg-pp-surface border border-red-500/50 rounded-2xl p-8 md:p-12 text-center">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20">
            <AlertTriangle size={40} className="text-red-500" />
          </div>
          <h2 className="text-3xl font-black text-red-500 mb-2 uppercase">RESULT DISPUTED</h2>
          <p className="text-pp-text-muted mb-8 max-w-md mx-auto text-sm">
            Scores submitted by participants or extracted from visual evidence contradicted each other. The market has been locked pending arbiter investigation.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-lg mx-auto text-left mb-6">
            <div className="bg-pp-bg border border-red-500/30 rounded-xl p-5">
              <span className="text-xs text-pp-text-muted font-bold block mb-1">Creator Reported:</span>
              <span className="text-3xl font-black font-mono text-white">{match.p1Score1 ?? "-"} - {match.p1Score2 ?? "-"}</span>
            </div>
            <div className="bg-pp-bg border border-red-500/30 rounded-xl p-5">
              <span className="text-xs text-pp-text-muted font-bold block mb-1">Challenger Reported:</span>
              <span className="text-3xl font-black font-mono text-white">{match.p2Score1 ?? "-"} - {match.p2Score2 ?? "-"}</span>
            </div>
          </div>
          <p className="text-xs text-red-400 font-bold uppercase">
            Disputes are resolved in accordance with immutable Storage evidence.
          </p>
        </div>
      )}

      {/* State: START_EVIDENCE_PROCESSING or END_EVIDENCE_PROCESSING */}
      {(match.state === "START_EVIDENCE_PROCESSING" || match.state === "END_EVIDENCE_PROCESSING") && (
        <div className="bg-pp-surface border border-pp-primary/30 rounded-2xl p-8 md:p-12 text-center mb-8">
          <div className="w-16 h-16 bg-pp-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-pp-primary/20">
            <RefreshCw size={32} className="text-pp-primary animate-spin" />
          </div>
          <h2 className="text-2xl font-black text-white mb-2 uppercase">AI PROCESSING EVIDENCE</h2>
          <p className="text-pp-text-muted text-sm max-w-md mx-auto">
            Evidence uploaded. The AI abstraction layer is extracting visual facts and hashing the image. Deterministic verification will follow.
          </p>
        </div>
      )}

      {/* Active Evidence Upload Section (When in active pre-match or post-match submission phase) */}
      {(isStartPhase || isEndPhase) && match.state !== "COMPLETED" && (
        <div className="space-y-8">
          <EvidenceUpload
            matchId={matchId}
            userId={user.uid}
            phase={isStartPhase ? "START" : "END"}
            onSuccess={() => {
              // Evidence is registered; snapshot updates state in real-time
            }}
          />

          {/* Optional Numeric Score Reporting Form for END Phase */}
          {isEndPhase && (
            <div className="bg-pp-surface border border-pp-border rounded-2xl p-6 md:p-8">
              <h3 className="font-bold text-lg text-white mb-2 uppercase">Self-Report Final Score</h3>
              <p className="text-xs text-pp-text-muted mb-6">
                Both players must report the final score. The AI engine will cross-check this against your uploaded screenshot.
              </p>

              {hasSubmittedScore ? (
                <div className="bg-pp-bg border border-pp-border rounded-xl p-6 text-center">
                  <span className="text-xs text-pp-text-muted font-bold block mb-1">YOUR REPORTED SCORE</span>
                  <span className="text-4xl font-black font-mono text-white">
                    {isCreator ? match.p1Score1 : match.p2Score1} - {isCreator ? match.p1Score2 : match.p2Score2}
                  </span>
                  <span className="text-xs text-pp-primary block mt-2 font-bold">Awaiting opponent confirmation and AI verification.</span>
                </div>
              ) : (
                <form onSubmit={handleScoreSubmit} className="space-y-6">
                  <div className="flex items-center justify-center gap-4 bg-pp-bg p-6 rounded-xl border border-pp-border">
                    <div className="text-center">
                      <label className="text-[10px] text-pp-text-muted font-bold block mb-2 uppercase">Creator</label>
                      <input
                        type="number"
                        min="0"
                        value={reportedScore1}
                        onChange={(e) => setReportedScore1(e.target.value ? Number(e.target.value) : "")}
                        className="w-16 h-16 text-center text-3xl font-black bg-pp-surface border border-pp-primary rounded-lg text-white font-mono"
                        required
                      />
                    </div>
                    <span className="text-2xl font-black text-pp-text-muted mt-5">-</span>
                    <div className="text-center">
                      <label className="text-[10px] text-pp-text-muted font-bold block mb-2 uppercase">Challenger</label>
                      <input
                        type="number"
                        min="0"
                        value={reportedScore2}
                        onChange={(e) => setReportedScore2(e.target.value ? Number(e.target.value) : "")}
                        className="w-16 h-16 text-center text-3xl font-black bg-pp-surface border border-pp-secondary rounded-lg text-white font-mono"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="w-full py-3.5 bg-pp-primary hover:bg-pp-primary-dark text-black font-bold rounded-lg transition-colors text-sm uppercase tracking-wide disabled:opacity-50"
                  >
                    {actionLoading ? "SUBMITTING SCORE..." : "CONFIRM SCORE REPORT"}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
