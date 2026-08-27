"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, ArrowRight, Loader2 } from "lucide-react";
import { loadMatchByCodeAction } from "@/app/admin-actions";

interface MatchCodeWidgetProps {
  title?: string;
  subtitle?: string;
  compact?: boolean;
  className?: string;
}

export default function MatchCodeWidget({
  title = "JOIN VIA MATCH CODE",
  subtitle = "Have a match code? Enter it below to join.",
  compact = false,
  className = "",
}: MatchCodeWidgetProps) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLoad = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim();
    if (!cleanCode) {
      setError("Please enter a match code.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await loadMatchByCodeAction(cleanCode);
      if (!res.success) {
        setError(res.error || "Invalid or expired match code.");
        return;
      }

      if (res.redirectUrl) {
        router.push(res.redirectUrl);
      } else if (res.matchId) {
        router.push(`/live/${res.matchId}`);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load match. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`bg-pp-surface border border-pp-border rounded-2xl p-5 md:p-6 relative overflow-hidden ${className}`}
    >
      <div className="flex items-center gap-2.5 mb-1.5">
        <KeyRound className="text-pp-primary flex-shrink-0" size={18} />
        <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">
          {title}
        </h3>
      </div>
      <p className="text-xs text-pp-text-muted mb-4">{subtitle}</p>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-semibold">
          {error}
        </div>
      )}

      <form onSubmit={handleLoad} className="space-y-3">
        <div className="relative">
          <input
            type="text"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              if (error) setError("");
            }}
            placeholder="Match Code"
            className="w-full bg-pp-bg border border-pp-border rounded-xl px-4 py-3 text-white font-mono font-bold tracking-widest text-sm uppercase placeholder:font-normal placeholder:text-pp-text-muted placeholder:tracking-normal focus:outline-none focus:border-pp-primary transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !code.trim()}
          className="w-full py-3 bg-pp-primary text-black font-extrabold rounded-xl hover:bg-pp-primary-dark active:scale-[0.99] transition-all text-xs sm:text-sm uppercase tracking-wider disabled:opacity-50 flex items-center justify-center gap-2 shadow-md shadow-pp-primary/20"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>LOADING MATCH...</span>
            </>
          ) : (
            <>
              <span>LOAD</span>
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
