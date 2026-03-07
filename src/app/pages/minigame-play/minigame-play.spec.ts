import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { MinigamePlayPage } from './minigame-play';
import { MinigameRegistryService } from '../../core/minigame/minigame-registry.service';
import { LevelProgressionService } from '../../core/levels/level-progression.service';
import type { MinigameConfig } from '../../core/minigame/minigame.types';
import { DifficultyTier } from '../../core/minigame/minigame.types';
import type { LevelDefinition } from '../../core/levels/level.types';

@Component({
  selector: 'app-test-dummy',
  template: '<p class="dummy-game">dummy</p>',
})
class DummyGameComponent {}

function mockRegistry(overrides: Partial<MinigameRegistryService> = {}) {
  return {
    provide: MinigameRegistryService,
    useValue: {
      getComponent: vi.fn().mockReturnValue(undefined),
      getConfig: vi.fn().mockReturnValue(undefined),
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

async function setup(options: {
  params?: Record<string, string>;
  registry?: Partial<MinigameRegistryService>;
  levelProgression?: Partial<LevelProgressionService>;
}) {
  const {
    params = { gameId: 'module-assembly', levelId: '1' },
    registry = {},
    levelProgression = {},
  } = options;

  await TestBed.configureTestingModule({
    imports: [MinigamePlayPage],
    providers: [
      provideRouter([]),
      mockRegistry(registry),
      mockLevelProgression(levelProgression),
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
});
