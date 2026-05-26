"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GameIcon } from "@/components/ui/game-icon";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { useAppStore } from "@/store/app-store";
import { FEED_MATCHES } from "@/lib/tournament-data";

const NAV_ITEMS = [
  { href: "/feed", icon: "feed", label: "Feed" },
  { href: "/oracle", icon: "bracket", label: "Oracle" },
  { href: "/leaderboard", icon: "trophy", label: "Liga" },
  { href: "/profile", icon: "user", label: "Perfil" },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { openPredictor, predictions } = useAppStore();

  const liveCount = FEED_MATCHES.filter((m) => m.state === "live").length;

  const handlePredict = () => {
    const next = FEED_MATCHES.find(
      (m) => m.state === "pending" && !predictions[m.id],
    );
    if (next) openPredictor(next);
  };

  return (
    <Sidebar collapsible="none" className="hidden md:flex">
      {/* Wordmark */}
      <SidebarHeader className="px-5 pt-6 pb-5 border-b border-[var(--line)]">
        <span
          style={{
            display: "block",
            fontFamily: "var(--font-jetbrains, monospace)",
            fontSize: 9,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "var(--fg-faint)",
          }}
        >
          MUNDIAL 2026
        </span>
        <div
          style={{
            marginTop: 8,
            fontFamily: "var(--font-inter, sans-serif)",
            fontWeight: 900,
            textTransform: "uppercase",
            lineHeight: 0.86,
            fontVariationSettings: '"wdth" 75',
            fontSize: 28,
            letterSpacing: "-0.035em",
          }}
        >
          <div style={{ color: "var(--fg)" }}>THE BIG</div>
          <div style={{ color: "var(--signal)" }}>POLLA</div>
        </div>
      </SidebarHeader>

      {/* Nav */}
      <SidebarContent className="py-4">
        <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/feed"
                ? pathname === "/feed" || pathname.startsWith("/feed/")
                : pathname === item.href;
            const showLive = item.href === "/feed" && liveCount > 0;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-nav-link${isActive ? " active" : ""}`}
              >
                <GameIcon
                  name={item.icon}
                  size={20}
                  color={isActive ? "var(--signal)" : "currentColor"}
                />
                <span style={{ flex: 1 }}>{item.label}</span>
                {showLive && (
                  <span className="sidebar-live-badge">
                    <span className="sidebar-live-dot" />
                    {liveCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </SidebarContent>

      {/* Predict CTA */}
      <SidebarFooter className="p-4 border-t border-[var(--line)]">
        <button
          type="button"
          className="sidebar-predict-btn"
          onClick={handlePredict}
        >
          <GameIcon name="plus" size={16} color="#04130A" />
          Predecir
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
