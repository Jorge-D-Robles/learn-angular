import {
  computed,
  DestroyRef,
  effect,
  inject,
  Injectable,
  Injector,
  signal,
  untracked,
} from '@angular/core';
import { StatePersistenceService } from '../persistence/state-persistence.service';
import { StreakRewardService } from './streak-reward.service';

const STREAK_KEY = 'streak';
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/** Serializable form of streak state. */
export interface StreakSnapshot {
  currentStreak: number;
  activeStreakDays: number;
  lastPlayDate: string | null;
}

@Injectable({ providedIn: 'root' })
export class StreakService {
  static readonly SAVE_DEBOUNCE_MS = 500;

  private readonly persistence = inject(StatePersistenceService);
  private readonly destroyRef = inject(DestroyRef);
  private _saveTimeout: ReturnType<typeof setTimeout> | null = null;

  private readonly injector = inject(Injector);
  private _streakRewardService: StreakRewardService | null = null;

  private get streakRewardService(): StreakRewardService {
    if (this._streakRewardService === null) {
      this._streakRewardService = this.injector.get(StreakRewardService);
    }
    return this._streakRewardService;
  }

  private readonly _currentStreak = signal(0);
  private readonly _activeStreakDays = signal(0);
  private readonly _lastPlayDate = signal<string | null>(null);

  readonly currentStreak = this._currentStreak.asReadonly();
  readonly activeStreakDays = this._activeStreakDays.asReadonly();

  readonly streakMultiplier = computed(
    () => 1.0 + Math.min(this._activeStreakDays(), 5) * 0.1,
  );

  constructor() {
    this._loadState();
    this._setupAutoSave();
    this.destroyRef.onDestroy(() => {
      if (this._saveTimeout !== null) {
        clearTimeout(this._saveTimeout);
      }
    });
  }

  /** Records a daily play. Call when the player completes any activity. */
  recordDailyPlay(): void {
    const today = this._today();
    const last = this._lastPlayDate();

    // Already recorded for today
    if (last === today) {
      return;
    }

    if (last === null) {
      // First play ever
      this._activeStreakDays.set(1);
      this._currentStreak.set(1);
    } else if (this._isYesterday(last)) {
      // Consecutive day
      const newActive = this._activeStreakDays() + 1;
      this._activeStreakDays.set(newActive);
      this._currentStreak.set(Math.max(this._currentStreak(), newActive));
    } else {
      // Gap — reset active but keep display streak
      this._activeStreakDays.set(1);
    }

    this._lastPlayDate.set(today);
    this.streakRewardService.checkMilestoneReward(this._activeStreakDays());
  }

  private _today(): string {
    return this._formatDate(new Date());
  }

  private _isYesterday(dateStr: string): boolean {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return dateStr === this._formatDate(yesterday);
  }

  /** Locale-independent YYYY-MM-DD formatter. Avoids toLocaleDateString('en-CA') dependency on ICU data. */
  private _formatDate(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private _loadState(): void {
    const saved = this.persistence.load<Partial<StreakSnapshot>>(STREAK_KEY);
    if (saved !== null && typeof saved === 'object' && !Array.isArray(saved)) {
      const currentStreak =
        typeof saved.currentStreak === 'number' && saved.currentStreak >= 0
          ? saved.currentStreak
          : 0;
      const activeStreakDays =
        typeof saved.activeStreakDays === 'number' && saved.activeStreakDays >= 0
          ? saved.activeStreakDays
          : 0;
      const lastPlayDate =
        typeof saved.lastPlayDate === 'string' && DATE_REGEX.test(saved.lastPlayDate)
          ? saved.lastPlayDate
          : null;

      this._currentStreak.set(currentStreak);
      this._lastPlayDate.set(lastPlayDate);

      // Gap detection on load
      if (lastPlayDate !== null) {
        const today = this._today();
        const isToday = lastPlayDate === today;
        const isYesterday = this._isYesterday(lastPlayDate);
        if (!isToday && !isYesterday) {
          this._activeStreakDays.set(0);
        } else {
          this._activeStreakDays.set(activeStreakDays);
        }
      } else {
        this._activeStreakDays.set(0);
      }
    }
  }

  private _setupAutoSave(): void {
    effect(() => {
      const snapshot: StreakSnapshot = {
        currentStreak: this._currentStreak(),
        activeStreakDays: this._activeStreakDays(),
        lastPlayDate: this._lastPlayDate(),
      };
      untracked(() => this._debouncedSave(snapshot));
    });
  }

  private _debouncedSave(snapshot: StreakSnapshot): void {
    if (this._saveTimeout !== null) {
      clearTimeout(this._saveTimeout);
    }
    this._saveTimeout = setTimeout(() => {
      this.persistence.save(STREAK_KEY, snapshot);
      this._saveTimeout = null;
    }, StreakService.SAVE_DEBOUNCE_MS);
  }
}
