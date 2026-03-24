import {
  isValidPipeType,
  isValidTestDataPair,
  VALID_PIPE_TYPES,
  type PipeBlock,
  type RuntimeStream,
  type TestDataPair,
  type CustomPipeSpec,
  type StreamResult,
} from './data-relay.types';

// ---------------------------------------------------------------------------
// isValidPipeType
// ---------------------------------------------------------------------------

describe('isValidPipeType', () => {
  it('should return true for "uppercase"', () => {
    expect(isValidPipeType('uppercase')).toBe(true);
  });

  it('should return true for "lowercase"', () => {
    expect(isValidPipeType('lowercase')).toBe(true);
  });

  it('should return true for "date"', () => {
    expect(isValidPipeType('date')).toBe(true);
  });

  it('should return true for "currency"', () => {
    expect(isValidPipeType('currency')).toBe(true);
  });

  it('should return true for "slice"', () => {
    expect(isValidPipeType('slice')).toBe(true);
  });

  it('should return true for "custom"', () => {
    expect(isValidPipeType('custom')).toBe(true);
  });

  it('should return false for an unknown string', () => {
    expect(isValidPipeType('unknown-pipe')).toBe(false);
  });

  it('should return false for an empty string', () => {
    expect(isValidPipeType('')).toBe(false);
  });

  it('should be case sensitive ("Uppercase" is invalid)', () => {
    expect(isValidPipeType('Uppercase')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// isValidTestDataPair
// ---------------------------------------------------------------------------

describe('isValidTestDataPair', () => {
  it('should return true for a valid pair with string input', () => {
    expect(isValidTestDataPair({ input: 'hello', expectedOutput: 'HELLO' })).toBe(true);
  });

  it('should return true for a valid pair with number input', () => {
    expect(isValidTestDataPair({ input: 42, expectedOutput: '42.00' })).toBe(true);
  });

  it('should return true for a valid pair with null input', () => {
    expect(isValidTestDataPair({ input: null, expectedOutput: 'N/A' })).toBe(true);
  });

  it('should return false for null', () => {
    expect(isValidTestDataPair(null)).toBe(false);
  });

  it('should return false for a primitive string', () => {
    expect(isValidTestDataPair('not-an-object')).toBe(false);
  });

  it('should return false when expectedOutput is missing', () => {
    expect(isValidTestDataPair({ input: 'x' })).toBe(false);
  });

  it('should return false when expectedOutput is not a string', () => {
    expect(isValidTestDataPair({ input: 'x', expectedOutput: 42 })).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// VALID_PIPE_TYPES constant
// ---------------------------------------------------------------------------

describe('VALID_PIPE_TYPES', () => {
  it('should contain exactly the 8 ticket-specified pipe types', () => {
    expect([...VALID_PIPE_TYPES]).toEqual([
      'uppercase', 'lowercase', 'date', 'decimal',
      'currency', 'percent', 'slice', 'custom',
    ]);
  });
});

// ---------------------------------------------------------------------------
// Type structure smoke tests
// ---------------------------------------------------------------------------

describe('Type structures', () => {
  it('PipeBlock has required fields: id, pipeType, params, position', () => {
    const block: PipeBlock = {
      id: 'pb-1',
      pipeType: 'uppercase',
      params: [],
      position: 0,
    };
    expect(block.id).toBe('pb-1');
    expect(block.pipeType).toBe('uppercase');
    expect(block.params).toEqual([]);
    expect(block.position).toBe(0);
  });

  it('PipeBlock works with a custom pipe name', () => {
    const block: PipeBlock = {
      id: 'pb-custom',
      pipeType: 'my-custom-pipe',
      params: ['arg1', 'arg2'],
      position: 2,
    };
    expect(block.pipeType).toBe('my-custom-pipe');
    expect(block.params).toEqual(['arg1', 'arg2']);
  });

  it('RuntimeStream has required fields: streamId, rawInput, requiredOutput, placedPipes', () => {
    const stream: RuntimeStream = {
      streamId: 'stream-1',
      rawInput: 'hello world',
      requiredOutput: 'HELLO WORLD',
      placedPipes: [],
    };
    expect(stream.streamId).toBe('stream-1');
    expect(stream.rawInput).toBe('hello world');
    expect(stream.requiredOutput).toBe('HELLO WORLD');
    expect(stream.placedPipes).toEqual([]);
  });

  it('TestDataPair has required fields: input, expectedOutput', () => {
    const pair: TestDataPair = {
      input: 'raw',
      expectedOutput: 'transformed',
    };
    expect(pair.input).toBe('raw');
    expect(pair.expectedOutput).toBe('transformed');
  });

  it('CustomPipeSpec has required fields: name, transformFn, pureness', () => {
    const spec: CustomPipeSpec = {
      name: 'reverseText',
      transformFn: 'Reverses the input string',
      pureness: 'pure',
    };
    expect(spec.name).toBe('reverseText');
    expect(spec.transformFn).toBe('Reverses the input string');
    expect(spec.pureness).toBe('pure');
  });

  it('StreamResult has required fields: streamId, actualOutput, isCorrect', () => {
    const result: StreamResult = {
      streamId: 'stream-1',
      actualOutput: 'HELLO WORLD',
      isCorrect: true,
    };
    expect(result.streamId).toBe('stream-1');
    expect(result.actualOutput).toBe('HELLO WORLD');
    expect(result.isCorrect).toBe(true);
  });
});
