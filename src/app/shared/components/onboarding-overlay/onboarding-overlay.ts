import {
  Component,
  ElementRef,
  OnInit,
  afterNextRender,
  computed,
  inject,
  output,
  signal,
  viewChild,
} from '@angular/core';
import {
  OnboardingService,
  ONBOARDING_STEP_ORDER,
} from '../../../core/progression/onboarding.service';

interface OnboardingTourStep {
  readonly title: string;
  readonly description: string;
}

const ONBOARDING_TOUR_STEPS: readonly OnboardingTourStep[] = [
  {
    title: 'Welcome to Nexus Station',
    description:
      "You're a Systems Engineer rebuilding the station. Let's show you around.",
  },
  {
    title: 'Story Missions',
    description:
      'Start here. Each mission introduces a new Angular concept in context.',
  },
  {
    title: 'Minigames',
    description:
      'After each mission, a minigame unlocks. Master it through practice.',
  },
  {
    title: 'Mastery & Progression',
    description:
      'Earn XP and stars as you complete levels. Beat the boss to prove mastery.',
  },
  {
    title: 'Explore the Station',
    description:
      'Use the navigation to browse missions, minigames, and your profile.',
  },
  {
    title: 'Your Profile',
    description:
      'Track your rank, achievements, and mastery progress here.',
  },
];

@Component({
  selector: 'nx-onboarding-overlay',
  template: `
    @if (show()) {
      <dialog
        #dialogEl
        class="onboarding"
        aria-labelledby="onboarding-step-title"
        (cancel)="onCancel($event)">
        @if (currentStepData(); as step) {
          <div class="onboarding__content">
            <h2 id="onboarding-step-title" class="onboarding__title">
              {{ step.title }}
            </h2>
            <p class="onboarding__description">{{ step.description }}</p>
          </div>

          <div class="onboarding__indicator" role="status">
            {{ stepIndicatorLabel() }}
          </div>

          <div class="onboarding__actions">
            <button
              type="button"
              class="onboarding__btn onboarding__btn--skip"
              (click)="skip()">
              Skip
            </button>
            <button
              type="button"
              class="onboarding__btn onboarding__btn--next"
              (click)="next()">
              {{ isLastStep() ? 'Done' : 'Next' }}
            </button>
          </div>
        }
      </dialog>
    }
  `,
  styleUrl: './onboarding-overlay.scss',
})
export class OnboardingOverlayComponent implements OnInit {
  readonly dismissed = output();

  private readonly onboardingService = inject(OnboardingService);
  private readonly dialogEl =
    viewChild<ElementRef<HTMLDialogElement>>('dialogEl');

  readonly show = signal(true);
  readonly currentStepIndex = signal(0);

  readonly totalSteps = ONBOARDING_TOUR_STEPS.length;

  readonly currentStepData = computed(() => {
    const idx = this.currentStepIndex();
    return ONBOARDING_TOUR_STEPS[idx] ?? null;
  });

  readonly isLastStep = computed(
    () => this.currentStepIndex() === this.totalSteps - 1,
  );

  readonly stepIndicatorLabel = computed(
    () => `Step ${this.currentStepIndex() + 1} of ${this.totalSteps}`,
  );

  constructor() {
    afterNextRender(() => {
      if (this.show()) {
        this.dialogEl()?.nativeElement.showModal();
      }
    });
  }

  ngOnInit(): void {
    if (this.onboardingService.isOnboardingComplete()) {
      this.show.set(false);
      this.dismissed.emit();
    }
  }

  next(): void {
    if (this.isLastStep()) {
      this.completeAll();
      this.dismiss();
    } else {
      this.currentStepIndex.update((v) => v + 1);
    }
  }

  skip(): void {
    this.completeAll();
    this.dismiss();
  }

  onCancel(event: Event): void {
    event.preventDefault();
    this.skip();
  }

  private completeAll(): void {
    for (const step of ONBOARDING_STEP_ORDER) {
      this.onboardingService.completeStep(step);
    }
  }

  private dismiss(): void {
    this.dialogEl()?.nativeElement.close();
    this.dismissed.emit();
  }
}
