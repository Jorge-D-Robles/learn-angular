import { signal, type Signal } from '@angular/core';
import { MinigameEngine, type ActionResult } from '../../../core/minigame/minigame-engine';
import type { MinigameEngineConfig } from '../../../core/minigame/minigame-engine';
import { MinigameStatus } from '../../../core/minigame/minigame.types';
import type { CorridorRunnerLevelData, RouteEntry, TestNavigation } from './corridor-runner.types';

// ---------------------------------------------------------------------------
// Result types
// ---------------------------------------------------------------------------

/** Result of resolving a single navigation. */
export interface NavigationResult {
  readonly url: string;
  readonly resolvedComponent: string | null;
  readonly expectedDestination: string;
  readonly correct: boolean;
  readonly isHullBreach: boolean;
  readonly extractedParams: Readonly<Record<string, string>>;
}

/** Aggregate result of running all test navigations. */
export interface RunResult {
  readonly navigationResults: readonly NavigationResult[];
  readonly allCorrect: boolean;
  readonly correctCount: number;
  readonly hullBreachCount: number;
}

// ---------------------------------------------------------------------------
// Action types
// ---------------------------------------------------------------------------

export interface SetRouteConfigAction {
  readonly type: 'set-route-config';
  readonly routes: readonly RouteEntry[];
}

export interface HullBreachAction {
  readonly type: 'hull-breach';
  readonly url: string;
}

export type CorridorRunnerAction = SetRouteConfigAction | HullBreachAction;

// ---------------------------------------------------------------------------
// Type guards
// ---------------------------------------------------------------------------

function isSetRouteConfigAction(action: unknown): action is SetRouteConfigAction {
  return (
    typeof action === 'object' &&
    action !== null &&
    (action as SetRouteConfigAction).type === 'set-route-config' &&
    Array.isArray((action as SetRouteConfigAction).routes)
  );
}

function isHullBreachAction(action: unknown): action is HullBreachAction {
  return (
    typeof action === 'object' &&
    action !== null &&
    (action as HullBreachAction).type === 'hull-breach' &&
    typeof (action as HullBreachAction).url === 'string'
  );
}

// ---------------------------------------------------------------------------
// Simulation service interface (T-2026-426 will implement)
// ---------------------------------------------------------------------------

/** Placeholder interface for future simulation service. */
export interface CorridorRunnerSimulationService {
  resolveUrl(
    url: string,
    routes: readonly RouteEntry[],
  ): { component: string | null; params: Record<string, string> };
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const EFFICIENCY_PENALTY_PER_EXTRA_ROUTE = 0.03;
export const ATTEMPT_PENALTY = 0.15;
export const MIN_MULTIPLIER = 0.5;
export const MAX_REDIRECT_DEPTH = 10;
export const DEFAULT_HULL_BREACH_LIVES = 2;

const INVALID_NO_CHANGE: ActionResult = { valid: false, scoreChange: 0, livesChange: 0 };
const VALID_NO_CHANGE: ActionResult = { valid: true, scoreChange: 0, livesChange: 0 };
const HULL_BREACH_RESULT: ActionResult = { valid: true, scoreChange: 0, livesChange: -1 };

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export class CorridorRunnerEngine extends MinigameEngine<CorridorRunnerLevelData> {
  // --- Private writable signals ---
  private readonly _playerRouteConfig = signal<readonly RouteEntry[]>([]);
  private readonly _navigationResults = signal<readonly NavigationResult[]>([]);
  private readonly _runResult = signal<RunResult | null>(null);
  private readonly _runCount = signal(0);
  private readonly _testNavigations = signal<readonly TestNavigation[]>([]);

  // --- Private state ---
  private _solutionRouteCount = 0;
  private readonly _simulationService: CorridorRunnerSimulationService | undefined;

  // --- Public read-only signals ---
  readonly playerRouteConfig: Signal<readonly RouteEntry[]> = this._playerRouteConfig.asReadonly();
  readonly navigationResults: Signal<readonly NavigationResult[]> = this._navigationResults.asReadonly();
  readonly runResult: Signal<RunResult | null> = this._runResult.asReadonly();
  readonly runCount: Signal<number> = this._runCount.asReadonly();
  readonly testNavigations: Signal<readonly TestNavigation[]> = this._testNavigations.asReadonly();

  constructor(config?: Partial<MinigameEngineConfig>, simulationService?: CorridorRunnerSimulationService) {
    super({ ...config, initialLives: config?.initialLives ?? DEFAULT_HULL_BREACH_LIVES });
    this._simulationService = simulationService;
  }

  // --- Lifecycle hooks ---

  protected onLevelLoad(data: CorridorRunnerLevelData): void {
    this._solutionRouteCount = data.routeConfig.length;
    this._testNavigations.set(data.testNavigations);
    this._playerRouteConfig.set([]);
    this._navigationResults.set([]);
    this._runResult.set(null);
    this._runCount.set(0);
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  protected onStart(): void {}

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  protected onComplete(): void {}

  // --- Action validation ---

  protected validateAction(action: unknown): ActionResult {
    if (isSetRouteConfigAction(action)) {
      this._playerRouteConfig.set(action.routes);
      return VALID_NO_CHANGE;
    }
    if (isHullBreachAction(action)) {
      return HULL_BREACH_RESULT;
    }
    return INVALID_NO_CHANGE;
  }

  // --- Navigation ---

  /** Resolve a single URL against the player's route config. */
  runNavigation(url: string): NavigationResult | null {
    if (this.status() !== MinigameStatus.Playing) {
      return null;
    }

    const testNav = this._testNavigations().find(t => t.url === url);
    const expectedDestination = testNav?.expectedDestination ?? '';

    const routes = this._playerRouteConfig();
    const resolution = this._simulationService
      ? this._simulationService.resolveUrl(url, routes)
      : this.resolveUrl(url, routes, 0);

    const isHullBreach = resolution.component === null;
    const correct = !isHullBreach && resolution.component === expectedDestination;

    const result: NavigationResult = {
      url,
      resolvedComponent: resolution.component,
      expectedDestination,
      correct,
      isHullBreach,
      extractedParams: resolution.params,
    };

    this._navigationResults.update(results => [...results, result]);

    if (isHullBreach) {
      this.submitAction({ type: 'hull-breach', url });
    }

    return result;
  }

  /** Run all test navigations. Stops early if engine fails (2 hull breaches). */
  runAllNavigations(): RunResult | null {
    if (this.status() !== MinigameStatus.Playing) {
      return null;
    }

    this._runCount.update(c => c + 1);
    this._navigationResults.set([]);

    const testNavs = this._testNavigations();

    for (const nav of testNavs) {
      if (this.status() !== MinigameStatus.Playing) {
        break;
      }
      this.runNavigation(nav.url);
    }

    const results = this._navigationResults();
    const correctCount = results.filter(r => r.correct).length;
    const hullBreachCount = results.filter(r => r.isHullBreach).length;
    const allCorrect = correctCount === results.length && results.length === testNavs.length;

    const runResult: RunResult = {
      navigationResults: results,
      allCorrect,
      correctCount,
      hullBreachCount,
    };

    this._runResult.set(runResult);

    if (allCorrect) {
      this.addScore(this.calculateScore(results.length));
      this.complete();
    }

    return runResult;
  }

  // --- Private: route matching ---

  private resolveUrl(
    url: string,
    routes: readonly RouteEntry[],
    depth: number,
  ): { component: string | null; params: Record<string, string> } {
    if (depth > MAX_REDIRECT_DEPTH) {
      return { component: null, params: {} };
    }

    // Strip leading slash and query string
    let cleanUrl = url.startsWith('/') ? url.slice(1) : url;
    const queryIndex = cleanUrl.indexOf('?');
    if (queryIndex !== -1) {
      cleanUrl = cleanUrl.slice(0, queryIndex);
    }

    const segments = cleanUrl === '' ? [] : cleanUrl.split('/');
    return this.matchRoutes(segments, routes, {}, routes, depth);
  }

  private matchRoutes(
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
          // pathMatch: 'full' — only match if all segments are consumed by the path
          if (this.segmentsMatch(segments, routeSegments, params)) {
            const remaining = segments.slice(routeSegments.length);
            if (remaining.length === 0) {
              // Resolve redirect against the current scope (children redirect locally)
              const redirectSegments = route.redirectTo === '' ? [] : route.redirectTo.split('/');
              return this.matchRoutes(redirectSegments, routes, params, allRoutes, depth + 1);
            }
          }
        } else {
          // pathMatch: 'prefix' (default) — empty path is prefix of everything
          if (routeSegments.length === 0 || this.segmentsMatch(segments, routeSegments, params)) {
            const redirectSegments = route.redirectTo === '' ? [] : route.redirectTo.split('/');
            return this.matchRoutes(redirectSegments, routes, params, allRoutes, depth + 1);
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
      if (!this.segmentsMatch(segments, routeSegments, matchParams)) {
        continue;
      }

      const mergedParams = { ...params, ...matchParams };
      const remainingSegments = segments.slice(routeSegments.length);

      if (isFullMatch && remainingSegments.length > 0) {
        // pathMatch: 'full' requires consuming ALL segments
        continue;
      }

      // Children routes
      if (route.children && remainingSegments.length > 0) {
        const childResult = this.matchRoutes(remainingSegments, route.children, mergedParams, allRoutes, depth);
        if (childResult.component !== null) {
          return childResult;
        }
        continue;
      }

      // Also check children with empty remaining segments (for default child routes)
      if (route.children && remainingSegments.length === 0) {
        const childResult = this.matchRoutes(remainingSegments, route.children, mergedParams, allRoutes, depth);
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

  private segmentsMatch(
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

  // --- Private: scoring ---

  private calculateScore(_totalNavigations: number): number {
    const maxScore = this.config.maxScore;

    // All navigations are correct when this is called
    const correctRatio = 1.0;

    // Efficiency multiplier: penalize excess routes
    const playerRouteCount = this._playerRouteConfig().length;
    const excessRoutes = Math.max(0, playerRouteCount - this._solutionRouteCount);
    const efficiencyMultiplier = Math.max(MIN_MULTIPLIER, 1.0 - EFFICIENCY_PENALTY_PER_EXTRA_ROUTE * excessRoutes);

    // Attempt multiplier: penalize re-runs
    const runCount = this._runCount();
    const attemptMultiplier = Math.max(MIN_MULTIPLIER, 1.0 - ATTEMPT_PENALTY * (runCount - 1));

    return Math.round(maxScore * correctRatio * efficiencyMultiplier * attemptMultiplier);
  }
}
