import { Component, input, signal, computed } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'nx-phase-header',
  imports: [LucideAngularModule],
  template: `
    <button
      class="phase-header__toggle"
      type="button"
      [attr.aria-expanded]="isExpanded()"
      [attr.aria-controls]="panelId"
      (click)="toggle()">
      <div class="phase-header__badge">{{ phaseNumber() }}</div>
      <div class="phase-header__info">
        <h2 class="phase-header__name">Phase {{ phaseNumber() }}: {{ phaseName() }}</h2>
        <p class="phase-header__description">{{ phaseDescription() }}</p>
      </div>
      <span class="phase-header__progress">{{ completedCount() }}/{{ totalCount() }}</span>
      <lucide-icon
        class="phase-header__chevron"
        [name]="isExpanded() ? 'chevron-up' : 'chevron-down'"
        [size]="20"
        aria-hidden="true" />
    </button>
    @if (isExpanded()) {
      <div class="phase-header__body" [id]="panelId" role="region">
        <ng-content />
      </div>
    }
  `,
  styleUrl: './phase-header.scss',
  host: {
    'role': 'group',
    '[attr.aria-label]': 'ariaLabel()',
  },
})
export class PhaseHeaderComponent {
  readonly phaseNumber = input.required<number>();
  readonly phaseName = input.required<string>();
  readonly phaseDescription = input<string>('');
  readonly completedCount = input<number>(0);
  readonly totalCount = input<number>(0);

  readonly isExpanded = signal(true);
  readonly panelId = 'phase-panel-' + Math.random().toString(36).slice(2, 8);

  readonly ariaLabel = computed(
    () => `Phase ${this.phaseNumber()}: ${this.phaseName()}, ${this.completedCount()} of ${this.totalCount()} completed`,
  );

  toggle(): void {
    this.isExpanded.update((v) => !v);
  }
}
