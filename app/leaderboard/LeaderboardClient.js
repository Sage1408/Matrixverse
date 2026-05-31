"use client";

import MobileNav from "../components/MobileNav";
import ThemeToggle from "../components/ThemeToggle"
import { Skeleton, SkeletonCard, SkeletonText } from "../components/Skeleton"
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";

export default function LeaderboardClient() {
  const [user, setUser] = useState(null);
  const [traders, setTraders] = useState([]);
  const [activeCategory, setActiveCategory] = useState("pnl");
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
      } else {
        setUser(user);
        fetchLeaderboard();
      }
    };
    init();
  }, []);

  const fetchLeaderboard = async () => {
    const { data: trades } = await supabase.from("trades").select("*");
    if (!trades) return;

    const userMap = {};
    trades.forEach(trade => {
      if (!userMap[trade.user_id]) {
        userMap[trade.user_id] = { user_id: trade.user_id, trades: [] };
      }
      userMap[trade.user_id].trades.push(trade);
    });

    const stats = Object.values(userMap).map(u => {
      const t = u.trades;
      const wins = t.filter(x => x.pnl > 0).length;
      const totalPnl = t.reduce((sum, x) => sum + (x.pnl || 0), 0);
      const winRate = t.length > 0 ? Math.round((wins / t.length) * 100) : 0;
      const avgRR = t.length > 0
        ? (t.reduce((sum, x) => sum + (x.rr_ratio || 0), 0) / t.length).toFixed(2)
        : 0;
      return {
        user_id: u.user_id,
        total_trades: t.length,
        wins,
        losses: t.length - wins,
        net_pnl: parseFloat(totalPnl.toFixed(2)),
        win_rate: winRate,
        avg_rr: parseFloat(avgRR),
      };
    });

    const { data: posts } = await supabase.from("posts").select("user_id, username");
    const usernameMap = {};
    if (posts) {
      posts.forEach(p => {
        if (!usernameMap[p.user_id]) usernameMap[p.user_id] = p.username;
      });
    }

    const withUsernames = stats.map(s => ({
      ...s,
      username: usernameMap[s.user_id] || "Trader",
    }));

    setTraders(withUsernames);
  };

  const getSortedTraders = () => {
    const sorted = [...traders];
    if (activeCategory === "pnl") return sorted.sort((a, b) => b.net_pnl - a.net_pnl);
    if (activeCategory === "winrate") return sorted.sort((a, b) => b.win_rate - a.win_rate);
    if (activeCategory === "rr") return sorted.sort((a, b) => b.avg_rr - a.avg_rr);
    if (activeCategory === "trades") return sorted.sort((a, b) => b.total_trades - a.total_trades);
    return sorted;
  };

  const sortedTraders = getSortedTraders();
  const myRank = sortedTraders.findIndex(t => t.user_id === user?.id) + 1;

  const getMedalColor = (index) => {
    if (index === 0) return "#FFD700";
    if (index === 1) return "#C0C0C0";
    if (index === 2) return "#CD7F32";
    return "#8B949E";
  };

  const getMedalEmoji = (index) => {
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";
    return "#" + (index + 1);
  };

  const getStatValue = (trader) => {
    if (activeCategory === "pnl") return "$" + trader.net_pnl;
    if (activeCategory === "winrate") return trader.win_rate + "%";
    if (activeCategory === "rr") return trader.avg_rr + "R";
    if (activeCategory === "trades") return trader.total_trades + " trades";
    return "";
  };

  const categories = [
    { key: "pnl", label: "💰 Most Profitable" },
    { key: "winrate", label: "🎯 Best Win Rate" },
    { key: "rr", label: "⚖️ Best RR Ratio" },
    { key: "trades", label: "📊 Most Active" },
  ];

  if (!user) return (
    <main className="bg-[var(--bg-primary)] min-h-screen flex items-center justify-center">
      <div className="w-full max-w-4xl px-6 space-y-6">
        <SkeletonText lines={2} />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </main>
  );

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
           <a href="/glossary" className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-sm">Glossary</a>
        </div>
        <div className="md:hidden">
          <ThemeToggle />
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-10 pb-24">

        <div className="text-center mb-10">
          <h1 className="text-[var(--text-primary)] font-bold text-3xl mb-2">🏆 Leaderboard</h1>
          <p className="text-[var(--text-muted)] text-sm">Compete with traders worldwide</p>
          {myRank > 0 && (
            <div className="inline-block mt-3 bg-[var(--bg-secondary)] border border-[var(--accent-blue)] text-[var(--accent-blue)] text-sm font-bold px-4 py-2 rounded-full">
              Your Rank: #{myRank}
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2 mb-8 justify-center">
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={"px-4 py-2 rounded-full text-sm font-semibold transition-colors " + (
                activeCategory === cat.key
                  ? "bg-[var(--accent-blue)] text-[var(--bg-primary)]"
                  : "border border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--accent-blue)] hover:text-[var(--accent-blue)]"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {sortedTraders.length >= 3 && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[1, 0, 2].map((rankIndex) => {
              const trader = sortedTraders[rankIndex];
              if (!trader) return null;
              return (
                <a
                  href={"/profile/" + trader.username}
                  key={rankIndex}
                  className={"bg-[var(--bg-secondary)] border rounded-2xl p-5 text-center block hover:border-[var(--accent-blue)] transition-colors " + (
                    rankIndex === 0 ? "border-[var(--accent-gold)] md:-mt-4" : "border-[var(--border)]"
                  )}
                >
                  <div className="text-3xl mb-2">{getMedalEmoji(rankIndex)}</div>
                  <div
                    className="w-12 h-12 rounded-full mx-auto flex items-center justify-center text-[var(--bg-primary)] font-bold text-lg mb-2"
                    style={{ backgroundColor: getMedalColor(rankIndex) }}
                  >
                    {trader.username?.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-[var(--text-primary)] font-bold text-sm mb-1">@{trader.username}</div>
                  <div className="font-bold" style={{ color: getMedalColor(rankIndex) }}>
                    {getStatValue(trader)}
                  </div>
                </a>
              );
            })}
          </div>
        )}

        <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--border)]">
            <h2 className="text-[var(--text-primary)] font-bold">Full Rankings</h2>
          </div>

          {sortedTraders.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-4xl mb-3">🏆</div>
              <p className="text-[var(--text-muted)] text-sm">No traders ranked yet.</p>
              <p className="text-[var(--text-muted)] text-xs mt-1">Log trades to appear on the leaderboard!</p>
              <a href="/journal" className="inline-block mt-4 bg-[var(--accent-blue)] text-[var(--bg-primary)] font-bold px-5 py-2 rounded-full text-xs hover:bg-[var(--accent-blue-hover)] transition-colors">
                Log Trades
              </a>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {sortedTraders.map((trader, index) => (
                <div
                  key={trader.user_id}
                  className={"flex items-center justify-between px-6 py-4 hover:bg-[var(--bg-tertiary)] transition-colors " + (
                    trader.user_id === user?.id ? "bg-[#00D4FF08]" : ""
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-8 text-center font-bold text-sm" style={{ color: getMedalColor(index) }}>
                      {getMedalEmoji(index)}
                    </div>
                    <a href={"/profile/" + trader.username}>
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-[var(--bg-primary)] font-bold text-sm hover:opacity-80 cursor-pointer transition-opacity"
                        style={{ backgroundColor: getMedalColor(index) }}
                      >
                        {trader.username?.charAt(0).toUpperCase()}
                      </div>
                    </a>
                    <div>
                      <div className="flex items-center gap-2">
                        <a href={"/profile/" + trader.username} className="text-[var(--text-primary)] font-semibold text-sm hover:text-[var(--accent-blue)] transition-colors">
                          @{trader.username}
                        </a>
                        {trader.user_id === user?.id && (
                          <span className="text-[var(--accent-blue)] text-xs">(You)</span>
                        )}
                      </div>
                      <div className="text-[var(--text-muted)] text-xs">
                        {trader.total_trades} trades · {trader.win_rate}% win rate
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right hidden md:block">
                      <div className="text-[var(--text-muted)] text-xs">Avg RR</div>
                      <div className="text-[var(--accent-gold)] font-bold text-sm">{trader.avg_rr}R</div>
                    </div>
                    <div className="text-right hidden md:block">
                      <div className="text-[var(--text-muted)] text-xs">Win Rate</div>
                      <div className="text-[var(--accent-blue)] font-bold text-sm">{trader.win_rate}%</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[var(--text-muted)] text-xs">Net PnL</div>
                      <div className="font-bold text-sm" style={{ color: trader.net_pnl >= 0 ? "#00FF88" : "#FF4757" }}>
                        {trader.net_pnl >= 0 ? "+" : ""}${trader.net_pnl}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {myRank > 0 && (
          <div className="mt-6 bg-[var(--bg-secondary)] border border-[var(--accent-blue)] rounded-2xl p-5">
            <h2 className="text-[var(--text-primary)] font-bold mb-4">Your Stats</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {(() => {
                const me = sortedTraders.find(t => t.user_id === user?.id);
                if (!me) return null;
                return [
                  { label: "Your Rank", value: "#" + myRank, color: "#00D4FF" },
                  { label: "Net PnL", value: "$" + me.net_pnl, color: me.net_pnl >= 0 ? "#00FF88" : "#FF4757" },
                  { label: "Win Rate", value: me.win_rate + "%", color: "#FFD700" },
                  { label: "Avg RR", value: me.avg_rr + "R", color: "#7C3AED" },
                ].map((stat, i) => (
                  <div key={i} className="text-center">
                    <div className="text-[var(--text-muted)] text-xs mb-1">{stat.label}</div>
                    <div className="font-bold text-lg" style={{ color: stat.color }}>{stat.value}</div>
                  </div>
                ));
              })()}
            </div>
          </div>
        )}

      </div>
<MobileNav username={user?.user_metadata?.username || user?.email} />
    </main>
  );
}
