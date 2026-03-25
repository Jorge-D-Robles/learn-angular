/**
 * Integration test: P2 level pack registration.
 *
 * Verifies that all 4 P2 minigame level packs (Module Assembly, Wire Protocol,
 * Flow Commander, Signal Corps) coexist correctly when registered simultaneously
 * via provideLevelData() in a single TestBed — no ID collisions, correct tier
 * distribution, and all 72 levels accessible.
 */
import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { DifficultyTier } from '../../core/minigame/minigame.types';
import type { MinigameId } from '../../core/minigame/minigame.types';
import { LevelLoaderService } from '../../core/levels/level-loader.service';
import { MODULE_ASSEMBLY_LEVEL_PACK } from './module-assembly.data';
import { WIRE_PROTOCOL_LEVEL_PACK } from './wire-protocol.data';
import { FLOW_COMMANDER_LEVEL_PACK } from './flow-commander.data';
import { SIGNAL_CORPS_LEVEL_PACK } from './signal-corps.data';
import { provideLevelData } from './provide-level-data';

const P2_GAME_IDS: MinigameId[] = [
  'module-assembly',
  'wire-protocol',
  'flow-commander',
  'signal-corps',
];

const LEVELS_PER_GAME = 18;
const TOTAL_P2_LEVELS = P2_GAME_IDS.length * LEVELS_PER_GAME; // 72

const EXPECTED_TIER_COUNTS: Record<DifficultyTier, number> = {
  [DifficultyTier.Basic]: 6,
  [DifficultyTier.Intermediate]: 6,
  [DifficultyTier.Advanced]: 5,
  [DifficultyTier.Boss]: 1,
};

// One known level ID per game for spot-check
const SAMPLE_LEVEL_IDS: Record<MinigameId, string> = {
  'module-assembly': 'ma-basic-01',
  'wire-protocol': 'wp-basic-01',
  'flow-commander': 'fc-basic-01',
  'signal-corps': 'sc-basic-01',
} as Record<MinigameId, string>;

describe('P2 level packs integration', () => {
  let levelLoader: LevelLoaderService;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideLevelData(MODULE_ASSEMBLY_LEVEL_PACK),
        provideLevelData(WIRE_PROTOCOL_LEVEL_PACK),
        provideLevelData(FLOW_COMMANDER_LEVEL_PACK),
        provideLevelData(SIGNAL_CORPS_LEVEL_PACK),
      ],
    });

    // provideAppInitializer is async — must await donePromise
    await TestBed.inject(ApplicationInitStatus).donePromise;
    levelLoader = TestBed.inject(LevelLoaderService);
  });

  it('should register all 4 P2 level packs', async () => {
    for (const gameId of P2_GAME_IDS) {
      const levels = await firstValueFrom(
        levelLoader.loadLevelPack(gameId),
      );
      expect(levels.length).toBeGreaterThan(0);
    }
  });

  it('should return 18 levels per game (72 total)', async () => {
    let total = 0;
    for (const gameId of P2_GAME_IDS) {
      const levels = await firstValueFrom(
        levelLoader.loadLevelPack(gameId),
      );
      expect(levels).toHaveLength(LEVELS_PER_GAME);
      total += levels.length;
    }
    expect(total).toBe(TOTAL_P2_LEVELS);
  });

  it('should return correct pack for each gameId', async () => {
    for (const gameId of P2_GAME_IDS) {
      const levels = await firstValueFrom(
        levelLoader.loadLevelPack(gameId),
      );
      for (const level of levels) {
        expect(level.gameId).toBe(gameId);
      }
    }
  });

  it('should have no level ID collisions across games', async () => {
    const allIds: string[] = [];
    for (const gameId of P2_GAME_IDS) {
      const levels = await firstValueFrom(
        levelLoader.loadLevelPack(gameId),
      );
      allIds.push(...levels.map((l) => l.levelId));
    }
    const uniqueIds = new Set(allIds);
    expect(uniqueIds.size).toBe(allIds.length);
  });

  it('should return 6 basic, 6 intermediate, 5 advanced, 1 boss per game', async () => {
    for (const gameId of P2_GAME_IDS) {
      for (const tier of Object.values(DifficultyTier)) {
        const levels = await firstValueFrom(
          levelLoader.getLevelsByTier(gameId, tier),
        );
        expect(levels.length).toBe(EXPECTED_TIER_COUNTS[tier]);
      }
    }
  });

  it('should load a specific level from each game by ID', async () => {
    for (const gameId of P2_GAME_IDS) {
      const levelId = SAMPLE_LEVEL_IDS[gameId];
      const level = await firstValueFrom(
        levelLoader.loadLevel(gameId, levelId),
      );
      expect(level.levelId).toBe(levelId);
      expect(level.gameId).toBe(gameId);
      expect(level.tier).toBe(DifficultyTier.Basic);
    }
  });

  it('should error when loading a non-existent level from a registered game', async () => {
    await expect(
      firstValueFrom(
        levelLoader.loadLevel('module-assembly', 'nonexistent'),
      ),
    ).rejects.toThrow('Level not found');
  });
});
