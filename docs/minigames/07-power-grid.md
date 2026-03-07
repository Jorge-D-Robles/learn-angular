# Minigame: Power Grid

## Summary
| Field | Value |
|-------|-------|
| Number | 07 |
| Angular Topic | Services & Dependency Injection |
| Curriculum Chapters | Ch 18-19 (Injectable Services, Dependency Injection) |
| Core Mechanic | Circuit board puzzle — route power lines from services to components |
| Difficulty Tiers | Basic / Intermediate / Advanced / Boss |
| Total Levels | 18 |

## Concept
A circuit board puzzle where the player routes power lines (inject() calls) from services (power sources) to components (modules needing power). Services provide specific capabilities; components declare what they need. The player must wire the correct service to each component with proper scoping (root, component-level, or module-level).

## Station Narrative
The station's **Power Grid** distributes energy from centralized generators (services) to individual modules (components). Each generator provides a specific type of power (data, authentication, logging). The player wires the grid so every module gets what it needs.

## Gameplay

### Core Mechanic
- Grid board with services on the left (power sources) and components on the right (consumers)
- Each service has a type label (e.g., "DataService", "AuthService")
- Each component lists its required injections
- Player draws power lines from services to components
- Must choose correct injection scope (providedIn: 'root' vs component providers)
- Overlapping lines and incorrect scoping cause short circuits

### Controls
- **Draw power line** — click service, click component to connect
- **Set scope** — right-click service to change providedIn scope
- **Component providers** — drag service into component's providers array
- **Activate** — power up the grid and verify connections

### Win/Lose Conditions
- **Win:** All components powered with correct services at correct scope
- **Lose:** Short circuit (wrong service), power leak (wrong scope), or unresolved injection
- **Scoring:** Correct connections + optimal scoping + no redundant providers

## Level Progression

### Basic Tier (Levels 1-6)
| Level | Concept Introduced | Description |
|-------|-------------------|-------------|
| 1 | Single service | Create @Injectable, provide in root, inject in one component |
| 2 | Multiple consumers | One service used by 3 components |
| 3 | Multiple services | 3 services, 3 components, 1:1 mapping |
| 4 | inject() function | Use inject() instead of constructor injection |
| 5 | Service with state | Service holds shared state between components |
| 6 | Service methods | Components call service methods for data |

### Intermediate Tier (Levels 7-12)
| Level | Concept Introduced | Description |
|-------|-------------------|-------------|
| 7 | Component-level providers | Service scoped to a single component |
| 8 | Hierarchical injection | Parent provides, children inherit |
| 9 | Multiple instances | Same service class, different instances via scoping |
| 10 | Service-to-service injection | Services that depend on other services |
| 11 | Injection tokens | InjectionToken for non-class dependencies |
| 12 | Mixed challenge | All scoping patterns in one grid |

### Advanced Tier (Levels 13-17)
| Level | Concept Introduced | Description |
|-------|-------------------|-------------|
| 13 | useFactory | Factory providers for conditional service creation |
| 14 | useValue / useExisting | Alias and value providers |
| 15 | Multi providers | Multiple implementations for same token |
| 16 | Optional injection | Handle missing services gracefully |
| 17 | Full grid design | Design a complete DI architecture from scratch |

### Boss Level (Level 18)
**"Grid Overhaul"** — Redesign the entire station power grid: 8 services, 12 components, hierarchical injection, factory providers, multi-providers, and component-scoped services. One incorrect connection cascades failures. Must achieve 100% correct wiring.

## Angular Concepts Covered
1. @Injectable decorator
2. providedIn: 'root'
3. inject() function
4. Constructor injection
5. Component-level providers
6. Hierarchical injection
7. Service lifecycle and state sharing
8. Service-to-service injection
9. InjectionToken
10. useFactory, useValue, useExisting
11. Multi providers
12. Optional injection

## Replay Modes

### Endless Mode
Procedurally generated DI architectures with increasing service count and scoping complexity.

### Speed Run
Fixed 10-grid puzzle set. Par time: 5 minutes.

### Daily Challenge
Themed grid puzzle (e.g., "Today: wire an auth system with token-based service selection").

## Visual Design
- Circuit board/electrical grid aesthetic
- Services are generator icons with type labels
- Components are module icons with input ports
- Power lines glow when correctly connected (blue = root, green = component, orange = factory)
- Short circuits spark and flash red
- Correct grid powers up sequentially with satisfying chain reaction

## Technical Notes
- Grid is a directed acyclic graph (services -> components, services -> services)
- Scoping validation checks Angular's actual injection resolution rules
- Factory providers include a visual representation of the factory function logic
- Level data: services[], components[], validConnections[], scopeRules[]
