"use client";

import { useState } from "react";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

export default function ProfileCreatePage() {
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const { user, refreshProfile } = useAuth();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      await setDoc(doc(db, "player_profiles", user.uid), {
        userId: user.uid,
        username,
        reputation: 100, // starting reputation
        createdAt: serverTimestamp()
      });

      await setDoc(doc(db, "virtual_wallets", user.uid), {
        userId: user.uid,
        balance: 1000,
        createdAt: serverTimestamp()
      });

      await refreshProfile();
      router.push("/");
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (!user) {
    return <div className="text-center p-12">Please register or login first.</div>;
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="max-w-md w-full p-8 border border-pp-border rounded-xl bg-pp-secondary/10 backdrop-blur-sm">
        <h1 className="text-3xl font-bold mb-2">Create Profile</h1>
        <p className="text-pp-text-muted mb-6">Choose your gamertag to start competing.</p>
        
        {error && <div className="p-4 mb-4 text-red-400 bg-red-400/10 rounded-lg">{error}</div>}
        
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Username</label>
            <input 
              type="text" 
              value={username} 
              onChange={e => setUsername(e.target.value)} 
              required 
              maxLength={20}
              className="w-full bg-pp-secondary/50 border border-pp-border rounded-lg p-3 text-white" 
            />
          </div>
          <button type="submit" className="w-full bg-pp-primary text-black font-bold py-3 rounded-lg hover:bg-pp-primary-dark transition-colors">
            Complete Profile
          </button>
        </form>
      </div>
    </div>
  );
}
