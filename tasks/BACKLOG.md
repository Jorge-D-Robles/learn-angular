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

## P2 -- Foundations Bundle

---

## P3 -- Navigation Bundle

---

## P4 -- Forms Bundle

---

## P5 -- Architecture Bundle

---

## P6 -- Signals Bundle

---

## P7 -- Advanced Bundle

---

## P8 -- Polish & Replayability

### T-2026-541
- Title: Implement CosmeticGalleryComponent for cosmetic browsing and equipping
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: M
- Milestone: P8
- Depends: —
- Blocked-by: —
- Tags: ui, cosmetics, component, profile
- Refs: docs/progression.md, src/app/shared/components/cosmetic-gallery/cosmetic-gallery.ts, src/app/core/progression/cosmetic.service.ts, src/app/data/cosmetics.data.ts

The CosmeticGalleryComponent file exists but is empty (0 bytes). It needs a real implementation that displays unlocked and locked cosmetic items (station skins, themes, badges), allows equipping unlocked items, and shows unlock conditions for locked items. CosmeticService and COSMETIC_DEFINITIONS data already exist.

Acceptance criteria:
- [ ] Component displays all cosmetic items from CosmeticService.getAllCosmetics()
- [ ] Items are visually separated by type (skin, theme, badge)
- [ ] Unlocked items show an "Equip" button; equipped items show "Equipped" indicator
- [ ] Locked items display their unlock condition text
- [ ] Uses `nx-` selector prefix (shared component convention)
- [ ] Accessible: keyboard navigable, ARIA labels on interactive elements
- [ ] Exported from shared/components barrel
- [ ] Unit tests cover: rendering all types, equip action, locked state display
- [ ] Component file is non-empty and compiles successfully

### T-2026-542
- Title: Wire CosmeticGalleryComponent into ProfilePage cosmetics section
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P8
- Depends: T-2026-541
- Blocked-by: —
- Tags: wiring, profile, cosmetics
- Refs: src/app/pages/profile/profile.ts, docs/ux/navigation.md

ProfilePage currently has no cosmetics section. Wire CosmeticGalleryComponent into the profile page as a dedicated section below the achievements grid.

Acceptance criteria:
- [ ] ProfilePage imports and renders CosmeticGalleryComponent
- [ ] Section has a heading ("Cosmetics" or "Station Customization")
- [ ] CosmeticGalleryComponent receives data from CosmeticService
- [ ] At least 2 unit tests verify component presence and data binding

### T-2026-543
- Title: Wire CosmeticService unlocked themes into SettingsPage theme selector
- Status: todo
- Assigned: unassigned
- Priority: low
- Size: S
- Milestone: P8
- Depends: T-2026-541
- Blocked-by: —
- Tags: wiring, settings, cosmetics, themes
- Refs: src/app/pages/settings/settings.ts, src/app/core/progression/cosmetic.service.ts

SettingsPage has a hardcoded theme selector (dark/station/light). CosmeticService can unlock additional themes. Wire the theme selector to show only themes the player has unlocked, plus the default themes.

Acceptance criteria:
- [ ] SettingsPage injects CosmeticService
- [ ] Theme dropdown options are dynamically generated from unlocked themes
- [ ] Default themes (dark, station, light) are always available
- [ ] Locked theme cosmetics are not shown in the dropdown
- [ ] At least 2 unit tests verify dynamic theme list rendering

### T-2026-544
- Title: Create OnboardingOverlayComponent for first-time user guidance
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: M
- Milestone: P8
- Depends: —
- Blocked-by: —
- Tags: ui, onboarding, component, first-time-user
- Refs: src/app/core/progression/onboarding.service.ts, docs/research/gamification-patterns.md

OnboardingService exists with step tracking and persistence but the OnboardingOverlayComponent (the visual UI that shows first-time users where things are and what to do) does not exist. Create a multi-step overlay component that highlights key UI areas and explains the core game loop.

Acceptance criteria:
- [ ] Component created at `src/app/shared/components/onboarding-overlay/`
- [ ] Multi-step guided tour with step counter (e.g., "Step 2 of 5")
- [ ] Each step highlights a different area of the dashboard (missions, minigames, profile)
- [ ] Steps describe the core game loop: Story Mission -> Minigame -> Mastery
- [ ] "Next", "Skip", and "Done" navigation buttons
- [ ] Uses OnboardingService to track completion and prevent re-showing
- [ ] Uses `nx-` selector prefix
- [ ] Accessible: focus trap, ARIA live region for step announcements
- [ ] Exported from shared/components barrel
- [ ] Unit tests cover: step navigation, skip, completion persistence, rendering

### T-2026-545
- Title: Wire OnboardingOverlayComponent into DashboardPage for first-time users
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P8
- Depends: T-2026-544
- Blocked-by: —
- Tags: wiring, dashboard, onboarding
- Refs: src/app/pages/dashboard/dashboard.ts

Wire the OnboardingOverlayComponent into DashboardPage so it shows automatically for first-time users (when OnboardingService.isComplete is false). After completion or skip, the overlay does not re-appear.

Acceptance criteria:
- [ ] DashboardPage imports and conditionally renders OnboardingOverlayComponent
- [ ] Overlay only shows when OnboardingService reports onboarding is not complete
- [ ] After completion/skip, overlay does not render
- [ ] At least 2 unit tests verify conditional rendering

### T-2026-546
- Title: Wire EmptyStateComponent into DashboardPage for zero-progress first-time user state
- Status: todo
- Assigned: unassigned
- Priority: low
- Size: S
- Milestone: P8
- Depends: —
- Blocked-by: —
- Tags: wiring, dashboard, empty-state, ui
- Refs: src/app/pages/dashboard/dashboard.ts, src/app/shared/components/empty-state/empty-state.ts

DashboardPage does not show an EmptyStateComponent when the player has zero progress (no missions completed, no XP). The design pattern calls for progressive disclosure with clear empty states rather than showing an empty/misleading dashboard.

Acceptance criteria:
- [ ] DashboardPage imports EmptyStateComponent
- [ ] When no missions are completed and XP is 0, an empty state is rendered with a message like "Welcome to Nexus Station! Start your first mission to begin."
- [ ] Empty state includes a call-to-action button to navigate to the first mission
- [ ] When the player has some progress, normal dashboard sections render instead
- [ ] At least 2 unit tests verify empty state conditional rendering

### T-2026-547
- Title: Wire LoadingSpinnerComponent into DashboardPage during initial data loading
- Status: todo
- Assigned: unassigned
- Priority: low
- Size: S
- Milestone: P8
- Depends: —
- Blocked-by: —
- Tags: wiring, dashboard, loading, ui
- Refs: src/app/pages/dashboard/dashboard.ts, src/app/shared/components/loading-spinner/loading-spinner.ts

DashboardPage does not show a loading spinner during initial service data loading. While services load synchronously from localStorage in most cases, a brief loading state provides a polished UX and prevents layout shift.

Acceptance criteria:
- [ ] DashboardPage imports LoadingSpinnerComponent
- [ ] A loading state signal controls spinner visibility
- [ ] Spinner shown before dashboard data is ready, replaced by content when loaded
- [ ] At least 1 unit test verifies spinner rendering during loading state

### T-2026-548
- Title: Wire QuickPlayService into DashboardPage for recommended minigame shortcuts
- Status: todo
- Assigned: unassigned
- Priority: low
- Size: S
- Milestone: P8
- Depends: —
- Blocked-by: —
- Tags: wiring, dashboard, quick-play
- Refs: src/app/pages/dashboard/dashboard.ts, src/app/core/progression/quick-play.service.ts

DashboardPage has a quick-play shortcuts section but it uses inline logic to select games rather than the QuickPlayService (which exists with proper recommendation algorithm, 60 LOC). Wire QuickPlayService to replace the ad-hoc game selection.

Acceptance criteria:
- [ ] DashboardPage injects QuickPlayService
- [ ] Quick-play game cards use QuickPlayService.getRecommendedGames() instead of inline selection
- [ ] Existing quick-play UI renders correctly with the service data
- [ ] At least 1 unit test verifies QuickPlayService integration

### T-2026-549
- Title: Wire LeaderboardComponent into SpeedRunPage for post-run leaderboard display
- Status: todo
- Assigned: unassigned
- Priority: low
- Size: S
- Milestone: P8
- Depends: —
- Blocked-by: —
- Tags: wiring, speed-run, leaderboard, replay
- Refs: src/app/pages/speed-run/speed-run.ts, src/app/shared/components/leaderboard/leaderboard.ts

SpeedRunPage has a post-run view state but does not display the leaderboard. Wire LeaderboardComponent into the post-run view to show the player's ranking among their previous runs.

Acceptance criteria:
- [ ] SpeedRunPage imports LeaderboardComponent
- [ ] LeaderboardComponent is rendered in the `post-run` view state
- [ ] Leaderboard displays SpeedRun mode entries for the current game
- [ ] At least 2 unit tests verify leaderboard rendering in post-run state

### T-2026-550
- Title: Fix SCSS budget warning for MinigameShell stylesheet
- Status: todo
- Assigned: unassigned
- Priority: low
- Size: S
- Milestone: P8
- Depends: —
- Blocked-by: —
- Tags: css, budget, performance, polish
- Refs: src/app/core/minigame/minigame-shell/minigame-shell.scss, angular.json

MinigameShell SCSS file exceeds the 4kB component style budget by 66 bytes. Refactor to reduce size by removing duplicated declarations, using CSS shorthand, or extracting shared styles to a mixin.

Acceptance criteria:
- [ ] `minigame-shell.scss` is under 4.00 kB after compilation
- [ ] No visual regressions (existing tests pass)
- [ ] Build produces no SCSS budget warnings for this file

### T-2026-551
- Title: Fix SCSS budget warning for FlowCommander stylesheet
- Status: todo
- Assigned: unassigned
- Priority: low
- Size: S
- Milestone: P8
- Depends: —
- Blocked-by: —
- Tags: css, budget, performance, polish
- Refs: src/app/features/minigames/flow-commander/flow-commander.component.scss, angular.json

FlowCommander SCSS file exceeds the 4kB component style budget by 190 bytes. Refactor to reduce size by removing duplicated declarations, using CSS shorthand, or extracting shared styles.

Acceptance criteria:
- [ ] `flow-commander.component.scss` is under 4.00 kB after compilation
- [ ] No visual regressions (existing tests pass)
- [ ] Build produces no SCSS budget warnings for this file

### T-2026-552
- Title: Integrate MinigameEngine rendering into EndlessModePage for actual gameplay
- Status: in-progress
- Assigned: claude
- Started: 2026-03-25
- Priority: high
- Size: L
- Milestone: P8
- Depends: —
- Blocked-by: —
- Tags: replay, endless-mode, engine, gameplay, integration
- Refs: src/app/pages/endless-mode/endless-mode.ts, src/app/core/minigame/endless-mode.service.ts, src/app/pages/minigame-play/minigame-play.ts, docs/progression.md

EndlessModePage has UI shells for pre-game/in-game/post-game states and tracks high scores, but the `in-game` state does not actually render a MinigameEngine or its UI component. Players cannot play actual minigame rounds in endless mode. The page needs to instantiate the correct engine via MinigameRegistryService, render the game-specific UI component via NgComponentOutlet, and feed procedurally generated levels from EndlessModeService.

This is the highest-priority P8 gap because replay modes are a core replayability feature described in every minigame spec and in docs/progression.md under "Replayability."

Acceptance criteria:
- [ ] EndlessModePage resolves the game engine factory from MinigameRegistryService
- [ ] During `in-game` state, the minigame UI component is rendered via NgComponentOutlet
- [ ] Engine is initialized with procedurally generated level data from EndlessModeService
- [ ] On level completion, next procedural level loads automatically
- [ ] On failure (lives exhausted), session ends and transitions to post-game state
- [ ] Score accumulates across rounds via EndlessModeService
- [ ] High score is persisted on session end
- [ ] MinigameShell HUD displays score, lives, and round number
- [ ] At least 5 unit tests covering engine instantiation, round progression, and session end

### T-2026-553
- Title: Integrate MinigameEngine rendering into SpeedRunPage for timed gameplay
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: L
- Milestone: P8
- Depends: —
- Blocked-by: —
- Tags: replay, speed-run, engine, gameplay, integration
- Refs: src/app/pages/speed-run/speed-run.ts, src/app/core/minigame/speed-run.service.ts, docs/progression.md

SpeedRunPage has timer UI, split times, and par comparison, but the `in-run` state does not actually render a MinigameEngine or its UI component. Players cannot play actual minigame levels during a speed run. The page needs to instantiate the engine, render levels sequentially from a fixed set, record split times, and transition to post-run on completion.

Acceptance criteria:
- [ ] SpeedRunPage resolves the game engine factory from MinigameRegistryService
- [ ] During `in-run` state, the minigame UI component is rendered via NgComponentOutlet
- [ ] Engine is initialized with the first level from the speed run set
- [ ] On level completion, split time is recorded and next level loads automatically
- [ ] On all levels completed, session ends and transitions to post-run state
- [ ] Timer continues running across levels (RAF-based, already implemented)
- [ ] Best time is persisted on run completion via SpeedRunService
- [ ] At least 5 unit tests covering engine instantiation, split recording, and run completion

### T-2026-554
- Title: Integrate MinigameEngine rendering into DailyChallengePage for challenge gameplay
- Status: todo
- Assigned: unassigned
- Priority: high
- Size: L
- Milestone: P8
- Depends: —
- Blocked-by: —
- Tags: replay, daily-challenge, engine, gameplay, integration
- Refs: src/app/pages/daily-challenge/daily-challenge.ts, src/app/core/progression/daily-challenge.service.ts, docs/progression.md

DailyChallengePage shows pending/completed states and countdown timer, but does not actually render a MinigameEngine or its UI component for the daily challenge. Players cannot play the daily challenge level. The page needs to instantiate the engine for the daily challenge's minigame, render the level, and complete the challenge on success.

Acceptance criteria:
- [ ] DailyChallengePage resolves the game engine factory from MinigameRegistryService
- [ ] When player accepts the challenge, the minigame UI component is rendered via NgComponentOutlet
- [ ] Engine is initialized with the daily challenge level data from DailyChallengeService
- [ ] On level completion, DailyChallengeService.completeChallenge() is called
- [ ] Challenge completion awards bonus XP and contributes to streak
- [ ] After completion, challenge shows completed state with results
- [ ] At least 5 unit tests covering engine instantiation, challenge completion, and state transitions

### T-2026-555
- Title: Integrate MinigameEngine rendering into RefresherChallengePage for mastery restoration gameplay
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: M
- Milestone: P8
- Depends: —
- Blocked-by: —
- Tags: replay, refresher, engine, gameplay, spaced-repetition
- Refs: src/app/pages/refresher/refresher.ts, src/app/core/progression/refresher-challenge.service.ts, docs/progression.md

RefresherChallengePage shows a micro-level checklist and mastery before/after stars, but the `playing` state does not actually render a MinigameEngine for the refresher challenge micro-levels. Players need to play quick minigame rounds to restore degraded mastery.

Acceptance criteria:
- [ ] RefresherChallengePage resolves the game engine factory from MinigameRegistryService
- [ ] During `playing` state, the minigame UI component is rendered via NgComponentOutlet
- [ ] Engine is initialized with micro-level data from RefresherChallengeService
- [ ] On level completion, RefresherChallengeService.recordPractice() is called to restore mastery
- [ ] Mastery stars update visually after practice
- [ ] At least 3 unit tests covering engine instantiation and mastery restoration

### T-2026-556
- Title: Create E2E smoke test for replay mode gameplay rendering
- Status: todo
- Assigned: unassigned
- Priority: medium
- Size: S
- Milestone: P8
- Depends: T-2026-552, T-2026-553, T-2026-554
- Blocked-by: —
- Tags: e2e, testing, replay, smoke-test
- Refs: e2e/replay-modes.spec.ts

After engine rendering is integrated into replay mode pages, add E2E smoke tests verifying that minigame UI components actually render during gameplay (not just state management UI).

Acceptance criteria:
- [ ] E2E test navigates to endless mode for a valid minigame and verifies game UI renders
- [ ] E2E test navigates to speed run for a valid minigame and verifies game UI renders
- [ ] E2E test navigates to daily challenge and verifies game UI renders after accepting
- [ ] Tests pass in CI

### T-2026-557
- Title: Update architecture.md with P8 replay mode engine integration patterns
- Status: todo
- Assigned: unassigned
- Priority: low
- Size: S
- Milestone: P8
- Depends: T-2026-552, T-2026-553, T-2026-554
- Blocked-by: —
- Tags: docs, architecture
- Refs: docs/architecture.md

After replay mode engine integration is complete, document the pattern for how replay mode pages instantiate engines, manage level cycling, and differ from the primary MinigamePlayPage.

Acceptance criteria:
- [ ] architecture.md has a new section on replay mode engine integration
- [ ] Documents the shared pattern across EndlessModePage, SpeedRunPage, DailyChallengePage
- [ ] Explains level cycling, session management, and scoring differences
