import { TestBed } from '@angular/core/testing';
import {
  DifficultyTier,
  type MinigameId,
} from '../minigame/minigame.types';
import type { LevelDefinition, LevelPack } from './level.types';
import { LevelLoaderService } from './level-loader.service';
import { LevelProgressionService } from './level-progression.service';

// --- Test fixtures ---

const TEST_GAME_ID: MinigameId = 'module-assembly';

const testLevelPack: LevelPack = {
  gameId: TEST_GAME_ID,
  levels: [
    {
      levelId: 'ma-basic-01',
      gameId: TEST_GAME_ID,
      tier: DifficultyTier.Basic,
      order: 1,
      title: 'L1',
      conceptIntroduced: 'c1',
      description: 'd1',
      data: {},
    },
    {
      levelId: 'ma-basic-02',
      gameId: TEST_GAME_ID,
      tier: DifficultyTier.Basic,
      order: 2,
      title: 'L2',
      conceptIntroduced: 'c2',
      description: 'd2',
      data: {},
    },
    {
      levelId: 'ma-inter-01',
      gameId: TEST_GAME_ID,
      tier: DifficultyTier.Intermediate,
      order: 1,
      title: 'L3',
      conceptIntroduced: 'c3',
      description: 'd3',
      data: {},
    },
    {
      levelId: 'ma-adv-01',
      gameId: TEST_GAME_ID,
      tier: DifficultyTier.Advanced,
      order: 1,
      title: 'L4',
      conceptIntroduced: 'c4',
      description: 'd4',
      data: {},
    },
    {
      levelId: 'ma-boss-01',
      gameId: TEST_GAME_ID,
      tier: DifficultyTier.Boss,
      order: 1,
      title: 'L5',
      conceptIntroduced: 'c5',
      description: 'd5',
      data: {},
    },
  ],
};

describe('LevelLoaderService', () => {
  let service: LevelLoaderService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LevelLoaderService);
  });

  // --- Initialization ---

  describe('Initialization', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should return empty observable for unregistered game', () => {
      let result: readonly LevelDefinition<unknown>[] | undefined;
      service.loadLevelPack('module-assembly').subscribe((levels) => {
        result = levels;
      });
      expect(result).toEqual([]);
    });
  });

  // --- registerLevelPack ---

  describe('registerLevelPack', () => {
    it('should register a level pack', () => {
      service.registerLevelPack(testLevelPack);

      let result: readonly LevelDefinition<unknown>[] | undefined;
      service.loadLevelPack('module-assembly').subscribe((levels) => {
        result = levels;
      });
      expect(result).toHaveLength(5);
    });

    it('should forward levels to LevelProgressionService', () => {
      const progressionService = TestBed.inject(LevelProgressionService);
      const registerSpy = vi.spyOn(progressionService, 'registerLevels');

      service.registerLevelPack(testLevelPack);

      expect(registerSpy).toHaveBeenCalledWith(testLevelPack.levels);
    });

    it('should be a no-op when registering the same gameId twice', () => {
      service.registerLevelPack(testLevelPack);

      const altPack: LevelPack = {
        gameId: TEST_GAME_ID,
        levels: [testLevelPack.levels[0]],
      };
      service.registerLevelPack(altPack);

      let result: readonly LevelDefinition<unknown>[] | undefined;
      service.loadLevelPack('module-assembly').subscribe((levels) => {
        result = levels;
      });
      expect(result).toHaveLength(5);
    });
  });

  // --- loadLevel ---

  describe('loadLevel', () => {
    beforeEach(() => {
      service.registerLevelPack(testLevelPack);
    });

    it('should return the matching level definition', () => {
      let result: LevelDefinition<unknown> | undefined;
      service.loadLevel('module-assembly', 'ma-basic-01').subscribe((level) => {
        result = level;
      });
      expect(result).toBeDefined();
      expect(result!.levelId).toBe('ma-basic-01');
      expect(result!.gameId).toBe(TEST_GAME_ID);
      expect(result!.tier).toBe(DifficultyTier.Basic);
    });

    it('should error when level not found in registered game', () => {
      let err: unknown;
      service.loadLevel('module-assembly', 'nonexistent').subscribe({
        error: (e: unknown) => {
          err = e;
        },
      });
      expect(err).toBeInstanceOf(Error);
      expect((err as Error).message).toContain('Level not found');
    });

    it('should error when game not registered', () => {
      let err: unknown;
      service.loadLevel('wire-protocol', 'wp-01').subscribe({
        error: (e: unknown) => {
          err = e;
        },
      });
      expect(err).toBeInstanceOf(Error);
      expect((err as Error).message).toContain('Level not found');
    });
  });

  // --- loadLevelPack ---

  describe('loadLevelPack', () => {
    it('should return all levels for a registered game', () => {
      service.registerLevelPack(testLevelPack);

      let result: readonly LevelDefinition<unknown>[] | undefined;
      service.loadLevelPack('module-assembly').subscribe((levels) => {
        result = levels;
      });
      expect(result).toHaveLength(5);
    });

    it('should return empty array for unregistered game', () => {
      let result: readonly LevelDefinition<unknown>[] | undefined;
      let completed = false;
      service.loadLevelPack('wire-protocol').subscribe({
        next: (levels) => {
          result = levels;
        },
        complete: () => {
          completed = true;
        },
      });
      expect(result).toEqual([]);
      expect(completed).toBe(true);
    });
  });

  // --- getLevelsByTier ---

  describe('getLevelsByTier', () => {
    beforeEach(() => {
      service.registerLevelPack(testLevelPack);
    });

    it('should return only levels matching the given tier', () => {
      let result: readonly LevelDefinition<unknown>[] | undefined;
      service
        .getLevelsByTier('module-assembly', DifficultyTier.Basic)
        .subscribe((levels) => {
          result = levels;
        });
      expect(result).toHaveLength(2);
      expect(result!.every((l) => l.tier === DifficultyTier.Basic)).toBe(true);
    });

    it('should return empty array when no levels match tier', () => {
      // Create a pack with no Intermediate levels
      const basicOnlyPack: LevelPack = {
        gameId: 'wire-protocol',
        levels: [
          {
            levelId: 'wp-basic-01',
            gameId: 'wire-protocol',
            tier: DifficultyTier.Basic,
            order: 1,
            title: 'WP1',
            conceptIntroduced: 'c1',
            description: 'd1',
            data: {},
          },
        ],
      };
      service.registerLevelPack(basicOnlyPack);

      let result: readonly LevelDefinition<unknown>[] | undefined;
      service
        .getLevelsByTier('wire-protocol', DifficultyTier.Advanced)
        .subscribe((levels) => {
          result = levels;
        });
      expect(result).toEqual([]);
    });

    it('should return empty array for unregistered game', () => {
      let result: readonly LevelDefinition<unknown>[] | undefined;
      service
        .getLevelsByTier('flow-commander', DifficultyTier.Basic)
        .subscribe((levels) => {
          result = levels;
        });
      expect(result).toEqual([]);
    });
  });
});
