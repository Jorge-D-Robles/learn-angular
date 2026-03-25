import { Component, signal } from '@angular/core';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { LucideIconConfig, LucideIconProvider, LUCIDE_ICONS } from 'lucide-angular';
import { of } from 'rxjs';
import { createComponent, getMockProvider } from '../../../testing/test-utils';
import { APP_ICONS } from '../../shared/icons';
import { RefresherChallengePage } from './refresher';
import {
  RefresherChallengeService,
  type RefresherChallenge,
} from '../../core/progression/refresher-challenge.service';
import { SpacedRepetitionService } from '../../core/progression/spaced-repetition.service';
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

const TEST_CHALLENGE: RefresherChallenge = {
  topicId: 'module-assembly',
  questions: 4,
  gameId: 'module-assembly',
  microLevelIds: ['ma-basic-01', 'ma-basic-02', 'ma-basic-03', 'ma-inter-01'],
  restoredStars: 1,
};

function mockActivatedRoute(params: Record<string, string> = {}) {
  return {
    provide: ActivatedRoute,
    useValue: { paramMap: of(convertToParamMap(params)) },
  };
}

/** Flush microtasks so .then() callbacks resolve. */
function flushMicrotasks(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

interface SetupOptions {
  topicId?: string;
  challenge?: RefresherChallenge | null;
  challengeError?: Error;
  beforeMastery?: number;
  afterMastery?: number;
  config?: MinigameConfig | undefined;
  hasEngineFactory?: boolean;
  hasComponent?: boolean;
}

function setup(options: SetupOptions = {}) {
  const {
    topicId = 'module-assembly',
    challenge = TEST_CHALLENGE,
    challengeError,
    beforeMastery = 2,
    afterMastery = 3,
    config = TEST_CONFIG,
    hasEngineFactory = true,
    hasComponent = true,
  } = options;

  let mastery = beforeMastery;
  const mockEngine = new TestEngine();
  const generateRefresher = challengeError
    ? vi.fn().mockRejectedValue(challengeError)
    : vi.fn().mockResolvedValue(challenge);

  const completeRefresher = vi.fn().mockImplementation(() => {
    mastery = afterMastery;
    return true;
  });

  const getEffectiveMastery = vi.fn().mockImplementation(() => mastery);

  const registryMock = {
    getConfig: vi.fn((id: string) => (id === config?.id ? config : undefined)),
    getEngineFactory: vi.fn(() => (hasEngineFactory ? () => mockEngine : null)),
    getComponent: vi.fn(() => (hasComponent ? DummyGameComponent : null)),
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
    ...ICON_PROVIDERS,
    mockActivatedRoute(topicId ? { topicId } : {}),
    getMockProvider(RefresherChallengeService, {
      generateRefresher,
      completeRefresher,
    }),
    getMockProvider(SpacedRepetitionService, {
      getEffectiveMastery,
    }),
    getMockProvider(MinigameRegistryService, registryMock),
    getMockProvider(AudioService, audioMock),
    getMockProvider(KeyboardShortcutService, keyboardMock),
  ];

  return { providers, mockEngine, registryMock, generateRefresher, completeRefresher, getEffectiveMastery };
}

describe('RefresherChallengePage', () => {
  // 1. Component creation
  it('should create the component', async () => {
    const { providers } = setup();
    const { component } = await createComponent(RefresherChallengePage, {
      providers,
    });
    expect(component).toBeTruthy();
  });

  // 2. Loading state
  it('should show loading spinner while generateRefresher is pending', async () => {
    let resolveChallenge!: (value: RefresherChallenge | null) => void;
    const pendingPromise = new Promise<RefresherChallenge | null>((resolve) => {
      resolveChallenge = resolve;
    });

    const { providers } = setup();
    // Override generateRefresher to return a pending promise
    const refresherService = providers.find(
      (p: any) => p?.provide === RefresherChallengeService,
    ) as any;
    refresherService.useValue.generateRefresher = vi.fn().mockReturnValue(pendingPromise);

    const { element } = await createComponent(RefresherChallengePage, {
      providers,
    });

    const spinner = element.querySelector('nx-loading-spinner');
    expect(spinner).toBeTruthy();

    // Clean up
    resolveChallenge(null);
  });

  // 3. Not-degrading state
  it('should show "All caught up!" when generateRefresher returns null', async () => {
    const { providers } = setup({ challenge: null });
    const { fixture, element } = await createComponent(RefresherChallengePage, {
      providers,
    });
    await flushMicrotasks();
    fixture.detectChanges();
    expect(element.textContent).toContain('All caught up!');
  });

  // 4. Not-degrading back link
  it('should show "Back to Dashboard" link in not-degrading state', async () => {
    const { providers } = setup({ challenge: null });
    const { fixture, element } = await createComponent(RefresherChallengePage, {
      providers,
    });
    await flushMicrotasks();
    fixture.detectChanges();
    const link = element.querySelector('a[href="/dashboard"]');
    expect(link).toBeTruthy();
    expect(link?.textContent).toContain('Back to Dashboard');
  });

  // 5. Playing state - topic name
  it('should display challenge topic name from MinigameRegistryService', async () => {
    const { providers } = setup();
    const { fixture, element } = await createComponent(RefresherChallengePage, {
      providers,
    });
    await flushMicrotasks();
    fixture.detectChanges();
    expect(element.textContent).toContain('Module Assembly');
  });

  // 9. Challenge completion - completeRefresher called (via engine wins)
  it('should call completeRefresher when all micro-levels are won via engine', async () => {
    const { providers, completeRefresher, mockEngine } = setup();
    const { fixture } = await createComponent(RefresherChallengePage, {
      providers,
    });
    await flushMicrotasks();
    fixture.detectChanges();

    // Win all 4 levels sequentially
    for (let i = 0; i < 4; i++) {
      mockEngine.submitAction({});
      mockEngine.complete();
      fixture.detectChanges();
      await fixture.whenStable();
    }

    expect(completeRefresher).toHaveBeenCalledWith('module-assembly');
  });

  // 10. Completed state - mastery restoration display (via engine wins)
  it('should show mastery restoration result with before/after stars', async () => {
    const { providers, mockEngine } = setup({ beforeMastery: 2, afterMastery: 3 });
    const { fixture, element } = await createComponent(RefresherChallengePage, {
      providers,
    });
    await flushMicrotasks();
    fixture.detectChanges();

    // Win all 4 levels
    for (let i = 0; i < 4; i++) {
      mockEngine.submitAction({});
      mockEngine.complete();
      fixture.detectChanges();
      await fixture.whenStable();
    }

    expect(element.textContent).toContain('2');
    expect(element.textContent).toContain('3');
    const masteryStars = element.querySelectorAll('nx-mastery-stars');
    expect(masteryStars.length).toBeGreaterThanOrEqual(2);
  });

  // 11. Completed state - back link (via engine wins)
  it('should show "Back to Dashboard" link in completed state', async () => {
    const { providers, mockEngine } = setup();
    const { fixture, element } = await createComponent(RefresherChallengePage, {
      providers,
    });
    await flushMicrotasks();
    fixture.detectChanges();

    // Win all 4 levels
    for (let i = 0; i < 4; i++) {
      mockEngine.submitAction({});
      mockEngine.complete();
      fixture.detectChanges();
      await fixture.whenStable();
    }

    const link = element.querySelector('a[href="/dashboard"]');
    expect(link).toBeTruthy();
    expect(link?.textContent).toContain('Back to Dashboard');
  });

  // 12. Error state
  it('should show error message when generateRefresher throws', async () => {
    const { providers } = setup({
      challengeError: new Error('Network failure'),
    });
    const { fixture, element } = await createComponent(RefresherChallengePage, {
      providers,
    });
    await flushMicrotasks();
    fixture.detectChanges();
    const errorState = element.querySelector('nx-error-state');
    expect(errorState).toBeTruthy();
  });

  // 13. Error state - retry
  it('should allow retry on error', async () => {
    const { providers, generateRefresher } = setup({
      challengeError: new Error('Network failure'),
    });
    const { fixture, element } = await createComponent(RefresherChallengePage, {
      providers,
    });
    await flushMicrotasks();
    fixture.detectChanges();

    // Now make the next call succeed
    generateRefresher.mockResolvedValue(TEST_CHALLENGE);

    const retryBtn = element.querySelector<HTMLButtonElement>('.error-state__retry-btn');
    expect(retryBtn).toBeTruthy();
    retryBtn!.click();
    fixture.detectChanges();
    await flushMicrotasks();
    fixture.detectChanges();

    // After retry, should be in playing state
    expect(generateRefresher).toHaveBeenCalledTimes(2);
  });

  // 14. Empty topicId
  it('should handle missing route param gracefully (not-degrading state)', async () => {
    const { providers } = setup({ topicId: '' });
    const { element } = await createComponent(RefresherChallengePage, {
      providers,
    });
    expect(element.textContent).toContain('All caught up!');
  });

  // --- Engine integration tests ---

  // E1. Engine factory resolution
  it('should create engine from registry factory when challenge loads', async () => {
    const { providers, registryMock, mockEngine } = setup();
    const { fixture, component } = await createComponent(RefresherChallengePage, {
      providers,
    });
    await flushMicrotasks();
    fixture.detectChanges();

    expect(registryMock.getEngineFactory).toHaveBeenCalledWith('module-assembly');
    expect(component.engine()).toBe(mockEngine);
    expect(component.viewState()).toBe('playing');
  });

  // E2. Engine initialized with PlayMode.Story
  it('should initialize engine with PlayMode.Story', async () => {
    const { providers, mockEngine } = setup();
    const { fixture } = await createComponent(RefresherChallengePage, {
      providers,
    });
    await flushMicrotasks();
    fixture.detectChanges();

    expect(mockEngine.playMode()).toBe(PlayMode.Story);
  });

  // E3. Advance to next micro-level on Win
  it('should advance to next micro-level when engine status becomes Won', async () => {
    const { providers, mockEngine } = setup();
    const { fixture, component } = await createComponent(RefresherChallengePage, {
      providers,
    });
    await flushMicrotasks();
    fixture.detectChanges();

    // Win first level
    mockEngine.submitAction({});
    mockEngine.complete();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.completedCount()).toBe(1);
    // Engine should still exist (more levels to go)
    expect(component.engine()).toBe(mockEngine);
    // Should be re-initialized for next level
    expect(mockEngine.currentLevel()).toBe('ma-basic-02');
  });

  // E4. Complete all micro-levels
  it('should call completeRefresher when all micro-levels are won', async () => {
    const { providers, completeRefresher, mockEngine } = setup();
    const { fixture, component } = await createComponent(RefresherChallengePage, {
      providers,
    });
    await flushMicrotasks();
    fixture.detectChanges();

    // Win all 4 levels
    for (let i = 0; i < 4; i++) {
      mockEngine.submitAction({});
      mockEngine.complete();
      fixture.detectChanges();
      await fixture.whenStable();
    }

    expect(completeRefresher).toHaveBeenCalledWith('module-assembly');
    expect(component.viewState()).toBe('completed');
    expect(component.engine()).toBeNull();
  });

  // E5. No engine factory available
  it('should show error if no engine factory is available', async () => {
    const { providers } = setup({ hasEngineFactory: false });
    const { fixture, component } = await createComponent(RefresherChallengePage, {
      providers,
    });
    await flushMicrotasks();
    fixture.detectChanges();

    expect(component.viewState()).toBe('error');
  });

  // E6. Destroy engine on quit
  it('should destroy engine and reset on quit', async () => {
    const { providers, mockEngine } = setup();
    const { fixture, component } = await createComponent(RefresherChallengePage, {
      providers,
    });
    await flushMicrotasks();
    fixture.detectChanges();

    const destroySpy = vi.spyOn(mockEngine, 'destroy');

    component.onQuit();
    fixture.detectChanges();

    expect(destroySpy).toHaveBeenCalled();
    expect(component.engine()).toBeNull();
    expect(component.viewState()).toBe('loading');
  });

  // E7. Destroy engine on component destroy
  it('should destroy engine on component destroy', async () => {
    const { providers, mockEngine } = setup();
    const { fixture } = await createComponent(RefresherChallengePage, {
      providers,
    });
    await flushMicrotasks();
    fixture.detectChanges();

    const destroySpy = vi.spyOn(mockEngine, 'destroy');

    fixture.destroy();

    expect(destroySpy).toHaveBeenCalled();
  });

  // E8. Re-initialize on retry (not reset)
  it('should re-initialize engine with PlayMode.Story on shell retry (not reset)', async () => {
    const { providers, mockEngine } = setup();
    const { fixture, component } = await createComponent(RefresherChallengePage, {
      providers,
    });
    await flushMicrotasks();
    fixture.detectChanges();

    const initSpy = vi.spyOn(mockEngine, 'initialize');
    const setPlayModeSpy = vi.spyOn(mockEngine, 'setPlayMode');
    const startSpy = vi.spyOn(mockEngine, 'start');

    component.onShellRetry();

    expect(initSpy).toHaveBeenCalled();
    expect(setPlayModeSpy).toHaveBeenCalledWith(PlayMode.Story);
    expect(startSpy).toHaveBeenCalled();
  });
});
