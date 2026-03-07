import type { MinigameId } from '../minigame';

/** Numeric chapter identifier (1-34). */
export type ChapterId = number;

/** Phase number (1-6). */
export type PhaseNumber = 1 | 2 | 3 | 4 | 5 | 6;

/** A single story mission in the curriculum. */
export interface StoryMission {
  readonly chapterId: ChapterId;
  readonly title: string;
  readonly angularTopic: string;
  /** Narrative hook from curriculum.md Narrative column (use verbatim). */
  readonly narrative: string;
  readonly unlocksMinigame: MinigameId | null;
  readonly deps: readonly ChapterId[];
  readonly phase: PhaseNumber;
}

/** A phase grouping of story missions. */
export interface CurriculumPhase {
  readonly phaseNumber: PhaseNumber;
  readonly name: string;
  /** Phase prose from curriculum.md (e.g., "The station's core systems are offline..."). */
  readonly description: string;
  readonly chapters: readonly StoryMission[];
}
