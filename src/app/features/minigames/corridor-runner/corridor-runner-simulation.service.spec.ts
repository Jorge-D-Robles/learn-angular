import { TestBed } from '@angular/core/testing';
import { CorridorRunnerSimulationService } from './corridor-runner-simulation.service';
import type { RouteEntry } from './corridor-runner.types';

// ---------------------------------------------------------------------------
// Test helpers (local to spec)
// ---------------------------------------------------------------------------

function makeRoute(
  path: string,
  component?: string,
  opts?: Partial<Omit<RouteEntry, 'path' | 'component'>>,
): RouteEntry {
  const entry: RouteEntry = { path, ...(component ? { component } : {}), ...opts };
  return entry;
}

function makeRoutes(...routes: RouteEntry[]): RouteEntry[] {
  return routes;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('CorridorRunnerSimulationService', () => {
  let service: CorridorRunnerSimulationService;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [CorridorRunnerSimulationService],
    });
    service = TestBed.inject(CorridorRunnerSimulationService);
  });

  // =========================================================================
  // 1. Creation and initial state
  // =========================================================================
  describe('Creation and initial state', () => {
    it('should be created via TestBed', () => {
      expect(service).toBeTruthy();
    });

    it('resolveNavigation on empty config returns hull breach result', () => {
      const result = service.resolveNavigation('/anything');
      expect(result.component).toBeNull();
      expect(result.isHullBreach).toBe(true);
      expect(result.params).toEqual({});
    });

    it('detectHullBreach on empty config returns true', () => {
      expect(service.detectHullBreach('/anything')).toBe(true);
    });
  });

  // =========================================================================
  // 2. loadRouteConfig
  // =========================================================================
  describe('loadRouteConfig', () => {
    it('stores routes and subsequent resolveNavigation uses them', () => {
      service.loadRouteConfig(makeRoutes(makeRoute('bridge', 'Bridge')));
      const result = service.resolveNavigation('/bridge');
      expect(result.component).toBe('Bridge');
      expect(result.isHullBreach).toBe(false);
    });

    it('replaces previous config entirely on re-call', () => {
      service.loadRouteConfig(makeRoutes(makeRoute('a', 'A')));
      service.loadRouteConfig(makeRoutes(makeRoute('b', 'B')));
      expect(service.resolveNavigation('/a').isHullBreach).toBe(true);
      expect(service.resolveNavigation('/b').component).toBe('B');
    });

    it('accepts empty array (clears routes)', () => {
      service.loadRouteConfig(makeRoutes(makeRoute('a', 'A')));
      service.loadRouteConfig([]);
      expect(service.resolveNavigation('/a').isHullBreach).toBe(true);
    });
  });

  // =========================================================================
  // 3. resolveNavigation - exact path matching
  // =========================================================================
  describe('resolveNavigation - exact path matching', () => {
    it('matches exact path /engineering -> EngineeringBay', () => {
      service.loadRouteConfig(makeRoutes(makeRoute('engineering', 'EngineeringBay')));
      const result = service.resolveNavigation('/engineering');
      expect(result.component).toBe('EngineeringBay');
      expect(result.isHullBreach).toBe(false);
    });

    it('first-match-wins when multiple routes match same path', () => {
      service.loadRouteConfig(makeRoutes(
        makeRoute('bridge', 'FirstBridge'),
        makeRoute('bridge', 'SecondBridge'),
      ));
      expect(service.resolveNavigation('/bridge').component).toBe('FirstBridge');
    });

    it('strips leading slash before matching', () => {
      service.loadRouteConfig(makeRoutes(makeRoute('bridge', 'Bridge')));
      expect(service.resolveNavigation('/bridge').component).toBe('Bridge');
    });

    it('strips query string before matching', () => {
      service.loadRouteConfig(makeRoutes(makeRoute('engineering', 'EngineeringBay')));
      expect(service.resolveNavigation('/engineering?debug=true').component).toBe('EngineeringBay');
    });

    it('matches empty path for root URL /', () => {
      service.loadRouteConfig(makeRoutes(makeRoute('', 'Dashboard')));
      expect(service.resolveNavigation('/').component).toBe('Dashboard');
    });

    it('case-sensitive matching (uppercase does NOT match lowercase)', () => {
      service.loadRouteConfig(makeRoutes(makeRoute('engineering', 'EngineeringBay')));
      expect(service.resolveNavigation('/Engineering').isHullBreach).toBe(true);
    });
  });

  // =========================================================================
  // 4. resolveNavigation - pathMatch full vs prefix
  // =========================================================================
  describe('resolveNavigation - pathMatch full vs prefix', () => {
    it('pathMatch full only matches when all URL segments are consumed', () => {
      service.loadRouteConfig(makeRoutes(
        makeRoute('home', 'HomePage', { pathMatch: 'full' }),
      ));
      expect(service.resolveNavigation('/home').component).toBe('HomePage');
    });

    it('pathMatch full with extra segments does NOT match', () => {
      service.loadRouteConfig(makeRoutes(
        makeRoute('home', 'HomePage', { pathMatch: 'full' }),
      ));
      expect(service.resolveNavigation('/home/sub').isHullBreach).toBe(true);
    });

    it('default (prefix) matches any URL starting with the path', () => {
      service.loadRouteConfig(makeRoutes(
        makeRoute('admin', undefined, {
          children: [makeRoute('users', 'UserList')],
        }),
      ));
      expect(service.resolveNavigation('/admin/users').component).toBe('UserList');
    });
  });

  // =========================================================================
  // 5. resolveNavigation - wildcard routes
  // =========================================================================
  describe('resolveNavigation - wildcard routes', () => {
    it('** matches any unmatched path', () => {
      service.loadRouteConfig(makeRoutes(makeRoute('**', 'NotFound')));
      expect(service.resolveNavigation('/anything/here').component).toBe('NotFound');
    });

    it('** only triggers if no earlier route matched', () => {
      service.loadRouteConfig(makeRoutes(
        makeRoute('bridge', 'Bridge'),
        makeRoute('**', 'NotFound'),
      ));
      expect(service.resolveNavigation('/bridge').component).toBe('Bridge');
      expect(service.resolveNavigation('/unknown').component).toBe('NotFound');
    });

    it('** with component returns that component', () => {
      service.loadRouteConfig(makeRoutes(makeRoute('**', 'CatchAll')));
      expect(service.resolveNavigation('/xyz').component).toBe('CatchAll');
    });
  });

  // =========================================================================
  // 6. resolveNavigation - redirect resolution
  // =========================================================================
  describe('resolveNavigation - redirect resolution', () => {
    it('redirectTo resolves to target route', () => {
      service.loadRouteConfig(makeRoutes(
        makeRoute('old', undefined, { redirectTo: 'new', pathMatch: 'full' }),
        makeRoute('new', 'NewPage'),
      ));
      expect(service.resolveNavigation('/old').component).toBe('NewPage');
    });

    it('empty path redirect with pathMatch full redirects root', () => {
      service.loadRouteConfig(makeRoutes(
        makeRoute('', undefined, { redirectTo: 'dashboard', pathMatch: 'full' }),
        makeRoute('dashboard', 'Dashboard'),
      ));
      expect(service.resolveNavigation('/').component).toBe('Dashboard');
    });

    it('follows redirect chain A -> B -> C', () => {
      service.loadRouteConfig(makeRoutes(
        makeRoute('a', undefined, { redirectTo: 'b', pathMatch: 'full' }),
        makeRoute('b', undefined, { redirectTo: 'c', pathMatch: 'full' }),
        makeRoute('c', 'FinalPage'),
      ));
      expect(service.resolveNavigation('/a').component).toBe('FinalPage');
    });

    it('infinite redirect loop returns hull breach (capped at MAX_REDIRECT_DEPTH=10)', () => {
      service.loadRouteConfig(makeRoutes(
        makeRoute('loop-a', undefined, { redirectTo: 'loop-b', pathMatch: 'full' }),
        makeRoute('loop-b', undefined, { redirectTo: 'loop-a', pathMatch: 'full' }),
      ));
      const result = service.resolveNavigation('/loop-a');
      expect(result.isHullBreach).toBe(true);
    });

    it('prefix redirect with empty path and no pathMatch full causes hull breach (infinite loop)', () => {
      // An empty-path prefix redirect without pathMatch: 'full' matches everything
      // including the redirect target, causing an infinite loop capped at MAX_REDIRECT_DEPTH.
      service.loadRouteConfig(makeRoutes(
        makeRoute('', undefined, { redirectTo: 'home' }),
        makeRoute('home', 'HomePage'),
      ));
      expect(service.resolveNavigation('/').isHullBreach).toBe(true);
    });
  });

  // =========================================================================
  // 7. resolveNavigation - route parameters
  // =========================================================================
  describe('resolveNavigation - route parameters', () => {
    it(':id segment extracts param value', () => {
      service.loadRouteConfig(makeRoutes(makeRoute('crew/:id', 'CrewDetail')));
      const result = service.resolveNavigation('/crew/42');
      expect(result.component).toBe('CrewDetail');
      expect(result.params).toEqual({ id: '42' });
    });

    it('multiple params in single path extracted correctly', () => {
      service.loadRouteConfig(makeRoutes(makeRoute('systems/:systemId/:action', 'SystemStatus')));
      const result = service.resolveNavigation('/systems/nav/status');
      expect(result.params).toEqual({ systemId: 'nav', action: 'status' });
    });

    it('param segment matches any value', () => {
      service.loadRouteConfig(makeRoutes(makeRoute('item/:itemId', 'ItemDetail')));
      expect(service.resolveNavigation('/item/abc').component).toBe('ItemDetail');
      expect(service.resolveNavigation('/item/xyz').component).toBe('ItemDetail');
    });
  });

  // =========================================================================
  // 8. resolveNavigation - child routes
  // =========================================================================
  describe('resolveNavigation - child routes', () => {
    it('parent with children matches nested path', () => {
      service.loadRouteConfig(makeRoutes(
        makeRoute('admin', undefined, {
          children: [makeRoute('users', 'UserList')],
        }),
      ));
      expect(service.resolveNavigation('/admin/users').component).toBe('UserList');
    });

    it('nested redirect in children resolves correctly', () => {
      service.loadRouteConfig(makeRoutes(
        makeRoute('admin', undefined, {
          children: [
            makeRoute('', undefined, { redirectTo: 'dashboard', pathMatch: 'full' }),
            makeRoute('dashboard', 'AdminDashboard'),
          ],
        }),
      ));
      expect(service.resolveNavigation('/admin').component).toBe('AdminDashboard');
    });

    it('child route with params from parent', () => {
      service.loadRouteConfig(makeRoutes(
        makeRoute('section/:id', undefined, {
          children: [makeRoute('info', 'SectionInfo')],
        }),
      ));
      const result = service.resolveNavigation('/section/7/info');
      expect(result.component).toBe('SectionInfo');
      expect(result.params['id']).toBe('7');
    });

    it('deep nesting (3 levels) resolves correctly', () => {
      service.loadRouteConfig(makeRoutes(
        makeRoute('a', undefined, {
          children: [
            makeRoute('b', undefined, {
              children: [makeRoute('c', 'DeepComponent')],
            }),
          ],
        }),
      ));
      expect(service.resolveNavigation('/a/b/c').component).toBe('DeepComponent');
    });

    it('default child route (empty path child) when navigating to parent', () => {
      service.loadRouteConfig(makeRoutes(
        makeRoute('admin', undefined, {
          children: [
            makeRoute('', 'AdminHome'),
          ],
        }),
      ));
      expect(service.resolveNavigation('/admin').component).toBe('AdminHome');
    });
  });

  // =========================================================================
  // 9. resolveNavigation - loadComponent
  // =========================================================================
  describe('resolveNavigation - loadComponent', () => {
    it('loadComponent treated same as component', () => {
      service.loadRouteConfig(makeRoutes(makeRoute('lazy', undefined, { loadComponent: 'LazyPage' })));
      const result = service.resolveNavigation('/lazy');
      expect(result.component).toBe('LazyPage');
      expect(result.isHullBreach).toBe(false);
    });
  });

  // =========================================================================
  // 10. resolveRedirects
  // =========================================================================
  describe('resolveRedirects', () => {
    it('returns terminal URL after following redirect chain', () => {
      service.loadRouteConfig(makeRoutes(
        makeRoute('a', undefined, { redirectTo: 'b', pathMatch: 'full' }),
        makeRoute('b', undefined, { redirectTo: 'c', pathMatch: 'full' }),
        makeRoute('c', 'FinalPage'),
      ));
      expect(service.resolveRedirects('/a')).toBe('c');
    });

    it('returns original URL if no redirect applies', () => {
      service.loadRouteConfig(makeRoutes(makeRoute('home', 'HomePage')));
      expect(service.resolveRedirects('/home')).toBe('home');
    });

    it('handles infinite redirect loop by returning original URL', () => {
      service.loadRouteConfig(makeRoutes(
        makeRoute('loop-a', undefined, { redirectTo: 'loop-b', pathMatch: 'full' }),
        makeRoute('loop-b', undefined, { redirectTo: 'loop-a', pathMatch: 'full' }),
      ));
      expect(service.resolveRedirects('/loop-a')).toBe('loop-a');
    });
  });

  // =========================================================================
  // 11. matchRoute
  // =========================================================================
  describe('matchRoute', () => {
    it('returns matched route entry for exact path', () => {
      const routes = makeRoutes(makeRoute('bridge', 'Bridge'));
      const result = service.matchRoute('/bridge', routes);
      expect(result.matched).toBe(true);
      expect(result.route).toEqual(makeRoute('bridge', 'Bridge'));
      expect(result.component).toBe('Bridge');
    });

    it('returns null route for no match', () => {
      const routes = makeRoutes(makeRoute('bridge', 'Bridge'));
      const result = service.matchRoute('/unknown', routes);
      expect(result.matched).toBe(false);
      expect(result.route).toBeNull();
      expect(result.component).toBeNull();
    });

    it('returns extracted params in result', () => {
      const routes = makeRoutes(makeRoute('crew/:id', 'CrewDetail'));
      const result = service.matchRoute('/crew/42', routes);
      expect(result.matched).toBe(true);
      expect(result.params).toEqual({ id: '42' });
    });

    it('respects pathMatch full', () => {
      const routes = makeRoutes(makeRoute('home', 'HomePage', { pathMatch: 'full' }));
      const fullResult = service.matchRoute('/home', routes);
      expect(fullResult.matched).toBe(true);
      const partialResult = service.matchRoute('/home/sub', routes);
      expect(partialResult.matched).toBe(false);
    });
  });

  // =========================================================================
  // 12. extractParams
  // =========================================================================
  describe('extractParams', () => {
    it('extracts single :id param', () => {
      expect(service.extractParams('/crew/42', 'crew/:id')).toEqual({ id: '42' });
    });

    it('extracts multiple params', () => {
      expect(service.extractParams('/systems/nav/status', 'systems/:systemId/:action')).toEqual({
        systemId: 'nav',
        action: 'status',
      });
    });

    it('returns empty record for no params', () => {
      expect(service.extractParams('/bridge', 'bridge')).toEqual({});
    });

    it('returns empty record for non-matching path', () => {
      expect(service.extractParams('/unknown', 'bridge')).toEqual({});
    });
  });

  // =========================================================================
  // 13. detectHullBreach
  // =========================================================================
  describe('detectHullBreach', () => {
    it('returns true when no route matches', () => {
      service.loadRouteConfig(makeRoutes(makeRoute('bridge', 'Bridge')));
      expect(service.detectHullBreach('/unknown')).toBe(true);
    });

    it('returns false when route matches', () => {
      service.loadRouteConfig(makeRoutes(makeRoute('bridge', 'Bridge')));
      expect(service.detectHullBreach('/bridge')).toBe(false);
    });

    it('works with loaded config (uses stored routes)', () => {
      service.loadRouteConfig(makeRoutes(makeRoute('a', 'A')));
      expect(service.detectHullBreach('/a')).toBe(false);
      expect(service.detectHullBreach('/b')).toBe(true);
    });
  });

  // =========================================================================
  // 14. reset
  // =========================================================================
  describe('reset', () => {
    it('clears stored route config', () => {
      service.loadRouteConfig(makeRoutes(makeRoute('a', 'A')));
      service.reset();
      expect(service.resolveNavigation('/a').isHullBreach).toBe(true);
    });

    it('resolveNavigation after reset returns hull breach', () => {
      service.loadRouteConfig(makeRoutes(makeRoute('a', 'A')));
      service.reset();
      const result = service.resolveNavigation('/a');
      expect(result.component).toBeNull();
      expect(result.isHullBreach).toBe(true);
    });

    it('can load new config after reset', () => {
      service.loadRouteConfig(makeRoutes(makeRoute('a', 'A')));
      service.reset();
      service.loadRouteConfig(makeRoutes(makeRoute('b', 'B')));
      expect(service.resolveNavigation('/b').component).toBe('B');
    });
  });

  // =========================================================================
  // 15. resolveUrl (interface method)
  // =========================================================================
  describe('resolveUrl (interface method)', () => {
    it('matches the CorridorRunnerSimulationService interface signature', () => {
      const routes = makeRoutes(makeRoute('bridge', 'Bridge'));
      const result = service.resolveUrl('/bridge', routes);
      expect(result.component).toBe('Bridge');
      expect(result.params).toEqual({});
    });

    it('returns null component for no match', () => {
      const routes = makeRoutes(makeRoute('bridge', 'Bridge'));
      const result = service.resolveUrl('/unknown', routes);
      expect(result.component).toBeNull();
      expect(result.params).toEqual({});
    });

    it('extracts params correctly', () => {
      const routes = makeRoutes(makeRoute('crew/:id', 'CrewDetail'));
      const result = service.resolveUrl('/crew/42', routes);
      expect(result.component).toBe('CrewDetail');
      expect(result.params).toEqual({ id: '42' });
    });
  });
});
