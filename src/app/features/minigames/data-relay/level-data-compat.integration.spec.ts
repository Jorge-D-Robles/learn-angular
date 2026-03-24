// ---------------------------------------------------------------------------
// Data Relay Level Data Compatibility Integration Tests
// ---------------------------------------------------------------------------
// Verifies that ALL 18 Data Relay levels load into the engine via
// initialize() and produce valid signal values. Catches data authoring bugs
// that the unit-level data spec (data-relay.data.spec.ts) cannot: namely,
// that the engine correctly receives and exposes each level's data through
// its public signals.
//
// Distinct from transform-chain.integration.spec.ts which tests
// the engine pipeline in depth using only level 1 (dr-basic-01).
// ---------------------------------------------------------------------------

import { DataRelayEngine } from './data-relay.engine';
import { DATA_RELAY_LEVELS } from '../../../data/levels/data-relay.data';
import { MinigameStatus, type MinigameLevel } from '../../../core/minigame/minigame.types';
import type { LevelDefinition } from '../../../core/levels/level.types';
import type { DataRelayLevelData } from './data-relay.types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Converts a LevelDefinition to a MinigameLevel by mapping `levelId` -> `id`
 * and dropping authoring-only fields (`title`, `order`, `parTime`).
 * Mirrors the private `toMinigameLevel()` in minigame-play.ts.
 */
function toMinigameLevel(
  def: LevelDefinition<DataRelayLevelData>,
): MinigameLevel<DataRelayLevelData> {
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

describe('Data Relay Level Data Compatibility', () => {
  // =========================================================================
  // Tests 1-5: All 18 levels — engine initialization and signal validation
  // =========================================================================

  describe.each(DATA_RELAY_LEVELS)('level $levelId', (levelDef) => {
    let engine: DataRelayEngine;

    beforeEach(() => {
      engine = new DataRelayEngine();
      engine.initialize(toMinigameLevel(levelDef));
    });

    it('should load without errors', () => {
      expect(engine.status()).toBe(MinigameStatus.Loading);
      expect(engine.currentLevel()).toBe(levelDef.levelId);
    });

    it('should have at least 1 data stream in engine signals', () => {
      expect(engine.streams().length).toBeGreaterThanOrEqual(1);
    });

    it('should have non-empty availablePipes in engine signals', () => {
      expect(engine.availablePipes().length).toBeGreaterThanOrEqual(1);
    });

    it('should have targetOutputs matching stream count', () => {
      // targetOutputs is not exposed as a public engine signal, so we
      // validate via levelDef.data directly. This is legitimate since the
      // engine received this same data in onLevelLoad().
      expect(levelDef.data.targetOutputs.length).toBe(levelDef.data.streams.length);
    });

    it('should have at least 1 test data pair per stream', () => {
      const coveredStreamIds = new Set(levelDef.data.testData.map(td => td.streamId));
      for (const s of levelDef.data.streams) {
        expect(coveredStreamIds.has(s.id)).toBe(true);
      }
    });
  });

  // =========================================================================
  // Test 6: Level 1 functional test with correct pipe placement
  // =========================================================================

  it('level 1 produces expected transform results when correct pipes are placed', () => {
    const engine = new DataRelayEngine();
    const level = toMinigameLevel(DATA_RELAY_LEVELS[0]);

    engine.initialize(level);
    engine.start();

    engine.submitAction({
      type: 'place-pipe',
      streamId: 'dr-b01-s1',
      pipeDefinitionId: 'dr-b01-p1',
      pipeBlockId: 'block-1',
      position: 0,
    });

    const result = engine.runTransform();

    expect(result).not.toBeNull();
    expect(result!.allCorrect).toBe(true);
    expect(result!.streamResults[0].actualOutput).toBe('COMMANDER SHEPARD');
    expect(result!.failedTestCount).toBe(0);
    expect(engine.status()).toBe(MinigameStatus.Won);
  });

  // =========================================================================
  // Test 7: Engine reset and reload with a different level
  // =========================================================================

  it('can be reset and loaded with a different level from the pack', () => {
    const engine = new DataRelayEngine();

    // Initialize with level 1 (dr-basic-01)
    engine.initialize(toMinigameLevel(DATA_RELAY_LEVELS[0]));
    engine.start();
    expect(engine.currentLevel()).toBe('dr-basic-01');

    // Re-initialize with level 7 (dr-intermediate-01, index 6)
    engine.initialize(toMinigameLevel(DATA_RELAY_LEVELS[6]));
    expect(engine.status()).toBe(MinigameStatus.Loading);
    expect(engine.currentLevel()).toBe('dr-intermediate-01');
    expect(engine.streams().length).toBeGreaterThanOrEqual(1);
    expect(engine.availablePipes().length).toBeGreaterThanOrEqual(1);
  });
});
