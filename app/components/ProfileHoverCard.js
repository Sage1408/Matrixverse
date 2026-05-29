"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";

export default function ProfileHoverCard({ username, children }) {
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const triggerRef = useRef(null);
  const cardRef = useRef(null);
  const timerRef = useRef(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const fetchProfile = async () => {
    if (profile) return;
    setLoading(true);
    const { data: p } = await supabase
      .from("profiles")
      .select("*")
      .eq("username", username)
      .single();
    setProfile(p);

    if (p) {
      const { data: trades } = await supabase
        .from("trades")
        .select("pnl")
        .eq("user_id", p.user_id);
      if (trades) {
        const wins = trades.filter(t => t.pnl > 0).length;
        const total = trades.length;
        setStats({
          total,
          winRate: total > 0 ? Math.round((wins / total) * 100) : 0,
          netPnL: trades.reduce((s, t) => s + (t.pnl || 0), 0).toFixed(2),
        });
      }
    }
    setLoading(false);
  };

  const show = () => {
    timerRef.current = setTimeout(() => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (rect) {
        const cardWidth = 280;
        let left = rect.left + window.scrollX;
        if (left + cardWidth > window.innerWidth - 16) {
          left = window.innerWidth - cardWidth - 16;
        }
        setPosition({
          top: rect.bottom + window.scrollY + 8,
          left: Math.max(8, left),
        });
      }
      fetchProfile();
      setVisible(true);
    }, 400);
  };

  const hide = () => {
    clearTimeout(timerRef.current);
    setVisible(false);
  };

  useEffect(() => {
    return () => clearTimeout(timerRef.current);
  }, []);

  return (
    <>
      <span
        ref={triggerRef}
        onMouseEnter={show}
        onMouseLeave={hide}
        className="inline-block"
      >
        {children}
      </span>

      {visible && (
        <div
          ref={cardRef}
          onMouseEnter={() => clearTimeout(timerRef.current)}
          onMouseLeave={hide}
          style={{
            position: "fixed",
            top: position.top + "px",
            left: position.left + "px",
            zIndex: 9999,
          }}
          className="w-[280px] bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden animate-fadeIn"
        >
          {loading || !profile ? (
            <div className="flex items-center gap-3 p-4">
              <div className="w-10 h-10 rounded-full bg-[var(--border)] animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-[var(--border)] rounded w-24 animate-pulse" />
                <div className="h-2 bg-[var(--border)] rounded w-16 animate-pulse" />
              </div>
            </div>
          ) : (
            <a href={"/profile/" + username} className="block p-4 hover:bg-[var(--bg-primary)] transition-colors">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-[var(--accent-blue)] flex items-center justify-center text-[var(--bg-primary)] font-bold text-sm overflow-hidden flex-shrink-0">
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    username?.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-[var(--text-primary)] font-bold text-sm truncate">
                    {profile.display_name || "@" + username}
                  </p>
                  <p className="text-[var(--text-muted)] text-xs">@{username}</p>
                </div>
              </div>

              {profile.bio && (
                <p className="text-[var(--text-secondary)] text-xs leading-relaxed mb-3 line-clamp-2">
                  {profile.bio}
                </p>
              )}

              {stats && (
                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-[var(--border)]">
                  <div className="text-center">
                    <p className="text-[var(--text-primary)] font-bold text-sm">{stats.total}</p>
                    <p className="text-[var(--text-muted)] text-[10px]">Trades</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-sm" style={{ color: stats.winRate >= 50 ? "#00FF88" : "#FF4757" }}>
                      {stats.winRate}%
                    </p>
                    <p className="text-[var(--text-muted)] text-[10px]">Win Rate</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-sm" style={{ color: parseFloat(stats.netPnL) >= 0 ? "#00FF88" : "#FF4757" }}>
                      ${stats.netPnL}
                    </p>
                    <p className="text-[var(--text-muted)] text-[10px]">PnL</p>
                  </div>
                </div>
              )}

              <div className="mt-3">
                <span className="text-[var(--accent-blue)] text-xs font-semibold hover:underline">
                  View Profile →
                </span>
              </div>
            </a>
          )}
        </div>
      )}
    </>
  );
}
