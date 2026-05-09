import { cn } from "@/lib/utils";

interface TopbarProps {
  title: string;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  className?: string;
}

export function Topbar({ title, leading, trailing, className }: TopbarProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-[var(--line)] bg-[var(--bg)]/80 px-[var(--gutter)] backdrop-blur-sm",
        className,
      )}
    >
      {leading && <div className="flex shrink-0 items-center">{leading}</div>}
      <h1 className="flex-1 truncate text-base font-semibold text-[var(--fg)]">
        {title}
      </h1>
      {trailing && (
        <div className="flex shrink-0 items-center gap-2">{trailing}</div>
      )}
    </header>
  );
}
