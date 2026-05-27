"use client";

import MobileNav from "../components/MobileNav";
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
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-10 pb-20">

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-white font-bold text-3xl mb-1">Notifications</h1>
            <p className="text-[#8B949E] text-sm">
              {unreadCount > 0 ? unreadCount + " unread notification" + (unreadCount > 1 ? "s" : "") : "All caught up!"}
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="border border-[#30363D] text-[#8B949E] text-xs font-semibold px-4 py-2 rounded-full hover:border-[#00D4FF] hover:text-[#00D4FF] transition-colors"
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
                  ? "bg-[#00D4FF] text-[#0D1117]"
                  : "border border-[#30363D] text-[#8B949E] hover:border-[#00D4FF] hover:text-[#00D4FF]"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {filteredNotifs.length === 0 ? (
          <div className="text-center py-16 bg-[#161B22] border border-[#30363D] rounded-2xl">
            <div className="text-4xl mb-3">🔔</div>
            <p className="text-[#8B949E] text-sm">No notifications here yet</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredNotifs.map((notif) => (
              <div
                key={notif.id}
                className={"bg-[#161B22] border rounded-2xl p-4 flex items-start gap-4 " + (!notif.is_read ? "border-[#00D4FF40]" : "border-[#30363D]")}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0"
                  style={{ backgroundColor: getTypeBg(notif.type) }}
                >
                  {getTypeIcon(notif.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-[#C9D1D9] text-sm leading-relaxed">{notif.message}</p>
                  <p className="text-[#8B949E] text-xs mt-1">{getTimeAgo(notif.created_at)}</p>
                  {notif.link && (
                    <a href={notif.link} className="text-[#00D4FF] text-xs hover:underline mt-1 block">
                      View →
                    </a>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {!notif.is_read && (
                    <button
                      onClick={() => markOneRead(notif.id)}
                      className="text-[#00D4FF] text-xs hover:underline"
                    >
                      Read
                    </button>
                  )}
                  <button
                    onClick={() => deleteOne(notif.id)}
                    className="text-[#8B949E] hover:text-[#FF4757] text-xs transition-colors"
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
