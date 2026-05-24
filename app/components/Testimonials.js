export default function Testimonials() {
  const testimonials = [
    {
      name: "Emeka Okafor",
      username: "@emeka_fx",
      role: "Prop Firm Trader",
      avatar: "EO",
      comment: "MatrixVerse completely changed how I trade. The AI analyzer caught that I was revenge trading every Monday. Fixed that habit and passed my FTMO challenge.",
      profit: "+$4,200 this month",
      color: "#00D4FF",
    },
    {
      name: "Sarah Chen",
      username: "@sarahforex",
      role: "Smart Money Trader",
      avatar: "SC",
      comment: "The psychology tracker is insane. I never realized how much my emotions were affecting my trades until I started logging them daily. My win rate went from 41% to 67%.",
      profit: "Win rate: 67%",
      color: "#7C3AED",
    },
    {
      name: "Tunde Adeleke",
      username: "@tunde_trades",
      role: "Signal Provider",
      avatar: "TA",
      comment: "The community feature helped me grow my following from 0 to 2,400 traders in 3 months. Sharing my setups here is way better than any other platform.",
      profit: "2,400 followers",
      color: "#00FF88",
    },
    {
      name: "Aisha Bello",
      username: "@aisha_pips",
      role: "Beginner Trader",
      avatar: "AB",
      comment: "As a beginner, the journal helped me understand my mistakes clearly. The AI breaks everything down in simple language. I finally feel like I know what I am doing.",
      profit: "3 months consistent",
      color: "#FFD700",
    },
    {
      name: "David Mensah",
      username: "@davefx_gh",
      role: "Swing Trader",
      avatar: "DM",
      comment: "Leaderboards are addictive in the best way. I am always trying to improve my RR ratio to climb the ranks. Never been this consistent in 4 years of trading.",
      profit: "Top 10 weekly RR",
      color: "#FF6B35",
    },
    {
      name: "Fatima Al-Hassan",
      username: "@fatima_trades",
      role: "Funded Trader",
      avatar: "FA",
      comment: "Got funded on my second attempt after using MatrixVerse for 6 weeks. The discipline tracking showed me exactly where I was going wrong on my first attempt.",
      profit: "$50K funded account",
      color: "#FF4757",
    },
  ];

  return (
    <section className="bg-[#0D1117] py-24 px-6">
      <div className="max-w-6xl mx-auto">

        {/* SECTION HEADER */}
        <div className="text-center mb-16">
          <div className="inline-block bg-[#161B22] border border-[#30363D] text-[#00D4FF] text-xs font-semibold px-4 py-2 rounded-full mb-4">
            💬 Trader Stories
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
            Traders Who Levelled Up
          </h2>
          <p className="text-[#8B949E] text-lg max-w-2xl mx-auto">
            Real results from real traders using MatrixVerse every day.
          </p>
        </div>

        {/* TESTIMONIALS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((t, index) => (
            <div
              key={index}
              className="bg-[#161B22] border border-[#30363D] rounded-2xl p-6 hover:border-[#00D4FF] transition-colors duration-300 flex flex-col gap-4"
            >
              {/* QUOTE */}
              <p className="text-[#C9D1D9] text-sm leading-relaxed flex-1">
                "{t.comment}"
              </p>

              {/* RESULT BADGE */}
              <div
                className="text-xs font-bold px-3 py-1 rounded-full w-fit"
                style={{ backgroundColor: t.color + "20", color: t.color, border: `1px solid ${t.color}40` }}
              >
                📈 {t.profit}
              </div>

              {/* TRADER INFO */}
              <div className="flex items-center gap-3 pt-2 border-t border-[#30363D]">
                {/* AVATAR */}
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-[#0D1117]"
                  style={{ backgroundColor: t.color }}
                >
                  {t.avatar}
                </div>
                {/* NAME */}
                <div>
                  <div className="text-white text-sm font-semibold">{t.name}</div>
                  <div className="text-[#8B949E] text-xs">{t.username} · {t.role}</div>
                </div>
              </div>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
}