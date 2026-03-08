import { TestBed } from '@angular/core/testing';
import {
  DifficultyTier,
  type MinigameId,
  type MinigameResult,
  LevelCompletionService,
} from '../minigame';
import { LevelProgressionService, type LevelDefinition } from '../levels';
import { LevelLoaderService } from '../levels/level-loader.service';
import {
  XpService,
  MasteryService,
  StreakService,
  SpacedRepetitionService,
  RefresherChallengeService,
} from '../progression';
import { StreakRewardService } from '../progression/streak-reward.service';
import { GameStateService } from '../state';
import { XpNotificationService } from '../notifications';
import { StatePersistenceService } from '../persistence';

// --- Test helpers ---

const MS_PER_DAY = 86_400_000;
const TEST_GAME_ID: MinigameId = 'module-assembly';

const testLevels: LevelDefinition<unknown>[] = [
  { levelId: 'ma-basic-01', gameId: TEST_GAME_ID, tier: DifficultyTier.Basic, order: 1, title: 'L1', conceptIntroduced: 'c1', description: 'd1', data: {} },
  { levelId: 'ma-basic-02', gameId: TEST_GAME_ID, tier: DifficultyTier.Basic, order: 2, title: 'L2', conceptIntroduced: 'c2', description: 'd2', data: {} },
  { levelId: 'ma-inter-01', gameId: TEST_GAME_ID, tier: DifficultyTier.Intermediate, order: 1, title: 'L3', conceptIntroduced: 'c3', description: 'd3', data: {} },
  { levelId: 'ma-adv-01', gameId: TEST_GAME_ID, tier: DifficultyTier.Advanced, order: 1, title: 'L4', conceptIntroduced: 'c4', description: 'd4', data: {} },
  { levelId: 'ma-boss-01', gameId: TEST_GAME_ID, tier: DifficultyTier.Boss, order: 1, title: 'L5', conceptIntroduced: 'c5', description: 'd5', data: {} },
];

function makeResult(overrides: Partial<MinigameResult> = {}): MinigameResult {
  return {
    gameId: TEST_GAME_ID,
    levelId: 'ma-basic-01',
    score: 100,
    perfect: false,
    timeElapsed: 30,
    xpEarned: 0,
    starRating: 1,
    ...overrides,
  };
}

function createFakeStorage(): Storage {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, value),
    removeItem: (key: string) => { store.delete(key); },
    clear: () => store.clear(),
    key: (i: number) => [...store.keys()][i] ?? null,
    get length() { return store.size; },
  } as Storage;
}

// --- Integration tests ---

describe('Core progression integration', () => {
  let levelCompletion: LevelCompletionService;
  let levelProgression: LevelProgressionService;
  let xpService: XpService;
  let gameState: GameStateService;
  let masteryService: MasteryService;
  let streakService: StreakService;
  let spacedRepetition: SpacedRepetitionService;
  let refresherService: RefresherChallengeService;
  let notificationService: XpNotificationService;
  let streakRewardService: StreakRewardService;
  let fakeStorage: Storage;
  let originalLocalStorage: Storage;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-07T12:00:00'));

    fakeStorage = createFakeStorage();
    originalLocalStorage = window.localStorage;
    Object.defineProperty(window, 'localStorage', { value: fakeStorage, writable: true, configurable: true });

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        LevelCompletionService,
        LevelProgressionService,
        XpService,
        GameStateService,
        MasteryService,
        StreakService,
        SpacedRepetitionService,
        RefresherChallengeService,
        XpNotificationService,
        StatePersistenceService,
        LevelLoaderService,
        StreakRewardService,
      ],
    });

    levelCompletion = TestBed.inject(LevelCompletionService);
    levelProgression = TestBed.inject(LevelProgressionService);
    xpService = TestBed.inject(XpService);
    gameState = TestBed.inject(GameStateService);
    masteryService = TestBed.inject(MasteryService);
    streakService = TestBed.inject(StreakService);
    spacedRepetition = TestBed.inject(SpacedRepetitionService);
    refresherService = TestBed.inject(RefresherChallengeService);
    notificationService = TestBed.inject(XpNotificationService);
    streakRewardService = TestBed.inject(StreakRewardService);

    levelProgression.registerLevels(testLevels);
  });

  afterEach(() => {
    vi.runAllTimers();
    vi.useRealTimers();
    Object.defineProperty(window, 'localStorage', { value: originalLocalStorage, writable: true, configurable: true });
  });

  describe('level completion pipeline', () => {
    it('records level progress, adds XP, and updates mastery after completeLevel', () => {
      levelCompletion.completeLevel(makeResult({ levelId: 'ma-basic-01', score: 100, perfect: false }));

      const progress = levelProgression.getLevel('ma-basic-01');
      expect(progress).not.toBeNull();
      expect(progress!.completed).toBe(true);
      expect(progress!.bestScore).toBe(100);

      expect(xpService.totalXp()).toBe(15);
      expect(masteryService.getMastery('module-assembly')).toBe(1);
    });
  });

  describe('streak bonus integration', () => {
    it('applies streak multiplier to XP when streak is active', () => {
      // Day 1 (2026-03-07, set in beforeEach)
      streakService.recordDailyPlay();

      // Day 2
      vi.setSystemTime(new Date('2026-03-08T12:00:00'));
      streakService.recordDailyPlay();

      // Day 3
      vi.setSystemTime(new Date('2026-03-09T12:00:00'));
      streakService.recordDailyPlay();

      // Complete level on Day 3 (same day as last recordDailyPlay)
      const summary = levelCompletion.completeLevel(makeResult({ perfect: false }));

      // 3-day streak: multiplier = 1.0 + (3 * 0.1) = 1.3
      // Basic tier = 15 XP, Math.round(15 * 1.3) = 20
      expect(summary.xpEarned).toBe(20);
      expect(summary.bonuses.streak).toBe(true);
      expect(xpService.totalXp()).toBe(20);
    });
  });

  describe('spaced repetition degradation and refresher', () => {
    it('resets degradation timer after completing a refresher for a degraded topic', () => {
      // Establish real mastery by completing both Basic-tier levels
      levelCompletion.completeLevel(makeResult({ levelId: 'ma-basic-01', score: 100, perfect: false }));
      levelCompletion.completeLevel(makeResult({ levelId: 'ma-basic-02', score: 100, perfect: false }));
      expect(masteryService.getMastery('module-assembly')).toBe(2);

      // Start degradation clock
      spacedRepetition.recordPractice('module-assembly');

      // Advance 14 days (7 days past the 7-day grace period)
      vi.advanceTimersByTime(14 * MS_PER_DAY);

      // Verify degradation occurred: 7 days past grace x 1/7 stars/day = 1.0 star lost from raw 2
      expect(spacedRepetition.getEffectiveMastery('module-assembly')).toBeCloseTo(1.0);

      // Complete refresher to reset timer
      const refreshResult = refresherService.completeRefresher('module-assembly');
      expect(refreshResult).toBe(true);

      // After refresher, effective mastery should match raw mastery (no degradation)
      expect(spacedRepetition.getEffectiveMastery('module-assembly')).toBe(2);

      // Topic should no longer appear in degrading topics
      const degrading = spacedRepetition.getDegradingTopics();
      expect(degrading.some((t) => t.topicId === 'module-assembly')).toBe(false);
    });
  });

  describe('XP notification integration', () => {
    it('triggers XP notification with correct amount and bonuses on level completion', () => {
      const showSpy = vi.spyOn(notificationService, 'show');

      levelCompletion.completeLevel(makeResult({ perfect: true }));

      expect(showSpy).toHaveBeenCalledTimes(1);
      // Basic tier perfect: 15 * 2 = 30
      expect(showSpy.mock.calls[0][0]).toBe(30);
      const bonuses = showSpy.mock.calls[0][1] as readonly string[];
      expect(bonuses).toContain('Level Complete');
      expect(bonuses).toContain('Perfect!');
    });
  });

  describe('rank-up detection', () => {
    it('detects rank-up when XP crosses Ensign threshold and includes rank in notification', () => {
      // Seed XP to just below Ensign (500)
      gameState.addXp(490);
      const showSpy = vi.spyOn(notificationService, 'show');

      // Basic perfect = 30 XP -> total 520 -> Ensign
      const summary = levelCompletion.completeLevel(makeResult({ perfect: true }));

      expect(summary.rankUpOccurred).toBe(true);
      expect(xpService.currentRank()).toBe('Ensign');
      const bonuses = showSpy.mock.calls[0][1] as readonly string[];
      expect(bonuses).toContain('Rank Up: Ensign');
    });

    it('does not flag rank-up when XP stays within same rank', () => {
      // Start at 0 XP, complete a Basic non-perfect level (15 XP) -> still Cadet
      const summary = levelCompletion.completeLevel(makeResult({ perfect: false }));
      expect(summary.rankUpOccurred).toBe(false);
    });
  });

  describe('streak reward milestone integration', () => {
    it('awards 100 XP bonus when 7-day streak milestone is reached', () => {
      const showSpy = vi.spyOn(notificationService, 'show');

      for (let day = 0; day < 7; day++) {
        vi.setSystemTime(new Date(`2026-03-${String(day + 1).padStart(2, '0')}T12:00:00`));
        streakService.recordDailyPlay();
      }
      TestBed.flushEffects();

      expect(xpService.totalXp()).toBe(100);
      expect(streakRewardService.isAwarded(7)).toBe(true);
      expect(showSpy).toHaveBeenCalledWith(100, expect.arrayContaining(['Weekly Warrior']));
    });

    it('does not re-award milestone on 8th consecutive day', () => {
      for (let day = 0; day < 7; day++) {
        vi.setSystemTime(new Date(`2026-03-${String(day + 1).padStart(2, '0')}T12:00:00`));
        streakService.recordDailyPlay();
      }
      TestBed.flushEffects();
      const xpAfter7 = xpService.totalXp();

      vi.setSystemTime(new Date('2026-03-08T12:00:00'));
      streakService.recordDailyPlay();
      TestBed.flushEffects();

      expect(xpService.totalXp()).toBe(xpAfter7);
    });
  });
});
