"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Network, Plus, Trophy, User } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useAppStore } from "@/store/app-store";
import { FEED_MATCHES } from "@/lib/tournament-data";

const NAV_ITEMS = [
  { href: "/feed", icon: Home, label: "Feed" },
  { href: "/oracle", icon: Network, label: "Oracle" },
  { href: "/leaderboard", icon: Trophy, label: "Liga" },
  { href: "/profile", icon: User, label: "Perfil" },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { openPredictor, predictions } = useAppStore();

  const handlePredict = () => {
    const next = FEED_MATCHES.find(
      (m) => m.state === "pending" && !predictions[m.id],
    );
    if (next) openPredictor(next);
  };

  return (
    <Sidebar
      collapsible="none"
      className="hidden md:flex border-r border-[var(--line)] bg-[var(--bg)]"
    >
      <SidebarHeader className="px-4 py-5 border-b border-[var(--line)]">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-mono tracking-[0.16em] uppercase text-[var(--fg-mute)]">
            LIGA · AMIGOS DEL BAR
          </span>
          <span
            className="font-black text-lg tracking-tighter uppercase leading-none text-[var(--fg)]"
            style={{ fontVariationSettings: '"wdth" 75' }}
          >
            THE BIG POLLA
          </span>
        </div>
      </SidebarHeader>

      <SidebarContent className="py-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1 px-2">
              {NAV_ITEMS.map((item) => {
                const isActive =
                  item.href === "/feed"
                    ? pathname === "/feed" || pathname.startsWith("/feed/")
                    : pathname === item.href;
                const Icon = item.icon;

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className={cn(
                        "h-10 gap-3 rounded-xl px-3 font-semibold uppercase tracking-wide text-[11px]",
                        isActive
                          ? "bg-[var(--signal)] text-[#04130A] hover:bg-[var(--signal)] hover:text-[#04130A]"
                          : "text-[var(--fg-mute)] hover:bg-[var(--surface)] hover:text-[var(--fg)]",
                      )}
                    >
                      <Link href={item.href}>
                        <Icon size={18} />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-[var(--line)]">
        <button
          type="button"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--signal)] py-3 text-[12px] font-black uppercase tracking-wide text-[#04130A] transition-opacity hover:opacity-90"
          onClick={handlePredict}
        >
          <Plus size={16} />
          Predecir
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
