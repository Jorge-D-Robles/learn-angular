import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MinigameRegistryService } from '../../core/minigame/minigame-registry.service';
import { GameProgressionService } from '../../core/progression/game-progression.service';
import { MasteryService } from '../../core/progression/mastery.service';
import { LevelProgressionService } from '../../core/levels/level-progression.service';
import { ALL_STORY_MISSIONS } from '../../core/curriculum';
import { MasteryStarsComponent } from '../../shared/components/mastery-stars/mastery-stars';
import { LockedContentComponent } from '../../shared/components/locked-content/locked-content';
import type { MinigameConfig, MinigameId } from '../../core/minigame/minigame.types';

interface MinigameCardData {
  readonly config: MinigameConfig;
  readonly isUnlocked: boolean;
  readonly masteryStars: number;
  readonly levelsCompleted: number;
  readonly bestScore: number;
  readonly unlockMessage: string;
}

@Component({
  selector: 'app-minigame-hub',
  standalone: true,
  imports: [MasteryStarsComponent, LockedContentComponent],
  template: `
    <h1>Minigame Hub</h1>

    <div class="minigame-hub__filters">
      <select (change)="onTopicChange($event)">
        <option value="">All Topics</option>
        @for (topic of uniqueTopics(); track topic) {
          <option [value]="topic">{{ topic }}</option>
        }
      </select>
      <select (change)="onMasteryChange($event)">
        <option [value]="-1">All Mastery</option>
        @for (level of masteryLevels; track level) {
          <option [value]="level">{{ level }}+ Stars</option>
        }
      </select>
    </div>

    <div class="minigame-hub__grid">
      @for (game of filteredGames(); track game.config.id) {
        <div class="minigame-hub__card"
             [class.minigame-hub__card--unlocked]="game.isUnlocked"
             [tabindex]="game.isUnlocked ? 0 : -1"
             role="button"
             (click)="onCardClick(game)"
             (keydown.enter)="onCardClick(game)">
          <nx-locked-content [isLocked]="!game.isUnlocked" [unlockMessage]="game.unlockMessage">
            <h3 class="minigame-hub__card-name">{{ game.config.name }}</h3>
            <span class="minigame-hub__card-topic">{{ game.config.angularTopic }}</span>
            <nx-mastery-stars [stars]="game.masteryStars" size="sm" />
            <div class="minigame-hub__card-stats">
              <span>{{ game.levelsCompleted }} / {{ game.config.totalLevels }} levels</span>
              <span>Best: {{ game.bestScore }}</span>
            </div>
          </nx-locked-content>
        </div>
      } @empty {
        <p class="minigame-hub__empty">No minigames match the selected filters.</p>
      }
    </div>
  `,
  styleUrl: './minigame-hub.scss',
})
export class MinigameHubPage {
  private readonly router = inject(Router);
  private readonly registry = inject(MinigameRegistryService);
  private readonly gameProgression = inject(GameProgressionService);
  private readonly mastery = inject(MasteryService);
  private readonly levelProgression = inject(LevelProgressionService);

  readonly topicFilter = signal<string>('');
  readonly masteryFilter = signal<number>(-1);
  readonly masteryLevels = [0, 1, 2, 3, 4, 5];

  readonly allGames = computed<MinigameCardData[]>(() => {
    const games = this.registry.getAllGames();
    return games.map(config => this.buildCardData(config));
  });

  readonly uniqueTopics = computed<string[]>(() => {
    const topics = this.allGames().map(g => g.config.angularTopic);
    return [...new Set(topics)].sort();
  });

  readonly filteredGames = computed<MinigameCardData[]>(() => {
    const topic = this.topicFilter();
    const minMastery = this.masteryFilter();
    return this.allGames().filter(game => {
      if (topic && game.config.angularTopic !== topic) return false;
      if (game.masteryStars < minMastery) return false;
      return true;
    });
  });

  onTopicChange(event: Event): void {
    this.topicFilter.set((event.target as HTMLSelectElement).value);
  }

  onMasteryChange(event: Event): void {
    this.masteryFilter.set(+(event.target as HTMLSelectElement).value);
  }

  onCardClick(game: MinigameCardData): void {
    if (game.isUnlocked) {
      this.router.navigate(['/minigames', game.config.id]);
    }
  }

  private buildCardData(config: MinigameConfig): MinigameCardData {
    const gameId = config.id;
    const isUnlocked = this.gameProgression.isMinigameUnlocked(gameId);
    const masteryStars = this.mastery.getMastery(gameId);
    const progress = this.levelProgression.getLevelProgress(gameId);
    const levelsCompleted = progress.filter(l => l.completed).length;
    const bestScore = progress.length > 0
      ? Math.max(0, ...progress.map(l => l.bestScore))
      : 0;
    const unlockMessage = this.deriveUnlockMessage(gameId);

    return { config, isUnlocked, masteryStars, levelsCompleted, bestScore, unlockMessage };
  }

  private deriveUnlockMessage(gameId: MinigameId): string {
    const mission = ALL_STORY_MISSIONS.find(m => m.unlocksMinigame === gameId);
    return mission ? `Complete mission: ${mission.title}` : 'Locked';
  }
}
