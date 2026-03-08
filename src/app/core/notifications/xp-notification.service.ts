import { inject, Injectable, signal } from '@angular/core';
import { AudioService, SoundEffect } from '../audio';

export interface XpNotification {
  readonly id: number;
  readonly amount: number;
  readonly bonuses: readonly string[];
}

export interface XpNotificationOptions {
  readonly isLevelUp?: boolean;
}

@Injectable({ providedIn: 'root' })
export class XpNotificationService {
  private nextId = 0;
  private readonly timers = new Map<number, ReturnType<typeof setTimeout>>();
  private readonly _notifications = signal<XpNotification[]>([]);
  private readonly audioService = inject(AudioService);

  readonly notifications = this._notifications.asReadonly();

  show(amount: number, bonuses: readonly string[] = [], duration = 3000, options?: XpNotificationOptions): void {
    const id = this.nextId++;
    const notification: XpNotification = { id, amount, bonuses };

    this._notifications.update((list) => [...list, notification]);

    if (options?.isLevelUp) {
      this.audioService.play(SoundEffect.levelUp);
    }

    const timer = setTimeout(() => {
      this.timers.delete(id);
      this._notifications.update((list) => list.filter((n) => n.id !== id));
    }, duration);

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
