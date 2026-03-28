// ---------------------------------------------------------------------------
// Corridor Runner Visual State Integration Tests
// ---------------------------------------------------------------------------
// Verifies that the UI components correctly reflect engine state:
// - Config phase shows route editor, map dimmed/hidden
// - set-route-config action updates map corridor glow state
// - Run phase: crew member position updates along corridor path
// - Hull breach: decompression animation state set on map
// - Successful arrival: door open animation state set on target module
//
// Uses real CorridorRunnerEngine + component fixture with Angular TestBed.
// ---------------------------------------------------------------------------

import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideMonacoEditor } from 'ngx-monaco-editor-v2';
import { CorridorRunnerComponent, CREW_STEP_MS } from './corridor-runner.component';
import { CorridorRunnerEngine } from './corridor-runner.engine';
import { CorridorRunnerMapComponent } from './map/map';
import { MINIGAME_ENGINE } from '../../../core/minigame/minigame-engine.tokens';
import { DifficultyTier, type MinigameLevel } from '../../../core/minigame/minigame.types';
import type {
  CorridorRunnerLevelData,
  MapNode,
  MapEdge,
  MapLayout,
  RouteEntry,
  TestNavigation,
  TargetDestination,
} from './corridor-runner.types';

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
): MinigameLevel<CorridorRunnerLevelData> {
  return {
    id: 'cr-test-01',
    gameId: 'corridor-runner',
    tier: DifficultyTier.Basic,
    conceptIntroduced: 'Basic routing',
    description: 'Test level',
    data,
  };
}

function setupFixture(levelData?: CorridorRunnerLevelData): {
  engine: CorridorRunnerEngine;
  fixture: ComponentFixture<CorridorRunnerComponent>;
  component: CorridorRunnerComponent;
} {
  const engine = new CorridorRunnerEngine();
  engine.initialize(createLevel(levelData ?? createTestLevelData()));
  engine.start();

  TestBed.configureTestingModule({
    imports: [CorridorRunnerComponent],
    providers: [
      provideMonacoEditor(),
      { provide: MINIGAME_ENGINE, useValue: engine },
    ],
  });

  const fixture = TestBed.createComponent(CorridorRunnerComponent);
  const component = fixture.componentInstance;
  fixture.detectChanges();

  return { engine, fixture, component };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Corridor Runner Visual State Integration', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  // =========================================================================
  // 1. Config phase: route editor visible, map dimmed/hidden
  // =========================================================================
  it('config phase -- route editor visible, map not expanded', () => {
    const { fixture, component } = setupFixture();

    expect(component.phase()).toBe('config');

    // Route editor is rendered
    const editorEl = fixture.nativeElement.querySelector('app-corridor-runner-route-editor');
    expect(editorEl).toBeTruthy();

    // Map exists but not expanded
    const mapDebug = fixture.debugElement.query(By.directive(CorridorRunnerMapComponent));
    const mapChild = mapDebug.componentInstance as CorridorRunnerMapComponent;
    expect(mapChild.expanded()).toBe(false);

    fixture.destroy();
  });

  // =========================================================================
  // 2. set-route-config action updates map corridor glow state
  // =========================================================================
  it('set-route-config action updates map corridor glow state', () => {
    const { engine, fixture } = setupFixture();

    // Initially no corridors lit
    let litCorridors = fixture.nativeElement.querySelectorAll('.cr-map__corridor--lit');
    expect(litCorridors.length).toBe(0);

    // Configure a route with component matching "EngineeringBay" node label
    engine.submitAction({
      type: 'set-route-config',
      routes: [{ path: 'engineering', component: 'EngineeringBay' }],
    });
    fixture.detectChanges();

    // The corridor connecting to EngineeringBay should be lit
    litCorridors = fixture.nativeElement.querySelectorAll('.cr-map__corridor--lit');
    expect(litCorridors.length).toBeGreaterThan(0);

    fixture.destroy();
  });

  // =========================================================================
  // 3. Run phase: crew member position updates along corridor path
  // =========================================================================
  it('run phase -- crew member position updates along corridor path', () => {
    vi.useFakeTimers();
    const { fixture, component } = setupFixture();

    // Set correct routes and switch to run phase
    component.onConfigChanged([{ path: 'engineering', component: 'EngineeringBay' }]);
    component.onConfigSubmitted();
    component.onRunTest();
    fixture.detectChanges();

    // Crew sprite should be visible in the DOM
    const crewDot = fixture.nativeElement.querySelector('.cr-map__crew-dot');
    expect(crewDot).toBeTruthy();

    // Crew starts at step 0
    expect(component.crewStep()).toBe(0);

    // After one step interval, crew advances
    vi.advanceTimersByTime(CREW_STEP_MS);
    fixture.detectChanges();

    expect(component.crewStep()).toBe(1);

    fixture.destroy();
  });

  // =========================================================================
  // 4. Hull breach: decompression animation state set on map
  // =========================================================================
  it('hull breach -- decompression animation state set on map', () => {
    vi.useFakeTimers();
    const { fixture, component } = setupFixture(
      createTestLevelData({
        testNavigations: [
          { url: '/unknown', expectedDestination: 'SomeBay', description: 'Fails' },
        ],
      }),
    );

    // No routes configured -- any URL is a hull breach
    component.onConfigChanged([]);
    component.onConfigSubmitted();
    component.onRunTest();
    fixture.detectChanges();

    // Crew should be in hull breach state
    expect(component.crewIsHullBreach()).toBe(true);

    // Advance to animation complete
    const pathLen = component.animatingCrew()!.path.length;
    vi.advanceTimersByTime(pathLen * CREW_STEP_MS + 1);
    fixture.detectChanges();

    // DOM should have hull breach CSS class
    const crewGroup = fixture.nativeElement.querySelector('.cr-map__crew--hull-breach');
    expect(crewGroup).toBeTruthy();

    fixture.destroy();
  });

  // =========================================================================
  // 5. Successful arrival: door open animation state set on target module
  // =========================================================================
  it('successful arrival -- success animation state set on target module', () => {
    vi.useFakeTimers();
    const { fixture, component } = setupFixture();

    component.onConfigChanged([{ path: 'engineering', component: 'EngineeringBay' }]);
    component.onConfigSubmitted();
    component.onRunTest();
    fixture.detectChanges();

    // Fast forward past all animation steps
    const pathLen = component.animatingCrew()!.path.length;
    vi.advanceTimersByTime(pathLen * CREW_STEP_MS + 1);
    fixture.detectChanges();

    // Crew should be in success state
    expect(component.crewIsSuccess()).toBe(true);
    expect(component.crewAnimationComplete()).toBe(true);

    // DOM should have success CSS class
    const crewGroup = fixture.nativeElement.querySelector('.cr-map__crew--success');
    expect(crewGroup).toBeTruthy();

    fixture.destroy();
  });

  // =========================================================================
  // 6. Each test verifies DOM state reflects engine signal values after action
  // =========================================================================
  it('DOM state reflects engine signal values after set-route-config action', () => {
    const { engine, fixture } = setupFixture();

    // Before action: no corridors lit
    let mapDebug = fixture.debugElement.query(By.directive(CorridorRunnerMapComponent));
    let mapChild = mapDebug.componentInstance as CorridorRunnerMapComponent;
    const initialGlowCount = [...mapChild.corridorGlowMap().values()].filter(Boolean).length;
    expect(initialGlowCount).toBe(0);

    // Perform action
    engine.submitAction({
      type: 'set-route-config',
      routes: [{ path: 'engineering', component: 'EngineeringBay' }],
    });
    fixture.detectChanges();

    // After action: corridors lit
    mapDebug = fixture.debugElement.query(By.directive(CorridorRunnerMapComponent));
    mapChild = mapDebug.componentInstance as CorridorRunnerMapComponent;
    const afterGlowCount = [...mapChild.corridorGlowMap().values()].filter(Boolean).length;
    expect(afterGlowCount).toBeGreaterThan(0);

    fixture.destroy();
  });
});
