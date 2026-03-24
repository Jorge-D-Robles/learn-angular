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

// ---------------------------------------------------------------------------
// Runtime types (engine-facing, complementary to level data above)
// ---------------------------------------------------------------------------

/** Valid built-in pipe type names for PipeBlock placement.
 *  Matches the ticket-specified set. Custom pipe names pass through
 *  the open PipeName union without needing isValidPipeType validation. */
export const VALID_PIPE_TYPES = [
  'uppercase', 'lowercase', 'date', 'decimal',
  'currency', 'percent', 'slice', 'custom',
] as const;

/** A pipe block placed by the player into a data stream. */
export interface PipeBlock {
  readonly id: string;
  readonly pipeType: PipeName;
  readonly params: readonly string[];
  readonly position: number;
}

/** A runtime data stream with placed pipes and evaluation state. */
export interface RuntimeStream {
  readonly streamId: string;
  readonly rawInput: unknown;
  readonly requiredOutput: string;
  readonly placedPipes: readonly PipeBlock[];
}

/** A test data pair for runtime pipeline verification. */
export interface TestDataPair {
  readonly input: unknown;
  readonly expectedOutput: string;
}

/** Pureness of a custom pipe (pure recalculates only on input change, impure on every CD cycle). */
export type PipePureness = 'pure' | 'impure';

/** Specification for a custom pipe in advanced levels. */
export interface CustomPipeSpec {
  readonly name: string;
  readonly transformFn: string;
  readonly pureness: PipePureness;
}

/** Result of evaluating a single data stream's pipeline. */
export interface StreamResult {
  readonly streamId: string;
  readonly actualOutput: string;
  readonly isCorrect: boolean;
}

/** Aggregate result of running all streams through their pipe chains. */
export interface TransformRunResult {
  readonly streamResults: readonly StreamResult[];
  readonly testResults: readonly { streamId: string; input: unknown; expected: string; actual: string; correct: boolean }[];
  readonly allCorrect: boolean;
  readonly failedTestCount: number;
}

// ---------------------------------------------------------------------------
// Utility functions
// ---------------------------------------------------------------------------

/** Type guard: returns true when the given string is a recognized built-in pipe type. */
export function isValidPipeType(value: string): value is typeof VALID_PIPE_TYPES[number] {
  return (VALID_PIPE_TYPES as readonly string[]).includes(value);
}

/** Type guard: returns true when the value is a valid TestDataPair shape. */
export function isValidTestDataPair(value: unknown): value is TestDataPair {
  if (value === null || typeof value !== 'object') return false;
  const obj = value as Record<string, unknown>;
  return 'input' in obj && 'expectedOutput' in obj && typeof obj['expectedOutput'] === 'string';
}
