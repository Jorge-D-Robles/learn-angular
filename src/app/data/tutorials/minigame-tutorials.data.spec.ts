import type { MinigameId } from '../../core/minigame/minigame.types';
import {
  MINIGAME_TUTORIALS,
  getMinigameTutorial,
  type MinigameTutorialData,
} from './minigame-tutorials.data';

const P2_GAME_IDS: MinigameId[] = [
  'module-assembly',
  'wire-protocol',
  'flow-commander',
  'signal-corps',
];

describe('MINIGAME_TUTORIALS', () => {
  it('should have tutorial data for all 4 P2 minigames', () => {
    const gameIds = MINIGAME_TUTORIALS.map(t => t.gameId);
    for (const id of P2_GAME_IDS) {
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

// --- Compile-time type check ---
const _tutorial: MinigameTutorialData = {
  gameId: 'module-assembly',
  steps: [{ title: 'Test', description: 'Test description' }],
};
void _tutorial;
