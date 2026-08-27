"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  User, 
  ShieldCheck, 
  ShieldAlert, 
  Shield, 
  Wallet, 
  Trophy, 
  Gamepad2, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  Edit3, 
  Sparkles,
  ExternalLink,
  History,
  TrendingUp,
  AlertCircle
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";

export default function CurrentUserProfilePage() {
  const router = useRouter();
  const { user, profile, wallet, loading, refreshProfile } = useAuth();

  const [transactions, setTransactions] = useState<any[]>([]);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "history" | "predictions">("overview");

  const [isEditing, setIsEditing] = useState(false);
  const [editGamertag, setEditGamertag] = useState("");
  const [editGame, setEditGame] = useState("DLS");
  const [saving, setSaving] = useState(false);
  const [editMsg, setEditMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
      return;
    }

    if (profile) {
      setEditGamertag(profile.gamertag || profile.username || "");
      setEditGame(profile.game || "DLS");
    }

    async function loadUserData() {
      if (!user) return;

      try {
        // 1. Fetch transactions
        const { data: txData } = await supabase
          .from("transactions")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(10);
        if (txData) setTransactions(txData);

        // 2. Fetch predictions
        const { data: predData } = await supabase
          .from("predictions")
          .select("*, markets(*)")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(10);
        if (predData) setPredictions(predData);

        // 3. Fetch matches participated in
        const { data: matchData } = await supabase
          .from("matches")
          .select("*")
          .or(`creator_id.eq.${user.id},player1_id.eq.${user.id},player2_id.eq.${user.id}`)
          .order("created_at", { ascending: false })
          .limit(10);
        if (matchData) setMatches(matchData);
      } catch (err) {
        console.error("Error loading profile details:", err);
      }
    }

    loadUserData();
  }, [user, loading, profile]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || saving) return;

    setSaving(true);
    setEditMsg(null);

    try {
      const { error } = await supabase
        .from("player_profiles")
        .update({
          gamertag: editGamertag.trim(),
          username: editGamertag.trim(),
          game: editGame,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) throw error;

      await refreshProfile();
      setEditMsg({ type: "success", text: "Profile updated successfully!" });
      setIsEditing(false);
    } catch (err: any) {
      setEditMsg({ type: "error", text: err.message || "Failed to update profile." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-4 border-pp-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-bold text-pp-text-muted">Loading player profile...</p>
      </div>
    );
  }

  if (!user) return null;

  const isAdmin = Boolean(
    profile?.role === "admin" ||
    profile?.is_admin === true ||
    user?.user_metadata?.role === "admin"
  );

  const isVerified = Boolean(profile?.is_verified);
  const displayName = profile?.gamertag || profile?.username || user.email?.split("@")[0] || "Player";
  const ptsBalance = wallet?.balance ?? 1000;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* Top Banner Card */}
      <div className="relative bg-pp-surface border border-pp-border rounded-3xl p-6 md:p-10 overflow-hidden mb-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-pp-primary/10 rounded-full blur-[100px] -z-10 translate-x-1/3 -translate-y-1/3" />
        
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8 relative z-10">
          {/* Avatar */}
          <div className="relative">
            <div className={`w-28 h-28 md:w-32 md:h-32 rounded-2xl flex items-center justify-center font-black text-4xl uppercase border-2 shadow-xl ${
              isAdmin 
                ? "border-amber-400 bg-amber-500/10 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.25)]" 
                : "border-pp-primary bg-pp-bg text-pp-primary shadow-[0_0_15px_rgba(57,255,20,0.2)]"
            }`}>
              {displayName.slice(0, 2)}
            </div>
            {isAdmin && (
              <span className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 bg-amber-500 text-black font-black text-[10px] uppercase tracking-wider rounded-full shadow">
                ADMIN
              </span>
            )}
          </div>

          {/* User Details */}
          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
              <div>
                <h1 className="text-3xl font-black text-white tracking-tight uppercase flex items-center justify-center md:justify-start gap-2">
                  <span>{displayName}</span>
                  {isVerified && (
                    <ShieldCheck className="text-pp-primary inline" size={24} />
                  )}
                </h1>
                <p className="text-xs text-pp-text-muted mt-0.5">{user.email}</p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="px-4 py-2 bg-pp-bg border border-pp-border hover:border-pp-primary/40 text-white rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all"
                >
                  <Edit3 size={14} />
                  <span>{isEditing ? "Cancel" : "Edit Profile"}</span>
                </button>

                {!isVerified && (
                  <Link
                    href="/profile/verify"
                    className="px-4 py-2 bg-amber-500 text-black rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-amber-500/20 hover:bg-amber-400 transition-all"
                  >
                    <Sparkles size={14} />
                    <span>Verify (+1,500 PTS)</span>
                  </Link>
                )}
              </div>
            </div>

            {/* Badges / Stats row */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-4">
              <span className="px-3 py-1 bg-pp-bg border border-pp-border rounded-xl text-xs font-bold text-white uppercase flex items-center gap-1.5">
                <Gamepad2 size={14} className="text-pp-primary" />
                <span>{profile?.game || "DLS"}</span>
              </span>

              <span className={`px-3 py-1 rounded-xl text-xs font-bold uppercase flex items-center gap-1.5 border ${
                isVerified 
                  ? "bg-green-500/10 border-green-500/30 text-green-400" 
                  : "bg-yellow-500/10 border-yellow-500/30 text-yellow-400"
              }`}>
                {isVerified ? <CheckCircle2 size={14} /> : <Clock size={14} />}
                <span>{isVerified ? "Verified Player" : "Unverified (Verification Pending)"}</span>
              </span>

              <span className="px-3 py-1 bg-pp-bg border border-pp-border rounded-xl text-xs font-bold text-pp-text-muted uppercase">
                Reputation: <span className="text-white font-mono">{profile?.reputation ?? 100}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Inline Edit Form */}
        {isEditing && (
          <form onSubmit={handleSaveProfile} className="mt-8 pt-8 border-t border-pp-border grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-pp-text-muted uppercase tracking-wider mb-2">Gamertag</label>
              <input
                type="text"
                value={editGamertag}
                onChange={(e) => setEditGamertag(e.target.value)}
                required
                maxLength={20}
                className="w-full bg-pp-bg border border-pp-border rounded-xl p-3 text-sm text-white focus:outline-none focus:border-pp-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-pp-text-muted uppercase tracking-wider mb-2">Primary Game</label>
              <select
                value={editGame}
                onChange={(e) => setEditGame(e.target.value)}
                className="w-full bg-pp-bg border border-pp-border rounded-xl p-3 text-sm text-white focus:outline-none focus:border-pp-primary"
              >
                <option value="DLS">Dream League Soccer (DLS)</option>
                <option value="EFOOTBALL">eFootball Mobile</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 bg-pp-primary text-black font-extrabold rounded-xl hover:bg-pp-primary-dark transition-all text-xs uppercase tracking-wider disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        )}

        {editMsg && (
          <div className={`mt-4 p-3 rounded-xl text-xs flex items-center gap-2 border ${
            editMsg.type === "success" ? "bg-green-500/10 border-green-500/30 text-green-400" : "bg-red-500/10 border-red-500/30 text-red-400"
          }`}>
            {editMsg.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{editMsg.text}</span>
          </div>
        )}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        {/* Wallet Balance */}
        <div className="bg-pp-surface border border-pp-primary/40 rounded-2xl p-6 relative overflow-hidden shadow-xl">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-pp-text-muted uppercase tracking-wider">Virtual Points Balance</span>
            <Wallet size={20} className="text-pp-primary" />
          </div>
          <div className="text-3xl font-black font-mono text-white mb-2">
            {ptsBalance.toLocaleString()} <span className="text-pp-primary text-lg">PTS</span>
          </div>
          <p className="text-[11px] text-pp-text-muted">
            Used for match entry stakes and prediction markets.
          </p>
        </div>

        {/* Verification Status Card */}
        <div className={`bg-pp-surface border rounded-2xl p-6 relative overflow-hidden shadow-xl ${
          isVerified ? "border-green-500/40" : "border-amber-500/40"
        }`}>
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-pp-text-muted uppercase tracking-wider">Verification Tier</span>
            {isVerified ? <ShieldCheck size={20} className="text-green-400" /> : <ShieldAlert size={20} className="text-amber-400" />}
          </div>
          <div className="text-xl font-black text-white uppercase mb-2">
            {isVerified ? "Tier 1: Verified" : "Unverified"}
          </div>
          <p className="text-[11px] text-pp-text-muted">
            {isVerified ? "Full access to matches, rankings, and payouts." : "Complete screenshot verification to unlock 1,500 bonus points."}
          </p>
        </div>

        {/* Quick Staking Actions */}
        <div className="bg-pp-surface border border-pp-border rounded-2xl p-6 flex flex-col justify-between shadow-xl">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-pp-text-muted uppercase tracking-wider">Quick Actions</span>
            <Trophy size={20} className="text-pp-accent" />
          </div>
          <div className="flex gap-2 mt-2">
            <Link
              href="/matches/create"
              className="flex-1 py-2.5 bg-pp-bg border border-pp-border hover:border-pp-primary text-white text-center font-bold rounded-xl text-xs uppercase tracking-wider transition-all"
            >
              Post Challenge
            </Link>
            <Link
              href="/markets"
              className="flex-1 py-2.5 bg-pp-primary text-black text-center font-extrabold rounded-xl text-xs uppercase tracking-wider hover:bg-pp-primary-dark transition-all"
            >
              Predict Markets
            </Link>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 mb-6 border-b border-pp-border pb-4">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
            activeTab === "overview"
              ? "bg-pp-primary text-black border-pp-primary shadow-md shadow-pp-primary/20"
              : "bg-pp-surface border-pp-border text-pp-text-muted hover:text-white"
          }`}
        >
          Recent Activity & Points
        </button>

        <button
          onClick={() => setActiveTab("predictions")}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
            activeTab === "predictions"
              ? "bg-pp-primary text-black border-pp-primary shadow-md shadow-pp-primary/20"
              : "bg-pp-surface border-pp-border text-pp-text-muted hover:text-white"
          }`}
        >
          My Predictions ({predictions.length})
        </button>

        <button
          onClick={() => setActiveTab("history")}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
            activeTab === "history"
              ? "bg-pp-primary text-black border-pp-primary shadow-md shadow-pp-primary/20"
              : "bg-pp-surface border-pp-border text-pp-text-muted hover:text-white"
          }`}
        >
          My Matches ({matches.length})
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="bg-pp-surface border border-pp-border rounded-2xl p-6 shadow-xl">
          <h3 className="text-sm font-black text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <History size={16} className="text-pp-primary" />
            <span>Points Transaction History</span>
          </h3>

          {transactions.length > 0 ? (
            <div className="divide-y divide-pp-border">
              {transactions.map((tx) => (
                <div key={tx.id} className="py-3.5 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-white text-sm block">{tx.type}</span>
                    <span className="text-[11px] text-pp-text-muted">
                      {new Date(tx.created_at).toLocaleString()}
                    </span>
                  </div>
                  <span className={`font-mono font-black text-base ${tx.amount > 0 ? "text-green-400" : "text-red-400"}`}>
                    {tx.amount > 0 ? `+${tx.amount}` : tx.amount} PTS
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-pp-text-muted py-6 text-center">No transaction records found.</p>
          )}
        </div>
      )}

      {activeTab === "predictions" && (
        <div className="bg-pp-surface border border-pp-border rounded-2xl p-6 shadow-xl">
          <h3 className="text-sm font-black text-white uppercase tracking-wider mb-4">
            Placed Predictions
          </h3>

          {predictions.length > 0 ? (
            <div className="space-y-4">
              {predictions.map((p) => (
                <div key={p.id} className="p-4 bg-pp-bg rounded-xl border border-pp-border flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-pp-text-muted uppercase block mb-1">
                      Option: <span className="text-white font-mono">{p.outcome?.toUpperCase()}</span>
                    </span>
                    <span className="text-xs text-pp-text-muted">
                      Stake: <span className="text-pp-primary font-bold">{p.amount} PTS</span> • Status: <span className="font-bold uppercase text-white">{p.status}</span>
                    </span>
                  </div>
                  <Link href={`/matches/${p.market_id}`} className="text-xs font-bold text-pp-primary hover:underline flex items-center gap-1 uppercase">
                    <span>View Market</span>
                    <ExternalLink size={14} />
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-pp-text-muted py-6 text-center">You haven't placed any predictions yet.</p>
          )}
        </div>
      )}

      {activeTab === "history" && (
        <div className="bg-pp-surface border border-pp-border rounded-2xl p-6 shadow-xl">
          <h3 className="text-sm font-black text-white uppercase tracking-wider mb-4">
            Match Challenge History
          </h3>

          {matches.length > 0 ? (
            <div className="space-y-4">
              {matches.map((m) => (
                <div key={m.id} className="p-4 bg-pp-bg rounded-xl border border-pp-border flex items-center justify-between">
                  <div>
                    <span className="text-sm font-black text-white uppercase block">
                      {m.game} • {m.state}
                    </span>
                    <span className="text-xs text-pp-text-muted">
                      Stake: {m.stake_amount} PTS • Created {new Date(m.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <Link href={`/matches/${m.id}`} className="text-xs font-bold text-pp-primary hover:underline flex items-center gap-1 uppercase">
                    <span>View Match</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-pp-text-muted py-6 text-center">No match challenges found.</p>
          )}
        </div>
      )}
    </div>
  );
}
