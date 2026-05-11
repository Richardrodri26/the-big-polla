"use client";

import { Flag } from "@/components/ui/flag";
import { Pill } from "@/components/ui/pill";
import { cn } from "@/lib/utils";
import type { Match, Prediction } from "@/types/domain";

interface MatchCardProps {
  match: Match;
  prediction?: Prediction;
  onPredict?: () => void;
  className?: string;
}

const resultColors = {
  exact: "text-[var(--signal)]",
  diff: "text-[var(--signal)]",
  winner: "text-[var(--signal)]",
  miss: "text-[var(--danger)]",
} as const;

const resultLabels = {
  exact: "Exacto",
  diff: "Diferencia",
  winner: "Ganador",
  miss: "Fallaste",
} as const;

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function MatchCard({
  match,
  prediction,
  onPredict,
  className,
}: MatchCardProps) {
  const { home, away, status, score, stage, venue, minute } = match;
  const isLocked = status === "live" || status === "finished";
  const canPredict = !!onPredict && !isLocked;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-[var(--card-radius)] border border-[var(--line)] bg-[var(--surface)]",
        status === "live" && "shadow-[0_0_0_1px_rgba(0,210,106,0.15)]",
        className,
      )}
    >
      {/* Stripes */}
      <div
        className="h-1.5"
        style={{
          background: `linear-gradient(to right, ${home.c1} 50%, ${away.c1} 50%)`,
          opacity: status === "finished" ? 0.6 : 1,
        }}
      />

      {/* Tape header */}
      <div
        className="flex items-center justify-between px-[var(--gutter)] py-2"
        style={{
          background:
            "repeating-linear-gradient(90deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 8px, transparent 8px, transparent 16px)",
        }}
      >
        <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--fg-mute)]">
          {stage} · {venue}
        </span>
        <Pill
          status={
            status === "live"
              ? "live"
              : status === "finished"
                ? "finished"
                : "upcoming"
          }
        />
      </div>

      {/* Body */}
      <button
        type="button"
        disabled={!canPredict}
        onClick={canPredict ? onPredict : undefined}
        className={cn(
          "grid w-full grid-cols-3 items-center gap-2 px-[var(--gutter)] py-4",
          canPredict &&
            "cursor-pointer transition-colors hover:bg-white/[0.02]",
          !canPredict && "cursor-default",
        )}
      >
        {/* Home team */}
        <div className="flex flex-col items-start gap-1">
          <Flag code={home.code} size="md" />
          <span className="max-w-full truncate text-sm font-bold leading-tight text-[var(--fg)]">
            {home.name}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--fg-faint)]">
            {home.code}
          </span>
        </div>

        {/* Center: score or time */}
        <div className="flex flex-col items-center gap-1">
          {status === "upcoming" ? (
            <span className="font-mono text-lg font-semibold text-[var(--fg-mute)]">
              {formatTime(match.date)}
            </span>
          ) : (
            <>
              <span
                className="text-3xl font-black text-[var(--fg)]"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {score?.home ?? 0} – {score?.away ?? 0}
              </span>
              {status === "live" && minute !== undefined && (
                <span className="font-mono text-[10px] text-[var(--signal)]">
                  {minute}&apos;
                </span>
              )}
            </>
          )}
        </div>

        {/* Away team */}
        <div className="flex flex-col items-end gap-1">
          <Flag code={away.code} size="md" />
          <span className="max-w-full truncate text-right text-sm font-bold leading-tight text-[var(--fg)]">
            {away.name}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--fg-faint)]">
            {away.code}
          </span>
        </div>
      </button>

      {/* Footer: prediction result */}
      {status === "finished" && prediction?.result && (
        <div className="flex items-center justify-between border-t border-[var(--line)] px-[var(--gutter)] py-2">
          <span
            className={cn(
              "text-[11px] font-semibold uppercase tracking-wide",
              resultColors[prediction.result],
            )}
          >
            {resultLabels[prediction.result]} · Predijiste {prediction.home}-
            {prediction.away}
          </span>
          <span className="font-mono text-[11px] font-semibold text-[var(--warn)]">
            +{prediction.points ?? 0} pts
          </span>
        </div>
      )}
    </div>
  );
}
