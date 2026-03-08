import { Component, input } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'nx-empty-state',
  imports: [LucideAngularModule],
  template: `
    <lucide-icon
      class="empty-state__icon"
      [name]="icon()"
      [size]="48"
      aria-hidden="true" />
    <h3 class="empty-state__title">{{ title() }}</h3>
    @if (message()) {
      <p class="empty-state__message">{{ message() }}</p>
    }
    <div class="empty-state__actions">
      <ng-content />
    </div>
  `,
  styleUrl: './empty-state.scss',
  host: {
    'role': 'status',
    'aria-live': 'polite',
  },
})
export class EmptyStateComponent {
  readonly icon = input.required<string>();
  readonly title = input.required<string>();
  readonly message = input<string>();
}
