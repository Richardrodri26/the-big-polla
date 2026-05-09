# Roadmap: The Big Polla — Mundial 2026

## Funcionalidades Principales

- **Design System:** Stack visual "Stadium Concrete" — 3 paletas, 2 densidades, theming CSS puro.
- **Auth System:** Registro, login y gestión de sesión con `better-auth`.
- **Gestión de Ligas:** Creación, configuración pública/privada, sistema de solicitudes de ingreso.
- **Match Engine:** Sincronización de partidos vía API externa.
- **Predictor:** Interfaz fluida para predicciones, bloqueada automáticamente al iniciar el partido.
- **Sistema de Puntuación:** Cálculo automático post-partido (resultado, goles, diferencia) + rachas.
- **Transparencia:** Dashboard de puntaje con desglose detallado (`ScoreLog`).
- **Leaderboard:** Ranking actualizado en tiempo real.

---

## Roadmap de Implementación

### Fase 0: Design System Base ✅
- [x] CSS custom properties — tokens Stadium Concrete + bridge Shadcn UI.
- [x] 3 paletas intercambiables: `Concrete`, `Electric`, `Terracotta`.
- [x] 2 modos de densidad: `regular`, `compact`.
- [x] Fuentes Inter + JetBrains Mono via `next/font/google`.
- [x] `ThemeProvider` — Context para paleta/densidad, persiste en `localStorage`.
- [x] Tailwind v4 `@theme` con utilities `bg-signal`, `text-warn`, `bg-surface`, etc.
- [x] Instalación y configuración base de Shadcn UI (v4, `@base-ui/react`).
- [x] Estilos base responsive: grain texture, `.app-shell` mobile-first centrado.

### Fase 1: Componentes Primitivos
- [ ] `Button` — variantes: primary, ghost, destructive (sobre Shadcn base).
- [ ] `Flag` — bandera de país con fallback emoji.
- [ ] `Pill` — badge de estado (live, upcoming, finished).
- [ ] `Icon` — wrapper de Lucide con tamaños estandarizados.
- [ ] `Topbar` — header con título, avatar y acción derecha.
- [ ] `BottomNav` — navegación inferior de 4 tabs (mobile-first).

### Fase 2: Componentes de Dominio
- [ ] `MatchCard` — 3 variantes: upcoming, live, finished.
- [ ] `ScoreStepper` — input de predicción de goles.
- [ ] `LeaderboardRow` — fila de ranking con avatar, nombre y puntos.

### Fase 3: Pantallas con Mock Data
- [ ] Home — lista de partidos del día.
- [ ] Predicción — formulario bloqueable.
- [ ] Leaderboard — ranking de la liga.
- [ ] Perfil — stats del usuario.

### Fase 4: Infraestructura
- [ ] PostgreSQL via Docker Compose + Prisma schema.
- [ ] Auth con `better-auth`.
- [ ] API routes (predicciones, partidos, puntuación).

### Fase 5: Match Engine y Puntuación
- [ ] Integración API externa (partidos del Mundial 2026).
- [ ] Motor de puntuación según `SPEC.md`.
- [ ] Lógica de rachas (`streakCount`).
- [ ] Generación de `ScoreLog` para transparencia.

### Fase 6: Gestión de Ligas
- [ ] CRUD de Ligas.
- [ ] Ligas públicas y privadas.
- [ ] Sistema de solicitudes de ingreso (`LeagueRequest`).
- [ ] Dashboard de administración para creadores.

---

## Modelo de Datos (Pendiente — Prisma)

### Entidades
- **User** — auth data, perfil, nombre.
- **League** — grupos de usuarios (`id`, `nombre`, `ownerId`, `type: PUBLIC | PRIVATE`).
- **LeagueRequest** — `id`, `leagueId`, `userId`, `status: PENDING | APPROVED | REJECTED`.
- **Match** — datos de la API externa.
- **Prediction** — pronóstico del usuario por partido (incluye estado de bloqueo).
- **Score** — acumulado del usuario en una liga.
- **ScoreLog** — registro detallado de cada punto para transparencia.
