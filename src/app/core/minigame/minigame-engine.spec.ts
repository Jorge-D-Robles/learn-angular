import { vi } from 'vitest';
import {
  MinigameEngine,
  type ActionResult,
  type MinigameEngineConfig,
} from './minigame-engine';
import {
  MinigameStatus,
  type MinigameLevel,
  type MinigameState,
} from './minigame.types';
import { DifficultyTier } from './minigame.types';

// --- Test subclass ---

class TestEngine extends MinigameEngine<{ difficulty: number }> {
  onLevelLoadCalled = false;
  onStartCalled = false;
  onCompleteCalled = false;
  lastValidatedAction: unknown = null;
  nextValidationResult: ActionResult = {
    valid: true,
    scoreChange: 10,
    livesChange: 0,
  };

  constructor(config?: Partial<MinigameEngineConfig>) {
    super(config);
  }

  protected onLevelLoad(_data: { difficulty: number }): void {
    this.onLevelLoadCalled = true;
  }
  protected onStart(): void {
    this.onStartCalled = true;
  }
  protected onComplete(): void {
    this.onCompleteCalled = true;
  }
  protected validateAction(action: unknown): ActionResult {
    this.lastValidatedAction = action;
    return this.nextValidationResult;
  }
}

// --- Test helpers ---

function createTestLevel(
  overrides: Partial<MinigameLevel<{ difficulty: number }>> = {},
): MinigameLevel<{ difficulty: number }> {
  return {
    id: 'test-level-01',
    gameId: 'module-assembly',
    tier: DifficultyTier.Basic,
    conceptIntroduced: 'Test concept',
    description: 'A test level',
    data: { difficulty: 1 },
    ...overrides,
  };
}

describe('MinigameEngine', () => {
  let engine: TestEngine;

  beforeEach(() => {
    engine = new TestEngine();
  });

  afterEach(() => {
    engine.destroy();
  });

  // --- 1. Initialization ---

  describe('Initialization', () => {
    it('should default to Loading status before initialize is called', () => {
      expect(engine.status()).toBe(MinigameStatus.Loading);
    });

    it('should set status to Loading after initialize', () => {
      engine.initialize(createTestLevel());
      expect(engine.status()).toBe(MinigameStatus.Loading);
    });

    it('should set currentLevel to the level id', () => {
      engine.initialize(createTestLevel({ id: 'my-level-42' }));
      expect(engine.currentLevel()).toBe('my-level-42');
    });

    it('should reset score to 0', () => {
      // Start a game and earn some score first
      engine.initialize(createTestLevel());
      engine.start();
      engine.submitAction('test');
      expect(engine.score()).toBeGreaterThan(0);

      // Re-initialize should reset
      engine.initialize(createTestLevel());
      expect(engine.score()).toBe(0);
    });

    it('should set lives to config initialLives (default 3)', () => {
      engine.initialize(createTestLevel());
      expect(engine.lives()).toBe(3);
    });

    it('should set lives to custom initialLives from config', () => {
      const customEngine = new TestEngine({ initialLives: 5 });
      customEngine.initialize(createTestLevel());
      expect(customEngine.lives()).toBe(5);
      customEngine.destroy();
    });

    it('should set timeRemaining to timerDuration when configured', () => {
      const timedEngine = new TestEngine({ timerDuration: 60 });
      timedEngine.initialize(createTestLevel());
      expect(timedEngine.timeRemaining()).toBe(60);
      timedEngine.destroy();
    });

    it('should set timeRemaining to 0 when no timer configured', () => {
      engine.initialize(createTestLevel());
      expect(engine.timeRemaining()).toBe(0);
    });

    it('should call onLevelLoad with level data', () => {
      engine.initialize(createTestLevel({ data: { difficulty: 7 } }));
      expect(engine.onLevelLoadCalled).toBe(true);
    });
  });

  // --- 2. Lifecycle: happy path ---

  describe('Lifecycle: initialize -> start -> complete', () => {
    it('should set status to Playing after start', () => {
      engine.initialize(createTestLevel());
      engine.start();
      expect(engine.status()).toBe(MinigameStatus.Playing);
    });

    it('should call onStart', () => {
      engine.initialize(createTestLevel());
      engine.start();
      expect(engine.onStartCalled).toBe(true);
    });

    it('should set status to Won after complete', () => {
      engine.initialize(createTestLevel());
      engine.start();
      engine.complete();
      expect(engine.status()).toBe(MinigameStatus.Won);
    });

    it('should call onComplete', () => {
      engine.initialize(createTestLevel());
      engine.start();
      engine.complete();
      expect(engine.onCompleteCalled).toBe(true);
    });
  });

  // --- 3. Lifecycle: fail ---

  describe('Lifecycle: initialize -> start -> fail', () => {
    it('should set status to Lost after fail', () => {
      engine.initialize(createTestLevel());
      engine.start();
      engine.fail();
      expect(engine.status()).toBe(MinigameStatus.Lost);
    });

    it('should clear the timer on fail', () => {
      vi.useFakeTimers();
      const timedEngine = new TestEngine({ timerDuration: 30 });
      timedEngine.initialize(createTestLevel());
      timedEngine.start();
      vi.advanceTimersByTime(5000);
      expect(timedEngine.timeRemaining()).toBe(25);
      timedEngine.fail();
      vi.advanceTimersByTime(5000);
      // Time should not have changed after fail
      expect(timedEngine.timeRemaining()).toBe(25);
      timedEngine.destroy();
      vi.useRealTimers();
    });
  });

  // --- 4. Pause and resume ---

  describe('Lifecycle: pause and resume', () => {
    it('should set status to Paused after pause', () => {
      engine.initialize(createTestLevel());
      engine.start();
      engine.pause();
      expect(engine.status()).toBe(MinigameStatus.Paused);
    });

    it('should set status to Playing after resume', () => {
      engine.initialize(createTestLevel());
      engine.start();
      engine.pause();
      engine.resume();
      expect(engine.status()).toBe(MinigameStatus.Playing);
    });

    it('should not allow pause from non-Playing status', () => {
      engine.initialize(createTestLevel());
      // Status is Loading, not Playing
      engine.pause();
      expect(engine.status()).toBe(MinigameStatus.Loading);
    });

    it('should not allow resume from non-Paused status', () => {
      engine.initialize(createTestLevel());
      engine.start();
      // Status is Playing, not Paused
      engine.resume();
      expect(engine.status()).toBe(MinigameStatus.Playing);
    });
  });

  // --- 5. Invalid transitions (no-op guards) ---

  describe('Invalid transitions', () => {
    it('should not allow start from Playing', () => {
      engine.initialize(createTestLevel());
      engine.start();
      engine.start(); // no-op
      expect(engine.status()).toBe(MinigameStatus.Playing);
    });

    it('should not allow start from Won', () => {
      engine.initialize(createTestLevel());
      engine.start();
      engine.complete();
      engine.start(); // no-op
      expect(engine.status()).toBe(MinigameStatus.Won);
    });

    it('should not allow complete from Paused', () => {
      engine.initialize(createTestLevel());
      engine.start();
      engine.pause();
      engine.complete(); // no-op
      expect(engine.status()).toBe(MinigameStatus.Paused);
    });

    it('should not allow complete from Loading', () => {
      engine.initialize(createTestLevel());
      engine.complete(); // no-op
      expect(engine.status()).toBe(MinigameStatus.Loading);
    });

    it('should not allow fail from Loading', () => {
      engine.initialize(createTestLevel());
      engine.fail(); // no-op
      expect(engine.status()).toBe(MinigameStatus.Loading);
    });

    it('should not allow fail from Won', () => {
      engine.initialize(createTestLevel());
      engine.start();
      engine.complete();
      engine.fail(); // no-op
      expect(engine.status()).toBe(MinigameStatus.Won);
    });
  });

  // --- 6. Re-initialization ---

  describe('Re-initialization', () => {
    it('should allow initialize to reset from any state (Won/Lost)', () => {
      engine.initialize(createTestLevel());
      engine.start();
      engine.complete();
      expect(engine.status()).toBe(MinigameStatus.Won);

      engine.initialize(createTestLevel({ id: 'new-level' }));
      expect(engine.status()).toBe(MinigameStatus.Loading);
      expect(engine.currentLevel()).toBe('new-level');
      expect(engine.score()).toBe(0);
    });

    it('should clear timer when re-initializing', () => {
      vi.useFakeTimers();
      const timedEngine = new TestEngine({ timerDuration: 30 });
      timedEngine.initialize(createTestLevel());
      timedEngine.start();
      vi.advanceTimersByTime(5000);
      expect(timedEngine.timeRemaining()).toBe(25);

      // Re-initialize should clear timer and reset duration
      timedEngine.initialize(createTestLevel());
      expect(timedEngine.timeRemaining()).toBe(30);
      vi.advanceTimersByTime(5000);
      // Timer should not be running (we haven't called start)
      expect(timedEngine.timeRemaining()).toBe(30);
      timedEngine.destroy();
      vi.useRealTimers();
    });
  });

  // --- 7. submitAction ---

  describe('submitAction', () => {
    beforeEach(() => {
      engine.initialize(createTestLevel());
      engine.start();
    });

    it('should call validateAction with the action', () => {
      engine.submitAction('my-action');
      expect(engine.lastValidatedAction).toBe('my-action');
    });

    it('should update score based on scoreChange', () => {
      engine.nextValidationResult = {
        valid: true,
        scoreChange: 25,
        livesChange: 0,
      };
      engine.submitAction('test');
      expect(engine.score()).toBe(25);
    });

    it('should not allow score to go below 0', () => {
      engine.nextValidationResult = {
        valid: true,
        scoreChange: -999,
        livesChange: 0,
      };
      engine.submitAction('test');
      expect(engine.score()).toBe(0);
    });

    it('should update lives based on livesChange', () => {
      engine.nextValidationResult = {
        valid: true,
        scoreChange: 0,
        livesChange: -1,
      };
      engine.submitAction('test');
      expect(engine.lives()).toBe(2);
    });

    it('should allow positive livesChange', () => {
      engine.nextValidationResult = {
        valid: true,
        scoreChange: 0,
        livesChange: 2,
      };
      engine.submitAction('test');
      expect(engine.lives()).toBe(5);
    });

    it('should auto-fail when lives reach 0', () => {
      engine.nextValidationResult = {
        valid: true,
        scoreChange: 0,
        livesChange: -3,
      };
      engine.submitAction('test');
      expect(engine.lives()).toBe(0);
      expect(engine.status()).toBe(MinigameStatus.Lost);
    });

    it('should return the ActionResult', () => {
      engine.nextValidationResult = {
        valid: true,
        scoreChange: 42,
        livesChange: -1,
      };
      const result = engine.submitAction('test');
      expect(result).toEqual({
        valid: true,
        scoreChange: 42,
        livesChange: -1,
      });
    });

    it('should no-op when status is not Playing', () => {
      engine.pause();
      // Now paused
      const result = engine.submitAction('test');
      expect(result).toEqual({ valid: false, scoreChange: 0, livesChange: 0 });
      expect(engine.lastValidatedAction).toBeNull(); // validateAction not called since we reset after beforeEach sets it
    });
  });

  // --- 8. Timer management ---

  describe('Timer management', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should start countdown on start when timerDuration is set', () => {
      const timedEngine = new TestEngine({ timerDuration: 10 });
      timedEngine.initialize(createTestLevel());
      timedEngine.start();
      expect(timedEngine.timeRemaining()).toBe(10);
      vi.advanceTimersByTime(1000);
      expect(timedEngine.timeRemaining()).toBe(9);
      timedEngine.destroy();
    });

    it('should decrement timeRemaining each second', () => {
      const timedEngine = new TestEngine({ timerDuration: 5 });
      timedEngine.initialize(createTestLevel());
      timedEngine.start();
      vi.advanceTimersByTime(3000);
      expect(timedEngine.timeRemaining()).toBe(2);
      timedEngine.destroy();
    });

    it('should auto-fail when timer reaches 0', () => {
      const timedEngine = new TestEngine({ timerDuration: 3 });
      timedEngine.initialize(createTestLevel());
      timedEngine.start();
      vi.advanceTimersByTime(3000);
      expect(timedEngine.timeRemaining()).toBe(0);
      expect(timedEngine.status()).toBe(MinigameStatus.Lost);
      timedEngine.destroy();
    });

    it('should pause timer on pause', () => {
      const timedEngine = new TestEngine({ timerDuration: 10 });
      timedEngine.initialize(createTestLevel());
      timedEngine.start();
      vi.advanceTimersByTime(3000);
      expect(timedEngine.timeRemaining()).toBe(7);
      timedEngine.pause();
      vi.advanceTimersByTime(5000);
      // Should still be 7 after pause
      expect(timedEngine.timeRemaining()).toBe(7);
      timedEngine.destroy();
    });

    it('should resume timer on resume', () => {
      const timedEngine = new TestEngine({ timerDuration: 10 });
      timedEngine.initialize(createTestLevel());
      timedEngine.start();
      vi.advanceTimersByTime(3000);
      expect(timedEngine.timeRemaining()).toBe(7);
      timedEngine.pause();
      vi.advanceTimersByTime(5000);
      timedEngine.resume();
      vi.advanceTimersByTime(2000);
      expect(timedEngine.timeRemaining()).toBe(5);
      timedEngine.destroy();
    });

    it('should not start timer when timerDuration is null', () => {
      engine.initialize(createTestLevel());
      engine.start();
      vi.advanceTimersByTime(5000);
      expect(engine.timeRemaining()).toBe(0);
    });
  });

  // --- 9. Read-only signal enforcement ---

  describe('Read-only signal enforcement', () => {
    it('should throw when attempting to set score directly', () => {
      expect(() => {
        (engine.score as unknown as { set: (v: number) => void }).set(999);
      }).toThrow();
    });

    it('should throw when attempting to set status directly', () => {
      expect(() => {
        (
          engine.status as unknown as { set: (v: MinigameStatus) => void }
        ).set(MinigameStatus.Won);
      }).toThrow();
    });
  });

  // --- 10. destroy() ---

  describe('destroy()', () => {
    it('should clear timer on destroy', () => {
      vi.useFakeTimers();
      const timedEngine = new TestEngine({ timerDuration: 30 });
      timedEngine.initialize(createTestLevel());
      timedEngine.start();
      vi.advanceTimersByTime(5000);
      expect(timedEngine.timeRemaining()).toBe(25);
      timedEngine.destroy();
      vi.advanceTimersByTime(5000);
      // Time should have been reset to 0 by destroy, not further decremented
      expect(timedEngine.timeRemaining()).toBe(0);
      vi.useRealTimers();
    });

    it('should set status to Lost (not reusable after destroy)', () => {
      engine.initialize(createTestLevel());
      engine.destroy();
      expect(engine.status()).toBe(MinigameStatus.Lost);
    });

    it('should reset score to 0, lives to 0, currentLevel to null', () => {
      engine.initialize(createTestLevel());
      engine.start();
      engine.submitAction('test');
      expect(engine.score()).toBeGreaterThan(0);

      engine.destroy();
      expect(engine.score()).toBe(0);
      expect(engine.lives()).toBe(0);
      expect(engine.currentLevel()).toBeNull();
    });

    it('should not allow start() after destroy (Lost status blocks it)', () => {
      engine.initialize(createTestLevel());
      engine.destroy();
      engine.start(); // no-op, status is Lost
      expect(engine.status()).toBe(MinigameStatus.Lost);
    });
  });

  // --- 11. Config getter ---

  describe('Config getter', () => {
    it('should expose engine config via public getter', () => {
      expect(engine.config).toEqual({
        initialLives: 3,
        timerDuration: null,
      });
    });

    it('should expose custom config values', () => {
      const customEngine = new TestEngine({ initialLives: 5, timerDuration: 60 });
      expect(customEngine.config.initialLives).toBe(5);
      expect(customEngine.config.timerDuration).toBe(60);
      customEngine.destroy();
    });
  });

  // --- 12. Computed state signal ---

  describe('Computed state signal', () => {
    it('should aggregate all signals into a MinigameState object', () => {
      engine.initialize(createTestLevel({ id: 'state-test-01' }));
      const state: MinigameState = engine.state();
      expect(state).toEqual({
        currentLevel: 'state-test-01',
        score: 0,
        lives: 3,
        timeRemaining: 0,
        status: MinigameStatus.Loading,
      });
    });

    it('should update reactively when individual signals change', () => {
      engine.initialize(createTestLevel());
      engine.start();
      engine.submitAction('test');
      const state = engine.state();
      expect(state.status).toBe(MinigameStatus.Playing);
      expect(state.score).toBe(10); // default nextValidationResult scoreChange
    });
  });
});
