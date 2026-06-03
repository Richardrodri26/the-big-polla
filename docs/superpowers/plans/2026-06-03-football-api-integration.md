# Football API Integration — API Real del Mundial 2026

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reemplazar el stub `fetchExternalMatches()` con integración real a la API de football-data.org para obtener partidos del Mundial 2026 (competition code `WC`).

**Architecture:** La función `fetchExternalMatches()` en `src/lib/match-sync.ts` es el único punto de integración externa. Se mapea la respuesta de football-data.org a la interfaz `ExternalMatch`. El cron `/api/cron/sync-matches` ya llama a esa función — no hay que modificarlo.

**Tech Stack:** Next.js 15, TypeScript, Vitest

**API:** football-data.org v4. Endpoint: `GET https://api.football-data.org/v4/competitions/WC/matches`. Autenticación: header `X-Auth-Token`. Free tier: 10 req/min.

---

## File Map

- Modify: `src/lib/match-sync.ts` — implementar `fetchExternalMatches()`
- Create: `src/__tests__/lib/match-sync.test.ts` — tests de mapeo y manejo de errores
- Modify: `.env.example` — agregar `FOOTBALL_API_KEY=`

---

### Task 1: Agregar la variable de entorno

**Files:**
- Modify: `.env.example` (o crear si no existe)

- [ ] **Step 1: Agregar la variable al `.env.example`**

Si `.env.example` existe, agregar:

```
FOOTBALL_API_KEY=your_token_here
```

Si no existe, crear el archivo con ese contenido.

- [ ] **Step 2: Agregar la variable al `.env.local` real**

En `.env.local`, agregar:

```
FOOTBALL_API_KEY=<tu_token_de_football-data.org>
```

El token se obtiene en https://www.football-data.org/client/register — registro gratuito.

- [ ] **Step 3: Commit (solo .env.example, nunca .env.local)**

```bash
git add .env.example
git commit -m "chore: add FOOTBALL_API_KEY to .env.example"
```

---

### Task 2: Escribir tests del mapeo de la API

**Files:**
- Create: `src/__tests__/lib/match-sync.test.ts`

- [ ] **Step 1: Crear los tests**

```typescript
import { describe, it, expect, vi, afterEach } from 'vitest'

vi.mock('node:fetch', () => ({ default: vi.fn() }))

// La función usa fetch global — mockear globalmente
const mockFetch = vi.fn()
global.fetch = mockFetch

import { fetchExternalMatches } from '@/lib/match-sync'

const mockApiResponse = {
  matches: [
    {
      id: 417862,
      status: 'FINISHED',
      score: {
        fullTime: { home: 3, away: 0 },
      },
      minute: null,
    },
    {
      id: 417863,
      status: 'IN_PLAY',
      score: {
        fullTime: { home: null, away: null },
      },
      minute: 45,
    },
    {
      id: 417864,
      status: 'TIMED',
      score: {
        fullTime: { home: null, away: null },
      },
      minute: null,
    },
  ],
}

describe('fetchExternalMatches', () => {
  afterEach(() => vi.clearAllMocks())

  it('maps FINISHED match correctly', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockApiResponse,
    } as any)

    const matches = await fetchExternalMatches()
    const finished = matches.find(m => m.id === '417862')

    expect(finished).toBeDefined()
    expect(finished?.state).toBe('FINAL')
    expect(finished?.homeScore).toBe(3)
    expect(finished?.awayScore).toBe(0)
    expect(finished?.liveMinute).toBeNull()
  })

  it('maps IN_PLAY match correctly', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockApiResponse,
    } as any)

    const matches = await fetchExternalMatches()
    const live = matches.find(m => m.id === '417863')

    expect(live?.state).toBe('LIVE')
    expect(live?.liveMinute).toBe(45)
    expect(live?.homeScore).toBeNull()
    expect(live?.awayScore).toBeNull()
  })

  it('maps TIMED/SCHEDULED match as PENDING', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockApiResponse,
    } as any)

    const matches = await fetchExternalMatches()
    const pending = matches.find(m => m.id === '417864')

    expect(pending?.state).toBe('PENDING')
  })

  it('returns empty array when FOOTBALL_API_KEY is not set', async () => {
    const original = process.env.FOOTBALL_API_KEY
    delete process.env.FOOTBALL_API_KEY

    const matches = await fetchExternalMatches()
    expect(matches).toEqual([])
    expect(mockFetch).not.toHaveBeenCalled()

    process.env.FOOTBALL_API_KEY = original
  })

  it('returns empty array and logs error when API responds with non-ok', async () => {
    process.env.FOOTBALL_API_KEY = 'test-token'
    mockFetch.mockResolvedValue({ ok: false, status: 429, json: async () => ({}) } as any)

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const matches = await fetchExternalMatches()

    expect(matches).toEqual([])
    expect(consoleSpy).toHaveBeenCalled()
    consoleSpy.mockRestore()
  })
})
```

- [ ] **Step 2: Correr tests para verificar que fallan**

```
npx vitest run src/__tests__/lib/match-sync.test.ts
```

Expected: FAIL — las funciones de mapeo no existen aún

- [ ] **Step 3: Commit el test**

```bash
git add src/__tests__/lib/match-sync.test.ts
git commit -m "test(match-sync): add tests for fetchExternalMatches mapping"
```

---

### Task 3: Implementar `fetchExternalMatches()`

**Files:**
- Modify: `src/lib/match-sync.ts`

- [ ] **Step 1: Definir el tipo de respuesta de la API**

```typescript
interface FootballDataMatch {
  id: number
  status: 'TIMED' | 'SCHEDULED' | 'IN_PLAY' | 'PAUSED' | 'FINISHED' | 'SUSPENDED' | 'POSTPONED' | 'CANCELLED'
  score: {
    fullTime: { home: number | null; away: number | null }
  }
  minute: number | null
}

interface FootballDataResponse {
  matches: FootballDataMatch[]
}
```

- [ ] **Step 2: Implementar la función de mapeo de estado**

```typescript
function mapStatus(status: FootballDataMatch['status']): ExternalMatch['state'] {
  if (status === 'FINISHED') return 'FINAL'
  if (status === 'IN_PLAY' || status === 'PAUSED') return 'LIVE'
  return 'PENDING'
}
```

- [ ] **Step 3: Implementar `fetchExternalMatches()`**

Reemplazar el stub completo:

```typescript
export interface ExternalMatch {
  id: string
  state: 'PENDING' | 'LIVE' | 'FINAL'
  homeScore: number | null
  awayScore: number | null
  liveMinute: number | null
}

interface FootballDataMatch {
  id: number
  status: 'TIMED' | 'SCHEDULED' | 'IN_PLAY' | 'PAUSED' | 'FINISHED' | 'SUSPENDED' | 'POSTPONED' | 'CANCELLED'
  score: {
    fullTime: { home: number | null; away: number | null }
  }
  minute: number | null
}

interface FootballDataResponse {
  matches: FootballDataMatch[]
}

function mapStatus(status: FootballDataMatch['status']): ExternalMatch['state'] {
  if (status === 'FINISHED') return 'FINAL'
  if (status === 'IN_PLAY' || status === 'PAUSED') return 'LIVE'
  return 'PENDING'
}

export async function fetchExternalMatches(): Promise<ExternalMatch[]> {
  const apiKey = process.env.FOOTBALL_API_KEY
  if (!apiKey) {
    console.warn('[match-sync] FOOTBALL_API_KEY not set — skipping external fetch')
    return []
  }

  try {
    const res = await fetch('https://api.football-data.org/v4/competitions/WC/matches', {
      headers: { 'X-Auth-Token': apiKey },
      next: { revalidate: 60 },
    })

    if (!res.ok) {
      console.error(`[match-sync] API error: HTTP ${res.status}`)
      return []
    }

    const data: FootballDataResponse = await res.json()

    return data.matches.map(m => ({
      id: String(m.id),
      state: mapStatus(m.status),
      homeScore: m.score.fullTime.home,
      awayScore: m.score.fullTime.away,
      liveMinute: m.minute ?? null,
    }))
  } catch (err) {
    console.error('[match-sync] Unexpected error:', err)
    return []
  }
}
```

- [ ] **Step 4: Correr tests para verificar que pasan**

```
npx vitest run src/__tests__/lib/match-sync.test.ts
```

Expected: PASS — 5 tests passing

- [ ] **Step 5: Verificar tipos**

```
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 6: Commit**

```bash
git add src/lib/match-sync.ts
git commit -m "feat(sync): implement fetchExternalMatches with football-data.org API"
```

---

### Task 4: Verificar integración con el cron

**Files:**
- Read: `src/app/api/cron/sync-matches/route.ts`

- [ ] **Step 1: Leer el cron para confirmar que no hay cambios necesarios**

Leer `src/app/api/cron/sync-matches/route.ts`. El cron ya llama a `fetchExternalMatches()` e itera sobre el resultado. Siempre y cuando `fetchExternalMatches()` devuelva el array correcto, el cron funciona sin cambios.

- [ ] **Step 2: Confirmar que el tipo `id` es compatible**

El cron espera `ExternalMatch.id` como `string`. La implementación usa `String(m.id)` para convertir el `number` de la API. No hay incompatibilidad de tipos.

- [ ] **Step 3: Commit final**

```bash
git commit --allow-empty -m "chore: verify cron/sync-matches is compatible with football-data.org integration"
```

---

### Task 5: Smoke test manual del cron

- [ ] **Step 1: Arrancar el servidor de desarrollo**

```
npm run dev
```

Expected: servidor corriendo en `http://localhost:3000`

- [ ] **Step 2: Llamar al cron con el header de autenticación**

```
curl -X POST http://localhost:3000/api/cron/sync-matches \
  -H "Authorization: Bearer $CRON_SECRET"
```

Expected: respuesta `{ "synced": N }` donde N puede ser 0 si el torneo no empezó aún (tier gratuito puede no tener datos del futuro).

- [ ] **Step 3: Verificar logs en consola**

Si `FOOTBALL_API_KEY` está bien configurado y la API responde, los logs mostrarán los partidos sincronizados. Si no hay partidos disponibles aún, el log dirá `synced: 0` — eso es correcto.
