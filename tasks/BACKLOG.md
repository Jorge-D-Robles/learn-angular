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

---

### T-2026-213
- Title: Add OnboardingService to progression barrel export
- Status: todo
- Assigned: unassigned
- Priority: low
- Size: S
- Milestone: P2
- Depends: T-2026-173
- Blocked-by: —
- Tags: infrastructure, barrel-export, conventions
- Refs: src/app/core/progression/index.ts

OnboardingService (T-2026-173) will create `onboarding.service.ts` in the progression directory. The ticket says "Exported from progression barrel" but there is no explicit barrel update ticket. Per conventions, ensure it is exported.

Acceptance criteria:
- [ ] `src/app/core/progression/index.ts` updated to export `OnboardingService` and `OnboardingStep`
- [ ] Build passes with updated barrel

### T-2026-214
- Title: Create OnboardingOverlayComponent for first-time user guidance
- Status: todo
- Assigned: unassigned
- Priority: low
- Size: M
- Milestone: P2
- Depends: T-2026-173, T-2026-007, T-2026-130
- Blocked-by: —
- Tags: ui, component, onboarding, progressive-disclosure
- Refs: docs/research/gamification-patterns.md, docs/ux/navigation.md

OnboardingService (T-2026-173) tracks onboarding step completion, but no ticket creates the visual overlay that guides first-time users. Gamification research emphasizes "Progressive disclosure -- don't show everything at once." This component renders step-by-step highlights on the dashboard and key pages, pointing users to their first mission, the minigame hub, and the profile page.

Acceptance criteria:
- [ ] `OnboardingOverlayComponent` at `src/app/shared/components/onboarding-overlay/`
- [ ] Selector: `nx-onboarding-overlay`
- [ ] Renders a spotlight/tooltip pointing to the relevant UI element for the current step
- [ ] Steps: welcome message, "Start your first mission" pointer, "Explore minigames" pointer, "Check your profile" pointer
- [ ] "Next" / "Skip All" buttons to advance or dismiss
- [ ] Calls OnboardingService.completeStep() on advance
- [ ] Respects `prefers-reduced-motion`
- [ ] Exported from shared components barrel
- [ ] Unit tests for: step rendering, advancement, skip all, service integration

### T-2026-215
- Title: Wire OnboardingOverlay into DashboardPage for first-time users
- Status: todo
- Assigned: unassigned
- Priority: low
- Size: S
- Milestone: P2
- Depends: T-2026-214, T-2026-078
- Blocked-by: —
- Tags: integration, onboarding, dashboard
- Refs: docs/research/gamification-patterns.md

OnboardingOverlayComponent (T-2026-214) and DashboardPage (T-2026-078) exist separately. This ticket integrates them: the dashboard checks OnboardingService on init and renders the overlay if onboarding is incomplete.

Acceptance criteria:
- [ ] DashboardPage checks OnboardingService.isOnboardingComplete on init
- [ ] If not complete, renders OnboardingOverlayComponent
- [ ] Overlay dismissed -> normal dashboard interaction
- [ ] Does not show on subsequent visits after completion
- [ ] Unit tests for: overlay shown on first visit, hidden after completion

### T-2026-217
- Title: Create RefresherChallengePage for mastery restoration gameplay
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: M
- Milestone: P2
- Depends: T-2026-047, T-2026-023, T-2026-034
- Blocked-by: —
- Tags: page, refresher, spaced-repetition, ui
- Refs: docs/progression.md, docs/ux/navigation.md

Progression.md defines refresher challenges as "Quick refreshers: 3-5 questions, restore 1 star of lost mastery." RefresherChallengeService (T-2026-047) provides the logic, DegradationAlertComponent (T-2026-161) has a "Practice Now" button, but there is no page/route where the refresher challenge is actually played. This ticket creates the page that loads refresher challenge content and allows the player to complete it.

Acceptance criteria:
- [ ] Route `/refresher/:topicId` added to `app.routes.ts` with lazy-loaded RefresherChallengePage
- [ ] `RefresherChallengePage` at `src/app/pages/refresher/refresher.ts`
- [ ] Loads challenge content from RefresherChallengeService for the specified topic
- [ ] Displays 3-5 micro-level challenges or questions
- [ ] On completion, calls RefresherChallengeService.recordPractice() to restore mastery
- [ ] Shows mastery restoration result (e.g., "Components mastery: 2 -> 3 stars")
- [ ] "Back to Dashboard" navigation on completion
- [ ] Unit tests for: content loading, challenge completion, mastery restoration display

---

## P2 -- Foundations Bundle

### T-2026-468
- Title: Redesign multi-blueprint Module Assembly levels to support plural blueprint display
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: M
- Milestone: P2
- Depends: T-2026-467
- Blocked-by: —
- Tags: module-assembly, level-data, game-design
- Refs: src/app/data/levels/module-assembly.data.ts, src/app/features/minigames/module-assembly/module-assembly.engine.ts

T-2026-467 merged multi-blueprint levels (6, 9, 12, 16, 18) into single blueprints as a workaround for the engine's singular `blueprint` field. This destroys the pedagogical intent of those levels (teaching multi-component assembly). This ticket should either:
1. Extend the engine to support `blueprints` (plural) with a sequential assembly flow, OR
2. Redesign those levels to work well with a single merged blueprint

Acceptance criteria:
- [ ] Multi-blueprint levels clearly teach their intended concept (e.g., Level 6 "Multiple Components")
- [ ] Engine and/or data model supports the pedagogical distinction
- [ ] All tests pass

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

### T-2026-232
- Title: Add refresher challenge route to app.routes.ts
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P2
- Depends: T-2026-012
- Blocked-by: —
- Tags: routing, refresher, infrastructure
- Refs: docs/ux/navigation.md, docs/progression.md, src/app/app.routes.ts

T-2026-217 (RefresherChallengePage) includes the route in its acceptance criteria, but navigation.md does not list `/refresher/:topicId` in its route structure -- it is implied by the spaced repetition design in progression.md. The route should be added before the page component is built, so the placeholder pattern (used for all other routes) applies here too.

Acceptance criteria:
- [ ] Route `/refresher/:topicId` added to `app.routes.ts` with lazy-loaded RefresherChallengePage
- [ ] Placeholder `RefresherChallengePage` component at `src/app/pages/refresher/refresher.ts`
- [ ] Placeholder displays "Refresher Challenge" heading with topicId from route params
- [ ] Unit test for: route resolution, component creation, topicId param reading

### T-2026-233
- Title: Wire DegradationAlertComponent into DashboardPage for spaced repetition alerts
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P2
- Depends: T-2026-161, T-2026-078, T-2026-023
- Blocked-by: —
- Tags: integration, dashboard, spaced-repetition, degradation
- Refs: docs/ux/navigation.md, docs/progression.md

Navigation.md specifies the dashboard includes "Spaced repetition alerts (degrading topics)." DashboardPage (T-2026-078) lists this as an acceptance criterion, and DegradationAlertComponent (T-2026-161) provides the UI. But no ticket explicitly wires them together: the dashboard needs to query SpacedRepetitionService for degraded topics, render DegradationAlertComponent when topics are degrading, and handle the "Practice Now" click by navigating to `/refresher/:topicId`.

Acceptance criteria:
- [ ] DashboardPage queries SpacedRepetitionService.getDegradedTopics() on init
- [ ] If degraded topics exist, renders DegradationAlertComponent with topic data
- [ ] DegradationAlertComponent.practiceRequested event navigates to `/refresher/:topicId`
- [ ] Alert updates reactively when degradation state changes
- [ ] Alert hidden when no topics are degrading
- [ ] Unit tests for: alert display when topics degrade, navigation on practice click, hidden when clean

### T-2026-234
- Title: Wire DailyChallenge notification into DashboardPage
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P2
- Depends: T-2026-041, T-2026-078
- Blocked-by: —
- Tags: integration, dashboard, daily-challenge, notification
- Refs: docs/ux/navigation.md, docs/progression.md

Navigation.md specifies the dashboard includes a "Daily challenge notification." DashboardPage (T-2026-078) lists this as an acceptance criterion. DailyChallengeService (T-2026-041, completed) provides today's challenge data and completion status. But no ticket creates the dashboard widget that shows today's challenge or wires the navigation to the daily challenge page.

Acceptance criteria:
- [ ] DashboardPage renders a daily challenge card when today's challenge is not completed
- [ ] Card shows: game name, topic, "+50 XP" bonus indicator
- [ ] "Accept Challenge" button navigates to `/minigames/:gameId/daily`
- [ ] If already completed today, card shows "Completed" with checkmark and next challenge countdown
- [ ] Data sourced from DailyChallengeService.getTodaysChallenge()
- [ ] Unit tests for: card display, completed state, navigation, countdown

### T-2026-235
- Title: Wire active story mission prompt into DashboardPage
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P2
- Depends: T-2026-026, T-2026-078, T-2026-038
- Blocked-by: —
- Tags: integration, dashboard, story-missions, navigation
- Refs: docs/ux/navigation.md

Navigation.md specifies the dashboard includes an "Active story mission prompt." DashboardPage (T-2026-078) lists this as an acceptance criterion. GameProgressionService (T-2026-026, completed) tracks campaign progress. But no ticket creates the widget that shows the next uncompleted mission and provides a "Continue" button navigating to `/mission/:chapterId`.

Acceptance criteria:
- [ ] DashboardPage renders an active mission prompt card
- [ ] Card shows: next uncompleted mission title, chapter number, Angular topic
- [ ] "Continue" button navigates to `/mission/:chapterId`
- [ ] If all missions complete, shows "Campaign Complete" message
- [ ] Mission data sourced from CURRICULUM constant and GameProgressionService
- [ ] Unit tests for: mission prompt display, navigation, campaign complete state

### T-2026-236
- Title: Wire quick-play minigame shortcuts into DashboardPage
- Status: todo
- Assigned: unassigned
- Priority: low
- Size: S
- Milestone: P2
- Depends: T-2026-029, T-2026-078, T-2026-187
- Blocked-by: —
- Tags: integration, dashboard, minigame, quick-play
- Refs: docs/ux/navigation.md

Navigation.md specifies the dashboard includes "Quick-play minigame shortcuts." DashboardPage (T-2026-078) lists this as an acceptance criterion. This widget shows 3-4 recently played or unlocked minigames as cards for quick access, using MinigameCardComponent (T-2026-187). No existing ticket creates this dashboard section.

Acceptance criteria:
- [ ] DashboardPage renders 3-4 MinigameCardComponents as quick-play shortcuts
- [ ] Games selected by: most recently played (if available), or first unlocked games
- [ ] Each card click navigates to `/minigames/:gameId` (level select)
- [ ] Cards show mastery stars and level completion count
- [ ] Hidden when no minigames are unlocked yet (first-time user)
- [ ] Unit tests for: card rendering, game selection logic, navigation, empty state

### T-2026-238
- Title: Create LevelCardComponent for level select page level list
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P2
- Depends: T-2026-045, T-2026-055, T-2026-007
- Blocked-by: —
- Tags: ui, component, level-select, shared
- Refs: docs/ux/navigation.md

LevelSelectPage (T-2026-077) displays levels grouped by tier with star ratings, best scores, and locked states. A dedicated LevelCardComponent encapsulates the individual level entry layout, preventing the LevelSelectPage from becoming monolithic. Each card shows level number, title, LevelStarsComponent, best score, and locked/unlocked state.

Acceptance criteria:
- [ ] `LevelCardComponent` at `src/app/shared/components/level-card/`
- [ ] Selector: `nx-level-card`
- [ ] Inputs: `levelNumber` (number), `levelTitle` (string), `starRating` (0-3), `bestScore` (number | null), `isLocked` (boolean), `isCurrent` (boolean)
- [ ] Displays: level number badge, title, LevelStarsComponent, best score (or "--" if unplayed)
- [ ] Locked state: dimmed with lock icon
- [ ] Current level: highlighted border (Reactor Blue)
- [ ] Output: `levelClicked` event with levelId
- [ ] Exported from shared components barrel
- [ ] Unit tests for: locked/unlocked rendering, star display, best score, click event

### T-2026-246
- Title: Wire StationVisualizationComponent into DashboardPage
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P2
- Depends: T-2026-114, T-2026-078
- Blocked-by: —
- Tags: integration, dashboard, station-visualization
- Refs: docs/ux/navigation.md, docs/progression.md

Navigation.md specifies the dashboard includes a "Station visualization with module glow states (0-5 star mastery)." StationVisualizationComponent (T-2026-114) creates the visual map and DashboardPage (T-2026-078) creates the dashboard. No ticket wires them together.

Acceptance criteria:
- [ ] DashboardPage renders StationVisualizationComponent
- [ ] masteryData input populated from MasteryService mastery signals
- [ ] moduleClicked event navigates to `/minigames/:gameId`
- [ ] Visualization updates reactively when mastery changes
- [ ] Unit tests for: visualization rendering, mastery data binding, click navigation

### T-2026-247
- Title: Wire StreakBadgeComponent into ProfilePage
- Status: todo
- Assigned: unassigned
- Priority: low
- Size: S
- Milestone: P2
- Depends: T-2026-133, T-2026-079
- Blocked-by: —
- Tags: integration, profile, streak, ui
- Refs: docs/ux/navigation.md, docs/progression.md

Navigation.md specifies the profile page includes a "Streak counter." StreakBadgeComponent (T-2026-133) creates the visual badge and ProfilePage (T-2026-079) creates the profile page. No ticket wires the badge component into the page with live StreakService data.

Acceptance criteria:
- [ ] ProfilePage renders StreakBadgeComponent
- [ ] currentStreak input bound to StreakService.displayStreak signal
- [ ] multiplier input bound to StreakService.multiplier signal
- [ ] Badge updates reactively when streak changes
- [ ] Unit tests for: badge rendering with streak data, reactive updates

### T-2026-260
- Title: Create accessibility test infrastructure with axe-core
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P2
- Depends: T-2026-006
- Blocked-by: —
- Tags: accessibility, testing, infrastructure, ci
- Refs: docs/ux/visual-style.md

T-2026-171 (accessibility audit) mentions "Add axe-core or similar a11y testing library to CI." This prerequisite ticket sets up the infrastructure so the audit can run automatically.

Acceptance criteria:
- [ ] `@axe-core/playwright` (or `axe-playwright`) added as dev dependency
- [ ] Playwright test helper function `checkAccessibility(page)` at `e2e/helpers/a11y.ts`
- [ ] Helper runs axe-core scan and asserts no violations at a specified impact level (serious+)
- [ ] Smoke test at `e2e/a11y-smoke.spec.ts`: scan dashboard page for violations
- [ ] Test integrated into CI (runs with existing Playwright job)
- [ ] Documentation: how to run a11y tests locally

### T-2026-312
- Title: Wire LifetimeStatsService aggregate data into ProfilePage
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P2
- Depends: T-2026-212, T-2026-079
- Blocked-by: —
- Tags: integration, profile, stats, progression
- Refs: docs/ux/navigation.md, src/app/core/progression/lifetime-stats.service.ts

Navigation.md specifies the Profile page shows: "Rank and XP breakdown", "Play time stats", "Campaign progress: missions completed / total, percentage". LifetimeStatsService (T-2026-212) aggregates data from 6 services into a single ProfileStats computed signal. ProfilePage (T-2026-079) lists these as acceptance criteria but no ticket explicitly wires LifetimeStatsService into the page template. Without this integration, the profile page must inject 6+ services individually instead of using the facade.

Acceptance criteria:
- [ ] ProfilePage injects LifetimeStatsService
- [ ] ProfileStats signal used for: total XP, current rank, missions completed, total missions, total play time, games played
- [ ] Campaign progress section shows `completedMissions / totalMissions` with percentage bar
- [ ] Play time stats section uses TimeFormatPipe for formatting durations
- [ ] All stats update reactively when underlying service data changes
- [ ] Unit tests for: stats rendering from LifetimeStatsService, reactive updates

### T-2026-313
- Title: Wire StatePersistenceService export/import into SettingsPage buttons
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P2
- Depends: T-2026-080, T-2026-024
- Blocked-by: —
- Tags: integration, settings, persistence, export-import
- Refs: docs/ux/navigation.md, src/app/core/persistence/state-persistence.service.ts

SettingsPage (T-2026-080) specifies "Export Progress" and "Import Progress" buttons, and StatePersistenceService (T-2026-024) provides `exportState()` (returns JSON string) and `importState(json)` (restores from JSON). No ticket wires these together. The export button should trigger a file download of the JSON, and the import button should open a file picker, read the JSON, and restore state with confirmation.

Acceptance criteria:
- [ ] "Export Progress" button calls StatePersistenceService.exportState() and triggers a browser file download (JSON file named `learn-angular-progress-YYYY-MM-DD.json`)
- [ ] "Import Progress" button opens a file input, reads the selected JSON file
- [ ] Import triggers ConfirmDialogComponent (warning variant): "This will replace all current progress. Continue?"
- [ ] On confirm, calls StatePersistenceService.importState(json) and reloads app state
- [ ] Error handling: shows error toast if imported file is invalid JSON or has wrong format
- [ ] Unit tests for: export triggers download, import shows confirmation, import applies state, invalid file shows error

### T-2026-314
- Title: Update bottom nav "Mission" link to point to campaign route
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P2
- Depends: T-2026-167, T-2026-011
- Blocked-by: —
- Tags: navigation, bottom-nav, campaign, routing
- Refs: docs/ux/navigation.md, src/app/app.html

T-2026-167 creates the `/campaign` route and updates the side nav "Current Mission" link. T-2026-228 updated the bottom nav "Mission" link to use dynamic mission resolution via GameProgressionService. When the campaign page is built, the bottom nav "Mission" tab should navigate to `/campaign` rather than dynamically resolving to an individual mission chapter. This keeps mobile navigation consistent with desktop side nav behavior.

Acceptance criteria:
- [ ] Bottom nav "Mission" tab navigates to `/campaign` route
- [ ] `routerLinkActive` highlights the tab when on `/campaign` or any `/mission/:chapterId` route
- [ ] Label remains "Mission" for compact mobile display
- [ ] Existing unit tests updated for new route target
- [ ] No regression in desktop side nav behavior

### T-2026-315
- Title: Create MasteryTableComponent for sortable topic mastery display
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P2
- Depends: T-2026-034, T-2026-022, T-2026-007
- Blocked-by: —
- Tags: ui, component, profile, mastery, shared
- Refs: docs/ux/navigation.md, docs/progression.md

Navigation.md specifies the Profile page shows "Mastery stars per topic (table view), sortable". ProfilePage (T-2026-079) lists "Mastery table: all Angular topics with mastery stars (MasteryStarsComponent), sortable" as an acceptance criterion. No reusable component encapsulates this table. A dedicated MasteryTableComponent prevents ProfilePage from becoming monolithic and allows reuse on the campaign page or dashboard.

Acceptance criteria:
- [ ] `MasteryTableComponent` at `src/app/shared/components/mastery-table/`
- [ ] Selector: `nx-mastery-table`
- [ ] Input: `masteryData` (array of {topicId, topicName, mastery: number (0-5), lastPracticed?: Date})
- [ ] Columns: Topic Name, Mastery Stars (MasteryStarsComponent), Last Practiced (relative time), Status (active/degrading)
- [ ] Sortable by: topic name (alpha), mastery level (numeric), last practiced (date)
- [ ] Default sort: mastery ascending (lowest mastery first, nudging improvement)
- [ ] Degrading topics highlighted with Alert Orange indicator
- [ ] Responsive: collapses to card layout on mobile
- [ ] Exported from shared components barrel
- [ ] Unit tests for: row rendering, sort by each column, degrading indicator, responsive layout

### T-2026-316
- Title: Create DailyChallengeCardComponent for dashboard daily challenge widget
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P2
- Depends: T-2026-041, T-2026-007
- Blocked-by: —
- Tags: ui, component, daily-challenge, dashboard, shared
- Refs: docs/ux/navigation.md, docs/progression.md, docs/research/gamification-patterns.md

T-2026-234 wires the daily challenge notification into DashboardPage but describes the widget inline in its acceptance criteria. Extracting this into a reusable DailyChallengeCardComponent keeps DashboardPage lean and allows reuse in other contexts (e.g., minigame hub sidebar). The component encapsulates the daily challenge display logic: today's game, XP bonus, completion state, and countdown to next challenge.

Acceptance criteria:
- [ ] `DailyChallengeCardComponent` at `src/app/shared/components/daily-challenge-card/`
- [ ] Selector: `nx-daily-challenge-card`
- [ ] Inputs: `challenge` (DailyChallenge), `isCompleted` (boolean), `streakDays` (number)
- [ ] Not completed state: game name, topic, "+50 XP" badge, "Accept Challenge" button
- [ ] Completed state: checkmark icon, score summary, countdown to next challenge (hours:minutes)
- [ ] Streak indicator: flame icon with day count
- [ ] Station-themed card styling: Hull background, Reactor Blue accent
- [ ] Output: `acceptChallenge` event with gameId
- [ ] Exported from shared components barrel
- [ ] Unit tests for: not-completed rendering, completed rendering, countdown display, accept event

### T-2026-317
- Title: Create ActiveMissionCardComponent for dashboard mission prompt widget
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P2
- Depends: T-2026-216, T-2026-007
- Blocked-by: —
- Tags: ui, component, story-missions, dashboard, shared
- Refs: docs/ux/navigation.md, docs/curriculum.md

T-2026-235 wires the active story mission prompt into DashboardPage but describes the widget inline. Extracting this into a reusable ActiveMissionCardComponent keeps DashboardPage lean and allows reuse on the campaign page. The component shows the next uncompleted mission with a "Continue" call-to-action.

Acceptance criteria:
- [ ] `ActiveMissionCardComponent` at `src/app/shared/components/active-mission-card/`
- [ ] Selector: `nx-active-mission-card`
- [ ] Inputs: `mission` (StoryMission | null), `isAllComplete` (boolean)
- [ ] Active mission state: chapter number badge, title, Angular topic, "Continue" button
- [ ] All-complete state: "Campaign Complete" message with station icon and total XP summary
- [ ] No mission available state: "Begin your journey" message with "Start Mission 1" button
- [ ] Station-themed styling: Hull background, Sensor Green accent for active, Solar Gold for complete
- [ ] Output: `continueClicked` event with chapterId
- [ ] Exported from shared components barrel
- [ ] Unit tests for: active mission rendering, all-complete state, no-mission state, click event

### T-2026-325
- Title: Create theme CSS custom property variants for dark/station/light themes
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: M
- Milestone: P2
- Depends: T-2026-143
- Blocked-by: —
- Tags: ui, themes, css, visual-style
- Refs: docs/ux/visual-style.md, src/styles.css

T-2026-143 wires SettingsPage theme preference to a body class (`theme-dark`, `theme-station`, `theme-light`), but no CSS actually defines what those themes look like. Visual-style.md specifies the "Nexus Station" palette (Hull Dark, Plasma Blue, Sensor Green, Solar Gold, etc.) as the default, but doesn't define light/alternate variants. Without theme CSS, the body class change has no visual effect.

Acceptance criteria:
- [ ] `src/styles/themes/` directory with `_dark.css`, `_station.css`, `_light.css`
- [ ] Each theme file sets CSS custom properties: `--color-bg-primary`, `--color-bg-secondary`, `--color-text-primary`, `--color-text-secondary`, `--color-accent`, `--color-accent-secondary`, `--color-success`, `--color-error`
- [ ] Station theme uses visual-style.md palette (Hull Dark backgrounds, Plasma Blue accent, Sensor Green success)
- [ ] Dark theme: deeper blacks, higher contrast, same accent colors
- [ ] Light theme: white backgrounds, dark text, adapted accent colors for accessibility
- [ ] `styles.css` imports all theme files and applies them via `.theme-dark`, `.theme-station`, `.theme-light` body class selectors
- [ ] All existing components that use hardcoded colors are updated to use CSS custom properties
- [ ] Contrast ratios meet WCAG AA (4.5:1 for text)

### T-2026-332
- Title: Create P2 cross-cutting integration test for story mission to minigame unlock flow
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: M
- Milestone: P2
- Depends: T-2026-059, T-2026-088
- Blocked-by: —
- Tags: test, integration, story, minigame, unlock
- Refs: docs/overview.md, docs/curriculum.md

Overview.md defines the core game loop: "Complete Story Mission -> Unlock Minigame -> Master Minigame -> Earn XP -> Level Up." No integration test verifies this cross-cutting flow. After P2 delivers the first minigame engines and story missions, this test ensures the full unlock pipeline works.

Acceptance criteria:
- [ ] Integration test at `src/app/features/integration/story-to-minigame.integration.spec.ts`
- [ ] Test: completing story mission 1 unlocks Module Assembly minigame
- [ ] Test: completing story mission unlocks the correct minigame per curriculum mapping
- [ ] Test: locked minigame cannot be played before its prerequisite story mission
- [ ] Test: XP is awarded for both story mission completion and minigame completion
- [ ] Uses real CurriculumService, ProgressionService, and level data

### T-2026-333
- Title: Create integration test for SpacedRepetition degradation-to-dashboard-alert flow
- Status: todo
- Assigned: unassigned
- Priority: low
- Size: S
- Milestone: P2
- Depends: T-2026-042, T-2026-074
- Blocked-by: —
- Tags: test, integration, spaced-repetition, dashboard
- Refs: docs/progression.md, src/app/core/progression/spaced-repetition.service.ts

Progression.md specifies a spaced repetition system: 7-day grace period, 14-day degradation to max 2 stars lost. SpacedRepetitionService (T-2026-042) tracks decay and DashboardPage (T-2026-074) should show "needs review" alerts. No test verifies the service-to-dashboard integration.

Acceptance criteria:
- [ ] Integration test at `src/app/features/integration/spaced-repetition-alert.integration.spec.ts`
- [ ] Test: topic with no practice for >7 days triggers "needs review" in SpacedRepetitionService
- [ ] Test: dashboard page receives and displays decayed topics from the service
- [ ] Test: practicing a decayed topic resets its decay timer
- [ ] Uses real SpacedRepetitionService with mocked date provider

### T-2026-334
- Title: Wire MinigamePlayPage to show loading spinner during engine factory creation
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P2
- Depends: T-2026-017, T-2026-076
- Blocked-by: —
- Tags: ui, loading, minigame, ux
- Refs: docs/ux/navigation.md, src/app/pages/minigame-play/

MinigamePlayPage (T-2026-076) loads a minigame engine dynamically via the factory registry. The engine creation is async (lazy-loaded modules), but no loading state is shown while the engine initializes. Users see a blank page or flash of empty content during load.

Acceptance criteria:
- [ ] MinigamePlayPage shows a loading spinner while the engine factory is being resolved
- [ ] Loading state uses the shared LoadingSpinnerComponent (or creates one if none exists)
- [ ] Error state shown if engine factory fails to load (with "Retry" and "Back" buttons)
- [ ] Once engine is ready, spinner is replaced with MinigameShell + game component
- [ ] Unit tests for: loading state shown, error state shown, transition to game state

### T-2026-335
- Title: Create ConfirmDialogService for programmatic dialog invocation
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: M
- Milestone: P2
- Depends: T-2026-007
- Blocked-by: —
- Tags: service, ui, dialog, shared
- Refs: docs/ux/navigation.md

Multiple features need confirmation dialogs (quit minigame mid-game, reset progress, delete save data). Navigation.md specifies a "Quit?" confirmation when leaving a minigame. No shared dialog service exists for programmatic invocation. Angular CDK Dialog or a lightweight custom solution.

Acceptance criteria:
- [ ] `ConfirmDialogService` at `src/app/shared/services/confirm-dialog.service.ts`
- [ ] `confirm(options: ConfirmDialogOptions): Observable<boolean>` method
- [ ] Options: `title`, `message`, `confirmText` (default "Confirm"), `cancelText` (default "Cancel"), `variant` ('danger' | 'warning' | 'info')
- [ ] Dialog renders as a modal overlay with backdrop
- [ ] Accessible: focus trap, Escape to dismiss, aria-labelledby
- [ ] Station-themed styling matching visual-style.md
- [ ] Exported from shared services barrel
- [ ] Unit tests for: dialog opens, confirm returns true, cancel returns false, escape dismisses

### T-2026-336
- Title: Create ProgressBarComponent for generic progress display
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P2
- Depends: T-2026-007
- Blocked-by: —
- Tags: ui, component, shared, progress
- Refs: docs/ux/visual-style.md, docs/progression.md

Multiple pages need progress bars: XP to next level, mastery progress, story completion percentage, level progress within a minigame. No shared ProgressBarComponent exists. Progression.md shows XP bars and mastery stars as percentages.

Acceptance criteria:
- [ ] `ProgressBarComponent` at `src/app/shared/components/progress-bar/`
- [ ] Selector: `nx-progress-bar`
- [ ] Inputs: `value` (0-100), `max` (default 100), `label` (optional), `variant` ('default' | 'xp' | 'mastery' | 'timer'), `showPercentage` (boolean)
- [ ] Animated fill using CSS transitions (respects prefers-reduced-motion)
- [ ] Variant colors: default (Plasma Blue), xp (Solar Gold), mastery (Sensor Green), timer (Alert Red when low)
- [ ] Accessible: role="progressbar", aria-valuenow, aria-valuemin, aria-valuemax, aria-label
- [ ] Exported from shared components barrel
- [ ] Unit tests for: value rendering, variant styling, percentage display, accessibility attributes


### T-2026-338
- Title: Wire MissionUnlockNotificationService into app shell root for global unlock toasts
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P2
- Depends: T-2026-189, T-2026-009
- Blocked-by: —
- Tags: integration, notifications, app-shell, minigame-unlock
- Refs: docs/overview.md, src/app/app.html

XpNotificationComponent (T-2026-125, completed) and RankUpOverlayComponent (T-2026-225, completed) are wired into the app shell root for global display. MissionUnlockNotificationService (T-2026-189) creates the unlock notification service but no ticket adds its visual output to the app shell. Without this, minigame unlock toasts have no DOM host and never render.

Acceptance criteria:
- [ ] App component imports MissionUnlockNotificationService
- [ ] App shell template includes the unlock notification component/toast container
- [ ] Notification displays globally when a story mission unlocks a minigame
- [ ] Notification auto-dismisses or can be clicked to navigate to the minigame
- [ ] Unit tests for: notification visibility on unlock trigger, dismiss behavior

### T-2026-339
- Title: Wire MinigameCardComponent into MinigameHubPage grid layout
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P2
- Depends: T-2026-187, T-2026-076
- Blocked-by: —
- Tags: integration, ui, minigame-hub, minigame-card
- Refs: docs/ux/navigation.md, src/app/pages/minigame-hub/

MinigameHubPage (T-2026-076, completed) renders a grid of minigame cards. MinigameCardComponent (T-2026-187) creates a dedicated card component with mastery stars, lock state, and level completion display. No ticket wires MinigameCardComponent into MinigameHubPage, replacing any inline card rendering with the reusable component.

Acceptance criteria:
- [ ] MinigameHubPage renders MinigameCardComponent for each registered minigame
- [ ] Card inputs populated from MinigameRegistryService (config), MasteryService (mastery), and LevelProgressionService (levels completed)
- [ ] Locked/unlocked state derived from GameProgressionService
- [ ] Card click navigates to `/minigames/:gameId` (level select)
- [ ] Grid layout maintained with responsive columns
- [ ] Unit tests for: card rendering per game, data binding from services, click navigation

### T-2026-340
- Title: Wire LevelCardComponent into LevelSelectPage level list
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P2
- Depends: T-2026-238, T-2026-077
- Blocked-by: —
- Tags: integration, ui, level-select, level-card
- Refs: docs/ux/navigation.md, src/app/pages/level-select/

LevelSelectPage (T-2026-077, completed) displays levels grouped by tier. LevelCardComponent (T-2026-238) creates a dedicated card component. No ticket wires LevelCardComponent into LevelSelectPage, replacing inline level rendering with the reusable component.

Acceptance criteria:
- [ ] LevelSelectPage renders LevelCardComponent for each level in the tier groups
- [ ] Card inputs populated from LevelProgressionService (star rating, best score, locked state)
- [ ] Current level (next unplayed) highlighted via `isCurrent` input
- [ ] Card click navigates to `/minigames/:gameId/level/:levelId`
- [ ] Unit tests for: card rendering per level, data binding, current level highlight, click navigation

### T-2026-341
- Title: Wire StepProgressComponent into StoryMissionPage for step indicator
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P2
- Depends: T-2026-188, T-2026-075
- Blocked-by: —
- Tags: integration, ui, story-missions, step-progress
- Refs: docs/ux/navigation.md, src/app/pages/mission/

Navigation.md specifies the Story Mission View includes a "Progress indicator (mission steps)." StoryMissionPage (T-2026-075) lists this as an acceptance criterion. StepProgressComponent (T-2026-188) creates the reusable stepper component. No ticket wires them together.

Acceptance criteria:
- [ ] StoryMissionPage renders StepProgressComponent
- [ ] `totalSteps` bound to mission step count from StoryMissionContentService
- [ ] `currentStep` bound to current step index
- [ ] `completedSteps` bound to completed step indices
- [ ] Step indicator updates as player advances through mission
- [ ] Unit tests for: step progress rendering, reactive updates on step advance

### T-2026-342
- Title: Wire PhaseHeaderComponent and MissionCardComponent into CampaignPage
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P2
- Depends: T-2026-190, T-2026-216, T-2026-141
- Blocked-by: —
- Tags: integration, ui, campaign, phase-header, mission-card
- Refs: docs/ux/navigation.md, docs/curriculum.md, src/app/pages/campaign/

CampaignPage (T-2026-141) displays all 34 missions grouped by curriculum phase. PhaseHeaderComponent (T-2026-190) creates the phase grouping header with progress bar. MissionCardComponent (T-2026-216, completed) creates the mission entry card. No ticket wires these components into CampaignPage.

Acceptance criteria:
- [ ] CampaignPage renders PhaseHeaderComponent for each of the 6 curriculum phases
- [ ] Phase headers populated from CURRICULUM constant with completion counts from GameProgressionService
- [ ] MissionCardComponent rendered for each mission within its phase group
- [ ] MissionCard inputs: chapter number, title, Angular topic, completion status, locked state
- [ ] Click on unlocked mission navigates to `/mission/:chapterId`
- [ ] Unit tests for: phase grouping, card rendering per mission, click navigation

### T-2026-343
- Title: Wire MasteryTableComponent into ProfilePage mastery section
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P2
- Depends: T-2026-315, T-2026-079
- Blocked-by: —
- Tags: integration, ui, profile, mastery-table
- Refs: docs/ux/navigation.md, src/app/pages/profile/

Navigation.md specifies the Profile page shows "Mastery stars per topic (table view), sortable." MasteryTableComponent (T-2026-315) creates the sortable table. ProfilePage (T-2026-079) lists mastery table as an acceptance criterion. No ticket wires the component into the page with live service data.

Acceptance criteria:
- [ ] ProfilePage renders MasteryTableComponent in a "Mastery" section
- [ ] `masteryData` input populated from MasteryService and SpacedRepetitionService
- [ ] Each topic includes: topicName (from CURRICULUM), mastery level (from MasteryService), lastPracticed (from SpacedRepetitionService)
- [ ] Degrading topics flagged via SpacedRepetitionService.getEffectiveMastery()
- [ ] Table updates reactively when mastery changes
- [ ] Unit tests for: table rendering with service data, degrading topic flag

### T-2026-344
- Title: Create route guard for locked mission and minigame access prevention
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P2
- Depends: T-2026-026, T-2026-012
- Blocked-by: —
- Tags: routing, guard, security, ux
- Refs: docs/overview.md, docs/ux/navigation.md, src/app/app.routes.ts

Design docs specify mastery-based progression: story missions unlock minigames, and missions have prerequisite chains. MinigamePlayPage has a "locked" view state, but nothing prevents direct URL navigation to a locked mission or minigame level. A `canActivate` guard redirects users to the appropriate page (campaign for missions, level select for minigames) when attempting to access locked content.

Acceptance criteria:
- [ ] `MissionGuard` functional guard at `src/app/core/guards/mission.guard.ts`
- [ ] Checks GameProgressionService to verify mission prerequisites are met
- [ ] Redirects to `/campaign` with a query param indicating the locked mission if prerequisites unmet
- [ ] `MinigameLevelGuard` functional guard at `src/app/core/guards/minigame-level.guard.ts`
- [ ] Checks LevelProgressionService to verify the level is unlocked
- [ ] Redirects to `/minigames/:gameId` (level select) if level is locked
- [ ] Both guards registered on their respective routes in `app.routes.ts`
- [ ] Unit tests for: guard allows access when unlocked, guard redirects when locked, guard reads route params

### T-2026-345
- Title: Wire ProgressBarComponent into CampaignPage phase progress display
- Status: todo
- Assigned: unassigned
- Priority: low
- Size: S
- Milestone: P2
- Depends: T-2026-336, T-2026-141
- Blocked-by: —
- Tags: integration, ui, campaign, progress-bar
- Refs: docs/ux/navigation.md, src/app/pages/campaign/

ProgressBarComponent (T-2026-336) creates a generic progress bar. CampaignPage (T-2026-141) and PhaseHeaderComponent (T-2026-190) both need progress bars for phase completion display. No ticket wires the component into the campaign page or phase headers.

Acceptance criteria:
- [ ] PhaseHeaderComponent uses ProgressBarComponent for phase completion progress
- [ ] Progress bar `value` bound to completed mission count, `max` bound to total missions in phase
- [ ] CampaignPage shows overall campaign progress bar at the top
- [ ] Unit tests for: progress bar rendering in phase headers, overall progress calculation

### T-2026-346
- Title: Create E2E smoke tests for P2 page components (Dashboard, Profile, Settings, Campaign)
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: M
- Milestone: P2
- Depends: T-2026-078, T-2026-079, T-2026-080, T-2026-141
- Blocked-by: —
- Tags: testing, e2e, pages, smoke-test
- Refs: docs/ux/navigation.md, playwright.config.ts

E2E tests exist for dashboard routing (T-2026-005) and minigame shell (T-2026-248), but no E2E tests verify the P2 page components render correctly when populated with real data. T-2026-142 tests the full game loop but not individual page rendering.

Acceptance criteria:
- [ ] Playwright test at `e2e/pages.spec.ts`
- [ ] Test: `/` renders DashboardPage with rank badge, XP bar, and mission prompt sections
- [ ] Test: `/profile` renders ProfilePage with rank, mastery table, streak, and play time sections
- [ ] Test: `/settings` renders SettingsPage with sound toggle, animation speed, theme selector, reset button
- [ ] Test: `/campaign` renders CampaignPage with phase groupings and mission cards
- [ ] Test: `/minigames` renders MinigameHubPage with minigame grid
- [ ] All tests verify responsive layout at mobile breakpoint (768px) and desktop (1280px)
- [ ] Tests run in CI (GitHub Actions)

### T-2026-347
- Title: Create guards barrel export and add to core re-export
- Status: todo
- Assigned: unassigned
- Priority: low
- Size: S
- Milestone: P2
- Depends: T-2026-344, T-2026-126
- Blocked-by: —
- Tags: infrastructure, barrel-export, conventions
- Refs: src/app/core/index.ts

T-2026-344 creates route guards in `src/app/core/guards/`. Per project conventions, all core subdirectories should have barrel exports and be included in the core root barrel.

Acceptance criteria:
- [ ] `src/app/core/guards/index.ts` barrel exporting MissionGuard and MinigameLevelGuard
- [ ] `src/app/core/index.ts` re-exports from `./guards`
- [ ] Build passes with no circular dependencies

### T-2026-348
- Title: Add ConfirmDialogService to shared services barrel export
- Status: todo
- Assigned: unassigned
- Priority: low
- Size: S
- Milestone: P2
- Depends: T-2026-335
- Blocked-by: —
- Tags: infrastructure, barrel-export, conventions
- Refs: src/app/shared/index.ts

ConfirmDialogService (T-2026-335) creates a shared service for programmatic dialog invocation but the shared barrel may not include a services subdirectory export. Per conventions, all shared modules should be importable via the shared barrel.

Acceptance criteria:
- [ ] `src/app/shared/services/index.ts` barrel exporting ConfirmDialogService and ConfirmDialogOptions
- [ ] `src/app/shared/index.ts` re-exports from `./services`
- [ ] Build passes with updated barrel

### T-2026-349
- Title: Wire DailyChallengeCardComponent into dashboard via T-2026-234 dependency
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P2
- Depends: T-2026-316, T-2026-234
- Blocked-by: —
- Tags: integration, ui, dashboard, daily-challenge
- Refs: docs/ux/navigation.md, src/app/pages/dashboard/

T-2026-234 wires daily challenge notification into DashboardPage and T-2026-316 creates DailyChallengeCardComponent. T-2026-234 describes the widget inline in its acceptance criteria. This ticket ensures DashboardPage renders DailyChallengeCardComponent (not an inline implementation) and wires the `acceptChallenge` output to router navigation.

Acceptance criteria:
- [ ] DashboardPage renders DailyChallengeCardComponent for the daily challenge section
- [ ] Component inputs bound to DailyChallengeService.getTodaysChallenge() and completion state
- [ ] `acceptChallenge` output navigates to `/minigames/:gameId/daily`
- [ ] Streak data passed from StreakService
- [ ] Unit tests for: component rendering, accept challenge navigation

### T-2026-350
- Title: Wire ActiveMissionCardComponent into dashboard via T-2026-235 dependency
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P2
- Depends: T-2026-317, T-2026-235
- Blocked-by: —
- Tags: integration, ui, dashboard, story-missions
- Refs: docs/ux/navigation.md, src/app/pages/dashboard/

T-2026-235 wires active story mission prompt into DashboardPage and T-2026-317 creates ActiveMissionCardComponent. T-2026-235 describes the widget inline. This ticket ensures DashboardPage renders ActiveMissionCardComponent (not an inline implementation) and wires the `continueClicked` output to router navigation.

Acceptance criteria:
- [ ] DashboardPage renders ActiveMissionCardComponent for the mission prompt section
- [ ] Component inputs bound to GameProgressionService next uncompleted mission
- [ ] `continueClicked` output navigates to `/mission/:chapterId`
- [ ] All-complete and no-mission states handled
- [ ] Unit tests for: component rendering, continue navigation, edge states

- [ ] Build passes with updated barrel

### T-2026-352
- Title: Create integration test for story mission completion triggering minigame unlock notification
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P2
- Depends: T-2026-259, T-2026-189, T-2026-338
- Blocked-by: —
- Tags: testing, integration, story-missions, minigame-unlock, notifications
- Refs: docs/overview.md, docs/curriculum.md

The core game loop (overview.md) specifies: Story Mission -> Unlock Minigame. T-2026-259 creates the mission completion handler and T-2026-189 creates MissionUnlockNotificationService. No integration test verifies that completing a story mission triggers the unlock notification, awards 50 XP, and updates mastery to 1 star.

Acceptance criteria:
- [ ] Integration test at `src/app/core/integration/mission-completion.integration.spec.ts`
- [ ] Test: completing mission for Ch 1 awards 50 XP via XpService
- [ ] Test: completing mission for Ch 1 unlocks Module Assembly minigame
- [ ] Test: MissionUnlockNotificationService.showUnlock() called with correct game name
- [ ] Test: MasteryService updated to 1 star for the mission's topic
- [ ] Test: completing mission for Ch 9 (no minigame unlock) does not trigger unlock notification
- [ ] Uses real services (no mocks except notification display)

### T-2026-353
- Title: Create SettingsPage E2E test for theme switching and reset progress
- Status: todo
- Assigned: unassigned
- Priority: low
- Size: S
- Milestone: P2
- Depends: T-2026-080, T-2026-143
- Blocked-by: —
- Tags: testing, e2e, settings, theme
- Refs: docs/ux/navigation.md, playwright.config.ts

SettingsPage has user-facing interactions (theme switching, reset progress) that should be verified end-to-end. No E2E test specifically validates that theme switching applies body class changes or that reset progress triggers the confirmation dialog.

Acceptance criteria:
- [ ] Playwright test at `e2e/settings.spec.ts`
- [ ] Test: navigate to `/settings`, verify all setting controls render
- [ ] Test: toggle sound off, verify setting persists after page reload
- [ ] Test: change theme, verify body class changes (e.g., `theme-station` -> `theme-light`)
- [ ] Test: click "Reset All Progress", verify ConfirmDialogComponent appears with danger variant
- [ ] Tests run in CI

### T-2026-356
- Title: Add focus management on route navigation for screen reader announcements
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P2
- Depends: T-2026-012, T-2026-355
- Blocked-by: —
- Tags: accessibility, a11y, routing, focus-management
- Refs: docs/ux/navigation.md, src/app/app.routes.ts

Single-page applications fail to announce route changes to screen readers by default. When a user navigates between pages, the screen reader does not know the page has changed. Angular's router does not automatically manage focus. A route change handler should move focus to the main content area and announce the page title.

Acceptance criteria:
- [ ] Route change listener in app component (or a service) using Router.events
- [ ] On NavigationEnd, focus moved to the main content region (`#main-content`)
- [ ] Page title announced via an ARIA live region or `document.title` update
- [ ] Route title metadata used for announcement (Angular route `title` property)
- [ ] Focus management respects `prefers-reduced-motion` (no scroll animation)
- [ ] Unit tests for: focus moves on navigation, title updates on navigation

### T-2026-357
- Title: Create LevelProgressSummaryComponent for minigame level completion counts
- Status: todo
- Assigned: unassigned
- Priority: low
- Size: S
- Milestone: P2
- Depends: T-2026-020, T-2026-007
- Blocked-by: —
- Tags: ui, component, level-progress, shared
- Refs: docs/ux/navigation.md, docs/progression.md

Navigation.md specifies the Minigame Level Select page shows "Best score / best time" per level and the Minigame Hub shows "Quick stats (levels completed, best scores)." Multiple pages need a compact display of level completion counts (e.g., "12/18 levels completed, 36 stars earned"). No reusable component exists for this.

Acceptance criteria:
- [ ] `LevelProgressSummaryComponent` at `src/app/shared/components/level-progress-summary/`
- [ ] Selector: `nx-level-progress-summary`
- [ ] Inputs: `completedLevels` (number), `totalLevels` (number), `totalStars` (number), `maxStars` (number)
- [ ] Displays: completion fraction (e.g., "12/18"), star total, progress bar
- [ ] Compact variant for card use, full variant for page headers
- [ ] Exported from shared components barrel
- [ ] Unit tests for: fraction display, star count, progress bar value

### T-2026-358
- Title: Create integration test for SettingsService reset triggering StatePersistenceService clearAll
- Status: todo
- Assigned: unassigned
- Priority: low
- Size: S
- Milestone: P2
- Depends: T-2026-039, T-2026-024
- Blocked-by: —
- Tags: testing, integration, settings, persistence, reset
- Refs: docs/architecture.md

Architecture.md documents that "SettingsService.resetProgress() calls StatePersistenceService.clearAll() followed by a full page reload." No integration test verifies this critical destructive flow works correctly end-to-end.

Acceptance criteria:
- [ ] Integration test at `src/app/core/integration/settings-reset.integration.spec.ts`
- [ ] Test: add game state (XP, mastery, streaks), call resetProgress(), verify all localStorage cleared
- [ ] Test: verify resetProgress() triggers page reload (document.location.reload)
- [ ] Test: verify all services would initialize with defaults after clear (fresh state)
- [ ] Uses real StatePersistenceService with fake localStorage

### T-2026-363
- Title: Add canDeactivate guard to MinigamePlayPage for quit confirmation during active game
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P2
- Depends: T-2026-223, T-2026-057
- Blocked-by: —
- Tags: routing, guard, minigame, ux, quit-confirmation
- Refs: docs/ux/navigation.md, src/app/pages/minigame-play/minigame-play.ts

Navigation.md implies a quit confirmation when leaving a minigame mid-play. PauseMenuComponent has a quit button with confirmation, but nothing prevents the player from clicking the browser back button, a nav link, or typing a URL while a game is in progress. A `canDeactivate` route guard should intercept navigation away from MinigamePlayPage when the engine status is Playing or Paused, and show a confirmation dialog before allowing departure.

Acceptance criteria:
- [ ] `MinigamePlayGuard` functional `canDeactivate` guard at `src/app/core/guards/minigame-play.guard.ts`
- [ ] Guard checks if the MinigamePlayPage engine status is Playing or Paused
- [ ] If active game: shows ConfirmDialogComponent with "Quit current game? Progress will be lost."
- [ ] If game is in Loading, Won, or Lost status: allows navigation without prompt
- [ ] Guard registered on the `minigames/:gameId/level/:levelId` route in `app.routes.ts`
- [ ] Unit tests for: guard allows when game is won/lost, guard prompts when game is active, guard allows after confirm

### T-2026-365
- Title: Wire EmptyStateComponent into MinigameHubPage for no-unlocked-games state
- Status: todo
- Assigned: unassigned
- Priority: low
- Size: S
- Milestone: P2
- Depends: T-2026-129, T-2026-076
- Blocked-by: —
- Tags: ui, integration, empty-state, minigame-hub
- Refs: docs/ux/navigation.md, src/app/pages/minigame-hub/minigame-hub.ts

MinigameHubPage (T-2026-076) renders a grid of minigame cards, but no ticket handles the empty state when a new player has no unlocked minigames. EmptyStateComponent (T-2026-129) provides the visual pattern. Without this, a first-time user sees a blank grid with no guidance.

Acceptance criteria:
- [ ] MinigameHubPage shows EmptyStateComponent when no minigames are unlocked
- [ ] Empty state message: "No minigames unlocked yet. Complete your first mission to unlock a minigame!"
- [ ] Action button navigates to `/campaign` or `/mission/1`
- [ ] Empty state hidden as soon as any minigame is unlocked
- [ ] Unit tests for: empty state rendering when no games unlocked, hidden when games exist

### T-2026-366
- Title: Wire EmptyStateComponent into LevelSelectPage for no-level-data state
- Status: todo
- Assigned: unassigned
- Priority: low
- Size: S
- Milestone: P2
- Depends: T-2026-129, T-2026-077
- Blocked-by: —
- Tags: ui, integration, empty-state, level-select
- Refs: docs/ux/navigation.md, src/app/pages/level-select/level-select.ts

LevelSelectPage (T-2026-077) displays levels grouped by tier, but no ticket handles the state when level data has not been registered for a game. EmptyStateComponent (T-2026-129) provides the visual pattern. Without this, a player navigating to an unbuilt game's level select sees blank content.

Acceptance criteria:
- [ ] LevelSelectPage shows EmptyStateComponent when the game has no registered level data
- [ ] Empty state message: "Levels coming soon for [game name]"
- [ ] "Back to Minigames" button navigates to `/minigames`
- [ ] Unit tests for: empty state when no level data, hidden when levels exist

### T-2026-367
- Title: Apply TooltipDirective to shared components for contextual help
- Status: todo
- Assigned: unassigned
- Priority: low
- Size: S
- Milestone: P2
- Depends: T-2026-130, T-2026-034, T-2026-046, T-2026-055
- Blocked-by: —
- Tags: ui, accessibility, tooltip, ux
- Refs: docs/ux/visual-style.md, docs/research/gamification-patterns.md

TooltipDirective (T-2026-130) provides contextual help on hover/focus, but no ticket applies it to shared components where users need explanations. Gamification research emphasizes "Progressive disclosure" and "immediate feedback." Tooltips on mastery stars ("3 stars: Advanced levels completed"), tier badges ("Boss: Final challenge"), and locked content ("Complete Mission 5 to unlock") reduce confusion for new players.

Acceptance criteria:
- [ ] MasteryStarsComponent: tooltip on each star count explaining what the level means (from progression.md mastery table)
- [ ] TierBadgeComponent: tooltip showing tier description ("Basic: Introductory concepts")
- [ ] LockedContentComponent: tooltip showing unlock requirement when hoverable
- [ ] LevelStarsComponent: tooltip showing star thresholds (e.g., "3 stars: 90%+ score")
- [ ] Unit tests for: tooltip renders on hover/focus for each component

### T-2026-368
- Title: Create integration test for replay XP diminishing returns across multiple level completions
- Status: todo
- Assigned: unassigned
- Priority: low
- Size: S
- Milestone: P2
- Depends: T-2026-185, T-2026-164
- Blocked-by: —
- Tags: testing, integration, diminishing-returns, replay, xp
- Refs: docs/progression.md, src/app/core/progression/xp-diminishing-returns.service.ts

T-2026-185 wired XpDiminishingReturnsService into LevelCompletionService, and T-2026-164 created the service. No integration test verifies the multi-play scenario: first play yields full XP, second play yields reduced XP, and star improvement on replay partially restores XP. Progression.md's design intends "players can replay easier levels for XP but get diminishing returns."

Acceptance criteria:
- [ ] Integration test at `src/app/core/integration/diminishing-returns.integration.spec.ts`
- [ ] Test: complete level first time -> verify full XP awarded
- [ ] Test: replay same level with same score -> verify XP is reduced (< 100% of first play)
- [ ] Test: replay same level with higher star rating -> verify partial XP restoration
- [ ] Test: verify diminishing returns persist across service restarts (loaded from localStorage)
- [ ] Uses real LevelCompletionService and XpDiminishingReturnsService

### T-2026-369
- Title: Create E2E test for side nav and bottom nav responsive navigation
- Status: todo
- Assigned: unassigned
- Priority: low
- Size: S
- Milestone: P2
- Depends: T-2026-010, T-2026-011, T-2026-346
- Blocked-by: —
- Tags: testing, e2e, navigation, responsive, a11y
- Refs: docs/ux/navigation.md, playwright.config.ts

Navigation.md specifies side nav for desktop (>1024px) and bottom nav for mobile (<768px). T-2026-010 and T-2026-011 created these components, but no E2E test verifies: (1) side nav is visible and bottom nav hidden at desktop width, (2) bottom nav is visible and side nav hidden at mobile width, (3) clicking nav items navigates to the correct route with routerLinkActive highlighting.

Acceptance criteria:
- [ ] Playwright test at `e2e/navigation.spec.ts`
- [ ] Test at desktop viewport (1280px): side nav visible, bottom nav hidden, all 4 nav links work
- [ ] Test at mobile viewport (375px): bottom nav visible, side nav hidden, all 4 nav tabs work
- [ ] Test: routerLinkActive class applied to active nav item after navigation
- [ ] Test: current mission link resolves correctly (dynamic via GameProgressionService)
- [ ] Tests run in CI (GitHub Actions)

### T-2026-370
- Title: Add MinigamePlayGuard to guards barrel export
- Status: todo
- Assigned: unassigned
- Priority: low
- Size: S
- Milestone: P2
- Depends: T-2026-363, T-2026-347
- Blocked-by: —
- Tags: infrastructure, barrel-export, conventions
- Refs: src/app/core/guards/index.ts

T-2026-363 creates MinigamePlayGuard and T-2026-347 creates the guards barrel. This ticket ensures MinigamePlayGuard is included in the barrel alongside MissionGuard and MinigameLevelGuard.

Acceptance criteria:
- [ ] `src/app/core/guards/index.ts` updated to export `MinigamePlayGuard`
- [ ] Build passes with updated barrel

### T-2026-371
- Title: Create integration test for SettingsService theme preference applying body class
- Status: todo
- Assigned: unassigned
- Priority: low
- Size: S
- Milestone: P2
- Depends: T-2026-143, T-2026-039
- Blocked-by: —
- Tags: testing, integration, settings, theme
- Refs: docs/ux/visual-style.md, src/app/core/settings/settings.service.ts

T-2026-143 wires SettingsPage theme preference to a document body class but no integration test verifies the chain: change theme via SettingsService -> body class updates -> CSS custom properties switch. This is a user-facing visual change that should be verified.

Acceptance criteria:
- [ ] Integration test at `src/app/core/integration/theme-switching.integration.spec.ts`
- [ ] Test: default theme -> body has `theme-dark` class
- [ ] Test: change to station theme -> body has `theme-station` class, `theme-dark` removed
- [ ] Test: change to light theme -> body has `theme-light` class, `theme-station` removed
- [ ] Test: theme persists after simulated reload (SettingsService loads from persistence)
- [ ] Uses real SettingsService with document body access

### T-2026-372
- Title: Add route title resolution to replay mode routes for consistent browser tab titles
- Status: todo
- Assigned: unassigned
- Priority: low
- Size: S
- Milestone: P2
- Depends: T-2026-362, T-2026-053
- Blocked-by: —
- Tags: accessibility, routing, replay-modes
- Refs: docs/ux/navigation.md, src/app/app.routes.ts

T-2026-362 adds static title metadata to main routes, but replay mode routes (`/minigames/:gameId/endless`, `/speedrun`, `/daily`) need dynamic titles that include the game name (e.g., "Module Assembly - Endless Mode"). Without dynamic titles, all replay mode tabs show the same generic title.

Acceptance criteria:
- [ ] Replay mode routes use Angular route title resolvers or `ResolveFn<string>` to compute dynamic titles
- [ ] Endless mode title: "[Game Name] - Endless Mode"
- [ ] Speed run title: "[Game Name] - Speed Run"
- [ ] Daily challenge title: "[Game Name] - Daily Challenge"
- [ ] Game name sourced from MinigameRegistryService via route params
- [ ] Unit tests for: title resolver returns correct game name, fallback for unknown gameId

### T-2026-373
- Title: Create integration test for DailyChallengeService topic rotation prioritizing degrading topics
- Status: todo
- Assigned: unassigned
- Priority: low
- Size: S
- Milestone: P2
- Depends: T-2026-041, T-2026-023
- Blocked-by: —
- Tags: testing, integration, daily-challenge, spaced-repetition
- Refs: docs/progression.md, docs/research/gamification-patterns.md

Progression.md specifies "Daily challenge mode: Automatically rotates through degrading topics." DailyChallengeService (T-2026-041) uses a "degrading topic priority" algorithm that checks SpacedRepetitionService for topics needing review. No integration test verifies that degrading topics are actually prioritized in the daily challenge rotation.

Acceptance criteria:
- [ ] Integration test at `src/app/core/integration/daily-challenge-rotation.integration.spec.ts`
- [ ] Test: with no degraded topics, daily challenge selects from general pool
- [ ] Test: with degraded topics, daily challenge preferentially selects degraded topic's minigame
- [ ] Test: verify rotation doesn't repeat the same game on consecutive days (when alternatives exist)
- [ ] Uses real DailyChallengeService and SpacedRepetitionService

### T-2026-374
- Title: Wire LoadingSpinnerComponent into LevelSelectPage during level data loading
- Status: todo
- Assigned: unassigned
- Priority: low
- Size: S
- Milestone: P2
- Depends: T-2026-128, T-2026-077
- Blocked-by: —
- Tags: ui, loading, level-select, ux
- Refs: docs/ux/navigation.md, src/app/pages/level-select/level-select.ts

LevelSelectPage (T-2026-077) loads level data from LevelLoaderService when navigated to. During the loading period, no visual indicator is shown. LoadingSpinnerComponent (T-2026-128) provides the station-themed spinner but no ticket wires it into the level select page.

Acceptance criteria:
- [ ] LevelSelectPage shows LoadingSpinnerComponent while level data loads
- [ ] Spinner replaced with level list once data is available
- [ ] ErrorStateComponent shown if level data fails to load
- [ ] Unit tests for: loading state shown, spinner replaced on data load, error state on failure

### T-2026-414
- Title: Create integration test for P2 level pack registration via provideLevelData factory
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P2
- Depends: T-2026-137, T-2026-138, T-2026-139, T-2026-140
- Blocked-by: —
- Tags: testing, integration, level-data, p2, infrastructure
- Refs: src/app/data/levels/provide-level-data.ts, src/app/core/levels/level-loader.service.ts

T-2026-137 (completed) registered Module Assembly level data, and T-2026-138/139/140 will register Wire Protocol, Flow Commander, and Signal Corps. The provideLevelData factory and LevelLoaderService have unit tests, but no integration test verifies that all 4 P2 level packs coexist correctly: no ID collisions, all 72 levels (4 x 18) accessible, tier grouping correct across games.

Acceptance criteria:
- [ ] Integration test at `src/app/data/levels/p2-level-packs.integration.spec.ts`
- [ ] Test: registers all 4 P2 level packs via provideLevelData in a single TestBed
- [ ] Test: LevelLoaderService.getLevelPack() returns correct pack for each of the 4 gameIds
- [ ] Test: total of 72 levels accessible across all 4 games (18 each)
- [ ] Test: no level ID collisions between games
- [ ] Test: each pack has 4 tiers (basic, intermediate, advanced, boss)
- [ ] Test: loadLevel() returns correct game-specific level data type for each game
- [ ] Uses real LevelLoaderService and real level data constants

### T-2026-415
- Title: Create integration test for ConveyorBeltService + ModuleAssemblyEngine coordinated lifecycle
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P2
- Depends: T-2026-410
- Blocked-by: —
- Tags: testing, integration, module-assembly, conveyor-belt, engine
- Refs: docs/minigames/01-module-assembly.md, src/app/features/minigames/module-assembly/

After T-2026-410 wires ConveyorBeltService into the engine, this integration test verifies the coordinated lifecycle: loading parts, tick-based belt advancement, part removal on placement/rejection, exhaustion triggering win/lose evaluation, and reset on retry.

Acceptance criteria:
- [ ] Integration test at `src/app/features/minigames/module-assembly/conveyor-engine.integration.spec.ts`
- [ ] Test: engine.initialize() populates ConveyorBeltService with level parts
- [ ] Test: belt tick advances part positions; parts reaching end trigger missed-part penalty
- [ ] Test: placing a part via engine removes it from ConveyorBeltService
- [ ] Test: rejecting a decoy via engine removes it from ConveyorBeltService
- [ ] Test: ConveyorBeltService.isExhausted() triggers engine level evaluation
- [ ] Test: engine.reset() resets ConveyorBeltService to initial state
- [ ] Uses real ModuleAssemblyEngine and real ConveyorBeltService with level 1 data

### T-2026-421
- Title: Create integration test for Flow Commander pipeline simulation with gate routing
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P2
- Depends: T-2026-411
- Blocked-by: —
- Tags: testing, integration, flow-commander, simulation
- Refs: docs/minigames/03-flow-commander.md, src/app/features/minigames/flow-commander/

After T-2026-411 creates FlowCommanderSimulationService, this integration test verifies the full simulation pipeline: loading a pipeline graph, placing gates with conditions, running the simulation, and validating item routing against target zones.

Acceptance criteria:
- [ ] Integration test at `src/app/features/minigames/flow-commander/pipeline-simulation.integration.spec.ts`
- [ ] Test: @if gate filters items correctly (matching items pass, non-matching blocked)
- [ ] Test: @for gate duplicates items for each entry in a list
- [ ] Test: @switch gate routes items to correct output lanes based on value
- [ ] Test: multi-gate pipeline routes items through sequential gates
- [ ] Test: items reaching wrong targets counted as failures
- [ ] Test: items reaching dead-ends counted as lost
- [ ] Test: simulation with no gates results in all items reaching default target
- [ ] Uses real FlowCommanderSimulationService with sample pipeline data

### T-2026-422
- Title: Create integration test for Signal Corps wave blocking with configured towers
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P2
- Depends: T-2026-412
- Blocked-by: —
- Tags: testing, integration, signal-corps, wave-simulation
- Refs: docs/minigames/04-signal-corps.md, src/app/features/minigames/signal-corps/

After T-2026-412 creates SignalCorpsWaveService, this integration test verifies the wave simulation: noise signals approaching, towers blocking based on correct input/output configuration, unblocked signals dealing damage, and station health depleting to zero.

Acceptance criteria:
- [ ] Integration test at `src/app/features/minigames/signal-corps/wave-simulation.integration.spec.ts`
- [ ] Test: correctly configured tower blocks matching noise signal
- [ ] Test: misconfigured tower (wrong input type) lets noise through
- [ ] Test: unconfigured tower provides no blocking
- [ ] Test: unblocked signal deals damage to station health
- [ ] Test: station health reaching 0 triggers game over state
- [ ] Test: all signals blocked in a wave triggers wave completion
- [ ] Test: multi-wave progression with increasing difficulty
- [ ] Uses real SignalCorpsWaveService with sample wave data

### T-2026-423
- Title: Create integration test for Wire Protocol binding type validation across all wire types
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P2
- Depends: T-2026-413
- Blocked-by: —
- Tags: testing, integration, wire-protocol, validation
- Refs: docs/minigames/02-wire-protocol.md, src/app/features/minigames/wire-protocol/

After T-2026-413 creates WireProtocolValidationService, this integration test verifies wire type validation across all 4 binding types and common mistake detection.

Acceptance criteria:
- [ ] Integration test at `src/app/features/minigames/wire-protocol/wire-validation.integration.spec.ts`
- [ ] Test: interpolation wire between property source and {{ }} target validates correctly
- [ ] Test: property wire between property source and [property] target validates correctly
- [ ] Test: event wire between method source and (event) target validates correctly
- [ ] Test: two-way wire between model source and [(ngModel)] target validates correctly
- [ ] Test: wrong wire type (interpolation where property needed) returns validation failure with common mistake hint
- [ ] Test: validateAll() returns per-wire pass/fail for a set of mixed correct and incorrect wires
- [ ] Test: pre-wired incorrect connection detected as wrong on verification
- [ ] Uses real WireProtocolValidationService with sample port/wire data

### T-2026-424
- Title: Define achievement content data for 15+ predefined achievements
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P2
- Depends: —
- Blocked-by: —
- Tags: content, data, achievements, gamification
- Refs: docs/research/gamification-patterns.md, docs/progression.md

T-2026-109 (AchievementService, P8) says "minimum 15 total" achievements across Discovery, Mastery, and Commitment types, but no ticket defines the actual achievement content (names, descriptions, evaluation criteria, icons). Defining the content now allows achievement data to be used for planning UI and testing even before AchievementService is built in P8.

Acceptance criteria:
- [ ] Achievement data file at `src/app/data/achievements.data.ts`
- [ ] `AchievementDefinition` interface: id, title, description, type (discovery|mastery|commitment), isHidden, evaluationCriteria (string description)
- [ ] At least 5 Discovery achievements (e.g., "First Steps: Complete your first mission", "Explorer: Play all 4 P2 minigames", "Speed Demon: Complete a level under 30 seconds")
- [ ] At least 5 Mastery achievements (e.g., "Perfectionist: Get a perfect score", "Star Collector: Earn 50 total stars", "Topic Master: Reach 5 stars on any topic")
- [ ] At least 5 Commitment achievements (e.g., "Dedicated: 7-day streak", "Consistent: 14-day streak", "Marathon: 1 hour total play time")
- [ ] At least 3 hidden achievements
- [ ] Unit tests for: at least 15 total, all 3 types represented, hidden flag set on 3+

### T-2026-425
- Title: Define cosmetic items content data for station skins, themes, and badges
- Status: todo
- Assigned: unassigned
- Priority: low
- Size: S
- Milestone: P2
- Depends: —
- Blocked-by: —
- Tags: content, data, cosmetics, gamification
- Refs: docs/progression.md

Progression.md specifies "Cosmetic Unlocks (Future): Station module skins, UI themes, Achievement badges. Unlocked at rank milestones and mastery milestones." T-2026-111 (CosmeticService, P8) builds the service but no ticket defines what cosmetic items actually exist. Defining the content data now provides a catalog for planning.

Acceptance criteria:
- [ ] Cosmetic data file at `src/app/data/cosmetics.data.ts`
- [ ] `CosmeticDefinition` interface: id, name, type (skin|theme|badge), description, unlockCondition (rank milestone | mastery milestone | achievement), previewImagePath (optional)
- [ ] At least 4 station module skins (one per rank milestone: Ensign, Commander, Captain, Admiral)
- [ ] At least 3 UI themes (dark, station, light already exist; add 2+ unlockable variants)
- [ ] At least 4 achievement-tied badges
- [ ] Unit tests for: all 3 types represented, valid unlock conditions, minimum counts

### T-2026-472
- Title: Wire BindingTypeSelectorComponent into WireProtocolComponent UI
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: S
- Milestone: P2
- Depends: T-2026-420, T-2026-064
- Blocked-by: —
- Tags: integration, ui, minigame, wire-protocol, binding-type
- Refs: docs/minigames/02-wire-protocol.md, src/app/features/minigames/wire-protocol/wire-protocol.component.ts

T-2026-420 creates BindingTypeSelectorComponent for wire type toggling (interpolation/property/event/two-way). T-2026-064 created the Wire Protocol UI. No ticket wires the selector into the UI component. Without this, players have no way to switch wire types during gameplay.

Acceptance criteria:
- [ ] WireProtocolComponent renders BindingTypeSelectorComponent in the tools panel
- [ ] `selectedType` input bound to engine's current wire type signal
- [ ] `typeSelected` output updates the engine's active wire type for subsequent draws
- [ ] `availableTypes` input bound to level data's available wire types (basic levels may not have all 4)
- [ ] Keyboard shortcuts 1-4 work via KeyboardShortcutService integration
- [ ] Unit tests for: selector rendering, type change on selection, level-specific type filtering

### T-2026-473
- Title: Wire FlowCommanderGateConfigComponent into FlowCommanderComponent UI
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: S
- Milestone: P2
- Depends: T-2026-418, T-2026-068
- Blocked-by: —
- Tags: integration, ui, minigame, flow-commander, gate-config
- Refs: docs/minigames/03-flow-commander.md, src/app/features/minigames/flow-commander/flow-commander.component.ts

T-2026-418 creates FlowCommanderGateConfigComponent for gate condition editing. T-2026-068 created the Flow Commander UI. T-2026-245 wires ExpressionBuilderComponent into gate config but does not wire the gate config panel itself into the main UI. This ticket wires the gate config panel into FlowCommanderComponent so players can click a gate and configure its condition.

Acceptance criteria:
- [ ] FlowCommanderComponent renders FlowCommanderGateConfigComponent when a gate is selected
- [ ] Gate click on the pipeline canvas opens the config panel for that gate
- [ ] `gateType` input bound to the clicked gate's type (@if/@for/@switch)
- [ ] `tierMode` input set based on current level tier (guided for basic/intermediate, raw for advanced)
- [ ] `conditionApplied` output updates the gate condition in the engine
- [ ] `cancelled` output closes the config panel without changes
- [ ] Panel dismisses when clicking outside or pressing Escape
- [ ] Unit tests for: panel opens on gate click, condition applied, cancel dismisses, tier mode switching

### T-2026-474
- Title: Wire SignalCorpsTowerConfigComponent into SignalCorpsComponent UI
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: S
- Milestone: P2
- Depends: T-2026-419, T-2026-072
- Blocked-by: —
- Tags: integration, ui, minigame, signal-corps, tower-config
- Refs: docs/minigames/04-signal-corps.md, src/app/features/minigames/signal-corps/signal-corps.component.ts

T-2026-419 creates SignalCorpsTowerConfigComponent for tower input/output declaration. T-2026-072 created the Signal Corps UI. No ticket wires the tower config panel into the main UI. Without this, players cannot configure towers during gameplay.

Acceptance criteria:
- [ ] SignalCorpsComponent renders SignalCorpsTowerConfigComponent when a tower is selected
- [ ] Tower click on the grid opens the config panel for that tower
- [ ] `tower` input bound to the clicked tower's current config
- [ ] `parentProperties` and `parentHandlers` inputs populated from level data
- [ ] `configApplied` output updates the tower config in the engine
- [ ] `cancelled` output closes the config panel without changes
- [ ] Validation errors from the panel prevent applying invalid configs
- [ ] Unit tests for: panel opens on tower click, config applied, cancel dismisses, validation blocks invalid config

### T-2026-475
- Title: Add "Launch Minigame" button to StoryMissionPage after mission completion
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: S
- Milestone: P2
- Depends: T-2026-075, T-2026-407
- Blocked-by: —
- Tags: ui, story-missions, navigation, minigame-unlock
- Refs: docs/ux/navigation.md, docs/curriculum.md, src/app/pages/mission/

Navigation.md specifies the Story Mission View includes a "Launch Minigame" button (unlocks after mission completion). StoryMissionPage (T-2026-075) was built with step navigation and completion flow, but no ticket adds the post-completion "Launch Minigame" button that navigates to the newly unlocked minigame. This is a critical UX element in the core game loop: Story Mission -> Unlock Minigame.

Acceptance criteria:
- [ ] StoryMissionPage shows "Launch Minigame" button after mission completion
- [ ] Button only appears for chapters that unlock a minigame (via CurriculumService.getMinigameForChapter())
- [ ] Button navigates to `/minigames/:gameId` (level select for the unlocked minigame)
- [ ] Button label includes minigame name (e.g., "Launch Module Assembly")
- [ ] For chapters that don't unlock a minigame (Ch 9, 10, 27, 33, 34), shows "Continue to Next Mission" instead
- [ ] Button styled with Reactor Blue accent and station theme glow
- [ ] Unit tests for: button visible after completion, correct navigation target, hidden for non-unlock chapters

### T-2026-476
- Title: Create integration test for FlowCommanderSimulationService + FlowCommanderEngine coordinated lifecycle
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P2
- Depends: T-2026-469
- Blocked-by: —
- Tags: testing, integration, flow-commander, simulation, engine
- Refs: docs/minigames/03-flow-commander.md, src/app/features/minigames/flow-commander/

After T-2026-469 wires FlowCommanderSimulationService into the engine, this integration test verifies the coordinated lifecycle: loading a pipeline, placing gates, running simulation, and evaluating results through the engine's action pipeline.

Acceptance criteria:
- [ ] Integration test at `src/app/features/minigames/flow-commander/simulation-engine.integration.spec.ts`
- [ ] Test: engine.initialize() loads pipeline into simulation service
- [ ] Test: placeGate action delegates to simulation service and updates engine state
- [ ] Test: simulate action runs cargo through pipeline and evaluates correctness
- [ ] Test: all cargo reaching correct targets triggers engine completion
- [ ] Test: cargo reaching wrong targets deducts lives
- [ ] Test: engine.reset() resets simulation service state
- [ ] Uses real FlowCommanderEngine and FlowCommanderSimulationService with level 1 data

### T-2026-477
- Title: Create integration test for SignalCorpsWaveService + SignalCorpsEngine coordinated lifecycle
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P2
- Depends: T-2026-470
- Blocked-by: —
- Tags: testing, integration, signal-corps, wave-simulation, engine
- Refs: docs/minigames/04-signal-corps.md, src/app/features/minigames/signal-corps/

After T-2026-470 wires SignalCorpsWaveService into the engine, this integration test verifies the coordinated lifecycle: loading waves, deploying towers, tick-based wave progression, blocking evaluation, and damage application.

Acceptance criteria:
- [ ] Integration test at `src/app/features/minigames/signal-corps/wave-engine.integration.spec.ts`
- [ ] Test: engine.initialize() loads waves into wave service
- [ ] Test: deploy action starts wave via wave service
- [ ] Test: correctly configured towers block matching noise signals
- [ ] Test: unblocked signals deal damage via wave service, reducing engine lives
- [ ] Test: all waves completed triggers engine completion
- [ ] Test: station health reaching 0 triggers engine failure
- [ ] Test: engine.reset() resets wave service state
- [ ] Uses real SignalCorpsEngine and SignalCorpsWaveService with level 1 data

### T-2026-478
- Title: Create integration test for WireProtocolValidationService + WireProtocolEngine coordinated lifecycle
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P2
- Depends: T-2026-471
- Blocked-by: —
- Tags: testing, integration, wire-protocol, validation, engine
- Refs: docs/minigames/02-wire-protocol.md, src/app/features/minigames/wire-protocol/

After T-2026-471 wires WireProtocolValidationService into the engine, this integration test verifies the coordinated lifecycle: loading port data, drawing wires with type validation, verifying all connections, and scoring.

Acceptance criteria:
- [ ] Integration test at `src/app/features/minigames/wire-protocol/validation-engine.integration.spec.ts`
- [ ] Test: engine.initialize() provides validation service with level port/wire data
- [ ] Test: drawing a wire with correct type returns positive validation
- [ ] Test: drawing a wire with wrong type returns validation failure with common mistake hint
- [ ] Test: verify action validates all wires against solution via service
- [ ] Test: all wires correct on first verify triggers engine completion with perfect score
- [ ] Test: 3 failed verifications triggers engine failure
- [ ] Test: engine.reset() clears validation state
- [ ] Uses real WireProtocolEngine and WireProtocolValidationService with level 1 data

### T-2026-479
- Title: Create StoryMissionPage completion summary with XP award display
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P2
- Depends: T-2026-075, T-2026-259
- Blocked-by: —
- Tags: ui, story-missions, completion, xp
- Refs: docs/overview.md, docs/progression.md, docs/ux/navigation.md

Overview.md specifies story missions award 50 XP. When a player completes the final step of a story mission, there should be a completion summary showing the XP earned, mastery star gained, and optionally the minigame that was unlocked. Currently StoryMissionPage has a completion flow but no visual summary of rewards.

Acceptance criteria:
- [ ] StoryMissionPage shows a completion summary overlay after the final step
- [ ] Summary displays: "Mission Complete" heading, +50 XP earned, topic mastery gained (1 star)
- [ ] If a minigame was unlocked, summary shows unlock message with game name and icon
- [ ] "Launch Minigame" button in summary navigates to the unlocked game (connects to T-2026-475)
- [ ] "Continue" button navigates to campaign page or next mission
- [ ] Summary uses station-themed styling (Sensor Green accent for success)
- [ ] Unit tests for: summary rendering, XP display, unlock message presence/absence, navigation buttons

### T-2026-480
- Title: Add `/campaign` route to bottom nav and side nav when CampaignPage is ready
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P2
- Depends: T-2026-141, T-2026-167, T-2026-314
- Blocked-by: —
- Tags: navigation, campaign, routing, integration
- Refs: docs/ux/navigation.md, src/app/side-nav/, src/app/bottom-nav/

Navigation.md specifies side nav has "Current Mission" and bottom nav has "Mission". T-2026-167 creates the campaign route and T-2026-227/228 updated nav to use dynamic mission resolution. T-2026-314 plans to update bottom nav to point to `/campaign`. But no ticket coordinates updating BOTH side nav and bottom nav to consistently point to `/campaign` as the primary "Mission" destination once CampaignPage is built, replacing the dynamic individual mission resolution.

Acceptance criteria:
- [ ] Side nav "Current Mission" link updated to navigate to `/campaign`
- [ ] Bottom nav "Mission" tab updated to navigate to `/campaign`
- [ ] `routerLinkActive` highlights both nav items when on `/campaign` or any `/mission/:chapterId` route
- [ ] If player has an active mission, `/campaign` page scrolls to or highlights that mission (future enhancement noted)
- [ ] Existing unit tests updated for new route targets
- [ ] No regression in nav behavior for other links

### T-2026-481
- Title: Create integration test for MinigameTutorialOverlay first-play detection with real persistence
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P2
- Depends: T-2026-205, T-2026-382
- Blocked-by: —
- Tags: testing, integration, tutorial, minigame, persistence
- Refs: docs/minigames/01-module-assembly.md, src/app/shared/components/minigame-tutorial/

T-2026-205 integrated the tutorial overlay with first-play detection. T-2026-382 wires tutorial step data into the registry. No integration test verifies the full chain: first visit to a minigame shows tutorial with correct game-specific steps -> dismiss -> persisted -> second visit skips tutorial. This is important because a broken tutorial blocks first-time gameplay.

Acceptance criteria:
- [ ] Integration test at `src/app/shared/components/minigame-tutorial/tutorial-first-play.integration.spec.ts`
- [ ] Test: first play of Module Assembly shows tutorial with game-specific steps from MinigameInstructionsData
- [ ] Test: dismiss tutorial -> tutorial-seen flag persisted to localStorage
- [ ] Test: subsequent play with tutorial-seen flag -> tutorial not shown, engine starts immediately
- [ ] Test: "How to Play" from pause menu shows tutorial without blocking engine restart
- [ ] Uses real StatePersistenceService with fake localStorage

### T-2026-482
- Title: Create StoryMissionPage keyboard navigation for mission steps
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P2
- Depends: T-2026-075
- Blocked-by: —
- Tags: accessibility, a11y, story-missions, keyboard-navigation
- Refs: docs/ux/navigation.md, docs/ux/visual-style.md, src/app/pages/mission/

StoryMissionPage (T-2026-075) has step navigation (Next/Previous buttons) but no keyboard shortcuts for advancing through mission steps. Keyboard users must tab to the Next button for each step. Adding arrow key navigation (Right arrow = next step, Left arrow = previous step) improves accessibility and pacing for all users.

Acceptance criteria:
- [ ] Right arrow key advances to the next mission step (same as clicking Next)
- [ ] Left arrow key goes to the previous step (same as clicking Previous)
- [ ] Arrow keys only active when StoryMissionPage has focus (not when code editor or other inputs are focused)
- [ ] Enter key on the final step triggers completion (same as clicking Complete)
- [ ] Keyboard shortcuts disabled during completion overlay display
- [ ] Unit tests for: right arrow advances, left arrow reverses, boundary conditions (first step, last step)

### T-2026-483
- Title: Create P2 minigame sub-service integration test for all 4 simulation/validation services with level data
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: M
- Milestone: P2
- Depends: T-2026-411, T-2026-412, T-2026-413, T-2026-058, T-2026-062, T-2026-066, T-2026-070
- Blocked-by: —
- Tags: testing, integration, minigame, p2, data-validation
- Refs: docs/minigames/01-module-assembly.md, docs/minigames/02-wire-protocol.md, docs/minigames/03-flow-commander.md, docs/minigames/04-signal-corps.md

Each P2 minigame has a simulation/validation sub-service (ConveyorBeltService, WireProtocolValidationService, FlowCommanderSimulationService, SignalCorpsWaveService) and corresponding level data (18 levels each). No integration test verifies that all 72 level data entries are compatible with their respective simulation/validation services. Data shape mismatches would cause runtime errors.

Acceptance criteria:
- [ ] Integration test at `src/app/features/minigames/p2-data-service-compat.integration.spec.ts`
- [ ] Test: all 18 Module Assembly levels load into ConveyorBeltService without errors
- [ ] Test: all 18 Wire Protocol levels provide valid port/wire data for WireProtocolValidationService
- [ ] Test: all 18 Flow Commander levels provide valid pipeline topology for FlowCommanderSimulationService
- [ ] Test: all 18 Signal Corps levels provide valid wave/tower data for SignalCorpsWaveService
- [ ] Test: each service can be reset and loaded with a different level from its pack
- [ ] Uses real services and real level data constants

### T-2026-484
- Title: Create CampaignPage with mission list grouped by curriculum phases
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: M
- Milestone: P2
- Depends: T-2026-167, T-2026-026, T-2026-038
- Blocked-by: —
- Tags: page, campaign, story-missions, ui
- Refs: docs/ux/navigation.md, docs/curriculum.md, src/app/pages/campaign/

T-2026-141 describes the CampaignProgressPage but depends on LockedContentComponent. The campaign route exists (T-2026-167) with a placeholder page. This ticket replaces the placeholder with a functional CampaignPage that displays all 34 missions grouped by the 6 curriculum phases with completion status from GameProgressionService.

Acceptance criteria:
- [ ] `CampaignPage` replaces placeholder at `src/app/pages/campaign/campaign.ts`
- [ ] Displays all 34 missions grouped by curriculum phase (Foundations, Navigation, Data Input, etc.)
- [ ] Each mission shows: chapter number, title, Angular topic, completion status
- [ ] Completed missions show a checkmark indicator
- [ ] Locked missions show a lock indicator with prerequisite info
- [ ] Next available mission highlighted with "Continue" button
- [ ] Phase headers show progress (e.g., "Phase 1: 7/10 completed")
- [ ] Click unlocked mission navigates to `/mission/:chapterId`
- [ ] Unit tests for: phase grouping, completion status, locked state, navigation, progress counts

### T-2026-487
- Title: Wire FlowCommanderSimulationService visual state into FlowCommanderComponent for cargo animation
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: S
- Milestone: P2
- Depends: T-2026-469, T-2026-068
- Blocked-by: —
- Tags: integration, ui, flow-commander, simulation, visual-state
- Refs: docs/minigames/03-flow-commander.md, src/app/features/minigames/flow-commander/flow-commander.ts

T-2026-469 wires FlowCommanderSimulationService into FlowCommanderEngine for lifecycle delegation. But the Flow Commander UI component (T-2026-068) needs the simulation service's visual state to animate cargo pods flowing through pipelines, show routing results at gates, and display items reaching target zones or dead-ends. Without this, the "Run" phase has no visual cargo animation.

Acceptance criteria:
- [ ] FlowCommanderComponent receives simulation state signals from the engine or via DI
- [ ] Cargo pods animate along pipeline paths during simulation
- [ ] Gate routing decisions shown visually (items splitting at @if, duplicating at @for, branching at @switch)
- [ ] Items reaching correct targets glow green; items reaching wrong targets flash red
- [ ] Items lost to dead-ends show a break-apart animation
- [ ] Simulation progress signal used to step through animation frames
- [ ] Unit tests for: cargo position updates, correct/incorrect routing visual feedback, dead-end handling

### T-2026-488
- Title: Wire SignalCorpsWaveService visual state into SignalCorpsComponent for wave animation
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: S
- Milestone: P2
- Depends: T-2026-470, T-2026-072
- Blocked-by: —
- Tags: integration, ui, signal-corps, wave-simulation, visual-state
- Refs: docs/minigames/04-signal-corps.md, src/app/features/minigames/signal-corps/signal-corps.ts

T-2026-470 wires SignalCorpsWaveService into SignalCorpsEngine for lifecycle delegation. But the Signal Corps UI component (T-2026-072) needs the wave service's visual state to animate noise waves approaching, show blocking shield pulses from configured towers, display damage when signals get through, and update the station health bar. Without this, the wave defense has no visual feedback.

Acceptance criteria:
- [ ] SignalCorpsComponent receives wave service state signals from the engine or via DI
- [ ] Noise waves animate approaching from edges based on wave service position data
- [ ] Tower blocking visualized: shield pulse emitted when a tower blocks a matching signal
- [ ] Unblocked signals show impact damage animation on station
- [ ] Station health bar reflects `waveService.stationHealth` signal
- [ ] Wave progress indicator shows current wave number and total waves
- [ ] Unit tests for: wave position rendering, blocking animation trigger, damage animation, health bar binding

### T-2026-489
- Title: Wire WireProtocolValidationService feedback into WireProtocolComponent for per-wire visual indicators
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: S
- Milestone: P2
- Depends: T-2026-471, T-2026-064
- Blocked-by: —
- Tags: integration, ui, wire-protocol, validation, visual-state
- Refs: docs/minigames/02-wire-protocol.md, src/app/features/minigames/wire-protocol/wire-protocol.ts

T-2026-471 wires WireProtocolValidationService into WireProtocolEngine for verify action delegation. But the Wire Protocol UI component (T-2026-064) needs validation results to provide per-wire visual feedback: green glow for correct wires, red spark for incorrect wires, and common mistake hint text displayed near incorrect connections. The spec says "Incorrect wires spark and fizzle." Without this wiring, the verify action has no visual wire-by-wire feedback.

Acceptance criteria:
- [ ] WireProtocolComponent receives per-wire validation results after verify action
- [ ] Correct wires show green glow with flowing particle animation (data flowing)
- [ ] Incorrect wires show red spark/fizzle animation
- [ ] Common mistake hint text (from `validationService.getCommonMistake()`) displayed as tooltip near incorrect wires
- [ ] Validation results cleared on next verify attempt or when wires are modified
- [ ] Pre-wired incorrect connections highlighted distinctly from player-drawn incorrect wires
- [ ] Unit tests for: correct wire green glow, incorrect wire red spark, hint text display, result clearing

### T-2026-490
- Title: Create integration test for StoryMissionCompletionService full XP-mastery-unlock pipeline
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P2
- Depends: T-2026-259, T-2026-407
- Blocked-by: —
- Tags: testing, integration, story-missions, progression, critical-path
- Refs: docs/overview.md, docs/progression.md, docs/curriculum.md

T-2026-259 (completed) created StoryMissionCompletionService. T-2026-352 tests the unlock notification chain. But no integration test verifies the full internal pipeline of the completion handler: calling `completeMission()` -> awarding 50 XP via XpService -> setting mastery to 1 star via MasteryService -> unlocking the minigame via GameProgressionService -> recording the mission as completed. This is the most critical progression path in the app.

Acceptance criteria:
- [ ] Integration test at `src/app/core/integration/mission-completion-pipeline.integration.spec.ts`
- [ ] Test: `completeMission(1)` awards exactly 50 XP via XpService.addXp()
- [ ] Test: `completeMission(1)` sets mastery for 'module-assembly' topic to at least 1 star
- [ ] Test: `completeMission(1)` marks Chapter 1 as completed in GameProgressionService
- [ ] Test: `completeMission(1)` unlocks Module Assembly minigame (GameProgressionService reports unlocked)
- [ ] Test: `completeMission(9)` (Ch 9: Deferrable Views, no minigame unlock) still awards XP and mastery but does not trigger unlock
- [ ] Test: completing an already-completed mission is idempotent (no duplicate XP)
- [ ] Uses real StoryMissionCompletionService, XpService, MasteryService, GameProgressionService, CurriculumService

### T-2026-491
- Title: Create MissionUnlockNotificationComponent for minigame unlock toast rendering
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P2
- Depends: T-2026-189, T-2026-007
- Blocked-by: —
- Tags: ui, component, notifications, minigame-unlock
- Refs: docs/overview.md, docs/ux/visual-style.md, src/app/core/notifications/

T-2026-189 (completed) creates MissionUnlockNotificationService which tracks unlock events. T-2026-338 wires the service into the app shell root. But there is no visual component that renders the actual unlock toast. The service manages state (what to show, when to dismiss), but a component is needed to display the unlock message with game name, icon, and navigation action. Without this, the service fires events but nothing renders.

Acceptance criteria:
- [ ] `MissionUnlockNotificationComponent` at `src/app/shared/components/mission-unlock-notification/`
- [ ] Selector: `nx-mission-unlock-notification`
- [ ] Reads from MissionUnlockNotificationService unlock signal
- [ ] Displays: "Minigame Unlocked!" heading, game name, game description, game icon/color
- [ ] "Play Now" button navigates to `/minigames/:gameId` (level select)
- [ ] Auto-dismiss after 8 seconds (configurable)
- [ ] Slide-in animation from top-right (respects prefers-reduced-motion)
- [ ] Station-themed styling: Solar Gold accent, Hull background
- [ ] Exported from shared components barrel
- [ ] Unit tests for: notification rendering, auto-dismiss, play-now navigation, animation

### T-2026-492
- Title: Create P2 minigame UI-to-simulation service visual state integration tests
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: M
- Milestone: P2
- Depends: T-2026-486, T-2026-487, T-2026-488, T-2026-489
- Blocked-by: —
- Tags: testing, integration, minigame, visual-state, p2
- Refs: docs/minigames/01-module-assembly.md, docs/minigames/02-wire-protocol.md, docs/minigames/03-flow-commander.md, docs/minigames/04-signal-corps.md

T-2026-486 through T-2026-489 wire simulation/validation service visual state into each P2 minigame UI component. No integration test verifies that the UI components correctly reflect service state changes. These tests ensure the visual feedback loop works: engine action -> service state update -> UI renders updated state.

Acceptance criteria:
- [ ] Integration test at `src/app/features/minigames/p2-visual-state.integration.spec.ts`
- [ ] Test: Module Assembly -- engine tick advances belt parts, UI renders updated positions
- [ ] Test: Wire Protocol -- verify action produces per-wire results, UI shows green/red indicators
- [ ] Test: Flow Commander -- simulation run moves cargo through pipeline, UI renders cargo at gate positions
- [ ] Test: Signal Corps -- deploy action starts wave, UI renders wave positions and health bar
- [ ] Each test: uses real engine + real simulation service + component fixture
- [ ] Each test: verifies DOM state reflects service signal values after engine action

### T-2026-493
- Title: Create MinigameHubPage filter functionality for topic and mastery level
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P2
- Depends: T-2026-076, T-2026-339
- Blocked-by: —
- Tags: ui, minigame-hub, filter, ux
- Refs: docs/ux/navigation.md

Navigation.md specifies the Minigame Hub includes "Filter by topic, mastery level." MinigameHubPage (T-2026-076) renders a grid of minigame cards but no ticket implements the filter functionality. Without filters, players with many unlocked minigames cannot quickly find games by Angular topic or mastery level.

Acceptance criteria:
- [ ] MinigameHubPage has filter controls above the minigame grid
- [ ] Topic filter: dropdown/pills with Angular topics (Components, Data Binding, Control Flow, etc.)
- [ ] Mastery filter: dropdown/pills with mastery ranges (0-1 stars, 2-3 stars, 4-5 stars, All)
- [ ] Filters are combinable (e.g., "Data Binding" + "0-1 stars")
- [ ] Card grid updates reactively when filters change
- [ ] "Clear filters" button resets to show all games
- [ ] Filter state does not persist across navigation (resets on page load)
- [ ] Unit tests for: topic filter applies, mastery filter applies, combined filters, clear filters

### T-2026-494
- Title: Add "Continue" button to StoryMissionPage for navigating to next mission
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P2
- Depends: T-2026-075, T-2026-026
- Blocked-by: —
- Tags: ui, story-missions, navigation, ux
- Refs: docs/ux/navigation.md, docs/curriculum.md, src/app/pages/mission/mission.ts

StoryMissionPage (T-2026-075) has completion flow and T-2026-475 adds "Launch Minigame" for chapters that unlock a minigame. But for chapters that do NOT unlock a minigame (Ch 9, 10, 27, 33, 34), there is no navigation after completion except the browser back button. A "Continue to Next Mission" button should be shown for all chapters, enabling the player to advance through the curriculum without returning to the campaign page.

Acceptance criteria:
- [ ] StoryMissionPage shows "Continue to Next Mission" button after mission completion
- [ ] Button navigates to `/mission/:nextChapterId` using GameProgressionService to determine the next uncompleted chapter
- [ ] If the current chapter is the last in its phase, button label reads "Continue to Next Phase"
- [ ] If all missions are complete, button navigates to `/campaign` with "Back to Campaign" label
- [ ] Button appears alongside "Launch Minigame" (T-2026-475) when both are applicable
- [ ] Unit tests for: next mission navigation, last-in-phase label, all-complete navigation

### T-2026-495
- Title: Add keyboard shortcut hints overlay to MinigameShell HUD
- Status: todo
- Assigned: unassigned
- Priority: low
- Size: S
- Milestone: P2
- Depends: T-2026-134, T-2026-018
- Blocked-by: —
- Tags: ui, accessibility, keyboard, minigame, hud
- Refs: docs/ux/visual-style.md, docs/research/gamification-patterns.md

Each P2 minigame has keyboard shortcuts (Module Assembly: number keys for slots + spacebar; Wire Protocol: 1-4 for wire types; Flow Commander: arrow keys; Signal Corps: click-based). PauseMenuComponent (T-2026-135) shows keyboard shortcuts in the pause menu, but during active gameplay, players have no visible reminder of available shortcuts. A small toggleable hint overlay on the MinigameShell HUD would improve discoverability without cluttering the UI.

Acceptance criteria:
- [ ] MinigameShell HUD has a small "?" or keyboard icon button
- [ ] Clicking the button toggles a compact shortcut hint panel (does not pause the game)
- [ ] Panel shows registered shortcuts from KeyboardShortcutService for the current minigame
- [ ] Panel auto-hides after 5 seconds of inactivity
- [ ] Panel positioned to avoid overlapping game area (top-right corner, semi-transparent)
- [ ] Keyboard shortcut to toggle: "?" key
- [ ] Panel respects prefers-reduced-motion (no fade animation)
- [ ] Unit tests for: panel toggle, shortcut list from service, auto-hide timer

### T-2026-496
- Title: Create integration test for theme-aware component rendering with design token CSS custom properties
- Status: todo
- Assigned: unassigned
- Priority: low
- Size: S
- Milestone: P2
- Depends: T-2026-325, T-2026-143
- Blocked-by: —
- Tags: testing, integration, themes, css, visual-style
- Refs: docs/ux/visual-style.md, src/styles.css

T-2026-325 creates theme CSS variants (dark, station, light) and T-2026-143 wires theme preference to body class. But no integration test verifies that switching themes actually changes the CSS custom property values that components consume. If a theme file has a typo in a custom property name, components will silently fall back to the default theme.

Acceptance criteria:
- [ ] Integration test at `src/app/core/integration/theme-custom-properties.integration.spec.ts`
- [ ] Test: default theme-dark body class applies expected `--color-bg-primary` value (Void #0A0E1A)
- [ ] Test: switching to theme-station applies station-specific custom property values
- [ ] Test: switching to theme-light applies light-specific custom property values (white backgrounds, dark text)
- [ ] Test: all critical custom properties are defined in all 3 themes (no undefined fallbacks)
- [ ] Test: toggling back to theme-dark after theme-light restores original values
- [ ] Uses real DOM with getComputedStyle to verify actual CSS property resolution

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

### T-2026-261
- Title: Register story mission content for P3 missions (Ch 11-13) with StoryMissionContentService
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: S
- Milestone: P3
- Depends: T-2026-085, T-2026-166
- Blocked-by: —
- Tags: integration, story-missions, content-loading, phase-2
- Refs: docs/curriculum.md

T-2026-085 creates Phase 2 Navigation mission content (Ch 11-13) and T-2026-166 creates StoryMissionContentService. This ticket registers the content so StoryMissionPage can load it by chapterId.

Acceptance criteria:
- [ ] Phase 2 mission content (Ch 11-13) registered with StoryMissionContentService
- [ ] `getMissionContent(11)` through `getMissionContent(13)` return valid content
- [ ] Unit tests for: content loading for each chapter

### T-2026-266
- Title: Create Corridor Runner route configuration and map data model
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: S
- Milestone: P3
- Depends: T-2026-019
- Blocked-by: —
- Tags: minigame, corridor-runner, data-model, routing
- Refs: docs/minigames/05-corridor-runner.md

Corridor Runner's tech notes say "Route config is validated against a schema matching Angular's Routes type" and "Map layout is data-driven: nodes (modules) + edges (corridors)." P2 minigames have data model tickets (T-2026-255 through T-2026-258) but Corridor Runner does not. This ticket defines the type-safe data model before level data or engine can be built.

Acceptance criteria:
- [ ] `RouteConfig` interface at `src/app/features/minigames/corridor-runner/corridor-runner.types.ts`
- [ ] `RouteEntry`: path, component (string), redirectTo, pathMatch, children (recursive), canActivate, resolve, loadComponent
- [ ] `MapNode`: id, label, position (x, y), moduleType, isAccessible
- [ ] `MapEdge`: sourceId, targetId, corridorType
- [ ] `StationMap`: nodes[], edges[]
- [ ] `TestNavigation`: startUrl, expectedDestination, description
- [ ] `HullBreachResult`: url, reason (no-match | guard-blocked)
- [ ] Exported from corridor-runner barrel
- [ ] Unit tests for: route config validation, map connectivity helpers

### T-2026-267
- Title: Create P3 end-to-end smoke test for Corridor Runner game loop
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P3
- Depends: T-2026-084
- Blocked-by: —
- Tags: testing, e2e, corridor-runner, game-loop
- Refs: docs/minigames/05-corridor-runner.md, playwright.config.ts

P2 has an end-to-end smoke test (T-2026-142) covering the full game loop. P3 has integration tests (T-2026-192) but no E2E test that validates the Corridor Runner is playable via browser navigation.

Acceptance criteria:
- [ ] Playwright test at `e2e/corridor-runner.spec.ts`
- [ ] Test: navigate to `/minigames/corridor-runner/level/1`, verify game renders with config phase UI
- [ ] Test: verify MinigameShell HUD is present (score, timer)
- [ ] Test: verify code editor component renders in config phase
- [ ] Test runs in CI (GitHub Actions)

### T-2026-426
- Title: Create CorridorRunnerSimulationService for route resolution and navigation testing
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: M
- Milestone: P3
- Depends: T-2026-266
- Blocked-by: —
- Tags: minigame, corridor-runner, service, simulation, routing
- Refs: docs/minigames/05-corridor-runner.md

Corridor Runner has a two-phase design: Config (route editing) and Run (navigation simulation). The Run phase simulates Angular router resolution: matching routes, resolving redirects, detecting wildcards, handling params, and detecting hull breaches (404s). The engine (T-2026-082) is L-size; extracting the route resolution simulation into a standalone service follows the P2 pattern (ConveyorBeltService, FlowCommanderSimulationService, etc.) and makes the simulation independently testable.

Acceptance criteria:
- [ ] `CorridorRunnerSimulationService` at `src/app/features/minigames/corridor-runner/corridor-runner-simulation.service.ts`
- [ ] `loadRouteConfig(routes: RouteEntry[])`: initializes the simulated router from player-edited config
- [ ] `resolveNavigation(url: string): NavigationResult`: resolves a URL against the route config, returning matched component or hull breach
- [ ] `resolveRedirects(url: string): string`: follows redirectTo chains until a terminal route
- [ ] `matchRoute(url: string, routes: RouteEntry[]): MatchResult`: finds the best matching route entry
- [ ] `extractParams(url: string, routePath: string): Record<string, string>`: extracts route params from URL
- [ ] `detectHullBreach(url: string): boolean`: returns true if no route matches (404)
- [ ] Handles: exact paths, wildcard (**), redirectTo, pathMatch ('full' | 'prefix'), children (nested routes), route params (:id)
- [ ] `reset()`: clears route config
- [ ] Exported from corridor-runner barrel
- [ ] Unit tests for: exact path matching, wildcard matching, redirect resolution, param extraction, nested route matching, hull breach detection, pathMatch full vs prefix

### T-2026-427
- Title: Create integration test for CorridorRunnerSimulationService route resolution
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P3
- Depends: T-2026-426
- Blocked-by: —
- Tags: testing, integration, corridor-runner, simulation
- Refs: docs/minigames/05-corridor-runner.md

After T-2026-426 creates the simulation service, this integration test verifies the full route resolution pipeline using sample level data: loading route configs, running test navigations, and validating all results match expected destinations.

Acceptance criteria:
- [ ] Integration test at `src/app/features/minigames/corridor-runner/route-simulation.integration.spec.ts`
- [ ] Test: simple route config with 3 paths resolves all test navigations correctly
- [ ] Test: redirect chain resolves to final destination
- [ ] Test: unmatched URL triggers hull breach detection
- [ ] Test: nested child routes resolve with correct parent/child composition
- [ ] Test: route params extracted correctly from parameterized URLs
- [ ] Test: wildcard route catches all unmatched paths
- [ ] Uses real CorridorRunnerSimulationService with level 1 data

### T-2026-460
- Title: Create CorridorRunnerMapComponent for top-down station map navigation visualization
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: S
- Milestone: P3
- Depends: T-2026-266, T-2026-007
- Blocked-by: —
- Tags: ui, component, minigame, corridor-runner, map
- Refs: docs/minigames/05-corridor-runner.md, docs/ux/visual-style.md

Corridor Runner spec describes a "top-down station map with corridors and modules" where "corridors light up as routes are configured" and "crew member sprite with walking animation along routes." The UI component (T-2026-083) is L-size. Extracting the map visualization follows the P2 sub-component pattern (graph canvas, pipeline viz, etc.). The map is the core visual element of the Run phase.

Acceptance criteria:
- [ ] `CorridorRunnerMapComponent` at `src/app/features/minigames/corridor-runner/map/map.ts`
- [ ] Renders top-down station layout from MapNode[] and MapEdge[] data
- [ ] Module nodes rendered at (x, y) positions with labels
- [ ] Corridor edges rendered as connecting paths between modules
- [ ] Corridors light up (glow) when their corresponding route is configured
- [ ] Crew member sprite rendered at current position with walking animation along corridors
- [ ] Input: `stationMap` (StationMap), `configuredRoutes` (RouteEntry[]), `crewPosition` (MapNode | null), `crewPath` (MapNode[])
- [ ] Output: `moduleClicked` event with moduleId
- [ ] Hull breach animation: decompression visual at dead-end modules (per spec)
- [ ] Successful arrival: door open animation at destination module
- [ ] Exported from corridor-runner barrel
- [ ] Unit tests for: node rendering, corridor glow on route config, crew movement along path, hull breach animation state

### T-2026-428
- Title: Create CorridorRunnerRouteEditorComponent for config phase route editing
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: S
- Milestone: P3
- Depends: T-2026-266, T-2026-031, T-2026-007
- Blocked-by: —
- Tags: ui, component, minigame, corridor-runner, route-editor
- Refs: docs/minigames/05-corridor-runner.md

Corridor Runner spec describes a Config phase where the player edits route configurations via a code editor. The UI component (T-2026-083) is already L-size. Extracting the route editor panel into a standalone sub-component follows the P2 pattern (FlowCommanderGateConfigComponent, etc.) and reduces T-2026-083's complexity.

Acceptance criteria:
- [ ] `RouteEditorComponent` at `src/app/features/minigames/corridor-runner/route-editor/route-editor.ts`
- [ ] Renders CodeEditorComponent with route config syntax highlighting
- [ ] Input: `initialConfig` (RouteEntry[]), `availableComponents` (string[])
- [ ] Autocomplete/validation hints for route properties (path, component, redirectTo, pathMatch, children)
- [ ] Output: `configChanged` event with updated RouteEntry[] on user edits
- [ ] Output: `configSubmitted` event when player clicks "Lock Routes" to transition to Run phase
- [ ] Validation feedback: highlights invalid route entries (missing path, unknown component)
- [ ] Exported from corridor-runner barrel
- [ ] Unit tests for: initial config rendering, config change emission, validation feedback, submit event

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

### T-2026-262
- Title: Register story mission content for P4 missions (Ch 14-17) with StoryMissionContentService
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: S
- Milestone: P4
- Depends: T-2026-090, T-2026-166
- Blocked-by: —
- Tags: integration, story-missions, content-loading, phase-3
- Refs: docs/curriculum.md

T-2026-090 creates Phase 3 Data Input mission content (Ch 14-17) and T-2026-166 creates StoryMissionContentService. This ticket registers the content.

Acceptance criteria:
- [ ] Phase 3 mission content (Ch 14-17) registered with StoryMissionContentService
- [ ] `getMissionContent(14)` through `getMissionContent(17)` return valid content
- [ ] Unit tests for: content loading for each chapter

### T-2026-268
- Title: Create Terminal Hack form specification and test case data model
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: S
- Milestone: P4
- Depends: T-2026-019
- Blocked-by: —
- Tags: minigame, terminal-hack, data-model, forms
- Refs: docs/minigames/06-terminal-hack.md

Terminal Hack's tech notes say "Levels define: target form spec, test cases, available form elements, time limit." P2 minigames have data model tickets but Terminal Hack does not. The engine (T-2026-087) and level data (T-2026-086) need these types before they can be built.

Acceptance criteria:
- [ ] `TargetFormSpec` interface at `src/app/features/minigames/terminal-hack/terminal-hack.types.ts`
- [ ] `FormElement`: id, elementType (text | select | checkbox | radio | textarea), label, validations[]
- [ ] `FormValidationRule`: type (required | pattern | email | min | max | minLength | maxLength | custom), params
- [ ] `TestCase`: id, inputValues (Record<string, any>), expectedOutput, description
- [ ] `AvailableFormTool`: toolType (ngModel | FormControl | FormGroup | FormArray | FormBuilder | Validator), available (boolean)
- [ ] `TerminalHackScoring`: speed, testPassRate, hintsUsed, isPerfect
- [ ] Exported from terminal-hack barrel
- [ ] Unit tests for: form element type validation, test case structure validation

### T-2026-269
- Title: Create P4 end-to-end smoke test for Terminal Hack game loop
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P4
- Depends: T-2026-089
- Blocked-by: —
- Tags: testing, e2e, terminal-hack, game-loop
- Refs: docs/minigames/06-terminal-hack.md, playwright.config.ts

P2 has an end-to-end smoke test (T-2026-142) but P4 does not. This E2E test validates Terminal Hack renders and is playable via browser navigation.

Acceptance criteria:
- [ ] Playwright test at `e2e/terminal-hack.spec.ts`
- [ ] Test: navigate to `/minigames/terminal-hack/level/1`, verify game renders with target form preview and code editor
- [ ] Test: verify MinigameShell HUD is present (score, timer, hint button)
- [ ] Test: verify live preview panel renders
- [ ] Test runs in CI (GitHub Actions)

### T-2026-429
- Title: Create TerminalHackFormEvaluationService for form code evaluation and test execution
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: M
- Milestone: P4
- Depends: T-2026-268
- Blocked-by: —
- Tags: minigame, terminal-hack, service, evaluation, forms
- Refs: docs/minigames/06-terminal-hack.md

Terminal Hack spec describes evaluating player-written form code against test cases with live preview generation. The engine (T-2026-087) is L-size and bundles form evaluation, test case execution, and live preview. Extracting the evaluation logic into a standalone service follows the P2 pattern (FlowCommanderSimulationService, WireProtocolValidationService, etc.) and enables independent testing of form validation mechanics.

Acceptance criteria:
- [ ] `TerminalHackFormEvaluationService` at `src/app/features/minigames/terminal-hack/terminal-hack-evaluation.service.ts`
- [ ] `evaluateFormCode(code: string, spec: TargetFormSpec): EvaluationResult`: parses and evaluates player's form code against the target spec
- [ ] `runTestCases(code: string, testCases: TestCase[]): TestCaseResult[]`: executes each test case against the form and returns pass/fail per case
- [ ] `generatePreview(code: string): FormPreview`: generates a live preview representation of the form
- [ ] `validateFormStructure(code: string, requiredElements: FormElement[]): StructureResult`: checks form has all required elements
- [ ] `getTestPassRate(): number`: returns percentage of passing tests
- [ ] `reset()`: clears evaluation state
- [ ] Exported from terminal-hack barrel
- [ ] Unit tests for: form evaluation pass/fail, test case execution, live preview generation, structure validation, test pass rate calculation

### T-2026-430
- Title: Create integration test for TerminalHackFormEvaluationService test case execution
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P4
- Depends: T-2026-429
- Blocked-by: —
- Tags: testing, integration, terminal-hack, evaluation
- Refs: docs/minigames/06-terminal-hack.md

After T-2026-429 creates the evaluation service, this integration test verifies the full form evaluation pipeline: writing form code, running test cases, and validating pass/fail results.

Acceptance criteria:
- [ ] Integration test at `src/app/features/minigames/terminal-hack/form-evaluation.integration.spec.ts`
- [ ] Test: correct form code passes all test cases
- [ ] Test: incomplete form code fails specific test cases
- [ ] Test: form with missing required field fails structure validation
- [ ] Test: form with incorrect validators fails test cases with specific inputs
- [ ] Test: test pass rate calculation matches manual count
- [ ] Uses real TerminalHackFormEvaluationService with level 1 data

### T-2026-431
- Title: Create TerminalHackCodePanelComponent for target form and code editor split view
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: S
- Milestone: P4
- Depends: T-2026-268, T-2026-031, T-2026-007
- Blocked-by: —
- Tags: ui, component, minigame, terminal-hack, code-panel
- Refs: docs/minigames/06-terminal-hack.md, docs/ux/visual-style.md

Terminal Hack spec describes a split-panel layout: left panel (target form preview, read-only) and right panel (code editor for form code). The UI component (T-2026-088) is L-size. Extracting the split code panel into a standalone sub-component reduces complexity. The component provides the retro terminal aesthetic (green-on-black, scanlines) per the spec.

Acceptance criteria:
- [ ] `TerminalHackCodePanelComponent` at `src/app/features/minigames/terminal-hack/code-panel/code-panel.ts`
- [ ] Left panel: renders target form specification as read-only preview with required fields highlighted
- [ ] Right panel: renders CodeEditorComponent in editable mode for form code
- [ ] Input: `targetSpec` (TargetFormSpec), `initialCode` (string), `availableTools` (AvailableFormTool[])
- [ ] Output: `codeChanged` event with updated code string on user edits
- [ ] Retro terminal aesthetic: green-on-black text, scanline overlay effect, terminal cursor blink
- [ ] Tool availability hints: disabled tools shown as dimmed in the available tools palette
- [ ] Exported from terminal-hack barrel
- [ ] Unit tests for: target spec rendering, code editor rendering, code change emission, retro theme applied, tool hints

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

### T-2026-263
- Title: Register story mission content for P5 missions (Ch 18-22) with StoryMissionContentService
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: S
- Milestone: P5
- Depends: T-2026-097, T-2026-166
- Blocked-by: —
- Tags: integration, story-missions, content-loading, phase-4, phase-5
- Refs: docs/curriculum.md

T-2026-097 creates Phase 4-5 mission content (Ch 18-22) and T-2026-166 creates StoryMissionContentService. This ticket registers the content.

Acceptance criteria:
- [ ] Phase 4-5 mission content (Ch 18-22) registered with StoryMissionContentService
- [ ] `getMissionContent(18)` through `getMissionContent(22)` return valid content
- [ ] Unit tests for: content loading for each chapter

### T-2026-270
- Title: Create Power Grid service and injection scope data model
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: S
- Milestone: P5
- Depends: T-2026-019
- Blocked-by: —
- Tags: minigame, power-grid, data-model, dependency-injection
- Refs: docs/minigames/07-power-grid.md

Power Grid's tech notes say "Grid is a directed acyclic graph (services -> components, services -> services)" and level data includes "services[], components[], validConnections[], scopeRules[]." P2 minigames have data model tickets but Power Grid does not. The engine (T-2026-092) and level data (T-2026-091) need these types.

Acceptance criteria:
- [ ] `ServiceNode` interface at `src/app/features/minigames/power-grid/power-grid.types.ts`
- [ ] `ServiceNode`: id, name, type (string), providedIn ('root' | 'component' | 'module'), methods[], state
- [ ] `ComponentNode`: id, name, requiredInjections[], providers[] (optional component-level providers)
- [ ] `InjectionScope` enum: root, component, hierarchical, factory
- [ ] `PowerConnection`: serviceId, componentId, scope, isCorrect
- [ ] `ScopeRule`: serviceId, allowedScopes[], defaultScope
- [ ] `ShortCircuit`: description, involvedNodes[]
- [ ] Exported from power-grid barrel
- [ ] Unit tests for: connection validation, scope rule checking

### T-2026-271
- Title: Create Data Relay pipe and stream data model
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: S
- Milestone: P5
- Depends: T-2026-019
- Blocked-by: —
- Tags: minigame, data-relay, data-model, pipes
- Refs: docs/minigames/08-data-relay.md

Data Relay's tech notes say "Pipes are applied as actual Angular pipe transforms" and level data includes "streams[], availablePipes[], targetOutputs[], testData[]." P2 minigames have data model tickets but Data Relay does not. The engine (T-2026-095) and level data (T-2026-094) need these types.

Acceptance criteria:
- [ ] `DataStream` interface at `src/app/features/minigames/data-relay/data-relay.types.ts`
- [ ] `DataStream`: id, rawInput (any), requiredOutput (string), placedPipes[]
- [ ] `PipeBlock`: id, pipeType (uppercase | lowercase | date | decimal | currency | percent | slice | custom), params (string[]), position
- [ ] `PipeCategory` enum: text, number, date, custom
- [ ] `TestDataPair`: input (any), expectedOutput (string)
- [ ] `CustomPipeSpec`: name, transformFn (description), pureness (pure | impure)
- [ ] `StreamResult`: streamId, actualOutput (string), isCorrect (boolean)
- [ ] Exported from data-relay barrel
- [ ] Unit tests for: pipe type validation, test data structure validation

### T-2026-272
- Title: Create P5 end-to-end smoke test for Power Grid and Data Relay
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P5
- Depends: T-2026-115, T-2026-116
- Blocked-by: —
- Tags: testing, e2e, power-grid, data-relay, game-loop
- Refs: docs/minigames/07-power-grid.md, docs/minigames/08-data-relay.md, playwright.config.ts

P2 has an end-to-end smoke test (T-2026-142) but P5 does not. This E2E test validates both P5 minigames render and are playable via browser navigation.

Acceptance criteria:
- [ ] Playwright test at `e2e/power-grid.spec.ts`
- [ ] Test: navigate to `/minigames/power-grid/level/1`, verify game renders with grid board and service/component nodes
- [ ] Playwright test at `e2e/data-relay.spec.ts`
- [ ] Test: navigate to `/minigames/data-relay/level/1`, verify game renders with data streams and pipe toolbox
- [ ] Tests verify MinigameShell HUD is present
- [ ] Tests run in CI (GitHub Actions)

### T-2026-432
- Title: Create PowerGridScopeConfigComponent for service injection scope selection
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: S
- Milestone: P5
- Depends: T-2026-270, T-2026-007
- Blocked-by: —
- Tags: ui, component, minigame, power-grid, scope-config
- Refs: docs/minigames/07-power-grid.md

Power Grid spec describes a scope selector per service (root/component/hierarchical) and connection drawing between services and components. The UI component (T-2026-093) is L-size. Extracting the scope configuration panel into a standalone sub-component reduces complexity. The panel shows the service details, scope dropdown, and valid connection targets.

Acceptance criteria:
- [ ] `PowerGridScopeConfigComponent` at `src/app/features/minigames/power-grid/scope-config/scope-config.ts`
- [ ] Input: `service` (ServiceNode), `scopeRules` (ScopeRule), `availableComponents` (ComponentNode[])
- [ ] Renders service name, type, and current scope
- [ ] Scope dropdown: root (blue), component (green), hierarchical (orange), factory (purple)
- [ ] Shows valid connection targets based on selected scope per scope rules
- [ ] Output: `scopeChanged` event with new InjectionScope
- [ ] Output: `connectionRequested` event with {serviceId, componentId, scope}
- [ ] Short circuit warning: highlights when scope selection creates invalid injection
- [ ] Exported from power-grid barrel
- [ ] Unit tests for: scope selection, valid target filtering, short circuit warning, scope rule enforcement

### T-2026-433
- Title: Create PowerGridInjectionService for DI scope validation and connection checking
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: M
- Milestone: P5
- Depends: T-2026-270
- Blocked-by: —
- Tags: minigame, power-grid, service, validation, dependency-injection
- Refs: docs/minigames/07-power-grid.md

Power Grid spec describes connection validation, scope checking, and short circuit detection. The engine (T-2026-092) is L-size and bundles all validation logic. Extracting DI scope validation into a standalone service follows the P2 pattern and enables independent testing of Angular DI mechanics.

Acceptance criteria:
- [ ] `PowerGridInjectionService` at `src/app/features/minigames/power-grid/power-grid-injection.service.ts`
- [ ] `validateConnection(connection: PowerConnection, scopeRules: ScopeRule[]): ConnectionResult`: checks service-component compatibility and scope correctness
- [ ] `checkScope(service: ServiceNode, component: ComponentNode, scope: InjectionScope): boolean`: validates the injection scope is allowed
- [ ] `detectShortCircuit(connections: PowerConnection[]): ShortCircuit[]`: finds circular or invalid injection patterns
- [ ] `validateAll(connections: PowerConnection[], scopeRules: ScopeRule[]): ValidationResult`: checks all connections, returns per-connection pass/fail
- [ ] `getValidConnections(service: ServiceNode, components: ComponentNode[], scopeRules: ScopeRule[]): ComponentNode[]`: returns components that can receive the service at its scope
- [ ] `reset()`: clears validation state
- [ ] Exported from power-grid barrel
- [ ] Unit tests for: root scope validation, component scope validation, hierarchical scope, short circuit detection, invalid scope rejection, valid connection filtering

### T-2026-434
- Title: Create DataRelayPipeConfigComponent for pipe parameter configuration panel
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: S
- Milestone: P5
- Depends: T-2026-271, T-2026-007
- Blocked-by: —
- Tags: ui, component, minigame, data-relay, pipe-config
- Refs: docs/minigames/08-data-relay.md

Data Relay spec describes clicking a placed pipe to configure its parameters (e.g., date format string, decimal digits, currency code). The UI component (T-2026-096) is L-size. Extracting the pipe configuration panel into a standalone sub-component reduces complexity.

Acceptance criteria:
- [ ] `DataRelayPipeConfigComponent` at `src/app/features/minigames/data-relay/pipe-config/pipe-config.ts`
- [ ] Input: `pipe` (PipeBlock), `pipeType` (PipeCategory), `availableParams` (string[])
- [ ] Renders pipe name, type icon, and parameter fields
- [ ] Parameter inputs vary by pipe type: date format (dropdown), decimal places (number input), currency code (dropdown), custom transform (code editor)
- [ ] Live preview: shows sample input -> output transformation with current params
- [ ] Output: `paramsChanged` event with updated params array
- [ ] Output: `pipeRemoved` event
- [ ] Exported from data-relay barrel
- [ ] Unit tests for: parameter rendering by pipe type, param change emission, live preview update, pipe removal

### T-2026-435
- Title: Create DataRelayTransformService for pipe application and output comparison
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: M
- Milestone: P5
- Depends: T-2026-271
- Blocked-by: —
- Tags: minigame, data-relay, service, transformation, pipes
- Refs: docs/minigames/08-data-relay.md

Data Relay spec says "Pipes are applied as actual Angular pipe transforms." The engine (T-2026-095) is L-size and bundles pipe application, chaining, and output comparison. Extracting the transformation logic into a standalone service follows the P2 pattern and enables independent testing of pipe mechanics.

Acceptance criteria:
- [ ] `DataRelayTransformService` at `src/app/features/minigames/data-relay/data-relay-transform.service.ts`
- [ ] `applyPipe(input: any, pipe: PipeBlock): string`: applies a single pipe transform with params, returning formatted output
- [ ] `applyChain(input: any, pipes: PipeBlock[]): string`: applies a chain of pipes in sequence
- [ ] `compareOutput(actual: string, expected: string): boolean`: compares formatted output against target
- [ ] `evaluateStreams(streams: DataStream[]): StreamResult[]`: evaluates all streams, returning per-stream pass/fail
- [ ] `getAvailablePipes(category?: PipeCategory): PipeBlock[]`: returns pipe definitions filtered by category
- [ ] Supports built-in Angular pipes: uppercase, lowercase, date, decimal, currency, percent, slice, json, async
- [ ] Custom pipe support: evaluates custom transform descriptions
- [ ] `reset()`: clears transform state
- [ ] Exported from data-relay barrel
- [ ] Unit tests for: each built-in pipe application, pipe chaining, output comparison, stream evaluation, custom pipe handling

### T-2026-461
- Title: Create PowerGridBoardComponent for circuit board grid with service-component nodes and power lines
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: M
- Milestone: P5
- Depends: T-2026-270, T-2026-172, T-2026-054, T-2026-007
- Blocked-by: —
- Tags: ui, component, minigame, power-grid, board
- Refs: docs/minigames/07-power-grid.md, docs/ux/visual-style.md

Power Grid spec describes a "Grid board with services (left) and components (right)" with "Power line drawing between services and components" and "Color-coded connections (blue=root, green=component, orange=factory)." The UI component (T-2026-093) is L-size. Extracting the circuit board canvas follows the established sub-component pattern. The board handles spatial layout, power line drawing between nodes, and scope-based color coding.

Acceptance criteria:
- [ ] `PowerGridBoardComponent` at `src/app/features/minigames/power-grid/board/board.ts`
- [ ] Renders grid layout with ServiceNode entries on the left and ComponentNode entries on the right
- [ ] Service nodes display: name, type, current scope indicator
- [ ] Component nodes display: name, required injection slots
- [ ] Power line drawing between service and component using SvgWireRendererComponent
- [ ] Line colors: blue (root scope), green (component scope), orange (factory), purple (hierarchical)
- [ ] Short circuit detection: incorrect connections spark with Emergency Red feedback
- [ ] Input: `services` (ServiceNode[]), `components` (ComponentNode[]), `connections` (PowerConnection[])
- [ ] Output: `connectionDrawn` event with {serviceId, componentId}
- [ ] Output: `connectionRemoved` event with {serviceId, componentId}
- [ ] Output: `serviceClicked` event with serviceId (for scope config panel)
- [ ] Exported from power-grid barrel
- [ ] Unit tests for: node layout, connection drawing, color by scope, short circuit visual, click events

### T-2026-462
- Title: Create DataRelayStreamVisualizerComponent for left-to-right data stream and pipe slot rendering
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: M
- Milestone: P5
- Depends: T-2026-271, T-2026-054, T-2026-007
- Blocked-by: —
- Tags: ui, component, minigame, data-relay, stream-visualizer
- Refs: docs/minigames/08-data-relay.md, docs/ux/visual-style.md

Data Relay spec describes a "Left-to-right data stream visualization" with "Data particles showing visual transformation through pipes" and a "pipe toolbox organized by category." The UI component (T-2026-096) is L-size. Extracting the stream visualizer follows the established sub-component pattern. The visualizer renders data flowing through placed pipe slots with live transformation previews.

Acceptance criteria:
- [ ] `DataRelayStreamVisualizerComponent` at `src/app/features/minigames/data-relay/stream-visualizer/stream-visualizer.ts`
- [ ] Renders left-to-right flow for each DataStream with raw input on the left and target output on the right
- [ ] Pipe slots rendered as drop zones along the stream where pipes can be placed
- [ ] Placed pipes show pipe name and current params
- [ ] Data particles animate through the stream, visually changing as they pass through each pipe
- [ ] Output comparison: actual vs expected output displayed on the right side with green (match) or red (mismatch)
- [ ] Input: `streams` (DataStream[]), `placedPipes` (Map<streamId, PipeBlock[]>)
- [ ] Output: `pipeSlotClicked` event with {streamId, slotIndex} for pipe config panel
- [ ] Output: `pipeDragTarget` event for pipe placement from toolbox
- [ ] Exported from data-relay barrel
- [ ] Unit tests for: stream rendering, pipe slot drop zones, data particle animation, output comparison display

### T-2026-436
- Title: Create integration test for PowerGridInjectionService DI scope validation
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P5
- Depends: T-2026-433
- Blocked-by: —
- Tags: testing, integration, power-grid, validation
- Refs: docs/minigames/07-power-grid.md

After T-2026-433 creates the injection service, this integration test verifies the full DI validation pipeline using sample level data.

Acceptance criteria:
- [ ] Integration test at `src/app/features/minigames/power-grid/injection-validation.integration.spec.ts`
- [ ] Test: root-scoped service connects to any component successfully
- [ ] Test: component-scoped service only connects to its providing component
- [ ] Test: hierarchical scope validates parent-child injection chains
- [ ] Test: circular injection pattern detected as short circuit
- [ ] Test: validateAll returns correct pass/fail for mixed connections
- [ ] Uses real PowerGridInjectionService with sample service/component data

### T-2026-437
- Title: Create integration test for DataRelayTransformService pipe chain evaluation
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P5
- Depends: T-2026-435
- Blocked-by: —
- Tags: testing, integration, data-relay, transformation
- Refs: docs/minigames/08-data-relay.md

After T-2026-435 creates the transform service, this integration test verifies the full pipe application pipeline using sample stream data.

Acceptance criteria:
- [ ] Integration test at `src/app/features/minigames/data-relay/transform-chain.integration.spec.ts`
- [ ] Test: single uppercase pipe transforms "hello" to "HELLO"
- [ ] Test: date pipe formats Date object with specified format string
- [ ] Test: pipe chain (uppercase | slice:0:3) produces correct output
- [ ] Test: currency pipe with locale parameter produces formatted output
- [ ] Test: stream with all correct pipes passes evaluation
- [ ] Test: stream with wrong pipe type fails output comparison
- [ ] Uses real DataRelayTransformService with sample stream data

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

### T-2026-264
- Title: Register story mission content for P6 missions (Ch 23-26) with StoryMissionContentService
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: S
- Milestone: P6
- Depends: T-2026-101, T-2026-166
- Blocked-by: —
- Tags: integration, story-missions, content-loading, phase-6
- Refs: docs/curriculum.md

T-2026-101 creates Phase 6 Signals mission content (Ch 23-26) and T-2026-166 creates StoryMissionContentService. This ticket registers the content.

Acceptance criteria:
- [ ] Phase 6 mission content (Ch 23-26) registered with StoryMissionContentService
- [ ] `getMissionContent(23)` through `getMissionContent(26)` return valid content
- [ ] Unit tests for: content loading for each chapter

### T-2026-273
- Title: Create Reactor Core signal graph node and edge data model
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: S
- Milestone: P6
- Depends: T-2026-019
- Blocked-by: —
- Tags: minigame, reactor-core, data-model, signals
- Refs: docs/minigames/09-reactor-core.md

Reactor Core's tech notes say "Graph engine validates: no circular signal dependencies, all computeds have valid sources" and level data includes "requiredNodes[], scenarios[], validGraphs[], constraints[]." P2 minigames have data model tickets but Reactor Core does not. The engine (T-2026-099) and level data (T-2026-098) need these types.

Acceptance criteria:
- [ ] `SignalNode` interface at `src/app/features/minigames/reactor-core/reactor-core.types.ts`
- [ ] `NodeType` enum: signal, computed, effect
- [ ] `SignalNode`: id, type (signal), initialValue, currentValue, position (x, y)
- [ ] `ComputedNode`: id, type (computed), computationExpr (string), dependencyIds[], currentValue, position
- [ ] `EffectNode`: id, type (effect), actionDescription, dependencyIds[], position, cleanupFn (optional)
- [ ] `GraphEdge`: sourceId, targetId
- [ ] `SimulationScenario`: id, signalChanges (array of {nodeId, newValue}), expectedOutputs (array of {nodeId, expectedValue})
- [ ] `GraphConstraint`: maxNodes, requiredNodeTypes, forbiddenPatterns
- [ ] Exported from reactor-core barrel
- [ ] Unit tests for: graph cycle detection helper, node type validation

### T-2026-274
- Title: Create P6 end-to-end smoke test for Reactor Core game loop
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P6
- Depends: T-2026-117
- Blocked-by: —
- Tags: testing, e2e, reactor-core, game-loop
- Refs: docs/minigames/09-reactor-core.md, playwright.config.ts

P2 has an end-to-end smoke test (T-2026-142) but P6 does not. This E2E test validates Reactor Core renders and is playable via browser navigation.

Acceptance criteria:
- [ ] Playwright test at `e2e/reactor-core.spec.ts`
- [ ] Test: navigate to `/minigames/reactor-core/level/1`, verify game renders with node toolbox and graph editor
- [ ] Test: verify MinigameShell HUD is present (score, timer)
- [ ] Test: verify signal/computed/effect node types are present in the toolbox
- [ ] Test runs in CI (GitHub Actions)

### T-2026-438
- Title: Create ReactorCoreGraphService for signal graph editing, validation, and change propagation
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: M
- Milestone: P6
- Depends: T-2026-273
- Blocked-by: —
- Tags: minigame, reactor-core, service, graph, signals
- Refs: docs/minigames/09-reactor-core.md

Reactor Core spec describes a node-based graph editor with cycle detection, change propagation simulation, and scenario execution. The engine (T-2026-099) is L-size. Extracting the graph management and simulation into a standalone service follows the P2 pattern and enables independent testing of signal graph mechanics.

Acceptance criteria:
- [ ] `ReactorCoreGraphService` at `src/app/features/minigames/reactor-core/reactor-core-graph.service.ts`
- [ ] `addNode(node: SignalNode | ComputedNode | EffectNode)`: adds a node to the graph
- [ ] `removeNode(nodeId: string)`: removes a node and its edges
- [ ] `addEdge(edge: GraphEdge): boolean`: adds a dependency edge, returns false if it would create a cycle
- [ ] `removeEdge(sourceId: string, targetId: string)`: removes a dependency edge
- [ ] `validateGraph(): GraphValidationResult`: checks for cycles, orphaned nodes, missing dependencies
- [ ] `detectCycle(fromId: string, toId: string): boolean`: returns true if adding the edge would create a cycle
- [ ] `propagateChange(nodeId: string, newValue: any): PropagationResult`: propagates a signal value change through computed nodes and triggers effects
- [ ] `runScenario(scenario: SimulationScenario): ScenarioResult`: applies signal changes and validates expected outputs
- [ ] `getGraph(): Signal<{nodes: Map, edges: GraphEdge[]}>`: signal of current graph state
- [ ] `reset()`: clears graph state
- [ ] Exported from reactor-core barrel
- [ ] Unit tests for: node add/remove, edge add/remove, cycle detection, change propagation through computed, effect triggering, scenario execution, graph validation

### T-2026-439
- Title: Create ReactorCoreNodeConfigComponent for signal/computed/effect node configuration
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: S
- Milestone: P6
- Depends: T-2026-273, T-2026-007
- Blocked-by: —
- Tags: ui, component, minigame, reactor-core, node-config
- Refs: docs/minigames/09-reactor-core.md, docs/ux/visual-style.md

Reactor Core spec describes clicking a node to configure it: signal nodes have initial values, computed nodes have computation expressions, effect nodes have action descriptions. The UI component (T-2026-100) is L-size. Extracting the node configuration panel follows the P2 sub-component pattern.

Acceptance criteria:
- [ ] `ReactorCoreNodeConfigComponent` at `src/app/features/minigames/reactor-core/node-config/node-config.ts`
- [ ] Input: `node` (SignalNode | ComputedNode | EffectNode), `availableDependencies` (string[])
- [ ] Signal node: value input field (number/string/boolean), type selector
- [ ] Computed node: expression builder for computation formula, dependency selection
- [ ] Effect node: action description text, dependency selection, optional cleanup toggle
- [ ] Node type indicator: signal (blue glow), computed (green glow), effect (orange glow) per visual-style.md
- [ ] Output: `nodeConfigured` event with updated node data
- [ ] Output: `cancelled` event
- [ ] Exported from reactor-core barrel
- [ ] Unit tests for: signal node value editing, computed node expression editing, effect node action editing, type-specific rendering, config apply event

### T-2026-455
- Title: Create ReactorCoreGraphCanvasComponent for node drag-and-drop and wire drawing
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: M
- Milestone: P6
- Depends: T-2026-273, T-2026-054, T-2026-172, T-2026-007
- Blocked-by: —
- Tags: ui, component, minigame, reactor-core, graph-canvas
- Refs: docs/minigames/09-reactor-core.md, docs/ux/visual-style.md

Reactor Core spec describes a graph editor where players "drag nodes, draw dependency wires" on a canvas. The main UI component (T-2026-100) is L-size. ReactorCoreNodeConfigComponent (T-2026-439) handles individual node configuration, but no ticket extracts the graph canvas itself -- the spatial area where nodes are positioned and dependency wires are drawn between them. This is the most complex sub-component of the Reactor Core UI and follows the established P2 sub-component pattern (FlowCommanderGateConfig, SignalCorpsTowerConfig, etc.).

Acceptance criteria:
- [ ] `ReactorCoreGraphCanvasComponent` at `src/app/features/minigames/reactor-core/graph-canvas/graph-canvas.ts`
- [ ] Renders a zoomable/pannable canvas area for node placement
- [ ] Nodes rendered at their (x, y) positions with type-specific colors: signal (Reactor Blue), computed (Sensor Green), effect (Alert Orange)
- [ ] Drag-and-drop node placement from toolbox using DraggableDirective (T-2026-054)
- [ ] Wire drawing between node ports using SvgWireRendererComponent (T-2026-172)
- [ ] Dependency wires show directional flow (source -> target) with arrow indicators
- [ ] Click node to select it and emit `nodeSelected` event for config panel
- [ ] Input: `nodes` (Map of nodes), `edges` (GraphEdge[]), `toolboxItems` (NodeType[])
- [ ] Output: `nodeAdded` event with {type, position}
- [ ] Output: `nodeMoved` event with {nodeId, newPosition}
- [ ] Output: `edgeAdded` event with {sourceId, targetId}
- [ ] Output: `edgeRemoved` event with {sourceId, targetId}
- [ ] Output: `nodeSelected` event with nodeId
- [ ] Energy flow animation along wires during simulation (per spec "energy flowing along wires")
- [ ] Exported from reactor-core barrel
- [ ] Unit tests for: node rendering, drag placement, wire drawing, selection, energy animation states

### T-2026-440
- Title: Create integration test for ReactorCoreGraphService change propagation and scenario execution
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P6
- Depends: T-2026-438
- Blocked-by: —
- Tags: testing, integration, reactor-core, graph, signals
- Refs: docs/minigames/09-reactor-core.md

After T-2026-438 creates the graph service, this integration test verifies the full signal graph pipeline: building graphs, propagating changes, and executing scenarios.

Acceptance criteria:
- [ ] Integration test at `src/app/features/minigames/reactor-core/graph-propagation.integration.spec.ts`
- [ ] Test: signal value change propagates to dependent computed node
- [ ] Test: multi-level propagation (signal -> computed -> computed -> effect)
- [ ] Test: cycle detection prevents adding circular dependency
- [ ] Test: scenario execution validates expected outputs after signal changes
- [ ] Test: removing a dependency edge breaks propagation chain
- [ ] Test: orphaned computed node detected by graph validation
- [ ] Uses real ReactorCoreGraphService with sample graph data

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

### T-2026-265
- Title: Register story mission content for P7 missions (Ch 27-34) with StoryMissionContentService
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: S
- Milestone: P7
- Depends: T-2026-108, T-2026-166
- Blocked-by: —
- Tags: integration, story-missions, content-loading, phase-6-advanced
- Refs: docs/curriculum.md

T-2026-108 creates Phase 6 Advanced mission content (Ch 27-34) and T-2026-166 creates StoryMissionContentService. This ticket registers the content.

Acceptance criteria:
- [ ] Phase 6 Advanced mission content (Ch 27-34) registered with StoryMissionContentService
- [ ] `getMissionContent(27)` through `getMissionContent(34)` return valid content
- [ ] Unit tests for: content loading for each chapter

### T-2026-275
- Title: Create Deep Space Radio endpoint and interceptor data model
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: S
- Milestone: P7
- Depends: T-2026-019
- Blocked-by: —
- Tags: minigame, deep-space-radio, data-model, http
- Refs: docs/minigames/10-deep-space-radio.md

Deep Space Radio's tech notes say "Mock backend defines endpoints with expected request format and response data" and "Interceptor chain is modeled after Angular's actual HttpInterceptor pipeline." P2 minigames have data model tickets but Deep Space Radio does not. The engine (T-2026-103) and level data (T-2026-102) need these types.

Acceptance criteria:
- [ ] `MockEndpoint` interface at `src/app/features/minigames/deep-space-radio/deep-space-radio.types.ts`
- [ ] `MockEndpoint`: url, method (GET | POST | PUT | DELETE), expectedHeaders, expectedBody, response, errorResponse
- [ ] `InterceptorBlock`: id, type (auth | logging | retry | error | caching | custom), config (Record<string, any>), order
- [ ] `HttpRequestConfig`: method, url, headers (Record<string, string>), body (any), params (Record<string, string>)
- [ ] `TransmissionResult`: requestConfig, interceptorsApplied[], responseData, statusCode, isSuccess
- [ ] `TestScenario`: id, description, requestConfig, expectedInterceptorOrder[], expectedResult
- [ ] Exported from deep-space-radio barrel
- [ ] Unit tests for: endpoint matching, interceptor ordering validation

### T-2026-276
- Title: Create System Certification source code and test data model
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: S
- Milestone: P7
- Depends: T-2026-019
- Blocked-by: —
- Tags: minigame, system-certification, data-model, testing
- Refs: docs/minigames/11-system-certification.md

System Certification's tech notes say "Pre-built components are designed with specific testable paths" and level data includes "sourceCode, coverageThreshold, timeLimit, availableTestUtilities." P2 minigames have data model tickets but System Certification does not. The engine (T-2026-105) and level data (T-2026-104) need these types.

Acceptance criteria:
- [ ] `SourceCodeBlock` interface at `src/app/features/minigames/system-certification/system-certification.types.ts`
- [ ] `SourceCodeBlock`: lines[], testablePoints[] (line numbers that need coverage), branchPoints[]
- [ ] `TestUtility` enum: testBed, componentFixture, debugElement, spyObj, fakeAsync, httpTestingController, routerTesting
- [ ] `CoverageResult`: totalLines, coveredLines, percentage, uncoveredLineNumbers[]
- [ ] `TestResult`: testName, passed (boolean), errorMessage (optional), coveredLines[]
- [ ] `CertificationThreshold`: minCoverage (number), timeLimit (seconds), maxRedundantTests
- [ ] Exported from system-certification barrel
- [ ] Unit tests for: coverage calculation, test result aggregation

### T-2026-277
- Title: Create Blast Doors lifecycle and directive data model
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: S
- Milestone: P7
- Depends: T-2026-019
- Blocked-by: —
- Tags: minigame, blast-doors, data-model, lifecycle
- Refs: docs/minigames/12-blast-doors.md

Blast Doors' tech notes say "Lifecycle simulation engine fires hooks in Angular's actual lifecycle order" and level data includes "doors[], hooks[], directives[], scenarios[], expectedBehavior[]." P2 minigames have data model tickets but Blast Doors does not. The engine (T-2026-107) and level data (T-2026-106) need these types.

Acceptance criteria:
- [ ] `BlastDoor` interface at `src/app/features/minigames/blast-doors/blast-doors.types.ts`
- [ ] `BlastDoor`: id, position, currentState (open | closed | locked), hookSlots[]
- [ ] `LifecycleHook` enum: ngOnInit, ngOnChanges, ngOnDestroy, afterNextRender, afterRender
- [ ] `HookSlot`: hookType (LifecycleHook), behaviorBlock (BehaviorBlock | null), executionOrder
- [ ] `BehaviorBlock`: id, description, code (string), hookTarget (LifecycleHook)
- [ ] `DirectiveSpec`: name, type (attribute | structural), inputs[], hostListeners[], hostBindings[], behavior
- [ ] `DoorScenario`: id, trigger (string), steps[] (array of {event, expectedDoorStates[]})
- [ ] Exported from blast-doors barrel
- [ ] Unit tests for: hook ordering validation, scenario step validation

### T-2026-278
- Title: Create P7 end-to-end smoke test for Advanced Bundle minigames
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P7
- Depends: T-2026-119, T-2026-121, T-2026-123
- Blocked-by: —
- Tags: testing, e2e, deep-space-radio, system-certification, blast-doors, game-loop
- Refs: docs/minigames/10-deep-space-radio.md, docs/minigames/11-system-certification.md, docs/minigames/12-blast-doors.md, playwright.config.ts

P2 has an end-to-end smoke test (T-2026-142) but P7 does not. This E2E test validates all 3 P7 minigames render and are playable via browser navigation.

Acceptance criteria:
- [ ] Playwright test at `e2e/advanced-bundle.spec.ts`
- [ ] Test: navigate to `/minigames/deep-space-radio/level/1`, verify request builder and interceptor pipeline render
- [ ] Test: navigate to `/minigames/system-certification/level/1`, verify source code viewer and test editor render
- [ ] Test: navigate to `/minigames/blast-doors/level/1`, verify door cross-section and lifecycle timeline render
- [ ] Tests verify MinigameShell HUD is present
- [ ] Tests run in CI (GitHub Actions)

### T-2026-441
- Title: Create DeepSpaceRadioInterceptorService for HTTP interceptor chain simulation
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: M
- Milestone: P7
- Depends: T-2026-275
- Blocked-by: —
- Tags: minigame, deep-space-radio, service, simulation, http
- Refs: docs/minigames/10-deep-space-radio.md

Deep Space Radio spec says "Interceptor chain is modeled after Angular's actual HttpInterceptor pipeline" with ordered processing of requests and responses. The engine (T-2026-103) is L-size. Extracting the interceptor chain simulation follows the established pattern.

Acceptance criteria:
- [ ] `DeepSpaceRadioInterceptorService` at `src/app/features/minigames/deep-space-radio/deep-space-radio-interceptor.service.ts`
- [ ] `setInterceptorChain(interceptors: InterceptorBlock[])`: sets the ordered interceptor pipeline
- [ ] `processRequest(request: HttpRequestConfig): ProcessedRequest`: runs request through interceptor chain in order
- [ ] `processResponse(response: TransmissionResult): ProcessedResponse`: runs response through interceptor chain in reverse order
- [ ] `validateChain(expected: InterceptorBlock[]): ChainValidationResult`: checks interceptor order against expected configuration
- [ ] `simulateTransmission(request: HttpRequestConfig, endpoints: MockEndpoint[]): TransmissionResult`: full request lifecycle through interceptors, mock backend, and response
- [ ] Interceptor types: auth (adds auth header), logging (records request), retry (retries on failure), error (handles error responses), caching (caches responses)
- [ ] `reset()`: clears chain state
- [ ] Exported from deep-space-radio barrel
- [ ] Unit tests for: interceptor chain ordering, auth header injection, retry on 500, error handling, caching hit/miss, request/response processing order

### T-2026-442
- Title: Create DeepSpaceRadioRequestBuilderComponent for HTTP request configuration UI
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: S
- Milestone: P7
- Depends: T-2026-275, T-2026-007
- Blocked-by: —
- Tags: ui, component, minigame, deep-space-radio, request-builder
- Refs: docs/minigames/10-deep-space-radio.md

Deep Space Radio spec describes a request builder with method selector, URL input, headers editor, and body editor. The UI component (T-2026-118) is L-size. Extracting the request builder follows the P2 sub-component pattern.

Acceptance criteria:
- [ ] `RequestBuilderComponent` at `src/app/features/minigames/deep-space-radio/request-builder/request-builder.ts`
- [ ] Method selector dropdown: GET, POST, PUT, DELETE with color coding
- [ ] URL input field with endpoint autocomplete from level data
- [ ] Headers editor: key-value pairs with add/remove
- [ ] Body editor: JSON editor for POST/PUT requests (hidden for GET/DELETE)
- [ ] Input: `availableEndpoints` (MockEndpoint[]), `currentRequest` (HttpRequestConfig | null)
- [ ] Output: `requestChanged` event with updated HttpRequestConfig
- [ ] Output: `transmitRequested` event when player clicks "Transmit"
- [ ] Exported from deep-space-radio barrel
- [ ] Unit tests for: method selection, URL input, header editing, body visibility by method, transmit event

### T-2026-443
- Title: Create SystemCertificationTestRunnerService for test execution and coverage calculation
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: M
- Milestone: P7
- Depends: T-2026-276
- Blocked-by: —
- Tags: minigame, system-certification, service, testing, coverage
- Refs: docs/minigames/11-system-certification.md

System Certification spec describes test execution, coverage calculation, and test quality scoring. The engine (T-2026-105) is L-size. Extracting the test runner and coverage calculator follows the established service extraction pattern.

Acceptance criteria:
- [ ] `SystemCertificationTestRunnerService` at `src/app/features/minigames/system-certification/system-certification-test-runner.service.ts`
- [ ] `loadSourceCode(source: SourceCodeBlock)`: initializes the source code to test against
- [ ] `runTests(testCode: string): TestResult[]`: evaluates player-written test code against source, returns per-test results
- [ ] `calculateCoverage(testResults: TestResult[]): CoverageResult`: calculates line coverage percentage from test results
- [ ] `evaluateTestQuality(testResults: TestResult[]): QualityScore`: penalizes redundant tests, rewards covering unique paths
- [ ] `isThresholdMet(coverage: CoverageResult, threshold: CertificationThreshold): boolean`: checks if coverage meets level requirements
- [ ] `getUncoveredLines(): number[]`: returns line numbers not yet covered by any test
- [ ] `reset()`: clears runner state
- [ ] Exported from system-certification barrel
- [ ] Unit tests for: test execution pass/fail, coverage calculation, quality scoring, threshold checking, uncovered line detection, redundant test penalty

### T-2026-444
- Title: Create BlastDoorsLifecycleService for lifecycle hook ordering and scenario simulation
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: M
- Milestone: P7
- Depends: T-2026-277
- Blocked-by: —
- Tags: minigame, blast-doors, service, lifecycle, simulation
- Refs: docs/minigames/12-blast-doors.md

Blast Doors spec says "Lifecycle simulation engine fires hooks in Angular's actual lifecycle order." The engine (T-2026-107) is L-size. Extracting lifecycle simulation follows the established pattern.

Acceptance criteria:
- [ ] `BlastDoorsLifecycleService` at `src/app/features/minigames/blast-doors/blast-doors-lifecycle.service.ts`
- [ ] `loadDoors(doors: BlastDoor[])`: initializes door state from level data
- [ ] `assignBehavior(doorId: string, hookType: LifecycleHook, behavior: BehaviorBlock)`: places a behavior in a door's hook slot
- [ ] `removeBehavior(doorId: string, hookType: LifecycleHook)`: removes a behavior from a hook slot
- [ ] `validateHookOrder(doorId: string): HookOrderResult`: checks if behaviors are in correct Angular lifecycle order
- [ ] `simulateScenario(scenario: DoorScenario): ScenarioResult`: runs a scenario triggering events and checking door states at each step
- [ ] `getCorrectHookOrder(): LifecycleHook[]`: returns Angular's lifecycle hook execution order
- [ ] `applyDirective(doorId: string, directive: DirectiveSpec)`: applies a custom directive to a door
- [ ] `getDoorStates(): Signal<Map<string, BlastDoor>>`: signal of current door states
- [ ] `reset()`: clears all door and scenario state
- [ ] Exported from blast-doors barrel
- [ ] Unit tests for: behavior assignment to hooks, hook order validation, scenario simulation with correct/incorrect hooks, directive application, door state changes, lifecycle order correctness

### T-2026-445
- Title: Create BlastDoorsTimelineComponent for lifecycle hook slot drag-and-drop UI
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: S
- Milestone: P7
- Depends: T-2026-277, T-2026-054, T-2026-007
- Blocked-by: —
- Tags: ui, component, minigame, blast-doors, timeline
- Refs: docs/minigames/12-blast-doors.md, docs/ux/visual-style.md

Blast Doors spec describes a lifecycle timeline with hook slots where players drag behavior blocks. The UI component (T-2026-122) is L-size. Extracting the timeline follows the P2 sub-component pattern.

Acceptance criteria:
- [ ] `BlastDoorsTimelineComponent` at `src/app/features/minigames/blast-doors/timeline/timeline.ts`
- [ ] Renders horizontal timeline bar per door with hook slots: ngOnInit, ngOnChanges, ngOnDestroy, afterNextRender, afterRender
- [ ] Hook slots accept DraggableDirective drops of BehaviorBlock items
- [ ] Input: `door` (BlastDoor), `availableBehaviors` (BehaviorBlock[])
- [ ] Correctly-placed behaviors glow green; incorrectly-placed behaviors pulse red after simulation
- [ ] Hook slots show Angular lifecycle order labels
- [ ] Output: `behaviorPlaced` event with {doorId, hookType, behaviorBlock}
- [ ] Output: `behaviorRemoved` event with {doorId, hookType}
- [ ] Keyboard accessible: Tab between slots, Space/Enter to place selected behavior
- [ ] Exported from blast-doors barrel
- [ ] Unit tests for: slot rendering, drag-drop placement, correct/incorrect visual states, keyboard navigation, event emissions

### T-2026-463
- Title: Create DeepSpaceRadioInterceptorPipelineComponent for visual interceptor chain display
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: S
- Milestone: P7
- Depends: T-2026-275, T-2026-054, T-2026-007
- Blocked-by: —
- Tags: ui, component, minigame, deep-space-radio, interceptor-pipeline
- Refs: docs/minigames/10-deep-space-radio.md, docs/ux/visual-style.md

Deep Space Radio spec describes an "Interceptor pipeline visualization: ordered chain of processing blocks" where players drag interceptor blocks into position and see radio wave animations through the chain. The UI component (T-2026-118) is L-size. Extracting the pipeline visualization follows the established sub-component pattern.

Acceptance criteria:
- [ ] `InterceptorPipelineComponent` at `src/app/features/minigames/deep-space-radio/interceptor-pipeline/interceptor-pipeline.ts`
- [ ] Renders horizontal pipeline with ordered interceptor slot positions
- [ ] Interceptor blocks draggable from toolbox into pipeline slots
- [ ] Each block displays: interceptor type icon, name, configuration preview
- [ ] Radio wave animation flows through the chain on "Transmit" (request phase left-to-right, response phase right-to-left)
- [ ] Interceptor modification indicators: key icon (auth), scroll (logging), loop arrow (retry), shield (error), cache (caching)
- [ ] Input: `chain` (InterceptorBlock[]), `isTransmitting` (boolean), `toolboxItems` (InterceptorBlock[])
- [ ] Output: `interceptorPlaced` event with {interceptor, position}
- [ ] Output: `interceptorRemoved` event with {position}
- [ ] Output: `interceptorClicked` event with InterceptorBlock (for config)
- [ ] Reorder support: drag interceptors within the pipeline to change order
- [ ] Exported from deep-space-radio barrel
- [ ] Unit tests for: slot rendering, drag placement, reorder, wave animation states, interceptor type icons

### T-2026-464
- Title: Create SystemCertificationCoverageOverlayComponent for source code coverage visualization
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: S
- Milestone: P7
- Depends: T-2026-276, T-2026-031, T-2026-007
- Blocked-by: —
- Tags: ui, component, minigame, system-certification, coverage
- Refs: docs/minigames/11-system-certification.md, docs/ux/visual-style.md

System Certification spec describes a "Coverage overlay mode: toggle to see covered (green), uncovered (red), partial (yellow) lines on source." The UI component (T-2026-120) is L-size. Extracting the coverage overlay follows the established sub-component pattern. The overlay renders on top of the CodeEditorComponent source code viewer.

Acceptance criteria:
- [ ] `CoverageOverlayComponent` at `src/app/features/minigames/system-certification/coverage-overlay/coverage-overlay.ts`
- [ ] Input: `sourceLines` (string[]), `coverageResult` (CoverageResult), `isVisible` (boolean)
- [ ] Renders colored line gutters: Sensor Green (covered), Emergency Red (uncovered), Solar Gold (partial)
- [ ] Coverage percentage gauge rendered prominently (per spec: "Coverage meter gauge, prominent, visual")
- [ ] Toggle button switches between source-only view and coverage overlay view
- [ ] Hint integration: uncovered lines pulse when hint is active (per spec: "Hint button that highlights uncovered code path")
- [ ] Output: `lineClicked` event with lineNumber for focusing on uncovered code
- [ ] Exported from system-certification barrel
- [ ] Unit tests for: line color by coverage state, coverage percentage display, toggle visibility, hint pulse on uncovered lines

### T-2026-446
- Title: Create integration test for DeepSpaceRadioInterceptorService transmission simulation
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P7
- Depends: T-2026-441
- Blocked-by: —
- Tags: testing, integration, deep-space-radio, interceptor
- Refs: docs/minigames/10-deep-space-radio.md

After T-2026-441 creates the interceptor service, this integration test verifies the full transmission simulation pipeline.

Acceptance criteria:
- [ ] Integration test at `src/app/features/minigames/deep-space-radio/interceptor-simulation.integration.spec.ts`
- [ ] Test: request with auth interceptor adds authorization header
- [ ] Test: request with retry interceptor retries on 500 response
- [ ] Test: interceptor chain processes in correct order (auth before logging)
- [ ] Test: response passes through interceptor chain in reverse order
- [ ] Test: mock endpoint matches URL and method, returns configured response
- [ ] Test: missing endpoint returns 404 error response
- [ ] Uses real DeepSpaceRadioInterceptorService with sample endpoint/interceptor data

### T-2026-447
- Title: Create integration test for SystemCertificationTestRunnerService coverage calculation
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P7
- Depends: T-2026-443
- Blocked-by: —
- Tags: testing, integration, system-certification, coverage
- Refs: docs/minigames/11-system-certification.md

After T-2026-443 creates the test runner service, this integration test verifies the full test execution and coverage pipeline.

Acceptance criteria:
- [ ] Integration test at `src/app/features/minigames/system-certification/coverage-calculation.integration.spec.ts`
- [ ] Test: test covering all source lines achieves 100% coverage
- [ ] Test: test covering half the lines achieves ~50% coverage
- [ ] Test: redundant tests (covering same lines) receive quality penalty
- [ ] Test: coverage threshold validation passes/fails correctly
- [ ] Test: uncovered lines correctly identified
- [ ] Uses real SystemCertificationTestRunnerService with sample source code

### T-2026-448
- Title: Create integration test for BlastDoorsLifecycleService hook ordering and scenario simulation
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P7
- Depends: T-2026-444
- Blocked-by: —
- Tags: testing, integration, blast-doors, lifecycle
- Refs: docs/minigames/12-blast-doors.md

After T-2026-444 creates the lifecycle service, this integration test verifies the full lifecycle simulation pipeline.

Acceptance criteria:
- [ ] Integration test at `src/app/features/minigames/blast-doors/lifecycle-simulation.integration.spec.ts`
- [ ] Test: behaviors placed in correct lifecycle order pass validation
- [ ] Test: behaviors in wrong order fail validation with specific error
- [ ] Test: scenario simulation with correct hooks produces expected door states
- [ ] Test: scenario with missing ngOnInit behavior causes door to remain closed
- [ ] Test: custom directive application modifies door behavior
- [ ] Test: ngOnDestroy cleanup runs when door is removed from simulation
- [ ] Uses real BlastDoorsLifecycleService with sample door/scenario data

### T-2026-449
- Title: Update architecture.md with P3-P7 minigame patterns and service conventions
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P7
- Depends: T-2026-444, T-2026-443, T-2026-441
- Blocked-by: —
- Tags: documentation, architecture, conventions
- Refs: docs/architecture.md

P1 had architecture documentation tickets (T-2026-043, T-2026-330). As P3-P7 add new minigame service extraction patterns, simulation services, and sub-component conventions, architecture.md should be updated to document these patterns so future developers understand the established conventions.

Acceptance criteria:
- [ ] architecture.md documents the "service extraction pattern" used across all minigames (engine delegates to standalone service)
- [ ] Lists all simulation/validation services per minigame (ConveyorBeltService, FlowCommanderSimulationService, etc.)
- [ ] Documents the sub-component pattern for complex minigame UIs (gate config, tower config, binding selector, etc.)
- [ ] Updates the persistence table with any new localStorage keys added by P3-P7 services
- [ ] Documents the route guard pattern (canActivate, canDeactivate) established in P2

---

## P8 -- Polish & Replayability

### T-2026-359
- Title: Create ReplayModeHudComponent for endless/speed-run/daily challenge mode-specific HUD
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: M
- Milestone: P8
- Depends: T-2026-155, T-2026-156, T-2026-157
- Blocked-by: —
- Tags: ui, component, replay-modes, hud
- Refs: docs/progression.md, docs/minigames/TEMPLATE.md

Each minigame spec defines unique replay mode HUDs. Endless mode needs: round counter, running score, difficulty indicator. Speed run needs: elapsed timer, split times, par comparison. Daily challenge needs: streak display, bonus XP indicator. MinigameShell is designed for story mode play. Replay modes need their own HUD component.

Acceptance criteria:
- [ ] `ReplayModeHudComponent` at `src/app/shared/components/replay-mode-hud/`
- [ ] Selector: `nx-replay-mode-hud`
- [ ] Mode-specific display via `mode` input ('endless' | 'speedrun' | 'daily')
- [ ] Endless: round counter, running score, difficulty level indicator
- [ ] Speed run: elapsed timer (green/orange/red vs par), level progress (X/Y), split times
- [ ] Daily challenge: streak flame icon, bonus XP badge, topic name
- [ ] Content projection for the minigame component
- [ ] Exported from shared components barrel
- [ ] Unit tests for: mode-specific rendering, timer color transitions, round counter updates

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

### T-2026-219
- Title: Create LeaderboardComponent for per-minigame score display
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: M
- Milestone: P8
- Depends: T-2026-110, T-2026-007
- Blocked-by: —
- Tags: ui, component, leaderboard, replayability
- Refs: docs/research/gamification-patterns.md, docs/progression.md

LeaderboardService (T-2026-110) provides per-minigame leaderboard data, but no ticket creates the visual component. Gamification research says "Show player's rank relative to nearby ranks (not just top 10)" and "Speed run leaderboards are competitive; mastery is personal." The level select page (T-2026-077) has "Replay mode tabs" that would display leaderboards. This component renders the leaderboard table with mode tabs.

Acceptance criteria:
- [ ] `LeaderboardComponent` at `src/app/shared/components/leaderboard/`
- [ ] Selector: `nx-leaderboard`
- [ ] Inputs: `gameId` (MinigameId), `mode` ('story' | 'endless' | 'speedrun')
- [ ] Displays top 10 entries: rank, player name, score, time, date
- [ ] Highlights player's entry with accent color
- [ ] Mode tabs to switch between story/endless/speedrun views
- [ ] Empty state when no entries exist
- [ ] Solar Gold styling for #1 position, silver for #2, bronze for #3
- [ ] Exported from shared components barrel
- [ ] Unit tests for: entry rendering, mode switching, player highlight, empty state, medal styling

### T-2026-220
- Title: Create CosmeticGalleryComponent for cosmetic browsing and equipping
- Status: todo
- Assigned: unassigned
- Priority: low
- Size: M
- Milestone: P8
- Depends: T-2026-111, T-2026-007
- Blocked-by: —
- Tags: ui, component, cosmetics, replayability
- Refs: docs/progression.md

CosmeticService (T-2026-111) provides cosmetic data (skins, themes, badges) and equip/unequip functionality, but no ticket creates the visual gallery. Progression.md specifies "station module skins, UI themes, achievement badges" as cosmetic categories. The profile or settings page needs a gallery where players can browse and equip cosmetics.

Acceptance criteria:
- [ ] `CosmeticGalleryComponent` at `src/app/shared/components/cosmetic-gallery/`
- [ ] Selector: `nx-cosmetic-gallery`
- [ ] Displays cosmetics grouped by type (skin, theme, badge)
- [ ] Unlocked items: full color with "Equip" button
- [ ] Locked items: dimmed with unlock condition text (e.g., "Reach Captain rank")
- [ ] Currently equipped item: highlighted with checkmark
- [ ] Filter tabs by type
- [ ] Progress indicator: "X of Y unlocked" per type
- [ ] Exported from shared components barrel
- [ ] Unit tests for: unlocked/locked rendering, equip interaction, filter tabs

### T-2026-252
- Title: Wire AchievementBadge grid into ProfilePage
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P8
- Depends: T-2026-154, T-2026-013
- Blocked-by: —
- Tags: integration, ui, profile, achievements
- Refs: docs/ux/navigation.md

Navigation.md specifies the Profile page shows "Achievement badges" but no ticket wires AchievementGridComponent into ProfilePage. T-2026-154 creates the grid component and T-2026-013 created the placeholder ProfilePage.

Acceptance criteria:
- [ ] ProfilePage imports and renders `nx-achievement-grid`
- [ ] Grid appears in its own section with "Achievements" heading
- [ ] Responsive layout works at all breakpoints
- [ ] Unit tests for: grid presence, heading text

### T-2026-253
- Title: Wire LeaderboardComponent into LevelSelectPage replay mode tabs
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P8
- Depends: T-2026-219, T-2026-077
- Blocked-by: —
- Tags: integration, ui, leaderboard, level-select
- Refs: docs/ux/navigation.md, docs/research/gamification-patterns.md

LevelSelectPage (T-2026-077) specifies "Replay mode tabs" but no ticket wires LeaderboardComponent (T-2026-219) into those tabs. Gamification research says leaderboards drive competitive replay.

Acceptance criteria:
- [ ] LevelSelectPage includes a "Leaderboard" tab in the replay mode section
- [ ] Tab renders `nx-leaderboard` with the current minigame's `gameId`
- [ ] Mode tabs (story/endless/speedrun) are passed through
- [ ] Unit tests for: leaderboard tab presence, gameId binding

### T-2026-279
- Title: Wire AchievementService check triggers into LevelCompletionService and GameProgressionService
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P8
- Depends: T-2026-109, T-2026-113, T-2026-026
- Blocked-by: —
- Tags: integration, achievements, gamification, progression
- Refs: docs/research/gamification-patterns.md

AchievementService (T-2026-109) defines achievements and a `checkAchievements()` method, but no ticket wires the triggers. Achievements should be evaluated automatically when key progression events occur: level completion, mission completion, rank up, streak milestones, and mastery changes. Without this integration, achievements are never earned during gameplay.

Acceptance criteria:
- [ ] LevelCompletionService.completeLevel() calls AchievementService.checkAchievements() after recording result
- [ ] GameProgressionService.completeMission() calls AchievementService.checkAchievements()
- [ ] XpService rank change triggers achievement check
- [ ] StreakService milestone triggers achievement check
- [ ] Achievement notification shown via toast system on new achievement earned
- [ ] Unit tests for: achievement trigger on level complete, on mission complete, on rank up, on streak milestone

### T-2026-280
- Title: Wire CosmeticGalleryComponent into ProfilePage
- Status: todo
- Assigned: unassigned
- Priority: low
- Size: S
- Milestone: P8
- Depends: T-2026-220, T-2026-079
- Blocked-by: —
- Tags: integration, ui, profile, cosmetics
- Refs: docs/progression.md, docs/ux/navigation.md

CosmeticGalleryComponent (T-2026-220) provides the browsing and equipping UI, and ProfilePage (T-2026-079) is where player stats live. Progression.md specifies cosmetic unlocks but no ticket wires the gallery into the profile page where players can view and manage their cosmetics.

Acceptance criteria:
- [ ] ProfilePage imports and renders `nx-cosmetic-gallery` in a dedicated "Cosmetics" section
- [ ] Gallery appears below the achievements section
- [ ] Responsive layout works at all breakpoints
- [ ] Unit tests for: gallery presence, section heading

### T-2026-281
- Title: Add AchievementService to progression barrel export
- Status: todo
- Assigned: unassigned
- Priority: low
- Size: S
- Milestone: P8
- Depends: T-2026-109
- Blocked-by: —
- Tags: infrastructure, barrel-export, conventions
- Refs: src/app/core/progression/index.ts

AchievementService (T-2026-109) will create `achievement.service.ts` in the progression directory. Per conventions, all services should be exported from their directory barrel.

Acceptance criteria:
- [ ] `src/app/core/progression/index.ts` updated to export `AchievementService`, `Achievement`, and achievement type enums
- [ ] Build passes with updated barrel

### T-2026-282
- Title: Add LeaderboardService to progression barrel export
- Status: todo
- Assigned: unassigned
- Priority: low
- Size: S
- Milestone: P8
- Depends: T-2026-110
- Blocked-by: —
- Tags: infrastructure, barrel-export, conventions
- Refs: src/app/core/progression/index.ts

LeaderboardService (T-2026-110) will create `leaderboard.service.ts` in the progression directory. Per conventions, all services should be exported from their directory barrel.

Acceptance criteria:
- [ ] `src/app/core/progression/index.ts` updated to export `LeaderboardService` and `LeaderboardEntry`
- [ ] Build passes with updated barrel

### T-2026-283
- Title: Add CosmeticService to progression barrel export
- Status: todo
- Assigned: unassigned
- Priority: low
- Size: S
- Milestone: P8
- Depends: T-2026-111
- Blocked-by: —
- Tags: infrastructure, barrel-export, conventions
- Refs: src/app/core/progression/index.ts

CosmeticService (T-2026-111) will create `cosmetic.service.ts` in the progression directory. Per conventions, all services should be exported from their directory barrel.

Acceptance criteria:
- [ ] `src/app/core/progression/index.ts` updated to export `CosmeticService` and `CosmeticItem`
- [ ] Build passes with updated barrel

### T-2026-284
- Title: Wire EndlessModeService and SpeedRunService into per-minigame replay mode pages
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: M
- Milestone: P8
- Depends: T-2026-155, T-2026-156, T-2026-048, T-2026-049
- Blocked-by: —
- Tags: integration, replay-modes, endless, speed-run
- Refs: docs/progression.md, docs/minigames/TEMPLATE.md

EndlessModeService (T-2026-048) and SpeedRunService (T-2026-049) manage sessions, but no ticket configures per-minigame parameters. Each minigame spec defines unique endless mode rules (e.g., Module Assembly: "New component every 30 seconds") and speed run par times (e.g., Wire Protocol: "Par time: 4 minutes"). Without per-game config, replay modes use generic defaults.

Acceptance criteria:
- [ ] `EndlessModeConfig` interface: gameId, spawnInterval, difficultyScaling, highScoreNamespace
- [ ] `SpeedRunConfig` interface: gameId, parTime, levelSet (levelId[]), bestTimeNamespace
- [ ] Config data file at `src/app/data/replay-mode-configs.data.ts` with entries for all 12 minigames
- [ ] EndlessModePage reads config for the current gameId from route params
- [ ] SpeedRunPage reads config for the current gameId from route params
- [ ] Par times match each minigame spec (e.g., Module Assembly: 3 min, Wire Protocol: 4 min, etc.)
- [ ] Unit tests for: config loading per game, par time values match specs

### T-2026-465
- Title: Wire LeaderboardComponent into SpeedRunPage for post-run leaderboard display
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P8
- Depends: T-2026-219, T-2026-156
- Blocked-by: —
- Tags: integration, leaderboard, speed-run, replay-modes
- Refs: docs/progression.md, docs/research/gamification-patterns.md

Progression.md specifies "Speed run leaderboards are competitive." Gamification research says "Speed run leaderboards are competitive; mastery is personal." T-2026-253 wires LeaderboardComponent into LevelSelectPage replay tabs, but the SpeedRunPage (T-2026-156) itself should show the leaderboard post-run so the player sees their rank immediately after completing a speed run. Without this, the player must navigate back to level select to see their ranking.

Acceptance criteria:
- [ ] SpeedRunPage renders LeaderboardComponent in the post-run results section
- [ ] Leaderboard shows speed run mode entries for the current minigame
- [ ] Player's new entry highlighted if they just set a record
- [ ] Leaderboard positioned below the time splits breakdown
- [ ] Unit tests for: leaderboard rendering in post-run state, player entry highlight

### T-2026-466
- Title: Create integration test for replay mode configuration loading per minigame
- Status: todo
- Assigned: unassigned
- Priority: low
- Size: S
- Milestone: P8
- Depends: T-2026-284
- Blocked-by: —
- Tags: testing, integration, replay-modes, configuration
- Refs: docs/progression.md, docs/minigames/TEMPLATE.md

T-2026-284 creates replay mode configs (EndlessModeConfig, SpeedRunConfig) for all 12 minigames with game-specific parameters from each minigame spec (spawn intervals, par times). No integration test verifies that: all 12 minigames have both endless and speed run configs, par times match spec values, and the config loading pipeline works when EndlessModePage/SpeedRunPage reads config by route param gameId.

Acceptance criteria:
- [ ] Integration test at `src/app/core/integration/replay-mode-configs.integration.spec.ts`
- [ ] Test: all 12 minigame IDs have EndlessModeConfig entries
- [ ] Test: all 12 minigame IDs have SpeedRunConfig entries
- [ ] Test: Module Assembly par time matches spec (verify against minigame doc)
- [ ] Test: replay mode page reads correct config when gameId route param is 'module-assembly'
- [ ] Test: unknown gameId returns default/fallback config
- [ ] Uses real config data and route param resolution

### T-2026-285
- Title: Create P8 end-to-end smoke test for replay modes
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P8
- Depends: T-2026-155, T-2026-156, T-2026-157
- Blocked-by: —
- Tags: testing, e2e, replay-modes, endless, speed-run, daily-challenge
- Refs: docs/progression.md, playwright.config.ts

No E2E test validates that replay mode routes render and function. This test covers endless mode, speed run, and daily challenge page rendering.

Acceptance criteria:
- [ ] Playwright test at `e2e/replay-modes.spec.ts`
- [ ] Test: navigate to `/minigames/module-assembly/endless`, verify pre-game UI renders with high score and start button
- [ ] Test: navigate to `/minigames/module-assembly/speedrun`, verify pre-run UI renders with par time and best time
- [ ] Test: navigate to `/minigames/module-assembly/daily`, verify daily challenge UI renders with topic and XP bonus
- [ ] Tests verify MinigameShell is NOT present on pre-game screens (replay modes have their own HUD)
- [ ] Tests run in CI (GitHub Actions)

### T-2026-221
- Title: Wire DegradationAlertComponent "Practice Now" to refresher challenge route
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P2
- Depends: T-2026-161, T-2026-217
- Blocked-by: —
- Tags: integration, spaced-repetition, refresher, navigation
- Refs: docs/progression.md, docs/ux/navigation.md

DegradationAlertComponent (T-2026-161) has a "Practice Now" button that emits a `practiceRequested` event with topicId. RefresherChallengePage (T-2026-217) handles the actual practice flow at `/refresher/:topicId`. But no ticket wires the button event to router navigation to the refresher page.

Acceptance criteria:
- [ ] DashboardPage (or parent) listens to DegradationAlertComponent.practiceRequested event
- [ ] On practiceRequested, navigates to `/refresher/:topicId`
- [ ] ProfilePage also wires the same navigation for its degradation display
- [ ] Unit tests for: navigation on practice request

### T-2026-222
- Title: Add StoryMissionContentService to curriculum barrel export
- Status: todo
- Assigned: unassigned
- Priority: low
- Size: S
- Milestone: P2
- Depends: T-2026-166
- Blocked-by: —
- Tags: infrastructure, barrel-export, conventions
- Refs: src/app/core/curriculum/index.ts

StoryMissionContentService (T-2026-166) states "Exported from curriculum barrel" in its acceptance criteria, but the barrel update is embedded in that ticket. Per conventions, this explicit barrel ticket ensures the export is not missed and is independently verifiable.

Acceptance criteria:
- [ ] `src/app/core/curriculum/index.ts` updated to export `StoryMissionContentService` and `StoryMissionContent`
- [ ] Build passes with updated barrel

### T-2026-320
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

### T-2026-287
- Title: Add MinigameShell HUD E2E tests for P2 minigame components
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P2
- Depends: T-2026-061
- Blocked-by: —
- Tags: testing, e2e, minigame-framework, hud
- Refs: e2e/minigame-shell.spec.ts, src/app/core/minigame/minigame-shell/minigame-shell.ts

Once P2 registers real minigame components (starting with Module Assembly), add E2E tests verifying the MinigameShell HUD renders correctly: score display, timer, hint button, pause button, and lives display.

Acceptance criteria:
- [ ] E2E test navigates to a registered minigame with a real component
- [ ] Verifies MinigameShell HUD elements render (score, timer, hints, pause)
- [ ] Verifies pause/resume interaction
- [ ] Tests run via `npm run e2e`

### T-2026-377
- Title: Add beforeunload handler to MinigamePlayPage for unsaved game warning
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P2
- Depends: T-2026-223
- Blocked-by: —
- Tags: ux, minigame, browser, data-loss-prevention
- Refs: docs/ux/navigation.md, src/app/pages/minigame-play/minigame-play.ts

MinigamePlayPage allows users to close the browser tab during an active game without any warning. The `canDeactivate` guard (T-2026-363) handles in-app navigation but does not cover browser close, tab close, or page refresh. The `beforeunload` event is the only way to warn users in these scenarios.

Acceptance criteria:
- [ ] MinigamePlayPage registers a `beforeunload` event handler when engine status is Playing or Paused
- [ ] Handler sets `event.returnValue` to trigger the browser's native "Leave site?" dialog
- [ ] Handler is removed when engine status is Won, Lost, or Loading (no false warnings)
- [ ] Handler is removed on component destroy via `DestroyRef`
- [ ] Unit tests for: handler registered on Playing, handler removed on Won/Lost, handler removed on destroy

### T-2026-378
- Title: Wire LeaderboardService entry recording into LevelCompletionService
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P8
- Depends: T-2026-110, T-2026-113
- Blocked-by: —
- Tags: integration, leaderboard, progression, completion
- Refs: docs/research/gamification-patterns.md, docs/progression.md

LeaderboardService (T-2026-110) defines `addEntry(gameId, entry)` for recording per-minigame scores, but no ticket triggers this call. When a level is completed via LevelCompletionService, the result should be recorded in the leaderboard. Without this integration, the leaderboard is never populated during gameplay.

Acceptance criteria:
- [ ] LevelCompletionService.completeLevel() calls LeaderboardService.addEntry() with the game result
- [ ] Entry includes: score, time (from engine timer), date, mode (from engine playMode)
- [ ] Entry only added for modes that have leaderboards (story, endless, speedrun -- not daily)
- [ ] Leaderboard entry uses the player name from GameStateService
- [ ] Unit tests for: entry added on level complete, correct mode mapping, daily mode excluded

### T-2026-379
- Title: Create AchievementNotificationComponent for earned achievement toasts
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P8
- Depends: T-2026-109, T-2026-032
- Blocked-by: —
- Tags: ui, component, achievements, notifications, gamification
- Refs: docs/research/gamification-patterns.md, docs/ux/visual-style.md

AchievementService (T-2026-109) specifies "Achievement notification on earn (integrates with toast system)" but no ticket creates the visual notification component. When an achievement is earned, a toast should appear with the badge icon, title, and type (Discovery/Mastery/Commitment). This is distinct from XP notifications -- achievements deserve their own visual treatment.

Acceptance criteria:
- [ ] `AchievementNotificationComponent` at `src/app/shared/components/achievement-notification/`
- [ ] Selector: `nx-achievement-notification`
- [ ] Displays: badge icon, achievement title, type label (Discovery/Mastery/Commitment)
- [ ] Type-specific accent colors: Discovery (Reactor Blue), Mastery (Solar Gold), Commitment (Sensor Green)
- [ ] Slide-in animation from top-right, auto-dismiss after 4 seconds
- [ ] Respects `prefers-reduced-motion`
- [ ] Stacks with existing notifications (does not overlap XP toasts)
- [ ] Exported from shared components barrel
- [ ] Unit tests for: notification rendering, type-specific colors, auto-dismiss, reduced motion

### T-2026-380
- Title: Wire AchievementNotificationComponent into app shell root for global display
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P8
- Depends: T-2026-379, T-2026-009
- Blocked-by: —
- Tags: integration, notifications, app-shell, achievements
- Refs: docs/research/gamification-patterns.md, src/app/app.html

XpNotificationComponent and RankUpOverlayComponent are wired into the app shell root (T-2026-125, T-2026-225). AchievementNotificationComponent (T-2026-379) needs the same treatment. Without this, achievement toasts have no DOM host and never render.

Acceptance criteria:
- [ ] App component imports AchievementNotificationComponent
- [ ] App shell template includes the achievement notification container
- [ ] Notifications display globally when AchievementService.checkAchievements() finds a new earn
- [ ] Does not overlap with XP notifications or rank-up overlay (z-index ordering)
- [ ] Unit tests for: notification visibility on achievement earn

### T-2026-381
- Title: Create integration test for tutorial-to-first-play flow in MinigamePlayPage
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P2
- Depends: T-2026-205, T-2026-168
- Blocked-by: —
- Tags: testing, integration, tutorial, minigame, first-play
- Refs: docs/minigames/TEMPLATE.md, src/app/pages/minigame-play/minigame-play.ts

T-2026-205 integrated MinigameTutorialOverlay with first-play detection and T-2026-168 creates tutorial data for P2 minigames. No integration test verifies the full first-play flow: tutorial-seen flag absent -> tutorial overlay shown -> engine NOT started -> dismiss tutorial -> engine starts -> tutorial-seen flag persisted -> subsequent play skips tutorial.

Acceptance criteria:
- [ ] Integration test at `src/app/pages/minigame-play/tutorial-first-play.integration.spec.ts`
- [ ] Test: first play with no tutorial-seen flag -> tutorial overlay visible, engine not started
- [ ] Test: dismiss tutorial -> engine starts, tutorial-seen flag persisted to localStorage
- [ ] Test: subsequent play with tutorial-seen flag -> tutorial not shown, engine starts immediately
- [ ] Test: "How to Play" from pause menu shows tutorial without blocking engine restart
- [ ] Uses real StatePersistenceService with fake localStorage

### T-2026-384
- Title: Create integration test for EndlessModeService high score update on session end
- Status: todo
- Assigned: unassigned
- Priority: low
- Size: S
- Milestone: P8
- Depends: T-2026-048, T-2026-155
- Blocked-by: —
- Tags: testing, integration, endless-mode, high-score
- Refs: docs/progression.md, src/app/core/minigame/endless-mode.service.ts

EndlessModeService (T-2026-048) tracks high scores per game and EndlessModePage (T-2026-155) manages sessions. No integration test verifies the flow: start session -> play rounds -> session ends -> high score updated if new record -> high score persisted. The page must call `endSession()` which returns whether a new high score was achieved.

Acceptance criteria:
- [ ] Integration test at `src/app/core/integration/endless-high-score.integration.spec.ts`
- [ ] Test: complete endless session with score higher than existing high score -> high score updated
- [ ] Test: complete endless session with score lower than existing high score -> high score unchanged
- [ ] Test: high score persists across service restarts (localStorage round-trip)
- [ ] Test: first-ever session always sets high score
- [ ] Uses real EndlessModeService with fake localStorage

### T-2026-385
- Title: Create integration test for SpeedRunService best time update on run completion
- Status: todo
- Assigned: unassigned
- Priority: low
- Size: S
- Milestone: P8
- Depends: T-2026-049, T-2026-156
- Blocked-by: —
- Tags: testing, integration, speed-run, best-time
- Refs: docs/progression.md, src/app/core/minigame/speed-run.service.ts

SpeedRunService (T-2026-049) tracks best times per game. No integration test verifies the flow: start run -> complete levels -> record time -> best time updated if faster -> best time persisted.

Acceptance criteria:
- [ ] Integration test at `src/app/core/integration/speedrun-best-time.integration.spec.ts`
- [ ] Test: complete speed run faster than existing best time -> best time updated
- [ ] Test: complete speed run slower than existing best time -> best time unchanged
- [ ] Test: best time persists across service restarts (localStorage round-trip)
- [ ] Test: first-ever run always sets best time
- [ ] Uses real SpeedRunService with fake localStorage

### T-2026-456
- Title: Wire CosmeticService unlock evaluation to rank-up and mastery milestone events
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P8
- Depends: T-2026-111, T-2026-021, T-2026-022
- Blocked-by: —
- Tags: integration, cosmetics, gamification, progression, unlock
- Refs: docs/progression.md

Progression.md specifies cosmetic unlocks are "Unlocked at rank milestones and mastery milestones." CosmeticService (T-2026-111) stores cosmetic items with unlock conditions but no ticket triggers the evaluation. T-2026-279 wires AchievementService checks to progression events, but CosmeticService needs the same treatment. Without this, cosmetics are never unlocked during gameplay.

Acceptance criteria:
- [ ] XpService rank change triggers CosmeticService.evaluateUnlocks()
- [ ] MasteryService mastery change triggers CosmeticService.evaluateUnlocks()
- [ ] AchievementService new achievement triggers CosmeticService.evaluateUnlocks() (for achievement-tied badges)
- [ ] Newly unlocked cosmetics shown via notification (toast or dedicated cosmetic unlock notification)
- [ ] Multiple unlocks at once (e.g., rank up unlocks 2 cosmetics) each get notified
- [ ] Unit tests for: unlock triggered on rank up, unlock triggered on mastery milestone, unlock triggered on achievement earn

### T-2026-457
- Title: Wire unlocked cosmetic themes into SettingsPage theme selector
- Status: todo
- Assigned: unassigned
- Priority: low
- Size: S
- Milestone: P8
- Depends: T-2026-111, T-2026-143, T-2026-325
- Blocked-by: —
- Tags: integration, cosmetics, settings, themes
- Refs: docs/progression.md, docs/ux/navigation.md

Progression.md lists "UI themes" as cosmetic unlocks. SettingsPage (T-2026-080) has a theme selector with dark/station/light options. CosmeticService (T-2026-111) tracks unlocked cosmetics including themes. T-2026-325 creates theme CSS variants. But no ticket connects CosmeticService unlocked themes to the theme selector dropdown. Without this, the theme selector only shows the 3 default themes even if the player has unlocked additional variants.

Acceptance criteria:
- [ ] SettingsPage theme selector queries CosmeticService for unlocked theme cosmetics
- [ ] Default themes (dark, station, light) always available
- [ ] Unlocked cosmetic themes added to the dropdown (e.g., "Reactor Blue", "Solar Gold")
- [ ] Locked themes shown as dimmed with unlock requirement tooltip
- [ ] Selecting an unlocked cosmetic theme applies it via SettingsService and CosmeticService.equipCosmetic()
- [ ] Unit tests for: default themes always present, unlocked themes added, locked themes dimmed, equip on select

### T-2026-458
- Title: Create P8 E2E smoke test for profile page achievements, cosmetics, and leaderboard sections
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P8
- Depends: T-2026-252, T-2026-280, T-2026-253
- Blocked-by: —
- Tags: testing, e2e, profile, achievements, cosmetics, leaderboard
- Refs: docs/ux/navigation.md, playwright.config.ts

P8 adds achievements (T-2026-252), cosmetics (T-2026-280), and leaderboard (T-2026-253) sections to the profile and level select pages. T-2026-285 has E2E tests for replay modes but none for the achievement/cosmetic/leaderboard UI sections. No E2E test validates these P8 additions render correctly.

Acceptance criteria:
- [ ] Playwright test at `e2e/p8-profile.spec.ts`
- [ ] Test: `/profile` renders "Achievements" section with achievement grid
- [ ] Test: achievement badges display with earned/unearned states
- [ ] Test: `/profile` renders "Cosmetics" section with cosmetic gallery
- [ ] Test: cosmetic gallery shows filter tabs (Skin, Theme, Badge)
- [ ] Test: `/minigames/module-assembly` renders leaderboard tab in replay mode section
- [ ] Tests run in CI (GitHub Actions)

### T-2026-459
- Title: Create integration test for CosmeticService unlock evaluation on rank milestone
- Status: todo
- Assigned: unassigned
- Priority: low
- Size: S
- Milestone: P8
- Depends: T-2026-456
- Blocked-by: —
- Tags: testing, integration, cosmetics, rank, progression
- Refs: docs/progression.md, src/app/core/progression/cosmetic.service.ts

T-2026-456 wires CosmeticService unlock evaluation to rank-up events. No integration test verifies the chain: earn enough XP -> rank up -> CosmeticService evaluates -> rank-milestone cosmetic unlocked -> notification shown.

Acceptance criteria:
- [ ] Integration test at `src/app/core/integration/cosmetic-rank-unlock.integration.spec.ts`
- [ ] Test: reaching Ensign rank unlocks the Ensign-tier cosmetic
- [ ] Test: reaching Commander rank unlocks the Commander-tier cosmetic
- [ ] Test: rank below threshold does not unlock cosmetic
- [ ] Test: already-unlocked cosmetic is not re-notified on subsequent rank evaluations
- [ ] Uses real CosmeticService, XpService, and cosmetic data

### T-2026-386
- Title: Add AudioService sound effect for achievement earned event
- Status: todo
- Assigned: unassigned
- Priority: low
- Size: S
- Milestone: P8
- Depends: T-2026-109, T-2026-051
- Blocked-by: —
- Tags: audio, achievements, integration
- Refs: docs/research/gamification-patterns.md, src/app/core/audio/audio.service.ts

AudioService plays sounds for rank-up (T-2026-327), XP notifications (T-2026-328), and minigame actions (T-2026-322/T-2026-323). Achievements are a significant reward event per gamification research ("Achievement badges - types: Discovery, mastery, commitment") but have no associated sound. A distinct achievement sound reinforces the reward.

Acceptance criteria:
- [ ] `SoundEffect` enum extended with `achievement` value
- [ ] Placeholder audio file created at `assets/audio/achievement.mp3`
- [ ] AchievementService calls `AudioService.play(SoundEffect.achievement)` when a new achievement is earned
- [ ] Sound respects SettingsService.soundEnabled toggle
- [ ] Unit tests for: sound played on achievement earn, sound skipped when sound disabled

### T-2026-388
- Title: Create canDeactivate guard for StoryMissionPage during active mission step
- Status: todo
- Assigned: unassigned
- Priority: low
- Size: S
- Milestone: P2
- Depends: T-2026-075, T-2026-057
- Blocked-by: —
- Tags: routing, guard, story-missions, ux, navigation
- Refs: docs/ux/navigation.md, src/app/pages/mission/

T-2026-363 creates a `canDeactivate` guard for MinigamePlayPage but no equivalent exists for StoryMissionPage. When a player is partway through a multi-step story mission and navigates away (via nav link, back button, or URL change), progress through the current mission steps could be lost. A guard should confirm before allowing departure.

Acceptance criteria:
- [ ] `StoryMissionGuard` functional `canDeactivate` guard at `src/app/core/guards/story-mission.guard.ts`
- [ ] Guard checks if the player is partway through a multi-step mission (current step > 0 and < total steps)
- [ ] If mid-mission: shows ConfirmDialogComponent with "Leave this mission? Your step progress will be lost."
- [ ] If at start (step 0) or completed: allows navigation without prompt
- [ ] Guard registered on the `/mission/:chapterId` route in `app.routes.ts`
- [ ] Unit tests for: guard allows at step 0, guard prompts mid-mission, guard allows after completion

### T-2026-389
- Title: Add StoryMissionGuard to guards barrel export
- Status: todo
- Assigned: unassigned
- Priority: low
- Size: S
- Milestone: P2
- Depends: T-2026-388, T-2026-347
- Blocked-by: —
- Tags: infrastructure, barrel-export, conventions
- Refs: src/app/core/guards/index.ts

T-2026-388 creates StoryMissionGuard and T-2026-347 creates the guards barrel. This ticket ensures StoryMissionGuard is included in the barrel alongside MissionGuard, MinigameLevelGuard, and MinigamePlayGuard.

Acceptance criteria:
- [ ] `src/app/core/guards/index.ts` updated to export `StoryMissionGuard`
- [ ] Build passes with updated barrel

### T-2026-390
- Title: Wire AnimationService entrance animations to LevelResultsComponent and LevelFailedComponent
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P2
- Depends: T-2026-052, T-2026-159, T-2026-183
- Blocked-by: —
- Tags: ui, animation, polish, minigame, completion
- Refs: docs/ux/visual-style.md, src/app/shared/components/level-results/level-results.ts, src/app/shared/components/level-failed/level-failed.ts, src/app/core/animation/animation.service.ts

AnimationService (T-2026-052) provides `slideIn`, `fadeIn`, `scaleIn` animation helpers. LevelResultsComponent (T-2026-159) and LevelFailedComponent (T-2026-183) appear as overlays but have no entrance animations. Visual-style.md specifies "150-250ms for UI transitions, 300-500ms for game feedback." Without entrance animations, overlays appear abruptly.

Acceptance criteria:
- [ ] LevelResultsComponent uses AnimationService `slideIn('up')` for entrance (300ms)
- [ ] Star rating elements use staggered `scaleIn` animation (one per star, 150ms delay between)
- [ ] XP breakdown items use staggered `fadeIn` animation
- [ ] LevelFailedComponent uses AnimationService `fadeIn` for entrance (250ms)
- [ ] All animations respect `prefers-reduced-motion` (instant transition fallback)
- [ ] All animations respect SettingsService `animationSpeed` via AnimationService duration multiplier
- [ ] Unit tests for: animation triggers on component init, reduced motion fallback

### T-2026-391
- Title: Create integration test for AnimationService duration scaling with SettingsService animationSpeed
- Status: todo
- Assigned: unassigned
- Priority: low
- Size: S
- Milestone: P2
- Depends: T-2026-242, T-2026-052
- Blocked-by: —
- Tags: testing, integration, animation, settings
- Refs: docs/ux/visual-style.md, src/app/core/animation/animation.service.ts, src/app/core/settings/settings.service.ts

T-2026-242 wired `animationSpeed` setting to scale animation durations via `SPEED_MULTIPLIERS`, but no integration test verifies the chain: change animationSpeed setting -> AnimationService duration multiplier updates -> actual animation durations scale correctly.

Acceptance criteria:
- [ ] Integration test at `src/app/core/integration/animation-speed.integration.spec.ts`
- [ ] Test: default animationSpeed ('normal') -> AnimationService uses 1x multiplier
- [ ] Test: set animationSpeed to 'fast' -> AnimationService uses reduced multiplier
- [ ] Test: set animationSpeed to 'off' -> AnimationService uses 0 multiplier (instant transitions)
- [ ] Test: animationSpeed change is reactive (changing setting mid-session updates multiplier)
- [ ] Uses real AnimationService and SettingsService

### T-2026-392
- Title: Wire EmptyStateComponent into DashboardPage for zero-progress first-time user state
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P2
- Depends: T-2026-129, T-2026-078
- Blocked-by: —
- Tags: ui, integration, empty-state, dashboard, ux, first-time-user
- Refs: docs/ux/navigation.md, docs/research/gamification-patterns.md, src/app/pages/dashboard/

DashboardPage (T-2026-078) renders several data-dependent sections: station visualization, active mission prompt, quick-play shortcuts, daily challenge, and degradation alerts. For a brand-new user with zero progress (no missions completed, no XP, no mastery), most sections would be empty or show meaningless defaults. Gamification research emphasizes "Progressive disclosure." A dedicated zero-progress state should guide the user toward their first action.

Acceptance criteria:
- [ ] DashboardPage detects zero-progress state via GameProgressionService (no missions completed)
- [ ] Zero-progress state renders EmptyStateComponent with: welcome message, "Begin your first mission" call-to-action
- [ ] Station visualization shows all modules in dark/damaged state (0-star mastery)
- [ ] Quick-play shortcuts section hidden (no unlocked minigames)
- [ ] Daily challenge section hidden (no topics to challenge on)
- [ ] Degradation alerts section hidden (no mastery to degrade)
- [ ] Active mission prompt still shows "Start Mission 1" (from T-2026-235/T-2026-317)
- [ ] Unit tests for: zero-progress detection, empty state rendering, section visibility

### T-2026-393
- Title: Wire LoadingSpinnerComponent into DashboardPage during initial service data loading
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P2
- Depends: T-2026-128, T-2026-078
- Blocked-by: —
- Tags: ui, loading, dashboard, ux
- Refs: docs/ux/navigation.md, src/app/pages/dashboard/

DashboardPage (T-2026-078) queries 5+ services on init (XpService, GameProgressionService, MasteryService, DailyChallengeService, SpacedRepetitionService). During the initial rendering cycle, service signals may not have settled yet, especially if persistence loading is involved. LoadingSpinnerComponent (T-2026-128) provides the station-themed spinner but no ticket applies it to the dashboard.

Acceptance criteria:
- [ ] DashboardPage shows LoadingSpinnerComponent during initial data resolution
- [ ] Spinner replaced with dashboard content once all critical signals are available
- [ ] Loading duration is minimal (signals are synchronous from localStorage) but handles edge cases
- [ ] Spinner uses the compact variant appropriate for page-level loading
- [ ] Unit tests for: spinner shown before data ready, spinner replaced on data availability

### T-2026-394
- Title: Create integration test for Module Assembly level data end-to-end loading pipeline
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P2
- Depends: T-2026-058, T-2026-137
- Blocked-by: —
- Tags: testing, integration, module-assembly, level-data, pipeline
- Refs: docs/minigames/01-module-assembly.md, src/app/data/levels/module-assembly.data.ts, src/app/core/levels/level-loader.service.ts

T-2026-058 created 18 Module Assembly levels with data integrity tests. T-2026-137 registers them with LevelLoaderService. But no integration test verifies the full pipeline: data file imported -> registered with LevelLoaderService -> `loadLevel()` returns correct data -> `loadLevelPack()` returns all 18 levels grouped by tier -> LevelProgressionService has entries for all 18 levels. This is critical validation before P2 engine/UI work begins.

Acceptance criteria:
- [ ] Integration test at `src/app/data/integration/module-assembly-pipeline.integration.spec.ts`
- [ ] Test: register Module Assembly level pack -> `loadLevel('module-assembly', 'ma-basic-01')` returns valid LevelDefinition
- [ ] Test: `loadLevelPack('module-assembly')` returns 18 levels across 4 tiers (6 basic, 6 intermediate, 5 advanced, 1 boss)
- [ ] Test: all 18 levels have non-empty `data` fields with required game-specific properties
- [ ] Test: LevelProgressionService has entries for all 18 levels after registration
- [ ] Test: `loadLevel()` with invalid levelId returns empty/error Observable
- [ ] Uses real LevelLoaderService, LevelProgressionService, and the actual data file

### T-2026-395
- Title: Create QuickPlayService for selecting recommended minigames for dashboard shortcuts
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P2
- Depends: T-2026-029, T-2026-026, T-2026-050
- Blocked-by: —
- Tags: service, dashboard, minigame, recommendation
- Refs: docs/ux/navigation.md, docs/research/gamification-patterns.md

Navigation.md specifies the dashboard includes "Quick-play minigame shortcuts." T-2026-236 wires these into the dashboard and says "Games selected by: most recently played (if available), or first unlocked games." But no service encapsulates the selection logic. Embedding recommendation logic directly in the page component makes it untestable and couples the dashboard to PlayTimeService internals.

Acceptance criteria:
- [ ] `QuickPlayService` at `src/app/core/progression/quick-play.service.ts`
- [ ] `getRecommendedGames(count: number)`: returns up to N MinigameId values
- [ ] Selection priority: (1) most recently played games (via PlayTimeService), (2) unlocked but unplayed games, (3) games with lowest mastery
- [ ] Only returns unlocked games (via GameProgressionService)
- [ ] Returns empty array if no games are unlocked
- [ ] Exported from progression barrel
- [ ] Unit tests for: recently played priority, unplayed fallback, lowest mastery fallback, unlocked filter, empty state

### T-2026-396
- Title: Add QuickPlayService to progression barrel export
- Status: todo
- Assigned: unassigned
- Priority: low
- Size: S
- Milestone: P2
- Depends: T-2026-395
- Blocked-by: —
- Tags: infrastructure, barrel-export, conventions
- Refs: src/app/core/progression/index.ts

QuickPlayService (T-2026-395) will create `quick-play.service.ts` in the progression directory. Per conventions, ensure it is exported from the barrel.

Acceptance criteria:
- [ ] `src/app/core/progression/index.ts` updated to export `QuickPlayService`
- [ ] Build passes with updated barrel

### T-2026-397
- Title: Wire LoadingSpinnerComponent into ProfilePage during stats loading
- Status: todo
- Assigned: unassigned
- Priority: low
- Size: S
- Milestone: P2
- Depends: T-2026-128, T-2026-079
- Blocked-by: —
- Tags: ui, loading, profile, ux
- Refs: docs/ux/navigation.md, src/app/pages/profile/

ProfilePage (T-2026-079) queries LifetimeStatsService, MasteryService, SpacedRepetitionService, and StreakService. No loading indicator is shown while stats are being resolved. Same pattern as the dashboard loading state.

Acceptance criteria:
- [ ] ProfilePage shows LoadingSpinnerComponent during initial data resolution
- [ ] Spinner replaced with profile content once all critical signals are available
- [ ] Unit tests for: spinner shown before data ready, spinner replaced on data availability

### T-2026-398
- Title: Wire LoadingSpinnerComponent into CampaignPage during mission data loading
- Status: todo
- Assigned: unassigned
- Priority: low
- Size: S
- Milestone: P2
- Depends: T-2026-128, T-2026-141
- Blocked-by: —
- Tags: ui, loading, campaign, ux
- Refs: docs/ux/navigation.md, src/app/pages/campaign/

CampaignPage (T-2026-141) renders all 34 missions grouped by 6 curriculum phases with completion status from GameProgressionService. No loading state ticket exists for this page.

Acceptance criteria:
- [ ] CampaignPage shows LoadingSpinnerComponent during initial data resolution
- [ ] Spinner replaced with campaign content once mission and progression data are available
- [ ] Unit tests for: spinner shown before data ready, spinner replaced on data availability

### T-2026-399
- Title: Create MinigameHubPage responsive layout test for mobile stacked view
- Status: todo
- Assigned: unassigned
- Priority: low
- Size: S
- Milestone: P2
- Depends: T-2026-076
- Blocked-by: —
- Tags: testing, responsive, minigame-hub, ui, mobile
- Refs: docs/ux/navigation.md, docs/ux/visual-style.md, src/app/pages/minigame-hub/minigame-hub.scss

Navigation.md specifies responsive breakpoints: "Mobile: < 768px - stacked layouts." MinigameHubPage (T-2026-076) renders a grid of minigame cards but no ticket tests or validates the responsive layout at mobile width. Cards should stack vertically on mobile rather than rendering in a grid that overflows.

Acceptance criteria:
- [ ] MinigameHubPage SCSS has responsive breakpoint at 768px
- [ ] At mobile width: cards stack in single column, filters stack vertically
- [ ] At tablet width: 2-column grid
- [ ] At desktop width: 3-4 column grid
- [ ] Unit test or visual regression test for: card layout at each breakpoint

### T-2026-400
- Title: Create DashboardPage responsive layout with stacked sections for mobile
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P2
- Depends: T-2026-078
- Blocked-by: —
- Tags: ui, responsive, dashboard, mobile
- Refs: docs/ux/navigation.md, docs/ux/visual-style.md

Navigation.md specifies responsive breakpoints: "Mobile: < 768px - stacked layouts." DashboardPage (T-2026-078) has multiple sections (station visualization, mission prompt, quick-play, daily challenge, degradation alerts) that must stack vertically on mobile. Without explicit responsive styling, sections may overlap or overflow on small screens.

Acceptance criteria:
- [ ] DashboardPage SCSS has responsive breakpoint at 768px
- [ ] At mobile width: all sections stack in single column, full width
- [ ] At tablet width: 2-column layout for cards (mission prompt + daily challenge side by side)
- [ ] At desktop width: station visualization centered, cards in multi-column grid below
- [ ] Quick-play shortcuts become horizontally scrollable row on mobile
- [ ] Unit tests or E2E tests validate no horizontal overflow at 375px viewport width

### T-2026-401
- Title: Create ProfilePage responsive layout with card stacking for mobile
- Status: todo
- Assigned: unassigned
- Priority: low
- Size: S
- Milestone: P2
- Depends: T-2026-079
- Blocked-by: —
- Tags: ui, responsive, profile, mobile
- Refs: docs/ux/navigation.md, docs/ux/visual-style.md

Navigation.md specifies responsive breakpoints for all pages. ProfilePage (T-2026-079) has rank display, mastery table, streak counter, and play time stats. The mastery table (T-2026-315) already has responsive card layout, but the overall page layout needs mobile optimization.

Acceptance criteria:
- [ ] ProfilePage SCSS has responsive breakpoint at 768px
- [ ] At mobile width: sections stack vertically, rank badge centered, stats in 2-column grid
- [ ] Mastery table switches to card layout (handled by MasteryTableComponent)
- [ ] Play time and streak sections full width on mobile
- [ ] Unit tests or E2E tests validate no horizontal overflow at 375px viewport width

### T-2026-402
- Title: Wire QuickPlayService into DashboardPage via T-2026-236 dependency
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P2
- Depends: T-2026-395, T-2026-236
- Blocked-by: —
- Tags: integration, dashboard, quick-play, recommendation
- Refs: docs/ux/navigation.md, src/app/pages/dashboard/

T-2026-236 wires quick-play minigame shortcuts into DashboardPage with selection logic described inline ("Games selected by: most recently played or first unlocked"). T-2026-395 extracts this logic into QuickPlayService. This ticket ensures DashboardPage uses QuickPlayService rather than implementing selection logic inline.

Acceptance criteria:
- [ ] DashboardPage injects QuickPlayService
- [ ] Quick-play section populated from `QuickPlayService.getRecommendedGames(4)`
- [ ] Cards rendered using MinigameCardComponent (T-2026-187)
- [ ] Card click navigates to `/minigames/:gameId` (level select)
- [ ] Section hidden when `getRecommendedGames()` returns empty array
- [ ] Unit tests for: service integration, section visibility, navigation

### T-2026-403
- Title: Create integration test for full story mission to minigame unlock to level play pipeline
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: M
- Milestone: P2
- Depends: T-2026-259, T-2026-137, T-2026-059
- Blocked-by: —
- Tags: testing, integration, game-loop, critical-path
- Refs: docs/overview.md, docs/curriculum.md

Overview.md's core game loop is: Story Mission -> Unlock Minigame -> Master Minigame -> Next Story Mission. T-2026-332 covers the cross-cutting story-to-minigame flow but depends on T-2026-088 (Terminal Hack UI, P4). No integration test covers the P2-scope flow: complete Ch 1 story mission -> Module Assembly unlocks -> register level data -> load level 1 -> engine initializes -> play through -> complete level -> XP awarded -> mastery updated. This is the critical path validation for P2 delivery.

Acceptance criteria:
- [ ] Integration test at `src/app/core/integration/p2-game-loop.integration.spec.ts`
- [ ] Test: complete story mission Ch 1 -> GameProgressionService.completeMission(1) succeeds
- [ ] Test: after Ch 1 complete, Module Assembly minigame is unlocked
- [ ] Test: register Module Assembly levels -> load level 'ma-basic-01' -> valid data returned
- [ ] Test: create ModuleAssemblyEngine (when available), initialize with level data -> engine starts
- [ ] Test: complete level via engine -> LevelCompletionService.completeLevel() awards XP
- [ ] Test: MasteryService mastery for 'module-assembly' is updated
- [ ] Test: verify diminishing returns recorded for the completed level
- [ ] Uses real services (GameProgressionService, XpService, MasteryService, LevelCompletionService, LevelLoaderService)

### T-2026-404
- Title: Wire AudioService achievement sound to SoundEffect enum placeholder
- Status: todo
- Assigned: unassigned
- Priority: low
- Size: S
- Milestone: P2
- Depends: T-2026-051
- Blocked-by: —
- Tags: audio, infrastructure, preparation
- Refs: docs/research/gamification-patterns.md, src/app/core/audio/audio.service.ts

T-2026-386 (P8) will wire AudioService to play an achievement sound, but the `SoundEffect` enum currently has only 9 values and does not include `achievement`. Adding the enum value and placeholder audio file now prevents a breaking change when achievement functionality is built in P8. The AudioService architecture pre-loads all sounds; adding the entry early ensures the enum and asset are ready.

Acceptance criteria:
- [ ] `SoundEffect` enum extended with `achievement` value
- [ ] `SOUND_PATHS` constant updated with `achievement: 'audio/achievement.mp3'`
- [ ] Placeholder `achievement.mp3` created at `public/audio/achievement.mp3` (silent or short tone)
- [ ] AudioService preloads the new sound with existing sounds
- [ ] Build passes with no runtime errors
- [ ] Unit tests for: SoundEffect.achievement exists in SOUND_PATHS, AudioService handles all enum values

### T-2026-405
- Title: Create integration test for DashboardPage section visibility based on player progress state
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P2
- Depends: T-2026-078, T-2026-392
- Blocked-by: —
- Tags: testing, integration, dashboard, progressive-disclosure
- Refs: docs/research/gamification-patterns.md, docs/ux/navigation.md

Gamification research emphasizes "Progressive disclosure -- don't show everything at once." DashboardPage has 6+ sections that should appear/hide based on player progress: zero-progress state, first-mission state, some-progress state, and full-progress state. No integration test verifies the dashboard adapts its section visibility correctly as the player progresses.

Acceptance criteria:
- [ ] Integration test at `src/app/pages/dashboard/dashboard-visibility.integration.spec.ts`
- [ ] Test: zero progress -> only welcome state and "Start Mission 1" visible, no quick-play, no daily challenge
- [ ] Test: one mission completed -> active mission prompt visible, one minigame in quick-play, daily challenge visible
- [ ] Test: several missions completed -> station visualization shows mixed mastery, full quick-play section
- [ ] Test: all missions completed -> "Campaign Complete" state, all sections populated
- [ ] Uses real services with controlled state progression

### T-2026-406
- Title: Add `SoundEffect.missionComplete` enum value and placeholder audio for story mission completion
- Status: todo
- Assigned: unassigned
- Priority: low
- Size: S
- Milestone: P2
- Depends: T-2026-051
- Blocked-by: —
- Tags: audio, infrastructure, story-missions, preparation
- Refs: docs/overview.md, src/app/core/audio/audio.service.ts

Story missions award 50 XP and are a significant progression event (overview.md: "Play a story mission -> Unlock the minigame"). The current `SoundEffect` enum has `levelUp` for new level unlocks but no distinct sound for mission completion. When T-2026-259 (story mission completion handler) is built, it will need a sound to play. Adding the enum value now prevents a blocking dependency.

Acceptance criteria:
- [ ] `SoundEffect` enum extended with `missionComplete` value
- [ ] `SOUND_PATHS` constant updated with `missionComplete: 'audio/missionComplete.mp3'`
- [ ] Placeholder `missionComplete.mp3` created at `public/audio/missionComplete.mp3`
- [ ] Build passes with updated enum and paths
- [ ] Unit tests for: SoundEffect.missionComplete exists in SOUND_PATHS

### T-2026-408
- Title: Add CurriculumService to curriculum barrel export
- Status: todo
- Assigned: unassigned
- Priority: low
- Size: S
- Milestone: P2
- Depends: T-2026-407
- Blocked-by: —
- Tags: infrastructure, barrel-export, conventions
- Refs: src/app/core/curriculum/index.ts

CurriculumService (T-2026-407) will create `curriculum.service.ts` in the curriculum directory. Per conventions, ensure it is exported from the barrel.

Acceptance criteria:
- [ ] `src/app/core/curriculum/index.ts` updated to export `CurriculumService`
- [ ] Build passes with updated barrel

### T-2026-409
- Title: Create SettingsPage SCSS with responsive layout for mobile
- Status: todo
- Assigned: unassigned
- Priority: low
- Size: S
- Milestone: P2
- Depends: T-2026-080
- Blocked-by: —
- Tags: ui, responsive, settings, mobile
- Refs: docs/ux/navigation.md, docs/ux/visual-style.md

Navigation.md specifies responsive breakpoints for all pages. SettingsPage (T-2026-080) has toggle controls, selectors, and buttons. At mobile width, controls should stack vertically with full-width buttons. Without responsive styling, form controls may not be usable on small screens.

Acceptance criteria:
- [ ] SettingsPage SCSS has responsive breakpoint at 768px
- [ ] At mobile width: all controls stack vertically, toggle buttons full width
- [ ] "Reset All Progress" button full width on mobile with adequate touch target (44px minimum)
- [ ] Export/Import buttons side by side on desktop, stacked on mobile
- [ ] Unit tests validate no layout overflow at 375px viewport

### T-2026-450
- Title: Wire AudioService to story mission completion handler for mission complete sound
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P2
- Depends: T-2026-259, T-2026-406
- Blocked-by: —
- Tags: audio, integration, story-missions, completion
- Refs: docs/overview.md, docs/research/gamification-patterns.md, src/app/core/audio/audio.service.ts

Gamification research emphasizes "Immediate feedback" and "All minigames provide instant visual/audio feedback." Story mission completion is a significant progression event (50 XP, minigame unlock). AudioService plays sounds for rank-up (T-2026-327), XP (T-2026-328), and minigame actions (T-2026-322/323), but no ticket wires a sound to story mission completion. T-2026-406 adds the SoundEffect.missionComplete enum value. This ticket wires the sound into the completion handler.

Acceptance criteria:
- [ ] Story mission completion handler (T-2026-259) calls AudioService.play(SoundEffect.missionComplete) on mission complete
- [ ] Sound plays before XP notification toast (audio reinforces the moment)
- [ ] Sound respects SettingsService.soundEnabled toggle
- [ ] Sound does not play if mission was already completed (idempotent completion)
- [ ] Unit tests for: sound played on first completion, sound skipped on repeat, sound skipped when disabled

### T-2026-451
- Title: Create integration test for CurriculumService chapter-to-minigame mapping against curriculum.md
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P2
- Depends: T-2026-407, T-2026-038
- Blocked-by: —
- Tags: testing, integration, curriculum, data-integrity
- Refs: docs/curriculum.md, src/app/core/curriculum/curriculum.service.ts, src/app/data/missions/

CurriculumService (T-2026-407) provides getMinigameForChapter() and other lookup methods. The CURRICULUM constant (T-2026-038) defines all 34 chapters. No integration test verifies that the CurriculumService mappings match curriculum.md: that each chapter's minigame unlock is correct, that prerequisite chains are consistent, and that chapters 9, 10, 27, 33, 34 correctly have no minigame unlocks.

Acceptance criteria:
- [ ] Integration test at `src/app/core/integration/curriculum-mapping.integration.spec.ts`
- [ ] Test: chapters 1-3 unlock Module Assembly (or new levels), per curriculum.md
- [ ] Test: chapters 4 unlocks Flow Commander, 5-6 unlock Wire Protocol, 7-8 unlock Signal Corps
- [ ] Test: chapters 9, 10 do NOT unlock any minigame (deferrable views, image optimization)
- [ ] Test: chapters 11-13 unlock Corridor Runner
- [ ] Test: chapters 27, 33, 34 do NOT unlock any minigame (content projection, animations, performance)
- [ ] Test: all 12 minigame IDs appear in the curriculum mapping at least once
- [ ] Uses real CurriculumService and CURRICULUM constant

### T-2026-452
- Title: Create integration test for MissionUnlockNotificationService lifecycle in app shell
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P2
- Depends: T-2026-338, T-2026-259
- Blocked-by: —
- Tags: testing, integration, notifications, minigame-unlock, app-shell
- Refs: docs/overview.md, src/app/app.html

T-2026-338 wires MissionUnlockNotificationService into the app shell root and T-2026-259 creates the story mission completion handler that triggers unlocks. No integration test verifies the full chain: complete mission -> unlock notification service triggers -> notification component renders in app shell -> auto-dismiss or click navigates to minigame.

Acceptance criteria:
- [ ] Integration test at `src/app/core/integration/mission-unlock-notification.integration.spec.ts`
- [ ] Test: completing a mission that unlocks a minigame shows the unlock notification
- [ ] Test: completing a mission that does NOT unlock a minigame does not show notification
- [ ] Test: notification displays the correct minigame name
- [ ] Test: notification auto-dismisses after configured timeout
- [ ] Uses real MissionUnlockNotificationService and GameProgressionService

### T-2026-453
- Title: Create LevelSelectPage replay mode tab content for Endless, Speed Run, and Daily modes
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P2
- Depends: T-2026-077, T-2026-053
- Blocked-by: —
- Tags: ui, level-select, replay-modes, tabs
- Refs: docs/ux/navigation.md, docs/progression.md

Navigation.md specifies the Level Select page includes "Replay mode tabs (Story, Endless, Speed Run, Daily)." LevelSelectPage (T-2026-077) was built with the acceptance criterion for replay mode tabs, but no ticket creates the tab content that navigates to the replay mode routes (/minigames/:gameId/endless, /speedrun, /daily). Without tab content, the tabs are empty or non-functional.

Acceptance criteria:
- [ ] LevelSelectPage has 4 tabs: Story (default), Endless, Speed Run, Daily
- [ ] Story tab shows the level list grouped by tier (existing functionality)
- [ ] Endless tab shows: high score, "Start Endless" button linking to `/minigames/:gameId/endless`
- [ ] Speed Run tab shows: par time, best time, "Start Run" button linking to `/minigames/:gameId/speedrun`
- [ ] Daily tab shows: today's challenge info (if this game), "Accept" button linking to `/minigames/:gameId/daily`
- [ ] Tabs use routerLink for navigation to replay mode routes
- [ ] Unit tests for: tab rendering, button navigation links per mode

### T-2026-454
- Title: Wire StreakRewardService milestone notifications into app shell for visual reward feedback
- Status: todo
- Assigned: unassigned
- Priority: low
- Size: S
- Milestone: P2
- Depends: T-2026-249, T-2026-009
- Blocked-by: —
- Tags: integration, notifications, streaks, app-shell
- Refs: docs/progression.md, docs/research/gamification-patterns.md

StreakRewardService (T-2026-249) awards XP at 7/14/30-day milestones and is wired to StreakService (T-2026-251). However, when a streak milestone is reached, no visual notification is shown to the player. XpNotificationService shows XP toasts, but streak milestones deserve a distinct visual (e.g., "7-Day Streak! +100 XP"). Without this, players may not notice they hit a milestone.

Acceptance criteria:
- [ ] StreakRewardService milestone detection triggers a notification via XpNotificationService or a dedicated streak toast
- [ ] Notification shows: milestone name (e.g., "7-Day Streak"), bonus XP amount, flame icon
- [ ] Notification renders in the app shell notification stack (alongside XP toasts, rank-up overlay)
- [ ] Does not duplicate the XP notification (either combine them or sequence them with a delay)
- [ ] Unit tests for: milestone notification shown on 7-day, 14-day, 30-day milestones

