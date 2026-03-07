# Minigame: Blast Doors

## Summary

| Field               | Value                                                             |
| ------------------- | ----------------------------------------------------------------- |
| Number              | 12                                                                |
| Angular Topic       | Lifecycle Hooks & Custom Directives                               |
| Curriculum Chapters | Ch 28-29 (Lifecycle Hooks, Custom Directives)                     |
| Core Mechanic       | State machine programming — control automated blast door behavior |
| Difficulty Tiers    | Basic / Intermediate / Advanced / Boss                            |
| Total Levels        | 18                                                                |

## Concept

The player programs automated blast doors that respond to lifecycle events and custom directives. Each door is a component with lifecycle hooks (ngOnInit, ngOnDestroy, etc.) that must fire in the correct order. Directives add custom behavior (auto-close, access control, emergency override). The player implements the hooks and directives to make doors behave correctly in simulated scenarios.

## Station Narrative

The station's **Blast Door System** provides emergency containment. Each door is an Angular component with lifecycle behavior: it initializes when a section powers up, responds to changes, and cleans up when deactivated. Custom directives add specialized behaviors like access restrictions and emergency protocols.

## Gameplay

### Core Mechanic

- Visual representation of a station section with blast doors at entry points
- Each door has a lifecycle timeline showing hook slots (ngOnInit, ngOnChanges, ngOnDestroy, etc.)
- Player drags behavior blocks into the correct lifecycle hook slots
- Custom directive challenges: create directives that modify door behavior
- Simulate scenarios (power up, crew approach, emergency, shutdown) and watch doors respond

### Controls

- **Drag behavior blocks** into lifecycle hook slots
- **Arrange hook order** — put hooks in correct execution order
- **Directive editor** — write custom directive logic
- **Simulate** — run a scenario and watch door behavior
- **Timeline view** — see lifecycle hooks fire in sequence

### Win/Lose Conditions

- **Win:** All doors behave correctly in all simulation scenarios
- **Lose:** Door opens when it should be closed (security breach), or fails to open (crew trapped)
- **Scoring:** Correct behavior + efficient code + hook order accuracy

## Level Progression

### Basic Tier (Levels 1-6)

| Level | Concept Introduced | Description                                  |
| ----- | ------------------ | -------------------------------------------- |
| 1     | ngOnInit           | Initialize door state on creation            |
| 2     | ngOnDestroy        | Clean up subscriptions on removal            |
| 3     | ngOnChanges        | Respond to input property changes            |
| 4     | Hook order         | Arrange hooks in correct lifecycle order     |
| 5     | afterNextRender    | One-time DOM setup after render              |
| 6     | Multiple hooks     | Combine init + changes + destroy in one door |

### Intermediate Tier (Levels 7-12)

| Level | Concept Introduced       | Description                                   |
| ----- | ------------------------ | --------------------------------------------- |
| 7     | Attribute directive      | Create a highlight directive for doors        |
| 8     | Directive with input     | Directive accepts configuration (e.g., color) |
| 9     | HostListener             | Directive responds to host element events     |
| 10    | HostBinding              | Directive modifies host element properties    |
| 11    | Structural-like behavior | Show/hide elements based on directive logic   |
| 12    | Mixed challenge          | Lifecycle hooks + directives together         |

### Advanced Tier (Levels 13-17)

| Level | Concept Introduced    | Description                                  |
| ----- | --------------------- | -------------------------------------------- |
| 13    | Directive composition | Multiple directives on one door              |
| 14    | Directive with DI     | Directive injects services for behavior      |
| 15    | exportAs              | Directive exposes API via template ref       |
| 16    | afterRender phases    | Phase ordering (read, write, mixedReadWrite) |
| 17    | Full door system      | Complete lifecycle + directive architecture  |

### Boss Level (Level 18)

**"Emergency Lockdown Protocol"** — Program 6 blast doors with full lifecycle management and custom directives. Directives include: access-control (checks crew rank), auto-seal (timed closure), emergency-override (force open/close), and status-indicator (visual feedback). Must handle 5 scenarios: normal operation, crew transition, power failure, hull breach, and full lockdown.

## Angular Concepts Covered

1. ngOnInit
2. ngOnDestroy
3. ngOnChanges (SimpleChanges)
4. Lifecycle hook execution order
5. afterNextRender / afterRender
6. Attribute directives (@Directive)
7. Directive inputs
8. @HostListener
9. @HostBinding
10. Directive composition (multiple directives)
11. Directive dependency injection
12. exportAs for directive API exposure

## Replay Modes

### Endless Mode

Procedurally generated door configurations with increasing complexity. Score: scenarios handled correctly.

### Speed Run

Fixed 8-door configuration challenge. Par time: 6 minutes.

### Daily Challenge

Themed door system (e.g., "Today: program airlock doors with pressure-sensitive lifecycle behavior").

## Visual Design

- Station cross-section view with blast doors at key positions
- Lifecycle timeline visualization showing hooks as slots on a horizontal bar
- Hooks fire in sequence with visual indicators (flash, pulse)
- Doors animate open/close with mechanical detail
- Directive effects visible on doors (glow for highlight, lock icon for access control)
- Emergency scenarios: red lighting, klaxon visual pulses, countdown timers

## Technical Notes

- Lifecycle simulation engine fires hooks in Angular's actual lifecycle order
- Directives are applied as behavior modifiers on door component instances
- Scenario engine defines: trigger events, expected door states at each step, timing
- Level data: doors[], hooks[], directives[], scenarios[], expectedBehavior[]
