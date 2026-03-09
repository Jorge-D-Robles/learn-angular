import {
  WireProtocolEngine,
  PERFECT_SCORE_MULTIPLIER,
  FIRST_ATTEMPT_MULTIPLIER,
  SECOND_ATTEMPT_MULTIPLIER,
  THIRD_ATTEMPT_MULTIPLIER,
  type DrawWireAction,
  type RemoveWireAction,
} from './wire-protocol.engine';
import type {
  SourcePort,
  TargetPort,
  WireConnection,
} from './wire-protocol.types';
import { WireType } from './wire-protocol.types';
import { WireProtocolValidationService } from './wire-protocol-validation.service';
import type { WireProtocolLevelData } from '../../../data/levels/wire-protocol.data';
import {
  MinigameStatus,
  DifficultyTier,
  type MinigameLevel,
} from '../../../core/minigame/minigame.types';
import type { MinigameEngineConfig } from '../../../core/minigame/minigame-engine';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function createSourcePort(
  portType: 'property' | 'method',
  overrides?: Partial<SourcePort>,
): SourcePort {
  return {
    id: 'src-1',
    name: 'testProp',
    portType,
    dataType: 'string',
    position: { x: 0, y: 50 },
    ...overrides,
  };
}

function createTargetPort(
  bindingSlot: 'interpolation' | 'property' | 'event' | 'twoWay',
  overrides?: Partial<TargetPort>,
): TargetPort {
  return {
    id: 'tgt-1',
    name: '{{ testProp }}',
    bindingSlot,
    position: { x: 100, y: 50 },
    ...overrides,
  };
}

function createTestLevelData(
  overrides?: Partial<WireProtocolLevelData>,
): WireProtocolLevelData {
  const sourcePorts = [
    createSourcePort('property', { id: 'src-1', name: 'propA' }),
    createSourcePort('property', { id: 'src-2', name: 'propB' }),
    createSourcePort('method', { id: 'src-3', name: 'handler()' }),
  ];
  const targetPorts = [
    createTargetPort('interpolation', { id: 'tgt-1', name: '{{ propA }}' }),
    createTargetPort('property', { id: 'tgt-2', name: '[value]="propB"' }),
    createTargetPort('event', { id: 'tgt-3', name: '(click)="handler()"' }),
  ];
  const correctWires: WireConnection[] = [
    { id: 'cw-1', sourcePortId: 'src-1', targetPortId: 'tgt-1', wireType: WireType.interpolation, isPreWired: false },
    { id: 'cw-2', sourcePortId: 'src-2', targetPortId: 'tgt-2', wireType: WireType.property, isPreWired: false },
    { id: 'cw-3', sourcePortId: 'src-3', targetPortId: 'tgt-3', wireType: WireType.event, isPreWired: false },
  ];

  return {
    components: [{ componentName: 'TestComponent', description: 'Test component' }],
    sourcePorts,
    targetPorts,
    correctWires,
    preWiredConnections: [],
    maxVerifications: 3,
    ...overrides,
  };
}

function createLevel(
  data: WireProtocolLevelData,
): MinigameLevel<WireProtocolLevelData> {
  return {
    id: 'wp-test-01',
    gameId: 'wire-protocol',
    tier: DifficultyTier.Basic,
    conceptIntroduced: 'Binding types',
    description: 'Test level',
    data,
  };
}

function createEngine(
  config?: Partial<MinigameEngineConfig>,
): WireProtocolEngine {
  return new WireProtocolEngine(config);
}

function initAndStart(
  engine: WireProtocolEngine,
  data?: WireProtocolLevelData,
): void {
  engine.initialize(createLevel(data ?? createTestLevelData()));
  engine.start();
}

/** Draw all 3 correct wires for the default test level data. */
function drawAllCorrectWires(engine: WireProtocolEngine): void {
  engine.submitAction({ type: 'draw-wire', sourcePortId: 'src-1', targetPortId: 'tgt-1', wireType: WireType.interpolation } as DrawWireAction);
  engine.submitAction({ type: 'draw-wire', sourcePortId: 'src-2', targetPortId: 'tgt-2', wireType: WireType.property } as DrawWireAction);
  engine.submitAction({ type: 'draw-wire', sourcePortId: 'src-3', targetPortId: 'tgt-3', wireType: WireType.event } as DrawWireAction);
}

function createEngineWithService(
  config?: Partial<MinigameEngineConfig>,
): { engine: WireProtocolEngine; service: WireProtocolValidationService } {
  const service = new WireProtocolValidationService();
  const engine = new WireProtocolEngine(config, service);
  return { engine, service };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('WireProtocolEngine', () => {
  // --- 1. Initialization ---

  describe('Initialization', () => {
    it('should initialize with Loading status', () => {
      const engine = createEngine();
      engine.initialize(createLevel(createTestLevelData()));

      expect(engine.status()).toBe(MinigameStatus.Loading);
    });

    it('should populate wires from pre-wired connections on onLevelLoad', () => {
      const engine = createEngine();
      const preWired: WireConnection[] = [
        { id: 'pw-1', sourcePortId: 'src-1', targetPortId: 'tgt-1', wireType: WireType.interpolation, isPreWired: true, isCorrect: true },
      ];
      const data = createTestLevelData({ preWiredConnections: preWired });
      engine.initialize(createLevel(data));

      expect(engine.wires()).toHaveLength(1);
      expect(engine.wires()[0].isPreWired).toBe(true);
    });

    it('should set verificationsRemaining from levelData.maxVerifications', () => {
      const engine = createEngine();
      const data = createTestLevelData({ maxVerifications: 3 });
      engine.initialize(createLevel(data));

      expect(engine.verificationsRemaining()).toBe(3);
    });

    it('should expose source ports and target ports as read-only signals', () => {
      const engine = createEngine();
      const data = createTestLevelData();
      engine.initialize(createLevel(data));

      expect(engine.sourcePorts()).toHaveLength(3);
      expect(engine.targetPorts()).toHaveLength(3);
    });

    it('should start with verificationCount at 0', () => {
      const engine = createEngine();
      engine.initialize(createLevel(createTestLevelData()));

      expect(engine.verificationCount()).toBe(0);
    });
  });

  // --- 2. Draw Wire -- valid action ---

  describe('Draw Wire - valid action', () => {
    it('should add wire to wires signal when source-target-wireType is compatible', () => {
      const engine = createEngine();
      initAndStart(engine);

      engine.submitAction({
        type: 'draw-wire',
        sourcePortId: 'src-1',
        targetPortId: 'tgt-1',
        wireType: WireType.interpolation,
      } as DrawWireAction);

      expect(engine.wires()).toHaveLength(1);
      expect(engine.wires()[0].sourcePortId).toBe('src-1');
      expect(engine.wires()[0].targetPortId).toBe('tgt-1');
    });

    it('should return valid: true, scoreChange: 0, livesChange: 0', () => {
      const engine = createEngine();
      initAndStart(engine);

      const result = engine.submitAction({
        type: 'draw-wire',
        sourcePortId: 'src-1',
        targetPortId: 'tgt-1',
        wireType: WireType.interpolation,
      } as DrawWireAction);

      expect(result.valid).toBe(true);
      expect(result.scoreChange).toBe(0);
      expect(result.livesChange).toBe(0);
    });

    it('should generate a unique wire ID for the new connection', () => {
      const engine = createEngine();
      initAndStart(engine);

      engine.submitAction({
        type: 'draw-wire',
        sourcePortId: 'src-1',
        targetPortId: 'tgt-1',
        wireType: WireType.interpolation,
      } as DrawWireAction);
      engine.submitAction({
        type: 'draw-wire',
        sourcePortId: 'src-2',
        targetPortId: 'tgt-2',
        wireType: WireType.property,
      } as DrawWireAction);

      const ids = engine.wires().map(w => w.id);
      expect(ids[0]).not.toBe(ids[1]);
    });

    it('should set isPreWired: false on player-drawn wires', () => {
      const engine = createEngine();
      initAndStart(engine);

      engine.submitAction({
        type: 'draw-wire',
        sourcePortId: 'src-1',
        targetPortId: 'tgt-1',
        wireType: WireType.interpolation,
      } as DrawWireAction);

      expect(engine.wires()[0].isPreWired).toBe(false);
    });
  });

  // --- 3. Draw Wire -- invalid action ---

  describe('Draw Wire - invalid action', () => {
    it('should return invalid when source-target is incompatible', () => {
      const engine = createEngine();
      initAndStart(engine);

      // property source (src-1) + event target (tgt-3) + WireType.event => incompatible
      const result = engine.submitAction({
        type: 'draw-wire',
        sourcePortId: 'src-1',
        targetPortId: 'tgt-3',
        wireType: WireType.event,
      } as DrawWireAction);

      expect(result.valid).toBe(false);
      expect(result.scoreChange).toBe(0);
      expect(result.livesChange).toBe(0);
    });

    it('should return invalid when sourcePortId does not exist', () => {
      const engine = createEngine();
      initAndStart(engine);

      const result = engine.submitAction({
        type: 'draw-wire',
        sourcePortId: 'non-existent',
        targetPortId: 'tgt-1',
        wireType: WireType.interpolation,
      } as DrawWireAction);

      expect(result.valid).toBe(false);
    });

    it('should return invalid when targetPortId does not exist', () => {
      const engine = createEngine();
      initAndStart(engine);

      const result = engine.submitAction({
        type: 'draw-wire',
        sourcePortId: 'src-1',
        targetPortId: 'non-existent',
        wireType: WireType.interpolation,
      } as DrawWireAction);

      expect(result.valid).toBe(false);
    });

    it('should return invalid when a wire already exists between the same (sourcePortId, targetPortId) pair', () => {
      const engine = createEngine();
      initAndStart(engine);

      engine.submitAction({
        type: 'draw-wire',
        sourcePortId: 'src-1',
        targetPortId: 'tgt-1',
        wireType: WireType.interpolation,
      } as DrawWireAction);

      const result = engine.submitAction({
        type: 'draw-wire',
        sourcePortId: 'src-1',
        targetPortId: 'tgt-1',
        wireType: WireType.interpolation,
      } as DrawWireAction);

      expect(result.valid).toBe(false);
    });

    it('should NOT add wire to state on invalid draw', () => {
      const engine = createEngine();
      initAndStart(engine);

      engine.submitAction({
        type: 'draw-wire',
        sourcePortId: 'non-existent',
        targetPortId: 'tgt-1',
        wireType: WireType.interpolation,
      } as DrawWireAction);

      expect(engine.wires()).toHaveLength(0);
    });
  });

  // --- 4. Remove Wire ---

  describe('Remove Wire', () => {
    it('should remove wire from wires signal by wireId', () => {
      const engine = createEngine();
      initAndStart(engine);

      engine.submitAction({
        type: 'draw-wire',
        sourcePortId: 'src-1',
        targetPortId: 'tgt-1',
        wireType: WireType.interpolation,
      } as DrawWireAction);

      const wireId = engine.wires()[0].id;
      engine.submitAction({ type: 'remove-wire', wireId } as RemoveWireAction);

      expect(engine.wires()).toHaveLength(0);
    });

    it('should return valid: true, scoreChange: 0, livesChange: 0 on successful removal', () => {
      const engine = createEngine();
      initAndStart(engine);

      engine.submitAction({
        type: 'draw-wire',
        sourcePortId: 'src-1',
        targetPortId: 'tgt-1',
        wireType: WireType.interpolation,
      } as DrawWireAction);

      const wireId = engine.wires()[0].id;
      const result = engine.submitAction({ type: 'remove-wire', wireId } as RemoveWireAction);

      expect(result.valid).toBe(true);
      expect(result.scoreChange).toBe(0);
      expect(result.livesChange).toBe(0);
    });

    it('should return invalid when wireId does not exist', () => {
      const engine = createEngine();
      initAndStart(engine);

      const result = engine.submitAction({
        type: 'remove-wire',
        wireId: 'non-existent',
      } as RemoveWireAction);

      expect(result.valid).toBe(false);
      expect(result.scoreChange).toBe(0);
      expect(result.livesChange).toBe(0);
    });

    it('should allow removing pre-wired connections', () => {
      const engine = createEngine();
      const preWired: WireConnection[] = [
        { id: 'pw-1', sourcePortId: 'src-1', targetPortId: 'tgt-1', wireType: WireType.interpolation, isPreWired: true, isCorrect: true },
      ];
      const data = createTestLevelData({ preWiredConnections: preWired });
      initAndStart(engine, data);

      const result = engine.submitAction({ type: 'remove-wire', wireId: 'pw-1' } as RemoveWireAction);

      expect(result.valid).toBe(true);
      expect(engine.wires()).toHaveLength(0);
    });
  });

  // --- 5. Pre-wired connections ---

  describe('Pre-wired connections', () => {
    it('should load all pre-wired connections from level data on initialize', () => {
      const engine = createEngine();
      const preWired: WireConnection[] = [
        { id: 'pw-1', sourcePortId: 'src-1', targetPortId: 'tgt-1', wireType: WireType.interpolation, isPreWired: true, isCorrect: true },
        { id: 'pw-2', sourcePortId: 'src-2', targetPortId: 'tgt-2', wireType: WireType.property, isPreWired: true, isCorrect: false },
      ];
      const data = createTestLevelData({ preWiredConnections: preWired });
      engine.initialize(createLevel(data));

      expect(engine.wires()).toHaveLength(2);
    });

    it('should include both correct and incorrect pre-wired connections in initial wire state', () => {
      const engine = createEngine();
      const preWired: WireConnection[] = [
        { id: 'pw-1', sourcePortId: 'src-1', targetPortId: 'tgt-1', wireType: WireType.interpolation, isPreWired: true, isCorrect: true },
        { id: 'pw-2', sourcePortId: 'src-2', targetPortId: 'tgt-2', wireType: WireType.property, isPreWired: true, isCorrect: false },
      ];
      const data = createTestLevelData({ preWiredConnections: preWired });
      engine.initialize(createLevel(data));

      const correct = engine.wires().find(w => w.id === 'pw-1');
      const incorrect = engine.wires().find(w => w.id === 'pw-2');
      expect(correct).toBeDefined();
      expect(incorrect).toBeDefined();
    });

    it('should have isPreWired: true on loaded pre-wired wires', () => {
      const engine = createEngine();
      const preWired: WireConnection[] = [
        { id: 'pw-1', sourcePortId: 'src-1', targetPortId: 'tgt-1', wireType: WireType.interpolation, isPreWired: true, isCorrect: true },
      ];
      const data = createTestLevelData({ preWiredConnections: preWired });
      engine.initialize(createLevel(data));

      expect(engine.wires()[0].isPreWired).toBe(true);
    });

    it('should have isPreWired: false after removing and re-drawing a pre-wired wire', () => {
      const engine = createEngine();
      const preWired: WireConnection[] = [
        { id: 'pw-1', sourcePortId: 'src-1', targetPortId: 'tgt-1', wireType: WireType.interpolation, isPreWired: true, isCorrect: true },
      ];
      const data = createTestLevelData({ preWiredConnections: preWired });
      initAndStart(engine, data);

      engine.submitAction({ type: 'remove-wire', wireId: 'pw-1' } as RemoveWireAction);
      expect(engine.wires()).toHaveLength(0);

      engine.submitAction({
        type: 'draw-wire',
        sourcePortId: 'src-1',
        targetPortId: 'tgt-1',
        wireType: WireType.interpolation,
      } as DrawWireAction);

      expect(engine.wires()[0].isPreWired).toBe(false);
    });
  });

  // --- 6. Verification -- all correct ---

  describe('Verification - all correct', () => {
    it('should call complete() when all wires match expected connections on verify()', () => {
      const engine = createEngine();
      initAndStart(engine);
      drawAllCorrectWires(engine);

      engine.verify();

      expect(engine.status()).toBe(MinigameStatus.Won);
    });

    it('should decrement verificationsRemaining by 1', () => {
      const engine = createEngine();
      initAndStart(engine);
      drawAllCorrectWires(engine);

      engine.verify();

      expect(engine.verificationsRemaining()).toBe(2);
    });

    it('should set score to maxScore on first-attempt perfect verification', () => {
      const engine = createEngine({ maxScore: 1000 });
      initAndStart(engine);
      drawAllCorrectWires(engine);

      engine.verify();

      expect(engine.score()).toBe(1000 * PERFECT_SCORE_MULTIPLIER);
    });

    it('should set score to maxScore * 0.7 on first-attempt non-perfect verification', () => {
      // Add a 4th target port so we can draw an extra incorrect wire
      const sourcePorts = [
        createSourcePort('property', { id: 'src-1', name: 'propA' }),
        createSourcePort('property', { id: 'src-2', name: 'propB' }),
        createSourcePort('method', { id: 'src-3', name: 'handler()' }),
        createSourcePort('property', { id: 'src-4', name: 'propD' }),
      ];
      const targetPorts = [
        createTargetPort('interpolation', { id: 'tgt-1', name: '{{ propA }}' }),
        createTargetPort('property', { id: 'tgt-2', name: '[value]="propB"' }),
        createTargetPort('event', { id: 'tgt-3', name: '(click)="handler()"' }),
        createTargetPort('property', { id: 'tgt-4', name: '[value]="propD"' }),
      ];
      // Only 3 correct wires -- src-4 -> tgt-4 is NOT expected
      const correctWires: WireConnection[] = [
        { id: 'cw-1', sourcePortId: 'src-1', targetPortId: 'tgt-1', wireType: WireType.interpolation, isPreWired: false },
        { id: 'cw-2', sourcePortId: 'src-2', targetPortId: 'tgt-2', wireType: WireType.property, isPreWired: false },
        { id: 'cw-3', sourcePortId: 'src-3', targetPortId: 'tgt-3', wireType: WireType.event, isPreWired: false },
      ];
      const data: WireProtocolLevelData = {
        components: [{ componentName: 'Test', description: 'Test' }],
        sourcePorts,
        targetPorts,
        correctWires,
        preWiredConnections: [],
        maxVerifications: 3,
      };

      const engine = createEngine({ maxScore: 1000 });
      initAndStart(engine, data);

      // Draw all 3 correct + 1 extra incorrect wire
      engine.submitAction({ type: 'draw-wire', sourcePortId: 'src-1', targetPortId: 'tgt-1', wireType: WireType.interpolation } as DrawWireAction);
      engine.submitAction({ type: 'draw-wire', sourcePortId: 'src-2', targetPortId: 'tgt-2', wireType: WireType.property } as DrawWireAction);
      engine.submitAction({ type: 'draw-wire', sourcePortId: 'src-3', targetPortId: 'tgt-3', wireType: WireType.event } as DrawWireAction);
      engine.submitAction({ type: 'draw-wire', sourcePortId: 'src-4', targetPortId: 'tgt-4', wireType: WireType.property } as DrawWireAction);

      // First verify: missingWires=0, incorrectWires=1 -> sets _hadIncorrectWire, NOT complete
      const result1 = engine.verify();
      expect(result1).not.toBeNull();
      expect(result1!.incorrectWires).toHaveLength(1);
      expect(engine.status()).toBe(MinigameStatus.Playing);

      // Remove the extra wire and verify again
      const extraWire = engine.wires().find(w => w.sourcePortId === 'src-4');
      engine.submitAction({ type: 'remove-wire', wireId: extraWire!.id } as RemoveWireAction);

      engine.verify();

      // Second attempt, _hadIncorrectWire was set -> uses SECOND_ATTEMPT_MULTIPLIER
      // But the plan says first-attempt non-perfect gets 0.7.
      // Since _hadIncorrectWire was set in the first (failed) verify,
      // and second verify succeeds at count=2, we get SECOND_ATTEMPT_MULTIPLIER.
      expect(engine.score()).toBe(Math.round(1000 * SECOND_ATTEMPT_MULTIPLIER));
      expect(engine.status()).toBe(MinigameStatus.Won);
    });
  });

  // --- 7. Verification -- partial correct ---

  describe('Verification - partial correct', () => {
    it('should NOT call complete() when some wires are incorrect', () => {
      const engine = createEngine();
      initAndStart(engine);

      // Draw only 1 of 3 correct wires + leave 2 missing
      engine.submitAction({ type: 'draw-wire', sourcePortId: 'src-1', targetPortId: 'tgt-1', wireType: WireType.interpolation } as DrawWireAction);

      engine.verify();

      expect(engine.status()).toBe(MinigameStatus.Playing);
    });

    it('should decrement verificationsRemaining by 1', () => {
      const engine = createEngine();
      initAndStart(engine);

      engine.submitAction({ type: 'draw-wire', sourcePortId: 'src-1', targetPortId: 'tgt-1', wireType: WireType.interpolation } as DrawWireAction);

      engine.verify();

      expect(engine.verificationsRemaining()).toBe(2);
    });

    it('should return VerificationResult with correctWires, incorrectWires, and missingWires arrays', () => {
      const engine = createEngine();
      initAndStart(engine);

      // Draw 1 correct wire, leaving 2 missing
      engine.submitAction({ type: 'draw-wire', sourcePortId: 'src-1', targetPortId: 'tgt-1', wireType: WireType.interpolation } as DrawWireAction);

      const result = engine.verify();

      expect(result).not.toBeNull();
      expect(result!.correctWires).toHaveLength(1);
      expect(result!.incorrectWires).toHaveLength(0);
      expect(result!.missingWires).toHaveLength(2);
    });

    it('should keep status as Playing after failed verification with attempts remaining', () => {
      const engine = createEngine();
      initAndStart(engine);

      engine.submitAction({ type: 'draw-wire', sourcePortId: 'src-1', targetPortId: 'tgt-1', wireType: WireType.interpolation } as DrawWireAction);

      engine.verify();

      expect(engine.status()).toBe(MinigameStatus.Playing);
      expect(engine.verificationsRemaining()).toBe(2);
    });
  });

  // --- 8. Verification -- attempts exhausted ---

  describe('Verification - attempts exhausted', () => {
    it('should call fail() when 3rd verification fails', () => {
      const engine = createEngine();
      initAndStart(engine);

      // Draw only 1 wire (incomplete) and verify 3 times
      engine.submitAction({ type: 'draw-wire', sourcePortId: 'src-1', targetPortId: 'tgt-1', wireType: WireType.interpolation } as DrawWireAction);

      engine.verify(); // attempt 1
      engine.verify(); // attempt 2
      engine.verify(); // attempt 3

      expect(engine.verificationsRemaining()).toBe(0);
      expect(engine.status()).toBe(MinigameStatus.Lost);
    });

    it('should set status to Lost', () => {
      const engine = createEngine();
      initAndStart(engine);

      engine.submitAction({ type: 'draw-wire', sourcePortId: 'src-1', targetPortId: 'tgt-1', wireType: WireType.interpolation } as DrawWireAction);

      engine.verify();
      engine.verify();
      engine.verify();

      expect(engine.status()).toBe(MinigameStatus.Lost);
    });
  });

  // --- 9. Verification -- second/third attempt success ---

  describe('Verification - second/third attempt success', () => {
    it('should award maxScore * 0.4 on second-attempt success', () => {
      const engine = createEngine({ maxScore: 1000 });
      initAndStart(engine);

      // First attempt: draw only 1 wire (fail)
      engine.submitAction({ type: 'draw-wire', sourcePortId: 'src-1', targetPortId: 'tgt-1', wireType: WireType.interpolation } as DrawWireAction);
      engine.verify();
      expect(engine.status()).toBe(MinigameStatus.Playing);

      // Fix: draw remaining wires
      engine.submitAction({ type: 'draw-wire', sourcePortId: 'src-2', targetPortId: 'tgt-2', wireType: WireType.property } as DrawWireAction);
      engine.submitAction({ type: 'draw-wire', sourcePortId: 'src-3', targetPortId: 'tgt-3', wireType: WireType.event } as DrawWireAction);

      // Second attempt: all correct
      engine.verify();

      expect(engine.score()).toBe(Math.round(1000 * SECOND_ATTEMPT_MULTIPLIER));
      expect(engine.status()).toBe(MinigameStatus.Won);
    });

    it('should award maxScore * 0.2 on third-attempt success', () => {
      const engine = createEngine({ maxScore: 1000 });
      initAndStart(engine);

      // First attempt: incomplete
      engine.submitAction({ type: 'draw-wire', sourcePortId: 'src-1', targetPortId: 'tgt-1', wireType: WireType.interpolation } as DrawWireAction);
      engine.verify();

      // Second attempt: still incomplete
      engine.verify();

      // Third attempt: draw remaining wires and verify
      engine.submitAction({ type: 'draw-wire', sourcePortId: 'src-2', targetPortId: 'tgt-2', wireType: WireType.property } as DrawWireAction);
      engine.submitAction({ type: 'draw-wire', sourcePortId: 'src-3', targetPortId: 'tgt-3', wireType: WireType.event } as DrawWireAction);
      engine.verify();

      expect(engine.score()).toBe(Math.round(1000 * THIRD_ATTEMPT_MULTIPLIER));
      expect(engine.status()).toBe(MinigameStatus.Won);
    });
  });

  // --- Scoring constants ---

  describe('Scoring constants', () => {
    it('should define scoring multipliers in descending order', () => {
      expect(PERFECT_SCORE_MULTIPLIER).toBe(1.0);
      expect(FIRST_ATTEMPT_MULTIPLIER).toBe(0.7);
      expect(SECOND_ATTEMPT_MULTIPLIER).toBe(0.4);
      expect(THIRD_ATTEMPT_MULTIPLIER).toBe(0.2);
      expect(PERFECT_SCORE_MULTIPLIER).toBeGreaterThan(FIRST_ATTEMPT_MULTIPLIER);
      expect(FIRST_ATTEMPT_MULTIPLIER).toBeGreaterThan(SECOND_ATTEMPT_MULTIPLIER);
      expect(SECOND_ATTEMPT_MULTIPLIER).toBeGreaterThan(THIRD_ATTEMPT_MULTIPLIER);
    });
  });

  // --- 10. Edge cases ---

  describe('Edge cases', () => {
    it('should return invalid for unknown action types', () => {
      const engine = createEngine();
      initAndStart(engine);

      const result = engine.submitAction({ type: 'unknown-action' });

      expect(result.valid).toBe(false);
      expect(result.scoreChange).toBe(0);
      expect(result.livesChange).toBe(0);
    });

    it('should not allow verify() when status is not Playing', () => {
      const engine = createEngine();
      engine.initialize(createLevel(createTestLevelData()));
      // Still in Loading status, not started

      const result = engine.verify();

      expect(result).toBeNull();
    });

    it('should not allow submitAction when status is not Playing (handled by base class)', () => {
      const engine = createEngine();
      engine.initialize(createLevel(createTestLevelData()));
      // Still in Loading status

      const result = engine.submitAction({
        type: 'draw-wire',
        sourcePortId: 'src-1',
        targetPortId: 'tgt-1',
        wireType: WireType.interpolation,
      } as DrawWireAction);

      expect(result.valid).toBe(false);
    });

    it('should handle empty level data -- verify() with no expected wires and no player wires should complete', () => {
      const engine = createEngine({ maxScore: 1000 });
      const data = createTestLevelData({
        sourcePorts: [],
        targetPorts: [],
        correctWires: [],
        preWiredConnections: [],
      });
      initAndStart(engine, data);

      engine.verify();

      expect(engine.status()).toBe(MinigameStatus.Won);
      expect(engine.score()).toBe(1000 * PERFECT_SCORE_MULTIPLIER);
    });

    it('should handle level with all pre-wired correct connections -- verify() without changes should pass', () => {
      const engine = createEngine({ maxScore: 1000 });
      const preWired: WireConnection[] = [
        { id: 'pw-1', sourcePortId: 'src-1', targetPortId: 'tgt-1', wireType: WireType.interpolation, isPreWired: true, isCorrect: true },
        { id: 'pw-2', sourcePortId: 'src-2', targetPortId: 'tgt-2', wireType: WireType.property, isPreWired: true, isCorrect: true },
        { id: 'pw-3', sourcePortId: 'src-3', targetPortId: 'tgt-3', wireType: WireType.event, isPreWired: true, isCorrect: true },
      ];
      const data = createTestLevelData({ preWiredConnections: preWired });
      initAndStart(engine, data);

      engine.verify();

      expect(engine.status()).toBe(MinigameStatus.Won);
      expect(engine.score()).toBe(1000 * PERFECT_SCORE_MULTIPLIER);
    });
  });

  // --- 11. Reset ---

  describe('Reset', () => {
    it('should restore pre-wired connections and reset verification count on reset()', () => {
      const engine = createEngine();
      const preWired: WireConnection[] = [
        { id: 'pw-1', sourcePortId: 'src-1', targetPortId: 'tgt-1', wireType: WireType.interpolation, isPreWired: true, isCorrect: true },
      ];
      const data = createTestLevelData({ preWiredConnections: preWired });
      initAndStart(engine, data);

      // Modify state: draw an extra wire, verify once
      engine.submitAction({ type: 'draw-wire', sourcePortId: 'src-2', targetPortId: 'tgt-2', wireType: WireType.property } as DrawWireAction);
      engine.verify();

      expect(engine.wires()).toHaveLength(2);
      expect(engine.verificationCount()).toBe(1);

      // Reset
      engine.reset();

      // After reset: only pre-wired connections, verification count back to 0
      expect(engine.wires()).toHaveLength(1);
      expect(engine.wires()[0].id).toBe('pw-1');
      expect(engine.wires()[0].isPreWired).toBe(true);
      expect(engine.verificationCount()).toBe(0);
      expect(engine.verificationsRemaining()).toBe(3);
      expect(engine.status()).toBe(MinigameStatus.Playing);
    });
  });

  // --- 12. ValidationService integration ---

  describe('ValidationService integration', () => {
    it('should accept validation service in constructor and behave identically for valid draw-wire', () => {
      const { engine } = createEngineWithService();
      initAndStart(engine);

      const result = engine.submitAction({
        type: 'draw-wire',
        sourcePortId: 'src-1',
        targetPortId: 'tgt-1',
        wireType: WireType.interpolation,
      } as DrawWireAction);

      expect(result.valid).toBe(true);
      expect(engine.wires()).toHaveLength(1);
    });

    it('should delegate isCorrectBindingType to service on draw-wire (valid case)', () => {
      const { engine, service } = createEngineWithService();
      initAndStart(engine);

      const spy = vi.spyOn(service, 'isCorrectBindingType');

      engine.submitAction({
        type: 'draw-wire',
        sourcePortId: 'src-1',
        targetPortId: 'tgt-1',
        wireType: WireType.interpolation,
      } as DrawWireAction);

      expect(spy).toHaveBeenCalledOnce();
      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'src-1', portType: 'property' }),
        expect.objectContaining({ id: 'tgt-1', bindingSlot: 'interpolation' }),
        WireType.interpolation,
      );
    });

    it('should delegate isCorrectBindingType to service on draw-wire (invalid case)', () => {
      const { engine, service } = createEngineWithService();
      initAndStart(engine);

      const spy = vi.spyOn(service, 'isCorrectBindingType');

      // property source + event target + WireType.event => incompatible
      const result = engine.submitAction({
        type: 'draw-wire',
        sourcePortId: 'src-1',
        targetPortId: 'tgt-3',
        wireType: WireType.event,
      } as DrawWireAction);

      expect(spy).toHaveBeenCalledOnce();
      expect(result.valid).toBe(false);
      expect(engine.wires()).toHaveLength(0);
    });

    it('should delegate validateAll to service on verify()', () => {
      const { engine, service } = createEngineWithService();
      initAndStart(engine);
      drawAllCorrectWires(engine);

      const spy = vi.spyOn(service, 'validateAll');

      engine.verify();

      expect(spy).toHaveBeenCalledOnce();
    });

    it('should return hint text from getHintForWire() for pre-wired incorrect wire', () => {
      const { engine } = createEngineWithService();
      // Pre-wire with WRONG wireType: property source + property target, but use interpolation wireType
      const preWired: WireConnection[] = [
        { id: 'pw-wrong', sourcePortId: 'src-2', targetPortId: 'tgt-2', wireType: WireType.interpolation, isPreWired: true, isCorrect: false },
      ];
      const data = createTestLevelData({ preWiredConnections: preWired });
      initAndStart(engine, data);

      const hint = engine.getHintForWire('pw-wrong');

      expect(hint).toBe('Use [property] binding instead of {{ }} when binding to an element property directly.');
    });

    it('should return null from getHintForWire() when no service is present', () => {
      const engine = createEngine();
      const preWired: WireConnection[] = [
        { id: 'pw-wrong', sourcePortId: 'src-2', targetPortId: 'tgt-2', wireType: WireType.interpolation, isPreWired: true, isCorrect: false },
      ];
      const data = createTestLevelData({ preWiredConnections: preWired });
      initAndStart(engine, data);

      const hint = engine.getHintForWire('pw-wrong');

      expect(hint).toBeNull();
    });

    it('should return null from getHintForWire() for correctly-typed wire', () => {
      const { engine } = createEngineWithService();
      initAndStart(engine);

      // Draw a correct wire (property source + interpolation target + interpolation wireType)
      engine.submitAction({
        type: 'draw-wire',
        sourcePortId: 'src-1',
        targetPortId: 'tgt-1',
        wireType: WireType.interpolation,
      } as DrawWireAction);

      const wireId = engine.wires()[0].id;
      const hint = engine.getHintForWire(wireId);

      expect(hint).toBeNull();
    });

    it('should return null from getHintForWire() for non-existent wireId', () => {
      const { engine } = createEngineWithService();
      initAndStart(engine);

      const hint = engine.getHintForWire('non-existent');

      expect(hint).toBeNull();
    });

    it('should preserve inline fallback when no service is provided', () => {
      const engine = createEngine();
      initAndStart(engine);

      // Draw valid wire
      const drawResult = engine.submitAction({
        type: 'draw-wire',
        sourcePortId: 'src-1',
        targetPortId: 'tgt-1',
        wireType: WireType.interpolation,
      } as DrawWireAction);
      expect(drawResult.valid).toBe(true);

      // Draw remaining wires and verify
      engine.submitAction({ type: 'draw-wire', sourcePortId: 'src-2', targetPortId: 'tgt-2', wireType: WireType.property } as DrawWireAction);
      engine.submitAction({ type: 'draw-wire', sourcePortId: 'src-3', targetPortId: 'tgt-3', wireType: WireType.event } as DrawWireAction);
      const verifyResult = engine.verify();

      expect(verifyResult).not.toBeNull();
      expect(verifyResult!.correctWires).toHaveLength(3);
      expect(engine.status()).toBe(MinigameStatus.Won);
    });

    it('should complete engine when service validateAll returns all correct', () => {
      const { engine } = createEngineWithService({ maxScore: 1000 });
      initAndStart(engine);
      drawAllCorrectWires(engine);

      engine.verify();

      expect(engine.status()).toBe(MinigameStatus.Won);
      expect(engine.score()).toBe(1000 * PERFECT_SCORE_MULTIPLIER);
    });

    it('should work after reset() -- service remains usable', () => {
      const { engine } = createEngineWithService();
      initAndStart(engine);

      // Draw wires and verify
      drawAllCorrectWires(engine);
      engine.verify();
      expect(engine.status()).toBe(MinigameStatus.Won);

      // Reset
      engine.reset();
      expect(engine.status()).toBe(MinigameStatus.Playing);

      // Draw wires again and verify again
      drawAllCorrectWires(engine);
      const result = engine.verify();

      expect(result).not.toBeNull();
      expect(result!.correctWires).toHaveLength(3);
      expect(engine.status()).toBe(MinigameStatus.Won);
    });
  });
});
