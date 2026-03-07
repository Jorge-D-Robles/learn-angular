import { TestBed } from '@angular/core/testing';
import { GameStateService, GameStateSnapshot } from './game-state.service';
import { StatePersistenceService } from '../persistence/state-persistence.service';
import { getRankForXp } from './rank.constants';

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

describe('getRankForXp', () => {
  it('should return Cadet for 0 XP', () => {
    expect(getRankForXp(0)).toBe('Cadet');
  });

  it('should return Cadet for 499 XP', () => {
    expect(getRankForXp(499)).toBe('Cadet');
  });

  it('should return Ensign for exactly 500 XP', () => {
    expect(getRankForXp(500)).toBe('Ensign');
  });

  it('should return Lieutenant for 1500 XP', () => {
    expect(getRankForXp(1_500)).toBe('Lieutenant');
  });

  it('should return Fleet Admiral for 25000 XP', () => {
    expect(getRankForXp(25_000)).toBe('Fleet Admiral');
  });

  it('should return Fleet Admiral for XP above 25000', () => {
    expect(getRankForXp(99_999)).toBe('Fleet Admiral');
  });
});

describe('GameStateService', () => {
  let service: GameStateService;
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
    service = TestBed.inject(GameStateService);
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

  it('should default playerName to empty string', () => {
    expect(service.playerName()).toBe('');
  });

  it('should default totalXp to 0', () => {
    expect(service.totalXp()).toBe(0);
  });

  it('should default currentRank to Cadet', () => {
    expect(service.currentRank()).toBe('Cadet');
  });

  // --- Mutation: setPlayerName ---

  it('should update playerName when setPlayerName is called', () => {
    service.setPlayerName('Commander Riker');
    expect(service.playerName()).toBe('Commander Riker');
  });

  it('should trim whitespace from player name', () => {
    service.setPlayerName('  trimmed  ');
    expect(service.playerName()).toBe('trimmed');
  });

  it('should not update playerName when given an empty string', () => {
    service.setPlayerName('Initial');
    service.setPlayerName('');
    expect(service.playerName()).toBe('Initial');
  });

  // --- Mutation: addXp ---

  it('should increase totalXp when addXp is called', () => {
    service.addXp(100);
    expect(service.totalXp()).toBe(100);
  });

  it('should accumulate XP across multiple addXp calls', () => {
    service.addXp(100);
    service.addXp(100);
    expect(service.totalXp()).toBe(200);
  });

  it('should not change totalXp when addXp is called with 0', () => {
    service.addXp(0);
    expect(service.totalXp()).toBe(0);
  });

  it('should not change totalXp when addXp is called with a negative value', () => {
    service.addXp(-10);
    expect(service.totalXp()).toBe(0);
  });

  // --- Computed signal reactivity ---

  it('should return Cadet rank at 0 XP', () => {
    expect(service.currentRank()).toBe('Cadet');
  });

  it('should return Ensign rank after adding 500 XP', () => {
    service.addXp(500);
    expect(service.currentRank()).toBe('Ensign');
  });

  it('should return Lieutenant rank after adding 1500 XP', () => {
    service.addXp(1_500);
    expect(service.currentRank()).toBe('Lieutenant');
  });

  it('should return Fleet Admiral rank after adding 25000 XP', () => {
    service.addXp(25_000);
    expect(service.currentRank()).toBe('Fleet Admiral');
  });

  it('should update currentRank reactively when XP crosses a threshold', () => {
    service.addXp(400);
    expect(service.currentRank()).toBe('Cadet');

    service.addXp(100);
    expect(service.currentRank()).toBe('Ensign');
  });

  // --- Reset ---

  it('should restore all values to defaults when resetState is called', () => {
    service.setPlayerName('Picard');
    service.addXp(5_000);
    service.resetState();

    expect(service.playerName()).toBe('');
    expect(service.totalXp()).toBe(0);
    expect(service.currentRank()).toBe('Cadet');
  });

  // --- Read-only enforcement ---

  it('should throw when attempting to set playerName directly', () => {
    expect(() => (service.playerName as any).set('x')).toThrow();
  });

  it('should throw when attempting to set totalXp directly', () => {
    expect(() => (service.totalXp as any).set(999)).toThrow();
  });

  // --- Persistence integration ---

  describe('persistence integration', () => {
    function seedState(snapshot: Partial<GameStateSnapshot>): void {
      const full = { playerName: '', totalXp: 0, ...snapshot };
      fakeStorage.setItem(
        'nexus-station:game-state',
        JSON.stringify(full),
      );
    }

    it('should load saved state from localStorage on initialization', () => {
      // Service already created in beforeEach; create a new one with seeded data
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({});
      seedState({ playerName: 'Picard', totalXp: 1500 });
      const svc = TestBed.inject(GameStateService);

      expect(svc.playerName()).toBe('Picard');
      expect(svc.totalXp()).toBe(1500);
    });

    it('should initialize with defaults when no saved state exists', () => {
      // fakeStorage is empty (no seeding)
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({});
      const svc = TestBed.inject(GameStateService);

      expect(svc.playerName()).toBe('');
      expect(svc.totalXp()).toBe(0);
      expect(svc.currentRank()).toBe('Cadet');
    });

    it('should initialize with defaults when saved state is corrupted', () => {
      fakeStorage.setItem('nexus-station:game-state', '{invalid json');
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({});
      const warnSpy = vi
        .spyOn(console, 'warn')
        .mockImplementation(() => undefined);
      const svc = TestBed.inject(GameStateService);

      expect(svc.playerName()).toBe('');
      expect(svc.totalXp()).toBe(0);
      warnSpy.mockRestore();
    });

    it('should initialize with defaults when saved state has wrong shape', () => {
      fakeStorage.setItem('nexus-station:game-state', '42');
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({});
      const svc = TestBed.inject(GameStateService);

      expect(svc.playerName()).toBe('');
      expect(svc.totalXp()).toBe(0);
    });

    it('should auto-save state after debounce delay', () => {
      vi.useFakeTimers();
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({});
      const svc = TestBed.inject(GameStateService);
      vi.clearAllTimers();

      svc.addXp(100);
      TestBed.flushEffects();

      // Debounce pending -- not saved yet
      const before = fakeStorage.getItem('nexus-station:game-state');
      expect(before).toBeNull();

      vi.advanceTimersByTime(500);

      const after = fakeStorage.getItem('nexus-station:game-state');
      expect(after).not.toBeNull();
      expect(JSON.parse(after!)).toEqual({ playerName: '', totalXp: 100 });
    });

    it('should debounce rapid state changes into a single save', () => {
      vi.useFakeTimers();
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({});
      const persistence = TestBed.inject(StatePersistenceService);
      const saveSpy = vi.spyOn(persistence, 'save');
      const svc = TestBed.inject(GameStateService);
      vi.clearAllTimers();
      saveSpy.mockClear();

      svc.addXp(10);
      TestBed.flushEffects();
      svc.addXp(20);
      TestBed.flushEffects();
      svc.addXp(30);
      TestBed.flushEffects();

      vi.advanceTimersByTime(500);

      const stored = fakeStorage.getItem('nexus-station:game-state');
      expect(stored).not.toBeNull();
      expect(JSON.parse(stored!)).toEqual({ playerName: '', totalXp: 60 });
      expect(saveSpy).toHaveBeenCalledTimes(1);
    });

    it('should clear persisted state on resetState', () => {
      vi.useFakeTimers();
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({});
      const svc = TestBed.inject(GameStateService);
      vi.clearAllTimers();

      svc.addXp(500);
      TestBed.flushEffects();
      vi.advanceTimersByTime(500);

      // Verify it was saved
      expect(fakeStorage.getItem('nexus-station:game-state')).not.toBeNull();

      svc.resetState();

      // resetState immediately clears localStorage
      expect(fakeStorage.getItem('nexus-station:game-state')).toBeNull();
    });

    it('should ignore negative totalXp in saved state', () => {
      seedState({ playerName: 'Test', totalXp: -100 });
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({});
      const svc = TestBed.inject(GameStateService);

      expect(svc.playerName()).toBe('Test');
      expect(svc.totalXp()).toBe(0);
    });
  });
});
