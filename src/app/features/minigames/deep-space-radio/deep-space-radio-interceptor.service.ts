// ---------------------------------------------------------------------------
// DeepSpaceRadioInterceptorServiceImpl — HTTP interceptor chain simulation
// ---------------------------------------------------------------------------
// NOT providedIn: 'root'. This service is scoped to the Deep Space Radio
// component tree. Providing it locally ensures automatic cleanup on
// component destroy and prevents leaked state between minigame sessions.
// ---------------------------------------------------------------------------

import { Injectable } from '@angular/core';
import type { DeepSpaceRadioInterceptorService } from './deep-space-radio.engine';
import {
  findMatchingEndpoint,
  isInterceptorOrderValid,
  type InterceptorBlock,
  type InterceptorType,
  type HttpRequestConfig,
  type MockEndpoint,
  type TransmissionResult,
} from './deep-space-radio.types';

// ---------------------------------------------------------------------------
// Chain validation result
// ---------------------------------------------------------------------------

export interface ChainValidationResult {
  readonly valid: boolean;
  readonly expected: readonly InterceptorType[];
  readonly actual: readonly InterceptorType[];
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

@Injectable()
export class DeepSpaceRadioInterceptorServiceImpl implements DeepSpaceRadioInterceptorService {
  private _chain: readonly InterceptorBlock[] = [];
  private _cache = new Map<string, TransmissionResult>();

  // =========================================================================
  // setInterceptorChain
  // =========================================================================

  setInterceptorChain(interceptors: readonly InterceptorBlock[]): void {
    this._chain = interceptors;
  }

  // =========================================================================
  // processRequest
  // =========================================================================

  processRequest(
    request: HttpRequestConfig,
    interceptors: readonly InterceptorBlock[],
  ): HttpRequestConfig {
    const { request: processed } = this._processRequestThroughChain(request, interceptors);
    return processed;
  }

  // =========================================================================
  // processResponse
  // =========================================================================

  processResponse(
    result: TransmissionResult,
    interceptors: readonly InterceptorBlock[],
  ): TransmissionResult {
    return this._processResponseThroughChain(result, interceptors, result.requestConfig);
  }

  // =========================================================================
  // validateChain
  // =========================================================================

  validateChain(expected: readonly InterceptorType[]): ChainValidationResult {
    const sorted = [...this._chain].sort((a, b) => a.order - b.order);
    const actual = sorted.map(i => i.type);
    const valid = isInterceptorOrderValid(sorted, expected);
    return { valid, expected, actual };
  }

  // =========================================================================
  // simulateTransmission
  // =========================================================================

  simulateTransmission(
    request: HttpRequestConfig,
    interceptors: readonly InterceptorBlock[],
    endpoints: readonly MockEndpoint[],
  ): TransmissionResult {
    // Forward pass
    const { request: processedRequest, interceptorsApplied, cachedResult } =
      this._processRequestThroughChain(request, interceptors);

    if (cachedResult) {
      return cachedResult;
    }

    // Match endpoint
    const endpointResult = this._matchEndpoint(processedRequest, endpoints);

    // Build initial result
    const initialResult: TransmissionResult = {
      requestConfig: processedRequest,
      interceptorsApplied,
      responseData: endpointResult.data,
      statusCode: endpointResult.statusCode,
      isSuccess: endpointResult.statusCode >= 200 && endpointResult.statusCode < 400,
    };

    // Reverse pass
    return this._processResponseThroughChain(initialResult, interceptors, processedRequest, endpoints);
  }

  // =========================================================================
  // reset
  // =========================================================================

  reset(): void {
    this._chain = [];
    this._cache.clear();
  }

  // =========================================================================
  // Private helpers
  // =========================================================================

  private _processRequestThroughChain(
    request: HttpRequestConfig,
    chain: readonly InterceptorBlock[],
  ): { request: HttpRequestConfig; interceptorsApplied: InterceptorType[]; cachedResult?: TransmissionResult } {
    let current: HttpRequestConfig = {
      ...request,
      headers: { ...request.headers },
      params: { ...request.params },
    };
    const interceptorsApplied: InterceptorType[] = [];
    const sorted = [...chain].sort((a, b) => a.order - b.order);

    for (const interceptor of sorted) {
      interceptorsApplied.push(interceptor.type);

      switch (interceptor.type) {
        case 'auth':
          if (interceptor.config['token']) {
            current = {
              ...current,
              headers: {
                ...current.headers,
                Authorization: `Bearer ${interceptor.config['token']}`,
              },
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

  private _matchEndpoint(
    request: HttpRequestConfig,
    endpoints: readonly MockEndpoint[],
  ): { data: unknown; statusCode: number } {
    const endpoint = findMatchingEndpoint(request, endpoints);

    if (!endpoint) {
      return { data: { error: 'Not Found' }, statusCode: 404 };
    }

    const allHeadersPresent = Object.entries(endpoint.expectedHeaders).every(
      ([key, value]) => request.headers[key] === value,
    );

    if (!allHeadersPresent) {
      const errorData = endpoint.errorResponse ?? { error: 'Unauthorized' };
      return { data: errorData, statusCode: 401 };
    }

    return { data: endpoint.response, statusCode: 200 };
  }

  private _processResponseThroughChain(
    result: TransmissionResult,
    chain: readonly InterceptorBlock[],
    request: HttpRequestConfig,
    endpoints?: readonly MockEndpoint[],
  ): TransmissionResult {
    let current = result;
    const sorted = [...chain].sort((a, b) => a.order - b.order);
    const reversed = [...sorted].reverse();

    for (const interceptor of reversed) {
      switch (interceptor.type) {
        case 'retry': {
          if (current.statusCode >= 500 && endpoints) {
            const maxRetries = (interceptor.config['retryCount'] as number) ?? 0;
            let attemptsLeft = maxRetries;
            while (attemptsLeft > 0) {
              attemptsLeft--;
              const endpointResult = this._matchEndpoint(request, endpoints);
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
}
