interface GameIconProps {
  name: string;
  size?: number;
  color?: string;
}

export function GameIcon({
  name,
  size = 18,
  color = "currentColor",
}: GameIconProps) {
  const s = size;
  const stroke = {
    stroke: color,
    strokeWidth: 1.6,
    fill: "none",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (name) {
    case "feed":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24">
          <rect x="3" y="5" width="18" height="6" rx="1.5" {...stroke} />
          <rect x="3" y="13" width="18" height="6" rx="1.5" {...stroke} />
        </svg>
      );
    case "bracket":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24">
          <path d="M3 5h6v3M3 11h6v3M9 6.5h4v11h4M3 17h6v3" {...stroke} />
        </svg>
      );
    case "trophy":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24">
          <path
            d="M7 4h10v4a5 5 0 0 1-10 0V4zM7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3M9 17h6v3H9zM12 13v4"
            {...stroke}
          />
        </svg>
      );
    case "user":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24">
          <circle cx="12" cy="8" r="3.5" {...stroke} />
          <path d="M5 20c1.5-3.5 4-5 7-5s5.5 1.5 7 5" {...stroke} />
        </svg>
      );
    case "plus":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24">
          <path d="M12 5v14M5 12h14" {...stroke} strokeWidth={2.4} />
        </svg>
      );
    case "back":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24">
          <path d="M14 6l-6 6 6 6" {...stroke} strokeWidth={2} />
        </svg>
      );
    case "bell":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24">
          <path
            d="M5 17h14l-2-2v-4a5 5 0 0 0-10 0v4l-2 2zM10 20h4"
            {...stroke}
          />
        </svg>
      );
    case "settings":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="3" {...stroke} />
          <path
            d="M12 3v3M12 18v3M3 12h3M18 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2"
            {...stroke}
          />
        </svg>
      );
    case "share":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24">
          <circle cx="6" cy="12" r="2" {...stroke} />
          <circle cx="18" cy="6" r="2" {...stroke} />
          <circle cx="18" cy="18" r="2" {...stroke} />
          <path d="M8 11l8-4M8 13l8 4" {...stroke} />
        </svg>
      );
    case "chevron-right":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24">
          <path d="M9 6l6 6-6 6" {...stroke} />
        </svg>
      );
    case "info":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="9" {...stroke} />
          <path d="M12 8v.01M11 12h1v5h1" {...stroke} />
        </svg>
      );
    case "lock":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24">
          <rect x="5" y="11" width="14" height="9" rx="2" {...stroke} />
          <path d="M8 11V8a4 4 0 0 1 8 0v3" {...stroke} />
        </svg>
      );
    case "fire":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24">
          <path
            d="M12 3c2 4-2 5 0 9 1 2 3 0 3-2 2 3 3 5 3 7a6 6 0 0 1-12 0c0-3 3-5 3-9 0-2 2-4 3-5z"
            {...stroke}
          />
        </svg>
      );
    case "check":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24">
          <path d="M5 12l4 4 10-10" {...stroke} strokeWidth={2.4} />
        </svg>
      );
    case "close":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24">
          <path d="M6 6l12 12M18 6L6 18" {...stroke} strokeWidth={2} />
        </svg>
      );
    case "star":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24">
          <path
            d="M12 3l2.6 5.6 6 .9-4.3 4.3 1 6.2L12 17l-5.3 3 1-6.2L3.4 9.5l6-.9z"
            {...stroke}
          />
        </svg>
      );
    case "filter":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24">
          <path d="M4 6h16M7 12h10M10 18h4" {...stroke} strokeWidth={2} />
        </svg>
      );
    default:
      return null;
  }
}
