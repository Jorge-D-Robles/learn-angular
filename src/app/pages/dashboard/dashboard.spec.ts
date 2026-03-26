import { signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  LucideIconConfig,
  LucideIconProvider,
  LUCIDE_ICONS,
} from 'lucide-angular';
import { vi } from 'vitest';
import { createComponent, getMockProvider } from '../../../testing/test-utils';
import { DashboardPage } from './dashboard';
import { XpService } from '../../core/progression/xp.service';
import { GameProgressionService } from '../../core/progression/game-progression.service';
import { DailyChallengeService, type DailyChallenge } from '../../core/progression/daily-challenge.service';
import { SpacedRepetitionService, type DegradingTopic } from '../../core/progression/spaced-repetition.service';
import { MasteryService } from '../../core/progression/mastery.service';
import { StreakService } from '../../core/progression/streak.service';
import { OnboardingService } from '../../core/progression/onboarding.service';
import { MinigameRegistryService } from '../../core/minigame/minigame-registry.service';
import { LevelProgressionService, type LevelProgress } from '../../core/levels/level-progression.service';
import { QuickPlayService } from '../../core/progression/quick-play.service';
import { DifficultyTier, type MinigameConfig, type MinigameId } from '../../core/minigame/minigame.types';
import { APP_ICONS } from '../../shared/icons';
import type { Rank } from '../../core/state/rank.constants';
import type { StoryMission } from '../../core/curriculum/curriculum.types';
import { ALL_STORY_MISSIONS } from '../../core/curriculum/curriculum.data';

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

const TEST_GAME_CONFIGS: MinigameConfig[] = [
  'module-assembly', 'wire-protocol', 'flow-commander', 'signal-corps',
  'corridor-runner', 'terminal-hack', 'power-grid', 'data-relay',
  'reactor-core', 'deep-space-radio', 'system-certification', 'blast-doors',
].map((id) => ({
  id: id as MinigameId,
  name: id.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' '),
  description: `Test ${id}`,
  angularTopic: `Topic for ${id}`,
  totalLevels: 18,
  difficultyTiers: [DifficultyTier.Basic, DifficultyTier.Intermediate, DifficultyTier.Advanced, DifficultyTier.Boss],
}));

const TEST_MISSION: StoryMission = {
  chapterId: 1,
  title: 'Station Boot Sequence',
  angularTopic: 'Components',
  narrative: 'The station core is offline.',
  unlocksMinigame: 'module-assembly',
  deps: [],
  phase: 1,
};

const TEST_CHALLENGE: DailyChallenge = {
  date: '2026-03-08',
  gameId: 'module-assembly',
  levelId: 'daily-module-assembly-2026-03-08',
  bonusXp: 50,
  completed: false,
};

function makeLevelProgress(overrides: Partial<LevelProgress> = {}): LevelProgress {
  return {
    levelId: 'test-level',
    completed: false,
    bestScore: 0,
    starRating: 0,
    perfect: false,
    attempts: 0,
    ...overrides,
  };
}

interface SetupOptions {
  totalXp?: number;
  currentRank?: Rank;
  currentMission?: StoryMission | null;
  completedMissionCount?: number;
  unlockedMinigames?: MinigameId[];
  recommendedGames?: MinigameId[];
  todaysChallenge?: DailyChallenge;
  degradingTopics?: DegradingTopic[];
  mastery?: ReadonlyMap<MinigameId, number>;
  currentStreak?: number;
  streakMultiplier?: number;
  levelProgress?: Map<MinigameId, readonly LevelProgress[]>;
  isOnboardingComplete?: boolean;
  detectChanges?: boolean;
}

async function setup(options: SetupOptions = {}) {
  const {
    totalXp = 750,
    currentRank = 'Ensign' as Rank,
    currentMission = TEST_MISSION,
    completedMissionCount,
    unlockedMinigames = ['module-assembly' as MinigameId, 'wire-protocol' as MinigameId],
    recommendedGames = ['module-assembly' as MinigameId, 'wire-protocol' as MinigameId],
    todaysChallenge = TEST_CHALLENGE,
    degradingTopics = [],
    mastery = new Map<MinigameId, number>(),
    currentStreak = 3,
    streakMultiplier = 1.3,
    levelProgress = new Map<MinigameId, readonly LevelProgress[]>(),
    isOnboardingComplete = true,
    detectChanges = true,
  } = options;

  // Default: when currentMission is null and completedMissionCount not explicitly set,
  // assume all missions complete (34). Otherwise, use explicit value or 0.
  const resolvedCompletedCount = completedMissionCount ?? (currentMission === null ? ALL_STORY_MISSIONS.length : 0);

  const navigateFn = vi.fn();

  const result = await createComponent(DashboardPage, {
    detectChanges,
    providers: [
      ...ICON_PROVIDERS,
      getMockProvider(XpService, {
        totalXp: signal(totalXp),
        currentRank: signal(currentRank),
      }),
      getMockProvider(GameProgressionService, {
        currentMission: signal(currentMission),
        completedMissions: signal(new Set()),
        completedMissionCount: signal(resolvedCompletedCount),
        getUnlockedMinigames: () => unlockedMinigames,
      }),
      getMockProvider(DailyChallengeService, {
        todaysChallenge: signal(todaysChallenge),
      }),
      getMockProvider(SpacedRepetitionService, {
        getDegradingTopics: () => degradingTopics,
      }),
      getMockProvider(MasteryService, {
        mastery: signal(mastery),
        getMastery: (id: MinigameId) => mastery.get(id) ?? 0,
      }),
      getMockProvider(MinigameRegistryService, {
        getAllGames: () => TEST_GAME_CONFIGS,
        getConfig: (id: string) => TEST_GAME_CONFIGS.find(c => c.id === id),
      }),
      getMockProvider(StreakService, {
        activeStreakDays: signal(currentStreak),
        streakMultiplier: signal(streakMultiplier),
      }),
      getMockProvider(LevelProgressionService, {
        getLevelProgress: (id: MinigameId) => levelProgress.get(id) ?? [],
      }),
      getMockProvider(QuickPlayService, {
        getRecommendedGames: () => recommendedGames,
      }),
      getMockProvider(OnboardingService, {
        isOnboardingComplete: signal(isOnboardingComplete),
        completeStep: vi.fn(),
      }),
      getMockProvider(Router, {
        navigate: navigateFn,
      }),
    ],
  });

  return { ...result, navigateFn };
}

describe('DashboardPage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should have isLoading true before ngOnInit runs', async () => {
    const { component } = await setup({ detectChanges: false });
    expect(component.isLoading()).toBe(true);
  });

  it('should not show loading spinner after initialization', async () => {
    const { element } = await setup();
    const spinner = element.querySelector('nx-loading-spinner');
    expect(spinner).toBeNull();
  });

  it('should render "Station Dashboard" heading', async () => {
    const { element } = await setup();
    const h1 = element.querySelector('h1');
    expect(h1?.textContent).toContain('Station Dashboard');
  });

  it('should render rank display', async () => {
    const { element } = await setup({ currentRank: 'Ensign' });
    expect(element.textContent).toContain('Ensign');
  });

  it('should render XP progress bar with full variant', async () => {
    const { element } = await setup();
    const bar = element.querySelector('nx-xp-progress-bar');
    expect(bar).toBeTruthy();
  });

  it('should show active mission card when mission exists', async () => {
    const { element } = await setup({ currentMission: TEST_MISSION });
    const missionCard = element.querySelector('nx-active-mission-card');
    expect(missionCard).toBeTruthy();
    expect(missionCard!.classList.contains('active-mission-card--active')).toBe(true);
  });

  it('should show completion state when all missions complete', async () => {
    const { element } = await setup({ currentMission: null });
    const missionCard = element.querySelector('nx-active-mission-card');
    expect(missionCard).toBeTruthy();
    expect(missionCard!.classList.contains('active-mission-card--complete')).toBe(true);
    expect(element.textContent).toContain('Campaign Complete');
  });

  it('should render nx-daily-challenge-card', async () => {
    const { element } = await setup({ todaysChallenge: TEST_CHALLENGE });
    const card = element.querySelector('nx-daily-challenge-card');
    expect(card).toBeTruthy();
  });

  it('should show daily challenge section title', async () => {
    const { element } = await setup({ todaysChallenge: TEST_CHALLENGE });
    const section = element.querySelector('.dashboard__challenge');
    const title = section?.querySelector('.dashboard__section-title');
    expect(title?.textContent).toContain('Daily Challenge');
  });

  it('should pass completion state to daily challenge card', async () => {
    const completedChallenge = { ...TEST_CHALLENGE, completed: true };
    const { element } = await setup({ todaysChallenge: completedChallenge });
    const card = element.querySelector('nx-daily-challenge-card');
    expect(card).toBeTruthy();
    expect(card?.textContent).toContain('Challenge Complete');
  });

  it('should render station visualization component', async () => {
    const { element } = await setup();
    const viz = element.querySelector('nx-station-visualization');
    expect(viz).toBeTruthy();
  });

  it('should pass mastery data to station visualization', async () => {
    const mastery = new Map<MinigameId, number>([
      ['module-assembly' as MinigameId, 3],
      ['wire-protocol' as MinigameId, 2],
    ]);
    const { element } = await setup({ mastery });
    const node = element.querySelector('[data-game-id="module-assembly"]');
    const masteryText = node?.querySelector('.station-viz__node-mastery');
    expect(masteryText?.textContent?.trim()).toContain('3');
  });

  it('should navigate to minigame when moduleClicked fires', async () => {
    const { element, fixture, navigateFn } = await setup();
    const node = element.querySelector('[data-game-id="module-assembly"]') as HTMLButtonElement;
    expect(node).toBeTruthy();
    node.click();
    fixture.detectChanges();
    expect(navigateFn).toHaveBeenCalledWith(['/minigames', 'module-assembly']);
  });

  it('should update visualization reactively when mastery changes', async () => {
    const masterySignal = signal(new Map<MinigameId, number>([
      ['module-assembly' as MinigameId, 1],
    ]) as ReadonlyMap<MinigameId, number>);

    const result = await createComponent(DashboardPage, {
      providers: [
        ...ICON_PROVIDERS,
        getMockProvider(XpService, {
          totalXp: signal(750),
          currentRank: signal('Ensign'),
        }),
        getMockProvider(GameProgressionService, {
          currentMission: signal(TEST_MISSION),
          completedMissions: signal(new Set()),
          completedMissionCount: signal(0),
          getUnlockedMinigames: () => ['module-assembly' as MinigameId],
        }),
        getMockProvider(QuickPlayService, {
          getRecommendedGames: () => ['module-assembly' as MinigameId],
        }),
        getMockProvider(DailyChallengeService, {
          todaysChallenge: signal(TEST_CHALLENGE),
        }),
        getMockProvider(SpacedRepetitionService, {
          getDegradingTopics: () => [],
        }),
        getMockProvider(MasteryService, {
          mastery: masterySignal,
          getMastery: (id: MinigameId) => masterySignal().get(id) ?? 0,
        }),
        getMockProvider(MinigameRegistryService, {
          getAllGames: () => TEST_GAME_CONFIGS,
          getConfig: (id: string) => TEST_GAME_CONFIGS.find(c => c.id === id),
        }),
        getMockProvider(StreakService, {
          activeStreakDays: signal(3),
          streakMultiplier: signal(1.3),
        }),
        getMockProvider(LevelProgressionService, {
          getLevelProgress: () => [],
        }),
        getMockProvider(OnboardingService, {
          isOnboardingComplete: signal(true),
          completeStep: vi.fn(),
        }),
        getMockProvider(Router, {
          navigate: vi.fn(),
        }),
      ],
    });

    const { element, fixture } = result;
    let node = element.querySelector('[data-game-id="module-assembly"]');
    let masteryText = node?.querySelector('.station-viz__node-mastery');
    expect(masteryText?.textContent?.trim()).toContain('1');

    // Update mastery signal
    masterySignal.set(new Map<MinigameId, number>([
      ['module-assembly' as MinigameId, 4],
    ]));
    fixture.detectChanges();
    await fixture.whenStable();

    node = element.querySelector('[data-game-id="module-assembly"]');
    masteryText = node?.querySelector('.station-viz__node-mastery');
    expect(masteryText?.textContent?.trim()).toContain('4');
  });

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
  });

  it('should show quick-play shortcuts when games are unlocked', async () => {
    const { element } = await setup({
      recommendedGames: ['module-assembly' as MinigameId, 'wire-protocol' as MinigameId],
    });
    const cards = element.querySelectorAll('nx-minigame-card');
    expect(cards.length).toBeGreaterThan(0);
  });

  it('should show empty state for quick-play when no games unlocked', async () => {
    const { element } = await setup({ recommendedGames: [], unlockedMinigames: [] });
    const cards = element.querySelectorAll('nx-minigame-card');
    expect(cards.length).toBe(0);
    expect(element.textContent).toContain('Start your first mission');
  });

  it('should render MinigameCardComponent for each quick-play game', async () => {
    const { element } = await setup({
      recommendedGames: ['module-assembly' as MinigameId, 'wire-protocol' as MinigameId],
    });
    const cards = element.querySelectorAll('.dashboard__shortcut-list nx-minigame-card');
    expect(cards.length).toBe(2);
  });

  it('should pass mastery stars to MinigameCardComponent', async () => {
    const mastery = new Map<MinigameId, number>([
      ['module-assembly' as MinigameId, 3],
    ]);
    const { element } = await setup({
      recommendedGames: ['module-assembly' as MinigameId],
      mastery,
    });
    const card = element.querySelector('.dashboard__shortcut-list nx-minigame-card');
    expect(card).toBeTruthy();
    // The mastery-stars component renders star icons based on the mastery input
    const starsContainer = card!.querySelector('nx-mastery-stars');
    expect(starsContainer).toBeTruthy();
    // Card also shows completion label
    expect(card!.textContent).toContain('Module Assembly');
  });

  it('should pass level completion count to MinigameCardComponent', async () => {
    const progress: LevelProgress[] = Array.from({ length: 18 }, (_, i) =>
      makeLevelProgress({
        levelId: `module-assembly-${i + 1}`,
        completed: i < 5,
      }),
    );
    const levelProgress = new Map<MinigameId, readonly LevelProgress[]>([
      ['module-assembly' as MinigameId, progress],
    ]);
    const { element } = await setup({
      recommendedGames: ['module-assembly' as MinigameId],
      levelProgress,
    });
    const card = element.querySelector('.dashboard__shortcut-list nx-minigame-card');
    expect(card).toBeTruthy();
    expect(card!.textContent).toContain('5/18 levels');
  });

  it('should limit quick-play cards to 4 maximum (service handles limit)', async () => {
    const { element } = await setup({
      recommendedGames: [
        'module-assembly' as MinigameId,
        'wire-protocol' as MinigameId,
        'flow-commander' as MinigameId,
        'signal-corps' as MinigameId,
      ],
    });
    const cards = element.querySelectorAll('.dashboard__shortcut-list nx-minigame-card');
    expect(cards.length).toBe(4);
  });

  it('should navigate to /minigames/:gameId when card is clicked', async () => {
    const { element, fixture, navigateFn } = await setup({
      recommendedGames: ['module-assembly' as MinigameId],
    });
    const card = element.querySelector('.dashboard__shortcut-list nx-minigame-card') as HTMLElement;
    expect(card).toBeTruthy();
    card.click();
    fixture.detectChanges();
    expect(navigateFn).toHaveBeenCalledWith(['/minigames', 'module-assembly']);
  });

  it('should not render any cards when no games are unlocked', async () => {
    const { element } = await setup({ recommendedGames: [] });
    const cards = element.querySelectorAll('.dashboard__shortcut-list nx-minigame-card');
    expect(cards.length).toBe(0);
  });

  it('should delegate game selection to QuickPlayService', async () => {
    const { element } = await setup({
      recommendedGames: ['flow-commander' as MinigameId, 'signal-corps' as MinigameId],
    });
    const cards = element.querySelectorAll('.dashboard__shortcut-list nx-minigame-card');
    expect(cards.length).toBe(2);
    expect(cards[0].textContent).toContain('Flow Commander');
    expect(cards[1].textContent).toContain('Signal Corps');
  });

  it('should render streak badge', async () => {
    const { element } = await setup({ currentStreak: 3 });
    const badge = element.querySelector('nx-streak-badge');
    expect(badge).toBeTruthy();
  });

  it('should navigate to refresher when practiceRequested fires', async () => {
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

  it('should hide degradation alert when no topics are degrading', async () => {
    const { element } = await setup({ degradingTopics: [] });
    const alert = element.querySelector('nx-degradation-alert') as HTMLElement;
    expect(alert).toBeTruthy();
    expect(alert.style.display).toBe('none');
  });

  it('should navigate to /mission/:chapterId when Continue button is clicked', async () => {
    const { element, fixture, navigateFn } = await setup({ currentMission: TEST_MISSION });
    const continueBtn = element.querySelector('.active-mission-card__action') as HTMLButtonElement;
    expect(continueBtn).toBeTruthy();
    continueBtn.click();
    fixture.detectChanges();
    expect(navigateFn).toHaveBeenCalledWith(['/mission', 1]);
  });

  it('should show "Campaign Complete" with total XP when all missions done', async () => {
    const { element } = await setup({ currentMission: null, totalXp: 2500 });
    expect(element.textContent).toContain('Campaign Complete');
    expect(element.textContent).toContain('2500');
  });

  it('should display "Active Mission" section header when mission exists', async () => {
    const { element } = await setup({ currentMission: TEST_MISSION });
    const missionSection = element.querySelector('.dashboard__mission');
    const header = missionSection?.querySelector('.dashboard__section-title');
    expect(header).toBeTruthy();
    expect(header?.textContent).toContain('Active Mission');
  });

  it('should pass game topic to daily challenge card', async () => {
    const { element } = await setup({ todaysChallenge: TEST_CHALLENGE });
    const card = element.querySelector('nx-daily-challenge-card');
    expect(card).toBeTruthy();
    const topic = card?.querySelector('.daily-challenge-card__topic');
    expect(topic?.textContent?.trim()).toBe('Topic for module-assembly');
  });

  it('should pass challenge data with bonus XP to daily challenge card', async () => {
    const { element } = await setup({ todaysChallenge: TEST_CHALLENGE });
    const card = element.querySelector('nx-daily-challenge-card');
    expect(card).toBeTruthy();
    expect(card?.textContent).toContain('+50 XP');
  });

  it('should navigate to /minigames/:gameId/daily when acceptChallenge fires', async () => {
    const { element, fixture, navigateFn } = await setup({ todaysChallenge: TEST_CHALLENGE });
    const acceptBtn = element.querySelector('.daily-challenge-card__accept-button') as HTMLButtonElement;
    expect(acceptBtn).toBeTruthy();
    acceptBtn.click();
    fixture.detectChanges();
    expect(navigateFn).toHaveBeenCalledWith(['/minigames', 'module-assembly', 'daily']);
  });

  it('should pass game name to daily challenge card', async () => {
    const { element } = await setup({ todaysChallenge: TEST_CHALLENGE });
    const card = element.querySelector('nx-daily-challenge-card');
    expect(card).toBeTruthy();
    const gameName = card?.querySelector('.daily-challenge-card__game-name');
    expect(gameName?.textContent).toContain('Module Assembly');
  });

  it('should pass streak days to daily challenge card', async () => {
    const { element } = await setup({ todaysChallenge: TEST_CHALLENGE, currentStreak: 5 });
    const card = element.querySelector('nx-daily-challenge-card');
    expect(card).toBeTruthy();
    const streak = card?.querySelector('.daily-challenge-card__streak-count');
    expect(streak?.textContent?.trim()).toBe('5');
  });

  it('should bind isAllComplete to true when completedMissionCount equals total missions', async () => {
    const { element } = await setup({
      currentMission: null,
      completedMissionCount: ALL_STORY_MISSIONS.length,
    });
    const card = element.querySelector('nx-active-mission-card');
    expect(card).toBeTruthy();
    expect(card!.classList.contains('active-mission-card--complete')).toBe(true);
  });

  it('should bind totalXp to ActiveMissionCardComponent when all complete', async () => {
    const { element } = await setup({
      currentMission: null,
      completedMissionCount: ALL_STORY_MISSIONS.length,
      totalXp: 2500,
    });
    const card = element.querySelector('nx-active-mission-card');
    expect(card).toBeTruthy();
    expect(card!.textContent).toContain('2500');
  });

  it('should navigate to /mission/1 when continueClicked emits from empty state', async () => {
    const { element, fixture, navigateFn } = await setup({
      currentMission: null,
      completedMissionCount: 0,
    });
    const startBtn = element.querySelector('.active-mission-card__action') as HTMLButtonElement;
    expect(startBtn).toBeTruthy();
    expect(startBtn.textContent!.trim()).toBe('Start Mission 1');
    startBtn.click();
    fixture.detectChanges();
    expect(navigateFn).toHaveBeenCalledWith(['/mission', 1]);
  });

  it('should render ActiveMissionCardComponent (not MissionCardComponent) in mission section', async () => {
    const { element } = await setup();
    const missionSection = element.querySelector('.dashboard__mission');
    expect(missionSection!.querySelector('nx-active-mission-card')).toBeTruthy();
    expect(missionSection!.querySelector('nx-mission-card')).toBeNull();
  });

  it('should not render onboarding overlay when onboarding is complete', async () => {
    const { element } = await setup();
    const overlay = element.querySelector('nx-onboarding-overlay');
    expect(overlay).toBeNull();
  });

  it('should render onboarding overlay when onboarding is not complete', async () => {
    const { element } = await setup({ isOnboardingComplete: false });
    const overlay = element.querySelector('nx-onboarding-overlay');
    expect(overlay).toBeTruthy();
  });

  it('should hide onboarding overlay after dismissed event', async () => {
    const { element, component, fixture } = await setup({ isOnboardingComplete: false });
    expect(element.querySelector('nx-onboarding-overlay')).toBeTruthy();
    component.onOnboardingDismissed();
    fixture.detectChanges();
    expect(element.querySelector('nx-onboarding-overlay')).toBeNull();
  });

  describe('empty state (zero progress)', () => {
    it('should render empty state when XP is 0 and no missions completed', async () => {
      const { element } = await setup({
        totalXp: 0,
        completedMissionCount: 0,
        currentMission: TEST_MISSION,
        unlockedMinigames: [],
        recommendedGames: [],
      });
      const emptyState = element.querySelector('nx-empty-state');
      expect(emptyState).toBeTruthy();
      expect(emptyState!.textContent).toContain('Welcome to Nexus Station');
      const ctaButton = element.querySelector('nx-empty-state .dashboard__cta-button');
      expect(ctaButton).toBeTruthy();
    });

    it('should NOT render empty state when player has progress', async () => {
      const { element } = await setup({
        totalXp: 750,
        completedMissionCount: 3,
      });
      const emptyState = element.querySelector('nx-empty-state');
      expect(emptyState).toBeNull();
      expect(element.querySelector('.dashboard__cards')).toBeTruthy();
      expect(element.querySelector('.dashboard__shortcuts')).toBeTruthy();
    });

    it('should navigate to first mission when CTA button is clicked', async () => {
      const { element, fixture, navigateFn } = await setup({
        totalXp: 0,
        completedMissionCount: 0,
        currentMission: TEST_MISSION,
        unlockedMinigames: [],
        recommendedGames: [],
      });
      const ctaButton = element.querySelector('nx-empty-state .dashboard__cta-button') as HTMLButtonElement;
      expect(ctaButton).toBeTruthy();
      ctaButton.click();
      fixture.detectChanges();
      expect(navigateFn).toHaveBeenCalledWith(['/mission', 1]);
    });
  });
});
