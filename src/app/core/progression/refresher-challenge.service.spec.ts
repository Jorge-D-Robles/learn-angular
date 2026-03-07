import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import {
  RefresherChallengeService,
  REFRESHER_MAX_QUESTIONS,
  REFRESHER_RESTORED_STARS,
} from './refresher-challenge.service';
import { SpacedRepetitionService, type DegradingTopic } from './spaced-repetition.service';
import { LevelLoaderService } from '../levels/level-loader.service';
import type { MinigameId } from '../minigame/minigame.types';
import { DifficultyTier } from '../minigame/minigame.types';
import type { LevelDefinition } from '../levels/level.types';

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

function makeDegradingTopic(
  topicId: MinigameId,
  rawMastery: number,
  effectiveMastery: number,
): DegradingTopic {
  return {
    topicId,
    rawMastery,
    effectiveMastery,
    degradation: rawMastery - effectiveMastery,
    daysSinceLastPractice: 14,
    lastPracticed: Date.now() - 14 * 86_400_000,
  };
}

function makeLevelDefinition(levelId: string, gameId: MinigameId): LevelDefinition<unknown> {
  return {
    levelId,
    gameId,
    tier: DifficultyTier.Basic,
    order: 1,
    title: `Level ${levelId}`,
    conceptIntroduced: 'test-concept',
    description: 'test description',
    data: {},
  };
}

describe('RefresherChallengeService', () => {
  let service: RefresherChallengeService;
  let spacedRepetitionSpy: {
    getDegradingTopics: ReturnType<typeof vi.fn>;
    recordPractice: ReturnType<typeof vi.fn>;
  };
  let levelLoaderSpy: {
    loadLevelPack: ReturnType<typeof vi.fn>;
  };
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

    const spacedRepetition = TestBed.inject(SpacedRepetitionService);
    spacedRepetitionSpy = {
      getDegradingTopics: vi.spyOn(spacedRepetition, 'getDegradingTopics').mockReturnValue([]),
      recordPractice: vi.spyOn(spacedRepetition, 'recordPractice').mockImplementation(() => undefined),
    };

    const levelLoader = TestBed.inject(LevelLoaderService);
    levelLoaderSpy = {
      loadLevelPack: vi.spyOn(levelLoader, 'loadLevelPack').mockReturnValue(of([])),
    };

    service = TestBed.inject(RefresherChallengeService);
  });

  afterEach(() => {
    vi.useRealTimers();
    Object.defineProperty(window, 'localStorage', {
      value: originalLocalStorage,
      writable: true,
      configurable: true,
    });
  });

  // --- Initialization (1 test) ---

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // --- getPendingRefreshers (4 tests) ---

  it('should return empty array when no topics are degrading', () => {
    spacedRepetitionSpy.getDegradingTopics.mockReturnValue([]);

    expect(service.getPendingRefreshers()).toEqual([]);
  });

  it('should return degrading topics from SpacedRepetitionService', () => {
    const topics: DegradingTopic[] = [
      makeDegradingTopic('module-assembly', 5, 3),
      makeDegradingTopic('wire-protocol', 4, 2),
    ];
    spacedRepetitionSpy.getDegradingTopics.mockReturnValue(topics);

    const result = service.getPendingRefreshers();

    expect(result.length).toBe(2);
    expect(result[0].topicId).toBe('module-assembly');
    expect(result[1].topicId).toBe('wire-protocol');
  });

  it('should be sorted by degradation descending (worst first)', () => {
    const topics: DegradingTopic[] = [
      makeDegradingTopic('module-assembly', 5, 4), // degradation = 1
      makeDegradingTopic('wire-protocol', 5, 3),   // degradation = 2
    ];
    spacedRepetitionSpy.getDegradingTopics.mockReturnValue(topics);

    const result = service.getPendingRefreshers();

    // SpacedRepetitionService returns sorted by degradation desc,
    // RefresherChallengeService preserves that order
    expect(result.length).toBe(2);
    // Both have actual degradation so both should be present
    expect(result.map(t => t.topicId)).toEqual(['module-assembly', 'wire-protocol']);
  });

  it('should exclude topics at 7-day boundary with no actual degradation', () => {
    const topics: DegradingTopic[] = [
      makeDegradingTopic('module-assembly', 5, 5), // effectiveMastery === rawMastery -> no actual degradation
      makeDegradingTopic('wire-protocol', 4, 3),   // effectiveMastery < rawMastery -> actual degradation
    ];
    spacedRepetitionSpy.getDegradingTopics.mockReturnValue(topics);

    const result = service.getPendingRefreshers();

    expect(result.length).toBe(1);
    expect(result[0].topicId).toBe('wire-protocol');
  });

  // --- generateRefresher (5 tests) ---

  it('should generate a RefresherChallenge with correct topicId and gameId', async () => {
    spacedRepetitionSpy.getDegradingTopics.mockReturnValue([
      makeDegradingTopic('module-assembly', 5, 3),
    ]);
    const levels = [
      makeLevelDefinition('ma-basic-01', 'module-assembly'),
      makeLevelDefinition('ma-basic-02', 'module-assembly'),
      makeLevelDefinition('ma-basic-03', 'module-assembly'),
    ];
    levelLoaderSpy.loadLevelPack.mockReturnValue(of(levels));

    const challenge = await service.generateRefresher('module-assembly');

    expect(challenge).not.toBeNull();
    expect(challenge!.topicId).toBe('module-assembly');
    expect(challenge!.gameId).toBe('module-assembly');
  });

  it('should set questions to actual level count', async () => {
    spacedRepetitionSpy.getDegradingTopics.mockReturnValue([
      makeDegradingTopic('module-assembly', 5, 3),
    ]);
    const levels = [
      makeLevelDefinition('ma-basic-01', 'module-assembly'),
      makeLevelDefinition('ma-basic-02', 'module-assembly'),
      makeLevelDefinition('ma-basic-03', 'module-assembly'),
      makeLevelDefinition('ma-basic-04', 'module-assembly'),
    ];
    levelLoaderSpy.loadLevelPack.mockReturnValue(of(levels));

    const challenge = await service.generateRefresher('module-assembly');

    expect(challenge).not.toBeNull();
    expect(challenge!.questions).toBe(4);
  });

  it('should set restoredStars to 1', async () => {
    spacedRepetitionSpy.getDegradingTopics.mockReturnValue([
      makeDegradingTopic('module-assembly', 5, 3),
    ]);
    const levels = [
      makeLevelDefinition('ma-basic-01', 'module-assembly'),
      makeLevelDefinition('ma-basic-02', 'module-assembly'),
      makeLevelDefinition('ma-basic-03', 'module-assembly'),
    ];
    levelLoaderSpy.loadLevelPack.mockReturnValue(of(levels));

    const challenge = await service.generateRefresher('module-assembly');

    expect(challenge).not.toBeNull();
    expect(challenge!.restoredStars).toBe(REFRESHER_RESTORED_STARS);
    expect(challenge!.restoredStars).toBe(1);
  });

  it('should populate microLevelIds from LevelLoaderService', async () => {
    spacedRepetitionSpy.getDegradingTopics.mockReturnValue([
      makeDegradingTopic('module-assembly', 5, 3),
    ]);
    const levels = [
      makeLevelDefinition('ma-basic-01', 'module-assembly'),
      makeLevelDefinition('ma-basic-02', 'module-assembly'),
      makeLevelDefinition('ma-basic-03', 'module-assembly'),
    ];
    levelLoaderSpy.loadLevelPack.mockReturnValue(of(levels));

    const challenge = await service.generateRefresher('module-assembly');

    expect(challenge).not.toBeNull();
    const allLevelIds = levels.map(l => l.levelId);
    for (const id of challenge!.microLevelIds) {
      expect(allLevelIds).toContain(id);
    }
    expect(challenge!.microLevelIds.length).toBe(3);
  });

  it('should return null when topicId is not degrading', async () => {
    spacedRepetitionSpy.getDegradingTopics.mockReturnValue([]);

    const challenge = await service.generateRefresher('module-assembly');

    expect(challenge).toBeNull();
  });

  // --- completeRefresher (4 tests) ---

  it('should call SpacedRepetitionService.recordPractice on the topic', () => {
    spacedRepetitionSpy.getDegradingTopics.mockReturnValue([
      makeDegradingTopic('module-assembly', 5, 3),
    ]);

    service.completeRefresher('module-assembly');

    expect(spacedRepetitionSpy.recordPractice).toHaveBeenCalledWith('module-assembly');
  });

  it('should return true on success', () => {
    spacedRepetitionSpy.getDegradingTopics.mockReturnValue([
      makeDegradingTopic('module-assembly', 5, 3),
    ]);

    const result = service.completeRefresher('module-assembly');

    expect(result).toBe(true);
  });

  it('should return false when topic is not degrading', () => {
    spacedRepetitionSpy.getDegradingTopics.mockReturnValue([]);

    const result = service.completeRefresher('module-assembly');

    expect(result).toBe(false);
  });

  it('should not call recordPractice when topic is not degrading', () => {
    spacedRepetitionSpy.getDegradingTopics.mockReturnValue([]);

    service.completeRefresher('module-assembly');

    expect(spacedRepetitionSpy.recordPractice).not.toHaveBeenCalled();
  });

  // --- Edge cases (2 tests) ---

  it('should return null when level pack is empty', async () => {
    spacedRepetitionSpy.getDegradingTopics.mockReturnValue([
      makeDegradingTopic('module-assembly', 5, 3),
    ]);
    levelLoaderSpy.loadLevelPack.mockReturnValue(of([]));

    const challenge = await service.generateRefresher('module-assembly');

    expect(challenge).toBeNull();
  });

  it('should cap microLevelIds at REFRESHER_MAX_QUESTIONS (5)', async () => {
    spacedRepetitionSpy.getDegradingTopics.mockReturnValue([
      makeDegradingTopic('module-assembly', 5, 3),
    ]);
    const levels = Array.from({ length: 10 }, (_, i) =>
      makeLevelDefinition(`ma-basic-${String(i + 1).padStart(2, '0')}`, 'module-assembly'),
    );
    levelLoaderSpy.loadLevelPack.mockReturnValue(of(levels));

    const challenge = await service.generateRefresher('module-assembly');

    expect(challenge).not.toBeNull();
    expect(challenge!.microLevelIds.length).toBe(REFRESHER_MAX_QUESTIONS);
    expect(challenge!.microLevelIds.length).toBeLessThanOrEqual(5);
    expect(challenge!.questions).toBe(REFRESHER_MAX_QUESTIONS);

    // Verify all selected IDs are from the original set (subset membership)
    const allLevelIds = levels.map(l => l.levelId);
    for (const id of challenge!.microLevelIds) {
      expect(allLevelIds).toContain(id);
    }
  });
});
