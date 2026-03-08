import { inject, Injectable } from '@angular/core';
import { StatePersistenceService } from '../persistence/state-persistence.service';
import { XpService } from './xp.service';
import { XpNotificationService } from '../notifications/xp-notification.service';

// --- Public types ---

export interface StreakMilestoneReward {
  readonly days: number;
  readonly bonusXp: number;
  readonly label: string;
}

// --- Milestone definitions (exported for test assertions) ---

export const STREAK_MILESTONES: readonly StreakMilestoneReward[] = [
  { days: 7, bonusXp: 100, label: 'Weekly Warrior' },
  { days: 14, bonusXp: 200, label: '2-Week Streak' },
  { days: 30, bonusXp: 500, label: 'Monthly Legend' },
] as const;

// --- Persistence ---

const PERSISTENCE_KEY = 'streak-rewards';

interface StreakRewardSnapshot {
  awardedMilestones: number[];
}

// --- Service ---

@Injectable({ providedIn: 'root' })
export class StreakRewardService {
  private readonly xpService = inject(XpService);
  private readonly xpNotification = inject(XpNotificationService);
  private readonly persistence = inject(StatePersistenceService);

  private readonly _awardedMilestones = new Set<number>();

  constructor() {
    this._loadState();
  }

  /**
   * Checks if the given streak day count matches a milestone.
   * If so and not already awarded, awards bonus XP, shows notification,
   * persists the award, and returns the reward definition.
   * Returns null if no milestone matches or already awarded.
   */
  checkMilestoneReward(streakDays: number): StreakMilestoneReward | null {
    const milestone = STREAK_MILESTONES.find(m => m.days === streakDays);
    if (!milestone) return null;
    if (this._awardedMilestones.has(milestone.days)) return null;

    this.xpService.addXp(milestone.bonusXp);
    this.xpNotification.show(milestone.bonusXp, [milestone.label]);
    this._awardedMilestones.add(milestone.days);
    this._saveState();

    return milestone;
  }

  /** Returns true if the given milestone day count has already been awarded. */
  isAwarded(days: number): boolean {
    return this._awardedMilestones.has(days);
  }

  private _loadState(): void {
    const saved = this.persistence.load<StreakRewardSnapshot>(PERSISTENCE_KEY);
    if (saved !== null && typeof saved === 'object' && !Array.isArray(saved)) {
      if (Array.isArray(saved.awardedMilestones)) {
        for (const d of saved.awardedMilestones) {
          if (typeof d === 'number' && d > 0) {
            this._awardedMilestones.add(d);
          }
        }
      }
    }
  }

  private _saveState(): void {
    const snapshot: StreakRewardSnapshot = {
      awardedMilestones: [...this._awardedMilestones],
    };
    this.persistence.save(PERSISTENCE_KEY, snapshot);
  }
}
