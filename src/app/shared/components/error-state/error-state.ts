import { Component, input, output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'nx-error-state',
  imports: [LucideAngularModule],
  template: `
    <lucide-icon
      class="error-state__icon"
      name="circle-alert"
      [size]="32"
      aria-hidden="true" />
    <h3 class="error-state__title">{{ title() }}</h3>
    @if (message()) {
      <p class="error-state__message">{{ message() }}</p>
    }
    @if (retryable()) {
      <button
        type="button"
        class="error-state__retry-btn"
        (click)="retry.emit()">
        <lucide-icon name="refresh-cw" [size]="16" aria-hidden="true" />
        Retry
      </button>
    }
  `,
  styleUrl: './error-state.scss',
  host: {
    'role': 'alert',
    'aria-live': 'assertive',
  },
})
export class ErrorStateComponent {
  readonly title = input<string>('Something went wrong');
  readonly message = input<string>();
  readonly retryable = input<boolean>(true);

  readonly retry = output();
}
