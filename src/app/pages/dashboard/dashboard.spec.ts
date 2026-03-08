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
    expect(element.textContent).toContain('All Missions Complete');
  });

  it('should show daily challenge when not completed', async () => {
    const { element } = await setup({ todaysChallenge: TEST_CHALLENGE });
    expect(element.textContent).toContain('Daily Challenge');
    const playBtn = element.querySelector('.dashboard__challenge-play');
    expect(playBtn).toBeTruthy();
  });

  it('should show completed text when daily challenge is done', async () => {
    const completedChallenge = { ...TEST_CHALLENGE, completed: true };
    const { element } = await setup({ todaysChallenge: completedChallenge });
    expect(element.textContent).toContain('Completed');
  });

  it('should render station module grid with 12 mastery-stars', async () => {
    const { element } = await setup();
    const stars = element.querySelectorAll('nx-mastery-stars');
    expect(stars.length).toBe(12);
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

  it('should navigate to minigame when practiceRequested fires', async () => {
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
    expect(navigateFn).toHaveBeenCalledWith(['/minigames', 'module-assembly']);
  });
});
