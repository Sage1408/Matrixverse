"use client";

import MobileNav from "../components/MobileNav";
import ThemeToggle from "../components/ThemeToggle"
import { Skeleton, SkeletonCard, SkeletonText } from "../components/Skeleton"
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";

export default function PropFirmsClient() {
  const [user, setUser] = useState(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const [search, setSearch] = useState("");
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setUser(user);
    };
    init();
  }, []);

  const firms = [
    {
      name: "FTMO",
      logo: "🏆",
      description: "The most trusted prop firm globally. Known for strict but fair rules and fast payouts.",
      accountSizes: ["$10K", "$25K", "$50K", "$100K", "$200K"],
      profitTarget: "10%",
      maxDrawdown: "10%",
      dailyLoss: "5%",
      minTradingDays: 10,
      profitSplit: "80/20",
      price: "From $155",
      difficulty: "Medium",
      style: ["Swing", "Day Trading", "Scalping"],
      badge: "Most Popular",
      badgeColor: "#FFD700",
      link: "https://ftmo.com",
      rating: 4.8,
    },
    {
      name: "FundedNext",
      logo: "🚀",
      description: "Offers a profit share even during the challenge phase. Great for consistent traders.",
      accountSizes: ["$6K", "$15K", "$25K", "$50K", "$100K", "$200K"],
      profitTarget: "10%",
      maxDrawdown: "10%",
      dailyLoss: "5%",
      minTradingDays: 5,
      profitSplit: "90/10",
      price: "From $49",
      difficulty: "Medium",
      style: ["Swing", "Day Trading", "Scalping", "News Trading"],
      badge: "Best Split",
      badgeColor: "#00D4FF",
      link: "https://fundednext.com",
      rating: 4.7,
    },
    {
      name: "The5ers",
      logo: "⚡",
      description: "Instant funding available. No time limits. Great for patient consistent traders.",
      accountSizes: ["$4K", "$20K", "$40K", "$80K"],
      profitTarget: "6%",
      maxDrawdown: "6%",
      dailyLoss: "4%",
      minTradingDays: 0,
      profitSplit: "100/0",
      price: "From $95",
      difficulty: "Easy",
      style: ["Swing", "Position Trading", "Day Trading"],
      badge: "100% Split",
      badgeColor: "#00FF88",
      link: "https://the5ers.com",
      rating: 4.6,
    },
    {
      name: "Funding Pips",
      logo: "💎",
      description: "No minimum trading days. Trade at your own pace. Beginner friendly rules.",
      accountSizes: ["$5K", "$10K", "$25K", "$50K", "$100K"],
      profitTarget: "8%",
      maxDrawdown: "8%",
      dailyLoss: "4%",
      minTradingDays: 0,
      profitSplit: "85/15",
      price: "From $39",
      difficulty: "Easy",
      style: ["Scalping", "Day Trading", "Swing", "News Trading"],
      badge: "Beginner Friendly",
      badgeColor: "#7C3AED",
      link: "https://fundingpips.com",
      rating: 4.5,
    },
    {
      name: "MyFundedFX",
      logo: "🎯",
      description: "Bi-weekly payouts and a straightforward evaluation. No minimum days required.",
      accountSizes: ["$10K", "$25K", "$50K", "$100K", "$200K"],
      profitTarget: "8%",
      maxDrawdown: "12%",
      dailyLoss: "5%",
      minTradingDays: 0,
      profitSplit: "75/25",
      price: "From $84",
      difficulty: "Easy",
      style: ["Day Trading", "Scalping", "Swing"],
      badge: "Bi-Weekly Payout",
      badgeColor: "#FF6B35",
      link: "https://myfundedfx.com",
      rating: 4.4,
    },
    {
      name: "Topstep",
      logo: "📈",
      description: "Best known for futures trading but also offers forex. Great for disciplined traders.",
      accountSizes: ["$50K", "$100K", "$150K"],
      profitTarget: "6%",
      maxDrawdown: "8%",
      dailyLoss: "4%",
      minTradingDays: 5,
      profitSplit: "90/10",
      price: "From $165",
      difficulty: "Medium",
      style: ["Day Trading", "Swing", "Futures"],
      badge: "Futures Friendly",
      badgeColor: "#FF4757",
      link: "https://topstep.com",
      rating: 4.3,
    },
    {
      name: "Aqua Funded",
      logo: "🌊",
      description: "African-focused prop firm. Supports Paystack payments. Great for Nigerian traders.",
      accountSizes: ["$5K", "$10K", "$25K", "$50K"],
      profitTarget: "8%",
      maxDrawdown: "10%",
      dailyLoss: "5%",
      minTradingDays: 3,
      profitSplit: "80/20",
      price: "From $49",
      difficulty: "Easy",
      style: ["Scalping", "Day Trading", "SMC", "ICT"],
      badge: "Africa Friendly",
      badgeColor: "#00FF88",
      link: "https://aquafunded.com",
      rating: 4.2,
    },
    {
      name: "Blue Guardian",
      logo: "🛡️",
      description: "Unlimited trading period with one of the highest profit splits in the industry.",
      accountSizes: ["$10K", "$25K", "$50K", "$100K", "$200K"],
      profitTarget: "10%",
      maxDrawdown: "8%",
      dailyLoss: "4%",
      minTradingDays: 0,
      profitSplit: "85/15",
      price: "From $99",
      difficulty: "Medium",
      style: ["Swing", "Day Trading", "Position Trading"],
      badge: "Unlimited Period",
      badgeColor: "#00D4FF",
      link: "https://blueguardian.com",
      rating: 4.3,
    },
  ];

  const filters = [
    { key: "all", label: "All Firms" },
    { key: "easy", label: "Easy Rules" },
    { key: "high_split", label: "High Split" },
    { key: "beginner", label: "Beginner" },
    { key: "scalping", label: "Scalping" },
    { key: "swing", label: "Swing Trading" },
  ];

  const getFilteredFirms = () => {
    let filtered = firms;
    if (search.trim()) {
      filtered = filtered.filter(f =>
        f.name.toLowerCase().includes(search.toLowerCase()) ||
        f.style.some(s => s.toLowerCase().includes(search.toLowerCase()))
      );
    }
    if (activeFilter === "easy") return filtered.filter(f => f.difficulty === "Easy");
    if (activeFilter === "high_split") return filtered.filter(f => parseInt(f.profitSplit) >= 85);
    if (activeFilter === "beginner") return filtered.filter(f => f.difficulty === "Easy" && f.minTradingDays === 0);
    if (activeFilter === "scalping") return filtered.filter(f => f.style.includes("Scalping"));
    if (activeFilter === "swing") return filtered.filter(f => f.style.includes("Swing"));
    return filtered;
  };

  const getDifficultyColor = (difficulty) => {
    if (difficulty === "Easy") return "#00FF88";
    if (difficulty === "Medium") return "#FFD700";
    return "#FF4757";
  };

  const renderStars = (rating) => {
    return "★".repeat(Math.floor(rating)) + "☆".repeat(5 - Math.floor(rating));
  };

  if (!user) return (
    <main className="bg-[var(--bg-primary)] min-h-screen flex items-center justify-center">
      <div className="w-full max-w-4xl px-6 space-y-6">
        <SkeletonText lines={2} />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </main>
  );

  const filteredFirms = getFilteredFirms();

  return (
    <main className="bg-[var(--bg-primary)] min-h-screen">

      <nav className="bg-[var(--bg-secondary)] border-b border-[var(--border)] px-6 py-4 flex items-center justify-between">
        <a href="/dashboard" className="text-[var(--accent-blue)] font-bold text-xl">MatrixVerse</a>
        <div className="hidden md:flex items-center gap-4">
          <ThemeToggle />
          <a href="/dashboard" className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-sm">Dashboard</a>
          <a href="/journal" className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-sm">Journal</a>
          <a href="/community" className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-sm">Community</a>
          <a href="/education" className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-sm">Learn</a>
        </div>
        <div className="md:hidden">
          <ThemeToggle />
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-10 pb-20">

        <div className="text-center mb-10">
          <h1 className="text-[var(--text-primary)] font-bold text-3xl mb-2">Prop Firm Recommendations</h1>
          <p className="text-[var(--text-muted)] text-sm max-w-xl mx-auto">
            Find the right prop firm for your trading style. Compare rules, splits and prices side by side.
          </p>
        </div>

        <div className="relative mb-6">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">🔍</span>
          <input
            type="text"
            placeholder="Search by firm name or trading style..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-primary)] placeholder-[#8B949E] rounded-2xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:border-[var(--accent-blue)] transition-colors"
          />
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              className={"px-4 py-2 rounded-full text-sm font-semibold transition-colors " + (
                activeFilter === f.key
                  ? "bg-[var(--accent-blue)] text-[var(--bg-primary)]"
                  : "border border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--accent-blue)] hover:text-[var(--accent-blue)]"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <p className="text-[var(--text-muted)] text-xs mb-6">
          Showing {filteredFirms.length} prop firm{filteredFirms.length !== 1 ? "s" : ""}
        </p>

        {filteredFirms.length === 0 ? (
          <div className="text-center py-16 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl">
            <div className="text-4xl mb-3">🔍</div>
            <p className="text-[var(--text-muted)] text-sm">No firms match your filter. Try a different one.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredFirms.map((firm, index) => {
              return (
                <div key={index} className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-6 hover:border-[var(--accent-blue)] transition-colors flex flex-col gap-4">

                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">{firm.logo}</div>
                      <div>
                        <h2 className="text-[var(--text-primary)] font-bold text-lg">{firm.name}</h2>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[var(--accent-gold)] text-xs">{renderStars(firm.rating)}</span>
                          <span className="text-[var(--text-muted)] text-xs">{firm.rating}/5</span>
                        </div>
                      </div>
                    </div>
                    <span
                      className="text-xs font-bold px-3 py-1 rounded-full"
                      style={{ backgroundColor: firm.badgeColor + "20", color: firm.badgeColor }}
                    >
                      {firm.badge}
                    </span>
                  </div>

                  <p className="text-[var(--text-muted)] text-sm leading-relaxed">{firm.description}</p>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[var(--bg-primary)] rounded-xl p-3">
                      <div className="text-[var(--text-muted)] text-xs mb-1">Profit Target</div>
                      <div className="font-bold text-sm text-[var(--accent-green)]">{firm.profitTarget}</div>
                    </div>
                    <div className="bg-[var(--bg-primary)] rounded-xl p-3">
                      <div className="text-[var(--text-muted)] text-xs mb-1">Max Drawdown</div>
                      <div className="font-bold text-sm text-[var(--accent-red)]">{firm.maxDrawdown}</div>
                    </div>
                    <div className="bg-[var(--bg-primary)] rounded-xl p-3">
                      <div className="text-[var(--text-muted)] text-xs mb-1">Daily Loss Limit</div>
                      <div className="font-bold text-sm text-[var(--accent-gold)]">{firm.dailyLoss}</div>
                    </div>
                    <div className="bg-[var(--bg-primary)] rounded-xl p-3">
                      <div className="text-[var(--text-muted)] text-xs mb-1">Profit Split</div>
                      <div className="font-bold text-sm text-[var(--accent-blue)]">{firm.profitSplit}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div>
                        <div className="text-[var(--text-muted)] text-xs">Min Trading Days</div>
                        <div className="text-[var(--text-primary)] font-semibold text-sm">
                          {firm.minTradingDays === 0 ? "None" : firm.minTradingDays + " days"}
                        </div>
                      </div>
                      <div>
                        <div className="text-[var(--text-muted)] text-xs">Difficulty</div>
                        <div className="font-semibold text-sm" style={{ color: getDifficultyColor(firm.difficulty) }}>
                          {firm.difficulty}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[var(--text-muted)] text-xs">Starting Price</div>
                      <div className="text-[var(--text-primary)] font-bold text-sm">{firm.price}</div>
                    </div>
                  </div>

                  <div>
                    <div className="text-[var(--text-muted)] text-xs mb-2">Account Sizes</div>
                    <div className="flex flex-wrap gap-1.5">
                      {firm.accountSizes.map((size, i) => (
                        <span key={i} className="bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-secondary)] text-xs px-2 py-1 rounded-lg">
                          {size}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="text-[var(--text-muted)] text-xs mb-2">Allowed Styles</div>
                    <div className="flex flex-wrap gap-1.5">
                      {firm.style.map((s, i) => (
                        <span key={i} className="bg-[#7C3AED20] text-[var(--accent-purple)] text-xs font-semibold px-2 py-1 rounded-lg border border-[#7C3AED40]">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <a
                    href={firm.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-[var(--accent-blue)] text-[var(--bg-primary)] font-bold py-3 rounded-full text-sm text-center hover:bg-[var(--accent-blue-hover)] transition-colors block"
                  >
                    {"Visit " + firm.name + " →"}
                  </a>

                </div>
              );
            })}
          </div>
        )}

        <div className="mt-10 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-5">
          <p className="text-[var(--text-muted)] text-xs leading-relaxed text-center">
            Disclaimer: MatrixVerse is not affiliated with any prop firm listed above. Information is for educational purposes only. Always do your own research before purchasing any prop firm challenge. Rules and prices may change without notice.
          </p>
        </div>

      </div>
<MobileNav username={user?.user_metadata?.username || user?.email} />
    </main>
  );
}
