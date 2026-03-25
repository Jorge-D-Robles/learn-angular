// ---------------------------------------------------------------------------
// Integration tests: FlowCommanderSimulationService pipeline simulation
// ---------------------------------------------------------------------------
// Exercises the simulation service against REAL level data from
// FLOW_COMMANDER_LEVELS — catching data authoring bugs and validating that
// gate routing (@if, @for, @switch) produces correct item routing results
// across realistic multi-item, multi-target pipeline topologies.
// ---------------------------------------------------------------------------

import { FlowCommanderSimulationService } from './flow-commander-simulation.service';
import { FLOW_COMMANDER_LEVELS } from '../../../data/levels/flow-commander.data';
import {
  GateType,
  type PipelineNode,
  type PipelineEdge,
  type PipelineGraph,
  type CargoItem,
  type TargetZone,
  type FlowCommanderLevelData,
} from './pipeline.types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createService(): FlowCommanderSimulationService {
  return new FlowCommanderSimulationService();
}

function getLevelData(levelId: string): FlowCommanderLevelData {
  return FLOW_COMMANDER_LEVELS.find(l => l.levelId === levelId)!.data;
}

function makeNode(id: string, nodeType: PipelineNode['nodeType'], label = ''): PipelineNode {
  return { id, nodeType, position: { x: 0, y: 0 }, label };
}

function makeEdge(id: string, sourceNodeId: string, targetNodeId: string): PipelineEdge {
  return { id, sourceNodeId, targetNodeId };
}

function makeItem(overrides: Partial<CargoItem> = {}): CargoItem {
  return {
    id: 'item-1',
    color: 'blue',
    label: 'Test Item',
    type: 'fuel',
    priority: 'high',
    ...overrides,
  };
}

function makeZone(overrides: Partial<TargetZone> = {}): TargetZone {
  return {
    id: 'zone-1',
    nodeId: 'target-1',
    label: 'Zone 1',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('FlowCommanderSimulationService pipeline integration (real level data)', () => {
  let service: FlowCommanderSimulationService;

  beforeEach(() => {
    service = createService();
  });

  // --- Test 1: @if gate filters items correctly (Level 1 -- fc-basic-01) ---
  it('@if gate filters items correctly (Level 1)', () => {
    const data = getLevelData('fc-basic-01');
    service.loadPipeline(data.graph, data.cargoItems, data.targetZones);
    service.placeGate('fc-basic-01-gate1', GateType.if, "item.priority === 'high'");

    const result = service.simulate();

    expect(result.itemResults.length).toBe(4);
    expect(result.allCorrect).toBe(true);
    expect(result.correctCount).toBe(4);
    expect(result.incorrectCount).toBe(0);
    expect(result.lostCount).toBe(0);

    // High-priority items route to tgt1 (High Priority Bay)
    const tgt1Results = result.itemResults.filter(r => r.destinationNodeId === 'fc-basic-01-tgt1');
    expect(tgt1Results.length).toBe(2);
    tgt1Results.forEach(r => expect(r.item.priority).toBe('high'));

    // Low-priority items route to tgt2 (Reject Bin)
    const tgt2Results = result.itemResults.filter(r => r.destinationNodeId === 'fc-basic-01-tgt2');
    expect(tgt2Results.length).toBe(2);
    tgt2Results.forEach(r => expect(r.item.priority).toBe('low'));
  });

  // --- Test 2: @for gate duplicates items (Level 3 -- fc-basic-03) ---
  it('@for gate duplicates items for each entry in a list (Level 3)', () => {
    const data = getLevelData('fc-basic-03');
    service.loadPipeline(data.graph, data.cargoItems, data.targetZones);
    service.placeGate('fc-basic-03-gate1', GateType.for, '3');

    const result = service.simulate();

    // 2 items x 3 copies = 6 results
    expect(result.itemResults.length).toBe(6);
    expect(result.allCorrect).toBe(true);
    expect(result.correctCount).toBe(6);
    expect(result.lostCount).toBe(0);

    // All copies route to tgt1 (Supply Rack, no criteria)
    result.itemResults.forEach(r => {
      expect(r.destinationNodeId).toBe('fc-basic-03-tgt1');
      expect(r.correct).toBe(true);
    });
  });

  // --- Test 3: @switch gate routes items to output lanes (Level 7 -- fc-intermediate-01) ---
  it('@switch gate routes items to deterministic output lanes based on type (Level 7)', () => {
    const data = getLevelData('fc-intermediate-01');
    service.loadPipeline(data.graph, data.cargoItems, data.targetZones);
    service.placeGate('fc-intermediate-01-gate1', GateType.switch, 'item.type');

    const result = service.simulate();

    expect(result.itemResults.length).toBe(6);

    // @switch sorts unique type values alphabetically: ['food', 'fuel', 'medical']
    // caseLanes = [e2 -> tgt1, e3 -> tgt2], defaultLane = e4 -> tgt3
    // food (index 0) -> tgt1 (Fuel Bay), fuel (index 1) -> tgt2 (Med Bay), medical (index 2) -> default tgt3 (Galley)
    const foodResults = result.itemResults.filter(r => r.item.type === 'food');
    const fuelResults = result.itemResults.filter(r => r.item.type === 'fuel');
    const medResults = result.itemResults.filter(r => r.item.type === 'medical');

    expect(foodResults.length).toBe(2);
    foodResults.forEach(r => expect(r.destinationNodeId).toBe('fc-intermediate-01-tgt1'));

    expect(fuelResults.length).toBe(2);
    fuelResults.forEach(r => expect(r.destinationNodeId).toBe('fc-intermediate-01-tgt2'));

    expect(medResults.length).toBe(2);
    medResults.forEach(r => expect(r.destinationNodeId).toBe('fc-intermediate-01-tgt3'));

    // Alphabetical routing does NOT match target zone criteria, so none are correct
    expect(result.allCorrect).toBe(false);
    expect(result.correctCount).toBe(0);
    expect(result.incorrectCount).toBe(6);
  });

  // --- Test 4: multi-gate pipeline with sequential gates (Level 5 -- fc-basic-05) ---
  it('multi-gate pipeline routes items through sequential @if -> @for gates (Level 5)', () => {
    const data = getLevelData('fc-basic-05');
    service.loadPipeline(data.graph, data.cargoItems, data.targetZones);
    service.placeGate('fc-basic-05-gate1', GateType.if, "item.priority === 'high'");
    service.placeGate('fc-basic-05-gate2', GateType.for, '2');

    const result = service.simulate();

    // 3 high-priority items x 2 copies = 6 at Priority Bay
    // 3 non-high items -> Standard Bay = 3
    // Total = 9 results
    expect(result.itemResults.length).toBe(9);

    const priorityBayResults = result.itemResults.filter(
      r => r.destinationNodeId === 'fc-basic-05-tgt1',
    );
    expect(priorityBayResults.length).toBe(6);
    priorityBayResults.forEach(r => expect(r.correct).toBe(true));

    const standardBayResults = result.itemResults.filter(
      r => r.destinationNodeId === 'fc-basic-05-tgt2',
    );
    expect(standardBayResults.length).toBe(3);
    standardBayResults.forEach(r => expect(r.correct).toBe(true));

    expect(result.allCorrect).toBe(true);
    expect(result.correctCount).toBe(9);
    expect(result.incorrectCount).toBe(0);
    expect(result.lostCount).toBe(0);
  });

  // --- Test 5: items reaching wrong targets counted as failures (Level 1 -- fc-basic-01) ---
  it('items reaching wrong targets counted as failures with inverted condition (Level 1)', () => {
    const data = getLevelData('fc-basic-01');
    service.loadPipeline(data.graph, data.cargoItems, data.targetZones);
    // Inverted logic: low-priority items go to High Priority Bay (wrong!)
    service.placeGate('fc-basic-01-gate1', GateType.if, "item.priority === 'low'");

    const result = service.simulate();

    expect(result.itemResults.length).toBe(4);
    expect(result.allCorrect).toBe(false);

    // Low-priority items routed to tgt1 (High Priority Bay, expectedPriority: 'high') -- INCORRECT
    const tgt1Results = result.itemResults.filter(r => r.destinationNodeId === 'fc-basic-01-tgt1');
    expect(tgt1Results.length).toBe(2);
    tgt1Results.forEach(r => {
      expect(r.item.priority).toBe('low');
      expect(r.correct).toBe(false);
    });

    // High-priority items routed to tgt2 (Reject Bin, no criteria) -- correct
    const tgt2Results = result.itemResults.filter(r => r.destinationNodeId === 'fc-basic-01-tgt2');
    expect(tgt2Results.length).toBe(2);
    tgt2Results.forEach(r => {
      expect(r.item.priority).toBe('high');
      expect(r.correct).toBe(true);
    });

    expect(result.incorrectCount).toBe(2);
    expect(result.correctCount).toBe(2);
  });

  // --- Test 6: items reaching dead-ends counted as lost (synthetic graph) ---
  it('items reaching dead-ends counted as lost', () => {
    // Synthetic graph: source -> gate-slot -> target-zone (single edge, no else branch)
    const graph: PipelineGraph = {
      nodes: [
        makeNode('src', 'source', 'Source'),
        makeNode('gate', 'gate-slot', 'Gate'),
        makeNode('tgt', 'target-zone', 'Target'),
      ],
      edges: [
        makeEdge('e1', 'src', 'gate'),
        makeEdge('e2', 'gate', 'tgt'), // only true branch, no else
      ],
    };
    const items = [makeItem({ id: 'lost-item', priority: 'low' })];
    const zones = [makeZone({ id: 'z1', nodeId: 'tgt', label: 'Target' })];

    service.loadPipeline(graph, items, zones);
    // @if condition does not match item -- no else branch, so item is lost
    service.placeGate('gate', GateType.if, "item.priority === 'high'");

    const result = service.simulate();

    expect(result.itemResults.length).toBe(1);
    expect(result.itemResults[0].destinationNodeId).toBeNull();
    expect(result.itemResults[0].correct).toBe(false);
    expect(result.lostCount).toBe(1);
    expect(result.correctCount).toBe(0);
  });

  // --- Test 7: simulation with no gates -- all items passthrough (Level 1 -- fc-basic-01) ---
  it('simulation with no gates results in passthrough to all outputs (Level 1)', () => {
    const data = getLevelData('fc-basic-01');
    service.loadPipeline(data.graph, data.cargoItems, data.targetZones);
    // No gates placed -- gate-slot acts as passthrough

    const result = service.simulate();

    // Each of 4 items passes through gate-slot to BOTH target zones = 8 results
    expect(result.itemResults.length).toBe(8);

    // tgt1 (High Priority Bay, expectedPriority: 'high'): 4 items, 2 high correct + 2 low incorrect
    const tgt1Results = result.itemResults.filter(r => r.destinationNodeId === 'fc-basic-01-tgt1');
    expect(tgt1Results.length).toBe(4);
    const tgt1Correct = tgt1Results.filter(r => r.correct);
    expect(tgt1Correct.length).toBe(2);

    // tgt2 (Reject Bin, no criteria): 4 items, all correct
    const tgt2Results = result.itemResults.filter(r => r.destinationNodeId === 'fc-basic-01-tgt2');
    expect(tgt2Results.length).toBe(4);
    tgt2Results.forEach(r => expect(r.correct).toBe(true));

    expect(result.allCorrect).toBe(false);
    expect(result.correctCount).toBe(6);
    expect(result.incorrectCount).toBe(2);
  });
});
