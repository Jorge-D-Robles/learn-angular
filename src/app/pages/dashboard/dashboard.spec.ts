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
import { MinigameRegistryService } from '../../core/minigame/minigame-registry.service';
import { DifficultyTier, type MinigameConfig, type MinigameId } from '../../core/minigame/minigame.types';
import { APP_ICONS } from '../../shared/icons';
import type { Rank } from '../../core/state/rank.constants';
import type { StoryMission } from '../../core/curriculum/curriculum.types';

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

interface SetupOptions {
  totalXp?: number;
  currentRank?: Rank;
  currentMission?: StoryMission | null;
  unlockedMinigames?: MinigameId[];
  todaysChallenge?: DailyChallenge;
  degradingTopics?: DegradingTopic[];
  mastery?: ReadonlyMap<MinigameId, number>;
  currentStreak?: number;
  streakMultiplier?: number;
}

async function setup(options: SetupOptions = {}) {
  const {
    totalXp = 750,
    currentRank = 'Ensign' as Rank,
    currentMission = TEST_MISSION,
    unlockedMinigames = ['module-assembly' as MinigameId, 'wire-protocol' as MinigameId],
    todaysChallenge = TEST_CHALLENGE,
    degradingTopics = [],
    mastery = new Map<MinigameId, number>(),
    currentStreak = 3,
    streakMultiplier = 1.3,
  } = options;

  const navigateFn = vi.fn();

  const result = await createComponent(DashboardPage, {
    providers: [
      ...ICON_PROVIDERS,
      getMockProvider(XpService, {
        totalXp: signal(totalXp),
        currentRank: signal(currentRank),
      }),
      getMockProvider(GameProgressionService, {
        currentMission: signal(currentMission),
        completedMissions: signal(new Set()),
        completedMissionCount: signal(currentMission === null ? 34 : 0),
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

  it('should show active mission prompt when mission exists', async () => {
    const { element } = await setup({ currentMission: TEST_MISSION });
    const missionCard = element.querySelector('nx-mission-card');
    expect(missionCard).toBeTruthy();
  });

  it('should show completion message when all missions complete', async () => {
    const { element } = await setup({ currentMission: null });
    const missionCard = element.querySelector('nx-mission-card');
    expect(missionCard).toBeFalsy();
    expect(element.textContent).toContain('Campaign Complete');
  });

  it('should show daily challenge with Accept Challenge button when not completed', async () => {
    const { element } = await setup({ todaysChallenge: TEST_CHALLENGE });
    expect(element.textContent).toContain('Daily Challenge');
    const acceptBtn = element.querySelector('.dashboard__challenge-accept');
    expect(acceptBtn).toBeTruthy();
    expect(acceptBtn?.textContent?.trim()).toBe('Accept Challenge');
  });

  it('should show completed state with checkmark and countdown when daily challenge is done', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-08T20:00:00'));
    const completedChallenge = { ...TEST_CHALLENGE, completed: true };
    const { element } = await setup({ todaysChallenge: completedChallenge });
    expect(element.textContent).toContain('Challenge Complete');
    const checkmark = element.querySelector('lucide-icon[name="circle-check"]');
    expect(checkmark).toBeTruthy();
    const countdown = element.querySelector('.dashboard__challenge-countdown');
    expect(countdown).toBeTruthy();
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

    const navigateFn = vi.fn();

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
        getMockProvider(Router, {
          navigate: navigateFn,
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
      unlockedMinigames: ['module-assembly' as MinigameId, 'wire-protocol' as MinigameId],
    });
    const shortcuts = element.querySelectorAll('.dashboard__shortcut-btn');
    expect(shortcuts.length).toBeGreaterThan(0);
  });

  it('should show empty state for quick-play when no games unlocked', async () => {
    const { element } = await setup({ unlockedMinigames: [] });
    const shortcuts = element.querySelectorAll('.dashboard__shortcut-btn');
    expect(shortcuts.length).toBe(0);
    expect(element.textContent).toContain('Start your first mission');
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

  it('should navigate to /mission/:chapterId when mission card is clicked', async () => {
    const { element, fixture, navigateFn } = await setup({ currentMission: TEST_MISSION });
    const missionCard = element.querySelector('nx-mission-card') as HTMLElement;
    expect(missionCard).toBeTruthy();
    missionCard.click();
    fixture.detectChanges();
    expect(navigateFn).toHaveBeenCalledWith(['/mission', 1]);
  });

  it('should show "Campaign Complete" with mission count when all missions done', async () => {
    const { element } = await setup({ currentMission: null });
    expect(element.textContent).toContain('Campaign Complete');
    expect(element.textContent).toContain('34/34');
  });

  it('should display "Active Mission" section header when mission exists', async () => {
    const { element } = await setup({ currentMission: TEST_MISSION });
    const missionSection = element.querySelector('.dashboard__mission');
    const header = missionSection?.querySelector('.dashboard__section-title');
    expect(header).toBeTruthy();
    expect(header?.textContent).toContain('Active Mission');
  });

  it('should display game topic in daily challenge card', async () => {
    const { element } = await setup({ todaysChallenge: TEST_CHALLENGE });
    const topic = element.querySelector('.dashboard__challenge-topic');
    expect(topic).toBeTruthy();
    expect(topic?.textContent?.trim()).toBe('Topic for module-assembly');
  });

  it('should display "+50 XP" bonus indicator', async () => {
    const { element } = await setup({ todaysChallenge: TEST_CHALLENGE });
    expect(element.textContent).toContain('+50 XP');
  });

  it('should navigate to /minigames/:gameId/daily when Accept Challenge clicked', async () => {
    const { element, fixture, navigateFn } = await setup({ todaysChallenge: TEST_CHALLENGE });
    const acceptBtn = element.querySelector('.dashboard__challenge-accept') as HTMLButtonElement;
    expect(acceptBtn).toBeTruthy();
    acceptBtn.click();
    fixture.detectChanges();
    expect(navigateFn).toHaveBeenCalledWith(['/minigames', 'module-assembly', 'daily']);
  });

  it('should show checkmark icon when challenge completed', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-08T20:00:00'));
    const completedChallenge = { ...TEST_CHALLENGE, completed: true };
    const { element } = await setup({ todaysChallenge: completedChallenge });
    const checkmark = element.querySelector('lucide-icon[name="circle-check"]');
    expect(checkmark).toBeTruthy();
  });

  it('should show countdown to next challenge when completed', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-08T20:00:00'));
    const completedChallenge = { ...TEST_CHALLENGE, completed: true };
    const { element } = await setup({ todaysChallenge: completedChallenge });
    const countdown = element.querySelector('.dashboard__challenge-countdown');
    expect(countdown).toBeTruthy();
    expect(countdown?.textContent?.trim()).toBe('4h 0m');
  });

  it('should update countdown every minute', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-08T20:00:00'));
    const completedChallenge = { ...TEST_CHALLENGE, completed: true };
    const { element, fixture } = await setup({ todaysChallenge: completedChallenge });
    const countdown = element.querySelector('.dashboard__challenge-countdown');
    expect(countdown?.textContent?.trim()).toBe('4h 0m');

    vi.advanceTimersByTime(60_000);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(countdown?.textContent?.trim()).toBe('3h 59m');
  });

  it('should show "New challenge available" at midnight', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-09T00:00:00'));
    const completedChallenge = { ...TEST_CHALLENGE, completed: true };
    const { element } = await setup({ todaysChallenge: completedChallenge });
    const countdown = element.querySelector('.dashboard__challenge-countdown');
    expect(countdown?.textContent?.trim()).toBe('New challenge available');
  });

  it('should hide countdown when challenge not completed', async () => {
    const { element } = await setup({ todaysChallenge: TEST_CHALLENGE });
    const countdown = element.querySelector('.dashboard__challenge-countdown');
    expect(countdown).toBeFalsy();
  });
});
