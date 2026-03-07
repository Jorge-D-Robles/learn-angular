import { DifficultyTier } from '../minigame/minigame.types';
import type { MinigameId } from '../minigame/minigame.types';
import {
  LevelDefinition,
  LevelPack,
  LevelTierConfig,
  TIER_XP_REWARDS,
  PERFECT_SCORE_MULTIPLIER,
  LEVEL_TIER_CONFIGS,
} from './level.types';

// --- Compile-time type checks ---

/** LevelDefinition with default unknown data compiles. */
const _defaultLevel: LevelDefinition = {
  levelId: 'ma-basic-01',
  gameId: 'module-assembly' as MinigameId,
  tier: DifficultyTier.Basic,
  order: 1,
  title: 'Minimal Component',
  conceptIntroduced: 'Component basics',
  description: 'Create your first component',
  data: { anything: true },
};

/** LevelDefinition with typed data compiles. */
const _typedLevel: LevelDefinition<{ beltSpeed: number }> = {
  levelId: 'ma-basic-02',
  gameId: 'module-assembly' as MinigameId,
  tier: DifficultyTier.Basic,
  order: 2,
  title: 'Speed Up',
  conceptIntroduced: 'Input bindings',
  description: 'Increase belt speed',
  data: { beltSpeed: 2 },
};

/** LevelDefinition without parTime compiles (optional field). */
const _noParTime: LevelDefinition = {
  levelId: 'ma-basic-03',
  gameId: 'module-assembly' as MinigameId,
  tier: DifficultyTier.Basic,
  order: 3,
  title: 'No Par',
  conceptIntroduced: 'Templates',
  description: 'No speed run',
  data: {},
};

/** LevelDefinition with parTime compiles (optional field accepted). */
const _withParTime: LevelDefinition = {
  levelId: 'ma-basic-04',
  gameId: 'module-assembly' as MinigameId,
  tier: DifficultyTier.Basic,
  order: 4,
  title: 'Timed',
  conceptIntroduced: 'Lifecycle hooks',
  description: 'Beat the clock',
  parTime: 30,
  data: {},
};

/** LevelPack with heterogeneous level data types compiles. */
const _pack: LevelPack = {
  gameId: 'module-assembly' as MinigameId,
  levels: [_defaultLevel, _typedLevel],
};

/** LevelTierConfig compiles. */
const _tierConfig: LevelTierConfig = {
  tier: DifficultyTier.Basic,
  xpReward: 15,
  unlockRequirement: 'Available from start',
};

// Suppress unused variable warnings for compile-time checks
void [_defaultLevel, _typedLevel, _noParTime, _withParTime, _pack, _tierConfig];

// --- Runtime test suites ---

describe('LevelDefinition', () => {
  it('should accept a valid level definition with all fields', () => {
    const level: LevelDefinition = {
      levelId: 'ma-basic-01',
      gameId: 'module-assembly',
      tier: DifficultyTier.Basic,
      order: 1,
      title: 'Minimal Component',
      conceptIntroduced: 'Component basics',
      description: 'Create your first component',
      parTime: 45,
      data: { beltSpeed: 1 },
    };

    expect(level.levelId).toBe('ma-basic-01');
    expect(level.gameId).toBe('module-assembly');
    expect(level.tier).toBe(DifficultyTier.Basic);
    expect(level.order).toBe(1);
    expect(level.title).toBe('Minimal Component');
    expect(level.conceptIntroduced).toBe('Component basics');
    expect(level.description).toBe('Create your first component');
    expect(level.parTime).toBe(45);
    expect(level.data).toEqual({ beltSpeed: 1 });
  });

  it('should accept a level definition without parTime', () => {
    const level: LevelDefinition = {
      levelId: 'ma-basic-02',
      gameId: 'module-assembly',
      tier: DifficultyTier.Basic,
      order: 2,
      title: 'No Timer',
      conceptIntroduced: 'Templates',
      description: 'Practice at your own pace',
      data: {},
    };

    expect(level.parTime).toBeUndefined();
  });

  it('should accept typed game-specific data', () => {
    const level: LevelDefinition<{ beltSpeed: number; partCount: number }> = {
      levelId: 'ma-intermediate-01',
      gameId: 'module-assembly',
      tier: DifficultyTier.Intermediate,
      order: 1,
      title: 'Multi-Part Assembly',
      conceptIntroduced: 'Input bindings',
      description: 'Assemble multiple parts on the belt',
      data: { beltSpeed: 2, partCount: 5 },
    };

    expect(level.data.beltSpeed).toBe(2);
    expect(level.data.partCount).toBe(5);
  });

  it('should accept different game data types', () => {
    const level: LevelDefinition<{
      connections: { source: string; target: string }[];
    }> = {
      levelId: 'wp-basic-01',
      gameId: 'wire-protocol',
      tier: DifficultyTier.Basic,
      order: 1,
      title: 'First Connection',
      conceptIntroduced: 'Data binding',
      description: 'Connect source to target',
      data: {
        connections: [{ source: 'input', target: 'output' }],
      },
    };

    expect(level.data.connections.length).toBe(1);
    expect(level.data.connections[0].source).toBe('input');
    expect(level.data.connections[0].target).toBe('output');
  });
});

describe('LevelPack', () => {
  it('should accept a valid level pack', () => {
    const pack: LevelPack = {
      gameId: 'module-assembly',
      levels: [
        {
          levelId: 'ma-basic-01',
          gameId: 'module-assembly',
          tier: DifficultyTier.Basic,
          order: 1,
          title: 'Level One',
          conceptIntroduced: 'Components',
          description: 'First level',
          data: {},
        },
        {
          levelId: 'ma-basic-02',
          gameId: 'module-assembly',
          tier: DifficultyTier.Basic,
          order: 2,
          title: 'Level Two',
          conceptIntroduced: 'Templates',
          description: 'Second level',
          data: { difficulty: 'harder' },
        },
      ],
    };

    expect(pack.gameId).toBe('module-assembly');
    expect(pack.levels.length).toBe(2);
  });

  it('should accept an empty levels array', () => {
    const pack: LevelPack = {
      gameId: 'wire-protocol',
      levels: [],
    };

    expect(pack.levels.length).toBe(0);
  });
});

describe('LevelTierConfig', () => {
  it('should accept a valid tier config', () => {
    const config: LevelTierConfig = {
      tier: DifficultyTier.Advanced,
      xpReward: 30,
      unlockRequirement: 'Complete all Intermediate levels',
    };

    expect(config.tier).toBe(DifficultyTier.Advanced);
    expect(config.xpReward).toBe(30);
    expect(config.unlockRequirement).toBe('Complete all Intermediate levels');
  });
});

describe('TIER_XP_REWARDS', () => {
  it('should have Basic tier at 15 XP', () => {
    expect(TIER_XP_REWARDS[DifficultyTier.Basic]).toBe(15);
  });

  it('should have Intermediate tier at 20 XP', () => {
    expect(TIER_XP_REWARDS[DifficultyTier.Intermediate]).toBe(20);
  });

  it('should have Advanced tier at 30 XP', () => {
    expect(TIER_XP_REWARDS[DifficultyTier.Advanced]).toBe(30);
  });

  it('should have Boss tier at 150 XP', () => {
    expect(TIER_XP_REWARDS[DifficultyTier.Boss]).toBe(150);
  });

  it('should have exactly 4 entries', () => {
    expect(Object.keys(TIER_XP_REWARDS).length).toBe(4);
  });
});

describe('PERFECT_SCORE_MULTIPLIER', () => {
  it('should be 2', () => {
    expect(PERFECT_SCORE_MULTIPLIER).toBe(2);
  });
});

describe('LEVEL_TIER_CONFIGS', () => {
  it('should have exactly 4 tier configs', () => {
    expect(LEVEL_TIER_CONFIGS.length).toBe(4);
  });

  it('should have XP rewards matching TIER_XP_REWARDS', () => {
    for (const config of LEVEL_TIER_CONFIGS) {
      expect(config.xpReward).toBe(TIER_XP_REWARDS[config.tier]);
    }
  });

  it('should have correct unlock requirements for all tiers', () => {
    const basicConfig = LEVEL_TIER_CONFIGS.find(
      (c) => c.tier === DifficultyTier.Basic,
    );
    const intermediateConfig = LEVEL_TIER_CONFIGS.find(
      (c) => c.tier === DifficultyTier.Intermediate,
    );
    const advancedConfig = LEVEL_TIER_CONFIGS.find(
      (c) => c.tier === DifficultyTier.Advanced,
    );
    const bossConfig = LEVEL_TIER_CONFIGS.find(
      (c) => c.tier === DifficultyTier.Boss,
    );

    expect(basicConfig!.unlockRequirement).toBe('Available from start');
    expect(intermediateConfig!.unlockRequirement).toBe(
      'Complete all Basic levels',
    );
    expect(advancedConfig!.unlockRequirement).toBe(
      'Complete all Intermediate levels',
    );
    expect(bossConfig!.unlockRequirement).toBe(
      'Complete all Advanced levels',
    );
  });

  it('should be ordered Basic, Intermediate, Advanced, Boss', () => {
    expect(LEVEL_TIER_CONFIGS[0].tier).toBe(DifficultyTier.Basic);
    expect(LEVEL_TIER_CONFIGS[1].tier).toBe(DifficultyTier.Intermediate);
    expect(LEVEL_TIER_CONFIGS[2].tier).toBe(DifficultyTier.Advanced);
    expect(LEVEL_TIER_CONFIGS[3].tier).toBe(DifficultyTier.Boss);
  });
});
