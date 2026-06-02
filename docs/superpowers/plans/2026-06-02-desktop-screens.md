# Desktop Screens — Fases 1, 2 y 3

> **Para agentes:** REQUIRED SUB-SKILL: Usar `superpowers:subagent-driven-development` (recomendado) o `superpowers:executing-plans` para implementar tarea a tarea.

**Goal:** Completar el desktop de The Big Polla con las tres pantallas faltantes: Dashboard (home command-center), Match Detail con layout 2-col, y Predictor Modal con steppers desktop.

**Architecture:** Cada fase agrega un par de archivos (server page + client screen) o actualiza uno existente, siguiendo el patrón ya establecido: server component fetcha datos → client component recibe props. El sistema CSS `dk-*` ya existe en `globals.css`. Los wrappers `hidden md:block` / `<div className="md:hidden">` manejan la separación mobile/desktop.

**Tech Stack:** Next.js 16 App Router · React 19 · Tailwind v4 · TypeScript · Repositorio mock (`src/repositories/`)

---

## Contexto del codebase

```
src/
├── app/
│   ├── (main)/
│   │   ├── layout.tsx               # SidebarProvider + MobileBottomNav + PredictorOverlay
│   │   ├── feed/
│   │   │   ├── page.tsx             # Server: fetcha matches + members
│   │   │   ├── feed-screen.tsx      # Client: desktop completo
│   │   │   └── [id]/
│   │   │       ├── page.tsx         # Server: fetcha match by id
│   │   │       └── match-detail-screen.tsx  # Client: solo mobile hoy
│   │   ├── leaderboard/             # ✅ desktop completo
│   │   ├── oracle/                  # ✅ desktop completo
│   │   ├── profile/                 # ✅ desktop completo
│   │   └── settings/                # ✅ desktop completo
├── components/
│   ├── layout/
│   │   ├── app-sidebar.tsx          # ✅ nav con league switcher + profile chip
│   │   └── dk-topbar.tsx            # ✅ componente desktop topbar compartido
│   └── domain/
│       └── predictor-overlay.tsx    # Client: solo mobile hoy
├── lib/
│   └── oracle-data.ts               # BRACKET y TEAMS (datos estáticos)
├── repositories/
│   ├── index.ts                     # getMatchRepository(), getLeagueRepository()
│   └── mock/                        # Datos mock
└── store/
    ├── app-store.ts                 # openPredictor(match), closePredictor, showToast
    └── prediction-store.ts          # getPrediction(id), savePrediction(id, pred)
```

**Patrón a seguir (ver `src/app/(main)/feed/page.tsx`):**
```tsx
// Server component
import { getMatchRepository, getLeagueRepository } from '@/repositories'
import { MyScreen } from './my-screen'

export default async function MyPage() {
  const [matches, members] = await Promise.all([
    getMatchRepository().getMatches(),
    getLeagueRepository().getMembers('default'),
  ])
  return <MyScreen matches={matches} members={members} />
}
```

---

# FASE 1 — Dashboard

## Qué construir

Pantalla command-center: KPI 4-col, partidos en vivo + hoy pendientes, columna derecha con mini-leaderboard, streak card y oracle progress. Aparece como primer ítem en el sidebar nav.

```
URL: /dashboard

Layout:
  DKTopbar (LIGA / DASHBOARD)
  dk-page-head ("HOLA TÚ." + fecha/jornada)
  scroll (padding 32px desktop)
  ├── dk-section: dk-kpi-big (rank, pts, streak, hits)
  ├── dk-section: dk-nudge (si hay partido sin predicción)
  └── dk-section: dk-split-2
      ├── Left: live matches + today pending (FeedMatchCard reutilizado)
      └── Right: mini-leaderboard + streak card + oracle progress card
```

## Archivos

- **Crear:** `src/app/(main)/dashboard/page.tsx` — server component, fetcha matches + members
- **Crear:** `src/app/(main)/dashboard/dashboard-screen.tsx` — client component, toda la UI
- **Modificar:** `src/components/layout/app-sidebar.tsx` — agregar Dashboard como primer nav item

---

### Tarea 1.1 — Server page del Dashboard

**Archivos:**
- Crear: `src/app/(main)/dashboard/page.tsx`

- [ ] Crear el archivo:

```tsx
import { getLeagueRepository, getMatchRepository } from '@/repositories'
import { DashboardScreen } from './dashboard-screen'

export default async function DashboardPage() {
  const [matches, members] = await Promise.all([
    getMatchRepository().getMatches(),
    getLeagueRepository().getMembers('default'),
  ])
  return <DashboardScreen matches={matches} members={members} />
}
```

- [ ] Verificar que la ruta `/dashboard` responde 200 (puede estar vacía por ahora):
```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/dashboard
```
Esperado: `200`

- [ ] Commit:
```bash
git add src/app/\(main\)/dashboard/page.tsx
git commit -m "feat(dashboard): add server page route"
```

---

### Tarea 1.2 — Agregar Dashboard al sidebar nav

**Archivos:**
- Modificar: `src/components/layout/app-sidebar.tsx`

- [ ] En `NAV_ITEMS`, agregar Dashboard como primer ítem:

```tsx
const NAV_ITEMS = [
  { href: '/dashboard', icon: 'feed', label: 'Dashboard', kbd: 'G D' },
  { href: '/feed', icon: 'feed', label: 'Match feed', kbd: 'G F', badge: '6' },
  { href: '/oracle', icon: 'bracket', label: 'Oracle bracket', kbd: 'G B' },
  { href: '/leaderboard', icon: 'trophy', label: 'Leaderboard', kbd: 'G L' },
]
```

- [ ] Actualizar la lógica `isActive` para que `/dashboard` solo matchee exacto (no startsWith):

```tsx
const isActive = (href: string) => {
  if (href === '/feed') return pathname === '/feed' || pathname.startsWith('/feed/')
  return pathname === href
}
```

- [ ] Commit:
```bash
git add src/components/layout/app-sidebar.tsx
git commit -m "feat(dashboard): add dashboard to sidebar nav"
```

---

### Tarea 1.3 — Dashboard screen (columna izquierda)

**Archivos:**
- Crear: `src/app/(main)/dashboard/dashboard-screen.tsx`

- [ ] Crear la estructura base con `DKTopbar`, `dk-page-head`, KPI y nudge:

```tsx
'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { Avi } from '@/components/ui/avi'
import { GameIcon } from '@/components/ui/game-icon'
import { TeamFlag } from '@/components/ui/team-flag'
import { DKTopbar } from '@/components/layout/dk-topbar'
import { useAppStore } from '@/store/app-store'
import { usePredictionStore } from '@/store/prediction-store'
import { getDayLabel, getKickoffIn } from '@/lib/date-utils'
import { BRACKET } from '@/lib/oracle-data'
import type { Match, Member } from '@/types/domain'

interface DashboardScreenProps {
  matches: Match[]
  members: Member[]
}

export function DashboardScreen({ matches, members }: DashboardScreenProps) {
  const { openPredictor } = useAppStore()
  const getPrediction = usePredictionStore(s => s.getPrediction)

  const me = members.find(m => m.me)!
  const liveMatches = matches.filter(m => m.state === 'live')
  const todayPending = matches.filter(m => m.state === 'pending' && getDayLabel(m.kickoffAt) === 'HOY')
  const nextNoPred = matches.find(m => m.state === 'pending' && !m.userPrediction && !getPrediction(m.id))

  return (
    <div className="screen screen-anim">
      {/* Mobile topbar */}
      <div className="topbar">
        <Avi name={me.name} color={me.color} size={32} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <div className="topbar-meta">LIGA · AMIGOS DEL BAR</div>
          <div className="topbar-title">DASHBOARD</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Link href="/feed" className="icon-btn"><GameIcon name="feed" size={18} /></Link>
        </div>
      </div>

      {/* Desktop topbar */}
      <DKTopbar crumbs={['LIGA AMIGOS DEL BAR', 'DASHBOARD']} />

      {/* Desktop page header */}
      <div className="dk-page-head">
        <div>
          <div className="sub">JORNADA 04 · {new Date().toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'short' }).toUpperCase()}</div>
          <div className="title">HOLA TÚ.</div>
        </div>
        <div className="actions">
          <Link href="/feed" className="dk-btn primary">Ver partidos del día →</Link>
        </div>
      </div>

      <div className="scroll">
        {/* Mobile KPI */}
        <div className="md:hidden px-5 pt-3">
          <div className="kpi">
            <div><span className="label">POSICIÓN</span><span className="value">#{me.rank}<span className="small">/{members.length}</span></span></div>
            <div><span className="label">PUNTOS</span><span className="value">{me.pts}</span></div>
            <div><span className="label">RACHA</span><span className="value" style={{ color: 'var(--warn)' }}>{me.streak}<span className="small">×</span></span></div>
          </div>
        </div>

        {/* Desktop KPI */}
        <div className="dk-section hidden md:block">
          <div className="dk-kpi-big">
            <div>
              <span className="label">TU POSICIÓN</span>
              <span className="value">#{me.rank}<span className="small">/{members.length}</span></span>
              <span className="foot" style={{ color: 'var(--signal)' }}>▲ SUBISTE 3 POSICIONES ESTA SEMANA</span>
            </div>
            <div>
              <span className="label">PUNTOS TOTALES</span>
              <span className="value">{me.pts}</span>
              <span className="foot">A 35 DEL LÍDER · A 11 DEL #3</span>
            </div>
            <div>
              <span className="label">RACHA ACTUAL</span>
              <span className="value" style={{ color: 'var(--warn)' }}>{me.streak}<span className="small">×</span></span>
              <span className="foot" style={{ color: 'var(--warn)' }}>+{me.streak} PTS BONUS POR ACIERTO</span>
            </div>
            <div>
              <span className="label">ACIERTOS · % HIT</span>
              <span className="value">{me.hits}<span className="small">/27</span></span>
              <span className="foot">{Math.round(me.hits / 27 * 100)}% PRECISIÓN GLOBAL</span>
            </div>
          </div>
        </div>

        {/* Nudge — mobile */}
        {nextNoPred && (
          <div className="md:hidden px-5 pt-4">
            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 14, borderColor: 'rgba(255,214,10,0.4)', background: 'linear-gradient(90deg, rgba(255,214,10,0.08), transparent)' }}>
              <div style={{ flex: 1 }}>
                <div className="t-eyebrow" style={{ color: 'var(--warn)' }}>ALERTA · {getKickoffIn(nextNoPred.kickoffAt) ?? 'HOY'}</div>
                <div className="t-h3" style={{ fontSize: 16 }}>Falta predecir {nextNoPred.home.code} vs {nextNoPred.away.code}</div>
              </div>
              <button className="btn btn-warn" style={{ padding: '10px 14px', fontSize: 12 }} onClick={() => openPredictor(nextNoPred)}>IR →</button>
            </div>
          </div>
        )}

        {/* Nudge — desktop */}
        {nextNoPred && (
          <div className="dk-section hidden md:block" style={{ paddingBottom: 0 }}>
            <div className="dk-nudge">
              <div style={{ flex: 1 }}>
                <div className="t-eyebrow" style={{ color: 'var(--warn)', marginBottom: 4 }}>
                  ALERTA · CIERRA EN {getKickoffIn(nextNoPred.kickoffAt) ?? 'PRONTO'}
                </div>
                <div className="t-h2" style={{ fontSize: 22 }}>
                  Te falta predecir {nextNoPred.home.name} vs {nextNoPred.away.name}
                </div>
              </div>
              <button className="dk-btn warn" onClick={() => openPredictor(nextNoPred)}>Predecir ahora →</button>
            </div>
          </div>
        )}

        {/* Mobile match list */}
        <div className="md:hidden">
          <div className="section-head"><div className="num">EN VIVO</div><div className="title">AHORA</div></div>
          <div className="px-5" style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingBottom: 8 }}>
            {liveMatches.map(m => (
              <Link key={m.id} href={`/feed/${m.id}`} style={{ textDecoration: 'none' }}>
                <DashboardMatchRow match={m} />
              </Link>
            ))}
          </div>
          <div className="section-head"><div className="num">HOY</div><div className="title">PENDIENTES</div></div>
          <div className="px-5" style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingBottom: 20 }}>
            {todayPending.map(m => <DashboardMatchRow key={m.id} match={m} onClick={() => openPredictor(m)} />)}
          </div>
        </div>

        {/* Desktop 2-col split */}
        <div className="dk-section hidden md:block">
          <div className="dk-split dk-split-2">
            <DashboardLeft liveMatches={liveMatches} todayPending={todayPending} onOpenMatch={() => {}} onOpenPredictor={openPredictor} />
            <DashboardRight members={members} me={me} />
          </div>
        </div>

        <div style={{ height: 90 }} />
      </div>
    </div>
  )
}
```

- [ ] Commit parcial:
```bash
git add src/app/\(main\)/dashboard/dashboard-screen.tsx
git commit -m "feat(dashboard): add screen skeleton with KPI and nudge"
```

---

### Tarea 1.4 — Componentes de columna izquierda

**Archivos:**
- Modificar: `src/app/(main)/dashboard/dashboard-screen.tsx`

- [ ] Agregar `DashboardMatchRow` (fila compacta de partido para mobile) y `DashboardLeft` (columna izquierda desktop con live + pending):

```tsx
// Fila de partido compacta — mobile
function DashboardMatchRow({ match, onClick }: { match: Match; onClick?: () => void }) {
  const { home, away, state, score } = match
  return (
    <div
      className={`match-card variant-tape ${state}`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div className="match-stripes">
        <div className="match-stripe" style={{ background: home.c1 }} />
        <div className="match-stripe" style={{ background: away.c1 }} />
      </div>
      <div className="match-tape">
        <span>{match.stage} · {match.venue.split(',')[0]}</span>
        {state === 'live' && <span className="live-pill"><span className="dot" />EN VIVO</span>}
      </div>
      <div className="match-body">
        <div className="team-block"><TeamFlag team={home} /><div className="team-name">{home.name}</div></div>
        <div className="center-vs">
          {state === 'live' && score && <div className="score-row"><span>{score[0]}</span><span className="sep">·</span><span>{score[1]}</span></div>}
          {state === 'pending' && <div className="kickoff-time">{match.kickoffAt ? new Date(match.kickoffAt).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }) : '—'}</div>}
        </div>
        <div className="team-block right"><TeamFlag team={away} /><div className="team-name">{away.name}</div></div>
      </div>
    </div>
  )
}

// Columna izquierda desktop
function DashboardLeft({ liveMatches, todayPending, onOpenMatch, onOpenPredictor }: {
  liveMatches: Match[]
  todayPending: Match[]
  onOpenMatch: (m: Match) => void
  onOpenPredictor: (m: Match) => void
}) {
  return (
    <div>
      {liveMatches.length > 0 && (
        <>
          <div className="dk-section-head" style={{ marginBottom: 12 }}>
            <div>
              <div className="dk-pulse" style={{ marginBottom: 4 }}><span className="dot" />EN VIVO AHORA</div>
              <span style={{ fontFamily: 'var(--font-inter, sans-serif)', fontWeight: 900, fontSize: 28, letterSpacing: '-0.03em', fontVariationSettings: '"wdth" 75' }}>
                PARTIDOS EN CURSO
              </span>
            </div>
            <Link href="/feed" className="dk-btn ghost" style={{ fontSize: 11 }}>Ver todo →</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {liveMatches.map(m => (
              <Link key={m.id} href={`/feed/${m.id}`} style={{ textDecoration: 'none' }}>
                <DashboardMatchRow match={m} />
              </Link>
            ))}
          </div>
        </>
      )}

      {todayPending.length > 0 && (
        <>
          <div className="dk-section-head" style={{ marginTop: 28, marginBottom: 12 }}>
            <span style={{ fontFamily: 'var(--font-inter, sans-serif)', fontWeight: 900, fontSize: 28, letterSpacing: '-0.03em', fontVariationSettings: '"wdth" 75' }}>
              HOY · PENDIENTES
            </span>
            <span className="t-meta">{todayPending.length} PARTIDOS</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {todayPending.map(m => (
              <DashboardMatchRow key={m.id} match={m} onClick={() => onOpenPredictor(m)} />
            ))}
          </div>
        </>
      )}

      {liveMatches.length === 0 && todayPending.length === 0 && (
        <div style={{ padding: '40px 0', textAlign: 'center' }}>
          <div className="t-eyebrow">SIN PARTIDOS HOY</div>
          <Link href="/feed" className="dk-btn ghost" style={{ marginTop: 16 }}>Ver todos los partidos →</Link>
        </div>
      )}
    </div>
  )
}
```

- [ ] Commit:
```bash
git add src/app/\(main\)/dashboard/dashboard-screen.tsx
git commit -m "feat(dashboard): add left column with live and pending matches"
```

---

### Tarea 1.5 — Componentes de columna derecha

**Archivos:**
- Modificar: `src/app/(main)/dashboard/dashboard-screen.tsx`

- [ ] Agregar `DashboardRight` (mini-leaderboard + streak card + oracle progress card):

```tsx
function DashboardRight({ members, me }: { members: Member[]; me: Member }) {
  // Compute oracle progress from static bracket data
  let oraclePicked = 0; let oracleTotal = 0
  Object.values(BRACKET).forEach((round: any) => {
    round.forEach((s: any) => {
      if (s.top || s.bot) oracleTotal++
      if (s.picked) oraclePicked++
    })
  })
  const oraclePct = Math.round(oraclePicked / oracleTotal * 100)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Mini leaderboard */}
      <div className="dk-card">
        <div className="dk-section-head" style={{ marginBottom: 12 }}>
          <div>
            <div className="t-eyebrow" style={{ fontSize: 9 }}>RANKING · GLOBAL</div>
            <div className="t-h3" style={{ fontSize: 16, marginTop: 2 }}>LEADERBOARD</div>
          </div>
          <Link href="/leaderboard" className="dk-btn ghost" style={{ padding: '6px 10px', fontSize: 10 }}>Todos →</Link>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {members.slice(0, 6).map((m, i) => {
            const delta = m.prevRank - m.rank
            const deltaCls = delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat'
            return (
              <div key={m.id} style={{
                display: 'grid', gridTemplateColumns: '26px 1fr auto auto', alignItems: 'center', gap: 10,
                padding: '10px 0', borderBottom: i < 5 ? '1px solid var(--line)' : 0,
                background: m.me ? 'linear-gradient(90deg, rgba(0,210,106,0.06), transparent)' : undefined,
                paddingLeft: m.me ? 8 : 0,
                borderLeft: m.me ? '2px solid var(--signal)' : undefined,
              }}>
                <div style={{
                  fontFamily: 'var(--font-inter, sans-serif)', fontWeight: 900, fontSize: 16,
                  letterSpacing: '-0.03em', fontVariationSettings: '"wdth" 75',
                  color: m.rank === 1 ? 'var(--warn)' : m.rank === 2 ? '#C7CACE' : m.rank === 3 ? '#D08350' : 'var(--fg)',
                }}>{m.rank}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                  <Avi name={m.name} color={m.color} size={24} />
                  <span style={{ fontFamily: 'var(--font-inter, sans-serif)', fontWeight: 800, fontSize: 13, letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {m.name}
                  </span>
                </div>
                <span className={`delta ${deltaCls}`} style={{ fontFamily: 'var(--font-jetbrains, monospace)', fontSize: 9 }}>
                  {delta > 0 ? `▲${delta}` : delta < 0 ? `▼${Math.abs(delta)}` : '—'}
                </span>
                <span style={{ fontFamily: 'var(--font-inter, sans-serif)', fontWeight: 900, fontSize: 14, letterSpacing: '-0.02em', fontVariationSettings: '"wdth" 75', textAlign: 'right', minWidth: 40 }}>
                  {m.pts}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Streak card */}
      <div className="dk-card" style={{ background: 'linear-gradient(135deg, rgba(255,214,10,0.10), transparent 60%), var(--surface)', borderColor: 'rgba(255,214,10,0.3)' }}>
        <div className="t-eyebrow" style={{ color: 'var(--warn)' }}>🔥 RACHA ACTIVA · BONUS POR ACIERTO</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 8 }}>
          <span style={{ fontFamily: 'var(--font-inter, sans-serif)', fontWeight: 900, fontSize: 60, letterSpacing: '-0.06em', fontVariationSettings: '"wdth" 75', color: 'var(--warn)', lineHeight: 1 }}>
            {me.streak}<span style={{ fontSize: 28, color: 'var(--fg-mute)' }}>×</span>
          </span>
          <span style={{ fontFamily: 'var(--font-inter, sans-serif)', fontWeight: 800, fontSize: 28, letterSpacing: '-0.03em', color: 'var(--warn)' }}>
            +{me.streak} PTS
          </span>
        </div>
        <div className="t-body" style={{ marginTop: 8, fontSize: 12 }}>
          Cada acierto suma <b style={{ color: 'var(--warn)' }}>+1 pt por nivel de racha</b> (máx +5/partido).
        </div>
        <div style={{ marginTop: 12, display: 'flex', gap: 6 }}>
          {[1, 2, 3, 4, 5].map(n => (
            <div key={n} style={{ flex: 1, height: 6, borderRadius: 3, background: n <= me.streak ? 'var(--warn)' : 'rgba(255,255,255,0.06)' }} />
          ))}
        </div>
      </div>

      {/* Oracle progress */}
      <div className="dk-card" style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.10), transparent 60%), var(--surface)', borderColor: 'rgba(124,58,237,0.3)' }}>
        <div className="t-eyebrow" style={{ color: '#A78BFA' }}>★ BRACKET ORACLE · +50 PTS</div>
        <div className="t-h3" style={{ fontSize: 18, marginTop: 6 }}>{oraclePicked} DE {oracleTotal} PICKS</div>
        <div style={{ marginTop: 10, height: 10, background: 'rgba(255,255,255,0.05)', borderRadius: 5, overflow: 'hidden' }}>
          <div style={{ width: `${oraclePct}%`, height: '100%', background: 'linear-gradient(90deg, #A78BFA, #7C3AED)' }} />
        </div>
        <div style={{ marginTop: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span className="t-meta">PROGRESO</span>
          <span style={{ fontFamily: 'var(--font-inter, sans-serif)', fontWeight: 900, fontSize: 16 }}>{oraclePct}%</span>
        </div>
        <Link href="/oracle" className="dk-btn ghost" style={{ marginTop: 12, width: '100%', justifyContent: 'center', display: 'flex' }}>
          Continuar bracket →
        </Link>
      </div>
    </div>
  )
}
```

- [ ] Agregar `import Link from 'next/link'` al top del archivo (si no está ya)

- [ ] Verificar en browser en `http://localhost:3000/dashboard` a 1440px que:
  - Sidebar muestra "Dashboard" como primer ítem activo
  - KPI grid muestra 4 métricas
  - 2-col split: partidos izquierda, mini-leaderboard + streak + oracle derecha
  - Mobile (390px): topbar, KPI 3-col, lista de partidos, bottom nav

- [ ] Commit:
```bash
git add src/app/\(main\)/dashboard/dashboard-screen.tsx
git commit -m "feat(dashboard): add right column with mini-leaderboard, streak, oracle progress"
```

---

## Checklist de auto-review Fase 1

- [ ] `/dashboard` renderiza sin errores TypeScript
- [ ] Mobile (390px): muestra topbar, KPI 3-col, lista compacta de partidos, bottom nav
- [ ] Desktop (1440px): muestra DKTopbar, page-head "HOLA TÚ.", KPI 4-col, nudge si aplica, 2-col split
- [ ] Sidebar: "Dashboard" es el primer ítem, se marca active cuando estás en `/dashboard`
- [ ] Si no hay partidos live ni pending hoy: muestra el empty state con link a /feed
- [ ] El botón "Predecir ahora →" en el nudge abre el PredictorOverlay

---

---

# FASE 2 — Match Detail Desktop

## Qué construir

Layout `dk-md` 2-col para el detalle de partido en desktop. Columna izquierda: hero con flags, score grande, tu predicción, puntos posibles, racha en juego. Columna derecha: timeline de eventos + barras de tribuna.

```
URL: /feed/[id]

Layout desktop:
  DKTopbar (MATCH FEED / ESP vs GER)
  scroll
  ├── Back button row
  └── dk-md (2-col grid)
      ├── Left (dk-md-hero): flags, score 80px, pred info, lock notice, action button
      └── Right: timeline card + tribuna card
```

## Archivos

- **Modificar:** `src/app/(main)/feed/[id]/match-detail-screen.tsx`

---

### Tarea 2.1 — Desktop topbar y estructura 2-col

**Archivos:**
- Modificar: `src/app/(main)/feed/[id]/match-detail-screen.tsx`

- [ ] Agregar `DKTopbar` y el wrapper `dk-md` alrededor del contenido desktop. Mantener el layout mobile intacto dentro de un wrapper `md:hidden`. El layout desktop va en `hidden md:block`:

```tsx
'use client'

import Link from 'next/link'
import { GameIcon } from '@/components/ui/game-icon'
import { GamePill } from '@/components/ui/game-pill'
import { TeamFlag } from '@/components/ui/team-flag'
import { DKTopbar } from '@/components/layout/dk-topbar'
import { useAppStore } from '@/store/app-store'
import { usePredictionStore } from '@/store/prediction-store'
import { getKickoffTime } from '@/lib/date-utils'
import type { Match } from '@/types/domain'

export function MatchDetailScreen({ match }: { match: Match }) {
  const { openPredictor } = useAppStore()
  const localPred = usePredictionStore(s => s.getPrediction(match.id))
  const { home, away, state, score } = match
  const myPred = localPred ?? match.userPrediction ?? null
  const live = state === 'live'
  const final = state === 'final'
  const pending = state === 'pending'
  const time = live ? `${match.liveMinute ?? 0}'` : pending ? getKickoffTime(match.kickoffAt) : 'FINAL'

  return (
    <div className="screen screen-anim">
      {/* Mobile topbar */}
      <div className="topbar">
        <Link href="/feed" className="icon-btn"><GameIcon name="back" /></Link>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <div className="topbar-meta">{match.stage.toUpperCase()}</div>
          <div className="topbar-title">MATCH</div>
        </div>
        <button className="icon-btn"><GameIcon name="share" size={16} /></button>
      </div>

      {/* Desktop topbar */}
      <DKTopbar crumbs={['MATCH FEED', `${home.code} vs ${away.code}`]} />

      {/* Mobile layout */}
      <div className="scroll md:hidden">
        <MobileMatchDetail match={match} myPred={myPred} time={time} live={live} final={final} pending={pending} score={score} home={home} away={away} openPredictor={openPredictor} />
      </div>

      {/* Desktop layout */}
      <div className="scroll hidden md:block">
        <div style={{ padding: '20px 0 0' }}>
          <Link href="/feed" className="dk-btn ghost"><GameIcon name="back" size={14} /> Volver</Link>
        </div>
        <DesktopMatchDetail match={match} myPred={myPred} time={time} live={live} final={final} pending={pending} score={score} home={home} away={away} openPredictor={openPredictor} />
        <div style={{ height: 40 }} />
      </div>
    </div>
  )
}
```

- [ ] Agregar el componente `MobileMatchDetail` (mueve el contenido mobile existente ahí):

```tsx
function MobileMatchDetail({ match, myPred, time, live, final, pending, score, home, away, openPredictor }: any) {
  return (
    <>
      <div className="detail-hero" style={{ '--c1': `${home.c1}33`, '--c2': `${away.c1}33` } as React.CSSProperties}>
        <div className="detail-meta-row">
          <span>{match.venue}</span>
          {live && <span style={{ color: 'var(--signal)' }}>● {time}</span>}
          {final && <span>FINAL</span>}
          {pending && <span>{time}</span>}
        </div>
        <div className="detail-versus">
          <div className="detail-team">
            <TeamFlag team={home} size="lg" />
            <div className="name">{home.name}</div>
            <div className="t-meta">{home.code}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            {(live || final) && score && (
              <div style={{ fontFamily: 'var(--display)', fontWeight: 900, fontSize: 64, letterSpacing: '-0.06em', lineHeight: 1 }}>
                {score[0]}<span style={{ color: 'var(--fg-faint)' }}>·</span>{score[1]}
              </div>
            )}
            {pending && <div className="detail-vs">VS</div>}
            {live && <GamePill tone="signal" dot>EN VIVO</GamePill>}
          </div>
          <div className="detail-team">
            <TeamFlag team={away} size="lg" />
            <div className="name">{away.name}</div>
            <div className="t-meta">{away.code}</div>
          </div>
        </div>
        <div className="detail-meta-row">
          <span>TU PRED · {myPred ? `${myPred[0]}–${myPred[1]}` : '—'}</span>
          <span>VS · LIGA · 8 PRED</span>
        </div>
      </div>
      {match.timeline && (
        <div>
          <div className="section-head"><div className="num">EVENTOS</div><div className="title">CRONOLOGÍA</div></div>
          <div className="live-timeline">
            {[...match.timeline].reverse().map((e: any, i: number) => (
              <div className="live-event" key={i}>
                <div className="min">{e.min}&apos;</div>
                <div className="text"><div className="head">{e.head}</div><div className="body">{e.body}</div></div>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="section-head"><div className="num">LIGA · 8 PRED</div><div className="title">¿QUÉ DICE LA TRIBUNA?</div></div>
      <div style={{ padding: '0 20px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[
          { who: `Gana ${home.name}`, pct: 62, color: home.c1 },
          { who: 'Empate', pct: 25, color: 'var(--fg-mute)' },
          { who: `Gana ${away.name}`, pct: 13, color: away.c1 },
        ].map(row => (
          <div key={row.who}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--fg-dim)' }}>{row.who}</span>
              <span className="t-num" style={{ fontSize: 13 }}>{row.pct}%</span>
            </div>
            <div style={{ height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ width: `${row.pct}%`, height: '100%', background: row.color }} />
            </div>
          </div>
        ))}
      </div>
      {pending && (
        <div style={{ padding: '0 20px 24px' }}>
          <button className="btn btn-primary btn-block" onClick={() => openPredictor(match)}>
            {myPred ? 'EDITAR PREDICCIÓN' : 'HACER PREDICCIÓN'} <span className="arrow">→</span>
          </button>
        </div>
      )}
      <div style={{ height: 90 }} />
    </>
  )
}
```

- [ ] Agregar el componente `DesktopMatchDetail` (layout 2-col):

```tsx
function DesktopMatchDetail({ match, myPred, time, live, final, pending, score, home, away, openPredictor }: any) {
  return (
    <div className="dk-md">
      {/* Left: hero */}
      <div className="dk-md-hero" style={{ '--c1': `${home.c1}26`, '--c2': `${away.c1}26` } as React.CSSProperties}>
        <div className="t-meta" style={{ marginBottom: 18, display: 'flex', justifyContent: 'space-between' }}>
          <span>{match.stage} · {match.venue}</span>
          {live && <span style={{ color: 'var(--signal)' }}>● {time}</span>}
          {final && <span>FINAL</span>}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 24, alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, textAlign: 'center' }}>
            <TeamFlag team={home} size="lg" />
            <div style={{ fontFamily: 'var(--font-inter, sans-serif)', fontWeight: 900, fontSize: 24, letterSpacing: '-0.03em', textTransform: 'uppercase', fontVariationSettings: '"wdth" 75' }}>{home.name}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            {(live || final) && score ? (
              <div style={{ fontFamily: 'var(--font-inter, sans-serif)', fontWeight: 900, fontSize: 80, letterSpacing: '-0.06em', fontVariationSettings: '"wdth" 75', lineHeight: 0.9, display: 'flex', alignItems: 'baseline', gap: 12 }}>
                <span>{score[0]}</span><span style={{ color: 'var(--fg-faint)' }}>·</span><span>{score[1]}</span>
              </div>
            ) : (
              <span style={{ fontSize: 32, color: 'var(--fg-faint)', fontFamily: 'var(--font-inter, sans-serif)', fontWeight: 900, letterSpacing: '0.06em' }}>VS</span>
            )}
            {live && <GamePill tone="signal" dot>EN VIVO · {time}</GamePill>}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, textAlign: 'center' }}>
            <TeamFlag team={away} size="lg" />
            <div style={{ fontFamily: 'var(--font-inter, sans-serif)', fontWeight: 900, fontSize: 24, letterSpacing: '-0.03em', textTransform: 'uppercase', fontVariationSettings: '"wdth" 75' }}>{away.name}</div>
          </div>
        </div>

        <div className="dk-divider" />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
          <div>
            <div className="t-eyebrow">TU PREDICCIÓN</div>
            <div className="t-h2" style={{ fontSize: 26, marginTop: 6 }}>{myPred ? `${myPred[0]} · ${myPred[1]}` : '—'}</div>
            {(live || final) && (
              <div className="dk-locked-pill" style={{ marginTop: 8 }}>
                <GameIcon name="lock" size={9} /> BLOQUEADA AL KICKOFF
              </div>
            )}
          </div>
          <div>
            <div className="t-eyebrow">PUNTOS POSIBLES</div>
            <div className="t-h2" style={{ fontSize: 26, marginTop: 6, color: 'var(--warn)' }}>
              {final ? (match.pts ? `+${match.pts}` : '0') : myPred ? '+5/+3/+1' : '0'}
            </div>
            <div className="t-meta">EXACTO · DIFF · GANADOR</div>
          </div>
          <div>
            <div className="t-eyebrow">RACHA EN JUEGO</div>
            <div className="t-h2" style={{ fontSize: 26, marginTop: 6, color: 'var(--warn)' }}>🔥 3×</div>
            <div className="t-meta">+3 PTS SI ACERTÁS</div>
          </div>
        </div>

        {pending && (
          <button className="btn btn-primary btn-block" style={{ marginTop: 20 }} onClick={() => openPredictor(match)}>
            {myPred ? 'Editar predicción' : 'Bloquear predicción'} →
          </button>
        )}
        {(live || final) && (
          <div style={{ marginTop: 20, padding: '12px 14px', background: 'rgba(255,61,113,0.08)', border: '1px solid rgba(255,61,113,0.25)', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
            <GameIcon name="lock" size={14} color="var(--danger)" />
            <span className="t-meta" style={{ color: 'var(--fg-dim)', textTransform: 'none', letterSpacing: '0.02em', fontSize: 12 }}>
              {live ? 'Las predicciones están cerradas mientras el partido está en vivo.' : 'El partido finalizó. Las predicciones se cerraron al kickoff.'}
            </span>
          </div>
        )}
      </div>

      {/* Right: timeline + tribuna */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {match.timeline && (
          <div className="dk-card">
            <div className="t-eyebrow">CRONOLOGÍA · EVENTOS</div>
            <div className="dk-timeline" style={{ marginTop: 8 }}>
              {[...match.timeline].reverse().map((e: any, i: number) => (
                <div className="dk-timeline-event" key={i}>
                  <div className="min">{e.min}&apos;</div>
                  <div><div className="head">{e.head}</div><div className="body">{e.body}</div></div>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="dk-card">
          <div className="t-eyebrow">LIGA · 8 PREDICCIONES</div>
          <div className="t-h3" style={{ fontSize: 16, marginTop: 4, marginBottom: 14 }}>¿QUÉ DICE LA TRIBUNA?</div>
          {[
            { who: `Gana ${home.name}`, pct: 62, color: home.c1 },
            { who: 'Empate', pct: 25, color: 'rgba(255,255,255,0.3)' },
            { who: `Gana ${away.name}`, pct: 13, color: away.c1 },
          ].map(r => (
            <div className="dk-tribuna-row" key={r.who}>
              <div className="head"><span className="label">{r.who}</span><span className="pct">{r.pct}%</span></div>
              <div className="bar"><div style={{ width: `${r.pct}%`, background: r.color }} /></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
```

- [ ] Verificar en browser que `/feed/m1` (o cualquier ID de partido) muestra:
  - Mobile (390px): layout original intacto
  - Desktop (1440px): 2-col, hero izquierda con score 80px, timeline derecha

- [ ] Commit:
```bash
git add src/app/\(main\)/feed/\[id\]/match-detail-screen.tsx
git commit -m "feat(match-detail): add desktop 2-col layout with hero and timeline"
```

---

## Checklist de auto-review Fase 2

- [ ] Mobile `/feed/m1`: layout original sin cambios
- [ ] Desktop `/feed/m1` (live): score grande, pill EN VIVO, lock notice, timeline derecha
- [ ] Desktop `/feed/m1` (pending): VS, botón "Bloquear predicción", sin timeline
- [ ] Desktop `/feed/m1` (final): score, pts ganados, timeline si existe
- [ ] `dk-md-hero` renderiza con el degradado del color del equipo local

---

---

# FASE 3 — Predictor Modal Desktop

## Qué construir

En desktop, el predictor usa un modal centrado con steppers de 100px (en lugar del bottom sheet mobile). La racha activa, los quick-picks y la info de puntos se muestran en formato más espacioso.

```
Desktop: modal centrado 640px
├── Header: equipo vs equipo + botón cerrar
├── Body: 3 columnas (flag+stepper local | VS+outcome | flag+stepper visitante)
├── Quick picks: grid de 8 chips
├── Info cards: puntos + racha
└── Footer: botones Cancelar + Bloquear

Lock state desktop: modal con ícono 84px, mensaje, predicción guardada
```

## Archivos

- **Modificar:** `src/components/domain/predictor-overlay.tsx`

---

### Tarea 3.1 — Modal desktop para estado abierto

**Archivos:**
- Modificar: `src/components/domain/predictor-overlay.tsx`

- [ ] Reemplazar la estructura interior de `PredictorInner` para usar `dk-modal` en desktop y mantener el layout mobile dentro de un `md:hidden`. La lógica (estado, quickPicks, submit) no cambia:

```tsx
// En PredictorInner, después de calcular outcome/outcomeColor, agregar:

return (
  <>
    {/* Mobile layout — bottom sheet (ya funciona vía ResponsiveDialog) */}
    <div className="md:hidden">
      {/* ... contenido mobile existente sin cambios ... */}
    </div>

    {/* Desktop layout — modal centrado */}
    <div className="hidden md:block" style={{ width: 640 }}>
      <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div className="t-eyebrow">PREDICCIÓN · {match.stage}</div>
          <div className="t-h3" style={{ fontSize: 18, marginTop: 4 }}>{match.home.name} vs {match.away.name}</div>
        </div>
        <button className="icon-btn" onClick={closePredictor}><GameIcon name="close" size={14} /></button>
      </div>

      {/* Steppers */}
      <div style={{ padding: '24px 28px', display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 24, alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <TeamFlag team={match.home} size="lg" />
          <div className="t-h3" style={{ fontSize: 16, textAlign: 'center' }}>{match.home.name}</div>
          <div className="dk-stepper">
            <div className="num" style={{ color: home > away ? 'var(--signal)' : 'var(--fg)' }}>{home}</div>
            <div className="dk-stepper-row">
              <button onClick={() => setHome(Math.max(0, home - 1))}>−</button>
              <button onClick={() => setHome(home + 1)}>+</button>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <div className="t-meta">VS</div>
          <div style={{ padding: '8px 12px', borderRadius: 8, background: outcomeColor === 'var(--fg-mute)' ? 'rgba(255,255,255,0.05)' : `${outcomeColor}26`, color: outcomeColor, fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700, whiteSpace: 'nowrap' }}>
            {outcome}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <TeamFlag team={match.away} size="lg" />
          <div className="t-h3" style={{ fontSize: 16, textAlign: 'center' }}>{match.away.name}</div>
          <div className="dk-stepper">
            <div className="num" style={{ color: away > home ? 'var(--signal)' : 'var(--fg)' }}>{away}</div>
            <div className="dk-stepper-row">
              <button onClick={() => setAway(Math.max(0, away - 1))}>−</button>
              <button onClick={() => setAway(away + 1)}>+</button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick picks */}
      <div style={{ padding: '0 28px 16px' }}>
        <div className="t-eyebrow" style={{ marginBottom: 8 }}>QUICK PICKS</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {quickPicks.map(q => (
            <button key={q.label} className={`quick-chip ${q.h === home && q.a === away ? 'on' : ''}`}
              onClick={() => { setHome(q.h); setAway(q.a) }} style={{ flex: '0 0 auto' }}>
              {q.label}
            </button>
          ))}
        </div>
      </div>

      {/* Info cards */}
      <div style={{ padding: '0 28px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div className="dk-card" style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <GameIcon name="info" size={16} color="var(--warn)" />
          <div className="t-meta" style={{ color: 'var(--fg-dim)', letterSpacing: '0.04em', textTransform: 'none', fontSize: 11 }}>
            <b style={{ color: 'var(--warn)' }}>+5 pts</b> exacto · <b style={{ color: 'var(--signal)' }}>+3</b> diferencia · <b>+1</b> ganador
          </div>
        </div>
        <div className="dk-card" style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10, borderColor: 'rgba(255,214,10,0.3)', background: 'linear-gradient(90deg, rgba(255,214,10,0.06), transparent)' }}>
          <GameIcon name="fire" size={16} color="var(--warn)" />
          <div className="t-meta" style={{ color: 'var(--fg-dim)', letterSpacing: '0.04em', textTransform: 'none', fontSize: 11 }}>
            Racha activa → bonus <b style={{ color: 'var(--warn)' }}>+3 pts</b> si acertás (máx +5)
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: '16px 24px', borderTop: '1px solid var(--line)', display: 'flex', gap: 10 }}>
        <button className="dk-btn ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={closePredictor}>Cancelar</button>
        <button className="dk-btn primary" style={{ flex: 2, justifyContent: 'center', padding: '14px 20px', fontSize: 13 }}
          onClick={submit} disabled={submitting}>
          {submitting ? 'Bloqueando…' : 'Bloquear predicción →'}
        </button>
      </div>
    </div>
  </>
)
```

El modal necesita los estilos `dk-stepper` y `dk-stepper-row`. Agregarlos en `globals.css` al final de la sección `dk-*`:

```css
/* Stepper desktop */
.dk-stepper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
}
.dk-stepper .num {
  font-family: var(--font-inter, sans-serif);
  font-weight: 900;
  font-size: 100px;
  letter-spacing: -0.07em;
  font-variation-settings: "wdth" 75;
  line-height: 0.9;
}
.dk-stepper-row {
  display: flex;
  gap: 10px;
}
.dk-stepper-row button {
  width: 56px;
  height: 44px;
  border-radius: 12px;
  background: rgba(255,255,255,0.05);
  border: 1px solid var(--line);
  color: var(--fg);
  font-family: var(--font-inter, sans-serif);
  font-weight: 900;
  font-size: 26px;
  cursor: pointer;
  transition: all 0.12s;
}
.dk-stepper-row button:hover { background: rgba(255,255,255,0.1); }
.dk-stepper-row button:active {
  background: var(--signal);
  color: #04130A;
  border-color: var(--signal);
}
```

El `ResponsiveDialog` necesita pasar el `width: 640px` al modal en desktop. Verificar cómo `ResponsiveDialogContent` maneja el ancho, y si es necesario pasar la clase `md:w-[640px]`.

- [ ] Verificar:
  - Mobile (390px): bottom sheet con steppers normales
  - Desktop (1440px): modal centrado con steppers 100px, quick picks, 2 botones footer
  - Click "Bloquear predicción": guarda, muestra toast, cierra modal
  - Click en partido bloqueado (live/final): modal con ícono lock + mensaje

- [ ] Commit:
```bash
git add src/components/domain/predictor-overlay.tsx src/app/globals.css
git commit -m "feat(predictor): add desktop modal with large steppers"
```

---

## Checklist de auto-review Fase 3

- [ ] Mobile: bottom sheet funciona igual que antes (no regresión)
- [ ] Desktop: modal centrado 640px, steppers de 100px
- [ ] Quick picks activos (chip `on`) se muestran correctamente
- [ ] Estado bloqueado desktop: modal con lock icon 84px, texto explicativo, predicción guardada
- [ ] Submit: guarda predicción en store, muestra toast verde, cierra modal

---

## Orden de ejecución recomendado

```
Fase 1 (Dashboard)     → 5 tareas → ~45 min
Fase 2 (Match Detail)  → 1 tarea  → ~20 min
Fase 3 (Predictor)     → 1 tarea  → ~25 min
```

Total estimado: ~90 min de implementación.
