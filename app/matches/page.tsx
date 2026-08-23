"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Gamepad2, Plus, Swords, ShieldAlert } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";

export default function MatchesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [challenges, setChallenges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChallenges = async () => {
      try {
        const q = query(
          collection(db, "matches"), 
          where("state", "==", "OPEN"), 
          limit(20)
        );
        const querySnapshot = await getDocs(q);
        const matchesData = [];
        for (const doc of querySnapshot.docs) {
          matchesData.push({ id: doc.id, ...doc.data() });
        }
        setChallenges(matchesData);
      } catch (e) {
        console.error("Failed to fetch matches", e);
      } finally {
        setLoading(false);
      }
    };
    fetchChallenges();
  }, []);

  const handleAccept = (matchId: string) => {
    router.push(`/matches/${matchId}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
            <Gamepad2 className="text-pp-primary" size={32} />
            COMPETE HUB
          </h1>
          <p className="text-pp-text-muted mt-2">Find opponents, accept challenges, and climb the ranks.</p>
        </div>
        <Link 
          href="/matches/create" 
          className="px-6 py-3 bg-pp-primary text-black font-bold rounded hover:bg-pp-primary-dark transition-colors flex items-center justify-center gap-2"
        >
          <Plus size={20} />
          POST A CHALLENGE
        </Link>
      </div>

      <div className="bg-pp-bg border border-pp-border rounded-xl p-4 mb-8 flex items-start gap-4">
        <ShieldAlert className="text-pp-secondary flex-shrink-0 mt-1" size={24} />
        <div>
          <h4 className="text-white font-bold text-sm">Trust & Reputation System Active</h4>
          <p className="text-pp-text-muted text-xs mt-1">Accepting a match requires you to submit honest results. False reporting will permanently lower your Reputation Score and lead to matchmaking bans.</p>
        </div>
      </div>

      {/* Open Challenges */}
      <section className="mb-12">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2 uppercase tracking-wide">
          <Swords className="text-white" size={20} />
          OPEN CHALLENGES
        </h2>
        
        {loading ? (
          <div className="bg-pp-surface border border-pp-border rounded-xl p-12 text-center">
            <p className="text-pp-text-muted font-bold animate-pulse">Loading challenges...</p>
          </div>
        ) : challenges.length === 0 ? (
          <div className="bg-pp-surface border border-pp-border rounded-xl p-12 text-center">
            <p className="text-pp-text-muted font-bold">No open challenges right now.</p>
            <p className="text-sm text-pp-text-muted mt-2">Be the first to post a challenge and find an opponent!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {challenges.map((challenge) => (
              <div key={challenge.id} className="bg-pp-surface border border-pp-border rounded-xl p-5 hover:border-pp-primary/50 transition-colors flex flex-col">
                <div className="flex justify-between items-center text-sm text-pp-text-muted mb-4 pb-4 border-b border-pp-border">
                  <span className="font-bold text-white bg-white/10 px-2 py-0.5 rounded uppercase">{challenge.game}</span>
                  <span className="text-xs font-bold text-pp-text-muted uppercase">Waiting for Challenger</span>
                </div>
                
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-full border-2 border-pp-bg bg-pp-bg flex items-center justify-center text-xs font-bold text-pp-text-muted break-words overflow-hidden text-center">
                    {challenge.creatorId.slice(0, 5)}
                  </div>
                  <div>
                    <span className="font-bold text-lg text-white block">Player</span>
                    <span className="text-xs font-bold text-pp-primary uppercase">Ready to play</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                  <div className="bg-pp-bg rounded p-3 text-center border border-pp-border">
                    <span className="block text-[10px] text-pp-text-muted font-bold uppercase mb-1">Format</span>
                    <span className="font-bold text-white">1v1</span>
                  </div>
                  <div className="bg-pp-bg rounded p-3 text-center border border-pp-border">
                    <span className="block text-[10px] text-pp-text-muted font-bold uppercase mb-1">Entry Fee</span>
                    <span className="font-bold text-pp-accent">{challenge.stake} PTS</span>
                  </div>
                </div>
                
                <button onClick={() => handleAccept(challenge.id)} className="w-full py-3 mt-auto bg-pp-bg border border-pp-primary text-pp-primary font-bold rounded hover:bg-pp-primary hover:text-black transition-colors">
                  ACCEPT CHALLENGE
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* My Active Matches placeholder */}
      <section>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2 uppercase tracking-wide text-pp-text-muted">
          MY ACTIVE MATCHES
        </h2>
        <div className="bg-pp-surface border border-pp-border rounded-xl p-8 text-center border-dashed">
          <p className="text-sm font-bold text-pp-text-muted">You have no active matches.</p>
        </div>
      </section>
    </div>
  );
}
