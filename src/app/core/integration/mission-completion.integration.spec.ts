import { TestBed } from '@angular/core/testing';
import {
  StoryMissionCompletionService,
  type ChapterId,
} from '../curriculum';
import {
  XpService,
  MasteryService,
  GameProgressionService,
} from '../progression';
import { MissionUnlockNotificationService } from '../notifications';

// --- MockAudio ---

const createdMocks: MockAudio[] = [];

class MockAudio {
  src: string;
  preload = '';
  volume = 1;
  playSpy = vi.fn().mockResolvedValue(undefined);

  constructor(src = '') {
    this.src = src;
    createdMocks.push(this);
  }

  cloneNode(_deep: boolean): MockAudio {
    const clone = new MockAudio(this.src);
    clone.preload = this.preload;
    clone.volume = this.volume;
    clone.playSpy = vi.fn().mockResolvedValue(undefined);
    return clone;
  }

  play(): Promise<void> {
    return this.playSpy();
  }
}

// --- Fake storage ---

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

// --- Helper ---

/**
 * Completes missions 1..n in order via the facade service,
 * satisfying dependency chains.
 */
function completeMissionsUpTo(
  service: StoryMissionCompletionService,
  n: number,
): void {
  for (let i = 1; i <= n; i++) {
    service.completeMission(i as ChapterId);
  }
}

// --- Integration tests ---

describe('Mission completion -> unlock notification integration', () => {
  let completionService: StoryMissionCompletionService;
  let xpService: XpService;
  let masteryService: MasteryService;
  let gameProgression: GameProgressionService;
  let unlockNotification: MissionUnlockNotificationService;
  let originalLocalStorage: Storage;
  let originalMatchMedia: typeof window.matchMedia;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-25T12:00:00'));

    createdMocks.length = 0;

    originalLocalStorage = window.localStorage;
    originalMatchMedia = window.matchMedia;

    const fakeStorage = createFakeStorage();
    Object.defineProperty(window, 'localStorage', {
      value: fakeStorage,
      writable: true,
      configurable: true,
    });

    Object.defineProperty(window, 'matchMedia', {
      value: vi.fn().mockReturnValue({ matches: false, addEventListener: vi.fn() }),
      writable: true,
      configurable: true,
    });

    vi.stubGlobal('Audio', MockAudio);

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});

    completionService = TestBed.inject(StoryMissionCompletionService);
    xpService = TestBed.inject(XpService);
    masteryService = TestBed.inject(MasteryService);
    gameProgression = TestBed.inject(GameProgressionService);
    unlockNotification = TestBed.inject(MissionUnlockNotificationService);

    TestBed.flushEffects();
  });

  afterEach(() => {
    vi.runAllTimers();
    vi.useRealTimers();
    Object.defineProperty(window, 'localStorage', {
      value: originalLocalStorage,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(window, 'matchMedia', {
      value: originalMatchMedia,
      writable: true,
      configurable: true,
    });
    vi.unstubAllGlobals();
  });

  it('completing Ch 1 awards exactly 50 XP', () => {
    expect(xpService.totalXp()).toBe(0);

    const summary = completionService.completeMission(1 as ChapterId);

    expect(summary.xpAwarded).toBe(50);
    expect(xpService.totalXp()).toBe(50);
  });

  it('completing Ch 1 unlocks Module Assembly minigame', () => {
    expect(gameProgression.isMinigameUnlocked('module-assembly')).toBe(false);

    const summary = completionService.completeMission(1 as ChapterId);

    expect(gameProgression.isMinigameUnlocked('module-assembly')).toBe(true);
    expect(summary.unlockedMinigame).toBe('module-assembly');
  });

  it('MissionUnlockNotificationService.showUnlock() called with correct arguments for Ch 1', () => {
    const showSpy = vi.spyOn(unlockNotification, 'showUnlock');

    completionService.completeMission(1 as ChapterId);

    expect(showSpy).toHaveBeenCalledTimes(1);
    expect(showSpy).toHaveBeenCalledWith('Module Assembly', 'module-assembly');
  });

  it('MasteryService updated to 1 star for module-assembly after Ch 1', () => {
    expect(masteryService.getMastery('module-assembly')).toBe(0);

    completionService.completeMission(1 as ChapterId);

    expect(masteryService.getMastery('module-assembly')).toBe(1);
  });

  it('completing Ch 9 (no minigame) does not trigger unlock notification', () => {
    const showSpy = vi.spyOn(unlockNotification, 'showUnlock');

    // Satisfy prerequisites: complete chapters 1-8
    completeMissionsUpTo(completionService, 8);
    showSpy.mockClear();

    const summary = completionService.completeMission(9 as ChapterId);

    expect(showSpy).not.toHaveBeenCalled();
    expect(summary.unlockedMinigame).toBeNull();
    expect(summary.masteryAwarded).toBe(false);
  });

  it('completing Ch 1 twice does not double XP or re-trigger notification', () => {
    const showSpy = vi.spyOn(unlockNotification, 'showUnlock');

    const first = completionService.completeMission(1 as ChapterId);
    expect(first.alreadyCompleted).toBe(false);

    const xpAfterFirst = xpService.totalXp();
    showSpy.mockClear();

    const second = completionService.completeMission(1 as ChapterId);

    expect(second.alreadyCompleted).toBe(true);
    expect(xpService.totalXp()).toBe(xpAfterFirst);
    expect(showSpy).not.toHaveBeenCalled();
  });
});
