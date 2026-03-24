import { signal, type Signal } from '@angular/core';
import { MinigameEngine, type ActionResult } from '../../../core/minigame/minigame-engine';
import type { MinigameEngineConfig } from '../../../core/minigame/minigame-engine';
import { MinigameStatus } from '../../../core/minigame/minigame.types';
import type {
  DataRelayLevelData,
  PipeBlock,
  PipeDefinition,
  PipeName,
  RuntimeStream,
  StreamResult,
  TestDataItem,
  TransformRunResult,
  CustomPipeSpec,
} from './data-relay.types';
import { applyPipeTransform } from './pipe-transforms';

// ---------------------------------------------------------------------------
// Action types
// ---------------------------------------------------------------------------

export interface PlacePipeAction {
  readonly type: 'place-pipe';
  readonly streamId: string;
  readonly pipeDefinitionId: string;
  readonly pipeBlockId: string;
  readonly position: number;
}

export interface RemovePipeAction {
  readonly type: 'remove-pipe';
  readonly streamId: string;
  readonly pipeBlockId: string;
}

export interface ConfigurePipeAction {
  readonly type: 'configure-pipe';
  readonly streamId: string;
  readonly pipeBlockId: string;
  readonly params: readonly string[];
}

export interface RegisterCustomPipeAction {
  readonly type: 'register-custom-pipe';
  readonly spec: CustomPipeSpec;
}

export type DataRelayAction =
  | PlacePipeAction
  | RemovePipeAction
  | ConfigurePipeAction
  | RegisterCustomPipeAction;

// ---------------------------------------------------------------------------
// Type guards
// ---------------------------------------------------------------------------

function isPlacePipeAction(action: unknown): action is PlacePipeAction {
  return (
    typeof action === 'object' &&
    action !== null &&
    (action as PlacePipeAction).type === 'place-pipe' &&
    typeof (action as PlacePipeAction).streamId === 'string' &&
    typeof (action as PlacePipeAction).pipeDefinitionId === 'string' &&
    typeof (action as PlacePipeAction).pipeBlockId === 'string' &&
    typeof (action as PlacePipeAction).position === 'number'
  );
}

function isRemovePipeAction(action: unknown): action is RemovePipeAction {
  return (
    typeof action === 'object' &&
    action !== null &&
    (action as RemovePipeAction).type === 'remove-pipe' &&
    typeof (action as RemovePipeAction).streamId === 'string' &&
    typeof (action as RemovePipeAction).pipeBlockId === 'string'
  );
}

function isConfigurePipeAction(action: unknown): action is ConfigurePipeAction {
  return (
    typeof action === 'object' &&
    action !== null &&
    (action as ConfigurePipeAction).type === 'configure-pipe' &&
    typeof (action as ConfigurePipeAction).streamId === 'string' &&
    typeof (action as ConfigurePipeAction).pipeBlockId === 'string' &&
    Array.isArray((action as ConfigurePipeAction).params)
  );
}

function isRegisterCustomPipeAction(action: unknown): action is RegisterCustomPipeAction {
  return (
    typeof action === 'object' &&
    action !== null &&
    (action as RegisterCustomPipeAction).type === 'register-custom-pipe' &&
    typeof (action as RegisterCustomPipeAction).spec === 'object' &&
    (action as RegisterCustomPipeAction).spec !== null
  );
}

// ---------------------------------------------------------------------------
// Service interface
// ---------------------------------------------------------------------------

export interface DataRelayTransformService {
  applyPipe(input: unknown, pipeType: PipeName, params: readonly string[]): string;
  applyChain(input: unknown, pipes: readonly PipeBlock[]): string;
  compareOutput(actual: string, expected: string): boolean;
  reset?(): void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const PERFECT_SCORE_MULTIPLIER = 1.0;
export const SECOND_ATTEMPT_MULTIPLIER = 0.4;
export const MIN_ATTEMPT_MULTIPLIER = 0.2;

const INVALID_NO_CHANGE: ActionResult = { valid: false, scoreChange: 0, livesChange: 0 };
const VALID_NO_CHANGE: ActionResult = { valid: true, scoreChange: 0, livesChange: 0 };

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export class DataRelayEngine extends MinigameEngine<DataRelayLevelData> {
  // --- Private writable signals ---
  private readonly _streams = signal<readonly RuntimeStream[]>([]);
  private readonly _availablePipes = signal<readonly PipeDefinition[]>([]);
  private readonly _testData = signal<readonly TestDataItem[]>([]);
  private readonly _customPipeSpecs = signal<readonly CustomPipeSpec[]>([]);
  private readonly _runCount = signal(0);
  private readonly _transformResult = signal<TransformRunResult | null>(null);

  // --- Private state ---
  private readonly _transformService: DataRelayTransformService | undefined;

  // --- Public read-only signals ---
  readonly streams: Signal<readonly RuntimeStream[]> = this._streams.asReadonly();
  readonly availablePipes: Signal<readonly PipeDefinition[]> = this._availablePipes.asReadonly();
  readonly transformResult: Signal<TransformRunResult | null> = this._transformResult.asReadonly();
  readonly runCount: Signal<number> = this._runCount.asReadonly();

  constructor(config?: Partial<MinigameEngineConfig>, transformService?: DataRelayTransformService) {
    super(config);
    this._transformService = transformService;
  }

  // --- Lifecycle hooks ---

  protected onLevelLoad(data: DataRelayLevelData): void {
    const runtimeStreams: RuntimeStream[] = data.streams.map(s => {
      const target = data.targetOutputs.find(t => t.streamId === s.id);
      return {
        streamId: s.id,
        rawInput: s.rawInput,
        requiredOutput: target?.expectedOutput ?? '',
        placedPipes: [],
      };
    });

    this._streams.set(runtimeStreams);
    this._availablePipes.set(data.availablePipes);
    this._testData.set(data.testData);
    this._customPipeSpecs.set([]);
    this._runCount.set(0);
    this._transformResult.set(null);

    this._transformService?.reset?.();
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  protected onStart(): void {}

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  protected onComplete(): void {}

  // --- Action validation ---

  protected validateAction(action: unknown): ActionResult {
    if (isPlacePipeAction(action)) return this.handlePlacePipe(action);
    if (isRemovePipeAction(action)) return this.handleRemovePipe(action);
    if (isConfigurePipeAction(action)) return this.handleConfigurePipe(action);
    if (isRegisterCustomPipeAction(action)) return this.handleRegisterCustomPipe(action);
    return INVALID_NO_CHANGE;
  }

  // --- Public transform method ---

  runTransform(): TransformRunResult | null {
    if (this.status() !== MinigameStatus.Playing) return null;

    this._runCount.update(c => c + 1);
    const streams = this._streams();
    const testData = this._testData();
    const specs = this._customPipeSpecs();

    const streamResults: StreamResult[] = streams.map(stream =>
      this.evaluateStream(stream, specs),
    );

    const testResults: TransformRunResult['testResults'] = testData.map(td => {
      const stream = streams.find(s => s.streamId === td.streamId);
      const actual = stream
        ? this.applyPipeChain(td.input, stream.placedPipes, specs)
        : String(td.input);
      return {
        streamId: td.streamId,
        input: td.input,
        expected: td.expectedOutput,
        actual,
        correct: actual === td.expectedOutput,
      };
    });

    const allCorrect = streamResults.every(r => r.isCorrect);
    const failedTestCount = testResults.filter(r => !r.correct).length;

    const result: TransformRunResult = { streamResults, testResults, allCorrect, failedTestCount };
    this._transformResult.set(result);

    if (failedTestCount > 2) {
      this.fail();
    } else if (allCorrect) {
      const score = this.calculateScore();
      this.addScore(score);
      this.complete();
    }

    return result;
  }

  // --- Private action handlers ---

  private handlePlacePipe(action: PlacePipeAction): ActionResult {
    const streams = this._streams();
    const streamIndex = streams.findIndex(s => s.streamId === action.streamId);
    if (streamIndex === -1) return INVALID_NO_CHANGE;

    const pipeDef = this._availablePipes().find(p => p.id === action.pipeDefinitionId);
    if (!pipeDef) return INVALID_NO_CHANGE;

    const stream = streams[streamIndex];
    const duplicate = stream.placedPipes.some(p => p.id === action.pipeBlockId);
    if (duplicate) return INVALID_NO_CHANGE;

    const newBlock: PipeBlock = {
      id: action.pipeBlockId,
      pipeType: pipeDef.pipeName,
      params: pipeDef.params ?? [],
      position: action.position,
    };

    this._streams.set(
      streams.map((s, i) =>
        i === streamIndex
          ? { ...s, placedPipes: [...s.placedPipes, newBlock] }
          : s,
      ),
    );
    return VALID_NO_CHANGE;
  }

  private handleRemovePipe(action: RemovePipeAction): ActionResult {
    const streams = this._streams();
    const streamIndex = streams.findIndex(s => s.streamId === action.streamId);
    if (streamIndex === -1) return INVALID_NO_CHANGE;

    const stream = streams[streamIndex];
    const pipeIndex = stream.placedPipes.findIndex(p => p.id === action.pipeBlockId);
    if (pipeIndex === -1) return INVALID_NO_CHANGE;

    this._streams.set(
      streams.map((s, i) =>
        i === streamIndex
          ? { ...s, placedPipes: s.placedPipes.filter((_, j) => j !== pipeIndex) }
          : s,
      ),
    );
    return VALID_NO_CHANGE;
  }

  private handleConfigurePipe(action: ConfigurePipeAction): ActionResult {
    const streams = this._streams();
    const streamIndex = streams.findIndex(s => s.streamId === action.streamId);
    if (streamIndex === -1) return INVALID_NO_CHANGE;

    const stream = streams[streamIndex];
    const pipeIndex = stream.placedPipes.findIndex(p => p.id === action.pipeBlockId);
    if (pipeIndex === -1) return INVALID_NO_CHANGE;

    this._streams.set(
      streams.map((s, i) =>
        i === streamIndex
          ? {
              ...s,
              placedPipes: s.placedPipes.map((p, j) =>
                j === pipeIndex ? { ...p, params: action.params } : p,
              ),
            }
          : s,
      ),
    );
    return VALID_NO_CHANGE;
  }

  private handleRegisterCustomPipe(action: RegisterCustomPipeAction): ActionResult {
    const specs = this._customPipeSpecs();
    const existing = specs.findIndex(s => s.name === action.spec.name);
    if (existing >= 0) {
      this._customPipeSpecs.set(
        specs.map((s, i) => (i === existing ? action.spec : s)),
      );
    } else {
      this._customPipeSpecs.set([...specs, action.spec]);
    }
    return VALID_NO_CHANGE;
  }

  // --- Stream evaluation ---

  private evaluateStream(stream: RuntimeStream, specs: readonly CustomPipeSpec[]): StreamResult {
    const actualOutput = this.applyPipeChain(stream.rawInput, stream.placedPipes, specs);
    const isCorrect = this._transformService
      ? this._transformService.compareOutput(actualOutput, stream.requiredOutput)
      : actualOutput === stream.requiredOutput;

    return { streamId: stream.streamId, actualOutput, isCorrect };
  }

  private applyPipeChain(
    input: unknown,
    pipes: readonly PipeBlock[],
    specs: readonly CustomPipeSpec[],
  ): string {
    if (this._transformService) {
      return this._transformService.applyChain(input, pipes);
    }

    if (pipes.length === 0) return String(input);

    const sorted = [...pipes].sort((a, b) => a.position - b.position);
    let current: unknown = input;
    for (const pipe of sorted) {
      current = applyPipeTransform(current, pipe.pipeType, pipe.params, specs);
    }
    return String(current);
  }

  // --- Scoring ---

  private calculateScore(): number {
    const maxScore = this.config.maxScore;
    const count = this._runCount();

    if (count === 1) return Math.round(maxScore * PERFECT_SCORE_MULTIPLIER);
    if (count === 2) return Math.round(maxScore * SECOND_ATTEMPT_MULTIPLIER);
    return Math.round(maxScore * MIN_ATTEMPT_MULTIPLIER);
  }
}
