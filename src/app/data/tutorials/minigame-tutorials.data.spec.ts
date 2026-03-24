import type { MinigameId } from '../../core/minigame/minigame.types';
import {
  MINIGAME_TUTORIALS,
  getMinigameTutorial,
  type MinigameTutorialData,
} from './minigame-tutorials.data';

const GAME_IDS_WITH_TUTORIALS: MinigameId[] = [
  'module-assembly',
  'wire-protocol',
  'flow-commander',
  'signal-corps',
  'terminal-hack',
  'power-grid',
  'data-relay',
  'reactor-core',
];

describe('MINIGAME_TUTORIALS', () => {
  it('should have tutorial data for all minigames with tutorials', () => {
    const gameIds = MINIGAME_TUTORIALS.map(t => t.gameId);
    for (const id of GAME_IDS_WITH_TUTORIALS) {
      expect(gameIds).toContain(id);
    }
  });

  it('should have 3-4 steps per game', () => {
    for (const tutorial of MINIGAME_TUTORIALS) {
      expect(tutorial.steps.length).toBeGreaterThanOrEqual(3);
      expect(tutorial.steps.length).toBeLessThanOrEqual(4);
    }
  });

  it('should have non-empty title and description for every step', () => {
    for (const tutorial of MINIGAME_TUTORIALS) {
      for (const step of tutorial.steps) {
        expect(step.title.length).toBeGreaterThan(0);
        expect(step.description.length).toBeGreaterThan(0);
      }
    }
  });

  it('should have valid MinigameId values for all gameIds', () => {
    const validIds: MinigameId[] = [
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
    for (const tutorial of MINIGAME_TUTORIALS) {
      expect(validIds).toContain(tutorial.gameId);
    }
  });

  it('should have no duplicate gameIds', () => {
    const gameIds = MINIGAME_TUTORIALS.map(t => t.gameId);
    expect(new Set(gameIds).size).toBe(gameIds.length);
  });
});

describe('getMinigameTutorial', () => {
  it('should return correct data for a known gameId', () => {
    const result = getMinigameTutorial('module-assembly');
    expect(result).toBeDefined();
    expect(result!.gameId).toBe('module-assembly');
    expect(result!.steps.length).toBeGreaterThanOrEqual(3);
  });

  it('should return undefined for an unknown gameId', () => {
    const result = getMinigameTutorial('corridor-runner');
    expect(result).toBeUndefined();
  });
});

describe('Terminal Hack tutorial', () => {
  it('should have tutorial data for terminal-hack', () => {
    const result = getMinigameTutorial('terminal-hack');
    expect(result).toBeDefined();
    expect(result!.gameId).toBe('terminal-hack');
  });

  it('should have 4 steps', () => {
    const result = getMinigameTutorial('terminal-hack');
    expect(result!.steps.length).toBe(4);
  });

  it('should have non-empty title and description for every step', () => {
    const result = getMinigameTutorial('terminal-hack');
    for (const step of result!.steps) {
      expect(step.title.length).toBeGreaterThan(0);
      expect(step.description.length).toBeGreaterThan(0);
    }
  });
});

describe('Power Grid tutorial', () => {
  it('should have tutorial data for power-grid', () => {
    const result = getMinigameTutorial('power-grid');
    expect(result).toBeDefined();
    expect(result!.gameId).toBe('power-grid');
  });

  it('should have 4 steps', () => {
    const result = getMinigameTutorial('power-grid');
    expect(result!.steps.length).toBe(4);
  });

  it('should have non-empty title and description for every step', () => {
    const result = getMinigameTutorial('power-grid');
    for (const step of result!.steps) {
      expect(step.title.length).toBeGreaterThan(0);
      expect(step.description.length).toBeGreaterThan(0);
    }
  });
});

describe('Data Relay tutorial', () => {
  it('should have tutorial data for data-relay', () => {
    const result = getMinigameTutorial('data-relay');
    expect(result).toBeDefined();
    expect(result!.gameId).toBe('data-relay');
  });

  it('should have 4 steps', () => {
    const result = getMinigameTutorial('data-relay');
    expect(result!.steps.length).toBe(4);
  });

  it('should have non-empty title and description for every step', () => {
    const result = getMinigameTutorial('data-relay');
    for (const step of result!.steps) {
      expect(step.title.length).toBeGreaterThan(0);
      expect(step.description.length).toBeGreaterThan(0);
    }
  });
});

describe('Reactor Core tutorial', () => {
  it('should have tutorial data for reactor-core', () => {
    const result = getMinigameTutorial('reactor-core');
    expect(result).toBeDefined();
    expect(result!.gameId).toBe('reactor-core');
  });

  it('should have 4 steps', () => {
    const result = getMinigameTutorial('reactor-core');
    expect(result!.steps.length).toBe(4);
  });

  it('should have non-empty title and description for every step', () => {
    const result = getMinigameTutorial('reactor-core');
    for (const step of result!.steps) {
      expect(step.title.length).toBeGreaterThan(0);
      expect(step.description.length).toBeGreaterThan(0);
    }
  });
});

// --- Compile-time type check ---
const _tutorial: MinigameTutorialData = {
  gameId: 'module-assembly',
  steps: [{ title: 'Test', description: 'Test description' }],
};
void _tutorial;
