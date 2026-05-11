"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Network, Plus, Trophy, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";
import { FEED_MATCHES } from "@/lib/tournament-data";

const NAV_ITEMS = [
  { href: "/feed", icon: Home, label: "Feed" },
  { href: "/oracle", icon: Network, label: "Oracle" },
  { href: null, icon: Plus, label: "Predecir", center: true as const },
  { href: "/leaderboard", icon: Trophy, label: "Liga" },
  { href: "/profile", icon: User, label: "Perfil" },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const { openPredictor, predictions } = useAppStore();

  const handlePredict = () => {
    const next = FEED_MATCHES.find(
      (m) => m.state === "pending" && !predictions[m.id],
    );
    if (next) openPredictor(next);
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center border-t border-[var(--line)] bg-[var(--bg)]/90 backdrop-blur-sm">
      {NAV_ITEMS.map((item) => {
        if (item.center) {
          return (
            <button
              key="predict"
              type="button"
              aria-label="Predecir"
              onClick={handlePredict}
              className="flex flex-1 flex-col items-center justify-center"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--signal)]">
                <Plus size={20} color="#04130A" />
              </div>
            </button>
          );
        }

        const isActive =
          item.href === "/feed"
            ? pathname === "/feed" || pathname.startsWith("/feed/")
            : pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href!}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[10px] font-semibold uppercase tracking-wide transition-colors",
              isActive
                ? "text-[var(--signal)]"
                : "text-[var(--fg-mute)] hover:text-[var(--fg-dim)]",
            )}
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
