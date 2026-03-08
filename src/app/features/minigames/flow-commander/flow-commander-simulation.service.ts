// ---------------------------------------------------------------------------
// FlowCommanderSimulationService — pipeline cargo routing simulation
// ---------------------------------------------------------------------------
// NOT providedIn: 'root'. This service manages minigame-specific simulation
// state scoped to the Flow Commander component tree. Providing it locally
// ensures automatic cleanup on component destroy and prevents leaked state
// between minigame sessions.
// ---------------------------------------------------------------------------

import { Injectable, signal, type Signal } from '@angular/core';
import type {
  PipelineGraph,
  PipelineNode,
  CargoItem,
  GateType,
  TargetZone,
  PlacedGate,
  SimulationResult,
  ItemRoutingResult,
} from './pipeline.types';
import { evaluateCondition as evalCond, extractForCount, evaluateSwitchExpression } from './flow-commander.evaluator';

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

@Injectable()
export class FlowCommanderSimulationService {
  // --- Private writable signals ---
  private readonly _gates = signal<ReadonlyMap<string, PlacedGate>>(new Map());
  private readonly _simulationResult = signal<SimulationResult | null>(null);

  // --- Private non-signal state ---
  private _graph: PipelineGraph = { nodes: [], edges: [] };
  private _nodeMap = new Map<string, PipelineNode>();
  private _cargoItems: readonly CargoItem[] = [];
  private _targetZones: readonly TargetZone[] = [];
  private _outEdges = new Map<string, { id: string; targetNodeId: string }[]>();

  // --- Public methods ---

  /** Initializes the simulation graph, cargo items, and target zones from level data. */
  loadPipeline(topology: PipelineGraph, cargoItems: readonly CargoItem[], targetZones: readonly TargetZone[]): void {
    this._graph = topology;
    this._cargoItems = cargoItems;
    this._targetZones = targetZones;
    this._nodeMap = new Map(topology.nodes.map(n => [n.id, n]));

    // Precompute sorted adjacency list
    this._outEdges = new Map<string, { id: string; targetNodeId: string }[]>();
    for (const edge of topology.edges) {
      const list = this._outEdges.get(edge.sourceNodeId) ?? [];
      list.push({ id: edge.id, targetNodeId: edge.targetNodeId });
      this._outEdges.set(edge.sourceNodeId, list);
    }
    for (const [, list] of this._outEdges) {
      list.sort((a, b) => a.id.localeCompare(b.id));
    }

    // Clear gates and simulation result
    this._gates.set(new Map());
    this._simulationResult.set(null);
  }

  /** Places a gate at a gate-slot node. Returns true on success, false on validation failure. */
  placeGate(junctionId: string, gateType: GateType, condition: string): boolean {
    const node = this._nodeMap.get(junctionId);
    if (!node || node.nodeType !== 'gate-slot') {
      return false;
    }
    if (this._gates().has(junctionId)) {
      return false;
    }

    const gate: PlacedGate = { nodeId: junctionId, gateType, condition };
    const newMap = new Map(this._gates());
    newMap.set(junctionId, gate);
    this._gates.set(newMap);
    return true;
  }

  /** Removes a gate from a junction. Returns true on success, false if not found. */
  removeGate(junctionId: string): boolean {
    if (!this._gates().has(junctionId)) {
      return false;
    }
    const newMap = new Map(this._gates());
    newMap.delete(junctionId);
    this._gates.set(newMap);
    return true;
  }

  /** Evaluates a gate condition against a cargo item. Delegates to the evaluator module. */
  evaluateCondition(condition: string, item: CargoItem): boolean {
    return evalCond(condition, item);
  }

  /** Runs all cargo items through the pipeline and returns per-item routing results. */
  simulate(): SimulationResult {
    const items = this._cargoItems;
    const gates = this._gates();
    const zoneByNodeId = new Map(this._targetZones.map(z => [z.nodeId, z]));
    const sourceNodes = this._graph.nodes.filter(n => n.nodeType === 'source');

    if (items.length === 0) {
      const result: SimulationResult = {
        itemResults: [],
        allCorrect: true,
        correctCount: 0,
        incorrectCount: 0,
        lostCount: 0,
      };
      this._simulationResult.set(result);
      return result;
    }

    const allResults: ItemRoutingResult[] = [];

    for (const item of items) {
      this.routeItem(item, sourceNodes, gates, zoneByNodeId, allResults);
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
    return result;
  }

  /** Returns a read-only signal of the current gate placements. */
  getGateState(): Signal<ReadonlyMap<string, PlacedGate>> {
    return this._gates.asReadonly();
  }

  /** Returns a read-only signal of the last simulation result. */
  getSimulationResult(): Signal<SimulationResult | null> {
    return this._simulationResult.asReadonly();
  }

  /** Clears all gates, simulation results, and pipeline state. */
  reset(): void {
    this._gates.set(new Map());
    this._simulationResult.set(null);
    this._graph = { nodes: [], edges: [] };
    this._nodeMap = new Map();
    this._cargoItems = [];
    this._targetZones = [];
    this._outEdges = new Map();
  }

  // --- Private routing methods ---

  private routeItem(
    item: CargoItem,
    sourceNodes: readonly PipelineNode[],
    gates: ReadonlyMap<string, PlacedGate>,
    zoneByNodeId: Map<string, TargetZone>,
    results: ItemRoutingResult[],
  ): void {
    for (const source of sourceNodes) {
      const initialVisited = new Set<string>();
      const queue: { nodeId: string; path: string[]; currentItem: CargoItem; visited: Set<string> }[] = [
        { nodeId: source.id, path: [source.id], currentItem: item, visited: initialVisited },
      ];

      while (queue.length > 0) {
        const { nodeId, path, currentItem, visited } = queue.shift()!;

        if (visited.has(nodeId)) {
          results.push({ item: currentItem, path, destinationNodeId: null, targetZoneId: null, correct: false });
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

        const edges = this._outEdges.get(nodeId) ?? [];

        // Dead end (not a target zone)
        if (edges.length === 0) {
          results.push({ item: currentItem, path, destinationNodeId: null, targetZoneId: null, correct: false });
          continue;
        }

        // Gate-slot with a placed gate
        if (node.nodeType === 'gate-slot' && gates.has(nodeId)) {
          const gate = gates.get(nodeId)!;
          this.applyGate(gate, currentItem, edges, path, visited, queue, results);
          continue;
        }

        // Passthrough
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
        const conditionResult = evalCond(gate.condition, item);
        if (conditionResult && edges.length > 0) {
          queue.push({ nodeId: edges[0].targetNodeId, path: [...path, edges[0].targetNodeId], currentItem: item, visited });
        } else if (!conditionResult && edges.length > 1) {
          queue.push({ nodeId: edges[1].targetNodeId, path: [...path, edges[1].targetNodeId], currentItem: item, visited });
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
          queue.push({ nodeId: edges[0].targetNodeId, path: [...path, edges[0].targetNodeId], currentItem: item, visited });
          break;
        }

        const caseLanes = edges.slice(0, -1);
        const defaultLane = edges[edges.length - 1];

        const switchProp = gate.condition.trim().match(/^item\.(\w+)$/);
        if (!switchProp) {
          queue.push({ nodeId: defaultLane.targetNodeId, path: [...path, defaultLane.targetNodeId], currentItem: item, visited });
          break;
        }

        const prop = switchProp[1] as keyof CargoItem;
        const uniqueValues = [...new Set(this._cargoItems.map(i => String(i[prop])))].sort();
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

  private matchesTargetZone(item: CargoItem, zone: TargetZone): boolean {
    if (zone.expectedColor !== undefined && item.color !== zone.expectedColor) return false;
    if (zone.expectedType !== undefined && item.type !== zone.expectedType) return false;
    if (zone.expectedPriority !== undefined && item.priority !== zone.expectedPriority) return false;
    return true;
  }
}
