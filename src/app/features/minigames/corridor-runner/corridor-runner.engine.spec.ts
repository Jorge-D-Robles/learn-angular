import {
  CorridorRunnerEngine,
  EFFICIENCY_PENALTY_PER_EXTRA_ROUTE,
  ATTEMPT_PENALTY,
  MIN_MULTIPLIER,
  MAX_REDIRECT_DEPTH,
  DEFAULT_HULL_BREACH_LIVES,
  type CorridorRunnerSimulationService,
} from './corridor-runner.engine';
import type { CorridorRunnerLevelData, RouteEntry, TestNavigation } from './corridor-runner.types';
import {
  MinigameStatus,
  DifficultyTier,
  type MinigameLevel,
} from '../../../core/minigame/minigame.types';
import type { MinigameEngineConfig } from '../../../core/minigame/minigame-engine';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function makeRoute(path: string, component?: string, opts?: Partial<Omit<RouteEntry, 'path' | 'component'>>): RouteEntry {
  const entry: RouteEntry = { path, ...(component ? { component } : {}), ...opts };
  return entry;
}

function makeTestNav(url: string, expectedDestination: string, description = 'test nav'): TestNavigation {
  return { url, expectedDestination, description };
}

function makeLevel(overrides: Partial<CorridorRunnerLevelData> = {}): MinigameLevel<CorridorRunnerLevelData> {
  const data: CorridorRunnerLevelData = {
    routeConfig: [makeRoute('engineering', 'EngineeringBay')],
    mapLayout: { nodes: [], edges: [] },
    testNavigations: [makeTestNav('/engineering', 'EngineeringBay')],
    targetDestinations: [],
    ...overrides,
  };
  return {
    id: 'cr-test-01',
    gameId: 'corridor-runner',
    tier: DifficultyTier.Basic,
    conceptIntroduced: 'Basic routing',
    description: 'Test level',
    data,
  };
}

function createEngine(config?: Partial<MinigameEngineConfig>): CorridorRunnerEngine {
  return new CorridorRunnerEngine(config);
}

function initAndStart(engine: CorridorRunnerEngine, overrides?: Partial<CorridorRunnerLevelData>): void {
  engine.initialize(makeLevel(overrides));
  engine.start();
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('CorridorRunnerEngine', () => {
  // =========================================================================
  // 1. Lifecycle Tests
  // =========================================================================
  describe('lifecycle', () => {
    it('initializes in Loading status', () => {
      const engine = createEngine();
      engine.initialize(makeLevel());
      expect(engine.status()).toBe(MinigameStatus.Loading);
    });

    it('stores test navigations on level load', () => {
      const engine = createEngine();
      const navs = [makeTestNav('/a', 'A'), makeTestNav('/b', 'B')];
      engine.initialize(makeLevel({ testNavigations: navs }));
      expect(engine.testNavigations()).toEqual(navs);
    });

    it('resets state on level load', () => {
      const engine = createEngine();
      initAndStart(engine);
      engine.submitAction({ type: 'set-route-config', routes: [makeRoute('x', 'X')] });
      // Re-initialize should clear
      engine.initialize(makeLevel());
      expect(engine.playerRouteConfig()).toEqual([]);
      expect(engine.navigationResults()).toEqual([]);
      expect(engine.runResult()).toBeNull();
      expect(engine.runCount()).toBe(0);
    });

    it('transitions to Playing on start', () => {
      const engine = createEngine();
      engine.initialize(makeLevel());
      engine.start();
      expect(engine.status()).toBe(MinigameStatus.Playing);
    });

    it('defaults hull breach lives to 2', () => {
      const engine = createEngine();
      engine.initialize(makeLevel());
      expect(engine.lives()).toBe(DEFAULT_HULL_BREACH_LIVES);
      expect(engine.lives()).toBe(2);
    });
  });

  // =========================================================================
  // 2. Set Route Config Action Tests
  // =========================================================================
  describe('set-route-config action', () => {
    it('stores player routes via set-route-config action', () => {
      const engine = createEngine();
      initAndStart(engine);
      const routes = [makeRoute('a', 'A'), makeRoute('b', 'B')];
      const result = engine.submitAction({ type: 'set-route-config', routes });
      expect(result.valid).toBe(true);
      expect(engine.playerRouteConfig()).toEqual(routes);
    });

    it('returns invalid for unknown action type', () => {
      const engine = createEngine();
      initAndStart(engine);
      const result = engine.submitAction({ type: 'unknown' });
      expect(result.valid).toBe(false);
    });

    it('rejects action when not Playing', () => {
      const engine = createEngine();
      engine.initialize(makeLevel());
      // Still Loading
      const result = engine.submitAction({ type: 'set-route-config', routes: [] });
      expect(result.valid).toBe(false);
    });

    it('replaces previous config entirely', () => {
      const engine = createEngine();
      initAndStart(engine);
      engine.submitAction({ type: 'set-route-config', routes: [makeRoute('a', 'A')] });
      engine.submitAction({ type: 'set-route-config', routes: [makeRoute('b', 'B')] });
      expect(engine.playerRouteConfig()).toEqual([makeRoute('b', 'B')]);
    });
  });

  // =========================================================================
  // 3. Basic Route Matching Tests
  // =========================================================================
  describe('basic route matching', () => {
    it('matches exact path', () => {
      const engine = createEngine();
      initAndStart(engine, {
        testNavigations: [makeTestNav('/engineering', 'EngineeringBay')],
      });
      engine.submitAction({
        type: 'set-route-config',
        routes: [makeRoute('engineering', 'EngineeringBay')],
      });
      const result = engine.runNavigation('/engineering');
      expect(result).not.toBeNull();
      expect(result!.resolvedComponent).toBe('EngineeringBay');
      expect(result!.correct).toBe(true);
      expect(result!.isHullBreach).toBe(false);
    });

    it('uses first-match-wins strategy', () => {
      const engine = createEngine();
      initAndStart(engine, {
        testNavigations: [makeTestNav('/bridge', 'FirstBridge')],
      });
      engine.submitAction({
        type: 'set-route-config',
        routes: [
          makeRoute('bridge', 'FirstBridge'),
          makeRoute('bridge', 'SecondBridge'),
        ],
      });
      const result = engine.runNavigation('/bridge');
      expect(result!.resolvedComponent).toBe('FirstBridge');
    });

    it('returns hull breach for no match', () => {
      const engine = createEngine();
      initAndStart(engine, {
        testNavigations: [makeTestNav('/unknown', 'X')],
      });
      engine.submitAction({
        type: 'set-route-config',
        routes: [makeRoute('engineering', 'EngineeringBay')],
      });
      const result = engine.runNavigation('/unknown');
      expect(result!.isHullBreach).toBe(true);
      expect(result!.resolvedComponent).toBeNull();
    });

    it('matches case-sensitively', () => {
      const engine = createEngine();
      initAndStart(engine, {
        testNavigations: [makeTestNav('/Engineering', 'X')],
      });
      engine.submitAction({
        type: 'set-route-config',
        routes: [makeRoute('engineering', 'EngineeringBay')],
      });
      const result = engine.runNavigation('/Engineering');
      expect(result!.isHullBreach).toBe(true);
    });

    it('strips leading slash', () => {
      const engine = createEngine();
      initAndStart(engine, {
        testNavigations: [makeTestNav('/bridge', 'Bridge')],
      });
      engine.submitAction({
        type: 'set-route-config',
        routes: [makeRoute('bridge', 'Bridge')],
      });
      const result = engine.runNavigation('/bridge');
      expect(result!.resolvedComponent).toBe('Bridge');
      expect(result!.correct).toBe(true);
    });

    it('strips query string before matching', () => {
      const engine = createEngine();
      initAndStart(engine, {
        testNavigations: [makeTestNav('/engineering?debug=true', 'EngineeringBay')],
      });
      engine.submitAction({
        type: 'set-route-config',
        routes: [makeRoute('engineering', 'EngineeringBay')],
      });
      const result = engine.runNavigation('/engineering?debug=true');
      expect(result!.resolvedComponent).toBe('EngineeringBay');
      expect(result!.correct).toBe(true);
    });

    it('matches empty path to empty segment', () => {
      const engine = createEngine();
      initAndStart(engine, {
        testNavigations: [makeTestNav('/', 'Dashboard')],
        routeConfig: [makeRoute('', 'Dashboard')],
      });
      engine.submitAction({
        type: 'set-route-config',
        routes: [makeRoute('', 'Dashboard')],
      });
      const result = engine.runNavigation('/');
      expect(result!.resolvedComponent).toBe('Dashboard');
    });

    it('pathMatch full on non-empty path only matches exact segments', () => {
      const engine = createEngine();
      initAndStart(engine, {
        testNavigations: [
          makeTestNav('/home', 'HomePage'),
          makeTestNav('/home/sub', 'X'),
        ],
      });
      engine.submitAction({
        type: 'set-route-config',
        routes: [
          makeRoute('home', 'HomePage', { pathMatch: 'full' }),
        ],
      });
      // Exact match
      const result1 = engine.runNavigation('/home');
      expect(result1!.resolvedComponent).toBe('HomePage');
      expect(result1!.correct).toBe(true);
      // Additional segments — should NOT match pathMatch: 'full'
      const result2 = engine.runNavigation('/home/sub');
      expect(result2!.isHullBreach).toBe(true);
    });
  });

  // =========================================================================
  // 4. Redirect Resolution Tests
  // =========================================================================
  describe('redirect resolution', () => {
    it('resolves redirectTo to target route', () => {
      const engine = createEngine();
      initAndStart(engine, {
        testNavigations: [makeTestNav('/old', 'NewPage')],
      });
      engine.submitAction({
        type: 'set-route-config',
        routes: [
          makeRoute('old', undefined, { redirectTo: 'new', pathMatch: 'full' }),
          makeRoute('new', 'NewPage'),
        ],
      });
      const result = engine.runNavigation('/old');
      expect(result!.resolvedComponent).toBe('NewPage');
      expect(result!.correct).toBe(true);
    });

    it('redirect with pathMatch full only matches empty remaining segments', () => {
      const engine = createEngine();
      initAndStart(engine, {
        testNavigations: [makeTestNav('/', 'Dashboard')],
      });
      engine.submitAction({
        type: 'set-route-config',
        routes: [
          makeRoute('', undefined, { redirectTo: 'dashboard', pathMatch: 'full' }),
          makeRoute('dashboard', 'Dashboard'),
        ],
      });
      const result = engine.runNavigation('/');
      expect(result!.resolvedComponent).toBe('Dashboard');
    });

    it('follows redirect chain A -> B -> C', () => {
      const engine = createEngine();
      initAndStart(engine, {
        testNavigations: [makeTestNav('/a', 'FinalPage')],
      });
      engine.submitAction({
        type: 'set-route-config',
        routes: [
          makeRoute('a', undefined, { redirectTo: 'b', pathMatch: 'full' }),
          makeRoute('b', undefined, { redirectTo: 'c', pathMatch: 'full' }),
          makeRoute('c', 'FinalPage'),
        ],
      });
      const result = engine.runNavigation('/a');
      expect(result!.resolvedComponent).toBe('FinalPage');
    });

    it('redirect chain max depth prevents infinite loops', () => {
      const engine = createEngine();
      initAndStart(engine, {
        testNavigations: [makeTestNav('/loop-a', 'X')],
      });
      // Create a redirect loop: loop-a -> loop-b -> loop-a
      engine.submitAction({
        type: 'set-route-config',
        routes: [
          makeRoute('loop-a', undefined, { redirectTo: 'loop-b', pathMatch: 'full' }),
          makeRoute('loop-b', undefined, { redirectTo: 'loop-a', pathMatch: 'full' }),
        ],
      });
      const result = engine.runNavigation('/loop-a');
      expect(result!.isHullBreach).toBe(true);
    });
  });

  // =========================================================================
  // 5. Wildcard Route Tests
  // =========================================================================
  describe('wildcard routes', () => {
    it('** matches any unmatched path', () => {
      const engine = createEngine();
      initAndStart(engine, {
        testNavigations: [makeTestNav('/anything/here', 'NotFound')],
      });
      engine.submitAction({
        type: 'set-route-config',
        routes: [makeRoute('**', 'NotFound')],
      });
      const result = engine.runNavigation('/anything/here');
      expect(result!.resolvedComponent).toBe('NotFound');
    });

    it('** with component resolves to that component', () => {
      const engine = createEngine();
      initAndStart(engine, {
        testNavigations: [makeTestNav('/xyz', 'CatchAll')],
      });
      engine.submitAction({
        type: 'set-route-config',
        routes: [makeRoute('**', 'CatchAll')],
      });
      const result = engine.runNavigation('/xyz');
      expect(result!.resolvedComponent).toBe('CatchAll');
    });

    it('wildcard only matches if no earlier route matched', () => {
      const engine = createEngine();
      initAndStart(engine, {
        testNavigations: [
          makeTestNav('/bridge', 'Bridge'),
          makeTestNav('/unknown', 'NotFound'),
        ],
      });
      engine.submitAction({
        type: 'set-route-config',
        routes: [
          makeRoute('bridge', 'Bridge'),
          makeRoute('**', 'NotFound'),
        ],
      });
      const r1 = engine.runNavigation('/bridge');
      expect(r1!.resolvedComponent).toBe('Bridge');
      const r2 = engine.runNavigation('/unknown');
      expect(r2!.resolvedComponent).toBe('NotFound');
    });
  });

  // =========================================================================
  // 6. Parameter Extraction Tests
  // =========================================================================
  describe('parameter extraction', () => {
    it(':id extracts parameter value', () => {
      const engine = createEngine();
      initAndStart(engine, {
        testNavigations: [makeTestNav('/crew/42', 'CrewDetail')],
      });
      engine.submitAction({
        type: 'set-route-config',
        routes: [makeRoute('crew/:id', 'CrewDetail')],
      });
      const result = engine.runNavigation('/crew/42');
      expect(result!.resolvedComponent).toBe('CrewDetail');
      expect(result!.extractedParams).toEqual({ id: '42' });
    });

    it('extracts multiple params in single path', () => {
      const engine = createEngine();
      initAndStart(engine, {
        testNavigations: [makeTestNav('/systems/nav/status', 'SystemStatus')],
      });
      engine.submitAction({
        type: 'set-route-config',
        routes: [makeRoute('systems/:systemId/:action', 'SystemStatus')],
      });
      const result = engine.runNavigation('/systems/nav/status');
      expect(result!.extractedParams).toEqual({ systemId: 'nav', action: 'status' });
    });

    it('params returned in extractedParams', () => {
      const engine = createEngine();
      initAndStart(engine, {
        testNavigations: [makeTestNav('/deck/3', 'DeckView')],
      });
      engine.submitAction({
        type: 'set-route-config',
        routes: [makeRoute('deck/:deckId', 'DeckView')],
      });
      const result = engine.runNavigation('/deck/3');
      expect(result!.extractedParams['deckId']).toBe('3');
    });

    it('param segment matches any value', () => {
      const engine = createEngine();
      initAndStart(engine, {
        testNavigations: [
          makeTestNav('/item/abc', 'ItemDetail'),
          makeTestNav('/item/xyz', 'ItemDetail'),
        ],
      });
      engine.submitAction({
        type: 'set-route-config',
        routes: [makeRoute('item/:itemId', 'ItemDetail')],
      });
      const r1 = engine.runNavigation('/item/abc');
      expect(r1!.resolvedComponent).toBe('ItemDetail');
      const r2 = engine.runNavigation('/item/xyz');
      expect(r2!.resolvedComponent).toBe('ItemDetail');
    });
  });

  // =========================================================================
  // 7. Child Route Tests
  // =========================================================================
  describe('child routes', () => {
    it('parent with children matches nested path', () => {
      const engine = createEngine();
      initAndStart(engine, {
        testNavigations: [makeTestNav('/admin/users', 'UserList')],
      });
      engine.submitAction({
        type: 'set-route-config',
        routes: [
          makeRoute('admin', undefined, {
            children: [makeRoute('users', 'UserList')],
          }),
        ],
      });
      const result = engine.runNavigation('/admin/users');
      expect(result!.resolvedComponent).toBe('UserList');
      expect(result!.correct).toBe(true);
    });

    it('handles nested redirect in children', () => {
      const engine = createEngine();
      initAndStart(engine, {
        testNavigations: [makeTestNav('/admin', 'AdminDashboard')],
        routeConfig: [
          makeRoute('admin', undefined, {
            children: [
              makeRoute('', undefined, { redirectTo: 'dashboard', pathMatch: 'full' }),
              makeRoute('dashboard', 'AdminDashboard'),
            ],
          }),
        ],
      });
      engine.submitAction({
        type: 'set-route-config',
        routes: [
          makeRoute('admin', undefined, {
            children: [
              makeRoute('', undefined, { redirectTo: 'dashboard', pathMatch: 'full' }),
              makeRoute('dashboard', 'AdminDashboard'),
            ],
          }),
        ],
      });
      const result = engine.runNavigation('/admin');
      expect(result!.resolvedComponent).toBe('AdminDashboard');
    });

    it('child with params', () => {
      const engine = createEngine();
      initAndStart(engine, {
        testNavigations: [makeTestNav('/section/7/info', 'SectionInfo')],
      });
      engine.submitAction({
        type: 'set-route-config',
        routes: [
          makeRoute('section/:id', undefined, {
            children: [makeRoute('info', 'SectionInfo')],
          }),
        ],
      });
      const result = engine.runNavigation('/section/7/info');
      expect(result!.resolvedComponent).toBe('SectionInfo');
      expect(result!.extractedParams['id']).toBe('7');
    });

    it('deep nesting resolves correctly', () => {
      const engine = createEngine();
      initAndStart(engine, {
        testNavigations: [makeTestNav('/a/b/c', 'DeepComponent')],
      });
      engine.submitAction({
        type: 'set-route-config',
        routes: [
          makeRoute('a', undefined, {
            children: [
              makeRoute('b', undefined, {
                children: [makeRoute('c', 'DeepComponent')],
              }),
            ],
          }),
        ],
      });
      const result = engine.runNavigation('/a/b/c');
      expect(result!.resolvedComponent).toBe('DeepComponent');
    });
  });

  // =========================================================================
  // 8. Guard and Resolver Presence Tests
  // =========================================================================
  describe('guards and resolvers', () => {
    it('route with canActivate resolves normally', () => {
      const engine = createEngine();
      initAndStart(engine, {
        testNavigations: [makeTestNav('/secure', 'SecurePage')],
      });
      engine.submitAction({
        type: 'set-route-config',
        routes: [
          makeRoute('secure', 'SecurePage', { canActivate: ['AuthGuard'] }),
        ],
      });
      const result = engine.runNavigation('/secure');
      expect(result!.resolvedComponent).toBe('SecurePage');
      expect(result!.correct).toBe(true);
    });

    it('route with resolve resolves normally', () => {
      const engine = createEngine();
      initAndStart(engine, {
        testNavigations: [makeTestNav('/data', 'DataPage')],
      });
      engine.submitAction({
        type: 'set-route-config',
        routes: [
          makeRoute('data', 'DataPage', { resolve: { items: 'DataResolver' } }),
        ],
      });
      const result = engine.runNavigation('/data');
      expect(result!.resolvedComponent).toBe('DataPage');
    });

    it('loadComponent is treated same as component', () => {
      const engine = createEngine();
      initAndStart(engine, {
        testNavigations: [makeTestNav('/lazy', 'LazyPage')],
      });
      engine.submitAction({
        type: 'set-route-config',
        routes: [makeRoute('lazy', undefined, { loadComponent: 'LazyPage' })],
      });
      const result = engine.runNavigation('/lazy');
      expect(result!.resolvedComponent).toBe('LazyPage');
      expect(result!.correct).toBe(true);
    });
  });

  // =========================================================================
  // 9. Hull Breach / 404 Detection Tests
  // =========================================================================
  describe('hull breach detection', () => {
    it('unmatched URL is hull breach', () => {
      const engine = createEngine();
      initAndStart(engine, {
        testNavigations: [makeTestNav('/nonexistent', 'X')],
      });
      engine.submitAction({ type: 'set-route-config', routes: [] });
      const result = engine.runNavigation('/nonexistent');
      expect(result!.isHullBreach).toBe(true);
    });

    it('hull breach decrements lives', () => {
      const engine = createEngine();
      initAndStart(engine, {
        testNavigations: [makeTestNav('/missing', 'X')],
      });
      engine.submitAction({ type: 'set-route-config', routes: [] });
      expect(engine.lives()).toBe(2);
      engine.runNavigation('/missing');
      expect(engine.lives()).toBe(1);
    });

    it('2 hull breaches causes fail (lives reach 0)', () => {
      const engine = createEngine();
      initAndStart(engine, {
        testNavigations: [
          makeTestNav('/a', 'X'),
          makeTestNav('/b', 'Y'),
        ],
      });
      engine.submitAction({ type: 'set-route-config', routes: [] });
      engine.runNavigation('/a');
      expect(engine.status()).toBe(MinigameStatus.Playing);
      engine.runNavigation('/b');
      expect(engine.status()).toBe(MinigameStatus.Lost);
    });

    it('hull breach result has isHullBreach true and correct false', () => {
      const engine = createEngine();
      initAndStart(engine, {
        testNavigations: [makeTestNav('/x', 'Y')],
      });
      engine.submitAction({ type: 'set-route-config', routes: [] });
      const result = engine.runNavigation('/x');
      expect(result!.isHullBreach).toBe(true);
      expect(result!.correct).toBe(false);
      expect(result!.resolvedComponent).toBeNull();
    });
  });

  // =========================================================================
  // 10. runAllNavigations Tests
  // =========================================================================
  describe('runAllNavigations', () => {
    it('returns aggregate RunResult with correct/hull breach counts', () => {
      const engine = createEngine();
      initAndStart(engine, {
        testNavigations: [
          makeTestNav('/a', 'A'),
          makeTestNav('/b', 'B'),
        ],
        routeConfig: [makeRoute('a', 'A'), makeRoute('b', 'B')],
      });
      engine.submitAction({
        type: 'set-route-config',
        routes: [makeRoute('a', 'A'), makeRoute('b', 'B')],
      });
      const result = engine.runAllNavigations();
      expect(result).not.toBeNull();
      expect(result!.correctCount).toBe(2);
      expect(result!.hullBreachCount).toBe(0);
      expect(result!.allCorrect).toBe(true);
    });

    it('all correct calls complete with calculated score', () => {
      const engine = createEngine();
      initAndStart(engine, {
        testNavigations: [makeTestNav('/a', 'A')],
        routeConfig: [makeRoute('a', 'A')],
      });
      engine.submitAction({
        type: 'set-route-config',
        routes: [makeRoute('a', 'A')],
      });
      engine.runAllNavigations();
      expect(engine.status()).toBe(MinigameStatus.Won);
      expect(engine.score()).toBeGreaterThan(0);
    });

    it('partial correct does not call complete', () => {
      // Use 3 lives so partial failure doesn't cause fail
      const engineWith3Lives = new CorridorRunnerEngine({ initialLives: 3 });
      engineWith3Lives.initialize(makeLevel({
        testNavigations: [
          makeTestNav('/a', 'A'),
          makeTestNav('/b', 'B'),
        ],
        routeConfig: [makeRoute('a', 'A'), makeRoute('b', 'B')],
      }));
      engineWith3Lives.start();
      engineWith3Lives.submitAction({
        type: 'set-route-config',
        routes: [makeRoute('a', 'A')],  // Missing route for /b
      });
      const result = engineWith3Lives.runAllNavigations();
      expect(result!.allCorrect).toBe(false);
      expect(engineWith3Lives.status()).not.toBe(MinigameStatus.Won);
    });

    it('multiple runs increment runCount', () => {
      const engine = new CorridorRunnerEngine({ initialLives: 10 });
      engine.initialize(makeLevel({
        testNavigations: [makeTestNav('/a', 'A')],
        routeConfig: [makeRoute('a', 'A')],
      }));
      engine.start();
      engine.submitAction({
        type: 'set-route-config',
        routes: [],  // Wrong config, will hull breach but won't fail with 10 lives
      });
      engine.runAllNavigations();
      engine.runAllNavigations();
      expect(engine.runCount()).toBe(2);
    });

    it('stops iterating after fail (2 hull breaches mid-batch)', () => {
      const engine = createEngine();
      initAndStart(engine, {
        testNavigations: [
          makeTestNav('/a', 'A'),
          makeTestNav('/b', 'B'),
          makeTestNav('/c', 'C'),
        ],
      });
      engine.submitAction({ type: 'set-route-config', routes: [] }); // No routes — all hull breaches
      const result = engine.runAllNavigations();
      expect(result).not.toBeNull();
      // Should stop after 2 hull breaches (lives reach 0 -> fail)
      expect(result!.navigationResults.length).toBe(2);
      expect(result!.hullBreachCount).toBe(2);
      expect(engine.status()).toBe(MinigameStatus.Lost);
    });
  });

  // =========================================================================
  // 11. Scoring Tests
  // =========================================================================
  describe('scoring', () => {
    it('perfect score: all correct on first run, minimal routes', () => {
      const engine = createEngine();
      const routes = [makeRoute('a', 'A'), makeRoute('b', 'B')];
      initAndStart(engine, {
        testNavigations: [makeTestNav('/a', 'A'), makeTestNav('/b', 'B')],
        routeConfig: routes,
      });
      engine.submitAction({ type: 'set-route-config', routes });
      engine.runAllNavigations();
      // maxScore=1000, correctRatio=1.0, no extra routes, first run
      expect(engine.score()).toBe(1000);
    });

    it('applies efficiency penalty for extra routes', () => {
      const engine = createEngine();
      const solutionRoutes = [makeRoute('a', 'A')];
      const playerRoutes = [
        makeRoute('a', 'A'),
        makeRoute('b', 'B'),
        makeRoute('c', 'C'),
      ];
      initAndStart(engine, {
        testNavigations: [makeTestNav('/a', 'A')],
        routeConfig: solutionRoutes, // 1 solution route
      });
      engine.submitAction({ type: 'set-route-config', routes: playerRoutes }); // 3 player routes
      engine.runAllNavigations();
      // excess = 3 - 1 = 2, penalty = 0.03 * 2 = 0.06, multiplier = 0.94
      const expected = Math.round(1000 * 1.0 * 0.94 * 1.0);
      expect(engine.score()).toBe(expected);
    });

    it('applies attempt penalty for multiple runs', () => {
      const engine = new CorridorRunnerEngine({ initialLives: 10 });
      const routes = [makeRoute('a', 'A')];
      engine.initialize(makeLevel({
        testNavigations: [makeTestNav('/a', 'A')],
        routeConfig: routes,
      }));
      engine.start();
      // First run: wrong config
      engine.submitAction({ type: 'set-route-config', routes: [] });
      engine.runAllNavigations();
      // Second run: correct config
      engine.submitAction({ type: 'set-route-config', routes });
      engine.runAllNavigations();
      // runCount=2, penalty = 0.15 * (2-1) = 0.15, multiplier = 0.85
      const expected = Math.round(1000 * 1.0 * 1.0 * 0.85);
      expect(engine.score()).toBe(expected);
    });

    it('score multiplier clamped by MIN_MULTIPLIER (0.5)', () => {
      const engine = new CorridorRunnerEngine({ initialLives: 100 });
      const solutionRoutes = [makeRoute('a', 'A')];
      // Create 50 extra routes so efficiency penalty exceeds min
      const playerRoutes = Array.from({ length: 51 }, (_, i) => makeRoute(`r${i}`, `C${i}`));
      playerRoutes[0] = makeRoute('a', 'A'); // Make first route correct
      engine.initialize(makeLevel({
        testNavigations: [makeTestNav('/a', 'A')],
        routeConfig: solutionRoutes,
      }));
      engine.start();
      engine.submitAction({ type: 'set-route-config', routes: playerRoutes });
      engine.runAllNavigations();
      // excess = 51 - 1 = 50, raw = 1.0 - 0.03*50 = -0.5, clamped to 0.5
      const expected = Math.round(1000 * 1.0 * MIN_MULTIPLIER * 1.0);
      expect(engine.score()).toBe(expected);
    });
  });

  // =========================================================================
  // 12. Simulation Service Delegation Tests
  // =========================================================================
  describe('simulation service delegation', () => {
    it('delegates to simulation service when provided', () => {
      const mockService: CorridorRunnerSimulationService = {
        resolveUrl: vi.fn().mockReturnValue({ component: 'MockComponent', params: {} }),
      };
      const engine = new CorridorRunnerEngine(undefined, mockService);
      initAndStart(engine, {
        testNavigations: [makeTestNav('/test', 'MockComponent')],
      });
      engine.submitAction({
        type: 'set-route-config',
        routes: [makeRoute('test', 'MockComponent')],
      });
      const result = engine.runNavigation('/test');
      expect(mockService.resolveUrl).toHaveBeenCalled();
      expect(result!.resolvedComponent).toBe('MockComponent');
    });

    it('uses inline matching when no simulation service provided', () => {
      const engine = createEngine();
      initAndStart(engine, {
        testNavigations: [makeTestNav('/x', 'X')],
      });
      engine.submitAction({
        type: 'set-route-config',
        routes: [makeRoute('x', 'X')],
      });
      const result = engine.runNavigation('/x');
      expect(result!.resolvedComponent).toBe('X');
    });

    it('onLevelLoad calls simulationService.reset() and loadRouteConfig()', () => {
      const mockService: CorridorRunnerSimulationService = {
        resolveUrl: vi.fn().mockReturnValue({ component: 'MockComponent', params: {} }),
        reset: vi.fn(),
        loadRouteConfig: vi.fn(),
      };
      const engine = new CorridorRunnerEngine(undefined, mockService);
      const routes = [makeRoute('engineering', 'EngineeringBay')];
      engine.initialize(makeLevel({ routeConfig: routes }));
      expect(mockService.reset).toHaveBeenCalledTimes(1);
      expect(mockService.loadRouteConfig).toHaveBeenCalledTimes(1);
      expect(mockService.loadRouteConfig).toHaveBeenCalledWith(routes);
    });

    it('reset() propagates to simulationService via re-initialize', () => {
      const mockService: CorridorRunnerSimulationService = {
        resolveUrl: vi.fn().mockReturnValue({ component: 'MockComponent', params: {} }),
        reset: vi.fn(),
        loadRouteConfig: vi.fn(),
      };
      const engine = new CorridorRunnerEngine(undefined, mockService);
      initAndStart(engine);
      engine.reset();
      // reset() re-calls initialize -> onLevelLoad, so 2 total calls
      expect(mockService.reset).toHaveBeenCalledTimes(2);
      expect(mockService.loadRouteConfig).toHaveBeenCalledTimes(2);
    });

    it('runAllNavigations delegates through service when provided', () => {
      const mockService: CorridorRunnerSimulationService = {
        resolveUrl: vi.fn().mockReturnValue({ component: 'A', params: {} }),
        reset: vi.fn(),
        loadRouteConfig: vi.fn(),
      };
      const engine = new CorridorRunnerEngine(undefined, mockService);
      initAndStart(engine, {
        testNavigations: [makeTestNav('/a', 'A'), makeTestNav('/b', 'A')],
      });
      engine.submitAction({ type: 'set-route-config', routes: [makeRoute('a', 'A')] });
      engine.runAllNavigations();
      // resolveUrl called once per test navigation
      expect(mockService.resolveUrl).toHaveBeenCalledTimes(2);
    });

    it('onLevelLoad does not error when no service provided', () => {
      const engine = createEngine();
      // Should not throw — optional chaining handles missing service
      expect(() => engine.initialize(makeLevel())).not.toThrow();
      engine.start();
      engine.submitAction({
        type: 'set-route-config',
        routes: [makeRoute('engineering', 'EngineeringBay')],
      });
      const result = engine.runNavigation('/engineering');
      expect(result!.resolvedComponent).toBe('EngineeringBay');
    });
  });

  // =========================================================================
  // 13. runNavigation guard
  // =========================================================================
  describe('runNavigation guard', () => {
    it('returns null when not Playing', () => {
      const engine = createEngine();
      engine.initialize(makeLevel());
      // Still Loading
      const result = engine.runNavigation('/test');
      expect(result).toBeNull();
    });
  });

  // =========================================================================
  // 14. Constants sanity check
  // =========================================================================
  describe('constants', () => {
    it('exports expected constants', () => {
      expect(EFFICIENCY_PENALTY_PER_EXTRA_ROUTE).toBe(0.03);
      expect(ATTEMPT_PENALTY).toBe(0.15);
      expect(MIN_MULTIPLIER).toBe(0.5);
      expect(MAX_REDIRECT_DEPTH).toBe(10);
      expect(DEFAULT_HULL_BREACH_LIVES).toBe(2);
    });
  });
});
