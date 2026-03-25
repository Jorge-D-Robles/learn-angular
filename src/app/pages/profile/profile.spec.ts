import { signal, WritableSignal } from '@angular/core';
import { Router } from '@angular/router';
import {
  LucideIconConfig,
  LucideIconProvider,
  LUCIDE_ICONS,
} from 'lucide-angular';
import { createComponent, getMockProvider } from '../../../testing/test-utils';
import { ProfilePage } from './profile';
import { LifetimeStatsService, type ProfileStats } from '../../core/progression/lifetime-stats.service';
import { MasteryService } from '../../core/progression/mastery.service';
import { MinigameRegistryService } from '../../core/minigame/minigame-registry.service';
import { SpacedRepetitionService, type DegradingTopic } from '../../core/progression/spaced-repetition.service';
import { AchievementService, type Achievement } from '../../core/progression/achievement.service';
import { APP_ICONS } from '../../shared/icons';
import type { MinigameConfig, MinigameId } from '../../core/minigame/minigame.types';
import { DifficultyTier } from '../../core/minigame/minigame.types';

const ICON_PROVIDERS = [
  {
    provide: LUCIDE_ICONS,
    multi: true,
    useValue: new LucideIconProvider(APP_ICONS),
  },
  {
    provide: LucideIconConfig,
    useValue: Object.assign(new LucideIconConfig(), {
      size: 24,
      color: 'currentColor',
    }),
  },
];

const MOCK_GAMES: MinigameConfig[] = [
  {
    id: 'blast-doors',
    name: 'Blast Doors',
    description: 'State machine programming',
    angularTopic: 'Lifecycle Hooks & Custom Directives',
    totalLevels: 18,
    difficultyTiers: [DifficultyTier.Basic],
  },
  {
    id: 'corridor-runner',
    name: 'Corridor Runner',
    description: 'Maze navigation',
    angularTopic: 'Routing',
    totalLevels: 18,
    difficultyTiers: [DifficultyTier.Basic],
  },
  {
    id: 'data-relay',
    name: 'Data Relay',
    description: 'Stream transformer',
    angularTopic: 'Pipes',
    totalLevels: 18,
    difficultyTiers: [DifficultyTier.Basic],
  },
  {
    id: 'deep-space-radio',
    name: 'Deep Space Radio',
    description: 'Message management',
    angularTopic: 'HTTP Client & Interceptors',
    totalLevels: 18,
    difficultyTiers: [DifficultyTier.Basic],
  },
  {
    id: 'flow-commander',
    name: 'Flow Commander',
    description: 'Traffic controller',
    angularTopic: 'Control Flow (@if, @for, @switch)',
    totalLevels: 18,
    difficultyTiers: [DifficultyTier.Basic],
  },
  {
    id: 'module-assembly',
    name: 'Module Assembly',
    description: 'Conveyor belt drag-and-drop',
    angularTopic: 'Components',
    totalLevels: 18,
    difficultyTiers: [DifficultyTier.Basic],
  },
  {
    id: 'power-grid',
    name: 'Power Grid',
    description: 'Circuit board puzzle',
    angularTopic: 'Services & Dependency Injection',
    totalLevels: 18,
    difficultyTiers: [DifficultyTier.Basic],
  },
  {
    id: 'reactor-core',
    name: 'Reactor Core',
    description: 'Reactive circuit design',
    angularTopic: 'Signals',
    totalLevels: 21,
    difficultyTiers: [DifficultyTier.Basic],
  },
  {
    id: 'signal-corps',
    name: 'Signal Corps',
    description: 'Tower defense',
    angularTopic: 'Input/Output Properties',
    totalLevels: 18,
    difficultyTiers: [DifficultyTier.Basic],
  },
  {
    id: 'system-certification',
    name: 'System Certification',
    description: 'Test writing challenge',
    angularTopic: 'Testing',
    totalLevels: 18,
    difficultyTiers: [DifficultyTier.Basic],
  },
  {
    id: 'terminal-hack',
    name: 'Terminal Hack',
    description: 'Timed form reconstruction',
    angularTopic: 'Forms (template-driven and reactive)',
    totalLevels: 21,
    difficultyTiers: [DifficultyTier.Basic],
  },
  {
    id: 'wire-protocol',
    name: 'Wire Protocol',
    description: 'Wiring puzzle',
    angularTopic: 'Data Binding (interpolation, property, event, two-way)',
    totalLevels: 18,
    difficultyTiers: [DifficultyTier.Basic],
  },
];

const DEFAULT_PROFILE_STATS: ProfileStats = {
  totalXp: 0,
  currentRank: 'Cadet',
  rankProgress: 0,
  topicMasteryMap: new Map(),
  missionsCompleted: 0,
  totalMissions: 34,
  totalPlayTime: 0,
  currentStreak: 0,
  streakMultiplier: 1.0,
  levelsCompleted: 0,
  perfectScores: 0,
};

async function setup(overrides: {
  profileStats?: Partial<ProfileStats>;
  getAllGames?: MinigameConfig[];
  getEffectiveMastery?: (id: MinigameId) => number;
  getMastery?: (id: MinigameId) => number;
  masteryMap?: ReadonlyMap<MinigameId, number>;
  lastPracticedMap?: ReadonlyMap<MinigameId, number>;
  degradingTopics?: DegradingTopic[];
} = {}) {
  const {
    profileStats: statsOverrides = {},
    getAllGames = MOCK_GAMES,
    getEffectiveMastery = () => 0,
    getMastery = () => 0,
    masteryMap = new Map(),
    lastPracticedMap = new Map(),
    degradingTopics = [],
  } = overrides;

  const mockProfileStats: WritableSignal<ProfileStats> = signal({
    ...DEFAULT_PROFILE_STATS,
    ...statsOverrides,
  });

  const mockMasterySignal = signal<ReadonlyMap<MinigameId, number>>(masteryMap);
  const mockLastPracticedSignal = signal<ReadonlyMap<MinigameId, number>>(lastPracticedMap);
  const navigateFn = vi.fn();

  const result = await createComponent(ProfilePage, {
    providers: [
      ...ICON_PROVIDERS,
      getMockProvider(LifetimeStatsService, {
        profileStats: mockProfileStats,
      }),
      getMockProvider(MasteryService, {
        mastery: mockMasterySignal,
        getMastery: vi.fn().mockImplementation(getMastery),
        getAllMastery: vi.fn().mockReturnValue(masteryMap),
      }),
      getMockProvider(MinigameRegistryService, {
        getAllGames: vi.fn().mockReturnValue(getAllGames),
        getConfig: vi.fn().mockImplementation(
          (id: string) => getAllGames.find((g) => g.id === id),
        ),
      }),
      getMockProvider(SpacedRepetitionService, {
        getEffectiveMastery: vi.fn().mockImplementation(getEffectiveMastery),
        lastPracticed: mockLastPracticedSignal,
        getDegradingTopics: vi.fn().mockReturnValue(degradingTopics),
      }),
      getMockProvider(AchievementService, {
        achievements: signal<readonly Achievement[]>([]),
        earnedCount: signal(0),
      }),
      getMockProvider(Router, {
        navigate: navigateFn,
      }),
    ],
  });

  return { ...result, mockProfileStats, navigateFn };
}

describe('ProfilePage', () => {
  // 1. Smoke test
  it('should create the component', async () => {
    const { component } = await setup();
    expect(component).toBeTruthy();
  });

  // 2. Display the current rank name from LifetimeStatsService
  it('should display current rank from LifetimeStatsService', async () => {
    const { element } = await setup({ profileStats: { currentRank: 'Commander' } });
    const rankName = element.querySelector('.profile__rank-name');
    expect(rankName?.textContent).toContain('Commander');
  });

  // 3. Display total XP from LifetimeStatsService
  it('should display total XP from LifetimeStatsService', async () => {
    const { element } = await setup({ profileStats: { totalXp: 3500 } });
    const totalXp = element.querySelector('.profile__total-xp');
    expect(totalXp?.textContent).toContain('3,500 XP');
  });

  // 4. Render XpProgressBarComponent in full variant
  it('should render XpProgressBarComponent in full variant', async () => {
    const { element } = await setup({ profileStats: { totalXp: 500 } });
    const progressBar = element.querySelector('nx-xp-progress-bar');
    expect(progressBar).toBeTruthy();
    expect(progressBar!.classList.contains('xp-progress-bar--full')).toBe(true);
  });

  // 5. Display streak counter with active streak
  it('should display streak counter with active streak', async () => {
    const { element } = await setup({
      profileStats: { currentStreak: 3, streakMultiplier: 1.3 },
    });
    const badge = element.querySelector('nx-streak-badge');
    expect(badge).toBeTruthy();
  });

  // 6. Hide streak badge when streak is 0
  it('should hide streak badge when currentStreak is 0', async () => {
    const { element } = await setup({ profileStats: { currentStreak: 0 } });
    const badge = element.querySelector('nx-streak-badge');
    expect(badge).toBeNull();
  });

  // 7. Display total play time
  it('should display total play time', async () => {
    const { element } = await setup({ profileStats: { totalPlayTime: 7200 } });
    const playTimeCard = element.querySelector('.profile__stat-card--play-time');
    expect(playTimeCard?.textContent).toContain('2h');
  });

  // 8. Display campaign progress
  it('should display campaign progress', async () => {
    const { element } = await setup({
      profileStats: { missionsCompleted: 10, totalMissions: 34 },
    });
    const campaignCard = element.querySelector('.profile__stat-card--campaign');
    expect(campaignCard?.textContent).toContain('10 / 34');
  });

  // 9. Render MasteryTableComponent in mastery section
  it('should render MasteryTableComponent in mastery section', async () => {
    const { element } = await setup();
    const table = element.querySelector('.profile__mastery-section nx-mastery-table');
    expect(table).toBeTruthy();
  });

  // 10. Populate masteryTableData with 12 topics from registry
  it('should populate masteryTableData with 12 topics from registry', async () => {
    const { component } = await setup();
    const data = component.masteryTableData();
    expect(data.length).toBe(12);
    expect(data[0].topicName).toBeTruthy();
  });

  // 11. Effective mastery values are passed through masteryTableData
  it('should pass effective mastery values through masteryTableData', async () => {
    const masteryMap = new Map<MinigameId, number>([['module-assembly', 4]]);
    const { component } = await setup({
      masteryMap,
      getMastery: (id: MinigameId) => (id === 'module-assembly' ? 4 : 0),
      getEffectiveMastery: (id: MinigameId) =>
        id === 'module-assembly' ? 3.7 : 0,
    });
    const data = component.masteryTableData();
    const moduleRow = data.find((r) => r.topicId === 'module-assembly');
    expect(moduleRow?.mastery).toBe(3);
  });

  // 12. Set degrading flag when effective mastery < raw mastery
  it('should set degrading flag when effective mastery < raw mastery', async () => {
    const masteryMap = new Map<MinigameId, number>([['module-assembly', 3]]);
    const { component } = await setup({
      masteryMap,
      getMastery: (id: MinigameId) => (id === 'module-assembly' ? 3 : 0),
      getEffectiveMastery: (id: MinigameId) =>
        id === 'module-assembly' ? 1 : 0,
    });
    const data = component.masteryTableData();
    const moduleRow = data.find((r) => r.topicId === 'module-assembly');
    expect(moduleRow?.degrading).toBe(true);
  });

  // 13. Set degrading flag to false when effective mastery equals raw mastery
  it('should set degrading flag to false when effective mastery equals raw mastery', async () => {
    const masteryMap = new Map<MinigameId, number>([['module-assembly', 3]]);
    const { component } = await setup({
      masteryMap,
      getMastery: (id: MinigameId) => (id === 'module-assembly' ? 3 : 0),
      getEffectiveMastery: (id: MinigameId) =>
        id === 'module-assembly' ? 3 : 0,
    });
    const data = component.masteryTableData();
    const moduleRow = data.find((r) => r.topicId === 'module-assembly');
    expect(moduleRow?.degrading).toBe(false);
  });

  // 14. Display page heading "Profile"
  it('should display page heading "Profile"', async () => {
    const { element } = await setup();
    const h1 = element.querySelector('h1');
    expect(h1?.textContent).toContain('Profile');
  });

  // 15. Display campaign progress percentage
  it('should display campaign progress percentage', async () => {
    const { element } = await setup({
      profileStats: { missionsCompleted: 10, totalMissions: 34 },
    });
    const campaignCard = element.querySelector('.profile__stat-card--campaign');
    expect(campaignCard?.textContent).toContain('29%');
  });

  // 16. Render achievement grid in achievements section
  it('should render nx-achievement-grid in the achievements section', async () => {
    const { element } = await setup();
    const section = element.querySelector('.profile__achievements-section');
    const grid = section?.querySelector('nx-achievement-grid');
    expect(grid).toBeTruthy();
  });

  // 17. Display "Achievements" heading in achievements section
  it('should display "Achievements" heading in the achievements section', async () => {
    const { element } = await setup();
    const heading = element.querySelector('.profile__achievements-section h2');
    expect(heading?.textContent).toContain('Achievements');
  });

  // --- New tests for T-2026-312 ---

  // 18. Display games played from LifetimeStatsService
  it('should display games played from LifetimeStatsService', async () => {
    const { element } = await setup({ profileStats: { levelsCompleted: 42 } });
    const gamesPlayedCard = element.querySelector('.profile__stat-card--games-played');
    expect(gamesPlayedCard).toBeTruthy();
    expect(gamesPlayedCard?.textContent).toContain('42');
  });

  // 19. Campaign progress section includes ProgressBarComponent
  it('should display campaign progress with percentage bar', async () => {
    const { element } = await setup({
      profileStats: { missionsCompleted: 10, totalMissions: 34 },
    });
    const campaignCard = element.querySelector('.profile__stat-card--campaign');
    expect(campaignCard?.textContent).toContain('10 / 34');
    const progressBar = campaignCard?.querySelector('nx-progress-bar');
    expect(progressBar).toBeTruthy();
  });

  // 20. Reactive update when profileStats changes
  it('should reactively update when profileStats changes', async () => {
    const { element, fixture, mockProfileStats } = await setup({
      profileStats: { totalXp: 0 },
    });
    const totalXpEl = element.querySelector('.profile__total-xp');
    expect(totalXpEl?.textContent).toContain('0 XP');

    mockProfileStats.set({ ...DEFAULT_PROFILE_STATS, totalXp: 500 });
    fixture.detectChanges();

    expect(totalXpEl?.textContent).toContain('500 XP');
  });

  // 21. Zero missions edge case -- campaignPercent shows 0%
  it('should show 0% when totalMissions is 0', async () => {
    const { element } = await setup({
      profileStats: { missionsCompleted: 0, totalMissions: 0 },
    });
    const campaignCard = element.querySelector('.profile__stat-card--campaign');
    expect(campaignCard?.textContent).toContain('0%');
  });

  // --- New tests for T-2026-343 ---

  // 22. Convert lastPracticed epoch to Date object
  it('should convert lastPracticed epoch to Date object', async () => {
    const epoch = 1711234567890;
    const lastPracticedMap = new Map<MinigameId, number>([['module-assembly', epoch]]);
    const { component } = await setup({ lastPracticedMap });
    const data = component.masteryTableData();
    const moduleRow = data.find((r) => r.topicId === 'module-assembly');
    expect(moduleRow?.lastPracticed).toBeInstanceOf(Date);
    expect(moduleRow?.lastPracticed?.getTime()).toBe(epoch);
  });

  // 23. Set lastPracticed to null when topic has no practice record
  it('should set lastPracticed to null when topic has no practice record', async () => {
    const { component } = await setup();
    const data = component.masteryTableData();
    const moduleRow = data.find((r) => r.topicId === 'module-assembly');
    expect(moduleRow?.lastPracticed).toBeNull();
  });

  // --- New tests for T-2026-221 ---

  // 24. Render degradation alert when topics are degrading
  it('should render degradation alert when topics are degrading', async () => {
    const degrading: DegradingTopic[] = [{
      topicId: 'module-assembly',
      rawMastery: 3,
      effectiveMastery: 2,
      degradation: 1,
      daysSinceLastPractice: 10,
      lastPracticed: Date.now() - 10 * 86_400_000,
    }];
    const { element } = await setup({ degradingTopics: degrading });
    const alert = element.querySelector('nx-degradation-alert');
    expect(alert).toBeTruthy();
    const practiceBtn = element.querySelector('.degradation-alert__practice-btn');
    expect(practiceBtn).toBeTruthy();
  });

  // 25. Navigate to /refresher/:topicId when practiceRequested fires
  it('should navigate to /refresher/:topicId when practiceRequested fires', async () => {
    const degrading: DegradingTopic[] = [{
      topicId: 'module-assembly',
      rawMastery: 3,
      effectiveMastery: 2,
      degradation: 1,
      daysSinceLastPractice: 10,
      lastPracticed: Date.now() - 10 * 86_400_000,
    }];
    const { element, fixture, navigateFn } = await setup({ degradingTopics: degrading });
    const practiceBtn = element.querySelector('.degradation-alert__practice-btn') as HTMLButtonElement;
    expect(practiceBtn).toBeTruthy();
    practiceBtn.click();
    fixture.detectChanges();
    expect(navigateFn).toHaveBeenCalledWith(['/refresher', 'module-assembly']);
  });
});
