"use client";

import MobileNav from "../components/MobileNav";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";

export default function Settings() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [profileUrl, setProfileUrl] = useState("/dashboard");
  const router = useRouter();

  const [profile, setProfile] = useState({
    username: "",
    display_name: "",
    bio: "",
    trading_style: "",
    timezone: "UTC",
  });

  const [passwords, setPasswords] = useState({
    new_password: "",
    confirm_password: "",
  });

  const [notifications, setNotifications] = useState({
    streak_reminders: true,
    community_replies: true,
    drawdown_warnings: true,
    leaderboard_updates: true,
    ai_analysis_ready: true,
  });

  const [trading, setTrading] = useState({
    default_lot_size: "0.01",
    max_daily_trades: "5",
    preferred_session: "London",
  });

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setUser(user);
      const uname = user.user_metadata?.username || "";
      setProfileUrl("/profile/" + uname);
      setProfile({
        username: uname,
        display_name: user.user_metadata?.display_name || "",
        bio: user.user_metadata?.bio || "",
        trading_style: user.user_metadata?.trading_style || "",
        timezone: user.user_metadata?.timezone || "UTC",
      });
    };
    init();
  }, []);

  const showMsg = (msg, isError = false) => {
    if (isError) setError(msg);
    else setMessage(msg);
    setTimeout(() => { setMessage(""); setError(""); }, 3000);
  };

  const saveProfile = async () => {
    setLoading(true);
    const { error } = await supabase.auth.updateUser({
      data: {
        username: profile.username,
        display_name: profile.display_name,
        bio: profile.bio,
        trading_style: profile.trading_style,
        timezone: profile.timezone,
      },
    });
    if (error) showMsg(error.message, true);
    else {
      showMsg("Profile updated successfully!");
      setProfileUrl("/profile/" + profile.username);
    }
    setLoading(false);
  };

  const changePassword = async () => {
    if (passwords.new_password !== passwords.confirm_password) {
      showMsg("Passwords do not match", true);
      return;
    }
    if (passwords.new_password.length < 6) {
      showMsg("Password must be at least 6 characters", true);
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: passwords.new_password });
    if (error) showMsg(error.message, true);
    else {
      showMsg("Password changed successfully!");
      setPasswords({ new_password: "", confirm_password: "" });
    }
    setLoading(false);
  };

  const exportTrades = async () => {
    const { data } = await supabase.from("trades").select("*").eq("user_id", user.id);
    if (!data || data.length === 0) { showMsg("No trades to export", true); return; }
    const headers = ["Pair","Direction","Lot Size","Entry","SL","TP","PnL","RR","Strategy","Emotion Before","Emotion After","Notes","Date"];
    const rows = data.map(t => [t.pair, t.direction, t.lot_size, t.entry_price, t.stop_loss, t.take_profit, t.pnl, t.rr_ratio, t.strategy, t.emotion_before, t.emotion_after, t.notes, new Date(t.traded_at).toLocaleDateString()]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "matrixverse_trades.csv";
    a.click();
    showMsg("Trades exported!");
  };

  const deleteAllTrades = async () => {
    if (!confirm("This will permanently delete ALL your trades. Are you sure?")) return;
    setLoading(true);
    const { error } = await supabase.from("trades").delete().eq("user_id", user.id);
    if (error) showMsg(error.message, true);
    else showMsg("All trades deleted.");
    setLoading(false);
  };

  const inputClass = "w-full bg-[#0D1117] border border-[#30363D] text-white placeholder-[#8B949E] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#00D4FF] transition-colors";
  const labelClass = "text-[#8B949E] text-xs mb-1 block";

  const tabs = [
    { key: "profile", label: "👤 Profile" },
    { key: "account", label: "🔐 Account" },
    { key: "notifications", label: "🔔 Notifications" },
    { key: "trading", label: "📊 Trading" },
    { key: "data", label: "💾 Data" },
  ];

  if (!user) return (
    <main className="bg-[#0D1117] min-h-screen flex items-center justify-center">
      <p className="text-[#8B949E]">Loading...</p>
    </main>
  );

  return (
    <main className="bg-[#0D1117] min-h-screen">

      <nav className="bg-[#161B22] border-b border-[#30363D] px-6 py-4 flex items-center justify-between">
        <a href="/dashboard" className="text-[#00D4FF] font-bold text-xl">MatrixVerse</a>
        <div className="flex items-center gap-4">
          <a href="/dashboard" className="text-[#8B949E] hover:text-white text-sm">Dashboard</a>
          <a href={profileUrl} className="text-[#8B949E] hover:text-white text-sm">Profile</a>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-10 pb-20">

        <div className="mb-8">
          <h1 className="text-white font-bold text-3xl mb-1">Settings</h1>
          <p className="text-[#8B949E] text-sm">Manage your account and preferences</p>
        </div>

        {message && (
          <div className="bg-[#00FF8820] border border-[#00FF88] text-[#00FF88] text-sm px-4 py-3 rounded-xl mb-6">
            {message}
          </div>
        )}
        {error && (
          <div className="bg-[#FF475720] border border-[#FF4757] text-[#FF4757] text-sm px-4 py-3 rounded-xl mb-6">
            {error}
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-6">

          <div className="md:w-48 flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={"px-4 py-3 rounded-xl text-sm font-semibold text-left whitespace-nowrap transition-colors " + (
                  activeTab === tab.key
                    ? "bg-[#00D4FF] text-[#0D1117]"
                    : "bg-[#161B22] border border-[#30363D] text-[#8B949E] hover:text-white hover:border-[#00D4FF]"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex-1 bg-[#161B22] border border-[#30363D] rounded-2xl p-6">

            {activeTab === "profile" && (
              <div className="flex flex-col gap-5">
                <h2 className="text-white font-bold text-lg">Profile Settings</h2>

                <div className="flex items-center gap-4 p-4 bg-[#0D1117] rounded-xl">
                  <div className="w-14 h-14 rounded-full bg-[#00D4FF] flex items-center justify-center text-[#0D1117] font-bold text-xl">
                    {profile.username?.charAt(0).toUpperCase() || "?"}
                  </div>
                  <div>
                    <p className="text-white font-semibold">@{profile.username}</p>
                    <p className="text-[#8B949E] text-xs">Avatar uses your username initial</p>
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Username</label>
                  <input type="text" value={profile.username} onChange={(e) => setProfile({ ...profile, username: e.target.value })} className={inputClass} placeholder="your_username" />
                </div>

                <div>
                  <label className={labelClass}>Display Name</label>
                  <input type="text" value={profile.display_name} onChange={(e) => setProfile({ ...profile, display_name: e.target.value })} className={inputClass} placeholder="Your full name" />
                </div>

                <div>
                  <label className={labelClass}>Bio (140 characters max)</label>
                  <textarea value={profile.bio} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} maxLength={140} rows={3} className={inputClass} placeholder="Tell traders about yourself..." />
                  <p className="text-[#8B949E] text-xs mt-1">{profile.bio.length}/140</p>
                </div>

                <div>
                  <label className={labelClass}>Trading Style</label>
                  <select value={profile.trading_style} onChange={(e) => setProfile({ ...profile, trading_style: e.target.value })} className={inputClass}>
                    <option value="">Select style</option>
                    {["ICT", "SMC", "Price Action", "Scalping", "Swing Trading", "Day Trading", "Position Trading"].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Timezone</label>
                  <select value={profile.timezone} onChange={(e) => setProfile({ ...profile, timezone: e.target.value })} className={inputClass}>
                    {["UTC", "UTC+1", "UTC+2", "UTC+3", "UTC+4", "UTC+5", "UTC+6", "UTC+7", "UTC+8", "UTC-5", "UTC-6", "UTC-7", "UTC-8"].map(tz => (
                      <option key={tz} value={tz}>{tz}</option>
                    ))}
                  </select>
                </div>

                <button onClick={saveProfile} disabled={loading} className="bg-[#00D4FF] text-[#0D1117] font-bold py-3 rounded-full text-sm hover:bg-[#00b8d9] transition-colors disabled:opacity-50">
                  {loading ? "Saving..." : "Save Profile"}
                </button>
              </div>
            )}

            {activeTab === "account" && (
              <div className="flex flex-col gap-5">
                <h2 className="text-white font-bold text-lg">Account Settings</h2>

                <div className="p-4 bg-[#0D1117] rounded-xl">
                  <p className="text-[#8B949E] text-xs mb-1">Logged in as</p>
                  <p className="text-white font-semibold">{user.email}</p>
                </div>

                <div className="border-t border-[#30363D] pt-5">
                  <h3 className="text-white font-semibold mb-4">Change Password</h3>
                  <div className="flex flex-col gap-4">
                    <div>
                      <label className={labelClass}>New Password</label>
                      <input type="password" value={passwords.new_password} onChange={(e) => setPasswords({ ...passwords, new_password: e.target.value })} className={inputClass} placeholder="Minimum 6 characters" />
                    </div>
                    <div>
                      <label className={labelClass}>Confirm New Password</label>
                      <input type="password" value={passwords.confirm_password} onChange={(e) => setPasswords({ ...passwords, confirm_password: e.target.value })} className={inputClass} placeholder="Repeat new password" />
                    </div>
                    <button onClick={changePassword} disabled={loading} className="bg-[#7C3AED] text-white font-bold py-3 rounded-full text-sm hover:bg-[#6d28d9] transition-colors disabled:opacity-50">
                      {loading ? "Updating..." : "Change Password"}
                    </button>
                  </div>
                </div>

                <div className="border-t border-[#30363D] pt-5">
                  <h3 className="text-white font-semibold mb-2">Current Plan</h3>
                  <div className="flex items-center justify-between p-4 bg-[#0D1117] rounded-xl">
                    <div>
                      <p className="text-white font-bold">Free Plan</p>
                      <p className="text-[#8B949E] text-xs">Basic features included</p>
                    </div>
                    <a href="/pricing" className="bg-[#00D4FF] text-[#0D1117] font-bold px-4 py-2 rounded-full text-xs hover:bg-[#00b8d9] transition-colors">
                      Upgrade
                    </a>
                  </div>
                </div>

                <div className="border-t border-[#30363D] pt-5">
                  <h3 className="text-[#FF4757] font-semibold mb-2">Danger Zone</h3>
                  <button
                    onClick={() => showMsg("Please contact support to delete your account.", true)}
                    className="border border-[#FF4757] text-[#FF4757] font-semibold py-2 px-5 rounded-full text-sm hover:bg-[#FF4757] hover:text-white transition-colors"
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            )}

            {activeTab === "notifications" && (
              <div className="flex flex-col gap-5">
                <h2 className="text-white font-bold text-lg">Notification Preferences</h2>
                <p className="text-[#8B949E] text-sm">Choose which notifications you want to receive.</p>

                {[
                  { key: "streak_reminders", label: "Streak Reminders", desc: "Remind you if you have not logged a trade today" },
                  { key: "community_replies", label: "Community Replies", desc: "When someone replies to your post" },
                  { key: "drawdown_warnings", label: "Drawdown Warnings", desc: "Alerts when approaching prop firm limits" },
                  { key: "leaderboard_updates", label: "Leaderboard Updates", desc: "When your rank changes on the leaderboard" },
                  { key: "ai_analysis_ready", label: "AI Analysis Ready", desc: "When your trade analysis is complete" },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between p-4 bg-[#0D1117] rounded-xl">
                    <div>
                      <p className="text-white text-sm font-semibold">{item.label}</p>
                      <p className="text-[#8B949E] text-xs mt-0.5">{item.desc}</p>
                    </div>
                    <button
                      onClick={() => setNotifications({ ...notifications, [item.key]: !notifications[item.key] })}
                      className={"w-12 h-6 rounded-full transition-colors relative " + (notifications[item.key] ? "bg-[#00D4FF]" : "bg-[#30363D]")}
                    >
                      <div className={"w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all " + (notifications[item.key] ? "left-6" : "left-0.5")} />
                    </button>
                  </div>
                ))}

                <button onClick={() => showMsg("Notification preferences saved!")} className="bg-[#00D4FF] text-[#0D1117] font-bold py-3 rounded-full text-sm hover:bg-[#00b8d9] transition-colors">
                  Save Preferences
                </button>
              </div>
            )}

            {activeTab === "trading" && (
              <div className="flex flex-col gap-5">
                <h2 className="text-white font-bold text-lg">Trading Defaults</h2>
                <p className="text-[#8B949E] text-sm">These defaults pre-fill your trade journal form.</p>

                <div>
                  <label className={labelClass}>Default Lot Size</label>
                  <input type="number" step="0.01" value={trading.default_lot_size} onChange={(e) => setTrading({ ...trading, default_lot_size: e.target.value })} className={inputClass} placeholder="0.01" />
                </div>

                <div>
                  <label className={labelClass}>Max Daily Trades (overtrading detection)</label>
                  <input type="number" value={trading.max_daily_trades} onChange={(e) => setTrading({ ...trading, max_daily_trades: e.target.value })} className={inputClass} placeholder="5" />
                  <p className="text-[#8B949E] text-xs mt-1">You will be warned if you exceed this number of trades in a day</p>
                </div>

                <div>
                  <label className={labelClass}>Preferred Session</label>
                  <select value={trading.preferred_session} onChange={(e) => setTrading({ ...trading, preferred_session: e.target.value })} className={inputClass}>
                    {["London", "New York", "Asian", "London-NY Overlap"].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <button onClick={() => showMsg("Trading defaults saved!")} className="bg-[#00D4FF] text-[#0D1117] font-bold py-3 rounded-full text-sm hover:bg-[#00b8d9] transition-colors">
                  Save Defaults
                </button>
              </div>
            )}

            {activeTab === "data" && (
              <div className="flex flex-col gap-5">
                <h2 className="text-white font-bold text-lg">Data Management</h2>
                <p className="text-[#8B949E] text-sm">Export or manage your trading data.</p>

                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between p-4 bg-[#0D1117] rounded-xl">
                    <div>
                      <p className="text-white text-sm font-semibold">Export All Trades</p>
                      <p className="text-[#8B949E] text-xs mt-0.5">Download your complete trade history as CSV</p>
                    </div>
                    <button onClick={exportTrades} className="bg-[#00FF8820] border border-[#00FF88] text-[#00FF88] text-xs font-bold px-4 py-2 rounded-full hover:bg-[#00FF88] hover:text-[#0D1117] transition-colors">
                      Export CSV
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-[#0D1117] rounded-xl">
                    <div>
                      <p className="text-white text-sm font-semibold">Export as PDF or Excel</p>
                      <p className="text-[#8B949E] text-xs mt-0.5">Available from the journal page with date filters</p>
                    </div>
                    <a href="/journal" className="bg-[#7C3AED20] border border-[#7C3AED] text-[#7C3AED] text-xs font-bold px-4 py-2 rounded-full hover:bg-[#7C3AED] hover:text-white transition-colors">
                      Open Journal
                    </a>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-[#0D1117] rounded-xl border border-[#FF475740]">
                    <div>
                      <p className="text-[#FF4757] text-sm font-semibold">Delete All Trades</p>
                      <p className="text-[#8B949E] text-xs mt-0.5">Permanently remove all your trade records</p>
                    </div>
                    <button onClick={deleteAllTrades} disabled={loading} className="bg-[#FF475720] border border-[#FF4757] text-[#FF4757] text-xs font-bold px-4 py-2 rounded-full hover:bg-[#FF4757] hover:text-white transition-colors disabled:opacity-50">
                      Delete All
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
<MobileNav username={user?.user_metadata?.username || user?.email} />
    </main>
  );
}
