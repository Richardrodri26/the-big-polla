"use client";

import { useState } from "react";
import { LeaderboardRow } from "@/components/domain/leaderboard-row";
import { MatchCard } from "@/components/domain/match-card";
import { PredictorSheet } from "@/components/domain/predictor-sheet";
import { Button } from "@/components/ui/button";
import {
  MOCK_LEADERBOARD,
  MOCK_MATCHES,
  MOCK_PREDICTION,
} from "@/lib/mock-data";

export function DomainDemo() {
  const [savedPrediction, setSavedPrediction] = useState<string | null>(null);

  return (
    <div className="space-y-10">
      {/* MatchCard section */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-[var(--fg-mute)]">
          MatchCard
        </h2>
        <div className="space-y-3">
          <MatchCard match={MOCK_MATCHES[0]} />
          <MatchCard match={MOCK_MATCHES[1]} />
          <MatchCard match={MOCK_MATCHES[2]} prediction={MOCK_PREDICTION} />
        </div>
      </section>

      {/* PredictorSheet section */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-[var(--fg-mute)]">
          PredictorSheet
        </h2>
        <PredictorSheet
          match={MOCK_MATCHES[0]}
          trigger={
            <Button variant="secondary" className="w-full">
              Predecir: {MOCK_MATCHES[0].home.code} vs{" "}
              {MOCK_MATCHES[0].away.code} →
            </Button>
          }
          onSave={(h, a) =>
            setSavedPrediction(
              `Guardado: ${MOCK_MATCHES[0].home.code} ${h} – ${a} ${MOCK_MATCHES[0].away.code}`,
            )
          }
        />
        {savedPrediction && (
          <p className="font-mono text-xs text-[var(--signal)]">
            {savedPrediction}
          </p>
        )}
      </section>

      {/* LeaderboardRow section */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-[var(--fg-mute)]">
          LeaderboardRow
        </h2>
        <div className="divide-y divide-[var(--line)] overflow-hidden rounded-[var(--card-radius)] border border-[var(--line)]">
          {MOCK_LEADERBOARD.map((entry) => (
            <LeaderboardRow key={entry.userId} entry={entry} />
          ))}
        </div>
      </section>
    </div>
  );
}
