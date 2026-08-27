"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PlaySquare, Users as UsersIcon, ArrowRight, ShieldCheck, Gamepad2, Plus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import ComingSoonModal from "@/components/ComingSoonModal";

interface MarketMatch {
  id: string;
  game: string;
  state: string;
  player1Gamertag?: string;
  player2Gamertag?: string;
  totalPool?: number;
  predictionsCount?: number;
}

interface LiveAdminMatch {
  id: string;
  game: string;
  state: string;
  player1Gamertag: string;
  player2Gamertag: string;
  question: string;
  totalPool: number;
  yesPool: number;
  noPool: number;
  marketStatus: string;
}

export default function MarketsPage() {
  const [adminMatches, setAdminMatches] = useState<LiveAdminMatch[]>([]);
  const [matches, setMatches] = useState<MarketMatch[]>([]);
  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [showComingSoon, setShowComingSoon] = useState(false);

  useEffect(() => {
    async function fetchMarketsData() {
      try {
        // 1. Fetch live admin-curated matches
        const { data: adminData } = await supabase
          .from("matches")
          .select("*, markets(*)")
          .eq("is_admin_match", true)
          .in("state", ["OPEN", "IN_PROGRESS", "ADMIN_SCHEDULED"])
          .order("created_at", { ascending: false })
          .limit(10);

        if (adminData) {
          // Fetch player names for admin matches
          const userIds = Array.from(new Set(adminData.flatMap((m) => [m.player1_id, m.player2_id]).filter(Boolean)));
          const { data: playerProfiles } = await supabase
            .from("player_profiles")
            .select("id, username, gamertag")
            .in("id", userIds);

          const profileMap = new Map((playerProfiles || []).map((p) => [p.id, p.gamertag || p.username || "Player"]));

          const parsedAdminMatches: LiveAdminMatch[] = adminData.map((item: any) => {
            const market = Array.isArray(item.markets) ? item.markets[0] : item.markets;
            const p1 = profileMap.get(item.player1_id) || "Player 1";
            const p2 = profileMap.get(item.player2_id) || "Player 2";
            return {
              id: item.id,
              game: item.game || "DLS",
              state: item.state || "OPEN",
              player1Gamertag: p1,
              player2Gamertag: p2,
              question: market?.question || item.question || `Will ${p1} defeat ${p2}?`,
              totalPool: market?.total_pool ?? 0,
              yesPool: market?.yes_pool ?? 0,
              noPool: market?.no_pool ?? 0,
              marketStatus: market?.status ?? "OPEN",
            };
          });

          setAdminMatches(parsedAdminMatches);
        }

        // 2. Fetch regular player matches that have an active market
        const { data, error } = await supabase
          .from("matches")
          .select("*, markets(total_pool, status)")
          .or("is_admin_match.is.null,is_admin_match.eq.false")
          .neq("state", "OPEN")
          .order("created_at", { ascending: false })
          .limit(20);

        if (error) {
          console.error("Error fetching market matches:", error);
          setMatches([]);
          return;
        }

        const list: MarketMatch[] = (data || []).map((item: any) => {
          const market = Array.isArray(item.markets) ? item.markets[0] : item.markets;
          return {
            id: item.id,
            game: item.game || "DLS",
            state: item.state || "OPEN",
            player1Gamertag: item.player1_gamertag || item.creator_gamertag || "Player 1",
            player2Gamertag: item.player2_gamertag || item.opponent_gamertag || "Player 2",
            totalPool: market?.total_pool ?? item.total_pool ?? 0,
            predictionsCount: item.predictions_count ?? 0,
          };
        });

        setMatches(list);
      } catch (err) {
        console.error("Error fetching market matches:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchMarketsData();
  }, []);

  const handleSelectFilter = (selected: string) => {
    if (selected === "EFOOTBALL") {
      setShowComingSoon(true);
      return;
    }
    setFilter(selected);
  };

  const filteredMatches = matches.filter((m) => {
    if (filter === "ALL") return true;
    return m.game.toUpperCase() === filter.toUpperCase();
  });

  const filteredAdminMatches = adminMatches.filter((m) => {
    if (filter === "ALL") return true;
    return m.game.toUpperCase() === filter.toUpperCase();
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
            <PlaySquare className="text-pp-accent" size={32} />
            PREDICT HUB
          </h1>
          <p className="text-pp-text-muted mt-2">Watch verified matches and predict outcomes in real-time.</p>
        </div>
      </div>

      {/* Featured Live Admin-Curated Matches */}
      {filteredAdminMatches.length > 0 && (
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              <h2 className="text-xl font-black text-white uppercase tracking-wider">
                Live Admin-Curated Markets
              </h2>
            </div>
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wide">
              Official YES/NO Markets
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredAdminMatches.map((am) => {
              const yesP = am.totalPool > 0 ? Math.round((am.yesPool / am.totalPool) * 100) : 50;
              const noP = am.totalPool > 0 ? Math.round((am.noPool / am.totalPool) * 100) : 50;

              return (
                <div
                  key={am.id}
                  className="bg-pp-surface border border-pp-primary/30 rounded-2xl p-6 relative overflow-hidden shadow-xl hover:border-pp-primary/60 transition-all flex flex-col justify-between"
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pp-primary via-amber-400 to-pp-accent" />
                  
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 bg-red-500/10 text-red-400 border border-red-500/30 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                          LIVE
                        </span>
                        <span className="text-[10px] font-bold bg-white/10 px-2 py-0.5 rounded text-white uppercase">
                          {am.game}
                        </span>
                      </div>
                      <span className="text-xs font-black font-mono text-pp-primary">
                        {am.totalPool.toLocaleString()} PTS POOL
                      </span>
                    </div>

                    <h3 className="text-xl font-black text-white uppercase mb-2">
                      {am.player1Gamertag} <span className="text-pp-text-muted font-normal text-sm">vs</span> {am.player2Gamertag}
                    </h3>

                    <p className="text-sm font-bold text-white/90 bg-pp-bg p-3 rounded-xl border border-pp-border mb-4">
                      "{am.question}"
                    </p>

                    {/* YES/NO Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between text-xs font-bold mb-1">
                        <span className="text-green-400">YES {yesP}%</span>
                        <span className="text-red-400">NO {noP}%</span>
                      </div>
                      <div className="w-full h-2.5 bg-pp-bg rounded-full overflow-hidden flex border border-pp-border">
                        <div style={{ width: `${yesP}%` }} className="bg-green-500" />
                        <div style={{ width: `${noP}%` }} className="bg-red-500" />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-pp-border">
                    <span className="text-xs font-bold text-pp-text-muted uppercase">
                      Instant Payout on Settle
                    </span>
                    <Link
                      href={`/live/${am.id}`}
                      className="px-5 py-2.5 bg-pp-primary text-black font-black rounded-xl hover:bg-pp-primary-dark transition-all text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-pp-primary/20"
                    >
                      <span>PREDICT NOW</span>
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="bg-pp-surface border border-pp-border rounded-xl p-4 mb-8 flex items-start gap-4">
        <ShieldCheck className="text-pp-primary flex-shrink-0 mt-1" size={24} />
        <div>
          <h4 className="text-white font-bold text-sm">Deterministic Verification</h4>
          <p className="text-pp-text-muted text-xs mt-1">
            Markets settle only after screenshot evidence is cryptographically verified and matched against both players.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-8">
        <button 
          onClick={() => handleSelectFilter("ALL")}
          className={`px-4 py-2 font-bold rounded-lg text-sm transition-colors uppercase ${
            filter === "ALL" ? "bg-pp-primary text-black" : "bg-pp-surface border border-pp-border text-white hover:bg-pp-surface-hover"
          }`}
        >
          All Matches
        </button>
        <button 
          onClick={() => handleSelectFilter("DLS")}
          className={`px-4 py-2 font-bold rounded-lg text-sm transition-colors uppercase ${
            filter === "DLS" ? "bg-pp-primary text-black" : "bg-pp-surface border border-pp-border text-white hover:bg-pp-surface-hover"
          }`}
        >
          DLS
        </button>
        <button 
          onClick={() => handleSelectFilter("EFOOTBALL")}
          className="px-4 py-2 font-bold rounded-lg text-sm transition-colors uppercase bg-pp-surface border border-pp-border text-white hover:bg-pp-surface-hover flex items-center gap-1.5"
        >
          eFootball
          <span className="text-[9px] bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded uppercase">Soon</span>
        </button>
      </div>

      {filteredMatches.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredMatches.map((match) => (
            <div key={match.id} className="bg-pp-surface border border-pp-border rounded-xl p-6 flex flex-col hover:border-pp-primary/30 transition-colors">
              
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-bold bg-white/10 px-2 py-0.5 rounded text-white uppercase">{match.game}</span>
                    <span className="text-[10px] font-bold bg-pp-border text-pp-text-muted px-2 py-0.5 rounded uppercase">
                      {match.state}
                    </span>
                  </div>
                  <h3 className="font-bold text-lg text-white">{match.player1Gamertag} vs {match.player2Gamertag}</h3>
                </div>
                <div className="text-right">
                  <div className="text-pp-accent font-black text-lg">{match.totalPool?.toLocaleString() || 0}</div>
                  <div className="text-[10px] font-bold text-pp-text-muted uppercase">Pts Pool</div>
                </div>
              </div>

              <div className="flex justify-between items-center mt-auto pt-4 border-t border-pp-border">
                <div className="flex items-center gap-2 text-xs font-bold text-pp-text-muted uppercase">
                  <UsersIcon size={14} />
                  <span>{match.predictionsCount ?? 0} Predictions</span>
                </div>
                <Link href={`/matches/${match.id}`} className="text-sm font-bold text-pp-primary hover:text-pp-primary-dark transition-colors flex items-center gap-1 uppercase tracking-wide">
                  VIEW MATCH <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-pp-surface border border-pp-border rounded-xl p-12 text-center">
          <Gamepad2 className="mx-auto text-pp-text-muted mb-3" size={36} />
          <h3 className="text-lg font-bold text-white mb-1">No Active Prediction Markets</h3>
          <p className="text-sm text-pp-text-muted max-w-md mx-auto mb-6">
            There are currently no active matches available for prediction. Create a match or accept an open challenge!
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/matches/create"
              className="px-6 py-3 bg-pp-primary text-black font-bold rounded-lg hover:bg-pp-primary-dark transition-all text-sm uppercase flex items-center gap-2"
            >
              <Plus size={16} />
              Create Match
            </Link>
            <Link
              href="/matches"
              className="px-6 py-3 bg-pp-bg border border-pp-border text-white font-bold rounded-lg hover:bg-pp-surface-hover transition-all text-sm uppercase"
            >
              Browse Open Challenges
            </Link>
          </div>
        </div>
      )}

      <ComingSoonModal
        isOpen={showComingSoon}
        onClose={() => setShowComingSoon(false)}
        title="eFootball Markets Coming Soon"
        description="Spectator prediction markets for eFootball are in final preparation and will go live alongside eFootball match verification. Dream League Soccer (DLS) prediction markets are active now!"
      />
    </div>
  );
}
