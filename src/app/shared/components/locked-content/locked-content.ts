import { Component, input } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'nx-locked-content',
  imports: [LucideAngularModule],
  template: `
    <div
      class="locked-content__content"
      [class.locked-content__content--locked]="isLocked()">
      <ng-content />
    </div>
    @if (isLocked()) {
      <div class="locked-content__overlay" aria-hidden="true">
        <lucide-icon
          class="locked-content__icon"
          name="lock"
          [size]="24"
          aria-hidden="true" />
        <p class="locked-content__message">{{ unlockMessage() }}</p>
      </div>
    }
  `,
  styleUrl: './locked-content.scss',
  host: {
    'role': 'group',
    '[attr.aria-disabled]': 'isLocked() || null',
    '[attr.aria-label]': 'isLocked() ? unlockMessage() : null',
  },
})
export class LockedContentComponent {
  readonly isLocked = input<boolean>(false);
  readonly unlockMessage = input<string>('');
}
