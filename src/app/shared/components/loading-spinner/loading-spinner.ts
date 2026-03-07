import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'nx-loading-spinner',
  template: `
    <div class="loading-spinner__ring" aria-hidden="true"></div>
    @if (message()) {
      <p class="loading-spinner__message">{{ message() }}</p>
    }
  `,
  styleUrl: './loading-spinner.scss',
  host: {
    'role': 'status',
    'aria-live': 'polite',
    '[attr.aria-label]': 'ariaLabel()',
    '[class.loading-spinner--sm]': 'size() === "sm"',
    '[class.loading-spinner--md]': 'size() === "md"',
    '[class.loading-spinner--lg]': 'size() === "lg"',
  },
})
export class LoadingSpinnerComponent {
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  readonly message = input<string>();

  readonly ariaLabel = computed(() => this.message() || 'Loading');
}
