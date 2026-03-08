import { Component, DestroyRef, afterNextRender, inject, input, output } from '@angular/core';
import { Rank } from '../../../core/state/rank.constants';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'nx-rank-up-overlay',
  imports: [LucideAngularModule],
  template: `
    <div class="rank-up-overlay" role="alertdialog" aria-labelledby="rank-up-title">
      <div class="rank-up-overlay__panel">
        <lucide-icon name="shield" class="rank-up-overlay__icon" [size]="48" aria-hidden="true" />
        <h2 id="rank-up-title" class="rank-up-overlay__title">Promoted to {{ rank() }}!</h2>
        <p class="rank-up-overlay__message">You've earned a new station rank.</p>
        <button type="button" class="rank-up-overlay__dismiss" (click)="onDismiss()">
          Continue
        </button>
      </div>
    </div>
  `,
  styleUrl: './rank-up-overlay.scss',
})
export class RankUpOverlayComponent {
  readonly rank = input.required<Rank>();
  readonly dismissed = output();

  private readonly destroyRef = inject(DestroyRef);

  private timerId: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    afterNextRender(() => {
      this.timerId = setTimeout(() => this.dismissed.emit(), 5000);
    });
    this.destroyRef.onDestroy(() => {
      if (this.timerId !== null) clearTimeout(this.timerId);
    });
  }

  onDismiss(): void {
    // Cancel auto-dismiss timer to prevent double-emit
    if (this.timerId !== null) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    this.dismissed.emit();
  }
}
