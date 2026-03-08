import { TestBed } from '@angular/core/testing';
import {
  DifficultyTier,
  type MinigameId,
  type MinigameResult,
} from '../minigame/minigame.types';
import { GameStateService } from '../state';
import type { LevelDefinition } from './level.types';
import { LevelProgressionService } from './level-progression.service';
import type { LevelProgress } from './level-progression.service';

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

describe('LevelProgressionService', () => {
  let service: LevelProgressionService;
  let addXpSpy: ReturnType<typeof vi.fn>;
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

    const gameState = TestBed.inject(GameStateService);
    addXpSpy = vi.spyOn(gameState, 'addXp');

    service = TestBed.inject(LevelProgressionService);
  });

  afterEach(() => {
    Object.defineProperty(window, 'localStorage', {
      value: originalLocalStorage,
      writable: true,
      configurable: true,
    });
  });

  // --- Initialization ---

  describe('Initialization', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should have empty progress by default', () => {
      expect(service.progress().size).toBe(0);
    });

    it('should register levels without creating progress entries', () => {
      service.registerLevels(testLevels);
      expect(service.progress().size).toBe(0);
    });
  });

  // --- Registration ---

  describe('Registration', () => {
    it('should deduplicate levels on re-registration', () => {
      service.registerLevels(testLevels);
      service.registerLevels(testLevels);

      // Verify via getLevelProgress count — 5 unique levels for this gameId
      const progress = service.getLevelProgress(TEST_GAME_ID);
      expect(progress.length).toBe(5);
    });
  });

  // --- Unlock logic ---

  describe('Unlock logic', () => {
    beforeEach(() => {
      service.registerLevels(testLevels);
    });

    it('should return true for Basic tier levels (always unlocked)', () => {
      expect(service.isLevelUnlocked('ma-basic-01')).toBe(true);
    });

    it('should return false for Intermediate when no Basic completed', () => {
      expect(service.isLevelUnlocked('ma-inter-01')).toBe(false);
    });

    it('should return false for Intermediate when only some Basic completed', () => {
      service.completeLevel(
        makeResult({ levelId: 'ma-basic-01', score: 100 }),
      );
      expect(service.isLevelUnlocked('ma-inter-01')).toBe(false);
    });

    it('should return true for Intermediate when all Basic completed', () => {
      service.completeLevel(
        makeResult({ levelId: 'ma-basic-01', score: 100 }),
      );
      service.completeLevel(
        makeResult({ levelId: 'ma-basic-02', score: 100 }),
      );
      expect(service.isLevelUnlocked('ma-inter-01')).toBe(true);
    });

    it('should return false for Advanced when Intermediate not completed', () => {
      service.completeLevel(
        makeResult({ levelId: 'ma-basic-01', score: 100 }),
      );
      service.completeLevel(
        makeResult({ levelId: 'ma-basic-02', score: 100 }),
      );
      expect(service.isLevelUnlocked('ma-adv-01')).toBe(false);
    });

    it('should return true for Advanced when all Intermediate completed', () => {
      service.completeLevel(
        makeResult({ levelId: 'ma-basic-01', score: 100 }),
      );
      service.completeLevel(
        makeResult({ levelId: 'ma-basic-02', score: 100 }),
      );
      service.completeLevel(
        makeResult({ levelId: 'ma-inter-01', score: 100 }),
      );
      expect(service.isLevelUnlocked('ma-adv-01')).toBe(true);
    });

    it('should return false for unknown levelId', () => {
      expect(service.isLevelUnlocked('nonexistent')).toBe(false);
    });
  });

  // --- completeLevel ---

  describe('completeLevel', () => {
    beforeEach(() => {
      service.registerLevels(testLevels);
    });

    it('should mark level as completed on first completion', () => {
      service.completeLevel(makeResult({ levelId: 'ma-basic-01' }));
      const level = service.getLevel('ma-basic-01');
      expect(level).not.toBeNull();
      expect(level!.completed).toBe(true);
    });

    it('should update best score when new score is higher', () => {
      service.completeLevel(
        makeResult({ levelId: 'ma-basic-01', score: 100 }),
      );
      service.completeLevel(
        makeResult({ levelId: 'ma-basic-01', score: 200 }),
      );
      expect(service.getLevel('ma-basic-01')!.bestScore).toBe(200);
    });

    it('should not decrease best score when new score is lower', () => {
      service.completeLevel(
        makeResult({ levelId: 'ma-basic-01', score: 200 }),
      );
      service.completeLevel(
        makeResult({ levelId: 'ma-basic-01', score: 100 }),
      );
      expect(service.getLevel('ma-basic-01')!.bestScore).toBe(200);
    });

    it('should track perfect as sticky', () => {
      service.completeLevel(
        makeResult({ levelId: 'ma-basic-01', perfect: true }),
      );
      service.completeLevel(
        makeResult({ levelId: 'ma-basic-01', perfect: false }),
      );
      expect(service.getLevel('ma-basic-01')!.perfect).toBe(true);
    });

    it('should increment attempts on each completion', () => {
      service.completeLevel(makeResult({ levelId: 'ma-basic-01' }));
      service.completeLevel(makeResult({ levelId: 'ma-basic-01' }));
      service.completeLevel(makeResult({ levelId: 'ma-basic-01' }));
      expect(service.getLevel('ma-basic-01')!.attempts).toBe(3);
    });

    it('should call gameState.addXp with xpEarned', () => {
      service.completeLevel(
        makeResult({ levelId: 'ma-basic-01', xpEarned: 25 }),
      );
      expect(addXpSpy).toHaveBeenCalledWith(25);
    });
  });

  // --- Star rating ---

  describe('Star rating', () => {
    beforeEach(() => {
      service.registerLevels(testLevels);
    });

    it('should update starRating when new rating is higher', () => {
      service.completeLevel(
        makeResult({ levelId: 'ma-basic-01', starRating: 2 }),
      );
      expect(service.getLevel('ma-basic-01')!.starRating).toBe(2);

      service.completeLevel(
        makeResult({ levelId: 'ma-basic-01', starRating: 3 }),
      );
      expect(service.getLevel('ma-basic-01')!.starRating).toBe(3);

      service.completeLevel(
        makeResult({ levelId: 'ma-basic-01', starRating: 1 }),
      );
      expect(service.getLevel('ma-basic-01')!.starRating).toBe(3);
    });
  });

  // --- getLevelProgress ---

  describe('getLevelProgress', () => {
    beforeEach(() => {
      service.registerLevels(testLevels);
    });

    it('should return progress for all levels in a minigame', () => {
      const progress = service.getLevelProgress(TEST_GAME_ID);
      expect(progress.length).toBe(5);
    });

    it('should return default progress for uncompleted levels', () => {
      const progress = service.getLevelProgress(TEST_GAME_ID);
      for (const entry of progress) {
        expect(entry.completed).toBe(false);
        expect(entry.bestScore).toBe(0);
        expect(entry.starRating).toBe(0);
        expect(entry.attempts).toBe(0);
      }
    });
  });

  // --- getTierProgress ---

  describe('getTierProgress', () => {
    beforeEach(() => {
      service.registerLevels(testLevels);
    });

    it('should return 0 when no levels completed', () => {
      expect(service.getTierProgress(TEST_GAME_ID, DifficultyTier.Basic)).toBe(
        0,
      );
    });

    it('should return 0.5 when half completed', () => {
      service.completeLevel(
        makeResult({ levelId: 'ma-basic-01', score: 100 }),
      );
      expect(service.getTierProgress(TEST_GAME_ID, DifficultyTier.Basic)).toBe(
        0.5,
      );
    });

    it('should return 1 when all completed', () => {
      service.completeLevel(
        makeResult({ levelId: 'ma-basic-01', score: 100 }),
      );
      service.completeLevel(
        makeResult({ levelId: 'ma-basic-02', score: 100 }),
      );
      expect(service.getTierProgress(TEST_GAME_ID, DifficultyTier.Basic)).toBe(
        1,
      );
    });
  });

  // --- getLevelDefinition ---

  describe('getLevelDefinition', () => {
    beforeEach(() => {
      service.registerLevels(testLevels);
    });

    it('should return definition for registered level', () => {
      const def = service.getLevelDefinition('ma-basic-01');
      expect(def).not.toBeNull();
      expect(def!.levelId).toBe('ma-basic-01');
      expect(def!.gameId).toBe(TEST_GAME_ID);
      expect(def!.tier).toBe(DifficultyTier.Basic);
    });

    it('should return null for unknown levelId', () => {
      expect(service.getLevelDefinition('nonexistent')).toBeNull();
    });
  });

  // --- resetProgress ---

  describe('resetProgress', () => {
    it('should reset progress signal to empty map', () => {
      service.registerLevels(testLevels);
      service.completeLevel(makeResult({ levelId: 'ma-basic-01' }));
      expect(service.progress().size).toBe(1);

      service.resetProgress();
      expect(service.progress().size).toBe(0);
    });
  });

  // --- Persistence ---

  describe('persistence', () => {
    const STORAGE_KEY = 'nexus-station:level-progression';

    function seedProgress(data: Record<string, unknown>): void {
      fakeStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }

    function validEntry(overrides: Partial<LevelProgress> = {}): LevelProgress {
      return {
        levelId: 'ma-basic-01',
        completed: true,
        bestScore: 200,
        starRating: 3,
        perfect: false,
        attempts: 5,
        ...overrides,
      };
    }

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should load saved progress from localStorage on init', () => {
      const entry = validEntry();
      seedProgress({ 'ma-basic-01': entry });

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({});
      const svc = TestBed.inject(LevelProgressionService);

      const loaded = svc.getLevel('ma-basic-01');
      expect(loaded).not.toBeNull();
      expect(loaded!.levelId).toBe('ma-basic-01');
      expect(loaded!.completed).toBe(true);
      expect(loaded!.bestScore).toBe(200);
      expect(loaded!.starRating).toBe(3);
      expect(loaded!.perfect).toBe(false);
      expect(loaded!.attempts).toBe(5);
    });

    it('should auto-save progress after debounce', () => {
      vi.useFakeTimers();
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({});

      const svc = TestBed.inject(LevelProgressionService);
      vi.clearAllTimers();

      svc.registerLevels(testLevels);
      svc.completeLevel(makeResult({ levelId: 'ma-basic-01', score: 150, xpEarned: 10 }));
      TestBed.flushEffects();

      // Before debounce -- not saved yet
      const before = fakeStorage.getItem(STORAGE_KEY);
      expect(before).toBeNull();

      vi.advanceTimersByTime(500);

      const after = fakeStorage.getItem(STORAGE_KEY);
      expect(after).not.toBeNull();
      const parsed = JSON.parse(after!);
      expect(parsed['ma-basic-01']).toBeDefined();
      expect(parsed['ma-basic-01'].bestScore).toBe(150);
      expect(parsed['ma-basic-01'].completed).toBe(true);
    });

    it('should debounce rapid changes into a single save', () => {
      vi.useFakeTimers();
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({});

      const svc = TestBed.inject(LevelProgressionService);
      vi.clearAllTimers();

      svc.registerLevels(testLevels);
      svc.completeLevel(makeResult({ levelId: 'ma-basic-01', score: 100, xpEarned: 10 }));
      TestBed.flushEffects();
      svc.completeLevel(makeResult({ levelId: 'ma-basic-02', score: 200, xpEarned: 10 }));
      TestBed.flushEffects();
      svc.completeLevel(makeResult({ levelId: 'ma-inter-01', score: 300, xpEarned: 10 }));
      TestBed.flushEffects();

      vi.advanceTimersByTime(500);

      const stored = fakeStorage.getItem(STORAGE_KEY);
      expect(stored).not.toBeNull();
      const parsed = JSON.parse(stored!);
      expect(Object.keys(parsed).length).toBe(3);
      expect(parsed['ma-basic-01']).toBeDefined();
      expect(parsed['ma-basic-02']).toBeDefined();
      expect(parsed['ma-inter-01']).toBeDefined();
    });

    it('should handle corrupted JSON data gracefully', () => {
      fakeStorage.setItem(STORAGE_KEY, '{invalid json');
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({});
      const svc = TestBed.inject(LevelProgressionService);

      expect(svc.progress().size).toBe(0);
      warnSpy.mockRestore();
    });

    it('should handle wrong shape (not an object) gracefully', () => {
      fakeStorage.setItem(STORAGE_KEY, '42');

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({});
      const svc = TestBed.inject(LevelProgressionService);

      expect(svc.progress().size).toBe(0);
    });

    it('should discard entries with invalid field types', () => {
      seedProgress({
        'bad-score': {
          levelId: 'bad-score',
          completed: true,
          bestScore: 'not-a-number',
          starRating: 2,
          perfect: false,
          attempts: 1,
        },
        'bad-completed': {
          levelId: 'bad-completed',
          completed: 42,
          bestScore: 100,
          starRating: 2,
          perfect: false,
          attempts: 1,
        },
        'missing-levelId': {
          completed: true,
          bestScore: 100,
          starRating: 2,
          perfect: false,
          attempts: 1,
        },
        'valid-entry': validEntry({ levelId: 'valid-entry' }),
      });

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({});
      const svc = TestBed.inject(LevelProgressionService);

      expect(svc.progress().size).toBe(1);
      expect(svc.getLevel('valid-entry')).not.toBeNull();
      expect(svc.getLevel('bad-score')).toBeNull();
      expect(svc.getLevel('bad-completed')).toBeNull();
      expect(svc.getLevel('missing-levelId')).toBeNull();
    });

    it('should not overwrite persisted progress when registerLevels is called', () => {
      seedProgress({
        'ma-basic-01': validEntry({
          levelId: 'ma-basic-01',
          completed: true,
          bestScore: 200,
        }),
      });

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({});
      const svc = TestBed.inject(LevelProgressionService);

      svc.registerLevels(testLevels);

      const progress = svc.getLevel('ma-basic-01');
      expect(progress).not.toBeNull();
      expect(progress!.completed).toBe(true);
      expect(progress!.bestScore).toBe(200);
    });

    it('should clear persistence on resetProgress', () => {
      seedProgress({
        'ma-basic-01': validEntry(),
      });

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({});
      const svc = TestBed.inject(LevelProgressionService);

      expect(svc.progress().size).toBe(1);

      svc.resetProgress();

      expect(svc.progress().size).toBe(0);
      expect(fakeStorage.getItem(STORAGE_KEY)).toBeNull();
    });
  });
});
