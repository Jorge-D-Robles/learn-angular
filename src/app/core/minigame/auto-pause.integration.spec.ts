import { vi } from 'vitest';
import {
  MinigameEngine,
  type ActionResult,
  type MinigameEngineConfig,
} from './minigame-engine';
import { MinigameStatus, DifficultyTier } from './minigame.types';
import type { MinigameLevel } from './minigame.types';

// --- Test subclass ---

class TestableEngine extends MinigameEngine<{ difficulty: number }> {
  onPauseCalled = false;
  onResumeCalled = false;

  constructor(config?: Partial<MinigameEngineConfig>) {
    super(config);
  }

  protected onLevelLoad(): void { /* no-op */ }
  protected onStart(): void { /* no-op */ }
  protected onComplete(): void { /* no-op */ }
  protected validateAction(): ActionResult {
    return { valid: true, scoreChange: 10, livesChange: 0 };
  }
  protected override onPause(): void { this.onPauseCalled = true; }
  protected override onResume(): void { this.onResumeCalled = true; }
}

// --- Test helpers ---

function createTestLevel(): MinigameLevel<{ difficulty: number }> {
  return {
    id: 'test-level-01',
    gameId: 'module-assembly',
    tier: DifficultyTier.Basic,
    conceptIntroduced: 'Test concept',
    description: 'A test level',
    data: { difficulty: 1 },
  };
}

function simulateVisibilityChange(hidden: boolean): void {
  Object.defineProperty(document, 'hidden', {
    configurable: true,
    get: () => hidden,
  });
  document.dispatchEvent(new Event('visibilitychange'));
}

// --- Tests ---

describe('MinigameEngine auto-pause integration', () => {
  let engine: TestableEngine;

  beforeEach(() => {
    engine = new TestableEngine();
    engine.initialize(createTestLevel());
    engine.start();
  });

  afterEach(() => {
    engine.destroy();
    // Delete the instance override on document.hidden — falls back to the prototype getter.
    // In JSDOM, `hidden` is always a prototype getter, so delete is sufficient.
    if (Object.getOwnPropertyDescriptor(document, 'hidden')) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (document as any)['hidden'];
    }
  });

  it('should auto-pause when document becomes hidden while Playing', () => {
    expect(engine.status()).toBe(MinigameStatus.Playing);

    simulateVisibilityChange(true);
    expect(engine.status()).toBe(MinigameStatus.Paused);

    // Behavioral _autoPaused verification: auto-resume confirms _autoPaused was set
    simulateVisibilityChange(false);
    expect(engine.status()).toBe(MinigameStatus.Playing);
  });

  it('should auto-resume when document becomes visible after auto-pause', () => {
    simulateVisibilityChange(true);
    expect(engine.status()).toBe(MinigameStatus.Paused);

    simulateVisibilityChange(false);
    expect(engine.status()).toBe(MinigameStatus.Playing);
  });

  it('should NOT auto-resume after manual pause (manual pause takes precedence)', () => {
    engine.pause();
    expect(engine.status()).toBe(MinigameStatus.Paused);

    // Tab hidden then visible — should NOT auto-resume because pause was manual
    simulateVisibilityChange(true);
    simulateVisibilityChange(false);
    expect(engine.status()).toBe(MinigameStatus.Paused);
  });

  it('should call onPause on auto-pause and onResume on auto-resume', () => {
    expect(engine.onPauseCalled).toBe(false);
    expect(engine.onResumeCalled).toBe(false);

    simulateVisibilityChange(true);
    expect(engine.onPauseCalled).toBe(true);

    simulateVisibilityChange(false);
    expect(engine.onResumeCalled).toBe(true);
  });

  describe('timer during auto-pause', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should exclude auto-paused duration from timer elapsed time', () => {
      // Need a fresh engine with timerDuration for this test
      engine.destroy();
      engine = new TestableEngine({ timerDuration: 30 });
      engine.initialize(createTestLevel());
      engine.start();

      // Play for 5 seconds (timeRemaining = 25)
      vi.advanceTimersByTime(5000);
      expect(engine.timeRemaining()).toBe(25);

      // Auto-pause
      simulateVisibilityChange(true);
      expect(engine.status()).toBe(MinigameStatus.Paused);

      // Advance 10 seconds while paused — timer should be frozen
      vi.advanceTimersByTime(10000);
      expect(engine.timeRemaining()).toBe(25);

      // Auto-resume
      simulateVisibilityChange(false);
      expect(engine.status()).toBe(MinigameStatus.Playing);

      // Play for 3 more seconds (only 5+3=8s of actual play elapsed)
      vi.advanceTimersByTime(3000);
      expect(engine.timeRemaining()).toBe(22);
    });
  });
});
