"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { createWalletAction } from "@/app/actions";
import { linkDlsTrackerAction } from "@/app/profile-actions";
import ComingSoonModal from "@/components/ComingSoonModal";

export default function ProfileCreatePage() {
  const [username, setUsername] = useState("");
  const [game, setGame] = useState("DLS");
  const [error, setError] = useState("");
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [trackerInput, setTrackerInput] = useState("");
  const [trackerLoading, setTrackerLoading] = useState(false);
  const [trackerError, setTrackerError] = useState("");
  const [trackerResult, setTrackerResult] = useState<{
    teamName: string;
    division: number;
    played: number;
    won: number;
    lost: number;
    winRate: number;
  } | null>(null);
  const router = useRouter();
  const { user, refreshProfile } = useAuth();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      const { error: profileError } = await supabase
        .from("player_profiles")
        .upsert(
          {
            id: user.id,
            user_id: user.id,
            username,
            gamertag: username,
            game: "DLS",
            reputation: 100,
            trust_score: 100,
            is_verified: false,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" }
        );

      if (profileError) {
        console.warn("Supabase upsert note:", profileError.message);
      }

      await createWalletAction();
      await refreshProfile();
      router.push("/");
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleLinkTracker = async () => {
    if (!trackerInput.trim() || trackerLoading) return;
    setTrackerLoading(true);
    setTrackerError("");
    try {
      const res = await linkDlsTrackerAction(trackerInput);
      if (res.success && res.profile) {
        const p = res.profile;
        setTrackerResult(p);
        // Convenience: seed the gamertag from the linked team name if the
        // user hasn't typed one yet. Editable, capped to the field's limit.
        setUsername((prev) => prev || p.teamName.slice(0, 20));
      } else {
        setTrackerResult(null);
        setTrackerError(
          res.error ?? "Couldn't link that tracker. You can continue manually."
        );
      }
    } catch {
      setTrackerResult(null);
      setTrackerError(
        "Something went wrong linking the tracker. You can continue manually."
      );
    } finally {
      setTrackerLoading(false);
    }
  };

  if (!user) {
    return <div className="text-center p-12 text-pp-text-muted">Please register or login first.</div>;
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full p-8 border border-pp-border rounded-xl bg-pp-surface">
        <h1 className="text-3xl font-black mb-2 uppercase text-white">Create Game Profile</h1>
        <p className="text-pp-text-muted mb-6 text-sm">Choose your primary competitive game and gamertag.</p>
        
        {error && <div className="p-4 mb-4 text-red-400 bg-red-400/10 rounded-lg text-sm">{error}</div>}
        
        <form onSubmit={handleCreate} className="space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-pp-text-muted mb-2">
              Primary Game
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setGame("DLS")}
                className={`p-3 rounded-lg border text-center transition-all ${
                  game === "DLS"
                    ? "border-pp-primary bg-pp-primary/10 text-white font-bold"
                    : "border-pp-border bg-pp-bg text-pp-text-muted"
                }`}
              >
                <span className="block text-sm">DLS</span>
                <span className="text-[10px] text-pp-primary font-bold uppercase">Active</span>
              </button>

              <button
                type="button"
                onClick={() => setShowComingSoon(true)}
                className="p-3 rounded-lg border border-pp-border bg-pp-bg/60 text-center hover:border-pp-primary/40 transition-all text-pp-text-muted"
              >
                <span className="block text-sm">eFootball</span>
                <span className="text-[10px] bg-yellow-500/20 text-yellow-400 font-bold uppercase px-1.5 py-0.5 rounded">
                  Coming Soon
                </span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-pp-text-muted mb-2">
              Link DLS Tracker <span className="normal-case font-normal text-pp-text-muted/70">(optional)</span>
            </label>
            <p className="text-[11px] text-pp-text-muted mb-2 leading-relaxed">
              Paste your DLS Live tracker link to pull your real match history, or skip and enter your gamertag manually.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={trackerInput}
                onChange={e => setTrackerInput(e.target.value)}
                placeholder="tracker.ftgames.com/?idx=… or code"
                className="flex-1 min-w-0 bg-pp-bg border border-pp-border rounded-lg p-3 text-white focus:outline-none focus:border-pp-primary text-sm"
              />
              <button
                type="button"
                onClick={handleLinkTracker}
                disabled={trackerLoading || !trackerInput.trim()}
                className="px-4 rounded-lg border border-pp-primary bg-pp-primary/10 text-white font-bold text-sm uppercase tracking-wide hover:bg-pp-primary/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {trackerLoading ? "Linking…" : "Link"}
              </button>
            </div>

            {trackerError && (
              <div className="mt-2 p-3 text-amber-400 bg-amber-400/10 rounded-lg text-xs leading-relaxed">
                {trackerError}
              </div>
            )}

            {trackerResult && (
              <div className="mt-2 p-3 border border-pp-primary/40 bg-pp-primary/5 rounded-lg">
                <div className="text-pp-primary text-[11px] font-bold uppercase tracking-wide mb-1">✓ Tracker Linked</div>
                <div className="text-white font-bold text-sm mb-2 truncate">{trackerResult.teamName}</div>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div>
                    <div className="text-white font-bold text-sm">{trackerResult.division || "—"}</div>
                    <div className="text-[10px] text-pp-text-muted uppercase tracking-wide">Div</div>
                  </div>
                  <div>
                    <div className="text-white font-bold text-sm">{trackerResult.played}</div>
                    <div className="text-[10px] text-pp-text-muted uppercase tracking-wide">Played</div>
                  </div>
                  <div>
                    <div className="text-white font-bold text-sm">{trackerResult.won}-{trackerResult.lost}</div>
                    <div className="text-[10px] text-pp-text-muted uppercase tracking-wide">W-L</div>
                  </div>
                  <div>
                    <div className="text-white font-bold text-sm">{trackerResult.winRate}%</div>
                    <div className="text-[10px] text-pp-text-muted uppercase tracking-wide">Win</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-pp-text-muted mb-2">
              In-Game Gamertag / Username
            </label>
            <input 
              type="text" 
              value={username} 
              onChange={e => setUsername(e.target.value)} 
              required 
              maxLength={20}
              placeholder="e.g. striker_99"
              className="w-full bg-pp-bg border border-pp-border rounded-lg p-3 text-white focus:outline-none focus:border-pp-primary text-sm" 
            />
          </div>

          <button type="submit" className="w-full bg-pp-primary text-black font-bold py-3.5 rounded-lg hover:bg-pp-primary-dark transition-colors uppercase text-sm tracking-wide">
            Complete Profile
          </button>
        </form>
      </div>

      <ComingSoonModal
        isOpen={showComingSoon}
        onClose={() => setShowComingSoon(false)}
        title="eFootball Profiles Coming Soon"
        description="eFootball profile registration and verification are in final testing. Create your Dream League Soccer (DLS) profile today to start competing!"
      />
    </div>
  );
}
