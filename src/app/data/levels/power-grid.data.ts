import { DifficultyTier } from '../../core/minigame/minigame.types';
import type { LevelDefinition, LevelPack } from '../../core/levels/level.types';
import type {
  PowerGridLevelData,
  ServiceNode,
  ComponentNode,
  ValidConnection,
  ScopeRule,
  InjectionScope,
  ProviderType,
} from '../../features/minigames/power-grid/power-grid.types';

// ---------------------------------------------------------------------------
// Builder helpers (private to this file)
// ---------------------------------------------------------------------------

/** Build a ServiceNode with sensible defaults. */
function service(
  id: string,
  name: string,
  type: string,
  providedIn: InjectionScope,
  opts?: {
    providerType?: ProviderType;
    kind?: 'class' | 'token';
    dependsOn?: readonly string[];
    methods?: readonly string[];
    stateful?: boolean;
  },
): ServiceNode {
  const base: ServiceNode = { id, name, type, providedIn };
  if (!opts) return base;
  return {
    ...base,
    ...(opts.providerType ? { providerType: opts.providerType } : {}),
    ...(opts.kind ? { kind: opts.kind } : {}),
    ...(opts.dependsOn ? { dependsOn: opts.dependsOn } : {}),
    ...(opts.methods ? { methods: opts.methods } : {}),
    ...(opts.stateful !== undefined ? { stateful: opts.stateful } : {}),
  };
}

/** Build a ComponentNode. */
function component(
  id: string,
  name: string,
  requiredInjections: readonly string[],
  providers?: readonly string[],
): ComponentNode {
  const base: ComponentNode = { id, name, requiredInjections };
  return providers ? { ...base, providers } : base;
}

/** Build a ValidConnection. */
function connection(
  serviceId: string,
  componentId: string,
  scope: InjectionScope,
): ValidConnection {
  return { serviceId, componentId, scope };
}

/** Build a ScopeRule. */
function rule(
  serviceId: string,
  allowedScopes: readonly InjectionScope[],
  defaultScope: InjectionScope,
): ScopeRule {
  return { serviceId, allowedScopes, defaultScope };
}

// ---------------------------------------------------------------------------
// Level definitions
// ---------------------------------------------------------------------------

export const POWER_GRID_LEVELS: readonly LevelDefinition<PowerGridLevelData>[] = [
  // =========================================================================
  // BASIC TIER (Levels 1-6)
  // =========================================================================

  // Level 1 — Single service
  {
    levelId: 'pg-basic-01',
    gameId: 'power-grid',
    tier: DifficultyTier.Basic,
    order: 1,
    title: 'First Connection',
    conceptIntroduced: 'Single service',
    description: 'Create @Injectable, provide in root, inject in one component.',
    data: {
      services: [
        service('pg-b01-svc-1', 'PowerService', 'PowerService', 'root'),
      ],
      components: [
        component('pg-b01-cmp-1', 'BridgeModule', ['pg-b01-svc-1']),
      ],
      validConnections: [
        connection('pg-b01-svc-1', 'pg-b01-cmp-1', 'root'),
      ],
      scopeRules: [
        rule('pg-b01-svc-1', ['root'], 'root'),
      ],
    },
  },

  // Level 2 — Multiple consumers
  {
    levelId: 'pg-basic-02',
    gameId: 'power-grid',
    tier: DifficultyTier.Basic,
    order: 2,
    title: 'Shared Power',
    conceptIntroduced: 'Multiple consumers',
    description: 'One service used by 3 components.',
    data: {
      services: [
        service('pg-b02-svc-1', 'PowerService', 'PowerService', 'root'),
      ],
      components: [
        component('pg-b02-cmp-1', 'BridgeModule', ['pg-b02-svc-1']),
        component('pg-b02-cmp-2', 'MedBayModule', ['pg-b02-svc-1']),
        component('pg-b02-cmp-3', 'EngineeringModule', ['pg-b02-svc-1']),
      ],
      validConnections: [
        connection('pg-b02-svc-1', 'pg-b02-cmp-1', 'root'),
        connection('pg-b02-svc-1', 'pg-b02-cmp-2', 'root'),
        connection('pg-b02-svc-1', 'pg-b02-cmp-3', 'root'),
      ],
      scopeRules: [
        rule('pg-b02-svc-1', ['root'], 'root'),
      ],
    },
  },

  // Level 3 — Multiple services
  {
    levelId: 'pg-basic-03',
    gameId: 'power-grid',
    tier: DifficultyTier.Basic,
    order: 3,
    title: 'Service Array',
    conceptIntroduced: 'Multiple services',
    description: '3 services, 3 components, 1:1 mapping.',
    data: {
      services: [
        service('pg-b03-svc-1', 'PowerService', 'PowerService', 'root'),
        service('pg-b03-svc-2', 'CrewService', 'CrewService', 'root'),
        service('pg-b03-svc-3', 'AlertService', 'AlertService', 'root'),
      ],
      components: [
        component('pg-b03-cmp-1', 'ReactorModule', ['pg-b03-svc-1']),
        component('pg-b03-cmp-2', 'HabitatModule', ['pg-b03-svc-2']),
        component('pg-b03-cmp-3', 'BridgeModule', ['pg-b03-svc-3']),
      ],
      validConnections: [
        connection('pg-b03-svc-1', 'pg-b03-cmp-1', 'root'),
        connection('pg-b03-svc-2', 'pg-b03-cmp-2', 'root'),
        connection('pg-b03-svc-3', 'pg-b03-cmp-3', 'root'),
      ],
      scopeRules: [
        rule('pg-b03-svc-1', ['root'], 'root'),
        rule('pg-b03-svc-2', ['root'], 'root'),
        rule('pg-b03-svc-3', ['root'], 'root'),
      ],
    },
  },

  // Level 4 — inject() function
  {
    levelId: 'pg-basic-04',
    gameId: 'power-grid',
    tier: DifficultyTier.Basic,
    order: 4,
    title: 'Modern Injection',
    conceptIntroduced: 'inject() function',
    description: 'Use inject() instead of constructor injection.',
    data: {
      services: [
        service('pg-b04-svc-1', 'DataService', 'DataService', 'root'),
        service('pg-b04-svc-2', 'LogService', 'LogService', 'root'),
        service('pg-b04-svc-3', 'AuthService', 'AuthService', 'root'),
      ],
      components: [
        component('pg-b04-cmp-1', 'SensorModule', ['pg-b04-svc-1']),
        component('pg-b04-cmp-2', 'CommsModule', ['pg-b04-svc-2']),
        component('pg-b04-cmp-3', 'CargoModule', ['pg-b04-svc-3']),
      ],
      validConnections: [
        connection('pg-b04-svc-1', 'pg-b04-cmp-1', 'root'),
        connection('pg-b04-svc-2', 'pg-b04-cmp-2', 'root'),
        connection('pg-b04-svc-3', 'pg-b04-cmp-3', 'root'),
      ],
      scopeRules: [
        rule('pg-b04-svc-1', ['root'], 'root'),
        rule('pg-b04-svc-2', ['root'], 'root'),
        rule('pg-b04-svc-3', ['root'], 'root'),
      ],
    },
  },

  // Level 5 — Service with state
  {
    levelId: 'pg-basic-05',
    gameId: 'power-grid',
    tier: DifficultyTier.Basic,
    order: 5,
    title: 'Stateful Grid',
    conceptIntroduced: 'Service with state',
    description: 'Service holds shared state between components.',
    data: {
      services: [
        service('pg-b05-svc-1', 'PowerService', 'PowerService', 'root', { stateful: true }),
        service('pg-b05-svc-2', 'CrewService', 'CrewService', 'root', { stateful: true }),
      ],
      components: [
        component('pg-b05-cmp-1', 'ReactorModule', ['pg-b05-svc-1']),
        component('pg-b05-cmp-2', 'BridgeModule', ['pg-b05-svc-1', 'pg-b05-svc-2']),
        component('pg-b05-cmp-3', 'HabitatModule', ['pg-b05-svc-2']),
      ],
      validConnections: [
        connection('pg-b05-svc-1', 'pg-b05-cmp-1', 'root'),
        connection('pg-b05-svc-1', 'pg-b05-cmp-2', 'root'),
        connection('pg-b05-svc-2', 'pg-b05-cmp-2', 'root'),
        connection('pg-b05-svc-2', 'pg-b05-cmp-3', 'root'),
      ],
      scopeRules: [
        rule('pg-b05-svc-1', ['root'], 'root'),
        rule('pg-b05-svc-2', ['root'], 'root'),
      ],
    },
  },

  // Level 6 — Service methods
  {
    levelId: 'pg-basic-06',
    gameId: 'power-grid',
    tier: DifficultyTier.Basic,
    order: 6,
    title: 'Method Dispatch',
    conceptIntroduced: 'Service methods',
    description: 'Components call service methods for data.',
    data: {
      services: [
        service('pg-b06-svc-1', 'DataService', 'DataService', 'root', { methods: ['fetchSensorData', 'getStatus'] }),
        service('pg-b06-svc-2', 'AlertService', 'AlertService', 'root', { methods: ['triggerAlert', 'clearAlert'] }),
        service('pg-b06-svc-3', 'NavigationService', 'NavigationService', 'root', { methods: ['plotCourse', 'getPosition'] }),
      ],
      components: [
        component('pg-b06-cmp-1', 'SensorModule', ['pg-b06-svc-1']),
        component('pg-b06-cmp-2', 'BridgeModule', ['pg-b06-svc-2', 'pg-b06-svc-3']),
        component('pg-b06-cmp-3', 'CommsModule', ['pg-b06-svc-2']),
        component('pg-b06-cmp-4', 'EngineeringModule', ['pg-b06-svc-1', 'pg-b06-svc-3']),
      ],
      validConnections: [
        connection('pg-b06-svc-1', 'pg-b06-cmp-1', 'root'),
        connection('pg-b06-svc-2', 'pg-b06-cmp-2', 'root'),
        connection('pg-b06-svc-3', 'pg-b06-cmp-2', 'root'),
        connection('pg-b06-svc-2', 'pg-b06-cmp-3', 'root'),
        connection('pg-b06-svc-1', 'pg-b06-cmp-4', 'root'),
        connection('pg-b06-svc-3', 'pg-b06-cmp-4', 'root'),
      ],
      scopeRules: [
        rule('pg-b06-svc-1', ['root'], 'root'),
        rule('pg-b06-svc-2', ['root'], 'root'),
        rule('pg-b06-svc-3', ['root'], 'root'),
      ],
    },
  },

  // =========================================================================
  // INTERMEDIATE TIER (Levels 7-12)
  // =========================================================================

  // Level 7 — Component-level providers
  {
    levelId: 'pg-intermediate-01',
    gameId: 'power-grid',
    tier: DifficultyTier.Intermediate,
    order: 1,
    title: 'Local Power',
    conceptIntroduced: 'Component-level providers',
    description: 'Service scoped to a single component.',
    data: {
      services: [
        service('pg-i01-svc-1', 'LogService', 'LogService', 'component'),
      ],
      components: [
        component('pg-i01-cmp-1', 'BridgeModule', ['pg-i01-svc-1'], ['pg-i01-svc-1']),
        component('pg-i01-cmp-2', 'EngineeringModule', ['pg-i01-svc-1']),
      ],
      validConnections: [
        connection('pg-i01-svc-1', 'pg-i01-cmp-1', 'component'),
        connection('pg-i01-svc-1', 'pg-i01-cmp-2', 'root'),
      ],
      scopeRules: [
        rule('pg-i01-svc-1', ['root', 'component'], 'component'),
      ],
    },
  },

  // Level 8 — Hierarchical injection
  {
    levelId: 'pg-intermediate-02',
    gameId: 'power-grid',
    tier: DifficultyTier.Intermediate,
    order: 2,
    title: 'Power Cascade',
    conceptIntroduced: 'Hierarchical injection',
    description: 'Parent provides, children inherit.',
    data: {
      services: [
        service('pg-i02-svc-1', 'PowerService', 'PowerService', 'hierarchical'),
      ],
      components: [
        component('pg-i02-cmp-1', 'CommandModule', ['pg-i02-svc-1'], ['pg-i02-svc-1']),
        component('pg-i02-cmp-2', 'BridgeModule', ['pg-i02-svc-1']),
        component('pg-i02-cmp-3', 'SensorModule', ['pg-i02-svc-1']),
      ],
      validConnections: [
        connection('pg-i02-svc-1', 'pg-i02-cmp-1', 'hierarchical'),
        connection('pg-i02-svc-1', 'pg-i02-cmp-2', 'hierarchical'),
        connection('pg-i02-svc-1', 'pg-i02-cmp-3', 'hierarchical'),
      ],
      scopeRules: [
        rule('pg-i02-svc-1', ['root', 'hierarchical'], 'hierarchical'),
      ],
    },
  },

  // Level 9 — Multiple instances
  {
    levelId: 'pg-intermediate-03',
    gameId: 'power-grid',
    tier: DifficultyTier.Intermediate,
    order: 3,
    title: 'Dual Generators',
    conceptIntroduced: 'Multiple instances',
    description: 'Same service class, different instances via scoping.',
    data: {
      services: [
        service('pg-i03-svc-1', 'DataService', 'DataService', 'component'),
      ],
      components: [
        component('pg-i03-cmp-1', 'ScienceLabModule', ['pg-i03-svc-1'], ['pg-i03-svc-1']),
        component('pg-i03-cmp-2', 'MedBayModule', ['pg-i03-svc-1'], ['pg-i03-svc-1']),
        component('pg-i03-cmp-3', 'CargoModule', ['pg-i03-svc-1']),
      ],
      validConnections: [
        connection('pg-i03-svc-1', 'pg-i03-cmp-1', 'component'),
        connection('pg-i03-svc-1', 'pg-i03-cmp-2', 'component'),
        connection('pg-i03-svc-1', 'pg-i03-cmp-3', 'root'),
      ],
      scopeRules: [
        rule('pg-i03-svc-1', ['root', 'component'], 'component'),
      ],
    },
  },

  // Level 10 — Service-to-service injection
  {
    levelId: 'pg-intermediate-04',
    gameId: 'power-grid',
    tier: DifficultyTier.Intermediate,
    order: 4,
    title: 'Chained Power',
    conceptIntroduced: 'Service-to-service injection',
    description: 'Services that depend on other services.',
    data: {
      services: [
        service('pg-i04-svc-1', 'LogService', 'LogService', 'root'),
        service('pg-i04-svc-2', 'AuthService', 'AuthService', 'root', { dependsOn: ['pg-i04-svc-1'] }),
        service('pg-i04-svc-3', 'DataService', 'DataService', 'root', { dependsOn: ['pg-i04-svc-2'] }),
      ],
      components: [
        component('pg-i04-cmp-1', 'BridgeModule', ['pg-i04-svc-3']),
        component('pg-i04-cmp-2', 'CommsModule', ['pg-i04-svc-2']),
        component('pg-i04-cmp-3', 'EngineeringModule', ['pg-i04-svc-1']),
      ],
      validConnections: [
        connection('pg-i04-svc-3', 'pg-i04-cmp-1', 'root'),
        connection('pg-i04-svc-2', 'pg-i04-cmp-2', 'root'),
        connection('pg-i04-svc-1', 'pg-i04-cmp-3', 'root'),
      ],
      scopeRules: [
        rule('pg-i04-svc-1', ['root'], 'root'),
        rule('pg-i04-svc-2', ['root'], 'root'),
        rule('pg-i04-svc-3', ['root'], 'root'),
      ],
    },
  },

  // Level 11 — Injection tokens
  {
    levelId: 'pg-intermediate-05',
    gameId: 'power-grid',
    tier: DifficultyTier.Intermediate,
    order: 5,
    title: 'Token Grid',
    conceptIntroduced: 'Injection tokens',
    description: 'InjectionToken for non-class dependencies.',
    data: {
      services: [
        service('pg-i05-svc-1', 'PowerService', 'PowerService', 'root'),
        service('pg-i05-svc-2', 'CrewService', 'CrewService', 'root'),
        service('pg-i05-svc-3', 'STATION_CONFIG', 'InjectionToken<StationConfig>', 'root', { kind: 'token' }),
      ],
      components: [
        component('pg-i05-cmp-1', 'ReactorModule', ['pg-i05-svc-1', 'pg-i05-svc-3']),
        component('pg-i05-cmp-2', 'HabitatModule', ['pg-i05-svc-2', 'pg-i05-svc-3']),
        component('pg-i05-cmp-3', 'BridgeModule', ['pg-i05-svc-1', 'pg-i05-svc-2']),
      ],
      validConnections: [
        connection('pg-i05-svc-1', 'pg-i05-cmp-1', 'root'),
        connection('pg-i05-svc-3', 'pg-i05-cmp-1', 'root'),
        connection('pg-i05-svc-2', 'pg-i05-cmp-2', 'root'),
        connection('pg-i05-svc-3', 'pg-i05-cmp-2', 'root'),
        connection('pg-i05-svc-1', 'pg-i05-cmp-3', 'root'),
        connection('pg-i05-svc-2', 'pg-i05-cmp-3', 'root'),
      ],
      scopeRules: [
        rule('pg-i05-svc-1', ['root'], 'root'),
        rule('pg-i05-svc-2', ['root'], 'root'),
        rule('pg-i05-svc-3', ['root'], 'root'),
      ],
    },
  },

  // Level 12 — Mixed challenge
  {
    levelId: 'pg-intermediate-06',
    gameId: 'power-grid',
    tier: DifficultyTier.Intermediate,
    order: 6,
    title: 'Full Circuit',
    conceptIntroduced: 'Mixed challenge',
    description: 'All scoping patterns in one grid.',
    data: {
      services: [
        service('pg-i06-svc-1', 'PowerService', 'PowerService', 'root'),
        service('pg-i06-svc-2', 'LogService', 'LogService', 'component'),
        service('pg-i06-svc-3', 'AlertService', 'AlertService', 'hierarchical'),
        service('pg-i06-svc-4', 'DataService', 'DataService', 'root', { stateful: true }),
      ],
      components: [
        component('pg-i06-cmp-1', 'CommandModule', ['pg-i06-svc-1', 'pg-i06-svc-3'], ['pg-i06-svc-3']),
        component('pg-i06-cmp-2', 'BridgeModule', ['pg-i06-svc-1', 'pg-i06-svc-2', 'pg-i06-svc-3'], ['pg-i06-svc-2']),
        component('pg-i06-cmp-3', 'ReactorModule', ['pg-i06-svc-4']),
        component('pg-i06-cmp-4', 'SensorModule', ['pg-i06-svc-3', 'pg-i06-svc-4']),
        component('pg-i06-cmp-5', 'MedBayModule', ['pg-i06-svc-2'], ['pg-i06-svc-2']),
      ],
      validConnections: [
        connection('pg-i06-svc-1', 'pg-i06-cmp-1', 'root'),
        connection('pg-i06-svc-3', 'pg-i06-cmp-1', 'hierarchical'),
        connection('pg-i06-svc-1', 'pg-i06-cmp-2', 'root'),
        connection('pg-i06-svc-2', 'pg-i06-cmp-2', 'component'),
        connection('pg-i06-svc-3', 'pg-i06-cmp-2', 'hierarchical'),
        connection('pg-i06-svc-4', 'pg-i06-cmp-3', 'root'),
        connection('pg-i06-svc-3', 'pg-i06-cmp-4', 'hierarchical'),
        connection('pg-i06-svc-4', 'pg-i06-cmp-4', 'root'),
        connection('pg-i06-svc-2', 'pg-i06-cmp-5', 'component'),
      ],
      scopeRules: [
        rule('pg-i06-svc-1', ['root'], 'root'),
        rule('pg-i06-svc-2', ['root', 'component'], 'component'),
        rule('pg-i06-svc-3', ['root', 'hierarchical'], 'hierarchical'),
        rule('pg-i06-svc-4', ['root'], 'root'),
      ],
    },
  },

  // =========================================================================
  // ADVANCED TIER (Levels 13-17)
  // =========================================================================

  // Level 13 — useFactory
  {
    levelId: 'pg-advanced-01',
    gameId: 'power-grid',
    tier: DifficultyTier.Advanced,
    order: 1,
    title: 'Factory Line',
    conceptIntroduced: 'useFactory',
    description: 'Factory providers for conditional service creation.',
    data: {
      services: [
        service('pg-a01-svc-1', 'PowerService', 'PowerService', 'root'),
        service('pg-a01-svc-2', 'LifeSupportService', 'LifeSupportService', 'root', { providerType: 'factory' }),
      ],
      components: [
        component('pg-a01-cmp-1', 'ReactorModule', ['pg-a01-svc-1']),
        component('pg-a01-cmp-2', 'HabitatModule', ['pg-a01-svc-2']),
        component('pg-a01-cmp-3', 'MedBayModule', ['pg-a01-svc-1', 'pg-a01-svc-2']),
      ],
      validConnections: [
        connection('pg-a01-svc-1', 'pg-a01-cmp-1', 'root'),
        connection('pg-a01-svc-2', 'pg-a01-cmp-2', 'root'),
        connection('pg-a01-svc-1', 'pg-a01-cmp-3', 'root'),
        connection('pg-a01-svc-2', 'pg-a01-cmp-3', 'root'),
      ],
      scopeRules: [
        rule('pg-a01-svc-1', ['root'], 'root'),
        rule('pg-a01-svc-2', ['root'], 'root'),
      ],
    },
  },

  // Level 14 — useValue / useExisting
  {
    levelId: 'pg-advanced-02',
    gameId: 'power-grid',
    tier: DifficultyTier.Advanced,
    order: 2,
    title: 'Alias Grid',
    conceptIntroduced: 'useValue / useExisting',
    description: 'Alias and value providers.',
    data: {
      services: [
        service('pg-a02-svc-1', 'AlertService', 'AlertService', 'root'),
        service('pg-a02-svc-2', 'ALERT_THRESHOLD', 'InjectionToken<number>', 'root', { providerType: 'value', kind: 'token' }),
        service('pg-a02-svc-3', 'NotificationService', 'NotificationService', 'root', { providerType: 'existing' }),
      ],
      components: [
        component('pg-a02-cmp-1', 'BridgeModule', ['pg-a02-svc-1', 'pg-a02-svc-2']),
        component('pg-a02-cmp-2', 'CommsModule', ['pg-a02-svc-3']),
        component('pg-a02-cmp-3', 'EngineeringModule', ['pg-a02-svc-1', 'pg-a02-svc-3']),
      ],
      validConnections: [
        connection('pg-a02-svc-1', 'pg-a02-cmp-1', 'root'),
        connection('pg-a02-svc-2', 'pg-a02-cmp-1', 'root'),
        connection('pg-a02-svc-3', 'pg-a02-cmp-2', 'root'),
        connection('pg-a02-svc-1', 'pg-a02-cmp-3', 'root'),
        connection('pg-a02-svc-3', 'pg-a02-cmp-3', 'root'),
      ],
      scopeRules: [
        rule('pg-a02-svc-1', ['root'], 'root'),
        rule('pg-a02-svc-2', ['root'], 'root'),
        rule('pg-a02-svc-3', ['root'], 'root'),
      ],
    },
  },

  // Level 15 — Multi providers
  {
    levelId: 'pg-advanced-03',
    gameId: 'power-grid',
    tier: DifficultyTier.Advanced,
    order: 3,
    title: 'Multi-Source',
    conceptIntroduced: 'Multi providers',
    description: 'Multiple implementations for same token.',
    data: {
      services: [
        service('pg-a03-svc-1', 'POWER_SOURCE', 'InjectionToken<PowerSource[]>', 'root', { kind: 'token' }),
        service('pg-a03-svc-2', 'SolarProvider', 'SolarProvider', 'root', { providerType: 'class' }),
        service('pg-a03-svc-3', 'ReactorProvider', 'ReactorProvider', 'root', { providerType: 'class' }),
        service('pg-a03-svc-4', 'FusionProvider', 'FusionProvider', 'root', { providerType: 'class' }),
      ],
      components: [
        component('pg-a03-cmp-1', 'ReactorModule', ['pg-a03-svc-1', 'pg-a03-svc-4']),
        component('pg-a03-cmp-2', 'HabitatModule', ['pg-a03-svc-1', 'pg-a03-svc-2']),
        component('pg-a03-cmp-3', 'EngineeringModule', ['pg-a03-svc-1', 'pg-a03-svc-3']),
      ],
      validConnections: [
        connection('pg-a03-svc-1', 'pg-a03-cmp-1', 'root'),
        connection('pg-a03-svc-4', 'pg-a03-cmp-1', 'root'),
        connection('pg-a03-svc-1', 'pg-a03-cmp-2', 'root'),
        connection('pg-a03-svc-2', 'pg-a03-cmp-2', 'root'),
        connection('pg-a03-svc-1', 'pg-a03-cmp-3', 'root'),
        connection('pg-a03-svc-3', 'pg-a03-cmp-3', 'root'),
      ],
      scopeRules: [
        rule('pg-a03-svc-1', ['root'], 'root'),
        rule('pg-a03-svc-2', ['root'], 'root'),
        rule('pg-a03-svc-3', ['root'], 'root'),
        rule('pg-a03-svc-4', ['root'], 'root'),
      ],
    },
  },

  // Level 16 — Optional injection
  {
    levelId: 'pg-advanced-04',
    gameId: 'power-grid',
    tier: DifficultyTier.Advanced,
    order: 4,
    title: 'Graceful Degradation',
    conceptIntroduced: 'Optional injection',
    description: 'Handle missing services gracefully.',
    data: {
      services: [
        service('pg-a04-svc-1', 'PowerService', 'PowerService', 'root'),
        service('pg-a04-svc-2', 'NavigationService', 'NavigationService', 'root'),
        service('pg-a04-svc-3', 'DebugService', 'DebugService', 'component'),
      ],
      components: [
        component('pg-a04-cmp-1', 'BridgeModule', ['pg-a04-svc-1', 'pg-a04-svc-2']),
        component('pg-a04-cmp-2', 'SensorModule', ['pg-a04-svc-2', 'pg-a04-svc-3'], ['pg-a04-svc-3']),
        component('pg-a04-cmp-3', 'CargoModule', ['pg-a04-svc-1']),
        component('pg-a04-cmp-4', 'ArmoryModule', ['pg-a04-svc-1', 'pg-a04-svc-3'], ['pg-a04-svc-3']),
      ],
      validConnections: [
        connection('pg-a04-svc-1', 'pg-a04-cmp-1', 'root'),
        connection('pg-a04-svc-2', 'pg-a04-cmp-1', 'root'),
        connection('pg-a04-svc-2', 'pg-a04-cmp-2', 'root'),
        connection('pg-a04-svc-3', 'pg-a04-cmp-2', 'component'),
        connection('pg-a04-svc-1', 'pg-a04-cmp-3', 'root'),
        connection('pg-a04-svc-1', 'pg-a04-cmp-4', 'root'),
        connection('pg-a04-svc-3', 'pg-a04-cmp-4', 'component'),
      ],
      scopeRules: [
        rule('pg-a04-svc-1', ['root'], 'root'),
        rule('pg-a04-svc-2', ['root'], 'root'),
        rule('pg-a04-svc-3', ['root', 'component'], 'component'),
      ],
    },
  },

  // Level 17 — Full grid design
  {
    levelId: 'pg-advanced-05',
    gameId: 'power-grid',
    tier: DifficultyTier.Advanced,
    order: 5,
    title: 'Architect Mode',
    conceptIntroduced: 'Full grid design',
    description: 'Design a complete DI architecture from scratch.',
    data: {
      services: [
        service('pg-a05-svc-1', 'PowerService', 'PowerService', 'root', { stateful: true }),
        service('pg-a05-svc-2', 'AuthService', 'AuthService', 'root', { dependsOn: ['pg-a05-svc-5'] }),
        service('pg-a05-svc-3', 'DataService', 'DataService', 'hierarchical', { methods: ['query', 'mutate'] }),
        service('pg-a05-svc-4', 'LogService', 'LogService', 'component'),
        service('pg-a05-svc-5', 'CrewService', 'CrewService', 'root'),
      ],
      components: [
        component('pg-a05-cmp-1', 'CommandModule', ['pg-a05-svc-1', 'pg-a05-svc-2'], ['pg-a05-svc-3']),
        component('pg-a05-cmp-2', 'BridgeModule', ['pg-a05-svc-2', 'pg-a05-svc-3', 'pg-a05-svc-4'], ['pg-a05-svc-4']),
        component('pg-a05-cmp-3', 'ReactorModule', ['pg-a05-svc-1', 'pg-a05-svc-4'], ['pg-a05-svc-4']),
        component('pg-a05-cmp-4', 'SensorModule', ['pg-a05-svc-3', 'pg-a05-svc-5']),
        component('pg-a05-cmp-5', 'HabitatModule', ['pg-a05-svc-5', 'pg-a05-svc-1']),
        component('pg-a05-cmp-6', 'MedBayModule', ['pg-a05-svc-3', 'pg-a05-svc-4'], ['pg-a05-svc-4']),
      ],
      validConnections: [
        connection('pg-a05-svc-1', 'pg-a05-cmp-1', 'root'),
        connection('pg-a05-svc-2', 'pg-a05-cmp-1', 'root'),
        connection('pg-a05-svc-2', 'pg-a05-cmp-2', 'root'),
        connection('pg-a05-svc-3', 'pg-a05-cmp-2', 'hierarchical'),
        connection('pg-a05-svc-4', 'pg-a05-cmp-2', 'component'),
        connection('pg-a05-svc-1', 'pg-a05-cmp-3', 'root'),
        connection('pg-a05-svc-4', 'pg-a05-cmp-3', 'component'),
        connection('pg-a05-svc-3', 'pg-a05-cmp-4', 'hierarchical'),
        connection('pg-a05-svc-5', 'pg-a05-cmp-4', 'root'),
        connection('pg-a05-svc-5', 'pg-a05-cmp-5', 'root'),
        connection('pg-a05-svc-1', 'pg-a05-cmp-5', 'root'),
        connection('pg-a05-svc-3', 'pg-a05-cmp-6', 'hierarchical'),
        connection('pg-a05-svc-4', 'pg-a05-cmp-6', 'component'),
      ],
      scopeRules: [
        rule('pg-a05-svc-1', ['root'], 'root'),
        rule('pg-a05-svc-2', ['root'], 'root'),
        rule('pg-a05-svc-3', ['root', 'hierarchical'], 'hierarchical'),
        rule('pg-a05-svc-4', ['root', 'component'], 'component'),
        rule('pg-a05-svc-5', ['root'], 'root'),
      ],
    },
  },

  // =========================================================================
  // BOSS TIER (Level 18)
  // =========================================================================

  // Level 18 — Grid Overhaul
  {
    levelId: 'pg-boss-01',
    gameId: 'power-grid',
    tier: DifficultyTier.Boss,
    order: 1,
    title: 'Grid Overhaul',
    conceptIntroduced: 'Complete DI architecture',
    description: 'Redesign the entire station power grid: 8 services, 12 components, hierarchical injection, factory providers, multi-providers, and component-scoped services.',
    parTime: 300,
    data: {
      services: [
        service('pg-boss-svc-1', 'PowerService', 'PowerService', 'root', { stateful: true, methods: ['distribute', 'getOutput'] }),
        service('pg-boss-svc-2', 'CrewService', 'CrewService', 'root', { stateful: true }),
        service('pg-boss-svc-3', 'AlertService', 'AlertService', 'hierarchical', { methods: ['triggerAlert', 'clearAlert'] }),
        service('pg-boss-svc-4', 'DataService', 'DataService', 'root', { dependsOn: ['pg-boss-svc-2'] }),
        service('pg-boss-svc-5', 'AuthService', 'AuthService', 'root', { dependsOn: ['pg-boss-svc-2', 'pg-boss-svc-6'] }),
        service('pg-boss-svc-6', 'LogService', 'LogService', 'component'),
        service('pg-boss-svc-7', 'NavigationService', 'NavigationService', 'root', { providerType: 'factory', methods: ['plotCourse'] }),
        service('pg-boss-svc-8', 'LifeSupportService', 'LifeSupportService', 'root', { providerType: 'factory', stateful: true }),
      ],
      components: [
        component('pg-boss-cmp-1', 'BridgeModule', ['pg-boss-svc-1', 'pg-boss-svc-5', 'pg-boss-svc-7']),
        component('pg-boss-cmp-2', 'MedBayModule', ['pg-boss-svc-2', 'pg-boss-svc-8', 'pg-boss-svc-6'], ['pg-boss-svc-6']),
        component('pg-boss-cmp-3', 'EngineeringModule', ['pg-boss-svc-1', 'pg-boss-svc-4', 'pg-boss-svc-6'], ['pg-boss-svc-6']),
        component('pg-boss-cmp-4', 'CargoModule', ['pg-boss-svc-4', 'pg-boss-svc-2']),
        component('pg-boss-cmp-5', 'SensorModule', ['pg-boss-svc-1', 'pg-boss-svc-3', 'pg-boss-svc-7']),
        component('pg-boss-cmp-6', 'ReactorModule', ['pg-boss-svc-1', 'pg-boss-svc-8']),
        component('pg-boss-cmp-7', 'HabitatModule', ['pg-boss-svc-2', 'pg-boss-svc-3', 'pg-boss-svc-8']),
        component('pg-boss-cmp-8', 'CommsModule', ['pg-boss-svc-4', 'pg-boss-svc-5']),
        component('pg-boss-cmp-9', 'ArmoryModule', ['pg-boss-svc-5', 'pg-boss-svc-6'], ['pg-boss-svc-6']),
        component('pg-boss-cmp-10', 'ScienceLabModule', ['pg-boss-svc-4', 'pg-boss-svc-3']),
        component('pg-boss-cmp-11', 'HangarModule', ['pg-boss-svc-7', 'pg-boss-svc-1']),
        component('pg-boss-cmp-12', 'CommandModule', ['pg-boss-svc-3', 'pg-boss-svc-5', 'pg-boss-svc-6'], ['pg-boss-svc-3', 'pg-boss-svc-6']),
      ],
      validConnections: [
        connection('pg-boss-svc-1', 'pg-boss-cmp-1', 'root'),
        connection('pg-boss-svc-5', 'pg-boss-cmp-1', 'root'),
        connection('pg-boss-svc-7', 'pg-boss-cmp-1', 'root'),
        connection('pg-boss-svc-2', 'pg-boss-cmp-2', 'root'),
        connection('pg-boss-svc-8', 'pg-boss-cmp-2', 'root'),
        connection('pg-boss-svc-6', 'pg-boss-cmp-2', 'component'),
        connection('pg-boss-svc-1', 'pg-boss-cmp-3', 'root'),
        connection('pg-boss-svc-4', 'pg-boss-cmp-3', 'root'),
        connection('pg-boss-svc-6', 'pg-boss-cmp-3', 'component'),
        connection('pg-boss-svc-4', 'pg-boss-cmp-4', 'root'),
        connection('pg-boss-svc-2', 'pg-boss-cmp-4', 'root'),
        connection('pg-boss-svc-1', 'pg-boss-cmp-5', 'root'),
        connection('pg-boss-svc-3', 'pg-boss-cmp-5', 'hierarchical'),
        connection('pg-boss-svc-7', 'pg-boss-cmp-5', 'root'),
        connection('pg-boss-svc-1', 'pg-boss-cmp-6', 'root'),
        connection('pg-boss-svc-8', 'pg-boss-cmp-6', 'root'),
        connection('pg-boss-svc-2', 'pg-boss-cmp-7', 'root'),
        connection('pg-boss-svc-3', 'pg-boss-cmp-7', 'hierarchical'),
        connection('pg-boss-svc-8', 'pg-boss-cmp-7', 'root'),
        connection('pg-boss-svc-4', 'pg-boss-cmp-8', 'root'),
        connection('pg-boss-svc-5', 'pg-boss-cmp-8', 'root'),
        connection('pg-boss-svc-5', 'pg-boss-cmp-9', 'root'),
        connection('pg-boss-svc-6', 'pg-boss-cmp-9', 'component'),
        connection('pg-boss-svc-4', 'pg-boss-cmp-10', 'root'),
        connection('pg-boss-svc-3', 'pg-boss-cmp-10', 'hierarchical'),
        connection('pg-boss-svc-7', 'pg-boss-cmp-11', 'root'),
        connection('pg-boss-svc-1', 'pg-boss-cmp-11', 'root'),
        connection('pg-boss-svc-3', 'pg-boss-cmp-12', 'hierarchical'),
        connection('pg-boss-svc-5', 'pg-boss-cmp-12', 'root'),
        connection('pg-boss-svc-6', 'pg-boss-cmp-12', 'component'),
      ],
      scopeRules: [
        rule('pg-boss-svc-1', ['root'], 'root'),
        rule('pg-boss-svc-2', ['root'], 'root'),
        rule('pg-boss-svc-3', ['root', 'hierarchical'], 'hierarchical'),
        rule('pg-boss-svc-4', ['root'], 'root'),
        rule('pg-boss-svc-5', ['root'], 'root'),
        rule('pg-boss-svc-6', ['root', 'component'], 'component'),
        rule('pg-boss-svc-7', ['root'], 'root'),
        rule('pg-boss-svc-8', ['root'], 'root'),
      ],
    },
  },
];

// ---------------------------------------------------------------------------
// Level Pack
// ---------------------------------------------------------------------------

export const POWER_GRID_LEVEL_PACK: LevelPack = {
  gameId: 'power-grid',
  levels: POWER_GRID_LEVELS,
};
