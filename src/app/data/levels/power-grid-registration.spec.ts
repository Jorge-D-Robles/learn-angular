/**
 * Tests for Power Grid level pack registration with LevelLoaderService.
 *
 * Mirrors provide-level-data.spec.ts but verifies Power Grid game-specific
 * behavior: correct gameId, level count, and tier distribution.
 */
import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { DifficultyTier } from '../../core/minigame/minigame.types';
import { LevelLoaderService } from '../../core/levels/level-loader.service';
import { POWER_GRID_LEVEL_PACK } from './power-grid.data';
import { provideLevelData } from './provide-level-data';

describe('Power Grid level registration', () => {
  let levelLoader: LevelLoaderService;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideLevelData(POWER_GRID_LEVEL_PACK)],
    });

    await TestBed.inject(ApplicationInitStatus).donePromise;
    levelLoader = TestBed.inject(LevelLoaderService);
  });

  it('should register the power-grid level pack at initialization', async () => {
    const levels = await firstValueFrom(
      levelLoader.loadLevelPack('power-grid'),
    );
    expect(levels).toHaveLength(18);
  });

  it('should load a specific level by ID', async () => {
    const level = await firstValueFrom(
      levelLoader.loadLevel('power-grid', 'pg-basic-01'),
    );
    expect(level.levelId).toBe('pg-basic-01');
    expect(level.gameId).toBe('power-grid');
    expect(level.tier).toBe(DifficultyTier.Basic);
  });

  it('should return 6 basic levels', async () => {
    const levels = await firstValueFrom(
      levelLoader.getLevelsByTier('power-grid', DifficultyTier.Basic),
    );
    expect(levels).toHaveLength(6);
  });

  it('should return 6 intermediate levels', async () => {
    const levels = await firstValueFrom(
      levelLoader.getLevelsByTier('power-grid', DifficultyTier.Intermediate),
    );
    expect(levels).toHaveLength(6);
  });

  it('should return 5 advanced levels', async () => {
    const levels = await firstValueFrom(
      levelLoader.getLevelsByTier('power-grid', DifficultyTier.Advanced),
    );
    expect(levels).toHaveLength(5);
  });

  it('should return 1 boss level', async () => {
    const levels = await firstValueFrom(
      levelLoader.getLevelsByTier('power-grid', DifficultyTier.Boss),
    );
    expect(levels).toHaveLength(1);
  });
});
