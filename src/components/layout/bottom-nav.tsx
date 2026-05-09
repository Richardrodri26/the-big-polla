"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface NavItem {
  icon: LucideIcon;
  label: string;
  href: string;
}

interface BottomNavProps {
  items: NavItem[];
}

export function BottomNav({ items }: BottomNavProps) {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-1/2 z-40 flex h-16 w-full max-w-[480px] -translate-x-1/2 items-center border-t border-[var(--line)] bg-[var(--bg)]/90 backdrop-blur-sm">
      {items.map((item) => {
        const isActive = pathname === item.href;
        const IconComponent = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[10px] font-semibold uppercase tracking-wide transition-colors",
              isActive
                ? "text-[var(--signal)]"
                : "text-[var(--fg-mute)] hover:text-[var(--fg-dim)]"
            )}
          >
            <IconComponent size={22} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
