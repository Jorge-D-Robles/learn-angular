import { TestBed } from '@angular/core/testing';
import { LifetimeStatsService } from './lifetime-stats.service';
import { XpService } from './xp.service';
import { GameProgressionService } from './game-progression.service';
import { PlayTimeService } from './play-time.service';
import { LevelProgressionService } from '../levels/level-progression.service';
import { ALL_STORY_MISSIONS } from '../curriculum/curriculum.data';
import { DifficultyTier } from '../minigame/minigame.types';
import type { MinigameResult } from '../minigame/minigame.types';
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

function makeTestLevel(id: string, gameId = 'module-assembly' as const): LevelDefinition {
  return {
    levelId: id,
    gameId,
    tier: DifficultyTier.Basic,
    order: 1,
    title: 'Test Level',
    conceptIntroduced: 'Test',
    description: 'Test level',
    data: {},
  };
}

function makeTestResult(
  levelId: string,
  overrides: Partial<MinigameResult> = {},
): MinigameResult {
  return {
    gameId: 'module-assembly',
    levelId,
    score: 100,
    perfect: false,
    timeElapsed: 30,
    xpEarned: 15,
    starRating: 2,
    ...overrides,
  };
}

describe('LifetimeStatsService', () => {
  let fakeStorage: Storage;
  let originalLocalStorage: Storage;

  beforeEach(() => {
    vi.useFakeTimers();
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

  // --- 1. Service creation ---

  it('should be created', () => {
    const service = TestBed.inject(LifetimeStatsService);
    expect(service).toBeTruthy();
  });

  // --- 2. Default state (no activity) ---

  it('should return totalXp 0 for new player', () => {
    const service = TestBed.inject(LifetimeStatsService);
    expect(service.profileStats().totalXp).toBe(0);
  });

  it('should return currentRank Cadet for new player', () => {
    const service = TestBed.inject(LifetimeStatsService);
    expect(service.profileStats().currentRank).toBe('Cadet');
  });

  it('should return rankProgress 0 for new player', () => {
    const service = TestBed.inject(LifetimeStatsService);
    expect(service.profileStats().rankProgress).toBe(0);
  });

  it('should return empty topicMasteryMap for new player', () => {
    const service = TestBed.inject(LifetimeStatsService);
    expect(service.profileStats().topicMasteryMap.size).toBe(0);
  });

  it('should return missionsCompleted 0 for new player', () => {
    const service = TestBed.inject(LifetimeStatsService);
    expect(service.profileStats().missionsCompleted).toBe(0);
  });

  it('should return totalMissions equal to ALL_STORY_MISSIONS.length', () => {
    const service = TestBed.inject(LifetimeStatsService);
    expect(service.profileStats().totalMissions).toBe(ALL_STORY_MISSIONS.length);
  });

  it('should return totalPlayTime 0 for new player', () => {
    const service = TestBed.inject(LifetimeStatsService);
    expect(service.profileStats().totalPlayTime).toBe(0);
  });

  it('should return currentStreak 0 for new player', () => {
    const service = TestBed.inject(LifetimeStatsService);
    expect(service.profileStats().currentStreak).toBe(0);
  });

  it('should return streakMultiplier 1.0 for new player', () => {
    const service = TestBed.inject(LifetimeStatsService);
    expect(service.profileStats().streakMultiplier).toBe(1.0);
  });

  it('should return levelsCompleted 0 for new player', () => {
    const service = TestBed.inject(LifetimeStatsService);
    expect(service.profileStats().levelsCompleted).toBe(0);
  });

  it('should return perfectScores 0 for new player', () => {
    const service = TestBed.inject(LifetimeStatsService);
    expect(service.profileStats().perfectScores).toBe(0);
  });

  // --- 3. Stats aggregation (after mutations) ---

  it('should reflect XP added via XpService', () => {
    const service = TestBed.inject(LifetimeStatsService);
    const xpService = TestBed.inject(XpService);

    xpService.addXp(500);

    expect(service.profileStats().totalXp).toBe(500);
    expect(service.profileStats().currentRank).toBe('Ensign');
  });

  it('should reflect completed missions', () => {
    const service = TestBed.inject(LifetimeStatsService);
    const gameProgression = TestBed.inject(GameProgressionService);

    gameProgression.completeMission(1);

    expect(service.profileStats().missionsCompleted).toBe(1);
  });

  it('should reflect level completions', () => {
    const service = TestBed.inject(LifetimeStatsService);
    const levelProgression = TestBed.inject(LevelProgressionService);

    const level = makeTestLevel('test-01');
    levelProgression.registerLevels([level]);
    levelProgression.completeLevel(makeTestResult('test-01'));

    expect(service.profileStats().levelsCompleted).toBe(1);
  });

  it('should reflect perfect scores', () => {
    const service = TestBed.inject(LifetimeStatsService);
    const levelProgression = TestBed.inject(LevelProgressionService);

    const level = makeTestLevel('test-01');
    levelProgression.registerLevels([level]);
    levelProgression.completeLevel(makeTestResult('test-01', { perfect: true }));

    expect(service.profileStats().perfectScores).toBe(1);
  });

  it('should reflect play time', () => {
    const service = TestBed.inject(LifetimeStatsService);
    const playTimeService = TestBed.inject(PlayTimeService);

    playTimeService.startSession();
    vi.advanceTimersByTime(30000);
    playTimeService.endSession();

    expect(service.profileStats().totalPlayTime).toBe(30);
  });

  // --- 4. Reactive updates ---

  it('should update profileStats when XpService.totalXp changes', () => {
    const service = TestBed.inject(LifetimeStatsService);
    const xpService = TestBed.inject(XpService);

    const before = service.profileStats().totalXp;
    expect(before).toBe(0);

    xpService.addXp(100);

    const after = service.profileStats().totalXp;
    expect(after).toBe(100);
  });

  it('should update profileStats when level progress changes', () => {
    const service = TestBed.inject(LifetimeStatsService);
    const levelProgression = TestBed.inject(LevelProgressionService);

    expect(service.profileStats().levelsCompleted).toBe(0);

    const level = makeTestLevel('reactive-01');
    levelProgression.registerLevels([level]);
    levelProgression.completeLevel(makeTestResult('reactive-01'));

    expect(service.profileStats().levelsCompleted).toBe(1);
  });

  // --- 5. getProfileStats() method ---

  it('should return the same snapshot as profileStats signal', () => {
    const service = TestBed.inject(LifetimeStatsService);
    const fromSignal = service.profileStats();
    const fromMethod = service.getProfileStats();
    expect(fromMethod).toEqual(fromSignal);
  });
});
