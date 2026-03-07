import { TestBed } from '@angular/core/testing';
import {
  DifficultyTier,
  type MinigameId,
  type MinigameResult,
} from '../minigame/minigame.types';
import type { LevelDefinition, LevelPack } from './level.types';
import { LevelLoaderService } from './level-loader.service';
import { LevelNavigationService } from './level-navigation.service';
import { LevelProgressionService } from './level-progression.service';

// --- Test fixtures ---

const TEST_GAME_ID: MinigameId = 'module-assembly';

function makeLevel(
  overrides: Partial<LevelDefinition<unknown>> & {
    levelId: string;
    tier: DifficultyTier;
    order: number;
  },
): LevelDefinition<unknown> {
  return {
    gameId: TEST_GAME_ID,
    title: overrides.levelId,
    conceptIntroduced: 'concept',
    description: 'desc',
    data: {},
    ...overrides,
  };
}

const testLevels: LevelDefinition<unknown>[] = [
  makeLevel({
    levelId: 'ma-basic-01',
    tier: DifficultyTier.Basic,
    order: 1,
  }),
  makeLevel({
    levelId: 'ma-basic-02',
    tier: DifficultyTier.Basic,
    order: 2,
  }),
  makeLevel({
    levelId: 'ma-inter-01',
    tier: DifficultyTier.Intermediate,
    order: 1,
  }),
  makeLevel({
    levelId: 'ma-inter-02',
    tier: DifficultyTier.Intermediate,
    order: 2,
  }),
  makeLevel({
    levelId: 'ma-adv-01',
    tier: DifficultyTier.Advanced,
    order: 1,
  }),
  makeLevel({
    levelId: 'ma-boss-01',
    tier: DifficultyTier.Boss,
    order: 1,
  }),
];

const testPack: LevelPack = {
  gameId: TEST_GAME_ID,
  levels: testLevels,
};

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

describe('LevelNavigationService', () => {
  let service: LevelNavigationService;
  let loader: LevelLoaderService;
  let progression: LevelProgressionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LevelNavigationService);
    loader = TestBed.inject(LevelLoaderService);
    progression = TestBed.inject(LevelProgressionService);
    loader.registerLevelPack(testPack);
  });

  // --- Initialization ---

  describe('Initialization', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });
  });

  // --- getNextLevel ---

  describe('getNextLevel', () => {
    it('should return the next level within the same tier', () => {
      const next = service.getNextLevel(TEST_GAME_ID, 'ma-basic-01');
      expect(next).not.toBeNull();
      expect(next!.levelId).toBe('ma-basic-02');
    });

    it('should return the first level of the next tier when at the end of a tier', () => {
      const next = service.getNextLevel(TEST_GAME_ID, 'ma-basic-02');
      expect(next).not.toBeNull();
      expect(next!.levelId).toBe('ma-inter-01');
    });

    it('should return null when at the last level (Boss)', () => {
      const next = service.getNextLevel(TEST_GAME_ID, 'ma-boss-01');
      expect(next).toBeNull();
    });

    it('should return null for unknown levelId', () => {
      const next = service.getNextLevel(TEST_GAME_ID, 'nonexistent');
      expect(next).toBeNull();
    });

    it('should return null for unregistered gameId', () => {
      const next = service.getNextLevel(
        'wire-protocol' as MinigameId,
        'wp-01',
      );
      expect(next).toBeNull();
    });
  });

  // --- getPreviousLevel ---

  describe('getPreviousLevel', () => {
    it('should return the previous level within the same tier', () => {
      const prev = service.getPreviousLevel(TEST_GAME_ID, 'ma-basic-02');
      expect(prev).not.toBeNull();
      expect(prev!.levelId).toBe('ma-basic-01');
    });

    it('should return the last level of the previous tier when at the start of a tier', () => {
      const prev = service.getPreviousLevel(TEST_GAME_ID, 'ma-inter-01');
      expect(prev).not.toBeNull();
      expect(prev!.levelId).toBe('ma-basic-02');
    });

    it('should return null when at the first level (Basic 01)', () => {
      const prev = service.getPreviousLevel(TEST_GAME_ID, 'ma-basic-01');
      expect(prev).toBeNull();
    });

    it('should return null for unknown levelId', () => {
      const prev = service.getPreviousLevel(TEST_GAME_ID, 'nonexistent');
      expect(prev).toBeNull();
    });
  });

  // --- isNextLevelUnlocked ---

  describe('isNextLevelUnlocked', () => {
    it('should return true when next level is Basic (always unlocked)', () => {
      // Basic 01's next is Basic 02, which is always unlocked
      expect(service.isNextLevelUnlocked(TEST_GAME_ID, 'ma-basic-01')).toBe(
        true,
      );
    });

    it('should return false when next level is in a higher tier and prerequisite tier is not completed', () => {
      // Basic 02's next is Intermediate 01, but not all Basic levels completed
      expect(service.isNextLevelUnlocked(TEST_GAME_ID, 'ma-basic-02')).toBe(
        false,
      );
    });

    it('should return true when next level is in a higher tier and prerequisite tier is completed', () => {
      // Complete both Basic levels
      progression.completeLevel(makeResult({ levelId: 'ma-basic-01' }));
      progression.completeLevel(makeResult({ levelId: 'ma-basic-02' }));

      // Now Intermediate 01 should be unlocked
      expect(service.isNextLevelUnlocked(TEST_GAME_ID, 'ma-basic-02')).toBe(
        true,
      );
    });

    it('should return false when there is no next level', () => {
      expect(service.isNextLevelUnlocked(TEST_GAME_ID, 'ma-boss-01')).toBe(
        false,
      );
    });

    it('should return false for unregistered gameId', () => {
      expect(
        service.isNextLevelUnlocked('wire-protocol' as MinigameId, 'wp-01'),
      ).toBe(false);
    });
  });

  // --- Ordering correctness ---

  describe('Ordering correctness', () => {
    it('should sort levels by tier then order regardless of registration order', () => {
      // Create a fresh TestBed with shuffled level order
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({});
      const freshLoader = TestBed.inject(LevelLoaderService);
      const freshService = TestBed.inject(LevelNavigationService);

      // Register levels in shuffled order
      const shuffledPack: LevelPack = {
        gameId: TEST_GAME_ID,
        levels: [
          testLevels[5], // Boss
          testLevels[3], // Inter-02
          testLevels[0], // Basic-01
          testLevels[4], // Adv-01
          testLevels[1], // Basic-02
          testLevels[2], // Inter-01
        ],
      };
      freshLoader.registerLevelPack(shuffledPack);

      // Walk the full chain: Basic-01 -> Basic-02 -> Inter-01 -> Inter-02 -> Adv-01 -> Boss-01 -> null
      let current = freshService.getNextLevel(TEST_GAME_ID, 'ma-basic-01');
      expect(current!.levelId).toBe('ma-basic-02');

      current = freshService.getNextLevel(TEST_GAME_ID, 'ma-basic-02');
      expect(current!.levelId).toBe('ma-inter-01');

      current = freshService.getNextLevel(TEST_GAME_ID, 'ma-inter-01');
      expect(current!.levelId).toBe('ma-inter-02');

      current = freshService.getNextLevel(TEST_GAME_ID, 'ma-inter-02');
      expect(current!.levelId).toBe('ma-adv-01');

      current = freshService.getNextLevel(TEST_GAME_ID, 'ma-adv-01');
      expect(current!.levelId).toBe('ma-boss-01');

      current = freshService.getNextLevel(TEST_GAME_ID, 'ma-boss-01');
      expect(current).toBeNull();
    });
  });
});
