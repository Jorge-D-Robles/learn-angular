import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { getCurrentRankThreshold, getNextRankThreshold } from '../../core/progression/xp.service';
import { LifetimeStatsService } from '../../core/progression/lifetime-stats.service';
import { MasteryService } from '../../core/progression/mastery.service';
import { MinigameRegistryService } from '../../core/minigame/minigame-registry.service';
import { SpacedRepetitionService } from '../../core/progression/spaced-repetition.service';
import { XpProgressBarComponent } from '../../shared/components/xp-progress-bar/xp-progress-bar';
import {
  MasteryTableComponent,
  type MasteryTableRow,
} from '../../shared/components/mastery-table/mastery-table';
import { StreakBadgeComponent } from '../../shared/components/streak-badge/streak-badge';
import { ProgressBarComponent } from '../../shared/components/progress-bar/progress-bar';
import { TimeFormatPipe } from '../../shared/pipes/time-format.pipe';
import { AchievementGridComponent } from '../../shared/components/achievement-grid/achievement-grid';
import { CosmeticGalleryComponent } from '../../shared/components/cosmetic-gallery/cosmetic-gallery';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner';
import type { DegradingTopicItem } from '../../shared/components/degradation-alert/degradation-alert';
import { DegradationAlertComponent } from '../../shared/components';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    DecimalPipe,
    XpProgressBarComponent,
    MasteryTableComponent,
    StreakBadgeComponent,
    ProgressBarComponent,
    TimeFormatPipe,
    AchievementGridComponent,
    CosmeticGalleryComponent,
    DegradationAlertComponent,
    LoadingSpinnerComponent,
  ],
  template: `
    <h1>Profile</h1>

    @if (isLoading()) {
      <nx-loading-spinner size="lg" message="Loading profile data..." />
    } @else {

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
      <nx-mastery-table [masteryData]="masteryTableData()" />
    </section>

    <section class="profile__degradation-section">
      <nx-degradation-alert
        [degradingTopics]="degradingTopicItems()"
        variant="full"
        (practiceRequested)="navigateToRefresher($event)" />
    </section>

    <section class="profile__achievements-section">
      <h2>Achievements</h2>
      <nx-achievement-grid />
    </section>

    <section class="profile__cosmetics-section">
      <h2>Station Customization</h2>
      <nx-cosmetic-gallery />
    </section>

    }
  `,
  styleUrl: './profile.scss',
})
export class ProfilePage implements OnInit {
  private readonly lifetimeStats = inject(LifetimeStatsService);
  private readonly masteryService = inject(MasteryService);
  private readonly registry = inject(MinigameRegistryService);
  private readonly spacedRepetition = inject(SpacedRepetitionService);
  private readonly router = inject(Router);

  readonly isLoading = signal(true);

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

  readonly masteryTableData = computed<MasteryTableRow[]>(() => {
    const games = this.registry.getAllGames();
    const masteryMap = this.masteryService.mastery();
    const lastPracticedMap = this.spacedRepetition.lastPracticed();

    return games.map((game) => {
      const rawMastery = masteryMap.get(game.id) ?? 0;
      const effectiveMastery = Math.floor(
        this.spacedRepetition.getEffectiveMastery(game.id),
      );
      const lastPracticedMs = lastPracticedMap.get(game.id);

      return {
        topicId: game.id,
        topicName: game.angularTopic,
        mastery: effectiveMastery,
        lastPracticed: lastPracticedMs !== undefined ? new Date(lastPracticedMs) : null,
        degrading: rawMastery > 0 && effectiveMastery < rawMastery,
      };
    });
  });

  readonly degradingTopicItems = computed<DegradingTopicItem[]>(() => {
    return this.spacedRepetition.getDegradingTopics().map((t) => ({
      topicId: t.topicId,
      topicName: this.registry.getConfig(t.topicId)?.name ?? t.topicId,
      currentMastery: t.rawMastery,
      effectiveMastery: t.effectiveMastery,
      daysSinceLastPractice: t.daysSinceLastPractice,
    }));
  });

  ngOnInit(): void {
    this.isLoading.set(false);
  }

  navigateToRefresher(topicId: string): void {
    this.router.navigate(['/refresher', topicId]);
  }
}
