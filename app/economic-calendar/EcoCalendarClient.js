"use client";

import MobileNav from "../components/MobileNav";
import ThemeToggle from "../components/ThemeToggle"
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";

const currencies = ["USD","EUR","GBP","JPY","CHF","CAD","AUD","NZD","CNY","NOK","SEK","NZD"];

export default function EcoCalendarClient() {
  const [user, setUser] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currencyFilter, setCurrencyFilter] = useState("All");
  const [impactFilter, setImpactFilter] = useState({ high: true, medium: true, low: true });
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setUser(user);
      try {
        const res = await fetch("/api/economic-calendar");
        const data = await res.json();
        if (data.success) setEvents(data.events);
      } catch (e) {}
      setLoading(false);
    };
    init();
  }, []);

  const uniqueCurrencies = [...new Set(currencies.filter(c => events.some(e => e.currency === c)))];

  const filtered = events.filter(e => {
    if (currencyFilter !== "All" && e.currency !== currencyFilter) return false;
    const imp = (e.impact || "").toLowerCase();
    if (imp === "high" && !impactFilter.high) return false;
    if (imp === "medium" && !impactFilter.medium) return false;
    if (imp === "low" && !impactFilter.low) return false;
    return true;
  }).slice(0, 100);

  const getImpactPill = (impact) => {
    const i = (impact || "").toLowerCase();
    if (i === "high") return "bg-red-500/20 text-red-400 border border-red-500/30";
    if (i === "medium") return "bg-orange-500/20 text-orange-400 border border-orange-500/30";
    if (i === "low") return "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30";
    return "bg-gray-500/20 text-gray-400 border border-gray-500/30";
  };

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  };

  const inputClass = "bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent-blue)] transition-colors";

  if (!user || loading) return (
    <main className="bg-[var(--bg-primary)] min-h-screen">
      <nav className="bg-[var(--bg-secondary)] border-b border-[var(--border)] px-6 py-4 flex items-center justify-between">
        <a href="/dashboard" className="text-[var(--accent-blue)] font-bold text-xl">MatrixVerse</a>
        <div className="hidden md:flex items-center gap-4"><ThemeToggle /></div>
        <div className="md:hidden"><ThemeToggle /></div>
      </nav>
      <div className="max-w-5xl mx-auto px-6 py-10 pb-24">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-[var(--bg-secondary)] rounded-xl w-48" />
          <div className="h-4 bg-[var(--bg-secondary)] rounded-xl w-72" />
          <div className="h-64 bg-[var(--bg-secondary)] rounded-2xl" />
        </div>
      </div>
      <MobileNav username={user?.user_metadata?.username || user?.email} />
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
          <h1 className="text-[var(--text-primary)] font-bold text-3xl mb-1">Economic Calendar</h1>
          <p className="text-[var(--text-muted)] text-sm">Stay up to date with high-impact economic events affecting your pairs</p>
        </div>

        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div>
            <label className="text-[var(--text-muted)] text-xs mb-1 block">Currency</label>
            <select value={currencyFilter} onChange={e => setCurrencyFilter(e.target.value)} className={inputClass}>
              <option value="All">All Currencies</option>
              {uniqueCurrencies.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-[var(--text-muted)] text-xs">Impact:</label>
            {["high","medium","low"].map(imp => (
              <label key={imp} className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={impactFilter[imp]}
                  onChange={() => setImpactFilter(prev => ({ ...prev, [imp]: !prev[imp] }))}
                  className="accent-[var(--accent-blue)]"
                />
                {imp.charAt(0).toUpperCase() + imp.slice(1)}
              </label>
            ))}
          </div>
        </div>

        <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--bg-tertiary)]">
                  {["Time","Currency","Pairs","Event","Impact","Forecast","Previous"].map(h => (
                    <th key={h} className="text-[var(--text-muted)] text-xs font-semibold px-4 py-3 text-left whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center text-[var(--text-muted)] text-sm">No events found</td>
                  </tr>
                ) : filtered.map((e, i) => (
                  <tr key={i} className="border-b border-[var(--border)] hover:bg-[var(--bg-tertiary)] transition-colors">
                    <td className="px-4 py-3 text-[var(--text-primary)] text-sm whitespace-nowrap">{formatTime(e.date)}</td>
                    <td className="px-4 py-3">
                      <span className="text-[var(--accent-blue)] font-bold text-sm">{e.currency}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {e.pairs?.length > 0 ? e.pairs.slice(0, 3).map((p, j) => (
                          <span key={j} className="text-[10px] bg-[var(--accent-blue-bg)] text-[var(--accent-blue)] font-semibold px-1.5 py-0.5 rounded-full">{p}</span>
                        )) : <span className="text-[var(--text-muted)] text-xs">-</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[var(--text-secondary)] text-sm max-w-xs truncate">{e.title}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${getImpactPill(e.impact)}`}>
                        {e.impact || "-"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[var(--text-muted)] text-sm">{e.forecast || "-"}</td>
                    <td className="px-4 py-3 text-[var(--text-muted)] text-sm">{e.previous || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <MobileNav username={user?.user_metadata?.username || user?.email} />
    </main>
  );
}
