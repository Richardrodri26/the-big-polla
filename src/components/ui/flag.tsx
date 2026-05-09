import { cn } from "@/lib/utils";

const sizeClass = {
  sm: "text-base",
  md: "text-2xl",
  lg: "text-4xl",
} as const;

function toFlagEmoji(code: string): string {
  return [...code.toUpperCase()]
    .map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65))
    .join("");
}

interface FlagProps {
  code: string;
  size?: keyof typeof sizeClass;
  className?: string;
}

export function Flag({ code, size = "md", className }: FlagProps) {
  return (
    <span
      role="img"
      aria-label={`Flag ${code.toUpperCase()}`}
      className={cn("inline-block leading-none", sizeClass[size], className)}
    >
      {toFlagEmoji(code)}
    </span>
  );
}
