import {
  PowerGridEngine,
  PERFECT_SCORE_MULTIPLIER,
  SECOND_ATTEMPT_MULTIPLIER,
  THIRD_ATTEMPT_MULTIPLIER,
  DEFAULT_MAX_VERIFICATIONS,
  type ConnectServiceAction,
  type DisconnectServiceAction,
} from './power-grid.engine';
import type {
  ServiceNode,
  ComponentNode,
  ValidConnection,
  ScopeRule,
  PowerGridLevelData,
  GridValidationResult,
  PowerGridInjectionService,
} from './power-grid.types';
import {
  MinigameStatus,
  DifficultyTier,
  type MinigameLevel,
} from '../../../core/minigame/minigame.types';
import type { MinigameEngineConfig } from '../../../core/minigame/minigame-engine';

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

function createTestLevelData(
  overrides?: Partial<PowerGridLevelData>,
): PowerGridLevelData {
  const services = [
    createServiceNode({ id: 'svc-1', name: 'AuthService', providedIn: 'root' }),
    createServiceNode({ id: 'svc-2', name: 'DataService', providedIn: 'component' }),
  ];
  const components = [
    createComponentNode({ id: 'cmp-1', name: 'LoginComponent', requiredInjections: ['svc-1'] }),
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

  return {
    services,
    components,
    validConnections,
    scopeRules,
    ...overrides,
  };
}

function createLevel(
  data: PowerGridLevelData,
): MinigameLevel<PowerGridLevelData> {
  return {
    id: 'pg-test-01',
    gameId: 'power-grid',
    tier: DifficultyTier.Basic,
    conceptIntroduced: 'Dependency Injection',
    description: 'Test level',
    data,
  };
}

function createEngine(
  config?: Partial<MinigameEngineConfig>,
): PowerGridEngine {
  return new PowerGridEngine(config);
}

function initAndStart(
  engine: PowerGridEngine,
  data?: PowerGridLevelData,
): void {
  engine.initialize(createLevel(data ?? createTestLevelData()));
  engine.start();
}

/** Connect all correct connections for the default test level data. */
function connectAll(engine: PowerGridEngine): void {
  engine.submitAction({ type: 'connect-service', serviceId: 'svc-1', componentId: 'cmp-1', scope: 'root' } as ConnectServiceAction);
  engine.submitAction({ type: 'connect-service', serviceId: 'svc-2', componentId: 'cmp-2', scope: 'component' } as ConnectServiceAction);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('PowerGridEngine', () => {
  // --- 1. Initialization ---

  describe('Initialization', () => {
    it('should initialize with Loading status', () => {
      const engine = createEngine();
      engine.initialize(createLevel(createTestLevelData()));

      expect(engine.status()).toBe(MinigameStatus.Loading);
    });

    it('should populate services signal from level data', () => {
      const engine = createEngine();
      engine.initialize(createLevel(createTestLevelData()));

      expect(engine.services()).toHaveLength(2);
      expect(engine.services()[0].id).toBe('svc-1');
      expect(engine.services()[1].id).toBe('svc-2');
    });

    it('should populate components signal from level data', () => {
      const engine = createEngine();
      engine.initialize(createLevel(createTestLevelData()));

      expect(engine.components()).toHaveLength(2);
      expect(engine.components()[0].id).toBe('cmp-1');
      expect(engine.components()[1].id).toBe('cmp-2');
    });

    it('should start with 0 connections and verificationCount at 0', () => {
      const engine = createEngine();
      engine.initialize(createLevel(createTestLevelData()));

      expect(engine.connections()).toHaveLength(0);
      expect(engine.verificationCount()).toBe(0);
    });
  });

  // --- 2. Connect Service - valid ---

  describe('Connect Service - valid', () => {
    it('should add connection to connections signal when service and component exist', () => {
      const engine = createEngine();
      initAndStart(engine);

      engine.submitAction({
        type: 'connect-service',
        serviceId: 'svc-1',
        componentId: 'cmp-1',
        scope: 'root',
      } as ConnectServiceAction);

      expect(engine.connections()).toHaveLength(1);
      expect(engine.connections()[0].serviceId).toBe('svc-1');
      expect(engine.connections()[0].componentId).toBe('cmp-1');
      expect(engine.connections()[0].scope).toBe('root');
    });

    it('should return valid: true, scoreChange: 0, livesChange: 0', () => {
      const engine = createEngine();
      initAndStart(engine);

      const result = engine.submitAction({
        type: 'connect-service',
        serviceId: 'svc-1',
        componentId: 'cmp-1',
        scope: 'root',
      } as ConnectServiceAction);

      expect(result.valid).toBe(true);
      expect(result.scoreChange).toBe(0);
      expect(result.livesChange).toBe(0);
    });

    it('should generate unique connection IDs', () => {
      const engine = createEngine();
      initAndStart(engine);

      engine.submitAction({
        type: 'connect-service',
        serviceId: 'svc-1',
        componentId: 'cmp-1',
        scope: 'root',
      } as ConnectServiceAction);
      engine.submitAction({
        type: 'connect-service',
        serviceId: 'svc-2',
        componentId: 'cmp-2',
        scope: 'component',
      } as ConnectServiceAction);

      const ids = engine.connections().map(c => c.id);
      expect(ids[0]).not.toBe(ids[1]);
    });

    it('should allow multiple services connected to same component (if both required)', () => {
      const data = createTestLevelData({
        components: [
          createComponentNode({ id: 'cmp-1', name: 'MultiComponent', requiredInjections: ['svc-1', 'svc-2'] }),
        ],
        validConnections: [
          { serviceId: 'svc-1', componentId: 'cmp-1', scope: 'root' },
          { serviceId: 'svc-2', componentId: 'cmp-1', scope: 'component' },
        ],
      });
      const engine = createEngine();
      initAndStart(engine, data);

      engine.submitAction({ type: 'connect-service', serviceId: 'svc-1', componentId: 'cmp-1', scope: 'root' } as ConnectServiceAction);
      engine.submitAction({ type: 'connect-service', serviceId: 'svc-2', componentId: 'cmp-1', scope: 'component' } as ConnectServiceAction);

      expect(engine.connections()).toHaveLength(2);
    });
  });

  // --- 3. Connect Service - invalid ---

  describe('Connect Service - invalid', () => {
    it('should return invalid when serviceId does not exist', () => {
      const engine = createEngine();
      initAndStart(engine);

      const result = engine.submitAction({
        type: 'connect-service',
        serviceId: 'non-existent',
        componentId: 'cmp-1',
        scope: 'root',
      } as ConnectServiceAction);

      expect(result.valid).toBe(false);
    });

    it('should return invalid when componentId does not exist', () => {
      const engine = createEngine();
      initAndStart(engine);

      const result = engine.submitAction({
        type: 'connect-service',
        serviceId: 'svc-1',
        componentId: 'non-existent',
        scope: 'root',
      } as ConnectServiceAction);

      expect(result.valid).toBe(false);
    });

    it('should return invalid when component does not require the service', () => {
      const engine = createEngine();
      initAndStart(engine);

      // cmp-1 requires svc-1, not svc-2
      const result = engine.submitAction({
        type: 'connect-service',
        serviceId: 'svc-2',
        componentId: 'cmp-1',
        scope: 'component',
      } as ConnectServiceAction);

      expect(result.valid).toBe(false);
    });

    it('should return invalid for duplicate connection (same serviceId + componentId)', () => {
      const engine = createEngine();
      initAndStart(engine);

      engine.submitAction({
        type: 'connect-service',
        serviceId: 'svc-1',
        componentId: 'cmp-1',
        scope: 'root',
      } as ConnectServiceAction);

      const result = engine.submitAction({
        type: 'connect-service',
        serviceId: 'svc-1',
        componentId: 'cmp-1',
        scope: 'root',
      } as ConnectServiceAction);

      expect(result.valid).toBe(false);
    });

    it('should NOT add connection to state on invalid action', () => {
      const engine = createEngine();
      initAndStart(engine);

      engine.submitAction({
        type: 'connect-service',
        serviceId: 'non-existent',
        componentId: 'cmp-1',
        scope: 'root',
      } as ConnectServiceAction);

      expect(engine.connections()).toHaveLength(0);
    });
  });

  // --- 4. Disconnect Service ---

  describe('Disconnect Service', () => {
    it('should remove connection by connectionId', () => {
      const engine = createEngine();
      initAndStart(engine);

      engine.submitAction({
        type: 'connect-service',
        serviceId: 'svc-1',
        componentId: 'cmp-1',
        scope: 'root',
      } as ConnectServiceAction);

      const connectionId = engine.connections()[0].id;
      engine.submitAction({ type: 'disconnect-service', connectionId } as DisconnectServiceAction);

      expect(engine.connections()).toHaveLength(0);
    });

    it('should return valid: true on successful removal', () => {
      const engine = createEngine();
      initAndStart(engine);

      engine.submitAction({
        type: 'connect-service',
        serviceId: 'svc-1',
        componentId: 'cmp-1',
        scope: 'root',
      } as ConnectServiceAction);

      const connectionId = engine.connections()[0].id;
      const result = engine.submitAction({ type: 'disconnect-service', connectionId } as DisconnectServiceAction);

      expect(result.valid).toBe(true);
      expect(result.scoreChange).toBe(0);
      expect(result.livesChange).toBe(0);
    });

    it('should return invalid when connectionId does not exist', () => {
      const engine = createEngine();
      initAndStart(engine);

      const result = engine.submitAction({
        type: 'disconnect-service',
        connectionId: 'non-existent',
      } as DisconnectServiceAction);

      expect(result.valid).toBe(false);
    });
  });

  // --- 5. Verification - all correct ---

  describe('Verification - all correct', () => {
    it('should call complete() when all connections match answer key with correct scopes', () => {
      const engine = createEngine();
      initAndStart(engine);
      connectAll(engine);

      engine.verify();

      expect(engine.status()).toBe(MinigameStatus.Won);
    });

    it('should decrement verificationsRemaining by 1', () => {
      const engine = createEngine();
      initAndStart(engine);
      connectAll(engine);

      engine.verify();

      expect(engine.verificationsRemaining()).toBe(2);
    });

    it('should award maxScore on first-attempt perfect verification', () => {
      const engine = createEngine({ maxScore: 1000 });
      initAndStart(engine);
      connectAll(engine);

      engine.verify();

      expect(engine.score()).toBe(1000 * PERFECT_SCORE_MULTIPLIER);
    });
  });

  // --- 6. Verification - short circuits ---

  describe('Verification - short circuits', () => {
    it('should detect wrong-scope short circuit (correct pair, wrong scope)', () => {
      const engine = createEngine();
      initAndStart(engine);

      // svc-1 -> cmp-1 is valid, but scope should be 'root', we use 'component'
      engine.submitAction({
        type: 'connect-service',
        serviceId: 'svc-1',
        componentId: 'cmp-1',
        scope: 'component',
      } as ConnectServiceAction);
      engine.submitAction({
        type: 'connect-service',
        serviceId: 'svc-2',
        componentId: 'cmp-2',
        scope: 'component',
      } as ConnectServiceAction);

      const result = engine.verify();

      expect(result).not.toBeNull();
      expect(result!.shortCircuits.length).toBeGreaterThanOrEqual(1);
      const wrongScope = result!.shortCircuits.find(sc => sc.reason === 'wrong-scope');
      expect(wrongScope).toBeDefined();
      expect(wrongScope!.serviceId).toBe('svc-1');
      expect(wrongScope!.componentId).toBe('cmp-1');
    });

    it('should detect wrong-pair short circuit (service wired to wrong component)', () => {
      // Use a level where cmp-2 does NOT require svc-1 — but we need to be able to connect it.
      // With default test data, cmp-2 requires svc-2. So cmp-1 requires svc-1.
      // We need a component that requires svc-1 but we wire to wrong one.
      // Let's build custom data where both components require both services.
      const data = createTestLevelData({
        components: [
          createComponentNode({ id: 'cmp-1', name: 'LoginComponent', requiredInjections: ['svc-1', 'svc-2'] }),
          createComponentNode({ id: 'cmp-2', name: 'DashboardComponent', requiredInjections: ['svc-1', 'svc-2'] }),
        ],
        validConnections: [
          { serviceId: 'svc-1', componentId: 'cmp-1', scope: 'root' },
          { serviceId: 'svc-2', componentId: 'cmp-2', scope: 'component' },
        ],
      });
      const engine = createEngine();
      initAndStart(engine, data);

      // Wire svc-1 to cmp-2 — this is a wrong-pair (valid connection is svc-1 -> cmp-1)
      engine.submitAction({
        type: 'connect-service',
        serviceId: 'svc-1',
        componentId: 'cmp-2',
        scope: 'root',
      } as ConnectServiceAction);

      const result = engine.verify();

      expect(result).not.toBeNull();
      const wrongPair = result!.shortCircuits.find(sc => sc.reason === 'wrong-pair');
      expect(wrongPair).toBeDefined();
      expect(wrongPair!.serviceId).toBe('svc-1');
      expect(wrongPair!.componentId).toBe('cmp-2');
    });

    it('should report missing connections for unmet required injections', () => {
      const engine = createEngine();
      initAndStart(engine);

      // Only connect one of two required connections
      engine.submitAction({
        type: 'connect-service',
        serviceId: 'svc-1',
        componentId: 'cmp-1',
        scope: 'root',
      } as ConnectServiceAction);

      const result = engine.verify();

      expect(result).not.toBeNull();
      expect(result!.missingConnections.length).toBe(1);
      expect(result!.missingConnections[0].serviceId).toBe('svc-2');
      expect(result!.missingConnections[0].componentId).toBe('cmp-2');
    });

    it('should NOT complete when short circuits exist', () => {
      const engine = createEngine();
      initAndStart(engine);

      // Wrong scope for svc-1
      engine.submitAction({
        type: 'connect-service',
        serviceId: 'svc-1',
        componentId: 'cmp-1',
        scope: 'component',
      } as ConnectServiceAction);

      engine.verify();

      expect(engine.status()).toBe(MinigameStatus.Playing);
    });
  });

  // --- 7. Verification - attempts exhausted ---

  describe('Verification - attempts exhausted', () => {
    it('should call fail() when last verification attempt fails', () => {
      const engine = createEngine();
      initAndStart(engine);

      // Only draw one connection (incomplete) and verify 3 times
      engine.submitAction({
        type: 'connect-service',
        serviceId: 'svc-1',
        componentId: 'cmp-1',
        scope: 'root',
      } as ConnectServiceAction);

      engine.verify(); // attempt 1
      engine.verify(); // attempt 2
      engine.verify(); // attempt 3

      expect(engine.verificationsRemaining()).toBe(0);
      expect(engine.status()).toBe(MinigameStatus.Lost);
    });

    it('should set status to Lost', () => {
      const engine = createEngine();
      initAndStart(engine);

      engine.submitAction({
        type: 'connect-service',
        serviceId: 'svc-1',
        componentId: 'cmp-1',
        scope: 'root',
      } as ConnectServiceAction);

      engine.verify();
      engine.verify();
      engine.verify();

      expect(engine.status()).toBe(MinigameStatus.Lost);
    });
  });

  // --- 8. Verification - multi-attempt scoring ---

  describe('Verification - multi-attempt scoring', () => {
    it('should award maxScore * 0.4 on second-attempt success', () => {
      const engine = createEngine({ maxScore: 1000 });
      initAndStart(engine);

      // First attempt: only 1 connection (fail)
      engine.submitAction({
        type: 'connect-service',
        serviceId: 'svc-1',
        componentId: 'cmp-1',
        scope: 'root',
      } as ConnectServiceAction);
      engine.verify();
      expect(engine.status()).toBe(MinigameStatus.Playing);

      // Fix: draw remaining connection
      engine.submitAction({
        type: 'connect-service',
        serviceId: 'svc-2',
        componentId: 'cmp-2',
        scope: 'component',
      } as ConnectServiceAction);

      // Second attempt: all correct
      engine.verify();

      expect(engine.score()).toBe(Math.round(1000 * SECOND_ATTEMPT_MULTIPLIER));
      expect(engine.status()).toBe(MinigameStatus.Won);
    });

    it('should award maxScore * 0.2 on third-attempt success', () => {
      const engine = createEngine({ maxScore: 1000 });
      initAndStart(engine);

      // First attempt: incomplete
      engine.submitAction({
        type: 'connect-service',
        serviceId: 'svc-1',
        componentId: 'cmp-1',
        scope: 'root',
      } as ConnectServiceAction);
      engine.verify();

      // Second attempt: still incomplete
      engine.verify();

      // Third attempt: complete all connections
      engine.submitAction({
        type: 'connect-service',
        serviceId: 'svc-2',
        componentId: 'cmp-2',
        scope: 'component',
      } as ConnectServiceAction);
      engine.verify();

      expect(engine.score()).toBe(Math.round(1000 * THIRD_ATTEMPT_MULTIPLIER));
      expect(engine.status()).toBe(MinigameStatus.Won);
    });
  });

  // --- 9. Scope validation ---

  describe('Scope validation', () => {
    it('should accept root scope connection to any component', () => {
      const engine = createEngine();
      initAndStart(engine);
      connectAll(engine);

      const result = engine.verify();

      expect(result).not.toBeNull();
      const rootConn = result!.correctConnections.find(c => c.serviceId === 'svc-1');
      expect(rootConn).toBeDefined();
    });

    it('should accept component scope when component has service in providers', () => {
      const engine = createEngine();
      initAndStart(engine);
      connectAll(engine);

      const result = engine.verify();

      expect(result).not.toBeNull();
      const compConn = result!.correctConnections.find(c => c.serviceId === 'svc-2');
      expect(compConn).toBeDefined();
      expect(compConn!.scope).toBe('component');
    });

    it('should accept hierarchical scope validated against scopeRules allowedScopes', () => {
      const data = createTestLevelData({
        services: [
          createServiceNode({ id: 'svc-h', name: 'HierService', providedIn: 'hierarchical' }),
        ],
        components: [
          createComponentNode({ id: 'cmp-h', name: 'HierComponent', requiredInjections: ['svc-h'] }),
        ],
        validConnections: [
          { serviceId: 'svc-h', componentId: 'cmp-h', scope: 'hierarchical' },
        ],
        scopeRules: [
          { serviceId: 'svc-h', allowedScopes: ['hierarchical', 'root'], defaultScope: 'hierarchical' },
        ],
      });
      const engine = createEngine();
      initAndStart(engine, data);

      engine.submitAction({
        type: 'connect-service',
        serviceId: 'svc-h',
        componentId: 'cmp-h',
        scope: 'hierarchical',
      } as ConnectServiceAction);

      const result = engine.verify();

      expect(result).not.toBeNull();
      expect(result!.allCorrect).toBe(true);
      expect(result!.correctConnections).toHaveLength(1);
    });
  });

  // --- 10. Edge cases ---

  describe('Edge cases', () => {
    it('should return invalid for unknown action types', () => {
      const engine = createEngine();
      initAndStart(engine);

      const result = engine.submitAction({ type: 'unknown-action' });

      expect(result.valid).toBe(false);
      expect(result.scoreChange).toBe(0);
      expect(result.livesChange).toBe(0);
    });

    it('should return null from verify() when not Playing', () => {
      const engine = createEngine();
      engine.initialize(createLevel(createTestLevelData()));
      // Still in Loading status, not started

      const result = engine.verify();

      expect(result).toBeNull();
    });

    it('should handle empty level data -- verify completes immediately', () => {
      const engine = createEngine({ maxScore: 1000 });
      const data = createTestLevelData({
        services: [],
        components: [],
        validConnections: [],
        scopeRules: [],
      });
      initAndStart(engine, data);

      engine.verify();

      expect(engine.status()).toBe(MinigameStatus.Won);
      expect(engine.score()).toBe(1000 * PERFECT_SCORE_MULTIPLIER);
    });

    it('should restore initial state on reset', () => {
      const engine = createEngine();
      initAndStart(engine);

      // Modify state
      engine.submitAction({
        type: 'connect-service',
        serviceId: 'svc-1',
        componentId: 'cmp-1',
        scope: 'root',
      } as ConnectServiceAction);
      engine.verify();

      expect(engine.connections()).toHaveLength(1);
      expect(engine.verificationCount()).toBe(1);

      // Reset
      engine.reset();

      expect(engine.connections()).toHaveLength(0);
      expect(engine.verificationCount()).toBe(0);
      expect(engine.verificationsRemaining()).toBe(DEFAULT_MAX_VERIFICATIONS);
      expect(engine.status()).toBe(MinigameStatus.Playing);
    });
  });

  // --- 11. Validation service integration ---

  describe('Validation service integration', () => {
    function createMockService(): PowerGridInjectionService {
      return {
        validateAll: vi.fn(),
        reset: vi.fn(),
      };
    }

    it('should accept validation service in constructor', () => {
      const service = createMockService();
      const engine = new PowerGridEngine(undefined, service);

      // Engine should create without error
      expect(engine).toBeDefined();
    });

    it('should delegate validateAll to service on verify()', () => {
      const service = createMockService();
      const mockResult: GridValidationResult = {
        correctConnections: [],
        shortCircuits: [],
        missingConnections: [],
        allCorrect: true,
      };
      (service.validateAll as ReturnType<typeof vi.fn>).mockReturnValue(mockResult);

      const engine = new PowerGridEngine({ maxScore: 1000 }, service);
      initAndStart(engine);

      engine.verify();

      expect(service.validateAll).toHaveBeenCalledOnce();
    });

    it('should fall back to inline validation when no service provided', () => {
      const engine = createEngine({ maxScore: 1000 });
      initAndStart(engine);
      connectAll(engine);

      const result = engine.verify();

      expect(result).not.toBeNull();
      expect(result!.allCorrect).toBe(true);
      expect(engine.status()).toBe(MinigameStatus.Won);
    });

    it('should call service reset on level load', () => {
      const service = createMockService();
      const engine = new PowerGridEngine(undefined, service);
      engine.initialize(createLevel(createTestLevelData()));

      expect(service.reset).toHaveBeenCalledOnce();
    });
  });

  // --- 12. Scoring constants ---

  describe('Scoring constants', () => {
    it('should define scoring multipliers in descending order', () => {
      expect(PERFECT_SCORE_MULTIPLIER).toBe(1.0);
      expect(SECOND_ATTEMPT_MULTIPLIER).toBe(0.4);
      expect(THIRD_ATTEMPT_MULTIPLIER).toBe(0.2);
      expect(DEFAULT_MAX_VERIFICATIONS).toBe(3);
    });
  });

  // --- 13. Validation result signal ---

  describe('Validation result signal', () => {
    it('should expose _validationResult as public signal for UI feedback', () => {
      const engine = createEngine();
      initAndStart(engine);

      expect(engine.validationResult()).toBeNull();

      connectAll(engine);
      engine.verify();

      expect(engine.validationResult()).not.toBeNull();
      expect(engine.validationResult()!.allCorrect).toBe(true);
    });
  });
});
