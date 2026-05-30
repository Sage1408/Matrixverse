"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";
import ThemeToggle from "../components/ThemeToggle"
import InboxIcon from "../components/InboxIcon";
import MobileNav from "../components/MobileNav"
import { Skeleton, SkeletonCard, SkeletonText } from "../components/Skeleton"
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, AreaChart, Area, Legend, Cell
} from "recharts";

export default function AnalyticsClient() {
  const [user, setUser] = useState(null);
  const [trades, setTrades] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setUser(user);
      const { data: trades } = await supabase
        .from("trades").select("*").eq("user_id", user.id)
        .order("traded_at", { ascending: true });
      if (trades) setTrades(trades);
    };
    load();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const username = user?.user_metadata?.username || user?.email;

  const wins = trades.filter(t => t.pnl > 0);
  const losses = trades.filter(t => t.pnl < 0);
  const winRate = trades.length > 0 ? Math.round((wins.length / trades.length) * 100) : 0;
  const netPnL = trades.reduce((sum, t) => sum + (t.pnl || 0), 0);
  const avgRR = trades.length > 0
    ? (trades.reduce((sum, t) => sum + (t.rr_ratio || 0), 0) / trades.length).toFixed(2)
    : "0.00";

  const bestTrade = trades.length > 0
    ? trades.reduce((best, t) => t.pnl > best.pnl ? t : best, trades[0])
    : null;
  const worstTrade = trades.length > 0
    ? trades.reduce((worst, t) => t.pnl < worst.pnl ? t : worst, trades[0])
    : null;

  const uniqueDays = new Set(trades.map(t => new Date(t.traded_at).toDateString())).size;
  const avgTradesPerDay = uniqueDays > 0 ? (trades.length / uniqueDays).toFixed(1) : "0";

  const getSession = (ts) => {
    const hour = new Date(ts).getUTCHours();
    if (hour >= 0 && hour < 8) return "Asian";
    if (hour >= 8 && hour < 17) return "London";
    return "New York";
  };

  // Monthly P&L data
  const monthlyData = (() => {
    const groups = {};
    trades.forEach(t => {
      const key = new Date(t.traded_at).toLocaleString("en-US", { month: "short", year: "2-digit" });
      if (!groups[key]) groups[key] = 0;
      groups[key] += t.pnl || 0;
    });
    return Object.entries(groups).map(([month, pnl]) => ({ month, pnl: parseFloat(pnl.toFixed(2)) }));
  })();

  // Weekly win rate trend
  const weeklyWinRateData = (() => {
    const groups = {};
    trades.forEach(t => {
      const d = new Date(t.traded_at);
      const startOfWeek = new Date(d);
      startOfWeek.setDate(d.getDate() - d.getDay());
      const key = startOfWeek.toLocaleString("en-US", { month: "short", day: "numeric" });
      if (!groups[key]) groups[key] = { total: 0, wins: 0 };
      groups[key].total++;
      if (t.pnl > 0) groups[key].wins++;
    });
    return Object.entries(groups).map(([week, data]) => ({
      week,
      winRate: Math.round((data.wins / data.total) * 100),
    }));
  })();

  // Drawdown data
  const drawdownData = (() => {
    let peak = -Infinity;
    let cumulative = 0;
    return trades.map(t => {
      cumulative += t.pnl || 0;
      if (cumulative > peak) peak = cumulative;
      const dd = peak > 0 ? ((cumulative - peak) / peak) * 100 : 0;
      return {
        date: new Date(t.traded_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        drawdown: parseFloat(dd.toFixed(2)),
      };
    });
  })();

  // Duration distribution
  const hasDuration = trades.some(t => t.duration_minutes != null);
  const durationData = (() => {
    if (!hasDuration) return [];
    const buckets = { "<1h": 0, "1-4h": 0, "4-8h": 0, "8-24h": 0, ">24h": 0 };
    trades.forEach(t => {
      const m = t.duration_minutes;
      if (m == null) return;
      if (m < 60) buckets["<1h"]++;
      else if (m < 240) buckets["1-4h"]++;
      else if (m < 480) buckets["4-8h"]++;
      else if (m < 1440) buckets["8-24h"]++;
      else buckets[">24h"]++;
    });
    return Object.entries(buckets).map(([name, count]) => ({ name, count }));
  })();

  // Best/Worst pairs
  const pairStats = (() => {
    const groups = {};
    trades.forEach(t => {
      const p = t.pair || "Unknown";
      if (!groups[p]) groups[p] = { total: 0, wins: 0, pnl: 0 };
      groups[p].total++;
      if (t.pnl > 0) groups[p].wins++;
      groups[p].pnl += t.pnl || 0;
    });
    return Object.entries(groups)
      .map(([pair, data]) => ({
        pair,
        total: data.total,
        wins: data.wins,
        losses: data.total - data.wins,
        winRate: Math.round((data.wins / data.total) * 100),
        netPnl: parseFloat(data.pnl.toFixed(2)),
      }))
      .sort((a, b) => b.total - a.total);
  })();

  // Day of week performance
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const dayOfWeekData = (() => {
    const groups = {};
    trades.forEach(t => {
      const day = dayNames[new Date(t.traded_at).getDay()];
      if (!groups[day]) groups[day] = { total: 0, wins: 0 };
      groups[day].total++;
      if (t.pnl > 0) groups[day].wins++;
    });
    return dayNames
      .filter(d => groups[d])
      .map(day => ({
        day,
        winRate: Math.round((groups[day].wins / groups[day].total) * 100),
        trades: groups[day].total,
      }));
  })();

  // Session performance
  const sessionData = (() => {
    const groups = {};
    trades.forEach(t => {
      const session = getSession(t.traded_at);
      if (!groups[session]) groups[session] = { total: 0, wins: 0 };
      groups[session].total++;
      if (t.pnl > 0) groups[session].wins++;
    });
    return Object.entries(groups).map(([session, data]) => ({
      session,
      winRate: Math.round((data.wins / data.total) * 100),
      trades: data.total,
    }));
  })();

  const hasData = trades.length > 0;

  const chartTooltipStyle = {
    backgroundColor: "#161B22",
    border: "1px solid #30363D",
    borderRadius: "12px",
    color: "#F0F6FC",
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

  return (
    <main className="bg-[var(--bg-primary)] min-h-screen">

      <nav className="bg-[var(--bg-secondary)] border-b border-[var(--border)] px-6 py-4 flex items-center justify-between">
        <a href="/dashboard" className="text-[var(--accent-blue)] font-bold text-xl">MatrixVerse</a>
        <div className="hidden md:flex items-center gap-6">
          <InboxIcon username={user?.user_metadata?.username} />
          <ThemeToggle />
          <a href="/dashboard" className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-sm">Dashboard</a>
          <a href="/journal" className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-sm">Journal</a>
          <a href="/community" className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-sm">Community</a>
           <a href="/education" className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-sm">Learn</a>
           <a href="/glossary" className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-sm">Glossary</a>
          <a href={"/profile/" + username} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-sm">Profile</a>
        </div>
        <div className="hidden md:flex items-center gap-4">
          <a href={"/profile/" + username} className="text-[var(--accent-blue)] text-sm font-semibold hover:underline hidden md:block">
            @{username}
          </a>
          <button onClick={handleLogout} className="text-[var(--accent-red)] text-sm hover:underline hidden md:block">
            Logout
          </button>
        </div>
        <div className="md:hidden">
          <ThemeToggle />
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-10 pb-24">

        <div className="mb-8">
          <h1 className="text-[var(--text-primary)] font-bold text-3xl">📊 Trading Analytics</h1>
          <p className="text-[var(--text-muted)] text-sm mt-1">Detailed breakdown of your trading performance</p>
        </div>

        {/* STATS OVERVIEW */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Trades", value: trades.length, color: "#00D4FF", icon: "📊" },
            { label: "Win Rate", value: hasData ? winRate + "%" : "0%", color: "#00FF88", icon: "🎯" },
            { label: "Net P&L", value: hasData ? "$" + netPnL.toFixed(2) : "$0.00", color: netPnL >= 0 ? "#00FF88" : "#FF4757", icon: "💰" },
            { label: "Avg RR", value: avgRR + "R", color: "#FFD700", icon: "⚖️" },
            { label: "Best Trade", value: bestTrade ? "$" + bestTrade.pnl : "-", color: "#00FF88", icon: "🏆" },
            { label: "Worst Trade", value: worstTrade ? "$" + worstTrade.pnl : "-", color: "#FF4757", icon: "⚠️" },
            { label: "Days Trading", value: uniqueDays, color: "#00D4FF", icon: "📅" },
            { label: "Avg Trades/Day", value: avgTradesPerDay, color: "#7C3AED", icon: "📈" },
          ].map((stat, i) => (
            <div key={i} className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-5">
              <div className="text-2xl mb-2">{stat.icon}</div>
              <div className="text-[var(--text-muted)] text-xs mb-1">{stat.label}</div>
              <div className="font-bold text-xl" style={{ color: stat.color }}>{stat.value}</div>
            </div>
          ))}
        </div>

        {!hasData ? (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl">
            <div className="text-6xl mb-4">📊</div>
            <p className="text-[var(--text-muted)] text-lg mb-2">No trades yet</p>
            <p className="text-[var(--text-muted)] text-sm">Log some trades to see your analytics!</p>
            <a href="/journal" className="mt-6 bg-[var(--accent-blue)] text-[var(--bg-primary)] font-bold px-6 py-3 rounded-full text-sm hover:bg-[var(--accent-blue-hover)] transition-colors">
              Log Your First Trade
            </a>
          </div>
        ) : (
          <>

            {/* MONTHLY P&L CHART */}
            <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[var(--text-primary)] font-bold text-lg">Monthly P&L</h2>
                <span className="text-[var(--text-muted)] text-xs">Profit & loss per month</span>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#30363D" />
                  <XAxis dataKey="month" tick={{ fill: "#8B949E", fontSize: 11 }} axisLine={{ stroke: "#30363D" }} tickLine={false} />
                  <YAxis tick={{ fill: "#8B949E", fontSize: 11 }} axisLine={{ stroke: "#30363D" }} tickLine={false} tickFormatter={(v) => "$" + v} />
                  <Tooltip contentStyle={chartTooltipStyle} formatter={(value) => ["$" + value, "P&L"]} />
                  <Bar dataKey="pnl" radius={[6, 6, 0, 0]}>
                    {monthlyData.map((entry, i) => (
                      <Cell key={i} fill={entry.pnl >= 0 ? "#00FF88" : "#FF4757"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* WIN RATE TREND */}
            <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[var(--text-primary)] font-bold text-lg">Win Rate Trend</h2>
                <span className="text-[var(--text-muted)] text-xs">Weekly win rate %</span>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={weeklyWinRateData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#30363D" />
                  <XAxis dataKey="week" tick={{ fill: "#8B949E", fontSize: 11 }} axisLine={{ stroke: "#30363D" }} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fill: "#8B949E", fontSize: 11 }} axisLine={{ stroke: "#30363D" }} tickLine={false} tickFormatter={(v) => v + "%"} />
                  <Tooltip contentStyle={chartTooltipStyle} formatter={(value) => [value + "%", "Win Rate"]} />
                  <Line type="monotone" dataKey="winRate" stroke="#00D4FF" strokeWidth={2} dot={{ r: 3, fill: "#00D4FF" }} activeDot={{ r: 5, fill: "#00D4FF" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* DRAWDOWN CHART */}
            <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[var(--text-primary)] font-bold text-lg">Drawdown</h2>
                <span className="text-[var(--text-muted)] text-xs">Equity peak-to-trough drawdown %</span>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={drawdownData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#30363D" />
                  <XAxis dataKey="date" tick={{ fill: "#8B949E", fontSize: 10 }} axisLine={{ stroke: "#30363D" }} tickLine={false} />
                  <YAxis tick={{ fill: "#8B949E", fontSize: 11 }} axisLine={{ stroke: "#30363D" }} tickLine={false} tickFormatter={(v) => v + "%"} />
                  <Tooltip contentStyle={chartTooltipStyle} formatter={(value) => [value + "%", "Drawdown"]} />
                  <Area type="monotone" dataKey="drawdown" stroke="#FF4757" fill="#FF4757" fillOpacity={0.15} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
              <p className="text-[var(--text-muted)] text-xs mt-2">Lower is better. Sharp drops indicate losing streaks.</p>
            </div>

            {/* TRADE DURATION DISTRIBUTION */}
            {hasDuration && (
              <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-[var(--text-primary)] font-bold text-lg">Trade Duration</h2>
                  <span className="text-[var(--text-muted)] text-xs">Distribution of trade lengths</span>
                </div>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={durationData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#30363D" />
                    <XAxis dataKey="name" tick={{ fill: "#8B949E", fontSize: 11 }} axisLine={{ stroke: "#30363D" }} tickLine={false} />
                    <YAxis tick={{ fill: "#8B949E", fontSize: 11 }} axisLine={{ stroke: "#30363D" }} tickLine={false} />
                    <Tooltip contentStyle={chartTooltipStyle} formatter={(value) => [value + " trades", "Count"]} />
                    <Bar dataKey="count" fill="#00D4FF" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* BEST/WORST PAIRS TABLE */}
            <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-6 mb-6">
              <h2 className="text-[var(--text-primary)] font-bold text-lg mb-4">Pair Performance</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[var(--border)]">
                      {["Pair", "Trades", "Wins", "Losses", "Win Rate", "Net P&L"].map(h => (
                        <th key={h} className="text-[var(--text-muted)] text-xs px-4 py-3 text-left">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pairStats.map((row, i) => (
                      <tr key={i} className="border-b border-[var(--border)] hover:bg-[var(--bg-tertiary)]">
                        <td className="px-4 py-3 text-[var(--accent-blue)] font-bold text-sm">{row.pair}</td>
                        <td className="px-4 py-3 text-[var(--text-primary)] text-sm">{row.total}</td>
                        <td className="px-4 py-3 text-[var(--accent-green)] text-sm font-semibold">{row.wins}</td>
                        <td className="px-4 py-3 text-[var(--accent-red)] text-sm font-semibold">{row.losses}</td>
                        <td className="px-4 py-3 text-sm font-semibold" style={{ color: row.winRate >= 50 ? "#00FF88" : "#FF4757" }}>{row.winRate}%</td>
                        <td className="px-4 py-3 text-sm font-bold" style={{ color: row.netPnl >= 0 ? "#00FF88" : "#FF4757" }}>
                          {row.netPnl >= 0 ? "+" : ""}${row.netPnl}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* DAY OF WEEK + SESSION */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">

              <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-6">
                <h2 className="text-[var(--text-primary)] font-bold text-lg mb-4">Day of Week Performance</h2>
                {dayOfWeekData.length === 0 ? (
                  <p className="text-[var(--text-muted)] text-sm text-center py-6">No data available</p>
                ) : (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={dayOfWeekData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#30363D" />
                      <XAxis dataKey="day" tick={{ fill: "#8B949E", fontSize: 11 }} axisLine={{ stroke: "#30363D" }} tickLine={false} />
                      <YAxis domain={[0, 100]} tick={{ fill: "#8B949E", fontSize: 11 }} axisLine={{ stroke: "#30363D" }} tickLine={false} tickFormatter={(v) => v + "%"} />
                      <Tooltip contentStyle={chartTooltipStyle} formatter={(value) => [value + "%", "Win Rate"]} />
                      <Bar dataKey="winRate" radius={[6, 6, 0, 0]}>
                        {dayOfWeekData.map((entry, i) => (
                          <Cell key={i} fill={entry.winRate >= 50 ? "#00FF88" : "#FF4757"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-6">
                <h2 className="text-[var(--text-primary)] font-bold text-lg mb-4">Session Performance</h2>
                {sessionData.length === 0 ? (
                  <p className="text-[var(--text-muted)] text-sm text-center py-6">No data available</p>
                ) : (
                  <div className="flex flex-col gap-4">
                    {sessionData.map((s, i) => {
                      const color = s.session === "Asian" ? "#00D4FF" : s.session === "London" ? "#7C3AED" : "#FF6B35";
                      return (
                        <div key={i} className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-sm" style={{ color }}>{s.session}</span>
                            <span className="text-[var(--text-muted)] text-xs">{s.trades} trades</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-3 bg-[var(--border)] rounded-full overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: s.winRate + "%", backgroundColor: s.winRate >= 50 ? "#00FF88" : "#FF4757" }} />
                            </div>
                            <span className="font-bold text-sm" style={{ color: s.winRate >= 50 ? "#00FF88" : "#FF4757" }}>{s.winRate}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>

          </>
        )}

      </div>

      <MobileNav username={username} />
    </main>
  );
}
