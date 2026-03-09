// ---------------------------------------------------------------------------
// Canonical domain model types for Signal Corps minigame
// ---------------------------------------------------------------------------

/** The 4 approach directions noise waves can come from on the defense grid. */
export type ApproachDirection = 'north' | 'south' | 'east' | 'west';

/** Angular input transform types supported by tower inputs. */
export type InputTransform = 'numberAttribute' | 'booleanAttribute' | 'custom';

/** An input port on a signal tower. */
export interface TowerInput {
  readonly name: string;
  readonly type: string;
  readonly required: boolean;
  readonly transform?: InputTransform;
  readonly aliasName?: string;
}

/** An output port on a signal tower. */
export interface TowerOutput {
  readonly name: string;
  readonly payloadType: string;
}

/** Configuration defining a tower's input and output ports. */
export interface TowerConfig {
  readonly inputs: readonly TowerInput[];
  readonly outputs: readonly TowerOutput[];
}

/** A noise wave that approaches the defense grid. */
export interface NoiseWave {
  readonly waveId: string;
  readonly approachDirection: ApproachDirection;
  readonly typeSignature: string;
  readonly damage: number;
}

/** A position on the defense grid. */
export interface GridPosition {
  readonly row: number;
  readonly col: number;
}

/** The dimensions of the defense grid. */
export interface GridSize {
  readonly rows: number;
  readonly cols: number;
}

/** A tower placed on the defense grid with its configuration. */
export interface TowerPlacement {
  readonly towerId: string;
  readonly position: GridPosition;
  readonly config: TowerConfig;
}

/** A binding between a parent component and a tower port. */
export interface ParentBinding {
  readonly bindingType: 'input' | 'output';
  readonly parentProperty?: string;
  readonly parentHandler?: string;
  readonly towerPortName: string;
}

/** Game-specific level data for Signal Corps. */
export interface SignalCorpsLevelData {
  readonly gridSize: GridSize;
  readonly towerPlacements: readonly TowerPlacement[];
  readonly noiseWaves: readonly NoiseWave[];
  readonly expectedBindings: readonly ParentBinding[];
  readonly stationHealth: number;
}

/** Configuration controlling wave spawning behavior. */
export interface WaveConfig {
  readonly signalSpeed: number;       // normalized distance per second (default ~0.33 = 3s to reach station)
  readonly spawnIntervalMs: number;   // ms between signal spawns within a wave (default 500)
}

/** A runtime noise signal instance spawned from a NoiseWave definition. */
export interface NoiseSignal {
  readonly id: string;                // unique identifier (waveId + signal index)
  readonly waveIndex: number;         // which wave this signal belongs to
  readonly typeSignature: string;     // matches NoiseWave.typeSignature
  readonly approachDirection: ApproachDirection;
  readonly damage: number;            // damage dealt if unblocked
  readonly position: number;          // 0.0 (edge) to 1.0+ (reached station)
  readonly resolved: boolean;         // true after blocking evaluation or damage applied
}

/** Result of evaluating which signals are blocked by towers. */
export interface BlockingResult {
  readonly blocked: readonly { signal: NoiseSignal; towerId: string }[];
  readonly unblocked: readonly NoiseSignal[];
  readonly allResolved: boolean;      // true when no active unresolved signals remain
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Color mapping for tower port types, using Nexus Station theme colors. */
export const PORT_TYPE_COLORS: Readonly<Record<'input' | 'output', string>> = {
  input: '#3B82F6',   // Reactor Blue
  output: '#F97316',  // Alert Orange
};

// ---------------------------------------------------------------------------
// Utility functions
// ---------------------------------------------------------------------------

const VALID_DIRECTIONS: readonly string[] = ['north', 'south', 'east', 'west'];

/** Type guard that returns true when the given string is a valid ApproachDirection. */
export function isValidApproachDirection(value: string): value is ApproachDirection {
  return VALID_DIRECTIONS.includes(value);
}

/**
 * Returns true when the config has at least one input or output, AND every input
 * has a non-empty name and type, AND every output has a non-empty name and payloadType.
 */
export function isTowerConfigComplete(config: TowerConfig): boolean {
  if (config.inputs.length === 0 && config.outputs.length === 0) return false;

  const allInputsValid = config.inputs.every(i => i.name.length > 0 && i.type.length > 0);
  const allOutputsValid = config.outputs.every(o => o.name.length > 0 && o.payloadType.length > 0);

  return allInputsValid && allOutputsValid;
}

/**
 * Returns true when the tower placement's config declares an input or output whose
 * type/payloadType matches the wave's typeSignature. Returns false for empty typeSignature.
 */
export function canNoiseWaveBeBlocked(wave: NoiseWave, placement: TowerPlacement): boolean {
  if (wave.typeSignature === '') return false;

  const inputMatch = placement.config.inputs.some(i => i.type === wave.typeSignature);
  const outputMatch = placement.config.outputs.some(o => o.payloadType === wave.typeSignature);

  return inputMatch || outputMatch;
}
