"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { 
  Sparkles, 
  ShieldCheck, 
  Swords, 
  ArrowLeft, 
  Clock, 
  TrendingUp, 
  Users, 
  CheckCircle2, 
  XCircle,
  AlertCircle
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import VerificationRequiredModal from "@/components/VerificationRequiredModal";

export const dynamic = "force-dynamic";

export default function LiveMatchPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const matchId = resolvedParams.id;
  const { user, profile, wallet, refreshProfile } = useAuth();
  const router = useRouter();

  const [match, setMatch] = useState<any>(null);
  const [market, setMarket] = useState<any>(null);
  const [p1Profile, setP1Profile] = useState<any>(null);
  const [p2Profile, setP2Profile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [predictOutcome, setPredictOutcome] = useState<"yes" | "no">("yes");
  const [predictAmount, setPredictAmount] = useState<string>("100");
  const [predictLoading, setPredictLoading] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);

  const loadData = async () => {
    try {
      const { data: matchData } = await supabase
        .from("matches")
        .select("*")
        .eq("id", matchId)
        .maybeSingle();

      if (matchData) {
        setMatch(matchData);

        // Fetch player profiles
        const { data: players } = await supabase
          .from("player_profiles")
          .select("id, username, gamertag, reputation, game")
          .in("id", [matchData.player1_id, matchData.player2_id]);

        if (players) {
          setP1Profile(players.find((p) => p.id === matchData.player1_id));
          setP2Profile(players.find((p) => p.id === matchData.player2_id));
        }
      } else {
        setMatch(null);
      }

      const { data: marketData } = await supabase
        .from("markets")
        .select("*")
        .eq("id", matchId)
        .maybeSingle();

      if (marketData) {
        setMarket(marketData);
      }
    } catch (e) {
      console.error("Error loading live match data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Subscribe to realtime updates on matches and markets
    const channel = supabase
      .channel(`live-match-${matchId}`)
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

  const handlePredict = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push("/login");
      return;
    }

    const isAdmin = profile?.role === "admin" || profile?.is_admin === true;

    // ADMIN/DEV BYPASS — for testing purposes:
    // Admins are exempt from the profile verification requirement when predicting.
    if (!isAdmin && !profile?.is_verified) {
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
    setSuccessMessage("");

    try {
      const { placePredictionAction } = await import("@/app/actions");
      const res = await placePredictionAction(matchId, predictOutcome, amountNum);
      if (!res.success) {
        setError(res.error || "Failed to place prediction");
        return;
      }

      setSuccessMessage(`Placed ${amountNum} PTS prediction on ${predictOutcome.toUpperCase()}!`);
      await refreshProfile();
      await loadData();
      setPredictAmount("100");
    } catch (err: any) {
      setError(err.message || "Failed to place prediction");
    } finally {
      setPredictLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-4 border-pp-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-bold text-pp-text-muted">Loading Live Prediction Market...</p>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="p-8 bg-pp-surface border border-pp-border rounded-2xl">
          <h2 className="text-xl font-bold mb-2 text-white">Live Match Not Found</h2>
          <p className="text-sm text-pp-text-muted mb-6">This curated match may have concluded or been removed.</p>
          <Link href="/markets" className="px-6 py-2.5 bg-pp-primary text-black font-bold rounded-xl text-xs uppercase">
            Browse All Markets
          </Link>
        </div>
      </div>
    );
  }

  const totalPool = market?.total_pool || 0;
  const yesPool = market?.yes_pool || 0;
  const noPool = market?.no_pool || 0;

  const yesPercent = totalPool > 0 ? Math.round((yesPool / totalPool) * 100) : 50;
  const noPercent = totalPool > 0 ? Math.round((noPool / totalPool) * 100) : 50;

  const p1Name = p1Profile?.gamertag || p1Profile?.username || "Player 1";
  const p2Name = p2Profile?.gamertag || p2Profile?.username || "Player 2";
  const question = market?.question || match?.question || `Will ${p1Name} defeat ${p2Name}?`;

  const isMarketOpen = market?.status === "OPEN";

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* Top Breadcrumb */}
      <div className="mb-6 flex items-center justify-between">
        <Link 
          href="/markets" 
          className="inline-flex items-center gap-2 text-xs font-bold text-pp-text-muted hover:text-white uppercase tracking-wider transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Back to Markets</span>
        </Link>

        <span className="inline-flex items-center gap-2 px-3 py-1 bg-red-500/10 text-red-400 border border-red-500/30 rounded-full text-xs font-black uppercase tracking-wider">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          Live Curated Match
        </span>
      </div>

      {/* Main Banner Card */}
      <div className="bg-pp-surface border border-pp-primary/30 rounded-3xl p-6 md:p-10 mb-8 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pp-primary via-amber-400 to-pp-accent" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 border-b border-pp-border pb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">
              <Sparkles size={16} />
              <span>Official Curated Prediction Market</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight uppercase">
              {p1Name} <span className="text-pp-text-muted font-normal text-2xl">vs</span> {p2Name}
            </h1>
            <p className="text-xs text-pp-text-muted mt-1 uppercase tracking-wider">
              Game: <span className="text-white font-bold">{match.game || "DLS"}</span> • Format: <span className="text-white font-bold">1v1 Competitive</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-pp-bg px-4 py-2 rounded-xl border border-pp-border text-center">
              <span className="block text-[10px] font-bold text-pp-text-muted uppercase tracking-wider">Total Pool</span>
              <span className="text-xl font-black font-mono text-pp-primary">{totalPool} PTS</span>
            </div>
          </div>
        </div>

        {/* Market Question Box */}
        <div className="bg-pp-bg/90 border border-pp-border rounded-2xl p-6 mb-8 text-center relative">
          <span className="inline-block px-3 py-1 bg-pp-primary/10 border border-pp-primary/30 text-pp-primary text-[11px] font-extrabold uppercase tracking-wider rounded-full mb-3">
            Market Question
          </span>
          <h2 className="text-2xl font-black text-white leading-snug">
            "{question}"
          </h2>
        </div>

        {/* Live Probability Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-end mb-2">
            <div className="text-left">
              <span className="text-xs font-black text-green-400 uppercase tracking-wider">YES</span>
              <div className="text-2xl font-black text-white font-mono">{yesPercent}%</div>
              <span className="text-[11px] text-pp-text-muted">{yesPool} PTS</span>
            </div>
            <div className="text-right">
              <span className="text-xs font-black text-red-400 uppercase tracking-wider">NO</span>
              <div className="text-2xl font-black text-white font-mono">{noPercent}%</div>
              <span className="text-[11px] text-pp-text-muted">{noPool} PTS</span>
            </div>
          </div>

          {/* Dual bar */}
          <div className="w-full h-4 bg-pp-bg rounded-full overflow-hidden flex border border-pp-border p-0.5">
            <div 
              style={{ width: `${yesPercent}%` }} 
              className="bg-green-500 h-full rounded-l-full transition-all duration-500" 
            />
            <div 
              style={{ width: `${noPercent}%` }} 
              className="bg-red-500 h-full rounded-r-full transition-all duration-500" 
            />
          </div>
        </div>

        {/* Prediction Form or Status */}
        {isMarketOpen ? (
          <form onSubmit={handlePredict} className="bg-pp-bg border border-pp-border rounded-2xl p-6 space-y-6">
            <h3 className="text-sm font-black text-white uppercase tracking-wider">
              Place Your Prediction
            </h3>

            {error && (
              <div className="p-3.5 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl">
                {error}
              </div>
            )}

            {successMessage && (
              <div className="p-3.5 bg-green-500/10 border border-green-500/30 text-green-400 text-sm rounded-xl flex items-center gap-2">
                <CheckCircle2 size={16} />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Outcome Selection Buttons */}
            <div>
              <label className="block text-xs font-bold text-pp-text-muted uppercase tracking-wider mb-3">
                Select Prediction Outcome
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setPredictOutcome("yes")}
                  className={`p-4 rounded-xl border font-black text-base uppercase transition-all flex flex-col items-center gap-1 ${
                    predictOutcome === "yes"
                      ? "bg-green-500/20 border-green-500 text-green-400 shadow-lg shadow-green-500/10 scale-[1.02]"
                      : "bg-pp-surface border-pp-border text-white hover:border-slate-500"
                  }`}
                >
                  <span>YES</span>
                  <span className="text-[11px] font-normal text-pp-text-muted">Target outcome occurs</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPredictOutcome("no")}
                  className={`p-4 rounded-xl border font-black text-base uppercase transition-all flex flex-col items-center gap-1 ${
                    predictOutcome === "no"
                      ? "bg-red-500/20 border-red-500 text-red-400 shadow-lg shadow-red-500/10 scale-[1.02]"
                      : "bg-pp-surface border-pp-border text-white hover:border-slate-500"
                  }`}
                >
                  <span>NO</span>
                  <span className="text-[11px] font-normal text-pp-text-muted">Target outcome fails</span>
                </button>
              </div>
            </div>

            {/* Stake Amount */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold text-pp-text-muted uppercase tracking-wider">
                  Stake Amount (Virtual Points)
                </label>
                <span className="text-xs font-bold text-pp-primary">
                  Balance: {wallet?.balance ?? 0} PTS
                </span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  value={predictAmount}
                  onChange={(e) => setPredictAmount(e.target.value)}
                  required
                  className="w-full bg-pp-surface border border-pp-border rounded-xl p-4 text-white font-mono font-bold text-lg focus:outline-none focus:border-pp-primary"
                />
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                  <span className="text-pp-primary font-black text-sm">PTS</span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={predictLoading}
              className="w-full py-4 bg-pp-primary text-black font-extrabold rounded-xl hover:bg-pp-primary-dark active:scale-[0.99] transition-all text-sm uppercase tracking-wide disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-pp-primary/20"
            >
              {predictLoading ? "Processing Prediction..." : `Confirm Prediction on ${predictOutcome.toUpperCase()}`}
            </button>
          </form>
        ) : (
          <div className="bg-pp-bg border border-pp-border rounded-2xl p-6 text-center">
            <span className="inline-block px-3 py-1 bg-amber-500/10 text-amber-400 rounded-full text-xs font-black uppercase mb-2">
              Market {market?.status || "Closed"}
            </span>
            <p className="text-sm text-pp-text-muted">
              Predictions for this market are currently locked or settled.
            </p>
          </div>
        )}
      </div>

      <VerificationRequiredModal
        isOpen={showVerifyModal}
        onClose={() => setShowVerifyModal(false)}
        actionName="participate in live prediction markets"
      />
    </div>
  );
}
