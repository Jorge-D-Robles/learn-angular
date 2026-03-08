import { computed, inject, Injectable } from '@angular/core';
import { AnimationSpeed, SettingsService } from '../settings/settings.service';
import { ANIMATION_DURATIONS, AnimationDurationKey } from './animations';

const SPEED_MULTIPLIERS: Record<AnimationSpeed, number> = {
  normal: 1,
  fast: 0.5,
  off: 0,
};

@Injectable({ providedIn: 'root' })
export class AnimationService {
  private readonly settings = inject(SettingsService);

  readonly isReducedMotion = computed(() => this.settings.settings().reducedMotion);

  getDuration(key: AnimationDurationKey): number {
    if (this.isReducedMotion()) {
      return 0;
    }
    return ANIMATION_DURATIONS[key] * SPEED_MULTIPLIERS[this.settings.settings().animationSpeed];
  }
}
