# Minigame: Reactor Core

## Summary
| Field | Value |
|-------|-------|
| Number | 09 |
| Angular Topic | Signals |
| Curriculum Chapters | Ch 23-26 (Creating, Computed, Linked, Effects) |
| Core Mechanic | Reactive circuit design — build signal graphs |
| Difficulty Tiers | Basic / Intermediate / Advanced / Boss |
| Total Levels | 21 |

## Concept
Build reactive circuits by placing signal nodes, computed nodes, and effect nodes on a board, then wiring them together. When a signal value changes, the player watches the change propagate through the graph in real-time. The goal is to build a signal graph that produces the correct outputs for given input scenarios.

## Station Narrative
The station's **Reactor Core** runs on a reactive signal network. Each reactor element is a signal node that feeds into computed readings and triggers automated effects (safety shutdowns, power rerouting). The player designs and wires these reactive circuits.

## Gameplay

### Core Mechanic
- Node-based graph editor (think visual programming)
- **Signal nodes** (blue): hold mutable values, can be set()
- **Computed nodes** (green): derive values from signals, auto-update
- **Effect nodes** (orange): trigger side effects when dependencies change
- Player places nodes, wires dependencies, sets initial values
- "Simulate" button changes signal values and the graph updates visually
- Must produce correct outputs for each simulation scenario

### Controls
- **Drag nodes** from toolbox to board
- **Wire dependencies** by drawing edges between nodes
- **Configure node** — set computation logic (for computed) or effect action (for effects)
- **Set signal value** — click signal node to change its value
- **Simulate** — run predefined scenarios and watch propagation

### Win/Lose Conditions
- **Win:** All simulation scenarios produce correct outputs
- **Lose:** Graph produces wrong outputs, or circular dependencies created
- **Scoring:** Correct outputs + minimal nodes + no unnecessary recomputations

## Level Progression

### Basic Tier (Levels 1-7)
| Level | Concept Introduced | Description |
|-------|-------------------|-------------|
| 1 | signal() | Create a writable signal, read its value |
| 2 | signal.set() | Change signal value and see UI update |
| 3 | signal.update() | Update based on previous value |
| 4 | computed() | Derive a value from one signal |
| 5 | computed() from multiple | Derive from 2+ signals |
| 6 | Chained computed | computed depends on another computed |
| 7 | Reactivity visualization | Watch change propagation through chain |

### Intermediate Tier (Levels 8-14)
| Level | Concept Introduced | Description |
|-------|-------------------|-------------|
| 8 | effect() | Trigger side effect when signal changes |
| 9 | Effect cleanup | Return cleanup function from effect |
| 10 | Multiple effects | Multiple effects on same signal |
| 11 | Conditional computed | Computed with dynamic dependencies |
| 12 | linkedSignal() | Two-way linked signals |
| 13 | Signal in services | Shared signals via DI |
| 14 | Mixed challenge | Signals, computed, effects in one graph |

### Advanced Tier (Levels 15-20)
| Level | Concept Introduced | Description |
|-------|-------------------|-------------|
| 15 | toSignal() | Convert observable to signal |
| 16 | toObservable() | Convert signal to observable |
| 17 | Resource signals | Signal-based async data loading |
| 18 | Complex graphs | 10+ nodes with branching and merging |
| 19 | Performance optimization | Minimize recomputations with smart wiring |
| 20 | Design challenge | Given requirements, design full signal graph from scratch |

### Boss Level (Level 21)
**"Reactor Redesign"** — Design the complete reactor monitoring system: temperature signals, pressure computed values, threshold effects, linked control signals, and observable bridges. 15+ nodes across signal/computed/effect types. Must handle 10 simulation scenarios including edge cases (rapid changes, simultaneous updates).

## Angular Concepts Covered
1. signal() creation
2. Signal reading (value access)
3. signal.set() and signal.update()
4. computed() derived signals
5. Multi-dependency computed
6. Chained computed (computed from computed)
7. effect() side effects
8. Effect cleanup
9. linkedSignal() two-way binding
10. toSignal() and toObservable() interop
11. Signal-based resource loading
12. Signal graph optimization

## Replay Modes

### Endless Mode
Procedurally generated signal graph requirements with increasing node count and scenario complexity.

### Speed Run
Fixed 10-circuit challenge. Par time: 7 minutes.

### Daily Challenge
Themed reactor circuit (e.g., "Today: design a temperature monitoring system with automatic shutdown").

## Visual Design
- Reactor core aesthetic — glowing nodes on a dark grid
- Signal nodes pulse blue with current value displayed
- Computed nodes show derivation formula and current result
- Effect nodes flash orange when triggered
- Change propagation visualized as energy flowing along wires
- Incorrect outputs cause reactor warning lights
- Completed graph: full reactor powers up with flowing energy animation

## Technical Notes
- Graph engine validates: no circular signal dependencies, all computeds have valid sources
- Simulation engine applies input changes and propagates through graph using Angular's actual signal semantics
- Computed functions are built via expression builder (not raw code)
- Level data: requiredNodes[], scenarios[], validGraphs[], constraints[]
