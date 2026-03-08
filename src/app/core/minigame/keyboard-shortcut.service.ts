import { Injectable, signal, type Signal } from '@angular/core';

/** Describes a registered keyboard shortcut. */
export interface ShortcutRegistration {
  readonly key: string;
  readonly label: string;
  readonly callback: () => void;
}

@Injectable({ providedIn: 'root' })
export class KeyboardShortcutService {
  private readonly _shortcuts = new Map<string, ShortcutRegistration>();
  private readonly _isEnabled = signal(true);
  readonly isEnabled: Signal<boolean> = this._isEnabled.asReadonly();

  private readonly _boundHandler = this._handleKeydown.bind(this);

  constructor() {
    document.addEventListener('keydown', this._boundHandler);
  }

  /** Register a keyboard shortcut. Last registration for a key wins. */
  register(key: string, label: string, callback: () => void): void {
    const normalizedKey = key.toLowerCase();
    this._shortcuts.set(normalizedKey, {
      key: normalizedKey,
      label,
      callback,
    });
  }

  /** Remove a single shortcut by key. No-op if the key is not registered. */
  unregister(key: string): void {
    this._shortcuts.delete(key.toLowerCase());
  }

  /** Clear all shortcuts and reset isEnabled to true. */
  unregisterAll(): void {
    this._shortcuts.clear();
    this._isEnabled.set(true);
  }

  /** Returns current registered shortcuts for help overlay display. */
  getRegistered(): readonly ShortcutRegistration[] {
    return [...this._shortcuts.values()];
  }

  /** Enable or disable all shortcut dispatch. */
  setEnabled(enabled: boolean): void {
    this._isEnabled.set(enabled);
  }

  /** Remove the keydown listener. Call in tests only (root service lives forever in prod). */
  destroy(): void {
    document.removeEventListener('keydown', this._boundHandler);
  }

  private _handleKeydown(event: KeyboardEvent): void {
    if (!this._isEnabled()) return;
    const registration = this._shortcuts.get(event.key.toLowerCase());
    if (registration) {
      event.preventDefault();
      registration.callback();
    }
  }
}
