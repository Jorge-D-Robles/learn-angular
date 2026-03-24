// ---------------------------------------------------------------------------
// Integration tests: DataRelayTransformServiceImpl with real level data
// ---------------------------------------------------------------------------
// Exercises the transform service against REAL level data from
// DATA_RELAY_LEVELS — catching data authoring bugs and validating that the
// service correctly handles realistic pipe chains and multi-stream scenarios.
// ---------------------------------------------------------------------------

import { DataRelayTransformServiceImpl } from './data-relay-transform.service';
import { DATA_RELAY_LEVELS } from '../../../data/levels/data-relay.data';
import type {
  PipeBlock,
  RuntimeStream,
  DataRelayLevelData,
  CustomPipeSpec,
} from './data-relay.types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createService(): DataRelayTransformServiceImpl {
  return new DataRelayTransformServiceImpl();
}

function getLevelData(levelId: string): DataRelayLevelData {
  return DATA_RELAY_LEVELS.find(l => l.levelId === levelId)!.data;
}

let blockId = 0;
function makePipeBlock(overrides?: Partial<PipeBlock>): PipeBlock {
  return {
    id: `block-${++blockId}`,
    pipeType: 'uppercase',
    params: [],
    position: 0,
    ...overrides,
  };
}

function makeRuntimeStream(overrides?: Partial<RuntimeStream>): RuntimeStream {
  return {
    streamId: 'stream-1',
    rawInput: 'hello',
    requiredOutput: 'HELLO',
    placedPipes: [],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('DataRelayTransformService integration (real level data)', () => {
  let service: DataRelayTransformServiceImpl;

  beforeEach(() => {
    blockId = 0;
    service = createService();
  });

  // --- Test 1: Single uppercase pipe transforms "commander shepard" to "COMMANDER SHEPARD" (Level 1) ---
  it('single uppercase pipe transforms input to all-caps (Level 1)', () => {
    const data = getLevelData('dr-basic-01');
    const stream = makeRuntimeStream({
      streamId: data.streams[0].id,
      rawInput: data.streams[0].rawInput,
      requiredOutput: data.targetOutputs[0].expectedOutput,
      placedPipes: [
        makePipeBlock({ pipeType: 'uppercase', position: 0 }),
      ],
    });

    const results = service.evaluateStreams([stream]);
    expect(results.length).toBe(1);
    expect(results[0].actualOutput).toBe('COMMANDER SHEPARD');
    expect(results[0].isCorrect).toBe(true);
  });

  // --- Test 2: Date pipe formats ISO string with mediumDate format (Level 3) ---
  it('date pipe formats ISO string with mediumDate format (Level 3)', () => {
    const data = getLevelData('dr-basic-03');
    const stream = makeRuntimeStream({
      streamId: data.streams[0].id,
      rawInput: data.streams[0].rawInput,
      requiredOutput: data.targetOutputs[0].expectedOutput,
      placedPipes: [
        makePipeBlock({ pipeType: 'date', params: ['mediumDate'], position: 0 }),
      ],
    });

    const results = service.evaluateStreams([stream]);
    expect(results.length).toBe(1);
    expect(results[0].actualOutput).toBe('Mar 6, 2026');
    expect(results[0].isCorrect).toBe(true);
  });

  // --- Test 3: Pipe chain (uppercase | slice:0:5) produces correct output ---
  it('pipe chain (uppercase | slice:0:5) produces correct output', () => {
    const stream = makeRuntimeStream({
      streamId: 'chain-test',
      rawInput: 'hello world',
      requiredOutput: 'HELLO',
      placedPipes: [
        makePipeBlock({ pipeType: 'uppercase', position: 0 }),
        makePipeBlock({ pipeType: 'slice', params: ['0', '5'], position: 1 }),
      ],
    });

    const results = service.evaluateStreams([stream]);
    expect(results.length).toBe(1);
    expect(results[0].actualOutput).toBe('HELLO');
    expect(results[0].isCorrect).toBe(true);
  });

  // --- Test 4: Currency pipe with USD parameter produces formatted output (Level 5) ---
  it('currency pipe with USD parameter produces formatted output (Level 5)', () => {
    const data = getLevelData('dr-basic-05');
    const stream = makeRuntimeStream({
      streamId: data.streams[0].id,
      rawInput: data.streams[0].rawInput,
      requiredOutput: data.targetOutputs[0].expectedOutput,
      placedPipes: [
        makePipeBlock({ pipeType: 'currency', params: ['USD'], position: 0 }),
      ],
    });

    const results = service.evaluateStreams([stream]);
    expect(results.length).toBe(1);
    expect(results[0].actualOutput).toBe('$9,999.99');
    expect(results[0].isCorrect).toBe(true);
  });

  // --- Test 5: Multi-stream evaluation with all correct pipes (Level 6) ---
  it('multi-stream evaluation with all correct pipes (Level 6)', () => {
    const data = getLevelData('dr-basic-06');
    const streams: RuntimeStream[] = [
      makeRuntimeStream({
        streamId: data.streams[0].id,
        rawInput: data.streams[0].rawInput,
        requiredOutput: data.targetOutputs[0].expectedOutput,
        placedPipes: [
          makePipeBlock({ pipeType: 'uppercase', position: 0 }),
        ],
      }),
      makeRuntimeStream({
        streamId: data.streams[1].id,
        rawInput: data.streams[1].rawInput,
        requiredOutput: data.targetOutputs[1].expectedOutput,
        placedPipes: [
          makePipeBlock({ pipeType: 'date', params: ['mediumDate'], position: 0 }),
        ],
      }),
      makeRuntimeStream({
        streamId: data.streams[2].id,
        rawInput: data.streams[2].rawInput,
        requiredOutput: data.targetOutputs[2].expectedOutput,
        placedPipes: [
          makePipeBlock({ pipeType: 'decimal', params: ['1.1-1'], position: 0 }),
        ],
      }),
    ];

    const results = service.evaluateStreams(streams);
    expect(results.length).toBe(3);
    expect(results[0].isCorrect).toBe(true);
    expect(results[1].isCorrect).toBe(true);
    expect(results[2].isCorrect).toBe(true);

    expect(results[0].actualOutput).toBe('NEXUS STATION');
    expect(results[1].actualOutput).toBe('Jun 15, 2026');
    expect(results[2].actualOutput).toBe('372.8');
  });

  // --- Test 6: Stream with wrong pipe type fails output comparison ---
  it('stream with wrong pipe type fails output comparison', () => {
    const stream = makeRuntimeStream({
      streamId: 'wrong-pipe-test',
      rawInput: 'hello',
      requiredOutput: 'HELLO',
      placedPipes: [
        makePipeBlock({ pipeType: 'lowercase', position: 0 }),
      ],
    });

    const results = service.evaluateStreams([stream]);
    expect(results.length).toBe(1);
    expect(results[0].isCorrect).toBe(false);
    expect(results[0].actualOutput).toBe('hello');
  });

  // --- Test 7: Complex pipe chain with 3+ pipes produces correct output (Level 17) ---
  it('complex pipe chain with 3 pipes produces correct output (Level 17)', () => {
    const data = getLevelData('dr-advanced-05');
    const stream = makeRuntimeStream({
      streamId: data.streams[2].id,
      rawInput: data.streams[2].rawInput,
      requiredOutput: data.targetOutputs[2].expectedOutput,
      placedPipes: [
        makePipeBlock({ pipeType: 'titlecase', position: 0 }),
        makePipeBlock({ pipeType: 'uppercase', position: 1 }),
        makePipeBlock({ pipeType: 'slice', params: ['0', '16'], position: 2 }),
      ],
    });

    const results = service.evaluateStreams([stream]);
    expect(results.length).toBe(1);
    expect(results[0].actualOutput).toBe('DEEP SPACE RELAY');
    expect(results[0].isCorrect).toBe(true);
  });

  // --- Test 8: reset() clears custom pipe registration (observable behavior) ---
  it('reset() clears custom pipe registration', () => {
    const spec: CustomPipeSpec = {
      name: 'distance',
      transformFn: 'distance',
      pureness: 'pure',
    };
    service.registerCustomPipe(spec);

    const stream = makeRuntimeStream({
      streamId: 'distance-test',
      rawInput: '9460730472580.8',
      requiredOutput: '1.00 ly',
      placedPipes: [
        makePipeBlock({ pipeType: 'distance', position: 0 }),
      ],
    });

    // Before reset: custom pipe works
    const beforeResults = service.evaluateStreams([stream]);
    expect(beforeResults[0].isCorrect).toBe(true);
    expect(beforeResults[0].actualOutput).toBe('1.00 ly');

    // Reset clears custom pipe specs
    service.reset();

    // After reset: custom pipe is unregistered, passthrough behavior
    const afterStream = makeRuntimeStream({
      streamId: 'distance-test-2',
      rawInput: '9460730472580.8',
      requiredOutput: '1.00 ly',
      placedPipes: [
        makePipeBlock({ pipeType: 'distance', position: 0 }),
      ],
    });

    const afterResults = service.evaluateStreams([afterStream]);
    expect(afterResults[0].isCorrect).toBe(false);
    expect(afterResults[0].actualOutput).toBe('9460730472580.8');
  });
});
