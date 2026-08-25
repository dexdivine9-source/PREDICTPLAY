"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Gamepad2, PlaySquare, Trophy, Activity, ShieldCheck, Users as UsersIcon } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, query, limit, getDocs, orderBy } from "firebase/firestore";

interface TopPlayer {
  id: string;
  username: string;
  game?: string;
  reputation?: number;
  isVerified?: boolean;
  trustScore?: number;
  avatar?: string;
}

interface RecentActivityItem {
  id: string;
  text: string;
  time: string;
}

export default function Home() {
  const [topPlayers, setTopPlayers] = useState<TopPlayer[]>([]);
  const [activities, setActivities] = useState<RecentActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        // Fetch top real profiles from Firestore
        const profilesQuery = query(
          collection(db, "player_profiles"),
          limit(5)
        );
        const profilesSnap = await getDocs(profilesQuery);
        const players: TopPlayer[] = [];
        profilesSnap.forEach((doc) => {
          const data = doc.data();
          players.push({
            id: doc.id,
            username: data.gamertag || data.username || "Player",
            game: data.game || "DLS",
            reputation: data.reputation ?? 100,
            isVerified: data.isVerified ?? false,
            trustScore: data.trustScore ?? 0,
          });
        });
        setTopPlayers(players);

        // Fetch recent real matches for platform activity
        const matchesQuery = query(
          collection(db, "matches"),
          limit(5)
        );
        const matchesSnap = await getDocs(matchesQuery);
        const activityList: RecentActivityItem[] = [];
        matchesSnap.forEach((doc) => {
          const data = doc.data();
          activityList.push({
            id: doc.id,
            text: `${data.game || "Game"} match created (${data.state || "OPEN"})`,
            time: "Recently",
          });
        });
        setActivities(activityList);
      } catch (err) {
        console.error("Error loading home dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 lg:py-24 border-b border-pp-border">
        <div className="absolute inset-0 bg-gradient-to-b from-pp-secondary/5 to-transparent"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pp-primary/5 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 uppercase text-white drop-shadow-lg">
            Verify Your Skill.<br />
            <span className="text-pp-primary">Back The Best.</span>
          </h1>
          <p className="text-lg md:text-xl text-pp-text-muted mb-10 max-w-2xl mx-auto">
            The verified competitive matchmaking and prediction platform for DLS & eFootball players.
            Play matches to build reputation, or spectate verified matches.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link 
              href="/matches" 
              className="px-8 py-4 bg-pp-primary text-black font-bold rounded-lg hover:bg-pp-primary-dark transition-all transform hover:scale-105 flex items-center gap-2 w-full sm:w-auto justify-center uppercase tracking-wide"
            >
              <Gamepad2 size={20} />
              FIND AN OPPONENT
            </Link>
            <Link 
              href="/profile/create" 
              className="px-8 py-4 bg-pp-surface border border-pp-border text-white font-bold rounded-lg hover:bg-pp-surface-hover transition-all flex items-center gap-2 w-full sm:w-auto justify-center uppercase tracking-wide"
            >
              <ShieldCheck size={20} className="text-pp-primary" />
              VERIFY GAME PROFILE
            </Link>
          </div>
        </div>
      </section>

      {/* Dashboard Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Main Content Column */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-pp-surface border border-pp-border rounded-xl p-8 text-center flex flex-col items-center justify-center min-h-[300px]">
              <div className="w-16 h-16 rounded-full bg-pp-primary/10 border border-pp-primary/20 flex items-center justify-center text-pp-primary mb-4">
                <Gamepad2 size={32} />
              </div>
              <h3 className="text-2xl font-black text-white uppercase tracking-wide mb-2">Live Competitive Hub</h3>
              <p className="text-pp-text-muted max-w-md text-sm mb-6">
                Create a verified match, invite opponents, submit screenshot evidence, and climb the global rankings.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Link
                  href="/matches/create"
                  className="px-6 py-3 bg-pp-primary text-black font-bold rounded-lg hover:bg-pp-primary-dark transition-all flex items-center gap-2 text-sm uppercase tracking-wide"
                >
                  Create Match
                </Link>
                <Link
                  href="/matches"
                  className="px-6 py-3 bg-pp-bg border border-pp-border text-white font-bold rounded-lg hover:bg-pp-surface-hover transition-all flex items-center gap-2 text-sm uppercase tracking-wide"
                >
                  Browse Matches
                </Link>
              </div>
            </div>
          </div>

          {/* Sidebar Column */}
          <div className="space-y-8">

            {/* Top Players / Global Leaders */}
            <div>
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2 uppercase tracking-wide">
                <Trophy className="text-pp-primary" size={20} />
                Global Leaders
              </h2>
              <div className="bg-pp-surface border border-pp-border rounded-xl overflow-hidden">
                {topPlayers.length > 0 ? (
                  topPlayers.map((player, index) => (
                    <Link
                      href={`/profile/${player.id}`}
                      key={player.id}
                      className="flex items-center gap-3 p-4 hover:bg-pp-surface-hover transition-colors border-b border-pp-border last:border-0"
                    >
                      <div className="w-6 font-black text-pp-text-muted text-center">{index + 1}</div>
                      <div className="w-10 h-10 rounded-full bg-pp-bg border border-pp-border flex items-center justify-center font-bold text-white">
                        {player.username.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm truncate text-white flex items-center gap-1.5">
                          {player.username}
                          {player.isVerified && <ShieldCheck size={14} className="text-pp-primary" />}
                        </div>
                        <div className="text-xs text-pp-text-muted truncate font-bold uppercase">
                          {player.game}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-sm font-black text-pp-primary">{player.reputation}</div>
                        <div className="text-[10px] font-bold text-pp-text-muted uppercase">Reputation</div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="p-6 text-center">
                    <UsersIcon className="mx-auto text-pp-text-muted mb-2" size={24} />
                    <p className="text-sm text-pp-text-muted font-medium">No verified players yet.</p>
                    <Link
                      href="/profile/create"
                      className="inline-block mt-3 text-xs font-bold text-pp-primary hover:underline uppercase tracking-wide"
                    >
                      Verify your profile to join #1
                    </Link>
                  </div>
                )}
                <Link
                  href="/rankings"
                  className="block p-3 text-center text-xs font-bold text-pp-text-muted hover:text-white bg-black/20 hover:bg-black/40 transition-colors uppercase tracking-widest border-t border-pp-border"
                >
                  View Full Rankings
                </Link>
              </div>
            </div>

            {/* Recent Activity */}
            <div>
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2 uppercase tracking-wide">
                <Activity className="text-pp-secondary" size={20} />
                Platform Activity
              </h2>
              <div className="bg-pp-surface border border-pp-border rounded-xl p-4">
                {activities.length > 0 ? (
                  <div className="space-y-4">
                    {activities.map((activity) => (
                      <div key={activity.id} className="flex gap-3 text-sm">
                        <div className="w-2 h-2 rounded-full bg-pp-primary mt-1.5 flex-shrink-0"></div>
                        <div className="flex-1 text-xs">
                          <p className="text-white font-medium">{activity.text}</p>
                          <p className="text-[10px] font-bold text-pp-text-muted mt-0.5 uppercase tracking-wide">{activity.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-4 text-center">
                    <p className="text-xs text-pp-text-muted">No activity recorded yet.</p>
                    <p className="text-[11px] text-pp-text-muted mt-1">Live match events and predictions will appear here.</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
}
