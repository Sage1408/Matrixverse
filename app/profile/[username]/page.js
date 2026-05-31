"use client";

import MobileNav from "../../components/MobileNav";
import ThemeToggle from "../../components/ThemeToggle"
import { Skeleton, SkeletonCard, SkeletonText, SkeletonProfile } from "../../components/Skeleton"
import { use, useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";

export default function Profile({ params }) {
  const { username } = use(params);
  const [currentUser, setCurrentUser] = useState(null);
  const [profileRow, setProfileRow] = useState(null);
  const [trades, setTrades] = useState([]);
  const [posts, setPosts] = useState([]);
  const [checkins, setCheckins] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState("posts");
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const [editingPostId, setEditingPostId] = useState(null);
  const [editForm, setEditForm] = useState({ content: "", pair_tag: "", post_type: "" });
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [badgesData, setBadgesData] = useState({ earned: [], all: [] });
  const router = useRouter();

  const handleFollow = async () => {
    if (!currentUser) return;
    setFollowLoading(true);
    const currentUsername = currentUser.user_metadata?.username || currentUser.email;

    if (isFollowing) {
      await supabase.from("follows").delete()
        .eq("follower_username", currentUsername)
        .eq("following_username", username);
      setIsFollowing(false);
      setFollowers(prev => prev.filter(f => f.follower_username !== currentUsername));
    } else {
      await supabase.from("follows").insert([{
        follower_id: String(currentUser.id),
        following_id: username,
        follower_username: currentUsername,
        following_username: username,
      }]);
      setIsFollowing(true);
      setFollowers(prev => [...prev, { follower_username: currentUsername }]);

      if (profileRow) {
        const notifUserId = profileRow.user_id;
        if (notifUserId && String(notifUserId) !== String(currentUser.id)) {
          const { data: recipient } = await supabase
            .from("profiles")
            .select("notification_prefs")
            .eq("user_id", String(notifUserId))
            .single();
          if (recipient?.notification_prefs?.community_replies !== false) {
            await supabase.from("notifications").insert([{
              user_id: String(notifUserId),
              type: "follow",
              message: currentUsername + " started following you",
              is_read: false,
              link: "/profile/" + currentUsername,
            }]);
            fetch("/api/send-push", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                user_id: notifUserId,
                title: "MatrixVerse",
                body: currentUsername + " started following you",
                url: "/profile/" + currentUsername,
              }),
            }).catch(() => {});
          }
        }
      }
    }
    setFollowLoading(false);
  };

  const wins = trades.filter(t => t.pnl > 0).length;
  const losses = trades.filter(t => t.pnl < 0).length;
  const winRate = trades.length > 0 ? Math.round((wins / trades.length) * 100) : 0;
  const netPnL = trades.reduce((sum, t) => sum + (t.pnl || 0), 0).toFixed(2);
  const avgRR = trades.length > 0
    ? (trades.reduce((sum, t) => sum + (t.rr_ratio || 0), 0) / trades.length).toFixed(2)
    : 0;

  const getSession = (ts) => {
    const hour = new Date(ts).getUTCHours();
    if (hour >= 0 && hour < 8) return "Asian";
    if (hour >= 8 && hour < 17) return "London";
    return "New York";
  };

  const calcWinRateBy = (key) => {
    const groups = {};
    trades.forEach(t => {
      const k = key === "session" ? getSession(t.traded_at) : t[key] || "Unknown";
      if (!groups[k]) groups[k] = { total: 0, wins: 0 };
      groups[k].total++;
      if (t.pnl > 0) groups[k].wins++;
    });
    return Object.entries(groups).sort((a, b) => b[1].total - a[1].total);
  };

  const byPair = calcWinRateBy("pair");
  const byStrategy = calcWinRateBy("strategy");
  const bySession = calcWinRateBy("session");

  const calcPsychScore = () => {
    if (checkins.length === 0) return null;
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
  const score = calcPsychScore();

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return seconds + "s ago";
    if (seconds < 3600) return Math.floor(seconds / 60) + "m ago";
    if (seconds < 86400) return Math.floor(seconds / 3600) + "h ago";
    return Math.floor(seconds / 86400) + "d ago";
  };

  const getPostTypeColor = (type) => {
    const map = {
      "Trade Setup": "#00D4FF", "Market Analysis": "#7C3AED",
      "Profit Update": "#00FF88", "Psychology": "#FFD700",
      "Educational": "#FF6B35", "Meme": "#FF4757",
    };
    return map[type] || "#8B949E";
  };

  const isOwnProfile = currentUser?.user_metadata?.username === username;

  if (loading) return (
    <main className="bg-[var(--bg-primary)] min-h-screen flex items-center justify-center">
      <div className="w-full max-w-3xl px-6 space-y-6">
        <SkeletonProfile />
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
           <a href="/education" className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-sm">Learn</a>
           <a href="/glossary" className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-sm">Glossary</a>
          <a href="/analytics" className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-sm">Analytics</a>
          <a href="/community" className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-sm">Community</a>
          <a href="/leaderboard" className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-sm">Leaderboard</a>
          {isOwnProfile && (
            <a href="/settings" className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-sm">Settings</a>
          )}
        </div>
        <div className="md:hidden">
          <ThemeToggle />
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-10 pb-24">

        <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-[var(--accent-blue)] flex items-center justify-center text-[var(--bg-primary)] font-bold text-2xl overflow-hidden">
                {profileRow?.avatar_url ? (
                  <img src={profileRow.avatar_url} alt={username} className="w-full h-full object-cover" />
                ) : (
                  username?.charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <h1 className="text-[var(--text-primary)] font-bold text-xl">@{username}</h1>
                <p className="text-[var(--text-muted)] text-sm mt-0.5">{profileRow?.display_name || "MatrixVerse Trader"}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="bg-[var(--accent-blue-bg)] text-[var(--accent-blue)] text-xs font-bold px-2 py-0.5 rounded-full">Trader</span>
                  {score && score >= 75 && (
                    <span className="bg-[var(--accent-green-bg)] text-[var(--accent-green)] text-xs font-bold px-2 py-0.5 rounded-full">Strong Mindset</span>
                  )}
                  {trades.length >= 10 && (
                    <span className="bg-[var(--accent-gold-bg)] text-[var(--accent-gold)] text-xs font-bold px-2 py-0.5 rounded-full">Active Trader</span>
                  )}
                </div>
              </div>
            </div>
            {isOwnProfile ? (
              <a href="/settings" className="border border-[var(--border)] text-[var(--text-muted)] text-xs font-semibold px-4 py-2 rounded-full hover:border-[var(--hover-border)] hover:text-[var(--text-primary)] transition-colors">
                Edit Profile
              </a>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleFollow}
                  disabled={followLoading}
                  className={"text-xs font-bold px-5 py-2 rounded-full transition-colors disabled:opacity-50 " + (
                    isFollowing
                      ? "border border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--accent-red)] hover:text-[var(--accent-red)]"
                      : "bg-[var(--accent-blue)] text-[var(--bg-primary)] hover:bg-[var(--accent-blue-hover)]"
                  )}
                >
                  {followLoading ? "..." : isFollowing ? "Following ✓" : "Follow"}
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 md:grid-cols-5 gap-3 pt-4 border-t border-[var(--border)]">
            {[
              { label: "Trades", value: trades.length, color: "#00D4FF" },
              { label: "Win Rate", value: winRate + "%", color: "#00FF88" },
              { label: "Net PnL", value: "$" + netPnL, color: parseFloat(netPnL) >= 0 ? "#00FF88" : "#FF4757" },
              { label: "Followers", value: followers.length, color: "#7C3AED" },
              { label: "Following", value: following.length, color: "#FF6B35" },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="font-bold text-lg" style={{ color: stat.color }}>{stat.value}</div>
                <div className="text-[var(--text-muted)] text-xs">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Badges Section */}
        {badgesData.all?.length > 0 && (
          <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-6 mb-6">
            <h3 className="text-[var(--text-primary)] font-bold mb-4">🏅 Achievements</h3>
            <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
              {badgesData.all?.map(badge => {
                const earned = badgesData.earned?.find(b => b.id === badge.id)
                return (
                  <div key={badge.id} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${earned ? "bg-[var(--accent-blue-bg)]" : "opacity-30"}`}>
                    <span className="text-2xl">{badge.icon}</span>
                    <span className="text-[10px] font-semibold text-center leading-tight text-[var(--text-muted)]">{badge.name}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div className="flex gap-2 mb-6">
          {[
            { key: "posts", label: "📝 Posts" },
            { key: "trades", label: "📊 Trades" },
            { key: "stats", label: "📈 Stats" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={"px-4 py-2 rounded-full text-sm font-semibold transition-colors " + (
                activeTab === tab.key
                  ? "bg-[var(--accent-blue)] text-[var(--bg-primary)]"
                  : "border border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--accent-blue)] hover:text-[var(--accent-blue)]"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "posts" && (
          <div className="flex flex-col gap-4">
            {posts.length === 0 ? (
              <div className="text-center py-16 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl">
                <div className="text-4xl mb-3">📝</div>
                <p className="text-[var(--text-muted)] text-sm">No posts yet</p>
                {isOwnProfile && (
                  <a href="/community" className="inline-block mt-4 bg-[var(--accent-blue)] text-[var(--bg-primary)] font-bold px-5 py-2 rounded-full text-xs hover:bg-[var(--accent-blue-hover)] transition-colors">
                    Create First Post
                  </a>
                )}
              </div>
            ) : (
              posts.map((post) => (
                <div key={post.id} className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-[var(--text-muted)] text-xs">{getTimeAgo(post.created_at)}</div>
                    <div className="flex items-center gap-2">
                      {post.pair_tag && (
                        <span className="bg-[var(--accent-blue-bg)] text-[var(--accent-blue)] text-xs font-bold px-2 py-1 rounded-full">{post.pair_tag}</span>
                      )}
                      {!editingPostId && (
                        <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ backgroundColor: getPostTypeColor(post.post_type) + "20", color: getPostTypeColor(post.post_type) }}>
                          {post.post_type}
                        </span>
                      )}
                    </div>
                  </div>

                  {editingPostId === post.id ? (
                    <div className="flex flex-col gap-3 mb-3">
                      <textarea
                        value={editForm.content}
                        onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                        className="w-full bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent-blue)] resize-none"
                        rows={3}
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <select value={editForm.pair_tag} onChange={(e) => setEditForm({ ...editForm, pair_tag: e.target.value })} className="bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent-blue)]">
                          <option value="">No pair</option>
                          {["EURUSD","GBPUSD","USDJPY","XAUUSD","USDCAD","AUDUSD","NZDUSD","USDCHF","GBPJPY","EURJPY","BTCUSD","ETHUSD"].map(p => (
                            <option key={p} value={p}>{p}</option>
                          ))}
                        </select>
                        <select value={editForm.post_type} onChange={(e) => setEditForm({ ...editForm, post_type: e.target.value })} className="bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent-blue)]">
                          {["Trade Setup","Market Analysis","Profit Update","Psychology","Educational","Meme"].map(t => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <button onClick={cancelEdit} className="border border-[var(--border)] text-[var(--text-muted)] text-xs font-bold px-4 py-2 rounded-full hover:border-[var(--hover-border)] hover:text-[var(--text-primary)] transition-colors">Cancel</button>
                        <button onClick={() => saveEdit(post.id)} disabled={saving || !editForm.content.trim()} className="bg-[var(--accent-blue)] text-[var(--bg-primary)] text-xs font-bold px-4 py-2 rounded-full hover:bg-[var(--accent-blue-hover)] transition-colors disabled:opacity-50">
                          {saving ? "Saving..." : "Save"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[var(--text-secondary)] text-sm leading-relaxed mb-3">{post.content}</p>
                  )}

                  {post.image_url && (
                    <img src={post.image_url} alt="chart" className="w-full rounded-xl border border-[var(--border)] mb-3" />
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-[var(--border)]">
                    <div className="flex items-center gap-4">
                      <span className="text-[var(--text-muted)] text-xs">❤️ {post.likes || 0} likes</span>
                      <a href="/community" className="text-[var(--accent-blue)] text-xs hover:underline">View in Community</a>
                    </div>
                    {isOwnProfile && editingPostId !== post.id && (
                      <div className="flex items-center gap-2">
                        <button onClick={() => startEdit(post)} className="text-[var(--text-muted)] hover:text-[var(--accent-blue)] text-xs transition-colors">Edit</button>
                        {deleteConfirm === post.id ? (
                          <div className="flex items-center gap-1">
                            <button onClick={() => executeDelete(post.id)} className="text-[var(--accent-red)] text-xs font-bold hover:underline">Delete</button>
                            <button onClick={() => setDeleteConfirm(null)} className="text-[var(--text-muted)] text-xs hover:text-[var(--text-primary)]">Cancel</button>
                          </div>
                        ) : (
                          <button onClick={() => setDeleteConfirm(post.id)} className="text-[var(--text-muted)] hover:text-[var(--accent-red)] text-xs transition-colors">Delete</button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "trades" && (
          <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl overflow-hidden">
            {trades.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-4xl mb-3">📊</div>
                <p className="text-[var(--text-muted)] text-sm">No trades logged yet</p>
                {isOwnProfile && (
                  <a href="/journal" className="inline-block mt-4 bg-[var(--accent-blue)] text-[var(--bg-primary)] font-bold px-5 py-2 rounded-full text-xs">
                    Log First Trade
                  </a>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[var(--border)]">
                      {["Pair","Dir","PnL","RR","Tags","Strategy","Date"].map(h => (
                        <th key={h} className="text-[var(--text-muted)] text-xs px-4 py-3 text-left">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {trades.map((trade, i) => (
                      <tr key={i} className="border-b border-[var(--border)] hover:bg-[var(--bg-tertiary)]">
                        <td className="px-4 py-3 text-[var(--accent-blue)] font-bold text-sm">{trade.pair}</td>
                        <td className="px-4 py-3">
                          <span className={"text-xs font-bold px-2 py-0.5 rounded-full " + (trade.direction === "buy" ? "bg-[var(--accent-green-bg)] text-[var(--accent-green)]" : "bg-[var(--accent-red-bg)] text-[var(--accent-red)]")}>
                            {trade.direction?.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-bold text-sm" style={{ color: trade.pnl >= 0 ? "#00FF88" : "#FF4757" }}>
                          {trade.pnl >= 0 ? "+" : ""}${trade.pnl}
                        </td>
                        <td className="px-4 py-3 text-[var(--accent-gold)] text-sm">{trade.rr_ratio ? trade.rr_ratio + "R" : "-"}</td>
                        <td className="px-4 py-3">
                          {trade.tags && trade.tags.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {trade.tags.map((tag, i) => (
                                <span key={i} className="bg-[var(--accent-blue-bg)] text-[var(--accent-blue)] text-[10px] font-bold px-1.5 py-0.5 rounded-full">{tag}</span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[var(--text-muted)] text-xs">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-[var(--text-muted)] text-sm">{trade.strategy || "-"}</td>
                        <td className="px-4 py-3 text-[var(--text-muted)] text-xs">{new Date(trade.traded_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === "stats" && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total Trades", value: trades.length, color: "#00D4FF", icon: "📊" },
                { label: "Wins", value: wins, color: "#00FF88", icon: "✅" },
                { label: "Losses", value: losses, color: "#FF4757", icon: "❌" },
                { label: "Win Rate", value: winRate + "%", color: "#FFD700", icon: "🎯" },
              ].map((stat, i) => (
                <div key={i} className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-4 text-center">
                  <div className="text-2xl mb-1">{stat.icon}</div>
                  <div className="font-bold text-xl" style={{ color: stat.color }}>{stat.value}</div>
                  <div className="text-[var(--text-muted)] text-xs">{stat.label}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-5 text-center">
                <p className="text-[var(--text-muted)] text-xs mb-2">Net PnL</p>
                <div className="font-bold text-2xl" style={{ color: parseFloat(netPnL) >= 0 ? "#00FF88" : "#FF4757" }}>${netPnL}</div>
              </div>
              <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-5 text-center">
                <p className="text-[var(--text-muted)] text-xs mb-2">Avg RR Ratio</p>
                <div className="font-bold text-2xl text-[var(--accent-gold)]">{avgRR}R</div>
              </div>
              <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-5 text-center">
                <p className="text-[var(--text-muted)] text-xs mb-2">Psychology Score</p>
                <div className="font-bold text-2xl" style={{ color: score ? (score >= 75 ? "#00FF88" : score >= 50 ? "#FFD700" : "#FF4757") : "#8B949E" }}>
                  {score || "--"}
                </div>
              </div>
            </div>

            {trades.length > 0 ? (
              <>
                <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-5">
                  <h3 className="text-[var(--text-primary)] font-bold mb-4">Win Rate by Pair</h3>
                  <div className="flex flex-col gap-3">
                    {byPair.map(([pair, data]) => {
                      const rate = Math.round((data.wins / data.total) * 100);
                      return (
                        <div key={pair} className="flex items-center gap-3">
                          <span className="text-[var(--accent-blue)] font-bold text-sm w-20">{pair}</span>
                          <div className="flex-1 h-3 bg-[var(--border)] rounded-full overflow-hidden flex">
                            <div className="h-full bg-[var(--accent-green)] rounded-l-full" style={{ width: rate + "%" }} />
                            {rate < 100 && <div className="h-full bg-[var(--accent-red)] rounded-r-full" style={{ width: (100 - rate) + "%" }} />}
                          </div>
                          <span className="text-[var(--text-secondary)] text-xs font-bold w-14 text-right">{rate}%</span>
                          <span className="text-[var(--text-muted)] text-xs w-16 text-right">{data.wins}/{data.total}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-5">
                    <h3 className="text-[var(--text-primary)] font-bold mb-4">Win Rate by Session</h3>
                    <div className="flex flex-col gap-3">
                      {bySession.map(([session, data]) => {
                        const rate = Math.round((data.wins / data.total) * 100);
                        const colors = { Asian: "#00D4FF", London: "#7C3AED", "New York": "#FF6B35" };
                        return (
                          <div key={session} className="flex items-center gap-3">
                            <span className="text-sm w-20 font-semibold" style={{ color: colors[session] || "#8B949E" }}>{session}</span>
                            <div className="flex-1 h-3 bg-[var(--border)] rounded-full overflow-hidden flex">
                              <div className="h-full bg-[var(--accent-green)] rounded-l-full" style={{ width: rate + "%" }} />
                              {rate < 100 && <div className="h-full bg-[var(--accent-red)] rounded-r-full" style={{ width: (100 - rate) + "%" }} />}
                            </div>
                            <span className="text-[var(--text-secondary)] text-xs font-bold w-14 text-right">{rate}%</span>
                            <span className="text-[var(--text-muted)] text-xs w-16 text-right">{data.wins}/{data.total}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-5">
                    <h3 className="text-[var(--text-primary)] font-bold mb-4">Win Rate by Strategy</h3>
                    <div className="flex flex-col gap-3">
                      {byStrategy.map(([strategy, data]) => {
                        const rate = Math.round((data.wins / data.total) * 100);
                        return (
                          <div key={strategy} className="flex items-center gap-3">
                            <span className="text-[var(--text-secondary)] text-sm w-24 truncate">{strategy}</span>
                            <div className="flex-1 h-3 bg-[var(--border)] rounded-full overflow-hidden flex">
                              <div className="h-full bg-[var(--accent-green)] rounded-l-full" style={{ width: rate + "%" }} />
                              {rate < 100 && <div className="h-full bg-[var(--accent-red)] rounded-r-full" style={{ width: (100 - rate) + "%" }} />}
                            </div>
                            <span className="text-[var(--text-secondary)] text-xs font-bold w-14 text-right">{rate}%</span>
                            <span className="text-[var(--text-muted)] text-xs w-16 text-right">{data.wins}/{data.total}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-10 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl">
                <div className="text-4xl mb-3">📈</div>
                <p className="text-[var(--text-muted)] text-sm">No stats yet. Log some trades first!</p>
              </div>
            )}
          </div>
        )}

      </div>
<MobileNav username={currentUser?.user_metadata?.username || currentUser?.email} />
    </main>
  );
}
