"use client";

import { USERS } from "@/lib/mockData";
import { Trophy, Gamepad2, Target, Medal, Share2, ShieldCheck, Activity } from "lucide-react";
import { use } from "react";

export default function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const user = USERS.find(u => u.id === resolvedParams.id) || USERS[0]; // Fallback to first user for demo

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      
      {/* Profile Header */}
      <div className="relative bg-pp-surface border border-pp-border rounded-2xl p-6 md:p-10 overflow-hidden mb-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-pp-primary/10 rounded-full blur-[80px] -z-10 translate-x-1/2 -translate-y-1/2"></div>
        
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8 relative z-10">
          <div className="relative">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-pp-bg overflow-hidden relative z-10">
              <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
            </div>
            {user.ranking <= 3 && (
              <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center border-4 border-pp-bg z-20 text-black shadow-lg">
                <Trophy size={20} className="fill-black" />
              </div>
            )}
          </div>
          
          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
              <div>
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-1 flex items-center justify-center md:justify-start gap-3">
                  {user.username}
                  <ShieldCheck className="text-pp-primary" size={24} />
                </h1>
                <p className="text-pp-text-muted font-mono">ID: {user.id}</p>
              </div>
              <div className="flex items-center gap-3 justify-center">
                <button className="px-6 py-2 bg-pp-primary text-black font-bold rounded-lg hover:bg-pp-primary-dark transition-colors">
                  CHALLENGE
                </button>
                <button className="p-2 bg-pp-bg border border-pp-border rounded-lg text-pp-text-muted hover:text-white transition-colors">
                  <Share2 size={20} />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-6">
              <div className="flex items-center gap-2 bg-pp-bg border border-pp-border px-4 py-2 rounded-lg">
                <span className="text-xs text-pp-text-muted uppercase font-bold">Global Rank</span>
                <span className="text-xl font-black text-white">#{user.ranking}</span>
              </div>
              <div className="flex items-center gap-2 bg-pp-bg border border-pp-border px-4 py-2 rounded-lg">
                <span className="text-xs text-pp-text-muted uppercase font-bold">Reputation</span>
                <span className="text-xl font-black text-pp-primary">{user.reputation}</span>
              </div>
              <div className="flex items-center gap-2 bg-pp-bg border border-pp-border px-4 py-2 rounded-lg">
                <span className="text-xs text-pp-text-muted uppercase font-bold">Country</span>
                <span className="text-xl font-black text-white">{user.country}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Stats */}
        <div className="space-y-8">
          {/* Ratings */}
          <div className="bg-pp-surface border border-pp-border rounded-xl p-6">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
              <Gamepad2 className="text-pp-accent" />
              GAME RATINGS
            </h2>
            <div className="space-y-4">
              <div className="bg-pp-bg rounded-lg p-4 border border-pp-border flex justify-between items-center">
                <span className="font-bold">Dream League Soccer</span>
                <span className="text-2xl font-black text-pp-primary">{user.dlsRating}</span>
              </div>
              <div className="bg-pp-bg rounded-lg p-4 border border-pp-border flex justify-between items-center">
                <span className="font-bold">eFootball</span>
                <span className="text-2xl font-black text-pp-secondary">{user.eFootballRating}</span>
              </div>
            </div>
          </div>

          {/* Match Record */}
          <div className="bg-pp-surface border border-pp-border rounded-xl p-6">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
              <Activity className="text-pp-secondary" />
              MATCH RECORD
            </h2>
            
            <div className="flex items-end justify-between mb-8">
              <div>
                <p className="text-sm text-pp-text-muted font-bold mb-1">WIN RATE</p>
                <div className="text-4xl font-black text-white">{user.winRate}%</div>
              </div>
              <div className="text-right">
                <p className="text-sm text-pp-text-muted font-bold mb-1">TOTAL MATCHES</p>
                <div className="text-2xl font-bold text-white">{user.matches}</div>
              </div>
            </div>

            <div className="h-4 w-full bg-red-500/20 rounded-full overflow-hidden flex mb-6">
              <div 
                className="h-full bg-pp-primary transition-all duration-1000"
                style={{ width: `${user.winRate}%` }}
              ></div>
            </div>

            <div className="flex justify-between text-sm font-bold">
              <span className="text-pp-primary">{user.wins} WINS</span>
              <span className="text-red-500">{user.losses} LOSSES</span>
            </div>
            
            <div className="mt-8 pt-6 border-t border-pp-border">
              <p className="text-sm text-pp-text-muted font-bold mb-3 uppercase">Current Form</p>
              <div className="flex gap-2">
                {user.form.map((result, i) => (
                  <div 
                    key={i} 
                    className={`flex-1 h-10 rounded flex items-center justify-center font-bold ${
                      result === 'W' 
                        ? 'bg-pp-primary/20 text-pp-primary border border-pp-primary/30' 
                        : 'bg-red-500/20 text-red-500 border border-red-500/30'
                    }`}
                  >
                    {result}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: History & Achievements */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Achievements */}
          <div className="bg-pp-surface border border-pp-border rounded-xl p-6">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
              <Medal className="text-yellow-500" />
              ACHIEVEMENTS
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { name: "Centurion", desc: "100 Matches", icon: Target, unlocked: true },
                { name: "Flawless", desc: "10 Win Streak", icon: Trophy, unlocked: true },
                { name: "Predictor", desc: "1000 Pts Won", icon: Activity, unlocked: true },
                { name: "Champion", desc: "Win Tournament", icon: Medal, unlocked: false },
              ].map((achievement, i) => {
                const Icon = achievement.icon;
                return (
                  <div 
                    key={i} 
                    className={`p-4 rounded-lg border text-center transition-all ${
                      achievement.unlocked 
                        ? 'bg-pp-bg border-pp-border hover:border-pp-primary/50' 
                        : 'bg-pp-bg/50 border-transparent opacity-50 grayscale'
                    }`}
                  >
                    <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-3 ${achievement.unlocked ? 'bg-pp-surface border border-pp-border text-white' : 'bg-gray-800 text-gray-500'}`}>
                      <Icon size={20} className={achievement.unlocked ? 'text-pp-primary' : ''} />
                    </div>
                    <h3 className="font-bold text-sm text-white">{achievement.name}</h3>
                    <p className="text-[10px] text-pp-text-muted mt-1 uppercase">{achievement.desc}</p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Recent Matches */}
          <div className="bg-pp-surface border border-pp-border rounded-xl overflow-hidden">
            <div className="p-6 border-b border-pp-border flex justify-between items-center">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Gamepad2 className="text-white" />
                RECENT MATCHES
              </h2>
              <button className="text-sm text-pp-primary hover:underline font-medium">View All</button>
            </div>
            
            <div className="divide-y divide-pp-border">
              {[1, 2, 3, 4].map((i) => {
                const won = i !== 3; // Make 3rd match a loss
                return (
                  <div key={i} className="p-4 hover:bg-pp-surface-hover transition-colors flex items-center gap-4">
                    <div className={`w-10 h-10 rounded flex items-center justify-center font-bold flex-shrink-0 ${
                      won ? 'bg-pp-primary/20 text-pp-primary' : 'bg-red-500/20 text-red-500'
                    }`}>
                      {won ? 'W' : 'L'}
                    </div>
                    <div className="flex-1 min-w-0 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-white bg-pp-bg px-2 py-1 rounded border border-pp-border">DLS</span>
                        <div className="text-sm">
                          <span className="text-pp-text-muted">vs</span>
                          {' '}
                          <span className="font-bold text-white">{i === 1 ? 'KingDLS' : i === 2 ? 'Ronaldo_10' : i === 3 ? 'Prime_Messi' : 'TimiLegend'}</span>
                        </div>
                      </div>
                      <div className="text-xl font-mono font-black tracking-tighter ml-4">
                        {won ? '3 - 1' : '0 - 2'}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 w-24">
                      <div className={`text-sm font-bold ${won ? 'text-pp-primary' : 'text-red-500'}`}>
                        {won ? '+12' : '-8'}
                      </div>
                      <div className="text-[10px] text-pp-text-muted uppercase">Rating Change</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
