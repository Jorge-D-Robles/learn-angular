import { WireProtocolValidationService } from './wire-protocol-validation.service';
import {
  WireType,
  type SourcePort,
  type TargetPort,
  type WireConnection,
} from './wire-protocol.types';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function makeSource(portType: 'property' | 'method', overrides?: Partial<SourcePort>): SourcePort {
  return {
    id: 'src-1',
    name: 'test',
    portType,
    dataType: 'string',
    position: { x: 0, y: 0 },
    ...overrides,
  };
}

function makeTarget(bindingSlot: 'interpolation' | 'property' | 'event' | 'twoWay', overrides?: Partial<TargetPort>): TargetPort {
  return {
    id: 'tgt-1',
    name: 'test',
    bindingSlot,
    position: { x: 100, y: 0 },
    ...overrides,
  };
}

function makeWire(sourcePortId: string, targetPortId: string, wireType: WireType, id = 'w'): WireConnection {
  return {
    id,
    sourcePortId,
    targetPortId,
    wireType,
    isPreWired: false,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('WireProtocolValidationService', () => {
  let service: WireProtocolValidationService;

  beforeEach(() => {
    service = new WireProtocolValidationService();
  });

  // --- isCorrectBindingType ---

  describe('isCorrectBindingType', () => {
    it('should return true for property source + interpolation target + WireType.interpolation', () => {
      expect(service.isCorrectBindingType(makeSource('property'), makeTarget('interpolation'), WireType.interpolation)).toBe(true);
    });

    it('should return true for property source + property target + WireType.property', () => {
      expect(service.isCorrectBindingType(makeSource('property'), makeTarget('property'), WireType.property)).toBe(true);
    });

    it('should return true for method source + event target + WireType.event', () => {
      expect(service.isCorrectBindingType(makeSource('method'), makeTarget('event'), WireType.event)).toBe(true);
    });

    it('should return true for property source + twoWay target + WireType.twoWay', () => {
      expect(service.isCorrectBindingType(makeSource('property'), makeTarget('twoWay'), WireType.twoWay)).toBe(true);
    });

    it('should return false for method source + property target + WireType.property', () => {
      expect(service.isCorrectBindingType(makeSource('method'), makeTarget('property'), WireType.property)).toBe(false);
    });

    it('should return false for property source + event target + WireType.event', () => {
      expect(service.isCorrectBindingType(makeSource('property'), makeTarget('event'), WireType.event)).toBe(false);
    });

    it('should return false for property source + interpolation target + WireType.property', () => {
      expect(service.isCorrectBindingType(makeSource('property'), makeTarget('interpolation'), WireType.property)).toBe(false);
    });
  });

  // --- getExpectedWireType ---

  describe('getExpectedWireType', () => {
    it('should return WireType.interpolation for property source + interpolation target', () => {
      expect(service.getExpectedWireType(makeSource('property'), makeTarget('interpolation'))).toBe(WireType.interpolation);
    });

    it('should return WireType.property for property source + property target', () => {
      expect(service.getExpectedWireType(makeSource('property'), makeTarget('property'))).toBe(WireType.property);
    });

    it('should return WireType.event for method source + event target', () => {
      expect(service.getExpectedWireType(makeSource('method'), makeTarget('event'))).toBe(WireType.event);
    });

    it('should return WireType.twoWay for property source + twoWay target', () => {
      expect(service.getExpectedWireType(makeSource('property'), makeTarget('twoWay'))).toBe(WireType.twoWay);
    });

    it('should return null for method source + interpolation target', () => {
      expect(service.getExpectedWireType(makeSource('method'), makeTarget('interpolation'))).toBeNull();
    });

    it('should return null for method source + property target', () => {
      expect(service.getExpectedWireType(makeSource('method'), makeTarget('property'))).toBeNull();
    });

    it('should return null for method source + twoWay target', () => {
      expect(service.getExpectedWireType(makeSource('method'), makeTarget('twoWay'))).toBeNull();
    });
  });

  // --- validateWire ---

  describe('validateWire', () => {
    it('should return valid=true when wire type matches expected for interpolation', () => {
      const sourcePorts = new Map([['src-1', makeSource('property')]]);
      const targetPorts = new Map([['tgt-1', makeTarget('interpolation')]]);
      const wire = makeWire('src-1', 'tgt-1', WireType.interpolation);

      const result = service.validateWire(wire, sourcePorts, targetPorts);

      expect(result.valid).toBe(true);
      expect(result.wireType).toBe(WireType.interpolation);
      expect(result.expectedWireType).toBe(WireType.interpolation);
      expect(result.commonMistakeHint).toBeNull();
    });

    it('should return valid=true when wire type matches expected for property', () => {
      const sourcePorts = new Map([['src-1', makeSource('property')]]);
      const targetPorts = new Map([['tgt-1', makeTarget('property')]]);
      const wire = makeWire('src-1', 'tgt-1', WireType.property);

      const result = service.validateWire(wire, sourcePorts, targetPorts);

      expect(result.valid).toBe(true);
      expect(result.wireType).toBe(WireType.property);
      expect(result.expectedWireType).toBe(WireType.property);
    });

    it('should return valid=true when wire type matches expected for event', () => {
      const sourcePorts = new Map([['src-1', makeSource('method')]]);
      const targetPorts = new Map([['tgt-1', makeTarget('event')]]);
      const wire = makeWire('src-1', 'tgt-1', WireType.event);

      const result = service.validateWire(wire, sourcePorts, targetPorts);

      expect(result.valid).toBe(true);
      expect(result.wireType).toBe(WireType.event);
      expect(result.expectedWireType).toBe(WireType.event);
    });

    it('should return valid=true when wire type matches expected for twoWay', () => {
      const sourcePorts = new Map([['src-1', makeSource('property')]]);
      const targetPorts = new Map([['tgt-1', makeTarget('twoWay')]]);
      const wire = makeWire('src-1', 'tgt-1', WireType.twoWay);

      const result = service.validateWire(wire, sourcePorts, targetPorts);

      expect(result.valid).toBe(true);
      expect(result.wireType).toBe(WireType.twoWay);
      expect(result.expectedWireType).toBe(WireType.twoWay);
    });

    it('should return valid=false with commonMistakeHint when using interpolation where property is expected', () => {
      const sourcePorts = new Map([['src-1', makeSource('property')]]);
      const targetPorts = new Map([['tgt-1', makeTarget('property')]]);
      const wire = makeWire('src-1', 'tgt-1', WireType.interpolation);

      const result = service.validateWire(wire, sourcePorts, targetPorts);

      expect(result.valid).toBe(false);
      expect(result.wireType).toBe(WireType.interpolation);
      expect(result.expectedWireType).toBe(WireType.property);
      expect(result.commonMistakeHint).not.toBeNull();
    });

    it('should return valid=false with expectedWireType when wire type is wrong', () => {
      const sourcePorts = new Map([['src-1', makeSource('property')]]);
      const targetPorts = new Map([['tgt-1', makeTarget('interpolation')]]);
      const wire = makeWire('src-1', 'tgt-1', WireType.event);

      const result = service.validateWire(wire, sourcePorts, targetPorts);

      expect(result.valid).toBe(false);
      expect(result.wireType).toBe(WireType.event);
      expect(result.expectedWireType).toBe(WireType.interpolation);
    });

    it('should return valid=false with null expectedWireType when source-target pair has no valid mapping', () => {
      const sourcePorts = new Map([['src-1', makeSource('method')]]);
      const targetPorts = new Map([['tgt-1', makeTarget('interpolation')]]);
      const wire = makeWire('src-1', 'tgt-1', WireType.interpolation);

      const result = service.validateWire(wire, sourcePorts, targetPorts);

      expect(result.valid).toBe(false);
      expect(result.expectedWireType).toBeNull();
      expect(result.commonMistakeHint).toBeNull();
    });

    it('should return valid=false when source port is not found in the provided map', () => {
      const sourcePorts = new Map<string, SourcePort>();
      const targetPorts = new Map([['tgt-1', makeTarget('interpolation')]]);
      const wire = makeWire('src-missing', 'tgt-1', WireType.interpolation);

      const result = service.validateWire(wire, sourcePorts, targetPorts);

      expect(result.valid).toBe(false);
      expect(result.expectedWireType).toBeNull();
      expect(result.commonMistakeHint).toBeNull();
    });

    it('should return valid=false when target port is not found in the provided map', () => {
      const sourcePorts = new Map([['src-1', makeSource('property')]]);
      const targetPorts = new Map<string, TargetPort>();
      const wire = makeWire('src-1', 'tgt-missing', WireType.interpolation);

      const result = service.validateWire(wire, sourcePorts, targetPorts);

      expect(result.valid).toBe(false);
      expect(result.expectedWireType).toBeNull();
      expect(result.commonMistakeHint).toBeNull();
    });
  });

  // --- getCommonMistake ---

  describe('getCommonMistake', () => {
    it('should return hint for interpolation used where property is expected', () => {
      const hint = service.getCommonMistake(makeSource('property'), makeTarget('property'), WireType.interpolation);

      expect(hint).toBe('Use [property] binding instead of {{ }} when binding to an element property directly.');
    });

    it('should return hint for property used where interpolation is expected', () => {
      const hint = service.getCommonMistake(makeSource('property'), makeTarget('interpolation'), WireType.property);

      expect(hint).toBe('Use {{ }} interpolation to display text content, not [property] binding.');
    });

    it('should return hint for property used where event is expected', () => {
      const hint = service.getCommonMistake(makeSource('method'), makeTarget('event'), WireType.property);

      expect(hint).toBe('This connects to an action handler. Use (event) binding, not [property].');
    });

    it('should return hint for property used where twoWay is expected', () => {
      const hint = service.getCommonMistake(makeSource('property'), makeTarget('twoWay'), WireType.property);

      expect(hint).toBe('Use [(ngModel)] two-way binding for inputs that both read and write a value.');
    });

    it('should return null when incorrect type equals expected type', () => {
      const hint = service.getCommonMistake(makeSource('property'), makeTarget('interpolation'), WireType.interpolation);

      expect(hint).toBeNull();
    });

    it('should return null for method source + interpolation target', () => {
      const hint = service.getCommonMistake(makeSource('method'), makeTarget('interpolation'), WireType.event);

      expect(hint).toBeNull();
    });
  });

  // --- validateAll ---

  describe('validateAll', () => {
    it('should return all correct when player wires match expected wires', () => {
      const expected = [
        makeWire('s1', 't1', WireType.interpolation, 'e1'),
        makeWire('s2', 't2', WireType.property, 'e2'),
      ];
      const player = [
        makeWire('s1', 't1', WireType.interpolation, 'p1'),
        makeWire('s2', 't2', WireType.property, 'p2'),
      ];

      const result = service.validateAll(player, expected);

      expect(result.correctWires).toHaveLength(2);
      expect(result.incorrectWires).toHaveLength(0);
      expect(result.missingWires).toHaveLength(0);
    });

    it('should return incorrect wires when player wires have wrong types', () => {
      const expected = [
        makeWire('s1', 't1', WireType.interpolation, 'e1'),
      ];
      const player = [
        makeWire('s1', 't1', WireType.property, 'p1'),
      ];

      const result = service.validateAll(player, expected);

      expect(result.correctWires).toHaveLength(0);
      expect(result.incorrectWires).toHaveLength(1);
      expect(result.missingWires).toHaveLength(1);
    });

    it('should return missing wires when player has fewer wires than expected', () => {
      const expected = [
        makeWire('s1', 't1', WireType.interpolation, 'e1'),
        makeWire('s2', 't2', WireType.property, 'e2'),
      ];
      const player: WireConnection[] = [];

      const result = service.validateAll(player, expected);

      expect(result.correctWires).toHaveLength(0);
      expect(result.incorrectWires).toHaveLength(0);
      expect(result.missingWires).toHaveLength(2);
    });

    it('should handle mixed: some correct, some incorrect, some missing', () => {
      const expected = [
        makeWire('s1', 't1', WireType.interpolation, 'e1'),
        makeWire('s2', 't2', WireType.property, 'e2'),
        makeWire('s3', 't3', WireType.event, 'e3'),
      ];
      const player = [
        makeWire('s1', 't1', WireType.interpolation, 'p1'), // correct
        makeWire('s4', 't4', WireType.twoWay, 'p2'),        // incorrect (extra)
      ];

      const result = service.validateAll(player, expected);

      expect(result.correctWires).toHaveLength(1);
      expect(result.incorrectWires).toHaveLength(1);
      expect(result.missingWires).toHaveLength(2);
    });

    it('should return empty arrays when both player and expected are empty', () => {
      const result = service.validateAll([], []);

      expect(result.correctWires).toHaveLength(0);
      expect(result.incorrectWires).toHaveLength(0);
      expect(result.missingWires).toHaveLength(0);
    });

    it('should detect pre-wired incorrect connection as wrong on verification', () => {
      const expected = [
        makeWire('s1', 't1', WireType.interpolation, 'e1'),
      ];
      const preWiredWrong: WireConnection = {
        id: 'pw-1',
        sourcePortId: 's1',
        targetPortId: 't1',
        wireType: WireType.property, // wrong type
        isPreWired: true,
        isCorrect: false,
      };

      const result = service.validateAll([preWiredWrong], expected);

      expect(result.correctWires).toHaveLength(0);
      expect(result.incorrectWires).toHaveLength(1);
      expect(result.incorrectWires[0].id).toBe('pw-1');
      expect(result.missingWires).toHaveLength(1);
    });
  });
});
