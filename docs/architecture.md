# Technical Architecture

This document describes the Learn Angular codebase as built during P1 (Core Engine). Every claim is traceable to actual source files. Last updated after completion of 128 P1 tickets.

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
