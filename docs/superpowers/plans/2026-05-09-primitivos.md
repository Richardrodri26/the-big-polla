# Componentes Primitivos — Fase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir los 6 componentes primitivos del design system Stadium Concrete — Button, Icon, Flag, Pill, Topbar y BottomNav — junto con una página de sandbox visual en `/dev` para verificarlos.

**Architecture:** Cada componente primitivo vive en `src/components/ui/` (átomos sin dominio) o `src/components/layout/` (estructurales). Todos consumen tokens CSS de Stadium Concrete (`--signal`, `--danger`, `--fg-mute`, etc.) directamente en clases de Tailwind — nada hardcodeado. La página `/dev` crece con cada tarea y sirve como sandbox visual durante el desarrollo. El Button de Shadcn ya funciona con nuestros tokens vía CSS variables: sólo lo verificamos visualmente y lo reexportamos. Los 5 componentes restantes son creaciones nuevas.

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind v4, `class-variance-authority`, `lucide-react`, `@base-ui/react`, `src/lib/utils.ts` (cn).

---

## File Map

| Archivo | Acción | Responsabilidad |
|---|---|---|
| `src/app/dev/page.tsx` | Crear | Sandbox visual — crece con cada tarea |
| `src/components/ui/button.tsx` | Existente | Ya funciona — sólo verificación visual |
| `src/components/ui/icon.tsx` | Crear | Wrapper de Lucide con sistema de tamaños sm/md/lg |
| `src/components/ui/flag.tsx` | Crear | Emoji de bandera de país a partir de código ISO 3166-1 alpha-2 |
| `src/components/ui/pill.tsx` | Crear | Badge de estado: live / upcoming / finished |
| `src/components/layout/topbar.tsx` | Crear | Header sticky con slots leading/trailing |
| `src/components/layout/bottom-nav.tsx` | Crear | Navegación bottom de 4 tabs, mobile-first, fixed |

---

## Task 1: Dev Sandbox + Button

El Button de Shadcn (`src/components/ui/button.tsx`) ya usa nuestros tokens CSS. Esta tarea crea el sandbox visual y verifica que el Button se vea correcto con Stadium Concrete.

**Files:**
- Create: `src/app/dev/page.tsx`
- Existing: `src/components/ui/button.tsx` (no se toca)

- [ ] **Step 1: Crear la página de sandbox**

Creá el archivo `src/app/dev/page.tsx` con este contenido:

```tsx
import { Button } from "@/components/ui/button";

export default function DevPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)] p-8 space-y-12">
      <h1 className="text-2xl font-bold text-[var(--fg)]">
        Component Sandbox
      </h1>

      {/* Button */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-[var(--fg-mute)]">
          Button
        </h2>
        <div className="flex flex-wrap gap-3">
          <Button variant="default">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="link">Link</Button>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="default" size="sm">Small</Button>
          <Button variant="default" size="default">Default</Button>
          <Button variant="default" size="lg">Large</Button>
          <Button variant="default" disabled>Disabled</Button>
        </div>
      </section>
    </div>
  );
}
```

- [ ] **Step 2: Arrancar el dev server y verificar visualmente**

```bash
npm run dev
```

Abrí `http://localhost:3000/dev`. Verificá:
- Botón `Primary`: fondo verde (`#00D26A`), texto oscuro (`#04130A`)
- Botón `Secondary`: fondo azul oscuro (`#131A2A`), texto blanco
- Botón `Ghost`: transparente, texto aparece al hover
- Botón `Destructive`: tono rojo suave (el Shadcn default es bg/10)
- Botón `Disabled`: opacidad 50%, no clickeable

- [ ] **Step 3: Commit**

```bash
git add src/app/dev/page.tsx
git commit -m "feat: add dev sandbox page with Button verification"
```

---

## Task 2: Icon

Wrapper tipado de Lucide que estandariza los tamaños. Los consumidores siempre reciben el mismo tamaño con la misma prop, sin magic numbers dispersos.

**Files:**
- Create: `src/components/ui/icon.tsx`
- Modify: `src/app/dev/page.tsx`

- [ ] **Step 1: Crear `src/components/ui/icon.tsx`**

```tsx
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const sizeMap = {
  sm: 14,
  md: 18,
  lg: 24,
} as const;

interface IconProps {
  icon: LucideIcon;
  size?: keyof typeof sizeMap;
  className?: string;
}

export function Icon({ icon: IconComponent, size = "md", className }: IconProps) {
  return (
    <IconComponent
      size={sizeMap[size]}
      className={cn("shrink-0", className)}
    />
  );
}
```

- [ ] **Step 2: Verificar tipos**

```bash
npx tsc --noEmit
```

Esperado: sin errores.

- [ ] **Step 3: Agregar Icon al sandbox**

En `src/app/dev/page.tsx`, agregá este import arriba:

```tsx
import { Home, Trophy, User, Calendar } from "lucide-react";
import { Icon } from "@/components/ui/icon";
```

Y agregá esta sección al final del `<div className="space-y-12">`:

```tsx
{/* Icon */}
<section className="space-y-4">
  <h2 className="text-sm font-semibold uppercase tracking-widest text-[var(--fg-mute)]">
    Icon
  </h2>
  <div className="flex items-end gap-6 text-[var(--fg)]">
    <div className="flex flex-col items-center gap-1">
      <Icon icon={Home} size="sm" />
      <span className="text-xs text-[var(--fg-faint)]">sm</span>
    </div>
    <div className="flex flex-col items-center gap-1">
      <Icon icon={Home} size="md" />
      <span className="text-xs text-[var(--fg-faint)]">md</span>
    </div>
    <div className="flex flex-col items-center gap-1">
      <Icon icon={Home} size="lg" />
      <span className="text-xs text-[var(--fg-faint)]">lg</span>
    </div>
    <Icon icon={Trophy} size="lg" className="text-[var(--signal)]" />
    <Icon icon={User} size="lg" className="text-[var(--fg-mute)]" />
    <Icon icon={Calendar} size="lg" className="text-[var(--warn)]" />
  </div>
</section>
```

- [ ] **Step 4: Verificar visualmente en `/dev`**

- Tres tamaños de `Home`: 14px, 18px, 24px visiblemente distintos
- `Trophy` en verde señal
- `User` en gris muted
- `Calendar` en amarillo warn

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/icon.tsx src/app/dev/page.tsx
git commit -m "feat: add Icon component with sm/md/lg size system"
```

---

## Task 3: Flag

Convierte un código ISO 3166-1 alpha-2 (ej: `"AR"`, `"BR"`, `"FR"`) a emoji de bandera usando indicadores regionales Unicode. No requiere assets externos.

**Files:**
- Create: `src/components/ui/flag.tsx`
- Modify: `src/app/dev/page.tsx`

- [ ] **Step 1: Crear `src/components/ui/flag.tsx`**

```tsx
import { cn } from "@/lib/utils";

const sizeClass = {
  sm: "text-base",   // 16px
  md: "text-2xl",   // 24px
  lg: "text-4xl",   // 36px
} as const;

function toFlagEmoji(code: string): string {
  return [...code.toUpperCase()]
    .map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65))
    .join("");
}

interface FlagProps {
  code: string;
  size?: keyof typeof sizeClass;
  className?: string;
}

export function Flag({ code, size = "md", className }: FlagProps) {
  return (
    <span
      role="img"
      aria-label={`Flag ${code.toUpperCase()}`}
      className={cn("inline-block leading-none", sizeClass[size], className)}
    >
      {toFlagEmoji(code)}
    </span>
  );
}
```

- [ ] **Step 2: Verificar tipos**

```bash
npx tsc --noEmit
```

Esperado: sin errores.

- [ ] **Step 3: Agregar Flag al sandbox**

En `src/app/dev/page.tsx`, agregá el import:

```tsx
import { Flag } from "@/components/ui/flag";
```

Y la sección al final del `<div className="space-y-12">`:

```tsx
{/* Flag */}
<section className="space-y-4">
  <h2 className="text-sm font-semibold uppercase tracking-widest text-[var(--fg-mute)]">
    Flag
  </h2>
  <div className="flex items-end gap-6">
    <div className="flex flex-col items-center gap-1">
      <Flag code="AR" size="sm" />
      <span className="text-xs text-[var(--fg-faint)]">sm</span>
    </div>
    <div className="flex flex-col items-center gap-1">
      <Flag code="AR" size="md" />
      <span className="text-xs text-[var(--fg-faint)]">md</span>
    </div>
    <div className="flex flex-col items-center gap-1">
      <Flag code="AR" size="lg" />
      <span className="text-xs text-[var(--fg-faint)]">lg</span>
    </div>
    <Flag code="BR" size="lg" />
    <Flag code="FR" size="lg" />
    <Flag code="DE" size="lg" />
    <Flag code="ES" size="lg" />
    <Flag code="US" size="lg" />
  </div>
</section>
```

- [ ] **Step 4: Verificar visualmente en `/dev`**

- 🇦🇷 en tres tamaños distintos
- 🇧🇷 🇫🇷 🇩🇪 🇪🇸 🇺🇸 correctamente renderizados

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/flag.tsx src/app/dev/page.tsx
git commit -m "feat: add Flag component with ISO 3166-1 alpha-2 to emoji conversion"
```

---

## Task 4: Pill

Badge de estado para partidos. El estado `live` tiene un indicador pulsante para comunicar urgencia visual.

**Files:**
- Create: `src/components/ui/pill.tsx`
- Modify: `src/app/dev/page.tsx`

- [ ] **Step 1: Crear `src/components/ui/pill.tsx`**

```tsx
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const pillVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
  {
    variants: {
      status: {
        live: "bg-[var(--danger)] text-white",
        upcoming: "border border-[var(--line-2)] bg-[var(--surface)] text-[var(--fg-mute)]",
        finished: "bg-[var(--surface-2)] text-[var(--fg-faint)]",
      },
    },
    defaultVariants: {
      status: "upcoming",
    },
  }
);

interface PillProps extends VariantProps<typeof pillVariants> {
  className?: string;
}

export function Pill({ status, className }: PillProps) {
  const labels: Record<NonNullable<typeof status>, string> = {
    live: "En vivo",
    upcoming: "Próximo",
    finished: "Finalizado",
  };

  return (
    <span className={cn(pillVariants({ status }), className)}>
      {status === "live" && (
        <span className="relative flex size-1.5">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-white opacity-75" />
          <span className="relative inline-flex size-1.5 rounded-full bg-white" />
        </span>
      )}
      {labels[status ?? "upcoming"]}
    </span>
  );
}
```

- [ ] **Step 2: Verificar tipos**

```bash
npx tsc --noEmit
```

Esperado: sin errores.

- [ ] **Step 3: Agregar Pill al sandbox**

En `src/app/dev/page.tsx`, agregá el import:

```tsx
import { Pill } from "@/components/ui/pill";
```

Y la sección al final del `<div className="space-y-12">`:

```tsx
{/* Pill */}
<section className="space-y-4">
  <h2 className="text-sm font-semibold uppercase tracking-widest text-[var(--fg-mute)]">
    Pill
  </h2>
  <div className="flex flex-wrap gap-3">
    <Pill status="live" />
    <Pill status="upcoming" />
    <Pill status="finished" />
  </div>
</section>
```

- [ ] **Step 4: Verificar visualmente en `/dev`**

- `live`: fondo rojo sólido (`#FF3D71`), texto blanco, punto pulsante a la izquierda
- `upcoming`: borde sutil, fondo surface oscuro, texto gris
- `finished`: muy opaco/dim

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/pill.tsx src/app/dev/page.tsx
git commit -m "feat: add Pill status badge with live pulse animation"
```

---

## Task 5: Topbar

Header sticky que se queda en el top del viewport. Tiene slots `leading` (izquierda) y `trailing` (derecha) para acciones contextuales. El título siempre está centrado en términos visuales (o alineado a la izquierda si hay un slot leading).

**Files:**
- Create: `src/components/layout/topbar.tsx`
- Modify: `src/app/dev/page.tsx`

- [ ] **Step 1: Crear el directorio y el archivo**

```tsx
// src/components/layout/topbar.tsx
import { cn } from "@/lib/utils";

interface TopbarProps {
  title: string;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  className?: string;
}

export function Topbar({ title, leading, trailing, className }: TopbarProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-[var(--line)] bg-[var(--bg)]/80 px-[var(--gutter)] backdrop-blur-sm",
        className
      )}
    >
      {leading && (
        <div className="flex shrink-0 items-center">{leading}</div>
      )}
      <h1 className="flex-1 truncate text-base font-semibold text-[var(--fg)]">
        {title}
      </h1>
      {trailing && (
        <div className="flex shrink-0 items-center gap-2">{trailing}</div>
      )}
    </header>
  );
}
```

- [ ] **Step 2: Verificar tipos**

```bash
npx tsc --noEmit
```

Esperado: sin errores.

- [ ] **Step 3: Agregar Topbar al sandbox**

En `src/app/dev/page.tsx`, agregá los imports:

```tsx
import { ChevronLeft, Bell } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
```

Y la sección al **inicio**, justo después del `<h1>Component Sandbox</h1>`:

```tsx
{/* Topbar */}
<section className="space-y-4">
  <h2 className="text-sm font-semibold uppercase tracking-widest text-[var(--fg-mute)]">
    Topbar
  </h2>
  <div className="border border-[var(--line)] rounded-[var(--card-radius)] overflow-hidden space-y-0.5">
    <Topbar title="The Big Polla" />
    <Topbar
      title="Fase de Grupos"
      leading={
        <button type="button" className="text-[var(--fg-mute)]">
          <ChevronLeft size={20} />
        </button>
      }
    />
    <Topbar
      title="Mi Liga"
      leading={
        <button type="button" className="text-[var(--fg-mute)]">
          <ChevronLeft size={20} />
        </button>
      }
      trailing={
        <button type="button" className="text-[var(--fg-mute)]">
          <Bell size={18} />
        </button>
      }
    />
  </div>
</section>
```

- [ ] **Step 4: Verificar visualmente en `/dev`**

- 3 variantes de Topbar apiladas
- Fondo semi-transparente con blur (efecto glass sobre el bg oscuro)
- Título truncado si es largo
- Slots leading/trailing aparecen correctamente

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/topbar.tsx src/app/dev/page.tsx
git commit -m "feat: add Topbar layout component with leading/trailing slots"
```

---

## Task 6: BottomNav

Navegación fija en la parte inferior. Usa `usePathname()` de Next.js para resaltar el tab activo. Se centra dentro del `max-w-[480px]` de la app-shell — mismo ancho, misma posición.

**Files:**
- Create: `src/components/layout/bottom-nav.tsx`
- Modify: `src/app/dev/page.tsx`

- [ ] **Step 1: Crear `src/components/layout/bottom-nav.tsx`**

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface NavItem {
  icon: LucideIcon;
  label: string;
  href: string;
}

interface BottomNavProps {
  items: NavItem[];
}

export function BottomNav({ items }: BottomNavProps) {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-1/2 z-40 flex h-16 w-full max-w-[480px] -translate-x-1/2 items-center border-t border-[var(--line)] bg-[var(--bg)]/90 backdrop-blur-sm">
      {items.map((item) => {
        const isActive = pathname === item.href;
        const IconComponent = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[10px] font-semibold uppercase tracking-wide transition-colors",
              isActive
                ? "text-[var(--signal)]"
                : "text-[var(--fg-mute)] hover:text-[var(--fg-dim)]"
            )}
          >
            <IconComponent size={22} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
```

- [ ] **Step 2: Verificar tipos**

```bash
npx tsc --noEmit
```

Esperado: sin errores.

- [ ] **Step 3: Agregar BottomNav al sandbox**

En `src/app/dev/page.tsx`, agregá los imports:

```tsx
import { Home, Trophy, Calendar, User } from "lucide-react";
import { BottomNav } from "@/components/layout/bottom-nav";
```

> Nota: `Home`, `Trophy`, `Calendar`, `User` ya podrían estar importados de Task 2. No duplicar imports, usá los ya existentes.

Y la sección al final del `<div className="space-y-12">`:

```tsx
{/* BottomNav */}
<section className="space-y-4">
  <h2 className="text-sm font-semibold uppercase tracking-widest text-[var(--fg-mute)]">
    BottomNav
  </h2>
  <p className="text-xs text-[var(--fg-faint)]">
    Fixed en el bottom real — verificar scrolleando la página.
  </p>
</section>
```

Y en el `layout.tsx` de la página `/dev`, ó directamente al final del return de `DevPage`, añadí el BottomNav real (fuera del `<div className="space-y-12">`):

```tsx
<BottomNav
  items={[
    { icon: Home, label: "Inicio", href: "/" },
    { icon: Calendar, label: "Partidos", href: "/partidos" },
    { icon: Trophy, label: "Liga", href: "/liga" },
    { icon: User, label: "Perfil", href: "/perfil" },
  ]}
/>
```

El return completo de `DevPage` queda así:

```tsx
export default function DevPage() {
  return (
    <>
      <div className="min-h-screen bg-[var(--bg)] p-8 pb-24 space-y-12">
        <h1 className="text-2xl font-bold text-[var(--fg)]">
          Component Sandbox
        </h1>

        {/* Topbar */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-[var(--fg-mute)]">
            Topbar
          </h2>
          <div className="border border-[var(--line)] rounded-[var(--card-radius)] overflow-hidden space-y-0.5">
            <Topbar title="The Big Polla" />
            <Topbar
              title="Fase de Grupos"
              leading={
                <button type="button" className="text-[var(--fg-mute)]">
                  <ChevronLeft size={20} />
                </button>
              }
            />
            <Topbar
              title="Mi Liga"
              leading={
                <button type="button" className="text-[var(--fg-mute)]">
                  <ChevronLeft size={20} />
                </button>
              }
              trailing={
                <button type="button" className="text-[var(--fg-mute)]">
                  <Bell size={18} />
                </button>
              }
            />
          </div>
        </section>

        {/* Button */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-[var(--fg-mute)]">
            Button
          </h2>
          <div className="flex flex-wrap gap-3">
            <Button variant="default">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="link">Link</Button>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="default" size="sm">Small</Button>
            <Button variant="default" size="default">Default</Button>
            <Button variant="default" size="lg">Large</Button>
            <Button variant="default" disabled>Disabled</Button>
          </div>
        </section>

        {/* Icon */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-[var(--fg-mute)]">
            Icon
          </h2>
          <div className="flex items-end gap-6 text-[var(--fg)]">
            <div className="flex flex-col items-center gap-1">
              <Icon icon={Home} size="sm" />
              <span className="text-xs text-[var(--fg-faint)]">sm</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Icon icon={Home} size="md" />
              <span className="text-xs text-[var(--fg-faint)]">md</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Icon icon={Home} size="lg" />
              <span className="text-xs text-[var(--fg-faint)]">lg</span>
            </div>
            <Icon icon={Trophy} size="lg" className="text-[var(--signal)]" />
            <Icon icon={User} size="lg" className="text-[var(--fg-mute)]" />
            <Icon icon={Calendar} size="lg" className="text-[var(--warn)]" />
          </div>
        </section>

        {/* Flag */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-[var(--fg-mute)]">
            Flag
          </h2>
          <div className="flex items-end gap-6">
            <div className="flex flex-col items-center gap-1">
              <Flag code="AR" size="sm" />
              <span className="text-xs text-[var(--fg-faint)]">sm</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Flag code="AR" size="md" />
              <span className="text-xs text-[var(--fg-faint)]">md</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Flag code="AR" size="lg" />
              <span className="text-xs text-[var(--fg-faint)]">lg</span>
            </div>
            <Flag code="BR" size="lg" />
            <Flag code="FR" size="lg" />
            <Flag code="DE" size="lg" />
            <Flag code="ES" size="lg" />
            <Flag code="US" size="lg" />
          </div>
        </section>

        {/* Pill */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-[var(--fg-mute)]">
            Pill
          </h2>
          <div className="flex flex-wrap gap-3">
            <Pill status="live" />
            <Pill status="upcoming" />
            <Pill status="finished" />
          </div>
        </section>

        {/* BottomNav */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-[var(--fg-mute)]">
            BottomNav
          </h2>
          <p className="text-xs text-[var(--fg-faint)]">
            Fixed en el bottom real — verificar scrolleando la página.
          </p>
        </section>
      </div>

      <BottomNav
        items={[
          { icon: Home, label: "Inicio", href: "/" },
          { icon: Calendar, label: "Partidos", href: "/partidos" },
          { icon: Trophy, label: "Liga", href: "/liga" },
          { icon: User, label: "Perfil", href: "/perfil" },
        ]}
      />
    </>
  );
}
```

> Nota: el `<div>` raíz ahora tiene `pb-24` para que el contenido no quede tapado por el BottomNav fijo.

- [ ] **Step 4: Verificar visualmente en `/dev`**

- BottomNav fixed al bottom de la ventana (no del scroll)
- Tab "Inicio" activo en verde signal (pathname es `/dev`, no coincide con ningún href — todos quedarán inactivos, que es correcto)
- Scrolleando la página el BottomNav no se mueve
- Fondo semi-transparente con blur
- En desktop (>768px): el BottomNav respeta el max-width de 480px y está centrado

- [ ] **Step 5: Commit final**

```bash
git add src/components/layout/bottom-nav.tsx src/app/dev/page.tsx
git commit -m "feat: add BottomNav layout component with active state via usePathname"
```

---

## Self-Review

### Cobertura del Roadmap (Fase 1)

| Componente | Task | Archivo | Estado |
|---|---|---|---|
| Button — verify/tune | Task 1 | `src/components/ui/button.tsx` (existente) | ✅ |
| Dev sandbox | Task 1 | `src/app/dev/page.tsx` | ✅ |
| Icon | Task 2 | `src/components/ui/icon.tsx` | ✅ |
| Flag | Task 3 | `src/components/ui/flag.tsx` | ✅ |
| Pill | Task 4 | `src/components/ui/pill.tsx` | ✅ |
| Topbar | Task 5 | `src/components/layout/topbar.tsx` | ✅ |
| BottomNav | Task 6 | `src/components/layout/bottom-nav.tsx` | ✅ |

### Decisiones explícitas

| Decisión | Razón |
|---|---|
| Flag via emoji Unicode (no assets) | Sin dependencias externas, 0 requests HTTP, funciona offline |
| BottomNav con `fixed` + `left-1/2 -translate-x-1/2` | Se centra con el app-shell de 480px sin necesitar un wrapper adicional |
| Topbar con `sticky` (no `fixed`) | Se comporta correctamente dentro del flujo del app-shell |
| Pill `live` con `animate-ping` de Tailwind | `tw-animate-css` ya está incluido — no hay dependencia adicional |
| Button de Shadcn intacto | Ya consume nuestros tokens CSS — reescribirlo sería YAGNI |
| `/dev` page (no protegida) | Es dev-only; se puede proteger o eliminar en producción si hace falta |
