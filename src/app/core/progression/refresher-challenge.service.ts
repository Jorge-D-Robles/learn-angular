import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import type { MinigameId } from '../minigame/minigame.types';
import { LevelLoaderService } from '../levels/level-loader.service';
import { SpacedRepetitionService, type DegradingTopic } from './spaced-repetition.service';

/** Reserved for future use when multiple-choice questions are added. */
export const REFRESHER_MIN_QUESTIONS = 3;
export const REFRESHER_MAX_QUESTIONS = 5;
export const REFRESHER_RESTORED_STARS = 1 as const;

export interface RefresherChallenge {
  readonly topicId: MinigameId;
  readonly questions: number;
  readonly gameId: MinigameId;
  readonly microLevelIds: readonly string[];
  readonly restoredStars: 1;
}

@Injectable({ providedIn: 'root' })
export class RefresherChallengeService {
  private readonly spacedRepetition = inject(SpacedRepetitionService);
  private readonly levelLoader = inject(LevelLoaderService);

  /** Returns degrading topics with actual mastery loss (effectiveMastery < rawMastery). */
  getPendingRefreshers(): readonly DegradingTopic[] {
    return this.spacedRepetition
      .getDegradingTopics()
      .filter((t) => t.effectiveMastery < t.rawMastery);
  }

  /** Generates a refresher challenge for a degrading topic. Returns null if topic is not degrading. */
  async generateRefresher(
    topicId: MinigameId,
  ): Promise<RefresherChallenge | null> {
    const pending = this.getPendingRefreshers();
    if (!pending.some((t) => t.topicId === topicId)) {
      return null;
    }

    const levels = await firstValueFrom(
      this.levelLoader.loadLevelPack(topicId),
    );
    const levelIds = levels.map((l) => l.levelId);
    const selected = this._selectLevels(levelIds);

    if (selected.length === 0) {
      return null;
    }

    return {
      topicId,
      questions: selected.length,
      gameId: topicId,
      microLevelIds: selected,
      restoredStars: REFRESHER_RESTORED_STARS,
    };
  }

  /** Completes a refresher, resetting the degradation clock. Returns false if topic is not degrading. */
  completeRefresher(topicId: MinigameId): boolean {
    const pending = this.getPendingRefreshers();
    if (!pending.some((t) => t.topicId === topicId)) {
      return false;
    }
    this.spacedRepetition.recordPractice(topicId);
    return true;
  }

  private _selectLevels(levelIds: readonly string[]): readonly string[] {
    if (levelIds.length <= REFRESHER_MAX_QUESTIONS) {
      return [...levelIds];
    }
    const shuffled = [...levelIds].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, REFRESHER_MAX_QUESTIONS);
  }
}
