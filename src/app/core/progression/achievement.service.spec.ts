import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { AchievementService, type AchievementType } from './achievement.service';
import { XpService } from './xp.service';
import { MasteryService } from './mastery.service';
import { GameProgressionService } from './game-progression.service';
import { StreakService } from './streak.service';
import { LevelProgressionService } from '../levels/level-progression.service';
import { PlayTimeService } from './play-time.service';
import type { Rank } from '../state/rank.constants';
import type { MinigameId } from '../minigame/minigame.types';
import type { LevelProgress } from '../levels/level-progression.service';

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

function createMockXpService(overrides: Partial<{ totalXp: number; currentRank: Rank }> = {}) {
  return {
    totalXp: signal(overrides.totalXp ?? 0),
    currentRank: signal(overrides.currentRank ?? 'Cadet' as Rank),
  };
}

function createMockStreakService(overrides: Partial<{ activeStreakDays: number; currentStreak: number }> = {}) {
  return {
    activeStreakDays: signal(overrides.activeStreakDays ?? 0),
    currentStreak: signal(overrides.currentStreak ?? 0),
  };
}

function createMockGameProgressionService(overrides: Partial<{ completedMissionCount: number; unlockedMinigames: MinigameId[] }> = {}) {
  return {
    completedMissionCount: signal(overrides.completedMissionCount ?? 0),
    getUnlockedMinigames: vi.fn().mockReturnValue(overrides.unlockedMinigames ?? []),
  };
}

function createMockMasteryService(overrides: Partial<{ mastery: ReadonlyMap<MinigameId, number> }> = {}) {
  return {
    mastery: signal(overrides.mastery ?? new Map<MinigameId, number>()),
  };
}

function createMockLevelProgressionService(overrides: Partial<{ progress: ReadonlyMap<string, LevelProgress> }> = {}) {
  return {
    progress: signal(overrides.progress ?? new Map<string, LevelProgress>()),
  };
}

function createMockPlayTimeService(overrides: Partial<{ totalPlayTime: number }> = {}) {
  return {
    totalPlayTime: signal(overrides.totalPlayTime ?? 0),
  };
}

function makeLevelProgress(opts: Partial<LevelProgress> & { levelId: string }): LevelProgress {
  return {
    completed: false,
    bestScore: 0,
    starRating: 0,
    perfect: false,
    attempts: 0,
    ...opts,
  };
}

describe('AchievementService', () => {
  let fakeStorage: Storage;
  let originalLocalStorage: Storage;

  let mockXp: ReturnType<typeof createMockXpService>;
  let mockStreak: ReturnType<typeof createMockStreakService>;
  let mockGameProgression: ReturnType<typeof createMockGameProgressionService>;
  let mockMastery: ReturnType<typeof createMockMasteryService>;
  let mockLevelProgression: ReturnType<typeof createMockLevelProgressionService>;
  let mockPlayTime: ReturnType<typeof createMockPlayTimeService>;

  function configureTestBed(overrides: {
    xp?: Partial<{ totalXp: number; currentRank: Rank }>;
    streak?: Partial<{ activeStreakDays: number; currentStreak: number }>;
    gameProgression?: Partial<{ completedMissionCount: number; unlockedMinigames: MinigameId[] }>;
    mastery?: Partial<{ mastery: ReadonlyMap<MinigameId, number> }>;
    levelProgression?: Partial<{ progress: ReadonlyMap<string, LevelProgress> }>;
    playTime?: Partial<{ totalPlayTime: number }>;
  } = {}): AchievementService {
    mockXp = createMockXpService(overrides.xp);
    mockStreak = createMockStreakService(overrides.streak);
    mockGameProgression = createMockGameProgressionService(overrides.gameProgression);
    mockMastery = createMockMasteryService(overrides.mastery);
    mockLevelProgression = createMockLevelProgressionService(overrides.levelProgression);
    mockPlayTime = createMockPlayTimeService(overrides.playTime);

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: XpService, useValue: mockXp },
        { provide: StreakService, useValue: mockStreak },
        { provide: GameProgressionService, useValue: mockGameProgression },
        { provide: MasteryService, useValue: mockMastery },
        { provide: LevelProgressionService, useValue: mockLevelProgression },
        { provide: PlayTimeService, useValue: mockPlayTime },
      ],
    });

    return TestBed.inject(AchievementService);
  }

  beforeEach(() => {
    vi.useFakeTimers();
    fakeStorage = createFakeStorage();
    originalLocalStorage = window.localStorage;

    Object.defineProperty(window, 'localStorage', {
      value: fakeStorage,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    Object.defineProperty(window, 'localStorage', {
      value: originalLocalStorage,
      writable: true,
      configurable: true,
    });
  });

  // --- Initialization tests ---

  it('should be created', () => {
    const service = configureTestBed();
    expect(service).toBeTruthy();
  });

  it('should default to no achievements earned (earnedCount === 0)', () => {
    const service = configureTestBed();
    expect(service.earnedCount()).toBe(0);
  });

  it('should have all 16 achievement definitions loaded', () => {
    const service = configureTestBed();
    expect(service.getAllAchievements().length).toBe(16);
  });

  // --- Achievement evaluation tests ---

  it('should return empty array when no conditions met', () => {
    const service = configureTestBed();
    const earned = service.checkAchievements();
    expect(earned).toEqual([]);
  });

  it('should earn "First Steps" when completedMissionCount >= 1', () => {
    const service = configureTestBed({
      gameProgression: { completedMissionCount: 1 },
    });

    const earned = service.checkAchievements();

    expect(earned.length).toBeGreaterThanOrEqual(1);
    const firstSteps = earned.find((a) => a.id === 'first-steps');
    expect(firstSteps).toBeDefined();
    expect(firstSteps!.isEarned).toBe(true);
    expect(firstSteps!.earnedDate).not.toBeNull();
  });

  it('should not re-earn already-earned achievements', () => {
    const service = configureTestBed({
      gameProgression: { completedMissionCount: 1 },
    });

    const first = service.checkAchievements();
    expect(first.some((a) => a.id === 'first-steps')).toBe(true);

    const second = service.checkAchievements();
    expect(second.some((a) => a.id === 'first-steps')).toBe(false);
  });

  it('should earn "Perfectionist" when perfectScores >= 1', () => {
    const progress = new Map<string, LevelProgress>();
    progress.set('test-level-1', makeLevelProgress({ levelId: 'test-level-1', completed: true, perfect: true, starRating: 3 }));

    const service = configureTestBed({
      levelProgression: { progress },
    });

    const earned = service.checkAchievements();
    const perfectionist = earned.find((a) => a.id === 'perfectionist');
    expect(perfectionist).toBeDefined();
    expect(perfectionist!.isEarned).toBe(true);
  });

  it('should earn "Dedicated" when currentStreak >= 7', () => {
    const service = configureTestBed({
      streak: { currentStreak: 7, activeStreakDays: 7 },
    });

    const earned = service.checkAchievements();
    const dedicated = earned.find((a) => a.id === 'dedicated');
    expect(dedicated).toBeDefined();
    expect(dedicated!.isEarned).toBe(true);
  });

  it('should earn "Marathon" when totalPlayTime >= 3600', () => {
    const service = configureTestBed({
      playTime: { totalPlayTime: 3600 },
    });

    const earned = service.checkAchievements();
    const marathon = earned.find((a) => a.id === 'marathon');
    expect(marathon).toBeDefined();
    expect(marathon!.isEarned).toBe(true);
  });

  it('should earn "Veteran" when rank is Commander', () => {
    const service = configureTestBed({
      xp: { currentRank: 'Commander' },
    });

    const earned = service.checkAchievements();
    const veteran = earned.find((a) => a.id === 'veteran');
    expect(veteran).toBeDefined();
    expect(veteran!.isEarned).toBe(true);
  });

  // --- Multiple achievements at once ---

  it('should return multiple newly earned achievements in one call', () => {
    const progress = new Map<string, LevelProgress>();
    progress.set('l1', makeLevelProgress({ levelId: 'l1', completed: true, perfect: true, starRating: 3 }));

    const service = configureTestBed({
      gameProgression: { completedMissionCount: 1 },
      levelProgression: { progress },
      playTime: { totalPlayTime: 3600 },
    });

    const earned = service.checkAchievements();
    expect(earned.length).toBeGreaterThanOrEqual(3);
    const ids = earned.map((a) => a.id);
    expect(ids).toContain('first-steps');
    expect(ids).toContain('perfectionist');
    expect(ids).toContain('marathon');
  });

  // --- Query methods ---

  it('should return only earned achievements from getEarnedAchievements()', () => {
    const service = configureTestBed({
      gameProgression: { completedMissionCount: 1 },
    });

    service.checkAchievements();
    const earned = service.getEarnedAchievements();

    expect(earned.length).toBeGreaterThanOrEqual(1);
    expect(earned.every((a) => a.isEarned === true)).toBe(true);
    expect(earned.every((a) => a.earnedDate !== null)).toBe(true);
  });

  it('should return all 16 achievements from getAllAchievements() with correct state', () => {
    const service = configureTestBed({
      gameProgression: { completedMissionCount: 1 },
    });

    service.checkAchievements();
    const all = service.getAllAchievements();

    expect(all.length).toBe(16);
    const firstSteps = all.find((a) => a.id === 'first-steps');
    expect(firstSteps!.isEarned).toBe(true);

    const unearned = all.filter((a) => !a.isEarned);
    expect(unearned.length).toBeLessThan(16);
    expect(unearned.every((a) => a.earnedDate === null)).toBe(true);
  });

  // --- Hidden achievements ---

  it('should have hidden achievements with isHidden: true', () => {
    const service = configureTestBed();
    const all = service.getAllAchievements();

    const hidden = all.filter((a) => a.isHidden);
    expect(hidden.length).toBe(3);

    const hiddenIds = hidden.map((a) => a.id);
    expect(hiddenIds).toContain('speed-demon');
    expect(hiddenIds).toContain('overachiever');
    expect(hiddenIds).toContain('legend');
  });

  // --- Notification signal ---

  it('should update lastEarnedAchievement signal when a new achievement is earned', () => {
    const service = configureTestBed({
      gameProgression: { completedMissionCount: 1 },
    });

    expect(service.lastEarnedAchievement()).toBeNull();

    service.checkAchievements();

    expect(service.lastEarnedAchievement()).not.toBeNull();
    expect(service.lastEarnedAchievement()!.isEarned).toBe(true);
  });

  // --- Persistence tests ---

  it('should persist and restore earned achievements across service recreation', () => {
    const service1 = configureTestBed({
      gameProgression: { completedMissionCount: 1 },
    });

    service1.checkAchievements();
    TestBed.flushEffects();
    vi.advanceTimersByTime(500);

    // Verify something was saved
    const stored = fakeStorage.getItem('nexus-station:achievements');
    expect(stored).not.toBeNull();

    // Recreate service with same storage
    const service2 = configureTestBed();

    expect(service2.earnedCount()).toBeGreaterThanOrEqual(1);
    const earned = service2.getEarnedAchievements();
    expect(earned.some((a) => a.id === 'first-steps')).toBe(true);
  });

  it('should handle corrupted persistence data gracefully', () => {
    fakeStorage.setItem('nexus-station:achievements', '{invalid json');
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    const service = configureTestBed();

    expect(service.earnedCount()).toBe(0);
    expect(service.getAllAchievements().length).toBe(16);
    warnSpy.mockRestore();
  });

  it('should reset achievements and clear persistence', () => {
    const service = configureTestBed({
      gameProgression: { completedMissionCount: 1 },
    });

    service.checkAchievements();
    expect(service.earnedCount()).toBeGreaterThanOrEqual(1);

    service.resetAchievements();

    expect(service.earnedCount()).toBe(0);
    expect(service.getEarnedAchievements()).toEqual([]);
  });

  // --- Type coverage ---

  it('should have at least 5 of each achievement type', () => {
    const service = configureTestBed();
    const all = service.getAllAchievements();

    const byType = (type: AchievementType) => all.filter((a) => a.type === type);
    expect(byType('discovery').length).toBeGreaterThanOrEqual(5);
    expect(byType('mastery').length).toBeGreaterThanOrEqual(5);
    expect(byType('commitment').length).toBeGreaterThanOrEqual(5);
  });

  // --- Edge cases ---

  it('should evaluate "Elite" correctly with partial mastery', () => {
    // Elite requires 6 topics at 5 stars
    const masteryMap = new Map<MinigameId, number>([
      ['module-assembly', 5],
      ['wire-protocol', 5],
      ['flow-commander', 5],
      ['signal-corps', 4],  // not 5
      ['corridor-runner', 5],
      ['terminal-hack', 5],
      ['power-grid', 5],
    ]);

    const service = configureTestBed({
      mastery: { mastery: masteryMap },
    });

    const earned = service.checkAchievements();
    const elite = earned.find((a) => a.id === 'elite');

    // 6 topics at 5 stars (module-assembly, wire-protocol, flow-commander, corridor-runner, terminal-hack, power-grid)
    expect(elite).toBeDefined();
    expect(elite!.isEarned).toBe(true);
  });

  it('should NOT earn "Elite" when fewer than 6 topics at 5 stars', () => {
    const masteryMap = new Map<MinigameId, number>([
      ['module-assembly', 5],
      ['wire-protocol', 5],
      ['flow-commander', 5],
      ['signal-corps', 5],
      ['corridor-runner', 5],
      // Only 5 topics at 5 stars
    ]);

    const service = configureTestBed({
      mastery: { mastery: masteryMap },
    });

    const earned = service.checkAchievements();
    const elite = earned.find((a) => a.id === 'elite');
    expect(elite).toBeUndefined();
  });

  it('should earn "Star Collector" when totalStars >= 50', () => {
    const progress = new Map<string, LevelProgress>();
    // Create enough levels with stars to total >= 50
    for (let i = 0; i < 17; i++) {
      progress.set(`level-${i}`, makeLevelProgress({
        levelId: `level-${i}`,
        completed: true,
        starRating: 3,
      }));
    }

    const service = configureTestBed({
      levelProgression: { progress },
    });

    const earned = service.checkAchievements();
    const starCollector = earned.find((a) => a.id === 'star-collector');
    expect(starCollector).toBeDefined();
    expect(starCollector!.isEarned).toBe(true);
  });

  it('should earn "Explorer" when unlockedMinigames >= 4', () => {
    const service = configureTestBed({
      gameProgression: {
        unlockedMinigames: ['module-assembly', 'wire-protocol', 'flow-commander', 'signal-corps'],
      },
    });

    const earned = service.checkAchievements();
    const explorer = earned.find((a) => a.id === 'explorer');
    expect(explorer).toBeDefined();
    expect(explorer!.isEarned).toBe(true);
  });

  it('should set lastEarnedAchievement to the LAST in newly-earned array', () => {
    const progress = new Map<string, LevelProgress>();
    progress.set('l1', makeLevelProgress({ levelId: 'l1', completed: true, perfect: true, starRating: 3 }));

    const service = configureTestBed({
      gameProgression: { completedMissionCount: 1 },
      levelProgression: { progress },
      playTime: { totalPlayTime: 3600 },
    });

    const earned = service.checkAchievements();
    expect(earned.length).toBeGreaterThanOrEqual(2);

    // lastEarnedAchievement should be the last one in the array
    const last = service.lastEarnedAchievement();
    expect(last).not.toBeNull();
    expect(last!.id).toBe(earned[earned.length - 1].id);
  });
});
