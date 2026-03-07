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

### T-2026-126
- Title: Create core module root barrel export
- Status: todo
- Assigned: unassigned
- Priority: low
- Size: S
- Milestone: P1
- Depends: T-2026-112
- Blocked-by: —
- Tags: infrastructure, barrel-export, conventions
- Refs: src/app/core/

The `src/app/core/` directory has subdirectory barrels for `minigame/`, `levels/`, `progression/`, `persistence/`, `curriculum/`, `settings/`, and `notifications/`, but no root `core/index.ts` barrel. Adding one follows the same convention used in `shared/index.ts` and provides a single import point for all core services.

Acceptance criteria:
- [ ] `src/app/core/index.ts` barrel export created
- [ ] Re-exports from all subdirectory barrels: state, minigame, levels, progression, persistence, curriculum, settings, notifications
- [ ] Verify build passes (no circular dependency issues)
- [ ] Update at least one consumer file to use the core barrel import as a smoke test

### T-2026-129
- Title: Create EmptyStateComponent for no-content pages
- Status: todo
- Assigned: unassigned
- Priority: low
- Size: S
- Milestone: P1
- Depends: T-2026-007
- Blocked-by: —
- Tags: ui, component, shared
- Refs: docs/ux/visual-style.md, docs/ux/navigation.md

Multiple pages need empty state displays: dashboard with no completed missions, minigame hub with all games locked, profile with no stats. A shared component ensures consistent empty state presentation across the app.

Acceptance criteria:
- [ ] `EmptyStateComponent` at `src/app/shared/components/empty-state/`
- [ ] Selector: `nx-empty-state`
- [ ] Inputs: `icon` (string, icon name), `title` (string), `message` (string)
- [ ] Content projection slot for optional action button
- [ ] Station-themed styling: muted colors, centered layout
- [ ] Exported from shared components barrel
- [ ] Unit tests for: rendering with all inputs, content projection slot

### T-2026-130
- Title: Create TooltipDirective for contextual help
- Status: todo
- Assigned: unassigned
- Priority: low
- Size: S
- Milestone: P1
- Depends: T-2026-007
- Blocked-by: —
- Tags: ui, directive, shared, accessibility
- Refs: docs/ux/visual-style.md

Minigame UIs, level select pages, and dashboard elements need tooltip support for contextual explanations (e.g., hovering over a mastery star to see what it means, hovering over a locked level to see unlock requirements). No shared tooltip exists.

Acceptance criteria:
- [ ] `TooltipDirective` at `src/app/shared/directives/tooltip.directive.ts`
- [ ] Selector: `[nxTooltip]`
- [ ] Input: `nxTooltip` (string, tooltip text)
- [ ] Input: `nxTooltipPosition` ('top' | 'bottom' | 'left' | 'right'), default 'top'
- [ ] Shows tooltip on hover/focus with 200ms delay
- [ ] Hides on mouse leave/blur
- [ ] Station-themed styling: Hull background, Display text, Bulkhead border
- [ ] Keyboard accessible: shows on focus, hides on blur
- [ ] Exported from shared directives barrel
- [ ] Unit tests for: show/hide on hover, position classes, keyboard accessibility

### T-2026-131
- Title: Create ErrorStateComponent for error display
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P1
- Depends: T-2026-007
- Blocked-by: —
- Tags: ui, component, shared, error-handling
- Refs: docs/ux/visual-style.md

When level data fails to load, a minigame component is not found, or a service throws an error, users currently see raw error text or nothing. This shared component provides a consistent error state display with retry capability.

Acceptance criteria:
- [ ] `ErrorStateComponent` at `src/app/shared/components/error-state/`
- [ ] Selector: `nx-error-state`
- [ ] Inputs: `title` (string, default "Something went wrong"), `message` (string), `retryable` (boolean, default true)
- [ ] Output: `retry` event emitted when retry button is clicked
- [ ] Uses Emergency Red accent color for error icon
- [ ] Exported from shared components barrel
- [ ] Unit tests for: rendering, retry event emission, non-retryable hides button

### T-2026-132
- Title: Style NotFoundPage with station theme
- Status: todo
- Assigned: unassigned
- Priority: low
- Size: S
- Milestone: P1
- Depends: T-2026-007, T-2026-013
- Blocked-by: —
- Tags: ui, styling, not-found, page
- Refs: docs/ux/visual-style.md, src/app/pages/not-found/not-found.ts

The 404 Not Found page currently shows plain text. The design docs describe a "Hull Breach" theme for 404 pages (Corridor Runner spec references "Hull Breach" as the 404 concept). This ticket styles the 404 page with station-themed visuals.

Acceptance criteria:
- [ ] NotFoundPage updated with "Hull Breach" themed styling
- [ ] Space-station appropriate imagery or CSS art (e.g., warning stripes, breach animation)
- [ ] "Return to Dashboard" link styled as primary button
- [ ] Uses design tokens: Emergency Red accent, Void background
- [ ] Responsive layout for mobile and desktop
- [ ] Unit tests still pass after styling update

### T-2026-133
- Title: Create StreakBadgeComponent for streak display
- Status: todo
- Assigned: unassigned
- Priority: low
- Size: S
- Milestone: P1
- Depends: T-2026-027, T-2026-007
- Blocked-by: —
- Tags: ui, component, streak, gamification
- Refs: docs/progression.md, docs/research/gamification-patterns.md, docs/ux/navigation.md

The profile page needs a streak counter display (navigation.md: "Streak counter"), and the dashboard could show it too. StreakService (T-2026-027) provides the data but there is no visual component for displaying streak information.

Acceptance criteria:
- [ ] `StreakBadgeComponent` at `src/app/shared/components/streak-badge/`
- [ ] Selector: `nx-streak-badge`
- [ ] Inputs: `currentStreak` (number), `multiplier` (number)
- [ ] Displays: flame/streak icon, current streak day count, multiplier percentage (e.g., "+30%")
- [ ] Visual states: no streak (dim), active streak (glowing), max streak 5+ days (Solar Gold glow)
- [ ] Accessible: aria-label describes streak status
- [ ] Exported from shared components barrel
- [ ] Unit tests for: rendering at each state, multiplier display, aria-label

### T-2026-158
- Title: Create WireDrawService for wire-drawing interaction mechanics
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: M
- Milestone: P1
- Depends: T-2026-054
- Blocked-by: —
- Tags: minigame-framework, interaction, service
- Refs: docs/minigames/04-signal-corps.md, docs/minigames/07-power-grid.md

Signal Corps and Power Grid use wire-drawing mechanics (click source port, draw line, click target port) that differ from spatial drag-and-drop. This service provides a reusable wire-drawing interaction system separate from DragDropService.

Acceptance criteria:
- [ ] `WireDrawService` at `src/app/core/minigame/wire-draw.service.ts`
- [ ] Supports click-to-start-wire, visual line preview, click-to-connect interaction model
- [ ] Port registration/unregistration for source and target endpoints
- [ ] Connection validation via configurable predicate
- [ ] Keyboard accessible: Tab between ports, Enter to start/complete wire
- [ ] Unit tests for: wire initiation, connection acceptance/rejection, keyboard support

### T-2026-159
- Title: Create LevelResultsComponent for post-level completion display
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: M
- Milestone: P1
- Depends: T-2026-018, T-2026-028, T-2026-045, T-2026-113
- Blocked-by: —
- Tags: ui, component, minigame-framework, level-completion
- Refs: docs/ux/navigation.md, docs/ux/visual-style.md, docs/progression.md

Navigation.md specifies "Level completion overlay" as an element of the Minigame Play screen. MinigameShell (T-2026-018) has a basic completion overlay, but it lacks a detailed results display. This component shows the full post-level experience: star rating earned, XP breakdown (base + perfect bonus + streak bonus), comparison to previous best score, and navigation options (next level, replay, quit to level select).

Acceptance criteria:
- [ ] `LevelResultsComponent` at `src/app/shared/components/level-results/`
- [ ] Selector: `nx-level-results`
- [ ] Inputs: `result` (MinigameResult), `previousBest` (number | null), `xpAwarded` (number), `bonuses` (array of {label, amount})
- [ ] Displays: star rating (using LevelStarsComponent), score with comparison to previous best, XP breakdown list
- [ ] "New Best!" badge when score exceeds previous best
- [ ] Action buttons: "Next Level" (emits `nextLevel`), "Replay" (emits `replay`), "Level Select" (emits `quit`)
- [ ] "Next Level" button disabled if next level is locked
- [ ] Station-themed styling with celebratory glow on perfect scores
- [ ] Respects `prefers-reduced-motion`
- [ ] Exported from shared components barrel
- [ ] Unit tests for: score display, XP breakdown rendering, new best detection, button events, disabled next level

### T-2026-160
- Title: Create ExpressionBuilderComponent for condition/formula editing
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: M
- Milestone: P1
- Depends: T-2026-007
- Blocked-by: —
- Tags: ui, component, minigame-framework, expression-builder
- Refs: docs/minigames/03-flow-commander.md, docs/minigames/09-reactor-core.md

Flow Commander spec says "Condition editor starts as a dropdown builder, graduates to raw expression input at advanced levels." Reactor Core uses "expression builder for computed node formulas." This shared component provides a visual expression builder for minigames that need user-authored conditions or formulas, with two modes: guided (dropdowns for operands/operators) and raw (free-text input with validation).

Acceptance criteria:
- [ ] `ExpressionBuilderComponent` at `src/app/shared/components/expression-builder/`
- [ ] Selector: `nx-expression-builder`
- [ ] Input: `mode` ('guided' | 'raw'), `variables` (string[] of available variable names), `operators` (string[] of available operators)
- [ ] Input: `value` (string, current expression), Output: `valueChange` (string, two-way bindable)
- [ ] Guided mode: dropdown for left operand, operator dropdown, right operand (value or variable dropdown)
- [ ] Raw mode: text input with syntax validation feedback
- [ ] Output: `expressionChange` emitting the validated expression string
- [ ] Validation: highlights invalid expressions with error message
- [ ] Keyboard accessible: Tab through dropdowns and inputs
- [ ] Exported from shared components barrel
- [ ] Unit tests for: guided mode assembly, raw mode input, validation feedback, mode switching

### T-2026-161
- Title: Create DegradationAlertComponent for spaced repetition notifications
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P1
- Depends: T-2026-023, T-2026-034, T-2026-007
- Blocked-by: —
- Tags: ui, component, spaced-repetition, dashboard
- Refs: docs/ux/navigation.md, docs/progression.md

Navigation.md lists "Spaced repetition alerts (degrading topics)" as a dashboard element. SpacedRepetitionService (T-2026-023) tracks degradation, but there is no visual component to display degradation alerts. This component shows a list of topics losing mastery stars with a "Practice Now" action.

Acceptance criteria:
- [ ] `DegradationAlertComponent` at `src/app/shared/components/degradation-alert/`
- [ ] Selector: `nx-degradation-alert`
- [ ] Input: `degradingTopics` (array of {topicId, topicName, currentMastery, effectiveMastery, daysSinceLastPractice})
- [ ] Displays each degrading topic with: topic name, mastery star difference (e.g., "3 -> 2"), days since last practice
- [ ] "Practice Now" button per topic emits `practiceRequested` with topicId
- [ ] Empty state: hidden when no topics are degrading
- [ ] Compact variant for dashboard sidebar, full variant for profile page
- [ ] Warning styling: Alert Orange border, dimming animation on mastery stars
- [ ] Exported from shared components barrel
- [ ] Unit tests for: topic list rendering, empty state hidden, practice event emission

### T-2026-162
- Title: Integrate PauseMenuComponent with MinigameShell pause state
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P1
- Depends: T-2026-135, T-2026-018
- Blocked-by: —
- Tags: integration, minigame-framework, pause
- Refs: docs/ux/navigation.md, docs/minigames/TEMPLATE.md

MinigameShell (T-2026-018) has a pause overlay and PauseMenuComponent (T-2026-135) provides the menu UI, but they are not connected. The shell's pause overlay needs to render PauseMenuComponent, and the menu's events (resume, restart, quit) need to drive the shell's state machine and engine lifecycle.

Acceptance criteria:
- [ ] MinigameShell's pause overlay replaced with `<nx-pause-menu>` component
- [ ] PauseMenuComponent `resume` event calls engine.resume() and hides overlay
- [ ] PauseMenuComponent `restart` event calls engine.reset() and restarts current level
- [ ] PauseMenuComponent `quit` event navigates to level select page (`/minigames/:gameId`)
- [ ] Escape key toggles pause state (already in shell, verify it triggers menu correctly)
- [ ] Unit tests for: pause->menu display, resume restores game, restart resets level, quit navigates

### T-2026-163
- Title: Create MinigameTutorialOverlayComponent for first-time play instructions
- Status: todo
- Assigned: unassigned
- Priority: low
- Size: S
- Milestone: P1
- Depends: T-2026-018, T-2026-007
- Blocked-by: —
- Tags: ui, component, minigame-framework, tutorial, onboarding
- Refs: docs/research/gamification-patterns.md, docs/ux/visual-style.md

Gamification research specifies "progressive disclosure -- don't show everything at once." Each minigame has unique controls and mechanics. When a player launches a minigame for the first time, a tutorial overlay should explain the controls and objective. Subsequent plays skip it (or offer a "How to Play" button in the pause menu).

Acceptance criteria:
- [ ] `MinigameTutorialOverlayComponent` at `src/app/shared/components/minigame-tutorial/`
- [ ] Selector: `nx-minigame-tutorial`
- [ ] Input: `gameId` (MinigameId), `steps` (array of {title, description, image?})
- [ ] Multi-step tutorial with next/previous/skip navigation
- [ ] Step indicator (dots or numbers showing current step)
- [ ] "Don't show again" checkbox that persists per-game via StatePersistenceService
- [ ] Shown automatically on first play, accessible via pause menu "How to Play" on subsequent plays
- [ ] Exported from shared components barrel
- [ ] Unit tests for: step navigation, skip button, persistence of "don't show again" flag

### T-2026-164
- Title: Create XpDiminishingReturnsService for replay XP scaling
- Status: todo
- Assigned: unassigned
- Priority: low
- Size: S
- Milestone: P1
- Depends: T-2026-021, T-2026-020
- Blocked-by: —
- Tags: progression, xp, replay, service
- Refs: docs/research/gamification-patterns.md, docs/progression.md

Gamification research says "Players can replay easier levels for XP but get diminishing returns." Currently XpService awards the same XP regardless of how many times a level is replayed. This service tracks replay counts and applies a diminishing multiplier to prevent XP farming from repeated easy level completions.

Acceptance criteria:
- [ ] `XpDiminishingReturnsService` at `src/app/core/progression/xp-diminishing-returns.service.ts`
- [ ] `getReplayMultiplier(gameId, levelId)`: returns multiplier (1.0 first play, 0.5 second, 0.25 third, 0.1 fourth+)
- [ ] Tracks completion count per level via a Map
- [ ] First completion always awards full XP
- [ ] Improving star rating (e.g., 2->3 stars) awards full XP for the improvement delta, not diminished
- [ ] Persisted via StatePersistenceService
- [ ] Unit tests for: first play full XP, diminishing scale, improvement exception, persistence

### T-2026-165
- Title: Create barrel exports for audio and animation core modules
- Status: todo
- Assigned: unassigned
- Priority: low
- Size: S
- Milestone: P1
- Depends: T-2026-051, T-2026-052
- Blocked-by: —
- Tags: infrastructure, barrel-export, conventions
- Refs: src/app/core/audio/, src/app/core/animation/

AudioService (T-2026-051) and AnimationService (T-2026-052) will create files in `src/app/core/audio/` and `src/app/core/animation/` but neither ticket creates barrel exports. Per project conventions, each core subdirectory needs an `index.ts` barrel. These barrels should be created after the services are implemented and included in the root core barrel (T-2026-126).

Acceptance criteria:
- [ ] `src/app/core/audio/index.ts` exports AudioService and SoundEffect enum
- [ ] `src/app/core/animation/index.ts` exports AnimationService, animation triggers, ANIMATION_DURATIONS
- [ ] Both barrels included in `src/app/core/index.ts` re-exports (depends on T-2026-126)
- [ ] Build passes with no circular dependencies

### T-2026-169
- Title: Add test coverage threshold enforcement to CI pipeline
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P1
- Depends: T-2026-006, T-2026-004
- Blocked-by: —
- Tags: ci, testing, infrastructure, quality
- Refs: .github/workflows/ci.yml, vitest.config.ts

The project uses Vitest with coverage configured (T-2026-004) and has a CI pipeline (T-2026-006), but there is no enforcement of minimum coverage thresholds in CI. As the codebase grows, coverage could silently regress. This ticket adds coverage threshold checks that fail the CI build if coverage drops below the configured minimum.

Acceptance criteria:
- [ ] Vitest config updated with coverage thresholds: statements 80%, branches 75%, functions 80%, lines 80%
- [ ] CI test job updated to run with `--coverage` flag
- [ ] CI fails if coverage falls below thresholds
- [ ] Coverage report output visible in CI job logs
- [ ] Thresholds documented in project CLAUDE.md conventions section

### T-2026-170
- Title: Create global ErrorHandler integration for uncaught errors
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P1
- Depends: T-2026-131
- Blocked-by: —
- Tags: error-handling, infrastructure, service
- Refs: docs/ux/visual-style.md

There is no global error handling strategy. Angular's default ErrorHandler logs to console but provides no user-facing feedback. When a minigame engine throws, a service fails, or lazy loading breaks, users see nothing. This ticket creates a custom ErrorHandler that logs errors and optionally shows user-facing feedback via ErrorStateComponent.

Acceptance criteria:
- [ ] `GlobalErrorHandler` at `src/app/core/error/global-error-handler.ts`
- [ ] Extends Angular's `ErrorHandler`
- [ ] Logs all uncaught errors to console with structured format (timestamp, source, stack)
- [ ] Provides `lastError` signal that components can read for user-facing display
- [ ] Registered as `{ provide: ErrorHandler, useClass: GlobalErrorHandler }` in app.config.ts
- [ ] `src/app/core/error/index.ts` barrel export created
- [ ] Unit tests for: error capture, signal update, structured logging

### T-2026-172
- Title: Create SvgWireRendererComponent for SVG bezier curve wire rendering
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: M
- Milestone: P1
- Depends: T-2026-158, T-2026-007
- Blocked-by: —
- Tags: ui, component, minigame-framework, svg, wire-rendering
- Refs: docs/minigames/02-wire-protocol.md, docs/minigames/04-signal-corps.md, docs/minigames/07-power-grid.md, docs/minigames/09-reactor-core.md

Wire Protocol, Signal Corps, Power Grid, and Reactor Core all render wires/connections as SVG paths. Wire Protocol spec says "SVG wire rendering with bezier curves and flowing particle animation." Power Grid says "Draw power lines." Reactor Core says "draw dependency wires." A shared SVG wire rendering component prevents each minigame from reimplementing bezier curve rendering.

Acceptance criteria:
- [ ] `SvgWireRendererComponent` at `src/app/shared/components/svg-wire-renderer/`
- [ ] Selector: `nx-svg-wire-renderer`
- [ ] Input: `wires` (array of {id, startX, startY, endX, endY, color, animated})
- [ ] Renders SVG bezier curves between start and end points
- [ ] Color-coded wires (configurable per wire)
- [ ] Optional flowing particle animation on connected wires (CSS keyframes on SVG dash-offset)
- [ ] Respects `prefers-reduced-motion` (disables particle animation)
- [ ] Handles dynamic wire addition/removal without full re-render
- [ ] Exported from shared components barrel
- [ ] Unit tests for: wire rendering, color application, animation toggle, dynamic updates

### T-2026-174
- Title: Create TimeFormatPipe for play time display
- Status: todo
- Assigned: unassigned
- Priority: low
- Size: S
- Milestone: P1
- Depends: —
- Blocked-by: —
- Tags: pipe, shared, ui, time-formatting
- Refs: docs/ux/navigation.md, src/app/shared/pipes/

Navigation.md profile page specifies "Play time stats." The profile page (T-2026-079) and speed run pages (T-2026-156) need formatted time display (e.g., "2h 15m", "3:42.5", "00:45"). The shared/pipes barrel is currently empty. This pipe formats seconds into human-readable time strings.

Acceptance criteria:
- [ ] `TimeFormatPipe` at `src/app/shared/pipes/time-format.pipe.ts`
- [ ] Selector: `timeFormat`
- [ ] Input: number (seconds)
- [ ] Input: format ('long' | 'short' | 'timer'), default 'long'
- [ ] Long format: "2h 15m 30s" (omits zero units)
- [ ] Short format: "2:15:30" (zero-padded)
- [ ] Timer format: "03:42.5" (mm:ss.d for sub-minute, hh:mm:ss for longer)
- [ ] Handles 0 seconds as "0s" / "0:00" / "00:00.0"
- [ ] Exported from shared pipes barrel
- [ ] Unit tests for: all three formats, edge cases (0, sub-minute, multi-hour)

### T-2026-175
- Title: Integrate LevelResultsComponent with MinigameShell completion flow
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P1
- Depends: T-2026-159, T-2026-162, T-2026-018
- Blocked-by: —
- Tags: integration, minigame-framework, level-completion, ui
- Refs: docs/ux/navigation.md

LevelResultsComponent (T-2026-159) provides the post-level display and MinigameShell (T-2026-018) has a completion overlay. This integration ticket wires them together: when the engine signals completion, the shell transitions to the results view, passing score/XP data, and the results component's navigation events (next/replay/quit) drive shell behavior.

Acceptance criteria:
- [ ] MinigameShell's completion overlay renders `<nx-level-results>` component
- [ ] LevelCompletionService result data piped into LevelResultsComponent inputs
- [ ] "Next Level" event loads the next level via LevelLoaderService and resets engine
- [ ] "Replay" event resets engine with same level data
- [ ] "Level Select" event navigates to `/minigames/:gameId`
- [ ] Previous best score loaded from LevelProgressionService for comparison
- [ ] Unit tests for: results display on completion, next level loading, replay reset, navigation

### T-2026-180
- Title: Scaffold features/minigames directory structure
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: S
- Milestone: P1
- Depends: —
- Blocked-by: —
- Tags: infrastructure, scaffolding, directory-structure
- Refs: docs/minigames/TEMPLATE.md

All P2+ minigame engine and UI tickets reference `src/app/features/minigames/<game-name>/` but no ticket creates this directory hierarchy. Without it, the first P2 minigame ticket will need to create it ad-hoc, violating separation of concerns.

Acceptance criteria:
- [ ] `src/app/features/` directory created
- [ ] `src/app/features/minigames/` directory created with subdirectories for all 12 minigames: `module-assembly/`, `wire-protocol/`, `flow-commander/`, `signal-corps/`, `corridor-runner/`, `terminal-hack/`, `power-grid/`, `data-relay/`, `reactor-core/`, `deep-space-radio/`, `system-certification/`, `blast-doors/`
- [ ] Each subdirectory contains an empty `index.ts` barrel export (`export {};`)
- [ ] Root barrel `src/app/features/index.ts` created (empty for now)
- [ ] Build passes with the new empty directories

### T-2026-181
- Title: Scaffold data directory structure for levels, missions, and tutorials
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: S
- Milestone: P1
- Depends: —
- Blocked-by: —
- Tags: infrastructure, scaffolding, directory-structure
- Refs: docs/curriculum.md, docs/minigames/TEMPLATE.md

All level data tickets reference `src/app/data/levels/`, story mission tickets reference `src/app/data/missions/phase-N/`, and tutorial tickets reference `src/app/data/tutorials/`. No ticket creates this directory structure.

Acceptance criteria:
- [ ] `src/app/data/` directory created
- [ ] `src/app/data/levels/` directory created (empty, will be populated by level data tickets)
- [ ] `src/app/data/missions/` directory created with phase subdirectories: `phase-1/` through `phase-6/`
- [ ] `src/app/data/tutorials/` directory created
- [ ] Root barrel `src/app/data/index.ts` created (empty for now)
- [ ] Build passes

### T-2026-182
- Title: Create LevelNavigationService for next/previous level resolution
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P1
- Depends: T-2026-030, T-2026-020
- Blocked-by: —
- Tags: minigame-framework, levels, navigation, service
- Refs: docs/ux/navigation.md, src/app/core/levels/level-loader.service.ts

LevelResultsComponent (T-2026-159) has a "Next Level" button and LevelSelectPage (T-2026-077) needs to highlight the next playable level. But there is no service that resolves what the next or previous level is given a gameId and current levelId, accounting for tier ordering and unlock status. LevelLoaderService loads data but does not provide navigation.

Acceptance criteria:
- [ ] `LevelNavigationService` at `src/app/core/levels/level-navigation.service.ts`
- [ ] `getNextLevel(gameId, currentLevelId)`: returns the next LevelDefinition or null if at end
- [ ] `getPreviousLevel(gameId, currentLevelId)`: returns the previous LevelDefinition or null if at start
- [ ] `isNextLevelUnlocked(gameId, currentLevelId)`: checks if the next level is unlocked via LevelProgressionService
- [ ] Respects tier ordering: Basic 1-6 -> Intermediate 7-12 -> Advanced 13-17 -> Boss 18
- [ ] Exported from levels barrel
- [ ] Unit tests for: next level resolution, previous level, end-of-game null, cross-tier navigation, unlock check

### T-2026-183
- Title: Create LevelFailedComponent for post-failure display
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P1
- Depends: T-2026-018, T-2026-007
- Blocked-by: —
- Tags: ui, component, minigame-framework, level-failure
- Refs: docs/ux/navigation.md, docs/ux/visual-style.md

MinigameShell has a failure overlay, but it lacks a rich UI component for the lose state. The failure experience should show what went wrong, offer a retry option, and optionally suggest using a hint. This mirrors LevelResultsComponent (T-2026-159) for the win state.

Acceptance criteria:
- [ ] `LevelFailedComponent` at `src/app/shared/components/level-failed/`
- [ ] Selector: `nx-level-failed`
- [ ] Inputs: `reason` (string, e.g., "3 strikes", "Time expired", "Hull breached"), `score` (number, partial score achieved), `hintsAvailable` (boolean)
- [ ] Action buttons: "Retry" (emits `retry`), "Use Hint" (emits `useHint`, visible only when hintsAvailable), "Level Select" (emits `quit`)
- [ ] Station-themed styling with Emergency Red accent
- [ ] Respects `prefers-reduced-motion`
- [ ] Exported from shared components barrel
- [ ] Unit tests for: reason display, retry event, hint button visibility, quit event

### T-2026-184
- Title: Integrate ComboTrackerService with MinigameEngine base class
- Status: todo
- Assigned: unassigned
- Priority: low
- Size: S
- Milestone: P1
- Depends: T-2026-056, T-2026-017
- Blocked-by: —
- Tags: integration, minigame-framework, combo, scoring
- Refs: docs/minigames/01-module-assembly.md, docs/minigames/02-wire-protocol.md

ComboTrackerService (T-2026-056) provides combo multiplier mechanics, but no ticket wires it into the MinigameEngine lifecycle. The base engine class should expose an optional combo tracker that subclass engines can use, resetting it on level start and factoring the multiplier into score calculation.

Acceptance criteria:
- [ ] MinigameEngine base class accepts optional ComboTrackerService injection
- [ ] `recordCorrectAction()` on engine delegates to ComboTrackerService.recordCorrect()
- [ ] `recordIncorrectAction()` on engine delegates to ComboTrackerService.recordIncorrect()
- [ ] Combo resets when a new level starts (via engine.reset())
- [ ] `getComboMultiplier()` accessor for subclass engines to use in scoring
- [ ] Unit tests for: combo tracking through engine, reset on new level, multiplier access

### T-2026-185
- Title: Integrate XpDiminishingReturnsService with LevelCompletionService
- Status: todo
- Assigned: unassigned
- Priority: low
- Size: S
- Milestone: P1
- Depends: T-2026-164, T-2026-113
- Blocked-by: —
- Tags: integration, progression, xp, diminishing-returns
- Refs: docs/research/gamification-patterns.md, src/app/core/minigame/level-completion.service.ts

XpDiminishingReturnsService (T-2026-164) tracks replay counts and calculates diminished XP multipliers, but no ticket wires it into the LevelCompletionService facade. Without this integration, replaying easy levels always awards full XP.

Acceptance criteria:
- [ ] LevelCompletionService injects XpDiminishingReturnsService
- [ ] `completeLevel()` applies the diminishing returns multiplier to the base XP before awarding
- [ ] First completion of any level always gets full XP (multiplier = 1.0)
- [ ] Improvement completions (higher star rating) get full XP for the delta
- [ ] LevelCompletionSummary includes `replayMultiplier` field
- [ ] Unit tests for: first play full XP, diminished replay XP, improvement exception

### T-2026-186
- Title: Integrate LevelFailedComponent with MinigameShell failure overlay
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P1
- Depends: T-2026-183, T-2026-018
- Blocked-by: —
- Tags: integration, minigame-framework, level-failure, ui
- Refs: docs/ux/navigation.md

LevelFailedComponent (T-2026-183) provides the failure UI and MinigameShell (T-2026-018) has a failure overlay. This integration ticket wires them together so that when the engine status changes to Lost, the shell renders the failure component with the correct reason, and the component's events (retry, hint, quit) drive shell behavior.

Acceptance criteria:
- [ ] MinigameShell's failure overlay renders `<nx-level-failed>` component
- [ ] Failure reason derived from engine state (e.g., lives === 0 -> "3 strikes", timeRemaining === 0 -> "Time expired")
- [ ] "Retry" event resets engine with same level data
- [ ] "Use Hint" event registers a hint via HintService, then retries
- [ ] "Level Select" event navigates to `/minigames/:gameId`
- [ ] Unit tests for: failure display, retry reset, hint integration, navigation

### T-2026-201
- Title: Add ComboTrackerService to minigame barrel export
- Status: todo
- Assigned: unassigned
- Priority: low
- Size: S
- Milestone: P1
- Depends: T-2026-056
- Blocked-by: —
- Tags: infrastructure, barrel-export, conventions
- Refs: src/app/core/minigame/index.ts

ComboTrackerService (T-2026-056) will create `combo-tracker.service.ts` in the minigame directory but no ticket adds it to the minigame barrel export (`src/app/core/minigame/index.ts`). Per project conventions, all services should be exported from their directory barrel.

Acceptance criteria:
- [ ] `src/app/core/minigame/index.ts` updated to export `ComboTrackerService` and `comboMultiplier` thresholds
- [ ] Build passes with updated barrel
- [ ] At least one consumer can import from `'./core/minigame'` barrel path

### T-2026-202
- Title: Add WireDrawService to minigame barrel export
- Status: todo
- Assigned: unassigned
- Priority: low
- Size: S
- Milestone: P1
- Depends: T-2026-158
- Blocked-by: —
- Tags: infrastructure, barrel-export, conventions
- Refs: src/app/core/minigame/index.ts

WireDrawService (T-2026-158) will create `wire-draw.service.ts` in the minigame directory but no ticket adds it to the minigame barrel export.

Acceptance criteria:
- [ ] `src/app/core/minigame/index.ts` updated to export `WireDrawService`
- [ ] Build passes with updated barrel

### T-2026-203
- Title: Create SvgPortComponent for wire endpoint rendering
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P1
- Depends: T-2026-007
- Blocked-by: —
- Tags: ui, component, minigame-framework, svg, wire-rendering
- Refs: docs/minigames/02-wire-protocol.md, docs/minigames/04-signal-corps.md, docs/minigames/07-power-grid.md, docs/minigames/09-reactor-core.md

Wire Protocol, Signal Corps, Power Grid, and Reactor Core all have interactive connection ports (source and target endpoints for wires). These ports need consistent styling: color-coded circles, hover glow, active state indication, and accessible keyboard focus indicators. A shared port component prevents each minigame from reimplementing port rendering.

Acceptance criteria:
- [ ] `SvgPortComponent` at `src/app/shared/components/svg-port/`
- [ ] Selector: `nx-svg-port`
- [ ] Inputs: `portId` (string), `x` (number), `y` (number), `color` (string), `label` (string), `type` ('source' | 'target'), `isActive` (boolean), `isConnected` (boolean)
- [ ] Renders an SVG circle at (x, y) with color fill and optional label
- [ ] Active state: pulsing glow ring (indicates "currently drawing wire from this port")
- [ ] Connected state: solid fill with checkmark or dot indicator
- [ ] Hover state: enlarged circle with border glow
- [ ] Keyboard accessible: focusable, Enter to activate
- [ ] Exported from shared components barrel
- [ ] Unit tests for: rendering, active state, connected state, hover, keyboard activation

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
- Depends: T-2026-063, T-2026-018, T-2026-158, T-2026-172
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
- Depends: T-2026-071, T-2026-018, T-2026-158, T-2026-172
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

### T-2026-137
- Title: Register Module Assembly level data with LevelLoaderService
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: S
- Milestone: P2
- Depends: T-2026-058, T-2026-030
- Blocked-by: —
- Tags: minigame, module-assembly, level-data, integration
- Refs: docs/minigames/01-module-assembly.md, src/app/core/levels/level-loader.service.ts

The Module Assembly level data file (T-2026-058) defines the 18 levels, and LevelLoaderService (T-2026-030) provides the loading API. The level data must be registered with LevelLoaderService so levels can be loaded by the minigame engine and level select page.

Acceptance criteria:
- [ ] Module Assembly level pack registered with LevelLoaderService via its `registerLevelPack()` method
- [ ] Registration happens at app initialization or on first access (lazy)
- [ ] `LevelLoaderService.loadLevel('module-assembly', levelId)` returns the correct level data
- [ ] `LevelLoaderService.getLevelPack('module-assembly')` returns all 18 levels grouped by tier
- [ ] Unit tests for: level loading by ID, level pack retrieval, tier grouping

### T-2026-138
- Title: Register Wire Protocol level data with LevelLoaderService
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: S
- Milestone: P2
- Depends: T-2026-062, T-2026-030
- Blocked-by: —
- Tags: minigame, wire-protocol, level-data, integration
- Refs: docs/minigames/02-wire-protocol.md, src/app/core/levels/level-loader.service.ts

Register Wire Protocol level data with LevelLoaderService so levels can be loaded by the minigame engine and level select page.

Acceptance criteria:
- [ ] Wire Protocol level pack registered with LevelLoaderService
- [ ] `LevelLoaderService.loadLevel('wire-protocol', levelId)` returns correct level data
- [ ] `LevelLoaderService.getLevelPack('wire-protocol')` returns all 18 levels grouped by tier
- [ ] Unit tests for: level loading by ID, level pack retrieval

### T-2026-139
- Title: Register Flow Commander level data with LevelLoaderService
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: S
- Milestone: P2
- Depends: T-2026-066, T-2026-030
- Blocked-by: —
- Tags: minigame, flow-commander, level-data, integration
- Refs: docs/minigames/03-flow-commander.md, src/app/core/levels/level-loader.service.ts

Register Flow Commander level data with LevelLoaderService so levels can be loaded by the minigame engine and level select page.

Acceptance criteria:
- [ ] Flow Commander level pack registered with LevelLoaderService
- [ ] `LevelLoaderService.loadLevel('flow-commander', levelId)` returns correct level data
- [ ] `LevelLoaderService.getLevelPack('flow-commander')` returns all 18 levels grouped by tier
- [ ] Unit tests for: level loading by ID, level pack retrieval

### T-2026-140
- Title: Register Signal Corps level data with LevelLoaderService
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: S
- Milestone: P2
- Depends: T-2026-070, T-2026-030
- Blocked-by: —
- Tags: minigame, signal-corps, level-data, integration
- Refs: docs/minigames/04-signal-corps.md, src/app/core/levels/level-loader.service.ts

Register Signal Corps level data with LevelLoaderService so levels can be loaded by the minigame engine and level select page.

Acceptance criteria:
- [ ] Signal Corps level pack registered with LevelLoaderService
- [ ] `LevelLoaderService.loadLevel('signal-corps', levelId)` returns correct level data
- [ ] `LevelLoaderService.getLevelPack('signal-corps')` returns all 18 levels grouped by tier
- [ ] Unit tests for: level loading by ID, level pack retrieval

### T-2026-141
- Title: Create CampaignProgressPage for story mission overview
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: M
- Milestone: P2
- Depends: T-2026-026, T-2026-038, T-2026-055
- Blocked-by: —
- Tags: story-missions, page, component, ui, campaign
- Refs: docs/ux/navigation.md, docs/curriculum.md

The side nav has a "Current Mission" link and the dashboard shows an "Active story mission prompt." But there is no dedicated page to view all story missions across all 6 curriculum phases with their completion status, locked/unlocked state, and narrative context. Navigation.md's route structure lists `/mission/:chapterId` for individual missions but lacks an index view.

Acceptance criteria:
- [ ] `CampaignPage` at `src/app/pages/campaign/campaign.ts`
- [ ] Route `/campaign` added to `app.routes.ts` with lazy loading
- [ ] Displays all 34 missions grouped by curriculum phase (Foundations, Navigation, Data Input, etc.)
- [ ] Each mission shows: chapter number, title, Angular topic, completion status, locked state
- [ ] Completed missions show a checkmark; locked missions use LockedContentComponent
- [ ] Next available mission is highlighted with "Continue" button
- [ ] Phase headers show progress (e.g., "Phase 1: 7/10 completed")
- [ ] Click unlocked mission navigates to `/mission/:chapterId`
- [ ] Side nav "Current Mission" link updated to point to `/campaign`
- [ ] Unit tests for: phase grouping, completion status, locked state, navigation

### T-2026-142
- Title: Create P2 end-to-end smoke test for full game loop
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: M
- Milestone: P2
- Depends: T-2026-061, T-2026-075, T-2026-076, T-2026-077
- Blocked-by: —
- Tags: testing, e2e, integration, game-loop
- Refs: docs/overview.md, playwright.config.ts

The core game loop (overview.md) is: Story Mission -> Unlock Minigame -> Master Minigame -> Next Story Mission. No e2e test validates this end-to-end flow. This ticket creates a Playwright test that exercises the full loop with Module Assembly as the test minigame.

Acceptance criteria:
- [ ] Playwright test at `e2e/game-loop.spec.ts`
- [ ] Test flow: Dashboard -> Campaign -> Mission 1 -> Complete mission -> Navigate to Minigame Hub -> Module Assembly unlocked -> Level Select -> Play Level 1 -> Complete level -> XP awarded -> Return to level select
- [ ] Verifies: mission completion state persists, minigame unlocks after mission, XP bar updates, level stars display after completion
- [ ] Test runs in CI (GitHub Actions)
- [ ] Does not require manual interaction (uses programmatic data setup or test fixtures)

### T-2026-143
- Title: Wire SettingsPage theme preference to document body class
- Status: todo
- Assigned: unassigned
- Priority: low
- Size: S
- Milestone: P2
- Depends: T-2026-080, T-2026-039
- Blocked-by: —
- Tags: settings, theme, integration, ui
- Refs: docs/ux/navigation.md, docs/ux/visual-style.md

SettingsService (T-2026-039) stores a theme preference and SettingsPage (T-2026-080) provides the UI. But changing the theme preference doesn't actually apply it to the document. This ticket wires the theme setting to the document body class so CSS custom properties switch themes.

Acceptance criteria:
- [ ] App component (or a root-level effect) reads `SettingsService.settings().theme` and applies class to `document.body`
- [ ] Classes: `theme-dark` (default), `theme-station`, `theme-light`
- [ ] CSS custom properties are scoped to theme classes in `styles.scss` (or a dedicated `themes.scss`)
- [ ] Theme persists across page reloads (already handled by SettingsService auto-save)
- [ ] Unit tests for: body class updates when theme changes, correct class per theme value

### T-2026-166
- Title: Create StoryMissionContentService for loading and parsing mission content
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: S
- Milestone: P2
- Depends: T-2026-074, T-2026-038
- Blocked-by: —
- Tags: story-missions, service, content-loading
- Refs: docs/curriculum.md, docs/ux/navigation.md

T-2026-074 defines the story mission content data, and T-2026-075 (StoryMissionPage) needs to load it. But there is no service ticket for loading, parsing, and providing mission content by chapterId. StoryMissionPage should not import static data directly -- a service layer provides testability and future extensibility (e.g., lazy loading mission content).

Acceptance criteria:
- [ ] `StoryMissionContentService` at `src/app/core/curriculum/story-mission-content.service.ts`
- [ ] `getMissionContent(chapterId: number)`: returns StoryMissionContent for a chapter
- [ ] `getMissionStepCount(chapterId: number)`: returns number of steps in a mission
- [ ] `isMissionComplete(chapterId: number)`: checks if all steps have been viewed/completed
- [ ] `completeMissionStep(chapterId, stepIndex)`: marks a step as completed
- [ ] Integrates with GameProgressionService for completion tracking
- [ ] Exported from curriculum barrel
- [ ] Unit tests for: content loading by ID, step completion tracking, mission complete detection

### T-2026-167
- Title: Add campaign route to app.routes.ts
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P2
- Depends: T-2026-012
- Blocked-by: —
- Tags: routing, campaign, infrastructure
- Refs: docs/ux/navigation.md, src/app/app.routes.ts

T-2026-141 creates CampaignProgressPage but doesn't explicitly mention adding the route to app.routes.ts. The current routes file has no `/campaign` route. This ticket adds the route stub so T-2026-141 can focus on the page component itself.

Acceptance criteria:
- [ ] Route `/campaign` added to `app.routes.ts` with lazy-loaded CampaignPage
- [ ] Placeholder `CampaignPage` component at `src/app/pages/campaign/campaign.ts`
- [ ] Placeholder displays "Campaign" heading with route title
- [ ] Side nav "Current Mission" link updated from `/mission/:chapterId` to `/campaign`
- [ ] Unit test for: route resolution, component creation

### T-2026-168
- Title: Create MinigameInstructionsData for all P2 minigame tutorial content
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P2
- Depends: T-2026-163, T-2026-058, T-2026-062, T-2026-066, T-2026-070
- Blocked-by: —
- Tags: content, tutorial, minigame, data
- Refs: docs/minigames/01-module-assembly.md, docs/minigames/02-wire-protocol.md, docs/minigames/03-flow-commander.md, docs/minigames/04-signal-corps.md

Each minigame spec includes a "Controls" section detailing the interaction model. This ticket creates the tutorial step data for the 4 P2 minigames (Module Assembly, Wire Protocol, Flow Commander, Signal Corps) so MinigameTutorialOverlayComponent can display first-time play instructions.

Acceptance criteria:
- [ ] Tutorial data file at `src/app/data/tutorials/minigame-tutorials.data.ts`
- [ ] `MinigameTutorialData` interface: gameId, steps (title, description)
- [ ] Module Assembly tutorial: 3-4 steps covering drag-from-belt, slot matching, decoy rejection, keyboard shortcuts
- [ ] Wire Protocol tutorial: 3-4 steps covering source-target clicking, wire type selection, verification, wire removal
- [ ] Flow Commander tutorial: 3-4 steps covering gate placement, condition configuration, run/reset, item routing
- [ ] Signal Corps tutorial: 3-4 steps covering tower configuration, input/output declaration, parent wiring, deploy
- [ ] Unit tests for: all 4 games have tutorial data, each has 3-4 steps, required fields populated

### T-2026-171
- Title: Create accessibility audit ticket for WCAG 2.1 AA compliance
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: M
- Milestone: P2
- Depends: T-2026-076, T-2026-077, T-2026-078, T-2026-075
- Blocked-by: —
- Tags: accessibility, audit, a11y, quality
- Refs: docs/ux/visual-style.md, docs/ux/navigation.md

Multiple components have ARIA attributes and keyboard support (DraggableDirective, DropZoneDirective, MasteryStarsComponent, XpProgressBarComponent), but there is no comprehensive accessibility audit ticket. Once the P2 pages are built, a systematic audit should verify WCAG 2.1 AA compliance across all primary user flows.

Acceptance criteria:
- [ ] Audit all page components for: keyboard navigation, screen reader support, focus management
- [ ] Audit all minigame UIs for: keyboard alternatives to mouse interactions, ARIA live regions for score updates
- [ ] Verify color contrast ratios meet WCAG 2.1 AA (4.5:1 for text, 3:1 for large text)
- [ ] Verify all images/icons have alt text or aria-labels
- [ ] Verify focus trapping in overlays (pause menu, completion overlay, dialogs)
- [ ] Document findings as new tickets for any issues discovered
- [ ] Add axe-core or similar a11y testing library to CI for automated checks

### T-2026-173
- Title: Create OnboardingService for first-time user experience
- Status: todo
- Assigned: unassigned
- Priority: low
- Size: S
- Milestone: P2
- Depends: T-2026-024, T-2026-007
- Blocked-by: —
- Tags: onboarding, service, ux, progressive-disclosure
- Refs: docs/research/gamification-patterns.md, docs/ux/navigation.md

Gamification research says "Progressive disclosure -- don't show everything at once" and lists it as an anti-pattern to "show everything at once." A new player landing on the dashboard needs guidance: what to do first, how the game loop works, what the station represents. This service tracks which onboarding steps have been completed and drives tooltip/highlight displays.

Acceptance criteria:
- [ ] `OnboardingService` at `src/app/core/progression/onboarding.service.ts`
- [ ] `OnboardingStep` enum: welcome, firstMission, firstMinigame, firstLevelComplete, exploreHub, checkProfile
- [ ] `isStepCompleted(step)`: returns whether a step has been shown and dismissed
- [ ] `completeStep(step)`: marks a step as completed
- [ ] `nextPendingStep()`: returns the next incomplete onboarding step, or null if all done
- [ ] `isOnboardingComplete` computed signal: true when all steps are done
- [ ] Persisted via StatePersistenceService
- [ ] Exported from progression barrel
- [ ] Unit tests for: step completion, next pending step, persistence, onboarding complete detection

### T-2026-178
- Title: Create P2 minigame engine integration tests
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: M
- Milestone: P2
- Depends: T-2026-061, T-2026-065, T-2026-069, T-2026-073
- Blocked-by: —
- Tags: testing, integration, minigame, p2
- Refs: docs/minigames/01-module-assembly.md, docs/minigames/02-wire-protocol.md, docs/minigames/03-flow-commander.md, docs/minigames/04-signal-corps.md

Individual minigame engines and UIs have unit tests, but there are no integration tests verifying the engine-shell-level-data pipeline works end-to-end for each P2 minigame. These tests verify that: level data loads correctly into the engine, the engine produces correct state transitions, the shell displays the right overlays, and completion triggers progression updates.

Acceptance criteria:
- [ ] Integration test file per game: `module-assembly.integration.spec.ts`, etc. at `src/app/features/minigames/*/`
- [ ] Each test: creates engine with real level data (level 1), starts level, submits correct actions, verifies completion
- [ ] Each test: verifies MinigameShell state transitions (ready -> playing -> completed)
- [ ] Each test: verifies LevelCompletionService is called with correct result
- [ ] Each test: verifies score calculation produces expected values for known inputs
- [ ] All 4 P2 games covered: Module Assembly, Wire Protocol, Flow Commander, Signal Corps

### T-2026-187
- Title: Create MinigameCardComponent for minigame hub grid
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P2
- Depends: T-2026-034, T-2026-055, T-2026-007
- Blocked-by: —
- Tags: ui, component, minigame-hub, shared
- Refs: docs/ux/navigation.md, docs/ux/visual-style.md

MinigameHubPage (T-2026-076) renders a "grid of minigame cards" showing mastery stars, locked/unlocked state, and quick stats. The existing StationCardComponent is a generic sample component, not purpose-built for minigame display. A dedicated MinigameCardComponent encapsulates the minigame-specific card layout, which is reused in the dashboard quick-play shortcuts.

Acceptance criteria:
- [ ] `MinigameCardComponent` at `src/app/shared/components/minigame-card/`
- [ ] Selector: `nx-minigame-card`
- [ ] Inputs: `config` (MinigameConfig), `mastery` (number, 0-5), `levelsCompleted` (number), `totalLevels` (number), `isLocked` (boolean), `unlockMessage` (string)
- [ ] Displays: game name, Angular topic, MasteryStarsComponent, completion fraction (e.g., "12/18 levels")
- [ ] Locked state: uses LockedContentComponent wrapper with dimmed appearance
- [ ] Unlocked state: hover glow effect with accent color, clickable
- [ ] Output: `cardClicked` event with gameId
- [ ] Responsive: adapts width to grid container
- [ ] Exported from shared components barrel
- [ ] Unit tests for: locked/unlocked rendering, mastery stars, completion stats, click event

### T-2026-188
- Title: Create StepProgressComponent for story mission step indicator
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P2
- Depends: T-2026-007
- Blocked-by: —
- Tags: ui, component, story-missions, shared
- Refs: docs/ux/navigation.md

StoryMissionPage (T-2026-075) needs a "progress indicator (mission steps)" showing step X of Y. This is a reusable stepper component that displays progress through a sequence of steps with visual completion states.

Acceptance criteria:
- [ ] `StepProgressComponent` at `src/app/shared/components/step-progress/`
- [ ] Selector: `nx-step-progress`
- [ ] Inputs: `totalSteps` (number), `currentStep` (number), `completedSteps` (number[])
- [ ] Displays: connected dots/nodes for each step, current step highlighted (Reactor Blue), completed steps filled (Sensor Green), future steps dimmed
- [ ] Compact variant: just dots. Full variant: dots with step labels
- [ ] Accessible: role="progressbar", aria-valuenow, aria-valuemax
- [ ] Exported from shared components barrel
- [ ] Unit tests for: dot rendering per step, active step highlight, completed steps, ARIA attributes

### T-2026-189
- Title: Create MissionUnlockNotification for minigame unlock toast
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P2
- Depends: T-2026-032, T-2026-026
- Blocked-by: —
- Tags: ui, notification, story-missions, minigame-unlock
- Refs: docs/overview.md, docs/ux/visual-style.md

When a story mission is completed and unlocks a minigame (core game loop: Story Mission -> Unlock Minigame), no visual notification informs the player. XP notifications exist (T-2026-032), but minigame unlock is a separate, more significant event that deserves its own notification with the game name and an invitation to play.

Acceptance criteria:
- [ ] `MissionUnlockNotificationService` at `src/app/core/notifications/mission-unlock-notification.service.ts`
- [ ] `showUnlock(gameName: string, gameId: MinigameId)`: displays a toast notification for the unlocked minigame
- [ ] Notification includes: game name, "New Minigame Unlocked!" header, "Play Now" action link
- [ ] Uses XpNotificationComponent infrastructure or a similar toast pattern
- [ ] Auto-dismisses after 5 seconds, or on click
- [ ] GameProgressionService.completeMission() triggers this notification when a new minigame is unlocked
- [ ] Exported from notifications barrel
- [ ] Unit tests for: notification display, auto-dismiss, game name rendering

### T-2026-190
- Title: Create PhaseHeaderComponent for campaign page phase grouping
- Status: todo
- Assigned: unassigned
- Priority: low
- Size: S
- Milestone: P2
- Depends: T-2026-007
- Blocked-by: —
- Tags: ui, component, campaign, shared
- Refs: docs/ux/navigation.md, docs/curriculum.md

CampaignProgressPage (T-2026-141) groups missions by curriculum phase with "Phase headers showing progress (e.g., Phase 1: 7/10 completed)." A reusable phase header component encapsulates the phase name, description, and progress bar.

Acceptance criteria:
- [ ] `PhaseHeaderComponent` at `src/app/shared/components/phase-header/`
- [ ] Selector: `nx-phase-header`
- [ ] Inputs: `phaseNumber` (number), `phaseName` (string), `phaseDescription` (string), `completedCount` (number), `totalCount` (number)
- [ ] Displays: phase number badge, phase name, description, progress fraction (e.g., "7/10"), progress bar
- [ ] Collapsed/expanded state for the phase's mission list (content projection)
- [ ] Station-themed styling: Bulkhead border, Hull background
- [ ] Exported from shared components barrel
- [ ] Unit tests for: phase info rendering, progress display, collapse/expand toggle

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

### T-2026-144
- Title: Register Corridor Runner level data with LevelLoaderService
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: S
- Milestone: P3
- Depends: T-2026-081, T-2026-030
- Blocked-by: —
- Tags: minigame, corridor-runner, level-data, integration
- Refs: docs/minigames/05-corridor-runner.md, src/app/core/levels/level-loader.service.ts

Register Corridor Runner level data with LevelLoaderService so levels can be loaded by the minigame engine and level select page.

Acceptance criteria:
- [ ] Corridor Runner level pack registered with LevelLoaderService
- [ ] `LevelLoaderService.loadLevel('corridor-runner', levelId)` returns correct level data
- [ ] `LevelLoaderService.getLevelPack('corridor-runner')` returns all 18 levels grouped by tier
- [ ] Unit tests for: level loading by ID, level pack retrieval

### T-2026-191
- Title: Create Corridor Runner minigame tutorial data
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P3
- Depends: T-2026-163, T-2026-081
- Blocked-by: —
- Tags: content, tutorial, minigame, corridor-runner
- Refs: docs/minigames/05-corridor-runner.md

T-2026-168 covers P2 minigame tutorials but not Corridor Runner (P3). This ticket creates the tutorial step data for Corridor Runner so MinigameTutorialOverlayComponent can display first-time play instructions.

Acceptance criteria:
- [ ] Corridor Runner tutorial data added to `src/app/data/tutorials/minigame-tutorials.data.ts`
- [ ] 3-4 tutorial steps covering: route config editing, run simulation, hull breach avoidance, URL bar reading
- [ ] Unit tests for: tutorial data exists, has 3-4 steps, required fields populated

### T-2026-192
- Title: Create P3 minigame engine integration test for Corridor Runner
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P3
- Depends: T-2026-084
- Blocked-by: —
- Tags: testing, integration, minigame, corridor-runner
- Refs: docs/minigames/05-corridor-runner.md

P2 has integration tests (T-2026-178) but P3 does not. This ticket creates integration tests for Corridor Runner verifying the engine-shell-level-data pipeline.

Acceptance criteria:
- [ ] Integration test at `src/app/features/minigames/corridor-runner/corridor-runner.integration.spec.ts`
- [ ] Test: creates engine with real level data (level 1), configures routes, runs simulation, verifies completion
- [ ] Test: verifies MinigameShell state transitions (ready -> playing -> completed)
- [ ] Test: verifies LevelCompletionService is called with correct result
- [ ] Test: verifies scoring produces expected values for known inputs

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

### T-2026-145
- Title: Register Terminal Hack level data with LevelLoaderService
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: S
- Milestone: P4
- Depends: T-2026-086, T-2026-030
- Blocked-by: —
- Tags: minigame, terminal-hack, level-data, integration
- Refs: docs/minigames/06-terminal-hack.md, src/app/core/levels/level-loader.service.ts

Register Terminal Hack level data with LevelLoaderService so levels can be loaded by the minigame engine and level select page.

Acceptance criteria:
- [ ] Terminal Hack level pack registered with LevelLoaderService
- [ ] `LevelLoaderService.loadLevel('terminal-hack', levelId)` returns correct level data
- [ ] `LevelLoaderService.getLevelPack('terminal-hack')` returns all 21 levels grouped by tier
- [ ] Unit tests for: level loading by ID, level pack retrieval

### T-2026-193
- Title: Create Terminal Hack minigame tutorial data
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P4
- Depends: T-2026-163, T-2026-086
- Blocked-by: —
- Tags: content, tutorial, minigame, terminal-hack
- Refs: docs/minigames/06-terminal-hack.md

T-2026-168 covers P2 minigame tutorials but not Terminal Hack (P4). This ticket creates the tutorial step data for Terminal Hack so MinigameTutorialOverlayComponent can display first-time play instructions.

Acceptance criteria:
- [ ] Terminal Hack tutorial data added to `src/app/data/tutorials/minigame-tutorials.data.ts`
- [ ] 3-4 tutorial steps covering: target form reading, code editor usage, live preview, test runner, hint system
- [ ] Unit tests for: tutorial data exists, has 3-4 steps, required fields populated

### T-2026-194
- Title: Create P4 minigame engine integration test for Terminal Hack
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P4
- Depends: T-2026-089
- Blocked-by: —
- Tags: testing, integration, minigame, terminal-hack
- Refs: docs/minigames/06-terminal-hack.md

P2 has integration tests (T-2026-178) but P4 does not. This ticket creates integration tests for Terminal Hack verifying the engine-shell-level-data pipeline.

Acceptance criteria:
- [ ] Integration test at `src/app/features/minigames/terminal-hack/terminal-hack.integration.spec.ts`
- [ ] Test: creates engine with real level data (level 1), writes form code, runs tests, verifies completion
- [ ] Test: verifies MinigameShell state transitions (ready -> playing -> completed)
- [ ] Test: verifies LevelCompletionService is called with correct result
- [ ] Test: verifies scoring with time, test pass rate, and hint penalty

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

### T-2026-146
- Title: Register Power Grid level data with LevelLoaderService
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: S
- Milestone: P5
- Depends: T-2026-091, T-2026-030
- Blocked-by: —
- Tags: minigame, power-grid, level-data, integration
- Refs: docs/minigames/07-power-grid.md, src/app/core/levels/level-loader.service.ts

Register Power Grid level data with LevelLoaderService so levels can be loaded by the minigame engine and level select page.

Acceptance criteria:
- [ ] Power Grid level pack registered with LevelLoaderService
- [ ] `LevelLoaderService.loadLevel('power-grid', levelId)` returns correct level data
- [ ] `LevelLoaderService.getLevelPack('power-grid')` returns all 18 levels grouped by tier
- [ ] Unit tests for: level loading by ID, level pack retrieval

### T-2026-147
- Title: Register Data Relay level data with LevelLoaderService
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: S
- Milestone: P5
- Depends: T-2026-094, T-2026-030
- Blocked-by: —
- Tags: minigame, data-relay, level-data, integration
- Refs: docs/minigames/08-data-relay.md, src/app/core/levels/level-loader.service.ts

Register Data Relay level data with LevelLoaderService so levels can be loaded by the minigame engine and level select page.

Acceptance criteria:
- [ ] Data Relay level pack registered with LevelLoaderService
- [ ] `LevelLoaderService.loadLevel('data-relay', levelId)` returns correct level data
- [ ] `LevelLoaderService.getLevelPack('data-relay')` returns all 18 levels grouped by tier
- [ ] Unit tests for: level loading by ID, level pack retrieval

### T-2026-195
- Title: Create Power Grid and Data Relay minigame tutorial data
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P5
- Depends: T-2026-163, T-2026-091, T-2026-094
- Blocked-by: —
- Tags: content, tutorial, minigame, power-grid, data-relay
- Refs: docs/minigames/07-power-grid.md, docs/minigames/08-data-relay.md

T-2026-168 covers P2 minigame tutorials but not Power Grid or Data Relay (P5). This ticket creates tutorial step data for both P5 minigames.

Acceptance criteria:
- [ ] Power Grid tutorial data added to `src/app/data/tutorials/minigame-tutorials.data.ts`
- [ ] Power Grid: 3-4 steps covering service-component wiring, scope selection, connection drawing, short circuit avoidance
- [ ] Data Relay tutorial data added
- [ ] Data Relay: 3-4 steps covering pipe toolbox, pipe placement, parameter configuration, output comparison
- [ ] Unit tests for: both games have tutorial data, each has 3-4 steps, required fields populated

### T-2026-196
- Title: Create P5 minigame engine integration tests for Power Grid and Data Relay
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: M
- Milestone: P5
- Depends: T-2026-115, T-2026-116
- Blocked-by: —
- Tags: testing, integration, minigame, power-grid, data-relay
- Refs: docs/minigames/07-power-grid.md, docs/minigames/08-data-relay.md

P2 has integration tests (T-2026-178) but P5 does not. This ticket creates integration tests for both P5 minigames verifying the engine-shell-level-data pipeline.

Acceptance criteria:
- [ ] Integration test at `src/app/features/minigames/power-grid/power-grid.integration.spec.ts`
- [ ] Integration test at `src/app/features/minigames/data-relay/data-relay.integration.spec.ts`
- [ ] Each test: creates engine with real level data (level 1), performs correct actions, verifies completion
- [ ] Each test: verifies MinigameShell state transitions
- [ ] Each test: verifies LevelCompletionService is called with correct result
- [ ] Both P5 games covered: Power Grid, Data Relay

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

### T-2026-148
- Title: Register Reactor Core level data with LevelLoaderService
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: S
- Milestone: P6
- Depends: T-2026-098, T-2026-030
- Blocked-by: —
- Tags: minigame, reactor-core, level-data, integration
- Refs: docs/minigames/09-reactor-core.md, src/app/core/levels/level-loader.service.ts

Register Reactor Core level data with LevelLoaderService so levels can be loaded by the minigame engine and level select page.

Acceptance criteria:
- [ ] Reactor Core level pack registered with LevelLoaderService
- [ ] `LevelLoaderService.loadLevel('reactor-core', levelId)` returns correct level data
- [ ] `LevelLoaderService.getLevelPack('reactor-core')` returns all 21 levels grouped by tier
- [ ] Unit tests for: level loading by ID, level pack retrieval

### T-2026-197
- Title: Create Reactor Core minigame tutorial data
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P6
- Depends: T-2026-163, T-2026-098
- Blocked-by: —
- Tags: content, tutorial, minigame, reactor-core
- Refs: docs/minigames/09-reactor-core.md

T-2026-168 covers P2 minigame tutorials but not Reactor Core (P6). This ticket creates the tutorial step data for Reactor Core.

Acceptance criteria:
- [ ] Reactor Core tutorial data added to `src/app/data/tutorials/minigame-tutorials.data.ts`
- [ ] 3-4 tutorial steps covering: node toolbox usage, signal/computed/effect placement, wire drawing, simulation controls
- [ ] Unit tests for: tutorial data exists, has 3-4 steps, required fields populated

### T-2026-198
- Title: Create P6 minigame engine integration test for Reactor Core
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P6
- Depends: T-2026-117
- Blocked-by: —
- Tags: testing, integration, minigame, reactor-core
- Refs: docs/minigames/09-reactor-core.md

P2 has integration tests (T-2026-178) but P6 does not. This ticket creates integration tests for Reactor Core verifying the engine-shell-level-data pipeline.

Acceptance criteria:
- [ ] Integration test at `src/app/features/minigames/reactor-core/reactor-core.integration.spec.ts`
- [ ] Test: creates engine with real level data (level 1), places nodes, draws wires, runs simulation, verifies completion
- [ ] Test: verifies MinigameShell state transitions
- [ ] Test: verifies LevelCompletionService is called with correct result
- [ ] Test: verifies scoring for known graph configurations

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

### T-2026-149
- Title: Register Deep Space Radio level data with LevelLoaderService
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: S
- Milestone: P7
- Depends: T-2026-102, T-2026-030
- Blocked-by: —
- Tags: minigame, deep-space-radio, level-data, integration
- Refs: docs/minigames/10-deep-space-radio.md, src/app/core/levels/level-loader.service.ts

Register Deep Space Radio level data with LevelLoaderService so levels can be loaded by the minigame engine and level select page.

Acceptance criteria:
- [ ] Deep Space Radio level pack registered with LevelLoaderService
- [ ] `LevelLoaderService.loadLevel('deep-space-radio', levelId)` returns correct level data
- [ ] `LevelLoaderService.getLevelPack('deep-space-radio')` returns all 18 levels grouped by tier
- [ ] Unit tests for: level loading by ID, level pack retrieval

### T-2026-150
- Title: Register System Certification level data with LevelLoaderService
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: S
- Milestone: P7
- Depends: T-2026-104, T-2026-030
- Blocked-by: —
- Tags: minigame, system-certification, level-data, integration
- Refs: docs/minigames/11-system-certification.md, src/app/core/levels/level-loader.service.ts

Register System Certification level data with LevelLoaderService so levels can be loaded by the minigame engine and level select page.

Acceptance criteria:
- [ ] System Certification level pack registered with LevelLoaderService
- [ ] `LevelLoaderService.loadLevel('system-certification', levelId)` returns correct level data
- [ ] `LevelLoaderService.getLevelPack('system-certification')` returns all 18 levels grouped by tier
- [ ] Unit tests for: level loading by ID, level pack retrieval

### T-2026-151
- Title: Register Blast Doors level data with LevelLoaderService
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: S
- Milestone: P7
- Depends: T-2026-106, T-2026-030
- Blocked-by: —
- Tags: minigame, blast-doors, level-data, integration
- Refs: docs/minigames/12-blast-doors.md, src/app/core/levels/level-loader.service.ts

Register Blast Doors level data with LevelLoaderService so levels can be loaded by the minigame engine and level select page.

Acceptance criteria:
- [ ] Blast Doors level pack registered with LevelLoaderService
- [ ] `LevelLoaderService.loadLevel('blast-doors', levelId)` returns correct level data
- [ ] `LevelLoaderService.getLevelPack('blast-doors')` returns all 18 levels grouped by tier
- [ ] Unit tests for: level loading by ID, level pack retrieval

### T-2026-152
- Title: Create story mission content for Chapters 27-34 (Phase 6 Advanced) mission data directory structure
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P7
- Depends: T-2026-108
- Blocked-by: —
- Tags: story-missions, content, infrastructure
- Refs: docs/curriculum.md

T-2026-108 creates mission content for chapters 27-34 but the curriculum has these spanning Phase 6 Advanced. The missions directory currently only has phase-1 through phase-6 subdirectories planned. Chapters 27-34 need proper directory organization since they span multiple conceptual groups (Content Projection, Lifecycle, Directives, HTTP, Testing, Animations, Performance).

Acceptance criteria:
- [ ] Mission data directories created for chapters 27-34 under `src/app/data/missions/`
- [ ] Directory structure documented: phase-6 contains Ch 23-26 (signals), remaining advanced chapters in phase-7 or an advanced/ subdirectory
- [ ] StoryMission type supports the advanced phase chapters
- [ ] Unit tests verify directory/data consistency with curriculum.md chapter definitions

### T-2026-199
- Title: Create Deep Space Radio, System Certification, and Blast Doors minigame tutorial data
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P7
- Depends: T-2026-163, T-2026-102, T-2026-104, T-2026-106
- Blocked-by: —
- Tags: content, tutorial, minigame, deep-space-radio, system-certification, blast-doors
- Refs: docs/minigames/10-deep-space-radio.md, docs/minigames/11-system-certification.md, docs/minigames/12-blast-doors.md

T-2026-168 covers P2 minigame tutorials but not the P7 minigames. This ticket creates tutorial step data for all 3 P7 minigames.

Acceptance criteria:
- [ ] Deep Space Radio tutorial data added to `src/app/data/tutorials/minigame-tutorials.data.ts`
- [ ] Deep Space Radio: 3-4 steps covering request builder, interceptor placement, transmission, response reading
- [ ] System Certification tutorial data added
- [ ] System Certification: 3-4 steps covering source code reading, test writing, coverage meter, hint usage
- [ ] Blast Doors tutorial data added
- [ ] Blast Doors: 3-4 steps covering lifecycle timeline, hook slot placement, directive editing, simulation
- [ ] Unit tests for: all 3 games have tutorial data, each has 3-4 steps, required fields populated

### T-2026-200
- Title: Create P7 minigame engine integration tests for Deep Space Radio, System Certification, and Blast Doors
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: M
- Milestone: P7
- Depends: T-2026-119, T-2026-121, T-2026-123
- Blocked-by: —
- Tags: testing, integration, minigame, deep-space-radio, system-certification, blast-doors
- Refs: docs/minigames/10-deep-space-radio.md, docs/minigames/11-system-certification.md, docs/minigames/12-blast-doors.md

P2 has integration tests (T-2026-178) but P7 does not. This ticket creates integration tests for all 3 P7 minigames.

Acceptance criteria:
- [ ] Integration test at `src/app/features/minigames/deep-space-radio/deep-space-radio.integration.spec.ts`
- [ ] Integration test at `src/app/features/minigames/system-certification/system-certification.integration.spec.ts`
- [ ] Integration test at `src/app/features/minigames/blast-doors/blast-doors.integration.spec.ts`
- [ ] Each test: creates engine with real level data, performs correct actions, verifies completion
- [ ] Each test: verifies MinigameShell state transitions and LevelCompletionService integration
- [ ] All 3 P7 games covered

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

### T-2026-153
- Title: Create AchievementBadgeComponent for badge display
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P8
- Depends: T-2026-109, T-2026-007
- Blocked-by: —
- Tags: ui, component, achievements, gamification
- Refs: docs/research/gamification-patterns.md, docs/ux/navigation.md

AchievementService (T-2026-109) provides the data, but there is no visual component for rendering individual achievement badges. Navigation.md specifies the profile page shows "Achievement badges." This component renders a single badge with earned/locked state.

Acceptance criteria:
- [ ] `AchievementBadgeComponent` at `src/app/shared/components/achievement-badge/`
- [ ] Selector: `nx-achievement-badge`
- [ ] Inputs: `achievement` (Achievement interface), `size` ('sm' | 'md' | 'lg')
- [ ] Earned state: full color badge with icon, title, earned date
- [ ] Hidden unearned: shows silhouette with "???" title
- [ ] Non-hidden unearned: shows dimmed badge with title and lock icon
- [ ] Tooltip on hover shows description and unlock criteria
- [ ] Type-specific styling: Discovery (Reactor Blue), Mastery (Solar Gold), Commitment (Sensor Green)
- [ ] Exported from shared components barrel
- [ ] Unit tests for: earned rendering, hidden rendering, type-specific colors, tooltip

### T-2026-154
- Title: Create AchievementGridComponent for profile page badge display
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P8
- Depends: T-2026-153, T-2026-109
- Blocked-by: —
- Tags: ui, component, achievements, profile
- Refs: docs/ux/navigation.md

Profile page needs a grid of achievement badges with filtering by type (Discovery, Mastery, Commitment) and earned/unearned state. Builds on AchievementBadgeComponent.

Acceptance criteria:
- [ ] `AchievementGridComponent` at `src/app/shared/components/achievement-grid/`
- [ ] Selector: `nx-achievement-grid`
- [ ] Displays all achievements from AchievementService in a responsive grid
- [ ] Filter tabs: All, Discovery, Mastery, Commitment
- [ ] Progress summary: "X of Y achievements earned"
- [ ] Earned badges appear first, then unearned (sorted by type within each group)
- [ ] Responsive: adapts grid columns for mobile/tablet/desktop
- [ ] Unit tests for: grid rendering, filtering, progress count, sort order

### T-2026-155
- Title: Create EndlessModePage content with session UI
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: M
- Milestone: P8
- Depends: T-2026-048, T-2026-053
- Blocked-by: —
- Tags: replay-modes, endless, page, ui
- Refs: docs/progression.md, docs/minigames/TEMPLATE.md

T-2026-053 adds the route and placeholder page for endless mode. This ticket replaces the placeholder with a functional UI that integrates with EndlessModeService. Shows pre-game setup (high score, rules), in-game HUD (round, score, difficulty), and post-game summary.

Acceptance criteria:
- [ ] EndlessModePage at `src/app/pages/endless-mode/` replaces placeholder
- [ ] Pre-game state: displays game name, current high score, "Start" button
- [ ] In-game state: renders the minigame component with endless-mode HUD (round counter, running score, difficulty indicator)
- [ ] Post-game state: shows final score, rounds survived, new high score badge if applicable, "Play Again" and "Back to Level Select" buttons
- [ ] Integrates with EndlessModeService for session management
- [ ] Unit tests for: pre-game display, post-game summary, high score detection

### T-2026-156
- Title: Create SpeedRunPage content with timer UI
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: M
- Milestone: P8
- Depends: T-2026-049, T-2026-053
- Blocked-by: —
- Tags: replay-modes, speed-run, page, ui
- Refs: docs/progression.md, docs/minigames/TEMPLATE.md

T-2026-053 adds the route and placeholder page for speed run mode. This ticket replaces the placeholder with a functional UI that integrates with SpeedRunService. Shows pre-run setup (par time, best time), in-run timer with split tracking, and post-run results.

Acceptance criteria:
- [ ] SpeedRunPage at `src/app/pages/speed-run/` replaces placeholder
- [ ] Pre-run state: displays par time, personal best time, level set preview, "Start Run" button
- [ ] In-run state: prominent countdown/elapsed timer, level progress (X/Y levels), split times per level
- [ ] Post-run state: final time, comparison to par and personal best, time splits breakdown, "Retry" and "Back" buttons
- [ ] Timer display turns green (under par), orange (near par), red (over par) based on elapsed time
- [ ] Integrates with SpeedRunService for session and time tracking
- [ ] Unit tests for: timer display, par comparison colors, split time display

### T-2026-157
- Title: Create DailyChallengePage content with challenge UI
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: M
- Milestone: P8
- Depends: T-2026-041, T-2026-053
- Blocked-by: —
- Tags: replay-modes, daily-challenge, page, ui
- Refs: docs/progression.md, docs/research/gamification-patterns.md

T-2026-053 adds the route and placeholder page for daily challenge. This ticket replaces the placeholder with a functional UI that integrates with DailyChallengeService. Shows today's challenge with topic and bonus XP, completion state, and streak integration.

Acceptance criteria:
- [ ] DailyChallengePage at `src/app/pages/daily-challenge/` replaces placeholder
- [ ] Displays today's challenge: game name, topic, bonus XP (50), preview of the level
- [ ] If completed: shows completion checkmark, score, time until next challenge (midnight rollover)
- [ ] If not completed: "Accept Challenge" button that loads the minigame level
- [ ] Streak display: shows current daily streak and multiplier
- [ ] Integrates with DailyChallengeService for challenge data and completion
- [ ] Unit tests for: challenge display, completed state, streak display, countdown timer

### T-2026-179
- Title: Apply streak bonus to story mission XP in GameProgressionService
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P1
- Depends: T-2026-136
- Blocked-by: —
- Tags: progression, streak, xp, story-missions
- Refs: src/app/core/progression/game-progression.service.ts, src/app/core/progression/xp.service.ts

Follow-up from T-2026-136. GameProgressionService.completeMission() calls xpService.addXp(xpService.calculateStoryXp()) with no streak logic. It should use xpService.applyStreakBonus() to apply the streak multiplier to story mission XP, matching the pattern established in LevelCompletionService.

Acceptance criteria:
- [ ] GameProgressionService.completeMission() uses xpService.applyStreakBonus(storyXp) to apply streak bonus
- [ ] Story mission XP notifications show streak bonus breakdown (e.g., "+5 Streak Bonus")
- [ ] Unit tests verify streak bonus is applied to story mission XP
- [ ] Unit tests verify notification format with streak bonus

### T-2026-180
- Title: Add multiple-choice question support to RefresherChallengeService
- Status: todo
- Assigned: unassigned
- Priority: low
- Size: M
- Milestone: P2
- Depends: T-2026-047
- Blocked-by: —
- Tags: progression, refresher, multiple-choice, content
- Refs: docs/progression.md, src/app/core/progression/refresher-challenge.service.ts

Follow-up from T-2026-047. Progression.md specifies refresher format as "Mix of minigame micro-levels and multiple-choice questions." Currently only micro-levels are supported. This ticket adds a multiple-choice question content source to RefresherChallengeService, using the REFRESHER_MIN_QUESTIONS constant reserved for this purpose.

Acceptance criteria:
- [ ] Multiple-choice question type/interface defined
- [ ] RefresherChallengeService mixes micro-levels and multiple-choice questions
- [ ] REFRESHER_MIN_QUESTIONS enforced as minimum question count
- [ ] Unit tests for mixed question selection
