"use client";

import { useState } from "react";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { createWalletAction } from "@/app/actions";
import ComingSoonModal from "@/components/ComingSoonModal";

export default function ProfileCreatePage() {
  const [username, setUsername] = useState("");
  const [game, setGame] = useState("DLS");
  const [error, setError] = useState("");
  const [showComingSoon, setShowComingSoon] = useState(false);
  const router = useRouter();
  const { user, refreshProfile } = useAuth();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      await setDoc(doc(db, "player_profiles", user.uid), {
        userId: user.uid,
        username,
        gamertag: username,
        game: "DLS",
        reputation: 100, // starting reputation
        trustScore: 100,
        isVerified: false,
        createdAt: serverTimestamp()
      });

      await createWalletAction();

      await refreshProfile();
      router.push("/");
    } catch (err: any) {
      setError(err.message);
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
