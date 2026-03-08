import {
  inject,
  provideAppInitializer,
  type EnvironmentProviders,
} from '@angular/core';
import { StoryMissionContentService } from '../../core/curriculum';
import type { StoryMissionContent } from '../../core/curriculum';

/**
 * Registers story mission content with StoryMissionContentService during
 * app initialization. Call once per phase in `app.config.ts` providers array.
 *
 * @example
 * providers: [
 *   provideMissionContent(PHASE_1_MISSIONS),
 * ]
 */
export function provideMissionContent(
  content: readonly StoryMissionContent[],
): EnvironmentProviders {
  return provideAppInitializer(() => {
    inject(StoryMissionContentService).registerContent([...content]);
  });
}
