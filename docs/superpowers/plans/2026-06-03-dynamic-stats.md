# Dynamic Stats Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all hardcoded stat values in Dashboard and Feed screens with values computed from real DB data.

**Architecture:** All required data already exists in the DB (`Score.prevRank`, `Score.pts`, `Score.hits`, `ScoreLog.pts`). The gap is that pages don't query or pass this data down to screens. Each task extends the props interface of a screen, updates the page to compute the missing value, then updates the screen's render logic. Weekly pts is the only value requiring a new query (sum of `ScoreLog.pts` since start of current week).

**Tech Stack:** Next.js 15 App Router, Prisma, Vitest, TypeScript

---

## Hardcoded values being replaced

| Location | Hardcoded | Dynamic value |
|---|---|---|
| Dashboard topbar mobile | `"LIGA · AMIGOS DEL BAR"` | `leagueName` prop |
| Dashboard topbar desktop | `"LIGA AMIGOS DEL BAR"` | `leagueName` prop |
| Dashboard greeting | `"HOLA TÚ."` | `"HOLA ${me.name.toUpperCase()}."` |
| Dashboard KPI `▲ SUBISTE 3 POSICIONES` | hardcoded `3` | `me.prevRank - me.rank` |
| Dashboard KPI `A 35 DEL LÍDER · A 11 DEL #3` | hardcoded | computed from `members` |
| Dashboard KPI `/27` hits total | hardcoded `27` | `totalFinalMatches` prop |
| Feed topbar `"Tú"` / `"#08F7FE"` | hardcoded | `me.name` / `me.color` |
| Feed topbar `"LIGA · AMIGOS DEL BAR"` | hardcoded | `leagueName` prop |
| Feed desktop topbar | `"LIGA AMIGOS DEL BAR"` | `leagueName` prop |
| Feed league-bar `+3 ESTA SEMANA` | hardcoded `3` | `weeklyPts` prop |
| Feed KPI `▲ SUBISTE 3 POSICIONES` | hardcoded `3` | `me.prevRank - me.rank` |
| Feed KPI `A 35 DEL LÍDER` | hardcoded | `ptsBehindLeader` prop |
| Feed KPI `/12` members | hardcoded `12` | `totalMembers` prop |

---

## File map

| File | Action | Responsibility |
|---|---|---|
| `src/lib/weekly-pts.ts` | **Create** | Pure helper: sum `ScoreLog.pts` since start of current week |
| `src/__tests__/lib/weekly-pts.test.ts` | **Create** | Unit tests for the helper |
| `src/app/(main)/feed/page.tsx` | **Modify** | Compute and pass new props to `FeedScreen` |
| `src/app/(main)/feed/feed-screen.tsx` | **Modify** | Accept new props, remove all hardcoded stats |
| `src/app/(main)/dashboard/page.tsx` | **Modify** | Compute and pass new props to `DashboardScreen` |
| `src/app/(main)/dashboard/dashboard-screen.tsx` | **Modify** | Accept new props, remove all hardcoded stats |

---

## Task 1: Weekly pts helper

**Files:**
- Create: `src/lib/weekly-pts.ts`
- Create: `src/__tests__/lib/weekly-pts.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/__tests__/lib/weekly-pts.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getWeeklyPts } from '@/lib/weekly-pts'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    scoreLog: { findMany: vi.fn() },
  },
}))

import { prisma } from '@/lib/prisma'

describe('getWeeklyPts', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns sum of pts from logs this week', async () => {
    vi.mocked(prisma.scoreLog.findMany).mockResolvedValue([
      { pts: 5 } as any,
      { pts: 3 } as any,
    ])
    const result = await getWeeklyPts('user1', 'league1')
    expect(result).toBe(8)
  })

  it('returns 0 when no logs this week', async () => {
    vi.mocked(prisma.scoreLog.findMany).mockResolvedValue([])
    const result = await getWeeklyPts('user1', 'league1')
    expect(result).toBe(0)
  })

  it('queries logs from start of current ISO week (Monday)', async () => {
    vi.mocked(prisma.scoreLog.findMany).mockResolvedValue([])
    await getWeeklyPts('user1', 'league1')
    const call = vi.mocked(prisma.scoreLog.findMany).mock.calls[0][0]
    const gte = (call.where as any).score.leagueId
    expect(gte).toBe('league1')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```
npx vitest run src/__tests__/lib/weekly-pts.test.ts
```
Expected: FAIL — "Cannot find module '@/lib/weekly-pts'"

- [ ] **Step 3: Implement the helper**

```ts
// src/lib/weekly-pts.ts
import { prisma } from '@/lib/prisma'

function startOfISOWeek(): Date {
  const now = new Date()
  const day = now.getDay() // 0 = Sunday
  const diff = (day === 0 ? -6 : 1 - day) // back to Monday
  const monday = new Date(now)
  monday.setDate(now.getDate() + diff)
  monday.setHours(0, 0, 0, 0)
  return monday
}

export async function getWeeklyPts(userId: string, leagueId: string): Promise<number> {
  const logs = await prisma.scoreLog.findMany({
    where: {
      createdAt: { gte: startOfISOWeek() },
      score: { userId, leagueId },
    },
    select: { pts: true },
  })
  return logs.reduce((sum, l) => sum + l.pts, 0)
}
```

- [ ] **Step 4: Run test to verify it passes**

```
npx vitest run src/__tests__/lib/weekly-pts.test.ts
```
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```
git add src/lib/weekly-pts.ts src/__tests__/lib/weekly-pts.test.ts
git commit -m "feat(stats): add getWeeklyPts helper"
```

---

## Task 2: Extend Feed page and screen

**Files:**
- Modify: `src/app/(main)/feed/page.tsx`
- Modify: `src/app/(main)/feed/feed-screen.tsx`

The current `FeedScreen` receives `me: { rank, pts, streak }`. It needs `name`, `color`, `prevRank` added; plus the new props: `leagueName`, `totalMembers`, `ptsBehindLeader`, `weeklyPts`.

- [ ] **Step 1: Update `FeedScreen` props interface**

In `src/app/(main)/feed/feed-screen.tsx`, replace the current interface:

```ts
// Replace this:
interface FeedScreenProps {
  matches: Match[]
  me: { rank: number; pts: number; streak: number }
}
```

with:

```ts
interface FeedScreenProps {
  matches: Match[]
  me: {
    rank: number
    prevRank: number
    pts: number
    streak: number
    name: string
    color: string
  }
  leagueName: string
  totalMembers: number
  ptsBehindLeader: number
  weeklyPts: number
}
```

- [ ] **Step 2: Replace hardcoded values in `FeedScreen` render**

In `src/app/(main)/feed/feed-screen.tsx`:

1. Mobile topbar — replace `<Avi name="Tú" color="#08F7FE" .../>` with `<Avi name={me.name} color={me.color} .../>`
2. Mobile topbar meta — replace `"LIGA · AMIGOS DEL BAR"` with `` `LIGA · ${leagueName}` ``
3. Desktop topbar `DKTopbar` — replace `crumbs={['LIGA AMIGOS DEL BAR', 'MATCH FEED']}` with `` crumbs={[`LIGA ${leagueName}`, 'MATCH FEED']} ``
4. League-bar `+3 ESTA SEMANA` — replace with `` `+${weeklyPts} ESTA SEMANA` ``
5. Desktop KPI `▲ SUBISTE 3 POSICIONES` — compute delta:

```ts
// Add near top of FeedScreen component body (after destructuring props):
const rankDelta = me.prevRank - me.rank
const rankDeltaLabel = rankDelta > 0
  ? `▲ SUBISTE ${rankDelta} ${rankDelta === 1 ? 'POSICIÓN' : 'POSICIONES'}`
  : rankDelta < 0
    ? `▼ BAJASTE ${Math.abs(rankDelta)} ${Math.abs(rankDelta) === 1 ? 'POSICIÓN' : 'POSICIONES'}`
    : 'SIN CAMBIOS'
const rankDeltaColor = rankDelta > 0 ? 'var(--signal)' : rankDelta < 0 ? 'var(--danger)' : 'var(--fg-mute)'
```

Replace the hardcoded `▲ SUBISTE 3 POSICIONES` span:
```tsx
<span className="foot" style={{ color: rankDeltaColor }}>{rankDeltaLabel}</span>
```

6. Desktop KPI `A 35 DEL LÍDER` — replace with:
```tsx
<span className="foot">{ptsBehindLeader > 0 ? `A ${ptsBehindLeader} DEL LÍDER` : 'LÍDER DE LA LIGA'}</span>
```

7. Desktop KPI `/12` members — replace with `` `/${totalMembers}` ``

8. Mobile KPI `JORNADA 04<small>/12</small>` — the `/12` now uses `totalMembers` but `04` stays hardcoded for now (no matchday in schema). This will be addressed in a future plan. Leave the `04` but replace `/12` with `/{totalMembers}`.

- [ ] **Step 3: Update `feed/page.tsx` to compute new props**

Replace the current page:

```ts
// src/app/(main)/feed/page.tsx
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getLeagueRepository, getMatchRepository, getPredictionRepository } from '@/repositories'
import { getWeeklyPts } from '@/lib/weekly-pts'
import { FeedScreen } from './feed-screen'

export default async function FeedPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/login')

  const userId = session.user.id

  const firstMembership = await prisma.leagueMember.findFirst({
    where: { userId },
    orderBy: { joinedAt: 'asc' },
    select: { leagueId: true },
  })

  const leagueId = firstMembership?.leagueId

  const [matches, members, predictions, league, weeklyPts] = await Promise.all([
    getMatchRepository().getMatches(),
    leagueId ? getLeagueRepository(userId).getMembers(leagueId) : Promise.resolve([]),
    getPredictionRepository(userId).getPredictions(userId),
    leagueId
      ? prisma.league.findUnique({ where: { id: leagueId }, select: { name: true } })
      : Promise.resolve(null),
    leagueId ? getWeeklyPts(userId, leagueId) : Promise.resolve(0),
  ])

  const predMap = new Map(predictions.map(p => [p.matchId, p.score]))
  const matchesWithPreds = matches.map(m => ({ ...m, userPrediction: predMap.get(m.id) ?? null }))

  const sortedMembers = [...members].sort((a, b) => b.pts - a.pts)
  const me = members.find(m => m.me) ?? { rank: 0, prevRank: 0, pts: 0, streak: 0, name: 'Tú', color: '#08F7FE' }
  const leader = sortedMembers[0]
  const ptsBehindLeader = leader && leader.id !== me.id ? leader.pts - me.pts : 0

  return (
    <FeedScreen
      matches={matchesWithPreds}
      me={{
        rank: me.rank,
        prevRank: me.prevRank,
        pts: me.pts,
        streak: me.streak,
        name: me.name,
        color: me.color,
      }}
      leagueName={league?.name ?? ''}
      totalMembers={members.length}
      ptsBehindLeader={ptsBehindLeader}
      weeklyPts={weeklyPts}
    />
  )
}
```

- [ ] **Step 4: Verify TypeScript compiles**

```
npx tsc --noEmit
```
Expected: 0 errors

- [ ] **Step 5: Commit**

```
git add src/app/(main)/feed/page.tsx src/app/(main)/feed/feed-screen.tsx
git commit -m "feat(stats): feed screen uses real rank delta, leader gap, weekly pts"
```

---

## Task 3: Extend Dashboard page and screen

**Files:**
- Modify: `src/app/(main)/dashboard/page.tsx`
- Modify: `src/app/(main)/dashboard/dashboard-screen.tsx`

- [ ] **Step 1: Update `DashboardScreen` props interface**

In `src/app/(main)/dashboard/dashboard-screen.tsx`, replace:

```ts
// Replace this:
interface DashboardScreenProps {
  matches: Match[]
  members: Member[]
}
```

with:

```ts
interface DashboardScreenProps {
  matches: Match[]
  members: Member[]
  leagueName: string
  totalFinalMatches: number
  weeklyPts: number
}
```

Update function signature:
```ts
export function DashboardScreen({ matches, members, leagueName, totalFinalMatches, weeklyPts }: DashboardScreenProps) {
```

- [ ] **Step 2: Compute rank stats inside `DashboardScreen`**

Add near the top of the component body (after `const me = ...`):

```ts
const rankDelta = me.prevRank - me.rank
const rankDeltaLabel = rankDelta > 0
  ? `▲ SUBISTE ${rankDelta} ${rankDelta === 1 ? 'POSICIÓN' : 'POSICIONES'} ESTA SEMANA`
  : rankDelta < 0
    ? `▼ BAJASTE ${Math.abs(rankDelta)} ${Math.abs(rankDelta) === 1 ? 'POSICIÓN' : 'POSICIONES'} ESTA SEMANA`
    : 'SIN CAMBIOS ESTA SEMANA'
const rankDeltaColor = rankDelta > 0 ? 'var(--signal)' : rankDelta < 0 ? 'var(--danger)' : 'var(--fg-mute)'

const sortedByPts = [...members].sort((a, b) => b.pts - a.pts)
const leader = sortedByPts[0]
const third = sortedByPts[2]
const ptsBehindLeader = leader && leader.id !== me.id ? leader.pts - me.pts : 0
const ptsBehindThird = third && me.rank > 3 ? third.pts - me.pts : 0

const ptsGapLabel = ptsBehindLeader > 0
  ? ptsBehindThird > 0
    ? `A ${ptsBehindLeader} DEL LÍDER · A ${ptsBehindThird} DEL #3`
    : `A ${ptsBehindLeader} DEL LÍDER`
  : 'LÍDER DE LA LIGA'
```

- [ ] **Step 3: Replace hardcoded values in `DashboardScreen` render**

1. Mobile topbar meta — `"LIGA · AMIGOS DEL BAR"` → `` `LIGA · ${leagueName}` ``
2. Desktop topbar crumbs — `['LIGA AMIGOS DEL BAR', 'DASHBOARD']` → `` [`LIGA ${leagueName}`, 'DASHBOARD'] ``
3. Desktop greeting — `"HOLA TÚ."` → `` `HOLA ${me.name.toUpperCase()}.` ``
4. Desktop KPI rank delta `▲ SUBISTE 3 POSICIONES ESTA SEMANA`:
```tsx
<span className="foot" style={{ color: rankDeltaColor }}>{rankDeltaLabel}</span>
```
5. Desktop KPI pts gap `A 35 DEL LÍDER · A 11 DEL #3`:
```tsx
<span className="foot">{ptsGapLabel}</span>
```
6. Dashboard KPI hits total `/27`:
```tsx
<span className="value">{me.hits}<span className="small">/{totalFinalMatches}</span></span>
<span className="foot">{totalFinalMatches > 0 ? `${Math.round(me.hits / totalFinalMatches * 100)}% PRECISIÓN GLOBAL` : '—'}</span>
```

- [ ] **Step 4: Update `dashboard/page.tsx` to compute new props**

Replace the current page:

```ts
// src/app/(main)/dashboard/page.tsx
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getLeagueRepository, getMatchRepository } from '@/repositories'
import { getWeeklyPts } from '@/lib/weekly-pts'
import { DashboardScreen } from './dashboard-screen'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
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

  const [matches, members, league, totalFinalMatches, weeklyPts] = await Promise.all([
    getMatchRepository().getMatches(),
    getLeagueRepository(userId).getMembers(leagueId),
    prisma.league.findUnique({ where: { id: leagueId }, select: { name: true } }),
    prisma.match.count({ where: { state: 'FINAL' } }),
    getWeeklyPts(userId, leagueId),
  ])

  return (
    <DashboardScreen
      matches={matches}
      members={members}
      leagueName={league?.name ?? ''}
      totalFinalMatches={totalFinalMatches}
      weeklyPts={weeklyPts}
    />
  )
}
```

- [ ] **Step 5: Verify TypeScript compiles**

```
npx tsc --noEmit
```
Expected: 0 errors

- [ ] **Step 6: Commit**

```
git add src/app/(main)/dashboard/page.tsx src/app/(main)/dashboard/dashboard-screen.tsx
git commit -m "feat(stats): dashboard uses real rank delta, leader gap, hits total, league name"
```

---

## Task 4: Full test run

- [ ] **Step 1: Run all tests**

```
npx vitest run
```
Expected: all existing tests pass + 3 new tests for `weekly-pts`

- [ ] **Step 2: Final commit if anything was missed**

If any TS errors or test failures were found and fixed in previous steps, commit the fixes:
```
git add -p
git commit -m "fix(stats): resolve TS errors in dynamic stats"
```

---

## Notes / Out of scope

- **Jornada number** (`04` hardcoded in both screens) — the `Match` schema has no `matchday` field. The football-data.org sync would need to store `matchday` per match. This is deferred to a future plan (`dynamic-matchday`).
- **Weekly pts label in Feed mobile league bar** — currently shows `+X ESTA SEMANA` based on `weeklyPts` (score points, not rank positions). This is intentional: the number reflects pts earned this week, which is the most useful metric in that context.
- **Settings screen hardcoded stats** (`"213"`, `"34"`, `"28/104"`) — out of scope; deferred.
- **Match detail prediction percentages** (hardcoded `62% / 25% / 13%`) — out of scope; requires aggregating all users' predictions per match.
