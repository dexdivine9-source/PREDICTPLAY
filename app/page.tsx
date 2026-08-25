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
            The verified competitive matchmaking and prediction platform for DLS & eFootball players. Every game has a winner. Can you predict it?
          </p>
        </div>
      </section>
    </div>
  );
}
