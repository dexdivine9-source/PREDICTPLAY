"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { createWalletAction } from "@/app/actions";
import { createInitialProfileAction } from "@/app/profile-actions";
import { Loader2 } from "lucide-react";

export default function ProfileCreatePage() {
  const [username, setUsername] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { user, refreshProfile } = useAuth();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || loading) return;

    if (!username.trim()) {
      setError("Please choose a username.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await createInitialProfileAction(username.trim(), referralCode.trim() || undefined);
      await createWalletAction();
      await refreshProfile();
      router.push("/");
    } catch (err: any) {
      console.error("Profile creation error:", err);
      setError(err?.message || "Failed to create profile. Please try again.");
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="text-center p-8 bg-pp-surface border border-pp-border rounded-2xl max-w-md w-full">
          <p className="text-pp-text-muted mb-4">Please sign in with Google first to create an account.</p>
          <button
            onClick={() => router.push("/login")}
            className="px-6 py-2.5 bg-pp-primary text-black font-bold rounded-xl hover:bg-pp-primary-dark transition-all text-sm uppercase"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4">
      <div className="relative w-full max-w-md bg-pp-surface border border-pp-border rounded-2xl p-6 md:p-8 shadow-2xl overflow-hidden">
        
        {/* Glow accent */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-pp-primary/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="mb-5">
          <h1 className="text-2xl font-black text-white tracking-tight">Create account</h1>
          <p className="text-sm text-pp-text-muted mt-1">Pick a username to finish signup.</p>
        </div>

        {/* Status notification banner */}
        <div className="mb-6 flex items-center gap-3 p-3.5 bg-pp-primary/10 border border-pp-primary/30 rounded-xl text-pp-primary text-xs leading-relaxed font-medium">
          <Loader2 size={16} className="animate-spin flex-shrink-0" />
          <span>Setting up your PTS balance... pick a username to finish signup.</span>
        </div>

        {error && (
          <div className="p-3.5 mb-5 text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl text-sm leading-snug">
            {error}
          </div>
        )}

        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              maxLength={20}
              placeholder="Choose a username"
              disabled={loading}
              className="w-full bg-pp-bg border border-pp-border rounded-xl p-3.5 text-white placeholder:text-pp-text-muted/60 focus:outline-none focus:border-pp-primary transition-colors text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Referral code <span className="text-pp-text-muted font-normal text-[11px]">(optional)</span>
            </label>
            <input
              type="text"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value)}
              maxLength={30}
              placeholder="Enter invite code"
              disabled={loading}
              className="w-full bg-pp-bg border border-pp-border rounded-xl p-3.5 text-white placeholder:text-pp-text-muted/60 focus:outline-none focus:border-pp-primary transition-colors text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !username.trim()}
            className="w-full mt-2 py-3.5 bg-pp-primary text-black font-bold rounded-xl hover:bg-pp-primary-dark active:scale-[0.99] transition-all uppercase text-sm tracking-wide disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-pp-primary/20"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Creating account...</span>
              </>
            ) : (
              <span>Create account</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
