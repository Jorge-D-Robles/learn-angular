// ---------------------------------------------------------------------------
// Integration tests: SystemCertificationEngine + SystemCertificationTestRunnerServiceImpl
// ---------------------------------------------------------------------------
// Exercises the coordinated lifecycle: engine constructor accepts service,
// initialize() loads source code, submit-test action stores test code,
// runTests() executes tests via the service, coverage calculation updates,
// and the engine transitions status based on threshold.
//
// Uses REAL SystemCertificationTestRunnerServiceImpl (not mocks) and REAL level data.
// ---------------------------------------------------------------------------

import { SystemCertificationEngine } from './system-certification.engine';
import { SystemCertificationTestRunnerServiceImpl } from './system-certification-test-runner.service';
import { SYSTEM_CERTIFICATION_LEVELS } from '../../../data/levels/system-certification.data';
import { MinigameStatus, type MinigameLevel } from '../../../core/minigame/minigame.types';
import type { LevelDefinition } from '../../../core/levels/level.types';
import type { SystemCertificationLevelData } from './system-certification.types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toMinigameLevel(
  def: LevelDefinition<SystemCertificationLevelData>,
): MinigameLevel<SystemCertificationLevelData> {
  return {
    id: def.levelId,
    gameId: def.gameId,
    tier: def.tier,
    conceptIntroduced: def.conceptIntroduced,
    description: def.description,
    data: def.data,
  };
}

function createEngineWithService(levelIndex: number): {
  engine: SystemCertificationEngine;
  service: SystemCertificationTestRunnerServiceImpl;
  level: MinigameLevel<SystemCertificationLevelData>;
} {
  const service = new SystemCertificationTestRunnerServiceImpl();
  const engine = new SystemCertificationEngine(undefined, service);
  const level = toMinigameLevel(SYSTEM_CERTIFICATION_LEVELS[levelIndex]);
  return { engine, service, level };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('SystemCertificationEngine + SystemCertificationTestRunnerService integration', () => {
  // Test 1: engine.initialize() loads source code into engine state
  it('initialize() loads source code into engine state', () => {
    const { engine, level } = createEngineWithService(0); // level 1

    engine.initialize(level);

    expect(engine.sourceCode()).not.toBeNull();
    expect(engine.sourceCode()!.lines.length).toBeGreaterThan(0);
    expect(engine.status()).toBe(MinigameStatus.Loading);
    expect(engine.coverage()).toBeNull();
    expect(engine.testRunSummary()).toBeNull();
  });

  // Test 2: run-tests action executes player test code via test runner service and returns results
  it('runTests() executes test code via service and returns results', () => {
    const { engine, level } = createEngineWithService(0);

    engine.initialize(level);
    engine.start();

    // Level 1 (sc-basic-01) has testable point on line 8
    engine.submitAction({
      type: 'submit-test',
      testCode: `it('should have title', () => { expect(component.title).toBe('Welcome'); // line 8 })`,
    });

    const summary = engine.runTests();

    expect(summary).not.toBeNull();
    expect(summary!.totalTests).toBe(1);
    expect(summary!.passedTests).toBe(1);
    expect(summary!.failedTests).toBe(0);
    expect(summary!.coveredLineNumbers).toContain(8);
  });

  // Test 3: coverage calculation updates after each test run
  it('coverage updates after test run', () => {
    const { engine, level } = createEngineWithService(0);

    engine.initialize(level);
    engine.start();

    // Before running tests, coverage is null
    expect(engine.coverage()).toBeNull();

    engine.submitAction({
      type: 'submit-test',
      testCode: `it('covers line 8', () => { const x = 8; })`,
    });

    engine.runTests();

    const coverage = engine.coverage();
    expect(coverage).not.toBeNull();
    expect(coverage!.totalLines).toBeGreaterThan(0);
    expect(coverage!.coveredLines).toBeGreaterThan(0);
    expect(coverage!.percentage).toBeGreaterThan(0);
  });

  // Test 4: coverage threshold met triggers engine completion with scoring
  it('meeting coverage threshold triggers engine completion', () => {
    const { engine, level } = createEngineWithService(0);

    engine.initialize(level);
    engine.start();

    // Level 1 threshold is 60% coverage. Line 8 is the only testable point.
    // A test covering line 8 gives 100% coverage.
    engine.submitAction({
      type: 'submit-test',
      testCode: `it('covers line 8', () => { const x = 8; })`,
    });

    engine.runTests();

    expect(engine.coverage()!.percentage).toBe(100);
    expect(engine.status()).toBe(MinigameStatus.Won);
    expect(engine.score()).toBeGreaterThan(0);
    expect(engine.testRunCount()).toBe(1);
  });

  // Test 5: exhausting test runs without meeting threshold triggers failure
  it('exhausting test runs without meeting threshold triggers failure', () => {
    const { engine, level } = createEngineWithService(0);

    engine.initialize(level);
    engine.start();

    // Submit empty tests (no coverage) 3 times
    engine.submitAction({
      type: 'submit-test',
      testCode: `it('empty test', () => { })`,
    });

    engine.runTests(); // Run 1: no coverage
    expect(engine.status()).toBe(MinigameStatus.Playing);

    engine.runTests(); // Run 2: no coverage
    expect(engine.status()).toBe(MinigameStatus.Playing);

    engine.runTests(); // Run 3: no coverage, out of runs -> Lost
    expect(engine.status()).toBe(MinigameStatus.Lost);
    expect(engine.testRunsRemaining()).toBe(0);
  });

  // Test 6: redundant tests penalized in quality score via test runner service
  it('redundant tests reduce quality score', () => {
    const { engine, service, level } = createEngineWithService(0);

    engine.initialize(level);
    engine.start();

    // Write two identical tests covering line 8 — second is redundant
    engine.submitAction({
      type: 'submit-test',
      testCode: `it('test A covers line 8', () => { const x = 8; }) it('test B covers line 8', () => { const x = 8; })`,
    });

    engine.runTests();

    // Verify via service that the second test is redundant
    const summary = engine.testRunSummary();
    expect(summary).not.toBeNull();
    expect(summary!.totalTests).toBe(2);
    expect(summary!.redundantTestCount).toBe(1); // Second test is redundant
  });

  // Test 7: engine.reset() resets test runner service state
  it('reset() clears engine and service state', () => {
    const { engine, service, level } = createEngineWithService(0);

    engine.initialize(level);
    engine.start();

    engine.submitAction({
      type: 'submit-test',
      testCode: `it('covers line 8', () => { const x = 8; })`,
    });
    engine.runTests();
    expect(engine.status()).toBe(MinigameStatus.Won);

    engine.reset();

    expect(engine.status()).toBe(MinigameStatus.Playing);
    expect(engine.coverage()).toBeNull();
    expect(engine.testRunSummary()).toBeNull();
    expect(engine.testRunCount()).toBe(0);
    expect(engine.testRunsRemaining()).toBe(3);
    expect(engine.score()).toBe(0);
  });
});
