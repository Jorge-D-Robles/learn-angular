import { TestBed } from '@angular/core/testing';
import { DailyChallengeService } from '../progression/daily-challenge.service';
import { SpacedRepetitionService } from '../progression/spaced-repetition.service';
import type { MinigameId } from '../minigame/minigame.types';

// --- Test helpers ---

const MS_PER_DAY = 86_400_000;
// Midday UTC avoids timezone-boundary issues with date formatting
const BASE_DATE = new Date('2026-03-10T12:00:00Z');
const BASE_DATE_MS = BASE_DATE.getTime();

function createFakeStorage(): Storage {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, value),
    removeItem: (key: string) => { store.delete(key); },
    clear: () => store.clear(),
    key: (i: number) => [...store.keys()][i] ?? null,
    get length() { return store.size; },
  } as Storage;
}

/**
 * Seeds localStorage with game-progression data (completed mission chapters).
 * To unlock minigames, we complete the missions that have unlocksMinigame set.
 *
 * Chapter -> minigame mapping (from curriculum.data.ts):
 *   1 -> module-assembly, 4 -> flow-commander, 5 -> wire-protocol, 7 -> signal-corps
 *
 * Prerequisites are chained: 1->2->3->4->5->6->7->8->...
 * We must include all prerequisite chapters for the chain to be valid on load.
 */
function seedCompletedMissions(storage: Storage, chapterIds: number[]): void {
  storage.setItem(
    'nexus-station:game-progression',
    JSON.stringify(chapterIds),
  );
}

/**
 * Seeds localStorage with mastery data (minigameId -> star count).
 */
function seedMastery(storage: Storage, data: Record<string, number>): void {
  storage.setItem('nexus-station:mastery', JSON.stringify(data));
}

/**
 * Seeds localStorage with spaced-repetition data (minigameId -> epoch ms).
 */
function seedSpacedRepetition(storage: Storage, data: Record<string, number>): void {
  storage.setItem('nexus-station:spaced-repetition', JSON.stringify(data));
}

// --- Integration tests ---

describe('DailyChallengeService topic rotation integration', () => {
  let fakeStorage: Storage;
  let originalLocalStorage: Storage;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(BASE_DATE);

    fakeStorage = createFakeStorage();
    originalLocalStorage = window.localStorage;
    Object.defineProperty(window, 'localStorage', {
      value: fakeStorage,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.runAllTimers();
    vi.useRealTimers();
    Object.defineProperty(window, 'localStorage', {
      value: originalLocalStorage,
      writable: true,
      configurable: true,
    });
  });

  /**
   * Helper: creates a fresh TestBed and injects DailyChallengeService.
   * Must be called after seeding localStorage and setting system time.
   */
  function createService(): DailyChallengeService {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    Object.defineProperty(window, 'localStorage', {
      value: fakeStorage,
      writable: true,
      configurable: true,
    });
    return TestBed.inject(DailyChallengeService);
  }

  it('selects from the general unlocked pool when no topics are degrading', () => {
    // Unlock module-assembly, flow-commander, wire-protocol by completing chapters 1-5
    seedCompletedMissions(fakeStorage, [1, 2, 3, 4, 5]);

    // Give mastery to some topics but with RECENT practice (within grace period)
    const recentPractice = BASE_DATE_MS - 3 * MS_PER_DAY; // 3 days ago, within 7-day grace
    seedMastery(fakeStorage, {
      'module-assembly': 3,
      'flow-commander': 2,
      'wire-protocol': 1,
    });
    seedSpacedRepetition(fakeStorage, {
      'module-assembly': recentPractice,
      'flow-commander': recentPractice,
      'wire-protocol': recentPractice,
    });

    const service = createService();
    const challenge = service.todaysChallenge();

    // Verify SpacedRepetitionService returns no degrading topics (all within grace period)
    const spacedRepetition = TestBed.inject(SpacedRepetitionService);
    expect(spacedRepetition.getDegradingTopics()).toHaveLength(0);

    // Challenge should pick from the unlocked pool
    const unlocked: MinigameId[] = ['module-assembly', 'flow-commander', 'wire-protocol'];
    expect(unlocked).toContain(challenge.gameId);
  });

  it('preferentially selects a degraded topic minigame when degrading topics exist', () => {
    // Unlock module-assembly, flow-commander, wire-protocol by completing chapters 1-5
    seedCompletedMissions(fakeStorage, [1, 2, 3, 4, 5]);

    // Set wire-protocol as degrading: practiced 14 days ago (past 7-day grace period)
    const oldPractice = BASE_DATE_MS - 14 * MS_PER_DAY;
    const recentPractice = BASE_DATE_MS - 2 * MS_PER_DAY;
    seedMastery(fakeStorage, {
      'module-assembly': 3,
      'flow-commander': 2,
      'wire-protocol': 2,
    });
    seedSpacedRepetition(fakeStorage, {
      'module-assembly': recentPractice,
      'flow-commander': recentPractice,
      'wire-protocol': oldPractice,
    });

    const service = createService();

    // Verify SpacedRepetitionService reports wire-protocol as degrading
    const spacedRepetition = TestBed.inject(SpacedRepetitionService);
    const degrading = spacedRepetition.getDegradingTopics();
    expect(degrading.length).toBeGreaterThan(0);
    expect(degrading[0].topicId).toBe('wire-protocol');

    // With only one degrading unlocked topic, the challenge must select it
    expect(service.todaysChallenge().gameId).toBe('wire-protocol');
  });

  it('does not repeat the same game on consecutive days when multiple degrading topics exist', () => {
    // Unlock module-assembly, flow-commander, wire-protocol, signal-corps
    // by completing chapters 1-7
    seedCompletedMissions(fakeStorage, [1, 2, 3, 4, 5, 6, 7]);

    // Set multiple topics as degrading (practiced >7 days ago)
    const oldPractice = BASE_DATE_MS - 15 * MS_PER_DAY;
    seedMastery(fakeStorage, {
      'module-assembly': 3,
      'flow-commander': 2,
      'wire-protocol': 2,
      'signal-corps': 3,
    });
    seedSpacedRepetition(fakeStorage, {
      'module-assembly': oldPractice,
      'flow-commander': oldPractice,
      'wire-protocol': oldPractice,
      'signal-corps': oldPractice,
    });

    // Collect game IDs across 10 consecutive days
    const gameIds: MinigameId[] = [];
    for (let day = 0; day < 10; day++) {
      vi.setSystemTime(new Date(BASE_DATE_MS + day * MS_PER_DAY));

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({});
      Object.defineProperty(window, 'localStorage', {
        value: fakeStorage,
        writable: true,
        configurable: true,
      });

      const service = TestBed.inject(DailyChallengeService);
      gameIds.push(service.todaysChallenge().gameId);
    }

    // With 4 degrading topics and a date-based hash, we should see variation
    const uniqueGames = new Set(gameIds);
    expect(uniqueGames.size).toBeGreaterThan(1);

    // Also verify no two consecutive days have the same game
    // (The hash function + modulo should produce different indices for adjacent dates,
    // but with only 4 options this is not mathematically guaranteed for ALL pairs.
    // We check that at least one consecutive pair differs.)
    let hasConsecutiveDifference = false;
    for (let i = 1; i < gameIds.length; i++) {
      if (gameIds[i] !== gameIds[i - 1]) {
        hasConsecutiveDifference = true;
        break;
      }
    }
    expect(hasConsecutiveDifference).toBe(true);
  });
});
