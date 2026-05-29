"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";
import NotificationBell from "../components/NotificationBell";
import MobileNav from "../components/MobileNav";
import ThemeToggle from "../components/ThemeToggle"
import { Skeleton, SkeletonCard, SkeletonText } from "../components/Skeleton"
import ReportGenerator from "../components/ReportGenerator"
import OnboardingWizard from "../components/OnboardingWizard"
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from "recharts";

export default function DashboardClient() {
  const [user, setUser] = useState(null);
  const [trades, setTrades] = useState([]);
  const [checkins, setCheckins] = useState([]);
  const [riskBalance, setRiskBalance] = useState("");
  const [riskPercent, setRiskPercent] = useState("");
  const [stopLossPips, setStopLossPips] = useState("");
  const [pipValue, setPipValue] = useState("10");
  const [lotSize, setLotSize] = useState(null);
  const [streak, setStreak] = useState(0);
  const [badgeNotification, setBadgeNotification] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [tradeFilter, setTradeFilter] = useState("all");
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setUser(user);
      if (!localStorage.getItem("matrixverse-onboarded")) {
        setShowOnboarding(true);
      }
      fetchTrades(user.id);
      fetchCheckins(user.id);
    };
    getUser();
  }, []);

  const fetchTrades = async (userId) => {
    const { data } = await supabase
      .from("trades").select("*").eq("user_id", userId)
      .order("traded_at", { ascending: true });
    if (data) setTrades(data);
  };

  const fetchCheckins = async (userId) => {
    const { data } = await supabase
      .from("checkins").select("*").eq("user_id", userId)
      .order("checked_in_at", { ascending: false });
    if (data) setCheckins(data);
  };

  const handleCheckin = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    try {
      const res = await fetch("/api/checkin/streak", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json();
      if (data.streak) setStreak(data.streak);
      if (data.newBadges?.length > 0) {
        setBadgeNotification(data.newBadges);
        setTimeout(() => setBadgeNotification(null), 5000);
      }
      fetchCheckins(user.id);
    } catch (e) {
      // silently fail
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  // Stats
  const filteredTrades = tradeFilter === "all" ? trades : trades.filter(t => tradeFilter === "real" ? !t.is_demo : t.is_demo)
  const winRate = filteredTrades.length > 0
    ? Math.round((filteredTrades.filter(t => t.pnl > 0).length / filteredTrades.length) * 100)
    : 0;

  const netPnL = filteredTrades.reduce((sum, t) => sum + (t.pnl || 0), 0).toFixed(2);

  const calcPsychScore = () => {
    if (checkins.length === 0) return null;
    const last7 = checkins.slice(0, 7);
    let score = 0;
    last7.forEach(c => {
      if (c.mood === "Excellent") score += 100;
      else if (c.mood === "Good") score += 80;
      else if (c.mood === "Neutral") score += 60;
      else if (c.mood === "Anxious") score += 30;
      else if (c.mood === "Stressed") score += 20;
      else if (c.mood === "Bad") score += 10;
    });
    return Math.round(score / last7.length);
  };

  const psychScore = calcPsychScore();
  const scoreColor = psychScore >= 75 ? "#00FF88" : psychScore >= 50 ? "#FFD700" : "#FF4757";

  const checkedInToday = checkins.length > 0 &&
    new Date(checkins[0].checked_in_at).toDateString() === new Date().toDateString();

  const username = user?.user_metadata?.username || user?.email;

  // PnL Chart Data — cumulative PnL over time
  const pnlChartData = () => {
    let cumulative = 0;
    return trades.map(t => {
      cumulative += t.pnl || 0;
      return {
        date: new Date(t.traded_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        pnl: parseFloat(cumulative.toFixed(2)),
      };
    });
  };

  const chartData = pnlChartData();
  const chartColor = parseFloat(netPnL) >= 0 ? "#00FF88" : "#FF4757";

  // Risk Calculator
  const calculateLotSize = () => {
    const balance = parseFloat(riskBalance);
    const risk = parseFloat(riskPercent);
    const sl = parseFloat(stopLossPips);
    const pv = parseFloat(pipValue);
    if (!balance || !risk || !sl || !pv) { setLotSize(null); return; }
    const riskAmount = (balance * risk) / 100;
    const lots = riskAmount / (sl * pv);
    setLotSize(lots.toFixed(2));
  };

  // Weekly recap
  const getWeeklyTrades = () => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return trades.filter(t => new Date(t.traded_at) >= oneWeekAgo);
  };

  const weeklyTrades = getWeeklyTrades();
  const weeklyPnL = weeklyTrades.reduce((sum, t) => sum + (t.pnl || 0), 0).toFixed(2);
  const bestTrade = weeklyTrades.length > 0
    ? weeklyTrades.reduce((best, t) => t.pnl > best.pnl ? t : best, weeklyTrades[0])
    : null;
  const worstTrade = weeklyTrades.length > 0
    ? weeklyTrades.reduce((worst, t) => t.pnl < worst.pnl ? t : worst, weeklyTrades[0])
    : null;

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
        <div className="text-[var(--accent-blue)] font-bold text-xl">MatrixVerse</div>
        <div className="hidden md:flex items-center gap-6">
          <ThemeToggle />
          <a href="/journal" className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-sm">Journal</a>
          <a href="/education" className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-sm">Learn</a>
          <a href="/analytics" className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-sm">Analytics</a>
          <a href="/psychology" className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-sm">Psychology</a>
          <a href="/community" className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-sm">Community</a>
          <a href="/leaderboard" className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-sm">Leaderboard</a>
        </div>
        <div className="hidden md:flex items-center gap-4">
          <NotificationBell userId={user.id} />
          <a href={"/profile/" + username} className="text-[var(--accent-blue)] text-sm font-semibold hover:underline">
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
          <h1 className="text-[var(--text-primary)] font-bold text-3xl mb-1">
            Welcome back,{" "}
            <a href={"/profile/" + username} className="text-[var(--accent-blue)] hover:underline">{username}</a>{" "}👋
          </h1>
          <p className="text-[var(--text-muted)] text-sm">Here is your trading overview</p>
        </div>

        {/* Trade Filter Toggle */}
        <div className="flex items-center gap-2 mb-6">
          {[
            { key: "all", label: "All Trades", color: "#00D4FF" },
            { key: "real", label: "Real Only", color: "#00FF88" },
            { key: "demo", label: "Paper Only", color: "#FFD700" },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setTradeFilter(f.key)}
              className={"px-4 py-1.5 rounded-full text-xs font-semibold transition-colors border " + (
                tradeFilter === f.key
                  ? "border-transparent text-[var(--bg-primary)]" : "border-[var(--border)] text-[var(--text-muted)]"
              )}
              style={tradeFilter === f.key ? { backgroundColor: f.color, color: "#000" } : {}}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* STATS ROW */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Trades", value: trades.length, color: "#00D4FF", icon: "📊" },
            { label: "Win Rate", value: winRate + "%", color: "#00FF88", icon: "🎯" },
            { label: "Total Check-ins", value: checkins.length, color: "#FFD700", icon: "🔥" },
            { label: "Net PnL", value: "$" + netPnL, color: parseFloat(netPnL) >= 0 ? "#00FF88" : "#FF4757", icon: "💰" },
          ].map((stat, i) => (
            <div key={i} className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-5">
              <div className="text-2xl mb-2">{stat.icon}</div>
              <div className="text-[var(--text-muted)] text-xs mb-1">{stat.label}</div>
              <div className="font-bold text-xl" style={{ color: stat.color }}>{stat.value}</div>
            </div>
          ))}
        </div>

        {/* PNL CHART */}
        <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[var(--text-primary)] font-bold text-lg">PnL Chart</h2>
            <span className="text-[var(--text-muted)] text-xs">Cumulative performance</span>
          </div>
          {trades.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="text-4xl mb-3">📈</div>
              <p className="text-[var(--text-muted)] text-sm">Log trades to see your PnL chart</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#30363D" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "#8B949E", fontSize: 10 }}
                  axisLine={{ stroke: "#30363D" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#8B949E", fontSize: 10 }}
                  axisLine={{ stroke: "#30363D" }}
                  tickLine={false}
                  tickFormatter={(v) => "$" + v}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#161B22",
                    border: "1px solid #30363D",
                    borderRadius: "12px",
                    color: "#F0F6FC",
                  }}
                  formatter={(value) => ["$" + value, "PnL"]}
                />
                <Line
                  type="monotone"
                  dataKey="pnl"
                  stroke={chartColor}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: chartColor }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* RECENT TRADES + PSYCHOLOGY */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">

          <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[var(--text-primary)] font-bold text-lg">Recent Trades</h2>
              <a href="/journal" className="text-[var(--accent-blue)] text-xs hover:underline">View All</a>
            </div>
            {trades.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="text-4xl mb-3">📓</div>
                <p className="text-[var(--text-muted)] text-sm">No trades logged yet</p>
                <a href="/journal" className="mt-4 bg-[var(--accent-blue)] text-[var(--bg-primary)] font-bold px-5 py-2 rounded-full text-xs hover:bg-[var(--accent-blue-hover)] transition-colors">
                  Log Your First Trade
                </a>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {[...trades].reverse().slice(0, 5).map((trade, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-[var(--bg-primary)] rounded-xl">
                    <div className="flex items-center gap-3">
                      <span className="text-[var(--accent-blue)] font-bold text-sm">{trade.pair}</span>
                      <span className={"text-xs font-bold px-2 py-0.5 rounded-full " + (trade.direction === "buy" ? "bg-[var(--accent-green-bg)] text-[var(--accent-green)]" : "bg-[var(--accent-red-bg)] text-[var(--accent-red)]")}>
                        {trade.direction?.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[var(--text-muted)] text-xs">{trade.rr_ratio ? trade.rr_ratio + "R" : "-"}</span>
                      <span className="font-bold text-sm" style={{ color: trade.pnl >= 0 ? "#00FF88" : "#FF4757" }}>
                        {trade.pnl >= 0 ? "+" : ""}${trade.pnl}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[var(--text-primary)] font-bold text-lg">Psychology Score</h2>
              <span className="text-[var(--text-muted)] text-xs">Last 7 days</span>
            </div>
            <div className="flex flex-col items-center justify-center py-4">
              <div
                className="w-24 h-24 rounded-full border-4 flex items-center justify-center mb-4"
                style={{ borderColor: psychScore ? scoreColor : "#30363D" }}
              >
                <span className="font-bold text-2xl" style={{ color: psychScore ? scoreColor : "#8B949E" }}>
                  {psychScore || "--"}
                </span>
              </div>
              <p className="text-[var(--text-muted)] text-sm text-center mb-4">
                {psychScore
                  ? psychScore >= 75 ? "🟢 Trading mindset is strong"
                  : psychScore >= 50 ? "🟡 Be cautious today"
                  : "🔴 Consider taking a break"
                  : "Complete your daily check-in"}
              </p>
              {!checkedInToday ? (
                <button
                  onClick={handleCheckin}
                  className="border border-[var(--accent-blue)] text-[var(--accent-blue)] font-semibold px-5 py-2 rounded-full text-xs hover:bg-[var(--accent-blue)] hover:text-[var(--bg-primary)] transition-colors"
                >
                  Daily Check-In
                </button>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div className="bg-[var(--accent-green-bg)] border border-[var(--accent-green)] text-[var(--accent-green)] text-xs font-bold px-4 py-2 rounded-full">
                    ✓ Checked In Today
                  </div>
                  {streak > 0 && (
                    <span className="text-[var(--accent-gold)] text-xs font-semibold">🔥 {streak}-day streak</span>
                  )}
                </div>
              )}
              {badgeNotification && (
                <div className="mt-3 flex flex-col gap-2 w-full">
                  {badgeNotification.map((b, i) => (
                    <div key={i} className="bg-[var(--accent-gold-bg)] border border-[var(--accent-gold)] rounded-xl px-3 py-2 text-center animate-pulse">
                      <span className="text-sm">{b.badge_icon}</span>
                      <span className="text-[var(--accent-gold)] text-xs font-bold ml-1">New Badge: {b.badge_name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>

        {/* RISK CALCULATOR + WEEKLY RECAP */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">

          {/* RISK CALCULATOR */}
          <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-6">
            <h2 className="text-[var(--text-primary)] font-bold text-lg mb-4">⚡ Risk Calculator</h2>
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-[var(--text-muted)] text-xs mb-1 block">Account Balance ($)</label>
                <input
                  type="number"
                  placeholder="e.g. 1000"
                  value={riskBalance}
                  onChange={(e) => setRiskBalance(e.target.value)}
                  className="w-full bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] placeholder-[#8B949E] rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-[var(--accent-blue)]"
                />
              </div>
              <div>
                <label className="text-[var(--text-muted)] text-xs mb-1 block">Risk Percentage (%)</label>
                <input
                  type="number"
                  placeholder="e.g. 1"
                  value={riskPercent}
                  onChange={(e) => setRiskPercent(e.target.value)}
                  className="w-full bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] placeholder-[#8B949E] rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-[var(--accent-blue)]"
                />
              </div>
              <div>
                <label className="text-[var(--text-muted)] text-xs mb-1 block">Stop Loss (pips)</label>
                <input
                  type="number"
                  placeholder="e.g. 20"
                  value={stopLossPips}
                  onChange={(e) => setStopLossPips(e.target.value)}
                  className="w-full bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] placeholder-[#8B949E] rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-[var(--accent-blue)]"
                />
              </div>
              <div>
                <label className="text-[var(--text-muted)] text-xs mb-1 block">Pip Value ($) — standard lot</label>
                <select
                  value={pipValue}
                  onChange={(e) => setPipValue(e.target.value)}
                  className="w-full bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-[var(--accent-blue)]"
                >
                  <option value="10">$10 — Major pairs (EURUSD etc)</option>
                  <option value="9">$9 — GBPUSD</option>
                  <option value="1">$1 — XAUUSD (Gold)</option>
                  <option value="7">$7 — USDJPY</option>
                </select>
              </div>
              <button
                onClick={calculateLotSize}
                className="bg-[var(--accent-blue)] text-[var(--bg-primary)] font-bold py-2 rounded-full text-sm hover:bg-[var(--accent-blue-hover)] transition-colors"
              >
                Calculate Lot Size
              </button>
              {lotSize && (
                <div className="bg-[var(--bg-primary)] border border-[var(--accent-blue)] rounded-xl p-4 text-center">
                  <p className="text-[var(--text-muted)] text-xs mb-1">Recommended Lot Size</p>
                  <p className="text-[var(--accent-blue)] font-bold text-2xl">{lotSize}</p>
                  <p className="text-[var(--text-muted)] text-xs mt-1">
                    Risk: ${((parseFloat(riskBalance) * parseFloat(riskPercent)) / 100).toFixed(2)}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* WEEKLY RECAP */}
          <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-6">
            <h2 className="text-[var(--text-primary)] font-bold text-lg mb-4">📅 Weekly Recap</h2>
            {weeklyTrades.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="text-4xl mb-3">📅</div>
                <p className="text-[var(--text-muted)] text-sm">No trades this week yet</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[var(--bg-primary)] rounded-xl p-3 text-center">
                    <p className="text-[var(--text-muted)] text-xs mb-1">Trades This Week</p>
                    <p className="text-[var(--text-primary)] font-bold text-xl">{weeklyTrades.length}</p>
                  </div>
                  <div className="bg-[var(--bg-primary)] rounded-xl p-3 text-center">
                    <p className="text-[var(--text-muted)] text-xs mb-1">Weekly PnL</p>
                    <p className="font-bold text-xl" style={{ color: parseFloat(weeklyPnL) >= 0 ? "#00FF88" : "#FF4757" }}>
                      {parseFloat(weeklyPnL) >= 0 ? "+" : ""}${weeklyPnL}
                    </p>
                  </div>
                </div>
                {bestTrade && (
                  <div className="bg-[var(--accent-green-bg)] border border-[var(--accent-green-border)] rounded-xl p-3">
                    <p className="text-[var(--accent-green)] text-xs font-bold mb-1">🏆 Best Trade</p>
                    <p className="text-[var(--text-primary)] text-sm">{bestTrade.pair} {bestTrade.direction?.toUpperCase()}</p>
                    <p className="text-[var(--accent-green)] font-bold">+${bestTrade.pnl}</p>
                  </div>
                )}
                {worstTrade && worstTrade.pnl < 0 && (
                  <div className="bg-[var(--accent-red-bg)] border border-[var(--accent-red-border)] rounded-xl p-3">
                    <p className="text-[var(--accent-red)] text-xs font-bold mb-1">⚠️ Worst Trade</p>
                    <p className="text-[var(--text-primary)] text-sm">{worstTrade.pair} {worstTrade.direction?.toUpperCase()}</p>
                    <p className="text-[var(--accent-red)] font-bold">${worstTrade.pnl}</p>
                  </div>
                )}
              </div>
            )}
            <div className="mt-4">
              <ReportGenerator trades={trades} />
            </div>
          </div>

        </div>

        {/* BOTTOM ROW */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-6 text-center">
            <div className="text-4xl mb-2">🔥</div>
            <div className="text-[var(--text-primary)] font-bold text-3xl mb-1">{checkins.length}</div>
            <div className="text-[var(--text-muted)] text-sm">Total Check-ins</div>
            {streak > 0 && (
              <p className="text-[var(--accent-gold)] text-xs font-bold mt-1">📅 {streak}-day streak</p>
            )}
            <p className="text-[var(--text-muted)] text-xs mt-2">Keep checking in daily!</p>
          </div>

          <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-6">
            <h2 className="text-[var(--text-primary)] font-bold text-lg mb-4">Prop Firms</h2>
            <div className="flex flex-col items-center justify-center py-4 text-center">
              <div className="text-3xl mb-2">🎯</div>
              <p className="text-[var(--text-muted)] text-sm">Find the right prop firm</p>
              <a href="/prop-firms" className="mt-3 border border-[var(--accent-gold)] text-[var(--accent-gold)] text-xs font-semibold px-4 py-2 rounded-full hover:bg-[var(--accent-gold)] hover:text-[var(--bg-primary)] transition-colors">
                View Prop Firms
              </a>
            </div>
          </div>

          <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-6">
            <h2 className="text-[var(--text-primary)] font-bold text-lg mb-4">Quick Links</h2>
            <div className="flex flex-col gap-3">
              <a href="/journal" className="text-[var(--text-muted)] hover:text-[var(--accent-blue)] text-sm transition-colors">📓 Trading Journal</a>
              <a href="/analytics" className="text-[var(--text-muted)] hover:text-[var(--accent-blue)] text-sm transition-colors">📊 Analytics</a>
              <a href="/ai-analyzer" className="text-[var(--text-muted)] hover:text-[var(--accent-blue)] text-sm transition-colors">🤖 AI Analyzer</a>
              <a href="/community" className="text-[var(--text-muted)] hover:text-[var(--accent-blue)] text-sm transition-colors">👥 Community</a>
              <a href="/leaderboard" className="text-[var(--text-muted)] hover:text-[var(--accent-blue)] text-sm transition-colors">🏆 Leaderboard</a>
              <a href="/psychology" className="text-[var(--text-muted)] hover:text-[var(--accent-blue)] text-sm transition-colors">🧠 Psychology</a>
              <a href="/search" className="text-[var(--text-muted)] hover:text-[var(--accent-blue)] text-sm transition-colors">🔍 Search Traders</a>
              <a href={"/profile/" + username} className="text-[var(--text-muted)] hover:text-[var(--accent-blue)] text-sm transition-colors">👤 My Profile</a>
            </div>
          </div>

        </div>
      </div>

      <MobileNav username={username} />
      {showOnboarding && (
        <OnboardingWizard onComplete={() => setShowOnboarding(false)} />
      )}
    </main>
  );
}
