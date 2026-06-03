# ScoreLog UI — Desglose por Partido

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Exponer los registros `ScoreLog` ya almacenados en DB como una vista de detalle de puntos por partido, accesible desde el historial de predicciones del perfil.

**Architecture:** El `ScoringService` ya escribe `ScoreLog` por cada partido puntuado. Se necesita un repositorio que los lea, un endpoint API, y un drawer en `ProfileScreen` que muestre el desglose al hacer click en un partido del historial.

**Tech Stack:** Next.js 15 App Router, Prisma, TypeScript, Vitest

---

## File Map

- Modify: `src/types/domain.ts` — agregar `ScoreLogEntry`
- Modify: `src/repositories/interfaces/index.ts` — agregar `IScoreLogRepository`
- Create: `src/repositories/prisma/score-log.repository.ts`
- Create: `src/__tests__/repositories/score-log.test.ts`
- Create: `src/app/api/leagues/[id]/score-log/route.ts`
- Modify: `src/app/(main)/profile/profile-screen.tsx` — drawer de desglose por partido

---

### Task 1: Agregar `ScoreLogEntry` a domain.ts

**Files:**
- Modify: `src/types/domain.ts`

- [ ] **Step 1: Agregar el tipo al final de domain.ts**

```typescript
export interface ScoreLogEntry {
  id: string
  matchId: string
  pts: number
  type: string
  detail: {
    winner: number
    goalsHome: number
    goalsAway: number
    diff: number
    streakBonus: number
    prediction: { home: number; away: number }
    result: { home: number; away: number }
  }
  createdAt: string
}
```

- [ ] **Step 2: Commit**

```bash
git add src/types/domain.ts
git commit -m "feat(types): add ScoreLogEntry domain type"
```

---

### Task 2: Agregar `IScoreLogRepository` a interfaces

**Files:**
- Modify: `src/repositories/interfaces/index.ts`

- [ ] **Step 1: Agregar la interfaz al archivo existente**

En `src/repositories/interfaces/index.ts`, agregar después de `ILeagueManagementRepository`:

```typescript
export interface IScoreLogRepository {
  getScoreLog(userId: string, leagueId: string): Promise<ScoreLogEntry[]>
  getMatchScoreLog(userId: string, leagueId: string, matchId: string): Promise<ScoreLogEntry | null>
}
```

Y agregar `ScoreLogEntry` al import existente en la primera línea:

```typescript
import type { Badge, League, LeagueMember, LeagueRequest, Match, MatchState, Member, Prediction, ScoringRules, ScoreLogEntry } from '@/types/domain'
```

- [ ] **Step 2: Commit**

```bash
git add src/repositories/interfaces/index.ts
git commit -m "feat(interfaces): add IScoreLogRepository"
```

---

### Task 3: Implementar `PrismaScoreLogRepository`

**Files:**
- Create: `src/repositories/prisma/score-log.repository.ts`

- [ ] **Step 1: Escribir el test primero**

Crear `src/__tests__/repositories/score-log.test.ts`:

```typescript
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PrismaScoreLogRepository } from '@/repositories/prisma/score-log.repository'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    scoreLog: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
  },
}))

import { prisma } from '@/lib/prisma'

const mockRow = {
  id: 'log-1',
  scoreId: 'score-1',
  matchId: 'match-1',
  pts: 7,
  type: 'match+streak',
  detail: {
    winner: 5,
    goalsHome: 0,
    goalsAway: 2,
    diff: 0,
    streakBonus: 0,
    prediction: { home: 1, away: 2 },
    result: { home: 0, away: 2 },
  },
  createdAt: new Date('2026-06-01T12:00:00Z'),
}

describe('PrismaScoreLogRepository', () => {
  let repo: PrismaScoreLogRepository
  beforeEach(() => {
    repo = new PrismaScoreLogRepository()
    vi.clearAllMocks()
  })

  describe('getScoreLog', () => {
    it('maps prisma rows to ScoreLogEntry[]', async () => {
      vi.mocked(prisma.scoreLog.findMany).mockResolvedValue([mockRow] as any)

      const result = await repo.getScoreLog('user-1', 'league-1')

      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        id: 'log-1',
        matchId: 'match-1',
        pts: 7,
        type: 'match+streak',
        createdAt: '2026-06-01T12:00:00.000Z',
      })
    })

    it('returns empty array when no logs', async () => {
      vi.mocked(prisma.scoreLog.findMany).mockResolvedValue([])
      expect(await repo.getScoreLog('user-1', 'league-1')).toEqual([])
    })
  })

  describe('getMatchScoreLog', () => {
    it('returns null when not found', async () => {
      vi.mocked(prisma.scoreLog.findFirst).mockResolvedValue(null)
      expect(await repo.getMatchScoreLog('user-1', 'league-1', 'match-1')).toBeNull()
    })

    it('maps row to ScoreLogEntry when found', async () => {
      vi.mocked(prisma.scoreLog.findFirst).mockResolvedValue(mockRow as any)
      const result = await repo.getMatchScoreLog('user-1', 'league-1', 'match-1')
      expect(result?.pts).toBe(7)
    })
  })
})
```

- [ ] **Step 2: Correr el test para verificar que falla**

```
npx vitest run src/__tests__/repositories/score-log.test.ts
```

Expected: FAIL — `Cannot find module '@/repositories/prisma/score-log.repository'`

- [ ] **Step 3: Implementar el repositorio**

Crear `src/repositories/prisma/score-log.repository.ts`:

```typescript
import { prisma } from '@/lib/prisma'
import type { IScoreLogRepository } from '@/repositories/interfaces'
import type { ScoreLogEntry } from '@/types/domain'

export class PrismaScoreLogRepository implements IScoreLogRepository {
  async getScoreLog(userId: string, leagueId: string): Promise<ScoreLogEntry[]> {
    const rows = await prisma.scoreLog.findMany({
      where: { score: { userId, leagueId } },
      orderBy: { createdAt: 'desc' },
    })
    return rows.map(this.mapRow)
  }

  async getMatchScoreLog(userId: string, leagueId: string, matchId: string): Promise<ScoreLogEntry | null> {
    const row = await prisma.scoreLog.findFirst({
      where: { score: { userId, leagueId }, matchId },
    })
    return row ? this.mapRow(row) : null
  }

  private mapRow(r: {
    id: string; matchId: string; pts: number; type: string; detail: unknown; createdAt: Date
  }): ScoreLogEntry {
    return {
      id: r.id,
      matchId: r.matchId,
      pts: r.pts,
      type: r.type,
      detail: r.detail as ScoreLogEntry['detail'],
      createdAt: r.createdAt.toISOString(),
    }
  }
}
```

- [ ] **Step 4: Correr el test para verificar que pasa**

```
npx vitest run src/__tests__/repositories/score-log.test.ts
```

Expected: PASS — 4 tests passing

- [ ] **Step 5: Commit**

```bash
git add src/repositories/prisma/score-log.repository.ts src/__tests__/repositories/score-log.test.ts
git commit -m "feat(repo): add PrismaScoreLogRepository with tests"
```

---

### Task 4: Crear endpoint `GET /api/leagues/[id]/score-log`

**Files:**
- Create: `src/app/api/leagues/[id]/score-log/route.ts`

- [ ] **Step 1: Crear el archivo**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { PrismaScoreLogRepository } from '@/repositories/prisma/score-log.repository'

const repo = new PrismaScoreLogRepository()

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: leagueId } = await params
  const { searchParams } = new URL(req.url)
  const matchId = searchParams.get('matchId')

  if (matchId) {
    const entry = await repo.getMatchScoreLog(session.user.id, leagueId, matchId)
    return NextResponse.json({ entry })
  }

  const logs = await repo.getScoreLog(session.user.id, leagueId)
  return NextResponse.json({ logs })
}
```

- [ ] **Step 2: Verificar que no hay errores de TypeScript**

```
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/app/api/leagues/[id]/score-log/route.ts
git commit -m "feat(api): add GET /api/leagues/[id]/score-log endpoint"
```

---

### Task 5: Integrar score log en ProfileScreen

**Files:**
- Modify: `src/app/(main)/profile/profile-screen.tsx`

- [ ] **Step 1: Agregar el import de `ScoreLogEntry` y actualizar la interfaz de props**

En `profile-screen.tsx`, agregar al import de tipos:

```typescript
import type { Badge, Match, Member, ScoreLogEntry } from '@/types/domain'
```

Actualizar `ProfileScreenProps`:

```typescript
interface ProfileScreenProps {
  me: Member
  members: Member[]
  finishedMatches: Match[]
  badges: Badge[]
  scoreLogs?: ScoreLogEntry[]
}
```

- [ ] **Step 2: Agregar el componente `MatchScoreLogDrawer` dentro del mismo archivo**

Agregar antes de `ProfileScreen`:

```typescript
function MatchScoreLogDrawer({ entry, match, onClose }: {
  entry: ScoreLogEntry
  match: Match
  onClose: () => void
}) {
  const d = entry.detail
  const rows = [
    { label: 'Ganador/Empate', pts: d.winner, color: 'var(--fg)' },
    { label: 'Goles local exactos', pts: d.goalsHome, color: 'var(--signal)' },
    { label: 'Goles visitante exactos', pts: d.goalsAway, color: 'var(--signal)' },
    { label: 'Diferencia exacta', pts: d.diff, color: 'var(--signal)' },
    { label: 'Bonus racha', pts: d.streakBonus, color: 'var(--warn)' },
  ]
  return (
    <div style={{ padding: '16px 20px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div className="t-eyebrow">DESGLOSE · {match.home.code} vs {match.away.code}</div>
          <div className="t-meta" style={{ marginTop: 4 }}>
            Pred: {d.prediction.home}–{d.prediction.away} · Real: {d.result.home}–{d.result.away}
          </div>
        </div>
        <button className="icon-btn" onClick={onClose}><GameIcon name="close" size={14} /></button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {rows.map(r => (
          <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 8 }}>
            <span style={{ fontSize: 13, color: 'var(--fg-dim)' }}>{r.label}</span>
            <span style={{ fontFamily: 'var(--font-inter, sans-serif)', fontWeight: 900, fontSize: 16, color: r.pts > 0 ? r.color : 'var(--fg-faint)' }}>
              {r.pts > 0 ? `+${r.pts}` : '0'}
            </span>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 14px', background: 'var(--surface-2)', borderRadius: 8, marginTop: 4 }}>
          <span className="t-eyebrow">TOTAL</span>
          <span style={{ fontFamily: 'var(--font-inter, sans-serif)', fontWeight: 900, fontSize: 24, letterSpacing: '-0.04em', color: entry.pts > 0 ? 'var(--signal)' : 'var(--fg-faint)' }}>
            +{entry.pts}
          </span>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Agregar estado y lógica de drawer en `ProfileScreen`**

Dentro de `ProfileScreen`, después de `const hitRate`:

```typescript
const [selectedLogMatch, setSelectedLogMatch] = useState<{ match: Match; entry: ScoreLogEntry } | null>(null)
const scoreLogMap = new Map((scoreLogs ?? []).map(l => [l.matchId, l]))
```

- [ ] **Step 4: Hacer los match cards clickeables en el historial (mobile y desktop)**

En cada `finishedMatches.map((m) => { ... })`, tanto en la sección mobile como desktop, reemplazar el `div` raíz del card por:

```tsx
<div
  key={m.id}
  className="card"
  style={{ padding: 12, display: 'flex', alignItems: 'center', gap: 10, cursor: scoreLogMap.has(m.id) ? 'pointer' : 'default' }}
  onClick={() => {
    const entry = scoreLogMap.get(m.id)
    if (entry) setSelectedLogMatch({ match: m, entry })
  }}
>
  {/* contenido existente sin cambios */}
</div>
```

- [ ] **Step 5: Agregar el drawer/dialog al final del componente**

Justo antes del `<div style={{ height: 96 }} />` final:

```tsx
{selectedLogMatch && (
  <div style={{
    position: 'fixed', inset: 0, zIndex: 50,
    background: 'rgba(0,0,0,0.6)',
    display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
  }} onClick={() => setSelectedLogMatch(null)}>
    <div style={{
      background: 'var(--bg)', borderRadius: '20px 20px 0 0',
      width: '100%', maxWidth: 480,
    }} onClick={e => e.stopPropagation()}>
      <MatchScoreLogDrawer
        entry={selectedLogMatch.entry}
        match={selectedLogMatch.match}
        onClose={() => setSelectedLogMatch(null)}
      />
    </div>
  </div>
)}
```

- [ ] **Step 6: Verificar tipos**

```
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 7: Commit**

```bash
git add src/app/(main)/profile/profile-screen.tsx
git commit -m "feat(ui): add ScoreLog drawer to profile match history"
```

---

### Task 6: Pasar `scoreLogs` desde el page al screen

**Files:**
- Modify: `src/app/(main)/profile/page.tsx`

- [ ] **Step 1: Leer el archivo actual**

Leer `src/app/(main)/profile/page.tsx` para ver cómo se cargan los datos.

- [ ] **Step 2: Agregar la carga de score logs**

En el server component `page.tsx`, dentro de la función de carga de datos, agregar:

```typescript
// Fetch score logs del primer league del usuario (o el league activo)
const scoreLogsRes = leagueId
  ? await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/leagues/${leagueId}/score-log`, {
      headers: { cookie: cookieHeader },
      cache: 'no-store',
    }).then(r => r.json())
  : { logs: [] }

const scoreLogs = scoreLogsRes.logs ?? []
```

Y pasar `scoreLogs` al `<ProfileScreen>`.

- [ ] **Step 3: Commit**

```bash
git add src/app/(main)/profile/page.tsx
git commit -m "feat(profile): wire score logs from API to ProfileScreen"
```
