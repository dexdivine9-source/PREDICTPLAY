"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { Gamepad2, ShieldCheck, Activity, Users as UsersIcon, ArrowLeft } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface ProfileData {
  id: string;
  username: string;
  game: string;
  reputation: number;
  isVerified: boolean;
  trustScore: number;
  createdAt?: any;
}

export default function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      try {
        const id = resolvedParams.id;

        // Try query by id or user_id
        const { data, error } = await supabase
          .from("player_profiles")
          .select("*")
          .or(`id.eq.${id},user_id.eq.${id}`)
          .maybeSingle();

        if (data) {
          setProfile({
            id: data.id || data.user_id,
            username: data.gamertag || data.username || "Player",
            game: data.game || "DLS",
            reputation: data.reputation ?? 100,
            isVerified: data.is_verified ?? false,
            trustScore: data.trust_score ?? 0,
            createdAt: data.created_at,
          });
        } else {
          setProfile(null);
        }
      } catch (err) {
        console.error("Failed to load profile:", err);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [resolvedParams.id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-pp-text-muted">
        Loading player profile...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <UsersIcon className="mx-auto text-pp-text-muted mb-4" size={40} />
        <h2 className="text-2xl font-bold text-white mb-2">Profile Not Found</h2>
        <p className="text-pp-text-muted text-sm mb-6">
          This player profile doesn't exist yet or has not completed verification.
        </p>
        <Link
          href="/rankings"
          className="inline-flex items-center gap-2 px-6 py-3 bg-pp-primary text-black font-bold rounded-lg hover:bg-pp-primary-dark transition-all text-sm uppercase"
        >
          <ArrowLeft size={16} />
          View Leaderboards
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* Profile Header */}
      <div className="relative bg-pp-surface border border-pp-border rounded-2xl p-6 md:p-10 overflow-hidden mb-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-pp-primary/10 rounded-full blur-[80px] -z-10 translate-x-1/2 -translate-y-1/2"></div>
        
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8 relative z-10">
          <div className="w-28 h-28 md:w-36 md:h-36 rounded-full bg-pp-bg border-4 border-pp-surface-hover flex items-center justify-center font-black text-3xl md:text-5xl text-white">
            {profile.username.charAt(0).toUpperCase()}
          </div>
          
          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
              <div>
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-1 flex items-center justify-center md:justify-start gap-3">
                  {profile.username}
                  {profile.isVerified && <ShieldCheck className="text-pp-primary" size={24} />}
                </h1>
                <p className="text-pp-text-muted font-mono text-xs">ID: {profile.id}</p>
              </div>
              <div className="flex items-center gap-3 justify-center">
                <Link
                  href="/matches/create"
                  className="px-6 py-2 bg-pp-primary text-black font-bold rounded-lg hover:bg-pp-primary-dark transition-colors uppercase text-sm"
                >
                  CHALLENGE
                </Link>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-6">
              <div className="flex items-center gap-2 bg-pp-bg border border-pp-border px-4 py-2 rounded-lg">
                <span className="text-xs text-pp-text-muted uppercase font-bold">Game</span>
                <span className="text-sm font-black text-white uppercase">{profile.game}</span>
              </div>
              <div className="flex items-center gap-2 bg-pp-bg border border-pp-border px-4 py-2 rounded-lg">
                <span className="text-xs text-pp-text-muted uppercase font-bold">Reputation</span>
                <span className="text-xl font-black text-pp-primary">{profile.reputation}</span>
              </div>
              <div className="flex items-center gap-2 bg-pp-bg border border-pp-border px-4 py-2 rounded-lg">
                <span className="text-xs text-pp-text-muted uppercase font-bold">Status</span>
                <span className={`text-sm font-bold ${profile.isVerified ? "text-pp-primary" : "text-pp-text-muted"}`}>
                  {profile.isVerified ? "Verified Player" : "Pending Verification"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Stats */}
        <div className="space-y-8">
          <div className="bg-pp-surface border border-pp-border rounded-xl p-6">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2 uppercase tracking-wide">
              <Gamepad2 className="text-pp-accent" />
              GAME STATS
            </h2>
            <div className="space-y-4">
              <div className="bg-pp-bg rounded-lg p-4 border border-pp-border flex justify-between items-center">
                <span className="font-bold text-sm text-pp-text-muted">Primary Title</span>
                <span className="text-lg font-black text-white uppercase">{profile.game}</span>
              </div>
              <div className="bg-pp-bg rounded-lg p-4 border border-pp-border flex justify-between items-center">
                <span className="font-bold text-sm text-pp-text-muted">Evidence Trust Score</span>
                <span className="text-lg font-black text-pp-primary">{profile.trustScore}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Information & Actions */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-pp-surface border border-pp-border rounded-xl p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 uppercase tracking-wide">
              <Activity className="text-pp-secondary" />
              VERIFIED MATCH ACTIVITY
            </h2>
            <p className="text-sm text-pp-text-muted">
              Matches played by {profile.username} will be recorded and cryptographically linked to their reputation profile upon evidence verification.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
