import { TestBed } from '@angular/core/testing';
import {
  StoryMissionCompletionService,
  CurriculumService,
  type ChapterId,
} from '../../core/curriculum';
import {
  XpService,
  MasteryService,
  GameProgressionService,
} from '../../core/progression';
import {
  LevelCompletionService,
  DifficultyTier,
  type MinigameResult,
} from '../../core/minigame';
import { LevelProgressionService, type LevelDefinition } from '../../core/levels';

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

// --- Test data ---

const TEST_LEVELS: LevelDefinition<unknown>[] = [
  { levelId: 'ma-basic-01', gameId: 'module-assembly', tier: DifficultyTier.Basic, order: 1, title: 'L1', conceptIntroduced: 'c1', description: 'd1', data: {} },
  { levelId: 'ma-basic-02', gameId: 'module-assembly', tier: DifficultyTier.Basic, order: 2, title: 'L2', conceptIntroduced: 'c2', description: 'd2', data: {} },
];

function makeResult(overrides: Partial<MinigameResult> = {}): MinigameResult {
  return {
    gameId: 'module-assembly',
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

describe('Story mission -> minigame unlock -> XP integration', () => {
  let completionService: StoryMissionCompletionService;
  let gameProgression: GameProgressionService;
  let curriculum: CurriculumService;
  let xpService: XpService;
  let masteryService: MasteryService;
  let levelCompletion: LevelCompletionService;
  let levelProgression: LevelProgressionService;
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
    gameProgression = TestBed.inject(GameProgressionService);
    curriculum = TestBed.inject(CurriculumService);
    xpService = TestBed.inject(XpService);
    masteryService = TestBed.inject(MasteryService);
    levelCompletion = TestBed.inject(LevelCompletionService);
    levelProgression = TestBed.inject(LevelProgressionService);

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

  it('completing story mission Ch 1 unlocks Module Assembly minigame', () => {
    expect(gameProgression.isMinigameUnlocked('module-assembly')).toBe(false);

    const summary = completionService.completeMission(1 as ChapterId);

    expect(gameProgression.isMinigameUnlocked('module-assembly')).toBe(true);
    expect(summary.unlockedMinigame).toBe('module-assembly');
  });

  it('completing story mission unlocks the correct minigame per curriculum mapping', () => {
    // Complete missions 1-4 to unlock flow-commander (Ch 4)
    completeMissionsUpTo(completionService, 4);

    expect(gameProgression.isMinigameUnlocked('flow-commander')).toBe(true);
    expect(curriculum.getMinigameForChapter(4 as ChapterId)).toBe('flow-commander');

    // Complete missions 5-7 to unlock wire-protocol (Ch 5) and signal-corps (Ch 7)
    completeMissionsUpTo(completionService, 7);

    expect(gameProgression.isMinigameUnlocked('wire-protocol')).toBe(true);
    expect(gameProgression.isMinigameUnlocked('signal-corps')).toBe(true);
  });

  it('locked minigame cannot be played before its prerequisite story mission', () => {
    expect(gameProgression.isMinigameUnlocked('flow-commander')).toBe(false);

    // Complete only Ch 1 (unlocks module-assembly, not flow-commander)
    completionService.completeMission(1 as ChapterId);

    expect(gameProgression.isMinigameUnlocked('flow-commander')).toBe(false);
    expect(gameProgression.isMinigameUnlocked('module-assembly')).toBe(true);
  });

  it('XP is awarded for story mission completion (50 XP per mission)', () => {
    expect(xpService.totalXp()).toBe(0);

    completionService.completeMission(1 as ChapterId);
    expect(xpService.totalXp()).toBe(50);

    completionService.completeMission(2 as ChapterId);
    expect(xpService.totalXp()).toBe(100);
  });

  it('XP is awarded for minigame level completion alongside story XP', () => {
    // Complete Ch 1: awards 50 XP and unlocks module-assembly
    completionService.completeMission(1 as ChapterId);
    expect(xpService.totalXp()).toBe(50);

    // Register test level and complete it (Basic tier, non-perfect = 15 XP)
    levelProgression.registerLevels(TEST_LEVELS);
    levelCompletion.completeLevel(makeResult());

    expect(xpService.totalXp()).toBe(65);
  });

  it('mastery is set to 1 star on story unlock, updated to calculated value on level completion', () => {
    expect(masteryService.getMastery('module-assembly')).toBe(0);

    // Complete Ch 1: ensureMinimumMastery sets 1 star
    completionService.completeMission(1 as ChapterId);
    expect(masteryService.getMastery('module-assembly')).toBe(1);

    // Register test level and complete it
    levelProgression.registerLevels(TEST_LEVELS);
    levelCompletion.completeLevel(makeResult());

    // Still 1 star: 1 of 2 Basic levels completed = star 1, floor already 1
    expect(masteryService.getMastery('module-assembly')).toBe(1);
  });
});
