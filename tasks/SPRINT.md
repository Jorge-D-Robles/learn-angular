# Current Sprint

Sprint: S30-p2-wiring
Milestone: P2
Goal: Wire remaining P2 components, pages, and integration tests
Started: 2026-03-25

<!-- Velocity: (recorded at sprint close) -->

---

## Active


---

## Queue

- T-2026-552: Integrate MinigameEngine rendering into EndlessModePage for actual gameplay [L, high]
- T-2026-553: Integrate MinigameEngine rendering into SpeedRunPage for timed gameplay [L, high]
- T-2026-554: Integrate MinigameEngine rendering into DailyChallengePage for challenge gameplay [L, high]
- T-2026-541: Implement CosmeticGalleryComponent for cosmetic browsing and equipping [M, medium]
- T-2026-544: Create OnboardingOverlayComponent for first-time user guidance [M, medium]
- T-2026-555: Integrate MinigameEngine rendering into RefresherChallengePage [M, medium]
- T-2026-542: Wire CosmeticGalleryComponent into ProfilePage cosmetics section [S, medium, depends T-2026-541]
- T-2026-545: Wire OnboardingOverlayComponent into DashboardPage [S, medium, depends T-2026-544]
- T-2026-556: Create E2E smoke test for replay mode gameplay rendering [S, medium, depends T-2026-552,553,554]
- T-2026-546: Wire EmptyStateComponent into DashboardPage [S, low]
- T-2026-547: Wire LoadingSpinnerComponent into DashboardPage [S, low]
- T-2026-548: Wire QuickPlayService into DashboardPage [S, low]
- T-2026-549: Wire LeaderboardComponent into SpeedRunPage [S, low]
- T-2026-550: Fix SCSS budget warning for MinigameShell stylesheet [S, low]
- T-2026-551: Fix SCSS budget warning for FlowCommander stylesheet [S, low]
- T-2026-543: Wire CosmeticService unlocked themes into SettingsPage [S, low, depends T-2026-541]
- T-2026-557: Update architecture.md with P8 replay mode patterns [S, low, depends T-2026-552,553,554]

---

## Done This Sprint

- T-2026-339: Wire MinigameCardComponent into MinigameHubPage grid layout
- T-2026-340: Wire LevelCardComponent into LevelSelectPage level list
- T-2026-341: Wire StepProgressComponent into StoryMissionPage for step indicator
- T-2026-343: Wire MasteryTableComponent into ProfilePage mastery section
- T-2026-540: Commit untracked integration test files
