import { TestBed } from '@angular/core/testing';
import { EndlessModeService } from '../minigame/endless-mode.service';

import type { MinigameId } from '../minigame/minigame.types';

// --- Fake localStorage ---

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

const TEST_GAME_ID: MinigameId = 'module-assembly';

describe('Endless mode high score integration', () => {
  let service: EndlessModeService;
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
    service = TestBed.inject(EndlessModeService);
  });

  afterEach(() => {
    Object.defineProperty(window, 'localStorage', {
      value: originalLocalStorage,
      writable: true,
      configurable: true,
    });
  });

  it('should set high score on first-ever session', () => {
    service.startSession(TEST_GAME_ID);
    service.nextRound(100);
    service.nextRound(50);
    const { finalScore, isNewHighScore } = service.endSession();

    expect(finalScore).toBe(150);
    expect(isNewHighScore).toBe(true);
    expect(service.getHighScore(TEST_GAME_ID)).toBe(150);
  });

  it('should update high score when new session score exceeds existing', () => {
    // First session
    service.startSession(TEST_GAME_ID);
    service.nextRound(100);
    service.endSession();

    // Second session with higher score
    service.startSession(TEST_GAME_ID);
    service.nextRound(200);
    const { isNewHighScore } = service.endSession();

    expect(isNewHighScore).toBe(true);
    expect(service.getHighScore(TEST_GAME_ID)).toBe(200);
  });

  it('should NOT update high score when new session score is lower', () => {
    // First session with high score
    service.startSession(TEST_GAME_ID);
    service.nextRound(500);
    service.endSession();

    // Second session with lower score
    service.startSession(TEST_GAME_ID);
    service.nextRound(100);
    const { isNewHighScore } = service.endSession();

    expect(isNewHighScore).toBe(false);
    expect(service.getHighScore(TEST_GAME_ID)).toBe(500);
  });

  it('should persist high score across service restarts (localStorage round-trip)', () => {
    // First instance: set a high score
    service.startSession(TEST_GAME_ID);
    service.nextRound(300);
    service.endSession();

    // Simulate service restart by creating a new TestBed
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const freshService = TestBed.inject(EndlessModeService);

    // High score should survive across restarts
    expect(freshService.getHighScore(TEST_GAME_ID)).toBe(300);
  });

  it('should return 0 for high score when no sessions have been played', () => {
    expect(service.getHighScore(TEST_GAME_ID)).toBe(0);
  });

  it('should track high scores independently per game', () => {
    const otherGameId: MinigameId = 'wire-protocol';

    service.startSession(TEST_GAME_ID);
    service.nextRound(100);
    service.endSession();

    service.startSession(otherGameId);
    service.nextRound(200);
    service.endSession();

    expect(service.getHighScore(TEST_GAME_ID)).toBe(100);
    expect(service.getHighScore(otherGameId)).toBe(200);
  });
});
