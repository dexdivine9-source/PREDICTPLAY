"use client";

import { useState } from "react";
import { X, Mail, ArrowLeft } from "lucide-react";
import { signInWithCustomToken } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { sendCodeAction, verifyCodeAction } from "@/app/auth-actions";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  if (!isOpen) return null;

  const reset = () => {
    setStep("email");
    setEmail("");
    setCode("");
    setDevCode(null);
    setError("");
    setLoading(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");
    try {
      const res = await sendCodeAction(email);
      if (!res.success) {
        setError(res.error);
        return;
      }
      setDevCode(res.devCode ?? null);
      setStep("code");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");
    try {
      const res = await verifyCodeAction(email, code);
      if (!res.success) {
        setError(res.error);
        return;
      }
      await signInWithCustomToken(auth, res.token);
      handleClose();
      // New users finish onboarding; returning users go home.
      router.push(res.hasProfile ? "/" : "/profile/create");
    } catch {
      setError("Something went wrong verifying your code. Please try again.");
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
        className="relative w-full max-w-md bg-pp-surface border border-pp-border rounded-2xl p-6 md:p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 text-pp-text-muted hover:text-white rounded-lg hover:bg-pp-bg transition-colors"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <h2 className="text-2xl font-bold text-white mb-1">Email sign in</h2>
        <p className="text-sm text-pp-text-muted mb-6">
          Existing users sign in; new users create a profile.
        </p>

        {error && (
          <div className="p-3 mb-4 text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg text-sm">
            {error}
          </div>
        )}

        {step === "email" ? (
          <form onSubmit={handleSendCode} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                placeholder="you@example.com"
                className="w-full bg-pp-bg border border-pp-border rounded-lg p-3 text-white focus:outline-none focus:border-pp-primary transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="w-full flex items-center justify-center gap-2 bg-pp-primary text-black font-bold py-3 rounded-lg hover:bg-pp-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Mail size={18} />
              {loading ? "Sending…" : "Send code"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="space-y-4">
            {devCode && (
              <div className="p-3 text-pp-accent bg-pp-accent/10 border border-pp-accent/30 rounded-lg text-sm">
                <span className="font-bold uppercase text-xs tracking-wide">Dev mode</span>{" "}
                — your code is{" "}
                <span className="font-mono font-bold tracking-widest text-white">{devCode}</span>
                <div className="text-xs text-pp-text-muted mt-1">
                  Emailing is stubbed for now, so the code shows here. This box disappears once a real email sender is wired in.
                </div>
              </div>
            )}
            <p className="text-sm text-pp-text-muted">
              We sent a 6-digit code to{" "}
              <span className="text-white font-medium">{email}</span>.
            </p>
            <div>
              <label className="block text-sm font-medium text-white mb-1.5">
                Verification code
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                required
                autoFocus
                placeholder="000000"
                className="w-full bg-pp-bg border border-pp-border rounded-lg p-3 text-white text-center text-lg font-mono tracking-[0.5em] focus:outline-none focus:border-pp-primary transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={loading || code.length < 6}
              className="w-full bg-pp-primary text-black font-bold py-3 rounded-lg hover:bg-pp-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Verifying…" : "Verify & continue"}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep("email");
                setCode("");
                setDevCode(null);
                setError("");
              }}
              className="w-full flex items-center justify-center gap-1.5 text-sm text-pp-text-muted hover:text-white transition-colors"
            >
              <ArrowLeft size={14} />
              Use a different email
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
