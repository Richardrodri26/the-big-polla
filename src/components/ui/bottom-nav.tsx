"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GameIcon } from "@/components/ui/game-icon";

type NavItem =
  | { id: string; href: string; icon: string; label: string; center?: false }
  | { id: string; href: null; icon: string; label: string; center: true };

const NAV_ITEMS: NavItem[] = [
  { id: "feed", href: "/feed", icon: "feed", label: "Feed" },
  { id: "bracket", href: "/oracle", icon: "bracket", label: "Oracle" },
  { id: "predict", href: null, icon: "plus", label: "Predict", center: true },
  { id: "leader", href: "/leaderboard", icon: "trophy", label: "Liga" },
  { id: "profile", href: "/profile", icon: "user", label: "Yo" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="bottom-nav">
      {NAV_ITEMS.map((item) => {
        if (item.center) {
          return (
            <button key={item.id} className="center-fab" aria-label="Predecir">
              <GameIcon name={item.icon} size={22} color="#04130A" />
            </button>
          );
        }

        const isActive =
          item.href === "/feed"
            ? pathname === "/feed" || pathname.startsWith("/feed/")
            : pathname === item.href;

        return (
          <Link
            key={item.id}
            href={item.href}
            className={isActive ? "active" : ""}
          >
            <GameIcon name={item.icon} size={20} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
