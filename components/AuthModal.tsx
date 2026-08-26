"use client";

import { useState } from "react";
import { X, Trophy, ShieldCheck } from "lucide-react";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  if (!isOpen) return null;

  const handleClose = () => {
    if (loading) return;
    setError("");
    onClose();
  };

  const handleGoogleSignIn = async () => {
    if (loading) return;
    setLoading(true);
    setError("");

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Sync base user record
      try {
        await setDoc(
          doc(db, "users", user.uid),
          {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            lastLoginAt: serverTimestamp(),
          },
          { merge: true }
        );
      } catch (dbErr) {
        console.warn("Could not sync user document to firestore:", dbErr);
      }

      // Check if player profile exists
      let hasProfile = false;
      try {
        const profileSnap = await getDoc(doc(db, "player_profiles", user.uid));
        hasProfile = profileSnap.exists();
      } catch (profileErr) {
        console.warn("Could not check player profile:", profileErr);
      }

      onClose();

      // Route new players to profile setup; existing players go home
      if (hasProfile) {
        router.push("/");
      } else {
        router.push("/profile/create");
      }
    } catch (err: any) {
      console.error("[Google Sign-In Error]", {
        code: err?.code,
        message: err?.message,
        authDomain: auth?.config?.authDomain,
        projectId: auth?.app?.options?.projectId,
        apiKey: auth?.app?.options?.apiKey ? `${auth.app.options.apiKey.slice(0, 8)}...` : undefined,
      });

      if (
        err?.code === "auth/popup-closed-by-user" ||
        err?.code === "auth/cancelled-popup-request"
      ) {
        setError("Sign-in was cancelled. Please try again.");
      } else if (err?.code === "auth/unauthorized-domain") {
        setError(
          `Domain not authorized for Firebase project "${auth?.app?.options?.projectId || 'current'}". Ensure your Vercel domain is added in Firebase Console under project ${auth?.app?.options?.projectId || 'predictplay-10230'} → Auth → Settings → Authorized domains, and that NEXT_PUBLIC_FIREBASE_API_KEY matches this project.`
        );
      } else if (err?.code === "auth/operation-not-allowed") {
        setError("Google Sign-In is not enabled yet in Firebase Console → Authentication → Sign-in method.");
      } else {
        setError(err?.message ? `[${err?.code || 'auth-error'}]: ${err.message}` : "Failed to sign in with Google. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-md bg-pp-surface border border-pp-border rounded-2xl p-6 md:p-8 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow accent in the background */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-pp-primary/10 rounded-full blur-3xl pointer-events-none" />

        <button
          onClick={handleClose}
          disabled={loading}
          className="absolute top-4 right-4 p-2 text-pp-text-muted hover:text-white rounded-lg hover:bg-pp-bg transition-colors disabled:opacity-50"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-pp-bg border-2 border-pp-primary flex items-center justify-center shadow-[0_0_10px_rgba(57,255,20,0.3)]">
            <span className="text-pp-primary font-black text-xl leading-none">P</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">PREDICTPLAY</h2>
            <p className="text-xs text-pp-text-muted">Verified Esports Matchmaking & Prediction</p>
          </div>
        </div>

        <div className="my-6">
          <h3 className="text-2xl font-black text-white tracking-tight">
            SIGN IN TO CONTINUE
          </h3>
          <p className="text-sm text-pp-text-muted mt-1.5 leading-relaxed">
            Connect with your Google account to back top players, verify match results, and win rewards.
          </p>
        </div>

        {error && (
          <div className="p-3.5 mb-5 text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl text-sm leading-snug">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white text-gray-900 font-bold py-3.5 px-4 rounded-xl hover:bg-gray-100 active:scale-[0.99] transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed group border border-gray-200"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span className="text-sm font-bold">
              {loading ? "Connecting to Google…" : "Continue with Google"}
            </span>
          </button>
        </div>

        <div className="mt-6 pt-5 border-t border-pp-border/60 flex items-center justify-around text-xs text-pp-text-muted">
          <div className="flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-pp-primary" />
            <span>Instant & Secure</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Trophy size={14} className="text-pp-primary" />
            <span>Skill Matchmaking</span>
          </div>
        </div>
      </div>
    </div>
  );
}

