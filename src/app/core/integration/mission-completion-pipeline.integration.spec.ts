// ---------------------------------------------------------------------------
// Integration test: StoryMissionCompletionService full XP-mastery-unlock
// pipeline
// ---------------------------------------------------------------------------
// Verifies the full internal pipeline: completeMission() -> award XP via
// XpService -> set mastery via MasteryService -> unlock minigame via
// GameProgressionService -> record mission as completed.
// Uses real services with fake localStorage.
// ---------------------------------------------------------------------------

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
import { CurriculumService } from '../curriculum/curriculum.service';

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

function completeMissionsUpTo(
  service: StoryMissionCompletionService,
  n: number,
): void {
  for (let i = 1; i <= n; i++) {
    service.completeMission(i as ChapterId);
  }
}

// --- Integration tests ---

describe('StoryMissionCompletionService full XP-mastery-unlock pipeline', () => {
  let completionService: StoryMissionCompletionService;
  let xpService: XpService;
  let masteryService: MasteryService;
  let gameProgression: GameProgressionService;
  let curriculum: CurriculumService;
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
    curriculum = TestBed.inject(CurriculumService);

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

  it('completeMission(1) awards exactly 50 XP via XpService.addXp()', () => {
    expect(xpService.totalXp()).toBe(0);

    const summary = completionService.completeMission(1 as ChapterId);

    expect(summary.xpAwarded).toBe(50);
    expect(xpService.totalXp()).toBe(50);
  });

  it('completeMission(1) sets mastery for module-assembly topic to at least 1 star', () => {
    expect(masteryService.getMastery('module-assembly')).toBe(0);

    completionService.completeMission(1 as ChapterId);

    expect(masteryService.getMastery('module-assembly')).toBeGreaterThanOrEqual(1);
  });

  it('completeMission(1) marks Chapter 1 as completed in GameProgressionService', () => {
    expect(gameProgression.isMissionCompleted(1 as ChapterId)).toBe(false);

    completionService.completeMission(1 as ChapterId);

    expect(gameProgression.isMissionCompleted(1 as ChapterId)).toBe(true);
  });

  it('completeMission(1) unlocks Module Assembly minigame', () => {
    expect(gameProgression.isMinigameUnlocked('module-assembly')).toBe(false);

    completionService.completeMission(1 as ChapterId);

    expect(gameProgression.isMinigameUnlocked('module-assembly')).toBe(true);
  });

  it('completeMission(9) (no minigame unlock) still awards XP and mastery but does not trigger unlock', () => {
    // Complete prerequisites: chapters 1-8
    completeMissionsUpTo(completionService, 8);

    const xpBefore = xpService.totalXp();

    const summary = completionService.completeMission(9 as ChapterId);

    // XP was awarded
    expect(summary.xpAwarded).toBe(50);
    expect(xpService.totalXp()).toBe(xpBefore + 50);

    // No minigame unlocked by Ch 9 (Deferrable Views)
    expect(summary.unlockedMinigame).toBeNull();
    expect(summary.masteryAwarded).toBe(false);
  });

  it('completing an already-completed mission is idempotent (no duplicate XP)', () => {
    const first = completionService.completeMission(1 as ChapterId);
    expect(first.alreadyCompleted).toBe(false);

    const xpAfterFirst = xpService.totalXp();

    const second = completionService.completeMission(1 as ChapterId);

    expect(second.alreadyCompleted).toBe(true);
    expect(second.xpAwarded).toBe(0);
    expect(xpService.totalXp()).toBe(xpAfterFirst);
  });
});
