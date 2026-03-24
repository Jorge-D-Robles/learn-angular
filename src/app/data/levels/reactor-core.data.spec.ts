import { DifficultyTier } from '../../core/minigame/minigame.types';
import type { LevelDefinition } from '../../core/levels/level.types';
import type {
  ReactorCoreLevelData,
  ReactorNode,
  ReactorNodeType,
  GraphEdge,
  SimulationScenario,
  SignalChange,
  ExpectedOutput,
  GraphConstraint,
  ValidGraph,
  SignalNode,
  ComputedNode,
  EffectNode,
  LinkedSignalNode,
  ToSignalNode,
  ToObservableNode,
  ResourceNode,
} from '../../features/minigames/reactor-core/reactor-core.types';
import {
  REACTOR_CORE_LEVELS,
  REACTOR_CORE_LEVEL_PACK,
} from './reactor-core.data';

// --- Compile-time type checks ---

const _signalNode: SignalNode = { id: 's', type: 'signal', label: 'S', initialValue: 0 };
const _computedNode: ComputedNode = { id: 'c', type: 'computed', label: 'C', computationExpr: 'x', dependencyIds: ['s'] };
const _effectNode: EffectNode = { id: 'e', type: 'effect', label: 'E', actionDescription: 'act', dependencyIds: ['s'] };
const _linkedNode: LinkedSignalNode = { id: 'l', type: 'linked-signal', label: 'L', initialValue: 0, linkedToId: 's' };
const _toSignalNode: ToSignalNode = { id: 'ts', type: 'to-signal', label: 'TS', sourceDescription: 'obs', dependencyIds: ['s'] };
const _toObsNode: ToObservableNode = { id: 'to', type: 'to-observable', label: 'TO', dependencyIds: ['s'] };
const _resourceNode: ResourceNode = { id: 'r', type: 'resource', label: 'R', requestDescription: 'GET /api', dependencyIds: ['s'] };

const _edge: GraphEdge = { sourceId: 's', targetId: 'c' };
const _change: SignalChange = { nodeId: 's', newValue: 1 };
const _expected: ExpectedOutput = { nodeId: 'c', expectedValue: 1 };
const _expectedWithState: ExpectedOutput = { nodeId: 'r', expectedValue: 0, expectedState: 'loading' };
const _scenario: SimulationScenario = { id: 'sc1', description: 'test', signalChanges: [_change], expectedOutputs: [_expected] };
const _constraint: GraphConstraint = { maxNodes: 2, requiredNodeTypes: ['signal', 'computed'] };
const _graph: ValidGraph = { nodes: [_signalNode, _computedNode], edges: [_edge] };
const _node: ReactorNode = _signalNode;

const _levelData: ReactorCoreLevelData = {
  requiredNodes: [_signalNode],
  scenarios: [_scenario],
  validGraphs: [_graph],
  constraints: _constraint,
};

const _levelDef: LevelDefinition<ReactorCoreLevelData> = {
  levelId: 'rc-basic-01',
  gameId: 'reactor-core',
  tier: DifficultyTier.Basic,
  order: 1,
  title: 'Test',
  conceptIntroduced: 'Test concept',
  description: 'Test description',
  data: _levelData,
};

void [_signalNode, _computedNode, _effectNode, _linkedNode, _toSignalNode, _toObsNode, _resourceNode, _edge, _change, _expected, _expectedWithState, _scenario, _constraint, _graph, _node, _levelData, _levelDef];

// --- Valid ReactorNodeType values ---

const VALID_NODE_TYPES: readonly ReactorNodeType[] = [
  'signal', 'computed', 'effect', 'linked-signal', 'to-signal', 'to-observable', 'resource',
];

// --- Helper: get all node IDs that are signal-type (can have signalChanges applied) ---

const SIGNAL_LIKE_TYPES: readonly ReactorNodeType[] = ['signal', 'linked-signal'];

// --- Helper: DFS-based cycle detection ---

function hasCycle(edges: readonly GraphEdge[], nodeIds: readonly string[]): boolean {
  const adj = new Map<string, string[]>();
  for (const id of nodeIds) adj.set(id, []);
  for (const e of edges) {
    adj.get(e.sourceId)?.push(e.targetId);
  }

  const WHITE = 0, GRAY = 1, BLACK = 2;
  const color = new Map<string, number>();
  for (const id of nodeIds) color.set(id, WHITE);

  function dfs(u: string): boolean {
    color.set(u, GRAY);
    for (const v of adj.get(u) ?? []) {
      if (color.get(v) === GRAY) return true;
      if (color.get(v) === WHITE && dfs(v)) return true;
    }
    color.set(u, BLACK);
    return false;
  }

  for (const id of nodeIds) {
    if (color.get(id) === WHITE && dfs(id)) return true;
  }
  return false;
}

// --- Runtime tests ---

describe('Level count and structure', () => {
  it('should have exactly 21 total levels', () => {
    expect(REACTOR_CORE_LEVELS.length).toBe(21);
  });

  it('should have 7 Basic levels', () => {
    const basic = REACTOR_CORE_LEVELS.filter(l => l.tier === DifficultyTier.Basic);
    expect(basic.length).toBe(7);
  });

  it('should have 7 Intermediate levels', () => {
    const intermediate = REACTOR_CORE_LEVELS.filter(l => l.tier === DifficultyTier.Intermediate);
    expect(intermediate.length).toBe(7);
  });

  it('should have 6 Advanced levels', () => {
    const advanced = REACTOR_CORE_LEVELS.filter(l => l.tier === DifficultyTier.Advanced);
    expect(advanced.length).toBe(6);
  });

  it('should have 1 Boss level', () => {
    const boss = REACTOR_CORE_LEVELS.filter(l => l.tier === DifficultyTier.Boss);
    expect(boss.length).toBe(1);
  });

  it('should have all gameId fields set to reactor-core', () => {
    for (const level of REACTOR_CORE_LEVELS) {
      expect(level.gameId).toBe('reactor-core');
    }
  });

  it('should have unique levelId for every level', () => {
    const ids = REACTOR_CORE_LEVELS.map(l => l.levelId);
    expect(new Set(ids).size).toBe(21);
  });

  it('should have sequential order within each tier', () => {
    const basicOrders = REACTOR_CORE_LEVELS
      .filter(l => l.tier === DifficultyTier.Basic)
      .map(l => l.order);
    expect(basicOrders).toEqual([1, 2, 3, 4, 5, 6, 7]);

    const intermediateOrders = REACTOR_CORE_LEVELS
      .filter(l => l.tier === DifficultyTier.Intermediate)
      .map(l => l.order);
    expect(intermediateOrders).toEqual([1, 2, 3, 4, 5, 6, 7]);

    const advancedOrders = REACTOR_CORE_LEVELS
      .filter(l => l.tier === DifficultyTier.Advanced)
      .map(l => l.order);
    expect(advancedOrders).toEqual([1, 2, 3, 4, 5, 6]);

    const bossOrders = REACTOR_CORE_LEVELS
      .filter(l => l.tier === DifficultyTier.Boss)
      .map(l => l.order);
    expect(bossOrders).toEqual([1]);
  });
});

describe('Required fields', () => {
  it('should have a non-empty title for every level', () => {
    for (const level of REACTOR_CORE_LEVELS) {
      expect(level.title.length).toBeGreaterThan(0);
    }
  });

  it('should have a non-empty description for every level', () => {
    for (const level of REACTOR_CORE_LEVELS) {
      expect(level.description.length).toBeGreaterThan(0);
    }
  });

  it('should have a non-empty conceptIntroduced for every level', () => {
    for (const level of REACTOR_CORE_LEVELS) {
      expect(level.conceptIntroduced.length).toBeGreaterThan(0);
    }
  });

  it('should have at least 1 required node in every level', () => {
    for (const level of REACTOR_CORE_LEVELS) {
      expect(level.data.requiredNodes.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('should have at least 1 scenario in every level', () => {
    for (const level of REACTOR_CORE_LEVELS) {
      expect(level.data.scenarios.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('should have at least 1 valid graph in every level', () => {
    for (const level of REACTOR_CORE_LEVELS) {
      expect(level.data.validGraphs.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('should have non-null constraints for every level', () => {
    for (const level of REACTOR_CORE_LEVELS) {
      expect(level.data.constraints).toBeDefined();
      expect(level.data.constraints).not.toBeNull();
    }
  });
});

describe('Data integrity -- Nodes', () => {
  it('should have unique node ids within each level requiredNodes', () => {
    for (const level of REACTOR_CORE_LEVELS) {
      const ids = level.data.requiredNodes.map(n => n.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('should have valid node types for all required nodes', () => {
    for (const level of REACTOR_CORE_LEVELS) {
      for (const node of level.data.requiredNodes) {
        expect(VALID_NODE_TYPES).toContain(node.type);
      }
    }
  });

  it('should have signal nodes with initialValue defined', () => {
    for (const level of REACTOR_CORE_LEVELS) {
      for (const node of level.data.requiredNodes) {
        if (node.type === 'signal') {
          expect((node as SignalNode).initialValue).toBeDefined();
        }
      }
    }
  });

  it('should have computed nodes with dependencyIds referencing valid node ids', () => {
    for (const level of REACTOR_CORE_LEVELS) {
      const nodeIds = new Set(level.data.requiredNodes.map(n => n.id));
      for (const node of level.data.requiredNodes) {
        if (node.type === 'computed') {
          for (const depId of (node as ComputedNode).dependencyIds) {
            expect(nodeIds.has(depId)).toBe(true);
          }
        }
      }
    }
  });

  it('should have effect nodes with dependencyIds referencing valid node ids', () => {
    for (const level of REACTOR_CORE_LEVELS) {
      const nodeIds = new Set(level.data.requiredNodes.map(n => n.id));
      for (const node of level.data.requiredNodes) {
        if (node.type === 'effect') {
          for (const depId of (node as EffectNode).dependencyIds) {
            expect(nodeIds.has(depId)).toBe(true);
          }
        }
      }
    }
  });

  it('should have to-signal nodes with dependencyIds referencing valid node ids', () => {
    for (const level of REACTOR_CORE_LEVELS) {
      const nodeIds = new Set(level.data.requiredNodes.map(n => n.id));
      for (const node of level.data.requiredNodes) {
        if (node.type === 'to-signal') {
          for (const depId of (node as ToSignalNode).dependencyIds) {
            expect(nodeIds.has(depId)).toBe(true);
          }
        }
      }
    }
  });

  it('should have to-observable nodes with dependencyIds referencing valid node ids', () => {
    for (const level of REACTOR_CORE_LEVELS) {
      const nodeIds = new Set(level.data.requiredNodes.map(n => n.id));
      for (const node of level.data.requiredNodes) {
        if (node.type === 'to-observable') {
          for (const depId of (node as ToObservableNode).dependencyIds) {
            expect(nodeIds.has(depId)).toBe(true);
          }
        }
      }
    }
  });

  it('should have resource nodes with dependencyIds referencing valid node ids', () => {
    for (const level of REACTOR_CORE_LEVELS) {
      const nodeIds = new Set(level.data.requiredNodes.map(n => n.id));
      for (const node of level.data.requiredNodes) {
        if (node.type === 'resource') {
          for (const depId of (node as ResourceNode).dependencyIds) {
            expect(nodeIds.has(depId)).toBe(true);
          }
        }
      }
    }
  });

  it('should have linked-signal nodes with linkedToId referencing valid node ids', () => {
    for (const level of REACTOR_CORE_LEVELS) {
      const nodeIds = new Set(level.data.requiredNodes.map(n => n.id));
      for (const node of level.data.requiredNodes) {
        if (node.type === 'linked-signal') {
          expect(nodeIds.has((node as LinkedSignalNode).linkedToId)).toBe(true);
        }
      }
    }
  });
});

describe('Data integrity -- Scenarios', () => {
  it('should have unique scenario ids within each level', () => {
    for (const level of REACTOR_CORE_LEVELS) {
      const ids = level.data.scenarios.map(s => s.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('should have scenario signalChanges reference signal-type node ids', () => {
    for (const level of REACTOR_CORE_LEVELS) {
      const signalNodeIds = new Set(
        level.data.requiredNodes
          .filter(n => SIGNAL_LIKE_TYPES.includes(n.type))
          .map(n => n.id),
      );
      for (const sc of level.data.scenarios) {
        for (const ch of sc.signalChanges) {
          expect(signalNodeIds.has(ch.nodeId)).toBe(true);
        }
      }
    }
  });

  it('should have scenario expectedOutputs reference valid node ids', () => {
    for (const level of REACTOR_CORE_LEVELS) {
      const nodeIds = new Set(level.data.requiredNodes.map(n => n.id));
      for (const sc of level.data.scenarios) {
        for (const out of sc.expectedOutputs) {
          expect(nodeIds.has(out.nodeId)).toBe(true);
        }
      }
    }
  });

  it('should have at least 1 signalChange and 1 expectedOutput per scenario', () => {
    for (const level of REACTOR_CORE_LEVELS) {
      for (const sc of level.data.scenarios) {
        expect(sc.signalChanges.length).toBeGreaterThanOrEqual(1);
        expect(sc.expectedOutputs.length).toBeGreaterThanOrEqual(1);
      }
    }
  });
});

describe('Data integrity -- Valid graphs', () => {
  it('should have valid graph nodes reference requiredNodes ids', () => {
    for (const level of REACTOR_CORE_LEVELS) {
      const requiredIds = new Set(level.data.requiredNodes.map(n => n.id));
      for (const g of level.data.validGraphs) {
        for (const node of g.nodes) {
          expect(requiredIds.has(node.id)).toBe(true);
        }
      }
    }
  });

  it('should have valid graph edges reference nodes that exist in the same graph', () => {
    for (const level of REACTOR_CORE_LEVELS) {
      for (const g of level.data.validGraphs) {
        const graphNodeIds = new Set(g.nodes.map(n => n.id));
        for (const e of g.edges) {
          expect(graphNodeIds.has(e.sourceId)).toBe(true);
          expect(graphNodeIds.has(e.targetId)).toBe(true);
        }
      }
    }
  });

  it('should have no valid graph with circular dependencies', () => {
    for (const level of REACTOR_CORE_LEVELS) {
      for (const g of level.data.validGraphs) {
        const nodeIds = g.nodes.map(n => n.id);
        expect(hasCycle(g.edges, nodeIds)).toBe(false);
      }
    }
  });
});

describe('Data integrity -- Constraints', () => {
  it('should have constraints.maxNodes >= number of requiredNodes', () => {
    for (const level of REACTOR_CORE_LEVELS) {
      expect(level.data.constraints.maxNodes).toBeGreaterThanOrEqual(level.data.requiredNodes.length);
    }
  });

  it('should have constraints.requiredNodeTypes be non-empty', () => {
    for (const level of REACTOR_CORE_LEVELS) {
      expect(level.data.constraints.requiredNodeTypes.length).toBeGreaterThan(0);
    }
  });
});

describe('Level ID format', () => {
  it('should have all levelIds match pattern rc-(basic|intermediate|advanced|boss)-NN', () => {
    const pattern = /^rc-(basic|intermediate|advanced|boss)-\d{2}$/;
    for (const level of REACTOR_CORE_LEVELS) {
      expect(level.levelId).toMatch(pattern);
    }
  });
});

describe('LevelPack', () => {
  it('should have gameId reactor-core', () => {
    expect(REACTOR_CORE_LEVEL_PACK.gameId).toBe('reactor-core');
  });

  it('should have levels equal to REACTOR_CORE_LEVELS', () => {
    expect(REACTOR_CORE_LEVEL_PACK.levels).toBe(REACTOR_CORE_LEVELS);
  });
});

describe('Specific level spot checks', () => {
  it('should have Level 1 conceptIntroduced be signal()', () => {
    const level1 = REACTOR_CORE_LEVELS.find(l => l.levelId === 'rc-basic-01')!;
    expect(level1).toBeDefined();
    expect(level1.conceptIntroduced).toBe('signal()');
  });

  it('should have Level 1 with exactly 1 signal node and 0 computed/effect nodes', () => {
    const level1 = REACTOR_CORE_LEVELS.find(l => l.levelId === 'rc-basic-01')!;
    const signals = level1.data.requiredNodes.filter(n => n.type === 'signal');
    const computed = level1.data.requiredNodes.filter(n => n.type === 'computed');
    const effects = level1.data.requiredNodes.filter(n => n.type === 'effect');
    expect(signals.length).toBe(1);
    expect(computed.length).toBe(0);
    expect(effects.length).toBe(0);
  });

  it('should have Level 4 introduce computed() with at least 1 computed node', () => {
    const level4 = REACTOR_CORE_LEVELS.find(l => l.levelId === 'rc-basic-04')!;
    expect(level4).toBeDefined();
    expect(level4.conceptIntroduced).toBe('computed()');
    const computed = level4.data.requiredNodes.filter(n => n.type === 'computed');
    expect(computed.length).toBeGreaterThanOrEqual(1);
  });

  it('should have Level 8 introduce effect() with at least 1 effect node', () => {
    const level8 = REACTOR_CORE_LEVELS.find(l => l.levelId === 'rc-intermediate-01')!;
    expect(level8).toBeDefined();
    expect(level8.conceptIntroduced).toBe('effect()');
    const effects = level8.data.requiredNodes.filter(n => n.type === 'effect');
    expect(effects.length).toBeGreaterThanOrEqual(1);
  });

  it('should have Boss level title be Reactor Redesign', () => {
    const boss = REACTOR_CORE_LEVELS.find(l => l.tier === DifficultyTier.Boss)!;
    expect(boss.title).toBe('Reactor Redesign');
  });

  it('should have Boss level with parTime set', () => {
    const boss = REACTOR_CORE_LEVELS.find(l => l.tier === DifficultyTier.Boss)!;
    expect(boss.parTime).toBe(300);
  });

  it('should have Boss level with at least 15 required nodes', () => {
    const boss = REACTOR_CORE_LEVELS.find(l => l.tier === DifficultyTier.Boss)!;
    expect(boss.data.requiredNodes.length).toBeGreaterThanOrEqual(15);
  });

  it('should have Boss level with at least 10 scenarios', () => {
    const boss = REACTOR_CORE_LEVELS.find(l => l.tier === DifficultyTier.Boss)!;
    expect(boss.data.scenarios.length).toBeGreaterThanOrEqual(10);
  });

  it('should have Level 9 use effect cleanup', () => {
    const level9 = REACTOR_CORE_LEVELS.find(l => l.levelId === 'rc-intermediate-02')!;
    expect(level9).toBeDefined();
    const effectWithCleanup = level9.data.requiredNodes.some(
      n => n.type === 'effect' && (n as EffectNode).requiresCleanup === true,
    );
    expect(effectWithCleanup).toBe(true);
  });

  it('should have Level 12 introduce linkedSignal()', () => {
    const level12 = REACTOR_CORE_LEVELS.find(l => l.levelId === 'rc-intermediate-05')!;
    expect(level12).toBeDefined();
    expect(level12.conceptIntroduced).toBe('linkedSignal()');
    const linked = level12.data.requiredNodes.filter(n => n.type === 'linked-signal');
    expect(linked.length).toBeGreaterThanOrEqual(1);
  });

  it('should have Level 15 introduce toSignal()', () => {
    const level15 = REACTOR_CORE_LEVELS.find(l => l.levelId === 'rc-advanced-01')!;
    expect(level15).toBeDefined();
    expect(level15.conceptIntroduced).toBe('toSignal()');
    const toSigNodes = level15.data.requiredNodes.filter(n => n.type === 'to-signal');
    expect(toSigNodes.length).toBeGreaterThanOrEqual(1);
  });

  it('should have Level 16 introduce toObservable()', () => {
    const level16 = REACTOR_CORE_LEVELS.find(l => l.levelId === 'rc-advanced-02')!;
    expect(level16).toBeDefined();
    expect(level16.conceptIntroduced).toBe('toObservable()');
    const toObsNodes = level16.data.requiredNodes.filter(n => n.type === 'to-observable');
    expect(toObsNodes.length).toBeGreaterThanOrEqual(1);
  });

  it('should have Level 17 introduce resource signals', () => {
    const level17 = REACTOR_CORE_LEVELS.find(l => l.levelId === 'rc-advanced-03')!;
    expect(level17).toBeDefined();
    expect(level17.conceptIntroduced).toBe('Resource signals');
    const resourceNodes = level17.data.requiredNodes.filter(n => n.type === 'resource');
    expect(resourceNodes.length).toBeGreaterThanOrEqual(1);
  });

  it('should have Level 17 use expectedState on resource output', () => {
    const level17 = REACTOR_CORE_LEVELS.find(l => l.levelId === 'rc-advanced-03')!;
    const hasExpectedState = level17.data.scenarios.some(sc =>
      sc.expectedOutputs.some(out => out.expectedState !== undefined),
    );
    expect(hasExpectedState).toBe(true);
  });

  it('should have Level 18 with at least 10 required nodes', () => {
    const level18 = REACTOR_CORE_LEVELS.find(l => l.levelId === 'rc-advanced-04')!;
    expect(level18).toBeDefined();
    expect(level18.data.requiredNodes.length).toBeGreaterThanOrEqual(10);
  });
});
