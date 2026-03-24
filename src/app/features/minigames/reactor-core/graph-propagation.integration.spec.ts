// ---------------------------------------------------------------------------
// Integration tests: ReactorCoreGraphServiceImpl change propagation & scenarios
// ---------------------------------------------------------------------------
// Exercises the graph service against hand-crafted multi-node topologies that
// mirror real level structures. Tests the full pipeline: build graph -> add
// edges -> propagate changes -> validate -> run scenarios.
//
// Distinct from reactor-core-graph.service.spec.ts (unit tests with 2-3 node
// graphs) and level-data-compat.integration.spec.ts (engine pipeline with
// real level data).
// ---------------------------------------------------------------------------

import { ReactorCoreGraphServiceImpl } from './reactor-core-graph.service';
import type {
  SignalNode,
  ComputedNode,
  EffectNode,
  GraphEdge,
  SimulationScenario,
} from './reactor-core.types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createService(): ReactorCoreGraphServiceImpl {
  return new ReactorCoreGraphServiceImpl();
}

/** Build a signal node with single-word label. */
function sig(id: string, label: string, initialValue: string | number | boolean = 0): SignalNode {
  return { id, type: 'signal', label, initialValue };
}

/** Build a computed node with single-word label and expression. */
function comp(id: string, label: string, expr: string, deps: string[]): ComputedNode {
  return { id, type: 'computed', label, computationExpr: expr, dependencyIds: deps };
}

/** Build an effect node. */
function eff(id: string, label: string, deps: string[]): EffectNode {
  return { id, type: 'effect', label, actionDescription: `run ${label}`, dependencyIds: deps };
}

/** Shorthand for a directed edge. */
function edge(sourceId: string, targetId: string): GraphEdge {
  return { sourceId, targetId };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ReactorCoreGraphService integration (change propagation & scenarios)', () => {
  let service: ReactorCoreGraphServiceImpl;

  beforeEach(() => {
    service = createService();
  });

  // =========================================================================
  // Test 1: Signal value change propagates to dependent computed node
  // =========================================================================
  it('1. signal value change propagates to dependent computed node', () => {
    // Build: signal count (initial 0) -> computed double (count * 2)
    service.addNode(sig('sig-1', 'count', 0));
    service.addNode(comp('comp-1', 'double', 'count * 2', ['sig-1']));
    service.addEdge(edge('sig-1', 'comp-1'));

    // Propagate via convenience method (uses internal state)
    const result = service.propagateChange('sig-1', 5);

    // Assert: comp-1 updated to 10 (5 * 2)
    expect(result.updatedNodes.length).toBe(1);
    const updated = result.updatedNodes.find(u => u.nodeId === 'comp-1');
    expect(updated).toBeTruthy();
    expect(updated!.newValue).toBe(10);
    expect(updated!.oldValue).toBe(0);
  });

  // =========================================================================
  // Test 2: Multi-level propagation (signal -> computed -> computed -> effect)
  // =========================================================================
  it('2. multi-level propagation: signal -> computed -> computed -> effect', () => {
    // Build: signal raw (50) -> computed calibrated (raw * 1.1) ->
    //        computed display (Math.round(calibrated)) -> effect logger
    service.addNode(sig('sig-1', 'raw', 50));
    service.addNode(comp('comp-1', 'calibrated', 'raw * 1.1', ['sig-1']));
    service.addNode(comp('comp-2', 'display', 'Math.round(calibrated)', ['comp-1']));
    service.addNode(eff('eff-1', 'logger', ['comp-2']));
    service.addEdge(edge('sig-1', 'comp-1'));
    service.addEdge(edge('comp-1', 'comp-2'));
    service.addEdge(edge('comp-2', 'eff-1'));

    // Propagate: set raw = 90
    const result = service.propagateChange('sig-1', 90);

    // Assert: calibrated = 90 * 1.1 = 99 (floating-point: 99.00000000000001)
    const calibrated = result.updatedNodes.find(u => u.nodeId === 'comp-1');
    expect(calibrated).toBeTruthy();
    expect(calibrated!.newValue).toBeCloseTo(99, 5);

    // Assert: display = Math.round(99.00000000000001) = 99
    const display = result.updatedNodes.find(u => u.nodeId === 'comp-2');
    expect(display).toBeTruthy();
    expect(display!.newValue).toBe(99);

    // Assert: effect triggered
    expect(result.triggeredEffects).toContain('eff-1');
  });

  // =========================================================================
  // Test 3: Cycle detection prevents adding circular dependency
  // =========================================================================
  it('3. cycle detection prevents adding circular dependency', () => {
    // Build: signal a -> computed b -> computed c
    service.addNode(sig('a', 'a', 0));
    service.addNode(comp('b', 'b', 'a + 1', ['a']));
    service.addNode(comp('c', 'c', 'b + 1', ['b']));
    service.addEdge(edge('a', 'b'));
    service.addEdge(edge('b', 'c'));

    // Attempt circular edge: c -> a
    const added = service.addEdge(edge('c', 'a'));
    expect(added).toBe(false);

    // detectCycle confirms it would create a cycle
    expect(service.detectCycle('c', 'a')).toBe(true);

    // Graph still has only the 2 valid edges
    const graph = service.getGraph()();
    expect(graph.edges.length).toBe(2);
  });

  // =========================================================================
  // Test 4: Scenario execution validates expected outputs after signal changes
  // =========================================================================
  it('4. scenario execution validates expected outputs after signal changes', () => {
    // Build: signal temp (70), signal coolant (50),
    //        computed heatindex (temp - coolant * 0.5),
    //        computed safety (heatindex < 50 ? "safe" : "warning")
    service.addNode(sig('sig-temp', 'temp', 70));
    service.addNode(sig('sig-cool', 'coolant', 50));
    service.addNode(comp('comp-heat', 'heatindex', 'temp - coolant * 0.5', ['sig-temp', 'sig-cool']));
    service.addNode(comp('comp-safe', 'safety', 'heatindex < 50 ? "safe" : "warning"', ['comp-heat']));
    service.addEdge(edge('sig-temp', 'comp-heat'));
    service.addEdge(edge('sig-cool', 'comp-heat'));
    service.addEdge(edge('comp-heat', 'comp-safe'));

    // Extract graph state for runScenario
    const graph = service.getGraph()();
    const nodes = Array.from(graph.nodes.values());
    const edges = graph.edges;

    // Scenario 1: temp=70, coolant=50 -> heatindex=45, safety="safe"
    const scenario1: SimulationScenario = {
      id: 'sc-1',
      description: 'normal operating conditions',
      signalChanges: [
        { nodeId: 'sig-temp', newValue: 70 },
        { nodeId: 'sig-cool', newValue: 50 },
      ],
      expectedOutputs: [
        { nodeId: 'comp-heat', expectedValue: 45 },
        { nodeId: 'comp-safe', expectedValue: 'safe' },
      ],
    };

    const result1 = service.runScenario(nodes, edges, scenario1);
    expect(result1.passed).toBe(true);
    expect(result1.results.every(r => r.match)).toBe(true);

    // Scenario 2: temp=120 -> heatindex=120 - 50*0.5 = 95, safety="warning"
    const scenario2: SimulationScenario = {
      id: 'sc-2',
      description: 'overheated conditions',
      signalChanges: [
        { nodeId: 'sig-temp', newValue: 120 },
        { nodeId: 'sig-cool', newValue: 50 },
      ],
      expectedOutputs: [
        { nodeId: 'comp-heat', expectedValue: 95 },
        { nodeId: 'comp-safe', expectedValue: 'warning' },
      ],
    };

    const result2 = service.runScenario(nodes, edges, scenario2);
    expect(result2.passed).toBe(true);
  });

  // =========================================================================
  // Test 5: Removing a dependency edge breaks propagation chain
  // =========================================================================
  it('5. removing a dependency edge breaks propagation chain', () => {
    // Build: signal count -> computed double -> effect logger
    service.addNode(sig('sig-1', 'count', 0));
    service.addNode(comp('comp-1', 'double', 'count * 2', ['sig-1']));
    service.addNode(eff('eff-1', 'logger', ['comp-1']));
    service.addEdge(edge('sig-1', 'comp-1'));
    service.addEdge(edge('comp-1', 'eff-1'));

    // Verify propagation works initially
    const before = service.propagateChange('sig-1', 5);
    expect(before.updatedNodes.find(u => u.nodeId === 'comp-1')!.newValue).toBe(10);
    expect(before.triggeredEffects).toContain('eff-1');

    // Remove the edge from signal to computed
    service.removeEdge('sig-1', 'comp-1');

    // Re-propagate: computed is no longer reachable from signal
    const after = service.propagateChange('sig-1', 10);
    expect(after.updatedNodes).toEqual([]);
    expect(after.triggeredEffects).toEqual([]);
  });

  // =========================================================================
  // Test 6: Orphaned computed node detected by graph validation
  // =========================================================================
  it('6. orphaned computed node detected by graph validation', () => {
    // Build: signal a, signal b, computed sum (deps: [a, b]), computed orphan (deps: [a])
    service.addNode(sig('sig-a', 'a', 1));
    service.addNode(sig('sig-b', 'b', 2));
    service.addNode(comp('comp-sum', 'sum', 'a + b', ['sig-a', 'sig-b']));
    service.addNode(comp('comp-orphan', 'orphan', 'a * 10', ['sig-a']));

    // Add edges only for sum, NOT for orphan
    service.addEdge(edge('sig-a', 'comp-sum'));
    service.addEdge(edge('sig-b', 'comp-sum'));

    // Validate: orphan has no edges, so it should be flagged
    const result = service.validateGraph();
    expect(result.valid).toBe(false);
    expect(result.orphanedNodes).toContain('comp-orphan');
    expect(result.missingDependencies).toContainEqual({
      nodeId: 'comp-orphan',
      missingDepId: 'sig-a',
    });
  });

  // =========================================================================
  // Test 7: End-to-end: build graph, validate, propagate, run scenario
  // =========================================================================
  it('7. end-to-end: build graph, validate, propagate, run scenario', () => {
    // Build a 6-node graph: 2 signals + 2 computed + 2 effects
    service.addNode(sig('sig-x', 'x', 10));
    service.addNode(sig('sig-y', 'y', 20));
    service.addNode(comp('comp-sum', 'sum', 'x + y', ['sig-x', 'sig-y']));
    service.addNode(comp('comp-diff', 'diff', 'x - y', ['sig-x', 'sig-y']));
    service.addNode(eff('eff-log', 'log', ['comp-sum']));
    service.addNode(eff('eff-alert', 'alert', ['comp-diff']));

    // Add all edges
    service.addEdge(edge('sig-x', 'comp-sum'));
    service.addEdge(edge('sig-y', 'comp-sum'));
    service.addEdge(edge('sig-x', 'comp-diff'));
    service.addEdge(edge('sig-y', 'comp-diff'));
    service.addEdge(edge('comp-sum', 'eff-log'));
    service.addEdge(edge('comp-diff', 'eff-alert'));

    // Step 1: Validate graph structure
    const validation = service.validateGraph();
    expect(validation.valid).toBe(true);
    expect(validation.cycles).toEqual([]);
    expect(validation.orphanedNodes).toEqual([]);
    expect(validation.missingDependencies).toEqual([]);

    // Step 2: Propagate changes and verify computed values
    const graph = service.getGraph()();
    const nodes = Array.from(graph.nodes.values());
    const edges = graph.edges;

    const propagation = service.propagateChanges(
      nodes,
      edges,
      [{ nodeId: 'sig-x', newValue: 30 }, { nodeId: 'sig-y', newValue: 5 }],
    );

    const sumUpdate = propagation.updatedNodes.find(u => u.nodeId === 'comp-sum');
    expect(sumUpdate).toBeTruthy();
    expect(sumUpdate!.newValue).toBe(35); // 30 + 5

    const diffUpdate = propagation.updatedNodes.find(u => u.nodeId === 'comp-diff');
    expect(diffUpdate).toBeTruthy();
    expect(diffUpdate!.newValue).toBe(25); // 30 - 5

    expect(propagation.triggeredEffects).toContain('eff-log');
    expect(propagation.triggeredEffects).toContain('eff-alert');

    // Step 3: Run scenario and verify pass
    const scenario: SimulationScenario = {
      id: 'sc-e2e',
      description: 'end-to-end validation',
      signalChanges: [
        { nodeId: 'sig-x', newValue: 100 },
        { nodeId: 'sig-y', newValue: 40 },
      ],
      expectedOutputs: [
        { nodeId: 'comp-sum', expectedValue: 140 },
        { nodeId: 'comp-diff', expectedValue: 60 },
      ],
    };

    const scenarioResult = service.runScenario(nodes, edges, scenario);
    expect(scenarioResult.passed).toBe(true);
    expect(scenarioResult.results.every(r => r.match)).toBe(true);
  });

  // =========================================================================
  // Test 8: Reset clears state between tests
  // =========================================================================
  it('8. reset clears state completely between scenarios', () => {
    // Build a graph and propagate
    service.addNode(sig('sig-1', 'count', 0));
    service.addNode(comp('comp-1', 'double', 'count * 2', ['sig-1']));
    service.addEdge(edge('sig-1', 'comp-1'));
    service.propagateChange('sig-1', 5);

    // Reset
    service.reset();
    const graphAfterReset = service.getGraph()();
    expect(graphAfterReset.nodes.size).toBe(0);
    expect(graphAfterReset.edges.length).toBe(0);

    // Build a completely different graph
    service.addNode(sig('sig-a', 'a', 100));
    service.addNode(sig('sig-b', 'b', 200));
    service.addNode(comp('comp-total', 'total', 'a + b', ['sig-a', 'sig-b']));
    service.addEdge(edge('sig-a', 'comp-total'));
    service.addEdge(edge('sig-b', 'comp-total'));

    // Run scenario on the new graph — results should be independent
    const graph = service.getGraph()();
    const nodes = Array.from(graph.nodes.values());
    const edges = graph.edges;

    const scenario: SimulationScenario = {
      id: 'sc-reset',
      description: 'post-reset scenario',
      signalChanges: [
        { nodeId: 'sig-a', newValue: 7 },
        { nodeId: 'sig-b', newValue: 3 },
      ],
      expectedOutputs: [
        { nodeId: 'comp-total', expectedValue: 10 },
      ],
    };

    const result = service.runScenario(nodes, edges, scenario);
    expect(result.passed).toBe(true);
    expect(result.results[0].match).toBe(true);
    expect(result.results[0].actual).toBe(10);
  });
});
