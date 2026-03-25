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























---

## P3 -- Navigation Bundle







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


---

## P4 -- Forms Bundle




















---

## P5 -- Architecture Bundle




---

## P6 -- Signals Bundle













---

## P8 -- Polish & Replayability



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
