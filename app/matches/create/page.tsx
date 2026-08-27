"use client";

import { useState } from "react";
import Link from "next/link";
import { Copy, Check } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import ComingSoonModal from "@/components/ComingSoonModal";
import VerificationRequiredModal from "@/components/VerificationRequiredModal";

export default function CreateMatchPage() {
  const { user, profile } = useAuth();
  const [created, setCreated] = useState(false);
  const [matchId, setMatchId] = useState("");
  const [copied, setCopied] = useState(false);
  const [game, setGame] = useState("dls");
  const [stake, setStake] = useState(100);
  const [error, setError] = useState("");
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isAdmin = profile?.role === "admin" || profile?.is_admin === true;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError("You must be logged in to create a match.");
      return;
    }

    // ADMIN/DEV BYPASS — for testing purposes:
    // Admins can create matches even without profile verification.
    if (!isAdmin && !profile?.is_verified) {
      setShowVerifyModal(true);
      return;
    }
    
    if (game === "efootball") {
      setShowComingSoon(true);
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const { createMatchAction } = await import("@/app/actions");
      const res = await createMatchAction({
        game: "DLS",
        stakeAmount: Number(stake),
      });

      if (res?.matchId) {
        setMatchId(res.matchId);
        setCreated(true);
      }
    } catch (err: any) {
      setError(err.message || "Failed to create match");
    } finally {
      setSubmitting(false);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(matchId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!user) {
    return <div className="text-center p-12">Please login first.</div>;
  }

  if (created) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-pp-surface border border-pp-primary/30 rounded-xl p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pp-primary to-pp-accent"></div>
          
          <h2 className="text-2xl font-bold mb-2">MATCH CREATED!</h2>
          <p className="text-pp-text-muted mb-8">Match ID: #{matchId.slice(0, 8)}</p>
          
          <div className="flex flex-col items-center mb-8">
            <h3 className="font-bold text-xl">Waiting for challenger...</h3>
            <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-yellow-500/10 text-yellow-500 rounded-full text-sm font-medium border border-yellow-500/20">
               <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></div>
               OPEN CHALLENGE
            </div>
          </div>

          <div className="bg-pp-bg rounded-lg p-6 mb-8 border border-pp-border">
            <p className="text-sm text-pp-text-muted mb-3 uppercase font-bold tracking-wider">Share Match Code</p>
            <div className="flex items-center justify-center gap-3">
              <span className="text-4xl font-mono font-black tracking-widest text-white">{matchId.slice(0, 8)}</span>
              <button 
                onClick={copyCode}
                className="p-3 bg-pp-surface hover:bg-pp-surface-hover rounded-lg transition-colors border border-pp-border text-pp-text-muted hover:text-white"
                title="Copy Code"
              >
                {copied ? <Check size={24} className="text-pp-primary" /> : <Copy size={24} />}
              </button>
            </div>
          </div>

          <Link href={`/matches/${matchId}`} className="inline-block px-8 py-4 bg-pp-primary text-black font-bold rounded-lg hover:bg-pp-primary-dark transition-colors w-full sm:w-auto">
            GO TO MATCH LOBBY
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-extrabold tracking-tight mb-8">CREATE MATCH</h1>
      
      {error && <div className="p-4 mb-4 text-red-400 bg-red-400/10 rounded-lg">{error}</div>}

      <form onSubmit={handleCreate} className="bg-pp-surface border border-pp-border rounded-xl p-6 md:p-8 space-y-6">
        {/* Game Selection */}
        <div>
          <label className="block text-sm font-bold text-pp-text-muted mb-3">GAME</label>
          <div className="grid grid-cols-2 gap-4">
            <label className="cursor-pointer relative">
              <input type="radio" name="game" value="dls" checked={game === "dls"} onChange={(e) => setGame(e.target.value)} className="peer sr-only" />
              <div className="p-4 bg-pp-bg border border-pp-border rounded-lg text-center peer-checked:border-pp-primary peer-checked:bg-pp-primary/5 transition-all">
                <span className="font-bold block text-white">Dream League Soccer</span>
                <span className="text-[10px] text-pp-primary font-bold uppercase mt-1 inline-block">Active</span>
              </div>
              <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-pp-primary opacity-0 peer-checked:opacity-100 transition-opacity"></div>
            </label>

            <div 
              onClick={() => setShowComingSoon(true)}
              className="cursor-pointer relative p-4 bg-pp-bg/60 border border-pp-border rounded-lg text-center hover:border-pp-primary/40 transition-all"
            >
              <span className="font-bold block text-white/70">eFootball</span>
              <span className="text-[10px] bg-yellow-500/20 text-yellow-400 font-bold uppercase px-2 py-0.5 rounded mt-1 inline-block">
                Coming Soon
              </span>
            </div>
          </div>
        </div>

        {/* Entry Fee */}
        <div>
          <label className="block text-sm font-bold text-pp-text-muted mb-3">ENTRY FEE (VIRTUAL POINTS)</label>
          <div className="relative">
            <input 
              type="number" 
              value={stake}
              onChange={(e) => setStake(Number(e.target.value))}
              min={10}
              className="w-full bg-pp-bg border border-pp-border rounded-lg p-3 pl-4 text-white focus:outline-none focus:border-pp-primary transition-colors font-mono font-bold text-lg"
            />
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
              <span className="text-pp-primary font-bold">PTS</span>
            </div>
          </div>
        </div>

        <button 
          type="submit" 
          disabled={submitting}
          className="w-full py-4 bg-pp-primary text-black font-bold rounded-lg hover:bg-pp-primary-dark transition-colors mt-4 text-lg disabled:opacity-50"
        >
          {submitting ? "CREATING MATCH..." : "CREATE MATCH"}
        </button>
      </form>

      <ComingSoonModal
        isOpen={showComingSoon}
        onClose={() => setShowComingSoon(false)}
        title="eFootball Matches Coming Soon"
        description="eFootball match lobbies and AI result verification are currently in final integration. Dream League Soccer (DLS) is live and ready to play!"
      />

      <VerificationRequiredModal
        isOpen={showVerifyModal}
        onClose={() => setShowVerifyModal(false)}
        actionName="create a matchmaking challenge"
      />
    </div>
  );
}
