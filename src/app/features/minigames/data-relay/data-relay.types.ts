// ---------------------------------------------------------------------------
// Canonical domain model types for Data Relay minigame
// ---------------------------------------------------------------------------

/** Category for organizing pipes in the toolbox. */
export type PipeCategory = 'text' | 'number' | 'date' | 'custom';

/** Built-in Angular pipe names used across Data Relay levels. */
export type BuiltInPipeName =
  | 'uppercase'
  | 'lowercase'
  | 'titlecase'
  | 'date'
  | 'decimal'
  | 'currency'
  | 'percent'
  | 'slice'
  | 'async';

/** Pipe name: built-in or custom string (open set for custom pipes). */
export type PipeName = BuiltInPipeName | (string & {});

/** A data stream flowing left-to-right on the board. */
export interface DataStream {
  readonly id: string;
  readonly name: string;
  readonly rawInput: string;
  /**
   * If true, rawInput represents a resolved async value (for AsyncPipe levels).
   * The engine treats this as the resolved value of an Observable/Promise.
   */
  readonly isAsync?: boolean;
}

/** A pipe block available in the player's toolbox. */
export interface PipeDefinition {
  readonly id: string;
  readonly pipeName: PipeName;
  readonly displayName: string;
  readonly category: PipeCategory;
  readonly params?: readonly string[];
  readonly isCustom?: boolean;
}

/** Expected output for a specific stream. */
export interface TargetOutput {
  readonly streamId: string;
  readonly expectedOutput: string;
  /** Pipe ids in order that must be applied to achieve the expected output. */
  readonly requiredPipes: readonly string[];
}

/** A test data pair for verifying the pipeline. */
export interface TestDataItem {
  readonly id: string;
  readonly streamId: string;
  readonly input: string;
  readonly expectedOutput: string;
}

/** Game-specific level data for Data Relay. */
export interface DataRelayLevelData {
  readonly streams: readonly DataStream[];
  readonly availablePipes: readonly PipeDefinition[];
  readonly targetOutputs: readonly TargetOutput[];
  readonly testData: readonly TestDataItem[];
}
