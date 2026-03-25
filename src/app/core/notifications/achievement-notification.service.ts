import { Injectable, signal } from '@angular/core';
import type { Achievement } from '../progression/achievement.service';

export interface AchievementNotification {
  readonly id: number;
  readonly achievement: Achievement;
}

@Injectable({ providedIn: 'root' })
export class AchievementNotificationService {
  private nextId = 0;
  private readonly timers = new Map<number, ReturnType<typeof setTimeout>>();
  private readonly _notifications = signal<AchievementNotification[]>([]);

  readonly notifications = this._notifications.asReadonly();

  show(achievement: Achievement): void {
    const id = this.nextId++;
    const notification: AchievementNotification = { id, achievement };

    this._notifications.update((list) => [...list, notification]);

    const timer = setTimeout(() => {
      this.timers.delete(id);
      this._notifications.update((list) => list.filter((n) => n.id !== id));
    }, 5000);

    this.timers.set(id, timer);
  }

  dismiss(id: number): void {
    const timer = this.timers.get(id);
    if (timer !== undefined) {
      clearTimeout(timer);
      this.timers.delete(id);
    }
    this._notifications.update((list) => list.filter((n) => n.id !== id));
  }
}
