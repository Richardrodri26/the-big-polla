"use client";

import { Calendar, Home, Trophy, User } from "lucide-react";
import { BottomNav } from "@/components/layout/bottom-nav";

export function BottomNavDemo() {
  return (
    <BottomNav
      items={[
        { icon: Home, label: "Inicio", href: "/" },
        { icon: Calendar, label: "Partidos", href: "/partidos" },
        { icon: Trophy, label: "Liga", href: "/liga" },
        { icon: User, label: "Perfil", href: "/perfil" },
      ]}
    />
  );
}
