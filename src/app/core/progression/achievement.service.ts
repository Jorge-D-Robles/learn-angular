import {
  computed,
  DestroyRef,
  effect,
  inject,
  Injectable,
  signal,
  untracked,
} from '@angular/core';
import { StatePersistenceService } from '../persistence/state-persistence.service';
import { XpService } from './xp.service';
import { MasteryService } from './mastery.service';
import { GameProgressionService } from './game-progression.service';
import { StreakService } from './streak.service';
import { LevelProgressionService } from '../levels/level-progression.service';
import { PlayTimeService } from './play-time.service';
import type { Rank } from '../state/rank.constants';
import type { MinigameId } from '../minigame/minigame.types';
import { ALL_STORY_MISSIONS } from '../curriculum/curriculum.data';

const ACHIEVEMENTS_KEY = 'achievements';

export type AchievementType = 'discovery' | 'mastery' | 'commitment';

export interface Achievement {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly type: AchievementType;
  readonly isHidden: boolean;
  readonly isEarned: boolean;
  readonly earnedDate: string | null;
}

/** Internal context passed to achievement condition evaluators. */
export interface AchievementContext {
  readonly totalXp: number;
  readonly currentRank: Rank;
  readonly completedMissionCount: number;
  readonly totalMissions: number;
  readonly activeStreakDays: number;
  readonly currentStreak: number;
  readonly totalPlayTimeSeconds: number;
  readonly levelsCompleted: number;
  readonly perfectScores: number;
  readonly totalStars: number;
  readonly topicMasteryMap: ReadonlyMap<MinigameId, number>;
  readonly unlockedMinigames: number;
}

/** Internal definition with evaluator function. */
interface AchievementDefinition {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly type: AchievementType;
  readonly isHidden: boolean;
  readonly condition: (ctx: AchievementContext) => boolean;
}

/** Ranks that qualify for the "Veteran" achievement (Commander and above). */
const VETERAN_RANKS: ReadonlySet<Rank> = new Set<Rank>([
  'Commander',
  'Captain',
  'Admiral',
  'Station Commander',
  'Fleet Admiral',
]);

const ACHIEVEMENT_DEFINITIONS: readonly AchievementDefinition[] = [
  // --- Discovery (5) ---
  {
    id: 'first-steps',
    title: 'First Steps',
    description: 'Complete your first story mission',
    type: 'discovery',
    isHidden: false,
    condition: (ctx) => ctx.completedMissionCount >= 1,
  },
  {
    id: 'explorer',
    title: 'Explorer',
    description: 'Unlock 4 minigames',
    type: 'discovery',
    isHidden: false,
    condition: (ctx) => ctx.unlockedMinigames >= 4,
  },
  {
    id: 'speed-demon',
    title: 'Speed Demon',
    description: 'Complete 10 levels total',
    type: 'discovery',
    isHidden: true,
    condition: (ctx) => ctx.levelsCompleted >= 10,
  },
  {
    id: 'globe-trotter',
    title: 'Globe Trotter',
    description: 'Earn mastery in 6 different topics',
    type: 'discovery',
    isHidden: false,
    condition: (ctx) => {
      let count = 0;
      for (const stars of ctx.topicMasteryMap.values()) {
        if (stars >= 1) count++;
      }
      return count >= 6;
    },
  },
  {
    id: 'completionist',
    title: 'Completionist',
    description: 'Complete all story missions',
    type: 'discovery',
    isHidden: false,
    condition: (ctx) => ctx.completedMissionCount === ctx.totalMissions && ctx.totalMissions > 0,
  },

  // --- Mastery (6) ---
  {
    id: 'perfectionist',
    title: 'Perfectionist',
    description: 'Get a perfect score on any level',
    type: 'mastery',
    isHidden: false,
    condition: (ctx) => ctx.perfectScores >= 1,
  },
  {
    id: 'star-collector',
    title: 'Star Collector',
    description: 'Earn 50 total stars across all levels',
    type: 'mastery',
    isHidden: false,
    condition: (ctx) => ctx.totalStars >= 50,
  },
  {
    id: 'topic-master',
    title: 'Topic Master',
    description: 'Reach 5-star mastery on any topic',
    type: 'mastery',
    isHidden: false,
    condition: (ctx) => {
      for (const stars of ctx.topicMasteryMap.values()) {
        if (stars >= 5) return true;
      }
      return false;
    },
  },
  {
    id: 'overachiever',
    title: 'Overachiever',
    description: 'Earn 10 perfect scores',
    type: 'mastery',
    isHidden: true,
    condition: (ctx) => ctx.perfectScores >= 10,
  },
  {
    id: 'elite',
    title: 'Elite',
    description: 'Reach 5-star mastery on 6 topics',
    type: 'mastery',
    isHidden: false,
    condition: (ctx) => {
      let count = 0;
      for (const stars of ctx.topicMasteryMap.values()) {
        if (stars >= 5) count++;
      }
      return count >= 6;
    },
  },
  {
    id: 'flawless',
    title: 'Flawless',
    description: 'Earn 25 perfect scores',
    type: 'mastery',
    isHidden: false,
    condition: (ctx) => ctx.perfectScores >= 25,
  },

  // --- Commitment (5) ---
  {
    id: 'dedicated',
    title: 'Dedicated',
    description: 'Achieve a 7-day streak',
    type: 'commitment',
    isHidden: false,
    condition: (ctx) => ctx.currentStreak >= 7,
  },
  {
    id: 'consistent',
    title: 'Consistent',
    description: 'Achieve a 14-day streak',
    type: 'commitment',
    isHidden: false,
    condition: (ctx) => ctx.currentStreak >= 14,
  },
  {
    id: 'marathon',
    title: 'Marathon',
    description: 'Play for 1 hour total',
    type: 'commitment',
    isHidden: false,
    condition: (ctx) => ctx.totalPlayTimeSeconds >= 3600,
  },
  {
    id: 'veteran',
    title: 'Veteran',
    description: 'Reach Commander rank',
    type: 'commitment',
    isHidden: false,
    condition: (ctx) => VETERAN_RANKS.has(ctx.currentRank),
  },
  {
    id: 'legend',
    title: 'Legend',
    description: 'Reach Fleet Admiral rank',
    type: 'commitment',
    isHidden: true,
    condition: (ctx) => ctx.currentRank === 'Fleet Admiral',
  },
];

/** Set of valid achievement IDs for validation on load. */
const VALID_ACHIEVEMENT_IDS: ReadonlySet<string> = new Set(
  ACHIEVEMENT_DEFINITIONS.map((d) => d.id),
);

/** ISO date regex for validation on load. */
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;

type EarnedMap = Record<string, string>;

@Injectable({ providedIn: 'root' })
export class AchievementService {
  static readonly SAVE_DEBOUNCE_MS = 500;

  private readonly persistence = inject(StatePersistenceService);
  private readonly xpService = inject(XpService);
  private readonly masteryService = inject(MasteryService);
  private readonly gameProgression = inject(GameProgressionService);
  private readonly streakService = inject(StreakService);
  private readonly levelProgression = inject(LevelProgressionService);
  private readonly playTimeService = inject(PlayTimeService);
  private readonly destroyRef = inject(DestroyRef);
  private _saveTimeout: ReturnType<typeof setTimeout> | null = null;

  private readonly _earnedMap = signal<EarnedMap>({});
  private readonly _lastEarnedAchievement = signal<Achievement | null>(null);

  /** All achievements with earned state. */
  readonly achievements = computed<readonly Achievement[]>(() => {
    const earned = this._earnedMap();
    return ACHIEVEMENT_DEFINITIONS.map((def) => ({
      id: def.id,
      title: def.title,
      description: def.description,
      type: def.type,
      isHidden: def.isHidden,
      isEarned: def.id in earned,
      earnedDate: earned[def.id] ?? null,
    }));
  });

  /** Count of earned achievements. */
  readonly earnedCount = computed(() => Object.keys(this._earnedMap()).length);

  /** Last achievement earned (for notification consumers). */
  readonly lastEarnedAchievement = this._lastEarnedAchievement.asReadonly();

  constructor() {
    this._loadState();
    this._setupAutoSave();
    this.destroyRef.onDestroy(() => {
      if (this._saveTimeout !== null) {
        clearTimeout(this._saveTimeout);
      }
    });
  }

  /** Evaluate all achievement conditions, return newly earned. */
  checkAchievements(): Achievement[] {
    const ctx = this._buildContext();
    const earned = this._earnedMap();
    const newlyEarned: Achievement[] = [];

    for (const def of ACHIEVEMENT_DEFINITIONS) {
      if (def.id in earned) {
        continue;
      }
      if (def.condition(ctx)) {
        const now = new Date().toISOString();
        const achievement: Achievement = {
          id: def.id,
          title: def.title,
          description: def.description,
          type: def.type,
          isHidden: def.isHidden,
          isEarned: true,
          earnedDate: now,
        };
        newlyEarned.push(achievement);
      }
    }

    if (newlyEarned.length > 0) {
      this._earnedMap.update((map) => {
        const next = { ...map };
        for (const a of newlyEarned) {
          next[a.id] = a.earnedDate!;
        }
        return next;
      });
      this._lastEarnedAchievement.set(newlyEarned[newlyEarned.length - 1]);
    }

    return newlyEarned;
  }

  /** Returns all earned achievements. */
  getEarnedAchievements(): Achievement[] {
    return this.achievements().filter((a) => a.isEarned);
  }

  /** Returns all achievements (earned + unearned). */
  getAllAchievements(): Achievement[] {
    return [...this.achievements()];
  }

  /** Clears all earned state and persistence. */
  resetAchievements(): void {
    this._earnedMap.set({});
    this._lastEarnedAchievement.set(null);
    this.persistence.clear(ACHIEVEMENTS_KEY);
  }

  private _buildContext(): AchievementContext {
    const progressMap = this.levelProgression.progress();
    let levelsCompleted = 0;
    let perfectScores = 0;
    let totalStars = 0;

    for (const lp of progressMap.values()) {
      if (lp.completed) levelsCompleted++;
      if (lp.perfect) perfectScores++;
      totalStars += lp.starRating;
    }

    return {
      totalXp: this.xpService.totalXp(),
      currentRank: this.xpService.currentRank(),
      completedMissionCount: this.gameProgression.completedMissionCount(),
      totalMissions: ALL_STORY_MISSIONS.length,
      activeStreakDays: this.streakService.activeStreakDays(),
      currentStreak: this.streakService.currentStreak(),
      totalPlayTimeSeconds: this.playTimeService.totalPlayTime(),
      levelsCompleted,
      perfectScores,
      totalStars,
      topicMasteryMap: this.masteryService.mastery(),
      unlockedMinigames: this.gameProgression.getUnlockedMinigames().length,
    };
  }

  private _loadState(): void {
    const saved = this.persistence.load<EarnedMap>(ACHIEVEMENTS_KEY);
    if (saved !== null && typeof saved === 'object' && !Array.isArray(saved)) {
      const validated: EarnedMap = {};
      for (const [key, value] of Object.entries(saved)) {
        if (
          VALID_ACHIEVEMENT_IDS.has(key) &&
          typeof value === 'string' &&
          ISO_DATE_REGEX.test(value)
        ) {
          validated[key] = value;
        }
      }
      this._earnedMap.set(validated);
    }
  }

  private _setupAutoSave(): void {
    effect(() => {
      const snapshot = this._earnedMap();
      untracked(() => this._debouncedSave(snapshot));
    });
  }

  private _debouncedSave(snapshot: EarnedMap): void {
    if (this._saveTimeout !== null) {
      clearTimeout(this._saveTimeout);
    }
    this._saveTimeout = setTimeout(() => {
      this.persistence.save(ACHIEVEMENTS_KEY, snapshot);
      this._saveTimeout = null;
    }, AchievementService.SAVE_DEBOUNCE_MS);
  }
}
