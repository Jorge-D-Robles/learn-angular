// ---------------------------------------------------------------------------
// Integration test: FlowCommanderSimulationService + FlowCommanderEngine
// coordinated lifecycle
// ---------------------------------------------------------------------------
// Verifies that the engine delegates simulation to the service and that both
// maintain consistent state throughout the lifecycle: initialize, place gates,
// simulate, complete/fail, and reset.
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
  return { engine, service, level };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('FlowCommanderSimulationService + Engine coordinated lifecycle', () => {
  // 1. engine.initialize() loads pipeline into simulation service
  it('engine.initialize() loads pipeline into simulation service', () => {
    const { engine, service, level } = createEngineWithService(0);

    engine.initialize(level);

    // Engine signals populated
    expect(engine.pipelineGraph().nodes.length).toBe(4);
    expect(engine.cargoItems().length).toBe(4);
    expect(engine.targetZones().length).toBe(2);

    // Simulation service can simulate (it was loaded)
    const simResult = service.simulate();
    expect(simResult.itemResults.length).toBeGreaterThan(0);
  });

  // 2. placeGate action delegates to simulation service and updates engine state
  it('placeGate action delegates to simulation service and updates engine state', () => {
    const { engine, level } = createEngineWithService(0);
    engine.initialize(level);
    engine.start();

    engine.submitAction({
      type: 'place-gate',
      nodeId: 'fc-basic-01-gate1',
      gateType: 'if',
      condition: "item.priority === 'high'",
    });

    expect(engine.placedGates().size).toBe(1);
    expect(engine.placedGates().get('fc-basic-01-gate1')).toBeDefined();
  });

  // 3. simulate action runs cargo through pipeline and evaluates correctness
  it('simulate action runs cargo through pipeline via service and evaluates correctness', () => {
    const { engine, level } = createEngineWithService(0);
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
    expect(result!.itemResults.length).toBe(4);
    expect(result!.allCorrect).toBe(true);
    expect(result!.correctCount).toBe(4);
  });

  // 4. all cargo reaching correct targets triggers engine completion
  it('all cargo reaching correct targets triggers engine completion', () => {
    const { engine, level } = createEngineWithService(0);
    engine.initialize(level);
    engine.start();

    engine.submitAction({
      type: 'place-gate',
      nodeId: 'fc-basic-01-gate1',
      gateType: 'if',
      condition: "item.priority === 'high'",
    });

    engine.simulate();

    expect(engine.status()).toBe(MinigameStatus.Won);
    expect(engine.score()).toBeGreaterThan(0);
  });

  // 5. cargo reaching wrong targets deducts lives (keeps playing)
  it('cargo reaching wrong targets keeps engine in Playing state', () => {
    const { engine, level } = createEngineWithService(0);
    engine.initialize(level);
    engine.start();

    // Place gate with inverted condition
    engine.submitAction({
      type: 'place-gate',
      nodeId: 'fc-basic-01-gate1',
      gateType: 'if',
      condition: "item.priority === 'low'",
    });

    const result = engine.simulate();

    expect(result).not.toBeNull();
    expect(result!.allCorrect).toBe(false);
    expect(result!.incorrectCount).toBeGreaterThan(0);
    expect(engine.status()).toBe(MinigameStatus.Playing);
  });

  // 6. engine.reset() resets simulation service state
  it('engine.reset() resets simulation service state', () => {
    const { engine, service, level } = createEngineWithService(0);
    engine.initialize(level);
    engine.start();

    engine.submitAction({
      type: 'place-gate',
      nodeId: 'fc-basic-01-gate1',
      gateType: 'if',
      condition: "item.priority === 'high'",
    });
    engine.simulate();
    expect(engine.status()).toBe(MinigameStatus.Won);

    engine.reset();

    expect(engine.status()).toBe(MinigameStatus.Playing);
    expect(engine.score()).toBe(0);
    expect(engine.placedGates().size).toBe(0);

    // Service was reloaded -- simulate produces passthrough results (no gates)
    const simResult = service.simulate();
    expect(simResult.itemResults.length).toBeGreaterThan(0);
  });
});
