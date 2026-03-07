# Minigame: Wire Protocol

## Summary

| Field               | Value                                                  |
| ------------------- | ------------------------------------------------------ |
| Number              | 02                                                     |
| Angular Topic       | Data Binding (interpolation, property, event, two-way) |
| Curriculum Chapters | Ch 5-6 (Property Binding, Event Handling)              |
| Core Mechanic       | Wiring puzzle — connect sources to template slots      |
| Difficulty Tiers    | Basic / Intermediate / Advanced / Boss                 |
| Total Levels        | 18                                                     |

## Concept

A split-screen shows a component class on the left and its template on the right. Color-coded connection points (ports) appear on both sides. The player draws wires between them to establish data bindings. Wire colors indicate binding type: blue for interpolation {{ }}, green for property binding [ ], orange for event binding ( ), and purple for two-way [( )].

## Station Narrative

The station's **Communications Array** needs rewiring after meteor damage. Each wire represents a data binding between the component's logic (class) and its display (template). Miswired connections cause static and interference.

## Gameplay

### Core Mechanic

- Left panel: component class with highlighted properties and methods (source ports)
- Right panel: template with highlighted binding targets (destination ports)
- Player clicks a source port, then clicks a destination port to draw a wire
- Must select the correct wire type (color) for each connection
- Some connections are pre-wired (correct or incorrect — player must verify)

### Controls

- **Click source, click target** — draw a wire
- **Wire type selector** — toggle between binding types (keyboard: 1-4)
- **Right-click wire** — remove it
- **Verify button** — check all connections (costs 1 of 3 attempts)

### Win/Lose Conditions

- **Win:** All connections correctly wired with correct binding type
- **Lose:** 3 failed verifications
- **Scoring:** Fewer verifications = higher score. Perfect = no wrong wires on first verify.

## Level Progression

### Basic Tier (Levels 1-6)

| Level | Concept Introduced             | Description                                         |
| ----- | ------------------------------ | --------------------------------------------------- |
| 1     | Interpolation only             | Connect 3 properties to {{ }} slots                 |
| 2     | Property binding               | Connect properties to [property] bindings           |
| 3     | Event binding                  | Connect methods to (event) bindings                 |
| 4     | Mixed interpolation + property | Distinguish when to use {{ }} vs [ ]                |
| 5     | Mixed event + property         | Both directions of data flow                        |
| 6     | All three types                | Interpolation, property, and event in one component |

### Intermediate Tier (Levels 7-12)

| Level | Concept Introduced      | Description                                 |
| ----- | ----------------------- | ------------------------------------------- |
| 7     | Two-way binding         | Introduce [( )] banana-in-a-box             |
| 8     | Pre-wired (some wrong)  | Fix existing incorrect bindings             |
| 9     | Expressions in bindings | [style.color]="condition ? 'red' : 'green'" |
| 10    | Event objects           | (click)="handler($event)"                   |
| 11    | Multiple components     | Wire bindings across parent + child         |
| 12    | Mixed challenge         | All binding types, 2 components             |

### Advanced Tier (Levels 13-17)

| Level | Concept Introduced            | Description                                           |
| ----- | ----------------------------- | ----------------------------------------------------- |
| 13    | Template reference variables  | #ref and accessing in template                        |
| 14    | Attribute vs property binding | [attr.aria-label] vs [value]                          |
| 15    | Class and style binding       | [class.active], [style.width.px]                      |
| 16    | Complex expressions           | Binding to method calls, ternaries                    |
| 17    | Full rewire challenge         | 3 components, all binding types, some pre-wired wrong |

### Boss Level (Level 18)

**"Array Overhaul"** — The entire communications array (5 components forming a parent-child tree) needs complete rewiring. 20+ connections across all binding types. Some wires are pre-connected incorrectly. Time limit adds pressure. Must achieve 100% correct wiring in one verification attempt.

## Angular Concepts Covered

1. String interpolation {{ }}
2. Property binding [ ]
3. Event binding ( )
4. Two-way binding [( )]
5. Binding expressions
6. $event object
7. Template reference variables
8. Attribute binding [attr.*]
9. Class binding [class.*]
10. Style binding [style.*]

## Replay Modes

### Endless Mode

Procedurally generated components with increasing port count and binding complexity. Each round adds more connections. Score tracks total wires correctly placed.

### Speed Run

Fixed set of 8 wiring puzzles. Par time: 4 minutes.

### Daily Challenge

Themed wiring puzzle (e.g., "Today: a form component with 12 bindings, all types represented").

## Visual Design

- Circuit board aesthetic with glowing wire paths
- Wires animate with flowing particles when connected (data flowing)
- Color coding: blue (interpolation), green (property), orange (event), purple (two-way)
- Incorrect wires spark and fizzle
- Completed circuit lights up the array module on the station

## Technical Notes

- Binding data is structured: `{ source: 'property', target: 'slot', type: 'property' | 'event' | ... }`
- Wire rendering uses SVG paths with bezier curves
- Validation checks type correctness AND source-target compatibility
- Pre-wired wrong connections use common beginner mistakes (e.g., using {{ }} where [ ] is needed)
