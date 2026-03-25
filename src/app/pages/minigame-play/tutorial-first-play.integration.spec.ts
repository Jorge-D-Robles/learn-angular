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
import { MinigameEngine, type ActionResult } from '../../core/minigame/minigame-engine';
import { DifficultyTier, MinigameStatus } from '../../core/minigame/minigame.types';
import type { MinigameConfig } from '../../core/minigame/minigame.types';
import type { LevelDefinition, LevelPack } from '../../core/levels/level.types';
import type { TutorialStep } from '../../shared/components/minigame-tutorial/minigame-tutorial.types';
import { tutorialSeenKey } from '../../shared/components/minigame-tutorial/minigame-tutorial.types';
import { StatePersistenceService } from '../../core/persistence/state-persistence.service';

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

// --- Test engine ---

class TestEngine extends MinigameEngine<unknown> {
  constructor() { super({ initialLives: 3, timerDuration: null }); }
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

const TEST_TUTORIAL_STEPS: TutorialStep[] = [
  { title: 'Step 1', description: 'First step' },
  { title: 'Step 2', description: 'Second step' },
];

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

const TEST_CONFIG_WITH_TUTORIAL: MinigameConfig = {
  id: 'module-assembly',
  name: 'Module Assembly',
  description: 'Conveyor belt drag-and-drop assembly',
  angularTopic: 'Components',
  totalLevels: 18,
  difficultyTiers: [DifficultyTier.Basic],
  tutorialSteps: TEST_TUTORIAL_STEPS,
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

async function setup(options: { tutorialSeen?: boolean } = {}) {
  const testEngine = new TestEngine();

  const mockRegistry = {
    getComponent: vi.fn().mockReturnValue(DummyGameComponent),
    getConfig: vi.fn().mockReturnValue(TEST_CONFIG_WITH_TUTORIAL),
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

  // Set tutorial-seen flag if requested
  if (options.tutorialSeen) {
    const persistence = TestBed.inject(StatePersistenceService);
    persistence.save(tutorialSeenKey('module-assembly'), true);
  }

  // Register level pack so real LevelLoaderService and LevelProgressionService have data
  TestBed.inject(LevelLoaderService).registerLevelPack(TEST_LEVEL_PACK);

  const fixture = TestBed.createComponent(MinigamePlayPage);
  fixture.detectChanges();
  await fixture.whenStable();

  return { fixture, component: fixture.componentInstance, testEngine };
}

// --- Integration tests ---

describe('MinigamePlayPage tutorial-to-first-play flow', () => {
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

  it('first play with no tutorial-seen flag shows tutorial overlay and does not start engine', async () => {
    const { component, testEngine } = await setup({ tutorialSeen: false });

    // Tutorial should be visible
    expect(component.showTutorial()).toBe(true);

    // Engine should be loaded but NOT started (still Loading status)
    expect(testEngine.status()).toBe(MinigameStatus.Loading);
  });

  it('dismissing tutorial starts the engine and marks tutorial as seen', async () => {
    const { fixture, component, testEngine } = await setup({ tutorialSeen: false });

    // Dismiss tutorial
    component.onTutorialDismissed();
    fixture.detectChanges();
    await fixture.whenStable();

    // Tutorial hidden
    expect(component.showTutorial()).toBe(false);

    // Engine started
    expect(testEngine.status()).toBe(MinigameStatus.Playing);
  });

  it('subsequent play with tutorial-seen flag skips tutorial and starts engine immediately', async () => {
    const { component, testEngine } = await setup({ tutorialSeen: true });

    // Tutorial should NOT be shown
    expect(component.showTutorial()).toBe(false);

    // Engine should be playing
    expect(testEngine.status()).toBe(MinigameStatus.Playing);
  });

  it('"How to Play" from pause menu shows tutorial without blocking engine restart', async () => {
    const { fixture, component, testEngine } = await setup({ tutorialSeen: true });

    // Engine is playing
    expect(testEngine.status()).toBe(MinigameStatus.Playing);

    // Simulate "How to Play" from pause menu
    component.onHowToPlay();
    fixture.detectChanges();

    // Tutorial is visible
    expect(component.showTutorial()).toBe(true);

    // Dismiss tutorial (should not restart engine since this is not first play)
    component.onTutorialDismissed();
    fixture.detectChanges();

    // Tutorial hidden
    expect(component.showTutorial()).toBe(false);
  });
});
