"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";
import NotificationBell from "../components/NotificationBell";
import MobileNav from "../components/MobileNav";
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
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setUser(user);
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  // Stats
  const winRate = trades.length > 0
    ? Math.round((trades.filter(t => t.pnl > 0).length / trades.length) * 100)
    : 0;

  const netPnL = trades.reduce((sum, t) => sum + (t.pnl || 0), 0).toFixed(2);

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
    <main className="bg-[#0D1117] min-h-screen flex items-center justify-center">
      <p className="text-[#8B949E]">Loading...</p>
    </main>
  );

  return (
    <main className="bg-[#0D1117] min-h-screen">

      <nav className="bg-[#161B22] border-b border-[#30363D] px-6 py-4 flex items-center justify-between">
        <div className="text-[#00D4FF] font-bold text-xl">MatrixVerse</div>
        <div className="hidden md:flex items-center gap-6">
          <a href="/journal" className="text-[#8B949E] hover:text-white text-sm">Journal</a>
          <a href="/psychology" className="text-[#8B949E] hover:text-white text-sm">Psychology</a>
          <a href="/community" className="text-[#8B949E] hover:text-white text-sm">Community</a>
          <a href="/leaderboard" className="text-[#8B949E] hover:text-white text-sm">Leaderboard</a>
        </div>
        <div className="flex items-center gap-4">
          <NotificationBell userId={user.id} />
          <a href={"/profile/" + username} className="text-[#00D4FF] text-sm font-semibold hover:underline">
            @{username}
          </a>
          <button onClick={handleLogout} className="text-[#FF4757] text-sm hover:underline hidden md:block">
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-10 pb-24">

        <div className="mb-8">
          <h1 className="text-white font-bold text-3xl mb-1">
            Welcome back,{" "}
            <a href={"/profile/" + username} className="text-[#00D4FF] hover:underline">{username}</a>{" "}👋
          </h1>
          <p className="text-[#8B949E] text-sm">Here is your trading overview</p>
        </div>

        {/* STATS ROW */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Trades", value: trades.length, color: "#00D4FF", icon: "📊" },
            { label: "Win Rate", value: winRate + "%", color: "#00FF88", icon: "🎯" },
            { label: "Total Check-ins", value: checkins.length, color: "#FFD700", icon: "🔥" },
            { label: "Net PnL", value: "$" + netPnL, color: parseFloat(netPnL) >= 0 ? "#00FF88" : "#FF4757", icon: "💰" },
          ].map((stat, i) => (
            <div key={i} className="bg-[#161B22] border border-[#30363D] rounded-2xl p-5">
              <div className="text-2xl mb-2">{stat.icon}</div>
              <div className="text-[#8B949E] text-xs mb-1">{stat.label}</div>
              <div className="font-bold text-xl" style={{ color: stat.color }}>{stat.value}</div>
            </div>
          ))}
        </div>

        {/* PNL CHART */}
        <div className="bg-[#161B22] border border-[#30363D] rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-bold text-lg">PnL Chart</h2>
            <span className="text-[#8B949E] text-xs">Cumulative performance</span>
          </div>
          {trades.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="text-4xl mb-3">📈</div>
              <p className="text-[#8B949E] text-sm">Log trades to see your PnL chart</p>
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

          <div className="bg-[#161B22] border border-[#30363D] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-bold text-lg">Recent Trades</h2>
              <a href="/journal" className="text-[#00D4FF] text-xs hover:underline">View All</a>
            </div>
            {trades.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="text-4xl mb-3">📓</div>
                <p className="text-[#8B949E] text-sm">No trades logged yet</p>
                <a href="/journal" className="mt-4 bg-[#00D4FF] text-[#0D1117] font-bold px-5 py-2 rounded-full text-xs hover:bg-[#00b8d9] transition-colors">
                  Log Your First Trade
                </a>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {[...trades].reverse().slice(0, 5).map((trade, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-[#0D1117] rounded-xl">
                    <div className="flex items-center gap-3">
                      <span className="text-[#00D4FF] font-bold text-sm">{trade.pair}</span>
                      <span className={"text-xs font-bold px-2 py-0.5 rounded-full " + (trade.direction === "buy" ? "bg-[#00FF8820] text-[#00FF88]" : "bg-[#FF475720] text-[#FF4757]")}>
                        {trade.direction?.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[#8B949E] text-xs">{trade.rr_ratio ? trade.rr_ratio + "R" : "-"}</span>
                      <span className="font-bold text-sm" style={{ color: trade.pnl >= 0 ? "#00FF88" : "#FF4757" }}>
                        {trade.pnl >= 0 ? "+" : ""}${trade.pnl}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-[#161B22] border border-[#30363D] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-bold text-lg">Psychology Score</h2>
              <span className="text-[#8B949E] text-xs">Last 7 days</span>
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
              <p className="text-[#8B949E] text-sm text-center mb-4">
                {psychScore
                  ? psychScore >= 75 ? "🟢 Trading mindset is strong"
                  : psychScore >= 50 ? "🟡 Be cautious today"
                  : "🔴 Consider taking a break"
                  : "Complete your daily check-in"}
              </p>
              {!checkedInToday ? (
                <a href="/psychology" className="border border-[#00D4FF] text-[#00D4FF] font-semibold px-5 py-2 rounded-full text-xs hover:bg-[#00D4FF] hover:text-[#0D1117] transition-colors">
                  Daily Check-In
                </a>
              ) : (
                <div className="bg-[#00FF8820] border border-[#00FF88] text-[#00FF88] text-xs font-bold px-4 py-2 rounded-full">
                  ✓ Checked In Today
                </div>
              )}
            </div>
          </div>

        </div>

        {/* RISK CALCULATOR + WEEKLY RECAP */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">

          {/* RISK CALCULATOR */}
          <div className="bg-[#161B22] border border-[#30363D] rounded-2xl p-6">
            <h2 className="text-white font-bold text-lg mb-4">⚡ Risk Calculator</h2>
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-[#8B949E] text-xs mb-1 block">Account Balance ($)</label>
                <input
                  type="number"
                  placeholder="e.g. 1000"
                  value={riskBalance}
                  onChange={(e) => setRiskBalance(e.target.value)}
                  className="w-full bg-[#0D1117] border border-[#30363D] text-white placeholder-[#8B949E] rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-[#00D4FF]"
                />
              </div>
              <div>
                <label className="text-[#8B949E] text-xs mb-1 block">Risk Percentage (%)</label>
                <input
                  type="number"
                  placeholder="e.g. 1"
                  value={riskPercent}
                  onChange={(e) => setRiskPercent(e.target.value)}
                  className="w-full bg-[#0D1117] border border-[#30363D] text-white placeholder-[#8B949E] rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-[#00D4FF]"
                />
              </div>
              <div>
                <label className="text-[#8B949E] text-xs mb-1 block">Stop Loss (pips)</label>
                <input
                  type="number"
                  placeholder="e.g. 20"
                  value={stopLossPips}
                  onChange={(e) => setStopLossPips(e.target.value)}
                  className="w-full bg-[#0D1117] border border-[#30363D] text-white placeholder-[#8B949E] rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-[#00D4FF]"
                />
              </div>
              <div>
                <label className="text-[#8B949E] text-xs mb-1 block">Pip Value ($) — standard lot</label>
                <select
                  value={pipValue}
                  onChange={(e) => setPipValue(e.target.value)}
                  className="w-full bg-[#0D1117] border border-[#30363D] text-white rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-[#00D4FF]"
                >
                  <option value="10">$10 — Major pairs (EURUSD etc)</option>
                  <option value="9">$9 — GBPUSD</option>
                  <option value="1">$1 — XAUUSD (Gold)</option>
                  <option value="7">$7 — USDJPY</option>
                </select>
              </div>
              <button
                onClick={calculateLotSize}
                className="bg-[#00D4FF] text-[#0D1117] font-bold py-2 rounded-full text-sm hover:bg-[#00b8d9] transition-colors"
              >
                Calculate Lot Size
              </button>
              {lotSize && (
                <div className="bg-[#0D1117] border border-[#00D4FF] rounded-xl p-4 text-center">
                  <p className="text-[#8B949E] text-xs mb-1">Recommended Lot Size</p>
                  <p className="text-[#00D4FF] font-bold text-2xl">{lotSize}</p>
                  <p className="text-[#8B949E] text-xs mt-1">
                    Risk: ${((parseFloat(riskBalance) * parseFloat(riskPercent)) / 100).toFixed(2)}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* WEEKLY RECAP */}
          <div className="bg-[#161B22] border border-[#30363D] rounded-2xl p-6">
            <h2 className="text-white font-bold text-lg mb-4">📅 Weekly Recap</h2>
            {weeklyTrades.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="text-4xl mb-3">📅</div>
                <p className="text-[#8B949E] text-sm">No trades this week yet</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#0D1117] rounded-xl p-3 text-center">
                    <p className="text-[#8B949E] text-xs mb-1">Trades This Week</p>
                    <p className="text-white font-bold text-xl">{weeklyTrades.length}</p>
                  </div>
                  <div className="bg-[#0D1117] rounded-xl p-3 text-center">
                    <p className="text-[#8B949E] text-xs mb-1">Weekly PnL</p>
                    <p className="font-bold text-xl" style={{ color: parseFloat(weeklyPnL) >= 0 ? "#00FF88" : "#FF4757" }}>
                      {parseFloat(weeklyPnL) >= 0 ? "+" : ""}${weeklyPnL}
                    </p>
                  </div>
                </div>
                {bestTrade && (
                  <div className="bg-[#00FF8820] border border-[#00FF8840] rounded-xl p-3">
                    <p className="text-[#00FF88] text-xs font-bold mb-1">🏆 Best Trade</p>
                    <p className="text-white text-sm">{bestTrade.pair} {bestTrade.direction?.toUpperCase()}</p>
                    <p className="text-[#00FF88] font-bold">+${bestTrade.pnl}</p>
                  </div>
                )}
                {worstTrade && worstTrade.pnl < 0 && (
                  <div className="bg-[#FF475720] border border-[#FF475740] rounded-xl p-3">
                    <p className="text-[#FF4757] text-xs font-bold mb-1">⚠️ Worst Trade</p>
                    <p className="text-white text-sm">{worstTrade.pair} {worstTrade.direction?.toUpperCase()}</p>
                    <p className="text-[#FF4757] font-bold">${worstTrade.pnl}</p>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>

        {/* BOTTOM ROW */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          <div className="bg-[#161B22] border border-[#30363D] rounded-2xl p-6 text-center">
            <div className="text-4xl mb-2">🔥</div>
            <div className="text-white font-bold text-3xl mb-1">{checkins.length}</div>
            <div className="text-[#8B949E] text-sm">Total Check-ins</div>
            <p className="text-[#8B949E] text-xs mt-2">Keep checking in daily!</p>
          </div>

          <div className="bg-[#161B22] border border-[#30363D] rounded-2xl p-6">
            <h2 className="text-white font-bold text-lg mb-4">Prop Firms</h2>
            <div className="flex flex-col items-center justify-center py-4 text-center">
              <div className="text-3xl mb-2">🎯</div>
              <p className="text-[#8B949E] text-sm">Find the right prop firm</p>
              <a href="/prop-firms" className="mt-3 border border-[#FFD700] text-[#FFD700] text-xs font-semibold px-4 py-2 rounded-full hover:bg-[#FFD700] hover:text-[#0D1117] transition-colors">
                View Prop Firms
              </a>
            </div>
          </div>

          <div className="bg-[#161B22] border border-[#30363D] rounded-2xl p-6">
            <h2 className="text-white font-bold text-lg mb-4">Quick Links</h2>
            <div className="flex flex-col gap-3">
              <a href="/journal" className="text-[#8B949E] hover:text-[#00D4FF] text-sm transition-colors">📓 Trading Journal</a>
              <a href="/ai-analyzer" className="text-[#8B949E] hover:text-[#00D4FF] text-sm transition-colors">🤖 AI Analyzer</a>
              <a href="/community" className="text-[#8B949E] hover:text-[#00D4FF] text-sm transition-colors">👥 Community</a>
              <a href="/leaderboard" className="text-[#8B949E] hover:text-[#00D4FF] text-sm transition-colors">🏆 Leaderboard</a>
              <a href="/psychology" className="text-[#8B949E] hover:text-[#00D4FF] text-sm transition-colors">🧠 Psychology</a>
              <a href="/search" className="text-[#8B949E] hover:text-[#00D4FF] text-sm transition-colors">🔍 Search Traders</a>
              <a href={"/profile/" + username} className="text-[#8B949E] hover:text-[#00D4FF] text-sm transition-colors">👤 My Profile</a>
            </div>
          </div>

        </div>
      </div>

      <MobileNav username={username} />
    </main>
  );
}
