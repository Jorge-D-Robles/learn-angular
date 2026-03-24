import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { createComponent } from '../../../../../testing/test-utils';
import { DragDropService } from '../../../../core/minigame/drag-drop.service';
import type {
  ReactorNodeType,
  RuntimeReactorNode,
  RuntimeSignalNode,
  RuntimeComputedNode,
  RuntimeEffectNode,
  GraphEdge,
} from '../reactor-core.types';
import { ReactorCoreGraphCanvasComponent, EXTENDED_NODE_COLORS } from './graph-canvas';

// ---------------------------------------------------------------------------
// Test data factories
// ---------------------------------------------------------------------------

function createSignalNode(overrides?: Partial<RuntimeSignalNode>): RuntimeSignalNode {
  return {
    id: 'sig-1',
    type: 'signal',
    label: 'count',
    initialValue: 0,
    currentValue: 0,
    position: { x: 100, y: 100 },
    ...overrides,
  };
}

function createComputedNode(overrides?: Partial<RuntimeComputedNode>): RuntimeComputedNode {
  return {
    id: 'comp-1',
    type: 'computed',
    label: 'doubled',
    computationExpr: 'count * 2',
    dependencyIds: ['sig-1'],
    currentValue: 0,
    position: { x: 400, y: 100 },
    ...overrides,
  };
}

function createEffectNode(overrides?: Partial<RuntimeEffectNode>): RuntimeEffectNode {
  return {
    id: 'eff-1',
    type: 'effect',
    label: 'logEffect',
    actionDescription: 'console.log',
    dependencyIds: ['comp-1'],
    position: { x: 700, y: 100 },
    cleanupFn: null,
    ...overrides,
  };
}

function buildNodesMap(nodes: RuntimeReactorNode[]): Map<string, RuntimeReactorNode> {
  return new Map(nodes.map(n => [n.id, n]));
}

// ---------------------------------------------------------------------------
// Test host
// ---------------------------------------------------------------------------

@Component({
  template: `
    <app-reactor-core-graph-canvas
      [nodes]="nodes()"
      [edges]="edges()"
      [toolboxItems]="toolboxItems()"
      [simulating]="simulating()"
      [selectedNodeId]="selectedNodeId()"
      (nodeAdded)="onNodeAdded($event)"
      (nodeMoved)="onNodeMoved($event)"
      (edgeAdded)="onEdgeAdded($event)"
      (edgeRemoved)="onEdgeRemoved($event)"
      (nodeSelected)="onNodeSelected($event)"
    />
  `,
  imports: [ReactorCoreGraphCanvasComponent],
})
class TestHost {
  nodes = signal<Map<string, RuntimeReactorNode>>(new Map());
  edges = signal<readonly GraphEdge[]>([]);
  toolboxItems = signal<readonly ReactorNodeType[]>([]);
  simulating = signal(false);
  selectedNodeId = signal<string | null>(null);
  onNodeAdded = vi.fn();
  onNodeMoved = vi.fn();
  onEdgeAdded = vi.fn();
  onEdgeRemoved = vi.fn();
  onNodeSelected = vi.fn();
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ReactorCoreGraphCanvasComponent', () => {
  async function setup(overrides: {
    nodes?: Map<string, RuntimeReactorNode>;
    edges?: readonly GraphEdge[];
    toolboxItems?: readonly ReactorNodeType[];
    simulating?: boolean;
    selectedNodeId?: string | null;
  } = {}) {
    const { fixture, element } = await createComponent(TestHost, {
      detectChanges: false,
    });

    const host = fixture.componentInstance;
    if (overrides.nodes) host.nodes.set(overrides.nodes);
    if (overrides.edges) host.edges.set(overrides.edges);
    if (overrides.toolboxItems) host.toolboxItems.set(overrides.toolboxItems);
    if (overrides.simulating !== undefined) host.simulating.set(overrides.simulating);
    if (overrides.selectedNodeId !== undefined) host.selectedNodeId.set(overrides.selectedNodeId);

    fixture.detectChanges();
    await fixture.whenStable();
    return { fixture, host, element };
  }

  function getCanvas(el: HTMLElement): HTMLElement {
    return el.querySelector('app-reactor-core-graph-canvas') as HTMLElement;
  }

  function getNodeGroups(el: HTMLElement): NodeListOf<Element> {
    return el.querySelectorAll('.graph-canvas__node');
  }

  function getNodeBgs(el: HTMLElement): NodeListOf<Element> {
    return el.querySelectorAll('.graph-canvas__node-bg');
  }

  function getWirePaths(el: HTMLElement): NodeListOf<Element> {
    return el.querySelectorAll('.graph-canvas__wire');
  }

  function getFlowPaths(el: HTMLElement): NodeListOf<Element> {
    return el.querySelectorAll('.graph-canvas__flow');
  }

  function getSourcePorts(el: HTMLElement): NodeListOf<Element> {
    return el.querySelectorAll('[nx-svg-port][data-port-type="source"]');
  }

  function getTargetPorts(el: HTMLElement): NodeListOf<Element> {
    return el.querySelectorAll('[nx-svg-port][data-port-type="target"]');
  }

  function getSelectionRings(el: HTMLElement): NodeListOf<Element> {
    return el.querySelectorAll('.graph-canvas__selection-ring');
  }

  function getGridRect(el: HTMLElement): Element | null {
    return el.querySelector('.graph-canvas__grid');
  }

  // 1. Creation
  it('should create the component with default empty inputs', async () => {
    const { element } = await setup();
    expect(getCanvas(element)).toBeTruthy();
  });

  // 2. Node rendering count
  it('should render SVG node groups matching input node count', async () => {
    const nodes = buildNodesMap([
      createSignalNode({ id: 'sig-1' }),
      createComputedNode({ id: 'comp-1' }),
      createEffectNode({ id: 'eff-1' }),
    ]);
    const { element } = await setup({ nodes });
    expect(getNodeGroups(element).length).toBe(3);
  });

  // 3. Node type colors
  it('should apply correct fill color per node type', async () => {
    const nodes = buildNodesMap([
      createSignalNode({ id: 'sig-1' }),
      createComputedNode({ id: 'comp-1' }),
      createEffectNode({ id: 'eff-1' }),
    ]);
    const { element } = await setup({ nodes });
    const bgs = getNodeBgs(element);

    expect(bgs[0].getAttribute('fill')).toBe('#3B82F6');
    expect(bgs[1].getAttribute('fill')).toBe('#22C55E');
    expect(bgs[2].getAttribute('fill')).toBe('#F97316');
  });

  // 4. Node position
  it('should render node at correct transform position', async () => {
    const nodes = buildNodesMap([
      createSignalNode({ id: 'sig-1', position: { x: 200, y: 300 } }),
    ]);
    const { element } = await setup({ nodes });
    const nodeGroup = getNodeGroups(element)[0];
    expect(nodeGroup.getAttribute('transform')).toContain('200');
    expect(nodeGroup.getAttribute('transform')).toContain('300');
  });

  // 5. Node label display
  it('should display node label text', async () => {
    const nodes = buildNodesMap([
      createSignalNode({ id: 'sig-1', label: 'mySignal' }),
    ]);
    const { element } = await setup({ nodes });
    const label = element.querySelector('.graph-canvas__node-label');
    expect(label?.textContent?.trim()).toBe('mySignal');
  });

  // 6. Node value display
  it('should display currentValue for signal/computed nodes but not effect', async () => {
    const nodes = buildNodesMap([
      createSignalNode({ id: 'sig-1', currentValue: 42 }),
      createComputedNode({ id: 'comp-1', currentValue: 84 }),
      createEffectNode({ id: 'eff-1' }),
    ]);
    const { element } = await setup({ nodes });
    const values = element.querySelectorAll('.graph-canvas__node-value');
    // Signal and computed show values; effect does not
    expect(values.length).toBe(2);
    expect(values[0].textContent?.trim()).toBe('42');
    expect(values[1].textContent?.trim()).toBe('84');
  });

  // 7. Source port rendering
  it('should render a source port for each node', async () => {
    const nodes = buildNodesMap([
      createSignalNode({ id: 'sig-1' }),
      createComputedNode({ id: 'comp-1' }),
    ]);
    const { element } = await setup({ nodes });
    expect(getSourcePorts(element).length).toBe(2);
  });

  // 8. Target port rendering
  it('should render target port only for non-signal nodes', async () => {
    const nodes = buildNodesMap([
      createSignalNode({ id: 'sig-1' }),
      createComputedNode({ id: 'comp-1' }),
      createEffectNode({ id: 'eff-1' }),
    ]);
    const { element } = await setup({ nodes });
    // Signal has no target port, computed and effect do
    expect(getTargetPorts(element).length).toBe(2);
  });

  // 9. Wire rendering
  it('should render a path element for each edge', async () => {
    const sig = createSignalNode({ id: 'sig-1' });
    const comp = createComputedNode({ id: 'comp-1' });
    const eff = createEffectNode({ id: 'eff-1' });
    const nodes = buildNodesMap([sig, comp, eff]);
    const edges: GraphEdge[] = [
      { sourceId: 'sig-1', targetId: 'comp-1' },
      { sourceId: 'comp-1', targetId: 'eff-1' },
    ];
    const { element } = await setup({ nodes, edges });
    expect(getWirePaths(element).length).toBe(2);
  });

  // 10. Wire arrow markers
  it('should apply marker-end to wire paths', async () => {
    const sig = createSignalNode({ id: 'sig-1' });
    const comp = createComputedNode({ id: 'comp-1' });
    const nodes = buildNodesMap([sig, comp]);
    const edges: GraphEdge[] = [{ sourceId: 'sig-1', targetId: 'comp-1' }];
    const { element } = await setup({ nodes, edges });
    const wire = getWirePaths(element)[0];
    expect(wire.getAttribute('marker-end')).toContain('arrowhead');
  });

  // 11. Wire color
  it('should color wire based on source node type', async () => {
    const sig = createSignalNode({ id: 'sig-1' });
    const comp = createComputedNode({ id: 'comp-1' });
    const nodes = buildNodesMap([sig, comp]);
    const edges: GraphEdge[] = [{ sourceId: 'sig-1', targetId: 'comp-1' }];
    const { element } = await setup({ nodes, edges });
    const wire = getWirePaths(element)[0];
    // Signal color is blue
    expect(wire.getAttribute('stroke')).toBe(EXTENDED_NODE_COLORS['signal']);
  });

  // 12. Energy flow animation off
  it('should not render flow paths when simulating is false', async () => {
    const sig = createSignalNode({ id: 'sig-1' });
    const comp = createComputedNode({ id: 'comp-1' });
    const nodes = buildNodesMap([sig, comp]);
    const edges: GraphEdge[] = [{ sourceId: 'sig-1', targetId: 'comp-1' }];
    const { element } = await setup({ nodes, edges, simulating: false });
    expect(getFlowPaths(element).length).toBe(0);
  });

  // 13. Energy flow animation on
  it('should render flow paths for each wire when simulating is true', async () => {
    const sig = createSignalNode({ id: 'sig-1' });
    const comp = createComputedNode({ id: 'comp-1' });
    const nodes = buildNodesMap([sig, comp]);
    const edges: GraphEdge[] = [{ sourceId: 'sig-1', targetId: 'comp-1' }];
    const { element } = await setup({ nodes, edges, simulating: true });
    expect(getFlowPaths(element).length).toBe(1);
  });

  // 14. Node selection
  it('should emit nodeSelected when a node is clicked', async () => {
    const nodes = buildNodesMap([createSignalNode({ id: 'sig-1' })]);
    const { host, element } = await setup({ nodes });
    const nodeGroup = getNodeGroups(element)[0] as SVGGElement;
    nodeGroup.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(host.onNodeSelected).toHaveBeenCalledWith('sig-1');
  });

  // 15. Selection ring
  it('should show selection ring when selectedNodeId matches a node', async () => {
    const nodes = buildNodesMap([
      createSignalNode({ id: 'sig-1' }),
      createComputedNode({ id: 'comp-1' }),
    ]);
    const { element } = await setup({ nodes, selectedNodeId: 'sig-1' });
    expect(getSelectionRings(element).length).toBe(1);
  });

  // 16. Drop zone registration
  it('should register as a drop zone with nx-drop-zone--active class when dragging', async () => {
    const { element, fixture } = await setup();
    const dragDropService = TestBed.inject(DragDropService);

    // Start a drag to trigger active state
    const dummyEl = document.createElement('div');
    dragDropService.startDrag('test', 'signal', dummyEl);

    // Change detection needed for signal-based host binding
    fixture.detectChanges();

    const dropZoneDiv = element.querySelector('.graph-canvas') as HTMLElement;
    expect(dropZoneDiv.classList.contains('nx-drop-zone--active')).toBe(true);

    // Clean up
    dragDropService.cancelDrag();
  });

  // 17. nodeAdded emission (mock mouseToSvg since getScreenCTM returns null in JSDOM)
  it('should emit nodeAdded on canvas drop', async () => {
    const { host, element, fixture } = await setup({
      toolboxItems: ['signal', 'computed', 'effect'],
    });
    const dragDropService = TestBed.inject(DragDropService);

    // The DropZoneDirective registers the zone on ngOnInit but JSDOM's
    // getBoundingClientRect returns all zeros, so hit-testing fails.
    // Re-register with a predicate that always accepts so endDrag resolves.
    dragDropService.registerZone('reactor-canvas', element.querySelector('.graph-canvas') as HTMLElement, () => true);

    // Start a drag, manually set hoveredZone, then end
    const dummyEl = document.createElement('div');
    dragDropService.startDrag('toolbox-signal', 'signal' as ReactorNodeType, dummyEl);
    // Manually trigger hover by navigating to the zone
    dragDropService.navigateKeyboard('next');
    dragDropService.endDrag();

    fixture.detectChanges();
    await fixture.whenStable();

    expect(host.onNodeAdded).toHaveBeenCalled();
    const call = host.onNodeAdded.mock.calls[0][0];
    expect(call.type).toBe('signal');
    expect(call.position).toBeDefined();
  });

  // 18. nodeMoved emission
  it('should emit nodeMoved after pointer drag on a placed node', async () => {
    const sig = createSignalNode({ id: 'sig-1', position: { x: 100, y: 100 } });
    const nodes = buildNodesMap([sig]);
    const { host, element, fixture } = await setup({ nodes });

    const nodeGroup = getNodeGroups(element)[0] as SVGGElement;

    // Start drag via pointerdown
    const downEvent = new PointerEvent('pointerdown', {
      bubbles: true,
      clientX: 110,
      clientY: 110,
      pointerId: 1,
    });
    nodeGroup.dispatchEvent(downEvent);
    fixture.detectChanges();

    // End drag via pointerup on the SVG
    const svg = element.querySelector('.graph-canvas__svg') as SVGSVGElement;
    const upEvent = new PointerEvent('pointerup', {
      bubbles: true,
      clientX: 200,
      clientY: 200,
      pointerId: 1,
    });
    svg.dispatchEvent(upEvent);
    fixture.detectChanges();

    expect(host.onNodeMoved).toHaveBeenCalled();
    const call = host.onNodeMoved.mock.calls[0][0];
    expect(call.nodeId).toBe('sig-1');
    expect(call.newPosition).toBeDefined();
    // Delta: clientX moved 90px (200-110), clientY moved 90px (200-110)
    // New position: 100+90=190, 100+90=190
    expect(call.newPosition.x).toBe(190);
    expect(call.newPosition.y).toBe(190);
  });

  // 19. Edge right-click removal
  it('should emit edgeRemoved on wire right-click', async () => {
    const sig = createSignalNode({ id: 'sig-1' });
    const comp = createComputedNode({ id: 'comp-1' });
    const nodes = buildNodesMap([sig, comp]);
    const edges: GraphEdge[] = [{ sourceId: 'sig-1', targetId: 'comp-1' }];
    const { host, element } = await setup({ nodes, edges });

    const wire = getWirePaths(element)[0] as SVGPathElement;
    const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
    wire.dispatchEvent(event);

    expect(host.onEdgeRemoved).toHaveBeenCalledWith({
      sourceId: 'sig-1',
      targetId: 'comp-1',
    });
  });

  // 20. Empty state
  it('should render grid background but no nodes or wires when empty', async () => {
    const { element } = await setup();
    expect(getGridRect(element)).toBeTruthy();
    expect(getNodeGroups(element).length).toBe(0);
    expect(getWirePaths(element).length).toBe(0);
  });
});
