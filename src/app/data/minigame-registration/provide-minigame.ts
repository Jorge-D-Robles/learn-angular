import {
  inject,
  provideAppInitializer,
  type EnvironmentProviders,
  type Type,
} from '@angular/core';
import { MinigameRegistryService, DEFAULT_MINIGAME_CONFIGS } from '../../core/minigame/minigame-registry.service';
import type { MinigameEngine } from '../../core/minigame/minigame-engine';
import type { MinigameId } from '../../core/minigame/minigame.types';

/**
 * Registers a minigame component and engine factory with MinigameRegistryService
 * during app initialization. Call once per minigame in `app.config.ts` providers array.
 *
 * @example
 * providers: [
 *   provideMinigame('module-assembly', ModuleAssemblyComponent, () => new ModuleAssemblyEngine()),
 * ]
 */
export function provideMinigame(
  gameId: MinigameId,
  componentType: Type<any>,
  engineFactory: () => MinigameEngine<unknown>,
): EnvironmentProviders {
  const config = DEFAULT_MINIGAME_CONFIGS.find(c => c.id === gameId);
  if (!config) {
    throw new Error(`No default config found for minigame: ${gameId}`);
  }
  return provideAppInitializer(() => {
    const registry = inject(MinigameRegistryService);
    registry.register(config, componentType, engineFactory);
  });
}
