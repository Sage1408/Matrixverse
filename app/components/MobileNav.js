"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function MobileNav({ username }) {
  const pathname = usePathname();
  const [showMore, setShowMore] = useState(false);

  const mainItems = [
    { href: "/dashboard", icon: "📊", label: "Home" },
    { href: "/journal", icon: "📓", label: "Journal" },
    { href: "/community", icon: "👥", label: "Community" },
    { href: "/profile/" + (username || ""), icon: "👤", label: "Profile" },
  ];

  const moreItems = [
    { href: "/education", icon: "📚", label: "Learn" },
    { href: "/analytics", icon: "📈", label: "Analytics" },
    { href: "/ai-analyzer", icon: "🤖", label: "AI Coach" },
    { href: "/economic-calendar", icon: "📰", label: "News" },
    { href: "/sanctuary", icon: "🧘", label: "Sanctuary" },
    { href: "/leaderboard", icon: "🏆", label: "Leaderboard" },
    { href: "/settings", icon: "⚙️", label: "Settings" },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const isActive = (href) => {
    if (href.startsWith("/profile")) return pathname.startsWith("/profile");
    return pathname === href;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[var(--bg-secondary)] border-t border-[var(--border)]">
      <div className="flex items-center justify-around px-1 py-2">
        {mainItems.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className={"flex flex-col items-center gap-0.5 px-2 py-2 rounded-xl transition-colors flex-shrink-0 min-w-0 " + (
              isActive(item.href)
                ? "text-[var(--accent-blue)]"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            )}
          >
            <span className="text-xl leading-none">{item.icon}</span>
            <span className={"text-[10px] font-semibold leading-tight " + (isActive(item.href) ? "text-[var(--accent-blue)]" : "text-[var(--text-muted)]")}>
              {item.label}
            </span>
            {isActive(item.href) && (
              <div className="w-1 h-1 bg-[var(--accent-blue)] rounded-full mt-0.5" />
            )}
          </a>
        ))}

        {/* More button */}
        <button
          onClick={() => setShowMore(!showMore)}
          className="flex flex-col items-center gap-0.5 px-2 py-2 rounded-xl transition-colors flex-shrink-0 min-w-0 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
        >
          <span className="text-xl leading-none">•••</span>
          <span className="text-[10px] font-semibold leading-tight">More</span>
        </button>
      </div>

      {/* More menu drawer */}
      {showMore && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowMore(false)} />
          <div className="absolute bottom-full left-0 right-0 bg-[var(--bg-secondary)] border-t border-[var(--border)] px-6 py-4 rounded-t-2xl z-50">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[var(--text-primary)] font-bold text-sm">More</span>
              <button onClick={() => setShowMore(false)} className="text-[var(--text-muted)] text-lg leading-none">✕</button>
            </div>
            <div className="flex flex-col gap-2">
              {moreItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setShowMore(false)}
                  className={"flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors " + (
                    isActive(item.href)
                      ? "bg-[var(--accent-blue-bg)] text-[var(--accent-blue)]"
                      : "text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]"
                  )}
                >
                  <span className="text-xl">{item.icon}</span>
                  {item.label}
                </a>
              ))}
            </div>
            <hr className="border-[var(--border)] my-3" />
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-[var(--accent-red)] hover:bg-red-950/20 transition-colors w-full"
            >
              <span className="text-xl">🚪</span>
              Log out
            </button>
          </div>
        </>
      )}
    </nav>
  );
}
