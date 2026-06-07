"use client";

import MobileNav from "../components/MobileNav";
import ThemeToggle from "../components/ThemeToggle"
import { Skeleton, SkeletonCard } from "../components/Skeleton"
import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";

export default function AIAnalyzerClient() {
  const [user, setUser] = useState(null);
  const [trades, setTrades] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [selectedTrade, setSelectedTrade] = useState(null);
  const [singleAnalysis, setSingleAnalysis] = useState(null);
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [weekly, setWeekly] = useState(null);
  const [weeklyLoading, setWeeklyLoading] = useState(false);
  const [error, setError] = useState("");
  const chatEnd = useRef(null);
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return }
      setUser(user);

      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token;

      let allTrades = [];
      const { data: localTrades } = await supabase
        .from("trades").select("*").eq("user_id", user.id).order("traded_at", { ascending: false });
      if (localTrades) allTrades = localTrades;

      if (token && allTrades.length === 0) {
        const res = await fetch("/api/trades/user?user_id=" + user.id, {
          headers: { Authorization: "Bearer " + token }
        });
        const data = await res.json();
        if (data.trades) allTrades = data.trades;
      }

      setTrades(allTrades);
      setLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    chatEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  const runAnalysis = async () => {
    if (trades.length === 0) return;
    setAnalyzing(true);
    setError("");
    try {
      const res = await fetch("/api/ai-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "analyze", trades }),
      });
      const data = await res.json();
      if (data.success) setAnalysis(data.analysis);
      else setError("Analysis failed");
    } catch (e) {
      setError("Something went wrong");
    }
    setAnalyzing(false);
  };

  const runWeekly = async () => {
    if (trades.length === 0) return;
    setWeeklyLoading(true);
    try {
      const res = await fetch("/api/ai-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "weekly", trades }),
      });
      const data = await res.json();
      if (data.success) setWeekly(data);
      else setError("Weekly report failed");
    } catch (e) {
      setError("Something went wrong");
    }
    setWeeklyLoading(false);
  };

  const sendChat = async () => {
    if (!chatMessage.trim() || trades.length === 0) return;
    const msg = chatMessage;
    setChatMessage("");
    setChatHistory(prev => [...prev, { role: "user", text: msg }]);
    setChatLoading(true);
    try {
      const res = await fetch("/api/ai-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "chat", trades, query: msg }),
      });
      const data = await res.json();
      if (data.success) {
        setChatHistory(prev => [...prev, { role: "coach", text: data.answer, focus: data.suggested_focus }]);
      } else {
        setChatHistory(prev => [...prev, { role: "coach", text: "Sorry, I couldn't process that. Try asking differently." }]);
      }
    } catch (e) {
      setChatHistory(prev => [...prev, { role: "coach", text: "Something went wrong. Please try again." }]);
    }
    setChatLoading(false);
  };

  const handleAnalyzeSingle = async () => {
    if (!selectedTrade) return;
    setAnalyzing(true);
    setError("");
    setSingleAnalysis(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trade: selectedTrade }),
      });
      const data = await res.json();
      if (data.success) setSingleAnalysis(data.analysis);
      else setError("Analysis failed");
    } catch (e) {
      setError("Something went wrong");
    }
    setAnalyzing(false);
  };

  const getScoreColor = s => s >= 75 ? "#00FF88" : s >= 50 ? "#FFD700" : "#FF4757";
  const getRatingColor = r => r?.startsWith("Good") ? "#00FF88" : r?.startsWith("Average") ? "#FFD700" : "#FF4757";

  if (!user) return (
    <main className="bg-[var(--bg-primary)] min-h-screen flex items-center justify-center">
      <div className="w-full max-w-4xl px-6 space-y-6"><SkeletonCard /><SkeletonCard /></div>
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
          <a href="/education" className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-sm">Learn</a>
        </div>
        <div className="md:hidden"><ThemeToggle /></div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-10 pb-24">
        <div className="mb-6">
          <h1 className="text-[var(--text-primary)] font-bold text-3xl mb-1">AI Coach</h1>
          <p className="text-[var(--text-muted)] text-sm">Your personal trading coach powered by AI</p>
        </div>

        {loading ? (
          <div className="space-y-6"><SkeletonCard /><SkeletonCard /></div>
        ) : trades.length === 0 ? (
          <div className="text-center py-20 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl">
            <div className="text-5xl mb-4">🤖</div>
            <p className="text-[var(--text-muted)] text-sm mb-4">Log some trades first to get AI coaching</p>
            <a href="/journal" className="bg-[var(--accent-blue)] text-[var(--bg-primary)] font-bold px-5 py-2 rounded-full text-xs">Go to Journal</a>
          </div>
        ) : (
          <>
            {/* TABS */}
            <div className="flex gap-2 mb-6 flex-wrap">
              {[
                { key: "overview", label: "📊 Overview" },
                { key: "chat", label: "💬 Chat" },
                { key: "weekly", label: "📅 Weekly" },
                { key: "analyze", label: "🔍 Single Trade" },
              ].map(tab => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                    activeTab === tab.key
                      ? "bg-[var(--accent-blue)] text-[var(--bg-primary)]"
                      : "border border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--accent-blue)] hover:text-[var(--accent-blue)]"
                  }`}>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* OVERVIEW TAB */}
            {activeTab === "overview" && (
              <div className="flex flex-col gap-6">
                {!analysis && !analyzing && (
                  <button onClick={runAnalysis}
                    className="w-full bg-[var(--accent-purple)] text-[var(--text-primary)] font-bold py-4 rounded-full text-sm hover:opacity-90 transition-colors">
                    🤖 Analyze My Trading
                  </button>
                )}
                {analyzing && (
                  <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-8 text-center">
                    <div className="w-10 h-10 border-2 border-[var(--accent-blue)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-[var(--text-muted)] text-sm">AI is analyzing your trades...</p>
                  </div>
                )}
                {analysis && (
                  <>
                    {/* OVERALL SCORE */}
                    <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-6 flex flex-col items-center text-center">
                      <p className="text-[var(--text-muted)] text-xs mb-3">Overall Trading Score</p>
                      <div className="w-28 h-28 rounded-full border-4 flex flex-col items-center justify-center mb-3"
                        style={{ borderColor: getScoreColor(analysis.score) }}>
                        <span className="font-bold text-3xl" style={{ color: getScoreColor(analysis.score) }}>{analysis.score}</span>
                        <span className="text-[10px]" style={{ color: getScoreColor(analysis.score) }}>/100</span>
                      </div>
                      <p className="text-[var(--text-secondary)] text-sm max-w-lg">{analysis.summary}</p>
                    </div>

                    {/* KEY STATS */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { label: "Win Rate", value: analysis.win_rate + "%", color: analysis.win_rate >= 50 ? "#00FF88" : "#FF4757" },
                        { label: "Net P&L", value: "$" + analysis.net_pnl, color: analysis.net_pnl >= 0 ? "#00FF88" : "#FF4757" },
                        { label: "Avg RR", value: analysis.avg_rr + "R", color: "#FFD700" },
                        { label: "Best Streak", value: analysis.streak_best, color: "#00D4FF" },
                      ].map((s, i) => (
                        <div key={i} className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl p-4 text-center">
                          <div className="font-bold text-lg" style={{ color: s.color }}>{s.value}</div>
                          <div className="text-[var(--text-muted)] text-xs">{s.label}</div>
                        </div>
                      ))}
                    </div>

                    {/* STRENGTHS & WEAKNESSES */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-5">
                        <p className="text-[var(--accent-green)] font-bold text-sm mb-2">✅ Biggest Strength</p>
                        <p className="text-[var(--text-secondary)] text-sm">{analysis.biggest_strength}</p>
                      </div>
                      <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-5">
                        <p className="text-[var(--accent-red)] font-bold text-sm mb-2">⚠️ Biggest Weakness</p>
                        <p className="text-[var(--text-secondary)] text-sm">{analysis.biggest_weakness}</p>
                      </div>
                    </div>

                    {/* FLAGS */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {analysis.revenge_trading_detected && (
                        <div className="bg-[var(--accent-red-bg)] border border-[var(--accent-red)] rounded-2xl p-5">
                          <p className="text-[var(--accent-red)] font-bold text-sm mb-2">🚨 Revenge Trading Detected</p>
                          <p className="text-[var(--text-secondary)] text-xs">You tend to take extra trades after losses. Try stepping away after a red trade.</p>
                        </div>
                      )}
                      {analysis.overtrading_detected && (
                        <div className="bg-[var(--accent-red-bg)] border border-[var(--accent-red)] rounded-2xl p-5">
                          <p className="text-[var(--accent-red)] font-bold text-sm mb-2">⚠️ Overtrading Detected</p>
                          <p className="text-[var(--text-secondary)] text-xs">You're taking too many trades. Focus on quality over quantity.</p>
                        </div>
                      )}
                      {!analysis.revenge_trading_detected && !analysis.overtrading_detected && (
                        <div className="bg-[var(--accent-green-bg)] border border-[var(--accent-green)] rounded-2xl p-5">
                          <p className="text-[var(--accent-green)] font-bold text-sm mb-2">✅ No Major Red Flags</p>
                          <p className="text-[var(--text-secondary)] text-xs">Your trading discipline looks solid. Keep it up!</p>
                        </div>
                      )}
                      <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-5">
                        <p className="text-[var(--text-muted)] font-bold text-sm mb-2">🧠 Emotional Patterns</p>
                        <p className="text-[var(--text-secondary)] text-sm">{analysis.emotional_patterns}</p>
                      </div>
                    </div>

                    {/* BEST/WORST PAIRS */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-5">
                        <p className="text-[var(--accent-green)] font-bold text-sm mb-2">🏆 Best Pair</p>
                        <p className="text-[var(--accent-blue)] font-bold text-lg">{analysis.best_pair}</p>
                      </div>
                      <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-5">
                        <p className="text-[var(--accent-red)] font-bold text-sm mb-2">💀 Worst Pair</p>
                        <p className="text-[var(--accent-red)] font-bold text-lg">{analysis.worst_pair}</p>
                      </div>
                    </div>

                    {/* IMPROVEMENT TIP */}
                    <div className="bg-[var(--accent-blue-bg)] border border-[var(--accent-blue)] rounded-2xl p-5">
                      <p className="text-[var(--accent-blue)] font-bold text-sm mb-2">💡 Improvement Tip</p>
                      <p className="text-[var(--text-secondary)] text-sm">{analysis.improvement_tip}</p>
                    </div>

                    <button onClick={() => { setAnalysis(null); runAnalysis(); }}
                      className="text-[var(--accent-blue)] text-xs font-semibold hover:underline self-center">
                      🔄 Refresh Analysis
                    </button>
                  </>
                )}
              </div>
            )}

            {/* CHAT TAB */}
            {activeTab === "chat" && (
              <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl overflow-hidden">
                <div className="p-4 max-h-96 overflow-y-auto flex flex-col gap-3">
                  {chatHistory.length === 0 && (
                    <div className="text-center py-10">
                      <p className="text-[var(--text-muted)] text-sm">Ask me anything about your trading</p>
                      <div className="flex flex-wrap gap-2 mt-4 justify-center">
                        {["How can I improve my win rate?", "What's my biggest weakness?", "Am I overtrading?", "Which pair should I focus on?"]
                          .map((q, i) => (
                            <button key={i} onClick={() => { setChatMessage(q); }}
                              className="text-xs border border-[var(--border)] text-[var(--text-muted)] px-3 py-1.5 rounded-full hover:border-[var(--accent-blue)] hover:text-[var(--accent-blue)] transition-colors">
                              {q}
                            </button>
                          ))}
                      </div>
                    </div>
                  )}
                  {chatHistory.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                        msg.role === "user"
                          ? "bg-[var(--accent-blue)] text-[var(--bg-primary)]"
                          : "bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-secondary)]"
                      }`}>
                        {msg.text}
                        {msg.focus && (
                          <div className="mt-2 pt-2 border-t border-[var(--border)] text-[var(--accent-blue)] text-xs">
                            🎯 Focus: {msg.focus}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="flex justify-start">
                      <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-2xl px-4 py-3">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-[var(--text-muted)] rounded-full animate-bounce" />
                          <div className="w-2 h-2 bg-[var(--text-muted)] rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                          <div className="w-2 h-2 bg-[var(--text-muted)] rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={chatEnd} />
                </div>
                <div className="border-t border-[var(--border)] p-3 flex gap-2">
                  <input value={chatMessage} onChange={e => setChatMessage(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && sendChat()}
                    placeholder="Ask your AI coach anything..."
                    className="flex-1 bg-[var(--bg-primary)] border border-[var(--border)] rounded-full px-4 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-blue)]"
                  />
                  <button onClick={sendChat} disabled={chatLoading || !chatMessage.trim()}
                    className="bg-[var(--accent-blue)] text-[var(--bg-primary)] px-4 py-2 rounded-full text-sm font-bold disabled:opacity-50 hover:opacity-90 transition-colors">
                    Send
                  </button>
                </div>
              </div>
            )}

            {/* WEEKLY TAB */}
            {activeTab === "weekly" && (
              <div className="flex flex-col gap-4">
                {!weekly && !weeklyLoading && (
                  <button onClick={runWeekly}
                    className="w-full bg-[var(--accent-purple)] text-[var(--text-primary)] font-bold py-4 rounded-full text-sm hover:opacity-90 transition-colors">
                    📅 Generate Weekly Report
                  </button>
                )}
                {weeklyLoading && (
                  <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-8 text-center">
                    <div className="w-10 h-10 border-2 border-[var(--accent-blue)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-[var(--text-muted)] text-sm">Generating your weekly report...</p>
                  </div>
                )}
                {weekly && (
                  <>
                    <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-6">
                      <h2 className="text-[var(--text-primary)] font-bold text-lg mb-4">📅 This Week's Report</h2>
                      <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="text-center">
                          <div className="font-bold text-xl text-[var(--accent-blue)]">{weekly.week_trades}</div>
                          <div className="text-[var(--text-muted)] text-xs">Trades</div>
                        </div>
                        <div className="text-center">
                          <div className="font-bold text-xl" style={{ color: weekly.week_pnl >= 0 ? "#00FF88" : "#FF4757" }}>${weekly.week_pnl}</div>
                          <div className="text-[var(--text-muted)] text-xs">P&L</div>
                        </div>
                        <div className="text-center">
                          <div className="font-bold text-xl" style={{ color: weekly.week_win_rate >= 50 ? "#00FF88" : "#FF4757" }}>{weekly.week_win_rate}%</div>
                          <div className="text-[var(--text-muted)] text-xs">Win Rate</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                        <div className="bg-[var(--accent-green-bg)] border border-[var(--accent-green)] rounded-xl px-4 py-3">
                          <p className="text-[var(--accent-green)] text-xs font-bold mb-1">🏆 Best Trade</p>
                          <p className="text-[var(--text-secondary)] text-sm">{weekly.best_trade}</p>
                        </div>
                        <div className="bg-[var(--accent-red-bg)] border border-[var(--accent-red)] rounded-xl px-4 py-3">
                          <p className="text-[var(--accent-red)] text-xs font-bold mb-1">💀 Worst Trade</p>
                          <p className="text-[var(--text-secondary)] text-sm">{weekly.worst_trade}</p>
                        </div>
                      </div>
                      <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl p-4 mb-4">
                        <p className="text-[var(--text-secondary)] text-sm">{weekly.verdict}</p>
                      </div>
                      <div className="bg-[var(--accent-blue-bg)] border border-[var(--accent-blue)] rounded-xl p-4 mb-4">
                        <p className="text-[var(--accent-blue)] text-xs font-bold mb-1">🎯 Next Week Focus</p>
                        <p className="text-[var(--text-secondary)] text-sm">{weekly.focus_next_week}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[var(--text-muted)] text-sm italic">"{weekly.encouragement}"</p>
                      </div>
                    </div>
                    <button onClick={() => { setWeekly(null); runWeekly(); }}
                      className="text-[var(--accent-blue)] text-xs font-semibold hover:underline self-center">
                      🔄 Refresh Report
                    </button>
                  </>
                )}
              </div>
            )}

            {/* SINGLE TRADE ANALYSIS TAB */}
            {activeTab === "analyze" && (
              <div className="flex flex-col gap-6">
                <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-6">
                  <h2 className="text-[var(--text-primary)] font-bold text-lg mb-4">Select a Trade</h2>
                  <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
                    {trades.map((trade, i) => (
                      <div key={i} onClick={() => setSelectedTrade(trade)}
                        className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${
                          selectedTrade?.id === trade.id
                            ? "border-[var(--accent-blue)] bg-[var(--accent-blue-bg)]"
                            : "border-[var(--border)] hover:border-[var(--accent-blue)] bg-[var(--bg-primary)]"
                        }`}>
                        <div className="flex items-center gap-3">
                          <span className="text-[var(--accent-blue)] font-bold text-sm">{trade.pair}</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${trade.direction === "buy" ? "bg-[var(--accent-green-bg)] text-[var(--accent-green)]" : "bg-[var(--accent-red-bg)] text-[var(--accent-red)]"}`}>
                            {trade.direction?.toUpperCase()}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[var(--accent-gold)] text-xs">{trade.rr_ratio ? `${trade.rr_ratio}R` : "-"}</span>
                          <span className="font-bold text-xs" style={{ color: trade.pnl >= 0 ? "#00FF88" : "#FF4757" }}>
                            {trade.pnl >= 0 ? "+" : ""}${trade.pnl}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  {selectedTrade && (
                    <button onClick={handleAnalyzeSingle} disabled={analyzing}
                      className="mt-4 w-full bg-[var(--accent-purple)] text-[var(--text-primary)] font-bold py-3 rounded-full text-sm disabled:opacity-50 hover:opacity-90 transition-colors">
                      {analyzing ? "🤖 Analyzing..." : "🤖 Analyze This Trade"}
                    </button>
                  )}
                </div>

                {error && (
                  <div className="bg-[var(--accent-red-bg)] border border-[var(--accent-red)] text-[var(--accent-red)] text-sm px-4 py-3 rounded-xl">{error}</div>
                )}

                {singleAnalysis && (
                  <div className="flex flex-col gap-4">
                    <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-6 flex flex-col items-center text-center">
                      <p className="text-[var(--text-muted)] text-xs mb-3">Trade Score</p>
                      <div className="w-24 h-24 rounded-full border-4 flex flex-col items-center justify-center mb-3"
                        style={{ borderColor: getScoreColor(singleAnalysis.score) }}>
                        <span className="font-bold text-2xl" style={{ color: getScoreColor(singleAnalysis.score) }}>{singleAnalysis.score}</span>
                        <span className="text-[10px]" style={{ color: getScoreColor(singleAnalysis.score) }}>/100</span>
                      </div>
                      <p className="text-[var(--text-secondary)] text-sm max-w-lg">{singleAnalysis.summary}</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {[
                        { label: "Entry Quality", value: singleAnalysis.entry_quality },
                        { label: "RR Assessment", value: singleAnalysis.rr_assessment },
                        { label: "Risk Management", value: singleAnalysis.risk_management },
                      ].map((item, i) => (
                        <div key={i} className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl p-4">
                          <p className="text-[var(--text-muted)] text-xs mb-1">{item.label}</p>
                          <p className="text-sm font-semibold" style={{ color: getRatingColor(item.value) }}>{item.value}</p>
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl p-4">
                        <p className="text-[var(--text-muted)] text-xs mb-1">⚠️ Emotional Flags</p>
                        <p className="text-sm text-[var(--text-secondary)]">{singleAnalysis.emotional_flags}</p>
                      </div>
                      <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl p-4">
                        <p className="text-[var(--text-muted)] text-xs mb-1">🔍 Pattern</p>
                        <p className="text-sm text-[var(--text-secondary)]">{singleAnalysis.pattern_detected}</p>
                      </div>
                    </div>
                    <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-5">
                      <p className="text-[var(--text-primary)] font-bold mb-3">💡 Suggestions</p>
                      <div className="flex flex-col gap-2">
                        {singleAnalysis.suggestions.map((s, i) => (
                          <div key={i} className="flex items-start gap-2 p-3 bg-[var(--bg-primary)] rounded-xl">
                            <span className="text-[var(--accent-blue)] font-bold text-xs flex-shrink-0">{i + 1}.</span>
                            <p className="text-[var(--text-secondary)] text-sm">{s}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
      <MobileNav username={user?.user_metadata?.username || user?.email} />
    </main>
  );
}
