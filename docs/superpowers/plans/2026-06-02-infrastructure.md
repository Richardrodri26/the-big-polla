# Fase 4: Infraestructura — Implementation Plan

> **Para agentes:** REQUIRED SUB-SKILL: Usar `superpowers:subagent-driven-development` (recomendado) o `superpowers:executing-plans` para implementar tarea a tarea. Los pasos usan sintaxis de checkbox (`- [ ]`) para tracking.

**Goal:** Agregar la capa de infraestructura real: PostgreSQL en Docker, Prisma schema, autenticación con `better-auth`, e implementaciones Prisma de los tres repositorios existentes.

**Architecture:** Docker Compose levanta un PostgreSQL 16. Prisma gestiona el schema y las migraciones. `better-auth` usa el Prisma adapter para manejar sesiones con email/password. Los tres repositorios (`Match`, `League`, `Prediction`) obtienen implementaciones Prisma que satisfacen las interfaces existentes en `src/repositories/interfaces/index.ts`. El factory `src/repositories/index.ts` ya tiene el switch por `NEXT_PUBLIC_DATA_SOURCE` — solo hay que implementar las clases concretas y activar el switch al final.

**Tech Stack:** Next.js 16 App Router · PostgreSQL 16 (Docker) · Prisma 6 · better-auth v1 · Vitest · TypeScript

---

## File Structure

### Archivos nuevos
- `docker-compose.yml` — PostgreSQL 16 local
- `.env.local` — variables de entorno (no se commitea)
- `prisma/schema.prisma` — schema completo: User, Session, Account, Verification, League, LeagueMember, LeagueRequest, Match, Prediction, Score, ScoreLog
- `src/lib/prisma.ts` — singleton PrismaClient con hot-reload en dev
- `src/lib/auth.ts` — instancia de better-auth (server only)
- `src/lib/auth-client.ts` — authClient exportado para client components
- `src/app/api/auth/[...all]/route.ts` — handler HTTP de better-auth
- `src/app/(auth)/layout.tsx` — layout centrado sin sidebar ni bottomnav
- `src/app/(auth)/login/page.tsx` — server component: redirect si ya hay sesión
- `src/app/(auth)/login/login-screen.tsx` — client component: formulario de login
- `src/app/(auth)/register/page.tsx` — server component: redirect si ya hay sesión
- `src/app/(auth)/register/register-screen.tsx` — client component: formulario de registro
- `src/middleware.ts` — protege rutas de la app, redirige a /login si no hay sesión
- `src/repositories/prisma/match.repository.ts` — IMatchRepository sobre Prisma
- `src/repositories/prisma/prediction.repository.ts` — IPredictionRepository sobre Prisma
- `src/repositories/prisma/league.repository.ts` — ILeagueRepository sobre Prisma
- `vitest.config.ts` — configuración Vitest con alias `@/`
- `src/__tests__/repositories/match.test.ts`
- `src/__tests__/repositories/prediction.test.ts`
- `src/__tests__/repositories/league.test.ts`

### Archivos modificados
- `package.json` — agregar: `prisma`, `@prisma/client`, `better-auth`, `@better-fetch/fetch`, `vitest`, `@vitest/coverage-v8`
- `src/repositories/index.ts` — reemplazar los `throw Error()` con instanciación lazy de repos Prisma

---

## Tasks

### Task 1: Docker Compose + variables de entorno

**Files:**
- Create: `docker-compose.yml`
- Create: `.env.local`

- [ ] Crear `docker-compose.yml` en la raíz del proyecto:

```yaml
version: '3.9'

services:
  db:
    image: postgres:16-alpine
    restart: unless-stopped
    ports:
      - '5432:5432'
    environment:
      POSTGRES_USER: polla
      POSTGRES_PASSWORD: polla_dev
      POSTGRES_DB: the_big_polla
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

- [ ] Verificar que `.gitignore` tiene `.env.local` (debería ya estar por Next.js):

```bash
grep -n ".env.local" .gitignore
```

Esperado: aparece `.env.local` en la lista.

- [ ] Crear `.env.local` en la raíz:

```
DATABASE_URL="postgresql://polla:polla_dev@localhost:5432/the_big_polla"
BETTER_AUTH_SECRET="dev-secret-change-in-production-min32chars!!"
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_DATA_SOURCE="mock"
```

> `NEXT_PUBLIC_DATA_SOURCE` queda en `"mock"` hasta la Task 10. Esto permite trabajar en el resto del plan sin romper la app mientras se construyen los repos Prisma.

- [ ] Levantar la base de datos:

```bash
docker compose up -d
```

- [ ] Verificar que el contenedor está corriendo:

```bash
docker compose ps
```

Esperado: columna `Status` muestra `running` o `Up`.

- [ ] Commit:

```bash
git add docker-compose.yml
git commit -m "chore(infra): add docker compose with postgresql 16"
```

---

### Task 2: Prisma — instalación, schema y primera migración

**Files:**
- Create: `prisma/schema.prisma`
- Modify: `package.json`

- [ ] Instalar Prisma:

```bash
npm install prisma @prisma/client
```

- [ ] Inicializar Prisma (crea la carpeta `prisma/` y apunta al datasource):

```bash
npx prisma init --datasource-provider postgresql
```

> Esto genera `prisma/schema.prisma` y agrega `DATABASE_URL` a `.env`. Ignorar el `.env` que crea Prisma — ya tenemos `.env.local` con esa variable.

- [ ] Reemplazar el contenido de `prisma/schema.prisma` con el schema completo:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── better-auth tables ───────────────────────────────────────────────────────

model User {
  id            String   @id
  name          String
  email         String   @unique
  emailVerified Boolean  @default(false)
  image         String?
  handle        String   @unique
  color         String   @default("#00D26A")
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  sessions          Session[]
  accounts          Account[]
  predictions       Prediction[]
  scores            Score[]
  leagueRequests    LeagueRequest[]
  ownedLeagues      League[]        @relation("LeagueOwner")
  leagueMemberships LeagueMember[]
}

model Session {
  id        String   @id
  expiresAt DateTime
  token     String   @unique
  ipAddress String?
  userAgent String?
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Account {
  id                    String    @id
  accountId             String
  providerId            String
  userId                String
  user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  accessToken           String?
  refreshToken          String?
  idToken               String?
  accessTokenExpiresAt  DateTime?
  refreshTokenExpiresAt DateTime?
  scope                 String?
  password              String?
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
}

model Verification {
  id         String   @id
  identifier String
  value      String
  expiresAt  DateTime
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}

// ─── domain tables ────────────────────────────────────────────────────────────

model League {
  id        String     @id @default(cuid())
  name      String
  ownerId   String
  owner     User       @relation("LeagueOwner", fields: [ownerId], references: [id])
  type      LeagueType @default(PRIVATE)
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt

  members  LeagueMember[]
  requests LeagueRequest[]
  scores   Score[]
}

enum LeagueType {
  PUBLIC
  PRIVATE
}

model LeagueMember {
  id       String   @id @default(cuid())
  leagueId String
  league   League   @relation(fields: [leagueId], references: [id])
  userId   String
  user     User     @relation(fields: [userId], references: [id])
  joinedAt DateTime @default(now())

  @@unique([leagueId, userId])
}

model LeagueRequest {
  id        String              @id @default(cuid())
  leagueId  String
  league    League              @relation(fields: [leagueId], references: [id])
  userId    String
  user      User                @relation(fields: [userId], references: [id])
  status    LeagueRequestStatus @default(PENDING)
  createdAt DateTime            @default(now())
  updatedAt DateTime            @updatedAt

  @@unique([leagueId, userId])
}

enum LeagueRequestStatus {
  PENDING
  APPROVED
  REJECTED
}

model Match {
  id           String     @id
  state        MatchState @default(PENDING)
  kickoffAt    DateTime
  venue        String
  stage        String
  homeTeamCode String
  homeTeamName String
  homeTeamC1   String
  homeTeamC2   String
  awayTeamCode String
  awayTeamName String
  awayTeamC1   String
  awayTeamC2   String
  locked       Boolean    @default(false)
  liveMinute   Int?
  homeScore    Int?
  awayScore    Int?
  timeline     Json?
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt

  predictions Prediction[]
}

enum MatchState {
  PENDING
  LIVE
  FINAL
}

model Prediction {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  matchId   String
  match     Match    @relation(fields: [matchId], references: [id])
  homeScore Int
  awayScore Int
  savedAt   DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([userId, matchId])
}

model Score {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  leagueId  String
  league    League   @relation(fields: [leagueId], references: [id])
  pts       Int      @default(0)
  hits      Int      @default(0)
  streak    Int      @default(0)
  rank      Int      @default(0)
  prevRank  Int      @default(0)
  breakdown Json     @default("{}")
  updatedAt DateTime @updatedAt

  logs ScoreLog[]

  @@unique([userId, leagueId])
}

model ScoreLog {
  id        String   @id @default(cuid())
  scoreId   String
  score     Score    @relation(fields: [scoreId], references: [id])
  matchId   String
  pts       Int
  type      String
  detail    Json     @default("{}")
  createdAt DateTime @default(now())
}
```

- [ ] Correr la primera migración (la DB debe estar corriendo):

```bash
npx prisma migrate dev --name init
```

Esperado: `Your database is now in sync with your schema.` y la carpeta `prisma/migrations/` creada.

- [ ] Generar el Prisma client:

```bash
npx prisma generate
```

Esperado: `Generated Prisma Client (v6.x.x)`.

- [ ] Commit:

```bash
git add prisma/ package.json package-lock.json
git commit -m "feat(infra): add prisma schema with all domain tables and first migration"
```

---

### Task 3: Vitest setup

**Files:**
- Create: `vitest.config.ts`
- Modify: `package.json`

- [ ] Instalar Vitest:

```bash
npm install -D vitest @vitest/coverage-v8
```

- [ ] Crear `vitest.config.ts` en la raíz:

```ts
import path from 'path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

- [ ] Agregar los scripts de test en `package.json` (dentro de `"scripts"`):

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] Verificar que Vitest arranca sin errores de configuración:

```bash
npm test
```

Esperado: `No test files found, exiting with code 0` o mensaje similar — sin errores de configuración.

- [ ] Commit:

```bash
git add vitest.config.ts package.json package-lock.json
git commit -m "chore(infra): add vitest"
```

---

### Task 4: better-auth — servidor, API route y cliente

**Files:**
- Create: `src/lib/prisma.ts`
- Create: `src/lib/auth.ts`
- Create: `src/lib/auth-client.ts`
- Create: `src/app/api/auth/[...all]/route.ts`

- [ ] Instalar better-auth:

```bash
npm install better-auth @better-fetch/fetch
```

- [ ] Crear `src/lib/prisma.ts` (singleton con hot-reload seguro en dev):

```ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

- [ ] Crear `src/lib/auth.ts`:

```ts
import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { prisma } from './prisma'

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  emailAndPassword: { enabled: true },
  user: {
    additionalFields: {
      handle: {
        type: 'string',
        required: true,
        unique: true,
        input: true,
      },
      color: {
        type: 'string',
        defaultValue: '#00D26A',
        input: false,
      },
    },
  },
})

export type Session = typeof auth.$Infer.Session
export type AuthUser = typeof auth.$Infer.Session.user
```

- [ ] Crear `src/app/api/auth/[...all]/route.ts`:

```ts
import { auth } from '@/lib/auth'
import { toNextJsHandler } from 'better-auth/next-js'

export const { GET, POST } = toNextJsHandler(auth)
```

- [ ] Crear `src/lib/auth-client.ts`:

```ts
import { createAuthClient } from 'better-auth/react'

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
})

export const { signIn, signOut, signUp, useSession } = authClient
```

- [ ] Verificar TypeScript sin errores:

```bash
npx tsc --noEmit
```

Esperado: sin errores.

- [ ] Commit:

```bash
git add src/lib/prisma.ts src/lib/auth.ts src/lib/auth-client.ts "src/app/api/auth/[...all]/route.ts"
git commit -m "feat(auth): add better-auth server, api route, and client"
```

---

### Task 5: Auth screens — login y register

**Files:**
- Create: `src/app/(auth)/layout.tsx`
- Create: `src/app/(auth)/login/page.tsx`
- Create: `src/app/(auth)/login/login-screen.tsx`
- Create: `src/app/(auth)/register/page.tsx`
- Create: `src/app/(auth)/register/register-screen.tsx`

- [ ] Crear `src/app/(auth)/layout.tsx` (sin sidebar, sin bottomnav):

```tsx
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg)',
      padding: '20px',
    }}>
      {children}
    </div>
  )
}
```

- [ ] Crear `src/app/(auth)/login/page.tsx`:

```tsx
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { LoginScreen } from './login-screen'

export default async function LoginPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (session) redirect('/feed')
  return <LoginScreen />
}
```

- [ ] Crear `src/app/(auth)/login/login-screen.tsx`:

```tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signIn } from '@/lib/auth-client'

export function LoginScreen() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error: err } = await signIn.email({ email, password, callbackURL: '/feed' })
    if (err) {
      setError(err.message ?? 'Error al iniciar sesión')
      setLoading(false)
    } else {
      router.push('/feed')
    }
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
    <div style={{ width: '100%', maxWidth: 400 }}>
      <div style={{ marginBottom: 32, textAlign: 'center' }}>
        <div className="t-eyebrow" style={{ marginBottom: 8 }}>THE BIG POLLA</div>
        <h1 style={{
          fontFamily: 'var(--font-inter, sans-serif)',
          fontWeight: 900,
          fontSize: 36,
          letterSpacing: '-0.05em',
          fontVariationSettings: '"wdth" 75',
          margin: 0,
        }}>INICIAR SESIÓN</h1>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label className="t-eyebrow" style={{ display: 'block', marginBottom: 6 }}>EMAIL</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            placeholder="vos@ejemplo.com"
            style={inputStyle}
          />
        </div>

        <div>
          <label className="t-eyebrow" style={{ display: 'block', marginBottom: 6 }}>CONTRASEÑA</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            placeholder="••••••••"
            style={inputStyle}
          />
        </div>

        {error && (
          <div style={{
            padding: '10px 14px',
            background: 'rgba(255,61,113,0.1)',
            border: '1px solid rgba(255,61,113,0.3)',
            borderRadius: 8,
          }}>
            <span className="t-meta" style={{ color: 'var(--danger)', textTransform: 'none', fontSize: 12 }}>
              {error}
            </span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary btn-block"
          style={{ marginTop: 6 }}
        >
          {loading ? 'Entrando…' : 'Entrar →'}
        </button>
      </form>

      <p className="t-meta" style={{ marginTop: 20, textAlign: 'center', textTransform: 'none', letterSpacing: '0.02em' }}>
        ¿No tenés cuenta?{' '}
        <Link href="/register" style={{ color: 'var(--signal)', fontWeight: 700 }}>Registrate</Link>
      </p>
    </div>
  )
}
```

- [ ] Crear `src/app/(auth)/register/page.tsx`:

```tsx
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { RegisterScreen } from './register-screen'

export default async function RegisterPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (session) redirect('/feed')
  return <RegisterScreen />
}
```

- [ ] Crear `src/app/(auth)/register/register-screen.tsx`:

```tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signUp } from '@/lib/auth-client'

export function RegisterScreen() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [handle, setHandle] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: err } = await (signUp.email as any)({
      name,
      email,
      password,
      handle,
      callbackURL: '/feed',
    })
    if (err) {
      setError(err.message ?? 'Error al registrarse')
      setLoading(false)
    } else {
      router.push('/feed')
    }
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
    <div style={{ width: '100%', maxWidth: 400 }}>
      <div style={{ marginBottom: 32, textAlign: 'center' }}>
        <div className="t-eyebrow" style={{ marginBottom: 8 }}>THE BIG POLLA</div>
        <h1 style={{
          fontFamily: 'var(--font-inter, sans-serif)',
          fontWeight: 900,
          fontSize: 36,
          letterSpacing: '-0.05em',
          fontVariationSettings: '"wdth" 75',
          margin: 0,
        }}>REGISTRARSE</h1>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label className="t-eyebrow" style={{ display: 'block', marginBottom: 6 }}>NOMBRE</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            placeholder="Tu nombre"
            style={inputStyle}
          />
        </div>

        <div>
          <label className="t-eyebrow" style={{ display: 'block', marginBottom: 6 }}>HANDLE</label>
          <input
            type="text"
            value={handle}
            onChange={e => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
            required
            placeholder="tu_handle"
            style={{ ...inputStyle, fontFamily: 'var(--font-jetbrains, monospace)', fontSize: 13 }}
          />
        </div>

        <div>
          <label className="t-eyebrow" style={{ display: 'block', marginBottom: 6 }}>EMAIL</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            placeholder="vos@ejemplo.com"
            style={inputStyle}
          />
        </div>

        <div>
          <label className="t-eyebrow" style={{ display: 'block', marginBottom: 6 }}>CONTRASEÑA</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={8}
            placeholder="Mínimo 8 caracteres"
            style={inputStyle}
          />
        </div>

        {error && (
          <div style={{
            padding: '10px 14px',
            background: 'rgba(255,61,113,0.1)',
            border: '1px solid rgba(255,61,113,0.3)',
            borderRadius: 8,
          }}>
            <span className="t-meta" style={{ color: 'var(--danger)', textTransform: 'none', fontSize: 12 }}>
              {error}
            </span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary btn-block"
          style={{ marginTop: 6 }}
        >
          {loading ? 'Registrando…' : 'Crear cuenta →'}
        </button>
      </form>

      <p className="t-meta" style={{ marginTop: 20, textAlign: 'center', textTransform: 'none', letterSpacing: '0.02em' }}>
        ¿Ya tenés cuenta?{' '}
        <Link href="/login" style={{ color: 'var(--signal)', fontWeight: 700 }}>Iniciá sesión</Link>
      </p>
    </div>
  )
}
```

- [ ] Verificar TypeScript:

```bash
npx tsc --noEmit
```

Esperado: sin errores.

- [ ] Commit:

```bash
git add "src/app/(auth)/"
git commit -m "feat(auth): add login and register screens"
```

---

### Task 6: Middleware — protección de rutas

**Files:**
- Create: `src/middleware.ts`

> El middleware de Next.js corre en el Edge runtime. Para validar la sesión se usa `betterFetch` para llamar al endpoint `/api/auth/get-session` con la cookie del request actual.

- [ ] Crear `src/middleware.ts`:

```ts
import { betterFetch } from '@better-fetch/fetch'
import { NextRequest, NextResponse } from 'next/server'

interface SessionResponse {
  user: { id: string; email: string; name: string } | null
  session: { id: string; expiresAt: string } | null
}

export async function middleware(req: NextRequest) {
  const { data } = await betterFetch<SessionResponse>('/api/auth/get-session', {
    baseURL: req.nextUrl.origin,
    headers: { cookie: req.headers.get('cookie') ?? '' },
  })

  if (!data?.user) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/feed/:path*',
    '/leaderboard/:path*',
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

Esperado: sin errores.

- [ ] Verificar el flujo manualmente con el servidor corriendo (`npm run dev`):
  1. Abrir `http://localhost:3000/feed` sin sesión → debe redirigir a `/login`
  2. Registrarse en `/register` → debe redirigir a `/feed`
  3. Ir a `/login` estando logueado → debe redirigir a `/feed`

- [ ] Commit:

```bash
git add src/middleware.ts
git commit -m "feat(auth): add route protection middleware"
```

---

### Task 7: Prisma Match Repository

**Files:**
- Create: `src/repositories/prisma/match.repository.ts`
- Create: `src/__tests__/repositories/match.test.ts`

- [ ] Escribir primero el test en `src/__tests__/repositories/match.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PrismaMatchRepository } from '@/repositories/prisma/match.repository'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    match: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}))

import { prisma } from '@/lib/prisma'

const mockRow = {
  id: 'm1',
  state: 'PENDING',
  kickoffAt: new Date('2026-06-15T18:00:00Z'),
  venue: 'Estadio Azteca, CDMX',
  stage: 'Grupo A',
  homeTeamCode: 'ARG',
  homeTeamName: 'Argentina',
  homeTeamC1: '#74ACDF',
  homeTeamC2: '#FFFFFF',
  awayTeamCode: 'FRA',
  awayTeamName: 'Francia',
  awayTeamC1: '#0055A4',
  awayTeamC2: '#EF4135',
  locked: false,
  liveMinute: null,
  homeScore: null,
  awayScore: null,
  timeline: null,
  createdAt: new Date(),
  updatedAt: new Date(),
}

describe('PrismaMatchRepository', () => {
  let repo: PrismaMatchRepository

  beforeEach(() => {
    repo = new PrismaMatchRepository()
    vi.clearAllMocks()
  })

  describe('getMatches', () => {
    it('maps prisma row to domain Match', async () => {
      vi.mocked(prisma.match.findMany).mockResolvedValue([mockRow] as any)

      const matches = await repo.getMatches()

      expect(matches).toHaveLength(1)
      expect(matches[0]).toMatchObject({
        id: 'm1',
        state: 'pending',
        venue: 'Estadio Azteca, CDMX',
        home: { code: 'ARG', name: 'Argentina', c1: '#74ACDF', c2: '#FFFFFF' },
        away: { code: 'FRA', name: 'Francia', c1: '#0055A4', c2: '#EF4135' },
        locked: false,
      })
    })

    it('maps homeScore/awayScore to score tuple when both are present', async () => {
      vi.mocked(prisma.match.findMany).mockResolvedValue([
        { ...mockRow, state: 'FINAL', homeScore: 2, awayScore: 1 },
      ] as any)

      const [match] = await repo.getMatches()

      expect(match.score).toEqual([2, 1])
    })

    it('leaves score undefined when homeScore is null', async () => {
      vi.mocked(prisma.match.findMany).mockResolvedValue([mockRow] as any)

      const [match] = await repo.getMatches()

      expect(match.score).toBeUndefined()
    })

    it('passes state filter as uppercase to prisma', async () => {
      vi.mocked(prisma.match.findMany).mockResolvedValue([])

      await repo.getMatches({ state: 'live' })

      expect(prisma.match.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { state: 'LIVE' } })
      )
    })
  })

  describe('getMatch', () => {
    it('returns null when not found', async () => {
      vi.mocked(prisma.match.findUnique).mockResolvedValue(null)

      expect(await repo.getMatch('nonexistent')).toBeNull()
    })

    it('returns domain Match when found', async () => {
      vi.mocked(prisma.match.findUnique).mockResolvedValue(mockRow as any)

      expect((await repo.getMatch('m1'))?.id).toBe('m1')
    })
  })
})
```

- [ ] Correr el test para verificar que falla por módulo faltante:

```bash
npm test src/__tests__/repositories/match.test.ts
```

Esperado: `Cannot find module '@/repositories/prisma/match.repository'`.

- [ ] Crear `src/repositories/prisma/match.repository.ts`:

```ts
import { prisma } from '@/lib/prisma'
import type { IMatchRepository } from '@/repositories/interfaces'
import type { Match, MatchState, MatchTimeline } from '@/types/domain'
import type { Match as PrismaMatch } from '@prisma/client'

function toDomainMatch(m: PrismaMatch): Match {
  return {
    id: m.id,
    state: m.state.toLowerCase() as MatchState,
    kickoffAt: m.kickoffAt.toISOString(),
    venue: m.venue,
    stage: m.stage,
    locked: m.locked,
    home: { code: m.homeTeamCode, name: m.homeTeamName, c1: m.homeTeamC1, c2: m.homeTeamC2 },
    away: { code: m.awayTeamCode, name: m.awayTeamName, c1: m.awayTeamC1, c2: m.awayTeamC2 },
    ...(m.liveMinute !== null && { liveMinute: m.liveMinute }),
    ...(m.homeScore !== null && m.awayScore !== null && {
      score: [m.homeScore, m.awayScore] as [number, number],
    }),
    ...(m.timeline && { timeline: m.timeline as MatchTimeline[] }),
  }
}

export class PrismaMatchRepository implements IMatchRepository {
  async getMatches(filters?: { state?: MatchState }): Promise<Match[]> {
    const rows = await prisma.match.findMany({
      where: filters?.state ? { state: filters.state.toUpperCase() } : undefined,
      orderBy: { kickoffAt: 'asc' },
    })
    return rows.map(toDomainMatch)
  }

  async getMatch(id: string): Promise<Match | null> {
    const row = await prisma.match.findUnique({ where: { id } })
    return row ? toDomainMatch(row) : null
  }
}
```

- [ ] Correr el test para verificar que pasa:

```bash
npm test src/__tests__/repositories/match.test.ts
```

Esperado: `5 tests passed`.

- [ ] Commit:

```bash
git add src/repositories/prisma/match.repository.ts "src/__tests__/repositories/match.test.ts"
git commit -m "feat(repositories): add prisma match repository"
```

---

### Task 8: Prisma Prediction Repository

**Files:**
- Create: `src/repositories/prisma/prediction.repository.ts`
- Create: `src/__tests__/repositories/prediction.test.ts`

- [ ] Escribir el test en `src/__tests__/repositories/prediction.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PrismaPredictionRepository } from '@/repositories/prisma/prediction.repository'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    prediction: {
      findMany: vi.fn(),
      upsert: vi.fn(),
    },
  },
}))

import { prisma } from '@/lib/prisma'

const mockRow = {
  id: 'pred1',
  userId: 'user1',
  matchId: 'm1',
  homeScore: 2,
  awayScore: 1,
  savedAt: new Date('2026-06-10T12:00:00Z'),
  updatedAt: new Date('2026-06-10T12:00:00Z'),
}

describe('PrismaPredictionRepository', () => {
  let repo: PrismaPredictionRepository

  beforeEach(() => {
    repo = new PrismaPredictionRepository('user1')
    vi.clearAllMocks()
  })

  describe('getPredictions', () => {
    it('queries by userId and maps to domain Prediction', async () => {
      vi.mocked(prisma.prediction.findMany).mockResolvedValue([mockRow] as any)

      const preds = await repo.getPredictions('user1')

      expect(prisma.prediction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 'user1' } })
      )
      expect(preds).toHaveLength(1)
      expect(preds[0]).toMatchObject({
        matchId: 'm1',
        score: [2, 1],
        savedAt: '2026-06-10T12:00:00.000Z',
      })
    })
  })

  describe('savePrediction', () => {
    it('upserts using composite key userId + matchId', async () => {
      vi.mocked(prisma.prediction.upsert).mockResolvedValue(mockRow as any)

      await repo.savePrediction('m1', [2, 1])

      expect(prisma.prediction.upsert).toHaveBeenCalledWith({
        where: { userId_matchId: { userId: 'user1', matchId: 'm1' } },
        update: { homeScore: 2, awayScore: 1 },
        create: { userId: 'user1', matchId: 'm1', homeScore: 2, awayScore: 1 },
      })
    })
  })
})
```

- [ ] Correr el test para verificar que falla:

```bash
npm test src/__tests__/repositories/prediction.test.ts
```

Esperado: `Cannot find module '@/repositories/prisma/prediction.repository'`.

- [ ] Crear `src/repositories/prisma/prediction.repository.ts`:

```ts
import { prisma } from '@/lib/prisma'
import type { IPredictionRepository } from '@/repositories/interfaces'
import type { Prediction } from '@/types/domain'
import type { Prediction as PrismaPrediction } from '@prisma/client'

function toDomainPrediction(p: PrismaPrediction): Prediction {
  return {
    matchId: p.matchId,
    score: [p.homeScore, p.awayScore] as [number, number],
    savedAt: p.savedAt.toISOString(),
  }
}

export class PrismaPredictionRepository implements IPredictionRepository {
  constructor(private readonly userId: string) {}

  async getPredictions(userId: string): Promise<Prediction[]> {
    const rows = await prisma.prediction.findMany({ where: { userId } })
    return rows.map(toDomainPrediction)
  }

  async savePrediction(matchId: string, score: [number, number]): Promise<void> {
    const [homeScore, awayScore] = score
    await prisma.prediction.upsert({
      where: { userId_matchId: { userId: this.userId, matchId } },
      update: { homeScore, awayScore },
      create: { userId: this.userId, matchId, homeScore, awayScore },
    })
  }
}
```

- [ ] Correr el test para verificar que pasa:

```bash
npm test src/__tests__/repositories/prediction.test.ts
```

Esperado: `2 tests passed`.

- [ ] Commit:

```bash
git add src/repositories/prisma/prediction.repository.ts "src/__tests__/repositories/prediction.test.ts"
git commit -m "feat(repositories): add prisma prediction repository"
```

---

### Task 9: Prisma League Repository

**Files:**
- Create: `src/repositories/prisma/league.repository.ts`
- Create: `src/__tests__/repositories/league.test.ts`

> `Score` se popula en Fase 5 (motor de puntuación). Este repo devuelve `pts: 0` y `rank: i+1` cuando no hay Score para un miembro. `getBadges` devuelve array vacío hasta Fase 5.

- [ ] Escribir el test en `src/__tests__/repositories/league.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PrismaLeagueRepository } from '@/repositories/prisma/league.repository'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    leagueMember: { findMany: vi.fn() },
    score: { findMany: vi.fn() },
  },
}))

import { prisma } from '@/lib/prisma'

const mockMember = {
  id: 'lm1',
  leagueId: 'league1',
  userId: 'user1',
  joinedAt: new Date(),
  user: { id: 'user1', name: 'Richard', handle: 'richard', color: '#00D26A' },
}

const mockScore = {
  userId: 'user1',
  pts: 42,
  hits: 10,
  streak: 3,
  rank: 1,
  prevRank: 2,
  breakdown: { exact: 5, diff: 3, winner: 2, streakBonus: 1, comboBonus: 0, oraclePartial: 0 },
}

describe('PrismaLeagueRepository', () => {
  let repo: PrismaLeagueRepository

  beforeEach(() => {
    repo = new PrismaLeagueRepository('user1')
    vi.clearAllMocks()
  })

  describe('getMembers', () => {
    it('returns members with score data when score exists', async () => {
      vi.mocked(prisma.leagueMember.findMany).mockResolvedValue([mockMember] as any)
      vi.mocked(prisma.score.findMany).mockResolvedValue([mockScore] as any)

      const members = await repo.getMembers('league1')

      expect(members).toHaveLength(1)
      expect(members[0]).toMatchObject({
        id: 'user1',
        name: 'Richard',
        handle: 'richard',
        pts: 42,
        hits: 10,
        streak: 3,
        rank: 1,
        prevRank: 2,
        me: true,
      })
    })

    it('returns pts 0 and rank i+1 when no score for member', async () => {
      vi.mocked(prisma.leagueMember.findMany).mockResolvedValue([mockMember] as any)
      vi.mocked(prisma.score.findMany).mockResolvedValue([])

      const members = await repo.getMembers('league1')

      expect(members[0].pts).toBe(0)
      expect(members[0].rank).toBe(1)
    })
  })

  describe('getLeaderboard', () => {
    it('returns members sorted by pts descending', async () => {
      const member2 = {
        ...mockMember,
        id: 'lm2',
        userId: 'user2',
        user: { id: 'user2', name: 'Ana', handle: 'ana', color: '#FF4B4B' },
      }
      vi.mocked(prisma.leagueMember.findMany).mockResolvedValue([mockMember, member2] as any)
      vi.mocked(prisma.score.findMany).mockResolvedValue([
        mockScore,
        { ...mockScore, userId: 'user2', pts: 10, rank: 2, prevRank: 1 },
      ] as any)

      const leaderboard = await repo.getLeaderboard('league1')

      expect(leaderboard[0].pts).toBeGreaterThan(leaderboard[1].pts)
      expect(leaderboard[0].id).toBe('user1')
    })
  })

  describe('getScoringRules', () => {
    it('returns default rules', async () => {
      const rules = await repo.getScoringRules('league1')

      expect(rules).toMatchObject({ exact: 5, diff: 3, winner: 1, streakStep: 1, streakMax: 5 })
    })
  })
})
```

- [ ] Correr el test para verificar que falla:

```bash
npm test src/__tests__/repositories/league.test.ts
```

Esperado: `Cannot find module '@/repositories/prisma/league.repository'`.

- [ ] Crear `src/repositories/prisma/league.repository.ts`:

```ts
import { prisma } from '@/lib/prisma'
import type { ILeagueRepository } from '@/repositories/interfaces'
import type { Badge, Member, ScoringRules } from '@/types/domain'

const DEFAULT_SCORING_RULES: ScoringRules = {
  exact: 5,
  diff: 3,
  winner: 1,
  streakStep: 1,
  streakMax: 5,
  combo: 0,
  oracleChampion: 50,
}

export class PrismaLeagueRepository implements ILeagueRepository {
  constructor(private readonly currentUserId?: string) {}

  private async getMembersWithScores(leagueId: string): Promise<Member[]> {
    const [members, scores] = await Promise.all([
      prisma.leagueMember.findMany({
        where: { leagueId },
        include: { user: { select: { id: true, name: true, handle: true, color: true } } },
      }),
      prisma.score.findMany({ where: { leagueId } }),
    ])

    const scoreMap = new Map(scores.map(s => [s.userId, s]))

    return members.map((m, i) => {
      const s = scoreMap.get(m.userId)
      return {
        id: m.userId,
        name: m.user.name,
        handle: m.user.handle,
        color: m.user.color,
        rank: s?.rank ?? i + 1,
        prevRank: s?.prevRank ?? i + 1,
        pts: s?.pts ?? 0,
        hits: s?.hits ?? 0,
        streak: s?.streak ?? 0,
        me: m.userId === this.currentUserId,
        breakdown: (s?.breakdown as Member['breakdown']) ?? {
          exact: 0, diff: 0, winner: 0, streakBonus: 0, comboBonus: 0, oraclePartial: 0,
        },
      }
    })
  }

  async getLeaderboard(leagueId: string): Promise<Member[]> {
    const members = await this.getMembersWithScores(leagueId)
    return members.sort((a, b) => b.pts - a.pts)
  }

  async getMembers(leagueId: string): Promise<Member[]> {
    return this.getMembersWithScores(leagueId)
  }

  async getScoringRules(_leagueId: string): Promise<ScoringRules> {
    return DEFAULT_SCORING_RULES
  }

  async getBadges(_userId: string): Promise<Badge[]> {
    return []
  }
}
```

- [ ] Correr el test para verificar que pasa:

```bash
npm test src/__tests__/repositories/league.test.ts
```

Esperado: `4 tests passed`.

- [ ] Commit:

```bash
git add src/repositories/prisma/league.repository.ts "src/__tests__/repositories/league.test.ts"
git commit -m "feat(repositories): add prisma league repository"
```

---

### Task 10: Wire factory + activar modo API

**Files:**
- Modify: `src/repositories/index.ts`
- Modify: `.env.local`

- [ ] Reemplazar `src/repositories/index.ts` con:

```ts
import type { ILeagueRepository, IMatchRepository, IPredictionRepository } from '@/repositories/interfaces'

const source = process.env.NEXT_PUBLIC_DATA_SOURCE ?? 'mock'

export function getMatchRepository(): IMatchRepository {
  if (source === 'api') {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaMatchRepository } = require('@/repositories/prisma/match.repository')
    return new PrismaMatchRepository()
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { MockMatchRepository } = require('@/repositories/mock/match.repository')
  return new MockMatchRepository()
}

export function getLeagueRepository(userId?: string): ILeagueRepository {
  if (source === 'api') {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaLeagueRepository } = require('@/repositories/prisma/league.repository')
    return new PrismaLeagueRepository(userId)
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { MockLeagueRepository } = require('@/repositories/mock/league.repository')
  return new MockLeagueRepository()
}

export function getPredictionRepository(userId?: string): IPredictionRepository {
  if (source === 'api') {
    if (!userId) throw new Error('userId required for PrismaPredictionRepository in api mode')
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaPredictionRepository } = require('@/repositories/prisma/prediction.repository')
    return new PrismaPredictionRepository(userId)
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { MockPredictionRepository } = require('@/repositories/mock/prediction.repository')
  return new MockPredictionRepository()
}
```

- [ ] Correr todos los tests para verificar que nada se rompió:

```bash
npm test
```

Esperado: los 11 tests pasan.

- [ ] Verificar que el build con `mock` sigue limpio:

```bash
npm run build
```

Esperado: build sin errores.

- [ ] Cambiar `NEXT_PUBLIC_DATA_SOURCE` en `.env.local` de `"mock"` a `"api"`:

```
NEXT_PUBLIC_DATA_SOURCE="api"
```

- [ ] Verificar que la app corre y carga datos desde la DB:

```bash
npm run dev
```

Abrir `http://localhost:3000/feed` — la lista de partidos debe estar vacía (la DB está vacía) pero sin errores de runtime en consola.

- [ ] Commit:

```bash
git add src/repositories/index.ts
git commit -m "feat(repositories): wire prisma repositories in factory"
```

---

## Auto-review

**Spec coverage:**
- ✅ PostgreSQL via Docker Compose — Task 1
- ✅ Prisma schema con todos los modelos del ROADMAP (User, League, LeagueMember, LeagueRequest, Match, Prediction, Score, ScoreLog) — Task 2
- ✅ Auth con `better-auth` (server + API route + client) — Task 4
- ✅ Auth UI (login + register + layout) — Task 5
- ✅ Protección de rutas — Task 6
- ✅ API routes — Match repository — Task 7
- ✅ API routes — Prediction repository — Task 8
- ✅ API routes — League repository — Task 9
- ✅ Factory wired, switch activable por env var — Task 10

**Fuera de scope (Fase 5):**
- Motor de puntuación — `Score` y `ScoreLog` existen en el schema pero no se calculan aún
- Integración con API externa de partidos del Mundial 2026
- CRUD de Ligas (Fase 6)
