/**
 * Tests for Corridor Runner level pack registration with LevelLoaderService.
 *
 * Mirrors provide-level-data.spec.ts but verifies Corridor Runner game-specific
 * behavior: correct gameId, level count, and tier distribution.
 */
import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { DifficultyTier } from '../../core/minigame/minigame.types';
import { LevelLoaderService } from '../../core/levels/level-loader.service';
import { CORRIDOR_RUNNER_LEVEL_PACK } from './corridor-runner.data';
import { provideLevelData } from './provide-level-data';

describe('Corridor Runner level registration', () => {
  let levelLoader: LevelLoaderService;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideLevelData(CORRIDOR_RUNNER_LEVEL_PACK)],
    });

    await TestBed.inject(ApplicationInitStatus).donePromise;
    levelLoader = TestBed.inject(LevelLoaderService);
  });

  it('should register the corridor-runner level pack at initialization', async () => {
    const levels = await firstValueFrom(
      levelLoader.loadLevelPack('corridor-runner'),
    );
    expect(levels).toHaveLength(18);
  });

  it('should load a specific level by ID', async () => {
    const level = await firstValueFrom(
      levelLoader.loadLevel('corridor-runner', 'cr-basic-01'),
    );
    expect(level.levelId).toBe('cr-basic-01');
    expect(level.gameId).toBe('corridor-runner');
    expect(level.tier).toBe(DifficultyTier.Basic);
  });

  it('should return 6 basic levels', async () => {
    const levels = await firstValueFrom(
      levelLoader.getLevelsByTier('corridor-runner', DifficultyTier.Basic),
    );
    expect(levels).toHaveLength(6);
  });

  it('should return 6 intermediate levels', async () => {
    const levels = await firstValueFrom(
      levelLoader.getLevelsByTier('corridor-runner', DifficultyTier.Intermediate),
    );
    expect(levels).toHaveLength(6);
  });

  it('should return 5 advanced levels', async () => {
    const levels = await firstValueFrom(
      levelLoader.getLevelsByTier('corridor-runner', DifficultyTier.Advanced),
    );
    expect(levels).toHaveLength(5);
  });

  it('should return 1 boss level', async () => {
    const levels = await firstValueFrom(
      levelLoader.getLevelsByTier('corridor-runner', DifficultyTier.Boss),
    );
    expect(levels).toHaveLength(1);
  });
});
