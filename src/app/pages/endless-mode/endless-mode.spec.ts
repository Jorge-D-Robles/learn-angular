import { signal } from '@angular/core';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { createComponent, getMockProvider } from '../../../testing/test-utils';
import { EndlessModePage } from './endless-mode';
import { EndlessModeService, type EndlessSession } from '../../core/minigame/endless-mode.service';
import { MinigameRegistryService } from '../../core/minigame/minigame-registry.service';

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
  } = {}) {
    const {
      params = { gameId: 'module-assembly' },
      highScore = 0,
      endSessionResult = { finalScore: 0, isNewHighScore: false },
    } = options;

    const sessionSignal = signal<EndlessSession | null>(null);

    const endlessMock = {
      session: sessionSignal,
      startSession: vi.fn(),
      endSession: vi.fn(() => endSessionResult),
      getHighScore: vi.fn(() => highScore),
    };

    const registryMock = {
      getConfig: vi.fn((id: string) =>
        id === 'module-assembly'
          ? { id: 'module-assembly', name: 'Module Assembly' }
          : undefined,
      ),
    };

    const providers = [
      provideRouter([]),
      mockActivatedRoute(params),
      getMockProvider(EndlessModeService, endlessMock),
      getMockProvider(MinigameRegistryService, registryMock),
    ];

    return { sessionSignal, endlessMock, registryMock, providers };
  }

  async function startGame(
    element: HTMLElement,
    fixture: any,
    sessionSignal: ReturnType<typeof signal<EndlessSession | null>>,
    sessionOverrides: Partial<EndlessSession> = {},
  ) {
    sessionSignal.set(mockSession(sessionOverrides));
    const btn = element.querySelector('button') as HTMLButtonElement;
    btn.click();
    fixture.detectChanges();
    await fixture.whenStable();
  }

  async function endGame(element: HTMLElement, fixture: any) {
    const buttons = element.querySelectorAll('button');
    const endBtn = Array.from(buttons).find((b) => b.textContent?.includes('End Session'));
    endBtn!.click();
    fixture.detectChanges();
    await fixture.whenStable();
  }

  async function playAgain(element: HTMLElement, fixture: any) {
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

  // --- In-game state ---

  it('should display the current round number from the session', async () => {
    const { providers, sessionSignal } = setup();
    const { element, fixture } = await createComponent(EndlessModePage, { providers });

    await startGame(element, fixture, sessionSignal, { currentRound: 3 });

    expect(element.textContent).toContain('3');
  });

  it('should display the running score from the session', async () => {
    const { providers, sessionSignal } = setup();
    const { element, fixture } = await createComponent(EndlessModePage, { providers });

    await startGame(element, fixture, sessionSignal, { score: 250 });

    expect(element.textContent).toContain('250');
  });

  it('should display a difficulty label derived from the difficulty level', async () => {
    const { providers, sessionSignal } = setup();
    const { element, fixture } = await createComponent(EndlessModePage, { providers });

    await startGame(element, fixture, sessionSignal, { difficultyLevel: 5 });

    expect(element.textContent).toContain('Medium');
  });

  it('should render an "End Session" button in-game', async () => {
    const { providers, sessionSignal } = setup();
    const { element, fixture } = await createComponent(EndlessModePage, { providers });

    await startGame(element, fixture, sessionSignal);

    const buttons = element.querySelectorAll('button');
    const endBtn = Array.from(buttons).find((b) => b.textContent?.includes('End Session'));
    expect(endBtn).toBeTruthy();
  });

  // --- Ending a session / Post-game state ---

  it('should call endSession() when End Session is clicked', async () => {
    const { providers, sessionSignal, endlessMock } = setup({
      endSessionResult: { finalScore: 100, isNewHighScore: false },
    });
    const { element, fixture } = await createComponent(EndlessModePage, { providers });

    await startGame(element, fixture, sessionSignal, { currentRound: 2, score: 100 });
    await endGame(element, fixture);

    expect(endlessMock.endSession).toHaveBeenCalled();
  });

  it('should display the final score in post-game', async () => {
    const { providers, sessionSignal } = setup({
      endSessionResult: { finalScore: 350, isNewHighScore: false },
    });
    const { element, fixture } = await createComponent(EndlessModePage, { providers });

    await startGame(element, fixture, sessionSignal, { currentRound: 4, score: 350 });
    await endGame(element, fixture);

    expect(element.textContent).toContain('350');
  });

  it('should display the number of rounds survived', async () => {
    const { providers, sessionSignal } = setup({
      endSessionResult: { finalScore: 200, isNewHighScore: false },
    });
    const { element, fixture } = await createComponent(EndlessModePage, { providers });

    await startGame(element, fixture, sessionSignal, { currentRound: 5, score: 200 });
    await endGame(element, fixture);

    expect(element.textContent).toContain('5');
  });

  it('should show "New High Score!" badge when isNewHighScore is true', async () => {
    const { providers, sessionSignal } = setup({
      endSessionResult: { finalScore: 999, isNewHighScore: true },
    });
    const { element, fixture } = await createComponent(EndlessModePage, { providers });

    await startGame(element, fixture, sessionSignal, { currentRound: 10, score: 999 });
    await endGame(element, fixture);

    expect(element.textContent).toContain('New High Score!');
  });

  it('should NOT show "New High Score!" badge when isNewHighScore is false', async () => {
    const { providers, sessionSignal } = setup({
      endSessionResult: { finalScore: 50, isNewHighScore: false },
    });
    const { element, fixture } = await createComponent(EndlessModePage, { providers });

    await startGame(element, fixture, sessionSignal, { currentRound: 2, score: 50 });
    await endGame(element, fixture);

    expect(element.textContent).not.toContain('New High Score!');
  });

  it('should render a "Play Again" button in post-game', async () => {
    const { providers, sessionSignal } = setup({
      endSessionResult: { finalScore: 100, isNewHighScore: false },
    });
    const { element, fixture } = await createComponent(EndlessModePage, { providers });

    await startGame(element, fixture, sessionSignal, { currentRound: 2, score: 100 });
    await endGame(element, fixture);

    const buttons = element.querySelectorAll('button');
    const playAgainBtn = Array.from(buttons).find((b) => b.textContent?.includes('Play Again'));
    expect(playAgainBtn).toBeTruthy();
  });

  it('should render a "Back to Level Select" link pointing to /minigames/:gameId', async () => {
    const { providers, sessionSignal } = setup({
      endSessionResult: { finalScore: 100, isNewHighScore: false },
    });
    const { element, fixture } = await createComponent(EndlessModePage, { providers });

    await startGame(element, fixture, sessionSignal, { currentRound: 2, score: 100 });
    await endGame(element, fixture);

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
    await endGame(element, fixture);
    await playAgain(element, fixture);

    expect(component.viewState()).toBe('pre-game');
  });

  it('should refresh high score after Play Again when a new high score was set', async () => {
    let currentHighScore = 0;
    const sessionSignal = signal<EndlessSession | null>(null);
    const endlessMock = {
      session: sessionSignal,
      startSession: vi.fn(),
      endSession: vi.fn(() => {
        currentHighScore = 999;
        return { finalScore: 999, isNewHighScore: true };
      }),
      getHighScore: vi.fn(() => currentHighScore),
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
      }),
    ];

    const { element, fixture, component } = await createComponent(EndlessModePage, { providers });

    // Pre-game: high score is 0
    expect(component.highScore()).toBe(0);

    await startGame(element, fixture, sessionSignal, { currentRound: 10, score: 999 });
    await endGame(element, fixture);
    await playAgain(element, fixture);

    // After Play Again, high score should be refreshed to 999
    expect(component.highScore()).toBe(999);
  });
});
