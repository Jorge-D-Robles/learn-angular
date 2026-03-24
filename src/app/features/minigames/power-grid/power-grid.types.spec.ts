import {
  isConnectionValid,
  isScopeAllowed,
  type PowerConnection,
  type ShortCircuit,
  type GridValidationResult,
  type ValidConnection,
  type ScopeRule,
} from './power-grid.types';

// ---------------------------------------------------------------------------
// Test data helpers
// ---------------------------------------------------------------------------

const VALID_CONNECTIONS: ValidConnection[] = [
  { serviceId: 'svc-1', componentId: 'cmp-1', scope: 'root' },
  { serviceId: 'svc-2', componentId: 'cmp-2', scope: 'component' },
];

const SCOPE_RULES: ScopeRule[] = [
  { serviceId: 'svc-1', allowedScopes: ['root'], defaultScope: 'root' },
  { serviceId: 'svc-2', allowedScopes: ['component', 'hierarchical'], defaultScope: 'component' },
];

// ---------------------------------------------------------------------------
// isScopeAllowed
// ---------------------------------------------------------------------------

describe('isScopeAllowed', () => {
  it('should return true when scope is in the service allowedScopes', () => {
    expect(isScopeAllowed('svc-1', 'root', SCOPE_RULES)).toBe(true);
  });

  it('should return false when scope is not in the service allowedScopes', () => {
    expect(isScopeAllowed('svc-1', 'component', SCOPE_RULES)).toBe(false);
  });

  it('should return true when no scopeRule exists for the serviceId (lenient)', () => {
    expect(isScopeAllowed('svc-unknown', 'root', SCOPE_RULES)).toBe(true);
  });

  it('should return true when scopeRules array is empty', () => {
    expect(isScopeAllowed('svc-1', 'root', [])).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// isConnectionValid
// ---------------------------------------------------------------------------

describe('isConnectionValid', () => {
  it('should return true when connection matches a valid connection entry', () => {
    const conn = { serviceId: 'svc-1', componentId: 'cmp-1', scope: 'root' as const };
    expect(isConnectionValid(conn, VALID_CONNECTIONS, SCOPE_RULES)).toBe(true);
  });

  it('should return false when serviceId-componentId pair is not in valid connections', () => {
    const conn = { serviceId: 'svc-1', componentId: 'cmp-2', scope: 'root' as const };
    expect(isConnectionValid(conn, VALID_CONNECTIONS, SCOPE_RULES)).toBe(false);
  });

  it('should return false when pair matches but scope does not match', () => {
    const conn = { serviceId: 'svc-1', componentId: 'cmp-1', scope: 'component' as const };
    expect(isConnectionValid(conn, VALID_CONNECTIONS, SCOPE_RULES)).toBe(false);
  });

  it('should return false when scope is not in scopeRules allowedScopes for that service', () => {
    // svc-1 only allows 'root'; using 'hierarchical' should fail at pair match
    // (pair match requires exact scope match too)
    const conn = { serviceId: 'svc-1', componentId: 'cmp-1', scope: 'hierarchical' as const };
    expect(isConnectionValid(conn, VALID_CONNECTIONS, SCOPE_RULES)).toBe(false);
  });

  it('should return true when pair matches and no scopeRule exists for the service', () => {
    const validConns: ValidConnection[] = [
      { serviceId: 'svc-free', componentId: 'cmp-1', scope: 'root' },
    ];
    const conn = { serviceId: 'svc-free', componentId: 'cmp-1', scope: 'root' as const };
    expect(isConnectionValid(conn, validConns, SCOPE_RULES)).toBe(true);
  });

  it('should return false when pair is NOT in validConnections even if no scopeRule exists', () => {
    const conn = { serviceId: 'svc-free', componentId: 'cmp-999', scope: 'root' as const };
    expect(isConnectionValid(conn, VALID_CONNECTIONS, [])).toBe(false);
  });

  it('should return false when pair matches validConnections but scope is not in allowedScopes', () => {
    // svc-2 -> cmp-2 at 'component' is valid, but 'root' is not in svc-2 allowedScopes
    const validConns: ValidConnection[] = [
      { serviceId: 'svc-2', componentId: 'cmp-2', scope: 'root' },
    ];
    expect(isConnectionValid(
      { serviceId: 'svc-2', componentId: 'cmp-2', scope: 'root' as const },
      validConns,
      SCOPE_RULES,
    )).toBe(false);
  });

  it('should return false when validConnections is empty', () => {
    const conn = { serviceId: 'svc-1', componentId: 'cmp-1', scope: 'root' as const };
    expect(isConnectionValid(conn, [], SCOPE_RULES)).toBe(false);
  });

  it('should return true when scopeRules is empty and pair matches (scope check passes)', () => {
    const conn = { serviceId: 'svc-1', componentId: 'cmp-1', scope: 'root' as const };
    expect(isConnectionValid(conn, VALID_CONNECTIONS, [])).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Type structure smoke tests
// ---------------------------------------------------------------------------

describe('Type structures', () => {
  it('PowerConnection has required fields: id, serviceId, componentId, scope', () => {
    const conn: PowerConnection = {
      id: 'conn-1',
      serviceId: 'svc-1',
      componentId: 'cmp-1',
      scope: 'root',
    };
    expect(conn.id).toBe('conn-1');
    expect(conn.serviceId).toBe('svc-1');
    expect(conn.componentId).toBe('cmp-1');
    expect(conn.scope).toBe('root');
  });

  it('PowerConnection.isCorrect is optional', () => {
    const withoutIsCorrect: PowerConnection = {
      id: 'conn-1',
      serviceId: 'svc-1',
      componentId: 'cmp-1',
      scope: 'root',
    };
    expect(withoutIsCorrect.isCorrect).toBeUndefined();

    const withIsCorrect: PowerConnection = {
      id: 'conn-2',
      serviceId: 'svc-1',
      componentId: 'cmp-1',
      scope: 'root',
      isCorrect: true,
    };
    expect(withIsCorrect.isCorrect).toBe(true);
  });

  it('ShortCircuit has required fields: connectionId, serviceId, componentId, reason', () => {
    const sc: ShortCircuit = {
      connectionId: 'conn-1',
      serviceId: 'svc-1',
      componentId: 'cmp-1',
      reason: 'wrong-pair',
    };
    expect(sc.connectionId).toBe('conn-1');
    expect(sc.serviceId).toBe('svc-1');
    expect(sc.componentId).toBe('cmp-1');
    expect(sc.reason).toBe('wrong-pair');
  });

  it('ShortCircuit.description and involvedNodes are optional', () => {
    const minimal: ShortCircuit = {
      connectionId: 'conn-1',
      serviceId: 'svc-1',
      componentId: 'cmp-1',
      reason: 'wrong-scope',
    };
    expect(minimal.description).toBeUndefined();
    expect(minimal.involvedNodes).toBeUndefined();

    const full: ShortCircuit = {
      connectionId: 'conn-1',
      serviceId: 'svc-1',
      componentId: 'cmp-1',
      reason: 'wrong-scope',
      description: 'Scope mismatch',
      involvedNodes: ['svc-1', 'cmp-1'],
    };
    expect(full.description).toBe('Scope mismatch');
    expect(full.involvedNodes).toEqual(['svc-1', 'cmp-1']);
  });

  it('GridValidationResult has correctConnections, shortCircuits, missingConnections, allCorrect', () => {
    const result: GridValidationResult = {
      correctConnections: [],
      shortCircuits: [],
      missingConnections: [],
      allCorrect: true,
    };
    expect(result.correctConnections).toEqual([]);
    expect(result.shortCircuits).toEqual([]);
    expect(result.missingConnections).toEqual([]);
    expect(result.allCorrect).toBe(true);
  });
});
