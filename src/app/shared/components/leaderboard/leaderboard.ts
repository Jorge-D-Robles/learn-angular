import { Component, computed, inject, input, linkedSignal } from '@angular/core';
import type { MinigameId } from '../../../core/minigame/minigame.types';
import {
  LeaderboardService,
  type LeaderboardEntry,
  type LeaderboardMode,
} from '../../../core/progression/leaderboard.service';
import { EmptyStateComponent } from '../empty-state/empty-state';

@Component({
  selector: 'nx-leaderboard',
  imports: [EmptyStateComponent],
  template: `
    <div class="leaderboard__tabs" role="tablist">
      @for (tab of modes; track tab.value) {
        <button
          class="leaderboard__tab"
          role="tab"
          [class.leaderboard__tab--active]="tab.value === activeMode()"
          [attr.aria-selected]="tab.value === activeMode()"
          (click)="selectMode(tab.value)">
          {{ tab.label }}
        </button>
      }
    </div>

    @if (isEmpty()) {
      <nx-empty-state icon="trophy" title="No Entries Yet" message="Be the first to set a score!" />
    } @else {
      <div class="leaderboard__table" role="table" aria-label="Leaderboard">
        <div class="leaderboard__header" role="row">
          <span role="columnheader">#</span>
          <span role="columnheader">Player</span>
          <span role="columnheader">Score</span>
          <span role="columnheader">Time</span>
          <span role="columnheader">Date</span>
        </div>
        @for (entry of entries(); track $index) {
          <div
            class="leaderboard__row"
            role="row"
            [class.leaderboard__row--gold]="$index === 0"
            [class.leaderboard__row--silver]="$index === 1"
            [class.leaderboard__row--bronze]="$index === 2"
            [class.leaderboard__row--player]="entry.playerName === playerName()">
            <span class="leaderboard__rank" role="cell">{{ $index + 1 }}</span>
            <span class="leaderboard__name" role="cell">{{ entry.playerName }}</span>
            <span class="leaderboard__score" role="cell">{{ entry.score }}</span>
            <span class="leaderboard__time" role="cell">{{ formatTime(entry.time) }}</span>
            <span class="leaderboard__date" role="cell">{{ formatDate(entry.date) }}</span>
          </div>
        }
      </div>
    }
  `,
  styleUrl: './leaderboard.scss',
  host: {
    class: 'leaderboard',
  },
})
export class LeaderboardComponent {
  private readonly leaderboard = inject(LeaderboardService);

  readonly gameId = input.required<MinigameId>();
  readonly mode = input<LeaderboardMode>('story');
  readonly playerName = input<string>('');

  readonly activeMode = linkedSignal(() => this.mode());

  readonly entries = computed<LeaderboardEntry[]>(() =>
    this.leaderboard.getLeaderboard(this.gameId(), this.activeMode()),
  );

  readonly isEmpty = computed(() => this.entries().length === 0);

  readonly modes: readonly { value: LeaderboardMode; label: string }[] = [
    { value: 'story', label: 'Story' },
    { value: 'endless', label: 'Endless' },
    { value: 'speedRun', label: 'Speed Run' },
  ];

  selectMode(mode: LeaderboardMode): void {
    this.activeMode.set(mode);
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  formatDate(isoDate: string): string {
    return new Date(isoDate).toLocaleDateString();
  }
}
