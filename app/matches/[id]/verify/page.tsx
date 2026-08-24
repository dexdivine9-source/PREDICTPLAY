"use client";

import { useState, use, useEffect } from "react";
import Link from "next/link";
import { ShieldAlert, ShieldCheck, Check, UploadCloud, AlertTriangle, Play } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, setDoc, serverTimestamp, runTransaction, onSnapshot } from "firebase/firestore";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";

export const dynamic = "force-dynamic";

export default function MatchVerificationPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const matchId = resolvedParams.id;
  
  const { user } = useAuth();
  const router = useRouter();
  
  const [match, setMatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  
  const [reportedScore1, setReportedScore1] = useState<number | ''>('');
  const [reportedScore2, setReportedScore2] = useState<number | ''>('');
  const [evidenceUrl, setEvidenceUrl] = useState("");

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
    return <div className="p-24 text-center font-bold">You are not a participant in this match.</div>;
  }

  const hasSubmitted = isCreator ? match.p1Submitted : match.p2Submitted;
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (reportedScore1 === '' || reportedScore2 === '') return;
    
    setActionLoading(true);
    setError("");

    try {
      const { submitMatchResultAction } = await import("@/app/actions");
      await submitMatchResultAction(matchId, reportedScore1, reportedScore2, evidenceUrl);
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitEvidence = async () => {
    if (!evidenceUrl) {
      setError("Please provide an evidence URL first.");
      return;
    }
    setActionLoading(true);
    try {
      const updateData: any = { state: "MANUAL_REVIEW" };
      if (isCreator) updateData.p1Evidence = evidenceUrl;
      else updateData.p2Evidence = evidenceUrl;
      
      await updateDoc(doc(db, "matches", matchId), updateData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <div className="mb-8">
        <Link href={`/matches/${matchId}`} className="text-sm text-pp-primary hover:underline font-bold uppercase tracking-wide">
          &larr; Back to Match Lobby
        </Link>
        <h1 className="text-3xl font-extrabold tracking-tight mt-4 uppercase">VERIFY RESULT</h1>
        <p className="text-pp-text-muted mt-2">Submit your final match outcome securely.</p>
      </div>

      {error && <div className="p-4 mb-8 text-red-400 bg-red-400/10 rounded-lg text-center font-bold">{error}</div>}

      {match.state === "COMPLETED" ? (
        <div className="bg-pp-surface border border-pp-primary/30 rounded-2xl p-6 md:p-10 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pp-primary to-pp-accent"></div>
          
          <div className="w-20 h-20 bg-pp-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-pp-primary/20">
            <ShieldCheck size={40} className="text-pp-primary" />
          </div>
          <h2 className="text-3xl font-black text-white mb-2 uppercase">MATCH VERIFIED</h2>
          <p className="text-pp-text-muted mb-8 max-w-md mx-auto text-sm">
            Consensus reached. Player ratings have been updated and virtual points have been paid out.
          </p>

          <div className="flex justify-center items-center gap-8 mb-8 p-6 bg-pp-bg rounded-xl border border-pp-border">
            <div className="text-center">
              <span className="block text-[10px] text-pp-text-muted font-bold mb-2 uppercase tracking-widest">OFFICIAL SCORE</span>
              <span className="text-5xl font-black font-mono text-white">{match.finalScore1} - {match.finalScore2}</span>
            </div>
          </div>

          <Link href={`/profile`} className="inline-block px-8 py-4 bg-pp-primary text-black font-bold rounded-lg hover:bg-pp-primary-dark transition-colors w-full sm:w-auto uppercase tracking-wide">
            VIEW YOUR UPDATED RANKING
          </Link>
        </div>
      ) : match.state === "MANUAL_REVIEW" ? (
         <div className="bg-pp-surface border border-yellow-500/50 rounded-2xl p-6 md:p-10 text-center">
          <div className="w-20 h-20 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-yellow-500/20">
            <ShieldAlert size={40} className="text-yellow-500" />
          </div>
          <h2 className="text-3xl font-black text-yellow-500 mb-2 uppercase">ADMIN REVIEW</h2>
          <p className="text-pp-text-muted max-w-md mx-auto text-sm">
            This match is currently under manual review by an admin. We are analyzing the submitted evidence to resolve the dispute.
          </p>
         </div>
      ) : match.state === "DISPUTED" ? (
        <div className="bg-pp-surface border border-red-500/50 rounded-2xl p-6 md:p-10 text-center">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20">
            <AlertTriangle size={40} className="text-red-500" />
          </div>
          <h2 className="text-3xl font-black text-red-500 mb-2 uppercase">RESULT DISPUTED</h2>
          <p className="text-pp-text-muted mb-8 max-w-md mx-auto text-sm">
            The results submitted by both players do not match. Please upload your evidence (screenshot/video link) for manual review.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 text-left">
            <div className="bg-pp-bg border border-red-500/30 rounded-xl p-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-red-500/50"></div>
              <div className="flex items-center gap-3 mb-4">
                <span className="font-bold text-sm text-white">Creator reported:</span>
              </div>
              <div className="text-4xl font-black font-mono text-center text-white">{match.p1Score1} - {match.p1Score2}</div>
            </div>
            <div className="bg-pp-bg border border-red-500/30 rounded-xl p-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-red-500/50"></div>
              <div className="flex items-center gap-3 mb-4">
                <span className="font-bold text-sm text-white">Challenger reported:</span>
              </div>
              <div className="text-4xl font-black font-mono text-center text-white">{match.p2Score1} - {match.p2Score2}</div>
            </div>
          </div>

          <div className="space-y-4">
            <input 
              type="text" 
              placeholder="Paste Evidence URL (e.g. Imgur, YouTube)"
              value={evidenceUrl}
              onChange={e => setEvidenceUrl(e.target.value)}
              className="w-full bg-pp-bg border border-pp-border rounded-lg p-4 text-white focus:outline-none focus:border-red-500"
            />
            <button 
              onClick={handleSubmitEvidence}
              disabled={actionLoading}
              className="w-full py-4 bg-red-500 text-white font-bold rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center gap-2 uppercase tracking-wide text-sm disabled:opacity-50"
            >
              <UploadCloud size={20} />
              {actionLoading ? "SUBMITTING..." : "SUBMIT EVIDENCE FOR REVIEW"}
            </button>
            <p className="text-xs text-red-500/80 font-bold uppercase text-center mt-2">
              Failure to provide evidence will result in an automatic forfeit and reputation penalty.
            </p>
          </div>
        </div>
      ) : hasSubmitted ? (
        <div className="bg-pp-surface border border-pp-border rounded-2xl p-6 md:p-10 text-center">
          <div className="w-20 h-20 bg-pp-bg rounded-full flex items-center justify-center mx-auto mb-6 border border-pp-border">
            <div className="w-8 h-8 rounded-full border-t-2 border-r-2 border-pp-primary animate-spin"></div>
          </div>
          <h2 className="text-3xl font-black text-white mb-2 uppercase">AWAITING OPPONENT</h2>
          <p className="text-pp-text-muted mb-8 max-w-md mx-auto text-sm">
            You have successfully submitted your results. We are waiting for your opponent to confirm.
          </p>
          <div className="text-center bg-pp-bg p-6 rounded-xl inline-block mx-auto border border-pp-border">
             <span className="block text-[10px] text-pp-text-muted font-bold mb-2 uppercase tracking-widest">YOUR SUBMISSION</span>
             <span className="text-4xl font-black font-mono text-white">
                {isCreator ? match.p1Score1 : match.p2Score1} - {isCreator ? match.p1Score2 : match.p2Score2}
             </span>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-pp-surface border border-pp-border rounded-2xl p-6 md:p-10">
          
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-8 flex items-start gap-4">
            <ShieldAlert className="text-red-500 flex-shrink-0 mt-0.5" size={24} />
            <div>
              <h4 className="text-red-500 font-bold text-sm uppercase">Trust System Warning</h4>
              <p className="text-red-200/80 text-xs mt-1">Submit only the exact, true final score. Falsifying results triggers an automatic dispute. If found guilty by admin review, your Reputation Score will be permanently zeroed, and your account will face a matchmaking ban.</p>
            </div>
          </div>

          <div className="flex items-center justify-between mb-10 bg-pp-bg p-6 rounded-xl border border-pp-border">
            <div className="flex flex-col items-center gap-4 w-1/3">
              <div className="w-16 h-16 rounded-full border-2 border-pp-primary bg-pp-surface flex items-center justify-center font-bold text-xs overflow-hidden">
                {match.player1Id.slice(0, 5)}
              </div>
              <h2 className="font-bold text-white text-center">Creator</h2>
            </div>
            
            <div className="w-1/3 flex flex-col items-center justify-center">
              <div className="text-sm font-bold text-pp-text-muted mb-4 uppercase tracking-widest">Final Score</div>
              <div className="flex items-center gap-4">
                <input 
                  type="number" 
                  min="0"
                  value={reportedScore1}
                  onChange={(e) => setReportedScore1(e.target.value ? Number(e.target.value) : '')}
                  className="w-16 h-20 text-center text-4xl font-black bg-pp-surface border border-pp-primary rounded-lg focus:outline-none focus:border-pp-primary transition-colors text-white font-mono shadow-inner"
                  required
                />
                <span className="text-2xl font-black text-pp-text-muted">-</span>
                <input 
                  type="number" 
                  min="0"
                  value={reportedScore2}
                  onChange={(e) => setReportedScore2(e.target.value ? Number(e.target.value) : '')}
                  className="w-16 h-20 text-center text-4xl font-black bg-pp-surface border border-pp-secondary rounded-lg focus:outline-none focus:border-pp-secondary transition-colors text-white font-mono shadow-inner"
                  required
                />
              </div>
            </div>
            
            <div className="flex flex-col items-center gap-4 w-1/3">
              <div className="w-16 h-16 rounded-full border-2 border-pp-secondary bg-pp-surface flex items-center justify-center font-bold text-xs overflow-hidden">
                {match.player2Id.slice(0, 5)}
              </div>
              <h2 className="font-bold text-white text-center">Challenger</h2>
            </div>
          </div>

          <div className="mb-8">
            <label className="block text-sm font-bold text-pp-text-muted mb-3 uppercase tracking-wide">MATCH EVIDENCE (OPTIONAL)</label>
            <input 
              type="text" 
              placeholder="Paste Evidence URL (e.g. Imgur link to screenshot)"
              value={evidenceUrl}
              onChange={e => setEvidenceUrl(e.target.value)}
              className="w-full bg-pp-bg border border-pp-border rounded-lg p-4 text-white focus:outline-none focus:border-pp-primary transition-colors"
            />
            <p className="text-[10px] font-bold text-pp-text-muted mt-3 uppercase tracking-wide">
              Evidence is highly recommended to protect your reputation in case of a dispute.
            </p>
          </div>

          <button 
            type="submit" 
            disabled={actionLoading}
            className="w-full py-4 bg-pp-primary text-black font-bold rounded-lg hover:bg-pp-primary-dark transition-colors text-lg uppercase tracking-wide disabled:opacity-50"
          >
            {actionLoading ? "SUBMITTING..." : "CONFIRM & SUBMIT RESULT"}
          </button>
        </form>
      )}
    </div>
  );
}

