// ---------------------------------------------------------------------------
// Integration test: Replay XP diminishing returns across multiple completions
// ---------------------------------------------------------------------------
// Verifies the multi-play scenario: first play yields full XP, second play
// yields reduced XP, and star improvement on replay partially restores XP.
// Uses real LevelCompletionService and XpDiminishingReturnsService.
// ---------------------------------------------------------------------------

import { TestBed } from '@angular/core/testing';
import {
  DifficultyTier,
  type MinigameId,
  type MinigameResult,
  LevelCompletionService,
} from '../minigame';
import { LevelProgressionService, type LevelDefinition } from '../levels';
import {
  XpService,
} from '../progression';
import {
  XpDiminishingReturnsService,
  REPLAY_MULTIPLIERS,
} from '../progression/xp-diminishing-returns.service';


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

// --- Test data ---

const TEST_GAME_ID: MinigameId = 'module-assembly';

const testLevels: LevelDefinition<unknown>[] = [
  { levelId: 'ma-basic-01', gameId: TEST_GAME_ID, tier: DifficultyTier.Basic, order: 1, title: 'L1', conceptIntroduced: 'c1', description: 'd1', data: {} },
];

function makeResult(overrides: Partial<MinigameResult> = {}): MinigameResult {
  return {
    gameId: TEST_GAME_ID,
    levelId: 'ma-basic-01',
    score: 100,
    perfect: false,
    timeElapsed: 30,
    xpEarned: 0,
    starRating: 1,
    ...overrides,
  };
}

// --- Integration tests ---

describe('Replay XP diminishing returns integration', () => {
  let levelCompletion: LevelCompletionService;
  let levelProgression: LevelProgressionService;
  let xpService: XpService;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let diminishingReturns: XpDiminishingReturnsService;
  let fakeStorage: Storage;
  let originalLocalStorage: Storage;
  let originalMatchMedia: typeof window.matchMedia;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-25T12:00:00'));

    createdMocks.length = 0;

    originalLocalStorage = window.localStorage;
    originalMatchMedia = window.matchMedia;

    fakeStorage = createFakeStorage();
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

    levelCompletion = TestBed.inject(LevelCompletionService);
    levelProgression = TestBed.inject(LevelProgressionService);
    xpService = TestBed.inject(XpService);
    diminishingReturns = TestBed.inject(XpDiminishingReturnsService);

    levelProgression.registerLevels(testLevels);
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

  it('first play yields full XP (replayMultiplier = 1.0)', () => {
    const summary = levelCompletion.completeLevel(
      makeResult({ starRating: 1, perfect: false }),
    );

    // Basic tier non-perfect = 15 XP, first play multiplier = 1.0
    expect(summary.replayMultiplier).toBe(REPLAY_MULTIPLIERS[0]);
    expect(summary.xpEarned).toBe(15);
    expect(xpService.totalXp()).toBe(15);
  });

  it('replay with same score yields reduced XP (replayMultiplier < 1.0)', () => {
    // First play
    const first = levelCompletion.completeLevel(
      makeResult({ starRating: 1, perfect: false }),
    );
    const firstXp = first.xpEarned;
    expect(first.replayMultiplier).toBe(1.0);

    // Replay with same score
    const second = levelCompletion.completeLevel(
      makeResult({ starRating: 1, perfect: false }),
    );

    expect(second.replayMultiplier).toBe(REPLAY_MULTIPLIERS[1]);
    expect(second.xpEarned).toBeLessThan(firstXp);
    // 15 * 0.5 = 7.5 -> rounds to 8
    expect(second.xpEarned).toBe(Math.round(15 * REPLAY_MULTIPLIERS[1]));
  });

  it('replay with higher star rating partially restores XP (star improvement bypasses diminishing returns)', () => {
    // First play with 1 star
    levelCompletion.completeLevel(
      makeResult({ starRating: 1, perfect: false }),
    );

    // Replay with higher star rating (2 stars)
    const improved = levelCompletion.completeLevel(
      makeResult({ starRating: 2, perfect: false }),
    );

    // Star improvement bypasses the diminishing multiplier
    // so XP is the full base XP (15) not the diminished amount
    expect(improved.xpEarned).toBe(15);
  });

  it('diminishing returns persist across service restarts (loaded from localStorage)', () => {
    // First play
    levelCompletion.completeLevel(
      makeResult({ starRating: 1, perfect: false }),
    );

    // Flush debounced save
    vi.advanceTimersByTime(XpDiminishingReturnsService.SAVE_DEBOUNCE_MS);

    // Verify data was persisted
    const saved = fakeStorage.getItem('nexus-station:diminishing-returns');
    expect(saved).not.toBeNull();
    const parsed = JSON.parse(saved!);
    expect(parsed['module-assembly:ma-basic-01']).toBeDefined();
    expect(parsed['module-assembly:ma-basic-01'].completionCount).toBe(1);

    // Simulate reload: create fresh TestBed
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const reloadedDR = TestBed.inject(XpDiminishingReturnsService);
    TestBed.flushEffects();

    // Reloaded service should have the persisted completion count
    expect(reloadedDR.getCompletionCount(TEST_GAME_ID, 'ma-basic-01')).toBe(1);
    expect(reloadedDR.getReplayMultiplier(TEST_GAME_ID, 'ma-basic-01')).toBe(REPLAY_MULTIPLIERS[1]);
  });
});
