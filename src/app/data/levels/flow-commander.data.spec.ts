import { DifficultyTier } from '../../core/minigame/minigame.types';
import type { LevelDefinition } from '../../core/levels/level.types';
import type {
  FlowCommanderLevelData,
  PipelineNode,
} from '../../features/minigames/flow-commander/pipeline.types';
import {
  FLOW_COMMANDER_LEVELS,
  FLOW_COMMANDER_LEVEL_PACK,
} from './flow-commander.data';

// --- Compile-time type checks ---

const _levelData: FlowCommanderLevelData = {
  graph: { nodes: [], edges: [] },
  cargoItems: [],
  availableGateTypes: [],
  targetZones: [],
};

const _levelDef: LevelDefinition<FlowCommanderLevelData> = {
  levelId: 'fc-basic-01',
  gameId: 'flow-commander',
  tier: DifficultyTier.Basic,
  order: 1,
  title: 'Test',
  conceptIntroduced: 'Test concept',
  description: 'Test description',
  data: _levelData,
};

void [_levelData, _levelDef];

// --- Runtime tests ---

describe('Level count and structure', () => {
  it('should have exactly 18 total levels', () => {
    expect(FLOW_COMMANDER_LEVELS.length).toBe(18);
  });

  it('should have 6 Basic levels', () => {
    const basic = FLOW_COMMANDER_LEVELS.filter(l => l.tier === DifficultyTier.Basic);
    expect(basic.length).toBe(6);
  });

  it('should have 6 Intermediate levels', () => {
    const intermediate = FLOW_COMMANDER_LEVELS.filter(l => l.tier === DifficultyTier.Intermediate);
    expect(intermediate.length).toBe(6);
  });

  it('should have 5 Advanced levels', () => {
    const advanced = FLOW_COMMANDER_LEVELS.filter(l => l.tier === DifficultyTier.Advanced);
    expect(advanced.length).toBe(5);
  });

  it('should have 1 Boss level', () => {
    const boss = FLOW_COMMANDER_LEVELS.filter(l => l.tier === DifficultyTier.Boss);
    expect(boss.length).toBe(1);
  });

  it('should have all gameId fields set to flow-commander', () => {
    for (const level of FLOW_COMMANDER_LEVELS) {
      expect(level.gameId).toBe('flow-commander');
    }
  });

  it('should have unique levelId for every level', () => {
    const ids = FLOW_COMMANDER_LEVELS.map(l => l.levelId);
    expect(new Set(ids).size).toBe(18);
  });

  it('should have sequential order within each tier', () => {
    const basicOrders = FLOW_COMMANDER_LEVELS
      .filter(l => l.tier === DifficultyTier.Basic)
      .map(l => l.order);
    expect(basicOrders).toEqual([1, 2, 3, 4, 5, 6]);

    const intermediateOrders = FLOW_COMMANDER_LEVELS
      .filter(l => l.tier === DifficultyTier.Intermediate)
      .map(l => l.order);
    expect(intermediateOrders).toEqual([1, 2, 3, 4, 5, 6]);

    const advancedOrders = FLOW_COMMANDER_LEVELS
      .filter(l => l.tier === DifficultyTier.Advanced)
      .map(l => l.order);
    expect(advancedOrders).toEqual([1, 2, 3, 4, 5]);

    const bossOrders = FLOW_COMMANDER_LEVELS
      .filter(l => l.tier === DifficultyTier.Boss)
      .map(l => l.order);
    expect(bossOrders).toEqual([1]);
  });
});

describe('Required fields', () => {
  it('should have a non-empty title for every level', () => {
    for (const level of FLOW_COMMANDER_LEVELS) {
      expect(level.title.length).toBeGreaterThan(0);
    }
  });

  it('should have a non-empty description for every level', () => {
    for (const level of FLOW_COMMANDER_LEVELS) {
      expect(level.description.length).toBeGreaterThan(0);
    }
  });

  it('should have a non-empty conceptIntroduced for every level', () => {
    for (const level of FLOW_COMMANDER_LEVELS) {
      expect(level.conceptIntroduced.length).toBeGreaterThan(0);
    }
  });

  it('should have at least 1 cargo item in every level except Level 6', () => {
    for (const level of FLOW_COMMANDER_LEVELS) {
      if (level.levelId === 'fc-basic-06') {
        expect(level.data.cargoItems.length).toBe(0);
      } else {
        expect(level.data.cargoItems.length).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it('should have at least 1 target zone in every level', () => {
    for (const level of FLOW_COMMANDER_LEVELS) {
      expect(level.data.targetZones.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('should have at least 1 available gate type in every level', () => {
    for (const level of FLOW_COMMANDER_LEVELS) {
      expect(level.data.availableGateTypes.length).toBeGreaterThanOrEqual(1);
    }
  });
});

describe('Data integrity — Pipeline graph', () => {
  it('should have unique node ids within each level', () => {
    for (const level of FLOW_COMMANDER_LEVELS) {
      const ids = level.data.graph.nodes.map(n => n.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('should have unique edge ids within each level', () => {
    for (const level of FLOW_COMMANDER_LEVELS) {
      const ids = level.data.graph.edges.map(e => e.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('should have all edges reference existing node ids', () => {
    for (const level of FLOW_COMMANDER_LEVELS) {
      const nodeIds = new Set(level.data.graph.nodes.map(n => n.id));
      for (const edge of level.data.graph.edges) {
        expect(nodeIds.has(edge.sourceNodeId)).toBe(true);
        expect(nodeIds.has(edge.targetNodeId)).toBe(true);
      }
    }
  });

  it('should have at least 1 source node in every level', () => {
    for (const level of FLOW_COMMANDER_LEVELS) {
      const sources = level.data.graph.nodes.filter((n: PipelineNode) => n.nodeType === 'source');
      expect(sources.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('should have at least 1 target-zone node in every level', () => {
    for (const level of FLOW_COMMANDER_LEVELS) {
      const targets = level.data.graph.nodes.filter((n: PipelineNode) => n.nodeType === 'target-zone');
      expect(targets.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('should have at least 1 gate-slot node in every level', () => {
    for (const level of FLOW_COMMANDER_LEVELS) {
      const gateSlots = level.data.graph.nodes.filter((n: PipelineNode) => n.nodeType === 'gate-slot');
      expect(gateSlots.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('should have every target zone nodeId reference an existing target-zone node', () => {
    for (const level of FLOW_COMMANDER_LEVELS) {
      const targetZoneNodeIds = new Set(
        level.data.graph.nodes
          .filter((n: PipelineNode) => n.nodeType === 'target-zone')
          .map(n => n.id),
      );
      for (const zone of level.data.targetZones) {
        expect(targetZoneNodeIds.has(zone.nodeId)).toBe(true);
      }
    }
  });
});

describe('Data integrity — Cargo items', () => {
  it('should have unique cargo item ids within each level', () => {
    for (const level of FLOW_COMMANDER_LEVELS) {
      const ids = level.data.cargoItems.map(c => c.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });
});

describe('Specific level spot checks', () => {
  it('should have Boss level with 50+ cargo items', () => {
    const boss = FLOW_COMMANDER_LEVELS.find(l => l.tier === DifficultyTier.Boss)!;
    expect(boss.data.cargoItems.length).toBeGreaterThanOrEqual(50);
  });

  it('should have Boss level with parTime set to 90', () => {
    const boss = FLOW_COMMANDER_LEVELS.find(l => l.tier === DifficultyTier.Boss)!;
    expect(boss.parTime).toBe(90);
  });

  it('should have Boss level title be Emergency Cargo Sort', () => {
    const boss = FLOW_COMMANDER_LEVELS.find(l => l.tier === DifficultyTier.Boss)!;
    expect(boss.title).toBe('Emergency Cargo Sort');
  });

  it('should have Level 1 conceptIntroduced be @if (simple)', () => {
    const level1 = FLOW_COMMANDER_LEVELS.find(l => l.levelId === 'fc-basic-01')!;
    expect(level1.conceptIntroduced).toBe('@if (simple)');
  });

  it('should have Level 6 conceptIntroduced be @empty', () => {
    const level6 = FLOW_COMMANDER_LEVELS.find(l => l.levelId === 'fc-basic-06')!;
    expect(level6.conceptIntroduced).toBe('@empty');
  });

  it('should have Level 18 with 8 target zones', () => {
    const boss = FLOW_COMMANDER_LEVELS.find(l => l.tier === DifficultyTier.Boss)!;
    expect(boss.data.targetZones.length).toBe(8);
  });

  it('should have Level 18 with 8 types of cargo', () => {
    const boss = FLOW_COMMANDER_LEVELS.find(l => l.tier === DifficultyTier.Boss)!;
    const types = new Set(boss.data.cargoItems.map(c => c.type));
    expect(types.size).toBe(8);
  });
});

describe('Level ID format', () => {
  it('should have all levelIds match pattern fc-(basic|intermediate|advanced|boss)-NN', () => {
    const pattern = /^fc-(basic|intermediate|advanced|boss)-\d{2}$/;
    for (const level of FLOW_COMMANDER_LEVELS) {
      expect(level.levelId).toMatch(pattern);
    }
  });
});

describe('LevelPack', () => {
  it('should have gameId flow-commander', () => {
    expect(FLOW_COMMANDER_LEVEL_PACK.gameId).toBe('flow-commander');
  });

  it('should have levels equal to FLOW_COMMANDER_LEVELS', () => {
    expect(FLOW_COMMANDER_LEVEL_PACK.levels).toBe(FLOW_COMMANDER_LEVELS);
  });
});
