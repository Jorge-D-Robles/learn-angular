import { Component, computed, inject } from '@angular/core';
import {
  CosmeticService,
  type CosmeticItem,
} from '../../../core/progression/cosmetic.service';
import type { CosmeticType } from '../../../data/cosmetics.data';

const COSMETIC_TYPES: readonly CosmeticType[] = ['skin', 'theme', 'badge'];

const TYPE_LABELS: Record<CosmeticType, string> = {
  skin: 'Station Skins',
  theme: 'Themes',
  badge: 'Badges',
};

@Component({
  selector: 'nx-cosmetic-gallery',
  template: `
    @for (type of types; track type) {
      @if (cosmeticsByType()[type]?.length) {
        <section class="cosmetic-gallery__section">
          <h3 class="cosmetic-gallery__heading">{{ typeLabels[type] }}</h3>
          <div class="cosmetic-gallery__grid">
            @for (item of cosmeticsByType()[type]; track item.id) {
              <div
                class="cosmetic-gallery__item"
                [class.cosmetic-gallery__item--locked]="!item.isUnlocked"
                [class.cosmetic-gallery__item--equipped]="equippedByType()[item.type]?.id === item.id"
                [attr.aria-label]="item.name + (item.isUnlocked ? '' : ' (locked)')">
                <span class="cosmetic-gallery__item-name">{{ item.name }}</span>
                @if (!item.isUnlocked) {
                  <span class="cosmetic-gallery__lock-condition">{{ item.unlockCondition }}</span>
                } @else if (equippedByType()[item.type]?.id === item.id) {
                  <span class="cosmetic-gallery__equipped">Equipped</span>
                } @else {
                  <button
                    class="cosmetic-gallery__equip-btn"
                    [attr.aria-label]="'Equip ' + item.name"
                    (click)="equip(item.id)">
                    Equip
                  </button>
                }
              </div>
            }
          </div>
        </section>
      }
    }
  `,
  styleUrl: './cosmetic-gallery.scss',
  host: {
    'role': 'region',
    'aria-label': 'Cosmetic gallery',
  },
})
export class CosmeticGalleryComponent {
  private readonly cosmeticService = inject(CosmeticService);

  protected readonly types = COSMETIC_TYPES;
  protected readonly typeLabels = TYPE_LABELS;

  readonly cosmeticsByType = computed(() => {
    const all = this.cosmeticService.getAllCosmetics();
    const grouped: Record<CosmeticType, CosmeticItem[]> = {
      skin: [],
      theme: [],
      badge: [],
    };
    for (const item of all) {
      grouped[item.type].push(item);
    }
    return grouped;
  });

  readonly equippedByType = computed((): Record<CosmeticType, CosmeticItem | null> => {
    return {
      skin: this.cosmeticService.getEquipped('skin'),
      theme: this.cosmeticService.getEquipped('theme'),
      badge: this.cosmeticService.getEquipped('badge'),
    };
  });

  equip(id: string): void {
    this.cosmeticService.equipCosmetic(id);
  }
}
