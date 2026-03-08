import { signal, type Signal } from '@angular/core';
import { MinigameEngine, type ActionResult } from '../../../core/minigame/minigame-engine';
import type { MinigameEngineConfig } from '../../../core/minigame/minigame-engine';
import { MinigameStatus, type DifficultyTier, type MinigameLevel } from '../../../core/minigame/minigame.types';
import type {
  FlowCommanderLevelData,
  PipelineGraph,
  CargoItem,
  TargetZone,
  GateType,
  PipelineNode,
} from './pipeline.types';
import { evaluateCondition, extractForCount, evaluateSwitchExpression } from './flow-commander.evaluator';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PlacedGate {
  readonly nodeId: string;
  readonly gateType: GateType;
  readonly condition: string;
}

export interface ItemRoutingResult {
  readonly item: CargoItem;
  readonly path: readonly string[];
  readonly destinationNodeId: string | null;
  readonly targetZoneId: string | null;
  readonly correct: boolean;
}

export interface SimulationResult {
  readonly itemResults: readonly ItemRoutingResult[];
  readonly allCorrect: boolean;
  readonly correctCount: number;
  readonly incorrectCount: number;
  readonly lostCount: number;
}

// ---------------------------------------------------------------------------
// Action types
// ---------------------------------------------------------------------------

export interface PlaceGateAction {
  readonly type: 'place-gate';
  readonly nodeId: string;
  readonly gateType: GateType;
  readonly condition: string;
}

export interface RemoveGateAction {
  readonly type: 'remove-gate';
  readonly nodeId: string;
}

export interface ConfigureGateAction {
  readonly type: 'configure-gate';
  readonly nodeId: string;
  readonly condition: string;
}

export type FlowCommanderAction = PlaceGateAction | RemoveGateAction | ConfigureGateAction;

// ---------------------------------------------------------------------------
// Type guards
// ---------------------------------------------------------------------------

function isPlaceGateAction(action: unknown): action is PlaceGateAction {
  return (
    typeof action === 'object' &&
    action !== null &&
    (action as PlaceGateAction).type === 'place-gate' &&
    typeof (action as PlaceGateAction).nodeId === 'string' &&
    typeof (action as PlaceGateAction).condition === 'string'
  );
}

function isRemoveGateAction(action: unknown): action is RemoveGateAction {
  return (
    typeof action === 'object' &&
    action !== null &&
    (action as RemoveGateAction).type === 'remove-gate' &&
    typeof (action as RemoveGateAction).nodeId === 'string'
  );
}

function isConfigureGateAction(action: unknown): action is ConfigureGateAction {
  return (
    typeof action === 'object' &&
    action !== null &&
    (action as ConfigureGateAction).type === 'configure-gate' &&
    typeof (action as ConfigureGateAction).nodeId === 'string' &&
    typeof (action as ConfigureGateAction).condition === 'string'
  );
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const EFFICIENCY_PENALTY_PER_GATE = 0.05;
export const SIMULATION_PENALTY = 0.1;
export const MIN_MULTIPLIER = 0.5;

const INVALID_NO_CHANGE: ActionResult = { valid: false, scoreChange: 0, livesChange: 0 };
const VALID_NO_CHANGE: ActionResult = { valid: true, scoreChange: 0, livesChange: 0 };

// Re-export evaluator functions for consumers importing from engine
export { evaluateCondition, extractForCount, evaluateSwitchExpression } from './flow-commander.evaluator';

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export class FlowCommanderEngine extends MinigameEngine<FlowCommanderLevelData> {
  // --- Private writable signals ---
  private readonly _placedGates = signal<ReadonlyMap<string, PlacedGate>>(new Map());
  private readonly _simulationResult = signal<SimulationResult | null>(null);
  private readonly _pipelineGraph = signal<PipelineGraph>({ nodes: [], edges: [] });
  private readonly _cargoItems = signal<readonly CargoItem[]>([]);
  private readonly _targetZones = signal<readonly TargetZone[]>([]);
  private readonly _availableGateTypes = signal<readonly GateType[]>([]);
  private readonly _simulationCount = signal(0);
  private readonly _currentTier = signal<DifficultyTier | null>(null);

  // --- Private lookups ---
  private _nodeMap = new Map<string, PipelineNode>();

  // --- Public read-only signals ---
  readonly placedGates: Signal<ReadonlyMap<string, PlacedGate>> = this._placedGates.asReadonly();
  readonly simulationResult: Signal<SimulationResult | null> = this._simulationResult.asReadonly();
  readonly pipelineGraph: Signal<PipelineGraph> = this._pipelineGraph.asReadonly();
  readonly cargoItems: Signal<readonly CargoItem[]> = this._cargoItems.asReadonly();
  readonly targetZones: Signal<readonly TargetZone[]> = this._targetZones.asReadonly();
  readonly availableGateTypes: Signal<readonly GateType[]> = this._availableGateTypes.asReadonly();
  readonly simulationCount: Signal<number> = this._simulationCount.asReadonly();
  readonly currentTier: Signal<DifficultyTier | null> = this._currentTier.asReadonly();

  constructor(config?: Partial<MinigameEngineConfig>) {
    super(config);
  }

  // --- Lifecycle hooks ---

  override initialize(level: MinigameLevel<FlowCommanderLevelData>): void {
    this._currentTier.set(level.tier);
    super.initialize(level);
  }

  protected onLevelLoad(data: FlowCommanderLevelData): void {
    this._pipelineGraph.set(data.graph);
    this._cargoItems.set(data.cargoItems);
    this._targetZones.set(data.targetZones);
    this._availableGateTypes.set(data.availableGateTypes);
    this._placedGates.set(new Map());
    this._simulationResult.set(null);
    this._simulationCount.set(0);
    this._nodeMap = new Map(data.graph.nodes.map(n => [n.id, n]));
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  protected onStart(): void {}

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  protected onComplete(): void {}

  // --- Action validation ---

  protected validateAction(action: unknown): ActionResult {
    if (isPlaceGateAction(action)) {
      return this.handlePlaceGate(action);
    }
    if (isRemoveGateAction(action)) {
      return this.handleRemoveGate(action);
    }
    if (isConfigureGateAction(action)) {
      return this.handleConfigureGate(action);
    }
    return INVALID_NO_CHANGE;
  }

  // --- Simulation ---

  simulate(): SimulationResult | null {
    if (this.status() !== MinigameStatus.Playing) {
      return null;
    }

    this._simulationCount.update(c => c + 1);

    const graph = this._pipelineGraph();
    const items = this._cargoItems();
    const zones = this._targetZones();
    const gates = this._placedGates();

    // Build adjacency: nodeId -> sorted output edges
    const outEdges = new Map<string, { id: string; targetNodeId: string }[]>();
    for (const edge of graph.edges) {
      const list = outEdges.get(edge.sourceNodeId) ?? [];
      list.push({ id: edge.id, targetNodeId: edge.targetNodeId });
      outEdges.set(edge.sourceNodeId, list);
    }
    // Sort edges by ID for deterministic @switch ordering
    for (const [, list] of outEdges) {
      list.sort((a, b) => a.id.localeCompare(b.id));
    }

    // Build target zone lookup: nodeId -> TargetZone
    const zoneByNodeId = new Map(zones.map(z => [z.nodeId, z]));

    // Find source nodes
    const sourceNodes = graph.nodes.filter(n => n.nodeType === 'source');

    // Route each item from each source node
    const allResults: ItemRoutingResult[] = [];

    if (items.length === 0) {
      // No items to route -- considered all correct
      const result: SimulationResult = {
        itemResults: [],
        allCorrect: true,
        correctCount: 0,
        incorrectCount: 0,
        lostCount: 0,
      };
      this._simulationResult.set(result);
      this.addScore(this.calculateScore(result));
      this.complete();
      return result;
    }

    for (const item of items) {
      this.routeItem(item, sourceNodes, outEdges, gates, zoneByNodeId, allResults);
    }

    const correctCount = allResults.filter(r => r.correct).length;
    const lostCount = allResults.filter(r => r.destinationNodeId === null).length;
    const incorrectCount = allResults.length - correctCount;

    const result: SimulationResult = {
      itemResults: allResults,
      allCorrect: correctCount === allResults.length,
      correctCount,
      incorrectCount,
      lostCount,
    };

    this._simulationResult.set(result);

    if (result.allCorrect) {
      this.addScore(this.calculateScore(result));
      this.complete();
    }

    return result;
  }

  // --- Private handlers ---

  private handlePlaceGate(action: PlaceGateAction): ActionResult {
    const node = this._nodeMap.get(action.nodeId);
    if (!node || node.nodeType !== 'gate-slot') {
      return INVALID_NO_CHANGE;
    }

    if (this._placedGates().has(action.nodeId)) {
      return INVALID_NO_CHANGE;
    }

    const availableTypes = this._availableGateTypes();
    if (!availableTypes.includes(action.gateType)) {
      return INVALID_NO_CHANGE;
    }

    const gate: PlacedGate = {
      nodeId: action.nodeId,
      gateType: action.gateType,
      condition: action.condition,
    };

    const newMap = new Map(this._placedGates());
    newMap.set(action.nodeId, gate);
    this._placedGates.set(newMap);

    return VALID_NO_CHANGE;
  }

  private handleRemoveGate(action: RemoveGateAction): ActionResult {
    const node = this._nodeMap.get(action.nodeId);
    if (!node) {
      return INVALID_NO_CHANGE;
    }

    if (!this._placedGates().has(action.nodeId)) {
      return INVALID_NO_CHANGE;
    }

    const newMap = new Map(this._placedGates());
    newMap.delete(action.nodeId);
    this._placedGates.set(newMap);

    return VALID_NO_CHANGE;
  }

  private handleConfigureGate(action: ConfigureGateAction): ActionResult {
    if (!this._placedGates().has(action.nodeId)) {
      return INVALID_NO_CHANGE;
    }

    const existing = this._placedGates().get(action.nodeId)!;
    const updated: PlacedGate = { ...existing, condition: action.condition };

    const newMap = new Map(this._placedGates());
    newMap.set(action.nodeId, updated);
    this._placedGates.set(newMap);

    return VALID_NO_CHANGE;
  }

  // --- Routing ---

  private routeItem(
    item: CargoItem,
    sourceNodes: readonly PipelineNode[],
    outEdges: Map<string, { id: string; targetNodeId: string }[]>,
    gates: ReadonlyMap<string, PlacedGate>,
    zoneByNodeId: Map<string, TargetZone>,
    results: ItemRoutingResult[],
  ): void {
    // BFS from each source node. Each queue entry carries its own visited set
    // for per-item cycle protection (needed when @for duplicates items).
    for (const source of sourceNodes) {
      const initialVisited = new Set<string>();
      const queue: { nodeId: string; path: string[]; currentItem: CargoItem; visited: Set<string> }[] = [
        { nodeId: source.id, path: [source.id], currentItem: item, visited: initialVisited },
      ];

      while (queue.length > 0) {
        const { nodeId, path, currentItem, visited } = queue.shift()!;

        // Cycle protection: per-item visited tracking
        if (visited.has(nodeId)) {
          results.push({
            item: currentItem,
            path,
            destinationNodeId: null,
            targetZoneId: null,
            correct: false,
          });
          continue;
        }
        visited.add(nodeId);

        const node = this._nodeMap.get(nodeId);
        if (!node) continue;

        // Target zone: stop here
        if (node.nodeType === 'target-zone') {
          const zone = zoneByNodeId.get(nodeId);
          const correct = zone ? this.matchesTargetZone(currentItem, zone) : false;
          results.push({
            item: currentItem,
            path,
            destinationNodeId: nodeId,
            targetZoneId: zone?.id ?? null,
            correct,
          });
          continue;
        }

        const edges = outEdges.get(nodeId) ?? [];

        // Dead end (not a target zone)
        if (edges.length === 0) {
          results.push({
            item: currentItem,
            path,
            destinationNodeId: null,
            targetZoneId: null,
            correct: false,
          });
          continue;
        }

        // Gate-slot with a placed gate
        if (node.nodeType === 'gate-slot' && gates.has(nodeId)) {
          const gate = gates.get(nodeId)!;
          this.applyGate(gate, currentItem, edges, path, visited, queue, results);
          continue;
        }

        // Passthrough (junction, gate-slot without gate, source with outgoing)
        for (const edge of edges) {
          queue.push({
            nodeId: edge.targetNodeId,
            path: [...path, edge.targetNodeId],
            currentItem,
            visited,
          });
        }
      }
    }
  }

  private applyGate(
    gate: PlacedGate,
    item: CargoItem,
    edges: { id: string; targetNodeId: string }[],
    path: string[],
    visited: Set<string>,
    queue: { nodeId: string; path: string[]; currentItem: CargoItem; visited: Set<string> }[],
    results: ItemRoutingResult[],
  ): void {
    switch (gate.gateType) {
      case 'if': {
        const conditionResult = evaluateCondition(gate.condition, item);
        if (conditionResult && edges.length > 0) {
          queue.push({
            nodeId: edges[0].targetNodeId,
            path: [...path, edges[0].targetNodeId],
            currentItem: item,
            visited,
          });
        } else if (!conditionResult && edges.length > 1) {
          queue.push({
            nodeId: edges[1].targetNodeId,
            path: [...path, edges[1].targetNodeId],
            currentItem: item,
            visited,
          });
        } else {
          results.push({ item, path, destinationNodeId: null, targetZoneId: null, correct: false });
        }
        break;
      }

      case 'for': {
        const count = extractForCount(gate.condition);
        if (count === 0 || edges.length === 0) {
          results.push({ item, path, destinationNodeId: null, targetZoneId: null, correct: false });
          break;
        }
        for (let i = 0; i < count; i++) {
          const copy: CargoItem = { ...item, id: `${item.id}-copy-${i}` };
          // Each copy gets its own forked visited set for independent cycle tracking
          queue.push({
            nodeId: edges[0].targetNodeId,
            path: [...path, edges[0].targetNodeId],
            currentItem: copy,
            visited: new Set(visited),
          });
        }
        break;
      }

      case 'switch': {
        const value = evaluateSwitchExpression(gate.condition, item);
        if (edges.length === 0) {
          results.push({ item, path, destinationNodeId: null, targetZoneId: null, correct: false });
          break;
        }
        if (edges.length === 1) {
          queue.push({
            nodeId: edges[0].targetNodeId,
            path: [...path, edges[0].targetNodeId],
            currentItem: item,
            visited,
          });
          break;
        }

        const caseLanes = edges.slice(0, -1);
        const defaultLane = edges[edges.length - 1];

        // Collect unique sorted values from all cargo items for the switched property
        // to determine which lane index each value maps to.
        const switchProp = gate.condition.trim().match(/^item\.(\w+)$/);
        if (!switchProp) {
          queue.push({ nodeId: defaultLane.targetNodeId, path: [...path, defaultLane.targetNodeId], currentItem: item, visited });
          break;
        }

        const prop = switchProp[1] as keyof CargoItem;
        const uniqueValues = [...new Set(this._cargoItems().map(i => String(i[prop])))].sort();
        const valueIndex = uniqueValues.indexOf(value);

        if (valueIndex >= 0 && valueIndex < caseLanes.length) {
          queue.push({
            nodeId: caseLanes[valueIndex].targetNodeId,
            path: [...path, caseLanes[valueIndex].targetNodeId],
            currentItem: item,
            visited,
          });
        } else {
          queue.push({ nodeId: defaultLane.targetNodeId, path: [...path, defaultLane.targetNodeId], currentItem: item, visited });
        }
        break;
      }
    }
  }

  // --- Target zone matching ---

  private matchesTargetZone(item: CargoItem, zone: TargetZone): boolean {
    if (zone.expectedColor !== undefined && item.color !== zone.expectedColor) return false;
    if (zone.expectedType !== undefined && item.type !== zone.expectedType) return false;
    if (zone.expectedPriority !== undefined && item.priority !== zone.expectedPriority) return false;
    return true;
  }

  // --- Scoring ---

  private calculateScore(result: SimulationResult): number {
    const maxScore = this.config.maxScore;
    const totalItems = result.itemResults.length;
    const correctnessRatio = totalItems === 0 ? 1.0 : result.correctCount / totalItems;
    const gatesUsed = this._placedGates().size;
    const efficiencyMultiplier = Math.max(MIN_MULTIPLIER, 1.0 - EFFICIENCY_PENALTY_PER_GATE * gatesUsed);
    const simCount = this._simulationCount();
    const simulationPenalty = Math.max(MIN_MULTIPLIER, 1.0 - SIMULATION_PENALTY * Math.max(0, simCount - 1));

    return Math.round(maxScore * correctnessRatio * efficiencyMultiplier * simulationPenalty);
  }
}
