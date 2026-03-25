import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MinigameRegistryService } from '../../core/minigame/minigame-registry.service';
import { GameProgressionService } from '../../core/progression/game-progression.service';
import { MasteryService } from '../../core/progression/mastery.service';
import { LevelProgressionService } from '../../core/levels/level-progression.service';
import { ALL_STORY_MISSIONS } from '../../core/curriculum';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state';
import { MinigameCardComponent } from '../../shared/components/minigame-card/minigame-card';
import type { MinigameConfig, MinigameId } from '../../core/minigame/minigame.types';

interface MinigameCardData {
  readonly config: MinigameConfig;
  readonly isUnlocked: boolean;
  readonly masteryStars: number;
  readonly levelsCompleted: number;
  readonly unlockMessage: string;
}

@Component({
  selector: 'app-minigame-hub',
  standalone: true,
  imports: [EmptyStateComponent, MinigameCardComponent],
  template: `
    <h1>Minigame Hub</h1>
    @if (hasUnlockedGames()) {
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
        @if (hasActiveFilters()) {
          <button type="button" class="minigame-hub__clear-filters" (click)="clearFilters()">Clear Filters</button>
        }
      </div>
      <div class="minigame-hub__grid">
        @for (game of filteredGames(); track game.config.id) {
          <nx-minigame-card
            [config]="game.config"
            [mastery]="game.masteryStars"
            [levelsCompleted]="game.levelsCompleted"
            [isLocked]="!game.isUnlocked"
            [unlockMessage]="game.unlockMessage"
            [attr.tabindex]="game.isUnlocked ? 0 : -1"
            (cardClicked)="onCardClick($event)"
            (keydown.enter)="game.isUnlocked && onCardClick(game.config.id)" />
        } @empty {
          <p class="minigame-hub__empty">No minigames match the selected filters.</p>
        }
      </div>
    } @else {
      <nx-empty-state
        icon="gamepad-2"
        title="No minigames unlocked yet"
        message="Complete your first mission to unlock a minigame!">
        <button type="button" class="minigame-hub__cta" (click)="goToCampaign()">Start Campaign</button>
      </nx-empty-state>
    }
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
  readonly hasUnlockedGames = computed<boolean>(() => this.allGames().some(g => g.isUnlocked));
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
  readonly hasActiveFilters = computed<boolean>(() => this.topicFilter() !== '' || this.masteryFilter() !== -1);

  onTopicChange(event: Event): void { this.topicFilter.set((event.target as HTMLSelectElement).value); }
  onMasteryChange(event: Event): void { this.masteryFilter.set(+(event.target as HTMLSelectElement).value); }
  clearFilters(): void { this.topicFilter.set(''); this.masteryFilter.set(-1); }
  onCardClick(gameId: MinigameId): void { this.router.navigate(['/minigames', gameId]); }
  goToCampaign(): void { this.router.navigate(['/campaign']); }

  private buildCardData(config: MinigameConfig): MinigameCardData {
    const gameId = config.id;
    const isUnlocked = this.gameProgression.isMinigameUnlocked(gameId);
    const masteryStars = this.mastery.getMastery(gameId);
    const progress = this.levelProgression.getLevelProgress(gameId);
    const levelsCompleted = progress.filter(l => l.completed).length;
    const unlockMessage = this.deriveUnlockMessage(gameId);
    return { config, isUnlocked, masteryStars, levelsCompleted, unlockMessage };
  }

  private deriveUnlockMessage(gameId: MinigameId): string {
    const mission = ALL_STORY_MISSIONS.find(m => m.unlocksMinigame === gameId);
    return mission ? `Complete mission: ${mission.title}` : 'Locked';
  }
}
