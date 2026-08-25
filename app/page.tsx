export default function Home() {
  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden py-10 sm:py-14 md:py-20 border-b border-pp-border">
        <div className="absolute inset-0 bg-gradient-to-b from-pp-secondary/5 to-transparent pointer-events-none"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[280px] sm:w-[450px] sm:h-[450px] bg-pp-primary/5 rounded-full blur-[80px] pointer-events-none"></div>

        <div className="max-w-2xl mx-auto px-4 sm:px-6 relative z-10 text-center">
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold tracking-tight mb-3 sm:mb-4 text-white uppercase leading-tight">
            Verify Your Skill.<br />
            <span className="text-pp-primary">Back The Best.</span>
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-pp-text-muted max-w-lg mx-auto leading-relaxed">
            The verified competitive matchmaking and prediction platform for DLS & eFootball players. Every game has a winner. Can you predict it?
          </p>
        </div>
      </section>
    </div>
  );
}
