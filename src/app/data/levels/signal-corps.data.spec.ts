import { DifficultyTier } from '../../core/minigame/minigame.types';
import type { LevelDefinition } from '../../core/levels/level.types';
import type {
  SignalCorpsLevelData,
  TowerPlacement,
} from '../../features/minigames/signal-corps/signal-corps.types';
import {
  isTowerConfigComplete,
  canNoiseWaveBeBlocked,
} from '../../features/minigames/signal-corps/signal-corps.types';
import {
  SIGNAL_CORPS_LEVELS,
  SIGNAL_CORPS_LEVEL_PACK,
} from './signal-corps.data';

// --- Compile-time type checks ---

const _levelData: SignalCorpsLevelData = {
  gridSize: { rows: 6, cols: 6 },
  towerPlacements: [],
  noiseWaves: [],
  expectedBindings: [],
  stationHealth: 50,
};

const _levelDef: LevelDefinition<SignalCorpsLevelData> = {
  levelId: 'sc-basic-01',
  gameId: 'signal-corps',
  tier: DifficultyTier.Basic,
  order: 1,
  title: 'Test',
  conceptIntroduced: 'Test concept',
  description: 'Test description',
  data: _levelData,
};

void [_levelData, _levelDef];

// --- Runtime tests ---

describe('Level count and structure', () => {
  it('should have exactly 18 total levels', () => {
    expect(SIGNAL_CORPS_LEVELS.length).toBe(18);
  });

  it('should have 6 Basic levels', () => {
    const basic = SIGNAL_CORPS_LEVELS.filter(l => l.tier === DifficultyTier.Basic);
    expect(basic.length).toBe(6);
  });

  it('should have 6 Intermediate levels', () => {
    const intermediate = SIGNAL_CORPS_LEVELS.filter(l => l.tier === DifficultyTier.Intermediate);
    expect(intermediate.length).toBe(6);
  });

  it('should have 5 Advanced levels', () => {
    const advanced = SIGNAL_CORPS_LEVELS.filter(l => l.tier === DifficultyTier.Advanced);
    expect(advanced.length).toBe(5);
  });

  it('should have 1 Boss level', () => {
    const boss = SIGNAL_CORPS_LEVELS.filter(l => l.tier === DifficultyTier.Boss);
    expect(boss.length).toBe(1);
  });

  it('should have all gameId fields set to signal-corps', () => {
    for (const level of SIGNAL_CORPS_LEVELS) {
      expect(level.gameId).toBe('signal-corps');
    }
  });

  it('should have unique levelId for every level', () => {
    const ids = SIGNAL_CORPS_LEVELS.map(l => l.levelId);
    expect(new Set(ids).size).toBe(18);
  });

  it('should have sequential order within each tier', () => {
    const basicOrders = SIGNAL_CORPS_LEVELS
      .filter(l => l.tier === DifficultyTier.Basic)
      .map(l => l.order);
    expect(basicOrders).toEqual([1, 2, 3, 4, 5, 6]);

    const intermediateOrders = SIGNAL_CORPS_LEVELS
      .filter(l => l.tier === DifficultyTier.Intermediate)
      .map(l => l.order);
    expect(intermediateOrders).toEqual([1, 2, 3, 4, 5, 6]);

    const advancedOrders = SIGNAL_CORPS_LEVELS
      .filter(l => l.tier === DifficultyTier.Advanced)
      .map(l => l.order);
    expect(advancedOrders).toEqual([1, 2, 3, 4, 5]);

    const bossOrders = SIGNAL_CORPS_LEVELS
      .filter(l => l.tier === DifficultyTier.Boss)
      .map(l => l.order);
    expect(bossOrders).toEqual([1]);
  });
});

describe('Required fields', () => {
  it('should have a non-empty title for every level', () => {
    for (const level of SIGNAL_CORPS_LEVELS) {
      expect(level.title.length).toBeGreaterThan(0);
    }
  });

  it('should have a non-empty description for every level', () => {
    for (const level of SIGNAL_CORPS_LEVELS) {
      expect(level.description.length).toBeGreaterThan(0);
    }
  });

  it('should have a non-empty conceptIntroduced for every level', () => {
    for (const level of SIGNAL_CORPS_LEVELS) {
      expect(level.conceptIntroduced.length).toBeGreaterThan(0);
    }
  });

  it('should have at least 1 tower placement in every level', () => {
    for (const level of SIGNAL_CORPS_LEVELS) {
      expect(level.data.towerPlacements.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('should have at least 1 noise wave in every level', () => {
    for (const level of SIGNAL_CORPS_LEVELS) {
      expect(level.data.noiseWaves.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('should have at least 1 expected binding in every level', () => {
    for (const level of SIGNAL_CORPS_LEVELS) {
      expect(level.data.expectedBindings.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('should have stationHealth > 0 for every level', () => {
    for (const level of SIGNAL_CORPS_LEVELS) {
      expect(level.data.stationHealth).toBeGreaterThan(0);
    }
  });
});

describe('Data integrity', () => {
  it('should have unique tower IDs within each level', () => {
    for (const level of SIGNAL_CORPS_LEVELS) {
      const ids = level.data.towerPlacements.map(t => t.towerId);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('should have unique wave IDs within each level', () => {
    for (const level of SIGNAL_CORPS_LEVELS) {
      const ids = level.data.noiseWaves.map(w => w.waveId);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('should have all tower positions within grid bounds', () => {
    for (const level of SIGNAL_CORPS_LEVELS) {
      const { rows, cols } = level.data.gridSize;
      for (const t of level.data.towerPlacements) {
        expect(t.position.row).toBeLessThan(rows);
        expect(t.position.col).toBeLessThan(cols);
        expect(t.position.row).toBeGreaterThanOrEqual(0);
        expect(t.position.col).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('should have every expectedBindings towerPortName match an input or output name in some tower', () => {
    for (const level of SIGNAL_CORPS_LEVELS) {
      const allPortNames = new Set<string>();
      for (const t of level.data.towerPlacements) {
        for (const i of t.config.inputs) allPortNames.add(i.name);
        for (const o of t.config.outputs) allPortNames.add(o.name);
      }
      for (const b of level.data.expectedBindings) {
        expect(allPortNames.has(b.towerPortName)).toBe(true);
      }
    }
  });

  it('should have every tower config complete (at least one input or output, all valid)', () => {
    for (const level of SIGNAL_CORPS_LEVELS) {
      for (const t of level.data.towerPlacements) {
        expect(isTowerConfigComplete(t.config)).toBe(true);
      }
    }
  });

  it('should have all tower inputs with non-empty name and type', () => {
    for (const level of SIGNAL_CORPS_LEVELS) {
      for (const t of level.data.towerPlacements) {
        for (const i of t.config.inputs) {
          expect(i.name.length).toBeGreaterThan(0);
          expect(i.type.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it('should have all tower outputs with non-empty name and payloadType', () => {
    for (const level of SIGNAL_CORPS_LEVELS) {
      for (const t of level.data.towerPlacements) {
        for (const o of t.config.outputs) {
          expect(o.name.length).toBeGreaterThan(0);
          expect(o.payloadType.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it('should have every noise wave blockable by at least one tower in the level', () => {
    for (const level of SIGNAL_CORPS_LEVELS) {
      for (const w of level.data.noiseWaves) {
        const canBlock = level.data.towerPlacements.some(
          (t: TowerPlacement) => canNoiseWaveBeBlocked(w, t),
        );
        expect(canBlock).toBe(true);
      }
    }
  });

  it('should have unique port names across all towers within each level', () => {
    for (const level of SIGNAL_CORPS_LEVELS) {
      const allPortNames: string[] = [];
      for (const t of level.data.towerPlacements) {
        for (const i of t.config.inputs) allPortNames.push(i.name);
        for (const o of t.config.outputs) allPortNames.push(o.name);
      }
      expect(new Set(allPortNames).size).toBe(allPortNames.length);
    }
  });
});

describe('Level ID format', () => {
  it('should have all levelIds match pattern sc-(basic|intermediate|advanced|boss)-NN', () => {
    const pattern = /^sc-(basic|intermediate|advanced|boss)-\d{2}$/;
    for (const level of SIGNAL_CORPS_LEVELS) {
      expect(level.levelId).toMatch(pattern);
    }
  });
});

describe('Specific level spot checks', () => {
  it('should have Level 1 with 1 tower and conceptIntroduced = Single input', () => {
    const level1 = SIGNAL_CORPS_LEVELS.find(l => l.levelId === 'sc-basic-01')!;
    expect(level1).toBeDefined();
    expect(level1.data.towerPlacements.length).toBe(1);
    expect(level1.conceptIntroduced).toBe('Single input');
  });

  it('should have Level 6 with 3 towers', () => {
    const level6 = SIGNAL_CORPS_LEVELS.find(l => l.levelId === 'sc-basic-06')!;
    expect(level6).toBeDefined();
    expect(level6.data.towerPlacements.length).toBe(3);
  });

  it('should have Level 10 with conceptIntroduced = Model inputs', () => {
    const level10 = SIGNAL_CORPS_LEVELS.find(l => l.levelId === 'sc-intermediate-04')!;
    expect(level10).toBeDefined();
    expect(level10.conceptIntroduced).toBe('Model inputs');
  });

  it('should have Level 12 with 5 towers', () => {
    const level12 = SIGNAL_CORPS_LEVELS.find(l => l.levelId === 'sc-intermediate-06')!;
    expect(level12).toBeDefined();
    expect(level12.data.towerPlacements.length).toBe(5);
  });

  it('should have Boss level with 8 towers, parTime defined, and title Full Array Defense', () => {
    const boss = SIGNAL_CORPS_LEVELS.find(l => l.levelId === 'sc-boss-01')!;
    expect(boss).toBeDefined();
    expect(boss.data.towerPlacements.length).toBe(8);
    expect(boss.parTime).toBeDefined();
    expect(boss.parTime!).toBeGreaterThan(0);
    expect(boss.title).toBe('Full Array Defense');
  });

  it('should have Boss level with at least 6 input bindings and 4 output bindings', () => {
    const boss = SIGNAL_CORPS_LEVELS.find(l => l.levelId === 'sc-boss-01')!;
    const inputBindings = boss.data.expectedBindings.filter(b => b.bindingType === 'input');
    const outputBindings = boss.data.expectedBindings.filter(b => b.bindingType === 'output');
    expect(inputBindings.length).toBeGreaterThanOrEqual(6);
    expect(outputBindings.length).toBeGreaterThanOrEqual(4);
  });

  it('should have Boss level with stationHealth >= 200', () => {
    const boss = SIGNAL_CORPS_LEVELS.find(l => l.levelId === 'sc-boss-01')!;
    expect(boss.data.stationHealth).toBeGreaterThanOrEqual(200);
  });
});

describe('LevelPack', () => {
  it('should have gameId signal-corps', () => {
    expect(SIGNAL_CORPS_LEVEL_PACK.gameId).toBe('signal-corps');
  });

  it('should have levels equal to SIGNAL_CORPS_LEVELS', () => {
    expect(SIGNAL_CORPS_LEVEL_PACK.levels).toBe(SIGNAL_CORPS_LEVELS);
  });
});
