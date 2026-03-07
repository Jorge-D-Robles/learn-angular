import { Component, computed, input } from '@angular/core';
import { DifficultyTier } from '../../../core/minigame/minigame.types';

const TIER_LABELS: Record<DifficultyTier, string> = {
  [DifficultyTier.Basic]: 'Basic',
  [DifficultyTier.Intermediate]: 'Intermediate',
  [DifficultyTier.Advanced]: 'Advanced',
  [DifficultyTier.Boss]: 'Boss',
};

@Component({
  selector: 'nx-tier-badge',
  template: `{{ label() }}`,
  styleUrl: './tier-badge.scss',
  host: {
    'role': 'img',
    '[attr.aria-label]': 'ariaLabel()',
    '[class.tier-badge--basic]': 'tier() === "basic"',
    '[class.tier-badge--intermediate]': 'tier() === "intermediate"',
    '[class.tier-badge--advanced]': 'tier() === "advanced"',
    '[class.tier-badge--boss]': 'tier() === "boss"',
    '[class.tier-badge--sm]': 'size() === "sm"',
    '[class.tier-badge--md]': 'size() === "md"',
  },
})
export class TierBadgeComponent {
  readonly tier = input.required<DifficultyTier>();
  readonly size = input<'sm' | 'md'>('md');

  readonly label = computed(() => TIER_LABELS[this.tier()]);
  readonly ariaLabel = computed(() => `${this.label()} difficulty`);
}
