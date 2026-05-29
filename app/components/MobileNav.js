"use client";

import { usePathname } from "next/navigation";

export default function MobileNav({ username }) {
  const pathname = usePathname();

  const navItems = [
    { href: "/dashboard", icon: "📊", label: "Home" },
    { href: "/education", icon: "📚", label: "Learn" },
    { href: "/journal", icon: "📓", label: "Journal" },
    { href: "/analytics", icon: "📊", label: "Analytics" },
    { href: "/community", icon: "👥", label: "Community" },
    { href: "/leaderboard", icon: "🏆", label: "Ranks" },
    { href: "/profile/" + (username || ""), icon: "👤", label: "Profile" },
  ];

  const isActive = (href) => {
    if (href.startsWith("/profile")) return pathname.startsWith("/profile");
    return pathname === href;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[var(--bg-secondary)] border-t border-[var(--border)]">
      <div className="flex items-center justify-between px-1 py-2 overflow-x-auto">
        {navItems.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className={"flex flex-col items-center gap-0.5 px-1.5 py-2 rounded-xl transition-colors flex-shrink-0 " + (
              isActive(item.href)
                ? "text-[var(--accent-blue)]"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            )}
          >
            <span className="text-xl leading-none">{item.icon}</span>
            <span className={"text-xs font-semibold " + (isActive(item.href) ? "text-[var(--accent-blue)]" : "text-[var(--text-muted)]")}>
              {item.label}
            </span>
            {isActive(item.href) && (
              <div className="w-1 h-1 bg-[var(--accent-blue)] rounded-full mt-0.5" />
            )}
          </a>
        ))}
      </div>
    </nav>
  );
}
