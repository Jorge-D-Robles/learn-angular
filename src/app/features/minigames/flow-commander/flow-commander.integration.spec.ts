// ---------------------------------------------------------------------------
// Flow Commander Integration Tests
// ---------------------------------------------------------------------------
// Exercises the engine-shell-level-data pipeline using REAL level data
// (FLOW_COMMANDER_LEVELS[0] = fc-basic-01) and the REAL
// FlowCommanderSimulationService. Catches data authoring bugs that unit
// tests with synthetic data would miss.
// ---------------------------------------------------------------------------

import { FlowCommanderEngine } from './flow-commander.engine';
import { FlowCommanderSimulationService } from './flow-commander-simulation.service';
import { FLOW_COMMANDER_LEVELS } from '../../../data/levels/flow-commander.data';
import { MinigameStatus, type MinigameLevel } from '../../../core/minigame/minigame.types';
import type { LevelDefinition } from '../../../core/levels/level.types';
import type { FlowCommanderLevelData } from './pipeline.types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toMinigameLevel(
  def: LevelDefinition<FlowCommanderLevelData>,
): MinigameLevel<FlowCommanderLevelData> {
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
  const service = new FlowCommanderSimulationService();
  const engine = new FlowCommanderEngine(undefined, service);
  const level = toMinigameLevel(FLOW_COMMANDER_LEVELS[levelIndex]);
  return { engine, level };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Flow Commander Integration (real level data)', () => {
  // 1. initialize() loads graph, cargo, and target zones from real level data
  it('initialize() loads graph, cargo, and target zones from real level data', () => {
    const { engine, level } = createEngineWithService();
    engine.initialize(level);

    expect(engine.pipelineGraph().nodes.length).toBe(4);
    expect(engine.cargoItems().length).toBe(4);
    expect(engine.targetZones().length).toBe(2);
    expect(engine.availableGateTypes()).toContain('if');
    expect(engine.placedGates().size).toBe(0);
  });

  // 2. place @if gate and simulate routes all items correctly with perfect score
  it('place @if gate and simulate routes all items correctly with perfect score', () => {
    const { engine, level } = createEngineWithService();
    engine.initialize(level);
    engine.start();

    engine.submitAction({
      type: 'place-gate',
      nodeId: 'fc-basic-01-gate1',
      gateType: 'if',
      condition: "item.priority === 'high'",
    });

    const result = engine.simulate();

    expect(result).not.toBeNull();
    expect(result!.allCorrect).toBe(true);
    expect(engine.status()).toBe(MinigameStatus.Won);
    // 1000 * 1.0 * 0.95 * 1.0 = 950
    expect(engine.score()).toBe(950);
  });

  // 3. state transitions: Loading -> Playing -> Won
  it('transitions Loading -> Playing -> Won on correct completion', () => {
    const { engine, level } = createEngineWithService();

    engine.initialize(level);
    expect(engine.status()).toBe(MinigameStatus.Loading);

    engine.start();
    expect(engine.status()).toBe(MinigameStatus.Playing);

    engine.submitAction({
      type: 'place-gate',
      nodeId: 'fc-basic-01-gate1',
      gateType: 'if',
      condition: "item.priority === 'high'",
    });
    engine.simulate();

    expect(engine.status()).toBe(MinigameStatus.Won);
  });

  // 4. produces data shape for LevelCompletionService
  it('produces the data shape needed by LevelCompletionService after winning', () => {
    const { engine, level } = createEngineWithService();
    engine.initialize(level);
    engine.start();

    engine.submitAction({
      type: 'place-gate',
      nodeId: 'fc-basic-01-gate1',
      gateType: 'if',
      condition: "item.priority === 'high'",
    });
    engine.simulate();

    expect(engine.currentLevel()).toBe('fc-basic-01');
    expect(engine.status()).toBe(MinigameStatus.Won);
    expect(engine.score()).toBe(950);
  });

  // 5. simulation without gates routes items to ALL outputs (passthrough = dual-route)
  it('simulation without gates produces dual-route passthrough (8 results, not all correct)', () => {
    const { engine, level } = createEngineWithService();
    engine.initialize(level);
    engine.start();

    const result = engine.simulate();

    expect(result).not.toBeNull();
    // Each of 4 items passes through gate-slot to BOTH target zones = 8 results
    expect(result!.itemResults.length).toBe(8);
    // z1 (High Priority Bay, expectedPriority:'high'): 2 high correct + 2 low incorrect = 4 results
    // z2 (Reject Bin, no criteria): all 4 correct
    // Total: 6 correct, 2 incorrect
    expect(result!.correctCount).toBe(6);
    expect(result!.incorrectCount).toBe(2);
    expect(result!.allCorrect).toBe(false);
    expect(engine.status()).toBe(MinigameStatus.Playing);
  });

  // 6. second simulation penalty with wrong condition then correct condition
  it('second simulation penalty: wrong condition then correct condition', () => {
    const { engine, level } = createEngineWithService();
    engine.initialize(level);
    engine.start();

    // First: place gate with WRONG condition
    engine.submitAction({
      type: 'place-gate',
      nodeId: 'fc-basic-01-gate1',
      gateType: 'if',
      condition: "item.priority === 'low'",
    });
    const first = engine.simulate();
    expect(first!.allCorrect).toBe(false);
    expect(engine.status()).toBe(MinigameStatus.Playing);

    // Reconfigure gate with correct condition
    engine.submitAction({
      type: 'configure-gate',
      nodeId: 'fc-basic-01-gate1',
      condition: "item.priority === 'high'",
    });
    const second = engine.simulate();
    expect(second!.allCorrect).toBe(true);
    expect(engine.status()).toBe(MinigameStatus.Won);

    // simCount=2, efficiencyMultiplier=0.95, simulationPenalty=0.9
    // Score: round(1000 * 1.0 * 0.95 * 0.9) = 855
    expect(engine.score()).toBe(855);
  });
});
