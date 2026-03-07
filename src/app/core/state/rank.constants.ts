/** String literal union of all station ranks. */
export type Rank =
  | 'Cadet'
  | 'Ensign'
  | 'Lieutenant'
  | 'Commander'
  | 'Captain'
  | 'Admiral'
  | 'Station Commander'
  | 'Fleet Admiral';

/** A rank and the minimum XP required to achieve it. */
export interface RankThreshold {
  readonly rank: Rank;
  readonly xpRequired: number;
}

/** Rank thresholds sorted ascending by XP. Source: docs/progression.md */
export const RANK_THRESHOLDS: readonly RankThreshold[] = [
  { rank: 'Cadet', xpRequired: 0 },
  { rank: 'Ensign', xpRequired: 500 },
  { rank: 'Lieutenant', xpRequired: 1_500 },
  { rank: 'Commander', xpRequired: 3_500 },
  { rank: 'Captain', xpRequired: 6_500 },
  { rank: 'Admiral', xpRequired: 10_000 },
  { rank: 'Station Commander', xpRequired: 15_000 },
  { rank: 'Fleet Admiral', xpRequired: 25_000 },
] as const;

/** The starting rank for all new players. */
export const DEFAULT_RANK: Rank = 'Cadet';

/**
 * Returns the highest rank the player qualifies for based on total XP.
 * Scans RANK_THRESHOLDS in reverse to find the first threshold <= xp.
 */
export function getRankForXp(xp: number): Rank {
  for (let i = RANK_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= RANK_THRESHOLDS[i].xpRequired) {
      return RANK_THRESHOLDS[i].rank;
    }
  }
  return DEFAULT_RANK;
}
