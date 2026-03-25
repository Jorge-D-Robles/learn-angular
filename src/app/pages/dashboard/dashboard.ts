import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  XpService,
  GameProgressionService,
  DailyChallengeService,
  SpacedRepetitionService,
  MasteryService,
  StreakService,
  getCurrentRankThreshold,
  getNextRankThreshold,
} from '../../core/progression';
import { MinigameRegistryService } from '../../core/minigame/minigame-registry.service';
import type { MinigameId } from '../../core/minigame/minigame.types';
import { ALL_STORY_MISSIONS } from '../../core/curriculum/curriculum.data';
import type { DegradingTopicItem } from '../../shared/components/degradation-alert/degradation-alert';
import {
  XpProgressBarComponent,
  StationCardComponent,
  StationVisualizationComponent,
  MissionCardComponent,
  StreakBadgeComponent,
  DegradationAlertComponent,
  DailyChallengeCardComponent,
} from '../../shared/components';

@Component({
  selector: 'app-dashboard',
  imports: [
    XpProgressBarComponent,
    StationCardComponent,
    StationVisualizationComponent,
    MissionCardComponent,
    StreakBadgeComponent,
    DegradationAlertComponent,
    DailyChallengeCardComponent,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class DashboardPage {
  private readonly xpService = inject(XpService);
  private readonly gameProgression = inject(GameProgressionService);
  private readonly dailyChallenge = inject(DailyChallengeService);
  private readonly spacedRepetition = inject(SpacedRepetitionService);
  private readonly masteryService = inject(MasteryService);
  private readonly minigameRegistry = inject(MinigameRegistryService);
  private readonly streakService = inject(StreakService);
  private readonly router = inject(Router);

  readonly currentRank = this.xpService.currentRank;
  readonly currentMission = this.gameProgression.currentMission;
  readonly todaysChallenge = this.dailyChallenge.todaysChallenge;
  readonly activeStreakDays = this.streakService.activeStreakDays;
  readonly streakMultiplier = this.streakService.streakMultiplier;

  readonly rankXpProgress = computed(() => {
    const totalXp = this.xpService.totalXp();
    return totalXp - getCurrentRankThreshold(totalXp).xpRequired;
  });

  readonly rankXpRange = computed(() => {
    const totalXp = this.xpService.totalXp();
    const next = getNextRankThreshold(totalXp);
    if (!next) return 0;
    return next.xpRequired - getCurrentRankThreshold(totalXp).xpRequired;
  });

  readonly nextRankName = computed(() => {
    const totalXp = this.xpService.totalXp();
    return getNextRankThreshold(totalXp)?.rank ?? '';
  });

  readonly quickPlayGames = computed(() => {
    const unlocked = this.gameProgression.getUnlockedMinigames();
    return unlocked.slice(0, 4).map((id) => ({
      id,
      name: this.minigameRegistry.getConfig(id)?.name ?? id,
    }));
  });

  readonly degradingTopicItems = computed<DegradingTopicItem[]>(() => {
    return this.spacedRepetition.getDegradingTopics().map((t) => ({
      topicId: t.topicId,
      topicName: this.minigameRegistry.getConfig(t.topicId)?.name ?? t.topicId,
      currentMastery: t.rawMastery,
      effectiveMastery: t.effectiveMastery,
      daysSinceLastPractice: t.daysSinceLastPractice,
    }));
  });

  readonly masteryMap = computed(() => new Map<string, number>(this.masteryService.mastery()));

  readonly challengeGameName = computed(() => {
    const challenge = this.todaysChallenge();
    return this.minigameRegistry.getConfig(challenge.gameId)?.name ?? challenge.gameId;
  });

  readonly challengeGameTopic = computed(() => {
    const challenge = this.todaysChallenge();
    return this.minigameRegistry.getConfig(challenge.gameId)?.angularTopic ?? '';
  });

  readonly campaignProgress = computed(
    () => `${this.gameProgression.completedMissionCount()}/${ALL_STORY_MISSIONS.length}`,
  );

  navigateToMission(): void {
    const mission = this.currentMission();
    if (mission) {
      this.router.navigate(['/mission', mission.chapterId]);
    }
  }

  navigateToMinigame(gameId: string): void {
    this.router.navigate(['/minigames', gameId]);
  }

  navigateToRefresher(topicId: string): void {
    this.router.navigate(['/refresher', topicId]);
  }

  onAcceptChallenge(gameId: MinigameId): void {
    this.router.navigate(['/minigames', gameId, 'daily']);
  }
}
