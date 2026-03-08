import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import {
  LucideIconConfig,
  LucideIconProvider,
  LUCIDE_ICONS,
} from 'lucide-angular';
import { of, throwError } from 'rxjs';
import { APP_ICONS } from '../../shared/icons';
import { MinigamePlayPage } from './minigame-play';
import { MinigameShellComponent } from '../../core/minigame/minigame-shell/minigame-shell';
import { MinigameRegistryService } from '../../core/minigame/minigame-registry.service';
import { LevelProgressionService } from '../../core/levels/level-progression.service';
import { LevelLoaderService } from '../../core/levels/level-loader.service';
import { LevelNavigationService } from '../../core/levels/level-navigation.service';
import { LevelCompletionService, type LevelCompletionSummary } from '../../core/minigame/level-completion.service';
import { HintService, type HintResult } from '../../core/minigame/hint.service';
import { MinigameEngine, type ActionResult, type MinigameEngineConfig } from '../../core/minigame/minigame-engine';
import type { MinigameConfig } from '../../core/minigame/minigame.types';
import { DifficultyTier, MinigameStatus } from '../../core/minigame/minigame.types';
import type { LevelDefinition } from '../../core/levels/level.types';

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

// --- Test engine subclass ---

class TestEngine extends MinigameEngine<unknown> {
  constructor() { super({ initialLives: 3, timerDuration: null }); }
  protected onLevelLoad(): void { /* stub */ }
  protected onStart(): void { /* stub */ }
  protected onComplete(): void { /* stub */ }
  protected validateAction(): ActionResult {
    return { valid: true, scoreChange: 10, livesChange: 0 };
  }
}

class TestEngineForScoring extends MinigameEngine<unknown> {
  private nextScoreChange = 0;
  constructor(config: Partial<MinigameEngineConfig> = {}) {
    super({ initialLives: 3, timerDuration: null, ...config });
  }
  setNextScoreChange(n: number) { this.nextScoreChange = n; }
  protected onLevelLoad(): void { /* stub */ }
  protected onStart(): void { /* stub */ }
  protected onComplete(): void { /* stub */ }
  protected validateAction(): ActionResult {
    return { valid: true, scoreChange: this.nextScoreChange, livesChange: 0 };
  }
}

// --- Test component ---

@Component({
  selector: 'app-test-dummy',
  template: '<p class="dummy-game">dummy</p>',
})
class DummyGameComponent {}

// --- Test data ---

const TEST_LEVEL_DEF: LevelDefinition<unknown> = {
  levelId: 'ma-basic-01',
  gameId: 'module-assembly',
  tier: DifficultyTier.Basic,
  order: 1,
  title: 'Test Level',
  conceptIntroduced: 'Test concept',
  description: 'A test level',
  data: { difficulty: 1 },
};

const TEST_COMPLETION_SUMMARY: LevelCompletionSummary = {
  score: 50,
  starRating: 2,
  xpEarned: 30,
  bonuses: { perfect: false, streak: false },
  previousBestScore: 0,
  perfectBonus: 0,
  streakBonus: 0,
  isNewBestScore: true,
  rankUpOccurred: false,
  replayMultiplier: 1.0,
};

// --- Mock factories ---

function mockRegistry(overrides: Partial<MinigameRegistryService> = {}) {
  return {
    provide: MinigameRegistryService,
    useValue: {
      getComponent: vi.fn().mockReturnValue(undefined),
      getConfig: vi.fn().mockReturnValue(undefined),
      getEngineFactory: vi.fn().mockReturnValue(null),
      ...overrides,
    },
  };
}

function mockLevelProgression(overrides: Partial<LevelProgressionService> = {}) {
  return {
    provide: LevelProgressionService,
    useValue: {
      getLevelDefinition: vi.fn().mockReturnValue(null),
      isLevelUnlocked: vi.fn().mockReturnValue(true),
      ...overrides,
    },
  };
}

function mockLevelLoader(overrides: Partial<LevelLoaderService> = {}) {
  return {
    provide: LevelLoaderService,
    useValue: {
      loadLevel: vi.fn().mockReturnValue(of(TEST_LEVEL_DEF)),
      ...overrides,
    },
  };
}

function mockLevelCompletion(overrides: Partial<LevelCompletionService> = {}) {
  return {
    provide: LevelCompletionService,
    useValue: {
      completeLevel: vi.fn().mockReturnValue(TEST_COMPLETION_SUMMARY),
      ...overrides,
    },
  };
}

function mockHintService(overrides: Partial<HintService> = {}) {
  return {
    provide: HintService,
    useValue: {
      getRemainingHints: vi.fn().mockReturnValue(0),
      requestHint: vi.fn().mockReturnValue(null),
      getNextHintPenalty: vi.fn().mockReturnValue(0),
      ...overrides,
    },
  };
}

function mockLevelNavigationService(overrides: Partial<LevelNavigationService> = {}) {
  return {
    provide: LevelNavigationService,
    useValue: {
      getNextLevel: vi.fn().mockReturnValue(null),
      getPreviousLevel: vi.fn().mockReturnValue(null),
      isNextLevelUnlocked: vi.fn().mockReturnValue(false),
      ...overrides,
    },
  };
}

// --- Setup helper ---

async function setup(options: {
  params?: Record<string, string>;
  registry?: Partial<MinigameRegistryService>;
  levelProgression?: Partial<LevelProgressionService>;
  levelLoader?: Partial<LevelLoaderService>;
  levelCompletion?: Partial<LevelCompletionService>;
  hintService?: Partial<HintService>;
  levelNavigation?: Partial<LevelNavigationService>;
} = {}) {
  const {
    params = { gameId: 'module-assembly', levelId: 'ma-basic-01' },
    registry = {},
    levelProgression = {},
    levelLoader = {},
    levelCompletion = {},
    hintService = {},
    levelNavigation = {},
  } = options;

  await TestBed.configureTestingModule({
    imports: [MinigamePlayPage],
    providers: [
      provideRouter([]),
      ...ICON_PROVIDERS,
      mockRegistry(registry),
      mockLevelProgression(levelProgression),
      mockLevelLoader(levelLoader),
      mockLevelCompletion(levelCompletion),
      mockHintService(hintService),
      mockLevelNavigationService(levelNavigation),
    ],
  }).compileComponents();

  TestBed.overrideProvider(ActivatedRoute, {
    useValue: { paramMap: of(convertToParamMap(params)) },
  });

  const fixture = TestBed.createComponent(MinigamePlayPage);
  fixture.detectChanges();
  await fixture.whenStable();

  return {
    fixture,
    component: fixture.componentInstance,
    element: fixture.nativeElement as HTMLElement,
  };
}

describe('MinigamePlayPage', () => {
  // HTMLDialogElement polyfill — PauseMenuComponent uses ConfirmDialogComponent which calls showModal()
  beforeEach(() => {
    if (!HTMLDialogElement.prototype.showModal) {
      HTMLDialogElement.prototype.showModal = function () {
        this.setAttribute('open', '');
      };
    }
    if (!HTMLDialogElement.prototype.close) {
      HTMLDialogElement.prototype.close = function () {
        this.removeAttribute('open');
      };
    }
  });

  // --- 1. Basic instantiation ---
  it('should create the component', async () => {
    const { component } = await setup({
      registry: { getComponent: vi.fn().mockReturnValue(DummyGameComponent) },
    });
    expect(component).toBeTruthy();
  });

  // --- 2. Read gameId from route params ---
  it('should read gameId from route params', async () => {
    const { component } = await setup({
      params: { gameId: 'wire-protocol', levelId: '1' },
      registry: { getComponent: vi.fn().mockReturnValue(DummyGameComponent) },
    });
    expect(component.gameId()).toBe('wire-protocol');
  });

  // --- 3. Read levelId from route params ---
  it('should read levelId from route params', async () => {
    const { component } = await setup({
      params: { gameId: 'module-assembly', levelId: '3' },
      registry: { getComponent: vi.fn().mockReturnValue(DummyGameComponent) },
    });
    expect(component.levelId()).toBe('3');
  });

  // --- 4. Not-found state when gameId is not in registry ---
  it('should show "not-found" state when gameId is not in registry', async () => {
    const { element } = await setup({
      params: { gameId: 'nonexistent', levelId: '1' },
      registry: { getComponent: vi.fn().mockReturnValue(undefined) },
    });
    const errorDiv = element.querySelector('.play-state--error');
    expect(errorDiv).toBeTruthy();
    expect(errorDiv?.textContent).toContain('Game Not Found');
  });

  // --- 5. Not-ready state when component is null ---
  it('should show "not-ready" state when component is null', async () => {
    const { element } = await setup({
      registry: { getComponent: vi.fn().mockReturnValue(null) },
    });
    const comingSoon = element.querySelector('.play-state--coming-soon');
    expect(comingSoon).toBeTruthy();
    expect(comingSoon?.textContent).toContain('Coming Soon');
  });

  // --- 6. Locked state when level is locked ---
  it('should show "locked" state when level is locked', async () => {
    const levelDef: LevelDefinition = {
      levelId: 'ma-intermediate-01',
      gameId: 'module-assembly',
      tier: DifficultyTier.Intermediate,
      order: 1,
      title: 'Test Level',
      conceptIntroduced: 'Test',
      description: 'A test level',
      data: {},
    };
    const { element } = await setup({
      params: { gameId: 'module-assembly', levelId: 'ma-intermediate-01' },
      registry: { getComponent: vi.fn().mockReturnValue(DummyGameComponent) },
      levelProgression: {
        getLevelDefinition: vi.fn().mockReturnValue(levelDef),
        isLevelUnlocked: vi.fn().mockReturnValue(false),
      },
    });
    const lockedDiv = element.querySelector('.play-state--locked');
    expect(lockedDiv).toBeTruthy();
    expect(lockedDiv?.textContent).toContain('Level Locked');
  });

  // --- 7. Ready state renders component via NgComponentOutlet ---
  it('should show "ready" state and render component via NgComponentOutlet', async () => {
    const { element } = await setup({
      registry: { getComponent: vi.fn().mockReturnValue(DummyGameComponent) },
    });
    const dummyGame = element.querySelector('.dummy-game');
    expect(dummyGame).toBeTruthy();
    expect(dummyGame?.textContent).toContain('dummy');
  });

  // --- 8. Skip lock check when no level definition is registered ---
  it('should skip lock check when no level definition is registered', async () => {
    const { component } = await setup({
      params: { gameId: 'module-assembly', levelId: 'unknown-level' },
      registry: { getComponent: vi.fn().mockReturnValue(DummyGameComponent) },
      levelProgression: {
        getLevelDefinition: vi.fn().mockReturnValue(null),
        isLevelUnlocked: vi.fn().mockReturnValue(false),
      },
    });
    expect(component.viewState()).toBe('ready');
  });

  // --- 9. Content projection inside MinigameShellComponent ---
  it('should render game content inside MinigameShellComponent content projection', async () => {
    const { element } = await setup({
      registry: { getComponent: vi.fn().mockReturnValue(DummyGameComponent) },
    });
    const shell = element.querySelector('app-minigame-shell');
    expect(shell).toBeTruthy();
    const projectedContent = element.querySelector('.shell-content .dummy-game');
    expect(projectedContent).toBeTruthy();
  });

  // --- 10. Display game name in not-ready state ---
  it('should display game name in not-ready state', async () => {
    const config: MinigameConfig = {
      id: 'module-assembly',
      name: 'Module Assembly',
      description: 'Conveyor belt drag-and-drop assembly',
      angularTopic: 'Components',
      totalLevels: 18,
      difficultyTiers: [DifficultyTier.Basic, DifficultyTier.Intermediate, DifficultyTier.Advanced, DifficultyTier.Boss],
    };
    const { element } = await setup({
      registry: {
        getComponent: vi.fn().mockReturnValue(null),
        getConfig: vi.fn().mockReturnValue(config),
      },
    });
    const comingSoon = element.querySelector('.play-state--coming-soon');
    expect(comingSoon?.textContent).toContain('Module Assembly');
  });

  // --- 11. Engine lifecycle: loads level on init ---
  it('should load level and create engine when viewState is ready with factory', async () => {
    const testEngine = new TestEngine();
    const factory = vi.fn().mockReturnValue(testEngine);
    const { component, fixture } = await setup({
      registry: {
        getComponent: vi.fn().mockReturnValue(DummyGameComponent),
        getEngineFactory: vi.fn().mockReturnValue(factory),
      },
    });

    fixture.detectChanges();
    await fixture.whenStable();

    expect(factory).toHaveBeenCalled();
    expect(component.engine()).toBe(testEngine);
    expect(testEngine.status()).toBe(MinigameStatus.Playing);
    testEngine.destroy();
  });

  // --- 12. Engine stays null when no factory registered ---
  it('should leave engine null when no engine factory is registered', async () => {
    const { component } = await setup({
      registry: {
        getComponent: vi.fn().mockReturnValue(DummyGameComponent),
        getEngineFactory: vi.fn().mockReturnValue(null),
      },
    });
    expect(component.engine()).toBeNull();
  });

  // --- 13. Level load error sets error viewState ---
  it('should handle level load error gracefully and set error viewState', async () => {
    const factory = vi.fn().mockReturnValue(new TestEngine());
    const { component, fixture } = await setup({
      registry: {
        getComponent: vi.fn().mockReturnValue(DummyGameComponent),
        getEngineFactory: vi.fn().mockReturnValue(factory),
      },
      levelLoader: {
        loadLevel: vi.fn().mockReturnValue(throwError(() => new Error('Not found'))),
      },
    });

    fixture.detectChanges();
    await fixture.whenStable();

    // Engine should stay null since load failed
    expect(component.engine()).toBeNull();
    // viewState should be 'error'
    expect(component.viewState()).toBe('error');
  });

  // --- 14. Engine score binding ---
  it('should bind engine score to shell', async () => {
    const testEngine = new TestEngine();
    const factory = vi.fn().mockReturnValue(testEngine);
    const { fixture, element } = await setup({
      registry: {
        getComponent: vi.fn().mockReturnValue(DummyGameComponent),
        getEngineFactory: vi.fn().mockReturnValue(factory),
      },
    });

    fixture.detectChanges();
    await fixture.whenStable();

    // Submit an action to earn score
    testEngine.submitAction('test');
    fixture.detectChanges();

    const scoreEl = element.querySelector('.shell-hud__score');
    expect(scoreEl?.textContent?.trim()).toBe('10');
    testEngine.destroy();
  });

  // --- 15. Engine status binding ---
  it('should bind engine status to shell', async () => {
    const testEngine = new TestEngine();
    const factory = vi.fn().mockReturnValue(testEngine);
    const { component, fixture } = await setup({
      registry: {
        getComponent: vi.fn().mockReturnValue(DummyGameComponent),
        getEngineFactory: vi.fn().mockReturnValue(factory),
      },
    });

    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.engine()?.status()).toBe(MinigameStatus.Playing);
    testEngine.destroy();
  });

  // --- 16. Pause event ---
  it('should call engine.pause() on pauseGame event', async () => {
    const testEngine = new TestEngine();
    const factory = vi.fn().mockReturnValue(testEngine);
    const { fixture, element } = await setup({
      registry: {
        getComponent: vi.fn().mockReturnValue(DummyGameComponent),
        getEngineFactory: vi.fn().mockReturnValue(factory),
      },
    });

    fixture.detectChanges();
    await fixture.whenStable();

    const pauseBtn = element.querySelector('.shell-hud__pause') as HTMLButtonElement;
    pauseBtn.click();
    fixture.detectChanges();

    expect(testEngine.status()).toBe(MinigameStatus.Paused);
    testEngine.destroy();
  });

  // --- 17. Resume event ---
  it('should call engine.resume() on resumeGame event', async () => {
    const testEngine = new TestEngine();
    const factory = vi.fn().mockReturnValue(testEngine);
    const { fixture } = await setup({
      registry: {
        getComponent: vi.fn().mockReturnValue(DummyGameComponent),
        getEngineFactory: vi.fn().mockReturnValue(factory),
      },
    });

    fixture.detectChanges();
    await fixture.whenStable();

    // Pause first
    testEngine.pause();
    fixture.detectChanges();

    // Trigger resumeGame output from the shell
    fixture.debugElement
      .query(By.directive(MinigameShellComponent))
      .triggerEventHandler('resumeGame');
    fixture.detectChanges();

    expect(testEngine.status()).toBe(MinigameStatus.Playing);
    testEngine.destroy();
  });

  // --- 18. Quit event navigates ---
  it('should navigate to level select on quit event', async () => {
    const testEngine = new TestEngine();
    const factory = vi.fn().mockReturnValue(testEngine);
    const { fixture, component } = await setup({
      registry: {
        getComponent: vi.fn().mockReturnValue(DummyGameComponent),
        getEngineFactory: vi.fn().mockReturnValue(factory),
      },
    });

    fixture.detectChanges();
    await fixture.whenStable();

    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    component.onQuit();

    expect(navigateSpy).toHaveBeenCalledWith(['/minigames', 'module-assembly']);
    testEngine.destroy();
  });

  // --- 19. Retry event re-initializes engine ---
  it('should re-initialize and start engine on retry event', async () => {
    const testEngine = new TestEngine();
    const factory = vi.fn().mockReturnValue(testEngine);
    const { fixture, component } = await setup({
      registry: {
        getComponent: vi.fn().mockReturnValue(DummyGameComponent),
        getEngineFactory: vi.fn().mockReturnValue(factory),
      },
    });

    fixture.detectChanges();
    await fixture.whenStable();

    // Earn some score, then fail
    testEngine.submitAction('test');
    expect(testEngine.score()).toBe(10);
    testEngine.fail();
    expect(testEngine.status()).toBe(MinigameStatus.Lost);

    // Retry
    component.onRetry();

    expect(testEngine.status()).toBe(MinigameStatus.Playing);
    expect(testEngine.score()).toBe(0);
    testEngine.destroy();
  });

  // --- 19b. restartGame event triggers engine re-initialization ---
  it('should re-initialize engine on restartGame event from shell', async () => {
    const testEngine = new TestEngine();
    const factory = vi.fn().mockReturnValue(testEngine);
    const { fixture } = await setup({
      registry: {
        getComponent: vi.fn().mockReturnValue(DummyGameComponent),
        getEngineFactory: vi.fn().mockReturnValue(factory),
      },
    });

    fixture.detectChanges();
    await fixture.whenStable();

    // Earn some score, then pause
    testEngine.submitAction('test');
    expect(testEngine.score()).toBe(10);
    testEngine.pause();
    fixture.detectChanges();

    // Trigger restartGame from shell
    fixture.debugElement
      .query(By.directive(MinigameShellComponent))
      .triggerEventHandler('restartGame');
    fixture.detectChanges();

    expect(testEngine.status()).toBe(MinigameStatus.Playing);
    expect(testEngine.score()).toBe(0);
    testEngine.destroy();
  });

  // --- 20. Replay event re-initializes engine ---
  it('should re-initialize and start engine on replay event', async () => {
    const testEngine = new TestEngine();
    const factory = vi.fn().mockReturnValue(testEngine);
    const completeLevelSpy = vi.fn().mockReturnValue(TEST_COMPLETION_SUMMARY);
    const { fixture, component } = await setup({
      registry: {
        getComponent: vi.fn().mockReturnValue(DummyGameComponent),
        getEngineFactory: vi.fn().mockReturnValue(factory),
      },
      levelCompletion: { completeLevel: completeLevelSpy },
    });

    fixture.detectChanges();
    await fixture.whenStable();

    // Complete the game
    testEngine.complete();
    fixture.detectChanges();

    // Replay
    component.onReplay();

    expect(testEngine.status()).toBe(MinigameStatus.Playing);
    expect(testEngine.score()).toBe(0);
    testEngine.destroy();
  });

  // --- 21. Completion calls LevelCompletionService ---
  it('should call LevelCompletionService.completeLevel() on win', async () => {
    const testEngine = new TestEngine();
    const factory = vi.fn().mockReturnValue(testEngine);
    const completeLevelSpy = vi.fn().mockReturnValue(TEST_COMPLETION_SUMMARY);
    const { fixture } = await setup({
      registry: {
        getComponent: vi.fn().mockReturnValue(DummyGameComponent),
        getEngineFactory: vi.fn().mockReturnValue(factory),
      },
      levelCompletion: { completeLevel: completeLevelSpy },
    });

    fixture.detectChanges();
    await fixture.whenStable();

    testEngine.complete();
    fixture.detectChanges();

    expect(completeLevelSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        gameId: 'module-assembly',
        levelId: 'ma-basic-01',
        score: 0,
        perfect: true,
        xpEarned: 0,
        starRating: 1,
      }),
    );
    testEngine.destroy();
  });

  // --- 22. Completion summary stored ---
  it('should store completion summary and bind to shell', async () => {
    const testEngine = new TestEngine();
    const factory = vi.fn().mockReturnValue(testEngine);
    const completeLevelSpy = vi.fn().mockReturnValue(TEST_COMPLETION_SUMMARY);
    const { fixture, component } = await setup({
      registry: {
        getComponent: vi.fn().mockReturnValue(DummyGameComponent),
        getEngineFactory: vi.fn().mockReturnValue(factory),
      },
      levelCompletion: { completeLevel: completeLevelSpy },
    });

    fixture.detectChanges();
    await fixture.whenStable();

    testEngine.complete();
    fixture.detectChanges();

    expect(component.completionSummary()).toEqual(TEST_COMPLETION_SUMMARY);
    testEngine.destroy();
  });

  // --- 23. Engine destroyed on component destroy ---
  it('should destroy engine when component is destroyed', async () => {
    const testEngine = new TestEngine();
    const destroySpy = vi.spyOn(testEngine, 'destroy');
    const factory = vi.fn().mockReturnValue(testEngine);
    const { fixture } = await setup({
      registry: {
        getComponent: vi.fn().mockReturnValue(DummyGameComponent),
        getEngineFactory: vi.fn().mockReturnValue(factory),
      },
    });

    fixture.detectChanges();
    await fixture.whenStable();

    fixture.destroy();

    expect(destroySpy).toHaveBeenCalled();
  });

  // --- 24. NextLevel navigates to next level when available ---
  it('should navigate to next level when next level exists', async () => {
    const testEngine = new TestEngine();
    const factory = vi.fn().mockReturnValue(testEngine);
    const nextLevelDef: LevelDefinition = {
      levelId: 'ma-basic-02',
      gameId: 'module-assembly',
      tier: DifficultyTier.Basic,
      order: 2,
      title: 'Next Level',
      conceptIntroduced: 'Test',
      description: 'Next',
      data: {},
    };
    const { fixture, component } = await setup({
      registry: {
        getComponent: vi.fn().mockReturnValue(DummyGameComponent),
        getEngineFactory: vi.fn().mockReturnValue(factory),
      },
      levelNavigation: {
        getNextLevel: vi.fn().mockReturnValue(nextLevelDef),
        isNextLevelUnlocked: vi.fn().mockReturnValue(true),
      },
    });

    fixture.detectChanges();
    await fixture.whenStable();

    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    component.onNextLevel();

    expect(navigateSpy).toHaveBeenCalledWith(['/minigames', 'module-assembly', 'level', 'ma-basic-02']);
    testEngine.destroy();
  });

  // --- 24b. NextLevel falls back to level select when no next level ---
  it('should navigate to level select when no next level exists', async () => {
    const testEngine = new TestEngine();
    const factory = vi.fn().mockReturnValue(testEngine);
    const { fixture, component } = await setup({
      registry: {
        getComponent: vi.fn().mockReturnValue(DummyGameComponent),
        getEngineFactory: vi.fn().mockReturnValue(factory),
      },
      levelNavigation: {
        getNextLevel: vi.fn().mockReturnValue(null),
      },
    });

    fixture.detectChanges();
    await fixture.whenStable();

    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    component.onNextLevel();

    expect(navigateSpy).toHaveBeenCalledWith(['/minigames', 'module-assembly']);
    testEngine.destroy();
  });

  // --- 25. Completion error handled gracefully ---
  it('should handle completeLevel error gracefully', async () => {
    const testEngine = new TestEngine();
    const factory = vi.fn().mockReturnValue(testEngine);
    const completeLevelSpy = vi.fn().mockImplementation(() => {
      throw new Error('Level definition not found');
    });
    const { fixture, component } = await setup({
      registry: {
        getComponent: vi.fn().mockReturnValue(DummyGameComponent),
        getEngineFactory: vi.fn().mockReturnValue(factory),
      },
      levelCompletion: { completeLevel: completeLevelSpy },
    });

    fixture.detectChanges();
    await fixture.whenStable();

    // Should not throw
    testEngine.complete();
    fixture.detectChanges();

    expect(completeLevelSpy).toHaveBeenCalled();
    expect(component.completionSummary()).toBeNull();
    testEngine.destroy();
  });

  // --- 26. onUseHint calls requestHint then retries ---
  it('should call hintService.requestHint and retry on useHint event', async () => {
    const testEngine = new TestEngine();
    const factory = vi.fn().mockReturnValue(testEngine);
    const requestHintSpy = vi.fn().mockReturnValue({ hint: { id: 'h1', text: 'Try X' }, penalty: 25, remainingHints: 1 });
    const { fixture, component } = await setup({
      registry: {
        getComponent: vi.fn().mockReturnValue(DummyGameComponent),
        getEngineFactory: vi.fn().mockReturnValue(factory),
      },
      hintService: {
        getRemainingHints: vi.fn().mockReturnValue(2),
        requestHint: requestHintSpy,
      },
    });

    fixture.detectChanges();
    await fixture.whenStable();

    // Engine is auto-initialized by setup; put it in Lost state
    testEngine.submitAction('test');
    expect(testEngine.score()).toBe(10);
    testEngine.fail();
    expect(testEngine.status()).toBe(MinigameStatus.Lost);

    // Use hint
    component.onUseHint();

    expect(requestHintSpy).toHaveBeenCalledWith('ma-basic-01');
    expect(testEngine.status()).toBe(MinigameStatus.Playing);
    expect(testEngine.score()).toBe(0);
    testEngine.destroy();
  });

  // --- 27. onUseHint retries even when requestHint returns null ---
  it('should still retry even when requestHint returns null', async () => {
    const testEngine = new TestEngine();
    const factory = vi.fn().mockReturnValue(testEngine);
    const requestHintSpy = vi.fn().mockReturnValue(null);
    const { fixture, component } = await setup({
      registry: {
        getComponent: vi.fn().mockReturnValue(DummyGameComponent),
        getEngineFactory: vi.fn().mockReturnValue(factory),
      },
      hintService: {
        getRemainingHints: vi.fn().mockReturnValue(0),
        requestHint: requestHintSpy,
      },
    });

    fixture.detectChanges();
    await fixture.whenStable();

    // Put engine in Lost state
    testEngine.fail();
    expect(testEngine.status()).toBe(MinigameStatus.Lost);

    // Use hint (returns null)
    component.onUseHint();

    expect(requestHintSpy).toHaveBeenCalledWith('ma-basic-01');
    expect(testEngine.status()).toBe(MinigameStatus.Playing);
    testEngine.destroy();
  });

  // --- 28. hintsAvailable computed correctly (true) ---
  it('should compute hintsAvailable as true when hints remain', async () => {
    const testEngine = new TestEngine();
    const factory = vi.fn().mockReturnValue(testEngine);
    const { fixture, component } = await setup({
      registry: {
        getComponent: vi.fn().mockReturnValue(DummyGameComponent),
        getEngineFactory: vi.fn().mockReturnValue(factory),
      },
      hintService: {
        getRemainingHints: vi.fn().mockReturnValue(2),
        requestHint: vi.fn().mockReturnValue(null),
      },
    });

    fixture.detectChanges();
    await fixture.whenStable();

    // Engine is auto-initialized by the effect chain, so currentLevel() is non-null
    expect(component.hintsAvailable()).toBe(true);
    testEngine.destroy();
  });

  // --- 29. hintsAvailable computed correctly (false) ---
  it('should compute hintsAvailable as false when no hints remain', async () => {
    const testEngine = new TestEngine();
    const factory = vi.fn().mockReturnValue(testEngine);
    const { fixture, component } = await setup({
      registry: {
        getComponent: vi.fn().mockReturnValue(DummyGameComponent),
        getEngineFactory: vi.fn().mockReturnValue(factory),
      },
      hintService: {
        getRemainingHints: vi.fn().mockReturnValue(0),
        requestHint: vi.fn().mockReturnValue(null),
      },
    });

    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.hintsAvailable()).toBe(false);
    testEngine.destroy();
  });

  // --- 30. hintCount computed from HintService ---
  it('should compute hintCount from HintService.getRemainingHints', async () => {
    const testEngine = new TestEngine();
    const factory = vi.fn().mockReturnValue(testEngine);
    const { fixture, component } = await setup({
      registry: {
        getComponent: vi.fn().mockReturnValue(DummyGameComponent),
        getEngineFactory: vi.fn().mockReturnValue(factory),
      },
      hintService: {
        getRemainingHints: vi.fn().mockReturnValue(3),
        requestHint: vi.fn().mockReturnValue(null),
        getNextHintPenalty: vi.fn().mockReturnValue(0),
      },
    });

    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.hintCount()).toBe(3);
    testEngine.destroy();
  });

  // --- 31. hintPenalty computed from HintService ---
  it('should compute hintPenalty from HintService.getNextHintPenalty', async () => {
    const testEngine = new TestEngine();
    const factory = vi.fn().mockReturnValue(testEngine);
    const { fixture, component } = await setup({
      registry: {
        getComponent: vi.fn().mockReturnValue(DummyGameComponent),
        getEngineFactory: vi.fn().mockReturnValue(factory),
      },
      hintService: {
        getRemainingHints: vi.fn().mockReturnValue(2),
        requestHint: vi.fn().mockReturnValue(null),
        getNextHintPenalty: vi.fn().mockReturnValue(250),
      },
    });

    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.hintPenalty()).toBe(250);
    testEngine.destroy();
  });

  // --- 32. onRequestHint calls requestHint and sets activeHintText ---
  it('should call requestHint and set activeHintText on onRequestHint', async () => {
    const testEngine = new TestEngine();
    const factory = vi.fn().mockReturnValue(testEngine);
    const hintResult: HintResult = {
      hint: { id: 'h1', text: 'Try using @Input' },
      penalty: 250,
      remainingHints: 1,
    };
    const requestHintSpy = vi.fn().mockReturnValue(hintResult);
    const { fixture, component } = await setup({
      registry: {
        getComponent: vi.fn().mockReturnValue(DummyGameComponent),
        getEngineFactory: vi.fn().mockReturnValue(factory),
      },
      hintService: {
        getRemainingHints: vi.fn().mockReturnValue(2),
        requestHint: requestHintSpy,
        getNextHintPenalty: vi.fn().mockReturnValue(250),
      },
    });

    fixture.detectChanges();
    await fixture.whenStable();

    component.onRequestHint();

    expect(requestHintSpy).toHaveBeenCalledWith('ma-basic-01');
    expect(component.activeHintText()).toBe('Try using @Input');
    testEngine.destroy();
  });

  // --- 33. onRequestHint does nothing when not Playing ---
  it('should not call requestHint when engine is not in Playing state', async () => {
    const testEngine = new TestEngine();
    const factory = vi.fn().mockReturnValue(testEngine);
    const requestHintSpy = vi.fn().mockReturnValue(null);
    const { fixture, component } = await setup({
      registry: {
        getComponent: vi.fn().mockReturnValue(DummyGameComponent),
        getEngineFactory: vi.fn().mockReturnValue(factory),
      },
      hintService: {
        getRemainingHints: vi.fn().mockReturnValue(2),
        requestHint: requestHintSpy,
        getNextHintPenalty: vi.fn().mockReturnValue(0),
      },
    });

    fixture.detectChanges();
    await fixture.whenStable();

    // Pause the engine
    testEngine.pause();
    expect(testEngine.status()).toBe(MinigameStatus.Paused);

    component.onRequestHint();

    expect(requestHintSpy).not.toHaveBeenCalled();
    testEngine.destroy();
  });

  // --- 34. activeHintText auto-clears after 5 seconds ---
  describe('auto-dismiss hint text', () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it('should auto-clear activeHintText after 5 seconds', async () => {
      vi.useFakeTimers();
      const testEngine = new TestEngine();
      const factory = vi.fn().mockReturnValue(testEngine);
      const hintResult: HintResult = {
        hint: { id: 'h1', text: 'Auto-dismiss hint' },
        penalty: 100,
        remainingHints: 0,
      };
      const { fixture, component } = await setup({
        registry: {
          getComponent: vi.fn().mockReturnValue(DummyGameComponent),
          getEngineFactory: vi.fn().mockReturnValue(factory),
        },
        hintService: {
          getRemainingHints: vi.fn().mockReturnValue(1),
          requestHint: vi.fn().mockReturnValue(hintResult),
          getNextHintPenalty: vi.fn().mockReturnValue(100),
        },
      });

      fixture.detectChanges();
      await fixture.whenStable();

      component.onRequestHint();
      expect(component.activeHintText()).toBe('Auto-dismiss hint');

      vi.advanceTimersByTime(5000);
      expect(component.activeHintText()).toBe('');

      // Restore real timers and destroy fixture before engine to prevent
      // LevelFailedComponent rendering without icon providers during teardown
      vi.useRealTimers();
      fixture.destroy();
    });
  });

  // --- 35. 'H' keyboard shortcut triggers hint request ---
  it("should trigger hint request when 'H' key is pressed", async () => {
    const testEngine = new TestEngine();
    const factory = vi.fn().mockReturnValue(testEngine);
    const hintResult: HintResult = {
      hint: { id: 'h1', text: 'Keyboard hint' },
      penalty: 50,
      remainingHints: 1,
    };
    const requestHintSpy = vi.fn().mockReturnValue(hintResult);
    const { fixture, component } = await setup({
      registry: {
        getComponent: vi.fn().mockReturnValue(DummyGameComponent),
        getEngineFactory: vi.fn().mockReturnValue(factory),
      },
      hintService: {
        getRemainingHints: vi.fn().mockReturnValue(2),
        requestHint: requestHintSpy,
        getNextHintPenalty: vi.fn().mockReturnValue(50),
      },
    });

    fixture.detectChanges();
    await fixture.whenStable();

    // Dispatch 'h' keydown on document (real KeyboardShortcutService)
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'h' }));

    expect(requestHintSpy).toHaveBeenCalledWith('ma-basic-01');
    expect(component.activeHintText()).toBe('Keyboard hint');
    testEngine.destroy();
  });

  // --- 36. displayBonuses builds array from completion summary ---
  it('should build bonuses array with perfect and streak entries', async () => {
    const testEngine = new TestEngine();
    const factory = vi.fn().mockReturnValue(testEngine);
    const summaryWithBonuses: LevelCompletionSummary = {
      ...TEST_COMPLETION_SUMMARY,
      bonuses: { perfect: true, streak: true },
      perfectBonus: 15,
      streakBonus: 5,
    };
    const { fixture, component } = await setup({
      registry: {
        getComponent: vi.fn().mockReturnValue(DummyGameComponent),
        getEngineFactory: vi.fn().mockReturnValue(factory),
      },
      levelCompletion: { completeLevel: vi.fn().mockReturnValue(summaryWithBonuses) },
    });

    fixture.detectChanges();
    await fixture.whenStable();

    testEngine.complete();
    fixture.detectChanges();

    const bonuses = component.displayBonuses();
    expect(bonuses).toEqual([
      { label: 'Perfect!', amount: 15 },
      { label: 'Streak Bonus', amount: 5 },
    ]);
    testEngine.destroy();
  });

  // --- 37. displayBonuses omits entries with 0 amounts ---
  it('should omit perfect entry from bonuses when perfectBonus is 0', async () => {
    const testEngine = new TestEngine();
    const factory = vi.fn().mockReturnValue(testEngine);
    const { fixture, component } = await setup({
      registry: {
        getComponent: vi.fn().mockReturnValue(DummyGameComponent),
        getEngineFactory: vi.fn().mockReturnValue(factory),
      },
      levelCompletion: { completeLevel: vi.fn().mockReturnValue(TEST_COMPLETION_SUMMARY) },
    });

    fixture.detectChanges();
    await fixture.whenStable();

    testEngine.complete();
    fixture.detectChanges();

    const bonuses = component.displayBonuses();
    expect(bonuses).toEqual([]);
    testEngine.destroy();
  });

  // --- 38. nextLevelLocked computed correctly ---
  it('should compute nextLevelLocked as true when next level is locked', async () => {
    const testEngine = new TestEngine();
    const factory = vi.fn().mockReturnValue(testEngine);
    const { fixture, component } = await setup({
      registry: {
        getComponent: vi.fn().mockReturnValue(DummyGameComponent),
        getEngineFactory: vi.fn().mockReturnValue(factory),
      },
      levelNavigation: {
        isNextLevelUnlocked: vi.fn().mockReturnValue(false),
      },
    });

    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.nextLevelLocked()).toBe(true);
    testEngine.destroy();
  });

  // --- 39. nextLevelLocked false when next level is unlocked ---
  it('should compute nextLevelLocked as false when next level is unlocked', async () => {
    const testEngine = new TestEngine();
    const factory = vi.fn().mockReturnValue(testEngine);
    const { fixture, component } = await setup({
      registry: {
        getComponent: vi.fn().mockReturnValue(DummyGameComponent),
        getEngineFactory: vi.fn().mockReturnValue(factory),
      },
      levelNavigation: {
        isNextLevelUnlocked: vi.fn().mockReturnValue(true),
      },
    });

    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.nextLevelLocked()).toBe(false);
    testEngine.destroy();
  });

  // --- 40. previousBest derived from completion summary ---
  it('should derive previousBest from completionSummary.previousBestScore', async () => {
    const testEngine = new TestEngine();
    const factory = vi.fn().mockReturnValue(testEngine);
    const summaryWithPrior: LevelCompletionSummary = {
      ...TEST_COMPLETION_SUMMARY,
      previousBestScore: 42,
    };
    const { fixture, component } = await setup({
      registry: {
        getComponent: vi.fn().mockReturnValue(DummyGameComponent),
        getEngineFactory: vi.fn().mockReturnValue(factory),
      },
      levelCompletion: { completeLevel: vi.fn().mockReturnValue(summaryWithPrior) },
    });

    fixture.detectChanges();
    await fixture.whenStable();

    // Before completion, previousBest is null
    expect(component.previousBest()).toBeNull();

    testEngine.complete();
    fixture.detectChanges();

    expect(component.previousBest()).toBe(42);
    testEngine.destroy();
  });

  // --- 41. resultForDisplay built from engine on completion ---
  it('should build resultForDisplay from engine data on completion', async () => {
    const testEngine = new TestEngine();
    const factory = vi.fn().mockReturnValue(testEngine);
    const { fixture, component } = await setup({
      registry: {
        getComponent: vi.fn().mockReturnValue(DummyGameComponent),
        getEngineFactory: vi.fn().mockReturnValue(factory),
      },
      levelCompletion: { completeLevel: vi.fn().mockReturnValue(TEST_COMPLETION_SUMMARY) },
    });

    fixture.detectChanges();
    await fixture.whenStable();

    // Before completion, result is null
    expect(component.resultForDisplay()).toBeNull();

    testEngine.complete();
    fixture.detectChanges();

    const result = component.resultForDisplay();
    expect(result).not.toBeNull();
    expect(result!.gameId).toBe('module-assembly');
    expect(result!.levelId).toBe('ma-basic-01');
    testEngine.destroy();
  });

  // --- 42. Star rating = 1 for score below 60% of maxScore ---
  it('should compute 1-star rating for score below 60% of maxScore', async () => {
    const scoringEngine = new TestEngineForScoring();
    scoringEngine.setNextScoreChange(500); // 500/1000 = 50%
    const factory = vi.fn().mockReturnValue(scoringEngine);
    const completeLevelSpy = vi.fn().mockReturnValue(TEST_COMPLETION_SUMMARY);
    const { fixture } = await setup({
      registry: {
        getComponent: vi.fn().mockReturnValue(DummyGameComponent),
        getEngineFactory: vi.fn().mockReturnValue(factory),
      },
      levelCompletion: { completeLevel: completeLevelSpy },
    });

    fixture.detectChanges();
    await fixture.whenStable();

    scoringEngine.submitAction('score');
    scoringEngine.complete();
    fixture.detectChanges();

    expect(completeLevelSpy).toHaveBeenCalledWith(
      expect.objectContaining({ score: 500, starRating: 1 }),
    );
    scoringEngine.destroy();
  });

  // --- 43. Star rating = 2 for score at 80% of maxScore ---
  it('should compute 2-star rating for score at 80% of maxScore', async () => {
    const scoringEngine = new TestEngineForScoring();
    scoringEngine.setNextScoreChange(800); // 800/1000 = 80%
    const factory = vi.fn().mockReturnValue(scoringEngine);
    const completeLevelSpy = vi.fn().mockReturnValue(TEST_COMPLETION_SUMMARY);
    const { fixture } = await setup({
      registry: {
        getComponent: vi.fn().mockReturnValue(DummyGameComponent),
        getEngineFactory: vi.fn().mockReturnValue(factory),
      },
      levelCompletion: { completeLevel: completeLevelSpy },
    });

    fixture.detectChanges();
    await fixture.whenStable();

    scoringEngine.submitAction('score');
    scoringEngine.complete();
    fixture.detectChanges();

    expect(completeLevelSpy).toHaveBeenCalledWith(
      expect.objectContaining({ score: 800, starRating: 2 }),
    );
    scoringEngine.destroy();
  });

  // --- 44. Star rating = 3 for score at 95% of maxScore ---
  it('should compute 3-star rating for score at 95% of maxScore', async () => {
    const scoringEngine = new TestEngineForScoring();
    scoringEngine.setNextScoreChange(950); // 950/1000 = 95%
    const factory = vi.fn().mockReturnValue(scoringEngine);
    const completeLevelSpy = vi.fn().mockReturnValue(TEST_COMPLETION_SUMMARY);
    const { fixture } = await setup({
      registry: {
        getComponent: vi.fn().mockReturnValue(DummyGameComponent),
        getEngineFactory: vi.fn().mockReturnValue(factory),
      },
      levelCompletion: { completeLevel: completeLevelSpy },
    });

    fixture.detectChanges();
    await fixture.whenStable();

    scoringEngine.submitAction('score');
    scoringEngine.complete();
    fixture.detectChanges();

    expect(completeLevelSpy).toHaveBeenCalledWith(
      expect.objectContaining({ score: 950, starRating: 3 }),
    );
    scoringEngine.destroy();
  });

  // --- 45. Star rating = 1 for score of 0 ---
  it('should compute 1-star rating for score of 0', async () => {
    const scoringEngine = new TestEngineForScoring();
    const factory = vi.fn().mockReturnValue(scoringEngine);
    const completeLevelSpy = vi.fn().mockReturnValue(TEST_COMPLETION_SUMMARY);
    const { fixture } = await setup({
      registry: {
        getComponent: vi.fn().mockReturnValue(DummyGameComponent),
        getEngineFactory: vi.fn().mockReturnValue(factory),
      },
      levelCompletion: { completeLevel: completeLevelSpy },
    });

    fixture.detectChanges();
    await fixture.whenStable();

    // Complete immediately without scoring
    scoringEngine.complete();
    fixture.detectChanges();

    expect(completeLevelSpy).toHaveBeenCalledWith(
      expect.objectContaining({ score: 0, starRating: 1 }),
    );
    scoringEngine.destroy();
  });

  // --- 46. Star rating uses engine maxScore config ---
  it('should use engine maxScore config for star rating computation', async () => {
    const scoringEngine = new TestEngineForScoring({ maxScore: 500 });
    scoringEngine.setNextScoreChange(475); // 475/500 = 95%
    const factory = vi.fn().mockReturnValue(scoringEngine);
    const completeLevelSpy = vi.fn().mockReturnValue(TEST_COMPLETION_SUMMARY);
    const { fixture } = await setup({
      registry: {
        getComponent: vi.fn().mockReturnValue(DummyGameComponent),
        getEngineFactory: vi.fn().mockReturnValue(factory),
      },
      levelCompletion: { completeLevel: completeLevelSpy },
    });

    fixture.detectChanges();
    await fixture.whenStable();

    scoringEngine.submitAction('score');
    scoringEngine.complete();
    fixture.detectChanges();

    expect(completeLevelSpy).toHaveBeenCalledWith(
      expect.objectContaining({ score: 475, starRating: 3 }),
    );
    scoringEngine.destroy();
  });

  // --- 47. Error state renders ErrorStateComponent on load failure ---
  it('should render ErrorStateComponent on level load failure', async () => {
    const factory = vi.fn().mockReturnValue(new TestEngine());
    const { component, element, fixture } = await setup({
      registry: {
        getComponent: vi.fn().mockReturnValue(DummyGameComponent),
        getEngineFactory: vi.fn().mockReturnValue(factory),
      },
      levelLoader: {
        loadLevel: vi.fn().mockReturnValue(throwError(() => new Error('Not found'))),
      },
    });

    fixture.detectChanges();
    await fixture.whenStable();

    // ErrorStateComponent should render
    expect(element.querySelector('nx-error-state')).toBeTruthy();
    // viewState should be 'error'
    expect(component.viewState()).toBe('error');
    // Error message should contain both game ID and level ID
    expect(component.loadError()).toContain('ma-basic-01');
    expect(component.loadError()).toContain('module-assembly');
  });

  // --- 48. Error state shows game name from config when available ---
  it('should show game name from config in error message when available', async () => {
    const config: MinigameConfig = {
      id: 'module-assembly',
      name: 'Module Assembly',
      description: 'Conveyor belt drag-and-drop assembly',
      angularTopic: 'Components',
      totalLevels: 18,
      difficultyTiers: [DifficultyTier.Basic, DifficultyTier.Intermediate, DifficultyTier.Advanced, DifficultyTier.Boss],
    };
    const factory = vi.fn().mockReturnValue(new TestEngine());
    const { component, fixture } = await setup({
      registry: {
        getComponent: vi.fn().mockReturnValue(DummyGameComponent),
        getConfig: vi.fn().mockReturnValue(config),
        getEngineFactory: vi.fn().mockReturnValue(factory),
      },
      levelLoader: {
        loadLevel: vi.fn().mockReturnValue(throwError(() => new Error('Not found'))),
      },
    });

    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.loadError()).toContain('Module Assembly');
  });

  // --- 49. Retry clears error and re-triggers level loading ---
  it('should clear error and re-trigger level loading on retry', async () => {
    const factory = vi.fn().mockReturnValue(new TestEngine());
    const { component, fixture } = await setup({
      registry: {
        getComponent: vi.fn().mockReturnValue(DummyGameComponent),
        getEngineFactory: vi.fn().mockReturnValue(factory),
      },
      levelLoader: {
        loadLevel: vi.fn().mockReturnValue(throwError(() => new Error('Not found'))),
      },
    });

    fixture.detectChanges();
    await fixture.whenStable();

    // Verify error state first
    expect(component.viewState()).toBe('error');
    expect(component.loadError()).not.toBeNull();

    // Change mock to return success on retry
    (TestBed.inject(LevelLoaderService).loadLevel as ReturnType<typeof vi.fn>).mockReturnValue(of(TEST_LEVEL_DEF));

    // Trigger retry
    component.onRetryLoad();
    fixture.detectChanges();
    await fixture.whenStable();

    // Error should be cleared
    expect(component.loadError()).toBeNull();
    // viewState should be 'ready' (not 'error')
    expect(component.viewState()).toBe('ready');
    // Engine should be loaded successfully
    expect(component.engine()).not.toBeNull();
  });
});
