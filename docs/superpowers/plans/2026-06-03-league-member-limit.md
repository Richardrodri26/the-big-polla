# League Member Limit — Límite Configurable de Miembros

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir que el owner configure un límite máximo de miembros al crear o editar una liga. Al alcanzar el límite, se bloquea el ingreso directo y la aprobación de solicitudes.

**Architecture:** Campo `maxMembers Int?` en el schema de Prisma (null = sin límite). La validación se aplica en `joinLeague` y `approveRequest` del repositorio antes de ejecutar la operación.

**Tech Stack:** Next.js 15 App Router, Prisma, TypeScript, Vitest

---

## File Map

- Modify: `prisma/schema.prisma` — agregar `maxMembers Int?` a `League`
- Modify: `src/types/domain.ts` — agregar `maxMembers?: number` a `League`
- Modify: `src/repositories/interfaces/index.ts` — actualizar firma de `createLeague` y `updateLeague`
- Modify: `src/repositories/prisma/league-management.repository.ts` — enforcing + nuevo campo
- Modify: `src/app/api/leagues/route.ts` — pasar `maxMembers` en POST
- Modify: `src/app/api/leagues/[id]/route.ts` — pasar `maxMembers` en PATCH
- Modify: `src/app/(main)/leagues/create/create-league-screen.tsx` — campo de UI
- Modify: `src/app/(main)/leagues/[id]/league-detail-screen.tsx` — mostrar X/max

---

### Task 1: Agregar `maxMembers` al schema

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Agregar el campo al modelo `League`**

En `prisma/schema.prisma`, dentro del modelo `League`, después de `type LeagueType @default(PRIVATE)`:

```prisma
  maxMembers Int?
```

- [ ] **Step 2: Crear y aplicar migración**

```
npx prisma migrate dev --name add-league-max-members
```

Expected: Migration applied.

- [ ] **Step 3: Regenerar cliente Prisma**

```
npx prisma generate
```

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat(db): add optional maxMembers field to League"
```

---

### Task 2: Actualizar tipos e interfaz

**Files:**
- Modify: `src/types/domain.ts`
- Modify: `src/repositories/interfaces/index.ts`

- [ ] **Step 1: Agregar `maxMembers` al tipo `League` en domain.ts**

En `src/types/domain.ts`, dentro de `interface League`, agregar:

```typescript
maxMembers?: number | null
```

- [ ] **Step 2: Actualizar firma de `createLeague` y `updateLeague` en interfaces**

En `src/repositories/interfaces/index.ts`:

```typescript
createLeague(data: { name: string; type: 'PUBLIC' | 'PRIVATE'; ownerId: string; maxMembers?: number | null }): Promise<League>
updateLeague(id: string, data: { name?: string; type?: 'PUBLIC' | 'PRIVATE'; maxMembers?: number | null }, ownerId: string): Promise<League>
```

- [ ] **Step 3: Commit**

```bash
git add src/types/domain.ts src/repositories/interfaces/index.ts
git commit -m "feat(types): add maxMembers to League type and interfaces"
```

---

### Task 3: Enforcing en el repositorio

**Files:**
- Modify: `src/repositories/prisma/league-management.repository.ts`

- [ ] **Step 1: Escribir tests de la validación del límite**

Agregar en `src/__tests__/repositories/league-management.test.ts`:

```typescript
describe('joinLeague — member limit', () => {
  it('throws when league is at maxMembers', async () => {
    // League con maxMembers: 2, ya tiene 2 miembros
    vi.mocked(prisma.league.findUnique).mockResolvedValue({
      id: 'lg-1', maxMembers: 2,
      members: [{ id: 'm1' }, { id: 'm2' }],
    } as any)

    const repo = new PrismaLeagueManagementRepository()
    await expect(repo.joinLeague('lg-1', 'user-new')).rejects.toThrow('Liga llena')
  })

  it('does not throw when league has no maxMembers limit', async () => {
    vi.mocked(prisma.league.findUnique).mockResolvedValue({
      id: 'lg-1', maxMembers: null,
      members: [{ id: 'm1' }, { id: 'm2' }],
    } as any)
    vi.mocked(prisma.leagueMember.create).mockResolvedValue({ id: 'new-m' } as any)

    const repo = new PrismaLeagueManagementRepository()
    await expect(repo.joinLeague('lg-1', 'user-new')).resolves.not.toThrow()
  })
})
```

Asegurarse de que `prisma.league.findUnique` esté en el `vi.mock` del archivo de tests.

- [ ] **Step 2: Correr tests para verificar que fallan**

```
npx vitest run src/__tests__/repositories/league-management.test.ts
```

Expected: FAIL — las validaciones no existen aún

- [ ] **Step 3: Implementar la validación en `joinLeague`**

En `src/repositories/prisma/league-management.repository.ts`, modificar `joinLeague`:

```typescript
async joinLeague(leagueId: string, userId: string): Promise<void> {
  const league = await prisma.league.findUnique({
    where: { id: leagueId },
    include: { members: { select: { id: true } } },
  })
  if (!league) throw new Error('League not found')

  if (league.maxMembers !== null && (league as any).members.length >= league.maxMembers) {
    throw new Error('Liga llena')
  }

  await prisma.leagueMember.create({
    data: { leagueId, userId },
  })
}
```

- [ ] **Step 4: Implementar validación en `approveRequest`**

Modificar `approveRequest` para verificar límite antes de aprobar:

```typescript
async approveRequest(requestId: string, ownerId: string): Promise<void> {
  const request = await prisma.leagueRequest.findUnique({
    where: { id: requestId },
    include: {
      league: {
        include: { members: { select: { id: true } } },
      },
    },
  })
  if (!request) throw new Error('Request not found')
  if (request.league.ownerId !== ownerId) throw new Error('Not authorized')

  if (
    request.league.maxMembers !== null &&
    (request.league as any).members.length >= request.league.maxMembers
  ) {
    throw new Error('Liga llena')
  }

  await prisma.$transaction([
    prisma.leagueRequest.update({
      where: { id: requestId },
      data: { status: 'APPROVED' },
    }),
    prisma.leagueMember.create({
      data: { leagueId: request.leagueId, userId: request.userId },
    }),
  ])
}
```

- [ ] **Step 5: Actualizar `createLeague` y `updateLeague` para aceptar `maxMembers`**

En `createLeague`:

```typescript
async createLeague(data: { name: string; type: 'PUBLIC' | 'PRIVATE'; ownerId: string; maxMembers?: number | null }): Promise<League> {
  const row = await prisma.league.create({
    data: {
      name: data.name,
      type: data.type,
      ownerId: data.ownerId,
      maxMembers: data.maxMembers ?? null,
    },
  })
  return this.mapLeague(row)
}
```

En `updateLeague`, agregar `maxMembers` al objeto `data` del update:

```typescript
async updateLeague(id: string, data: { name?: string; type?: 'PUBLIC' | 'PRIVATE'; maxMembers?: number | null }, ownerId: string): Promise<League> {
  const existing = await prisma.league.findUnique({ where: { id } })
  if (!existing) throw new Error('Not found')
  if (existing.ownerId !== ownerId) throw new Error('Not authorized')

  const row = await prisma.league.update({
    where: { id },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.type !== undefined ? { type: data.type } : {}),
      ...(data.maxMembers !== undefined ? { maxMembers: data.maxMembers } : {}),
    },
  })
  return this.mapLeague(row)
}
```

En `mapLeague` (método privado de mapeo), agregar:

```typescript
maxMembers: row.maxMembers ?? undefined,
```

- [ ] **Step 6: Correr tests**

```
npx vitest run src/__tests__/repositories/league-management.test.ts
```

Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/repositories/prisma/league-management.repository.ts src/__tests__/repositories/league-management.test.ts
git commit -m "feat(repo): enforce maxMembers limit on joinLeague and approveRequest"
```

---

### Task 4: Actualizar API routes

**Files:**
- Modify: `src/app/api/leagues/route.ts`
- Modify: `src/app/api/leagues/[id]/route.ts`

- [ ] **Step 1: Pasar `maxMembers` en `POST /api/leagues`**

En `src/app/api/leagues/route.ts`, dentro del handler POST:

```typescript
const body = await req.json() as { name?: string; type?: string; maxMembers?: number }

const league = await repo.createLeague({
  name: body.name?.trim() ?? '',
  type: body.type === 'PUBLIC' ? 'PUBLIC' : 'PRIVATE',
  ownerId: session.user.id,
  maxMembers: typeof body.maxMembers === 'number' && body.maxMembers > 0 ? body.maxMembers : null,
})
```

- [ ] **Step 2: Pasar `maxMembers` en `PATCH /api/leagues/[id]`**

En `src/app/api/leagues/[id]/route.ts`, dentro del handler PATCH:

```typescript
const body = await req.json() as { name?: string; type?: string; maxMembers?: number | null }

const league = await repo.updateLeague(
  id,
  {
    name: body.name?.trim(),
    type: body.type === 'PUBLIC' || body.type === 'PRIVATE' ? body.type : undefined,
    maxMembers: body.maxMembers !== undefined ? (body.maxMembers ?? null) : undefined,
  },
  session.user.id
)
```

- [ ] **Step 3: Verificar tipos**

```
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add src/app/api/leagues/route.ts src/app/api/leagues/[id]/route.ts
git commit -m "feat(api): pass maxMembers through create and update league routes"
```

---

### Task 5: Actualizar UI de creación de liga

**Files:**
- Modify: `src/app/(main)/leagues/create/create-league-screen.tsx`

- [ ] **Step 1: Agregar campo `maxMembers` al formulario**

En `create-league-screen.tsx`, agregar el estado:

```typescript
const [maxMembers, setMaxMembers] = useState<string>('')
```

Agregar el campo de formulario después del campo de tipo de liga:

```tsx
<div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
  <label style={{ fontFamily: 'var(--font-jetbrains, monospace)', fontSize: 11, letterSpacing: '0.08em', color: 'var(--fg-dim)' }}>
    LÍMITE DE MIEMBROS (vacío = sin límite)
  </label>
  <input
    type="number"
    min="2"
    max="200"
    placeholder="Ej: 10"
    value={maxMembers}
    onChange={e => setMaxMembers(e.target.value)}
    style={{
      padding: '12px 16px', borderRadius: 10, background: 'var(--surface)',
      border: '1px solid var(--line)', color: 'var(--fg)',
      fontFamily: 'var(--font-inter, sans-serif)', fontSize: 14, outline: 'none',
    }}
  />
</div>
```

En el submit, incluir `maxMembers`:

```typescript
body: JSON.stringify({
  name,
  type,
  maxMembers: maxMembers ? parseInt(maxMembers, 10) : null,
})
```

- [ ] **Step 2: Commit**

```bash
git add src/app/(main)/leagues/create/create-league-screen.tsx
git commit -m "feat(ui): add maxMembers field to create league form"
```

---

### Task 6: Mostrar el límite en LeagueDetailScreen

**Files:**
- Modify: `src/app/(main)/leagues/[id]/league-detail-screen.tsx`

- [ ] **Step 1: Actualizar el header de la liga para mostrar X / max**

En `league-detail-screen.tsx`, la línea que muestra el conteo de miembros:

```tsx
{league.type === 'PRIVATE' ? '🔒 PRIVADA' : '🌐 PÚBLICA'} ·{' '}
{league.memberCount}{league.maxMembers ? `/${league.maxMembers}` : ''} miembros
```

- [ ] **Step 2: Mostrar aviso visual cuando la liga está llena**

Después del header, agregar:

```tsx
{league.maxMembers && (league.memberCount ?? 0) >= league.maxMembers && (
  <div style={{
    marginBottom: 16, padding: '10px 14px', borderRadius: 8,
    background: 'rgba(255,80,80,0.1)', border: '1px solid rgba(255,80,80,0.3)',
    color: 'var(--danger)', fontSize: 13, fontWeight: 700,
  }}>
    Liga llena — se alcanzó el límite de {league.maxMembers} miembros
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
git commit -m "feat(ui): show member limit and full-league warning in league detail"
```
