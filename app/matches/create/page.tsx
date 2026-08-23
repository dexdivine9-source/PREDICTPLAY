"use client";

import { useState } from "react";
import Link from "next/link";
import { Copy, Check, Info } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/components/AuthProvider";

export default function CreateMatchPage() {
  const { user } = useAuth();
  const [created, setCreated] = useState(false);
  const [matchId, setMatchId] = useState("");
  const [copied, setCopied] = useState(false);
  const [game, setGame] = useState("dls");
  const [stake, setStake] = useState(100);
  const [error, setError] = useState("");
  
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError("You must be logged in to create a match.");
      return;
    }
    
    try {
      const docRef = await addDoc(collection(db, "matches"), {
        creatorId: user.uid,
        player1Id: user.uid,
        game,
        stake: Number(stake),
        state: "OPEN",
        createdAt: serverTimestamp()
      });
      setMatchId(docRef.id);
      setCreated(true);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(matchId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!user) {
    return <div className="text-center p-12">Please login first.</div>;
  }

  if (created) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-pp-surface border border-pp-primary/30 rounded-xl p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pp-primary to-pp-accent"></div>
          
          <h2 className="text-2xl font-bold mb-2">MATCH CREATED!</h2>
          <p className="text-pp-text-muted mb-8">Match ID: #{matchId.slice(0, 8)}</p>
          
          <div className="flex flex-col items-center mb-8">
            <h3 className="font-bold text-xl">Waiting for challenger...</h3>
            <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-yellow-500/10 text-yellow-500 rounded-full text-sm font-medium border border-yellow-500/20">
               <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></div>
               OPEN CHALLENGE
            </div>
          </div>

          <div className="bg-pp-bg rounded-lg p-6 mb-8 border border-pp-border">
            <p className="text-sm text-pp-text-muted mb-3 uppercase font-bold tracking-wider">Share Match Code</p>
            <div className="flex items-center justify-center gap-3">
              <span className="text-4xl font-mono font-black tracking-widest text-white">{matchId.slice(0, 8)}</span>
              <button 
                onClick={copyCode}
                className="p-3 bg-pp-surface hover:bg-pp-surface-hover rounded-lg transition-colors border border-pp-border text-pp-text-muted hover:text-white"
                title="Copy Code"
              >
                {copied ? <Check size={24} className="text-pp-primary" /> : <Copy size={24} />}
              </button>
            </div>
          </div>

          <Link href={`/matches/${matchId}`} className="inline-block px-8 py-4 bg-pp-primary text-black font-bold rounded-lg hover:bg-pp-primary-dark transition-colors w-full sm:w-auto">
            GO TO MATCH LOBBY
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-extrabold tracking-tight mb-8">CREATE MATCH</h1>
      
      {error && <div className="p-4 mb-4 text-red-400 bg-red-400/10 rounded-lg">{error}</div>}

      <form onSubmit={handleCreate} className="bg-pp-surface border border-pp-border rounded-xl p-6 md:p-8 space-y-6">
        {/* Game Selection */}
        <div>
          <label className="block text-sm font-bold text-pp-text-muted mb-3">GAME</label>
          <div className="grid grid-cols-2 gap-4">
            <label className="cursor-pointer relative">
              <input type="radio" name="game" value="dls" checked={game === "dls"} onChange={(e) => setGame(e.target.value)} className="peer sr-only" />
              <div className="p-4 bg-pp-bg border border-pp-border rounded-lg text-center peer-checked:border-pp-primary peer-checked:bg-pp-primary/5 transition-all">
                <span className="font-bold block text-white">Dream League Soccer</span>
              </div>
              <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-pp-primary opacity-0 peer-checked:opacity-100 transition-opacity"></div>
            </label>
            <label className="cursor-pointer relative">
              <input type="radio" name="game" value="efootball" checked={game === "efootball"} onChange={(e) => setGame(e.target.value)} className="peer sr-only" />
              <div className="p-4 bg-pp-bg border border-pp-border rounded-lg text-center peer-checked:border-pp-primary peer-checked:bg-pp-primary/5 transition-all">
                <span className="font-bold block text-white">eFootball</span>
              </div>
              <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-pp-primary opacity-0 peer-checked:opacity-100 transition-opacity"></div>
            </label>
          </div>
        </div>

        {/* Entry Fee */}
        <div>
          <label className="block text-sm font-bold text-pp-text-muted mb-3">ENTRY FEE (VIRTUAL POINTS)</label>
          <div className="relative">
            <input 
              type="number" 
              value={stake}
              onChange={(e) => setStake(Number(e.target.value))}
              min={10}
              className="w-full bg-pp-bg border border-pp-border rounded-lg p-3 pl-4 text-white focus:outline-none focus:border-pp-primary transition-colors font-mono font-bold text-lg"
            />
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
              <span className="text-pp-primary font-bold">PTS</span>
            </div>
          </div>
        </div>

        <button type="submit" className="w-full py-4 bg-pp-primary text-black font-bold rounded-lg hover:bg-pp-primary-dark transition-colors mt-4 text-lg">
          CREATE MATCH
        </button>
      </form>
    </div>
  );
}
