import type { MinigameId } from '../core/minigame/minigame.types';

/** Endless mode configuration for a single minigame. */
export interface EndlessModeConfig {
  readonly gameId: MinigameId;
  /** Seconds between new element spawns. */
  readonly spawnInterval: number;
  /** Difficulty scaling curve type. */
  readonly difficultyScaling: 'linear' | 'logarithmic' | 'exponential';
  /** Storage namespace for this game's endless high score. */
  readonly highScoreNamespace: string;
}

/** Speed run configuration for a single minigame. */
export interface SpeedRunConfig {
  readonly gameId: MinigameId;
  /** Par time in seconds for this game's speed run. */
  readonly parTime: number;
  /** Ordered list of level IDs included in the speed run. */
  readonly levelSet: readonly string[];
  /** Storage namespace for this game's best speed run time. */
  readonly bestTimeNamespace: string;
}

// ---------------------------------------------------------------------------
// Endless mode configs for all 12 minigames
// ---------------------------------------------------------------------------

export const ENDLESS_MODE_CONFIGS: Record<MinigameId, EndlessModeConfig> = {
  'module-assembly': {
    gameId: 'module-assembly',
    spawnInterval: 30,
    difficultyScaling: 'logarithmic',
    highScoreNamespace: 'endless-module-assembly',
  },
  'wire-protocol': {
    gameId: 'wire-protocol',
    spawnInterval: 25,
    difficultyScaling: 'logarithmic',
    highScoreNamespace: 'endless-wire-protocol',
  },
  'flow-commander': {
    gameId: 'flow-commander',
    spawnInterval: 20,
    difficultyScaling: 'logarithmic',
    highScoreNamespace: 'endless-flow-commander',
  },
  'signal-corps': {
    gameId: 'signal-corps',
    spawnInterval: 35,
    difficultyScaling: 'logarithmic',
    highScoreNamespace: 'endless-signal-corps',
  },
  'corridor-runner': {
    gameId: 'corridor-runner',
    spawnInterval: 15,
    difficultyScaling: 'exponential',
    highScoreNamespace: 'endless-corridor-runner',
  },
  'terminal-hack': {
    gameId: 'terminal-hack',
    spawnInterval: 40,
    difficultyScaling: 'logarithmic',
    highScoreNamespace: 'endless-terminal-hack',
  },
  'power-grid': {
    gameId: 'power-grid',
    spawnInterval: 30,
    difficultyScaling: 'logarithmic',
    highScoreNamespace: 'endless-power-grid',
  },
  'data-relay': {
    gameId: 'data-relay',
    spawnInterval: 20,
    difficultyScaling: 'linear',
    highScoreNamespace: 'endless-data-relay',
  },
  'reactor-core': {
    gameId: 'reactor-core',
    spawnInterval: 35,
    difficultyScaling: 'logarithmic',
    highScoreNamespace: 'endless-reactor-core',
  },
  'deep-space-radio': {
    gameId: 'deep-space-radio',
    spawnInterval: 25,
    difficultyScaling: 'logarithmic',
    highScoreNamespace: 'endless-deep-space-radio',
  },
  'system-certification': {
    gameId: 'system-certification',
    spawnInterval: 45,
    difficultyScaling: 'linear',
    highScoreNamespace: 'endless-system-certification',
  },
  'blast-doors': {
    gameId: 'blast-doors',
    spawnInterval: 20,
    difficultyScaling: 'exponential',
    highScoreNamespace: 'endless-blast-doors',
  },
};

// ---------------------------------------------------------------------------
// Speed run configs for all 12 minigames
// Par times sourced from each minigame spec and SPEED_RUN_CONFIG
// ---------------------------------------------------------------------------

export const SPEED_RUN_CONFIGS: Record<MinigameId, SpeedRunConfig> = {
  'module-assembly': {
    gameId: 'module-assembly',
    parTime: 180,
    levelSet: [
      'ma-basic-01', 'ma-basic-02', 'ma-basic-03',
      'ma-inter-01', 'ma-inter-02', 'ma-inter-03',
      'ma-adv-01', 'ma-adv-02',
      'ma-boss-01', 'ma-boss-02',
    ],
    bestTimeNamespace: 'speedrun-module-assembly',
  },
  'wire-protocol': {
    gameId: 'wire-protocol',
    parTime: 240,
    levelSet: [
      'wp-basic-01', 'wp-basic-02',
      'wp-inter-01', 'wp-inter-02',
      'wp-adv-01', 'wp-adv-02',
      'wp-boss-01', 'wp-boss-02',
    ],
    bestTimeNamespace: 'speedrun-wire-protocol',
  },
  'flow-commander': {
    gameId: 'flow-commander',
    parTime: 300,
    levelSet: [
      'fc-basic-01', 'fc-basic-02', 'fc-basic-03',
      'fc-inter-01', 'fc-inter-02', 'fc-inter-03',
      'fc-adv-01', 'fc-adv-02', 'fc-adv-03',
      'fc-boss-01', 'fc-boss-02', 'fc-boss-03',
    ],
    bestTimeNamespace: 'speedrun-flow-commander',
  },
  'signal-corps': {
    gameId: 'signal-corps',
    parTime: 360,
    levelSet: [
      'sc-basic-01', 'sc-basic-02', 'sc-basic-03',
      'sc-inter-01', 'sc-inter-02', 'sc-inter-03',
      'sc-adv-01', 'sc-adv-02',
      'sc-boss-01', 'sc-boss-02',
    ],
    bestTimeNamespace: 'speedrun-signal-corps',
  },
  'corridor-runner': {
    gameId: 'corridor-runner',
    parTime: 240,
    levelSet: [
      'cr-basic-01', 'cr-basic-02', 'cr-basic-03',
      'cr-inter-01', 'cr-inter-02', 'cr-inter-03',
      'cr-adv-01', 'cr-adv-02',
      'cr-boss-01', 'cr-boss-02',
    ],
    bestTimeNamespace: 'speedrun-corridor-runner',
  },
  'terminal-hack': {
    gameId: 'terminal-hack',
    parTime: 480,
    levelSet: [
      'th-basic-01', 'th-basic-02',
      'th-inter-01', 'th-inter-02',
      'th-adv-01', 'th-adv-02',
      'th-boss-01', 'th-boss-02',
    ],
    bestTimeNamespace: 'speedrun-terminal-hack',
  },
  'power-grid': {
    gameId: 'power-grid',
    parTime: 300,
    levelSet: [
      'pg-basic-01', 'pg-basic-02', 'pg-basic-03',
      'pg-inter-01', 'pg-inter-02', 'pg-inter-03',
      'pg-adv-01', 'pg-adv-02',
      'pg-boss-01', 'pg-boss-02',
    ],
    bestTimeNamespace: 'speedrun-power-grid',
  },
  'data-relay': {
    gameId: 'data-relay',
    parTime: 240,
    levelSet: [
      'dr-basic-01', 'dr-basic-02', 'dr-basic-03',
      'dr-inter-01', 'dr-inter-02', 'dr-inter-03',
      'dr-adv-01', 'dr-adv-02',
      'dr-boss-01', 'dr-boss-02',
    ],
    bestTimeNamespace: 'speedrun-data-relay',
  },
  'reactor-core': {
    gameId: 'reactor-core',
    parTime: 420,
    levelSet: [
      'rc-basic-01', 'rc-basic-02', 'rc-basic-03',
      'rc-inter-01', 'rc-inter-02', 'rc-inter-03',
      'rc-adv-01', 'rc-adv-02',
      'rc-boss-01', 'rc-boss-02',
    ],
    bestTimeNamespace: 'speedrun-reactor-core',
  },
  'deep-space-radio': {
    gameId: 'deep-space-radio',
    parTime: 300,
    levelSet: [
      'dsr-basic-01', 'dsr-basic-02', 'dsr-basic-03',
      'dsr-inter-01', 'dsr-inter-02', 'dsr-inter-03',
      'dsr-adv-01', 'dsr-adv-02',
      'dsr-boss-01', 'dsr-boss-02',
    ],
    bestTimeNamespace: 'speedrun-deep-space-radio',
  },
  'system-certification': {
    gameId: 'system-certification',
    parTime: 600,
    levelSet: [
      'sysc-basic-01',
      'sysc-inter-01',
      'sysc-adv-01', 'sysc-adv-02',
      'sysc-boss-01', 'sysc-boss-02',
    ],
    bestTimeNamespace: 'speedrun-system-certification',
  },
  'blast-doors': {
    gameId: 'blast-doors',
    parTime: 360,
    levelSet: [
      'bd-basic-01', 'bd-basic-02',
      'bd-inter-01', 'bd-inter-02',
      'bd-adv-01', 'bd-adv-02',
      'bd-boss-01', 'bd-boss-02',
    ],
    bestTimeNamespace: 'speedrun-blast-doors',
  },
};

// ---------------------------------------------------------------------------
// Lookup helpers (with fallback for unknown gameId)
// ---------------------------------------------------------------------------

/** Returns the endless mode config for the given gameId, or null if not found. */
export function getEndlessModeConfig(gameId: MinigameId): EndlessModeConfig | null {
  return ENDLESS_MODE_CONFIGS[gameId] ?? null;
}

/** Returns the speed run config for the given gameId, or null if not found. */
export function getSpeedRunConfig(gameId: MinigameId): SpeedRunConfig | null {
  return SPEED_RUN_CONFIGS[gameId] ?? null;
}
