import { Injectable, signal } from '@angular/core';
import type { MinigameId } from '../minigame/minigame.types';

export interface MissionUnlockNotification {
  readonly id: number;
  readonly gameName: string;
  readonly gameId: MinigameId;
}

@Injectable({ providedIn: 'root' })
export class MissionUnlockNotificationService {
  private nextId = 0;
  private readonly timers = new Map<number, ReturnType<typeof setTimeout>>();
  private readonly _notifications = signal<MissionUnlockNotification[]>([]);

  readonly notifications = this._notifications.asReadonly();

  showUnlock(gameName: string, gameId: MinigameId): void {
    const id = this.nextId++;
    const notification: MissionUnlockNotification = { id, gameName, gameId };

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
