import { DifficultyTier } from '../../core/minigame/minigame.types';
import type { LevelDefinition } from '../../core/levels/level.types';
import type {
  SystemCertificationLevelData,
  SourceCodeBlock,
  SourceCodeLine,
  CertificationThreshold,
  CertificationHint,
  TestUtility,
} from '../../features/minigames/system-certification/system-certification.types';
import {
  SYSTEM_CERTIFICATION_LEVELS,
  SYSTEM_CERTIFICATION_LEVEL_PACK,
} from './system-certification.data';

// --- Compile-time type checks ---

const _line: SourceCodeLine = { lineNumber: 1, content: 'x', isTestable: true, isBranch: false };
const _block: SourceCodeBlock = { lines: [_line], testablePoints: [1], branchPoints: [] };
const _threshold: CertificationThreshold = { minCoverage: 80, timeLimit: 120, maxRedundantTests: 2 };
const _hint: CertificationHint = { order: 1, uncoveredLineNumber: 1, text: 'Test hint' };
const _levelData: SystemCertificationLevelData = {
  sourceCode: _block,
  availableTestUtilities: ['testBed'],
  threshold: _threshold,
  hints: [_hint],
};
const _levelDef: LevelDefinition<SystemCertificationLevelData> = {
  levelId: 'sc-basic-01', gameId: 'system-certification', tier: DifficultyTier.Basic,
  order: 1, title: 'Test', conceptIntroduced: 'Test', description: 'Test', data: _levelData,
};

void [_line, _block, _threshold, _hint, _levelData, _levelDef];

// --- Valid type values ---

const VALID_TEST_UTILITIES: readonly TestUtility[] = [
  'testBed', 'componentFixture', 'debugElement', 'spyObj',
  'fakeAsync', 'httpTestingController', 'routerTesting',
];

// --- Runtime tests ---

describe('Level count and structure', () => {
  it('should have exactly 18 total levels', () => {
    expect(SYSTEM_CERTIFICATION_LEVELS.length).toBe(18);
  });

  it('should have 6 Basic levels', () => {
    const basic = SYSTEM_CERTIFICATION_LEVELS.filter(l => l.tier === DifficultyTier.Basic);
    expect(basic.length).toBe(6);
  });

  it('should have 6 Intermediate levels', () => {
    const intermediate = SYSTEM_CERTIFICATION_LEVELS.filter(l => l.tier === DifficultyTier.Intermediate);
    expect(intermediate.length).toBe(6);
  });

  it('should have 5 Advanced levels', () => {
    const advanced = SYSTEM_CERTIFICATION_LEVELS.filter(l => l.tier === DifficultyTier.Advanced);
    expect(advanced.length).toBe(5);
  });

  it('should have 1 Boss level', () => {
    const boss = SYSTEM_CERTIFICATION_LEVELS.filter(l => l.tier === DifficultyTier.Boss);
    expect(boss.length).toBe(1);
  });

  it('should have all gameId fields set to system-certification', () => {
    for (const level of SYSTEM_CERTIFICATION_LEVELS) {
      expect(level.gameId).toBe('system-certification');
    }
  });

  it('should have unique levelId for every level', () => {
    const ids = SYSTEM_CERTIFICATION_LEVELS.map(l => l.levelId);
    expect(new Set(ids).size).toBe(18);
  });

  it('should have sequential order within each tier', () => {
    const basicOrders = SYSTEM_CERTIFICATION_LEVELS
      .filter(l => l.tier === DifficultyTier.Basic)
      .map(l => l.order);
    expect(basicOrders).toEqual([1, 2, 3, 4, 5, 6]);

    const intermediateOrders = SYSTEM_CERTIFICATION_LEVELS
      .filter(l => l.tier === DifficultyTier.Intermediate)
      .map(l => l.order);
    expect(intermediateOrders).toEqual([1, 2, 3, 4, 5, 6]);

    const advancedOrders = SYSTEM_CERTIFICATION_LEVELS
      .filter(l => l.tier === DifficultyTier.Advanced)
      .map(l => l.order);
    expect(advancedOrders).toEqual([1, 2, 3, 4, 5]);

    const bossOrders = SYSTEM_CERTIFICATION_LEVELS
      .filter(l => l.tier === DifficultyTier.Boss)
      .map(l => l.order);
    expect(bossOrders).toEqual([1]);
  });
});

describe('Required fields', () => {
  it('should have a non-empty title for every level', () => {
    for (const level of SYSTEM_CERTIFICATION_LEVELS) {
      expect(level.title.length).toBeGreaterThan(0);
    }
  });

  it('should have a non-empty description for every level', () => {
    for (const level of SYSTEM_CERTIFICATION_LEVELS) {
      expect(level.description.length).toBeGreaterThan(0);
    }
  });

  it('should have a non-empty conceptIntroduced for every level', () => {
    for (const level of SYSTEM_CERTIFICATION_LEVELS) {
      expect(level.conceptIntroduced.length).toBeGreaterThan(0);
    }
  });

  it('should have non-empty sourceCode.lines for every level', () => {
    for (const level of SYSTEM_CERTIFICATION_LEVELS) {
      expect(level.data.sourceCode.lines.length).toBeGreaterThan(0);
    }
  });

  it('should have non-empty availableTestUtilities for every level', () => {
    for (const level of SYSTEM_CERTIFICATION_LEVELS) {
      expect(level.data.availableTestUtilities.length).toBeGreaterThan(0);
    }
  });

  it('should have threshold.minCoverage between 0 and 100 for every level', () => {
    for (const level of SYSTEM_CERTIFICATION_LEVELS) {
      expect(level.data.threshold.minCoverage).toBeGreaterThanOrEqual(0);
      expect(level.data.threshold.minCoverage).toBeLessThanOrEqual(100);
    }
  });

  it('should have threshold.timeLimit as a positive number for every level', () => {
    for (const level of SYSTEM_CERTIFICATION_LEVELS) {
      expect(level.data.threshold.timeLimit).toBeGreaterThan(0);
    }
  });

  it('should have threshold.maxRedundantTests >= 0 for every level', () => {
    for (const level of SYSTEM_CERTIFICATION_LEVELS) {
      expect(level.data.threshold.maxRedundantTests).toBeGreaterThanOrEqual(0);
    }
  });

  it('should have non-empty hints for every level', () => {
    for (const level of SYSTEM_CERTIFICATION_LEVELS) {
      expect(level.data.hints.length).toBeGreaterThan(0);
    }
  });
});

describe('Data integrity -- Source code', () => {
  it('should have testablePoints length > 0 for every level', () => {
    for (const level of SYSTEM_CERTIFICATION_LEVELS) {
      expect(level.data.sourceCode.testablePoints.length).toBeGreaterThan(0);
    }
  });

  it('should have testablePoints contain only line numbers where isTestable is true', () => {
    for (const level of SYSTEM_CERTIFICATION_LEVELS) {
      const testableLinesFromLines = level.data.sourceCode.lines
        .filter(l => l.isTestable)
        .map(l => l.lineNumber);
      expect([...level.data.sourceCode.testablePoints]).toEqual(testableLinesFromLines);
    }
  });

  it('should have branchPoints contain only line numbers where isBranch is true', () => {
    for (const level of SYSTEM_CERTIFICATION_LEVELS) {
      const branchLinesFromLines = level.data.sourceCode.lines
        .filter(l => l.isBranch)
        .map(l => l.lineNumber);
      expect([...level.data.sourceCode.branchPoints]).toEqual(branchLinesFromLines);
    }
  });

  it('should have branchPoints be a subset of testablePoints', () => {
    for (const level of SYSTEM_CERTIFICATION_LEVELS) {
      const testableSet = new Set(level.data.sourceCode.testablePoints);
      for (const bp of level.data.sourceCode.branchPoints) {
        expect(testableSet.has(bp)).toBe(true);
      }
    }
  });

  it('should have sequential line numbers starting from 1', () => {
    for (const level of SYSTEM_CERTIFICATION_LEVELS) {
      const lineNumbers = level.data.sourceCode.lines.map(l => l.lineNumber);
      const expected = lineNumbers.map((_, i) => i + 1);
      expect(lineNumbers).toEqual(expected);
    }
  });

  it('should have non-empty content for every line', () => {
    for (const level of SYSTEM_CERTIFICATION_LEVELS) {
      for (const line of level.data.sourceCode.lines) {
        expect(line.content.length).toBeGreaterThan(0);
      }
    }
  });
});

describe('Data integrity -- Test utilities', () => {
  it('should have all availableTestUtilities be valid TestUtility values', () => {
    for (const level of SYSTEM_CERTIFICATION_LEVELS) {
      for (const util of level.data.availableTestUtilities) {
        expect(VALID_TEST_UTILITIES).toContain(util);
      }
    }
  });

  it('should have no duplicate utilities within a level', () => {
    for (const level of SYSTEM_CERTIFICATION_LEVELS) {
      const utils = level.data.availableTestUtilities;
      expect(new Set(utils).size).toBe(utils.length);
    }
  });
});

describe('Data integrity -- Hints', () => {
  it('should have sequential hint order values starting from 1 within each level', () => {
    for (const level of SYSTEM_CERTIFICATION_LEVELS) {
      const orders = level.data.hints.map(h => h.order);
      const expected = orders.map((_, i) => i + 1);
      expect(orders).toEqual(expected);
    }
  });

  it('should have hint uncoveredLineNumber reference a line in testablePoints', () => {
    for (const level of SYSTEM_CERTIFICATION_LEVELS) {
      const testableSet = new Set(level.data.sourceCode.testablePoints);
      for (const h of level.data.hints) {
        expect(testableSet.has(h.uncoveredLineNumber)).toBe(true);
      }
    }
  });

  it('should have non-empty text for every hint', () => {
    for (const level of SYSTEM_CERTIFICATION_LEVELS) {
      for (const h of level.data.hints) {
        expect(h.text.length).toBeGreaterThan(0);
      }
    }
  });
});

describe('Level ID format', () => {
  it('should have all levelIds match pattern sc-(basic|intermediate|advanced|boss)-NN', () => {
    const pattern = /^sc-(basic|intermediate|advanced|boss)-\d{2}$/;
    for (const level of SYSTEM_CERTIFICATION_LEVELS) {
      expect(level.levelId).toMatch(pattern);
    }
  });
});

describe('LevelPack', () => {
  it('should have gameId system-certification', () => {
    expect(SYSTEM_CERTIFICATION_LEVEL_PACK.gameId).toBe('system-certification');
  });

  it('should have levels equal to SYSTEM_CERTIFICATION_LEVELS', () => {
    expect(SYSTEM_CERTIFICATION_LEVEL_PACK.levels).toBe(SYSTEM_CERTIFICATION_LEVELS);
  });
});

describe('Specific level spot checks', () => {
  it('should have Level 1 conceptIntroduced be First test', () => {
    const level1 = SYSTEM_CERTIFICATION_LEVELS.find(l => l.levelId === 'sc-basic-01')!;
    expect(level1).toBeDefined();
    expect(level1.conceptIntroduced).toBe('First test');
  });

  it('should have Level 1 availableTestUtilities contain only testBed and componentFixture', () => {
    const level1 = SYSTEM_CERTIFICATION_LEVELS.find(l => l.levelId === 'sc-basic-01')!;
    expect([...level1.data.availableTestUtilities].sort()).toEqual(['componentFixture', 'testBed']);
  });

  it('should have Level 7 (first Intermediate) add debugElement to available utilities', () => {
    const level7 = SYSTEM_CERTIFICATION_LEVELS.find(l => l.levelId === 'sc-intermediate-01')!;
    expect(level7).toBeDefined();
    expect(level7.data.availableTestUtilities).toContain('debugElement');
  });

  it('should have Level 12 with spyObj in available utilities', () => {
    const level12 = SYSTEM_CERTIFICATION_LEVELS.find(l => l.levelId === 'sc-intermediate-06')!;
    expect(level12).toBeDefined();
    expect(level12.data.availableTestUtilities).toContain('spyObj');
  });

  it('should have Level 13 (first Advanced) add fakeAsync to available utilities', () => {
    const level13 = SYSTEM_CERTIFICATION_LEVELS.find(l => l.levelId === 'sc-advanced-01')!;
    expect(level13).toBeDefined();
    expect(level13.data.availableTestUtilities).toContain('fakeAsync');
  });

  it('should have Level 14 with httpTestingController in available utilities', () => {
    const level14 = SYSTEM_CERTIFICATION_LEVELS.find(l => l.levelId === 'sc-advanced-02')!;
    expect(level14).toBeDefined();
    expect(level14.data.availableTestUtilities).toContain('httpTestingController');
  });

  it('should have Boss level with all 7 test utilities', () => {
    const boss = SYSTEM_CERTIFICATION_LEVELS.find(l => l.tier === DifficultyTier.Boss)!;
    expect(boss.data.availableTestUtilities.length).toBe(7);
    for (const util of VALID_TEST_UTILITIES) {
      expect(boss.data.availableTestUtilities).toContain(util);
    }
  });

  it('should have Boss level with parTime set to 240', () => {
    const boss = SYSTEM_CERTIFICATION_LEVELS.find(l => l.tier === DifficultyTier.Boss)!;
    expect(boss.parTime).toBe(240);
  });

  it('should have Boss level threshold minCoverage be 95', () => {
    const boss = SYSTEM_CERTIFICATION_LEVELS.find(l => l.tier === DifficultyTier.Boss)!;
    expect(boss.data.threshold.minCoverage).toBe(95);
  });

  it('should have Boss level threshold maxRedundantTests be 0', () => {
    const boss = SYSTEM_CERTIFICATION_LEVELS.find(l => l.tier === DifficultyTier.Boss)!;
    expect(boss.data.threshold.maxRedundantTests).toBe(0);
  });

  it('should have Basic levels with minCoverage between 60 and 80', () => {
    const basic = SYSTEM_CERTIFICATION_LEVELS.filter(l => l.tier === DifficultyTier.Basic);
    for (const level of basic) {
      expect(level.data.threshold.minCoverage).toBeGreaterThanOrEqual(60);
      expect(level.data.threshold.minCoverage).toBeLessThanOrEqual(80);
    }
  });

  it('should have Advanced levels with minCoverage between 90 and 100', () => {
    const advanced = SYSTEM_CERTIFICATION_LEVELS.filter(l => l.tier === DifficultyTier.Advanced);
    for (const level of advanced) {
      expect(level.data.threshold.minCoverage).toBeGreaterThanOrEqual(90);
      expect(level.data.threshold.minCoverage).toBeLessThanOrEqual(100);
    }
  });
});
