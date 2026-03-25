// ---------------------------------------------------------------------------
// Integration test: CorridorRunnerSimulationService route resolution
// ---------------------------------------------------------------------------
// Verifies the full route resolution pipeline using real level data: loading
// route configs, running test navigations, and validating all results match
// expected destinations.
// Uses real CorridorRunnerSimulationService with level data.
// ---------------------------------------------------------------------------

import { CorridorRunnerSimulationService } from './corridor-runner-simulation.service';
import { CORRIDOR_RUNNER_LEVELS } from '../../../data/levels/corridor-runner.data';
import type { RouteEntry } from './corridor-runner.types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createService(): CorridorRunnerSimulationService {
  return new CorridorRunnerSimulationService();
}

function getLevelRouteConfig(levelIndex: number): readonly RouteEntry[] {
  return CORRIDOR_RUNNER_LEVELS[levelIndex].data.routeConfig;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('CorridorRunnerSimulationService route resolution integration', () => {
  let service: CorridorRunnerSimulationService;

  beforeEach(() => {
    service = createService();
  });

  // 1. Simple route config with 3 paths resolves all test navigations correctly
  it('simple route config with 3 paths resolves all test navigations correctly', () => {
    // Level 2 (cr-basic-02): bridge, medbay, cargo
    const routes = getLevelRouteConfig(1);
    service.loadRouteConfig(routes);

    const bridge = service.resolveNavigation('/bridge');
    expect(bridge.component).toBe('Bridge');
    expect(bridge.isHullBreach).toBe(false);

    const medbay = service.resolveNavigation('/medbay');
    expect(medbay.component).toBe('MedBay');
    expect(medbay.isHullBreach).toBe(false);

    const cargo = service.resolveNavigation('/cargo');
    expect(cargo.component).toBe('CargoBay');
    expect(cargo.isHullBreach).toBe(false);
  });

  // 2. Redirect chain resolves to final destination
  it('redirect chain resolves to final destination', () => {
    // Level 3 (cr-basic-03): '' redirectTo 'ops-center', 'ops-center' -> OpsCenter
    const routes = getLevelRouteConfig(2);
    service.loadRouteConfig(routes);

    const result = service.resolveNavigation('/');
    expect(result.component).toBe('OpsCenter');
    expect(result.isHullBreach).toBe(false);

    // Also verify resolveRedirects produces the terminal URL
    const redirected = service.resolveRedirects('/');
    expect(redirected).toBe('ops-center');
  });

  // 3. Unmatched URL triggers hull breach detection
  it('unmatched URL triggers hull breach detection', () => {
    // Level 1 (cr-basic-01): only 'engineering' -> EngineeringBay
    const routes = getLevelRouteConfig(0);
    service.loadRouteConfig(routes);

    const result = service.resolveNavigation('/unknown-deck');
    expect(result.component).toBeNull();
    expect(result.isHullBreach).toBe(true);

    expect(service.detectHullBreach('/unknown-deck')).toBe(true);
    expect(service.detectHullBreach('/engineering')).toBe(false);
  });

  // 4. Nested child routes resolve with correct parent/child composition
  it('nested child routes resolve with correct parent/child composition', () => {
    // Level 9 (cr-intermediate-03): admin -> children [users, logs, config]
    const routes = getLevelRouteConfig(8);
    service.loadRouteConfig(routes);

    const users = service.resolveNavigation('/admin/users');
    expect(users.component).toBe('UserManagement');
    expect(users.isHullBreach).toBe(false);

    const logs = service.resolveNavigation('/admin/logs');
    expect(logs.component).toBe('SystemLogs');
    expect(logs.isHullBreach).toBe(false);

    const config = service.resolveNavigation('/admin/config');
    expect(config.component).toBe('StationConfig');
    expect(config.isHullBreach).toBe(false);
  });

  // 5. Route params extracted correctly from parameterized URLs
  it('route params extracted correctly from parameterized URLs', () => {
    // Level 7 (cr-intermediate-01): crew, crew/:id
    const routes = getLevelRouteConfig(6);
    service.loadRouteConfig(routes);

    const crewList = service.resolveNavigation('/crew');
    expect(crewList.component).toBe('CrewList');
    expect(crewList.params).toEqual({});

    const profile = service.resolveNavigation('/crew/cpt-nova');
    expect(profile.component).toBe('CrewProfile');
    expect(profile.params).toEqual({ id: 'cpt-nova' });
    expect(profile.isHullBreach).toBe(false);

    // Also verify extractParams standalone
    const params = service.extractParams('/crew/eng-pulse', 'crew/:id');
    expect(params).toEqual({ id: 'eng-pulse' });
  });

  // 6. Wildcard route catches all unmatched paths
  it('wildcard route catches all unmatched paths', () => {
    // Level 4 (cr-basic-04): reactor, armory, **->HullBreachAlert
    const routes = getLevelRouteConfig(3);
    service.loadRouteConfig(routes);

    const reactor = service.resolveNavigation('/reactor');
    expect(reactor.component).toBe('ReactorRoom');
    expect(reactor.isHullBreach).toBe(false);

    const armory = service.resolveNavigation('/armory');
    expect(armory.component).toBe('Armory');
    expect(armory.isHullBreach).toBe(false);

    // Wildcard catches unknown paths (not a hull breach because component is provided)
    const unknown = service.resolveNavigation('/unknown-deck');
    expect(unknown.component).toBe('HullBreachAlert');
    expect(unknown.isHullBreach).toBe(false);

    // Even deeply nested unknown paths
    const deepUnknown = service.resolveNavigation('/foo/bar/baz');
    expect(deepUnknown.component).toBe('HullBreachAlert');
    expect(deepUnknown.isHullBreach).toBe(false);
  });

  // 7. resolveNavigation with params and extractParams produce consistent results
  it('resolveNavigation with params and extractParams produce consistent results', () => {
    // Level 7 (cr-intermediate-01): crew, crew/:id
    const routes = getLevelRouteConfig(6);
    service.loadRouteConfig(routes);

    // resolveNavigation resolves the full URL to the correct component with params
    const result = service.resolveNavigation('/crew/cpt-nova');
    expect(result.component).toBe('CrewProfile');
    expect(result.params).toEqual({ id: 'cpt-nova' });
    expect(result.isHullBreach).toBe(false);

    // extractParams on the matching route path extracts the same params
    const params = service.extractParams('/crew/cpt-nova', 'crew/:id');
    expect(params).toEqual({ id: 'cpt-nova' });
  });
});
