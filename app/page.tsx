import Link from "next/link";
import { Gamepad2, ShieldCheck } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 lg:py-24 border-b border-pp-border">
        <div className="absolute inset-0 bg-gradient-to-b from-pp-secondary/5 to-transparent"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pp-primary/5 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 uppercase text-white drop-shadow-lg">
            Verify Your Skill.<br />
            <span className="text-pp-primary">Back The Best.</span>
          </h1>
          <p className="text-lg md:text-xl text-pp-text-muted mb-10 max-w-2xl mx-auto">
            The verified competitive matchmaking and prediction platform for DLS & eFootball players.
            Play matches to build reputation, or spectate verified matches.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link 
              href="/matches" 
              className="px-8 py-4 bg-pp-primary text-black font-bold rounded-lg hover:bg-pp-primary-dark transition-all transform hover:scale-105 flex items-center gap-2 w-full sm:w-auto justify-center uppercase tracking-wide"
            >
              <Gamepad2 size={20} />
              FIND AN OPPONENT
            </Link>
            <Link 
              href="/profile/create" 
              className="px-8 py-4 bg-pp-surface border border-pp-border text-white font-bold rounded-lg hover:bg-pp-surface-hover transition-all flex items-center gap-2 w-full sm:w-auto justify-center uppercase tracking-wide"
            >
              <ShieldCheck size={20} className="text-pp-primary" />
              VERIFY GAME PROFILE
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
