import { Component, inject } from '@angular/core';
import { AchievementNotificationService } from '../../../core/notifications/achievement-notification.service';
import type { AchievementType } from '../../../core/progression/achievement.service';

const TYPE_LABELS: Record<AchievementType, string> = {
  discovery: 'Discovery',
  mastery: 'Mastery',
  commitment: 'Commitment',
};

@Component({
  selector: 'nx-achievement-notification',
  template: `
    @for (notification of notificationService.notifications(); track notification.id) {
      <div
        class="achievement-toast"
        [class.achievement-toast--discovery]="notification.achievement.type === 'discovery'"
        [class.achievement-toast--mastery]="notification.achievement.type === 'mastery'"
        [class.achievement-toast--commitment]="notification.achievement.type === 'commitment'"
        role="status"
        aria-live="polite">
        <span class="achievement-toast__icon" aria-hidden="true"></span>
        <div class="achievement-toast__content">
          <span class="achievement-toast__title">{{ notification.achievement.title }}</span>
          <span class="achievement-toast__type">{{ getTypeLabel(notification.achievement.type) }}</span>
        </div>
        <button
          class="achievement-toast__dismiss"
          type="button"
          aria-label="Dismiss"
          (click)="notificationService.dismiss(notification.id)">
        </button>
      </div>
    }
  `,
  styleUrl: './achievement-notification.scss',
})
export class AchievementNotificationComponent {
  protected readonly notificationService = inject(AchievementNotificationService);

  getTypeLabel(type: AchievementType): string {
    return TYPE_LABELS[type];
  }
}
