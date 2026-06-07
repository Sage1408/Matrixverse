"use client";

import MobileNav from "../components/MobileNav";
import ThemeToggle from "../components/ThemeToggle"
import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";

const exercises = [
  { id: "box", name: "Box Breathing", pattern: [4,4,4,4], desc: "Inhale 4s — Hold 4s — Exhale 4s — Hold 4s" },
  { id: "calm", name: "Calm Down", pattern: [4,7,8], desc: "Inhale 4s — Hold 7s — Exhale 8s" },
  { id: "quick", name: "Quick Reset", pattern: [3,3,3,3], desc: "Inhale 3s — Hold 3s — Exhale 3s — Hold 3s" },
  { id: "deep", name: "Deep Focus", pattern: [5,5], desc: "Inhale 5s — Exhale 5s" },
];

const phases = [
  { key: "inhale", label: "Breathe In", icon: "🌬️" },
  { key: "hold", label: "Hold", icon: "⏸️" },
  { key: "exhale", label: "Breathe Out", icon: "💨" },
  { key: "hold", label: "Hold", icon: "⏸️" },
];

export default function SanctuaryClient() {
  const [user, setUser] = useState(null);
  const [activeExercise, setActiveExercise] = useState(null);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [showMood, setShowMood] = useState(false);
  const [mood, setMood] = useState("Calm");
  const [saving, setSaving] = useState(false);
  const [gradientPos, setGradientPos] = useState(0);
  const intervalRef = useRef(null);
  const phaseIntervalRef = useRef(null);
  const gradientRef = useRef(null);
  const circleRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setUser(user);
    };
    init();
  }, []);

  useEffect(() => {
    gradientRef.current = setInterval(() => {
      setGradientPos(prev => (prev + 1) % 360);
    }, 100);
    return () => clearInterval(gradientRef.current);
  }, []);

  const startExercise = (ex) => {
    setActiveExercise(ex);
    setPhaseIndex(0);
    setSeconds(0);
    setRunning(true);
    setCompleted(false);
    setShowMood(false);

    let idx = 0;
    let sec = 0;
    const pattern = ex.pattern;

    clearInterval(intervalRef.current);
    clearInterval(phaseIntervalRef.current);

    intervalRef.current = setInterval(() => {
      sec++;
      setSeconds(sec);
      const max = pattern[idx] || 1;
      if (sec >= max) {
        sec = 0;
        idx = (idx + 1) % pattern.length;
        setPhaseIndex(idx);
      }
    }, 1000);
  };

  const stopExercise = () => {
    clearInterval(intervalRef.current);
    clearInterval(phaseIntervalRef.current);
    setRunning(false);
    setCompleted(true);
    setShowMood(true);
  };

  const handleMoodLog = async () => {
    setSaving(true);
    const exerciseName = activeExercise?.name || "Breathing";
    const { error } = await supabase.from("checkins").insert([{
      user_id: user.id,
      mood: mood,
      notes: `Completed ${exerciseName} exercise in Sanctuary (${seconds}s)`,
      checked_in_at: new Date().toISOString(),
    }]);
    if (!error) {
      setShowMood(false);
    }
    setSaving(false);
  };

  const getPhaseInfo = () => {
    if (!activeExercise) return { label: "", icon: "" };
    const pattern = activeExercise.pattern;
    if (pattern.length === 2) {
      if (phaseIndex === 0) return { label: "Breathe In", icon: "🌬️" };
      return { label: "Breathe Out", icon: "💨" };
    }
    const phaseOrder = ["inhale","hold","exhale","hold"];
    const phaseKey = phaseOrder[phaseIndex % phaseOrder.length];
    const p = phases.find(ph => ph.key === phaseKey);
    return { label: p?.label || "", icon: p?.icon || "" };
  };

  const circleScale = () => {
    if (!activeExercise || !running) return 1;
    const pattern = activeExercise.pattern;
    const phaseCount = pattern.length;
    const currentPhase = phaseIndex % phaseCount;
    if (currentPhase === 0) return 1.3;
    if (currentPhase === 2) return 0.7;
    if (currentPhase === 1 || currentPhase === 3) return 1;
    return 1;
  };

  const phaseInfo = getPhaseInfo();

  if (!user) return (
    <main className="bg-[var(--bg-primary)] min-h-screen flex items-center justify-center">
      <div className="w-12 h-12 border-2 border-[var(--accent-blue)] border-t-transparent rounded-full animate-spin" />
    </main>
  );

  return (
    <main className="min-h-screen transition-colors duration-[3000ms]" style={{
      background: `linear-gradient(${gradientPos}deg, var(--bg-primary), var(--bg-secondary), #0a1628, #1a0a2e)`,
    }}>
      <nav className="bg-[var(--bg-secondary)]/80 backdrop-blur-md border-b border-[var(--border)] px-6 py-4 flex items-center justify-between">
        <a href="/dashboard" className="text-[var(--accent-blue)] font-bold text-xl">MatrixVerse</a>
        <div className="hidden md:flex items-center gap-4">
          <ThemeToggle />
          <a href="/dashboard" className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-sm">Dashboard</a>
          <a href="/journal" className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-sm">Journal</a>
        </div>
        <div className="md:hidden"><ThemeToggle /></div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-10 pb-24">
        <div className="text-center mb-8">
          <h1 className="text-[var(--text-primary)] font-bold text-3xl mb-1">Sanctuary</h1>
          <p className="text-[var(--text-muted)] text-sm">Take a moment to breathe and reset your mind</p>
        </div>

        {!running && !completed ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {exercises.map(ex => (
              <button
                key={ex.id}
                onClick={() => startExercise(ex)}
                className="bg-[var(--bg-secondary)]/80 backdrop-blur-sm border border-[var(--border)] rounded-2xl p-6 text-left hover:border-[var(--accent-blue)] transition-colors group"
              >
                <h3 className="text-[var(--text-primary)] font-bold text-lg mb-1 group-hover:text-[var(--accent-blue)] transition-colors">{ex.name}</h3>
                <p className="text-[var(--text-muted)] text-sm">{ex.desc}</p>
                <div className="mt-3 flex gap-1.5">
                  {ex.pattern.map((p, i) => (
                    <span key={i} className="bg-[var(--accent-blue-bg)] text-[var(--accent-blue)] text-[10px] font-bold px-2 py-1 rounded-full">
                      {p}s
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>
        ) : null}

        {running && activeExercise && (
          <div className="flex flex-col items-center gap-8 py-8">
            <div className="text-4xl font-bold text-[var(--text-primary)]">{seconds}s</div>

            <div
              ref={circleRef}
              className="w-48 h-48 rounded-full flex items-center justify-center transition-all duration-1000 ease-in-out"
              style={{
                transform: `scale(${circleScale()})`,
                background: `radial-gradient(circle, var(--accent-blue) 0%, var(--accent-purple) 50%, transparent 70%)`,
                boxShadow: `0 0 60px var(--accent-blue), 0 0 120px var(--accent-purple)`,
              }}
            >
              <div className="bg-[var(--bg-primary)]/80 backdrop-blur-sm rounded-full w-32 h-32 flex flex-col items-center justify-center">
                <span className="text-3xl mb-1">{phaseInfo.icon}</span>
                <span className="text-[var(--text-primary)] font-bold text-lg">{phaseInfo.label}</span>
              </div>
            </div>

            <div className="flex gap-2">
              {activeExercise.pattern.map((p, i) => {
                const phaseLabels = activeExercise.pattern.length === 2
                  ? ["Inhale","Exhale"]
                  : ["Inhale","Hold","Exhale","Hold"];
                return (
                  <div key={i} className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                    i === phaseIndex % activeExercise.pattern.length
                      ? "bg-[var(--accent-blue)] text-[var(--bg-primary)] scale-110"
                      : "bg-[var(--bg-secondary)] text-[var(--text-muted)]"
                  }`}>
                    {phaseLabels[i % phaseLabels.length]} {p}s
                  </div>
                );
              })}
            </div>

            <button onClick={stopExercise} className="bg-[var(--accent-red)] text-white font-bold px-8 py-3 rounded-full text-sm hover:opacity-90 transition-colors">
              End Session
            </button>
          </div>
        )}

        {showMood && (
          <div className="bg-[var(--bg-secondary)]/80 backdrop-blur-sm border border-[var(--border)] rounded-2xl p-6 max-w-md mx-auto text-center">
            <div className="text-4xl mb-3">🧘</div>
            <h2 className="text-[var(--text-primary)] font-bold text-lg mb-2">Session Complete</h2>
            <p className="text-[var(--text-muted)] text-sm mb-4">How are you feeling?</p>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {["Calm","Focused","Relaxed","Energized","Peaceful","Clear"].map(m => (
                <button
                  key={m}
                  onClick={() => setMood(m)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                    mood === m
                      ? "border-[var(--accent-blue)] bg-[var(--accent-blue-bg)] text-[var(--accent-blue)]"
                      : "border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--accent-blue)]"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
            <button
              onClick={handleMoodLog}
              disabled={saving}
              className="w-full bg-[var(--accent-blue)] text-[var(--bg-primary)] font-bold py-3 rounded-full text-sm disabled:opacity-50"
            >
              {saving ? "Saving..." : "Log Mood & Finish"}
            </button>
          </div>
        )}

        {completed && !showMood && (
          <div className="text-center py-8">
            <p className="text-[var(--text-muted)] text-sm">Take a moment. Your mind is your edge.</p>
          </div>
        )}
      </div>

      <MobileNav username={user?.user_metadata?.username || user?.email} />
    </main>
  );
}
