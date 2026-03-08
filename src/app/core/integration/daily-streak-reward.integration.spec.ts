import { TestBed } from '@angular/core/testing';
import {
  DailyChallengeService,
  XpService,
  StreakService,
} from '../progression';
import { StreakRewardService } from '../progression/streak-reward.service';
import { XpNotificationService } from '../notifications';

// --- Test helpers ---

const MS_PER_DAY = 86_400_000;
// Midday UTC avoids timezone-boundary issues with date formatting
const BASE_DATE = new Date('2026-03-01T12:00:00Z');
const BASE_DATE_MS = BASE_DATE.getTime();

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

interface SimulateResult {
  dailyChallengeService: DailyChallengeService;
  xpService: XpService;
  streakService: StreakService;
  streakRewardService: StreakRewardService;
  xpNotification: XpNotificationService;
}

/**
 * Simulates `n` consecutive days of daily challenge completion.
 *
 * For each day:
 * 1. Sets system time to the next day (midday UTC)
 * 2. Resets TestBed and re-configures (DailyChallengeService freezes date at construction)
 * 3. Re-binds fakeStorage to window.localStorage
 * 4. Injects fresh service instances
 * 5. Calls completeChallenge()
 * 6. Flushes Angular effects (schedules the debounced save timer)
 * 7. Advances fake timers by 600ms (fires the debounced save, persisting streak state)
 *
 * Returns the last day's service instances for assertions.
 */
function simulateDays(n: number, fakeStorage: Storage): SimulateResult {
  let dailyChallengeService!: DailyChallengeService;
  let xpService!: XpService;
  let streakService!: StreakService;
  let streakRewardService!: StreakRewardService;
  let xpNotification!: XpNotificationService;

  for (let day = 1; day <= n; day++) {
    vi.setSystemTime(new Date(BASE_DATE_MS + day * MS_PER_DAY));

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    Object.defineProperty(window, 'localStorage', {
      value: fakeStorage,
      writable: true,
      configurable: true,
    });

    dailyChallengeService = TestBed.inject(DailyChallengeService);
    xpService = TestBed.inject(XpService);
    streakService = TestBed.inject(StreakService);
    streakRewardService = TestBed.inject(StreakRewardService);
    xpNotification = TestBed.inject(XpNotificationService);

    dailyChallengeService.completeChallenge();

    // Flush the auto-save effect body (schedules the debounced setTimeout)
    TestBed.flushEffects();
    // Fire the debounced save timer (writes streak state to localStorage)
    vi.advanceTimersByTime(600);
  }

  return { dailyChallengeService, xpService, streakService, streakRewardService, xpNotification };
}

// --- Integration tests ---

describe('DailyChallenge -> Streak -> StreakReward integration', () => {
  let fakeStorage: Storage;
  let originalLocalStorage: Storage;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(BASE_DATE);

    fakeStorage = createFakeStorage();
    originalLocalStorage = window.localStorage;
    Object.defineProperty(window, 'localStorage', {
      value: fakeStorage,
      writable: true,
      configurable: true,
    });
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

  it('increments streak across consecutive daily challenge completions', () => {
    const day1 = simulateDays(1, fakeStorage);
    expect(day1.streakService.activeStreakDays()).toBe(1);

    const day2 = simulateDays(2, fakeStorage);
    expect(day2.streakService.activeStreakDays()).toBe(2);
  });

  it('awards 450 total XP after 7 consecutive daily challenges (7x50 daily + 100 milestone)', () => {
    const { xpService, streakRewardService } = simulateDays(7, fakeStorage);

    // 7 days x 50 XP daily bonus + 100 XP milestone = 450
    expect(xpService.totalXp()).toBe(450);
    expect(streakRewardService.isAwarded(7)).toBe(true);
  });

  it('sends XpNotification with milestone label on day 7', () => {
    // Complete days 1-6 without spying
    simulateDays(6, fakeStorage);

    // Day 7: set up fresh TestBed and spy on the notification service
    vi.setSystemTime(new Date(BASE_DATE_MS + 7 * MS_PER_DAY));
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    Object.defineProperty(window, 'localStorage', {
      value: fakeStorage,
      writable: true,
      configurable: true,
    });

    const dailyChallengeService = TestBed.inject(DailyChallengeService);
    const xpNotification = TestBed.inject(XpNotificationService);
    const showSpy = vi.spyOn(xpNotification, 'show');

    dailyChallengeService.completeChallenge();

    // The spy captures both the daily challenge notification and the milestone notification
    expect(showSpy).toHaveBeenCalledWith(100, expect.arrayContaining(['Weekly Warrior']));

    TestBed.flushEffects();
    vi.advanceTimersByTime(600);
  });

  it('does not re-award 7-day milestone on 8th consecutive day', () => {
    const { xpService: xpAfter7 } = simulateDays(7, fakeStorage);
    const xpBefore = xpAfter7.totalXp();

    // Day 8
    vi.setSystemTime(new Date(BASE_DATE_MS + 8 * MS_PER_DAY));
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    Object.defineProperty(window, 'localStorage', {
      value: fakeStorage,
      writable: true,
      configurable: true,
    });

    const dailyChallengeService = TestBed.inject(DailyChallengeService);
    const xpService = TestBed.inject(XpService);
    const streakRewardService = TestBed.inject(StreakRewardService);

    dailyChallengeService.completeChallenge();
    TestBed.flushEffects();
    vi.advanceTimersByTime(600);

    // Only the daily bonus (50 XP) should be added — no second milestone reward
    expect(xpService.totalXp()).toBe(xpBefore + 50);
    expect(streakRewardService.isAwarded(7)).toBe(true);
  });
});
