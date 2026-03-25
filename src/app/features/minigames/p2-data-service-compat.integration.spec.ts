import { MODULE_ASSEMBLY_LEVELS } from '../../data/levels/module-assembly.data';
import { WIRE_PROTOCOL_LEVELS } from '../../data/levels/wire-protocol.data';
import { FLOW_COMMANDER_LEVELS } from '../../data/levels/flow-commander.data';
import { SIGNAL_CORPS_LEVELS } from '../../data/levels/signal-corps.data';
import { ConveyorBeltService } from './module-assembly/conveyor-belt.service';
import { WireProtocolValidationService } from './wire-protocol/wire-protocol-validation.service';
import { FlowCommanderSimulationService } from './flow-commander/flow-commander-simulation.service';
import { SignalCorpsWaveService, DEFAULT_SIGNAL_SPEED, DEFAULT_SPAWN_INTERVAL_MS, DEFAULT_INITIAL_HEALTH } from './signal-corps/signal-corps-wave.service';
import type { WireProtocolLevelData } from '../../data/levels/wire-protocol.data';
import type { FlowCommanderLevelData } from './flow-commander/pipeline.types';
import type { SignalCorpsLevelData } from './signal-corps/signal-corps.types';

describe('P2 data-service compatibility', () => {
  it('Module Assembly: loads all 18 levels into ConveyorBeltService', () => {
    const service = new ConveyorBeltService();
    for (const level of MODULE_ASSEMBLY_LEVELS) {
      expect(() => service.reset(level.data.parts, level.data.beltSpeed)).not.toThrow();
      expect(service.parts().length).toBe(level.data.parts.length);
    }
  });

  it('Wire Protocol: validates correct wires for all 18 levels', () => {
    const service = new WireProtocolValidationService();
    for (const level of WIRE_PROTOCOL_LEVELS) {
      const data = level.data as WireProtocolLevelData;
      const sourceMap = new Map(data.sourcePorts.map(p => [p.id, p]));
      const targetMap = new Map(data.targetPorts.map(p => [p.id, p]));
      for (const wire of data.correctWires) {
        expect(service.validateWire(wire, sourceMap, targetMap).valid).toBe(true);
      }
    }
  });

  it('Flow Commander: loads all 18 levels into simulation service', () => {
    const service = new FlowCommanderSimulationService();
    for (const level of FLOW_COMMANDER_LEVELS) {
      const data = level.data as FlowCommanderLevelData;
      expect(() => service.loadPipeline(data.graph, data.cargoItems, data.targetZones)).not.toThrow();
      service.reset();
    }
  });

  it('Signal Corps: loads all 18 levels into wave service', () => {
    const service = new SignalCorpsWaveService();
    for (const level of SIGNAL_CORPS_LEVELS) {
      const data = level.data as SignalCorpsLevelData;
      expect(() => service.loadWaves(
        [...data.noiseWaves],
        { signalSpeed: DEFAULT_SIGNAL_SPEED, spawnIntervalMs: DEFAULT_SPAWN_INTERVAL_MS },
        data.stationHealth ?? DEFAULT_INITIAL_HEALTH,
      )).not.toThrow();
      service.reset();
    }
  });
});
