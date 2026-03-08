import { DifficultyTier } from '../../core/minigame/minigame.types';
import type { LevelDefinition, LevelPack } from '../../core/levels/level.types';
import type {
  ApproachDirection,
  InputTransform,
  NoiseWave,
  ParentBinding,
  SignalCorpsLevelData,
  TowerInput,
  TowerOutput,
  TowerPlacement,
} from '../../features/minigames/signal-corps/signal-corps.types';

// ---------------------------------------------------------------------------
// Builder helpers (private to this file)
// ---------------------------------------------------------------------------

/** Build a TowerPlacement with auto-prefixed ID. */
function tower(
  prefix: string,
  idx: number,
  row: number,
  col: number,
  inputs: readonly TowerInput[],
  outputs: readonly TowerOutput[],
): TowerPlacement {
  return {
    towerId: `${prefix}-t${idx}`,
    position: { row, col },
    config: { inputs, outputs },
  };
}

/** Build a TowerInput. */
function inp(
  name: string,
  type: string,
  required: boolean,
  transform?: InputTransform,
  aliasName?: string,
): TowerInput {
  const result: TowerInput = { name, type, required };
  if (transform !== undefined) {
    return { ...result, transform };
  }
  if (aliasName !== undefined) {
    return { ...result, aliasName };
  }
  return result;
}

/** Build a TowerOutput. */
function out(
  name: string,
  payloadType: string,
): TowerOutput {
  return { name, payloadType };
}

/** Build a NoiseWave with auto-prefixed ID. */
function wave(
  prefix: string,
  idx: number,
  direction: ApproachDirection,
  typeSignature: string,
  damage: number,
): NoiseWave {
  return {
    waveId: `${prefix}-w${idx}`,
    approachDirection: direction,
    typeSignature,
    damage,
  };
}

/** Build a ParentBinding for an input port. */
function inputBinding(
  parentProperty: string,
  towerPortName: string,
): ParentBinding {
  return { bindingType: 'input', parentProperty, towerPortName };
}

/** Build a ParentBinding for an output port. */
function outputBinding(
  parentHandler: string,
  towerPortName: string,
): ParentBinding {
  return { bindingType: 'output', parentHandler, towerPortName };
}

// ---------------------------------------------------------------------------
// Level definitions
// ---------------------------------------------------------------------------

export const SIGNAL_CORPS_LEVELS: readonly LevelDefinition<SignalCorpsLevelData>[] = [
  // =========================================================================
  // BASIC TIER (Levels 1-6)
  // =========================================================================

  // Level 1 — Sensor Relay (Single input)
  {
    levelId: 'sc-basic-01',
    gameId: 'signal-corps',
    tier: DifficultyTier.Basic,
    order: 1,
    title: 'Sensor Relay',
    conceptIntroduced: 'Single input',
    description: 'Configure one tower with a single input to block incoming noise.',
    data: {
      gridSize: { rows: 6, cols: 6 },
      towerPlacements: [
        tower('sc-basic-01', 1, 2, 3,
          [inp('sensorValue', 'number', true)],
          [],
        ),
      ],
      noiseWaves: [
        wave('sc-basic-01', 1, 'north', 'number', 10),
      ],
      expectedBindings: [
        inputBinding('currentReading', 'sensorValue'),
      ],
      stationHealth: 50,
    },
  },

  // Level 2 — Multi-Sensor Array (Multiple inputs)
  {
    levelId: 'sc-basic-02',
    gameId: 'signal-corps',
    tier: DifficultyTier.Basic,
    order: 2,
    title: 'Multi-Sensor Array',
    conceptIntroduced: 'Multiple inputs',
    description: 'One tower with 3 inputs of different types to handle varied noise.',
    data: {
      gridSize: { rows: 6, cols: 6 },
      towerPlacements: [
        tower('sc-basic-02', 1, 3, 3,
          [
            inp('temperature', 'number', true),
            inp('status', 'string', true),
            inp('isActive', 'boolean', true),
          ],
          [],
        ),
      ],
      noiseWaves: [
        wave('sc-basic-02', 1, 'north', 'number', 10),
        wave('sc-basic-02', 2, 'east', 'string', 8),
        wave('sc-basic-02', 3, 'south', 'boolean', 12),
      ],
      expectedBindings: [
        inputBinding('envTemperature', 'temperature'),
        inputBinding('systemStatus', 'status'),
        inputBinding('systemActive', 'isActive'),
      ],
      stationHealth: 60,
    },
  },

  // Level 3 — Priority Inputs (Required vs optional)
  {
    levelId: 'sc-basic-03',
    gameId: 'signal-corps',
    tier: DifficultyTier.Basic,
    order: 3,
    title: 'Priority Inputs',
    conceptIntroduced: 'Required vs optional',
    description: 'Some inputs are required for tower activation, others have defaults.',
    data: {
      gridSize: { rows: 6, cols: 6 },
      towerPlacements: [
        tower('sc-basic-03', 1, 2, 2,
          [
            inp('frequency', 'number', true),
            inp('label', 'string', false),
            inp('amplified', 'boolean', false),
          ],
          [],
        ),
      ],
      noiseWaves: [
        wave('sc-basic-03', 1, 'west', 'number', 10),
        wave('sc-basic-03', 2, 'east', 'string', 8),
      ],
      expectedBindings: [
        inputBinding('baseFrequency', 'frequency'),
        inputBinding('towerLabel', 'label'),
      ],
      stationHealth: 70,
    },
  },

  // Level 4 — Alert Emitter (Single output)
  {
    levelId: 'sc-basic-04',
    gameId: 'signal-corps',
    tier: DifficultyTier.Basic,
    order: 4,
    title: 'Alert Emitter',
    conceptIntroduced: 'Single output',
    description: 'Tower emits an alert event when noise is detected. Parent handles it.',
    data: {
      gridSize: { rows: 6, cols: 6 },
      towerPlacements: [
        tower('sc-basic-04', 1, 3, 1,
          [],
          [out('alertTriggered', 'string')],
        ),
      ],
      noiseWaves: [
        wave('sc-basic-04', 1, 'south', 'string', 15),
      ],
      expectedBindings: [
        outputBinding('onAlert', 'alertTriggered'),
      ],
      stationHealth: 60,
    },
  },

  // Level 5 — Dual Channel (Input + output together)
  {
    levelId: 'sc-basic-05',
    gameId: 'signal-corps',
    tier: DifficultyTier.Basic,
    order: 5,
    title: 'Dual Channel',
    conceptIntroduced: 'Input + output together',
    description: 'Tower receives data via input and reports events via output.',
    data: {
      gridSize: { rows: 6, cols: 6 },
      towerPlacements: [
        tower('sc-basic-05', 1, 1, 4,
          [inp('signalStrength', 'number', true)],
          [out('anomalyDetected', 'boolean')],
        ),
      ],
      noiseWaves: [
        wave('sc-basic-05', 1, 'north', 'number', 12),
        wave('sc-basic-05', 2, 'east', 'boolean', 10),
      ],
      expectedBindings: [
        inputBinding('powerLevel', 'signalStrength'),
        outputBinding('onAnomaly', 'anomalyDetected'),
      ],
      stationHealth: 80,
    },
  },

  // Level 6 — Perimeter Defense (Multiple towers)
  {
    levelId: 'sc-basic-06',
    gameId: 'signal-corps',
    tier: DifficultyTier.Basic,
    order: 6,
    title: 'Perimeter Defense',
    conceptIntroduced: 'Multiple towers',
    description: '3 towers, each with different input/output configs.',
    data: {
      gridSize: { rows: 6, cols: 6 },
      towerPlacements: [
        tower('sc-basic-06', 1, 0, 3,
          [inp('shieldPower', 'number', true)],
          [],
        ),
        tower('sc-basic-06', 2, 3, 0,
          [],
          [out('intrusionAlert', 'string')],
        ),
        tower('sc-basic-06', 3, 5, 3,
          [inp('scanRange', 'number', true)],
          [out('contactFound', 'boolean')],
        ),
      ],
      noiseWaves: [
        wave('sc-basic-06', 1, 'north', 'number', 12),
        wave('sc-basic-06', 2, 'west', 'string', 10),
        wave('sc-basic-06', 3, 'south', 'boolean', 14),
      ],
      expectedBindings: [
        inputBinding('mainPower', 'shieldPower'),
        outputBinding('onIntrusion', 'intrusionAlert'),
        inputBinding('maxRange', 'scanRange'),
        outputBinding('onContact', 'contactFound'),
      ],
      stationHealth: 100,
    },
  },

  // =========================================================================
  // INTERMEDIATE TIER (Levels 7-12)
  // =========================================================================

  // Level 7 — Signal Converter (Input transforms)
  {
    levelId: 'sc-intermediate-01',
    gameId: 'signal-corps',
    tier: DifficultyTier.Intermediate,
    order: 1,
    title: 'Signal Converter',
    conceptIntroduced: 'Input transforms',
    description: 'Transform input values using numberAttribute and booleanAttribute.',
    data: {
      gridSize: { rows: 8, cols: 8 },
      towerPlacements: [
        tower('sc-intermediate-01', 1, 2, 4,
          [
            inp('powerLevel', 'number', true, 'numberAttribute'),
            inp('enabled', 'boolean', true, 'booleanAttribute'),
          ],
          [],
        ),
      ],
      noiseWaves: [
        wave('sc-intermediate-01', 1, 'north', 'number', 15),
        wave('sc-intermediate-01', 2, 'south', 'boolean', 12),
      ],
      expectedBindings: [
        inputBinding('rawPower', 'powerLevel'),
        inputBinding('isEnabled', 'enabled'),
      ],
      stationHealth: 80,
    },
  },

  // Level 8 — Typed Dispatch (Output with payload)
  {
    levelId: 'sc-intermediate-02',
    gameId: 'signal-corps',
    tier: DifficultyTier.Intermediate,
    order: 2,
    title: 'Typed Dispatch',
    conceptIntroduced: 'Output with payload',
    description: 'Tower outputs carry typed payloads for the parent to process.',
    data: {
      gridSize: { rows: 8, cols: 8 },
      towerPlacements: [
        tower('sc-intermediate-02', 1, 4, 2,
          [inp('targetId', 'string', true)],
          [
            out('damageReport', 'number'),
            out('statusUpdate', 'string'),
          ],
        ),
      ],
      noiseWaves: [
        wave('sc-intermediate-02', 1, 'west', 'string', 14),
        wave('sc-intermediate-02', 2, 'east', 'number', 16),
      ],
      expectedBindings: [
        inputBinding('selectedTarget', 'targetId'),
        outputBinding('onDamage', 'damageReport'),
        outputBinding('onStatus', 'statusUpdate'),
      ],
      stationHealth: 90,
    },
  },

  // Level 9 — Alias Network (Input aliasing)
  {
    levelId: 'sc-intermediate-03',
    gameId: 'signal-corps',
    tier: DifficultyTier.Intermediate,
    order: 3,
    title: 'Alias Network',
    conceptIntroduced: 'Input aliasing',
    description: 'Input port public names differ from internal property names.',
    data: {
      gridSize: { rows: 8, cols: 8 },
      towerPlacements: [
        tower('sc-intermediate-03', 1, 3, 5,
          [
            inp('freq', 'number', true, undefined, 'frequency'),
            inp('amp', 'number', true, undefined, 'amplitude'),
          ],
          [],
        ),
      ],
      noiseWaves: [
        wave('sc-intermediate-03', 1, 'north', 'number', 14),
        wave('sc-intermediate-03', 2, 'south', 'number', 12),
      ],
      expectedBindings: [
        inputBinding('channelFrequency', 'freq'),
        inputBinding('signalAmplitude', 'amp'),
      ],
      stationHealth: 100,
    },
  },

  // Level 10 — Bidirectional Link (Model inputs)
  {
    levelId: 'sc-intermediate-04',
    gameId: 'signal-corps',
    tier: DifficultyTier.Intermediate,
    order: 4,
    title: 'Bidirectional Link',
    conceptIntroduced: 'Model inputs',
    description: 'Two-way binding with model() — tower reads and writes the same channel.',
    data: {
      gridSize: { rows: 8, cols: 8 },
      towerPlacements: [
        tower('sc-intermediate-04', 1, 4, 4,
          [inp('syncValue', 'number', true)],
          [out('syncValueChange', 'number')],
        ),
      ],
      noiseWaves: [
        wave('sc-intermediate-04', 1, 'east', 'number', 18),
      ],
      expectedBindings: [
        inputBinding('sharedCounter', 'syncValue'),
        outputBinding('onSyncValueChange', 'syncValueChange'),
      ],
      stationHealth: 100,
    },
  },

  // Level 11 — Signal Relay (Cascading towers)
  {
    levelId: 'sc-intermediate-05',
    gameId: 'signal-corps',
    tier: DifficultyTier.Intermediate,
    order: 5,
    title: 'Signal Relay',
    conceptIntroduced: 'Cascading towers',
    description: 'Tower A output feeds Tower B input via parent mediation.',
    data: {
      gridSize: { rows: 8, cols: 8 },
      towerPlacements: [
        tower('sc-intermediate-05', 1, 2, 1,
          [inp('rawSignal', 'string', true)],
          [out('processedSignal', 'string')],
        ),
        tower('sc-intermediate-05', 2, 5, 6,
          [inp('relayedSignal', 'string', true)],
          [out('relayConfirm', 'boolean')],
        ),
      ],
      noiseWaves: [
        wave('sc-intermediate-05', 1, 'north', 'string', 16),
        wave('sc-intermediate-05', 2, 'south', 'boolean', 12),
      ],
      expectedBindings: [
        inputBinding('incomingData', 'rawSignal'),
        outputBinding('onProcessed', 'processedSignal'),
        inputBinding('processedData', 'relayedSignal'),
        outputBinding('onRelayConfirm', 'relayConfirm'),
      ],
      stationHealth: 120,
    },
  },

  // Level 12 — Mixed Array (Mixed challenge)
  {
    levelId: 'sc-intermediate-06',
    gameId: 'signal-corps',
    tier: DifficultyTier.Intermediate,
    order: 6,
    title: 'Mixed Array',
    conceptIntroduced: 'Mixed challenge',
    description: '5 towers with all input/output patterns combined.',
    data: {
      gridSize: { rows: 8, cols: 8 },
      towerPlacements: [
        tower('sc-intermediate-06', 1, 0, 4,
          [inp('shieldFreq', 'number', true)],
          [],
        ),
        tower('sc-intermediate-06', 2, 2, 0,
          [],
          [out('scanResult', 'string')],
        ),
        tower('sc-intermediate-06', 3, 4, 7,
          [inp('weaponPower', 'number', true, 'numberAttribute')],
          [out('fireEvent', 'boolean')],
        ),
        tower('sc-intermediate-06', 4, 6, 2,
          [inp('commChannel', 'string', false, undefined, 'channel')],
          [],
        ),
        tower('sc-intermediate-06', 5, 7, 5,
          [inp('syncLevel', 'number', true)],
          [out('syncLevelChange', 'number')],
        ),
      ],
      noiseWaves: [
        wave('sc-intermediate-06', 1, 'north', 'number', 14),
        wave('sc-intermediate-06', 2, 'west', 'string', 12),
        wave('sc-intermediate-06', 3, 'east', 'boolean', 16),
      ],
      expectedBindings: [
        inputBinding('mainFrequency', 'shieldFreq'),
        outputBinding('onScan', 'scanResult'),
        inputBinding('weaponCharge', 'weaponPower'),
        outputBinding('onFire', 'fireEvent'),
        inputBinding('radioChannel', 'commChannel'),
        inputBinding('currentLevel', 'syncLevel'),
        outputBinding('onSyncChange', 'syncLevelChange'),
      ],
      stationHealth: 150,
    },
  },

  // =========================================================================
  // ADVANCED TIER (Levels 13-17)
  // =========================================================================

  // Level 13 — Mandatory Ports (Required inputs)
  {
    levelId: 'sc-advanced-01',
    gameId: 'signal-corps',
    tier: DifficultyTier.Advanced,
    order: 1,
    title: 'Mandatory Ports',
    conceptIntroduced: 'Required inputs',
    description: 'All tower inputs use input.required<T>() — tower cannot activate without them.',
    data: {
      gridSize: { rows: 10, cols: 10 },
      towerPlacements: [
        tower('sc-advanced-01', 1, 2, 3,
          [
            inp('targetLock', 'number', true),
            inp('firingMode', 'string', true),
          ],
          [out('lockConfirm', 'boolean')],
        ),
        tower('sc-advanced-01', 2, 7, 6,
          [
            inp('shieldType', 'string', true),
            inp('shieldRadius', 'number', true),
          ],
          [],
        ),
      ],
      noiseWaves: [
        wave('sc-advanced-01', 1, 'north', 'number', 18),
        wave('sc-advanced-01', 2, 'east', 'string', 16),
        wave('sc-advanced-01', 3, 'south', 'boolean', 14),
      ],
      expectedBindings: [
        inputBinding('aimTarget', 'targetLock'),
        inputBinding('selectedMode', 'firingMode'),
        outputBinding('onLockConfirm', 'lockConfirm'),
        inputBinding('activeShield', 'shieldType'),
        inputBinding('coverArea', 'shieldRadius'),
      ],
      stationHealth: 100,
    },
  },

  // Level 14 — Data Matrix (Complex types)
  {
    levelId: 'sc-advanced-02',
    gameId: 'signal-corps',
    tier: DifficultyTier.Advanced,
    order: 2,
    title: 'Data Matrix',
    conceptIntroduced: 'Complex types',
    description: 'Object and array input types for complex data payloads.',
    data: {
      gridSize: { rows: 10, cols: 10 },
      towerPlacements: [
        tower('sc-advanced-02', 1, 3, 2,
          [
            inp('coordinates', 'object', true),
            inp('targetList', 'string[]', true),
          ],
          [out('analysisResult', 'object')],
        ),
        tower('sc-advanced-02', 2, 6, 8,
          [inp('sensorReadings', 'number[]', true)],
          [out('processedData', 'number[]')],
        ),
      ],
      noiseWaves: [
        wave('sc-advanced-02', 1, 'west', 'object', 20),
        wave('sc-advanced-02', 2, 'north', 'string[]', 18),
        wave('sc-advanced-02', 3, 'east', 'number[]', 16),
      ],
      expectedBindings: [
        inputBinding('gridCoords', 'coordinates'),
        inputBinding('enemyTargets', 'targetList'),
        outputBinding('onAnalysis', 'analysisResult'),
        inputBinding('rawReadings', 'sensorReadings'),
        outputBinding('onProcessed', 'processedData'),
      ],
      stationHealth: 120,
    },
  },

  // Level 15 — Event Forge (Output patterns)
  {
    levelId: 'sc-advanced-03',
    gameId: 'signal-corps',
    tier: DifficultyTier.Advanced,
    order: 3,
    title: 'Event Forge',
    conceptIntroduced: 'Output patterns',
    description: 'Multiple output() function patterns with varied payload types.',
    data: {
      gridSize: { rows: 10, cols: 10 },
      towerPlacements: [
        tower('sc-advanced-03', 1, 1, 5,
          [inp('triggerMode', 'string', true)],
          [
            out('systemAlert', 'string'),
            out('damageValue', 'number'),
            out('criticalFlag', 'boolean'),
          ],
        ),
        tower('sc-advanced-03', 2, 8, 3,
          [inp('monitorId', 'number', true)],
          [
            out('statusReport', 'string'),
            out('healthCheck', 'boolean'),
          ],
        ),
      ],
      noiseWaves: [
        wave('sc-advanced-03', 1, 'north', 'string', 18),
        wave('sc-advanced-03', 2, 'south', 'number', 20),
        wave('sc-advanced-03', 3, 'west', 'boolean', 16),
      ],
      expectedBindings: [
        inputBinding('activeTrigger', 'triggerMode'),
        outputBinding('onSystemAlert', 'systemAlert'),
        outputBinding('onDamage', 'damageValue'),
        outputBinding('onCritical', 'criticalFlag'),
        inputBinding('activeMonitor', 'monitorId'),
        outputBinding('onStatusReport', 'statusReport'),
        outputBinding('onHealthCheck', 'healthCheck'),
      ],
      stationHealth: 150,
    },
  },

  // Level 16 — Deep Relay (Parent-child chains)
  {
    levelId: 'sc-advanced-04',
    gameId: 'signal-corps',
    tier: DifficultyTier.Advanced,
    order: 4,
    title: 'Deep Relay',
    conceptIntroduced: 'Parent-child chains',
    description: '3-level deep nesting with data passing through parent mediation.',
    data: {
      gridSize: { rows: 10, cols: 10 },
      towerPlacements: [
        tower('sc-advanced-04', 1, 1, 2,
          [inp('outerSignal', 'number', true)],
          [out('outerEmit', 'number')],
        ),
        tower('sc-advanced-04', 2, 4, 5,
          [inp('middleSignal', 'number', true)],
          [out('middleEmit', 'string')],
        ),
        tower('sc-advanced-04', 3, 8, 8,
          [inp('innerSignal', 'string', true)],
          [out('innerEmit', 'boolean')],
        ),
      ],
      noiseWaves: [
        wave('sc-advanced-04', 1, 'north', 'number', 22),
        wave('sc-advanced-04', 2, 'east', 'string', 18),
        wave('sc-advanced-04', 3, 'south', 'boolean', 20),
      ],
      expectedBindings: [
        inputBinding('rootData', 'outerSignal'),
        outputBinding('onOuterEmit', 'outerEmit'),
        inputBinding('relayedOuter', 'middleSignal'),
        outputBinding('onMiddleEmit', 'middleEmit'),
        inputBinding('relayedMiddle', 'innerSignal'),
        outputBinding('onInnerEmit', 'innerEmit'),
      ],
      stationHealth: 180,
    },
  },

  // Level 17 — Efficient Grid (Defense optimization)
  {
    levelId: 'sc-advanced-05',
    gameId: 'signal-corps',
    tier: DifficultyTier.Advanced,
    order: 5,
    title: 'Efficient Grid',
    conceptIntroduced: 'Defense optimization',
    description: 'Minimize total bindings while maintaining full defense coverage.',
    data: {
      gridSize: { rows: 10, cols: 10 },
      towerPlacements: [
        tower('sc-advanced-05', 1, 0, 5,
          [inp('northGuard', 'number', true)],
          [out('northAlert', 'string')],
        ),
        tower('sc-advanced-05', 2, 5, 0,
          [inp('westGuard', 'string', true)],
          [out('westAlert', 'boolean')],
        ),
        tower('sc-advanced-05', 3, 9, 5,
          [inp('southGuard', 'boolean', true)],
          [out('southAlert', 'number')],
        ),
        tower('sc-advanced-05', 4, 5, 9,
          [inp('eastGuard', 'number', true)],
          [],
        ),
      ],
      noiseWaves: [
        wave('sc-advanced-05', 1, 'north', 'number', 20),
        wave('sc-advanced-05', 2, 'west', 'string', 18),
        wave('sc-advanced-05', 3, 'south', 'boolean', 22),
        wave('sc-advanced-05', 4, 'east', 'number', 16),
      ],
      expectedBindings: [
        inputBinding('northPower', 'northGuard'),
        outputBinding('onNorthAlert', 'northAlert'),
        inputBinding('westPower', 'westGuard'),
        outputBinding('onWestAlert', 'westAlert'),
        inputBinding('southPower', 'southGuard'),
        outputBinding('onSouthAlert', 'southAlert'),
        inputBinding('eastPower', 'eastGuard'),
      ],
      stationHealth: 200,
    },
  },

  // =========================================================================
  // BOSS TIER (Level 18)
  // =========================================================================

  // Level 18 — Full Array Defense (8 towers, 3 nesting levels)
  {
    levelId: 'sc-boss-01',
    gameId: 'signal-corps',
    tier: DifficultyTier.Boss,
    order: 1,
    title: 'Full Array Defense',
    conceptIntroduced: 'Full array defense',
    description: '8 towers across 3 nesting levels. Multiple noise wave types. 100% defense required.',
    parTime: 360,
    data: {
      gridSize: { rows: 12, cols: 12 },
      towerPlacements: [
        // Outer ring — 3 towers at cardinal positions
        tower('sc-boss-01', 1, 0, 6,
          [inp('northShield', 'number', true)],
          [out('northStatus', 'string')],
        ),
        tower('sc-boss-01', 2, 6, 0,
          [inp('westShield', 'string', true)],
          [out('westStatus', 'boolean')],
        ),
        tower('sc-boss-01', 3, 11, 6,
          [inp('southShield', 'boolean', true, 'booleanAttribute')],
          [out('southStatus', 'number')],
        ),
        // Middle ring — 3 towers relaying outer signals
        tower('sc-boss-01', 4, 3, 3,
          [inp('relayNorth', 'number', true, 'numberAttribute')],
          [out('relayNorthOut', 'number')],
        ),
        tower('sc-boss-01', 5, 3, 9,
          [inp('relayWest', 'string', true, undefined, 'westRelay')],
          [out('relayWestOut', 'string')],
        ),
        tower('sc-boss-01', 6, 9, 6,
          [inp('relaySouth', 'boolean', true)],
          [out('relaySouthOut', 'boolean')],
        ),
        // Inner core — 2 towers processing relayed data
        tower('sc-boss-01', 7, 5, 5,
          [
            inp('coreAlpha', 'number', true),
            inp('coreBeta', 'string', true),
          ],
          [out('coreResult', 'object')],
        ),
        tower('sc-boss-01', 8, 7, 7,
          [inp('coreGamma', 'boolean', true)],
          [out('finalReport', 'string')],
        ),
      ],
      noiseWaves: [
        wave('sc-boss-01', 1, 'north', 'number', 25),
        wave('sc-boss-01', 2, 'west', 'string', 22),
        wave('sc-boss-01', 3, 'south', 'boolean', 20),
        wave('sc-boss-01', 4, 'east', 'number', 24),
        wave('sc-boss-01', 5, 'north', 'string', 18),
        wave('sc-boss-01', 6, 'south', 'object', 28),
      ],
      expectedBindings: [
        // Outer ring bindings (parent -> outer towers)
        inputBinding('mainNorthPower', 'northShield'),
        outputBinding('onNorthStatus', 'northStatus'),
        inputBinding('mainWestPower', 'westShield'),
        outputBinding('onWestStatus', 'westStatus'),
        inputBinding('mainSouthPower', 'southShield'),
        outputBinding('onSouthStatus', 'southStatus'),
        // Middle ring bindings (parent mediates outer -> middle)
        inputBinding('northRelayData', 'relayNorth'),
        outputBinding('onRelayNorthOut', 'relayNorthOut'),
        inputBinding('westRelayData', 'relayWest'),
        outputBinding('onRelayWestOut', 'relayWestOut'),
        inputBinding('southRelayData', 'relaySouth'),
        outputBinding('onRelaySouthOut', 'relaySouthOut'),
        // Inner core bindings (parent mediates middle -> core)
        inputBinding('alphaFeed', 'coreAlpha'),
        inputBinding('betaFeed', 'coreBeta'),
        outputBinding('onCoreResult', 'coreResult'),
        inputBinding('gammaFeed', 'coreGamma'),
        outputBinding('onFinalReport', 'finalReport'),
      ],
      stationHealth: 250,
    },
  },
];

// ---------------------------------------------------------------------------
// Level Pack
// ---------------------------------------------------------------------------

export const SIGNAL_CORPS_LEVEL_PACK: LevelPack = {
  gameId: 'signal-corps',
  levels: SIGNAL_CORPS_LEVELS,
};
