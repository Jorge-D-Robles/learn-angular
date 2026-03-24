import { TestBed } from '@angular/core/testing';
import { DataRelayTransformServiceImpl } from './data-relay-transform.service';
import type {
  PipeBlock,
  PipeDefinition,
  RuntimeStream,
  CustomPipeSpec,
} from './data-relay.types';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function createPipeBlock(overrides?: Partial<PipeBlock>): PipeBlock {
  return {
    id: 'block-1',
    pipeType: 'uppercase',
    params: [],
    position: 0,
    ...overrides,
  };
}

function createRuntimeStream(overrides?: Partial<RuntimeStream>): RuntimeStream {
  return {
    streamId: 'stream-1',
    rawInput: 'hello',
    requiredOutput: 'HELLO',
    placedPipes: [createPipeBlock()],
    ...overrides,
  };
}

function createPipeDefinition(overrides?: Partial<PipeDefinition>): PipeDefinition {
  return {
    id: 'pipe-upper',
    pipeName: 'uppercase',
    displayName: 'UpperCase',
    category: 'text',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('DataRelayTransformServiceImpl', () => {
  let service: DataRelayTransformServiceImpl;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [DataRelayTransformServiceImpl],
    });
    service = TestBed.inject(DataRelayTransformServiceImpl);
  });

  // =========================================================================
  // 1. Creation and initial state
  // =========================================================================
  describe('Creation and initial state', () => {
    it('should be created via TestBed', () => {
      expect(service).toBeTruthy();
    });

    it('reset() does not throw when called with no prior state', () => {
      expect(() => service.reset()).not.toThrow();
    });
  });

  // =========================================================================
  // 2. applyPipe -- built-in pipes
  // =========================================================================
  describe('applyPipe -- built-in pipes', () => {
    it('uppercase: transforms "hello" to "HELLO"', () => {
      expect(service.applyPipe('hello', 'uppercase', [])).toBe('HELLO');
    });

    it('lowercase: transforms "HELLO" to "hello"', () => {
      expect(service.applyPipe('HELLO', 'lowercase', [])).toBe('hello');
    });

    it('titlecase: transforms "hello world" to "Hello World"', () => {
      expect(service.applyPipe('hello world', 'titlecase', [])).toBe('Hello World');
    });

    it('date: formats "2026-03-06T00:00:00Z" with mediumDate to "Mar 6, 2026"', () => {
      expect(service.applyPipe('2026-03-06T00:00:00Z', 'date', ['mediumDate'])).toBe('Mar 6, 2026');
    });

    it('decimal: formats "1234.5" with "1.2-2" to "1,234.50"', () => {
      expect(service.applyPipe('1234.5', 'decimal', ['1.2-2'])).toBe('1,234.50');
    });

    it('currency: formats "1234.5" to "$1,234.50"', () => {
      expect(service.applyPipe('1234.5', 'currency', [])).toBe('$1,234.50');
    });

    it('percent: formats "0.85" to "85%"', () => {
      expect(service.applyPipe('0.85', 'percent', [])).toBe('85%');
    });

    it('slice: slices "hello world" with params ["0", "5"] to "hello"', () => {
      expect(service.applyPipe('hello world', 'slice', ['0', '5'])).toBe('hello');
    });

    it('json: transforms object-like input to JSON string', () => {
      const input = { key: 'val' };
      const expected = '{\n  "key": "val"\n}';
      expect(service.applyPipe(input, 'json', [])).toBe(expected);
    });

    it('async: passes through value unchanged', () => {
      expect(service.applyPipe('signal-data', 'async', [])).toBe('signal-data');
    });
  });

  // =========================================================================
  // 3. applyPipe -- custom pipes
  // =========================================================================
  describe('applyPipe -- custom pipes', () => {
    it('returns passthrough for unregistered custom pipe name', () => {
      expect(service.applyPipe('hello', 'unknown-pipe', [])).toBe('hello');
    });

    it('applies registered distance pipe', () => {
      const spec: CustomPipeSpec = {
        name: 'distance',
        transformFn: 'distance',
        pureness: 'pure',
      };
      service.registerCustomPipe(spec);
      // 9460730472580.8 km = 1 light year
      const result = service.applyPipe('9460730472580.8', 'distance', []);
      expect(result).toBe('1.00 ly');
    });

    it('applies registered status pipe with threshold params', () => {
      const spec: CustomPipeSpec = {
        name: 'status',
        transformFn: 'status',
        pureness: 'pure',
      };
      service.registerCustomPipe(spec);
      expect(service.applyPipe('20', 'status', ['30', '70'])).toBe('critical');
      expect(service.applyPipe('50', 'status', ['30', '70'])).toBe('warning');
      expect(service.applyPipe('80', 'status', ['30', '70'])).toBe('nominal');
    });
  });

  // =========================================================================
  // 4. applyChain
  // =========================================================================
  describe('applyChain', () => {
    it('returns String(input) for empty pipe array', () => {
      expect(service.applyChain('hello', [])).toBe('hello');
    });

    it('applies single pipe in chain', () => {
      const pipes: PipeBlock[] = [
        createPipeBlock({ pipeType: 'uppercase', position: 0 }),
      ];
      expect(service.applyChain('hello', pipes)).toBe('HELLO');
    });

    it('chains uppercase then slice in position order', () => {
      const pipes: PipeBlock[] = [
        createPipeBlock({ id: 'b1', pipeType: 'uppercase', position: 0 }),
        createPipeBlock({ id: 'b2', pipeType: 'slice', params: ['0', '5'], position: 1 }),
      ];
      expect(service.applyChain('hello world', pipes)).toBe('HELLO');
    });

    it('sorts pipes by position before applying', () => {
      // Give pipes in REVERSE order in the array
      const pipes: PipeBlock[] = [
        createPipeBlock({ id: 'b2', pipeType: 'slice', params: ['0', '5'], position: 1 }),
        createPipeBlock({ id: 'b1', pipeType: 'uppercase', position: 0 }),
      ];
      expect(service.applyChain('hello world', pipes)).toBe('HELLO');
    });
  });

  // =========================================================================
  // 5. compareOutput
  // =========================================================================
  describe('compareOutput', () => {
    it('returns true for identical strings', () => {
      expect(service.compareOutput('HELLO', 'HELLO')).toBe(true);
    });

    it('returns false for different strings', () => {
      expect(service.compareOutput('HELLO', 'WORLD')).toBe(false);
    });

    it('returns false for case-different strings (case sensitive)', () => {
      expect(service.compareOutput('Hello', 'hello')).toBe(false);
    });
  });

  // =========================================================================
  // 6. evaluateStreams
  // =========================================================================
  describe('evaluateStreams', () => {
    it('returns correct StreamResult for matching output', () => {
      const streams: RuntimeStream[] = [
        createRuntimeStream({
          streamId: 'stream-1',
          rawInput: 'hello',
          requiredOutput: 'HELLO',
          placedPipes: [createPipeBlock({ pipeType: 'uppercase', position: 0 })],
        }),
      ];
      const results = service.evaluateStreams(streams);
      expect(results.length).toBe(1);
      expect(results[0].streamId).toBe('stream-1');
      expect(results[0].actualOutput).toBe('HELLO');
      expect(results[0].isCorrect).toBe(true);
    });

    it('returns incorrect StreamResult for mismatching output', () => {
      const streams: RuntimeStream[] = [
        createRuntimeStream({
          streamId: 'stream-1',
          rawInput: 'hello',
          requiredOutput: 'WORLD',
          placedPipes: [createPipeBlock({ pipeType: 'uppercase', position: 0 })],
        }),
      ];
      const results = service.evaluateStreams(streams);
      expect(results.length).toBe(1);
      expect(results[0].actualOutput).toBe('HELLO');
      expect(results[0].isCorrect).toBe(false);
    });

    it('evaluates multiple streams independently', () => {
      const streams: RuntimeStream[] = [
        createRuntimeStream({
          streamId: 'stream-1',
          rawInput: 'hello',
          requiredOutput: 'HELLO',
          placedPipes: [createPipeBlock({ id: 'b1', pipeType: 'uppercase', position: 0 })],
        }),
        createRuntimeStream({
          streamId: 'stream-2',
          rawInput: 'WORLD',
          requiredOutput: 'world',
          placedPipes: [createPipeBlock({ id: 'b2', pipeType: 'lowercase', position: 0 })],
        }),
      ];
      const results = service.evaluateStreams(streams);
      expect(results.length).toBe(2);
      expect(results[0].isCorrect).toBe(true);
      expect(results[1].isCorrect).toBe(true);
    });
  });

  // =========================================================================
  // 7. getAvailablePipes
  // =========================================================================
  describe('getAvailablePipes', () => {
    it('returns empty array when no pipes loaded', () => {
      expect(service.getAvailablePipes()).toEqual([]);
    });

    it('returns all pipes when no category filter', () => {
      const pipes: PipeDefinition[] = [
        createPipeDefinition({ id: 'p1', pipeName: 'uppercase', category: 'text' }),
        createPipeDefinition({ id: 'p2', pipeName: 'decimal', category: 'number' }),
      ];
      service.loadPipes(pipes);
      expect(service.getAvailablePipes().length).toBe(2);
    });

    it('filters by category', () => {
      const pipes: PipeDefinition[] = [
        createPipeDefinition({ id: 'p1', pipeName: 'uppercase', category: 'text' }),
        createPipeDefinition({ id: 'p2', pipeName: 'decimal', category: 'number' }),
        createPipeDefinition({ id: 'p3', pipeName: 'date', category: 'date' }),
      ];
      service.loadPipes(pipes);
      const textPipes = service.getAvailablePipes('text');
      expect(textPipes.length).toBe(1);
      expect(textPipes[0].pipeName).toBe('uppercase');
    });
  });

  // =========================================================================
  // 8. registerCustomPipe and reset
  // =========================================================================
  describe('registerCustomPipe and reset', () => {
    it('registerCustomPipe adds spec that applyPipe can use', () => {
      const spec: CustomPipeSpec = {
        name: 'distance',
        transformFn: 'distance',
        pureness: 'pure',
      };
      service.registerCustomPipe(spec);
      const result = service.applyPipe('9460730472580.8', 'distance', []);
      expect(result).toBe('1.00 ly');
    });

    it('reset clears custom pipe specs', () => {
      const spec: CustomPipeSpec = {
        name: 'distance',
        transformFn: 'distance',
        pureness: 'pure',
      };
      service.registerCustomPipe(spec);
      service.reset();
      // After reset, distance pipe should passthrough
      const result = service.applyPipe('9460730472580.8', 'distance', []);
      expect(result).toBe('9460730472580.8');
    });

    it('reset clears available pipes', () => {
      const pipes: PipeDefinition[] = [
        createPipeDefinition({ id: 'p1', pipeName: 'uppercase', category: 'text' }),
      ];
      service.loadPipes(pipes);
      expect(service.getAvailablePipes().length).toBe(1);
      service.reset();
      expect(service.getAvailablePipes()).toEqual([]);
    });
  });
});
