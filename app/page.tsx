"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Gamepad2, 
  Swords, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight, 
  Trophy, 
  Flame, 
  Sparkles, 
  Coins, 
  Eye, 
  Activity, 
  Zap, 
  Lock, 
  Search, 
  FileCheck, 
  TrendingUp, 
  Check,
  ChevronRight,
  Radio
} from "lucide-react";
import ActivityFeed from "@/components/ActivityFeed";
import GrandPrizeWinners from "@/components/GrandPrizeWinners";

export default function Home() {
  // Interactive Prediction Card State
  const [selectedOutcome, setSelectedOutcome] = useState<"p1" | "p2" | "draw">("p1");
  const [wagerAmount, setWagerAmount] = useState<number>(500);

  // Dynamic multiplier based on simulated pool
  const multipliers = {
    p1: 1.61,
    p2: 3.22,
    draw: 14.2,
  };

  const potentialWin = Math.round(wagerAmount * multipliers[selectedOutcome]);

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
            The verified competitive matchmaking and prediction platform for <span className="text-white font-bold">DLS</span> & <span className="text-white font-bold">eFootball</span> players.
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
      {/* 2. SECTION 2: THE TRUST LAYER FOR COMPETITIVE GAMING (4-Step Flow) */}
      {/* ========================================================================= */}
      <section className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-b border-pp-border/60">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-pp-surface border border-pp-border text-pp-primary text-xs font-black tracking-widest uppercase mb-4">
            <ShieldCheck size={14} /> THE TRUST LAYER FOR COMPETITIVE GAMING
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white uppercase tracking-tight leading-tight">
            PLAY. PROVE IT. PREDICT.
          </h2>
          <p className="text-slate-400 text-sm sm:text-base md:text-lg mt-4 leading-relaxed font-normal">
            PredictPlay connects verified players, real matches, evidence-based verification and prediction markets into one competitive gaming network.
          </p>
        </div>

        {/* 4-Step Cards Flow (Horizontal Desktop, Vertical Mobile) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          
          {/* Step 1 */}
          <div className="bg-pp-surface/90 border border-pp-border hover:border-pp-primary/50 transition-all rounded-2xl p-6 flex flex-col justify-between group hover:-translate-y-1 duration-200">
            <div>
              <div className="flex items-center justify-between mb-6">
                <span className="text-2xl font-black font-mono text-pp-primary">01</span>
                <div className="w-10 h-10 rounded-xl bg-pp-bg border border-pp-border flex items-center justify-center text-pp-primary group-hover:border-pp-primary/40 transition-colors">
                  <ShieldCheck size={20} />
                </div>
              </div>
              <h3 className="text-lg font-black uppercase text-white tracking-wide mb-2">
                VERIFY YOUR PROFILE
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Players link and verify their unique DLS or eFootball gamer identity with screenshot evidence.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-pp-border/50 text-[11px] font-bold text-slate-500 uppercase">
              Profile Authenticated
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-pp-surface/90 border border-pp-border hover:border-pp-primary/50 transition-all rounded-2xl p-6 flex flex-col justify-between group hover:-translate-y-1 duration-200">
            <div>
              <div className="flex items-center justify-between mb-6">
                <span className="text-2xl font-black font-mono text-pp-primary">02</span>
                <div className="w-10 h-10 rounded-xl bg-pp-bg border border-pp-border flex items-center justify-center text-pp-primary group-hover:border-pp-primary/40 transition-colors">
                  <Swords size={20} />
                </div>
              </div>
              <h3 className="text-lg font-black uppercase text-white tracking-wide mb-2">
                PLAY THE MATCH
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Create custom 1v1 challenges, set stakes, or accept open matches in the verified arena.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-pp-border/50 text-[11px] font-bold text-slate-500 uppercase">
              1v1 Verified Lobby
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-pp-surface/90 border border-pp-border hover:border-pp-primary/50 transition-all rounded-2xl p-6 flex flex-col justify-between group hover:-translate-y-1 duration-200">
            <div>
              <div className="flex items-center justify-between mb-6">
                <span className="text-2xl font-black font-mono text-pp-primary">03</span>
                <div className="w-10 h-10 rounded-xl bg-pp-bg border border-pp-border flex items-center justify-center text-pp-primary group-hover:border-pp-primary/40 transition-colors">
                  <FileCheck size={20} />
                </div>
              </div>
              <h3 className="text-lg font-black uppercase text-white tracking-wide mb-2">
                PROVE THE RESULT
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Both players upload unedited pre-match and final whistle screenshots for automated cross-validation.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-pp-border/50 text-[11px] font-bold text-slate-500 uppercase">
              Dual-Sided Proof
            </div>
          </div>

          {/* Step 4 */}
          <div className="bg-pp-surface/90 border border-pp-border hover:border-pp-primary/50 transition-all rounded-2xl p-6 flex flex-col justify-between group hover:-translate-y-1 duration-200">
            <div>
              <div className="flex items-center justify-between mb-6">
                <span className="text-2xl font-black font-mono text-pp-primary">04</span>
                <div className="w-10 h-10 rounded-xl bg-pp-bg border border-pp-border flex items-center justify-center text-pp-primary group-hover:border-pp-primary/40 transition-colors">
                  <Coins size={20} />
                </div>
              </div>
              <h3 className="text-lg font-black uppercase text-white tracking-wide mb-2">
                PREDICT & SETTLE
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Verified results instantly settle spectator prediction markets and update player reputation ratings.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-pp-border/50 text-[11px] font-bold text-slate-500 uppercase">
              Instant PTS Settlement
            </div>
          </div>

        </div>
      </section>


      {/* ========================================================================= */}
      {/* 3. SECTION 3 — HOW IT WORKS (From Match to Verified Result Pipeline) */}
      {/* ========================================================================= */}
      <section className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-b border-pp-border/60">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-pp-surface border border-pp-border text-pp-primary text-xs font-black tracking-widest uppercase mb-4">
            <Zap size={14} /> HOW IT WORKS
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white uppercase tracking-tight leading-tight">
            FROM MATCH TO VERIFIED RESULT
          </h2>
          <p className="text-slate-400 text-sm sm:text-base mt-3">
            Every match traverses a strict 7-stage cryptographic & computer-vision pipeline.
          </p>
        </div>

        {/* Visual Pipeline Bar */}
        <div className="bg-pp-surface border border-pp-border rounded-2xl p-6 sm:p-8 mb-12 shadow-xl">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 text-center">
            {[
              { title: "PLAYER PROFILE", desc: "Identity Bound", icon: ShieldCheck },
              { title: "START EVIDENCE", desc: "Lobby Verified", icon: FileCheck },
              { title: "MATCH", desc: "1v1 Battle", icon: Swords },
              { title: "END EVIDENCE", desc: "Final Whistle", icon: Search },
              { title: "AI VERIFICATION", desc: "CV & OCR Audit", icon: Zap },
              { title: "VERIFIED RESULT", desc: "Score Confirmed", icon: CheckCircle2 },
              { title: "PREDICTION SETTLEMENT", desc: "PTS Distributed", icon: Coins },
            ].map((step, idx) => {
              const Icon = step.icon;
              return (
                <div key={step.title} className="relative flex flex-col items-center p-3 rounded-xl bg-pp-bg/80 border border-pp-border">
                  <div className="w-8 h-8 rounded-lg bg-pp-primary/10 border border-pp-primary/30 flex items-center justify-center text-pp-primary mb-2">
                    <Icon size={16} />
                  </div>
                  <span className="text-[11px] font-black uppercase text-white tracking-wide">
                    {step.title}
                  </span>
                  <span className="text-[10px] text-pp-text-muted mt-0.5">
                    {step.desc}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Anti-Fraud Evidence Checks */}
        <div>
          <h3 className="text-center text-xs font-black uppercase tracking-widest text-slate-400 mb-6">
            Screenshots are not simply trusted blindly. PredictPlay checks evidence for:
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {[
              { label: "Game Identity", detail: "UI texture & header validation" },
              { label: "Player Identity", detail: "Gamertag & team roster check" },
              { label: "Opponent Sync", detail: "Matches contract pairing" },
              { label: "Score Accuracy", detail: "CV final score extraction" },
              { label: "Consistency", detail: "Timeline & asset alignment" },
              { label: "Anti-Duplicate", detail: "Image hashing & reuse block" },
              { label: "Anomaly Guard", detail: "Flags crop & pixel manipulation" },
            ].map((check) => (
              <div key={check.label} className="p-3 rounded-xl bg-pp-surface/50 border border-pp-border hover:border-pp-primary/30 transition-colors">
                <div className="flex items-center gap-1.5 text-xs font-bold text-pp-primary mb-1">
                  <Check size={14} className="stroke-[3]" />
                  <span>{check.label}</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">
                  {check.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ========================================================================= */}
      {/* 4. SECTION 4 — PREDICTION MARKETS (Interactive Showcase) */}
      {/* ========================================================================= */}
      <section className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-b border-pp-border/60">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-pp-surface border border-pp-border text-pp-primary text-xs font-black tracking-widest uppercase mb-4">
            <Radio size={14} className="text-red-500 animate-pulse" /> LIVE PREDICTION EXCHANGE
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white uppercase tracking-tight leading-tight">
            WHO DO YOU BACK?
          </h2>
          <p className="text-slate-400 text-sm sm:text-base mt-3">
            Spectate verified matches in real-time and back the player you believe will take victory.
          </p>
        </div>

        {/* Realistic Interactive Prediction Market Card */}
        <div className="max-w-3xl mx-auto bg-pp-surface border border-pp-border rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          
          {/* Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-6 border-b border-pp-border/60">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded bg-pp-bg border border-pp-border text-[11px] font-black text-pp-primary uppercase">
                DLS • DIVISION 1
              </span>
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-[10px] font-black text-red-400 uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span>
                LIVE MARKET
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
              <Coins size={16} className="text-pp-primary" />
              <span>TOTAL POOL:</span>
              <span className="font-mono font-black text-white text-sm">9,420 PTS</span>
            </div>
          </div>

          {/* Versus Header */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-8 items-center text-center">
            
            {/* Player 1 */}
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-pp-bg border-2 border-pp-primary/40 flex items-center justify-center text-2xl font-black text-white mb-2 shadow-[0_0_15px_rgba(57,255,20,0.15)]">
                D7
              </div>
              <h4 className="text-lg font-black text-white uppercase tracking-wide flex items-center gap-1.5">
                DAVID_7 <ShieldCheck size={16} className="text-pp-primary" />
              </h4>
              <p className="text-xs font-semibold text-slate-400">Rep: 1,942 • Form: W-W-W-L-W</p>
              <div className="mt-2 text-2xl font-black font-mono text-pp-primary">
                62% <span className="text-xs font-normal text-slate-400">(1.61x)</span>
              </div>
            </div>

            {/* VS Divider */}
            <div className="flex flex-col items-center justify-center">
              <span className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">BEST OF 1</span>
              <span className="text-2xl font-black text-slate-600">VS</span>
              <span className="text-[11px] font-bold text-slate-400 mt-1">Draw: 7% (14.2x)</span>
            </div>

            {/* Player 2 */}
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-pp-bg border-2 border-pp-border flex items-center justify-center text-2xl font-black text-white mb-2">
                TL
              </div>
              <h4 className="text-lg font-black text-white uppercase tracking-wide flex items-center gap-1.5">
                TIMILEGEND <ShieldCheck size={16} className="text-pp-primary" />
              </h4>
              <p className="text-xs font-semibold text-slate-400">Rep: 1,810 • Form: W-W-L-W-W</p>
              <div className="mt-2 text-2xl font-black font-mono text-slate-200">
                31% <span className="text-xs font-normal text-slate-400">(3.22x)</span>
              </div>
            </div>

          </div>

          {/* Interactive Outcome Selection */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <button
              onClick={() => setSelectedOutcome("p1")}
              className={`p-3.5 rounded-xl font-black text-xs sm:text-sm uppercase tracking-wider transition-all flex flex-col items-center gap-1 border ${
                selectedOutcome === "p1"
                  ? "bg-pp-primary text-black border-pp-primary shadow-[0_0_20px_rgba(57,255,20,0.3)] scale-[1.02]"
                  : "bg-pp-bg border-pp-border text-slate-300 hover:border-pp-primary/40"
              }`}
            >
              <span>BACK DAVID_7</span>
              <span className={`text-[10px] font-mono ${selectedOutcome === "p1" ? "text-black/80" : "text-pp-primary"}`}>1.61x Odds</span>
            </button>

            <button
              onClick={() => setSelectedOutcome("draw")}
              className={`p-3.5 rounded-xl font-black text-xs sm:text-sm uppercase tracking-wider transition-all flex flex-col items-center gap-1 border ${
                selectedOutcome === "draw"
                  ? "bg-pp-primary text-black border-pp-primary shadow-[0_0_20px_rgba(57,255,20,0.3)] scale-[1.02]"
                  : "bg-pp-bg border-pp-border text-slate-300 hover:border-pp-primary/40"
              }`}
            >
              <span>BACK DRAW</span>
              <span className={`text-[10px] font-mono ${selectedOutcome === "draw" ? "text-black/80" : "text-pp-primary"}`}>14.2x Odds</span>
            </button>

            <button
              onClick={() => setSelectedOutcome("p2")}
              className={`p-3.5 rounded-xl font-black text-xs sm:text-sm uppercase tracking-wider transition-all flex flex-col items-center gap-1 border ${
                selectedOutcome === "p2"
                  ? "bg-pp-primary text-black border-pp-primary shadow-[0_0_20px_rgba(57,255,20,0.3)] scale-[1.02]"
                  : "bg-pp-bg border-pp-border text-slate-300 hover:border-pp-primary/40"
              }`}
            >
              <span>BACK TIMILEGEND</span>
              <span className={`text-[10px] font-mono ${selectedOutcome === "p2" ? "text-black/80" : "text-pp-primary"}`}>3.22x Odds</span>
            </button>
          </div>

          {/* Quick PTS Input & Return Simulator */}
          <div className="bg-pp-bg/80 border border-pp-border rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <span className="text-xs font-bold text-slate-400 uppercase">Wager:</span>
              <div className="flex gap-1.5">
                {[100, 250, 500, 1000].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setWagerAmount(amt)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-colors ${
                      wagerAmount === amt
                        ? "bg-pp-primary text-black"
                        : "bg-pp-surface border border-pp-border text-slate-300 hover:bg-pp-surface-hover"
                    }`}
                  >
                    {amt} PTS
                  </button>
                ))}
              </div>
            </div>

            <div className="text-right w-full sm:w-auto flex sm:flex-col justify-between items-center sm:items-end">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Estimated Return:</span>
              <span className="text-base font-black font-mono text-pp-primary">
                +{potentialWin} PTS
              </span>
            </div>
          </div>

          {/* Action Link */}
          <Link
            href="/markets"
            className="block w-full py-4 text-center bg-pp-primary text-black font-black rounded-xl hover:bg-pp-primary-dark transition-all uppercase tracking-wider text-sm shadow-lg"
          >
            CONFIRM PREDICTION ON LIVE EXCHANGE
          </Link>
        </div>
      </section>


      {/* ========================================================================= */}
      {/* 5. SECTION 5 — TRUST / ANTI-RIGGING */}
      {/* ========================================================================= */}
      <section className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-b border-pp-border/60">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-pp-surface border border-pp-border text-pp-primary text-xs font-black tracking-widest uppercase">
              <Lock size={14} /> ZERO-TRUST VERIFICATION
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white uppercase tracking-tight leading-tight">
              DON'T JUST TRUST THE SCORE. <br />
              <span className="text-pp-primary">VERIFY IT.</span>
            </h2>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Players submit evidence before and after the match. PredictPlay analyzes the evidence and compares both players' submissions before a result becomes trusted.
            </p>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
              Unlike generic platforms relying on self-reported scores, PredictPlay executes bidirectional computer-vision cross-referencing to eliminate match-rigging, fake scorecards, and disputed outcomes.
            </p>
            <div className="pt-2">
              <Link
                href="/profile/create"
                className="inline-flex items-center gap-2 text-xs sm:text-sm font-black text-pp-primary hover:underline uppercase tracking-wider"
              >
                Learn more about our evidence protocol <ChevronRight size={16} />
              </Link>
            </div>
          </div>

          {/* Visual Audit Inspection Card */}
          <div className="lg:col-span-6">
            <div className="bg-pp-surface border border-pp-border rounded-3xl p-6 sm:p-8 shadow-2xl relative">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-pp-border">
                <span className="text-xs font-black uppercase text-slate-300 tracking-wider flex items-center gap-2">
                  <ShieldCheck size={16} className="text-pp-primary" />
                  EVIDENCE TELEMETRY AUDIT
                </span>
                <span className="text-[11px] font-mono text-pp-primary font-bold">MATCH #DLS-8842</span>
              </div>

              <div className="space-y-3 font-mono text-xs sm:text-sm">
                <div className="p-3 rounded-xl bg-pp-bg border border-pp-border flex items-center justify-between">
                  <span className="text-slate-300">PROFILE EVIDENCE</span>
                  <span className="text-pp-primary font-bold flex items-center gap-1.5">
                    <CheckCircle2 size={15} /> Identity detected
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-pp-bg border border-pp-border flex items-center justify-between">
                  <span className="text-slate-300">START EVIDENCE</span>
                  <span className="text-pp-primary font-bold flex items-center gap-1.5">
                    <CheckCircle2 size={15} /> Match detected
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-pp-bg border border-pp-border flex items-center justify-between">
                  <span className="text-slate-300">END EVIDENCE</span>
                  <span className="text-pp-primary font-bold flex items-center gap-1.5">
                    <CheckCircle2 size={15} /> Score detected (3 - 1)
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-pp-bg border border-pp-border flex items-center justify-between">
                  <span className="text-slate-300">CROSS-CHECK</span>
                  <span className="text-pp-primary font-bold flex items-center gap-1.5">
                    <CheckCircle2 size={15} /> Both players agree
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-pp-bg border border-pp-border flex items-center justify-between">
                  <span className="text-slate-300">AI ANALYSIS</span>
                  <span className="text-pp-primary font-bold">97% confidence</span>
                </div>
              </div>

              {/* Verified Result Confirmation Banner */}
              <div className="mt-6 p-4 rounded-2xl bg-pp-primary/10 border-2 border-pp-primary/40 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase text-pp-primary tracking-widest block">STATUS</span>
                  <span className="text-sm font-black text-white uppercase">MATCH RESULT CONFIRMED</span>
                </div>
                <div className="w-10 h-10 rounded-full bg-pp-primary text-black flex items-center justify-center font-black">
                  ✓
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>


      {/* ========================================================================= */}
      {/* 6. SECTION 6 — PLAYER REPUTATION (Sports Player Trading Card) */}
      {/* ========================================================================= */}
      <section className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-b border-pp-border/60">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-pp-surface border border-pp-border text-pp-primary text-xs font-black tracking-widest uppercase mb-4">
            <Trophy size={14} /> PLAYER IDENTITY
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white uppercase tracking-tight leading-tight">
            BUILD YOUR REPUTATION.
          </h2>
          <p className="text-slate-400 text-sm sm:text-base mt-3">
            Players develop a prestigious competitive identity anchored by tamper-proof verified matches.
          </p>
        </div>

        {/* Sports Player Card */}
        <div className="max-w-md mx-auto bg-gradient-to-b from-pp-surface to-pp-bg border-2 border-pp-primary/30 rounded-3xl p-6 sm:p-8 shadow-[0_0_40px_rgba(57,255,20,0.15)] relative overflow-hidden">
          
          <div className="absolute top-0 right-0 w-32 h-32 bg-pp-primary/10 rounded-bl-full pointer-events-none"></div>
          
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="w-12 h-12 rounded-xl bg-pp-primary text-black font-black flex items-center justify-center text-xl shadow-md">
                D7
              </div>
              <div>
                <h3 className="text-xl font-black text-white uppercase flex items-center gap-1.5">
                  DAVID_7 <ShieldCheck size={18} className="text-pp-primary" />
                </h3>
                <span className="text-[10px] font-black text-pp-primary uppercase tracking-widest">
                  DLS VERIFIED PRO
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase">DIVISION</span>
              <p className="text-xs font-black text-white">ELITE • S-TIER</p>
            </div>
          </div>

          {/* Record Grid */}
          <div className="grid grid-cols-4 gap-2 text-center p-3 rounded-2xl bg-pp-bg border border-pp-border mb-6">
            <div>
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Matches</span>
              <span className="text-sm font-black font-mono text-white">127</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Wins</span>
              <span className="text-sm font-black font-mono text-pp-primary">91</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Losses</span>
              <span className="text-sm font-black font-mono text-red-400">26</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Draws</span>
              <span className="text-sm font-black font-mono text-slate-300">10</span>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 rounded-xl bg-pp-surface border border-pp-border">
              <span className="text-xs font-bold text-slate-300 uppercase">WIN RATE</span>
              <span className="text-base font-black font-mono text-pp-primary">71.6%</span>
            </div>

            <div className="flex justify-between items-center p-3 rounded-xl bg-pp-surface border border-pp-border">
              <span className="text-xs font-bold text-slate-300 uppercase">REPUTATION SCORE</span>
              <span className="text-base font-black font-mono text-white">1,942 PTS</span>
            </div>

            <div className="flex justify-between items-center p-3 rounded-xl bg-pp-surface border border-pp-border">
              <span className="text-xs font-bold text-slate-300 uppercase">EVIDENCE INTEGRITY</span>
              <span className="text-base font-black font-mono text-pp-primary">98% VERIFIED</span>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-pp-border text-center">
            <Link
              href="/profile/create"
              className="text-xs font-black text-pp-primary hover:underline uppercase tracking-wider"
            >
              CREATE YOUR VERIFIED PLAYER CARD →
            </Link>
          </div>

        </div>
      </section>


      {/* ========================================================================= */}
      {/* 7. SECTION 7 — LEADERBOARD */}
      {/* ========================================================================= */}
      <section className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-b border-pp-border/60">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-pp-surface border border-pp-border text-pp-primary text-xs font-black tracking-widest uppercase mb-4">
            <Trophy size={14} /> GLOBAL STANDINGS
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white uppercase tracking-tight leading-tight">
            THE BEST PLAYERS RISE.
          </h2>
          <p className="text-slate-400 text-sm sm:text-base mt-3">
            Rankings are mathematically computed from verified win rates, match count, and evidence credibility.
          </p>
        </div>

        {/* Leaderboard Table / Cards */}
        <div className="max-w-4xl mx-auto bg-pp-surface border border-pp-border rounded-3xl overflow-hidden shadow-2xl">
          <div className="divide-y divide-pp-border/60">
            {[
              { rank: "01", name: "David_7", rep: "1,942", winRate: "71.6%", matches: "127", roi: "89%", badge: "🥇" },
              { rank: "02", name: "TimiLegend", rep: "1,810", winRate: "68.4%", matches: "114", roi: "84%", badge: "🥈" },
              { rank: "03", name: "KingJay", rep: "1,765", winRate: "65.0%", matches: "98", roi: "79%", badge: "🥉" },
              { rank: "04", name: "LegendFC", rep: "1,690", winRate: "63.2%", matches: "88", roi: "76%", badge: "4" },
              { rank: "05", name: "DLSMaster", rep: "1,640", winRate: "61.8%", matches: "82", roi: "72%", badge: "5" },
            ].map((player) => (
              <div
                key={player.rank}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-pp-surface-hover transition-colors"
              >
                <div className="flex items-center gap-4">
                  <span className="w-8 font-black font-mono text-base sm:text-lg text-pp-text-muted">
                    {player.rank}
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-pp-bg border border-pp-border flex items-center justify-center font-black text-white text-sm">
                    {player.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-base font-black text-white uppercase flex items-center gap-1.5">
                      {player.name} <ShieldCheck size={14} className="text-pp-primary" />
                    </h4>
                    <span className="text-[11px] text-slate-400 font-semibold">
                      {player.matches} Matches • {player.winRate} Win Rate
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-6 pl-12 sm:pl-0">
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Prediction ROI</span>
                    <span className="text-xs sm:text-sm font-black font-mono text-white">{player.roi}</span>
                  </div>
                  <div className="text-right min-w-[75px]">
                    <span className="text-[10px] font-bold text-pp-primary uppercase block">Reputation</span>
                    <span className="text-sm sm:text-base font-black font-mono text-pp-primary">{player.rep}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 bg-pp-bg text-center border-t border-pp-border">
            <Link
              href="/rankings"
              className="text-xs font-black text-slate-300 hover:text-white uppercase tracking-widest flex items-center justify-center gap-1.5"
            >
              VIEW FULL GLOBAL RANKINGS <ChevronRight size={16} className="text-pp-primary" />
            </Link>
          </div>
        </div>
      </section>


      {/* ========================================================================= */}
      {/* 8. SECTION 8 — FINAL CTA */}
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
      {/* 9. GRAND PRIZE WINNERS TICKER (Horizontal Scroll at the bottom) */}
      {/* ========================================================================= */}
      <div className="border-t border-pp-border/60 bg-pp-surface/40 py-6">
        <GrandPrizeWinners />
      </div>


      {/* ========================================================================= */}
      {/* 10. LIVE ACTIVITY NOTIFICATION TOAST FEED */}
      {/* ========================================================================= */}
      <ActivityFeed />

    </div>
  );
}

