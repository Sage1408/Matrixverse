"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";

export default function NotificationBell({ userId }) {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!userId) return;
    fetchNotifications();
  }, [userId]);

useEffect(() => {
  if (!userId) return;

  const channel = supabase
    .channel("notifications-channel")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${userId}`,
      },
      () => {
        fetchNotifications();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [userId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const fetchNotifications = async () => {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);
    if (data) setNotifications(data);
  };

  const markAllRead = async () => {
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const markOneRead = async (id, link) => {
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id);
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, is_read: true } : n)
    );
    setOpen(false);
    if (link) window.location.href = link;
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

  const unreadCount = notifications.filter(
  n => !n.is_read
).length;

  return (
    <div className="relative" ref={ref}>
      <button
  onClick={() => {
    setOpen(!open);
    if (!open) fetchNotifications();
  }}
  className="relative text-[#8B949E] hover:text-white transition-colors p-2"
>
  <span className="text-2xl">🔔</span>

  {unreadCount > 0 && (
    <span
      className="
        absolute
        -top-1
        -right-1
        z-10
        bg-[#FF4757]
        text-white
        font-bold
        rounded-full
        flex
        items-center
        justify-center
      "
      style={{
        fontSize: "10px",
        minWidth: "18px",
        height: "18px",
        padding: "0 5px",
      }}
    >
      {unreadCount > 99 ? "99+" : unreadCount}
    </span>
  )}
</button>

      {open && (
        <div className="absolute right-0 top-10 w-80 bg-[#161B22] border border-[#30363D] rounded-2xl shadow-2xl z-50 overflow-hidden">

          <div className="flex items-center justify-between px-4 py-3 border-b border-[#30363D]">
            <span className="text-white font-bold text-sm">
              Notifications {unreadCount > 0 && (
                <span className="bg-[#FF4757] text-white text-xs font-bold px-1.5 py-0.5 rounded-full ml-1">
                  {unreadCount}
                </span>
              )}
            </span>
            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-[#00D4FF] text-xs hover:underline">
                  Mark all read
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-[#8B949E] hover:text-white text-sm font-bold">
                x
              </button>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-3xl mb-2">🔔</div>
                <p className="text-[#8B949E] text-sm">No notifications yet</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => markOneRead(notif.id, notif.link)}
                  className={"flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-[#1A2332] transition-colors border-b border-[#30363D] " + (!notif.is_read ? "bg-[#00D4FF08]" : "")}
                >
                  <span className="text-lg flex-shrink-0">{getTypeIcon(notif.type)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[#C9D1D9] text-xs leading-relaxed">{notif.message}</p>
                    <p className="text-[#8B949E] text-xs mt-0.5">{getTimeAgo(notif.created_at)}</p>
                  </div>
                  {!notif.is_read && (
                    <div className="w-2 h-2 bg-[#00D4FF] rounded-full flex-shrink-0 mt-1"></div>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="px-4 py-3 border-t border-[#30363D]">
            <a href="/notifications" className="text-[#00D4FF] text-xs hover:underline block text-center">
              View all notifications
            </a>
          </div>

        </div>
      )}
    </div>
  );
}
