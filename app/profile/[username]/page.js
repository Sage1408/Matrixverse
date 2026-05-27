"use client";

import MobileNav from "../../components/MobileNav";
import { use, useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";

export default function Profile({ params }) {
  const { username } = use(params);
  const [currentUser, setCurrentUser] = useState(null);
  const [trades, setTrades] = useState([]);
  const [posts, setPosts] = useState([]);
  const [checkins, setCheckins] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState("posts");
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setCurrentUser(user);
      await loadProfileData();
      await loadFollowData(user);
      setLoading(false);
    };
    init();
  }, [username]);

  const loadProfileData = async () => {
    const { data: postsData } = await supabase
      .from("posts")
      .select("*")
      .eq("username", username)
      .order("created_at", { ascending: false });
    if (postsData) setPosts(postsData);

    if (postsData && postsData.length > 0) {
      const userId = postsData[0].user_id;
      const { data: tradesData } = await supabase
        .from("trades").select("*").eq("user_id", userId)
        .order("traded_at", { ascending: false });
      if (tradesData) setTrades(tradesData);

      const { data: checkinsData } = await supabase
        .from("checkins").select("*").eq("user_id", userId)
        .order("checked_in_at", { ascending: false });
      if (checkinsData) setCheckins(checkinsData);
    }
  };

  const loadFollowData = async (user) => {
    const { data: followersData } = await supabase
      .from("follows")
      .select("*")
      .eq("following_username", username);
    if (followersData) setFollowers(followersData);

    const { data: followingData } = await supabase
      .from("follows")
      .select("*")
      .eq("follower_username", username);
    if (followingData) setFollowing(followingData);

    const currentUsername = user.user_metadata?.username || user.email;
    const alreadyFollowing = followersData?.some(f => f.follower_username === currentUsername);
    setIsFollowing(alreadyFollowing || false);
  };

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
    <main className="bg-[#0D1117] min-h-screen flex items-center justify-center">
      <p className="text-[#8B949E]">Loading profile...</p>
    </main>
  );

  return (
    <main className="bg-[#0D1117] min-h-screen">

      <nav className="bg-[#161B22] border-b border-[#30363D] px-6 py-4 flex items-center justify-between">
        <a href="/dashboard" className="text-[#00D4FF] font-bold text-xl">MatrixVerse</a>
        <div className="flex items-center gap-4">
          <a href="/dashboard" className="text-[#8B949E] hover:text-white text-sm">Dashboard</a>
          <a href="/community" className="text-[#8B949E] hover:text-white text-sm">Community</a>
          <a href="/leaderboard" className="text-[#8B949E] hover:text-white text-sm">Leaderboard</a>
          {isOwnProfile && (
            <a href="/settings" className="text-[#8B949E] hover:text-white text-sm">Settings</a>
          )}
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-10 pb-20">

        <div className="bg-[#161B22] border border-[#30363D] rounded-2xl p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-[#00D4FF] flex items-center justify-center text-[#0D1117] font-bold text-2xl">
                {username?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-white font-bold text-xl">@{username}</h1>
                <p className="text-[#8B949E] text-sm mt-0.5">MatrixVerse Trader</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="bg-[#00D4FF20] text-[#00D4FF] text-xs font-bold px-2 py-0.5 rounded-full">Trader</span>
                  {score && score >= 75 && (
                    <span className="bg-[#00FF8820] text-[#00FF88] text-xs font-bold px-2 py-0.5 rounded-full">Strong Mindset</span>
                  )}
                  {trades.length >= 10 && (
                    <span className="bg-[#FFD70020] text-[#FFD700] text-xs font-bold px-2 py-0.5 rounded-full">Active Trader</span>
                  )}
                </div>
              </div>
            </div>
            {isOwnProfile ? (
              <a href="/settings" className="border border-[#30363D] text-[#8B949E] text-xs font-semibold px-4 py-2 rounded-full hover:border-white hover:text-white transition-colors">
                Edit Profile
              </a>
            ) : (
              <button
                onClick={handleFollow}
                disabled={followLoading}
                className={"text-xs font-bold px-5 py-2 rounded-full transition-colors disabled:opacity-50 " + (
                  isFollowing
                    ? "border border-[#30363D] text-[#8B949E] hover:border-[#FF4757] hover:text-[#FF4757]"
                    : "bg-[#00D4FF] text-[#0D1117] hover:bg-[#00b8d9]"
                )}
              >
                {followLoading ? "..." : isFollowing ? "Following ✓" : "Follow"}
              </button>
            )}
          </div>

          <div className="grid grid-cols-3 md:grid-cols-5 gap-3 pt-4 border-t border-[#30363D]">
            {[
              { label: "Trades", value: trades.length, color: "#00D4FF" },
              { label: "Win Rate", value: winRate + "%", color: "#00FF88" },
              { label: "Net PnL", value: "$" + netPnL, color: parseFloat(netPnL) >= 0 ? "#00FF88" : "#FF4757" },
              { label: "Followers", value: followers.length, color: "#7C3AED" },
              { label: "Following", value: following.length, color: "#FF6B35" },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="font-bold text-lg" style={{ color: stat.color }}>{stat.value}</div>
                <div className="text-[#8B949E] text-xs">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

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
                  ? "bg-[#00D4FF] text-[#0D1117]"
                  : "border border-[#30363D] text-[#8B949E] hover:border-[#00D4FF] hover:text-[#00D4FF]"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "posts" && (
          <div className="flex flex-col gap-4">
            {posts.length === 0 ? (
              <div className="text-center py-16 bg-[#161B22] border border-[#30363D] rounded-2xl">
                <div className="text-4xl mb-3">📝</div>
                <p className="text-[#8B949E] text-sm">No posts yet</p>
                {isOwnProfile && (
                  <a href="/community" className="inline-block mt-4 bg-[#00D4FF] text-[#0D1117] font-bold px-5 py-2 rounded-full text-xs hover:bg-[#00b8d9] transition-colors">
                    Create First Post
                  </a>
                )}
              </div>
            ) : (
              posts.map((post) => (
                <div key={post.id} className="bg-[#161B22] border border-[#30363D] rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-[#8B949E] text-xs">{getTimeAgo(post.created_at)}</div>
                    <div className="flex items-center gap-2">
                      {post.pair_tag && (
                        <span className="bg-[#00D4FF20] text-[#00D4FF] text-xs font-bold px-2 py-1 rounded-full">{post.pair_tag}</span>
                      )}
                      <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ backgroundColor: getPostTypeColor(post.post_type) + "20", color: getPostTypeColor(post.post_type) }}>
                        {post.post_type}
                      </span>
                    </div>
                  </div>
                  <p className="text-[#C9D1D9] text-sm leading-relaxed mb-3">{post.content}</p>
                  {post.image_url && (
                    <img src={post.image_url} alt="chart" className="w-full rounded-xl border border-[#30363D] mb-3" />
                  )}
                  <div className="flex items-center gap-4 pt-3 border-t border-[#30363D]">
                    <span className="text-[#8B949E] text-xs">❤️ {post.likes || 0} likes</span>
                    <a href="/community" className="text-[#00D4FF] text-xs hover:underline">View in Community</a>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "trades" && (
          <div className="bg-[#161B22] border border-[#30363D] rounded-2xl overflow-hidden">
            {trades.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-4xl mb-3">📊</div>
                <p className="text-[#8B949E] text-sm">No trades logged yet</p>
                {isOwnProfile && (
                  <a href="/journal" className="inline-block mt-4 bg-[#00D4FF] text-[#0D1117] font-bold px-5 py-2 rounded-full text-xs">
                    Log First Trade
                  </a>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#30363D]">
                      {["Pair","Dir","PnL","RR","Strategy","Date"].map(h => (
                        <th key={h} className="text-[#8B949E] text-xs px-4 py-3 text-left">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {trades.map((trade, i) => (
                      <tr key={i} className="border-b border-[#30363D] hover:bg-[#1A2332]">
                        <td className="px-4 py-3 text-[#00D4FF] font-bold text-sm">{trade.pair}</td>
                        <td className="px-4 py-3">
                          <span className={"text-xs font-bold px-2 py-0.5 rounded-full " + (trade.direction === "buy" ? "bg-[#00FF8820] text-[#00FF88]" : "bg-[#FF475720] text-[#FF4757]")}>
                            {trade.direction?.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-bold text-sm" style={{ color: trade.pnl >= 0 ? "#00FF88" : "#FF4757" }}>
                          {trade.pnl >= 0 ? "+" : ""}${trade.pnl}
                        </td>
                        <td className="px-4 py-3 text-[#FFD700] text-sm">{trade.rr_ratio ? trade.rr_ratio + "R" : "-"}</td>
                        <td className="px-4 py-3 text-[#8B949E] text-sm">{trade.strategy || "-"}</td>
                        <td className="px-4 py-3 text-[#8B949E] text-xs">{new Date(trade.traded_at).toLocaleDateString()}</td>
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
                <div key={i} className="bg-[#161B22] border border-[#30363D] rounded-2xl p-4 text-center">
                  <div className="text-2xl mb-1">{stat.icon}</div>
                  <div className="font-bold text-xl" style={{ color: stat.color }}>{stat.value}</div>
                  <div className="text-[#8B949E] text-xs">{stat.label}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#161B22] border border-[#30363D] rounded-2xl p-5 text-center">
                <p className="text-[#8B949E] text-xs mb-2">Net PnL</p>
                <div className="font-bold text-2xl" style={{ color: parseFloat(netPnL) >= 0 ? "#00FF88" : "#FF4757" }}>${netPnL}</div>
              </div>
              <div className="bg-[#161B22] border border-[#30363D] rounded-2xl p-5 text-center">
                <p className="text-[#8B949E] text-xs mb-2">Avg RR Ratio</p>
                <div className="font-bold text-2xl text-[#FFD700]">{avgRR}R</div>
              </div>
              <div className="bg-[#161B22] border border-[#30363D] rounded-2xl p-5 text-center">
                <p className="text-[#8B949E] text-xs mb-2">Psychology Score</p>
                <div className="font-bold text-2xl" style={{ color: score ? (score >= 75 ? "#00FF88" : score >= 50 ? "#FFD700" : "#FF4757") : "#8B949E" }}>
                  {score || "--"}
                </div>
              </div>
            </div>

            {trades.length > 0 ? (
              <>
                <div className="bg-[#161B22] border border-[#30363D] rounded-2xl p-5">
                  <h3 className="text-white font-bold mb-4">Win Rate by Pair</h3>
                  <div className="flex flex-col gap-3">
                    {byPair.map(([pair, data]) => {
                      const rate = Math.round((data.wins / data.total) * 100);
                      return (
                        <div key={pair} className="flex items-center gap-3">
                          <span className="text-[#00D4FF] font-bold text-sm w-20">{pair}</span>
                          <div className="flex-1 h-3 bg-[#30363D] rounded-full overflow-hidden flex">
                            <div className="h-full bg-[#00FF88] rounded-l-full" style={{ width: rate + "%" }} />
                            {rate < 100 && <div className="h-full bg-[#FF4757] rounded-r-full" style={{ width: (100 - rate) + "%" }} />}
                          </div>
                          <span className="text-[#C9D1D9] text-xs font-bold w-14 text-right">{rate}%</span>
                          <span className="text-[#8B949E] text-xs w-16 text-right">{data.wins}/{data.total}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-[#161B22] border border-[#30363D] rounded-2xl p-5">
                    <h3 className="text-white font-bold mb-4">Win Rate by Session</h3>
                    <div className="flex flex-col gap-3">
                      {bySession.map(([session, data]) => {
                        const rate = Math.round((data.wins / data.total) * 100);
                        const colors = { Asian: "#00D4FF", London: "#7C3AED", "New York": "#FF6B35" };
                        return (
                          <div key={session} className="flex items-center gap-3">
                            <span className="text-sm w-20 font-semibold" style={{ color: colors[session] || "#8B949E" }}>{session}</span>
                            <div className="flex-1 h-3 bg-[#30363D] rounded-full overflow-hidden flex">
                              <div className="h-full bg-[#00FF88] rounded-l-full" style={{ width: rate + "%" }} />
                              {rate < 100 && <div className="h-full bg-[#FF4757] rounded-r-full" style={{ width: (100 - rate) + "%" }} />}
                            </div>
                            <span className="text-[#C9D1D9] text-xs font-bold w-14 text-right">{rate}%</span>
                            <span className="text-[#8B949E] text-xs w-16 text-right">{data.wins}/{data.total}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="bg-[#161B22] border border-[#30363D] rounded-2xl p-5">
                    <h3 className="text-white font-bold mb-4">Win Rate by Strategy</h3>
                    <div className="flex flex-col gap-3">
                      {byStrategy.map(([strategy, data]) => {
                        const rate = Math.round((data.wins / data.total) * 100);
                        return (
                          <div key={strategy} className="flex items-center gap-3">
                            <span className="text-[#C9D1D9] text-sm w-24 truncate">{strategy}</span>
                            <div className="flex-1 h-3 bg-[#30363D] rounded-full overflow-hidden flex">
                              <div className="h-full bg-[#00FF88] rounded-l-full" style={{ width: rate + "%" }} />
                              {rate < 100 && <div className="h-full bg-[#FF4757] rounded-r-full" style={{ width: (100 - rate) + "%" }} />}
                            </div>
                            <span className="text-[#C9D1D9] text-xs font-bold w-14 text-right">{rate}%</span>
                            <span className="text-[#8B949E] text-xs w-16 text-right">{data.wins}/{data.total}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-10 bg-[#161B22] border border-[#30363D] rounded-2xl">
                <div className="text-4xl mb-3">📈</div>
                <p className="text-[#8B949E] text-sm">No stats yet. Log some trades first!</p>
              </div>
            )}
          </div>
        )}

      </div>
<MobileNav username={currentUser?.user_metadata?.username || currentUser?.email} />
    </main>
  );
}
