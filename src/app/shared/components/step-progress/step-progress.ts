import { Component, computed, input } from '@angular/core';

export type StepState = 'completed' | 'active' | 'future';

@Component({
  selector: 'nx-step-progress',
  template: `
    @for (step of stepStates(); track step.index) {
      <div class="step-progress__step">
        <div
          class="step-progress__dot"
          [class.step-progress__dot--completed]="step.state === 'completed'"
          [class.step-progress__dot--active]="step.state === 'active'"
          [class.step-progress__dot--future]="step.state === 'future'">
        </div>
        @if (variant() === 'full') {
          <span class="step-progress__label">{{ step.index }}</span>
        }
      </div>
      @if (step.index < totalSteps()) {
        <div
          class="step-progress__connector"
          [class.step-progress__connector--completed]="step.state === 'completed'">
        </div>
      }
    }
  `,
  styleUrl: './step-progress.scss',
  host: {
    'role': 'progressbar',
    '[attr.aria-valuenow]': 'completedCount()',
    'aria-valuemin': '0',
    '[attr.aria-valuemax]': 'totalSteps()',
    '[attr.aria-label]': 'ariaLabel()',
    '[class.step-progress--compact]': 'variant() === "compact"',
    '[class.step-progress--full]': 'variant() === "full"',
  },
})
export class StepProgressComponent {
  readonly totalSteps = input<number>(0);
  readonly currentStep = input<number>(1);
  readonly completedSteps = input<number[]>([]);
  readonly variant = input<'compact' | 'full'>('compact');

  readonly completedSet = computed(
    () => new Set(this.completedSteps().filter(s => s >= 1 && s <= this.totalSteps())),
  );

  readonly clampedCurrentStep = computed(() => {
    const total = this.totalSteps();
    if (total <= 0) return 0;
    return Math.min(total, Math.max(1, this.currentStep()));
  });

  readonly stepStates = computed((): { index: number; state: StepState }[] => {
    const total = this.totalSteps();
    if (total <= 0) return [];
    const completed = this.completedSet();
    const current = this.clampedCurrentStep();
    return Array.from({ length: total }, (_, i) => {
      const stepNum = i + 1;
      let state: StepState;
      if (completed.has(stepNum)) {
        state = 'completed';
      } else if (stepNum === current) {
        state = 'active';
      } else {
        state = 'future';
      }
      return { index: stepNum, state };
    });
  });

  readonly completedCount = computed(() => this.completedSet().size);

  readonly ariaLabel = computed(
    () => `Mission progress: step ${this.clampedCurrentStep()} of ${this.totalSteps()}, ${this.completedCount()} completed`,
  );
}
