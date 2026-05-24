"use client";

import MobileNav from "../components/MobileNav";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";

export default function AIAnalyzer() {
  const [user, setUser] = useState(null);
  const [trades, setTrades] = useState([]);
  const [selectedTrade, setSelectedTrade] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
      } else {
        setUser(user);
        fetchTrades(user.id);
      }
    };
    getUser();
  }, []);

  const fetchTrades = async (userId) => {
    const { data } = await supabase
      .from("trades")
      .select("*")
      .eq("user_id", userId)
      .order("traded_at", { ascending: false });
    if (data) setTrades(data);
  };

  const handleAnalyze = async () => {
    if (!selectedTrade) return;
    setLoading(true);
    setError("");
    setAnalysis(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trade: selectedTrade }),
      });
      const data = await response.json();
      if (data.success) {
        setAnalysis(data.analysis);
      } else {
        setError("Analysis failed. Please try again.");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    }
    setLoading(false);
  };

  const getScoreColor = (score) => {
    if (score >= 75) return "#00FF88";
    if (score >= 50) return "#FFD700";
    return "#FF4757";
  };

  const getScoreLabel = (score) => {
    if (score >= 75) return "Strong Trade";
    if (score >= 50) return "Average Trade";
    return "Weak Trade";
  };

  const getRatingColor = (rating) => {
    if (rating?.startsWith("Good")) return "#00FF88";
    if (rating?.startsWith("Average")) return "#FFD700";
    return "#FF4757";
  };

  if (!user) return (
    <main className="bg-[#0D1117] min-h-screen flex items-center justify-center">
      <p className="text-[#8B949E]">Loading...</p>
    </main>
  );

  return (
    <main className="bg-[#0D1117] min-h-screen">

      {/* NAVBAR */}
      <nav className="bg-[#161B22] border-b border-[#30363D] px-6 py-4 flex items-center justify-between">
        <a href="/dashboard" className="text-[#00D4FF] font-bold text-xl">MatrixVerse</a>
        <div className="flex items-center gap-4">
          <a href="/dashboard" className="text-[#8B949E] hover:text-white text-sm">Dashboard</a>
          <a href="/journal" className="text-[#8B949E] hover:text-white text-sm">Journal</a>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-10 pb-20">

        {/* HEADER */}
        <div className="mb-8">
          <h1 className="text-white font-bold text-3xl mb-1">AI Trade Analyzer</h1>
          <p className="text-[#8B949E] text-sm">Select a trade and get instant AI feedback</p>
        </div>

        {/* SELECT TRADE */}
        <div className="bg-[#161B22] border border-[#30363D] rounded-2xl p-6 mb-6">
          <h2 className="text-white font-bold text-lg mb-4">Select a Trade to Analyze</h2>

          {trades.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-[#8B949E] text-sm mb-3">No trades found. Log some trades first.</p>
              <a href="/journal" className="bg-[#00D4FF] text-[#0D1117] font-bold px-5 py-2 rounded-full text-xs hover:bg-[#00b8d9] transition-colors">
                Go to Journal
              </a>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {trades.map((trade, index) => (
                <div
                  key={index}
                  onClick={() => setSelectedTrade(trade)}
                  className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-colors ${
                    selectedTrade?.id === trade.id
                      ? "border-[#00D4FF] bg-[#00D4FF10]"
                      : "border-[#30363D] hover:border-[#00D4FF] bg-[#0D1117]"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-[#00D4FF] font-bold">{trade.pair}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${trade.direction === "buy" ? "bg-[#00FF8820] text-[#00FF88]" : "bg-[#FF475720] text-[#FF4757]"}`}>
                      {trade.direction?.toUpperCase()}
                    </span>
                    <span className="text-[#8B949E] text-xs">{trade.strategy || "No strategy"}</span>
                    <span className="text-[#8B949E] text-xs">{new Date(trade.traded_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[#FFD700] text-sm">{trade.rr_ratio ? `${trade.rr_ratio}R` : "-"}</span>
                    <span className="font-bold text-sm" style={{ color: trade.pnl >= 0 ? "#00FF88" : "#FF4757" }}>
                      {trade.pnl >= 0 ? "+" : ""}${trade.pnl}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {selectedTrade && (
            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="mt-6 w-full bg-[#7C3AED] text-white font-bold py-4 rounded-full text-sm hover:bg-[#6d28d9] transition-colors disabled:opacity-50"
            >
              {loading ? "🤖 Analyzing your trade..." : "🤖 Analyze This Trade with AI"}
            </button>
          )}

          {error && (
            <div className="mt-4 bg-[#FF475720] border border-[#FF4757] text-[#FF4757] text-sm px-4 py-3 rounded-xl">
              {error}
            </div>
          )}
        </div>

        {/* ANALYSIS RESULTS */}
        {analysis && (
          <div className="flex flex-col gap-6">

            {/* SCORE */}
            <div className="bg-[#161B22] border border-[#30363D] rounded-2xl p-6 flex flex-col items-center text-center">
              <p className="text-[#8B949E] text-sm mb-4">Trade Score</p>
              <div
                className="w-32 h-32 rounded-full border-4 flex flex-col items-center justify-center mb-4"
                style={{ borderColor: getScoreColor(analysis.score) }}
              >
                <span className="font-bold text-4xl" style={{ color: getScoreColor(analysis.score) }}>
                  {analysis.score}
                </span>
                <span className="text-xs" style={{ color: getScoreColor(analysis.score) }}>/100</span>
              </div>
              <div className="font-bold text-lg" style={{ color: getScoreColor(analysis.score) }}>
                {getScoreLabel(analysis.score)}
              </div>
              <p className="text-[#C9D1D9] text-sm mt-3 max-w-lg">{analysis.summary}</p>
            </div>

            {/* RATINGS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { label: "Entry Quality", value: analysis.entry_quality },
                { label: "RR Assessment", value: analysis.rr_assessment },
                { label: "Risk Management", value: analysis.risk_management },
              ].map((item, index) => (
                <div key={index} className="bg-[#161B22] border border-[#30363D] rounded-2xl p-5">
                  <p className="text-[#8B949E] text-xs mb-2">{item.label}</p>
                  <p className="text-sm font-semibold" style={{ color: getRatingColor(item.value) }}>
                    {item.value}
                  </p>
                </div>
              ))}
            </div>

            {/* FLAGS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#161B22] border border-[#30363D] rounded-2xl p-5">
                <p className="text-[#8B949E] text-xs mb-2">⚠️ Emotional Flags</p>
                <p className="text-sm text-[#C9D1D9]">{analysis.emotional_flags}</p>
              </div>
              <div className="bg-[#161B22] border border-[#30363D] rounded-2xl p-5">
                <p className="text-[#8B949E] text-xs mb-2">🔍 Pattern Detected</p>
                <p className="text-sm text-[#C9D1D9]">{analysis.pattern_detected}</p>
              </div>
            </div>

            {/* SUGGESTIONS */}
            <div className="bg-[#161B22] border border-[#30363D] rounded-2xl p-6">
              <p className="text-white font-bold mb-4">💡 AI Suggestions</p>
              <div className="flex flex-col gap-3">
                {analysis.suggestions.map((s, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-[#0D1117] rounded-xl">
                    <span className="text-[#00D4FF] font-bold text-sm flex-shrink-0">{index + 1}.</span>
                    <p className="text-[#C9D1D9] text-sm">{s}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}
      </div>
<MobileNav username={user?.user_metadata?.username || user?.email} />
    </main>
  );
}
