# Profile Prediction History — Historial Detallado de Predicciones

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reemplazar el historial de predicciones del perfil (actualmente usa datos estáticos del store local) con datos reales desde la base de datos, con paginación incremental y desglose de puntos por partido.

**Architecture:** Nuevo endpoint `GET /api/profile/history` que retorna las predicciones del usuario con datos del partido y ScoreLog. El endpoint acepta `leagueId` y `cursor` para paginación. El perfil carga la primera página desde el server, y el cliente usa "cargar más" para páginas subsecuentes.

**Tech Stack:** Next.js 15 App Router, Prisma, TypeScript, Vitest

---

## File Map

- Create: `src/app/api/profile/history/route.ts`
- Create: `src/__tests__/api/profile-history.test.ts`
- Modify: `src/types/domain.ts` — agregar `PredictionHistoryItem`
- Modify: `src/app/(main)/profile/profile-screen.tsx` — reemplazar historial estático
- Modify: `src/app/(main)/profile/page.tsx` — cargar historial real del servidor

---

### Task 1: Agregar `PredictionHistoryItem` a domain.ts

**Files:**
- Modify: `src/types/domain.ts`

- [ ] **Step 1: Agregar el tipo al final del archivo**

```typescript
export interface PredictionHistoryItem {
  matchId: string
  kickoffAt: string
  stage: string
  home: Team
  away: Team
  result: [number, number] | null
  prediction: [number, number] | null
  pts: number
  scoreLog: {
    winner: number
    goalsHome: number
    goalsAway: number
    diff: number
    streakBonus: number
  } | null
}
```

- [ ] **Step 2: Commit**

```bash
git add src/types/domain.ts
git commit -m "feat(types): add PredictionHistoryItem domain type"
```

---

### Task 2: Crear el endpoint `GET /api/profile/history`

**Files:**
- Create: `src/app/api/profile/history/route.ts`

- [ ] **Step 1: Crear el archivo**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'
import type { PredictionHistoryItem } from '@/types/domain'

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const leagueId = searchParams.get('leagueId')
  const cursor = searchParams.get('cursor') ?? undefined
  const limit = Math.min(Number(searchParams.get('limit') ?? '10'), 30)

  const userId = session.user.id

  const predictions = await prisma.prediction.findMany({
    where: { userId },
    orderBy: { savedAt: 'desc' },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: {
      match: true,
    },
  })

  const hasMore = predictions.length > limit
  const items = predictions.slice(0, limit)

  const scoreLogs = leagueId
    ? await prisma.scoreLog.findMany({
        where: {
          score: { userId, leagueId },
          matchId: { in: items.map(p => p.matchId) },
        },
      })
    : []

  const scoreLogMap = new Map(scoreLogs.map(l => [l.matchId, l]))

  const history: PredictionHistoryItem[] = items.map(p => {
    const m = p.match
    const log = scoreLogMap.get(p.matchId)
    const detail = log?.detail as Record<string, number> | null

    return {
      matchId: p.matchId,
      kickoffAt: m.kickoffAt.toISOString(),
      stage: m.stage,
      home: { code: m.homeTeamCode, name: m.homeTeamName, c1: m.homeTeamC1, c2: m.homeTeamC2 },
      away: { code: m.awayTeamCode, name: m.awayTeamName, c1: m.awayTeamC1, c2: m.awayTeamC2 },
      result: m.homeScore !== null && m.awayScore !== null ? [m.homeScore, m.awayScore] : null,
      prediction: [p.homeScore, p.awayScore],
      pts: log?.pts ?? 0,
      scoreLog: detail
        ? {
            winner: detail.winner ?? 0,
            goalsHome: detail.goalsHome ?? 0,
            goalsAway: detail.goalsAway ?? 0,
            diff: detail.diff ?? 0,
            streakBonus: detail.streakBonus ?? 0,
          }
        : null,
    }
  })

  const nextCursor = hasMore ? items[items.length - 1].id : null

  return NextResponse.json({ history, nextCursor, hasMore })
}
```

- [ ] **Step 2: Verificar tipos**

```
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/app/api/profile/history/route.ts
git commit -m "feat(api): add GET /api/profile/history with pagination and score log"
```

---

### Task 3: Crear `PredictionHistoryList` client component

**Files:**
- Create: `src/app/(main)/profile/prediction-history-list.tsx`

- [ ] **Step 1: Crear el componente**

```typescript
'use client'

import { useState } from 'react'
import { TeamFlag } from '@/components/ui/team-flag'
import type { PredictionHistoryItem } from '@/types/domain'

type ResultKind = 'exact' | 'diff' | 'winner' | 'miss'

function classifyItem(item: PredictionHistoryItem): ResultKind | null {
  if (!item.result || !item.scoreLog) return null
  const log = item.scoreLog
  if (log.goalsHome > 0 && log.goalsAway > 0) return 'exact'
  if (log.diff > 0) return 'diff'
  if (log.winner > 0) return 'winner'
  return 'miss'
}

const RESULT_CONFIG: Record<ResultKind, { label: string; color: string; bg: string }> = {
  exact: { label: 'EXACTO', color: 'var(--warn)', bg: 'rgba(255,214,10,0.15)' },
  diff: { label: 'DIFERENCIA', color: 'var(--signal)', bg: 'rgba(0,210,106,0.12)' },
  winner: { label: 'GANADOR', color: 'var(--fg-dim)', bg: 'rgba(255,255,255,0.06)' },
  miss: { label: 'MISS', color: 'var(--fg-faint)', bg: 'rgba(255,255,255,0.03)' },
}

interface Props {
  initialItems: PredictionHistoryItem[]
  initialNextCursor: string | null
  leagueId?: string
}

export function PredictionHistoryList({ initialItems, initialNextCursor, leagueId }: Props) {
  const [items, setItems] = useState(initialItems)
  const [cursor, setCursor] = useState(initialNextCursor)
  const [loadingMore, setLoadingMore] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  async function loadMore() {
    if (!cursor) return
    setLoadingMore(true)
    const params = new URLSearchParams({ cursor, limit: '10' })
    if (leagueId) params.set('leagueId', leagueId)
    const res = await fetch(`/api/profile/history?${params}`)
    const data = await res.json()
    setItems(prev => [...prev, ...data.history])
    setCursor(data.nextCursor)
    setLoadingMore(false)
  }

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map(item => {
          const kind = classifyItem(item)
          const cfg = kind ? RESULT_CONFIG[kind] : null
          const isExpanded = expandedId === item.matchId
          return (
            <div key={item.matchId}>
              <div
                onClick={() => setExpandedId(isExpanded ? null : item.matchId)}
                className="card"
                style={{ padding: 12, display: 'flex', alignItems: 'center', gap: 10, cursor: item.scoreLog ? 'pointer' : 'default' }}
              >
                <div style={{ display: 'flex', gap: 4 }}>
                  <TeamFlag team={item.home} size="xs" />
                  <TeamFlag team={item.away} size="xs" />
                </div>
                <div style={{ flex: 1 }}>
                  <div className="t-h3" style={{ fontSize: 13 }}>
                    {item.home.code} {item.result ? `${item.result[0]}–${item.result[1]}` : 'vs'} {item.away.code}
                  </div>
                  <div className="t-meta">
                    TU: {item.prediction ? `${item.prediction[0]}–${item.prediction[1]}` : '—'} · {item.stage}
                  </div>
                </div>
                {cfg && (
                  <span style={{ padding: '3px 8px', borderRadius: 6, background: cfg.bg, color: cfg.color, fontFamily: 'var(--font-jetbrains, monospace)', fontSize: 9, letterSpacing: '0.12em', fontWeight: 700, whiteSpace: 'nowrap' }}>
                    {cfg.label}
                  </span>
                )}
                <div style={{ fontFamily: 'var(--font-inter, sans-serif)', fontWeight: 900, fontSize: 18, color: item.pts > 3 ? 'var(--signal)' : item.pts > 0 ? 'var(--warn)' : 'var(--fg-faint)', minWidth: 28, textAlign: 'right' }}>
                  {item.pts > 0 ? `+${item.pts}` : '0'}
                </div>
              </div>

              {isExpanded && item.scoreLog && (
                <div style={{ margin: '2px 0 6px', padding: '10px 14px', background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: '0 0 10px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {[
                    ['Ganador/Empate', item.scoreLog.winner],
                    ['Goles local', item.scoreLog.goalsHome],
                    ['Goles visitante', item.scoreLog.goalsAway],
                    ['Diferencia', item.scoreLog.diff],
                    ['Bonus racha', item.scoreLog.streakBonus],
                  ].map(([label, pts]) => (
                    <div key={String(label)} style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span className="t-meta" style={{ textTransform: 'none' }}>{label}</span>
                      <span style={{ fontFamily: 'var(--font-inter, sans-serif)', fontWeight: 800, fontSize: 13, color: Number(pts) > 0 ? 'var(--signal)' : 'var(--fg-faint)' }}>
                        {Number(pts) > 0 ? `+${pts}` : '0'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}

        {items.length === 0 && (
          <p style={{ color: 'var(--fg-mute)', textAlign: 'center', padding: 32 }}>
            Aún no hay predicciones registradas.
          </p>
        )}
      </div>

      {cursor && (
        <button
          onClick={loadMore}
          disabled={loadingMore}
          style={{ width: '100%', padding: '10px', marginTop: 12, borderRadius: 10, background: 'transparent', border: '1px solid var(--line)', color: 'var(--fg-dim)', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
        >
          {loadingMore ? 'Cargando...' : 'VER MÁS'}
        </button>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/(main)/profile/prediction-history-list.tsx
git commit -m "feat(ui): add PredictionHistoryList with expandable score log"
```

---

### Task 4: Conectar historial real en `profile/page.tsx`

**Files:**
- Modify: `src/app/(main)/profile/page.tsx`

- [ ] **Step 1: Leer el archivo actual**

Leer `src/app/(main)/profile/page.tsx` para entender la estructura del server component.

- [ ] **Step 2: Agregar la carga del historial real**

En el server component, agregar:

```typescript
import { PredictionHistoryList } from './prediction-history-list'

// Dentro de la función, obtener leagueId del contexto de sesión o params
const historyParams = new URLSearchParams({ limit: '10' })
if (leagueId) historyParams.set('leagueId', leagueId)

const historyRes = await fetch(
  `${process.env.NEXT_PUBLIC_APP_URL}/api/profile/history?${historyParams}`,
  { headers: { cookie: cookieHeader }, cache: 'no-store' }
).then(r => r.json())

const initialHistory = historyRes.history ?? []
const initialNextCursor = historyRes.nextCursor ?? null
```

- [ ] **Step 3: Reemplazar sección de historial en ProfileScreen**

En el JSX del page, en lugar de pasar `finishedMatches` al `ProfileScreen`, agregar el `PredictionHistoryList` directamente en la sección de historial:

```tsx
<div style={{ padding: '20px var(--gutter) 0' }}>
  <div className="section-head" style={{ padding: 0 }}>
    <div className="num">HISTÓRICO</div>
    <div className="title">ÚLTIMAS PREDICCIONES</div>
  </div>
  <div style={{ marginTop: 12 }}>
    <PredictionHistoryList
      initialItems={initialHistory}
      initialNextCursor={initialNextCursor}
      leagueId={leagueId}
    />
  </div>
</div>
```

- [ ] **Step 4: Verificar tipos**

```
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add src/app/(main)/profile/page.tsx src/app/(main)/profile/prediction-history-list.tsx
git commit -m "feat(profile): replace static match history with real paginated prediction history"
```
