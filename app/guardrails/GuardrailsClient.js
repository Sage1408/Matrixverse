"use client";

import MobileNav from "../components/MobileNav";
import ThemeToggle from "../components/ThemeToggle"
import { Skeleton, SkeletonCard } from "../components/Skeleton"
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";

export default function GuardrailsClient() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [maxDailyLoss, setMaxDailyLoss] = useState("");
  const [maxTradesPerDay, setMaxTradesPerDay] = useState("");
  const [maxConsecutiveLosses, setMaxConsecutiveLosses] = useState("");
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setUser(user);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (token) {
          const res = await fetch("/api/guardrails", {
            headers: { Authorization: `Bearer ${token}` }
          });
          const data = await res.json();
          if (data.success && data.guardrails) {
            setEnabled(data.guardrails.enabled || false);
            setMaxDailyLoss(data.guardrails.maxDailyLoss?.toString() || "");
            setMaxTradesPerDay(data.guardrails.maxTradesPerDay?.toString() || "");
            setMaxConsecutiveLosses(data.guardrails.maxConsecutiveLosses?.toString() || "");
          }
        }
      } catch (e) {}
      setLoading(false);
    };
    init();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) return;
      await fetch("/api/guardrails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          enabled,
          maxDailyLoss: parseFloat(maxDailyLoss) || 0,
          maxTradesPerDay: parseInt(maxTradesPerDay) || 0,
          maxConsecutiveLosses: parseInt(maxConsecutiveLosses) || 0,
        }),
      });
    } catch (e) {}
    setSaving(false);
  };

  const inputClass = "w-full bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] placeholder-[#8B949E] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent-blue)] transition-colors";
  const labelClass = "text-[var(--text-muted)] text-xs mb-1 block";

  if (!user) return (
    <main className="bg-[var(--bg-primary)] min-h-screen flex items-center justify-center">
      <div className="w-full max-w-4xl px-6 space-y-6">
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
        </div>
        <div className="md:hidden"><ThemeToggle /></div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-10 pb-24">
        <div className="mb-6">
          <h1 className="text-[var(--text-primary)] font-bold text-3xl mb-1">Guardrails</h1>
          <p className="text-[var(--text-muted)] text-sm">Set safety limits to protect your trading</p>
        </div>

        <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-[var(--text-primary)] font-bold text-lg">Safety Limits</h2>
              <p className="text-[var(--text-muted)] text-xs">Enable guardrails to block trades when limits are exceeded</p>
            </div>
            <button
              onClick={() => setEnabled(!enabled)}
              className={"relative w-12 h-6 rounded-full transition-colors flex-shrink-0 " + (enabled ? "bg-[var(--accent-green)]" : "bg-[var(--border)]")}
            >
              <div className={"w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all shadow-md " + (enabled ? "left-6" : "left-0.5")} />
            </button>
          </div>

          <div className="flex flex-col gap-5">
            <div>
              <label className={labelClass}>Max Daily Loss ($)</label>
              <input
                type="number"
                placeholder="e.g. 200"
                value={maxDailyLoss}
                onChange={e => setMaxDailyLoss(e.target.value)}
                className={inputClass}
              />
              <p className="text-[var(--text-muted)] text-[10px] mt-1">Block trades if your daily loss exceeds this amount</p>
            </div>

            <div>
              <label className={labelClass}>Max Trades Per Day</label>
              <input
                type="number"
                placeholder="e.g. 5"
                value={maxTradesPerDay}
                onChange={e => setMaxTradesPerDay(e.target.value)}
                className={inputClass}
              />
              <p className="text-[var(--text-muted)] text-[10px] mt-1">Block trades if you exceed this many trades in one day</p>
            </div>

            <div>
              <label className={labelClass}>Max Consecutive Losses Before Cool-down</label>
              <input
                type="number"
                placeholder="e.g. 3"
                value={maxConsecutiveLosses}
                onChange={e => setMaxConsecutiveLosses(e.target.value)}
                className={inputClass}
              />
              <p className="text-[var(--text-muted)] text-[10px] mt-1">Block trades after this many consecutive losses</p>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="mt-6 w-full bg-[var(--accent-blue)] text-[var(--bg-primary)] font-bold py-3 rounded-full text-sm hover:bg-[var(--accent-blue-hover)] transition-colors disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Guardrails"}
          </button>
        </div>

        <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-6">
          <h2 className="text-[var(--text-primary)] font-bold text-lg mb-3">🧠 How Guardrails Help</h2>
          <div className="flex flex-col gap-3">
            {[
              { icon: "🛑", title: "Daily Loss Limit", desc: "Prevents you from blowing your account in a single bad day" },
              { icon: "📊", title: "Trade Limit", desc: "Reduces overtrading by capping how many trades you can take" },
              { icon: "🧊", title: "Cool-down", desc: "Forces you to step away after consecutive losses to avoid revenge trading" },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-[var(--bg-primary)] rounded-xl">
                <span className="text-xl flex-shrink-0">{item.icon}</span>
                <div>
                  <p className="text-[var(--text-primary)] text-sm font-semibold">{item.title}</p>
                  <p className="text-[var(--text-muted)] text-xs">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <MobileNav username={user?.user_metadata?.username || user?.email} />
    </main>
  );
}
