interface AviProps {
  name: string;
  color?: string;
  size?: number;
}

export function Avi({ name, color = "#5B6B86", size = 36 }: AviProps) {
  const initials = name
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className="avi"
      style={{
        background: color,
        width: size,
        height: size,
        fontSize: Math.max(11, size * 0.36),
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}
