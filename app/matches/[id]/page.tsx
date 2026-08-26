"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { ShieldCheck, ShieldAlert, Swords } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import VerificationRequiredModal from "@/components/VerificationRequiredModal";

export const dynamic = "force-dynamic";

export default function MatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const matchId = resolvedParams.id;
  const { user, profile, wallet, refreshProfile } = useAuth();
  const router = useRouter();
  
  const [match, setMatch] = useState<any>(null);
  const [market, setMarket] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [joinLoading, setJoinLoading] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyModalAction, setVerifyModalAction] = useState("participate in this match");
  
  const [predictOutcome, setPredictOutcome] = useState<"p1" | "p2" | "draw">("p1");
  const [predictAmount, setPredictAmount] = useState<string>("100");
  const [predictLoading, setPredictLoading] = useState(false);

  const handlePredict = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!profile?.is_verified) {
      setVerifyModalAction("place predictions");
      setShowVerifyModal(true);
      return;
    }

    const amountNum = parseInt(predictAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError("Invalid prediction amount");
      return;
    }
    
    setPredictLoading(true);
    setError("");

    try {
      const { placePredictionAction } = await import("@/app/actions");
      await placePredictionAction(matchId, predictOutcome, amountNum);
      
      await refreshProfile();
      setPredictAmount("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setPredictLoading(false);
    }
  };

  const loadData = async () => {
    try {
      const { data: matchData } = await supabase
        .from("matches")
        .select("*")
        .eq("id", matchId)
        .maybeSingle();

      if (matchData) {
        setMatch({
          id: matchData.id,
          creatorId: matchData.creator_id || matchData.player1_id,
          player1Id: matchData.player1_id || matchData.creator_id,
          player2Id: matchData.player2_id,
          game: matchData.game || "DLS",
          state: matchData.state || "OPEN",
          stake: matchData.stake_amount || matchData.stake || 100,
          ...matchData,
        });
      } else {
        setMatch(null);
      }

      const { data: marketData } = await supabase
        .from("markets")
        .select("*")
        .eq("id", matchId)
        .maybeSingle();

      if (marketData) {
        setMarket({
          id: marketData.id,
          totalPool: marketData.total_pool ?? 0,
          p1Pool: marketData.p1_pool ?? 0,
          p2Pool: marketData.p2_pool ?? 0,
          drawPool: marketData.draw_pool ?? 0,
          status: marketData.status ?? "OPEN",
          ...marketData,
        });
      } else {
        setMarket(null);
      }
    } catch (e) {
      console.error("Error loading match data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`match-${matchId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "matches", filter: `id=eq.${matchId}` },
        () => loadData()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "markets", filter: `id=eq.${matchId}` },
        () => loadData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [matchId]);

  const handleJoinMatch = async () => {
    if (!user) {
      router.push("/login");
      return;
    }

    if (!profile?.is_verified) {
      setVerifyModalAction("join this competitive match");
      setShowVerifyModal(true);
      return;
    }

    setJoinLoading(true);
    setError("");
    try {
      if (match.creatorId === user.id) {
        throw new Error("You cannot join your own match.");
      }
      if (match.state !== "OPEN") {
        throw new Error("This match is no longer open.");
      }

      await supabase
        .from("matches")
        .update({
          player2_id: user.id,
          state: "PLAYER_JOINED",
          updated_at: new Date().toISOString(),
        })
        .eq("id", matchId);

      await supabase.from("match_participants").upsert({
        id: `${matchId}_${user.id}`,
        match_id: matchId,
        user_id: user.id,
        role: "JOINER",
        joined_at: new Date().toISOString(),
      });

      const { createMarketAction } = await import("@/app/actions");
      await createMarketAction(matchId);
      
      await loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setJoinLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-24 text-center">
        <h1 className="text-2xl font-bold text-white mb-4 animate-pulse">Loading Match...</h1>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-24 text-center">
        <h1 className="text-4xl font-black text-red-500 mb-4">MATCH NOT FOUND</h1>
        <p className="text-pp-text-muted mb-8">The match you are looking for does not exist.</p>
        <Link href="/matches" className="text-pp-primary hover:underline font-bold">RETURN TO MATCHES</Link>
      </div>
    );
  }

  const isCreator = user?.id === match.creatorId || user?.id === match.player1Id;
  const isJoined = user?.id === match.player2Id;
  const isOpen = match.state === "OPEN";

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {error && <div className="p-4 mb-8 text-red-400 bg-red-400/10 rounded-lg text-center font-bold">{error}</div>}
      
      {/* Match Header */}
      <div className="bg-pp-surface border border-pp-border rounded-2xl overflow-hidden mb-8 relative">
        <div className="p-4 md:p-8 relative z-10">
          <div className="flex justify-between items-center text-sm font-bold mb-8">
            <span className="bg-white/10 px-3 py-1 rounded text-white uppercase">{match.game}</span>
            <span className="text-pp-text-muted uppercase">MATCH #{match.id.slice(0, 8)}</span>
            <span className="bg-pp-border text-white px-3 py-1 rounded uppercase">
              STATE: {match.state}
            </span>
          </div>

          <div className="flex items-center justify-between mb-8">
            <div className="flex flex-col items-center gap-4 w-5/12">
              <div className="w-20 h-20 md:w-28 md:h-28 rounded-full border-4 border-pp-bg bg-pp-bg flex items-center justify-center text-xl font-bold text-pp-text-muted overflow-hidden">
                {match.player1Id ? match.player1Id.slice(0, 5) : "P1"}
              </div>
              <h2 className="text-xl md:text-2xl font-black text-white text-center mt-2">Creator</h2>
            </div>
            
            <div className="w-2/12 flex flex-col items-center justify-center">
              <div className="text-3xl font-black text-pp-text-muted">VS</div>
            </div>
            
            <div className="flex flex-col items-center gap-4 w-5/12">
              <div className="w-20 h-20 md:w-28 md:h-28 rounded-full border-4 border-pp-bg bg-pp-bg flex items-center justify-center text-xl font-bold text-pp-text-muted overflow-hidden">
                {match.player2Id ? match.player2Id.slice(0, 5) : "?"}
              </div>
              <h2 className="text-xl md:text-2xl font-black text-white text-center mt-2">
                {match.player2Id ? "Challenger" : "Waiting..."}
              </h2>
            </div>
          </div>
          
          <div className="flex justify-center mt-6">
            {!user ? (
              <Link href="/login" className="bg-pp-primary text-black px-8 py-3 rounded-lg font-bold transition-colors">
                LOGIN TO JOIN MATCH
              </Link>
            ) : isOpen && !isCreator ? (
              <button 
                onClick={handleJoinMatch}
                disabled={joinLoading}
                className="bg-pp-primary hover:bg-pp-primary-dark text-black px-8 py-3 rounded-lg font-bold transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <Swords size={20} />
                {joinLoading ? "JOINING..." : "ACCEPT CHALLENGE"}
              </button>
            ) : isCreator && isOpen ? (
              <div className="bg-yellow-500/10 text-yellow-500 border border-yellow-500/30 px-6 py-3 rounded-lg font-bold text-sm flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></div>
                WAITING FOR OPPONENT
              </div>
            ) : (isCreator || isJoined) && !isOpen ? (
              <Link href={`/matches/${matchId}/verify`} className="bg-pp-bg border border-pp-border hover:border-white px-6 py-3 rounded-lg font-bold text-sm transition-colors flex items-center gap-2 text-white">
                <ShieldCheck size={18} className="text-pp-primary" />
                VERIFY RESULTS
              </Link>
            ) : (
              <div className="bg-pp-bg border border-pp-border text-pp-text-muted px-6 py-3 rounded-lg font-bold text-sm">
                MATCH IN PROGRESS
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Match Details Panel */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-pp-surface border border-pp-border rounded-xl p-8">
            <h2 className="text-xl font-bold mb-6 text-white uppercase tracking-wide border-b border-pp-border pb-4">Match Details</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-xs text-pp-text-muted font-bold uppercase mb-1">Game</p>
                <p className="font-bold text-white uppercase">{match.game}</p>
              </div>
              <div>
                <p className="text-xs text-pp-text-muted font-bold uppercase mb-1">Format</p>
                <p className="font-bold text-white uppercase">1v1</p>
              </div>
              <div>
                <p className="text-xs text-pp-text-muted font-bold uppercase mb-1">Entry Fee</p>
                <p className="font-bold text-pp-accent uppercase">{match.stake} PTS</p>
              </div>
              <div>
                <p className="text-xs text-pp-text-muted font-bold uppercase mb-1">Prize Pool</p>
                <p className="font-bold text-pp-primary uppercase">{Math.round(match.stake * 1.9)} PTS</p>
              </div>
            </div>
          </div>

          {/* Prediction Market */}
          {market && (
            <div className="bg-pp-surface border border-pp-primary/30 rounded-xl p-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pp-primary to-pp-accent"></div>
              
              <div className="flex justify-between items-center mb-6 border-b border-pp-border pb-4">
                <h2 className="text-xl font-bold text-white uppercase tracking-wide">Prediction Market</h2>
                <div className="bg-pp-bg px-3 py-1 rounded text-xs font-bold text-pp-primary uppercase">
                  {market.status}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="bg-pp-bg p-4 rounded-lg text-center border border-pp-border">
                  <span className="block text-[10px] text-pp-text-muted font-bold uppercase mb-1">Total Pool</span>
                  <span className="text-xl font-black font-mono text-white">{market.totalPool} PTS</span>
                </div>
                <div className="bg-pp-bg p-4 rounded-lg text-center border border-pp-border">
                  <span className="block text-[10px] text-pp-text-muted font-bold uppercase mb-1">Creator Win (P1)</span>
                  <span className="text-xl font-black font-mono text-white">
                    {market.totalPool ? Math.round((market.p1Pool / market.totalPool) * 100) : 0}%
                  </span>
                </div>
                <div className="bg-pp-bg p-4 rounded-lg text-center border border-pp-border">
                  <span className="block text-[10px] text-pp-text-muted font-bold uppercase mb-1">Challenger Win (P2)</span>
                  <span className="text-xl font-black font-mono text-white">
                    {market.totalPool ? Math.round((market.p2Pool / market.totalPool) * 100) : 0}%
                  </span>
                </div>
              </div>

              {market.status === "OPEN" && user ? (
                <form onSubmit={handlePredict} className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-pp-text-muted mb-3 uppercase tracking-wide">Who will win?</label>
                    <div className="grid grid-cols-3 gap-4">
                      {["p1", "draw", "p2"].map((outcome) => (
                        <button
                          key={outcome}
                          type="button"
                          onClick={() => setPredictOutcome(outcome as any)}
                          className={`py-3 rounded-lg font-bold text-sm uppercase transition-colors border ${
                            predictOutcome === outcome 
                              ? "bg-pp-primary/20 border-pp-primary text-pp-primary" 
                              : "bg-pp-bg border-pp-border text-white hover:border-white/50"
                          }`}
                        >
                          {outcome === "p1" ? "Creator" : outcome === "p2" ? "Challenger" : "Draw"}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                       <label className="block text-sm font-bold text-pp-text-muted uppercase tracking-wide">Amount (PTS)</label>
                       <span className="text-xs text-pp-primary font-bold">Balance: {wallet?.balance ?? 0}</span>
                    </div>
                    <input 
                      type="number" 
                      min="1"
                      value={predictAmount} 
                      onChange={e => setPredictAmount(e.target.value)} 
                      required 
                      className="w-full bg-pp-bg border border-pp-border rounded-lg p-4 text-white focus:outline-none focus:border-pp-primary text-xl font-mono" 
                    />
                  </div>

                  <button 
                    type="submit" 
                    disabled={predictLoading}
                    className="w-full bg-pp-primary text-black font-bold py-4 rounded-lg hover:bg-pp-primary-dark transition-colors uppercase tracking-wide disabled:opacity-50"
                  >
                    {predictLoading ? "PLACING PREDICTION..." : "PLACE PREDICTION"}
                  </button>
                </form>
              ) : market.status === "OPEN" ? (
                 <div className="text-center p-6 bg-pp-bg rounded-lg border border-pp-border">
                   <p className="text-pp-text-muted mb-4 font-bold">Log in to participate in the prediction market.</p>
                   <Link href="/login" className="bg-pp-primary text-black px-6 py-2 rounded-lg font-bold">LOGIN</Link>
                 </div>
              ) : (
                 <div className="text-center p-6 bg-pp-bg rounded-lg border border-pp-border font-bold text-pp-text-muted uppercase">
                   Market is currently {market.status}.
                 </div>
              )}
            </div>
          )}
        </div>

        {/* Info Sidebar */}
        <div className="space-y-6">
          <div className="bg-pp-bg border border-pp-border rounded-xl p-6 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10">
                <ShieldAlert size={100} />
             </div>
             <h3 className="font-bold text-white mb-2 relative z-10">Verified Matches</h3>
             <p className="text-sm text-pp-text-muted mb-4 relative z-10">
               All matches on PredictPlay are verified by both players submitting evidence. False reporting results in an immediate ban.
             </p>
             <Link href="/community" className="text-sm font-bold text-pp-primary hover:underline relative z-10">
               Read our verification policy
             </Link>
          </div>
        </div>

      </div>

      <VerificationRequiredModal
        isOpen={showVerifyModal}
        onClose={() => setShowVerifyModal(false)}
        actionName={verifyModalAction}
      />
    </div>
  );
}
