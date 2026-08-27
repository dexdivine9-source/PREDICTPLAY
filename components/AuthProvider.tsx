"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  profile: any | null;
  wallet: any | null;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  profile: null,
  wallet: null,
  refreshProfile: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [wallet, setWallet] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (uid: string) => {
    try {
      let { data: profileData } = await supabase
        .from("player_profiles")
        .select("*")
        .eq("id", uid)
        .maybeSingle();

      let { data: walletData } = await supabase
        .from("virtual_wallets")
        .select("*")
        .eq("user_id", uid)
        .maybeSingle();

      // If either profile or wallet does not exist, auto-provision and grant 1000 PTS signup bonus
      if (!profileData || !walletData) {
        try {
          const { ensureUserAccountAction } = await import("@/app/actions");
          await ensureUserAccountAction();

          const { data: pData } = await supabase
            .from("player_profiles")
            .select("*")
            .eq("id", uid)
            .maybeSingle();
          profileData = pData;

          const { data: wData } = await supabase
            .from("virtual_wallets")
            .select("*")
            .eq("user_id", uid)
            .maybeSingle();
          walletData = wData;
        } catch (initErr) {
          console.warn("Account auto-provisioning note:", initErr);
        }
      }

      setProfile(profileData || null);
      setWallet(walletData || null);
    } catch (e) {
      console.error("Error fetching Supabase profile:", e);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setWallet(null);
  };

  useEffect(() => {
    // Initial session load
    const loadSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          await fetchProfile(session.user.id);
        } else {
          setUser(null);
          setProfile(null);
          setWallet(null);
        }
      } catch (err) {
        console.error("Error checking auth session:", err);
      } finally {
        setLoading(false);
      }
    };

    loadSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user);
          await fetchProfile(session.user.id);
        } else {
          setUser(null);
          setProfile(null);
          setWallet(null);
        }
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, wallet, loading, refreshProfile, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
