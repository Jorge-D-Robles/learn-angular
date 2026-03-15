// ---------------------------------------------------------------------------
// Terminal Hack Integration Tests
// ---------------------------------------------------------------------------
// Exercises the engine-shell-level-data pipeline using REAL level data
// (TERMINAL_HACK_LEVELS[0] = th-basic-01) and the REAL
// TerminalHackFormEvaluationService. Catches data authoring bugs that unit
// tests with synthetic data would miss.
// ---------------------------------------------------------------------------

import { TerminalHackEngine } from './terminal-hack.engine';
import { TerminalHackFormEvaluationService } from './terminal-hack-evaluation.service';
import { TERMINAL_HACK_LEVELS } from '../../../data/levels/terminal-hack.data';
import { MinigameStatus, type MinigameLevel } from '../../../core/minigame/minigame.types';
import type { LevelDefinition } from '../../../core/levels/level.types';
import type { TerminalHackLevelData } from './terminal-hack.types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Converts a LevelDefinition to a MinigameLevel by mapping `levelId` -> `id`
 * and dropping authoring-only fields (`title`, `order`, `parTime`).
 * Mirrors the private `toMinigameLevel()` in minigame-play.ts (line 462).
 */
function toMinigameLevel(
  def: LevelDefinition<TerminalHackLevelData>,
): MinigameLevel<TerminalHackLevelData> {
  return {
    id: def.levelId,
    gameId: def.gameId,
    tier: def.tier,
    conceptIntroduced: def.conceptIntroduced,
    description: def.description,
    data: def.data,
  };
}

/** Creates a TerminalHackEngine wired to the real evaluation service. */
function createEngineWithRealData(
  config?: { initialLives?: number },
): { engine: TerminalHackEngine; level: MinigameLevel<TerminalHackLevelData> } {
  const service = new TerminalHackFormEvaluationService();
  const engine = new TerminalHackEngine(
    { initialLives: config?.initialLives },
    service,
  );
  const level = toMinigameLevel(TERMINAL_HACK_LEVELS[0]);
  return { engine, level };
}

/** Place the correct element for level 1 (th-basic-01). */
function placeCorrectElement(engine: TerminalHackEngine): void {
  engine.submitAction({
    type: 'place-element',
    elementId: 'name',
    elementType: 'text',
    toolType: 'ngModel',
  });
}

/** Place a WRONG element for level 1 (correct toolType but wrong elementType). */
function placeWrongElement(engine: TerminalHackEngine): void {
  engine.submitAction({
    type: 'place-element',
    elementId: 'name',
    elementType: 'email', // target expects 'text'
    toolType: 'ngModel',
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Terminal Hack Integration (real level data)', () => {
  // =========================================================================
  // 1. Full pipeline
  // =========================================================================
  it('completes level 1 with correct element placement and all tests passing', () => {
    const { engine, level } = createEngineWithRealData();
    engine.initialize(level);
    engine.start();

    placeCorrectElement(engine);

    const result = engine.runTestCases();

    expect(result).not.toBeNull();
    expect(result!.allPassed).toBe(true);
    expect(result!.passRate).toBe(1.0);
    expect(result!.passCount).toBe(2);
    expect(engine.status()).toBe(MinigameStatus.Won);
    expect(engine.score()).toBeGreaterThan(0);
  });

  // =========================================================================
  // 2. State transitions — win path (Loading -> Playing -> Won)
  // =========================================================================
  it('transitions Loading -> Playing -> Won on correct completion', () => {
    const { engine, level } = createEngineWithRealData();

    engine.initialize(level);
    expect(engine.status()).toBe(MinigameStatus.Loading);

    engine.start();
    expect(engine.status()).toBe(MinigameStatus.Playing);

    placeCorrectElement(engine);
    engine.runTestCases();
    expect(engine.status()).toBe(MinigameStatus.Won);
  });

  // =========================================================================
  // 3. State transitions — lose path (Loading -> Playing -> Lost)
  // =========================================================================
  it('transitions Loading -> Playing -> Lost after 3 failed test runs', () => {
    const { engine, level } = createEngineWithRealData(); // default 3 lives
    engine.initialize(level);
    engine.start();

    placeWrongElement(engine);

    engine.runTestCases(); // fail 1
    expect(engine.lives()).toBe(2);
    expect(engine.status()).toBe(MinigameStatus.Playing);

    engine.runTestCases(); // fail 2
    expect(engine.lives()).toBe(1);
    expect(engine.status()).toBe(MinigameStatus.Playing);

    engine.runTestCases(); // fail 3 — lives reach 0
    expect(engine.lives()).toBe(0);
    expect(engine.status()).toBe(MinigameStatus.Lost);
  });

  // =========================================================================
  // 4. LevelCompletionService data shape
  // =========================================================================
  // AC reinterpretation: Since this is an engine-layer integration test (not a
  // component-layer test), we verify the engine produces the correct data shape
  // that LevelCompletionService.completeLevel() would consume — score, levelId,
  // and status — rather than constructing a real LevelCompletionService which
  // would require injecting 5+ services and is out of scope.
  it('produces the data shape needed by LevelCompletionService after winning', () => {
    const { engine, level } = createEngineWithRealData();
    engine.initialize(level);
    engine.start();

    placeCorrectElement(engine);
    engine.runTestCases();

    expect(engine.currentLevel()).toBe('th-basic-01');
    expect(engine.status()).toBe(MinigameStatus.Won);
    // Perfect score: maxScore=1000, passRate=1.0, speedMultiplier=120/120=1.0,
    // attemptMultiplier=1.0 (first run), hintDeduction=0
    expect(engine.score()).toBe(1000);
  });

  // =========================================================================
  // 5-8. Scoring tests
  // =========================================================================

  describe('scoring with time', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    // Test 5: time penalty
    it('applies time penalty when half the time has elapsed', () => {
      const { engine, level } = createEngineWithRealData();
      engine.initialize(level);
      engine.start();

      vi.advanceTimersByTime(60_000); // 60 seconds elapsed, 60 remaining of 120

      placeCorrectElement(engine);
      engine.runTestCases();

      // score = Math.round(1000 * 1.0 * (60/120) * 1.0) = 500
      expect(engine.score()).toBe(500);
    });

    // Test 8: combined time + hint + attempt penalties
    it('applies combined time, hint, and attempt penalties', () => {
      const { engine, level } = createEngineWithRealData({ initialLives: 10 });
      engine.initialize(level);
      engine.start();

      // 60 seconds elapsed
      vi.advanceTimersByTime(60_000);

      // Use 1 hint
      engine.recordHintUsed();

      // Fail once with wrong element
      placeWrongElement(engine);
      engine.runTestCases(); // fail, runCount=1

      // Fix: remove wrong, place correct
      engine.submitAction({ type: 'remove-element', elementId: 'name' });
      placeCorrectElement(engine);
      engine.runTestCases(); // pass, runCount=2

      // attemptMultiplier = 1.0 - 0.1 * (2-1) = 0.9
      // speedMultiplier = 60/120 = 0.5
      // score = Math.round(1000 * 1.0 * 0.5 * 0.9) - 50 = 450 - 50 = 400
      expect(engine.score()).toBe(400);
    });
  });

  // Test 6: hint penalty (no fake timers needed)
  it('applies hint penalty without affecting base multipliers', () => {
    const { engine, level } = createEngineWithRealData();
    engine.initialize(level);
    engine.start();

    engine.recordHintUsed();
    engine.recordHintUsed();

    placeCorrectElement(engine);
    engine.runTestCases();

    // score = Math.round(1000 * 1.0 * 1.0 * 1.0) - 2 * 50 = 1000 - 100 = 900
    expect(engine.score()).toBe(900);
  });

  // Test 7: attempt penalty (no fake timers needed)
  it('applies attempt penalty for multiple failed runs then success', () => {
    const { engine, level } = createEngineWithRealData({ initialLives: 10 });
    engine.initialize(level);
    engine.start();

    // Fail once with wrong element
    placeWrongElement(engine);
    engine.runTestCases(); // fail, runCount=1

    // Fix: remove wrong, place correct
    engine.submitAction({ type: 'remove-element', elementId: 'name' });
    placeCorrectElement(engine);
    engine.runTestCases(); // pass, runCount=2

    // attemptMultiplier = 1.0 - 0.1 * (2-1) = 0.9
    // score = Math.round(1000 * 1.0 * 1.0 * 0.9) = 900
    expect(engine.score()).toBe(900);
  });
});
