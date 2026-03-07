import {
  MinigameRegistryService,
  DEFAULT_MINIGAME_CONFIGS,
} from './minigame-registry.service';
import type { MinigameId, MinigameConfig } from './minigame.types';
import { MinigameEngine, type ActionResult } from './minigame-engine';

describe('MinigameRegistryService', () => {
  let service: MinigameRegistryService;

  beforeEach(() => {
    service = new MinigameRegistryService();
  });

  // --- Structural tests ---

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should export DEFAULT_MINIGAME_CONFIGS with 12 entries', () => {
    expect(DEFAULT_MINIGAME_CONFIGS).toBeDefined();
    expect(DEFAULT_MINIGAME_CONFIGS.length).toBe(12);

    const validIds: MinigameId[] = [
      'module-assembly', 'wire-protocol', 'flow-commander', 'signal-corps',
      'corridor-runner', 'terminal-hack', 'power-grid', 'data-relay',
      'reactor-core', 'deep-space-radio', 'system-certification', 'blast-doors',
    ];
    for (const config of DEFAULT_MINIGAME_CONFIGS) {
      expect(validIds).toContain(config.id);
    }
  });

  // --- Pre-registration tests ---

  it('should pre-register all 12 minigames on construction', () => {
    const games = service.getAllGames();
    expect(games.length).toBe(12);
  });

  it('should pre-register with null component types', () => {
    const component = service.getComponent('module-assembly');
    expect(component).toBeNull();
  });

  // --- register() tests ---

  it('should register a new game with a component type', () => {
    class MockComponent {}
    const config: MinigameConfig = {
      id: 'module-assembly',
      name: 'Module Assembly',
      description: 'Conveyor belt drag-and-drop assembly',
      angularTopic: 'Components',
      totalLevels: 18,
      difficultyTiers: [],
    };
    service.register(config, MockComponent);
    expect(service.getComponent('module-assembly')).toBe(MockComponent);
  });

  it('should overwrite an existing registration', () => {
    class MockComponent {}
    const newConfig: MinigameConfig = {
      id: 'module-assembly',
      name: 'Updated Module Assembly',
      description: 'Updated description',
      angularTopic: 'Components',
      totalLevels: 20,
      difficultyTiers: [],
    };
    service.register(newConfig, MockComponent);

    expect(service.getComponent('module-assembly')).toBe(MockComponent);
    expect(service.getConfig('module-assembly')?.name).toBe('Updated Module Assembly');
  });

  // --- getConfig() tests ---

  it('should return the config for a registered game', () => {
    const config = service.getConfig('module-assembly');
    expect(config).toBeDefined();
    expect(config!.id).toBe('module-assembly');
  });

  it('should return undefined for an unregistered game', () => {
    const config = service.getConfig('nonexistent' as MinigameId);
    expect(config).toBeUndefined();
  });

  // --- getComponent() tests ---

  it('should return the component type for a registered game', () => {
    class MockComponent {}
    const config: MinigameConfig = {
      id: 'module-assembly',
      name: 'Module Assembly',
      description: 'Conveyor belt drag-and-drop assembly',
      angularTopic: 'Components',
      totalLevels: 18,
      difficultyTiers: [],
    };
    service.register(config, MockComponent);
    expect(service.getComponent('module-assembly')).toBe(MockComponent);
  });

  it('should return null for a pre-registered game with no component', () => {
    const component = service.getComponent('wire-protocol');
    expect(component).toBeNull();
  });

  it('should return undefined for an unregistered game', () => {
    const component = service.getComponent('nonexistent' as MinigameId);
    expect(component).toBeUndefined();
  });

  // --- getAllGames() tests ---

  it('should return all 12 pre-registered configs', () => {
    const games = service.getAllGames();
    expect(games.length).toBe(12);
  });

  it('should return a new array on each call (no mutation risk)', () => {
    const first = service.getAllGames();
    const second = service.getAllGames();
    expect(first).not.toBe(second);
  });

  // --- getGamesByTopic() tests ---

  it('should return games matching the topic string', () => {
    const results = service.getGamesByTopic('Components');
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results.some((c: MinigameConfig) => c.id === 'module-assembly')).toBe(true);
  });

  it('should return an empty array when no games match', () => {
    const results = service.getGamesByTopic('Nonexistent Topic');
    expect(results).toEqual([]);
  });

  it('should be case-sensitive', () => {
    const results = service.getGamesByTopic('components');
    expect(results).toEqual([]);
  });

  // --- Engine factory tests ---

  describe('Engine factory registration', () => {
    class StubEngine extends MinigameEngine<unknown> {
      constructor() { super(); }
      protected onLevelLoad(): void { /* stub */ }
      protected onStart(): void { /* stub */ }
      protected onComplete(): void { /* stub */ }
      protected validateAction(): ActionResult {
        return { valid: true, scoreChange: 0, livesChange: 0 };
      }
    }

    it('should store engine factory when registered', () => {
      const factory = () => new StubEngine();
      const config: MinigameConfig = {
        id: 'module-assembly',
        name: 'Module Assembly',
        description: 'test',
        angularTopic: 'Components',
        totalLevels: 18,
        difficultyTiers: [],
      };
      service.register(config, null, factory);
      expect(service.getEngineFactory('module-assembly')).toBe(factory);
    });

    it('should default engineFactory to null when registered without factory', () => {
      const config: MinigameConfig = {
        id: 'wire-protocol',
        name: 'Wire Protocol',
        description: 'test',
        angularTopic: 'Data Binding',
        totalLevels: 18,
        difficultyTiers: [],
      };
      service.register(config, null);
      expect(service.getEngineFactory('wire-protocol')).toBeNull();
    });

    it('should return undefined for getEngineFactory with unregistered gameId', () => {
      expect(service.getEngineFactory('nonexistent' as MinigameId)).toBeUndefined();
    });

    it('should pre-register with null engine factories', () => {
      expect(service.getEngineFactory('module-assembly')).toBeNull();
    });
  });

  // --- Data integrity tests ---

  it('should have unique IDs across all 12 default configs', () => {
    const ids = DEFAULT_MINIGAME_CONFIGS.map((c: MinigameConfig) => c.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('should have non-empty name, description, and angularTopic for every default config', () => {
    for (const config of DEFAULT_MINIGAME_CONFIGS) {
      expect(config.name.length).toBeGreaterThan(0);
      expect(config.description.length).toBeGreaterThan(0);
      expect(config.angularTopic.length).toBeGreaterThan(0);
    }
  });
});
