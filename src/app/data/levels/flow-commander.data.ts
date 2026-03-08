import { DifficultyTier } from '../../core/minigame/minigame.types';
import type { LevelDefinition, LevelPack } from '../../core/levels/level.types';
import type {
  PipelineNode,
  PipelineEdge,
  PipelineNodeType,
  CargoItem,
  CargoPriority,
  TargetZone,
  FlowCommanderLevelData,
} from '../../features/minigames/flow-commander/pipeline.types';
import { GateType } from '../../features/minigames/flow-commander/pipeline.types';

// ---------------------------------------------------------------------------
// Builder helpers (private to this file)
// ---------------------------------------------------------------------------

/** Build a PipelineNode with auto-prefixed ID. */
function node(
  prefix: string,
  id: string,
  nodeType: PipelineNodeType,
  x: number,
  y: number,
  label: string,
): PipelineNode {
  return { id: `${prefix}-${id}`, nodeType, position: { x, y }, label };
}

/** Build a PipelineEdge with auto-prefixed ID. */
function edge(
  prefix: string,
  id: string,
  sourceNodeId: string,
  targetNodeId: string,
): PipelineEdge {
  return { id: `${prefix}-${id}`, sourceNodeId, targetNodeId };
}

/** Build a CargoItem with auto-prefixed ID. */
function cargo(
  prefix: string,
  id: string,
  color: string,
  label: string,
  type: string,
  priority: CargoPriority,
): CargoItem {
  return { id: `${prefix}-${id}`, color, label, type, priority };
}

/** Build a TargetZone with auto-prefixed ID. */
function zone(
  prefix: string,
  id: string,
  nodeId: string,
  label: string,
  criteria: Omit<TargetZone, 'id' | 'nodeId' | 'label'>,
): TargetZone {
  return { id: `${prefix}-${id}`, nodeId, label, ...criteria };
}

// ---------------------------------------------------------------------------
// Level definitions
// ---------------------------------------------------------------------------

export const FLOW_COMMANDER_LEVELS: readonly LevelDefinition<FlowCommanderLevelData>[] = [
  // =========================================================================
  // BASIC TIER (Levels 1-6)
  // =========================================================================

  // Level 1 — Priority Filter (@if simple)
  {
    levelId: 'fc-basic-01',
    gameId: 'flow-commander',
    tier: DifficultyTier.Basic,
    order: 1,
    title: 'Priority Filter',
    conceptIntroduced: '@if (simple)',
    description: 'Filter: let high-priority items through, block others.',
    data: {
      graph: {
        nodes: [
          node('fc-basic-01', 'src1', 'source', 5, 50, 'Cargo Bay'),
          node('fc-basic-01', 'gate1', 'gate-slot', 40, 50, 'Gate A'),
          node('fc-basic-01', 'tgt1', 'target-zone', 90, 25, 'High Priority Bay'),
          node('fc-basic-01', 'tgt2', 'target-zone', 90, 75, 'Reject Bin'),
        ],
        edges: [
          edge('fc-basic-01', 'e1', 'fc-basic-01-src1', 'fc-basic-01-gate1'),
          edge('fc-basic-01', 'e2', 'fc-basic-01-gate1', 'fc-basic-01-tgt1'),
          edge('fc-basic-01', 'e3', 'fc-basic-01-gate1', 'fc-basic-01-tgt2'),
        ],
      },
      cargoItems: [
        cargo('fc-basic-01', 'c1', 'amber', 'Fuel Cell A', 'fuel', 'high'),
        cargo('fc-basic-01', 'c2', 'cyan', 'Ration Pack', 'food', 'low'),
        cargo('fc-basic-01', 'c3', 'amber', 'Fuel Cell B', 'fuel', 'high'),
        cargo('fc-basic-01', 'c4', 'cyan', 'Water Supply', 'food', 'low'),
      ],
      availableGateTypes: [GateType.if],
      targetZones: [
        zone('fc-basic-01', 'z1', 'fc-basic-01-tgt1', 'High Priority Bay', { expectedPriority: 'high' }),
        zone('fc-basic-01', 'z2', 'fc-basic-01-tgt2', 'Reject Bin', {}),
      ],
    },
  },

  // Level 2 — Crew Sorter (@if/@else)
  {
    levelId: 'fc-basic-02',
    gameId: 'flow-commander',
    tier: DifficultyTier.Basic,
    order: 2,
    title: 'Crew Sorter',
    conceptIntroduced: '@if/@else',
    description: 'Two output lanes: matching items go one way, rest go another.',
    data: {
      graph: {
        nodes: [
          node('fc-basic-02', 'src1', 'source', 5, 50, 'Arrival Gate'),
          node('fc-basic-02', 'gate1', 'gate-slot', 40, 50, 'Gate A'),
          node('fc-basic-02', 'tgt1', 'target-zone', 90, 25, 'Crew Quarters'),
          node('fc-basic-02', 'tgt2', 'target-zone', 90, 75, 'Cargo Hold'),
        ],
        edges: [
          edge('fc-basic-02', 'e1', 'fc-basic-02-src1', 'fc-basic-02-gate1'),
          edge('fc-basic-02', 'e2', 'fc-basic-02-gate1', 'fc-basic-02-tgt1'),
          edge('fc-basic-02', 'e3', 'fc-basic-02-gate1', 'fc-basic-02-tgt2'),
        ],
      },
      cargoItems: [
        cargo('fc-basic-02', 'c1', 'green', 'Engineer Kim', 'crew', 'medium'),
        cargo('fc-basic-02', 'c2', 'cyan', 'Spare Parts', 'cargo', 'low'),
        cargo('fc-basic-02', 'c3', 'green', 'Medic Chen', 'crew', 'medium'),
        cargo('fc-basic-02', 'c4', 'cyan', 'Hull Plates', 'cargo', 'low'),
        cargo('fc-basic-02', 'c5', 'green', 'Pilot Reyes', 'crew', 'high'),
        cargo('fc-basic-02', 'c6', 'cyan', 'Circuit Boards', 'cargo', 'medium'),
      ],
      availableGateTypes: [GateType.if],
      targetZones: [
        zone('fc-basic-02', 'z1', 'fc-basic-02-tgt1', 'Crew Quarters', { expectedType: 'crew' }),
        zone('fc-basic-02', 'z2', 'fc-basic-02-tgt2', 'Cargo Hold', { expectedType: 'cargo' }),
      ],
    },
  },

  // Level 3 — Supply Duplication (@for simple)
  {
    levelId: 'fc-basic-03',
    gameId: 'flow-commander',
    tier: DifficultyTier.Basic,
    order: 3,
    title: 'Supply Duplication',
    conceptIntroduced: '@for (simple)',
    description: 'Duplicate a template item for each entry in a list.',
    data: {
      graph: {
        nodes: [
          node('fc-basic-03', 'src1', 'source', 5, 50, 'Template Bay'),
          node('fc-basic-03', 'gate1', 'gate-slot', 45, 50, 'Gate A'),
          node('fc-basic-03', 'tgt1', 'target-zone', 90, 50, 'Supply Rack'),
        ],
        edges: [
          edge('fc-basic-03', 'e1', 'fc-basic-03-src1', 'fc-basic-03-gate1'),
          edge('fc-basic-03', 'e2', 'fc-basic-03-gate1', 'fc-basic-03-tgt1'),
        ],
      },
      cargoItems: [
        cargo('fc-basic-03', 'c1', 'cyan', 'Med Kit Template', 'medical', 'medium'),
        cargo('fc-basic-03', 'c2', 'cyan', 'Ration Template', 'food', 'medium'),
      ],
      availableGateTypes: [GateType.for],
      targetZones: [
        zone('fc-basic-03', 'z1', 'fc-basic-03-tgt1', 'Supply Rack', {}),
      ],
    },
  },

  // Level 4 — Numbered Crates (@for with index)
  {
    levelId: 'fc-basic-04',
    gameId: 'flow-commander',
    tier: DifficultyTier.Basic,
    order: 4,
    title: 'Numbered Crates',
    conceptIntroduced: '@for with index',
    description: 'Use $index to number items in sequence.',
    data: {
      graph: {
        nodes: [
          node('fc-basic-04', 'src1', 'source', 5, 50, 'Warehouse'),
          node('fc-basic-04', 'gate1', 'gate-slot', 45, 50, 'Gate A'),
          node('fc-basic-04', 'tgt1', 'target-zone', 90, 50, 'Numbered Dock'),
        ],
        edges: [
          edge('fc-basic-04', 'e1', 'fc-basic-04-src1', 'fc-basic-04-gate1'),
          edge('fc-basic-04', 'e2', 'fc-basic-04-gate1', 'fc-basic-04-tgt1'),
        ],
      },
      cargoItems: [
        cargo('fc-basic-04', 'c1', 'amber', 'Crate Alpha', 'engineering', 'low'),
        cargo('fc-basic-04', 'c2', 'amber', 'Crate Beta', 'engineering', 'low'),
        cargo('fc-basic-04', 'c3', 'amber', 'Crate Gamma', 'engineering', 'low'),
      ],
      availableGateTypes: [GateType.for],
      targetZones: [
        zone('fc-basic-04', 'z1', 'fc-basic-04-tgt1', 'Numbered Dock', {}),
      ],
    },
  },

  // Level 5 — Filtered Distribution (@if + @for combined)
  {
    levelId: 'fc-basic-05',
    gameId: 'flow-commander',
    tier: DifficultyTier.Basic,
    order: 5,
    title: 'Filtered Distribution',
    conceptIntroduced: '@if + @for combined',
    description: 'Filter a list, then iterate over results.',
    data: {
      graph: {
        nodes: [
          node('fc-basic-05', 'src1', 'source', 5, 50, 'Intake'),
          node('fc-basic-05', 'gate1', 'gate-slot', 30, 50, 'Gate A'),
          node('fc-basic-05', 'gate2', 'gate-slot', 60, 25, 'Gate B'),
          node('fc-basic-05', 'tgt1', 'target-zone', 90, 25, 'Priority Bay'),
          node('fc-basic-05', 'tgt2', 'target-zone', 90, 75, 'Standard Bay'),
        ],
        edges: [
          edge('fc-basic-05', 'e1', 'fc-basic-05-src1', 'fc-basic-05-gate1'),
          edge('fc-basic-05', 'e2', 'fc-basic-05-gate1', 'fc-basic-05-gate2'),
          edge('fc-basic-05', 'e3', 'fc-basic-05-gate1', 'fc-basic-05-tgt2'),
          edge('fc-basic-05', 'e4', 'fc-basic-05-gate2', 'fc-basic-05-tgt1'),
        ],
      },
      cargoItems: [
        cargo('fc-basic-05', 'c1', 'amber', 'Fuel Cell', 'fuel', 'high'),
        cargo('fc-basic-05', 'c2', 'cyan', 'Ration Pack', 'food', 'low'),
        cargo('fc-basic-05', 'c3', 'red', 'Med Kit', 'medical', 'high'),
        cargo('fc-basic-05', 'c4', 'cyan', 'Water Supply', 'food', 'low'),
        cargo('fc-basic-05', 'c5', 'amber', 'Power Cell', 'fuel', 'high'),
        cargo('fc-basic-05', 'c6', 'green', 'Tool Box', 'engineering', 'medium'),
      ],
      availableGateTypes: [GateType.if, GateType.for],
      targetZones: [
        zone('fc-basic-05', 'z1', 'fc-basic-05-tgt1', 'Priority Bay', { expectedPriority: 'high' }),
        zone('fc-basic-05', 'z2', 'fc-basic-05-tgt2', 'Standard Bay', {}),
      ],
    },
  },

  // Level 6 — Empty Manifest (@empty)
  {
    levelId: 'fc-basic-06',
    gameId: 'flow-commander',
    tier: DifficultyTier.Basic,
    order: 6,
    title: 'Empty Manifest',
    conceptIntroduced: '@empty',
    description: 'Handle empty collections with fallback output.',
    data: {
      graph: {
        nodes: [
          node('fc-basic-06', 'src1', 'source', 5, 50, 'Manifest Scanner'),
          node('fc-basic-06', 'gate1', 'gate-slot', 40, 50, 'Gate A'),
          node('fc-basic-06', 'tgt1', 'target-zone', 90, 25, 'Main Dock'),
          node('fc-basic-06', 'tgt2', 'target-zone', 90, 75, 'Fallback Dock'),
        ],
        edges: [
          edge('fc-basic-06', 'e1', 'fc-basic-06-src1', 'fc-basic-06-gate1'),
          edge('fc-basic-06', 'e2', 'fc-basic-06-gate1', 'fc-basic-06-tgt1'),
          edge('fc-basic-06', 'e3', 'fc-basic-06-gate1', 'fc-basic-06-tgt2'),
        ],
      },
      cargoItems: [],
      availableGateTypes: [GateType.for],
      targetZones: [
        zone('fc-basic-06', 'z1', 'fc-basic-06-tgt1', 'Main Dock', {}),
        zone('fc-basic-06', 'z2', 'fc-basic-06-tgt2', 'Fallback Dock', {}),
      ],
    },
  },

  // =========================================================================
  // INTERMEDIATE TIER (Levels 7-12)
  // =========================================================================

  // Level 7 — Cargo Classifier (@switch)
  {
    levelId: 'fc-intermediate-01',
    gameId: 'flow-commander',
    tier: DifficultyTier.Intermediate,
    order: 1,
    title: 'Cargo Classifier',
    conceptIntroduced: '@switch',
    description: 'Route items to 3+ lanes based on type.',
    data: {
      graph: {
        nodes: [
          node('fc-intermediate-01', 'src1', 'source', 5, 50, 'Cargo Bay'),
          node('fc-intermediate-01', 'gate1', 'gate-slot', 40, 50, 'Gate A'),
          node('fc-intermediate-01', 'tgt1', 'target-zone', 90, 17, 'Fuel Bay'),
          node('fc-intermediate-01', 'tgt2', 'target-zone', 90, 50, 'Med Bay'),
          node('fc-intermediate-01', 'tgt3', 'target-zone', 90, 83, 'Galley'),
        ],
        edges: [
          edge('fc-intermediate-01', 'e1', 'fc-intermediate-01-src1', 'fc-intermediate-01-gate1'),
          edge('fc-intermediate-01', 'e2', 'fc-intermediate-01-gate1', 'fc-intermediate-01-tgt1'),
          edge('fc-intermediate-01', 'e3', 'fc-intermediate-01-gate1', 'fc-intermediate-01-tgt2'),
          edge('fc-intermediate-01', 'e4', 'fc-intermediate-01-gate1', 'fc-intermediate-01-tgt3'),
        ],
      },
      cargoItems: [
        cargo('fc-intermediate-01', 'c1', 'amber', 'Fuel Cell A', 'fuel', 'medium'),
        cargo('fc-intermediate-01', 'c2', 'red', 'Bandage Kit', 'medical', 'high'),
        cargo('fc-intermediate-01', 'c3', 'cyan', 'Ration Pack A', 'food', 'low'),
        cargo('fc-intermediate-01', 'c4', 'amber', 'Fuel Cell B', 'fuel', 'low'),
        cargo('fc-intermediate-01', 'c5', 'red', 'Med Scanner', 'medical', 'medium'),
        cargo('fc-intermediate-01', 'c6', 'cyan', 'Ration Pack B', 'food', 'medium'),
      ],
      availableGateTypes: [GateType.switch],
      targetZones: [
        zone('fc-intermediate-01', 'z1', 'fc-intermediate-01-tgt1', 'Fuel Bay', { expectedType: 'fuel' }),
        zone('fc-intermediate-01', 'z2', 'fc-intermediate-01-tgt2', 'Med Bay', { expectedType: 'medical' }),
        zone('fc-intermediate-01', 'z3', 'fc-intermediate-01-tgt3', 'Galley', { expectedType: 'food' }),
      ],
    },
  },

  // Level 8 — Unknown Cargo (@switch + @default)
  {
    levelId: 'fc-intermediate-02',
    gameId: 'flow-commander',
    tier: DifficultyTier.Intermediate,
    order: 2,
    title: 'Unknown Cargo',
    conceptIntroduced: '@switch + @default',
    description: 'Handle unknown types with default lane.',
    data: {
      graph: {
        nodes: [
          node('fc-intermediate-02', 'src1', 'source', 5, 50, 'Cargo Bay'),
          node('fc-intermediate-02', 'gate1', 'gate-slot', 40, 50, 'Gate A'),
          node('fc-intermediate-02', 'tgt1', 'target-zone', 90, 13, 'Fuel Bay'),
          node('fc-intermediate-02', 'tgt2', 'target-zone', 90, 37, 'Med Bay'),
          node('fc-intermediate-02', 'tgt3', 'target-zone', 90, 63, 'Galley'),
          node('fc-intermediate-02', 'tgt4', 'target-zone', 90, 87, 'Quarantine'),
        ],
        edges: [
          edge('fc-intermediate-02', 'e1', 'fc-intermediate-02-src1', 'fc-intermediate-02-gate1'),
          edge('fc-intermediate-02', 'e2', 'fc-intermediate-02-gate1', 'fc-intermediate-02-tgt1'),
          edge('fc-intermediate-02', 'e3', 'fc-intermediate-02-gate1', 'fc-intermediate-02-tgt2'),
          edge('fc-intermediate-02', 'e4', 'fc-intermediate-02-gate1', 'fc-intermediate-02-tgt3'),
          edge('fc-intermediate-02', 'e5', 'fc-intermediate-02-gate1', 'fc-intermediate-02-tgt4'),
        ],
      },
      cargoItems: [
        cargo('fc-intermediate-02', 'c1', 'amber', 'Fuel Cell', 'fuel', 'medium'),
        cargo('fc-intermediate-02', 'c2', 'red', 'Med Kit', 'medical', 'high'),
        cargo('fc-intermediate-02', 'c3', 'cyan', 'Ration Pack', 'food', 'low'),
        cargo('fc-intermediate-02', 'c4', 'amber', 'Fuel Rod', 'fuel', 'low'),
        cargo('fc-intermediate-02', 'c5', 'red', 'Bandages', 'medical', 'medium'),
        cargo('fc-intermediate-02', 'c6', 'cyan', 'Water Jug', 'food', 'medium'),
        cargo('fc-intermediate-02', 'c7', 'violet', 'Unknown Canister', 'unknown', 'high'),
        cargo('fc-intermediate-02', 'c8', 'violet', 'Sealed Crate', 'unknown', 'low'),
      ],
      availableGateTypes: [GateType.switch],
      targetZones: [
        zone('fc-intermediate-02', 'z1', 'fc-intermediate-02-tgt1', 'Fuel Bay', { expectedType: 'fuel' }),
        zone('fc-intermediate-02', 'z2', 'fc-intermediate-02-tgt2', 'Med Bay', { expectedType: 'medical' }),
        zone('fc-intermediate-02', 'z3', 'fc-intermediate-02-tgt3', 'Galley', { expectedType: 'food' }),
        zone('fc-intermediate-02', 'z4', 'fc-intermediate-02-tgt4', 'Quarantine', { expectedType: 'unknown' }),
      ],
    },
  },

  // Level 9 — Priority Within Type (Nested @if)
  {
    levelId: 'fc-intermediate-03',
    gameId: 'flow-commander',
    tier: DifficultyTier.Intermediate,
    order: 3,
    title: 'Priority Within Type',
    conceptIntroduced: 'Nested @if',
    description: 'Conditions within conditions.',
    data: {
      graph: {
        nodes: [
          node('fc-intermediate-03', 'src1', 'source', 5, 50, 'Cargo Bay'),
          node('fc-intermediate-03', 'gate1', 'gate-slot', 30, 50, 'Gate A'),
          node('fc-intermediate-03', 'gate2', 'gate-slot', 60, 25, 'Gate B'),
          node('fc-intermediate-03', 'tgt1', 'target-zone', 90, 15, 'Urgent Medical'),
          node('fc-intermediate-03', 'tgt2', 'target-zone', 90, 40, 'Standard Medical'),
          node('fc-intermediate-03', 'tgt3', 'target-zone', 90, 75, 'General Hold'),
        ],
        edges: [
          edge('fc-intermediate-03', 'e1', 'fc-intermediate-03-src1', 'fc-intermediate-03-gate1'),
          edge('fc-intermediate-03', 'e2', 'fc-intermediate-03-gate1', 'fc-intermediate-03-gate2'),
          edge('fc-intermediate-03', 'e3', 'fc-intermediate-03-gate1', 'fc-intermediate-03-tgt3'),
          edge('fc-intermediate-03', 'e4', 'fc-intermediate-03-gate2', 'fc-intermediate-03-tgt1'),
          edge('fc-intermediate-03', 'e5', 'fc-intermediate-03-gate2', 'fc-intermediate-03-tgt2'),
        ],
      },
      cargoItems: [
        cargo('fc-intermediate-03', 'c1', 'red', 'Emergency Serum', 'medical', 'high'),
        cargo('fc-intermediate-03', 'c2', 'red', 'Bandage Kit', 'medical', 'low'),
        cargo('fc-intermediate-03', 'c3', 'amber', 'Fuel Cell', 'fuel', 'high'),
        cargo('fc-intermediate-03', 'c4', 'red', 'Vaccine Batch', 'medical', 'high'),
        cargo('fc-intermediate-03', 'c5', 'amber', 'Power Rod', 'fuel', 'low'),
        cargo('fc-intermediate-03', 'c6', 'red', 'First Aid', 'medical', 'medium'),
      ],
      availableGateTypes: [GateType.if],
      targetZones: [
        zone('fc-intermediate-03', 'z1', 'fc-intermediate-03-tgt1', 'Urgent Medical', { expectedType: 'medical', expectedPriority: 'high' }),
        zone('fc-intermediate-03', 'z2', 'fc-intermediate-03-tgt2', 'Standard Medical', { expectedType: 'medical' }),
        zone('fc-intermediate-03', 'z3', 'fc-intermediate-03-tgt3', 'General Hold', {}),
      ],
    },
  },

  // Level 10 — Efficient Roster (@for with track)
  {
    levelId: 'fc-intermediate-04',
    gameId: 'flow-commander',
    tier: DifficultyTier.Intermediate,
    order: 4,
    title: 'Efficient Roster',
    conceptIntroduced: '@for with track',
    description: 'Track by identity for efficient updates.',
    data: {
      graph: {
        nodes: [
          node('fc-intermediate-04', 'src1', 'source', 5, 50, 'Personnel Office'),
          node('fc-intermediate-04', 'gate1', 'gate-slot', 45, 50, 'Gate A'),
          node('fc-intermediate-04', 'tgt1', 'target-zone', 90, 50, 'Crew Roster'),
        ],
        edges: [
          edge('fc-intermediate-04', 'e1', 'fc-intermediate-04-src1', 'fc-intermediate-04-gate1'),
          edge('fc-intermediate-04', 'e2', 'fc-intermediate-04-gate1', 'fc-intermediate-04-tgt1'),
        ],
      },
      cargoItems: [
        cargo('fc-intermediate-04', 'c1', 'green', 'Lt. Park', 'crew', 'high'),
        cargo('fc-intermediate-04', 'c2', 'green', 'Ens. Diaz', 'crew', 'medium'),
        cargo('fc-intermediate-04', 'c3', 'green', 'Dr. Patel', 'crew', 'high'),
        cargo('fc-intermediate-04', 'c4', 'green', 'Sgt. Torres', 'crew', 'medium'),
        cargo('fc-intermediate-04', 'c5', 'green', 'Cpl. Nakamura', 'crew', 'low'),
      ],
      availableGateTypes: [GateType.for],
      targetZones: [
        zone('fc-intermediate-04', 'z1', 'fc-intermediate-04-tgt1', 'Crew Roster', { expectedType: 'crew' }),
      ],
    },
  },

  // Level 11 — Complex Filtering (Compound conditions)
  {
    levelId: 'fc-intermediate-05',
    gameId: 'flow-commander',
    tier: DifficultyTier.Intermediate,
    order: 5,
    title: 'Complex Filtering',
    conceptIntroduced: 'Complex conditions',
    description: 'Compound boolean expressions (&&, ||).',
    data: {
      graph: {
        nodes: [
          node('fc-intermediate-05', 'src1', 'source', 5, 50, 'Cargo Bay'),
          node('fc-intermediate-05', 'gate1', 'gate-slot', 30, 50, 'Gate A'),
          node('fc-intermediate-05', 'gate2', 'gate-slot', 60, 30, 'Gate B'),
          node('fc-intermediate-05', 'tgt1', 'target-zone', 90, 15, 'Critical Bay'),
          node('fc-intermediate-05', 'tgt2', 'target-zone', 90, 50, 'Medical Hold'),
          node('fc-intermediate-05', 'tgt3', 'target-zone', 90, 85, 'General'),
        ],
        edges: [
          edge('fc-intermediate-05', 'e1', 'fc-intermediate-05-src1', 'fc-intermediate-05-gate1'),
          edge('fc-intermediate-05', 'e2', 'fc-intermediate-05-gate1', 'fc-intermediate-05-gate2'),
          edge('fc-intermediate-05', 'e3', 'fc-intermediate-05-gate1', 'fc-intermediate-05-tgt3'),
          edge('fc-intermediate-05', 'e4', 'fc-intermediate-05-gate2', 'fc-intermediate-05-tgt1'),
          edge('fc-intermediate-05', 'e5', 'fc-intermediate-05-gate2', 'fc-intermediate-05-tgt2'),
        ],
      },
      cargoItems: [
        cargo('fc-intermediate-05', 'c1', 'amber', 'Fuel Cell', 'fuel', 'high'),
        cargo('fc-intermediate-05', 'c2', 'red', 'Emergency Serum', 'medical', 'high'),
        cargo('fc-intermediate-05', 'c3', 'amber', 'Fuel Rod', 'fuel', 'low'),
        cargo('fc-intermediate-05', 'c4', 'red', 'Bandages', 'medical', 'medium'),
        cargo('fc-intermediate-05', 'c5', 'cyan', 'Ration Pack', 'food', 'low'),
        cargo('fc-intermediate-05', 'c6', 'cyan', 'Water Supply', 'food', 'high'),
        cargo('fc-intermediate-05', 'c7', 'amber', 'Power Cell', 'fuel', 'high'),
        cargo('fc-intermediate-05', 'c8', 'red', 'Vaccine', 'medical', 'low'),
      ],
      availableGateTypes: [GateType.if],
      targetZones: [
        zone('fc-intermediate-05', 'z1', 'fc-intermediate-05-tgt1', 'Critical Bay', { expectedType: 'fuel', expectedPriority: 'high' }),
        zone('fc-intermediate-05', 'z2', 'fc-intermediate-05-tgt2', 'Medical Hold', { expectedType: 'medical' }),
        zone('fc-intermediate-05', 'z3', 'fc-intermediate-05-tgt3', 'General', {}),
      ],
    },
  },

  // Level 12 — Distribution Center (Mixed challenge)
  {
    levelId: 'fc-intermediate-06',
    gameId: 'flow-commander',
    tier: DifficultyTier.Intermediate,
    order: 6,
    title: 'Distribution Center',
    conceptIntroduced: 'Mixed challenge',
    description: 'All control flow types in one system.',
    data: {
      graph: {
        nodes: [
          node('fc-intermediate-06', 'src1', 'source', 5, 50, 'Main Intake'),
          node('fc-intermediate-06', 'gate1', 'gate-slot', 25, 50, 'Gate A'),
          node('fc-intermediate-06', 'gate2', 'gate-slot', 50, 25, 'Gate B'),
          node('fc-intermediate-06', 'gate3', 'gate-slot', 50, 75, 'Gate C'),
          node('fc-intermediate-06', 'tgt1', 'target-zone', 90, 10, 'Fuel Storage'),
          node('fc-intermediate-06', 'tgt2', 'target-zone', 90, 35, 'Med Supply'),
          node('fc-intermediate-06', 'tgt3', 'target-zone', 90, 65, 'Crew Quarters'),
          node('fc-intermediate-06', 'tgt4', 'target-zone', 90, 90, 'Galley'),
        ],
        edges: [
          edge('fc-intermediate-06', 'e1', 'fc-intermediate-06-src1', 'fc-intermediate-06-gate1'),
          edge('fc-intermediate-06', 'e2', 'fc-intermediate-06-gate1', 'fc-intermediate-06-gate2'),
          edge('fc-intermediate-06', 'e3', 'fc-intermediate-06-gate1', 'fc-intermediate-06-gate3'),
          edge('fc-intermediate-06', 'e4', 'fc-intermediate-06-gate2', 'fc-intermediate-06-tgt1'),
          edge('fc-intermediate-06', 'e5', 'fc-intermediate-06-gate2', 'fc-intermediate-06-tgt2'),
          edge('fc-intermediate-06', 'e6', 'fc-intermediate-06-gate3', 'fc-intermediate-06-tgt3'),
          edge('fc-intermediate-06', 'e7', 'fc-intermediate-06-gate3', 'fc-intermediate-06-tgt4'),
        ],
      },
      cargoItems: [
        cargo('fc-intermediate-06', 'c1', 'amber', 'Fuel Cell A', 'fuel', 'high'),
        cargo('fc-intermediate-06', 'c2', 'red', 'Med Kit A', 'medical', 'high'),
        cargo('fc-intermediate-06', 'c3', 'green', 'Engineer Kim', 'crew', 'medium'),
        cargo('fc-intermediate-06', 'c4', 'cyan', 'Ration Pack A', 'food', 'low'),
        cargo('fc-intermediate-06', 'c5', 'amber', 'Fuel Cell B', 'fuel', 'medium'),
        cargo('fc-intermediate-06', 'c6', 'red', 'Med Kit B', 'medical', 'low'),
        cargo('fc-intermediate-06', 'c7', 'green', 'Pilot Reyes', 'crew', 'high'),
        cargo('fc-intermediate-06', 'c8', 'cyan', 'Ration Pack B', 'food', 'medium'),
        cargo('fc-intermediate-06', 'c9', 'amber', 'Power Rod', 'fuel', 'low'),
        cargo('fc-intermediate-06', 'c10', 'cyan', 'Water Supply', 'food', 'high'),
      ],
      availableGateTypes: [GateType.if, GateType.for, GateType.switch],
      targetZones: [
        zone('fc-intermediate-06', 'z1', 'fc-intermediate-06-tgt1', 'Fuel Storage', { expectedType: 'fuel' }),
        zone('fc-intermediate-06', 'z2', 'fc-intermediate-06-tgt2', 'Med Supply', { expectedType: 'medical' }),
        zone('fc-intermediate-06', 'z3', 'fc-intermediate-06-tgt3', 'Crew Quarters', { expectedType: 'crew' }),
        zone('fc-intermediate-06', 'z4', 'fc-intermediate-06-tgt4', 'Galley', { expectedType: 'food' }),
      ],
    },
  },

  // =========================================================================
  // ADVANCED TIER (Levels 13-17)
  // =========================================================================

  // Level 13 — Reactive Shipment (Dynamic data)
  {
    levelId: 'fc-advanced-01',
    gameId: 'flow-commander',
    tier: DifficultyTier.Advanced,
    order: 1,
    title: 'Reactive Shipment',
    conceptIntroduced: 'Dynamic data',
    description: 'Items change properties mid-flow (reactive).',
    data: {
      graph: {
        nodes: [
          node('fc-advanced-01', 'src1', 'source', 5, 50, 'Reactive Intake'),
          node('fc-advanced-01', 'gate1', 'gate-slot', 30, 50, 'Gate A'),
          node('fc-advanced-01', 'gate2', 'gate-slot', 60, 30, 'Gate B'),
          node('fc-advanced-01', 'tgt1', 'target-zone', 90, 15, 'Urgent Bay'),
          node('fc-advanced-01', 'tgt2', 'target-zone', 90, 50, 'Standard Bay'),
          node('fc-advanced-01', 'tgt3', 'target-zone', 90, 85, 'Low Priority Hold'),
        ],
        edges: [
          edge('fc-advanced-01', 'e1', 'fc-advanced-01-src1', 'fc-advanced-01-gate1'),
          edge('fc-advanced-01', 'e2', 'fc-advanced-01-gate1', 'fc-advanced-01-gate2'),
          edge('fc-advanced-01', 'e3', 'fc-advanced-01-gate1', 'fc-advanced-01-tgt3'),
          edge('fc-advanced-01', 'e4', 'fc-advanced-01-gate2', 'fc-advanced-01-tgt1'),
          edge('fc-advanced-01', 'e5', 'fc-advanced-01-gate2', 'fc-advanced-01-tgt2'),
        ],
      },
      cargoItems: [
        cargo('fc-advanced-01', 'c1', 'amber', 'Fuel Cell A', 'fuel', 'high'),
        cargo('fc-advanced-01', 'c2', 'red', 'Emergency Meds', 'medical', 'high'),
        cargo('fc-advanced-01', 'c3', 'cyan', 'Ration Pack', 'food', 'medium'),
        cargo('fc-advanced-01', 'c4', 'amber', 'Power Rod', 'fuel', 'low'),
        cargo('fc-advanced-01', 'c5', 'red', 'Vaccine', 'medical', 'medium'),
        cargo('fc-advanced-01', 'c6', 'green', 'Spare Parts', 'engineering', 'low'),
        cargo('fc-advanced-01', 'c7', 'amber', 'Fuel Cell B', 'fuel', 'high'),
        cargo('fc-advanced-01', 'c8', 'red', 'Blood Plasma', 'medical', 'high'),
      ],
      availableGateTypes: [GateType.if, GateType.switch],
      targetZones: [
        zone('fc-advanced-01', 'z1', 'fc-advanced-01-tgt1', 'Urgent Bay', { expectedPriority: 'high' }),
        zone('fc-advanced-01', 'z2', 'fc-advanced-01-tgt2', 'Standard Bay', { expectedPriority: 'medium' }),
        zone('fc-advanced-01', 'z3', 'fc-advanced-01-tgt3', 'Low Priority Hold', { expectedPriority: 'low' }),
      ],
    },
  },

  // Level 14 — Cargo Grid (Nested @for)
  {
    levelId: 'fc-advanced-02',
    gameId: 'flow-commander',
    tier: DifficultyTier.Advanced,
    order: 2,
    title: 'Cargo Grid',
    conceptIntroduced: 'Nested @for',
    description: 'Lists within lists (grid layout).',
    data: {
      graph: {
        nodes: [
          node('fc-advanced-02', 'src1', 'source', 5, 50, 'Grid Loader'),
          node('fc-advanced-02', 'gate1', 'gate-slot', 35, 50, 'Gate A'),
          node('fc-advanced-02', 'gate2', 'gate-slot', 65, 50, 'Gate B'),
          node('fc-advanced-02', 'tgt1', 'target-zone', 90, 30, 'Grid Bay A'),
          node('fc-advanced-02', 'tgt2', 'target-zone', 90, 70, 'Grid Bay B'),
        ],
        edges: [
          edge('fc-advanced-02', 'e1', 'fc-advanced-02-src1', 'fc-advanced-02-gate1'),
          edge('fc-advanced-02', 'e2', 'fc-advanced-02-gate1', 'fc-advanced-02-gate2'),
          edge('fc-advanced-02', 'e3', 'fc-advanced-02-gate2', 'fc-advanced-02-tgt1'),
          edge('fc-advanced-02', 'e4', 'fc-advanced-02-gate2', 'fc-advanced-02-tgt2'),
        ],
      },
      cargoItems: [
        cargo('fc-advanced-02', 'c1', 'amber', 'Row1-Col1', 'fuel', 'low'),
        cargo('fc-advanced-02', 'c2', 'amber', 'Row1-Col2', 'fuel', 'low'),
        cargo('fc-advanced-02', 'c3', 'amber', 'Row1-Col3', 'fuel', 'low'),
        cargo('fc-advanced-02', 'c4', 'cyan', 'Row2-Col1', 'food', 'medium'),
        cargo('fc-advanced-02', 'c5', 'cyan', 'Row2-Col2', 'food', 'medium'),
        cargo('fc-advanced-02', 'c6', 'cyan', 'Row2-Col3', 'food', 'medium'),
        cargo('fc-advanced-02', 'c7', 'red', 'Row3-Col1', 'medical', 'high'),
        cargo('fc-advanced-02', 'c8', 'red', 'Row3-Col2', 'medical', 'high'),
        cargo('fc-advanced-02', 'c9', 'red', 'Row3-Col3', 'medical', 'high'),
      ],
      availableGateTypes: [GateType.for],
      targetZones: [
        zone('fc-advanced-02', 'z1', 'fc-advanced-02-tgt1', 'Grid Bay A', {}),
        zone('fc-advanced-02', 'z2', 'fc-advanced-02-tgt2', 'Grid Bay B', {}),
      ],
    },
  },

  // Level 15 — Aliased Conditions (@if with @let)
  {
    levelId: 'fc-advanced-03',
    gameId: 'flow-commander',
    tier: DifficultyTier.Advanced,
    order: 3,
    title: 'Aliased Conditions',
    conceptIntroduced: '@if with @let',
    description: 'Alias expressions for reuse.',
    data: {
      graph: {
        nodes: [
          node('fc-advanced-03', 'src1', 'source', 5, 50, 'Cargo Bay'),
          node('fc-advanced-03', 'gate1', 'gate-slot', 30, 50, 'Gate A'),
          node('fc-advanced-03', 'gate2', 'gate-slot', 60, 30, 'Gate B'),
          node('fc-advanced-03', 'tgt1', 'target-zone', 90, 15, 'Priority Store'),
          node('fc-advanced-03', 'tgt2', 'target-zone', 90, 50, 'Standard Store'),
          node('fc-advanced-03', 'tgt3', 'target-zone', 90, 85, 'Overflow'),
        ],
        edges: [
          edge('fc-advanced-03', 'e1', 'fc-advanced-03-src1', 'fc-advanced-03-gate1'),
          edge('fc-advanced-03', 'e2', 'fc-advanced-03-gate1', 'fc-advanced-03-gate2'),
          edge('fc-advanced-03', 'e3', 'fc-advanced-03-gate1', 'fc-advanced-03-tgt3'),
          edge('fc-advanced-03', 'e4', 'fc-advanced-03-gate2', 'fc-advanced-03-tgt1'),
          edge('fc-advanced-03', 'e5', 'fc-advanced-03-gate2', 'fc-advanced-03-tgt2'),
        ],
      },
      cargoItems: [
        cargo('fc-advanced-03', 'c1', 'amber', 'Fuel Cell A', 'fuel', 'high'),
        cargo('fc-advanced-03', 'c2', 'red', 'Med Kit A', 'medical', 'high'),
        cargo('fc-advanced-03', 'c3', 'cyan', 'Ration Pack', 'food', 'low'),
        cargo('fc-advanced-03', 'c4', 'green', 'Spare Parts', 'engineering', 'medium'),
        cargo('fc-advanced-03', 'c5', 'amber', 'Fuel Cell B', 'fuel', 'medium'),
        cargo('fc-advanced-03', 'c6', 'red', 'Vaccine', 'medical', 'low'),
        cargo('fc-advanced-03', 'c7', 'violet', 'Science Sample A', 'science', 'high'),
        cargo('fc-advanced-03', 'c8', 'violet', 'Science Sample B', 'science', 'medium'),
      ],
      availableGateTypes: [GateType.if],
      targetZones: [
        zone('fc-advanced-03', 'z1', 'fc-advanced-03-tgt1', 'Priority Store', { expectedPriority: 'high' }),
        zone('fc-advanced-03', 'z2', 'fc-advanced-03-tgt2', 'Standard Store', { expectedPriority: 'medium' }),
        zone('fc-advanced-03', 'z3', 'fc-advanced-03-tgt3', 'Overflow', {}),
      ],
    },
  },

  // Level 16 — Gate Optimizer (Optimization)
  {
    levelId: 'fc-advanced-04',
    gameId: 'flow-commander',
    tier: DifficultyTier.Advanced,
    order: 4,
    title: 'Gate Optimizer',
    conceptIntroduced: 'Optimization',
    description: 'Achieve same result with fewer gates.',
    data: {
      graph: {
        nodes: [
          node('fc-advanced-04', 'src1', 'source', 5, 50, 'Cargo Bay'),
          node('fc-advanced-04', 'gate1', 'gate-slot', 25, 50, 'Gate A'),
          node('fc-advanced-04', 'gate2', 'gate-slot', 45, 25, 'Gate B'),
          node('fc-advanced-04', 'gate3', 'gate-slot', 45, 50, 'Gate C'),
          node('fc-advanced-04', 'gate4', 'gate-slot', 45, 75, 'Gate D'),
          node('fc-advanced-04', 'tgt1', 'target-zone', 90, 15, 'Fuel Bay'),
          node('fc-advanced-04', 'tgt2', 'target-zone', 90, 50, 'Med Bay'),
          node('fc-advanced-04', 'tgt3', 'target-zone', 90, 85, 'General'),
        ],
        edges: [
          edge('fc-advanced-04', 'e1', 'fc-advanced-04-src1', 'fc-advanced-04-gate1'),
          edge('fc-advanced-04', 'e2', 'fc-advanced-04-gate1', 'fc-advanced-04-gate2'),
          edge('fc-advanced-04', 'e3', 'fc-advanced-04-gate1', 'fc-advanced-04-gate3'),
          edge('fc-advanced-04', 'e4', 'fc-advanced-04-gate1', 'fc-advanced-04-gate4'),
          edge('fc-advanced-04', 'e5', 'fc-advanced-04-gate2', 'fc-advanced-04-tgt1'),
          edge('fc-advanced-04', 'e6', 'fc-advanced-04-gate3', 'fc-advanced-04-tgt2'),
          edge('fc-advanced-04', 'e7', 'fc-advanced-04-gate4', 'fc-advanced-04-tgt3'),
        ],
      },
      cargoItems: [
        cargo('fc-advanced-04', 'c1', 'amber', 'Fuel Cell A', 'fuel', 'high'),
        cargo('fc-advanced-04', 'c2', 'amber', 'Fuel Cell B', 'fuel', 'medium'),
        cargo('fc-advanced-04', 'c3', 'red', 'Med Kit A', 'medical', 'high'),
        cargo('fc-advanced-04', 'c4', 'red', 'Med Kit B', 'medical', 'low'),
        cargo('fc-advanced-04', 'c5', 'cyan', 'Ration Pack', 'food', 'medium'),
        cargo('fc-advanced-04', 'c6', 'cyan', 'Water Supply', 'food', 'low'),
      ],
      availableGateTypes: [GateType.if, GateType.switch],
      targetZones: [
        zone('fc-advanced-04', 'z1', 'fc-advanced-04-tgt1', 'Fuel Bay', { expectedType: 'fuel' }),
        zone('fc-advanced-04', 'z2', 'fc-advanced-04-tgt2', 'Med Bay', { expectedType: 'medical' }),
        zone('fc-advanced-04', 'z3', 'fc-advanced-04-tgt3', 'General', {}),
      ],
    },
  },

  // Level 17 — Full Pipeline (Complex multi-stage)
  {
    levelId: 'fc-advanced-05',
    gameId: 'flow-commander',
    tier: DifficultyTier.Advanced,
    order: 5,
    title: 'Full Pipeline',
    conceptIntroduced: 'Full pipeline',
    description: 'Complex multi-stage sorting system.',
    data: {
      graph: {
        nodes: [
          node('fc-advanced-05', 'src1', 'source', 5, 30, 'Intake Alpha'),
          node('fc-advanced-05', 'src2', 'source', 5, 70, 'Intake Beta'),
          node('fc-advanced-05', 'jct1', 'junction', 20, 50, 'Merge'),
          node('fc-advanced-05', 'gate1', 'gate-slot', 35, 50, 'Gate A'),
          node('fc-advanced-05', 'gate2', 'gate-slot', 55, 25, 'Gate B'),
          node('fc-advanced-05', 'gate3', 'gate-slot', 55, 50, 'Gate C'),
          node('fc-advanced-05', 'gate4', 'gate-slot', 55, 75, 'Gate D'),
          node('fc-advanced-05', 'tgt1', 'target-zone', 90, 10, 'Fuel Bay'),
          node('fc-advanced-05', 'tgt2', 'target-zone', 90, 30, 'Med Bay'),
          node('fc-advanced-05', 'tgt3', 'target-zone', 90, 50, 'Crew Quarters'),
          node('fc-advanced-05', 'tgt4', 'target-zone', 90, 70, 'Galley'),
          node('fc-advanced-05', 'tgt5', 'target-zone', 90, 90, 'Engineering'),
        ],
        edges: [
          edge('fc-advanced-05', 'e1', 'fc-advanced-05-src1', 'fc-advanced-05-jct1'),
          edge('fc-advanced-05', 'e2', 'fc-advanced-05-src2', 'fc-advanced-05-jct1'),
          edge('fc-advanced-05', 'e3', 'fc-advanced-05-jct1', 'fc-advanced-05-gate1'),
          edge('fc-advanced-05', 'e4', 'fc-advanced-05-gate1', 'fc-advanced-05-gate2'),
          edge('fc-advanced-05', 'e5', 'fc-advanced-05-gate1', 'fc-advanced-05-gate3'),
          edge('fc-advanced-05', 'e6', 'fc-advanced-05-gate1', 'fc-advanced-05-gate4'),
          edge('fc-advanced-05', 'e7', 'fc-advanced-05-gate2', 'fc-advanced-05-tgt1'),
          edge('fc-advanced-05', 'e8', 'fc-advanced-05-gate2', 'fc-advanced-05-tgt2'),
          edge('fc-advanced-05', 'e9', 'fc-advanced-05-gate3', 'fc-advanced-05-tgt3'),
          edge('fc-advanced-05', 'e10', 'fc-advanced-05-gate3', 'fc-advanced-05-tgt4'),
          edge('fc-advanced-05', 'e11', 'fc-advanced-05-gate4', 'fc-advanced-05-tgt5'),
        ],
      },
      cargoItems: [
        cargo('fc-advanced-05', 'c1', 'amber', 'Fuel Cell A', 'fuel', 'high'),
        cargo('fc-advanced-05', 'c2', 'amber', 'Fuel Cell B', 'fuel', 'medium'),
        cargo('fc-advanced-05', 'c3', 'red', 'Med Kit A', 'medical', 'high'),
        cargo('fc-advanced-05', 'c4', 'red', 'Med Kit B', 'medical', 'low'),
        cargo('fc-advanced-05', 'c5', 'green', 'Engineer Kim', 'crew', 'medium'),
        cargo('fc-advanced-05', 'c6', 'green', 'Pilot Reyes', 'crew', 'high'),
        cargo('fc-advanced-05', 'c7', 'cyan', 'Ration Pack A', 'food', 'low'),
        cargo('fc-advanced-05', 'c8', 'cyan', 'Ration Pack B', 'food', 'medium'),
        cargo('fc-advanced-05', 'c9', 'green', 'Spare Parts A', 'engineering', 'high'),
        cargo('fc-advanced-05', 'c10', 'green', 'Spare Parts B', 'engineering', 'low'),
        cargo('fc-advanced-05', 'c11', 'amber', 'Power Rod', 'fuel', 'low'),
        cargo('fc-advanced-05', 'c12', 'red', 'Bandages', 'medical', 'medium'),
        cargo('fc-advanced-05', 'c13', 'green', 'Medic Chen', 'crew', 'medium'),
        cargo('fc-advanced-05', 'c14', 'cyan', 'Water Supply', 'food', 'high'),
        cargo('fc-advanced-05', 'c15', 'green', 'Tool Kit', 'engineering', 'medium'),
      ],
      availableGateTypes: [GateType.if, GateType.for, GateType.switch],
      targetZones: [
        zone('fc-advanced-05', 'z1', 'fc-advanced-05-tgt1', 'Fuel Bay', { expectedType: 'fuel' }),
        zone('fc-advanced-05', 'z2', 'fc-advanced-05-tgt2', 'Med Bay', { expectedType: 'medical' }),
        zone('fc-advanced-05', 'z3', 'fc-advanced-05-tgt3', 'Crew Quarters', { expectedType: 'crew' }),
        zone('fc-advanced-05', 'z4', 'fc-advanced-05-tgt4', 'Galley', { expectedType: 'food' }),
        zone('fc-advanced-05', 'z5', 'fc-advanced-05-tgt5', 'Engineering', { expectedType: 'engineering' }),
      ],
    },
  },

  // =========================================================================
  // BOSS TIER (Level 18)
  // =========================================================================

  // Level 18 — Emergency Cargo Sort
  {
    levelId: 'fc-boss-01',
    gameId: 'flow-commander',
    tier: DifficultyTier.Boss,
    order: 1,
    title: 'Emergency Cargo Sort',
    conceptIntroduced: 'Full sorting system',
    description: 'Massive shipment, full sorting system, time pressure.',
    parTime: 90,
    data: {
      graph: {
        nodes: [
          node('fc-boss-01', 'src1', 'source', 5, 30, 'Bay Alpha'),
          node('fc-boss-01', 'src2', 'source', 5, 70, 'Bay Beta'),
          node('fc-boss-01', 'jct1', 'junction', 15, 50, 'Merge'),
          node('fc-boss-01', 'gate1', 'gate-slot', 25, 50, 'Gate A'),
          node('fc-boss-01', 'gate2', 'gate-slot', 40, 20, 'Gate B'),
          node('fc-boss-01', 'gate3', 'gate-slot', 40, 40, 'Gate C'),
          node('fc-boss-01', 'gate4', 'gate-slot', 40, 60, 'Gate D'),
          node('fc-boss-01', 'gate5', 'gate-slot', 40, 80, 'Gate E'),
          node('fc-boss-01', 'gate6', 'gate-slot', 60, 15, 'Gate F'),
          node('fc-boss-01', 'gate7', 'gate-slot', 60, 55, 'Gate G'),
          node('fc-boss-01', 'gate8', 'gate-slot', 60, 85, 'Gate H'),
          node('fc-boss-01', 'tgt1', 'target-zone', 90, 5, 'Fuel Bay'),
          node('fc-boss-01', 'tgt2', 'target-zone', 90, 18, 'Med Bay'),
          node('fc-boss-01', 'tgt3', 'target-zone', 90, 31, 'Galley'),
          node('fc-boss-01', 'tgt4', 'target-zone', 90, 44, 'Armory'),
          node('fc-boss-01', 'tgt5', 'target-zone', 90, 57, 'Crew Quarters'),
          node('fc-boss-01', 'tgt6', 'target-zone', 90, 70, 'Workshop'),
          node('fc-boss-01', 'tgt7', 'target-zone', 90, 83, 'Science Lab'),
          node('fc-boss-01', 'tgt8', 'target-zone', 90, 96, 'Hazmat Vault'),
        ],
        edges: [
          edge('fc-boss-01', 'e1', 'fc-boss-01-src1', 'fc-boss-01-jct1'),
          edge('fc-boss-01', 'e2', 'fc-boss-01-src2', 'fc-boss-01-jct1'),
          edge('fc-boss-01', 'e3', 'fc-boss-01-jct1', 'fc-boss-01-gate1'),
          edge('fc-boss-01', 'e4', 'fc-boss-01-gate1', 'fc-boss-01-gate2'),
          edge('fc-boss-01', 'e5', 'fc-boss-01-gate1', 'fc-boss-01-gate3'),
          edge('fc-boss-01', 'e6', 'fc-boss-01-gate1', 'fc-boss-01-gate4'),
          edge('fc-boss-01', 'e7', 'fc-boss-01-gate1', 'fc-boss-01-gate5'),
          edge('fc-boss-01', 'e8', 'fc-boss-01-gate2', 'fc-boss-01-gate6'),
          edge('fc-boss-01', 'e9', 'fc-boss-01-gate2', 'fc-boss-01-tgt3'),
          edge('fc-boss-01', 'e10', 'fc-boss-01-gate3', 'fc-boss-01-tgt4'),
          edge('fc-boss-01', 'e11', 'fc-boss-01-gate3', 'fc-boss-01-gate7'),
          edge('fc-boss-01', 'e12', 'fc-boss-01-gate4', 'fc-boss-01-tgt6'),
          edge('fc-boss-01', 'e13', 'fc-boss-01-gate4', 'fc-boss-01-gate8'),
          edge('fc-boss-01', 'e14', 'fc-boss-01-gate5', 'fc-boss-01-tgt8'),
          edge('fc-boss-01', 'e15', 'fc-boss-01-gate6', 'fc-boss-01-tgt1'),
          edge('fc-boss-01', 'e16', 'fc-boss-01-gate6', 'fc-boss-01-tgt2'),
          edge('fc-boss-01', 'e17', 'fc-boss-01-gate7', 'fc-boss-01-tgt5'),
          edge('fc-boss-01', 'e18', 'fc-boss-01-gate8', 'fc-boss-01-tgt7'),
        ],
      },
      cargoItems: [
        // Fuel (7 items)
        cargo('fc-boss-01', 'c1', 'amber', 'Fuel Cell A', 'fuel', 'high'),
        cargo('fc-boss-01', 'c2', 'amber', 'Fuel Cell B', 'fuel', 'medium'),
        cargo('fc-boss-01', 'c3', 'amber', 'Fuel Cell C', 'fuel', 'low'),
        cargo('fc-boss-01', 'c4', 'amber', 'Power Rod A', 'fuel', 'high'),
        cargo('fc-boss-01', 'c5', 'amber', 'Power Rod B', 'fuel', 'medium'),
        cargo('fc-boss-01', 'c6', 'amber', 'Reactor Fuel', 'fuel', 'high'),
        cargo('fc-boss-01', 'c7', 'amber', 'Backup Cell', 'fuel', 'low'),
        // Medical (7 items)
        cargo('fc-boss-01', 'c8', 'red', 'Med Kit A', 'medical', 'high'),
        cargo('fc-boss-01', 'c9', 'red', 'Med Kit B', 'medical', 'medium'),
        cargo('fc-boss-01', 'c10', 'red', 'Vaccine Batch', 'medical', 'high'),
        cargo('fc-boss-01', 'c11', 'red', 'Bandage Pack', 'medical', 'low'),
        cargo('fc-boss-01', 'c12', 'red', 'Blood Plasma', 'medical', 'high'),
        cargo('fc-boss-01', 'c13', 'red', 'First Aid Kit', 'medical', 'medium'),
        cargo('fc-boss-01', 'c14', 'red', 'Antiseptic', 'medical', 'low'),
        // Food (7 items)
        cargo('fc-boss-01', 'c15', 'cyan', 'Ration Pack A', 'food', 'medium'),
        cargo('fc-boss-01', 'c16', 'cyan', 'Ration Pack B', 'food', 'low'),
        cargo('fc-boss-01', 'c17', 'cyan', 'Water Supply A', 'food', 'high'),
        cargo('fc-boss-01', 'c18', 'cyan', 'Water Supply B', 'food', 'medium'),
        cargo('fc-boss-01', 'c19', 'cyan', 'Protein Bars', 'food', 'low'),
        cargo('fc-boss-01', 'c20', 'cyan', 'Freeze-Dried Meal', 'food', 'medium'),
        cargo('fc-boss-01', 'c21', 'cyan', 'Emergency Ration', 'food', 'high'),
        // Weapons (7 items)
        cargo('fc-boss-01', 'c22', 'violet', 'Plasma Rifle', 'weapons', 'high'),
        cargo('fc-boss-01', 'c23', 'violet', 'Stun Baton', 'weapons', 'medium'),
        cargo('fc-boss-01', 'c24', 'violet', 'Ammo Crate A', 'weapons', 'low'),
        cargo('fc-boss-01', 'c25', 'violet', 'Ammo Crate B', 'weapons', 'medium'),
        cargo('fc-boss-01', 'c26', 'violet', 'Shield Generator', 'weapons', 'high'),
        cargo('fc-boss-01', 'c27', 'violet', 'EMP Grenade', 'weapons', 'medium'),
        cargo('fc-boss-01', 'c28', 'violet', 'Flare Gun', 'weapons', 'low'),
        // Crew (6 items)
        cargo('fc-boss-01', 'c29', 'green', 'Lt. Park', 'crew', 'high'),
        cargo('fc-boss-01', 'c30', 'green', 'Ens. Diaz', 'crew', 'medium'),
        cargo('fc-boss-01', 'c31', 'green', 'Dr. Patel', 'crew', 'high'),
        cargo('fc-boss-01', 'c32', 'green', 'Sgt. Torres', 'crew', 'medium'),
        cargo('fc-boss-01', 'c33', 'green', 'Cpl. Nakamura', 'crew', 'low'),
        cargo('fc-boss-01', 'c34', 'green', 'Pvt. Kim', 'crew', 'low'),
        // Engineering (6 items)
        cargo('fc-boss-01', 'c35', 'green', 'Spare Parts A', 'engineering', 'medium'),
        cargo('fc-boss-01', 'c36', 'green', 'Spare Parts B', 'engineering', 'low'),
        cargo('fc-boss-01', 'c37', 'green', 'Circuit Boards', 'engineering', 'high'),
        cargo('fc-boss-01', 'c38', 'green', 'Hull Plates', 'engineering', 'medium'),
        cargo('fc-boss-01', 'c39', 'green', 'Welding Kit', 'engineering', 'low'),
        cargo('fc-boss-01', 'c40', 'green', 'Power Conduit', 'engineering', 'high'),
        // Science (6 items)
        cargo('fc-boss-01', 'c41', 'violet', 'Sample Alpha', 'science', 'high'),
        cargo('fc-boss-01', 'c42', 'violet', 'Sample Beta', 'science', 'medium'),
        cargo('fc-boss-01', 'c43', 'violet', 'Data Disk A', 'science', 'low'),
        cargo('fc-boss-01', 'c44', 'violet', 'Data Disk B', 'science', 'medium'),
        cargo('fc-boss-01', 'c45', 'violet', 'Telescope Lens', 'science', 'high'),
        cargo('fc-boss-01', 'c46', 'violet', 'Lab Equipment', 'science', 'low'),
        // Hazmat (6 items)
        cargo('fc-boss-01', 'c47', 'red', 'Toxic Waste A', 'hazmat', 'high'),
        cargo('fc-boss-01', 'c48', 'red', 'Toxic Waste B', 'hazmat', 'high'),
        cargo('fc-boss-01', 'c49', 'red', 'Radioactive Core', 'hazmat', 'high'),
        cargo('fc-boss-01', 'c50', 'red', 'Chemical Barrel', 'hazmat', 'medium'),
        cargo('fc-boss-01', 'c51', 'red', 'Biohazard Container', 'hazmat', 'medium'),
        cargo('fc-boss-01', 'c52', 'red', 'Contaminated Soil', 'hazmat', 'low'),
      ],
      availableGateTypes: [GateType.if, GateType.for, GateType.switch],
      targetZones: [
        zone('fc-boss-01', 'z1', 'fc-boss-01-tgt1', 'Fuel Bay', { expectedType: 'fuel' }),
        zone('fc-boss-01', 'z2', 'fc-boss-01-tgt2', 'Med Bay', { expectedType: 'medical' }),
        zone('fc-boss-01', 'z3', 'fc-boss-01-tgt3', 'Galley', { expectedType: 'food' }),
        zone('fc-boss-01', 'z4', 'fc-boss-01-tgt4', 'Armory', { expectedType: 'weapons' }),
        zone('fc-boss-01', 'z5', 'fc-boss-01-tgt5', 'Crew Quarters', { expectedType: 'crew' }),
        zone('fc-boss-01', 'z6', 'fc-boss-01-tgt6', 'Workshop', { expectedType: 'engineering' }),
        zone('fc-boss-01', 'z7', 'fc-boss-01-tgt7', 'Science Lab', { expectedType: 'science' }),
        zone('fc-boss-01', 'z8', 'fc-boss-01-tgt8', 'Hazmat Vault', { expectedType: 'hazmat' }),
      ],
    },
  },
];

// ---------------------------------------------------------------------------
// Level Pack
// ---------------------------------------------------------------------------

export const FLOW_COMMANDER_LEVEL_PACK: LevelPack = {
  gameId: 'flow-commander',
  levels: FLOW_COMMANDER_LEVELS,
};
