# Data Layer — Repository Pattern

**Date:** 2026-05-26  
**Status:** Approved  
**Scope:** Capa de datos pluggable sin backend, preparada para swap a API real o backend propio

---

## Problema

Las páginas actuales importan datos directamente desde `src/lib/tournament-data.ts`, un archivo que mezcla tipos TypeScript con datos hardcodeados. No existe separación entre el contrato de datos y su origen. Cuando llegue el backend o la API externa, habría que modificar cada página individualmente.

Adicionalmente, las predicciones del usuario se guardan en Zustand sin persistencia — se pierden al refrescar la página.

---

## Decisiones clave

- **Motor de puntuación:** 100% responsabilidad del backend. El cliente nunca calcula `pts`, `basePts`, `streakBonus` ni rankings. Todos llegan pre-calculados.
- **Persistencia temporal:** Zustand con `persist` middleware → `localStorage`. No hay backend aún.
- **Patrón:** Repository Pattern con factory basada en env var `NEXT_PUBLIC_DATA_SOURCE`.
- **Async siempre:** todos los métodos de repositorio retornan `Promise<T>`, incluso en mock.

---

## Arquitectura

### Dominios y responsabilidades

| Dominio | Repositorio | Fuente futura |
|---------|-------------|---------------|
| Partidos | `IMatchRepository` | API externa (football-data.org, FIFA, etc.) |
| Liga / Leaderboard | `ILeagueRepository` | Backend propio |
| Predicciones | `IPredictionRepository` | Backend propio |

### Estructura de archivos

```
src/
  repositories/
    types/
      index.ts              ← Match, Member, Prediction (tipos de dominio puros)
    interfaces/
      index.ts              ← IMatchRepository, ILeagueRepository, IPredictionRepository
    mock/
      match.repository.ts   ← MockMatchRepository (datos estáticos)
      league.repository.ts  ← MockLeagueRepository
      prediction.repository.ts ← MockPredictionRepository (lee/escribe Zustand)
    index.ts                ← factory functions
  store/
    app-store.ts            ← UI state: predictor abierto/cerrado, toasts
    prediction-store.ts     ← predicciones del usuario + persist middleware
  app/(main)/
    feed/
      page.tsx              ← Server Component: fetches matches
      feed-screen.tsx       ← Client Component: UI interactiva
    leaderboard/
      page.tsx              ← Server Component: fetches leaderboard
      leaderboard-screen.tsx
    profile/
      page.tsx              ← Server Component: fetches matches + member "me"
      profile-screen.tsx
```

---

## Contratos (interfaces)

```ts
// IMatchRepository — fuente: API externa
interface IMatchRepository {
  getMatches(filters?: { date?: string; state?: MatchState }): Promise<Match[]>
  getMatch(id: string): Promise<Match | null>
}

// ILeagueRepository — fuente: backend propio
interface ILeagueRepository {
  getLeaderboard(leagueId: string): Promise<Member[]>
  getMembers(leagueId: string): Promise<Member[]>
}

// IPredictionRepository — fuente: backend propio
interface IPredictionRepository {
  getPredictions(userId: string): Promise<Prediction[]>
  savePrediction(matchId: string, score: [number, number]): Promise<void>
}
```

---

## Tipos de dominio

Los tipos se extraen de `tournament-data.ts` y se limpian — sin campos de UI, sin datos mezclados:

```ts
type MatchState = 'live' | 'pending' | 'final'

interface Match {
  id: string
  state: MatchState
  home: Team
  away: Team
  kickoffAt: string          // ISO 8601
  venue: string
  stage: string
  locked: boolean
  score?: [number, number]   // solo si state !== 'pending'
  // Puntos pre-calculados por el backend — cliente solo muestra
  userPrediction?: [number, number] | null
  pts?: number
  basePts?: number
  streakBonus?: number
  correctOutcome?: boolean
  correctScore?: boolean
}

interface Member {
  id: string
  name: string
  handle: string
  color: string
  rank: number
  prevRank: number
  pts: number
  hits: number
  streak: number
  me?: boolean
  breakdown: {
    exact: number
    diff: number
    winner: number
    streakBonus: number
    comboBonus: number
    oraclePartial: number
  }
}

interface Prediction {
  matchId: string
  score: [number, number]
  savedAt: string            // ISO 8601
}
```

---

## Factory

```ts
// src/repositories/index.ts
const source = process.env.NEXT_PUBLIC_DATA_SOURCE ?? 'mock'

export function getMatchRepository(): IMatchRepository {
  if (source === 'api') return new ApiMatchRepository()
  return new MockMatchRepository()
}

export function getLeagueRepository(): ILeagueRepository {
  if (source === 'api') return new ApiLeagueRepository()
  return new MockLeagueRepository()
}

export function getPredictionRepository(): IPredictionRepository {
  if (source === 'api') return new ApiPredictionRepository()
  return new MockPredictionRepository()
}
```

Cambiar `NEXT_PUBLIC_DATA_SOURCE=api` en `.env.local` conecta toda la app al backend real. Cero cambios en páginas o componentes.

---

## Flujo de datos

### Match data (server-side)
```
page.tsx (Server Component)
  → getMatchRepository().getMatches()
  → pasa matches[] como prop a feed-screen.tsx (Client Component)
```

### Predicciones (client-side overlay)
```
FeedScreen recibe matches[] del servidor
PredictionStore (Zustand + persist) tiene las predicciones locales
FeedScreen combina ambas: match.userPrediction ?? predictionStore.get(match.id)
```

El overlay es explícito e intencionalmente localizado en FeedScreen — no hay lógica distribuida en múltiples componentes.

### Guardar predicción
```
PredictorSheet → predictionStore.savePrediction(matchId, score)
  → escribe en localStorage vía persist middleware (mock)
  → [futuro] llama predictionRepository.savePrediction() → backend
```

---

## Zustand stores

### `app-store.ts` (sin cambios de forma, sin persist)
```ts
interface AppState {
  predictorMatch: Match | null
  toast: Toast | null
  openPredictor: (match: Match) => void
  closePredictor: () => void
  showToast: (toast: Toast) => void
  clearToast: () => void
}
```

### `prediction-store.ts` (nuevo, con persist)
```ts
interface PredictionState {
  predictions: Record<string, [number, number]>
  savePrediction: (matchId: string, score: [number, number]) => void
  getPrediction: (matchId: string) => [number, number] | undefined
  clearAll: () => void
}
```

---

## Lo que el cliente NUNCA hace

- Calcular puntos (`pts`, `basePts`, `streakBonus`) — vienen del backend
- Ordenar el leaderboard — `Member[]` llega ya ordenado
- Determinar si un partido está bloqueado — `Match.locked` viene del servidor
- Derivar el estado de un partido (`live`, `final`) — viene del servidor

---

## Migración desde el estado actual

1. Crear `repositories/types/`, `repositories/interfaces/`, `repositories/mock/`
2. Extraer tipos de `tournament-data.ts` → `repositories/types/`
3. Mover datos hardcodeados → `repositories/mock/*.repository.ts`
4. Eliminar `tournament-data.ts` (y `mock-data.ts` si corresponde)
5. Refactorizar pages a Server Components + separar screen clients
6. Separar `app-store` en `app-store` + `prediction-store`
7. Actualizar imports en todos los componentes

---

## Scope excluido

- Implementaciones reales de API (`api/*.repository.ts`) — se construyen cuando hay backend
- Autenticación / userId real — la prediction-store usa un userId hardcodeado `"me"` por ahora
- WebSockets / polling para partidos en vivo — fuera de scope, se agrega sobre el repositorio
- Gestión de ligas (CRUD) — Fase 6 del roadmap, repositorio separado
