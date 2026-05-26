"use client";

import MobileNav from "../components/MobileNav";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";

export const metadata = {
  title: "Search Traders",
  description: "Find and follow traders on MatrixVerse.",
};

export default function Search() {
  const [user, setUser] = useState(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [allTraders, setAllTraders] = useState([]);
  const [traderStats, setTraderStats] = useState({});
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setUser(user);
      await fetchAllTraders(user);
    };
    init();
  }, []);

  const fetchAllTraders = async (currentUser) => {
    setLoading(true);

    // Get all unique usernames from posts
    const { data: postsData } = await supabase
      .from("posts")
      .select("user_id, username");

    // Get all unique usernames from checkins
    const { data: checkinsData } = await supabase
      .from("checkins")
      .select("user_id");

    // Get all unique usernames from trades
    const { data: tradesData } = await supabase
      .from("trades")
      .select("user_id");

    const tradersMap = {};

    // Add from posts — these have usernames
    if (postsData) {
      postsData.forEach(p => {
        if (!tradersMap[p.user_id]) {
          tradersMap[p.user_id] = {
            user_id: p.user_id,
            username: p.username,
          };
        }
      });
    }

    // Add current user if not already there
    const currentUsername = currentUser.user_metadata?.username || currentUser.email;
    if (!tradersMap[currentUser.id]) {
      tradersMap[currentUser.id] = {
        user_id: currentUser.id,
        username: currentUsername,
      };
    }

    const unique = Object.values(tradersMap);
    setAllTraders(unique);
    setResults(unique);

    // Load stats for each trader
    const statsMap = {};
    for (const trader of unique) {
      const { data } = await supabase
        .from("trades")
        .select("pnl")
        .eq("user_id", trader.user_id);
      if (!data || data.length === 0) {
        statsMap[trader.user_id] = { total: 0, winRate: 0 };
      } else {
        const wins = data.filter(t => t.pnl > 0).length;
        statsMap[trader.user_id] = {
          total: data.length,
          winRate: Math.round((wins / data.length) * 100),
        };
      }
    }
    setTraderStats(statsMap);
    setLoading(false);
  };

  const handleSearch = (e) => {
    const val = e.target.value;
    setQuery(val);
    if (val.trim() === "") {
      setResults(allTraders);
    } else {
      const filtered = allTraders.filter(t =>
        t.username?.toLowerCase().includes(val.toLowerCase())
      );
      setResults(filtered);
    }
  };

  const clearSearch = () => {
    setQuery("");
    setResults(allTraders);
  };

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
          <a href="/community" className="text-[#8B949E] hover:text-white text-sm">Community</a>
          <a href="/leaderboard" className="text-[#8B949E] hover:text-white text-sm">Leaderboard</a>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-10 pb-20">

        <div className="mb-8">
          <h1 className="text-white font-bold text-3xl mb-1">Search Traders</h1>
          <p className="text-[#8B949E] text-sm">Find and visit any trader profile</p>
        </div>

        <div className="relative mb-6">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8B949E] text-lg">🔍</span>
          <input
            type="text"
            placeholder="Search by username..."
            value={query}
            onChange={handleSearch}
            autoFocus
            className="w-full bg-[#161B22] border border-[#30363D] text-white placeholder-[#8B949E] rounded-2xl pl-12 pr-12 py-4 text-sm focus:outline-none focus:border-[#00D4FF] transition-colors"
          />
          {query && (
            <button
              onClick={clearSearch}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8B949E] hover:text-white text-sm font-bold"
            >
              X
            </button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-16">
            <p className="text-[#8B949E] text-sm">Loading traders...</p>
          </div>
        ) : (
          <>
            <p className="text-[#8B949E] text-xs mb-4">
              {query
                ? results.length + " result(s) for " + query
                : allTraders.length + " traders on MatrixVerse"}
            </p>

            {results.length === 0 ? (
              <div className="text-center py-16 bg-[#161B22] border border-[#30363D] rounded-2xl">
                <div className="text-4xl mb-3">🔍</div>
                <p className="text-[#8B949E] text-sm">No traders found for that username</p>
                <p className="text-[#8B949E] text-xs mt-1">Try a different search</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {results.map((trader) => {
                  const uid = trader.user_id;
                  const uname = trader.username;
                  const stats = traderStats[uid] || { total: 0, winRate: 0 };
                  const isMe = uid === user?.id;
                  const profileUrl = "/profile/" + uname;
                  const avatarLetter = uname?.charAt(0).toUpperCase();

                  return (
                    <a
                      key={uid}
                      href={profileUrl}
                      className="bg-[#161B22] border border-[#30363D] rounded-2xl p-4 flex items-center justify-between hover:border-[#00D4FF] transition-colors group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-full bg-[#00D4FF] flex items-center justify-center text-[#0D1117] font-bold text-lg">
                          {avatarLetter}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-white font-semibold text-sm group-hover:text-[#00D4FF] transition-colors">
                              @{uname}
                            </span>
                            {isMe && (
                              <span className="text-[#00D4FF] text-xs">(You)</span>
                            )}
                          </div>
                          <div className="text-[#8B949E] text-xs mt-0.5">
                            {stats.total} trades · {stats.winRate}% win rate
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="bg-[#00D4FF20] text-[#00D4FF] text-xs font-bold px-3 py-1 rounded-full">
                          Trader
                        </span>
                        <span className="text-[#8B949E] group-hover:text-[#00D4FF] transition-colors text-sm">
                          →
                        </span>
                      </div>
                    </a>
                  );
                })}
              </div>
            )}
          </>
        )}

      </div>
<MobileNav username={user?.user_metadata?.username || user?.email} />
    </main>
  );
}
