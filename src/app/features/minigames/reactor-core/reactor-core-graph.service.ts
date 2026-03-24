// ---------------------------------------------------------------------------
// ReactorCoreGraphServiceImpl — signal graph editing, validation, propagation
// ---------------------------------------------------------------------------
// NOT providedIn: 'root'. This service is scoped to the Reactor Core
// component tree. Providing it locally ensures automatic cleanup on
// component destroy and prevents leaked state between minigame sessions.
// ---------------------------------------------------------------------------

import { Injectable, computed, signal, type Signal } from '@angular/core';
import type { ReactorCoreSimulationService } from './reactor-core.engine';
import type {
  ReactorNode,
  RuntimeReactorNode,
  GraphEdge,
  GraphValidationResult,
  PropagationResult,
  ScenarioResult,
  SimulationScenario,
  SignalChange,
} from './reactor-core.types';
import { hasCycle, wouldCreateCycle } from './reactor-core.types';

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

@Injectable()
export class ReactorCoreGraphServiceImpl implements ReactorCoreSimulationService {
  // --- Internal state ---
  private readonly _nodes = signal<Map<string, RuntimeReactorNode>>(new Map());
  private readonly _edges = signal<GraphEdge[]>([]);

  // --- Computed graph signal ---
  private readonly _graph = computed(() => ({
    nodes: this._nodes(),
    edges: this._edges(),
  }));

  // =========================================================================
  // Graph editing methods
  // =========================================================================

  addNode(node: ReactorNode): void {
    const current = this._nodes();
    if (current.has(node.id)) return;

    const runtimeNode = this.createRuntimeNode(node);
    const next = new Map(current);
    next.set(node.id, runtimeNode);
    this._nodes.set(next);
  }

  removeNode(nodeId: string): void {
    const current = this._nodes();
    if (!current.has(nodeId)) return;

    const next = new Map(current);
    next.delete(nodeId);
    this._nodes.set(next);

    this._edges.update(edges =>
      edges.filter(e => e.sourceId !== nodeId && e.targetId !== nodeId),
    );
  }

  addEdge(edge: GraphEdge): boolean {
    const nodes = this._nodes();
    if (!nodes.has(edge.sourceId) || !nodes.has(edge.targetId)) return false;

    const edges = this._edges();
    const duplicate = edges.some(
      e => e.sourceId === edge.sourceId && e.targetId === edge.targetId,
    );
    if (duplicate) return false;

    const nodeIds = Array.from(nodes.keys());
    if (wouldCreateCycle(edges, edge, nodeIds)) return false;

    this._edges.update(current => [...current, edge]);
    return true;
  }

  removeEdge(sourceId: string, targetId: string): void {
    this._edges.update(edges =>
      edges.filter(e => !(e.sourceId === sourceId && e.targetId === targetId)),
    );
  }

  // =========================================================================
  // Validation and detection
  // =========================================================================

  validateGraph(): GraphValidationResult {
    const nodes = Array.from(this._nodes().values());
    const edges = this._edges();
    const nodeIds = nodes.map(n => n.id);

    // Check cycles
    const cycles: string[][] = [];
    if (hasCycle(edges, nodeIds)) {
      cycles.push(nodeIds);
    }

    // Check orphaned nodes: non-signal nodes with no inbound or outbound edges
    const sourceTypes = new Set(['signal']);
    const orphanedNodes: string[] = [];
    for (const node of nodes) {
      if (sourceTypes.has(node.type)) continue;
      const hasInbound = edges.some(e => e.targetId === node.id);
      const hasOutbound = edges.some(e => e.sourceId === node.id);
      if (!hasInbound && !hasOutbound) {
        orphanedNodes.push(node.id);
      }
    }

    // Check missing dependencies
    const missingDependencies: { nodeId: string; missingDepId: string }[] = [];
    for (const node of nodes) {
      if (
        node.type === 'computed' ||
        node.type === 'effect' ||
        node.type === 'to-signal' ||
        node.type === 'to-observable' ||
        node.type === 'resource'
      ) {
        const deps = (node as { dependencyIds: readonly string[] }).dependencyIds;
        for (const depId of deps) {
          const hasEdge = edges.some(e => e.sourceId === depId && e.targetId === node.id);
          if (!hasEdge) {
            missingDependencies.push({ nodeId: node.id, missingDepId: depId });
          }
        }
      }
    }

    const valid = cycles.length === 0 && orphanedNodes.length === 0 && missingDependencies.length === 0;
    return { valid, cycles, orphanedNodes, missingDependencies };
  }

  detectCycle(fromId: string, toId: string): boolean {
    const nodeIds = Array.from(this._nodes().keys());
    return wouldCreateCycle(this._edges(), { sourceId: fromId, targetId: toId }, nodeIds);
  }

  // =========================================================================
  // State accessors
  // =========================================================================

  getGraph(): Signal<{ nodes: Map<string, RuntimeReactorNode>; edges: GraphEdge[] }> {
    return this._graph;
  }

  reset(): void {
    this._nodes.set(new Map());
    this._edges.set([]);
  }

  // =========================================================================
  // Convenience method
  // =========================================================================

  propagateChange(nodeId: string, newValue: string | number | boolean): PropagationResult {
    const nodes = Array.from(this._nodes().values());
    const edges = this._edges();
    return this.propagateChanges(nodes, edges, [{ nodeId, newValue }]);
  }

  // =========================================================================
  // SimulationService interface
  // =========================================================================

  propagateChanges(
    nodes: readonly RuntimeReactorNode[],
    edges: readonly GraphEdge[],
    changes: readonly SignalChange[],
  ): PropagationResult {
    // Clone node values
    const nodeValues = new Map<string, string | number | boolean>();
    for (const n of nodes) {
      if ('currentValue' in n) {
        nodeValues.set(n.id, n.currentValue);
      }
    }

    // Apply signal changes
    const changedSignalIds: string[] = [];
    for (const change of changes) {
      nodeValues.set(change.nodeId, change.newValue);
      changedSignalIds.push(change.nodeId);
    }

    // Handle linked-signal nodes
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    for (const n of nodes) {
      if (n.type === 'linked-signal') {
        if (changedSignalIds.includes(n.linkedToId)) {
          const sourceValue = nodeValues.get(n.linkedToId);
          if (sourceValue !== undefined) {
            nodeValues.set(n.id, sourceValue);
          }
        }
      }
    }

    // Topological sort from changed signals
    const allNodeIds = nodes.map(n => n.id);
    const sorted = this.topologicalSort(changedSignalIds, allNodeIds, edges);

    // Process nodes in topological order
    const updatedNodes: PropagationResult['updatedNodes'] = [];
    const triggeredEffects: string[] = [];

    for (const nodeId of sorted) {
      if (changedSignalIds.includes(nodeId)) continue;

      const node = nodeMap.get(nodeId);
      if (!node) continue;

      if (node.type === 'computed') {
        const scope: Record<string, string | number | boolean> = {};
        for (const edge of edges) {
          if (edge.targetId === nodeId) {
            const depNode = nodeMap.get(edge.sourceId);
            if (depNode) {
              const val = nodeValues.get(edge.sourceId);
              if (val !== undefined) {
                scope[depNode.label] = val;
              }
            }
          }
        }
        const oldValue = nodeValues.get(nodeId) ?? 0;
        const newValue = this.evaluateExpression(node.computationExpr, scope);
        nodeValues.set(nodeId, newValue);
        updatedNodes.push({
          nodeId,
          oldValue: oldValue as string | number | boolean,
          newValue: newValue as string | number | boolean,
        });
      } else if (node.type === 'effect') {
        triggeredEffects.push(nodeId);
      } else if (node.type === 'linked-signal') {
        if (node.linkedToId) {
          const sourceValue = nodeValues.get(node.linkedToId);
          if (sourceValue !== undefined) {
            const oldValue = nodeValues.get(nodeId) ?? 0;
            nodeValues.set(nodeId, sourceValue);
            updatedNodes.push({ nodeId, oldValue: oldValue as string | number | boolean, newValue: sourceValue });
          }
        }
      } else if (node.type === 'to-signal') {
        for (const edge of edges) {
          if (edge.targetId === nodeId) {
            const val = nodeValues.get(edge.sourceId);
            if (val !== undefined) {
              const oldValue = nodeValues.get(nodeId) ?? 0;
              nodeValues.set(nodeId, val);
              updatedNodes.push({ nodeId, oldValue: oldValue as string | number | boolean, newValue: val });
              break;
            }
          }
        }
      } else if (node.type === 'resource') {
        for (const edge of edges) {
          if (edge.targetId === nodeId) {
            const val = nodeValues.get(edge.sourceId);
            if (val !== undefined) {
              const oldValue = nodeValues.get(nodeId) ?? 0;
              nodeValues.set(nodeId, val);
              updatedNodes.push({ nodeId, oldValue: oldValue as string | number | boolean, newValue: val });
              break;
            }
          }
        }
      }
      // to-observable nodes have NO currentValue -- skip them
    }

    return { updatedNodes, triggeredEffects };
  }

  runScenario(
    nodes: readonly RuntimeReactorNode[],
    edges: readonly GraphEdge[],
    scenario: SimulationScenario,
  ): ScenarioResult {
    // Clone node values
    const nodeValues = new Map<string, string | number | boolean>();
    for (const n of nodes) {
      if ('currentValue' in n) {
        nodeValues.set(n.id, n.currentValue);
      }
    }

    // Track resource states
    const resourceStates = new Map<string, string>();
    for (const n of nodes) {
      if (n.type === 'resource') {
        resourceStates.set(n.id, n.resourceState);
      }
    }

    // 1. Apply signal changes
    const changedSignalIds: string[] = [];
    for (const change of scenario.signalChanges) {
      nodeValues.set(change.nodeId, change.newValue);
      changedSignalIds.push(change.nodeId);
    }

    // 2. Handle linked-signal nodes
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    for (const n of nodes) {
      if (n.type === 'linked-signal') {
        if (changedSignalIds.includes(n.linkedToId)) {
          const sourceValue = nodeValues.get(n.linkedToId);
          if (sourceValue !== undefined) {
            nodeValues.set(n.id, sourceValue);
          }
        }
      }
    }

    // 3. Topological sort
    const allNodeIds = nodes.map(n => n.id);
    const sorted = this.topologicalSort(changedSignalIds, allNodeIds, edges);

    // 4. Process nodes in topological order
    const triggeredEffects: string[] = [];
    for (const nodeId of sorted) {
      if (changedSignalIds.includes(nodeId)) continue;

      const node = nodeMap.get(nodeId);
      if (!node) continue;

      if (node.type === 'computed') {
        const scope: Record<string, string | number | boolean> = {};
        for (const edge of edges) {
          if (edge.targetId === nodeId) {
            const depNode = nodeMap.get(edge.sourceId);
            if (depNode) {
              const val = nodeValues.get(edge.sourceId);
              if (val !== undefined) {
                scope[depNode.label] = val;
              }
            }
          }
        }
        const result = this.evaluateExpression(node.computationExpr, scope);
        nodeValues.set(nodeId, result);
      } else if (node.type === 'effect') {
        triggeredEffects.push(nodeId);
      } else if (node.type === 'linked-signal') {
        if (node.linkedToId) {
          const sourceValue = nodeValues.get(node.linkedToId);
          if (sourceValue !== undefined) {
            nodeValues.set(nodeId, sourceValue);
          }
        }
      } else if (node.type === 'to-signal') {
        for (const edge of edges) {
          if (edge.targetId === nodeId) {
            const val = nodeValues.get(edge.sourceId);
            if (val !== undefined) {
              nodeValues.set(nodeId, val);
              break;
            }
          }
        }
      } else if (node.type === 'resource') {
        for (const edge of edges) {
          if (edge.targetId === nodeId) {
            const val = nodeValues.get(edge.sourceId);
            if (val !== undefined) {
              nodeValues.set(nodeId, val);
              resourceStates.set(nodeId, 'value');
              break;
            }
          }
        }
      }
    }

    // 5. Compare expected outputs
    const results: ScenarioResult['results'][number][] = [];
    for (const expected of scenario.expectedOutputs) {
      const node = nodeMap.get(expected.nodeId);
      if (!node) {
        results.push({
          nodeId: expected.nodeId,
          expected: expected.expectedValue,
          actual: 0,
          match: false,
        });
        continue;
      }

      // Resource nodes with expectedState: compare state string
      if (expected.expectedState && node.type === 'resource') {
        const actualState = resourceStates.get(expected.nodeId) ?? 'loading';
        const match = actualState === expected.expectedState;
        results.push({
          nodeId: expected.nodeId,
          expected: expected.expectedValue,
          actual: actualState,
          match,
        });
        continue;
      }

      const actual = nodeValues.get(expected.nodeId) ?? 0;
      const match = this.approximatelyEqual(actual, expected.expectedValue);
      results.push({
        nodeId: expected.nodeId,
        expected: expected.expectedValue,
        actual,
        match,
      });
    }

    const passed = results.every(r => r.match);
    return { passed, results };
  }

  // =========================================================================
  // Private helpers (extracted from engine)
  // =========================================================================

  private evaluateExpression(
    expr: string,
    scope: Record<string, string | number | boolean>,
  ): string | number | boolean {
    try {
      const keys = Object.keys(scope);
      const values = keys.map(k => scope[k]);
      const fn = new Function(...keys, `return (${expr});`);
      const result: unknown = fn(...values);
      if (typeof result === 'string' || typeof result === 'number' || typeof result === 'boolean') {
        return result;
      }
      return 0;
    } catch {
      return 0;
    }
  }

  private topologicalSort(
    startNodeIds: readonly string[],
    allNodeIds: readonly string[],
    edges: readonly GraphEdge[],
  ): string[] {
    // BFS to find all reachable nodes
    const adj = new Map<string, string[]>();
    for (const id of allNodeIds) adj.set(id, []);
    for (const e of edges) {
      adj.get(e.sourceId)?.push(e.targetId);
    }

    const reachable = new Set<string>();
    const queue = [...startNodeIds];
    while (queue.length > 0) {
      const current = queue.shift()!;
      if (reachable.has(current)) continue;
      reachable.add(current);
      for (const neighbor of adj.get(current) ?? []) {
        if (!reachable.has(neighbor)) {
          queue.push(neighbor);
        }
      }
    }

    // Kahn's algorithm on reachable subgraph
    const subEdges = edges.filter(e => reachable.has(e.sourceId) && reachable.has(e.targetId));
    const inDegree = new Map<string, number>();
    for (const id of reachable) inDegree.set(id, 0);
    for (const e of subEdges) {
      inDegree.set(e.targetId, (inDegree.get(e.targetId) ?? 0) + 1);
    }

    const subAdj = new Map<string, string[]>();
    for (const id of reachable) subAdj.set(id, []);
    for (const e of subEdges) {
      subAdj.get(e.sourceId)?.push(e.targetId);
    }

    const kahnQueue: string[] = [];
    for (const [id, deg] of inDegree) {
      if (deg === 0) kahnQueue.push(id);
    }

    const sorted: string[] = [];
    while (kahnQueue.length > 0) {
      const node = kahnQueue.shift()!;
      sorted.push(node);
      for (const neighbor of subAdj.get(node) ?? []) {
        const newDeg = (inDegree.get(neighbor) ?? 1) - 1;
        inDegree.set(neighbor, newDeg);
        if (newDeg === 0) kahnQueue.push(neighbor);
      }
    }

    return sorted;
  }

  private createRuntimeNode(node: ReactorNode): RuntimeReactorNode {
    const position = { x: 0, y: 0 };

    switch (node.type) {
      case 'signal':
        return { ...node, currentValue: node.initialValue, position };
      case 'computed':
        return { ...node, currentValue: 0, position };
      case 'effect':
        return { ...node, position, cleanupFn: null };
      case 'linked-signal':
        return { ...node, currentValue: node.initialValue, position };
      case 'to-signal':
        return { ...node, currentValue: 0, position };
      case 'to-observable':
        return { ...node, position };
      case 'resource':
        return { ...node, currentValue: 0, position, resourceState: 'loading' as const };
    }
  }

  private approximatelyEqual(
    actual: string | number | boolean,
    expected: string | number | boolean,
  ): boolean {
    if (typeof actual === 'number' && typeof expected === 'number') {
      return Math.abs(actual - expected) < 0.01;
    }
    return actual === expected;
  }
}
