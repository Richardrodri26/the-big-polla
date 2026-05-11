import type { ReactNode } from "react";

interface GamePillProps {
  tone?: "signal" | "warn" | "mute" | "danger";
  dot?: boolean;
  children: ReactNode;
}

export function GamePill({ tone = "mute", dot, children }: GamePillProps) {
  return (
    <span className={`pill pill-${tone}`}>
      {dot && (
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: 3,
            background: "currentColor",
            display: "inline-block",
          }}
        />
      )}
      {children}
    </span>
  );
}
