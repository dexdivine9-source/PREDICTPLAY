"use client";

import React from "react";
import { Trophy } from "lucide-react";

interface WinnerItem {
  id: string;
  userMasked: string;
  amount: string;
  category: string;
  timeAgo: string;
}

const WINNERS_DATA: WinnerItem[] = [
  {
    id: "w-1",
    userMasked: "*********9 won",
    amount: "NGN156,355.97",
    category: "in Sports",
    timeAgo: "1 min ago",
  },
  {
    id: "w-2",
    userMasked: "*********7 won",
    amount: "NGN216,389.72",
    category: "in Sports",
    timeAgo: "1 min ago",
  },
  {
    id: "w-3",
    userMasked: "*********0 won",
    amount: "NGN116,000.00",
    category: "in Sports",
    timeAgo: "1 min ago",
  },
  {
    id: "w-4",
    userMasked: "*********4 won",
    amount: "NGN342,190.50",
    category: "in Sports",
    timeAgo: "2 mins ago",
  },
  {
    id: "w-5",
    userMasked: "*********2 won",
    amount: "NGN189,450.00",
    category: "in Sports",
    timeAgo: "3 mins ago",
  },
  {
    id: "w-6",
    userMasked: "*********8 won",
    amount: "NGN275,600.00",
    category: "in Sports",
    timeAgo: "4 mins ago",
  },
];

export default function GrandPrizeWinners() {
  // Duplicate array so it seamlessly loops in the continuous side-by-side marquee
  const loopedWinners = [...WINNERS_DATA, ...WINNERS_DATA];

  return (
    <section className="w-full pt-4 pb-2 overflow-hidden">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 mb-3">
        <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
          Grand Prize Winners
        </h2>
      </div>

      <div className="relative w-full overflow-x-hidden">
        {/* Subtle edge fades for smooth ticker effect */}
        <div className="absolute left-0 top-0 bottom-0 w-8 sm:w-16 bg-gradient-to-r from-pp-bg to-transparent z-10 pointer-events-none"></div>
        <div className="absolute right-0 top-0 bottom-0 w-8 sm:w-16 bg-gradient-to-l from-pp-bg to-transparent z-10 pointer-events-none"></div>

        {/* Scrolling row */}
        <div className="animate-marquee flex gap-4 py-2 px-4 cursor-grab active:cursor-grabbing">
          {loopedWinners.map((winner, idx) => (
            <div key={`${winner.id}-${idx}`} className="flex flex-col flex-shrink-0">
              {/* Card */}
              <div className="relative w-[210px] sm:w-[230px] h-[95px] rounded-xl bg-[#0f172a]/90 border border-slate-800/80 p-3 flex flex-col justify-between overflow-hidden shadow-md hover:border-pp-primary/40 transition-colors">
                {/* Trophy watermark icon in background */}
                <div className="absolute -right-2 -bottom-2 text-slate-800/60 pointer-events-none">
                  <Trophy size={68} strokeWidth={1.2} />
                </div>

                <div className="relative z-10">
                  <p className="text-xs font-semibold text-slate-200 tracking-wider">
                    {winner.userMasked}
                  </p>
                  <p className="text-base sm:text-lg font-black italic tracking-wide text-pp-primary mt-0.5">
                    {winner.amount}
                  </p>
                </div>

                <div className="relative z-10">
                  <p className="text-xs font-medium text-slate-300">
                    {winner.category}
                  </p>
                </div>
              </div>

              {/* Timestamp underneath card */}
              <p className="text-[11px] font-medium text-slate-400 mt-1.5 pl-1">
                {winner.timeAgo}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
