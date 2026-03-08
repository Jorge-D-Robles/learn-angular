import { computed, inject, Injectable } from '@angular/core';
import type { Rank } from '../state';
import type { MinigameId } from '../minigame/minigame.types';
import { XpService } from './xp.service';
import { MasteryService } from './mastery.service';
import { GameProgressionService } from './game-progression.service';
import { PlayTimeService } from './play-time.service';
import { StreakService } from './streak.service';
import { LevelProgressionService } from '../levels/level-progression.service';
import { ALL_STORY_MISSIONS } from '../curriculum/curriculum.data';

/** Aggregate snapshot of all player statistics for the profile page. */
export interface ProfileStats {
  readonly totalXp: number;
  readonly currentRank: Rank;
  readonly rankProgress: number;
  readonly topicMasteryMap: ReadonlyMap<MinigameId, number>;
  readonly missionsCompleted: number;
  readonly totalMissions: number;
  readonly totalPlayTime: number;
  readonly currentStreak: number;
  readonly streakMultiplier: number;
  readonly levelsCompleted: number;
  readonly perfectScores: number;
}

/**
 * Facade service that aggregates data from 6 progression services
 * into a single computed signal snapshot for the profile page.
 */
@Injectable({ providedIn: 'root' })
export class LifetimeStatsService {
  private readonly xpService = inject(XpService);
  private readonly masteryService = inject(MasteryService);
  private readonly gameProgression = inject(GameProgressionService);
  private readonly playTimeService = inject(PlayTimeService);
  private readonly streakService = inject(StreakService);
  private readonly levelProgression = inject(LevelProgressionService);

  readonly profileStats = computed<ProfileStats>(() => ({
    totalXp: this.xpService.totalXp(),
    currentRank: this.xpService.currentRank(),
    rankProgress: this.xpService.rankProgress(),
    topicMasteryMap: this.masteryService.mastery(),
    missionsCompleted: this.gameProgression.completedMissionCount(),
    totalMissions: ALL_STORY_MISSIONS.length,
    totalPlayTime: this.playTimeService.totalPlayTime(),
    currentStreak: this.streakService.activeStreakDays(),
    streakMultiplier: this.streakService.streakMultiplier(),
    ...this._countLevelStats(),
  }));

  getProfileStats(): ProfileStats {
    return this.profileStats();
  }

  private _countLevelStats(): { levelsCompleted: number; perfectScores: number } {
    const progress = this.levelProgression.progress();
    let levelsCompleted = 0;
    let perfectScores = 0;
    for (const lp of progress.values()) {
      if (lp.completed) levelsCompleted++;
      if (lp.perfect) perfectScores++;
    }
    return { levelsCompleted, perfectScores };
  }
}
