"use client";

import { cloneElement, isValidElement, useState } from "react";
import { ScoreStepper } from "@/components/domain/score-stepper";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog";
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
      <ResponsiveDialog open={open} onOpenChange={setOpen}>
        <ResponsiveDialogContent className="px-[var(--gutter)] pb-8">
          <ResponsiveDialogHeader className="mb-6">
            <ResponsiveDialogTitle className="text-center">
              {match.home.name} vs {match.away.name}
            </ResponsiveDialogTitle>
          </ResponsiveDialogHeader>
          <ScoreStepper
            match={match}
            initialHome={prediction?.home}
            initialAway={prediction?.away}
            onSave={handleSave}
          />
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </>
  );
}
