// ---------------------------------------------------------------------------
// Integration test: WireProtocolValidationService + WireProtocolEngine
// coordinated lifecycle
// ---------------------------------------------------------------------------
// Verifies the coordinated lifecycle: loading port data, drawing wires with
// type validation, verifying all connections, and scoring.
// Uses real WireProtocolEngine and WireProtocolValidationService with level 1.
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
  return { engine, service, level };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('WireProtocolValidationService + Engine coordinated lifecycle', () => {
  // 1. engine.initialize() provides validation service with level port/wire data
  it('engine.initialize() provides validation service with level port/wire data', () => {
    const { engine, level } = createEngineWithService(0);

    engine.initialize(level);

    expect(engine.sourcePorts().length).toBe(3);
    expect(engine.targetPorts().length).toBe(3);
    expect(engine.verificationsRemaining()).toBe(3);
    expect(engine.wires().length).toBe(0);
    expect(engine.availableWireTypes()).toContain(WireType.interpolation);
  });

  // 2. drawing a wire with correct type returns positive validation
  it('drawing a wire with correct type updates engine state', () => {
    const { engine, level } = createEngineWithService(0);
    engine.initialize(level);
    engine.start();

    engine.submitAction({
      type: 'draw-wire',
      sourcePortId: 'wp-basic-01-s1',
      targetPortId: 'wp-basic-01-t1',
      wireType: WireType.interpolation,
    });

    expect(engine.wires().length).toBe(1);
    expect(engine.wires()[0].wireType).toBe(WireType.interpolation);
  });

  // 3. drawing a wire with wrong type is rejected by the validation service
  it('drawing a wire with wrong type is rejected by the validation service', () => {
    const { engine, service, level } = createEngineWithService(0);
    engine.initialize(level);
    engine.start();

    // Attempt to draw with wrong wire type (event instead of interpolation)
    // The engine delegates to isCorrectBindingType() which rejects it
    engine.submitAction({
      type: 'draw-wire',
      sourcePortId: 'wp-basic-01-s1',
      targetPortId: 'wp-basic-01-t1',
      wireType: WireType.event,
    });

    // Wire was NOT added because type check failed
    expect(engine.wires().length).toBe(0);

    // The validation service can also explain why via validateWire
    const sourceMap = new Map(engine.sourcePorts().map(p => [p.id, p]));
    const targetMap = new Map(engine.targetPorts().map(p => [p.id, p]));
    const fakeWire = {
      id: 'test',
      sourcePortId: 'wp-basic-01-s1',
      targetPortId: 'wp-basic-01-t1',
      wireType: WireType.event,
      isPreWired: false,
    };
    const result = service.validateWire(fakeWire, sourceMap, targetMap);

    expect(result.valid).toBe(false);
    expect(result.commonMistakeHint).not.toBeNull();
  });

  // 4. verify action validates all wires against solution via service
  it('verify action validates all wires against solution via service', () => {
    const { engine, level } = createEngineWithService(0);
    engine.initialize(level);
    engine.start();

    // Draw only 1 of 3 correct wires
    engine.submitAction({
      type: 'draw-wire',
      sourcePortId: 'wp-basic-01-s1',
      targetPortId: 'wp-basic-01-t1',
      wireType: WireType.interpolation,
    });

    const result = engine.verify();

    expect(result).not.toBeNull();
    expect(result!.missingWires.length).toBe(2);
    expect(engine.verificationsRemaining()).toBe(2);
    expect(engine.status()).toBe(MinigameStatus.Playing);
  });

  // 5. all wires correct on first verify triggers engine completion with perfect score
  it('all wires correct on first verify triggers engine completion with perfect score', () => {
    const { engine, level } = createEngineWithService(0);
    engine.initialize(level);
    engine.start();

    engine.submitAction({ type: 'draw-wire', sourcePortId: 'wp-basic-01-s1', targetPortId: 'wp-basic-01-t1', wireType: WireType.interpolation });
    engine.submitAction({ type: 'draw-wire', sourcePortId: 'wp-basic-01-s2', targetPortId: 'wp-basic-01-t2', wireType: WireType.interpolation });
    engine.submitAction({ type: 'draw-wire', sourcePortId: 'wp-basic-01-s3', targetPortId: 'wp-basic-01-t3', wireType: WireType.interpolation });

    engine.verify();

    expect(engine.status()).toBe(MinigameStatus.Won);
    expect(engine.score()).toBe(1000);
  });

  // 6. 3 failed verifications triggers engine failure
  it('3 failed verifications triggers engine failure', () => {
    const { engine, level } = createEngineWithService(0);
    engine.initialize(level);
    engine.start();

    engine.verify(); // fail 1
    engine.verify(); // fail 2
    engine.verify(); // fail 3

    expect(engine.status()).toBe(MinigameStatus.Lost);
    expect(engine.verificationsRemaining()).toBe(0);
  });

  // 7. engine.reset() clears validation state
  it('engine.reset() clears validation state', () => {
    const { engine, level } = createEngineWithService(0);
    engine.initialize(level);
    engine.start();

    // Draw wires and verify
    engine.submitAction({ type: 'draw-wire', sourcePortId: 'wp-basic-01-s1', targetPortId: 'wp-basic-01-t1', wireType: WireType.interpolation });
    engine.verify();
    expect(engine.verificationsRemaining()).toBe(2);

    engine.reset();

    expect(engine.status()).toBe(MinigameStatus.Playing);
    expect(engine.score()).toBe(0);
    expect(engine.wires().length).toBe(0);
    expect(engine.verificationsRemaining()).toBe(3);
  });
});
