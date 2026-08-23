"use client";

import { USERS } from "@/lib/mockData";
import Link from "next/link";
import { Trophy, Filter, Search } from "lucide-react";

export default function RankingsPage() {
  const rankedUsers = [...USERS].sort((a, b) => b.dlsRating - a.dlsRating); // Sort by DLS as default

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
            <Trophy className="text-yellow-500" size={32} />
            GLOBAL RANKINGS
          </h1>
          <p className="text-pp-text-muted mt-2">The best of the best in PredictPlay.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-pp-text-muted" size={18} />
            <input 
              type="text" 
              placeholder="Search players..." 
              className="bg-pp-surface border border-pp-border rounded-lg py-2 pl-10 pr-4 text-white focus:outline-none focus:border-pp-primary transition-colors w-full md:w-64"
            />
          </div>
          <button className="p-2 bg-pp-surface border border-pp-border rounded-lg text-pp-text-muted hover:text-white transition-colors">
            <Filter size={20} />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-8">
        <button className="px-4 py-2 bg-pp-primary text-black font-bold rounded-lg text-sm transition-colors">Global</button>
        <button className="px-4 py-2 bg-pp-surface border border-pp-border text-white font-bold rounded-lg hover:bg-pp-surface-hover text-sm transition-colors">Country</button>
        <button className="px-4 py-2 bg-pp-surface border border-pp-border text-white font-bold rounded-lg hover:bg-pp-surface-hover text-sm transition-colors">City</button>
        <button className="px-4 py-2 bg-pp-surface border border-pp-border text-white font-bold rounded-lg hover:bg-pp-surface-hover text-sm transition-colors">Friends</button>
        <div className="w-px h-6 bg-pp-border mx-2 self-center"></div>
        <button className="px-4 py-2 bg-pp-primary text-black font-bold rounded-lg text-sm transition-colors">DLS</button>
        <button className="px-4 py-2 bg-pp-surface border border-pp-border text-white font-bold rounded-lg hover:bg-pp-surface-hover text-sm transition-colors">eFootball</button>
      </div>

      <div className="bg-pp-surface border border-pp-border rounded-xl overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-pp-border bg-pp-bg text-xs font-bold text-pp-text-muted uppercase">
          <div className="col-span-1 text-center">Rank</div>
          <div className="col-span-4 md:col-span-3">Player</div>
          <div className="col-span-2 text-center hidden md:block">Country</div>
          <div className="col-span-2 text-center">Matches</div>
          <div className="col-span-2 text-center">Win Rate</div>
          <div className="col-span-3 md:col-span-2 text-right">Rating</div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-pp-border">
          {rankedUsers.map((user, index) => {
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
                
                <div className="col-span-4 md:col-span-3 flex items-center gap-3">
                  <img src={user.avatar} alt={user.username} className="w-10 h-10 rounded-full border border-pp-border" />
                  <span className="font-bold text-white group-hover:text-pp-primary transition-colors truncate">{user.username}</span>
                </div>
                
                <div className="col-span-2 justify-center hidden md:flex">
                  <span className="text-sm font-bold text-pp-text-muted">{user.country}</span>
                </div>
                
                <div className="col-span-2 text-center">
                  <span className="text-sm text-white">{user.matches}</span>
                </div>
                
                <div className="col-span-2 flex justify-center">
                   <div className={`px-2 py-1 rounded text-xs font-bold ${
                     user.winRate >= 70 ? 'bg-pp-primary/20 text-pp-primary' : 
                     user.winRate >= 60 ? 'bg-pp-accent/20 text-pp-accent' : 
                     'bg-pp-border text-white'
                   }`}>
                     {user.winRate}%
                   </div>
                </div>
                
                <div className="col-span-3 md:col-span-2 text-right">
                  <span className="text-xl font-black text-pp-primary">{user.dlsRating}</span>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  );
}
