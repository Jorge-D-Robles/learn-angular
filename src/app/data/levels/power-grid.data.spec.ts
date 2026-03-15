import { DifficultyTier } from '../../core/minigame/minigame.types';
import type { LevelDefinition } from '../../core/levels/level.types';
import type {
  PowerGridLevelData,
  ServiceNode,
  ComponentNode,
  ValidConnection,
  ScopeRule,
  InjectionScope,
} from '../../features/minigames/power-grid/power-grid.types';
import {
  POWER_GRID_LEVELS,
  POWER_GRID_LEVEL_PACK,
} from './power-grid.data';

// --- Compile-time type checks ---

const _service: ServiceNode = { id: 's', name: 'Svc', type: 'DataService', providedIn: 'root' };
const _component: ComponentNode = { id: 'c', name: 'Cmp', requiredInjections: ['s'] };
const _connection: ValidConnection = { serviceId: 's', componentId: 'c', scope: 'root' };
const _scopeRule: ScopeRule = { serviceId: 's', allowedScopes: ['root'], defaultScope: 'root' };

const _levelData: PowerGridLevelData = {
  services: [_service],
  components: [_component],
  validConnections: [_connection],
  scopeRules: [_scopeRule],
};

const _levelDef: LevelDefinition<PowerGridLevelData> = {
  levelId: 'pg-basic-01',
  gameId: 'power-grid',
  tier: DifficultyTier.Basic,
  order: 1,
  title: 'Test',
  conceptIntroduced: 'Test concept',
  description: 'Test description',
  data: _levelData,
};

void [_service, _component, _connection, _scopeRule, _levelData, _levelDef];

// --- Valid InjectionScope values ---

const VALID_SCOPES: readonly InjectionScope[] = ['root', 'component', 'hierarchical'];

// --- Runtime tests ---

describe('Level count and structure', () => {
  it('should have exactly 18 total levels', () => {
    expect(POWER_GRID_LEVELS.length).toBe(18);
  });

  it('should have 6 Basic levels', () => {
    const basic = POWER_GRID_LEVELS.filter(l => l.tier === DifficultyTier.Basic);
    expect(basic.length).toBe(6);
  });

  it('should have 6 Intermediate levels', () => {
    const intermediate = POWER_GRID_LEVELS.filter(l => l.tier === DifficultyTier.Intermediate);
    expect(intermediate.length).toBe(6);
  });

  it('should have 5 Advanced levels', () => {
    const advanced = POWER_GRID_LEVELS.filter(l => l.tier === DifficultyTier.Advanced);
    expect(advanced.length).toBe(5);
  });

  it('should have 1 Boss level', () => {
    const boss = POWER_GRID_LEVELS.filter(l => l.tier === DifficultyTier.Boss);
    expect(boss.length).toBe(1);
  });

  it('should have all gameId fields set to power-grid', () => {
    for (const level of POWER_GRID_LEVELS) {
      expect(level.gameId).toBe('power-grid');
    }
  });

  it('should have unique levelId for every level', () => {
    const ids = POWER_GRID_LEVELS.map(l => l.levelId);
    expect(new Set(ids).size).toBe(18);
  });

  it('should have sequential order within each tier', () => {
    const basicOrders = POWER_GRID_LEVELS
      .filter(l => l.tier === DifficultyTier.Basic)
      .map(l => l.order);
    expect(basicOrders).toEqual([1, 2, 3, 4, 5, 6]);

    const intermediateOrders = POWER_GRID_LEVELS
      .filter(l => l.tier === DifficultyTier.Intermediate)
      .map(l => l.order);
    expect(intermediateOrders).toEqual([1, 2, 3, 4, 5, 6]);

    const advancedOrders = POWER_GRID_LEVELS
      .filter(l => l.tier === DifficultyTier.Advanced)
      .map(l => l.order);
    expect(advancedOrders).toEqual([1, 2, 3, 4, 5]);

    const bossOrders = POWER_GRID_LEVELS
      .filter(l => l.tier === DifficultyTier.Boss)
      .map(l => l.order);
    expect(bossOrders).toEqual([1]);
  });
});

describe('Required fields', () => {
  it('should have a non-empty title for every level', () => {
    for (const level of POWER_GRID_LEVELS) {
      expect(level.title.length).toBeGreaterThan(0);
    }
  });

  it('should have a non-empty description for every level', () => {
    for (const level of POWER_GRID_LEVELS) {
      expect(level.description.length).toBeGreaterThan(0);
    }
  });

  it('should have a non-empty conceptIntroduced for every level', () => {
    for (const level of POWER_GRID_LEVELS) {
      expect(level.conceptIntroduced.length).toBeGreaterThan(0);
    }
  });

  it('should have at least 1 service in every level', () => {
    for (const level of POWER_GRID_LEVELS) {
      expect(level.data.services.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('should have at least 1 component in every level', () => {
    for (const level of POWER_GRID_LEVELS) {
      expect(level.data.components.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('should have at least 1 valid connection in every level', () => {
    for (const level of POWER_GRID_LEVELS) {
      expect(level.data.validConnections.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('should have at least 1 scope rule in every level', () => {
    for (const level of POWER_GRID_LEVELS) {
      expect(level.data.scopeRules.length).toBeGreaterThanOrEqual(1);
    }
  });
});

describe('Data integrity — Services and components', () => {
  it('should have unique service ids within each level', () => {
    for (const level of POWER_GRID_LEVELS) {
      const ids = level.data.services.map(s => s.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('should have unique component ids within each level', () => {
    for (const level of POWER_GRID_LEVELS) {
      const ids = level.data.components.map(c => c.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('should have no overlapping ids between services and components within each level', () => {
    for (const level of POWER_GRID_LEVELS) {
      const serviceIds = new Set(level.data.services.map(s => s.id));
      for (const comp of level.data.components) {
        expect(serviceIds.has(comp.id)).toBe(false);
      }
    }
  });
});

describe('Data integrity — Valid connections', () => {
  it('should have all validConnection serviceIds reference existing service ids', () => {
    for (const level of POWER_GRID_LEVELS) {
      const serviceIds = new Set(level.data.services.map(s => s.id));
      for (const conn of level.data.validConnections) {
        expect(serviceIds.has(conn.serviceId)).toBe(true);
      }
    }
  });

  it('should have all validConnection componentIds reference existing component ids', () => {
    for (const level of POWER_GRID_LEVELS) {
      const componentIds = new Set(level.data.components.map(c => c.id));
      for (const conn of level.data.validConnections) {
        expect(componentIds.has(conn.componentId)).toBe(true);
      }
    }
  });

  it('should have unique connection pairs (serviceId+componentId) within each level', () => {
    for (const level of POWER_GRID_LEVELS) {
      const pairs = level.data.validConnections.map(c => `${c.serviceId}::${c.componentId}`);
      expect(new Set(pairs).size).toBe(pairs.length);
    }
  });

  it('should have validConnection scope be a valid InjectionScope value', () => {
    for (const level of POWER_GRID_LEVELS) {
      for (const conn of level.data.validConnections) {
        expect(VALID_SCOPES).toContain(conn.scope);
      }
    }
  });
});

describe('Data integrity — Scope rules', () => {
  it('should have all scopeRule serviceIds reference existing service ids', () => {
    for (const level of POWER_GRID_LEVELS) {
      const serviceIds = new Set(level.data.services.map(s => s.id));
      for (const rule of level.data.scopeRules) {
        expect(serviceIds.has(rule.serviceId)).toBe(true);
      }
    }
  });

  it('should have scopeRule allowedScopes contain only valid InjectionScope values', () => {
    for (const level of POWER_GRID_LEVELS) {
      for (const rule of level.data.scopeRules) {
        for (const scope of rule.allowedScopes) {
          expect(VALID_SCOPES).toContain(scope);
        }
      }
    }
  });

  it('should have scopeRule defaultScope be one of the allowedScopes', () => {
    for (const level of POWER_GRID_LEVELS) {
      for (const rule of level.data.scopeRules) {
        expect(rule.allowedScopes).toContain(rule.defaultScope);
      }
    }
  });

  it('should have no scopeRule with empty allowedScopes', () => {
    for (const level of POWER_GRID_LEVELS) {
      for (const rule of level.data.scopeRules) {
        expect(rule.allowedScopes.length).toBeGreaterThan(0);
      }
    }
  });
});

describe('Data integrity — Component required injections', () => {
  it('should have every component requiredInjection match a service id in the same level', () => {
    for (const level of POWER_GRID_LEVELS) {
      const serviceIds = new Set(level.data.services.map(s => s.id));
      for (const comp of level.data.components) {
        for (const injection of comp.requiredInjections) {
          expect(serviceIds.has(injection)).toBe(true);
        }
      }
    }
  });
});

describe('Level ID format', () => {
  it('should have all levelIds match pattern pg-(basic|intermediate|advanced|boss)-NN', () => {
    const pattern = /^pg-(basic|intermediate|advanced|boss)-\d{2}$/;
    for (const level of POWER_GRID_LEVELS) {
      expect(level.levelId).toMatch(pattern);
    }
  });
});

describe('LevelPack', () => {
  it('should have gameId power-grid', () => {
    expect(POWER_GRID_LEVEL_PACK.gameId).toBe('power-grid');
  });

  it('should have levels equal to POWER_GRID_LEVELS', () => {
    expect(POWER_GRID_LEVEL_PACK.levels).toBe(POWER_GRID_LEVELS);
  });
});

describe('Specific level spot checks', () => {
  it('should have Level 1 conceptIntroduced be Single service', () => {
    const level1 = POWER_GRID_LEVELS.find(l => l.levelId === 'pg-basic-01')!;
    expect(level1).toBeDefined();
    expect(level1.conceptIntroduced).toBe('Single service');
  });

  it('should have Level 1 with exactly 1 service and 1 component', () => {
    const level1 = POWER_GRID_LEVELS.find(l => l.levelId === 'pg-basic-01')!;
    expect(level1.data.services.length).toBe(1);
    expect(level1.data.components.length).toBe(1);
  });

  it('should have Boss level title be Grid Overhaul', () => {
    const boss = POWER_GRID_LEVELS.find(l => l.tier === DifficultyTier.Boss)!;
    expect(boss.title).toBe('Grid Overhaul');
  });

  it('should have Boss level with parTime set to 300', () => {
    const boss = POWER_GRID_LEVELS.find(l => l.tier === DifficultyTier.Boss)!;
    expect(boss.parTime).toBe(300);
  });

  it('should have Boss level with 8 services', () => {
    const boss = POWER_GRID_LEVELS.find(l => l.tier === DifficultyTier.Boss)!;
    expect(boss.data.services.length).toBe(8);
  });

  it('should have Boss level with 12 components', () => {
    const boss = POWER_GRID_LEVELS.find(l => l.tier === DifficultyTier.Boss)!;
    expect(boss.data.components.length).toBe(12);
  });

  it('should have Boss level with at least 12 valid connections', () => {
    const boss = POWER_GRID_LEVELS.find(l => l.tier === DifficultyTier.Boss)!;
    expect(boss.data.validConnections.length).toBeGreaterThanOrEqual(12);
  });

  it('should have Intermediate levels use component or hierarchical scopes', () => {
    const intermediate = POWER_GRID_LEVELS.filter(l => l.tier === DifficultyTier.Intermediate);
    const hasNonRootScope = intermediate.some(level =>
      level.data.validConnections.some(c => c.scope === 'component' || c.scope === 'hierarchical'),
    );
    expect(hasNonRootScope).toBe(true);
  });

  it('should have Advanced levels use factory providerType', () => {
    const advanced = POWER_GRID_LEVELS.filter(l => l.tier === DifficultyTier.Advanced);
    const hasFactory = advanced.some(level =>
      level.data.services.some(s => s.providerType === 'factory'),
    );
    expect(hasFactory).toBe(true);
  });

  it('should have Level 10 service with dependsOn referencing another service id', () => {
    const level10 = POWER_GRID_LEVELS.find(l => l.levelId === 'pg-intermediate-04')!;
    expect(level10).toBeDefined();
    const serviceIds = new Set(level10.data.services.map(s => s.id));
    const hasDependsOn = level10.data.services.some(
      s => s.dependsOn && s.dependsOn.length > 0 && s.dependsOn.every(d => serviceIds.has(d)),
    );
    expect(hasDependsOn).toBe(true);
  });

  it('should have Level 11 with at least 1 InjectionToken (kind: token)', () => {
    const level11 = POWER_GRID_LEVELS.find(l => l.levelId === 'pg-intermediate-05')!;
    expect(level11).toBeDefined();
    const hasToken = level11.data.services.some(s => s.kind === 'token');
    expect(hasToken).toBe(true);
  });
});
