import { DifficultyTier } from '../../core/minigame/minigame.types';
import type { LevelDefinition } from '../../core/levels/level.types';
import type {
  ModuleAssemblyLevelData,
  ComponentPart,
  BlueprintSlot,
  ComponentBlueprint,
  DecoyInfo,
  PartSlotType,
} from '../../features/minigames/module-assembly/module-assembly.types';
import {
  MODULE_ASSEMBLY_LEVELS,
  MODULE_ASSEMBLY_LEVEL_PACK,
} from './module-assembly.data';

// --- Compile-time type checks ---

const _slotType: PartSlotType = 'decorator';

const _part: ComponentPart = {
  id: 'p1',
  content: '@Component({})',
  type: 'decorator',
  isDecoy: false,
  correctSlotId: 'slot-0',
};

const _slot: BlueprintSlot = {
  id: 'slot-0',
  slotType: 'template',
  label: 'Template',
  isRequired: true,
  isOptional: false,
};

const _blueprint: ComponentBlueprint = {
  name: 'TestComponent',
  slots: [_slot],
  expectedParts: ['p1'],
};

const _decoy: DecoyInfo = {
  originalPart: {
    id: 'd1',
    content: 'bad code',
    type: 'template',
    isDecoy: true,
    correctSlotId: null,
  },
  mutation: 'Decoy variant of template',
};

const _levelData: ModuleAssemblyLevelData = {
  blueprint: _blueprint,
  parts: [_part],
  decoys: [_decoy],
  beltSpeed: 40,
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

void [_slotType, _part, _slot, _blueprint, _decoy, _levelData, _levelDef];

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

  it('should have a blueprint with at least 1 slot in every level', () => {
    for (const level of MODULE_ASSEMBLY_LEVELS) {
      expect(level.data.blueprint.slots.length).toBeGreaterThanOrEqual(1);
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

  it('should have blueprint.name be a non-empty string', () => {
    for (const level of MODULE_ASSEMBLY_LEVELS) {
      expect(level.data.blueprint.name.length).toBeGreaterThan(0);
    }
  });
});

describe('Data integrity', () => {
  it('should have every non-decoy part correctSlotId reference an existing slot id', () => {
    for (const level of MODULE_ASSEMBLY_LEVELS) {
      const slotIds = new Set(level.data.blueprint.slots.map(s => s.id));
      const nonDecoyParts = level.data.parts.filter(p => !p.isDecoy);
      for (const part of nonDecoyParts) {
        expect(slotIds.has(part.correctSlotId!)).toBe(true);
      }
    }
  });

  it('should have every non-decoy part in blueprint.expectedParts', () => {
    for (const level of MODULE_ASSEMBLY_LEVELS) {
      const expectedSet = new Set(level.data.blueprint.expectedParts);
      const nonDecoyParts = level.data.parts.filter(p => !p.isDecoy);
      for (const part of nonDecoyParts) {
        expect(expectedSet.has(part.id)).toBe(true);
      }
    }
  });

  it('should have no duplicate part ids within a single level', () => {
    for (const level of MODULE_ASSEMBLY_LEVELS) {
      const ids = level.data.parts.map(p => p.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('should have exactly 25 merged slots in the Boss level (ma-boss-01)', () => {
    const boss = MODULE_ASSEMBLY_LEVELS.find(l => l.tier === DifficultyTier.Boss)!;
    expect(boss.data.blueprint.slots.length).toBe(25);
  });

  it('should have exactly 6 merged slots in level 6 (ma-basic-06)', () => {
    const level6 = MODULE_ASSEMBLY_LEVELS.find(l => l.levelId === 'ma-basic-06')!;
    expect(level6.data.blueprint.slots.length).toBe(6);
  });

  it('should have exactly 12 merged slots in level 16 (ma-advanced-04)', () => {
    const level16 = MODULE_ASSEMBLY_LEVELS.find(l => l.levelId === 'ma-advanced-04')!;
    expect(level16.data.blueprint.slots.length).toBe(12);
  });

  it('should have unique slot ids within each level', () => {
    for (const level of MODULE_ASSEMBLY_LEVELS) {
      const ids = level.data.blueprint.slots.map(s => s.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('should have all slots with isOptional === !isRequired', () => {
    for (const level of MODULE_ASSEMBLY_LEVELS) {
      for (const slot of level.data.blueprint.slots) {
        expect(slot.isOptional).toBe(!slot.isRequired);
      }
    }
  });

  it('should have all part types be valid PartSlotType values (no kebab-case)', () => {
    const validTypes: readonly string[] = ['decorator', 'selector', 'template', 'styles', 'classBody', 'imports'];
    for (const level of MODULE_ASSEMBLY_LEVELS) {
      for (const part of level.data.parts) {
        expect(validTypes).toContain(part.type);
      }
    }
  });

  it('should have a decoys array for every level', () => {
    for (const level of MODULE_ASSEMBLY_LEVELS) {
      expect(level.data.decoys).toBeDefined();
      expect(Array.isArray(level.data.decoys)).toBe(true);
    }
  });

  it('should have every decoy in the decoys array also in the parts array with isDecoy: true', () => {
    for (const level of MODULE_ASSEMBLY_LEVELS) {
      for (const decoy of level.data.decoys) {
        const matchingPart = level.data.parts.find(p => p.id === decoy.originalPart.id);
        expect(matchingPart).toBeDefined();
        expect(matchingPart!.isDecoy).toBe(true);
      }
    }
  });

  it('should have expectedParts match non-decoy part ids', () => {
    for (const level of MODULE_ASSEMBLY_LEVELS) {
      const nonDecoyIds = level.data.parts
        .filter(p => !p.isDecoy)
        .map(p => p.id)
        .sort();
      const expected = [...level.data.blueprint.expectedParts].sort();
      expect(expected).toEqual(nonDecoyIds);
    }
  });

  it('should have all non-decoy parts have a non-null correctSlotId', () => {
    for (const level of MODULE_ASSEMBLY_LEVELS) {
      const nonDecoyParts = level.data.parts.filter(p => !p.isDecoy);
      for (const part of nonDecoyParts) {
        expect(part.correctSlotId).not.toBeNull();
      }
    }
  });

  it('should have all decoy parts have correctSlotId === null', () => {
    for (const level of MODULE_ASSEMBLY_LEVELS) {
      const decoyParts = level.data.parts.filter(p => p.isDecoy);
      for (const part of decoyParts) {
        expect(part.correctSlotId).toBeNull();
      }
    }
  });

  it('should not have any non-decoy part mapped to more than one slot', () => {
    for (const level of MODULE_ASSEMBLY_LEVELS) {
      const nonDecoyParts = level.data.parts.filter(p => !p.isDecoy);
      const partSlotMapping = new Map<string, Set<string>>();
      for (const part of nonDecoyParts) {
        if (part.correctSlotId) {
          const slots = partSlotMapping.get(part.id) ?? new Set();
          slots.add(part.correctSlotId);
          partSlotMapping.set(part.id, slots);
        }
      }
      for (const [, slots] of partSlotMapping) {
        expect(slots.size).toBe(1);
      }
    }
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

  it('should have level 1 blueprint.name be EmergencyShelter', () => {
    const level1 = MODULE_ASSEMBLY_LEVELS.find(l => l.levelId === 'ma-basic-01')!;
    expect(level1.data.blueprint.name).toBe('EmergencyShelter');
  });

  it('should have level 1 with 3 slots', () => {
    const level1 = MODULE_ASSEMBLY_LEVELS.find(l => l.levelId === 'ma-basic-01')!;
    expect(level1.data.blueprint.slots.length).toBe(3);
  });

  it('should have level 1 with 3 parts', () => {
    const level1 = MODULE_ASSEMBLY_LEVELS.find(l => l.levelId === 'ma-basic-01')!;
    expect(level1.data.parts.length).toBe(3);
  });

  it('should have level 1 parts use content not code', () => {
    const level1 = MODULE_ASSEMBLY_LEVELS.find(l => l.levelId === 'ma-basic-01')!;
    expect(typeof level1.data.parts[0].content).toBe('string');
    expect(level1.data.parts[0].content.length).toBeGreaterThan(0);
  });
});
