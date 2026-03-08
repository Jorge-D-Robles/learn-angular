/**
 * Tests for provideLevelData() — registers a LevelPack with LevelLoaderService
 * during app initialization via provideAppInitializer.
 *
 * API note: The ticket AC mentions getLevelPack() but the actual
 * LevelLoaderService API is loadLevelPack(). Tests use the real method name.
 */
import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { DifficultyTier } from '../../core/minigame/minigame.types';
import { LevelLoaderService } from '../../core/levels/level-loader.service';
import { MODULE_ASSEMBLY_LEVEL_PACK } from './module-assembly.data';
import { provideLevelData } from './provide-level-data';

describe('provideLevelData', () => {
  let levelLoader: LevelLoaderService;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideLevelData(MODULE_ASSEMBLY_LEVEL_PACK)],
    });

    // provideAppInitializer is async — must await donePromise
    await TestBed.inject(ApplicationInitStatus).donePromise;
    levelLoader = TestBed.inject(LevelLoaderService);
  });

  it('should register the level pack at initialization', async () => {
    const levels = await firstValueFrom(
      levelLoader.loadLevelPack('module-assembly'),
    );
    expect(levels).toHaveLength(18);
  });

  it('should load a specific level by ID', async () => {
    const level = await firstValueFrom(
      levelLoader.loadLevel('module-assembly', 'ma-basic-01'),
    );
    expect(level.levelId).toBe('ma-basic-01');
    expect(level.gameId).toBe('module-assembly');
    expect(level.tier).toBe(DifficultyTier.Basic);
  });

  it('should return 6 basic levels', async () => {
    const levels = await firstValueFrom(
      levelLoader.getLevelsByTier('module-assembly', DifficultyTier.Basic),
    );
    expect(levels).toHaveLength(6);
  });

  it('should return 6 intermediate levels', async () => {
    const levels = await firstValueFrom(
      levelLoader.getLevelsByTier(
        'module-assembly',
        DifficultyTier.Intermediate,
      ),
    );
    expect(levels).toHaveLength(6);
  });

  it('should return 5 advanced levels', async () => {
    const levels = await firstValueFrom(
      levelLoader.getLevelsByTier('module-assembly', DifficultyTier.Advanced),
    );
    expect(levels).toHaveLength(5);
  });

  it('should return 1 boss level', async () => {
    const levels = await firstValueFrom(
      levelLoader.getLevelsByTier('module-assembly', DifficultyTier.Boss),
    );
    expect(levels).toHaveLength(1);
  });

  it('should error when loading a non-existent level ID', async () => {
    await expect(
      firstValueFrom(
        levelLoader.loadLevel('module-assembly', 'nonexistent'),
      ),
    ).rejects.toThrow('Level not found');
  });

  it('should be idempotent when provided multiple times', async () => {
    // Create a second TestBed with double registration
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideLevelData(MODULE_ASSEMBLY_LEVEL_PACK),
        provideLevelData(MODULE_ASSEMBLY_LEVEL_PACK),
      ],
    });
    await TestBed.inject(ApplicationInitStatus).donePromise;
    const loader = TestBed.inject(LevelLoaderService);

    const levels = await firstValueFrom(
      loader.loadLevelPack('module-assembly'),
    );
    expect(levels).toHaveLength(18);
  });
});
