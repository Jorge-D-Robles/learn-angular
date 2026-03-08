import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import {
  LucideIconConfig,
  LucideIconProvider,
  LUCIDE_ICONS,
} from 'lucide-angular';
import { of } from 'rxjs';
import { APP_ICONS } from '../../shared/icons';
import { MinigamePlayPage } from './minigame-play';
import { MinigameRegistryService } from '../../core/minigame/minigame-registry.service';
import { LevelLoaderService } from '../../core/levels/level-loader.service';
import { LevelNavigationService } from '../../core/levels/level-navigation.service';
import { LevelCompletionService } from '../../core/minigame/level-completion.service';
import { HintService } from '../../core/minigame/hint.service';
import { ComboTrackerService } from '../../core/minigame/combo-tracker.service';
import { MinigameEngine, type ActionResult, type MinigameEngineConfig } from '../../core/minigame/minigame-engine';
import { MinigameStatus, DifficultyTier } from '../../core/minigame/minigame.types';
import type { LevelDefinition, LevelPack } from '../../core/levels/level.types';

// --- Icon providers ---

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
  constructor(config: Partial<MinigameEngineConfig> = {}) {
    super({ initialLives: 3, timerDuration: null, ...config });
  }
  protected onLevelLoad(): void { /* stub */ }
  protected onStart(): void { /* stub */ }
  protected onComplete(): void { /* stub */ }
  protected validateAction(): ActionResult {
    return { valid: true, scoreChange: 10, livesChange: 0 };
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

const TEST_LEVEL_PACK: LevelPack = {
  gameId: 'module-assembly',
  levels: [TEST_LEVEL_DEF],
};

const TEST_HINTS = [
  { id: 'hint-1', text: 'First hint' },
  { id: 'hint-2', text: 'Second hint' },
];

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

// --- Module-scope mocks ---

const mockRegistry = {
  getComponent: vi.fn().mockReturnValue(DummyGameComponent),
  getConfig: vi.fn().mockReturnValue({
    id: 'module-assembly',
    name: 'Module Assembly',
    description: 'Test',
    angularTopic: 'Components',
    totalLevels: 1,
    difficultyTiers: [DifficultyTier.Basic],
  }),
  getEngineFactory: vi.fn(),
};

const mockLevelNav = {
  getNextLevel: vi.fn().mockReturnValue(null),
  getPreviousLevel: vi.fn().mockReturnValue(null),
  isNextLevelUnlocked: vi.fn().mockReturnValue(false),
};

// --- Setup helper ---

async function setup(options: { withComboTracker?: boolean } = {}) {
  // 1. Configure TestBed (no component yet)
  await TestBed.configureTestingModule({
    imports: [MinigamePlayPage],
    providers: [
      provideRouter([]),
      ...ICON_PROVIDERS,
      { provide: MinigameRegistryService, useValue: mockRegistry },
      { provide: LevelNavigationService, useValue: mockLevelNav },
    ],
  }).compileComponents();

  TestBed.overrideProvider(ActivatedRoute, {
    useValue: { paramMap: of(convertToParamMap({ gameId: 'module-assembly', levelId: 'ma-basic-01' })) },
  });

  // 2. Inject real services from TestBed
  const comboTracker = options.withComboTracker
    ? TestBed.inject(ComboTrackerService)
    : undefined;
  const testEngine = new TestEngine(comboTracker ? { comboTracker } : {});

  // 3. Wire engine into registry mock
  mockRegistry.getEngineFactory.mockReturnValue(() => testEngine);

  // 4. Register level pack and hints
  TestBed.inject(LevelLoaderService).registerLevelPack(TEST_LEVEL_PACK);
  const hintService = TestBed.inject(HintService);
  hintService.registerHints('ma-basic-01', TEST_HINTS);
  hintService.configure({ maxScore: 1000 });

  // 5. Create component — triggers engine lifecycle effect
  const fixture = TestBed.createComponent(MinigamePlayPage);
  fixture.detectChanges();
  await fixture.whenStable();

  // 6. Spy on completeLevel AFTER whenStable (spy installed before any test-driven complete() call)
  const completeLevelSpy = vi.spyOn(
    TestBed.inject(LevelCompletionService),
    'completeLevel',
  );

  return { fixture, component: fixture.componentInstance, testEngine, hintService, comboTracker, completeLevelSpy };
}

// --- Integration tests ---

describe('MinigamePlayPage retry flow integration', () => {
  let savedStorage: Storage;

  beforeEach(() => {
    TestBed.resetTestingModule();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-07T12:00:00'));
    savedStorage = window.localStorage;
    Object.defineProperty(window, 'localStorage', { value: createFakeStorage(), writable: true, configurable: true });

    // HTMLDialogElement polyfill for JSDOM
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

  afterEach(() => {
    vi.runAllTimers();
    vi.useRealTimers();
    Object.defineProperty(window, 'localStorage', { value: savedStorage, writable: true, configurable: true });
  });

  it('should reset hint state on retry', async () => {
    const { fixture, component, testEngine, hintService } = await setup();

    // Request a hint (consuming one of two)
    hintService.requestHint('ma-basic-01');
    expect(hintService.hasUsedHints()).toBe(true);

    // Complete the engine
    testEngine.complete();
    fixture.detectChanges();

    // Retry
    component.onRetry();
    fixture.detectChanges();

    // After retry: usedHints cleared, registrations survive, UI hint text cleared
    expect(hintService.hasUsedHints()).toBe(false);
    expect(hintService.getRemainingHints('ma-basic-01')).toBe(2);
    expect(component.activeHintText()).toBe('');
  });

  it('should reset combo tracker on retry', async () => {
    const { fixture, component, testEngine, comboTracker } = await setup({ withComboTracker: true });

    // Build combo to 5
    for (let i = 0; i < 5; i++) {
      testEngine.recordCorrectAction();
    }
    // Pre-condition: combo is built
    expect(comboTracker!.currentCombo()).toBe(5);

    // Complete then retry
    testEngine.complete();
    fixture.detectChanges();
    component.onRetry();
    fixture.detectChanges();

    // After retry: engine.initialize() calls comboTracker.reset()
    expect(comboTracker!.currentCombo()).toBe(0);
    expect(comboTracker!.maxCombo()).toBe(0);
  });

  it('should clear intermediate state between completions on retry', async () => {
    const { fixture, component, testEngine, completeLevelSpy } = await setup();

    // First completion
    testEngine.complete();
    fixture.detectChanges();
    expect(completeLevelSpy).toHaveBeenCalledTimes(1);
    expect(component.completionSummary()).not.toBeNull();

    // Retry
    component.onRetry();
    fixture.detectChanges();

    // Intermediate state: completionSummary cleared
    expect(component.completionSummary()).toBeNull();

    // Second completion
    testEngine.complete();
    fixture.detectChanges();

    // completeLevelSpy called a second time, summary populated again
    expect(completeLevelSpy).toHaveBeenCalledTimes(2);
    expect(component.completionSummary()).not.toBeNull();
  });

  it('should return engine to Playing status after fail -> retry', async () => {
    const { fixture, component, testEngine } = await setup();

    // Fail the engine
    testEngine.fail();
    fixture.detectChanges();
    expect(testEngine.status()).toBe(MinigameStatus.Lost);

    // Retry
    component.onRetry();
    fixture.detectChanges();

    // After retry: engine re-initialized and started
    expect(testEngine.status()).toBe(MinigameStatus.Playing);
    expect(component.completionSummary()).toBeNull();
    expect(testEngine.score()).toBe(0);
    expect(testEngine.lives()).toBe(3); // initialLives
  });
});
