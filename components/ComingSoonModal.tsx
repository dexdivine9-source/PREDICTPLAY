"use client";

import { X, Sparkles, Gamepad2 } from "lucide-react";

interface ComingSoonModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
}

export default function ComingSoonModal({
  isOpen,
  onClose,
  title = "eFootball Integration Coming Soon",
  description = "eFootball match creation, AI screenshot verification, and prediction markets are currently in final testing and will be enabled soon! In the meantime, Dream League Soccer (DLS) is fully live.",
}: ComingSoonModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-pp-surface border border-pp-primary/40 rounded-2xl p-6 md:p-8 shadow-2xl overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute top-0 right-0 w-36 h-36 bg-pp-primary/15 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2" />
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-pp-text-muted hover:text-white rounded-lg hover:bg-pp-bg transition-colors"
        >
          <X size={20} />
        </button>

        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-pp-primary/10 border border-pp-primary/30 flex items-center justify-center text-pp-primary">
            <Gamepad2 size={32} />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-pp-primary/10 border border-pp-primary/30 text-pp-primary rounded-full text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles size={13} />
            Feature In Progress
          </div>

          <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-wide mb-3">
            {title}
          </h3>

          <p className="text-sm text-pp-text-muted leading-relaxed mb-6">
            {description}
          </p>

          <button
            onClick={onClose}
            className="w-full py-3.5 bg-pp-primary text-black font-bold rounded-xl hover:bg-pp-primary-dark transition-all text-sm uppercase tracking-wide"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
}
