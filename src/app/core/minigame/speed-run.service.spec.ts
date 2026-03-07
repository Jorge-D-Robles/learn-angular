import { vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import {
  SpeedRunService,
  SPEED_RUN_CONFIG,
  type SpeedRunSession,
} from './speed-run.service';
import { StatePersistenceService } from '../persistence/state-persistence.service';
import type { MinigameId } from './minigame.types';

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

describe('SpeedRunService', () => {
  let service: SpeedRunService;
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
    service = TestBed.inject(SpeedRunService);
  });

  afterEach(() => {
    Object.defineProperty(window, 'localStorage', {
      value: originalLocalStorage,
      writable: true,
      configurable: true,
    });
    vi.restoreAllMocks();
  });

  // --- Structural tests ---

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should export SpeedRunSession interface (compile-time check)', () => {
    const session: SpeedRunSession = {
      gameId: 'module-assembly',
      startTime: 0,
      elapsedTime: 0,
      parTime: 180,
      levelsCompleted: 0,
      totalLevels: 10,
      isActive: true,
      splitTimes: [],
    };
    expect(session).toBeTruthy();
  });

  it('should export SPEED_RUN_CONFIG constant with all 12 games', () => {
    expect(SPEED_RUN_CONFIG).toBeDefined();
    const allGameIds: MinigameId[] = [
      'module-assembly',
      'wire-protocol',
      'flow-commander',
      'signal-corps',
      'corridor-runner',
      'terminal-hack',
      'power-grid',
      'data-relay',
      'reactor-core',
      'deep-space-radio',
      'system-certification',
      'blast-doors',
    ];
    for (const id of allGameIds) {
      expect(SPEED_RUN_CONFIG[id]).toBeDefined();
      expect(SPEED_RUN_CONFIG[id].parTime).toBeGreaterThan(0);
      expect(SPEED_RUN_CONFIG[id].totalLevels).toBeGreaterThan(0);
    }
  });

  // --- startRun ---

  describe('startRun', () => {
    it('should initialize a session with levelsCompleted 0, isActive true', () => {
      vi.spyOn(Date, 'now').mockReturnValue(1000);
      service.startRun('module-assembly');
      const session = service.session();
      expect(session).not.toBeNull();
      expect(session!.levelsCompleted).toBe(0);
      expect(session!.isActive).toBe(true);
    });

    it('should set startTime from Date.now()', () => {
      vi.spyOn(Date, 'now').mockReturnValue(5000);
      service.startRun('module-assembly');
      expect(service.session()!.startTime).toBe(5000);
    });

    it('should set parTime and totalLevels from SPEED_RUN_CONFIG', () => {
      vi.spyOn(Date, 'now').mockReturnValue(0);
      service.startRun('module-assembly');
      const session = service.session()!;
      expect(session.parTime).toBe(SPEED_RUN_CONFIG['module-assembly'].parTime);
      expect(session.totalLevels).toBe(SPEED_RUN_CONFIG['module-assembly'].totalLevels);
    });

    it('should throw if a run is already active', () => {
      vi.spyOn(Date, 'now').mockReturnValue(0);
      service.startRun('module-assembly');
      expect(() => service.startRun('wire-protocol')).toThrow();
    });

    it('should allow starting after a previous run ended', () => {
      vi.spyOn(Date, 'now').mockReturnValue(0);
      service.startRun('module-assembly');
      service.endRun();
      expect(() => service.startRun('wire-protocol')).not.toThrow();
      expect(service.session()!.gameId).toBe('wire-protocol');
      expect(service.session()!.isActive).toBe(true);
    });
  });

  // --- completeLevel ---

  describe('completeLevel', () => {
    beforeEach(() => {
      vi.spyOn(Date, 'now').mockReturnValue(0);
      service.startRun('module-assembly');
    });

    it('should increment levelsCompleted by 1', () => {
      vi.spyOn(Date, 'now').mockReturnValue(5000);
      service.completeLevel();
      expect(service.session()!.levelsCompleted).toBe(1);
    });

    it('should record elapsed time in splitTimes array', () => {
      vi.spyOn(Date, 'now').mockReturnValue(5000);
      service.completeLevel();
      expect(service.session()!.splitTimes).toHaveLength(1);
      expect(service.session()!.splitTimes[0]).toBe(5); // 5000ms / 1000 = 5s
    });

    it('should update elapsedTime snapshot', () => {
      vi.spyOn(Date, 'now').mockReturnValue(10000);
      service.completeLevel();
      expect(service.session()!.elapsedTime).toBe(10); // 10000ms / 1000 = 10s
    });

    it('should throw if no active run', () => {
      service.endRun();
      expect(() => service.completeLevel()).toThrow();
    });

    it('should throw when levelsCompleted reaches totalLevels', () => {
      const totalLevels = SPEED_RUN_CONFIG['module-assembly'].totalLevels;
      for (let i = 0; i < totalLevels; i++) {
        vi.spyOn(Date, 'now').mockReturnValue((i + 1) * 1000);
        service.completeLevel();
      }
      expect(() => service.completeLevel()).toThrow(
        'Cannot complete level: all levels already completed',
      );
    });
  });

  // --- endRun ---

  describe('endRun', () => {
    beforeEach(() => {
      vi.spyOn(Date, 'now').mockReturnValue(0);
      service.startRun('module-assembly');
    });

    it('should set isActive to false', () => {
      vi.spyOn(Date, 'now').mockReturnValue(10000);
      service.endRun();
      expect(service.session()!.isActive).toBe(false);
    });

    it('should return finalTime as elapsed seconds since startTime', () => {
      vi.spyOn(Date, 'now').mockReturnValue(10000);
      const result = service.endRun();
      expect(result.finalTime).toBe(10);
    });

    it('should return isNewBestTime true when time is lower than previous best', () => {
      // First run: 20 seconds
      vi.spyOn(Date, 'now').mockReturnValue(20000);
      service.endRun();

      // Second run: 10 seconds (better)
      vi.spyOn(Date, 'now').mockReturnValue(0);
      service.startRun('module-assembly');
      vi.spyOn(Date, 'now').mockReturnValue(10000);
      const result = service.endRun();
      expect(result.isNewBestTime).toBe(true);
    });

    it('should return isNewBestTime false when time is not lower', () => {
      // First run: 10 seconds
      vi.spyOn(Date, 'now').mockReturnValue(10000);
      service.endRun();

      // Second run: 20 seconds (worse)
      vi.spyOn(Date, 'now').mockReturnValue(0);
      service.startRun('module-assembly');
      vi.spyOn(Date, 'now').mockReturnValue(20000);
      const result = service.endRun();
      expect(result.isNewBestTime).toBe(false);
    });

    it('should persist best time when no previous best exists (first run)', () => {
      vi.spyOn(Date, 'now').mockReturnValue(15000);
      const result = service.endRun();
      expect(result.isNewBestTime).toBe(true);
      expect(service.getBestTime('module-assembly')).toBe(15);
    });

    it('should return underPar true when finalTime < parTime', () => {
      // par time for module-assembly is 180s; run finishes in 100s
      vi.spyOn(Date, 'now').mockReturnValue(100000);
      const result = service.endRun();
      expect(result.underPar).toBe(true);
    });

    it('should return underPar false when finalTime >= parTime', () => {
      // par time for module-assembly is 180s; run finishes in 200s
      vi.spyOn(Date, 'now').mockReturnValue(200000);
      const result = service.endRun();
      expect(result.underPar).toBe(false);
    });

    it('should persist best time via StatePersistenceService', () => {
      vi.spyOn(Date, 'now').mockReturnValue(10000);
      service.endRun();
      const persistence = TestBed.inject(StatePersistenceService);
      const stored = persistence.load<number>('speed-run-best-time:module-assembly');
      expect(stored).toBe(10);
    });

    it('should throw if no active run', () => {
      service.endRun();
      expect(() => service.endRun()).toThrow();
    });
  });

  // --- getBestTime ---

  describe('getBestTime', () => {
    it('should return null when no best time exists', () => {
      expect(service.getBestTime('module-assembly')).toBeNull();
    });

    it('should return the persisted best time', () => {
      const persistence = TestBed.inject(StatePersistenceService);
      persistence.save('speed-run-best-time:module-assembly', 42);
      expect(service.getBestTime('module-assembly')).toBe(42);
    });

    it('should isolate best times per gameId', () => {
      vi.spyOn(Date, 'now').mockReturnValue(0);
      service.startRun('module-assembly');
      vi.spyOn(Date, 'now').mockReturnValue(10000);
      service.endRun();

      vi.spyOn(Date, 'now').mockReturnValue(0);
      service.startRun('wire-protocol');
      vi.spyOn(Date, 'now').mockReturnValue(20000);
      service.endRun();

      expect(service.getBestTime('module-assembly')).toBe(10);
      expect(service.getBestTime('wire-protocol')).toBe(20);
    });
  });

  // --- getParTime ---

  describe('getParTime', () => {
    it('should return par time from SPEED_RUN_CONFIG', () => {
      expect(service.getParTime('module-assembly')).toBe(180);
    });

    it('should return correct par time for every MinigameId', () => {
      const expected: Record<MinigameId, number> = {
        'module-assembly': 180,
        'wire-protocol': 240,
        'flow-commander': 300,
        'signal-corps': 360,
        'corridor-runner': 240,
        'terminal-hack': 480,
        'power-grid': 300,
        'data-relay': 240,
        'reactor-core': 420,
        'deep-space-radio': 300,
        'system-certification': 600,
        'blast-doors': 360,
      };
      for (const [id, parTime] of Object.entries(expected)) {
        expect(service.getParTime(id as MinigameId)).toBe(parTime);
      }
    });
  });

  // --- session lifecycle ---

  describe('session lifecycle', () => {
    it('should expose session as a readable signal', () => {
      expect(typeof service.session).toBe('function');
      expect(service.session()).toBeNull();
    });

    it('should have null session before startRun', () => {
      expect(service.session()).toBeNull();
    });

    it('should support full lifecycle: start -> levels -> end -> restart', () => {
      // Start first run
      vi.spyOn(Date, 'now').mockReturnValue(0);
      service.startRun('module-assembly');
      expect(service.session()!.isActive).toBe(true);

      // Complete some levels
      vi.spyOn(Date, 'now').mockReturnValue(5000);
      service.completeLevel();
      vi.spyOn(Date, 'now').mockReturnValue(12000);
      service.completeLevel();
      expect(service.session()!.levelsCompleted).toBe(2);
      expect(service.session()!.splitTimes).toHaveLength(2);
      expect(service.session()!.splitTimes[0]).toBe(5);
      expect(service.session()!.splitTimes[1]).toBe(12);

      // End run
      vi.spyOn(Date, 'now').mockReturnValue(15000);
      const result1 = service.endRun();
      expect(result1.finalTime).toBe(15);
      expect(result1.isNewBestTime).toBe(true);
      expect(service.session()!.isActive).toBe(false);

      // Start second run with different game
      vi.spyOn(Date, 'now').mockReturnValue(100000);
      service.startRun('wire-protocol');
      expect(service.session()!.gameId).toBe('wire-protocol');
      expect(service.session()!.levelsCompleted).toBe(0);
      expect(service.session()!.splitTimes).toHaveLength(0);
      expect(service.session()!.isActive).toBe(true);

      // End second run
      vi.spyOn(Date, 'now').mockReturnValue(130000);
      const result2 = service.endRun();
      expect(result2.finalTime).toBe(30);

      // First game's best time is preserved
      expect(service.getBestTime('module-assembly')).toBe(15);
      expect(service.getBestTime('wire-protocol')).toBe(30);
    });
  });
});
