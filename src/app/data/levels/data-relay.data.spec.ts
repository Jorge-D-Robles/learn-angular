import { DifficultyTier } from '../../core/minigame/minigame.types';
import type { LevelDefinition } from '../../core/levels/level.types';
import type {
  DataRelayLevelData,
  DataStream,
  PipeDefinition,
  TargetOutput,
  TestDataItem,
  PipeCategory,
} from '../../features/minigames/data-relay/data-relay.types';
import {
  DATA_RELAY_LEVELS,
  DATA_RELAY_LEVEL_PACK,
} from './data-relay.data';

// --- Compile-time type checks ---

const _stream: DataStream = { id: 's', name: 'Stream', rawInput: 'raw' };
const _pipe: PipeDefinition = { id: 'p', pipeName: 'uppercase', displayName: 'Upper', category: 'text' };
const _target: TargetOutput = { streamId: 's', expectedOutput: 'RAW', requiredPipes: ['p'] };
const _test: TestDataItem = { id: 't', streamId: 's', input: 'raw', expectedOutput: 'RAW' };

const _levelData: DataRelayLevelData = {
  streams: [_stream],
  availablePipes: [_pipe],
  targetOutputs: [_target],
  testData: [_test],
};

const _levelDef: LevelDefinition<DataRelayLevelData> = {
  levelId: 'dr-basic-01',
  gameId: 'data-relay',
  tier: DifficultyTier.Basic,
  order: 1,
  title: 'Test',
  conceptIntroduced: 'Test concept',
  description: 'Test description',
  data: _levelData,
};

void [_stream, _pipe, _target, _test, _levelData, _levelDef];

// --- Valid PipeCategory values ---

const VALID_CATEGORIES: readonly PipeCategory[] = ['text', 'number', 'date', 'custom'];

// --- Runtime tests ---

describe('Level count and structure', () => {
  it('should have exactly 18 total levels', () => {
    expect(DATA_RELAY_LEVELS.length).toBe(18);
  });

  it('should have 6 Basic levels', () => {
    const basic = DATA_RELAY_LEVELS.filter(l => l.tier === DifficultyTier.Basic);
    expect(basic.length).toBe(6);
  });

  it('should have 6 Intermediate levels', () => {
    const intermediate = DATA_RELAY_LEVELS.filter(l => l.tier === DifficultyTier.Intermediate);
    expect(intermediate.length).toBe(6);
  });

  it('should have 5 Advanced levels', () => {
    const advanced = DATA_RELAY_LEVELS.filter(l => l.tier === DifficultyTier.Advanced);
    expect(advanced.length).toBe(5);
  });

  it('should have 1 Boss level', () => {
    const boss = DATA_RELAY_LEVELS.filter(l => l.tier === DifficultyTier.Boss);
    expect(boss.length).toBe(1);
  });

  it('should have all gameId fields set to data-relay', () => {
    for (const level of DATA_RELAY_LEVELS) {
      expect(level.gameId).toBe('data-relay');
    }
  });

  it('should have unique levelId for every level', () => {
    const ids = DATA_RELAY_LEVELS.map(l => l.levelId);
    expect(new Set(ids).size).toBe(18);
  });

  it('should have sequential order within each tier', () => {
    const basicOrders = DATA_RELAY_LEVELS
      .filter(l => l.tier === DifficultyTier.Basic)
      .map(l => l.order);
    expect(basicOrders).toEqual([1, 2, 3, 4, 5, 6]);

    const intermediateOrders = DATA_RELAY_LEVELS
      .filter(l => l.tier === DifficultyTier.Intermediate)
      .map(l => l.order);
    expect(intermediateOrders).toEqual([1, 2, 3, 4, 5, 6]);

    const advancedOrders = DATA_RELAY_LEVELS
      .filter(l => l.tier === DifficultyTier.Advanced)
      .map(l => l.order);
    expect(advancedOrders).toEqual([1, 2, 3, 4, 5]);

    const bossOrders = DATA_RELAY_LEVELS
      .filter(l => l.tier === DifficultyTier.Boss)
      .map(l => l.order);
    expect(bossOrders).toEqual([1]);
  });
});

describe('Required fields', () => {
  it('should have a non-empty title for every level', () => {
    for (const level of DATA_RELAY_LEVELS) {
      expect(level.title.length).toBeGreaterThan(0);
    }
  });

  it('should have a non-empty description for every level', () => {
    for (const level of DATA_RELAY_LEVELS) {
      expect(level.description.length).toBeGreaterThan(0);
    }
  });

  it('should have a non-empty conceptIntroduced for every level', () => {
    for (const level of DATA_RELAY_LEVELS) {
      expect(level.conceptIntroduced.length).toBeGreaterThan(0);
    }
  });

  it('should have at least 1 stream in every level', () => {
    for (const level of DATA_RELAY_LEVELS) {
      expect(level.data.streams.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('should have at least 1 available pipe in every level', () => {
    for (const level of DATA_RELAY_LEVELS) {
      expect(level.data.availablePipes.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('should have at least 1 target output in every level', () => {
    for (const level of DATA_RELAY_LEVELS) {
      expect(level.data.targetOutputs.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('should have at least 1 test data item in every level', () => {
    for (const level of DATA_RELAY_LEVELS) {
      expect(level.data.testData.length).toBeGreaterThanOrEqual(1);
    }
  });
});

describe('Data integrity -- streams and targets', () => {
  it('should have unique stream ids within each level', () => {
    for (const level of DATA_RELAY_LEVELS) {
      const ids = level.data.streams.map(s => s.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('should have unique pipe ids within each level', () => {
    for (const level of DATA_RELAY_LEVELS) {
      const ids = level.data.availablePipes.map(p => p.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('should have all targetOutput streamIds reference existing stream ids', () => {
    for (const level of DATA_RELAY_LEVELS) {
      const streamIds = new Set(level.data.streams.map(s => s.id));
      for (const t of level.data.targetOutputs) {
        expect(streamIds.has(t.streamId)).toBe(true);
      }
    }
  });

  it('should have all testData streamIds reference existing stream ids', () => {
    for (const level of DATA_RELAY_LEVELS) {
      const streamIds = new Set(level.data.streams.map(s => s.id));
      for (const t of level.data.testData) {
        expect(streamIds.has(t.streamId)).toBe(true);
      }
    }
  });

  it('should have all targetOutput requiredPipes reference existing pipe ids', () => {
    for (const level of DATA_RELAY_LEVELS) {
      const pipeIds = new Set(level.data.availablePipes.map(p => p.id));
      for (const t of level.data.targetOutputs) {
        for (const pipeId of t.requiredPipes) {
          expect(pipeIds.has(pipeId)).toBe(true);
        }
      }
    }
  });
});

describe('Data integrity -- pipe definitions', () => {
  it('should have all pipe categories be valid PipeCategory values', () => {
    for (const level of DATA_RELAY_LEVELS) {
      for (const p of level.data.availablePipes) {
        expect(VALID_CATEGORIES).toContain(p.category);
      }
    }
  });

  it('should have custom pipes marked with isCustom true', () => {
    for (const level of DATA_RELAY_LEVELS) {
      for (const p of level.data.availablePipes) {
        if (p.category === 'custom') {
          expect(p.isCustom).toBe(true);
        }
      }
    }
  });
});

describe('Data integrity -- cross-reference coverage', () => {
  it('should have every targetOutput streamId appear in at least one testData item', () => {
    for (const level of DATA_RELAY_LEVELS) {
      const testedStreamIds = new Set(level.data.testData.map(t => t.streamId));
      for (const t of level.data.targetOutputs) {
        expect(testedStreamIds.has(t.streamId)).toBe(true);
      }
    }
  });

  it('should have every testData streamId appear in targetOutputs', () => {
    for (const level of DATA_RELAY_LEVELS) {
      const targetStreamIds = new Set(level.data.targetOutputs.map(t => t.streamId));
      for (const t of level.data.testData) {
        expect(targetStreamIds.has(t.streamId)).toBe(true);
      }
    }
  });
});

describe('Level ID format', () => {
  it('should have all levelIds match pattern dr-(basic|intermediate|advanced|boss)-NN', () => {
    const pattern = /^dr-(basic|intermediate|advanced|boss)-\d{2}$/;
    for (const level of DATA_RELAY_LEVELS) {
      expect(level.levelId).toMatch(pattern);
    }
  });
});

describe('LevelPack', () => {
  it('should have gameId data-relay', () => {
    expect(DATA_RELAY_LEVEL_PACK.gameId).toBe('data-relay');
  });

  it('should have levels equal to DATA_RELAY_LEVELS', () => {
    expect(DATA_RELAY_LEVEL_PACK.levels).toBe(DATA_RELAY_LEVELS);
  });
});

describe('Specific level spot checks', () => {
  it('should have Level 1 conceptIntroduced be UpperCasePipe', () => {
    const level1 = DATA_RELAY_LEVELS.find(l => l.levelId === 'dr-basic-01')!;
    expect(level1).toBeDefined();
    expect(level1.conceptIntroduced).toBe('UpperCasePipe');
  });

  it('should have Level 1 with exactly 1 stream', () => {
    const level1 = DATA_RELAY_LEVELS.find(l => l.levelId === 'dr-basic-01')!;
    expect(level1.data.streams.length).toBe(1);
  });

  it('should have Level 6 with 3 streams (multi-stream)', () => {
    const level6 = DATA_RELAY_LEVELS.find(l => l.levelId === 'dr-basic-06')!;
    expect(level6).toBeDefined();
    expect(level6.data.streams.length).toBe(3);
  });

  it('should have Boss level title be Full Relay Network', () => {
    const boss = DATA_RELAY_LEVELS.find(l => l.tier === DifficultyTier.Boss)!;
    expect(boss.title).toBe('Full Relay Network');
  });

  it('should have Boss level with parTime set to 240', () => {
    const boss = DATA_RELAY_LEVELS.find(l => l.tier === DifficultyTier.Boss)!;
    expect(boss.parTime).toBe(240);
  });

  it('should have Boss level with 8 streams', () => {
    const boss = DATA_RELAY_LEVELS.find(l => l.tier === DifficultyTier.Boss)!;
    expect(boss.data.streams.length).toBe(8);
  });

  it('should have Advanced levels include custom pipes (isCustom: true)', () => {
    const advanced = DATA_RELAY_LEVELS.filter(l => l.tier === DifficultyTier.Advanced);
    const hasCustom = advanced.some(level =>
      level.data.availablePipes.some(p => p.isCustom === true),
    );
    expect(hasCustom).toBe(true);
  });

  it('should have Intermediate Level 8 with at least 2 pipes for chaining', () => {
    const level8 = DATA_RELAY_LEVELS.find(l => l.levelId === 'dr-intermediate-02')!;
    expect(level8).toBeDefined();
    expect(level8.data.availablePipes.length).toBeGreaterThanOrEqual(2);
  });
});
