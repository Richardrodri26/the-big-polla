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

### Fase 1: Componentes Primitivos ✅
- [x] `Button` — variantes: primary, ghost, destructive (sobre Shadcn base).
- [x] `Flag` / `TeamFlag` — bandera de país con fallback emoji.
- [x] `Pill` / `GamePill` — badge de estado (live, upcoming, finished).
- [x] `Icon` — wrapper de Lucide con tamaños estandarizados.
- [x] `Topbar` — header con título, avatar y acción derecha.
- [x] `BottomNav` / `MobileBottomNav` — navegación inferior mobile-first.

### Fase 2: Componentes de Dominio ✅
- [x] `ScoreStepper` — input de predicción de goles.
- [x] `PredictorOverlay` — overlay de predicción sobre partido.
- [x] `GameIcon` — ícono de partido con estados visuales.

### Fase 3: Pantallas ✅
- [x] Feed — lista de partidos con predicciones.
- [x] Dashboard — resumen del usuario.
- [x] Leaderboard — ranking de la liga.
- [x] Oracle — predicciones especiales.
- [x] Perfil — stats del usuario.
- [x] Settings — preferencias de cuenta.
- [x] Auth — registro y login.

### Fase 4: Infraestructura ✅
- [x] PostgreSQL via Docker Compose + Prisma schema + migraciones.
- [x] Auth con `better-auth` — registro, login, sesión.
- [x] Repositorios Prisma con interfaces tipadas.
- [x] API routes: predicciones, partidos, puntuación, cron.
- [x] Proxy middleware — rutas protegidas por sesión.

### Fase 5: Match Engine y Puntuación ✅
- [x] Integración API externa (stub de partidos del Mundial 2026).
- [x] Motor de puntuación puro con multiplicadores por fase (grupo/eliminatoria).
- [x] Lógica de rachas (`streakCount`) con bonus configurable.
- [x] `ScoringService` con transacción atómica y recálculo de rankings.
- [x] Endpoints de scoring y lock de partidos.
- [x] Cron de sincronización de partidos (`/api/cron/sync`).

### Fase 6: Gestión de Ligas ✅
- [x] CRUD de ligas (`POST`, `PATCH`, `DELETE /api/leagues`).
- [x] Ligas públicas (ingreso directo) y privadas (solicitud).
- [x] Sistema de solicitudes de ingreso (`LeagueRequest` PENDING/APPROVED/REJECTED).
- [x] Dashboard de administración — owner aprueba/rechaza solicitudes.
- [x] Pantallas: Mis Ligas, Detalle de Liga, Crear Liga.

### Fase 7: Pendiente
- [ ] `ScoreLog` — desglose detallado de puntos por partido (transparencia).
- [ ] Invitaciones por link a liga privada.
- [ ] Ligas públicas paginadas/buscables (directorio).
- [ ] Límite configurable de miembros por liga.
- [ ] Leaderboard en tiempo real (polling o Server-Sent Events).
- [ ] Pantalla de perfil con historial de predicciones detallado.
- [ ] Integración real con API oficial de partidos del Mundial 2026.

---

## Modelo de Datos ✅

### Entidades implementadas en `prisma/schema.prisma`
- **User** — auth data, perfil, nombre.
- **League** — grupos de usuarios (`id`, `nombre`, `ownerId`, `type: PUBLIC | PRIVATE`).
- **LeagueMember** — membresía usuario-liga con `joinedAt`.
- **LeagueRequest** — `id`, `leagueId`, `userId`, `status: PENDING | APPROVED | REJECTED`.
- **Match** — datos de la API externa con estado y score.
- **Prediction** — pronóstico del usuario por partido (incluye estado de bloqueo).
- **Score** — acumulado del usuario en una liga con ranking.
- **ScoreLog** — registro detallado por partido (pendiente de UI).
