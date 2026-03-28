import { TestBed } from '@angular/core/testing';
import { MissionUnlockNotificationService } from '../notifications/mission-unlock-notification.service';
import { GameProgressionService } from '../progression/game-progression.service';
import type { ChapterId } from '../curriculum/curriculum.types';

class MockAudio {
  src = ''; preload = ''; volume = 1;
  cloneNode(): MockAudio { return new MockAudio(); }
  play(): Promise<void> { return Promise.resolve(); }
}

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

describe('MissionUnlockNotificationService lifecycle', () => {
  let notificationService: MissionUnlockNotificationService;
  let gameProgression: GameProgressionService;
  let originalLocalStorage: Storage;
  let originalMatchMedia: typeof window.matchMedia;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-25T12:00:00'));
    originalLocalStorage = window.localStorage;
    originalMatchMedia = window.matchMedia;
    Object.defineProperty(window, 'localStorage', { value: createFakeStorage(), writable: true, configurable: true });
    Object.defineProperty(window, 'matchMedia', { value: () => ({ matches: false, addEventListener: () => { /* noop */ }, removeEventListener: () => { /* noop */ } }), writable: true, configurable: true });
    vi.stubGlobal('Audio', MockAudio);
    TestBed.configureTestingModule({});
    notificationService = TestBed.inject(MissionUnlockNotificationService);
    gameProgression = TestBed.inject(GameProgressionService);
  });

  afterEach(() => {
    Object.defineProperty(window, 'localStorage', { value: originalLocalStorage, writable: true, configurable: true });
    Object.defineProperty(window, 'matchMedia', { value: originalMatchMedia, writable: true, configurable: true });
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('completing mission 1 that unlocks module-assembly shows unlock notification', () => {
    gameProgression.completeMission(1 as ChapterId);
    expect(notificationService.notifications().length).toBeGreaterThanOrEqual(1);
  });

  it('notification displays the correct minigame name', () => {
    gameProgression.completeMission(1 as ChapterId);
    const notifications = notificationService.notifications();
    expect(notifications.length).toBeGreaterThanOrEqual(1);
    expect(notifications[0].gameId).toBe('module-assembly');
  });

  it('notification auto-dismisses after timeout', () => {
    gameProgression.completeMission(1 as ChapterId);
    expect(notificationService.notifications().length).toBeGreaterThanOrEqual(1);
    vi.advanceTimersByTime(6000);
    expect(notificationService.notifications().length).toBe(0);
  });
});
