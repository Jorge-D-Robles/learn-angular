import { inject, Injectable, signal, type Signal, type WritableSignal } from '@angular/core';
import { StatePersistenceService } from '../persistence/state-persistence.service';
import { SpacedRepetitionService } from './spaced-repetition.service';
import { GameProgressionService } from './game-progression.service';
import { XpService } from './xp.service';
import { XpNotificationService } from '../notifications/xp-notification.service';
import type { MinigameId } from '../minigame/minigame.types';

export interface DailyChallenge {
  readonly date: string;
  readonly gameId: MinigameId;
  readonly levelId: string;
  readonly bonusXp: number;
  readonly completed: boolean;
}

export const DAILY_CHALLENGE_BONUS_XP = 50 as const;
const PERSISTENCE_KEY = 'daily-challenge';

interface DailyChallengeSnapshot {
  lastCompletedDate: string | null;
}

function dateHash(dateStr: string): number {
  let hash = 5381;
  for (let i = 0; i < dateStr.length; i++) {
    hash = ((hash << 5) + hash + dateStr.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

@Injectable({ providedIn: 'root' })
export class DailyChallengeService {
  private readonly spacedRepetition = inject(SpacedRepetitionService);
  private readonly gameProgression = inject(GameProgressionService);
  private readonly xpService = inject(XpService);
  private readonly xpNotification = inject(XpNotificationService);
  private readonly persistence = inject(StatePersistenceService);

  private readonly _completedDate = signal<string | null>(null);
  private readonly _challenge: WritableSignal<DailyChallenge>;

  /** Frozen at construction. Stale after midnight until page refresh. */
  readonly todaysChallenge: Signal<DailyChallenge>;

  constructor() {
    this._loadState();
    const today = this._today();
    const completed = this._completedDate() === today;
    this._challenge = signal(this._generateChallenge(today, completed));
    this.todaysChallenge = this._challenge.asReadonly();
  }

  isCompleted(): boolean {
    return this._challenge().completed;
  }

  completeChallenge(): void {
    if (this._challenge().completed) {
      return;
    }
    this._completedDate.set(this._challenge().date);
    this._challenge.update((c) => ({ ...c, completed: true }));
    this.xpService.addXp(DAILY_CHALLENGE_BONUS_XP);
    this.xpNotification.show(DAILY_CHALLENGE_BONUS_XP, ['Daily Challenge']);
    this._saveState();
  }

  private _today(): string {
    return new Date().toLocaleDateString('en-CA');
  }

  private _generateChallenge(date: string, completed: boolean): DailyChallenge {
    const seed = dateHash(date);
    const gameId = this._selectGameId(seed);
    const levelId = `daily-${gameId}-${date}`;
    return { date, gameId, levelId, bonusXp: DAILY_CHALLENGE_BONUS_XP, completed };
  }

  private _selectGameId(seed: number): MinigameId {
    const degrading = this.spacedRepetition.getDegradingTopics();
    const unlocked = this.gameProgression.getUnlockedMinigames();

    if (unlocked.length === 0) {
      return 'module-assembly';
    }

    const degradingUnlocked = degrading.filter((t) => unlocked.includes(t.topicId));

    if (degradingUnlocked.length > 0) {
      return degradingUnlocked[seed % degradingUnlocked.length].topicId;
    }

    return unlocked[seed % unlocked.length];
  }

  private _loadState(): void {
    const saved = this.persistence.load<DailyChallengeSnapshot>(PERSISTENCE_KEY);
    if (saved !== null && typeof saved === 'object' && !Array.isArray(saved)) {
      if (
        typeof saved.lastCompletedDate === 'string' &&
        /^\d{4}-\d{2}-\d{2}$/.test(saved.lastCompletedDate)
      ) {
        this._completedDate.set(saved.lastCompletedDate);
      }
    }
  }

  private _saveState(): void {
    const snapshot: DailyChallengeSnapshot = {
      lastCompletedDate: this._completedDate(),
    };
    this.persistence.save(PERSISTENCE_KEY, snapshot);
  }
}
