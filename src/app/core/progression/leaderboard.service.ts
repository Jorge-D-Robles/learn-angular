import { inject, Injectable } from '@angular/core';
import { StatePersistenceService } from '../persistence/state-persistence.service';
import type { MinigameId } from '../minigame/minigame.types';

/** Play mode for leaderboard entries. Uses camelCase 'speedRun' to match PlayMode.SpeedRun. */
export type LeaderboardMode = 'story' | 'endless' | 'speedRun';

/** A single leaderboard entry. */
export interface LeaderboardEntry {
  readonly playerName: string;
  readonly score: number;
  /** Time in seconds. Negative values are clamped to 0. */
  readonly time: number;
  /** ISO 8601 date string. */
  readonly date: string;
  readonly mode: LeaderboardMode;
}

/** Result returned by addEntry(). */
export interface AddEntryResult {
  /** 1-indexed rank of the newly added entry. */
  readonly rank: number;
  /** True only when the entry achieved rank 1 (board-wide #1). */
  readonly isNewHighScore: boolean;
}

/** Maximum number of entries retained per game per mode. */
export const MAX_LEADERBOARD_ENTRIES = 10;

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}T/;
const VALID_MODES: readonly string[] = ['story', 'endless', 'speedRun'];

@Injectable({ providedIn: 'root' })
export class LeaderboardService {
  private readonly _persistence = inject(StatePersistenceService);

  /** Adds an entry to the leaderboard for the given game. Returns rank and high-score status. */
  addEntry(gameId: MinigameId, entry: LeaderboardEntry): AddEntryResult {
    const entries = this._loadEntries(gameId, entry.mode);

    const sanitized: LeaderboardEntry = {
      ...entry,
      time: Math.max(0, entry.time),
    };

    // Insert in sorted position
    const insertIdx = this._findInsertIndex(entries, sanitized);
    entries.splice(insertIdx, 0, sanitized);

    // Truncate to max
    if (entries.length > MAX_LEADERBOARD_ENTRIES) {
      entries.length = MAX_LEADERBOARD_ENTRIES;
    }

    this._saveEntries(gameId, entry.mode, entries);

    const rank = insertIdx + 1;
    return {
      rank,
      isNewHighScore: rank === 1,
    };
  }

  /** Returns a defensive copy of leaderboard entries for the given game and mode. */
  getLeaderboard(gameId: MinigameId, mode: LeaderboardMode): LeaderboardEntry[] {
    return [...this._loadEntries(gameId, mode)];
  }

  /** Returns the 1-indexed rank of the best entry for the given player, or null if not found. */
  getPlayerRank(
    gameId: MinigameId,
    mode: LeaderboardMode,
    playerName: string,
  ): number | null {
    const entries = this._loadEntries(gameId, mode);
    const idx = entries.findIndex((e) => e.playerName === playerName);
    return idx === -1 ? null : idx + 1;
  }

  /** Clears all leaderboard entries for the given game and mode. */
  clearLeaderboard(gameId: MinigameId, mode: LeaderboardMode): void {
    this._persistence.clear(this._storageKey(gameId, mode));
  }

  // --- Private helpers ---

  private _storageKey(gameId: MinigameId, mode: LeaderboardMode): string {
    return `leaderboard:${gameId}:${mode}`;
  }

  private _loadEntries(
    gameId: MinigameId,
    mode: LeaderboardMode,
  ): LeaderboardEntry[] {
    const raw = this._persistence.load<unknown[]>(
      this._storageKey(gameId, mode),
    );
    if (!Array.isArray(raw)) {
      return [];
    }
    return raw.filter((item): item is LeaderboardEntry =>
      this._isValidEntry(item),
    );
  }

  private _saveEntries(
    gameId: MinigameId,
    mode: LeaderboardMode,
    entries: LeaderboardEntry[],
  ): void {
    this._persistence.save(this._storageKey(gameId, mode), entries);
  }

  /**
   * Finds the insertion index to maintain sorted order:
   * - Primary: score descending
   * - Tiebreak: time ascending
   * - Second tiebreak: date descending
   */
  private _findInsertIndex(
    entries: LeaderboardEntry[],
    newEntry: LeaderboardEntry,
  ): number {
    for (let i = 0; i < entries.length; i++) {
      const existing = entries[i];
      if (newEntry.score > existing.score) {
        return i;
      }
      if (newEntry.score === existing.score) {
        if (newEntry.time < existing.time) {
          return i;
        }
        if (newEntry.time === existing.time && newEntry.date > existing.date) {
          return i;
        }
      }
    }
    return entries.length;
  }

  private _isValidEntry(item: unknown): item is LeaderboardEntry {
    if (item === null || typeof item !== 'object') {
      return false;
    }
    const obj = item as Record<string, unknown>;
    return (
      typeof obj['playerName'] === 'string' &&
      typeof obj['score'] === 'number' &&
      typeof obj['time'] === 'number' &&
      typeof obj['date'] === 'string' &&
      DATE_REGEX.test(obj['date']) &&
      typeof obj['mode'] === 'string' &&
      VALID_MODES.includes(obj['mode'])
    );
  }
}
