// ---------------------------------------------------------------------------
// Canonical domain model types for Deep Space Radio minigame
//
// Level-data types (readonly, immutable) define the answer key / level config.
// Runtime types (mutable) extend them with processing state for use by the
// interceptor service and engine during gameplay.
// ---------------------------------------------------------------------------

/**
 * HTTP method discriminator for mock endpoints and request config.
 * Uses a string union (not an enum) to match project conventions.
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

/**
 * Interceptor type discriminator covering Angular HttpInterceptor categories.
 * - `'auth'`    = adds authorization headers
 * - `'logging'` = records request/response details
 * - `'retry'`   = retries failed requests
 * - `'error'`   = handles error responses
 * - `'caching'` = caches responses for repeated requests
 * - `'custom'`  = user-defined interceptor logic
 */
export type InterceptorType = 'auth' | 'logging' | 'retry' | 'error' | 'caching' | 'custom';

/** A mock backend endpoint with expected request format and response data. */
export interface MockEndpoint {
  readonly url: string;
  readonly method: HttpMethod;
  readonly expectedHeaders: Record<string, string>;
  readonly expectedBody: unknown;
  readonly response: unknown;
  readonly errorResponse: unknown;
}

/** An interceptor block in the processing pipeline. */
export interface InterceptorBlock {
  readonly id: string;
  readonly type: InterceptorType;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly config: Record<string, any>;
  readonly order: number;
}

/** Configuration for an HTTP request being built by the player. */
export interface HttpRequestConfig {
  readonly method: HttpMethod;
  readonly url: string;
  readonly headers: Record<string, string>;
  readonly body: unknown | undefined;
  readonly params: Record<string, string>;
}

/** Result of transmitting a request through the interceptor pipeline and mock backend. */
export interface TransmissionResult {
  readonly requestConfig: HttpRequestConfig;
  readonly interceptorsApplied: readonly InterceptorType[];
  readonly responseData: unknown;
  readonly statusCode: number;
  readonly isSuccess: boolean;
}

/** A test scenario that validates the player's interceptor pipeline configuration. */
export interface TestScenario {
  readonly id: string;
  readonly description: string;
  readonly requestConfig: HttpRequestConfig;
  readonly expectedInterceptorOrder: readonly InterceptorType[];
  readonly expectedResult: TransmissionResult;
}

/**
 * Game-specific level data for Deep Space Radio.
 *
 * Both `testScenarios` and `expectedResults` exist because they serve
 * different purposes: `testScenarios` define the full test context
 * (request config, expected interceptor ordering, and expected result)
 * used by the engine to validate the player's pipeline. `expectedResults`
 * provide a standalone array of expected transmission outcomes used for
 * quick result comparison and scoring without needing to traverse the
 * full scenario structure.
 */
export interface DeepSpaceRadioLevelData {
  readonly endpoints: readonly MockEndpoint[];
  readonly interceptors: readonly InterceptorBlock[];
  readonly testScenarios: readonly TestScenario[];
  readonly expectedResults: readonly TransmissionResult[];
}

// ---------------------------------------------------------------------------
// Runtime types — mutable state during gameplay
// ---------------------------------------------------------------------------

/** Processing state for a runtime interceptor block. */
export type InterceptorProcessingState = 'idle' | 'processing' | 'done' | 'error';

/** Runtime interceptor block with mutable activation and processing state. */
export interface RuntimeInterceptorBlock extends InterceptorBlock {
  isActive: boolean;
  processingState: InterceptorProcessingState;
}

/** Phase of a transmission lifecycle. */
export type TransmissionPhase =
  | 'building'
  | 'intercepting'
  | 'transmitting'
  | 'responding'
  | 'complete'
  | 'failed';

/** Runtime transmission state tracking the full request lifecycle. */
export interface RuntimeTransmission {
  readonly request: HttpRequestConfig;
  readonly interceptorChain: readonly RuntimeInterceptorBlock[];
  phase: TransmissionPhase;
  result: TransmissionResult | null;
}

// ---------------------------------------------------------------------------
// Utility functions
// ---------------------------------------------------------------------------

/**
 * Finds a mock endpoint matching the given request by exact URL and method.
 * Returns the first match, or `undefined` if no endpoint matches.
 */
export function findMatchingEndpoint(
  request: Pick<HttpRequestConfig, 'url' | 'method'>,
  endpoints: readonly MockEndpoint[],
): MockEndpoint | undefined {
  return endpoints.find(ep => ep.url === request.url && ep.method === request.method);
}

/**
 * Validates that the actual interceptor ordering matches the expected order.
 * Compares interceptor types positionally — both arrays must have the same
 * length and identical type values at each index.
 */
export function isInterceptorOrderValid(
  actual: readonly Pick<InterceptorBlock, 'type'>[],
  expected: readonly InterceptorType[],
): boolean {
  if (actual.length !== expected.length) return false;
  return actual.every((block, i) => block.type === expected[i]);
}
