import {
  findMatchingEndpoint,
  isInterceptorOrderValid,
  type MockEndpoint,
  type InterceptorBlock,
  type InterceptorType,
  type HttpRequestConfig,
  type TransmissionResult,
  type TestScenario,
  type DeepSpaceRadioLevelData,
  type RuntimeInterceptorBlock,
  type RuntimeTransmission,
} from './deep-space-radio.types';

// ---------------------------------------------------------------------------
// Test data helpers
// ---------------------------------------------------------------------------

const MOCK_ENDPOINTS: MockEndpoint[] = [
  {
    url: '/api/crew',
    method: 'GET',
    expectedHeaders: { Authorization: 'Bearer token' },
    expectedBody: undefined,
    response: { crew: ['Kai', 'Nova'] },
    errorResponse: { error: 'Unauthorized' },
  },
  {
    url: '/api/crew',
    method: 'POST',
    expectedHeaders: { 'Content-Type': 'application/json' },
    expectedBody: { name: 'Zara' },
    response: { id: 3, name: 'Zara' },
    errorResponse: { error: 'Bad Request' },
  },
  {
    url: '/api/logs',
    method: 'GET',
    expectedHeaders: {},
    expectedBody: undefined,
    response: [{ id: 1, message: 'System boot' }],
    errorResponse: { error: 'Not Found' },
  },
];

// ---------------------------------------------------------------------------
// findMatchingEndpoint tests
// ---------------------------------------------------------------------------

describe('findMatchingEndpoint', () => {
  it('should return the matching endpoint when URL and method both match', () => {
    const result = findMatchingEndpoint({ url: '/api/crew', method: 'GET' }, MOCK_ENDPOINTS);
    expect(result).toBe(MOCK_ENDPOINTS[0]);
  });

  it('should return undefined when URL matches but method does not', () => {
    const result = findMatchingEndpoint({ url: '/api/crew', method: 'DELETE' }, MOCK_ENDPOINTS);
    expect(result).toBeUndefined();
  });

  it('should return undefined when method matches but URL does not', () => {
    const result = findMatchingEndpoint({ url: '/api/unknown', method: 'GET' }, MOCK_ENDPOINTS);
    expect(result).toBeUndefined();
  });

  it('should return undefined when endpoints array is empty', () => {
    const result = findMatchingEndpoint({ url: '/api/crew', method: 'GET' }, []);
    expect(result).toBeUndefined();
  });

  it('should return the first match when multiple endpoints could match', () => {
    const duplicates: MockEndpoint[] = [
      { ...MOCK_ENDPOINTS[0] },
      { ...MOCK_ENDPOINTS[0], response: { crew: ['alternate'] } },
    ];
    const result = findMatchingEndpoint({ url: '/api/crew', method: 'GET' }, duplicates);
    expect(result).toBe(duplicates[0]);
  });

  it('should return undefined when request URL is empty string', () => {
    const result = findMatchingEndpoint({ url: '', method: 'GET' }, MOCK_ENDPOINTS);
    expect(result).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// isInterceptorOrderValid tests
// ---------------------------------------------------------------------------

describe('isInterceptorOrderValid', () => {
  it('should return true when actual order matches expected order exactly', () => {
    const actual: Pick<InterceptorBlock, 'type'>[] = [
      { type: 'auth' },
      { type: 'logging' },
      { type: 'retry' },
    ];
    const expected: InterceptorType[] = ['auth', 'logging', 'retry'];
    expect(isInterceptorOrderValid(actual, expected)).toBe(true);
  });

  it('should return false when actual order is reversed from expected', () => {
    const actual: Pick<InterceptorBlock, 'type'>[] = [
      { type: 'retry' },
      { type: 'logging' },
      { type: 'auth' },
    ];
    const expected: InterceptorType[] = ['auth', 'logging', 'retry'];
    expect(isInterceptorOrderValid(actual, expected)).toBe(false);
  });

  it('should return true when both arrays are empty', () => {
    expect(isInterceptorOrderValid([], [])).toBe(true);
  });

  it('should return false when actual has fewer interceptors than expected', () => {
    const actual: Pick<InterceptorBlock, 'type'>[] = [{ type: 'auth' }];
    const expected: InterceptorType[] = ['auth', 'logging'];
    expect(isInterceptorOrderValid(actual, expected)).toBe(false);
  });

  it('should return false when actual has more interceptors than expected', () => {
    const actual: Pick<InterceptorBlock, 'type'>[] = [
      { type: 'auth' },
      { type: 'logging' },
      { type: 'retry' },
    ];
    const expected: InterceptorType[] = ['auth', 'logging'];
    expect(isInterceptorOrderValid(actual, expected)).toBe(false);
  });

  it('should return false when actual contains different interceptor types than expected', () => {
    const actual: Pick<InterceptorBlock, 'type'>[] = [
      { type: 'auth' },
      { type: 'caching' },
    ];
    const expected: InterceptorType[] = ['auth', 'logging'];
    expect(isInterceptorOrderValid(actual, expected)).toBe(false);
  });

  it('should return true for a single-element chain that matches', () => {
    const actual: Pick<InterceptorBlock, 'type'>[] = [{ type: 'error' }];
    const expected: InterceptorType[] = ['error'];
    expect(isInterceptorOrderValid(actual, expected)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Type structure smoke tests
// ---------------------------------------------------------------------------

describe('Type structures', () => {
  it('MockEndpoint has required fields: url, method, expectedHeaders, expectedBody, response, errorResponse', () => {
    const endpoint: MockEndpoint = {
      url: '/api/station',
      method: 'GET',
      expectedHeaders: { Accept: 'application/json' },
      expectedBody: undefined,
      response: { name: 'Nexus' },
      errorResponse: { error: 'Server Error' },
    };
    expect(endpoint.url).toBe('/api/station');
    expect(endpoint.method).toBe('GET');
    expect(endpoint.expectedHeaders).toEqual({ Accept: 'application/json' });
    expect(endpoint.expectedBody).toBeUndefined();
    expect(endpoint.response).toEqual({ name: 'Nexus' });
    expect(endpoint.errorResponse).toEqual({ error: 'Server Error' });
  });

  it('InterceptorBlock has required fields and supports all interceptor types', () => {
    const types: InterceptorType[] = ['auth', 'logging', 'retry', 'error', 'caching', 'custom'];
    types.forEach((type, i) => {
      const block: InterceptorBlock = { id: `int-${i}`, type, config: {}, order: i };
      expect(block.id).toBe(`int-${i}`);
      expect(block.type).toBe(type);
      expect(block.config).toEqual({});
      expect(block.order).toBe(i);
    });
  });

  it('HttpRequestConfig has required fields including optional body', () => {
    const getRequest: HttpRequestConfig = {
      method: 'GET',
      url: '/api/data',
      headers: { Authorization: 'Bearer abc' },
      body: undefined,
      params: { page: '1' },
    };
    expect(getRequest.method).toBe('GET');
    expect(getRequest.url).toBe('/api/data');
    expect(getRequest.headers).toEqual({ Authorization: 'Bearer abc' });
    expect(getRequest.body).toBeUndefined();
    expect(getRequest.params).toEqual({ page: '1' });

    const postRequest: HttpRequestConfig = {
      method: 'POST',
      url: '/api/data',
      headers: { 'Content-Type': 'application/json' },
      body: { value: 42 },
      params: {},
    };
    expect(postRequest.body).toEqual({ value: 42 });
  });

  it('TransmissionResult has required fields for success case', () => {
    const result: TransmissionResult = {
      requestConfig: {
        method: 'GET',
        url: '/api/crew',
        headers: {},
        body: undefined,
        params: {},
      },
      interceptorsApplied: ['auth', 'logging'],
      responseData: { crew: ['Kai'] },
      statusCode: 200,
      isSuccess: true,
    };
    expect(result.requestConfig.method).toBe('GET');
    expect(result.interceptorsApplied).toEqual(['auth', 'logging']);
    expect(result.responseData).toEqual({ crew: ['Kai'] });
    expect(result.statusCode).toBe(200);
    expect(result.isSuccess).toBe(true);
  });

  it('TransmissionResult has required fields for failure case', () => {
    const result: TransmissionResult = {
      requestConfig: {
        method: 'POST',
        url: '/api/crew',
        headers: {},
        body: { name: 'test' },
        params: {},
      },
      interceptorsApplied: ['auth', 'error'],
      responseData: { error: 'Unauthorized' },
      statusCode: 401,
      isSuccess: false,
    };
    expect(result.statusCode).toBe(401);
    expect(result.isSuccess).toBe(false);
  });

  it('TestScenario has required fields: id, description, requestConfig, expectedInterceptorOrder, expectedResult', () => {
    const scenario: TestScenario = {
      id: 'ts-1',
      description: 'GET with auth interceptor',
      requestConfig: {
        method: 'GET',
        url: '/api/crew',
        headers: {},
        body: undefined,
        params: {},
      },
      expectedInterceptorOrder: ['auth', 'logging'],
      expectedResult: {
        requestConfig: {
          method: 'GET',
          url: '/api/crew',
          headers: { Authorization: 'Bearer token' },
          body: undefined,
          params: {},
        },
        interceptorsApplied: ['auth', 'logging'],
        responseData: { crew: ['Kai'] },
        statusCode: 200,
        isSuccess: true,
      },
    };
    expect(scenario.id).toBe('ts-1');
    expect(scenario.description).toBe('GET with auth interceptor');
    expect(scenario.requestConfig.method).toBe('GET');
    expect(scenario.expectedInterceptorOrder).toEqual(['auth', 'logging']);
    expect(scenario.expectedResult.isSuccess).toBe(true);
  });

  it('DeepSpaceRadioLevelData has endpoints, interceptors, testScenarios, expectedResults', () => {
    const levelData: DeepSpaceRadioLevelData = {
      endpoints: MOCK_ENDPOINTS,
      interceptors: [
        { id: 'int-1', type: 'auth', config: { tokenKey: 'auth-token' }, order: 0 },
        { id: 'int-2', type: 'logging', config: {}, order: 1 },
      ],
      testScenarios: [],
      expectedResults: [],
    };
    expect(levelData.endpoints).toBe(MOCK_ENDPOINTS);
    expect(levelData.interceptors).toHaveLength(2);
    expect(levelData.testScenarios).toEqual([]);
    expect(levelData.expectedResults).toEqual([]);
  });

  it('RuntimeInterceptorBlock extends InterceptorBlock with isActive and processingState', () => {
    const runtime: RuntimeInterceptorBlock = {
      id: 'int-1',
      type: 'auth',
      config: { tokenKey: 'auth-token' },
      order: 0,
      isActive: true,
      processingState: 'idle',
    };
    expect(runtime.id).toBe('int-1');
    expect(runtime.type).toBe('auth');
    expect(runtime.isActive).toBe(true);
    expect(runtime.processingState).toBe('idle');

    // Mutable fields can be updated
    runtime.isActive = false;
    runtime.processingState = 'processing';
    expect(runtime.isActive).toBe(false);
    expect(runtime.processingState).toBe('processing');
  });

  it('RuntimeTransmission has request, interceptorChain, phase, result', () => {
    const transmission: RuntimeTransmission = {
      request: {
        method: 'GET',
        url: '/api/crew',
        headers: {},
        body: undefined,
        params: {},
      },
      interceptorChain: [
        {
          id: 'int-1',
          type: 'auth',
          config: {},
          order: 0,
          isActive: true,
          processingState: 'done',
        },
      ],
      phase: 'intercepting',
      result: null,
    };
    expect(transmission.request.url).toBe('/api/crew');
    expect(transmission.interceptorChain).toHaveLength(1);
    expect(transmission.phase).toBe('intercepting');
    expect(transmission.result).toBeNull();

    // Phase and result are mutable
    transmission.phase = 'complete';
    transmission.result = {
      requestConfig: transmission.request,
      interceptorsApplied: ['auth'],
      responseData: { crew: ['Kai'] },
      statusCode: 200,
      isSuccess: true,
    };
    expect(transmission.phase).toBe('complete');
    expect(transmission.result?.isSuccess).toBe(true);
  });
});
