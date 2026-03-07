# Angular Topic Analysis

Mapping of Angular documentation topics to our curriculum and minigames. Based on Angular's official docs at `refs/angular/adev/src/content/`.

## Topic Inventory

### Core Concepts (Phase 1: Foundations)

| Angular Topic | Docs Location | Curriculum Ch | Minigame | Coverage Notes |
|---------------|---------------|---------------|----------|----------------|
| Components | `tutorials/learn-angular/steps/1-*` through `3-*` | Ch 1 | Module Assembly | Well covered by tutorial steps |
| Interpolation | `tutorials/learn-angular/steps/4-*` | Ch 2 | Module Assembly | Single tutorial step |
| Composing Components | `tutorials/learn-angular/steps/5-*` | Ch 3 | Module Assembly | Parent-child nesting |
| Control Flow | `tutorials/learn-angular/steps/6-*` | Ch 4 | Flow Commander | @if, @for, @switch |
| Property Binding | `tutorials/learn-angular/steps/8-*` | Ch 5 | Wire Protocol | [property] binding |
| Event Handling | `tutorials/learn-angular/steps/9-*` | Ch 6 | Wire Protocol | (event) binding |
| Input Properties | `tutorials/learn-angular/steps/10-*` | Ch 7 | Signal Corps | input() function |
| Output Properties | `tutorials/learn-angular/steps/11-*` | Ch 8 | Signal Corps | output() function |
| Deferrable Views | `tutorials/learn-angular/steps/12-*` | Ch 9 | — | @defer blocks |
| Image Optimization | `tutorials/learn-angular/steps/13-*` | Ch 10 | — | NgOptimizedImage |

### Navigation (Phase 2)

| Angular Topic | Docs Location | Curriculum Ch | Minigame | Coverage Notes |
|---------------|---------------|---------------|----------|----------------|
| Routing Overview | `guide/routing/` | Ch 11-13 | Corridor Runner | Comprehensive guide section |
| Route Config | `guide/routing/` | Ch 12 | Corridor Runner | Routes, params, guards |
| RouterLink | `guide/routing/` | Ch 13 | Corridor Runner | Navigation directives |

### Data Input (Phase 3)

| Angular Topic | Docs Location | Curriculum Ch | Minigame | Coverage Notes |
|---------------|---------------|---------------|----------|----------------|
| Template-driven Forms | `guide/forms/` | Ch 14-15 | Terminal Hack | FormsModule, ngModel |
| Reactive Forms | `guide/forms/` | Ch 16-17 | Terminal Hack | FormControl, FormGroup, validation |

### Shared Systems (Phase 4)

| Angular Topic | Docs Location | Curriculum Ch | Minigame | Coverage Notes |
|---------------|---------------|---------------|----------|----------------|
| Injectable Services | `guide/di/` | Ch 18 | Power Grid | @Injectable, providedIn |
| Dependency Injection | `guide/di/` | Ch 19 | Power Grid | inject(), providers, hierarchy |

### Data Processing (Phase 5)

| Angular Topic | Docs Location | Curriculum Ch | Minigame | Coverage Notes |
|---------------|---------------|---------------|----------|----------------|
| Built-in Pipes | `tutorials/learn-angular/steps/16-*`, `guide/pipes/` | Ch 20-21 | Data Relay | date, number, currency, etc. |
| Custom Pipes | `tutorials/learn-angular/steps/17-*`, `guide/pipes/` | Ch 22 | Data Relay | PipeTransform, pure/impure |

### Advanced (Phase 6)

| Angular Topic | Docs Location | Curriculum Ch | Minigame | Coverage Notes |
|---------------|---------------|---------------|----------|----------------|
| Signals | `guide/signals/` | Ch 23-26 | Reactor Core | signal, computed, effect, linkedSignal |
| Content Projection | `guide/components/` | Ch 27 | — | ng-content, slots |
| Lifecycle Hooks | `guide/components/` | Ch 28 | Blast Doors | ngOnInit, ngOnDestroy, etc. |
| Custom Directives | `guide/directives/` | Ch 29 | Blast Doors | Attribute directives |
| HTTP Client | `guide/http/` | Ch 30 | Deep Space Radio | HttpClient, methods |
| Interceptors | `guide/http/` | Ch 31 | Deep Space Radio | Functional interceptors |
| Testing | `guide/testing/` | Ch 32 | System Certification | TestBed, mocking |
| Animations | `guide/animations/` | Ch 33 | — | Transitions, triggers |
| Performance | `best-practices/` | Ch 34 | — | Change detection, lazy loading |

## Coverage Gaps

Topics in Angular docs NOT covered by our curriculum:

| Topic | Docs Location | Reason for Exclusion | Consider Adding? |
|-------|---------------|---------------------|-----------------|
| NgModules | `guide/ngmodules/` | Legacy pattern; standalone is the future | No |
| Internationalization (i18n) | `guide/i18n/` | Specialized topic, not core learning | Maybe P8+ |
| Server-Side Rendering | `guide/ssr/` | Advanced deployment topic | Maybe P8+ |
| Hydration | `guide/hydration/` | Advanced SSR-related | No |
| Angular Elements | `guide/elements/` | Niche use case | No |
| Schematics | N/A | Tooling, not framework | No |
| CDK / Material | External | Third-party library | No |

## Recommendation
The 34-chapter curriculum covers all essential Angular concepts for a developer to be productive. The excluded topics are either legacy (NgModules), specialized (i18n, SSR), or tooling-focused. These could be added as bonus content in P8+ if there's demand.
