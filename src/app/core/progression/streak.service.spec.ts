import { TestBed } from '@angular/core/testing';
import { StreakService } from './streak.service';
import { StreakRewardService } from './streak-reward.service';

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

describe('StreakService', () => {
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
    const service = TestBed.inject(StreakService);
    expect(service).toBeTruthy();
  });

  it('should default currentStreak to 0', () => {
    const service = TestBed.inject(StreakService);
    expect(service.currentStreak()).toBe(0);
  });

  it('should default activeStreakDays to 0', () => {
    const service = TestBed.inject(StreakService);
    expect(service.activeStreakDays()).toBe(0);
  });

  it('should default streakMultiplier to 1.0', () => {
    const service = TestBed.inject(StreakService);
    expect(service.streakMultiplier()).toBe(1.0);
  });

  // --- recordDailyPlay tests ---

  it('should set currentStreak to 1 on first play', () => {
    vi.setSystemTime(new Date('2026-03-07T12:00:00'));
    const service = TestBed.inject(StreakService);

    service.recordDailyPlay();

    expect(service.currentStreak()).toBe(1);
  });

  it('should set activeStreakDays to 1 on first play', () => {
    vi.setSystemTime(new Date('2026-03-07T12:00:00'));
    const service = TestBed.inject(StreakService);

    service.recordDailyPlay();

    expect(service.activeStreakDays()).toBe(1);
  });

  it('should be a no-op if called twice on the same day', () => {
    vi.setSystemTime(new Date('2026-03-07T12:00:00'));
    const service = TestBed.inject(StreakService);

    service.recordDailyPlay();
    service.recordDailyPlay();

    expect(service.currentStreak()).toBe(1);
    expect(service.activeStreakDays()).toBe(1);
  });

  it('should increment currentStreak when playing on consecutive days', () => {
    vi.setSystemTime(new Date('2026-03-07T12:00:00'));
    const service = TestBed.inject(StreakService);

    service.recordDailyPlay();

    vi.setSystemTime(new Date('2026-03-08T12:00:00'));
    service.recordDailyPlay();

    expect(service.currentStreak()).toBe(2);
  });

  it('should increment activeStreakDays when playing on consecutive days', () => {
    vi.setSystemTime(new Date('2026-03-07T12:00:00'));
    const service = TestBed.inject(StreakService);

    service.recordDailyPlay();

    vi.setSystemTime(new Date('2026-03-08T12:00:00'));
    service.recordDailyPlay();

    expect(service.activeStreakDays()).toBe(2);
  });

  it('should not reset currentStreak when a day is missed', () => {
    vi.setSystemTime(new Date('2026-03-07T12:00:00'));
    const service = TestBed.inject(StreakService);

    service.recordDailyPlay();

    vi.setSystemTime(new Date('2026-03-08T12:00:00'));
    service.recordDailyPlay();

    // Skip March 9
    vi.setSystemTime(new Date('2026-03-10T12:00:00'));
    service.recordDailyPlay();

    expect(service.currentStreak()).toBe(2);
  });

  it('should reset activeStreakDays to 1 when a day is missed', () => {
    vi.setSystemTime(new Date('2026-03-07T12:00:00'));
    const service = TestBed.inject(StreakService);

    service.recordDailyPlay();

    vi.setSystemTime(new Date('2026-03-08T12:00:00'));
    service.recordDailyPlay();

    // Skip March 9
    vi.setSystemTime(new Date('2026-03-10T12:00:00'));
    service.recordDailyPlay();

    expect(service.activeStreakDays()).toBe(1);
  });

  it('should update currentStreak to new high when active streak exceeds it', () => {
    vi.setSystemTime(new Date('2026-03-01T12:00:00'));
    const service = TestBed.inject(StreakService);

    // Build a streak of 3
    service.recordDailyPlay();
    vi.setSystemTime(new Date('2026-03-02T12:00:00'));
    service.recordDailyPlay();
    vi.setSystemTime(new Date('2026-03-03T12:00:00'));
    service.recordDailyPlay();
    expect(service.currentStreak()).toBe(3);

    // Gap on March 4
    // Then play 4 consecutive days: March 5, 6, 7, 8
    vi.setSystemTime(new Date('2026-03-05T12:00:00'));
    service.recordDailyPlay();
    expect(service.activeStreakDays()).toBe(1);

    vi.setSystemTime(new Date('2026-03-06T12:00:00'));
    service.recordDailyPlay();
    vi.setSystemTime(new Date('2026-03-07T12:00:00'));
    service.recordDailyPlay();
    expect(service.currentStreak()).toBe(3); // Still at old high

    vi.setSystemTime(new Date('2026-03-08T12:00:00'));
    service.recordDailyPlay();
    expect(service.currentStreak()).toBe(4); // New high
    expect(service.activeStreakDays()).toBe(4);
  });

  // --- Multiplier tests ---

  it('should return 1.10 for activeStreakDays = 1', () => {
    vi.setSystemTime(new Date('2026-03-07T12:00:00'));
    const service = TestBed.inject(StreakService);

    service.recordDailyPlay();

    expect(service.streakMultiplier()).toBeCloseTo(1.1);
  });

  it('should return 1.20 for activeStreakDays = 2', () => {
    vi.setSystemTime(new Date('2026-03-07T12:00:00'));
    const service = TestBed.inject(StreakService);

    service.recordDailyPlay();
    vi.setSystemTime(new Date('2026-03-08T12:00:00'));
    service.recordDailyPlay();

    expect(service.streakMultiplier()).toBeCloseTo(1.2);
  });

  it('should return 1.40 for activeStreakDays = 4', () => {
    vi.setSystemTime(new Date('2026-03-07T12:00:00'));
    const service = TestBed.inject(StreakService);

    service.recordDailyPlay();
    vi.setSystemTime(new Date('2026-03-08T12:00:00'));
    service.recordDailyPlay();
    vi.setSystemTime(new Date('2026-03-09T12:00:00'));
    service.recordDailyPlay();
    vi.setSystemTime(new Date('2026-03-10T12:00:00'));
    service.recordDailyPlay();

    expect(service.streakMultiplier()).toBeCloseTo(1.4);
  });

  it('should cap streakMultiplier at 1.50 for activeStreakDays >= 5', () => {
    vi.setSystemTime(new Date('2026-03-07T12:00:00'));
    const service = TestBed.inject(StreakService);

    // Play 7 consecutive days
    for (let i = 0; i < 7; i++) {
      vi.setSystemTime(new Date(`2026-03-${String(7 + i).padStart(2, '0')}T12:00:00`));
      service.recordDailyPlay();
    }

    expect(service.activeStreakDays()).toBe(7);
    expect(service.streakMultiplier()).toBeCloseTo(1.5);
  });

  // --- Gap detection on load ---

  it('should set activeStreakDays to 0 when loaded state has a gap', () => {
    // Save state as if last play was 2 days ago
    vi.setSystemTime(new Date('2026-03-10T12:00:00'));
    fakeStorage.setItem(
      'nexus-station:streak',
      JSON.stringify({
        currentStreak: 5,
        activeStreakDays: 5,
        lastPlayDate: '2026-03-08',
      }),
    );

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const service = TestBed.inject(StreakService);

    expect(service.activeStreakDays()).toBe(0);
    expect(service.currentStreak()).toBe(5);
    expect(service.streakMultiplier()).toBe(1.0);
  });

  it('should preserve activeStreakDays when loaded state is from today', () => {
    vi.setSystemTime(new Date('2026-03-10T12:00:00'));
    fakeStorage.setItem(
      'nexus-station:streak',
      JSON.stringify({
        currentStreak: 3,
        activeStreakDays: 3,
        lastPlayDate: '2026-03-10',
      }),
    );

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const service = TestBed.inject(StreakService);

    expect(service.activeStreakDays()).toBe(3);
    expect(service.currentStreak()).toBe(3);
  });

  it('should preserve activeStreakDays when loaded state is from yesterday', () => {
    vi.setSystemTime(new Date('2026-03-10T12:00:00'));
    fakeStorage.setItem(
      'nexus-station:streak',
      JSON.stringify({
        currentStreak: 4,
        activeStreakDays: 4,
        lastPlayDate: '2026-03-09',
      }),
    );

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const service = TestBed.inject(StreakService);

    expect(service.activeStreakDays()).toBe(4);
    expect(service.currentStreak()).toBe(4);
  });

  // --- Persistence tests ---

  it('should auto-save streak data after debounce delay', () => {
    vi.setSystemTime(new Date('2026-03-07T12:00:00'));

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const service = TestBed.inject(StreakService);
    // Clear initial auto-save timer, then re-set system time
    vi.clearAllTimers();
    vi.setSystemTime(new Date('2026-03-07T12:00:00'));

    service.recordDailyPlay();
    TestBed.flushEffects();

    // Before debounce -- not saved yet
    const before = fakeStorage.getItem('nexus-station:streak');
    expect(before).toBeNull();

    vi.advanceTimersByTime(500);

    const after = fakeStorage.getItem('nexus-station:streak');
    expect(after).not.toBeNull();
    const parsed = JSON.parse(after!);
    expect(parsed.currentStreak).toBe(1);
    expect(parsed.activeStreakDays).toBe(1);
    expect(parsed.lastPlayDate).toBe('2026-03-07');
  });

  it('should load saved streak data from localStorage on init', () => {
    vi.setSystemTime(new Date('2026-03-07T12:00:00'));
    fakeStorage.setItem(
      'nexus-station:streak',
      JSON.stringify({
        currentStreak: 3,
        activeStreakDays: 3,
        lastPlayDate: '2026-03-07',
      }),
    );

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const service = TestBed.inject(StreakService);

    expect(service.currentStreak()).toBe(3);
    expect(service.activeStreakDays()).toBe(3);
  });

  it('should handle corrupted saved data gracefully', () => {
    vi.setSystemTime(new Date('2026-03-07T12:00:00'));
    fakeStorage.setItem('nexus-station:streak', '{invalid json');
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const service = TestBed.inject(StreakService);

    expect(service.currentStreak()).toBe(0);
    expect(service.activeStreakDays()).toBe(0);
    expect(service.streakMultiplier()).toBe(1.0);
    warnSpy.mockRestore();
  });

  // --- Edge cases ---

  it('should handle transition from Dec 31 to Jan 1 correctly', () => {
    vi.setSystemTime(new Date('2026-12-31T12:00:00'));
    const service = TestBed.inject(StreakService);

    service.recordDailyPlay();

    vi.setSystemTime(new Date('2027-01-01T12:00:00'));
    service.recordDailyPlay();

    expect(service.activeStreakDays()).toBe(2);
    expect(service.currentStreak()).toBe(2);
  });

  // --- Milestone reward wiring tests ---

  describe('milestone reward wiring', () => {
    let checkMilestoneSpy: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      checkMilestoneSpy = vi.fn().mockReturnValue(null);
      TestBed.overrideProvider(StreakRewardService, {
        useValue: { checkMilestoneReward: checkMilestoneSpy },
      });
    });

    it('should call checkMilestoneReward after recordDailyPlay', () => {
      vi.setSystemTime(new Date('2026-03-07T12:00:00'));
      const service = TestBed.inject(StreakService);

      service.recordDailyPlay();

      expect(checkMilestoneSpy).toHaveBeenCalledWith(1);
    });

    it('should call checkMilestoneReward with correct count after consecutive days', () => {
      vi.setSystemTime(new Date('2026-03-07T12:00:00'));
      const service = TestBed.inject(StreakService);

      service.recordDailyPlay();
      vi.setSystemTime(new Date('2026-03-08T12:00:00'));
      service.recordDailyPlay();
      vi.setSystemTime(new Date('2026-03-09T12:00:00'));
      service.recordDailyPlay();

      expect(checkMilestoneSpy).toHaveBeenLastCalledWith(3);
    });

    it('should not call checkMilestoneReward on same-day duplicate', () => {
      vi.setSystemTime(new Date('2026-03-07T12:00:00'));
      const service = TestBed.inject(StreakService);

      service.recordDailyPlay();
      checkMilestoneSpy.mockClear();
      service.recordDailyPlay(); // same day — early return

      expect(checkMilestoneSpy).not.toHaveBeenCalled();
    });
  });
});
