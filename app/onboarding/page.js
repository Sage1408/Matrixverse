"use client";

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";

export default function Onboarding() {
  const [user, setUser] = useState(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [traderType, setTraderType] = useState("");
  const [selectedPairs, setSelectedPairs] = useState([]);
  const [goal, setGoal] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");

  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      // If already onboarded, go to dashboard
      if (user.user_metadata?.onboarded) {
        router.push("/dashboard");
        return;
      }

      setUser(user);
      setDisplayName(user.user_metadata?.username || "");
    };
    init();
  }, []);

  const togglePair = (pair) => {
    setSelectedPairs(prev =>
      prev.includes(pair)
        ? prev.filter(p => p !== pair)
        : [...prev, pair]
    );
  };

  const handleFinish = async () => {
    setLoading(true);

    await supabase.auth.updateUser({
      data: {
        display_name: displayName,
        bio,
        trader_type: traderType,
        preferred_pairs: selectedPairs,
        goal,
        onboarded: true,
      },
    });

    // Update profiles table too
    await supabase
      .from("profiles")
      .update({
        username: user.user_metadata?.username,
      })
      .eq("user_id", user.id);

    router.push("/dashboard");
    setLoading(false);
  };

  const traderTypes = [
    { key: "beginner", label: "Beginner Trader", icon: "🌱", desc: "Just starting out in forex" },
    { key: "prop", label: "Prop Firm Trader", icon: "🏆", desc: "Working on funded challenges" },
    { key: "crypto", label: "Crypto Trader", icon: "₿", desc: "Trading crypto markets" },
    { key: "smc", label: "SMC / ICT Trader", icon: "🎯", desc: "Smart Money Concepts" },
    { key: "signal", label: "Signal Provider", icon: "📡", desc: "Sharing signals with others" },
    { key: "mentor", label: "Trading Mentor", icon: "🧑‍🏫", desc: "Teaching other traders" },
  ];

  const pairs = [
    "EURUSD", "GBPUSD", "XAUUSD", "USDJPY", "USDCAD",
    "AUDUSD", "GBPJPY", "EURJPY", "BTCUSD", "ETHUSD",
    "NZDUSD", "USDCHF", "GBPAUD", "EURGBP", "SILVER",
  ];

  const goals = [
    { key: "improve", label: "Improve my trading", icon: "📈" },
    { key: "challenge", label: "Pass a prop firm challenge", icon: "🎯" },
    { key: "community", label: "Build my trading community", icon: "👥" },
    { key: "consistent", label: "Become more consistent", icon: "🔄" },
    { key: "all", label: "All of the above", icon: "⚡" },
  ];

  if (!user) return (
    <main className="bg-[#0D1117] min-h-screen flex items-center justify-center">
      <p className="text-[#8B949E]">Loading...</p>
    </main>
  );

  return (
    <main className="bg-[#0D1117] min-h-screen flex flex-col items-center justify-center px-6 py-10">

      {/* LOGO */}
      <div className="text-[#00D4FF] font-bold text-2xl mb-8">MatrixVerse</div>

      {/* PROGRESS BAR */}
      <div className="w-full max-w-lg mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[#8B949E] text-xs">Step {step} of 4</span>
          <span className="text-[#8B949E] text-xs">{Math.round((step / 4) * 100)}% complete</span>
        </div>
        <div className="w-full h-2 bg-[#30363D] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#00D4FF] rounded-full transition-all duration-500"
            style={{ width: (step / 4 * 100) + "%" }}
          />
        </div>
      </div>

      <div className="w-full max-w-lg bg-[#161B22] border border-[#30363D] rounded-2xl p-8">

        {/* STEP 1 — TRADER TYPE */}
        {step === 1 && (
          <div>
            <h1 className="text-white font-bold text-2xl mb-2">What type of trader are you?</h1>
            <p className="text-[#8B949E] text-sm mb-6">This helps us personalise your experience.</p>
            <div className="grid grid-cols-2 gap-3">
              {traderTypes.map((type) => (
                <button
                  key={type.key}
                  onClick={() => setTraderType(type.key)}
                  className={"flex flex-col items-start p-4 rounded-xl border transition-colors text-left " + (
                    traderType === type.key
                      ? "border-[#00D4FF] bg-[#00D4FF10]"
                      : "border-[#30363D] hover:border-[#00D4FF]"
                  )}
                >
                  <span className="text-2xl mb-2">{type.icon}</span>
                  <span className={"font-semibold text-sm " + (traderType === type.key ? "text-[#00D4FF]" : "text-white")}>
                    {type.label}
                  </span>
                  <span className="text-[#8B949E] text-xs mt-0.5">{type.desc}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2 — PREFERRED PAIRS */}
        {step === 2 && (
          <div>
            <h1 className="text-white font-bold text-2xl mb-2">Which pairs do you trade?</h1>
            <p className="text-[#8B949E] text-sm mb-6">Select all that apply. You can change this later.</p>
            <div className="flex flex-wrap gap-2">
              {pairs.map((pair) => (
                <button
                  key={pair}
                  onClick={() => togglePair(pair)}
                  className={"px-4 py-2 rounded-full text-sm font-semibold border transition-colors " + (
                    selectedPairs.includes(pair)
                      ? "bg-[#00D4FF] text-[#0D1117] border-[#00D4FF]"
                      : "border-[#30363D] text-[#8B949E] hover:border-[#00D4FF] hover:text-[#00D4FF]"
                  )}
                >
                  {pair}
                </button>
              ))}
            </div>
            {selectedPairs.length > 0 && (
              <p className="text-[#00D4FF] text-xs mt-4">{selectedPairs.length} pair(s) selected</p>
            )}
          </div>
        )}

        {/* STEP 3 — GOAL */}
        {step === 3 && (
          <div>
            <h1 className="text-white font-bold text-2xl mb-2">What is your main goal?</h1>
            <p className="text-[#8B949E] text-sm mb-6">We will show you the most relevant features first.</p>
            <div className="flex flex-col gap-3">
              {goals.map((g) => (
                <button
                  key={g.key}
                  onClick={() => setGoal(g.key)}
                  className={"flex items-center gap-4 p-4 rounded-xl border transition-colors text-left " + (
                    goal === g.key
                      ? "border-[#00D4FF] bg-[#00D4FF10]"
                      : "border-[#30363D] hover:border-[#00D4FF]"
                  )}
                >
                  <span className="text-2xl">{g.icon}</span>
                  <span className={"font-semibold text-sm " + (goal === g.key ? "text-[#00D4FF]" : "text-white")}>
                    {g.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 4 — PROFILE SETUP */}
        {step === 4 && (
          <div>
            <h1 className="text-white font-bold text-2xl mb-2">Set up your profile</h1>
            <p className="text-[#8B949E] text-sm mb-6">This is optional. You can always update it later in settings.</p>

            <div className="flex flex-col gap-4">

              <div className="flex items-center gap-4 p-4 bg-[#0D1117] rounded-xl mb-2">
                <div className="w-14 h-14 rounded-full bg-[#00D4FF] flex items-center justify-center text-[#0D1117] font-bold text-xl">
                  {user.user_metadata?.username?.charAt(0).toUpperCase() || "?"}
                </div>
                <div>
                  <p className="text-white font-semibold">@{user.user_metadata?.username}</p>
                  <p className="text-[#8B949E] text-xs">Your avatar uses your username initial</p>
                </div>
              </div>

              <div>
                <label className="text-[#8B949E] text-xs mb-1 block">Display Name (optional)</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your full name or trading name"
                  className="w-full bg-[#0D1117] border border-[#30363D] text-white placeholder-[#8B949E] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#00D4FF] transition-colors"
                />
              </div>

              <div>
                <label className="text-[#8B949E] text-xs mb-1 block">Bio (optional)</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={140}
                  rows={3}
                  placeholder="Tell other traders about yourself..."
                  className="w-full bg-[#0D1117] border border-[#30363D] text-white placeholder-[#8B949E] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#00D4FF] transition-colors"
                />
                <p className="text-[#8B949E] text-xs mt-1">{bio.length}/140</p>
              </div>

            </div>
          </div>
        )}

        {/* NAVIGATION BUTTONS */}
        <div className="flex gap-3 mt-8">
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="flex-1 border border-[#30363D] text-[#8B949E] font-semibold py-3 rounded-full text-sm hover:border-white hover:text-white transition-colors"
            >
              Back
            </button>
          )}

          {step < 4 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={
                (step === 1 && !traderType) ||
                (step === 3 && !goal)
              }
              className="flex-1 bg-[#00D4FF] text-[#0D1117] font-bold py-3 rounded-full text-sm hover:bg-[#00b8d9] transition-colors disabled:opacity-40"
            >
              {step === 2 && selectedPairs.length === 0 ? "Skip" : "Continue"}
            </button>
          ) : (
            <button
              onClick={handleFinish}
              disabled={loading}
              className="flex-1 bg-[#00D4FF] text-[#0D1117] font-bold py-3 rounded-full text-sm hover:bg-[#00b8d9] transition-colors disabled:opacity-50"
            >
              {loading ? "Setting up..." : "Go to Dashboard 🚀"}
            </button>
          )}
        </div>

        {/* SKIP ALL */}
        {step < 4 && (
          <button
            onClick={handleFinish}
            className="w-full text-center text-[#8B949E] text-xs mt-4 hover:text-white transition-colors"
          >
            Skip setup and go to dashboard
          </button>
        )}

      </div>
    </main>
  );
}
