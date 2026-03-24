// ---------------------------------------------------------------------------
// Integration tests: PowerGridInjectionServiceImpl with real level data
// ---------------------------------------------------------------------------
// Exercises the injection validation service against REAL level data from
// POWER_GRID_LEVELS — catching data authoring bugs and validating that the
// service correctly handles realistic multi-scope scenarios.
// ---------------------------------------------------------------------------

import { PowerGridInjectionServiceImpl } from './power-grid-injection.service';
import { POWER_GRID_LEVELS } from '../../../data/levels/power-grid.data';
import type {
  PowerConnection,
  PowerGridLevelData,
  InjectionScope,
} from './power-grid.types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createService(): PowerGridInjectionServiceImpl {
  return new PowerGridInjectionServiceImpl();
}

function getLevelData(levelId: string): PowerGridLevelData {
  return POWER_GRID_LEVELS.find(l => l.levelId === levelId)!.data;
}

let connId = 0;
function makeConnection(
  serviceId: string,
  componentId: string,
  scope: InjectionScope,
): PowerConnection {
  return { id: `conn-${++connId}`, serviceId, componentId, scope };
}

// Level 12 valid connections shared between Test 6 and Test 7
function makeLevel12AllCorrect(data: PowerGridLevelData): PowerConnection[] {
  return data.validConnections.map(vc =>
    makeConnection(vc.serviceId, vc.componentId, vc.scope),
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('PowerGridInjectionService integration (real level data)', () => {
  let service: PowerGridInjectionServiceImpl;

  beforeEach(() => {
    connId = 0;
    service = createService();
  });

  // --- Test 1: Root-scoped service connects to any component (Level 1) ---
  it('root-scoped service connects to any component (Level 1)', () => {
    const data = getLevelData('pg-basic-01');
    const conn = makeConnection('pg-b01-svc-1', 'pg-b01-cmp-1', 'root');

    const single = service.validateConnection(conn, data.validConnections, data.scopeRules);
    expect(single.valid).toBe(true);

    const result = service.validateAll([conn], data.services, data.components, data.validConnections, data.scopeRules);
    expect(result.allCorrect).toBe(true);
  });

  // --- Test 2: Root-scoped service connects to multiple consumers (Level 2) ---
  it('root-scoped service connects to multiple consumers (Level 2)', () => {
    const data = getLevelData('pg-basic-02');
    const connections = [
      makeConnection('pg-b02-svc-1', 'pg-b02-cmp-1', 'root'),
      makeConnection('pg-b02-svc-1', 'pg-b02-cmp-2', 'root'),
      makeConnection('pg-b02-svc-1', 'pg-b02-cmp-3', 'root'),
    ];

    const result = service.validateAll(connections, data.services, data.components, data.validConnections, data.scopeRules);
    expect(result.allCorrect).toBe(true);
    expect(result.correctConnections.length).toBe(3);
    expect(result.shortCircuits.length).toBe(0);
    expect(result.missingConnections.length).toBe(0);
  });

  // --- Test 3: Component-scoped service validates scope (Level 7) ---
  it('component-scoped service validates scope correctly (Level 7)', () => {
    const data = getLevelData('pg-intermediate-01');

    const validComponent = makeConnection('pg-i01-svc-1', 'pg-i01-cmp-1', 'component');
    expect(service.validateConnection(validComponent, data.validConnections, data.scopeRules).valid).toBe(true);

    const validRoot = makeConnection('pg-i01-svc-1', 'pg-i01-cmp-2', 'root');
    expect(service.validateConnection(validRoot, data.validConnections, data.scopeRules).valid).toBe(true);

    const wrongScope = makeConnection('pg-i01-svc-1', 'pg-i01-cmp-2', 'component');
    const wrongResult = service.validateConnection(wrongScope, data.validConnections, data.scopeRules);
    expect(wrongResult.valid).toBe(false);
    expect(wrongResult.reason).toBe('wrong-scope');
  });

  // --- Test 4: Hierarchical scope validates parent-child chains (Level 8) ---
  it('hierarchical scope validates parent-child chains (Level 8)', () => {
    const data = getLevelData('pg-intermediate-02');
    const connections = [
      makeConnection('pg-i02-svc-1', 'pg-i02-cmp-1', 'hierarchical'),
      makeConnection('pg-i02-svc-1', 'pg-i02-cmp-2', 'hierarchical'),
      makeConnection('pg-i02-svc-1', 'pg-i02-cmp-3', 'hierarchical'),
    ];

    const result = service.validateAll(connections, data.services, data.components, data.validConnections, data.scopeRules);
    expect(result.allCorrect).toBe(true);

    const wrongScope = makeConnection('pg-i02-svc-1', 'pg-i02-cmp-1', 'component');
    const singleResult = service.validateConnection(wrongScope, data.validConnections, data.scopeRules);
    expect(singleResult.valid).toBe(false);
    expect(singleResult.reason).toBe('wrong-scope');
  });

  // --- Test 5: Wrong-pair short circuits from circular mis-wiring (Level 3) ---
  it('circular mis-wiring produces wrong-pair short circuits (Level 3)', () => {
    const data = getLevelData('pg-basic-03');
    const connections = [
      makeConnection('pg-b03-svc-1', 'pg-b03-cmp-2', 'root'),
      makeConnection('pg-b03-svc-2', 'pg-b03-cmp-3', 'root'),
      makeConnection('pg-b03-svc-3', 'pg-b03-cmp-1', 'root'),
    ];

    const shorts = service.detectShortCircuit(connections, data.services, data.validConnections, data.scopeRules);
    expect(shorts.length).toBe(3);
    expect(shorts.every(s => s.reason === 'wrong-pair')).toBe(true);

    const result = service.validateAll(connections, data.services, data.components, data.validConnections, data.scopeRules);
    expect(result.allCorrect).toBe(false);
    expect(result.shortCircuits.length).toBe(3);
    expect(result.missingConnections.length).toBe(3);
  });

  // --- Test 6: validateAll all-correct for mixed connections (Level 12) ---
  it('validateAll returns all-correct for full Level 12 connections', () => {
    const data = getLevelData('pg-intermediate-06');
    const connections = makeLevel12AllCorrect(data);

    const result = service.validateAll(connections, data.services, data.components, data.validConnections, data.scopeRules);
    expect(result.allCorrect).toBe(true);
    expect(result.correctConnections.length).toBe(9);
    expect(result.shortCircuits.length).toBe(0);
    expect(result.missingConnections.length).toBe(0);
  });

  // --- Test 7: validateAll with partial correct + wrong (Level 12) ---
  it('validateAll detects mixed correct/wrong on Level 12', () => {
    const data = getLevelData('pg-intermediate-06');
    const connections = [
      // 5 correct (first 5 from validConnections)
      makeConnection('pg-i06-svc-1', 'pg-i06-cmp-1', 'root'),
      makeConnection('pg-i06-svc-3', 'pg-i06-cmp-1', 'hierarchical'),
      makeConnection('pg-i06-svc-1', 'pg-i06-cmp-2', 'root'),
      makeConnection('pg-i06-svc-2', 'pg-i06-cmp-2', 'component'),
      makeConnection('pg-i06-svc-3', 'pg-i06-cmp-2', 'hierarchical'),
      // 2 wrong
      makeConnection('pg-i06-svc-2', 'pg-i06-cmp-3', 'component'), // wrong-pair
      makeConnection('pg-i06-svc-3', 'pg-i06-cmp-1', 'component'), // wrong-scope
    ];

    const result = service.validateAll(connections, data.services, data.components, data.validConnections, data.scopeRules);
    expect(result.allCorrect).toBe(false);
    expect(result.correctConnections.length).toBe(5);
    expect(result.shortCircuits.length).toBe(2);
    expect(result.missingConnections.length).toBe(4);
  });

  // --- Test 8: reset() clears state between level validations ---
  it('reset() clears state between level validations', () => {
    const level1 = getLevelData('pg-basic-01');
    const conn1 = makeConnection('pg-b01-svc-1', 'pg-b01-cmp-1', 'root');

    service.validateAll([conn1], level1.services, level1.components, level1.validConnections, level1.scopeRules);
    expect(service.lastValidationResult).not.toBeNull();

    service.reset();
    expect(service.lastValidationResult).toBeNull();

    const level12 = getLevelData('pg-intermediate-06');
    const connections12 = makeLevel12AllCorrect(level12);
    const result = service.validateAll(connections12, level12.services, level12.components, level12.validConnections, level12.scopeRules);
    expect(result.allCorrect).toBe(true);
    expect(result.correctConnections.length).toBe(9);
  });
});
