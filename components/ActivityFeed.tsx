"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  UserPlus, 
  Coins, 
  Flame, 
  ShieldCheck, 
  Trophy, 
  X 
} from "lucide-react";

export type ActivityType = "signup" | "prediction" | "match_live" | "match_verified" | "leaderboard";

export interface ActivityEvent {
  id: string;
  type: ActivityType;
  message: string;
  subtext?: string;
}

// Sample dataset of players and matchups for realistic simulation
const SAMPLE_NAMES = [
  "ShadowStriker",
  "DLS_King99",
  "Victor_O",
  "GhostRider",
  "Kylian_Dx",
  "TacticMaster",
  "Sammy_Ace",
  "ApexPredator",
  "SlickFinisher",
  "ProGamer9",
  "BlitzStriker",
  "AlphaDLS",
];

const SAMPLE_MATCHES = [
  { p1: "GhostRider", p2: "DLS_King99", game: "DLS" },
  { p1: "Victor_O", p2: "Kylian_Dx", game: "DLS" },
  { p1: "ShadowStriker", p2: "TacticMaster", game: "DLS" },
  { p1: "ApexPredator", p2: "ProGamer9", game: "DLS" },
];

/**
 * Generates a mock activity event.
 * Easily swappable with an API call (e.g., fetch('/api/activity')).
 */
function generateMockActivity(): ActivityEvent {
  const types: ActivityType[] = [
    "signup",
    "prediction",
    "match_live",
    "match_verified",
    "leaderboard",
  ];

  const randomType = types[Math.floor(Math.random() * types.length)];
  const randomName = SAMPLE_NAMES[Math.floor(Math.random() * SAMPLE_NAMES.length)];
  const randomMatch = SAMPLE_MATCHES[Math.floor(Math.random() * SAMPLE_MATCHES.length)];
  const id = `act-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

  switch (randomType) {
    case "signup":
      return {
        id,
        type: "signup",
        message: `${randomName} just joined PredictPlay`,
        subtext: "Welcome to the verified competitive arena!",
      };
    case "prediction": {
      const amounts = [100, 250, 500, 1000];
      const amt = amounts[Math.floor(Math.random() * amounts.length)];
      return {
        id,
        type: "prediction",
        message: `${randomName} placed a ${amt} PTS prediction`,
        subtext: "Live spectator market",
      };
    }
    case "match_live":
      return {
        id,
        type: "match_live",
        message: `Match went live: ${randomMatch.p1} vs ${randomMatch.p2}`,
        subtext: `${randomMatch.game} • Spectating available now`,
      };
    case "match_verified":
      return {
        id,
        type: "match_verified",
        message: "Match verified — predictions settling now",
        subtext: "Reputation & winnings credited",
      };
    case "leaderboard":
      return {
        id,
        type: "leaderboard",
        message: `${randomName} climbed to Top 10 on the leaderboard`,
        subtext: "High Trust & Reputation Rating",
      };
    default:
      return {
        id,
        type: "signup",
        message: `${randomName} just joined PredictPlay`,
      };
  }
}

export function ActivityToast({
  event,
  onClose,
  isVisible,
}: {
  event: ActivityEvent;
  onClose: () => void;
  isVisible: boolean;
}) {
  const getIcon = () => {
    switch (event.type) {
      case "signup":
        return <UserPlus size={16} className="text-pp-primary" />;
      case "prediction":
        return <Coins size={16} className="text-pp-primary" />;
      case "match_live":
        return <Flame size={16} className="text-red-500 animate-pulse" />;
      case "match_verified":
        return <ShieldCheck size={16} className="text-pp-accent" />;
      case "leaderboard":
        return <Trophy size={16} className="text-yellow-400" />;
      default:
        return <UserPlus size={16} className="text-pp-primary" />;
    }
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className={`pointer-events-auto flex items-start gap-3 p-3.5 sm:p-4 rounded-xl bg-pp-surface/95 backdrop-blur-md border border-pp-border shadow-xl hover:border-pp-primary/40 transition-all duration-300 transform max-w-sm ${
        isVisible
          ? "translate-y-0 opacity-100 scale-100"
          : "translate-y-4 opacity-0 scale-95 pointer-events-none"
      }`}
    >
      <div className="w-8 h-8 rounded-lg bg-pp-bg border border-pp-border flex items-center justify-center flex-shrink-0 mt-0.5">
        {getIcon()}
      </div>

      <div className="flex-1 min-w-0 pr-1">
        <p className="text-xs sm:text-sm font-bold text-white leading-snug break-words">
          {event.message}
        </p>
        {event.subtext && (
          <p className="text-[11px] text-pp-text-muted mt-0.5 leading-tight truncate">
            {event.subtext}
          </p>
        )}
      </div>

      <button
        onClick={onClose}
        aria-label="Dismiss notification"
        className="text-pp-text-muted hover:text-white p-1 rounded transition-colors flex-shrink-0 -mr-1 -mt-1"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export default function ActivityFeed() {
  const [currentEvent, setCurrentEvent] = useState<ActivityEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const nextToastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const scheduleNextToast = () => {
    // Random delay between 5 to 15 seconds (5000ms - 15000ms)
    const randomDelay = Math.floor(Math.random() * 10000) + 5000;

    nextToastTimeoutRef.current = setTimeout(() => {
      const newEvent = generateMockActivity();
      setCurrentEvent(newEvent);
      setIsVisible(true);

      // Keep toast visible for 4 seconds
      hideTimeoutRef.current = setTimeout(() => {
        setIsVisible(false);
        scheduleNextToast();
      }, 4000);
    }, randomDelay);
  };

  useEffect(() => {
    // Initial delay for the first toast: 2.5 seconds after page load
    const initialDelay = setTimeout(() => {
      const initialEvent = generateMockActivity();
      setCurrentEvent(initialEvent);
      setIsVisible(true);

      hideTimeoutRef.current = setTimeout(() => {
        setIsVisible(false);
        scheduleNextToast();
      }, 4000);
    }, 2500);

    return () => {
      clearTimeout(initialDelay);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
      if (nextToastTimeoutRef.current) clearTimeout(nextToastTimeoutRef.current);
    };
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    if (nextToastTimeoutRef.current) clearTimeout(nextToastTimeoutRef.current);
    scheduleNextToast();
  };

  if (!currentEvent) return null;

  return (
    <aside aria-label="Recent platform activity notifications" className="fixed bottom-20 md:bottom-6 left-4 sm:left-6 z-40 pointer-events-none max-w-sm">
      <ActivityToast
        event={currentEvent}
        onClose={handleDismiss}
        isVisible={isVisible}
      />
    </aside>
  );
}
