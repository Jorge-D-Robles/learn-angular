import { Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { getCurrentRankThreshold, getNextRankThreshold } from '../../core/progression/xp.service';
import { LifetimeStatsService } from '../../core/progression/lifetime-stats.service';
import { MinigameRegistryService } from '../../core/minigame/minigame-registry.service';
import { SpacedRepetitionService } from '../../core/progression/spaced-repetition.service';
import { XpProgressBarComponent } from '../../shared/components/xp-progress-bar/xp-progress-bar';
import { MasteryStarsComponent } from '../../shared/components/mastery-stars/mastery-stars';
import { StreakBadgeComponent } from '../../shared/components/streak-badge/streak-badge';
import { ProgressBarComponent } from '../../shared/components/progress-bar/progress-bar';
import { TimeFormatPipe } from '../../shared/pipes/time-format.pipe';
import { AchievementGridComponent } from '../../shared/components/achievement-grid/achievement-grid';
import type { MinigameConfig } from '../../core/minigame/minigame.types';

interface MasteryRow {
  readonly topic: string;
  readonly minigameName: string;
  readonly stars: number;
}

type SortColumn = 'topic' | 'minigame' | 'stars';
type SortDirection = 'asc' | 'desc';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    DecimalPipe,
    XpProgressBarComponent,
    MasteryStarsComponent,
    StreakBadgeComponent,
    ProgressBarComponent,
    TimeFormatPipe,
    AchievementGridComponent,
  ],
  template: `
    <h1>Profile</h1>

    <section class="profile__rank-section">
      <div class="profile__rank-header">
        <span class="profile__rank-name">{{ stats().currentRank }}</span>
        <span class="profile__total-xp">{{ stats().totalXp | number }} XP</span>
      </div>
      <nx-xp-progress-bar
        [currentXp]="rankXpProgress()"
        [nextRankXp]="rankXpRange()"
        [currentRank]="stats().currentRank"
        [nextRank]="nextRankName()"
        variant="full" />
    </section>

    <section class="profile__stats-row">
      @if (stats().currentStreak > 0) {
        <div class="profile__stat-card profile__stat-card--streak">
          <h3>Streak</h3>
          <nx-streak-badge
            [currentStreak]="stats().currentStreak"
            [multiplier]="stats().streakMultiplier" />
        </div>
      }

      <div class="profile__stat-card profile__stat-card--play-time">
        <h3>Play Time</h3>
        <span class="profile__stat-value">{{ stats().totalPlayTime | timeFormat }}</span>
      </div>

      <div class="profile__stat-card profile__stat-card--campaign">
        <h3>Campaign</h3>
        <span class="profile__stat-value">{{ stats().missionsCompleted }} / {{ stats().totalMissions }}</span>
        <nx-progress-bar [value]="stats().missionsCompleted" [max]="stats().totalMissions" />
        <span class="profile__stat-detail">{{ campaignPercent() }}%</span>
      </div>

      <div class="profile__stat-card profile__stat-card--games-played">
        <h3>Games Played</h3>
        <span class="profile__stat-value">{{ stats().levelsCompleted }}</span>
      </div>
    </section>

    <section class="profile__mastery-section">
      <h2>Mastery</h2>
      <table class="profile__mastery-table">
        <thead>
          <tr>
            <th (click)="toggleSort('topic')">Topic</th>
            <th (click)="toggleSort('minigame')">Minigame</th>
            <th (click)="toggleSort('stars')">Stars</th>
          </tr>
        </thead>
        <tbody>
          @for (row of sortedMasteryRows(); track row.minigameName) {
            <tr>
              <td>{{ row.topic }}</td>
              <td>{{ row.minigameName }}</td>
              <td><nx-mastery-stars [stars]="row.stars" size="sm" /></td>
            </tr>
          }
        </tbody>
      </table>
    </section>

    <section class="profile__achievements-section">
      <h2>Achievements</h2>
      <nx-achievement-grid />
    </section>
  `,
  styleUrl: './profile.scss',
})
export class ProfilePage {
  private readonly lifetimeStats = inject(LifetimeStatsService);
  private readonly registry = inject(MinigameRegistryService);
  private readonly spacedRepetition = inject(SpacedRepetitionService);

  readonly sortColumn = signal<SortColumn>('topic');
  readonly sortDirection = signal<SortDirection>('asc');

  readonly stats = computed(() => this.lifetimeStats.profileStats());

  readonly rankXpProgress = computed(() => {
    const totalXp = this.stats().totalXp;
    return totalXp - getCurrentRankThreshold(totalXp).xpRequired;
  });

  readonly rankXpRange = computed(() => {
    const totalXp = this.stats().totalXp;
    const next = getNextRankThreshold(totalXp);
    if (!next) return 0;
    return next.xpRequired - getCurrentRankThreshold(totalXp).xpRequired;
  });

  readonly nextRankName = computed(() =>
    getNextRankThreshold(this.stats().totalXp)?.rank ?? '',
  );

  readonly campaignPercent = computed(() => {
    const { missionsCompleted, totalMissions } = this.stats();
    if (totalMissions === 0) return 0;
    return Math.floor((missionsCompleted / totalMissions) * 100);
  });

  private readonly masteryRows = computed<MasteryRow[]>(() => {
    const games: MinigameConfig[] = this.registry.getAllGames();
    return games.map((game) => ({
      topic: game.angularTopic,
      minigameName: game.name,
      stars: Math.floor(this.spacedRepetition.getEffectiveMastery(game.id)),
    }));
  });

  readonly sortedMasteryRows = computed<MasteryRow[]>(() => {
    const rows = [...this.masteryRows()];
    const col = this.sortColumn();
    const dir = this.sortDirection();
    const mult = dir === 'asc' ? 1 : -1;

    rows.sort((a, b) => {
      if (col === 'stars') {
        return (a.stars - b.stars) * mult;
      }
      const aVal = col === 'minigame' ? a.minigameName : a.topic;
      const bVal = col === 'minigame' ? b.minigameName : b.topic;
      return aVal.localeCompare(bVal) * mult;
    });

    return rows;
  });

  toggleSort(column: SortColumn): void {
    if (this.sortColumn() === column) {
      this.sortDirection.update((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set(column === 'stars' ? 'desc' : 'asc');
    }
  }
}
