import { TestBed } from '@angular/core/testing';
import {
  DifficultyTier,
  type MinigameId,
  type MinigameResult,
} from '../minigame/minigame.types';
import { GameStateService } from '../state/game-state.service';
import type { LevelDefinition } from './level.types';
import { LevelProgressionService } from './level-progression.service';

// --- Test fixtures ---

const TEST_GAME_ID: MinigameId = 'module-assembly';

const testLevels: LevelDefinition<unknown>[] = [
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
];

function makeResult(overrides: Partial<MinigameResult> = {}): MinigameResult {
  return {
    gameId: TEST_GAME_ID,
    levelId: 'ma-basic-01',
    score: 100,
    perfect: false,
    timeElapsed: 30,
    xpEarned: 15,
    starRating: 1,
    ...overrides,
  };
}

describe('LevelProgressionService', () => {
  let service: LevelProgressionService;
  let addXpSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    TestBed.configureTestingModule({});

    const gameState = TestBed.inject(GameStateService);
    addXpSpy = vi.spyOn(gameState, 'addXp');

    service = TestBed.inject(LevelProgressionService);
  });

  // --- Initialization ---

  describe('Initialization', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should have empty progress by default', () => {
      expect(service.progress().size).toBe(0);
    });

    it('should register levels without creating progress entries', () => {
      service.registerLevels(testLevels);
      expect(service.progress().size).toBe(0);
    });
  });

  // --- Registration ---

  describe('Registration', () => {
    it('should deduplicate levels on re-registration', () => {
      service.registerLevels(testLevels);
      service.registerLevels(testLevels);

      // Verify via getLevelProgress count — 5 unique levels for this gameId
      const progress = service.getLevelProgress(TEST_GAME_ID);
      expect(progress.length).toBe(5);
    });
  });

  // --- Unlock logic ---

  describe('Unlock logic', () => {
    beforeEach(() => {
      service.registerLevels(testLevels);
    });

    it('should return true for Basic tier levels (always unlocked)', () => {
      expect(service.isLevelUnlocked('ma-basic-01')).toBe(true);
    });

    it('should return false for Intermediate when no Basic completed', () => {
      expect(service.isLevelUnlocked('ma-inter-01')).toBe(false);
    });

    it('should return false for Intermediate when only some Basic completed', () => {
      service.completeLevel(
        makeResult({ levelId: 'ma-basic-01', score: 100 }),
      );
      expect(service.isLevelUnlocked('ma-inter-01')).toBe(false);
    });

    it('should return true for Intermediate when all Basic completed', () => {
      service.completeLevel(
        makeResult({ levelId: 'ma-basic-01', score: 100 }),
      );
      service.completeLevel(
        makeResult({ levelId: 'ma-basic-02', score: 100 }),
      );
      expect(service.isLevelUnlocked('ma-inter-01')).toBe(true);
    });

    it('should return false for Advanced when Intermediate not completed', () => {
      service.completeLevel(
        makeResult({ levelId: 'ma-basic-01', score: 100 }),
      );
      service.completeLevel(
        makeResult({ levelId: 'ma-basic-02', score: 100 }),
      );
      expect(service.isLevelUnlocked('ma-adv-01')).toBe(false);
    });

    it('should return true for Advanced when all Intermediate completed', () => {
      service.completeLevel(
        makeResult({ levelId: 'ma-basic-01', score: 100 }),
      );
      service.completeLevel(
        makeResult({ levelId: 'ma-basic-02', score: 100 }),
      );
      service.completeLevel(
        makeResult({ levelId: 'ma-inter-01', score: 100 }),
      );
      expect(service.isLevelUnlocked('ma-adv-01')).toBe(true);
    });

    it('should return false for unknown levelId', () => {
      expect(service.isLevelUnlocked('nonexistent')).toBe(false);
    });
  });

  // --- completeLevel ---

  describe('completeLevel', () => {
    beforeEach(() => {
      service.registerLevels(testLevels);
    });

    it('should mark level as completed on first completion', () => {
      service.completeLevel(makeResult({ levelId: 'ma-basic-01' }));
      const level = service.getLevel('ma-basic-01');
      expect(level).not.toBeNull();
      expect(level!.completed).toBe(true);
    });

    it('should update best score when new score is higher', () => {
      service.completeLevel(
        makeResult({ levelId: 'ma-basic-01', score: 100 }),
      );
      service.completeLevel(
        makeResult({ levelId: 'ma-basic-01', score: 200 }),
      );
      expect(service.getLevel('ma-basic-01')!.bestScore).toBe(200);
    });

    it('should not decrease best score when new score is lower', () => {
      service.completeLevel(
        makeResult({ levelId: 'ma-basic-01', score: 200 }),
      );
      service.completeLevel(
        makeResult({ levelId: 'ma-basic-01', score: 100 }),
      );
      expect(service.getLevel('ma-basic-01')!.bestScore).toBe(200);
    });

    it('should track perfect as sticky', () => {
      service.completeLevel(
        makeResult({ levelId: 'ma-basic-01', perfect: true }),
      );
      service.completeLevel(
        makeResult({ levelId: 'ma-basic-01', perfect: false }),
      );
      expect(service.getLevel('ma-basic-01')!.perfect).toBe(true);
    });

    it('should increment attempts on each completion', () => {
      service.completeLevel(makeResult({ levelId: 'ma-basic-01' }));
      service.completeLevel(makeResult({ levelId: 'ma-basic-01' }));
      service.completeLevel(makeResult({ levelId: 'ma-basic-01' }));
      expect(service.getLevel('ma-basic-01')!.attempts).toBe(3);
    });

    it('should call gameState.addXp with xpEarned', () => {
      service.completeLevel(
        makeResult({ levelId: 'ma-basic-01', xpEarned: 25 }),
      );
      expect(addXpSpy).toHaveBeenCalledWith(25);
    });
  });

  // --- Star rating ---

  describe('Star rating', () => {
    beforeEach(() => {
      service.registerLevels(testLevels);
    });

    it('should update starRating when new rating is higher', () => {
      service.completeLevel(
        makeResult({ levelId: 'ma-basic-01', starRating: 2 }),
      );
      expect(service.getLevel('ma-basic-01')!.starRating).toBe(2);

      service.completeLevel(
        makeResult({ levelId: 'ma-basic-01', starRating: 3 }),
      );
      expect(service.getLevel('ma-basic-01')!.starRating).toBe(3);

      service.completeLevel(
        makeResult({ levelId: 'ma-basic-01', starRating: 1 }),
      );
      expect(service.getLevel('ma-basic-01')!.starRating).toBe(3);
    });
  });

  // --- getLevelProgress ---

  describe('getLevelProgress', () => {
    beforeEach(() => {
      service.registerLevels(testLevels);
    });

    it('should return progress for all levels in a minigame', () => {
      const progress = service.getLevelProgress(TEST_GAME_ID);
      expect(progress.length).toBe(5);
    });

    it('should return default progress for uncompleted levels', () => {
      const progress = service.getLevelProgress(TEST_GAME_ID);
      for (const entry of progress) {
        expect(entry.completed).toBe(false);
        expect(entry.bestScore).toBe(0);
        expect(entry.starRating).toBe(0);
        expect(entry.attempts).toBe(0);
      }
    });
  });

  // --- getTierProgress ---

  describe('getTierProgress', () => {
    beforeEach(() => {
      service.registerLevels(testLevels);
    });

    it('should return 0 when no levels completed', () => {
      expect(service.getTierProgress(TEST_GAME_ID, DifficultyTier.Basic)).toBe(
        0,
      );
    });

    it('should return 0.5 when half completed', () => {
      service.completeLevel(
        makeResult({ levelId: 'ma-basic-01', score: 100 }),
      );
      expect(service.getTierProgress(TEST_GAME_ID, DifficultyTier.Basic)).toBe(
        0.5,
      );
    });

    it('should return 1 when all completed', () => {
      service.completeLevel(
        makeResult({ levelId: 'ma-basic-01', score: 100 }),
      );
      service.completeLevel(
        makeResult({ levelId: 'ma-basic-02', score: 100 }),
      );
      expect(service.getTierProgress(TEST_GAME_ID, DifficultyTier.Basic)).toBe(
        1,
      );
    });
  });

  // --- getLevelDefinition ---

  describe('getLevelDefinition', () => {
    beforeEach(() => {
      service.registerLevels(testLevels);
    });

    it('should return definition for registered level', () => {
      const def = service.getLevelDefinition('ma-basic-01');
      expect(def).not.toBeNull();
      expect(def!.levelId).toBe('ma-basic-01');
      expect(def!.gameId).toBe(TEST_GAME_ID);
      expect(def!.tier).toBe(DifficultyTier.Basic);
    });

    it('should return null for unknown levelId', () => {
      expect(service.getLevelDefinition('nonexistent')).toBeNull();
    });
  });

  // --- resetProgress ---

  describe('resetProgress', () => {
    it('should reset progress signal to empty map', () => {
      service.registerLevels(testLevels);
      service.completeLevel(makeResult({ levelId: 'ma-basic-01' }));
      expect(service.progress().size).toBe(1);

      service.resetProgress();
      expect(service.progress().size).toBe(0);
    });
  });
});
