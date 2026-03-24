/**
 * Tests for Deep Space Radio level pack registration with LevelLoaderService.
 *
 * Mirrors provide-level-data.spec.ts but verifies Deep Space Radio game-specific
 * behavior: correct gameId, level count, and tier distribution.
 */
import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { DifficultyTier } from '../../core/minigame/minigame.types';
import { LevelLoaderService } from '../../core/levels/level-loader.service';
import { DEEP_SPACE_RADIO_LEVEL_PACK } from './deep-space-radio.data';
import { provideLevelData } from './provide-level-data';

describe('Deep Space Radio level registration', () => {
  let levelLoader: LevelLoaderService;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideLevelData(DEEP_SPACE_RADIO_LEVEL_PACK)],
    });

    await TestBed.inject(ApplicationInitStatus).donePromise;
    levelLoader = TestBed.inject(LevelLoaderService);
  });

  it('should register the deep-space-radio level pack at initialization', async () => {
    const levels = await firstValueFrom(
      levelLoader.loadLevelPack('deep-space-radio'),
    );
    expect(levels).toHaveLength(18);
  });

  it('should load a specific level by ID', async () => {
    const level = await firstValueFrom(
      levelLoader.loadLevel('deep-space-radio', 'dsr-basic-01'),
    );
    expect(level.levelId).toBe('dsr-basic-01');
    expect(level.gameId).toBe('deep-space-radio');
    expect(level.tier).toBe(DifficultyTier.Basic);
  });

  it('should return 6 basic levels', async () => {
    const levels = await firstValueFrom(
      levelLoader.getLevelsByTier('deep-space-radio', DifficultyTier.Basic),
    );
    expect(levels).toHaveLength(6);
  });

  it('should return 6 intermediate levels', async () => {
    const levels = await firstValueFrom(
      levelLoader.getLevelsByTier('deep-space-radio', DifficultyTier.Intermediate),
    );
    expect(levels).toHaveLength(6);
  });

  it('should return 5 advanced levels', async () => {
    const levels = await firstValueFrom(
      levelLoader.getLevelsByTier('deep-space-radio', DifficultyTier.Advanced),
    );
    expect(levels).toHaveLength(5);
  });

  it('should return 1 boss level', async () => {
    const levels = await firstValueFrom(
      levelLoader.getLevelsByTier('deep-space-radio', DifficultyTier.Boss),
    );
    expect(levels).toHaveLength(1);
  });
});
