# Domain Components — The Big Polla
**Date:** 2026-05-11  
**Status:** Approved  
**Phase:** 2 — Componentes de dominio

---

## Objetivo

Construir los componentes de dominio de Stadium Concrete sobre el stack actual (Next.js 16, React 19, Tailwind v4, Shadcn UI). Estos componentes conocen los tipos de negocio (Match, Team, Prediction, LeaderboardEntry) y los consumen directamente — a diferencia de los primitivos de Fase 1 que son agnósticos del dominio.

---

## Alcance

**Incluido:**
- `src/types/domain.ts` — tipos compartidos de dominio
- `src/lib/mock-data.ts` — datos estáticos para sandbox
- `src/components/domain/match-card.tsx` — variante Classic
- `src/components/domain/score-stepper.tsx` — stepper interactivo de goles
- `src/components/domain/predictor-sheet.tsx` — bottom sheet con ScoreStepper
- `src/components/domain/leaderboard-row.tsx` — fila de ranking
- `src/app/dev/page.tsx` — sandbox actualizado con todos los nuevos componentes

**Excluido:**
- Variantes Flat y Poster de MatchCard — siguiente fase
- LeaderboardRow detail sheet (breakdown de puntos) — siguiente fase
- Pantallas reales con routing — siguiente fase
- Auth, base de datos, API

---

## Arquitectura

### Separación de capas

```
src/components/ui/        ← primitivos sin dominio (Fase 1: Flag, Icon, Pill, Button, Topbar, BottomNav)
src/components/domain/    ← componentes que conocen los tipos de negocio (Fase 2)
src/types/domain.ts       ← fuente de verdad de tipos
src/lib/mock-data.ts      ← datos estáticos para sandbox y dev
```

Los componentes de `domain/` pueden importar de `ui/` pero nunca al revés.

### Server vs Client

| Componente | Tipo | Razón |
|---|---|---|
| `match-card.tsx` | Client Component (`"use client"`) | Acepta `onPredict?: () => void` — funciones no se pueden pasar de Client padre a Server hijo |
| `score-stepper.tsx` | Client Component (`"use client"`) | Estado local `homeGoals`, `awayGoals` |
| `predictor-sheet.tsx` | Client Component (`"use client"`) | Estado open/close del Sheet |
| `leaderboard-row.tsx` | Server Component | Pure display, sin estado ni callbacks |

### Dependencias externas nuevas

- `npx shadcn@latest add sheet` — base para PredictorSheet (instalar antes de implementar)

---

## Tipos de dominio

**Archivo:** `src/types/domain.ts`

```ts
export interface Team {
  name: string
  code: string        // ISO 3166-1 alpha-2 → componente Flag
  c1: string          // color primario hex (stripes de MatchCard)
  c2: string          // color secundario hex
}

export type MatchStatus = "live" | "upcoming" | "finished"

export interface Match {
  id: string
  home: Team
  away: Team
  stage: string       // "FASE DE GRUPOS", "CUARTOS DE FINAL", etc.
  venue: string
  date: string        // ISO 8601 string
  status: MatchStatus
  score?: { home: number; away: number }  // undefined cuando upcoming
  minute?: number     // minuto actual, solo cuando live
}

export type PredictionResult = "exact" | "diff" | "winner" | "miss"

export interface Prediction {
  matchId: string
  home: number
  away: number
  locked: boolean     // true cuando status es "live" o "finished"
  result?: PredictionResult  // solo cuando finished
  points?: number            // solo cuando finished
}

export type DeltaDirection = "up" | "down" | "flat"

export interface LeaderboardEntry {
  rank: number
  userId: string
  name: string
  points: number
  delta: DeltaDirection
  deltaValue?: number   // cuántas posiciones subió/bajó
  isMe: boolean
}
```

---

## Mock Data

**Archivo:** `src/lib/mock-data.ts`

Tres partidos representando cada estado posible:
- Un partido `upcoming` (sin score, con hora)
- Un partido `live` (con score y minuto)
- Un partido `finished` (con score y predicción resuelta)

Seis filas de leaderboard con el usuario en posición 4 (`isMe: true`). Posiciones 1-3 con diferentes deltas para verificar gold/silver/bronze.

Equipos con colores nacionales reales:
- Argentina (`#74ACDF` / `#FFFFFF`)
- Brasil (`#009C3B` / `#FFDF00`)
- Francia (`#002395` / `#ED2939`)
- Alemania (`#000000` / `#DD0000`)
- España (`#AA151B` / `#F1BF00`)

---

## MatchCard — Variante Classic

**Archivo:** `src/components/domain/match-card.tsx`  
**Tipo:** Client Component (`"use client"`)

### Props

```ts
interface MatchCardProps {
  match: Match
  prediction?: Prediction
  onPredict?: () => void  // callback para abrir PredictorSheet
}
```

### Anatomía

```
┌─────────────────────────────────────────────┐
│ ▌▌ STRIPES 6px: c1(home) | c2(away)       ▐▐│
├─────────────────────────────────────────────┤
│ [tape bg]  FASE DE GRUPOS · ESTADIO X  [Pill]│
├───────────────┬──────────┬──────────────────┤
│ Flag + nombre │ score/hr │ Flag + nombre    │
│ código ISO    │ centrado │ código ISO       │
├─────────────────────────────────────────────┤
│ (footer predicción — solo si finished)      │
└─────────────────────────────────────────────┘
```

### Implementación de stripes

```css
/* div de 6px de alto */
background: linear-gradient(to right, {c1} 50%, {c2} 50%)
```

### Tape header

```css
background: repeating-linear-gradient(
  90deg,
  rgba(255,255,255,0.03) 0px,
  rgba(255,255,255,0.03) 8px,
  transparent 8px,
  transparent 16px
)
```
Sobre fondo `--surface`. Texto: `stage · venue` en JetBrains Mono 10px uppercase. `Pill` alineado a la derecha.

### Body (grid 3 cols)

- Columna izquierda (home): `Flag` md + nombre Inter 900 truncado + código ISO JetBrains Mono faint
- Columna central: score en Inter 900 32px tabular-nums (si live/finished) o hora en JetBrains Mono (si upcoming)
- Columna derecha (away): mirror de la izquierda, texto alineado a la derecha

### Footer de predicción

Solo renderiza cuando `match.status === "finished"` y hay `prediction`.

| Estado | Visual |
|---|---|
| `exact` | Verde signal · "Predijiste X-Y · +5 pts" |
| `diff` | Verde signal · "Predijiste X-Y · +3 pts" |
| `winner` | Verde signal · "Predijiste X-Y · +1 pt" |
| `miss` | Rojo danger · "Predijiste X-Y · +0 pts" |

### Estados de card

- `live`: `box-shadow: 0 0 0 1px rgba(0,210,106,0.15)` + borde verde sutil
- `upcoming`: sin borde especial
- `finished`: opacidad reducida en stripes (0.6)

### Nota: onPredict

`onPredict` es `() => void` — callback opcional. Cuando está presente, el body de la card actúa como botón clickable. Si el partido está `locked` (live o finished), no se llama. El componente es Client Component precisamente por este callback — las funciones no pueden cruzar la frontera Server→Client en Next.js App Router.

---

## ScoreStepper

**Archivo:** `src/components/domain/score-stepper.tsx`  
**Tipo:** Client Component (`"use client"`)

### Props

```ts
interface ScoreStepperProps {
  match: Match
  initialHome?: number  // default 0
  initialAway?: number  // default 0
  onSave: (home: number, away: number) => void
}
```

### Anatomía

```
┌─────────────────────────────────────────┐
│   ARG                        BRA        │  ← nombres + flags
├──────────────────────────────────────── ┤
│  [–]      2          1      [+]         │  ← steppers
│        ← Inter 900 76px condensed →    │
│                   vs                   │
├─────────────────────────────────────────┤
│  [0-0] [1-0] [2-0] [2-1] [3-1] [3-2]  │  ← quick chips
├─────────────────────────────────────────┤
│       [ Guardar predicción → ]         │  ← CTA
└─────────────────────────────────────────┘
```

### Estado local

```ts
const [homeGoals, setHomeGoals] = useState(initialHome ?? 0)
const [awayGoals, setAwayGoals] = useState(initialAway ?? 0)
```

### Quick chips

Marcadores comunes predefinidos: `[0-0, 1-0, 0-1, 2-0, 0-2, 2-1, 1-2, 3-0, 3-1, 3-2]`. Fila scrollable horizontal. Chip activo (si el score actual coincide) en fondo `--signal`, texto `#04130A`. Al seleccionar un chip, actualiza `homeGoals` y `awayGoals`.

### Controles

- Botones -/+: 44×44px, `border-radius: 12px`, `border: --line`, fondo `rgba(255,255,255,0.04)`
- Score mínimo: 0 (botón `-` disabled cuando el valor es 0)
- Score máximo: 20 (límite práctico)

### CTA

`Button variant="default"` con texto "Guardar predicción →". Llama a `onSave(homeGoals, awayGoals)`.

---

## PredictorSheet

**Archivo:** `src/components/domain/predictor-sheet.tsx`  
**Tipo:** Client Component (`"use client"`)  
**Base:** `npx shadcn@latest add sheet`

### Props

```ts
interface PredictorSheetProps {
  match: Match
  prediction?: Prediction
  trigger: React.ReactNode
  onSave: (home: number, away: number) => void
}
```

### Estructura

```
Sheet (shadcn) — side="bottom"
  └── SheetContent — estilos Stadium Concrete
        ├── grab handle (pill 36×4px, color --fg-faint)
        ├── SheetHeader — nombre del partido abreviado
        └── ScoreStepper
              └── onSave → cierra sheet + llama prop onSave
```

### Estilos SheetContent

Override del shadcn Sheet para Stadium Concrete:
```css
background: var(--bg-2)
border-radius: 24px 24px 0 0
border-top: 1px solid var(--line)
max-height: 92dvh
padding: var(--gutter)
```

### Flujo de interacción

1. Usuario toca el `trigger` (ej: botón "Predecir" en la MatchCard)
2. Sheet sube con animación `translateY(100%) → 0` (shadcn lo maneja)
3. Usuario ajusta el score en `ScoreStepper`
4. CTA "Guardar" → llama `onSave(home, away)` → cierra sheet
5. MatchCard actualiza visualmente (en sandbox: log en consola)

---

## LeaderboardRow

**Archivo:** `src/components/domain/leaderboard-row.tsx`  
**Tipo:** Server Component

### Props

```ts
interface LeaderboardRowProps {
  entry: LeaderboardEntry
  className?: string
}
```

### Anatomía

```
┌──────┬────────────────────────────┬──────────┐
│  #4  │  Richard Rodriguez         │  142 pts │
│      │  ↑ 2 esta semana           │          │
└──────┴────────────────────────────┴──────────┘
```

Grid: `grid-cols-[36px_1fr_auto]`.

### Rank

- `#1`: color `#FFD60A` (gold = `--warn`)
- `#2`: color `#C7CACE` (silver)
- `#3`: color `#D08350` (bronze)
- Resto: `--fg-mute`

Font: Inter 900 16px.

### Nombre + sub

- Nombre: Inter 600 14px `--fg`
- Sub (delta): JetBrains Mono 11px. Ícono flecha + número de posiciones.
  - `up`: `↑ N` en `--signal`
  - `down`: `↓ N` en `--danger`
  - `flat`: `– sin cambios` en `--fg-faint`

### Puntos

Inter 900 16px tabular-nums. Color `--fg`.

### Fila `isMe`

```css
background: linear-gradient(to right, rgba(0,210,106,0.04), transparent)
border-left: 2px solid var(--signal)
```

---

## Sandbox `/dev`

Se agregan tres nuevas secciones al final de `src/app/dev/page.tsx`:

1. **MatchCard** — tres instancias (upcoming, live, finished con predicción)
2. **PredictorSheet** — botón "Abrir predictor →" que abre el sheet con un partido
3. **LeaderboardRow** — seis filas incluyendo una con `isMe: true`

El sandbox necesita un wrapper `"use client"` para manejar el `onSave` del PredictorSheet (igual al patrón de `BottomNavDemo` en Fase 1).

---

## File Map

| Archivo | Acción | Tipo |
|---|---|---|
| `src/types/domain.ts` | Crear | — |
| `src/lib/mock-data.ts` | Crear | — |
| `src/components/domain/match-card.tsx` | Crear | Client Component |
| `src/components/domain/score-stepper.tsx` | Crear | Client Component |
| `src/components/domain/predictor-sheet.tsx` | Crear | Client Component |
| `src/components/domain/leaderboard-row.tsx` | Crear | Server Component |
| `src/app/dev/page.tsx` | Modificar | Server Component |
| `src/app/dev/_components/domain-demo.tsx` | Crear | Client Component (wrapper sandbox) |

---

## Decisiones explícitas

| Decisión | Razón |
|---|---|
| `src/components/domain/` separado de `ui/` | Primitivos agnósticos del negocio vs componentes que conocen Match/Prediction — separación que escala |
| MatchCard como Client Component | Acepta `onPredict?: () => void` — funciones no cruzan la frontera Server→Client en Next.js App Router |
| `onPredict` como callback (no Link) | El predictor abre un Sheet, no navega — callback es el patrón correcto |
| `date` como `string` ISO en vez de `Date` | Serializable entre Server y Client Components sin fricción |
| shadcn Sheet como base de PredictorSheet | Maneja el portal, foco, Escape key y animación — no hay que reinventarlo |
| Quick chips como array predefinido | Los marcadores 0-0, 1-0, 2-1 cubren el 80% de los casos — YAGNI para configs dinámicas |
| Mock data en `src/lib/` (no en `src/app/`) | Reutilizable en tests y en múltiples páginas del sandbox |

---

## Próximos pasos (fuera de alcance de este spec)

1. Variantes Flat y Poster de MatchCard
2. LeaderboardRow detail sheet (desglose de puntos por categoría)
3. Pantalla Feed (`/`) con lista de MatchCards agrupadas por día
4. Pantalla Leaderboard con ranking completo
5. Avatar component (iniciales, cuadrado redondeado)
6. Toast notification (confirmación al guardar predicción)
