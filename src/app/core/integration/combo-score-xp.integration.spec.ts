import { TestBed } from '@angular/core/testing';
import {
  DifficultyTier,
  type MinigameId,
  type MinigameLevel,
  type MinigameResult,
  type MinigameEngineConfig,
  LevelCompletionService,
  ScoreCalculationService,
  MinigameEngine,
  type ActionResult,
} from '../minigame';
import { ComboTrackerService } from '../minigame/combo-tracker.service';
import { LevelProgressionService, type LevelDefinition } from '../levels';
import { XpService } from '../progression';

// --- MockAudio ---

class MockAudio {
  src: string;
  preload = '';
  volume = 1;
  playSpy = vi.fn().mockResolvedValue(undefined);

  constructor(src = '') {
    this.src = src;
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

// --- TestEngine ---

class TestEngine extends MinigameEngine<void> {
  constructor(config: Partial<MinigameEngineConfig> = {}) {
    super(config);
  }

  protected onLevelLoad(): void { /* no-op */ }
  protected onStart(): void { /* no-op */ }
  protected onComplete(): void { /* no-op */ }

  protected validateAction(_action: unknown): ActionResult {
    return { valid: true, scoreChange: 10, livesChange: 0 };
  }
}

// --- Test data ---

const TEST_GAME_ID: MinigameId = 'module-assembly';

const testLevels: LevelDefinition<unknown>[] = [
  { levelId: 'combo-basic-01', gameId: TEST_GAME_ID, tier: DifficultyTier.Basic, order: 1, title: 'Combo L1', conceptIntroduced: 'c1', description: 'd1', data: {} },
];

const testLevel: MinigameLevel<void> = {
  id: 'combo-basic-01',
  gameId: TEST_GAME_ID,
  tier: DifficultyTier.Basic,
  conceptIntroduced: 'c1',
  description: 'd1',
  data: undefined,
};

function makeResult(overrides: Partial<MinigameResult> = {}): MinigameResult {
  return {
    gameId: TEST_GAME_ID,
    levelId: 'combo-basic-01',
    score: 270,
    perfect: false,
    timeElapsed: 30,
    xpEarned: 0,
    starRating: 1,
    ...overrides,
  };
}

// --- Integration tests ---

describe('Combo -> Score -> XP -> Diminishing Returns pipeline', () => {
  let comboTracker: ComboTrackerService;
  let scoreCalc: ScoreCalculationService;
  let levelCompletion: LevelCompletionService;
  let levelProgression: LevelProgressionService;
  let xpService: XpService;
  let engine: TestEngine;
  let originalLocalStorage: Storage;
  let originalMatchMedia: typeof window.matchMedia;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-07T12:00:00'));

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

    comboTracker = TestBed.inject(ComboTrackerService);
    scoreCalc = TestBed.inject(ScoreCalculationService);
    levelCompletion = TestBed.inject(LevelCompletionService);
    levelProgression = TestBed.inject(LevelProgressionService);
    xpService = TestBed.inject(XpService);

    engine = new TestEngine({ comboTracker });

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

  it('submitting 5 consecutive correct actions yields comboMultiplier > 1.0', () => {
    engine.initialize(testLevel);
    engine.start();

    for (let i = 0; i < 5; i++) {
      engine.submitAction(null);
      engine.recordCorrectAction();
    }

    expect(comboTracker.currentCombo()).toBe(5);
    expect(comboTracker.comboMultiplier()).toBe(2.0);
    expect(engine.getComboMultiplier()).toBe(2.0);
  });

  it('score with active combo is higher than without combo', () => {
    const config = { timeWeight: 1, accuracyWeight: 1, comboWeight: 1, maxScore: 1000 };

    const scoreNoCombo = scoreCalc.calculateScore(config, 50, 80, 5, 1.0);
    const scoreWithCombo = scoreCalc.calculateScore(config, 50, 80, 5, 2.0);

    expect(scoreNoCombo).toBe(135);
    expect(scoreWithCombo).toBe(270);
    expect(scoreWithCombo).toBeGreaterThan(scoreNoCombo);
  });

  it('incorrect action resets combo, reducing multiplier to 1.0', () => {
    engine.initialize(testLevel);
    engine.start();

    // Build a 5-combo
    for (let i = 0; i < 5; i++) {
      engine.submitAction(null);
      engine.recordCorrectAction();
    }
    expect(engine.getComboMultiplier()).toBe(2.0);

    // Break the combo
    engine.recordIncorrectAction();

    expect(comboTracker.currentCombo()).toBe(0);
    expect(comboTracker.comboMultiplier()).toBe(1.0);
    expect(engine.getComboMultiplier()).toBe(1.0);

    // Verify score recalculation reflects no combo
    const config = { timeWeight: 1, accuracyWeight: 1, comboWeight: 1, maxScore: 1000 };
    const resetScore = scoreCalc.calculateScore(config, 50, 80, 5, engine.getComboMultiplier());
    expect(resetScore).toBe(135);
  });

  it('completing level with combo-boosted score awards XP reflecting higher score', () => {
    const summary = levelCompletion.completeLevel(
      makeResult({ score: 270, perfect: false, starRating: 1 }),
    );

    // Basic tier, non-perfect, first play, no streak, no hints = 15 XP
    expect(summary.xpEarned).toBe(15);
    expect(summary.replayMultiplier).toBe(1.0);
    expect(xpService.totalXp()).toBe(15);
  });

  it('replaying the same level reduces XP via diminishing returns', () => {
    // First completion
    const summary1 = levelCompletion.completeLevel(
      makeResult({ score: 270, perfect: false, starRating: 1 }),
    );
    expect(summary1.replayMultiplier).toBe(1.0);
    expect(summary1.xpEarned).toBe(15);

    // Second completion (same level, same star rating -> no star improvement)
    const summary2 = levelCompletion.completeLevel(
      makeResult({ score: 270, perfect: false, starRating: 1 }),
    );
    expect(summary2.replayMultiplier).toBe(0.5);
    expect(summary2.xpEarned).toBe(Math.round(15 * 0.5)); // 8
    expect(xpService.totalXp()).toBe(15 + 8);
  });
});
