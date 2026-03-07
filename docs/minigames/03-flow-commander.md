# Minigame: Flow Commander

## Summary

| Field               | Value                                                      |
| ------------------- | ---------------------------------------------------------- |
| Number              | 03                                                         |
| Angular Topic       | Control Flow (@if, @for, @switch)                          |
| Curriculum Chapters | Ch 4 (Control Flow)                                        |
| Core Mechanic       | Traffic controller — place control flow gates in pipelines |
| Difficulty Tiers    | Basic / Intermediate / Advanced / Boss                     |
| Total Levels        | 18                                                         |

## Concept

Data items (visualized as colored cargo pods) flow through pipelines from left to right. The player places control flow gates (@if, @for, @switch) at junctions to route items correctly. An @if gate only lets items through that match a condition. An @for gate duplicates items. An @switch gate routes items to different output lanes based on value.

## Station Narrative

The station's **Cargo Distribution System** needs reprogramming. Cargo pods arrive and must be sorted, filtered, and distributed to the correct station modules. The player programs the sorting logic using Angular control flow directives.

## Gameplay

### Core Mechanic

- Pipelines run left-to-right with junction points where gates can be placed
- Cargo pods have visible properties (color, label, type, priority)
- Target zones on the right side specify what items they expect
- Player drags control flow gates from a toolbox onto junction points
- Configure gate conditions (e.g., @if gate: `item.priority === 'high'`)
- Press "Run" to watch items flow through the system
- Items that reach wrong targets or dead-ends = failures

### Controls

- **Drag gates** from toolbox to junctions
- **Click gate** to configure its condition
- **Condition editor** — simplified expression builder (not raw code at first)
- **Run/Reset** — execute and watch, or reset to try again

### Win/Lose Conditions

- **Win:** All items reach their correct target zones
- **Lose:** Items reach wrong targets, or items lost to dead-ends
- **Scoring:** Efficiency (fewer gates used) + correctness + speed

## Level Progression

### Basic Tier (Levels 1-6)

| Level | Concept Introduced  | Description                                                  |
| ----- | ------------------- | ------------------------------------------------------------ |
| 1     | @if (simple)        | Filter: let high-priority items through, block others        |
| 2     | @if/@else           | Two output lanes: matching items go one way, rest go another |
| 3     | @for (simple)       | Duplicate a template item for each entry in a list           |
| 4     | @for with index     | Use $index to number items in sequence                       |
| 5     | @if + @for combined | Filter a list, then iterate over results                     |
| 6     | @empty              | Handle empty collections with fallback output                |

### Intermediate Tier (Levels 7-12)

| Level | Concept Introduced | Description                             |
| ----- | ------------------ | --------------------------------------- |
| 7     | @switch            | Route items to 3+ lanes based on type   |
| 8     | @switch + @default | Handle unknown types with default lane  |
| 9     | Nested @if         | Conditions within conditions            |
| 10    | @for with track    | Track by identity for efficient updates |
| 11    | Complex conditions | Compound boolean expressions (&&, \|\|) |
| 12    | Mixed challenge    | All control flow types in one system    |

### Advanced Tier (Levels 13-17)

| Level | Concept Introduced | Description                                 |
| ----- | ------------------ | ------------------------------------------- |
| 13    | Dynamic data       | Items change properties mid-flow (reactive) |
| 14    | Nested @for        | Lists within lists (grid layout)            |
| 15    | @if with @let      | Alias expressions for reuse                 |
| 16    | Optimization       | Achieve same result with fewer gates        |
| 17    | Full pipeline      | Complex multi-stage sorting system          |

### Boss Level (Level 18)

**"Emergency Cargo Sort"** — A massive shipment arrives with 50+ items across 8 types. Build a complete sorting system with @if, @for, @switch gates across a multi-stage pipeline. Some items have ambiguous properties requiring careful condition logic. Time pressure: cargo bay doors close in 90 seconds.

## Angular Concepts Covered

1. @if conditional rendering
2. @else alternative rendering
3. @for iteration
4. @for $index, $first, $last, $even, $odd
5. @for track expression
6. @empty fallback
7. @switch multi-way branching
8. @case and @default
9. Nested control flow
10. @let template variables

## Replay Modes

### Endless Mode

Procedurally generated cargo streams with increasing item variety and target complexity. Score: total items correctly routed.

### Speed Run

Fixed 12-stage pipeline. Par time: 5 minutes.

### Daily Challenge

Themed cargo sort (e.g., "Today: sort crew members by department and rank using only @switch and @for").

## Visual Design

- Industrial pipeline aesthetic with transparent tubes showing cargo flow
- Gates are physical mechanism visualizations (splitters, filters, duplicators)
- Items are colored cargo pods with visible labels
- Correct routing: pods glow green entering target zone
- Wrong routing: pods flash red and break apart
- Flow animation shows items moving through system in real-time

## Technical Notes

- Pipeline is a directed graph; gates are nodes with configurable routing logic
- Condition editor starts as a dropdown builder, graduates to raw expression input at advanced levels
- "Run" simulates the flow step-by-step with animation
- Level data defines: items[], pipeline topology, gate slots, target zones, valid solutions
