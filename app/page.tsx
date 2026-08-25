import ActivityFeed from "@/components/ActivityFeed";

export default function Home() {
  return (
    <div className="relative min-h-[calc(100dvh-8rem)] md:min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center overflow-hidden px-4 sm:px-6">
      {/* Background Gradients */}
      <div className="absolute inset-0 bg-gradient-to-b from-pp-secondary/5 via-transparent to-transparent pointer-events-none"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] sm:w-[500px] sm:h-[500px] bg-pp-primary/5 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Hero Content */}
      <div className="max-w-2xl mx-auto relative z-10 text-center py-8 sm:py-12">
        <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold tracking-tight mb-4 sm:mb-6 text-white uppercase leading-tight">
          Verify Your Skill.<br />
          <span className="text-pp-primary">Back The Best.</span>
        </h1>
        <p className="text-sm sm:text-base md:text-lg text-pp-text-muted max-w-lg mx-auto leading-relaxed">
          The verified competitive matchmaking and prediction platform for DLS & eFootball players. Every game has a winner. Can you predict it?
        </p>
      </div>

      {/* Live Activity Notification Feed */}
      <ActivityFeed />
    </div>
  );
}
