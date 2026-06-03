# Dynamic Stats Extended — Settings, Prediction Percentages, Matchday

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans

## Context

Continuation of `2026-06-03-dynamic-stats.md` (committed as 3 commits, 66 tests passing).
Three remaining hardcoded values, ordered **easiest → hardest**.

## Files Involved

| File | Task |
|------|------|
| `src/app/(main)/settings/page.tsx` | 1 |
| `src/app/(main)/settings/settings-screen.tsx` | 1 |
| `src/__tests__/lib/prediction-breakdown.test.ts` | 2 (new) |
| `src/lib/prediction-breakdown.ts` | 2 (new) |
| `src/types/domain.ts` | 2, 3 |
| `src/repositories/prisma/match.repository.ts` | 2 |
| `src/app/(main)/feed/[id]/match-detail-screen.tsx` | 2 |
| `prisma/schema.prisma` | 3 |
| `src/__tests__/lib/match-sync.test.ts` | 3 |
| `src/lib/match-sync.ts` | 3 |
| `src/app/api/cron/sync-matches/route.ts` | 3 |
| `src/app/(main)/feed/page.tsx` | 3 |
| `src/app/(main)/feed/feed-screen.tsx` | 3 |
| `src/app/(main)/dashboard/page.tsx` | 3 |
| `src/app/(main)/dashboard/dashboard-screen.tsx` | 3 |

---

## Task 1 — Settings page: fix auth + dynamic league stats

**Goal:** Replace `"AMIGOS DEL BAR"`, `"POLLA-FB7K"`, `"213"`, `"34%"`, `"28/104"`,
creator handle, and creation date with real data.

No pure logic extracted → no unit tests. Validate with `npx tsc --noEmit`.

### Step 1.1 — Expand `SettingsScreenProps` and wire computed values

**File:** `src/app/(main)/settings/settings-screen.tsx`

Replace the interface (currently `{ members, scoringRules }`):

```ts
interface SettingsScreenProps {
  members: Member[]
  scoringRules: ScoringRules
  league: {
    name: string
    ownerHandle: string
    createdAt: string        // ISO 8601
    inviteToken: string | null
  }
  totalMatches: number
  finalMatches: number
}
```

At the top of `SettingsScreen` (after `const R = scoringRules`), add computed values:

```ts
const avgPts =
  members.length > 0
    ? Math.round(members.reduce((s, m) => s + m.pts, 0) / members.length)
    : 0

const avgHitPct =
  finalMatches > 0 && members.length > 0
    ? Math.round(
        (members.reduce((s, m) => s + m.hits, 0) / members.length / finalMatches) * 100,
      )
    : 0

const createdShort = new Date(league.createdAt)
  .toLocaleDateString('es', { day: 'numeric', month: 'short' })
  .toUpperCase()   // e.g. "11 MAY"

const createdFull = new Date(league.createdAt)
  .toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })
  .toUpperCase()   // e.g. "11 MAY 2026"
```

Replace hardcoded strings throughout the component:

| Location | Old value | New value |
|---|---|---|
| `DKTopbar crumbs[0]` | `'LIGA AMIGOS DEL BAR'` | `` `LIGA ${league.name}` `` |
| desktop page-head `.sub` | `"12 MIEMBROS · CREADA POR @TANIA · 11 MAY 2026"` | `` `${members.length} MIEMBROS · CREADA POR @${league.ownerHandle} · ${createdFull}` `` |
| mobile card `t-h2` title | `"AMIGOS DEL BAR"` | `{league.name}` |
| mobile card `t-meta` | `"12 MIEMBROS · CREADA 11 MAY · POR @TANIA"` | `` `${members.length} MIEMBROS · CREADA ${createdShort} · POR @${league.ownerHandle}` `` |
| mobile share button label | `"COMPARTIR · POLLA-FB7K"` | `` `COMPARTIR${league.inviteToken ? ` · ${league.inviteToken.slice(0, 8).toUpperCase()}` : ''}` `` |
| desktop invite code `t-h2` | `"POLLA-FB7K"` | `{league.inviteToken?.toUpperCase() ?? '—'}` |
| desktop KPI `PARTIDOS` value | `28<span className="small">/104</span>` | `{finalMatches}<span className="small">/{totalMatches}</span>` |
| desktop KPI `PROM PTS` value | `213` | `{avgPts}` |
| desktop KPI `% HIT LIGA` value | `34<span className="small">%</span>` | `{avgHitPct}<span className="small">%</span>` |
| mobile KPI `PARTIDOS` value | `28<span className="small">/104</span>` | `{finalMatches}<span className="small">/{totalMatches}</span>` |
| mobile KPI `PROM PTS` value | `213` | `{avgPts}` |

### Step 1.2 — Fix `settings/page.tsx` — auth + real data

**File:** `src/app/(main)/settings/page.tsx`

Replace the entire file:

```ts
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getLeagueRepository } from '@/repositories'
import { SettingsScreen } from './settings-screen'

export default async function SettingsPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/login')

  const userId = session.user.id

  const firstMembership = await prisma.leagueMember.findFirst({
    where: { userId },
    orderBy: { joinedAt: 'asc' },
    select: { leagueId: true },
  })
  if (!firstMembership) redirect('/leagues')

  const leagueId = firstMembership.leagueId

  const [members, scoringRules, league, totalMatches, finalMatches, invite] = await Promise.all([
    getLeagueRepository(userId).getMembers(leagueId),
    getLeagueRepository(userId).getScoringRules(leagueId),
    prisma.league.findUnique({
      where: { id: leagueId },
      include: { owner: { select: { handle: true } } },
    }),
    prisma.match.count(),
    prisma.match.count({ where: { state: 'FINAL' } }),
    prisma.leagueInvite.findFirst({
      where: { leagueId },
      orderBy: { createdAt: 'desc' },
      select: { token: true },
    }),
  ])

  if (!league) redirect('/leagues')

  return (
    <SettingsScreen
      members={members}
      scoringRules={scoringRules}
      league={{
        name: league.name,
        ownerHandle: league.owner.handle,
        createdAt: league.createdAt.toISOString(),
        inviteToken: invite?.token ?? null,
      }}
      totalMatches={totalMatches}
      finalMatches={finalMatches}
    />
  )
}
```

### Step 1.3 — TypeCheck + commit

```bash
npx tsc --noEmit
# Expected: 0 errors

git add src/app/(main)/settings/page.tsx src/app/(main)/settings/settings-screen.tsx
git commit -m "feat: settings page dynamic stats — auth, league name, invite token, match counts, avg pts"
```

---

## Task 2 — Match detail: real prediction percentages

**Goal:** Replace hardcoded `62%/25%/13%` and `"8 PRED"` / `"8 PREDICCIONES"` with live
aggregates from `Prediction` table.

### Step 2.1 — Write failing tests

**File:** `src/__tests__/lib/prediction-breakdown.test.ts` (NEW)

```ts
import { describe, it, expect } from 'vitest'
import { computePredictionBreakdown } from '@/lib/prediction-breakdown'

describe('computePredictionBreakdown', () => {
  it('returns null for empty array', () => {
    expect(computePredictionBreakdown([])).toBeNull()
  })

  it('counts home wins, draws, away wins correctly', () => {
    const preds = [
      { homeScore: 2, awayScore: 0 },
      { homeScore: 1, awayScore: 0 },
      { homeScore: 0, awayScore: 1 },
      { homeScore: 1, awayScore: 1 },
    ]
    const result = computePredictionBreakdown(preds)
    expect(result?.homeWin).toBe(50)  // 2/4
    expect(result?.awayWin).toBe(25)  // 1/4
    expect(result?.draw).toBe(25)     // 1/4
    expect(result?.total).toBe(4)
  })

  it('rounds fractional percentages to nearest integer', () => {
    const preds = [
      { homeScore: 2, awayScore: 0 },
      { homeScore: 2, awayScore: 0 },
      { homeScore: 0, awayScore: 1 },
    ]
    const result = computePredictionBreakdown(preds)
    expect(result?.homeWin).toBe(67)  // 66.7 → 67
    expect(result?.awayWin).toBe(33)  // 33.3 → 33
    expect(result?.draw).toBe(0)
  })
})
```

Run to confirm failure:

```bash
npx vitest run src/__tests__/lib/prediction-breakdown.test.ts
# Expected: FAIL — module not found
```

### Step 2.2 — Implement `computePredictionBreakdown`

**File:** `src/lib/prediction-breakdown.ts` (NEW)

```ts
export interface PredictionBreakdown {
  homeWin: number
  draw: number
  awayWin: number
  total: number
}

export function computePredictionBreakdown(
  preds: { homeScore: number; awayScore: number }[],
): PredictionBreakdown | null {
  const total = preds.length
  if (total === 0) return null
  const homeWin = Math.round(
    (preds.filter(p => p.homeScore > p.awayScore).length / total) * 100,
  )
  const draw = Math.round(
    (preds.filter(p => p.homeScore === p.awayScore).length / total) * 100,
  )
  const awayWin = Math.round(
    (preds.filter(p => p.homeScore < p.awayScore).length / total) * 100,
  )
  return { homeWin, draw, awayWin, total }
}
```

Run to confirm pass:

```bash
npx vitest run src/__tests__/lib/prediction-breakdown.test.ts
# Expected: 3 tests PASS
```

### Step 2.3 — Add `predictionBreakdown` to `Match` domain type

**File:** `src/types/domain.ts`

After `timeline?: MatchTimeline[]`, add:

```ts
  predictionBreakdown?: {
    homeWin: number
    draw: number
    awayWin: number
    total: number
  }
```

### Step 2.4 — Populate breakdown in `PrismaMatchRepository.getMatch`

**File:** `src/repositories/prisma/match.repository.ts`

Add import at top:
```ts
import { computePredictionBreakdown } from '@/lib/prediction-breakdown'
```

Replace `getMatch`:
```ts
async getMatch(id: string): Promise<Match | null> {
  const [row, preds] = await Promise.all([
    prisma.match.findUnique({ where: { id } }),
    prisma.prediction.findMany({
      where: { matchId: id },
      select: { homeScore: true, awayScore: true },
    }),
  ])
  if (!row) return null
  const domain = toDomainMatch(row)
  const breakdown = computePredictionBreakdown(preds)
  if (breakdown) domain.predictionBreakdown = breakdown
  return domain
}
```

### Step 2.5 — Use breakdown in `match-detail-screen.tsx`

**File:** `src/app/(main)/feed/[id]/match-detail-screen.tsx`

`match.predictionBreakdown` is now available in both `MobileMatchDetail` and `DesktopMatchDetail`
(both already receive `match: Match` as a prop).

**Mobile section** (around line 120):
```ts
// Old
<span>VS · LIGA · 8 PRED</span>
// New
<span>VS · LIGA · {match.predictionBreakdown?.total ?? 0} PRED</span>
```

**Mobile tribuna section** (around lines 145–160):
```ts
// Old
<div className="num">LIGA · 8 PRED</div>
// ...
{ who: `Gana ${home.name}`, pct: 62, color: home.c1 },
{ who: 'Empate', pct: 25, color: 'var(--fg-mute)' },
{ who: `Gana ${away.name}`, pct: 13, color: away.c1 },

// New
<div className="num">LIGA · {match.predictionBreakdown?.total ?? 0} PRED</div>
// ...
// Replace the hardcoded rows array:
const bd = match.predictionBreakdown
const tributaRows = bd
  ? [
      { who: `Gana ${home.name}`, pct: bd.homeWin, color: home.c1 },
      { who: 'Empate', pct: bd.draw, color: 'var(--fg-mute)' },
      { who: `Gana ${away.name}`, pct: bd.awayWin, color: away.c1 },
    ]
  : []
// Render tributaRows; when empty, render: <div className="t-meta">Sin predicciones aún</div>
```

**Desktop tribuna section** (around lines 273–282):
```ts
// Old
<div className="t-eyebrow">LIGA · 8 PREDICCIONES</div>
// ...
{ who: `Gana ${home.name}`, pct: 62, color: home.c1 },
{ who: 'Empate', pct: 25, color: 'rgba(255,255,255,0.3)' },
{ who: `Gana ${away.name}`, pct: 13, color: away.c1 },

// New
<div className="t-eyebrow">LIGA · {match.predictionBreakdown?.total ?? 0} PREDICCIONES</div>
// Same tributaRows pattern, replacing rgba draw color with 'rgba(255,255,255,0.3)'
```

Note: define `tributaRows` once (or inside each sub-function) — avoid duplication by declaring it
at the top of `MobileMatchDetail` and `DesktopMatchDetail` respectively.

### Step 2.6 — Full test suite + TypeCheck + commit

```bash
npx vitest run
# Expected: all tests pass (66 previous + 3 new = 69)

npx tsc --noEmit
# Expected: 0 errors

git add \
  src/lib/prediction-breakdown.ts \
  "src/__tests__/lib/prediction-breakdown.test.ts" \
  src/types/domain.ts \
  src/repositories/prisma/match.repository.ts \
  "src/app/(main)/feed/[id]/match-detail-screen.tsx"
git commit -m "feat: match detail real prediction percentages — computePredictionBreakdown + repository + screen"
```

---

## Task 3 — Jornada number: dynamic matchday from football-data.org

**Goal:** Replace `"JORNADA 04"` in Feed (3 occurrences) and Dashboard (1 occurrence)
with the real matchday stored in the DB, populated by the sync cron.

⚠️ **Schema migration required.** Run on a dev DB first.

### Step 3.1 — Extend `match-sync.test.ts` with failing matchday test

**File:** `src/__tests__/lib/match-sync.test.ts`

Add `matchday` to every entry in `mockApiResponse`:

```ts
const mockApiResponse = {
  matches: [
    {
      id: 417862,
      matchday: 3,
      status: 'FINISHED',
      score: { fullTime: { home: 3, away: 0 } },
      minute: null,
    },
    {
      id: 417863,
      matchday: 3,
      status: 'IN_PLAY',
      score: { fullTime: { home: null, away: null } },
      minute: 45,
    },
    {
      id: 417864,
      matchday: 4,
      status: 'TIMED',
      score: { fullTime: { home: null, away: null } },
      minute: null,
    },
  ],
}
```

Add a new test at the end of the `describe` block:

```ts
it('includes matchday in mapped result', async () => {
  mockFetch.mockResolvedValue({ ok: true, json: async () => mockApiResponse } as any)
  const matches = await fetchExternalMatches()
  expect(matches.find(m => m.id === '417862')?.matchday).toBe(3)
  expect(matches.find(m => m.id === '417864')?.matchday).toBe(4)
})
```

Run to confirm only the new test fails:

```bash
npx vitest run src/__tests__/lib/match-sync.test.ts
# Expected: 5 existing PASS, 1 new FAIL (matchday is undefined)
```

### Step 3.2 — Add `matchday` to `match-sync.ts`

**File:** `src/lib/match-sync.ts`

```ts
// ExternalMatch — add:
export interface ExternalMatch {
  id: string
  state: 'PENDING' | 'LIVE' | 'FINAL'
  homeScore: number | null
  awayScore: number | null
  liveMinute: number | null
  matchday: number | null   // ADD
}

// FootballDataMatch — add:
interface FootballDataMatch {
  id: number
  matchday: number          // ADD
  status: 'TIMED' | 'SCHEDULED' | 'IN_PLAY' | 'PAUSED' | 'FINISHED' | 'SUSPENDED' | 'POSTPONED' | 'CANCELLED'
  score: {
    fullTime: { home: number | null; away: number | null }
  }
  minute: number | null
}

// In fetchExternalMatches mapping, add:
return data.matches.map(m => ({
  id: String(m.id),
  state: mapStatus(m.status),
  homeScore: m.score.fullTime.home,
  awayScore: m.score.fullTime.away,
  liveMinute: m.minute ?? null,
  matchday: m.matchday ?? null,   // ADD
}))
```

Run to confirm the new test now passes:

```bash
npx vitest run src/__tests__/lib/match-sync.test.ts
# Expected: all 6 tests PASS
```

### Step 3.3 — Add `matchday` to Prisma schema and migrate

**File:** `prisma/schema.prisma`

In the `Match` model, after `liveMinute   Int?`, add:

```prisma
  matchday     Int?
```

Run migration:

```bash
npx prisma migrate dev --name add_match_matchday
# Expected:
# ✔ Generated Prisma Client
# The following migration(s) have been applied:
#   20260603......_add_match_matchday
```

### Step 3.4 — Persist matchday in the sync cron

**File:** `src/app/api/cron/sync-matches/route.ts`

After the three existing transition blocks (PENDING→LIVE, LIVE update, LIVE→FINAL), add a
matchday sync block that keeps the value current on any match in the DB:

```ts
// Sync matchday whenever the external data includes it
if (ext.matchday !== null && current.matchday !== ext.matchday) {
  await prisma.match.update({
    where: { id: ext.id },
    data: { matchday: ext.matchday },
  })
}
```

Also add `matchday` to the PENDING→LIVE data payload so it is set atomically on first lock:

```ts
if (current.state === 'PENDING' && ext.state === 'LIVE') {
  await prisma.match.update({
    where: { id: ext.id },
    data: {
      state: 'LIVE',
      locked: true,
      liveMinute: ext.liveMinute ?? 0,
      ...(ext.matchday !== null ? { matchday: ext.matchday } : {}),  // ADD
    },
  })
  results.locked++
}
```

### Step 3.5 — Map `matchday` in the match repository

**File:** `src/repositories/prisma/match.repository.ts`

In `toDomainMatch`, add before the closing `}`:

```ts
matchday: m.matchday ?? undefined,
```

### Step 3.6 — Add `matchday` to `Match` domain type

**File:** `src/types/domain.ts`

After `timeline?: MatchTimeline[]`, add:

```ts
  matchday?: number
```

(If `predictionBreakdown` was already added in Task 2, place `matchday` before it for grouping.)

### Step 3.7 — Add `currentMatchday` prop to both screens

**File:** `src/app/(main)/feed/feed-screen.tsx`

Add to `FeedScreenProps`:

```ts
currentMatchday: number | null
```

Replace all 3 occurrences of `04`:

```ts
// Line ~179 — desktop sub
// Old: JORNADA 04 · {matches.length} PARTIDOS
// New:
`JORNADA ${currentMatchday ?? '—'} · ${matches.length} PARTIDOS`

// Lines ~208 and ~241 — mobile KPI value and desktop KPI value (both identical)
// Old: <span className="value">04<span className="small">/{totalMembers}</span></span>
// New:
<span className="value">
  {currentMatchday !== null ? String(currentMatchday).padStart(2, '0') : '—'}
  <span className="small">/{totalMembers}</span>
</span>
```

**File:** `src/app/(main)/dashboard/dashboard-screen.tsx`

Add to `DashboardScreenProps`:

```ts
currentMatchday: number | null
```

Replace the 1 occurrence (line ~71):

```ts
// Old: JORNADA 04 · {new Date().toLocaleDateString(...)}
// New:
`JORNADA ${currentMatchday ?? '—'} · ${new Date().toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'short' }).toUpperCase()}`
```

### Step 3.8 — Fetch `currentMatchday` in both pages

**File:** `src/app/(main)/feed/page.tsx`

Add to the parallel data fetch:

```ts
prisma.match.findFirst({
  where: { matchday: { not: null }, state: { in: ['PENDING', 'LIVE'] as any } },
  orderBy: { kickoffAt: 'asc' },
  select: { matchday: true },
}),
```

Destructure result as `currentMatchdayRow` and derive:

```ts
const currentMatchday = currentMatchdayRow?.matchday ?? null
```

Pass `currentMatchday={currentMatchday}` to `<FeedScreen>`.

**File:** `src/app/(main)/dashboard/page.tsx`

Same parallel query, same prop passed to `<DashboardScreen>`.

### Step 3.9 — Full test suite + TypeCheck + commit

```bash
npx vitest run
# Expected: all tests pass

npx tsc --noEmit
# Expected: 0 errors

git add \
  prisma/schema.prisma \
  prisma/migrations/ \
  src/lib/match-sync.ts \
  "src/__tests__/lib/match-sync.test.ts" \
  src/app/api/cron/sync-matches/route.ts \
  src/repositories/prisma/match.repository.ts \
  src/types/domain.ts \
  "src/app/(main)/feed/page.tsx" \
  "src/app/(main)/feed/feed-screen.tsx" \
  "src/app/(main)/dashboard/page.tsx" \
  "src/app/(main)/dashboard/dashboard-screen.tsx"
git commit -m "feat: jornada number — matchday in schema, synced from API, rendered dynamically"
```

---

## Final Verification Checklist

After all 3 tasks are committed:

- [ ] `npx vitest run` — all tests pass (target ≥ 70)
- [ ] `npx tsc --noEmit` — 0 errors
- [ ] Settings page: loads with real league name, invite token, `finalMatches/totalMatches`, avg pts
- [ ] Match detail: `0 PRED` empty state + real percentages when predictions exist
- [ ] Feed + Dashboard headers: matchday from DB; graceful `—` when null (no data yet)
