import type {
  NodePosition,
  RuntimeSignalNode,
  RuntimeComputedNode,
  RuntimeEffectNode,
  RuntimeResourceNode,
  GraphValidationResult,
  PropagationResult,
  ScenarioResult,
} from './reactor-core.types';
import { hasCycle, wouldCreateCycle } from './reactor-core.types';
import type { GraphEdge } from './reactor-core.types';

// ---------------------------------------------------------------------------
// hasCycle tests
// ---------------------------------------------------------------------------

describe('hasCycle', () => {
  it('should return false for an empty graph', () => {
    expect(hasCycle([], [])).toBe(false);
  });

  it('should return false for a single node with no edges', () => {
    expect(hasCycle([], ['A'])).toBe(false);
  });

  it('should return false for a linear chain (A -> B -> C)', () => {
    const edges: GraphEdge[] = [
      { sourceId: 'A', targetId: 'B' },
      { sourceId: 'B', targetId: 'C' },
    ];
    expect(hasCycle(edges, ['A', 'B', 'C'])).toBe(false);
  });

  it('should return true for a direct cycle (A -> B -> A)', () => {
    const edges: GraphEdge[] = [
      { sourceId: 'A', targetId: 'B' },
      { sourceId: 'B', targetId: 'A' },
    ];
    expect(hasCycle(edges, ['A', 'B'])).toBe(true);
  });

  it('should return true for an indirect cycle (A -> B -> C -> A)', () => {
    const edges: GraphEdge[] = [
      { sourceId: 'A', targetId: 'B' },
      { sourceId: 'B', targetId: 'C' },
      { sourceId: 'C', targetId: 'A' },
    ];
    expect(hasCycle(edges, ['A', 'B', 'C'])).toBe(true);
  });

  it('should return false for a diamond DAG (A -> B, A -> C, B -> D, C -> D)', () => {
    const edges: GraphEdge[] = [
      { sourceId: 'A', targetId: 'B' },
      { sourceId: 'A', targetId: 'C' },
      { sourceId: 'B', targetId: 'D' },
      { sourceId: 'C', targetId: 'D' },
    ];
    expect(hasCycle(edges, ['A', 'B', 'C', 'D'])).toBe(false);
  });

  it('should return true for a self-loop (A -> A)', () => {
    const edges: GraphEdge[] = [{ sourceId: 'A', targetId: 'A' }];
    expect(hasCycle(edges, ['A'])).toBe(true);
  });

  it('should return true when disconnected components have one with a cycle', () => {
    const edges: GraphEdge[] = [
      { sourceId: 'A', targetId: 'B' },
      { sourceId: 'C', targetId: 'D' },
      { sourceId: 'D', targetId: 'C' },
    ];
    expect(hasCycle(edges, ['A', 'B', 'C', 'D'])).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// wouldCreateCycle tests
// ---------------------------------------------------------------------------

describe('wouldCreateCycle', () => {
  it('should return false when adding an edge to an empty graph', () => {
    const newEdge: GraphEdge = { sourceId: 'A', targetId: 'B' };
    expect(wouldCreateCycle([], newEdge, ['A', 'B'])).toBe(false);
  });

  it('should return false when adding a forward edge to a linear chain', () => {
    const existing: GraphEdge[] = [
      { sourceId: 'A', targetId: 'B' },
      { sourceId: 'B', targetId: 'C' },
    ];
    const newEdge: GraphEdge = { sourceId: 'C', targetId: 'D' };
    expect(wouldCreateCycle(existing, newEdge, ['A', 'B', 'C', 'D'])).toBe(false);
  });

  it('should return true when adding a back edge that closes a cycle', () => {
    const existing: GraphEdge[] = [
      { sourceId: 'A', targetId: 'B' },
      { sourceId: 'B', targetId: 'C' },
    ];
    const newEdge: GraphEdge = { sourceId: 'C', targetId: 'A' };
    expect(wouldCreateCycle(existing, newEdge, ['A', 'B', 'C'])).toBe(true);
  });

  it('should return false when adding an edge between disconnected nodes', () => {
    const existing: GraphEdge[] = [
      { sourceId: 'A', targetId: 'B' },
    ];
    const newEdge: GraphEdge = { sourceId: 'C', targetId: 'D' };
    expect(wouldCreateCycle(existing, newEdge, ['A', 'B', 'C', 'D'])).toBe(false);
  });

  it('should return true when adding a self-loop edge', () => {
    const newEdge: GraphEdge = { sourceId: 'A', targetId: 'A' };
    expect(wouldCreateCycle([], newEdge, ['A'])).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Type structure smoke tests
// ---------------------------------------------------------------------------

describe('Type structures', () => {
  it('NodePosition has x and y as numbers', () => {
    const pos: NodePosition = { x: 100, y: 200 };
    expect(pos.x).toBe(100);
    expect(pos.y).toBe(200);
  });

  it('RuntimeSignalNode has required fields: id, type, initialValue, currentValue, position', () => {
    const node: RuntimeSignalNode = {
      id: 's1',
      type: 'signal',
      label: 'Count',
      initialValue: 0,
      currentValue: 42,
      position: { x: 10, y: 20 },
    };
    expect(node.id).toBe('s1');
    expect(node.type).toBe('signal');
    expect(node.initialValue).toBe(0);
    expect(node.currentValue).toBe(42);
    expect(node.position).toEqual({ x: 10, y: 20 });
  });

  it('RuntimeComputedNode has required fields: id, type, computationExpr, dependencyIds, currentValue, position', () => {
    const node: RuntimeComputedNode = {
      id: 'c1',
      type: 'computed',
      label: 'Double',
      computationExpr: 'count * 2',
      dependencyIds: ['s1'],
      currentValue: 84,
      position: { x: 50, y: 60 },
    };
    expect(node.id).toBe('c1');
    expect(node.type).toBe('computed');
    expect(node.computationExpr).toBe('count * 2');
    expect(node.dependencyIds).toEqual(['s1']);
    expect(node.currentValue).toBe(84);
    expect(node.position).toEqual({ x: 50, y: 60 });
  });

  it('RuntimeEffectNode has required fields and optional cleanupFn', () => {
    const nodeWithoutCleanup: RuntimeEffectNode = {
      id: 'e1',
      type: 'effect',
      label: 'Log',
      actionDescription: 'log value',
      dependencyIds: ['s1'],
      position: { x: 70, y: 80 },
      cleanupFn: null,
    };
    expect(nodeWithoutCleanup.id).toBe('e1');
    expect(nodeWithoutCleanup.type).toBe('effect');
    expect(nodeWithoutCleanup.actionDescription).toBe('log value');
    expect(nodeWithoutCleanup.dependencyIds).toEqual(['s1']);
    expect(nodeWithoutCleanup.position).toEqual({ x: 70, y: 80 });
    expect(nodeWithoutCleanup.cleanupFn).toBeNull();

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const cleanup = () => {};
    const nodeWithCleanup: RuntimeEffectNode = {
      id: 'e2',
      type: 'effect',
      label: 'Timer',
      actionDescription: 'start timer',
      dependencyIds: ['s1'],
      position: { x: 90, y: 100 },
      cleanupFn: cleanup,
    };
    expect(nodeWithCleanup.cleanupFn).toBe(cleanup);
  });

  it('RuntimeResourceNode has resourceState field', () => {
    const node: RuntimeResourceNode = {
      id: 'r1',
      type: 'resource',
      label: 'Data',
      requestDescription: 'GET /api/data',
      dependencyIds: ['s1'],
      currentValue: 'loading...',
      position: { x: 110, y: 120 },
      resourceState: 'loading',
    };
    expect(node.resourceState).toBe('loading');
    expect(node.currentValue).toBe('loading...');
    expect(node.position).toEqual({ x: 110, y: 120 });
  });

  it('GraphValidationResult has valid, cycles, orphanedNodes, missingDependencies', () => {
    const result: GraphValidationResult = {
      valid: false,
      cycles: [['A', 'B', 'A']],
      orphanedNodes: ['C'],
      missingDependencies: [{ nodeId: 'D', missingDepId: 'E' }],
    };
    expect(result.valid).toBe(false);
    expect(result.cycles).toEqual([['A', 'B', 'A']]);
    expect(result.orphanedNodes).toEqual(['C']);
    expect(result.missingDependencies).toEqual([{ nodeId: 'D', missingDepId: 'E' }]);
  });

  it('PropagationResult has updatedNodes and triggeredEffects', () => {
    const result: PropagationResult = {
      updatedNodes: [{ nodeId: 's1', oldValue: 0, newValue: 42 }],
      triggeredEffects: ['e1'],
    };
    expect(result.updatedNodes).toEqual([{ nodeId: 's1', oldValue: 0, newValue: 42 }]);
    expect(result.triggeredEffects).toEqual(['e1']);
  });

  it('ScenarioResult has passed and results array', () => {
    const result: ScenarioResult = {
      passed: true,
      results: [{ nodeId: 'c1', expected: 84, actual: 84, match: true }],
    };
    expect(result.passed).toBe(true);
    expect(result.results).toEqual([{ nodeId: 'c1', expected: 84, actual: 84, match: true }]);
  });
});
