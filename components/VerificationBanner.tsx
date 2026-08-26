"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldAlert, ArrowRight, Sparkles } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";

export default function VerificationBanner() {
  const pathname = usePathname();
  const { user, profile, loading } = useAuth();

  // Hide while loading or on auth/creation/verification pages
  if (
    loading ||
    !user ||
    !profile ||
    profile.is_verified ||
    pathname === "/profile/verify" ||
    pathname === "/profile/create" ||
    pathname === "/login" ||
    pathname === "/register"
  ) {
    return null;
  }

  return (
    <div className="w-full bg-gradient-to-r from-amber-500/15 via-pp-surface to-pp-primary/10 border-b border-amber-500/30 px-4 py-2.5 sm:py-3 transition-all duration-300">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 flex-shrink-0">
            <ShieldAlert size={16} />
          </div>
          <div>
            <p className="text-xs sm:text-sm font-bold text-white tracking-wide">
              Verify your game profile{" "}
              <span className="hidden md:inline text-pp-text-muted font-normal">
                — Unlock matchmaking challenges, entry stakes, and prediction markets.
              </span>
            </p>
          </div>
        </div>

        <Link
          href="/profile/verify"
          className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-pp-primary text-black font-extrabold text-xs uppercase tracking-wider rounded-lg hover:bg-pp-primary-dark active:scale-[0.98] transition-all shadow-sm shadow-pp-primary/20 flex-shrink-0"
        >
          <Sparkles size={13} />
          <span>Verify Now</span>
          <ArrowRight size={13} />
        </Link>
      </div>
    </div>
  );
}
