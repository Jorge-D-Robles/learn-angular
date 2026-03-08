// ---------------------------------------------------------------------------
// Canonical domain model types for Flow Commander minigame
// ---------------------------------------------------------------------------

/** A 2D position for node placement on the pipeline canvas. */
export interface NodePosition {
  readonly x: number;
  readonly y: number;
}

/** The 4 pipeline node types. */
export type PipelineNodeType = 'source' | 'junction' | 'gate-slot' | 'target-zone';

/** A node in the pipeline graph. */
export interface PipelineNode {
  readonly id: string;
  readonly nodeType: PipelineNodeType;
  readonly position: NodePosition;
  readonly label: string;
}

/** A directed edge connecting two pipeline nodes. */
export interface PipelineEdge {
  readonly id: string;
  readonly sourceNodeId: string;
  readonly targetNodeId: string;
}

/** The directed graph representing a pipeline layout. */
export interface PipelineGraph {
  readonly nodes: readonly PipelineNode[];
  readonly edges: readonly PipelineEdge[];
}

/** The 3 control-flow gate types the player can place. */
export enum GateType {
  if = 'if',
  for = 'for',
  switch = 'switch',
}

/** Configuration for a gate placed at a gate-slot node. */
export interface GateConfig {
  readonly gateType: GateType;
  readonly condition: string;
  /** Node IDs of connected upstream nodes feeding into this gate. */
  readonly inputs: readonly string[];
  /** Node IDs of downstream nodes this gate routes cargo to. */
  readonly outputs: readonly string[];
}

/** Priority levels for cargo items. */
export type CargoPriority = 'low' | 'medium' | 'high';

/** A cargo item flowing through the pipeline. */
export interface CargoItem {
  readonly id: string;
  readonly color: string;
  readonly label: string;
  readonly type: string;
  readonly priority: CargoPriority;
}

/** Filter criteria for a target zone — items must match all specified fields. */
export interface TargetZone {
  readonly id: string;
  readonly nodeId: string;
  readonly label: string;
  readonly expectedColor?: string;
  readonly expectedType?: string;
  readonly expectedPriority?: CargoPriority;
}

/** Game-specific level data for Flow Commander. */
export interface FlowCommanderLevelData {
  readonly graph: PipelineGraph;
  readonly cargoItems: readonly CargoItem[];
  readonly availableGateTypes: readonly GateType[];
  readonly targetZones: readonly TargetZone[];
}

// ---------------------------------------------------------------------------
// Gate placement and simulation result types
// ---------------------------------------------------------------------------

/** A gate placed at a gate-slot node by the player. */
export interface PlacedGate {
  readonly nodeId: string;
  readonly gateType: GateType;
  readonly condition: string;
}

/** Routing result for a single cargo item after simulation. */
export interface ItemRoutingResult {
  readonly item: CargoItem;
  readonly path: readonly string[];
  readonly destinationNodeId: string | null;
  readonly targetZoneId: string | null;
  readonly correct: boolean;
}

/** Aggregate simulation result for all cargo items. */
export interface SimulationResult {
  readonly itemResults: readonly ItemRoutingResult[];
  readonly allCorrect: boolean;
  readonly correctCount: number;
  readonly incorrectCount: number;
  readonly lostCount: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Color mapping for each gate type, using Nexus Station theme colors. */
export const GATE_TYPE_COLORS: Readonly<Record<GateType, string>> = {
  [GateType.if]: '#3B82F6',     // Reactor Blue
  [GateType.for]: '#22C55E',    // Sensor Green
  [GateType.switch]: '#A855F7', // Comm Purple
};

// ---------------------------------------------------------------------------
// Utility functions
// ---------------------------------------------------------------------------

/** Type guard that returns true when the given string is a valid GateType. */
export function isValidGateType(value: string): value is GateType {
  return Object.values(GateType).includes(value as GateType);
}

/**
 * Returns all node IDs reachable from the given start node via directed edges (BFS).
 * Uses a visited set to guard against cycles. Only follows edges in the forward direction
 * (sourceNodeId -> targetNodeId). Returns empty array if startNodeId is not found in graph.
 */
export function findConnectedNodes(graph: PipelineGraph, startNodeId: string): readonly string[] {
  const nodeIds = new Set(graph.nodes.map(n => n.id));
  if (!nodeIds.has(startNodeId)) return [];

  const visited = new Set<string>();
  const queue: string[] = [startNodeId];
  const result: string[] = [];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);
    result.push(current);

    for (const edge of graph.edges) {
      if (edge.sourceNodeId === current && !visited.has(edge.targetNodeId)) {
        queue.push(edge.targetNodeId);
      }
    }
  }
  return result;
}
