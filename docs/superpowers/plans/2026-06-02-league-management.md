# League Management Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implementar la gestión completa de ligas — creación, configuración pública/privada, sistema de solicitudes de ingreso, y dashboard de administración para el creador de la liga.

**Architecture:** Las ligas son el contenedor social de la app. El creador (`ownerId`) puede configurarlas como `PUBLIC` (cualquiera puede unirse) o `PRIVATE` (requiere solicitud aprobada). Los endpoints de gestión están protegidos por sesión activa y verifican ownership donde corresponde. La lógica de permisos es simple: ¿sos el owner? ¿sos miembro? Fuera de eso, acceso denegado.

**Tech Stack:** Prisma 7 + PostgreSQL, better-auth v1, Next.js 16 App Router (Server Components + Server Actions), Vitest 4, TypeScript 5.9

---

## Contexto del dominio

### Modelos relevantes en schema.prisma

```
League:       id, name, ownerId, type (PUBLIC|PRIVATE), createdAt
LeagueMember: id, leagueId, userId, joinedAt — @@unique([leagueId, userId])
LeagueRequest: id, leagueId, userId, status (PENDING|APPROVED|REJECTED) — @@unique([leagueId, userId])
```

### Reglas de negocio

- **Liga PÚBLICA:** cualquier usuario autenticado puede unirse directamente (sin solicitud). Se crea un `LeagueMember` directamente.
- **Liga PRIVADA:** el usuario envía una `LeagueRequest` con status `PENDING`. El owner la aprueba o rechaza. Al aprobar → se crea el `LeagueMember` + se actualiza el `LeagueRequest` a `APPROVED`.
- **Owner:** puede cambiar el nombre, el tipo, y gestionar solicitudes. No puede abandonar su propia liga ni eliminarse como miembro.
- **Miembro:** puede abandonar la liga (se elimina el `LeagueMember`). Las predicciones y scores no se borran.
- **Duplicados:** si un usuario ya es miembro, devolver error 409. Si ya tiene una solicitud PENDING, devolver error 409.

---

## Task 1: Interfaces de repositorio extendidas

**Files:**
- Modify: `src/repositories/interfaces/index.ts`

> Las interfaces actuales solo tienen métodos de lectura. Necesitamos agregar los métodos de escritura para gestión de ligas.

- [ ] Actualizar `src/repositories/interfaces/index.ts` para agregar `ILeagueManagementRepository`:

```ts
import type { Badge, League, LeagueMember, LeagueRequest, Match, MatchState, Member, Prediction, ScoringRules } from '@/types/domain'

// ... interfaces existentes sin cambios ...

export interface ILeagueManagementRepository {
  createLeague(data: { name: string; type: 'PUBLIC' | 'PRIVATE'; ownerId: string }): Promise<League>
  updateLeague(id: string, data: { name?: string; type?: 'PUBLIC' | 'PRIVATE' }, ownerId: string): Promise<League>
  deleteLeague(id: string, ownerId: string): Promise<void>
  joinLeague(leagueId: string, userId: string): Promise<void>           // solo ligas PUBLIC
  leaveLeague(leagueId: string, userId: string): Promise<void>
  requestAccess(leagueId: string, userId: string): Promise<LeagueRequest>
  approveRequest(requestId: string, ownerId: string): Promise<void>
  rejectRequest(requestId: string, ownerId: string): Promise<void>
  getLeague(id: string): Promise<League | null>
  getUserLeagues(userId: string): Promise<League[]>
  getPendingRequests(leagueId: string, ownerId: string): Promise<LeagueRequest[]>
}
```

- [ ] Agregar los tipos `League`, `LeagueMember`, `LeagueRequest` a `src/types/domain.ts`:

```ts
export interface League {
  id: string
  name: string
  ownerId: string
  type: 'PUBLIC' | 'PRIVATE'
  createdAt: string  // ISO 8601
  memberCount?: number
}

export interface LeagueMember {
  leagueId: string
  userId: string
  joinedAt: string
}

export interface LeagueRequest {
  id: string
  leagueId: string
  userId: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  createdAt: string
}
```

- [ ] Verificar TypeScript:

```bash
npx tsc --noEmit
```

- [ ] Commit:

```bash
git add src/repositories/interfaces/index.ts src/types/domain.ts
git commit -m "feat(leagues): add league management interfaces and domain types"
```

---

## Task 2: Prisma League Management Repository

**Files:**
- Create: `src/repositories/prisma/league-management.repository.ts`
- Create: `src/__tests__/repositories/league-management.test.ts`

- [ ] Crear `src/__tests__/repositories/league-management.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PrismaLeagueManagementRepository } from '@/repositories/prisma/league-management.repository'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    league: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findMany: vi.fn(),
    },
    leagueMember: {
      create: vi.fn(),
      delete: vi.fn(),
      findUnique: vi.fn(),
    },
    leagueRequest: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

import { prisma } from '@/lib/prisma'

const mockLeague = {
  id: 'league1',
  name: 'Los Cracks',
  ownerId: 'user1',
  type: 'PRIVATE',
  createdAt: new Date(),
  updatedAt: new Date(),
  _count: { members: 3 },
}

describe('PrismaLeagueManagementRepository', () => {
  let repo: PrismaLeagueManagementRepository

  beforeEach(() => {
    repo = new PrismaLeagueManagementRepository()
    vi.clearAllMocks()
    vi.mocked(prisma.$transaction).mockImplementation(async (fn: any) => fn(prisma))
  })

  describe('createLeague', () => {
    it('creates and returns a League domain object', async () => {
      vi.mocked(prisma.league.create).mockResolvedValue(mockLeague as any)

      const league = await repo.createLeague({
        name: 'Los Cracks',
        type: 'PRIVATE',
        ownerId: 'user1',
      })

      expect(league).toMatchObject({
        id: 'league1',
        name: 'Los Cracks',
        ownerId: 'user1',
        type: 'PRIVATE',
      })
      expect(prisma.league.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { name: 'Los Cracks', type: 'PRIVATE', ownerId: 'user1' },
        })
      )
    })
  })

  describe('joinLeague', () => {
    it('throws if user is already a member', async () => {
      vi.mocked(prisma.leagueMember.findUnique).mockResolvedValue({ id: 'lm1' } as any)

      await expect(repo.joinLeague('league1', 'user1')).rejects.toThrow('already a member')
    })

    it('creates a LeagueMember when not already a member', async () => {
      vi.mocked(prisma.leagueMember.findUnique).mockResolvedValue(null)
      vi.mocked(prisma.leagueMember.create).mockResolvedValue({ id: 'lm1' } as any)

      await repo.joinLeague('league1', 'user2')

      expect(prisma.leagueMember.create).toHaveBeenCalledWith({
        data: { leagueId: 'league1', userId: 'user2' },
      })
    })
  })

  describe('requestAccess', () => {
    it('throws if user already has a pending request', async () => {
      vi.mocked(prisma.leagueRequest.findUnique).mockResolvedValue({
        id: 'r1',
        status: 'PENDING',
      } as any)

      await expect(repo.requestAccess('league1', 'user1')).rejects.toThrow('already pending')
    })

    it('creates a LeagueRequest with PENDING status', async () => {
      vi.mocked(prisma.leagueRequest.findUnique).mockResolvedValue(null)
      vi.mocked(prisma.leagueRequest.create).mockResolvedValue({
        id: 'r1',
        leagueId: 'league1',
        userId: 'user1',
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any)

      const request = await repo.requestAccess('league1', 'user1')

      expect(request.status).toBe('PENDING')
      expect(request.leagueId).toBe('league1')
    })
  })

  describe('approveRequest', () => {
    it('throws if request does not belong to ownerId league', async () => {
      vi.mocked(prisma.leagueRequest.findUnique).mockResolvedValue({
        id: 'r1',
        leagueId: 'league1',
        userId: 'user2',
        league: { ownerId: 'otherOwner' },
      } as any)

      await expect(repo.approveRequest('r1', 'user1')).rejects.toThrow('Not authorized')
    })

    it('creates LeagueMember and updates request to APPROVED', async () => {
      vi.mocked(prisma.leagueRequest.findUnique).mockResolvedValue({
        id: 'r1',
        leagueId: 'league1',
        userId: 'user2',
        status: 'PENDING',
        league: { ownerId: 'user1' },
      } as any)
      vi.mocked(prisma.leagueMember.create).mockResolvedValue({ id: 'lm1' } as any)
      vi.mocked(prisma.leagueRequest.update).mockResolvedValue({ id: 'r1' } as any)

      await repo.approveRequest('r1', 'user1')

      expect(prisma.leagueMember.create).toHaveBeenCalledWith({
        data: { leagueId: 'league1', userId: 'user2' },
      })
      expect(prisma.leagueRequest.update).toHaveBeenCalledWith({
        where: { id: 'r1' },
        data: { status: 'APPROVED' },
      })
    })
  })

  describe('updateLeague', () => {
    it('throws if caller is not the owner', async () => {
      vi.mocked(prisma.league.findUnique).mockResolvedValue({ ...mockLeague, ownerId: 'user1' } as any)

      await expect(repo.updateLeague('league1', { name: 'Nuevo' }, 'user999')).rejects.toThrow('Not authorized')
    })
  })
})
```

- [ ] Correr el test para verificar que falla:

```bash
npm test src/__tests__/repositories/league-management.test.ts
```

Esperado: `Cannot find module '@/repositories/prisma/league-management.repository'`.

- [ ] Crear `src/repositories/prisma/league-management.repository.ts`:

```ts
import { prisma } from '@/lib/prisma'
import type { ILeagueManagementRepository } from '@/repositories/interfaces'
import type { League, LeagueRequest } from '@/types/domain'

function toDomainLeague(row: any): League {
  return {
    id: row.id,
    name: row.name,
    ownerId: row.ownerId,
    type: row.type as 'PUBLIC' | 'PRIVATE',
    createdAt: row.createdAt.toISOString(),
    memberCount: row._count?.members ?? row.members?.length,
  }
}

function toDomainRequest(row: any): LeagueRequest {
  return {
    id: row.id,
    leagueId: row.leagueId,
    userId: row.userId,
    status: row.status as 'PENDING' | 'APPROVED' | 'REJECTED',
    createdAt: row.createdAt.toISOString(),
  }
}

export class PrismaLeagueManagementRepository implements ILeagueManagementRepository {
  async createLeague(data: { name: string; type: 'PUBLIC' | 'PRIVATE'; ownerId: string }): Promise<League> {
    const row = await prisma.league.create({
      data,
      include: { _count: { select: { members: true } } },
    })
    return toDomainLeague(row)
  }

  async getLeague(id: string): Promise<League | null> {
    const row = await prisma.league.findUnique({
      where: { id },
      include: { _count: { select: { members: true } } },
    })
    return row ? toDomainLeague(row) : null
  }

  async updateLeague(id: string, data: { name?: string; type?: 'PUBLIC' | 'PRIVATE' }, ownerId: string): Promise<League> {
    const existing = await prisma.league.findUnique({ where: { id } })
    if (!existing || existing.ownerId !== ownerId) {
      throw new Error('Not authorized to update this league')
    }
    const row = await prisma.league.update({
      where: { id },
      data,
      include: { _count: { select: { members: true } } },
    })
    return toDomainLeague(row)
  }

  async deleteLeague(id: string, ownerId: string): Promise<void> {
    const existing = await prisma.league.findUnique({ where: { id } })
    if (!existing || existing.ownerId !== ownerId) {
      throw new Error('Not authorized to delete this league')
    }
    await prisma.league.delete({ where: { id } })
  }

  async joinLeague(leagueId: string, userId: string): Promise<void> {
    const existing = await prisma.leagueMember.findUnique({
      where: { leagueId_userId: { leagueId, userId } },
    })
    if (existing) throw new Error('User is already a member of this league')
    await prisma.leagueMember.create({ data: { leagueId, userId } })
  }

  async leaveLeague(leagueId: string, userId: string): Promise<void> {
    await prisma.leagueMember.delete({
      where: { leagueId_userId: { leagueId, userId } },
    })
  }

  async requestAccess(leagueId: string, userId: string): Promise<LeagueRequest> {
    const existing = await prisma.leagueRequest.findUnique({
      where: { leagueId_userId: { leagueId, userId } },
    })
    if (existing?.status === 'PENDING') {
      throw new Error('Request is already pending for this league')
    }
    const row = await prisma.leagueRequest.create({
      data: { leagueId, userId, status: 'PENDING' },
    })
    return toDomainRequest(row)
  }

  async approveRequest(requestId: string, ownerId: string): Promise<void> {
    const request = await prisma.leagueRequest.findUnique({
      where: { id: requestId },
      include: { league: { select: { ownerId: true } } },
    })
    if (!request || request.league.ownerId !== ownerId) {
      throw new Error('Not authorized to approve this request')
    }
    await prisma.$transaction(async (tx) => {
      await tx.leagueMember.create({ data: { leagueId: request.leagueId, userId: request.userId } })
      await tx.leagueRequest.update({ where: { id: requestId }, data: { status: 'APPROVED' } })
    })
  }

  async rejectRequest(requestId: string, ownerId: string): Promise<void> {
    const request = await prisma.leagueRequest.findUnique({
      where: { id: requestId },
      include: { league: { select: { ownerId: true } } },
    })
    if (!request || request.league.ownerId !== ownerId) {
      throw new Error('Not authorized to reject this request')
    }
    await prisma.leagueRequest.update({ where: { id: requestId }, data: { status: 'REJECTED' } })
  }

  async getUserLeagues(userId: string): Promise<League[]> {
    const rows = await prisma.league.findMany({
      where: { members: { some: { userId } } },
      include: { _count: { select: { members: true } } },
      orderBy: { createdAt: 'desc' },
    })
    return rows.map(toDomainLeague)
  }

  async getPendingRequests(leagueId: string, ownerId: string): Promise<LeagueRequest[]> {
    const league = await prisma.league.findUnique({ where: { id: leagueId } })
    if (!league || league.ownerId !== ownerId) {
      throw new Error('Not authorized to view requests for this league')
    }
    const rows = await prisma.leagueRequest.findMany({
      where: { leagueId, status: 'PENDING' },
      orderBy: { createdAt: 'asc' },
    })
    return rows.map(toDomainRequest)
  }
}
```

- [ ] Correr el test para verificar que pasa:

```bash
npm test src/__tests__/repositories/league-management.test.ts
```

Esperado: todos los tests pasan.

- [ ] Commit:

```bash
git add src/repositories/prisma/league-management.repository.ts "src/__tests__/repositories/league-management.test.ts"
git commit -m "feat(leagues): add prisma league management repository"
```

---

## Task 3: API routes — CRUD de ligas

**Files:**
- Create: `src/app/api/leagues/route.ts`
- Create: `src/app/api/leagues/[id]/route.ts`

> `GET /api/leagues` → ligas del usuario autenticado.
> `POST /api/leagues` → crear una liga.
> `GET /api/leagues/[id]` → detalle de una liga.
> `PATCH /api/leagues/[id]` → actualizar nombre/tipo (solo owner).
> `DELETE /api/leagues/[id]` → eliminar liga (solo owner).

- [ ] Crear `src/app/api/leagues/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { PrismaLeagueManagementRepository } from '@/repositories/prisma/league-management.repository'

const repo = new PrismaLeagueManagementRepository()

export async function GET(_req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const leagues = await repo.getUserLeagues(session.user.id)
  return NextResponse.json({ leagues })
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as { name?: string; type?: string }

  if (!body.name || typeof body.name !== 'string' || body.name.trim().length < 3) {
    return NextResponse.json({ error: 'name must be at least 3 characters' }, { status: 400 })
  }

  const type = body.type === 'PUBLIC' ? 'PUBLIC' : 'PRIVATE'

  const league = await repo.createLeague({
    name: body.name.trim(),
    type,
    ownerId: session.user.id,
  })

  return NextResponse.json({ league }, { status: 201 })
}
```

- [ ] Crear `src/app/api/leagues/[id]/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { PrismaLeagueManagementRepository } from '@/repositories/prisma/league-management.repository'

const repo = new PrismaLeagueManagementRepository()

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const league = await repo.getLeague(id)
  if (!league) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ league })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json() as { name?: string; type?: string }

  try {
    const league = await repo.updateLeague(
      id,
      {
        name: body.name?.trim(),
        type: body.type === 'PUBLIC' || body.type === 'PRIVATE' ? body.type : undefined,
      },
      session.user.id
    )
    return NextResponse.json({ league })
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes('Not authorized')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    throw err
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  try {
    await repo.deleteLeague(id, session.user.id)
    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes('Not authorized')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    throw err
  }
}
```

- [ ] Verificar TypeScript:

```bash
npx tsc --noEmit
```

- [ ] Commit:

```bash
git add "src/app/api/leagues/route.ts" "src/app/api/leagues/[id]/route.ts"
git commit -m "feat(api): add leagues CRUD endpoints"
```

---

## Task 4: API routes — membresía y solicitudes

**Files:**
- Create: `src/app/api/leagues/[id]/join/route.ts`
- Create: `src/app/api/leagues/[id]/leave/route.ts`
- Create: `src/app/api/leagues/[id]/request/route.ts`
- Create: `src/app/api/leagues/[id]/requests/route.ts`
- Create: `src/app/api/leagues/[id]/requests/[requestId]/route.ts`

> Estos endpoints gestionan el ciclo completo de membresía:
> - Ligas públicas: `POST /join` → ingreso directo
> - Ligas privadas: `POST /request` → crea solicitud; el owner usa `GET /requests` y `POST /requests/[id]` para aprobar/rechazar

- [ ] Crear `src/app/api/leagues/[id]/join/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { PrismaLeagueManagementRepository } from '@/repositories/prisma/league-management.repository'
import { prisma } from '@/lib/prisma'

const repo = new PrismaLeagueManagementRepository()

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: leagueId } = await params

  const league = await prisma.league.findUnique({ where: { id: leagueId } })
  if (!league) return NextResponse.json({ error: 'League not found' }, { status: 404 })
  if (league.type !== 'PUBLIC') {
    return NextResponse.json({ error: 'This league requires a request to join' }, { status: 403 })
  }

  try {
    await repo.joinLeague(leagueId, session.user.id)
    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes('already a member')) {
      return NextResponse.json({ error: 'Already a member' }, { status: 409 })
    }
    throw err
  }
}
```

- [ ] Crear `src/app/api/leagues/[id]/leave/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { PrismaLeagueManagementRepository } from '@/repositories/prisma/league-management.repository'
import { prisma } from '@/lib/prisma'

const repo = new PrismaLeagueManagementRepository()

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: leagueId } = await params

  const league = await prisma.league.findUnique({ where: { id: leagueId } })
  if (!league) return NextResponse.json({ error: 'League not found' }, { status: 404 })
  if (league.ownerId === session.user.id) {
    return NextResponse.json({ error: 'Owner cannot leave their own league' }, { status: 403 })
  }

  await repo.leaveLeague(leagueId, session.user.id)
  return NextResponse.json({ ok: true })
}
```

- [ ] Crear `src/app/api/leagues/[id]/request/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { PrismaLeagueManagementRepository } from '@/repositories/prisma/league-management.repository'
import { prisma } from '@/lib/prisma'

const repo = new PrismaLeagueManagementRepository()

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: leagueId } = await params

  const league = await prisma.league.findUnique({ where: { id: leagueId } })
  if (!league) return NextResponse.json({ error: 'League not found' }, { status: 404 })
  if (league.type !== 'PRIVATE') {
    return NextResponse.json({ error: 'This is a public league — use /join instead' }, { status: 400 })
  }

  try {
    const request = await repo.requestAccess(leagueId, session.user.id)
    return NextResponse.json({ request }, { status: 201 })
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes('already pending')) {
      return NextResponse.json({ error: 'Request already pending' }, { status: 409 })
    }
    throw err
  }
}
```

- [ ] Crear `src/app/api/leagues/[id]/requests/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { PrismaLeagueManagementRepository } from '@/repositories/prisma/league-management.repository'

const repo = new PrismaLeagueManagementRepository()

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: leagueId } = await params

  try {
    const requests = await repo.getPendingRequests(leagueId, session.user.id)
    return NextResponse.json({ requests })
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes('Not authorized')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    throw err
  }
}
```

- [ ] Crear `src/app/api/leagues/[id]/requests/[requestId]/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { PrismaLeagueManagementRepository } from '@/repositories/prisma/league-management.repository'

const repo = new PrismaLeagueManagementRepository()

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; requestId: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { requestId } = await params
  const body = await req.json() as { action: 'approve' | 'reject' }

  if (body.action !== 'approve' && body.action !== 'reject') {
    return NextResponse.json({ error: 'action must be "approve" or "reject"' }, { status: 400 })
  }

  try {
    if (body.action === 'approve') {
      await repo.approveRequest(requestId, session.user.id)
    } else {
      await repo.rejectRequest(requestId, session.user.id)
    }
    return NextResponse.json({ ok: true, action: body.action })
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes('Not authorized')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    throw err
  }
}
```

- [ ] Verificar TypeScript:

```bash
npx tsc --noEmit
```

- [ ] Commit:

```bash
git add "src/app/api/leagues/[id]/join/route.ts" "src/app/api/leagues/[id]/leave/route.ts" \
        "src/app/api/leagues/[id]/request/route.ts" "src/app/api/leagues/[id]/requests/route.ts" \
        "src/app/api/leagues/[id]/requests/[requestId]/route.ts"
git commit -m "feat(api): add league membership and request endpoints"
```

---

## Task 5: Pantalla — Crear liga

**Files:**
- Create: `src/app/(main)/leagues/create/page.tsx`
- Create: `src/app/(main)/leagues/create/create-league-screen.tsx`

> Formulario simple con nombre y tipo (público/privado). Al crear, redirige a `/leagues/[id]`.

- [ ] Crear `src/app/(main)/leagues/create/create-league-screen.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function CreateLeagueScreen() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [type, setType] = useState<'PUBLIC' | 'PRIVATE'>('PRIVATE')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await fetch('/api/leagues', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, type }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Error al crear la liga')
      setLoading(false)
      return
    }

    router.push(`/leagues/${data.league.id}`)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 14px',
    background: 'var(--surface)',
    border: '1px solid var(--line)',
    borderRadius: 10,
    color: 'var(--fg)',
    fontFamily: 'var(--font-inter, sans-serif)',
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box',
  }

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '24px 16px' }}>
      <h1 style={{
        fontFamily: 'var(--font-inter, sans-serif)',
        fontWeight: 900,
        fontSize: 28,
        letterSpacing: '-0.04em',
        marginBottom: 24,
      }}>
        CREAR LIGA
      </h1>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label className="t-eyebrow" style={{ display: 'block', marginBottom: 6 }}>
            NOMBRE
          </label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            minLength={3}
            maxLength={40}
            placeholder="Ej: Los Cracks del Mundial"
            style={inputStyle}
          />
        </div>

        <div>
          <label className="t-eyebrow" style={{ display: 'block', marginBottom: 10 }}>
            TIPO
          </label>
          <div style={{ display: 'flex', gap: 10 }}>
            {(['PRIVATE', 'PUBLIC'] as const).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                style={{
                  flex: 1,
                  padding: '12px 0',
                  background: type === t ? 'var(--signal)' : 'var(--surface)',
                  color: type === t ? '#000' : 'var(--fg)',
                  border: `1px solid ${type === t ? 'var(--signal)' : 'var(--line)'}`,
                  borderRadius: 10,
                  fontFamily: 'var(--font-inter, sans-serif)',
                  fontWeight: 700,
                  fontSize: 12,
                  letterSpacing: '0.06em',
                  cursor: 'pointer',
                }}
              >
                {t === 'PRIVATE' ? '🔒 PRIVADA' : '🌐 PÚBLICA'}
              </button>
            ))}
          </div>
          <p className="t-meta" style={{ marginTop: 8, textTransform: 'none', fontSize: 12, color: 'var(--fg-muted)' }}>
            {type === 'PRIVATE'
              ? 'Los usuarios necesitan tu aprobación para unirse.'
              : 'Cualquiera puede unirse directamente.'}
          </p>
        </div>

        {error && (
          <div style={{ padding: '10px 14px', background: 'rgba(255,61,113,0.1)', border: '1px solid rgba(255,61,113,0.3)', borderRadius: 8 }}>
            <span className="t-meta" style={{ color: 'var(--danger)', textTransform: 'none', fontSize: 12 }}>
              {error}
            </span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary btn-block"
          style={{ marginTop: 8 }}
        >
          {loading ? 'Creando…' : 'Crear liga →'}
        </button>
      </form>
    </div>
  )
}
```

- [ ] Crear `src/app/(main)/leagues/create/page.tsx`:

```tsx
import { CreateLeagueScreen } from './create-league-screen'

export default function CreateLeaguePage() {
  return <CreateLeagueScreen />
}
```

- [ ] Verificar TypeScript:

```bash
npx tsc --noEmit
```

- [ ] Commit:

```bash
git add "src/app/(main)/leagues/create/"
git commit -m "feat(leagues): add create league screen"
```

---

## Task 6: Pantalla — Detalle de liga

**Files:**
- Create: `src/app/(main)/leagues/[id]/page.tsx`
- Create: `src/app/(main)/leagues/[id]/league-detail-screen.tsx`

> Muestra los miembros (leaderboard), las reglas de puntuación y — si el usuario es el owner — las solicitudes pendientes.

- [ ] Crear `src/app/(main)/leagues/[id]/page.tsx`:

```tsx
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { PrismaLeagueManagementRepository } from '@/repositories/prisma/league-management.repository'
import { PrismaLeagueRepository } from '@/repositories/prisma/league.repository'
import { LeagueDetailScreen } from './league-detail-screen'

const mgmtRepo = new PrismaLeagueManagementRepository()

export default async function LeagueDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return notFound()

  const league = await mgmtRepo.getLeague(id)
  if (!league) return notFound()

  const leagueRepo = new PrismaLeagueRepository(session.user.id)
  const [members, rules] = await Promise.all([
    leagueRepo.getLeaderboard(id),
    leagueRepo.getScoringRules(id),
  ])

  const isOwner = league.ownerId === session.user.id
  const pendingRequests = isOwner ? await mgmtRepo.getPendingRequests(id, session.user.id) : []

  return (
    <LeagueDetailScreen
      league={league}
      members={members}
      rules={rules}
      pendingRequests={pendingRequests}
      isOwner={isOwner}
      currentUserId={session.user.id}
    />
  )
}
```

- [ ] Crear `src/app/(main)/leagues/[id]/league-detail-screen.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { League, LeagueRequest, Member, ScoringRules } from '@/types/domain'

interface Props {
  league: League
  members: Member[]
  rules: ScoringRules
  pendingRequests: LeagueRequest[]
  isOwner: boolean
  currentUserId: string
}

export function LeagueDetailScreen({ league, members, pendingRequests, isOwner }: Props) {
  const router = useRouter()
  const [processingId, setProcessingId] = useState<string | null>(null)

  async function handleRequest(requestId: string, action: 'approve' | 'reject') {
    setProcessingId(requestId)
    await fetch(`/api/leagues/${league.id}/requests/${requestId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    setProcessingId(null)
    router.refresh()
  }

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ marginBottom: 24 }}>
        <div className="t-eyebrow" style={{ marginBottom: 4, color: 'var(--fg-muted)' }}>
          {league.type === 'PRIVATE' ? '🔒 PRIVADA' : '🌐 PÚBLICA'} · {league.memberCount} miembros
        </div>
        <h1 style={{
          fontFamily: 'var(--font-inter, sans-serif)',
          fontWeight: 900,
          fontSize: 28,
          letterSpacing: '-0.04em',
          margin: 0,
        }}>
          {league.name.toUpperCase()}
        </h1>
      </div>

      {/* Solicitudes pendientes — solo visible para el owner */}
      {isOwner && pendingRequests.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div className="t-eyebrow" style={{ marginBottom: 12 }}>
            SOLICITUDES PENDIENTES ({pendingRequests.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {pendingRequests.map(req => (
              <div key={req.id} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                background: 'var(--surface)',
                border: '1px solid var(--line)',
                borderRadius: 10,
              }}>
                <span style={{ fontSize: 14 }}>{req.userId}</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => handleRequest(req.id, 'approve')}
                    disabled={processingId === req.id}
                    style={{
                      padding: '6px 12px',
                      background: 'var(--signal)',
                      color: '#000',
                      border: 'none',
                      borderRadius: 6,
                      fontWeight: 700,
                      fontSize: 12,
                      cursor: 'pointer',
                    }}
                  >
                    ✓ Aprobar
                  </button>
                  <button
                    onClick={() => handleRequest(req.id, 'reject')}
                    disabled={processingId === req.id}
                    style={{
                      padding: '6px 12px',
                      background: 'transparent',
                      color: 'var(--danger)',
                      border: '1px solid var(--danger)',
                      borderRadius: 6,
                      fontWeight: 700,
                      fontSize: 12,
                      cursor: 'pointer',
                    }}
                  >
                    ✗ Rechazar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Leaderboard */}
      <div className="t-eyebrow" style={{ marginBottom: 12 }}>RANKING</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {members.map((member, i) => (
          <div key={member.id} style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '12px 14px',
            background: member.me ? 'rgba(0, 210, 106, 0.08)' : 'var(--surface)',
            border: `1px solid ${member.me ? 'var(--signal)' : 'var(--line)'}`,
            borderRadius: 10,
          }}>
            <span style={{ fontWeight: 900, fontSize: 18, width: 24, textAlign: 'center' }}>
              {i + 1}
            </span>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: member.color, flexShrink: 0,
            }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{member.name}</div>
              <div className="t-meta" style={{ textTransform: 'none', fontSize: 11, color: 'var(--fg-muted)' }}>
                @{member.handle}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 900, fontSize: 18 }}>{member.pts}</div>
              <div className="t-meta" style={{ textTransform: 'none', fontSize: 10, color: 'var(--fg-muted)' }}>pts</div>
            </div>
          </div>
        ))}
        {members.length === 0 && (
          <p style={{ color: 'var(--fg-muted)', textAlign: 'center', padding: 24 }}>
            Aún no hay miembros con puntos.
          </p>
        )}
      </div>
    </div>
  )
}
```

- [ ] Verificar TypeScript:

```bash
npx tsc --noEmit
```

- [ ] Commit:

```bash
git add "src/app/(main)/leagues/[id]/"
git commit -m "feat(leagues): add league detail screen with leaderboard and request management"
```

---

## Task 7: Pantalla — Mis ligas

**Files:**
- Create: `src/app/(main)/leagues/page.tsx`
- Create: `src/app/(main)/leagues/leagues-screen.tsx`

> Lista de ligas del usuario con acceso rápido a crear una nueva.

- [ ] Crear `src/app/(main)/leagues/page.tsx`:

```tsx
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { PrismaLeagueManagementRepository } from '@/repositories/prisma/league-management.repository'
import { LeaguesScreen } from './leagues-screen'

const repo = new PrismaLeagueManagementRepository()

export default async function LeaguesPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/login')

  const leagues = await repo.getUserLeagues(session.user.id)

  return <LeaguesScreen leagues={leagues} />
}
```

- [ ] Crear `src/app/(main)/leagues/leagues-screen.tsx`:

```tsx
import Link from 'next/link'
import type { League } from '@/types/domain'

interface Props {
  leagues: League[]
}

export function LeaguesScreen({ leagues }: Props) {
  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{
          fontFamily: 'var(--font-inter, sans-serif)',
          fontWeight: 900,
          fontSize: 28,
          letterSpacing: '-0.04em',
          margin: 0,
        }}>
          MIS LIGAS
        </h1>
        <Link href="/leagues/create" style={{
          padding: '8px 16px',
          background: 'var(--signal)',
          color: '#000',
          borderRadius: 8,
          fontWeight: 700,
          fontSize: 12,
          letterSpacing: '0.06em',
          textDecoration: 'none',
        }}>
          + CREAR
        </Link>
      </div>

      {leagues.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <p style={{ color: 'var(--fg-muted)', marginBottom: 16 }}>
            No estás en ninguna liga todavía.
          </p>
          <Link href="/leagues/create" style={{
            display: 'inline-block',
            padding: '12px 24px',
            background: 'var(--signal)',
            color: '#000',
            borderRadius: 10,
            fontWeight: 700,
            fontSize: 14,
            textDecoration: 'none',
          }}>
            Crear mi primera liga →
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {leagues.map(league => (
            <Link key={league.id} href={`/leagues/${league.id}`} style={{ textDecoration: 'none' }}>
              <div style={{
                padding: '14px 16px',
                background: 'var(--surface)',
                border: '1px solid var(--line)',
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--fg)' }}>
                    {league.name}
                  </div>
                  <div className="t-meta" style={{ textTransform: 'none', fontSize: 11, color: 'var(--fg-muted)', marginTop: 2 }}>
                    {league.type === 'PRIVATE' ? '🔒' : '🌐'} {league.memberCount ?? 0} miembros
                  </div>
                </div>
                <span style={{ color: 'var(--fg-muted)', fontSize: 18 }}>›</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] Verificar TypeScript:

```bash
npx tsc --noEmit
```

- [ ] Commit:

```bash
git add "src/app/(main)/leagues/"
git commit -m "feat(leagues): add leagues list screen"
```

---

## Task 8: Agregar /leagues al proxy y navegación

**Files:**
- Modify: `src/proxy.ts`
- Modify: `src/components/layout/bottom-nav.tsx` (o `mobile-bottom-nav.tsx`)

> La ruta `/leagues` debe ser protegida. También hay que agregar un tab de Ligas a la navegación.

- [ ] Agregar `/leagues/:path*` al matcher en `src/proxy.ts`:

```ts
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/feed/:path*',
    '/leaderboard/:path*',
    '/leagues/:path*',    // ← agregar esta línea
    '/oracle/:path*',
    '/profile/:path*',
    '/settings/:path*',
  ],
}
```

- [ ] Verificar TypeScript:

```bash
npx tsc --noEmit
```

- [ ] Correr todos los tests:

```bash
npm test
```

Esperado: todos los tests pasan.

- [ ] Commit:

```bash
git add src/proxy.ts
git commit -m "feat(leagues): protect /leagues routes in proxy"
```

---

## Auto-review

**Spec coverage:**
- ✅ Crear liga con nombre y tipo
- ✅ Ligas públicas — ingreso directo via `/join`
- ✅ Ligas privadas — solicitud via `/request` → aprobación/rechazo por el owner
- ✅ Owner puede editar y eliminar su liga
- ✅ Miembros pueden abandonar la liga
- ✅ Dashboard del owner con solicitudes pendientes
- ✅ Leaderboard de la liga con puntos reales

**Fuera de scope (intencional):**
- Invitaciones por link (Fase futura)
- Ligas públicas paginadas/buscables (Fase futura)
- Límite de miembros por liga (Fase futura)
