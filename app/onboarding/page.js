"use client";

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";
import ThemeToggle from "../components/ThemeToggle"
import { Skeleton, SkeletonCard } from "../components/Skeleton"

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
    <main className="bg-[var(--bg-primary)] min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-lg space-y-6">
        <Skeleton className="h-6 w-32 mx-auto" />
        <SkeletonCard />
      </div>
    </main>
  );

  return (
    <>
      <nav className="bg-[var(--bg-secondary)] border-b border-[var(--border)] px-6 py-4 flex items-center justify-between">
        <div className="text-[var(--accent-blue)] font-bold text-xl">MatrixVerse</div>
        <ThemeToggle />
      </nav>
      <main className="bg-[var(--bg-primary)] min-h-screen flex flex-col items-center justify-center px-6 py-10">

      {/* PROGRESS BAR */}
      <div className="w-full max-w-lg mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[var(--text-muted)] text-xs">Step {step} of 4</span>
          <span className="text-[var(--text-muted)] text-xs">{Math.round((step / 4) * 100)}% complete</span>
        </div>
        <div className="w-full h-2 bg-[var(--border)] rounded-full overflow-hidden">
          <div
            className="h-full bg-[var(--accent-blue)] rounded-full transition-all duration-500"
            style={{ width: (step / 4 * 100) + "%" }}
          />
        </div>
      </div>

      <div className="w-full max-w-lg bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-8">

        {/* STEP 1 — TRADER TYPE */}
        {step === 1 && (
          <div>
            <h1 className="text-[var(--text-primary)] font-bold text-2xl mb-2">What type of trader are you?</h1>
            <p className="text-[var(--text-muted)] text-sm mb-6">This helps us personalise your experience.</p>
            <div className="grid grid-cols-2 gap-3">
              {traderTypes.map((type) => (
                <button
                  key={type.key}
                  onClick={() => setTraderType(type.key)}
                  className={"flex flex-col items-start p-4 rounded-xl border transition-colors text-left " + (
                    traderType === type.key
                      ? "border-[var(--accent-blue)] bg-[var(--accent-blue-bg)]"
                      : "border-[var(--border)] hover:border-[var(--accent-blue)]"
                  )}
                >
                  <span className="text-2xl mb-2">{type.icon}</span>
                  <span className={"font-semibold text-sm " + (traderType === type.key ? "text-[var(--accent-blue)]" : "text-[var(--text-primary)]")}>
                    {type.label}
                  </span>
                  <span className="text-[var(--text-muted)] text-xs mt-0.5">{type.desc}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2 — PREFERRED PAIRS */}
        {step === 2 && (
          <div>
            <h1 className="text-[var(--text-primary)] font-bold text-2xl mb-2">Which pairs do you trade?</h1>
            <p className="text-[var(--text-muted)] text-sm mb-6">Select all that apply. You can change this later.</p>
            <div className="flex flex-wrap gap-2">
              {pairs.map((pair) => (
                <button
                  key={pair}
                  onClick={() => togglePair(pair)}
                  className={"px-4 py-2 rounded-full text-sm font-semibold border transition-colors " + (
                    selectedPairs.includes(pair)
                      ? "bg-[var(--accent-blue)] text-[var(--bg-primary)] border-[var(--accent-blue)]"
                      : "border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--accent-blue)] hover:text-[var(--accent-blue)]"
                  )}
                >
                  {pair}
                </button>
              ))}
            </div>
            {selectedPairs.length > 0 && (
              <p className="text-[var(--accent-blue)] text-xs mt-4">{selectedPairs.length} pair(s) selected</p>
            )}
          </div>
        )}

        {/* STEP 3 — GOAL */}
        {step === 3 && (
          <div>
            <h1 className="text-[var(--text-primary)] font-bold text-2xl mb-2">What is your main goal?</h1>
            <p className="text-[var(--text-muted)] text-sm mb-6">We will show you the most relevant features first.</p>
            <div className="flex flex-col gap-3">
              {goals.map((g) => (
                <button
                  key={g.key}
                  onClick={() => setGoal(g.key)}
                  className={"flex items-center gap-4 p-4 rounded-xl border transition-colors text-left " + (
                    goal === g.key
                      ? "border-[var(--accent-blue)] bg-[var(--accent-blue-bg)]"
                      : "border-[var(--border)] hover:border-[var(--accent-blue)]"
                  )}
                >
                  <span className="text-2xl">{g.icon}</span>
                  <span className={"font-semibold text-sm " + (goal === g.key ? "text-[var(--accent-blue)]" : "text-[var(--text-primary)]")}>
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
            <h1 className="text-[var(--text-primary)] font-bold text-2xl mb-2">Set up your profile</h1>
            <p className="text-[var(--text-muted)] text-sm mb-6">This is optional. You can always update it later in settings.</p>

            <div className="flex flex-col gap-4">

              <div className="flex items-center gap-4 p-4 bg-[var(--bg-primary)] rounded-xl mb-2">
                <div className="w-14 h-14 rounded-full bg-[var(--accent-blue)] flex items-center justify-center text-[var(--bg-primary)] font-bold text-xl">
                  {user.user_metadata?.username?.charAt(0).toUpperCase() || "?"}
                </div>
                <div>
                  <p className="text-[var(--text-primary)] font-semibold">@{user.user_metadata?.username}</p>
                  <p className="text-[var(--text-muted)] text-xs">Your avatar uses your username initial</p>
                </div>
              </div>

              <div>
                <label className="text-[var(--text-muted)] text-xs mb-1 block">Display Name (optional)</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your full name or trading name"
                  className="w-full bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] placeholder-[#8B949E] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent-blue)] transition-colors"
                />
              </div>

              <div>
                <label className="text-[var(--text-muted)] text-xs mb-1 block">Bio (optional)</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={140}
                  rows={3}
                  placeholder="Tell other traders about yourself..."
                  className="w-full bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] placeholder-[#8B949E] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent-blue)] transition-colors"
                />
                <p className="text-[var(--text-muted)] text-xs mt-1">{bio.length}/140</p>
              </div>

            </div>
          </div>
        )}

        {/* NAVIGATION BUTTONS */}
        <div className="flex gap-3 mt-8">
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="flex-1 border border-[var(--border)] text-[var(--text-muted)] font-semibold py-3 rounded-full text-sm hover:border-[var(--hover-border)] hover:text-[var(--text-primary)] transition-colors"
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
              className="flex-1 bg-[var(--accent-blue)] text-[var(--bg-primary)] font-bold py-3 rounded-full text-sm hover:bg-[var(--accent-blue-hover)] transition-colors disabled:opacity-40"
            >
              {step === 2 && selectedPairs.length === 0 ? "Skip" : "Continue"}
            </button>
          ) : (
            <button
              onClick={handleFinish}
              disabled={loading}
              className="flex-1 bg-[var(--accent-blue)] text-[var(--bg-primary)] font-bold py-3 rounded-full text-sm hover:bg-[var(--accent-blue-hover)] transition-colors disabled:opacity-50"
            >
              {loading ? "Setting up..." : "Go to Dashboard 🚀"}
            </button>
          )}
        </div>

        {/* SKIP ALL */}
        {step < 4 && (
          <button
            onClick={handleFinish}
            className="w-full text-center text-[var(--text-muted)] text-xs mt-4 hover:text-[var(--text-primary)] transition-colors"
          >
            Skip setup and go to dashboard
          </button>
        )}

      </div>
    </main>
    </>
  );
}
