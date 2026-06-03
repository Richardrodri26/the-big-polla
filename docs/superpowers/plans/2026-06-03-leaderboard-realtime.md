# Leaderboard Real-Time — Polling Automático

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Actualizar el leaderboard automáticamente cada 30 segundos sin que el usuario tenga que recargar la página.

**Architecture:** Polling con `setInterval` en un hook `useLeaderboardPolling`. Se agrega un endpoint `GET /api/leagues/[id]/leaderboard` que retorna `Member[]`. El `LeaderboardScreen` ya existente pasa a ser controlado por el hook en vez de recibir datos estáticos del servidor.

**Tech Stack:** Next.js 15 App Router, Prisma, TypeScript, Vitest

---

## File Map

- Create: `src/app/api/leagues/[id]/leaderboard/route.ts`
- Create: `src/hooks/use-leaderboard-polling.ts`
- Modify: `src/app/(main)/leaderboard/page.tsx` — pasar leagueId y usar hook

---

### Task 1: Crear `GET /api/leagues/[id]/leaderboard`

**Files:**
- Create: `src/app/api/leagues/[id]/leaderboard/route.ts`

- [ ] **Step 1: Crear el endpoint**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { PrismaLeagueRepository } from '@/repositories/prisma/league.repository'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: leagueId } = await params
  const repo = new PrismaLeagueRepository(session.user.id)
  const members = await repo.getLeaderboard(leagueId)

  return NextResponse.json({ members, updatedAt: new Date().toISOString() })
}
```

- [ ] **Step 2: Verificar que no hay errores TypeScript**

```
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/app/api/leagues/[id]/leaderboard/route.ts
git commit -m "feat(api): add GET /api/leagues/[id]/leaderboard endpoint"
```

---

### Task 2: Crear `useLeaderboardPolling` hook

**Files:**
- Create: `src/hooks/use-leaderboard-polling.ts`

- [ ] **Step 1: Escribir tests del hook**

Crear `src/__tests__/hooks/use-leaderboard-polling.test.ts`:

```typescript
import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useLeaderboardPolling } from '@/hooks/use-leaderboard-polling'

const mockMembers = [
  { id: 'u1', name: 'Alice', handle: 'alice', color: '#fff', rank: 1, prevRank: 1, pts: 100, hits: 10, streak: 2, breakdown: { exact: 2, diff: 4, winner: 4, streakBonus: 5, comboBonus: 0, oraclePartial: 0 } },
]

describe('useLeaderboardPolling', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ members: mockMembers, updatedAt: '2026-06-03T12:00:00Z' }),
    } as any)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('fetches initial members on mount', async () => {
    const { result } = renderHook(() => useLeaderboardPolling('league-1', 30_000))
    await waitFor(() => expect(result.current.members).toHaveLength(1))
    expect(result.current.members[0].name).toBe('Alice')
  })

  it('polls again after interval', async () => {
    renderHook(() => useLeaderboardPolling('league-1', 30_000))
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1))

    act(() => { vi.advanceTimersByTime(30_000) })
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2))
  })

  it('returns loading true while initial fetch is pending', async () => {
    let resolveFetch!: () => void
    global.fetch = vi.fn().mockReturnValue(new Promise(resolve => {
      resolveFetch = () => resolve({ ok: true, json: async () => ({ members: [], updatedAt: '' }) } as any)
    }))

    const { result } = renderHook(() => useLeaderboardPolling('league-1', 30_000))
    expect(result.current.loading).toBe(true)
    act(() => resolveFetch())
    await waitFor(() => expect(result.current.loading).toBe(false))
  })
})
```

- [ ] **Step 2: Correr tests para verificar que fallan**

```
npx vitest run src/__tests__/hooks/use-leaderboard-polling.test.ts
```

Expected: FAIL — module not found

- [ ] **Step 3: Implementar el hook**

Crear `src/hooks/use-leaderboard-polling.ts`:

```typescript
import { useState, useEffect, useRef, useCallback } from 'react'
import type { Member } from '@/types/domain'

interface LeaderboardState {
  members: Member[]
  updatedAt: string | null
  loading: boolean
  error: string | null
}

export function useLeaderboardPolling(leagueId: string, intervalMs = 30_000): LeaderboardState {
  const [state, setState] = useState<LeaderboardState>({
    members: [],
    updatedAt: null,
    loading: true,
    error: null,
  })
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchLeaderboard = useCallback(async () => {
    try {
      const res = await fetch(`/api/leagues/${leagueId}/leaderboard`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setState({ members: data.members, updatedAt: data.updatedAt, loading: false, error: null })
    } catch (err) {
      setState(prev => ({ ...prev, loading: false, error: String(err) }))
    }
  }, [leagueId])

  useEffect(() => {
    fetchLeaderboard()
    intervalRef.current = setInterval(fetchLeaderboard, intervalMs)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [fetchLeaderboard, intervalMs])

  return state
}
```

- [ ] **Step 4: Correr tests para verificar que pasan**

```
npx vitest run src/__tests__/hooks/use-leaderboard-polling.test.ts
```

Expected: PASS — 3 tests passing

- [ ] **Step 5: Commit**

```bash
git add src/hooks/use-leaderboard-polling.ts src/__tests__/hooks/use-leaderboard-polling.test.ts
git commit -m "feat(hook): add useLeaderboardPolling with 30s interval"
```

---

### Task 3: Conectar el hook al leaderboard page

**Files:**
- Modify: `src/app/(main)/leaderboard/page.tsx`

- [ ] **Step 1: Leer el archivo actual**

Leer `src/app/(main)/leaderboard/page.tsx` para ver cómo se obtiene el `leagueId` y cómo se pasan los datos al `LeaderboardScreen`.

- [ ] **Step 2: Crear un client wrapper que use el hook**

Crear `src/app/(main)/leaderboard/leaderboard-client.tsx`:

```typescript
'use client'

import { useLeaderboardPolling } from '@/hooks/use-leaderboard-polling'
import { LeaderboardScreen } from './leaderboard-screen'
import type { ScoringRules } from '@/types/domain'

interface Props {
  leagueId: string
  initialMembers: import('@/types/domain').Member[]
  scoringRules: ScoringRules
}

export function LeaderboardClient({ leagueId, initialMembers, scoringRules }: Props) {
  const { members, updatedAt, loading } = useLeaderboardPolling(leagueId)

  const displayMembers = members.length > 0 ? members : initialMembers

  return (
    <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {loading && members.length === 0 && (
        <div style={{ position: 'absolute', top: 8, right: 16, fontSize: 10, color: 'var(--fg-mute)', zIndex: 10 }}>
          Actualizando...
        </div>
      )}
      {updatedAt && (
        <div style={{ position: 'absolute', top: 8, right: 16, fontSize: 9, color: 'var(--fg-faint)', fontFamily: 'var(--font-jetbrains, monospace)', letterSpacing: '0.06em', zIndex: 10 }}>
          ACT. {new Date(updatedAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
        </div>
      )}
      <LeaderboardScreen members={displayMembers} scoringRules={scoringRules} />
    </div>
  )
}
```

- [ ] **Step 3: Modificar `page.tsx` para usar `LeaderboardClient`**

En `src/app/(main)/leaderboard/page.tsx`, importar y usar `LeaderboardClient` en vez de `LeaderboardScreen` directamente:

```typescript
import { LeaderboardClient } from './leaderboard-client'

// En el return del server component:
return (
  <LeaderboardClient
    leagueId={leagueId}
    initialMembers={members}
    scoringRules={scoringRules}
  />
)
```

- [ ] **Step 4: Verificar tipos**

```
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add src/app/(main)/leaderboard/leaderboard-client.tsx src/app/(main)/leaderboard/page.tsx
git commit -m "feat(ui): add real-time polling to leaderboard (30s interval)"
```
