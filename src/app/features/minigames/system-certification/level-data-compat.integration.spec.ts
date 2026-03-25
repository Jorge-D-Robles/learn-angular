// ---------------------------------------------------------------------------
// System Certification Level Data Compatibility Integration Tests
// ---------------------------------------------------------------------------
// Verifies that ALL 18 System Certification levels load into the engine via
// initialize() and produce valid signal values. Catches data authoring bugs
// that the unit-level data spec (system-certification.data.spec.ts) cannot:
// namely, that the engine correctly receives and exposes each level's data
// through its public signals.
//
// Distinct from testrunner-engine.integration.spec.ts which tests the
// engine pipeline in depth using only level 1 (sc-basic-01).
// ---------------------------------------------------------------------------

import { SystemCertificationEngine } from './system-certification.engine';
import { SYSTEM_CERTIFICATION_LEVELS } from '../../../data/levels/system-certification.data';
import { MinigameStatus, type MinigameLevel } from '../../../core/minigame/minigame.types';
import type { LevelDefinition } from '../../../core/levels/level.types';
import type { SystemCertificationLevelData } from './system-certification.types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Converts a LevelDefinition to a MinigameLevel by mapping `levelId` -> `id`
 * and dropping authoring-only fields (`title`, `order`, `parTime`).
 */
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

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('System Certification Level Data Compatibility', () => {
  // =========================================================================
  // Tests 1-5: All 18 levels — engine initialization and signal validation
  // =========================================================================

  describe.each(SYSTEM_CERTIFICATION_LEVELS)('level $levelId', (levelDef) => {
    let engine: SystemCertificationEngine;

    beforeEach(() => {
      engine = new SystemCertificationEngine();
      engine.initialize(toMinigameLevel(levelDef));
    });

    it('should load without errors', () => {
      expect(engine.status()).toBe(MinigameStatus.Loading);
      expect(engine.currentLevel()).toBe(levelDef.levelId);
    });

    it('should have non-empty sourceCode', () => {
      expect(engine.sourceCode()).not.toBeNull();
      expect(engine.sourceCode()!.lines.length).toBeGreaterThan(0);
    });

    it('should have coverageThreshold between 0 and 100', () => {
      expect(levelDef.data.threshold.minCoverage).toBeGreaterThanOrEqual(0);
      expect(levelDef.data.threshold.minCoverage).toBeLessThanOrEqual(100);
    });

    it('should have a positive timeLimit', () => {
      expect(levelDef.data.threshold.timeLimit).toBeGreaterThan(0);
    });

    it('should have non-empty availableTestUtilities', () => {
      expect(levelDef.data.availableTestUtilities.length).toBeGreaterThanOrEqual(1);
    });
  });

  // =========================================================================
  // Test 6: Level 1 basic configuration produces expected coverage results
  // when correct tests are written
  // =========================================================================

  it('level 1 produces expected coverage when correct test is written', () => {
    const engine = new SystemCertificationEngine();
    const level = toMinigameLevel(SYSTEM_CERTIFICATION_LEVELS[0]);

    engine.initialize(level);
    engine.start();

    // Level 1 (sc-basic-01) has 1 testable point: line 8
    // Write a test that references line 8
    engine.submitAction({
      type: 'submit-test',
      testCode: `it('should have title', () => { expect(component.title).toBe('Welcome to Nexus Station'); // covers line 8 })`,
    });

    const summary = engine.runTests();

    expect(summary).not.toBeNull();
    expect(summary!.totalTests).toBe(1);
    expect(summary!.passedTests).toBe(1);
    expect(summary!.coveredLineNumbers).toContain(8);

    // Coverage: 1/1 testable points = 100%, threshold is 60%
    const coverage = engine.coverage();
    expect(coverage).not.toBeNull();
    expect(coverage!.percentage).toBe(100);
    expect(engine.status()).toBe(MinigameStatus.Won);
  });

  // =========================================================================
  // Test 7: Engine reset and reload with a different level
  // =========================================================================

  it('can be reset and loaded with a different level from the pack', () => {
    const engine = new SystemCertificationEngine();

    // Initialize with level 1 (sc-basic-01)
    engine.initialize(toMinigameLevel(SYSTEM_CERTIFICATION_LEVELS[0]));
    engine.start();
    expect(engine.currentLevel()).toBe('sc-basic-01');

    // Re-initialize with level 7 (sc-intermediate-01, index 6)
    engine.initialize(toMinigameLevel(SYSTEM_CERTIFICATION_LEVELS[6]));
    expect(engine.status()).toBe(MinigameStatus.Loading);
    expect(engine.currentLevel()).toBe('sc-intermediate-01');
    expect(engine.sourceCode()).not.toBeNull();
    expect(engine.coverage()).toBeNull();
  });
});
