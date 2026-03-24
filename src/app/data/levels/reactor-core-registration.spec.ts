/**
 * Tests for Reactor Core level pack registration with LevelLoaderService.
 *
 * Mirrors provide-level-data.spec.ts but verifies Reactor Core game-specific
 * behavior: correct gameId, level count, and tier distribution.
 */
import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { DifficultyTier } from '../../core/minigame/minigame.types';
import { LevelLoaderService } from '../../core/levels/level-loader.service';
import { REACTOR_CORE_LEVEL_PACK } from './reactor-core.data';
import { provideLevelData } from './provide-level-data';

describe('Reactor Core level registration', () => {
  let levelLoader: LevelLoaderService;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideLevelData(REACTOR_CORE_LEVEL_PACK)],
    });

    await TestBed.inject(ApplicationInitStatus).donePromise;
    levelLoader = TestBed.inject(LevelLoaderService);
  });

  it('should register the reactor-core level pack at initialization', async () => {
    const levels = await firstValueFrom(
      levelLoader.loadLevelPack('reactor-core'),
    );
    expect(levels).toHaveLength(21);
  });

  it('should load a specific level by ID', async () => {
    const level = await firstValueFrom(
      levelLoader.loadLevel('reactor-core', 'rc-basic-01'),
    );
    expect(level.levelId).toBe('rc-basic-01');
    expect(level.gameId).toBe('reactor-core');
    expect(level.tier).toBe(DifficultyTier.Basic);
  });

  it('should return 7 basic levels', async () => {
    const levels = await firstValueFrom(
      levelLoader.getLevelsByTier('reactor-core', DifficultyTier.Basic),
    );
    expect(levels).toHaveLength(7);
  });

  it('should return 7 intermediate levels', async () => {
    const levels = await firstValueFrom(
      levelLoader.getLevelsByTier('reactor-core', DifficultyTier.Intermediate),
    );
    expect(levels).toHaveLength(7);
  });

  it('should return 6 advanced levels', async () => {
    const levels = await firstValueFrom(
      levelLoader.getLevelsByTier('reactor-core', DifficultyTier.Advanced),
    );
    expect(levels).toHaveLength(6);
  });

  it('should return 1 boss level', async () => {
    const levels = await firstValueFrom(
      levelLoader.getLevelsByTier('reactor-core', DifficultyTier.Boss),
    );
    expect(levels).toHaveLength(1);
  });
});
