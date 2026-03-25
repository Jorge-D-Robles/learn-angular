import { TestBed } from '@angular/core/testing';
import { AchievementTriggerService } from './achievement-trigger.service';
import { AchievementService, type Achievement } from './achievement.service';
import { AchievementNotificationService } from '../notifications/achievement-notification.service';
import { AudioService, SoundEffect } from '../audio/audio.service';
import { GameStateService } from '../state';
import { StreakService } from './streak.service';

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

const MOCK_ACHIEVEMENT: Achievement = {
  id: 'first-steps',
  title: 'First Steps',
  description: 'Complete your first story mission',
  type: 'discovery',
  isHidden: false,
  isEarned: true,
  earnedDate: '2026-03-25T00:00:00.000Z',
};

const MOCK_ACHIEVEMENT_2: Achievement = {
  id: 'explorer',
  title: 'Explorer',
  description: 'Unlock 4 minigames',
  type: 'discovery',
  isHidden: false,
  isEarned: true,
  earnedDate: '2026-03-25T00:00:00.000Z',
};

describe('AchievementTriggerService', () => {
  let service: AchievementTriggerService;
  let achievementService: AchievementService;
  let notificationService: AchievementNotificationService;
  let audioService: AudioService;
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
    achievementService = TestBed.inject(AchievementService);
    notificationService = TestBed.inject(AchievementNotificationService);
    audioService = TestBed.inject(AudioService);
    service = TestBed.inject(AchievementTriggerService);
    TestBed.flushEffects();
  });

  afterEach(() => {
    Object.defineProperty(window, 'localStorage', {
      value: originalLocalStorage,
      writable: true,
      configurable: true,
    });
    vi.restoreAllMocks();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should call AchievementService.checkAchievements() on triggerCheck()', () => {
    const spy = vi.spyOn(achievementService, 'checkAchievements').mockReturnValue([]);
    service.triggerCheck();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('should show notification for each newly earned achievement', () => {
    vi.spyOn(achievementService, 'checkAchievements').mockReturnValue([
      MOCK_ACHIEVEMENT,
      MOCK_ACHIEVEMENT_2,
    ]);
    const showSpy = vi.spyOn(notificationService, 'show');

    service.triggerCheck();

    expect(showSpy).toHaveBeenCalledTimes(2);
    expect(showSpy).toHaveBeenCalledWith(MOCK_ACHIEVEMENT);
    expect(showSpy).toHaveBeenCalledWith(MOCK_ACHIEVEMENT_2);
  });

  it('should not show notification when no new achievements earned', () => {
    vi.spyOn(achievementService, 'checkAchievements').mockReturnValue([]);
    const showSpy = vi.spyOn(notificationService, 'show');

    service.triggerCheck();

    expect(showSpy).not.toHaveBeenCalled();
  });

  it('should trigger check on rank change (via effect)', () => {
    const spy = vi.spyOn(achievementService, 'checkAchievements').mockReturnValue([]);

    // Cross rank threshold: 0 -> 500 = Cadet -> Ensign
    TestBed.inject(GameStateService).addXp(500);
    TestBed.flushEffects();

    expect(spy).toHaveBeenCalled();
  });

  it('should trigger check on streak change (via effect)', () => {
    vi.useFakeTimers();
    const spy = vi.spyOn(achievementService, 'checkAchievements').mockReturnValue([]);
    const streakService = TestBed.inject(StreakService);

    vi.setSystemTime(new Date('2026-03-01T12:00:00'));
    streakService.recordDailyPlay();
    TestBed.flushEffects();

    expect(spy).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('should play achievement sound for each newly earned achievement', () => {
    vi.spyOn(achievementService, 'checkAchievements').mockReturnValue([
      MOCK_ACHIEVEMENT,
      MOCK_ACHIEVEMENT_2,
    ]);
    vi.spyOn(notificationService, 'show');
    const playSpy = vi.spyOn(audioService, 'play');

    service.triggerCheck();

    expect(playSpy).toHaveBeenCalledTimes(2);
    expect(playSpy).toHaveBeenCalledWith(SoundEffect.achievement);
  });

  it('should not play achievement sound when no new achievements earned', () => {
    vi.spyOn(achievementService, 'checkAchievements').mockReturnValue([]);
    const playSpy = vi.spyOn(audioService, 'play');

    service.triggerCheck();

    expect(playSpy).not.toHaveBeenCalled();
  });

  it('should not trigger check on initial rank value (effect skip)', () => {
    // Reset and create fresh instance to observe init behavior
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});

    const freshAchievementService = TestBed.inject(AchievementService);
    const spy = vi.spyOn(freshAchievementService, 'checkAchievements').mockReturnValue([]);

    TestBed.inject(AchievementTriggerService);
    TestBed.flushEffects();

    // The initial run should NOT call checkAchievements
    expect(spy).not.toHaveBeenCalled();
  });
});
