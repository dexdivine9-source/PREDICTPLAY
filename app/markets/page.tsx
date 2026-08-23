"use client";

import Link from "next/link";
import { LIVE_MATCHES, UPCOMING_MATCHES } from "@/lib/mockData";
import { PlaySquare, Users as UsersIcon, ArrowRight, ShieldCheck } from "lucide-react";

export default function MarketsPage() {
  const allMatches = [...LIVE_MATCHES, ...UPCOMING_MATCHES];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
            <PlaySquare className="text-pp-accent" size={32} />
            SPECTATOR HUB
          </h1>
          <p className="text-pp-text-muted mt-2">Watch high-stakes matches and back your favorite players with virtual points.</p>
        </div>
        <div className="bg-pp-surface border border-pp-border rounded-lg px-4 py-2 flex items-center gap-3">
          <span className="text-xs font-bold text-pp-text-muted uppercase">My Balance</span>
          <span className="text-xl font-black text-pp-accent">2,450 PTS</span>
        </div>
      </div>

      <div className="bg-pp-surface border border-pp-border rounded-xl p-4 mb-8 flex items-start gap-4">
        <ShieldCheck className="text-pp-primary flex-shrink-0 mt-1" size={24} />
        <div>
          <h4 className="text-white font-bold text-sm">Verified Outcomes</h4>
          <p className="text-pp-text-muted text-xs mt-1">All match outcomes are securely verified by participant consensus and admin review before points are distributed to supporters.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-8">
        <button className="px-4 py-2 bg-pp-primary text-black font-bold rounded-lg text-sm transition-colors uppercase">All Matches</button>
        <button className="px-4 py-2 bg-pp-surface border border-pp-border text-white font-bold rounded-lg hover:bg-pp-surface-hover text-sm transition-colors uppercase">Live Now</button>
        <div className="w-px h-6 bg-pp-border mx-2 self-center"></div>
        <button className="px-4 py-2 bg-pp-surface border border-pp-border text-white font-bold rounded-lg hover:bg-pp-surface-hover text-sm transition-colors uppercase">DLS</button>
        <button className="px-4 py-2 bg-pp-surface border border-pp-border text-white font-bold rounded-lg hover:bg-pp-surface-hover text-sm transition-colors uppercase">eFootball</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {allMatches.map((match) => (
          <div key={match.id} className="bg-pp-surface border border-pp-border rounded-xl p-6 flex flex-col hover:border-pp-primary/30 transition-colors">
            
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                   <span className="text-[10px] font-bold bg-white/10 px-2 py-0.5 rounded text-white uppercase">{match.game}</span>
                   {match.status === "LIVE" ? (
                     <span className="text-[10px] font-bold bg-red-500/20 text-red-500 px-2 py-0.5 rounded uppercase flex items-center gap-1">
                       <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div> Live
                     </span>
                   ) : (
                     <span className="text-[10px] font-bold bg-pp-border text-pp-text-muted px-2 py-0.5 rounded uppercase">Upcoming</span>
                   )}
                </div>
                <h3 className="font-bold text-lg text-white">{match.player1.username} vs {match.player2.username}</h3>
              </div>
              <div className="text-right">
                <div className="text-pp-accent font-black text-lg">{match.totalPool.toLocaleString()}</div>
                <div className="text-[10px] font-bold text-pp-text-muted uppercase">Pts Pool</div>
              </div>
            </div>
            
            <div className="mb-4">
              <span className="text-xs font-bold text-pp-text-muted uppercase mb-2 block">Supporter Split</span>
              <div className="flex gap-2 h-10 rounded-lg overflow-hidden font-bold">
                <div className="bg-pp-bg border border-pp-border text-white flex items-center justify-center flex-1 transition-colors hover:border-pp-primary group relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 bg-pp-primary/10" style={{ width: '62%' }}></div>
                  <span className="text-xs z-10">{match.player1.username} (62%)</span>
                </div>
                <div className="bg-pp-bg border border-pp-border text-white flex items-center justify-center flex-1 transition-colors hover:border-pp-secondary group relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 bg-pp-secondary/10" style={{ width: '38%' }}></div>
                  <span className="text-xs z-10">{match.player2.username} (38%)</span>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center mt-auto pt-4 border-t border-pp-border">
              <div className="flex items-center gap-2 text-xs font-bold text-pp-text-muted uppercase">
                <UsersIcon size={14} />
                <span>{match.predictionsCount.toLocaleString()} Supporters</span>
              </div>
              <Link href={`/matches/${match.id}`} className="text-sm font-bold text-pp-primary hover:text-pp-primary-dark transition-colors flex items-center gap-1 uppercase tracking-wide">
                BACK A PLAYER <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
