"use client";

import MobileNav from "../components/MobileNav";
import ThemeToggle from "../components/ThemeToggle"
import InboxIcon from "../components/InboxIcon";
import { Skeleton, SkeletonCard, SkeletonText } from "../components/Skeleton"
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";

export default function SearchClient() {
  const [user, setUser] = useState(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [allTraders, setAllTraders] = useState([]);
  const [traderStats, setTraderStats] = useState({});
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setUser(user);
      await fetchAllTraders(user);
    };
    init();
  }, []);

  useEffect(() => {
    if (allTraders.length > 0) {
      const q = searchParams.get("q")
      if (q) {
        setQuery(q)
        const filtered = allTraders.filter(t =>
          t.username?.toLowerCase().includes(q.toLowerCase())
        )
        setResults(filtered)
      }
    }
  }, [allTraders, searchParams])

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
    <main className="bg-[var(--bg-primary)] min-h-screen flex items-center justify-center">
      <div className="w-full max-w-4xl px-6 space-y-6">
        <SkeletonText lines={2} />
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
          <InboxIcon username={currentUser?.user_metadata?.username} />
          <ThemeToggle />
          <a href="/dashboard" className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-sm">Dashboard</a>
          <a href="/community" className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-sm">Community</a>
          <a href="/leaderboard" className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-sm">Leaderboard</a>
           <a href="/education" className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-sm">Learn</a>
           <a href="/glossary" className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-sm">Glossary</a>
        </div>
        <div className="md:hidden">
          <InboxIcon username={currentUser?.user_metadata?.username} />
          <ThemeToggle />
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-10 pb-20">

        <div className="mb-8">
          <h1 className="text-[var(--text-primary)] font-bold text-3xl mb-1">Search Traders</h1>
          <p className="text-[var(--text-muted)] text-sm">Find and visit any trader profile</p>
        </div>

        <div className="relative mb-6">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-lg">🔍</span>
          <input
            type="text"
            placeholder="Search by username..."
            value={query}
            onChange={handleSearch}
            autoFocus
            className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-primary)] placeholder-[#8B949E] rounded-2xl pl-12 pr-12 py-4 text-sm focus:outline-none focus:border-[var(--accent-blue)] transition-colors"
          />
          {query && (
            <button
              onClick={clearSearch}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] text-sm font-bold"
            >
              X
            </button>
          )}
        </div>

        {loading ? (
          <div className="space-y-4 px-6 py-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : (
          <>
            <p className="text-[var(--text-muted)] text-xs mb-4">
              {query
                ? results.length + " result(s) for " + query
                : allTraders.length + " traders on MatrixVerse"}
            </p>

            {results.length === 0 ? (
              <div className="text-center py-16 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl">
                <div className="text-4xl mb-3">🔍</div>
                <p className="text-[var(--text-muted)] text-sm">No traders found for that username</p>
                <p className="text-[var(--text-muted)] text-xs mt-1">Try a different search</p>
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
                      className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-4 flex items-center justify-between hover:border-[var(--accent-blue)] transition-colors group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-full bg-[var(--accent-blue)] flex items-center justify-center text-[var(--bg-primary)] font-bold text-lg">
                          {avatarLetter}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[var(--text-primary)] font-semibold text-sm group-hover:text-[var(--accent-blue)] transition-colors">
                              @{uname}
                            </span>
                            {isMe && (
                              <span className="text-[var(--accent-blue)] text-xs">(You)</span>
                            )}
                          </div>
                          <div className="text-[var(--text-muted)] text-xs mt-0.5">
                            {stats.total} trades · {stats.winRate}% win rate
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="bg-[var(--accent-blue-bg)] text-[var(--accent-blue)] text-xs font-bold px-3 py-1 rounded-full">
                          Trader
                        </span>
                        <span className="text-[var(--text-muted)] group-hover:text-[var(--accent-blue)] transition-colors text-sm">
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
