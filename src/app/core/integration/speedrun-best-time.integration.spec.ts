import { TestBed } from '@angular/core/testing';
import { SpeedRunService } from '../minigame/speed-run.service';
import type { MinigameId } from '../minigame/minigame.types';

// --- Fake localStorage ---

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

const TEST_GAME_ID: MinigameId = 'module-assembly';

describe('Speed run best time integration', () => {
  let service: SpeedRunService;
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
    service = TestBed.inject(SpeedRunService);
  });

  afterEach(() => {
    vi.useRealTimers();
    Object.defineProperty(window, 'localStorage', {
      value: originalLocalStorage,
      writable: true,
      configurable: true,
    });
  });

  it('should set best time on first-ever run', () => {
    vi.setSystemTime(new Date('2026-03-07T12:00:00.000'));
    service.startRun(TEST_GAME_ID);

    // Advance 60 seconds
    vi.setSystemTime(new Date('2026-03-07T12:01:00.000'));
    const { finalTime, isNewBestTime } = service.endRun();

    expect(finalTime).toBe(60);
    expect(isNewBestTime).toBe(true);
    expect(service.getBestTime(TEST_GAME_ID)).toBe(60);
  });

  it('should update best time when new run is faster', () => {
    // First run: 60 seconds
    vi.setSystemTime(new Date('2026-03-07T12:00:00.000'));
    service.startRun(TEST_GAME_ID);
    vi.setSystemTime(new Date('2026-03-07T12:01:00.000'));
    service.endRun();

    // Second run: 45 seconds (faster)
    vi.setSystemTime(new Date('2026-03-07T12:05:00.000'));
    service.startRun(TEST_GAME_ID);
    vi.setSystemTime(new Date('2026-03-07T12:05:45.000'));
    const { isNewBestTime } = service.endRun();

    expect(isNewBestTime).toBe(true);
    expect(service.getBestTime(TEST_GAME_ID)).toBe(45);
  });

  it('should NOT update best time when new run is slower', () => {
    // First run: 45 seconds
    vi.setSystemTime(new Date('2026-03-07T12:00:00.000'));
    service.startRun(TEST_GAME_ID);
    vi.setSystemTime(new Date('2026-03-07T12:00:45.000'));
    service.endRun();

    // Second run: 90 seconds (slower)
    vi.setSystemTime(new Date('2026-03-07T12:05:00.000'));
    service.startRun(TEST_GAME_ID);
    vi.setSystemTime(new Date('2026-03-07T12:06:30.000'));
    const { isNewBestTime } = service.endRun();

    expect(isNewBestTime).toBe(false);
    expect(service.getBestTime(TEST_GAME_ID)).toBe(45);
  });

  it('should persist best time across service restarts (localStorage round-trip)', () => {
    // First instance: set a best time
    vi.setSystemTime(new Date('2026-03-07T12:00:00.000'));
    service.startRun(TEST_GAME_ID);
    vi.setSystemTime(new Date('2026-03-07T12:00:30.000'));
    service.endRun();

    // Simulate service restart
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const freshService = TestBed.inject(SpeedRunService);

    // Best time should survive across restarts
    expect(freshService.getBestTime(TEST_GAME_ID)).toBe(30);
  });

  it('should return null for best time when no runs have been completed', () => {
    expect(service.getBestTime(TEST_GAME_ID)).toBeNull();
  });

  it('should report underPar when run is under par time', () => {
    // module-assembly par time is 180 seconds
    vi.setSystemTime(new Date('2026-03-07T12:00:00.000'));
    service.startRun(TEST_GAME_ID);
    vi.setSystemTime(new Date('2026-03-07T12:02:00.000')); // 120 seconds < 180 par
    const { underPar } = service.endRun();

    expect(underPar).toBe(true);
  });

  it('should track best times independently per game', () => {
    const otherGameId: MinigameId = 'wire-protocol';

    // module-assembly: 60 seconds
    vi.setSystemTime(new Date('2026-03-07T12:00:00.000'));
    service.startRun(TEST_GAME_ID);
    vi.setSystemTime(new Date('2026-03-07T12:01:00.000'));
    service.endRun();

    // wire-protocol: 90 seconds
    vi.setSystemTime(new Date('2026-03-07T12:05:00.000'));
    service.startRun(otherGameId);
    vi.setSystemTime(new Date('2026-03-07T12:06:30.000'));
    service.endRun();

    expect(service.getBestTime(TEST_GAME_ID)).toBe(60);
    expect(service.getBestTime(otherGameId)).toBe(90);
  });
});
