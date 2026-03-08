import { TestBed } from '@angular/core/testing';
import { XpDiminishingReturnsService } from './xp-diminishing-returns.service';

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

describe('XpDiminishingReturnsService', () => {
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

  // --- Initialization tests ---

  describe('initialization', () => {
    it('should be created', () => {
      const service = TestBed.inject(XpDiminishingReturnsService);
      expect(service).toBeTruthy();
    });

    it('should return multiplier 1.0 for unknown level (first play)', () => {
      const service = TestBed.inject(XpDiminishingReturnsService);
      expect(service.getReplayMultiplier('module-assembly', 'ma-basic-01')).toBe(1.0);
    });

    it('should return completion count 0 for unknown level', () => {
      const service = TestBed.inject(XpDiminishingReturnsService);
      expect(service.getCompletionCount('module-assembly', 'ma-basic-01')).toBe(0);
    });

    it('should return best star rating 0 for unknown level', () => {
      const service = TestBed.inject(XpDiminishingReturnsService);
      expect(service.getBestStarRating('module-assembly', 'ma-basic-01')).toBe(0);
    });
  });

  // --- getReplayMultiplier tests ---

  describe('getReplayMultiplier', () => {
    it('should return 1.0 before any completions', () => {
      const service = TestBed.inject(XpDiminishingReturnsService);
      expect(service.getReplayMultiplier('module-assembly', 'ma-basic-01')).toBe(1.0);
    });

    it('should return 0.5 after 1 completion', () => {
      const service = TestBed.inject(XpDiminishingReturnsService);
      service.recordCompletion('module-assembly', 'ma-basic-01', 3);
      expect(service.getReplayMultiplier('module-assembly', 'ma-basic-01')).toBe(0.5);
    });

    it('should return 0.25 after 2 completions', () => {
      const service = TestBed.inject(XpDiminishingReturnsService);
      service.recordCompletion('module-assembly', 'ma-basic-01', 3);
      service.recordCompletion('module-assembly', 'ma-basic-01', 3);
      expect(service.getReplayMultiplier('module-assembly', 'ma-basic-01')).toBe(0.25);
    });

    it('should return 0.1 after 3 completions', () => {
      const service = TestBed.inject(XpDiminishingReturnsService);
      service.recordCompletion('module-assembly', 'ma-basic-01', 3);
      service.recordCompletion('module-assembly', 'ma-basic-01', 3);
      service.recordCompletion('module-assembly', 'ma-basic-01', 3);
      expect(service.getReplayMultiplier('module-assembly', 'ma-basic-01')).toBe(0.1);
    });

    it('should return 0.1 after 10 completions (floor)', () => {
      const service = TestBed.inject(XpDiminishingReturnsService);
      for (let i = 0; i < 10; i++) {
        service.recordCompletion('module-assembly', 'ma-basic-01', 3);
      }
      expect(service.getReplayMultiplier('module-assembly', 'ma-basic-01')).toBe(0.1);
    });
  });

  // --- recordCompletion tests ---

  describe('recordCompletion', () => {
    it('should return multiplier 1.0 on first completion', () => {
      const service = TestBed.inject(XpDiminishingReturnsService);
      const result = service.recordCompletion('module-assembly', 'ma-basic-01', 2);
      expect(result.replayMultiplier).toBe(1.0);
    });

    it('should return multiplier 0.5 on second completion', () => {
      const service = TestBed.inject(XpDiminishingReturnsService);
      service.recordCompletion('module-assembly', 'ma-basic-01', 2);
      const result = service.recordCompletion('module-assembly', 'ma-basic-01', 2);
      expect(result.replayMultiplier).toBe(0.5);
    });

    it('should return multiplier 0.25 on third completion', () => {
      const service = TestBed.inject(XpDiminishingReturnsService);
      service.recordCompletion('module-assembly', 'ma-basic-01', 2);
      service.recordCompletion('module-assembly', 'ma-basic-01', 2);
      const result = service.recordCompletion('module-assembly', 'ma-basic-01', 2);
      expect(result.replayMultiplier).toBe(0.25);
    });

    it('should return multiplier 0.1 on fourth completion', () => {
      const service = TestBed.inject(XpDiminishingReturnsService);
      for (let i = 0; i < 3; i++) {
        service.recordCompletion('module-assembly', 'ma-basic-01', 2);
      }
      const result = service.recordCompletion('module-assembly', 'ma-basic-01', 2);
      expect(result.replayMultiplier).toBe(0.1);
    });

    it('should increment completion count', () => {
      const service = TestBed.inject(XpDiminishingReturnsService);
      const r1 = service.recordCompletion('module-assembly', 'ma-basic-01', 2);
      expect(r1.completionCount).toBe(1);
      const r2 = service.recordCompletion('module-assembly', 'ma-basic-01', 2);
      expect(r2.completionCount).toBe(2);
      const r3 = service.recordCompletion('module-assembly', 'ma-basic-01', 2);
      expect(r3.completionCount).toBe(3);
    });

    it('should track best star rating', () => {
      const service = TestBed.inject(XpDiminishingReturnsService);
      service.recordCompletion('module-assembly', 'ma-basic-01', 2);
      expect(service.getBestStarRating('module-assembly', 'ma-basic-01')).toBe(2);
      service.recordCompletion('module-assembly', 'ma-basic-01', 4);
      expect(service.getBestStarRating('module-assembly', 'ma-basic-01')).toBe(4);
    });

    it('should not decrease best star rating on lower replay', () => {
      const service = TestBed.inject(XpDiminishingReturnsService);
      service.recordCompletion('module-assembly', 'ma-basic-01', 4);
      service.recordCompletion('module-assembly', 'ma-basic-01', 2);
      expect(service.getBestStarRating('module-assembly', 'ma-basic-01')).toBe(4);
    });
  });

  // --- Star improvement exception tests ---

  describe('star improvement exception', () => {
    it('should report starImprovement=true when new rating exceeds previous best', () => {
      const service = TestBed.inject(XpDiminishingReturnsService);
      service.recordCompletion('module-assembly', 'ma-basic-01', 2);
      const result = service.recordCompletion('module-assembly', 'ma-basic-01', 3);
      expect(result.starImprovement).toBe(true);
    });

    it('should report correct starDelta (e.g., 2->3 = delta 1)', () => {
      const service = TestBed.inject(XpDiminishingReturnsService);
      service.recordCompletion('module-assembly', 'ma-basic-01', 2);
      const result = service.recordCompletion('module-assembly', 'ma-basic-01', 3);
      expect(result.starDelta).toBe(1);
    });

    it('should report starImprovement=false when rating equals previous best', () => {
      const service = TestBed.inject(XpDiminishingReturnsService);
      service.recordCompletion('module-assembly', 'ma-basic-01', 3);
      const result = service.recordCompletion('module-assembly', 'ma-basic-01', 3);
      expect(result.starImprovement).toBe(false);
    });

    it('should report starImprovement=false when rating is lower than previous best', () => {
      const service = TestBed.inject(XpDiminishingReturnsService);
      service.recordCompletion('module-assembly', 'ma-basic-01', 4);
      const result = service.recordCompletion('module-assembly', 'ma-basic-01', 2);
      expect(result.starImprovement).toBe(false);
    });

    it('should report starDelta=0 when no improvement', () => {
      const service = TestBed.inject(XpDiminishingReturnsService);
      service.recordCompletion('module-assembly', 'ma-basic-01', 3);
      const result = service.recordCompletion('module-assembly', 'ma-basic-01', 3);
      expect(result.starDelta).toBe(0);
    });

    it('should report starImprovement=true and correct delta on first completion', () => {
      const service = TestBed.inject(XpDiminishingReturnsService);
      const result = service.recordCompletion('module-assembly', 'ma-basic-01', 2);
      expect(result.starImprovement).toBe(true);
      expect(result.starDelta).toBe(2);
    });
  });

  // --- Isolation between levels tests ---

  describe('isolation between levels', () => {
    it('should track completions independently per level', () => {
      const service = TestBed.inject(XpDiminishingReturnsService);
      service.recordCompletion('module-assembly', 'ma-basic-01', 3);
      service.recordCompletion('module-assembly', 'ma-basic-01', 3);

      expect(service.getCompletionCount('module-assembly', 'ma-basic-01')).toBe(2);
      expect(service.getCompletionCount('module-assembly', 'ma-basic-02')).toBe(0);
      expect(service.getReplayMultiplier('module-assembly', 'ma-basic-02')).toBe(1.0);
    });

    it('should track completions independently per game', () => {
      const service = TestBed.inject(XpDiminishingReturnsService);
      service.recordCompletion('module-assembly', 'level-01', 3);
      service.recordCompletion('module-assembly', 'level-01', 3);

      expect(service.getCompletionCount('module-assembly', 'level-01')).toBe(2);
      expect(service.getCompletionCount('wire-protocol', 'level-01')).toBe(0);
      expect(service.getReplayMultiplier('wire-protocol', 'level-01')).toBe(1.0);
    });
  });

  // --- Persistence tests ---

  describe('persistence', () => {
    it('should auto-save state after debounce delay', () => {
      const service = TestBed.inject(XpDiminishingReturnsService);
      vi.clearAllTimers();

      service.recordCompletion('module-assembly', 'ma-basic-01', 3);
      TestBed.flushEffects();

      // Before debounce -- not saved yet
      const before = fakeStorage.getItem('nexus-station:diminishing-returns');
      expect(before).toBeNull();

      vi.advanceTimersByTime(500);

      const after = fakeStorage.getItem('nexus-station:diminishing-returns');
      expect(after).not.toBeNull();
      const parsed = JSON.parse(after!);
      expect(parsed['module-assembly:ma-basic-01']).toEqual({
        completionCount: 1,
        bestStarRating: 3,
      });
    });

    it('should load saved state from localStorage on init', () => {
      fakeStorage.setItem(
        'nexus-station:diminishing-returns',
        JSON.stringify({
          'module-assembly:ma-basic-01': {
            completionCount: 3,
            bestStarRating: 4,
          },
        }),
      );

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({});
      const service = TestBed.inject(XpDiminishingReturnsService);

      expect(service.getCompletionCount('module-assembly', 'ma-basic-01')).toBe(3);
      expect(service.getBestStarRating('module-assembly', 'ma-basic-01')).toBe(4);
      expect(service.getReplayMultiplier('module-assembly', 'ma-basic-01')).toBe(0.1);
    });

    it('should handle corrupted saved data gracefully', () => {
      fakeStorage.setItem('nexus-station:diminishing-returns', '{invalid json');
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({});
      const service = TestBed.inject(XpDiminishingReturnsService);

      expect(service.getCompletionCount('module-assembly', 'ma-basic-01')).toBe(0);
      expect(service.getReplayMultiplier('module-assembly', 'ma-basic-01')).toBe(1.0);
      warnSpy.mockRestore();
    });

    it('should handle missing fields in saved entries gracefully', () => {
      fakeStorage.setItem(
        'nexus-station:diminishing-returns',
        JSON.stringify({
          'module-assembly:ma-basic-01': {
            completionCount: 2,
            // bestStarRating missing
          },
        }),
      );

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({});
      const service = TestBed.inject(XpDiminishingReturnsService);

      // Entry with missing bestStarRating should be skipped
      expect(service.getCompletionCount('module-assembly', 'ma-basic-01')).toBe(0);
    });

    it('should skip entries with invalid completionCount', () => {
      fakeStorage.setItem(
        'nexus-station:diminishing-returns',
        JSON.stringify({
          'module-assembly:ma-basic-01': {
            completionCount: -1,
            bestStarRating: 3,
          },
          'wire-protocol:wp-basic-01': {
            completionCount: 'not-a-number',
            bestStarRating: 2,
          },
          'flow-commander:fc-basic-01': {
            completionCount: 2,
            bestStarRating: 4,
          },
        }),
      );

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({});
      const service = TestBed.inject(XpDiminishingReturnsService);

      // Invalid entries should be skipped
      expect(service.getCompletionCount('module-assembly', 'ma-basic-01')).toBe(0);
      expect(service.getCompletionCount('wire-protocol', 'wp-basic-01')).toBe(0);
      // Valid entry should load
      expect(service.getCompletionCount('flow-commander', 'fc-basic-01')).toBe(2);
      expect(service.getBestStarRating('flow-commander', 'fc-basic-01')).toBe(4);
    });

    it('should clamp bestStarRating to 5 when stored value exceeds max', () => {
      fakeStorage.setItem(
        'nexus-station:diminishing-returns',
        JSON.stringify({
          'module-assembly:ma-basic-01': {
            completionCount: 2,
            bestStarRating: 99,
          },
        }),
      );

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({});
      const service = TestBed.inject(XpDiminishingReturnsService);

      expect(service.getBestStarRating('module-assembly', 'ma-basic-01')).toBe(5);
      expect(service.getCompletionCount('module-assembly', 'ma-basic-01')).toBe(2);
    });
  });

  // --- Input validation tests ---

  describe('input validation', () => {
    it('should clamp starRating to [0, 5] in recordCompletion', () => {
      const service = TestBed.inject(XpDiminishingReturnsService);

      // Test clamping above 5
      const r1 = service.recordCompletion('module-assembly', 'ma-basic-01', 10);
      expect(service.getBestStarRating('module-assembly', 'ma-basic-01')).toBe(5);
      expect(r1.starDelta).toBe(5);

      // Test clamping below 0
      const r2 = service.recordCompletion('wire-protocol', 'wp-basic-01', -3);
      expect(service.getBestStarRating('wire-protocol', 'wp-basic-01')).toBe(0);
      expect(r2.starDelta).toBe(0);
      expect(r2.starImprovement).toBe(false);
    });
  });
});
