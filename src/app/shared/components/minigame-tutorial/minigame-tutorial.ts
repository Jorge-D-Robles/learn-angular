import {
  Component,
  ElementRef,
  OnInit,
  afterNextRender,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import type { MinigameId } from '../../../core/minigame/minigame.types';
import { StatePersistenceService } from '../../../core/persistence/state-persistence.service';
import { tutorialSeenKey, type TutorialStep } from './minigame-tutorial.types';

@Component({
  selector: 'nx-minigame-tutorial',
  template: `
    <dialog
      #dialogEl
      class="tutorial"
      aria-labelledby="tutorial-step-title"
      (cancel)="onCancel()">
      @if (currentStepData(); as step) {
        <div class="tutorial__content">
          @if (step.image) {
            <img
              class="tutorial__image"
              [src]="step.image"
              [alt]="step.title" />
          }
          <h2 id="tutorial-step-title" class="tutorial__title">{{ step.title }}</h2>
          <p class="tutorial__description">{{ step.description }}</p>
        </div>

        <div class="tutorial__indicator" [attr.aria-label]="indicatorAriaLabel()">
          {{ currentStep() + 1 }} / {{ steps().length }}
        </div>

        <div class="tutorial__checkbox">
          <input
            type="checkbox"
            id="dont-show-again"
            [checked]="dontShowAgain()"
            (change)="onCheckboxChange($event)" />
          <label for="dont-show-again">Don't show again</label>
        </div>

        <div class="tutorial__actions">
          <button
            type="button"
            class="tutorial__btn tutorial__btn--skip"
            (click)="skip()">
            Skip
          </button>
          <div class="tutorial__nav">
            <button
              type="button"
              class="tutorial__btn tutorial__btn--prev"
              [disabled]="isFirstStep()"
              (click)="previous()">
              Previous
            </button>
            <button
              type="button"
              class="tutorial__btn tutorial__btn--next"
              (click)="next()">
              {{ isLastStep() ? 'Finish' : 'Next' }}
            </button>
          </div>
        </div>
      }
    </dialog>
  `,
  styleUrl: './minigame-tutorial.scss',
})
export class MinigameTutorialOverlayComponent implements OnInit {
  readonly gameId = input.required<MinigameId>();
  readonly steps = input.required<readonly TutorialStep[]>();
  readonly dismissed = output();

  readonly currentStep = signal(0);
  readonly dontShowAgain = signal(false);

  readonly currentStepData = computed(() => {
    const s = this.steps();
    const idx = this.currentStep();
    return s.length > 0 ? s[idx] : null;
  });

  readonly isFirstStep = computed(() => this.currentStep() === 0);
  readonly isLastStep = computed(() => this.currentStep() === this.steps().length - 1);
  readonly indicatorAriaLabel = computed(
    () => `Step ${this.currentStep() + 1} of ${this.steps().length}`,
  );

  private readonly dialogEl =
    viewChild.required<ElementRef<HTMLDialogElement>>('dialogEl');
  private readonly persistence = inject(StatePersistenceService);

  constructor() {
    afterNextRender(() => {
      this.dialogEl().nativeElement.showModal();
    });
  }

  ngOnInit(): void {
    if (this.steps().length === 0) {
      this.dismissed.emit();
    }
  }

  next(): void {
    if (this.isLastStep()) {
      this.dismiss();
    } else {
      this.currentStep.update((v) => v + 1);
    }
  }

  previous(): void {
    this.currentStep.update((v) => Math.max(0, v - 1));
  }

  skip(): void {
    this.dismiss();
  }

  onCheckboxChange(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.dontShowAgain.set(checked);
  }

  onCancel(): void {
    this.dismiss();
  }

  private dismiss(): void {
    if (this.dontShowAgain()) {
      this.persistence.save(tutorialSeenKey(this.gameId()), true);
    }
    this.dismissed.emit();
    this.dialogEl().nativeElement.close();
  }
}
