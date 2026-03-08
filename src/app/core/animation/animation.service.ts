import { computed, inject, Injectable } from '@angular/core';
import { SettingsService } from '../settings/settings.service';
import { ANIMATION_DURATIONS, AnimationDurationKey } from './animations';

@Injectable({ providedIn: 'root' })
export class AnimationService {
  private readonly settings = inject(SettingsService);

  readonly isReducedMotion = computed(() => this.settings.settings().reducedMotion);

  getDuration(key: AnimationDurationKey): number {
    return this.isReducedMotion() ? 0 : ANIMATION_DURATIONS[key];
  }
}
