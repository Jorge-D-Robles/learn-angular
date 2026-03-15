import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { CorridorRunnerComponent } from './corridor-runner.component';
import { CorridorRunnerEngine } from './corridor-runner.engine';
import { CorridorRunnerMapComponent } from './map/map';
import { CorridorRunnerRouteEditorComponent } from './route-editor/route-editor';
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
      const nodes = fixture.nativeElement.querySelectorAll('.cr-map__module');
      expect(nodes.length).toBe(3);
    });

    it('should render corridor edges matching engine mapLayout edge count', () => {
      setup();
      const edges = fixture.nativeElement.querySelectorAll('.cr-map__corridor');
      expect(edges.length).toBe(2);
    });
  });

  // --- 2. Phase Switching Tests ---

  describe('Phase Switching', () => {
    it('should start in config phase by default', () => {
      setup();
      expect(component.phase()).toBe('config');
    });

    it('should switch to run phase on configSubmitted', () => {
      setup();

      component.onConfigChanged([{ path: 'engineering', component: 'EngineeringBay' }]);
      component.onConfigSubmitted();
      fixture.detectChanges();

      expect(component.phase()).toBe('run');
    });

    it('should switch back to config phase on reset', () => {
      setup();

      // Go to run phase
      component.onConfigChanged([{ path: 'engineering', component: 'EngineeringBay' }]);
      component.onConfigSubmitted();
      fixture.detectChanges();
      expect(component.phase()).toBe('run');

      // Reset
      component.onReset();
      fixture.detectChanges();
      expect(component.phase()).toBe('config');
    });
  });

  // --- 3. Config Phase - Route Editor Tests ---

  describe('Config Phase - Route Editor', () => {
    it('should render route editor child in config phase', () => {
      setup();
      const editor = fixture.nativeElement.querySelector('app-corridor-runner-route-editor');
      expect(editor).toBeTruthy();
    });

    it('should submit set-route-config action on configChanged', () => {
      setup();
      const submitSpy = vi.spyOn(engine, 'submitAction');

      component.onConfigChanged([{ path: 'engineering', component: 'EngineeringBay' }]);

      expect(submitSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'set-route-config',
          routes: [{ path: 'engineering', component: 'EngineeringBay' }],
        }),
      );
    });
  });

  // --- 4. Config Phase - Corridor Glow Tests ---

  describe('Config Phase - Corridor Glow', () => {
    it('should show dark corridors when no routes are configured', () => {
      setup();
      const corridors = fixture.nativeElement.querySelectorAll('.cr-map__corridor');
      const litCorridors = fixture.nativeElement.querySelectorAll('.cr-map__corridor--lit');
      expect(corridors.length).toBe(2);
      expect(litCorridors.length).toBe(0);
    });

    it('should light up corridors when routes are configured that match map edges', () => {
      setup();

      // Configure a route with component matching node label "EngineeringBay"
      component.onConfigChanged([{ path: 'engineering', component: 'EngineeringBay' }]);
      fixture.detectChanges();

      const litCorridors = fixture.nativeElement.querySelectorAll('.cr-map__corridor--lit');
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

      component.onConfigChanged([{ path: 'engineering', component: 'EngineeringBay' }]);
      component.onConfigSubmitted();
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
      component.onConfigChanged([]);
      component.onConfigSubmitted();
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

      component.onConfigChanged([{ path: 'engineering', component: 'EngineeringBay' }]);
      component.onConfigSubmitted();
      fixture.detectChanges();

      const runBtn = fixture.nativeElement.querySelector('.corridor-runner__run-btn') as HTMLButtonElement;
      runBtn.click();
      fixture.detectChanges();

      expect(runSpy).toHaveBeenCalled();
    });

    it('should animate crew sprite through waypoints during navigation', () => {
      vi.useFakeTimers();
      setup();

      component.onConfigChanged([{ path: 'engineering', component: 'EngineeringBay' }]);
      component.onConfigSubmitted();
      component.onRunTest();
      fixture.detectChanges();

      const crew = component.animatingCrew();
      expect(crew).not.toBeNull();
      expect(crew!.path.length).toBeGreaterThan(0);

      vi.useRealTimers();
    });

    it('should advance crew currentStep during animation', () => {
      vi.useFakeTimers();
      setup();

      component.onConfigChanged([{ path: 'engineering', component: 'EngineeringBay' }]);
      component.onConfigSubmitted();
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

      component.onConfigChanged([]);
      component.onConfigSubmitted();
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

      component.onConfigChanged([{ path: 'engineering', component: 'EngineeringBay' }]);
      component.onConfigSubmitted();
      component.onRunTest();
      fixture.detectChanges();

      // Fast forward past all animation + completion
      const pathLen = component.animatingCrew()!.path.length;
      vi.advanceTimersByTime(pathLen * CREW_STEP_MS + 1);
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

      component.onConfigChanged([]);
      component.onConfigSubmitted();
      component.onRunTest();
      fixture.detectChanges();

      // The crew is already at hull breach position (entry node only)
      const crew = component.animatingCrew();
      expect(crew).not.toBeNull();
      expect(crew!.isHullBreach).toBe(true);

      // Advance to completion
      vi.advanceTimersByTime((crew!.path.length) * CREW_STEP_MS + 1);
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

      // Pressing enter in config phase -> config submitted
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

      const nodes = fixture.nativeElement.querySelectorAll('.cr-map__module');
      const edges = fixture.nativeElement.querySelectorAll('.cr-map__corridor');
      expect(nodes.length).toBe(0);
      expect(edges.length).toBe(0);
    });

    it('should handle engine returning null from runAllNavigations (no crash)', () => {
      setup();
      vi.spyOn(engine, 'runAllNavigations').mockReturnValue(null);

      component.onConfigChanged([{ path: 'engineering', component: 'EngineeringBay' }]);
      component.onConfigSubmitted();
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
      component.onConfigChanged([]);
      component.onConfigSubmitted();
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

  // --- 10. Child Component Wiring Tests ---

  describe('Child Component Wiring', () => {
    it('should render CorridorRunnerMapComponent child in the template', () => {
      setup();
      const mapEl = fixture.nativeElement.querySelector('app-corridor-runner-map');
      expect(mapEl).toBeTruthy();
    });

    it('should bind stationMap input to engine mapLayout signal', () => {
      setup();
      const mapDebug = fixture.debugElement.query(By.directive(CorridorRunnerMapComponent));
      const mapChild = mapDebug.componentInstance as CorridorRunnerMapComponent;
      expect(mapChild.stationMap()).toEqual(engine.mapLayout());
    });

    it('should bind configuredRoutes input to engine playerRouteConfig signal', () => {
      setup();
      component.onConfigChanged([{ path: 'engineering', component: 'EngineeringBay' }]);
      fixture.detectChanges();

      const mapDebug = fixture.debugElement.query(By.directive(CorridorRunnerMapComponent));
      const mapChild = mapDebug.componentInstance as CorridorRunnerMapComponent;
      expect(mapChild.configuredRoutes()).toEqual(engine.playerRouteConfig());
    });

    it('should bind crewPath and crewStep inputs during animation', () => {
      vi.useFakeTimers();
      setup();

      component.onConfigChanged([{ path: 'engineering', component: 'EngineeringBay' }]);
      component.onConfigSubmitted();
      component.onRunTest();
      fixture.detectChanges();

      const mapDebug = fixture.debugElement.query(By.directive(CorridorRunnerMapComponent));
      const mapChild = mapDebug.componentInstance as CorridorRunnerMapComponent;
      expect(mapChild.crewPath().length).toBeGreaterThan(0);
      expect(mapChild.crewPath().every(id => typeof id === 'string')).toBe(true);
      expect(mapChild.crewStep()).toBe(0);

      vi.useRealTimers();
    });

    it('should bind isHullBreach input during hull breach animation', () => {
      vi.useFakeTimers();
      setup(createTestLevelData({
        testNavigations: [
          { url: '/unknown', expectedDestination: 'SomeBay', description: 'Fails' },
        ],
      }));

      component.onConfigChanged([]);
      component.onConfigSubmitted();
      component.onRunTest();
      fixture.detectChanges();

      const mapDebug = fixture.debugElement.query(By.directive(CorridorRunnerMapComponent));
      const mapChild = mapDebug.componentInstance as CorridorRunnerMapComponent;
      expect(mapChild.isHullBreach()).toBe(true);

      vi.useRealTimers();
    });

    it('should bind expanded input to true when in run phase', () => {
      setup();
      component.onConfigChanged([{ path: 'engineering', component: 'EngineeringBay' }]);
      component.onConfigSubmitted();
      fixture.detectChanges();

      const mapDebug = fixture.debugElement.query(By.directive(CorridorRunnerMapComponent));
      const mapChild = mapDebug.componentInstance as CorridorRunnerMapComponent;
      expect(mapChild.expanded()).toBe(true);
    });

    it('should forward moduleClicked output to parent handler', () => {
      setup();
      const spy = vi.spyOn(component, 'onModuleClicked');

      // Click a module circle in the child
      const circle = fixture.nativeElement.querySelector('.cr-map__module circle') as SVGCircleElement;
      expect(circle).toBeTruthy();
      circle.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      fixture.detectChanges();

      expect(spy).toHaveBeenCalledWith(expect.any(String));
    });

    it('should bind animationComplete input after animation finishes', () => {
      vi.useFakeTimers();
      setup();

      component.onConfigChanged([{ path: 'engineering', component: 'EngineeringBay' }]);
      component.onConfigSubmitted();
      component.onRunTest();
      fixture.detectChanges();

      const pathLen = component.animatingCrew()!.path.length;
      vi.advanceTimersByTime(pathLen * CREW_STEP_MS + 1);
      fixture.detectChanges();

      const mapDebug = fixture.debugElement.query(By.directive(CorridorRunnerMapComponent));
      const mapChild = mapDebug.componentInstance as CorridorRunnerMapComponent;
      expect(mapChild.animationComplete()).toBe(true);

      vi.useRealTimers();
    });
  });

  // --- 11. Route Editor Child Wiring Tests ---

  describe('Route Editor Child Wiring', () => {
    it('should render CorridorRunnerRouteEditorComponent child in config phase', () => {
      setup();
      const editorEl = fixture.nativeElement.querySelector('app-corridor-runner-route-editor');
      expect(editorEl).toBeTruthy();
    });

    it('should bind availableComponents input from map layout nodes', () => {
      setup();
      fixture.detectChanges();

      const editorDebug = fixture.debugElement.query(By.directive(CorridorRunnerRouteEditorComponent));
      const editorChild = editorDebug.componentInstance as CorridorRunnerRouteEditorComponent;

      // Map has 3 nodes: Airlock (entry), Corridor, EngineeringBay. Entry node excluded.
      expect(editorChild.availableComponents()).toEqual(['Corridor', 'EngineeringBay']);
    });

    it('should forward configChanged output to engine set-route-config action', () => {
      setup();
      const submitSpy = vi.spyOn(engine, 'submitAction');

      const routes = [{ path: 'engineering', component: 'EngineeringBay' }];
      component.onConfigChanged(routes);

      expect(submitSpy).toHaveBeenCalledWith({ type: 'set-route-config', routes });
    });

    it('should transition to run phase on configSubmitted output', () => {
      setup();
      expect(component.phase()).toBe('config');

      component.onConfigSubmitted();

      expect(component.phase()).toBe('run');
    });

    it('should not render route editor in run phase', () => {
      setup();
      component.onConfigSubmitted();
      fixture.detectChanges();

      const editorEl = fixture.nativeElement.querySelector('app-corridor-runner-route-editor');
      expect(editorEl).toBeFalsy();
    });

    it('should hide route editor controls from parent controls bar in config phase', () => {
      setup();
      fixture.detectChanges();

      const lockBtn = fixture.nativeElement.querySelector('.corridor-runner__lock-btn');
      expect(lockBtn).toBeFalsy();
    });
  });
});
