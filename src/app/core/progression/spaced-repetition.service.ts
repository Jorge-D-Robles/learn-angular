import {
  DestroyRef,
  effect,
  inject,
  Injectable,
  signal,
  untracked,
} from '@angular/core';
import { StatePersistenceService } from '../persistence/state-persistence.service';
import { MasteryService } from './mastery.service';
import type { MinigameId } from '../minigame/minigame.types';

const PERSISTENCE_KEY = 'spaced-repetition';
const MS_PER_DAY = 86_400_000;
const GRACE_PERIOD_DAYS = 7;
const MAX_DEGRADATION_STARS = 2;
const DEGRADATION_RATE = 1 / 7; // stars lost per day past grace period

/** Serializable form of the lastPracticed map: topicId -> epoch ms. */
type SpacedRepetitionSnapshot = Record<string, number>;

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

/** A topic that is currently experiencing mastery degradation. */
export interface DegradingTopic {
  readonly topicId: MinigameId;
  readonly rawMastery: number;
  readonly effectiveMastery: number;
  readonly degradation: number;
  readonly daysSinceLastPractice: number;
  readonly lastPracticed: number;
}

@Injectable({ providedIn: 'root' })
export class SpacedRepetitionService {
  static readonly SAVE_DEBOUNCE_MS = 500;

  private readonly persistence = inject(StatePersistenceService);
  private readonly masteryService = inject(MasteryService);
  private readonly destroyRef = inject(DestroyRef);
  private _saveTimeout: ReturnType<typeof setTimeout> | null = null;

  private readonly _lastPracticed = signal<ReadonlyMap<MinigameId, number>>(
    new Map(),
  );

  /** Readonly signal exposing the lastPracticed map (topicId -> epoch ms). */
  readonly lastPracticed = this._lastPracticed.asReadonly();

  constructor() {
    this._loadState();
    this._setupAutoSave();
    this.destroyRef.onDestroy(() => {
      if (this._saveTimeout !== null) {
        clearTimeout(this._saveTimeout);
      }
    });
  }

  /**
   * Records a practice event for a topic, resetting its degradation clock.
   *
   * Consumers (e.g., minigame completion flow) must call this to enable
   * degradation tracking. Topics that have never been practiced have no
   * entry in `lastPracticed` and therefore no degradation.
   */
  recordPractice(topicId: MinigameId): void {
    this._lastPracticed.update((map) => {
      const next = new Map(map);
      next.set(topicId, Date.now());
      return next;
    });
  }

  /**
   * Returns the effective mastery for a topic, adjusted for time-based degradation.
   * Returns a **float** -- consumers should `Math.floor()` for display stars.
   */
  getEffectiveMastery(topicId: MinigameId): number {
    const rawMastery = this.masteryService.getMastery(topicId);
    if (rawMastery === 0) {
      return 0;
    }

    const lastPracticedMs = this._lastPracticed().get(topicId);
    if (lastPracticedMs === undefined) {
      return rawMastery;
    }

    const degradation = this._calculateDegradation(lastPracticedMs);
    return Math.max(rawMastery - degradation, 0);
  }

  /**
   * Returns topics that are currently degrading (daysSince >= 7 AND rawMastery > 0).
   * Sorted by degradation descending (worst first).
   */
  getDegradingTopics(): DegradingTopic[] {
    const result: DegradingTopic[] = [];
    const now = Date.now();

    for (const [topicId, lastPracticedMs] of this._lastPracticed()) {
      const rawMastery = this.masteryService.getMastery(topicId);
      if (rawMastery === 0) {
        continue;
      }

      const daysSince = (now - lastPracticedMs) / MS_PER_DAY;
      if (daysSince < GRACE_PERIOD_DAYS) {
        continue;
      }

      const degradation = this._calculateDegradation(lastPracticedMs);
      const effectiveMastery = Math.max(rawMastery - degradation, 0);

      result.push({
        topicId,
        rawMastery,
        effectiveMastery,
        degradation,
        daysSinceLastPractice: daysSince,
        lastPracticed: lastPracticedMs,
      });
    }

    return result.sort((a, b) => b.degradation - a.degradation);
  }

  private _calculateDegradation(lastPracticedMs: number): number {
    const now = Date.now();
    const daysSince = (now - lastPracticedMs) / MS_PER_DAY;

    if (daysSince < GRACE_PERIOD_DAYS) {
      return 0;
    }

    const daysOverGrace = daysSince - GRACE_PERIOD_DAYS;
    return Math.min(daysOverGrace * DEGRADATION_RATE, MAX_DEGRADATION_STARS);
  }

  private _loadState(): void {
    const saved =
      this.persistence.load<SpacedRepetitionSnapshot>(PERSISTENCE_KEY);
    if (saved !== null && typeof saved === 'object' && !Array.isArray(saved)) {
      const validated = new Map<MinigameId, number>();
      for (const [key, value] of Object.entries(saved)) {
        if (
          VALID_MINIGAME_IDS.has(key) &&
          typeof value === 'number' &&
          value > 0
        ) {
          validated.set(key as MinigameId, value);
        }
      }
      this._lastPracticed.set(validated);
    }
  }

  private _setupAutoSave(): void {
    effect(() => {
      const snapshot = this._lastPracticed();
      untracked(() => this._debouncedSave(snapshot));
    });
  }

  private _debouncedSave(snapshot: ReadonlyMap<MinigameId, number>): void {
    if (this._saveTimeout !== null) {
      clearTimeout(this._saveTimeout);
    }
    this._saveTimeout = setTimeout(() => {
      const plain: SpacedRepetitionSnapshot = Object.fromEntries(snapshot);
      this.persistence.save(PERSISTENCE_KEY, plain);
      this._saveTimeout = null;
    }, SpacedRepetitionService.SAVE_DEBOUNCE_MS);
  }
}
