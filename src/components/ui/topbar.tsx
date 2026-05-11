import type { ReactNode } from "react";

interface TopbarProps {
  left?: ReactNode;
  title: string;
  sub?: string;
  right?: ReactNode;
}

export function Topbar({ left, title, sub, right }: TopbarProps) {
  return (
    <div className="topbar">
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {left}
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 2,
        }}
      >
        {sub && <div className="topbar-meta">{sub}</div>}
        <div className="topbar-title">{title}</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {right}
      </div>
    </div>
  );
}
