/**
 * Tests for Flow Commander level pack registration with LevelLoaderService.
 *
 * Mirrors provide-level-data.spec.ts but verifies Flow Commander game-specific
 * behavior: correct gameId, level count, and tier distribution.
 */
import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { DifficultyTier } from '../../core/minigame/minigame.types';
import { LevelLoaderService } from '../../core/levels/level-loader.service';
import { FLOW_COMMANDER_LEVEL_PACK } from './flow-commander.data';
import { provideLevelData } from './provide-level-data';

describe('Flow Commander level registration', () => {
  let levelLoader: LevelLoaderService;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideLevelData(FLOW_COMMANDER_LEVEL_PACK)],
    });

    await TestBed.inject(ApplicationInitStatus).donePromise;
    levelLoader = TestBed.inject(LevelLoaderService);
  });

  it('should register the flow-commander level pack at initialization', async () => {
    const levels = await firstValueFrom(
      levelLoader.loadLevelPack('flow-commander'),
    );
    expect(levels).toHaveLength(18);
  });

  it('should load a specific level by ID', async () => {
    const level = await firstValueFrom(
      levelLoader.loadLevel('flow-commander', 'fc-basic-01'),
    );
    expect(level.levelId).toBe('fc-basic-01');
    expect(level.gameId).toBe('flow-commander');
    expect(level.tier).toBe(DifficultyTier.Basic);
  });

  it('should return 6 basic levels', async () => {
    const levels = await firstValueFrom(
      levelLoader.getLevelsByTier('flow-commander', DifficultyTier.Basic),
    );
    expect(levels).toHaveLength(6);
  });

  it('should return 6 intermediate levels', async () => {
    const levels = await firstValueFrom(
      levelLoader.getLevelsByTier('flow-commander', DifficultyTier.Intermediate),
    );
    expect(levels).toHaveLength(6);
  });

  it('should return 5 advanced levels', async () => {
    const levels = await firstValueFrom(
      levelLoader.getLevelsByTier('flow-commander', DifficultyTier.Advanced),
    );
    expect(levels).toHaveLength(5);
  });

  it('should return 1 boss level', async () => {
    const levels = await firstValueFrom(
      levelLoader.getLevelsByTier('flow-commander', DifficultyTier.Boss),
    );
    expect(levels).toHaveLength(1);
  });
});
