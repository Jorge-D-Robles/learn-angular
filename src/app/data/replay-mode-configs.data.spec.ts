import {
  ENDLESS_MODE_CONFIGS,
  SPEED_RUN_CONFIGS,
  getEndlessModeConfig,
  getSpeedRunConfig,
  type EndlessModeConfig,
  type SpeedRunConfig,
} from './replay-mode-configs.data';
import type { MinigameId } from '../core/minigame/minigame.types';

const ALL_MINIGAME_IDS: MinigameId[] = [
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

// --- Interface compile-time checks ---

const _endlessConfig: EndlessModeConfig = {
  gameId: 'module-assembly',
  spawnInterval: 30,
  difficultyScaling: 'logarithmic',
  highScoreNamespace: 'endless-module-assembly',
};

const _speedRunConfig: SpeedRunConfig = {
  gameId: 'module-assembly',
  parTime: 180,
  levelSet: ['ma-basic-01'],
  bestTimeNamespace: 'speedrun-module-assembly',
};

void [_endlessConfig, _speedRunConfig];

// --- ENDLESS_MODE_CONFIGS ---

describe('ENDLESS_MODE_CONFIGS', () => {
  it('should have entries for all 12 minigames', () => {
    for (const id of ALL_MINIGAME_IDS) {
      expect(ENDLESS_MODE_CONFIGS[id]).toBeDefined();
    }
  });

  it('should have gameId matching the key for each entry', () => {
    for (const id of ALL_MINIGAME_IDS) {
      expect(ENDLESS_MODE_CONFIGS[id].gameId).toBe(id);
    }
  });

  it('should have positive spawnInterval for all entries', () => {
    for (const id of ALL_MINIGAME_IDS) {
      expect(ENDLESS_MODE_CONFIGS[id].spawnInterval).toBeGreaterThan(0);
    }
  });

  it('should have non-empty highScoreNamespace for all entries', () => {
    for (const id of ALL_MINIGAME_IDS) {
      expect(ENDLESS_MODE_CONFIGS[id].highScoreNamespace.length).toBeGreaterThan(0);
    }
  });

  it('should have unique highScoreNamespaces', () => {
    const namespaces = ALL_MINIGAME_IDS.map(
      (id) => ENDLESS_MODE_CONFIGS[id].highScoreNamespace,
    );
    const unique = new Set(namespaces);
    expect(unique.size).toBe(ALL_MINIGAME_IDS.length);
  });
});

// --- SPEED_RUN_CONFIGS ---

describe('SPEED_RUN_CONFIGS', () => {
  it('should have entries for all 12 minigames', () => {
    for (const id of ALL_MINIGAME_IDS) {
      expect(SPEED_RUN_CONFIGS[id]).toBeDefined();
    }
  });

  it('should have gameId matching the key for each entry', () => {
    for (const id of ALL_MINIGAME_IDS) {
      expect(SPEED_RUN_CONFIGS[id].gameId).toBe(id);
    }
  });

  it('should have positive parTime for all entries', () => {
    for (const id of ALL_MINIGAME_IDS) {
      expect(SPEED_RUN_CONFIGS[id].parTime).toBeGreaterThan(0);
    }
  });

  it('should have non-empty levelSet for all entries', () => {
    for (const id of ALL_MINIGAME_IDS) {
      expect(SPEED_RUN_CONFIGS[id].levelSet.length).toBeGreaterThan(0);
    }
  });

  it('should have unique bestTimeNamespaces', () => {
    const namespaces = ALL_MINIGAME_IDS.map(
      (id) => SPEED_RUN_CONFIGS[id].bestTimeNamespace,
    );
    const unique = new Set(namespaces);
    expect(unique.size).toBe(ALL_MINIGAME_IDS.length);
  });

  // Par time spot-checks from minigame specs
  it('should have Module Assembly par time of 180 seconds (3 min)', () => {
    expect(SPEED_RUN_CONFIGS['module-assembly'].parTime).toBe(180);
  });

  it('should have Wire Protocol par time of 240 seconds (4 min)', () => {
    expect(SPEED_RUN_CONFIGS['wire-protocol'].parTime).toBe(240);
  });

  it('should have Flow Commander par time of 300 seconds (5 min)', () => {
    expect(SPEED_RUN_CONFIGS['flow-commander'].parTime).toBe(300);
  });
});

// --- Lookup helpers ---

describe('getEndlessModeConfig', () => {
  it('should return config for a valid gameId', () => {
    const config = getEndlessModeConfig('module-assembly');
    expect(config).toBeDefined();
    expect(config!.gameId).toBe('module-assembly');
  });

  it('should return null for an unknown gameId', () => {
    const config = getEndlessModeConfig('unknown-game' as MinigameId);
    expect(config).toBeNull();
  });
});

describe('getSpeedRunConfig', () => {
  it('should return config for a valid gameId', () => {
    const config = getSpeedRunConfig('wire-protocol');
    expect(config).toBeDefined();
    expect(config!.gameId).toBe('wire-protocol');
  });

  it('should return null for an unknown gameId', () => {
    const config = getSpeedRunConfig('unknown-game' as MinigameId);
    expect(config).toBeNull();
  });
});
