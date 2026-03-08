import {
  inject,
  provideAppInitializer,
  type EnvironmentProviders,
} from '@angular/core';
import { LevelLoaderService } from '../../core/levels/level-loader.service';
import type { LevelPack } from '../../core/levels/level.types';

/**
 * Registers a level pack with LevelLoaderService during app initialization.
 * Call once per minigame in `app.config.ts` providers array.
 *
 * @example
 * providers: [
 *   provideLevelData(MODULE_ASSEMBLY_LEVEL_PACK),
 * ]
 */
export function provideLevelData(pack: LevelPack): EnvironmentProviders {
  return provideAppInitializer(() => {
    inject(LevelLoaderService).registerLevelPack(pack);
  });
}
