# Visual Style Guide

## Aesthetic Direction
**Sci-fi space station** — clean, functional, with subtle glow effects. Not gritty/dark sci-fi; more "optimistic future" with warm accent colors against cool backgrounds. Think: control panels, holographic displays, clean lines.

## Color Palette

### Base Colors
| Name | Hex | Usage |
|------|-----|-------|
| Void | `#0A0E1A` | Primary background (deep space) |
| Hull | `#1A1F2E` | Card/panel backgrounds |
| Bulkhead | `#252B3D` | Borders, dividers |
| Corridor | `#8B92A8` | Secondary text, icons |
| Display | `#E2E8F0` | Primary text |
| Beacon | `#FFFFFF` | Headings, emphasis |

### Accent Colors (Station Systems)
| Name | Hex | Usage |
|------|-----|-------|
| Reactor Blue | `#3B82F6` | Primary actions, links, signals |
| Sensor Green | `#22C55E` | Success, correct, operational |
| Alert Orange | `#F97316` | Warnings, events, outputs |
| Emergency Red | `#EF4444` | Errors, failures, critical |
| Comm Purple | `#A855F7` | Special items, two-way binding |
| Solar Gold | `#EAB308` | XP, achievements, mastery |

### Mastery Glow Colors
| Stars | Color | Effect |
|-------|-------|--------|
| 0 | None | Dark, no glow |
| 1 | Dim white | Faint outline glow |
| 2 | Reactor Blue | Soft blue pulse |
| 3 | Sensor Green | Steady green glow |
| 4 | Solar Gold | Bright gold glow |
| 5 | Solar Gold | Gold + particle effects |

## Typography

### Font Stack
- **Headings:** System sans-serif stack (`-apple-system, BlinkMacSystemFont, 'Segoe UI', ...`)
- **Body:** Same system stack
- **Code:** `'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace`
- *Note: Custom fonts may be added later for the station HUD aesthetic*

### Scale
| Element | Size | Weight |
|---------|------|--------|
| Page title | 2rem | 700 |
| Section heading | 1.5rem | 600 |
| Card title | 1.125rem | 600 |
| Body text | 1rem | 400 |
| Caption | 0.875rem | 400 |
| Code | 0.875rem | 400 |

## Spacing
Based on 4px grid: `4, 8, 12, 16, 24, 32, 48, 64`

## Component Styling Patterns

### Cards
- Background: Hull (`#1A1F2E`)
- Border: 1px solid Bulkhead (`#252B3D`)
- Border radius: 8px
- Padding: 16px-24px
- Hover: subtle glow on border (accent color based on context)

### Buttons
- **Primary:** Reactor Blue background, white text
- **Secondary:** Transparent, Reactor Blue border + text
- **Danger:** Emergency Red background, white text
- Border radius: 6px
- Padding: 8px 16px

### Code Blocks
- Background: `#0D1117` (slightly darker than Void)
- Border: 1px solid Bulkhead
- Font: Code font stack
- Syntax highlighting: Atom One Dark variant with station accent colors

### Game UI Elements
- Score displays: Solar Gold text on Hull background
- Timers: Sensor Green (safe) -> Alert Orange (warning) -> Emergency Red (critical)
- Progress bars: gradient from Reactor Blue to Sensor Green
- Level badges: circular with tier-appropriate border color

## Animation Principles
- **Purposeful:** Animations communicate state changes, not decoration
- **Fast:** 150-250ms for UI transitions, 300-500ms for game feedback
- **Ease:** `ease-out` for entrances, `ease-in` for exits
- **Reduce motion:** Respect `prefers-reduced-motion` — replace animations with instant transitions

## Iconography
- Use a consistent icon set (e.g., Lucide or Phosphor)
- Station-themed custom icons for: modules, corridors, power grid, signals, etc.
- Icon size: 16px (inline), 20px (buttons), 24px (navigation), 32px+ (decorative)
