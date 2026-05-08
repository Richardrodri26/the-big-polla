# Design System Base — The Big Polla
**Date:** 2026-05-08  
**Status:** Approved  
**Approach:** Shadcn UI bridge (Option A)

---

## Objetivo

Implementar la capa base del design system "Stadium Concrete" sobre el stack actual (Next.js 16, React 19, Tailwind v4, Shadcn UI), sin base de datos ni autenticación. Todo lo que construyamos en fases siguientes depende de esta base.

---

## Alcance

**Incluido:**
- CSS custom properties (tokens de Stadium Concrete + bridge Shadcn)
- 3 paletas de color intercambiables (`Concrete`, `Electric`, `Terracotta`)
- 2 modos de densidad (`regular`, `compact`)
- Fuentes Inter + JetBrains Mono via `next/font/google`
- `ThemeProvider` — Context para cambiar paleta/densidad, persiste en `localStorage`
- Configuración de Tailwind v4 `@theme` con utilities clave
- Instalación y configuración base de Shadcn UI
- Estilos base responsive (mobile-first)

**Excluido:**
- Componentes UI específicos (Flag, MatchCard, BottomNav, etc.) — siguiente fase
- Base de datos, auth, API
- Animaciones específicas de pantalla

---

## Arquitectura

### Archivos afectados

| Archivo | Acción | Descripción |
|---|---|---|
| `src/app/globals.css` | Reescribir | Todos los tokens CSS, paletas, densidades, estilos base |
| `src/app/layout.tsx` | Modificar | Fuentes Inter + JetBrains Mono, ThemeProvider wrapper, metadata |
| `src/components/providers/theme-provider.tsx` | Crear | Context para paleta y densidad |

### Flujo de datos

```
globals.css (:root)
  ↓ variables Shadcn bridge (--background, --primary, --destructive, --border, --ring, --radius)
  ↓ variables Stadium Concrete (--bg, --signal, --warn, --surface, --line, --fg-*)
  ↓ @theme Tailwind v4 (utilities: bg-signal, text-warn, bg-surface, font-display, font-mono)

<html data-palette="concrete" data-density="regular">
  ↓ ThemeProvider lee localStorage al montar
  ↓ escribe data-palette y data-density en document.documentElement
  ↓ CSS overrides [data-palette="electric"] / [data-palette="terracotta"] se activan
```

Sin magia — todo el theming vive en CSS. El Context solo actualiza dos atributos en `<html>`.

---

## CSS Tokens

### Concrete (default — `:root`)

**Shadcn bridge:**
```css
--background: #0A0E1A;
--foreground: #F5F5F7;
--primary: #00D26A;
--primary-foreground: #04130A;
--secondary: #131A2A;
--secondary-foreground: #F5F5F7;
--muted: #131A2A;
--muted-foreground: rgba(245,245,247,0.48);
--accent: #1A2236;
--accent-foreground: #F5F5F7;
--destructive: #FF3D71;
--destructive-foreground: #ffffff;
--border: rgba(255,255,255,0.08);
--input: rgba(255,255,255,0.08);
--ring: #00D26A;
--radius: 18px;
```

**Stadium Concrete custom:**
```css
/* Fondos */
--bg: #0A0E1A;        --bg-2: #0F1422;
--surface: #131A2A;   --surface-2: #1A2236;

/* Bordes */
--line: rgba(255,255,255,0.08);
--line-2: rgba(255,255,255,0.14);

/* Foreground */
--fg: #F5F5F7;
--fg-dim: rgba(245,245,247,0.72);
--fg-mute: rgba(245,245,247,0.48);
--fg-faint: rgba(245,245,247,0.28);

/* Semánticos */
--signal: #00D26A;   --signal-dim: #00B85B;
--danger: #FF3D71;
--warn: #FFD60A;

/* Espaciado */
--gutter: 20px;
--card-radius: 18px;
--card-pad: 20px;
```

### Paleta Electric (`[data-palette="electric"]`)
```css
--background: #050810;  --bg: #050810;   --bg-2: #0A1020;
--surface: #0F1730;     --surface-2: #16213D;
--primary: #08F7FE;     --signal: #08F7FE;
--destructive: #FF2E63; --danger: #FF2E63;
--warn: #D4FF3A;
```

### Paleta Terracotta (`[data-palette="terracotta"]`)
```css
--background: #1a1612;  --bg: #1a1612;   --bg-2: #221C16;
--surface: #2A2118;     --surface-2: #332820;
--primary: #06A77D;     --signal: #06A77D;
--destructive: #E63946; --danger: #E63946;
--warn: #F1A208;
```

### Density Compact (`[data-density="compact"]`)
```css
--gutter: 16px;
--card-radius: 14px;
--card-pad: 14px;
```

### Tailwind v4 `@theme`
Solo los tokens que se usan frecuentemente en JSX como utility classes:
```css
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);
  --color-signal: var(--signal);
  --color-danger: var(--danger);
  --color-warn: var(--warn);
  --color-surface: var(--surface);
  --color-surface-2: var(--surface-2);
  --color-border: var(--border);
  --font-display: var(--font-inter);
  --font-ui: var(--font-inter);
  --font-mono: var(--font-jetbrains);
}
```

---

## Fuentes

Reemplazar Geist por Inter + JetBrains Mono. Ambas via `next/font/google`.

```ts
// layout.tsx
import { Inter, JetBrains_Mono } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});
```

Variables CSS apuntan a las font variables de Next.js:
```css
--font-display: var(--font-inter);
--font-ui: var(--font-inter);
--font-mono: var(--font-jetbrains);
```

---

## ThemeProvider

Componente client-side mínimo. Responsabilidades:
1. Leer `localStorage` al montar (`palette`, `density`)
2. Escribir `data-palette` y `data-density` en `document.documentElement.dataset`
3. Exponer `setPalette(palette: Palette)` y `setDensity(density: Density)` via Context
4. Persistir cambios en `localStorage`

```ts
type Palette = "concrete" | "electric" | "terracotta";
type Density = "regular" | "compact";

interface ThemeContextValue {
  palette: Palette;
  density: Density;
  setPalette: (p: Palette) => void;
  setDensity: (d: Density) => void;
}
```

Defaults: `palette: "concrete"`, `density: "regular"`.

El `<html>` en `layout.tsx` NO necesita los atributos en el server — el ThemeProvider los agrega en el cliente al montar. No hay flash de estilo incorrecto porque el default (Concrete / regular) está definido en `:root` sin atributo.

---

## Estilos base responsive

Mobile-first. La app es intrínsecamente mobile — en pantallas grandes se centra.

```css
body {
  background: var(--bg);
  color: var(--fg);
  font-family: var(--font-ui);
  font-size: 14px;
  line-height: 1.4;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Grain texture — identidad visual Stadium Concrete */
/* Aplicado sobre el body como overlay */
body::before {
  content: "";
  position: fixed;
  inset: 0;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.05 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>");
  opacity: 0.7;
  pointer-events: none;
  z-index: 1000;
  mix-blend-mode: overlay;
}

/* Contenedor principal de la app.
   Aplicado en layout.tsx sobre el <main> que envuelve {children} */
.app-shell {
  position: relative;
  z-index: 1;        /* sobre el grain del body */
  min-height: 100dvh;
  width: 100%;
  max-width: 480px;
  margin: 0 auto;
}

/* En desktop: separación visual del stage background */
@media (min-width: 768px) {
  body {
    background: #07080C;  /* stage más oscuro que el app bg */
    display: flex;
    justify-content: center;
    align-items: flex-start;
  }
  .app-shell {
    box-shadow:
      0 0 0 1px rgba(255,255,255,0.06),
      0 30px 80px rgba(0,0,0,0.5),
      0 0 120px rgba(0,210,106,0.04);
  }
}
```

El `.app-shell` se aplica en `layout.tsx`:
```tsx
<body>
  <ThemeProvider>
    <main className="app-shell">{children}</main>
  </ThemeProvider>
</body>
```

---

## Instalación de Shadcn

```bash
npx shadcn@latest init
```

Configuración durante el init:
- Style: `default`
- Base color: `slate` (será sobreescrito por nuestros tokens)
- CSS variables: `yes`

Los componentes Shadcn se instalan bajo demanda (`npx shadcn@latest add sheet`, `toast`, etc.) en fases siguientes.

---

## Decisiones explícitas

| Decisión | Razón |
|---|---|
| Tokens en hex (no HSL) | Coincide con el diseño, más legible, Shadcn acepta cualquier formato en Tailwind v4 |
| ThemeProvider solo en cliente | Los defaults viven en `:root`, no hay flash sin SSR |
| `max-w-[480px]` en desktop | La app es mobile-first; en pantallas grandes se centra como columna |
| Sin flash de paleta incorrecta | El default (Concrete) es el `:root` base, sin `data-palette` el CSS ya funciona |
| `font-display: swap` | Evita FOIT (Flash of Invisible Text) en carga inicial |

---

## Próximos pasos (fuera de alcance de este spec)

1. Componentes primitivos: `Flag`, `Icon`, `Pill`, `Button`, `Topbar`, `BottomNav`
2. Componentes de dominio: `MatchCard` (3 variantes), `ScoreStepper`, `LeaderboardRow`
3. Pantallas con mock data
4. Auth (better-auth) + DB (PostgreSQL via Docker Compose)
