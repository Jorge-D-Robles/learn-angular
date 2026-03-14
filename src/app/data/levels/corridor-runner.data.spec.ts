import { DifficultyTier } from '../../core/minigame/minigame.types';
import type { LevelDefinition } from '../../core/levels/level.types';
import type {
  CorridorRunnerLevelData,
  MapNode,
  MapEdge,
  MapLayout,
  RouteEntry,
  TestNavigation,
  TargetDestination,
} from '../../features/minigames/corridor-runner/corridor-runner.types';
import {
  CORRIDOR_RUNNER_LEVELS,
  CORRIDOR_RUNNER_LEVEL_PACK,
} from './corridor-runner.data';

// --- Compile-time type checks ---

const _node: MapNode = { id: 'n', label: 'N', position: { x: 0, y: 0 } };
const _edge: MapEdge = { id: 'e', sourceNodeId: 'n1', targetNodeId: 'n2' };
const _layout: MapLayout = { nodes: [_node], edges: [_edge] };
const _route: RouteEntry = { path: 'test', component: 'TestComponent' };
const _testNav: TestNavigation = { url: '/test', expectedDestination: 'Test', description: 'desc' };
const _target: TargetDestination = { moduleId: 'n', moduleName: 'Test', requiredPath: '/test' };

const _levelData: CorridorRunnerLevelData = {
  routeConfig: [_route],
  mapLayout: _layout,
  testNavigations: [_testNav],
  targetDestinations: [_target],
};

const _levelDef: LevelDefinition<CorridorRunnerLevelData> = {
  levelId: 'cr-basic-01',
  gameId: 'corridor-runner',
  tier: DifficultyTier.Basic,
  order: 1,
  title: 'Test',
  conceptIntroduced: 'Test concept',
  description: 'Test description',
  data: _levelData,
};

void [_node, _edge, _layout, _route, _testNav, _target, _levelData, _levelDef];

// --- Runtime tests ---

describe('Level count and structure', () => {
  it('should have exactly 18 total levels', () => {
    expect(CORRIDOR_RUNNER_LEVELS.length).toBe(18);
  });

  it('should have 6 Basic levels', () => {
    const basic = CORRIDOR_RUNNER_LEVELS.filter(l => l.tier === DifficultyTier.Basic);
    expect(basic.length).toBe(6);
  });

  it('should have 6 Intermediate levels', () => {
    const intermediate = CORRIDOR_RUNNER_LEVELS.filter(l => l.tier === DifficultyTier.Intermediate);
    expect(intermediate.length).toBe(6);
  });

  it('should have 5 Advanced levels', () => {
    const advanced = CORRIDOR_RUNNER_LEVELS.filter(l => l.tier === DifficultyTier.Advanced);
    expect(advanced.length).toBe(5);
  });

  it('should have 1 Boss level', () => {
    const boss = CORRIDOR_RUNNER_LEVELS.filter(l => l.tier === DifficultyTier.Boss);
    expect(boss.length).toBe(1);
  });

  it('should have all gameId fields set to corridor-runner', () => {
    for (const level of CORRIDOR_RUNNER_LEVELS) {
      expect(level.gameId).toBe('corridor-runner');
    }
  });

  it('should have unique levelId for every level', () => {
    const ids = CORRIDOR_RUNNER_LEVELS.map(l => l.levelId);
    expect(new Set(ids).size).toBe(18);
  });

  it('should have sequential order within each tier', () => {
    const basicOrders = CORRIDOR_RUNNER_LEVELS
      .filter(l => l.tier === DifficultyTier.Basic)
      .map(l => l.order);
    expect(basicOrders).toEqual([1, 2, 3, 4, 5, 6]);

    const intermediateOrders = CORRIDOR_RUNNER_LEVELS
      .filter(l => l.tier === DifficultyTier.Intermediate)
      .map(l => l.order);
    expect(intermediateOrders).toEqual([1, 2, 3, 4, 5, 6]);

    const advancedOrders = CORRIDOR_RUNNER_LEVELS
      .filter(l => l.tier === DifficultyTier.Advanced)
      .map(l => l.order);
    expect(advancedOrders).toEqual([1, 2, 3, 4, 5]);

    const bossOrders = CORRIDOR_RUNNER_LEVELS
      .filter(l => l.tier === DifficultyTier.Boss)
      .map(l => l.order);
    expect(bossOrders).toEqual([1]);
  });
});

describe('Required fields', () => {
  it('should have a non-empty title for every level', () => {
    for (const level of CORRIDOR_RUNNER_LEVELS) {
      expect(level.title.length).toBeGreaterThan(0);
    }
  });

  it('should have a non-empty description for every level', () => {
    for (const level of CORRIDOR_RUNNER_LEVELS) {
      expect(level.description.length).toBeGreaterThan(0);
    }
  });

  it('should have a non-empty conceptIntroduced for every level', () => {
    for (const level of CORRIDOR_RUNNER_LEVELS) {
      expect(level.conceptIntroduced.length).toBeGreaterThan(0);
    }
  });

  it('should have at least 1 test navigation in every level', () => {
    for (const level of CORRIDOR_RUNNER_LEVELS) {
      expect(level.data.testNavigations.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('should have at least 1 target destination in every level', () => {
    for (const level of CORRIDOR_RUNNER_LEVELS) {
      expect(level.data.targetDestinations.length).toBeGreaterThanOrEqual(1);
    }
  });
});

describe('Data integrity — Map layout', () => {
  it('should have unique node ids within each level', () => {
    for (const level of CORRIDOR_RUNNER_LEVELS) {
      const ids = level.data.mapLayout.nodes.map(n => n.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('should have unique edge ids within each level', () => {
    for (const level of CORRIDOR_RUNNER_LEVELS) {
      const ids = level.data.mapLayout.edges.map(e => e.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('should have all edges reference existing node ids', () => {
    for (const level of CORRIDOR_RUNNER_LEVELS) {
      const nodeIds = new Set(level.data.mapLayout.nodes.map(n => n.id));
      for (const edge of level.data.mapLayout.edges) {
        expect(nodeIds.has(edge.sourceNodeId)).toBe(true);
        expect(nodeIds.has(edge.targetNodeId)).toBe(true);
      }
    }
  });

  it('should have at least 2 nodes in every level', () => {
    for (const level of CORRIDOR_RUNNER_LEVELS) {
      expect(level.data.mapLayout.nodes.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('should have at least 1 edge in every level', () => {
    for (const level of CORRIDOR_RUNNER_LEVELS) {
      expect(level.data.mapLayout.edges.length).toBeGreaterThanOrEqual(1);
    }
  });
});

describe('Data integrity — Route config', () => {
  it('should have at least 1 route entry in every level', () => {
    for (const level of CORRIDOR_RUNNER_LEVELS) {
      expect(level.data.routeConfig.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('should have every targetDestination.moduleId reference a valid map node id', () => {
    for (const level of CORRIDOR_RUNNER_LEVELS) {
      const nodeIds = new Set(level.data.mapLayout.nodes.map(n => n.id));
      for (const dest of level.data.targetDestinations) {
        expect(nodeIds.has(dest.moduleId)).toBe(true);
      }
    }
  });
});

describe('Data integrity — Test navigations', () => {
  it('should have unique test navigation URLs within each level', () => {
    for (const level of CORRIDOR_RUNNER_LEVELS) {
      const urls = level.data.testNavigations.map(t => t.url);
      expect(new Set(urls).size).toBe(urls.length);
    }
  });

  it('should have every test navigation expectedDestination match a targetDestination moduleName', () => {
    for (const level of CORRIDOR_RUNNER_LEVELS) {
      const moduleNames = new Set(level.data.targetDestinations.map(d => d.moduleName));
      for (const nav of level.data.testNavigations) {
        expect(moduleNames.has(nav.expectedDestination)).toBe(true);
      }
    }
  });

  it('should have every targetDestination.moduleId reachable via at least one MapEdge', () => {
    for (const level of CORRIDOR_RUNNER_LEVELS) {
      const edgeNodeIds = new Set<string>();
      for (const edge of level.data.mapLayout.edges) {
        edgeNodeIds.add(edge.sourceNodeId);
        edgeNodeIds.add(edge.targetNodeId);
      }
      for (const dest of level.data.targetDestinations) {
        expect(edgeNodeIds.has(dest.moduleId)).toBe(true);
      }
    }
  });
});

describe('Specific level spot checks', () => {
  it('should have Boss level with 10 map nodes', () => {
    const boss = CORRIDOR_RUNNER_LEVELS.find(l => l.tier === DifficultyTier.Boss)!;
    expect(boss.data.mapLayout.nodes.length).toBe(10);
  });

  it('should have Boss level with 8 test navigations', () => {
    const boss = CORRIDOR_RUNNER_LEVELS.find(l => l.tier === DifficultyTier.Boss)!;
    expect(boss.data.testNavigations.length).toBe(8);
  });

  it('should have Boss level with parTime set', () => {
    const boss = CORRIDOR_RUNNER_LEVELS.find(l => l.tier === DifficultyTier.Boss)!;
    expect(boss.parTime).toBeDefined();
    expect(boss.parTime!).toBeGreaterThan(0);
  });

  it('should have Boss level title be Station-Wide Navigation', () => {
    const boss = CORRIDOR_RUNNER_LEVELS.find(l => l.tier === DifficultyTier.Boss)!;
    expect(boss.title).toBe('Station-Wide Navigation');
  });

  it('should have Level 1 conceptIntroduced be Single route', () => {
    const level1 = CORRIDOR_RUNNER_LEVELS.find(l => l.levelId === 'cr-basic-01')!;
    expect(level1).toBeDefined();
    expect(level1.conceptIntroduced).toBe('Single route');
  });

  it('should have Boss level with nodes on 3 different decks', () => {
    const boss = CORRIDOR_RUNNER_LEVELS.find(l => l.tier === DifficultyTier.Boss)!;
    const decks = new Set(boss.data.mapLayout.nodes.map(n => n.deck).filter(d => d !== undefined));
    expect(decks.size).toBe(3);
  });
});

describe('Level ID format', () => {
  it('should have all levelIds match pattern cr-(basic|intermediate|advanced|boss)-NN', () => {
    const pattern = /^cr-(basic|intermediate|advanced|boss)-\d{2}$/;
    for (const level of CORRIDOR_RUNNER_LEVELS) {
      expect(level.levelId).toMatch(pattern);
    }
  });
});

describe('LevelPack', () => {
  it('should have gameId corridor-runner', () => {
    expect(CORRIDOR_RUNNER_LEVEL_PACK.gameId).toBe('corridor-runner');
  });

  it('should have levels equal to CORRIDOR_RUNNER_LEVELS', () => {
    expect(CORRIDOR_RUNNER_LEVEL_PACK.levels).toBe(CORRIDOR_RUNNER_LEVELS);
  });
});
