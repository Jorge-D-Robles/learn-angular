/**
 * Integration test: Module Assembly level data end-to-end loading pipeline.
 *
 * Verifies: data file imported -> registered with LevelLoaderService ->
 * loadLevel() returns correct data -> loadLevelPack() returns all 18 levels
 * grouped by tier -> LevelProgressionService has entries for all 18 levels.
 */
import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { DifficultyTier } from '../../core/minigame/minigame.types';
import { LevelLoaderService } from '../../core/levels/level-loader.service';
import { LevelProgressionService } from '../../core/levels/level-progression.service';
import { MODULE_ASSEMBLY_LEVEL_PACK } from '../levels/module-assembly.data';
import { provideLevelData } from '../levels/provide-level-data';

const GAME_ID = 'module-assembly' as const;

const EXPECTED_TIER_COUNTS: Record<DifficultyTier, number> = {
  [DifficultyTier.Basic]: 6,
  [DifficultyTier.Intermediate]: 6,
  [DifficultyTier.Advanced]: 5,
  [DifficultyTier.Boss]: 1,
};

describe('Module Assembly pipeline integration', () => {
  let levelLoader: LevelLoaderService;
  let levelProgression: LevelProgressionService;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideLevelData(MODULE_ASSEMBLY_LEVEL_PACK)],
    });

    await TestBed.inject(ApplicationInitStatus).donePromise;
    levelLoader = TestBed.inject(LevelLoaderService);
    levelProgression = TestBed.inject(LevelProgressionService);
  });

  it('should load a single level by ID', async () => {
    const level = await firstValueFrom(
      levelLoader.loadLevel(GAME_ID, 'ma-basic-01'),
    );

    expect(level).toBeDefined();
    expect(level.levelId).toBe('ma-basic-01');
    expect(level.gameId).toBe(GAME_ID);
    expect(level.tier).toBe(DifficultyTier.Basic);
  });

  it('should return a valid LevelDefinition with non-empty data', async () => {
    const level = await firstValueFrom(
      levelLoader.loadLevel(GAME_ID, 'ma-basic-01'),
    );

    expect(level.data).toBeTruthy();
    expect(typeof level.data).toBe('object');
    // Module Assembly levels should have blueprint and parts
    const data = level.data as Record<string, unknown>;
    expect(data['blueprint']).toBeDefined();
    expect(data['parts']).toBeDefined();
  });

  it('should load all 18 levels via loadLevelPack', async () => {
    const levels = await firstValueFrom(
      levelLoader.loadLevelPack(GAME_ID),
    );

    expect(levels).toHaveLength(18);
  });

  it('should have correct tier distribution (6 basic, 6 intermediate, 5 advanced, 1 boss)', async () => {
    const levels = await firstValueFrom(
      levelLoader.loadLevelPack(GAME_ID),
    );

    for (const [tier, expectedCount] of Object.entries(EXPECTED_TIER_COUNTS)) {
      const tierLevels = levels.filter((l) => l.tier === tier);
      expect(tierLevels).toHaveLength(expectedCount);
    }
  });

  it('should have all 18 levels with non-empty data fields', async () => {
    const levels = await firstValueFrom(
      levelLoader.loadLevelPack(GAME_ID),
    );

    for (const level of levels) {
      expect(level.data).toBeTruthy();
      const data = level.data as Record<string, unknown>;
      expect(data['blueprint']).toBeDefined();
      expect(data['parts']).toBeDefined();
    }
  });

  it('should have entries in LevelProgressionService for all 18 levels', () => {
    const progress = levelProgression.getLevelProgress(GAME_ID);

    expect(progress).toHaveLength(18);
    for (const entry of progress) {
      expect(entry.levelId).toBeTruthy();
      expect(entry.completed).toBe(false);
      expect(entry.bestScore).toBe(0);
    }
  });

  it('should error on invalid levelId', async () => {
    await expect(
      firstValueFrom(levelLoader.loadLevel(GAME_ID, 'nonexistent-level')),
    ).rejects.toThrow('Level not found');
  });
});
