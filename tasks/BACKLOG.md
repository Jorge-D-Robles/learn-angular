# Backlog

## P0 -- Setup & Design

### T-2026-006
- Title: Configure CI pipeline with GitHub Actions
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: M
- Milestone: P0
- Depends: T-2026-002, T-2026-004, T-2026-005
- Blocked-by: —
- Tags: ci, github-actions, tooling
- Refs: docs/overview.md

Create a GitHub Actions workflow that runs on PRs and pushes to main.

Acceptance criteria:
- [ ] `.github/workflows/ci.yml` exists
- [ ] CI runs: lint, unit tests, build (in parallel where possible)
- [ ] CI runs on `push` to `main` and on `pull_request`
- [ ] CI uses Node.js LTS version
- [ ] CI caches `node_modules` for faster runs
- [ ] Workflow badge can be added to README (URL is valid)

### T-2026-037
- Title: Investigate Angular 21 Vite dev server routing bug
- Status: todo
- Assigned: human
- Priority: medium
- Size: S
- Milestone: P0
- Depends: —
- Blocked-by: —
- Tags: bug, investigation, angular, vite, routing
- Refs: playwright.config.ts

Angular 21's Vite-based dev server (`ng serve` in development mode) has a bug where the Router's `ROUTES` multi-provider is not populated — `router.config` is an empty array at runtime, causing no route components to render. The production build and `ng serve --configuration production` both work correctly. This is an Angular 21 / Vite dev server regression, not a project configuration issue.

Current workaround: e2e tests use `ng serve --configuration production` in `playwright.config.ts`.

Acceptance criteria:
- [ ] Root cause identified (Angular issue tracker link if available)
- [ ] Determine if this is a known Angular 21 bug or a project config issue
- [ ] If fixable: apply fix and update playwright.config.ts to use plain `ng serve`
- [ ] If not fixable: document the workaround and link to the upstream issue

---

## P1 -- Core Engine

### T-2026-016
- Title: Define minigame lifecycle interfaces and types
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: M
- Milestone: P1
- Depends: T-2026-001
- Blocked-by: —
- Tags: minigame-framework, types, architecture
- Refs: docs/overview.md, docs/minigames/TEMPLATE.md, docs/minigames/01-module-assembly.md

Define the TypeScript interfaces and types for the minigame framework. These are the contracts that all 12 minigames will implement.

Acceptance criteria:
- [ ] `MinigameConfig` interface: id, name, description, angularTopic, totalLevels, difficultyTiers
- [ ] `MinigameLevel` interface: id, gameId, tier (basic/intermediate/advanced/boss), conceptIntroduced, description, data (generic)
- [ ] `MinigameState` interface: currentLevel, score, lives, timeRemaining, status (playing/paused/won/lost)
- [ ] `MinigameResult` interface: levelId, score, perfect (boolean), timeElapsed, xpEarned
- [ ] `DifficultyTier` enum: Basic, Intermediate, Advanced, Boss
- [ ] `MinigameStatus` enum: Loading, Playing, Paused, Won, Lost
- [ ] All types are exported from `src/app/core/minigame/minigame.types.ts`
- [ ] Types are well-documented with JSDoc comments

### T-2026-017
- Title: Create abstract MinigameEngine base class
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: M
- Milestone: P1
- Depends: T-2026-016
- Blocked-by: —
- Tags: minigame-framework, architecture, engine
- Refs: docs/overview.md, docs/minigames/TEMPLATE.md

Create the abstract base class that all minigame engines extend. This provides the lifecycle hooks, state management, and scoring logic that every minigame shares.

Acceptance criteria:
- [ ] Abstract class `MinigameEngine<TLevelData>` exists at `src/app/core/minigame/minigame-engine.ts`
- [ ] Manages `MinigameState` via signals (score, lives, status, timeRemaining)
- [ ] Lifecycle methods: `initialize(level)`, `start()`, `pause()`, `resume()`, `complete()`, `fail()`
- [ ] Abstract methods subclasses must implement: `onLevelLoad(data: TLevelData)`, `onStart()`, `onComplete()`, `validateAction(action)`
- [ ] `submitAction(action)` method that calls `validateAction`, updates score, and emits result
- [ ] Timer management: optional countdown timer with configurable duration
- [ ] Exposes read-only signals for UI binding: `score()`, `lives()`, `status()`, `timeRemaining()`
- [ ] Unit tests verify lifecycle transitions (initialize -> start -> complete, initialize -> start -> fail)

### T-2026-018
- Title: Create MinigameShell container component
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: M
- Milestone: P1
- Depends: T-2026-017
- Blocked-by: —
- Tags: minigame-framework, component, ui
- Refs: docs/ux/navigation.md, docs/ux/visual-style.md, docs/minigames/TEMPLATE.md

Create the shared container component that wraps all minigames. Provides the common UI chrome: score display, timer, lives indicator, pause menu, and level completion overlay.

Acceptance criteria:
- [ ] `MinigameShellComponent` at `src/app/core/minigame/minigame-shell/`
- [ ] Displays: score (Solar Gold), timer (color transitions: green -> orange -> red), lives (heart/shield icons)
- [ ] Pause button that overlays a pause menu (Resume, Quit)
- [ ] Content projection slot (`<ng-content>`) for the game-specific UI
- [ ] Level completion overlay: shows score, XP earned, star rating, Next Level / Replay buttons
- [ ] Level failure overlay: shows score, Retry / Quit buttons
- [ ] Uses design tokens for all styling
- [ ] Unit tests for score display updates, timer color transitions, and overlay visibility states

### T-2026-019
- Title: Define level data model and type-safe level schema
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: S
- Milestone: P1
- Depends: T-2026-016
- Blocked-by: —
- Tags: levels, data-model, types
- Refs: docs/curriculum.md, docs/minigames/01-module-assembly.md, docs/minigames/02-wire-protocol.md

Define the level data schema that all minigame levels use. Each minigame has game-specific level data, but the wrapper structure is shared.

Acceptance criteria:
- [ ] `LevelDefinition<T>` interface: levelId, gameId, tier, order, title, conceptIntroduced, description, parTime (optional), data: T
- [ ] `LevelPack` interface: gameId, levels: LevelDefinition<unknown>[]
- [ ] `LevelTierConfig` interface: tier, xpReward, unlockRequirement
- [ ] XP reward constants per tier: Basic=15, Intermediate=20, Advanced=30, Boss=150
- [ ] Perfect score multiplier constant: 2x
- [ ] Types exported from `src/app/core/levels/level.types.ts`
- [ ] Unit tests verify type compatibility (compile-time check via test file)

### T-2026-020
- Title: Create LevelProgressionService for tracking level completion
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: M
- Milestone: P1
- Depends: T-2026-019, T-2026-015
- Blocked-by: —
- Tags: levels, progression, service
- Refs: docs/progression.md, docs/curriculum.md

Service that tracks which levels have been completed, best scores, and star ratings per level. Determines level unlock status based on tier progression rules.

Acceptance criteria:
- [ ] `LevelProgressionService` at `src/app/core/levels/level-progression.service.ts`
- [ ] Tracks per-level: completed (boolean), bestScore (number), perfect (boolean), attempts (number)
- [ ] `isLevelUnlocked(levelId)`: returns true if all prerequisite levels in the tier are complete
- [ ] `completeLevel(result: MinigameResult)`: records completion, updates best score if improved
- [ ] `getLevelProgress(gameId)`: returns progress for all levels in a minigame
- [ ] `getTierProgress(gameId, tier)`: returns completion percentage for a tier
- [ ] State stored via signals, integrates with `GameStateService`
- [ ] Unit tests for: unlock logic, best score tracking, tier progression

### T-2026-021
- Title: Create XpService for XP calculation and rank tracking
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: M
- Milestone: P1
- Depends: T-2026-015, T-2026-019
- Blocked-by: —
- Tags: progression, xp, ranks, service
- Refs: docs/progression.md

Service that calculates XP rewards, tracks total XP, and determines the player's current rank based on XP thresholds.

Acceptance criteria:
- [ ] `XpService` at `src/app/core/progression/xp.service.ts`
- [ ] `calculateLevelXp(tier, perfect)`: returns XP for a level completion (15/20/30/150 base, 2x if perfect)
- [ ] `calculateStoryXp()`: returns 50 XP for story mission completion
- [ ] `addXp(amount)`: adds XP to total, updates rank if threshold crossed
- [ ] `currentRank` computed signal: derived from totalXp using rank thresholds table
- [ ] `xpToNextRank` computed signal: XP remaining until next rank
- [ ] `rankProgress` computed signal: percentage progress toward next rank (0-100)
- [ ] Rank thresholds match docs/progression.md: Cadet(0), Ensign(500), Lieutenant(1500), Commander(3500), Captain(6500), Admiral(10000), Station Commander(15000), Fleet Admiral(25000)
- [ ] Unit tests for: XP calculation per tier, perfect score multiplier, rank transitions at each threshold

### T-2026-022
- Title: Create MasteryService for topic mastery tracking (0-5 stars)
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: M
- Milestone: P1
- Depends: T-2026-015, T-2026-020
- Blocked-by: —
- Tags: progression, mastery, service
- Refs: docs/progression.md

Service that tracks mastery stars (0-5) per Angular topic. Mastery increases as players complete story missions and minigame levels.

Acceptance criteria:
- [ ] `MasteryService` at `src/app/core/progression/mastery.service.ts`
- [ ] Tracks mastery per topic (using topic/chapter ID as key): 0-5 stars
- [ ] Star thresholds match docs/progression.md:
  - 0: Not started
  - 1: Story mission completed
  - 2: Basic minigame levels completed
  - 3: Advanced minigame levels completed
  - 4: Boss level completed
  - 5: All levels perfected (perfect score on every level)
- [ ] `getMastery(topicId)`: returns current star count (0-5)
- [ ] `updateMastery(topicId)`: recalculates mastery based on level progress data
- [ ] `getAllMastery()`: returns a map of all topic mastery ratings
- [ ] Integrates with `LevelProgressionService` to read completion data
- [ ] Unit tests for each star threshold transition

### T-2026-023
- Title: Create SpacedRepetitionService for mastery degradation
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: M
- Milestone: P1
- Depends: T-2026-022
- Blocked-by: —
- Tags: progression, spaced-repetition, service
- Refs: docs/progression.md

Service that implements the spaced repetition degradation rules. Topics lose mastery stars over time without practice.

Acceptance criteria:
- [ ] `SpacedRepetitionService` at `src/app/core/progression/spaced-repetition.service.ts`
- [ ] Tracks `lastPracticed` timestamp per topic
- [ ] Degradation starts after 7 days without practice
- [ ] Full degradation (1 star lost) at 14 days
- [ ] Maximum degradation: 2 stars (5-star topic bottoms at 3 stars)
- [ ] `getDegradingTopics()`: returns topics that are currently degrading or have degraded
- [ ] `recordPractice(topicId)`: updates lastPracticed to now, restoring any degradation in progress
- [ ] `getEffectiveMastery(topicId)`: returns mastery adjusted for degradation
- [ ] Unit tests with mocked dates to verify: no degradation before 7 days, partial at 7-14 days, full at 14+ days, cap at 2 stars lost

### T-2026-024
- Title: Create StatePersistenceService for localStorage save/load
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: M
- Milestone: P1
- Depends: T-2026-015
- Blocked-by: —
- Tags: persistence, localStorage, service
- Refs: docs/progression.md, docs/overview.md

Service that persists game state to localStorage and restores it on app startup. All progression data must survive page refreshes.

Acceptance criteria:
- [ ] `StatePersistenceService` at `src/app/core/persistence/state-persistence.service.ts`
- [ ] `save(key, data)`: serializes and stores data in localStorage with a namespaced key (`nexus-station:${key}`)
- [ ] `load<T>(key)`: deserializes and returns data, or null if not found
- [ ] `clear(key)`: removes a specific key
- [ ] `clearAll()`: removes all `nexus-station:*` keys (for reset progress feature)
- [ ] Handles serialization errors gracefully (corrupted data returns null, logs warning)
- [ ] Auto-save: provides an `effect()` that watches a signal and saves on change
- [ ] `exportState()`: returns all game state as a JSON string (for backup)
- [ ] `importState(json)`: restores game state from a JSON string
- [ ] Unit tests with mocked localStorage: save/load roundtrip, corrupted data handling, clear operations

### T-2026-025
- Title: Integrate persistence with GameStateService auto-save
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: S
- Milestone: P1
- Depends: T-2026-024, T-2026-015
- Blocked-by: —
- Tags: persistence, state-management, integration
- Refs: docs/progression.md

Wire up `StatePersistenceService` to `GameStateService` so state is automatically saved when it changes and restored on app startup.

Acceptance criteria:
- [ ] `GameStateService` loads saved state from localStorage on initialization
- [ ] State is auto-saved when any state signal changes (using `effect()`)
- [ ] Debounce saves to avoid excessive writes (at most once per 500ms)
- [ ] If no saved state exists, initializes with defaults (Cadet rank, 0 XP)
- [ ] Unit tests verify: load on init, auto-save on mutation, debounce behavior

### T-2026-026
- Title: Create GameProgressionService for mission/content unlocking
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: M
- Milestone: P1
- Depends: T-2026-020, T-2026-021, T-2026-022
- Blocked-by: —
- Tags: progression, game-state, unlocking, service
- Refs: docs/curriculum.md, docs/overview.md, docs/progression.md

Service that manages the game progression flow: which story missions are available, which minigames are unlocked, and the overall campaign state.

Acceptance criteria:
- [ ] `GameProgressionService` at `src/app/core/progression/game-progression.service.ts`
- [ ] `currentMission` signal: the next uncompleted story mission chapter
- [ ] `isMissionAvailable(chapterId)`: checks if prerequisites (Deps column from curriculum.md) are met
- [ ] `isMinigameUnlocked(gameId)`: true if the corresponding story mission has been completed
- [ ] `completeMission(chapterId)`: marks mission complete, awards story XP, unlocks corresponding minigame, updates mastery
- [ ] `getUnlockedMinigames()`: returns list of unlocked minigame IDs
- [ ] `getCampaignProgress()`: returns { completedMissions, totalMissions, currentPhase }
- [ ] Prerequisite chain follows curriculum.md dependency order (Ch 1 -> Ch 2 -> ... -> Ch 34)
- [ ] Unit tests for: mission availability chain, minigame unlock on mission completion, campaign progress calculation

### T-2026-027
- Title: Create StreakService for daily login streak tracking
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P1
- Depends: T-2026-015, T-2026-024
- Blocked-by: —
- Tags: progression, streak, gamification
- Refs: docs/progression.md, docs/research/gamification-patterns.md

Service that tracks daily play streaks and calculates the XP bonus multiplier.

Acceptance criteria:
- [ ] `StreakService` at `src/app/core/progression/streak.service.ts`
- [ ] `currentStreak` signal: number of consecutive days played
- [ ] `streakMultiplier` computed signal: +10% per consecutive day, caps at +50% (5 days)
- [ ] `recordDailyPlay()`: called when player completes any activity; updates streak
- [ ] Missing a day resets the multiplier to 0% but does NOT reset the streak count display
- [ ] Streak data persisted via `StatePersistenceService`
- [ ] Unit tests with mocked dates: streak increment, multiplier calculation, cap at 50%, reset behavior

### T-2026-028
- Title: Create ScoreCalculationService for level scoring
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P1
- Depends: T-2026-016, T-2026-019
- Blocked-by: —
- Tags: scoring, minigame-framework, service
- Refs: docs/minigames/01-module-assembly.md, docs/minigames/02-wire-protocol.md, docs/progression.md

Service that calculates level scores based on time, accuracy, and combo multipliers. Different minigames can weight these factors differently.

Acceptance criteria:
- [ ] `ScoreCalculationService` at `src/app/core/minigame/score-calculation.service.ts`
- [ ] `ScoreConfig` interface: timeWeight, accuracyWeight, comboWeight, maxScore
- [ ] `calculateScore(config, timeRemaining, accuracy, combo)`: returns numeric score
- [ ] `isPerfect(score, maxScore)`: returns true if score equals max
- [ ] `getStarRating(score, maxScore)`: returns 1-3 stars based on score thresholds (e.g., 60%=1, 80%=2, 95%=3)
- [ ] Default score formula: `(timeRemaining * timeWeight) + (accuracy * accuracyWeight) + (combo * comboWeight)`
- [ ] Unit tests for: score calculation with various inputs, perfect detection, star rating thresholds

### T-2026-029
- Title: Create MinigameRegistryService for game registration and lookup
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P1
- Depends: T-2026-016
- Blocked-by: —
- Tags: minigame-framework, registry, service
- Refs: docs/overview.md, docs/curriculum.md

A registry service that maps minigame IDs to their configurations and component types. Used by the routing system to load the correct minigame.

Acceptance criteria:
- [ ] `MinigameRegistryService` at `src/app/core/minigame/minigame-registry.service.ts`
- [ ] `register(config: MinigameConfig, componentType: Type<any>)`: registers a minigame
- [ ] `getConfig(gameId)`: returns the MinigameConfig for a game
- [ ] `getComponent(gameId)`: returns the component type for dynamic loading
- [ ] `getAllGames()`: returns all registered minigame configs
- [ ] `getGamesByTopic(topic)`: filters games by Angular topic
- [ ] Pre-registers game IDs and names for all 12 minigames (components will be null until implemented)
- [ ] Unit tests for: registration, lookup, filtering

### T-2026-030
- Title: Create LevelLoaderService for loading level data
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P1
- Depends: T-2026-019, T-2026-029
- Blocked-by: —
- Tags: levels, data-loading, service
- Refs: docs/minigames/TEMPLATE.md

Service that loads level data for a given minigame and level ID. Initially loads from static JSON/TS files; designed to be swappable for server-side loading later.

Acceptance criteria:
- [ ] `LevelLoaderService` at `src/app/core/levels/level-loader.service.ts`
- [ ] `loadLevel(gameId, levelId)`: returns a `LevelDefinition` (or throws if not found)
- [ ] `loadLevelPack(gameId)`: returns all levels for a minigame
- [ ] `getLevelsByTier(gameId, tier)`: returns levels filtered by difficulty tier
- [ ] Initial implementation loads from static TypeScript files (e.g., `src/app/data/levels/`)
- [ ] Returns `Observable<LevelDefinition>` or `Promise<LevelDefinition>` for future async compatibility
- [ ] Unit tests with mock level data: load by ID, load pack, filter by tier, not-found error

### T-2026-031
- Title: Create code editor component wrapper
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: M
- Milestone: P1
- Depends: T-2026-007, T-2026-001
- Blocked-by: —
- Tags: code-editor, component, ui
- Refs: docs/overview.md, docs/ux/visual-style.md, docs/minigames/01-module-assembly.md

Create a reusable code editor/display component for minigames that require showing or editing code. Uses a lightweight approach (CodeMirror, Monaco, or a simpler custom solution with syntax highlighting).

Acceptance criteria:
- [ ] `CodeEditorComponent` at `src/app/shared/components/code-editor/`
- [ ] Input: `code` (string), `language` (string, default 'typescript'), `readonly` (boolean, default false), `highlightLines` (number[])
- [ ] Output: `codeChange` event emitted when user edits code
- [ ] Renders code with syntax highlighting (at minimum: TypeScript/HTML keywords, strings, comments)
- [ ] Supports read-only mode for story missions (display only, no editing)
- [ ] Line highlighting for drawing attention to specific code lines
- [ ] Uses monospace font from design tokens (JetBrains Mono / Fira Code / Cascadia Code)
- [ ] Dark theme matches the Void/Hull color scheme
- [ ] Unit tests for: rendering code, readonly mode, codeChange emission

### T-2026-032
- Title: Create XP notification toast component
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P1
- Depends: T-2026-007, T-2026-021
- Blocked-by: —
- Tags: ui, notification, xp, component
- Refs: docs/progression.md, docs/ux/visual-style.md

A toast/notification component that appears when the player earns XP, showing the amount and any bonuses (perfect score, streak).

Acceptance criteria:
- [ ] `XpNotificationComponent` at `src/app/shared/components/xp-notification/`
- [ ] Displays: "+{amount} XP" with optional bonus labels ("Perfect!", "Streak x3")
- [ ] Uses Solar Gold color for XP amount
- [ ] Animates in from top-right, auto-dismisses after 3 seconds
- [ ] Stacks multiple notifications if they arrive in quick succession
- [ ] Respects `prefers-reduced-motion` (instant show/hide instead of animation)
- [ ] `XpNotificationService` to trigger notifications programmatically
- [ ] Unit tests for: display, auto-dismiss, stacking behavior

### T-2026-033
- Title: Create rank-up celebration overlay component
- Status: todo
- Assigned: unassigned
- Priority: low
- Size: S
- Milestone: P1
- Depends: T-2026-021, T-2026-007
- Blocked-by: —
- Tags: ui, celebration, rank, component
- Refs: docs/progression.md, docs/ux/visual-style.md

A full-screen overlay that appears when the player reaches a new rank. Displays the new rank name, badge, and a congratulatory message.

Acceptance criteria:
- [ ] `RankUpOverlayComponent` at `src/app/shared/components/rank-up-overlay/`
- [ ] Displays: new rank name, rank badge/icon, "Promoted to {Rank}!" message
- [ ] Full-screen overlay with semi-transparent backdrop
- [ ] Dismiss button or auto-dismiss after 5 seconds
- [ ] Respects `prefers-reduced-motion`
- [ ] Unit tests for: rendering rank info, dismiss behavior

### T-2026-034
- Title: Create mastery star display component
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P1
- Depends: T-2026-007, T-2026-022
- Blocked-by: —
- Tags: ui, mastery, component
- Refs: docs/progression.md, docs/ux/visual-style.md

A reusable component that displays 0-5 mastery stars for a topic, with color-coded glow matching the mastery glow colors from the style guide.

Acceptance criteria:
- [ ] `MasteryStarsComponent` at `src/app/shared/components/mastery-stars/`
- [ ] Input: `stars` (number 0-5), `size` ('sm' | 'md' | 'lg')
- [ ] Renders 5 star icons, filled/empty based on `stars` count
- [ ] Glow color matches mastery glow colors: 0=none, 1=dim white, 2=Reactor Blue, 3=Sensor Green, 4=Solar Gold, 5=Solar Gold + pulse animation
- [ ] Accessible: aria-label describes mastery level (e.g., "3 out of 5 stars mastery")
- [ ] Unit tests for: correct fill count at each level, glow color application, aria-label

### T-2026-035
- Title: Create XP progress bar component
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P1
- Depends: T-2026-007, T-2026-021
- Blocked-by: —
- Tags: ui, xp, progress-bar, component
- Refs: docs/progression.md, docs/ux/visual-style.md, docs/ux/navigation.md

A progress bar component showing XP progress toward the next rank. Used in the top bar (compact) and profile page (full).

Acceptance criteria:
- [ ] `XpProgressBarComponent` at `src/app/shared/components/xp-progress-bar/`
- [ ] Inputs: `currentXp` (number), `nextRankXp` (number), `currentRank` (string), `variant` ('compact' | 'full')
- [ ] Compact variant: thin bar with percentage, no labels (for top bar)
- [ ] Full variant: thicker bar with current/next rank labels and XP numbers
- [ ] Bar gradient from Reactor Blue to Sensor Green (per visual style guide)
- [ ] Accessible: role="progressbar", aria-valuenow, aria-valuemin, aria-valuemax
- [ ] Unit tests for: percentage calculation, compact vs full rendering, accessibility attributes

### T-2026-038
- Title: Define curriculum data model for 34 story missions
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: S
- Milestone: P1
- Depends: T-2026-016
- Blocked-by: —
- Tags: curriculum, data-model, types
- Refs: docs/curriculum.md, docs/overview.md

Define the TypeScript data model for the 34-chapter story mission curriculum. This is the static data structure that GameProgressionService (T-2026-026) reads to determine mission availability, prerequisite chains, and minigame unlocks.

Acceptance criteria:
- [ ] `StoryMission` interface at `src/app/core/curriculum/curriculum.types.ts`: chapterId, title, angularTopic, narrative, unlocksMinigame (gameId or null), deps (chapterId[]), phase (1-6)
- [ ] `CurriculumPhase` interface: phaseNumber, name, description, chapters (StoryMission[])
- [ ] `CURRICULUM` constant at `src/app/core/curriculum/curriculum.data.ts`: all 34 chapters matching docs/curriculum.md exactly
- [ ] Each chapter's `deps` field matches the Deps column from curriculum.md
- [ ] Each chapter's `unlocksMinigame` maps to the correct minigame ID (or null for Ch 9, 10, 27, 33, 34)
- [ ] All 6 phases populated with correct chapter groupings
- [ ] Unit tests verify: total chapter count is 34, each chapter has valid deps, no circular dependencies, all minigame IDs are valid

### T-2026-039
- Title: Create SettingsService for user preferences
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P1
- Depends: T-2026-024
- Blocked-by: —
- Tags: settings, preferences, service
- Refs: docs/ux/navigation.md

Service that manages user preferences (sound, animation speed, theme, reduced motion). Persisted via StatePersistenceService.

Acceptance criteria:
- [ ] `SettingsService` at `src/app/core/settings/settings.service.ts`
- [ ] `UserSettings` interface: soundEnabled (boolean), animationSpeed ('normal' | 'fast' | 'off'), theme ('dark' | 'station'), reducedMotion (boolean)
- [ ] `settings` signal exposing current `UserSettings`
- [ ] `updateSetting(key, value)`: updates a single setting
- [ ] `resetSettings()`: restores all settings to defaults (sound on, animation normal, theme station, reducedMotion from prefers-reduced-motion)
- [ ] Settings auto-persisted via `StatePersistenceService`
- [ ] On init, loads saved settings or uses defaults
- [ ] `resetProgress()`: delegates to `StatePersistenceService.clearAll()` and reloads the app
- [ ] Unit tests for: default values, update persistence, reset behavior

### T-2026-040
- Title: Install and configure icon library
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P1
- Depends: T-2026-001
- Blocked-by: —
- Tags: icons, ui, tooling
- Refs: docs/ux/visual-style.md

Install a consistent icon library (Lucide or Phosphor as recommended by the visual style guide) and create an Angular wrapper for easy use across the app. Navigation components (side nav, bottom nav) and game UI elements all require icons.

Acceptance criteria:
- [ ] Icon library installed as a dependency (lucide-angular or phosphor-icons)
- [ ] Icons render correctly in components via a consistent API (e.g., `<lucide-icon name="home">`)
- [ ] Icon sizes match visual style guide: 16px (inline), 20px (buttons), 24px (navigation), 32px+ (decorative)
- [ ] Icons inherit color from parent element (works with design token colors)
- [ ] At least these icons are available: home, map, gamepad, user, settings, star, heart, pause, play, chevron, x-close
- [ ] Unit test verifies icon component renders without errors

### T-2026-041
- Title: Create DailyChallengeService for daily challenge rotation
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: M
- Milestone: P1
- Depends: T-2026-015, T-2026-024, T-2026-023
- Blocked-by: —
- Tags: daily-challenge, progression, gamification, service
- Refs: docs/progression.md, docs/research/gamification-patterns.md

Service that manages daily challenges -- curated minigame levels that rotate daily, encourage breadth of practice, and award bonus XP. Integrates with spaced repetition to prioritize degrading topics.

Acceptance criteria:
- [ ] `DailyChallengeService` at `src/app/core/progression/daily-challenge.service.ts`
- [ ] `DailyChallenge` interface: date (string YYYY-MM-DD), gameId, levelId, bonusXp (50), completed (boolean)
- [ ] `todaysChallenge` computed signal: returns the daily challenge for today
- [ ] `isCompleted()`: returns whether today's challenge has been completed
- [ ] `completeChallenge()`: marks today's challenge done, awards 50 bonus XP
- [ ] Challenge selection prioritizes degrading topics (from SpacedRepetitionService), falls back to random unlocked minigame
- [ ] Uses date-based seed for deterministic daily selection (same challenge for all players on same day)
- [ ] Completion state persisted via `StatePersistenceService`
- [ ] Unit tests with mocked dates: challenge generation, completion, date rollover, degrading topic priority

### T-2026-042
- Title: Wire MinigameRegistryService to router for dynamic component loading
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: S
- Milestone: P1
- Depends: T-2026-029, T-2026-018, T-2026-012
- Blocked-by: —
- Tags: minigame-framework, routing, integration
- Refs: docs/ux/navigation.md, docs/minigames/TEMPLATE.md

Create the route resolver/guard that uses MinigameRegistryService to dynamically load the correct minigame component when navigating to `/minigames/:gameId/level/:levelId`. This is the glue between the routing system and the minigame framework.

Acceptance criteria:
- [ ] Route for `/minigames/:gameId/level/:levelId` uses a component that resolves the game from the registry
- [ ] `MinigamePlayPage` reads `:gameId` and `:levelId` from route params
- [ ] Uses `MinigameRegistryService.getComponent(gameId)` to get the component type
- [ ] Renders the resolved component inside `MinigameShellComponent`
- [ ] Shows an error state if gameId is not found in the registry
- [ ] Shows a "locked" state if the minigame is not yet unlocked (via GameProgressionService)
- [ ] Unit tests for: component resolution, unknown game error, locked state display

### T-2026-043
- Title: Populate architecture.md with P1 technical decisions
- Status: todo
- Assigned: unassigned
- Priority: low
- Size: S
- Milestone: P1
- Depends: T-2026-017, T-2026-024, T-2026-026
- Blocked-by: —
- Tags: documentation, architecture
- Refs: docs/architecture.md

Populate the architecture.md design doc with the actual technical decisions made during P1 implementation. This document is currently a stub that says "will be populated during P1."

Acceptance criteria:
- [ ] Angular app structure section: directory layout, feature module organization
- [ ] Minigame framework architecture section: MinigameEngine base class, lifecycle, MinigameShell, registry pattern
- [ ] State management section: signals-based approach, GameStateService, persistence strategy
- [ ] Level/content data format section: LevelDefinition schema, level packs, static data files
- [ ] Code editor integration section: chosen library, component API
- [ ] Progression persistence section: localStorage strategy, auto-save, export/import
- [ ] Testing strategy section: unit test patterns, TDD approach, coverage goals
- [ ] Diagrams or ASCII art for key data flows (minigame lifecycle, state persistence, progression flow)

### T-2026-044
- Title: Create HintService for minigame hint system
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P1
- Depends: T-2026-017, T-2026-028
- Blocked-by: —
- Tags: minigame-framework, hints, service
- Refs: docs/research/gamification-patterns.md, docs/minigames/06-terminal-hack.md, docs/minigames/11-system-certification.md

Shared service for the hint system across all minigames. Hints provide scaffolding for stuck players but cost points, implementing the "desirable difficulty" pattern from the gamification research.

Acceptance criteria:
- [ ] `HintService` at `src/app/core/minigame/hint.service.ts`
- [ ] `HintDefinition` interface: id, text, revealedElement (optional selector/identifier for UI highlighting)
- [ ] `requestHint(levelId)`: returns next available hint for the current level, deducts score penalty
- [ ] `getHintCount(levelId)`: returns number of hints available for a level
- [ ] `getUsedHints()`: returns hints already used in the current session
- [ ] `hintPenalty` configurable per minigame (default: 25% of max score per hint)
- [ ] `hasUsedHints()`: returns boolean (used by scoring to determine perfect eligibility)
- [ ] Integrates with `MinigameEngine` to apply score deductions
- [ ] Unit tests for: hint retrieval, score penalty calculation, used hint tracking, perfect score disqualification

### T-2026-045
- Title: Create level star rating badge component
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P1
- Depends: T-2026-007, T-2026-028
- Blocked-by: —
- Tags: ui, levels, component
- Refs: docs/ux/visual-style.md, docs/ux/navigation.md

A reusable component displaying the 1-3 star rating for a completed level. Used in level select pages, completion overlays, and minigame hub cards. Different from the mastery stars component (T-2026-034) which shows 0-5 topic mastery.

Acceptance criteria:
- [ ] `LevelStarsComponent` at `src/app/shared/components/level-stars/`
- [ ] Input: `stars` (number 0-3, where 0 = not completed), `size` ('sm' | 'md' | 'lg')
- [ ] Renders 3 star icons: filled for earned, empty/outline for unearned
- [ ] 0 stars (not completed): all empty/gray
- [ ] 1 star: one filled (Corridor color), two empty
- [ ] 2 stars: two filled (Alert Orange), one empty
- [ ] 3 stars: all filled (Solar Gold)
- [ ] Accessible: aria-label (e.g., "2 out of 3 stars")
- [ ] Unit tests for: correct fill count, color per tier, accessibility label

### T-2026-046
- Title: Create difficulty tier badge component
- Status: todo
- Assigned: unassigned
- Priority: low
- Size: S
- Milestone: P1
- Depends: T-2026-007, T-2026-016
- Blocked-by: —
- Tags: ui, levels, component
- Refs: docs/ux/visual-style.md, docs/minigames/TEMPLATE.md

A small badge component that displays the difficulty tier of a level (Basic, Intermediate, Advanced, Boss). Used in level select pages and level completion overlays. Color-coded per tier.

Acceptance criteria:
- [ ] `TierBadgeComponent` at `src/app/shared/components/tier-badge/`
- [ ] Input: `tier` (DifficultyTier enum value)
- [ ] Displays tier name text with color-coded background:
  - Basic: Reactor Blue background
  - Intermediate: Alert Orange background
  - Advanced: Emergency Red background
  - Boss: Comm Purple background with glow effect
- [ ] Input: `size` ('sm' | 'md') for compact vs standard display
- [ ] Accessible: role and aria-label
- [ ] Unit tests for: correct label text per tier, correct color class per tier
