import { TestBed } from '@angular/core/testing';
import { LevelProgressionService, type LevelDefinition } from '../levels';
import {
  DifficultyTier,
  type MinigameId,
  type MinigameResult,
} from '../minigame/minigame.types';

// --- Test fixtures ---

const TEST_GAME_ID: MinigameId = 'module-assembly';
const STORAGE_KEY = 'nexus-station:level-progression';

const testLevels: LevelDefinition<unknown>[] = [
  { levelId: 'ma-basic-01', gameId: TEST_GAME_ID, tier: DifficultyTier.Basic, order: 1, title: 'L1', conceptIntroduced: 'c1', description: 'd1', data: {} },
  { levelId: 'ma-basic-02', gameId: TEST_GAME_ID, tier: DifficultyTier.Basic, order: 2, title: 'L2', conceptIntroduced: 'c2', description: 'd2', data: {} },
  { levelId: 'ma-inter-01', gameId: TEST_GAME_ID, tier: DifficultyTier.Intermediate, order: 1, title: 'L3', conceptIntroduced: 'c3', description: 'd3', data: {} },
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
    removeItem: (key: string) => { store.delete(key); },
    clear: () => store.clear(),
    key: (i: number) => [...store.keys()][i] ?? null,
    get length() { return store.size; },
  } as Storage;
}

// --- Integration tests ---

describe('LevelProgressionService persistence round-trip', () => {
  let fakeStorage: Storage;
  let originalLocalStorage: Storage;
  let service: LevelProgressionService;

  /**
   * Flushes effects, advances timers to fire the debounced save,
   * destroys the TestBed, reconfigures, re-binds fakeStorage,
   * and returns a fresh LevelProgressionService instance.
   */
  function persistAndRecreate(): LevelProgressionService {
    // 1. Flush Angular effects (schedules the debounced setTimeout)
    TestBed.flushEffects();
    // 2. Fire the debounced save timer (writes to localStorage)
    vi.advanceTimersByTime(600);

    // 3. Destroy all services
    TestBed.resetTestingModule();
    // 4. Reconfigure fresh injector
    TestBed.configureTestingModule({});
    // 5. Re-bind fakeStorage (required before every TestBed.inject after reset)
    Object.defineProperty(window, 'localStorage', {
      value: fakeStorage,
      writable: true,
      configurable: true,
    });
    // 6. Cancel init-triggered debounce from new service's constructor effect
    vi.clearAllTimers();
    // 7. Inject fresh service
    return TestBed.inject(LevelProgressionService);
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

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});

    service = TestBed.inject(LevelProgressionService);
    service.registerLevels(testLevels);
  });

  afterEach(() => {
    vi.runAllTimers();
    vi.useRealTimers();
    Object.defineProperty(window, 'localStorage', {
      value: originalLocalStorage,
      writable: true,
      configurable: true,
    });
  });

  it('persists level progress to localStorage after completing 3 levels', () => {
    service.completeLevel(makeResult({ levelId: 'ma-basic-01', score: 150, starRating: 3, perfect: false, xpEarned: 15 }));
    service.completeLevel(makeResult({ levelId: 'ma-basic-02', score: 250, starRating: 4, perfect: true, xpEarned: 15 }));
    service.completeLevel(makeResult({ levelId: 'ma-inter-01', score: 80, starRating: 2, perfect: false, xpEarned: 20 }));

    TestBed.flushEffects();
    vi.advanceTimersByTime(600);

    const raw = fakeStorage.getItem(STORAGE_KEY);
    expect(raw).not.toBeNull();

    const parsed = JSON.parse(raw!);
    expect(Object.keys(parsed)).toHaveLength(3);

    expect(parsed['ma-basic-01'].bestScore).toBe(150);
    expect(parsed['ma-basic-01'].starRating).toBe(3);
    expect(parsed['ma-basic-01'].completed).toBe(true);
    expect(parsed['ma-basic-01'].perfect).toBe(false);
    expect(parsed['ma-basic-01'].attempts).toBe(1);

    expect(parsed['ma-basic-02'].bestScore).toBe(250);
    expect(parsed['ma-basic-02'].starRating).toBe(4);
    expect(parsed['ma-basic-02'].completed).toBe(true);
    expect(parsed['ma-basic-02'].perfect).toBe(true);
    expect(parsed['ma-basic-02'].attempts).toBe(1);

    expect(parsed['ma-inter-01'].bestScore).toBe(80);
    expect(parsed['ma-inter-01'].starRating).toBe(2);
    expect(parsed['ma-inter-01'].completed).toBe(true);
    expect(parsed['ma-inter-01'].perfect).toBe(false);
    expect(parsed['ma-inter-01'].attempts).toBe(1);
  });

  it('restores all level progress after service destruction and re-creation (including multi-attempt)', () => {
    // Phase 1: Complete 3 levels. Complete ma-basic-01 twice to test multi-attempt fields.
    service.completeLevel(makeResult({ levelId: 'ma-basic-01', score: 100, starRating: 3, perfect: true, xpEarned: 15 }));
    service.completeLevel(makeResult({ levelId: 'ma-basic-01', score: 200, starRating: 4, perfect: false, xpEarned: 15 }));
    service.completeLevel(makeResult({ levelId: 'ma-basic-02', score: 250, starRating: 4, perfect: true, xpEarned: 15 }));
    service.completeLevel(makeResult({ levelId: 'ma-inter-01', score: 80, starRating: 2, perfect: false, xpEarned: 20 }));

    // Phase 2: Persist, destroy, recreate
    const restored = persistAndRecreate();

    expect(restored.progress().size).toBe(3);

    // ma-basic-01: bestScore=200 (higher wins), starRating=4 (higher wins), attempts=2, perfect=true (sticky)
    const level1 = restored.getLevel('ma-basic-01');
    expect(level1).not.toBeNull();
    expect(level1!.completed).toBe(true);
    expect(level1!.bestScore).toBe(200);
    expect(level1!.starRating).toBe(4);
    expect(level1!.perfect).toBe(true);
    expect(level1!.attempts).toBe(2);

    // ma-basic-02: single attempt
    const level2 = restored.getLevel('ma-basic-02');
    expect(level2).not.toBeNull();
    expect(level2!.completed).toBe(true);
    expect(level2!.bestScore).toBe(250);
    expect(level2!.starRating).toBe(4);
    expect(level2!.perfect).toBe(true);
    expect(level2!.attempts).toBe(1);

    // ma-inter-01: single attempt
    const level3 = restored.getLevel('ma-inter-01');
    expect(level3).not.toBeNull();
    expect(level3!.completed).toBe(true);
    expect(level3!.bestScore).toBe(80);
    expect(level3!.starRating).toBe(2);
    expect(level3!.perfect).toBe(false);
    expect(level3!.attempts).toBe(1);
  });

  it('registering the same levels after restore does not overwrite persisted progress', () => {
    // Phase 1: Complete levels, persist, destroy, recreate
    service.completeLevel(makeResult({ levelId: 'ma-basic-01', score: 150, starRating: 3, perfect: false, xpEarned: 15 }));
    service.completeLevel(makeResult({ levelId: 'ma-basic-02', score: 250, starRating: 4, perfect: true, xpEarned: 15 }));
    service.completeLevel(makeResult({ levelId: 'ma-inter-01', score: 80, starRating: 2, perfect: false, xpEarned: 20 }));

    const restored = persistAndRecreate();

    // Phase 2: Re-register the same levels
    restored.registerLevels(testLevels);

    // Assert: progress is unchanged
    const level1 = restored.getLevel('ma-basic-01');
    expect(level1).not.toBeNull();
    expect(level1!.completed).toBe(true);
    expect(level1!.bestScore).toBe(150);
    expect(level1!.starRating).toBe(3);
    expect(level1!.attempts).toBe(1);

    const level2 = restored.getLevel('ma-basic-02');
    expect(level2).not.toBeNull();
    expect(level2!.completed).toBe(true);
    expect(level2!.bestScore).toBe(250);
    expect(level2!.perfect).toBe(true);

    const level3 = restored.getLevel('ma-inter-01');
    expect(level3).not.toBeNull();
    expect(level3!.completed).toBe(true);
    expect(level3!.bestScore).toBe(80);
  });

  it('corrupted localStorage data results in empty progress on fresh service', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    // Write invalid JSON to the storage key
    fakeStorage.setItem(STORAGE_KEY, '{invalid json!!!');

    // Create a fresh service that will attempt to load the corrupted data
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    Object.defineProperty(window, 'localStorage', {
      value: fakeStorage,
      writable: true,
      configurable: true,
    });
    vi.clearAllTimers();
    const fresh = TestBed.inject(LevelProgressionService);

    expect(fresh.progress().size).toBe(0);

    warnSpy.mockRestore();
  });
});
