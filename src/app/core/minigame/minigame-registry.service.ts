import { Injectable, Type } from '@angular/core';
import { DEFAULT_SCORE_CONFIG, DifficultyTier, type MinigameConfig, type MinigameId } from './minigame.types';
import type { MinigameEngine } from './minigame-engine';

interface RegistryEntry {
  readonly config: MinigameConfig;
  readonly componentType: Type<any> | null;
  readonly engineFactory: (() => MinigameEngine<unknown>) | null;
}

/** All 12 minigame configs, pre-populated from docs/minigames/*.md specs. */
export const DEFAULT_MINIGAME_CONFIGS: readonly MinigameConfig[] = [
  {
    id: 'module-assembly',
    name: 'Module Assembly',
    description: 'Conveyor belt drag-and-drop assembly',
    angularTopic: 'Components',
    totalLevels: 18,
    difficultyTiers: [DifficultyTier.Basic, DifficultyTier.Intermediate, DifficultyTier.Advanced, DifficultyTier.Boss],
    // formula from docs/minigames/01-module-assembly.md
    scoreConfig: { timeWeight: 10, accuracyWeight: 100, comboWeight: 25, maxScore: 1000 },
  },
  {
    id: 'wire-protocol',
    name: 'Wire Protocol',
    description: 'Wiring puzzle — connect sources to template slots',
    angularTopic: 'Data Binding (interpolation, property, event, two-way)',
    totalLevels: 18,
    difficultyTiers: [DifficultyTier.Basic, DifficultyTier.Intermediate, DifficultyTier.Advanced, DifficultyTier.Boss],
    scoreConfig: DEFAULT_SCORE_CONFIG, // placeholder — tune when engine is built
  },
  {
    id: 'flow-commander',
    name: 'Flow Commander',
    description: 'Traffic controller — place control flow gates in pipelines',
    angularTopic: 'Control Flow (@if, @for, @switch)',
    totalLevels: 18,
    difficultyTiers: [DifficultyTier.Basic, DifficultyTier.Intermediate, DifficultyTier.Advanced, DifficultyTier.Boss],
    scoreConfig: DEFAULT_SCORE_CONFIG, // placeholder — tune when engine is built
  },
  {
    id: 'signal-corps',
    name: 'Signal Corps',
    description: 'Tower defense — declare inputs/outputs and wire parent-child bindings',
    angularTopic: 'Input/Output Properties',
    totalLevels: 18,
    difficultyTiers: [DifficultyTier.Basic, DifficultyTier.Intermediate, DifficultyTier.Advanced, DifficultyTier.Boss],
    scoreConfig: DEFAULT_SCORE_CONFIG, // placeholder — tune when engine is built
  },
  {
    id: 'corridor-runner',
    name: 'Corridor Runner',
    description: 'Maze navigation + route configuration',
    angularTopic: 'Routing',
    totalLevels: 18,
    difficultyTiers: [DifficultyTier.Basic, DifficultyTier.Intermediate, DifficultyTier.Advanced, DifficultyTier.Boss],
    scoreConfig: DEFAULT_SCORE_CONFIG, // placeholder — tune when engine is built
  },
  {
    id: 'terminal-hack',
    name: 'Terminal Hack',
    description: 'Timed form reconstruction',
    angularTopic: 'Forms (template-driven and reactive)',
    totalLevels: 21,
    difficultyTiers: [DifficultyTier.Basic, DifficultyTier.Intermediate, DifficultyTier.Advanced, DifficultyTier.Boss],
    scoreConfig: DEFAULT_SCORE_CONFIG, // placeholder — tune when engine is built
  },
  {
    id: 'power-grid',
    name: 'Power Grid',
    description: 'Circuit board puzzle — route power lines from services to components',
    angularTopic: 'Services & Dependency Injection',
    totalLevels: 18,
    difficultyTiers: [DifficultyTier.Basic, DifficultyTier.Intermediate, DifficultyTier.Advanced, DifficultyTier.Boss],
    scoreConfig: DEFAULT_SCORE_CONFIG, // placeholder — tune when engine is built
  },
  {
    id: 'data-relay',
    name: 'Data Relay',
    description: 'Stream transformer — place pipe blocks to convert data',
    angularTopic: 'Pipes',
    totalLevels: 18,
    difficultyTiers: [DifficultyTier.Basic, DifficultyTier.Intermediate, DifficultyTier.Advanced, DifficultyTier.Boss],
    scoreConfig: DEFAULT_SCORE_CONFIG, // placeholder — tune when engine is built
  },
  {
    id: 'reactor-core',
    name: 'Reactor Core',
    description: 'Reactive circuit design — build signal graphs',
    angularTopic: 'Signals',
    totalLevels: 21,
    difficultyTiers: [DifficultyTier.Basic, DifficultyTier.Intermediate, DifficultyTier.Advanced, DifficultyTier.Boss],
    scoreConfig: DEFAULT_SCORE_CONFIG, // placeholder — tune when engine is built
  },
  {
    id: 'deep-space-radio',
    name: 'Deep Space Radio',
    description: 'Message management — configure HTTP calls and interceptor chains',
    angularTopic: 'HTTP Client & Interceptors',
    totalLevels: 18,
    difficultyTiers: [DifficultyTier.Basic, DifficultyTier.Intermediate, DifficultyTier.Advanced, DifficultyTier.Boss],
    scoreConfig: DEFAULT_SCORE_CONFIG, // placeholder — tune when engine is built
  },
  {
    id: 'system-certification',
    name: 'System Certification',
    description: 'Test writing challenge with real-time test runner',
    angularTopic: 'Testing',
    totalLevels: 18,
    difficultyTiers: [DifficultyTier.Basic, DifficultyTier.Intermediate, DifficultyTier.Advanced, DifficultyTier.Boss],
    scoreConfig: DEFAULT_SCORE_CONFIG, // placeholder — tune when engine is built
  },
  {
    id: 'blast-doors',
    name: 'Blast Doors',
    description: 'State machine programming — control automated blast door behavior',
    angularTopic: 'Lifecycle Hooks & Custom Directives',
    totalLevels: 18,
    difficultyTiers: [DifficultyTier.Basic, DifficultyTier.Intermediate, DifficultyTier.Advanced, DifficultyTier.Boss],
    scoreConfig: DEFAULT_SCORE_CONFIG, // placeholder — tune when engine is built
  },
];

/**
 * Registry service that maps minigame IDs to their configurations and component types.
 * Pre-registers all 12 minigames at construction time with null component types.
 */
@Injectable({ providedIn: 'root' })
export class MinigameRegistryService {
  private readonly registry = new Map<MinigameId, RegistryEntry>();

  constructor() {
    for (const config of DEFAULT_MINIGAME_CONFIGS) {
      this.registry.set(config.id, { config, componentType: null, engineFactory: null });
    }
  }

  /** Registers (or re-registers) a minigame with its config, component type, and optional engine factory. */
  register(
    config: MinigameConfig,
    componentType: Type<any> | null,
    engineFactory?: (() => MinigameEngine<unknown>) | null,
  ): void {
    this.registry.set(config.id, { config, componentType, engineFactory: engineFactory ?? null });
  }

  /** Returns the config for the given game ID, or undefined if not found. */
  getConfig(gameId: MinigameId): MinigameConfig | undefined {
    return this.registry.get(gameId)?.config;
  }

  /**
   * Returns the component type for the given game ID.
   * - `null` = game is registered but has no component yet
   * - `undefined` = game ID is not in the registry
   */
  getComponent(gameId: MinigameId): Type<any> | null | undefined {
    const entry = this.registry.get(gameId);
    if (entry === undefined) {
      return undefined;
    }
    return entry.componentType;
  }

  /**
   * Returns the engine factory for the given game ID.
   * - `null` = game is registered but has no engine factory yet
   * - `undefined` = game ID is not in the registry
   */
  getEngineFactory(gameId: MinigameId): (() => MinigameEngine<unknown>) | null | undefined {
    const entry = this.registry.get(gameId);
    if (entry === undefined) return undefined;
    return entry.engineFactory;
  }

  /** Returns all registered minigame configs as a new array. */
  getAllGames(): MinigameConfig[] {
    return [...this.registry.values()].map(entry => entry.config);
  }

  /** Returns configs whose angularTopic matches the given string (case-sensitive). */
  getGamesByTopic(topic: string): MinigameConfig[] {
    return this.getAllGames().filter(config => config.angularTopic === topic);
  }
}
