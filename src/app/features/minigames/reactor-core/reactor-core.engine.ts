import { signal, type Signal } from '@angular/core';
import { MinigameEngine, type ActionResult } from '../../../core/minigame/minigame-engine';
import type { MinigameEngineConfig } from '../../../core/minigame/minigame-engine';
import { MinigameStatus } from '../../../core/minigame/minigame.types';
import type {
  ReactorCoreLevelData,
  ReactorNode,
  RuntimeReactorNode,
  GraphEdge,
  GraphValidationResult,
  SimulationScenario,
  GraphConstraint,
  ValidGraph,
  SignalChange,
  PropagationResult,
  ScenarioResult,
} from './reactor-core.types';
import { hasCycle, wouldCreateCycle } from './reactor-core.types';

// ---------------------------------------------------------------------------
// Action types
// ---------------------------------------------------------------------------

export interface AddNodeAction {
  readonly type: 'add-node';
  readonly nodeId: string;
}

export interface RemoveNodeAction {
  readonly type: 'remove-node';
  readonly nodeId: string;
}

export interface ConnectEdgeAction {
  readonly type: 'connect-edge';
  readonly sourceId: string;
  readonly targetId: string;
}

export interface DisconnectEdgeAction {
  readonly type: 'disconnect-edge';
  readonly sourceId: string;
  readonly targetId: string;
}

export interface SetSignalValueAction {
  readonly type: 'set-signal-value';
  readonly nodeId: string;
  readonly value: string | number | boolean;
}

export interface SetNodePositionAction {
  readonly type: 'set-node-position';
  readonly nodeId: string;
  readonly x: number;
  readonly y: number;
}

export type ReactorCoreAction =
  | AddNodeAction
  | RemoveNodeAction
  | ConnectEdgeAction
  | DisconnectEdgeAction
  | SetSignalValueAction
  | SetNodePositionAction;

// ---------------------------------------------------------------------------
// Type guards
// ---------------------------------------------------------------------------

function isAddNodeAction(action: unknown): action is AddNodeAction {
  return (
    typeof action === 'object' &&
    action !== null &&
    (action as AddNodeAction).type === 'add-node' &&
    typeof (action as AddNodeAction).nodeId === 'string'
  );
}

function isRemoveNodeAction(action: unknown): action is RemoveNodeAction {
  return (
    typeof action === 'object' &&
    action !== null &&
    (action as RemoveNodeAction).type === 'remove-node' &&
    typeof (action as RemoveNodeAction).nodeId === 'string'
  );
}

function isConnectEdgeAction(action: unknown): action is ConnectEdgeAction {
  return (
    typeof action === 'object' &&
    action !== null &&
    (action as ConnectEdgeAction).type === 'connect-edge' &&
    typeof (action as ConnectEdgeAction).sourceId === 'string' &&
    typeof (action as ConnectEdgeAction).targetId === 'string'
  );
}

function isDisconnectEdgeAction(action: unknown): action is DisconnectEdgeAction {
  return (
    typeof action === 'object' &&
    action !== null &&
    (action as DisconnectEdgeAction).type === 'disconnect-edge' &&
    typeof (action as DisconnectEdgeAction).sourceId === 'string' &&
    typeof (action as DisconnectEdgeAction).targetId === 'string'
  );
}

function isSetSignalValueAction(action: unknown): action is SetSignalValueAction {
  return (
    typeof action === 'object' &&
    action !== null &&
    (action as SetSignalValueAction).type === 'set-signal-value' &&
    typeof (action as SetSignalValueAction).nodeId === 'string'
  );
}

function isSetNodePositionAction(action: unknown): action is SetNodePositionAction {
  return (
    typeof action === 'object' &&
    action !== null &&
    (action as SetNodePositionAction).type === 'set-node-position' &&
    typeof (action as SetNodePositionAction).nodeId === 'string' &&
    typeof (action as SetNodePositionAction).x === 'number' &&
    typeof (action as SetNodePositionAction).y === 'number'
  );
}

// ---------------------------------------------------------------------------
// SimulationRunResult type
// ---------------------------------------------------------------------------

export interface SimulationRunResult {
  readonly scenarioResults: readonly ScenarioResult[];
  readonly allPassed: boolean;
  readonly failedCount: number;
}

// ---------------------------------------------------------------------------
// Service interface (for future T-2026-438)
// ---------------------------------------------------------------------------

export interface ReactorCoreSimulationService {
  propagateChanges(
    nodes: readonly RuntimeReactorNode[],
    edges: readonly GraphEdge[],
    changes: readonly SignalChange[],
  ): PropagationResult;
  runScenario(
    nodes: readonly RuntimeReactorNode[],
    edges: readonly GraphEdge[],
    scenario: SimulationScenario,
  ): ScenarioResult;
  reset?(): void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const PERFECT_SCORE_MULTIPLIER = 1.0;
export const SECOND_ATTEMPT_MULTIPLIER = 0.4;
export const THIRD_ATTEMPT_MULTIPLIER = 0.2;
export const DEFAULT_MAX_SIMULATIONS = 3;

const INVALID_NO_CHANGE: ActionResult = { valid: false, scoreChange: 0, livesChange: 0 };
const VALID_NO_CHANGE: ActionResult = { valid: true, scoreChange: 0, livesChange: 0 };

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

/**
 * Evaluate a computation expression with variables from the scope.
 * Uses Function constructor. Returns 0 on error.
 */
function evaluateExpression(
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

/**
 * Topological sort of a subset of nodes using Kahn's algorithm.
 * Only includes nodes reachable from the given `startNodeIds` via edges.
 */
function topologicalSort(
  startNodeIds: readonly string[],
  allNodeIds: readonly string[],
  edges: readonly GraphEdge[],
): string[] {
  // First, find all reachable node IDs from startNodeIds via BFS
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

  // Now run Kahn's algorithm on the reachable subgraph
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

/**
 * Create a RuntimeReactorNode from a level-data ReactorNode.
 */
function createRuntimeNode(node: ReactorNode): RuntimeReactorNode {
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

/**
 * Approximate equality for scenario comparison.
 * Numbers use tolerance 0.01; strings/booleans use strict equality.
 */
function approximatelyEqual(
  actual: string | number | boolean,
  expected: string | number | boolean,
): boolean {
  if (typeof actual === 'number' && typeof expected === 'number') {
    return Math.abs(actual - expected) < 0.01;
  }
  return actual === expected;
}

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export class ReactorCoreEngine extends MinigameEngine<ReactorCoreLevelData> {
  // --- Private writable signals ---
  private readonly _nodes = signal<readonly RuntimeReactorNode[]>([]);
  private readonly _edges = signal<readonly GraphEdge[]>([]);
  private readonly _validationResult = signal<GraphValidationResult | null>(null);
  private readonly _simulationResult = signal<SimulationRunResult | null>(null);
  private readonly _simulationCount = signal(0);
  private readonly _simulationsRemaining = signal(DEFAULT_MAX_SIMULATIONS);

  // --- Private state ---
  private _requiredNodes: readonly ReactorNode[] = [];
  private _scenarios: readonly SimulationScenario[] = [];
  private _validGraphs: readonly ValidGraph[] = [];
  private _constraints: GraphConstraint = { maxNodes: 0, requiredNodeTypes: [] };
  private _nodeMap = new Map<string, RuntimeReactorNode>();
  private readonly _simulationService: ReactorCoreSimulationService | undefined;

  // --- Public read-only signals ---
  readonly nodes: Signal<readonly RuntimeReactorNode[]> = this._nodes.asReadonly();
  readonly edges: Signal<readonly GraphEdge[]> = this._edges.asReadonly();
  readonly validationResult: Signal<GraphValidationResult | null> = this._validationResult.asReadonly();
  readonly simulationResult: Signal<SimulationRunResult | null> = this._simulationResult.asReadonly();
  readonly simulationCount: Signal<number> = this._simulationCount.asReadonly();
  readonly simulationsRemaining: Signal<number> = this._simulationsRemaining.asReadonly();

  constructor(config?: Partial<MinigameEngineConfig>, simulationService?: ReactorCoreSimulationService) {
    super(config);
    this._simulationService = simulationService;
  }

  // --- Lifecycle hooks ---

  protected onLevelLoad(data: ReactorCoreLevelData): void {
    this._requiredNodes = data.requiredNodes;
    this._scenarios = data.scenarios;
    this._validGraphs = data.validGraphs;
    this._constraints = data.constraints;
    this._nodes.set([]);
    this._edges.set([]);
    this._validationResult.set(null);
    this._simulationResult.set(null);
    this._simulationCount.set(0);
    this._simulationsRemaining.set(DEFAULT_MAX_SIMULATIONS);
    this._nodeMap = new Map();

    this._simulationService?.reset?.();
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  protected onStart(): void {}

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  protected onComplete(): void {}

  // --- Action validation ---

  protected validateAction(action: unknown): ActionResult {
    if (isAddNodeAction(action)) return this.handleAddNode(action);
    if (isRemoveNodeAction(action)) return this.handleRemoveNode(action);
    if (isConnectEdgeAction(action)) return this.handleConnectEdge(action);
    if (isDisconnectEdgeAction(action)) return this.handleDisconnectEdge(action);
    if (isSetSignalValueAction(action)) return this.handleSetSignalValue(action);
    if (isSetNodePositionAction(action)) return this.handleSetNodePosition(action);
    return INVALID_NO_CHANGE;
  }

  // --- Graph validation ---

  validateGraph(): GraphValidationResult {
    const nodes = this._nodes();
    const edges = this._edges();
    const nodeIds = nodes.map(n => n.id);

    // Check cycles
    const cycles: string[][] = [];
    if (hasCycle(edges, nodeIds)) {
      cycles.push(nodeIds);
    }

    // Check orphaned nodes: non-signal nodes with no inbound edges
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
      if (node.type === 'computed' || node.type === 'effect' || node.type === 'to-signal' || node.type === 'to-observable' || node.type === 'resource') {
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
    const result: GraphValidationResult = { valid, cycles, orphanedNodes, missingDependencies };
    this._validationResult.set(result);
    return result;
  }

  // --- Simulation ---

  runSimulation(): SimulationRunResult | null {
    if (this.status() !== MinigameStatus.Playing) return null;

    this._simulationCount.update(c => c + 1);
    this._simulationsRemaining.update(v => v - 1);

    const nodes = this._nodes();
    const edges = this._edges();
    const scenarios = this._scenarios;

    // Empty scenarios: all pass immediately
    if (scenarios.length === 0) {
      const result: SimulationRunResult = { scenarioResults: [], allPassed: true, failedCount: 0 };
      this._simulationResult.set(result);
      const score = this.calculateScore();
      this.addScore(score);
      this.complete();
      return result;
    }

    const scenarioResults: ScenarioResult[] = scenarios.map(scenario => {
      if (this._simulationService) {
        return this._simulationService.runScenario(nodes, edges, scenario);
      }
      return this.inlineRunScenario(nodes, edges, scenario);
    });

    const allPassed = scenarioResults.every(r => r.passed);
    const failedCount = scenarioResults.filter(r => !r.passed).length;
    const result: SimulationRunResult = { scenarioResults, allPassed, failedCount };
    this._simulationResult.set(result);

    if (allPassed) {
      const score = this.calculateScore();
      this.addScore(score);
      this.complete();
    } else if (this._simulationsRemaining() <= 0) {
      this.fail();
    }

    return result;
  }

  // --- Private action handlers ---

  private handleAddNode(action: AddNodeAction): ActionResult {
    const template = this._requiredNodes.find(n => n.id === action.nodeId);
    if (!template) return INVALID_NO_CHANGE;

    const alreadyPlaced = this._nodes().some(n => n.id === action.nodeId);
    if (alreadyPlaced) return INVALID_NO_CHANGE;

    const runtimeNode = createRuntimeNode(template);
    this._nodes.update(nodes => [...nodes, runtimeNode]);
    this.rebuildNodeMap();
    return VALID_NO_CHANGE;
  }

  private handleRemoveNode(action: RemoveNodeAction): ActionResult {
    const nodes = this._nodes();
    const exists = nodes.some(n => n.id === action.nodeId);
    if (!exists) return INVALID_NO_CHANGE;

    this._nodes.set(nodes.filter(n => n.id !== action.nodeId));
    this._edges.update(edges =>
      edges.filter(e => e.sourceId !== action.nodeId && e.targetId !== action.nodeId),
    );
    this.rebuildNodeMap();
    return VALID_NO_CHANGE;
  }

  private handleConnectEdge(action: ConnectEdgeAction): ActionResult {
    const sourceExists = this._nodeMap.has(action.sourceId);
    const targetExists = this._nodeMap.has(action.targetId);
    if (!sourceExists || !targetExists) return INVALID_NO_CHANGE;

    const edges = this._edges();
    const duplicate = edges.some(
      e => e.sourceId === action.sourceId && e.targetId === action.targetId,
    );
    if (duplicate) return INVALID_NO_CHANGE;

    const newEdge: GraphEdge = { sourceId: action.sourceId, targetId: action.targetId };
    const nodeIds = this._nodes().map(n => n.id);
    if (wouldCreateCycle(edges, newEdge, nodeIds)) return INVALID_NO_CHANGE;

    this._edges.update(current => [...current, newEdge]);
    return VALID_NO_CHANGE;
  }

  private handleDisconnectEdge(action: DisconnectEdgeAction): ActionResult {
    const edges = this._edges();
    const exists = edges.some(
      e => e.sourceId === action.sourceId && e.targetId === action.targetId,
    );
    if (!exists) return INVALID_NO_CHANGE;

    this._edges.set(
      edges.filter(e => !(e.sourceId === action.sourceId && e.targetId === action.targetId)),
    );
    return VALID_NO_CHANGE;
  }

  private handleSetSignalValue(action: SetSignalValueAction): ActionResult {
    const node = this._nodeMap.get(action.nodeId);
    if (!node) return INVALID_NO_CHANGE;
    if (node.type !== 'signal' && node.type !== 'linked-signal') return INVALID_NO_CHANGE;

    this._nodes.update(nodes =>
      nodes.map(n =>
        n.id === action.nodeId
          ? { ...n, currentValue: action.value }
          : n,
      ),
    );
    this.rebuildNodeMap();
    return VALID_NO_CHANGE;
  }

  private handleSetNodePosition(action: SetNodePositionAction): ActionResult {
    const node = this._nodeMap.get(action.nodeId);
    if (!node) return INVALID_NO_CHANGE;

    this._nodes.update(nodes =>
      nodes.map(n =>
        n.id === action.nodeId
          ? { ...n, position: { x: action.x, y: action.y } }
          : n,
      ),
    );
    this.rebuildNodeMap();
    return VALID_NO_CHANGE;
  }

  // --- Private helpers ---

  private rebuildNodeMap(): void {
    this._nodeMap = new Map(this._nodes().map(n => [n.id, n]));
  }

  private inlineRunScenario(
    nodes: readonly RuntimeReactorNode[],
    edges: readonly GraphEdge[],
    scenario: SimulationScenario,
  ): ScenarioResult {
    // Clone node values for this scenario
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

    // 2. Handle linked-signal nodes: copy from linked source if source changed
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

    // 3. Topological sort of nodes reachable from changed signals (not the signals themselves)
    const allNodeIds = nodes.map(n => n.id);
    const sorted = topologicalSort(changedSignalIds, allNodeIds, edges);

    // 4. Process nodes in topological order
    const triggeredEffects: string[] = [];
    for (const nodeId of sorted) {
      // Skip the initial changed signal nodes (they already have new values)
      if (changedSignalIds.includes(nodeId)) continue;

      const node = nodeMap.get(nodeId);
      if (!node) continue;

      if (node.type === 'computed') {
        // Build scope from dependencies via edges
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
        const result = evaluateExpression(node.computationExpr, scope);
        nodeValues.set(nodeId, result);
      } else if (node.type === 'effect') {
        triggeredEffects.push(nodeId);
      } else if (node.type === 'linked-signal') {
        // Already handled above, but also handle transitive linked signals
        if (node.linkedToId) {
          const sourceValue = nodeValues.get(node.linkedToId);
          if (sourceValue !== undefined) {
            nodeValues.set(nodeId, sourceValue);
          }
        }
      } else if (node.type === 'to-signal') {
        // Pass-through from dependencies
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
        // Pass-through from dependencies, update resource state
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
      // to-observable nodes have NO currentValue -- skip them
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
      const match = approximatelyEqual(actual, expected.expectedValue);
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

  // --- Scoring ---

  private calculateScore(): number {
    const maxScore = this.config.maxScore;
    const count = this._simulationCount();

    if (count === 1) return Math.round(maxScore * PERFECT_SCORE_MULTIPLIER);
    if (count === 2) return Math.round(maxScore * SECOND_ATTEMPT_MULTIPLIER);
    return Math.round(maxScore * THIRD_ATTEMPT_MULTIPLIER);
  }
}
