import {
  MinigameId,
  DifficultyTier,
  PlayMode,
  MinigameStatus,
  MinigameConfig,
  MinigameLevel,
  MinigameState,
  MinigameResult,
  DEFAULT_SCORE_CONFIG,
} from './minigame.types';

// --- Compile-time type checks ---

/** All 12 valid MinigameId values assigned to verify the union is complete. */
const _moduleAssembly: MinigameId = 'module-assembly';
const _wireProtocol: MinigameId = 'wire-protocol';
const _flowCommander: MinigameId = 'flow-commander';
const _signalCorps: MinigameId = 'signal-corps';
const _corridorRunner: MinigameId = 'corridor-runner';
const _terminalHack: MinigameId = 'terminal-hack';
const _powerGrid: MinigameId = 'power-grid';
const _dataRelay: MinigameId = 'data-relay';
const _reactorCore: MinigameId = 'reactor-core';
const _deepSpaceRadio: MinigameId = 'deep-space-radio';
const _systemCertification: MinigameId = 'system-certification';
const _blastDoors: MinigameId = 'blast-doors';

// Suppress unused-variable warnings for compile-time checks
void [
  _moduleAssembly,
  _wireProtocol,
  _flowCommander,
  _signalCorps,
  _corridorRunner,
  _terminalHack,
  _powerGrid,
  _dataRelay,
  _reactorCore,
  _deepSpaceRadio,
  _systemCertification,
  _blastDoors,
];

describe('MinigameId', () => {
  it('should include all 12 game IDs', () => {
    const ALL_GAME_IDS: MinigameId[] = [
      'module-assembly',
      'wire-protocol',
      'flow-commander',
      'signal-corps',
      'corridor-runner',
      'terminal-hack',
      'power-grid',
      'data-relay',
      'reactor-core',
      'deep-space-radio',
      'system-certification',
      'blast-doors',
    ];
    expect(ALL_GAME_IDS.length).toBe(12);
  });
});

describe('DifficultyTier', () => {
  it('should have Basic equal to "basic"', () => {
    expect(DifficultyTier.Basic).toBe('basic');
  });

  it('should have Intermediate equal to "intermediate"', () => {
    expect(DifficultyTier.Intermediate).toBe('intermediate');
  });

  it('should have Advanced equal to "advanced"', () => {
    expect(DifficultyTier.Advanced).toBe('advanced');
  });

  it('should have Boss equal to "boss"', () => {
    expect(DifficultyTier.Boss).toBe('boss');
  });

  it('should have exactly 4 members', () => {
    const keys = Object.keys(DifficultyTier);
    expect(keys.length).toBe(4);
  });
});

describe('MinigameStatus', () => {
  it('should have Loading equal to "loading"', () => {
    expect(MinigameStatus.Loading).toBe('loading');
  });

  it('should have Playing equal to "playing"', () => {
    expect(MinigameStatus.Playing).toBe('playing');
  });

  it('should have Paused equal to "paused"', () => {
    expect(MinigameStatus.Paused).toBe('paused');
  });

  it('should have Won equal to "won"', () => {
    expect(MinigameStatus.Won).toBe('won');
  });

  it('should have Lost equal to "lost"', () => {
    expect(MinigameStatus.Lost).toBe('lost');
  });

  it('should have exactly 5 members', () => {
    const keys = Object.keys(MinigameStatus);
    expect(keys.length).toBe(5);
  });
});

describe('PlayMode', () => {
  it('should have Story equal to "story"', () => {
    expect(PlayMode.Story).toBe('story');
  });

  it('should have Endless equal to "endless"', () => {
    expect(PlayMode.Endless).toBe('endless');
  });

  it('should have SpeedRun equal to "speedRun"', () => {
    expect(PlayMode.SpeedRun).toBe('speedRun');
  });

  it('should have DailyChallenge equal to "dailyChallenge"', () => {
    expect(PlayMode.DailyChallenge).toBe('dailyChallenge');
  });

  it('should have exactly 4 members', () => {
    const keys = Object.keys(PlayMode);
    expect(keys.length).toBe(4);
  });
});

describe('DEFAULT_SCORE_CONFIG', () => {
  it('should have neutral equal weights', () => {
    expect(DEFAULT_SCORE_CONFIG).toEqual({
      timeWeight: 1,
      accuracyWeight: 1,
      comboWeight: 1,
      maxScore: 1000,
    });
  });
});

describe('MinigameConfig', () => {
  it('should accept a valid config object', () => {
    const config: MinigameConfig = {
      id: 'module-assembly',
      name: 'Module Assembly',
      description: 'Build Angular modules on a conveyor belt',
      angularTopic: 'Components & Templates',
      totalLevels: 18,
      difficultyTiers: [
        DifficultyTier.Basic,
        DifficultyTier.Intermediate,
        DifficultyTier.Advanced,
        DifficultyTier.Boss,
      ],
    };

    expect(config.id).toBe('module-assembly');
    expect(config.name).toBe('Module Assembly');
    expect(config.description).toBe('Build Angular modules on a conveyor belt');
    expect(config.angularTopic).toBe('Components & Templates');
    expect(config.totalLevels).toBe(18);
    expect(config.difficultyTiers).toEqual([
      DifficultyTier.Basic,
      DifficultyTier.Intermediate,
      DifficultyTier.Advanced,
      DifficultyTier.Boss,
    ]);
  });

  it('should accept scoreConfig when provided', () => {
    const config: MinigameConfig = {
      id: 'module-assembly',
      name: 'Module Assembly',
      description: 'Build Angular modules on a conveyor belt',
      angularTopic: 'Components & Templates',
      totalLevels: 18,
      difficultyTiers: [DifficultyTier.Basic],
      scoreConfig: { timeWeight: 10, accuracyWeight: 100, comboWeight: 25, maxScore: 1000 },
    };

    expect(config.scoreConfig).toBeDefined();
    expect(config.scoreConfig!.timeWeight).toBe(10);
    expect(config.scoreConfig!.accuracyWeight).toBe(100);
    expect(config.scoreConfig!.comboWeight).toBe(25);
    expect(config.scoreConfig!.maxScore).toBe(1000);
  });
});

describe('MinigameLevel', () => {
  it('should accept a valid level with default unknown data', () => {
    const level: MinigameLevel = {
      id: 'ma-basic-01',
      gameId: 'module-assembly',
      tier: DifficultyTier.Basic,
      conceptIntroduced: 'Component basics',
      description: 'Create your first component',
      data: { beltSpeed: 1 },
    };

    expect(level.id).toBe('ma-basic-01');
    expect(level.gameId).toBe('module-assembly');
    expect(level.tier).toBe(DifficultyTier.Basic);
    expect(level.conceptIntroduced).toBe('Component basics');
    expect(level.description).toBe('Create your first component');
    expect(level.data).toEqual({ beltSpeed: 1 });
  });

  it('should accept a typed level with generic data', () => {
    interface ModuleAssemblyData {
      beltSpeed: number;
      partCount: number;
    }

    const level: MinigameLevel<ModuleAssemblyData> = {
      id: 'ma-basic-02',
      gameId: 'module-assembly',
      tier: DifficultyTier.Basic,
      conceptIntroduced: 'Input bindings',
      description: 'Wire up input properties',
      data: { beltSpeed: 2, partCount: 5 },
    };

    expect(level.data.beltSpeed).toBe(2);
    expect(level.data.partCount).toBe(5);
  });
});

describe('MinigameState', () => {
  it('should accept a valid state object', () => {
    const state: MinigameState = {
      currentLevel: 'ma-basic-01',
      score: 150,
      lives: 3,
      timeRemaining: 60,
      status: MinigameStatus.Playing,
      playMode: PlayMode.Story,
    };

    expect(state.currentLevel).toBe('ma-basic-01');
    expect(state.score).toBe(150);
    expect(state.lives).toBe(3);
    expect(state.timeRemaining).toBe(60);
    expect(state.status).toBe(MinigameStatus.Playing);
    expect(state.playMode).toBe(PlayMode.Story);
  });

  it('should accept null for currentLevel', () => {
    const state: MinigameState = {
      currentLevel: null,
      score: 0,
      lives: 3,
      timeRemaining: 0,
      status: MinigameStatus.Loading,
      playMode: PlayMode.Story,
    };

    expect(state.currentLevel).toBeNull();
  });
});

describe('MinigameResult', () => {
  it('should accept a valid result object', () => {
    const result: MinigameResult = {
      gameId: 'wire-protocol',
      levelId: 'wp-intermediate-03',
      score: 950,
      perfect: true,
      timeElapsed: 42,
      xpEarned: 40,
      starRating: 4,
    };

    expect(result.gameId).toBe('wire-protocol');
    expect(result.levelId).toBe('wp-intermediate-03');
    expect(result.score).toBe(950);
    expect(result.perfect).toBe(true);
    expect(result.timeElapsed).toBe(42);
    expect(result.xpEarned).toBe(40);
    expect(result.starRating).toBe(4);
  });
});
