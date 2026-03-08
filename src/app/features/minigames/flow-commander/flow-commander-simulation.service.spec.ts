import { TestBed } from '@angular/core/testing';
import { FlowCommanderSimulationService } from './flow-commander-simulation.service';
import {
  GateType,
  type PipelineNode,
  type PipelineEdge,
  type PipelineGraph,
  type CargoItem,
  type TargetZone,
  type ItemRoutingResult,
} from './pipeline.types';

// ---------------------------------------------------------------------------
// Test helpers (re-declared locally; private to engine spec)
// ---------------------------------------------------------------------------

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

describe('FlowCommanderSimulationService', () => {
  let service: FlowCommanderSimulationService;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [FlowCommanderSimulationService],
    });
    service = TestBed.inject(FlowCommanderSimulationService);
  });

  // --- 1. Creation and initial state ---

  describe('Creation and initial state', () => {
    it('should be created via TestBed', () => {
      expect(service).toBeTruthy();
    });

    it('should start with empty gate state and null simulation result', () => {
      expect(service.getGateState()().size).toBe(0);
      expect(service.getSimulationResult()()).toBeNull();
    });
  });

  // --- 2. loadPipeline ---

  describe('loadPipeline', () => {
    it('should store pipeline topology for later simulation', () => {
      const graph: PipelineGraph = {
        nodes: [makeNode('s1', 'source'), makeNode('t1', 'target-zone')],
        edges: [makeEdge('e1', 's1', 't1')],
      };
      const items = [makeItem()];
      const zones = [makeZone({ nodeId: 't1' })];

      service.loadPipeline(graph, items, zones);

      // Verify by running simulate — items should route to target
      const result = service.simulate();
      expect(result.itemResults.length).toBe(1);
      expect(result.itemResults[0].destinationNodeId).toBe('t1');
    });

    it('should clear previous gates and simulation result on reload', () => {
      const graph: PipelineGraph = {
        nodes: [makeNode('s1', 'source'), makeNode('g1', 'gate-slot'), makeNode('t1', 'target-zone')],
        edges: [makeEdge('e1', 's1', 'g1'), makeEdge('e2', 'g1', 't1')],
      };
      const items = [makeItem()];
      const zones = [makeZone({ nodeId: 't1' })];

      service.loadPipeline(graph, items, zones);
      service.placeGate('g1', GateType.if, "item.priority === 'high'");
      service.simulate();

      expect(service.getGateState()().size).toBe(1);
      expect(service.getSimulationResult()()).not.toBeNull();

      // Reload clears everything
      service.loadPipeline(graph, items, zones);
      expect(service.getGateState()().size).toBe(0);
      expect(service.getSimulationResult()()).toBeNull();
    });
  });

  // --- 3. placeGate ---

  describe('placeGate', () => {
    it('should place a gate at a valid gate-slot node and update gate state signal', () => {
      const graph: PipelineGraph = {
        nodes: [makeNode('g1', 'gate-slot')],
        edges: [],
      };
      service.loadPipeline(graph, [], []);

      const result = service.placeGate('g1', GateType.if, "item.priority === 'high'");

      expect(result).toBe(true);
      const gates = service.getGateState()();
      expect(gates.size).toBe(1);
      expect(gates.get('g1')).toEqual({
        nodeId: 'g1',
        gateType: GateType.if,
        condition: "item.priority === 'high'",
      });
    });

    it('should return false when node does not exist', () => {
      service.loadPipeline({ nodes: [], edges: [] }, [], []);

      const result = service.placeGate('nonexistent', GateType.if, 'cond');

      expect(result).toBe(false);
      expect(service.getGateState()().size).toBe(0);
    });

    it('should return false when node is not a gate-slot', () => {
      const graph: PipelineGraph = {
        nodes: [makeNode('s1', 'source')],
        edges: [],
      };
      service.loadPipeline(graph, [], []);

      const result = service.placeGate('s1', GateType.if, 'cond');

      expect(result).toBe(false);
    });

    it('should return false when gate already placed at that junction', () => {
      const graph: PipelineGraph = {
        nodes: [makeNode('g1', 'gate-slot')],
        edges: [],
      };
      service.loadPipeline(graph, [], []);
      service.placeGate('g1', GateType.if, 'cond1');

      const result = service.placeGate('g1', GateType.for, 'cond2');

      expect(result).toBe(false);
      expect(service.getGateState()().get('g1')!.gateType).toBe(GateType.if);
    });
  });

  // --- 4. removeGate ---

  describe('removeGate', () => {
    it('should remove an existing gate and update gate state signal', () => {
      const graph: PipelineGraph = {
        nodes: [makeNode('g1', 'gate-slot')],
        edges: [],
      };
      service.loadPipeline(graph, [], []);
      service.placeGate('g1', GateType.if, 'cond');

      const result = service.removeGate('g1');

      expect(result).toBe(true);
      expect(service.getGateState()().size).toBe(0);
    });

    it('should return false when no gate exists at junction', () => {
      const graph: PipelineGraph = {
        nodes: [makeNode('g1', 'gate-slot')],
        edges: [],
      };
      service.loadPipeline(graph, [], []);

      const result = service.removeGate('g1');

      expect(result).toBe(false);
    });
  });

  // --- 5. evaluateCondition ---

  describe('evaluateCondition', () => {
    it('should return true when condition matches item property', () => {
      const item = makeItem({ priority: 'high' });
      expect(service.evaluateCondition("item.priority === 'high'", item)).toBe(true);
    });

    it('should return false when condition does not match', () => {
      const item = makeItem({ priority: 'low' });
      expect(service.evaluateCondition("item.priority === 'high'", item)).toBe(false);
    });

    it('should handle compound conditions with && and ||', () => {
      const item = makeItem({ priority: 'high', color: 'blue' });
      expect(service.evaluateCondition("item.priority === 'high' && item.color === 'blue'", item)).toBe(true);
      expect(service.evaluateCondition("item.priority === 'low' || item.color === 'blue'", item)).toBe(true);
      expect(service.evaluateCondition("item.priority === 'low' && item.color === 'red'", item)).toBe(false);
    });
  });

  // --- 6. simulate — @if filtering ---

  describe('simulate — @if filtering', () => {
    it('should route matching item through first edge (true branch)', () => {
      const graph: PipelineGraph = {
        nodes: [
          makeNode('s1', 'source'),
          makeNode('g1', 'gate-slot'),
          makeNode('t1', 'target-zone'),
          makeNode('t2', 'target-zone'),
        ],
        edges: [
          makeEdge('e1', 's1', 'g1'),
          makeEdge('e2', 'g1', 't1'), // true branch
          makeEdge('e3', 'g1', 't2'), // else branch
        ],
      };
      const items = [makeItem({ priority: 'high' })];
      const zones = [makeZone({ nodeId: 't1' }), makeZone({ id: 'zone-2', nodeId: 't2', label: 'Zone 2' })];

      service.loadPipeline(graph, items, zones);
      service.placeGate('g1', GateType.if, "item.priority === 'high'");

      const result = service.simulate();

      expect(result.itemResults.length).toBe(1);
      expect(result.itemResults[0].destinationNodeId).toBe('t1');
    });

    it('should route non-matching item through second edge (else branch)', () => {
      const graph: PipelineGraph = {
        nodes: [
          makeNode('s1', 'source'),
          makeNode('g1', 'gate-slot'),
          makeNode('t1', 'target-zone'),
          makeNode('t2', 'target-zone'),
        ],
        edges: [
          makeEdge('e1', 's1', 'g1'),
          makeEdge('e2', 'g1', 't1'),
          makeEdge('e3', 'g1', 't2'),
        ],
      };
      const items = [makeItem({ priority: 'low' })];
      const zones = [makeZone({ nodeId: 't1' }), makeZone({ id: 'zone-2', nodeId: 't2', label: 'Zone 2' })];

      service.loadPipeline(graph, items, zones);
      service.placeGate('g1', GateType.if, "item.priority === 'high'");

      const result = service.simulate();

      expect(result.itemResults.length).toBe(1);
      expect(result.itemResults[0].destinationNodeId).toBe('t2');
    });

    it('should report lost item when @if has no else and condition is false', () => {
      const graph: PipelineGraph = {
        nodes: [
          makeNode('s1', 'source'),
          makeNode('g1', 'gate-slot'),
          makeNode('t1', 'target-zone'),
        ],
        edges: [
          makeEdge('e1', 's1', 'g1'),
          makeEdge('e2', 'g1', 't1'), // only true branch
        ],
      };
      const items = [makeItem({ priority: 'low' })];
      const zones = [makeZone({ nodeId: 't1' })];

      service.loadPipeline(graph, items, zones);
      service.placeGate('g1', GateType.if, "item.priority === 'high'");

      const result = service.simulate();

      expect(result.itemResults.length).toBe(1);
      expect(result.itemResults[0].destinationNodeId).toBeNull();
      expect(result.lostCount).toBe(1);
    });
  });

  // --- 7. simulate — @for duplication ---

  describe('simulate — @for duplication', () => {
    it('should duplicate item N times through the first output edge', () => {
      const graph: PipelineGraph = {
        nodes: [
          makeNode('s1', 'source'),
          makeNode('g1', 'gate-slot'),
          makeNode('t1', 'target-zone'),
        ],
        edges: [
          makeEdge('e1', 's1', 'g1'),
          makeEdge('e2', 'g1', 't1'),
        ],
      };
      const items = [makeItem()];
      const zones = [makeZone({ nodeId: 't1' })];

      service.loadPipeline(graph, items, zones);
      service.placeGate('g1', GateType.for, '3');

      const result = service.simulate();

      expect(result.itemResults.length).toBe(3);
      result.itemResults.forEach((r: ItemRoutingResult) => {
        expect(r.destinationNodeId).toBe('t1');
      });
    });

    it('should report lost when count is 0', () => {
      const graph: PipelineGraph = {
        nodes: [
          makeNode('s1', 'source'),
          makeNode('g1', 'gate-slot'),
          makeNode('t1', 'target-zone'),
        ],
        edges: [
          makeEdge('e1', 's1', 'g1'),
          makeEdge('e2', 'g1', 't1'),
        ],
      };
      const items = [makeItem()];
      const zones = [makeZone({ nodeId: 't1' })];

      service.loadPipeline(graph, items, zones);
      service.placeGate('g1', GateType.for, '0');

      const result = service.simulate();

      expect(result.itemResults.length).toBe(1);
      expect(result.itemResults[0].destinationNodeId).toBeNull();
      expect(result.lostCount).toBe(1);
    });
  });

  // --- 8. simulate — @switch branching ---

  describe('simulate — @switch branching', () => {
    it('should route item to correct case lane based on property value', () => {
      // 3 edges from gate: case 'blue' -> t1, case 'red' -> t2, default -> t3
      const graph: PipelineGraph = {
        nodes: [
          makeNode('s1', 'source'),
          makeNode('g1', 'gate-slot'),
          makeNode('t1', 'target-zone'),
          makeNode('t2', 'target-zone'),
          makeNode('t3', 'target-zone'),
        ],
        edges: [
          makeEdge('e1', 's1', 'g1'),
          makeEdge('e2', 'g1', 't1'), // case lane 0
          makeEdge('e3', 'g1', 't2'), // case lane 1
          makeEdge('e4', 'g1', 't3'), // default lane
        ],
      };
      const blueItem = makeItem({ id: 'item-blue', color: 'blue' });
      const redItem = makeItem({ id: 'item-red', color: 'red' });
      const items = [blueItem, redItem];
      const zones = [
        makeZone({ id: 'z1', nodeId: 't1', label: 'Z1' }),
        makeZone({ id: 'z2', nodeId: 't2', label: 'Z2' }),
        makeZone({ id: 'z3', nodeId: 't3', label: 'Z3' }),
      ];

      service.loadPipeline(graph, items, zones);
      service.placeGate('g1', GateType.switch, 'item.color');

      const result = service.simulate();

      // Unique sorted colors: ['blue', 'red'] -> index 0 = blue -> e2 -> t1, index 1 = red -> e3 -> t2
      const blueResult = result.itemResults.find((r: ItemRoutingResult) => r.item.id === 'item-blue');
      const redResult = result.itemResults.find((r: ItemRoutingResult) => r.item.id === 'item-red');
      expect(blueResult!.destinationNodeId).toBe('t1');
      expect(redResult!.destinationNodeId).toBe('t2');
    });

    it('should route to default lane when value does not match any case', () => {
      const graph: PipelineGraph = {
        nodes: [
          makeNode('s1', 'source'),
          makeNode('g1', 'gate-slot'),
          makeNode('t1', 'target-zone'),
          makeNode('t2', 'target-zone'),
        ],
        edges: [
          makeEdge('e1', 's1', 'g1'),
          makeEdge('e2', 'g1', 't1'), // case lane 0
          makeEdge('e3', 'g1', 't2'), // default lane
        ],
      };
      // Only one unique color 'blue', so caseLanes has 1 lane (e2), default is e3
      // Item is 'green' which is not in the unique values from items
      const greenItem = makeItem({ id: 'item-green', color: 'green' });
      const blueItem = makeItem({ id: 'item-blue', color: 'blue' });
      const items = [blueItem, greenItem];
      const zones = [
        makeZone({ id: 'z1', nodeId: 't1', label: 'Z1' }),
        makeZone({ id: 'z2', nodeId: 't2', label: 'Z2' }),
      ];

      service.loadPipeline(graph, items, zones);
      service.placeGate('g1', GateType.switch, 'item.color');

      const result = service.simulate();

      // Unique sorted colors: ['blue', 'green']. caseLanes = [e2], default = e3
      // blue -> index 0 -> e2 -> t1
      // green -> index 1 -> but only 1 case lane -> default -> t2
      const greenResult = result.itemResults.find((r: ItemRoutingResult) => r.item.id === 'item-green');
      expect(greenResult!.destinationNodeId).toBe('t2');
    });

    it('should route to default lane when condition is not a valid property expression', () => {
      const graph: PipelineGraph = {
        nodes: [
          makeNode('s1', 'source'),
          makeNode('g1', 'gate-slot'),
          makeNode('t1', 'target-zone'),
          makeNode('t2', 'target-zone'),
        ],
        edges: [
          makeEdge('e1', 's1', 'g1'),
          makeEdge('e2', 'g1', 't1'), // case lane
          makeEdge('e3', 'g1', 't2'), // default lane
        ],
      };
      const items = [makeItem()];
      const zones = [
        makeZone({ id: 'z1', nodeId: 't1', label: 'Z1' }),
        makeZone({ id: 'z2', nodeId: 't2', label: 'Z2' }),
      ];

      service.loadPipeline(graph, items, zones);
      service.placeGate('g1', GateType.switch, 'invalid expression');

      const result = service.simulate();

      expect(result.itemResults[0].destinationNodeId).toBe('t2');
    });
  });

  // --- 9. simulate — multi-gate routing ---

  describe('simulate — multi-gate routing', () => {
    it('should route items through sequential gates (source -> @if -> @for -> target)', () => {
      const graph: PipelineGraph = {
        nodes: [
          makeNode('s1', 'source'),
          makeNode('g1', 'gate-slot'),
          makeNode('g2', 'gate-slot'),
          makeNode('t1', 'target-zone'),
        ],
        edges: [
          makeEdge('e1', 's1', 'g1'),
          makeEdge('e2', 'g1', 'g2'), // @if true -> @for gate
          makeEdge('e3', 'g2', 't1'), // @for output -> target
        ],
      };
      const items = [makeItem({ priority: 'high' })];
      const zones = [makeZone({ nodeId: 't1' })];

      service.loadPipeline(graph, items, zones);
      service.placeGate('g1', GateType.if, "item.priority === 'high'");
      service.placeGate('g2', GateType.for, '2');

      const result = service.simulate();

      expect(result.itemResults.length).toBe(2);
      result.itemResults.forEach((r: ItemRoutingResult) => {
        expect(r.destinationNodeId).toBe('t1');
      });
    });
  });

  // --- 10. simulate — empty pipeline ---

  describe('simulate — empty pipeline', () => {
    it('should return allCorrect true with zero items when pipeline has no cargo', () => {
      const graph: PipelineGraph = {
        nodes: [makeNode('s1', 'source'), makeNode('t1', 'target-zone')],
        edges: [makeEdge('e1', 's1', 't1')],
      };
      service.loadPipeline(graph, [], []);

      const result = service.simulate();

      expect(result.allCorrect).toBe(true);
      expect(result.itemResults.length).toBe(0);
      expect(result.correctCount).toBe(0);
      expect(result.lostCount).toBe(0);
    });
  });

  // --- 11. simulate — dead-end detection ---

  describe('simulate — dead-end detection', () => {
    it('should count items reaching non-target dead-end nodes as lost', () => {
      const graph: PipelineGraph = {
        nodes: [
          makeNode('s1', 'source'),
          makeNode('j1', 'junction'), // dead end — no outgoing edges
        ],
        edges: [makeEdge('e1', 's1', 'j1')],
      };
      const items = [makeItem()];

      service.loadPipeline(graph, items, []);

      const result = service.simulate();

      expect(result.itemResults.length).toBe(1);
      expect(result.itemResults[0].destinationNodeId).toBeNull();
      expect(result.lostCount).toBe(1);
    });
  });

  // --- 12. reset ---

  describe('reset', () => {
    it('should clear all gates and simulation result', () => {
      const graph: PipelineGraph = {
        nodes: [makeNode('s1', 'source'), makeNode('g1', 'gate-slot'), makeNode('t1', 'target-zone')],
        edges: [makeEdge('e1', 's1', 'g1'), makeEdge('e2', 'g1', 't1')],
      };
      service.loadPipeline(graph, [makeItem()], [makeZone({ nodeId: 't1' })]);
      service.placeGate('g1', GateType.if, "item.priority === 'high'");
      service.simulate();

      service.reset();

      expect(service.getGateState()().size).toBe(0);
      expect(service.getSimulationResult()()).toBeNull();
    });

    it('should allow fresh gate placement after reset', () => {
      const graph: PipelineGraph = {
        nodes: [makeNode('g1', 'gate-slot')],
        edges: [],
      };
      service.loadPipeline(graph, [], []);
      service.placeGate('g1', GateType.if, 'cond');
      service.reset();

      // After reset, loadPipeline again then place
      service.loadPipeline(graph, [], []);
      const result = service.placeGate('g1', GateType.for, '3');
      expect(result).toBe(true);
      expect(service.getGateState()().get('g1')!.gateType).toBe(GateType.for);
    });

    it('should return empty SimulationResult when simulate() called after reset() but before loadPipeline()', () => {
      const graph: PipelineGraph = {
        nodes: [makeNode('s1', 'source'), makeNode('t1', 'target-zone')],
        edges: [makeEdge('e1', 's1', 't1')],
      };
      service.loadPipeline(graph, [makeItem()], [makeZone({ nodeId: 't1' })]);
      service.reset();

      const result = service.simulate();

      expect(result.allCorrect).toBe(true);
      expect(result.itemResults.length).toBe(0);
      expect(result.correctCount).toBe(0);
    });
  });

  // --- 13. Signal reactivity ---

  describe('Signal reactivity', () => {
    it('getGateState() signal should update after placeGate/removeGate', () => {
      const graph: PipelineGraph = {
        nodes: [makeNode('g1', 'gate-slot')],
        edges: [],
      };
      service.loadPipeline(graph, [], []);

      const gateSignal = service.getGateState();
      expect(gateSignal().size).toBe(0);

      service.placeGate('g1', GateType.if, 'cond');
      expect(gateSignal().size).toBe(1);

      service.removeGate('g1');
      expect(gateSignal().size).toBe(0);
    });

    it('getSimulationResult() signal should update after simulate()', () => {
      const graph: PipelineGraph = {
        nodes: [makeNode('s1', 'source'), makeNode('t1', 'target-zone')],
        edges: [makeEdge('e1', 's1', 't1')],
      };
      service.loadPipeline(graph, [makeItem()], [makeZone({ nodeId: 't1' })]);

      const resultSignal = service.getSimulationResult();
      expect(resultSignal()).toBeNull();

      service.simulate();
      expect(resultSignal()).not.toBeNull();
      expect(resultSignal()!.itemResults.length).toBe(1);
    });
  });
});
