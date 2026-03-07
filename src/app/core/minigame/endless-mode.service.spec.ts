import { TestBed } from '@angular/core/testing';
import {
  EndlessModeService,
  DIFFICULTY_BASE,
  type DifficultyParams,
  type EndlessSession,
} from './endless-mode.service';
import { StatePersistenceService } from '../persistence/state-persistence.service';

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

describe('EndlessModeService', () => {
  let service: EndlessModeService;
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
    service = TestBed.inject(EndlessModeService);
  });

  afterEach(() => {
    Object.defineProperty(window, 'localStorage', {
      value: originalLocalStorage,
      writable: true,
      configurable: true,
    });
  });

  // --- Structural tests ---

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should export DIFFICULTY_BASE constants', () => {
    expect(DIFFICULTY_BASE.SPEED).toBe(1.0);
    expect(DIFFICULTY_BASE.COMPLEXITY).toBe(1.0);
    expect(DIFFICULTY_BASE.COUNT).toBe(3);
    expect(DIFFICULTY_BASE.SPEED_FACTOR).toBe(0.3);
    expect(DIFFICULTY_BASE.COMPLEXITY_FACTOR).toBe(0.25);
    expect(DIFFICULTY_BASE.COUNT_FACTOR).toBe(1.5);
  });

  it('should export DifficultyParams and EndlessSession interfaces (compile-time check)', () => {
    const params: DifficultyParams = { speed: 1, complexity: 1, count: 3 };
    const session: EndlessSession = {
      gameId: 'module-assembly',
      currentRound: 1,
      score: 0,
      difficultyLevel: 1,
      isActive: true,
    };
    expect(params).toBeTruthy();
    expect(session).toBeTruthy();
  });

  // --- startSession ---

  describe('startSession', () => {
    it('should initialize a session with round 1, score 0, active true', () => {
      service.startSession('module-assembly');
      const session = service.session();
      expect(session).not.toBeNull();
      expect(session!.currentRound).toBe(1);
      expect(session!.score).toBe(0);
      expect(session!.isActive).toBe(true);
    });

    it('should set the gameId from the argument', () => {
      service.startSession('wire-protocol');
      expect(service.session()!.gameId).toBe('wire-protocol');
    });

    it('should throw if a session is already active', () => {
      service.startSession('module-assembly');
      expect(() => service.startSession('wire-protocol')).toThrow();
    });

    it('should allow starting after a previous session ended', () => {
      service.startSession('module-assembly');
      service.endSession();
      expect(() => service.startSession('wire-protocol')).not.toThrow();
      expect(service.session()!.gameId).toBe('wire-protocol');
      expect(service.session()!.isActive).toBe(true);
    });
  });

  // --- nextRound ---

  describe('nextRound', () => {
    beforeEach(() => {
      service.startSession('module-assembly');
    });

    it('should increment currentRound by 1', () => {
      service.nextRound(100);
      expect(service.session()!.currentRound).toBe(2);
    });

    it('should add scoreForRound to cumulative score', () => {
      service.nextRound(100);
      expect(service.session()!.score).toBe(100);
    });

    it('should update difficultyLevel to match new round', () => {
      service.nextRound(100);
      expect(service.session()!.difficultyLevel).toBe(2);
    });

    it('should throw if no active session', () => {
      service.endSession();
      expect(() => service.nextRound(100)).toThrow();
    });

    it('should accumulate score across multiple rounds', () => {
      service.nextRound(100);
      service.nextRound(200);
      service.nextRound(50);
      expect(service.session()!.score).toBe(350);
      expect(service.session()!.currentRound).toBe(4);
    });
  });

  // --- endSession ---

  describe('endSession', () => {
    beforeEach(() => {
      service.startSession('module-assembly');
      service.nextRound(100);
      service.nextRound(200);
    });

    it('should set isActive to false', () => {
      service.endSession();
      expect(service.session()!.isActive).toBe(false);
    });

    it('should return finalScore matching accumulated score', () => {
      const result = service.endSession();
      expect(result.finalScore).toBe(300);
    });

    it('should return isNewHighScore true when score exceeds previous high', () => {
      const result = service.endSession();
      expect(result.isNewHighScore).toBe(true);
    });

    it('should return isNewHighScore false when score does not exceed previous high', () => {
      service.endSession(); // sets high score to 300

      service.startSession('module-assembly');
      service.nextRound(50);
      const result = service.endSession();
      expect(result.isNewHighScore).toBe(false);
    });

    it('should persist high score via StatePersistenceService', () => {
      service.endSession();
      const persistence = TestBed.inject(StatePersistenceService);
      const stored = persistence.load<number>('endless-high-score:module-assembly');
      expect(stored).toBe(300);
    });

    it('should throw if no active session', () => {
      service.endSession();
      expect(() => service.endSession()).toThrow();
    });
  });

  // --- getHighScore ---

  describe('getHighScore', () => {
    it('should return 0 when no high score exists', () => {
      expect(service.getHighScore('module-assembly')).toBe(0);
    });

    it('should return the persisted high score', () => {
      const persistence = TestBed.inject(StatePersistenceService);
      persistence.save('endless-high-score:module-assembly', 500);
      expect(service.getHighScore('module-assembly')).toBe(500);
    });

    it('should return updated high score after a session improves it', () => {
      service.startSession('module-assembly');
      service.nextRound(400);
      service.endSession();
      expect(service.getHighScore('module-assembly')).toBe(400);
    });

    it('should isolate high scores per gameId (game-A score does not affect game-B)', () => {
      service.startSession('module-assembly');
      service.nextRound(999);
      service.endSession();

      service.startSession('wire-protocol');
      service.nextRound(100);
      service.endSession();

      expect(service.getHighScore('module-assembly')).toBe(999);
      expect(service.getHighScore('wire-protocol')).toBe(100);
    });
  });

  // --- getDifficultyParams ---

  describe('getDifficultyParams', () => {
    it('should return base values for round 1', () => {
      const params = service.getDifficultyParams(1);
      expect(params.speed).toBe(1.0);
      expect(params.complexity).toBe(1.0);
      expect(params.count).toBe(3);
    });

    it('should increase speed with higher rounds', () => {
      const round1 = service.getDifficultyParams(1);
      const round10 = service.getDifficultyParams(10);
      expect(round10.speed).toBeGreaterThan(round1.speed);
    });

    it('should increase complexity with higher rounds', () => {
      const round1 = service.getDifficultyParams(1);
      const round10 = service.getDifficultyParams(10);
      expect(round10.complexity).toBeGreaterThan(round1.complexity);
    });

    it('should increase count with higher rounds', () => {
      const round1 = service.getDifficultyParams(1);
      const round10 = service.getDifficultyParams(10);
      expect(round10.count).toBeGreaterThan(round1.count);
    });

    it('should scale logarithmically (not linearly)', () => {
      const round10 = service.getDifficultyParams(10);
      const round100 = service.getDifficultyParams(100);
      // Logarithmic: the jump from round 10 to 100 should be smaller than 10x
      const speedDiff10 = round10.speed - 1.0;
      const speedDiff100 = round100.speed - 1.0;
      // If linear, ratio would be 10x. Logarithmic should be ~2x (ln(100)/ln(10) = 2)
      expect(speedDiff100 / speedDiff10).toBeLessThan(5);
      expect(speedDiff100 / speedDiff10).toBeGreaterThan(1);
    });

    it('should return base values for round 0 or negative (guard)', () => {
      const params0 = service.getDifficultyParams(0);
      expect(params0.speed).toBe(DIFFICULTY_BASE.SPEED);
      expect(params0.complexity).toBe(DIFFICULTY_BASE.COMPLEXITY);
      expect(params0.count).toBe(DIFFICULTY_BASE.COUNT);

      const paramsNeg = service.getDifficultyParams(-5);
      expect(paramsNeg.speed).toBe(DIFFICULTY_BASE.SPEED);
      expect(paramsNeg.complexity).toBe(DIFFICULTY_BASE.COMPLEXITY);
      expect(paramsNeg.count).toBe(DIFFICULTY_BASE.COUNT);
    });
  });

  // --- session lifecycle ---

  describe('session lifecycle', () => {
    it('should expose session as a readable signal', () => {
      expect(typeof service.session).toBe('function');
      expect(service.session()).toBeNull();
    });

    it('should have null session before startSession', () => {
      expect(service.session()).toBeNull();
    });

    it('should support full lifecycle: start -> rounds -> end -> restart', () => {
      // Start first session
      service.startSession('module-assembly');
      expect(service.session()!.isActive).toBe(true);

      // Play some rounds
      service.nextRound(100);
      service.nextRound(200);
      expect(service.session()!.currentRound).toBe(3);
      expect(service.session()!.score).toBe(300);

      // End session
      const result1 = service.endSession();
      expect(result1.finalScore).toBe(300);
      expect(result1.isNewHighScore).toBe(true);
      expect(service.session()!.isActive).toBe(false);

      // Start second session with different game
      service.startSession('wire-protocol');
      expect(service.session()!.gameId).toBe('wire-protocol');
      expect(service.session()!.currentRound).toBe(1);
      expect(service.session()!.score).toBe(0);
      expect(service.session()!.isActive).toBe(true);

      // End second session
      service.nextRound(500);
      const result2 = service.endSession();
      expect(result2.finalScore).toBe(500);

      // First game's high score is preserved
      expect(service.getHighScore('module-assembly')).toBe(300);
      expect(service.getHighScore('wire-protocol')).toBe(500);
    });
  });
});
