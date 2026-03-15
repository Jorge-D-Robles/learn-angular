import { Component } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { CorridorRunnerMapComponent } from './map';
import type {
  MapLayout,
  MapNode,
  MapEdge,
  RouteEntry,
} from '../corridor-runner.types';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function createTestNodes(): MapNode[] {
  return [
    { id: 'entry', label: 'Airlock', position: { x: 10, y: 50 } },
    { id: 'corridor', label: 'Corridor', position: { x: 50, y: 50 } },
    { id: 'dest', label: 'EngineeringBay', position: { x: 90, y: 50 } },
  ];
}

function createTestEdges(): MapEdge[] {
  return [
    { id: 'e-1', sourceNodeId: 'entry', targetNodeId: 'corridor' },
    { id: 'e-2', sourceNodeId: 'corridor', targetNodeId: 'dest' },
  ];
}

function createTestMap(): MapLayout {
  return { nodes: createTestNodes(), edges: createTestEdges() };
}

// ---------------------------------------------------------------------------
// Test host
// ---------------------------------------------------------------------------

@Component({
  template: `<app-corridor-runner-map
    [stationMap]="stationMap"
    [configuredRoutes]="configuredRoutes"
    [crewPath]="crewPath"
    [crewStep]="crewStep"
    [isHullBreach]="isHullBreach"
    [isSuccess]="isSuccess"
    [animationComplete]="animationComplete"
    [expanded]="expanded"
    (moduleClicked)="onModuleClicked($event)" />`,
  imports: [CorridorRunnerMapComponent],
})
class TestHost {
  stationMap: MapLayout = { nodes: [], edges: [] };
  configuredRoutes: readonly RouteEntry[] = [];
  crewPath: readonly string[] = [];
  crewStep = 0;
  isHullBreach = false;
  isSuccess = false;
  animationComplete = false;
  expanded = false;
  onModuleClicked = vi.fn();
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('CorridorRunnerMapComponent', () => {
  let fixture: ComponentFixture<TestHost>;
  let host: TestHost;
  let element: HTMLElement;

  async function setup(overrides: Partial<TestHost> = {}): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [TestHost],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHost);
    host = fixture.componentInstance;
    Object.assign(host, overrides);
    fixture.detectChanges();
    await fixture.whenStable();
    element = fixture.nativeElement as HTMLElement;
  }

  afterEach(() => {
    fixture?.destroy();
  });

  // --- 1. Rendering -- nodes match input count ---

  it('should render module groups matching the number of map nodes', async () => {
    await setup({ stationMap: createTestMap() });
    const modules = element.querySelectorAll('.cr-map__module');
    expect(modules.length).toBe(3);
  });

  // --- 2. Rendering -- edges match input count ---

  it('should render corridor paths matching the number of map edges', async () => {
    await setup({ stationMap: createTestMap() });
    const corridors = element.querySelectorAll('.cr-map__corridor');
    expect(corridors.length).toBe(2);
  });

  // --- 3. Rendering -- node labels displayed ---

  it('should display node labels as text elements', async () => {
    await setup({ stationMap: createTestMap() });
    const labels = element.querySelectorAll('.cr-map__module-label');
    const texts = Array.from(labels).map(l => l.textContent?.trim());
    expect(texts).toContain('Airlock');
    expect(texts).toContain('Corridor');
    expect(texts).toContain('EngineeringBay');
  });

  // --- 4. Rendering -- empty map (0 nodes, 0 edges) ---

  it('should render without crash when map has 0 nodes and 0 edges', async () => {
    await setup({ stationMap: { nodes: [], edges: [] } });
    const modules = element.querySelectorAll('.cr-map__module');
    const corridors = element.querySelectorAll('.cr-map__corridor');
    expect(modules.length).toBe(0);
    expect(corridors.length).toBe(0);
  });

  // --- 5. Rendering -- node positions map percentage to viewBox ---

  it('should position nodes by mapping percentage to viewBox coordinates', async () => {
    await setup({ stationMap: createTestMap() });
    // Node at (10, 50) -> cx=100 (10% of 1000), cy=300 (50% of 600)
    const circles = element.querySelectorAll('.cr-map__module circle');
    const firstCircle = circles[0] as SVGCircleElement;
    expect(firstCircle.getAttribute('cx')).toBe('100');
    expect(firstCircle.getAttribute('cy')).toBe('300');
  });

  // --- 6. Corridor glow -- no routes configured ---

  it('should have no lit corridors when configuredRoutes is empty', async () => {
    await setup({ stationMap: createTestMap(), configuredRoutes: [] });
    const lit = element.querySelectorAll('.cr-map__corridor--lit');
    expect(lit.length).toBe(0);
  });

  // --- 7. Corridor glow -- routes configured matching node labels ---

  it('should light up corridors adjacent to nodes matching route components', async () => {
    await setup({
      stationMap: createTestMap(),
      configuredRoutes: [{ path: 'engineering', component: 'EngineeringBay' }],
    });
    const lit = element.querySelectorAll('.cr-map__corridor--lit');
    expect(lit.length).toBeGreaterThan(0);
  });

  // --- 8. Crew sprite -- hidden when crewPath is empty ---

  it('should not render crew sprite when crewPath is empty', async () => {
    await setup({ stationMap: createTestMap(), crewPath: [] });
    const crew = element.querySelector('.cr-map__crew');
    expect(crew).toBeNull();
  });

  // --- 9. Crew sprite -- visible when crewPath has entries ---

  it('should render crew sprite at the first path node when crewPath has entries and crewStep is 0', async () => {
    await setup({
      stationMap: createTestMap(),
      crewPath: ['entry', 'corridor', 'dest'],
      crewStep: 0,
    });
    const crew = element.querySelector('.cr-map__crew');
    expect(crew).toBeTruthy();

    const dot = element.querySelector('.cr-map__crew-dot') as SVGCircleElement;
    // 'entry' node at (10, 50) -> cx=100, cy=300
    expect(dot.getAttribute('cx')).toBe('100');
    expect(dot.getAttribute('cy')).toBe('300');
  });

  // --- 10. Crew sprite -- position updates with crewStep ---

  it('should move crew sprite to the node at the given crewStep', async () => {
    await setup({
      stationMap: createTestMap(),
      crewPath: ['entry', 'corridor', 'dest'],
      crewStep: 1,
    });

    // Step 1 = 'corridor' at (50,50) -> cx=500, cy=300
    const dot = element.querySelector('.cr-map__crew-dot') as SVGCircleElement;
    expect(dot.getAttribute('cx')).toBe('500');
    expect(dot.getAttribute('cy')).toBe('300');
  });

  // --- 11. Crew sprite -- hull breach class applied ---

  it('should apply hull-breach class when isHullBreach and animationComplete are true', async () => {
    await setup({
      stationMap: createTestMap(),
      crewPath: ['entry'],
      crewStep: 0,
      isHullBreach: true,
      animationComplete: true,
    });

    const crew = element.querySelector('.cr-map__crew');
    expect(crew?.classList.contains('cr-map__crew--hull-breach')).toBe(true);
  });

  // --- 12. Crew sprite -- success class applied ---

  it('should apply success class when isSuccess and animationComplete are true', async () => {
    await setup({
      stationMap: createTestMap(),
      crewPath: ['entry', 'corridor', 'dest'],
      crewStep: 2,
      isSuccess: true,
      animationComplete: true,
    });

    const crew = element.querySelector('.cr-map__crew');
    expect(crew?.classList.contains('cr-map__crew--success')).toBe(true);
  });

  // --- 13. moduleClicked output -- emits nodeId on click ---

  it('should emit moduleClicked with node ID when a module circle is clicked', async () => {
    await setup({ stationMap: createTestMap() });

    const circles = element.querySelectorAll('.cr-map__module circle');
    const firstCircle = circles[0] as SVGCircleElement;
    firstCircle.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();

    expect(host.onModuleClicked).toHaveBeenCalledWith('entry');
  });

  // --- 14. Expanded mode -- applies full-width class ---

  it('should apply cr-map__svg--full class when expanded is true', async () => {
    await setup({ stationMap: createTestMap(), expanded: true });
    const svg = element.querySelector('.cr-map__svg');
    expect(svg?.classList.contains('cr-map__svg--full')).toBe(true);
  });

  // --- 15. Edge case -- crewStep beyond path length ---

  it('should clamp crewStep to last waypoint when it exceeds path length', async () => {
    await setup({
      stationMap: createTestMap(),
      crewPath: ['entry', 'corridor', 'dest'],
      crewStep: 10, // way beyond path length of 3
    });

    const dot = element.querySelector('.cr-map__crew-dot') as SVGCircleElement;
    // Clamped to last node: 'dest' at (90, 50) -> cx=900, cy=300
    expect(dot.getAttribute('cx')).toBe('900');
    expect(dot.getAttribute('cy')).toBe('300');
  });
});
