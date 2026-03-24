// ---------------------------------------------------------------------------
// DataRelayTransformServiceImpl — pipe transformation and stream evaluation
// ---------------------------------------------------------------------------
// NOT providedIn: 'root'. This service is scoped to the Data Relay
// component tree. Providing it locally ensures automatic cleanup on
// component destroy and prevents leaked state between minigame sessions.
// ---------------------------------------------------------------------------

import { Injectable } from '@angular/core';
import type {
  DataRelayTransformService,
} from './data-relay.engine';
import type {
  CustomPipeSpec,
  PipeBlock,
  PipeCategory,
  PipeDefinition,
  PipeName,
  RuntimeStream,
  StreamResult,
} from './data-relay.types';
import { applyPipeTransform } from './pipe-transforms';

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

@Injectable()
export class DataRelayTransformServiceImpl implements DataRelayTransformService {
  private _customPipeSpecs: CustomPipeSpec[] = [];
  private _availablePipes: PipeDefinition[] = [];

  // --- Interface methods ---

  applyPipe(input: unknown, pipeType: PipeName, params: readonly string[]): string {
    return applyPipeTransform(input, pipeType, params, this._customPipeSpecs);
  }

  applyChain(input: unknown, pipes: readonly PipeBlock[]): string {
    if (pipes.length === 0) return String(input);

    const sorted = [...pipes].sort((a, b) => a.position - b.position);
    let current: unknown = input;
    for (const pipe of sorted) {
      current = this.applyPipe(current, pipe.pipeType, pipe.params);
    }
    return String(current);
  }

  compareOutput(actual: string, expected: string): boolean {
    return actual === expected;
  }

  reset(): void {
    this._customPipeSpecs = [];
    this._availablePipes = [];
  }

  // --- Additional public methods ---

  evaluateStreams(streams: readonly RuntimeStream[]): StreamResult[] {
    return streams.map(stream => {
      const actualOutput = this.applyChain(stream.rawInput, stream.placedPipes);
      const isCorrect = this.compareOutput(actualOutput, stream.requiredOutput);
      return { streamId: stream.streamId, actualOutput, isCorrect };
    });
  }

  getAvailablePipes(category?: PipeCategory): PipeDefinition[] {
    if (category === undefined) {
      return [...this._availablePipes];
    }
    return this._availablePipes.filter(p => p.category === category);
  }

  loadPipes(pipes: readonly PipeDefinition[]): void {
    this._availablePipes = [...pipes];
  }

  registerCustomPipe(spec: CustomPipeSpec): void {
    const existingIndex = this._customPipeSpecs.findIndex(s => s.name === spec.name);
    if (existingIndex >= 0) {
      this._customPipeSpecs[existingIndex] = spec;
    } else {
      this._customPipeSpecs.push(spec);
    }
  }
}
