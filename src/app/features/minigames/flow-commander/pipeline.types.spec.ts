import {
  NodePosition,
  PipelineNodeType,
  PipelineNode,
  PipelineEdge,
  PipelineGraph,
  GateType,
  GateConfig,
  CargoPriority,
  CargoItem,
  TargetZone,
  FlowCommanderLevelData,
  GATE_TYPE_COLORS,
  isValidGateType,
  findConnectedNodes,
} from './pipeline.types';

// --- Compile-time type checks ---

/** All 4 PipelineNodeType values assigned to verify union completeness. */
const _source: PipelineNodeType = 'source';
const _junction: PipelineNodeType = 'junction';
const _gateSlot: PipelineNodeType = 'gate-slot';
const _targetZone: PipelineNodeType = 'target-zone';

// Suppress unused-variable warnings for PipelineNodeType compile-time checks
void [_source, _junction, _gateSlot, _targetZone];

/** All 3 GateType enum values assigned to verify completeness. */
const _ifGate: GateType = GateType.if;
const _forGate: GateType = GateType.for;
const _switchGate: GateType = GateType.switch;

// Suppress unused-variable warnings for GateType compile-time checks
void [_ifGate, _forGate, _switchGate];

/** NodePosition accepts valid position. */
const _validPosition: NodePosition = { x: 100, y: 200 };

/** PipelineNode accepts valid node with each node type. */
const _validSourceNode: PipelineNode = {
  id: 'node-1',
  nodeType: 'source',
  position: { x: 0, y: 0 },
  label: 'Source A',
};

const _validGateSlotNode: PipelineNode = {
  id: 'node-2',
  nodeType: 'gate-slot',
  position: { x: 100, y: 50 },
  label: 'Gate Slot 1',
};

/** PipelineEdge accepts valid edge. */
const _validEdge: PipelineEdge = {
  id: 'edge-1',
  sourceNodeId: 'node-1',
  targetNodeId: 'node-2',
};

/** PipelineGraph accepts valid graph with nodes and edges. */
const _validGraph: PipelineGraph = {
  nodes: [_validSourceNode, _validGateSlotNode],
  edges: [_validEdge],
};

/** GateConfig accepts valid gate config. */
const _validGateConfig: GateConfig = {
  gateType: GateType.if,
  condition: 'item.color === "red"',
  inputs: ['node-1'],
  outputs: ['node-3', 'node-4'],
};

/** All 3 CargoPriority values assigned to verify union completeness. */
const _lowPriority: CargoPriority = 'low';
const _mediumPriority: CargoPriority = 'medium';
const _highPriority: CargoPriority = 'high';

void [_lowPriority, _mediumPriority, _highPriority];

/** CargoItem accepts valid cargo item with all 5 properties. */
const _validCargo: CargoItem = {
  id: 'cargo-1',
  color: '#FF0000',
  label: 'Red Crate',
  type: 'fuel',
  priority: 'high',
};

/** TargetZone accepts valid target zone with required and optional fields. */
const _validTargetZoneRequired: TargetZone = {
  id: 'tz-1',
  nodeId: 'node-5',
  label: 'Zone Alpha',
};

const _validTargetZoneFull: TargetZone = {
  id: 'tz-2',
  nodeId: 'node-6',
  label: 'Zone Beta',
  expectedColor: '#FF0000',
  expectedType: 'fuel',
  expectedPriority: 'high',
};

/** FlowCommanderLevelData accepts valid level data. */
const _validLevelData: FlowCommanderLevelData = {
  graph: _validGraph,
  cargoItems: [_validCargo],
  availableGateTypes: [GateType.if, GateType.for],
  targetZones: [_validTargetZoneRequired],
};

// Suppress unused variable warnings for compile-time checks
void [
  _validPosition,
  _validSourceNode,
  _validGateSlotNode,
  _validEdge,
  _validGraph,
  _validGateConfig,
  _validCargo,
  _validTargetZoneRequired,
  _validTargetZoneFull,
  _validLevelData,
];

// --- Runtime test suites ---

describe('GATE_TYPE_COLORS', () => {
  it('should have 3 entries', () => {
    expect(Object.keys(GATE_TYPE_COLORS).length).toBe(3);
  });

  it('should map if to Reactor Blue (#3B82F6)', () => {
    expect(GATE_TYPE_COLORS[GateType.if]).toBe('#3B82F6');
  });

  it('should map for to Sensor Green (#22C55E)', () => {
    expect(GATE_TYPE_COLORS[GateType.for]).toBe('#22C55E');
  });

  it('should map switch to Comm Purple (#A855F7)', () => {
    expect(GATE_TYPE_COLORS[GateType.switch]).toBe('#A855F7');
  });
});

describe('isValidGateType', () => {
  it('should return true for each valid GateType string', () => {
    expect(isValidGateType('if')).toBe(true);
    expect(isValidGateType('for')).toBe(true);
    expect(isValidGateType('switch')).toBe(true);
  });

  it('should return false for invalid strings', () => {
    expect(isValidGateType('while')).toBe(false);
    expect(isValidGateType('')).toBe(false);
    expect(isValidGateType('IF')).toBe(false);
  });

  it('should narrow type when used as type guard', () => {
    const value = 'if' as string;
    expect(isValidGateType(value)).toBe(true);
    if (isValidGateType(value)) {
      // value is narrowed to GateType here — assignment proves it
      const gt: GateType = value;
      expect(gt).toBe(GateType.if);
    }
  });
});

describe('findConnectedNodes', () => {
  const makeNode = (id: string, nodeType: PipelineNodeType = 'junction'): PipelineNode => ({
    id,
    nodeType,
    position: { x: 0, y: 0 },
    label: id,
  });

  const makeEdge = (sourceNodeId: string, targetNodeId: string, id?: string): PipelineEdge => ({
    id: id ?? `${sourceNodeId}-${targetNodeId}`,
    sourceNodeId,
    targetNodeId,
  });

  it('should return empty array when startNodeId is not in graph', () => {
    const graph: PipelineGraph = {
      nodes: [makeNode('a')],
      edges: [],
    };

    expect(findConnectedNodes(graph, 'nonexistent')).toEqual([]);
  });

  it('should return only the start node when it has no outgoing edges', () => {
    const graph: PipelineGraph = {
      nodes: [makeNode('a'), makeNode('b')],
      edges: [makeEdge('b', 'a')], // edge goes TO a, not FROM a
    };

    expect(findConnectedNodes(graph, 'a')).toEqual(['a']);
  });

  it('should return all reachable nodes in a linear pipeline', () => {
    const graph: PipelineGraph = {
      nodes: [makeNode('source', 'source'), makeNode('junction'), makeNode('target', 'target-zone')],
      edges: [makeEdge('source', 'junction'), makeEdge('junction', 'target')],
    };

    const result = findConnectedNodes(graph, 'source');
    expect(result).toEqual(['source', 'junction', 'target']);
  });

  it('should return all reachable nodes in a branching pipeline', () => {
    const graph: PipelineGraph = {
      nodes: [
        makeNode('source', 'source'),
        makeNode('junction'),
        makeNode('target-a', 'target-zone'),
        makeNode('target-b', 'target-zone'),
      ],
      edges: [
        makeEdge('source', 'junction'),
        makeEdge('junction', 'target-a'),
        makeEdge('junction', 'target-b'),
      ],
    };

    const result = findConnectedNodes(graph, 'source');
    expect(result).toContain('source');
    expect(result).toContain('junction');
    expect(result).toContain('target-a');
    expect(result).toContain('target-b');
    expect(result.length).toBe(4);
  });

  it('should not include nodes only reachable in reverse direction', () => {
    const graph: PipelineGraph = {
      nodes: [makeNode('a'), makeNode('b'), makeNode('c')],
      edges: [makeEdge('a', 'b'), makeEdge('c', 'b')],
    };

    const result = findConnectedNodes(graph, 'a');
    expect(result).toEqual(['a', 'b']);
    expect(result).not.toContain('c');
  });

  it('should handle cycles without infinite loop', () => {
    const graph: PipelineGraph = {
      nodes: [makeNode('a'), makeNode('b')],
      edges: [makeEdge('a', 'b'), makeEdge('b', 'a')],
    };

    const result = findConnectedNodes(graph, 'a');
    expect(result).toContain('a');
    expect(result).toContain('b');
    expect(result.length).toBe(2);
  });
});

describe('PipelineNode', () => {
  it('should accept valid node with all fields', () => {
    const node: PipelineNode = {
      id: 'node-1',
      nodeType: 'source',
      position: { x: 50, y: 100 },
      label: 'Source A',
    };

    expect(node.id).toBe('node-1');
    expect(node.nodeType).toBe('source');
    expect(node.position).toEqual({ x: 50, y: 100 });
    expect(node.label).toBe('Source A');
  });
});

describe('PipelineEdge', () => {
  it('should accept valid edge with source and target node IDs', () => {
    const edge: PipelineEdge = {
      id: 'edge-1',
      sourceNodeId: 'node-1',
      targetNodeId: 'node-2',
    };

    expect(edge.id).toBe('edge-1');
    expect(edge.sourceNodeId).toBe('node-1');
    expect(edge.targetNodeId).toBe('node-2');
  });
});

describe('PipelineGraph', () => {
  it('should accept valid graph with nodes and edges', () => {
    const graph: PipelineGraph = {
      nodes: [
        { id: 'n1', nodeType: 'source', position: { x: 0, y: 0 }, label: 'Source' },
        { id: 'n2', nodeType: 'target-zone', position: { x: 100, y: 0 }, label: 'Target' },
      ],
      edges: [{ id: 'e1', sourceNodeId: 'n1', targetNodeId: 'n2' }],
    };

    expect(graph.nodes.length).toBe(2);
    expect(graph.edges.length).toBe(1);
  });

  it('should accept empty graph with no nodes or edges', () => {
    const graph: PipelineGraph = {
      nodes: [],
      edges: [],
    };

    expect(graph.nodes.length).toBe(0);
    expect(graph.edges.length).toBe(0);
  });
});

describe('GateConfig', () => {
  it('should accept valid gate config with condition, inputs, and outputs', () => {
    const config: GateConfig = {
      gateType: GateType.switch,
      condition: 'item.type',
      inputs: ['node-1'],
      outputs: ['node-3', 'node-4', 'node-5'],
    };

    expect(config.gateType).toBe(GateType.switch);
    expect(config.condition).toBe('item.type');
    expect(config.inputs).toEqual(['node-1']);
    expect(config.outputs).toEqual(['node-3', 'node-4', 'node-5']);
  });
});

describe('CargoItem', () => {
  it('should accept valid cargo item with all 5 properties', () => {
    const cargo: CargoItem = {
      id: 'cargo-1',
      color: '#FF0000',
      label: 'Red Crate',
      type: 'fuel',
      priority: 'high',
    };

    expect(cargo.id).toBe('cargo-1');
    expect(cargo.color).toBe('#FF0000');
    expect(cargo.label).toBe('Red Crate');
    expect(cargo.type).toBe('fuel');
    expect(cargo.priority).toBe('high');
  });
});

describe('TargetZone', () => {
  it('should accept target zone with only required fields', () => {
    const zone: TargetZone = {
      id: 'tz-1',
      nodeId: 'node-5',
      label: 'Zone Alpha',
    };

    expect(zone.id).toBe('tz-1');
    expect(zone.nodeId).toBe('node-5');
    expect(zone.label).toBe('Zone Alpha');
    expect(zone.expectedColor).toBeUndefined();
    expect(zone.expectedType).toBeUndefined();
    expect(zone.expectedPriority).toBeUndefined();
  });

  it('should accept target zone with all optional filter criteria', () => {
    const zone: TargetZone = {
      id: 'tz-2',
      nodeId: 'node-6',
      label: 'Zone Beta',
      expectedColor: '#00FF00',
      expectedType: 'medical',
      expectedPriority: 'low',
    };

    expect(zone.id).toBe('tz-2');
    expect(zone.expectedColor).toBe('#00FF00');
    expect(zone.expectedType).toBe('medical');
    expect(zone.expectedPriority).toBe('low');
  });
});

describe('FlowCommanderLevelData', () => {
  it('should accept valid level data with graph, cargo, availableGateTypes, and target zones', () => {
    const levelData: FlowCommanderLevelData = {
      graph: {
        nodes: [
          { id: 'n1', nodeType: 'source', position: { x: 0, y: 0 }, label: 'Source' },
          { id: 'n2', nodeType: 'gate-slot', position: { x: 100, y: 0 }, label: 'Gate' },
          { id: 'n3', nodeType: 'target-zone', position: { x: 200, y: 0 }, label: 'Target' },
        ],
        edges: [
          { id: 'e1', sourceNodeId: 'n1', targetNodeId: 'n2' },
          { id: 'e2', sourceNodeId: 'n2', targetNodeId: 'n3' },
        ],
      },
      cargoItems: [
        { id: 'c1', color: '#FF0000', label: 'Red', type: 'fuel', priority: 'high' },
        { id: 'c2', color: '#00FF00', label: 'Green', type: 'medical', priority: 'low' },
      ],
      availableGateTypes: [GateType.if, GateType.switch],
      targetZones: [
        { id: 'tz-1', nodeId: 'n3', label: 'Target Zone', expectedType: 'fuel' },
      ],
    };

    expect(levelData.graph.nodes.length).toBe(3);
    expect(levelData.graph.edges.length).toBe(2);
    expect(levelData.cargoItems.length).toBe(2);
    expect(levelData.availableGateTypes).toEqual([GateType.if, GateType.switch]);
    expect(levelData.targetZones.length).toBe(1);
  });
});
