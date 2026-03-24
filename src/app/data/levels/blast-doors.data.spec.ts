import { DifficultyTier } from '../../core/minigame/minigame.types';
import type { LevelDefinition } from '../../core/levels/level.types';
import type {
  BlastDoorsLevelData,
  BlastDoor,
  HookSlot,
  BehaviorBlock,
  DirectiveSpec,
  DoorScenario,
  ExpectedBehavior,
  LifecycleHook,
  DoorState,
  DirectiveType,
} from '../../features/minigames/blast-doors/blast-doors.types';
import {
  BLAST_DOORS_LEVELS,
  BLAST_DOORS_LEVEL_PACK,
} from './blast-doors.data';

// --- Compile-time type checks ---

const _behavior: BehaviorBlock = {
  id: 'b', description: 'test', code: 'this.x = 1;', hookTarget: 'ngOnInit',
};
const _hookSlot: HookSlot = {
  hookType: 'ngOnInit', behaviorBlock: _behavior, executionOrder: 1,
};
const _door: BlastDoor = {
  id: 'd', position: 'main-corridor', currentState: 'closed', hookSlots: [_hookSlot],
};
const _directive: DirectiveSpec = {
  name: 'highlight', type: 'attribute', inputs: [], hostListeners: [],
  hostBindings: [], behavior: 'Adds highlight',
};
const _scenario: DoorScenario = {
  id: 's', trigger: 'power-up',
  steps: [{ event: 'init', expectedDoorStates: [{ doorId: 'd', expectedState: 'closed' }] }],
};
const _expected: ExpectedBehavior = {
  scenarioId: 's', hooksFired: ['ngOnInit'],
  finalDoorStates: [{ doorId: 'd', expectedState: 'closed' }],
};
const _levelData: BlastDoorsLevelData = {
  doors: [_door], hooks: ['ngOnInit'], directives: [_directive],
  scenarios: [_scenario], expectedBehavior: [_expected],
};
const _levelDef: LevelDefinition<BlastDoorsLevelData> = {
  levelId: 'bd-basic-01', gameId: 'blast-doors', tier: DifficultyTier.Basic,
  order: 1, title: 'Test', conceptIntroduced: 'Test', description: 'Test', data: _levelData,
};

void [_behavior, _hookSlot, _door, _directive, _scenario, _expected, _levelData, _levelDef];

// --- Valid type value constants ---

const VALID_LIFECYCLE_HOOKS: readonly LifecycleHook[] = [
  'ngOnInit', 'ngOnChanges', 'ngOnDestroy', 'afterNextRender', 'afterRender',
];
const VALID_DOOR_STATES: readonly DoorState[] = ['open', 'closed', 'locked'];
const VALID_DIRECTIVE_TYPES: readonly DirectiveType[] = ['attribute', 'structural'];

// --- Runtime tests ---

describe('Level count and structure', () => {
  it('should have exactly 18 total levels', () => {
    expect(BLAST_DOORS_LEVELS.length).toBe(18);
  });

  it('should have 6 Basic levels', () => {
    const basic = BLAST_DOORS_LEVELS.filter(l => l.tier === DifficultyTier.Basic);
    expect(basic.length).toBe(6);
  });

  it('should have 6 Intermediate levels', () => {
    const intermediate = BLAST_DOORS_LEVELS.filter(l => l.tier === DifficultyTier.Intermediate);
    expect(intermediate.length).toBe(6);
  });

  it('should have 5 Advanced levels', () => {
    const advanced = BLAST_DOORS_LEVELS.filter(l => l.tier === DifficultyTier.Advanced);
    expect(advanced.length).toBe(5);
  });

  it('should have 1 Boss level', () => {
    const boss = BLAST_DOORS_LEVELS.filter(l => l.tier === DifficultyTier.Boss);
    expect(boss.length).toBe(1);
  });

  it('should have all gameId fields set to blast-doors', () => {
    for (const level of BLAST_DOORS_LEVELS) {
      expect(level.gameId).toBe('blast-doors');
    }
  });

  it('should have unique levelId for every level', () => {
    const ids = BLAST_DOORS_LEVELS.map(l => l.levelId);
    expect(new Set(ids).size).toBe(18);
  });
});

describe('Level ordering', () => {
  it('should have sequential order within each tier', () => {
    const basicOrders = BLAST_DOORS_LEVELS
      .filter(l => l.tier === DifficultyTier.Basic)
      .map(l => l.order);
    expect(basicOrders).toEqual([1, 2, 3, 4, 5, 6]);

    const intermediateOrders = BLAST_DOORS_LEVELS
      .filter(l => l.tier === DifficultyTier.Intermediate)
      .map(l => l.order);
    expect(intermediateOrders).toEqual([1, 2, 3, 4, 5, 6]);

    const advancedOrders = BLAST_DOORS_LEVELS
      .filter(l => l.tier === DifficultyTier.Advanced)
      .map(l => l.order);
    expect(advancedOrders).toEqual([1, 2, 3, 4, 5]);

    const bossOrders = BLAST_DOORS_LEVELS
      .filter(l => l.tier === DifficultyTier.Boss)
      .map(l => l.order);
    expect(bossOrders).toEqual([1]);
  });
});

describe('Required fields', () => {
  it('should have a non-empty title for every level', () => {
    for (const level of BLAST_DOORS_LEVELS) {
      expect(level.title.length).toBeGreaterThan(0);
    }
  });

  it('should have a non-empty description for every level', () => {
    for (const level of BLAST_DOORS_LEVELS) {
      expect(level.description.length).toBeGreaterThan(0);
    }
  });

  it('should have a non-empty conceptIntroduced for every level', () => {
    for (const level of BLAST_DOORS_LEVELS) {
      expect(level.conceptIntroduced.length).toBeGreaterThan(0);
    }
  });

  it('should have at least 1 door in every level', () => {
    for (const level of BLAST_DOORS_LEVELS) {
      expect(level.data.doors.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('should have at least 1 lifecycle hook in every level', () => {
    for (const level of BLAST_DOORS_LEVELS) {
      expect(level.data.hooks.length).toBeGreaterThanOrEqual(1);
    }
  });
});

describe('Data integrity -- Doors', () => {
  it('should have unique door IDs within each level', () => {
    for (const level of BLAST_DOORS_LEVELS) {
      const ids = level.data.doors.map(d => d.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('should have non-empty position for every door', () => {
    for (const level of BLAST_DOORS_LEVELS) {
      for (const d of level.data.doors) {
        expect(d.position.length).toBeGreaterThan(0);
      }
    }
  });

  it('should have valid currentState for every door', () => {
    for (const level of BLAST_DOORS_LEVELS) {
      for (const d of level.data.doors) {
        expect(VALID_DOOR_STATES).toContain(d.currentState);
      }
    }
  });

  it('should have at least 1 hookSlot for every door', () => {
    for (const level of BLAST_DOORS_LEVELS) {
      for (const d of level.data.doors) {
        expect(d.hookSlots.length).toBeGreaterThanOrEqual(1);
      }
    }
  });
});

describe('Data integrity -- Hook slots', () => {
  it('should have valid hookType for every hookSlot', () => {
    for (const level of BLAST_DOORS_LEVELS) {
      for (const d of level.data.doors) {
        for (const hs of d.hookSlots) {
          expect(VALID_LIFECYCLE_HOOKS).toContain(hs.hookType);
        }
      }
    }
  });

  it('should have sequential executionOrder starting from 1 within each door', () => {
    for (const level of BLAST_DOORS_LEVELS) {
      for (const d of level.data.doors) {
        const orders = d.hookSlots.map(hs => hs.executionOrder);
        const expected = orders.map((_, i) => i + 1);
        expect(orders).toEqual(expected);
      }
    }
  });

  it('should have hookSlot hookType be a member of the level hooks array', () => {
    for (const level of BLAST_DOORS_LEVELS) {
      for (const d of level.data.doors) {
        for (const hs of d.hookSlots) {
          expect(level.data.hooks).toContain(hs.hookType);
        }
      }
    }
  });
});

describe('Data integrity -- Directives', () => {
  it('should have non-empty name for every directive', () => {
    for (const level of BLAST_DOORS_LEVELS) {
      for (const dir of level.data.directives) {
        expect(dir.name.length).toBeGreaterThan(0);
      }
    }
  });

  it('should have valid directive type for every directive', () => {
    for (const level of BLAST_DOORS_LEVELS) {
      for (const dir of level.data.directives) {
        expect(VALID_DIRECTIVE_TYPES).toContain(dir.type);
      }
    }
  });

  it('should have non-empty behavior description for every directive', () => {
    for (const level of BLAST_DOORS_LEVELS) {
      for (const dir of level.data.directives) {
        expect(dir.behavior.length).toBeGreaterThan(0);
      }
    }
  });

  it('should have Basic levels with 0 directives', () => {
    const basicLevels = BLAST_DOORS_LEVELS.filter(l => l.tier === DifficultyTier.Basic);
    for (const level of basicLevels) {
      expect(level.data.directives.length).toBe(0);
    }
  });
});

describe('Data integrity -- Scenarios', () => {
  it('should have at least 1 scenario in every level', () => {
    for (const level of BLAST_DOORS_LEVELS) {
      expect(level.data.scenarios.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('should have unique scenario IDs within each level', () => {
    for (const level of BLAST_DOORS_LEVELS) {
      const ids = level.data.scenarios.map(s => s.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('should have non-empty trigger for every scenario', () => {
    for (const level of BLAST_DOORS_LEVELS) {
      for (const sc of level.data.scenarios) {
        expect(sc.trigger.length).toBeGreaterThan(0);
      }
    }
  });

  it('should have at least 1 step with non-empty event for every scenario', () => {
    for (const level of BLAST_DOORS_LEVELS) {
      for (const sc of level.data.scenarios) {
        expect(sc.steps.length).toBeGreaterThanOrEqual(1);
        for (const st of sc.steps) {
          expect(st.event.length).toBeGreaterThan(0);
        }
      }
    }
  });
});

describe('Data integrity -- Expected behavior', () => {
  it('should have expectedBehavior count match scenarios count for every level', () => {
    for (const level of BLAST_DOORS_LEVELS) {
      expect(level.data.expectedBehavior.length).toBe(level.data.scenarios.length);
    }
  });

  it('should have expectedBehavior scenarioId reference a scenario ID in the same level', () => {
    for (const level of BLAST_DOORS_LEVELS) {
      const scenarioIds = new Set(level.data.scenarios.map(s => s.id));
      for (const eb of level.data.expectedBehavior) {
        expect(scenarioIds.has(eb.scenarioId)).toBe(true);
      }
    }
  });

  it('should have non-empty hooksFired for every expectedBehavior', () => {
    for (const level of BLAST_DOORS_LEVELS) {
      for (const eb of level.data.expectedBehavior) {
        expect(eb.hooksFired.length).toBeGreaterThan(0);
      }
    }
  });

  it('should have hooksFired contain only valid LifecycleHook values', () => {
    for (const level of BLAST_DOORS_LEVELS) {
      for (const eb of level.data.expectedBehavior) {
        for (const hook of eb.hooksFired) {
          expect(VALID_LIFECYCLE_HOOKS).toContain(hook);
        }
      }
    }
  });
});

describe('Data integrity -- Cross-references', () => {
  it('should have expectedBehavior finalDoorStates reference door IDs from the same level', () => {
    for (const level of BLAST_DOORS_LEVELS) {
      const doorIds = new Set(level.data.doors.map(d => d.id));
      for (const eb of level.data.expectedBehavior) {
        for (const ds of eb.finalDoorStates) {
          expect(doorIds.has(ds.doorId)).toBe(true);
        }
      }
    }
  });

  it('should have scenario step expectedDoorStates reference door IDs from the same level', () => {
    for (const level of BLAST_DOORS_LEVELS) {
      const doorIds = new Set(level.data.doors.map(d => d.id));
      for (const sc of level.data.scenarios) {
        for (const st of sc.steps) {
          for (const ds of st.expectedDoorStates) {
            expect(doorIds.has(ds.doorId)).toBe(true);
          }
        }
      }
    }
  });
});

describe('Level ID format', () => {
  it('should have all levelIds match pattern bd-(basic|intermediate|advanced|boss)-NN', () => {
    const pattern = /^bd-(basic|intermediate|advanced|boss)-\d{2}$/;
    for (const level of BLAST_DOORS_LEVELS) {
      expect(level.levelId).toMatch(pattern);
    }
  });
});

describe('LevelPack', () => {
  it('should have gameId blast-doors', () => {
    expect(BLAST_DOORS_LEVEL_PACK.gameId).toBe('blast-doors');
  });

  it('should have levels equal to BLAST_DOORS_LEVELS', () => {
    expect(BLAST_DOORS_LEVEL_PACK.levels).toBe(BLAST_DOORS_LEVELS);
  });
});

describe('Specific level spot checks', () => {
  it('should have Level 1 conceptIntroduced be ngOnInit', () => {
    const level1 = BLAST_DOORS_LEVELS.find(l => l.levelId === 'bd-basic-01')!;
    expect(level1).toBeDefined();
    expect(level1.conceptIntroduced).toBe('ngOnInit');
  });

  it('should have Level 1 with exactly 1 door and 0 directives', () => {
    const level1 = BLAST_DOORS_LEVELS.find(l => l.levelId === 'bd-basic-01')!;
    expect(level1.data.doors.length).toBe(1);
    expect(level1.data.directives.length).toBe(0);
  });

  it('should have Level 4 hooks include ngOnChanges, ngOnInit, and ngOnDestroy', () => {
    const level4 = BLAST_DOORS_LEVELS.find(l => l.levelId === 'bd-basic-04')!;
    expect(level4).toBeDefined();
    expect(level4.data.hooks).toContain('ngOnChanges');
    expect(level4.data.hooks).toContain('ngOnInit');
    expect(level4.data.hooks).toContain('ngOnDestroy');
  });

  it('should have Level 7 (first Intermediate) with at least 1 directive', () => {
    const level7 = BLAST_DOORS_LEVELS.find(l => l.levelId === 'bd-intermediate-01')!;
    expect(level7).toBeDefined();
    expect(level7.data.directives.length).toBeGreaterThanOrEqual(1);
  });

  it('should have Level 7 directive be attribute type', () => {
    const level7 = BLAST_DOORS_LEVELS.find(l => l.levelId === 'bd-intermediate-01')!;
    expect(level7.data.directives[0].type).toBe('attribute');
  });

  it('should have Level 12 (mixed challenge) with both hooks and directives', () => {
    const level12 = BLAST_DOORS_LEVELS.find(l => l.levelId === 'bd-intermediate-06')!;
    expect(level12).toBeDefined();
    expect(level12.data.hooks.length).toBeGreaterThanOrEqual(2);
    expect(level12.data.directives.length).toBeGreaterThanOrEqual(1);
  });

  it('should have Level 16 with afterRender in hooks', () => {
    const level16 = BLAST_DOORS_LEVELS.find(l => l.levelId === 'bd-advanced-04')!;
    expect(level16).toBeDefined();
    expect(level16.data.hooks).toContain('afterRender');
  });

  it('should have Boss level title be Emergency Lockdown Protocol', () => {
    const boss = BLAST_DOORS_LEVELS.find(l => l.tier === DifficultyTier.Boss)!;
    expect(boss.title).toBe('Emergency Lockdown Protocol');
  });

  it('should have Boss level with 6 doors, 4 directives, and 5 scenarios', () => {
    const boss = BLAST_DOORS_LEVELS.find(l => l.tier === DifficultyTier.Boss)!;
    expect(boss.data.doors.length).toBe(6);
    expect(boss.data.directives.length).toBe(4);
    expect(boss.data.scenarios.length).toBe(5);
  });

  it('should have Boss level with parTime set to 360', () => {
    const boss = BLAST_DOORS_LEVELS.find(l => l.tier === DifficultyTier.Boss)!;
    expect(boss.parTime).toBe(360);
  });
});
