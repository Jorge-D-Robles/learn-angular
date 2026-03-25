// ---------------------------------------------------------------------------
// ConveyorBelt + Engine Integration Tests (real level data)
// ---------------------------------------------------------------------------
// Verifies the coordinated lifecycle between ConveyorBeltService and
// ModuleAssemblyEngine using REAL level data. Each test asserts on BOTH
// engine signals AND ConveyorBeltService signals — the distinguishing
// characteristic of this spec versus the existing unit/integration tests.
// ---------------------------------------------------------------------------

import { ModuleAssemblyEngine, DECOY_BONUS_SCORE } from './module-assembly.engine';
import { ConveyorBeltService, DEFAULT_BELT_LENGTH, PART_SPACING } from './conveyor-belt.service';
import { MODULE_ASSEMBLY_LEVELS } from '../../../data/levels/module-assembly.data';
import { MinigameStatus, type MinigameLevel } from '../../../core/minigame/minigame.types';
import type { LevelDefinition } from '../../../core/levels/level.types';
import type { ModuleAssemblyLevelData } from './module-assembly.types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toMinigameLevel(
  def: LevelDefinition<ModuleAssemblyLevelData>,
): MinigameLevel<ModuleAssemblyLevelData> {
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
  const service = new ConveyorBeltService();
  const engine = new ModuleAssemblyEngine(undefined, service);
  const level = toMinigameLevel(MODULE_ASSEMBLY_LEVELS[levelIndex]);
  return { engine, service, level };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ConveyorBelt + Engine Integration (real level data)', () => {
  // 1. engine.initialize() populates ConveyorBeltService with level parts
  it('initialize() populates ConveyorBeltService with level 1 parts at staggered positions', () => {
    const { engine, service, level } = createEngineWithService(0);
    engine.initialize(level);

    // Engine signals
    expect(engine.beltParts().length).toBe(3);
    expect(engine.beltSpeed()).toBe(40);
    expect(engine.status()).toBe(MinigameStatus.Loading);

    // Service signals
    expect(service.parts().length).toBe(3);
    expect(service.beltSpeed()).toBe(40);
    expect(service.isExhausted()).toBe(false);

    // Service parts have staggered positions
    expect(service.parts()[0].x).toBe(DEFAULT_BELT_LENGTH);
    expect(service.parts()[1].x).toBe(DEFAULT_BELT_LENGTH + PART_SPACING);
    expect(service.parts()[2].x).toBe(DEFAULT_BELT_LENGTH + 2 * PART_SPACING);

    // Service part IDs match engine part IDs
    expect(service.parts()[0].part.id).toBe(engine.beltParts()[0].id);
    expect(service.parts()[1].part.id).toBe(engine.beltParts()[1].id);
    expect(service.parts()[2].part.id).toBe(engine.beltParts()[2].id);
  });

  // 2. belt tick advances part positions; parts reaching end trigger missed-part penalty
  it('tick advances service part positions; exhaustion triggers loss', () => {
    const { engine, service, level } = createEngineWithService(0);
    engine.initialize(level);
    engine.start();

    // Record initial positions
    const initialPositions = service.parts().map((bp) => bp.x);

    // Tick 1 second: at 40 px/s = 40px displacement
    engine.tick(1.0);

    service.parts().forEach((bp, i) => {
      expect(bp.x).toBe(initialPositions[i] - 40);
    });
    expect(engine.status()).toBe(MinigameStatus.Playing);

    // Tick enough to scroll all parts off-screen.
    // Last part starts at DEFAULT_BELT_LENGTH + 2 * PART_SPACING = 800 + 240 = 1040.
    // After the 1s tick above, it's at 1000. At 40 px/s, need 1000/40 = 25s plus a bit.
    engine.tick(26);

    expect(service.isExhausted()).toBe(true);
    expect(engine.status()).toBe(MinigameStatus.Lost);
  });

  // 3. placing a part via engine removes it from ConveyorBeltService
  it('placing a part removes it from both engine and service', () => {
    const { engine, service, level } = createEngineWithService(0);
    engine.initialize(level);
    engine.start();

    engine.submitAction({ type: 'place-part', partId: 'b1-decorator', targetSlotId: 'slot-0' });

    // Engine signals
    expect(engine.beltParts().length).toBe(2);
    expect(engine.beltParts().find((p) => p.id === 'b1-decorator')).toBeUndefined();

    // Service signals
    expect(service.parts().length).toBe(2);
    expect(service.parts().find((bp) => bp.part.id === 'b1-decorator')).toBeUndefined();
    expect(service.isExhausted()).toBe(false);
  });

  // 4. rejecting a decoy via engine removes it from ConveyorBeltService
  it('rejecting a decoy removes it from both engine and service (level 2)', () => {
    const { engine, service, level } = createEngineWithService(1);
    engine.initialize(level);
    engine.start();

    const initialPartCount = service.parts().length;
    expect(initialPartCount).toBe(5); // 4 valid + 1 decoy

    engine.submitAction({ type: 'reject-decoy', partId: 'b2-decoy-url' });

    // Engine signals
    expect(engine.beltParts().find((p) => p.id === 'b2-decoy-url')).toBeUndefined();
    expect(engine.score()).toBe(DECOY_BONUS_SCORE);

    // Service signals
    expect(service.parts().find((bp) => bp.part.id === 'b2-decoy-url')).toBeUndefined();
    expect(service.parts().length).toBe(initialPartCount - 1);
  });

  // 5. ConveyorBeltService.isExhausted() triggers engine level evaluation
  it('exhaustion after partial placement triggers loss for unfilled slots', () => {
    const { engine, service, level } = createEngineWithService(0);
    engine.initialize(level);
    engine.start();

    // Place 2 of 3 parts correctly (slot-0 and slot-1 filled, slot-2 unfilled)
    engine.submitAction({ type: 'place-part', partId: 'b1-decorator', targetSlotId: 'slot-0' });
    engine.submitAction({ type: 'place-part', partId: 'b1-selector', targetSlotId: 'slot-1' });

    expect(engine.status()).toBe(MinigameStatus.Playing);
    expect(service.parts().length).toBe(1);

    // The remaining part (b1-template) is at its original staggered position:
    // DEFAULT_BELT_LENGTH + 2 * PART_SPACING = 800 + 240 = 1040.
    // At speed 40, need 1040/40 = 26s plus a bit to scroll it off.
    engine.tick(27);

    expect(service.isExhausted()).toBe(true);
    expect(engine.status()).toBe(MinigameStatus.Lost);
  });

  // 6. engine.reset() resets ConveyorBeltService to initial state
  it('reset() restores both engine and service to initial state', () => {
    const { engine, service, level } = createEngineWithService(0);
    engine.initialize(level);
    engine.start();

    // Mutate state: place one part and tick to move positions
    engine.submitAction({ type: 'place-part', partId: 'b1-decorator', targetSlotId: 'slot-0' });
    engine.tick(2.0);

    // Verify state is modified
    expect(service.parts().length).toBe(2);
    expect(engine.score()).toBe(100);

    // Reset
    engine.reset();

    // Engine signals restored
    expect(engine.beltParts().length).toBe(3);
    expect(engine.status()).toBe(MinigameStatus.Playing);
    expect(engine.score()).toBe(0);

    // Service signals restored
    expect(service.parts().length).toBe(3);
    expect(service.beltSpeed()).toBe(40);
    expect(service.isExhausted()).toBe(false);

    // Staggered positions restored
    expect(service.parts()[0].x).toBe(DEFAULT_BELT_LENGTH);
    expect(service.parts()[1].x).toBe(DEFAULT_BELT_LENGTH + PART_SPACING);
    expect(service.parts()[2].x).toBe(DEFAULT_BELT_LENGTH + 2 * PART_SPACING);

    // Part IDs match original level data
    const partIds = service.parts().map((bp) => bp.part.id);
    expect(partIds).toEqual(['b1-decorator', 'b1-selector', 'b1-template']);
  });

  // 7 (bonus). full lifecycle — place all parts correctly, both agree on win
  it('placing all parts correctly results in Won status with empty service belt', () => {
    const { engine, service, level } = createEngineWithService(0);
    engine.initialize(level);
    engine.start();

    engine.submitAction({ type: 'place-part', partId: 'b1-decorator', targetSlotId: 'slot-0' });
    engine.submitAction({ type: 'place-part', partId: 'b1-selector', targetSlotId: 'slot-1' });
    engine.submitAction({ type: 'place-part', partId: 'b1-template', targetSlotId: 'slot-2' });

    // Engine signals
    expect(engine.status()).toBe(MinigameStatus.Won);
    expect(engine.score()).toBe(300);

    // Service signals: all parts removed by player placement, not exhausted
    expect(service.parts().length).toBe(0);
    expect(service.isExhausted()).toBe(false);
  });
});
