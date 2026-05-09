# Design System Base — Stadium Concrete Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar la capa base del design system "Stadium Concrete" sobre Next.js 16 / React 19 / Tailwind v4 / Shadcn UI, sin base de datos ni auth.

**Architecture:** Todos los tokens viven en CSS custom properties en `globals.css`. El theming (paleta + densidad) se maneja via atributos `data-palette` y `data-density` en `<html>`, que activan overrides CSS. Un `ThemeProvider` client-side mínimo lee `localStorage` y escribe esos atributos al montar — sin SSR flash porque el default (Concrete/regular) vive en `:root` sin ningún atributo.

**Tech Stack:** Next.js 16.2.6, React 19.2.4, Tailwind v4 (`@tailwindcss/postcss`), Shadcn UI (latest), `next/font/google` (Inter + JetBrains Mono), TypeScript 5, Biome.

---

## File Map

| Archivo | Acción | Responsabilidad |
|---|---|---|
| `src/app/globals.css` | **Reescribir** | Todos los tokens CSS, paletas, densidades, estilos base, grain texture, app-shell |
| `src/app/layout.tsx` | **Modificar** | Inter + JetBrains Mono via `next/font/google`, metadata, ThemeProvider wrapper |
| `src/components/providers/theme-provider.tsx` | **Crear** | Context para paleta y densidad — lee/escribe localStorage y `document.documentElement.dataset` |

Shadcn escribe además: `components.json`, `src/lib/utils.ts`, y modifica `globals.css` (pero lo vamos a sobreescribir en el paso siguiente, así que no importa el orden).

---

## Task 1: Instalar Shadcn UI

**Files:**
- Create: `components.json` (generado por Shadcn)
- Create: `src/lib/utils.ts` (generado por Shadcn)
- Modify: `src/app/globals.css` (Shadcn agrega su capa — la sobreescribimos en Task 2)
- Modify: `package.json` (Shadcn agrega dependencias: `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`)

- [ ] **Step 1: Instalar Shadcn como dependencia de desarrollo**

```bash
npm install shadcn --save-dev
```

- [ ] **Step 2: Inicializar Shadcn con su CLI**

Corré este comando en la raíz del proyecto. Respondé las preguntas así:

```bash
npx shadcn@latest init
```

Respuestas:
- Style: `Default`
- Base color: `Slate`
- CSS variables: `Yes`

> Shadcn va a modificar `globals.css`, `package.json`, y crear `components.json` y `src/lib/utils.ts`. Eso es esperado.

- [ ] **Step 3: Verificar que `src/lib/utils.ts` fue creado**

Debe existir y contener algo como:

```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 4: Verificar que `package.json` tiene las nuevas deps**

Debe incluir al menos: `class-variance-authority`, `clsx`, `tailwind-merge`.

- [ ] **Step 5: Instalar las nuevas dependencias**

```bash
npm install
```

- [ ] **Step 6: Commit**

```bash
git add components.json src/lib/utils.ts package.json package-lock.json src/app/globals.css
git commit -m "feat: install and init shadcn ui"
```

---

## Task 2: Reescribir `globals.css` con tokens Stadium Concrete

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: Reemplazar `globals.css` completo**

Reemplazá el contenido COMPLETO del archivo con esto:

```css
@import "tailwindcss";

/* =====================================================
   SHADCN BRIDGE — Concrete (default :root)
   ===================================================== */
:root {
  --background: #0A0E1A;
  --foreground: #F5F5F7;
  --primary: #00D26A;
  --primary-foreground: #04130A;
  --secondary: #131A2A;
  --secondary-foreground: #F5F5F7;
  --muted: #131A2A;
  --muted-foreground: rgba(245, 245, 247, 0.48);
  --accent: #1A2236;
  --accent-foreground: #F5F5F7;
  --destructive: #FF3D71;
  --destructive-foreground: #ffffff;
  --border: rgba(255, 255, 255, 0.08);
  --input: rgba(255, 255, 255, 0.08);
  --ring: #00D26A;
  --radius: 18px;

  /* =====================================================
     STADIUM CONCRETE — Fondos
     ===================================================== */
  --bg: #0A0E1A;
  --bg-2: #0F1422;
  --surface: #131A2A;
  --surface-2: #1A2236;

  /* Bordes */
  --line: rgba(255, 255, 255, 0.08);
  --line-2: rgba(255, 255, 255, 0.14);

  /* Foreground */
  --fg: #F5F5F7;
  --fg-dim: rgba(245, 245, 247, 0.72);
  --fg-mute: rgba(245, 245, 247, 0.48);
  --fg-faint: rgba(245, 245, 247, 0.28);

  /* Semánticos */
  --signal: #00D26A;
  --signal-dim: #00B85B;
  --danger: #FF3D71;
  --warn: #FFD60A;

  /* Espaciado */
  --gutter: 20px;
  --card-radius: 18px;
  --card-pad: 20px;
}

/* =====================================================
   PALETA ELECTRIC
   ===================================================== */
[data-palette="electric"] {
  --background: #050810;
  --bg: #050810;
  --bg-2: #0A1020;
  --surface: #0F1730;
  --surface-2: #16213D;
  --primary: #08F7FE;
  --ring: #08F7FE;
  --signal: #08F7FE;
  --destructive: #FF2E63;
  --danger: #FF2E63;
  --warn: #D4FF3A;
}

/* =====================================================
   PALETA TERRACOTTA
   ===================================================== */
[data-palette="terracotta"] {
  --background: #1a1612;
  --bg: #1a1612;
  --bg-2: #221C16;
  --surface: #2A2118;
  --surface-2: #332820;
  --primary: #06A77D;
  --ring: #06A77D;
  --signal: #06A77D;
  --destructive: #E63946;
  --danger: #E63946;
  --warn: #F1A208;
}

/* =====================================================
   DENSIDAD COMPACT
   ===================================================== */
[data-density="compact"] {
  --gutter: 16px;
  --card-radius: 14px;
  --card-pad: 14px;
}

/* =====================================================
   TAILWIND v4 @THEME — utilities como bg-signal, text-warn, etc.
   ===================================================== */
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

/* =====================================================
   ESTILOS BASE
   ===================================================== */
*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  height: 100%;
}

body {
  background: var(--bg);
  color: var(--fg);
  font-family: var(--font-ui, Arial, sans-serif);
  font-size: 14px;
  line-height: 1.4;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  min-height: 100%;
}

/* Grain texture — identidad visual Stadium Concrete */
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

/* =====================================================
   APP SHELL — columna mobile-first centrada
   ===================================================== */
.app-shell {
  position: relative;
  z-index: 1;
  min-height: 100dvh;
  width: 100%;
  max-width: 480px;
  margin: 0 auto;
}

@media (min-width: 768px) {
  body {
    background: #07080C;
    display: flex;
    justify-content: center;
    align-items: flex-start;
  }

  .app-shell {
    box-shadow:
      0 0 0 1px rgba(255, 255, 255, 0.06),
      0 30px 80px rgba(0, 0, 0, 0.5),
      0 0 120px rgba(0, 210, 106, 0.04);
  }
}
```

- [ ] **Step 2: Verificar que el dev server no tira errores de CSS**

```bash
npm run dev
```

Abrí `http://localhost:3000` — el fondo debe ser oscuro (`#0A0E1A`). Si hay un error de PostCSS, revisá que `@import "tailwindcss"` esté en la primera línea.

- [ ] **Step 3: Commit**

```bash
git add src/app/globals.css
git commit -m "feat: add Stadium Concrete design tokens and base styles"
```

---

## Task 3: Crear `ThemeProvider`

**Files:**
- Create: `src/components/providers/theme-provider.tsx`

- [ ] **Step 1: Crear el directorio y el archivo**

Creá el archivo en `src/components/providers/theme-provider.tsx` con este contenido:

```tsx
"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Palette = "concrete" | "electric" | "terracotta";
type Density = "regular" | "compact";

interface ThemeContextValue {
  palette: Palette;
  density: Density;
  setPalette: (p: Palette) => void;
  setDensity: (d: Density) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [palette, setPaletteState] = useState<Palette>("concrete");
  const [density, setDensityState] = useState<Density>("regular");

  useEffect(() => {
    const savedPalette = localStorage.getItem("palette") as Palette | null;
    const savedDensity = localStorage.getItem("density") as Density | null;

    if (savedPalette) setPaletteState(savedPalette);
    if (savedDensity) setDensityState(savedDensity);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.palette = palette;
    localStorage.setItem("palette", palette);
  }, [palette]);

  useEffect(() => {
    document.documentElement.dataset.density = density;
    localStorage.setItem("density", density);
  }, [density]);

  function setPalette(p: Palette) {
    setPaletteState(p);
  }

  function setDensity(d: Density) {
    setDensityState(d);
  }

  return (
    <ThemeContext.Provider value={{ palette, density, setPalette, setDensity }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
```

- [ ] **Step 2: Verificar tipos con TypeScript**

```bash
npx tsc --noEmit
```

Debe pasar sin errores.

- [ ] **Step 3: Commit**

```bash
git add src/components/providers/theme-provider.tsx
git commit -m "feat: add ThemeProvider for palette and density switching"
```

---

## Task 4: Actualizar `layout.tsx`

**Files:**
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Reemplazar el contenido de `layout.tsx`**

```tsx
import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/providers/theme-provider";
import "./globals.css";

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

export const metadata: Metadata = {
  title: "The Big Polla",
  description: "Football prediction app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body>
        <ThemeProvider>
          <main className="app-shell">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Verificar tipos**

```bash
npx tsc --noEmit
```

Sin errores.

- [ ] **Step 3: Smoke test visual en el browser**

Con el dev server corriendo (`npm run dev`), abrí `http://localhost:3000`:

- El fondo debe ser `#0A0E1A` (azul/negro oscuro Stadium Concrete)
- El texto debe ser `#F5F5F7` (blanco suave)
- La fuente debe ser Inter (verificá en DevTools → Computed → font-family)
- En mobile (≤768px): la columna debe ocupar todo el ancho
- En desktop (≥768px): la columna debe estar centrada con `max-width: 480px` y el fondo de `body` debe ser `#07080C` (más oscuro que el app bg)
- Debe haber un sutil grain texture sobre el fondo

- [ ] **Step 4: Smoke test ThemeProvider en DevTools**

En la consola del browser, ejecutá:

```js
document.documentElement.dataset.palette = "electric"
```

El fondo debe cambiar a `#050810` (azul casi negro del tema Electric). Luego:

```js
document.documentElement.dataset.palette = "concrete"
```

El fondo debe volver al original.

- [ ] **Step 5: Commit final**

```bash
git add src/app/layout.tsx
git commit -m "feat: wire Inter + JetBrains Mono fonts and ThemeProvider in layout"
```

---

## Self-Review

### Spec Coverage

| Requisito del spec | Task | Estado |
|---|---|---|
| CSS custom properties (tokens + bridge Shadcn) | Task 2 | ✅ |
| 3 paletas (`concrete`, `electric`, `terracotta`) | Task 2 | ✅ |
| 2 densidades (`regular`, `compact`) | Task 2 | ✅ |
| Fuentes Inter + JetBrains Mono via `next/font/google` | Task 4 | ✅ |
| `ThemeProvider` con Context, `localStorage`, atributos en `<html>` | Task 3 | ✅ |
| Tailwind v4 `@theme` con utilities clave | Task 2 | ✅ |
| Instalación y configuración base Shadcn UI | Task 1 | ✅ |
| Estilos base responsive + grain texture + `.app-shell` | Task 2 | ✅ |
| Sin flash de paleta incorrecta (default en `:root`) | Task 2 + Task 3 | ✅ |

### Excluido por spec (fuera de scope)

- Componentes UI específicos (Flag, MatchCard, BottomNav, etc.)
- Base de datos, auth, API
- Animaciones de pantalla
