"use client";

import MobileNav from "../components/MobileNav";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";

export const metadata = {
  title: "Psychology Tracker",
  description: "Track your trading emotions daily. Detect revenge trading, fear and greed patterns.",
};

export default function Psychology() {
  const [user, setUser] = useState(null);
  const [checkins, setCheckins] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alreadyCheckedIn, setAlreadyCheckedIn] = useState(false);
  const [form, setForm] = useState({
    mood: "",
    intention: "",
    sleep_quality: "",
    notes: "",
  });
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
      } else {
        setUser(user);
        fetchCheckins(user.id);
      }
    };
    getUser();
  }, []);

  const fetchCheckins = async (userId) => {
    const { data } = await supabase
      .from("checkins")
      .select("*")
      .eq("user_id", userId)
      .order("checked_in_at", { ascending: false });
    if (data) {
      setCheckins(data);
      // Check if already checked in today
      const today = new Date().toDateString();
      const todayCheckin = data.find(c =>
        new Date(c.checked_in_at).toDateString() === today
      );
      if (todayCheckin) setAlreadyCheckedIn(true);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.from("checkins").insert([{
      user_id: user.id,
      mood: form.mood,
      intention: form.intention,
      sleep_quality: form.sleep_quality,
      notes: form.notes,
      checked_in_at: new Date().toISOString(),
    }]);

    if (!error) {
      setShowModal(false);
      setAlreadyCheckedIn(true);
      fetchCheckins(user.id);
      setForm({ mood: "", intention: "", sleep_quality: "", notes: "" });
    }
    setLoading(false);
  };

  const getMoodEmoji = (mood) => {
    const map = {
      "Excellent": "🤩",
      "Good": "😊",
      "Neutral": "😐",
      "Anxious": "😰",
      "Stressed": "😤",
      "Bad": "😞",
    };
    return map[mood] || "😐";
  };

  const getMoodColor = (mood) => {
    const map = {
      "Excellent": "#00FF88",
      "Good": "#00D4FF",
      "Neutral": "#FFD700",
      "Anxious": "#FF6B35",
      "Stressed": "#FF4757",
      "Bad": "#FF4757",
    };
    return map[mood] || "#8B949E";
  };

  const getSleepColor = (sleep) => {
    const map = {
      "Great (8+ hrs)": "#00FF88",
      "Good (6-8 hrs)": "#00D4FF",
      "Poor (4-6 hrs)": "#FFD700",
      "Bad (under 4 hrs)": "#FF4757",
    };
    return map[sleep] || "#8B949E";
  };

  // Calculate psychology score
  const calculateScore = () => {
    if (checkins.length === 0) return 0;
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

  const score = calculateScore();
  const scoreColor = score >= 75 ? "#00FF88" : score >= 50 ? "#FFD700" : "#FF4757";

  const inputClass = "w-full bg-[#0D1117] border border-[#30363D] text-white placeholder-[#8B949E] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#00D4FF] transition-colors";
  const labelClass = "text-[#8B949E] text-xs mb-2 block";

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
          <a href="/community" className="text-[#8B949E] hover:text-white text-sm">Community</a>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-10 pb-20">

        {/* HEADER */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-white font-bold text-3xl mb-1">Psychology Tracker</h1>
            <p className="text-[#8B949E] text-sm">Track your mental state and trade better</p>
          </div>
          {!alreadyCheckedIn ? (
            <button
              onClick={() => setShowModal(true)}
              className="bg-[#00D4FF] text-[#0D1117] font-bold px-6 py-3 rounded-full text-sm hover:bg-[#00b8d9] transition-colors"
            >
              Daily Check-In
            </button>
          ) : (
            <div className="bg-[#00FF8820] border border-[#00FF88] text-[#00FF88] text-sm font-bold px-5 py-2 rounded-full">
              ✓ Checked In Today
            </div>
          )}
        </div>

        {/* TOP ROW */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

          {/* PSYCHOLOGY SCORE */}
          <div className="bg-[#161B22] border border-[#30363D] rounded-2xl p-6 flex flex-col items-center justify-center text-center">
            <p className="text-[#8B949E] text-xs mb-4">Psychology Score (Last 7 days)</p>
            <div
              className="w-28 h-28 rounded-full border-4 flex items-center justify-center mb-3"
              style={{ borderColor: scoreColor }}
            >
              <span className="font-bold text-3xl" style={{ color: scoreColor }}>
                {score}
              </span>
            </div>
            <p className="text-[#8B949E] text-xs">
              {score >= 75 ? "🟢 Trading mindset is strong" : score >= 50 ? "🟡 Be cautious today" : "🔴 Consider taking a break"}
            </p>
          </div>

          {/* STREAK */}
          <div className="bg-[#161B22] border border-[#30363D] rounded-2xl p-6 flex flex-col items-center justify-center text-center">
            <p className="text-[#8B949E] text-xs mb-4">Check-In Streak</p>
            <div className="text-5xl mb-2">🔥</div>
            <div className="text-white font-bold text-3xl mb-1">{checkins.length}</div>
            <p className="text-[#8B949E] text-xs">Total check-ins logged</p>
          </div>

          {/* LAST MOOD */}
          <div className="bg-[#161B22] border border-[#30363D] rounded-2xl p-6 flex flex-col items-center justify-center text-center">
            <p className="text-[#8B949E] text-xs mb-4">Last Recorded Mood</p>
            {checkins.length > 0 ? (
              <>
                <div className="text-5xl mb-2">{getMoodEmoji(checkins[0].mood)}</div>
                <div className="font-bold text-xl mb-1" style={{ color: getMoodColor(checkins[0].mood) }}>
                  {checkins[0].mood}
                </div>
                <p className="text-[#8B949E] text-xs">
                  {new Date(checkins[0].checked_in_at).toLocaleDateString()}
                </p>
              </>
            ) : (
              <>
                <div className="text-5xl mb-2">😐</div>
                <p className="text-[#8B949E] text-xs">No check-ins yet</p>
              </>
            )}
          </div>

        </div>

        {/* MOOD TIPS */}
        <div className="bg-[#161B22] border border-[#30363D] rounded-2xl p-6 mb-8">
          <h2 className="text-white font-bold text-lg mb-4">🧠 Trading Psychology Tips</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { tip: "Never trade when you are angry or stressed. Your emotions will override your strategy.", color: "#FF4757" },
              { tip: "If you lose 2 trades in a row, step away from the charts for at least 30 minutes.", color: "#FFD700" },
              { tip: "A good night's sleep improves decision-making by up to 40%. Rest is part of your edge.", color: "#00FF88" },
              { tip: "Write down why you are taking a trade BEFORE you enter. This stops impulsive entries.", color: "#00D4FF" },
              { tip: "Revenge trading is the #1 account killer. Take the loss, close the platform, come back tomorrow.", color: "#FF6B35" },
              { tip: "Your best trades come when you are calm, prepared, and following your plan exactly.", color: "#7C3AED" },
            ].map((item, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-[#0D1117] rounded-xl">
                <div className="w-1 rounded-full flex-shrink-0 mt-1 h-full min-h-[40px]" style={{ backgroundColor: item.color }}></div>
                <p className="text-[#C9D1D9] text-sm leading-relaxed">{item.tip}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CHECK-IN HISTORY */}
        <div className="bg-[#161B22] border border-[#30363D] rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[#30363D]">
            <h2 className="text-white font-bold">Check-In History</h2>
          </div>
          {checkins.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="text-4xl mb-3">🧠</div>
              <p className="text-[#8B949E] text-sm">No check-ins yet</p>
              <button
                onClick={() => setShowModal(true)}
                className="mt-4 bg-[#00D4FF] text-[#0D1117] font-bold px-5 py-2 rounded-full text-xs hover:bg-[#00b8d9] transition-colors"
              >
                Do Your First Check-In
              </button>
            </div>
          ) : (
            <div className="divide-y divide-[#30363D]">
              {checkins.map((checkin, index) => (
                <div key={index} className="px-6 py-4 flex items-center justify-between hover:bg-[#1A2332] transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="text-2xl">{getMoodEmoji(checkin.mood)}</div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm" style={{ color: getMoodColor(checkin.mood) }}>
                          {checkin.mood}
                        </span>
                        <span className="text-[#30363D]">·</span>
                        <span className="text-[#8B949E] text-xs" style={{ color: getSleepColor(checkin.sleep_quality) }}>
                          Sleep: {checkin.sleep_quality}
                        </span>
                      </div>
                      {checkin.intention && (
                        <p className="text-[#8B949E] text-xs mt-0.5">"{checkin.intention}"</p>
                      )}
                    </div>
                  </div>
                  <div className="text-[#8B949E] text-xs">
                    {new Date(checkin.checked_in_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* CHECK-IN MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 px-4">
          <div className="bg-[#161B22] border border-[#30363D] rounded-2xl w-full max-w-md">

            <div className="flex items-center justify-between px-6 py-4 border-b border-[#30363D]">
              <h2 className="text-white font-bold text-lg">Daily Check-In</h2>
              <button onClick={() => setShowModal(false)} className="text-[#8B949E] hover:text-white text-xl">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-6 flex flex-col gap-5">

              {/* MOOD */}
              <div>
                <label className={labelClass}>How are you feeling today?</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "Excellent", emoji: "🤩" },
                    { label: "Good", emoji: "😊" },
                    { label: "Neutral", emoji: "😐" },
                    { label: "Anxious", emoji: "😰" },
                    { label: "Stressed", emoji: "😤" },
                    { label: "Bad", emoji: "😞" },
                  ].map((m) => (
                    <button
                      key={m.label}
                      type="button"
                      onClick={() => setForm({ ...form, mood: m.label })}
                      className={`flex flex-col items-center py-3 rounded-xl border text-xs font-semibold transition-colors ${
                        form.mood === m.label
                          ? "border-[#00D4FF] bg-[#00D4FF20] text-[#00D4FF]"
                          : "border-[#30363D] text-[#8B949E] hover:border-[#00D4FF]"
                      }`}
                    >
                      <span className="text-2xl mb-1">{m.emoji}</span>
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* SLEEP */}
              <div>
                <label className={labelClass}>How was your sleep?</label>
                <select name="sleep_quality" value={form.sleep_quality} onChange={handleChange} required className={inputClass}>
                  <option value="">Select sleep quality</option>
                  {["Great (8+ hrs)", "Good (6-8 hrs)", "Poor (4-6 hrs)", "Bad (under 4 hrs)"].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* INTENTION */}
              <div>
                <label className={labelClass}>Trading intention for today</label>
                <input
                  type="text"
                  name="intention"
                  placeholder="e.g. Only trade London session, max 2 trades"
                  value={form.intention}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>

              {/* NOTES */}
              <div>
                <label className={labelClass}>Any thoughts or concerns? (optional)</label>
                <textarea
                  name="notes"
                  placeholder="How are you feeling mentally? Any distractions today?"
                  value={form.notes}
                  onChange={handleChange}
                  rows={3}
                  className={inputClass}
                />
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 border border-[#30363D] text-[#8B949E] font-semibold py-3 rounded-full text-sm hover:border-white hover:text-white transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={loading || !form.mood} className="flex-1 bg-[#00D4FF] text-[#0D1117] font-bold py-3 rounded-full text-sm hover:bg-[#00b8d9] transition-colors disabled:opacity-50">
                  {loading ? "Saving..." : "Save Check-In"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
<MobileNav username={user?.user_metadata?.username || user?.email} />
    </main>
  );
}
