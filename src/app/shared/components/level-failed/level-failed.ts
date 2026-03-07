import { Component, input, output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'nx-level-failed',
  imports: [LucideAngularModule],
  template: `
    <div class="level-failed" role="dialog" aria-modal="true" aria-labelledby="failed-title">
      <div class="level-failed__panel">
        <lucide-icon
          class="level-failed__icon"
          name="circle-alert"
          [size]="40"
          aria-hidden="true" />

        <h2 id="failed-title" class="level-failed__title">Mission Failed</h2>

        <div class="level-failed__reason">{{ reason() }}</div>

        <div class="level-failed__score-section">
          <div class="level-failed__score-label">Score Achieved</div>
          <div class="level-failed__score">{{ score() }}</div>
        </div>

        <div class="level-failed__actions">
          <button type="button" class="level-failed__btn level-failed__btn--primary"
                  (click)="retry.emit()">
            Retry
          </button>
          @if (hintsAvailable()) {
            <button type="button" class="level-failed__btn level-failed__btn--secondary"
                    (click)="useHint.emit()">
              Use Hint
            </button>
          }
          <button type="button" class="level-failed__btn level-failed__btn--secondary"
                  (click)="quit.emit()">
            Level Select
          </button>
        </div>
      </div>
    </div>
  `,
  styleUrl: './level-failed.scss',
})
export class LevelFailedComponent {
  readonly reason = input.required<string>();
  readonly score = input(0);
  readonly hintsAvailable = input(false);

  readonly retry = output();
  readonly useHint = output();
  readonly quit = output();
}
