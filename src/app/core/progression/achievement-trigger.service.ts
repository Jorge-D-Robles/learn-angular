import { effect, inject, Injectable, untracked } from '@angular/core';
import { AchievementService } from './achievement.service';
import { AchievementNotificationService } from '../notifications/achievement-notification.service';
import { XpService } from './xp.service';
import { StreakService } from './streak.service';
import type { Rank } from '../state/rank.constants';

@Injectable({ providedIn: 'root' })
export class AchievementTriggerService {
  private readonly achievementService = inject(AchievementService);
  private readonly notificationService = inject(AchievementNotificationService);
  private readonly xpService = inject(XpService);
  private readonly streakService = inject(StreakService);

  private _previousRank: Rank | null = null;
  private _previousStreakDays: number | null = null;

  constructor() {
    effect(() => {
      const currentRank = this.xpService.currentRank();

      if (this._previousRank === null) {
        this._previousRank = currentRank;
        return;
      }

      if (currentRank !== this._previousRank) {
        this._previousRank = currentRank;
        untracked(() => this.triggerCheck());
      }
    });

    effect(() => {
      const streakDays = this.streakService.activeStreakDays();

      if (this._previousStreakDays === null) {
        this._previousStreakDays = streakDays;
        return;
      }

      if (streakDays !== this._previousStreakDays) {
        this._previousStreakDays = streakDays;
        untracked(() => this.triggerCheck());
      }
    });
  }

  triggerCheck(): void {
    const newlyEarned = this.achievementService.checkAchievements();
    for (const achievement of newlyEarned) {
      this.notificationService.show(achievement);
    }
  }
}
