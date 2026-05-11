import type { Team } from "@/lib/tournament-data";

interface TeamFlagProps {
  team?: Team | null;
  size?: "xs" | "sm" | "md" | "lg";
}

export function TeamFlag({ team, size = "md" }: TeamFlagProps) {
  const sizeClasses = {
    xs: "w-6 h-6 text-[8px]",
    sm: "w-8 h-8 text-[9px]",
    md: "w-10 h-10 text-[10px]",
    lg: "w-14 h-14 text-[12px]",
  };

  if (!team) {
    return (
      <div
        className={`relative overflow-hidden rounded-lg flex items-end justify-center pb-1 font-mono font-bold tracking-wider ${sizeClasses[size]}`}
        style={{ background: "rgba(255,255,255,0.05)" }}
      >
        <span
          style={{
            color: "rgba(255,255,255,0.3)",
            position: "relative",
            zIndex: 1,
          }}
        >
          —
        </span>
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden rounded-lg flex items-end justify-center pb-1 font-mono font-bold tracking-wider ${sizeClasses[size]}`}
      style={{ background: team.c1 }}
    >
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(135deg, ${team.c1} 0%, ${team.c1} 50%, ${team.c2} 50%, ${team.c2} 100%)`,
        }}
      />
      <span
        className="relative z-10 mix-blend-overlay"
        style={{ color: "#fff", textShadow: "0 1px 2px rgba(0,0,0,0.6)" }}
      >
        {team.code}
      </span>
    </div>
  );
}
