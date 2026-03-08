import { inject, Injectable } from '@angular/core';
import { GameProgressionService } from '../progression/game-progression.service';
import type { ChapterId } from './curriculum.types';
import type { StoryMissionContent } from './story-mission-content.types';

@Injectable({ providedIn: 'root' })
export class StoryMissionContentService {
  private readonly gameProgression = inject(GameProgressionService);
  private readonly contentMap = new Map<number, StoryMissionContent>();
  private readonly viewedSteps = new Map<number, Set<number>>();

  registerContent(content: StoryMissionContent | StoryMissionContent[]): void {
    const items = Array.isArray(content) ? content : [content];
    for (const item of items) {
      this.contentMap.set(item.chapterId, item);
    }
  }

  getMissionContent(chapterId: number): StoryMissionContent | undefined {
    return this.contentMap.get(chapterId);
  }

  getMissionStepCount(chapterId: number): number {
    return this.contentMap.get(chapterId)?.steps.length ?? 0;
  }

  completeMissionStep(chapterId: number, stepIndex: number): void {
    const content = this.contentMap.get(chapterId);
    if (!content) {
      throw new Error(`Mission content not found: chapter ${chapterId}`);
    }
    if (stepIndex < 0 || stepIndex >= content.steps.length) {
      throw new Error('Step index out of range');
    }
    if (!this.gameProgression.isMissionAvailable(chapterId as ChapterId)) {
      throw new Error(`Mission not available: chapter ${chapterId}`);
    }

    let steps = this.viewedSteps.get(chapterId);
    if (!steps) {
      steps = new Set<number>();
      this.viewedSteps.set(chapterId, steps);
    }
    steps.add(stepIndex);
  }

  isMissionComplete(chapterId: number): boolean {
    const content = this.contentMap.get(chapterId);
    if (!content) {
      return false;
    }
    const viewed = this.viewedSteps.get(chapterId);
    return (viewed?.size ?? 0) >= content.completionCriteria.minStepsViewed;
  }

  getViewedSteps(chapterId: number): ReadonlySet<number> {
    const viewed = this.viewedSteps.get(chapterId);
    return new Set(viewed);
  }

  resetMissionProgress(chapterId: number): void {
    this.viewedSteps.delete(chapterId);
  }
}
