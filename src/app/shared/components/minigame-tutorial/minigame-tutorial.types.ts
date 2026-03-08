/**
 * A single step in a minigame tutorial overlay.
 */
export interface TutorialStep {
  readonly title: string;
  readonly description: string;
  /** Optional illustration URL displayed above the step text. */
  readonly image?: string;
}

/** Returns the persistence key used to store whether a tutorial has been seen. */
export function tutorialSeenKey(gameId: string): string {
  return `tutorial-seen:${gameId}`;
}
