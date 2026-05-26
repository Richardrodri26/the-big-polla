"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { GameIcon } from "@/components/ui/game-icon";
import { useAppStore } from "@/store/app-store";
import { FEED_MATCHES } from "@/lib/tournament-data";

const NAV_ITEMS = [
  { href: "/feed", icon: "feed", label: "Feed" },
  { href: "/oracle", icon: "bracket", label: "Oracle" },
  { href: null, icon: "plus", label: "Predecir", center: true as const },
  { href: "/leaderboard", icon: "trophy", label: "Liga" },
  { href: "/profile", icon: "user", label: "Perfil" },
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
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--line)] bg-[var(--bg)]/90 backdrop-blur-sm">
      <div className="flex h-16 items-stretch">
        {NAV_ITEMS.map((item) => {
          if (item.center) {
            return (
              <button
                key="predict"
                type="button"
                aria-label="Predecir"
                onClick={handlePredict}
                className="flex flex-1 items-center justify-center"
              >
                <div
                  className="flex h-14 w-14 -translate-y-7 items-center justify-center rounded-full bg-[var(--signal)]"
                  style={{ boxShadow: "0 12px 32px rgba(0,210,106,0.45)" }}
                >
                  <GameIcon name="plus" size={22} color="#04130A" />
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
                "relative flex flex-1 flex-col items-center justify-center gap-1 text-[10px] font-black uppercase tracking-wide transition-colors",
                isActive
                  ? "text-[var(--signal)]"
                  : "text-[var(--fg-mute)] hover:text-[var(--fg-dim)]",
              )}
            >
              {isActive && (
                <span
                  className="absolute top-0 left-1/2 -translate-x-1/2 rounded-full bg-[var(--signal)]"
                  style={{ width: 22, height: 2 }}
                />
              )}
              <GameIcon name={item.icon} size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
