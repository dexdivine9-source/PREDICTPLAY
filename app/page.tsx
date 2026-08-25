"use client";

import React from "react";
import Link from "next/link";
import { 
  Gamepad2, 
  ShieldCheck, 
  CheckCircle2, 
  Eye,
} from "lucide-react";
import ActivityFeed from "@/components/ActivityFeed";
import GrandPrizeWinners from "@/components/GrandPrizeWinners";

export default function Home() {
  return (
    <div className="min-h-screen bg-pp-bg text-white selection:bg-pp-primary selection:text-black">
      
      {/* ========================================================================= */}
      {/* 1. HERO SECTION (Dominant Headline, 85-100vh on Desktop) */}
      {/* ========================================================================= */}
      <section className="relative min-h-[88vh] lg:min-h-[94vh] flex flex-col justify-center items-center text-center px-4 sm:px-6 lg:px-8 overflow-hidden py-16 lg:py-24 border-b border-pp-border/60">
        
        {/* Subtle cinematic ambient glows */}
        <div className="absolute inset-0 bg-gradient-to-b from-pp-secondary/10 via-transparent to-transparent pointer-events-none"></div>
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[650px] lg:w-[850px] h-[350px] sm:h-[650px] lg:h-[850px] bg-pp-primary/[0.07] rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[1px] bg-gradient-to-r from-transparent via-pp-primary/30 to-transparent pointer-events-none"></div>

        <div className="relative z-10 max-w-6xl mx-auto flex flex-col items-center">
          
          {/* Small Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-pp-surface/90 border border-pp-primary/30 shadow-[0_0_15px_rgba(57,255,20,0.15)] mb-6 sm:mb-8 transform hover:scale-105 transition-transform">
            <span className="w-2 h-2 rounded-full bg-pp-primary animate-pulse"></span>
            <span className="text-[11px] sm:text-xs font-black tracking-widest text-pp-text uppercase">
              PREDICTPLAY <span className="text-pp-text-muted mx-1">•</span> VERIFIED GAMING <span className="text-pp-text-muted mx-1">•</span> DLS <span className="text-pp-text-muted mx-1">•</span> eFOOTBALL
            </span>
          </div>

          {/* VERY LARGE DOMINANT HEADLINE */}
          <h1 className="text-[40px] sm:text-[56px] md:text-[76px] lg:text-[96px] xl:text-[108px] font-black tracking-tight leading-[0.92] uppercase text-white max-w-[1150px] mx-auto drop-shadow-2xl">
            VERIFY YOUR SKILL.<br />
            <span className="text-pp-primary drop-shadow-[0_0_35px_rgba(57,255,20,0.4)]">
              BACK THE BEST.
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-base sm:text-lg md:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed mt-6 sm:mt-8 font-medium">
            The verified competitive matchmaking and prediction platform for <span className="text-white font-bold">DLS</span> &amp; <span className="text-white font-bold">eFootball</span> players.
            <span className="block mt-2 text-slate-400">
              Every game has a winner. Can you predict it?
            </span>
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full max-w-md sm:max-w-none mt-8 sm:mt-10">
            <Link
              href="/matches"
              className="w-full sm:w-auto px-8 py-4 bg-pp-primary text-black font-black rounded-xl hover:bg-pp-primary-dark transition-all transform hover:scale-105 shadow-[0_0_30px_rgba(57,255,20,0.35)] flex items-center justify-center gap-2.5 text-base uppercase tracking-wider"
            >
              <Gamepad2 size={20} className="stroke-[2.5]" />
              ENTER PREDICTPLAY
            </Link>
            <Link
              href="/markets"
              className="w-full sm:w-auto px-8 py-4 bg-pp-surface border border-pp-border hover:border-pp-primary/50 text-white font-bold rounded-xl hover:bg-pp-surface-hover transition-all flex items-center justify-center gap-2 text-base uppercase tracking-wider"
            >
              <Eye size={18} className="text-pp-primary" />
              EXPLORE MATCHES
            </Link>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap items-center justify-center gap-y-2 gap-x-6 sm:gap-x-8 text-xs sm:text-sm font-semibold text-slate-400 mt-10 sm:mt-12 pt-6 border-t border-pp-border/50">
            <span className="flex items-center gap-1.5 text-slate-300">
              <CheckCircle2 size={16} className="text-pp-primary" />
              Verified Players
            </span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <CheckCircle2 size={16} className="text-pp-primary" />
              Evidence-Based Matches
            </span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <CheckCircle2 size={16} className="text-pp-primary" />
              Secure PTS Predictions
            </span>
          </div>

        </div>
      </section>


      {/* ========================================================================= */}
      {/* 2. FINAL CTA */}
      {/* ========================================================================= */}
      <section className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center relative">
        <div className="absolute inset-0 bg-gradient-to-t from-pp-primary/10 via-transparent to-transparent rounded-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white uppercase tracking-tight leading-tight">
            READY TO PROVE YOUR SKILL?
          </h2>
          <p className="text-base sm:text-lg text-slate-300 mt-4 leading-relaxed font-medium">
            Play verified matches. Build your reputation. Back the players you believe in.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-8 sm:mt-10">
            <Link
              href="/matches"
              className="w-full sm:w-auto px-8 py-4 bg-pp-primary text-black font-black rounded-xl hover:bg-pp-primary-dark transition-all transform hover:scale-105 shadow-[0_0_30px_rgba(57,255,20,0.4)] text-base uppercase tracking-wider"
            >
              ENTER PREDICTPLAY
            </Link>
            <Link
              href="/markets"
              className="w-full sm:w-auto px-8 py-4 bg-pp-surface border border-pp-border hover:border-pp-primary/50 text-white font-bold rounded-xl hover:bg-pp-surface-hover transition-all text-base uppercase tracking-wider"
            >
              VIEW MARKETS
            </Link>
          </div>
        </div>
      </section>


      {/* ========================================================================= */}
      {/* 3. GRAND PRIZE WINNERS TICKER */}
      {/* ========================================================================= */}
      <div className="border-t border-pp-border/60 bg-pp-surface/40 py-6">
        <GrandPrizeWinners />
      </div>


      {/* ========================================================================= */}
      {/* 4. LIVE ACTIVITY NOTIFICATION TOAST FEED */}
      {/* ========================================================================= */}
      <ActivityFeed />

    </div>
  );
}
