# Technical Architecture

This document describes the Learn Angular codebase as built. Every claim is traceable to actual source files. Last updated after P8 (Replay Mode Integration).

See `overview.md` for project vision and `curriculum.md` for content scope.

---

## 1. Angular App Structure

### Tech Stack

- **Framework**: Angular 21 (standalone components, no NgModules)
- **Language**: TypeScript (strict mode)
- **Test runner**: Vitest (via `@angular/build:unit-test` builder)
- **E2E**: Playwright
- **Styles**: SCSS
- **State**: Angular signals (no NgRx, no RxJS BehaviorSubjects)

### Directory Layout

```
src/app/
  core/                  -- Singleton services, state, engine framework
    audio/               -- AudioService, SoundEffect enum, SOUND_PATHS constant
    curriculum/          -- CurriculumPhase/StoryMission types and CURRICULUM constant
    error/               -- GlobalErrorHandler
    integration/         -- Cross-service integration specs
    levels/              -- LevelDefinition, LevelPack, LevelLoaderService,
                            LevelProgressionService, LevelNavigationService
    minigame/            -- MinigameEngine, types, registry, shell, scoring,
                            hints, combos, drag-drop, keyboard, endless-mode,
                            speed-run, level-completion, wire-draw
    notifications/       -- XpNotificationService, RankUpNotificationService
    persistence/         -- StatePersistenceService
    progression/         -- XpService, MasteryService, SpacedRepetitionService,
                            StreakService, StreakRewardService, GameProgressionService,
                            DailyChallengeService, RefresherChallengeService,
                            XpDiminishingReturnsService, PlayTimeService,
                            LifetimeStatsService
    settings/            -- SettingsService
    state/               -- GameStateService, Rank type, rank constants
  data/                  -- Static level/mission data files
    levels/              -- Per-minigame level packs (e.g., module-assembly.data.ts)
    missions/            -- Phase-organized story mission data (phase-1 through phase-6)
    tutorials/           -- Tutorial content (scaffolded, not yet populated)
  features/              -- Feature modules for each minigame (scaffolded barrel exports)
    minigames/           -- 12 subdirectories, one per minigame
  pages/                 -- Route-level page components (11 pages)
  shared/                -- Reusable UI components, directives, pipes, icons
    components/          -- 20 shared components (nx- prefix)
    directives/          -- DraggableDirective, DropZoneDirective
    pipes/               -- TimeFormatPipe
    icons/               -- Lucide icon configuration
  bottom-nav/            -- Mobile bottom navigation
  side-nav/              -- Desktop side navigation
```

### Routing

Flat route table in `src/app/app.routes.ts`. All routes except the dashboard and 404 are lazy-loaded via `loadComponent()`. No route modules.

11 routes total (10 named routes plus a `**` wildcard 404 catch-all):

| Route | Component | Loading |
|-------|-----------|---------|
| `/` | `DashboardPage` | Eager |
| `/mission/:chapterId` | `MissionPage` | Lazy |
| `/minigames` | `MinigameHubPage` | Lazy |
| `/minigames/:gameId` | `LevelSelectPage` | Lazy |
| `/minigames/:gameId/level/:levelId` | `MinigamePlayPage` | Lazy |
| `/minigames/:gameId/endless` | `EndlessModePage` | Lazy |
| `/minigames/:gameId/speedrun` | `SpeedRunPage` | Lazy |
| `/minigames/:gameId/daily` | `DailyChallengePage` | Lazy |
| `/profile` | `ProfilePage` | Lazy |
| `/settings` | `SettingsPage` | Lazy |
| `**` | `NotFoundPage` | Eager |

### Conventions

- **Selector prefixes**: `app-` for app-level components (pages, shell), `nx-` for shared library components in `src/app/shared/`
- **File naming**: Angular 2025 convention -- `component-name.ts` (not `component-name.component.ts`). Pipes use `.pipe.ts`, directives use `.directive.ts`
- **Barrel exports**: Each `core/` subdirectory has an `index.ts` barrel. `core/index.ts` re-exports all subdirectories. `shared/index.ts` re-exports components/directives/pipes/icons. Empty barrels use `export {};`

---

## 2. Minigame Framework Architecture

### MinigameEngine\<TLevelData\>

Abstract base class for all minigame engines. **Not an Angular service** -- instantiated per session via factory functions registered in `MinigameRegistryService`. Defined in `src/app/core/minigame/minigame-engine.ts`.

**Generic type parameter**: `TLevelData` defines the game-specific level data shape.

**Signal-based state** (all read-only public signals):

| Signal | Type | Description |
|--------|------|-------------|
| `score` | `Signal<number>` | Current session score |
| `lives` | `Signal<number>` | Remaining lives |
| `status` | `Signal<MinigameStatus>` | Lifecycle state |
| `timeRemaining` | `Signal<number>` | Countdown seconds remaining |
| `currentLevel` | `Signal<string \| null>` | ID of loaded level |
| `playMode` | `Signal<PlayMode>` | Story, Endless, SpeedRun, or DailyChallenge |
| `state` | `Signal<MinigameState>` | Aggregated computed signal of all above |

**Lifecycle state machine**:

```
                    start()            complete()
  [Loading] --------> [Playing] --------> [Won]
                       |    ^    |
                pause()|    |    | fail()
                       v    |    | (lives<=0 or timer=0)
                    [Paused] |
                  resume()   v
                          [Lost]
```

Valid transitions:
- `Loading -> Playing` via `start()`
- `Playing -> Paused` via `pause()`
- `Paused -> Playing` via `resume()`
- `Playing -> Won` via `complete()`
- `Playing -> Lost` via `fail()` (explicit, lives depleted, or timer expired)

**Abstract methods** subclasses must implement:

- `onLevelLoad(data: TLevelData): void` -- called during `initialize()`
- `onStart(): void` -- called after status transitions to Playing
- `onComplete(): void` -- called after status transitions to Won
- `validateAction(action: unknown): ActionResult` -- validates player actions, returns score/lives changes

**Optional hooks**: `onPause()`, `onResume()` -- empty default implementations.

**Built-in timer**: 1-second `setInterval` countdown when `timerDuration` is configured. Auto-fails when timer reaches 0.

**Auto-pause on visibility change**: Listens for `document.visibilitychange`. When the page becomes hidden during Playing, pauses with `_autoPaused = true`. When the page becomes visible again and `_autoPaused` is true, auto-resumes.

**Optional combo tracking**: Constructor accepts a `ComboTrackerService` instance via `MinigameEngineConfig`. Provides `recordCorrectAction()`, `recordIncorrectAction()`, and `getComboMultiplier()`.

**submitAction() pipeline**: `validateAction()` -> update score -> update lives -> auto-fail if lives <= 0.

### MinigameShellComponent

Container component (`app-minigame-shell`) with content projection via `<ng-content />`. Defined in `src/app/core/minigame/minigame-shell/minigame-shell.ts`.

**Signal inputs**: `score`, `lives`, `maxLives`, `timeRemaining`, `timerDuration`, `status`, `result`, `previousBest`, `xpAwarded`, `bonuses`, `nextLevelLocked`, `hintsAvailable`, `hintCount`, `hintPenalty`, `activeHintText`, `warningThreshold`, `criticalThreshold`, `pulseThreshold`, `playMode`.

**Embedded sub-components**: `PauseMenuComponent`, `LevelResultsComponent`, `LevelFailedComponent` -- displayed as overlays based on `status`.

**Timer color transitions** (configurable thresholds):
- Green (`--nx-color-sensor-green`) when ratio > warningThreshold (default 0.5)
- Orange (`--nx-color-alert-orange`) when ratio >= criticalThreshold (default 0.25)
- Red (`--nx-color-emergency-red`) when ratio < criticalThreshold
- Pulse animation when ratio < pulseThreshold (default 0.1)

**Output events**: `pauseGame`, `resumeGame`, `restartGame`, `quit`, `retry`, `useHint`, `nextLevel`, `replay`, `requestHint`.

### MinigameRegistryService

Map-backed singleton registry. Defined in `src/app/core/minigame/minigame-registry.service.ts`.

- Pre-registers all 12 minigame configs at construction time via `DEFAULT_MINIGAME_CONFIGS`
- `register(config, componentType, engineFactory?)` -- registers or re-registers a minigame with its component and engine factory
- `getComponent(gameId)` -- returns `null` if registered but no component yet, `undefined` if not in registry
- `getEngineFactory(gameId)` -- returns the factory function or `null`/`undefined` with the same semantics
- `getAllGames()` -- returns all registered configs
- `getGamesByTopic(topic)` -- filters configs by angularTopic

**DEFAULT_MINIGAME_CONFIGS** includes all 12 minigames, each with an id, name, description, angularTopic, totalLevels, difficultyTiers, and scoreConfig.

### MinigamePlayPage

Route-level orchestrator component. Defined in `src/app/pages/minigame-play/minigame-play.ts`.

**5 view states**: `not-found`, `not-ready`, `locked`, `error`, `ready` -- computed from registry state and level progression.

**Engine lifecycle** (via `effect()`):
1. Watch `gameId()`, `levelId()`, and `viewState()` signals
2. When ready: get engine factory -> create engine -> load level via `LevelLoaderService` -> `initialize()` -> `setPlayMode(Story)` -> `start()`
3. Render minigame component via `NgComponentOutlet`

**Completion detection** (separate `effect()`):
- Watches `engine.status()` for `MinigameStatus.Won`
- Calls `LevelCompletionService.completeLevel()` to trigger the full XP/progression pipeline
- Stores `LevelCompletionSummary` for results display

**Injected services**: `MinigameRegistryService`, `LevelProgressionService`, `LevelLoaderService`, `LevelNavigationService`, `LevelCompletionService`, `HintService`, `KeyboardShortcutService`, `ScoreCalculationService`.

### Supporting Services

| Service | File | Purpose |
|---------|------|---------|
| `ComboTrackerService` | `core/minigame/combo-tracker.service.ts` | Tracks consecutive correct actions, computes combo multiplier |
| `HintService` | `core/minigame/hint.service.ts` | Manages hint availability, usage count, XP penalty fraction |
| `KeyboardShortcutService` | `core/minigame/keyboard-shortcut.service.ts` | Registers/unregisters keyboard shortcuts for minigame actions |
| `ScoreCalculationService` | `core/minigame/score-calculation.service.ts` | Calculates star ratings and score percentages |
| `DragDropService` | `core/minigame/drag-drop.service.ts` | Manages drag-and-drop state for assembly-style games |
| `WireDrawService` | `core/minigame/wire-draw.service.ts` | Manages SVG wire drawing for wiring-style games |
| `EndlessModeService` | `core/minigame/endless-mode.service.ts` | Tracks high scores per game for endless mode |
| `SpeedRunService` | `core/minigame/speed-run.service.ts` | Tracks best times per game for speed run mode |

---

## 3. State Management

### Pattern

Angular signals, not NgRx or RxJS BehaviorSubjects. Every stateful service follows the 4-part pattern established by `GameStateService` (`src/app/core/state/game-state.service.ts`):

1. **Private mutable signals**: `signal()` values only the service can write
2. **Public read-only signals**: Exposed via `.asReadonly()` for consumers
3. **Computed signals**: Derived values via `computed()` that auto-update
4. **Named mutation methods**: Encapsulate state transitions with validation

```typescript
// Example from GameStateService:
private readonly _totalXp = signal<number>(0);        // 1. Private mutable
readonly totalXp = this._totalXp.asReadonly();         // 2. Public read-only
readonly currentRank = computed(() =>                  // 3. Computed
  getRankForXp(this._totalXp())
);
addXp(amount: number): void { ... }                   // 4. Mutation method
```

### Root State: GameStateService

Holds `playerName` and `totalXp`. Rank (`currentRank`) is derived via `computed()` from the `RANK_THRESHOLDS` constant (8 ranks from Cadet at 0 XP to Fleet Admiral at 25,000 XP). Defined in `src/app/core/state/rank.constants.ts`.

### Service Facade Graph

No global store. Each domain service owns its own signal state. Facade services aggregate multiple services:

```
XpService
  facades: GameStateService + StreakService
  adds: calculateLevelXp(), applyStreakBonus(), xpToNextRank, rankProgress

LevelCompletionService
  facades: LevelProgressionService + XpService + MasteryService
           + XpDiminishingReturnsService + HintService + XpNotificationService
  adds: completeLevel() pipeline (see Section 2 diagram)

LifetimeStatsService
  facades: XpService + MasteryService + GameProgressionService
           + PlayTimeService + StreakService + LevelProgressionService
  adds: profileStats computed signal (ProfileStats snapshot)
```

---

## 4. Level/Content Data Format

### LevelDefinition\<T\>

Generic interface for content authoring. Defined in `src/app/core/levels/level.types.ts`.

| Field | Type | Description |
|-------|------|-------------|
| `levelId` | `string` | Unique level ID (e.g., `"ma-basic-01"`) |
| `gameId` | `MinigameId` | Which minigame this level belongs to |
| `tier` | `DifficultyTier` | Basic, Intermediate, Advanced, or Boss |
| `order` | `number` | Sort order within tier (1-based) |
| `title` | `string` | Human-readable level title |
| `conceptIntroduced` | `string` | Angular concept practiced |
| `description` | `string` | Level objective |
| `parTime?` | `number` | Par time in seconds for speed run scoring |
| `data` | `T` | Game-specific level configuration |

### LevelPack

Collection of `LevelDefinition<unknown>` for a single minigame. Contains `gameId` and `levels` (readonly array).

### MinigameLevel\<T\>

Lighter runtime type used by `MinigameEngine`. Subset of `LevelDefinition` fields: `id`, `gameId`, `tier`, `conceptIntroduced`, `description`, `data`. Defined in `src/app/core/minigame/minigame.types.ts`.

### Data File Convention

Static TypeScript arrays in `src/app/data/levels/`. Example: `module-assembly.data.ts` exports `MODULE_ASSEMBLY_LEVELS` (18 levels across 4 tiers) plus game-specific types (`BlueprintSlotType`, `ComponentPart`, `BlueprintSlot`, etc.).

### Tier Structure

4 tiers with ascending XP rewards (defined in `TIER_XP_REWARDS` in `src/app/core/levels/level.types.ts`):

| Tier | Base XP | With Perfect (2x) |
|------|---------|-------------------|
| Basic | 15 | 30 |
| Intermediate | 20 | 40 |
| Advanced | 30 | 60 |
| Boss | 150 | 300 |

### Registration Flow

At app startup: `LevelLoaderService.registerLevelPack(pack)` -> internally calls `LevelProgressionService.registerLevels(pack.levels)`. Re-registration with the same `gameId` is a no-op.

### Story Missions

`CURRICULUM` constant in `src/app/core/curriculum/curriculum.data.ts` is typed `readonly CurriculumPhase[]` -- a phase-grouped structure. Each `CurriculumPhase` contains a `chapters` array of `StoryMission` objects. 34 story missions across 6 phases (10 + 3 + 4 + 2 + 3 + 12). A derived flat array `ALL_STORY_MISSIONS` is also exported.

Types defined in `src/app/core/curriculum/curriculum.types.ts`:
- `CurriculumPhase`: `phaseNumber`, `name`, `description`, `chapters`
- `StoryMission`: `chapterId`, `title`, `angularTopic`, `narrative`, `unlocksMinigame`, `deps`, `phase`

---

## 5. Code Editor Integration

### Decision

Custom lightweight syntax highlighter -- no third-party editor library (no Monaco, no CodeMirror). Rationale: minigames need read-only code display with line highlighting, not a full IDE.

### CodeEditorComponent

Selector: `nx-code-editor`. Defined in `src/app/shared/components/code-editor/code-editor.ts`.

**Dual-layer architecture**:
- `<pre><code>` layer for syntax-highlighted display (token spans with CSS classes)
- Hidden `<textarea>` layer for editable mode (synced scrolling via scroll event handler)

**Signal inputs**: `code` (string), `language` (string, default `'typescript'`), `readOnly` (boolean), `highlightLines` (number array).

**Output**: `codeChange` (emits updated code string when edited).

### Syntax Highlighting

Custom regex tokenizer in `src/app/shared/components/code-editor/syntax-highlight.ts`. The `tokenize(code, language)` function processes the full code string and returns `Token[]`.

**Supported languages**: TypeScript and HTML.

**Token types**: `keyword`, `string`, `comment`, `decorator`, `number`, `tag`, `attr`, `punctuation`, `text`.

**Rendering**: Tokens are rendered as `<span>` elements with CSS classes (`token-keyword`, `token-string`, etc.).

### ExpressionBuilderComponent

Selector: `nx-expression-builder`. Defined in `src/app/shared/components/expression-builder/expression-builder.ts`.

Two modes:
- **Guided mode** (`mode='guided'`): Token-based selection with dropdowns for left operand, operator, and right operand. Right operand toggles between variable reference and literal value.
- **Raw mode** (`mode='raw'`): Free-text input for typing Angular expressions directly.

Uses its own `expression-validator.ts` for token-based validation of assembled or raw expressions. Emits `valueChange` on every input change and `expressionChange` only when the expression is valid.

---

## 6. Progression Persistence

### StatePersistenceService

Central localStorage abstraction. Defined in `src/app/core/persistence/state-persistence.service.ts`.

**API**:

| Method | Description |
|--------|-------------|
| `save(key, data)` | Serializes to JSON, stores under `nexus-station:{key}`. Returns boolean. |
| `load<T>(key)` | Deserializes from localStorage. Returns `null` if missing or corrupted. |
| `clear(key)` | Removes a single namespaced key. |
| `clearAll()` | Removes all `nexus-station:*` keys. |
| `autoSave(key, source, injector?)` | Creates an `effect()` watching a signal, persists on change. Returns `EffectRef`. Does NOT debounce internally. |
| `exportState()` | Collects all `nexus-station:*` entries into a JSON string. |
| `importState(json)` | Restores state from a JSON string. Returns boolean. |

### Persistence Patterns

Three distinct approaches are used across the codebase:

1. **Manual debounced-effect pattern** (most common): Services implement their own persistence via `effect()` -> `untracked()` -> `_debouncedSave()` -> `setTimeout(500ms)` -> `DestroyRef.onDestroy()` clears pending timeout. Used by: GameStateService, SettingsService, MasteryService, SpacedRepetitionService, GameProgressionService, StreakService, PlayTimeService, XpDiminishingReturnsService, LevelProgressionService.

2. **Synchronous saves**: Some services call `persistence.save()` directly without debounce. Used by: StreakRewardService, DailyChallengeService, EndlessModeService, SpeedRunService.

3. **`autoSave()` API**: Available on `StatePersistenceService` but not currently used by any production service (the manual debounced pattern is preferred for finer control).

### Persistence Architecture

```
                      StatePersistenceService
                      (nexus-station:* prefix)
                             |
            +------+------+--+--+------+------+
            |      |      |     |      |      |
       GameState Mastery Streak Settings ...  (12+ services)
       signal()  signal() signal() signal()
          |         |        |       |
       effect() + untracked() + setTimeout(500ms)
          |
       localStorage.setItem()
```

### Services That Persist

Each service uses its own localStorage key under the `nexus-station:` namespace:

| Key | Service | Data |
|-----|---------|------|
| `game-state` | GameStateService | playerName, totalXp |
| `mastery` | MasteryService | Map\<MinigameId, stars\> |
| `spaced-repetition` | SpacedRepetitionService | Map\<MinigameId, epoch\> |
| `game-progression` | GameProgressionService | Set\<ChapterId\> (persisted as array) |
| `settings` | SettingsService | UserSettings (sound, animation, theme, reducedMotion) |
| `streak` | StreakService | Streak snapshot (days, lastActivity) |
| `streak-rewards` | StreakRewardService | Claimed reward milestones |
| `level-progression` | LevelProgressionService | Map\<levelId, LevelProgress\> (scores, stars, completion, attempts) |
| `diminishing-returns` | XpDiminishingReturnsService | Completion counts per level |
| `play-time` | PlayTimeService | Total play time in seconds |
| `daily-challenge` | DailyChallengeService | Last completed date |
| `endless-high-score:{gameId}` | EndlessModeService | High score per minigame |
| `speed-run-best-time:{gameId}` | SpeedRunService | Best time per minigame |

### Data Validation

Every service validates the shape and types of loaded data, silently discarding corrupted entries and falling back to defaults.

### Reset

Individual services have `reset*()` methods for clearing their own state. `SettingsService.resetProgress()` calls `StatePersistenceService.clearAll()` followed by a full page reload.

---

## 7. Testing Strategy

### Framework

Vitest via `@angular/build:unit-test` builder. Not Karma/Jasmine.

### Coverage Thresholds

Enforced in CI via `ng test -c coverage --watch=false`. Configured in `angular.json` under `test.options.coverageThresholds`:

| Metric | Threshold |
|--------|-----------|
| Statements | 80% |
| Branches | 75% |
| Functions | 80% |
| Lines | 80% |

### CI Pipeline

GitHub Actions (`.github/workflows/ci.yml`) with 3 parallel jobs:

| Job | Command | Timeout |
|-----|---------|---------|
| Lint | `npx ng lint` | 10 min |
| Unit Tests | `npx ng test -c coverage --watch=false` | 10 min |
| Build | `npx ng build` | 10 min |

All jobs run on `ubuntu-latest` with Node 22 LTS. Uses `corepack enable && corepack install` for consistent package manager versions. Concurrency group cancels in-progress runs on the same ref.

### E2E Tests

Playwright for smoke tests. 6 tests across 2 files:

- `e2e/app.spec.ts` (2 tests): Dashboard page loads with correct title and heading; unknown routes show the "Hull Breach" 404 page.
- `e2e/minigame-shell.spec.ts` (4 tests): Coming Soon state for registered games without components; Game Not Found for unregistered IDs; navigation back to hub from both states.

**Workaround**: E2E uses `--configuration production` due to Angular 21 Vite dev server routing bug (tracked as T-2026-037).

### Test Helpers

`src/testing/test-utils.ts` provides two helpers:

- `createComponent<T>(component, options?)`: Shorthand for `TestBed.configureTestingModule()` + `createComponent()` + `detectChanges()`. Returns `{ fixture, component, element }`.
- `getMockProvider<T>(token, overrides?)`: Creates a mock provider with `useValue` from partial overrides. Callers must stub all methods their component calls.

Also re-exports `TestBed`, `ComponentFixture`, `fakeAsync`, `tick`, `flush` for single-import convenience.

### Unit Test Patterns

- **Services**: Direct instantiation via `TestBed.inject()`, mock dependencies via `getMockProvider()`
- **Components**: `createComponent()` helper, query DOM for assertions
- **State services**: `fakeAsync/tick/flush` for debounced auto-save verification
- **MinigameEngine subclasses**: Extend with concrete test implementations to test abstract class behavior

### TDD Approach

Red-Green-Refactor. Tests written before implementation. Each ticket includes specific test counts in completion summary.

**Total**: 83 spec files across the `src/` directory.

---

## 8. Build and Deployment Pipeline

### Build

Angular CLI with Vite-based builder (`@angular/build`). Production build via `ng build`.

### Level Completion Pipeline

The full flow when a player wins a minigame level, orchestrated by `LevelCompletionService.completeLevel()` in `src/app/core/minigame/level-completion.service.ts`:

```
MinigameResult (from engine)
  |
  v
LevelDefinition lookup (tier from LevelProgressionService)
  |
  v
XpService.calculateLevelXp(tier, effectivePerfect)
  |
  v
HintService.getXpPenaltyFraction() --> subtract hint penalty
  |
  v
XpDiminishingReturnsService.recordCompletion() --> apply replay multiplier
  |
  v
XpService.applyStreakBonus() --> apply streak multiplier
  |
  v
LevelProgressionService.completeLevel() --> record progress + add XP
  |
  v
MasteryService.updateMastery() --> recalculate star rating
  |
  v
XpNotificationService.show() --> toast notification
  |
  v
LevelCompletionSummary (returned)
  includes: rankUpOccurred flag (computed by comparing
            rank before/after XP addition; available in
            the summary but not consumed by the notification
            service)

Note: RankUpNotificationService detects rank-ups independently
via an effect() watching xpService.currentRank(), not through
LevelCompletionSummary. See Section 9 for AudioService details.
```

### Known Issue

Angular 21 Vite dev server routing bug -- routes are not populated correctly in dev mode. Tracked as T-2026-037. Workaround: E2E tests run against production build.

### Package Manager

npm with corepack for consistent Node/npm versions across environments.

---

## 9. Audio

### AudioService

Singleton service for playing sound effects. Defined in `src/app/core/audio/audio.service.ts`.

**Purpose**: Provides a `play(soundId)` method that plays short audio clips for game events (correct/incorrect answers, level completion, rank-ups, etc.). Respects the user's sound preference from `SettingsService`.

**SoundEffect enum** (9 values):

| Value | File | Usage |
|-------|------|-------|
| `correct` | `audio/correct.mp3` | Player submits a correct action |
| `incorrect` | `audio/incorrect.mp3` | Player submits an incorrect action |
| `complete` | `audio/complete.mp3` | Level completed successfully |
| `fail` | `audio/fail.mp3` | Level failed (lives depleted or timer expired) |
| `levelUp` | `audio/levelUp.mp3` | New level unlocked |
| `rankUp` | `audio/rankUp.mp3` | Player reaches a new rank |
| `hint` | `audio/hint.mp3` | Hint requested |
| `click` | `audio/click.mp3` | UI button interaction |
| `tick` | `audio/tick.mp3` | Timer tick (countdown warning) |

**Caching strategy**: Bulk preload on first use. On first `play()` call (or explicit `preload()` call), creates `HTMLAudioElement` instances for all 9 sounds at once and stores them in a `Map<SoundEffect, HTMLAudioElement>` cache. A `_preloaded` boolean flag prevents redundant preloading. Subsequent plays clone the cached element via `cloneNode(true)` to allow overlapping playback. SSR-safe: the preload guard exits early if `typeof window === 'undefined'`, leaving the cache empty on SSR even though `_preloaded` is set to `true`. File paths are defined in the exported `SOUND_PATHS` constant (`Record<SoundEffect, string>`).

**SettingsService integration**: `play()` checks `SettingsService.settings().soundEnabled` before playing. If sound is disabled, `play()` is a no-op.

**Volume control**: Private `_volume` signal (default 0.5), exposed as read-only. `setVolume(v)` clamps to [0, 1]. Each cloned audio element's `volume` is set to the current signal value.

**Consumers**: `RankUpNotificationService` injects `AudioService` to play `SoundEffect.rankUp` when a rank change is detected via its `effect()`.

---

## 10. Minigame-Specific Patterns

This section documents patterns that are unique to individual minigames, as opposed to the shared abstract framework described in Section 2. Each minigame may introduce domain-specific services, UI components, and visual styles. As new minigames ship (P5 through P7), their patterns will be appended here as subsections.

### Simulation Services

Every implemented minigame uses a component-scoped `@Injectable()` service for domain-specific logic. These are **not** `providedIn: 'root'` -- they are provided in the component tree so that Angular automatically destroys them when the minigame component is torn down, preventing leaked state between sessions.

| Service | File | Minigame | Purpose |
|---------|------|----------|---------|
| `ConveyorBeltService` | `features/minigames/module-assembly/conveyor-belt.service.ts` | Module Assembly | Visual conveyor belt state management |
| `WireProtocolValidationService` | `features/minigames/wire-protocol/wire-protocol-validation.service.ts` | Wire Protocol | Wire connection validation |
| `FlowCommanderSimulationService` | `features/minigames/flow-commander/flow-commander-simulation.service.ts` | Flow Commander | Control flow simulation |
| `SignalCorpsWaveService` | `features/minigames/signal-corps/signal-corps-wave.service.ts` | Signal Corps | Wave/signal state management |
| `CorridorRunnerSimulationService` | `features/minigames/corridor-runner/corridor-runner-simulation.service.ts` | Corridor Runner | Route segment simulation |
| `TerminalHackFormEvaluationService` | `features/minigames/terminal-hack/terminal-hack-evaluation.service.ts` | Terminal Hack | Form evaluation and test case execution |
| `PowerGridInjectionServiceImpl` | `features/minigames/power-grid/power-grid-injection.service.ts` | Power Grid | DI scope validation and connection checking |
| `DataRelayTransformServiceImpl` | `features/minigames/data-relay/data-relay-transform.service.ts` | Data Relay | Pipe application, chaining, and stream evaluation |
| `ReactorCoreGraphServiceImpl` | `features/minigames/reactor-core/reactor-core-graph.service.ts` | Reactor Core | DAG editing, cycle detection, change propagation, scenario execution |

Pattern: all are `@Injectable()` without `providedIn: 'root'`, scoped to their component tree for automatic cleanup.

### Terminal Hack: Form Evaluation Pattern

Terminal Hack's core gameplay follows a 3-phase pipeline: element placement, form evaluation, and test case execution. Defined across `terminal-hack.engine.ts` and `terminal-hack-evaluation.service.ts` in `src/app/features/minigames/terminal-hack/`.

**Phase 1 -- Element Placement**: The player places form elements via `PlaceElementAction`, `RemoveElementAction`, and `SetValidationAction` dispatched through the engine's `submitAction()` pipeline. The engine maintains a `ReadonlyMap<string, PlayerFormElement>` of placed elements as a signal. Each `PlayerFormElement` captures `elementId`, `elementType` (text, email, number, etc.), `toolType` (template-driven or reactive API), and `validations` (array of `FormValidationRule`).

**Phase 2 -- Form Evaluation**: `TerminalHackFormEvaluationService.evaluateForm()` compares placed elements against the `TargetFormSpec`. For each spec element it checks: (1) element type match, (2) tool type compatibility with the form type (template-driven vs reactive -- validator tools are valid for both), and (3) validation rule completeness. Returns per-element `ElementEvaluationResult[]` with `correctType`, `correctTool`, `correctValidations`, and `missingValidations` fields. This provides granular UI feedback at the element level.

**Phase 3 -- Test Case Execution**: `TerminalHackFormEvaluationService.runTestCases()` runs predefined `FormTestCase[]` against the placed elements. Each test case provides `inputValues` (`Record<string, string>`) and `expectedValid` (boolean) plus optional `expectedErrors`. The service applies the player's validation rules to inputs and compares actual form validity against expected. Returns a `TestRunResult` with per-case `TestCaseResult[]` and aggregate `passRate` (0 to 1).

**Scoring formula**:

```
Math.max(0, Math.round(maxScore * correctnessRatio * speedMultiplier * attemptMultiplier) - hintDeduction)
```

- `correctnessRatio` = `testResult.passRate`
- `speedMultiplier` = `max(0.5, localTimeRemaining / timeLimit)`
- `attemptMultiplier` = `max(0.5, 1.0 - 0.1 * (runCount - 1))`
- `hintDeduction` = `hintsUsedCount * 50`

The result is rounded before subtracting the hint deduction and floored at 0.

**Lose condition**: 3 lives. Each failed test run (any test case fails) dispatches a `TestFailureAction` through the engine's standard `submitAction()` pipeline with `livesChange: -1`. Three failed runs = game over.

### Terminal Hack: Live Preview

`TerminalHackLivePreviewComponent` (`app-terminal-hack-live-preview`) provides real-time visual feedback of the player's form construction. Defined in `src/app/features/minigames/terminal-hack/live-preview/live-preview.ts`.

**Inputs**: `TargetFormSpec` (the target form) + `PlayerFormElement[]` (what the player has placed).

**Computed `previewSlots` signal**: Maps each spec element to a `PreviewSlot` with one of three statuses:

| Status | Condition |
|--------|-----------|
| `'missing'` | No element placed for that slot |
| `'correct'` | Placed element's `elementType` matches the spec's `elementType` |
| `'incorrect'` | Element placed but type-mismatched |

Uses a `Map<string, PlayerFormElement>` lookup computed from the input array for O(1) matching per spec element.

The engine also exposes a `formPreview` computed signal with `completionRatio` (placed count / required count), used by the sidebar for a progress indicator.

### Terminal Hack: Test Runner

`TerminalHackTestRunnerComponent` (`app-terminal-hack-test-runner`) displays test cases with pass/fail indicators. Defined in `src/app/features/minigames/terminal-hack/test-runner/test-runner.ts`.

- Uses a `Map<string, TestCaseResult>` lookup for O(1) result matching per test case
- Staggered animation delay (`i * 80ms`) for a visual test execution effect
- "Run Tests" button triggers `engine.runTestCases()` which either auto-completes the level (all tests pass) or costs a life (any test fails)
- Displays aggregate pass rate (`passCount / totalCount tests passed`)

### Terminal Hack: Visual Style

Terminal Hack introduces the first game-specific visual pattern: a retro terminal aesthetic. Future minigames may introduce their own themed aesthetics as subsections here.

- **Color scheme**: Green-on-black (`#00ff41` on `#0a0a0a`)
- **Scanline overlay**: CSS `repeating-linear-gradient` with an 8-second `scanline-flicker` animation (opacity cycles between 0.4 and 0.6)
- **Font**: Monospace via `var(--nx-font-mono, 'JetBrains Mono', monospace)`
- **Power gauge timer**: Horizontal bar depleting over time, replacing the shell's built-in timer. Color transitions from green (`#00ff41`) at >50% to orange (`#f97316`) at >25% to red (`#ef4444`) at <=25%
- **`prefers-reduced-motion` support**: Disables the scanline animation (sets opacity to a static 0.3) and removes power gauge fill transitions

### Power Grid: DI Scope Validation Pattern

Power Grid's core gameplay models Angular's dependency injection system as a circuit board. Services are power sources on the left; components are consumer modules on the right; connections are DI injection wires. The player wires services to components at the correct DI scopes to "power up" the grid. Defined across `power-grid.types.ts`, `power-grid.engine.ts`, and `power-grid-injection.service.ts` in `src/app/features/minigames/power-grid/`.

**Domain types** (all in `power-grid.types.ts`):

| Type | Shape | Purpose |
|------|-------|---------|
| `InjectionScope` | `'root' \| 'component' \| 'hierarchical'` | Angular DI scope for a service |
| `ProviderType` | `'class' \| 'factory' \| 'value' \| 'existing'` | Maps to `useClass`, `useFactory`, `useValue`, `useExisting` |
| `ServiceNode` | `{ id, name, type, providedIn, providerType?, kind?, dependsOn?, methods?, stateful? }` | A service (power source) on the grid board. `kind` distinguishes class-based services (`'class'`) from `InjectionToken`s (`'token'`). `dependsOn` models service-to-service DI |
| `ComponentNode` | `{ id, name, requiredInjections, providers? }` | A component (consumer module). `requiredInjections` lists service IDs it needs injected. Optional `providers` for component-level scoping |
| `ValidConnection` | `{ serviceId, componentId, scope }` | Static answer key: the correct service-component-scope triples |
| `ScopeRule` | `{ serviceId, allowedScopes, defaultScope }` | Constrains which scopes are valid for a given service |

**Utility functions** (exported from `power-grid.types.ts`):

- `isScopeAllowed(serviceId, scope, scopeRules)` -- checks whether a scope is in the allowed list for a service. Returns `true` (lenient) if no scope rule exists for that service.
- `isConnectionValid(connection, validConnections, scopeRules)` -- checks whether a connection matches the answer key at the specified scope AND passes `isScopeAllowed`. Both conditions must hold.

**Validation flow**: `PowerGridInjectionServiceImpl.validateAll()` iterates all player connections, delegating to `isConnectionValid()` for each. Failures are classified as `'wrong-pair'` (service-component mismatch -- no matching `ValidConnection` with that serviceId + componentId) or `'wrong-scope'` (correct pair, wrong scope). Returns a `GridValidationResult` with:

- `correctConnections` -- connections that match the answer key
- `shortCircuits` -- connections that failed validation, each with a `reason` field
- `missingConnections` -- answer key entries with no corresponding player connection
- `allCorrect` -- `true` only when `shortCircuits` is empty AND `missingConnections` is empty

**Inline validation fallback**: The engine has a built-in `inlineValidate()` method used when no injection service is provided (testing convenience). It performs the same logic without requiring Angular DI.

**Scoring**: Verification-based with tiered multipliers. The player clicks "Verify" to check all connections at once. `DEFAULT_MAX_VERIFICATIONS = 3`. Score = `maxScore * multiplier`, where multiplier is 1.0 (1st attempt), 0.4 (2nd), or 0.2 (3rd). All verifications used without success = fail.

### Power Grid: Circuit Board UI

`PowerGridBoardComponent` (`app-power-grid-board`): SVG-based board defined in `src/app/features/minigames/power-grid/board/board.ts`. Uses a `0 0 1000 600` viewBox. Services positioned at `x=150` (`SERVICE_X`), components at `x=850` (`COMPONENT_X`), both evenly distributed vertically via `((i + 1) / (count + 1)) * VIEWBOX_HEIGHT`.

**Wire rendering**: Bezier curves between service and component ports, color-coded by scope:

| Scope | Color | Theme name |
|-------|-------|------------|
| `root` | `#3B82F6` | Reactor Blue |
| `component` | `#22C55E` | Sensor Green |
| `hierarchical` | `#F97316` | Alert Orange |

Colors defined in `SCOPE_COLORS` constant in `power-grid.component.ts`.

**Wire drawing integration**: The parent `PowerGridComponent` (`app-power-grid`) integrates with the shared `WireDrawService` for interactive wire drawing. A preview wire renders during drag, colored by the currently selected scope. The `WireDrawService` validator checks that the target component's `requiredInjections` includes the source service's ID.

`PowerGridScopeConfigComponent` (`app-scope-config`): Scope selection panel for a service. Defined in `src/app/features/minigames/power-grid/scope-config/scope-config.ts`. Shows the three scope options as buttons, highlights the active scope, and shows a "Short circuit" warning when the selected scope is not in the service's `allowedScopes` (via `isScopeAllowed()`). Lists valid connection targets filtered by the selected scope.

**Keyboard shortcuts**: `1` = root scope, `2` = component scope, `3` = hierarchical scope, `Escape` = cancel wire.

**Verification feedback**: After the player clicks "Verify", each wire gets a feedback class (`correct`, `wrong-pair`, `wrong-scope`). Incorrect wires display in red (`#EF4444`). A 400ms rejection flash signals invalid placement attempts.

### Data Relay: Pipe Transformation Chain

Data Relay's core gameplay models Angular's pipe system as data streams flowing left-to-right. Players place pipe blocks to transform raw input into expected output. The engine stores `RuntimeStream[]` with `PipeBlock[]` per stream and delegates transform evaluation to `DataRelayTransformServiceImpl`. Defined across `data-relay.types.ts`, `data-relay.engine.ts`, `data-relay-transform.service.ts`, and `pipe-transforms.ts` in `src/app/features/minigames/data-relay/`.

**Domain types** (all in `data-relay.types.ts`):

| Type | Shape | Purpose |
|------|-------|---------|
| `DataStream` | `{ id, name, rawInput, isAsync? }` | A data stream on the board. `isAsync` marks resolved async values |
| `PipeDefinition` | `{ id, pipeName, displayName, category, params?, isCustom? }` | A pipe available in the toolbox |
| `RuntimeStream` | `{ streamId, rawInput, requiredOutput, placedPipes }` | Runtime stream with placed pipe chain |
| `PipeBlock` | `{ id, pipeType, params, position }` | A pipe placed by the player. `position` is the sort order in the chain |
| `CustomPipeSpec` | `{ name, transformFn, pureness }` | Specification for a custom pipe with transform function string and `'pure' \| 'impure'` flag |

**Transform service**: `DataRelayTransformServiceImpl` (in `data-relay-transform.service.ts`) implements the `DataRelayTransformService` interface:

- `applyPipe(input, pipeType, params)` -- applies a single pipe transform via `applyPipeTransform()`
- `applyChain(input, pipes)` -- sorts pipes by `position`, applies each sequentially (left-to-right)
- `evaluateStreams(streams)` -- evaluates all streams at once, returning `StreamResult[]`
- `compareOutput(actual, expected)` -- strict string equality comparison

**`pipe-transforms.ts` module**: Pure function `applyPipeTransform()` implements Angular's built-in pipes via JavaScript equivalents:

| Category | Pipe | Implementation |
|----------|------|----------------|
| Text | `uppercase` | `String.toUpperCase()` |
| Text | `lowercase` | `String.toLowerCase()` |
| Text | `titlecase` | Capitalize first letter of each word |
| Number | `decimal` | `Number.toLocaleString()` with Angular digit info parsing (`{min}.{minFrac}-{maxFrac}`) |
| Number | `currency` | `Intl.NumberFormat` with currency style |
| Number | `percent` | Multiply by 100, format with digit info |
| Date | `date` | `Intl.DateTimeFormat` with named presets: `short`, `shortDate`, `mediumDate`, `longDate`, `fullDate` |
| Utility | `slice` | `String.slice(start, end)` |
| Utility | `async` | Passthrough (resolved value) |
| Utility | `json` | `JSON.stringify(input, null, 2)` |
| Custom | `distance` | Converts km to light-years (`km / 9460730472580.8`) |
| Custom | `status` | Threshold-based mapping: value <= low = `'critical'`, <= high = `'warning'`, else `'nominal'` |
| Custom | `timeAgo` | Relative time string (e.g., "3 days ago") |

Custom pipes are registered via `CustomPipeSpec` with a `name`, `transformFn` string, and `pureness` flag. The `applyCustomPipe()` dispatcher routes to known custom pipe implementations by name.

**RunTransform flow** in the engine: `DataRelayEngine.runTransform()` evaluates all streams plus test data items. Auto-completes on all correct (`allCorrect = true`). Auto-fails when `failedTestCount > 2`. Returns `TransformRunResult` with `streamResults`, `testResults`, `allCorrect`, and `failedTestCount`.

**Scoring formula**: Same tiered multiplier as Power Grid. 1st run = `maxScore * 1.0`, 2nd = `maxScore * 0.4`, 3rd+ = `maxScore * 0.2`.

### Data Relay: Pipe Toolbox Pattern

Pipes are organized by `PipeCategory` (`'text' | 'number' | 'date' | 'custom'`) with color-coded display via the `PIPE_CATEGORY_COLORS` constant in `data-relay.types.ts`:

| Category | Color | Theme name |
|----------|-------|------------|
| `text` | `#3B82F6` | Reactor Blue |
| `number` | `#22C55E` | Sensor Green |
| `date` | `#F97316` | Alert Orange |
| `custom` | `#A855F7` | Comm Purple |

**Toolbox UI** (in `DataRelayComponent`, `app-data-relay`): Category filter tabs with an "all" option plus per-category buttons. Keyboard shortcuts: `1` = all, `2` = text, `3` = number, `4` = date. The `filteredPipes` computed signal filters `availablePipes` by the selected category.

`DataRelayPipeConfigComponent` (`app-pipe-config`): Type-specific parameter editors defined in `src/app/features/minigames/data-relay/pipe-config/pipe-config.ts`:

| Category | Editor |
|----------|--------|
| `date` | Format selector dropdown (`short`, `shortDate`, `mediumDate`, `longDate`, `fullDate`) |
| `number` | Fraction digits numeric input |
| `text` | "No parameters" message |
| `custom` | Code editor (`nx-code-editor`) for transform function |

**Live preview**: Shows sample input transformed to output in real time using `applyPipeTransform()`. Sample inputs are category-specific constants (e.g., text = `'hello world'`, number = `'1234.5678'`, date = `'2026-03-15T12:00:00Z'`).

**Reusable pattern note**: This category-grouped toolbox pattern (category tabs + filtered tool grid + type-specific parameter editors + live preview) is reusable for future minigames that need categorized tool palettes. For example, P6 Reactor Core could use it for signal operation categories.

### Data Relay: Stream Visualizer

`DataRelayStreamVisualizerComponent` (`app-data-relay-stream-visualizer`): Renders runtime streams as horizontal lanes. Defined in `src/app/features/minigames/data-relay/stream-visualizer/stream-visualizer.ts`.

**Stream lane layout**: Each stream lane shows raw input on the left, pipe block slots in the middle (color-coded by category via `PIPE_CATEGORY_COLORS` lookup), and expected/actual output on the right. Output comparison shows actual vs expected after transform runs via the `streamResultMap` input.

**Drag-and-drop**: Pipe blocks are drop zones via the shared `DropZoneDirective` (from `src/app/shared/directives/drop-zone.directive.ts`). Players drag pipes from the toolbox onto stream lanes. The parent `DataRelayComponent` handles the `pipeDragTarget` output event and dispatches `PlacePipeAction` through the engine.

**Interaction model**:

- Left-click on a placed pipe block opens the `DataRelayPipeConfigComponent` for parameter editing
- Right-click on a pipe block removes it from the stream (dispatches `RemovePipeAction`)
- Placement feedback: brief flash (400ms) on the stream lane -- green for valid placement, red for invalid

**Particle gap indices**: `getParticleGaps(stream)` generates visual data flow markers between pipe blocks, one per gap between input/pipes/output (count = `placedPipes.length + 1`).

### Reactor Core: Signal Graph Editing Pattern

Reactor Core models Angular's signal system as a directed acyclic graph (DAG). Players place signal, computed, and effect nodes on a canvas, wire them together, then run simulation scenarios that propagate value changes through the graph. The engine stores `RuntimeReactorNode[]` with `GraphEdge[]` and delegates graph operations to `ReactorCoreGraphServiceImpl`. Defined across `reactor-core.types.ts`, `reactor-core.engine.ts`, `reactor-core-graph.service.ts`, and `reactor-core.component.ts` in `src/app/features/minigames/reactor-core/`.

**Node type system** (all in `reactor-core.types.ts`):

7 node types mirror Angular's signal API, each with a level-data (readonly) interface and a runtime (mutable) counterpart:

| Type | Level-data interface | Angular concept | Key fields |
|------|---------------------|-----------------|------------|
| `'signal'` | `SignalNode` | `signal()` | `initialValue` |
| `'computed'` | `ComputedNode` | `computed()` | `computationExpr`, `dependencyIds` |
| `'effect'` | `EffectNode` | `effect()` | `actionDescription`, `dependencyIds`, `requiresCleanup?` |
| `'linked-signal'` | `LinkedSignalNode` | `linkedSignal()` | `initialValue`, `linkedToId` |
| `'to-signal'` | `ToSignalNode` | `toSignal()` | `sourceDescription`, `dependencyIds` |
| `'to-observable'` | `ToObservableNode` | `toObservable()` | `dependencyIds` |
| `'resource'` | `ResourceNode` | `resource()` | `requestDescription`, `dependencyIds` |

Runtime types extend the level-data interfaces with `position: NodePosition` (mutable `{x, y}` for drag) and `currentValue` (mutable, except `RuntimeEffectNode` which has `cleanupFn` instead, and `RuntimeToObservableNode` which has no value). `RuntimeResourceNode` also adds `resourceState: 'loading' | 'error' | 'value'`.

The union `ReactorNode` covers all 7 level-data types; `RuntimeReactorNode` covers all 7 runtime types.

**Graph structure types**:

| Type | Shape | Purpose |
|------|-------|---------|
| `GraphEdge` | `{ sourceId, targetId }` | Directed edge between two nodes |
| `ValidGraph` | `{ nodes, edges }` | Answer key: a correct graph configuration |
| `SimulationScenario` | `{ id, description, signalChanges, expectedOutputs }` | Test scenario with input changes and expected results |
| `GraphConstraint` | `{ maxNodes, requiredNodeTypes, forbiddenPatterns? }` | Limits on the player's graph |
| `ReactorCoreLevelData` | `{ requiredNodes, scenarios, validGraphs, constraints }` | Complete level configuration |

**Validation and result types**:

| Type | Purpose |
|------|---------|
| `GraphValidationResult` | `{ valid, cycles, orphanedNodes, missingDependencies }` |
| `PropagationResult` | `{ updatedNodes, triggeredEffects }` |
| `ScenarioResult` | `{ passed, results[] }` with per-node expected/actual/match |

### Reactor Core: Cycle Detection

Two pure utility functions exported from `reactor-core.types.ts`:

- `hasCycle(edges, nodeIds)` -- DFS with 3-color marking (WHITE=unvisited, GRAY=in-progress, BLACK=done). Returns `true` if any cycle exists in the directed graph.
- `wouldCreateCycle(existingEdges, newEdge, nodeIds)` -- Tests whether adding a new edge would introduce a cycle. Spreads the new edge into existing edges (no mutation) and delegates to `hasCycle()`.

Both the engine's `handleConnectEdge()` and the graph service's `addEdge()` call `wouldCreateCycle()` before accepting a new edge, preventing circular dependencies at the graph editing level.

### Reactor Core: Change Propagation Model

Propagation follows a 4-step pipeline implemented in both `ReactorCoreGraphServiceImpl.propagateChanges()` and the engine's inline fallback `inlineRunScenario()`:

1. **Apply signal changes** -- Set new values on the changed signal nodes.
2. **Handle linked-signal nodes** -- If a linked-signal's source was changed, copy the source value to the linked node.
3. **Topological sort** -- Kahn's algorithm on the reachable subgraph from changed signal IDs. First performs BFS to discover all reachable nodes, then runs Kahn's algorithm on the reachable subgraph to produce a dependency-ordered processing sequence.
4. **Process nodes in topological order** -- For each reachable node (skipping the initially changed signals):
   - `computed`: Build a scope `Record<string, value>` from inbound edges (keyed by source node `label`), evaluate `computationExpr` via `new Function()` constructor.
   - `effect`: Record the node ID in `triggeredEffects[]` (no value computation).
   - `linked-signal`: Copy value from linked source.
   - `to-signal`: Pass-through from first inbound edge's value.
   - `resource`: Pass-through from first inbound edge's value, update `resourceState` to `'value'`.
   - `to-observable`: Skipped (no `currentValue`).

**Expression evaluation**: `evaluateExpression(expr, scope)` uses the `Function` constructor to evaluate `computationExpr` strings with named variables from the dependency scope. Returns `string | number | boolean`, falling back to `0` on error.

**Approximate equality**: `approximatelyEqual(actual, expected)` uses tolerance `0.01` for number comparisons, strict equality for strings and booleans.

### Reactor Core: Scenario Execution and Validation

**Graph validation** (`validateGraph()`): Checks 3 conditions:

1. **Cycles** -- `hasCycle()` on the full edge set
2. **Orphaned nodes** -- Non-signal nodes with neither inbound nor outbound edges
3. **Missing dependencies** -- For computed, effect, to-signal, to-observable, and resource nodes: checks that every declared `dependencyId` has a corresponding inbound edge

Returns `GraphValidationResult` with `valid` = true only when all three checks pass.

**Scenario execution** (`runScenario()`): Applies the propagation pipeline above, then compares expected outputs against computed values. Each `ExpectedOutput` specifies `nodeId`, `expectedValue`, and optional `expectedState` (for resource nodes). Returns `ScenarioResult` with per-node match results and an aggregate `passed` boolean.

**Simulation run** (`runSimulation()` on the engine): Runs all scenarios from the level data. Tracks `simulationCount` and `simulationsRemaining` (default `DEFAULT_MAX_SIMULATIONS = 3`). Auto-completes on all pass; auto-fails when simulations exhausted.

**Scoring**: Same tiered multiplier pattern as Power Grid and Data Relay. 1st simulation = `maxScore * 1.0`, 2nd = `maxScore * 0.4`, 3rd = `maxScore * 0.2`.

**Engine action types** (6 actions via `submitAction()`):

| Action | Type guard | Effect |
|--------|-----------|--------|
| `AddNodeAction` | `isAddNodeAction` | Places a required node from the level's `requiredNodes` pool |
| `RemoveNodeAction` | `isRemoveNodeAction` | Removes a node and all its connected edges |
| `ConnectEdgeAction` | `isConnectEdgeAction` | Adds an edge (rejects duplicates and cycles) |
| `DisconnectEdgeAction` | `isDisconnectEdgeAction` | Removes an edge |
| `SetSignalValueAction` | `isSetSignalValueAction` | Updates value on signal or linked-signal nodes |
| `SetNodePositionAction` | `isSetNodePositionAction` | Updates `{x, y}` position for canvas drag |

Each action has a dedicated type guard function and returns `ActionResult` with `valid`, `scoreChange`, and `livesChange` fields. Graph-editing actions return `scoreChange: 0, livesChange: 0` -- scoring occurs only during simulation.

### Reactor Core: Graph Canvas SVG Pattern

`ReactorCoreGraphCanvasComponent` (`app-reactor-core-graph-canvas`): SVG-based graph editor defined in `src/app/features/minigames/reactor-core/graph-canvas/graph-canvas.ts`. Uses a `0 0 1200 800` viewBox.

**Pan and zoom**: Internal `panX`, `panY`, and `zoomLevel` signals compose into a `canvasTransform` computed string (`translate(panX, panY) scale(zoomLevel)`). Zoom via mouse wheel (delta `+/-0.1`, clamped to `[0.3, 3]`).

**Node rendering**: Nodes are rectangles (`NODE_WIDTH = 160`, `NODE_HEIGHT = 80`) positioned by `RuntimeReactorNode.position`. Each node has a source port (right edge, `x + NODE_WIDTH`) and a target port (left edge, `x`), both at vertical center (`y + 40`). Port components use `SvgPortComponent` from the shared library.

**Node drag**: Pointer-based drag via `onNodePointerDown` / `onPointerUp`. Captures pointer on the SVG element (`setPointerCapture`). Computes delta from drag start and emits `nodeMoved` with the new position.

**Wire rendering**: `wireDescriptors` computed signal maps edges to `GraphWireDescriptor[]`. Each wire is a Bezier curve: `M startX startY C cp1x cp1y, cp2x cp2y, endX endY` with control point offset `dx = |endX - startX| * 0.4`. Wire color is determined by the source node's type via `EXTENDED_NODE_COLORS`.

**Wire drawing**: Integrates with the shared `WireDrawService`. A `previewPath` computed signal renders a live Bezier preview during drawing. The wire validator calls `wouldCreateCycle()` to reject edges that would create cycles. Port IDs follow the format `"{nodeId}-source"` / `"{nodeId}-target"` and are parsed to extract node IDs for edge creation.

**Node color scheme** (`EXTENDED_NODE_COLORS` in `graph-canvas.ts`, `NODE_TYPE_COLORS` in `node-config.ts`):

| Node type | Color | Theme name |
|-----------|-------|------------|
| `signal` | `#3B82F6` | Reactor Blue |
| `computed` | `#22C55E` | Sensor Green |
| `effect` | `#F97316` | Alert Orange |
| `linked-signal` | `#A855F7` | Comm Purple |
| `to-signal` | `#3B82F6` | Reactor Blue |
| `to-observable` | `#A855F7` | Comm Purple |
| `resource` | `#EAB308` | Caution Yellow |

**Canvas drop**: `DropZoneDirective` integration for dropping nodes from the toolbox. Emits `nodeAdded` with the dropped `ReactorNodeType` and a default position.

**Wire removal**: Right-click on a wire emits `edgeRemoved` with source and target IDs.

**Keyboard shortcuts**: `s` = Simulate, `Escape` = cancel/close, `1` = signal toolbox, `2` = computed toolbox, `3` = effect toolbox.

### Reactor Core: Node Configuration Panel

`ReactorCoreNodeConfigComponent` (`app-node-config`): Type-specific node editor defined in `src/app/features/minigames/reactor-core/node-config/node-config.ts`.

Integrates with the shared `ExpressionBuilderComponent` (`nx-expression-builder`) for computed node formula editing in raw mode.

| Node type | Editor |
|-----------|--------|
| `signal` | Value type selector (string/number/boolean) + type-appropriate input (text, number, or checkbox) |
| `computed` | Expression builder (raw mode) + dependency checkbox list |
| `effect` | Action description textarea + cleanup toggle checkbox + dependency checkbox list |

Uses an `effect()` with `allowSignalWrites: true` to sync 6 internal editing signals from the input node. On "Apply", emits the edited node via `nodeConfigured` output. On "Cancel", emits `cancelled`.

### Reactor Core: Visual Style

- **Color scheme**: Dark grid background with glowing colored nodes (blue for signals, green for computed, orange for effects)
- **Bezier wires**: Smooth curves color-coded by source node type, matching the node colors above
- **Simulation animation**: 2-second animation period (`SIMULATION_ANIMATION_MS = 2000`) during which the `simulating` signal is true, enabling visual propagation effects in the template

---

## 11. Replay Mode Engine Integration

Three replay mode pages -- `EndlessModePage`, `SpeedRunPage`, and `DailyChallengePage` -- reuse the minigame engine framework (Section 2) but bypass the campaign-oriented `LevelLoaderService` and `LevelCompletionService` pipeline used by `MinigamePlayPage`. This section documents the shared integration pattern, the differences between modes, and the key anti-patterns to avoid.

### 11.1 Shared Pattern

All four play pages (`MinigamePlayPage` plus the three replay modes) follow the same core engine lifecycle:

1. Get engine factory from `MinigameRegistryService.getEngineFactory(gameId)`
2. Create engine instance via `factory()`
3. Build or load a `MinigameLevel<unknown>` (source differs per mode -- see comparison table)
4. Call `engine.initialize(level)` then `engine.setPlayMode(mode)` then `engine.start()`
5. Render via `NgComponentOutlet` with a child `Injector` providing `MINIGAME_ENGINE`
6. Watch `engine.status()` via `effect()` for Won/Lost transitions
7. Cleanup via `DestroyRef.onDestroy()` -- null engine signal, call `engine.destroy()`

**Critical sequencing rule**: `initialize()` resets `_playMode` to `PlayMode.Story` (see `minigame-engine.ts` line 117). The `setPlayMode()` method can only be called during `Loading` status (i.e., after `initialize()` but before `start()`). This means the initialization sequence is strictly forward-only: `initialize()` -> `setPlayMode()` -> `start()`. There is no way to change play mode after `start()` has been called.

### 11.2 The `engine.reset()` Anti-Pattern

`MinigameEngine.reset()` calls `initialize()` followed by `start()`, skipping `setPlayMode()`. Because `initialize()` resets `_playMode` to `PlayMode.Story`, calling `reset()` from a replay mode page silently reverts the engine to story mode. `MinigamePlayPage` can safely use `reset()` because it always runs in `PlayMode.Story`.

Replay mode pages must instead explicitly re-initialize:

```typescript
// WRONG -- reverts to PlayMode.Story:
eng.reset();

// CORRECT -- preserves the intended play mode:
eng.initialize(level);
eng.setPlayMode(PlayMode.Endless); // or SpeedRun, DailyChallenge
eng.start();
```

All three replay mode pages follow this explicit pattern in their restart/retry handlers.

### 11.3 Comparison Table

| Aspect | MinigamePlayPage | EndlessModePage | SpeedRunPage | DailyChallengePage |
|--------|-----------------|-----------------|--------------|-------------------|
| PlayMode | `Story` | `Endless` | `SpeedRun` | `DailyChallenge` |
| Level source | `LevelLoaderService` (static data files) | `EndlessModeService.generateLevel()` (procedural) | `SpeedRunService.generateSpeedRunLevel()` (procedural) | Inline `MinigameLevel` constructed from `DailyChallengeService.todaysChallenge` signal |
| Level cycling | None (single level) | Infinite (round-based) | Fixed count from `SPEED_RUN_CONFIG` | None (single challenge) |
| Session service | None (stateless) | `EndlessModeService` | `SpeedRunService` | `DailyChallengeService` |
| Win behavior | `LevelCompletionService` pipeline (XP, mastery, progression) | `nextRound()` -> generate next level -> re-initialize engine | `completeLevel()` -> check if all levels done -> next or end | `completeChallenge()` -> post-game view |
| Loss behavior | Shell shows level-failed overlay | Partial score accounting via `nextRound(partialScore)`, then `endSession()` -> post-game summary | `endRun()` -> post-game results (no partial credit) | Shell shows retry/quit overlay; player can retry unlimited times |
| Scoring | XP pipeline with diminishing returns, streak bonus | Cumulative score across rounds, high score persistence | Time-based (`liveElapsedTime` vs par), best time persistence | Single-level score, bonus XP |
| View states | not-found, not-ready, locked, loading, error, ready | pre-game, in-game, post-game (writable signal) | error, pre-run, in-run, post-run (computed signal, not writable) | pre-game, in-game, post-game, completed (writable signal) |
| `engineInjector` when null | Returns `parentInjector` (shell renders without engine) | Returns `null` | Returns `null` | Returns `null` |
| Source file | `src/app/pages/minigame-play/minigame-play.ts` | `src/app/pages/endless-mode/endless-mode.ts` | `src/app/pages/speed-run/speed-run.ts` | `src/app/pages/daily-challenge/daily-challenge.ts` |

### 11.4 Engine Status Effect Pattern

All three replay mode pages use the same reactive pattern for detecting round/level outcomes:

```typescript
effect(() => {
  const eng = this.engine();
  if (!eng) return;
  const status = eng.status();
  untracked(() => {
    if (status === MinigameStatus.Won) { this.onRoundWon(); }
    else if (status === MinigameStatus.Lost) { this.onRoundLost(); }
  });
});
```

Key design decision: the engine signal is set to `null` BEFORE updating view state or post-game data. This prevents the effect from re-triggering during teardown, since setting post-game signals could cause Angular to re-evaluate the effect, which would then re-read `engine()` and potentially act on a stale status.

### 11.5 Injector Pattern

All replay mode pages create a child `Injector` to provide the engine instance to the game UI component rendered via `NgComponentOutlet`:

```typescript
readonly engineInjector = computed(() => {
  const eng = this.engine();
  if (!eng) return null;
  return Injector.create({
    providers: [{ provide: MINIGAME_ENGINE, useValue: eng }],
    parent: this.parentInjector,
  });
});
```

This differs from `MinigamePlayPage`, which returns `this.parentInjector` (not `null`) when no engine exists. The reason: `MinigamePlayPage` has a `ready` view state that renders the shell even before the engine loads, so the injector must always be valid. Replay mode pages guard their templates with `@if (engine() && resolvedComponent())`, so a `null` injector is safe.

### 11.6 EndlessModePage

- **Service**: `EndlessModeService` (`src/app/core/minigame/endless-mode.service.ts`)
- **Session type**: `EndlessSession` -- fields: `gameId`, `currentRound`, `score`, `difficultyLevel`, `isActive`
- **Level generation**: `generateLevel(gameId, round)` returns `MinigameLevel<EndlessLevelData>` with procedural difficulty params. `EndlessLevelData` nests difficulty under `data.difficulty`, which contains `speed` (multiplier, 1.0 = normal), `complexity` (multiplier, 1.0 = basic), and `count` (integer, items per round). All three scale logarithmically with round number
- **Round cycling**: on Won -> capture `engine.score()` BEFORE re-initialize (because `initialize()` resets `_score` to 0) -> `nextRound(roundScore)` -> generate next level -> re-initialize with explicit `setPlayMode(PlayMode.Endless)`
- **Loss behavior**: includes partial score from the failed round. Calls `nextRound(partialScore)` to account for partial progress, then `endSession()`. Shows post-game summary with `finalScore`, `roundsSurvived`, `isNewHighScore`
- **Persistence**: high score per game stored at `endless-high-score:{gameId}` via `StatePersistenceService`

### 11.7 SpeedRunPage

- **Service**: `SpeedRunService` (`src/app/core/minigame/speed-run.service.ts`)
- **Session type**: `SpeedRunSession` -- fields: `gameId`, `startTime`, `elapsedTime`, `parTime`, `levelsCompleted`, `totalLevels`, `isActive`, `splitTimes`
- **Level config**: `SPEED_RUN_CONFIG` constant defines `parTime` (seconds) and `totalLevels` per minigame
- **Level generation**: `generateSpeedRunLevel(gameId, levelIndex)` returns `MinigameLevel<SpeedRunLevelData>` where `SpeedRunLevelData` contains `levelIndex` and `totalLevels`
- **Level cycling**: on Won -> `completeLevel()` records split time -> check `levelsCompleted >= totalLevels` -> load next level or end run
- **Timer**: `session.elapsedTime` is a snapshot updated only at `completeLevel()` and `endRun()` boundaries. It is NOT a live timer. For live display, the page runs a `requestAnimationFrame` loop that updates the `liveElapsedTime` writable signal via `(Date.now() - session.startTime) / 1000`
- **Timer colors**: under par = green (`--nx-color-sensor-green`), near par >= 80% = orange (`--nx-color-alert-orange`), over par = red (`--nx-color-emergency-red`)
- **`viewState` is computed**: unlike `EndlessModePage` and `DailyChallengePage` which use writable signals, `SpeedRunPage.viewState` is a `computed<ViewState>` derived from `isValidGame()` and `session()` state. This means view transitions are fully reactive rather than imperative
- **Loss behavior**: ends run immediately via `endRun()`, no partial credit. Shows post-game results with `finalTime`, `isNewBestTime`, `underPar`
- **Persistence**: best time per game stored at `speed-run-best-time:{gameId}` via `StatePersistenceService`

### 11.8 DailyChallengePage

- **Service**: `DailyChallengeService` (`src/app/core/progression/daily-challenge.service.ts`)
- **No session object**: uses the `todaysChallenge` signal directly from `DailyChallengeService`. The challenge is generated deterministically from a date hash at construction time
- **Level construction**: builds `MinigameLevel` inline from challenge data (`gameId`, `levelId`, `date`), using `DifficultyTier.Basic` and empty `data: {}`
- **Single play**: no level cycling, one challenge per day
- **Streak integration**: displays `activeStreakDays` and `streakMultiplier` from `StreakService` (not `DailyChallengeService`). `DailyChallengeService.completeChallenge()` calls `StreakService.recordDailyPlay()` internally, but the display fields are read directly from `StreakService`
- **View states**: 4 states (`pre-game`, `in-game`, `post-game`, `completed`). The `completed` state shows a countdown to next midnight via `secondsUntilMidnight()` updated by a 1-second `setInterval`
- **Loss behavior**: does NOT end the challenge or transition view state. The `MinigameShellComponent` shows its built-in level-failed overlay with retry/quit options. Player can retry unlimited times
- **Persistence**: completion date stored at `daily-challenge` via `StatePersistenceService`
