import { DifficultyTier } from '../../core/minigame/minigame.types';
import type { LevelDefinition, LevelPack } from '../../core/levels/level.types';
import type {
  DeepSpaceRadioLevelData,
  MockEndpoint,
  InterceptorBlock,
  HttpRequestConfig,
  TestScenario,
  TransmissionResult,
  HttpMethod,
  InterceptorType,
} from '../../features/minigames/deep-space-radio/deep-space-radio.types';

// ---------------------------------------------------------------------------
// Builder helpers (private to this file)
// ---------------------------------------------------------------------------

/** Build a MockEndpoint with sensible defaults. */
function endpoint(
  url: string,
  method: HttpMethod,
  opts?: {
    expectedHeaders?: Record<string, string>;
    expectedBody?: unknown;
    response?: unknown;
    errorResponse?: unknown;
  },
): MockEndpoint {
  return {
    url,
    method,
    expectedHeaders: opts?.expectedHeaders ?? {},
    expectedBody: opts?.expectedBody ?? null,
    response: opts?.response ?? null,
    errorResponse: opts?.errorResponse ?? null,
  };
}

/** Build an InterceptorBlock. */
function interceptor(
  id: string,
  type: InterceptorType,
  order: number,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  config?: Record<string, any>,
): InterceptorBlock {
  return { id, type, config: config ?? {}, order };
}

/** Build an HttpRequestConfig with sensible defaults. */
function request(
  method: HttpMethod,
  url: string,
  opts?: {
    headers?: Record<string, string>;
    body?: unknown;
    params?: Record<string, string>;
  },
): HttpRequestConfig {
  return {
    method,
    url,
    headers: opts?.headers ?? {},
    body: opts?.body ?? undefined,
    params: opts?.params ?? {},
  };
}

/** Build a TransmissionResult. */
function result(
  reqConfig: HttpRequestConfig,
  interceptorsApplied: readonly InterceptorType[],
  responseData: unknown,
  statusCode: number,
  isSuccess: boolean,
): TransmissionResult {
  return { requestConfig: reqConfig, interceptorsApplied, responseData, statusCode, isSuccess };
}

/** Build a TestScenario. */
function scenario(
  id: string,
  description: string,
  reqConfig: HttpRequestConfig,
  expectedInterceptorOrder: readonly InterceptorType[],
  expectedResult: TransmissionResult,
): TestScenario {
  return { id, description, requestConfig: reqConfig, expectedInterceptorOrder, expectedResult };
}

// ---------------------------------------------------------------------------
// Level definitions
// ---------------------------------------------------------------------------

export const DEEP_SPACE_RADIO_LEVELS: readonly LevelDefinition<DeepSpaceRadioLevelData>[] = [
  // =========================================================================
  // BASIC TIER (Levels 1-6)
  // =========================================================================

  // Level 1 — HttpClient GET
  (() => {
    const ep = endpoint('/api/crew/roster', 'GET', {
      response: { crew: ['Commander Vega', 'Engineer Park'] },
    });
    const req = request('GET', '/api/crew/roster');
    const res = result(req, [], { crew: ['Commander Vega', 'Engineer Park'] }, 200, true);
    const sc = scenario('dsr-b01-sc-1', 'Fetch crew roster via GET', req, [], res);
    return {
      levelId: 'dsr-basic-01',
      gameId: 'deep-space-radio' as const,
      tier: DifficultyTier.Basic,
      order: 1,
      title: 'First Transmission',
      conceptIntroduced: 'HttpClient GET',
      description: 'Send a simple GET request to fetch the crew roster from Mission Control.',
      data: {
        endpoints: [ep],
        interceptors: [],
        testScenarios: [sc],
        expectedResults: [res],
      },
    };
  })(),

  // Level 2 — Typed responses
  (() => {
    const ep = endpoint('/api/systems/status', 'GET', {
      response: { systemId: 'life-support', status: 'nominal', temperature: 22 },
    });
    const req = request('GET', '/api/systems/status');
    const res = result(
      req, [], { systemId: 'life-support', status: 'nominal', temperature: 22 }, 200, true,
    );
    const sc = scenario('dsr-b02-sc-1', 'Fetch typed system status', req, [], res);
    return {
      levelId: 'dsr-basic-02',
      gameId: 'deep-space-radio' as const,
      tier: DifficultyTier.Basic,
      order: 2,
      title: 'Typed Signals',
      conceptIntroduced: 'Typed responses',
      description: 'Specify a response type interface to parse system status data.',
      data: {
        endpoints: [ep],
        interceptors: [],
        testScenarios: [sc],
        expectedResults: [res],
      },
    };
  })(),

  // Level 3 — POST request
  (() => {
    const ep = endpoint('/api/messages', 'POST', {
      expectedBody: { to: 'Mission Control', content: 'Status report' },
      response: { messageId: 'msg-001', sent: true },
    });
    const req = request('POST', '/api/messages', {
      body: { to: 'Mission Control', content: 'Status report' },
    });
    const res = result(req, [], { messageId: 'msg-001', sent: true }, 201, true);
    const sc = scenario('dsr-b03-sc-1', 'Send message to Mission Control', req, [], res);
    return {
      levelId: 'dsr-basic-03',
      gameId: 'deep-space-radio' as const,
      tier: DifficultyTier.Basic,
      order: 3,
      title: 'Outbound Message',
      conceptIntroduced: 'POST request',
      description: 'Send data to Mission Control using a POST request.',
      data: {
        endpoints: [ep],
        interceptors: [],
        testScenarios: [sc],
        expectedResults: [res],
      },
    };
  })(),

  // Level 4 — PUT / DELETE
  (() => {
    const epPut = endpoint('/api/missions/m-42', 'PUT', {
      expectedBody: { status: 'completed' },
      response: { missionId: 'm-42', status: 'completed' },
    });
    const epDelete = endpoint('/api/missions/m-99', 'DELETE', {
      response: { deleted: true },
    });
    const reqPut = request('PUT', '/api/missions/m-42', {
      body: { status: 'completed' },
    });
    const reqDelete = request('DELETE', '/api/missions/m-99');
    const resPut = result(
      reqPut, [], { missionId: 'm-42', status: 'completed' }, 200, true,
    );
    const resDelete = result(reqDelete, [], { deleted: true }, 200, true);
    const sc1 = scenario('dsr-b04-sc-1', 'Update mission status via PUT', reqPut, [], resPut);
    const sc2 = scenario('dsr-b04-sc-2', 'Remove old mission via DELETE', reqDelete, [], resDelete);
    return {
      levelId: 'dsr-basic-04',
      gameId: 'deep-space-radio' as const,
      tier: DifficultyTier.Basic,
      order: 4,
      title: 'Update & Remove',
      conceptIntroduced: 'PUT / DELETE',
      description: 'Update and delete mission records using PUT and DELETE requests.',
      data: {
        endpoints: [epPut, epDelete],
        interceptors: [],
        testScenarios: [sc1, sc2],
        expectedResults: [resPut, resDelete],
      },
    };
  })(),

  // Level 5 — Headers
  (() => {
    const ep = endpoint('/api/classified/briefing', 'GET', {
      expectedHeaders: { 'X-Clearance-Level': 'alpha' },
      response: { briefing: 'Operation Starfall commences at 0600.' },
    });
    const req = request('GET', '/api/classified/briefing', {
      headers: { 'X-Clearance-Level': 'alpha' },
    });
    const res = result(
      req, [], { briefing: 'Operation Starfall commences at 0600.' }, 200, true,
    );
    const sc = scenario('dsr-b05-sc-1', 'Fetch briefing with clearance header', req, [], res);
    return {
      levelId: 'dsr-basic-05',
      gameId: 'deep-space-radio' as const,
      tier: DifficultyTier.Basic,
      order: 5,
      title: 'Secure Channel',
      conceptIntroduced: 'Headers',
      description: 'Add custom headers to requests for classified data.',
      data: {
        endpoints: [ep],
        interceptors: [],
        testScenarios: [sc],
        expectedResults: [res],
      },
    };
  })(),

  // Level 6 — Error handling
  (() => {
    const ep = endpoint('/api/navigation/coordinates', 'GET', {
      response: { coordinates: { x: 142, y: 87, z: -33 } },
      errorResponse: { error: 'Navigation system offline', code: 503 },
    });
    const reqOk = request('GET', '/api/navigation/coordinates');
    const resOk = result(
      reqOk, [], { coordinates: { x: 142, y: 87, z: -33 } }, 200, true,
    );
    const reqFail = request('GET', '/api/navigation/coordinates', {
      headers: { 'X-Simulate-Error': 'true' },
    });
    const resFail = result(
      reqFail, [], { error: 'Navigation system offline', code: 503 }, 503, false,
    );
    const sc1 = scenario('dsr-b06-sc-1', 'Successful coordinate fetch', reqOk, [], resOk);
    const sc2 = scenario('dsr-b06-sc-2', 'Handle navigation error response', reqFail, [], resFail);
    return {
      levelId: 'dsr-basic-06',
      gameId: 'deep-space-radio' as const,
      tier: DifficultyTier.Basic,
      order: 6,
      title: 'Signal Lost',
      conceptIntroduced: 'Error handling',
      description: 'Use catchError to handle failed requests gracefully.',
      data: {
        endpoints: [ep],
        interceptors: [],
        testScenarios: [sc1, sc2],
        expectedResults: [resOk, resFail],
      },
    };
  })(),

  // =========================================================================
  // INTERMEDIATE TIER (Levels 7-12)
  // =========================================================================

  // Level 7 — First interceptor (auth)
  (() => {
    const ep = endpoint('/api/crew/roster', 'GET', {
      expectedHeaders: { Authorization: 'Bearer station-token-001' },
      response: { crew: ['Commander Vega'] },
    });
    const int1 = interceptor('dsr-i01-int-1', 'auth', 1, { token: 'station-token-001' });
    const req = request('GET', '/api/crew/roster');
    const res = result(req, ['auth'], { crew: ['Commander Vega'] }, 200, true);
    const sc = scenario('dsr-i01-sc-1', 'Auth interceptor adds bearer token', req, ['auth'], res);
    return {
      levelId: 'dsr-intermediate-01',
      gameId: 'deep-space-radio' as const,
      tier: DifficultyTier.Intermediate,
      order: 1,
      title: 'Authentication Protocol',
      conceptIntroduced: 'First interceptor',
      description: 'Add an auth interceptor that attaches a bearer token to requests.',
      data: {
        endpoints: [ep],
        interceptors: [int1],
        testScenarios: [sc],
        expectedResults: [res],
      },
    };
  })(),

  // Level 8 — Logging interceptor
  (() => {
    const ep = endpoint('/api/systems/diagnostics', 'GET', {
      response: { systems: [{ name: 'reactor', ok: true }] },
    });
    const int1 = interceptor('dsr-i02-int-1', 'logging', 1, { logLevel: 'verbose' });
    const req = request('GET', '/api/systems/diagnostics');
    const res = result(req, ['logging'], { systems: [{ name: 'reactor', ok: true }] }, 200, true);
    const sc = scenario(
      'dsr-i02-sc-1', 'Logging interceptor records request/response', req, ['logging'], res,
    );
    return {
      levelId: 'dsr-intermediate-02',
      gameId: 'deep-space-radio' as const,
      tier: DifficultyTier.Intermediate,
      order: 2,
      title: 'Flight Recorder',
      conceptIntroduced: 'Logging interceptor',
      description: 'Log request and response details for debugging.',
      data: {
        endpoints: [ep],
        interceptors: [int1],
        testScenarios: [sc],
        expectedResults: [res],
      },
    };
  })(),

  // Level 9 — Interceptor ordering
  (() => {
    const ep = endpoint('/api/crew/assignments', 'GET', {
      expectedHeaders: { Authorization: 'Bearer cmd-token' },
      response: { assignments: ['bridge', 'engineering'] },
    });
    const int1 = interceptor('dsr-i03-int-1', 'auth', 1, { token: 'cmd-token' });
    const int2 = interceptor('dsr-i03-int-2', 'logging', 2, { logLevel: 'info' });
    const req = request('GET', '/api/crew/assignments');
    const res = result(
      req, ['auth', 'logging'], { assignments: ['bridge', 'engineering'] }, 200, true,
    );
    const sc = scenario(
      'dsr-i03-sc-1', 'Auth runs before logging in the chain', req, ['auth', 'logging'], res,
    );
    return {
      levelId: 'dsr-intermediate-03',
      gameId: 'deep-space-radio' as const,
      tier: DifficultyTier.Intermediate,
      order: 3,
      title: 'Chain of Command',
      conceptIntroduced: 'Interceptor ordering',
      description: 'Order matters: auth must execute before logging.',
      data: {
        endpoints: [ep],
        interceptors: [int1, int2],
        testScenarios: [sc],
        expectedResults: [res],
      },
    };
  })(),

  // Level 10 — Error interceptor
  (() => {
    const ep = endpoint('/api/power/status', 'GET', {
      response: { power: 'nominal' },
      errorResponse: { error: 'Power grid failure', code: 500 },
    });
    const int1 = interceptor('dsr-i04-int-1', 'error', 1, { notifyUser: true });
    const reqOk = request('GET', '/api/power/status');
    const resOk = result(reqOk, ['error'], { power: 'nominal' }, 200, true);
    const reqFail = request('GET', '/api/power/status', {
      headers: { 'X-Simulate-Error': 'true' },
    });
    const resFail = result(
      reqFail, ['error'], { error: 'Power grid failure', code: 500 }, 500, false,
    );
    const sc1 = scenario('dsr-i04-sc-1', 'Successful request passes through error interceptor', reqOk, ['error'], resOk);
    const sc2 = scenario('dsr-i04-sc-2', 'Error interceptor catches server failure', reqFail, ['error'], resFail);
    return {
      levelId: 'dsr-intermediate-04',
      gameId: 'deep-space-radio' as const,
      tier: DifficultyTier.Intermediate,
      order: 4,
      title: 'Error Shields',
      conceptIntroduced: 'Error interceptor',
      description: 'Add a global error handling interceptor.',
      data: {
        endpoints: [ep],
        interceptors: [int1],
        testScenarios: [sc1, sc2],
        expectedResults: [resOk, resFail],
      },
    };
  })(),

  // Level 11 — Retry interceptor
  (() => {
    const ep = endpoint('/api/comms/relay', 'POST', {
      expectedBody: { signal: 'ping' },
      response: { acknowledged: true },
      errorResponse: { error: 'Relay timeout', code: 504 },
    });
    const int1 = interceptor('dsr-i05-int-1', 'retry', 1, { maxRetries: 3, delayMs: 1000 });
    const req = request('POST', '/api/comms/relay', { body: { signal: 'ping' } });
    const res = result(req, ['retry'], { acknowledged: true }, 200, true);
    const reqTimeout = request('POST', '/api/comms/relay', {
      body: { signal: 'ping' },
      headers: { 'X-Simulate-Error': 'true' },
    });
    const resTimeout = result(
      reqTimeout, ['retry'], { error: 'Relay timeout', code: 504 }, 504, false,
    );
    const sc1 = scenario('dsr-i05-sc-1', 'Retry interceptor succeeds on first attempt', req, ['retry'], res);
    const sc2 = scenario('dsr-i05-sc-2', 'Retry interceptor exhausts retries', reqTimeout, ['retry'], resTimeout);
    return {
      levelId: 'dsr-intermediate-05',
      gameId: 'deep-space-radio' as const,
      tier: DifficultyTier.Intermediate,
      order: 5,
      title: 'Retry Protocol',
      conceptIntroduced: 'Retry interceptor',
      description: 'Retry failed requests with exponential backoff.',
      data: {
        endpoints: [ep],
        interceptors: [int1],
        testScenarios: [sc1, sc2],
        expectedResults: [res, resTimeout],
      },
    };
  })(),

  // Level 12 — Multiple interceptors
  (() => {
    const ep1 = endpoint('/api/missions/active', 'GET', {
      expectedHeaders: { Authorization: 'Bearer ops-token' },
      response: { missions: ['rescue', 'survey'] },
    });
    const ep2 = endpoint('/api/missions/report', 'POST', {
      expectedHeaders: { Authorization: 'Bearer ops-token' },
      expectedBody: { missionId: 'rescue', status: 'complete' },
      response: { filed: true },
    });
    const int1 = interceptor('dsr-i06-int-1', 'auth', 1, { token: 'ops-token' });
    const int2 = interceptor('dsr-i06-int-2', 'logging', 2, { logLevel: 'info' });
    const int3 = interceptor('dsr-i06-int-3', 'retry', 3, { maxRetries: 2, delayMs: 500 });
    const int4 = interceptor('dsr-i06-int-4', 'error', 4, { notifyUser: true });
    const reqGet = request('GET', '/api/missions/active');
    const resGet = result(
      reqGet, ['auth', 'logging', 'retry', 'error'],
      { missions: ['rescue', 'survey'] }, 200, true,
    );
    const reqPost = request('POST', '/api/missions/report', {
      body: { missionId: 'rescue', status: 'complete' },
    });
    const resPost = result(
      reqPost, ['auth', 'logging', 'retry', 'error'], { filed: true }, 201, true,
    );
    const sc1 = scenario(
      'dsr-i06-sc-1', 'GET through full interceptor chain', reqGet,
      ['auth', 'logging', 'retry', 'error'], resGet,
    );
    const sc2 = scenario(
      'dsr-i06-sc-2', 'POST through full interceptor chain', reqPost,
      ['auth', 'logging', 'retry', 'error'], resPost,
    );
    return {
      levelId: 'dsr-intermediate-06',
      gameId: 'deep-space-radio' as const,
      tier: DifficultyTier.Intermediate,
      order: 6,
      title: 'Full Protocol Stack',
      conceptIntroduced: 'Multiple interceptors',
      description: 'Build a full chain: auth -> logging -> retry -> error.',
      data: {
        endpoints: [ep1, ep2],
        interceptors: [int1, int2, int3, int4],
        testScenarios: [sc1, sc2],
        expectedResults: [resGet, resPost],
      },
    };
  })(),

  // =========================================================================
  // ADVANCED TIER (Levels 13-17)
  // =========================================================================

  // Level 13 — Functional interceptors
  (() => {
    const ep1 = endpoint('/api/sensors/temperature', 'GET', {
      response: { temperature: 18.5, unit: 'C' },
    });
    const ep2 = endpoint('/api/sensors/radiation', 'GET', {
      response: { level: 0.02, unit: 'Sv' },
    });
    const int1 = interceptor('dsr-a01-int-1', 'logging', 1, { functional: true, logLevel: 'debug' });
    const int2 = interceptor('dsr-a01-int-2', 'auth', 2, { functional: true, token: 'sensor-key' });
    const req1 = request('GET', '/api/sensors/temperature');
    const res1 = result(
      req1, ['logging', 'auth'], { temperature: 18.5, unit: 'C' }, 200, true,
    );
    const req2 = request('GET', '/api/sensors/radiation');
    const res2 = result(
      req2, ['logging', 'auth'], { level: 0.02, unit: 'Sv' }, 200, true,
    );
    const sc1 = scenario(
      'dsr-a01-sc-1', 'Functional interceptors on temperature read', req1,
      ['logging', 'auth'], res1,
    );
    const sc2 = scenario(
      'dsr-a01-sc-2', 'Functional interceptors on radiation read', req2,
      ['logging', 'auth'], res2,
    );
    return {
      levelId: 'dsr-advanced-01',
      gameId: 'deep-space-radio' as const,
      tier: DifficultyTier.Advanced,
      order: 1,
      title: 'Functional Relay',
      conceptIntroduced: 'Functional interceptors',
      description: 'Use withInterceptors() for a function-based approach.',
      data: {
        endpoints: [ep1, ep2],
        interceptors: [int1, int2],
        testScenarios: [sc1, sc2],
        expectedResults: [res1, res2],
      },
    };
  })(),

  // Level 14 — Request/response transformation
  (() => {
    const ep1 = endpoint('/api/telemetry/upload', 'POST', {
      expectedBody: { payload: 'encoded-data', timestamp: '2026-01-01T00:00:00Z' },
      response: { received: true, processedPayload: 'decoded-data' },
    });
    const ep2 = endpoint('/api/telemetry/latest', 'GET', {
      response: { raw: 'base64-blob', decoded: { altitude: 400, velocity: 7.8 } },
    });
    const int1 = interceptor('dsr-a02-int-1', 'custom', 1, { transform: 'encodeRequest' });
    const int2 = interceptor('dsr-a02-int-2', 'custom', 2, { transform: 'decodeResponse' });
    const req1 = request('POST', '/api/telemetry/upload', {
      body: { payload: 'encoded-data', timestamp: '2026-01-01T00:00:00Z' },
    });
    const res1 = result(
      req1, ['custom', 'custom'], { received: true, processedPayload: 'decoded-data' }, 200, true,
    );
    const req2 = request('GET', '/api/telemetry/latest');
    const res2 = result(
      req2, ['custom', 'custom'],
      { raw: 'base64-blob', decoded: { altitude: 400, velocity: 7.8 } }, 200, true,
    );
    const sc1 = scenario(
      'dsr-a02-sc-1', 'Transform request body before sending', req1,
      ['custom', 'custom'], res1,
    );
    const sc2 = scenario(
      'dsr-a02-sc-2', 'Transform response data after receiving', req2,
      ['custom', 'custom'], res2,
    );
    return {
      levelId: 'dsr-advanced-02',
      gameId: 'deep-space-radio' as const,
      tier: DifficultyTier.Advanced,
      order: 2,
      title: 'Signal Processing',
      conceptIntroduced: 'Request/response transformation',
      description: 'Modify request body and transform response data via interceptors.',
      data: {
        endpoints: [ep1, ep2],
        interceptors: [int1, int2],
        testScenarios: [sc1, sc2],
        expectedResults: [res1, res2],
      },
    };
  })(),

  // Level 15 — Conditional interceptors
  (() => {
    const ep1 = endpoint('/api/crew/roster', 'GET', {
      response: { crew: ['Vega', 'Park', 'Chen'] },
    });
    const ep2 = endpoint('/api/classified/intel', 'GET', {
      expectedHeaders: { Authorization: 'Bearer classified-token' },
      response: { intel: 'Top secret data' },
    });
    const ep3 = endpoint('/api/logs/events', 'POST', {
      expectedBody: { event: 'access-attempt' },
      response: { logged: true },
    });
    const int1 = interceptor('dsr-a03-int-1', 'auth', 1, {
      token: 'classified-token', applyTo: ['/api/classified/*'],
    });
    const int2 = interceptor('dsr-a03-int-2', 'logging', 2, {
      logLevel: 'info', applyToMethods: ['POST'],
    });
    const req1 = request('GET', '/api/crew/roster');
    const res1 = result(req1, [], { crew: ['Vega', 'Park', 'Chen'] }, 200, true);
    const req2 = request('GET', '/api/classified/intel');
    const res2 = result(req2, ['auth'], { intel: 'Top secret data' }, 200, true);
    const req3 = request('POST', '/api/logs/events', { body: { event: 'access-attempt' } });
    const res3 = result(req3, ['logging'], { logged: true }, 201, true);
    const sc1 = scenario(
      'dsr-a03-sc-1', 'Public endpoint skips auth interceptor', req1, [], res1,
    );
    const sc2 = scenario(
      'dsr-a03-sc-2', 'Classified endpoint gets auth interceptor', req2, ['auth'], res2,
    );
    const sc3 = scenario(
      'dsr-a03-sc-3', 'POST request gets logging interceptor', req3, ['logging'], res3,
    );
    return {
      levelId: 'dsr-advanced-03',
      gameId: 'deep-space-radio' as const,
      tier: DifficultyTier.Advanced,
      order: 3,
      title: 'Selective Filters',
      conceptIntroduced: 'Conditional interceptors',
      description: 'Apply interceptors only to certain URLs or methods.',
      data: {
        endpoints: [ep1, ep2, ep3],
        interceptors: [int1, int2],
        testScenarios: [sc1, sc2, sc3],
        expectedResults: [res1, res2, res3],
      },
    };
  })(),

  // Level 16 — Caching interceptor
  (() => {
    const ep1 = endpoint('/api/star-charts', 'GET', {
      response: { charts: ['sector-7G', 'sector-12B'] },
    });
    const ep2 = endpoint('/api/star-charts/sector-7G', 'GET', {
      response: { sector: '7G', stars: 42, lastUpdated: '2026-01-15' },
    });
    const ep3 = endpoint('/api/star-charts', 'POST', {
      expectedBody: { sector: '9A', stars: 17 },
      response: { created: true },
    });
    const int1 = interceptor('dsr-a04-int-1', 'caching', 1, { ttl: 60000, invalidateOnMutations: true });
    const int2 = interceptor('dsr-a04-int-2', 'auth', 2, { token: 'chart-token' });
    const req1 = request('GET', '/api/star-charts');
    const res1 = result(
      req1, ['caching', 'auth'], { charts: ['sector-7G', 'sector-12B'] }, 200, true,
    );
    const req2 = request('GET', '/api/star-charts');
    const res2 = result(
      req2, ['caching'], { charts: ['sector-7G', 'sector-12B'] }, 200, true,
    );
    const req3 = request('POST', '/api/star-charts', { body: { sector: '9A', stars: 17 } });
    const res3 = result(
      req3, ['caching', 'auth'], { created: true }, 201, true,
    );
    const sc1 = scenario(
      'dsr-a04-sc-1', 'First GET fetches from server', req1, ['caching', 'auth'], res1,
    );
    const sc2 = scenario(
      'dsr-a04-sc-2', 'Repeated GET serves from cache', req2, ['caching'], res2,
    );
    const sc3 = scenario(
      'dsr-a04-sc-3', 'POST invalidates cache', req3, ['caching', 'auth'], res3,
    );
    return {
      levelId: 'dsr-advanced-04',
      gameId: 'deep-space-radio' as const,
      tier: DifficultyTier.Advanced,
      order: 4,
      title: 'Signal Cache',
      conceptIntroduced: 'Caching interceptor',
      description: 'Cache GET responses and invalidate on mutations.',
      data: {
        endpoints: [ep1, ep2, ep3],
        interceptors: [int1, int2],
        testScenarios: [sc1, sc2, sc3],
        expectedResults: [res1, res2, res3],
      },
    };
  })(),

  // Level 17 — Full comms system
  (() => {
    const ep1 = endpoint('/api/crew/roster', 'GET', {
      expectedHeaders: { Authorization: 'Bearer full-token' },
      response: { crew: ['Vega', 'Park', 'Chen', 'Okafor'] },
    });
    const ep2 = endpoint('/api/missions/active', 'GET', {
      expectedHeaders: { Authorization: 'Bearer full-token' },
      response: { missions: ['deep-scan', 'repair'] },
    });
    const ep3 = endpoint('/api/missions/report', 'POST', {
      expectedHeaders: { Authorization: 'Bearer full-token' },
      expectedBody: { missionId: 'deep-scan', findings: 'anomaly detected' },
      response: { filed: true },
    });
    const ep4 = endpoint('/api/alerts', 'POST', {
      expectedHeaders: { Authorization: 'Bearer full-token' },
      expectedBody: { level: 'warning', message: 'Anomaly in sector 7G' },
      response: { alertId: 'a-101', dispatched: true },
    });
    const int1 = interceptor('dsr-a05-int-1', 'auth', 1, { token: 'full-token' });
    const int2 = interceptor('dsr-a05-int-2', 'logging', 2, { logLevel: 'verbose' });
    const int3 = interceptor('dsr-a05-int-3', 'retry', 3, { maxRetries: 2, delayMs: 500 });
    const int4 = interceptor('dsr-a05-int-4', 'error', 4, { notifyUser: true });
    const req1 = request('GET', '/api/crew/roster');
    const res1 = result(
      req1, ['auth', 'logging', 'retry', 'error'],
      { crew: ['Vega', 'Park', 'Chen', 'Okafor'] }, 200, true,
    );
    const req2 = request('GET', '/api/missions/active');
    const res2 = result(
      req2, ['auth', 'logging', 'retry', 'error'],
      { missions: ['deep-scan', 'repair'] }, 200, true,
    );
    const req3 = request('POST', '/api/missions/report', {
      body: { missionId: 'deep-scan', findings: 'anomaly detected' },
    });
    const res3 = result(
      req3, ['auth', 'logging', 'retry', 'error'], { filed: true }, 201, true,
    );
    const req4 = request('POST', '/api/alerts', {
      body: { level: 'warning', message: 'Anomaly in sector 7G' },
    });
    const res4 = result(
      req4, ['auth', 'logging', 'retry', 'error'],
      { alertId: 'a-101', dispatched: true }, 201, true,
    );
    const sc1 = scenario(
      'dsr-a05-sc-1', 'GET crew through full stack', req1,
      ['auth', 'logging', 'retry', 'error'], res1,
    );
    const sc2 = scenario(
      'dsr-a05-sc-2', 'GET missions through full stack', req2,
      ['auth', 'logging', 'retry', 'error'], res2,
    );
    const sc3 = scenario(
      'dsr-a05-sc-3', 'POST report through full stack', req3,
      ['auth', 'logging', 'retry', 'error'], res3,
    );
    const sc4 = scenario(
      'dsr-a05-sc-4', 'POST alert through full stack', req4,
      ['auth', 'logging', 'retry', 'error'], res4,
    );
    return {
      levelId: 'dsr-advanced-05',
      gameId: 'deep-space-radio' as const,
      tier: DifficultyTier.Advanced,
      order: 5,
      title: 'Comms Array',
      conceptIntroduced: 'Full comms system',
      description: 'Build a complete HTTP + interceptor architecture.',
      data: {
        endpoints: [ep1, ep2, ep3, ep4],
        interceptors: [int1, int2, int3, int4],
        testScenarios: [sc1, sc2, sc3, sc4],
        expectedResults: [res1, res2, res3, res4],
      },
    };
  })(),

  // =========================================================================
  // BOSS TIER (Level 18)
  // =========================================================================

  // Level 18 — Mission Control Protocol
  (() => {
    const ep1 = endpoint('/api/crew', 'GET', {
      expectedHeaders: { Authorization: 'Bearer mcp-token' },
      response: { crew: ['Vega', 'Park', 'Chen', 'Okafor', 'Nakamura', 'Silva'] },
    });
    const ep2 = endpoint('/api/missions', 'POST', {
      expectedHeaders: { Authorization: 'Bearer mcp-token' },
      expectedBody: { name: 'Operation Horizon', priority: 'critical' },
      response: { missionId: 'm-200', created: true },
    });
    const ep3 = endpoint('/api/missions/m-200', 'PUT', {
      expectedHeaders: { Authorization: 'Bearer mcp-token' },
      expectedBody: { status: 'in-progress', assignee: 'Vega' },
      response: { missionId: 'm-200', updated: true },
    });
    const ep4 = endpoint('/api/missions/m-100', 'DELETE', {
      expectedHeaders: { Authorization: 'Bearer mcp-token' },
      response: { deleted: true },
    });
    const ep5 = endpoint('/api/missions/search', 'GET', {
      expectedHeaders: { Authorization: 'Bearer mcp-token' },
      response: { results: [{ id: 'm-200', name: 'Operation Horizon' }] },
    });
    const ep6 = endpoint('/api/telemetry/upload', 'POST', {
      expectedHeaders: { Authorization: 'Bearer mcp-token' },
      expectedBody: { file: 'telemetry-2026-03.bin', size: 4096 },
      response: { uploaded: true, fileId: 'f-001' },
    });
    const int1 = interceptor('dsr-boss-int-1', 'auth', 1, {
      token: 'mcp-token', refreshEndpoint: '/api/auth/refresh',
    });
    const int2 = interceptor('dsr-boss-int-2', 'retry', 2, {
      maxRetries: 3, delayMs: 1000, backoffMultiplier: 2,
    });
    const int3 = interceptor('dsr-boss-int-3', 'caching', 3, {
      ttl: 30000, invalidateOnMutations: true,
    });
    const int4 = interceptor('dsr-boss-int-4', 'logging', 4, { logLevel: 'verbose' });
    const int5 = interceptor('dsr-boss-int-5', 'error', 5, {
      notifyUser: true, retryOn: [503, 504],
    });

    // Scenario 1: GET crew list
    const req1 = request('GET', '/api/crew');
    const res1 = result(
      req1, ['auth', 'retry', 'caching', 'logging', 'error'],
      { crew: ['Vega', 'Park', 'Chen', 'Okafor', 'Nakamura', 'Silva'] }, 200, true,
    );

    // Scenario 2: POST new mission
    const req2 = request('POST', '/api/missions', {
      body: { name: 'Operation Horizon', priority: 'critical' },
    });
    const res2 = result(
      req2, ['auth', 'retry', 'caching', 'logging', 'error'],
      { missionId: 'm-200', created: true }, 201, true,
    );

    // Scenario 3: PUT update mission
    const req3 = request('PUT', '/api/missions/m-200', {
      body: { status: 'in-progress', assignee: 'Vega' },
    });
    const res3 = result(
      req3, ['auth', 'retry', 'caching', 'logging', 'error'],
      { missionId: 'm-200', updated: true }, 200, true,
    );

    // Scenario 4: DELETE mission
    const req4 = request('DELETE', '/api/missions/m-100');
    const res4 = result(
      req4, ['auth', 'retry', 'caching', 'logging', 'error'],
      { deleted: true }, 200, true,
    );

    // Scenario 5: GET search with params
    const req5 = request('GET', '/api/missions/search', {
      params: { query: 'horizon', status: 'active' },
    });
    const res5 = result(
      req5, ['auth', 'retry', 'caching', 'logging', 'error'],
      { results: [{ id: 'm-200', name: 'Operation Horizon' }] }, 200, true,
    );

    // Scenario 6: Auth failure (expired token)
    const req6 = request('GET', '/api/crew', {
      headers: { 'X-Simulate-Auth-Failure': 'true' },
    });
    const res6 = result(
      req6, ['auth', 'retry', 'caching', 'logging', 'error'],
      { error: 'Token expired', code: 401 }, 401, false,
    );

    // Scenario 7: Network timeout
    const req7 = request('POST', '/api/telemetry/upload', {
      body: { file: 'telemetry-2026-03.bin', size: 4096 },
      headers: { 'X-Simulate-Timeout': 'true' },
    });
    const res7 = result(
      req7, ['auth', 'retry', 'caching', 'logging', 'error'],
      { error: 'Gateway timeout', code: 504 }, 504, false,
    );

    // Scenario 8: Cache hit
    const req8 = request('GET', '/api/crew');
    const res8 = result(
      req8, ['auth', 'retry', 'caching', 'logging', 'error'],
      { crew: ['Vega', 'Park', 'Chen', 'Okafor', 'Nakamura', 'Silva'] }, 200, true,
    );

    const sc1 = scenario(
      'dsr-boss-sc-1', 'GET crew list through full pipeline', req1,
      ['auth', 'retry', 'caching', 'logging', 'error'], res1,
    );
    const sc2 = scenario(
      'dsr-boss-sc-2', 'POST create new mission', req2,
      ['auth', 'retry', 'caching', 'logging', 'error'], res2,
    );
    const sc3 = scenario(
      'dsr-boss-sc-3', 'PUT update mission status', req3,
      ['auth', 'retry', 'caching', 'logging', 'error'], res3,
    );
    const sc4 = scenario(
      'dsr-boss-sc-4', 'DELETE cancel old mission', req4,
      ['auth', 'retry', 'caching', 'logging', 'error'], res4,
    );
    const sc5 = scenario(
      'dsr-boss-sc-5', 'Search missions with query params', req5,
      ['auth', 'retry', 'caching', 'logging', 'error'], res5,
    );
    const sc6 = scenario(
      'dsr-boss-sc-6', 'Handle auth token expiry', req6,
      ['auth', 'retry', 'caching', 'logging', 'error'], res6,
    );
    const sc7 = scenario(
      'dsr-boss-sc-7', 'Handle network timeout on upload', req7,
      ['auth', 'retry', 'caching', 'logging', 'error'], res7,
    );
    const sc8 = scenario(
      'dsr-boss-sc-8', 'Serve crew list from cache', req8,
      ['auth', 'retry', 'caching', 'logging', 'error'], res8,
    );

    return {
      levelId: 'dsr-boss-01',
      gameId: 'deep-space-radio' as const,
      tier: DifficultyTier.Boss,
      order: 1,
      title: 'Mission Control Protocol',
      conceptIntroduced: 'Complete HTTP architecture',
      description:
        'Configure a full communications system with CRUD operations, auth with token refresh, ' +
        'retry with backoff, caching, logging, and error handling across 8 transmission scenarios.',
      parTime: 300,
      data: {
        endpoints: [ep1, ep2, ep3, ep4, ep5, ep6],
        interceptors: [int1, int2, int3, int4, int5],
        testScenarios: [sc1, sc2, sc3, sc4, sc5, sc6, sc7, sc8],
        expectedResults: [res1, res2, res3, res4, res5, res6, res7, res8],
      },
    };
  })(),
];

// ---------------------------------------------------------------------------
// LevelPack export
// ---------------------------------------------------------------------------

export const DEEP_SPACE_RADIO_LEVEL_PACK: LevelPack = {
  gameId: 'deep-space-radio',
  levels: DEEP_SPACE_RADIO_LEVELS,
};
