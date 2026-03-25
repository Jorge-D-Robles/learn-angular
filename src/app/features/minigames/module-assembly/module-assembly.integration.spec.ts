// ---------------------------------------------------------------------------
// Module Assembly Integration Tests
// ---------------------------------------------------------------------------
// Exercises the engine-shell-level-data pipeline using REAL level data
// (MODULE_ASSEMBLY_LEVELS[0] = ma-basic-01) and the REAL ConveyorBeltService.
// Catches data authoring bugs that unit tests with synthetic data would miss.
// ---------------------------------------------------------------------------

import { ModuleAssemblyEngine } from './module-assembly.engine';
import { ConveyorBeltService } from './conveyor-belt.service';
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
  return { engine, level };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Module Assembly Integration (real level data)', () => {
  // 1. initialize() loads blueprint and belt parts from real level data
  it('initialize() loads blueprint and belt parts from real level data', () => {
    const { engine, level } = createEngineWithService();
    engine.initialize(level);

    expect(engine.blueprint().name).toBe('EmergencyShelter');
    expect(engine.beltParts().length).toBe(3);
    expect(engine.beltSpeed()).toBe(40);
    expect(engine.filledSlots().size).toBe(0);
    expect(engine.status()).toBe(MinigameStatus.Loading);
  });

  // 2. correct placement of all 3 parts completes level with perfect score
  it('correct placement of all 3 parts completes level with perfect score', () => {
    const { engine, level } = createEngineWithService();
    engine.initialize(level);
    engine.start();

    engine.submitAction({ type: 'place-part', partId: 'b1-decorator', targetSlotId: 'slot-0' });
    engine.submitAction({ type: 'place-part', partId: 'b1-selector', targetSlotId: 'slot-1' });
    engine.submitAction({ type: 'place-part', partId: 'b1-template', targetSlotId: 'slot-2' });

    expect(engine.status()).toBe(MinigameStatus.Won);
    expect(engine.score()).toBe(300);
  });

  // 3. state transitions: Loading -> Playing -> Won
  it('transitions Loading -> Playing -> Won on correct completion', () => {
    const { engine, level } = createEngineWithService();

    engine.initialize(level);
    expect(engine.status()).toBe(MinigameStatus.Loading);

    engine.start();
    expect(engine.status()).toBe(MinigameStatus.Playing);

    engine.submitAction({ type: 'place-part', partId: 'b1-decorator', targetSlotId: 'slot-0' });
    engine.submitAction({ type: 'place-part', partId: 'b1-selector', targetSlotId: 'slot-1' });
    engine.submitAction({ type: 'place-part', partId: 'b1-template', targetSlotId: 'slot-2' });
    expect(engine.status()).toBe(MinigameStatus.Won);
  });

  // 4. produces data shape for LevelCompletionService
  it('produces the data shape needed by LevelCompletionService after winning', () => {
    const { engine, level } = createEngineWithService();
    engine.initialize(level);
    engine.start();

    engine.submitAction({ type: 'place-part', partId: 'b1-decorator', targetSlotId: 'slot-0' });
    engine.submitAction({ type: 'place-part', partId: 'b1-selector', targetSlotId: 'slot-1' });
    engine.submitAction({ type: 'place-part', partId: 'b1-template', targetSlotId: 'slot-2' });

    expect(engine.currentLevel()).toBe('ma-basic-01');
    expect(engine.status()).toBe(MinigameStatus.Won);
    expect(engine.score()).toBe(300);
  });

  // 5. wrong placement costs a life
  it('wrong placement costs a life, score unchanged', () => {
    const { engine, level } = createEngineWithService();
    engine.initialize(level);
    engine.start();

    engine.submitAction({ type: 'place-part', partId: 'b1-decorator', targetSlotId: 'slot-1' });

    expect(engine.lives()).toBe(2);
    expect(engine.score()).toBe(0);
  });

  // 6. 3 wrong placements cause loss
  it('3 wrong placements cause loss (Loading -> Playing -> Lost)', () => {
    const { engine, level } = createEngineWithService();
    engine.initialize(level);
    engine.start();
    expect(engine.status()).toBe(MinigameStatus.Playing);

    engine.submitAction({ type: 'place-part', partId: 'b1-decorator', targetSlotId: 'slot-1' });
    expect(engine.lives()).toBe(2);

    engine.submitAction({ type: 'place-part', partId: 'b1-decorator', targetSlotId: 'slot-1' });
    expect(engine.lives()).toBe(1);

    engine.submitAction({ type: 'place-part', partId: 'b1-decorator', targetSlotId: 'slot-1' });
    expect(engine.lives()).toBe(0);
    expect(engine.status()).toBe(MinigameStatus.Lost);
  });
});
