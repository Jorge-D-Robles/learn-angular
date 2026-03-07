import {
  DestroyRef,
  effect,
  inject,
  Injectable,
  signal,
  untracked,
} from '@angular/core';
import { StatePersistenceService } from '../persistence/state-persistence.service';
import { LevelProgressionService } from '../levels/level-progression.service';
import { DifficultyTier, type MinigameId } from '../minigame/minigame.types';

const MASTERY_KEY = 'mastery';

/** Serializable form of the mastery map. */
type MasterySnapshot = Record<string, number>;

/** All valid MinigameId values for key validation on load. */
const VALID_MINIGAME_IDS: ReadonlySet<string> = new Set<MinigameId>([
  'module-assembly',
  'wire-protocol',
  'flow-commander',
  'signal-corps',
  'corridor-runner',
  'terminal-hack',
  'power-grid',
  'data-relay',
  'reactor-core',
  'deep-space-radio',
  'system-certification',
  'blast-doors',
]);

@Injectable({ providedIn: 'root' })
export class MasteryService {
  static readonly SAVE_DEBOUNCE_MS = 500;

  private readonly persistence = inject(StatePersistenceService);
  private readonly levelProgression = inject(LevelProgressionService);
  private readonly destroyRef = inject(DestroyRef);
  private _saveTimeout: ReturnType<typeof setTimeout> | null = null;

  private readonly _mastery = signal<ReadonlyMap<MinigameId, number>>(new Map());
  readonly mastery = this._mastery.asReadonly();

  constructor() {
    this._loadState();
    this._setupAutoSave();
    this.destroyRef.onDestroy(() => {
      if (this._saveTimeout !== null) {
        clearTimeout(this._saveTimeout);
      }
    });
  }

  /** Returns the current mastery star count (0-5) for a topic. */
  getMastery(topicId: MinigameId): number {
    return this._mastery().get(topicId) ?? 0;
  }

  /** Recalculates mastery for a topic based on level progress. Never decreases. */
  updateMastery(topicId: MinigameId): void {
    const calculated = this._calculateStars(topicId);
    const existing = this._mastery().get(topicId) ?? 0;
    const final = Math.max(existing, calculated);

    if (final === 0 && !this._mastery().has(topicId)) {
      return;
    }

    this._mastery.update((map) => {
      const next = new Map(map);
      next.set(topicId, final);
      return next;
    });
  }

  /** Returns the mastery map (sparse -- only entries for updated topics). */
  getAllMastery(): ReadonlyMap<MinigameId, number> {
    return this._mastery();
  }

  /** Clears all mastery data from memory and persistence. */
  resetMastery(): void {
    this._mastery.set(new Map());
    this.persistence.clear(MASTERY_KEY);
  }

  /**
   * Returns the raw calculated star rating (0-5) for a topic.
   * Does NOT clamp against historical mastery -- that guard lives in updateMastery().
   */
  private _calculateStars(topicId: MinigameId): number {
    const levels = this.levelProgression.getLevelProgress(topicId);
    const completedLevels = levels.filter((l) => l.completed);

    if (completedLevels.length === 0) {
      return 0;
    }

    // Star 5: All levels perfected
    if (levels.length > 0 && levels.every((l) => l.perfect)) {
      return 5;
    }

    // Star 4: All Boss-tier levels completed
    if (this.levelProgression.getTierProgress(topicId, DifficultyTier.Boss) === 1) {
      return 4;
    }

    // Star 3: All Advanced-tier levels completed
    if (this.levelProgression.getTierProgress(topicId, DifficultyTier.Advanced) === 1) {
      return 3;
    }

    // Star 2: All Basic-tier levels completed
    if (this.levelProgression.getTierProgress(topicId, DifficultyTier.Basic) === 1) {
      return 2;
    }

    // Star 1: At least one level completed
    return 1;
  }

  private _loadState(): void {
    const saved = this.persistence.load<MasterySnapshot>(MASTERY_KEY);
    if (saved !== null && typeof saved === 'object' && !Array.isArray(saved)) {
      const validated = new Map<MinigameId, number>();
      for (const [key, value] of Object.entries(saved)) {
        if (
          VALID_MINIGAME_IDS.has(key) &&
          typeof value === 'number' &&
          value >= 0 &&
          value <= 5
        ) {
          validated.set(key as MinigameId, value);
        }
      }
      this._mastery.set(validated);
    }
  }

  private _setupAutoSave(): void {
    effect(() => {
      const snapshot = this._mastery();
      untracked(() => this._debouncedSave(snapshot));
    });
  }

  private _debouncedSave(snapshot: ReadonlyMap<MinigameId, number>): void {
    if (this._saveTimeout !== null) {
      clearTimeout(this._saveTimeout);
    }
    this._saveTimeout = setTimeout(() => {
      const plain: MasterySnapshot = Object.fromEntries(snapshot);
      this.persistence.save(MASTERY_KEY, plain);
      this._saveTimeout = null;
    }, MasteryService.SAVE_DEBOUNCE_MS);
  }
}
