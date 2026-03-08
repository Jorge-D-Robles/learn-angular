// ---------------------------------------------------------------------------
// WireProtocolValidationService — stateless validation for Wire Protocol
// ---------------------------------------------------------------------------
// Pure computation service: all methods accept inputs as arguments, no
// internal state. The engine passes data when it needs validation.
// ---------------------------------------------------------------------------

import { Injectable } from '@angular/core';
import {
  isSourceTargetCompatible,
  verifyConnections,
  WireType,
  type SourcePort,
  type TargetPort,
  type WireConnection,
  type VerificationResult,
} from './wire-protocol.types';

// ---------------------------------------------------------------------------
// Public interfaces
// ---------------------------------------------------------------------------

export interface WireValidationResult {
  readonly valid: boolean;
  readonly wireType: WireType;
  readonly expectedWireType: WireType | null;
  readonly commonMistakeHint: string | null;
}

// ---------------------------------------------------------------------------
// Common mistake hints
// ---------------------------------------------------------------------------

/** Map key: `${incorrectType}:${expectedType}` */
const COMMON_MISTAKE_HINTS: Readonly<Record<string, string>> = {
  'interpolation:property': 'Use [property] binding instead of {{ }} when binding to an element property directly.',
  'property:interpolation': 'Use {{ }} interpolation to display text content, not [property] binding.',
  'interpolation:event': 'Event bindings use (event) syntax, not {{ }} interpolation.',
  'event:property': 'This is a data binding, not an action. Use [property] instead of (event).',
  'property:event': 'This connects to an action handler. Use (event) binding, not [property].',
  'property:twoWay': 'Use [(ngModel)] two-way binding for inputs that both read and write a value.',
  'interpolation:twoWay': 'Use [(ngModel)] two-way binding for form inputs, not {{ }} interpolation.',
  'event:twoWay': 'Use [(ngModel)] two-way binding, not (event) binding, for synchronized inputs.',
  'twoWay:property': 'One-way [property] binding is sufficient here -- data flows only from component to template.',
  'twoWay:interpolation': 'Use {{ }} interpolation for display text. Two-way binding is for form inputs.',
  'twoWay:event': 'Use (event) binding for action handlers. Two-way binding is for form inputs.',
  'event:interpolation': 'Use {{ }} interpolation to display text, not (event) binding.',
};

// ---------------------------------------------------------------------------
// Valid source-target → wire type mappings
// ---------------------------------------------------------------------------

/** Mapping from `${portType}:${bindingSlot}` to the correct WireType. */
const EXPECTED_WIRE_TYPE: Readonly<Record<string, WireType>> = {
  'property:interpolation': WireType.interpolation,
  'property:property': WireType.property,
  'method:event': WireType.event,
  'property:twoWay': WireType.twoWay,
};

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

@Injectable()
export class WireProtocolValidationService {
  /** Check if a wire type is correct for a source-target pair. */
  isCorrectBindingType(source: SourcePort, target: TargetPort, wireType: WireType): boolean {
    return isSourceTargetCompatible(source, target, wireType);
  }

  /** Return the expected wire type for a source-target pair, or null if no valid mapping. */
  getExpectedWireType(source: SourcePort, target: TargetPort): WireType | null {
    const key = `${source.portType}:${target.bindingSlot}`;
    return EXPECTED_WIRE_TYPE[key] ?? null;
  }

  /** Validate a single wire against port maps. Returns validity, expected type, and hint. */
  validateWire(
    wire: WireConnection,
    sourcePorts: ReadonlyMap<string, SourcePort>,
    targetPorts: ReadonlyMap<string, TargetPort>,
  ): WireValidationResult {
    const source = sourcePorts.get(wire.sourcePortId);
    const target = targetPorts.get(wire.targetPortId);

    if (!source || !target) {
      return {
        valid: false,
        wireType: wire.wireType,
        expectedWireType: null,
        commonMistakeHint: null,
      };
    }

    const expectedWireType = this.getExpectedWireType(source, target);
    const valid = expectedWireType === wire.wireType;

    return {
      valid,
      wireType: wire.wireType,
      expectedWireType,
      commonMistakeHint: valid ? null : this.getCommonMistake(source, target, wire.wireType),
    };
  }

  /** Validate all player wires against expected solution wires. Delegates to verifyConnections. */
  validateAll(
    wires: readonly WireConnection[],
    expectedWires: readonly WireConnection[],
  ): VerificationResult {
    return verifyConnections(wires, expectedWires);
  }

  /** Return an educational hint for a common binding mistake, or null. */
  getCommonMistake(source: SourcePort, target: TargetPort, incorrectType: WireType): string | null {
    const expectedType = this.getExpectedWireType(source, target);
    if (expectedType === null || incorrectType === expectedType) {
      return null;
    }
    const key = `${incorrectType}:${expectedType}`;
    return COMMON_MISTAKE_HINTS[key] ?? null;
  }
}
