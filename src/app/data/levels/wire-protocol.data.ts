import { DifficultyTier } from '../../core/minigame/minigame.types';
import type { LevelDefinition, LevelPack } from '../../core/levels/level.types';
import type {
  SourcePort,
  TargetPort,
  WireConnection,
} from '../../features/minigames/wire-protocol/wire-protocol.types';
import { WireType } from '../../features/minigames/wire-protocol/wire-protocol.types';

// ---------------------------------------------------------------------------
// Game-specific type definitions for Wire Protocol
// ---------------------------------------------------------------------------

/** Context about which component is being wired (for UI display). */
export interface ComponentContext {
  readonly componentName: string;
  readonly description: string;
}

/** Game-specific data for Wire Protocol levels. */
export interface WireProtocolLevelData {
  readonly components: readonly ComponentContext[];
  readonly sourcePorts: readonly SourcePort[];
  readonly targetPorts: readonly TargetPort[];
  readonly correctWires: readonly WireConnection[];
  readonly preWiredConnections: readonly WireConnection[];
  readonly maxVerifications: number;
}

// ---------------------------------------------------------------------------
// Builder helpers (private to this file)
// ---------------------------------------------------------------------------

/** Build a SourcePort with auto-calculated position. */
function srcPort(
  prefix: string,
  idx: number,
  count: number,
  name: string,
  portType: 'property' | 'method',
  dataType: string,
): SourcePort {
  return {
    id: `${prefix}-s${idx}`,
    name,
    portType,
    dataType,
    position: { x: 0, y: (idx) * (100 / (count + 1)) },
  };
}

/** Build a TargetPort with auto-calculated position. */
function tgtPort(
  prefix: string,
  idx: number,
  count: number,
  name: string,
  bindingSlot: 'interpolation' | 'property' | 'event' | 'twoWay',
): TargetPort {
  return {
    id: `${prefix}-t${idx}`,
    name,
    bindingSlot,
    position: { x: 100, y: (idx) * (100 / (count + 1)) },
  };
}

/** Build a WireConnection for correctWires (isPreWired: false, no isCorrect). */
function wire(
  prefix: string,
  idx: number,
  sourcePortId: string,
  targetPortId: string,
  wireType: WireType,
): WireConnection {
  return { id: `${prefix}-w${idx}`, sourcePortId, targetPortId, wireType, isPreWired: false };
}

/** Build a WireConnection for preWiredConnections. */
function preWire(
  prefix: string,
  idx: number,
  sourcePortId: string,
  targetPortId: string,
  wireType: WireType,
  isCorrect: boolean,
): WireConnection {
  return {
    id: `${prefix}-pw${idx}`,
    sourcePortId,
    targetPortId,
    wireType,
    isPreWired: true,
    isCorrect,
  };
}

// ---------------------------------------------------------------------------
// Level definitions
// ---------------------------------------------------------------------------

export const WIRE_PROTOCOL_LEVELS: readonly LevelDefinition<WireProtocolLevelData>[] = [
  // =========================================================================
  // BASIC TIER (Levels 1-6)
  // =========================================================================

  // Level 1 — Sensor Readout (Interpolation only)
  {
    levelId: 'wp-basic-01',
    gameId: 'wire-protocol',
    tier: DifficultyTier.Basic,
    order: 1,
    title: 'Sensor Readout',
    conceptIntroduced: 'Interpolation only',
    description: 'Display live sensor data in the readout panel.',
    data: {
      components: [
        { componentName: 'SensorReadout', description: 'Display live sensor data in the readout panel' },
      ],
      sourcePorts: [
        srcPort('wp-basic-01', 1, 3, 'temperature', 'property', 'string'),
        srcPort('wp-basic-01', 2, 3, 'pressure', 'property', 'string'),
        srcPort('wp-basic-01', 3, 3, 'humidity', 'property', 'string'),
      ],
      targetPorts: [
        tgtPort('wp-basic-01', 1, 3, '{{ temperature }}', 'interpolation'),
        tgtPort('wp-basic-01', 2, 3, '{{ pressure }}', 'interpolation'),
        tgtPort('wp-basic-01', 3, 3, '{{ humidity }}', 'interpolation'),
      ],
      correctWires: [
        wire('wp-basic-01', 1, 'wp-basic-01-s1', 'wp-basic-01-t1', WireType.interpolation),
        wire('wp-basic-01', 2, 'wp-basic-01-s2', 'wp-basic-01-t2', WireType.interpolation),
        wire('wp-basic-01', 3, 'wp-basic-01-s3', 'wp-basic-01-t3', WireType.interpolation),
      ],
      preWiredConnections: [],
      maxVerifications: 3,
    },
  },

  // Level 2 — Shield Configuration (Property binding)
  {
    levelId: 'wp-basic-02',
    gameId: 'wire-protocol',
    tier: DifficultyTier.Basic,
    order: 2,
    title: 'Shield Configuration',
    conceptIntroduced: 'Property binding',
    description: 'Bind shield strength values to configuration inputs.',
    data: {
      components: [
        { componentName: 'ShieldConfig', description: 'Bind shield strength values to configuration inputs' },
      ],
      sourcePorts: [
        srcPort('wp-basic-02', 1, 3, 'shieldStrength', 'property', 'number'),
        srcPort('wp-basic-02', 2, 3, 'shieldColor', 'property', 'string'),
        srcPort('wp-basic-02', 3, 3, 'isActive', 'property', 'boolean'),
      ],
      targetPorts: [
        tgtPort('wp-basic-02', 1, 3, '[value]="shieldStrength"', 'property'),
        tgtPort('wp-basic-02', 2, 3, '[style.borderColor]="shieldColor"', 'property'),
        tgtPort('wp-basic-02', 3, 3, '[disabled]="!isActive"', 'property'),
      ],
      correctWires: [
        wire('wp-basic-02', 1, 'wp-basic-02-s1', 'wp-basic-02-t1', WireType.property),
        wire('wp-basic-02', 2, 'wp-basic-02-s2', 'wp-basic-02-t2', WireType.property),
        wire('wp-basic-02', 3, 'wp-basic-02-s3', 'wp-basic-02-t3', WireType.property),
      ],
      preWiredConnections: [],
      maxVerifications: 3,
    },
  },

  // Level 3 — Alert Handler (Event binding)
  {
    levelId: 'wp-basic-03',
    gameId: 'wire-protocol',
    tier: DifficultyTier.Basic,
    order: 3,
    title: 'Alert Handler',
    conceptIntroduced: 'Event binding',
    description: 'Connect crew actions to alert response methods.',
    data: {
      components: [
        { componentName: 'AlertHandler', description: 'Connect crew actions to alert response methods' },
      ],
      sourcePorts: [
        srcPort('wp-basic-03', 1, 3, 'dismissAlert()', 'method', 'void'),
        srcPort('wp-basic-03', 2, 3, 'escalateAlert()', 'method', 'void'),
        srcPort('wp-basic-03', 3, 3, 'acknowledgeAlert()', 'method', 'void'),
      ],
      targetPorts: [
        tgtPort('wp-basic-03', 1, 3, '(click)="dismissAlert()"', 'event'),
        tgtPort('wp-basic-03', 2, 3, '(dblclick)="escalateAlert()"', 'event'),
        tgtPort('wp-basic-03', 3, 3, '(keydown.enter)="acknowledgeAlert()"', 'event'),
      ],
      correctWires: [
        wire('wp-basic-03', 1, 'wp-basic-03-s1', 'wp-basic-03-t1', WireType.event),
        wire('wp-basic-03', 2, 'wp-basic-03-s2', 'wp-basic-03-t2', WireType.event),
        wire('wp-basic-03', 3, 'wp-basic-03-s3', 'wp-basic-03-t3', WireType.event),
      ],
      preWiredConnections: [],
      maxVerifications: 3,
    },
  },

  // Level 4 — Crew Display (Mixed interpolation + property)
  {
    levelId: 'wp-basic-04',
    gameId: 'wire-protocol',
    tier: DifficultyTier.Basic,
    order: 4,
    title: 'Crew Display',
    conceptIntroduced: 'Mixed interpolation and property binding',
    description: 'Show crew data with both text and bound attributes.',
    data: {
      components: [
        { componentName: 'CrewDisplay', description: 'Show crew data with both text and bound attributes' },
      ],
      sourcePorts: [
        srcPort('wp-basic-04', 1, 4, 'crewName', 'property', 'string'),
        srcPort('wp-basic-04', 2, 4, 'role', 'property', 'string'),
        srcPort('wp-basic-04', 3, 4, 'avatarUrl', 'property', 'string'),
        srcPort('wp-basic-04', 4, 4, 'isOnDuty', 'property', 'boolean'),
      ],
      targetPorts: [
        tgtPort('wp-basic-04', 1, 4, '{{ crewName }}', 'interpolation'),
        tgtPort('wp-basic-04', 2, 4, '{{ role }}', 'interpolation'),
        tgtPort('wp-basic-04', 3, 4, '[src]="avatarUrl"', 'property'),
        tgtPort('wp-basic-04', 4, 4, '[class.on-duty]="isOnDuty"', 'property'),
      ],
      correctWires: [
        wire('wp-basic-04', 1, 'wp-basic-04-s1', 'wp-basic-04-t1', WireType.interpolation),
        wire('wp-basic-04', 2, 'wp-basic-04-s2', 'wp-basic-04-t2', WireType.interpolation),
        wire('wp-basic-04', 3, 'wp-basic-04-s3', 'wp-basic-04-t3', WireType.property),
        wire('wp-basic-04', 4, 'wp-basic-04-s4', 'wp-basic-04-t4', WireType.property),
      ],
      preWiredConnections: [],
      maxVerifications: 3,
    },
  },

  // Level 5 — Control Interface (Mixed event + property)
  {
    levelId: 'wp-basic-05',
    gameId: 'wire-protocol',
    tier: DifficultyTier.Basic,
    order: 5,
    title: 'Control Interface',
    conceptIntroduced: 'Mixed event and property binding',
    description: 'Wire both configuration inputs and action handlers.',
    data: {
      components: [
        { componentName: 'ControlInterface', description: 'Wire both configuration inputs and action handlers' },
      ],
      sourcePorts: [
        srcPort('wp-basic-05', 1, 4, 'thrusterPower', 'property', 'number'),
        srcPort('wp-basic-05', 2, 4, 'isLocked', 'property', 'boolean'),
        srcPort('wp-basic-05', 3, 4, 'engageThrusters()', 'method', 'void'),
        srcPort('wp-basic-05', 4, 4, 'emergencyStop()', 'method', 'void'),
      ],
      targetPorts: [
        tgtPort('wp-basic-05', 1, 4, '[value]="thrusterPower"', 'property'),
        tgtPort('wp-basic-05', 2, 4, '[disabled]="isLocked"', 'property'),
        tgtPort('wp-basic-05', 3, 4, '(click)="engageThrusters()"', 'event'),
        tgtPort('wp-basic-05', 4, 4, '(click)="emergencyStop()"', 'event'),
      ],
      correctWires: [
        wire('wp-basic-05', 1, 'wp-basic-05-s1', 'wp-basic-05-t1', WireType.property),
        wire('wp-basic-05', 2, 'wp-basic-05-s2', 'wp-basic-05-t2', WireType.property),
        wire('wp-basic-05', 3, 'wp-basic-05-s3', 'wp-basic-05-t3', WireType.event),
        wire('wp-basic-05', 4, 'wp-basic-05-s4', 'wp-basic-05-t4', WireType.event),
      ],
      preWiredConnections: [],
      maxVerifications: 3,
    },
  },

  // Level 6 — Diagnostic Panel (All three types)
  {
    levelId: 'wp-basic-06',
    gameId: 'wire-protocol',
    tier: DifficultyTier.Basic,
    order: 6,
    title: 'Diagnostic Panel',
    conceptIntroduced: 'All three binding types',
    description: 'Display data, bind attributes, and handle actions.',
    data: {
      components: [
        { componentName: 'DiagnosticPanel', description: 'Display data, bind attributes, and handle actions' },
      ],
      sourcePorts: [
        srcPort('wp-basic-06', 1, 3, 'systemStatus', 'property', 'string'),
        srcPort('wp-basic-06', 2, 3, 'cpuLoad', 'property', 'number'),
        srcPort('wp-basic-06', 3, 3, 'runDiagnostic()', 'method', 'void'),
      ],
      targetPorts: [
        tgtPort('wp-basic-06', 1, 3, '{{ systemStatus }}', 'interpolation'),
        tgtPort('wp-basic-06', 2, 3, '[max]="cpuLoad"', 'property'),
        tgtPort('wp-basic-06', 3, 3, '(click)="runDiagnostic()"', 'event'),
      ],
      correctWires: [
        wire('wp-basic-06', 1, 'wp-basic-06-s1', 'wp-basic-06-t1', WireType.interpolation),
        wire('wp-basic-06', 2, 'wp-basic-06-s2', 'wp-basic-06-t2', WireType.property),
        wire('wp-basic-06', 3, 'wp-basic-06-s3', 'wp-basic-06-t3', WireType.event),
      ],
      preWiredConnections: [],
      maxVerifications: 3,
    },
  },

  // =========================================================================
  // INTERMEDIATE TIER (Levels 7-12)
  // =========================================================================

  // Level 7 — Docking Clamp (Two-way binding)
  {
    levelId: 'wp-intermediate-01',
    gameId: 'wire-protocol',
    tier: DifficultyTier.Intermediate,
    order: 1,
    title: 'Docking Clamp',
    conceptIntroduced: 'Two-way binding',
    description: 'Bind docking clamp with banana-in-a-box syntax.',
    data: {
      components: [
        { componentName: 'DockingClamp', description: 'Bind docking clamp with banana-in-a-box syntax' },
      ],
      sourcePorts: [
        srcPort('wp-intermediate-01', 1, 3, 'clampAngle', 'property', 'number'),
        srcPort('wp-intermediate-01', 2, 3, 'isSealed', 'property', 'boolean'),
        srcPort('wp-intermediate-01', 3, 3, 'toggleSeal()', 'method', 'void'),
      ],
      targetPorts: [
        tgtPort('wp-intermediate-01', 1, 3, '[(ngModel)]="clampAngle"', 'twoWay'),
        tgtPort('wp-intermediate-01', 2, 3, '[class.sealed]="isSealed"', 'property'),
        tgtPort('wp-intermediate-01', 3, 3, '(click)="toggleSeal()"', 'event'),
      ],
      correctWires: [
        wire('wp-intermediate-01', 1, 'wp-intermediate-01-s1', 'wp-intermediate-01-t1', WireType.twoWay),
        wire('wp-intermediate-01', 2, 'wp-intermediate-01-s2', 'wp-intermediate-01-t2', WireType.property),
        wire('wp-intermediate-01', 3, 'wp-intermediate-01-s3', 'wp-intermediate-01-t3', WireType.event),
      ],
      preWiredConnections: [],
      maxVerifications: 3,
    },
  },

  // Level 8 — Comm Repair (Pre-wired, some wrong)
  {
    levelId: 'wp-intermediate-02',
    gameId: 'wire-protocol',
    tier: DifficultyTier.Intermediate,
    order: 2,
    title: 'Comm Repair',
    conceptIntroduced: 'Pre-wired connections (some wrong)',
    description: 'Some wires are already connected — find and fix the mistakes.',
    data: {
      components: [
        { componentName: 'CommRelay', description: 'Some wires are already connected — find and fix the mistakes' },
      ],
      sourcePorts: [
        srcPort('wp-intermediate-02', 1, 4, 'signalStrength', 'property', 'number'),
        srcPort('wp-intermediate-02', 2, 4, 'frequency', 'property', 'number'),
        srcPort('wp-intermediate-02', 3, 4, 'channelName', 'property', 'string'),
        srcPort('wp-intermediate-02', 4, 4, 'tune()', 'method', 'void'),
      ],
      targetPorts: [
        tgtPort('wp-intermediate-02', 1, 4, '{{ channelName }}', 'interpolation'),
        tgtPort('wp-intermediate-02', 2, 4, '{{ signalStrength }}', 'interpolation'),
        tgtPort('wp-intermediate-02', 3, 4, '[value]="frequency"', 'property'),
        tgtPort('wp-intermediate-02', 4, 4, '(change)="tune()"', 'event'),
      ],
      correctWires: [
        wire('wp-intermediate-02', 1, 'wp-intermediate-02-s3', 'wp-intermediate-02-t1', WireType.interpolation),
        wire('wp-intermediate-02', 2, 'wp-intermediate-02-s1', 'wp-intermediate-02-t2', WireType.interpolation),
        wire('wp-intermediate-02', 3, 'wp-intermediate-02-s2', 'wp-intermediate-02-t3', WireType.property),
        wire('wp-intermediate-02', 4, 'wp-intermediate-02-s4', 'wp-intermediate-02-t4', WireType.event),
      ],
      preWiredConnections: [
        // channelName->{{ channelName }} correct (interpolation)
        preWire('wp-intermediate-02', 1, 'wp-intermediate-02-s3', 'wp-intermediate-02-t1', WireType.interpolation, true),
        // signalStrength->{{ signalStrength }} WRONG (property instead of interpolation)
        preWire('wp-intermediate-02', 2, 'wp-intermediate-02-s1', 'wp-intermediate-02-t2', WireType.property, false),
        // frequency->[value] correct (property)
        preWire('wp-intermediate-02', 3, 'wp-intermediate-02-s2', 'wp-intermediate-02-t3', WireType.property, true),
      ],
      maxVerifications: 3,
    },
  },

  // Level 9 — Engine Tuning (Expressions in bindings)
  {
    levelId: 'wp-intermediate-03',
    gameId: 'wire-protocol',
    tier: DifficultyTier.Intermediate,
    order: 3,
    title: 'Engine Tuning',
    conceptIntroduced: 'Expressions in bindings',
    description: 'Wire expression-based bindings to engine displays.',
    data: {
      components: [
        { componentName: 'EngineTuning', description: 'Wire expression-based bindings to engine displays' },
      ],
      sourcePorts: [
        srcPort('wp-intermediate-03', 1, 3, 'rpm', 'property', 'number'),
        srcPort('wp-intermediate-03', 2, 3, 'maxRpm', 'property', 'number'),
        srcPort('wp-intermediate-03', 3, 3, 'fuelLevel', 'property', 'number'),
      ],
      targetPorts: [
        tgtPort('wp-intermediate-03', 1, 3, '{{ rpm }}', 'interpolation'),
        tgtPort('wp-intermediate-03', 2, 3, '{{ maxRpm }}', 'interpolation'),
        tgtPort('wp-intermediate-03', 3, 3, '[style.width.%]="fuelLevel"', 'property'),
      ],
      correctWires: [
        wire('wp-intermediate-03', 1, 'wp-intermediate-03-s1', 'wp-intermediate-03-t1', WireType.interpolation),
        wire('wp-intermediate-03', 2, 'wp-intermediate-03-s2', 'wp-intermediate-03-t2', WireType.interpolation),
        wire('wp-intermediate-03', 3, 'wp-intermediate-03-s3', 'wp-intermediate-03-t3', WireType.property),
      ],
      preWiredConnections: [],
      maxVerifications: 3,
    },
  },

  // Level 10 — Crew Roster (Event objects)
  {
    levelId: 'wp-intermediate-04',
    gameId: 'wire-protocol',
    tier: DifficultyTier.Intermediate,
    order: 4,
    title: 'Crew Roster',
    conceptIntroduced: 'Event objects ($event)',
    description: 'Handle events that include the $event object.',
    data: {
      components: [
        { componentName: 'CrewRoster', description: 'Handle events that include the $event object' },
      ],
      sourcePorts: [
        srcPort('wp-intermediate-04', 1, 4, 'crewCount', 'property', 'number'),
        srcPort('wp-intermediate-04', 2, 4, 'selectedCrew', 'property', 'string'),
        srcPort('wp-intermediate-04', 3, 4, 'selectCrew()', 'method', 'void'),
        srcPort('wp-intermediate-04', 4, 4, 'removeCrew()', 'method', 'void'),
      ],
      targetPorts: [
        tgtPort('wp-intermediate-04', 1, 4, '{{ crewCount }}', 'interpolation'),
        tgtPort('wp-intermediate-04', 2, 4, '[value]="selectedCrew"', 'property'),
        tgtPort('wp-intermediate-04', 3, 4, '(click)="selectCrew($event)"', 'event'),
        tgtPort('wp-intermediate-04', 4, 4, '(keydown)="removeCrew($event)"', 'event'),
      ],
      correctWires: [
        wire('wp-intermediate-04', 1, 'wp-intermediate-04-s1', 'wp-intermediate-04-t1', WireType.interpolation),
        wire('wp-intermediate-04', 2, 'wp-intermediate-04-s2', 'wp-intermediate-04-t2', WireType.property),
        wire('wp-intermediate-04', 3, 'wp-intermediate-04-s3', 'wp-intermediate-04-t3', WireType.event),
        wire('wp-intermediate-04', 4, 'wp-intermediate-04-s4', 'wp-intermediate-04-t4', WireType.event),
      ],
      preWiredConnections: [],
      maxVerifications: 3,
    },
  },

  // Level 11 — Power Relay Array (Multiple components)
  {
    levelId: 'wp-intermediate-05',
    gameId: 'wire-protocol',
    tier: DifficultyTier.Intermediate,
    order: 5,
    title: 'Power Relay Array',
    conceptIntroduced: 'Multiple components',
    description: 'Wire bindings across parent and child components.',
    data: {
      components: [
        { componentName: 'PowerRelay', description: 'Parent relay controller' },
        { componentName: 'PowerNode', description: 'Child power node' },
      ],
      sourcePorts: [
        srcPort('wp-intermediate-05', 1, 6, 'totalPower', 'property', 'number'),
        srcPort('wp-intermediate-05', 2, 6, 'relayStatus', 'property', 'string'),
        srcPort('wp-intermediate-05', 3, 6, 'nodeOutput', 'property', 'number'),
        srcPort('wp-intermediate-05', 4, 6, 'nodeLabel', 'property', 'string'),
        srcPort('wp-intermediate-05', 5, 6, 'activateRelay()', 'method', 'void'),
        srcPort('wp-intermediate-05', 6, 6, 'resetNode()', 'method', 'void'),
      ],
      targetPorts: [
        tgtPort('wp-intermediate-05', 1, 6, '{{ totalPower }}', 'interpolation'),
        tgtPort('wp-intermediate-05', 2, 6, '{{ relayStatus }}', 'interpolation'),
        tgtPort('wp-intermediate-05', 3, 6, '[power]="nodeOutput"', 'property'),
        tgtPort('wp-intermediate-05', 4, 6, '[label]="nodeLabel"', 'property'),
        tgtPort('wp-intermediate-05', 5, 6, '(activate)="activateRelay()"', 'event'),
        tgtPort('wp-intermediate-05', 6, 6, '(reset)="resetNode()"', 'event'),
      ],
      correctWires: [
        wire('wp-intermediate-05', 1, 'wp-intermediate-05-s1', 'wp-intermediate-05-t1', WireType.interpolation),
        wire('wp-intermediate-05', 2, 'wp-intermediate-05-s2', 'wp-intermediate-05-t2', WireType.interpolation),
        wire('wp-intermediate-05', 3, 'wp-intermediate-05-s3', 'wp-intermediate-05-t3', WireType.property),
        wire('wp-intermediate-05', 4, 'wp-intermediate-05-s4', 'wp-intermediate-05-t4', WireType.property),
        wire('wp-intermediate-05', 5, 'wp-intermediate-05-s5', 'wp-intermediate-05-t5', WireType.event),
        wire('wp-intermediate-05', 6, 'wp-intermediate-05-s6', 'wp-intermediate-05-t6', WireType.event),
      ],
      preWiredConnections: [
        // totalPower->{{ totalPower }} correct (interpolation)
        preWire('wp-intermediate-05', 1, 'wp-intermediate-05-s1', 'wp-intermediate-05-t1', WireType.interpolation, true),
        // nodeOutput->[power] WRONG (interpolation instead of property)
        preWire('wp-intermediate-05', 2, 'wp-intermediate-05-s3', 'wp-intermediate-05-t3', WireType.interpolation, false),
      ],
      maxVerifications: 3,
    },
  },

  // Level 12 — Station Bridge (Mixed challenge)
  {
    levelId: 'wp-intermediate-06',
    gameId: 'wire-protocol',
    tier: DifficultyTier.Intermediate,
    order: 6,
    title: 'Station Bridge',
    conceptIntroduced: 'Mixed challenge with all binding types',
    description: 'All binding types in a multi-component setup.',
    data: {
      components: [
        { componentName: 'BridgeConsole', description: 'Main bridge controls' },
        { componentName: 'AlertDisplay', description: 'Alert level display' },
      ],
      sourcePorts: [
        srcPort('wp-intermediate-06', 1, 6, 'captainName', 'property', 'string'),
        srcPort('wp-intermediate-06', 2, 6, 'alertLevel', 'property', 'number'),
        srcPort('wp-intermediate-06', 3, 6, 'shieldPower', 'property', 'number'),
        srcPort('wp-intermediate-06', 4, 6, 'toggleShields()', 'method', 'void'),
        srcPort('wp-intermediate-06', 5, 6, 'fireWeapons()', 'method', 'void'),
        srcPort('wp-intermediate-06', 6, 6, 'helmAngle', 'property', 'number'),
      ],
      targetPorts: [
        tgtPort('wp-intermediate-06', 1, 6, '{{ captainName }}', 'interpolation'),
        tgtPort('wp-intermediate-06', 2, 6, '[class.critical]="alertLevel > 8"', 'property'),
        tgtPort('wp-intermediate-06', 3, 6, '[value]="shieldPower"', 'property'),
        tgtPort('wp-intermediate-06', 4, 6, '(click)="toggleShields()"', 'event'),
        tgtPort('wp-intermediate-06', 5, 6, '(click)="fireWeapons()"', 'event'),
        tgtPort('wp-intermediate-06', 6, 6, '[(ngModel)]="helmAngle"', 'twoWay'),
      ],
      correctWires: [
        wire('wp-intermediate-06', 1, 'wp-intermediate-06-s1', 'wp-intermediate-06-t1', WireType.interpolation),
        wire('wp-intermediate-06', 2, 'wp-intermediate-06-s2', 'wp-intermediate-06-t2', WireType.property),
        wire('wp-intermediate-06', 3, 'wp-intermediate-06-s3', 'wp-intermediate-06-t3', WireType.property),
        wire('wp-intermediate-06', 4, 'wp-intermediate-06-s4', 'wp-intermediate-06-t4', WireType.event),
        wire('wp-intermediate-06', 5, 'wp-intermediate-06-s5', 'wp-intermediate-06-t5', WireType.event),
        wire('wp-intermediate-06', 6, 'wp-intermediate-06-s6', 'wp-intermediate-06-t6', WireType.twoWay),
      ],
      preWiredConnections: [],
      maxVerifications: 3,
    },
  },

  // =========================================================================
  // ADVANCED TIER (Levels 13-17)
  // =========================================================================

  // Level 13 — Turret Targeting (Template reference variables)
  {
    levelId: 'wp-advanced-01',
    gameId: 'wire-protocol',
    tier: DifficultyTier.Advanced,
    order: 1,
    title: 'Turret Targeting',
    conceptIntroduced: 'Template reference variables',
    description: 'Use template references to access elements directly.',
    data: {
      components: [
        { componentName: 'TurretControl', description: 'Use template references to access elements directly' },
      ],
      sourcePorts: [
        srcPort('wp-advanced-01', 1, 4, 'targetX', 'property', 'number'),
        srcPort('wp-advanced-01', 2, 4, 'targetY', 'property', 'number'),
        srcPort('wp-advanced-01', 3, 4, 'lockOn()', 'method', 'void'),
        srcPort('wp-advanced-01', 4, 4, 'turretLabel', 'property', 'string'),
      ],
      targetPorts: [
        tgtPort('wp-advanced-01', 1, 4, '[x]="targetX"', 'property'),
        tgtPort('wp-advanced-01', 2, 4, '[y]="targetY"', 'property'),
        tgtPort('wp-advanced-01', 3, 4, '(click)="lockOn()"', 'event'),
        tgtPort('wp-advanced-01', 4, 4, '{{ turretLabel }}', 'interpolation'),
      ],
      correctWires: [
        wire('wp-advanced-01', 1, 'wp-advanced-01-s1', 'wp-advanced-01-t1', WireType.property),
        wire('wp-advanced-01', 2, 'wp-advanced-01-s2', 'wp-advanced-01-t2', WireType.property),
        wire('wp-advanced-01', 3, 'wp-advanced-01-s3', 'wp-advanced-01-t3', WireType.event),
        wire('wp-advanced-01', 4, 'wp-advanced-01-s4', 'wp-advanced-01-t4', WireType.interpolation),
      ],
      preWiredConnections: [],
      maxVerifications: 3,
    },
  },

  // Level 14 — Accessibility Panel (Attribute vs property binding)
  {
    levelId: 'wp-advanced-02',
    gameId: 'wire-protocol',
    tier: DifficultyTier.Advanced,
    order: 2,
    title: 'Accessibility Panel',
    conceptIntroduced: 'Attribute vs property binding',
    description: 'Distinguish [attr.aria-*] from [value] bindings.',
    data: {
      components: [
        { componentName: 'AccessibilityPanel', description: 'Distinguish [attr.aria-*] from [value] bindings' },
      ],
      sourcePorts: [
        srcPort('wp-advanced-02', 1, 4, 'panelLabel', 'property', 'string'),
        srcPort('wp-advanced-02', 2, 4, 'panelDescription', 'property', 'string'),
        srcPort('wp-advanced-02', 3, 4, 'isExpanded', 'property', 'boolean'),
        srcPort('wp-advanced-02', 4, 4, 'tabIndex', 'property', 'number'),
      ],
      targetPorts: [
        tgtPort('wp-advanced-02', 1, 4, '[attr.aria-label]="panelLabel"', 'property'),
        tgtPort('wp-advanced-02', 2, 4, '[attr.aria-describedby]="panelDescription"', 'property'),
        tgtPort('wp-advanced-02', 3, 4, '[attr.aria-expanded]="isExpanded"', 'property'),
        tgtPort('wp-advanced-02', 4, 4, '[tabindex]="tabIndex"', 'property'),
      ],
      correctWires: [
        wire('wp-advanced-02', 1, 'wp-advanced-02-s1', 'wp-advanced-02-t1', WireType.property),
        wire('wp-advanced-02', 2, 'wp-advanced-02-s2', 'wp-advanced-02-t2', WireType.property),
        wire('wp-advanced-02', 3, 'wp-advanced-02-s3', 'wp-advanced-02-t3', WireType.property),
        wire('wp-advanced-02', 4, 'wp-advanced-02-s4', 'wp-advanced-02-t4', WireType.property),
      ],
      preWiredConnections: [],
      maxVerifications: 3,
    },
  },

  // Level 15 — Status Dashboard (Class and style binding)
  {
    levelId: 'wp-advanced-03',
    gameId: 'wire-protocol',
    tier: DifficultyTier.Advanced,
    order: 3,
    title: 'Status Dashboard',
    conceptIntroduced: 'Class and style binding',
    description: 'Wire class and style bindings to visual indicators.',
    data: {
      components: [
        { componentName: 'StatusDashboard', description: 'Wire class and style bindings to visual indicators' },
      ],
      sourcePorts: [
        srcPort('wp-advanced-03', 1, 4, 'isOnline', 'property', 'boolean'),
        srcPort('wp-advanced-03', 2, 4, 'cpuTemp', 'property', 'number'),
        srcPort('wp-advanced-03', 3, 4, 'memoryUsage', 'property', 'number'),
        srcPort('wp-advanced-03', 4, 4, 'alertColor', 'property', 'string'),
      ],
      targetPorts: [
        tgtPort('wp-advanced-03', 1, 4, '[class.online]="isOnline"', 'property'),
        tgtPort('wp-advanced-03', 2, 4, '[style.width.%]="cpuTemp"', 'property'),
        tgtPort('wp-advanced-03', 3, 4, '[style.height.%]="memoryUsage"', 'property'),
        tgtPort('wp-advanced-03', 4, 4, '[style.color]="alertColor"', 'property'),
      ],
      correctWires: [
        wire('wp-advanced-03', 1, 'wp-advanced-03-s1', 'wp-advanced-03-t1', WireType.property),
        wire('wp-advanced-03', 2, 'wp-advanced-03-s2', 'wp-advanced-03-t2', WireType.property),
        wire('wp-advanced-03', 3, 'wp-advanced-03-s3', 'wp-advanced-03-t3', WireType.property),
        wire('wp-advanced-03', 4, 'wp-advanced-03-s4', 'wp-advanced-03-t4', WireType.property),
      ],
      preWiredConnections: [],
      maxVerifications: 3,
    },
  },

  // Level 16 — Weapons System (Complex expressions)
  {
    levelId: 'wp-advanced-04',
    gameId: 'wire-protocol',
    tier: DifficultyTier.Advanced,
    order: 4,
    title: 'Weapons System',
    conceptIntroduced: 'Complex expressions',
    description: 'Wire bindings that use method calls and ternary expressions.',
    data: {
      components: [
        { componentName: 'WeaponsSystem', description: 'Wire bindings that use method calls and ternary expressions' },
      ],
      sourcePorts: [
        srcPort('wp-advanced-04', 1, 5, 'ammoCount', 'property', 'number'),
        srcPort('wp-advanced-04', 2, 5, 'weaponType', 'property', 'string'),
        srcPort('wp-advanced-04', 3, 5, 'isArmed', 'property', 'boolean'),
        srcPort('wp-advanced-04', 4, 5, 'fire()', 'method', 'void'),
        srcPort('wp-advanced-04', 5, 5, 'reload()', 'method', 'void'),
      ],
      targetPorts: [
        tgtPort('wp-advanced-04', 1, 5, '[class.low-ammo]="ammoCount < 10"', 'property'),
        tgtPort('wp-advanced-04', 2, 5, '{{ weaponType }}', 'interpolation'),
        tgtPort('wp-advanced-04', 3, 5, '[disabled]="!isArmed"', 'property'),
        tgtPort('wp-advanced-04', 4, 5, '(click)="fire()"', 'event'),
        tgtPort('wp-advanced-04', 5, 5, '(dblclick)="reload()"', 'event'),
      ],
      correctWires: [
        wire('wp-advanced-04', 1, 'wp-advanced-04-s1', 'wp-advanced-04-t1', WireType.property),
        wire('wp-advanced-04', 2, 'wp-advanced-04-s2', 'wp-advanced-04-t2', WireType.interpolation),
        wire('wp-advanced-04', 3, 'wp-advanced-04-s3', 'wp-advanced-04-t3', WireType.property),
        wire('wp-advanced-04', 4, 'wp-advanced-04-s4', 'wp-advanced-04-t4', WireType.event),
        wire('wp-advanced-04', 5, 'wp-advanced-04-s5', 'wp-advanced-04-t5', WireType.event),
      ],
      preWiredConnections: [],
      maxVerifications: 3,
    },
  },

  // Level 17 — Sector Rewire (Full rewire challenge)
  {
    levelId: 'wp-advanced-05',
    gameId: 'wire-protocol',
    tier: DifficultyTier.Advanced,
    order: 5,
    title: 'Sector Rewire',
    conceptIntroduced: 'Full rewire challenge',
    description: '3 components, all binding types, some pre-wired wrong.',
    data: {
      components: [
        { componentName: 'SectorMap', description: 'Sector overview map' },
        { componentName: 'SectorDetail', description: 'Detailed sector information' },
        { componentName: 'SectorAlert', description: 'Sector threat alert system' },
      ],
      sourcePorts: [
        srcPort('wp-advanced-05', 1, 8, 'sectorId', 'property', 'string'),
        srcPort('wp-advanced-05', 2, 8, 'sectorName', 'property', 'string'),
        srcPort('wp-advanced-05', 3, 8, 'population', 'property', 'number'),
        srcPort('wp-advanced-05', 4, 8, 'dangerLevel', 'property', 'number'),
        srcPort('wp-advanced-05', 5, 8, 'threatStatus', 'property', 'string'),
        srcPort('wp-advanced-05', 6, 8, 'evacuate()', 'method', 'void'),
        srcPort('wp-advanced-05', 7, 8, 'lockdown()', 'method', 'void'),
        srcPort('wp-advanced-05', 8, 8, 'scanSector()', 'method', 'void'),
      ],
      targetPorts: [
        tgtPort('wp-advanced-05', 1, 8, '{{ sectorId }}', 'interpolation'),
        tgtPort('wp-advanced-05', 2, 8, '{{ sectorName }}', 'interpolation'),
        tgtPort('wp-advanced-05', 3, 8, '{{ population }}', 'interpolation'),
        tgtPort('wp-advanced-05', 4, 8, '[class.danger]="dangerLevel > 7"', 'property'),
        tgtPort('wp-advanced-05', 5, 8, '[value]="threatStatus"', 'property'),
        tgtPort('wp-advanced-05', 6, 8, '(click)="evacuate()"', 'event'),
        tgtPort('wp-advanced-05', 7, 8, '(keydown.enter)="lockdown()"', 'event'),
        tgtPort('wp-advanced-05', 8, 8, '[(ngModel)]="dangerLevel"', 'twoWay'),
      ],
      correctWires: [
        wire('wp-advanced-05', 1, 'wp-advanced-05-s1', 'wp-advanced-05-t1', WireType.interpolation),
        wire('wp-advanced-05', 2, 'wp-advanced-05-s2', 'wp-advanced-05-t2', WireType.interpolation),
        wire('wp-advanced-05', 3, 'wp-advanced-05-s3', 'wp-advanced-05-t3', WireType.interpolation),
        wire('wp-advanced-05', 4, 'wp-advanced-05-s4', 'wp-advanced-05-t4', WireType.property),
        wire('wp-advanced-05', 5, 'wp-advanced-05-s5', 'wp-advanced-05-t5', WireType.property),
        wire('wp-advanced-05', 6, 'wp-advanced-05-s6', 'wp-advanced-05-t6', WireType.event),
        wire('wp-advanced-05', 7, 'wp-advanced-05-s7', 'wp-advanced-05-t7', WireType.event),
        wire('wp-advanced-05', 8, 'wp-advanced-05-s4', 'wp-advanced-05-t8', WireType.twoWay),
      ],
      preWiredConnections: [
        // sectorId->{{ sectorId }} correct (interpolation)
        preWire('wp-advanced-05', 1, 'wp-advanced-05-s1', 'wp-advanced-05-t1', WireType.interpolation, true),
        // sectorName->{{ sectorName }} correct (interpolation)
        preWire('wp-advanced-05', 2, 'wp-advanced-05-s2', 'wp-advanced-05-t2', WireType.interpolation, true),
        // population->{{ population }} WRONG (property type instead of interpolation)
        preWire('wp-advanced-05', 3, 'wp-advanced-05-s3', 'wp-advanced-05-t3', WireType.property, false),
        // dangerLevel->[class.danger] correct (property)
        preWire('wp-advanced-05', 4, 'wp-advanced-05-s4', 'wp-advanced-05-t4', WireType.property, true),
        // threatStatus->{{ ... }} WRONG (interpolation type instead of property)
        preWire('wp-advanced-05', 5, 'wp-advanced-05-s5', 'wp-advanced-05-t5', WireType.interpolation, false),
      ],
      maxVerifications: 3,
    },
  },

  // =========================================================================
  // BOSS TIER (Level 18)
  // =========================================================================

  // Level 18 — Array Overhaul (5 components, 22 connections, 8 pre-wired, 3 wrong)
  {
    levelId: 'wp-boss-01',
    gameId: 'wire-protocol',
    tier: DifficultyTier.Boss,
    order: 1,
    title: 'Array Overhaul',
    conceptIntroduced: 'Full rewire with 5 components',
    description: '5 components, 20+ connections, time pressure.',
    parTime: 180,
    data: {
      components: [
        { componentName: 'CommArray', description: 'Root communications array controller' },
        { componentName: 'TransmitterNode', description: 'Signal transmitter node' },
        { componentName: 'ReceiverNode', description: 'Signal receiver node' },
        { componentName: 'SignalProcessor', description: 'Signal processing unit' },
        { componentName: 'FrequencyController', description: 'Frequency management controller' },
      ],
      sourcePorts: [
        // CommArray (5): 3 properties + 2 methods
        srcPort('wp-boss-01', 1, 22, 'arrayName', 'property', 'string'),
        srcPort('wp-boss-01', 2, 22, 'totalBandwidth', 'property', 'number'),
        srcPort('wp-boss-01', 3, 22, 'isOnline', 'property', 'boolean'),
        srcPort('wp-boss-01', 4, 22, 'calibrate()', 'method', 'void'),
        srcPort('wp-boss-01', 5, 22, 'shutdown()', 'method', 'void'),
        // TransmitterNode (5): 3 properties + 2 methods
        srcPort('wp-boss-01', 6, 22, 'txPower', 'property', 'number'),
        srcPort('wp-boss-01', 7, 22, 'txFrequency', 'property', 'number'),
        srcPort('wp-boss-01', 8, 22, 'txLabel', 'property', 'string'),
        srcPort('wp-boss-01', 9, 22, 'transmit()', 'method', 'void'),
        srcPort('wp-boss-01', 10, 22, 'adjustPower()', 'method', 'void'),
        // ReceiverNode (4): 3 properties + 1 method
        srcPort('wp-boss-01', 11, 22, 'rxSensitivity', 'property', 'number'),
        srcPort('wp-boss-01', 12, 22, 'rxChannel', 'property', 'string'),
        srcPort('wp-boss-01', 13, 22, 'signalQuality', 'property', 'number'),
        srcPort('wp-boss-01', 14, 22, 'scan()', 'method', 'void'),
        // SignalProcessor (4): 2 properties + 2 methods
        srcPort('wp-boss-01', 15, 22, 'processingLoad', 'property', 'number'),
        srcPort('wp-boss-01', 16, 22, 'filterType', 'property', 'string'),
        srcPort('wp-boss-01', 17, 22, 'processSignal()', 'method', 'void'),
        srcPort('wp-boss-01', 18, 22, 'clearBuffer()', 'method', 'void'),
        // FrequencyController (4): 3 properties + 1 method
        srcPort('wp-boss-01', 19, 22, 'frequency', 'property', 'number'),
        srcPort('wp-boss-01', 20, 22, 'bandwidth', 'property', 'number'),
        srcPort('wp-boss-01', 21, 22, 'isLocked', 'property', 'boolean'),
        srcPort('wp-boss-01', 22, 22, 'lockFrequency()', 'method', 'void'),
      ],
      targetPorts: [
        // 6 interpolation
        tgtPort('wp-boss-01', 1, 22, '{{ arrayName }}', 'interpolation'),
        tgtPort('wp-boss-01', 2, 22, '{{ totalBandwidth }}', 'interpolation'),
        tgtPort('wp-boss-01', 3, 22, '{{ txLabel }}', 'interpolation'),
        tgtPort('wp-boss-01', 4, 22, '{{ rxChannel }}', 'interpolation'),
        tgtPort('wp-boss-01', 5, 22, '{{ filterType }}', 'interpolation'),
        tgtPort('wp-boss-01', 6, 22, '{{ signalQuality }}', 'interpolation'),
        // 6 property
        tgtPort('wp-boss-01', 7, 22, '[class.online]="isOnline"', 'property'),
        tgtPort('wp-boss-01', 8, 22, '[value]="txPower"', 'property'),
        tgtPort('wp-boss-01', 9, 22, '[max]="txFrequency"', 'property'),
        tgtPort('wp-boss-01', 10, 22, '[value]="rxSensitivity"', 'property'),
        tgtPort('wp-boss-01', 11, 22, '[style.width.%]="processingLoad"', 'property'),
        tgtPort('wp-boss-01', 12, 22, '[value]="bandwidth"', 'property'),
        // 6 event
        tgtPort('wp-boss-01', 13, 22, '(click)="calibrate()"', 'event'),
        tgtPort('wp-boss-01', 14, 22, '(click)="shutdown()"', 'event'),
        tgtPort('wp-boss-01', 15, 22, '(click)="transmit()"', 'event'),
        tgtPort('wp-boss-01', 16, 22, '(click)="adjustPower()"', 'event'),
        tgtPort('wp-boss-01', 17, 22, '(click)="scan()"', 'event'),
        tgtPort('wp-boss-01', 18, 22, '(click)="processSignal()"', 'event'),
        // 4 twoWay
        tgtPort('wp-boss-01', 19, 22, '[(ngModel)]="frequency"', 'twoWay'),
        tgtPort('wp-boss-01', 20, 22, '[(ngModel)]="isLocked"', 'twoWay'),
        tgtPort('wp-boss-01', 21, 22, '[(ngModel)]="isOnline"', 'twoWay'),
        tgtPort('wp-boss-01', 22, 22, '[(ngModel)]="rxSensitivity"', 'twoWay'),
      ],
      correctWires: [
        // 6 interpolation wires
        wire('wp-boss-01', 1, 'wp-boss-01-s1', 'wp-boss-01-t1', WireType.interpolation),
        wire('wp-boss-01', 2, 'wp-boss-01-s2', 'wp-boss-01-t2', WireType.interpolation),
        wire('wp-boss-01', 3, 'wp-boss-01-s8', 'wp-boss-01-t3', WireType.interpolation),
        wire('wp-boss-01', 4, 'wp-boss-01-s12', 'wp-boss-01-t4', WireType.interpolation),
        wire('wp-boss-01', 5, 'wp-boss-01-s16', 'wp-boss-01-t5', WireType.interpolation),
        wire('wp-boss-01', 6, 'wp-boss-01-s13', 'wp-boss-01-t6', WireType.interpolation),
        // 6 property wires
        wire('wp-boss-01', 7, 'wp-boss-01-s3', 'wp-boss-01-t7', WireType.property),
        wire('wp-boss-01', 8, 'wp-boss-01-s6', 'wp-boss-01-t8', WireType.property),
        wire('wp-boss-01', 9, 'wp-boss-01-s7', 'wp-boss-01-t9', WireType.property),
        wire('wp-boss-01', 10, 'wp-boss-01-s11', 'wp-boss-01-t10', WireType.property),
        wire('wp-boss-01', 11, 'wp-boss-01-s15', 'wp-boss-01-t11', WireType.property),
        wire('wp-boss-01', 12, 'wp-boss-01-s20', 'wp-boss-01-t12', WireType.property),
        // 6 event wires
        wire('wp-boss-01', 13, 'wp-boss-01-s4', 'wp-boss-01-t13', WireType.event),
        wire('wp-boss-01', 14, 'wp-boss-01-s5', 'wp-boss-01-t14', WireType.event),
        wire('wp-boss-01', 15, 'wp-boss-01-s9', 'wp-boss-01-t15', WireType.event),
        wire('wp-boss-01', 16, 'wp-boss-01-s10', 'wp-boss-01-t16', WireType.event),
        wire('wp-boss-01', 17, 'wp-boss-01-s14', 'wp-boss-01-t17', WireType.event),
        wire('wp-boss-01', 18, 'wp-boss-01-s17', 'wp-boss-01-t18', WireType.event),
        // 4 twoWay wires
        wire('wp-boss-01', 19, 'wp-boss-01-s19', 'wp-boss-01-t19', WireType.twoWay),
        wire('wp-boss-01', 20, 'wp-boss-01-s21', 'wp-boss-01-t20', WireType.twoWay),
        wire('wp-boss-01', 21, 'wp-boss-01-s3', 'wp-boss-01-t21', WireType.twoWay),
        wire('wp-boss-01', 22, 'wp-boss-01-s11', 'wp-boss-01-t22', WireType.twoWay),
      ],
      preWiredConnections: [
        // arrayName->{{ arrayName }} correct (interpolation)
        preWire('wp-boss-01', 1, 'wp-boss-01-s1', 'wp-boss-01-t1', WireType.interpolation, true),
        // totalBandwidth->{{ totalBandwidth }} correct (interpolation)
        preWire('wp-boss-01', 2, 'wp-boss-01-s2', 'wp-boss-01-t2', WireType.interpolation, true),
        // isOnline->[class.online] correct (property)
        preWire('wp-boss-01', 3, 'wp-boss-01-s3', 'wp-boss-01-t7', WireType.property, true),
        // txPower->[value] WRONG (interpolation instead of property)
        preWire('wp-boss-01', 4, 'wp-boss-01-s6', 'wp-boss-01-t8', WireType.interpolation, false),
        // rxChannel->{{ rxChannel }} correct (interpolation)
        preWire('wp-boss-01', 5, 'wp-boss-01-s12', 'wp-boss-01-t4', WireType.interpolation, true),
        // processingLoad->[style.width.%] WRONG (event instead of property)
        preWire('wp-boss-01', 6, 'wp-boss-01-s15', 'wp-boss-01-t11', WireType.event, false),
        // calibrate()->(click) correct (event)
        preWire('wp-boss-01', 7, 'wp-boss-01-s4', 'wp-boss-01-t13', WireType.event, true),
        // frequency->[(ngModel)] WRONG (property instead of twoWay)
        preWire('wp-boss-01', 8, 'wp-boss-01-s19', 'wp-boss-01-t19', WireType.property, false),
      ],
      maxVerifications: 3,
    },
  },
];

// ---------------------------------------------------------------------------
// Level Pack
// ---------------------------------------------------------------------------

export const WIRE_PROTOCOL_LEVEL_PACK: LevelPack = {
  gameId: 'wire-protocol',
  levels: WIRE_PROTOCOL_LEVELS,
};
