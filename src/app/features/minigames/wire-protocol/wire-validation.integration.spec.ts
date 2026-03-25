// ---------------------------------------------------------------------------
// Wire Protocol Validation Integration Tests (binding type validation)
// ---------------------------------------------------------------------------
// Exercises WireProtocolValidationService with a realistic "level-like"
// scenario containing all 4 binding types in a single cohesive fixture.
// Unlike the unit tests (wire-protocol-validation.service.spec.ts) which use
// minimal synthetic ports, this builds a complete Communications Panel
// scenario with named ports, multiple wire types, and mistake/pre-wired cases.
// ---------------------------------------------------------------------------

import { WireProtocolValidationService } from './wire-protocol-validation.service';
import {
  WireType,
  type SourcePort,
  type TargetPort,
  type WireConnection,
} from './wire-protocol.types';

// ---------------------------------------------------------------------------
// Fixture builders — realistic level-like data
// ---------------------------------------------------------------------------

function makeSource(
  id: string,
  name: string,
  portType: 'property' | 'method',
  dataType: string,
  yPos: number,
): SourcePort {
  return { id, name, portType, dataType, position: { x: 0, y: yPos } };
}

function makeTarget(
  id: string,
  name: string,
  bindingSlot: 'interpolation' | 'property' | 'event' | 'twoWay',
  yPos: number,
): TargetPort {
  return { id, name, bindingSlot, position: { x: 200, y: yPos } };
}

function makeWire(
  id: string,
  sourcePortId: string,
  targetPortId: string,
  wireType: WireType,
): WireConnection {
  return { id, sourcePortId, targetPortId, wireType, isPreWired: false };
}

function makePreWire(
  id: string,
  sourcePortId: string,
  targetPortId: string,
  wireType: WireType,
  isCorrect: boolean,
): WireConnection {
  return { id, sourcePortId, targetPortId, wireType, isPreWired: true, isCorrect };
}

// ---------------------------------------------------------------------------
// Communications Panel fixture — 6 sources, 6 targets
// ---------------------------------------------------------------------------

// Source ports (component class side)
const S1 = makeSource('s1', 'stationName', 'property', 'string', 0);   // for interpolation
const S2 = makeSource('s2', 'shieldLevel', 'property', 'number', 40);  // for property binding
const S3 = makeSource('s3', 'onAlert', 'method', 'void', 80);         // for event binding
const S4 = makeSource('s4', 'frequency', 'property', 'number', 120);   // for twoWay binding
const S5 = makeSource('s5', 'crewCount', 'property', 'number', 160);   // for mistake scenario
const S6 = makeSource('s6', 'resetAll', 'method', 'void', 200);       // extra method source

// Target ports (template side)
const T1 = makeTarget('t1', '{{ stationName }}', 'interpolation', 0);
const T2 = makeTarget('t2', '[value]="shieldLevel"', 'property', 40);
const T3 = makeTarget('t3', '(click)="onAlert()"', 'event', 80);
const T4 = makeTarget('t4', '[(ngModel)]="frequency"', 'twoWay', 120);
const T5 = makeTarget('t5', '{{ crewCount }}', 'interpolation', 160);
const T6 = makeTarget('t6', '(dblclick)="resetAll()"', 'event', 200);

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Wire Protocol Validation Integration (binding type validation)', () => {
  let service: WireProtocolValidationService;
  let sourcePorts: ReadonlyMap<string, SourcePort>;
  let targetPorts: ReadonlyMap<string, TargetPort>;

  beforeEach(() => {
    service = new WireProtocolValidationService();

    sourcePorts = new Map<string, SourcePort>([
      [S1.id, S1],
      [S2.id, S2],
      [S3.id, S3],
      [S4.id, S4],
      [S5.id, S5],
      [S6.id, S6],
    ]);

    targetPorts = new Map<string, TargetPort>([
      [T1.id, T1],
      [T2.id, T2],
      [T3.id, T3],
      [T4.id, T4],
      [T5.id, T5],
      [T6.id, T6],
    ]);
  });

  it('interpolation wire between property source and {{ }} target validates correctly', () => {
    const wire = makeWire('w1', 's1', 't1', WireType.interpolation);

    const result = service.validateWire(wire, sourcePorts, targetPorts);

    expect(result.valid).toBe(true);
    expect(result.wireType).toBe(WireType.interpolation);
    expect(result.expectedWireType).toBe(WireType.interpolation);
    expect(result.commonMistakeHint).toBeNull();
  });

  it('property wire between property source and [property] target validates correctly', () => {
    const wire = makeWire('w2', 's2', 't2', WireType.property);

    const result = service.validateWire(wire, sourcePorts, targetPorts);

    expect(result.valid).toBe(true);
    expect(result.wireType).toBe(WireType.property);
    expect(result.expectedWireType).toBe(WireType.property);
    expect(result.commonMistakeHint).toBeNull();
  });

  it('event wire between method source and (event) target validates correctly', () => {
    const wire = makeWire('w3', 's3', 't3', WireType.event);

    const result = service.validateWire(wire, sourcePorts, targetPorts);

    expect(result.valid).toBe(true);
    expect(result.wireType).toBe(WireType.event);
    expect(result.expectedWireType).toBe(WireType.event);
    expect(result.commonMistakeHint).toBeNull();
  });

  it('two-way wire between property source and [(ngModel)] target validates correctly', () => {
    const wire = makeWire('w4', 's4', 't4', WireType.twoWay);

    const result = service.validateWire(wire, sourcePorts, targetPorts);

    expect(result.valid).toBe(true);
    expect(result.wireType).toBe(WireType.twoWay);
    expect(result.expectedWireType).toBe(WireType.twoWay);
    expect(result.commonMistakeHint).toBeNull();
  });

  it('wrong wire type (interpolation where property needed) returns validation failure with common mistake hint', () => {
    const wire = makeWire('w-wrong', 's5', 't2', WireType.interpolation);

    const result = service.validateWire(wire, sourcePorts, targetPorts);

    expect(result.valid).toBe(false);
    expect(result.wireType).toBe(WireType.interpolation);
    expect(result.expectedWireType).toBe(WireType.property);
    expect(result.commonMistakeHint).toBe(
      'Use [property] binding instead of {{ }} when binding to an element property directly.',
    );
  });

  it('validateAll() returns per-wire pass/fail for a set of mixed correct and incorrect wires', () => {
    const expectedWires = [
      makeWire('e1', 's1', 't1', WireType.interpolation),
      makeWire('e2', 's2', 't2', WireType.property),
      makeWire('e3', 's3', 't3', WireType.event),
      makeWire('e4', 's4', 't4', WireType.twoWay),
    ];

    const playerWires = [
      makeWire('p1', 's1', 't1', WireType.interpolation), // correct
      makeWire('p2', 's2', 't2', WireType.property),      // correct
      makeWire('p3', 's3', 't3', WireType.interpolation),  // wrong type (interpolation instead of event)
      makeWire('p4', 's5', 't5', WireType.twoWay),        // wrong pair (extra wire, not in expected)
    ];

    const result = service.validateAll(playerWires, expectedWires);

    expect(result.correctWires.length).toBe(2);
    expect(result.incorrectWires.length).toBe(2);
    expect(result.missingWires.length).toBe(2);
  });

  it('pre-wired incorrect connection detected as wrong on verification', () => {
    const expectedWires = [
      makeWire('e1', 's1', 't1', WireType.interpolation),
      makeWire('e2', 's2', 't2', WireType.property),
    ];

    const playerWires = [
      makePreWire('pw-1', 's1', 't1', WireType.property, false), // pre-wired, wrong type
      makeWire('p2', 's2', 't2', WireType.property),              // correct
    ];

    const result = service.validateAll(playerWires, expectedWires);

    expect(result.correctWires.length).toBe(1);
    expect(result.incorrectWires.length).toBe(1);
    expect(result.incorrectWires[0].isPreWired).toBe(true);
    expect(result.missingWires.length).toBe(1);
  });
});
