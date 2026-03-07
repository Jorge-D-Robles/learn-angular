import {
  DestroyRef,
  effect,
  inject,
  Injectable,
  signal,
  untracked,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { StatePersistenceService } from '../persistence/state-persistence.service';

export type AnimationSpeed = 'normal' | 'fast' | 'off';
export type Theme = 'dark' | 'station';

export interface UserSettings {
  soundEnabled: boolean;
  animationSpeed: AnimationSpeed;
  theme: Theme;
  reducedMotion: boolean;
}

const SETTINGS_KEY = 'settings';

function getDefaultSettings(): UserSettings {
  const prefersReduced =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return {
    soundEnabled: true,
    animationSpeed: 'normal',
    theme: 'station',
    reducedMotion: prefersReduced,
  };
}

@Injectable({ providedIn: 'root' })
export class SettingsService {
  static readonly SAVE_DEBOUNCE_MS = 500;

  private readonly persistence = inject(StatePersistenceService);
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private _saveTimeout: ReturnType<typeof setTimeout> | null = null;

  private readonly _settings = signal<UserSettings>(getDefaultSettings());
  readonly settings = this._settings.asReadonly();

  constructor() {
    this._loadSettings();
    this._setupAutoSave();
    this.destroyRef.onDestroy(() => {
      if (this._saveTimeout !== null) {
        clearTimeout(this._saveTimeout);
      }
    });
  }

  updateSetting<K extends keyof UserSettings>(key: K, value: UserSettings[K]): void {
    this._settings.update((current) => ({ ...current, [key]: value }));
  }

  resetSettings(): void {
    this._settings.set(getDefaultSettings());
  }

  resetProgress(): void {
    this.persistence.clearAll();
    this.document.location.reload();
  }

  private _loadSettings(): void {
    const saved = this.persistence.load<Partial<UserSettings>>(SETTINGS_KEY);
    if (saved !== null && typeof saved === 'object' && !Array.isArray(saved)) {
      const defaults = getDefaultSettings();
      this._settings.set({
        soundEnabled:
          typeof saved.soundEnabled === 'boolean' ? saved.soundEnabled : defaults.soundEnabled,
        animationSpeed:
          typeof saved.animationSpeed === 'string' &&
          ['normal', 'fast', 'off'].includes(saved.animationSpeed)
            ? saved.animationSpeed
            : defaults.animationSpeed,
        theme:
          typeof saved.theme === 'string' && ['dark', 'station'].includes(saved.theme)
            ? saved.theme
            : defaults.theme,
        reducedMotion:
          typeof saved.reducedMotion === 'boolean' ? saved.reducedMotion : defaults.reducedMotion,
      });
    }
  }

  private _setupAutoSave(): void {
    effect(() => {
      const snapshot = this.settings();
      untracked(() => this._debouncedSave(snapshot));
    });
  }

  private _debouncedSave(snapshot: UserSettings): void {
    if (this._saveTimeout !== null) {
      clearTimeout(this._saveTimeout);
    }
    this._saveTimeout = setTimeout(() => {
      this.persistence.save(SETTINGS_KEY, snapshot);
      this._saveTimeout = null;
    }, SettingsService.SAVE_DEBOUNCE_MS);
  }
}
