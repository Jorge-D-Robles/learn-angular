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
import { MinigameEngine, type ActionResult, type MinigameEngineConfig } from '../../core/minigame/minigame-engine';
import { DifficultyTier } from '../../core/minigame/minigame.types';
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

// --- Test engine subclasses ---

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

const TEST_LEVEL_PACK: LevelPack = {
  gameId: 'module-assembly',
  levels: [TEST_LEVEL_DEF],
};

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

// --- Setup helper ---

async function setup(engineOverride?: MinigameEngine<unknown>) {
  const testEngine = engineOverride ?? new TestEngine();

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
    getEngineFactory: vi.fn().mockReturnValue(() => testEngine),
  };

  const mockLevelNav = {
    getNextLevel: vi.fn().mockReturnValue(null),
    getPreviousLevel: vi.fn().mockReturnValue(null),
    isNextLevelUnlocked: vi.fn().mockReturnValue(false),
  };

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

  // Register level pack so real LevelLoaderService and LevelProgressionService have data
  TestBed.inject(LevelLoaderService).registerLevelPack(TEST_LEVEL_PACK);

  const fixture = TestBed.createComponent(MinigamePlayPage);
  fixture.detectChanges();
  await fixture.whenStable();

  const completeLevelSpy = vi.spyOn(
    TestBed.inject(LevelCompletionService),
    'completeLevel',
  );

  return { fixture, component: fixture.componentInstance, testEngine, completeLevelSpy };
}

// --- Integration tests ---

describe('MinigamePlayPage completion-to-progression integration', () => {
  let originalLocalStorage: Storage;

  beforeEach(() => {
    TestBed.resetTestingModule();

    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-07T12:00:00'));

    const fakeStorage = createFakeStorage();
    originalLocalStorage = window.localStorage;
    Object.defineProperty(window, 'localStorage', { value: fakeStorage, writable: true, configurable: true });

    // HTMLDialogElement polyfill
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
    Object.defineProperty(window, 'localStorage', { value: originalLocalStorage, writable: true, configurable: true });
  });

  it('should call completeLevel with correct MinigameResult when engine wins', async () => {
    const { fixture, completeLevelSpy, testEngine } = await setup();

    testEngine.complete();
    fixture.detectChanges();

    expect(completeLevelSpy).toHaveBeenCalledTimes(1);
    const result = completeLevelSpy.mock.calls[0][0];
    expect(result.gameId).toBe('module-assembly');
    expect(result.levelId).toBe('ma-basic-01');
    expect(result.score).toBe(0);
    expect(result.perfect).toBe(true);
    expect(result.starRating).toBe(1);
  });

  it('should set completionSummary signal after completion', async () => {
    const { fixture, component, testEngine } = await setup();

    testEngine.complete();
    fixture.detectChanges();

    const summary = component.completionSummary();
    expect(summary).not.toBeNull();
    expect(summary!.xpEarned).toBe(30); // Basic perfect: 15 * 2
    expect(summary!.bonuses.perfect).toBe(true);
  });

  it('should only fire completion once per level', async () => {
    const { fixture, completeLevelSpy, testEngine } = await setup();

    testEngine.complete();
    fixture.detectChanges();
    fixture.detectChanges();
    fixture.detectChanges();

    expect(completeLevelSpy).toHaveBeenCalledTimes(1);
  });

  it('should allow re-completion after retry', async () => {
    const { fixture, component, completeLevelSpy, testEngine } = await setup();

    // First completion
    testEngine.complete();
    fixture.detectChanges();
    expect(completeLevelSpy).toHaveBeenCalledTimes(1);

    // Retry resets the engine and completionFired flag
    component.onRetry();
    fixture.detectChanges();

    // Second completion
    testEngine.complete();
    fixture.detectChanges();

    expect(completeLevelSpy).toHaveBeenCalledTimes(2);
    expect(component.completionSummary()).not.toBeNull();
  });

  it('should build MinigameResult with correct score and star rating', async () => {
    const testEngine = new TestEngineForScoring({ maxScore: 1000 });
    const { fixture, component, completeLevelSpy } = await setup(testEngine);

    testEngine.setNextScoreChange(950);
    testEngine.submitAction({});
    testEngine.complete();
    fixture.detectChanges();

    expect(completeLevelSpy).toHaveBeenCalledTimes(1);
    const result = completeLevelSpy.mock.calls[0][0];
    expect(result.score).toBe(950);
    expect(result.perfect).toBe(true);
    expect(result.starRating).toBe(3); // 950/1000 = 95% >= THREE_STAR threshold

    expect(component.completionSummary()?.xpEarned).toBe(30); // Basic perfect: 15 * 2
  });
});
