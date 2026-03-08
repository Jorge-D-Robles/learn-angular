import {
  PortPosition,
  SourcePort,
  TargetPort,
  WireType,
  WireConnection,
  VerificationResult,
  WIRE_TYPE_COLORS,
  isValidWireType,
  isSourceTargetCompatible,
  verifyConnections,
} from './wire-protocol.types';

// --- Compile-time type checks ---

/** All 4 WireType enum values assigned to verify completeness. */
const _interpolation: WireType = WireType.interpolation;
const _property: WireType = WireType.property;
const _event: WireType = WireType.event;
const _twoWay: WireType = WireType.twoWay;

// Suppress unused-variable warnings for WireType compile-time checks
void [_interpolation, _property, _event, _twoWay];

/** PortPosition accepts valid position. */
const _validPosition: PortPosition = { x: 100, y: 200 };

/** SourcePort accepts valid port with all fields. */
const _validSource: SourcePort = {
  id: 'src-1',
  name: 'title',
  portType: 'property',
  dataType: 'string',
  position: { x: 50, y: 100 },
};

/** TargetPort accepts valid port with all binding slot types. */
const _validTarget: TargetPort = {
  id: 'tgt-1',
  name: 'Title Display',
  bindingSlot: 'interpolation',
  position: { x: 300, y: 100 },
};

/** WireConnection accepts valid pre-wired connection. */
const _validPreWired: WireConnection = {
  id: 'wire-1',
  sourcePortId: 'src-1',
  targetPortId: 'tgt-1',
  wireType: WireType.interpolation,
  isPreWired: true,
  isCorrect: false,
};

/** WireConnection accepts valid player-drawn connection (isCorrect omitted). */
const _validPlayerDrawn: WireConnection = {
  id: 'wire-2',
  sourcePortId: 'src-1',
  targetPortId: 'tgt-2',
  wireType: WireType.property,
  isPreWired: false,
};

/** VerificationResult accepts valid result with populated arrays. */
const _validResult: VerificationResult = {
  correctWires: [_validPreWired],
  incorrectWires: [_validPlayerDrawn],
  missingWires: [],
};

// Suppress unused variable warnings for compile-time checks
void [_validPosition, _validSource, _validTarget, _validPreWired, _validPlayerDrawn, _validResult];

// --- Runtime test suites ---

describe('WIRE_TYPE_COLORS', () => {
  it('should have 4 entries', () => {
    expect(Object.keys(WIRE_TYPE_COLORS).length).toBe(4);
  });

  it('should map interpolation to Reactor Blue (#3B82F6)', () => {
    expect(WIRE_TYPE_COLORS.interpolation).toBe('#3B82F6');
  });

  it('should map property to Sensor Green (#22C55E)', () => {
    expect(WIRE_TYPE_COLORS.property).toBe('#22C55E');
  });

  it('should map event to Alert Orange (#F97316)', () => {
    expect(WIRE_TYPE_COLORS.event).toBe('#F97316');
  });

  it('should map twoWay to Comm Purple (#A855F7)', () => {
    expect(WIRE_TYPE_COLORS.twoWay).toBe('#A855F7');
  });
});

describe('isValidWireType', () => {
  it('should return true for each valid WireType string', () => {
    expect(isValidWireType('interpolation')).toBe(true);
    expect(isValidWireType('property')).toBe(true);
    expect(isValidWireType('event')).toBe(true);
    expect(isValidWireType('twoWay')).toBe(true);
  });

  it('should return false for invalid strings', () => {
    expect(isValidWireType('banana')).toBe(false);
    expect(isValidWireType('')).toBe(false);
    expect(isValidWireType('INTERPOLATION')).toBe(false);
  });

  it('should narrow type when used as type guard', () => {
    const value = 'interpolation' as string;
    expect(isValidWireType(value)).toBe(true);
    if (isValidWireType(value)) {
      // value is narrowed to WireType here — assignment proves it
      const wt: WireType = value;
      expect(wt).toBe(WireType.interpolation);
    }
  });
});

describe('isSourceTargetCompatible', () => {
  const makeSource = (portType: 'property' | 'method'): SourcePort => ({
    id: 'src-1',
    name: 'test',
    portType,
    dataType: 'string',
    position: { x: 0, y: 0 },
  });

  const makeTarget = (bindingSlot: 'interpolation' | 'property' | 'event' | 'twoWay'): TargetPort => ({
    id: 'tgt-1',
    name: 'test',
    bindingSlot,
    position: { x: 100, y: 0 },
  });

  it('should return true for property source + interpolation target + WireType.interpolation', () => {
    expect(isSourceTargetCompatible(makeSource('property'), makeTarget('interpolation'), WireType.interpolation)).toBe(true);
  });

  it('should return true for property source + property target + WireType.property', () => {
    expect(isSourceTargetCompatible(makeSource('property'), makeTarget('property'), WireType.property)).toBe(true);
  });

  it('should return true for method source + event target + WireType.event', () => {
    expect(isSourceTargetCompatible(makeSource('method'), makeTarget('event'), WireType.event)).toBe(true);
  });

  it('should return true for property source + twoWay target + WireType.twoWay', () => {
    expect(isSourceTargetCompatible(makeSource('property'), makeTarget('twoWay'), WireType.twoWay)).toBe(true);
  });

  it('should return false for method source + property target + WireType.property', () => {
    expect(isSourceTargetCompatible(makeSource('method'), makeTarget('property'), WireType.property)).toBe(false);
  });

  it('should return false for property source + event target + WireType.event', () => {
    expect(isSourceTargetCompatible(makeSource('property'), makeTarget('event'), WireType.event)).toBe(false);
  });
});

describe('verifyConnections', () => {
  const makeWire = (sourcePortId: string, targetPortId: string, wireType: WireType, id = 'w'): WireConnection => ({
    id,
    sourcePortId,
    targetPortId,
    wireType,
    isPreWired: false,
  });

  it('should return all correct when every expected wire is matched', () => {
    const expected = [
      makeWire('s1', 't1', WireType.interpolation, 'e1'),
      makeWire('s2', 't2', WireType.property, 'e2'),
    ];
    const player = [
      makeWire('s1', 't1', WireType.interpolation, 'p1'),
      makeWire('s2', 't2', WireType.property, 'p2'),
    ];

    const result = verifyConnections(player, expected);

    expect(result.correctWires.length).toBe(2);
    expect(result.incorrectWires.length).toBe(0);
    expect(result.missingWires.length).toBe(0);
  });

  it('should return all incorrect and all missing when no wires match', () => {
    const expected = [
      makeWire('s1', 't1', WireType.interpolation, 'e1'),
    ];
    const player = [
      makeWire('s3', 't3', WireType.event, 'p1'),
    ];

    const result = verifyConnections(player, expected);

    expect(result.correctWires.length).toBe(0);
    expect(result.incorrectWires.length).toBe(1);
    expect(result.incorrectWires[0].sourcePortId).toBe('s3');
    expect(result.missingWires.length).toBe(1);
    expect(result.missingWires[0].sourcePortId).toBe('s1');
  });

  it('should return all missing when player has no wires', () => {
    const expected = [
      makeWire('s1', 't1', WireType.interpolation, 'e1'),
      makeWire('s2', 't2', WireType.property, 'e2'),
    ];
    const player: WireConnection[] = [];

    const result = verifyConnections(player, expected);

    expect(result.correctWires.length).toBe(0);
    expect(result.incorrectWires.length).toBe(0);
    expect(result.missingWires.length).toBe(2);
    expect(result.missingWires).toEqual(expected);
  });

  it('should handle mixed: some correct, some incorrect, some missing', () => {
    const expected = [
      makeWire('s1', 't1', WireType.interpolation, 'e1'),
      makeWire('s2', 't2', WireType.property, 'e2'),
      makeWire('s3', 't3', WireType.event, 'e3'),
    ];
    const player = [
      makeWire('s1', 't1', WireType.interpolation, 'p1'), // correct
      makeWire('s4', 't4', WireType.twoWay, 'p2'),        // incorrect
    ];

    const result = verifyConnections(player, expected);

    expect(result.correctWires.length).toBe(1);
    expect(result.correctWires[0].sourcePortId).toBe('s1');
    expect(result.incorrectWires.length).toBe(1);
    expect(result.incorrectWires[0].sourcePortId).toBe('s4');
    expect(result.missingWires.length).toBe(2);
  });
});

describe('SourcePort', () => {
  it('should accept valid port with all fields', () => {
    const port: SourcePort = {
      id: 'src-title',
      name: 'title',
      portType: 'property',
      dataType: 'string',
      position: { x: 50, y: 100 },
    };

    expect(port.id).toBe('src-title');
    expect(port.name).toBe('title');
    expect(port.portType).toBe('property');
    expect(port.dataType).toBe('string');
    expect(port.position).toEqual({ x: 50, y: 100 });
  });
});

describe('TargetPort', () => {
  it('should accept valid port with all binding slot types', () => {
    const port: TargetPort = {
      id: 'tgt-display',
      name: 'Title Display',
      bindingSlot: 'interpolation',
      position: { x: 300, y: 100 },
    };

    expect(port.id).toBe('tgt-display');
    expect(port.name).toBe('Title Display');
    expect(port.bindingSlot).toBe('interpolation');
    expect(port.position).toEqual({ x: 300, y: 100 });
  });
});

describe('WireConnection', () => {
  it('should accept valid pre-wired connection with isPreWired: true and isCorrect: false', () => {
    const conn: WireConnection = {
      id: 'wire-1',
      sourcePortId: 'src-1',
      targetPortId: 'tgt-1',
      wireType: WireType.interpolation,
      isPreWired: true,
      isCorrect: false,
    };

    expect(conn.id).toBe('wire-1');
    expect(conn.sourcePortId).toBe('src-1');
    expect(conn.targetPortId).toBe('tgt-1');
    expect(conn.wireType).toBe('interpolation');
    expect(conn.isPreWired).toBe(true);
    expect(conn.isCorrect).toBe(false);
  });

  it('should accept valid player-drawn connection with isCorrect omitted', () => {
    const conn: WireConnection = {
      id: 'wire-2',
      sourcePortId: 'src-1',
      targetPortId: 'tgt-2',
      wireType: WireType.property,
      isPreWired: false,
    };

    expect(conn.id).toBe('wire-2');
    expect(conn.sourcePortId).toBe('src-1');
    expect(conn.targetPortId).toBe('tgt-2');
    expect(conn.wireType).toBe('property');
    expect(conn.isPreWired).toBe(false);
    expect(conn.isCorrect).toBeUndefined();
  });
});
