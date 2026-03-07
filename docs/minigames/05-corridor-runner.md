# Minigame: Corridor Runner

## Summary
| Field | Value |
|-------|-------|
| Number | 05 |
| Angular Topic | Routing |
| Curriculum Chapters | Ch 11-13 (Enable Routing, Define Routes, RouterLink) |
| Core Mechanic | Maze navigation + route configuration |
| Difficulty Tiers | Basic / Intermediate / Advanced / Boss |
| Total Levels | 18 |

## Concept
A two-phase minigame. **Phase A (Config):** The player edits a route configuration file to define paths through the station's corridor system. **Phase B (Run):** A crew member navigates the corridors based on the route config. Correct routes lead to destinations; incorrect routes lead to "Hull Breach" (404) dead-ends.

## Station Narrative
The station's **Corridor Navigation System** is offline. The player must program the routing table so crew can navigate between modules. Each route maps a URL path to a station module (component).

## Gameplay

### Core Mechanic
- **Config phase:** Route editor showing the Routes array. Player adds/edits route objects with path, component, redirects, wildcards, and guards.
- **Run phase:** Top-down corridor map. Crew member starts at an entry point. Player clicks destinations or types URLs. The routing system resolves the path and the crew member walks the route.
- Correct routing: crew reaches the module. Wrong routing: crew hits a hull breach (404 page).

### Controls
- **Config phase:** Code editor for route definitions
- **Run phase:** Click destination on map, or type URL in address bar
- **URL bar:** Shows current route; player can type paths directly

### Win/Lose Conditions
- **Win:** All required destinations reachable; all test navigations succeed
- **Lose:** More than 2 hull breaches (404s) during test navigations
- **Scoring:** All routes correct on first try + bonus for efficient config (fewer route entries)

## Level Progression

### Basic Tier (Levels 1-6)
| Level | Concept Introduced | Description |
|-------|-------------------|-------------|
| 1 | Single route | Define one route: path + component |
| 2 | Multiple routes | Define 3 routes to 3 modules |
| 3 | Default route | Add redirect from '' to a default module |
| 4 | Wildcard route | Add ** wildcard for 404 hull breach page |
| 5 | Route order matters | Routes checked top-down; order affects matching |
| 6 | RouterLink | Add navigation links to the station map |

### Intermediate Tier (Levels 7-12)
| Level | Concept Introduced | Description |
|-------|-------------------|-------------|
| 7 | Route parameters | `/module/:id` dynamic segments |
| 8 | Reading params | Access route params in the destination component |
| 9 | Nested routes (children) | Child routes within a parent layout |
| 10 | Router outlet | Multiple router-outlets for nested views |
| 11 | Query parameters | `?status=active&sort=name` |
| 12 | Mixed challenge | All routing concepts in one corridor system |

### Advanced Tier (Levels 13-17)
| Level | Concept Introduced | Description |
|-------|-------------------|-------------|
| 13 | Lazy loading | loadComponent/loadChildren for module routes |
| 14 | Route guards | canActivate prevents unauthorized access |
| 15 | Resolvers | Pre-fetch data before route activation |
| 16 | Redirect chains | Multi-step redirects |
| 17 | Complex navigation | Full station corridor system with guards, lazy loading, nested routes |

### Boss Level (Level 18)
**"Station-Wide Navigation"** — Configure the complete corridor system for 10 modules across 3 decks. Nested routes, lazy loading, guards, resolvers, parameters, and redirects. Then navigate a crew member through 8 destinations without a single hull breach.

## Angular Concepts Covered
1. Route configuration (path, component)
2. Redirect routes
3. Wildcard routes (**)
4. Route order/priority
5. RouterLink directive
6. Route parameters (:param)
7. ActivatedRoute and param reading
8. Child/nested routes
9. Multiple router-outlets
10. Query parameters
11. Lazy loading (loadComponent)
12. Route guards (canActivate, canDeactivate)
13. Resolvers

## Replay Modes

### Endless Mode
Procedurally generated station layouts with increasing module count and routing complexity. Score: consecutive successful navigations.

### Speed Run
Fixed 10-destination navigation challenge. Par time: 4 minutes.

### Daily Challenge
Themed corridor puzzle (e.g., "Today: set up routing for a 3-deck station with restricted areas").

## Visual Design
- Top-down station blueprint/map view
- Corridors light up as routes are configured (dark when unconfigured)
- Crew member sprite walks corridors with smooth animation
- Hull breach: dramatic decompression animation at dead-end
- Successfully reached module: door opens, module interior briefly visible
- URL bar at top mimics browser address bar

## Technical Notes
- Route config is validated against a schema matching Angular's Routes type
- Crew navigation simulates Angular's router resolution algorithm
- Map layout is data-driven: nodes (modules) + edges (corridors)
- 404 detection uses same wildcard matching as Angular router
