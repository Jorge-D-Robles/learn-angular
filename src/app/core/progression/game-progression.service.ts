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
import { XpService } from './xp.service';
import { MissionUnlockNotificationService, XpNotificationService } from '../notifications';
import { ALL_STORY_MISSIONS } from '../curriculum/curriculum.data';
import type { ChapterId, PhaseNumber, StoryMission } from '../curriculum/curriculum.types';
import type { MinigameId } from '../minigame/minigame.types';
import { DEFAULT_MINIGAME_CONFIGS } from '../minigame/minigame-registry.service';
import { AchievementTriggerService } from './achievement-trigger.service';

const PERSISTENCE_KEY = 'game-progression';

/** All valid chapter IDs for validation on load. */
const VALID_CHAPTER_IDS: ReadonlySet<ChapterId> = new Set(
  ALL_STORY_MISSIONS.map((m) => m.chapterId),
);

export interface CampaignProgress {
  readonly completedMissions: number;
  readonly totalMissions: number;
  readonly currentPhase: PhaseNumber | null;
}

@Injectable({ providedIn: 'root' })
export class GameProgressionService {
  static readonly SAVE_DEBOUNCE_MS = 500;

  private readonly persistence = inject(StatePersistenceService);
  private readonly xpService = inject(XpService);
  private readonly xpNotification = inject(XpNotificationService);
  private readonly unlockNotification = inject(MissionUnlockNotificationService);
  private readonly destroyRef = inject(DestroyRef);
  private _saveTimeout: ReturnType<typeof setTimeout> | null = null;

  private readonly injector = inject(Injector);
  private _achievementTrigger: AchievementTriggerService | null = null;

  private get achievementTrigger(): AchievementTriggerService {
    if (this._achievementTrigger === null) {
      this._achievementTrigger = this.injector.get(AchievementTriggerService);
    }
    return this._achievementTrigger;
  }

  private readonly _completedMissions = signal<ReadonlySet<ChapterId>>(new Set());

  /** Read-only view of the completed mission set. */
  readonly completedMissions = this._completedMissions.asReadonly();

  /** The next uncompleted story mission whose prerequisites are all met. */
  readonly currentMission = computed<StoryMission | null>(() => {
    const completed = this._completedMissions();
    return (
      ALL_STORY_MISSIONS.find(
        (m) =>
          !completed.has(m.chapterId) &&
          m.deps.every((dep) => completed.has(dep)),
      ) ?? null
    );
  });

  /** Number of completed story missions. */
  readonly completedMissionCount = computed(() => this._completedMissions().size);

  constructor() {
    this._loadState();
    this._setupAutoSave();
    this.destroyRef.onDestroy(() => {
      if (this._saveTimeout !== null) {
        clearTimeout(this._saveTimeout);
      }
    });
  }

  /** Whether a mission is available (can be played or replayed). */
  isMissionAvailable(chapterId: ChapterId): boolean {
    const mission = ALL_STORY_MISSIONS.find((m) => m.chapterId === chapterId);
    if (!mission) {
      return false;
    }
    if (this._completedMissions().has(chapterId)) {
      return true;
    }
    return mission.deps.every((dep) => this._completedMissions().has(dep));
  }

  /** Whether a mission has been completed. */
  isMissionCompleted(chapterId: ChapterId): boolean {
    return this._completedMissions().has(chapterId);
  }

  /** Whether a minigame is unlocked (any unlocking mission has been completed). */
  isMinigameUnlocked(gameId: MinigameId): boolean {
    return ALL_STORY_MISSIONS.some(
      (m) =>
        m.unlocksMinigame === gameId &&
        this._completedMissions().has(m.chapterId),
    );
  }

  /**
   * Marks a mission as complete, awards story XP.
   * Idempotent: completing an already-completed mission is a no-op.
   * Throws if the chapter does not exist or prerequisites are not met.
   */
  completeMission(chapterId: ChapterId): void {
    const mission = ALL_STORY_MISSIONS.find((m) => m.chapterId === chapterId);
    if (!mission) {
      throw new Error(`Mission not found: chapter ${chapterId}`);
    }

    if (this._completedMissions().has(chapterId)) {
      return;
    }

    if (!this.isMissionAvailable(chapterId)) {
      throw new Error(
        `Prerequisites not met for chapter ${chapterId}`,
      );
    }

    // Check for first minigame unlock BEFORE updating completed set
    if (mission.unlocksMinigame !== null && !this.isMinigameUnlocked(mission.unlocksMinigame)) {
      const gameName = DEFAULT_MINIGAME_CONFIGS.find(c => c.id === mission.unlocksMinigame)?.name ?? mission.unlocksMinigame;
      this.unlockNotification.showUnlock(gameName, mission.unlocksMinigame);
    }

    this._completedMissions.update((set) => {
      const next = new Set(set);
      next.add(chapterId);
      return next;
    });

    const baseXp = this.xpService.calculateStoryXp();
    const xpBreakdown = this.xpService.applyStreakBonus(baseXp);
    this.xpService.addXp(xpBreakdown.totalXp);

    const bonuses: string[] = ['Mission Complete'];
    if (xpBreakdown.streakBonus > 0) {
      bonuses.push(`+${xpBreakdown.streakBonus} Streak Bonus`);
    }
    this.xpNotification.show(xpBreakdown.totalXp, bonuses);

    this.achievementTrigger.triggerCheck();
  }

  /** Returns the list of unlocked minigame IDs (deduplicated). */
  getUnlockedMinigames(): MinigameId[] {
    const completed = this._completedMissions();
    const unlocked = new Set<MinigameId>();
    for (const mission of ALL_STORY_MISSIONS) {
      if (mission.unlocksMinigame !== null && completed.has(mission.chapterId)) {
        unlocked.add(mission.unlocksMinigame);
      }
    }
    return [...unlocked];
  }

  /** Returns campaign progress summary. */
  getCampaignProgress(): CampaignProgress {
    return {
      completedMissions: this._completedMissions().size,
      totalMissions: ALL_STORY_MISSIONS.length,
      currentPhase: this.currentMission()?.phase ?? null,
    };
  }

  /** Resets all progress and clears persistence. */
  resetProgress(): void {
    this._completedMissions.set(new Set());
    this.persistence.clear(PERSISTENCE_KEY);
  }

  // --- Private methods ---

  private _loadState(): void {
    const saved = this.persistence.load<ChapterId[]>(PERSISTENCE_KEY);
    if (saved === null) {
      return;
    }

    if (!Array.isArray(saved)) {
      console.warn('[GameProgressionService] corrupted data: expected array');
      return;
    }

    const validated = new Set<ChapterId>();
    let hasInvalid = false;
    for (const id of saved) {
      if (typeof id === 'number' && VALID_CHAPTER_IDS.has(id)) {
        validated.add(id);
      } else {
        hasInvalid = true;
      }
    }

    if (hasInvalid && validated.size === 0) {
      console.warn(
        '[GameProgressionService] corrupted data: no valid chapter IDs found',
      );
      return;
    }

    if (hasInvalid) {
      console.warn(
        '[GameProgressionService] corrupted data: some invalid chapter IDs dropped',
      );
    }

    this._completedMissions.set(validated);
  }

  private _setupAutoSave(): void {
    effect(() => {
      const snapshot = this._completedMissions();
      untracked(() => this._debouncedSave(snapshot));
    });
  }

  private _debouncedSave(snapshot: ReadonlySet<ChapterId>): void {
    if (this._saveTimeout !== null) {
      clearTimeout(this._saveTimeout);
    }
    this._saveTimeout = setTimeout(() => {
      this.persistence.save(PERSISTENCE_KEY, [...snapshot]);
      this._saveTimeout = null;
    }, GameProgressionService.SAVE_DEBOUNCE_MS);
  }
}
