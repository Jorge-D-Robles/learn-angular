import { Injectable } from '@angular/core';
import { ALL_STORY_MISSIONS, CURRICULUM } from './curriculum.data';
import type { ChapterId, CurriculumPhase, StoryMission } from './curriculum.types';
import type { MinigameId } from '../minigame';

@Injectable({ providedIn: 'root' })
export class CurriculumService {
  private readonly chapterMap: ReadonlyMap<ChapterId, StoryMission>;
  private readonly minigameToChapterMap: ReadonlyMap<MinigameId, ChapterId>;
  private readonly chapterToPhaseMap: ReadonlyMap<ChapterId, CurriculumPhase>;

  constructor() {
    // Build chapter lookup map
    this.chapterMap = new Map(
      ALL_STORY_MISSIONS.map(m => [m.chapterId, m]),
    );

    // Build minigame-to-first-chapter map
    const mgMap = new Map<MinigameId, ChapterId>();
    for (const mission of ALL_STORY_MISSIONS) {
      if (mission.unlocksMinigame !== null && !mgMap.has(mission.unlocksMinigame)) {
        mgMap.set(mission.unlocksMinigame, mission.chapterId);
      }
    }
    this.minigameToChapterMap = mgMap;

    // Build chapter-to-phase map
    const phaseMap = new Map<ChapterId, CurriculumPhase>();
    for (const phase of CURRICULUM) {
      for (const chapter of phase.chapters) {
        phaseMap.set(chapter.chapterId, phase);
      }
    }
    this.chapterToPhaseMap = phaseMap;
  }

  getChapter(chapterId: ChapterId): StoryMission | undefined {
    return this.chapterMap.get(chapterId);
  }

  getMinigameForChapter(chapterId: ChapterId): MinigameId | null {
    const mission = this.chapterMap.get(chapterId);
    return mission?.unlocksMinigame ?? null;
  }

  getChapterForMinigame(gameId: MinigameId): ChapterId | null {
    return this.minigameToChapterMap.get(gameId) ?? null;
  }

  getPhaseForChapter(chapterId: ChapterId): CurriculumPhase {
    const phase = this.chapterToPhaseMap.get(chapterId);
    if (!phase) {
      throw new Error(`Chapter not found: ${chapterId}`);
    }
    return phase;
  }

  getPrerequisites(chapterId: ChapterId): ChapterId[] {
    const mission = this.chapterMap.get(chapterId);
    return mission ? [...mission.deps] : [];
  }
}
