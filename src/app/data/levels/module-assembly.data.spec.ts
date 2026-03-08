import { DifficultyTier } from '../../core/minigame/minigame.types';
import type { LevelDefinition } from '../../core/levels/level.types';
import {
  MODULE_ASSEMBLY_LEVELS,
  MODULE_ASSEMBLY_LEVEL_PACK,
  type BlueprintSlotType,
  type ComponentPart,
  type BlueprintSlot,
  type ComponentBlueprint,
  type ModuleAssemblyLevelData,
} from './module-assembly.data';

// --- Compile-time type checks ---

const _slotType: BlueprintSlotType = 'decorator';

const _part: ComponentPart = {
  id: 'p1',
  code: '@Component({})',
  slotType: 'decorator',
  isDecoy: false,
};

const _slot: BlueprintSlot = {
  slotType: 'template',
  label: 'Template',
  required: true,
  acceptsPartIds: ['p1'],
};

const _blueprint: ComponentBlueprint = {
  componentName: 'TestComponent',
  slots: [_slot],
};

const _levelData: ModuleAssemblyLevelData = {
  blueprints: [_blueprint],
  parts: [_part],
  beltSpeed: 40,
  timeLimit: 60,
  maxStrikes: 3,
};

const _levelDef: LevelDefinition<ModuleAssemblyLevelData> = {
  levelId: 'ma-basic-01',
  gameId: 'module-assembly',
  tier: DifficultyTier.Basic,
  order: 1,
  title: 'Test',
  conceptIntroduced: 'Test concept',
  description: 'Test description',
  data: _levelData,
};

void [_slotType, _part, _slot, _blueprint, _levelData, _levelDef];

// --- Runtime tests ---

describe('Level count and structure', () => {
  it('should have exactly 18 total levels', () => {
    expect(MODULE_ASSEMBLY_LEVELS.length).toBe(18);
  });

  it('should have 6 Basic levels', () => {
    const basic = MODULE_ASSEMBLY_LEVELS.filter(l => l.tier === DifficultyTier.Basic);
    expect(basic.length).toBe(6);
  });

  it('should have 6 Intermediate levels', () => {
    const intermediate = MODULE_ASSEMBLY_LEVELS.filter(l => l.tier === DifficultyTier.Intermediate);
    expect(intermediate.length).toBe(6);
  });

  it('should have 5 Advanced levels', () => {
    const advanced = MODULE_ASSEMBLY_LEVELS.filter(l => l.tier === DifficultyTier.Advanced);
    expect(advanced.length).toBe(5);
  });

  it('should have 1 Boss level', () => {
    const boss = MODULE_ASSEMBLY_LEVELS.filter(l => l.tier === DifficultyTier.Boss);
    expect(boss.length).toBe(1);
  });

  it('should have all gameId fields set to module-assembly', () => {
    for (const level of MODULE_ASSEMBLY_LEVELS) {
      expect(level.gameId).toBe('module-assembly');
    }
  });

  it('should have unique levelId for every level', () => {
    const ids = MODULE_ASSEMBLY_LEVELS.map(l => l.levelId);
    expect(new Set(ids).size).toBe(18);
  });

  it('should have sequential order within each tier', () => {
    const basicOrders = MODULE_ASSEMBLY_LEVELS
      .filter(l => l.tier === DifficultyTier.Basic)
      .map(l => l.order);
    expect(basicOrders).toEqual([1, 2, 3, 4, 5, 6]);

    const intermediateOrders = MODULE_ASSEMBLY_LEVELS
      .filter(l => l.tier === DifficultyTier.Intermediate)
      .map(l => l.order);
    expect(intermediateOrders).toEqual([1, 2, 3, 4, 5, 6]);

    const advancedOrders = MODULE_ASSEMBLY_LEVELS
      .filter(l => l.tier === DifficultyTier.Advanced)
      .map(l => l.order);
    expect(advancedOrders).toEqual([1, 2, 3, 4, 5]);

    const bossOrders = MODULE_ASSEMBLY_LEVELS
      .filter(l => l.tier === DifficultyTier.Boss)
      .map(l => l.order);
    expect(bossOrders).toEqual([1]);
  });
});

describe('Required fields', () => {
  it('should have a non-empty title for every level', () => {
    for (const level of MODULE_ASSEMBLY_LEVELS) {
      expect(level.title.length).toBeGreaterThan(0);
    }
  });

  it('should have a non-empty description for every level', () => {
    for (const level of MODULE_ASSEMBLY_LEVELS) {
      expect(level.description.length).toBeGreaterThan(0);
    }
  });

  it('should have a non-empty conceptIntroduced for every level', () => {
    for (const level of MODULE_ASSEMBLY_LEVELS) {
      expect(level.conceptIntroduced.length).toBeGreaterThan(0);
    }
  });

  it('should have at least 1 blueprint in every level', () => {
    for (const level of MODULE_ASSEMBLY_LEVELS) {
      expect(level.data.blueprints.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('should have at least 1 part in every level', () => {
    for (const level of MODULE_ASSEMBLY_LEVELS) {
      expect(level.data.parts.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('should have beltSpeed > 0 for every level', () => {
    for (const level of MODULE_ASSEMBLY_LEVELS) {
      expect(level.data.beltSpeed).toBeGreaterThan(0);
    }
  });

  it('should have timeLimit > 0 for every level', () => {
    for (const level of MODULE_ASSEMBLY_LEVELS) {
      expect(level.data.timeLimit).toBeGreaterThan(0);
    }
  });

  it('should have maxStrikes > 0 for every level', () => {
    for (const level of MODULE_ASSEMBLY_LEVELS) {
      expect(level.data.maxStrikes).toBeGreaterThan(0);
    }
  });
});

describe('Data integrity', () => {
  it('should have every blueprint slot acceptsPartIds entry reference an existing non-decoy part', () => {
    for (const level of MODULE_ASSEMBLY_LEVELS) {
      const nonDecoyIds = new Set(
        level.data.parts.filter(p => !p.isDecoy).map(p => p.id),
      );
      for (const blueprint of level.data.blueprints) {
        for (const slot of blueprint.slots) {
          for (const partId of slot.acceptsPartIds) {
            expect(nonDecoyIds.has(partId)).toBe(true);
          }
        }
      }
    }
  });

  it('should have every non-decoy part referenced by at least one blueprint slot', () => {
    for (const level of MODULE_ASSEMBLY_LEVELS) {
      const referencedIds = new Set<string>();
      for (const blueprint of level.data.blueprints) {
        for (const slot of blueprint.slots) {
          for (const partId of slot.acceptsPartIds) {
            referencedIds.add(partId);
          }
        }
      }
      const nonDecoyParts = level.data.parts.filter(p => !p.isDecoy);
      for (const part of nonDecoyParts) {
        expect(referencedIds.has(part.id)).toBe(true);
      }
    }
  });

  it('should have no duplicate part ids within a single level', () => {
    for (const level of MODULE_ASSEMBLY_LEVELS) {
      const ids = level.data.parts.map(p => p.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('should have exactly 5 blueprints in the Boss level', () => {
    const boss = MODULE_ASSEMBLY_LEVELS.find(l => l.tier === DifficultyTier.Boss)!;
    expect(boss.data.blueprints.length).toBe(5);
  });

  it('should have exactly 2 blueprints in level 6 (multiple components)', () => {
    const level6 = MODULE_ASSEMBLY_LEVELS.find(l => l.levelId === 'ma-basic-06')!;
    expect(level6.data.blueprints.length).toBe(2);
  });

  it('should have 3 blueprints in level 16 (multi-component assembly)', () => {
    const level16 = MODULE_ASSEMBLY_LEVELS.find(l => l.levelId === 'ma-advanced-04')!;
    expect(level16.data.blueprints.length).toBe(3);
  });
});

describe('LevelPack', () => {
  it('should have gameId module-assembly', () => {
    expect(MODULE_ASSEMBLY_LEVEL_PACK.gameId).toBe('module-assembly');
  });

  it('should have levels equal to MODULE_ASSEMBLY_LEVELS', () => {
    expect(MODULE_ASSEMBLY_LEVEL_PACK.levels).toBe(MODULE_ASSEMBLY_LEVELS);
  });
});

describe('Level ID format', () => {
  it('should have all levelIds match pattern ma-(basic|intermediate|advanced|boss)-NN', () => {
    const pattern = /^ma-(basic|intermediate|advanced|boss)-\d{2}$/;
    for (const level of MODULE_ASSEMBLY_LEVELS) {
      expect(level.levelId).toMatch(pattern);
    }
  });
});

describe('Concept spot checks', () => {
  it('should have level 1 conceptIntroduced be Minimal component', () => {
    const level1 = MODULE_ASSEMBLY_LEVELS.find(l => l.levelId === 'ma-basic-01')!;
    expect(level1.conceptIntroduced).toBe('Minimal component');
  });

  it('should have level 18 title be Emergency Module Fabrication', () => {
    const boss = MODULE_ASSEMBLY_LEVELS.find(l => l.tier === DifficultyTier.Boss)!;
    expect(boss.title).toBe('Emergency Module Fabrication');
  });

  it('should have Boss level with a parTime set', () => {
    const boss = MODULE_ASSEMBLY_LEVELS.find(l => l.tier === DifficultyTier.Boss)!;
    expect(boss.parTime).toBeDefined();
    expect(boss.parTime).toBeGreaterThan(0);
  });
});
