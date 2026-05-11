"use client";

import { Minus, Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Flag } from "@/components/ui/flag";
import { cn } from "@/lib/utils";
import type { Match } from "@/types/domain";

interface ScoreStepperProps {
  match: Match;
  initialHome?: number;
  initialAway?: number;
  onSave: (home: number, away: number) => void;
}

const QUICK_CHIPS: [number, number][] = [
  [0, 0],
  [1, 0],
  [0, 1],
  [2, 0],
  [0, 2],
  [2, 1],
  [1, 2],
  [3, 0],
  [3, 1],
  [3, 2],
];

const stepperBtnClass =
  "flex size-11 items-center justify-center rounded-xl border border-[var(--line)] bg-white/[0.04] transition-colors hover:bg-white/[0.08] active:scale-95 disabled:cursor-not-allowed disabled:opacity-30";

export function ScoreStepper({
  match,
  initialHome = 0,
  initialAway = 0,
  onSave,
}: ScoreStepperProps) {
  const [homeGoals, setHomeGoals] = useState(initialHome);
  const [awayGoals, setAwayGoals] = useState(initialAway);

  return (
    <div className="flex flex-col gap-6">
      {/* Teams header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flag code={match.home.code} size="md" />
          <span className="text-sm font-bold text-[var(--fg)]">
            {match.home.code}
          </span>
        </div>
        <span className="font-mono text-xs text-[var(--fg-mute)]">vs</span>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-[var(--fg)]">
            {match.away.code}
          </span>
          <Flag code={match.away.code} size="md" />
        </div>
      </div>

      {/* Steppers */}
      <div className="flex items-center justify-center gap-6">
        {/* Home */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={homeGoals <= 0}
            onClick={() => setHomeGoals((n) => Math.max(0, n - 1))}
            className={stepperBtnClass}
          >
            <Minus size={18} className="text-[var(--fg-mute)]" />
          </button>
          <span
            className="w-14 text-center text-[72px] font-black leading-none text-[var(--fg)]"
            style={{
              fontVariationSettings: '"wdth" 75',
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {homeGoals}
          </span>
          <button
            type="button"
            disabled={homeGoals >= 20}
            onClick={() => setHomeGoals((n) => Math.min(20, n + 1))}
            className={stepperBtnClass}
          >
            <Plus size={18} className="text-[var(--fg-mute)]" />
          </button>
        </div>

        <span className="font-mono text-xl text-[var(--fg-faint)]">–</span>

        {/* Away */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={awayGoals <= 0}
            onClick={() => setAwayGoals((n) => Math.max(0, n - 1))}
            className={stepperBtnClass}
          >
            <Minus size={18} className="text-[var(--fg-mute)]" />
          </button>
          <span
            className="w-14 text-center text-[72px] font-black leading-none text-[var(--fg)]"
            style={{
              fontVariationSettings: '"wdth" 75',
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {awayGoals}
          </span>
          <button
            type="button"
            disabled={awayGoals >= 20}
            onClick={() => setAwayGoals((n) => Math.min(20, n + 1))}
            className={stepperBtnClass}
          >
            <Plus size={18} className="text-[var(--fg-mute)]" />
          </button>
        </div>
      </div>

      {/* Quick chips */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {QUICK_CHIPS.map(([h, a]) => (
          <button
            key={`${h}-${a}`}
            type="button"
            onClick={() => {
              setHomeGoals(h);
              setAwayGoals(a);
            }}
            className={cn(
              "flex-shrink-0 rounded-lg border px-3 py-1.5 font-mono text-xs font-semibold transition-colors",
              homeGoals === h && awayGoals === a
                ? "border-transparent bg-[var(--signal)] text-[#04130A]"
                : "border-[var(--line)] bg-[var(--surface-2)] text-[var(--fg-mute)] hover:text-[var(--fg)]",
            )}
          >
            {h}-{a}
          </button>
        ))}
      </div>

      {/* CTA */}
      <Button
        variant="default"
        className="w-full"
        onClick={() => onSave(homeGoals, awayGoals)}
      >
        Guardar predicción →
      </Button>
    </div>
  );
}
