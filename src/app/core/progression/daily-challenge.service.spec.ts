import { TestBed } from '@angular/core/testing';
import { DailyChallengeService, DAILY_CHALLENGE_BONUS_XP } from './daily-challenge.service';
import { SpacedRepetitionService } from './spaced-repetition.service';
import { GameProgressionService } from './game-progression.service';
import { XpService } from './xp.service';
import { XpNotificationService } from '../notifications/xp-notification.service';
import type { MinigameId } from '../minigame/minigame.types';

// --- Test helpers ---

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

describe('DailyChallengeService', () => {
  let fakeStorage: Storage;
  let originalLocalStorage: Storage;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-07T12:00:00'));

    fakeStorage = createFakeStorage();
    originalLocalStorage = window.localStorage;

    Object.defineProperty(window, 'localStorage', {
      value: fakeStorage,
      writable: true,
      configurable: true,
    });

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
  });

  afterEach(() => {
    vi.useRealTimers();
    Object.defineProperty(window, 'localStorage', {
      value: originalLocalStorage,
      writable: true,
      configurable: true,
    });
  });

  function createService(): DailyChallengeService {
    const spacedRepetition = TestBed.inject(SpacedRepetitionService);
    vi.spyOn(spacedRepetition, 'getDegradingTopics').mockReturnValue([]);

    const gameProgression = TestBed.inject(GameProgressionService);
    vi.spyOn(gameProgression, 'getUnlockedMinigames').mockReturnValue([
      'module-assembly' as MinigameId,
      'wire-protocol' as MinigameId,
      'flow-commander' as MinigameId,
    ]);

    return TestBed.inject(DailyChallengeService);
  }

  // --- Initialization (3 tests) ---

  it('should be created', () => {
    const service = createService();
    expect(service).toBeTruthy();
  });

  it('should return a DailyChallenge from todaysChallenge', () => {
    const service = createService();
    const challenge = service.todaysChallenge();

    expect(challenge.date).toBe('2026-03-07');
    expect(challenge.gameId).toBeTruthy();
    expect(challenge.levelId).toBeTruthy();
    expect(challenge.bonusXp).toBeDefined();
    expect(challenge.completed).toBeDefined();
  });

  it('should default to not completed', () => {
    const service = createService();

    expect(service.isCompleted()).toBe(false);
    expect(service.todaysChallenge().completed).toBe(false);
  });

  // --- Challenge generation (4 tests) ---

  it('should generate the same challenge for the same date', () => {
    const service = createService();
    const first = service.todaysChallenge();
    const second = service.todaysChallenge();

    expect(first.gameId).toBe(second.gameId);
    expect(first.levelId).toBe(second.levelId);
  });

  it('should generate different challenges on different dates', () => {
    const service = createService();
    const firstLevelId = service.todaysChallenge().levelId;

    // Advance to a different date and create fresh service
    vi.setSystemTime(new Date('2026-03-10T12:00:00'));
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const service2 = createService();
    const secondLevelId = service2.todaysChallenge().levelId;

    // levelId always differs since it embeds the date string
    expect(firstLevelId).not.toBe(secondLevelId);
  });

  it('should set bonusXp to 50', () => {
    const service = createService();
    expect(service.todaysChallenge().bonusXp).toBe(50);
  });

  it('should format levelId as daily-{gameId}-{date}', () => {
    const service = createService();
    const challenge = service.todaysChallenge();

    expect(challenge.levelId).toBe(`daily-${challenge.gameId}-${challenge.date}`);
  });

  // --- Degrading topic priority (3 tests) ---

  it('should prioritize degrading topics when available', () => {
    const spacedRepetition = TestBed.inject(SpacedRepetitionService);
    vi.spyOn(spacedRepetition, 'getDegradingTopics').mockReturnValue([
      {
        topicId: 'wire-protocol' as MinigameId,
        rawMastery: 4,
        effectiveMastery: 3,
        degradation: 1,
        daysSinceLastPractice: 14,
        lastPracticed: Date.now() - 14 * 86_400_000,
      },
    ]);

    const gameProgression = TestBed.inject(GameProgressionService);
    vi.spyOn(gameProgression, 'getUnlockedMinigames').mockReturnValue([
      'module-assembly' as MinigameId,
      'wire-protocol' as MinigameId,
    ]);

    const service = TestBed.inject(DailyChallengeService);
    expect(service.todaysChallenge().gameId).toBe('wire-protocol');
  });

  it('should fall back to random unlocked minigame when no topics are degrading', () => {
    const spacedRepetition = TestBed.inject(SpacedRepetitionService);
    vi.spyOn(spacedRepetition, 'getDegradingTopics').mockReturnValue([]);

    const unlocked: MinigameId[] = ['module-assembly', 'wire-protocol', 'flow-commander'];
    const gameProgression = TestBed.inject(GameProgressionService);
    vi.spyOn(gameProgression, 'getUnlockedMinigames').mockReturnValue(unlocked);

    const service = TestBed.inject(DailyChallengeService);
    expect(unlocked).toContain(service.todaysChallenge().gameId);
  });

  it('should skip degrading topics for locked minigames', () => {
    const spacedRepetition = TestBed.inject(SpacedRepetitionService);
    vi.spyOn(spacedRepetition, 'getDegradingTopics').mockReturnValue([
      {
        topicId: 'reactor-core' as MinigameId,
        rawMastery: 5,
        effectiveMastery: 3,
        degradation: 2,
        daysSinceLastPractice: 21,
        lastPracticed: Date.now() - 21 * 86_400_000,
      },
    ]);

    const gameProgression = TestBed.inject(GameProgressionService);
    vi.spyOn(gameProgression, 'getUnlockedMinigames').mockReturnValue([
      'module-assembly' as MinigameId,
      'wire-protocol' as MinigameId,
    ]);

    const service = TestBed.inject(DailyChallengeService);
    // reactor-core is not in unlocked list, so should pick from unlocked
    expect(service.todaysChallenge().gameId).not.toBe('reactor-core');
    expect(['module-assembly', 'wire-protocol']).toContain(service.todaysChallenge().gameId);
  });

  // --- Completion (4 tests) ---

  it('should mark challenge as completed after completeChallenge()', () => {
    const service = createService();

    service.completeChallenge();

    expect(service.isCompleted()).toBe(true);
    expect(service.todaysChallenge().completed).toBe(true);
  });

  it('should award 50 bonus XP on completion', () => {
    const service = createService();
    const xpService = TestBed.inject(XpService);
    const addXpSpy = vi.spyOn(xpService, 'addXp');

    service.completeChallenge();

    expect(addXpSpy).toHaveBeenCalledWith(DAILY_CHALLENGE_BONUS_XP);
    expect(addXpSpy).toHaveBeenCalledWith(50);
  });

  it('should show XP notification on completion', () => {
    const service = createService();
    const xpNotification = TestBed.inject(XpNotificationService);
    const showSpy = vi.spyOn(xpNotification, 'show');

    service.completeChallenge();

    expect(showSpy).toHaveBeenCalledWith(50, ['Daily Challenge']);
  });

  it('should be idempotent -- calling completeChallenge() twice awards XP only once', () => {
    const service = createService();
    const xpService = TestBed.inject(XpService);
    const addXpSpy = vi.spyOn(xpService, 'addXp');

    service.completeChallenge();
    service.completeChallenge();

    expect(addXpSpy).toHaveBeenCalledTimes(1);
  });

  // --- Date rollover (2 tests) ---

  it('should reset completed state on new day (fresh instance)', () => {
    // Complete on March 7
    const service = createService();
    service.completeChallenge();
    expect(service.isCompleted()).toBe(true);

    // Advance to March 8
    vi.setSystemTime(new Date('2026-03-08T12:00:00'));
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const freshService = createService();

    expect(freshService.isCompleted()).toBe(false);
  });

  it('should generate a new challenge after date rollover (fresh instance)', () => {
    // Complete on March 7
    const service = createService();
    service.completeChallenge();

    // Advance to March 8
    vi.setSystemTime(new Date('2026-03-08T12:00:00'));
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const freshService = createService();

    expect(freshService.todaysChallenge().date).toBe('2026-03-08');
    expect(freshService.todaysChallenge().completed).toBe(false);
  });

  // --- Persistence (4 tests) ---

  it('should persist completion state via StatePersistenceService', () => {
    const service = createService();

    service.completeChallenge();

    const raw = fakeStorage.getItem('nexus-station:daily-challenge');
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed.lastCompletedDate).toBe('2026-03-07');
  });

  it('should load completed state on init', () => {
    fakeStorage.setItem(
      'nexus-station:daily-challenge',
      JSON.stringify({ lastCompletedDate: '2026-03-07' }),
    );

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const service = createService();

    expect(service.isCompleted()).toBe(true);
  });

  it('should not restore completed state for a past date', () => {
    fakeStorage.setItem(
      'nexus-station:daily-challenge',
      JSON.stringify({ lastCompletedDate: '2026-03-06' }),
    );

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const service = createService();

    expect(service.isCompleted()).toBe(false);
  });

  it('should handle corrupted persistence data gracefully', () => {
    fakeStorage.setItem('nexus-station:daily-challenge', '{invalid json');
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const service = createService();

    expect(service.isCompleted()).toBe(false);
    expect(service.todaysChallenge().date).toBe('2026-03-07');
    warnSpy.mockRestore();
  });

  // --- Edge case (1 test) ---

  it('should fall back to module-assembly when no minigames are unlocked', () => {
    const spacedRepetition = TestBed.inject(SpacedRepetitionService);
    vi.spyOn(spacedRepetition, 'getDegradingTopics').mockReturnValue([]);

    const gameProgression = TestBed.inject(GameProgressionService);
    vi.spyOn(gameProgression, 'getUnlockedMinigames').mockReturnValue([]);

    const service = TestBed.inject(DailyChallengeService);
    expect(service.todaysChallenge().gameId).toBe('module-assembly');
  });
});
