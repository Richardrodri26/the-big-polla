# Match Engine & Scoring Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implementar el motor de puntuación completo — cálculo automático de puntos por partido según SPEC.md (resultado, goles por equipo, diferencia de goles, bonos de racha), generación de ScoreLog para trazabilidad, y sincronización periódica de partidos desde una API externa.

**Architecture:** El motor de puntuación es una función pura `calculatePoints(prediction, result, stage)` que no toca la DB — testeable en aislamiento. Un service `ScoringService` orquesta la transacción completa: calcular puntos, escribir ScoreLog, actualizar Score acumulado, recalcular rachas y rankings. La sincronización de partidos es un API route `/api/cron/sync-matches` que puede ser llamado por un cron job externo (Vercel Cron, GitHub Actions, etc.).

**Tech Stack:** Prisma 7 + PostgreSQL, Vitest 4, Next.js 16 App Router, TypeScript 5.9

---

## Contexto del negocio (SPEC.md)

### Tabla de puntos

| Criterio | Fase de grupos | Eliminación directa |
|---|---|---|
| Resultado correcto (ganador / empate) | 5 pts | 10 pts |
| Goles exactos por equipo | 2 pts cada uno (máx 4) | 4 pts cada uno (máx 8) |
| Diferencia de goles exacta | 1 pt | 2 pts |

### Bono de racha
- Cada 3 aciertos consecutivos (de cualquier tipo) → **+5 pts extra**
- Un "acierto" es cualquier predicción que sumó al menos 1 punto

### Reglas de bloqueo
- Las predicciones se bloquean cuando `Match.state` pasa a `LIVE`
- El campo `Match.locked` se debe setear a `true` al cambiar el estado a `LIVE`

### Stage de eliminación directa
El campo `Match.stage` contendrá strings como `"Octavos"`, `"Cuartos"`, `"Semifinal"`, `"Final"`. Todo lo que no sea `"Grupo X"` se considera eliminación directa.

---

## Task 1: Motor de puntuación — función pura

**Files:**
- Create: `src/lib/scoring.ts`
- Create: `src/__tests__/lib/scoring.test.ts`

> TDD estricto. Escribí el test primero, verificá que falla, luego implementá.

- [ ] Crear `src/__tests__/lib/scoring.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { calculatePoints, isEliminationStage } from '@/lib/scoring'

describe('isEliminationStage', () => {
  it('returns false for group stages', () => {
    expect(isEliminationStage('Grupo A')).toBe(false)
    expect(isEliminationStage('Grupo H')).toBe(false)
  })

  it('returns true for knockout stages', () => {
    expect(isEliminationStage('Octavos')).toBe(true)
    expect(isEliminationStage('Cuartos')).toBe(true)
    expect(isEliminationStage('Semifinal')).toBe(true)
    expect(isEliminationStage('Final')).toBe(true)
  })
})

describe('calculatePoints', () => {
  // ── Fase de grupos ──────────────────────────────────────────────────────
  describe('group stage', () => {
    it('awards 5 pts for correct winner prediction', () => {
      const pts = calculatePoints({ home: 2, away: 0 }, { home: 3, away: 1 }, 'Grupo A')
      expect(pts.winner).toBe(5)
      expect(pts.goalsHome).toBe(0)
      expect(pts.goalsAway).toBe(0)
      expect(pts.diff).toBe(0)
      expect(pts.total).toBe(5)
    })

    it('awards 5 pts for correct draw prediction', () => {
      const pts = calculatePoints({ home: 1, away: 1 }, { home: 2, away: 2 }, 'Grupo B')
      expect(pts.winner).toBe(5)
      expect(pts.total).toBe(5)
    })

    it('awards 0 pts for wrong winner', () => {
      const pts = calculatePoints({ home: 2, away: 0 }, { home: 0, away: 1 }, 'Grupo A')
      expect(pts.winner).toBe(0)
      expect(pts.total).toBe(0)
    })

    it('awards 2 pts per exact goal scored', () => {
      const pts = calculatePoints({ home: 2, away: 1 }, { home: 2, away: 1 }, 'Grupo A')
      expect(pts.winner).toBe(5)
      expect(pts.goalsHome).toBe(2)
      expect(pts.goalsAway).toBe(2)
      expect(pts.diff).toBe(1)
      expect(pts.total).toBe(10) // 5 + 2 + 2 + 1
    })

    it('awards 2 pts for only home goals exact', () => {
      const pts = calculatePoints({ home: 2, away: 3 }, { home: 2, away: 1 }, 'Grupo A')
      expect(pts.goalsHome).toBe(2)
      expect(pts.goalsAway).toBe(0)
    })

    it('awards 1 pt for exact goal difference', () => {
      const pts = calculatePoints({ home: 3, away: 1 }, { home: 2, away: 0 }, 'Grupo C')
      expect(pts.winner).toBe(5)
      expect(pts.diff).toBe(1)
      expect(pts.goalsHome).toBe(0)
      expect(pts.goalsAway).toBe(0)
      expect(pts.total).toBe(6)
    })

    it('awards 0 diff pts when goal difference differs', () => {
      const pts = calculatePoints({ home: 3, away: 0 }, { home: 2, away: 0 }, 'Grupo A')
      expect(pts.diff).toBe(0)
    })
  })

  // ── Eliminación directa ──────────────────────────────────────────────────
  describe('knockout stage', () => {
    it('doubles all base points in knockout stage', () => {
      // Exact score prediction in knockout
      const pts = calculatePoints({ home: 2, away: 1 }, { home: 2, away: 1 }, 'Cuartos')
      expect(pts.winner).toBe(10)
      expect(pts.goalsHome).toBe(4)
      expect(pts.goalsAway).toBe(4)
      expect(pts.diff).toBe(2)
      expect(pts.total).toBe(20)
    })

    it('awards 10 pts for correct winner in knockout', () => {
      const pts = calculatePoints({ home: 1, away: 0 }, { home: 2, away: 0 }, 'Semifinal')
      expect(pts.winner).toBe(10)
      expect(pts.total).toBe(10)
    })
  })

  // ── Edge cases ────────────────────────────────────────────────────────────
  describe('edge cases', () => {
    it('returns zero total when no points earned', () => {
      const pts = calculatePoints({ home: 0, away: 0 }, { home: 1, away: 0 }, 'Grupo A')
      expect(pts.total).toBe(0)
    })

    it('correctly identifies 0-0 draw as draw result', () => {
      const pts = calculatePoints({ home: 0, away: 0 }, { home: 0, away: 0 }, 'Grupo A')
      expect(pts.winner).toBe(5)
      expect(pts.goalsHome).toBe(2)
      expect(pts.goalsAway).toBe(2)
      expect(pts.diff).toBe(1)
    })
  })
})
```

- [ ] Correr el test para verificar que falla:

```bash
npm test src/__tests__/lib/scoring.test.ts
```

Esperado: `Cannot find module '@/lib/scoring'`.

- [ ] Crear `src/lib/scoring.ts`:

```ts
export interface ScoreBreakdown {
  winner: number      // puntos por resultado correcto
  goalsHome: number   // puntos por goles locales exactos
  goalsAway: number   // puntos por goles visitante exactos
  diff: number        // puntos por diferencia de goles exacta
  total: number
}

export function isEliminationStage(stage: string): boolean {
  return !stage.startsWith('Grupo')
}

export function calculatePoints(
  prediction: { home: number; away: number },
  result: { home: number; away: number },
  stage: string
): ScoreBreakdown {
  const multiplier = isEliminationStage(stage) ? 2 : 1

  const predWinner = Math.sign(prediction.home - prediction.away)
  const realWinner = Math.sign(result.home - result.away)

  const winner = predWinner === realWinner ? 5 * multiplier : 0
  const goalsHome = prediction.home === result.home ? 2 * multiplier : 0
  const goalsAway = prediction.away === result.away ? 2 * multiplier : 0

  const predDiff = prediction.home - prediction.away
  const realDiff = result.home - result.away
  const diff = predDiff === realDiff ? 1 * multiplier : 0

  return {
    winner,
    goalsHome,
    goalsAway,
    diff,
    total: winner + goalsHome + goalsAway + diff,
  }
}
```

- [ ] Correr el test para verificar que pasa:

```bash
npm test src/__tests__/lib/scoring.test.ts
```

Esperado: todos los tests pasan.

- [ ] Commit:

```bash
git add src/lib/scoring.ts "src/__tests__/lib/scoring.test.ts"
git commit -m "feat(scoring): add pure scoring calculator with group/knockout multipliers"
```

---

## Task 2: Función de cálculo de racha

**Files:**
- Modify: `src/lib/scoring.ts`
- Modify: `src/__tests__/lib/scoring.test.ts`

> La racha se calcula sobre un historial ordenado cronológicamente. Un "hit" es cualquier predicción con `total > 0`. Cada 3 hits consecutivos → +5 pts. El bono se aplica exactamente 1 vez por cada múltiplo de 3 alcanzado.

- [ ] Agregar tests de racha al final de `src/__tests__/lib/scoring.test.ts`:

```ts
describe('calculateStreakBonus', () => {
  it('returns 0 when fewer than 3 hits', () => {
    expect(calculateStreakBonus([true, true, false])).toBe(0)
    expect(calculateStreakBonus([true, false, true])).toBe(0)
  })

  it('returns 5 when exactly 3 consecutive hits', () => {
    expect(calculateStreakBonus([true, true, true])).toBe(5)
  })

  it('returns 10 when 6 consecutive hits', () => {
    expect(calculateStreakBonus([true, true, true, true, true, true])).toBe(10)
  })

  it('resets streak on miss', () => {
    expect(calculateStreakBonus([true, true, true, false, true, true, true])).toBe(10)
  })

  it('partial streak after reset does not award bonus', () => {
    expect(calculateStreakBonus([true, true, true, false, true, true])).toBe(5)
  })

  it('returns 0 on empty history', () => {
    expect(calculateStreakBonus([])).toBe(0)
  })
})
```

- [ ] Agregar `calculateStreakBonus` a `src/lib/scoring.ts`:

```ts
/**
 * Calcula el bono de racha sobre un historial de hits/misses ordenado
 * cronológicamente (true = hit, false = miss).
 * Cada 3 hits consecutivos → +5 pts.
 */
export function calculateStreakBonus(hits: boolean[]): number {
  let streakCount = 0
  let bonus = 0

  for (const hit of hits) {
    if (hit) {
      streakCount++
      if (streakCount % 3 === 0) {
        bonus += 5
      }
    } else {
      streakCount = 0
    }
  }

  return bonus
}
```

- [ ] Agregar el import al test:

```ts
import { calculatePoints, calculateStreakBonus, isEliminationStage } from '@/lib/scoring'
```

- [ ] Correr todos los tests de scoring:

```bash
npm test src/__tests__/lib/scoring.test.ts
```

Esperado: todos los tests pasan (incluidos los de Task 1).

- [ ] Commit:

```bash
git add src/lib/scoring.ts "src/__tests__/lib/scoring.test.ts"
git commit -m "feat(scoring): add streak bonus calculator"
```

---

## Task 3: ScoringService — orquestador de transacciones

**Files:**
- Create: `src/lib/scoring-service.ts`
- Create: `src/__tests__/lib/scoring-service.test.ts`

> El `ScoringService` recibe un `matchId` con resultado final, busca todas las predicciones, calcula puntos, escribe ScoreLogs en DB, actualiza el Score acumulado de cada usuario en la liga, y recalcula los rankings. Todo en una transacción Prisma.
>
> **IMPORTANTE:** Para el cálculo de racha, se necesita el historial PREVIO del usuario (predicciones anteriores a este partido). El service debe consultar los últimos ScoreLogs del usuario para determinar su racha actual.

- [ ] Crear `src/__tests__/lib/scoring-service.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ScoringService } from '@/lib/scoring-service'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: vi.fn(),
    match: { findUnique: vi.fn() },
    prediction: { findMany: vi.fn() },
    score: { upsert: vi.fn(), findMany: vi.fn(), update: vi.fn() },
    scoreLog: { create: vi.fn(), findMany: vi.fn() },
    leagueMember: { findMany: vi.fn() },
  },
}))

import { prisma } from '@/lib/prisma'

const mockMatch = {
  id: 'm1',
  state: 'FINAL',
  stage: 'Grupo A',
  homeScore: 2,
  awayScore: 1,
  kickoffAt: new Date('2026-06-15T18:00:00Z'),
}

const mockPrediction = {
  id: 'p1',
  userId: 'user1',
  matchId: 'm1',
  homeScore: 2,
  awayScore: 1,
  savedAt: new Date(),
  updatedAt: new Date(),
  user: { id: 'user1', name: 'Richard', handle: 'richard' },
}

const mockLeagueMember = {
  leagueId: 'league1',
  userId: 'user1',
}

describe('ScoringService', () => {
  let service: ScoringService

  beforeEach(() => {
    service = new ScoringService()
    vi.clearAllMocks()

    // Default: transaction executes the callback inline
    vi.mocked(prisma.$transaction).mockImplementation(async (fn: any) => fn(prisma))
  })

  describe('scoreMatch', () => {
    it('throws if match is not FINAL', async () => {
      vi.mocked(prisma.match.findUnique).mockResolvedValue({
        ...mockMatch,
        state: 'LIVE',
      } as any)

      await expect(service.scoreMatch('m1')).rejects.toThrow('Match m1 is not FINAL')
    })

    it('throws if match result is null', async () => {
      vi.mocked(prisma.match.findUnique).mockResolvedValue({
        ...mockMatch,
        homeScore: null,
        awayScore: null,
      } as any)

      await expect(service.scoreMatch('m1')).rejects.toThrow('Match m1 has no result')
    })

    it('creates scoreLog with correct pts for exact prediction', async () => {
      vi.mocked(prisma.match.findUnique).mockResolvedValue(mockMatch as any)
      vi.mocked(prisma.prediction.findMany).mockResolvedValue([mockPrediction] as any)
      vi.mocked(prisma.leagueMember.findMany).mockResolvedValue([mockLeagueMember] as any)
      vi.mocked(prisma.scoreLog.findMany).mockResolvedValue([])
      vi.mocked(prisma.score.upsert).mockResolvedValue({ id: 's1', pts: 10, hits: 1, streak: 1 } as any)
      vi.mocked(prisma.scoreLog.create).mockResolvedValue({ id: 'sl1' } as any)
      vi.mocked(prisma.score.findMany).mockResolvedValue([])

      await service.scoreMatch('m1')

      expect(prisma.scoreLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            matchId: 'm1',
            pts: 10, // 5 winner + 2 goalsHome + 2 goalsAway + 1 diff
            type: 'match',
          }),
        })
      )
    })

    it('skips users with no prediction for the match', async () => {
      vi.mocked(prisma.match.findUnique).mockResolvedValue(mockMatch as any)
      vi.mocked(prisma.prediction.findMany).mockResolvedValue([])
      vi.mocked(prisma.leagueMember.findMany).mockResolvedValue([mockLeagueMember] as any)
      vi.mocked(prisma.scoreLog.findMany).mockResolvedValue([])
      vi.mocked(prisma.score.findMany).mockResolvedValue([])

      await service.scoreMatch('m1')

      expect(prisma.scoreLog.create).not.toHaveBeenCalled()
    })
  })
})
```

- [ ] Correr el test para verificar que falla:

```bash
npm test src/__tests__/lib/scoring-service.test.ts
```

Esperado: `Cannot find module '@/lib/scoring-service'`.

- [ ] Crear `src/lib/scoring-service.ts`:

```ts
import { prisma } from '@/lib/prisma'
import { calculatePoints, calculateStreakBonus } from '@/lib/scoring'

export class ScoringService {
  async scoreMatch(matchId: string): Promise<void> {
    const match = await prisma.match.findUnique({ where: { id: matchId } })

    if (!match || match.state !== 'FINAL') {
      throw new Error(`Match ${matchId} is not FINAL`)
    }
    if (match.homeScore === null || match.awayScore === null) {
      throw new Error(`Match ${matchId} has no result`)
    }

    const result = { home: match.homeScore, away: match.awayScore }

    await prisma.$transaction(async (tx) => {
      // 1. Obtener todas las predicciones para este partido
      const predictions = await tx.prediction.findMany({
        where: { matchId },
        include: { user: { select: { id: true, name: true, handle: true } } },
      })

      // 2. Obtener todas las ligas que tienen estos usuarios
      const userIds = predictions.map(p => p.userId)
      const memberships = await tx.leagueMember.findMany({
        where: { userId: { in: userIds } },
      })

      // Agrupar memberships por usuario
      const userLeagues = new Map<string, string[]>()
      for (const m of memberships) {
        const existing = userLeagues.get(m.userId) ?? []
        userLeagues.set(m.userId, [...existing, m.leagueId])
      }

      // 3. Calcular puntos para cada predicción
      for (const prediction of predictions) {
        const breakdown = calculatePoints(
          { home: prediction.homeScore, away: prediction.awayScore },
          result,
          match.stage
        )

        const leagueIds = userLeagues.get(prediction.userId) ?? []

        for (const leagueId of leagueIds) {
          // 4. Obtener historial de hits para calcular racha
          const priorLogs = await tx.scoreLog.findMany({
            where: {
              score: { userId: prediction.userId, leagueId },
              matchId: { not: matchId },
            },
            orderBy: { createdAt: 'asc' },
          })

          const hitHistory = priorLogs.map(log => log.pts > 0)
          const currentStreakBonus = calculateStreakBonus([...hitHistory, breakdown.total > 0])

          // Bonus incremental = nuevo valor de racha - valor anterior
          const previousStreakBonus = calculateStreakBonus(hitHistory)
          const streakBonusDelta = currentStreakBonus - previousStreakBonus

          const totalPts = breakdown.total + streakBonusDelta

          // 5. Upsert Score acumulado
          await tx.score.upsert({
            where: { userId_leagueId: { userId: prediction.userId, leagueId } },
            update: {
              pts: { increment: totalPts },
              hits: { increment: breakdown.total > 0 ? 1 : 0 },
              streak: breakdown.total > 0 ? { increment: 1 } : 0,
            },
            create: {
              userId: prediction.userId,
              leagueId,
              pts: totalPts,
              hits: breakdown.total > 0 ? 1 : 0,
              streak: breakdown.total > 0 ? 1 : 0,
              rank: 0,
              prevRank: 0,
              breakdown: {},
            },
          })

          // 6. Crear ScoreLog para trazabilidad
          await tx.scoreLog.create({
            data: {
              score: {
                connect: { userId_leagueId: { userId: prediction.userId, leagueId } },
              },
              matchId,
              pts: totalPts,
              type: streakBonusDelta > 0 ? 'match+streak' : 'match',
              detail: {
                winner: breakdown.winner,
                goalsHome: breakdown.goalsHome,
                goalsAway: breakdown.goalsAway,
                diff: breakdown.diff,
                streakBonus: streakBonusDelta,
                prediction: { home: prediction.homeScore, away: prediction.awayScore },
                result: { home: result.home, away: result.away },
              },
            },
          })
        }
      }

      // 7. Recalcular rankings por liga (ordenar por pts desc)
      const affectedLeagueIds = [...new Set(memberships.map(m => m.leagueId))]
      for (const leagueId of affectedLeagueIds) {
        const scores = await tx.score.findMany({
          where: { leagueId },
          orderBy: { pts: 'desc' },
        })

        for (let i = 0; i < scores.length; i++) {
          await tx.score.update({
            where: { id: scores[i].id },
            data: { prevRank: scores[i].rank, rank: i + 1 },
          })
        }
      }
    })
  }
}
```

- [ ] Correr el test para verificar que pasa:

```bash
npm test src/__tests__/lib/scoring-service.test.ts
```

Esperado: todos los tests pasan.

- [ ] Commit:

```bash
git add src/lib/scoring-service.ts "src/__tests__/lib/scoring-service.test.ts"
git commit -m "feat(scoring): add ScoringService with transaction and rank recalculation"
```

---

## Task 4: API route — disparar puntuación de un partido

**Files:**
- Create: `src/app/api/matches/[id]/score/route.ts`

> Este endpoint recibe una llamada POST con el resultado final del partido, actualiza el estado en DB y dispara el motor de puntuación. Lo llama el cron job (Task 6) o un admin manualmente.
>
> **Seguridad:** El endpoint se protege con un header `Authorization: Bearer <CRON_SECRET>` donde `CRON_SECRET` es una variable de entorno. Nunca exponer este endpoint sin protección.

- [ ] Crear `src/app/api/matches/[id]/score/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ScoringService } from '@/lib/scoring-service'

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const authHeader = req.headers.get('authorization')
  return authHeader === `Bearer ${secret}`
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const body = await req.json() as { homeScore?: number; awayScore?: number; state?: string }

  // Actualizar el partido con el resultado final
  await prisma.match.update({
    where: { id },
    data: {
      state: body.state === 'FINAL' ? 'FINAL' : undefined,
      homeScore: body.homeScore ?? undefined,
      awayScore: body.awayScore ?? undefined,
      locked: true,
    },
  })

  // Disparar el motor de puntuación
  const service = new ScoringService()
  await service.scoreMatch(id)

  return NextResponse.json({ ok: true, matchId: id })
}
```

- [ ] Agregar `CRON_SECRET` a `.env.local`:

```
CRON_SECRET="dev-cron-secret-change-in-production!!"
```

- [ ] Verificar TypeScript:

```bash
npx tsc --noEmit
```

Esperado: sin errores.

- [ ] Commit:

```bash
git add "src/app/api/matches/[id]/score/route.ts"
git commit -m "feat(api): add POST /api/matches/[id]/score endpoint with cron auth"
```

---

## Task 5: API route — bloquear partidos al inicio

**Files:**
- Create: `src/app/api/matches/[id]/lock/route.ts`

> Cuando un partido pasa a `LIVE`, se debe bloquear para que no se puedan modificar predicciones. Este endpoint setea `locked = true` y `state = LIVE`.

- [ ] Crear `src/app/api/matches/[id]/lock/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  return req.headers.get('authorization') === `Bearer ${secret}`
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const body = await req.json() as { liveMinute?: number }

  await prisma.match.update({
    where: { id },
    data: {
      state: 'LIVE',
      locked: true,
      liveMinute: body.liveMinute ?? 0,
    },
  })

  return NextResponse.json({ ok: true, matchId: id })
}
```

- [ ] Commit:

```bash
git add "src/app/api/matches/[id]/lock/route.ts"
git commit -m "feat(api): add POST /api/matches/[id]/lock endpoint"
```

---

## Task 6: API route — sincronización de partidos (cron)

**Files:**
- Create: `src/app/api/cron/sync-matches/route.ts`
- Create: `src/lib/match-sync.ts`

> Este cron job periódico (cada 5 minutos en producción) sincroniza el estado de los partidos desde la API externa. En esta fase, la integración real con la API del Mundial 2026 se deja como un stub que puede completarse cuando la API esté disponible. El foco es la arquitectura del sync.
>
> **Estructura del sync:**
> 1. Consultar la API externa de partidos
> 2. Para cada partido: si el estado cambió a `LIVE` → llamar a `/lock`; si cambió a `FINAL` → llamar a `/score`
> 3. Actualizar datos del partido en DB

- [ ] Crear `src/lib/match-sync.ts`:

```ts
export interface ExternalMatch {
  id: string
  state: 'PENDING' | 'LIVE' | 'FINAL'
  homeScore: number | null
  awayScore: number | null
  liveMinute: number | null
}

/**
 * Stub: reemplazar con la integración real cuando la API del Mundial 2026
 * esté disponible. Devuelve array vacío hasta entonces.
 *
 * API candidata: https://www.football-data.org/v4/competitions/WC/matches
 * Documentación: https://www.football-data.org/documentation/quickstart
 */
export async function fetchExternalMatches(): Promise<ExternalMatch[]> {
  // TODO: implementar cuando la API esté disponible
  // const res = await fetch('https://api.example.com/wc2026/matches', {
  //   headers: { 'X-Auth-Token': process.env.FOOTBALL_API_KEY! }
  // })
  // return res.json()
  return []
}
```

- [ ] Crear `src/app/api/cron/sync-matches/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { fetchExternalMatches } from '@/lib/match-sync'

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  return req.headers.get('authorization') === `Bearer ${secret}`
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const externalMatches = await fetchExternalMatches()

  if (externalMatches.length === 0) {
    return NextResponse.json({ ok: true, synced: 0, message: 'No external data available yet' })
  }

  const results = { locked: 0, scored: 0, updated: 0 }

  for (const ext of externalMatches) {
    const current = await prisma.match.findUnique({ where: { id: ext.id } })
    if (!current) continue

    // Transición PENDING → LIVE: bloquear predicciones
    if (current.state === 'PENDING' && ext.state === 'LIVE') {
      await prisma.match.update({
        where: { id: ext.id },
        data: { state: 'LIVE', locked: true, liveMinute: ext.liveMinute ?? 0 },
      })
      results.locked++
    }

    // Actualizar minuto en vivo
    if (current.state === 'LIVE' && ext.state === 'LIVE' && ext.liveMinute !== null) {
      await prisma.match.update({
        where: { id: ext.id },
        data: { liveMinute: ext.liveMinute },
      })
      results.updated++
    }

    // Transición LIVE → FINAL: actualizar resultado y disparar puntuación
    if (current.state === 'LIVE' && ext.state === 'FINAL') {
      await prisma.match.update({
        where: { id: ext.id },
        data: {
          state: 'FINAL',
          homeScore: ext.homeScore,
          awayScore: ext.awayScore,
          locked: true,
          liveMinute: null,
        },
      })

      // Importar inline para evitar que Next.js lo incluya en el bundle client
      const { ScoringService } = await import('@/lib/scoring-service')
      const service = new ScoringService()
      await service.scoreMatch(ext.id)
      results.scored++
    }
  }

  return NextResponse.json({ ok: true, ...results })
}
```

- [ ] Verificar TypeScript:

```bash
npx tsc --noEmit
```

Esperado: sin errores.

- [ ] Commit:

```bash
git add src/lib/match-sync.ts "src/app/api/cron/sync-matches/route.ts"
git commit -m "feat(cron): add match sync endpoint with external API stub"
```

---

## Task 7: Endpoint de predicciones con validación de bloqueo

**Files:**
- Create: `src/app/api/predictions/route.ts`

> Los usuarios guardan predicciones vía este endpoint. Valida que el partido no esté bloqueado antes de guardar. Requiere sesión activa.

- [ ] Crear `src/app/api/predictions/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json() as { matchId?: string; homeScore?: number; awayScore?: number }

  if (!body.matchId || body.homeScore === undefined || body.awayScore === undefined) {
    return NextResponse.json({ error: 'matchId, homeScore, awayScore are required' }, { status: 400 })
  }

  if (body.homeScore < 0 || body.awayScore < 0 || body.homeScore > 20 || body.awayScore > 20) {
    return NextResponse.json({ error: 'Invalid score values' }, { status: 400 })
  }

  const match = await prisma.match.findUnique({ where: { id: body.matchId } })
  if (!match) {
    return NextResponse.json({ error: 'Match not found' }, { status: 404 })
  }

  if (match.locked) {
    return NextResponse.json({ error: 'Match is locked — predictions are closed' }, { status: 409 })
  }

  const prediction = await prisma.prediction.upsert({
    where: { userId_matchId: { userId: session.user.id, matchId: body.matchId } },
    update: { homeScore: body.homeScore, awayScore: body.awayScore },
    create: {
      userId: session.user.id,
      matchId: body.matchId,
      homeScore: body.homeScore,
      awayScore: body.awayScore,
    },
  })

  return NextResponse.json({ ok: true, prediction })
}

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const matchId = searchParams.get('matchId')

  const predictions = await prisma.prediction.findMany({
    where: {
      userId: session.user.id,
      ...(matchId ? { matchId } : {}),
    },
    orderBy: { savedAt: 'desc' },
  })

  return NextResponse.json({ predictions })
}
```

- [ ] Verificar TypeScript:

```bash
npx tsc --noEmit
```

Esperado: sin errores.

- [ ] Commit:

```bash
git add src/app/api/predictions/route.ts
git commit -m "feat(api): add predictions endpoint with lock validation"
```

---

## Task 8: Activar DATA_SOURCE=api y smoke test manual

**Files:**
- Modify: `.env.local`

- [ ] Cambiar `NEXT_PUBLIC_DATA_SOURCE` en `.env.local`:

```
NEXT_PUBLIC_DATA_SOURCE="api"
```

- [ ] Correr todos los tests para verificar que nada se rompió:

```bash
npm test
```

Esperado: todos los tests pasan.

- [ ] Iniciar el servidor en dev y verificar manualmente:

```bash
npm run dev
```

1. Ir a `http://localhost:3000/feed` — la lista debe estar vacía (DB vacía) sin errores de runtime en consola
2. Registrar un usuario en `http://localhost:3000/register`
3. Verificar que el login funciona y redirige a `/feed`

- [ ] Commit:

```bash
git add .env.local
git commit -m "chore(env): activate api data source"
```

---

## Auto-review

**Spec coverage (SPEC.md):**
- ✅ Puntos por resultado correcto (ganador/empate) con multiplicador por fase
- ✅ Puntos por goles exactos por equipo con multiplicador
- ✅ Puntos por diferencia de goles exacta con multiplicador
- ✅ Bono de racha cada 3 aciertos consecutivos (+5 pts)
- ✅ Bloqueo de predicciones al pasar a LIVE
- ✅ ScoreLog para trazabilidad con breakdown detallado
- ✅ Recálculo de rankings por liga post-partido

**Fuera de scope (intencional):**
- Integración real con API externa del Mundial (stub listo, se completa cuando la API esté disponible)
- Sistema de Oracle/campeón (Fase futura)
- Notificaciones push (Fase futura)
