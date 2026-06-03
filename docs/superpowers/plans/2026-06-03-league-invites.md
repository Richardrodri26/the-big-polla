# League Invites — Invitaciones por Link

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir que el owner de una liga privada genere un link de invitación con token único que cualquier usuario autenticado puede usar para unirse directamente sin solicitar acceso.

**Architecture:** Nuevo modelo `LeagueInvite` en Prisma con token `cuid()` único. El owner genera el token vía POST, obtiene una URL `/join/[token]`. Cuando un usuario visita esa URL, ve info de la liga y confirma el ingreso via POST. Email delivery es opcional vía Resend.

**¿Por qué NO usar el plugin `organization` de better-auth?**
Better-auth tiene invitaciones built-in, pero están diseñadas para un flujo distinto: el owner ingresa un email específico → better-auth envía un mail → esa persona acepta. Son invitaciones nominales, no links compartibles. Lo que queremos acá es un **shareable link** — un token que cualquier usuario autenticado puede usar. No es el mismo caso de uso.

**Resend (opcional):** Si querés enviar el link por email además de compartirlo manualmente, se puede agregar `resend` al endpoint de creación. No es bloqueante — el link funciona solo sin email.

**Tech Stack:** Next.js 15 App Router, Prisma, TypeScript, Vitest, Resend (opcional)

---

## File Map

- Modify: `prisma/schema.prisma` — agregar `LeagueInvite`
- Modify: `src/types/domain.ts` — agregar `LeagueInvite`
- Modify: `src/repositories/interfaces/index.ts` — agregar `ILeagueInviteRepository`
- Create: `src/repositories/prisma/league-invite.repository.ts`
- Create: `src/__tests__/repositories/league-invite.test.ts`
- Create: `src/app/api/leagues/[id]/invites/route.ts`
- Create: `src/app/api/invites/[token]/route.ts`
- Create: `src/app/api/invites/[token]/join/route.ts`
- Create: `src/app/(main)/join/[token]/page.tsx`
- Create: `src/app/(main)/join/[token]/join-invite-screen.tsx`
- Modify: `src/app/(main)/leagues/[id]/league-detail-screen.tsx`

---

### Task 1: Agregar `LeagueInvite` al schema de Prisma

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Agregar el modelo al schema**

En `prisma/schema.prisma`, agregar después del modelo `LeagueRequest`:

```prisma
model LeagueInvite {
  id        String   @id @default(cuid())
  leagueId  String
  league    League   @relation(fields: [leagueId], references: [id], onDelete: Cascade)
  token     String   @unique @default(cuid())
  createdBy String
  creator   User     @relation("LeagueInviteCreator", fields: [createdBy], references: [id])
  expiresAt DateTime?
  usedCount Int      @default(0)
  createdAt DateTime @default(now())
}
```

También agregar la relación en el modelo `League` (después de `requests LeagueRequest[]`):

```prisma
  invites  LeagueInvite[]
```

Y en el modelo `User` (después de `leagueMemberships LeagueMember[]`):

```prisma
  leagueInvites LeagueInvite[] @relation("LeagueInviteCreator")
```

- [ ] **Step 2: Generar y correr la migración**

```
npx prisma migrate dev --name add-league-invite
```

Expected: Migration applied. `prisma/migrations/` tendrá el nuevo directorio.

- [ ] **Step 3: Regenerar el cliente Prisma**

```
npx prisma generate
```

Expected: Client generated. `src/generated/prisma/` actualizado.

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat(db): add LeagueInvite model with token"
```

---

### Task 2: Agregar `LeagueInvite` a domain.ts e interfaces

**Files:**
- Modify: `src/types/domain.ts`
- Modify: `src/repositories/interfaces/index.ts`

- [ ] **Step 1: Agregar tipo a domain.ts**

Al final de `src/types/domain.ts`:

```typescript
export interface LeagueInvite {
  id: string
  leagueId: string
  token: string
  createdBy: string
  expiresAt: string | null
  usedCount: number
  createdAt: string
}
```

- [ ] **Step 2: Agregar interfaz a repositories/interfaces/index.ts**

Agregar en `src/repositories/interfaces/index.ts`:

```typescript
export interface ILeagueInviteRepository {
  createInvite(leagueId: string, createdBy: string, expiresAt?: Date): Promise<LeagueInvite>
  getInviteByToken(token: string): Promise<(LeagueInvite & { leagueName: string; memberCount: number }) | null>
  listInvites(leagueId: string): Promise<LeagueInvite[]>
  deleteInvite(id: string, requesterId: string): Promise<void>
  incrementUsedCount(token: string): Promise<void>
}
```

Agregar `LeagueInvite` al import existente del archivo.

- [ ] **Step 3: Commit**

```bash
git add src/types/domain.ts src/repositories/interfaces/index.ts
git commit -m "feat(types): add LeagueInvite domain type and interface"
```

---

### Task 3: Implementar `PrismaLeagueInviteRepository`

**Files:**
- Create: `src/repositories/prisma/league-invite.repository.ts`
- Create: `src/__tests__/repositories/league-invite.test.ts`

- [ ] **Step 1: Escribir tests primero**

Crear `src/__tests__/repositories/league-invite.test.ts`:

```typescript
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PrismaLeagueInviteRepository } from '@/repositories/prisma/league-invite.repository'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    leagueInvite: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      delete: vi.fn(),
      update: vi.fn(),
    },
  },
}))

import { prisma } from '@/lib/prisma'

const mockInvite = {
  id: 'inv-1',
  leagueId: 'lg-1',
  token: 'tok-abc',
  createdBy: 'user-1',
  expiresAt: null,
  usedCount: 0,
  createdAt: new Date('2026-06-03T00:00:00Z'),
}

describe('PrismaLeagueInviteRepository', () => {
  let repo: PrismaLeagueInviteRepository
  beforeEach(() => {
    repo = new PrismaLeagueInviteRepository()
    vi.clearAllMocks()
  })

  it('createInvite maps and returns LeagueInvite', async () => {
    vi.mocked(prisma.leagueInvite.create).mockResolvedValue(mockInvite as any)
    const result = await repo.createInvite('lg-1', 'user-1')
    expect(result.token).toBe('tok-abc')
    expect(result.createdAt).toBe('2026-06-03T00:00:00.000Z')
  })

  it('getInviteByToken returns null when not found', async () => {
    vi.mocked(prisma.leagueInvite.findUnique).mockResolvedValue(null)
    expect(await repo.getInviteByToken('bad-token')).toBeNull()
  })

  it('getInviteByToken returns enriched invite when found', async () => {
    vi.mocked(prisma.leagueInvite.findUnique).mockResolvedValue({
      ...mockInvite,
      league: { name: 'Liga Test', _count: { members: 3 } },
    } as any)
    const result = await repo.getInviteByToken('tok-abc')
    expect(result?.leagueName).toBe('Liga Test')
    expect(result?.memberCount).toBe(3)
  })

  it('incrementUsedCount calls update', async () => {
    vi.mocked(prisma.leagueInvite.update).mockResolvedValue(mockInvite as any)
    await repo.incrementUsedCount('tok-abc')
    expect(prisma.leagueInvite.update).toHaveBeenCalledWith({
      where: { token: 'tok-abc' },
      data: { usedCount: { increment: 1 } },
    })
  })
})
```

- [ ] **Step 2: Correr tests para verificar que fallan**

```
npx vitest run src/__tests__/repositories/league-invite.test.ts
```

Expected: FAIL — module not found

- [ ] **Step 3: Implementar el repositorio**

Crear `src/repositories/prisma/league-invite.repository.ts`:

```typescript
import { prisma } from '@/lib/prisma'
import type { ILeagueInviteRepository } from '@/repositories/interfaces'
import type { LeagueInvite } from '@/types/domain'

type EnrichedInvite = LeagueInvite & { leagueName: string; memberCount: number }

export class PrismaLeagueInviteRepository implements ILeagueInviteRepository {
  async createInvite(leagueId: string, createdBy: string, expiresAt?: Date): Promise<LeagueInvite> {
    const row = await prisma.leagueInvite.create({
      data: { leagueId, createdBy, expiresAt },
    })
    return this.mapRow(row)
  }

  async getInviteByToken(token: string): Promise<EnrichedInvite | null> {
    const row = await prisma.leagueInvite.findUnique({
      where: { token },
      include: { league: { select: { name: true, _count: { select: { members: true } } } } },
    })
    if (!row) return null
    return {
      ...this.mapRow(row),
      leagueName: (row as any).league.name,
      memberCount: (row as any).league._count.members,
    }
  }

  async listInvites(leagueId: string): Promise<LeagueInvite[]> {
    const rows = await prisma.leagueInvite.findMany({ where: { leagueId } })
    return rows.map(this.mapRow)
  }

  async deleteInvite(id: string, requesterId: string): Promise<void> {
    await prisma.leagueInvite.delete({ where: { id, createdBy: requesterId } })
  }

  async incrementUsedCount(token: string): Promise<void> {
    await prisma.leagueInvite.update({
      where: { token },
      data: { usedCount: { increment: 1 } },
    })
  }

  private mapRow(r: {
    id: string; leagueId: string; token: string; createdBy: string; expiresAt: Date | null; usedCount: number; createdAt: Date
  }): LeagueInvite {
    return {
      id: r.id,
      leagueId: r.leagueId,
      token: r.token,
      createdBy: r.createdBy,
      expiresAt: r.expiresAt?.toISOString() ?? null,
      usedCount: r.usedCount,
      createdAt: r.createdAt.toISOString(),
    }
  }
}
```

- [ ] **Step 4: Correr tests para verificar que pasan**

```
npx vitest run src/__tests__/repositories/league-invite.test.ts
```

Expected: PASS — 4 tests passing

- [ ] **Step 5: Commit**

```bash
git add src/repositories/prisma/league-invite.repository.ts src/__tests__/repositories/league-invite.test.ts
git commit -m "feat(repo): add PrismaLeagueInviteRepository with tests"
```

---

### Task 4: Crear endpoints de invites

**Files:**
- Create: `src/app/api/leagues/[id]/invites/route.ts`
- Create: `src/app/api/invites/[token]/route.ts`
- Create: `src/app/api/invites/[token]/join/route.ts`

- [ ] **Step 1: Crear `POST /api/leagues/[id]/invites`**

```typescript
// src/app/api/leagues/[id]/invites/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { PrismaLeagueInviteRepository } from '@/repositories/prisma/league-invite.repository'
import { PrismaLeagueManagementRepository } from '@/repositories/prisma/league-management.repository'

const inviteRepo = new PrismaLeagueInviteRepository()
const leagueRepo = new PrismaLeagueManagementRepository()

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: leagueId } = await params
  const league = await leagueRepo.getLeague(leagueId)
  if (!league) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (league.ownerId !== session.user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const invite = await inviteRepo.createInvite(leagueId, session.user.id)
  const url = `${process.env.NEXT_PUBLIC_APP_URL}/join/${invite.token}`
  return NextResponse.json({ invite, url }, { status: 201 })
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: leagueId } = await params
  const league = await leagueRepo.getLeague(leagueId)
  if (!league) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (league.ownerId !== session.user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const invites = await inviteRepo.listInvites(leagueId)
  return NextResponse.json({ invites })
}
```

- [ ] **Step 2: Crear `GET /api/invites/[token]`**

```typescript
// src/app/api/invites/[token]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { PrismaLeagueInviteRepository } from '@/repositories/prisma/league-invite.repository'

const inviteRepo = new PrismaLeagueInviteRepository()

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const invite = await inviteRepo.getInviteByToken(token)
  if (!invite) return NextResponse.json({ error: 'Invite not found' }, { status: 404 })

  if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) {
    return NextResponse.json({ error: 'Invite expired' }, { status: 410 })
  }

  return NextResponse.json({ invite })
}
```

- [ ] **Step 3: Crear `POST /api/invites/[token]/join`**

```typescript
// src/app/api/invites/[token]/join/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { PrismaLeagueInviteRepository } from '@/repositories/prisma/league-invite.repository'
import { PrismaLeagueManagementRepository } from '@/repositories/prisma/league-management.repository'

const inviteRepo = new PrismaLeagueInviteRepository()
const leagueRepo = new PrismaLeagueManagementRepository()

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { token } = await params
  const invite = await inviteRepo.getInviteByToken(token)
  if (!invite) return NextResponse.json({ error: 'Invite not found' }, { status: 404 })

  if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) {
    return NextResponse.json({ error: 'Invite expired' }, { status: 410 })
  }

  try {
    await leagueRepo.joinLeague(invite.leagueId, session.user.id)
    await inviteRepo.incrementUsedCount(token)
    return NextResponse.json({ ok: true, leagueId: invite.leagueId })
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes('already')) {
      return NextResponse.json({ error: 'Already a member' }, { status: 409 })
    }
    throw err
  }
}
```

- [ ] **Step 4: Verificar tipos**

```
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add src/app/api/leagues/[id]/invites/ src/app/api/invites/
git commit -m "feat(api): add league invite endpoints (create, info, join)"
```

---

### Task 5: Crear pantalla de aceptación `/join/[token]`

**Files:**
- Create: `src/app/(main)/join/[token]/page.tsx`
- Create: `src/app/(main)/join/[token]/join-invite-screen.tsx`

- [ ] **Step 1: Crear el screen component**

Crear `src/app/(main)/join/[token]/join-invite-screen.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  token: string
  leagueName: string
  memberCount: number
}

export function JoinInviteScreen({ token, leagueName, memberCount }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleJoin() {
    setLoading(true)
    setError(null)
    const res = await fetch(`/api/invites/${token}/join`, { method: 'POST' })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Error al unirse')
      setLoading(false)
      return
    }
    router.push(`/leagues/${data.leagueId}`)
  }

  return (
    <div style={{ maxWidth: 480, margin: '80px auto', padding: '0 16px', textAlign: 'center' }}>
      <div className="t-eyebrow" style={{ marginBottom: 8 }}>INVITACIÓN A LIGA</div>
      <h1 style={{ fontFamily: 'var(--font-inter, sans-serif)', fontWeight: 900, fontSize: 32, letterSpacing: '-0.04em', margin: '0 0 8px' }}>
        {leagueName.toUpperCase()}
      </h1>
      <p className="t-meta" style={{ marginBottom: 32 }}>{memberCount} miembros activos</p>

      {error && (
        <p style={{ color: 'var(--danger)', marginBottom: 16, fontSize: 14 }}>{error}</p>
      )}

      <button
        onClick={handleJoin}
        disabled={loading}
        style={{
          width: '100%', padding: '14px 0', borderRadius: 10,
          background: 'var(--fg)', color: '#04130A', border: 'none',
          fontFamily: 'var(--font-inter, sans-serif)', fontWeight: 900,
          fontSize: 16, letterSpacing: '-0.01em', cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? 'Uniéndote...' : 'UNIRME A LA LIGA →'}
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Crear el server component page**

Crear `src/app/(main)/join/[token]/page.tsx`:

```typescript
import { notFound } from 'next/navigation'
import { JoinInviteScreen } from './join-invite-screen'

interface Props {
  params: Promise<{ token: string }>
}

export default async function JoinInvitePage({ params }: Props) {
  const { token } = await params
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/invites/${token}`, {
    cache: 'no-store',
  })

  if (!res.ok) notFound()

  const { invite } = await res.json()

  return (
    <JoinInviteScreen
      token={token}
      leagueName={invite.leagueName}
      memberCount={invite.memberCount}
    />
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/(main)/join/
git commit -m "feat(ui): add join-via-invite screen"
```

---

### Task 6: Agregar botón "Generar link" en LeagueDetailScreen

**Files:**
- Modify: `src/app/(main)/leagues/[id]/league-detail-screen.tsx`

- [ ] **Step 1: Agregar estado y función de generación**

Dentro del componente `LeagueDetailScreen`, después de los estados existentes:

```typescript
const [inviteUrl, setInviteUrl] = useState<string | null>(null)
const [generatingLink, setGeneratingLink] = useState(false)

async function handleGenerateInvite() {
  setGeneratingLink(true)
  const res = await fetch(`/api/leagues/${league.id}/invites`, { method: 'POST' })
  const data = await res.json()
  setInviteUrl(data.url)
  setGeneratingLink(false)
}

async function handleCopyLink() {
  if (inviteUrl) await navigator.clipboard.writeText(inviteUrl)
}
```

- [ ] **Step 2: Agregar sección de invitación solo para el owner (liga privada)**

En el JSX, después de la sección de solicitudes pendientes:

```tsx
{isOwner && league.type === 'PRIVATE' && (
  <div style={{ marginBottom: 24, padding: 16, background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12 }}>
    <div className="t-eyebrow" style={{ marginBottom: 12 }}>INVITAR VÍA LINK</div>
    {inviteUrl ? (
      <div>
        <div style={{ padding: '10px 14px', background: 'var(--surface-2)', borderRadius: 8, fontFamily: 'var(--font-jetbrains, monospace)', fontSize: 11, wordBreak: 'break-all', marginBottom: 10 }}>
          {inviteUrl}
        </div>
        <button
          onClick={handleCopyLink}
          style={{ width: '100%', padding: '10px', borderRadius: 8, background: 'var(--signal)', color: '#000', border: 'none', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}
        >
          COPIAR LINK
        </button>
      </div>
    ) : (
      <button
        onClick={handleGenerateInvite}
        disabled={generatingLink}
        style={{ width: '100%', padding: '10px', borderRadius: 8, background: 'var(--fg)', color: '#04130A', border: 'none', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}
      >
        {generatingLink ? 'Generando...' : 'GENERAR LINK DE INVITACIÓN'}
      </button>
    )}
  </div>
)}
```

- [ ] **Step 3: Verificar tipos**

```
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add src/app/(main)/leagues/[id]/league-detail-screen.tsx
git commit -m "feat(ui): add generate invite link to LeagueDetailScreen"
```

---

### Task 7 (Opcional): Envío del link por email con Resend

Solo implementar si se quiere notificar al invitado por email además del link copiable.

**Files:**
- Modify: `src/app/api/leagues/[id]/invites/route.ts`

- [ ] **Step 1: Instalar Resend**

```
npm install resend
```

- [ ] **Step 2: Agregar `RESEND_API_KEY` al `.env.local`**

```
RESEND_API_KEY=re_xxxxxxxxxxxx
```

Obtener en https://resend.com — tiene tier gratuito de 3000 mails/mes.

- [ ] **Step 3: Modificar el endpoint POST para enviar email opcional**

En `src/app/api/leagues/[id]/invites/route.ts`, después de crear el invite:

```typescript
import { Resend } from 'resend'

// Solo ejecutar si hay email en el body y RESEND_API_KEY está configurado
const body = await req.json() as { emailTo?: string }
const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/join/${invite.token}`

if (body.emailTo && process.env.RESEND_API_KEY) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  await resend.emails.send({
    from: 'The Big Polla <noreply@tudominio.com>',
    to: body.emailTo,
    subject: `Te invitaron a la liga "${league.name}"`,
    html: `<p>Hacé click acá para unirte: <a href="${inviteUrl}">${inviteUrl}</a></p>`,
  })
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/api/leagues/[id]/invites/route.ts
git commit -m "feat(api): optional email delivery of invite link via Resend"
```
