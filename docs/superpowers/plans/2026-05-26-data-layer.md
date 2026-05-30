# Data Layer — Repository Pattern Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace direct imports from `tournament-data.ts` with a Repository Pattern that makes match data, league data, and predictions swappable between mock and real backend without touching the UI.

**Architecture:** Three repository interfaces (`IMatchRepository`, `ILeagueRepository`, `IPredictionRepository`) with mock implementations backed by static data. A factory reads `NEXT_PUBLIC_DATA_SOURCE` to select the implementation. Pages become Server Components that fetch via repositories; client components handle only UI state. Predictions persist via Zustand `persist` middleware to `localStorage`.

**Tech Stack:** Next.js 15 App Router, TypeScript, Zustand + persist middleware. No new dependencies.

**Out of scope:** `src/app/(main)/oracle/page.tsx` (bracket predictions — different domain), `src/app/create/` and `src/app/join/` (Phase 6), real API implementations.

---

## File Map

| Action | File | Responsibility |
|--------|------|---------------|
| Modify | `src/types/domain.ts` | Single source of truth for all domain types |
| Create | `src/repositories/interfaces/index.ts` | Repository contracts |
| Create | `src/lib/date-utils.ts` | Derive display strings from ISO kickoffAt |
| Create | `src/repositories/mock/match.repository.ts` | Static match data |
| Create | `src/repositories/mock/league.repository.ts` | Static member/scoring data |
| Create | `src/repositories/mock/prediction.repository.ts` | Thin mock (no-op saves) |
| Create | `src/repositories/index.ts` | Factory functions |
| Create | `src/store/prediction-store.ts` | Predictions + localStorage persist |
| Modify | `src/store/app-store.ts` | Remove predictions, keep UI state only |
| Modify | `src/components/domain/predictor-overlay.tsx` | Use Match type + predictionStore |
| Create | `src/app/(main)/feed/feed-screen.tsx` | Client UI for feed (extracted) |
| Modify | `src/app/(main)/feed/page.tsx` | Server Component: fetches, passes props |
| Create | `src/app/(main)/feed/[id]/match-detail-screen.tsx` | Client UI for match detail |
| Modify | `src/app/(main)/feed/[id]/page.tsx` | Server Component |
| Create | `src/app/(main)/leaderboard/leaderboard-screen.tsx` | Client UI for leaderboard |
| Modify | `src/app/(main)/leaderboard/page.tsx` | Server Component |
| Create | `src/app/(main)/profile/profile-screen.tsx` | Client UI for profile |
| Modify | `src/app/(main)/profile/page.tsx` | Server Component |
| Delete | `src/lib/tournament-data.ts` | Replaced by repositories |
| Delete | `src/lib/mock-data.ts` | Replaced by repositories |

---

## Task 1: Extend domain types

**Files:**
- Modify: `src/types/domain.ts`

- [ ] **Step 1: Replace the entire file with the extended domain types**

```ts
// src/types/domain.ts

export type MatchState = 'live' | 'pending' | 'final'

export interface Team {
  code: string
  name: string
  c1: string
  c2: string
}

export interface MatchTimeline {
  min: number
  head: string
  body: string
}

export interface Match {
  id: string
  state: MatchState
  kickoffAt: string           // ISO 8601 — client derives display strings from this
  venue: string
  stage: string
  home: Team
  away: Team
  locked: boolean
  liveMinute?: number         // e.g. 78 — only present when state === 'live'
  score?: [number, number]    // only present when state !== 'pending'
  userPrediction?: [number, number] | null
  pts?: number                // pre-calculated by backend — client only displays
  basePts?: number
  streakBonus?: number
  correctOutcome?: boolean
  correctScore?: boolean
  timeline?: MatchTimeline[]
}

export interface Member {
  id: string
  name: string
  handle: string
  color: string
  rank: number
  prevRank: number
  pts: number
  hits: number
  streak: number
  me?: boolean
  breakdown: {
    exact: number
    diff: number
    winner: number
    streakBonus: number
    comboBonus: number
    oraclePartial: number
  }
}

export interface Prediction {
  matchId: string
  score: [number, number]
  savedAt: string  // ISO 8601
}

export interface ScoringRules {
  exact: number
  diff: number
  winner: number
  streakStep: number
  streakMax: number
  combo: number
}

export interface Badge {
  id: string
  num: string
  label: string
  unlocked: boolean
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`  
Expected: 0 errors on `src/types/domain.ts` itself (errors in other files that still import from `tournament-data` are fine for now).

- [ ] **Step 3: Commit**

```bash
git add src/types/domain.ts
git commit -m "feat(types): extend domain types for repository pattern"
```

---

## Task 2: Repository interfaces

**Files:**
- Create: `src/repositories/interfaces/index.ts`

- [ ] **Step 1: Create the interfaces file**

```ts
// src/repositories/interfaces/index.ts
import type { Badge, Match, MatchState, Member, Prediction, ScoringRules } from '@/types/domain'

export interface IMatchRepository {
  getMatches(filters?: { state?: MatchState }): Promise<Match[]>
  getMatch(id: string): Promise<Match | null>
}

export interface ILeagueRepository {
  getLeaderboard(leagueId: string): Promise<Member[]>
  getMembers(leagueId: string): Promise<Member[]>
  getScoringRules(leagueId: string): Promise<ScoringRules>
  getBadges(userId: string): Promise<Badge[]>
}

export interface IPredictionRepository {
  getPredictions(userId: string): Promise<Prediction[]>
  savePrediction(matchId: string, score: [number, number]): Promise<void>
}
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit`  
Expected: compiles with 0 new errors.

- [ ] **Step 3: Commit**

```bash
git add src/repositories/interfaces/index.ts
git commit -m "feat(repositories): add repository interfaces"
```

---

## Task 3: Date utilities

**Files:**
- Create: `src/lib/date-utils.ts`

These replace the hardcoded `dayLabel`, `time`, `weekday`, etc. fields that used to live in `tournament-data.ts`.

- [ ] **Step 1: Create the file**

```ts
// src/lib/date-utils.ts

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

export function getDayLabel(kickoffAt: string): string {
  const now = startOfDay(new Date())
  const match = startOfDay(new Date(kickoffAt))
  const diff = Math.round((match.getTime() - now.getTime()) / 86400000)
  if (diff === 0) return 'HOY'
  if (diff === 1) return 'MAÑANA'
  if (diff === -1) return 'AYER'
  return match
    .toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric' })
    .toUpperCase()
}

export function getKickoffTime(kickoffAt: string): string {
  return new Date(kickoffAt).toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

export function getDateNum(kickoffAt: string): string {
  return String(new Date(kickoffAt).getDate()).padStart(2, '0')
}

export function getWeekday(kickoffAt: string): string {
  return new Date(kickoffAt)
    .toLocaleDateString('es-AR', { weekday: 'short' })
    .toUpperCase()
}

export function getMonthShort(kickoffAt: string): string {
  return new Date(kickoffAt)
    .toLocaleDateString('es-AR', { month: 'short' })
    .toUpperCase()
}

export function getKickoffIn(kickoffAt: string): string | undefined {
  const diff = new Date(kickoffAt).getTime() - Date.now()
  if (diff <= 0 || diff > 24 * 3600 * 1000) return undefined
  const hours = Math.floor(diff / 3600000)
  const mins = Math.floor((diff % 3600000) / 60000)
  return hours > 0 ? `EN ${hours}H` : `EN ${mins}MIN`
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/date-utils.ts
git commit -m "feat(lib): add date utility functions for kickoffAt formatting"
```

---

## Task 4: MockMatchRepository

**Files:**
- Create: `src/repositories/mock/match.repository.ts`

Dates are generated dynamically relative to "now" so `getDayLabel` returns HOY/MAÑANA/AYER correctly regardless of when the app runs.

- [ ] **Step 1: Create the file**

```ts
// src/repositories/mock/match.repository.ts
import type { IMatchRepository } from '@/repositories/interfaces'
import type { Match, MatchState } from '@/types/domain'

function kickoffAt(dayOffset: number, hour: number, minute: number): string {
  const d = new Date()
  d.setDate(d.getDate() + dayOffset)
  d.setHours(hour, minute, 0, 0)
  return d.toISOString()
}

const MOCK_MATCHES: Match[] = [
  // ── HOY · live ────────────────────────────────────────────────────────────
  {
    id: 'm1',
    state: 'live',
    kickoffAt: kickoffAt(0, 10, 0),
    liveMinute: 78,
    venue: 'Estadio Azteca, CDMX',
    stage: 'Grupo A',
    home: { code: 'MEX', name: 'México', c1: '#006847', c2: '#CE1126' },
    away: { code: 'CAN', name: 'Canadá', c1: '#D80027', c2: '#FFFFFF' },
    locked: true,
    score: [2, 1],
    userPrediction: [2, 1],
    timeline: [
      { min: 12, head: 'GOL · Hirving Lozano', body: 'Asistencia de Edson Álvarez tras un tiro de esquina.' },
      { min: 34, head: 'AMARILLA · Alphonso Davies', body: 'Falta táctica en mediocampo.' },
      { min: 47, head: 'GOL · Jonathan David', body: 'Cabezazo tras centro de Buchanan.' },
      { min: 71, head: 'GOL · Santiago Giménez', body: 'Definición cruzada, asistencia de Lozano.' },
    ],
  },
  {
    id: 'm2',
    state: 'live',
    kickoffAt: kickoffAt(0, 12, 0),
    liveMinute: 23,
    venue: 'MetLife Stadium, NJ',
    stage: 'Grupo B',
    home: { code: 'USA', name: 'Estados Unidos', c1: '#0A3161', c2: '#B31942' },
    away: { code: 'POR', name: 'Portugal', c1: '#006600', c2: '#FF0000' },
    locked: true,
    score: [0, 1],
    userPrediction: [1, 2],
  },
  // ── HOY · pending ─────────────────────────────────────────────────────────
  {
    id: 'm3',
    state: 'pending',
    kickoffAt: kickoffAt(0, 20, 0),
    venue: 'SoFi Stadium, LA',
    stage: 'Grupo C',
    home: { code: 'ARG', name: 'Argentina', c1: '#74ACDF', c2: '#FFFFFF' },
    away: { code: 'POL', name: 'Polonia', c1: '#DC143C', c2: '#FFFFFF' },
    locked: false,
    userPrediction: null,
  },
  // ── MAÑANA · pending ──────────────────────────────────────────────────────
  {
    id: 'm4',
    state: 'pending',
    kickoffAt: kickoffAt(1, 13, 0),
    venue: 'BC Place, Vancouver',
    stage: 'Grupo D',
    home: { code: 'FRA', name: 'Francia', c1: '#0055A4', c2: '#EF4135' },
    away: { code: 'MAR', name: 'Marruecos', c1: '#C1272D', c2: '#006233' },
    locked: false,
    userPrediction: [2, 0],
  },
  {
    id: 'm5',
    state: 'pending',
    kickoffAt: kickoffAt(1, 16, 0),
    venue: 'Estadio Akron, Guad.',
    stage: 'Grupo E',
    home: { code: 'ESP', name: 'España', c1: '#AA151B', c2: '#F1BF00' },
    away: { code: 'GER', name: 'Alemania', c1: '#000000', c2: '#FFCE00' },
    locked: false,
    userPrediction: null,
  },
  {
    id: 'm6',
    state: 'pending',
    kickoffAt: kickoffAt(1, 19, 0),
    venue: 'AT&T Stadium, Dallas',
    stage: 'Grupo F',
    home: { code: 'BEL', name: 'Bélgica', c1: '#000000', c2: '#FFD90C' },
    away: { code: 'BRA', name: 'Brasil', c1: '#009C3B', c2: '#FFDF00' },
    locked: false,
    userPrediction: [1, 1],
  },
  // ── AYER · final ──────────────────────────────────────────────────────────
  {
    id: 'm7',
    state: 'final',
    kickoffAt: kickoffAt(-1, 20, 0),
    venue: 'Estadio BBVA, Monterrey',
    stage: 'Grupo I',
    home: { code: 'ITA', name: 'Italia', c1: '#009246', c2: '#CE2B37' },
    away: { code: 'NED', name: 'Países Bajos', c1: '#AE1C28', c2: '#21468B' },
    locked: true,
    score: [1, 2],
    userPrediction: [1, 2],
    pts: 7,
    basePts: 5,
    streakBonus: 2,
    correctOutcome: true,
    correctScore: true,
  },
  {
    id: 'm8',
    state: 'final',
    kickoffAt: kickoffAt(-1, 17, 0),
    venue: 'Mercedes-Benz Stadium, Atlanta',
    stage: 'Grupo J',
    home: { code: 'ENG', name: 'Inglaterra', c1: '#FFFFFF', c2: '#CE1124' },
    away: { code: 'SEN', name: 'Senegal', c1: '#00853F', c2: '#FDEF42' },
    locked: true,
    score: [3, 1],
    userPrediction: [2, 0],
    pts: 1,
    basePts: 1,
    streakBonus: 0,
    correctOutcome: true,
    correctScore: false,
  },
  {
    id: 'm9',
    state: 'final',
    kickoffAt: kickoffAt(-1, 14, 0),
    venue: 'Lumen Field, Seattle',
    stage: 'Grupo K',
    home: { code: 'TUR', name: 'Turquía', c1: '#E30A17', c2: '#FFFFFF' },
    away: { code: 'ALG', name: 'Argelia', c1: '#006233', c2: '#FFFFFF' },
    locked: true,
    score: [0, 0],
    userPrediction: [1, 2],
    pts: 0,
    basePts: 0,
    streakBonus: 0,
    correctOutcome: false,
    correctScore: false,
  },
]

export class MockMatchRepository implements IMatchRepository {
  async getMatches(filters?: { state?: MatchState }): Promise<Match[]> {
    if (filters?.state) {
      return MOCK_MATCHES.filter(m => m.state === filters.state)
    }
    return MOCK_MATCHES
  }

  async getMatch(id: string): Promise<Match | null> {
    return MOCK_MATCHES.find(m => m.id === id) ?? null
  }
}
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit`  
Expected: 0 errors in the new file.

- [ ] **Step 3: Commit**

```bash
git add src/repositories/mock/match.repository.ts
git commit -m "feat(repositories): add MockMatchRepository with dynamic dates"
```

---

## Task 5: MockLeagueRepository

**Files:**
- Create: `src/repositories/mock/league.repository.ts`

- [ ] **Step 1: Create the file**

```ts
// src/repositories/mock/league.repository.ts
import type { ILeagueRepository } from '@/repositories/interfaces'
import type { Badge, Member, ScoringRules } from '@/types/domain'

const MOCK_MEMBERS: Member[] = [
  {
    id: 'u1', name: 'Tania M.', handle: '@tania', color: '#00D26A',
    rank: 1, prevRank: 1, pts: 287, hits: 12, streak: 5,
    breakdown: { exact: 8, diff: 4, winner: 4, streakBonus: 22, comboBonus: 30, oraclePartial: 25 },
  },
  {
    id: 'u2', name: 'Carlos D.', handle: '@kdiaz', color: '#FF3D71',
    rank: 2, prevRank: 3, pts: 274, hits: 11, streak: 2,
    breakdown: { exact: 7, diff: 3, winner: 4, streakBonus: 8, comboBonus: 20, oraclePartial: 25 },
  },
  {
    id: 'u3', name: 'Mariana V.', handle: '@marivg', color: '#FFD60A',
    rank: 3, prevRank: 2, pts: 268, hits: 11, streak: 0,
    breakdown: { exact: 7, diff: 3, winner: 4, streakBonus: 5, comboBonus: 20, oraclePartial: 23 },
  },
  {
    id: 'u4', name: 'Tú', handle: '@you', color: '#08F7FE', me: true,
    rank: 4, prevRank: 7, pts: 252, hits: 10, streak: 3,
    breakdown: { exact: 6, diff: 4, winner: 4, streakBonus: 12, comboBonus: 10, oraclePartial: 22 },
  },
  {
    id: 'u5', name: 'Pablo R.', handle: '@prios', color: '#7C3AED',
    rank: 5, prevRank: 4, pts: 241, hits: 9, streak: 0,
    breakdown: { exact: 6, diff: 3, winner: 3, streakBonus: 4, comboBonus: 10, oraclePartial: 20 },
  },
  {
    id: 'u6', name: 'Lucía F.', handle: '@lucy', color: '#FB7185',
    rank: 6, prevRank: 5, pts: 233, hits: 9, streak: 1,
    breakdown: { exact: 6, diff: 3, winner: 3, streakBonus: 3, comboBonus: 10, oraclePartial: 18 },
  },
  {
    id: 'u7', name: 'Diego A.', handle: '@deigo', color: '#34D399',
    rank: 7, prevRank: 6, pts: 224, hits: 8, streak: 0,
    breakdown: { exact: 5, diff: 3, winner: 3, streakBonus: 2, comboBonus: 10, oraclePartial: 17 },
  },
  {
    id: 'u8', name: 'Valentina O.', handle: '@valeo', color: '#F59E0B',
    rank: 8, prevRank: 8, pts: 210, hits: 8, streak: 0,
    breakdown: { exact: 5, diff: 2, winner: 3, streakBonus: 2, comboBonus: 0, oraclePartial: 16 },
  },
  {
    id: 'u9', name: 'Sofía B.', handle: '@sofb', color: '#A78BFA',
    rank: 9, prevRank: 11, pts: 198, hits: 7, streak: 2,
    breakdown: { exact: 5, diff: 2, winner: 2, streakBonus: 4, comboBonus: 0, oraclePartial: 15 },
  },
]

const MOCK_SCORING_RULES: ScoringRules = {
  exact: 5,
  diff: 3,
  winner: 1,
  streakStep: 1,
  streakMax: 5,
  combo: 10,
}

const MOCK_BADGES: Badge[] = [
  { id: 'b1', num: '★', label: 'PRIMER EXACTO', unlocked: true },
  { id: 'b2', num: '3', label: 'RACHA × 3', unlocked: true },
  { id: 'b3', num: '10', label: '10 ACIERTOS', unlocked: false },
  { id: 'b4', num: '5', label: 'PLENO JORNADA', unlocked: false },
  { id: 'b5', num: '★★', label: 'EXACTO FINAL', unlocked: false },
  { id: 'b6', num: '∞', label: 'RACHA × 5', unlocked: false },
  { id: 'b7', num: '25', label: '25 PARTIDOS', unlocked: true },
  { id: 'b8', num: '🏆', label: 'CAMPEÓN LIGA', unlocked: false },
]

export class MockLeagueRepository implements ILeagueRepository {
  async getLeaderboard(_leagueId: string): Promise<Member[]> {
    return MOCK_MEMBERS
  }

  async getMembers(_leagueId: string): Promise<Member[]> {
    return MOCK_MEMBERS
  }

  async getScoringRules(_leagueId: string): Promise<ScoringRules> {
    return MOCK_SCORING_RULES
  }

  async getBadges(_userId: string): Promise<Badge[]> {
    return MOCK_BADGES
  }
}
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit`  
Expected: 0 errors in the new file.

- [ ] **Step 3: Commit**

```bash
git add src/repositories/mock/league.repository.ts
git commit -m "feat(repositories): add MockLeagueRepository"
```

---

## Task 6: MockPredictionRepository + factory

**Files:**
- Create: `src/repositories/mock/prediction.repository.ts`
- Create: `src/repositories/index.ts`

- [ ] **Step 1: Create MockPredictionRepository**

```ts
// src/repositories/mock/prediction.repository.ts
import type { IPredictionRepository } from '@/repositories/interfaces'
import type { Prediction } from '@/types/domain'

export class MockPredictionRepository implements IPredictionRepository {
  async getPredictions(_userId: string): Promise<Prediction[]> {
    // In the mock phase, userPrediction is embedded in each Match.
    // This method exists for interface compliance — the real implementation
    // will return the user's predictions from the backend.
    return []
  }

  async savePrediction(_matchId: string, _score: [number, number]): Promise<void> {
    // In the mock phase, saves go directly to predictionStore (Zustand + localStorage).
    // The real implementation will POST to the backend API.
  }
}
```

- [ ] **Step 2: Create the factory**

```ts
// src/repositories/index.ts
import { MockLeagueRepository } from '@/repositories/mock/league.repository'
import { MockMatchRepository } from '@/repositories/mock/match.repository'
import { MockPredictionRepository } from '@/repositories/mock/prediction.repository'
import type { ILeagueRepository, IMatchRepository, IPredictionRepository } from '@/repositories/interfaces'

const source = process.env.NEXT_PUBLIC_DATA_SOURCE ?? 'mock'

export function getMatchRepository(): IMatchRepository {
  if (source === 'api') throw new Error('ApiMatchRepository not implemented yet')
  return new MockMatchRepository()
}

export function getLeagueRepository(): ILeagueRepository {
  if (source === 'api') throw new Error('ApiLeagueRepository not implemented yet')
  return new MockLeagueRepository()
}

export function getPredictionRepository(): IPredictionRepository {
  if (source === 'api') throw new Error('ApiPredictionRepository not implemented yet')
  return new MockPredictionRepository()
}
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit`  
Expected: 0 errors in both new files.

- [ ] **Step 4: Commit**

```bash
git add src/repositories/mock/prediction.repository.ts src/repositories/index.ts
git commit -m "feat(repositories): add MockPredictionRepository and factory"
```

---

## Task 7: Prediction store + update app-store + update predictor-overlay

**Files:**
- Create: `src/store/prediction-store.ts`
- Modify: `src/store/app-store.ts`
- Modify: `src/components/domain/predictor-overlay.tsx`

- [ ] **Step 1: Create prediction-store with persist middleware**

```ts
// src/store/prediction-store.ts
'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface PredictionState {
  predictions: Record<string, [number, number]>
  savePrediction: (matchId: string, score: [number, number]) => void
  getPrediction: (matchId: string) => [number, number] | undefined
  clearAll: () => void
}

export const usePredictionStore = create<PredictionState>()(
  persist(
    (set, get) => ({
      predictions: {},
      savePrediction: (matchId, score) =>
        set(s => ({ predictions: { ...s.predictions, [matchId]: score } })),
      getPrediction: (matchId) => get().predictions[matchId],
      clearAll: () => set({ predictions: {} }),
    }),
    { name: 'tbp-predictions' },
  ),
)
```

- [ ] **Step 2: Update app-store — remove predictions, use Match from domain types**

```ts
// src/store/app-store.ts
'use client'

import { create } from 'zustand'
import type { Match } from '@/types/domain'

interface Toast {
  message: string
  type?: 'success' | 'error' | 'info'
}

interface AppState {
  predictorMatch: Match | null
  toast: Toast | null
  openPredictor: (match: Match) => void
  closePredictor: () => void
  showToast: (toast: Toast) => void
  clearToast: () => void
}

export const useAppStore = create<AppState>((set) => ({
  predictorMatch: null,
  toast: null,
  openPredictor: (match) => set({ predictorMatch: match }),
  closePredictor: () => set({ predictorMatch: null }),
  showToast: (toast) => set({ toast }),
  clearToast: () => set({ toast: null }),
}))
```

- [ ] **Step 3: Update predictor-overlay — use Match type + predictionStore**

Replace the entire file:

```tsx
// src/components/domain/predictor-overlay.tsx
'use client'

import { useState } from 'react'
import { GameIcon } from '@/components/ui/game-icon'
import { TeamFlag } from '@/components/ui/team-flag'
import { useAppStore } from '@/store/app-store'
import { usePredictionStore } from '@/store/prediction-store'
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
} from '@/components/ui/responsive-dialog'
import type { Match } from '@/types/domain'

function PredictorInner({ match }: { match: Match }) {
  const { closePredictor, showToast } = useAppStore()
  const { savePrediction, getPrediction } = usePredictionStore()

  const localPred = getPrediction(match.id)
  const initialPred = localPred ?? match.userPrediction ?? undefined

  const [home, setHome] = useState(initialPred?.[0] ?? 1)
  const [away, setAway] = useState(initialPred?.[1] ?? 1)
  const [submitting, setSubmitting] = useState(false)

  const locked = match.state !== 'pending'

  if (locked) {
    const displayPred = localPred ?? match.userPrediction
    return (
      <div style={{ paddingBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 18px 4px' }}>
          <div className="t-eyebrow" style={{ color: 'var(--danger)' }}>BLOQUEADA · {match.stage}</div>
          <button className="icon-btn" onClick={closePredictor} style={{ width: 32, height: 32 }}>
            <GameIcon name="close" size={14} />
          </button>
        </div>
        <div style={{ padding: '20px 24px 8px', display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center', textAlign: 'center' }}>
          <div style={{ width: 72, height: 72, borderRadius: 24, background: 'rgba(255,61,113,0.12)', border: '1px solid rgba(255,61,113,0.3)', display: 'grid', placeItems: 'center' }}>
            <GameIcon name="lock" size={32} color="var(--danger)" />
          </div>
          <div className="t-h2" style={{ fontSize: 26 }}>Predicciones cerradas</div>
          <div className="t-body" style={{ maxWidth: 280 }}>
            {match.state === 'live'
              ? 'El partido está en curso. No podés agregar ni modificar tu predicción mientras el evento se juega.'
              : 'Este partido ya finalizó. Las predicciones se cerraron al kickoff.'}
          </div>
          <div className="card" style={{ marginTop: 8, width: '100%', padding: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
            <TeamFlag team={match.home} size="sm" />
            <div style={{ flex: 1 }}>
              <div className="t-meta">TU PRED</div>
              <div className="t-h3" style={{ fontSize: 16 }}>
                {displayPred ? `${displayPred[0]} · ${displayPred[1]}` : 'SIN PREDICCIÓN'}
              </div>
            </div>
            <TeamFlag team={match.away} size="sm" />
          </div>
        </div>
        <div style={{ padding: '16px 20px 0' }}>
          <button className="btn btn-ghost btn-block" onClick={closePredictor}>Entendido</button>
        </div>
      </div>
    )
  }

  const quickPicks = [
    { label: '1 · 0', h: 1, a: 0 }, { label: '2 · 1', h: 2, a: 1 },
    { label: '1 · 1', h: 1, a: 1 }, { label: '2 · 0', h: 2, a: 0 },
    { label: '0 · 1', h: 0, a: 1 }, { label: '0 · 0', h: 0, a: 0 },
    { label: '3 · 1', h: 3, a: 1 }, { label: '1 · 2', h: 1, a: 2 },
  ]

  let outcome = 'EMPATE'
  let outcomeColor = 'var(--fg-mute)'
  if (home > away) { outcome = `GANA ${match.home.code}`; outcomeColor = match.home.c1 }
  else if (away > home) { outcome = `GANA ${match.away.code}`; outcomeColor = match.away.c1 }

  const submit = () => {
    setSubmitting(true)
    setTimeout(() => {
      savePrediction(match.id, [home, away])
      showToast({ message: `✓ ${match.home.code} ${home}–${away} ${match.away.code} guardado`, type: 'success' })
      closePredictor()
    }, 350)
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 18px 4px' }}>
        <div className="t-eyebrow">PREDICCIÓN · {match.stage}</div>
        <button className="icon-btn" onClick={closePredictor} style={{ width: 32, height: 32 }}>
          <GameIcon name="close" size={14} />
        </button>
      </div>
      <div style={{ padding: '16px 20px 8px', display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 16, alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <TeamFlag team={match.home} size="lg" />
          <div className="t-h3" style={{ fontSize: 16, textAlign: 'center' }}>{match.home.name}</div>
          <div className="score-stepper">
            <div className="num" style={{ color: home > away ? 'var(--signal)' : 'var(--fg)' }}>{home}</div>
            <div className="stepper-controls">
              <button onClick={() => setHome(Math.max(0, home - 1))}>−</button>
              <button onClick={() => setHome(home + 1)}>+</button>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <div className="t-meta">VS</div>
          <div style={{ padding: '6px 10px', borderRadius: 8, background: outcomeColor === 'var(--fg-mute)' ? 'rgba(255,255,255,0.05)' : `${outcomeColor}26`, color: outcomeColor, fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700, whiteSpace: 'nowrap' }}>
            {outcome}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <TeamFlag team={match.away} size="lg" />
          <div className="t-h3" style={{ fontSize: 16, textAlign: 'center' }}>{match.away.name}</div>
          <div className="score-stepper">
            <div className="num" style={{ color: away > home ? 'var(--signal)' : 'var(--fg)' }}>{away}</div>
            <div className="stepper-controls">
              <button onClick={() => setAway(Math.max(0, away - 1))}>−</button>
              <button onClick={() => setAway(away + 1)}>+</button>
            </div>
          </div>
        </div>
      </div>
      <div style={{ padding: '16px 0 8px' }}>
        <div className="section-head" style={{ padding: '0 20px 8px' }}>
          <div className="num">QUICK PICK</div>
          <div className="title">RESULTADOS COMUNES</div>
        </div>
        <div className="quick-row">
          {quickPicks.map((q) => (
            <button key={q.label} className={`quick-chip ${q.h === home && q.a === away ? 'on' : ''}`} onClick={() => { setHome(q.h); setAway(q.a) }}>
              {q.label}
            </button>
          ))}
        </div>
      </div>
      <div style={{ padding: '8px 20px 4px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div className="card" style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <GameIcon name="info" size={16} color="var(--warn)" />
          <div className="t-meta" style={{ color: 'var(--fg-dim)', letterSpacing: '0.04em', textTransform: 'none', fontSize: 11 }}>
            <b style={{ color: 'var(--warn)' }}>+5 pts</b> exacto · <b style={{ color: 'var(--signal)' }}>+3</b> diferencia · <b>+1</b> ganador
          </div>
        </div>
      </div>
      <div style={{ padding: '12px 20px 24px' }}>
        <button className="btn btn-primary btn-block" onClick={submit} disabled={submitting} style={{ background: submitting ? 'var(--signal-dim)' : undefined }}>
          {submitting ? 'BLOQUEANDO…' : (<>BLOQUEAR PREDICCIÓN <span className="arrow">→</span></>)}
        </button>
      </div>
    </div>
  )
}

export function PredictorOverlay() {
  const { predictorMatch, closePredictor } = useAppStore()
  return (
    <ResponsiveDialog open={!!predictorMatch} onOpenChange={(open) => { if (!open) closePredictor() }}>
      <ResponsiveDialogContent showCloseButton={false}>
        {predictorMatch && <PredictorInner key={predictorMatch.id} match={predictorMatch} />}
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
```

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit`  
Expected: 0 errors in the 3 modified/created files.

- [ ] **Step 5: Commit**

```bash
git add src/store/prediction-store.ts src/store/app-store.ts src/components/domain/predictor-overlay.tsx
git commit -m "feat(store): add predictionStore with persist, clean app-store, update predictor-overlay"
```

---

## Task 8: Refactor Feed page

**Files:**
- Create: `src/app/(main)/feed/feed-screen.tsx`
- Modify: `src/app/(main)/feed/page.tsx`

- [ ] **Step 1: Create feed-screen.tsx**

```tsx
// src/app/(main)/feed/feed-screen.tsx
'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { Avi } from '@/components/ui/avi'
import { GameIcon } from '@/components/ui/game-icon'
import { TeamFlag } from '@/components/ui/team-flag'
import { useAppStore } from '@/store/app-store'
import { usePredictionStore } from '@/store/prediction-store'
import { getDayLabel, getDateNum, getKickoffTime, getKickoffIn, getMonthShort, getWeekday } from '@/lib/date-utils'
import type { Match } from '@/types/domain'

function FeedMatchCard({ match }: { match: Match }) {
  const { openPredictor } = useAppStore()
  const localPred = usePredictionStore(s => s.getPrediction(match.id))
  const { home, away, state, score } = match
  const live = state === 'live'
  const final = state === 'final'
  const pending = state === 'pending'
  const myPred = localPred ?? match.userPrediction ?? null

  const time = live ? `${match.liveMinute ?? 0}'` : pending ? getKickoffTime(match.kickoffAt) : 'FT'
  const kickoffIn = pending ? getKickoffIn(match.kickoffAt) : undefined

  const handleClick = () => { if (pending) openPredictor(match) }

  return (
    <div
      className={`match-card variant-tape ${state}`}
      onClick={handleClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClick() }}
      role={pending ? 'button' : undefined}
      tabIndex={pending ? 0 : undefined}
      style={{ cursor: pending ? 'pointer' : 'default' }}
    >
      <div className="match-stripes">
        <div className="match-stripe" style={{ background: home.c1 }} />
        <div className="match-stripe" style={{ background: away.c1 }} />
      </div>
      <div className="match-tape">
        <span>{match.stage} · {match.venue.split(',')[0]}</span>
        {live && <span className="live-pill"><span className="dot" />EN VIVO · {time}</span>}
        {final && <span style={{ color: 'var(--fg-mute)' }}>FT</span>}
        {pending && <span>{kickoffIn ?? time}</span>}
      </div>
      <div className="match-body">
        <div className="team-block">
          <TeamFlag team={home} />
          <div className="team-name" style={{ textAlign: 'center' }}>{home.name}</div>
          <div className="team-code">{home.code}</div>
        </div>
        <div className="center-vs">
          {(live || final) && score && (
            <div className="score-row">
              <span>{score[0]}</span><span className="sep">·</span><span>{score[1]}</span>
            </div>
          )}
          {pending && (
            <>
              <div className="kickoff-time">{time}</div>
              <div className="t-meta" style={{ fontSize: 9 }}>{getWeekday(match.kickoffAt)} {getDateNum(match.kickoffAt)}</div>
            </>
          )}
        </div>
        <div className="team-block right">
          <TeamFlag team={away} />
          <div className="team-name" style={{ textAlign: 'center' }}>{away.name}</div>
          <div className="team-code">{away.code}</div>
        </div>
      </div>
      <div className="match-foot">
        {pending && !myPred && <span className="pred-state"><GameIcon name="plus" size={12} /> SIN PREDICCIÓN</span>}
        {pending && myPred && <span className="pred-state set"><GameIcon name="check" size={12} /> TU: {myPred[0]}–{myPred[1]}</span>}
        {live && myPred && <span className="pred-state set">TU PRED · {myPred[0]}–{myPred[1]}</span>}
        {live && !myPred && <span className="pred-state miss">SIN PREDICCIÓN</span>}
        {final && myPred && (
          <span className={`pred-state ${(match.pts ?? 0) > 0 ? 'set' : 'miss'}`}>
            TU: {myPred[0]}–{myPred[1]} · {(match.pts ?? 0) > 0 ? 'ACIERTO' : 'FALLO'}
          </span>
        )}
        {final && (
          <span className="pts" title={match.streakBonus ? `Base +${match.basePts} · Racha +${match.streakBonus}` : ''}>
            {(match.pts ?? 0) > 0 ? `+${match.pts}` : '0'} PTS
            {(match.streakBonus ?? 0) > 0 && <span style={{ color: 'var(--warn)', marginLeft: 4 }}>·🔥+{match.streakBonus}</span>}
          </span>
        )}
        {pending && !match.locked && <span style={{ color: 'var(--signal)' }}>{myPred ? 'EDITAR ›' : 'PREDECIR ›'}</span>}
        {live && (
          <span style={{ color: 'var(--danger)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <GameIcon name="lock" size={11} /> BLOQUEADA
          </span>
        )}
      </div>
    </div>
  )
}

interface FeedScreenProps {
  matches: Match[]
  me: { rank: number; pts: number; streak: number }
}

export function FeedScreen({ matches, me }: FeedScreenProps) {
  const { openPredictor } = useAppStore()

  const groups = useMemo(() => {
    const byDay: Record<string, { kickoffAt: string; items: Match[] }> = {}
    for (const m of matches) {
      const label = getDayLabel(m.kickoffAt)
      if (!byDay[label]) byDay[label] = { kickoffAt: m.kickoffAt, items: [] }
      byDay[label].items.push(m)
    }
    return byDay
  }, [matches])

  const order = Object.keys(groups).sort((a, b) => {
    const priority = ['HOY', 'MAÑANA', 'AYER']
    const ai = priority.indexOf(a); const bi = priority.indexOf(b)
    if (ai !== -1 && bi !== -1) return ai - bi
    if (ai !== -1) return -1; if (bi !== -1) return 1
    return 0
  })

  const nextNoPred = matches.find(m => m.state === 'pending' && !m.userPrediction)

  return (
    <div className="screen screen-anim">
      <div className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avi name="Tú" color="#08F7FE" size={32} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <div className="topbar-meta">LIGA · AMIGOS DEL BAR</div>
          <div className="topbar-title">THE BIG POLLA</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button className="icon-btn" style={{ position: 'relative' }}>
            <GameIcon name="bell" size={18} />
            <span style={{ position: 'absolute', width: 8, height: 8, background: 'var(--danger)', borderRadius: 4, top: 6, right: 6, boxShadow: '0 0 0 2px var(--bg)' }} />
          </button>
        </div>
      </div>

      <div className="league-bar">
        <span className="name">RANKING #{me.rank}</span>
        <span className="sep">·</span>
        <span>{me.pts} PTS</span>
        <span className="sep">·</span>
        <span style={{ color: 'var(--signal)' }}>+3 ESTA SEMANA</span>
      </div>

      <div className="scroll">
        <div className="px-5 pt-3 lg:max-w-xl">
          <div className="kpi">
            <div>
              <span className="label">JORNADA</span>
              <span className="value">04<span className="small">/12</span></span>
            </div>
            <div>
              <span className="label">PARTIDOS HOY</span>
              <span className="value">{String(groups['HOY']?.items.length ?? 0).padStart(2, '0')}</span>
            </div>
            <div>
              <span className="label">RACHA</span>
              <span className="value" style={{ color: 'var(--warn)' }}>{me.streak}<span className="small">×</span></span>
            </div>
          </div>
        </div>

        {nextNoPred && (
          <div className="px-5 pt-4 lg:max-w-xl">
            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 14, borderColor: 'rgba(255, 214, 10, 0.4)', background: 'linear-gradient(90deg, rgba(255, 214, 10, 0.08), transparent)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
                <div className="t-eyebrow" style={{ color: 'var(--warn)' }}>
                  ALERTA · {getKickoffIn(nextNoPred.kickoffAt) ?? 'HOY'}
                </div>
                <div className="t-h3" style={{ fontSize: 16 }}>
                  Te falta predecir {nextNoPred.home.code} vs {nextNoPred.away.code}
                </div>
              </div>
              <button className="btn btn-warn" style={{ padding: '10px 14px', fontSize: 12 }} onClick={() => openPredictor(nextNoPred)}>
                IR →
              </button>
            </div>
          </div>
        )}

        {order.map((day) => {
          const g = groups[day]
          if (!g) return null
          return (
            <div key={day}>
              <div className="day-divider">
                <div className="num">{getDateNum(g.kickoffAt)}</div>
                <div className="stack">
                  <span className="label">{getWeekday(g.kickoffAt)} · {getMonthShort(g.kickoffAt)}</span>
                  <span className="meta">{day}</span>
                </div>
                <div className="rule" />
                <div className="t-meta">{g.items.length} PARTIDOS</div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-[10px] px-5 pb-1">
                {g.items.map((m) =>
                  m.state !== 'pending' ? (
                    <Link key={m.id} href={`/feed/${m.id}`} style={{ textDecoration: 'none' }}>
                      <FeedMatchCard match={m} />
                    </Link>
                  ) : (
                    <FeedMatchCard key={m.id} match={m} />
                  )
                )}
              </div>
            </div>
          )
        })}
        <div style={{ height: 90 }} />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Replace feed/page.tsx with a Server Component**

```tsx
// src/app/(main)/feed/page.tsx
import { getLeagueRepository, getMatchRepository } from '@/repositories'
import { FeedScreen } from './feed-screen'

export default async function FeedPage() {
  const [matches, members] = await Promise.all([
    getMatchRepository().getMatches(),
    getLeagueRepository().getMembers('default'),
  ])

  const me = members.find(m => m.me) ?? { rank: 0, pts: 0, streak: 0 }

  return <FeedScreen matches={matches} me={{ rank: me.rank, pts: me.pts, streak: me.streak }} />
}
```

- [ ] **Step 3: Verify type check**

Run: `npx tsc --noEmit`  
Expected: 0 errors in these two files.

- [ ] **Step 4: Start dev server and manually verify feed page**

Run: `npm run dev`  
Open `http://localhost:3000/feed` — verify:
- Match cards render with teams/flags
- HOY/MAÑANA/AYER grouping shows
- Live matches show "EN VIVO · 78'"
- Pending matches show kickoff time
- Final matches show score + pts
- Clicking a pending card opens the predictor overlay
- Saving a prediction shows "TU: X–Y" on the card
- Refreshing the page keeps the saved prediction (localStorage)

- [ ] **Step 5: Commit**

```bash
git add "src/app/(main)/feed/feed-screen.tsx" "src/app/(main)/feed/page.tsx"
git commit -m "feat(feed): refactor to server component + client feed-screen"
```

---

## Task 9: Refactor Feed detail page

**Files:**
- Create: `src/app/(main)/feed/[id]/match-detail-screen.tsx`
- Modify: `src/app/(main)/feed/[id]/page.tsx`

- [ ] **Step 1: Create match-detail-screen.tsx**

```tsx
// src/app/(main)/feed/[id]/match-detail-screen.tsx
'use client'

import Link from 'next/link'
import { GameIcon } from '@/components/ui/game-icon'
import { GamePill } from '@/components/ui/game-pill'
import { TeamFlag } from '@/components/ui/team-flag'
import { useAppStore } from '@/store/app-store'
import { usePredictionStore } from '@/store/prediction-store'
import { getKickoffTime } from '@/lib/date-utils'
import type { Match } from '@/types/domain'

export function MatchDetailScreen({ match }: { match: Match }) {
  const { openPredictor } = useAppStore()
  const localPred = usePredictionStore(s => s.getPrediction(match.id))
  const { home, away, state, score } = match
  const myPred = localPred ?? match.userPrediction ?? null

  const time = state === 'live' ? `${match.liveMinute ?? 0}'` : state === 'pending' ? getKickoffTime(match.kickoffAt) : 'FINAL'

  return (
    <div className="screen screen-anim">
      <div className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link href="/feed" className="icon-btn"><GameIcon name="back" /></Link>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <div className="topbar-meta">{match.stage.toUpperCase()}</div>
          <div className="topbar-title">MATCH</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button className="icon-btn"><GameIcon name="share" size={16} /></button>
        </div>
      </div>

      <div className="scroll">
        <div className="detail-hero" style={{ '--c1': `${home.c1}33`, '--c2': `${away.c1}33` } as React.CSSProperties}>
          <div className="detail-meta-row">
            <span>{match.venue}</span>
            {state === 'live' && <span style={{ color: 'var(--signal)' }}>● {time}</span>}
            {state === 'final' && <span>FINAL</span>}
            {state === 'pending' && <span>{time}</span>}
          </div>
          <div className="detail-versus">
            <div className="detail-team">
              <TeamFlag team={home} size="lg" />
              <div className="name">{home.name}</div>
              <div className="t-meta">{home.code}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              {(state === 'live' || state === 'final') && score && (
                <div style={{ fontFamily: 'var(--display)', fontWeight: 900, fontSize: 64, letterSpacing: '-0.06em', lineHeight: 1 }}>
                  {score[0]}<span style={{ color: 'var(--fg-faint)' }}>·</span>{score[1]}
                </div>
              )}
              {state === 'pending' && <div className="detail-vs">VS</div>}
              {state === 'live' && <GamePill tone="signal" dot>EN VIVO</GamePill>}
            </div>
            <div className="detail-team">
              <TeamFlag team={away} size="lg" />
              <div className="name">{away.name}</div>
              <div className="t-meta">{away.code}</div>
            </div>
          </div>
          <div className="detail-meta-row">
            <span>TU PRED · {myPred ? `${myPred[0]}–${myPred[1]}` : '—'}</span>
            <span>VS · LIGA · 8 PRED</span>
          </div>
        </div>

        {match.timeline && (
          <div>
            <div className="section-head">
              <div className="num">EVENTOS</div>
              <div className="title">CRONOLOGÍA</div>
            </div>
            <div className="live-timeline">
              {[...match.timeline].reverse().map((e, i) => (
                <div className="live-event" key={i}>
                  <div className="min">{e.min}&apos;</div>
                  <div className="text">
                    <div className="head">{e.head}</div>
                    <div className="body">{e.body}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="section-head">
          <div className="num">LIGA · 8 PRED</div>
          <div className="title">¿QUÉ DICE LA TRIBUNA?</div>
        </div>
        <div style={{ padding: '0 20px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { who: `Gana ${home.name}`, pct: 62, color: home.c1 },
            { who: 'Empate', pct: 25, color: 'var(--fg-mute)' },
            { who: `Gana ${away.name}`, pct: 13, color: away.c1 },
          ].map((row) => (
            <div key={row.who}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--fg-dim)' }}>{row.who}</span>
                <span className="t-num" style={{ fontSize: 13 }}>{row.pct}%</span>
              </div>
              <div style={{ height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: `${row.pct}%`, height: '100%', background: row.color }} />
              </div>
            </div>
          ))}
        </div>

        {state === 'pending' && (
          <div style={{ padding: '0 20px 24px' }}>
            <button className="btn btn-primary btn-block" onClick={() => openPredictor(match)}>
              {myPred ? 'EDITAR PREDICCIÓN' : 'HACER PREDICCIÓN'} <span className="arrow">→</span>
            </button>
          </div>
        )}
        <div style={{ height: 90 }} />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Replace feed/[id]/page.tsx with a Server Component**

```tsx
// src/app/(main)/feed/[id]/page.tsx
import { notFound } from 'next/navigation'
import { getMatchRepository } from '@/repositories'
import { MatchDetailScreen } from './match-detail-screen'

export default async function MatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const match = await getMatchRepository().getMatch(id)
  if (!match) notFound()
  return <MatchDetailScreen match={match} />
}
```

- [ ] **Step 3: Verify + manual test**

Run: `npx tsc --noEmit`  
Open `http://localhost:3000/feed/m1` — live match detail renders with timeline.  
Open `http://localhost:3000/feed/m3` — pending match shows "HACER PREDICCIÓN" button.

- [ ] **Step 4: Commit**

```bash
git add "src/app/(main)/feed/[id]/match-detail-screen.tsx" "src/app/(main)/feed/[id]/page.tsx"
git commit -m "feat(feed): refactor match detail to server component"
```

---

## Task 10: Refactor Leaderboard page

**Files:**
- Create: `src/app/(main)/leaderboard/leaderboard-screen.tsx`
- Modify: `src/app/(main)/leaderboard/page.tsx`

- [ ] **Step 1: Create leaderboard-screen.tsx**

```tsx
// src/app/(main)/leaderboard/leaderboard-screen.tsx
'use client'

import { useState } from 'react'
import { Avi } from '@/components/ui/avi'
import { GameIcon } from '@/components/ui/game-icon'
import { ResponsiveDialog, ResponsiveDialogContent } from '@/components/ui/responsive-dialog'
import type { Member, ScoringRules } from '@/types/domain'

function PointsBreakdownContent({ member, rules, onClose }: { member: Member; rules: ScoringRules; onClose: () => void }) {
  const b = member.breakdown
  const lines = [
    { k: 'exact', label: 'Resultado exacto', count: b.exact, unit: rules.exact, color: 'var(--warn)', icon: '★' },
    { k: 'diff', label: 'Diferencia de gol', count: b.diff, unit: rules.diff, color: 'var(--signal)', icon: 'Δ' },
    { k: 'winner', label: 'Solo ganador / empate', count: b.winner, unit: rules.winner, color: 'var(--fg)', icon: '✓' },
  ]
  const subtotalBase = lines.reduce((s, l) => s + l.count * l.unit, 0)
  const total = subtotalBase + b.streakBonus + b.comboBonus + b.oraclePartial

  return (
    <div className="scroll" style={{ overflowY: 'auto', maxHeight: '80dvh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 18px 4px' }}>
        <div className="t-eyebrow">DESGLOSE · TRANSPARENCIA</div>
        <button className="icon-btn" onClick={onClose} style={{ width: 32, height: 32 }}><GameIcon name="close" size={14} /></button>
      </div>
      <div style={{ padding: '10px 20px 6px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <Avi name={member.name} color={member.color} size={48} />
        <div style={{ flex: 1 }}>
          <div className="t-h2" style={{ fontSize: 22 }}>{member.name}</div>
          <div className="t-meta">RANK #{member.rank} · {member.handle}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="t-num" style={{ fontSize: 32, color: 'var(--fg)' }}>{member.pts}</div>
          <div className="t-meta" style={{ fontSize: 9 }}>PUNTOS TOTALES</div>
        </div>
      </div>
      <div className="scroll" style={{ padding: '8px 20px 8px', maxHeight: 440 }}>
        <div className="section-head" style={{ padding: '10px 0 8px' }}>
          <div className="num">A · ACIERTOS</div><div className="title">PUNTOS BASE</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {lines.map((l) => (
            <div key={l.k} style={{ display: 'grid', gridTemplateColumns: '28px 1fr auto auto', gap: 10, alignItems: 'center', padding: '10px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--line)', borderRadius: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, display: 'grid', placeItems: 'center', background: l.color === 'var(--warn)' ? 'rgba(255,214,10,0.15)' : l.color === 'var(--signal)' ? 'rgba(0,210,106,0.15)' : 'rgba(255,255,255,0.06)', color: l.color, fontFamily: 'var(--display)', fontWeight: 900, fontSize: 14 }}>{l.icon}</div>
              <div>
                <div className="t-h3" style={{ fontSize: 13 }}>{l.label}</div>
                <div className="t-meta" style={{ textTransform: 'none', letterSpacing: '0.02em', fontSize: 10 }}>{l.count} × +{l.unit} pts</div>
              </div>
              <div className="t-num" style={{ fontSize: 13, color: 'var(--fg-mute)' }}>×{l.count}</div>
              <div className="t-num" style={{ fontSize: 16, color: l.color, minWidth: 44, textAlign: 'right' }}>+{l.count * l.unit}</div>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '6px 12px', borderTop: '1px dashed var(--line)', marginTop: 4 }}>
            <span className="t-meta">SUBTOTAL BASE</span>
            <span className="t-num" style={{ fontSize: 16 }}>+{subtotalBase}</span>
          </div>
        </div>
        <div className="section-head" style={{ padding: '16px 0 8px' }}>
          <div className="num">B · BONIFICACIONES</div><div className="title">EXTRAS</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '28px 1fr auto', gap: 10, alignItems: 'center', padding: '12px', borderRadius: 10, background: 'linear-gradient(90deg, rgba(255,214,10,0.10), rgba(255,214,10,0.02))', border: '1px solid rgba(255,214,10,0.3)' }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, display: 'grid', placeItems: 'center', background: 'rgba(255,214,10,0.2)', color: 'var(--warn)' }}><GameIcon name="fire" size={14} color="var(--warn)" /></div>
            <div>
              <div className="t-h3" style={{ fontSize: 13 }}>Bonus por racha</div>
              <div className="t-meta" style={{ textTransform: 'none', letterSpacing: '0.02em', fontSize: 10 }}>+{rules.streakStep} pt × nivel de racha (máx +{rules.streakMax} / partido) · racha actual {member.streak}×</div>
            </div>
            <div className="t-num" style={{ fontSize: 18, color: 'var(--warn)' }}>+{b.streakBonus}</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '28px 1fr auto', gap: 10, alignItems: 'center', padding: '12px', borderRadius: 10, background: 'rgba(0,210,106,0.06)', border: '1px solid rgba(0,210,106,0.25)' }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, display: 'grid', placeItems: 'center', background: 'rgba(0,210,106,0.18)', color: 'var(--signal)', fontFamily: 'var(--display)', fontWeight: 900 }}>5</div>
            <div>
              <div className="t-h3" style={{ fontSize: 13 }}>Pleno de jornada (5/5)</div>
              <div className="t-meta" style={{ textTransform: 'none', letterSpacing: '0.02em', fontSize: 10 }}>+{rules.combo} pts por jornada perfecta · {Math.round(b.comboBonus / rules.combo)} jornada(s)</div>
            </div>
            <div className="t-num" style={{ fontSize: 18, color: 'var(--signal)' }}>+{b.comboBonus}</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '28px 1fr auto', gap: 10, alignItems: 'center', padding: '12px', borderRadius: 10, background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.25)' }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, display: 'grid', placeItems: 'center', background: 'rgba(124,58,237,0.2)', color: '#A78BFA', fontFamily: 'var(--display)', fontWeight: 900 }}>★</div>
            <div>
              <div className="t-h3" style={{ fontSize: 13 }}>Oracle (bracket)</div>
              <div className="t-meta" style={{ textTransform: 'none', letterSpacing: '0.02em', fontSize: 10 }}>Picks acertados en rondas eliminatorias hasta ahora</div>
            </div>
            <div className="t-num" style={{ fontSize: 18, color: '#A78BFA' }}>+{b.oraclePartial}</div>
          </div>
        </div>
        <div style={{ marginTop: 16, padding: '14px', background: 'var(--surface-2)', border: '1px solid var(--line-2)', borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="t-eyebrow">TOTAL</div>
            <div className="t-meta" style={{ textTransform: 'none', letterSpacing: '0.02em' }}>{subtotalBase} base + {b.streakBonus + b.comboBonus + b.oraclePartial} bonus</div>
          </div>
          <div className="t-num" style={{ fontSize: 36, color: 'var(--fg)' }}>{total}</div>
        </div>
      </div>
    </div>
  )
}

interface LeaderboardScreenProps {
  members: Member[]
  scoringRules: ScoringRules
}

export function LeaderboardScreen({ members, scoringRules }: LeaderboardScreenProps) {
  const [tab, setTab] = useState('global')
  const [breakdownFor, setBreakdownFor] = useState<Member | null>(null)

  return (
    <div className="screen screen-anim">
      <div className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button className="icon-btn"><GameIcon name="filter" size={16} /></button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <div className="topbar-meta">LIGA · AMIGOS DEL BAR</div>
          <div className="topbar-title">LEADERBOARD</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button className="icon-btn"><GameIcon name="fire" size={16} color="var(--warn)" /></button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row lg:flex-1 lg:overflow-hidden">
        <div className="lg:w-[380px] lg:shrink-0 lg:overflow-y-auto lg:border-r lg:border-[var(--line)]">
          <div style={{ display: 'flex', gap: 6, padding: '8px 20px 12px' }}>
            {[{ id: 'global', label: 'Global' }, { id: 'week', label: 'Semanal' }, { id: 'j4', label: 'Jornada 4' }].map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, padding: '10px 12px', borderRadius: 10, border: '1px solid var(--line)', background: tab === t.id ? 'var(--fg)' : 'rgba(255,255,255,0.03)', color: tab === t.id ? '#04130A' : 'var(--fg-dim)', fontFamily: 'var(--display)', fontWeight: 800, fontSize: 12, letterSpacing: '0.04em', textTransform: 'uppercase', cursor: 'pointer' }}>
                {t.label}
              </button>
            ))}
          </div>
          <div style={{ padding: '0 20px 16px', display: 'grid', gridTemplateColumns: '1fr 1.2fr 1fr', gap: 8, alignItems: 'end' }}>
            {[1, 0, 2].map((idx) => {
              const m = members[idx]; if (!m) return null
              const heights = [110, 86, 72]; const place = m.rank
              return (
                <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <Avi name={m.name} color={m.color} size={place === 1 ? 56 : 44} />
                  <div className="t-h3" style={{ fontSize: place === 1 ? 14 : 12, textAlign: 'center' }}>{m.name.split(' ')[0]}</div>
                  <div className="t-num" style={{ fontSize: place === 1 ? 24 : 18, color: place === 1 ? 'var(--warn)' : 'var(--fg)' }}>{m.pts}</div>
                  <div style={{ height: heights[idx], width: '100%', background: place === 1 ? 'linear-gradient(180deg, var(--warn), transparent 130%)' : place === 2 ? 'linear-gradient(180deg, #C7CACE, transparent 130%)' : 'linear-gradient(180deg, #D08350, transparent 130%)', borderRadius: '10px 10px 0 0', position: 'relative', opacity: 0.92 }}>
                    <div style={{ position: 'absolute', top: 8, left: 0, right: 0, textAlign: 'center', fontFamily: 'var(--display)', fontWeight: 900, fontSize: place === 1 ? 28 : 22, color: 'rgba(0,0,0,0.55)' }}>{place}°</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="flex-1 scroll">
          <div className="section-head">
            <div className="num">RANKING · {members.length}</div>
            <div className="title">CLASIFICACIÓN</div>
          </div>
          {members.map((m) => {
            const delta = m.prevRank - m.rank
            const deltaCls = delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat'
            return (
              <div key={m.id} onClick={() => setBreakdownFor(m)} className={`lb-row ${m.me ? 'me' : ''} ${m.rank === 1 ? 'top-1' : m.rank === 2 ? 'top-2' : m.rank === 3 ? 'top-3' : ''}`} style={{ cursor: 'pointer' }}>
                <div className="rank">{m.rank}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                  <Avi name={m.name} color={m.color} size={36} />
                  <div className="who">
                    <div className="name">{m.name}{m.me && <span style={{ color: 'var(--signal)', marginLeft: 6, fontSize: 10, letterSpacing: '0.1em' }}>YOU</span>}</div>
                    <div className="sub">
                      <span>{m.handle}</span><span>{m.hits} HITS</span>
                      {m.streak > 0 && <span style={{ color: 'var(--warn)' }}>{m.streak}× RACHA</span>}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                  <div className="pts">{m.pts}<span className={`delta ${deltaCls}`}>{delta > 0 ? `▲${delta}` : delta < 0 ? `▼${Math.abs(delta)}` : '—'}</span></div>
                  <div className="t-meta" style={{ fontSize: 9, color: 'var(--signal)', display: 'inline-flex', alignItems: 'center', gap: 3 }}>VER DESGLOSE <GameIcon name="chevron-right" size={10} /></div>
                </div>
              </div>
            )
          })}
          <div style={{ height: 90 }} />
        </div>
      </div>

      <ResponsiveDialog open={!!breakdownFor} onOpenChange={(open) => { if (!open) setBreakdownFor(null) }}>
        <ResponsiveDialogContent showCloseButton={false}>
          {breakdownFor && <PointsBreakdownContent member={breakdownFor} rules={scoringRules} onClose={() => setBreakdownFor(null)} />}
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </div>
  )
}
```

- [ ] **Step 2: Replace leaderboard/page.tsx with a Server Component**

```tsx
// src/app/(main)/leaderboard/page.tsx
import { getLeagueRepository } from '@/repositories'
import { LeaderboardScreen } from './leaderboard-screen'

export default async function LeaderboardPage() {
  const [members, scoringRules] = await Promise.all([
    getLeagueRepository().getLeaderboard('default'),
    getLeagueRepository().getScoringRules('default'),
  ])

  return <LeaderboardScreen members={members} scoringRules={scoringRules} />
}
```

- [ ] **Step 3: Verify + manual test**

Run: `npx tsc --noEmit`  
Open `http://localhost:3000/leaderboard` — verify:
- Podium renders with top 3 members
- Full ranking list shows all members
- Clicking any row opens the score breakdown modal with correct numbers

- [ ] **Step 4: Commit**

```bash
git add "src/app/(main)/leaderboard/leaderboard-screen.tsx" "src/app/(main)/leaderboard/page.tsx"
git commit -m "feat(leaderboard): refactor to server component + client leaderboard-screen"
```

---

## Task 11: Refactor Profile page

**Files:**
- Create: `src/app/(main)/profile/profile-screen.tsx`
- Modify: `src/app/(main)/profile/page.tsx`

- [ ] **Step 1: Create profile-screen.tsx**

```tsx
// src/app/(main)/profile/profile-screen.tsx
'use client'

import Link from 'next/link'
import { Avi } from '@/components/ui/avi'
import { GameIcon } from '@/components/ui/game-icon'
import { GamePill } from '@/components/ui/game-pill'
import { TeamFlag } from '@/components/ui/team-flag'
import { usePredictionStore } from '@/store/prediction-store'
import type { Badge, Match, Member } from '@/types/domain'

type ResultKind = 'exact' | 'diff' | 'winner' | 'miss'

function classifyResult(m: Match): ResultKind | null {
  if (m.state !== 'final') return null
  if (m.correctScore) return 'exact'
  if (m.correctOutcome) return m.basePts === 3 ? 'diff' : 'winner'
  return 'miss'
}

const RESULT_CONFIG: Record<ResultKind, { label: string; color: string; bg: string }> = {
  exact: { label: 'EXACTO', color: 'var(--warn)', bg: 'rgba(255,214,10,0.15)' },
  diff: { label: 'DIFERENCIA', color: 'var(--signal)', bg: 'rgba(0,210,106,0.12)' },
  winner: { label: 'GANADOR', color: 'var(--fg-dim)', bg: 'rgba(255,255,255,0.06)' },
  miss: { label: 'MISS', color: 'var(--fg-faint)', bg: 'rgba(255,255,255,0.03)' },
}

function PerformanceBar({ breakdown }: { breakdown: Member['breakdown'] }) {
  const { exact, diff, winner } = breakdown
  const miss = Math.max(0, 27 - exact - diff - winner)
  const total = exact + diff + winner + miss
  const segments = [
    { key: 'exact', count: exact, barColor: '#FFD60A', textColor: 'var(--warn)', label: 'EXACTO' },
    { key: 'diff', count: diff, barColor: '#00D26A', textColor: 'var(--signal)', label: 'DIFERENCIA' },
    { key: 'winner', count: winner, barColor: '#8B97AD', textColor: 'var(--fg-dim)', label: 'GANADOR' },
    { key: 'miss', count: miss, barColor: '#2A3248', textColor: 'var(--fg-faint)', label: 'MISS' },
  ] as const
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', height: 10, borderRadius: 6, overflow: 'hidden', gap: 2, background: 'var(--surface-2)' }}>
        {segments.map((s) => (
          <div key={s.key} style={{ flex: s.count / total, background: s.barColor, minWidth: s.count > 0 ? 4 : 0, opacity: s.key === 'miss' ? 0.35 : 0.9, transition: 'flex 0.4s ease' }} />
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
        {segments.map((s) => (
          <div key={s.key} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span className="t-num" style={{ fontSize: 20, color: s.textColor, lineHeight: 1, letterSpacing: '-0.03em' }}>{s.count}</span>
            <span className="t-meta" style={{ fontSize: 8, letterSpacing: '0.1em' }}>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

interface ProfileScreenProps {
  me: Member
  members: Member[]
  finishedMatches: Match[]
  badges: Badge[]
}

export function ProfileScreen({ me, members, finishedMatches, badges }: ProfileScreenProps) {
  const getPrediction = usePredictionStore(s => s.getPrediction)
  const myIdx = members.findIndex(m => m.me)
  const sliceStart = Math.max(0, myIdx - 2)
  const miniRanking = members.slice(sliceStart, Math.min(members.length, myIdx + 3))
  const hitRate = me.hits > 0 ? Math.round((me.hits / 27) * 100) : 0

  return (
    <div className="screen screen-anim">
      <div className="topbar">
        <div style={{ width: 36 }} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <div className="topbar-meta">{me.handle.toUpperCase()}</div>
          <div className="topbar-title">MI PERFIL</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Link href="/settings" className="icon-btn"><GameIcon name="settings" size={16} /></Link>
        </div>
      </div>

      <div className="scroll">
        <div className="profile-hero">
          <div className="profile-row">
            <Avi name={me.name} color={me.color} size={64} />
            <div style={{ flex: 1 }}>
              <div className="t-h2" style={{ fontSize: 26 }}>{me.name}</div>
              <div className="t-meta">RANK #{me.rank} · {me.pts} PTS</div>
            </div>
            <GamePill tone="signal" dot>+5 SEM</GamePill>
          </div>
          <div className="kpi">
            <div><span className="label">ACIERTOS</span><span className="value">{me.hits}<span className="small">/27</span></span></div>
            <div><span className="label">RACHA</span><span className="value" style={{ color: 'var(--warn)' }}>{me.streak}<span className="small">×</span></span></div>
            <div><span className="label">% HIT</span><span className="value">{hitRate}<span className="small">%</span></span></div>
          </div>
        </div>

        <div style={{ padding: '20px var(--gutter) 0' }}>
          <div className="section-head" style={{ padding: '0 0 12px' }}>
            <div className="num">27 PARTIDOS</div><div className="title">RENDIMIENTO</div>
          </div>
          <PerformanceBar breakdown={me.breakdown} />
        </div>

        <div className="section-head">
          <div className="num">{badges.length} LOGROS</div><div className="title">INSIGNIAS</div>
        </div>
        <div className="badge-grid">
          {badges.map((b) => (
            <div key={b.id} className={`badge ${b.unlocked ? '' : 'locked'}`}>
              <div className="num">{b.num}</div><div className="label">{b.label}</div>
            </div>
          ))}
        </div>

        <div className="section-head">
          <div className="num">POSICIÓN #{me.rank} DE {members.length}</div>
          <div className="title">CLASIFICACIÓN</div>
        </div>
        <div style={{ border: '1px solid var(--line)', borderRadius: 'var(--card-radius)', overflow: 'hidden', margin: '0 var(--gutter) 20px' }}>
          {miniRanking.map((m: Member) => {
            const delta = m.prevRank - m.rank
            const deltaCls = delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat'
            const deltaStr = delta > 0 ? `▲${delta}` : delta < 0 ? `▼${Math.abs(delta)}` : '—'
            return (
              <div key={m.id} className={['lb-row', m.me ? 'me' : '', m.rank === 1 ? 'top-1' : m.rank === 2 ? 'top-2' : m.rank === 3 ? 'top-3' : ''].filter(Boolean).join(' ')}>
                <div className="rank">{m.rank}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  <Avi name={m.name} color={m.color} size={32} />
                  <div className="who">
                    <div className="name" style={{ fontSize: 14 }}>{m.name}{m.me && <span style={{ color: 'var(--signal)', marginLeft: 6, fontSize: 9, letterSpacing: '0.1em' }}>TÚ</span>}</div>
                    <div className="sub"><span>{m.hits} HITS</span>{m.streak > 0 && <span style={{ color: 'var(--warn)' }}>{m.streak}× RACHA</span>}</div>
                  </div>
                </div>
                <div className="pts" style={{ fontSize: 18 }}>{m.pts}<span className={`delta ${deltaCls}`}>{deltaStr}</span></div>
              </div>
            )
          })}
        </div>

        <div style={{ padding: '20px var(--gutter) 0' }}>
          <div className="section-head" style={{ padding: 0 }}>
            <div className="num">HISTÓRICO</div><div className="title">ÚLTIMAS PREDICCIONES</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
            {finishedMatches.map((m) => {
              const localPred = getPrediction(m.id)
              const displayPred = localPred ?? m.userPrediction
              const kind = classifyResult(m)
              const cfg = kind ? RESULT_CONFIG[kind] : null
              return (
                <div key={m.id} className="card" style={{ padding: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <TeamFlag team={m.home} size="xs" />
                    <TeamFlag team={m.away} size="xs" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="t-h3" style={{ fontSize: 13 }}>{m.home.code} {m.score?.[0]}–{m.score?.[1]} {m.away.code}</div>
                    <div className="t-meta">TU: {displayPred ? `${displayPred[0]}–${displayPred[1]}` : '—'} · {m.stage}</div>
                  </div>
                  {cfg && <span style={{ padding: '3px 8px', borderRadius: 6, background: cfg.bg, color: cfg.color, fontFamily: 'var(--font-jetbrains, monospace)', fontSize: 9, letterSpacing: '0.12em', fontWeight: 700, whiteSpace: 'nowrap' }}>{cfg.label}</span>}
                  <div style={{ fontFamily: 'var(--font-inter, sans-serif)', fontWeight: 900, fontSize: 18, color: (m.pts ?? 0) > 3 ? 'var(--signal)' : (m.pts ?? 0) > 0 ? 'var(--warn)' : 'var(--fg-faint)', minWidth: 28, textAlign: 'right' }}>
                    {(m.pts ?? 0) > 0 ? `+${m.pts}` : '0'}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        <div style={{ height: 96 }} />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Replace profile/page.tsx with a Server Component**

```tsx
// src/app/(main)/profile/page.tsx
import { getLeagueRepository, getMatchRepository } from '@/repositories'
import { ProfileScreen } from './profile-screen'

export default async function ProfilePage() {
  const [matches, members, badges] = await Promise.all([
    getMatchRepository().getMatches({ state: 'final' }),
    getLeagueRepository().getMembers('default'),
    getLeagueRepository().getBadges('me'),
  ])

  const me = members.find(m => m.me)
  if (!me) throw new Error('Current user not found in members')

  return <ProfileScreen me={me} members={members} finishedMatches={matches} badges={badges} />
}
```

- [ ] **Step 3: Verify + manual test**

Run: `npx tsc --noEmit`  
Open `http://localhost:3000/profile` — verify:
- Hero section shows correct user data (Tú, rank 4)
- Performance bar segments render and add up
- Badge grid shows locked/unlocked state
- Mini-leaderboard shows 5 rows with current user highlighted
- Prediction history lists finished matches with EXACTO/DIFERENCIA/GANADOR/MISS chips

- [ ] **Step 4: Commit**

```bash
git add "src/app/(main)/profile/profile-screen.tsx" "src/app/(main)/profile/page.tsx"
git commit -m "feat(profile): refactor to server component + client profile-screen"
```

---

## Task 12: Delete legacy files and fix remaining imports

**Files:**
- Delete: `src/lib/tournament-data.ts`
- Delete: `src/lib/mock-data.ts`

- [ ] **Step 1: Run type check to find remaining imports**

Run: `npx tsc --noEmit`  
Any file still importing from `tournament-data.ts` or `mock-data.ts` will appear as a TS error.  
Expected: only `src/app/(main)/oracle/page.tsx` may have errors (out of scope — leave it for now).

- [ ] **Step 2: If oracle/page.tsx imports tournament-data, add a TODO**

Open `src/app/(main)/oracle/page.tsx`. If it imports from `@/lib/tournament-data`, add this comment at the top:

```tsx
// TODO: migrate to IMatchRepository — deferred, out of scope for data-layer plan
```

Do NOT change any logic. TypeScript errors inside oracle will be acceptable.

- [ ] **Step 3: Delete the legacy files**

```bash
rm src/lib/tournament-data.ts
rm src/lib/mock-data.ts
```

- [ ] **Step 4: Final type check**

Run: `npx tsc --noEmit`  
Expected: 0 errors (oracle errors with the TODO are acceptable if it's excluded from the build).

- [ ] **Step 5: Smoke test all routes**

Run: `npm run dev`  
Test each route:
- `/feed` — renders, cards show, predictor works, prediction persists on refresh
- `/feed/m1` — live match detail with timeline
- `/feed/m3` — pending match with predict button, opens predictor overlay
- `/leaderboard` — podium + full ranking + breakdown modal opens correctly
- `/profile` — hero + performance bar + badges + prediction history

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "chore: delete tournament-data.ts and mock-data.ts, complete data layer migration"
```

---

## Post-completion checklist

- [ ] `NEXT_PUBLIC_DATA_SOURCE` is not set in `.env.local` (defaults to `mock` — correct)
- [ ] Prediction store key in localStorage is `tbp-predictions` (verify in DevTools → Application → Local Storage)
- [ ] All `page.tsx` files are Server Components (no `'use client'` at the top)
- [ ] All `*-screen.tsx` files have `'use client'` at the top
- [ ] `tournament-data.ts` and `mock-data.ts` are deleted
- [ ] Setting `NEXT_PUBLIC_DATA_SOURCE=api` in `.env.local` throws a clear error (not silent failure)
