import { TestBed } from '@angular/core/testing';
import {
  LeaderboardService,
  MAX_LEADERBOARD_ENTRIES,
  type LeaderboardEntry,
  type LeaderboardMode,
  type AddEntryResult,
} from './leaderboard.service';
import { StatePersistenceService } from '../persistence/state-persistence.service';

function createFakeStorage(): Storage {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, value),
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => store.clear(),
    key: (i: number) => [...store.keys()][i] ?? null,
    get length() {
      return store.size;
    },
  } as Storage;
}

describe('LeaderboardService', () => {
  let service: LeaderboardService;
  let fakeStorage: Storage;
  let originalLocalStorage: Storage;

  beforeEach(() => {
    fakeStorage = createFakeStorage();
    originalLocalStorage = window.localStorage;
    Object.defineProperty(window, 'localStorage', {
      value: fakeStorage,
      writable: true,
      configurable: true,
    });

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    service = TestBed.inject(LeaderboardService);
  });

  afterEach(() => {
    Object.defineProperty(window, 'localStorage', {
      value: originalLocalStorage,
      writable: true,
      configurable: true,
    });
  });

  // --- Structural tests ---

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should export LeaderboardEntry, LeaderboardMode, and MAX_LEADERBOARD_ENTRIES (compile-time check)', () => {
    const entry: LeaderboardEntry = {
      playerName: 'Alice',
      score: 100,
      time: 45,
      date: '2026-03-24T12:00:00.000Z',
      mode: 'story',
    };
    const mode: LeaderboardMode = 'speedRun';
    const result: AddEntryResult = { rank: 1, isNewHighScore: true };
    expect(entry).toBeTruthy();
    expect(mode).toBeTruthy();
    expect(result).toBeTruthy();
    expect(MAX_LEADERBOARD_ENTRIES).toBe(10);
  });

  // --- addEntry tests ---

  describe('addEntry', () => {
    it('should add a valid entry and make it retrievable via getLeaderboard', () => {
      service.addEntry('module-assembly', {
        playerName: 'Alice',
        score: 100,
        time: 45,
        date: '2026-03-24T12:00:00.000Z',
        mode: 'story',
      });

      const board = service.getLeaderboard('module-assembly', 'story');
      expect(board).toHaveLength(1);
      expect(board[0].playerName).toBe('Alice');
      expect(board[0].score).toBe(100);
      expect(board[0].time).toBe(45);
      expect(board[0].date).toBe('2026-03-24T12:00:00.000Z');
      expect(board[0].mode).toBe('story');
    });

    it('should return rank 1 and isNewHighScore true for the first entry', () => {
      const result = service.addEntry('module-assembly', {
        playerName: 'Alice',
        score: 100,
        time: 45,
        date: '2026-03-24T12:00:00.000Z',
        mode: 'story',
      });

      expect(result.rank).toBe(1);
      expect(result.isNewHighScore).toBe(true);
    });

    it('should sort entries by score descending', () => {
      service.addEntry('module-assembly', {
        playerName: 'Alice',
        score: 100,
        time: 30,
        date: '2026-03-24T12:00:00.000Z',
        mode: 'story',
      });
      service.addEntry('module-assembly', {
        playerName: 'Bob',
        score: 300,
        time: 30,
        date: '2026-03-24T12:00:00.000Z',
        mode: 'story',
      });
      service.addEntry('module-assembly', {
        playerName: 'Carol',
        score: 200,
        time: 30,
        date: '2026-03-24T12:00:00.000Z',
        mode: 'story',
      });

      const board = service.getLeaderboard('module-assembly', 'story');
      expect(board.map((e) => e.score)).toEqual([300, 200, 100]);
    });

    it('should tiebreak by time ascending when scores are equal', () => {
      service.addEntry('module-assembly', {
        playerName: 'Alice',
        score: 100,
        time: 45,
        date: '2026-03-24T12:00:00.000Z',
        mode: 'story',
      });
      service.addEntry('module-assembly', {
        playerName: 'Bob',
        score: 100,
        time: 30,
        date: '2026-03-24T12:00:00.000Z',
        mode: 'story',
      });

      const board = service.getLeaderboard('module-assembly', 'story');
      expect(board[0].playerName).toBe('Bob'); // time 30 ranks higher
      expect(board[1].playerName).toBe('Alice'); // time 45 ranks lower
    });

    it('should tiebreak by date descending when score and time are equal', () => {
      service.addEntry('module-assembly', {
        playerName: 'Alice',
        score: 100,
        time: 30,
        date: '2026-03-20T12:00:00.000Z',
        mode: 'story',
      });
      service.addEntry('module-assembly', {
        playerName: 'Bob',
        score: 100,
        time: 30,
        date: '2026-03-24T12:00:00.000Z',
        mode: 'story',
      });

      const board = service.getLeaderboard('module-assembly', 'story');
      expect(board[0].playerName).toBe('Bob'); // newer date ranks higher
      expect(board[1].playerName).toBe('Alice');
    });

    it('should cap entries at MAX_LEADERBOARD_ENTRIES (10)', () => {
      for (let i = 0; i < 11; i++) {
        service.addEntry('module-assembly', {
          playerName: `Player${i}`,
          score: (i + 1) * 10,
          time: 30,
          date: '2026-03-24T12:00:00.000Z',
          mode: 'story',
        });
      }

      const board = service.getLeaderboard('module-assembly', 'story');
      expect(board).toHaveLength(10);
      // Lowest score (10) should have been evicted
      expect(board.find((e) => e.score === 10)).toBeUndefined();
    });

    it('should return the correct rank for a new entry', () => {
      service.addEntry('module-assembly', {
        playerName: 'A',
        score: 100,
        time: 30,
        date: '2026-03-24T12:00:00.000Z',
        mode: 'story',
      });
      service.addEntry('module-assembly', {
        playerName: 'B',
        score: 200,
        time: 30,
        date: '2026-03-24T12:00:00.000Z',
        mode: 'story',
      });
      service.addEntry('module-assembly', {
        playerName: 'C',
        score: 300,
        time: 30,
        date: '2026-03-24T12:00:00.000Z',
        mode: 'story',
      });

      const result = service.addEntry('module-assembly', {
        playerName: 'D',
        score: 250,
        time: 30,
        date: '2026-03-24T12:00:00.000Z',
        mode: 'story',
      });

      expect(result.rank).toBe(2);
      expect(result.isNewHighScore).toBe(false);
    });

    it('should return isNewHighScore true only when the entry is rank 1', () => {
      const result1 = service.addEntry('module-assembly', {
        playerName: 'A',
        score: 100,
        time: 30,
        date: '2026-03-24T12:00:00.000Z',
        mode: 'story',
      });
      expect(result1.rank).toBe(1);
      expect(result1.isNewHighScore).toBe(true);

      const result2 = service.addEntry('module-assembly', {
        playerName: 'B',
        score: 50,
        time: 30,
        date: '2026-03-24T12:00:00.000Z',
        mode: 'story',
      });
      expect(result2.rank).toBe(2);
      expect(result2.isNewHighScore).toBe(false);
    });

    it('should persist after addEntry (survives new service instance)', () => {
      service.addEntry('module-assembly', {
        playerName: 'Alice',
        score: 100,
        time: 45,
        date: '2026-03-24T12:00:00.000Z',
        mode: 'story',
      });

      // Create a new service instance to verify persistence
      const service2 = TestBed.inject(LeaderboardService);
      const board = service2.getLeaderboard('module-assembly', 'story');
      expect(board).toHaveLength(1);
      expect(board[0].playerName).toBe('Alice');
    });

    it('should separate entries by mode for the same game', () => {
      service.addEntry('module-assembly', {
        playerName: 'Alice',
        score: 100,
        time: 45,
        date: '2026-03-24T12:00:00.000Z',
        mode: 'story',
      });
      service.addEntry('module-assembly', {
        playerName: 'Bob',
        score: 200,
        time: 30,
        date: '2026-03-24T12:00:00.000Z',
        mode: 'speedRun',
      });

      const storyBoard = service.getLeaderboard('module-assembly', 'story');
      expect(storyBoard).toHaveLength(1);
      expect(storyBoard[0].playerName).toBe('Alice');

      const speedRunBoard = service.getLeaderboard(
        'module-assembly',
        'speedRun',
      );
      expect(speedRunBoard).toHaveLength(1);
      expect(speedRunBoard[0].playerName).toBe('Bob');
    });

    it('should separate entries by gameId', () => {
      service.addEntry('module-assembly', {
        playerName: 'Alice',
        score: 100,
        time: 45,
        date: '2026-03-24T12:00:00.000Z',
        mode: 'story',
      });
      service.addEntry('wire-protocol', {
        playerName: 'Bob',
        score: 200,
        time: 30,
        date: '2026-03-24T12:00:00.000Z',
        mode: 'story',
      });

      const maBoard = service.getLeaderboard('module-assembly', 'story');
      expect(maBoard).toHaveLength(1);
      expect(maBoard[0].playerName).toBe('Alice');

      const wpBoard = service.getLeaderboard('wire-protocol', 'story');
      expect(wpBoard).toHaveLength(1);
      expect(wpBoard[0].playerName).toBe('Bob');
    });
  });

  // --- getLeaderboard tests ---

  describe('getLeaderboard', () => {
    it('should return empty array for unknown game', () => {
      const board = service.getLeaderboard('module-assembly', 'story');
      expect(board).toEqual([]);
    });

    it('should return a defensive copy (mutating returned array does not affect stored data)', () => {
      service.addEntry('module-assembly', {
        playerName: 'Alice',
        score: 100,
        time: 45,
        date: '2026-03-24T12:00:00.000Z',
        mode: 'story',
      });

      const board = service.getLeaderboard('module-assembly', 'story');
      board.pop(); // mutate the returned array
      expect(board).toHaveLength(0);

      // Original data should be unaffected
      const board2 = service.getLeaderboard('module-assembly', 'story');
      expect(board2).toHaveLength(1);
    });
  });

  // --- getPlayerRank tests ---

  describe('getPlayerRank', () => {
    it('should return 1-indexed rank for the given player', () => {
      service.addEntry('module-assembly', {
        playerName: 'A',
        score: 300,
        time: 30,
        date: '2026-03-24T12:00:00.000Z',
        mode: 'story',
      });
      service.addEntry('module-assembly', {
        playerName: 'B',
        score: 200,
        time: 30,
        date: '2026-03-24T12:00:00.000Z',
        mode: 'story',
      });
      service.addEntry('module-assembly', {
        playerName: 'C',
        score: 100,
        time: 30,
        date: '2026-03-24T12:00:00.000Z',
        mode: 'story',
      });

      expect(service.getPlayerRank('module-assembly', 'story', 'B')).toBe(2);
    });

    it('should return null for an unknown player', () => {
      service.addEntry('module-assembly', {
        playerName: 'Alice',
        score: 100,
        time: 45,
        date: '2026-03-24T12:00:00.000Z',
        mode: 'story',
      });

      expect(
        service.getPlayerRank('module-assembly', 'story', 'Unknown'),
      ).toBeNull();
    });

    it('should return the best rank when a player has multiple entries', () => {
      service.addEntry('module-assembly', {
        playerName: 'Alice',
        score: 100,
        time: 30,
        date: '2026-03-24T12:00:00.000Z',
        mode: 'story',
      });
      service.addEntry('module-assembly', {
        playerName: 'Alice',
        score: 200,
        time: 30,
        date: '2026-03-24T12:00:00.000Z',
        mode: 'story',
      });
      service.addEntry('module-assembly', {
        playerName: 'Bob',
        score: 150,
        time: 30,
        date: '2026-03-24T12:00:00.000Z',
        mode: 'story',
      });

      // Board: Alice(200), Bob(150), Alice(100)
      // Alice's best rank is 1
      expect(service.getPlayerRank('module-assembly', 'story', 'Alice')).toBe(
        1,
      );
    });
  });

  // --- clearLeaderboard tests ---

  describe('clearLeaderboard', () => {
    it('should clear all entries for a game+mode', () => {
      service.addEntry('module-assembly', {
        playerName: 'Alice',
        score: 100,
        time: 45,
        date: '2026-03-24T12:00:00.000Z',
        mode: 'story',
      });

      service.clearLeaderboard('module-assembly', 'story');
      const board = service.getLeaderboard('module-assembly', 'story');
      expect(board).toEqual([]);
    });

    it('should not affect other game/mode combos', () => {
      service.addEntry('module-assembly', {
        playerName: 'Alice',
        score: 100,
        time: 45,
        date: '2026-03-24T12:00:00.000Z',
        mode: 'story',
      });
      service.addEntry('module-assembly', {
        playerName: 'Bob',
        score: 200,
        time: 30,
        date: '2026-03-24T12:00:00.000Z',
        mode: 'speedRun',
      });

      service.clearLeaderboard('module-assembly', 'story');

      // speedRun board should be untouched
      const speedRunBoard = service.getLeaderboard(
        'module-assembly',
        'speedRun',
      );
      expect(speedRunBoard).toHaveLength(1);
      expect(speedRunBoard[0].playerName).toBe('Bob');
    });
  });

  // --- Defensive loading tests ---

  describe('defensive loading', () => {
    it('should handle corrupted data gracefully (returns empty array)', () => {
      const persistence = TestBed.inject(StatePersistenceService);
      persistence.save('leaderboard:module-assembly:story', 'not-an-array');

      const board = service.getLeaderboard('module-assembly', 'story');
      expect(board).toEqual([]);
    });

    it('should filter out entries with invalid fields', () => {
      const persistence = TestBed.inject(StatePersistenceService);
      persistence.save('leaderboard:module-assembly:story', [
        {
          playerName: 'Alice',
          score: 100,
          time: 45,
          date: '2026-03-24T12:00:00.000Z',
          mode: 'story',
        },
        {
          playerName: 123, // invalid: not a string
          score: 200,
          time: 30,
          date: '2026-03-24T12:00:00.000Z',
          mode: 'story',
        },
        {
          playerName: 'Carol',
          score: 'bad', // invalid: not a number
          time: 30,
          date: '2026-03-24T12:00:00.000Z',
          mode: 'story',
        },
        {
          playerName: 'Dave',
          score: 150,
          time: 30,
          date: 'not-a-date', // invalid: does not match ISO pattern
          mode: 'story',
        },
      ]);

      const board = service.getLeaderboard('module-assembly', 'story');
      expect(board).toHaveLength(1);
      expect(board[0].playerName).toBe('Alice');
    });
  });

  // --- Edge case tests ---

  describe('edge cases', () => {
    it('should handle empty playerName without crashing', () => {
      const result = service.addEntry('module-assembly', {
        playerName: '',
        score: 100,
        time: 45,
        date: '2026-03-24T12:00:00.000Z',
        mode: 'story',
      });

      expect(result.rank).toBe(1);
      const board = service.getLeaderboard('module-assembly', 'story');
      expect(board).toHaveLength(1);
      expect(board[0].playerName).toBe('');
    });

    it('should handle zero score correctly', () => {
      service.addEntry('module-assembly', {
        playerName: 'Alice',
        score: 0,
        time: 30,
        date: '2026-03-24T12:00:00.000Z',
        mode: 'story',
      });
      service.addEntry('module-assembly', {
        playerName: 'Bob',
        score: 100,
        time: 30,
        date: '2026-03-24T12:00:00.000Z',
        mode: 'story',
      });

      const board = service.getLeaderboard('module-assembly', 'story');
      expect(board[0].playerName).toBe('Bob');
      expect(board[1].playerName).toBe('Alice');
      expect(board[1].score).toBe(0);
    });

    it('should clamp negative time to 0', () => {
      service.addEntry('module-assembly', {
        playerName: 'Alice',
        score: 100,
        time: -5,
        date: '2026-03-24T12:00:00.000Z',
        mode: 'story',
      });

      const board = service.getLeaderboard('module-assembly', 'story');
      expect(board[0].time).toBe(0);
    });
  });
});
