import { Component, signal } from '@angular/core';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import {
  LucideIconConfig,
  LucideIconProvider,
  LUCIDE_ICONS,
} from 'lucide-angular';
import { of } from 'rxjs';
import { createComponent, getMockProvider } from '../../../testing/test-utils';
import { APP_ICONS } from '../../shared/icons';
import { EndlessModePage } from './endless-mode';
import { EndlessModeService, type EndlessSession } from '../../core/minigame/endless-mode.service';
import { MinigameRegistryService } from '../../core/minigame/minigame-registry.service';
import { AudioService } from '../../core/audio';
import { KeyboardShortcutService } from '../../core/minigame/keyboard-shortcut.service';
import { MinigameEngine, type ActionResult } from '../../core/minigame/minigame-engine';
import { PlayMode } from '../../core/minigame/minigame.types';

// --- Lucide icon providers needed by MinigameShellComponent sub-components ---

const ICON_PROVIDERS = [
  {
    provide: LUCIDE_ICONS,
    multi: true,
    useValue: new LucideIconProvider(APP_ICONS),
  },
  {
    provide: LucideIconConfig,
    useValue: Object.assign(new LucideIconConfig(), {
      size: 24,
      color: 'currentColor',
    }),
  },
];

// --- Concrete test engine subclass ---

class TestEngine extends MinigameEngine<unknown> {
  constructor() {
    super({ initialLives: 3, timerDuration: null });
  }
  protected onLevelLoad(): void { /* stub */ }
  protected onStart(): void { /* stub */ }
  protected onComplete(): void { /* stub */ }
  protected validateAction(): ActionResult {
    return { valid: true, scoreChange: 10, livesChange: 0 };
  }
}

// --- Dummy game component for NgComponentOutlet ---

@Component({
  selector: 'app-test-dummy',
  template: '<p class="dummy-game">dummy</p>',
})
class DummyGameComponent {}

// --- Helpers ---

function mockActivatedRoute(params: Record<string, string> = {}) {
  return {
    provide: ActivatedRoute,
    useValue: { paramMap: of(convertToParamMap(params)) },
  };
}

function mockSession(overrides: Partial<EndlessSession> = {}): EndlessSession {
  return {
    gameId: 'module-assembly',
    currentRound: 1,
    score: 0,
    difficultyLevel: 1,
    isActive: true,
    ...overrides,
  };
}

describe('EndlessModePage', () => {
  function setup(options: {
    params?: Record<string, string>;
    highScore?: number;
    endSessionResult?: { finalScore: number; isNewHighScore: boolean };
    hasEngineFactory?: boolean;
    hasComponent?: boolean;
  } = {}) {
    const {
      params = { gameId: 'module-assembly' },
      highScore = 0,
      endSessionResult = { finalScore: 0, isNewHighScore: false },
      hasEngineFactory = true,
      hasComponent = true,
    } = options;

    const sessionSignal = signal<EndlessSession | null>(null);

    const endlessMock = {
      session: sessionSignal,
      startSession: vi.fn(),
      endSession: vi.fn(() => endSessionResult),
      nextRound: vi.fn(),
      getHighScore: vi.fn(() => highScore),
      generateLevel: vi.fn((gameId: string, round: number) => ({
        id: `endless-${gameId}-r${round}`,
        gameId,
        tier: 'basic',
        conceptIntroduced: 'Endless Mode',
        description: `Endless round ${round}`,
        data: { round, difficulty: { speed: 1, complexity: 1, count: 3 } },
      })),
    };

    const mockEngine = new TestEngine();

    const registryMock = {
      getConfig: vi.fn((id: string) =>
        id === 'module-assembly'
          ? { id: 'module-assembly', name: 'Module Assembly' }
          : undefined,
      ),
      getEngineFactory: vi.fn(() =>
        hasEngineFactory ? () => mockEngine : null,
      ),
      getComponent: vi.fn(() =>
        hasComponent ? DummyGameComponent : null,
      ),
    };

    const audioMock = {
      play: vi.fn(),
      volume: signal(0.5),
      setVolume: vi.fn(),
      preload: vi.fn(),
    };

    const keyboardMock = {
      register: vi.fn(),
      unregister: vi.fn(),
      unregisterAll: vi.fn(),
      getRegistered: vi.fn(() => []),
      setEnabled: vi.fn(),
      isEnabled: signal(true),
      destroy: vi.fn(),
    };

    const providers = [
      provideRouter([]),
      mockActivatedRoute(params),
      getMockProvider(EndlessModeService, endlessMock),
      getMockProvider(MinigameRegistryService, registryMock),
      getMockProvider(AudioService, audioMock),
      getMockProvider(KeyboardShortcutService, keyboardMock),
      ...ICON_PROVIDERS,
    ];

    return { sessionSignal, endlessMock, registryMock, providers, mockEngine };
  }

  async function startGame(
    element: HTMLElement,
    fixture: { detectChanges: () => void; whenStable: () => Promise<void>; destroy: () => void },
    sessionSignal: ReturnType<typeof signal<EndlessSession | null>>,
    sessionOverrides: Partial<EndlessSession> = {},
  ) {
    sessionSignal.set(mockSession(sessionOverrides));
    const btn = element.querySelector('button') as HTMLButtonElement;
    btn.click();
    fixture.detectChanges();
    await fixture.whenStable();
  }

  async function endGame(component: EndlessModePage, fixture: { detectChanges: () => void; whenStable: () => Promise<void> }) {
    component.onEndSession();
    fixture.detectChanges();
    await fixture.whenStable();
  }

  async function playAgain(element: HTMLElement, fixture: { detectChanges: () => void; whenStable: () => Promise<void> }) {
    const buttons = element.querySelectorAll('button');
    const btn = Array.from(buttons).find((b) => b.textContent?.includes('Play Again'));
    btn!.click();
    fixture.detectChanges();
    await fixture.whenStable();
  }

  // --- Pre-game state ---

  it('should render the game name from MinigameRegistryService', async () => {
    const { providers } = setup();
    const { element } = await createComponent(EndlessModePage, { providers });
    expect(element.textContent).toContain('Module Assembly');
  });

  it('should display the current high score', async () => {
    const { providers } = setup({ highScore: 500 });
    const { element } = await createComponent(EndlessModePage, { providers });
    expect(element.textContent).toContain('500');
  });

  it('should display "High Score: 0" when no high score exists', async () => {
    const { providers } = setup();
    const { element } = await createComponent(EndlessModePage, { providers });
    expect(element.textContent).toContain('High Score: 0');
  });

  it('should render a "Start" button', async () => {
    const { providers } = setup();
    const { element } = await createComponent(EndlessModePage, { providers });
    const btn = element.querySelector('button');
    expect(btn?.textContent).toContain('Start');
  });

  it('should show unknown-game state when gameId is not in registry', async () => {
    const { providers } = setup({ params: { gameId: 'nonexistent-game' } });
    const { element } = await createComponent(EndlessModePage, { providers });
    expect(element.textContent).toContain('not found');
  });

  // --- Starting a session ---

  it('should call startSession(gameId) when Start is clicked', async () => {
    const { providers, endlessMock, sessionSignal } = setup();
    const { element, fixture } = await createComponent(EndlessModePage, { providers });

    await startGame(element, fixture, sessionSignal);

    expect(endlessMock.startSession).toHaveBeenCalledWith('module-assembly');
  });

  it('should transition viewState to in-game when Start is clicked', async () => {
    const { providers, sessionSignal } = setup();
    const { element, fixture, component } = await createComponent(EndlessModePage, { providers });

    await startGame(element, fixture, sessionSignal);

    expect(component.viewState()).toBe('in-game');
  });

  // --- In-game state (round number shown outside shell) ---

  it('should display the current round number from the session', async () => {
    const { providers, sessionSignal } = setup();
    const { element, fixture } = await createComponent(EndlessModePage, { providers });

    await startGame(element, fixture, sessionSignal, { currentRound: 3 });

    expect(element.textContent).toContain('3');
  });

  // --- Ending a session / Post-game state ---

  it('should call endSession() when onEndSession is called', async () => {
    const { providers, sessionSignal, endlessMock } = setup({
      endSessionResult: { finalScore: 100, isNewHighScore: false },
    });
    const { element, fixture, component } = await createComponent(EndlessModePage, { providers });

    await startGame(element, fixture, sessionSignal, { currentRound: 2, score: 100 });
    await endGame(component, fixture);

    expect(endlessMock.endSession).toHaveBeenCalled();
  });

  it('should display the final score in post-game', async () => {
    const { providers, sessionSignal } = setup({
      endSessionResult: { finalScore: 350, isNewHighScore: false },
    });
    const { element, fixture, component } = await createComponent(EndlessModePage, { providers });

    await startGame(element, fixture, sessionSignal, { currentRound: 4, score: 350 });
    await endGame(component, fixture);

    expect(element.textContent).toContain('350');
  });

  it('should display the number of rounds survived', async () => {
    const { providers, sessionSignal } = setup({
      endSessionResult: { finalScore: 200, isNewHighScore: false },
    });
    const { element, fixture, component } = await createComponent(EndlessModePage, { providers });

    await startGame(element, fixture, sessionSignal, { currentRound: 5, score: 200 });
    await endGame(component, fixture);

    expect(element.textContent).toContain('5');
  });

  it('should show "New High Score!" badge when isNewHighScore is true', async () => {
    const { providers, sessionSignal } = setup({
      endSessionResult: { finalScore: 999, isNewHighScore: true },
    });
    const { element, fixture, component } = await createComponent(EndlessModePage, { providers });

    await startGame(element, fixture, sessionSignal, { currentRound: 10, score: 999 });
    await endGame(component, fixture);

    expect(element.textContent).toContain('New High Score!');
  });

  it('should NOT show "New High Score!" badge when isNewHighScore is false', async () => {
    const { providers, sessionSignal } = setup({
      endSessionResult: { finalScore: 50, isNewHighScore: false },
    });
    const { element, fixture, component } = await createComponent(EndlessModePage, { providers });

    await startGame(element, fixture, sessionSignal, { currentRound: 2, score: 50 });
    await endGame(component, fixture);

    expect(element.textContent).not.toContain('New High Score!');
  });

  it('should render a "Play Again" button in post-game', async () => {
    const { providers, sessionSignal } = setup({
      endSessionResult: { finalScore: 100, isNewHighScore: false },
    });
    const { element, fixture, component } = await createComponent(EndlessModePage, { providers });

    await startGame(element, fixture, sessionSignal, { currentRound: 2, score: 100 });
    await endGame(component, fixture);

    const buttons = element.querySelectorAll('button');
    const playAgainBtn = Array.from(buttons).find((b) => b.textContent?.includes('Play Again'));
    expect(playAgainBtn).toBeTruthy();
  });

  it('should render a "Back to Level Select" link pointing to /minigames/:gameId', async () => {
    const { providers, sessionSignal } = setup({
      endSessionResult: { finalScore: 100, isNewHighScore: false },
    });
    const { element, fixture, component } = await createComponent(EndlessModePage, { providers });

    await startGame(element, fixture, sessionSignal, { currentRound: 2, score: 100 });
    await endGame(component, fixture);

    const link = element.querySelector('a[href="/minigames/module-assembly"]');
    expect(link).toBeTruthy();
    expect(link?.textContent).toContain('Back to Level Select');
  });

  // --- Play Again flow ---

  it('should transition back to pre-game state when Play Again is clicked', async () => {
    const { providers, sessionSignal } = setup({
      endSessionResult: { finalScore: 100, isNewHighScore: false },
    });
    const { element, fixture, component } = await createComponent(EndlessModePage, { providers });

    await startGame(element, fixture, sessionSignal, { currentRound: 2, score: 100 });
    await endGame(component, fixture);
    await playAgain(element, fixture);

    expect(component.viewState()).toBe('pre-game');
  });

  it('should refresh high score after Play Again when a new high score was set', async () => {
    let currentHighScore = 0;
    const sessionSignal = signal<EndlessSession | null>(null);
    const mockEngine = new TestEngine();
    const endlessMock = {
      session: sessionSignal,
      startSession: vi.fn(),
      endSession: vi.fn(() => {
        currentHighScore = 999;
        return { finalScore: 999, isNewHighScore: true };
      }),
      nextRound: vi.fn(),
      getHighScore: vi.fn(() => currentHighScore),
      generateLevel: vi.fn(() => ({
        id: 'endless-module-assembly-r1',
        gameId: 'module-assembly',
        tier: 'basic',
        conceptIntroduced: 'Endless Mode',
        description: 'Endless round 1',
        data: { round: 1, difficulty: { speed: 1, complexity: 1, count: 3 } },
      })),
    };

    const providers = [
      provideRouter([]),
      mockActivatedRoute({ gameId: 'module-assembly' }),
      getMockProvider(EndlessModeService, endlessMock),
      getMockProvider(MinigameRegistryService, {
        getConfig: vi.fn((id: string) =>
          id === 'module-assembly'
            ? { id: 'module-assembly', name: 'Module Assembly' }
            : undefined,
        ),
        getEngineFactory: vi.fn(() => () => mockEngine),
        getComponent: vi.fn(() => DummyGameComponent),
      }),
      getMockProvider(AudioService, { play: vi.fn(), volume: signal(0.5), setVolume: vi.fn(), preload: vi.fn() }),
      getMockProvider(KeyboardShortcutService, {
        register: vi.fn(), unregister: vi.fn(), unregisterAll: vi.fn(),
        getRegistered: vi.fn(() => []), setEnabled: vi.fn(), isEnabled: signal(true), destroy: vi.fn(),
      }),
      ...ICON_PROVIDERS,
    ];

    const { element, fixture, component } = await createComponent(EndlessModePage, { providers });

    // Pre-game: high score is 0
    expect(component.highScore()).toBe(0);

    await startGame(element, fixture, sessionSignal, { currentRound: 10, score: 999 });
    await endGame(component, fixture);
    await playAgain(element, fixture);

    // After Play Again, high score should be refreshed to 999
    expect(component.highScore()).toBe(999);
  });

  // --- Engine integration tests ---

  it('should create engine from registry factory on start', async () => {
    const { providers, sessionSignal, mockEngine, registryMock } = setup();
    const { element, fixture, component } = await createComponent(EndlessModePage, { providers });

    await startGame(element, fixture, sessionSignal);

    expect(registryMock.getEngineFactory).toHaveBeenCalledWith('module-assembly');
    expect(component.engine()).toBe(mockEngine);
  });

  it('should initialize engine with PlayMode.Endless', async () => {
    const { providers, sessionSignal, mockEngine } = setup();
    const { element, fixture } = await createComponent(EndlessModePage, { providers });

    await startGame(element, fixture, sessionSignal);

    expect(mockEngine.playMode()).toBe(PlayMode.Endless);
  });

  it('should NOT start session if no engine factory is available', async () => {
    const { providers, endlessMock } = setup({ hasEngineFactory: false });
    const { element, fixture } = await createComponent(EndlessModePage, { providers });

    // Click Start
    const btn = element.querySelector('button') as HTMLButtonElement;
    btn.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(endlessMock.startSession).not.toHaveBeenCalled();
  });

  it('should call nextRound and re-initialize engine when engine status is Won', async () => {
    const { providers, sessionSignal, mockEngine, endlessMock } = setup();
    const { element, fixture } = await createComponent(EndlessModePage, { providers });

    await startGame(element, fixture, sessionSignal);

    // Engine is now Playing. Simulate a round win.
    // First add some score
    mockEngine.submitAction({});
    // Then complete the round
    mockEngine.complete();

    fixture.detectChanges();
    await fixture.whenStable();

    expect(endlessMock.nextRound).toHaveBeenCalledWith(10); // score from submitAction
  });

  it('should include partial score and end session when engine status is Lost', async () => {
    const { providers, sessionSignal, mockEngine, endlessMock } = setup({
      endSessionResult: { finalScore: 50, isNewHighScore: false },
    });
    const { element, fixture, component } = await createComponent(EndlessModePage, { providers });

    await startGame(element, fixture, sessionSignal);

    // Add some score
    mockEngine.submitAction({});
    // Simulate failure
    mockEngine.fail();

    fixture.detectChanges();
    await fixture.whenStable();

    // Partial score should be included
    expect(endlessMock.nextRound).toHaveBeenCalledWith(10);
    expect(endlessMock.endSession).toHaveBeenCalled();
    expect(component.viewState()).toBe('post-game');
  });

  it('should re-initialize with PlayMode.Endless on restart round (not reset)', async () => {
    const { providers, sessionSignal, mockEngine } = setup();
    const { element, fixture, component } = await createComponent(EndlessModePage, { providers });

    await startGame(element, fixture, sessionSignal);

    const initSpy = vi.spyOn(mockEngine, 'initialize');
    const startSpy = vi.spyOn(mockEngine, 'start');
    const setPlayModeSpy = vi.spyOn(mockEngine, 'setPlayMode');

    component.onRestartRound();

    expect(initSpy).toHaveBeenCalled();
    expect(setPlayModeSpy).toHaveBeenCalledWith(PlayMode.Endless);
    expect(startSpy).toHaveBeenCalled();
  });

  it('should destroy engine on component destroy', async () => {
    const { providers, sessionSignal, mockEngine } = setup();
    const { element, fixture } = await createComponent(EndlessModePage, { providers });

    await startGame(element, fixture, sessionSignal);

    const destroySpy = vi.spyOn(mockEngine, 'destroy');
    fixture.destroy();

    expect(destroySpy).toHaveBeenCalled();
  });

  it('should display round indicator in in-game state', async () => {
    const { providers, sessionSignal } = setup();
    const { element, fixture } = await createComponent(EndlessModePage, { providers });

    await startGame(element, fixture, sessionSignal, { currentRound: 7 });

    const roundIndicator = element.querySelector('.round-indicator');
    expect(roundIndicator).toBeTruthy();
    expect(roundIndicator?.textContent).toContain('7');
  });
});
