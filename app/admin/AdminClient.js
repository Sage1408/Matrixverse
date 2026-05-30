"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";
import ThemeToggle from "../components/ThemeToggle";
import InboxIcon from "../components/InboxIcon";
import MobileNav from "../components/MobileNav";
import { Skeleton, SkeletonText, SkeletonCard } from "../components/Skeleton";

export default function AdminClient() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [stats, setStats] = useState({ users: 0, trades: 0, posts: 0, checkins: 0 });
  const [tab, setTab] = useState("stats");
  const [deleting, setDeleting] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setUser(user);

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", user.id)
        .single();

      if (profile?.role !== "admin") {
        router.push("/dashboard");
        return;
      }

      setIsAdmin(true);
      await loadData();
      setLoading(false);
    };
    init();
  }, []);

  const loadData = async () => {
    const [usersRes, postsRes, tradesCount, checkinsCount] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("posts").select("*").order("created_at", { ascending: false }),
      supabase.from("trades").select("id", { count: "exact", head: true }),
      supabase.from("checkins").select("id", { count: "exact", head: true }),
    ]);

    if (usersRes.data) setUsers(usersRes.data);
    if (postsRes.data) setPosts(postsRes.data);
    setStats({
      users: usersRes.data?.length || 0,
      trades: tradesCount.count || 0,
      posts: postsRes.data?.length || 0,
      checkins: checkinsCount.count || 0,
    });
  };

  const toggleAdmin = async (userId, currentRole) => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    await supabase.from("profiles").update({ role: newRole }).eq("user_id", userId);
    setUsers(prev => prev.map(u => u.user_id === userId ? { ...u, role: newRole } : u));
  };

  const deletePost = async (postId) => {
    setDeleting(postId);
    await supabase.from("posts").delete().eq("id", postId);
    setPosts(prev => prev.filter(p => p.id !== postId));
    setDeleting(null);
  };

  if (loading) {
    return (
      <main className="bg-[var(--bg-primary)] min-h-screen p-6">
        <Skeleton className="h-8 w-48 mb-6" />
        <SkeletonCard count={3} />
      </main>
    );
  }

  if (!isAdmin) return null;

  const tabs = [
    { key: "stats", label: "📊 Stats" },
    { key: "users", label: "👥 Users" },
    { key: "posts", label: "📝 Posts" },
  ];

  return (
    <>
      <nav className="bg-[var(--bg-secondary)] border-b border-[var(--border)] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <a href="/dashboard" className="text-[var(--accent-blue)] font-bold text-xl">MatrixVerse</a>
          <span className="bg-[var(--accent-purple)] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">ADMIN</span>
        </div>
        <div className="flex items-center gap-3">
          <InboxIcon username={user?.user_metadata?.username} />
          <ThemeToggle />
        </div>
      </nav>

      <main className="bg-[var(--bg-primary)] min-h-screen px-6 py-8 pb-24">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-6">Admin Panel</h1>

          <div className="flex gap-2 mb-6">
            {tabs.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={"px-4 py-2 rounded-full text-sm font-semibold transition-colors " + (
                  tab === t.key
                    ? "bg-[var(--accent-blue)] text-[var(--bg-primary)]"
                    : "border border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--accent-blue)]"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === "stats" && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total Users", value: stats.users, color: "#00D4FF" },
                { label: "Total Trades", value: stats.trades, color: "#00FF88" },
                { label: "Total Posts", value: stats.posts, color: "#FFD700" },
                { label: "Total Check-ins", value: stats.checkins, color: "#7C3AED" },
              ].map(s => (
                <div key={s.label} className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-6 text-center">
                  <div className="text-3xl font-bold" style={{ color: s.color }}>{s.value}</div>
                  <div className="text-[var(--text-muted)] text-sm mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          )}

          {tab === "users" && (
            <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)] text-[var(--text-muted)] text-left">
                      <th className="px-4 py-3 font-semibold">Username</th>
                      <th className="px-4 py-3 font-semibold">Email</th>
                      <th className="px-4 py-3 font-semibold">Role</th>
                      <th className="px-4 py-3 font-semibold">Joined</th>
                      <th className="px-4 py-3 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id} className="border-b border-[var(--border)] text-[var(--text-primary)]">
                        <td className="px-4 py-3 font-medium">{u.username}</td>
                        <td className="px-4 py-3 text-[var(--text-muted)]">{u.email}</td>
                        <td className="px-4 py-3">
                          <span className={"text-xs font-bold px-2 py-0.5 rounded-full " + (
                            u.role === "admin"
                              ? "bg-[var(--accent-purple-bg)] text-[var(--accent-purple)]"
                              : "text-[var(--text-muted)]"
                          )}>
                            {u.role || "user"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[var(--text-muted)] text-xs">
                          {new Date(u.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => toggleAdmin(u.user_id, u.role)}
                            className={"text-xs font-semibold px-3 py-1 rounded-full border transition-colors " + (
                              u.role === "admin"
                                ? "border-[var(--accent-red)] text-[var(--accent-red)] hover:bg-[var(--accent-red-bg)]"
                                : "border-[var(--accent-blue)] text-[var(--accent-blue)] hover:bg-[var(--accent-blue-bg)]"
                            )}
                          >
                            {u.role === "admin" ? "Demote" : "Make Admin"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === "posts" && (
            <div className="flex flex-col gap-3">
              {posts.map(post => (
                <div key={post.id} className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-5 flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-[var(--text-primary)] text-sm">{post.username}</span>
                      {post.pair_tag && (
                        <span className="text-xs bg-[var(--accent-blue-bg)] text-[var(--accent-blue)] font-semibold px-2 py-0.5 rounded-full">{post.pair_tag}</span>
                      )}
                      {post.post_type && (
                        <span className="text-xs text-[var(--text-muted)]">{post.post_type}</span>
                      )}
                      <span className="text-[var(--text-muted)] text-xs ml-auto">{new Date(post.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-[var(--text-secondary)] text-sm">{post.content}</p>
                  </div>
                  <button
                    onClick={() => deletePost(post.id)}
                    disabled={deleting === post.id}
                    className="text-[var(--accent-red)] text-xs font-semibold hover:underline flex-shrink-0 disabled:opacity-50"
                  >
                    {deleting === post.id ? "..." : "Delete"}
                  </button>
                </div>
              ))}
              {posts.length === 0 && (
                <p className="text-[var(--text-muted)] text-sm text-center py-8">No posts yet.</p>
              )}
            </div>
          )}
        </div>
      </main>

      <MobileNav />
    </>
  );
}
