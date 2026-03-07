# Backlog

## P0 -- Setup & Design

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

### T-2026-047
- Title: Create RefresherChallengeService for mastery restoration
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P1
- Depends: T-2026-023, T-2026-030
- Blocked-by: —
- Tags: progression, spaced-repetition, refresher, service
- Refs: docs/progression.md, docs/research/gamification-patterns.md

Service that generates and manages refresher challenges -- short 3-5 question micro-levels that restore mastery stars lost to spaced repetition degradation. Progression.md specifies "Quick refreshers: 3-5 questions, restore 1 star of lost mastery" and "Format: Mix of minigame micro-levels and multiple-choice questions."

Acceptance criteria:
- [ ] `RefresherChallengeService` at `src/app/core/progression/refresher-challenge.service.ts`
- [ ] `RefresherChallenge` interface: topicId, questions (3-5), gameId, microLevelIds, restoredStars (1)
- [ ] `generateRefresher(topicId)`: creates a refresher challenge for a degrading topic
- [ ] `completeRefresher(topicId)`: restores 1 star of degraded mastery via MasteryService
- [ ] `getPendingRefreshers()`: returns list of topics with available refresher challenges (degraded topics)
- [ ] Integrates with SpacedRepetitionService to identify degrading topics
- [ ] Integrates with LevelLoaderService to pull micro-level data for the relevant minigame
- [ ] Unit tests for: refresher generation, mastery restoration, pending refresher list

### T-2026-048
- Title: Create EndlessModeService for procedural level generation
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: M
- Milestone: P1
- Depends: T-2026-017, T-2026-019, T-2026-029
- Blocked-by: —
- Tags: replay-modes, endless, minigame-framework, service
- Refs: docs/progression.md, docs/minigames/01-module-assembly.md, docs/minigames/02-wire-protocol.md

Service that manages the Endless Mode replay experience. Each minigame spec defines its own endless mode rules (e.g., Module Assembly: "Procedurally generated components of increasing complexity. New component every 30 seconds."). This service provides the shared framework: session management, difficulty scaling, high score tracking, and game-over detection.

Acceptance criteria:
- [ ] `EndlessModeService` at `src/app/core/minigame/endless-mode.service.ts`
- [ ] `EndlessSession` interface: gameId, currentRound, score, difficultyLevel, isActive
- [ ] `startSession(gameId)`: initializes a new endless session
- [ ] `nextRound()`: increments round and scales difficulty
- [ ] `endSession()`: records final score, updates high score if improved
- [ ] `getHighScore(gameId)`: returns best endless mode score for a game
- [ ] `getDifficultyParams(round)`: returns difficulty scaling parameters (speed, complexity, count)
- [ ] High scores persisted via StatePersistenceService
- [ ] Unit tests for: session lifecycle, difficulty scaling, high score tracking

### T-2026-049
- Title: Create SpeedRunService for timed challenge mode
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P1
- Depends: T-2026-017, T-2026-019, T-2026-029
- Blocked-by: —
- Tags: replay-modes, speed-run, minigame-framework, service
- Refs: docs/progression.md, docs/minigames/01-module-assembly.md, docs/minigames/05-corridor-runner.md

Service that manages Speed Run replay mode. Each minigame spec defines par times and fixed level sets for speed runs. This service tracks elapsed time, compares against par time, and records best times.

Acceptance criteria:
- [ ] `SpeedRunService` at `src/app/core/minigame/speed-run.service.ts`
- [ ] `SpeedRunSession` interface: gameId, startTime, elapsedTime, parTime, levelsCompleted, totalLevels, isActive
- [ ] `startRun(gameId)`: initializes timed session with game-specific par time and level set
- [ ] `completeLevel()`: records level completion time within the run
- [ ] `endRun()`: records final time, updates best time if improved
- [ ] `getBestTime(gameId)`: returns best speed run time for a game
- [ ] `getParTime(gameId)`: returns the par time for a game's speed run
- [ ] Best times persisted via StatePersistenceService
- [ ] Unit tests for: session start/end, time tracking, best time updates, par time comparison

### T-2026-050
- Title: Create PlayTimeService for tracking session and total play time
- Status: todo
- Assigned: unassigned
- Priority: low
- Size: S
- Milestone: P1
- Depends: T-2026-015, T-2026-024
- Blocked-by: —
- Tags: progression, stats, service
- Refs: docs/ux/navigation.md

The profile page (navigation.md) specifies "Play time stats" as an element. This service tracks total play time across sessions and per-minigame play time. Needed for the profile page and any future analytics.

Acceptance criteria:
- [ ] `PlayTimeService` at `src/app/core/progression/play-time.service.ts`
- [ ] `startSession()`: records session start timestamp
- [ ] `endSession()`: calculates session duration, adds to total
- [ ] `totalPlayTime` signal: total accumulated play time in seconds
- [ ] `getMinigamePlayTime(gameId)`: returns play time for a specific minigame
- [ ] `recordMinigameTime(gameId, duration)`: adds time to a minigame's total
- [ ] Auto-saves play time data via StatePersistenceService
- [ ] Handles page close/refresh gracefully (save on beforeunload)
- [ ] Unit tests for: session tracking, total accumulation, per-game tracking

### T-2026-051
- Title: Create AudioService for sound effect management
- Status: todo
- Assigned: unassigned
- Priority: low
- Size: S
- Milestone: P1
- Depends: T-2026-039
- Blocked-by: —
- Tags: audio, service, ui
- Refs: docs/ux/visual-style.md, docs/minigames/01-module-assembly.md, docs/minigames/04-signal-corps.md

Multiple minigame specs reference sound effects and audio feedback (correct/incorrect sounds, completion jingles). The SettingsService already tracks soundEnabled preference. This service provides a centralized API for playing sound effects that respects the sound setting.

Acceptance criteria:
- [ ] `AudioService` at `src/app/core/audio/audio.service.ts`
- [ ] `play(soundId)`: plays a named sound effect if sound is enabled
- [ ] `SoundEffect` enum: correct, incorrect, complete, fail, levelUp, rankUp, hint, click, tick
- [ ] Respects `SettingsService.settings().soundEnabled` — no-op when disabled
- [ ] Preloads sound files on initialization (lazy: only when first needed)
- [ ] Volume control (0-1 range)
- [ ] Does not block UI thread (uses Web Audio API or HTMLAudioElement)
- [ ] Unit tests for: play when enabled, no-op when disabled, volume control

### T-2026-052
- Title: Create AnimationService for shared transition utilities
- Status: todo
- Assigned: unassigned
- Priority: low
- Size: S
- Milestone: P1
- Depends: T-2026-039, T-2026-007
- Blocked-by: —
- Tags: animation, service, ui
- Refs: docs/ux/visual-style.md

Visual style guide specifies animation principles: 150-250ms for UI transitions, 300-500ms for game feedback, ease-out for entrances, ease-in for exits, and respect for prefers-reduced-motion. This service provides reusable animation utilities and Angular animation triggers that all components can use.

Acceptance criteria:
- [ ] `AnimationService` at `src/app/core/animation/animation.service.ts`
- [ ] `isReducedMotion` signal: reads from SettingsService and/or prefers-reduced-motion media query
- [ ] `ANIMATION_DURATIONS` constants: uiTransition (200ms), gameFeedback (400ms), overlay (300ms)
- [ ] Reusable Angular animation triggers at `src/app/core/animation/animations.ts`:
  - `fadeIn` / `fadeOut` (150ms ease-out / ease-in)
  - `slideInRight` / `slideOutRight` (250ms ease-out)
  - `scaleIn` (200ms ease-out, for overlays)
  - `pulse` (400ms, for game feedback)
- [ ] All animation triggers use 0ms duration when reduced motion is active
- [ ] Unit tests for: reduced motion detection, animation trigger definitions

### T-2026-053
- Title: Add replay mode routes for endless, speed run, and daily challenge
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P1
- Depends: T-2026-012, T-2026-048, T-2026-049, T-2026-041
- Blocked-by: —
- Tags: routing, replay-modes, navigation
- Refs: docs/ux/navigation.md

Navigation.md defines three replay mode routes that are not yet in the routing configuration: `/minigames/:gameId/endless`, `/minigames/:gameId/speedrun`, `/minigames/:gameId/daily`. These need placeholder page components and route entries.

Acceptance criteria:
- [ ] Route `/minigames/:gameId/endless` added to app.routes.ts with lazy-loaded EndlessModePage
- [ ] Route `/minigames/:gameId/speedrun` added to app.routes.ts with lazy-loaded SpeedRunPage
- [ ] Route `/minigames/:gameId/daily` added to app.routes.ts with lazy-loaded DailyChallengePage
- [ ] Each page component reads `:gameId` from route params and displays placeholder content
- [ ] Pages created at `src/app/pages/endless-mode/`, `src/app/pages/speed-run/`, `src/app/pages/daily-challenge/`
- [ ] Unit tests for: route resolution, gameId param reading

### T-2026-054
- Title: Create DragDropService for shared drag-and-drop mechanics
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: M
- Milestone: P1
- Depends: T-2026-007
- Blocked-by: —
- Tags: minigame-framework, drag-drop, interaction, service
- Refs: docs/minigames/01-module-assembly.md, docs/minigames/03-flow-commander.md, docs/minigames/04-signal-corps.md, docs/minigames/08-data-relay.md

Multiple minigames require drag-and-drop mechanics: Module Assembly (drag parts to slots), Flow Commander (drag gates to junctions), Signal Corps (drag wires between ports), Data Relay (drag pipes into streams), Power Grid (draw power lines). This shared service provides a reusable, accessible drag-and-drop system.

Acceptance criteria:
- [ ] `DragDropService` at `src/app/core/minigame/drag-drop.service.ts`
- [ ] `DraggableDirective` at `src/app/shared/directives/draggable.directive.ts` -- makes elements draggable
- [ ] `DropZoneDirective` at `src/app/shared/directives/drop-zone.directive.ts` -- marks valid drop targets
- [ ] Supports both mouse and touch input (pointer events)
- [ ] `onDragStart`, `onDrag`, `onDrop`, `onDragCancel` event outputs
- [ ] Drop zone validation: accepts/rejects based on configurable predicate
- [ ] Visual feedback: dragging element follows pointer, drop zones highlight on hover
- [ ] Keyboard accessible: Tab to draggable, Enter to pick up, arrow keys to move, Enter to drop
- [ ] Unit tests for: drag initiation, drop acceptance/rejection, touch support, keyboard navigation

### T-2026-055
- Title: Create LockedContentComponent for gated content display
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P1
- Depends: T-2026-007, T-2026-026
- Blocked-by: —
- Tags: ui, component, progression
- Refs: docs/ux/navigation.md, docs/ux/visual-style.md

The minigame hub (navigation.md) shows locked/unlocked state per game. Level select pages show locked levels. Story missions show locked next missions. This shared component displays a "locked" overlay with the unlock requirement.

Acceptance criteria:
- [ ] `LockedContentComponent` at `src/app/shared/components/locked-content/`
- [ ] Input: `isLocked` (boolean), `unlockMessage` (string, e.g., "Complete Mission 5 to unlock")
- [ ] When locked: displays a lock icon, dimmed content, and unlock requirement message
- [ ] When unlocked: renders ng-content transparently (no visual overlay)
- [ ] Uses design tokens: Void background with reduced opacity, Corridor text for message
- [ ] Accessible: aria-disabled when locked, unlock message as aria-label
- [ ] Unit tests for: locked display, unlocked passthrough, message rendering, accessibility attributes

### T-2026-056
- Title: Create ComboTrackerService for combo multiplier mechanics
- Status: todo
- Assigned: unassigned
- Priority: low
- Size: S
- Milestone: P1
- Depends: T-2026-017, T-2026-028
- Blocked-by: —
- Tags: minigame-framework, scoring, combo, service
- Refs: docs/minigames/01-module-assembly.md, docs/minigames/02-wire-protocol.md

Multiple minigames use combo multipliers for scoring (Module Assembly: "combo multiplier for consecutive correct placements", Wire Protocol mentions consecutive correct wires). This service provides shared combo tracking mechanics that integrate with ScoreCalculationService.

Acceptance criteria:
- [ ] `ComboTrackerService` at `src/app/core/minigame/combo-tracker.service.ts`
- [ ] `currentCombo` signal: current consecutive correct actions count
- [ ] `comboMultiplier` computed signal: derived from currentCombo (e.g., 1x at 0, 1.5x at 3, 2x at 5, 3x at 10)
- [ ] `recordCorrect()`: increments combo counter
- [ ] `recordIncorrect()`: resets combo to 0
- [ ] `reset()`: resets combo state for new level
- [ ] `maxCombo` signal: highest combo achieved in current session
- [ ] Unit tests for: increment, reset on incorrect, multiplier thresholds, max tracking

### T-2026-057
- Title: Create ConfirmDialogComponent for destructive actions
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P1
- Depends: T-2026-007
- Blocked-by: —
- Tags: ui, component, shared
- Refs: docs/ux/navigation.md

The settings page specifies "Reset progress (with confirmation)" and the minigame shell has a "Quit" action in the pause menu that should confirm before abandoning a level. This shared dialog component handles destructive action confirmations.

Acceptance criteria:
- [ ] `ConfirmDialogComponent` at `src/app/shared/components/confirm-dialog/`
- [ ] Inputs: `title` (string), `message` (string), `confirmLabel` (string, default "Confirm"), `cancelLabel` (string, default "Cancel"), `variant` ('danger' | 'warning')
- [ ] Outputs: `confirmed` event, `cancelled` event
- [ ] Modal overlay with semi-transparent backdrop
- [ ] Danger variant uses Emergency Red for confirm button
- [ ] Warning variant uses Alert Orange for confirm button
- [ ] Keyboard accessible: Escape to cancel, Enter to confirm, focus trap within dialog
- [ ] Unit tests for: rendering, confirm/cancel event emission, keyboard handling, focus trap

### T-2026-112
- Title: Create barrel export for core/state module
- Status: todo
- Assigned: unassigned
- Priority: low
- Size: S
- Milestone: P1
- Depends: T-2026-015
- Blocked-by: —
- Tags: infrastructure, barrel-export, conventions
- Refs: src/app/core/state/game-state.service.ts, src/app/core/state/rank.constants.ts

The `src/app/core/state/` directory contains `game-state.service.ts` and `rank.constants.ts` but lacks an `index.ts` barrel export. All other core subdirectories (persistence, curriculum, levels, progression, minigame) have barrel exports per project conventions. This missing barrel forces consumers to use deep import paths.

Acceptance criteria:
- [ ] `src/app/core/state/index.ts` barrel export created
- [ ] Exports `GameStateService`, `GameStateSnapshot` from `game-state.service`
- [ ] Exports `RANK_THRESHOLDS`, `RankThreshold`, `getRankForXp` from `rank.constants`
- [ ] Update existing imports in `xp.service.ts` and `game-state.service.spec.ts` to use barrel path
- [ ] Verify build and all tests pass with updated imports

### T-2026-113
- Title: Create LevelCompletionService to integrate game completion with progression
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: M
- Milestone: P1
- Depends: T-2026-017, T-2026-020, T-2026-021, T-2026-028
- Blocked-by: —
- Tags: integration, progression, minigame-framework, service
- Refs: docs/progression.md, docs/overview.md

There is no service that connects the MinigameEngine's level completion event to the progression system. When a player completes a level, multiple services need to be updated: ScoreCalculationService calculates the final score, LevelProgressionService records the level completion and star rating, XpService awards XP based on tier and performance, and GameProgressionService checks if new content should be unlocked. This integration service is the critical glue between the minigame framework and the progression system.

Acceptance criteria:
- [ ] `LevelCompletionService` at `src/app/core/minigame/level-completion.service.ts`
- [ ] `completeLevel(gameId, levelId, result: MinigameResult)`: orchestrates the full completion flow
- [ ] Flow: (1) ScoreCalculationService.calculateScore -> (2) LevelProgressionService.recordCompletion -> (3) XpService.addXp (calculated from tier + perfect bonus) -> (4) returns a LevelCompletionSummary
- [ ] `LevelCompletionSummary` interface: score, starRating, xpEarned, bonuses (perfect, streak), isNewBestScore, rankUpOccurred
- [ ] Detects rank-up: compares rank before and after XP addition
- [ ] Integrates with StreakService.streakMultiplier for XP bonus when available (optional dep)
- [ ] Does NOT depend on UI components -- pure service orchestration
- [ ] Unit tests for: standard completion flow, perfect score bonus, rank-up detection, streak multiplier application

---

## P2 -- Foundations Bundle

### T-2026-058
- Title: Define Module Assembly level data for 18 levels
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: M
- Milestone: P2
- Depends: T-2026-019, T-2026-038
- Blocked-by: —
- Tags: minigame, module-assembly, level-data, content
- Refs: docs/minigames/01-module-assembly.md, docs/curriculum.md

Define the static level data for all 18 Module Assembly levels across 4 tiers. Each level specifies the component parts on the conveyor belt, the blueprint slots, decoy parts, belt speed, time limit, and scoring formula.

Acceptance criteria:
- [ ] Level data file at `src/app/data/levels/module-assembly.data.ts`
- [ ] `ModuleAssemblyLevelData` interface extending `LevelDefinition` with: parts (belt items), blueprint (slots), decoys, beltSpeed, timeLimit
- [ ] 6 Basic levels matching docs/minigames/01-module-assembly.md (minimal component through multiple components)
- [ ] 6 Intermediate levels (imports array through mixed challenge)
- [ ] 5 Advanced levels (template syntax through rapid fire)
- [ ] 1 Boss level ("Emergency Module Fabrication" with 5 interconnected components)
- [ ] Each level references correct Angular concepts from the spec
- [ ] Unit tests verify: 18 total levels, correct tier grouping, all levels have required fields

### T-2026-059
- Title: Create Module Assembly minigame engine
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: L
- Milestone: P2
- Depends: T-2026-017, T-2026-054, T-2026-058
- Blocked-by: —
- Tags: minigame, module-assembly, engine
- Refs: docs/minigames/01-module-assembly.md

Implement the Module Assembly game engine that extends MinigameEngine. Handles conveyor belt logic, part validation, slot matching, decoy detection, and scoring (time remaining + accuracy + combo).

Acceptance criteria:
- [ ] `ModuleAssemblyEngine` at `src/app/features/minigames/module-assembly/module-assembly.engine.ts`
- [ ] Extends `MinigameEngine<ModuleAssemblyLevelData>`
- [ ] Conveyor belt state: parts queue with configurable scroll speed
- [ ] Blueprint state: slots with expected part types, filled/empty status
- [ ] `validateAction(action)`: checks if dragged part matches target slot type
- [ ] Correct placement: snaps part into slot, increments score, triggers combo
- [ ] Wrong placement: rejects part (buzz), increments strike counter
- [ ] Decoy rejection: double-click/quick-reject discards decoys (correct rejection = bonus)
- [ ] Belt exhaustion: if belt empties with unfilled required slots, level fails
- [ ] 3 strikes (wrong placements) = level fails
- [ ] Unit tests for: part validation, slot matching, decoy handling, win/lose conditions, scoring

### T-2026-060
- Title: Create Module Assembly minigame UI component
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: L
- Milestone: P2
- Depends: T-2026-059, T-2026-018, T-2026-054
- Blocked-by: —
- Tags: minigame, module-assembly, component, ui
- Refs: docs/minigames/01-module-assembly.md, docs/ux/visual-style.md

Build the visual UI for Module Assembly: conveyor belt with scrolling parts, component blueprint with labeled slots, drag-and-drop interaction, and visual feedback for correct/incorrect placements.

Acceptance criteria:
- [ ] `ModuleAssemblyComponent` at `src/app/features/minigames/module-assembly/module-assembly.component.ts`
- [ ] Conveyor belt renders scrolling parts from right to left at configurable speed
- [ ] Blueprint area displays labeled slots (@Component, selector, template, styles, class body, imports)
- [ ] Parts are draggable (using DragDropService) from belt to slots
- [ ] Color coding: decorators (purple), template (blue), styles (green), class (orange)
- [ ] Correct placement: snap animation + particle burst
- [ ] Wrong placement: red flash + bounce back to belt
- [ ] Completed component: "powers up" glow effect
- [ ] Keyboard support: number keys to select slot, spacebar to grab next part
- [ ] Unit tests for: part rendering, drag-to-slot interaction, visual feedback states

### T-2026-061
- Title: Register Module Assembly in MinigameRegistry and wire routes
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: S
- Milestone: P2
- Depends: T-2026-060, T-2026-029, T-2026-042
- Blocked-by: —
- Tags: minigame, module-assembly, registration, routing
- Refs: docs/minigames/01-module-assembly.md, docs/curriculum.md

Register Module Assembly with the MinigameRegistryService and ensure it loads correctly via the routing system. This is the integration ticket that makes the minigame playable end-to-end.

Acceptance criteria:
- [ ] Module Assembly registered in MinigameRegistryService with gameId, config, and component type
- [ ] Navigating to `/minigames/module-assembly/level/1` loads and renders the game
- [ ] Level data loads from the level data file (T-2026-058)
- [ ] MinigameShell wraps the game UI with score, timer, lives
- [ ] Level completion triggers XP award and progression update
- [ ] E2e smoke test: navigate to level 1, verify game renders

### T-2026-062
- Title: Define Wire Protocol level data for 18 levels
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: M
- Milestone: P2
- Depends: T-2026-019, T-2026-038
- Blocked-by: —
- Tags: minigame, wire-protocol, level-data, content
- Refs: docs/minigames/02-wire-protocol.md, docs/curriculum.md

Define the static level data for all 18 Wire Protocol levels. Each level specifies the component class ports (properties/methods), template ports (binding targets), correct wire connections, wire types, and pre-wired connections (some intentionally wrong).

Acceptance criteria:
- [ ] Level data file at `src/app/data/levels/wire-protocol.data.ts`
- [ ] `WireProtocolLevelData` interface: sourcePorts[], targetPorts[], correctWires[], preWired[], wireTypes
- [ ] 6 Basic levels (interpolation only through all three types)
- [ ] 6 Intermediate levels (two-way binding through mixed challenge)
- [ ] 5 Advanced levels (template refs through full rewire)
- [ ] 1 Boss level ("Array Overhaul" with 5 components, 20+ connections)
- [ ] Unit tests verify: 18 total levels, all levels have valid wire definitions

### T-2026-063
- Title: Create Wire Protocol minigame engine
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: L
- Milestone: P2
- Depends: T-2026-017, T-2026-062
- Blocked-by: —
- Tags: minigame, wire-protocol, engine
- Refs: docs/minigames/02-wire-protocol.md

Implement the Wire Protocol game engine. Handles wiring connections, wire type validation, pre-wired correction detection, and verification attempts (3 allowed).

Acceptance criteria:
- [ ] `WireProtocolEngine` at `src/app/features/minigames/wire-protocol/wire-protocol.engine.ts`
- [ ] Extends `MinigameEngine<WireProtocolLevelData>`
- [ ] Wire state: list of drawn wires with source, target, and type
- [ ] Wire type enum: interpolation, property, event, twoWay
- [ ] `validateAction(action)`: checks wire source-target compatibility AND correct wire type
- [ ] Pre-wired connections loaded from level data (some correct, some intentionally wrong)
- [ ] `verify()`: checks all connections, costs 1 of 3 attempts
- [ ] Perfect score: all correct on first verification with no wrong wires
- [ ] 3 failed verifications = level fails
- [ ] Unit tests for: wire validation, type checking, pre-wired detection, verification logic

### T-2026-064
- Title: Create Wire Protocol minigame UI component
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: L
- Milestone: P2
- Depends: T-2026-063, T-2026-018
- Blocked-by: —
- Tags: minigame, wire-protocol, component, ui
- Refs: docs/minigames/02-wire-protocol.md, docs/ux/visual-style.md

Build the visual UI for Wire Protocol: split-screen component class (left) and template (right), color-coded connection ports, wire drawing with SVG bezier curves, and wire type selector.

Acceptance criteria:
- [ ] `WireProtocolComponent` at `src/app/features/minigames/wire-protocol/wire-protocol.component.ts`
- [ ] Split-screen layout: component class panel (left) and template panel (right)
- [ ] Source ports on properties/methods, destination ports on template binding targets
- [ ] Click source port, then click target port to draw a wire
- [ ] Wire type selector: toggle between binding types (keyboard: 1-4)
- [ ] Wire colors: blue (interpolation), green (property), orange (event), purple (two-way)
- [ ] SVG wire rendering with bezier curves and flowing particle animation
- [ ] Right-click wire to remove it
- [ ] Incorrect wires spark and fizzle on verification
- [ ] Unit tests for: wire drawing, type selection, port interaction, removal

### T-2026-065
- Title: Register Wire Protocol in MinigameRegistry and wire routes
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: S
- Milestone: P2
- Depends: T-2026-064, T-2026-029, T-2026-042
- Blocked-by: —
- Tags: minigame, wire-protocol, registration, routing
- Refs: docs/minigames/02-wire-protocol.md

Register Wire Protocol with MinigameRegistryService and ensure end-to-end playability.

Acceptance criteria:
- [ ] Wire Protocol registered with gameId, config, and component type
- [ ] Navigating to `/minigames/wire-protocol/level/1` loads and renders the game
- [ ] Level data loads correctly for all 18 levels
- [ ] MinigameShell integration works (score, timer, lives)
- [ ] E2e smoke test: navigate to level 1, verify game renders

### T-2026-066
- Title: Define Flow Commander level data for 18 levels
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: M
- Milestone: P2
- Depends: T-2026-019, T-2026-038
- Blocked-by: —
- Tags: minigame, flow-commander, level-data, content
- Refs: docs/minigames/03-flow-commander.md, docs/curriculum.md

Define the static level data for all 18 Flow Commander levels. Each level specifies pipeline topology, cargo items with properties, gate slots, target zones, and valid solutions.

Acceptance criteria:
- [ ] Level data file at `src/app/data/levels/flow-commander.data.ts`
- [ ] `FlowCommanderLevelData` interface: items[], pipelineTopology, gateSlots[], targetZones[], validSolutions[]
- [ ] 6 Basic levels (@if simple through @empty)
- [ ] 6 Intermediate levels (@switch through mixed challenge)
- [ ] 5 Advanced levels (dynamic data through full pipeline)
- [ ] 1 Boss level ("Emergency Cargo Sort" with 50+ items, 8 types)
- [ ] Unit tests verify: 18 total levels, all levels have valid pipeline definitions

### T-2026-067
- Title: Create Flow Commander minigame engine
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: L
- Milestone: P2
- Depends: T-2026-017, T-2026-066
- Blocked-by: —
- Tags: minigame, flow-commander, engine
- Refs: docs/minigames/03-flow-commander.md

Implement the Flow Commander game engine. Handles pipeline simulation, gate placement and configuration, cargo item routing, and correctness validation.

Acceptance criteria:
- [ ] `FlowCommanderEngine` at `src/app/features/minigames/flow-commander/flow-commander.engine.ts`
- [ ] Extends `MinigameEngine<FlowCommanderLevelData>`
- [ ] Pipeline state: directed graph with junction points for gate placement
- [ ] Gate types: @if (filter), @for (duplicate), @switch (route to lanes)
- [ ] Gate configuration: condition expressions (simplified expression builder at basic levels, raw at advanced)
- [ ] `simulate()`: runs items through the pipeline, routing based on gates
- [ ] Validates: all items reach correct target zones
- [ ] Scoring: efficiency (fewer gates) + correctness + speed
- [ ] Unit tests for: gate placement, condition evaluation, item routing, simulation, scoring

### T-2026-068
- Title: Create Flow Commander minigame UI component
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: L
- Milestone: P2
- Depends: T-2026-067, T-2026-018, T-2026-054
- Blocked-by: —
- Tags: minigame, flow-commander, component, ui
- Refs: docs/minigames/03-flow-commander.md, docs/ux/visual-style.md

Build the visual UI for Flow Commander: pipeline visualization with transparent tubes, gate toolbox, cargo pod items with visible properties, target zones, condition editor, and run/reset controls.

Acceptance criteria:
- [ ] `FlowCommanderComponent` at `src/app/features/minigames/flow-commander/flow-commander.component.ts`
- [ ] Pipeline rendered as left-to-right tubes with junction points
- [ ] Gate toolbox with @if, @for, @switch gates (draggable)
- [ ] Cargo pods displayed with color, label, type properties
- [ ] Target zones on right side showing expected items
- [ ] Click gate to configure condition (expression builder or raw input based on tier)
- [ ] Run button: animates items flowing through pipeline
- [ ] Correct routing: pods glow green entering target zone
- [ ] Wrong routing: pods flash red and break apart
- [ ] Unit tests for: pipeline rendering, gate placement, cargo animation, condition editor

### T-2026-069
- Title: Register Flow Commander in MinigameRegistry and wire routes
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: S
- Milestone: P2
- Depends: T-2026-068, T-2026-029, T-2026-042
- Blocked-by: —
- Tags: minigame, flow-commander, registration, routing
- Refs: docs/minigames/03-flow-commander.md

Register Flow Commander with MinigameRegistryService and ensure end-to-end playability.

Acceptance criteria:
- [ ] Flow Commander registered with gameId, config, and component type
- [ ] Navigating to `/minigames/flow-commander/level/1` loads and renders the game
- [ ] Level data loads correctly for all 18 levels
- [ ] MinigameShell integration works (score, timer, lives)
- [ ] E2e smoke test: navigate to level 1, verify game renders

### T-2026-070
- Title: Define Signal Corps level data for 18 levels
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: M
- Milestone: P2
- Depends: T-2026-019, T-2026-038
- Blocked-by: —
- Tags: minigame, signal-corps, level-data, content
- Refs: docs/minigames/04-signal-corps.md, docs/curriculum.md

Define the static level data for all 18 Signal Corps levels. Each level specifies tower configurations, input/output declarations, parent bindings, noise wave patterns, and grid layout.

Acceptance criteria:
- [ ] Level data file at `src/app/data/levels/signal-corps.data.ts`
- [ ] `SignalCorpsLevelData` interface: towers[], gridLayout, parentBindings, noiseWaves[], requiredConfigs
- [ ] 6 Basic levels (single input through multiple towers)
- [ ] 6 Intermediate levels (input transforms through mixed challenge)
- [ ] 5 Advanced levels (required inputs through defense optimization)
- [ ] 1 Boss level ("Full Array Defense" with 8 towers, 3 nesting levels)
- [ ] Unit tests verify: 18 total levels, valid tower configs, valid wave definitions

### T-2026-071
- Title: Create Signal Corps minigame engine
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: L
- Milestone: P2
- Depends: T-2026-017, T-2026-070
- Blocked-by: —
- Tags: minigame, signal-corps, engine
- Refs: docs/minigames/04-signal-corps.md

Implement the Signal Corps tower defense game engine. Handles tower configuration, input/output declaration validation, parent-child wiring, noise wave simulation, and damage tracking.

Acceptance criteria:
- [ ] `SignalCorpsEngine` at `src/app/features/minigames/signal-corps/signal-corps.engine.ts`
- [ ] Extends `MinigameEngine<SignalCorpsLevelData>`
- [ ] Tower state: per-tower input/output declarations, wiring to parent
- [ ] Input declaration validation: correct name, type, required flag, transforms
- [ ] Output declaration validation: correct name, payload type
- [ ] Wiring validation: parent property/handler matches tower input/output
- [ ] Noise wave simulation: waves approach, configured towers emit blocking signals
- [ ] Station health: damage from unblocked noise, game over at 0
- [ ] Scoring: waves survived + towers correct + time bonus
- [ ] Unit tests for: tower config validation, wiring validation, wave blocking, damage, scoring

### T-2026-072
- Title: Create Signal Corps minigame UI component
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: L
- Milestone: P2
- Depends: T-2026-071, T-2026-018
- Blocked-by: —
- Tags: minigame, signal-corps, component, ui
- Refs: docs/minigames/04-signal-corps.md, docs/ux/visual-style.md

Build the visual UI for Signal Corps: top-down grid view, tower configuration panels, input/output port visualization, noise wave animation, and deploy/simulate controls.

Acceptance criteria:
- [ ] `SignalCorpsComponent` at `src/app/features/minigames/signal-corps/signal-corps.component.ts`
- [ ] Top-down grid rendering with tower positions
- [ ] Click tower to open configuration panel
- [ ] Configuration panel: add/edit input() and output() declarations with name, type, required toggle
- [ ] Wire drawing from parent properties/handlers to tower ports
- [ ] Input ports glow blue, output ports glow orange
- [ ] Deploy button: activates towers and starts wave
- [ ] Noise wave visualization: approaching distortion fields
- [ ] Blocking animation: tower emits shield pulse
- [ ] Damage: screen shake, warning indicators
- [ ] Unit tests for: tower rendering, configuration panel, wave animation states

### T-2026-073
- Title: Register Signal Corps in MinigameRegistry and wire routes
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: S
- Milestone: P2
- Depends: T-2026-072, T-2026-029, T-2026-042
- Blocked-by: —
- Tags: minigame, signal-corps, registration, routing
- Refs: docs/minigames/04-signal-corps.md

Register Signal Corps with MinigameRegistryService and ensure end-to-end playability.

Acceptance criteria:
- [ ] Signal Corps registered with gameId, config, and component type
- [ ] Navigating to `/minigames/signal-corps/level/1` loads and renders the game
- [ ] Level data loads correctly for all 18 levels
- [ ] MinigameShell integration works (score, timer, lives)
- [ ] E2e smoke test: navigate to level 1, verify game renders

### T-2026-074
- Title: Create story mission content for Chapters 1-10 (Phase 1 Foundations)
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: L
- Milestone: P2
- Depends: T-2026-038, T-2026-031
- Blocked-by: —
- Tags: story-missions, content, curriculum, phase-1
- Refs: docs/curriculum.md, docs/overview.md

Create the narrative content and interactive code examples for the 10 story missions in Phase 1 (Foundations). Each mission introduces an Angular concept through the Nexus Station narrative.

Acceptance criteria:
- [ ] Mission data files at `src/app/data/missions/phase-1/`
- [ ] `StoryMissionContent` interface: chapterId, steps (narrative text + code examples + concept panels), completionCriteria
- [ ] Ch 1 (Components): Build the Emergency Shelter narrative with component anatomy code examples
- [ ] Ch 2 (Interpolation): Wire Up Life Support with sensor data display examples
- [ ] Ch 3 (Composing): Assemble Power Core + Comms Hub with nesting examples
- [ ] Ch 4 (Control Flow): Alert Systems with @if/@for/@switch examples
- [ ] Ch 5 (Property Binding): Module Configuration with [property] examples
- [ ] Ch 6 (Event Handling): Crew Interaction with (event) examples
- [ ] Ch 7 (Input Properties): Standardized Module Cards with input() examples
- [ ] Ch 8 (Output Properties): Distress Signal System with output() examples
- [ ] Ch 9 (Deferrable Views): Progressive Module Loading with @defer examples
- [ ] Ch 10 (Image Optimization): Star Chart Display with NgOptimizedImage examples
- [ ] Each mission has 3-5 steps with narrative, code, and concept explanation
- [ ] Unit tests verify: all 10 missions have valid content, step counts are 3-5

### T-2026-075
- Title: Create StoryMissionPage component for mission playback
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: M
- Milestone: P2
- Depends: T-2026-074, T-2026-031, T-2026-026
- Blocked-by: —
- Tags: story-missions, page, component, ui
- Refs: docs/ux/navigation.md, docs/curriculum.md

Implement the story mission view page that renders mission content. Navigation.md specifies: narrative text, interactive code examples (read-only with highlights), concept explanation panels, "Launch Minigame" button, and progress indicator.

Acceptance criteria:
- [ ] `StoryMissionPage` replaces the placeholder at `src/app/pages/mission/`
- [ ] Reads `:chapterId` from route params, loads mission content
- [ ] Step-by-step progression through mission content (next/previous buttons)
- [ ] Narrative text rendered with station-themed styling
- [ ] Interactive code examples using CodeEditorComponent in read-only mode
- [ ] Concept explanation panels with collapsible sections
- [ ] Progress indicator showing current step / total steps
- [ ] "Launch Minigame" button appears after mission completion (uses GameProgressionService)
- [ ] Locked state if mission prerequisites not met
- [ ] Unit tests for: content rendering, step navigation, completion state, launch button visibility

### T-2026-076
- Title: Create MinigameHubPage component for minigame browsing
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: M
- Milestone: P2
- Depends: T-2026-029, T-2026-026, T-2026-034, T-2026-055
- Blocked-by: —
- Tags: minigame-hub, page, component, ui
- Refs: docs/ux/navigation.md

Implement the minigame hub page. Navigation.md specifies: grid of minigame cards with mastery stars, locked/unlocked state, quick stats (levels completed, best scores), and filter by topic/mastery level.

Acceptance criteria:
- [ ] `MinigameHubPage` replaces the placeholder at `src/app/pages/minigame-hub/`
- [ ] Renders grid of minigame cards from MinigameRegistryService.getAllGames()
- [ ] Each card shows: game name, Angular topic, mastery stars (MasteryStarsComponent), locked/unlocked state
- [ ] Locked games use LockedContentComponent with unlock requirement message
- [ ] Quick stats per game: levels completed / total, best score
- [ ] Filter controls: by topic, by mastery level (0-5)
- [ ] Click unlocked card navigates to `/minigames/:gameId` (level select)
- [ ] Responsive: grid adapts to mobile (1 col), tablet (2 col), desktop (3 col)
- [ ] Unit tests for: card rendering, locked state, filtering, navigation

### T-2026-077
- Title: Create LevelSelectPage component for level browsing
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: M
- Milestone: P2
- Depends: T-2026-030, T-2026-020, T-2026-045, T-2026-046, T-2026-055
- Blocked-by: —
- Tags: level-select, page, component, ui
- Refs: docs/ux/navigation.md

Implement the level select page for a minigame. Navigation.md specifies: level list grouped by tier, star rating per level, best score/time, and replay mode tabs (Story, Endless, Speed Run, Daily).

Acceptance criteria:
- [ ] `LevelSelectPage` replaces the placeholder at `src/app/pages/level-select/`
- [ ] Reads `:gameId` from route params, loads level pack from LevelLoaderService
- [ ] Levels grouped by tier (Basic, Intermediate, Advanced, Boss) with TierBadgeComponent
- [ ] Each level shows: level number, title, LevelStarsComponent, best score
- [ ] Locked levels use LockedContentComponent
- [ ] Replay mode tabs: Story (default), Endless, Speed Run, Daily
- [ ] Click unlocked level navigates to `/minigames/:gameId/level/:levelId`
- [ ] Unit tests for: tier grouping, star display, locked state, tab switching, navigation

### T-2026-078
- Title: Create DashboardPage component with station overview
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: M
- Milestone: P2
- Depends: T-2026-026, T-2026-021, T-2026-035, T-2026-034, T-2026-041
- Blocked-by: —
- Tags: dashboard, page, component, ui
- Refs: docs/ux/navigation.md

Implement the station dashboard (home page). Navigation.md specifies: station visualization with module glow states, current rank and XP bar, active story mission prompt, quick-play minigame shortcuts, daily challenge notification, and spaced repetition alerts.

Acceptance criteria:
- [ ] `DashboardPage` replaces the placeholder at `src/app/pages/dashboard/`
- [ ] Current rank badge and XP progress bar (using XpProgressBarComponent)
- [ ] Active story mission prompt: shows next uncompleted mission with "Continue" button
- [ ] Quick-play minigame shortcuts: top 3-4 most recently played or recommended games
- [ ] Daily challenge notification: shows today's challenge if not completed
- [ ] Spaced repetition alerts: shows topics with degrading mastery
- [ ] Station module overview: grid of topic cards with mastery stars (MasteryStarsComponent)
- [ ] Unit tests for: rank display, mission prompt, daily challenge notification, mastery grid

### T-2026-079
- Title: Create ProfilePage component with player stats
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: M
- Milestone: P2
- Depends: T-2026-021, T-2026-022, T-2026-027, T-2026-050, T-2026-035, T-2026-034
- Blocked-by: —
- Tags: profile, page, component, ui
- Refs: docs/ux/navigation.md

Implement the profile/progress page. Navigation.md specifies: rank and XP breakdown, mastery stars per topic (table view), achievement badges, play time stats, and streak counter.

Acceptance criteria:
- [ ] `ProfilePage` replaces the placeholder at `src/app/pages/profile/`
- [ ] Rank display: current rank badge, rank name, total XP
- [ ] XP progress bar (full variant) showing progress to next rank
- [ ] Mastery table: all Angular topics with mastery stars (MasteryStarsComponent), sortable
- [ ] Streak counter: current streak days, multiplier percentage
- [ ] Play time stats: total play time, session time
- [ ] Campaign progress: missions completed / total, percentage
- [ ] Unit tests for: rank display, mastery table rendering, streak display, play time stats

### T-2026-080
- Title: Create SettingsPage component with user preferences UI
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P2
- Depends: T-2026-039, T-2026-057
- Blocked-by: —
- Tags: settings, page, component, ui
- Refs: docs/ux/navigation.md

Implement the settings page. Navigation.md specifies: sound on/off, animation speed, theme selection, and reset progress (with confirmation dialog).

Acceptance criteria:
- [ ] `SettingsPage` replaces the placeholder at `src/app/pages/settings/`
- [ ] Sound toggle (on/off) bound to SettingsService
- [ ] Animation speed selector (normal/fast/off) bound to SettingsService
- [ ] Theme selector (dark/station) bound to SettingsService
- [ ] Reduced motion toggle bound to SettingsService
- [ ] "Reset All Progress" button with ConfirmDialogComponent (danger variant)
- [ ] "Export Progress" button that downloads state as JSON
- [ ] "Import Progress" button that uploads and restores state from JSON
- [ ] Unit tests for: setting controls render, toggle interactions, reset with confirmation

### T-2026-114
- Title: Create StationVisualizationComponent for dashboard module glow map
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: M
- Milestone: P2
- Depends: T-2026-022, T-2026-007
- Blocked-by: —
- Tags: ui, dashboard, station-visualization, component
- Refs: docs/ux/navigation.md, docs/ux/visual-style.md, docs/progression.md

Navigation.md specifies the dashboard includes a "Station visualization with module glow states (0-5 star mastery)." Progression.md defines visual feedback per mastery level: 0=dark/damaged, 1=emergency lighting, 2=dim glow, 3=steady glow, 4=bright glow, 5=golden glow with particle effects. This component renders a visual map of all station modules with glow states driven by mastery data.

Acceptance criteria:
- [ ] `StationVisualizationComponent` at `src/app/shared/components/station-visualization/`
- [ ] Input: `masteryData` (Map<string, number> mapping topicId to mastery 0-5)
- [ ] Renders a station map layout with module nodes for each Angular topic (all 12 minigame topics)
- [ ] Each module node displays: topic name, current mastery level
- [ ] Glow colors match visual-style.md mastery glow table: 0=none/dark, 1=dim white, 2=Reactor Blue, 3=Sensor Green, 4=Solar Gold, 5=Solar Gold+pulse
- [ ] Damaged/dark appearance for 0-star modules, progressively brighter for higher mastery
- [ ] Clicking a module navigates to its minigame (emits `moduleClicked` event with topicId)
- [ ] Responsive layout: adapts to available container width
- [ ] Respects `prefers-reduced-motion` (disable pulse animations)
- [ ] Unit tests for: glow state per mastery level, module click emission, dark state for 0 mastery

---

## P3 -- Navigation Bundle

### T-2026-081
- Title: Define Corridor Runner level data for 18 levels
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: M
- Milestone: P3
- Depends: T-2026-019, T-2026-038
- Blocked-by: —
- Tags: minigame, corridor-runner, level-data, content
- Refs: docs/minigames/05-corridor-runner.md

Define the static level data for all 18 Corridor Runner levels covering Angular routing concepts.

Acceptance criteria:
- [ ] Level data file at `src/app/data/levels/corridor-runner.data.ts`
- [ ] `CorridorRunnerLevelData` interface: routeConfig (initial), mapLayout (nodes + edges), testNavigations[], targetDestinations[]
- [ ] 6 Basic levels (single route through RouterLink)
- [ ] 6 Intermediate levels (route params through mixed challenge)
- [ ] 5 Advanced levels (lazy loading through complex navigation)
- [ ] 1 Boss level ("Station-Wide Navigation" with 10 modules, 3 decks)
- [ ] Unit tests verify: 18 total levels, valid route configs, valid map layouts

### T-2026-082
- Title: Create Corridor Runner minigame engine
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: L
- Milestone: P3
- Depends: T-2026-017, T-2026-081
- Blocked-by: —
- Tags: minigame, corridor-runner, engine
- Refs: docs/minigames/05-corridor-runner.md

Implement the Corridor Runner engine with two phases: Config (route editor) and Run (navigation simulation).

Acceptance criteria:
- [ ] `CorridorRunnerEngine` at `src/app/features/minigames/corridor-runner/corridor-runner.engine.ts`
- [ ] Extends `MinigameEngine<CorridorRunnerLevelData>`
- [ ] Config phase: player edits route configuration array
- [ ] Run phase: simulates Angular router resolution for test navigations
- [ ] Route matching: path, redirects, wildcards, params, children, guards
- [ ] Hull breach (404) detection on unmatched routes
- [ ] 2 hull breaches = level fails
- [ ] Scoring: all routes correct on first try + efficient config
- [ ] Unit tests for: route matching, redirect resolution, 404 detection, scoring

### T-2026-083
- Title: Create Corridor Runner minigame UI component
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: L
- Milestone: P3
- Depends: T-2026-082, T-2026-018, T-2026-031
- Blocked-by: —
- Tags: minigame, corridor-runner, component, ui
- Refs: docs/minigames/05-corridor-runner.md, docs/ux/visual-style.md

Build the UI: route config code editor, top-down station map, crew member navigation animation, URL bar, and hull breach visualization.

Acceptance criteria:
- [ ] `CorridorRunnerComponent` at `src/app/features/minigames/corridor-runner/corridor-runner.component.ts`
- [ ] Config phase: CodeEditorComponent for route definitions
- [ ] Run phase: top-down map with corridors and modules
- [ ] Crew member sprite with walking animation along routes
- [ ] URL bar at top showing current route path
- [ ] Corridors light up as routes are configured
- [ ] Hull breach: decompression animation at dead-ends
- [ ] Successful navigation: door opens, module interior visible
- [ ] Unit tests for: phase switching, map rendering, URL bar updates

### T-2026-084
- Title: Register Corridor Runner in MinigameRegistry and wire routes
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: S
- Milestone: P3
- Depends: T-2026-083, T-2026-029, T-2026-042
- Blocked-by: —
- Tags: minigame, corridor-runner, registration, routing
- Refs: docs/minigames/05-corridor-runner.md

Register Corridor Runner and ensure end-to-end playability.

Acceptance criteria:
- [ ] Corridor Runner registered in MinigameRegistryService
- [ ] Navigating to `/minigames/corridor-runner/level/1` loads the game
- [ ] MinigameShell integration works
- [ ] E2e smoke test: navigate to level 1, verify game renders

### T-2026-085
- Title: Create story mission content for Chapters 11-13 (Phase 2 Navigation)
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: S
- Milestone: P3
- Depends: T-2026-038, T-2026-031
- Blocked-by: —
- Tags: story-missions, content, curriculum, phase-2
- Refs: docs/curriculum.md

Create narrative content for the 3 Navigation phase story missions.

Acceptance criteria:
- [ ] Mission data files at `src/app/data/missions/phase-2/`
- [ ] Ch 11 (Enable Routing): Station Map narrative with router-outlet examples
- [ ] Ch 12 (Define Routes): Corridor Paths with route config, params, 404 examples
- [ ] Ch 13 (RouterLink): Navigation Console with routerLink directive examples
- [ ] Each mission has 3-5 steps
- [ ] Unit tests verify: all 3 missions have valid content

---

## P4 -- Forms Bundle

### T-2026-086
- Title: Define Terminal Hack level data for 21 levels
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: M
- Milestone: P4
- Depends: T-2026-019, T-2026-038
- Blocked-by: —
- Tags: minigame, terminal-hack, level-data, content
- Refs: docs/minigames/06-terminal-hack.md

Define the static level data for all 21 Terminal Hack levels covering Angular forms.

Acceptance criteria:
- [ ] Level data file at `src/app/data/levels/terminal-hack.data.ts`
- [ ] `TerminalHackLevelData` interface: targetFormSpec, testCases[], availableElements[], timeLimit, hints[]
- [ ] 7 Basic levels (text input through template-driven form)
- [ ] 7 Intermediate levels (FormControl through error messages)
- [ ] 6 Advanced levels (custom validators through nested FormGroups)
- [ ] 1 Boss level ("Engineering Diagnostic Terminal" with all form concepts)
- [ ] Unit tests verify: 21 total levels, all levels have valid test cases

### T-2026-087
- Title: Create Terminal Hack minigame engine
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: L
- Milestone: P4
- Depends: T-2026-017, T-2026-086
- Blocked-by: —
- Tags: minigame, terminal-hack, engine
- Refs: docs/minigames/06-terminal-hack.md

Implement the Terminal Hack engine: form code evaluation, test case execution, live preview, and hint system integration.

Acceptance criteria:
- [ ] `TerminalHackEngine` at `src/app/features/minigames/terminal-hack/terminal-hack.engine.ts`
- [ ] Extends `MinigameEngine<TerminalHackLevelData>`
- [ ] Evaluates player's form code against test cases
- [ ] Live preview generation from form code
- [ ] Test execution: runs predefined inputs, validates outputs
- [ ] Timer management with configurable time limits per level
- [ ] Hint integration via HintService
- [ ] Scoring: speed + test pass rate + no hints = perfect
- [ ] Unit tests for: form evaluation, test case passing/failing, hint penalty, scoring

### T-2026-088
- Title: Create Terminal Hack minigame UI component
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: L
- Milestone: P4
- Depends: T-2026-087, T-2026-018, T-2026-031
- Blocked-by: —
- Tags: minigame, terminal-hack, component, ui
- Refs: docs/minigames/06-terminal-hack.md, docs/ux/visual-style.md

Build the UI: target form preview, form code editor, live preview, test runner output, and retro terminal aesthetic.

Acceptance criteria:
- [ ] `TerminalHackComponent` at `src/app/features/minigames/terminal-hack/terminal-hack.component.ts`
- [ ] Left panel: target form preview (read-only)
- [ ] Right panel: code editor (CodeEditorComponent) for form code
- [ ] Live preview updates as player types
- [ ] Bottom panel: test runner with pass/fail indicators
- [ ] Retro terminal aesthetic: green-on-black, scanlines
- [ ] Timer displayed as depleting power gauge
- [ ] Hint button with point cost warning
- [ ] Unit tests for: panel rendering, live preview updates, test result display

### T-2026-089
- Title: Register Terminal Hack in MinigameRegistry and wire routes
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: S
- Milestone: P4
- Depends: T-2026-088, T-2026-029, T-2026-042
- Blocked-by: —
- Tags: minigame, terminal-hack, registration, routing
- Refs: docs/minigames/06-terminal-hack.md

Register Terminal Hack and ensure end-to-end playability.

Acceptance criteria:
- [ ] Terminal Hack registered in MinigameRegistryService
- [ ] Navigating to `/minigames/terminal-hack/level/1` loads the game
- [ ] MinigameShell integration works
- [ ] E2e smoke test: navigate to level 1, verify game renders

### T-2026-090
- Title: Create story mission content for Chapters 14-17 (Phase 3 Data Input)
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: S
- Milestone: P4
- Depends: T-2026-038, T-2026-031
- Blocked-by: —
- Tags: story-missions, content, curriculum, phase-3
- Refs: docs/curriculum.md

Create narrative content for the 4 Data Input phase story missions.

Acceptance criteria:
- [ ] Mission data files at `src/app/data/missions/phase-3/`
- [ ] Ch 14 (Forms Introduction): Basic Crew Report with template-driven form examples
- [ ] Ch 15 (Form Control Values): Real-time Preview with form value reading examples
- [ ] Ch 16 (Reactive Forms): Engineering Diagnostic with FormBuilder examples
- [ ] Ch 17 (Forms Validation): Data Integrity Checks with validator examples
- [ ] Each mission has 3-5 steps
- [ ] Unit tests verify: all 4 missions have valid content

---

## P5 -- Architecture Bundle

### T-2026-091
- Title: Define Power Grid level data for 18 levels
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: M
- Milestone: P5
- Depends: T-2026-019, T-2026-038
- Blocked-by: —
- Tags: minigame, power-grid, level-data, content
- Refs: docs/minigames/07-power-grid.md

Define the static level data for all 18 Power Grid levels covering Services and DI.

Acceptance criteria:
- [ ] Level data file at `src/app/data/levels/power-grid.data.ts`
- [ ] `PowerGridLevelData` interface: services[], components[], validConnections[], scopeRules[]
- [ ] 6 Basic, 6 Intermediate, 5 Advanced levels, 1 Boss level matching spec
- [ ] Unit tests verify: 18 total levels, valid connection definitions

### T-2026-092
- Title: Create Power Grid minigame engine
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: L
- Milestone: P5
- Depends: T-2026-017, T-2026-091
- Blocked-by: —
- Tags: minigame, power-grid, engine
- Refs: docs/minigames/07-power-grid.md

Implement the Power Grid engine: service-component wiring, injection scope validation, and circuit board puzzle logic.

Acceptance criteria:
- [ ] `PowerGridEngine` at `src/app/features/minigames/power-grid/power-grid.engine.ts`
- [ ] Extends `MinigameEngine<PowerGridLevelData>`
- [ ] Connection validation: correct service to component, correct scope
- [ ] Scope types: root, component-level, hierarchical
- [ ] Short circuit detection on wrong connections
- [ ] Unit tests for: connection validation, scope checking, short circuit detection

### T-2026-093
- Title: Create Power Grid minigame UI component
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: L
- Milestone: P5
- Depends: T-2026-092, T-2026-018
- Blocked-by: —
- Tags: minigame, power-grid, component, ui
- Refs: docs/minigames/07-power-grid.md, docs/ux/visual-style.md

Build the circuit board UI for Power Grid with service generators, component consumers, and power line drawing.

Acceptance criteria:
- [ ] `PowerGridComponent` at `src/app/features/minigames/power-grid/power-grid.component.ts`
- [ ] Grid board with services (left) and components (right)
- [ ] Power line drawing between services and components
- [ ] Scope selector per service (root/component)
- [ ] Color-coded connections (blue=root, green=component, orange=factory)
- [ ] Unit tests for: grid rendering, connection drawing, scope selection

### T-2026-094
- Title: Define Data Relay level data for 18 levels
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: M
- Milestone: P5
- Depends: T-2026-019, T-2026-038
- Blocked-by: —
- Tags: minigame, data-relay, level-data, content
- Refs: docs/minigames/08-data-relay.md

Define the static level data for all 18 Data Relay levels covering Pipes.

Acceptance criteria:
- [ ] Level data file at `src/app/data/levels/data-relay.data.ts`
- [ ] `DataRelayLevelData` interface: streams[], availablePipes[], targetOutputs[], testData[]
- [ ] 6 Basic, 6 Intermediate, 5 Advanced levels, 1 Boss level matching spec
- [ ] Unit tests verify: 18 total levels, valid stream/pipe definitions

### T-2026-095
- Title: Create Data Relay minigame engine
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: L
- Milestone: P5
- Depends: T-2026-017, T-2026-094
- Blocked-by: —
- Tags: minigame, data-relay, engine
- Refs: docs/minigames/08-data-relay.md

Implement the Data Relay engine: pipe placement, parameter configuration, data transformation, and output comparison.

Acceptance criteria:
- [ ] `DataRelayEngine` at `src/app/features/minigames/data-relay/data-relay.engine.ts`
- [ ] Extends `MinigameEngine<DataRelayLevelData>`
- [ ] Applies pipe transformations using Angular's actual pipe logic
- [ ] Pipe chaining support (multiple pipes in sequence)
- [ ] Output comparison against target format
- [ ] Custom pipe editor for advanced levels
- [ ] Unit tests for: pipe application, chaining, output comparison, custom pipes

### T-2026-096
- Title: Create Data Relay minigame UI component
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: L
- Milestone: P5
- Depends: T-2026-095, T-2026-018, T-2026-054
- Blocked-by: —
- Tags: minigame, data-relay, component, ui
- Refs: docs/minigames/08-data-relay.md, docs/ux/visual-style.md

Build the stream transformer UI: data streams, pipe toolbox, parameter configuration, and output comparison.

Acceptance criteria:
- [ ] `DataRelayComponent` at `src/app/features/minigames/data-relay/data-relay.component.ts`
- [ ] Left-to-right data stream visualization
- [ ] Pipe toolbox organized by category
- [ ] Pipe parameter configuration on click
- [ ] Data particles showing visual transformation through pipes
- [ ] Output comparison: actual vs expected
- [ ] Unit tests for: stream rendering, pipe placement, parameter editing

### T-2026-097
- Title: Create story mission content for Chapters 18-22 (Phases 4-5)
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: M
- Milestone: P5
- Depends: T-2026-038, T-2026-031
- Blocked-by: —
- Tags: story-missions, content, curriculum, phase-4, phase-5
- Refs: docs/curriculum.md

Create narrative content for the 5 story missions covering Shared Systems and Data Processing.

Acceptance criteria:
- [ ] Mission data at `src/app/data/missions/phase-4/` and `src/app/data/missions/phase-5/`
- [ ] Ch 18-19 (Services & DI): Core Services and Wire the Grid narratives
- [ ] Ch 20-22 (Pipes): Format Sensor Data, Advanced Formatting, Custom Sensors narratives
- [ ] Each mission has 3-5 steps
- [ ] Unit tests verify: all 5 missions have valid content

### T-2026-115
- Title: Register Power Grid in MinigameRegistry and wire routes
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: S
- Milestone: P5
- Depends: T-2026-093, T-2026-029, T-2026-042
- Blocked-by: —
- Tags: minigame, power-grid, registration, routing
- Refs: docs/minigames/07-power-grid.md

Register Power Grid with MinigameRegistryService and ensure end-to-end playability.

Acceptance criteria:
- [ ] Power Grid registered with gameId, config, and component type
- [ ] Navigating to `/minigames/power-grid/level/1` loads and renders the game
- [ ] Level data loads correctly for all 18 levels
- [ ] MinigameShell integration works (score, timer, lives)
- [ ] E2e smoke test: navigate to level 1, verify game renders

### T-2026-116
- Title: Register Data Relay in MinigameRegistry and wire routes
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: S
- Milestone: P5
- Depends: T-2026-096, T-2026-029, T-2026-042
- Blocked-by: —
- Tags: minigame, data-relay, registration, routing
- Refs: docs/minigames/08-data-relay.md

Register Data Relay with MinigameRegistryService and ensure end-to-end playability.

Acceptance criteria:
- [ ] Data Relay registered with gameId, config, and component type
- [ ] Navigating to `/minigames/data-relay/level/1` loads and renders the game
- [ ] Level data loads correctly for all 18 levels
- [ ] MinigameShell integration works (score, timer, lives)
- [ ] E2e smoke test: navigate to level 1, verify game renders

---

## P6 -- Signals Bundle

### T-2026-098
- Title: Define Reactor Core level data for 21 levels
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: M
- Milestone: P6
- Depends: T-2026-019, T-2026-038
- Blocked-by: —
- Tags: minigame, reactor-core, level-data, content
- Refs: docs/minigames/09-reactor-core.md

Define the static level data for all 21 Reactor Core levels covering Angular Signals.

Acceptance criteria:
- [ ] Level data file at `src/app/data/levels/reactor-core.data.ts`
- [ ] `ReactorCoreLevelData` interface: requiredNodes[], scenarios[], validGraphs[], constraints[]
- [ ] 7 Basic, 7 Intermediate, 6 Advanced levels, 1 Boss level matching spec
- [ ] Unit tests verify: 21 total levels, valid graph definitions

### T-2026-099
- Title: Create Reactor Core minigame engine
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: L
- Milestone: P6
- Depends: T-2026-017, T-2026-098
- Blocked-by: —
- Tags: minigame, reactor-core, engine
- Refs: docs/minigames/09-reactor-core.md

Implement the Reactor Core engine: node-based signal graph editing, simulation, and change propagation using Angular signal semantics.

Acceptance criteria:
- [ ] `ReactorCoreEngine` at `src/app/features/minigames/reactor-core/reactor-core.engine.ts`
- [ ] Extends `MinigameEngine<ReactorCoreLevelData>`
- [ ] Signal, computed, and effect node types
- [ ] Graph validation: no circular signal dependencies
- [ ] Simulation: change propagation through graph
- [ ] Scenario execution against expected outputs
- [ ] Unit tests for: graph building, validation, propagation, scenario execution

### T-2026-100
- Title: Create Reactor Core minigame UI component
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: L
- Milestone: P6
- Depends: T-2026-099, T-2026-018
- Blocked-by: —
- Tags: minigame, reactor-core, component, ui
- Refs: docs/minigames/09-reactor-core.md, docs/ux/visual-style.md

Build the reactive circuit design UI: node toolbox, graph editor, wire drawing, value displays, and simulation visualization.

Acceptance criteria:
- [ ] `ReactorCoreComponent` at `src/app/features/minigames/reactor-core/reactor-core.component.ts`
- [ ] Node toolbox: signal (blue), computed (green), effect (orange)
- [ ] Graph editor: drag nodes, draw dependency wires
- [ ] Value display on each node (current value/formula)
- [ ] Simulation visualization: energy flowing along wires on change
- [ ] Expression builder for computed node formulas
- [ ] Unit tests for: node placement, wire drawing, simulation animation states

### T-2026-101
- Title: Create story mission content for Chapters 23-26 (Phase 6 Signals)
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: S
- Milestone: P6
- Depends: T-2026-038, T-2026-031
- Blocked-by: —
- Tags: story-missions, content, curriculum, phase-6
- Refs: docs/curriculum.md

Create narrative content for the 4 Signals story missions.

Acceptance criteria:
- [ ] Mission data at `src/app/data/missions/phase-6/`
- [ ] Ch 23-26 (Signals): Sensor Network, Computed Readings, Linked Sensors, Automated Responses
- [ ] Each mission has 3-5 steps
- [ ] Unit tests verify: all 4 missions have valid content

### T-2026-117
- Title: Register Reactor Core in MinigameRegistry and wire routes
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: S
- Milestone: P6
- Depends: T-2026-100, T-2026-029, T-2026-042
- Blocked-by: —
- Tags: minigame, reactor-core, registration, routing
- Refs: docs/minigames/09-reactor-core.md

Register Reactor Core with MinigameRegistryService and ensure end-to-end playability.

Acceptance criteria:
- [ ] Reactor Core registered with gameId, config, and component type
- [ ] Navigating to `/minigames/reactor-core/level/1` loads and renders the game
- [ ] Level data loads correctly for all 21 levels
- [ ] MinigameShell integration works (score, timer, lives)
- [ ] E2e smoke test: navigate to level 1, verify game renders

---

## P7 -- Advanced Bundle

### T-2026-102
- Title: Define Deep Space Radio level data for 18 levels
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: M
- Milestone: P7
- Depends: T-2026-019, T-2026-038
- Blocked-by: —
- Tags: minigame, deep-space-radio, level-data, content
- Refs: docs/minigames/10-deep-space-radio.md

Define the static level data for all 18 Deep Space Radio levels covering HTTP Client and Interceptors.

Acceptance criteria:
- [ ] Level data file at `src/app/data/levels/deep-space-radio.data.ts`
- [ ] `DeepSpaceRadioLevelData` interface: endpoints[], interceptors[], testScenarios[], expectedResults[]
- [ ] 6 Basic, 6 Intermediate, 5 Advanced levels, 1 Boss level matching spec
- [ ] Unit tests verify: 18 total levels, valid endpoint/interceptor definitions

### T-2026-103
- Title: Create Deep Space Radio minigame engine
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: L
- Milestone: P7
- Depends: T-2026-017, T-2026-102
- Blocked-by: —
- Tags: minigame, deep-space-radio, engine
- Refs: docs/minigames/10-deep-space-radio.md

Implement the Deep Space Radio engine: HTTP request building, interceptor chain simulation, mock backend, and response handling.

Acceptance criteria:
- [ ] `DeepSpaceRadioEngine` at `src/app/features/minigames/deep-space-radio/deep-space-radio.engine.ts`
- [ ] Extends `MinigameEngine<DeepSpaceRadioLevelData>`
- [ ] Request builder: method, URL, headers, body configuration
- [ ] Interceptor chain: ordered pipeline processing requests/responses
- [ ] Mock backend: simulated endpoints with expected formats and responses
- [ ] Response validation against expected results
- [ ] Unit tests for: request building, interceptor chain, mock backend, response validation

### T-2026-104
- Title: Define System Certification level data for 18 levels
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: M
- Milestone: P7
- Depends: T-2026-019, T-2026-038
- Blocked-by: —
- Tags: minigame, system-certification, level-data, content
- Refs: docs/minigames/11-system-certification.md

Define the static level data for all 18 System Certification levels covering Testing.

Acceptance criteria:
- [ ] Level data file at `src/app/data/levels/system-certification.data.ts`
- [ ] `SystemCertificationLevelData` interface: sourceCode, coverageThreshold, timeLimit, availableTestUtilities[]
- [ ] 6 Basic, 6 Intermediate, 5 Advanced levels, 1 Boss level matching spec
- [ ] Unit tests verify: 18 total levels, valid source code and test utilities

### T-2026-105
- Title: Create System Certification minigame engine
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: L
- Milestone: P7
- Depends: T-2026-017, T-2026-104
- Blocked-by: —
- Tags: minigame, system-certification, engine
- Refs: docs/minigames/11-system-certification.md

Implement the System Certification engine: test execution, coverage calculation, and test quality scoring.

Acceptance criteria:
- [ ] `SystemCertificationEngine` at `src/app/features/minigames/system-certification/system-certification.engine.ts`
- [ ] Extends `MinigameEngine<SystemCertificationLevelData>`
- [ ] Test code evaluation in sandboxed environment
- [ ] Coverage calculation: track which source lines are exercised
- [ ] Test quality scoring: penalize redundant tests
- [ ] Coverage threshold validation per level
- [ ] Unit tests for: test execution, coverage tracking, quality scoring

### T-2026-106
- Title: Define Blast Doors level data for 18 levels
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: M
- Milestone: P7
- Depends: T-2026-019, T-2026-038
- Blocked-by: —
- Tags: minigame, blast-doors, level-data, content
- Refs: docs/minigames/12-blast-doors.md

Define the static level data for all 18 Blast Doors levels covering Lifecycle Hooks and Custom Directives.

Acceptance criteria:
- [ ] Level data file at `src/app/data/levels/blast-doors.data.ts`
- [ ] `BlastDoorsLevelData` interface: doors[], hooks[], directives[], scenarios[], expectedBehavior[]
- [ ] 6 Basic, 6 Intermediate, 5 Advanced levels, 1 Boss level matching spec
- [ ] Unit tests verify: 18 total levels, valid door/hook/directive definitions

### T-2026-107
- Title: Create Blast Doors minigame engine
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: L
- Milestone: P7
- Depends: T-2026-017, T-2026-106
- Blocked-by: —
- Tags: minigame, blast-doors, engine
- Refs: docs/minigames/12-blast-doors.md

Implement the Blast Doors engine: lifecycle hook ordering, directive behavior application, and scenario simulation.

Acceptance criteria:
- [ ] `BlastDoorsEngine` at `src/app/features/minigames/blast-doors/blast-doors.engine.ts`
- [ ] Extends `MinigameEngine<BlastDoorsLevelData>`
- [ ] Lifecycle simulation: fires hooks in Angular's actual lifecycle order
- [ ] Hook slot validation: correct behavior in correct hook
- [ ] Directive behavior application on door components
- [ ] Scenario simulation: trigger events, validate door states
- [ ] Unit tests for: hook ordering, directive application, scenario validation

### T-2026-108
- Title: Create story mission content for Chapters 27-34 (Phase 6 Advanced)
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: M
- Milestone: P7
- Depends: T-2026-038, T-2026-031
- Blocked-by: —
- Tags: story-missions, content, curriculum, phase-6
- Refs: docs/curriculum.md

Create narrative content for the 8 Advanced phase story missions.

Acceptance criteria:
- [ ] Mission data at `src/app/data/missions/phase-6/` (continued)
- [ ] Ch 27 (Content Projection), Ch 28 (Lifecycle), Ch 29 (Directives), Ch 30 (HTTP), Ch 31 (Interceptors), Ch 32 (Testing), Ch 33 (Animations), Ch 34 (Performance)
- [ ] Each mission has 3-5 steps
- [ ] Unit tests verify: all 8 missions have valid content

### T-2026-118
- Title: Create Deep Space Radio minigame UI component
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: L
- Milestone: P7
- Depends: T-2026-103, T-2026-018
- Blocked-by: —
- Tags: minigame, deep-space-radio, component, ui
- Refs: docs/minigames/10-deep-space-radio.md, docs/ux/visual-style.md

Build the visual UI for Deep Space Radio: request builder (method, URL, headers, body), interceptor chain pipeline, transmission simulation visualization, and response viewer.

Acceptance criteria:
- [ ] `DeepSpaceRadioComponent` at `src/app/features/minigames/deep-space-radio/deep-space-radio.component.ts`
- [ ] Request editor: method selector (GET/POST/PUT/DELETE), URL input, headers editor, body editor
- [ ] Interceptor toolbox with draggable interceptor blocks (auth, logging, retry, error, caching)
- [ ] Interceptor pipeline visualization: ordered chain of processing blocks
- [ ] Click interceptor to configure behavior (e.g., auth token value, retry count)
- [ ] Transmit button: animates request as radio wave through interceptor chain
- [ ] Response viewer: displays response data with status code and type
- [ ] Radio wave visualization with interceptor modification indicators (key icon for auth, scroll for logging)
- [ ] Failed transmission: static interference, error codes displayed
- [ ] Unit tests for: request builder rendering, interceptor placement, pipeline ordering, response display

### T-2026-119
- Title: Register Deep Space Radio in MinigameRegistry and wire routes
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: S
- Milestone: P7
- Depends: T-2026-118, T-2026-029, T-2026-042
- Blocked-by: —
- Tags: minigame, deep-space-radio, registration, routing
- Refs: docs/minigames/10-deep-space-radio.md

Register Deep Space Radio with MinigameRegistryService and ensure end-to-end playability.

Acceptance criteria:
- [ ] Deep Space Radio registered with gameId, config, and component type
- [ ] Navigating to `/minigames/deep-space-radio/level/1` loads and renders the game
- [ ] Level data loads correctly for all 18 levels
- [ ] MinigameShell integration works (score, timer, lives)
- [ ] E2e smoke test: navigate to level 1, verify game renders

### T-2026-120
- Title: Create System Certification minigame UI component
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: L
- Milestone: P7
- Depends: T-2026-105, T-2026-018, T-2026-031
- Blocked-by: —
- Tags: minigame, system-certification, component, ui
- Refs: docs/minigames/11-system-certification.md, docs/ux/visual-style.md

Build the visual UI for System Certification: source code viewer (left), test editor (right), test runner output (bottom), and coverage meter. Professional testing lab aesthetic per the spec.

Acceptance criteria:
- [ ] `SystemCertificationComponent` at `src/app/features/minigames/system-certification/system-certification.component.ts`
- [ ] Left panel: source code (read-only, using CodeEditorComponent)
- [ ] Right panel: test editor (CodeEditorComponent, editable) for writing describe/it/expect blocks
- [ ] Bottom panel: test runner output with pass/fail indicators per test
- [ ] Coverage meter gauge (prominent, visual) with percentage display
- [ ] Coverage overlay mode: toggle to see covered (green), uncovered (red), partial (yellow) lines on source
- [ ] Hint button that highlights uncovered code path (integrates with HintService)
- [ ] Passing tests: green checkmarks with animation
- [ ] Failing tests: red X with error message highlight
- [ ] Full certification: "CERTIFIED" stamp animation
- [ ] Unit tests for: panel rendering, test result display, coverage meter updates

### T-2026-121
- Title: Register System Certification in MinigameRegistry and wire routes
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: S
- Milestone: P7
- Depends: T-2026-120, T-2026-029, T-2026-042
- Blocked-by: —
- Tags: minigame, system-certification, registration, routing
- Refs: docs/minigames/11-system-certification.md

Register System Certification with MinigameRegistryService and ensure end-to-end playability.

Acceptance criteria:
- [ ] System Certification registered with gameId, config, and component type
- [ ] Navigating to `/minigames/system-certification/level/1` loads and renders the game
- [ ] Level data loads correctly for all 18 levels
- [ ] MinigameShell integration works (score, timer, lives)
- [ ] E2e smoke test: navigate to level 1, verify game renders

### T-2026-122
- Title: Create Blast Doors minigame UI component
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: L
- Milestone: P7
- Depends: T-2026-107, T-2026-018
- Blocked-by: —
- Tags: minigame, blast-doors, component, ui
- Refs: docs/minigames/12-blast-doors.md, docs/ux/visual-style.md

Build the visual UI for Blast Doors: station cross-section with blast doors, lifecycle timeline with hook slots, directive editor, and simulation controls with scenario playback.

Acceptance criteria:
- [ ] `BlastDoorsComponent` at `src/app/features/minigames/blast-doors/blast-doors.component.ts`
- [ ] Station cross-section view with blast doors at entry points
- [ ] Lifecycle timeline: horizontal bar per door with hook slots (ngOnInit, ngOnChanges, ngOnDestroy, etc.)
- [ ] Drag behavior blocks into lifecycle hook slots
- [ ] Arrange hook order: reorder hooks in correct lifecycle execution sequence
- [ ] Directive editor panel: write custom directive logic for door behaviors
- [ ] Simulate button: runs scenario and animates door responses in sequence
- [ ] Door animations: open/close with mechanical detail
- [ ] Emergency scenario visuals: red lighting, klaxon pulses, countdown timers
- [ ] Directive effects on doors: glow for highlight, lock icon for access control
- [ ] Unit tests for: timeline rendering, hook slot drag-and-drop, scenario simulation states

### T-2026-123
- Title: Register Blast Doors in MinigameRegistry and wire routes
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: S
- Milestone: P7
- Depends: T-2026-122, T-2026-029, T-2026-042
- Blocked-by: —
- Tags: minigame, blast-doors, registration, routing
- Refs: docs/minigames/12-blast-doors.md

Register Blast Doors with MinigameRegistryService and ensure end-to-end playability.

Acceptance criteria:
- [ ] Blast Doors registered with gameId, config, and component type
- [ ] Navigating to `/minigames/blast-doors/level/1` loads and renders the game
- [ ] Level data loads correctly for all 18 levels
- [ ] MinigameShell integration works (score, timer, lives)
- [ ] E2e smoke test: navigate to level 1, verify game renders

---

## P8 -- Polish & Replayability

### T-2026-109
- Title: Implement achievement badge system
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: M
- Milestone: P8
- Depends: T-2026-026, T-2026-020, T-2026-027
- Blocked-by: —
- Tags: gamification, achievements, badges, service
- Refs: docs/research/gamification-patterns.md, docs/ux/navigation.md

Gamification research specifies three types of achievements: Discovery (try things), Mastery (perfect things), Commitment (streaks). Some achievements are hidden until earned. Profile page displays earned badges.

Acceptance criteria:
- [ ] `AchievementService` at `src/app/core/progression/achievement.service.ts`
- [ ] `Achievement` interface: id, title, description, type (discovery|mastery|commitment), isHidden, isEarned, earnedDate
- [ ] Predefined achievements covering all three types (minimum 15 total)
- [ ] `checkAchievements()`: evaluates all achievement conditions against current game state
- [ ] `getEarnedAchievements()`: returns list of earned achievements
- [ ] Achievement notification on earn (integrates with toast system)
- [ ] Persisted via StatePersistenceService
- [ ] Unit tests for: achievement evaluation, earning, notification trigger

### T-2026-110
- Title: Implement local leaderboard system
- Status: todo
- Assigned: unassigned
- Priority: low
- Size: M
- Milestone: P8
- Depends: T-2026-048, T-2026-049, T-2026-024
- Blocked-by: —
- Tags: gamification, leaderboards, replayability
- Refs: docs/research/gamification-patterns.md, docs/progression.md

Gamification research specifies per-minigame leaderboards (not global). Speed run leaderboards for competitive play, personal bests for mastery mode. Initially local (localStorage), designed for future online extension.

Acceptance criteria:
- [ ] `LeaderboardService` at `src/app/core/progression/leaderboard.service.ts`
- [ ] Per-minigame leaderboard entries: playerName, score, time, date, mode (story|endless|speedrun)
- [ ] `addEntry(gameId, entry)`: adds a leaderboard entry
- [ ] `getLeaderboard(gameId, mode)`: returns sorted entries for a game and mode
- [ ] `getPlayerRank(gameId, mode)`: returns player's position
- [ ] Top 10 entries per game per mode
- [ ] Persisted via StatePersistenceService
- [ ] Unit tests for: entry addition, sorting, rank calculation, per-mode filtering

### T-2026-111
- Title: Implement cosmetic unlock system
- Status: todo
- Assigned: unassigned
- Priority: low
- Size: M
- Milestone: P8
- Depends: T-2026-021, T-2026-022, T-2026-109
- Blocked-by: —
- Tags: gamification, cosmetics, replayability
- Refs: docs/progression.md

Progression.md specifies cosmetic unlocks: station module skins, UI themes, achievement badges. Unlocked at rank milestones and mastery milestones.

Acceptance criteria:
- [ ] `CosmeticService` at `src/app/core/progression/cosmetic.service.ts`
- [ ] `CosmeticItem` interface: id, name, type (skin|theme|badge), unlockCondition, isUnlocked
- [ ] Unlock conditions: rank milestones, mastery milestones, specific achievements
- [ ] `getUnlockedCosmetics()`: returns available cosmetics
- [ ] `equipCosmetic(id)`: sets active cosmetic for a slot
- [ ] `getEquipped(type)`: returns currently equipped cosmetic
- [ ] Persisted via StatePersistenceService
- [ ] Unit tests for: unlock evaluation, equip/unequip, persistence
