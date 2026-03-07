import { Component, inject } from '@angular/core';
import { XpNotificationService } from '../../../core/notifications/xp-notification.service';

@Component({
  selector: 'nx-xp-notification',
  template: `
    @for (notification of notificationService.notifications(); track notification.id) {
      <div class="xp-toast">
        <span class="xp-toast__amount">+{{ notification.amount }} XP</span>
        @for (bonus of notification.bonuses; track $index) {
          <span class="xp-toast__bonus">{{ bonus }}</span>
        }
      </div>
    }
  `,
  styleUrl: './xp-notification.scss',
})
export class XpNotificationComponent {
  protected readonly notificationService = inject(XpNotificationService);
}
