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
 * Registers a minigame engine factory (with null component) during app initialization.
 * Use when the engine exists but the UI component is not yet built.
 * When the UI component is ready, use provideMinigame() which will re-register
 * with both component and engine. IMPORTANT: List provideMinigameEngine() calls
 * BEFORE provideMinigame() calls for the same gameId in app.config.ts, so the
 * full registration overwrites the engine-only one.
 */
export function provideMinigameEngine(
  gameId: MinigameId,
  engineFactory: () => MinigameEngine<unknown>,
): EnvironmentProviders {
  const config = DEFAULT_MINIGAME_CONFIGS.find(c => c.id === gameId);
  if (!config) {
    throw new Error(`No default config found for minigame: ${gameId}`);
  }
  return provideAppInitializer(() => {
    const registry = inject(MinigameRegistryService);
    registry.register(config, null, engineFactory);
  });
}

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
