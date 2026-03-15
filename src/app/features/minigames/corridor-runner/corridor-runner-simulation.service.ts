// ---------------------------------------------------------------------------
// CorridorRunnerSimulationService — route resolution simulation
// ---------------------------------------------------------------------------
// NOT providedIn: 'root'. This service is scoped to the Corridor Runner
// component tree. Providing it locally ensures automatic cleanup on
// component destroy and prevents leaked state between minigame sessions.
// ---------------------------------------------------------------------------

import { Injectable } from '@angular/core';
import type { RouteEntry } from './corridor-runner.types';
import { MAX_REDIRECT_DEPTH, type CorridorRunnerSimulationService as SimulationServiceInterface } from './corridor-runner.engine';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/** Result of matching a URL against a route list. */
export interface RouteMatchResult {
  readonly matched: boolean;
  readonly route: RouteEntry | null;
  readonly component: string | null;
  readonly params: Record<string, string>;
  readonly remainingSegments: string[];
}

/** Result of resolving a navigation URL. */
export interface ResolvedNavigation {
  readonly component: string | null;
  readonly params: Record<string, string>;
  readonly isHullBreach: boolean;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

@Injectable()
export class CorridorRunnerSimulationService implements SimulationServiceInterface {
  private _routes: readonly RouteEntry[] = [];

  // --- Public API ---

  /** Stores route configuration for subsequent resolution calls. */
  loadRouteConfig(routes: readonly RouteEntry[]): void {
    this._routes = routes;
  }

  /** Resolves a URL against the stored route config and returns navigation result. */
  resolveNavigation(url: string): ResolvedNavigation {
    const resolution = this._resolveUrl(url, this._routes, 0);
    return {
      component: resolution.component,
      params: resolution.params,
      isHullBreach: resolution.component === null,
    };
  }

  /**
   * Follows redirectTo chains and returns the terminal URL string.
   * On infinite loop, returns the original (cleaned) URL.
   */
  resolveRedirects(url: string): string {
    const cleanUrl = this._cleanUrl(url);
    const segments = cleanUrl === '' ? [] : cleanUrl.split('/');
    return this._followRedirects(segments, this._routes, 0, cleanUrl);
  }

  /** Matches a URL against an explicit routes array. Returns a RouteMatchResult. */
  matchRoute(url: string, routes: readonly RouteEntry[]): RouteMatchResult {
    const cleanUrl = this._cleanUrl(url);
    const segments = cleanUrl === '' ? [] : cleanUrl.split('/');

    for (const route of routes) {
      if (route.redirectTo !== undefined) continue;
      if (route.path === '**') {
        const component = route.component ?? route.loadComponent ?? null;
        return { matched: true, route, component, params: {}, remainingSegments: [] };
      }

      const routeSegments = route.path === '' ? [] : route.path.split('/');
      const matchParams: Record<string, string> = {};

      if (!this._segmentsMatch(segments, routeSegments, matchParams)) {
        continue;
      }

      const remaining = segments.slice(routeSegments.length);
      if (route.pathMatch === 'full' && remaining.length > 0) {
        continue;
      }

      const component = route.component ?? route.loadComponent ?? null;
      return { matched: true, route, component, params: matchParams, remainingSegments: remaining };
    }

    return { matched: false, route: null, component: null, params: {}, remainingSegments: segments };
  }

  /** Extracts route params by matching URL segments against a route path pattern. */
  extractParams(url: string, routePath: string): Record<string, string> {
    const cleanUrl = this._cleanUrl(url);
    const urlSegments = cleanUrl === '' ? [] : cleanUrl.split('/');
    const routeSegments = routePath === '' ? [] : routePath.split('/');
    const params: Record<string, string> = {};

    if (!this._segmentsMatch(urlSegments, routeSegments, params)) {
      return {};
    }
    return params;
  }

  /** Returns true when no route matches the URL (hull breach / 404). */
  detectHullBreach(url: string): boolean {
    return this.resolveNavigation(url).isHullBreach;
  }

  /** Clears stored route configuration. */
  reset(): void {
    this._routes = [];
  }

  /**
   * Interface method for engine delegation.
   * Resolves a URL against the provided routes array.
   */
  resolveUrl(
    url: string,
    routes: readonly RouteEntry[],
  ): { component: string | null; params: Record<string, string> } {
    return this._resolveUrl(url, routes, 0);
  }

  // --- Private: core route resolution (ported from engine) ---

  private _cleanUrl(url: string): string {
    let clean = url.startsWith('/') ? url.slice(1) : url;
    const queryIndex = clean.indexOf('?');
    if (queryIndex !== -1) {
      clean = clean.slice(0, queryIndex);
    }
    return clean;
  }

  private _resolveUrl(
    url: string,
    routes: readonly RouteEntry[],
    depth: number,
  ): { component: string | null; params: Record<string, string> } {
    if (depth > MAX_REDIRECT_DEPTH) {
      return { component: null, params: {} };
    }

    const cleanUrl = this._cleanUrl(url);
    const segments = cleanUrl === '' ? [] : cleanUrl.split('/');
    return this._matchRoutes(segments, routes, {}, routes, depth);
  }

  private _matchRoutes(
    segments: string[],
    routes: readonly RouteEntry[],
    params: Record<string, string>,
    allRoutes: readonly RouteEntry[],
    depth: number,
  ): { component: string | null; params: Record<string, string> } {
    if (depth > MAX_REDIRECT_DEPTH) {
      return { component: null, params: {} };
    }

    for (const route of routes) {
      const routeSegments = route.path === '' ? [] : route.path.split('/');
      const isFullMatch = route.pathMatch === 'full';

      // Redirect routes
      if (route.redirectTo !== undefined) {
        if (isFullMatch) {
          if (this._segmentsMatch(segments, routeSegments, params)) {
            const remaining = segments.slice(routeSegments.length);
            if (remaining.length === 0) {
              const redirectSegments = route.redirectTo === '' ? [] : route.redirectTo.split('/');
              return this._matchRoutes(redirectSegments, routes, params, allRoutes, depth + 1);
            }
          }
        } else {
          if (routeSegments.length === 0 || this._segmentsMatch(segments, routeSegments, params)) {
            const redirectSegments = route.redirectTo === '' ? [] : route.redirectTo.split('/');
            return this._matchRoutes(redirectSegments, routes, params, allRoutes, depth + 1);
          }
        }
        continue;
      }

      // Wildcard route
      if (route.path === '**') {
        const component = route.component ?? route.loadComponent ?? null;
        return { component, params: { ...params } };
      }

      // Regular route matching
      const matchParams: Record<string, string> = {};
      if (!this._segmentsMatch(segments, routeSegments, matchParams)) {
        continue;
      }

      const mergedParams = { ...params, ...matchParams };
      const remainingSegments = segments.slice(routeSegments.length);

      if (isFullMatch && remainingSegments.length > 0) {
        continue;
      }

      // Children routes
      if (route.children && remainingSegments.length > 0) {
        const childResult = this._matchRoutes(remainingSegments, route.children, mergedParams, allRoutes, depth);
        if (childResult.component !== null) {
          return childResult;
        }
        continue;
      }

      // Also check children with empty remaining segments (for default child routes)
      if (route.children && remainingSegments.length === 0) {
        const childResult = this._matchRoutes(remainingSegments, route.children, mergedParams, allRoutes, depth);
        if (childResult.component !== null) {
          return childResult;
        }
      }

      // Leaf route (component or loadComponent)
      const component = route.component ?? route.loadComponent ?? null;
      if (component !== null && remainingSegments.length === 0) {
        return { component, params: mergedParams };
      }
    }

    return { component: null, params };
  }

  private _segmentsMatch(
    urlSegments: string[],
    routeSegments: string[],
    params: Record<string, string>,
  ): boolean {
    if (routeSegments.length === 0) {
      return true;
    }
    if (urlSegments.length < routeSegments.length) {
      return false;
    }
    for (let i = 0; i < routeSegments.length; i++) {
      const routeSeg = routeSegments[i];
      const urlSeg = urlSegments[i];
      if (routeSeg.startsWith(':')) {
        params[routeSeg.slice(1)] = urlSeg;
      } else if (routeSeg !== urlSeg) {
        return false;
      }
    }
    return true;
  }

  private _followRedirects(
    segments: string[],
    routes: readonly RouteEntry[],
    depth: number,
    originalUrl: string,
  ): string {
    if (depth > MAX_REDIRECT_DEPTH) {
      return originalUrl;
    }

    for (const route of routes) {
      if (route.redirectTo === undefined) continue;

      const routeSegments = route.path === '' ? [] : route.path.split('/');
      const isFullMatch = route.pathMatch === 'full';
      const params: Record<string, string> = {};

      if (isFullMatch) {
        if (this._segmentsMatch(segments, routeSegments, params)) {
          const remaining = segments.slice(routeSegments.length);
          if (remaining.length === 0) {
            const redirectSegments = route.redirectTo === '' ? [] : route.redirectTo.split('/');
            return this._followRedirects(redirectSegments, routes, depth + 1, originalUrl);
          }
        }
      } else {
        if (routeSegments.length === 0 || this._segmentsMatch(segments, routeSegments, params)) {
          const redirectSegments = route.redirectTo === '' ? [] : route.redirectTo.split('/');
          return this._followRedirects(redirectSegments, routes, depth + 1, originalUrl);
        }
      }
    }

    // No redirect found — return current URL
    return segments.join('/');
  }
}
