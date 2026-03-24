import { TestBed } from '@angular/core/testing';
import { PowerGridInjectionServiceImpl } from './power-grid-injection.service';
import type {
  ServiceNode,
  ComponentNode,
  ValidConnection,
  ScopeRule,
  PowerConnection,
} from './power-grid.types';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function createServiceNode(overrides?: Partial<ServiceNode>): ServiceNode {
  return {
    id: 'svc-1',
    name: 'AuthService',
    type: 'service',
    providedIn: 'root',
    ...overrides,
  };
}

function createComponentNode(overrides?: Partial<ComponentNode>): ComponentNode {
  return {
    id: 'cmp-1',
    name: 'LoginComponent',
    requiredInjections: ['svc-1'],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('PowerGridInjectionServiceImpl', () => {
  let service: PowerGridInjectionServiceImpl;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [PowerGridInjectionServiceImpl],
    });
    service = TestBed.inject(PowerGridInjectionServiceImpl);
  });

  // =========================================================================
  // 1. Creation and initial state
  // =========================================================================
  describe('Creation and initial state', () => {
    it('should be created via TestBed', () => {
      expect(service).toBeTruthy();
    });

    it('reset() does not throw when called with no prior validation', () => {
      expect(() => service.reset()).not.toThrow();
    });
  });

  // =========================================================================
  // 2. validateConnection -- root scope
  // =========================================================================
  describe('validateConnection -- root scope', () => {
    const validConnections: ValidConnection[] = [
      { serviceId: 'svc-1', componentId: 'cmp-1', scope: 'root' },
    ];
    const scopeRules: ScopeRule[] = [
      { serviceId: 'svc-1', allowedScopes: ['root'], defaultScope: 'root' },
    ];

    it('root-scoped service with matching valid connection returns valid', () => {
      const conn: PowerConnection = {
        id: 'conn-1',
        serviceId: 'svc-1',
        componentId: 'cmp-1',
        scope: 'root',
      };
      const result = service.validateConnection(conn, validConnections, scopeRules);
      expect(result.valid).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('root-scoped service connecting to wrong component returns wrong-pair', () => {
      const conn: PowerConnection = {
        id: 'conn-1',
        serviceId: 'svc-1',
        componentId: 'cmp-999',
        scope: 'root',
      };
      const result = service.validateConnection(conn, validConnections, scopeRules);
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('wrong-pair');
    });

    it('root-scoped service with scope not in allowedScopes returns wrong-scope', () => {
      const conn: PowerConnection = {
        id: 'conn-1',
        serviceId: 'svc-1',
        componentId: 'cmp-1',
        scope: 'component', // Not in allowedScopes for svc-1
      };
      const result = service.validateConnection(conn, validConnections, scopeRules);
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('wrong-scope');
    });
  });

  // =========================================================================
  // 3. validateConnection -- component scope
  // =========================================================================
  describe('validateConnection -- component scope', () => {
    const validConnections: ValidConnection[] = [
      { serviceId: 'svc-2', componentId: 'cmp-2', scope: 'component' },
    ];
    const scopeRules: ScopeRule[] = [
      { serviceId: 'svc-2', allowedScopes: ['component', 'hierarchical'], defaultScope: 'component' },
    ];

    it('component-scoped service connecting to correct component returns valid', () => {
      const conn: PowerConnection = {
        id: 'conn-1',
        serviceId: 'svc-2',
        componentId: 'cmp-2',
        scope: 'component',
      };
      const result = service.validateConnection(conn, validConnections, scopeRules);
      expect(result.valid).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('component-scoped service connecting to wrong component returns wrong-pair', () => {
      const conn: PowerConnection = {
        id: 'conn-1',
        serviceId: 'svc-2',
        componentId: 'cmp-1',
        scope: 'component',
      };
      const result = service.validateConnection(conn, validConnections, scopeRules);
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('wrong-pair');
    });
  });

  // =========================================================================
  // 4. validateConnection -- hierarchical scope
  // =========================================================================
  describe('validateConnection -- hierarchical scope', () => {
    const validConnections: ValidConnection[] = [
      { serviceId: 'svc-3', componentId: 'cmp-3', scope: 'hierarchical' },
    ];
    const scopeRules: ScopeRule[] = [
      { serviceId: 'svc-3', allowedScopes: ['hierarchical'], defaultScope: 'hierarchical' },
    ];

    it('hierarchical-scoped service with matching valid connection returns valid', () => {
      const conn: PowerConnection = {
        id: 'conn-1',
        serviceId: 'svc-3',
        componentId: 'cmp-3',
        scope: 'hierarchical',
      };
      const result = service.validateConnection(conn, validConnections, scopeRules);
      expect(result.valid).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('hierarchical scope when not in allowedScopes returns wrong-scope', () => {
      const scopeRulesRestricted: ScopeRule[] = [
        { serviceId: 'svc-3', allowedScopes: ['root'], defaultScope: 'root' },
      ];
      const conn: PowerConnection = {
        id: 'conn-1',
        serviceId: 'svc-3',
        componentId: 'cmp-3',
        scope: 'hierarchical',
      };
      const result = service.validateConnection(conn, validConnections, scopeRulesRestricted);
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('wrong-scope');
    });
  });

  // =========================================================================
  // 5. checkScope
  // =========================================================================
  describe('checkScope', () => {
    const scopeRules: ScopeRule[] = [
      { serviceId: 'svc-1', allowedScopes: ['root'], defaultScope: 'root' },
    ];

    it('returns true when scope is in allowedScopes', () => {
      expect(service.checkScope('svc-1', 'root', scopeRules)).toBe(true);
    });

    it('returns false when scope is not in allowedScopes', () => {
      expect(service.checkScope('svc-1', 'component', scopeRules)).toBe(false);
    });

    it('returns true when no scope rule exists for service (lenient)', () => {
      expect(service.checkScope('svc-unknown', 'component', scopeRules)).toBe(true);
    });
  });

  // =========================================================================
  // 6. detectShortCircuit
  // =========================================================================
  describe('detectShortCircuit', () => {
    const services = [
      createServiceNode({ id: 'svc-1', providedIn: 'root' }),
      createServiceNode({ id: 'svc-2', name: 'DataService', providedIn: 'component' }),
    ];
    const validConnections: ValidConnection[] = [
      { serviceId: 'svc-1', componentId: 'cmp-1', scope: 'root' },
      { serviceId: 'svc-2', componentId: 'cmp-2', scope: 'component' },
    ];
    const scopeRules: ScopeRule[] = [
      { serviceId: 'svc-1', allowedScopes: ['root'], defaultScope: 'root' },
      { serviceId: 'svc-2', allowedScopes: ['component', 'hierarchical'], defaultScope: 'component' },
    ];

    it('returns empty array when all connections are valid', () => {
      const connections: PowerConnection[] = [
        { id: 'conn-1', serviceId: 'svc-1', componentId: 'cmp-1', scope: 'root' },
        { id: 'conn-2', serviceId: 'svc-2', componentId: 'cmp-2', scope: 'component' },
      ];
      const shorts = service.detectShortCircuit(connections, services, validConnections, scopeRules);
      expect(shorts).toEqual([]);
    });

    it('detects wrong-pair connection', () => {
      const connections: PowerConnection[] = [
        { id: 'conn-1', serviceId: 'svc-1', componentId: 'cmp-999', scope: 'root' },
      ];
      const shorts = service.detectShortCircuit(connections, services, validConnections, scopeRules);
      expect(shorts.length).toBe(1);
      expect(shorts[0].reason).toBe('wrong-pair');
      expect(shorts[0].connectionId).toBe('conn-1');
    });

    it('detects wrong-scope connection', () => {
      const connections: PowerConnection[] = [
        { id: 'conn-1', serviceId: 'svc-1', componentId: 'cmp-1', scope: 'component' },
      ];
      const shorts = service.detectShortCircuit(connections, services, validConnections, scopeRules);
      expect(shorts.length).toBe(1);
      expect(shorts[0].reason).toBe('wrong-scope');
      expect(shorts[0].connectionId).toBe('conn-1');
    });
  });

  // =========================================================================
  // 7. validateAll
  // =========================================================================
  describe('validateAll', () => {
    const services = [
      createServiceNode({ id: 'svc-1', providedIn: 'root' }),
      createServiceNode({ id: 'svc-2', name: 'DataService', providedIn: 'component' }),
    ];
    const components = [
      createComponentNode({ id: 'cmp-1', requiredInjections: ['svc-1'] }),
      createComponentNode({ id: 'cmp-2', name: 'DashboardComponent', requiredInjections: ['svc-2'], providers: ['svc-2'] }),
    ];
    const validConnections: ValidConnection[] = [
      { serviceId: 'svc-1', componentId: 'cmp-1', scope: 'root' },
      { serviceId: 'svc-2', componentId: 'cmp-2', scope: 'component' },
    ];
    const scopeRules: ScopeRule[] = [
      { serviceId: 'svc-1', allowedScopes: ['root'], defaultScope: 'root' },
      { serviceId: 'svc-2', allowedScopes: ['component', 'hierarchical'], defaultScope: 'component' },
    ];

    it('returns allCorrect: true when all connections match with correct scopes', () => {
      const connections: PowerConnection[] = [
        { id: 'conn-1', serviceId: 'svc-1', componentId: 'cmp-1', scope: 'root' },
        { id: 'conn-2', serviceId: 'svc-2', componentId: 'cmp-2', scope: 'component' },
      ];
      const result = service.validateAll(connections, services, components, validConnections, scopeRules);
      expect(result.allCorrect).toBe(true);
      expect(result.correctConnections.length).toBe(2);
      expect(result.shortCircuits.length).toBe(0);
      expect(result.missingConnections.length).toBe(0);
    });

    it('returns correct per-connection pass/fail for mixed connections', () => {
      const connections: PowerConnection[] = [
        { id: 'conn-1', serviceId: 'svc-1', componentId: 'cmp-1', scope: 'root' },
        { id: 'conn-2', serviceId: 'svc-2', componentId: 'cmp-999', scope: 'component' }, // wrong pair
      ];
      const result = service.validateAll(connections, services, components, validConnections, scopeRules);
      expect(result.allCorrect).toBe(false);
      expect(result.correctConnections.length).toBe(1);
      expect(result.shortCircuits.length).toBe(1);
      expect(result.shortCircuits[0].reason).toBe('wrong-pair');
      expect(result.missingConnections.length).toBe(1);
    });

    it('correctly identifies missing connections', () => {
      const connections: PowerConnection[] = [
        { id: 'conn-1', serviceId: 'svc-1', componentId: 'cmp-1', scope: 'root' },
        // Missing svc-2 -> cmp-2
      ];
      const result = service.validateAll(connections, services, components, validConnections, scopeRules);
      expect(result.allCorrect).toBe(false);
      expect(result.missingConnections.length).toBe(1);
      expect(result.missingConnections[0].serviceId).toBe('svc-2');
      expect(result.missingConnections[0].componentId).toBe('cmp-2');
    });

    it('returns allCorrect: false when any short circuit exists', () => {
      const connections: PowerConnection[] = [
        { id: 'conn-1', serviceId: 'svc-1', componentId: 'cmp-1', scope: 'component' }, // wrong scope
        { id: 'conn-2', serviceId: 'svc-2', componentId: 'cmp-2', scope: 'component' },
      ];
      const result = service.validateAll(connections, services, components, validConnections, scopeRules);
      expect(result.allCorrect).toBe(false);
      expect(result.shortCircuits.length).toBe(1);
      expect(result.shortCircuits[0].reason).toBe('wrong-scope');
    });
  });

  // =========================================================================
  // 8. getValidConnections
  // =========================================================================
  describe('getValidConnections', () => {
    const validConnections: ValidConnection[] = [
      { serviceId: 'svc-1', componentId: 'cmp-1', scope: 'root' },
      { serviceId: 'svc-1', componentId: 'cmp-2', scope: 'root' },
      { serviceId: 'svc-2', componentId: 'cmp-2', scope: 'component' },
    ];
    const scopeRules: ScopeRule[] = [
      { serviceId: 'svc-1', allowedScopes: ['root'], defaultScope: 'root' },
      { serviceId: 'svc-2', allowedScopes: ['component'], defaultScope: 'component' },
    ];
    const components = [
      createComponentNode({ id: 'cmp-1', requiredInjections: ['svc-1'] }),
      createComponentNode({ id: 'cmp-2', name: 'DashboardComponent', requiredInjections: ['svc-1', 'svc-2'] }),
      createComponentNode({ id: 'cmp-3', name: 'SettingsComponent', requiredInjections: [] }),
    ];

    it('returns only components that appear in validConnections for the given service', () => {
      const svc = createServiceNode({ id: 'svc-1', providedIn: 'root' });
      const result = service.getValidConnections(svc, components, validConnections, scopeRules);
      expect(result.length).toBe(2);
      expect(result.map(c => c.id)).toContain('cmp-1');
      expect(result.map(c => c.id)).toContain('cmp-2');
    });

    it('returns empty array when no components can receive the service', () => {
      const svc = createServiceNode({ id: 'svc-unknown', providedIn: 'root' });
      const result = service.getValidConnections(svc, components, validConnections, scopeRules);
      expect(result).toEqual([]);
    });

    it('filters based on scope rules', () => {
      // svc-2 only allowed at 'component' scope. validConnections has svc-2 -> cmp-2 at component.
      // If we restrict allowedScopes so that component is no longer allowed, it should return empty.
      const restrictedScopeRules: ScopeRule[] = [
        { serviceId: 'svc-2', allowedScopes: ['root'], defaultScope: 'root' }, // component NOT allowed
      ];
      const svc = createServiceNode({ id: 'svc-2', name: 'DataService', providedIn: 'component' });
      const result = service.getValidConnections(svc, components, validConnections, restrictedScopeRules);
      expect(result).toEqual([]);
    });
  });

  // =========================================================================
  // 9. reset
  // =========================================================================
  describe('reset', () => {
    it('clears cached validation result after validateAll was called', () => {
      const services = [createServiceNode({ id: 'svc-1', providedIn: 'root' })];
      const components = [createComponentNode({ id: 'cmp-1', requiredInjections: ['svc-1'] })];
      const validConnections: ValidConnection[] = [
        { serviceId: 'svc-1', componentId: 'cmp-1', scope: 'root' },
      ];
      const scopeRules: ScopeRule[] = [
        { serviceId: 'svc-1', allowedScopes: ['root'], defaultScope: 'root' },
      ];
      const connections: PowerConnection[] = [
        { id: 'conn-1', serviceId: 'svc-1', componentId: 'cmp-1', scope: 'root' },
      ];

      service.validateAll(connections, services, components, validConnections, scopeRules);
      expect(service.lastValidationResult).not.toBeNull();

      service.reset();
      expect(service.lastValidationResult).toBeNull();
    });

    it('is idempotent (calling reset twice does not throw)', () => {
      service.reset();
      expect(() => service.reset()).not.toThrow();
    });
  });
});
