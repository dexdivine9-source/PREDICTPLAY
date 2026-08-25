"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PlaySquare, Users as UsersIcon, ArrowRight, ShieldCheck, Gamepad2, Plus } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, query, getDocs, limit } from "firebase/firestore";
import ComingSoonModal from "@/components/ComingSoonModal";

interface MarketMatch {
  id: string;
  game: string;
  state: string;
  creatorGamertag?: string;
  opponentGamertag?: string;
  player1Gamertag?: string;
  player2Gamertag?: string;
  totalPool?: number;
  predictionsCount?: number;
}

export default function MarketsPage() {
  const [matches, setMatches] = useState<MarketMatch[]>([]);
  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [showComingSoon, setShowComingSoon] = useState(false);

  useEffect(() => {
    async function fetchMatches() {
      try {
        const q = query(
          collection(db, "matches"),
          limit(20)
        );
        const snap = await getDocs(q);
        const list: MarketMatch[] = [];
        snap.forEach((doc) => {
          const data = doc.data();
          list.push({
            id: doc.id,
            game: data.game || "DLS",
            state: data.state || "OPEN",
            creatorGamertag: data.creatorGamertag || "Player 1",
            opponentGamertag: data.opponentGamertag || data.player2Gamertag || "Player 2",
            player1Gamertag: data.player1Gamertag || data.creatorGamertag || "Player 1",
            player2Gamertag: data.player2Gamertag || data.opponentGamertag || "Player 2",
            totalPool: data.totalPool ?? 0,
            predictionsCount: data.predictionsCount ?? 0,
          });
        });
        setMatches(list);
      } catch (err) {
        console.error("Error fetching market matches:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchMatches();
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
