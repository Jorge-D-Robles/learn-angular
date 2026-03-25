import { computed, inject, Injectable, signal } from '@angular/core';
import { StatePersistenceService } from '../persistence/state-persistence.service';

const ONBOARDING_KEY = 'onboarding';

/** String enum of onboarding steps. Values serialize readably to JSON. */
export enum OnboardingStep {
  Welcome = 'welcome',
  FirstMission = 'firstMission',
  FirstMinigame = 'firstMinigame',
  FirstLevelComplete = 'firstLevelComplete',
  ExploreHub = 'exploreHub',
  CheckProfile = 'checkProfile',
}

/** Canonical order in which onboarding steps are presented. */
export const ONBOARDING_STEP_ORDER: readonly OnboardingStep[] = [
  OnboardingStep.Welcome,
  OnboardingStep.FirstMission,
  OnboardingStep.FirstMinigame,
  OnboardingStep.FirstLevelComplete,
  OnboardingStep.ExploreHub,
  OnboardingStep.CheckProfile,
];

const VALID_STEPS = new Set<string>(Object.values(OnboardingStep));

@Injectable({ providedIn: 'root' })
export class OnboardingService {
  private readonly persistence = inject(StatePersistenceService);

  private readonly _completedSteps = signal<Set<OnboardingStep>>(new Set());

  readonly isOnboardingComplete = computed(
    () => this._completedSteps().size === ONBOARDING_STEP_ORDER.length,
  );

  constructor() {
    this._loadState();
  }

  /** Returns whether a specific onboarding step has been completed. */
  isStepCompleted(step: OnboardingStep): boolean {
    return this._completedSteps().has(step);
  }

  /** Marks a step as completed and persists immediately. */
  completeStep(step: OnboardingStep): void {
    if (!VALID_STEPS.has(step)) {
      return;
    }

    const current = this._completedSteps();
    if (current.has(step)) {
      return;
    }

    const updated = new Set(current);
    updated.add(step);
    this._completedSteps.set(updated);
    this._saveState(updated);
  }

  /** Returns the next incomplete onboarding step in order, or null if all done. */
  nextPendingStep(): OnboardingStep | null {
    const completed = this._completedSteps();
    for (const step of ONBOARDING_STEP_ORDER) {
      if (!completed.has(step)) {
        return step;
      }
    }
    return null;
  }

  /** Clears all onboarding progress and removes persisted data. */
  resetOnboarding(): void {
    this._completedSteps.set(new Set());
    this.persistence.clear(ONBOARDING_KEY);
  }

  private _loadState(): void {
    const saved = this.persistence.load<unknown[]>(ONBOARDING_KEY);
    if (saved !== null && Array.isArray(saved)) {
      const validSteps = new Set<OnboardingStep>();
      for (const entry of saved) {
        if (typeof entry === 'string' && VALID_STEPS.has(entry)) {
          validSteps.add(entry as OnboardingStep);
        }
      }
      this._completedSteps.set(validSteps);
    }
  }

  private _saveState(steps: Set<OnboardingStep>): void {
    this.persistence.save(ONBOARDING_KEY, [...steps]);
  }
}
