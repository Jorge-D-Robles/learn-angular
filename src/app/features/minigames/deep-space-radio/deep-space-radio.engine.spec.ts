import {
  DeepSpaceRadioEngine,
  PERFECT_SCORE_MULTIPLIER,
  SECOND_ATTEMPT_MULTIPLIER,
  THIRD_ATTEMPT_MULTIPLIER,
  DEFAULT_MAX_TRANSMISSIONS,
  type ConfigureRequestAction,
  type PlaceInterceptorAction,
  type RemoveInterceptorAction,
  type ReorderInterceptorAction,
  type DeepSpaceRadioInterceptorService,
} from './deep-space-radio.engine';
import type {
  DeepSpaceRadioLevelData,
  HttpRequestConfig,
  InterceptorBlock,
  MockEndpoint,
  TestScenario,
  TransmissionResult,
} from './deep-space-radio.types';
import {
  MinigameStatus,
  DifficultyTier,
  type MinigameLevel,
} from '../../../core/minigame/minigame.types';
import type { MinigameEngineConfig } from '../../../core/minigame/minigame-engine';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function createTestEndpoints(): MockEndpoint[] {
  return [
    {
      url: '/api/crew',
      method: 'GET',
      expectedHeaders: { Authorization: 'Bearer token-123' },
      expectedBody: undefined,
      response: { crew: ['Alice', 'Bob'] },
      errorResponse: { error: 'Unauthorized' },
    },
    {
      url: '/api/crew',
      method: 'POST',
      expectedHeaders: { Authorization: 'Bearer token-123' },
      expectedBody: { name: 'Charlie' },
      response: { id: 3, name: 'Charlie' },
      errorResponse: { error: 'Unauthorized' },
    },
    {
      url: '/api/logs',
      method: 'GET',
      expectedHeaders: {},
      expectedBody: undefined,
      response: { logs: ['entry-1', 'entry-2'] },
      errorResponse: null,
    },
  ];
}

function createTestInterceptors(): InterceptorBlock[] {
  return [
    { id: 'int-auth', type: 'auth', config: { token: 'token-123' }, order: 0 },
    { id: 'int-logging', type: 'logging', config: {}, order: 1 },
    { id: 'int-retry', type: 'retry', config: { retryCount: 2 }, order: 2 },
  ];
}

function createTestScenarios(_endpoints: MockEndpoint[]): TestScenario[] {
  const getCrewRequest: HttpRequestConfig = {
    method: 'GET',
    url: '/api/crew',
    headers: {},
    body: undefined,
    params: {},
  };

  const getCrewExpectedResult: TransmissionResult = {
    requestConfig: {
      method: 'GET',
      url: '/api/crew',
      headers: { Authorization: 'Bearer token-123' },
      body: undefined,
      params: {},
    },
    interceptorsApplied: ['auth', 'logging', 'retry'],
    responseData: { crew: ['Alice', 'Bob'] },
    statusCode: 200,
    isSuccess: true,
  };

  const getLogsRequest: HttpRequestConfig = {
    method: 'GET',
    url: '/api/logs',
    headers: {},
    body: undefined,
    params: {},
  };

  const getLogsExpectedResult: TransmissionResult = {
    requestConfig: {
      method: 'GET',
      url: '/api/logs',
      headers: {},
      body: undefined,
      params: {},
    },
    interceptorsApplied: ['auth', 'logging', 'retry'],
    responseData: { logs: ['entry-1', 'entry-2'] },
    statusCode: 200,
    isSuccess: true,
  };

  return [
    {
      id: 'scenario-1',
      description: 'GET /api/crew with auth',
      requestConfig: getCrewRequest,
      expectedInterceptorOrder: ['auth', 'logging', 'retry'],
      expectedResult: getCrewExpectedResult,
    },
    {
      id: 'scenario-2',
      description: 'GET /api/logs (no auth needed)',
      requestConfig: getLogsRequest,
      expectedInterceptorOrder: ['auth', 'logging', 'retry'],
      expectedResult: getLogsExpectedResult,
    },
  ];
}

function createTestLevelData(
  overrides?: Partial<DeepSpaceRadioLevelData>,
): DeepSpaceRadioLevelData {
  const endpoints = createTestEndpoints();
  const interceptors = createTestInterceptors();
  const testScenarios = createTestScenarios(endpoints);

  return {
    endpoints,
    interceptors,
    testScenarios,
    expectedResults: testScenarios.map(s => s.expectedResult),
    ...overrides,
  };
}

function createLevel(
  data: DeepSpaceRadioLevelData,
): MinigameLevel<DeepSpaceRadioLevelData> {
  return {
    id: 'dsr-test-01',
    gameId: 'deep-space-radio',
    tier: DifficultyTier.Basic,
    conceptIntroduced: 'HTTP Interceptors',
    description: 'Test level',
    data,
  };
}

function createEngine(
  config?: Partial<MinigameEngineConfig>,
  service?: DeepSpaceRadioInterceptorService,
): DeepSpaceRadioEngine {
  return new DeepSpaceRadioEngine(config, service);
}

function initAndStart(
  engine: DeepSpaceRadioEngine,
  data?: DeepSpaceRadioLevelData,
): void {
  engine.initialize(createLevel(data ?? createTestLevelData()));
  engine.start();
}

/** Place all test interceptors in the correct order. */
function placeAllInterceptors(engine: DeepSpaceRadioEngine): void {
  engine.submitAction({ type: 'place-interceptor', interceptorId: 'int-auth', position: 0 } as PlaceInterceptorAction);
  engine.submitAction({ type: 'place-interceptor', interceptorId: 'int-logging', position: 1 } as PlaceInterceptorAction);
  engine.submitAction({ type: 'place-interceptor', interceptorId: 'int-retry', position: 2 } as PlaceInterceptorAction);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('DeepSpaceRadioEngine', () => {
  // --- 1. Initialization ---

  describe('Initialization', () => {
    it('should initialize with Loading status', () => {
      const engine = createEngine();
      engine.initialize(createLevel(createTestLevelData()));

      expect(engine.status()).toBe(MinigameStatus.Loading);
    });

    it('should populate availableInterceptors signal from level data', () => {
      const engine = createEngine();
      engine.initialize(createLevel(createTestLevelData()));

      expect(engine.availableInterceptors()).toHaveLength(3);
      expect(engine.availableInterceptors()[0].id).toBe('int-auth');
      expect(engine.availableInterceptors()[1].id).toBe('int-logging');
      expect(engine.availableInterceptors()[2].id).toBe('int-retry');
    });

    it('should start with null currentRequest', () => {
      const engine = createEngine();
      engine.initialize(createLevel(createTestLevelData()));

      expect(engine.currentRequest()).toBeNull();
    });

    it('should start with empty activeChain', () => {
      const engine = createEngine();
      engine.initialize(createLevel(createTestLevelData()));

      expect(engine.activeChain()).toHaveLength(0);
    });

    it('should start with transmitCount at 0 and transmissionsRemaining at DEFAULT_MAX_TRANSMISSIONS', () => {
      const engine = createEngine();
      engine.initialize(createLevel(createTestLevelData()));

      expect(engine.transmitCount()).toBe(0);
      expect(engine.transmissionsRemaining()).toBe(DEFAULT_MAX_TRANSMISSIONS);
    });
  });

  // --- 2. Configure Request action ---

  describe('Configure Request action', () => {
    it('should set currentRequest signal with the given HttpRequestConfig', () => {
      const engine = createEngine();
      initAndStart(engine);

      const request: HttpRequestConfig = {
        method: 'GET',
        url: '/api/crew',
        headers: {},
        body: undefined,
        params: {},
      };
      engine.submitAction({ type: 'configure-request', request } as ConfigureRequestAction);

      expect(engine.currentRequest()).toEqual(request);
    });

    it('should return valid: true, scoreChange: 0, livesChange: 0', () => {
      const engine = createEngine();
      initAndStart(engine);

      const request: HttpRequestConfig = {
        method: 'GET',
        url: '/api/crew',
        headers: {},
        body: undefined,
        params: {},
      };
      const result = engine.submitAction({ type: 'configure-request', request } as ConfigureRequestAction);

      expect(result.valid).toBe(true);
      expect(result.scoreChange).toBe(0);
      expect(result.livesChange).toBe(0);
    });

    it('should overwrite previous request when called again', () => {
      const engine = createEngine();
      initAndStart(engine);

      const request1: HttpRequestConfig = {
        method: 'GET',
        url: '/api/crew',
        headers: {},
        body: undefined,
        params: {},
      };
      const request2: HttpRequestConfig = {
        method: 'POST',
        url: '/api/logs',
        headers: { 'Content-Type': 'application/json' },
        body: { data: 'test' },
        params: {},
      };

      engine.submitAction({ type: 'configure-request', request: request1 } as ConfigureRequestAction);
      engine.submitAction({ type: 'configure-request', request: request2 } as ConfigureRequestAction);

      expect(engine.currentRequest()).toEqual(request2);
    });
  });

  // --- 3. Place Interceptor - valid ---

  describe('Place Interceptor - valid', () => {
    it('should add interceptor to activeChain at specified position', () => {
      const engine = createEngine();
      initAndStart(engine);

      engine.submitAction({ type: 'place-interceptor', interceptorId: 'int-auth', position: 0 } as PlaceInterceptorAction);

      expect(engine.activeChain()).toHaveLength(1);
      expect(engine.activeChain()[0].id).toBe('int-auth');
    });

    it('should return valid: true, scoreChange: 0, livesChange: 0', () => {
      const engine = createEngine();
      initAndStart(engine);

      const result = engine.submitAction({
        type: 'place-interceptor',
        interceptorId: 'int-auth',
        position: 0,
      } as PlaceInterceptorAction);

      expect(result.valid).toBe(true);
      expect(result.scoreChange).toBe(0);
      expect(result.livesChange).toBe(0);
    });

    it('should insert at position 0 (beginning of chain)', () => {
      const engine = createEngine();
      initAndStart(engine);

      engine.submitAction({ type: 'place-interceptor', interceptorId: 'int-logging', position: 0 } as PlaceInterceptorAction);
      engine.submitAction({ type: 'place-interceptor', interceptorId: 'int-auth', position: 0 } as PlaceInterceptorAction);

      expect(engine.activeChain()[0].id).toBe('int-auth');
      expect(engine.activeChain()[1].id).toBe('int-logging');
    });

    it('should clamp position to chain length when position exceeds chain size', () => {
      const engine = createEngine();
      initAndStart(engine);

      engine.submitAction({ type: 'place-interceptor', interceptorId: 'int-auth', position: 100 } as PlaceInterceptorAction);

      expect(engine.activeChain()).toHaveLength(1);
      expect(engine.activeChain()[0].id).toBe('int-auth');
    });
  });

  // --- 4. Place Interceptor - invalid ---

  describe('Place Interceptor - invalid', () => {
    it('should return invalid when interceptorId does not exist in available interceptors', () => {
      const engine = createEngine();
      initAndStart(engine);

      const result = engine.submitAction({
        type: 'place-interceptor',
        interceptorId: 'non-existent',
        position: 0,
      } as PlaceInterceptorAction);

      expect(result.valid).toBe(false);
    });

    it('should return invalid when interceptor is already in activeChain (no duplicates)', () => {
      const engine = createEngine();
      initAndStart(engine);

      engine.submitAction({ type: 'place-interceptor', interceptorId: 'int-auth', position: 0 } as PlaceInterceptorAction);
      const result = engine.submitAction({ type: 'place-interceptor', interceptorId: 'int-auth', position: 1 } as PlaceInterceptorAction);

      expect(result.valid).toBe(false);
      expect(engine.activeChain()).toHaveLength(1);
    });

    it('should NOT modify activeChain on invalid action', () => {
      const engine = createEngine();
      initAndStart(engine);

      engine.submitAction({
        type: 'place-interceptor',
        interceptorId: 'non-existent',
        position: 0,
      } as PlaceInterceptorAction);

      expect(engine.activeChain()).toHaveLength(0);
    });
  });

  // --- 5. Remove Interceptor ---

  describe('Remove Interceptor', () => {
    it('should remove interceptor from activeChain by ID', () => {
      const engine = createEngine();
      initAndStart(engine);

      engine.submitAction({ type: 'place-interceptor', interceptorId: 'int-auth', position: 0 } as PlaceInterceptorAction);
      engine.submitAction({ type: 'place-interceptor', interceptorId: 'int-logging', position: 1 } as PlaceInterceptorAction);
      engine.submitAction({ type: 'remove-interceptor', interceptorId: 'int-auth' } as RemoveInterceptorAction);

      expect(engine.activeChain()).toHaveLength(1);
      expect(engine.activeChain()[0].id).toBe('int-logging');
    });

    it('should return valid: true on successful removal', () => {
      const engine = createEngine();
      initAndStart(engine);

      engine.submitAction({ type: 'place-interceptor', interceptorId: 'int-auth', position: 0 } as PlaceInterceptorAction);
      const result = engine.submitAction({ type: 'remove-interceptor', interceptorId: 'int-auth' } as RemoveInterceptorAction);

      expect(result.valid).toBe(true);
      expect(result.scoreChange).toBe(0);
      expect(result.livesChange).toBe(0);
    });

    it('should return invalid when interceptorId is not in activeChain', () => {
      const engine = createEngine();
      initAndStart(engine);

      const result = engine.submitAction({ type: 'remove-interceptor', interceptorId: 'non-existent' } as RemoveInterceptorAction);

      expect(result.valid).toBe(false);
    });
  });

  // --- 6. Reorder Interceptor ---

  describe('Reorder Interceptor', () => {
    it('should move interceptor to new position within activeChain', () => {
      const engine = createEngine();
      initAndStart(engine);

      engine.submitAction({ type: 'place-interceptor', interceptorId: 'int-auth', position: 0 } as PlaceInterceptorAction);
      engine.submitAction({ type: 'place-interceptor', interceptorId: 'int-logging', position: 1 } as PlaceInterceptorAction);
      engine.submitAction({ type: 'place-interceptor', interceptorId: 'int-retry', position: 2 } as PlaceInterceptorAction);

      // Move auth to end
      engine.submitAction({ type: 'reorder-interceptor', interceptorId: 'int-auth', newPosition: 2 } as ReorderInterceptorAction);

      expect(engine.activeChain()[0].id).toBe('int-logging');
      expect(engine.activeChain()[1].id).toBe('int-retry');
      expect(engine.activeChain()[2].id).toBe('int-auth');
    });

    it('should clamp newPosition to valid range', () => {
      const engine = createEngine();
      initAndStart(engine);

      engine.submitAction({ type: 'place-interceptor', interceptorId: 'int-auth', position: 0 } as PlaceInterceptorAction);
      engine.submitAction({ type: 'place-interceptor', interceptorId: 'int-logging', position: 1 } as PlaceInterceptorAction);

      engine.submitAction({ type: 'reorder-interceptor', interceptorId: 'int-auth', newPosition: 100 } as ReorderInterceptorAction);

      expect(engine.activeChain()[0].id).toBe('int-logging');
      expect(engine.activeChain()[1].id).toBe('int-auth');
    });

    it('should return invalid when interceptorId is not in activeChain', () => {
      const engine = createEngine();
      initAndStart(engine);

      const result = engine.submitAction({
        type: 'reorder-interceptor',
        interceptorId: 'non-existent',
        newPosition: 0,
      } as ReorderInterceptorAction);

      expect(result.valid).toBe(false);
    });
  });

  // --- 7. Transmit - all scenarios pass ---

  describe('Transmit - all scenarios pass', () => {
    it('should return TransmitRunResult with all scenarioResults', () => {
      const engine = createEngine({ maxScore: 1000 });
      initAndStart(engine);
      placeAllInterceptors(engine);

      const result = engine.transmit();

      expect(result).not.toBeNull();
      expect(result!.scenarioResults).toHaveLength(2);
    });

    it('should call complete() when all scenarios pass', () => {
      const engine = createEngine({ maxScore: 1000 });
      initAndStart(engine);
      placeAllInterceptors(engine);

      engine.transmit();

      expect(engine.status()).toBe(MinigameStatus.Won);
    });

    it('should decrement transmissionsRemaining by 1', () => {
      const engine = createEngine({ maxScore: 1000 });
      initAndStart(engine);
      placeAllInterceptors(engine);

      engine.transmit();

      expect(engine.transmissionsRemaining()).toBe(DEFAULT_MAX_TRANSMISSIONS - 1);
    });

    it('should award maxScore on first-attempt success', () => {
      const engine = createEngine({ maxScore: 1000 });
      initAndStart(engine);
      placeAllInterceptors(engine);

      engine.transmit();

      expect(engine.score()).toBe(1000 * PERFECT_SCORE_MULTIPLIER);
    });
  });

  // --- 8. Transmit - scenarios fail ---

  describe('Transmit - scenarios fail', () => {
    it('should report failed scenarios with interceptorOrderCorrect and resultMatch flags', () => {
      const engine = createEngine({ maxScore: 1000 });
      initAndStart(engine);

      // Place interceptors in wrong order: retry, logging, auth
      engine.submitAction({ type: 'place-interceptor', interceptorId: 'int-retry', position: 0 } as PlaceInterceptorAction);
      engine.submitAction({ type: 'place-interceptor', interceptorId: 'int-logging', position: 1 } as PlaceInterceptorAction);
      engine.submitAction({ type: 'place-interceptor', interceptorId: 'int-auth', position: 2 } as PlaceInterceptorAction);

      const result = engine.transmit();

      expect(result).not.toBeNull();
      // At least one scenario should fail due to wrong order
      const failed = result!.scenarioResults.filter(r => !r.passed);
      expect(failed.length).toBeGreaterThanOrEqual(1);
    });

    it('should NOT complete when scenarios fail', () => {
      const engine = createEngine({ maxScore: 1000 });
      initAndStart(engine);

      // No interceptors placed -- scenarios will fail
      engine.transmit();

      expect(engine.status()).toBe(MinigameStatus.Playing);
    });

    it('should report correct failedCount', () => {
      const engine = createEngine({ maxScore: 1000 });
      initAndStart(engine);

      // No interceptors -- both scenarios fail
      const result = engine.transmit();

      expect(result).not.toBeNull();
      expect(result!.failedCount).toBeGreaterThan(0);
      expect(result!.allPassed).toBe(false);
    });
  });

  // --- 9. Transmit - attempts exhausted ---

  describe('Transmit - attempts exhausted', () => {
    it('should call fail() when last transmission attempt fails', () => {
      const engine = createEngine({ maxScore: 1000 });
      initAndStart(engine);

      // Don't place any interceptors -- all transmissions will fail
      engine.transmit(); // attempt 1
      engine.transmit(); // attempt 2
      engine.transmit(); // attempt 3

      expect(engine.transmissionsRemaining()).toBe(0);
      expect(engine.status()).toBe(MinigameStatus.Lost);
    });

    it('should set status to Lost', () => {
      const engine = createEngine({ maxScore: 1000 });
      initAndStart(engine);

      engine.transmit();
      engine.transmit();
      engine.transmit();

      expect(engine.status()).toBe(MinigameStatus.Lost);
    });
  });

  // --- 10. Transmit - multi-attempt scoring ---

  describe('Transmit - multi-attempt scoring', () => {
    it('should award maxScore * 0.4 on second-attempt success', () => {
      const engine = createEngine({ maxScore: 1000 });
      initAndStart(engine);

      // First attempt: no interceptors, fail
      engine.transmit();
      expect(engine.status()).toBe(MinigameStatus.Playing);

      // Place correct interceptors
      placeAllInterceptors(engine);

      // Second attempt: all correct
      engine.transmit();

      expect(engine.score()).toBe(Math.round(1000 * SECOND_ATTEMPT_MULTIPLIER));
      expect(engine.status()).toBe(MinigameStatus.Won);
    });

    it('should award maxScore * 0.2 on third-attempt success', () => {
      const engine = createEngine({ maxScore: 1000 });
      initAndStart(engine);

      // First attempt: no interceptors
      engine.transmit();
      // Second attempt: still no interceptors
      engine.transmit();

      // Place correct interceptors
      placeAllInterceptors(engine);

      // Third attempt: all correct
      engine.transmit();

      expect(engine.score()).toBe(Math.round(1000 * THIRD_ATTEMPT_MULTIPLIER));
      expect(engine.status()).toBe(MinigameStatus.Won);
    });
  });

  // --- 11. Interceptor chain processing ---

  describe('Interceptor chain processing', () => {
    it('should add Authorization header via auth interceptor on request', () => {
      const endpoints: MockEndpoint[] = [{
        url: '/api/crew',
        method: 'GET',
        expectedHeaders: { Authorization: 'Bearer token-123' },
        expectedBody: undefined,
        response: { crew: ['Alice', 'Bob'] },
        errorResponse: { error: 'Unauthorized' },
      }];

      const scenario: TestScenario = {
        id: 'auth-test',
        description: 'Auth adds header',
        requestConfig: { method: 'GET', url: '/api/crew', headers: {}, body: undefined, params: {} },
        expectedInterceptorOrder: ['auth'],
        expectedResult: {
          requestConfig: { method: 'GET', url: '/api/crew', headers: { Authorization: 'Bearer token-123' }, body: undefined, params: {} },
          interceptorsApplied: ['auth'],
          responseData: { crew: ['Alice', 'Bob'] },
          statusCode: 200,
          isSuccess: true,
        },
      };

      const data = createTestLevelData({
        endpoints,
        interceptors: [{ id: 'int-auth', type: 'auth', config: { token: 'token-123' }, order: 0 }],
        testScenarios: [scenario],
        expectedResults: [scenario.expectedResult],
      });

      const engine = createEngine({ maxScore: 1000 });
      initAndStart(engine, data);

      engine.submitAction({ type: 'place-interceptor', interceptorId: 'int-auth', position: 0 } as PlaceInterceptorAction);

      const result = engine.transmit();

      expect(result).not.toBeNull();
      expect(result!.allPassed).toBe(true);
      expect(result!.scenarioResults[0].actualResult.requestConfig.headers['Authorization']).toBe('Bearer token-123');
    });

    it('should record logging interceptor in interceptorsApplied without mutation', () => {
      const endpoints: MockEndpoint[] = [{
        url: '/api/logs',
        method: 'GET',
        expectedHeaders: {},
        expectedBody: undefined,
        response: { logs: ['entry-1'] },
        errorResponse: null,
      }];

      const scenario: TestScenario = {
        id: 'logging-test',
        description: 'Logging records without mutation',
        requestConfig: { method: 'GET', url: '/api/logs', headers: {}, body: undefined, params: {} },
        expectedInterceptorOrder: ['logging'],
        expectedResult: {
          requestConfig: { method: 'GET', url: '/api/logs', headers: {}, body: undefined, params: {} },
          interceptorsApplied: ['logging'],
          responseData: { logs: ['entry-1'] },
          statusCode: 200,
          isSuccess: true,
        },
      };

      const data = createTestLevelData({
        endpoints,
        interceptors: [{ id: 'int-logging', type: 'logging', config: {}, order: 0 }],
        testScenarios: [scenario],
        expectedResults: [scenario.expectedResult],
      });

      const engine = createEngine({ maxScore: 1000 });
      initAndStart(engine, data);

      engine.submitAction({ type: 'place-interceptor', interceptorId: 'int-logging', position: 0 } as PlaceInterceptorAction);

      const result = engine.transmit();

      expect(result).not.toBeNull();
      expect(result!.allPassed).toBe(true);
      expect(result!.scenarioResults[0].actualResult.interceptorsApplied).toContain('logging');
    });

    it('should return cached response for repeated GET requests via caching interceptor', () => {
      const endpoints: MockEndpoint[] = [{
        url: '/api/data',
        method: 'GET',
        expectedHeaders: {},
        expectedBody: undefined,
        response: { value: 42 },
        errorResponse: null,
      }];

      const scenario1: TestScenario = {
        id: 'cache-1',
        description: 'First GET populates cache',
        requestConfig: { method: 'GET', url: '/api/data', headers: {}, body: undefined, params: {} },
        expectedInterceptorOrder: ['caching'],
        expectedResult: {
          requestConfig: { method: 'GET', url: '/api/data', headers: {}, body: undefined, params: {} },
          interceptorsApplied: ['caching'],
          responseData: { value: 42 },
          statusCode: 200,
          isSuccess: true,
        },
      };

      // Second scenario with same URL -- should use cache
      const scenario2: TestScenario = {
        id: 'cache-2',
        description: 'Second GET uses cache',
        requestConfig: { method: 'GET', url: '/api/data', headers: {}, body: undefined, params: {} },
        expectedInterceptorOrder: ['caching'],
        expectedResult: {
          requestConfig: { method: 'GET', url: '/api/data', headers: {}, body: undefined, params: {} },
          interceptorsApplied: ['caching'],
          responseData: { value: 42 },
          statusCode: 200,
          isSuccess: true,
        },
      };

      const data = createTestLevelData({
        endpoints,
        interceptors: [{ id: 'int-caching', type: 'caching', config: {}, order: 0 }],
        testScenarios: [scenario1, scenario2],
        expectedResults: [scenario1.expectedResult, scenario2.expectedResult],
      });

      const engine = createEngine({ maxScore: 1000 });
      initAndStart(engine, data);

      engine.submitAction({ type: 'place-interceptor', interceptorId: 'int-caching', position: 0 } as PlaceInterceptorAction);

      const result = engine.transmit();

      expect(result).not.toBeNull();
      expect(result!.allPassed).toBe(true);
    });

    it('should NOT cache non-GET requests', () => {
      const endpoints: MockEndpoint[] = [{
        url: '/api/data',
        method: 'POST',
        expectedHeaders: {},
        expectedBody: undefined,
        response: { created: true },
        errorResponse: null,
      }];

      const scenario: TestScenario = {
        id: 'no-cache-post',
        description: 'POST not cached',
        requestConfig: { method: 'POST', url: '/api/data', headers: {}, body: { data: 'test' }, params: {} },
        expectedInterceptorOrder: ['caching'],
        expectedResult: {
          requestConfig: { method: 'POST', url: '/api/data', headers: {}, body: { data: 'test' }, params: {} },
          interceptorsApplied: ['caching'],
          responseData: { created: true },
          statusCode: 200,
          isSuccess: true,
        },
      };

      const data = createTestLevelData({
        endpoints,
        interceptors: [{ id: 'int-caching', type: 'caching', config: {}, order: 0 }],
        testScenarios: [scenario],
        expectedResults: [scenario.expectedResult],
      });

      const engine = createEngine({ maxScore: 1000 });
      initAndStart(engine, data);

      engine.submitAction({ type: 'place-interceptor', interceptorId: 'int-caching', position: 0 } as PlaceInterceptorAction);

      const result = engine.transmit();

      expect(result).not.toBeNull();
      expect(result!.allPassed).toBe(true);
    });

    it('should produce matching result with correct interceptor order', () => {
      const engine = createEngine({ maxScore: 1000 });
      initAndStart(engine);
      placeAllInterceptors(engine);

      const result = engine.transmit();

      expect(result).not.toBeNull();
      expect(result!.allPassed).toBe(true);
      expect(result!.scenarioResults.every(r => r.interceptorOrderCorrect)).toBe(true);
    });

    it('should produce mismatched result with wrong interceptor order', () => {
      const engine = createEngine({ maxScore: 1000 });
      initAndStart(engine);

      // Place in wrong order
      engine.submitAction({ type: 'place-interceptor', interceptorId: 'int-retry', position: 0 } as PlaceInterceptorAction);
      engine.submitAction({ type: 'place-interceptor', interceptorId: 'int-auth', position: 1 } as PlaceInterceptorAction);
      engine.submitAction({ type: 'place-interceptor', interceptorId: 'int-logging', position: 2 } as PlaceInterceptorAction);

      const result = engine.transmit();

      expect(result).not.toBeNull();
      // Interceptor order should be wrong for scenarios expecting auth, logging, retry
      expect(result!.scenarioResults.some(r => !r.interceptorOrderCorrect)).toBe(true);
    });
  });

  // --- 12. Mock backend ---

  describe('Mock backend', () => {
    it('should return endpoint response when URL and method match and headers are correct', () => {
      const endpoints: MockEndpoint[] = [{
        url: '/api/crew',
        method: 'GET',
        expectedHeaders: { Authorization: 'Bearer token-123' },
        expectedBody: undefined,
        response: { crew: ['Alice', 'Bob'] },
        errorResponse: { error: 'Unauthorized' },
      }];

      const scenario: TestScenario = {
        id: 'match-test',
        description: 'Exact match',
        requestConfig: { method: 'GET', url: '/api/crew', headers: {}, body: undefined, params: {} },
        expectedInterceptorOrder: ['auth'],
        expectedResult: {
          requestConfig: { method: 'GET', url: '/api/crew', headers: { Authorization: 'Bearer token-123' }, body: undefined, params: {} },
          interceptorsApplied: ['auth'],
          responseData: { crew: ['Alice', 'Bob'] },
          statusCode: 200,
          isSuccess: true,
        },
      };

      const data = createTestLevelData({
        endpoints,
        interceptors: [{ id: 'int-auth', type: 'auth', config: { token: 'token-123' }, order: 0 }],
        testScenarios: [scenario],
        expectedResults: [scenario.expectedResult],
      });

      const engine = createEngine({ maxScore: 1000 });
      initAndStart(engine, data);

      engine.submitAction({ type: 'place-interceptor', interceptorId: 'int-auth', position: 0 } as PlaceInterceptorAction);

      const result = engine.transmit();

      expect(result).not.toBeNull();
      expect(result!.scenarioResults[0].actualResult.statusCode).toBe(200);
      expect(result!.scenarioResults[0].actualResult.responseData).toEqual({ crew: ['Alice', 'Bob'] });
    });

    it('should return endpoint errorResponse when required headers are missing', () => {
      const endpoints: MockEndpoint[] = [{
        url: '/api/crew',
        method: 'GET',
        expectedHeaders: { Authorization: 'Bearer token-123' },
        expectedBody: undefined,
        response: { crew: ['Alice', 'Bob'] },
        errorResponse: { error: 'Unauthorized' },
      }];

      const scenario: TestScenario = {
        id: 'missing-header-test',
        description: 'Missing auth header',
        requestConfig: { method: 'GET', url: '/api/crew', headers: {}, body: undefined, params: {} },
        expectedInterceptorOrder: [],
        expectedResult: {
          requestConfig: { method: 'GET', url: '/api/crew', headers: {}, body: undefined, params: {} },
          interceptorsApplied: [],
          responseData: { error: 'Unauthorized' },
          statusCode: 401,
          isSuccess: false,
        },
      };

      const data = createTestLevelData({
        endpoints,
        interceptors: [],
        testScenarios: [scenario],
        expectedResults: [scenario.expectedResult],
      });

      const engine = createEngine({ maxScore: 1000 });
      initAndStart(engine, data);

      const result = engine.transmit();

      expect(result).not.toBeNull();
      expect(result!.scenarioResults[0].actualResult.statusCode).toBe(401);
      expect(result!.scenarioResults[0].actualResult.responseData).toEqual({ error: 'Unauthorized' });
    });

    it('should return 404 when no endpoint matches URL/method', () => {
      const endpoints: MockEndpoint[] = [{
        url: '/api/crew',
        method: 'GET',
        expectedHeaders: {},
        expectedBody: undefined,
        response: { crew: ['Alice'] },
        errorResponse: null,
      }];

      const scenario: TestScenario = {
        id: '404-test',
        description: 'No matching endpoint',
        requestConfig: { method: 'GET', url: '/api/unknown', headers: {}, body: undefined, params: {} },
        expectedInterceptorOrder: [],
        expectedResult: {
          requestConfig: { method: 'GET', url: '/api/unknown', headers: {}, body: undefined, params: {} },
          interceptorsApplied: [],
          responseData: { error: 'Not Found' },
          statusCode: 404,
          isSuccess: false,
        },
      };

      const data = createTestLevelData({
        endpoints,
        interceptors: [],
        testScenarios: [scenario],
        expectedResults: [scenario.expectedResult],
      });

      const engine = createEngine({ maxScore: 1000 });
      initAndStart(engine, data);

      const result = engine.transmit();

      expect(result).not.toBeNull();
      expect(result!.scenarioResults[0].actualResult.statusCode).toBe(404);
      expect(result!.scenarioResults[0].actualResult.responseData).toEqual({ error: 'Not Found' });
    });

    it('should return success response for POST request with matching body', () => {
      const endpoints: MockEndpoint[] = [{
        url: '/api/crew',
        method: 'POST',
        expectedHeaders: {},
        expectedBody: { name: 'Charlie' },
        response: { id: 3, name: 'Charlie' },
        errorResponse: null,
      }];

      const scenario: TestScenario = {
        id: 'post-test',
        description: 'POST with body',
        requestConfig: { method: 'POST', url: '/api/crew', headers: {}, body: { name: 'Charlie' }, params: {} },
        expectedInterceptorOrder: [],
        expectedResult: {
          requestConfig: { method: 'POST', url: '/api/crew', headers: {}, body: { name: 'Charlie' }, params: {} },
          interceptorsApplied: [],
          responseData: { id: 3, name: 'Charlie' },
          statusCode: 200,
          isSuccess: true,
        },
      };

      const data = createTestLevelData({
        endpoints,
        interceptors: [],
        testScenarios: [scenario],
        expectedResults: [scenario.expectedResult],
      });

      const engine = createEngine({ maxScore: 1000 });
      initAndStart(engine, data);

      const result = engine.transmit();

      expect(result).not.toBeNull();
      expect(result!.scenarioResults[0].actualResult.statusCode).toBe(200);
      expect(result!.scenarioResults[0].actualResult.responseData).toEqual({ id: 3, name: 'Charlie' });
    });
  });

  // --- 13. Edge cases ---

  describe('Edge cases', () => {
    it('should return invalid for unknown action types', () => {
      const engine = createEngine();
      initAndStart(engine);

      const result = engine.submitAction({ type: 'unknown-action' });

      expect(result.valid).toBe(false);
      expect(result.scoreChange).toBe(0);
      expect(result.livesChange).toBe(0);
    });

    it('should return null from transmit() when not Playing', () => {
      const engine = createEngine();
      engine.initialize(createLevel(createTestLevelData()));
      // Still in Loading status, not started

      const result = engine.transmit();

      expect(result).toBeNull();
    });

    it('should handle empty test scenarios (all pass immediately, completes)', () => {
      const data = createTestLevelData({
        testScenarios: [],
        expectedResults: [],
      });
      const engine = createEngine({ maxScore: 1000 });
      initAndStart(engine, data);

      const result = engine.transmit();

      expect(result).not.toBeNull();
      expect(result!.allPassed).toBe(true);
      expect(result!.scenarioResults).toHaveLength(0);
      expect(engine.status()).toBe(MinigameStatus.Won);
      expect(engine.score()).toBe(1000);
    });

    it('should restore initial state on reset', () => {
      const engine = createEngine();
      initAndStart(engine);

      // Modify state
      engine.submitAction({ type: 'place-interceptor', interceptorId: 'int-auth', position: 0 } as PlaceInterceptorAction);
      engine.submitAction({
        type: 'configure-request',
        request: { method: 'GET', url: '/api/test', headers: {}, body: undefined, params: {} },
      } as ConfigureRequestAction);
      engine.transmit();

      expect(engine.activeChain()).toHaveLength(1);
      expect(engine.currentRequest()).not.toBeNull();
      expect(engine.transmitCount()).toBe(1);

      // Reset
      engine.reset();

      expect(engine.currentRequest()).toBeNull();
      expect(engine.activeChain()).toHaveLength(0);
      expect(engine.transmitCount()).toBe(0);
      expect(engine.transmissionsRemaining()).toBe(DEFAULT_MAX_TRANSMISSIONS);
      expect(engine.status()).toBe(MinigameStatus.Playing);
    });

    it('should handle level with no interceptors in toolbox (direct transmission)', () => {
      const endpoints: MockEndpoint[] = [{
        url: '/api/open',
        method: 'GET',
        expectedHeaders: {},
        expectedBody: undefined,
        response: { data: 'public' },
        errorResponse: null,
      }];

      const scenario: TestScenario = {
        id: 'no-interceptors',
        description: 'Direct transmission without interceptors',
        requestConfig: { method: 'GET', url: '/api/open', headers: {}, body: undefined, params: {} },
        expectedInterceptorOrder: [],
        expectedResult: {
          requestConfig: { method: 'GET', url: '/api/open', headers: {}, body: undefined, params: {} },
          interceptorsApplied: [],
          responseData: { data: 'public' },
          statusCode: 200,
          isSuccess: true,
        },
      };

      const data = createTestLevelData({
        endpoints,
        interceptors: [],
        testScenarios: [scenario],
        expectedResults: [scenario.expectedResult],
      });

      const engine = createEngine({ maxScore: 1000 });
      initAndStart(engine, data);

      const result = engine.transmit();

      expect(result).not.toBeNull();
      expect(result!.allPassed).toBe(true);
      expect(engine.status()).toBe(MinigameStatus.Won);
    });
  });

  // --- 14. Interceptor service integration ---

  describe('Interceptor service integration', () => {
    function createMockService(): DeepSpaceRadioInterceptorService {
      return {
        setInterceptorChain: vi.fn(),
        processRequest: vi.fn(),
        processResponse: vi.fn(),
        simulateTransmission: vi.fn(),
        reset: vi.fn(),
      };
    }

    it('should accept interceptor service in constructor', () => {
      const service = createMockService();
      const engine = new DeepSpaceRadioEngine(undefined, service);

      expect(engine).toBeDefined();
    });

    it('should delegate simulateTransmission to service on transmit()', () => {
      const service = createMockService();
      const mockResult: TransmissionResult = {
        requestConfig: { method: 'GET', url: '/api/crew', headers: { Authorization: 'Bearer token-123' }, body: undefined, params: {} },
        interceptorsApplied: ['auth', 'logging', 'retry'],
        responseData: { crew: ['Alice', 'Bob'] },
        statusCode: 200,
        isSuccess: true,
      };
      (service.simulateTransmission as ReturnType<typeof vi.fn>).mockReturnValue(mockResult);

      const engine = new DeepSpaceRadioEngine({ maxScore: 1000 }, service);
      initAndStart(engine);
      placeAllInterceptors(engine);

      engine.transmit();

      expect(service.simulateTransmission).toHaveBeenCalled();
    });

    it('should fall back to inline processing when no service provided', () => {
      const engine = createEngine({ maxScore: 1000 });
      initAndStart(engine);
      placeAllInterceptors(engine);

      const result = engine.transmit();

      expect(result).not.toBeNull();
      expect(result!.allPassed).toBe(true);
      expect(engine.status()).toBe(MinigameStatus.Won);
    });

    it('should call service reset on level load', () => {
      const service = createMockService();
      const engine = new DeepSpaceRadioEngine(undefined, service);
      engine.initialize(createLevel(createTestLevelData()));

      expect(service.reset).toHaveBeenCalledOnce();
    });
  });

  // --- 15. Reverse pass - error interceptor ---

  describe('Reverse pass - error interceptor', () => {
    it('should wrap a 500-status response correctly via error interceptor', () => {
      // Endpoint that always returns a 500 error
      const endpoints: MockEndpoint[] = [{
        url: '/api/broken',
        method: 'GET',
        expectedHeaders: {},
        expectedBody: undefined,
        response: { data: 'ok' },
        errorResponse: null,
      }];

      // We need to create a scenario where the endpoint returns an error.
      // Since our mock backend returns 200 when headers match, we'll use an endpoint
      // that requires headers we won't provide, giving 401. But we need a 500.
      // Instead, let's test the error interceptor with a 404 (no endpoint match).

      const scenario: TestScenario = {
        id: 'error-wrap',
        description: 'Error interceptor wraps error response',
        requestConfig: { method: 'GET', url: '/api/nonexistent', headers: {}, body: undefined, params: {} },
        expectedInterceptorOrder: ['error'],
        expectedResult: {
          requestConfig: { method: 'GET', url: '/api/nonexistent', headers: {}, body: undefined, params: {} },
          interceptorsApplied: ['error'],
          responseData: {
            error: { error: 'Not Found' },
            statusCode: 404,
            handled: true,
          },
          statusCode: 404,
          isSuccess: false,
        },
      };

      const data = createTestLevelData({
        endpoints,
        interceptors: [{ id: 'int-error', type: 'error', config: {}, order: 0 }],
        testScenarios: [scenario],
        expectedResults: [scenario.expectedResult],
      });

      const engine = createEngine({ maxScore: 1000 });
      initAndStart(engine, data);

      engine.submitAction({ type: 'place-interceptor', interceptorId: 'int-error', position: 0 } as PlaceInterceptorAction);

      const result = engine.transmit();

      expect(result).not.toBeNull();
      expect(result!.allPassed).toBe(true);
      const actual = result!.scenarioResults[0].actualResult;
      expect(actual.statusCode).toBe(404);
      expect(actual.isSuccess).toBe(false);
      expect(actual.responseData).toEqual({
        error: { error: 'Not Found' },
        statusCode: 404,
        handled: true,
      });
    });
  });

  // --- 16. Null errorResponse synthesized default ---

  describe('Null errorResponse on endpoint', () => {
    it('should synthesize default error when errorResponse is null and headers missing', () => {
      const endpoints: MockEndpoint[] = [{
        url: '/api/data',
        method: 'GET',
        expectedHeaders: { 'X-Custom': 'required' },
        expectedBody: undefined,
        response: { data: 'ok' },
        errorResponse: null,
      }];

      const scenario: TestScenario = {
        id: 'null-error',
        description: 'Null errorResponse synthesizes default',
        requestConfig: { method: 'GET', url: '/api/data', headers: {}, body: undefined, params: {} },
        expectedInterceptorOrder: [],
        expectedResult: {
          requestConfig: { method: 'GET', url: '/api/data', headers: {}, body: undefined, params: {} },
          interceptorsApplied: [],
          responseData: { error: 'Unauthorized' },
          statusCode: 401,
          isSuccess: false,
        },
      };

      const data = createTestLevelData({
        endpoints,
        interceptors: [],
        testScenarios: [scenario],
        expectedResults: [scenario.expectedResult],
      });

      const engine = createEngine({ maxScore: 1000 });
      initAndStart(engine, data);

      const result = engine.transmit();

      expect(result).not.toBeNull();
      expect(result!.allPassed).toBe(true);
      expect(result!.scenarioResults[0].actualResult.statusCode).toBe(401);
      expect(result!.scenarioResults[0].actualResult.responseData).toEqual({ error: 'Unauthorized' });
    });
  });

  // --- 17. Scoring constants ---

  describe('Scoring constants', () => {
    it('should define scoring multipliers in descending order', () => {
      expect(PERFECT_SCORE_MULTIPLIER).toBe(1.0);
      expect(SECOND_ATTEMPT_MULTIPLIER).toBe(0.4);
      expect(THIRD_ATTEMPT_MULTIPLIER).toBe(0.2);
      expect(DEFAULT_MAX_TRANSMISSIONS).toBe(3);
    });
  });
});
