/**
 * Tests for Terminal Hack level pack registration with LevelLoaderService.
 *
 * Mirrors provide-level-data.spec.ts but verifies Terminal Hack game-specific
 * behavior: correct gameId, level count, and tier distribution.
 */
import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { DifficultyTier } from '../../core/minigame/minigame.types';
import { LevelLoaderService } from '../../core/levels/level-loader.service';
import { TERMINAL_HACK_LEVEL_PACK } from './terminal-hack.data';
import { provideLevelData } from './provide-level-data';

describe('Terminal Hack level registration', () => {
  let levelLoader: LevelLoaderService;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideLevelData(TERMINAL_HACK_LEVEL_PACK)],
    });

    await TestBed.inject(ApplicationInitStatus).donePromise;
    levelLoader = TestBed.inject(LevelLoaderService);
  });

  it('should register the terminal-hack level pack at initialization', async () => {
    const levels = await firstValueFrom(
      levelLoader.loadLevelPack('terminal-hack'),
    );
    expect(levels).toHaveLength(21);
  });

  it('should load a specific level by ID', async () => {
    const level = await firstValueFrom(
      levelLoader.loadLevel('terminal-hack', 'th-basic-01'),
    );
    expect(level.levelId).toBe('th-basic-01');
    expect(level.gameId).toBe('terminal-hack');
    expect(level.tier).toBe(DifficultyTier.Basic);
  });

  it('should return 7 basic levels', async () => {
    const levels = await firstValueFrom(
      levelLoader.getLevelsByTier('terminal-hack', DifficultyTier.Basic),
    );
    expect(levels).toHaveLength(7);
  });

  it('should return 7 intermediate levels', async () => {
    const levels = await firstValueFrom(
      levelLoader.getLevelsByTier('terminal-hack', DifficultyTier.Intermediate),
    );
    expect(levels).toHaveLength(7);
  });

  it('should return 6 advanced levels', async () => {
    const levels = await firstValueFrom(
      levelLoader.getLevelsByTier('terminal-hack', DifficultyTier.Advanced),
    );
    expect(levels).toHaveLength(6);
  });

  it('should return 1 boss level', async () => {
    const levels = await firstValueFrom(
      levelLoader.getLevelsByTier('terminal-hack', DifficultyTier.Boss),
    );
    expect(levels).toHaveLength(1);
  });
});
