import { Injectable, signal } from '@angular/core';

export interface XpNotification {
  readonly id: number;
  readonly amount: number;
  readonly bonuses: readonly string[];
}

@Injectable({ providedIn: 'root' })
export class XpNotificationService {
  private nextId = 0;
  private readonly timers = new Map<number, ReturnType<typeof setTimeout>>();
  private readonly _notifications = signal<XpNotification[]>([]);

  readonly notifications = this._notifications.asReadonly();

  show(amount: number, bonuses: readonly string[] = [], duration = 3000): void {
    const id = this.nextId++;
    const notification: XpNotification = { id, amount, bonuses };

    this._notifications.update((list) => [...list, notification]);

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
