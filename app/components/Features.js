export default function Features() {
  const features = [
    {
      icon: "📓",
      title: "Smart Trading Journal",
      description: "Log every trade with entry, SL, TP, emotions, and screenshots. Track your performance automatically.",
      color: "#00D4FF",
    },
    {
      icon: "🤖",
      title: "AI Trade Analyzer",
      description: "Get instant AI feedback on your trades. Detect emotional mistakes, bad RR, and overtrading patterns.",
      color: "#7C3AED",
    },
    {
      icon: "👥",
      title: "Trader Community",
      description: "Share setups, follow top traders, post analysis, and grow your trading network in one place.",
      color: "#00FF88",
    },
    {
      icon: "🏆",
      title: "Leaderboards",
      description: "Compete with traders worldwide. Climb the ranks by win rate, RR ratio, streak, and consistency.",
      color: "#FFD700",
    },
    {
      icon: "🎯",
      title: "Prop Firm Tracker",
      description: "Track your FTMO, FundedNext, and other prop challenges. Get alerts before hitting drawdown limits.",
      color: "#FF6B35",
    },
    {
      icon: "🧠",
      title: "Psychology Tracker",
      description: "Monitor your emotions daily. Detect revenge trading, fear, greed, and build mental consistency.",
      color: "#FF4757",
    },
  ];

  return (
    <section id="features" className="bg-[#0D1117] py-24 px-6">
      <div className="max-w-6xl mx-auto">

        {/* SECTION HEADER */}
        <div className="text-center mb-16">
          <div className="inline-block bg-[#161B22] border border-[#30363D] text-[#00D4FF] text-xs font-semibold px-4 py-2 rounded-full mb-4">
            ⚡ Everything You Need
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
            Built for Serious Traders
          </h2>
          <p className="text-[#8B949E] text-lg max-w-2xl mx-auto">
            Every tool you need to become a consistently profitable trader — in one powerful platform.
          </p>
        </div>

        {/* FEATURES GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-[#161B22] border border-[#30363D] rounded-2xl p-6 hover:border-[#00D4FF] transition-colors duration-300"
            >
              {/* ICON */}
              <div className="text-4xl mb-4">{feature.icon}</div>

              {/* TITLE */}
              <h3
                className="text-lg font-bold mb-2"
                style={{ color: feature.color }}
              >
                {feature.title}
              </h3>

              {/* DESCRIPTION */}
              <p className="text-[#8B949E] text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}