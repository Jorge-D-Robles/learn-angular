import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MissionUnlockNotificationService } from '../../../core/notifications/mission-unlock-notification.service';

@Component({
  selector: 'nx-mission-unlock-notification',
  imports: [RouterLink],
  template: `
    @for (notification of notificationService.notifications(); track notification.id) {
      <div class="unlock-toast" role="status" aria-live="polite">
        <span class="unlock-toast__game-name">{{ notification.gameName }} Unlocked!</span>
        <div class="unlock-toast__actions">
          <a
            class="unlock-toast__play-now"
            [routerLink]="'/minigames/' + notification.gameId">
            Play Now
          </a>
          <button
            class="unlock-toast__dismiss"
            type="button"
            aria-label="Dismiss"
            (click)="notificationService.dismiss(notification.id)">
            Dismiss
          </button>
        </div>
      </div>
    }
  `,
  styleUrl: './mission-unlock-notification.scss',
})
export class MissionUnlockNotificationComponent {
  protected readonly notificationService = inject(MissionUnlockNotificationService);
}
