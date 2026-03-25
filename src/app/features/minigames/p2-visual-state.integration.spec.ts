import { ModuleAssemblyEngine } from './module-assembly/module-assembly.engine';
import { ConveyorBeltService } from './module-assembly/conveyor-belt.service';
import { MODULE_ASSEMBLY_LEVELS } from '../../data/levels/module-assembly.data';
import type { MinigameLevel } from '../../core/minigame/minigame.types';
import type { LevelDefinition } from '../../core/levels/level.types';
import type { ModuleAssemblyLevelData } from './module-assembly/module-assembly.types';
import { FlowCommanderSimulationService } from './flow-commander/flow-commander-simulation.service';
import { FLOW_COMMANDER_LEVELS } from '../../data/levels/flow-commander.data';
import type { FlowCommanderLevelData } from './flow-commander/pipeline.types';
import { SignalCorpsWaveService, DEFAULT_SIGNAL_SPEED, DEFAULT_SPAWN_INTERVAL_MS, DEFAULT_INITIAL_HEALTH } from './signal-corps/signal-corps-wave.service';
import { SIGNAL_CORPS_LEVELS } from '../../data/levels/signal-corps.data';
import type { SignalCorpsLevelData } from './signal-corps/signal-corps.types';

function toMinigameLevel<T>(def: LevelDefinition<T>): MinigameLevel<T> {
  return { id: def.levelId, gameId: def.gameId, tier: def.tier, conceptIntroduced: def.conceptIntroduced, description: def.description, data: def.data };
}

describe('P2 visual state integration', () => {
  it('Module Assembly: belt positions update after tick', () => {
    const service = new ConveyorBeltService();
    const engine = new ModuleAssemblyEngine(undefined, service);
    engine.initialize(toMinigameLevel(MODULE_ASSEMBLY_LEVELS[0]));
    engine.start();
    const initialX = service.parts()[0].x;
    engine.tick(1.0);
    expect(service.parts()[0].x).toBeLessThan(initialX);
  });

  it('Flow Commander: gate state updates after placeGate', () => {
    const service = new FlowCommanderSimulationService();
    const data = FLOW_COMMANDER_LEVELS[0].data as FlowCommanderLevelData;
    service.loadPipeline(data.graph, data.cargoItems, data.targetZones);
    expect(service.getGateState()().size).toBe(0);
    const gateSlots = data.graph.nodes.filter(n => n.nodeType === 'gate-slot');
    if (gateSlots.length > 0 && data.availableGateTypes.length > 0) {
      service.placeGate(gateSlots[0].id, data.availableGateTypes[0], 'true');
      expect(service.getGateState()().size).toBe(1);
    }
  });

  it('Signal Corps: spawns signals after wave start', () => {
    const service = new SignalCorpsWaveService();
    const data = SIGNAL_CORPS_LEVELS[0].data as SignalCorpsLevelData;
    service.loadWaves([...data.noiseWaves], { signalSpeed: DEFAULT_SIGNAL_SPEED, spawnIntervalMs: DEFAULT_SPAWN_INTERVAL_MS }, data.stationHealth ?? DEFAULT_INITIAL_HEALTH);
    service.startWave(0);
    service.tick(DEFAULT_SPAWN_INTERVAL_MS + 1);
    expect(service.activeSignals().length).toBeGreaterThan(0);
  });
});
