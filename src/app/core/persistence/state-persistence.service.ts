import {
  effect,
  Injectable,
  Injector,
  Signal,
  type EffectRef,
} from '@angular/core';

const STORAGE_PREFIX = 'nexus-station:';

@Injectable({ providedIn: 'root' })
export class StatePersistenceService {
  // --- Core operations ---

  /** Serializes `data` and stores it under `nexus-station:{key}`. Returns true on success. */
  save(key: string, data: unknown): boolean {
    try {
      const json = JSON.stringify(data);
      localStorage.setItem(this._prefixedKey(key), json);
      return true;
    } catch (e) {
      console.warn(`[StatePersistenceService] save failed for key "${key}":`, e);
      return false;
    }
  }

  /**
   * Loads and deserializes data for the given key.
   *
   * Returns `null` if the key is not found OR if the stored value is corrupted.
   * NOTE: A `null` return is ambiguous -- it means either "key not found" or
   * "the stored value was literally null". Callers should treat null as
   * "no saved data" and fall back to defaults.
   */
  load<T>(key: string): T | null {
    const raw = localStorage.getItem(this._prefixedKey(key));
    if (raw === null) {
      return null;
    }
    try {
      return JSON.parse(raw) as T;
    } catch (e) {
      console.warn(`[StatePersistenceService] load failed for key "${key}":`, e);
      return null;
    }
  }

  /** Removes a single namespaced key from localStorage. */
  clear(key: string): void {
    localStorage.removeItem(this._prefixedKey(key));
  }

  /** Removes all keys that start with the `nexus-station:` prefix. */
  clearAll(): void {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith(STORAGE_PREFIX)) {
        keysToRemove.push(k);
      }
    }
    for (const k of keysToRemove) {
      localStorage.removeItem(k);
    }
  }

  // --- Auto-save ---

  /**
   * Creates an `effect()` that watches `source` and persists its value
   * whenever it changes. Returns an `EffectRef` for lifecycle management.
   *
   * When called outside an injection context, pass an `Injector`.
   */
  autoSave<T>(key: string, source: Signal<T>, injector?: Injector): EffectRef {
    return effect(() => {
      this.save(key, source());
    }, { injector });
  }

  // --- Export / Import ---

  /**
   * Collects all `nexus-station:*` entries into a JSON string.
   * Values are JSON.parse'd so numbers stay numbers, etc.
   */
  exportState(): string {
    const data: Record<string, unknown> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith(STORAGE_PREFIX)) {
        data[k] = JSON.parse(localStorage.getItem(k)!);
      }
    }
    return JSON.stringify(data);
  }

  /**
   * Restores state from a JSON string produced by `exportState()`.
   * Keys are written VERBATIM (they already include the prefix).
   * Returns true on success, false on parse failure.
   */
  importState(json: string): boolean {
    try {
      const data = JSON.parse(json) as Record<string, unknown>;
      for (const [key, value] of Object.entries(data)) {
        localStorage.setItem(key, JSON.stringify(value));
      }
      return true;
    } catch (e) {
      console.warn('[StatePersistenceService] importState failed:', e);
      return false;
    }
  }

  // --- Private helpers ---

  private _prefixedKey(key: string): string {
    return `${STORAGE_PREFIX}${key}`;
  }
}
