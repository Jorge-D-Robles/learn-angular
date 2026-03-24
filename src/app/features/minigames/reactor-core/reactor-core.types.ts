// ---------------------------------------------------------------------------
// Canonical domain model types for Reactor Core minigame
//
// Level-data types (readonly, immutable) define the answer key / level config.
// Runtime types (mutable) extend them with position, currentValue, cleanupFn
// for use by the engine and UI during gameplay.
// ---------------------------------------------------------------------------

/**
 * Node type discriminator covering all Angular Signal concepts.
 * - `'signal'` = writable signal (signal())
 * - `'computed'` = derived signal (computed())
 * - `'effect'` = side-effect node (effect())
 * - `'linked-signal'` = two-way linked signal (linkedSignal())
 * - `'to-signal'` = Observable-to-Signal adapter (toSignal())
 * - `'to-observable'` = Signal-to-Observable adapter (toObservable())
 * - `'resource'` = async resource signal (resource())
 */
export type ReactorNodeType =
  | 'signal'
  | 'computed'
  | 'effect'
  | 'linked-signal'
  | 'to-signal'
  | 'to-observable'
  | 'resource';

/** Base fields shared by all reactor node types. */
export interface ReactorNodeBase {
  readonly id: string;
  readonly type: ReactorNodeType;
  readonly label: string;
}

/** signal() node — holds a mutable value. */
export interface SignalNode extends ReactorNodeBase {
  readonly type: 'signal';
  readonly initialValue: string | number | boolean;
}

/** computed() node — derives a value from other signals. */
export interface ComputedNode extends ReactorNodeBase {
  readonly type: 'computed';
  readonly computationExpr: string;
  readonly dependencyIds: readonly string[];
}

/** effect() node — triggers a side effect when dependencies change. */
export interface EffectNode extends ReactorNodeBase {
  readonly type: 'effect';
  readonly actionDescription: string;
  readonly dependencyIds: readonly string[];
  readonly requiresCleanup?: boolean;
}

/** linkedSignal() node — two-way linked signal. */
export interface LinkedSignalNode extends ReactorNodeBase {
  readonly type: 'linked-signal';
  readonly initialValue: string | number | boolean;
  readonly linkedToId: string;
}

/** toSignal() adapter — bridges Observable to Signal. */
export interface ToSignalNode extends ReactorNodeBase {
  readonly type: 'to-signal';
  readonly sourceDescription: string;
  readonly dependencyIds: readonly string[];
}

/** toObservable() adapter — bridges Signal to Observable. */
export interface ToObservableNode extends ReactorNodeBase {
  readonly type: 'to-observable';
  readonly dependencyIds: readonly string[];
}

/** resource() node — async data loading with loading/error/value states. */
export interface ResourceNode extends ReactorNodeBase {
  readonly type: 'resource';
  readonly requestDescription: string;
  readonly dependencyIds: readonly string[];
}

/** Union of all reactor node types. */
export type ReactorNode =
  | SignalNode
  | ComputedNode
  | EffectNode
  | LinkedSignalNode
  | ToSignalNode
  | ToObservableNode
  | ResourceNode;

/** Directed edge between two nodes (source -> target). */
export interface GraphEdge {
  readonly sourceId: string;
  readonly targetId: string;
}

/** A valid graph configuration (answer key). */
export interface ValidGraph {
  readonly nodes: readonly ReactorNode[];
  readonly edges: readonly GraphEdge[];
}

/** A change to a signal value during simulation. */
export interface SignalChange {
  readonly nodeId: string;
  readonly newValue: string | number | boolean;
}

/** Expected output for a node after simulation. */
export interface ExpectedOutput {
  readonly nodeId: string;
  readonly expectedValue: string | number | boolean;
  readonly expectedState?: 'loading' | 'error' | 'value';
}

/** A simulation scenario (input changes + expected outputs). */
export interface SimulationScenario {
  readonly id: string;
  readonly description: string;
  readonly signalChanges: readonly SignalChange[];
  readonly expectedOutputs: readonly ExpectedOutput[];
}

/** Constraints on the player's graph. */
export interface GraphConstraint {
  readonly maxNodes: number;
  readonly requiredNodeTypes: readonly ReactorNodeType[];
  readonly forbiddenPatterns?: readonly string[];
}

/** Game-specific level data for Reactor Core. */
export interface ReactorCoreLevelData {
  readonly requiredNodes: readonly ReactorNode[];
  readonly scenarios: readonly SimulationScenario[];
  readonly validGraphs: readonly ValidGraph[];
  readonly constraints: GraphConstraint;
}

// ---------------------------------------------------------------------------
// Runtime types — mutable state during gameplay
// ---------------------------------------------------------------------------

/** Position of a node on the graph canvas (mutable for drag). */
export interface NodePosition {
  x: number;
  y: number;
}

/** Runtime signal() node with mutable position and current value. */
export interface RuntimeSignalNode extends SignalNode {
  currentValue: string | number | boolean;
  position: NodePosition;
}

/** Runtime computed() node with mutable position and current value. */
export interface RuntimeComputedNode extends ComputedNode {
  currentValue: string | number | boolean;
  position: NodePosition;
}

/** Runtime effect() node with mutable position and optional cleanup. */
export interface RuntimeEffectNode extends EffectNode {
  position: NodePosition;
  cleanupFn: (() => void) | null;
}

/** Runtime linkedSignal() node with mutable position and current value. */
export interface RuntimeLinkedSignalNode extends LinkedSignalNode {
  currentValue: string | number | boolean;
  position: NodePosition;
}

/** Runtime toSignal() adapter with mutable position and current value. */
export interface RuntimeToSignalNode extends ToSignalNode {
  currentValue: string | number | boolean;
  position: NodePosition;
}

/** Runtime toObservable() adapter with mutable position. */
export interface RuntimeToObservableNode extends ToObservableNode {
  position: NodePosition;
}

/** Runtime resource() node with mutable position, current value, and resource state. */
export interface RuntimeResourceNode extends ResourceNode {
  currentValue: string | number | boolean;
  position: NodePosition;
  resourceState: 'loading' | 'error' | 'value';
}

/** Union of all runtime reactor node types. */
export type RuntimeReactorNode =
  | RuntimeSignalNode
  | RuntimeComputedNode
  | RuntimeEffectNode
  | RuntimeLinkedSignalNode
  | RuntimeToSignalNode
  | RuntimeToObservableNode
  | RuntimeResourceNode;

// ---------------------------------------------------------------------------
// Validation & simulation result types
// ---------------------------------------------------------------------------

/** Result of validating a player's graph structure. */
export interface GraphValidationResult {
  valid: boolean;
  cycles: string[][];
  orphanedNodes: string[];
  missingDependencies: { nodeId: string; missingDepId: string }[];
}

/** Result of propagating a signal change through the graph. */
export interface PropagationResult {
  updatedNodes: { nodeId: string; oldValue: string | number | boolean; newValue: string | number | boolean }[];
  triggeredEffects: string[];
}

/** Result of running a simulation scenario against the player's graph. */
export interface ScenarioResult {
  passed: boolean;
  results: { nodeId: string; expected: string | number | boolean; actual: string | number | boolean; match: boolean }[];
}

// ---------------------------------------------------------------------------
// Graph utility functions
// ---------------------------------------------------------------------------

/**
 * Detects whether a directed graph contains a cycle using DFS with 3-color
 * marking (WHITE=unvisited, GRAY=in-progress, BLACK=done).
 */
export function hasCycle(edges: readonly GraphEdge[], nodeIds: readonly string[]): boolean {
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

/**
 * Returns whether adding `newEdge` to `existingEdges` would create a cycle.
 * Uses spread (not push) to avoid mutating the input array.
 */
export function wouldCreateCycle(
  existingEdges: readonly GraphEdge[],
  newEdge: GraphEdge,
  nodeIds: readonly string[],
): boolean {
  return hasCycle([...existingEdges, newEdge], nodeIds);
}
