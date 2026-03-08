import type { ChapterId } from './curriculum.types';

/** A narrative-only step that advances the station story. */
export interface NarrativeStep {
  readonly stepType: 'narrative';
  readonly narrativeText: string;
}

/** A step with a read-only code example and explanation. */
export interface CodeExampleStep {
  readonly stepType: 'code-example';
  readonly narrativeText: string;
  readonly code: string;
  readonly language: string;
  readonly highlightLines?: readonly number[];
  readonly explanation: string;
}

/** A concept explanation panel with title, body, and optional key points. */
export interface ConceptStep {
  readonly stepType: 'concept';
  readonly narrativeText: string;
  readonly conceptTitle: string;
  readonly conceptBody: string;
  readonly keyPoints?: readonly string[];
}

/** Discriminated union of all mission step types. */
export type MissionStep = NarrativeStep | CodeExampleStep | ConceptStep;

/** Criteria for completing a story mission. */
export interface CompletionCriteria {
  readonly description: string;
  readonly minStepsViewed: number;
}

/** Full narrative content for a single story mission. */
export interface StoryMissionContent {
  readonly chapterId: ChapterId;
  readonly steps: readonly MissionStep[];
  readonly completionCriteria: CompletionCriteria;
}
