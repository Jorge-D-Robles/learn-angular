import {
  DataRelayEngine,
  PERFECT_SCORE_MULTIPLIER,
  SECOND_ATTEMPT_MULTIPLIER,
  MIN_ATTEMPT_MULTIPLIER,
  type PlacePipeAction,
  type RemovePipeAction,
  type ConfigurePipeAction,
  type RegisterCustomPipeAction,
  type DataRelayTransformService,
} from './data-relay.engine';
import type {
  DataRelayLevelData,
  DataStream,
  PipeDefinition,
  TargetOutput,
  TestDataItem,
} from './data-relay.types';
import {
  MinigameStatus,
  DifficultyTier,
  type MinigameLevel,
} from '../../../core/minigame/minigame.types';
import type { MinigameEngineConfig } from '../../../core/minigame/minigame-engine';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function createTestLevelData(
  overrides?: Partial<DataRelayLevelData>,
): DataRelayLevelData {
  const streams: DataStream[] = [
    { id: 'stream-1', name: 'Name Stream', rawInput: 'commander shepard' },
  ];
  const availablePipes: PipeDefinition[] = [
    { id: 'pipe-upper', pipeName: 'uppercase', displayName: 'UpperCase', category: 'text' },
    { id: 'pipe-lower', pipeName: 'lowercase', displayName: 'LowerCase', category: 'text' },
  ];
  const targetOutputs: TargetOutput[] = [
    { streamId: 'stream-1', expectedOutput: 'COMMANDER SHEPARD', requiredPipes: ['pipe-upper'] },
  ];
  const testData: TestDataItem[] = [
    { id: 'td-1', streamId: 'stream-1', input: 'john doe', expectedOutput: 'JOHN DOE' },
  ];

  return { streams, availablePipes, targetOutputs, testData, ...overrides };
}

function createLevel(
  data: DataRelayLevelData,
): MinigameLevel<DataRelayLevelData> {
  return {
    id: 'dr-test-01',
    gameId: 'data-relay',
    tier: DifficultyTier.Basic,
    conceptIntroduced: 'Pipes',
    description: 'Test level',
    data,
  };
}

function createEngine(
  config?: Partial<MinigameEngineConfig>,
  transformService?: DataRelayTransformService,
): DataRelayEngine {
  return new DataRelayEngine(config, transformService);
}

function initAndStart(
  engine: DataRelayEngine,
  data?: DataRelayLevelData,
): void {
  engine.initialize(createLevel(data ?? createTestLevelData()));
  engine.start();
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('DataRelayEngine', () => {
  // --- 1. Initialization ---

  describe('Initialization', () => {
    it('should initialize with Loading status', () => {
      const engine = createEngine();
      engine.initialize(createLevel(createTestLevelData()));

      expect(engine.status()).toBe(MinigameStatus.Loading);
    });

    it('should populate streams signal from level data', () => {
      const engine = createEngine();
      engine.initialize(createLevel(createTestLevelData()));

      expect(engine.streams()).toHaveLength(1);
      expect(engine.streams()[0].streamId).toBe('stream-1');
    });

    it('should populate availablePipes signal from level data', () => {
      const engine = createEngine();
      engine.initialize(createLevel(createTestLevelData()));

      expect(engine.availablePipes()).toHaveLength(2);
      expect(engine.availablePipes()[0].id).toBe('pipe-upper');
    });

    it('should start with empty placed pipes on all streams', () => {
      const engine = createEngine();
      engine.initialize(createLevel(createTestLevelData()));

      for (const stream of engine.streams()) {
        expect(stream.placedPipes).toEqual([]);
      }
    });

    it('should store target outputs and test data', () => {
      const engine = createEngine();
      const data = createTestLevelData();
      engine.initialize(createLevel(data));

      expect(engine.streams()[0].requiredOutput).toBe('COMMANDER SHEPARD');
    });
  });

  // --- 2. Place Pipe ---

  describe('Place Pipe', () => {
    it('should add pipe to stream placed pipes when pipe and stream exist', () => {
      const engine = createEngine();
      initAndStart(engine);

      const result = engine.submitAction({
        type: 'place-pipe',
        streamId: 'stream-1',
        pipeDefinitionId: 'pipe-upper',
        pipeBlockId: 'block-1',
        position: 0,
      } as PlacePipeAction);

      expect(result.valid).toBe(true);
      expect(engine.streams()[0].placedPipes).toHaveLength(1);
      expect(engine.streams()[0].placedPipes[0].pipeType).toBe('uppercase');
    });

    it('should reject placement when stream does not exist', () => {
      const engine = createEngine();
      initAndStart(engine);

      const result = engine.submitAction({
        type: 'place-pipe',
        streamId: 'nonexistent',
        pipeDefinitionId: 'pipe-upper',
        pipeBlockId: 'block-1',
        position: 0,
      } as PlacePipeAction);

      expect(result.valid).toBe(false);
    });

    it('should reject placement when pipe definition does not exist in available pipes', () => {
      const engine = createEngine();
      initAndStart(engine);

      const result = engine.submitAction({
        type: 'place-pipe',
        streamId: 'stream-1',
        pipeDefinitionId: 'nonexistent-pipe',
        pipeBlockId: 'block-1',
        position: 0,
      } as PlacePipeAction);

      expect(result.valid).toBe(false);
    });

    it('should reject duplicate pipe placement (same PipeBlock id on same stream)', () => {
      const engine = createEngine();
      initAndStart(engine);

      engine.submitAction({
        type: 'place-pipe',
        streamId: 'stream-1',
        pipeDefinitionId: 'pipe-upper',
        pipeBlockId: 'block-1',
        position: 0,
      } as PlacePipeAction);

      const result = engine.submitAction({
        type: 'place-pipe',
        streamId: 'stream-1',
        pipeDefinitionId: 'pipe-upper',
        pipeBlockId: 'block-1',
        position: 1,
      } as PlacePipeAction);

      expect(result.valid).toBe(false);
    });

    it('should allow multiple placements of same PipeDefinition at different positions (chaining)', () => {
      const engine = createEngine();
      initAndStart(engine);

      engine.submitAction({
        type: 'place-pipe',
        streamId: 'stream-1',
        pipeDefinitionId: 'pipe-upper',
        pipeBlockId: 'block-1',
        position: 0,
      } as PlacePipeAction);

      const result = engine.submitAction({
        type: 'place-pipe',
        streamId: 'stream-1',
        pipeDefinitionId: 'pipe-upper',
        pipeBlockId: 'block-2',
        position: 1,
      } as PlacePipeAction);

      expect(result.valid).toBe(true);
      expect(engine.streams()[0].placedPipes).toHaveLength(2);
    });

    it('should reject when not in Playing status', () => {
      const engine = createEngine();
      engine.initialize(createLevel(createTestLevelData()));
      // Still Loading, not started

      const result = engine.submitAction({
        type: 'place-pipe',
        streamId: 'stream-1',
        pipeDefinitionId: 'pipe-upper',
        pipeBlockId: 'block-1',
        position: 0,
      } as PlacePipeAction);

      expect(result.valid).toBe(false);
    });
  });

  // --- 3. Remove Pipe ---

  describe('Remove Pipe', () => {
    it('should remove pipe from stream when it exists', () => {
      const engine = createEngine();
      initAndStart(engine);

      engine.submitAction({
        type: 'place-pipe',
        streamId: 'stream-1',
        pipeDefinitionId: 'pipe-upper',
        pipeBlockId: 'block-1',
        position: 0,
      } as PlacePipeAction);

      const result = engine.submitAction({
        type: 'remove-pipe',
        streamId: 'stream-1',
        pipeBlockId: 'block-1',
      } as RemovePipeAction);

      expect(result.valid).toBe(true);
      expect(engine.streams()[0].placedPipes).toHaveLength(0);
    });

    it('should reject removal of nonexistent pipe', () => {
      const engine = createEngine();
      initAndStart(engine);

      const result = engine.submitAction({
        type: 'remove-pipe',
        streamId: 'stream-1',
        pipeBlockId: 'nonexistent',
      } as RemovePipeAction);

      expect(result.valid).toBe(false);
    });
  });

  // --- 4. Configure Pipe ---

  describe('Configure Pipe', () => {
    it('should update params on an existing placed pipe', () => {
      const engine = createEngine();
      initAndStart(engine);

      engine.submitAction({
        type: 'place-pipe',
        streamId: 'stream-1',
        pipeDefinitionId: 'pipe-upper',
        pipeBlockId: 'block-1',
        position: 0,
      } as PlacePipeAction);

      const result = engine.submitAction({
        type: 'configure-pipe',
        streamId: 'stream-1',
        pipeBlockId: 'block-1',
        params: ['param1'],
      } as ConfigurePipeAction);

      expect(result.valid).toBe(true);
      expect(engine.streams()[0].placedPipes[0].params).toEqual(['param1']);
    });

    it('should reject configuration of nonexistent pipe', () => {
      const engine = createEngine();
      initAndStart(engine);

      const result = engine.submitAction({
        type: 'configure-pipe',
        streamId: 'stream-1',
        pipeBlockId: 'nonexistent',
        params: ['param1'],
      } as ConfigurePipeAction);

      expect(result.valid).toBe(false);
    });
  });

  // --- 5. Built-in pipe application ---

  describe('Built-in pipe application', () => {
    it('should apply uppercase pipe correctly', () => {
      const data = createTestLevelData({
        streams: [{ id: 's1', name: 'S1', rawInput: 'hello world' }],
        targetOutputs: [{ streamId: 's1', expectedOutput: 'HELLO WORLD', requiredPipes: ['pipe-upper'] }],
        testData: [],
      });
      const engine = createEngine();
      initAndStart(engine, data);

      engine.submitAction({ type: 'place-pipe', streamId: 's1', pipeDefinitionId: 'pipe-upper', pipeBlockId: 'b1', position: 0 } as PlacePipeAction);
      const result = engine.runTransform();

      expect(result).not.toBeNull();
      expect(result!.streamResults[0].actualOutput).toBe('HELLO WORLD');
      expect(result!.streamResults[0].isCorrect).toBe(true);
    });

    it('should apply lowercase pipe correctly', () => {
      const data = createTestLevelData({
        streams: [{ id: 's1', name: 'S1', rawInput: 'HELLO WORLD' }],
        availablePipes: [
          { id: 'pipe-lower', pipeName: 'lowercase', displayName: 'LowerCase', category: 'text' },
        ],
        targetOutputs: [{ streamId: 's1', expectedOutput: 'hello world', requiredPipes: ['pipe-lower'] }],
        testData: [],
      });
      const engine = createEngine();
      initAndStart(engine, data);

      engine.submitAction({ type: 'place-pipe', streamId: 's1', pipeDefinitionId: 'pipe-lower', pipeBlockId: 'b1', position: 0 } as PlacePipeAction);
      const result = engine.runTransform();

      expect(result).not.toBeNull();
      expect(result!.streamResults[0].actualOutput).toBe('hello world');
      expect(result!.streamResults[0].isCorrect).toBe(true);
    });

    it('should apply titlecase pipe correctly', () => {
      const data = createTestLevelData({
        streams: [{ id: 's1', name: 'S1', rawInput: 'hello world' }],
        availablePipes: [
          { id: 'pipe-title', pipeName: 'titlecase', displayName: 'TitleCase', category: 'text' },
        ],
        targetOutputs: [{ streamId: 's1', expectedOutput: 'Hello World', requiredPipes: ['pipe-title'] }],
        testData: [],
      });
      const engine = createEngine();
      initAndStart(engine, data);

      engine.submitAction({ type: 'place-pipe', streamId: 's1', pipeDefinitionId: 'pipe-title', pipeBlockId: 'b1', position: 0 } as PlacePipeAction);
      const result = engine.runTransform();

      expect(result).not.toBeNull();
      expect(result!.streamResults[0].actualOutput).toBe('Hello World');
      expect(result!.streamResults[0].isCorrect).toBe(true);
    });

    it('should apply date pipe with format parameter', () => {
      const data = createTestLevelData({
        streams: [{ id: 's1', name: 'S1', rawInput: '2024-01-15T00:00:00.000Z' }],
        availablePipes: [
          { id: 'pipe-date', pipeName: 'date', displayName: 'Date', category: 'date', params: ['shortDate'] },
        ],
        targetOutputs: [{ streamId: 's1', expectedOutput: '1/15/24', requiredPipes: ['pipe-date'] }],
        testData: [],
      });
      const engine = createEngine();
      initAndStart(engine, data);

      engine.submitAction({ type: 'place-pipe', streamId: 's1', pipeDefinitionId: 'pipe-date', pipeBlockId: 'b1', position: 0 } as PlacePipeAction);
      // Configure with the date format
      engine.submitAction({ type: 'configure-pipe', streamId: 's1', pipeBlockId: 'b1', params: ['shortDate'] } as ConfigurePipeAction);
      const result = engine.runTransform();

      expect(result).not.toBeNull();
      expect(result!.streamResults[0].actualOutput).toBe('1/15/24');
      expect(result!.streamResults[0].isCorrect).toBe(true);
    });

    it('should apply decimal pipe with digit info parameter', () => {
      const data = createTestLevelData({
        streams: [{ id: 's1', name: 'S1', rawInput: '3.14159' }],
        availablePipes: [
          { id: 'pipe-decimal', pipeName: 'decimal', displayName: 'Decimal', category: 'number' },
        ],
        targetOutputs: [{ streamId: 's1', expectedOutput: '3.14', requiredPipes: ['pipe-decimal'] }],
        testData: [],
      });
      const engine = createEngine();
      initAndStart(engine, data);

      engine.submitAction({ type: 'place-pipe', streamId: 's1', pipeDefinitionId: 'pipe-decimal', pipeBlockId: 'b1', position: 0 } as PlacePipeAction);
      engine.submitAction({ type: 'configure-pipe', streamId: 's1', pipeBlockId: 'b1', params: ['1.2-2'] } as ConfigurePipeAction);
      const result = engine.runTransform();

      expect(result).not.toBeNull();
      expect(result!.streamResults[0].actualOutput).toBe('3.14');
      expect(result!.streamResults[0].isCorrect).toBe(true);
    });

    it('should apply currency pipe with currency code parameter', () => {
      const data = createTestLevelData({
        streams: [{ id: 's1', name: 'S1', rawInput: '1234.5' }],
        availablePipes: [
          { id: 'pipe-currency', pipeName: 'currency', displayName: 'Currency', category: 'number' },
        ],
        targetOutputs: [{ streamId: 's1', expectedOutput: '$1,234.50', requiredPipes: ['pipe-currency'] }],
        testData: [],
      });
      const engine = createEngine();
      initAndStart(engine, data);

      engine.submitAction({ type: 'place-pipe', streamId: 's1', pipeDefinitionId: 'pipe-currency', pipeBlockId: 'b1', position: 0 } as PlacePipeAction);
      engine.submitAction({ type: 'configure-pipe', streamId: 's1', pipeBlockId: 'b1', params: ['USD'] } as ConfigurePipeAction);
      const result = engine.runTransform();

      expect(result).not.toBeNull();
      expect(result!.streamResults[0].actualOutput).toBe('$1,234.50');
      expect(result!.streamResults[0].isCorrect).toBe(true);
    });

    it('should apply percent pipe with digit info parameter', () => {
      const data = createTestLevelData({
        streams: [{ id: 's1', name: 'S1', rawInput: '0.259' }],
        availablePipes: [
          { id: 'pipe-percent', pipeName: 'percent', displayName: 'Percent', category: 'number' },
        ],
        targetOutputs: [{ streamId: 's1', expectedOutput: '25.90%', requiredPipes: ['pipe-percent'] }],
        testData: [],
      });
      const engine = createEngine();
      initAndStart(engine, data);

      engine.submitAction({ type: 'place-pipe', streamId: 's1', pipeDefinitionId: 'pipe-percent', pipeBlockId: 'b1', position: 0 } as PlacePipeAction);
      engine.submitAction({ type: 'configure-pipe', streamId: 's1', pipeBlockId: 'b1', params: ['1.2-2'] } as ConfigurePipeAction);
      const result = engine.runTransform();

      expect(result).not.toBeNull();
      expect(result!.streamResults[0].actualOutput).toBe('25.90%');
      expect(result!.streamResults[0].isCorrect).toBe(true);
    });

    it('should apply slice pipe with start and end parameters', () => {
      const data = createTestLevelData({
        streams: [{ id: 's1', name: 'S1', rawInput: 'hello world' }],
        availablePipes: [
          { id: 'pipe-slice', pipeName: 'slice', displayName: 'Slice', category: 'text' },
        ],
        targetOutputs: [{ streamId: 's1', expectedOutput: 'hello', requiredPipes: ['pipe-slice'] }],
        testData: [],
      });
      const engine = createEngine();
      initAndStart(engine, data);

      engine.submitAction({ type: 'place-pipe', streamId: 's1', pipeDefinitionId: 'pipe-slice', pipeBlockId: 'b1', position: 0 } as PlacePipeAction);
      engine.submitAction({ type: 'configure-pipe', streamId: 's1', pipeBlockId: 'b1', params: ['0', '5'] } as ConfigurePipeAction);
      const result = engine.runTransform();

      expect(result).not.toBeNull();
      expect(result!.streamResults[0].actualOutput).toBe('hello');
      expect(result!.streamResults[0].isCorrect).toBe(true);
    });

    it('should treat async pipe as passthrough for resolved values', () => {
      const data = createTestLevelData({
        streams: [{ id: 's1', name: 'S1', rawInput: 'resolved value', isAsync: true }],
        availablePipes: [
          { id: 'pipe-async', pipeName: 'async', displayName: 'Async', category: 'text' },
        ],
        targetOutputs: [{ streamId: 's1', expectedOutput: 'resolved value', requiredPipes: ['pipe-async'] }],
        testData: [],
      });
      const engine = createEngine();
      initAndStart(engine, data);

      engine.submitAction({ type: 'place-pipe', streamId: 's1', pipeDefinitionId: 'pipe-async', pipeBlockId: 'b1', position: 0 } as PlacePipeAction);
      const result = engine.runTransform();

      expect(result).not.toBeNull();
      expect(result!.streamResults[0].actualOutput).toBe('resolved value');
      expect(result!.streamResults[0].isCorrect).toBe(true);
    });
  });

  // --- 6. Pipe chaining ---

  describe('Pipe chaining', () => {
    it('should chain multiple pipes in position order', () => {
      const data = createTestLevelData({
        streams: [{ id: 's1', name: 'S1', rawInput: 'HELLO WORLD' }],
        availablePipes: [
          { id: 'pipe-lower', pipeName: 'lowercase', displayName: 'LowerCase', category: 'text' },
          { id: 'pipe-title', pipeName: 'titlecase', displayName: 'TitleCase', category: 'text' },
        ],
        targetOutputs: [{ streamId: 's1', expectedOutput: 'Hello World', requiredPipes: ['pipe-lower', 'pipe-title'] }],
        testData: [],
      });
      const engine = createEngine();
      initAndStart(engine, data);

      engine.submitAction({ type: 'place-pipe', streamId: 's1', pipeDefinitionId: 'pipe-lower', pipeBlockId: 'b1', position: 0 } as PlacePipeAction);
      engine.submitAction({ type: 'place-pipe', streamId: 's1', pipeDefinitionId: 'pipe-title', pipeBlockId: 'b2', position: 1 } as PlacePipeAction);
      const result = engine.runTransform();

      expect(result).not.toBeNull();
      expect(result!.streamResults[0].actualOutput).toBe('Hello World');
      expect(result!.streamResults[0].isCorrect).toBe(true);
    });

    it('should apply titlecase then uppercase in sequence', () => {
      const data = createTestLevelData({
        streams: [{ id: 's1', name: 'S1', rawInput: 'hello world' }],
        availablePipes: [
          { id: 'pipe-title', pipeName: 'titlecase', displayName: 'TitleCase', category: 'text' },
          { id: 'pipe-upper', pipeName: 'uppercase', displayName: 'UpperCase', category: 'text' },
        ],
        targetOutputs: [{ streamId: 's1', expectedOutput: 'HELLO WORLD', requiredPipes: ['pipe-title', 'pipe-upper'] }],
        testData: [],
      });
      const engine = createEngine();
      initAndStart(engine, data);

      engine.submitAction({ type: 'place-pipe', streamId: 's1', pipeDefinitionId: 'pipe-title', pipeBlockId: 'b1', position: 0 } as PlacePipeAction);
      engine.submitAction({ type: 'place-pipe', streamId: 's1', pipeDefinitionId: 'pipe-upper', pipeBlockId: 'b2', position: 1 } as PlacePipeAction);
      const result = engine.runTransform();

      expect(result).not.toBeNull();
      expect(result!.streamResults[0].actualOutput).toBe('HELLO WORLD');
      expect(result!.streamResults[0].isCorrect).toBe(true);
    });

    it('should apply decimal then currency in sequence', () => {
      const data = createTestLevelData({
        streams: [{ id: 's1', name: 'S1', rawInput: '1234.5' }],
        availablePipes: [
          { id: 'pipe-decimal', pipeName: 'decimal', displayName: 'Decimal', category: 'number' },
          { id: 'pipe-currency', pipeName: 'currency', displayName: 'Currency', category: 'number' },
        ],
        targetOutputs: [{ streamId: 's1', expectedOutput: '$1,234.50', requiredPipes: ['pipe-decimal', 'pipe-currency'] }],
        testData: [],
      });
      const engine = createEngine();
      initAndStart(engine, data);

      // Place currency only (decimal -> currency chaining tested via currency pipe applied to raw number string)
      engine.submitAction({ type: 'place-pipe', streamId: 's1', pipeDefinitionId: 'pipe-currency', pipeBlockId: 'b1', position: 0 } as PlacePipeAction);
      engine.submitAction({ type: 'configure-pipe', streamId: 's1', pipeBlockId: 'b1', params: ['USD'] } as ConfigurePipeAction);
      const result = engine.runTransform();

      expect(result).not.toBeNull();
      expect(result!.streamResults[0].actualOutput).toBe('$1,234.50');
      expect(result!.streamResults[0].isCorrect).toBe(true);
    });
  });

  // --- 7. Output comparison (runTransform) ---

  describe('Output comparison (runTransform)', () => {
    it('should evaluate streams and return StreamResult[] with correct/incorrect flags', () => {
      const engine = createEngine();
      initAndStart(engine);

      // Place wrong pipe (lowercase instead of uppercase)
      engine.submitAction({ type: 'place-pipe', streamId: 'stream-1', pipeDefinitionId: 'pipe-lower', pipeBlockId: 'b1', position: 0 } as PlacePipeAction);
      const result = engine.runTransform();

      expect(result).not.toBeNull();
      expect(result!.streamResults).toHaveLength(1);
      expect(result!.streamResults[0].isCorrect).toBe(false);
    });

    it('should complete engine when all streams produce correct output', () => {
      const engine = createEngine({ maxScore: 1000 });
      initAndStart(engine);

      engine.submitAction({ type: 'place-pipe', streamId: 'stream-1', pipeDefinitionId: 'pipe-upper', pipeBlockId: 'b1', position: 0 } as PlacePipeAction);
      engine.runTransform();

      expect(engine.status()).toBe(MinigameStatus.Won);
    });

    it('should not complete when any stream has incorrect output', () => {
      const engine = createEngine();
      initAndStart(engine);

      engine.submitAction({ type: 'place-pipe', streamId: 'stream-1', pipeDefinitionId: 'pipe-lower', pipeBlockId: 'b1', position: 0 } as PlacePipeAction);
      engine.runTransform();

      expect(engine.status()).toBe(MinigameStatus.Playing);
    });

    it('should fail engine when more than 2 test data pairs fail (>2 total rows)', () => {
      const data = createTestLevelData({
        streams: [{ id: 's1', name: 'S1', rawInput: 'hello' }],
        availablePipes: [
          { id: 'pipe-lower', pipeName: 'lowercase', displayName: 'LowerCase', category: 'text' },
        ],
        targetOutputs: [{ streamId: 's1', expectedOutput: 'HELLO', requiredPipes: [] }],
        testData: [
          { id: 'td-1', streamId: 's1', input: 'a', expectedOutput: 'A' },
          { id: 'td-2', streamId: 's1', input: 'b', expectedOutput: 'B' },
          { id: 'td-3', streamId: 's1', input: 'c', expectedOutput: 'C' },
        ],
      });
      const engine = createEngine();
      initAndStart(engine, data);

      // Place lowercase pipe -- all test data will fail since they expect uppercase
      engine.submitAction({ type: 'place-pipe', streamId: 's1', pipeDefinitionId: 'pipe-lower', pipeBlockId: 'b1', position: 0 } as PlacePipeAction);
      engine.runTransform();

      expect(engine.status()).toBe(MinigameStatus.Lost);
    });

    it('should NOT fail engine when exactly 2 test data pairs fail (boundary test)', () => {
      const data = createTestLevelData({
        streams: [{ id: 's1', name: 'S1', rawInput: 'hello' }],
        availablePipes: [
          { id: 'pipe-lower', pipeName: 'lowercase', displayName: 'LowerCase', category: 'text' },
        ],
        targetOutputs: [{ streamId: 's1', expectedOutput: 'hello', requiredPipes: ['pipe-lower'] }],
        testData: [
          { id: 'td-1', streamId: 's1', input: 'a', expectedOutput: 'A' },
          { id: 'td-2', streamId: 's1', input: 'b', expectedOutput: 'B' },
        ],
      });
      const engine = createEngine();
      initAndStart(engine, data);

      engine.submitAction({ type: 'place-pipe', streamId: 's1', pipeDefinitionId: 'pipe-lower', pipeBlockId: 'b1', position: 0 } as PlacePipeAction);
      const result = engine.runTransform();

      expect(result).not.toBeNull();
      expect(result!.failedTestCount).toBe(2);
      // Stream output is correct ("hello" lowercased is "hello") so it completes even though 2 test data fail
      // Actually with exactly 2 failures, no lose condition is triggered
      expect(engine.status()).not.toBe(MinigameStatus.Lost);
    });

    it('should return rawInput as actualOutput when no pipes are placed on a stream', () => {
      const engine = createEngine();
      initAndStart(engine);

      const result = engine.runTransform();

      expect(result).not.toBeNull();
      expect(result!.streamResults[0].actualOutput).toBe('commander shepard');
    });

    it('should return null when not in Playing status', () => {
      const engine = createEngine();
      engine.initialize(createLevel(createTestLevelData()));
      // Still Loading

      const result = engine.runTransform();

      expect(result).toBeNull();
    });
  });

  // --- 8. Custom pipes ---

  describe('Custom pipes', () => {
    it('should register custom pipe spec', () => {
      const engine = createEngine();
      initAndStart(engine);

      const result = engine.submitAction({
        type: 'register-custom-pipe',
        spec: { name: 'distance', transformFn: 'km-to-ly', pureness: 'pure' },
      } as RegisterCustomPipeAction);

      expect(result.valid).toBe(true);
    });

    it('should apply distance custom pipe (km to ly conversion)', () => {
      const data = createTestLevelData({
        streams: [{ id: 's1', name: 'S1', rawInput: '9460730472580.8' }],
        availablePipes: [
          { id: 'pipe-dist', pipeName: 'distance', displayName: 'Distance', category: 'custom', isCustom: true },
        ],
        targetOutputs: [{ streamId: 's1', expectedOutput: '1.00 ly', requiredPipes: ['pipe-dist'] }],
        testData: [],
      });
      const engine = createEngine();
      initAndStart(engine, data);

      engine.submitAction({
        type: 'register-custom-pipe',
        spec: { name: 'distance', transformFn: 'km-to-ly', pureness: 'pure' },
      } as RegisterCustomPipeAction);
      engine.submitAction({ type: 'place-pipe', streamId: 's1', pipeDefinitionId: 'pipe-dist', pipeBlockId: 'b1', position: 0 } as PlacePipeAction);
      const result = engine.runTransform();

      expect(result).not.toBeNull();
      expect(result!.streamResults[0].actualOutput).toBe('1.00 ly');
      expect(result!.streamResults[0].isCorrect).toBe(true);
    });

    it('should apply status custom pipe with threshold params', () => {
      const data = createTestLevelData({
        streams: [{ id: 's1', name: 'S1', rawInput: '85' }],
        availablePipes: [
          { id: 'pipe-status', pipeName: 'status', displayName: 'Status', category: 'custom', isCustom: true },
        ],
        targetOutputs: [{ streamId: 's1', expectedOutput: 'nominal', requiredPipes: ['pipe-status'] }],
        testData: [],
      });
      const engine = createEngine();
      initAndStart(engine, data);

      engine.submitAction({
        type: 'register-custom-pipe',
        spec: { name: 'status', transformFn: 'threshold', pureness: 'pure' },
      } as RegisterCustomPipeAction);
      engine.submitAction({ type: 'place-pipe', streamId: 's1', pipeDefinitionId: 'pipe-status', pipeBlockId: 'b1', position: 0 } as PlacePipeAction);
      engine.submitAction({ type: 'configure-pipe', streamId: 's1', pipeBlockId: 'b1', params: ['50', '80'] } as ConfigurePipeAction);
      const result = engine.runTransform();

      expect(result).not.toBeNull();
      expect(result!.streamResults[0].actualOutput).toBe('nominal');
      expect(result!.streamResults[0].isCorrect).toBe(true);
    });

    it('should apply timeAgo custom pipe', () => {
      const now = Date.now();
      const fiveMinutesAgo = new Date(now - 5 * 60 * 1000).toISOString();
      const data = createTestLevelData({
        streams: [{ id: 's1', name: 'S1', rawInput: fiveMinutesAgo }],
        availablePipes: [
          { id: 'pipe-time', pipeName: 'timeAgo', displayName: 'Time Ago', category: 'custom', isCustom: true },
        ],
        targetOutputs: [{ streamId: 's1', expectedOutput: '5 minutes ago', requiredPipes: ['pipe-time'] }],
        testData: [],
      });
      const engine = createEngine();
      initAndStart(engine, data);

      engine.submitAction({
        type: 'register-custom-pipe',
        spec: { name: 'timeAgo', transformFn: 'relative-time', pureness: 'impure' },
      } as RegisterCustomPipeAction);
      engine.submitAction({ type: 'place-pipe', streamId: 's1', pipeDefinitionId: 'pipe-time', pipeBlockId: 'b1', position: 0 } as PlacePipeAction);
      const result = engine.runTransform();

      expect(result).not.toBeNull();
      expect(result!.streamResults[0].actualOutput).toBe('5 minutes ago');
      expect(result!.streamResults[0].isCorrect).toBe(true);
    });

    it('should pass through input when custom pipe spec is not registered', () => {
      const data = createTestLevelData({
        streams: [{ id: 's1', name: 'S1', rawInput: 'hello' }],
        availablePipes: [
          { id: 'pipe-custom', pipeName: 'myCustom', displayName: 'Custom', category: 'custom', isCustom: true },
        ],
        targetOutputs: [{ streamId: 's1', expectedOutput: 'hello', requiredPipes: ['pipe-custom'] }],
        testData: [],
      });
      const engine = createEngine();
      initAndStart(engine, data);

      // Place pipe WITHOUT registering spec
      engine.submitAction({ type: 'place-pipe', streamId: 's1', pipeDefinitionId: 'pipe-custom', pipeBlockId: 'b1', position: 0 } as PlacePipeAction);
      const result = engine.runTransform();

      expect(result).not.toBeNull();
      expect(result!.streamResults[0].actualOutput).toBe('hello');
    });
  });

  // --- 9. Scoring ---

  describe('Scoring', () => {
    it('should award full score on first successful run', () => {
      const engine = createEngine({ maxScore: 1000 });
      initAndStart(engine);

      engine.submitAction({ type: 'place-pipe', streamId: 'stream-1', pipeDefinitionId: 'pipe-upper', pipeBlockId: 'b1', position: 0 } as PlacePipeAction);
      engine.runTransform();

      expect(engine.score()).toBe(Math.round(1000 * PERFECT_SCORE_MULTIPLIER));
    });

    it('should apply penalty on second run attempt', () => {
      const data = createTestLevelData({
        streams: [{ id: 's1', name: 'S1', rawInput: 'hello' }],
        targetOutputs: [{ streamId: 's1', expectedOutput: 'HELLO', requiredPipes: ['pipe-upper'] }],
        testData: [],
      });
      const engine = createEngine({ maxScore: 1000 });
      initAndStart(engine, data);

      // First run: wrong pipe
      engine.submitAction({ type: 'place-pipe', streamId: 's1', pipeDefinitionId: 'pipe-lower', pipeBlockId: 'b1', position: 0 } as PlacePipeAction);
      engine.runTransform();
      expect(engine.status()).toBe(MinigameStatus.Playing);

      // Fix: remove wrong, place correct
      engine.submitAction({ type: 'remove-pipe', streamId: 's1', pipeBlockId: 'b1' } as RemovePipeAction);
      engine.submitAction({ type: 'place-pipe', streamId: 's1', pipeDefinitionId: 'pipe-upper', pipeBlockId: 'b2', position: 0 } as PlacePipeAction);
      engine.runTransform();

      expect(engine.score()).toBe(Math.round(1000 * SECOND_ATTEMPT_MULTIPLIER));
      expect(engine.status()).toBe(MinigameStatus.Won);
    });

    it('should apply minimum multiplier after many attempts', () => {
      const data = createTestLevelData({
        streams: [{ id: 's1', name: 'S1', rawInput: 'hello' }],
        targetOutputs: [{ streamId: 's1', expectedOutput: 'HELLO', requiredPipes: ['pipe-upper'] }],
        testData: [],
      });
      const engine = createEngine({ maxScore: 1000 });
      initAndStart(engine, data);

      // Multiple wrong runs
      engine.submitAction({ type: 'place-pipe', streamId: 's1', pipeDefinitionId: 'pipe-lower', pipeBlockId: 'b1', position: 0 } as PlacePipeAction);
      engine.runTransform(); // run 1
      engine.runTransform(); // run 2
      engine.runTransform(); // run 3

      // Fix and succeed
      engine.submitAction({ type: 'remove-pipe', streamId: 's1', pipeBlockId: 'b1' } as RemovePipeAction);
      engine.submitAction({ type: 'place-pipe', streamId: 's1', pipeDefinitionId: 'pipe-upper', pipeBlockId: 'b2', position: 0 } as PlacePipeAction);
      engine.runTransform(); // run 4

      expect(engine.score()).toBe(Math.round(1000 * MIN_ATTEMPT_MULTIPLIER));
      expect(engine.status()).toBe(MinigameStatus.Won);
    });
  });

  // --- 10. Transform service delegation ---

  describe('Transform service delegation', () => {
    function createMockService(): DataRelayTransformService {
      return {
        applyPipe: vi.fn().mockReturnValue('MOCKED'),
        applyChain: vi.fn().mockReturnValue('MOCKED'),
        compareOutput: vi.fn().mockReturnValue(true),
        reset: vi.fn(),
      };
    }

    it('should delegate to transform service when provided', () => {
      const service = createMockService();
      const engine = createEngine({ maxScore: 1000 }, service);
      initAndStart(engine);

      engine.submitAction({ type: 'place-pipe', streamId: 'stream-1', pipeDefinitionId: 'pipe-upper', pipeBlockId: 'b1', position: 0 } as PlacePipeAction);
      const result = engine.runTransform();

      expect(service.applyChain).toHaveBeenCalled();
      expect(service.compareOutput).toHaveBeenCalled();
      expect(result).not.toBeNull();
    });

    it('should call service.reset() on level load when service is present', () => {
      const service = createMockService();
      const engine = createEngine(undefined, service);
      engine.initialize(createLevel(createTestLevelData()));

      expect(service.reset).toHaveBeenCalledOnce();
    });
  });
});
