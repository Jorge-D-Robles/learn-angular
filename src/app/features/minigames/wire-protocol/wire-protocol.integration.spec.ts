// ---------------------------------------------------------------------------
// Wire Protocol Integration Tests
// ---------------------------------------------------------------------------
// Exercises the engine-shell-level-data pipeline using REAL level data
// (WIRE_PROTOCOL_LEVELS[0] = wp-basic-01) and the REAL
// WireProtocolValidationService. Catches data authoring bugs that unit
// tests with synthetic data would miss.
// ---------------------------------------------------------------------------

import { WireProtocolEngine } from './wire-protocol.engine';
import { WireProtocolValidationService } from './wire-protocol-validation.service';
import { WIRE_PROTOCOL_LEVELS } from '../../../data/levels/wire-protocol.data';
import { MinigameStatus, type MinigameLevel } from '../../../core/minigame/minigame.types';
import type { LevelDefinition } from '../../../core/levels/level.types';
import type { WireProtocolLevelData } from '../../../data/levels/wire-protocol.data';
import { WireType } from './wire-protocol.types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toMinigameLevel(
  def: LevelDefinition<WireProtocolLevelData>,
): MinigameLevel<WireProtocolLevelData> {
  return {
    id: def.levelId,
    gameId: def.gameId,
    tier: def.tier,
    conceptIntroduced: def.conceptIntroduced,
    description: def.description,
    data: def.data,
  };
}

function createEngineWithService(levelIndex = 0) {
  const service = new WireProtocolValidationService();
  const engine = new WireProtocolEngine(undefined, service);
  const level = toMinigameLevel(WIRE_PROTOCOL_LEVELS[levelIndex]);
  return { engine, level };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Wire Protocol Integration (real level data)', () => {
  // 1. initialize() loads ports and wire types from real level data
  it('initialize() loads ports and wire types from real level data', () => {
    const { engine, level } = createEngineWithService();
    engine.initialize(level);

    expect(engine.sourcePorts().length).toBe(3);
    expect(engine.targetPorts().length).toBe(3);
    expect(engine.verificationsRemaining()).toBe(3);
    expect(engine.wires().length).toBe(0);
    expect(engine.availableWireTypes()).toContain(WireType.interpolation);
  });

  // 2. draw all 3 correct wires and verify completes with perfect score
  it('draw all 3 correct wires and verify completes with perfect score', () => {
    const { engine, level } = createEngineWithService();
    engine.initialize(level);
    engine.start();

    engine.submitAction({ type: 'draw-wire', sourcePortId: 'wp-basic-01-s1', targetPortId: 'wp-basic-01-t1', wireType: WireType.interpolation });
    engine.submitAction({ type: 'draw-wire', sourcePortId: 'wp-basic-01-s2', targetPortId: 'wp-basic-01-t2', wireType: WireType.interpolation });
    engine.submitAction({ type: 'draw-wire', sourcePortId: 'wp-basic-01-s3', targetPortId: 'wp-basic-01-t3', wireType: WireType.interpolation });

    engine.verify();

    expect(engine.status()).toBe(MinigameStatus.Won);
    expect(engine.score()).toBe(1000);
  });

  // 3. state transitions: Loading -> Playing -> Won
  it('transitions Loading -> Playing -> Won on correct completion', () => {
    const { engine, level } = createEngineWithService();

    engine.initialize(level);
    expect(engine.status()).toBe(MinigameStatus.Loading);

    engine.start();
    expect(engine.status()).toBe(MinigameStatus.Playing);

    engine.submitAction({ type: 'draw-wire', sourcePortId: 'wp-basic-01-s1', targetPortId: 'wp-basic-01-t1', wireType: WireType.interpolation });
    engine.submitAction({ type: 'draw-wire', sourcePortId: 'wp-basic-01-s2', targetPortId: 'wp-basic-01-t2', wireType: WireType.interpolation });
    engine.submitAction({ type: 'draw-wire', sourcePortId: 'wp-basic-01-s3', targetPortId: 'wp-basic-01-t3', wireType: WireType.interpolation });
    engine.verify();

    expect(engine.status()).toBe(MinigameStatus.Won);
  });

  // 4. produces data shape for LevelCompletionService
  it('produces the data shape needed by LevelCompletionService after winning', () => {
    const { engine, level } = createEngineWithService();
    engine.initialize(level);
    engine.start();

    engine.submitAction({ type: 'draw-wire', sourcePortId: 'wp-basic-01-s1', targetPortId: 'wp-basic-01-t1', wireType: WireType.interpolation });
    engine.submitAction({ type: 'draw-wire', sourcePortId: 'wp-basic-01-s2', targetPortId: 'wp-basic-01-t2', wireType: WireType.interpolation });
    engine.submitAction({ type: 'draw-wire', sourcePortId: 'wp-basic-01-s3', targetPortId: 'wp-basic-01-t3', wireType: WireType.interpolation });
    engine.verify();

    expect(engine.currentLevel()).toBe('wp-basic-01');
    expect(engine.status()).toBe(MinigameStatus.Won);
    expect(engine.score()).toBe(1000);
  });

  // 5. verification with missing wires does not complete
  it('verification with missing wires does not complete, decrements verificationsRemaining', () => {
    const { engine, level } = createEngineWithService();
    engine.initialize(level);
    engine.start();

    const result = engine.verify();

    expect(result).not.toBeNull();
    expect(result!.missingWires.length).toBe(3);
    expect(engine.verificationsRemaining()).toBe(2);
    expect(engine.status()).toBe(MinigameStatus.Playing);
  });

  // 6. 3 failed verifications cause loss
  it('3 failed verifications cause loss', () => {
    const { engine, level } = createEngineWithService();
    engine.initialize(level);
    engine.start();

    engine.verify(); // fail 1
    engine.verify(); // fail 2
    engine.verify(); // fail 3

    expect(engine.status()).toBe(MinigameStatus.Lost);
    expect(engine.verificationsRemaining()).toBe(0);
  });

  // 7. second-verification scoring: first verify with ZERO wires, then draw correct, verify again
  it('second-verification scoring with first verify having zero wires', () => {
    const { engine, level } = createEngineWithService();
    engine.initialize(level);
    engine.start();

    // First verify with ZERO wires drawn (missing only, _hadIncorrectWire stays false)
    engine.verify();
    expect(engine.verificationsRemaining()).toBe(2);
    expect(engine.status()).toBe(MinigameStatus.Playing);

    // Now draw all 3 correct wires
    engine.submitAction({ type: 'draw-wire', sourcePortId: 'wp-basic-01-s1', targetPortId: 'wp-basic-01-t1', wireType: WireType.interpolation });
    engine.submitAction({ type: 'draw-wire', sourcePortId: 'wp-basic-01-s2', targetPortId: 'wp-basic-01-t2', wireType: WireType.interpolation });
    engine.submitAction({ type: 'draw-wire', sourcePortId: 'wp-basic-01-s3', targetPortId: 'wp-basic-01-t3', wireType: WireType.interpolation });

    // Second verify (_verificationCount becomes 2) -> SECOND_ATTEMPT_MULTIPLIER = 0.4
    engine.verify();

    expect(engine.status()).toBe(MinigameStatus.Won);
    // Score: 1000 * 0.4 = 400
    expect(engine.score()).toBe(400);
  });
});
