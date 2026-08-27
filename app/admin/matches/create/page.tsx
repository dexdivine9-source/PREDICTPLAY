"use client";

import { useState, useEffect } from "react";
import { 
  Swords, 
  ShieldCheck, 
  PlaySquare, 
  Search, 
  Clock, 
  Users, 
  Gamepad2, 
  CheckCircle2, 
  FileCheck2, 
  Shield, 
  Sparkles,
  ArrowRight,
  HelpCircle,
  Calendar,
  AlertCircle
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { checkIsAdminAction } from "@/app/admin-actions";
import { createAdminMatchAction } from "@/app/admin-actions";

interface PlayerOption {
  id: string;
  username: string;
  gamertag: string;
  isVerified: boolean;
  game: string;
  reputation: number;
}

export default function AdminCurateMatchPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [players, setPlayers] = useState<PlayerOption[]>([]);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form states
  const [player1Id, setPlayer1Id] = useState("");
  const [player2Id, setPlayer2Id] = useState("");
  const [game, setGame] = useState("DLS");
  const [scheduledStartTime, setScheduledStartTime] = useState("");
  const [customQuestion, setCustomQuestion] = useState("");
  
  const [searchP1, setSearchP1] = useState("");
  const [searchP2, setSearchP2] = useState("");

  useEffect(() => {
    async function init() {
      try {
        const adminCheck = await checkIsAdminAction();
        setIsAdmin(adminCheck.isAdmin);

        if (adminCheck.isAdmin) {
          const { data } = await supabase
            .from("player_profiles")
            .select("id, username, gamertag, is_verified, game, reputation")
            .order("username", { ascending: true })
            .limit(100);

          if (data) {
            setPlayers(
              data.map((p) => ({
                id: p.id,
                username: p.username || "Unknown",
                gamertag: p.gamertag || p.username || "Player",
                isVerified: Boolean(p.is_verified),
                game: p.game || "DLS",
                reputation: p.reputation ?? 100,
              }))
            );
          }
        }
      } catch (err) {
        console.error("Admin check error:", err);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const selectedP1 = players.find((p) => p.id === player1Id);
  const selectedP2 = players.find((p) => p.id === player2Id);

  const defaultQuestion = selectedP1 && selectedP2 
    ? `Will ${selectedP1.gamertag} defeat ${selectedP2.gamertag}?` 
    : "Will Player 1 defeat Player 2?";

  const activeQuestion = customQuestion.trim() || defaultQuestion;

  const handleLaunch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!player1Id || !player2Id) {
      setStatusMessage({ type: "error", text: "Please select both Player 1 and Player 2." });
      return;
    }
    if (player1Id === player2Id) {
      setStatusMessage({ type: "error", text: "Player 1 and Player 2 must be different players." });
      return;
    }

    setSubmitting(true);
    setStatusMessage(null);

    try {
      const res = await createAdminMatchAction({
        player1Id,
        player2Id,
        game,
        scheduledStartTime: scheduledStartTime || undefined,
        question: activeQuestion,
      });

      if (!res.success) {
        setStatusMessage({ type: "error", text: res.error || "Failed to curate match." });
        return;
      }

      setStatusMessage({
        type: "success",
        text: "Curated match created! Redirecting to live prediction market...",
      });

      setTimeout(() => {
        if (res.matchId) {
          router.push(`/live/${res.matchId}`);
        }
      }, 1200);
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "An unexpected error occurred." });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-4 border-pp-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-bold text-pp-text-muted">Loading Admin Portal...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="text-center p-8 bg-pp-surface border border-red-500/30 rounded-2xl max-w-md w-full shadow-2xl">
          <h2 className="text-2xl font-black text-white mb-2 uppercase">Access Restricted</h2>
          <p className="text-sm text-pp-text-muted mb-6">You must be logged in as an authorized administrator to access the Curate Match console.</p>
          <Link href="/" className="px-6 py-2.5 bg-pp-primary text-black font-bold rounded-xl text-xs uppercase">Return Home</Link>
        </div>
      </div>
    );
  }

  const filteredP1 = players.filter(
    (p) =>
      p.id !== player2Id &&
      (p.username.toLowerCase().includes(searchP1.toLowerCase()) ||
       p.gamertag.toLowerCase().includes(searchP1.toLowerCase()))
  );

  const filteredP2 = players.filter(
    (p) =>
      p.id !== player1Id &&
      (p.username.toLowerCase().includes(searchP2.toLowerCase()) ||
       p.gamertag.toLowerCase().includes(searchP2.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">
            <Sparkles size={16} />
            <span>Admin Matchmaker Console</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase">
            Curate Live Prediction Match
          </h1>
          <p className="text-sm text-pp-text-muted mt-1">
            Pair two competitive players and immediately open a high-visibility YES/NO prediction market for all platform players.
          </p>
        </div>
      </div>

      {/* Admin Sub-navigation Tabs */}
      <div className="flex items-center gap-3 mb-8 border-b border-pp-border pb-4 overflow-x-auto">
        <Link
          href="/admin/matches/create"
          className="px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider bg-pp-primary text-black transition-all flex items-center gap-2 shadow-md shadow-pp-primary/20 flex-shrink-0"
        >
          <Swords size={16} />
          <span>Curate Live Match</span>
        </Link>
        <Link
          href="/admin/verifications"
          className="px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider text-pp-text-muted hover:text-white hover:bg-pp-surface transition-all flex items-center gap-2 border border-transparent flex-shrink-0"
        >
          <FileCheck2 size={16} />
          <span>Player Verifications</span>
        </Link>
        <Link
          href="/admin/users"
          className="px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider text-pp-text-muted hover:text-white hover:bg-pp-surface transition-all flex items-center gap-2 border border-transparent flex-shrink-0"
        >
          <Shield size={16} />
          <span>Manage Admins</span>
        </Link>
      </div>

      {/* Status toast message */}
      {statusMessage && (
        <div
          className={`mb-6 p-4 rounded-xl text-sm flex items-center gap-3 border ${
            statusMessage.type === "success"
              ? "bg-green-500/10 border-green-500/30 text-green-400"
              : "bg-red-500/10 border-red-500/30 text-red-400"
          }`}
        >
          {statusMessage.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Form */}
        <form onSubmit={handleLaunch} className="lg:col-span-2 space-y-6">
          <div className="bg-pp-surface border border-pp-border rounded-2xl p-6 md:p-8 space-y-6 shadow-xl">
            <h2 className="text-lg font-black text-white uppercase tracking-wide border-b border-pp-border pb-3 flex items-center gap-2">
              <Users size={20} className="text-pp-primary" />
              <span>1. Select Competitors</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Player 1 Selection */}
              <div>
                <label className="block text-xs font-bold text-pp-primary uppercase tracking-wider mb-2">
                  Player 1 (Primary / YES Focus)
                </label>
                <div className="relative mb-2">
                  <Search size={14} className="absolute left-3 top-3.5 text-pp-text-muted" />
                  <input
                    type="text"
                    placeholder="Search player 1..."
                    value={searchP1}
                    onChange={(e) => setSearchP1(e.target.value)}
                    className="w-full bg-pp-bg border border-pp-border rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder:text-pp-text-muted/60 focus:outline-none focus:border-pp-primary"
                  />
                </div>
                <select
                  value={player1Id}
                  onChange={(e) => setPlayer1Id(e.target.value)}
                  required
                  className="w-full bg-pp-bg border border-pp-border rounded-xl p-3 text-sm text-white focus:outline-none focus:border-pp-primary"
                >
                  <option value="">-- Choose Player 1 --</option>
                  {filteredP1.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.gamertag} ({p.username}) {p.isVerified ? "✓ Verified" : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Player 2 Selection */}
              <div>
                <label className="block text-xs font-bold text-red-400 uppercase tracking-wider mb-2">
                  Player 2 (Challenger)
                </label>
                <div className="relative mb-2">
                  <Search size={14} className="absolute left-3 top-3.5 text-pp-text-muted" />
                  <input
                    type="text"
                    placeholder="Search player 2..."
                    value={searchP2}
                    onChange={(e) => setSearchP2(e.target.value)}
                    className="w-full bg-pp-bg border border-pp-border rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder:text-pp-text-muted/60 focus:outline-none focus:border-pp-primary"
                  />
                </div>
                <select
                  value={player2Id}
                  onChange={(e) => setPlayer2Id(e.target.value)}
                  required
                  className="w-full bg-pp-bg border border-pp-border rounded-xl p-3 text-sm text-white focus:outline-none focus:border-pp-primary"
                >
                  <option value="">-- Choose Player 2 --</option>
                  {filteredP2.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.gamertag} ({p.username}) {p.isVerified ? "✓ Verified" : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Game & Schedule */}
            <div className="pt-4 border-t border-pp-border grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Gamepad2 size={15} className="text-pp-primary" />
                  <span>Game Title</span>
                </label>
                <select
                  value={game}
                  onChange={(e) => setGame(e.target.value)}
                  className="w-full bg-pp-bg border border-pp-border rounded-xl p-3 text-sm text-white focus:outline-none focus:border-pp-primary"
                >
                  <option value="DLS">Dream League Soccer (DLS)</option>
                  <option value="EFOOTBALL">eFootball Mobile</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Calendar size={15} className="text-pp-primary" />
                  <span>Scheduled Time (Optional)</span>
                </label>
                <input
                  type="datetime-local"
                  value={scheduledStartTime}
                  onChange={(e) => setScheduledStartTime(e.target.value)}
                  className="w-full bg-pp-bg border border-pp-border rounded-xl p-3 text-sm text-white focus:outline-none focus:border-pp-primary"
                />
              </div>
            </div>

            {/* Market Question */}
            <div className="pt-4 border-t border-pp-border space-y-3">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <HelpCircle size={15} className="text-pp-primary" />
                  <span>Prediction Question (YES / NO Market)</span>
                </span>
                <span className="text-[11px] text-pp-text-muted font-normal">Defaults to victory prediction</span>
              </label>

              <input
                type="text"
                value={customQuestion}
                onChange={(e) => setCustomQuestion(e.target.value)}
                placeholder={defaultQuestion}
                className="w-full bg-pp-bg border border-pp-border rounded-xl p-3.5 text-white placeholder:text-pp-text-muted/60 focus:outline-none focus:border-pp-primary text-sm font-medium"
              />

              <div className="flex flex-wrap gap-2 text-xs text-pp-text-muted">
                <span className="font-bold">Quick Presets:</span>
                <button
                  type="button"
                  onClick={() => setCustomQuestion(defaultQuestion)}
                  className="px-2.5 py-1 bg-pp-bg hover:bg-pp-surface rounded-lg border border-pp-border hover:text-white transition-colors"
                >
                  Will P1 defeat P2?
                </button>
                {selectedP1 && selectedP2 && (
                  <button
                    type="button"
                    onClick={() => setCustomQuestion(`Will ${selectedP1.gamertag} score 2+ goals against ${selectedP2.gamertag}?`)}
                    className="px-2.5 py-1 bg-pp-bg hover:bg-pp-surface rounded-lg border border-pp-border hover:text-white transition-colors"
                  >
                    Will P1 score 2+ goals?
                  </button>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || !player1Id || !player2Id}
              className="w-full py-4 bg-pp-primary text-black font-extrabold rounded-xl hover:bg-pp-primary-dark active:scale-[0.99] transition-all text-sm uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-pp-primary/20 mt-4"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>Launching Live Market...</span>
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  <span>Launch Live Prediction Market</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Right Col: Live Preview */}
        <div className="space-y-6">
          <div className="bg-pp-surface border border-pp-primary/30 rounded-2xl p-6 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pp-primary via-amber-400 to-pp-accent" />
            
            <div className="flex items-center justify-between mb-4">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-500/10 text-red-400 border border-red-500/30 rounded-full text-[10px] font-black uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                Live Preview
              </span>
              <span className="text-xs font-bold text-pp-text-muted uppercase">{game}</span>
            </div>

            <h3 className="text-lg font-black text-white uppercase tracking-tight mb-2">
              {selectedP1?.gamertag || "Player 1"} <span className="text-pp-text-muted font-normal text-sm">vs</span> {selectedP2?.gamertag || "Player 2"}
            </h3>

            <div className="my-4 p-3.5 bg-pp-bg rounded-xl border border-pp-border">
              <p className="text-[11px] font-bold text-amber-400 uppercase tracking-wider mb-1">Market Question</p>
              <p className="text-sm font-bold text-white leading-snug">"{activeQuestion}"</p>
            </div>

            {/* Odds Preview */}
            <div className="space-y-2 mb-6">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-green-400">YES 50%</span>
                <span className="text-red-400">NO 50%</span>
              </div>
              <div className="w-full h-2.5 bg-pp-bg rounded-full overflow-hidden flex border border-pp-border">
                <div className="bg-green-500 w-1/2" />
                <div className="bg-red-500 w-1/2" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-xl text-center">
                <span className="block text-[10px] font-black text-green-400 uppercase">Option A</span>
                <span className="font-extrabold text-white text-sm">YES</span>
              </div>
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-center">
                <span className="block text-[10px] font-black text-red-400 uppercase">Option B</span>
                <span className="font-extrabold text-white text-sm">NO</span>
              </div>
            </div>

            <p className="text-[11px] text-pp-text-muted text-center mt-4">
              Upon launch, a notification broadcast will be issued to all players.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
