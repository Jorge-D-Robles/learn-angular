import { DifficultyTier } from '../../core/minigame/minigame.types';
import type { LevelDefinition } from '../../core/levels/level.types';
import {
  isSourceTargetCompatible,
  type SourcePort,
  type TargetPort,
  type WireConnection,
} from '../../features/minigames/wire-protocol/wire-protocol.types';
import {
  WIRE_PROTOCOL_LEVELS,
  WIRE_PROTOCOL_LEVEL_PACK,
  type ComponentContext,
  type WireProtocolLevelData,
} from './wire-protocol.data';

// --- Compile-time type checks ---

const _componentCtx: ComponentContext = {
  componentName: 'TestComp',
  description: 'test description',
};

const _levelData: WireProtocolLevelData = {
  components: [_componentCtx],
  sourcePorts: [] as SourcePort[],
  targetPorts: [] as TargetPort[],
  correctWires: [] as WireConnection[],
  preWiredConnections: [] as WireConnection[],
  maxVerifications: 3,
};

const _levelDef: LevelDefinition<WireProtocolLevelData> = {
  levelId: 'wp-basic-01',
  gameId: 'wire-protocol',
  tier: DifficultyTier.Basic,
  order: 1,
  title: 'Test',
  conceptIntroduced: 'Test concept',
  description: 'Test description',
  data: _levelData,
};

void [_componentCtx, _levelData, _levelDef];

// --- Runtime tests ---

describe('Level count and structure', () => {
  it('should have exactly 18 total levels', () => {
    expect(WIRE_PROTOCOL_LEVELS.length).toBe(18);
  });

  it('should have 6 Basic levels', () => {
    const basic = WIRE_PROTOCOL_LEVELS.filter(l => l.tier === DifficultyTier.Basic);
    expect(basic.length).toBe(6);
  });

  it('should have 6 Intermediate levels', () => {
    const intermediate = WIRE_PROTOCOL_LEVELS.filter(l => l.tier === DifficultyTier.Intermediate);
    expect(intermediate.length).toBe(6);
  });

  it('should have 5 Advanced levels', () => {
    const advanced = WIRE_PROTOCOL_LEVELS.filter(l => l.tier === DifficultyTier.Advanced);
    expect(advanced.length).toBe(5);
  });

  it('should have 1 Boss level', () => {
    const boss = WIRE_PROTOCOL_LEVELS.filter(l => l.tier === DifficultyTier.Boss);
    expect(boss.length).toBe(1);
  });

  it('should have all gameId fields set to wire-protocol', () => {
    for (const level of WIRE_PROTOCOL_LEVELS) {
      expect(level.gameId).toBe('wire-protocol');
    }
  });

  it('should have unique levelId for every level', () => {
    const ids = WIRE_PROTOCOL_LEVELS.map(l => l.levelId);
    expect(new Set(ids).size).toBe(18);
  });

  it('should have sequential order within each tier', () => {
    const basicOrders = WIRE_PROTOCOL_LEVELS
      .filter(l => l.tier === DifficultyTier.Basic)
      .map(l => l.order);
    expect(basicOrders).toEqual([1, 2, 3, 4, 5, 6]);

    const intermediateOrders = WIRE_PROTOCOL_LEVELS
      .filter(l => l.tier === DifficultyTier.Intermediate)
      .map(l => l.order);
    expect(intermediateOrders).toEqual([1, 2, 3, 4, 5, 6]);

    const advancedOrders = WIRE_PROTOCOL_LEVELS
      .filter(l => l.tier === DifficultyTier.Advanced)
      .map(l => l.order);
    expect(advancedOrders).toEqual([1, 2, 3, 4, 5]);

    const bossOrders = WIRE_PROTOCOL_LEVELS
      .filter(l => l.tier === DifficultyTier.Boss)
      .map(l => l.order);
    expect(bossOrders).toEqual([1]);
  });
});

describe('Required fields', () => {
  it('should have a non-empty title for every level', () => {
    for (const level of WIRE_PROTOCOL_LEVELS) {
      expect(level.title.length).toBeGreaterThan(0);
    }
  });

  it('should have a non-empty description for every level', () => {
    for (const level of WIRE_PROTOCOL_LEVELS) {
      expect(level.description.length).toBeGreaterThan(0);
    }
  });

  it('should have a non-empty conceptIntroduced for every level', () => {
    for (const level of WIRE_PROTOCOL_LEVELS) {
      expect(level.conceptIntroduced.length).toBeGreaterThan(0);
    }
  });

  it('should have at least 1 component context in every level', () => {
    for (const level of WIRE_PROTOCOL_LEVELS) {
      expect(level.data.components.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('should have at least 1 source port in every level', () => {
    for (const level of WIRE_PROTOCOL_LEVELS) {
      expect(level.data.sourcePorts.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('should have at least 1 target port in every level', () => {
    for (const level of WIRE_PROTOCOL_LEVELS) {
      expect(level.data.targetPorts.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('should have at least 1 correct wire in every level', () => {
    for (const level of WIRE_PROTOCOL_LEVELS) {
      expect(level.data.correctWires.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('should have maxVerifications = 3 for every level', () => {
    for (const level of WIRE_PROTOCOL_LEVELS) {
      expect(level.data.maxVerifications).toBe(3);
    }
  });
});

describe('Data integrity', () => {
  it('should have unique source port ids within each level', () => {
    for (const level of WIRE_PROTOCOL_LEVELS) {
      const ids = level.data.sourcePorts.map(p => p.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('should have unique target port ids within each level', () => {
    for (const level of WIRE_PROTOCOL_LEVELS) {
      const ids = level.data.targetPorts.map(p => p.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('should have unique wire ids within each level', () => {
    for (const level of WIRE_PROTOCOL_LEVELS) {
      const allWireIds = [
        ...level.data.correctWires.map(w => w.id),
        ...level.data.preWiredConnections.map(w => w.id),
      ];
      expect(new Set(allWireIds).size).toBe(allWireIds.length);
    }
  });

  it('should have every correctWire reference existing source and target port ids', () => {
    for (const level of WIRE_PROTOCOL_LEVELS) {
      const sourceIds = new Set(level.data.sourcePorts.map(p => p.id));
      const targetIds = new Set(level.data.targetPorts.map(p => p.id));
      for (const wire of level.data.correctWires) {
        expect(sourceIds.has(wire.sourcePortId)).toBe(true);
        expect(targetIds.has(wire.targetPortId)).toBe(true);
      }
    }
  });

  it('should have every preWiredConnection reference existing source and target port ids', () => {
    for (const level of WIRE_PROTOCOL_LEVELS) {
      const sourceIds = new Set(level.data.sourcePorts.map(p => p.id));
      const targetIds = new Set(level.data.targetPorts.map(p => p.id));
      for (const wire of level.data.preWiredConnections) {
        expect(sourceIds.has(wire.sourcePortId)).toBe(true);
        expect(targetIds.has(wire.targetPortId)).toBe(true);
      }
    }
  });

  it('should have wire types in correctWires compatible with source/target port types', () => {
    for (const level of WIRE_PROTOCOL_LEVELS) {
      const sourceMap = new Map<string, SourcePort>(
        level.data.sourcePorts.map(p => [p.id, p]),
      );
      const targetMap = new Map<string, TargetPort>(
        level.data.targetPorts.map(p => [p.id, p]),
      );
      for (const wire of level.data.correctWires) {
        const source = sourceMap.get(wire.sourcePortId)!;
        const target = targetMap.get(wire.targetPortId)!;
        const compatible = isSourceTargetCompatible(source, target, wire.wireType);
        expect(compatible).toBe(true);
      }
    }
  });

  it('should have every correct preWiredConnection match a correctWires entry and every incorrect one not match', () => {
    for (const level of WIRE_PROTOCOL_LEVELS) {
      const correctKeys = new Set(
        level.data.correctWires.map(w => `${w.sourcePortId}|${w.targetPortId}|${w.wireType}`),
      );
      for (const pw of level.data.preWiredConnections) {
        const key = `${pw.sourcePortId}|${pw.targetPortId}|${pw.wireType}`;
        if (pw.isCorrect) {
          expect(correctKeys.has(key)).toBe(true);
        } else {
          expect(correctKeys.has(key)).toBe(false);
        }
      }
    }
  });

  it('should have no duplicate source-target pairs in correctWires within a level', () => {
    for (const level of WIRE_PROTOCOL_LEVELS) {
      const pairs = level.data.correctWires.map(w => `${w.sourcePortId}|${w.targetPortId}`);
      expect(new Set(pairs).size).toBe(pairs.length);
    }
  });
});

describe('Specific level spot checks', () => {
  it('should have Boss level with 5 component contexts', () => {
    const boss = WIRE_PROTOCOL_LEVELS.find(l => l.tier === DifficultyTier.Boss)!;
    expect(boss.data.components.length).toBe(5);
  });

  it('should have Boss level with 22+ correct wires', () => {
    const boss = WIRE_PROTOCOL_LEVELS.find(l => l.tier === DifficultyTier.Boss)!;
    expect(boss.data.correctWires.length).toBeGreaterThanOrEqual(22);
  });

  it('should have Boss level with parTime set', () => {
    const boss = WIRE_PROTOCOL_LEVELS.find(l => l.tier === DifficultyTier.Boss)!;
    expect(boss.parTime).toBeDefined();
    expect(boss.parTime!).toBeGreaterThan(0);
  });

  it('should have Level 1 conceptIntroduced be Interpolation only', () => {
    const level1 = WIRE_PROTOCOL_LEVELS.find(l => l.levelId === 'wp-basic-01')!;
    expect(level1.conceptIntroduced).toBe('Interpolation only');
  });

  it('should have Boss level title be Array Overhaul', () => {
    const boss = WIRE_PROTOCOL_LEVELS.find(l => l.tier === DifficultyTier.Boss)!;
    expect(boss.title).toBe('Array Overhaul');
  });

  it('should have pre-wired connections in levels wp-intermediate-02, wp-intermediate-05, wp-advanced-05, and wp-boss-01', () => {
    const expectedIds = ['wp-intermediate-02', 'wp-intermediate-05', 'wp-advanced-05', 'wp-boss-01'];
    for (const id of expectedIds) {
      const level = WIRE_PROTOCOL_LEVELS.find(l => l.levelId === id)!;
      expect(level.data.preWiredConnections.length).toBeGreaterThan(0);
    }
  });

  it('should have at least 1 incorrectly pre-wired connection in levels with pre-wired connections', () => {
    const levelsWithPreWired = WIRE_PROTOCOL_LEVELS.filter(
      (l: LevelDefinition<WireProtocolLevelData>) => l.data.preWiredConnections.length > 0,
    );
    for (const level of levelsWithPreWired) {
      const hasIncorrect = level.data.preWiredConnections.some(
        (pw: WireConnection) => pw.isCorrect === false,
      );
      expect(hasIncorrect).toBe(true);
    }
  });
});

describe('Level ID format', () => {
  it('should have all levelIds match pattern wp-(basic|intermediate|advanced|boss)-NN', () => {
    const pattern = /^wp-(basic|intermediate|advanced|boss)-\d{2}$/;
    for (const level of WIRE_PROTOCOL_LEVELS) {
      expect(level.levelId).toMatch(pattern);
    }
  });
});

describe('LevelPack', () => {
  it('should have gameId wire-protocol', () => {
    expect(WIRE_PROTOCOL_LEVEL_PACK.gameId).toBe('wire-protocol');
  });

  it('should have levels equal to WIRE_PROTOCOL_LEVELS', () => {
    expect(WIRE_PROTOCOL_LEVEL_PACK.levels).toBe(WIRE_PROTOCOL_LEVELS);
  });
});
