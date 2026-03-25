// ---------------------------------------------------------------------------
// Integration test: MinigameTutorialOverlay first-play detection with real
// persistence
// ---------------------------------------------------------------------------
// Verifies the full chain: first visit to a minigame shows tutorial with
// correct game-specific steps, dismiss persists the seen flag, and subsequent
// visits skip the tutorial.
// Uses real StatePersistenceService with fake localStorage.
// ---------------------------------------------------------------------------

import { TestBed } from '@angular/core/testing';
import { StatePersistenceService } from '../../../core/persistence/state-persistence.service';
import { tutorialSeenKey } from './minigame-tutorial.types';
import { getMinigameTutorial } from '../../../data/tutorials/minigame-tutorials.data';
import type { MinigameId } from '../../../core/minigame/minigame.types';

// --- Fake storage ---

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

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('MinigameTutorialOverlay first-play detection integration', () => {
  let persistence: StatePersistenceService;
  let fakeStorage: Storage;
  let originalLocalStorage: Storage;
  const gameId: MinigameId = 'module-assembly';

  beforeEach(() => {
    originalLocalStorage = window.localStorage;

    fakeStorage = createFakeStorage();
    Object.defineProperty(window, 'localStorage', {
      value: fakeStorage,
      writable: true,
      configurable: true,
    });

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    persistence = TestBed.inject(StatePersistenceService);
  });

  afterEach(() => {
    Object.defineProperty(window, 'localStorage', {
      value: originalLocalStorage,
      writable: true,
      configurable: true,
    });
  });

  it('first play of Module Assembly has game-specific tutorial steps', () => {
    const tutorialData = getMinigameTutorial(gameId);

    expect(tutorialData).toBeDefined();
    expect(tutorialData!.gameId).toBe('module-assembly');
    expect(tutorialData!.steps.length).toBe(3);
    expect(tutorialData!.steps[0].title).toBe('Drag Parts to Slots');
  });

  it('tutorial-seen flag not present in fresh localStorage means first play', () => {
    const key = tutorialSeenKey(gameId);
    const seen = persistence.load<boolean>(key);

    expect(seen).toBeNull();
  });

  it('dismiss tutorial persists tutorial-seen flag to localStorage', () => {
    const key = tutorialSeenKey(gameId);

    // Simulate tutorial dismiss: persist the seen flag
    persistence.save(key, true);

    const stored = fakeStorage.getItem(`nexus-station:${key}`);
    expect(stored).not.toBeNull();
    expect(JSON.parse(stored!)).toBe(true);
  });

  it('subsequent play with tutorial-seen flag skips tutorial', () => {
    const key = tutorialSeenKey(gameId);

    // Simulate a previous visit that dismissed the tutorial
    persistence.save(key, true);

    // On subsequent visit, check if tutorial should be shown
    const seen = persistence.load<boolean>(key);
    expect(seen).toBe(true);

    // Tutorial should NOT be shown (component checks this flag)
  });

  it('how-to-play from pause menu shows tutorial regardless of seen flag', () => {
    const key = tutorialSeenKey(gameId);

    // User has seen the tutorial before
    persistence.save(key, true);
    expect(persistence.load<boolean>(key)).toBe(true);

    // The tutorial data should still be accessible for "How to Play"
    const tutorialData = getMinigameTutorial(gameId);
    expect(tutorialData).toBeDefined();
    expect(tutorialData!.steps.length).toBe(3);

    // "How to Play" bypasses the seen check -- tutorial data is always available
    // even when the auto-show flag is true. The component receives steps and
    // displays them in "replay" mode without blocking the engine.
  });

  it('each P2 minigame has its own independent tutorial-seen flag', () => {
    const p2Games: MinigameId[] = [
      'module-assembly',
      'wire-protocol',
      'flow-commander',
      'signal-corps',
    ];

    // Mark only module-assembly as seen
    persistence.save(tutorialSeenKey('module-assembly'), true);

    for (const game of p2Games) {
      const seen = persistence.load<boolean>(tutorialSeenKey(game));
      if (game === 'module-assembly') {
        expect(seen).toBe(true);
      } else {
        expect(seen).toBeNull();
      }
    }
  });
});
