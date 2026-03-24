// ---------------------------------------------------------------------------
// Integration tests: DataRelayEngine + DataRelayTransformServiceImpl
// ---------------------------------------------------------------------------
// Exercises the coordinated lifecycle: engine constructor accepts service,
// initialize() loads streams and pipes, submitAction() delegates place-pipe
// to the service, runTransform() processes pipe chains and triggers
// completion/failure, and reset() clears all state.
//
// Uses REAL DataRelayTransformServiceImpl (not mocks) and REAL level data.
// ---------------------------------------------------------------------------

import { DataRelayEngine } from './data-relay.engine';
import { DataRelayTransformServiceImpl } from './data-relay-transform.service';
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

function createEngineWithService(levelIndex: number): {
  engine: DataRelayEngine;
  service: DataRelayTransformServiceImpl;
  level: MinigameLevel<DataRelayLevelData>;
} {
  const service = new DataRelayTransformServiceImpl();
  const engine = new DataRelayEngine(undefined, service);
  const level = toMinigameLevel(DATA_RELAY_LEVELS[levelIndex]);
  return { engine, service, level };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('DataRelayEngine + DataRelayTransformService integration', () => {
  // Test 1: engine.initialize() loads streams and available pipes into engine state
  it('initialize() loads streams and available pipes into engine state', () => {
    const { engine, level } = createEngineWithService(0); // level 1

    engine.initialize(level);

    expect(engine.streams()).toHaveLength(1);
    expect(engine.streams()[0].streamId).toBe('dr-b01-s1');
    expect(engine.availablePipes()).toHaveLength(1);
    expect(engine.availablePipes()[0].id).toBe('dr-b01-p1');
    expect(engine.status()).toBe(MinigameStatus.Loading);
    expect(engine.runCount()).toBe(0);
    expect(engine.transformResult()).toBeNull();
  });

  // Test 2: place-pipe action updates stream state and is valid
  it('place-pipe action updates stream state and is valid', () => {
    const { engine, level } = createEngineWithService(0);

    engine.initialize(level);
    engine.start();

    const result = engine.submitAction({
      type: 'place-pipe',
      streamId: 'dr-b01-s1',
      pipeDefinitionId: 'dr-b01-p1',
      pipeBlockId: 'block-1',
      position: 0,
    });

    expect(result).toEqual({ valid: true, scoreChange: 0, livesChange: 0 });
    expect(engine.streams()[0].placedPipes).toHaveLength(1);
    expect(engine.streams()[0].placedPipes[0].pipeType).toBe('uppercase');
  });

  // Test 3: runTransform() processes pipe chain through service and returns correct results
  it('runTransform() processes pipe chain through service and returns correct results', () => {
    const { engine, level } = createEngineWithService(0);

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
    expect(result!.streamResults[0].actualOutput).toBe('COMMANDER SHEPARD');
    expect(result!.streamResults[0].isCorrect).toBe(true);
    expect(result!.allCorrect).toBe(true);
    expect(result!.testResults).toHaveLength(2);
    expect(result!.testResults[0].actual).toBe('COMMANDER SHEPARD');
    expect(result!.testResults[1].actual).toBe('JANE DOE');
  });

  // Test 4: all correct outputs trigger engine completion with perfect score
  it('all correct outputs trigger engine completion with perfect score', () => {
    const { engine, level } = createEngineWithService(0);

    engine.initialize(level);
    engine.start();

    engine.submitAction({
      type: 'place-pipe',
      streamId: 'dr-b01-s1',
      pipeDefinitionId: 'dr-b01-p1',
      pipeBlockId: 'block-1',
      position: 0,
    });

    engine.runTransform();

    expect(engine.status()).toBe(MinigameStatus.Won);
    expect(engine.score()).toBe(1000);
    expect(engine.runCount()).toBe(1);
  });

  // Test 5: no pipes placed produces output mismatch, status stays Playing
  it('no pipes placed produces output mismatch, status stays Playing', () => {
    const { engine, level } = createEngineWithService(0);

    engine.initialize(level);
    engine.start();

    // Do NOT place any pipe — raw input passes through unchanged
    const result = engine.runTransform();

    expect(result).not.toBeNull();
    expect(result!.streamResults[0].isCorrect).toBe(false);
    expect(result!.streamResults[0].actualOutput).toBe('commander shepard');
    expect(result!.allCorrect).toBe(false);
    // failedTestCount is 2 (both test items fail), threshold is > 2 strict, so no loss
    expect(engine.status()).toBe(MinigameStatus.Playing);
  });

  // Test 6: engine.reset() clears transform service state and re-initializes
  it('reset() clears transform service state and re-initializes', () => {
    const { engine, level } = createEngineWithService(0);

    engine.initialize(level);
    engine.start();

    engine.submitAction({
      type: 'place-pipe',
      streamId: 'dr-b01-s1',
      pipeDefinitionId: 'dr-b01-p1',
      pipeBlockId: 'block-1',
      position: 0,
    });

    engine.runTransform();
    expect(engine.status()).toBe(MinigameStatus.Won);

    engine.reset();

    expect(engine.status()).toBe(MinigameStatus.Playing);
    expect(engine.score()).toBe(0);
    expect(engine.streams()[0].placedPipes).toHaveLength(0);
    expect(engine.runCount()).toBe(0);
    expect(engine.transformResult()).toBeNull();
  });

  // Test 7: second-attempt scoring after failed first runTransform
  it('second-attempt scoring: failed first run, place pipe, win on second run', () => {
    const { engine, level } = createEngineWithService(0);

    engine.initialize(level);
    engine.start();

    // First run with NO pipes placed — fails but does NOT trigger loss
    // (failedTestCount is 2, threshold is > 2 strict)
    engine.runTransform();
    expect(engine.status()).toBe(MinigameStatus.Playing);

    // Place the correct pipe
    engine.submitAction({
      type: 'place-pipe',
      streamId: 'dr-b01-s1',
      pipeDefinitionId: 'dr-b01-p1',
      pipeBlockId: 'block-1',
      position: 0,
    });

    // Second run — all correct
    engine.runTransform();

    expect(engine.status()).toBe(MinigameStatus.Won);
    expect(engine.score()).toBe(400); // runCount=2, multiplier=0.4, 1000 * 0.4 = 400
    expect(engine.runCount()).toBe(2);
  });
});
