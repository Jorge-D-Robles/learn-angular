import { inject, Injectable } from '@angular/core';
import { GameProgressionService } from '../progression/game-progression.service';
import { MasteryService } from '../progression/mastery.service';
import { XpService } from '../progression/xp.service';
import { AudioService, SoundEffect } from '../audio/audio.service';
import { CurriculumService } from './curriculum.service';
import type { ChapterId } from './curriculum.types';
import type { MinigameId } from '../minigame/minigame.types';

/** Summary returned after completing a story mission. */
export interface MissionCompletionSummary {
  /** Total XP awarded (base + streak bonus). */
  readonly xpAwarded: number;
  /** The minigame unlocked by this mission, or null. */
  readonly unlockedMinigame: MinigameId | null;
  /** Whether mastery was awarded (true if mission unlocks a minigame). */
  readonly masteryAwarded: boolean;
  /** Whether this mission was already completed (no-op). */
  readonly alreadyCompleted: boolean;
}

/**
 * Facade service that orchestrates story mission completion.
 *
 * Connects the MissionPage to the progression system:
 * delegates to GameProgressionService for XP/campaign state,
 * then applies mastery floor for the unlocked minigame topic.
 */
@Injectable({ providedIn: 'root' })
export class StoryMissionCompletionService {
  private readonly gameProgression = inject(GameProgressionService);
  private readonly masteryService = inject(MasteryService);
  private readonly xpService = inject(XpService);
  private readonly audioService = inject(AudioService);
  private readonly curriculum = inject(CurriculumService);

  /**
   * Completes a story mission: awards XP, updates campaign state,
   * triggers unlock notification, and ensures minimum mastery.
   *
   * Idempotent: completing an already-completed mission returns
   * a summary with `alreadyCompleted: true` and no side effects.
   *
   * @throws Error if chapterId is invalid or prerequisites are not met.
   */
  completeMission(chapterId: ChapterId): MissionCompletionSummary {
    // Idempotency check: if already completed, return early
    if (this.gameProgression.isMissionCompleted(chapterId)) {
      return {
        xpAwarded: 0,
        unlockedMinigame: this.curriculum.getMinigameForChapter(chapterId),
        masteryAwarded: false,
        alreadyCompleted: true,
      };
    }

    // Capture XP before to compute delta (GameProgressionService.completeMission is void)
    const xpBefore = this.xpService.totalXp();

    // Play mission complete sound before XP notification (audio reinforces the moment)
    this.audioService.play(SoundEffect.missionComplete);

    // Delegate to GameProgressionService (XP, notification, unlock, campaign state)
    // Throws on invalid chapter or unmet prerequisites
    this.gameProgression.completeMission(chapterId);

    const xpAfter = this.xpService.totalXp();
    const xpAwarded = xpAfter - xpBefore;

    // Look up the mission to determine minigame unlock
    const unlockedMinigame = this.curriculum.getMinigameForChapter(chapterId);

    // Apply mastery floor if this mission unlocks a minigame
    let masteryAwarded = false;
    if (unlockedMinigame !== null) {
      this.masteryService.ensureMinimumMastery(unlockedMinigame, 1);
      masteryAwarded = true;
    }

    return {
      xpAwarded,
      unlockedMinigame,
      masteryAwarded,
      alreadyCompleted: false,
    };
  }
}
