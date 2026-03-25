// ---------------------------------------------------------------------------
// Achievement content definitions (pure data -- no executable conditions)
// ---------------------------------------------------------------------------

export type AchievementType = 'discovery' | 'mastery' | 'commitment';

export interface AchievementDefinition {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly type: AchievementType;
  readonly isHidden: boolean;
  readonly evaluationCriteria: string;
}

// ---------------------------------------------------------------------------
// All 16 achievement definitions
// ---------------------------------------------------------------------------

export const ACHIEVEMENT_DEFINITIONS: readonly AchievementDefinition[] = [
  // =========================================================================
  // DISCOVERY (5)
  // =========================================================================
  {
    id: 'first-steps',
    title: 'First Steps',
    description: 'Complete your first story mission',
    type: 'discovery',
    isHidden: false,
    evaluationCriteria: 'completedMissionCount >= 1',
  },
  {
    id: 'explorer',
    title: 'Explorer',
    description: 'Unlock 4 minigames',
    type: 'discovery',
    isHidden: false,
    evaluationCriteria: 'unlockedMinigames >= 4',
  },
  {
    id: 'speed-demon',
    title: 'Speed Demon',
    description: 'Complete 10 levels total',
    type: 'discovery',
    isHidden: true,
    evaluationCriteria: 'levelsCompleted >= 10',
  },
  {
    id: 'globe-trotter',
    title: 'Globe Trotter',
    description: 'Earn mastery in 6 different topics',
    type: 'discovery',
    isHidden: false,
    evaluationCriteria: 'Topics with mastery >= 1 star: count >= 6',
  },
  {
    id: 'completionist',
    title: 'Completionist',
    description: 'Complete all story missions',
    type: 'discovery',
    isHidden: false,
    evaluationCriteria: 'completedMissionCount equals totalMissions and totalMissions > 0',
  },

  // =========================================================================
  // MASTERY (6)
  // =========================================================================
  {
    id: 'perfectionist',
    title: 'Perfectionist',
    description: 'Get a perfect score on any level',
    type: 'mastery',
    isHidden: false,
    evaluationCriteria: 'perfectScores >= 1',
  },
  {
    id: 'star-collector',
    title: 'Star Collector',
    description: 'Earn 50 total stars across all levels',
    type: 'mastery',
    isHidden: false,
    evaluationCriteria: 'totalStars >= 50',
  },
  {
    id: 'topic-master',
    title: 'Topic Master',
    description: 'Reach 5-star mastery on any topic',
    type: 'mastery',
    isHidden: false,
    evaluationCriteria: 'Any topic with mastery >= 5 stars',
  },
  {
    id: 'overachiever',
    title: 'Overachiever',
    description: 'Earn 10 perfect scores',
    type: 'mastery',
    isHidden: true,
    evaluationCriteria: 'perfectScores >= 10',
  },
  {
    id: 'elite',
    title: 'Elite',
    description: 'Reach 5-star mastery on 6 topics',
    type: 'mastery',
    isHidden: false,
    evaluationCriteria: 'Topics with mastery >= 5 stars: count >= 6',
  },
  {
    id: 'flawless',
    title: 'Flawless',
    description: 'Earn 25 perfect scores',
    type: 'mastery',
    isHidden: false,
    evaluationCriteria: 'perfectScores >= 25',
  },

  // =========================================================================
  // COMMITMENT (5)
  // =========================================================================
  {
    id: 'dedicated',
    title: 'Dedicated',
    description: 'Achieve a 7-day streak',
    type: 'commitment',
    isHidden: false,
    evaluationCriteria: 'currentStreak >= 7',
  },
  {
    id: 'consistent',
    title: 'Consistent',
    description: 'Achieve a 14-day streak',
    type: 'commitment',
    isHidden: false,
    evaluationCriteria: 'currentStreak >= 14',
  },
  {
    id: 'marathon',
    title: 'Marathon',
    description: 'Play for 1 hour total',
    type: 'commitment',
    isHidden: false,
    evaluationCriteria: 'totalPlayTimeSeconds >= 3600',
  },
  {
    id: 'veteran',
    title: 'Veteran',
    description: 'Reach Commander rank',
    type: 'commitment',
    isHidden: false,
    evaluationCriteria: 'currentRank is Commander or above',
  },
  {
    id: 'legend',
    title: 'Legend',
    description: 'Reach Fleet Admiral rank',
    type: 'commitment',
    isHidden: true,
    evaluationCriteria: 'currentRank equals Fleet Admiral',
  },
];

// ---------------------------------------------------------------------------
// Convenience filtered views
// ---------------------------------------------------------------------------

export const DISCOVERY_ACHIEVEMENTS: readonly AchievementDefinition[] =
  ACHIEVEMENT_DEFINITIONS.filter((a) => a.type === 'discovery');

export const MASTERY_ACHIEVEMENTS: readonly AchievementDefinition[] =
  ACHIEVEMENT_DEFINITIONS.filter((a) => a.type === 'mastery');

export const COMMITMENT_ACHIEVEMENTS: readonly AchievementDefinition[] =
  ACHIEVEMENT_DEFINITIONS.filter((a) => a.type === 'commitment');

export const HIDDEN_ACHIEVEMENTS: readonly AchievementDefinition[] =
  ACHIEVEMENT_DEFINITIONS.filter((a) => a.isHidden);
