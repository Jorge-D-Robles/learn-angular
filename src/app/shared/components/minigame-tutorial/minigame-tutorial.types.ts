/**
 * A single step in a minigame tutorial overlay.
 */
export interface TutorialStep {
  readonly title: string;
  readonly description: string;
  /** Optional illustration URL displayed above the step text. */
  readonly image?: string;
}
