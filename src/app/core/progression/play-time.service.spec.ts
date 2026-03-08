import { TestBed } from '@angular/core/testing';
import { PlayTimeService } from './play-time.service';
import { StatePersistenceService } from '../persistence/state-persistence.service';

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

describe('PlayTimeService', () => {
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

  it('should be created', () => {
    const service = TestBed.inject(PlayTimeService);
    expect(service).toBeTruthy();
  });

  it('should default totalPlayTime to 0', () => {
    const service = TestBed.inject(PlayTimeService);
    expect(service.totalPlayTime()).toBe(0);
  });

  it('should default sessionActive to false', () => {
    const service = TestBed.inject(PlayTimeService);
    expect(service.sessionActive()).toBe(false);
  });

  // --- Session tracking tests ---

  it('should set sessionActive to true after startSession()', () => {
    vi.setSystemTime(new Date('2026-03-07T12:00:00'));
    const service = TestBed.inject(PlayTimeService);

    service.startSession();

    expect(service.sessionActive()).toBe(true);
  });

  it('should accumulate elapsed time into totalPlayTime after endSession()', () => {
    vi.setSystemTime(new Date('2026-03-07T12:00:00'));
    const service = TestBed.inject(PlayTimeService);

    service.startSession();
    vi.advanceTimersByTime(60000); // 60 seconds
    service.endSession();

    expect(service.totalPlayTime()).toBe(60);
  });

  it('should set sessionActive to false after endSession()', () => {
    vi.setSystemTime(new Date('2026-03-07T12:00:00'));
    const service = TestBed.inject(PlayTimeService);

    service.startSession();
    vi.advanceTimersByTime(10000);
    service.endSession();

    expect(service.sessionActive()).toBe(false);
  });

  it('should be a no-op if startSession() is called while session is active', () => {
    vi.setSystemTime(new Date('2026-03-07T12:00:00'));
    const service = TestBed.inject(PlayTimeService);

    service.startSession();
    vi.advanceTimersByTime(30000); // 30 seconds
    service.startSession(); // second call - should be no-op
    vi.advanceTimersByTime(30000); // another 30 seconds

    service.endSession();

    // Total should be 60s (from original start), not 30s (if start was reset)
    expect(service.totalPlayTime()).toBe(60);
    expect(service.sessionActive()).toBe(false);
  });

  it('should be a no-op if endSession() is called without active session', () => {
    const service = TestBed.inject(PlayTimeService);

    service.endSession();

    expect(service.totalPlayTime()).toBe(0);
    expect(service.sessionActive()).toBe(false);
  });

  // --- Total accumulation tests ---

  it('should accumulate multiple sessions into totalPlayTime', () => {
    vi.setSystemTime(new Date('2026-03-07T12:00:00'));
    const service = TestBed.inject(PlayTimeService);

    // Session 1: 30 seconds
    service.startSession();
    vi.advanceTimersByTime(30000);
    service.endSession();

    // Session 2: 45 seconds
    service.startSession();
    vi.advanceTimersByTime(45000);
    service.endSession();

    expect(service.totalPlayTime()).toBe(75);
  });

  it('should accumulate totalPlayTime across persistence (loaded + new)', () => {
    vi.setSystemTime(new Date('2026-03-07T12:00:00'));
    fakeStorage.setItem(
      'nexus-station:play-time',
      JSON.stringify({
        totalPlayTime: 100,
        minigamePlayTime: {},
        sessionStartTime: null,
      }),
    );

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const service = TestBed.inject(PlayTimeService);

    // Run a 50-second session
    service.startSession();
    vi.advanceTimersByTime(50000);
    service.endSession();

    expect(service.totalPlayTime()).toBe(150);
  });

  // --- Per-game tracking tests ---

  it('should record minigame time for a specific game', () => {
    const service = TestBed.inject(PlayTimeService);

    service.recordMinigameTime('module-assembly', 120);

    expect(service.getMinigamePlayTime('module-assembly')).toBe(120);
  });

  it('should accumulate multiple recordings for the same game', () => {
    const service = TestBed.inject(PlayTimeService);

    service.recordMinigameTime('module-assembly', 60);
    service.recordMinigameTime('module-assembly', 40);

    expect(service.getMinigamePlayTime('module-assembly')).toBe(100);
  });

  it('should return 0 for a game with no recorded time', () => {
    const service = TestBed.inject(PlayTimeService);

    expect(service.getMinigamePlayTime('wire-protocol')).toBe(0);
  });

  // --- Persistence tests ---

  it('should auto-save play time data after debounce delay', () => {
    vi.setSystemTime(new Date('2026-03-07T12:00:00'));

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const service = TestBed.inject(PlayTimeService);
    // Clear initial auto-save timer, then re-set system time
    vi.clearAllTimers();
    vi.setSystemTime(new Date('2026-03-07T12:00:00'));

    service.recordMinigameTime('module-assembly', 120);
    TestBed.flushEffects();

    // Before debounce -- not saved yet
    const before = fakeStorage.getItem('nexus-station:play-time');
    expect(before).toBeNull();

    vi.advanceTimersByTime(500);

    const after = fakeStorage.getItem('nexus-station:play-time');
    expect(after).not.toBeNull();
    const parsed = JSON.parse(after!);
    expect(parsed.totalPlayTime).toBe(0);
    expect(parsed.minigamePlayTime['module-assembly']).toBe(120);
  });

  it('should load saved play time data from localStorage on init', () => {
    vi.setSystemTime(new Date('2026-03-07T12:00:00'));
    fakeStorage.setItem(
      'nexus-station:play-time',
      JSON.stringify({
        totalPlayTime: 500,
        minigamePlayTime: { 'module-assembly': 200, 'wire-protocol': 100 },
        sessionStartTime: null,
      }),
    );

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const service = TestBed.inject(PlayTimeService);

    expect(service.totalPlayTime()).toBe(500);
    expect(service.getMinigamePlayTime('module-assembly')).toBe(200);
    expect(service.getMinigamePlayTime('wire-protocol')).toBe(100);
  });

  it('should handle corrupted saved data gracefully', () => {
    vi.setSystemTime(new Date('2026-03-07T12:00:00'));
    fakeStorage.setItem('nexus-station:play-time', '{invalid json');
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const service = TestBed.inject(PlayTimeService);

    expect(service.totalPlayTime()).toBe(0);
    expect(service.sessionActive()).toBe(false);
    warnSpy.mockRestore();
  });

  // --- beforeunload tests ---

  it('should save session time on beforeunload when session is active', () => {
    vi.setSystemTime(new Date('2026-03-07T12:00:00'));
    const service = TestBed.inject(PlayTimeService);

    service.startSession();
    vi.advanceTimersByTime(30000); // 30 seconds

    window.dispatchEvent(new Event('beforeunload'));

    expect(service.totalPlayTime()).toBe(30);
    const stored = fakeStorage.getItem('nexus-station:play-time');
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored!);
    expect(parsed.totalPlayTime).toBe(30);
  });

  it('should not throw on beforeunload when no session is active', () => {
    TestBed.inject(PlayTimeService);

    expect(() => {
      window.dispatchEvent(new Event('beforeunload'));
    }).not.toThrow();
  });

  it('should remove beforeunload listener on destroy', () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener');

    TestBed.inject(PlayTimeService);
    TestBed.resetTestingModule();

    expect(removeSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));
    removeSpy.mockRestore();
  });

  // --- Edge cases ---

  it('should ignore non-positive duration in recordMinigameTime', () => {
    const service = TestBed.inject(PlayTimeService);

    service.recordMinigameTime('module-assembly', 0);
    service.recordMinigameTime('module-assembly', -5);

    expect(service.getMinigamePlayTime('module-assembly')).toBe(0);
  });

  it('should not double-save sessionStartTime on rapid startSession calls', () => {
    vi.setSystemTime(new Date('2026-03-07T12:00:00'));
    const persistence = TestBed.inject(StatePersistenceService);
    const saveSpy = vi.spyOn(persistence, 'save');

    const service = TestBed.inject(PlayTimeService);
    saveSpy.mockClear(); // Clear any calls from constructor/load

    service.startSession();
    service.startSession(); // should be no-op

    // save should have been called exactly once (from _immediateSave in first startSession)
    expect(saveSpy).toHaveBeenCalledTimes(1);
    expect(service.sessionActive()).toBe(true);
  });
});
