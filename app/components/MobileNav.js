"use client";

import { usePathname } from "next/navigation";

export default function MobileNav({ username }) {
  const pathname = usePathname();

  const navItems = [
    { href: "/dashboard", icon: "📊", label: "Home" },
    { href: "/journal", icon: "📓", label: "Journal" },
    { href: "/community", icon: "👥", label: "Community" },
    { href: "/leaderboard", icon: "🏆", label: "Ranks" },
    { href: "/profile/" + (username || ""), icon: "👤", label: "Profile" },
  ];

  const isActive = (href) => {
    if (href.startsWith("/profile")) return pathname.startsWith("/profile");
    return pathname === href;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[#161B22] border-t border-[#30363D]">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className={"flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-colors min-w-[56px] " + (
              isActive(item.href)
                ? "text-[#00D4FF]"
                : "text-[#8B949E] hover:text-white"
            )}
          >
            <span className="text-xl leading-none">{item.icon}</span>
            <span className={"text-xs font-semibold " + (isActive(item.href) ? "text-[#00D4FF]" : "text-[#8B949E]")}>
              {item.label}
            </span>
            {isActive(item.href) && (
              <div className="w-1 h-1 bg-[#00D4FF] rounded-full mt-0.5" />
            )}
          </a>
        ))}
      </div>
    </nav>
  );
}
