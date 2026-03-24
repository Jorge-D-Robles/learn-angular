import { signal, type Signal } from '@angular/core';
import { MinigameEngine, type ActionResult } from '../../../core/minigame/minigame-engine';
import type { MinigameEngineConfig } from '../../../core/minigame/minigame-engine';
import { MinigameStatus } from '../../../core/minigame/minigame.types';
import type {
  DeepSpaceRadioLevelData,
  HttpRequestConfig,
  InterceptorBlock,
  InterceptorType,
  MockEndpoint,
  TestScenario,
  TransmissionResult,
} from './deep-space-radio.types';
import { findMatchingEndpoint, isInterceptorOrderValid } from './deep-space-radio.types';

// ---------------------------------------------------------------------------
// Action types
// ---------------------------------------------------------------------------

export interface ConfigureRequestAction {
  readonly type: 'configure-request';
  readonly request: HttpRequestConfig;
}

export interface PlaceInterceptorAction {
  readonly type: 'place-interceptor';
  readonly interceptorId: string;
  readonly position: number;
}

export interface RemoveInterceptorAction {
  readonly type: 'remove-interceptor';
  readonly interceptorId: string;
}

export interface ReorderInterceptorAction {
  readonly type: 'reorder-interceptor';
  readonly interceptorId: string;
  readonly newPosition: number;
}

export type DeepSpaceRadioAction =
  | ConfigureRequestAction
  | PlaceInterceptorAction
  | RemoveInterceptorAction
  | ReorderInterceptorAction;

// ---------------------------------------------------------------------------
// Type guards
// ---------------------------------------------------------------------------

function isConfigureRequestAction(action: unknown): action is ConfigureRequestAction {
  return (
    typeof action === 'object' &&
    action !== null &&
    (action as ConfigureRequestAction).type === 'configure-request' &&
    typeof (action as ConfigureRequestAction).request === 'object' &&
    (action as ConfigureRequestAction).request !== null
  );
}

function isPlaceInterceptorAction(action: unknown): action is PlaceInterceptorAction {
  return (
    typeof action === 'object' &&
    action !== null &&
    (action as PlaceInterceptorAction).type === 'place-interceptor' &&
    typeof (action as PlaceInterceptorAction).interceptorId === 'string' &&
    typeof (action as PlaceInterceptorAction).position === 'number'
  );
}

function isRemoveInterceptorAction(action: unknown): action is RemoveInterceptorAction {
  return (
    typeof action === 'object' &&
    action !== null &&
    (action as RemoveInterceptorAction).type === 'remove-interceptor' &&
    typeof (action as RemoveInterceptorAction).interceptorId === 'string'
  );
}

function isReorderInterceptorAction(action: unknown): action is ReorderInterceptorAction {
  return (
    typeof action === 'object' &&
    action !== null &&
    (action as ReorderInterceptorAction).type === 'reorder-interceptor' &&
    typeof (action as ReorderInterceptorAction).interceptorId === 'string' &&
    typeof (action as ReorderInterceptorAction).newPosition === 'number'
  );
}

// ---------------------------------------------------------------------------
// Service interface
// ---------------------------------------------------------------------------

export interface DeepSpaceRadioInterceptorService {
  setInterceptorChain(interceptors: readonly InterceptorBlock[]): void;
  processRequest(request: HttpRequestConfig, interceptors: readonly InterceptorBlock[]): HttpRequestConfig;
  processResponse(result: TransmissionResult, interceptors: readonly InterceptorBlock[]): TransmissionResult;
  simulateTransmission(
    request: HttpRequestConfig,
    interceptors: readonly InterceptorBlock[],
    endpoints: readonly MockEndpoint[],
  ): TransmissionResult;
  reset?(): void;
}

// ---------------------------------------------------------------------------
// Scenario result types
// ---------------------------------------------------------------------------

export interface ScenarioRunResult {
  readonly scenarioId: string;
  readonly passed: boolean;
  readonly interceptorOrderCorrect: boolean;
  readonly resultMatch: boolean;
  readonly actualResult: TransmissionResult;
  readonly expectedResult: TransmissionResult;
}

export interface TransmitRunResult {
  readonly scenarioResults: readonly ScenarioRunResult[];
  readonly allPassed: boolean;
  readonly failedCount: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const PERFECT_SCORE_MULTIPLIER = 1.0;
export const SECOND_ATTEMPT_MULTIPLIER = 0.4;
export const THIRD_ATTEMPT_MULTIPLIER = 0.2;
export const DEFAULT_MAX_TRANSMISSIONS = 3;

const INVALID_NO_CHANGE: ActionResult = { valid: false, scoreChange: 0, livesChange: 0 };
const VALID_NO_CHANGE: ActionResult = { valid: true, scoreChange: 0, livesChange: 0 };

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export class DeepSpaceRadioEngine extends MinigameEngine<DeepSpaceRadioLevelData> {
  // --- Private writable signals ---
  private readonly _currentRequest = signal<HttpRequestConfig | null>(null);
  private readonly _activeChain = signal<readonly InterceptorBlock[]>([]);
  private readonly _availableInterceptors = signal<readonly InterceptorBlock[]>([]);
  private readonly _transmitResult = signal<TransmitRunResult | null>(null);
  private readonly _transmitCount = signal(0);
  private readonly _transmissionsRemaining = signal(DEFAULT_MAX_TRANSMISSIONS);

  // --- Private plain fields ---
  private _endpoints: readonly MockEndpoint[] = [];
  private _testScenarios: readonly TestScenario[] = [];
  private readonly _interceptorService: DeepSpaceRadioInterceptorService | undefined;
  private _cache = new Map<string, TransmissionResult>();

  // --- Public read-only signals ---
  readonly currentRequest: Signal<HttpRequestConfig | null> = this._currentRequest.asReadonly();
  readonly activeChain: Signal<readonly InterceptorBlock[]> = this._activeChain.asReadonly();
  readonly availableInterceptors: Signal<readonly InterceptorBlock[]> = this._availableInterceptors.asReadonly();
  readonly transmitResult: Signal<TransmitRunResult | null> = this._transmitResult.asReadonly();
  readonly transmitCount: Signal<number> = this._transmitCount.asReadonly();
  readonly transmissionsRemaining: Signal<number> = this._transmissionsRemaining.asReadonly();

  constructor(config?: Partial<MinigameEngineConfig>, interceptorService?: DeepSpaceRadioInterceptorService) {
    super(config);
    this._interceptorService = interceptorService;
  }

  // --- Lifecycle hooks ---

  protected onLevelLoad(data: DeepSpaceRadioLevelData): void {
    this._availableInterceptors.set(data.interceptors);
    this._endpoints = data.endpoints;
    this._testScenarios = data.testScenarios;
    this._currentRequest.set(null);
    this._activeChain.set([]);
    this._transmitResult.set(null);
    this._transmitCount.set(0);
    this._transmissionsRemaining.set(DEFAULT_MAX_TRANSMISSIONS);
    this._cache.clear();

    this._interceptorService?.reset?.();
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  protected onStart(): void {}

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  protected onComplete(): void {}

  // --- Action validation ---

  protected validateAction(action: unknown): ActionResult {
    if (isConfigureRequestAction(action)) return this.handleConfigureRequest(action);
    if (isPlaceInterceptorAction(action)) return this.handlePlaceInterceptor(action);
    if (isRemoveInterceptorAction(action)) return this.handleRemoveInterceptor(action);
    if (isReorderInterceptorAction(action)) return this.handleReorderInterceptor(action);
    return INVALID_NO_CHANGE;
  }

  // --- Transmit ---

  transmit(): TransmitRunResult | null {
    if (this.status() !== MinigameStatus.Playing) return null;

    this._transmitCount.update(c => c + 1);
    this._transmissionsRemaining.update(v => v - 1);

    const chain = this._activeChain();
    const endpoints = this._endpoints;
    const scenarios = this._testScenarios;

    // Empty scenarios: all pass immediately
    if (scenarios.length === 0) {
      const result: TransmitRunResult = { scenarioResults: [], allPassed: true, failedCount: 0 };
      this._transmitResult.set(result);
      const score = this.calculateScore();
      this.addScore(score);
      this.complete();
      return result;
    }

    const scenarioResults: ScenarioRunResult[] = scenarios.map(scenario => {
      if (this._interceptorService) {
        const actual = this._interceptorService.simulateTransmission(
          scenario.requestConfig,
          chain,
          endpoints,
        );
        const interceptorOrderCorrect = isInterceptorOrderValid(chain, scenario.expectedInterceptorOrder);
        const resultMatch = this.resultsMatch(actual, scenario.expectedResult);
        return {
          scenarioId: scenario.id,
          passed: interceptorOrderCorrect && resultMatch,
          interceptorOrderCorrect,
          resultMatch,
          actualResult: actual,
          expectedResult: scenario.expectedResult,
        };
      }
      return this.runScenario(scenario, chain, endpoints);
    });

    const allPassed = scenarioResults.every(r => r.passed);
    const failedCount = scenarioResults.filter(r => !r.passed).length;
    const result: TransmitRunResult = { scenarioResults, allPassed, failedCount };
    this._transmitResult.set(result);

    if (allPassed) {
      const score = this.calculateScore();
      this.addScore(score);
      this.complete();
    } else if (this._transmissionsRemaining() <= 0) {
      this.fail();
    }

    return result;
  }

  // --- Private action handlers ---

  private handleConfigureRequest(action: ConfigureRequestAction): ActionResult {
    this._currentRequest.set(action.request);
    return VALID_NO_CHANGE;
  }

  private handlePlaceInterceptor(action: PlaceInterceptorAction): ActionResult {
    const available = this._availableInterceptors();
    const exists = available.some(i => i.id === action.interceptorId);
    if (!exists) return INVALID_NO_CHANGE;

    const chain = this._activeChain();
    const alreadyPlaced = chain.some(i => i.id === action.interceptorId);
    if (alreadyPlaced) return INVALID_NO_CHANGE;

    const interceptor = available.find(i => i.id === action.interceptorId)!;
    const position = Math.max(0, Math.min(action.position, chain.length));
    const newChain = [...chain];
    newChain.splice(position, 0, interceptor);
    this._activeChain.set(newChain);
    return VALID_NO_CHANGE;
  }

  private handleRemoveInterceptor(action: RemoveInterceptorAction): ActionResult {
    const chain = this._activeChain();
    const index = chain.findIndex(i => i.id === action.interceptorId);
    if (index === -1) return INVALID_NO_CHANGE;

    this._activeChain.set(chain.filter((_, i) => i !== index));
    return VALID_NO_CHANGE;
  }

  private handleReorderInterceptor(action: ReorderInterceptorAction): ActionResult {
    const chain = this._activeChain();
    const index = chain.findIndex(i => i.id === action.interceptorId);
    if (index === -1) return INVALID_NO_CHANGE;

    const interceptor = chain[index];
    const remaining = chain.filter((_, i) => i !== index);
    const newPosition = Math.max(0, Math.min(action.newPosition, remaining.length));
    const newChain = [...remaining];
    newChain.splice(newPosition, 0, interceptor);
    this._activeChain.set(newChain);
    return VALID_NO_CHANGE;
  }

  // --- Inline interceptor chain processing ---

  private processRequestThroughChain(
    request: HttpRequestConfig,
    chain: readonly InterceptorBlock[],
  ): { request: HttpRequestConfig; interceptorsApplied: InterceptorType[]; cachedResult?: TransmissionResult } {
    let current: HttpRequestConfig = { ...request, headers: { ...request.headers }, params: { ...request.params } };
    const interceptorsApplied: InterceptorType[] = [];

    const sorted = [...chain].sort((a, b) => a.order - b.order);

    for (const interceptor of sorted) {
      interceptorsApplied.push(interceptor.type);

      switch (interceptor.type) {
        case 'auth':
          if (interceptor.config['token']) {
            current = {
              ...current,
              headers: { ...current.headers, Authorization: `Bearer ${interceptor.config['token']}` },
            };
          }
          break;
        case 'caching':
          if (current.method === 'GET') {
            const cacheKey = `${current.method}:${current.url}`;
            const cached = this._cache.get(cacheKey);
            if (cached) {
              return { request: current, interceptorsApplied, cachedResult: cached };
            }
          }
          break;
        case 'logging':
        case 'retry':
        case 'error':
        case 'custom':
          // No request mutation
          break;
      }
    }

    return { request: current, interceptorsApplied };
  }

  private matchEndpoint(
    request: HttpRequestConfig,
    endpoints: readonly MockEndpoint[],
  ): { data: unknown; statusCode: number } {
    const endpoint = findMatchingEndpoint(request, endpoints);

    if (!endpoint) {
      return { data: { error: 'Not Found' }, statusCode: 404 };
    }

    // Validate expected headers
    const expectedHeaders = endpoint.expectedHeaders;
    const allHeadersPresent = Object.entries(expectedHeaders).every(
      ([key, value]) => request.headers[key] === value,
    );

    if (!allHeadersPresent) {
      const errorData = endpoint.errorResponse ?? { error: 'Unauthorized' };
      return { data: errorData, statusCode: 401 };
    }

    return { data: endpoint.response, statusCode: 200 };
  }

  private processResponseThroughChain(
    result: TransmissionResult,
    chain: readonly InterceptorBlock[],
    request: HttpRequestConfig,
    endpoints: readonly MockEndpoint[],
  ): TransmissionResult {
    let current = result;
    const sorted = [...chain].sort((a, b) => a.order - b.order);
    const reversed = [...sorted].reverse();

    for (const interceptor of reversed) {
      switch (interceptor.type) {
        case 'retry': {
          if (current.statusCode >= 500) {
            const maxRetries = (interceptor.config['retryCount'] as number) ?? 0;
            let attemptsLeft = maxRetries;
            while (attemptsLeft > 0) {
              attemptsLeft--;
              const endpointResult = this.matchEndpoint(request, endpoints);
              current = {
                ...current,
                responseData: endpointResult.data,
                statusCode: endpointResult.statusCode,
                isSuccess: endpointResult.statusCode >= 200 && endpointResult.statusCode < 400,
              };
              if (current.statusCode < 500) break;
            }
          }
          break;
        }
        case 'error':
          if (!current.isSuccess) {
            current = {
              ...current,
              responseData: {
                error: current.responseData,
                statusCode: current.statusCode,
                handled: true,
              },
            };
          }
          break;
        case 'caching':
          if (request.method === 'GET' && current.isSuccess) {
            const cacheKey = `${request.method}:${request.url}`;
            this._cache.set(cacheKey, current);
          }
          break;
        case 'logging':
        case 'auth':
        case 'custom':
          // No response mutation
          break;
      }
    }

    return current;
  }

  private runScenario(
    scenario: TestScenario,
    chain: readonly InterceptorBlock[],
    endpoints: readonly MockEndpoint[],
  ): ScenarioRunResult {
    // Always use scenario.requestConfig per reviewer addition #2
    const requestConfig = scenario.requestConfig;

    // Forward pass
    const { request: processedRequest, interceptorsApplied, cachedResult } =
      this.processRequestThroughChain(requestConfig, chain);

    let transmissionResult: TransmissionResult;

    if (cachedResult) {
      transmissionResult = cachedResult;
    } else {
      // Match endpoint
      const endpointResult = this.matchEndpoint(processedRequest, endpoints);

      // Build initial result
      const initialResult: TransmissionResult = {
        requestConfig: processedRequest,
        interceptorsApplied,
        responseData: endpointResult.data,
        statusCode: endpointResult.statusCode,
        isSuccess: endpointResult.statusCode >= 200 && endpointResult.statusCode < 400,
      };

      // Reverse pass
      transmissionResult = this.processResponseThroughChain(initialResult, chain, processedRequest, endpoints);
    }

    // Compare
    const interceptorOrderCorrect = isInterceptorOrderValid(chain, scenario.expectedInterceptorOrder);
    const resultMatch = this.resultsMatch(transmissionResult, scenario.expectedResult);

    return {
      scenarioId: scenario.id,
      passed: interceptorOrderCorrect && resultMatch,
      interceptorOrderCorrect,
      resultMatch,
      actualResult: transmissionResult,
      expectedResult: scenario.expectedResult,
    };
  }

  private resultsMatch(actual: TransmissionResult, expected: TransmissionResult): boolean {
    return (
      actual.statusCode === expected.statusCode &&
      actual.isSuccess === expected.isSuccess &&
      JSON.stringify(actual.responseData) === JSON.stringify(expected.responseData)
    );
  }

  // --- Scoring ---

  private calculateScore(): number {
    const maxScore = this.config.maxScore;
    const count = this._transmitCount();

    if (count === 1) return Math.round(maxScore * PERFECT_SCORE_MULTIPLIER);
    if (count === 2) return Math.round(maxScore * SECOND_ATTEMPT_MULTIPLIER);
    return Math.round(maxScore * THIRD_ATTEMPT_MULTIPLIER);
  }
}
