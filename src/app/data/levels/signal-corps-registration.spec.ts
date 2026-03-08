/**
 * Tests for Signal Corps level pack registration with LevelLoaderService.
 *
 * Mirrors provide-level-data.spec.ts but verifies Signal Corps game-specific
 * behavior: correct gameId, level count, and tier distribution.
 */
import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { DifficultyTier } from '../../core/minigame/minigame.types';
import { LevelLoaderService } from '../../core/levels/level-loader.service';
import { SIGNAL_CORPS_LEVEL_PACK } from './signal-corps.data';
import { provideLevelData } from './provide-level-data';

describe('Signal Corps level registration', () => {
  let levelLoader: LevelLoaderService;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideLevelData(SIGNAL_CORPS_LEVEL_PACK)],
    });

    await TestBed.inject(ApplicationInitStatus).donePromise;
    levelLoader = TestBed.inject(LevelLoaderService);
  });

  it('should register the signal-corps level pack at initialization', async () => {
    const levels = await firstValueFrom(
      levelLoader.loadLevelPack('signal-corps'),
    );
    expect(levels).toHaveLength(18);
  });

  it('should load a specific level by ID', async () => {
    const level = await firstValueFrom(
      levelLoader.loadLevel('signal-corps', 'sc-basic-01'),
    );
    expect(level.levelId).toBe('sc-basic-01');
    expect(level.gameId).toBe('signal-corps');
    expect(level.tier).toBe(DifficultyTier.Basic);
  });

  it('should return 6 basic levels', async () => {
    const levels = await firstValueFrom(
      levelLoader.getLevelsByTier('signal-corps', DifficultyTier.Basic),
    );
    expect(levels).toHaveLength(6);
  });

  it('should return 6 intermediate levels', async () => {
    const levels = await firstValueFrom(
      levelLoader.getLevelsByTier('signal-corps', DifficultyTier.Intermediate),
    );
    expect(levels).toHaveLength(6);
  });

  it('should return 5 advanced levels', async () => {
    const levels = await firstValueFrom(
      levelLoader.getLevelsByTier('signal-corps', DifficultyTier.Advanced),
    );
    expect(levels).toHaveLength(5);
  });

  it('should return 1 boss level', async () => {
    const levels = await firstValueFrom(
      levelLoader.getLevelsByTier('signal-corps', DifficultyTier.Boss),
    );
    expect(levels).toHaveLength(1);
  });
});
