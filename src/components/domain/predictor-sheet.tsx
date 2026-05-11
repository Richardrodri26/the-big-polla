"use client";

import { cloneElement, isValidElement, useState } from "react";
import { ScoreStepper } from "@/components/domain/score-stepper";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { Match, Prediction } from "@/types/domain";

interface PredictorSheetProps {
  match: Match;
  prediction?: Prediction;
  trigger: React.ReactNode;
  onSave: (home: number, away: number) => void;
}

export function PredictorSheet({
  match,
  prediction,
  trigger,
  onSave,
}: PredictorSheetProps) {
  const [open, setOpen] = useState(false);

  function handleSave(home: number, away: number) {
    onSave(home, away);
    setOpen(false);
  }

  const triggerWithHandler = isValidElement(trigger)
    ? cloneElement(trigger as React.ReactElement<{ onClick?: () => void }>, {
        onClick: () => setOpen(true),
      })
    : trigger;

  return (
    <>
      {triggerWithHandler}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          className="rounded-t-3xl border-t border-[var(--line)] bg-[var(--bg-2)] px-[var(--gutter)] pb-8 pt-3"
        >
          {/* Grab handle */}
          <div className="mx-auto mb-5 h-1 w-9 rounded-full bg-[var(--fg-faint)]" />

          <SheetHeader className="mb-6">
            <SheetTitle className="text-center text-base font-bold text-[var(--fg)]">
              {match.home.name} vs {match.away.name}
            </SheetTitle>
          </SheetHeader>

          <ScoreStepper
            match={match}
            initialHome={prediction?.home}
            initialAway={prediction?.away}
            onSave={handleSave}
          />
        </SheetContent>
      </Sheet>
    </>
  );
}
