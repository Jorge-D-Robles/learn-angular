# Minigame: Module Assembly

## Summary
| Field | Value |
|-------|-------|
| Number | 01 |
| Angular Topic | Components |
| Curriculum Chapters | Ch 1-3 (Components, Interpolation, Composing) |
| Core Mechanic | Conveyor belt drag-and-drop assembly |
| Difficulty Tiers | Basic / Intermediate / Advanced / Boss |
| Total Levels | 18 |

## Concept
Component parts (class, template, styles, decorator metadata) arrive on a conveyor belt. The player must drag them into the correct slots of a component blueprint before they reach the end of the belt. This teaches the anatomy of Angular components through physical assembly — what goes where, what's required vs optional, and how parts relate.

## Station Narrative
The station's core modules are damaged. The player works in the **Module Fabrication Bay**, assembling replacement station modules (Angular components) on an assembly line. Each completed module restores part of the station.

## Gameplay

### Core Mechanic
- A conveyor belt scrolls from right to left carrying component parts (code snippets)
- A component blueprint sits in the center with labeled slots: `@Component decorator`, `selector`, `template`, `styles`, `class body`, `imports`
- Player drags parts from the belt into the correct slots
- Belt speed increases with difficulty
- Wrong placements buzz and bounce back; belt keeps moving

### Controls
- **Mouse/touch drag** — pick up part from belt, drop into slot
- **Keyboard shortcuts** — number keys (1-6) to select slot, spacebar to grab next part
- **Quick-reject** — double-click a part to discard (some parts are decoys)

### Win/Lose Conditions
- **Win:** All required slots filled correctly before the belt empties
- **Lose:** Belt runs out with unfilled required slots, or too many wrong placements (3 strikes)
- **Scoring:** Time remaining + accuracy bonus (no wrong placements = perfect) + combo multiplier for consecutive correct placements

## Level Progression

### Basic Tier (Levels 1-6)
| Level | Concept Introduced | Description |
|-------|-------------------|-------------|
| 1 | Minimal component | Just @Component + selector + template (inline) |
| 2 | Template slot | Separate template content vs inline |
| 3 | Styles slot | Adding styles array to the component |
| 4 | Class body | Adding properties and a simple method |
| 5 | Interpolation | Template parts now include {{ expressions }} that must match class properties |
| 6 | Multiple components | Two blueprints on screen, parts for both mixed on belt |

### Intermediate Tier (Levels 7-12)
| Level | Concept Introduced | Description |
|-------|-------------------|-------------|
| 7 | Imports array | Components that import other components |
| 8 | Decoy parts | Invalid code snippets mixed in (must reject) |
| 9 | Nested components | Child component selector appears in parent template |
| 10 | Standalone vs NgModule | Distinguish standalone: true components |
| 11 | Speed increase | Same concepts but belt moves faster |
| 12 | Mixed challenge | All concepts, randomized, moderate speed |

### Advanced Tier (Levels 13-17)
| Level | Concept Introduced | Description |
|-------|-------------------|-------------|
| 13 | Template syntax details | Correct vs incorrect interpolation syntax |
| 14 | Component metadata | changeDetection, encapsulation options |
| 15 | Host bindings | host property in decorator |
| 16 | Multi-component assembly | Three components that compose together |
| 17 | Rapid fire | Very fast belt, all concepts, decoys everywhere |

### Boss Level (Level 18)
**"Emergency Module Fabrication"** — Assemble 5 interconnected components under time pressure. Parts arrive in random order across two belts. Some parts belong to multiple possible components (context-dependent placement). Decoy parts include common beginner mistakes. Complete all 5 to restore the station core.

## Angular Concepts Covered
1. @Component decorator and its metadata
2. Selectors
3. Inline vs external templates
4. Inline vs external styles
5. Component class (properties, methods)
6. Interpolation ({{ }})
7. Composing components (nesting)
8. Imports array
9. Standalone components
10. changeDetection and encapsulation options

## Replay Modes

### Endless Mode
Procedurally generated components of increasing complexity. New component every 30 seconds. How many can you assemble before 3 strikes?

### Speed Run
Fixed set of 10 components. Race the clock. Par time: 3 minutes.

### Daily Challenge
A themed component assembly (e.g., "Today: build a dashboard with 3 widget components"). Unique each day.

## Visual Design
- Industrial assembly line aesthetic with space-station styling
- Parts glow with color coding: decorators (purple), template (blue), styles (green), class (orange)
- Correct placement triggers a satisfying snap animation + particle burst
- Wrong placement: red flash + bounce
- Completed component "powers up" with a glow effect before sliding off-screen

## Technical Notes
- Component parts are stored as structured data (not raw strings) with metadata about which slots they fit
- Decoy generation: take valid parts and introduce common mistakes (missing brackets, wrong decorator fields)
- Belt speed is configurable per level via level data
- Scoring formula: `(timeRemaining * 10) + (accuracy * 100) + (combo * 25)`
