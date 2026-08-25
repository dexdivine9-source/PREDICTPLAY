"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Gamepad2, 
  Swords, 
  Activity, 
  Flame, 
  Clock, 
  ChevronRight, 
  Coins, 
  Radio, 
  Plus
} from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, query, getDocs, limit } from "firebase/firestore";
import ActivityFeed from "@/components/ActivityFeed";
import GrandPrizeWinners from "@/components/GrandPrizeWinners";

interface MatchItem {
  id: string;
  game: string;
  state: string;
  stake?: number;
  totalPool?: number;
  creatorGamertag?: string;
  opponentGamertag?: string;
  player1Gamertag?: string;
  player2Gamertag?: string;
  player1Id?: string;
  player2Id?: string;
  createdAt?: any;
}

interface ActivityItem {
  id: string;
  title: string;
  description: string;
  time: string;
  type: "match" | "prediction" | "verification";
}

export default function Home() {
  const [liveMatches, setLiveMatches] = useState<MatchItem[]>([]);
  const [upcomingMatches, setUpcomingMatches] = useState<MatchItem[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch recent matches from Firestore
        const matchesQuery = query(
          collection(db, "matches"),
          limit(25)
        );
        const matchesSnap = await getDocs(matchesQuery);

        const liveList: MatchItem[] = [];
        const upcomingList: MatchItem[] = [];
        const activityFeed: ActivityItem[] = [];

        matchesSnap.forEach((docSnap) => {
          const data = docSnap.data();
          const match: MatchItem = {
            id: docSnap.id,
            game: data.game || "DLS",
            state: data.state || "OPEN",
            stake: data.stake ?? 100,
            totalPool: data.totalPool ?? 0,
            creatorGamertag: data.creatorGamertag || data.player1Gamertag || "Challenger",
            opponentGamertag: data.opponentGamertag || data.player2Gamertag || "Opponent",
            player1Gamertag: data.player1Gamertag || data.creatorGamertag || "Challenger",
            player2Gamertag: data.player2Gamertag || data.opponentGamertag || "Opponent",
            player1Id: data.player1Id || data.creatorId,
            player2Id: data.player2Id,
            createdAt: data.createdAt,
          };

          if (["ACCEPTED", "IN_PROGRESS", "PLAYING", "SUBMITTED"].includes(match.state.toUpperCase())) {
            liveList.push(match);
            activityFeed.push({
              id: `act-${docSnap.id}-live`,
              title: `${match.player1Gamertag} vs ${match.player2Gamertag}`,
              description: `Live ${match.game} match currently in progress`,
              time: "Live Now",
              type: "match",
            });
          } else {
            upcomingList.push(match);
            activityFeed.push({
              id: `act-${docSnap.id}-open`,
              title: `New ${match.game} Challenge Posted`,
              description: `${match.player1Gamertag} is seeking an opponent (${match.stake} PTS)`,
              time: "Recently",
              type: "match",
            });
          }
        });

        // Add standard platform activities
        activityFeed.unshift(
          {
            id: "act-default-1",
            title: "Global Reputation Engine Online",
            description: "Fair play and automated evidence verification active.",
            time: "ACTIVE",
            type: "verification",
          },
          {
            id: "act-default-2",
            title: "DLS Matchmaking Pool Open",
            description: "Create or accept 1v1 challenges instantly.",
            time: "ACTIVE",
            type: "match",
          }
        );

        setLiveMatches(liveList.slice(0, 4));
        setUpcomingMatches(upcomingList.slice(0, 5));
        setActivities(activityFeed.slice(0, 5));
      } catch (err) {
        console.error("Error fetching homepage data:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  return (
    <div className="space-y-8 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-8 sm:py-12 md:py-16 border-b border-pp-border">
        <div className="absolute inset-0 bg-gradient-to-b from-pp-secondary/5 to-transparent pointer-events-none"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[240px] h-[240px] sm:w-[400px] sm:h-[400px] bg-pp-primary/5 rounded-full blur-[80px] pointer-events-none"></div>

        <div className="max-w-2xl mx-auto px-4 sm:px-6 relative z-10 text-center">
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold tracking-tight mb-3 sm:mb-4 text-white uppercase leading-tight">
            Verify Your Skill.<br />
            <span className="text-pp-primary">Back The Best.</span>
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-pp-text-muted max-w-lg mx-auto leading-relaxed">
            The verified competitive matchmaking and prediction platform for DLS & eFootball players. Every game has a winner. Can you predict it?
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-8">
        
        {/* 1. TOP LIVE MATCHES */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
              </span>
              <h2 className="text-sm sm:text-base font-bold text-white uppercase tracking-wide flex items-center gap-1.5">
                <Flame className="text-red-500" size={16} />
                TOP LIVE MATCHES
              </h2>
            </div>
            <Link 
              href="/markets" 
              className="text-xs font-bold text-pp-primary hover:underline flex items-center gap-0.5 uppercase tracking-wider"
            >
              SPECTATE ALL <ChevronRight size={14} />
            </Link>
          </div>

          {loading ? (
            <div className="bg-pp-surface border border-pp-border rounded-xl p-6 text-center text-xs text-pp-text-muted">
              Loading live matches...
            </div>
          ) : liveMatches.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {liveMatches.map((m) => (
                <div 
                  key={m.id}
                  className="bg-pp-surface border border-pp-border hover:border-pp-primary/40 transition-all rounded-xl p-4 flex flex-col justify-between gap-3 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-pp-bg border border-pp-border text-white">
                      {m.game}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
                      <Radio size={10} className="animate-pulse" /> LIVE
                    </span>
                  </div>

                  <div className="py-1">
                    <div className="flex items-center justify-between text-xs font-bold text-white">
                      <span className="truncate max-w-[120px]">{m.player1Gamertag}</span>
                      <span className="text-pp-text-muted text-[10px] px-2">VS</span>
                      <span className="truncate max-w-[120px] text-right">{m.player2Gamertag}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-pp-border/60">
                    <div className="flex items-center gap-1 text-[11px] text-pp-text-muted">
                      <Coins size={12} className="text-pp-primary" />
                      <span className="font-bold text-white font-mono">{m.stake} PTS</span>
                    </div>
                    <Link
                      href={`/matches/${m.id}`}
                      className="px-3 py-1.5 bg-pp-primary text-black font-bold text-xs rounded hover:bg-pp-primary-dark transition-colors flex items-center gap-1 uppercase tracking-wide"
                    >
                      Spectate
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-pp-surface border border-pp-border rounded-xl p-6 text-center space-y-1.5">
              <p className="text-xs font-medium text-pp-text-muted">No live matches in progress right now.</p>
              <p className="text-[11px] text-pp-text-muted">Accepted challenges will immediately appear here live for spectators!</p>
            </div>
          )}
        </section>

        {/* 2. UPCOMING MATCHES */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-white uppercase tracking-wide flex items-center gap-1.5">
                <Swords className="text-pp-primary" size={16} />
                UPCOMING MATCHES
              </h2>
            </div>
            <Link 
              href="/matches" 
              className="text-xs font-bold text-pp-primary hover:underline flex items-center gap-0.5 uppercase tracking-wider"
            >
              VIEW ALL <ChevronRight size={14} />
            </Link>
          </div>

          {loading ? (
            <div className="bg-pp-surface border border-pp-border rounded-xl p-6 text-center text-xs text-pp-text-muted">
              Loading upcoming challenges...
            </div>
          ) : upcomingMatches.length > 0 ? (
            <div className="space-y-2.5">
              {upcomingMatches.map((m) => (
                <div 
                  key={m.id}
                  className="bg-pp-surface border border-pp-border hover:border-pp-border/80 transition-colors rounded-xl p-3.5 sm:p-4 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-pp-bg border border-pp-border flex items-center justify-center text-pp-primary font-bold text-xs flex-shrink-0">
                      <Gamepad2 size={16} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white truncate">
                          {m.player1Gamertag}
                        </span>
                        <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-pp-bg border border-pp-border text-pp-text-muted">
                          {m.game}
                        </span>
                      </div>
                      <p className="text-[11px] text-pp-text-muted flex items-center gap-1 mt-0.5">
                        <Clock size={11} /> Waiting for opponent • <span className="text-pp-primary font-mono font-bold">{m.stake} PTS</span>
                      </p>
                    </div>
                  </div>

                  <Link
                    href={`/matches/${m.id}`}
                    className="px-3 py-1.5 bg-pp-surface-hover border border-pp-border text-white hover:border-pp-primary hover:text-pp-primary font-bold text-xs rounded transition-colors flex-shrink-0 uppercase tracking-wide flex items-center gap-1"
                  >
                    Accept
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-pp-surface border border-pp-border rounded-xl p-6 text-center space-y-3">
              <p className="text-xs font-medium text-pp-text-muted">No open challenges waiting at the moment.</p>
              <Link 
                href="/matches/create" 
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-pp-primary text-black font-bold rounded-lg text-xs uppercase tracking-wide hover:bg-pp-primary-dark transition-colors"
              >
                <Plus size={14} /> POST FIRST CHALLENGE
              </Link>
            </div>
          )}
        </section>

        {/* 3. PLATFORM ACTIVITIES */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm sm:text-base font-bold text-white uppercase tracking-wide flex items-center gap-1.5">
              <Activity className="text-pp-secondary" size={16} />
              PLATFORM ACTIVITIES
            </h2>
          </div>

          <div className="bg-pp-surface border border-pp-border rounded-xl p-4 sm:p-5">
            {activities.length > 0 ? (
              <div className="divide-y divide-pp-border/50">
                {activities.map((act) => (
                  <div key={act.id} className="py-3 first:pt-0 last:pb-0 flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-pp-primary mt-1.5 flex-shrink-0"></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-bold text-white truncate">{act.title}</p>
                        <span className="text-[10px] text-pp-text-muted uppercase font-bold flex-shrink-0">{act.time}</span>
                      </div>
                      <p className="text-[11px] text-pp-text-muted mt-0.5 leading-snug">{act.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-4 text-center text-xs text-pp-text-muted">
                No recent activity recorded yet.
              </div>
            )}
          </div>
        </section>

        {/* 4. GRAND PRIZE WINNERS TICKER */}
        <GrandPrizeWinners />

      </div>

      {/* Live Activity Notification Feed */}
      <ActivityFeed />
    </div>
  );
}
