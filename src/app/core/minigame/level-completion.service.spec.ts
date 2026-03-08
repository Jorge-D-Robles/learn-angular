import { TestBed } from '@angular/core/testing';
import {
  DifficultyTier,
  type MinigameId,
  type MinigameResult,
} from './minigame.types';
import type { LevelDefinition } from '../levels/level.types';
import { LevelProgressionService } from '../levels/level-progression.service';
import { GameStateService } from '../state';
import { MasteryService } from '../progression/mastery.service';
import { LevelCompletionService } from './level-completion.service';
import { XpNotificationService } from '../notifications';
import { StreakService } from '../progression/streak.service';

// --- Test fixtures ---

const TEST_GAME_ID: MinigameId = 'module-assembly';

const testLevels: LevelDefinition<unknown>[] = [
  {
    levelId: 'ma-basic-01',
    gameId: TEST_GAME_ID,
    tier: DifficultyTier.Basic,
    order: 1,
    title: 'L1',
    conceptIntroduced: 'c1',
    description: 'd1',
    data: {},
  },
  {
    levelId: 'ma-basic-02',
    gameId: TEST_GAME_ID,
    tier: DifficultyTier.Basic,
    order: 2,
    title: 'L2',
    conceptIntroduced: 'c2',
    description: 'd2',
    data: {},
  },
  {
    levelId: 'ma-inter-01',
    gameId: TEST_GAME_ID,
    tier: DifficultyTier.Intermediate,
    order: 1,
    title: 'L3',
    conceptIntroduced: 'c3',
    description: 'd3',
    data: {},
  },
  {
    levelId: 'ma-adv-01',
    gameId: TEST_GAME_ID,
    tier: DifficultyTier.Advanced,
    order: 1,
    title: 'L4',
    conceptIntroduced: 'c4',
    description: 'd4',
    data: {},
  },
  {
    levelId: 'ma-boss-01',
    gameId: TEST_GAME_ID,
    tier: DifficultyTier.Boss,
    order: 1,
    title: 'L5',
    conceptIntroduced: 'c5',
    description: 'd5',
    data: {},
  },
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
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => store.clear(),
    key: (i: number) => [...store.keys()][i] ?? null,
    get length() {
      return store.size;
    },
  } as Storage;
}

describe('LevelCompletionService', () => {
  let service: LevelCompletionService;
  let levelProgression: LevelProgressionService;
  let fakeStorage: Storage;
  let originalLocalStorage: Storage;

  beforeEach(() => {
    fakeStorage = createFakeStorage();
    originalLocalStorage = window.localStorage;

    Object.defineProperty(window, 'localStorage', {
      value: fakeStorage,
      writable: true,
      configurable: true,
    });

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});

    levelProgression = TestBed.inject(LevelProgressionService);
    levelProgression.registerLevels(testLevels);
    service = TestBed.inject(LevelCompletionService);
  });

  afterEach(() => {
    Object.defineProperty(window, 'localStorage', {
      value: originalLocalStorage,
      writable: true,
      configurable: true,
    });
  });

  // 1. Basic DI smoke test
  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // 2. Summary has correct score
  it('should return a LevelCompletionSummary with correct score', () => {
    const summary = service.completeLevel(makeResult({ score: 100 }));
    expect(summary.score).toBe(100);
  });

  // 3. XP from tier (Basic = 15) for non-perfect
  it('should calculate XP from tier (Basic = 15) for non-perfect', () => {
    const summary = service.completeLevel(
      makeResult({ perfect: false }),
    );
    expect(summary.xpEarned).toBe(15);
  });

  // 4. XP with perfect bonus (Basic = 30)
  it('should calculate XP with perfect bonus (Basic = 30)', () => {
    const summary = service.completeLevel(
      makeResult({ perfect: true }),
    );
    expect(summary.xpEarned).toBe(30);
    expect(summary.bonuses.perfect).toBe(true);
  });

  // 5. XP for Intermediate tier (20 base, 40 perfect) — split to avoid diminishing returns
  it('should calculate XP for Intermediate tier non-perfect (20)', () => {
    const nonPerfect = service.completeLevel(
      makeResult({ levelId: 'ma-inter-01', perfect: false }),
    );
    expect(nonPerfect.xpEarned).toBe(20);
  });

  it('should calculate XP for Advanced tier perfect (60)', () => {
    const perfect = service.completeLevel(
      makeResult({ levelId: 'ma-adv-01', perfect: true }),
    );
    expect(perfect.xpEarned).toBe(60);
  });

  // 6. XP for Boss tier (150 base, 300 perfect) — split to avoid diminishing returns
  it('should calculate XP for Boss tier non-perfect (150)', () => {
    const nonPerfect = service.completeLevel(
      makeResult({ levelId: 'ma-boss-01', perfect: false }),
    );
    expect(nonPerfect.xpEarned).toBe(150);
  });

  it('should calculate XP for Boss tier perfect (300)', () => {
    const perfect = service.completeLevel(
      makeResult({ levelId: 'ma-boss-01', perfect: true }),
    );
    expect(perfect.xpEarned).toBe(300);
  });

  // 7. Auto-apply streak bonus from StreakService
  describe('streak bonus (auto from StreakService)', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    function buildStreak(days: number): void {
      const streakService = TestBed.inject(StreakService);
      for (let i = 0; i < days; i++) {
        vi.setSystemTime(
          new Date(`2026-03-${String(1 + i).padStart(2, '0')}T12:00:00`),
        );
        streakService.recordDailyPlay();
      }
    }

    it('should auto-apply streak bonus from StreakService (3-day streak)', () => {
      buildStreak(3); // 1.3x
      const summary = service.completeLevel(makeResult({ perfect: false }));
      // Basic = 15, 15 * 1.3 = 19.5 -> Math.round = 20
      expect(summary.xpEarned).toBe(20);
      expect(summary.bonuses.streak).toBe(true);
    });

    it('should have no streak bonus when no streak active', () => {
      const summary = service.completeLevel(makeResult({ perfect: false }));
      expect(summary.xpEarned).toBe(15);
      expect(summary.bonuses.streak).toBe(false);
    });

    it('should combine streak bonus with perfect score', () => {
      buildStreak(3); // 1.3x
      const summary = service.completeLevel(makeResult({ perfect: true }));
      // Basic perfect = 30, 30 * 1.3 = 39
      expect(summary.xpEarned).toBe(39);
      expect(summary.bonuses.perfect).toBe(true);
      expect(summary.bonuses.streak).toBe(true);
    });
  });

  // 9. Detect rank-up
  it('should detect rank-up', () => {
    // Start at 490 XP (Cadet). Basic perfect = 30 XP -> 520 -> Ensign
    TestBed.inject(GameStateService).addXp(490);
    const summary = service.completeLevel(
      makeResult({ perfect: true }),
    );
    expect(summary.rankUpOccurred).toBe(true);
  });

  // 10. No rank-up when rank stays same
  it('should not flag rank-up when rank stays same', () => {
    // Start at 0 XP. Basic non-perfect = 15 XP -> still Cadet
    const summary = service.completeLevel(
      makeResult({ perfect: false }),
    );
    expect(summary.rankUpOccurred).toBe(false);
  });

  // 11. isNewBestScore on first completion
  it('should detect isNewBestScore on first completion', () => {
    const summary = service.completeLevel(
      makeResult({ score: 100 }),
    );
    expect(summary.isNewBestScore).toBe(true);
  });

  // 12. isNewBestScore when score improves
  it('should detect isNewBestScore when score improves', () => {
    service.completeLevel(makeResult({ score: 100 }));
    const summary = service.completeLevel(makeResult({ score: 200 }));
    expect(summary.isNewBestScore).toBe(true);
  });

  // 13. Not isNewBestScore when score is lower
  it('should not flag isNewBestScore when score is lower', () => {
    service.completeLevel(makeResult({ score: 200 }));
    const summary = service.completeLevel(makeResult({ score: 100 }));
    expect(summary.isNewBestScore).toBe(false);
  });

  // 14. Record completion in LevelProgressionService
  it('should record completion in LevelProgressionService', () => {
    service.completeLevel(makeResult({ levelId: 'ma-basic-01' }));
    const progress = levelProgression.getLevel('ma-basic-01');
    expect(progress).not.toBeNull();
    expect(progress!.completed).toBe(true);
  });

  // 15. Update mastery via MasteryService
  it('should update mastery via MasteryService', () => {
    const mastery = TestBed.inject(MasteryService);
    const spy = vi.spyOn(mastery, 'updateMastery');
    service.completeLevel(makeResult());
    expect(spy).toHaveBeenCalledWith(TEST_GAME_ID);
  });

  // 16. Return star rating from the result
  it('should return star rating from the result', () => {
    const summary = service.completeLevel(
      makeResult({ starRating: 3 }),
    );
    expect(summary.starRating).toBe(3);
  });

  // 17. previousBestScore, perfectBonus, streakBonus returned in summary
  it('should return previousBestScore: 0 on first completion', () => {
    const summary = service.completeLevel(makeResult({ score: 100 }));
    expect(summary.previousBestScore).toBe(0);
  });

  it('should return previousBestScore with prior best on subsequent completion', () => {
    service.completeLevel(makeResult({ score: 100 }));
    const summary = service.completeLevel(makeResult({ score: 200 }));
    expect(summary.previousBestScore).toBe(100);
  });

  it('should return perfectBonus when perfect is true (Basic tier)', () => {
    // Basic tier: base = 15, perfect = 30, perfectBonus = 30 - 15 = 15
    const summary = service.completeLevel(makeResult({ perfect: true }));
    expect(summary.perfectBonus).toBe(15);
  });

  it('should return perfectBonus of 0 when not perfect', () => {
    const summary = service.completeLevel(makeResult({ perfect: false }));
    expect(summary.perfectBonus).toBe(0);
  });

  it('should return streakBonus of 0 when no streak active', () => {
    const summary = service.completeLevel(makeResult());
    expect(summary.streakBonus).toBe(0);
  });

  // 18. Throw for unregistered level
  it('should throw for unregistered level', () => {
    expect(() =>
      service.completeLevel(makeResult({ levelId: 'unknown-level' })),
    ).toThrowError(/Level definition not found/);
  });

  describe('XP notifications', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should trigger XP notification on level completion', () => {
      const spy = vi.spyOn(TestBed.inject(XpNotificationService), 'show');
      service.completeLevel(makeResult());
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should pass correct XP amount to notification', () => {
      const spy = vi.spyOn(TestBed.inject(XpNotificationService), 'show');
      service.completeLevel(makeResult({ perfect: false }));
      expect(spy).toHaveBeenCalledWith(15, expect.any(Array));
    });

    it("should include 'Level Complete' in bonuses", () => {
      const spy = vi.spyOn(TestBed.inject(XpNotificationService), 'show');
      service.completeLevel(makeResult());
      const bonuses = spy.mock.calls[0][1] as readonly string[];
      expect(bonuses).toContain('Level Complete');
    });

    it("should include 'Perfect!' bonus when perfect", () => {
      const spy = vi.spyOn(TestBed.inject(XpNotificationService), 'show');
      service.completeLevel(makeResult({ perfect: true }));
      const bonuses = spy.mock.calls[0][1] as readonly string[];
      expect(bonuses).toContain('Perfect!');
    });

    it("should not include 'Perfect!' bonus when not perfect", () => {
      const spy = vi.spyOn(TestBed.inject(XpNotificationService), 'show');
      service.completeLevel(makeResult({ perfect: false }));
      const bonuses = spy.mock.calls[0][1] as readonly string[];
      expect(bonuses).not.toContain('Perfect!');
    });

    it('should include streak bonus amount in notification when streak active', () => {
      vi.setSystemTime(new Date('2026-03-01T12:00:00'));
      TestBed.inject(StreakService).recordDailyPlay();
      const spy = vi.spyOn(TestBed.inject(XpNotificationService), 'show');
      service.completeLevel(makeResult({ perfect: false }));
      const bonuses = spy.mock.calls[0][1] as readonly string[];
      // Basic = 15, 1.1x, bonus = 2
      expect(bonuses).toContain('+2 Streak Bonus');
    });

    it('should not include streak bonus in notification when no streak', () => {
      const spy = vi.spyOn(TestBed.inject(XpNotificationService), 'show');
      service.completeLevel(makeResult({ perfect: false }));
      const bonuses = spy.mock.calls[0][1] as readonly string[];
      const hasStreak = bonuses.some((b) => b.includes('Streak'));
      expect(hasStreak).toBe(false);
    });

    it('should include rank-up info in notification when rank changes', () => {
      const spy = vi.spyOn(TestBed.inject(XpNotificationService), 'show');
      // Start at 490 XP (Cadet). Basic perfect = 30 XP -> 520 -> Ensign
      TestBed.inject(GameStateService).addXp(490);
      service.completeLevel(makeResult({ perfect: true }));
      const bonuses = spy.mock.calls[0][1] as readonly string[];
      expect(bonuses).toContain('Rank Up: Ensign');
    });

    it('should not include rank-up info when rank stays same', () => {
      const spy = vi.spyOn(TestBed.inject(XpNotificationService), 'show');
      service.completeLevel(makeResult({ perfect: false }));
      const bonuses = spy.mock.calls[0][1] as readonly string[];
      const hasRankUp = bonuses.some((b) => b.startsWith('Rank Up'));
      expect(hasRankUp).toBe(false);
    });
  });

  describe('diminishing returns integration', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    function buildStreak(days: number): void {
      const streakService = TestBed.inject(StreakService);
      for (let i = 0; i < days; i++) {
        vi.setSystemTime(
          new Date(`2026-03-${String(1 + i).padStart(2, '0')}T12:00:00`),
        );
        streakService.recordDailyPlay();
      }
    }

    // 1. First play gets full XP (multiplier = 1.0)
    it('should award full XP on first play (multiplier = 1.0)', () => {
      const summary = service.completeLevel(makeResult({ perfect: false }));
      expect(summary.xpEarned).toBe(15);
      expect(summary.replayMultiplier).toBe(1.0);
    });

    // 2. Second play gets 50% XP (multiplier = 0.5)
    it('should award 50% XP on second play of same level', () => {
      service.completeLevel(makeResult({ perfect: false }));
      const summary = service.completeLevel(makeResult({ perfect: false }));
      expect(summary.xpEarned).toBe(8); // Math.round(15 * 0.5)
      expect(summary.replayMultiplier).toBe(0.5);
    });

    // 3. Third play gets 25% XP (multiplier = 0.25)
    it('should award 25% XP on third play of same level', () => {
      service.completeLevel(makeResult({ perfect: false }));
      service.completeLevel(makeResult({ perfect: false }));
      const summary = service.completeLevel(makeResult({ perfect: false }));
      expect(summary.xpEarned).toBe(4); // Math.round(15 * 0.25)
      expect(summary.replayMultiplier).toBe(0.25);
    });

    // 4. Fourth+ play gets 10% XP (multiplier = 0.1)
    it('should award 10% XP on fourth play of same level', () => {
      service.completeLevel(makeResult({ perfect: false }));
      service.completeLevel(makeResult({ perfect: false }));
      service.completeLevel(makeResult({ perfect: false }));
      const summary = service.completeLevel(makeResult({ perfect: false }));
      expect(summary.xpEarned).toBe(2); // Math.round(15 * 0.1)
      expect(summary.replayMultiplier).toBe(0.1);
    });

    // 5. Star improvement gets full XP
    it('should award full XP when star rating improves', () => {
      service.completeLevel(makeResult({ starRating: 1, perfect: false }));
      const summary = service.completeLevel(
        makeResult({ starRating: 3, perfect: false }),
      );
      expect(summary.xpEarned).toBe(15); // Full XP, not diminished
      expect(summary.replayMultiplier).toBe(0.5); // Multiplier still reported as 0.5
    });

    // 6. No star improvement gets diminished XP
    it('should award diminished XP when star rating does not improve', () => {
      service.completeLevel(makeResult({ starRating: 3, perfect: false }));
      const summary = service.completeLevel(
        makeResult({ starRating: 2, perfect: false }),
      );
      expect(summary.xpEarned).toBe(8); // Math.round(15 * 0.5)
    });

    // 7. Diminishing returns combine with streak bonus
    it('should combine diminishing returns with streak bonus', () => {
      buildStreak(3); // 1.3x streak multiplier
      service.completeLevel(makeResult({ perfect: false }));
      const summary = service.completeLevel(makeResult({ perfect: false }));
      // Base = 15, diminished = Math.round(15 * 0.5) = 8, streak = Math.round(8 * 1.3) = 10
      expect(summary.xpEarned).toBe(10);
    });

    // 8. Replay notification shows multiplier percentage
    it('should include replay notification when multiplier < 1.0', () => {
      const spy = vi.spyOn(TestBed.inject(XpNotificationService), 'show');
      service.completeLevel(makeResult({ perfect: false }));
      service.completeLevel(makeResult({ perfect: false }));
      const bonuses = spy.mock.calls[1][1] as readonly string[];
      expect(bonuses).toContain('Replay: 50% XP');
    });

    // 9. No replay notification on first play
    it('should not include replay notification on first play', () => {
      const spy = vi.spyOn(TestBed.inject(XpNotificationService), 'show');
      service.completeLevel(makeResult({ perfect: false }));
      const bonuses = spy.mock.calls[0][1] as readonly string[];
      const hasReplay = bonuses.some((b) => b.includes('Replay'));
      expect(hasReplay).toBe(false);
    });

    // 10. replayMultiplier field is present in summary
    it('should include replayMultiplier field in summary', () => {
      const summary = service.completeLevel(makeResult({ perfect: false }));
      expect(summary.replayMultiplier).toBeDefined();
      expect(summary.replayMultiplier).toBe(1.0);
    });
  });
});
