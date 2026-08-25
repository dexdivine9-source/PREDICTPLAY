import Link from "next/link";
import { USERS, RECENT_ACTIVITY } from "@/lib/mockData";
import { Gamepad2, PlaySquare, Trophy, Activity } from "lucide-react";

export default function Home() {
  const topPlayers = [...USERS].sort((a, b) => a.ranking - b.ranking).slice(0, 5);

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
            The competitive matchmaking and spectator platform for DLS & eFootball players. Play matches to climb the ranks, or spectate and back your favorites.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link 
              href="/matches" 
              className="px-8 py-4 bg-pp-primary text-black font-bold rounded-lg hover:bg-pp-primary-dark transition-all transform hover:scale-105 flex items-center gap-2 w-full sm:w-auto justify-center"
            >
              <Gamepad2 size={20} />
              FIND AN OPPONENT
            </Link>
            <Link 
              href="/markets" 
              className="px-8 py-4 bg-pp-surface border border-pp-border text-white font-bold rounded-lg hover:bg-pp-surface-hover transition-all flex items-center gap-2 w-full sm:w-auto justify-center"
            >
              <PlaySquare size={20} />
              SPECTATE LIVE MATCHES
            </Link>
          </div>
        </div>
      </section>

      {/* Dashboard Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Quick Actions / Matchmaking Hub */}
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
            
            {/* Top Players */}
            <div>
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2 uppercase tracking-wide">
                <Trophy className="text-pp-primary" size={20} />
                Global Leaders
              </h2>
              <div className="bg-pp-surface border border-pp-border rounded-xl overflow-hidden">
                {topPlayers.map((player, index) => (
                  <Link href={`/profile/${player.id}`} key={player.id} className="flex items-center gap-3 p-4 hover:bg-pp-surface-hover transition-colors border-b border-pp-border last:border-0">
                    <div className="w-6 font-black text-pp-text-muted text-center">{index + 1}</div>
                    <img src={player.avatar} alt={player.username} className="w-10 h-10 rounded-full border border-pp-border" />
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm truncate text-white">{player.username}</div>
                      <div className="text-xs text-pp-text-muted truncate font-bold uppercase">
                        {player.winRate}% Win Rate
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-black text-pp-primary">{Math.max(player.dlsRating, player.eFootballRating)}</div>
                      <div className="text-[10px] font-bold text-pp-text-muted uppercase">Rating</div>
                    </div>
                  </Link>
                ))}
                <Link href="/rankings" className="block p-3 text-center text-xs font-bold text-pp-text-muted hover:text-white bg-black/20 hover:bg-black/40 transition-colors uppercase tracking-widest">
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
              <div className="bg-pp-surface border border-pp-border rounded-xl p-4 space-y-4">
                {RECENT_ACTIVITY.map((activity) => (
                  <div key={activity.id} className="flex gap-3">
                    <img src={activity.user.avatar} alt={activity.user.username} className="w-8 h-8 rounded-full border border-pp-border" />
                    <div className="flex-1 text-sm">
                      <p>
                        <Link href={`/profile/${activity.user.id}`} className="font-bold text-white hover:underline">{activity.user.username}</Link>
                        {' '}
                        <span className="text-pp-text-muted">{activity.action}</span>
                        {' '}
                        {activity.target && <span className="font-bold text-white">{activity.target}</span>}
                      </p>
                      <p className="text-[10px] font-bold text-pp-text-muted mt-0.5 uppercase tracking-wide">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
}
