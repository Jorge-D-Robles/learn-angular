import { DifficultyTier } from '../../core/minigame/minigame.types';
import type { LevelDefinition } from '../../core/levels/level.types';
import type {
  TerminalHackLevelData,
  FormElementSpec,
  FormValidationRule,
  FormTestCase,
  FormHint,
  TargetFormSpec,
} from '../../features/minigames/terminal-hack/terminal-hack.types';
import {
  TERMINAL_HACK_LEVELS,
  TERMINAL_HACK_LEVEL_PACK,
} from './terminal-hack.data';

// --- Compile-time type checks ---

const _validation: FormValidationRule = { type: 'required', errorMessage: 'Required' };
const _element: FormElementSpec = { id: 'e', elementType: 'text', label: 'L', name: 'n', validations: [_validation] };
const _formSpec: TargetFormSpec = { formName: 'f', elements: [_element], submitAction: 'Submit', formType: 'reactive' };
const _testCase: FormTestCase = { id: 't', description: 'd', inputValues: { n: 'v' }, expectedValid: true };
const _hint: FormHint = { order: 1, text: 'Hint' };

const _levelData: TerminalHackLevelData = {
  targetFormSpec: _formSpec,
  testCases: [_testCase],
  availableElements: ['ngModel'],
  timeLimit: 60,
  hints: [_hint],
};

const _levelDef: LevelDefinition<TerminalHackLevelData> = {
  levelId: 'th-basic-01',
  gameId: 'terminal-hack',
  tier: DifficultyTier.Basic,
  order: 1,
  title: 'Test',
  conceptIntroduced: 'Test concept',
  description: 'Test description',
  data: _levelData,
};

void [_validation, _element, _formSpec, _testCase, _hint, _levelData, _levelDef];

// --- Runtime tests ---

describe('Level count and structure', () => {
  it('should have exactly 21 total levels', () => {
    expect(TERMINAL_HACK_LEVELS.length).toBe(21);
  });

  it('should have 7 Basic levels', () => {
    const basic = TERMINAL_HACK_LEVELS.filter(l => l.tier === DifficultyTier.Basic);
    expect(basic.length).toBe(7);
  });

  it('should have 7 Intermediate levels', () => {
    const intermediate = TERMINAL_HACK_LEVELS.filter(l => l.tier === DifficultyTier.Intermediate);
    expect(intermediate.length).toBe(7);
  });

  it('should have 6 Advanced levels', () => {
    const advanced = TERMINAL_HACK_LEVELS.filter(l => l.tier === DifficultyTier.Advanced);
    expect(advanced.length).toBe(6);
  });

  it('should have 1 Boss level', () => {
    const boss = TERMINAL_HACK_LEVELS.filter(l => l.tier === DifficultyTier.Boss);
    expect(boss.length).toBe(1);
  });

  it('should have all gameId fields set to terminal-hack', () => {
    for (const level of TERMINAL_HACK_LEVELS) {
      expect(level.gameId).toBe('terminal-hack');
    }
  });

  it('should have unique levelId for every level', () => {
    const ids = TERMINAL_HACK_LEVELS.map(l => l.levelId);
    expect(new Set(ids).size).toBe(21);
  });
});

describe('Required fields', () => {
  it('should have a non-empty title for every level', () => {
    for (const level of TERMINAL_HACK_LEVELS) {
      expect(level.title.length).toBeGreaterThan(0);
    }
  });

  it('should have a non-empty description for every level', () => {
    for (const level of TERMINAL_HACK_LEVELS) {
      expect(level.description.length).toBeGreaterThan(0);
    }
  });

  it('should have a non-empty conceptIntroduced for every level', () => {
    for (const level of TERMINAL_HACK_LEVELS) {
      expect(level.conceptIntroduced.length).toBeGreaterThan(0);
    }
  });

  it('should have at least 1 test case in every level', () => {
    for (const level of TERMINAL_HACK_LEVELS) {
      expect(level.data.testCases.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('should have at least 1 hint in every level', () => {
    for (const level of TERMINAL_HACK_LEVELS) {
      expect(level.data.hints.length).toBeGreaterThanOrEqual(1);
    }
  });
});

describe('Data integrity', () => {
  it('should have sequential order within each tier', () => {
    const basicOrders = TERMINAL_HACK_LEVELS
      .filter(l => l.tier === DifficultyTier.Basic)
      .map(l => l.order);
    expect(basicOrders).toEqual([1, 2, 3, 4, 5, 6, 7]);

    const intermediateOrders = TERMINAL_HACK_LEVELS
      .filter(l => l.tier === DifficultyTier.Intermediate)
      .map(l => l.order);
    expect(intermediateOrders).toEqual([1, 2, 3, 4, 5, 6, 7]);

    const advancedOrders = TERMINAL_HACK_LEVELS
      .filter(l => l.tier === DifficultyTier.Advanced)
      .map(l => l.order);
    expect(advancedOrders).toEqual([1, 2, 3, 4, 5, 6]);

    const bossOrders = TERMINAL_HACK_LEVELS
      .filter(l => l.tier === DifficultyTier.Boss)
      .map(l => l.order);
    expect(bossOrders).toEqual([1]);
  });

  it('should have unique element ids within each level form spec', () => {
    for (const level of TERMINAL_HACK_LEVELS) {
      const ids = level.data.targetFormSpec.elements.map(e => e.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('should have unique test case ids within each level', () => {
    for (const level of TERMINAL_HACK_LEVELS) {
      const ids = level.data.testCases.map(tc => tc.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('should have valid timeLimit for every level', () => {
    for (const level of TERMINAL_HACK_LEVELS) {
      expect(level.data.timeLimit).toBeGreaterThan(0);
    }
  });

  it('should have at least 1 available element for every level', () => {
    for (const level of TERMINAL_HACK_LEVELS) {
      expect(level.data.availableElements.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('should have hints in sequential order', () => {
    for (const level of TERMINAL_HACK_LEVELS) {
      const orders = level.data.hints.map(h => h.order);
      const expected = orders.map((_, i) => i + 1);
      expect(orders).toEqual(expected);
    }
  });

  it('should have test case inputValues keys matching form element names', () => {
    for (const level of TERMINAL_HACK_LEVELS) {
      const elementNames = new Set(level.data.targetFormSpec.elements.map(e => e.name));
      for (const tc of level.data.testCases) {
        for (const key of Object.keys(tc.inputValues)) {
          expect(elementNames.has(key)).toBe(true);
        }
      }
    }
  });
});

describe('Level ID format', () => {
  it('should have all levelIds match pattern th-(basic|intermediate|advanced|boss)-NN', () => {
    const pattern = /^th-(basic|intermediate|advanced|boss)-\d{2}$/;
    for (const level of TERMINAL_HACK_LEVELS) {
      expect(level.levelId).toMatch(pattern);
    }
  });
});

describe('LevelPack', () => {
  it('should have gameId terminal-hack', () => {
    expect(TERMINAL_HACK_LEVEL_PACK.gameId).toBe('terminal-hack');
  });

  it('should have levels equal to TERMINAL_HACK_LEVELS', () => {
    expect(TERMINAL_HACK_LEVEL_PACK.levels).toBe(TERMINAL_HACK_LEVELS);
  });
});

describe('Specific level spot checks', () => {
  it('should have Boss level title be "Engineering Diagnostic Terminal"', () => {
    const boss = TERMINAL_HACK_LEVELS.find(l => l.tier === DifficultyTier.Boss)!;
    expect(boss.title).toBe('Engineering Diagnostic Terminal');
  });

  it('should have Boss level with parTime set to 300', () => {
    const boss = TERMINAL_HACK_LEVELS.find(l => l.tier === DifficultyTier.Boss)!;
    expect(boss.parTime).toBe(300);
  });

  it('should have Boss level with at least 15 test cases', () => {
    const boss = TERMINAL_HACK_LEVELS.find(l => l.tier === DifficultyTier.Boss)!;
    expect(boss.data.testCases.length).toBeGreaterThanOrEqual(15);
  });

  it('should have Level 1 conceptIntroduced be "Text input"', () => {
    const level1 = TERMINAL_HACK_LEVELS.find(l => l.levelId === 'th-basic-01')!;
    expect(level1).toBeDefined();
    expect(level1.conceptIntroduced).toBe('Text input');
  });

  it('should have Basic levels with timeLimit of 120', () => {
    const basicLevels = TERMINAL_HACK_LEVELS.filter(l => l.tier === DifficultyTier.Basic);
    for (const level of basicLevels) {
      expect(level.data.timeLimit).toBe(120);
    }
  });
});
