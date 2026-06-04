# SuperAdmin — Carga Manual de Resultados

**Fecha:** 2026-06-04  
**Estado:** Aprobado

## Motivación

Dos casos de uso:
1. Fallback cuando la API de football-data.org falla y los resultados no se sincronizan automáticamente.
2. Testing manual del motor de puntuación en un entorno de prueba.

## Modelo de datos

Agregar campo `role` al modelo `User` en Prisma:

```prisma
enum Role {
  USER
  SUPER_ADMIN
}

model User {
  // ... campos existentes
  role Role @default(USER)
}
```

Requiere una migration de Prisma. El primer superAdmin se crea en `prisma/seed.ts` con:

- **Email:** `test@gmail.com`
- **Contraseña:** `123456789`
- **Role:** `SUPER_ADMIN`

El seed hace upsert: si el usuario ya existe, actualiza el role. Si no, lo crea con better-auth (hash de contraseña incluido).

## Rutas

```
src/app/(admin)/
  layout.tsx
  admin/
    matches/
      page.tsx
      actions.ts
```

El route group `(admin)` no agrega segmento a la URL. La página queda en `/admin/matches`.

## Protección

`src/app/(admin)/layout.tsx` es un Server Component que:
1. Obtiene la sesión con better-auth.
2. Si no hay sesión → redirect a `/login`.
3. Si `user.role !== SUPER_ADMIN` → redirect a `/`.
4. Si pasa ambos checks → renderiza `{children}`.

Sin middleware adicional. Guard completo server-side.

## Server Action

`src/app/(admin)/admin/matches/actions.ts`

```typescript
"use server"

export async function setMatchResult(
  matchId: string,
  homeScore: number,
  awayScore: number
): Promise<{ ok: true } | { error: string }>
```

Flujo interno:
1. Obtener sesión → error 401 si no autenticado.
2. Verificar `user.role === SUPER_ADMIN` → error 403 si no.
3. Validar `homeScore >= 0` y `awayScore >= 0` (enteros).
4. `prisma.match.update({ state: 'FINAL', homeScore, awayScore, locked: true })`.
5. `new ScoringService().scoreMatch(matchId)`.
6. Retornar `{ ok: true }`.

Reutiliza la misma lógica que `POST /api/matches/[id]/score` pero autenticado por sesión de usuario.

## Página

`src/app/(admin)/admin/matches/page.tsx`

Tabla con todos los partidos ordenados por `kickoffAt` ascendente. Columnas:

| Local | Visitante | Fecha | Estado | Local Score | Visitante Score | Acción |
|-------|-----------|-------|--------|-------------|-----------------|--------|

- **Banderas** con el componente `<Flag>` existente.
- Partidos con `state === FINAL`: inputs readonly, sin botón de acción.
- Partidos con `state === PENDING` o `LIVE`: inputs numéricos habilitados + botón "Marcar FINAL".
- El botón usa `useTransition` para mostrar estado loading sin bloquear la UI.
- Sin filtros ni paginación (máximo 64 partidos).
- La página usa `revalidatePath` después del action para refrescar los datos.

## Seed — Primer SuperAdmin

El script `prisma/seed.ts` se actualiza para crear el primer superAdmin usando la API de better-auth (para que el password quede hasheado correctamente). Si el usuario ya existe, solo actualiza el `role` a `SUPER_ADMIN`.

## Fuera de scope

- Editar otros campos del partido (venue, equipos, kickoffAt).
- Cambiar estado a LIVE o PENDING.
- Desbloquear partidos.
- Gestión de usuarios (promover/degradar roles).
- Listado de usuarios admin.
