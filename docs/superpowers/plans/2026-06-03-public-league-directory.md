# Public League Directory — Directorio de Ligas Públicas

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mostrar un directorio paginado y buscable de todas las ligas públicas para que cualquier usuario autenticado pueda descubrirlas y unirse.

**Architecture:** Nuevo endpoint `GET /api/leagues/directory` con parámetros `search`, `page`, y `limit`. Nueva pantalla `/leagues/browse` con input de búsqueda debounced y paginación de carga incremental (load more).

**Tech Stack:** Next.js 15 App Router, Prisma, TypeScript, Vitest

---

## File Map

- Modify: `src/repositories/interfaces/index.ts` — agregar `getPublicLeagues` a `ILeagueManagementRepository`
- Modify: `src/repositories/prisma/league-management.repository.ts` — implementar `getPublicLeagues`
- Create: `src/app/api/leagues/directory/route.ts`
- Create: `src/app/(main)/leagues/browse/page.tsx`
- Create: `src/app/(main)/leagues/browse/browse-screen.tsx`
- Modify: `src/app/(main)/leagues/leagues-screen.tsx` — agregar link al directorio

---

### Task 1: Agregar `getPublicLeagues` a la interfaz y repositorio

**Files:**
- Modify: `src/repositories/interfaces/index.ts`
- Modify: `src/repositories/prisma/league-management.repository.ts`

- [ ] **Step 1: Agregar método a la interfaz**

En `src/repositories/interfaces/index.ts`, dentro de `ILeagueManagementRepository`, agregar:

```typescript
getPublicLeagues(opts: {
  search?: string
  page?: number
  limit?: number
}): Promise<{ leagues: League[]; total: number; hasMore: boolean }>
```

- [ ] **Step 2: Escribir el test primero**

Agregar en `src/__tests__/repositories/league-management.test.ts` (o crear si no existe para este método):

```typescript
describe('getPublicLeagues', () => {
  it('returns only PUBLIC leagues', async () => {
    vi.mocked(prisma.league.findMany).mockResolvedValue([
      { id: 'lg-1', name: 'Liga Pública', ownerId: 'u1', type: 'PUBLIC', createdAt: new Date(), updatedAt: new Date(), _count: { members: 5 } },
    ] as any)
    vi.mocked(prisma.league.count).mockResolvedValue(1)

    const repo = new PrismaLeagueManagementRepository()
    const result = await repo.getPublicLeagues({})

    expect(result.total).toBe(1)
    expect(result.leagues[0].type).toBe('PUBLIC')
    expect(result.hasMore).toBe(false)
  })

  it('filters by search term case-insensitively', async () => {
    vi.mocked(prisma.league.findMany).mockResolvedValue([])
    vi.mocked(prisma.league.count).mockResolvedValue(0)

    const repo = new PrismaLeagueManagementRepository()
    await repo.getPublicLeagues({ search: 'fútbol' })

    expect(prisma.league.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          type: 'PUBLIC',
          name: { contains: 'fútbol', mode: 'insensitive' },
        }),
      })
    )
  })
})
```

Asegurarse de que `prisma.league.findMany` y `prisma.league.count` estén en el `vi.mock` del archivo.

- [ ] **Step 3: Correr el test para verificar que falla**

```
npx vitest run src/__tests__/repositories/league-management.test.ts
```

Expected: FAIL — `getPublicLeagues is not a function`

- [ ] **Step 4: Implementar `getPublicLeagues` en el repositorio**

En `src/repositories/prisma/league-management.repository.ts`, agregar el método a la clase `PrismaLeagueManagementRepository`:

```typescript
async getPublicLeagues(opts: {
  search?: string
  page?: number
  limit?: number
}): Promise<{ leagues: League[]; total: number; hasMore: boolean }> {
  const { search, page = 1, limit = 20 } = opts
  const skip = (page - 1) * limit

  const where = {
    type: 'PUBLIC' as const,
    ...(search ? { name: { contains: search, mode: 'insensitive' as const } } : {}),
  }

  const [rows, total] = await Promise.all([
    prisma.league.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { members: true } } },
    }),
    prisma.league.count({ where }),
  ])

  const leagues: League[] = rows.map(r => ({
    id: r.id,
    name: r.name,
    ownerId: r.ownerId,
    type: r.type,
    createdAt: r.createdAt.toISOString(),
    memberCount: (r as any)._count.members,
  }))

  return { leagues, total, hasMore: skip + rows.length < total }
}
```

- [ ] **Step 5: Correr tests**

```
npx vitest run src/__tests__/repositories/league-management.test.ts
```

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/repositories/interfaces/index.ts src/repositories/prisma/league-management.repository.ts src/__tests__/repositories/league-management.test.ts
git commit -m "feat(repo): add getPublicLeagues with pagination and search"
```

---

### Task 2: Crear `GET /api/leagues/directory`

**Files:**
- Create: `src/app/api/leagues/directory/route.ts`

- [ ] **Step 1: Crear el archivo**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { PrismaLeagueManagementRepository } from '@/repositories/prisma/league-management.repository'

const repo = new PrismaLeagueManagementRepository()

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') ?? undefined
  const page = Number(searchParams.get('page') ?? '1')
  const limit = Math.min(Number(searchParams.get('limit') ?? '20'), 50)

  const result = await repo.getPublicLeagues({ search, page, limit })
  return NextResponse.json(result)
}
```

- [ ] **Step 2: Verificar tipos**

```
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/app/api/leagues/directory/route.ts
git commit -m "feat(api): add GET /api/leagues/directory with search and pagination"
```

---

### Task 3: Crear BrowseScreen

**Files:**
- Create: `src/app/(main)/leagues/browse/browse-screen.tsx`

- [ ] **Step 1: Crear el componente**

```typescript
// src/app/(main)/leagues/browse/browse-screen.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import type { League } from '@/types/domain'

interface BrowseScreenProps {
  initialLeagues: League[]
  initialTotal: number
}

export function BrowseScreen({ initialLeagues, initialTotal }: BrowseScreenProps) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [leagues, setLeagues] = useState(initialLeagues)
  const [total, setTotal] = useState(initialTotal)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [joiningId, setJoiningId] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  async function fetchLeagues(q: string, p: number, append = false) {
    setLoading(true)
    const params = new URLSearchParams({ page: String(p), limit: '20' })
    if (q) params.set('search', q)
    const res = await fetch(`/api/leagues/directory?${params}`)
    const data = await res.json()
    setLeagues(prev => append ? [...prev, ...data.leagues] : data.leagues)
    setTotal(data.total)
    setLoading(false)
  }

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setPage(1)
      fetchLeagues(search, 1)
    }, 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [search])

  async function handleLoadMore() {
    const nextPage = page + 1
    setPage(nextPage)
    await fetchLeagues(search, nextPage, true)
  }

  async function handleJoin(leagueId: string) {
    setJoiningId(leagueId)
    await fetch(`/api/leagues/${leagueId}/join`, { method: 'POST' })
    setJoiningId(null)
    router.push(`/leagues/${leagueId}`)
  }

  const hasMore = leagues.length < total

  return (
    <div className="screen screen-anim">
      <div className="topbar">
        <div style={{ width: 36 }} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <div className="topbar-meta">LIGAS PÚBLICAS</div>
          <div className="topbar-title">DIRECTORIO</div>
        </div>
        <div style={{ width: 36 }} />
      </div>

      <div style={{ padding: '12px 20px' }}>
        <input
          type="text"
          placeholder="Buscar liga..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: '100%', padding: '12px 16px', borderRadius: 10,
            background: 'var(--surface)', border: '1px solid var(--line)',
            color: 'var(--fg)', fontFamily: 'var(--font-inter, sans-serif)',
            fontSize: 14, outline: 'none', boxSizing: 'border-box',
          }}
        />
      </div>

      <div className="scroll" style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ padding: '0 20px' }}>
          <div className="t-meta" style={{ marginBottom: 12 }}>{total} ligas encontradas</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {leagues.map(league => (
              <div key={league.id} style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
                background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12,
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'var(--font-inter, sans-serif)', fontWeight: 800, fontSize: 15 }}>
                    {league.name}
                  </div>
                  <div className="t-meta" style={{ marginTop: 2 }}>{league.memberCount} miembros</div>
                </div>
                <button
                  onClick={() => handleJoin(league.id)}
                  disabled={joiningId === league.id}
                  style={{
                    padding: '8px 16px', borderRadius: 8, background: 'var(--fg)', color: '#04130A',
                    border: 'none', fontWeight: 800, fontSize: 12, cursor: 'pointer', flexShrink: 0,
                  }}
                >
                  {joiningId === league.id ? '...' : 'UNIRSE'}
                </button>
              </div>
            ))}

            {leagues.length === 0 && !loading && (
              <p style={{ color: 'var(--fg-mute)', textAlign: 'center', padding: 40 }}>
                No se encontraron ligas públicas.
              </p>
            )}
          </div>

          {hasMore && (
            <button
              onClick={handleLoadMore}
              disabled={loading}
              style={{
                width: '100%', padding: '12px', marginTop: 16, borderRadius: 10,
                background: 'transparent', border: '1px solid var(--line)',
                color: 'var(--fg-dim)', fontWeight: 700, fontSize: 13, cursor: 'pointer',
              }}
            >
              {loading ? 'Cargando...' : 'VER MÁS'}
            </button>
          )}
        </div>
        <div style={{ height: 90 }} />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/(main)/leagues/browse/browse-screen.tsx
git commit -m "feat(ui): add BrowseScreen for public league directory"
```

---

### Task 4: Crear page.tsx del directorio

**Files:**
- Create: `src/app/(main)/leagues/browse/page.tsx`

- [ ] **Step 1: Crear el server component**

```typescript
import { BrowseScreen } from './browse-screen'

export default async function BrowsePage() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/leagues/directory?limit=20`, {
    cache: 'no-store',
  })
  const data = await res.json()

  return <BrowseScreen initialLeagues={data.leagues ?? []} initialTotal={data.total ?? 0} />
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/(main)/leagues/browse/page.tsx
git commit -m "feat(ui): add browse page for public leagues"
```

---

### Task 5: Agregar link al directorio desde LeaguesScreen

**Files:**
- Modify: `src/app/(main)/leagues/leagues-screen.tsx`

- [ ] **Step 1: Leer el archivo para ver la estructura actual**

Leer `src/app/(main)/leagues/leagues-screen.tsx`.

- [ ] **Step 2: Agregar el link al directorio**

En la sección del header o junto al botón de crear liga, agregar:

```tsx
import Link from 'next/link'

// Dentro del JSX, agregar un link al directorio
<Link
  href="/leagues/browse"
  style={{
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '10px 16px', borderRadius: 10,
    border: '1px solid var(--line)', color: 'var(--fg-dim)',
    fontFamily: 'var(--font-inter, sans-serif)', fontWeight: 700,
    fontSize: 13, textDecoration: 'none',
  }}
>
  🌐 Explorar ligas públicas
</Link>
```

- [ ] **Step 3: Verificar tipos y commit**

```
npx tsc --noEmit
```

Expected: no errors

```bash
git add src/app/(main)/leagues/leagues-screen.tsx
git commit -m "feat(ui): add link to public league directory from leagues screen"
```
