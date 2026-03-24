import { TestBed } from '@angular/core/testing';
import { DeepSpaceRadioInterceptorServiceImpl } from './deep-space-radio-interceptor.service';
import type {
  InterceptorBlock,
  HttpRequestConfig,
  MockEndpoint,
  TransmissionResult,
} from './deep-space-radio.types';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function createRequest(overrides?: Partial<HttpRequestConfig>): HttpRequestConfig {
  return {
    method: 'GET',
    url: '/api/data',
    headers: {},
    body: undefined,
    params: {},
    ...overrides,
  };
}

function createInterceptor(overrides?: Partial<InterceptorBlock>): InterceptorBlock {
  return {
    id: 'int-1',
    type: 'auth',
    config: {},
    order: 0,
    ...overrides,
  };
}

function createEndpoint(overrides?: Partial<MockEndpoint>): MockEndpoint {
  return {
    url: '/api/data',
    method: 'GET',
    expectedHeaders: {},
    expectedBody: undefined,
    response: { data: 'ok' },
    errorResponse: { error: 'fail' },
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('DeepSpaceRadioInterceptorServiceImpl', () => {
  let service: DeepSpaceRadioInterceptorServiceImpl;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [DeepSpaceRadioInterceptorServiceImpl],
    });
    service = TestBed.inject(DeepSpaceRadioInterceptorServiceImpl);
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
  // 2. setInterceptorChain
  // =========================================================================
  describe('setInterceptorChain', () => {
    it('stores ordered interceptor pipeline', () => {
      const chain: InterceptorBlock[] = [
        createInterceptor({ id: 'auth-1', type: 'auth', order: 0 }),
        createInterceptor({ id: 'log-1', type: 'logging', order: 1 }),
      ];
      service.setInterceptorChain(chain);
      // Verify via validateChain that the chain is stored correctly
      const result = service.validateChain(['auth', 'logging']);
      expect(result.valid).toBe(true);
    });

    it('replaces previous chain when called again', () => {
      service.setInterceptorChain([
        createInterceptor({ id: 'auth-1', type: 'auth', order: 0 }),
      ]);
      service.setInterceptorChain([
        createInterceptor({ id: 'log-1', type: 'logging', order: 0 }),
      ]);
      const result = service.validateChain(['logging']);
      expect(result.valid).toBe(true);
    });
  });

  // =========================================================================
  // 3. processRequest — auth interceptor
  // =========================================================================
  describe('processRequest — auth interceptor', () => {
    it('auth interceptor injects Authorization header with Bearer token', () => {
      const interceptors: InterceptorBlock[] = [
        createInterceptor({ id: 'auth-1', type: 'auth', config: { token: 'abc123' }, order: 0 }),
      ];
      const request = createRequest();
      const result = service.processRequest(request, interceptors);
      expect(result.headers['Authorization']).toBe('Bearer abc123');
    });

    it('auth interceptor without token does not modify headers', () => {
      const interceptors: InterceptorBlock[] = [
        createInterceptor({ id: 'auth-1', type: 'auth', config: {}, order: 0 }),
      ];
      const request = createRequest();
      const result = service.processRequest(request, interceptors);
      expect(result.headers['Authorization']).toBeUndefined();
    });
  });

  // =========================================================================
  // 4. processRequest — caching interceptor
  // =========================================================================
  describe('processRequest — caching interceptor', () => {
    it('caching interceptor on GET with no cache returns normal request', () => {
      const interceptors: InterceptorBlock[] = [
        createInterceptor({ id: 'cache-1', type: 'caching', config: {}, order: 0 }),
      ];
      const request = createRequest({ method: 'GET', url: '/api/data' });
      const result = service.processRequest(request, interceptors);
      expect(result.url).toBe('/api/data');
    });

    it('caching interceptor on POST does not cache', () => {
      const interceptors: InterceptorBlock[] = [
        createInterceptor({ id: 'cache-1', type: 'caching', config: {}, order: 0 }),
      ];
      const request = createRequest({ method: 'POST', url: '/api/data' });
      const result = service.processRequest(request, interceptors);
      expect(result.method).toBe('POST');
    });
  });

  // =========================================================================
  // 5. processRequest — interceptor ordering
  // =========================================================================
  describe('processRequest — interceptor ordering', () => {
    it('interceptors are applied in order (sorted by order field)', () => {
      const interceptors: InterceptorBlock[] = [
        createInterceptor({ id: 'log-1', type: 'logging', order: 1 }),
        createInterceptor({ id: 'auth-1', type: 'auth', config: { token: 'xyz' }, order: 0 }),
      ];
      const request = createRequest();
      const result = service.processRequest(request, interceptors);
      // Auth (order 0) runs before logging (order 1), so auth header is set
      expect(result.headers['Authorization']).toBe('Bearer xyz');
    });

    it('non-mutating interceptors (logging, retry, error, custom) do not modify request', () => {
      const interceptors: InterceptorBlock[] = [
        createInterceptor({ id: 'log-1', type: 'logging', order: 0 }),
        createInterceptor({ id: 'retry-1', type: 'retry', config: { retryCount: 3 }, order: 1 }),
        createInterceptor({ id: 'err-1', type: 'error', order: 2 }),
        createInterceptor({ id: 'custom-1', type: 'custom', order: 3 }),
      ];
      const request = createRequest({ headers: { 'X-Custom': 'val' } });
      const result = service.processRequest(request, interceptors);
      expect(result.headers['X-Custom']).toBe('val');
      expect(Object.keys(result.headers).length).toBe(1);
    });
  });

  // =========================================================================
  // 6. processResponse — error interceptor
  // =========================================================================
  describe('processResponse — error interceptor', () => {
    it('error interceptor wraps error response with structured data', () => {
      const interceptors: InterceptorBlock[] = [
        createInterceptor({ id: 'err-1', type: 'error', order: 0 }),
      ];
      const result: TransmissionResult = {
        requestConfig: createRequest(),
        interceptorsApplied: ['error'],
        responseData: 'Not Found',
        statusCode: 404,
        isSuccess: false,
      };
      const processed = service.processResponse(result, interceptors);
      expect(processed.responseData).toEqual({
        error: 'Not Found',
        statusCode: 404,
        handled: true,
      });
    });

    it('error interceptor does not modify successful responses', () => {
      const interceptors: InterceptorBlock[] = [
        createInterceptor({ id: 'err-1', type: 'error', order: 0 }),
      ];
      const result: TransmissionResult = {
        requestConfig: createRequest(),
        interceptorsApplied: ['error'],
        responseData: { data: 'ok' },
        statusCode: 200,
        isSuccess: true,
      };
      const processed = service.processResponse(result, interceptors);
      expect(processed.responseData).toEqual({ data: 'ok' });
    });
  });

  // =========================================================================
  // 7. processResponse — caching interceptor
  // =========================================================================
  describe('processResponse — caching interceptor', () => {
    it('caching interceptor stores successful GET response in cache', () => {
      const interceptors: InterceptorBlock[] = [
        createInterceptor({ id: 'cache-1', type: 'caching', order: 0 }),
      ];
      const request = createRequest({ method: 'GET', url: '/api/data' });
      const result: TransmissionResult = {
        requestConfig: request,
        interceptorsApplied: ['caching'],
        responseData: { data: 'cached-value' },
        statusCode: 200,
        isSuccess: true,
      };
      // Process response to store in cache
      service.processResponse(result, interceptors);

      // Now process a request -- should get cached result back
      const endpoints: MockEndpoint[] = [
        createEndpoint({ response: { data: 'fresh-value' } }),
      ];
      const transmission = service.simulateTransmission(request, interceptors, endpoints);
      expect(transmission.responseData).toEqual({ data: 'cached-value' });
    });

    it('caching interceptor does not cache non-GET responses', () => {
      const interceptors: InterceptorBlock[] = [
        createInterceptor({ id: 'cache-1', type: 'caching', order: 0 }),
      ];
      const request = createRequest({ method: 'POST', url: '/api/data' });
      const result: TransmissionResult = {
        requestConfig: request,
        interceptorsApplied: ['caching'],
        responseData: { data: 'post-data' },
        statusCode: 200,
        isSuccess: true,
      };
      service.processResponse(result, interceptors);

      // Simulate a GET to the same URL -- should NOT return cached POST data
      const getRequest = createRequest({ method: 'GET', url: '/api/data' });
      const endpoints: MockEndpoint[] = [
        createEndpoint({ response: { data: 'fresh-get' } }),
      ];
      const transmission = service.simulateTransmission(getRequest, interceptors, endpoints);
      expect(transmission.responseData).toEqual({ data: 'fresh-get' });
    });

    it('caching interceptor does not cache error responses', () => {
      const interceptors: InterceptorBlock[] = [
        createInterceptor({ id: 'cache-1', type: 'caching', order: 0 }),
      ];
      const request = createRequest({ method: 'GET', url: '/api/data' });
      const result: TransmissionResult = {
        requestConfig: request,
        interceptorsApplied: ['caching'],
        responseData: { error: 'fail' },
        statusCode: 500,
        isSuccess: false,
      };
      service.processResponse(result, interceptors);

      // Simulate -- cache should be empty, returns fresh data
      const endpoints: MockEndpoint[] = [
        createEndpoint({ response: { data: 'fresh' } }),
      ];
      const transmission = service.simulateTransmission(request, interceptors, endpoints);
      expect(transmission.responseData).toEqual({ data: 'fresh' });
    });
  });

  // =========================================================================
  // 8. processResponse — reverse order
  // =========================================================================
  describe('processResponse — reverse order', () => {
    it('interceptors are applied in reverse order during response', () => {
      const interceptors: InterceptorBlock[] = [
        createInterceptor({ id: 'cache-1', type: 'caching', order: 0 }),
        createInterceptor({ id: 'err-1', type: 'error', order: 1 }),
      ];
      // Error (order 1) runs first in reverse (before caching order 0)
      const result: TransmissionResult = {
        requestConfig: createRequest(),
        interceptorsApplied: ['caching', 'error'],
        responseData: 'Bad Request',
        statusCode: 400,
        isSuccess: false,
      };
      const processed = service.processResponse(result, interceptors);
      // Error wraps the response
      expect(processed.responseData).toEqual({
        error: 'Bad Request',
        statusCode: 400,
        handled: true,
      });
    });
  });

  // =========================================================================
  // 9. processResponse — retry interceptor
  // =========================================================================
  describe('processResponse — retry interceptor', () => {
    it('retry interceptor does not modify non-500 responses', () => {
      const interceptors: InterceptorBlock[] = [
        createInterceptor({ id: 'retry-1', type: 'retry', config: { retryCount: 3 }, order: 0 }),
      ];
      const result: TransmissionResult = {
        requestConfig: createRequest(),
        interceptorsApplied: ['retry'],
        responseData: { error: 'Bad Request' },
        statusCode: 400,
        isSuccess: false,
      };
      const processed = service.processResponse(result, interceptors);
      expect(processed.statusCode).toBe(400);
    });
  });

  // =========================================================================
  // 10. validateChain
  // =========================================================================
  describe('validateChain', () => {
    it('returns valid: true when stored chain matches expected order', () => {
      service.setInterceptorChain([
        createInterceptor({ id: 'auth-1', type: 'auth', order: 0 }),
        createInterceptor({ id: 'log-1', type: 'logging', order: 1 }),
      ]);
      const result = service.validateChain(['auth', 'logging']);
      expect(result.valid).toBe(true);
      expect(result.expected).toEqual(['auth', 'logging']);
      expect(result.actual).toEqual(['auth', 'logging']);
    });

    it('returns valid: false when chain order does not match expected', () => {
      service.setInterceptorChain([
        createInterceptor({ id: 'log-1', type: 'logging', order: 0 }),
        createInterceptor({ id: 'auth-1', type: 'auth', order: 1 }),
      ]);
      const result = service.validateChain(['auth', 'logging']);
      expect(result.valid).toBe(false);
      expect(result.actual).toEqual(['logging', 'auth']);
    });

    it('returns valid: false when chain length differs from expected', () => {
      service.setInterceptorChain([
        createInterceptor({ id: 'auth-1', type: 'auth', order: 0 }),
      ]);
      const result = service.validateChain(['auth', 'logging']);
      expect(result.valid).toBe(false);
    });

    it('returns valid: true for empty chain and empty expected', () => {
      service.setInterceptorChain([]);
      const result = service.validateChain([]);
      expect(result.valid).toBe(true);
    });
  });

  // =========================================================================
  // 11. simulateTransmission — basic lifecycle
  // =========================================================================
  describe('simulateTransmission — basic lifecycle', () => {
    it('successful request to matching endpoint returns 200', () => {
      const interceptors: InterceptorBlock[] = [];
      const request = createRequest({ method: 'GET', url: '/api/data' });
      const endpoints: MockEndpoint[] = [createEndpoint({ response: { message: 'hello' } })];

      const result = service.simulateTransmission(request, interceptors, endpoints);
      expect(result.statusCode).toBe(200);
      expect(result.isSuccess).toBe(true);
      expect(result.responseData).toEqual({ message: 'hello' });
    });

    it('request to non-existent endpoint returns 404', () => {
      const interceptors: InterceptorBlock[] = [];
      const request = createRequest({ method: 'GET', url: '/api/missing' });
      const endpoints: MockEndpoint[] = [createEndpoint()];

      const result = service.simulateTransmission(request, interceptors, endpoints);
      expect(result.statusCode).toBe(404);
      expect(result.isSuccess).toBe(false);
      expect(result.responseData).toEqual({ error: 'Not Found' });
    });

    it('request missing required headers returns 401', () => {
      const interceptors: InterceptorBlock[] = [];
      const request = createRequest({ method: 'GET', url: '/api/secure' });
      const endpoints: MockEndpoint[] = [
        createEndpoint({
          url: '/api/secure',
          expectedHeaders: { Authorization: 'Bearer secret' },
          errorResponse: { error: 'Unauthorized' },
        }),
      ];

      const result = service.simulateTransmission(request, interceptors, endpoints);
      expect(result.statusCode).toBe(401);
      expect(result.isSuccess).toBe(false);
    });
  });

  // =========================================================================
  // 12. simulateTransmission — with auth interceptor
  // =========================================================================
  describe('simulateTransmission — with auth interceptor', () => {
    it('auth interceptor adds header, enabling access to secured endpoint', () => {
      const interceptors: InterceptorBlock[] = [
        createInterceptor({ id: 'auth-1', type: 'auth', config: { token: 'secret' }, order: 0 }),
      ];
      const request = createRequest({ method: 'GET', url: '/api/secure' });
      const endpoints: MockEndpoint[] = [
        createEndpoint({
          url: '/api/secure',
          expectedHeaders: { Authorization: 'Bearer secret' },
          response: { data: 'secure-data' },
        }),
      ];

      const result = service.simulateTransmission(request, interceptors, endpoints);
      expect(result.statusCode).toBe(200);
      expect(result.isSuccess).toBe(true);
      expect(result.responseData).toEqual({ data: 'secure-data' });
    });
  });

  // =========================================================================
  // 13. simulateTransmission — with caching
  // =========================================================================
  describe('simulateTransmission — with caching', () => {
    it('second GET to same URL returns cached response', () => {
      const interceptors: InterceptorBlock[] = [
        createInterceptor({ id: 'cache-1', type: 'caching', config: {}, order: 0 }),
      ];
      const request = createRequest({ method: 'GET', url: '/api/data' });
      const endpoints: MockEndpoint[] = [
        createEndpoint({ response: { count: 1 } }),
      ];

      // First request
      const first = service.simulateTransmission(request, interceptors, endpoints);
      expect(first.statusCode).toBe(200);
      expect(first.responseData).toEqual({ count: 1 });

      // Second request - should return cached
      const second = service.simulateTransmission(request, interceptors, endpoints);
      expect(second.responseData).toEqual({ count: 1 });
    });
  });

  // =========================================================================
  // 14. simulateTransmission — with error interceptor
  // =========================================================================
  describe('simulateTransmission — with error interceptor', () => {
    it('error interceptor wraps 404 response', () => {
      const interceptors: InterceptorBlock[] = [
        createInterceptor({ id: 'err-1', type: 'error', order: 0 }),
      ];
      const request = createRequest({ method: 'GET', url: '/api/missing' });
      const endpoints: MockEndpoint[] = [];

      const result = service.simulateTransmission(request, interceptors, endpoints);
      expect(result.statusCode).toBe(404);
      expect(result.isSuccess).toBe(false);
      expect(result.responseData).toEqual({
        error: { error: 'Not Found' },
        statusCode: 404,
        handled: true,
      });
    });
  });

  // =========================================================================
  // 15. simulateTransmission — interceptorsApplied tracking
  // =========================================================================
  describe('simulateTransmission — interceptorsApplied tracking', () => {
    it('tracks interceptor types applied during request processing', () => {
      const interceptors: InterceptorBlock[] = [
        createInterceptor({ id: 'auth-1', type: 'auth', config: { token: 'tk' }, order: 0 }),
        createInterceptor({ id: 'log-1', type: 'logging', order: 1 }),
        createInterceptor({ id: 'err-1', type: 'error', order: 2 }),
      ];
      const request = createRequest();
      const endpoints: MockEndpoint[] = [createEndpoint()];

      const result = service.simulateTransmission(request, interceptors, endpoints);
      expect(result.interceptorsApplied).toEqual(['auth', 'logging', 'error']);
    });
  });

  // =========================================================================
  // 16. simulateTransmission — full chain auth + logging + error
  // =========================================================================
  describe('simulateTransmission — full pipeline with multiple interceptors', () => {
    it('auth + error: auth enables access, error does not modify success', () => {
      const interceptors: InterceptorBlock[] = [
        createInterceptor({ id: 'auth-1', type: 'auth', config: { token: 'mytoken' }, order: 0 }),
        createInterceptor({ id: 'err-1', type: 'error', order: 1 }),
      ];
      const request = createRequest({ method: 'GET', url: '/api/secure' });
      const endpoints: MockEndpoint[] = [
        createEndpoint({
          url: '/api/secure',
          expectedHeaders: { Authorization: 'Bearer mytoken' },
          response: { secure: true },
        }),
      ];

      const result = service.simulateTransmission(request, interceptors, endpoints);
      expect(result.statusCode).toBe(200);
      expect(result.responseData).toEqual({ secure: true });
    });
  });

  // =========================================================================
  // 17. reset
  // =========================================================================
  describe('reset', () => {
    it('clears stored interceptor chain', () => {
      service.setInterceptorChain([
        createInterceptor({ id: 'auth-1', type: 'auth', order: 0 }),
      ]);
      service.reset();
      const result = service.validateChain([]);
      expect(result.valid).toBe(true);
    });

    it('clears response cache', () => {
      const interceptors: InterceptorBlock[] = [
        createInterceptor({ id: 'cache-1', type: 'caching', config: {}, order: 0 }),
      ];
      const request = createRequest({ method: 'GET', url: '/api/data' });
      const endpoints: MockEndpoint[] = [createEndpoint({ response: { v: 1 } })];

      // Populate cache
      service.simulateTransmission(request, interceptors, endpoints);

      // Reset clears cache
      service.reset();

      // Next call should hit the endpoint fresh (not cached)
      const result = service.simulateTransmission(request, interceptors, endpoints);
      expect(result.statusCode).toBe(200);
      expect(result.responseData).toEqual({ v: 1 });
    });

    it('is idempotent (calling reset twice does not throw)', () => {
      service.reset();
      expect(() => service.reset()).not.toThrow();
    });
  });

  // =========================================================================
  // 18. processResponse — logging, auth, custom are no-ops
  // =========================================================================
  describe('processResponse — non-mutating interceptors', () => {
    it('logging, auth, and custom interceptors do not modify response', () => {
      const interceptors: InterceptorBlock[] = [
        createInterceptor({ id: 'log-1', type: 'logging', order: 0 }),
        createInterceptor({ id: 'auth-1', type: 'auth', config: { token: 'x' }, order: 1 }),
        createInterceptor({ id: 'custom-1', type: 'custom', order: 2 }),
      ];
      const result: TransmissionResult = {
        requestConfig: createRequest(),
        interceptorsApplied: ['logging', 'auth', 'custom'],
        responseData: { data: 'untouched' },
        statusCode: 200,
        isSuccess: true,
      };
      const processed = service.processResponse(result, interceptors);
      expect(processed.responseData).toEqual({ data: 'untouched' });
      expect(processed.statusCode).toBe(200);
    });
  });
});
