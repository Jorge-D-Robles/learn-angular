# Backlog

## P0 -- Setup & Design

### T-2026-003
- Title: Configure Prettier for code formatting
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P0
- Depends: T-2026-002
- Blocked-by: —
- Tags: tooling, formatting, code-quality
- Refs: docs/overview.md

Add Prettier with Angular-compatible configuration and ensure it does not conflict with ESLint.

Acceptance criteria:
- [ ] `.prettierrc` config file exists with settings (singleQuote: true, printWidth: 100, trailingComma: all)
- [ ] `npx prettier --check .` passes on the scaffolded code (or code is formatted to pass)
- [ ] ESLint and Prettier do not produce conflicting rules (use `eslint-config-prettier` or equivalent)
- [ ] `.prettierignore` excludes `dist/`, `node_modules/`, `refs/`

### T-2026-005
- Title: Set up Playwright for end-to-end testing
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P0
- Depends: T-2026-001
- Blocked-by: —
- Tags: testing, tooling, e2e, playwright
- Refs: docs/overview.md

Add Playwright for end-to-end testing with a basic smoke test.

Acceptance criteria:
- [ ] Playwright is installed and configured (`playwright.config.ts` exists)
- [ ] A basic smoke test exists that navigates to `/` and verifies the page loads
- [ ] `npx playwright test` runs and passes the smoke test
- [ ] Playwright test directory is at `e2e/`

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

### T-2026-007
- Title: Define design tokens as SCSS variables and CSS custom properties
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: M
- Milestone: P0
- Depends: T-2026-001
- Blocked-by: —
- Tags: styles, design-tokens, theming
- Refs: docs/ux/visual-style.md

Create the design token system based on the visual style guide. All colors, typography, spacing, and animation values should be defined as CSS custom properties for runtime theming, with SCSS variables for compile-time usage.

Acceptance criteria:
- [ ] `src/styles/_tokens.scss` defines all color tokens from the visual style guide (Void, Hull, Bulkhead, Corridor, Display, Beacon, and all accent colors)
- [ ] Mastery glow colors are defined (0-5 stars)
- [ ] Typography scale is defined (page title through code, with font stacks)
- [ ] Spacing scale is defined (4px grid: 4, 8, 12, 16, 24, 32, 48, 64)
- [ ] Animation timing tokens are defined (150-250ms UI, 300-500ms game, ease-out/ease-in)
- [ ] All tokens are also exposed as CSS custom properties on `:root`
- [ ] `src/styles/styles.scss` imports the tokens file

### T-2026-008
- Title: Create global base styles and CSS reset
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P0
- Depends: T-2026-007
- Blocked-by: —
- Tags: styles, css, global
- Refs: docs/ux/visual-style.md

Set up global styles using the design tokens: CSS reset, base typography, and foundational styles.

Acceptance criteria:
- [ ] CSS reset applied (box-sizing border-box, margin/padding reset)
- [ ] Body uses Void background color and Display text color from tokens
- [ ] Font stacks from visual style guide are applied (system sans-serif for body, monospace for code)
- [ ] `prefers-reduced-motion` media query is set up for animation preferences
- [ ] Global styles file is clean and well-organized with comments

### T-2026-009
- Title: Create app shell layout component with top bar
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: M
- Milestone: P0
- Depends: T-2026-007, T-2026-008
- Blocked-by: —
- Tags: layout, shell, component, ui
- Refs: docs/ux/navigation.md, docs/ux/visual-style.md

Create the root app shell layout with a top bar and main content area. The top bar should contain placeholder slots for: logo/home link, rank badge, XP bar, and settings icon. The main content area holds `<router-outlet>`.

Acceptance criteria:
- [ ] `AppComponent` renders a top bar and a `<router-outlet>` content area
- [ ] Top bar has placeholder elements for: logo, rank badge, XP bar, settings icon
- [ ] Top bar uses design tokens for colors and spacing
- [ ] Layout uses CSS Grid or Flexbox for structure
- [ ] Component has unit tests verifying the shell renders with router outlet
- [ ] Responsive: top bar content adjusts for mobile (< 768px)

### T-2026-010
- Title: Add side navigation for desktop layout
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P0
- Depends: T-2026-009
- Blocked-by: —
- Tags: navigation, layout, component, ui
- Refs: docs/ux/navigation.md

Add a side navigation panel for desktop (> 1024px) with links: Dashboard, Current Mission, Minigames, Profile. Uses `routerLink` directives and `routerLinkActive` for active state.

Acceptance criteria:
- [ ] `SideNavComponent` renders four navigation links (Dashboard, Current Mission, Minigames, Profile)
- [ ] Navigation links use `routerLink` and `routerLinkActive`
- [ ] Side nav is visible only on desktop (> 1024px), hidden on tablet and mobile
- [ ] Active link is visually highlighted using accent color from design tokens
- [ ] Side nav uses Hull background color with Bulkhead border
- [ ] Unit tests verify links render and active state logic

### T-2026-011
- Title: Add bottom navigation for mobile layout
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P0
- Depends: T-2026-009
- Blocked-by: —
- Tags: navigation, layout, component, ui, mobile
- Refs: docs/ux/navigation.md

Add a bottom navigation bar for mobile (< 768px) with four tabs: Dashboard, Mission, Games, Profile. Mirrors the side nav links.

Acceptance criteria:
- [ ] `BottomNavComponent` renders four tab items with icons and labels
- [ ] Navigation uses `routerLink` and `routerLinkActive`
- [ ] Bottom nav is visible only on mobile (< 768px), hidden on tablet and desktop
- [ ] Uses fixed positioning at the bottom of the viewport
- [ ] Active tab is highlighted with accent color
- [ ] Unit tests verify tab items render correctly

### T-2026-012
- Title: Configure application routing with lazy-loaded route stubs
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: M
- Milestone: P0
- Depends: T-2026-001
- Blocked-by: —
- Tags: routing, angular, setup
- Refs: docs/ux/navigation.md

Set up the top-level route configuration with lazy-loaded route stubs for all primary screens. Each route loads a placeholder component.

Acceptance criteria:
- [ ] Routes are defined in `app.routes.ts` matching the navigation spec:
  - `/` -- Dashboard (eager)
  - `/mission/:chapterId` -- Story Mission (lazy)
  - `/minigames` -- Minigame Hub (lazy)
  - `/minigames/:gameId` -- Level Select (lazy)
  - `/minigames/:gameId/level/:levelId` -- Minigame Play (lazy)
  - `/profile` -- Profile (lazy)
  - `/settings` -- Settings (lazy)
  - `**` -- Not Found / Hull Breach page (eager)
- [ ] Lazy routes use `loadComponent` or `loadChildren`
- [ ] Each route has a placeholder component that renders the route name
- [ ] Wildcard route displays a "Hull Breach" (404) page
- [ ] Unit tests verify route configuration (route count, paths, lazy loading)

### T-2026-013
- Title: Create placeholder page components for all routes
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P0
- Depends: T-2026-012
- Blocked-by: —
- Tags: components, routing, placeholder
- Refs: docs/ux/navigation.md

Create minimal placeholder components for each route so navigation works end-to-end. Each component displays its name and route parameters.

Acceptance criteria:
- [ ] Placeholder components exist for: DashboardPage, MissionPage, MinigameHubPage, LevelSelectPage, MinigamePlayPage, ProfilePage, SettingsPage, NotFoundPage
- [ ] Each component displays its name as a heading (e.g., "Station Dashboard")
- [ ] Route parameter components (MissionPage, LevelSelectPage, MinigamePlayPage) display their route params
- [ ] NotFoundPage displays a "Hull Breach - Section Not Found" message
- [ ] All components have basic unit tests

### T-2026-014
- Title: Create shared UI component library barrel exports
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P0
- Depends: T-2026-001
- Blocked-by: —
- Tags: architecture, shared, components
- Refs: docs/ux/visual-style.md

Set up the shared component directory structure with barrel exports for future UI components (buttons, cards, badges, progress bars, etc.).

Acceptance criteria:
- [ ] Directory structure: `src/app/shared/components/`, `src/app/shared/pipes/`, `src/app/shared/directives/`
- [ ] Each subdirectory has an `index.ts` barrel export file
- [ ] `src/app/shared/index.ts` re-exports from all subdirectories
- [ ] A sample shared component exists (e.g., `StationCardComponent`) using design tokens to verify the pattern works
- [ ] Unit test for the sample component passes

### T-2026-015
- Title: Set up state management foundation with Angular signals
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: M
- Milestone: P0
- Depends: T-2026-001
- Blocked-by: —
- Tags: state-management, signals, architecture
- Refs: docs/overview.md, docs/progression.md, docs/architecture.md

Establish the state management pattern for the app using Angular signals. Define the core state service pattern and a simple proof-of-concept.

Acceptance criteria:
- [ ] `GameStateService` exists as a root-provided injectable service
- [ ] Uses Angular `signal()` and `computed()` for reactive state
- [ ] Holds a minimal state shape: `{ playerName: string, currentRank: string, totalXp: number }`
- [ ] Exposes read-only signals (using `computed()` or `signal.asReadonly()`)
- [ ] Exposes methods to mutate state (e.g., `addXp(amount: number)`)
- [ ] Unit tests verify state initialization, mutation, and computed signal reactivity
- [ ] Service pattern is documented in a code comment for future services to follow

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
