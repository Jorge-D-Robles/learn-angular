import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { CorridorRunnerComponent } from './corridor-runner.component';
import { CorridorRunnerEngine } from './corridor-runner.engine';
import { MINIGAME_ENGINE } from '../../../core/minigame/minigame-engine.tokens';
import { KeyboardShortcutService } from '../../../core/minigame/keyboard-shortcut.service';
import {
  DifficultyTier,
  type MinigameLevel,
} from '../../../core/minigame/minigame.types';
import type {
  CorridorRunnerLevelData,
  MapLayout,
  MapNode,
  MapEdge,
  RouteEntry,
  TestNavigation,
  TargetDestination,
} from './corridor-runner.types';

// ---------------------------------------------------------------------------
// Constants (mirrored from component for assertions)
// ---------------------------------------------------------------------------

const CREW_STEP_MS = 300;

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function createTestLevelData(overrides?: Partial<CorridorRunnerLevelData>): CorridorRunnerLevelData {
  const nodes: MapNode[] = [
    { id: 'entry', label: 'Airlock', position: { x: 10, y: 50 } },
    { id: 'corridor', label: 'Corridor', position: { x: 50, y: 50 } },
    { id: 'dest', label: 'EngineeringBay', position: { x: 90, y: 50 } },
  ];
  const edges: MapEdge[] = [
    { id: 'e-1', sourceNodeId: 'entry', targetNodeId: 'corridor' },
    { id: 'e-2', sourceNodeId: 'corridor', targetNodeId: 'dest' },
  ];
  const mapLayout: MapLayout = { nodes, edges };

  const routeConfig: RouteEntry[] = [
    { path: 'engineering', component: 'EngineeringBay' },
  ];
  const testNavigations: TestNavigation[] = [
    { url: '/engineering', expectedDestination: 'EngineeringBay', description: 'Navigate to engineering' },
  ];
  const targetDestinations: TargetDestination[] = [
    { moduleId: 'dest', moduleName: 'EngineeringBay', requiredPath: 'engineering' },
  ];

  return {
    routeConfig,
    mapLayout,
    testNavigations,
    targetDestinations,
    ...overrides,
  };
}

function createLevel(
  data: CorridorRunnerLevelData,
  tier: DifficultyTier = DifficultyTier.Basic,
): MinigameLevel<CorridorRunnerLevelData> {
  return {
    id: 'cr-test-01',
    gameId: 'corridor-runner',
    tier,
    conceptIntroduced: 'Basic routing',
    description: 'Test level',
    data,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('CorridorRunnerComponent', () => {
  let engine: CorridorRunnerEngine;
  let fixture: ComponentFixture<CorridorRunnerComponent>;
  let component: CorridorRunnerComponent;
  let shortcuts: KeyboardShortcutService;

  function setup(levelData?: CorridorRunnerLevelData, tier?: DifficultyTier) {
    engine = new CorridorRunnerEngine();
    engine.initialize(createLevel(levelData ?? createTestLevelData(), tier));
    engine.start();

    TestBed.configureTestingModule({
      imports: [CorridorRunnerComponent],
      providers: [
        { provide: MINIGAME_ENGINE, useValue: engine },
      ],
    });

    fixture = TestBed.createComponent(CorridorRunnerComponent);
    component = fixture.componentInstance;
    shortcuts = TestBed.inject(KeyboardShortcutService);
    fixture.detectChanges();
  }

  afterEach(() => {
    fixture?.destroy();
  });

  // --- 1. Rendering Tests ---

  describe('Rendering', () => {
    it('should create successfully with engine token provided', () => {
      setup();
      expect(component).toBeTruthy();
    });

    it('should create successfully without engine (inert mode)', () => {
      TestBed.configureTestingModule({
        imports: [CorridorRunnerComponent],
      });
      const inertFixture = TestBed.createComponent(CorridorRunnerComponent);
      inertFixture.detectChanges();
      expect(inertFixture.componentInstance).toBeTruthy();
      inertFixture.destroy();
    });

    it('should render map nodes matching engine mapLayout node count', () => {
      setup();
      const nodes = fixture.nativeElement.querySelectorAll('.corridor-runner__module');
      expect(nodes.length).toBe(3);
    });

    it('should render corridor edges matching engine mapLayout edge count', () => {
      setup();
      const edges = fixture.nativeElement.querySelectorAll('.corridor-runner__corridor');
      expect(edges.length).toBe(2);
    });
  });

  // --- 2. Phase Switching Tests ---

  describe('Phase Switching', () => {
    it('should start in config phase by default', () => {
      setup();
      expect(component.phase()).toBe('config');
    });

    it('should switch to run phase when "Lock Routes" is clicked after setting config', () => {
      setup();

      // Set a valid route config
      component.onCodeChange('[{"path": "engineering", "component": "EngineeringBay"}]');
      fixture.detectChanges();

      const lockBtn = fixture.nativeElement.querySelector('.corridor-runner__lock-btn') as HTMLButtonElement;
      lockBtn.click();
      fixture.detectChanges();

      expect(component.phase()).toBe('run');
    });

    it('should switch back to config phase on reset', () => {
      setup();

      // Go to run phase
      component.onCodeChange('[{"path": "engineering", "component": "EngineeringBay"}]');
      component.onLockRoutes();
      fixture.detectChanges();
      expect(component.phase()).toBe('run');

      // Reset
      component.onReset();
      fixture.detectChanges();
      expect(component.phase()).toBe('config');
    });
  });

  // --- 3. Config Phase - Code Editor Tests ---

  describe('Config Phase - Code Editor', () => {
    it('should render code editor in config phase', () => {
      setup();
      const editor = fixture.nativeElement.querySelector('nx-code-editor');
      expect(editor).toBeTruthy();
    });

    it('should submit set-route-config action on code change (synchronous parse)', () => {
      setup();
      const submitSpy = vi.spyOn(engine, 'submitAction');

      component.onCodeChange('[{"path": "engineering", "component": "EngineeringBay"}]');

      expect(submitSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'set-route-config',
          routes: [{ path: 'engineering', component: 'EngineeringBay' }],
        }),
      );
    });

    it('should show validation error for unparseable config', () => {
      setup();

      component.onCodeChange('not valid json {{{');
      fixture.detectChanges();

      expect(component.parseError()).toBe('Invalid route configuration');
      const errorEl = fixture.nativeElement.querySelector('.corridor-runner__parse-error');
      expect(errorEl).toBeTruthy();
    });
  });

  // --- 4. Config Phase - Corridor Glow Tests ---

  describe('Config Phase - Corridor Glow', () => {
    it('should show dark corridors when no routes are configured', () => {
      setup();
      const corridors = fixture.nativeElement.querySelectorAll('.corridor-runner__corridor');
      const litCorridors = fixture.nativeElement.querySelectorAll('.corridor-runner__corridor--lit');
      expect(corridors.length).toBe(2);
      expect(litCorridors.length).toBe(0);
    });

    it('should light up corridors when routes are configured that match map edges', () => {
      setup();

      // Configure a route with component matching node label "EngineeringBay"
      component.onCodeChange('[{"path": "engineering", "component": "EngineeringBay"}]');
      fixture.detectChanges();

      const litCorridors = fixture.nativeElement.querySelectorAll('.corridor-runner__corridor--lit');
      expect(litCorridors.length).toBeGreaterThan(0);
    });
  });

  // --- 5. URL Bar Tests ---

  describe('URL Bar', () => {
    it('should render URL bar with initial empty path', () => {
      setup();
      const urlBar = fixture.nativeElement.querySelector('.corridor-runner__url-bar');
      expect(urlBar).toBeTruthy();
      expect(urlBar.textContent).toContain('/');
    });

    it('should update URL bar during crew navigation animation', () => {
      vi.useFakeTimers();
      setup();

      component.onCodeChange('[{"path": "engineering", "component": "EngineeringBay"}]');
      component.onLockRoutes();
      component.onRunTest();
      fixture.detectChanges();

      expect(component.currentUrl()).toBe('/engineering');
      const urlBar = fixture.nativeElement.querySelector('.corridor-runner__url-bar');
      expect(urlBar.textContent).toContain('/engineering');

      vi.useRealTimers();
    });

    it('should show hull breach path in URL bar with error styling', () => {
      vi.useFakeTimers();
      setup(createTestLevelData({
        testNavigations: [
          { url: '/unknown', expectedDestination: 'SomeBay', description: 'Fails' },
        ],
      }));

      // No routes configured, so any URL will be a hull breach
      component.onCodeChange('[]');
      component.onLockRoutes();
      component.onRunTest();
      fixture.detectChanges();

      expect(component.currentUrl()).toBe('/unknown');
      const urlBar = fixture.nativeElement.querySelector('.corridor-runner__url-bar');
      expect(urlBar.classList.contains('corridor-runner__url-bar--error')).toBe(true);

      vi.useRealTimers();
    });
  });

  // --- 6. Run Phase - Crew Animation Tests ---

  describe('Run Phase - Crew Animation', () => {
    it('should call engine.runAllNavigations() on "Run Test" button click', () => {
      setup();
      const runSpy = vi.spyOn(engine, 'runAllNavigations');

      component.onCodeChange('[{"path": "engineering", "component": "EngineeringBay"}]');
      component.onLockRoutes();
      fixture.detectChanges();

      const runBtn = fixture.nativeElement.querySelector('.corridor-runner__run-btn') as HTMLButtonElement;
      runBtn.click();
      fixture.detectChanges();

      expect(runSpy).toHaveBeenCalled();
    });

    it('should animate crew sprite through waypoints during navigation', () => {
      vi.useFakeTimers();
      setup();

      component.onCodeChange('[{"path": "engineering", "component": "EngineeringBay"}]');
      component.onLockRoutes();
      component.onRunTest();
      fixture.detectChanges();

      const crew = component.animatingCrew();
      expect(crew).not.toBeNull();
      expect(crew!.waypoints.length).toBeGreaterThan(0);

      vi.useRealTimers();
    });

    it('should advance crew currentStep during animation', () => {
      vi.useFakeTimers();
      setup();

      component.onCodeChange('[{"path": "engineering", "component": "EngineeringBay"}]');
      component.onLockRoutes();
      component.onRunTest();
      fixture.detectChanges();

      expect(component.animatingCrew()!.currentStep).toBe(0);

      vi.advanceTimersByTime(CREW_STEP_MS);
      fixture.detectChanges();

      expect(component.animatingCrew()!.currentStep).toBe(1);

      vi.useRealTimers();
    });

    it('should show hull breach animation at dead-end (when isHullBreach is true)', () => {
      vi.useFakeTimers();
      setup(createTestLevelData({
        testNavigations: [
          { url: '/unknown', expectedDestination: 'SomeBay', description: 'Fails' },
        ],
      }));

      component.onCodeChange('[]');
      component.onLockRoutes();
      component.onRunTest();
      fixture.detectChanges();

      const crew = component.animatingCrew();
      expect(crew).not.toBeNull();
      expect(crew!.isHullBreach).toBe(true);

      vi.useRealTimers();
    });
  });

  // --- 7. Run Phase - Result Display Tests ---

  describe('Run Phase - Result Display', () => {
    it('should show success state when all navigations correct', () => {
      vi.useFakeTimers();
      setup();

      component.onCodeChange('[{"path": "engineering", "component": "EngineeringBay"}]');
      component.onLockRoutes();
      component.onRunTest();
      fixture.detectChanges();

      // Fast forward past all animation + completion
      const waypoints = component.animatingCrew()!.waypoints.length;
      vi.advanceTimersByTime(waypoints * CREW_STEP_MS + 1);
      fixture.detectChanges();

      const crew = component.animatingCrew();
      expect(crew!.animationComplete).toBe(true);
      expect(crew!.isSuccess).toBe(true);

      vi.useRealTimers();
    });

    it('should show hull breach state when navigation results have hull breaches', () => {
      vi.useFakeTimers();
      setup(createTestLevelData({
        testNavigations: [
          { url: '/unknown', expectedDestination: 'SomeBay', description: 'Fails' },
        ],
      }));

      component.onCodeChange('[]');
      component.onLockRoutes();
      component.onRunTest();
      fixture.detectChanges();

      // The crew is already at hull breach position (entry node only)
      const crew = component.animatingCrew();
      expect(crew).not.toBeNull();
      expect(crew!.isHullBreach).toBe(true);

      // Advance to completion
      vi.advanceTimersByTime((crew!.waypoints.length) * CREW_STEP_MS + 1);
      fixture.detectChanges();

      const updatedCrew = component.animatingCrew();
      expect(updatedCrew!.animationComplete).toBe(true);
      expect(updatedCrew!.isHullBreach).toBe(true);

      vi.useRealTimers();
    });
  });

  // --- 8. Keyboard Shortcut Tests ---

  describe('Keyboard Shortcuts', () => {
    it('should register enter and escape keys on init', () => {
      setup();
      const registered = shortcuts.getRegistered();
      expect(registered.find(r => r.key === 'enter')).toBeDefined();
      expect(registered.find(r => r.key === 'escape')).toBeDefined();
    });

    it('should trigger appropriate action on key press', () => {
      setup();

      // Set config so lock routes will work
      component.onCodeChange('[{"path": "engineering", "component": "EngineeringBay"}]');

      // Pressing enter in config phase -> lock routes
      const enterReg = shortcuts.getRegistered().find(r => r.key === 'enter');
      enterReg?.callback();
      expect(component.phase()).toBe('run');

      // Pressing escape -> reset
      const escReg = shortcuts.getRegistered().find(r => r.key === 'escape');
      escReg?.callback();
      expect(component.phase()).toBe('config');
    });

    it('should unregister all shortcuts on destroy', () => {
      setup();
      const unregisterSpy = vi.spyOn(shortcuts, 'unregister');

      component.ngOnDestroy();

      expect(unregisterSpy).toHaveBeenCalledWith('enter');
      expect(unregisterSpy).toHaveBeenCalledWith('escape');
    });
  });

  // --- 9. Edge Cases ---

  describe('Edge Cases', () => {
    it('should handle empty map (0 nodes, 0 edges) without errors', () => {
      setup(createTestLevelData({
        mapLayout: { nodes: [], edges: [] },
      }));
      fixture.detectChanges();

      const nodes = fixture.nativeElement.querySelectorAll('.corridor-runner__module');
      const edges = fixture.nativeElement.querySelectorAll('.corridor-runner__corridor');
      expect(nodes.length).toBe(0);
      expect(edges.length).toBe(0);
    });

    it('should handle engine returning null from runAllNavigations (no crash)', () => {
      setup();
      vi.spyOn(engine, 'runAllNavigations').mockReturnValue(null);

      component.onCodeChange('[{"path": "engineering", "component": "EngineeringBay"}]');
      component.onLockRoutes();
      component.onRunTest();
      fixture.detectChanges();

      expect(component.animatingCrew()).toBeNull();
      expect(component.phase()).toBe('run');
    });

    it('should handle partial results from runAllNavigations (animation shows only returned results)', () => {
      vi.useFakeTimers();
      // Two navigations, first will hull breach
      setup(createTestLevelData({
        testNavigations: [
          { url: '/unknown', expectedDestination: 'SomeBay', description: 'Fails 1' },
          { url: '/also-unknown', expectedDestination: 'SomeBay', description: 'Fails 2' },
          { url: '/engineering', expectedDestination: 'EngineeringBay', description: 'Would succeed' },
        ],
      }));

      // No routes => all hull breaches, engine stops after 2 lives lost
      component.onCodeChange('[]');
      component.onLockRoutes();
      component.onRunTest();
      fixture.detectChanges();

      // Engine returns partial results (2 hull breaches, engine died before 3rd)
      const result = engine.runResult();
      expect(result).not.toBeNull();
      // Should have at most 2 results (engine stops after 2 hull breaches with default lives=2)
      expect(result!.navigationResults.length).toBeLessThanOrEqual(2);

      vi.useRealTimers();
    });
  });
});
