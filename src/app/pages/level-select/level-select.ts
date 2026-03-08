import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';
import { TierBadgeComponent } from '../../shared/components/tier-badge/tier-badge';
import { LevelStarsComponent } from '../../shared/components/level-stars/level-stars';
import { LockedContentComponent } from '../../shared/components/locked-content/locked-content';
import { LevelLoaderService } from '../../core/levels/level-loader.service';
import { LevelProgressionService } from '../../core/levels/level-progression.service';
import { LEVEL_TIER_CONFIGS } from '../../core/levels/level.types';
import type { DifficultyTier, MinigameId } from '../../core/minigame/minigame.types';

type ReplayMode = 'story' | 'endless' | 'speedrun' | 'daily';

interface LevelViewModel {
  readonly levelId: string;
  readonly order: number;
  readonly title: string;
  readonly isLocked: boolean;
  readonly starRating: number;
  readonly bestScore: number | null;
}

interface TierGroup {
  readonly tier: DifficultyTier;
  readonly levels: readonly LevelViewModel[];
}

interface TabConfig {
  readonly mode: ReplayMode;
  readonly label: string;
}

const TABS: readonly TabConfig[] = [
  { mode: 'story', label: 'Story' },
  { mode: 'endless', label: 'Endless' },
  { mode: 'speedrun', label: 'Speed Run' },
  { mode: 'daily', label: 'Daily' },
];

const MODE_DESCRIPTIONS: Record<Exclude<ReplayMode, 'story'>, string> = {
  endless: 'Play infinitely with increasing difficulty. No level limit \u2014 how far can you go?',
  speedrun: 'Race through a fixed set of levels. Beat the par time for bonus XP.',
  daily: 'A unique challenge every day. Complete it for bonus rewards.',
};

@Component({
  selector: 'app-level-select',
  standalone: true,
  imports: [TierBadgeComponent, LevelStarsComponent, LockedContentComponent],
  template: `
    <h1>Level Select</h1>

    <div class="level-select__tabs" role="tablist">
      @for (tab of tabs; track tab.mode) {
        <button
          class="level-select__tab"
          [class.level-select__tab--active]="activeTab() === tab.mode"
          role="tab"
          [attr.aria-selected]="activeTab() === tab.mode"
          (click)="setTab(tab.mode)">
          {{ tab.label }}
        </button>
      }
    </div>

    @if (activeTab() === 'story') {
      @for (group of tierGroups(); track group.tier) {
        <section class="level-select__tier-group">
          <h2 class="level-select__tier-heading">
            <nx-tier-badge [tier]="group.tier" />
          </h2>
          @for (level of group.levels; track level.levelId) {
            <nx-locked-content
              [isLocked]="level.isLocked"
              [unlockMessage]="unlockMessage(group.tier)">
              <button
                class="level-select__level-btn"
                [disabled]="level.isLocked"
                (click)="onLevelClick(level)">
                <span class="level-select__level-order">{{ level.order }}</span>
                <span class="level-select__level-title">{{ level.title }}</span>
                <nx-level-stars [stars]="level.starRating" size="sm" />
                <span class="level-select__level-score">
                  {{ level.bestScore !== null ? level.bestScore : '--' }}
                </span>
              </button>
            </nx-locked-content>
          }
        </section>
      } @empty {
        <p class="level-select__empty">No levels available for this minigame.</p>
      }
    }

    @if (activeTab() !== 'story') {
      <div class="level-select__mode-launcher">
        <p class="level-select__mode-description">{{ modeDescription() }}</p>
        <button class="level-select__launch-btn" (click)="launchMode()">
          Launch {{ activeTabLabel() }}
        </button>
      </div>
    }
  `,
  styleUrl: './level-select.scss',
})
export class LevelSelectPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly levelLoader = inject(LevelLoaderService);
  private readonly levelProgression = inject(LevelProgressionService);

  readonly tabs = TABS;
  readonly activeTab = signal<ReplayMode>('story');

  readonly gameId = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('gameId') ?? '')),
    { initialValue: '' },
  );

  readonly tierGroups = computed<TierGroup[]>(() => {
    const gid = this.gameId();
    if (!gid) return [];

    // Synchronous subscribe -- loadLevelPack returns of() which emits immediately.
    // WARNING: If loadLevelPack is ever changed to return an async Observable,
    // this pattern will break. Same fragile pattern as LevelNavigationService.getSortedLevels().
    let levels: readonly import('../../core/levels/level.types').LevelDefinition<unknown>[] = [];
    this.levelLoader.loadLevelPack(gid as MinigameId).subscribe((l) => {
      levels = l;
    });

    return LEVEL_TIER_CONFIGS
      .map((config) => ({
        tier: config.tier,
        levels: levels
          .filter((l) => l.tier === config.tier)
          .sort((a, b) => a.order - b.order)
          .map((l): LevelViewModel => {
            const progress = this.levelProgression.getLevel(l.levelId);
            return {
              levelId: l.levelId,
              order: l.order,
              title: l.title,
              isLocked: !this.levelProgression.isLevelUnlocked(l.levelId),
              starRating: progress?.starRating ?? 0,
              bestScore: progress ? progress.bestScore : null,
            };
          }),
      }))
      .filter((group) => group.levels.length > 0);
  });

  readonly modeDescription = computed(() => {
    const tab = this.activeTab();
    if (tab === 'story') return '';
    return MODE_DESCRIPTIONS[tab];
  });

  readonly activeTabLabel = computed(() => {
    return TABS.find((t) => t.mode === this.activeTab())?.label ?? '';
  });

  setTab(mode: ReplayMode): void {
    this.activeTab.set(mode);
  }

  onLevelClick(level: LevelViewModel): void {
    if (!level.isLocked) {
      this.router.navigate(['/minigames', this.gameId(), 'level', level.levelId]);
    }
  }

  launchMode(): void {
    this.router.navigate(['/minigames', this.gameId(), this.activeTab()]);
  }

  unlockMessage(tier: DifficultyTier): string {
    return LEVEL_TIER_CONFIGS.find((c) => c.tier === tier)?.unlockRequirement ?? '';
  }
}
