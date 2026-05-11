# Domain Components — Fase 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir los componentes de dominio de Stadium Concrete (MatchCard Classic, ScoreStepper, PredictorSheet, LeaderboardRow) con tipos TypeScript, mock data, y sandbox visual en `/dev`.

**Architecture:** Los tipos viven en `src/types/domain.ts` y los mock data en `src/lib/mock-data.ts`. Todos los componentes de dominio van en `src/components/domain/` — separados de `src/components/ui/` (primitivos). MatchCard, ScoreStepper y PredictorSheet son Client Components por interactividad; LeaderboardRow es Server Component (pure display). El sandbox usa un wrapper `"use client"` igual que el patrón de `BottomNavDemo` de Fase 1.

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind v4, shadcn UI, `lucide-react`, `src/lib/utils.ts` (cn).

---

## File Map

| Archivo | Acción | Tipo |
|---|---|---|
| `src/types/domain.ts` | Crear | — |
| `src/lib/mock-data.ts` | Crear | — |
| `src/components/ui/sheet.tsx` | Crear (shadcn CLI) | Client Component |
| `src/components/domain/match-card.tsx` | Crear | Client Component |
| `src/components/domain/score-stepper.tsx` | Crear | Client Component |
| `src/components/domain/predictor-sheet.tsx` | Crear | Client Component |
| `src/components/domain/leaderboard-row.tsx` | Crear | Server Component |
| `src/app/dev/_components/domain-demo.tsx` | Crear | Client Component |
| `src/app/dev/page.tsx` | Modificar | Server Component |

---

## Task 1: Tipos de dominio + Mock Data

Establece la fuente de verdad de tipos y datos estáticos que todos los componentes siguientes van a consumir.

**Files:**
- Create: `src/types/domain.ts`
- Create: `src/lib/mock-data.ts`

- [ ] **Step 1: Crear `src/types/domain.ts`**

```ts
export interface Team {
  name: string
  code: string
  c1: string
  c2: string
}

export type MatchStatus = "live" | "upcoming" | "finished"

export interface Match {
  id: string
  home: Team
  away: Team
  stage: string
  venue: string
  date: string
  status: MatchStatus
  score?: { home: number; away: number }
  minute?: number
}

export type PredictionResult = "exact" | "diff" | "winner" | "miss"

export interface Prediction {
  matchId: string
  home: number
  away: number
  locked: boolean
  result?: PredictionResult
  points?: number
}

export type DeltaDirection = "up" | "down" | "flat"

export interface LeaderboardEntry {
  rank: number
  userId: string
  name: string
  points: number
  delta: DeltaDirection
  deltaValue?: number
  isMe: boolean
}
```

- [ ] **Step 2: Crear `src/lib/mock-data.ts`**

```ts
import type { Match, Prediction, LeaderboardEntry } from "@/types/domain";

const TEAMS = {
  ARG: { name: "Argentina", code: "AR", c1: "#74ACDF", c2: "#FFFFFF" },
  BRA: { name: "Brasil", code: "BR", c1: "#009C3B", c2: "#FFDF00" },
  FRA: { name: "Francia", code: "FR", c1: "#002395", c2: "#ED2939" },
  DEU: { name: "Alemania", code: "DE", c1: "#000000", c2: "#DD0000" },
  ESP: { name: "España", code: "ES", c1: "#AA151B", c2: "#F1BF00" },
} as const;

export const MOCK_MATCHES: Match[] = [
  {
    id: "m1",
    home: TEAMS.ARG,
    away: TEAMS.BRA,
    stage: "FASE DE GRUPOS",
    venue: "Estadio Monumental",
    date: "2026-06-15T20:00:00Z",
    status: "upcoming",
  },
  {
    id: "m2",
    home: TEAMS.FRA,
    away: TEAMS.DEU,
    stage: "CUARTOS DE FINAL",
    venue: "MetLife Stadium",
    date: "2026-06-20T18:00:00Z",
    status: "live",
    score: { home: 2, away: 1 },
    minute: 67,
  },
  {
    id: "m3",
    home: TEAMS.ESP,
    away: TEAMS.ARG,
    stage: "SEMIFINAL",
    venue: "Rose Bowl",
    date: "2026-06-10T15:00:00Z",
    status: "finished",
    score: { home: 1, away: 2 },
  },
];

export const MOCK_PREDICTION: Prediction = {
  matchId: "m3",
  home: 1,
  away: 2,
  locked: true,
  result: "exact",
  points: 5,
};

export const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  {
    rank: 1,
    userId: "u1",
    name: "Carlos Méndez",
    points: 210,
    delta: "up",
    deltaValue: 2,
    isMe: false,
  },
  {
    rank: 2,
    userId: "u2",
    name: "Lucía Fernández",
    points: 185,
    delta: "flat",
    isMe: false,
  },
  {
    rank: 3,
    userId: "u3",
    name: "Martín López",
    points: 172,
    delta: "down",
    deltaValue: 1,
    isMe: false,
  },
  {
    rank: 4,
    userId: "u4",
    name: "Richard Rodriguez",
    points: 142,
    delta: "up",
    deltaValue: 3,
    isMe: true,
  },
  {
    rank: 5,
    userId: "u5",
    name: "Ana García",
    points: 138,
    delta: "down",
    deltaValue: 2,
    isMe: false,
  },
  {
    rank: 6,
    userId: "u6",
    name: "Pedro Suárez",
    points: 125,
    delta: "flat",
    isMe: false,
  },
];
```

- [ ] **Step 3: Verificar tipos**

```bash
npx tsc --noEmit
```

Esperado: sin errores.

- [ ] **Step 4: Commit**

```bash
git add src/types/domain.ts src/lib/mock-data.ts
git commit -m "feat: add domain types and mock data"
```

---

## Task 2: Instalar shadcn Sheet

Base para PredictorSheet. El CLI de shadcn instala el componente y sus dependencias automáticamente.

**Files:**
- Create: `src/components/ui/sheet.tsx` (generado por shadcn)

- [ ] **Step 1: Instalar el componente Sheet de shadcn**

```bash
npx shadcn@latest add sheet
```

Esperado: crea `src/components/ui/sheet.tsx`. Puede instalar dependencias adicionales de `@radix-ui/react-dialog`.

- [ ] **Step 2: Verificar que el archivo fue creado**

```bash
npx tsc --noEmit
```

Esperado: sin errores.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/sheet.tsx
git commit -m "feat: install shadcn Sheet component"
```

---

## Task 3: MatchCard — Variante Classic

Card de partido con stripes de color nacional, tape header, body con equipos y score/hora, y footer condicional de predicción.

**Files:**
- Create: `src/components/domain/match-card.tsx`

- [ ] **Step 1: Crear `src/components/domain/match-card.tsx`**

```tsx
"use client";

import { cn } from "@/lib/utils";
import { Flag } from "@/components/ui/flag";
import { Pill } from "@/components/ui/pill";
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
```

- [ ] **Step 2: Verificar tipos**

```bash
npx tsc --noEmit
```

Esperado: sin errores.

- [ ] **Step 3: Commit**

```bash
git add src/components/domain/match-card.tsx
git commit -m "feat: add MatchCard domain component (Classic variant)"
```

---

## Task 4: ScoreStepper

Stepper interactivo con estado local para predicción de goles. Incluye quick chips con marcadores comunes.

**Files:**
- Create: `src/components/domain/score-stepper.tsx`

- [ ] **Step 1: Crear `src/components/domain/score-stepper.tsx`**

```tsx
"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Flag } from "@/components/ui/flag";
import { Button } from "@/components/ui/button";
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
```

- [ ] **Step 2: Verificar tipos**

```bash
npx tsc --noEmit
```

Esperado: sin errores.

- [ ] **Step 3: Commit**

```bash
git add src/components/domain/score-stepper.tsx
git commit -m "feat: add ScoreStepper with quick chips and min/max guards"
```

---

## Task 5: PredictorSheet

Bottom drawer con estilos Stadium Concrete que envuelve ScoreStepper. Usa shadcn Sheet como base.

**Files:**
- Create: `src/components/domain/predictor-sheet.tsx`

- [ ] **Step 1: Crear `src/components/domain/predictor-sheet.tsx`**

```tsx
"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScoreStepper } from "@/components/domain/score-stepper";
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

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
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
  );
}
```

- [ ] **Step 2: Verificar tipos**

```bash
npx tsc --noEmit
```

Esperado: sin errores.

- [ ] **Step 3: Commit**

```bash
git add src/components/domain/predictor-sheet.tsx
git commit -m "feat: add PredictorSheet bottom drawer with Stadium Concrete styles"
```

---

## Task 6: LeaderboardRow

Fila de ranking con rank coloreado (gold/silver/bronze), nombre, delta de posición y puntos. Server Component puro.

**Files:**
- Create: `src/components/domain/leaderboard-row.tsx`

- [ ] **Step 1: Crear `src/components/domain/leaderboard-row.tsx`**

```tsx
import { cn } from "@/lib/utils";
import type { LeaderboardEntry } from "@/types/domain";

interface LeaderboardRowProps {
  entry: LeaderboardEntry;
  className?: string;
}

const rankColors: Record<number, string> = {
  1: "text-[#FFD60A]",
  2: "text-[#C7CACE]",
  3: "text-[#D08350]",
};

const deltaIcon = { up: "↑", down: "↓", flat: "–" } as const;

const deltaColor = {
  up: "text-[var(--signal)]",
  down: "text-[var(--danger)]",
  flat: "text-[var(--fg-faint)]",
} as const;

export function LeaderboardRow({ entry, className }: LeaderboardRowProps) {
  const { rank, name, points, delta, deltaValue, isMe } = entry;

  return (
    <div
      className={cn(
        "grid grid-cols-[36px_1fr_auto] items-center gap-3 px-[var(--gutter)] py-3",
        isMe && "border-l-2 border-[var(--signal)]",
        className,
      )}
      style={
        isMe
          ? {
              background:
                "linear-gradient(to right, rgba(0,210,106,0.06), transparent)",
            }
          : undefined
      }
    >
      {/* Rank */}
      <span
        className={cn(
          "text-base font-black tabular-nums",
          rankColors[rank] ?? "text-[var(--fg-mute)]",
        )}
      >
        #{rank}
      </span>

      {/* Name + delta */}
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="truncate text-sm font-semibold text-[var(--fg)]">
          {name}
        </span>
        <span className={cn("font-mono text-[11px]", deltaColor[delta])}>
          {deltaIcon[delta]}
          {delta !== "flat" && deltaValue ? ` ${deltaValue}` : " sin cambios"}
        </span>
      </div>

      {/* Points */}
      <span
        className="text-base font-black tabular-nums text-[var(--fg)]"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {points}{" "}
        <span className="font-mono text-[11px] font-normal text-[var(--fg-mute)]">
          pts
        </span>
      </span>
    </div>
  );
}
```

- [ ] **Step 2: Verificar tipos**

```bash
npx tsc --noEmit
```

Esperado: sin errores.

- [ ] **Step 3: Commit**

```bash
git add src/components/domain/leaderboard-row.tsx
git commit -m "feat: add LeaderboardRow with rank colors and delta indicator"
```

---

## Task 7: Sandbox `/dev` — Integración visual

Agrega todas las secciones de dominio al sandbox. Usa el patrón `"use client"` wrapper igual que `BottomNavDemo`.

**Files:**
- Create: `src/app/dev/_components/domain-demo.tsx`
- Modify: `src/app/dev/page.tsx`

- [ ] **Step 1: Crear `src/app/dev/_components/domain-demo.tsx`**

```tsx
"use client";

import { useState } from "react";
import { MatchCard } from "@/components/domain/match-card";
import { PredictorSheet } from "@/components/domain/predictor-sheet";
import { LeaderboardRow } from "@/components/domain/leaderboard-row";
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
          {/* Upcoming — sin predicción todavía */}
          <MatchCard match={MOCK_MATCHES[0]} />
          {/* Live */}
          <MatchCard match={MOCK_MATCHES[1]} />
          {/* Finished con predicción exacta */}
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
        <div className="overflow-hidden rounded-[var(--card-radius)] border border-[var(--line)] divide-y divide-[var(--line)]">
          {MOCK_LEADERBOARD.map((entry) => (
            <LeaderboardRow key={entry.userId} entry={entry} />
          ))}
        </div>
      </section>
    </div>
  );
}
```

- [ ] **Step 2: Agregar `DomainDemo` a `src/app/dev/page.tsx`**

Agregá el import al inicio del archivo:

```tsx
import { DomainDemo } from "@/app/dev/_components/domain-demo";
```

Luego agregá esta sección al final del `<div className="min-h-screen ... space-y-12">`, justo antes del cierre `</div>` y antes del `<BottomNavDemo />`:

```tsx
{/* Domain Components */}
<section className="space-y-4">
  <h2 className="text-sm font-semibold uppercase tracking-widest text-[var(--fg-mute)]">
    Domain Components
  </h2>
  <DomainDemo />
</section>
```

- [ ] **Step 3: Arrancar el dev server y verificar visualmente**

```bash
npm run dev
```

Abrí `http://localhost:3000/dev` y scrolleá hasta el final. Verificar:

**MatchCard:**
- `upcoming` (ARG vs BRA): stripes azul-celeste | verde, tape con "FASE DE GRUPOS · Estadio Monumental", Pill "Próximo", hora en el centro
- `live` (FRA vs DEU): stripes azul marino | negro, borde verde glow, Pill "En vivo" pulsante, score `2 – 1` + minuto `67'`
- `finished` (ESP vs ARG): stripes rojo español | azul-celeste, Pill "Finalizado", score `1 – 2`, footer verde "Exacto · Predijiste 1-2 · +5 pts"

**PredictorSheet:**
- Botón "Predecir: ARG vs BRA →" visible
- Al clickear: sheet sube desde el bottom con fondo oscuro `--bg-2`, grab handle, título "Argentina vs Brasil"
- ScoreStepper: flags + códigos, scores en 72px condensed, botones -/+ funcionales
- Quick chips: `0-0` activo por defecto (verde), al tocar otros cambia el score
- CTA "Guardar predicción →": cierra el sheet y muestra mensaje "Guardado: ARG 0 – 0 BRA" (u el marcador elegido)

**LeaderboardRow:**
- 6 filas con bordes divisorios
- `#1` en gold, `#2` en silver, `#3` en bronze, `#4` en gris
- Fila `#4 Richard Rodriguez` con gradiente verde sutil y borde izquierdo señal
- Deltas: `↑ 2` verde, `– sin cambios` gris, `↓ 1` rojo

- [ ] **Step 4: Correr Biome**

```bash
npx biome check --write src/
```

Esperado: 0 errores después de aplicar fixes.

- [ ] **Step 5: Commit final**

```bash
git add src/app/dev/_components/domain-demo.tsx src/app/dev/page.tsx
git commit -m "feat: add domain components to dev sandbox"
```

---

## Self-Review

### Cobertura del spec

| Requisito | Task | Estado |
|---|---|---|
| `src/types/domain.ts` — Team, Match, Prediction, LeaderboardEntry | Task 1 | ✅ |
| `src/lib/mock-data.ts` — 3 partidos, predicción, 6 filas leaderboard | Task 1 | ✅ |
| shadcn Sheet instalado | Task 2 | ✅ |
| MatchCard Classic — stripes, tape, body, footer | Task 3 | ✅ |
| MatchCard `live` — glow border + minuto | Task 3 | ✅ |
| MatchCard `finished` — footer con resultado + pts | Task 3 | ✅ |
| ScoreStepper — steppers, estado local, min/max | Task 4 | ✅ |
| ScoreStepper — quick chips con chip activo | Task 4 | ✅ |
| ScoreStepper — CTA llama `onSave` | Task 4 | ✅ |
| PredictorSheet — shadcn Sheet side="bottom" | Task 5 | ✅ |
| PredictorSheet — grab handle + header + ScoreStepper | Task 5 | ✅ |
| PredictorSheet — cierra al guardar | Task 5 | ✅ |
| LeaderboardRow — grid 3 cols | Task 6 | ✅ |
| LeaderboardRow — rank colors gold/silver/bronze | Task 6 | ✅ |
| LeaderboardRow — delta up/down/flat | Task 6 | ✅ |
| LeaderboardRow — `isMe` highlight | Task 6 | ✅ |
| Sandbox `/dev` — 3 secciones nuevas | Task 7 | ✅ |
| `domain/` separado de `ui/` | Tasks 3-6 | ✅ |

### Decisiones de implementación documentadas

| Decisión | Razón |
|---|---|
| MatchCard como `"use client"` | Acepta `onPredict?: () => void` — funciones no cruzan Server→Client boundary |
| `formatTime` con `toLocaleTimeString("es-AR")` | Hora en formato 24h local argentino |
| `QUICK_CHIPS` como `const` array fuera del componente | Evita re-crear el array en cada render |
| `stepperBtnClass` como constante de string | Evita repetición de clases Tailwind largas — los dos botones +/- son idénticos |
| `PredictorSheet` maneja su propio `open` state | Más simple que controlled sheet para el caso de uso actual |
| Sandbox muestra PredictorSheet con botón separado | Evita complejidad de SheetTrigger `asChild` con componentes complejos como MatchCard |
