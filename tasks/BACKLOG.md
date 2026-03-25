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




### T-2026-332
- Title: Create P2 cross-cutting integration test for story mission to minigame unlock flow
- Status: in-progress
- Assigned: claude
- Started: 2026-03-25
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


### T-2026-346
- Title: Create E2E smoke tests for P2 page components (Dashboard, Profile, Settings, Campaign)
- Status: in-progress
- Assigned: claude
- Started: 2026-03-25
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
### T-2026-357
- Title: Create LevelProgressSummaryComponent for minigame level completion counts
- Status: in-progress
- Assigned: claude
- Started: 2026-03-25
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
- Status: in-progress
- Assigned: claude
- Started: 2026-03-25
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

### T-2026-500
- Title: Wire Corridor Runner tutorial data into MinigameRegistryService config
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P3
- Depends: T-2026-191, T-2026-084
- Blocked-by: —
- Tags: integration, tutorial, minigame, corridor-runner, registry
- Refs: docs/minigames/05-corridor-runner.md, src/app/data/tutorials/minigame-tutorials.data.ts

T-2026-191 creates Corridor Runner tutorial step data and T-2026-084 (completed) registers the minigame in the registry. But no ticket wires the tutorial data into the MinigameRegistryService config, following the P2 pattern of T-2026-382 which wired tutorial step data for all 4 P2 games. Without this, the MinigameTutorialOverlayComponent cannot display Corridor Runner first-play instructions.

Acceptance criteria:
- [ ] Corridor Runner `provideMinigame()` call updated to include tutorial steps from MinigameInstructionsData
- [ ] Tutorial steps accessible via `MinigameRegistryService.getConfig('corridor-runner').tutorialSteps`
- [ ] Tutorial overlay displays Corridor Runner-specific steps on first play
- [ ] Unit tests for: tutorial data present in registry config, correct step count

### T-2026-501
- Title: Create integration test for Corridor Runner level data compatibility with engine
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P3
- Depends: T-2026-081, T-2026-082, T-2026-144
- Blocked-by: —
- Tags: testing, integration, corridor-runner, level-data, engine
- Refs: docs/minigames/05-corridor-runner.md, src/app/data/levels/corridor-runner.data.ts

T-2026-081 (completed) defined 18 Corridor Runner levels and T-2026-082 (completed) created the engine. T-2026-144 (completed) registered the level data. But no integration test verifies that all 18 levels load into the engine without errors and produce valid run results. This follows the P2 pattern of T-2026-483 which tests all 4 P2 minigame level data against their services.

Acceptance criteria:
- [ ] Integration test at `src/app/features/minigames/corridor-runner/level-data-compat.integration.spec.ts`
- [ ] Test: all 18 Corridor Runner levels load into the engine via `initialize()` without errors
- [ ] Test: each level's `routeConfig` has at least 1 route entry
- [ ] Test: each level's `mapLayout` has at least 2 nodes and 1 edge
- [ ] Test: each level's `testNavigations` has at least 1 navigation test
- [ ] Test: level 1 basic configuration produces expected navigation results when correct routes are submitted
- [ ] Test: engine can be reset and loaded with a different level from the pack
- [ ] Uses real CorridorRunnerEngine with real level data constants

### T-2026-502
- Title: Create integration test for Corridor Runner simulation service with engine coordinated lifecycle
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P3
- Depends: T-2026-497
- Blocked-by: —
- Tags: testing, integration, corridor-runner, simulation, engine
- Refs: docs/minigames/05-corridor-runner.md

After T-2026-497 wires CorridorRunnerSimulationService into the engine, this integration test verifies the coordinated lifecycle: loading routes, resolving navigations, detecting hull breaches, and evaluating run results through the engine's action pipeline. Follows the P2 pattern of T-2026-476/477/478.

Acceptance criteria:
- [ ] Integration test at `src/app/features/minigames/corridor-runner/simulation-engine.integration.spec.ts`
- [ ] Test: engine.initialize() loads route config into simulation service
- [ ] Test: set-route-config action delegates player routes to simulation service
- [ ] Test: runNavigation resolves URL through simulation service and returns correct result
- [ ] Test: hull breach detected when route config has no matching path
- [ ] Test: redirect chain resolved through simulation service to final destination
- [ ] Test: all navigations correct triggers engine completion with scoring
- [ ] Test: engine.reset() resets simulation service state
- [ ] Uses real CorridorRunnerEngine and CorridorRunnerSimulationService with level 1 data


### T-2026-504
- Title: Create Corridor Runner visual state integration test for UI-to-engine signal binding
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P3
- Depends: T-2026-498, T-2026-499
- Blocked-by: —
- Tags: testing, integration, corridor-runner, visual-state, ui
- Refs: docs/minigames/05-corridor-runner.md, src/app/features/minigames/corridor-runner/

T-2026-492 covers P2 minigame UI-to-simulation visual state tests. No equivalent exists for P3 Corridor Runner. This test verifies the UI components correctly reflect engine state: config phase shows route editor, run phase shows map with crew animation, hull breach triggers decompression visual, and successful arrival shows door open animation.

Acceptance criteria:
- [ ] Integration test at `src/app/features/minigames/corridor-runner/visual-state.integration.spec.ts`
- [ ] Test: config phase -- route editor visible, map dimmed/hidden
- [ ] Test: set-route-config action updates map corridor glow state
- [ ] Test: run phase -- crew member position updates along corridor path
- [ ] Test: hull breach -- decompression animation state set on map
- [ ] Test: successful arrival -- door open animation state set on target module
- [ ] Each test: uses real engine + component fixture
- [ ] Each test: verifies DOM state reflects engine signal values after action

### T-2026-505
- Title: Create CorridorRunner URL bar component for run phase navigation display
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P3
- Depends: T-2026-082, T-2026-007
- Blocked-by: —
- Tags: ui, component, minigame, corridor-runner, url-bar
- Refs: docs/minigames/05-corridor-runner.md, docs/ux/visual-style.md

Corridor Runner spec describes a "URL bar at top mimics browser address bar" where "Shows current route; player can type paths directly." The spec also says "Run phase: Click destination on map, or type URL in address bar." No ticket creates this URL bar component. The main UI component (T-2026-083) has the run phase with SVG map but no address bar for direct URL typing.

Acceptance criteria:
- [ ] `CorridorRunnerUrlBarComponent` at `src/app/features/minigames/corridor-runner/url-bar/url-bar.ts`
- [ ] Renders a browser-like address bar at the top of the run phase
- [ ] Input: `currentUrl` (string) -- the URL being navigated to
- [ ] Input: `resolvedComponent` (string | null) -- the resolved destination (displayed as breadcrumb)
- [ ] Input: `isHullBreach` (boolean) -- shows "404 - Hull Breach" indicator
- [ ] Editable: player can type a URL and press Enter to trigger navigation
- [ ] Output: `urlSubmitted` event with typed URL string
- [ ] Styling: monospace font, dark background, forward/back placeholders, "nexus://" prefix
- [ ] Exported from corridor-runner barrel
- [ ] Unit tests for: URL display, hull breach indicator, editable input, submit on Enter key

### T-2026-506
- Title: Wire CorridorRunnerUrlBarComponent into CorridorRunnerComponent run phase
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P3
- Depends: T-2026-505, T-2026-083
- Blocked-by: —
- Tags: integration, ui, minigame, corridor-runner, url-bar
- Refs: docs/minigames/05-corridor-runner.md

T-2026-505 creates the URL bar component. This ticket wires it into CorridorRunnerComponent's run phase, connecting engine signals for current URL and resolved component, and routing the urlSubmitted output to the engine's runNavigation method.

Acceptance criteria:
- [ ] CorridorRunnerComponent renders CorridorRunnerUrlBarComponent above the map in the run phase
- [ ] `currentUrl` input bound to the URL of the current/last navigation
- [ ] `resolvedComponent` input bound to the navigation result's resolved component
- [ ] `isHullBreach` input bound to the last navigation result's hull breach flag
- [ ] `urlSubmitted` output triggers `engine.runNavigation(url)` and processes the result
- [ ] URL bar hidden during config phase
- [ ] Unit tests for: URL bar rendering in run phase, hidden in config phase, URL submission forwarding

### T-2026-507
- Title: Update architecture.md with P3 Corridor Runner patterns and conventions
- Status: todo
- Assigned: unassigned
- Priority: low
- Size: S
- Milestone: P3
- Depends: T-2026-497, T-2026-082
- Blocked-by: —
- Tags: documentation, architecture, conventions, corridor-runner
- Refs: docs/architecture.md, src/app/features/minigames/corridor-runner/

Architecture.md documents P1 technical decisions and patterns. P3 adds the Corridor Runner minigame which introduces new patterns: two-phase gameplay (config + run), inline route resolution engine with simulation service placeholder, BFS pathfinding for crew animation, and the URL bar navigation mechanic. These patterns should be documented for consistency with future minigames.

Acceptance criteria:
- [ ] architecture.md documents Corridor Runner's two-phase (config/run) gameplay pattern
- [ ] Documents the route resolution algorithm (path matching, redirect following, wildcard catching)
- [ ] Documents the BFS pathfinding approach for crew corridor animation
- [ ] Lists CorridorRunnerSimulationService in the simulation services table
- [ ] Updates the persistence table if any new localStorage keys are added
- [ ] Documents the URL bar navigation mechanic as a reusable pattern for future minigames

---

## P4 -- Forms Bundle




















---

## P5 -- Architecture Bundle




---

## P6 -- Signals Bundle
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

### T-2026-531
- Title: Wire Deep Space Radio, System Certification, and Blast Doors tutorial data into MinigameRegistryService config
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P7
- Depends: T-2026-199, T-2026-119, T-2026-121, T-2026-123
- Blocked-by: —
- Tags: integration, tutorial, minigame, deep-space-radio, system-certification, blast-doors, registry
- Refs: docs/minigames/10-deep-space-radio.md, docs/minigames/11-system-certification.md, docs/minigames/12-blast-doors.md, src/app/data/tutorials/minigame-tutorials.data.ts

T-2026-199 creates tutorial step data for all 3 P7 minigames. T-2026-119/121/123 register them in the MinigameRegistryService. Following the established pattern (P2: T-2026-382, P3: T-2026-500, P4: T-2026-514, P5: T-2026-519, P6: T-2026-526), this ticket wires the tutorial data into the registry config for all 3 P7 games. Without this, the MinigameTutorialOverlayComponent cannot display first-play instructions.

Acceptance criteria:
- [ ] Deep Space Radio `provideMinigame()` call updated to include tutorial steps from MinigameInstructionsData
- [ ] System Certification `provideMinigame()` call updated to include tutorial steps from MinigameInstructionsData
- [ ] Blast Doors `provideMinigame()` call updated to include tutorial steps from MinigameInstructionsData
- [ ] Tutorial steps accessible via `MinigameRegistryService.getConfig('deep-space-radio').tutorialSteps`
- [ ] Tutorial steps accessible via `MinigameRegistryService.getConfig('system-certification').tutorialSteps`
- [ ] Tutorial steps accessible via `MinigameRegistryService.getConfig('blast-doors').tutorialSteps`
- [ ] Unit tests for: tutorial data present in registry config for all 3 games, correct step counts

### T-2026-532
- Title: Create integration test for Deep Space Radio level data compatibility with engine
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P7
- Depends: T-2026-102, T-2026-103, T-2026-149
- Blocked-by: —
- Tags: testing, integration, deep-space-radio, level-data, engine
- Refs: docs/minigames/10-deep-space-radio.md, src/app/data/levels/deep-space-radio.data.ts

Following the established pattern (P3-P6 level data compatibility tests), this integration test verifies all 18 Deep Space Radio levels load into the engine without errors.

Acceptance criteria:
- [ ] Integration test at `src/app/features/minigames/deep-space-radio/level-data-compat.integration.spec.ts`
- [ ] Test: all 18 Deep Space Radio levels load into the engine via `initialize()` without errors
- [ ] Test: each level's `endpoints` array has at least 1 mock endpoint
- [ ] Test: each level's `testScenarios` has at least 1 test scenario
- [ ] Test: each level's `expectedResults` match scenario count
- [ ] Test: level 1 basic configuration produces expected transmission results when correct request is submitted
- [ ] Test: engine can be reset and loaded with a different level from the pack
- [ ] Uses real DeepSpaceRadioEngine with real level data constants

### T-2026-533
- Title: Create integration test for System Certification level data compatibility with engine
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P7
- Depends: T-2026-104, T-2026-105, T-2026-150
- Blocked-by: —
- Tags: testing, integration, system-certification, level-data, engine
- Refs: docs/minigames/11-system-certification.md, src/app/data/levels/system-certification.data.ts

Following the established pattern, this integration test verifies all 18 System Certification levels load into the engine without errors.

Acceptance criteria:
- [ ] Integration test at `src/app/features/minigames/system-certification/level-data-compat.integration.spec.ts`
- [ ] Test: all 18 System Certification levels load into the engine via `initialize()` without errors
- [ ] Test: each level's `sourceCode` is a non-empty string
- [ ] Test: each level's `coverageThreshold` is between 0 and 100
- [ ] Test: each level's `timeLimit` is a positive number
- [ ] Test: each level's `availableTestUtilities` is a non-empty array
- [ ] Test: level 1 basic configuration produces expected coverage results when correct tests are written
- [ ] Test: engine can be reset and loaded with a different level from the pack
- [ ] Uses real SystemCertificationEngine with real level data constants

### T-2026-534
- Title: Create integration test for Blast Doors level data compatibility with engine
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P7
- Depends: T-2026-106, T-2026-107, T-2026-151
- Blocked-by: —
- Tags: testing, integration, blast-doors, level-data, engine
- Refs: docs/minigames/12-blast-doors.md, src/app/data/levels/blast-doors.data.ts

Following the established pattern, this integration test verifies all 18 Blast Doors levels load into the engine without errors.

Acceptance criteria:
- [ ] Integration test at `src/app/features/minigames/blast-doors/level-data-compat.integration.spec.ts`
- [ ] Test: all 18 Blast Doors levels load into the engine via `initialize()` without errors
- [ ] Test: each level's `doors` array has at least 1 blast door
- [ ] Test: each level's `hooks` array has at least 1 lifecycle hook type
- [ ] Test: each level's `scenarios` has at least 1 door scenario
- [ ] Test: each level's `expectedBehavior` matches scenario count
- [ ] Test: level 1 basic configuration produces expected behavior results when correct hooks are assigned
- [ ] Test: engine can be reset and loaded with a different level from the pack
- [ ] Uses real BlastDoorsEngine with real level data constants

### T-2026-535
- Title: Create integration test for DeepSpaceRadioInterceptorService + DeepSpaceRadioEngine coordinated lifecycle
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P7
- Depends: T-2026-441, T-2026-103
- Blocked-by: —
- Tags: testing, integration, deep-space-radio, interceptor, engine
- Refs: docs/minigames/10-deep-space-radio.md, src/app/features/minigames/deep-space-radio/

After the engine is wired with DeepSpaceRadioInterceptorService, this integration test verifies the coordinated lifecycle: loading endpoints and interceptors, building requests, running through the interceptor chain, transmitting to mock backend, and evaluating responses. Follows the established pattern (P2-P6).

Acceptance criteria:
- [ ] Integration test at `src/app/features/minigames/deep-space-radio/interceptor-engine.integration.spec.ts`
- [ ] Test: engine.initialize() loads endpoints and interceptor toolbox into interceptor service
- [ ] Test: configure-request action builds HTTP request via interceptor service
- [ ] Test: place-interceptor action adds interceptor to chain in service
- [ ] Test: transmit action processes request through interceptor chain, mock backend, and response chain
- [ ] Test: all test scenarios passing triggers engine completion with scoring
- [ ] Test: misconfigured interceptor (wrong order) returns validation failure
- [ ] Test: engine.reset() resets interceptor service state
- [ ] Uses real DeepSpaceRadioEngine and DeepSpaceRadioInterceptorService with level 1 data

### T-2026-536
- Title: Create integration test for SystemCertificationTestRunnerService + SystemCertificationEngine coordinated lifecycle
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P7
- Depends: T-2026-443, T-2026-105
- Blocked-by: —
- Tags: testing, integration, system-certification, test-runner, engine
- Refs: docs/minigames/11-system-certification.md, src/app/features/minigames/system-certification/

After the engine is wired with SystemCertificationTestRunnerService, this integration test verifies the coordinated lifecycle: loading source code, writing tests, calculating coverage, and evaluating quality through the engine's action pipeline. Follows the established pattern (P2-P6).

Acceptance criteria:
- [ ] Integration test at `src/app/features/minigames/system-certification/testrunner-engine.integration.spec.ts`
- [ ] Test: engine.initialize() loads source code into test runner service
- [ ] Test: run-tests action executes player test code via test runner service and returns results
- [ ] Test: coverage calculation updates after each test run
- [ ] Test: coverage threshold met triggers engine completion with scoring
- [ ] Test: timer expiry without meeting threshold triggers engine failure
- [ ] Test: redundant tests penalized in quality score via test runner service
- [ ] Test: engine.reset() resets test runner service state
- [ ] Uses real SystemCertificationEngine and SystemCertificationTestRunnerService with level 1 data

### T-2026-537
- Title: Create integration test for BlastDoorsLifecycleService + BlastDoorsEngine coordinated lifecycle
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P7
- Depends: T-2026-444, T-2026-107
- Blocked-by: —
- Tags: testing, integration, blast-doors, lifecycle, engine
- Refs: docs/minigames/12-blast-doors.md, src/app/features/minigames/blast-doors/

After the engine is wired with BlastDoorsLifecycleService, this integration test verifies the coordinated lifecycle: loading doors, assigning behaviors to hook slots, running scenario simulations, and evaluating door states through the engine's action pipeline. Follows the established pattern (P2-P6).

Acceptance criteria:
- [ ] Integration test at `src/app/features/minigames/blast-doors/lifecycle-engine.integration.spec.ts`
- [ ] Test: engine.initialize() loads doors and hook slots into lifecycle service
- [ ] Test: assign-behavior action places behavior block in hook slot via lifecycle service
- [ ] Test: simulate action runs scenario through lifecycle service and checks door states
- [ ] Test: all scenarios correct triggers engine completion with scoring
- [ ] Test: wrong hook order detected by lifecycle service deducts lives
- [ ] Test: directive application modifies door behavior during simulation
- [ ] Test: engine.reset() resets lifecycle service state
- [ ] Uses real BlastDoorsEngine and BlastDoorsLifecycleService with level 1 data

### T-2026-538
- Title: Create P7 minigame visual state integration tests for Deep Space Radio, System Certification, and Blast Doors
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: M
- Milestone: P7
- Depends: T-2026-118, T-2026-120, T-2026-122, T-2026-463, T-2026-464, T-2026-445
- Blocked-by: —
- Tags: testing, integration, deep-space-radio, system-certification, blast-doors, visual-state, ui
- Refs: docs/minigames/10-deep-space-radio.md, docs/minigames/11-system-certification.md, docs/minigames/12-blast-doors.md

T-2026-492 through T-2026-529 cover P2-P6 visual state tests. No equivalent exists for P7. This test verifies the UI components correctly reflect engine state for all 3 P7 minigames.

Acceptance criteria:
- [ ] Integration test at `src/app/features/minigames/p7-visual-state.integration.spec.ts`
- [ ] Test: Deep Space Radio -- transmit action animates radio wave through interceptor pipeline, response viewer shows result
- [ ] Test: Deep Space Radio -- interceptor placement updates pipeline visualization with type icons
- [ ] Test: System Certification -- run-tests action updates test runner output with pass/fail indicators per test
- [ ] Test: System Certification -- coverage overlay shows green/red line gutters matching coverage result
- [ ] Test: Blast Doors -- assign-behavior action renders behavior block in timeline hook slot
- [ ] Test: Blast Doors -- simulate action animates door open/close sequences with hook fire indicators
- [ ] Each test: uses real engine + component fixture
- [ ] Each test: verifies DOM state reflects engine signal values after action

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


### T-2026-539
- Title: Add public elapsed session time API to PlayTimeService
- Status: todo
- Assigned: unassigned
- Priority: low
- Size: S
- Milestone: P2
- Depends: T-2026-050
- Blocked-by: —
- Tags: service, play-time, api
- Refs: src/app/core/progression/play-time.service.ts

PlayTimeService._sessionStartTime is private but ProfilePage needs elapsed session time. Add a public `elapsedSessionTime` computed signal that returns seconds since session start (or 0 when inactive).

Acceptance criteria:
- [ ] PlayTimeService exposes `elapsedSessionTime` as a public readonly computed signal
- [ ] Returns 0 when no session is active
- [ ] Returns elapsed seconds when session is active
- [ ] ProfilePage updated to display elapsed session time instead of Active/Inactive indicator
- [ ] Unit tests for: active session time, inactive returns 0
