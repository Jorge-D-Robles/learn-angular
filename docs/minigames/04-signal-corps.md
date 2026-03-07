# Minigame: Signal Corps

## Summary

| Field               | Value                                                                 |
| ------------------- | --------------------------------------------------------------------- |
| Number              | 04                                                                    |
| Angular Topic       | Input/Output Properties                                               |
| Curriculum Chapters | Ch 7-8 (Input Properties, Output Properties)                          |
| Core Mechanic       | Tower defense — declare inputs/outputs and wire parent-child bindings |
| Difficulty Tiers    | Basic / Intermediate / Advanced / Boss                                |
| Total Levels        | 18                                                                    |

## Concept

A tower defense game where "signal towers" (child components) must be configured with correct input/output declarations and wired to the parent component. Noise signals (invalid data, wrong types, unbound outputs) attack the station. Properly configured towers block noise; misconfigured towers let it through.

## Station Narrative

The station's **Signal Defense Array** protects against electromagnetic interference. Each tower is a child component that receives data (inputs) from the parent command center and reports events (outputs) back. Misconfigured towers create gaps in the defense.

## Gameplay

### Core Mechanic

- Top-down grid view of the station perimeter
- Signal towers (child components) sit at grid positions
- Each tower has input ports (left side) and output ports (right side)
- Player must: (1) declare the correct input/output decorators, (2) wire them to the parent
- Noise waves approach from the edges; configured towers emit blocking signals
- Unconfigured or misconfigured towers let noise through to damage the station

### Controls

- **Click tower** — open configuration panel
- **Declare input** — add input() to the tower with name and type
- **Declare output** — add output() with event type
- **Wire to parent** — draw binding from parent property/handler to tower port
- **Deploy** — activate all towers and start the wave

### Win/Lose Conditions

- **Win:** All noise waves blocked (all towers correctly configured)
- **Lose:** Station health reaches 0 (too much noise gets through)
- **Scoring:** Waves survived + towers configured correctly + time bonus

## Level Progression

### Basic Tier (Levels 1-6)

| Level | Concept Introduced      | Description                                        |
| ----- | ----------------------- | -------------------------------------------------- |
| 1     | Single input            | One tower, one input property, wire from parent    |
| 2     | Multiple inputs         | One tower, 3 inputs of different types             |
| 3     | Required vs optional    | Some inputs are required, some have defaults       |
| 4     | Single output           | Tower emits an event, parent handles it            |
| 5     | Input + output together | Tower receives data AND emits events               |
| 6     | Multiple towers         | 3 towers, each with different input/output configs |

### Intermediate Tier (Levels 7-12)

| Level | Concept Introduced  | Description                                    |
| ----- | ------------------- | ---------------------------------------------- |
| 7     | Input transforms    | Transform input values (e.g., numberAttribute) |
| 8     | Output with payload | EventEmitter<T> with typed payloads            |
| 9     | Input aliasing      | Input name differs from property name          |
| 10    | Model inputs        | Two-way binding with model()                   |
| 11    | Cascading towers    | Tower A's output feeds Tower B's input         |
| 12    | Mixed challenge     | 5 towers, all input/output patterns            |

### Advanced Tier (Levels 13-17)

| Level | Concept Introduced   | Description                                        |
| ----- | -------------------- | -------------------------------------------------- |
| 13    | Required inputs      | input.required<T>()                                |
| 14    | Complex types        | Object and array inputs                            |
| 15    | Output patterns      | output() function vs legacy @Output decorator      |
| 16    | Parent-child chains  | 3-level deep nesting with data passing through     |
| 17    | Defense optimization | Minimize total bindings while maintaining coverage |

### Boss Level (Level 18)

**"Full Array Defense"** — 8 towers across 3 nesting levels. Multiple noise wave types requiring specific input/output configurations. Some towers must relay signals to others (cascading). One misconfigured tower cascades failures. Must achieve 100% defense coverage.

## Angular Concepts Covered

1. input() function
2. input.required()
3. Input transforms (numberAttribute, booleanAttribute)
4. Input aliasing
5. output() function
6. EventEmitter and emit()
7. Output with typed payloads
8. model() for two-way binding
9. Parent-child data flow patterns
10. Multi-level component communication

## Replay Modes

### Endless Mode

Infinite waves of increasing noise complexity. Towers must be reconfigured between waves as requirements change.

### Speed Run

Fixed 10-wave defense. Par time: 6 minutes.

### Daily Challenge

Pre-placed towers with specific configuration requirements. "Today: survive 5 waves using only 4 towers."

## Visual Design

- Sci-fi radar/defense grid aesthetic
- Towers pulse with energy when correctly configured
- Input ports glow blue (receiving data), output ports glow orange (emitting events)
- Noise waves are visualized as approaching distortion fields
- Blocking animations: tower emits shield pulse that neutralizes noise
- Damage animations: screen shake, warning klaxons

## Technical Notes

- Tower config stored as: `{ inputs: [{name, type, required, transform}], outputs: [{name, payloadType}] }`
- Noise waves carry type signatures that must match tower input/output configs
- Validation engine checks both declaration correctness and binding correctness
- Wave spawning is configurable per level for difficulty scaling
