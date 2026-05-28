"use client";

import MobileNav from "../components/MobileNav";
import ThemeToggle from "../components/ThemeToggle"
import { Skeleton, SkeletonCard, SkeletonText } from "../components/Skeleton"
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";

export default function NotificationsClient() {
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState("all");
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setUser(user);
      fetchNotifications(user.id);
    };
    init();
  }, []);

  const fetchNotifications = async (userId) => {
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", String(userId))
      .order("created_at", { ascending: false });
    if (data) setNotifications(data);
  };

  const markAllRead = async () => {
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", String(user.id));
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const markOneRead = async (id) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const deleteOne = async (id) => {
    await supabase.from("notifications").delete().eq("id", id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return seconds + "s ago";
    if (seconds < 3600) return Math.floor(seconds / 60) + "m ago";
    if (seconds < 86400) return Math.floor(seconds / 3600) + "h ago";
    return Math.floor(seconds / 86400) + "d ago";
  };

  const getTypeIcon = (type) => {
    const icons = {
      like: "❤️", comment: "💬", follow: "👤",
      streak: "🔥", badge: "🏅", leaderboard: "🏆",
      ai: "🤖", system: "📢",
    };
    return icons[type] || "🔔";
  };

  const getTypeBg = (type) => {
    const colors = {
      like: "#FF4757", comment: "#00D4FF", follow: "#7C3AED",
      streak: "#FFD700", badge: "#FFD700", leaderboard: "#FFD700",
      ai: "#7C3AED", system: "#8B949E",
    };
    return (colors[type] || "#8B949E") + "20";
  };

  const filters = [
    { key: "all", label: "All" },
    { key: "unread", label: "Unread" },
    { key: "like", label: "Likes" },
    { key: "comment", label: "Comments" },
    { key: "follow", label: "Follows" },
    { key: "streak", label: "Streaks" },
  ];

  const filteredNotifs = filter === "all"
    ? notifications
    : filter === "unread"
    ? notifications.filter(n => !n.is_read)
    : notifications.filter(n => n.type === filter);

  const unreadCount = notifications.filter(n => !n.is_read).length;

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
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <a href="/dashboard" className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-sm">Dashboard</a>
          <a href="/community" className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-sm">Community</a>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-10 pb-20">

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-[var(--text-primary)] font-bold text-3xl mb-1">Notifications</h1>
            <p className="text-[var(--text-muted)] text-sm">
              {unreadCount > 0 ? unreadCount + " unread notification" + (unreadCount > 1 ? "s" : "") : "All caught up!"}
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="border border-[var(--border)] text-[var(--text-muted)] text-xs font-semibold px-4 py-2 rounded-full hover:border-[var(--accent-blue)] hover:text-[var(--accent-blue)] transition-colors"
            >
              Mark all read
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={"px-4 py-2 rounded-full text-sm font-semibold transition-colors " + (
                filter === f.key
                  ? "bg-[var(--accent-blue)] text-[var(--bg-primary)]"
                  : "border border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--accent-blue)] hover:text-[var(--accent-blue)]"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {filteredNotifs.length === 0 ? (
          <div className="text-center py-16 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl">
            <div className="text-4xl mb-3">🔔</div>
            <p className="text-[var(--text-muted)] text-sm">No notifications here yet</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredNotifs.map((notif) => (
              <div
                key={notif.id}
                className={"bg-[var(--bg-secondary)] border rounded-2xl p-4 flex items-start gap-4 " + (!notif.is_read ? "border-[#00D4FF40]" : "border-[var(--border)]")}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0"
                  style={{ backgroundColor: getTypeBg(notif.type) }}
                >
                  {getTypeIcon(notif.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-[var(--text-secondary)] text-sm leading-relaxed">{notif.message}</p>
                  <p className="text-[var(--text-muted)] text-xs mt-1">{getTimeAgo(notif.created_at)}</p>
                  {notif.link && (
                    <a href={notif.link} className="text-[var(--accent-blue)] text-xs hover:underline mt-1 block">
                      View →
                    </a>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {!notif.is_read && (
                    <button
                      onClick={() => markOneRead(notif.id)}
                      className="text-[var(--accent-blue)] text-xs hover:underline"
                    >
                      Read
                    </button>
                  )}
                  <button
                    onClick={() => deleteOne(notif.id)}
                    className="text-[var(--text-muted)] hover:text-[var(--accent-red)] text-xs transition-colors"
                  >
                    x
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}

      </div>
<MobileNav username={user?.user_metadata?.username || user?.email} />
    </main>
  );
}
