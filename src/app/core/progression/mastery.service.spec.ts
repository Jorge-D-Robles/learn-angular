import { TestBed } from '@angular/core/testing';
import {
  DifficultyTier,
  type MinigameId,
  type MinigameResult,
} from '../minigame/minigame.types';
import type { LevelDefinition } from '../levels/level.types';
import { LevelProgressionService } from '../levels/level-progression.service';
import { MasteryService } from './mastery.service';

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
    xpEarned: 15,
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

describe('MasteryService', () => {
  let service: MasteryService;
  let levelService: LevelProgressionService;
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

    levelService = TestBed.inject(LevelProgressionService);
    levelService.registerLevels(testLevels);
    service = TestBed.inject(MasteryService);
  });

  afterEach(() => {
    Object.defineProperty(window, 'localStorage', {
      value: originalLocalStorage,
      writable: true,
      configurable: true,
    });
  });

  // --- Initialization ---

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return 0 for a topic with no progress', () => {
    expect(service.getMastery(TEST_GAME_ID)).toBe(0);
  });

  it('should return empty map from getAllMastery() initially', () => {
    expect(service.getAllMastery().size).toBe(0);
  });

  // --- Star 0: Not started ---

  it('should return 0 when no levels completed for a minigame', () => {
    service.updateMastery(TEST_GAME_ID);
    expect(service.getMastery(TEST_GAME_ID)).toBe(0);
  });

  // --- Star 1: At least one level completed ---

  it('should return 1 when one basic level is completed', () => {
    levelService.completeLevel(makeResult({ levelId: 'ma-basic-01' }));
    service.updateMastery(TEST_GAME_ID);
    expect(service.getMastery(TEST_GAME_ID)).toBe(1);
  });

  it('should return 1 when some but not all basic levels are completed', () => {
    levelService.completeLevel(makeResult({ levelId: 'ma-basic-01' }));
    service.updateMastery(TEST_GAME_ID);
    expect(service.getMastery(TEST_GAME_ID)).toBe(1);
  });

  // --- Star 2: All Basic levels completed ---

  it('should return 2 when all basic levels are completed', () => {
    levelService.completeLevel(makeResult({ levelId: 'ma-basic-01' }));
    levelService.completeLevel(makeResult({ levelId: 'ma-basic-02' }));
    service.updateMastery(TEST_GAME_ID);
    expect(service.getMastery(TEST_GAME_ID)).toBe(2);
  });

  it('should return 2 when all basic and some intermediate are completed', () => {
    levelService.completeLevel(makeResult({ levelId: 'ma-basic-01' }));
    levelService.completeLevel(makeResult({ levelId: 'ma-basic-02' }));
    levelService.completeLevel(makeResult({ levelId: 'ma-inter-01' }));
    service.updateMastery(TEST_GAME_ID);
    expect(service.getMastery(TEST_GAME_ID)).toBe(2);
  });

  // --- Star 3: All Advanced levels completed ---

  it('should return 3 when all levels through advanced are completed', () => {
    levelService.completeLevel(makeResult({ levelId: 'ma-basic-01' }));
    levelService.completeLevel(makeResult({ levelId: 'ma-basic-02' }));
    levelService.completeLevel(makeResult({ levelId: 'ma-inter-01' }));
    levelService.completeLevel(makeResult({ levelId: 'ma-adv-01' }));
    service.updateMastery(TEST_GAME_ID);
    expect(service.getMastery(TEST_GAME_ID)).toBe(3);
  });

  // --- Star 4: Boss level completed ---

  it('should return 4 when boss level is completed (implies all prior tiers)', () => {
    levelService.completeLevel(makeResult({ levelId: 'ma-basic-01' }));
    levelService.completeLevel(makeResult({ levelId: 'ma-basic-02' }));
    levelService.completeLevel(makeResult({ levelId: 'ma-inter-01' }));
    levelService.completeLevel(makeResult({ levelId: 'ma-adv-01' }));
    levelService.completeLevel(makeResult({ levelId: 'ma-boss-01' }));
    service.updateMastery(TEST_GAME_ID);
    expect(service.getMastery(TEST_GAME_ID)).toBe(4);
  });

  // --- Star 5: All levels perfected ---

  it('should return 5 when all levels are completed with perfect scores', () => {
    levelService.completeLevel(makeResult({ levelId: 'ma-basic-01', perfect: true }));
    levelService.completeLevel(makeResult({ levelId: 'ma-basic-02', perfect: true }));
    levelService.completeLevel(makeResult({ levelId: 'ma-inter-01', perfect: true }));
    levelService.completeLevel(makeResult({ levelId: 'ma-adv-01', perfect: true }));
    levelService.completeLevel(makeResult({ levelId: 'ma-boss-01', perfect: true }));
    service.updateMastery(TEST_GAME_ID);
    expect(service.getMastery(TEST_GAME_ID)).toBe(5);
  });

  it('should return 4 when all levels completed but not all perfect', () => {
    levelService.completeLevel(makeResult({ levelId: 'ma-basic-01', perfect: true }));
    levelService.completeLevel(makeResult({ levelId: 'ma-basic-02', perfect: false }));
    levelService.completeLevel(makeResult({ levelId: 'ma-inter-01', perfect: true }));
    levelService.completeLevel(makeResult({ levelId: 'ma-adv-01', perfect: true }));
    levelService.completeLevel(makeResult({ levelId: 'ma-boss-01', perfect: true }));
    service.updateMastery(TEST_GAME_ID);
    expect(service.getMastery(TEST_GAME_ID)).toBe(4);
  });

  // --- getAllMastery ---

  it('should return mastery map with entries for updated topics', () => {
    levelService.completeLevel(makeResult({ levelId: 'ma-basic-01' }));
    service.updateMastery(TEST_GAME_ID);
    const all = service.getAllMastery();
    expect(all.size).toBe(1);
    expect(all.get(TEST_GAME_ID)).toBe(1);
  });

  it('should return 0 for topics not yet updated', () => {
    const other: MinigameId = 'wire-protocol';
    expect(service.getMastery(other)).toBe(0);
  });

  // --- Persistence ---

  describe('persistence', () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it('should load saved mastery from localStorage on init', () => {
      fakeStorage.setItem(
        'nexus-station:mastery',
        JSON.stringify({ 'module-assembly': 3 }),
      );

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({});
      const svc = TestBed.inject(MasteryService);

      expect(svc.getMastery('module-assembly')).toBe(3);
    });

    it('should auto-save mastery after debounce', () => {
      vi.useFakeTimers();
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({});

      const lvlService = TestBed.inject(LevelProgressionService);
      lvlService.registerLevels(testLevels);
      const svc = TestBed.inject(MasteryService);
      vi.clearAllTimers();

      lvlService.completeLevel(makeResult({ levelId: 'ma-basic-01' }));
      svc.updateMastery(TEST_GAME_ID);
      TestBed.flushEffects();

      // Before debounce -- not saved yet
      const before = fakeStorage.getItem('nexus-station:mastery');
      expect(before).toBeNull();

      vi.advanceTimersByTime(500);

      const after = fakeStorage.getItem('nexus-station:mastery');
      expect(after).not.toBeNull();
      const parsed = JSON.parse(after!);
      expect(parsed['module-assembly']).toBe(1);
    });

    it('should handle corrupted saved data gracefully', () => {
      fakeStorage.setItem('nexus-station:mastery', '{invalid json');
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({});
      const svc = TestBed.inject(MasteryService);

      expect(svc.getMastery(TEST_GAME_ID)).toBe(0);
      expect(svc.getAllMastery().size).toBe(0);
      warnSpy.mockRestore();
    });

    it('should drop invalid keys from saved data', () => {
      fakeStorage.setItem(
        'nexus-station:mastery',
        JSON.stringify({ 'invalid-game-id': 3, 'module-assembly': 2 }),
      );

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({});
      const svc = TestBed.inject(MasteryService);

      expect(svc.getMastery('module-assembly')).toBe(2);
      expect(svc.getAllMastery().size).toBe(1);
    });

    it('should drop out-of-range values from saved data', () => {
      fakeStorage.setItem(
        'nexus-station:mastery',
        JSON.stringify({ 'module-assembly': 7, 'wire-protocol': -1, 'signal-corps': 'not-a-number' }),
      );

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({});
      const svc = TestBed.inject(MasteryService);

      expect(svc.getAllMastery().size).toBe(0);
    });

    it('should clear persisted state on resetMastery()', () => {
      fakeStorage.setItem(
        'nexus-station:mastery',
        JSON.stringify({ 'module-assembly': 3 }),
      );

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({});
      const svc = TestBed.inject(MasteryService);
      expect(svc.getMastery('module-assembly')).toBe(3);

      svc.resetMastery();

      expect(svc.getMastery('module-assembly')).toBe(0);
      expect(svc.getAllMastery().size).toBe(0);
      expect(fakeStorage.getItem('nexus-station:mastery')).toBeNull();
    });
  });

  // --- Edge cases ---

  it('should not decrease mastery on re-update (mastery only goes up via updateMastery)', () => {
    // Complete all levels -> star 4
    levelService.completeLevel(makeResult({ levelId: 'ma-basic-01' }));
    levelService.completeLevel(makeResult({ levelId: 'ma-basic-02' }));
    levelService.completeLevel(makeResult({ levelId: 'ma-inter-01' }));
    levelService.completeLevel(makeResult({ levelId: 'ma-adv-01' }));
    levelService.completeLevel(makeResult({ levelId: 'ma-boss-01' }));
    service.updateMastery(TEST_GAME_ID);
    expect(service.getMastery(TEST_GAME_ID)).toBe(4);

    // Reset level progress -> raw calculation would be 0
    levelService.resetProgress();
    service.updateMastery(TEST_GAME_ID);

    // But mastery should stay at 4 (never decreases via updateMastery)
    expect(service.getMastery(TEST_GAME_ID)).toBe(4);
  });

  it('should return 0 for unknown topicId', () => {
    expect(service.getMastery('blast-doors')).toBe(0);
  });

  // --- ensureMinimumMastery ---

  describe('ensureMinimumMastery', () => {
    it('should set mastery to minStars when current is 0', () => {
      expect(service.getMastery('wire-protocol')).toBe(0);
      service.ensureMinimumMastery('wire-protocol', 1);
      expect(service.getMastery('wire-protocol')).toBe(1);
    });

    it('should be a no-op when current mastery >= minStars', () => {
      // Set mastery to 3 via level completions
      levelService.completeLevel(makeResult({ levelId: 'ma-basic-01' }));
      levelService.completeLevel(makeResult({ levelId: 'ma-basic-02' }));
      levelService.completeLevel(makeResult({ levelId: 'ma-inter-01' }));
      levelService.completeLevel(makeResult({ levelId: 'ma-adv-01' }));
      service.updateMastery(TEST_GAME_ID);
      expect(service.getMastery(TEST_GAME_ID)).toBe(3);

      service.ensureMinimumMastery(TEST_GAME_ID, 1);
      expect(service.getMastery(TEST_GAME_ID)).toBe(3);
    });

    it('should set mastery to minStars when current is lower', () => {
      expect(service.getMastery('signal-corps')).toBe(0);
      service.ensureMinimumMastery('signal-corps', 2);
      expect(service.getMastery('signal-corps')).toBe(2);
    });

    it('should persist the change via auto-save', () => {
      vi.useFakeTimers();

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({});
      const svc = TestBed.inject(MasteryService);
      vi.clearAllTimers();

      svc.ensureMinimumMastery('wire-protocol', 1);
      TestBed.flushEffects();

      vi.advanceTimersByTime(500);

      const saved = fakeStorage.getItem('nexus-station:mastery');
      expect(saved).not.toBeNull();
      const parsed = JSON.parse(saved!);
      expect(parsed['wire-protocol']).toBe(1);

      vi.useRealTimers();
    });
  });
});
