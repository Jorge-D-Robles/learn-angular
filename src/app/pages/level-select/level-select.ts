import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';
import { TierBadgeComponent } from '../../shared/components/tier-badge/tier-badge';
import { LevelCardComponent } from '../../shared/components/level-card/level-card';
import { LeaderboardComponent } from '../../shared/components/leaderboard/leaderboard';
import { LevelLoaderService } from '../../core/levels/level-loader.service';
import { LevelProgressionService } from '../../core/levels/level-progression.service';
import { LEVEL_TIER_CONFIGS } from '../../core/levels/level.types';
import { PlayMode, type DifficultyTier, type MinigameId } from '../../core/minigame/minigame.types';

interface LevelViewModel {
  readonly levelId: string;
  readonly order: number;
  readonly title: string;
  readonly isLocked: boolean;
  readonly starRating: number;
  readonly bestScore: number | null;
  readonly isCurrent: boolean;
}

interface TierGroup {
  readonly tier: DifficultyTier;
  readonly levels: readonly LevelViewModel[];
}

interface TabConfig {
  readonly mode: PlayMode | 'leaderboard';
  readonly label: string;
  readonly routeSlug: string;
}

const TABS: readonly TabConfig[] = [
  { mode: PlayMode.Story, label: 'Story', routeSlug: 'story' },
  { mode: PlayMode.Endless, label: 'Endless', routeSlug: 'endless' },
  { mode: PlayMode.SpeedRun, label: 'Speed Run', routeSlug: 'speedrun' },
  { mode: PlayMode.DailyChallenge, label: 'Daily', routeSlug: 'daily' },
  { mode: 'leaderboard' as const, label: 'Leaderboard', routeSlug: 'leaderboard' },
];

const MODE_DESCRIPTIONS: Record<Exclude<PlayMode, PlayMode.Story>, string> = {
  [PlayMode.Endless]: 'Play infinitely with increasing difficulty. No level limit \u2014 how far can you go?',
  [PlayMode.SpeedRun]: 'Race through a fixed set of levels. Beat the par time for bonus XP.',
  [PlayMode.DailyChallenge]: 'A unique challenge every day. Complete it for bonus rewards.',
};

@Component({
  selector: 'app-level-select',
  standalone: true,
  imports: [TierBadgeComponent, LevelCardComponent, LeaderboardComponent],
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

    @if (activeTab() === PlayMode.Story) {
      @for (group of tierGroups(); track group.tier) {
        <section class="level-select__tier-group">
          <h2 class="level-select__tier-heading">
            <nx-tier-badge [tier]="group.tier" />
          </h2>
          @for (level of group.levels; track level.levelId) {
            <nx-level-card
              [levelId]="level.levelId"
              [levelNumber]="level.order"
              [levelTitle]="level.title"
              [starRating]="level.starRating"
              [bestScore]="level.bestScore"
              [isLocked]="level.isLocked"
              [isCurrent]="level.isCurrent"
              (levelClicked)="onLevelClick($event)" />
          }
        </section>
      } @empty {
        <p class="level-select__empty">No levels available for this minigame.</p>
      }
    }

    @if (activeTab() === 'leaderboard') {
      <div class="level-select__leaderboard">
        <nx-leaderboard [gameId]="$any(gameId())" />
      </div>
    }

    @if (activeTab() !== PlayMode.Story && activeTab() !== 'leaderboard') {
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

  readonly PlayMode = PlayMode;
  readonly tabs = TABS;
  readonly activeTab = signal<PlayMode | 'leaderboard'>(PlayMode.Story);

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

    // Compute the current level: first unlocked, uncompleted level in canonical order.
    const sortedAll = [...levels].sort((a, b) => {
      const tierIndexA = LEVEL_TIER_CONFIGS.findIndex((c) => c.tier === a.tier);
      const tierIndexB = LEVEL_TIER_CONFIGS.findIndex((c) => c.tier === b.tier);
      return tierIndexA !== tierIndexB ? tierIndexA - tierIndexB : a.order - b.order;
    });
    const currentLevel = sortedAll.find((l) => {
      const progress = this.levelProgression.getLevel(l.levelId);
      return !progress?.completed;
    });
    const currentLevelId = currentLevel?.levelId ?? null;

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
              isCurrent: l.levelId === currentLevelId,
            };
          }),
      }))
      .filter((group) => group.levels.length > 0);
  });

  readonly modeDescription = computed(() => {
    const tab = this.activeTab();
    if (tab === PlayMode.Story || tab === 'leaderboard') return '';
    return MODE_DESCRIPTIONS[tab];
  });

  readonly activeTabLabel = computed(() => {
    return TABS.find((t) => t.mode === this.activeTab())?.label ?? '';
  });

  setTab(mode: PlayMode | 'leaderboard'): void {
    this.activeTab.set(mode);
  }

  onLevelClick(levelId: string): void {
    this.router.navigate(['/minigames', this.gameId(), 'level', levelId]);
  }

  launchMode(): void {
    if (this.activeTab() === 'leaderboard') return;
    const tab = TABS.find((t) => t.mode === this.activeTab());
    if (tab) {
      this.router.navigate(['/minigames', this.gameId(), tab.routeSlug]);
    }
  }
}
