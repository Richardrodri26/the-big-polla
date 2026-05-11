import { cn } from "@/lib/utils";
import type { LeaderboardEntry } from "@/types/domain";

interface LeaderboardRowProps {
  entry: LeaderboardEntry;
  className?: string;
}

const rankColors: Record<number, string> = {
  1: "text-[#FFD60A]",
  2: "text-[#C7CACE]",
  3: "text-[#D08350]",
};

const deltaIcon = { up: "↑", down: "↓", flat: "–" } as const;

const deltaColor = {
  up: "text-[var(--signal)]",
  down: "text-[var(--danger)]",
  flat: "text-[var(--fg-faint)]",
} as const;

export function LeaderboardRow({ entry, className }: LeaderboardRowProps) {
  const { rank, name, points, delta, deltaValue, isMe } = entry;

  return (
    <div
      className={cn(
        "grid grid-cols-[36px_1fr_auto] items-center gap-3 px-[var(--gutter)] py-3",
        isMe && "border-l-2 border-[var(--signal)]",
        className,
      )}
      style={
        isMe
          ? {
              background:
                "linear-gradient(to right, rgba(0,210,106,0.06), transparent)",
            }
          : undefined
      }
    >
      {/* Rank */}
      <span
        className={cn(
          "text-base font-black tabular-nums",
          rankColors[rank] ?? "text-[var(--fg-mute)]",
        )}
      >
        #{rank}
      </span>

      {/* Name + delta */}
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="truncate text-sm font-semibold text-[var(--fg)]">
          {name}
        </span>
        <span className={cn("font-mono text-[11px]", deltaColor[delta])}>
          {deltaIcon[delta]}
          {delta !== "flat" && deltaValue ? ` ${deltaValue}` : " sin cambios"}
        </span>
      </div>

      {/* Points */}
      <span
        className="text-base font-black tabular-nums text-[var(--fg)]"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {points}{" "}
        <span className="font-mono text-[11px] font-normal text-[var(--fg-mute)]">
          pts
        </span>
      </span>
    </div>
  );
}
