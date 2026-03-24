// ---------------------------------------------------------------------------
// Canonical domain model types for Reactor Core minigame (level-data subset)
//
// T-2026-273 will extend these interfaces with runtime fields
// (currentValue, position, cleanupFn, etc.) for use by the engine and UI.
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
