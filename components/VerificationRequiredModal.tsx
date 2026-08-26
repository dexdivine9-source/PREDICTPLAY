"use client";

import { X, ShieldAlert, CheckCircle2, ArrowRight } from "lucide-react";
import Link from "next/link";

interface VerificationRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  actionName?: string; // e.g. "create a match", "join this match", "place predictions"
}

export default function VerificationRequiredModal({
  isOpen,
  onClose,
  actionName = "participate in competitive matches",
}: VerificationRequiredModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-pp-surface border border-pp-border rounded-2xl p-6 md:p-8 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Amber glow accent */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-pp-text-muted hover:text-white rounded-lg hover:bg-pp-bg transition-colors"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
          <ShieldAlert size={26} />
        </div>

        <h3 className="text-xl font-black text-white tracking-tight uppercase">
          Profile Verification Required
        </h3>
        <p className="text-sm text-pp-text-muted mt-2 leading-relaxed">
          To {actionName}, you must complete your one-time game profile verification to ensure honest matchmaking and fair payouts.
        </p>

        <div className="my-5 p-4 bg-pp-bg/80 border border-pp-border rounded-xl space-y-2.5">
          <p className="text-xs font-bold text-pp-text-muted uppercase tracking-wider mb-2">
            Required for verification:
          </p>
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <CheckCircle2 size={15} className="text-pp-primary flex-shrink-0" />
            <span>Game username</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <CheckCircle2 size={15} className="text-pp-primary flex-shrink-0" />
            <span>Game profile screenshot upload</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <CheckCircle2 size={15} className="text-pp-primary flex-shrink-0" />
            <span>Tracker ID (DLS / Live tracker)</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <CheckCircle2 size={15} className="text-pp-primary flex-shrink-0" />
            <span>Team name</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          <Link
            href="/profile/verify"
            onClick={onClose}
            className="flex-1 py-3 px-4 bg-pp-primary text-black font-bold rounded-xl hover:bg-pp-primary-dark active:scale-[0.99] transition-all text-sm uppercase tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-pp-primary/20"
          >
            <span>Verify Profile</span>
            <ArrowRight size={16} />
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="py-3 px-4 bg-pp-bg border border-pp-border text-pp-text-muted hover:text-white font-bold rounded-xl hover:bg-pp-surface transition-all text-sm uppercase tracking-wide"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
}
