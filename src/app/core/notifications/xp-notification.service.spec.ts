import { TestBed } from '@angular/core/testing';
import { XpNotificationService } from './xp-notification.service';
import { AudioService, SoundEffect } from '../audio';
import { SettingsService } from '../settings';

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

describe('XpNotificationService', () => {
  let service: XpNotificationService;
  let audioService: AudioService;
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
    audioService = TestBed.inject(AudioService);
    vi.spyOn(audioService, 'play');
    service = TestBed.inject(XpNotificationService);
  });

  afterEach(() => {
    vi.useRealTimers();
    Object.defineProperty(window, 'localStorage', {
      value: originalLocalStorage,
      writable: true,
      configurable: true,
    });
    vi.restoreAllMocks();
  });

  it('show() adds a notification', () => {
    service.show(25);

    const notifications = service.notifications();
    expect(notifications.length).toBe(1);
    expect(notifications[0].amount).toBe(25);
    expect(notifications[0].bonuses).toEqual([]);
  });

  it('show() with bonuses stores bonus labels', () => {
    service.show(50, ['Perfect!', 'Streak x3']);

    const notifications = service.notifications();
    expect(notifications.length).toBe(1);
    expect(notifications[0].amount).toBe(50);
    expect(notifications[0].bonuses).toEqual(['Perfect!', 'Streak x3']);
  });

  it('multiple show() calls stack notifications', () => {
    service.show(10);
    service.show(20);
    service.show(30);

    expect(service.notifications().length).toBe(3);
  });

  it('auto-dismisses after duration', () => {
    service.show(10, [], 3000);

    expect(service.notifications().length).toBe(1);

    vi.advanceTimersByTime(3000);

    expect(service.notifications().length).toBe(0);
  });

  it('dismiss() removes specific notification and cancels its timer', () => {
    service.show(10);
    service.show(20);

    const firstId = service.notifications()[0].id;

    service.dismiss(firstId);

    const remaining = service.notifications();
    expect(remaining.length).toBe(1);
    expect(remaining[0].amount).toBe(20);

    // Advance past default duration to verify second auto-dismisses
    vi.advanceTimersByTime(3000);

    expect(service.notifications().length).toBe(0);
  });

  it('each notification gets a unique ID', () => {
    service.show(10);
    service.show(20);

    const ids = service.notifications().map((n) => n.id);
    expect(ids[0]).not.toBe(ids[1]);
  });

  it('should play levelUp sound when show() is called with isLevelUp: true', () => {
    service.show(25, ['Level Complete'], 3000, { isLevelUp: true });

    expect(audioService.play).toHaveBeenCalledWith(SoundEffect.levelUp);
    expect(audioService.play).toHaveBeenCalledTimes(1);
  });

  it('should not play sound when show() is called without options', () => {
    service.show(50, ['Daily Challenge']);

    expect(audioService.play).not.toHaveBeenCalled();
  });

  it('should not play sound when show() is called with isLevelUp: false', () => {
    service.show(50, ['Streak Bonus'], 3000, { isLevelUp: false });

    expect(audioService.play).not.toHaveBeenCalled();
  });

  it('should delegate sound-enabled check to AudioService (always calls play)', () => {
    const settingsService = TestBed.inject(SettingsService);
    settingsService.updateSetting('soundEnabled', false);

    service.show(25, [], 3000, { isLevelUp: true });

    expect(audioService.play).toHaveBeenCalledWith(SoundEffect.levelUp);
  });
});
