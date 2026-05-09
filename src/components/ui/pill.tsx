import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusStyles = {
  live: "bg-[var(--danger)] text-white border-transparent",
  upcoming: "border-[var(--line-2)] bg-[var(--surface)] text-[var(--fg-mute)]",
  finished: "bg-[var(--surface-2)] text-[var(--fg-faint)] border-transparent",
} as const;

const statusLabels = {
  live: "En vivo",
  upcoming: "Próximo",
  finished: "Finalizado",
} as const;

type PillStatus = keyof typeof statusStyles;

interface PillProps {
  status: PillStatus;
  className?: string;
}

export function Pill({ status, className }: PillProps) {
  return (
    <Badge
      className={cn(
        "h-auto rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
        statusStyles[status],
        className,
      )}
    >
      {status === "live" && (
        <span className="relative flex size-1.5">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-white opacity-75" />
          <span className="relative inline-flex size-1.5 rounded-full bg-white" />
        </span>
      )}
      {statusLabels[status]}
    </Badge>
  );
}
