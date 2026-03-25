import { Component, signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import {
  LucideIconConfig,
  LucideIconProvider,
  LUCIDE_ICONS,
} from 'lucide-angular';
import { createComponent, getMockProvider } from '../../../testing/test-utils';
import { APP_ICONS } from '../../shared/icons';
import { DailyChallengePage } from './daily-challenge';
import {
  DailyChallengeService,
  type DailyChallenge,
} from '../../core/progression/daily-challenge.service';
import { StreakService } from '../../core/progression/streak.service';
import { MinigameRegistryService } from '../../core/minigame/minigame-registry.service';
import { AudioService } from '../../core/audio';
import { KeyboardShortcutService } from '../../core/minigame/keyboard-shortcut.service';
import { MinigameEngine, type ActionResult } from '../../core/minigame/minigame-engine';
import { PlayMode } from '../../core/minigame/minigame.types';
import type { MinigameConfig } from '../../core/minigame/minigame.types';
import { DifficultyTier } from '../../core/minigame/minigame.types';

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

// --- Test data ---

const TEST_CHALLENGE: DailyChallenge = {
  date: '2026-03-25',
  gameId: 'module-assembly',
  levelId: 'daily-module-assembly-2026-03-25',
  bonusXp: 50,
  completed: false,
};

const TEST_CONFIG: MinigameConfig = {
  id: 'module-assembly',
  name: 'Module Assembly',
  description: 'Conveyor belt drag-and-drop assembly',
  angularTopic: 'Components',
  totalLevels: 18,
  difficultyTiers: [
    DifficultyTier.Basic,
    DifficultyTier.Intermediate,
    DifficultyTier.Advanced,
    DifficultyTier.Boss,
  ],
};

interface SetupOptions {
  challenge?: DailyChallenge;
  streakDays?: number;
  streakMultiplier?: number;
  config?: MinigameConfig | undefined;
  hasEngineFactory?: boolean;
  hasComponent?: boolean;
}

function setup(options: SetupOptions = {}) {
  const {
    challenge = TEST_CHALLENGE,
    streakDays = 3,
    streakMultiplier = 1.3,
    config = TEST_CONFIG,
    hasEngineFactory = true,
    hasComponent = true,
  } = options;

  const challengeSignal = signal(challenge);
  const mockEngine = new TestEngine();

  const dailyChallengeMock = {
    todaysChallenge: challengeSignal,
    completeChallenge: vi.fn(),
  };

  const registryMock = {
    getConfig: vi.fn((id: string) =>
      id === config?.id ? config : undefined,
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
    getMockProvider(DailyChallengeService, dailyChallengeMock),
    getMockProvider(StreakService, {
      activeStreakDays: signal(streakDays),
      streakMultiplier: signal(streakMultiplier),
    }),
    getMockProvider(MinigameRegistryService, registryMock),
    getMockProvider(AudioService, audioMock),
    getMockProvider(KeyboardShortcutService, keyboardMock),
    ...ICON_PROVIDERS,
  ];

  return { challengeSignal, providers, mockEngine, registryMock, dailyChallengeMock };
}

describe('DailyChallengePage', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('should create the component', async () => {
    const { providers } = setup();
    const { component } = await createComponent(DailyChallengePage, {
      providers,
    });
    expect(component).toBeTruthy();
  });

  // --- Challenge display ---

  it('should show game name from MinigameRegistryService', async () => {
    const { providers } = setup();
    const { element } = await createComponent(DailyChallengePage, {
      providers,
    });
    expect(element.textContent).toContain('Module Assembly');
  });

  it('should show Angular topic from MinigameRegistryService', async () => {
    const { providers } = setup();
    const { element } = await createComponent(DailyChallengePage, {
      providers,
    });
    expect(element.textContent).toContain('Components');
  });

  it('should show bonus XP value (50)', async () => {
    const { providers } = setup();
    const { element } = await createComponent(DailyChallengePage, {
      providers,
    });
    expect(element.textContent).toContain('50');
  });

  it('should show level ID as preview text', async () => {
    const { providers } = setup();
    const { element } = await createComponent(DailyChallengePage, {
      providers,
    });
    expect(element.textContent).toContain(
      'daily-module-assembly-2026-03-25',
    );
  });

  // --- Pending state (now "pre-game") ---

  it('should show "Accept Challenge" button when not completed', async () => {
    const { providers } = setup();
    const { element } = await createComponent(DailyChallengePage, {
      providers,
    });
    const button = element.querySelector('button.daily-challenge__accept-btn');
    expect(button?.textContent).toContain('Accept Challenge');
  });

  // --- Completed state ---

  it('should show completion checkmark when challenge is completed', async () => {
    const { providers } = setup({
      challenge: { ...TEST_CHALLENGE, completed: true },
    });
    const { element } = await createComponent(DailyChallengePage, {
      providers,
    });
    expect(element.textContent).toContain('\u2713');
  });

  it('should show countdown timer when challenge is completed', async () => {
    // Set fake time to 2026-03-25 at 18:00:00 (6 hours = 21600s until midnight)
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 2, 25, 18, 0, 0));

    const { providers } = setup({
      challenge: { ...TEST_CHALLENGE, completed: true },
    });
    const { element } = await createComponent(DailyChallengePage, {
      providers,
    });
    // 6 hours = 6:00:00 in short format
    expect(element.textContent).toContain('6:00:00');
  });

  it('should NOT show "Accept Challenge" when completed', async () => {
    const { providers } = setup({
      challenge: { ...TEST_CHALLENGE, completed: true },
    });
    const { element } = await createComponent(DailyChallengePage, {
      providers,
    });
    expect(element.textContent).not.toContain('Accept Challenge');
  });

  // --- Streak display ---

  it('should show current streak days', async () => {
    const { providers } = setup({ streakDays: 7 });
    const { element } = await createComponent(DailyChallengePage, {
      providers,
    });
    expect(element.textContent).toContain('7');
  });

  it('should show streak multiplier formatted as percentage', async () => {
    const { providers } = setup({ streakMultiplier: 1.3 });
    const { element } = await createComponent(DailyChallengePage, {
      providers,
    });
    expect(element.textContent).toContain('130%');
  });

  // --- Countdown timer ---

  it('should compute seconds until midnight correctly', async () => {
    // Set to 23:00:00 — 1 hour (3600s) until midnight
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 2, 25, 23, 0, 0));

    const { providers } = setup({
      challenge: { ...TEST_CHALLENGE, completed: true },
    });
    const { component } = await createComponent(DailyChallengePage, {
      providers,
    });
    expect(component.countdown()).toBe(3600);
  });

  // --- viewState initialization ---

  it('should show completed viewState when challenge was already completed on load', async () => {
    const { providers } = setup({
      challenge: { ...TEST_CHALLENGE, completed: true },
    });
    const { component } = await createComponent(DailyChallengePage, {
      providers,
    });
    expect(component.viewState()).toBe('completed');
  });

  it('should show pre-game viewState when challenge is not completed', async () => {
    const { providers } = setup();
    const { component } = await createComponent(DailyChallengePage, {
      providers,
    });
    expect(component.viewState()).toBe('pre-game');
  });

  // --- Engine integration tests ---

  it('should create engine from registry factory when accepting challenge', async () => {
    const { providers, registryMock, mockEngine } = setup();
    const { component, fixture } = await createComponent(DailyChallengePage, {
      providers,
    });

    component.onAcceptChallenge();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(registryMock.getEngineFactory).toHaveBeenCalledWith('module-assembly');
    expect(component.engine()).toBe(mockEngine);
  });

  it('should initialize engine with PlayMode.DailyChallenge', async () => {
    const { providers, mockEngine } = setup();
    const { component, fixture } = await createComponent(DailyChallengePage, {
      providers,
    });

    component.onAcceptChallenge();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(mockEngine.playMode()).toBe(PlayMode.DailyChallenge);
  });

  it('should set viewState to in-game when accepting challenge', async () => {
    const { providers } = setup();
    const { component, fixture } = await createComponent(DailyChallengePage, {
      providers,
    });

    component.onAcceptChallenge();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.viewState()).toBe('in-game');
  });

  it('should NOT start game if no engine factory is available', async () => {
    const { providers } = setup({ hasEngineFactory: false });
    const { component, fixture } = await createComponent(DailyChallengePage, {
      providers,
    });

    component.onAcceptChallenge();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.viewState()).toBe('pre-game');
  });

  it('should call completeChallenge() when engine status becomes Won', async () => {
    const { providers, mockEngine, dailyChallengeMock } = setup();
    const { component, fixture } = await createComponent(DailyChallengePage, {
      providers,
    });

    component.onAcceptChallenge();
    fixture.detectChanges();
    await fixture.whenStable();

    // Simulate a win
    mockEngine.submitAction({});
    mockEngine.complete();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(dailyChallengeMock.completeChallenge).toHaveBeenCalled();
  });

  it('should show post-game state after winning', async () => {
    const { providers, mockEngine } = setup();
    const { component, fixture } = await createComponent(DailyChallengePage, {
      providers,
    });

    component.onAcceptChallenge();
    fixture.detectChanges();
    await fixture.whenStable();

    // Simulate a win
    mockEngine.submitAction({});
    mockEngine.complete();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.viewState()).toBe('post-game');
  });

  it('should re-initialize engine with PlayMode.DailyChallenge on retry (not reset)', async () => {
    const { providers, mockEngine } = setup();
    const { component, fixture } = await createComponent(DailyChallengePage, {
      providers,
    });

    component.onAcceptChallenge();
    fixture.detectChanges();
    await fixture.whenStable();

    const initSpy = vi.spyOn(mockEngine, 'initialize');
    const setPlayModeSpy = vi.spyOn(mockEngine, 'setPlayMode');
    const startSpy = vi.spyOn(mockEngine, 'start');

    component.onRetry();

    expect(initSpy).toHaveBeenCalled();
    expect(setPlayModeSpy).toHaveBeenCalledWith(PlayMode.DailyChallenge);
    expect(startSpy).toHaveBeenCalled();
  });

  it('should destroy engine and return to pre-game on quit', async () => {
    const { providers, mockEngine } = setup();
    const { component, fixture } = await createComponent(DailyChallengePage, {
      providers,
    });

    component.onAcceptChallenge();
    fixture.detectChanges();
    await fixture.whenStable();

    const destroySpy = vi.spyOn(mockEngine, 'destroy');

    component.onQuit();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(destroySpy).toHaveBeenCalled();
    expect(component.viewState()).toBe('pre-game');
  });

  it('should destroy engine on component destroy', async () => {
    const { providers, mockEngine } = setup();
    const { component, fixture } = await createComponent(DailyChallengePage, {
      providers,
    });

    component.onAcceptChallenge();
    fixture.detectChanges();
    await fixture.whenStable();

    const destroySpy = vi.spyOn(mockEngine, 'destroy');

    fixture.destroy();

    expect(destroySpy).toHaveBeenCalled();
  });
});
