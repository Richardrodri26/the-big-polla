# The Big Polla · Design System Brief
## "Stadium Concrete" — Mundial 2026

Estética visual inspirada en pósters deportivos estilo Nike/adidas.  
Prototipo de referencia: bundle Claude Design (`the-big-polla/project/`).

---

## 1. Paletas de color

El sistema soporta 3 paletas intercambiables vía `data-palette` en `<html>`.

### Concrete (default)
| Token | Valor | Uso |
|---|---|---|
| `--bg` | `#0A0E1A` | Fondo principal |
| `--bg-2` | `#0F1422` | Fondo secundario (sheets) |
| `--surface` | `#131A2A` | Superficies de cards |
| `--surface-2` | `#1A2236` | Cards elevadas |
| `--line` | `rgba(255,255,255,0.08)` | Bordes sutiles |
| `--line-2` | `rgba(255,255,255,0.14)` | Bordes más visibles |
| `--fg` | `#F5F5F7` | Texto principal |
| `--fg-dim` | `rgba(245,245,247,0.72)` | Texto secundario |
| `--fg-mute` | `rgba(245,245,247,0.48)` | Texto terciario / labels |
| `--fg-faint` | `rgba(245,245,247,0.28)` | Texto decorativo |
| `--signal` | `#00D26A` | Verde · live / win / CTA |
| `--signal-dim` | `#00B85B` | Hover de signal |
| `--danger` | `#FF3D71` | Rojo · lose / error / lock |
| `--warn` | `#FFD60A` | Amarillo · puntos / ranking |

### Electric
| Token | Override |
|---|---|
| `--bg` | `#050810` |
| `--bg-2` | `#0A1020` |
| `--surface` | `#0F1730` |
| `--surface-2` | `#16213D` |
| `--signal` | `#08F7FE` |
| `--danger` | `#FF2E63` |
| `--warn` | `#D4FF3A` |

### Terracotta
| Token | Override |
|---|---|
| `--bg` | `#1a1612` |
| `--bg-2` | `#221C16` |
| `--surface` | `#2A2118` |
| `--surface-2` | `#332820` |
| `--signal` | `#06A77D` |
| `--danger` | `#E63946` |
| `--warn` | `#F1A208` |

---

## 2. Tipografía

Dos familias, responsabilidades distintas.

| Familia | Variable CSS | Uso |
|---|---|---|
| **Inter** | `--display`, `--ui` | Títulos, scores, nombres, botones |
| **JetBrains Mono** | `--mono` | Labels, codes, tiempo, metadata |

### Escala tipográfica (clases CSS)

| Clase | Familia | Size | Weight | Características |
|---|---|---|---|---|
| `.t-display` | Inter | variable | 900 | `letter-spacing: -0.04em`, `line-height: 0.92`, condensed (`wdth: 75`) |
| `.t-h1` | Inter | 56px | 900 | Uppercase, condensed, `line-height: 0.9` |
| `.t-h2` | Inter | 32px | 800 | Uppercase, condensed, `line-height: 0.95` |
| `.t-h3` | Inter | 22px | 800 | Uppercase, `line-height: 1` |
| `.t-num` | Inter | variable | 900 | `font-variant-numeric: tabular-nums`, features `tnum` + `ss01` |
| `.t-mono` | JetBrains | variable | — | `tabular-nums` |
| `.t-body` | Inter | 14px | — | `line-height: 1.45`, color `--fg-dim` |
| `.t-meta` | JetBrains | 11px | — | `letter-spacing: 0.06em`, color `--fg-mute` |
| `.t-eyebrow` | JetBrains | 10px | — | `letter-spacing: 0.16em`, uppercase, color `--fg-mute` |

> **Regla de oro**: Inter 900 condensed (`font-variation-settings: "wdth" 75`) para cualquier número grande o título de impacto. JetBrains Mono para datos, tiempo y etiquetas pequeñas.

---

## 3. Espaciado

### Regular (default)
| Token | Valor |
|---|---|
| `--space-1` | 4px |
| `--space-2` | 8px |
| `--space-3` | 12px |
| `--space-4` | 16px |
| `--space-5` | 20px |
| `--space-6` | 24px |
| `--space-8` | 32px |
| `--space-10` | 40px |
| `--space-12` | 48px |
| `--gutter` | 20px |
| `--card-radius` | 18px |
| `--card-pad` | 20px |

### Compact (`data-density="compact"`)
Override automático: `--gutter: 16px` · `--card-radius: 14px` · `--card-pad: 14px` · espaciados internos reducidos ~25%.

---

## 4. Efectos visuales de marca

### Grain texture (textura "concrete")
Aplicado sobre el fondo y viewport via SVG inline `feTurbulence`:
```
baseFrequency: 0.85–0.9
numOctaves: 2
opacity: 0.7–0.8
mix-blend-mode: overlay
```
Simula grano fotográfico / papel / concreto. Es parte de la identidad visual — todos los fondos principales lo llevan.

### Radial gradients de acento
Halos sutiles de `--signal` (verde) y `--danger` (rojo) en esquinas opuestas del fondo:
```css
radial-gradient(1200px 800px at 80% -10%, rgba(0,210,106,0.04), transparent 60%),
radial-gradient(900px 700px at -10% 100%, rgba(255,61,113,0.05), transparent 55%)
```

### Viewport mobile-first
- Ancho de referencia: **412px**
- `border-radius: 28px`
- Sin frame de dispositivo
- `box-shadow: 0 0 0 1px rgba(255,255,255,0.06), 0 30px 80px rgba(0,0,0,0.5)`

---

## 5. Componentes

### Flag — Chip de equipo
Cuadrado redondeado con gradiente diagonal bicolor (colores nacionales) + código ISO superpuesto.

| Tamaño | Clase | Dimensión | Border radius |
|---|---|---|---|
| extra small | `.flag.xs` | 22×22px | 6px |
| small | `.flag.sm` | 32×32px | 8px |
| medium (default) | `.flag` | 56×56px | 14px |
| large | `.flag.lg` | 88×88px | 20px |

Implementación: `background: team.c1`, overlay `linear-gradient(135deg, c1 0%, c1 50%, c2 50%, c2 100%)`, código con `backdrop-filter: blur(6px)`.

---

### Pill — Badge de estado
```
.pill-signal  →  verde · activo / live / ok
.pill-warn    →  amarillo · puntos / bonus
.pill-danger  →  rojo · bloqueado / error
.pill-mute    →  gris · inactivo / neutral
```
Font: JetBrains Mono 10px, `letter-spacing: 0.12em`, uppercase.  
Soporta prop `dot` (círculo 6px de color actual).

---

### Icon — SVG inline
Todos en stroke 1.6px, `strokeLinecap: round`, `strokeLinejoin: round`.

| Nombre | Uso |
|---|---|
| `feed` | Tab Feed |
| `bracket` | Tab Oracle |
| `trophy` | Tab Liga |
| `user` | Tab Yo / Perfil |
| `plus` | FAB Predicción |
| `back` | Navegación atrás |
| `bell` | Notificaciones |
| `settings` | Configuración |
| `lock` | Predicción bloqueada |
| `fire` | Racha / streak |
| `check` | Confirmación / acierto |
| `close` | Cerrar sheet |
| `star` | Favorito / badge |
| `filter` | Filtrar |
| `info` | Información |
| `share` | Compartir |
| `chevron-right` | Navegación |

---

### Topbar
```
left   →  icon-btn (back o menu)
title  →  Inter 900 15px uppercase
sub    →  JetBrains Mono 10px, sobre el título (PASO 1/2, INVITACIÓN, etc.)
right  →  acciones secundarias
```

**icon-btn**: 36×36px, `border-radius: 12px`, `background: rgba(255,255,255,0.04)`, borde `--line`.

---

### BottomNav
5 ítems en grid 5 col.

| Ítem | Ícono | Posición |
|---|---|---|
| Feed | `feed` | 1 |
| Oracle | `bracket` | 2 |
| **Predict** | `plus` | 3 (FAB central) |
| Liga | `trophy` | 4 |
| Yo | `user` | 5 |

**FAB central (Predict)**: círculo 56px elevado -28px, `background: --signal`, texto `#04130A`, `box-shadow: 0 12px 32px rgba(0,210,106,0.45)`.  
**Ítem activo**: indicador superior 22×2px `background: --signal`.

---

### Match Card
3 variantes intercambiables:

| Variante | Clase | Característica |
|---|---|---|
| Clásica | `.variant-classic` | Tape header dashed + color stripes |
| Plana | `.variant-flat` | Sin tape, compacto |
| Póster | `.variant-poster` | Gradiente full-bleed, score 44px |

**Anatomía (classic)**:
1. **Stripes** — 2 franjas de 6px con `c1` del equipo local y visitante
2. **Tape** — header mono con stage + venue + estado, `background: repeating-linear-gradient(90deg, ...)` (textura de tape)
3. **Body** — grid 3 col: `Flag + nombre + code` · `score / hora` · `Flag + nombre + code`
4. **Foot** — estado de predicción (`.pred-state.set` verde, `.miss` rojo) + puntos ganados (`.pts`, color `--warn`)

**Estados de card**: `.live` (borde verde glow `0 0 0 1px rgba(0,210,106,0.12)`) · `.final` · `.pending`

**Live pill**: punto pulsante 7px `background: --signal`, animación `pulse` 1.6s infinite.

---

### Buttons
```
.btn              →  base: Inter 900, 14px, uppercase, border-radius 12px, padding 14px 18px
.btn-primary      →  background: --signal · color: #04130A
.btn-ghost        →  background: rgba(255,255,255,0.05) · borde: --line
.btn-warn         →  background: --warn · color: #1A1400
.btn-danger       →  background: --danger · color: white
.btn-block        →  width: 100% · padding: 18px
```
Efecto activo: `transform: scale(0.97)`.  
Flecha animada `.arrow`: `translateX(3px)` en hover.

---

### Sheet / Bottom Drawer
Para predictor y desglose de puntos.
```
.sheet-backdrop  →  rgba(0,0,0,0.65) + backdrop-filter: blur(6px)
.sheet           →  bottom-anchored, border-top-radius 24px, max-height 92%
.sheet-grab      →  pill handle 36×4px, color --fg-faint
```
Animación entrada: `translateY(100%) → 0`, 0.3s `cubic-bezier(.2,.8,.2,1)`.

---

### Score Stepper (Predictor)
```
.score-stepper  →  número Inter 900 76px condensed (font-variation-settings: "wdth" 75)
.stepper-controls  →  botones +/- 44×44px, border-radius 12px, borde --line
```
Estado activo de botón stepper: `background: --signal · color: #04130A`.

**Quick chips** `.quick-chip`: fila horizontal scrollable, chips con marcadores rápidos.  
Estado seleccionado `.quick-chip.on`: `background: --signal · color: #04130A`.

---

### Leaderboard Row
```
.lb-row         →  grid: 36px (rank) 1fr (nombre+sub) auto (pts)
.lb-row.me      →  highlight: linear-gradient verde sutil + left-border signal
.lb-row.top-1   →  rank color --warn (gold #FFD60A)
.lb-row.top-2   →  rank color #C7CACE (silver)
.lb-row.top-3   →  rank color #D08350 (bronze)
```

**Delta de posición**:
```
.delta.up    →  --signal (subió)
.delta.down  →  --danger (bajó)
.delta.flat  →  --fg-faint (sin cambio)
```

Cada fila es clicable → abre sheet de desglose con secciones A (Aciertos) + B (Bonificaciones) + Total.

---

### Avatar (Avi)
Cuadrado redondeado `border-radius: 12px`, Inter 900, iniciales del nombre (máx 2 letras).  
Tamaño default: 36×36px. En perfil: 64×64px, `border-radius: 18px`.

---

### KPI Grid
```
.kpi  →  grid 3 columnas, separado por líneas --line (1px gap con background --line), border-radius 14px
```
Valor: Inter 900 26px condensed. Label: JetBrains Mono 9px uppercase.  
`.kpi .value .small` — sufijo pequeño 13px para unidad.

---

### Secciones y separadores

**Day divider** `.day-divider`:
- Número grande 36px condensed (`HOY` → fecha) + stack mono + línea horizontal `--line`

**Section head** `.section-head`:
- Número serial mono 10px faint (`01/12`) + título Inter 900 13px uppercase

**Tape decorativo** `.tape`:
- Stripe diagonal `repeating-linear-gradient(135deg, --warn, --warn 18px, #1A1400 18px, #1A1400 32px)`
- Label con BG oscuro superpuesto

**League bar** `.league-bar`:
- Chip superior con nombre de liga + separador faint

---

### Badge (Perfil)
```
.badge        →  aspect-ratio 1:1, border-radius 14px, número grande 28px condensed + label mono 8px
.badge.locked →  opacity: 0.35 · filter: grayscale(1)
```
Grid: 4 columnas.

---

### Card genérica
```
.card  →  background: --surface · border: 1px solid --line · border-radius: --card-radius · padding: --card-pad
```

---

### Input
```
.input         →  background: rgba(255,255,255,0.04) · border: --line · border-radius: 12px
.input:focus   →  border-color: --signal · background: rgba(0,210,106,0.04)
.input.code    →  Inter 900 26px · letter-spacing: 0.18em · text-align: center · uppercase (para código de liga)
.input-label   →  JetBrains Mono 10px · letter-spacing: 0.16em · uppercase · color --fg-mute
```

---

### Toast
Centrado horizontal, bottom 100px desde el borde.  
`background: --signal · color: #04130A · border-radius: 12px · Inter 900`  
Sombra: `0 10px 30px rgba(0,210,106,0.4)`.  
Animación: `toastIn` (opacity + translateY, 0.3s).

---

## 6. Animaciones

| Keyframe | Duración | Easing | Uso |
|---|---|---|---|
| `screenFadeIn` | 0.25s | ease-out | Transición entre pantallas |
| `sheetUp` | 0.3s | cubic-bezier(.2,.8,.2,1) | Bottom sheet open |
| `fadeIn` | 0.2s | ease-out | Backdrop sheet |
| `toastIn` | 0.3s | cubic-bezier(.2,.8,.2,1) | Toast notification |
| `pulse` | 1.6s | ease-in-out infinite | Punto LIVE (pulsante) |
| `pulseExp` | 0.7s | cubic-bezier(.2,.7,.2,1) | Ring expandible al guardar predicción |

Leaderboard rows: `transition: transform 0.5s cubic-bezier(.2,.8,.2,1)` (animación de cambio de posición).

---

## 7. Pantallas del prototipo

| # | Screen | Descripción |
|---|---|---|
| 01 | **Splash** | Póster wordmark THE/BIG/POLLA, 3 líneas gigantes (fg / signal / outlined) |
| 02 | **Join / Create Liga** | Formulario de código o nombre + preview de reglas |
| 03 | **Feed** | Cards de partidos agrupados por día (HOY/MAÑANA/AYER) |
| 04 | **Match Detail** | Hero versus con radial gradients de colores nacionales + timeline de eventos live |
| 05 | **Predictor Sheet** | Stepper de score por equipo + quick chips de predicciones rápidas |
| 06 | **Leaderboard** | Ranking con podio + filas clicables para desglose de puntos |
| 07 | **Bracket Oracle** | Bracket horizontal scrolleable, 5 rondas, slots clicables |
| 08 | **Profile** | KPI grid + badge grid 4 col |
| 09 | **League Settings** | Reglas de puntaje editables |

---

## 8. Lógica de puntuación (SPEC del diseño)

Definida como `window.RULES` en `data.js`. Fuente de verdad única.

| Evento | Puntos |
|---|---|
| Resultado exacto (marcador correcto) | **+5 pts** |
| Diferencia de gol correcta (sin score exacto) | **+3 pts** |
| Solo ganador correcto | **+1 pt** |
| Bonus 5/5 en jornada (pleno de jornada) | **+10 pts** |
| **Bonus por racha** (streak) | **+N pts** (nivel de racha actual, tope +5) |

**Predicciones bloqueadas**: si `state === "live"` o `state === "final"` → pantalla de lock. No se puede agregar ni modificar.

**Desglose de puntos** (transparencia): sheet con secciones:
- **A · Aciertos**: exactos × 5, diferencia × 3, ganador × 1 (con conteos y subtotal)
- **B · Bonificaciones**: racha, pleno de jornada, Oracle parcial
- **Total**: base + bonus auditados

---

## 9. Convenciones para implementación en Next.js

- Variables CSS definidas en `globals.css` bajo `:root`
- `data-palette` y `data-density` van en `<html>` — manejar con un Context + `useEffect` que actualice `document.documentElement.dataset`
- Paleta default: **Concrete** · Densidad default: **regular** · Variante card default: **classic**
- Grain texture: SVG data-URI como `background-image` con `mix-blend-mode: overlay` y `pointer-events: none`
- Fuentes Google Fonts: `Inter` (pesos 400, 500, 600, 700, 800, 900) + `JetBrains Mono` (400, 500, 600, 700)
  - En Next.js usar `next/font/google` para ambas
- Iconos: componente React `<Icon name size color>` con SVGs inline, sin librerías externas
- Mobile viewport de referencia: **412px de ancho**
- Condensed Inter: `font-variation-settings: "wdth" 75` en los elementos `.t-display`, `.t-h1`, `.t-h2`, scores grandes
- Todos los números grandes (scores, rankings, KPIs) usan `font-variant-numeric: tabular-nums`
