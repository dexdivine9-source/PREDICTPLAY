"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Trophy, Search, ShieldCheck, Users as UsersIcon } from "lucide-react";
import { supabase } from "@/lib/supabase";
import ComingSoonModal from "@/components/ComingSoonModal";

interface RankedPlayer {
  id: string;
  username: string;
  game: string;
  reputation: number;
  isVerified: boolean;
  trustScore: number;
  matchesCount: number;
}

export default function RankingsPage() {
  const [players, setPlayers] = useState<RankedPlayer[]>([]);
  const [selectedGame, setSelectedGame] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showComingSoon, setShowComingSoon] = useState(false);

  useEffect(() => {
    async function fetchRankings() {
      try {
        const { data, error } = await supabase
          .from("player_profiles")
          .select("*")
          .order("reputation", { ascending: false })
          .limit(50);

        if (error) {
          console.error("Error loading rankings from Supabase:", error);
          setPlayers([]);
          return;
        }

        const list: RankedPlayer[] = (data || []).map((item) => ({
          id: item.id || item.user_id,
          username: item.gamertag || item.username || "Player",
          game: item.game || "DLS",
          reputation: item.reputation ?? 100,
          isVerified: item.is_verified ?? false,
          trustScore: item.trust_score ?? 0,
          matchesCount: item.matches_count ?? 0,
        }));

        setPlayers(list);
      } catch (err) {
        console.error("Error loading rankings:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchRankings();
  }, []);

  const handleSelectGame = (game: string) => {
    if (game === "EFOOTBALL") {
      setShowComingSoon(true);
      return;
    }
    setSelectedGame(game);
  };

  const filtered = players.filter((p) => {
    const matchesGame = selectedGame === "ALL" || p.game.toUpperCase() === selectedGame.toUpperCase();
    const matchesSearch = p.username.toLowerCase().includes(search.toLowerCase());
    return matchesGame && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
            <Trophy className="text-yellow-500" size={32} />
            GLOBAL RANKINGS
          </h1>
          <p className="text-pp-text-muted mt-2">Verified competitive player standings in PredictPlay.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-pp-text-muted" size={18} />
            <input 
              type="text" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search players..." 
              className="bg-pp-surface border border-pp-border rounded-lg py-2 pl-10 pr-4 text-white focus:outline-none focus:border-pp-primary transition-colors w-full md:w-64 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-8">
        <button 
          onClick={() => handleSelectGame("ALL")}
          className={`px-4 py-2 font-bold rounded-lg text-sm transition-colors uppercase ${
            selectedGame === "ALL" ? "bg-pp-primary text-black" : "bg-pp-surface border border-pp-border text-white hover:bg-pp-surface-hover"
          }`}
        >
          All Games
        </button>
        <button 
          onClick={() => handleSelectGame("DLS")}
          className={`px-4 py-2 font-bold rounded-lg text-sm transition-colors uppercase ${
            selectedGame === "DLS" ? "bg-pp-primary text-black" : "bg-pp-surface border border-pp-border text-white hover:bg-pp-surface-hover"
          }`}
        >
          DLS
        </button>
        <button 
          onClick={() => handleSelectGame("EFOOTBALL")}
          className="px-4 py-2 font-bold rounded-lg text-sm transition-colors uppercase bg-pp-surface border border-pp-border text-white hover:bg-pp-surface-hover flex items-center gap-1.5"
        >
          eFootball
          <span className="text-[9px] bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded uppercase">Soon</span>
        </button>
      </div>

      <div className="bg-pp-surface border border-pp-border rounded-xl overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-pp-border bg-pp-bg text-xs font-bold text-pp-text-muted uppercase">
          <div className="col-span-1 text-center">Rank</div>
          <div className="col-span-5 md:col-span-4">Player</div>
          <div className="col-span-2 text-center">Game</div>
          <div className="col-span-2 text-center hidden md:block">Verified</div>
          <div className="col-span-4 md:col-span-3 text-right">Reputation</div>
        </div>

        {/* Table Body */}
        {filtered.length > 0 ? (
          <div className="divide-y divide-pp-border">
            {filtered.map((user, index) => {
              const rank = index + 1;
              return (
                <Link href={`/profile/${user.id}`} key={user.id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-pp-surface-hover transition-colors group">
                  <div className="col-span-1 flex justify-center">
                    <span className={`text-lg font-black ${
                      rank === 1 ? 'text-yellow-500' : 
                      rank === 2 ? 'text-gray-400' : 
                      rank === 3 ? 'text-amber-600' : 'text-pp-text-muted'
                    }`}>
                      {rank}
                    </span>
                  </div>
                  
                  <div className="col-span-5 md:col-span-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-pp-bg border border-pp-border flex items-center justify-center font-bold text-white">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-bold text-white group-hover:text-pp-primary transition-colors truncate">{user.username}</span>
                  </div>
                  
                  <div className="col-span-2 text-center">
                    <span className="text-xs font-bold bg-white/10 px-2 py-1 rounded text-white uppercase">{user.game}</span>
                  </div>

                  <div className="col-span-2 justify-center hidden md:flex">
                    {user.isVerified ? (
                      <span className="text-xs font-bold text-pp-primary flex items-center gap-1">
                        <ShieldCheck size={14} /> Verified
                      </span>
                    ) : (
                      <span className="text-xs text-pp-text-muted">Unverified</span>
                    )}
                  </div>
                  
                  <div className="col-span-4 md:col-span-3 text-right">
                    <span className="text-xl font-black text-pp-primary">{user.reputation}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="p-12 text-center">
            <UsersIcon className="mx-auto text-pp-text-muted mb-3" size={32} />
            <h3 className="text-lg font-bold text-white mb-1">No Ranked Players Yet</h3>
            <p className="text-sm text-pp-text-muted max-w-md mx-auto mb-6">
              Be the first to verify your game profile, compete in matches, and top the global leaderboards!
            </p>
            <Link
              href="/profile/create"
              className="px-6 py-3 bg-pp-primary text-black font-bold rounded-lg hover:bg-pp-primary-dark transition-all text-sm uppercase"
            >
              Verify Game Profile
            </Link>
          </div>
        )}
      </div>

      <ComingSoonModal
        isOpen={showComingSoon}
        onClose={() => setShowComingSoon(false)}
        title="eFootball Rankings Coming Soon"
        description="eFootball competitive tier leaderboards will be available once eFootball match verification goes live. Dream League Soccer rankings are live now!"
      />
    </div>
  );
}
