"use client";

import MobileNav from "../components/MobileNav";
import ThemeToggle from "../components/ThemeToggle"
import { SkeletonCard } from "../components/Skeleton"
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";

export default function PlansClient() {
  const [user, setUser] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "", pair: "", direction: "buy", entry_criteria: "",
    stop_loss_plan: "", take_profit_plan: "", invalidation: "", management_notes: "",
  });
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setUser(user);
      await fetchPlans();
      setLoading(false);
    };
    init();
  }, []);

  const fetchPlans = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) return;
      const res = await fetch("/api/plans", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setPlans(data.plans);
    } catch (e) {}
  };

  const openCreate = () => {
    setEditingPlan(null);
    setForm({ name: "", pair: "", direction: "buy", entry_criteria: "", stop_loss_plan: "", take_profit_plan: "", invalidation: "", management_notes: "" });
    setShowModal(true);
  };

  const openEdit = (plan) => {
    setEditingPlan(plan);
    setForm({
      name: plan.name || "",
      pair: plan.pair || "",
      direction: plan.direction || "buy",
      entry_criteria: plan.entry_criteria || "",
      stop_loss_plan: plan.stop_loss_plan || "",
      take_profit_plan: plan.take_profit_plan || "",
      invalidation: plan.invalidation || "",
      management_notes: plan.management_notes || "",
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) return;
      await fetch("/api/plans", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(editingPlan ? { ...form, id: editingPlan.id, is_active: editingPlan.is_active } : form),
      });
      setShowModal(false);
      await fetchPlans();
    } catch (e) {}
    setSaving(false);
  };

  const handleSetActive = async (plan) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) return;
      await fetch("/api/plans", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ ...plan, is_active: !plan.is_active }),
      });
      await fetchPlans();
    } catch (e) {}
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this trade plan?")) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) return;
      await fetch("/api/plans?id=" + id, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchPlans();
    } catch (e) {}
  };

  const inputClass = "w-full bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] placeholder-[#8B949E] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent-blue)] transition-colors";
  const labelClass = "text-[var(--text-muted)] text-xs mb-1 block";

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
        </div>
        <div className="md:hidden"><ThemeToggle /></div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-10 pb-24">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-[var(--text-primary)] font-bold text-3xl mb-1">Trade Plans</h1>
            <p className="text-[var(--text-muted)] text-sm">Define your trading setups before you enter</p>
          </div>
          <button onClick={openCreate} className="bg-[var(--accent-blue)] text-[var(--bg-primary)] font-bold px-5 py-3 rounded-full text-sm hover:bg-[var(--accent-blue-hover)] transition-colors">
            + New Plan
          </button>
        </div>

        {loading ? (
          <div className="space-y-4"><SkeletonCard /><SkeletonCard /></div>
        ) : plans.length === 0 ? (
          <div className="text-center py-20 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl">
            <div className="text-5xl mb-4">📋</div>
            <p className="text-[var(--text-muted)] text-sm mb-4">No trade plans yet. Create your first one!</p>
            <button onClick={openCreate} className="bg-[var(--accent-blue)] text-[var(--bg-primary)] font-bold px-5 py-2 rounded-full text-xs">Create Plan</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {plans.map(plan => (
              <div key={plan.id} className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-5 relative">
                {plan.is_active && (
                  <div className="absolute -top-2 -right-2 bg-[var(--accent-green)] text-[var(--bg-primary)] text-[10px] font-bold px-2 py-0.5 rounded-full">Active</div>
                )}
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[var(--text-primary)] font-bold text-lg">{plan.name}</h3>
                  <div className="flex items-center gap-2">
                    {plan.pair && <span className="text-[var(--accent-blue)] font-bold text-sm">{plan.pair}</span>}
                    {plan.direction && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${plan.direction === "buy" ? "bg-[var(--accent-green-bg)] text-[var(--accent-green)]" : "bg-[var(--accent-red-bg)] text-[var(--accent-red)]"}`}>
                        {plan.direction.toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2 text-sm">
                  {plan.entry_criteria && (
                    <div>
                      <span className="text-[var(--text-muted)] text-xs">Entry: </span>
                      <span className="text-[var(--text-secondary)]">{plan.entry_criteria}</span>
                    </div>
                  )}
                  {plan.stop_loss_plan && (
                    <div>
                      <span className="text-[var(--accent-red)] text-xs">SL: </span>
                      <span className="text-[var(--text-secondary)]">{plan.stop_loss_plan}</span>
                    </div>
                  )}
                  {plan.take_profit_plan && (
                    <div>
                      <span className="text-[var(--accent-green)] text-xs">TP: </span>
                      <span className="text-[var(--text-secondary)]">{plan.take_profit_plan}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-[var(--border)]">
                  <button onClick={() => handleSetActive(plan)} className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${plan.is_active ? "border border-[var(--border)] text-[var(--text-muted)]" : "bg-[var(--accent-green-bg)] text-[var(--accent-green)] border border-[var(--accent-green)]"}`}>
                    {plan.is_active ? "Deactivate" : "Set Active"}
                  </button>
                  <button onClick={() => openEdit(plan)} className="text-xs text-[var(--accent-blue)] font-semibold px-3 py-1.5 rounded-full border border-[var(--accent-blue)] hover:bg-[var(--accent-blue-bg)] transition-colors">Edit</button>
                  <button onClick={() => handleDelete(plan.id)} className="text-xs text-[var(--accent-red)] font-semibold px-3 py-1.5 rounded-full border border-[var(--accent-red)] hover:bg-[var(--accent-red-bg)] transition-colors ml-auto">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 px-4">
          <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
              <h2 className="text-[var(--text-primary)] font-bold text-lg">{editingPlan ? "Edit Plan" : "New Trade Plan"}</h2>
              <button onClick={() => setShowModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xl">✕</button>
            </div>
            <div className="px-6 py-6 flex flex-col gap-4">
              <div>
                <label className={labelClass}>Plan Name</label>
                <input type="text" placeholder="e.g. London Breakout" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className={inputClass} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Pair</label>
                  <select value={form.pair} onChange={e => setForm({...form, pair: e.target.value})} className={inputClass}>
                    <option value="">Any</option>
                    {["EURUSD","GBPUSD","USDJPY","XAUUSD","USDCAD","AUDUSD","NZDUSD","USDCHF","GBPJPY","EURJPY","BTCUSD","ETHUSD"].map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Direction</label>
                  <select value={form.direction} onChange={e => setForm({...form, direction: e.target.value})} className={inputClass}>
                    <option value="buy">Buy</option>
                    <option value="sell">Sell</option>
                  </select>
                </div>
              </div>
              <div>
                <label className={labelClass}>Entry Criteria</label>
                <textarea placeholder="Describe your entry setup..." value={form.entry_criteria} onChange={e => setForm({...form, entry_criteria: e.target.value})} rows={2} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Stop Loss Plan</label>
                <textarea placeholder="Where and why you'll place your stop..." value={form.stop_loss_plan} onChange={e => setForm({...form, stop_loss_plan: e.target.value})} rows={2} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Take Profit Plan</label>
                <textarea placeholder="Your target levels..." value={form.take_profit_plan} onChange={e => setForm({...form, take_profit_plan: e.target.value})} rows={2} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Invalidation / When to Scratch</label>
                <textarea placeholder="When would you exit early?" value={form.invalidation} onChange={e => setForm({...form, invalidation: e.target.value})} rows={2} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Management Notes</label>
                <textarea placeholder="Trailing stops, partials, etc." value={form.management_notes} onChange={e => setForm({...form, management_notes: e.target.value})} rows={2} className={inputClass} />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowModal(false)} className="flex-1 border border-[var(--border)] text-[var(--text-muted)] font-semibold py-3 rounded-full text-sm hover:border-[var(--hover-border)] hover:text-[var(--text-primary)] transition-colors">
                  Cancel
                </button>
                <button onClick={handleSave} disabled={saving || !form.name.trim()} className="flex-1 bg-[var(--accent-blue)] text-[var(--bg-primary)] font-bold py-3 rounded-full text-sm hover:bg-[var(--accent-blue-hover)] transition-colors disabled:opacity-50">
                  {saving ? "Saving..." : editingPlan ? "Update Plan" : "Create Plan"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <MobileNav username={user?.user_metadata?.username || user?.email} />
    </main>
  );
}
