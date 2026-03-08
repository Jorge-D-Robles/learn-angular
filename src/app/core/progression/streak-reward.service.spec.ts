import { TestBed } from '@angular/core/testing';
import { StreakRewardService } from './streak-reward.service';
import { XpService } from './xp.service';
import { XpNotificationService } from '../notifications/xp-notification.service';

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

describe('StreakRewardService', () => {
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

  function createService(): StreakRewardService {
    return TestBed.inject(StreakRewardService);
  }

  // --- Milestone detection (4 tests) ---

  it('should return reward for 7-day milestone', () => {
    const service = createService();
    const reward = service.checkMilestoneReward(7);

    expect(reward).toEqual({ days: 7, bonusXp: 100, label: 'Weekly Warrior' });
  });

  it('should return reward for 14-day milestone', () => {
    const service = createService();
    const reward = service.checkMilestoneReward(14);

    expect(reward).toEqual({ days: 14, bonusXp: 200, label: '2-Week Streak' });
  });

  it('should return reward for 30-day milestone', () => {
    const service = createService();
    const reward = service.checkMilestoneReward(30);

    expect(reward).toEqual({ days: 30, bonusXp: 500, label: 'Monthly Legend' });
  });

  it('should return null for non-milestone streak days', () => {
    const service = createService();

    expect(service.checkMilestoneReward(3)).toBeNull();
    expect(service.checkMilestoneReward(8)).toBeNull();
    expect(service.checkMilestoneReward(15)).toBeNull();
  });

  // --- Bonus XP award (2 tests) ---

  it('should call XpService.addXp with correct bonus amount', () => {
    const service = createService();
    const xpService = TestBed.inject(XpService);
    const addXpSpy = vi.spyOn(xpService, 'addXp');

    service.checkMilestoneReward(7);

    expect(addXpSpy).toHaveBeenCalledWith(100);
  });

  it('should call XpService.addXp with 500 for 30-day milestone', () => {
    const service = createService();
    const xpService = TestBed.inject(XpService);
    const addXpSpy = vi.spyOn(xpService, 'addXp');

    service.checkMilestoneReward(30);

    expect(addXpSpy).toHaveBeenCalledWith(500);
  });

  // --- Notification (2 tests) ---

  it('should show XP notification with milestone label', () => {
    const service = createService();
    const xpNotification = TestBed.inject(XpNotificationService);
    const showSpy = vi.spyOn(xpNotification, 'show');

    service.checkMilestoneReward(7);

    expect(showSpy).toHaveBeenCalledWith(100, ['Weekly Warrior']);
  });

  it('should show notification with correct label for each milestone', () => {
    const service = createService();
    const xpNotification = TestBed.inject(XpNotificationService);
    const showSpy = vi.spyOn(xpNotification, 'show');

    service.checkMilestoneReward(14);

    expect(showSpy).toHaveBeenCalledWith(200, ['2-Week Streak']);
  });

  // --- No re-award (3 tests) ---

  it('should return null when milestone already awarded', () => {
    const service = createService();

    const first = service.checkMilestoneReward(7);
    const second = service.checkMilestoneReward(7);

    expect(first).not.toBeNull();
    expect(second).toBeNull();
  });

  it('should not call addXp on re-award attempt', () => {
    const service = createService();
    const xpService = TestBed.inject(XpService);
    const addXpSpy = vi.spyOn(xpService, 'addXp');

    service.checkMilestoneReward(7);
    addXpSpy.mockClear();
    service.checkMilestoneReward(7);

    expect(addXpSpy).not.toHaveBeenCalled();
  });

  it('should allow awarding different milestones independently', () => {
    const service = createService();

    const first = service.checkMilestoneReward(7);
    const second = service.checkMilestoneReward(14);

    expect(first).toEqual({ days: 7, bonusXp: 100, label: 'Weekly Warrior' });
    expect(second).toEqual({ days: 14, bonusXp: 200, label: '2-Week Streak' });
  });

  // --- Persistence (3 tests) ---

  it('should persist awarded milestones to storage', () => {
    const service = createService();

    service.checkMilestoneReward(7);

    const raw = fakeStorage.getItem('nexus-station:streak-rewards');
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed.awardedMilestones).toContain(7);
  });

  it('should load previously awarded milestones on init', () => {
    fakeStorage.setItem(
      'nexus-station:streak-rewards',
      JSON.stringify({ awardedMilestones: [7] }),
    );

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const service = createService();

    expect(service.checkMilestoneReward(7)).toBeNull();
  });

  it('should handle corrupted persistence data gracefully', () => {
    fakeStorage.setItem('nexus-station:streak-rewards', '{invalid json');
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const service = createService();

    const reward = service.checkMilestoneReward(7);
    expect(reward).toEqual({ days: 7, bonusXp: 100, label: 'Weekly Warrior' });
    warnSpy.mockRestore();
  });

  // --- isAwarded helper (1 test) ---

  it('should report awarded status via isAwarded()', () => {
    const service = createService();

    expect(service.isAwarded(7)).toBe(false);

    service.checkMilestoneReward(7);

    expect(service.isAwarded(7)).toBe(true);
    expect(service.isAwarded(14)).toBe(false);
  });
});
