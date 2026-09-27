---
name: Obsidian Airy
colors:
  surface: '#131315'
  surface-dim: '#131315'
  surface-bright: '#39393b'
  surface-container-lowest: '#0e0e10'
  surface-container-low: '#1c1b1d'
  surface-container: '#201f21'
  surface-container-high: '#2a2a2c'
  surface-container-highest: '#353437'
  on-surface: '#e5e1e4'
  on-surface-variant: '#c4c7c8'
  inverse-surface: '#e5e1e4'
  inverse-on-surface: '#313032'
  outline: '#8e9192'
  outline-variant: '#444748'
  surface-tint: '#c6c6c7'
  primary: '#ffffff'
  on-primary: '#2f3131'
  primary-container: '#e2e2e2'
  on-primary-container: '#636565'
  inverse-primary: '#5d5f5f'
  secondary: '#abc7ff'
  on-secondary: '#002f66'
  secondary-container: '#0372e4'
  on-secondary-container: '#fefcff'
  tertiary: '#ffffff'
  on-tertiary: '#1000a9'
  tertiary-container: '#e1e0ff'
  on-tertiary-container: '#4f51dd'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e2e2e2'
  primary-fixed-dim: '#c6c6c7'
  on-primary-fixed: '#1a1c1c'
  on-primary-fixed-variant: '#454747'
  secondary-fixed: '#d7e2ff'
  secondary-fixed-dim: '#abc7ff'
  on-secondary-fixed: '#001b3f'
  on-secondary-fixed-variant: '#00458f'
  tertiary-fixed: '#e1e0ff'
  tertiary-fixed-dim: '#c0c1ff'
  on-tertiary-fixed: '#07006c'
  on-tertiary-fixed-variant: '#2f2ebe'
  background: '#131315'
  on-background: '#e5e1e4'
  surface-variant: '#353437'
  canvas-base: '#000000'
  surface-card: '#121215'
  surface-card-hover: '#16161a'
  surface-elevated: '#1c1b1d'
  text-primary: '#f5f5f7'
  text-secondary: '#8e8e93'
  text-muted: '#6e6e73'
  hairline-border: rgba(255, 255, 255, 0.08)
  hairline-border-bright: rgba(255, 255, 255, 0.16)
  glass-surface: rgba(20, 20, 24, 0.75)
typography:
  display:
    fontFamily: Inter
    fontSize: 40px
    fontWeight: '600'
    lineHeight: 48px
    letterSpacing: -0.03em
  headline-lg:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 34px
    letterSpacing: -0.025em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 22px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
    letterSpacing: -0.01em
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
    letterSpacing: -0.005em
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0em
  label-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.04em
  code:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.25rem
  gutter-lg: 2rem
  margin: 1.5rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1.25rem
  space-xl: 2rem
---

## Brand & Style

This design system expresses an ultra-minimalist, airy Apple aesthetic engineered for focused creative work, document editing, and intelligence workflows. The brand posture is poised, understated, and architectural. It intentionally eschews visual clutter, sensory overload, and dense dashboard configurations in favor of pure focus, calm utility, and deliberate whitespace.

The visual direction merges high-contrast monochrome minimalism with subtle frosted depth. Deep charcoal and pitch-black surfaces ground the interface, punctuated by hairline outlines and crisp typography. Interacting with the system feels frictionless, silent, and native—balancing the exactitude of professional developer tools with the fluid elegance of macOS.

## Colors

The system uses a strict dark-mode-first color architecture rooted in true blacks and tonal midnight surfaces.

- **Base Surfaces**: The primary backdrop is pure black (`#000000`). Structural containers and sidebars leverage deep charcoal tones (`#0a0a0c` to `#121215`), generating visual depth without chromatic noise.
- **Accents**: Pure white (`#ffffff`) serves as the dominant high-contrast action driver. A precision electric blue (`#0071e3`) signals direct focus rings, selections, and system toggles. An electric indigo (`#6366f1`) is reserved exclusively for intelligence and generative states.
- **Text & Hairlines**: Four levels of monochromatic hierarchy govern all copy: primary (`#f5f5f7`), secondary (`#8e8e93`), muted (`#6e6e73`), and placeholder (`#424245`). Structural divisions rely strictly on hairline borders (`rgba(255, 255, 255, 0.08)`) rather than contrasting backgrounds or thick dividing lines.

## Typography

Typography prioritizes clarity, structural rhythm, and negative letter-tracking derived from Apple's interface guidelines:

- **Tracking Philosophy**: Larger titles use negative tracking (`-0.03em` down to `-0.01em`) to tighten optical bounds and create a disciplined, magazine-grade layout.
- **Labels and Metadata**: Small auxiliary text (`11px` to `13px`) is set with positive tracking (`0.01em` to `0.04em`) in medium or semibold weights to preserve effortless legibility against dark backdrops.
- **Code & Command Snippets**: JetBrains Mono serves technical strings, keyboard shortcuts, inline variables, and raw outputs with strict baseline-to-font metric alignment.

## Layout & Spacing

The layout model emphasizes airy, generous negative space, ensuring zero visual congestion:

- **Structural Canvas**: A three-pane configuration consisting of a fixed utility rail (`260px` to `280px`), a central fluid stream/document stage bounded at a maximum comfortable reading width of `840px`, and an optional collapsible inspector panel (`320px`).
- **Rhythm & Padding**: Sections maintain wide vertical buffers. Internal card padding strictly begins at `space-lg` (`1.25rem`), expanding to `space-xl` (`2rem`) for editorial blocks to provide unconstrained breathing room.
- **Responsive Adaptations**:
  - **Desktop (≥1024px)**: Unfolded panels with permanent multi-column arrangements, persistent `1.5rem` to `2rem` outer page margins, and `1.25rem` gutters.
  - **Tablet (768px–1023px)**: Left utility panel folds into an overlay trigger; the document editor commands full screen focus.
  - **Mobile (<768px)**: Single-column linear reflow. Canvas margins reduce to `1rem`, panels stack into bottom sheets, and interactive controls dock into the bottom safe area.

## Elevation & Depth

Visual hierarchy is communicated through luminous surface tiers, frosted glass backdrops, and hairline boundaries rather than opaque muddy shadows:

- **Level 0 (Canvas Void)**: `#000000` base workspace. Completely flat and non-reflective.
- **Level 1 (Structural Shells)**: `#0a0a0c` to `#121215` panel containers, framed with a razor-thin border of `1px solid rgba(255, 255, 255, 0.08)`.
- **Level 2 (Interactive Elements & Cards)**: `#16161a` surface fill paired with an ambient tinted drop shadow (`0 8px 24px -4px rgba(0, 0, 0, 0.6)`) and a heightened hairline boundary of `rgba(255, 255, 255, 0.16)`.
- **Level 3 (Floating Bars & Toolbars)**: Frosted translucent layer (`rgba(20, 20, 24, 0.75)`) reinforced with `backdrop-filter: blur(20px) saturate(180%)` and an outer hairline highlight (`1px solid rgba(255, 255, 255, 0.12)`).
- **Level 4 (Modals & Search Overlays)**: Suspended dialogs featuring dual-stage borders (`0 0 0 1px rgba(255, 255, 255, 0.14)`) and deep atmospheric occlusion (`0 24px 48px -12px rgba(0, 0, 0, 0.85)`).

## Shapes

The shape system pairs generous pill silhouettes for discrete interaction with structured, organic rounded corners for larger containment:

- **Cards & Paneling**: Sized with soft `1rem` to `1.25rem` radii (`rounded-2xl` behavior) to produce a calm, tactile geometry that feels integrated and native.
- **Buttons, Chips & Inputs**: Fully rounded capsule/pill contours (`9999px`) that deliver immediate touch affordances and distinguish micro-controls from static layout containers.
- **Floating Overlays & Modals**: Continuous squircle-like radius curves that soften the perimeter of command bars and floating inspectors.

## Components

### Buttons
- **Primary**: Full pill geometry (`height: 38px`), filled with crisp `#ffffff`, text in `#000000` (`font-weight: 600`). On hover, smooth opacity shift to `0.9` with an interactive spring scale of `0.98`.
- **Secondary / Ghost**: Pill outline with `rgba(255, 255, 255, 0.06)` fill, enclosed in a hairline border of `rgba(255, 255, 255, 0.12)`, text in `#f5f5f7`. Hover state elevates background to `rgba(255, 255, 255, 0.12)`.
- **Intelligence Action**: Pill container featuring an ultra-thin luminous border gradient (`#6366f1` to `#a855f7`), translucent interior, and a single monochrome spark glyph.

### Cards
- Constructed with `#121215` fills, `16px`–`20px` border radius, hairline borders (`rgba(255, 255, 255, 0.08)`), and generous padding (`space-lg` to `space-xl`).
- Free of dense dividers; spatial grouping is established solely via typography scale and white space. On hover, the perimeter border shifts to `rgba(255, 255, 255, 0.16)`.

### Input Fields & Search Bars
- Recessed pill or soft rectangular containers (`12px` radius) filled with `rgba(255, 255, 255, 0.04)` and a `1px` perimeter of `rgba(255, 255, 255, 0.08)`.
- Placeholder copy rests at `#6e6e73`. On focus, the outline elevates to crisp white or `#0071e3` with a soft outer ring (`0 0 0 3px rgba(0, 113, 227, 0.25)`).

### Chips & Badges
- Capsule pills (`height: 24px`–`28px`) utilizing `rgba(255, 255, 255, 0.05)` backdrop fills, `rgba(255, 255, 255, 0.08)` perimeter borders, and `label-sm` typography in `#8e8e93`.
- Active states transition to solid `#ffffff` text with a subtle interior illumination.

### Checkboxes & Radio Controls
- Circular or subtly rounded boxes (`18px`) bordered with `rgba(255, 255, 255, 0.24)`.
- Checked state transitions to a solid `#ffffff` fill with an inset `#000000` glyph or `#0071e3` center fill, providing instant high-contrast visual confirmation.

### Segmented Switchers & Floating Bars
- Continuous pill tray with a frosted dark glass finish (`rgba(255, 255, 255, 0.05)`), internal padding of `4px`.
- Active segment is a suspended capsule in `#222226` or pure white with smooth sliding spring transitions.