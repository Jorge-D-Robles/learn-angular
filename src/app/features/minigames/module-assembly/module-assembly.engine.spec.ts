import {
  ModuleAssemblyEngine,
  BASE_PLACEMENT_SCORE,
  DECOY_BONUS_SCORE,
  type PlacePartAction,
  type RejectDecoyAction,
} from './module-assembly.engine';
import type {
  ComponentPart,
  BlueprintSlot,
  ComponentBlueprint,
  ModuleAssemblyLevelData,
} from './module-assembly.types';
import {
  MinigameStatus,
  DifficultyTier,
  type MinigameLevel,
} from '../../../core/minigame/minigame.types';
import { ComboTrackerService } from '../../../core/minigame/combo-tracker.service';
import { ConveyorBeltService } from './conveyor-belt.service';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function createTestPart(overrides?: Partial<ComponentPart>): ComponentPart {
  return {
    id: 'part-1',
    type: 'template',
    content: '<h1>Hello</h1>',
    isDecoy: false,
    correctSlotId: 'slot-1',
    ...overrides,
  };
}

function createDecoyPart(overrides?: Partial<ComponentPart>): ComponentPart {
  return {
    id: 'decoy-1',
    type: 'template',
    content: '<div>wrong</div>',
    isDecoy: true,
    correctSlotId: null,
    ...overrides,
  };
}

function createTestSlot(overrides?: Partial<BlueprintSlot>): BlueprintSlot {
  return {
    id: 'slot-1',
    slotType: 'template',
    label: 'Template',
    isRequired: true,
    isOptional: false,
    ...overrides,
  };
}

function createTestBlueprint(overrides?: Partial<ComponentBlueprint>): ComponentBlueprint {
  return {
    name: 'TestComponent',
    slots: [createTestSlot()],
    expectedParts: ['part-1'],
    ...overrides,
  };
}

function createTestLevelData(overrides?: Partial<ModuleAssemblyLevelData>): ModuleAssemblyLevelData {
  return {
    blueprint: createTestBlueprint(),
    parts: [createTestPart()],
    decoys: [],
    beltSpeed: 100,
    ...overrides,
  };
}

function createLevel(data: ModuleAssemblyLevelData): MinigameLevel<ModuleAssemblyLevelData> {
  return {
    id: 'ma-test-01',
    gameId: 'module-assembly',
    tier: DifficultyTier.Basic,
    conceptIntroduced: 'Component basics',
    description: 'Test level',
    data,
  };
}

function createEngine(comboTracker?: ComboTrackerService): ModuleAssemblyEngine {
  return new ModuleAssemblyEngine({ comboTracker });
}

function initAndStart(
  engine: ModuleAssemblyEngine,
  data?: ModuleAssemblyLevelData,
): void {
  engine.initialize(createLevel(data ?? createTestLevelData()));
  engine.start();
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ModuleAssemblyEngine', () => {
  // --- 1. Initialization ---

  describe('Initialization', () => {
    it('should initialize with Loading status', () => {
      const engine = createEngine();
      engine.initialize(createLevel(createTestLevelData()));

      expect(engine.status()).toBe(MinigameStatus.Loading);
    });

    it('should populate belt parts from level data on onLevelLoad', () => {
      const engine = createEngine();
      const parts = [createTestPart({ id: 'p1' }), createTestPart({ id: 'p2' })];
      const data = createTestLevelData({ parts });
      engine.initialize(createLevel(data));

      expect(engine.beltParts()).toHaveLength(2);
      expect(engine.beltParts()[0].id).toBe('p1');
      expect(engine.beltParts()[1].id).toBe('p2');
    });

    it('should set belt speed from level data on onLevelLoad', () => {
      const engine = createEngine();
      const data = createTestLevelData({ beltSpeed: 200 });
      engine.initialize(createLevel(data));

      expect(engine.beltSpeed()).toBe(200);
    });

    it('should start with empty filled slots on onLevelLoad', () => {
      const engine = createEngine();
      engine.initialize(createLevel(createTestLevelData()));

      expect(engine.filledSlots().size).toBe(0);
    });

    it('should have strikes at 0 and maxStrikes equal to initialLives', () => {
      const engine = createEngine();
      initAndStart(engine);

      expect(engine.strikes()).toBe(0);
      expect(engine.maxStrikes()).toBe(3);
    });
  });

  // --- 2. Place Part - correct placement ---

  describe('Place Part - correct placement', () => {
    it('should return valid result with positive score and no lives change', () => {
      const engine = createEngine();
      initAndStart(engine);

      const action: PlacePartAction = {
        type: 'place-part',
        partId: 'part-1',
        targetSlotId: 'slot-1',
      };
      const result = engine.submitAction(action);

      expect(result.valid).toBe(true);
      expect(result.scoreChange).toBeGreaterThan(0);
      expect(result.livesChange).toBe(0);
    });

    it('should remove part from belt after correct placement', () => {
      const engine = createEngine();
      initAndStart(engine);

      engine.submitAction({
        type: 'place-part',
        partId: 'part-1',
        targetSlotId: 'slot-1',
      } as PlacePartAction);

      expect(engine.beltParts()).toHaveLength(0);
    });

    it('should add part to filledSlots map with correct slotId key', () => {
      const engine = createEngine();
      initAndStart(engine);

      engine.submitAction({
        type: 'place-part',
        partId: 'part-1',
        targetSlotId: 'slot-1',
      } as PlacePartAction);

      expect(engine.filledSlots().has('slot-1')).toBe(true);
      expect(engine.filledSlots().get('slot-1')!.id).toBe('part-1');
    });

    it('should return score change equal to BASE_PLACEMENT_SCORE when combo is 1x', () => {
      const comboTracker = new ComboTrackerService();
      const engine = createEngine(comboTracker);
      initAndStart(engine);

      const result = engine.submitAction({
        type: 'place-part',
        partId: 'part-1',
        targetSlotId: 'slot-1',
      } as PlacePartAction);

      expect(result.scoreChange).toBe(BASE_PLACEMENT_SCORE);
    });

    it('should increase score with consecutive correct placements via combo', () => {
      const comboTracker = new ComboTrackerService();
      const engine = createEngine(comboTracker);

      const slot1 = createTestSlot({ id: 'slot-1' });
      const slot2 = createTestSlot({ id: 'slot-2' });
      const slot3 = createTestSlot({ id: 'slot-3' });
      const slot4 = createTestSlot({ id: 'slot-4', isRequired: false, isOptional: true });
      const part1 = createTestPart({ id: 'p1', correctSlotId: 'slot-1' });
      const part2 = createTestPart({ id: 'p2', correctSlotId: 'slot-2' });
      const part3 = createTestPart({ id: 'p3', correctSlotId: 'slot-3' });
      const part4 = createTestPart({ id: 'p4', correctSlotId: 'slot-4' });

      const data = createTestLevelData({
        blueprint: createTestBlueprint({
          slots: [slot1, slot2, slot3, slot4],
          expectedParts: ['p1', 'p2', 'p3', 'p4'],
        }),
        parts: [part1, part2, part3, part4],
      });
      initAndStart(engine, data);

      const result1 = engine.submitAction({
        type: 'place-part',
        partId: 'p1',
        targetSlotId: 'slot-1',
      } as PlacePartAction);

      // Second correct placement (combo 2, still 1.0x)
      engine.submitAction({
        type: 'place-part',
        partId: 'p2',
        targetSlotId: 'slot-2',
      } as PlacePartAction);

      const result3 = engine.submitAction({
        type: 'place-part',
        partId: 'p3',
        targetSlotId: 'slot-3',
      } as PlacePartAction);

      // After 3 consecutive correct actions, combo multiplier goes to 1.5x
      // result1 has combo 1 (1.0x), result3 has combo 3 (1.5x)
      expect(result3.scoreChange).toBeGreaterThan(result1.scoreChange);
    });
  });

  // --- 3. Place Part - wrong placement ---

  describe('Place Part - wrong placement', () => {
    it('should return invalid result with no score and -1 lives change', () => {
      const engine = createEngine();
      const slot1 = createTestSlot({ id: 'slot-1' });
      const slot2 = createTestSlot({ id: 'slot-2' });
      const part1 = createTestPart({ id: 'p1', correctSlotId: 'slot-1' });
      const part2 = createTestPart({ id: 'p2', correctSlotId: 'slot-2' });

      const data = createTestLevelData({
        blueprint: createTestBlueprint({
          slots: [slot1, slot2],
          expectedParts: ['p1', 'p2'],
        }),
        parts: [part1, part2],
      });
      initAndStart(engine, data);

      const result = engine.submitAction({
        type: 'place-part',
        partId: 'p1',
        targetSlotId: 'slot-2', // wrong slot
      } as PlacePartAction);

      expect(result.valid).toBe(false);
      expect(result.scoreChange).toBe(0);
      expect(result.livesChange).toBe(-1);
    });

    it('should keep part on belt after wrong placement', () => {
      const engine = createEngine();
      const slot1 = createTestSlot({ id: 'slot-1' });
      const slot2 = createTestSlot({ id: 'slot-2' });
      const part1 = createTestPart({ id: 'p1', correctSlotId: 'slot-1' });
      const part2 = createTestPart({ id: 'p2', correctSlotId: 'slot-2' });

      const data = createTestLevelData({
        blueprint: createTestBlueprint({
          slots: [slot1, slot2],
          expectedParts: ['p1', 'p2'],
        }),
        parts: [part1, part2],
      });
      initAndStart(engine, data);

      engine.submitAction({
        type: 'place-part',
        partId: 'p1',
        targetSlotId: 'slot-2',
      } as PlacePartAction);

      expect(engine.beltParts().find(p => p.id === 'p1')).toBeDefined();
    });

    it('should increment strikes by 1 on wrong placement', () => {
      const engine = createEngine();
      const slot1 = createTestSlot({ id: 'slot-1' });
      const slot2 = createTestSlot({ id: 'slot-2' });
      const part1 = createTestPart({ id: 'p1', correctSlotId: 'slot-1' });
      const part2 = createTestPart({ id: 'p2', correctSlotId: 'slot-2' });

      const data = createTestLevelData({
        blueprint: createTestBlueprint({
          slots: [slot1, slot2],
          expectedParts: ['p1', 'p2'],
        }),
        parts: [part1, part2],
      });
      initAndStart(engine, data);

      engine.submitAction({
        type: 'place-part',
        partId: 'p1',
        targetSlotId: 'slot-2',
      } as PlacePartAction);

      expect(engine.strikes()).toBe(1);
    });

    it('should trigger fail after 3 wrong placements', () => {
      const engine = createEngine();
      const slot1 = createTestSlot({ id: 'slot-1' });
      const slot2 = createTestSlot({ id: 'slot-2' });
      const part1 = createTestPart({ id: 'p1', correctSlotId: 'slot-1' });
      const part2 = createTestPart({ id: 'p2', correctSlotId: 'slot-2' });

      const data = createTestLevelData({
        blueprint: createTestBlueprint({
          slots: [slot1, slot2],
          expectedParts: ['p1', 'p2'],
        }),
        parts: [part1, part2],
      });
      initAndStart(engine, data);

      // 3 wrong placements
      engine.submitAction({ type: 'place-part', partId: 'p1', targetSlotId: 'slot-2' } as PlacePartAction);
      engine.submitAction({ type: 'place-part', partId: 'p1', targetSlotId: 'slot-2' } as PlacePartAction);
      engine.submitAction({ type: 'place-part', partId: 'p1', targetSlotId: 'slot-2' } as PlacePartAction);

      expect(engine.status()).toBe(MinigameStatus.Lost);
    });
  });

  // --- 4. Place Part - edge cases ---

  describe('Place Part - edge cases', () => {
    it('should return invalid with no score/lives change when placing into already-filled slot', () => {
      const engine = createEngine();
      const slot1 = createTestSlot({ id: 'slot-1' });
      const part1 = createTestPart({ id: 'p1', correctSlotId: 'slot-1' });
      const part2 = createTestPart({ id: 'p2', correctSlotId: 'slot-1' });

      const data = createTestLevelData({
        blueprint: createTestBlueprint({
          slots: [slot1],
          expectedParts: ['p1', 'p2'],
        }),
        parts: [part1, part2],
      });
      initAndStart(engine, data);

      // First placement fills slot-1
      engine.submitAction({ type: 'place-part', partId: 'p1', targetSlotId: 'slot-1' } as PlacePartAction);

      // Second placement into same filled slot
      const result = engine.submitAction({ type: 'place-part', partId: 'p2', targetSlotId: 'slot-1' } as PlacePartAction);

      expect(result.valid).toBe(false);
      expect(result.scoreChange).toBe(0);
      expect(result.livesChange).toBe(0);
    });

    it('should return invalid when placing a non-existent partId', () => {
      const engine = createEngine();
      initAndStart(engine);

      const result = engine.submitAction({
        type: 'place-part',
        partId: 'non-existent',
        targetSlotId: 'slot-1',
      } as PlacePartAction);

      expect(result.valid).toBe(false);
      expect(result.scoreChange).toBe(0);
      expect(result.livesChange).toBe(0);
    });

    it('should return invalid when placing into a non-existent slotId', () => {
      const engine = createEngine();
      initAndStart(engine);

      const result = engine.submitAction({
        type: 'place-part',
        partId: 'part-1',
        targetSlotId: 'non-existent',
      } as PlacePartAction);

      expect(result.valid).toBe(false);
      expect(result.scoreChange).toBe(0);
      expect(result.livesChange).toBe(0);
    });

    it('should return invalid with strike when placing a decoy part into a slot', () => {
      const engine = createEngine();
      const slot1 = createTestSlot({ id: 'slot-1' });
      const decoy = createDecoyPart({ id: 'decoy-1' });

      const data = createTestLevelData({
        blueprint: createTestBlueprint({
          slots: [slot1],
          expectedParts: ['part-1'],
        }),
        parts: [createTestPart(), decoy],
      });
      initAndStart(engine, data);

      const result = engine.submitAction({
        type: 'place-part',
        partId: 'decoy-1',
        targetSlotId: 'slot-1',
      } as PlacePartAction);

      expect(result.valid).toBe(false);
      expect(result.scoreChange).toBe(0);
      expect(result.livesChange).toBe(-1);
    });

    it('should return invalid with strike when correct type but wrong target slot', () => {
      const engine = createEngine();
      const slot1 = createTestSlot({ id: 'slot-1', slotType: 'template' });
      const slot2 = createTestSlot({ id: 'slot-2', slotType: 'template' });
      const part1 = createTestPart({ id: 'p1', type: 'template', correctSlotId: 'slot-1' });

      const data = createTestLevelData({
        blueprint: createTestBlueprint({
          slots: [slot1, slot2],
          expectedParts: ['p1'],
        }),
        parts: [part1],
      });
      initAndStart(engine, data);

      // Part type matches slot-2's slotType, but correctSlotId is slot-1
      const result = engine.submitAction({
        type: 'place-part',
        partId: 'p1',
        targetSlotId: 'slot-2',
      } as PlacePartAction);

      expect(result.valid).toBe(false);
      expect(result.scoreChange).toBe(0);
      expect(result.livesChange).toBe(-1);
    });
  });

  // --- 5. Reject Decoy - correct rejection ---

  describe('Reject Decoy - correct rejection', () => {
    it('should return valid result with DECOY_BONUS_SCORE and no lives change', () => {
      const engine = createEngine();
      const decoy = createDecoyPart({ id: 'decoy-1' });

      const data = createTestLevelData({
        parts: [createTestPart(), decoy],
      });
      initAndStart(engine, data);

      const result = engine.submitAction({
        type: 'reject-decoy',
        partId: 'decoy-1',
      } as RejectDecoyAction);

      expect(result.valid).toBe(true);
      expect(result.scoreChange).toBe(DECOY_BONUS_SCORE);
      expect(result.livesChange).toBe(0);
    });

    it('should remove decoy from belt after correct rejection', () => {
      const engine = createEngine();
      const decoy = createDecoyPart({ id: 'decoy-1' });

      const data = createTestLevelData({
        parts: [createTestPart(), decoy],
      });
      initAndStart(engine, data);

      engine.submitAction({
        type: 'reject-decoy',
        partId: 'decoy-1',
      } as RejectDecoyAction);

      expect(engine.beltParts().find(p => p.id === 'decoy-1')).toBeUndefined();
    });

    it('should increase score by DECOY_BONUS_SCORE', () => {
      const engine = createEngine();
      const decoy = createDecoyPart({ id: 'decoy-1' });

      const data = createTestLevelData({
        parts: [createTestPart(), decoy],
      });
      initAndStart(engine, data);

      const scoreBefore = engine.score();
      engine.submitAction({
        type: 'reject-decoy',
        partId: 'decoy-1',
      } as RejectDecoyAction);

      expect(engine.score()).toBe(scoreBefore + DECOY_BONUS_SCORE);
    });
  });

  // --- 6. Reject Decoy - wrong rejection ---

  describe('Reject Decoy - wrong rejection', () => {
    it('should return invalid result with no score and -1 lives change when rejecting a valid part', () => {
      const engine = createEngine();

      const data = createTestLevelData({
        parts: [createTestPart({ id: 'p1' }), createTestPart({ id: 'p2', correctSlotId: 'slot-1' })],
      });
      initAndStart(engine, data);

      const result = engine.submitAction({
        type: 'reject-decoy',
        partId: 'p1',
      } as RejectDecoyAction);

      expect(result.valid).toBe(false);
      expect(result.scoreChange).toBe(0);
      expect(result.livesChange).toBe(-1);
    });

    it('should keep valid part on belt after wrong rejection', () => {
      const engine = createEngine();

      const data = createTestLevelData({
        parts: [createTestPart({ id: 'p1' }), createTestPart({ id: 'p2', correctSlotId: 'slot-1' })],
      });
      initAndStart(engine, data);

      engine.submitAction({
        type: 'reject-decoy',
        partId: 'p1',
      } as RejectDecoyAction);

      expect(engine.beltParts().find(p => p.id === 'p1')).toBeDefined();
    });

    it('should count a strike on wrong rejection', () => {
      const engine = createEngine();

      const data = createTestLevelData({
        parts: [createTestPart({ id: 'p1' }), createTestPart({ id: 'p2', correctSlotId: 'slot-1' })],
      });
      initAndStart(engine, data);

      engine.submitAction({
        type: 'reject-decoy',
        partId: 'p1',
      } as RejectDecoyAction);

      expect(engine.strikes()).toBe(1);
    });
  });

  // --- 7. Win condition ---

  describe('Win condition', () => {
    it('should trigger complete when all required slots are filled', () => {
      const engine = createEngine();
      initAndStart(engine);

      engine.submitAction({
        type: 'place-part',
        partId: 'part-1',
        targetSlotId: 'slot-1',
      } as PlacePartAction);

      expect(engine.status()).toBe(MinigameStatus.Won);
    });

    it('should NOT trigger complete when only optional slots are filled and required remain', () => {
      const engine = createEngine();
      const requiredSlot = createTestSlot({ id: 'slot-req', isRequired: true, isOptional: false });
      const optionalSlot = createTestSlot({ id: 'slot-opt', isRequired: false, isOptional: true });
      const partReq = createTestPart({ id: 'p-req', correctSlotId: 'slot-req' });
      const partOpt = createTestPart({ id: 'p-opt', correctSlotId: 'slot-opt' });

      const data = createTestLevelData({
        blueprint: createTestBlueprint({
          slots: [requiredSlot, optionalSlot],
          expectedParts: ['p-req', 'p-opt'],
        }),
        parts: [partReq, partOpt],
      });
      initAndStart(engine, data);

      // Fill optional slot only
      engine.submitAction({
        type: 'place-part',
        partId: 'p-opt',
        targetSlotId: 'slot-opt',
      } as PlacePartAction);

      expect(engine.status()).toBe(MinigameStatus.Playing);
    });

    it('should trigger win even if decoy parts remain on belt', () => {
      const engine = createEngine();
      const slot1 = createTestSlot({ id: 'slot-1' });
      const part1 = createTestPart({ id: 'p1', correctSlotId: 'slot-1' });
      const decoy = createDecoyPart({ id: 'decoy-1' });

      const data = createTestLevelData({
        blueprint: createTestBlueprint({
          slots: [slot1],
          expectedParts: ['p1'],
        }),
        parts: [part1, decoy],
      });
      initAndStart(engine, data);

      engine.submitAction({
        type: 'place-part',
        partId: 'p1',
        targetSlotId: 'slot-1',
      } as PlacePartAction);

      expect(engine.status()).toBe(MinigameStatus.Won);
      // Decoy still on belt
      expect(engine.beltParts()).toHaveLength(1);
    });

    it('should trigger win when all required slots are filled even if optional slots remain empty', () => {
      const engine = createEngine();
      const requiredSlot = createTestSlot({ id: 'slot-req', isRequired: true, isOptional: false });
      const optionalSlot = createTestSlot({ id: 'slot-opt', isRequired: false, isOptional: true });
      const partReq = createTestPart({ id: 'p-req', correctSlotId: 'slot-req' });
      const partOpt = createTestPart({ id: 'p-opt', correctSlotId: 'slot-opt' });

      const data = createTestLevelData({
        blueprint: createTestBlueprint({
          slots: [requiredSlot, optionalSlot],
          expectedParts: ['p-req', 'p-opt'],
        }),
        parts: [partReq, partOpt],
      });
      initAndStart(engine, data);

      engine.submitAction({
        type: 'place-part',
        partId: 'p-req',
        targetSlotId: 'slot-req',
      } as PlacePartAction);

      expect(engine.status()).toBe(MinigameStatus.Won);
    });
  });

  // --- 8. Belt exhaustion ---

  describe('Belt exhaustion', () => {
    it('should trigger fail when belt is empty and required slots remain unfilled', () => {
      const engine = createEngine();
      const slot1 = createTestSlot({ id: 'slot-1' });
      const slot2 = createTestSlot({ id: 'slot-2' });
      const part1 = createTestPart({ id: 'p1', correctSlotId: 'slot-1' });

      const data = createTestLevelData({
        blueprint: createTestBlueprint({
          slots: [slot1, slot2],
          expectedParts: ['p1'],
        }),
        parts: [part1],
      });
      initAndStart(engine, data);

      // Place part-1 correctly into slot-1 (belt empties, but slot-2 is unfilled)
      engine.submitAction({
        type: 'place-part',
        partId: 'p1',
        targetSlotId: 'slot-1',
      } as PlacePartAction);

      expect(engine.status()).toBe(MinigameStatus.Lost);
    });

    it('should NOT trigger fail when belt is empty but all required slots are filled (already won)', () => {
      const engine = createEngine();
      // 1 required slot, 1 part -- filling it wins and empties belt
      initAndStart(engine);

      engine.submitAction({
        type: 'place-part',
        partId: 'part-1',
        targetSlotId: 'slot-1',
      } as PlacePartAction);

      // Win check runs before exhaustion, so status is Won, not Lost
      expect(engine.status()).toBe(MinigameStatus.Won);
    });

    it('should trigger fail when removing last decoy via rejection and required slots remain unfilled', () => {
      const engine = createEngine();
      const slot1 = createTestSlot({ id: 'slot-1' });
      const decoy = createDecoyPart({ id: 'decoy-1' });

      const data = createTestLevelData({
        blueprint: createTestBlueprint({
          slots: [slot1],
          expectedParts: [],
        }),
        parts: [decoy],
      });
      initAndStart(engine, data);

      engine.submitAction({
        type: 'reject-decoy',
        partId: 'decoy-1',
      } as RejectDecoyAction);

      expect(engine.status()).toBe(MinigameStatus.Lost);
    });

    it('should win (not lose) when placing last part fills all required slots AND empties belt', () => {
      const engine = createEngine();
      // Single required slot, single part on belt
      initAndStart(engine);

      engine.submitAction({
        type: 'place-part',
        partId: 'part-1',
        targetSlotId: 'slot-1',
      } as PlacePartAction);

      // Win checked before belt exhaustion -- status is Won
      expect(engine.status()).toBe(MinigameStatus.Won);
    });
  });

  // --- 9. Scoring with combo ---

  describe('Scoring with combo', () => {
    it('should increase score with combo multiplier on consecutive correct placements', () => {
      const comboTracker = new ComboTrackerService();
      const engine = createEngine(comboTracker);

      const slots = [
        createTestSlot({ id: 'slot-1' }),
        createTestSlot({ id: 'slot-2' }),
        createTestSlot({ id: 'slot-3' }),
        createTestSlot({ id: 'slot-4', isRequired: false, isOptional: true }),
      ];
      const parts = [
        createTestPart({ id: 'p1', correctSlotId: 'slot-1' }),
        createTestPart({ id: 'p2', correctSlotId: 'slot-2' }),
        createTestPart({ id: 'p3', correctSlotId: 'slot-3' }),
        createTestPart({ id: 'p4', correctSlotId: 'slot-4' }),
      ];

      const data = createTestLevelData({
        blueprint: createTestBlueprint({
          slots,
          expectedParts: ['p1', 'p2', 'p3', 'p4'],
        }),
        parts,
      });
      initAndStart(engine, data);

      const r1 = engine.submitAction({ type: 'place-part', partId: 'p1', targetSlotId: 'slot-1' } as PlacePartAction);
      const r2 = engine.submitAction({ type: 'place-part', partId: 'p2', targetSlotId: 'slot-2' } as PlacePartAction);
      const r3 = engine.submitAction({ type: 'place-part', partId: 'p3', targetSlotId: 'slot-3' } as PlacePartAction);

      // Combo kicks in at 3 consecutive correct: multiplier = 1.5x
      expect(r1.scoreChange).toBe(BASE_PLACEMENT_SCORE);
      expect(r2.scoreChange).toBe(BASE_PLACEMENT_SCORE);
      expect(r3.scoreChange).toBe(Math.round(BASE_PLACEMENT_SCORE * 1.5));
    });

    it('should reset combo on wrong placement', () => {
      const comboTracker = new ComboTrackerService();
      const engine = createEngine(comboTracker);

      const slots = [
        createTestSlot({ id: 'slot-1' }),
        createTestSlot({ id: 'slot-2' }),
        createTestSlot({ id: 'slot-3' }),
        createTestSlot({ id: 'slot-4' }),
        createTestSlot({ id: 'slot-5', isRequired: false, isOptional: true }),
      ];
      const parts = [
        createTestPart({ id: 'p1', correctSlotId: 'slot-1' }),
        createTestPart({ id: 'p2', correctSlotId: 'slot-2' }),
        createTestPart({ id: 'p3', correctSlotId: 'slot-3' }),
        createTestPart({ id: 'p4', correctSlotId: 'slot-4' }),
        createTestPart({ id: 'p5', correctSlotId: 'slot-5' }),
      ];

      const data = createTestLevelData({
        blueprint: createTestBlueprint({
          slots,
          expectedParts: ['p1', 'p2', 'p3', 'p4', 'p5'],
        }),
        parts,
      });
      initAndStart(engine, data);

      // 3 correct placements (combo 1, 2, 3)
      engine.submitAction({ type: 'place-part', partId: 'p1', targetSlotId: 'slot-1' } as PlacePartAction);
      engine.submitAction({ type: 'place-part', partId: 'p2', targetSlotId: 'slot-2' } as PlacePartAction);
      engine.submitAction({ type: 'place-part', partId: 'p3', targetSlotId: 'slot-3' } as PlacePartAction);

      // Wrong placement resets combo
      engine.submitAction({ type: 'place-part', partId: 'p4', targetSlotId: 'slot-5' } as PlacePartAction);

      // Next correct placement should be back to base score (combo 1, multiplier 1.0x)
      const result = engine.submitAction({ type: 'place-part', partId: 'p4', targetSlotId: 'slot-4' } as PlacePartAction);
      expect(result.scoreChange).toBe(BASE_PLACEMENT_SCORE);
    });
  });

  // --- 10. Invalid action type ---

  describe('Invalid action type', () => {
    it('should return invalid result with no score or lives change for unknown action type', () => {
      const engine = createEngine();
      initAndStart(engine);

      const result = engine.submitAction({ type: 'unknown-action' });

      expect(result.valid).toBe(false);
      expect(result.scoreChange).toBe(0);
      expect(result.livesChange).toBe(0);
    });
  });

  // --- 11. ConveyorBeltService integration ---

  describe('ConveyorBeltService integration', () => {
    function createEngineWithBelt(
      comboTracker?: ComboTrackerService,
    ): { engine: ModuleAssemblyEngine; beltService: ConveyorBeltService } {
      const beltService = new ConveyorBeltService();
      const engine = new ModuleAssemblyEngine({ comboTracker }, beltService);
      return { engine, beltService };
    }

    it('should call conveyorBelt.reset() with level parts and speed on initialize', () => {
      const { engine, beltService } = createEngineWithBelt();
      const parts = [
        createTestPart({ id: 'p1' }),
        createTestPart({ id: 'p2' }),
        createTestPart({ id: 'p3' }),
      ];
      const data = createTestLevelData({ parts, beltSpeed: 150 });

      engine.initialize(createLevel(data));

      expect(beltService.parts()).toHaveLength(3);
      expect(beltService.beltSpeed()).toBe(150);
    });

    it('should call conveyorBelt.removePart() on correct place-part action', () => {
      const { engine, beltService } = createEngineWithBelt();
      const data = createTestLevelData();
      initAndStart(engine, data);

      engine.submitAction({
        type: 'place-part',
        partId: 'part-1',
        targetSlotId: 'slot-1',
      } as PlacePartAction);

      expect(beltService.parts().find(bp => bp.part.id === 'part-1')).toBeUndefined();
    });

    it('should call conveyorBelt.removePart() on correct reject-decoy action', () => {
      const { engine, beltService } = createEngineWithBelt();
      const decoy = createDecoyPart({ id: 'decoy-1' });
      const data = createTestLevelData({
        parts: [createTestPart(), decoy],
      });
      initAndStart(engine, data);

      engine.submitAction({
        type: 'reject-decoy',
        partId: 'decoy-1',
      } as RejectDecoyAction);

      expect(beltService.parts().find(bp => bp.part.id === 'decoy-1')).toBeUndefined();
    });

    it('should NOT call conveyorBelt.removePart() on wrong placement', () => {
      const { engine, beltService } = createEngineWithBelt();
      const slot1 = createTestSlot({ id: 'slot-1' });
      const slot2 = createTestSlot({ id: 'slot-2' });
      const part1 = createTestPart({ id: 'p1', correctSlotId: 'slot-1' });
      const part2 = createTestPart({ id: 'p2', correctSlotId: 'slot-2' });

      const data = createTestLevelData({
        blueprint: createTestBlueprint({
          slots: [slot1, slot2],
          expectedParts: ['p1', 'p2'],
        }),
        parts: [part1, part2],
      });
      initAndStart(engine, data);

      engine.submitAction({
        type: 'place-part',
        partId: 'p1',
        targetSlotId: 'slot-2', // wrong slot
      } as PlacePartAction);

      expect(beltService.parts().find(bp => bp.part.id === 'p1')).toBeDefined();
    });

    it('should NOT call conveyorBelt.removePart() on wrong rejection', () => {
      const { engine, beltService } = createEngineWithBelt();
      const part1 = createTestPart({ id: 'p1', correctSlotId: 'slot-1' });
      const part2 = createTestPart({ id: 'p2', correctSlotId: 'slot-1' });

      const data = createTestLevelData({
        parts: [part1, part2],
      });
      initAndStart(engine, data);

      engine.submitAction({
        type: 'reject-decoy',
        partId: 'p1', // valid part, not a decoy
      } as RejectDecoyAction);

      expect(beltService.parts().find(bp => bp.part.id === 'p1')).toBeDefined();
    });

    it('should delegate tick to conveyorBelt.tick() and advance belt positions', () => {
      const { engine, beltService } = createEngineWithBelt();
      const parts = [
        createTestPart({ id: 'p1', correctSlotId: 'slot-1' }),
        createTestPart({ id: 'p2', correctSlotId: 'slot-2' }),
      ];
      const slot1 = createTestSlot({ id: 'slot-1' });
      const slot2 = createTestSlot({ id: 'slot-2' });
      const data = createTestLevelData({
        blueprint: createTestBlueprint({
          slots: [slot1, slot2],
          expectedParts: ['p1', 'p2'],
        }),
        parts,
        beltSpeed: 100,
      });
      initAndStart(engine, data);

      const initialPositions = beltService.parts().map(bp => bp.x);
      engine.tick(1.0); // 1 second at 100 px/s = 100 px displacement

      beltService.parts().forEach((bp, i) => {
        expect(bp.x).toBe(initialPositions[i] - 100);
      });
    });

    it('should detect exhaustion after tick scrolls all parts off-screen', () => {
      const { engine, beltService } = createEngineWithBelt();
      const slot1 = createTestSlot({ id: 'slot-1' });
      const part1 = createTestPart({ id: 'p1', correctSlotId: 'slot-1' });

      const data = createTestLevelData({
        blueprint: createTestBlueprint({
          slots: [slot1],
          expectedParts: ['p1'],
        }),
        parts: [part1],
        beltSpeed: 1000,
      });
      initAndStart(engine, data);

      // Tick enough to scroll all parts off-screen (x < 0)
      engine.tick(10);

      expect(beltService.isExhausted()).toBe(true);
      expect(engine.status()).toBe(MinigameStatus.Lost);
    });

    it('should NOT fail via exhaustion when service parts are removed by player (not exhausted)', () => {
      const { engine, beltService } = createEngineWithBelt();
      const slot1 = createTestSlot({ id: 'slot-1' });
      const part1 = createTestPart({ id: 'p1', correctSlotId: 'slot-1' });
      const decoy = createDecoyPart({ id: 'decoy-1' });

      const data = createTestLevelData({
        blueprint: createTestBlueprint({
          slots: [slot1],
          expectedParts: ['p1'],
        }),
        parts: [part1, decoy],
      });
      initAndStart(engine, data);

      // Place part correctly (fills required slot -> wins)
      engine.submitAction({
        type: 'place-part',
        partId: 'p1',
        targetSlotId: 'slot-1',
      } as PlacePartAction);

      expect(engine.status()).toBe(MinigameStatus.Won);
      // Service should not report exhaustion (part was removed by player, not scrolled off)
      expect(beltService.isExhausted()).toBe(false);
    });

    it('should reset conveyorBelt on engine.reset() (retry)', () => {
      const { engine, beltService } = createEngineWithBelt();
      const slot1 = createTestSlot({ id: 'slot-1' });
      const slot2 = createTestSlot({ id: 'slot-2' });
      const part1 = createTestPart({ id: 'p1', correctSlotId: 'slot-1' });
      const part2 = createTestPart({ id: 'p2', correctSlotId: 'slot-2' });

      const data = createTestLevelData({
        blueprint: createTestBlueprint({
          slots: [slot1, slot2],
          expectedParts: ['p1', 'p2'],
        }),
        parts: [part1, part2],
      });
      initAndStart(engine, data);

      // Submit a wrong action to change state
      engine.submitAction({
        type: 'place-part',
        partId: 'p1',
        targetSlotId: 'slot-2', // wrong
      } as PlacePartAction);

      // Reset the engine (retry)
      engine.reset();

      // Belt service should be re-populated with original level parts
      expect(beltService.parts()).toHaveLength(2);
      expect(beltService.parts().map(bp => bp.part.id)).toEqual(['p1', 'p2']);
    });

    it('should handle double removePart call safely (idempotent)', () => {
      const { engine, beltService } = createEngineWithBelt();
      const data = createTestLevelData();
      initAndStart(engine, data);

      const partsBefore = beltService.parts().length;

      // Engine calls removePart internally on correct placement
      engine.submitAction({
        type: 'place-part',
        partId: 'part-1',
        targetSlotId: 'slot-1',
      } as PlacePartAction);

      const partsAfterFirst = beltService.parts().length;
      expect(partsAfterFirst).toBe(partsBefore - 1);

      // Manually call removePart again (simulating component double-call)
      expect(() => beltService.removePart('part-1')).not.toThrow();
      expect(beltService.parts().length).toBe(partsAfterFirst);
    });
  });
});
