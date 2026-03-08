// ---------------------------------------------------------------------------
// Canonical domain model types for Wire Protocol minigame
// ---------------------------------------------------------------------------

/** A 2D position for port placement. */
export interface PortPosition {
  readonly x: number;
  readonly y: number;
}

/** A source port on the component class side. */
export interface SourcePort {
  readonly id: string;
  readonly name: string;
  readonly portType: 'property' | 'method';
  readonly dataType: string;
  readonly position: PortPosition;
}

/** A target port on the template side. */
export interface TargetPort {
  readonly id: string;
  readonly name: string;
  readonly bindingSlot: 'interpolation' | 'property' | 'event' | 'twoWay';
  readonly position: PortPosition;
}

/** The 4 wire binding types in Wire Protocol. */
export enum WireType {
  interpolation = 'interpolation',
  property = 'property',
  event = 'event',
  twoWay = 'twoWay',
}

/**
 * A wire connection between a source and target port.
 * `isCorrect` is optional — only present when `isPreWired` is true.
 */
export interface WireConnection {
  readonly id: string;
  readonly sourcePortId: string;
  readonly targetPortId: string;
  readonly wireType: WireType;
  readonly isPreWired: boolean;
  readonly isCorrect?: boolean;
}

/** Result of verifying player connections against expected connections. */
export interface VerificationResult {
  readonly correctWires: readonly WireConnection[];
  readonly incorrectWires: readonly WireConnection[];
  readonly missingWires: readonly WireConnection[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Color mapping for each wire type, using Nexus Station theme colors. */
export const WIRE_TYPE_COLORS: Readonly<Record<WireType, string>> = {
  [WireType.interpolation]: '#3B82F6', // Reactor Blue
  [WireType.property]: '#22C55E',      // Sensor Green
  [WireType.event]: '#F97316',         // Alert Orange
  [WireType.twoWay]: '#A855F7',        // Comm Purple
};

// ---------------------------------------------------------------------------
// Utility functions
// ---------------------------------------------------------------------------

/** Type guard that returns true when the given string is a valid WireType. */
export function isValidWireType(value: string): value is WireType {
  return Object.values(WireType).includes(value as WireType);
}

/**
 * Returns true when a source port can connect to a target port with the given wire type.
 *
 * Compatibility rules:
 * - property source + interpolation target = WireType.interpolation
 * - property source + property target = WireType.property
 * - method source + event target = WireType.event
 * - property source + twoWay target = WireType.twoWay
 */
export function isSourceTargetCompatible(
  source: SourcePort,
  target: TargetPort,
  wireType: WireType,
): boolean {
  switch (wireType) {
    case WireType.interpolation:
      return source.portType === 'property' && target.bindingSlot === 'interpolation';
    case WireType.property:
      return source.portType === 'property' && target.bindingSlot === 'property';
    case WireType.event:
      return source.portType === 'method' && target.bindingSlot === 'event';
    case WireType.twoWay:
      return source.portType === 'property' && target.bindingSlot === 'twoWay';
  }
}

/**
 * Compares player wires against expected wires.
 * Matching key: (sourcePortId, targetPortId, wireType) — NOT by id.
 */
export function verifyConnections(
  connections: readonly WireConnection[],
  expectedConnections: readonly WireConnection[],
): VerificationResult {
  const matchesExpected = (conn: WireConnection, expected: WireConnection): boolean =>
    conn.sourcePortId === expected.sourcePortId &&
    conn.targetPortId === expected.targetPortId &&
    conn.wireType === expected.wireType;

  const correctWires: WireConnection[] = [];
  const incorrectWires: WireConnection[] = [];
  const matched = new Set<number>();

  for (const conn of connections) {
    const expectedIdx = expectedConnections.findIndex(
      (exp, idx) => !matched.has(idx) && matchesExpected(conn, exp),
    );
    if (expectedIdx !== -1) {
      correctWires.push(conn);
      matched.add(expectedIdx);
    } else {
      incorrectWires.push(conn);
    }
  }

  const missingWires = expectedConnections.filter((_, idx) => !matched.has(idx));

  return { correctWires, incorrectWires, missingWires };
}
