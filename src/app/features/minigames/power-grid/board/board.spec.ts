import { Component, signal } from '@angular/core';
import { createComponent } from '../../../../../testing/test-utils';
import type { ServiceNode, ComponentNode, PowerConnection } from '../power-grid.types';
import {
  PowerGridBoardComponent,
  SERVICE_X,
  COMPONENT_X,
  type BoardWireDescriptor,
} from './board';

// ---------------------------------------------------------------------------
// Test data factories
// ---------------------------------------------------------------------------

function createServiceNode(overrides?: Partial<ServiceNode>): ServiceNode {
  return {
    id: 'svc-1',
    name: 'AuthService',
    type: 'service',
    providedIn: 'root',
    ...overrides,
  };
}

function createComponentNode(overrides?: Partial<ComponentNode>): ComponentNode {
  return {
    id: 'cmp-1',
    name: 'LoginComponent',
    requiredInjections: ['svc-1'],
    ...overrides,
  };
}

function createWireDescriptor(overrides?: Partial<BoardWireDescriptor>): BoardWireDescriptor {
  return {
    id: 'wire-1',
    connectionId: 'conn-1',
    path: 'M 150 200 C 430 200, 570 200, 850 200',
    color: '#3B82F6',
    cssClass: 'power-grid-board__wire',
    animated: true,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Test host
// ---------------------------------------------------------------------------

@Component({
  template: `
    <app-power-grid-board
      [services]="services()"
      [components]="components()"
      [connections]="connections()"
      [wireDescriptors]="wireDescriptors()"
      [previewColor]="previewColor()"
      [rejectionFlash]="rejectionFlash()"
      (connectionRightClicked)="onConnectionRightClicked($event)"
      (mouseMoved)="onMouseMoved($event)"
    />
  `,
  imports: [PowerGridBoardComponent],
})
class TestHost {
  services = signal<readonly ServiceNode[]>([]);
  components = signal<readonly ComponentNode[]>([]);
  connections = signal<readonly PowerConnection[]>([]);
  wireDescriptors = signal<readonly BoardWireDescriptor[]>([]);
  previewColor = signal('#3B82F6');
  rejectionFlash = signal(false);
  onConnectionRightClicked = vi.fn();
  onMouseMoved = vi.fn();
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('PowerGridBoardComponent', () => {
  async function setup(overrides: {
    services?: readonly ServiceNode[];
    components?: readonly ComponentNode[];
    connections?: readonly PowerConnection[];
    wireDescriptors?: readonly BoardWireDescriptor[];
    previewColor?: string;
    rejectionFlash?: boolean;
  } = {}) {
    const { fixture, element } = await createComponent(TestHost, {
      detectChanges: false,
    });

    const host = fixture.componentInstance;
    if (overrides.services) host.services.set(overrides.services);
    if (overrides.components) host.components.set(overrides.components);
    if (overrides.connections) host.connections.set(overrides.connections);
    if (overrides.wireDescriptors) host.wireDescriptors.set(overrides.wireDescriptors);
    if (overrides.previewColor) host.previewColor.set(overrides.previewColor);
    if (overrides.rejectionFlash !== undefined) host.rejectionFlash.set(overrides.rejectionFlash);

    fixture.detectChanges();
    await fixture.whenStable();
    return { fixture, host, element };
  }

  function getBoard(el: HTMLElement): HTMLElement {
    return el.querySelector('app-power-grid-board') as HTMLElement;
  }

  function getSourcePorts(el: HTMLElement): NodeListOf<Element> {
    return el.querySelectorAll('[nx-svg-port][data-port-type="source"]');
  }

  function getTargetPorts(el: HTMLElement): NodeListOf<Element> {
    return el.querySelectorAll('[nx-svg-port][data-port-type="target"]');
  }

  function getWirePaths(el: HTMLElement): NodeListOf<Element> {
    return el.querySelectorAll('path[pointer-events="stroke"]');
  }

  function getFlowPaths(el: HTMLElement): NodeListOf<Element> {
    return el.querySelectorAll('.power-grid-board__flow');
  }

  function getPanelBgs(el: HTMLElement): NodeListOf<Element> {
    return el.querySelectorAll('.power-grid-board__panel-bg');
  }

  // 1. Creation
  it('should create the component with default empty inputs', async () => {
    const { element } = await setup();
    expect(getBoard(element)).toBeTruthy();
  });

  // 2. Service port rendering
  it('should render source ports matching service count', async () => {
    const { element } = await setup({
      services: [
        createServiceNode({ id: 'svc-1', name: 'AuthService' }),
        createServiceNode({ id: 'svc-2', name: 'DataService' }),
      ],
    });
    expect(getSourcePorts(element).length).toBe(2);
  });

  // 3. Component port rendering
  it('should render target ports matching component count', async () => {
    const { element } = await setup({
      components: [
        createComponentNode({ id: 'cmp-1', name: 'LoginComponent' }),
        createComponentNode({ id: 'cmp-2', name: 'DashboardComponent' }),
      ],
    });
    expect(getTargetPorts(element).length).toBe(2);
  });

  // 4. Service node labels
  it('should render port labels matching service names', async () => {
    const { element } = await setup({
      services: [createServiceNode({ id: 'svc-1', name: 'AuthService' })],
    });
    const port = element.querySelector('[nx-svg-port][data-port-type="source"]') as SVGElement;
    const label = port.querySelector('.svg-port__label');
    expect(label?.textContent?.trim()).toBe('AuthService');
  });

  // 5. Component node labels
  it('should render port labels matching component names', async () => {
    const { element } = await setup({
      components: [createComponentNode({ id: 'cmp-1', name: 'LoginComponent' })],
    });
    const port = element.querySelector('[nx-svg-port][data-port-type="target"]') as SVGElement;
    const label = port.querySelector('.svg-port__label');
    expect(label?.textContent?.trim()).toBe('LoginComponent');
  });

  // 6. Service position computation
  it('should distribute services evenly on left side at SERVICE_X', async () => {
    const { element } = await setup({
      services: [
        createServiceNode({ id: 'svc-1' }),
        createServiceNode({ id: 'svc-2' }),
      ],
    });
    const ports = getSourcePorts(element);
    // With 2 services in 600 height: y = 200, y = 400
    const port1 = ports[0] as SVGGElement;
    const port2 = ports[1] as SVGGElement;
    expect(port1.getAttribute('transform')).toContain(`${SERVICE_X}`);
    expect(port2.getAttribute('transform')).toContain(`${SERVICE_X}`);
    expect(port1.getAttribute('transform')).toContain('200');
    expect(port2.getAttribute('transform')).toContain('400');
  });

  // 7. Component position computation
  it('should distribute components evenly on right side at COMPONENT_X', async () => {
    const { element } = await setup({
      components: [
        createComponentNode({ id: 'cmp-1' }),
        createComponentNode({ id: 'cmp-2' }),
      ],
    });
    const ports = getTargetPorts(element);
    const port1 = ports[0] as SVGGElement;
    const port2 = ports[1] as SVGGElement;
    expect(port1.getAttribute('transform')).toContain(`${COMPONENT_X}`);
    expect(port2.getAttribute('transform')).toContain(`${COMPONENT_X}`);
    expect(port1.getAttribute('transform')).toContain('200');
    expect(port2.getAttribute('transform')).toContain('400');
  });

  // 8. Wire rendering
  it('should render a path element for each wire descriptor', async () => {
    const { element } = await setup({
      wireDescriptors: [createWireDescriptor()],
    });
    const paths = getWirePaths(element);
    expect(paths.length).toBe(1);
  });

  // 9. Wire color mapping
  it('should apply wire color to path stroke', async () => {
    const { element } = await setup({
      wireDescriptors: [createWireDescriptor({ color: '#22C55E' })],
    });
    const path = getWirePaths(element)[0] as SVGPathElement;
    expect(path.getAttribute('stroke')).toBe('#22C55E');
  });

  // 10. Wire CSS class
  it('should apply wire CSS class to path', async () => {
    const { element } = await setup({
      wireDescriptors: [createWireDescriptor({ cssClass: 'power-grid-board__wire--correct' })],
    });
    const path = getWirePaths(element)[0] as SVGPathElement;
    expect(path.classList.contains('power-grid-board__wire--correct')).toBe(true);
  });

  // 11. Flow animation for animated wires
  it('should render a flow path for animated wires', async () => {
    const { element } = await setup({
      wireDescriptors: [createWireDescriptor({ animated: true })],
    });
    expect(getFlowPaths(element).length).toBe(1);
  });

  // 12. Non-animated wires should not render flow path
  it('should not render a flow path for non-animated wires', async () => {
    const { element } = await setup({
      wireDescriptors: [createWireDescriptor({ animated: false })],
    });
    expect(getFlowPaths(element).length).toBe(0);
  });

  // 13. Connection right-click
  it('should emit connectionRightClicked on wire right-click', async () => {
    const { host, element } = await setup({
      wireDescriptors: [createWireDescriptor({ connectionId: 'conn-42' })],
    });
    const path = getWirePaths(element)[0] as SVGPathElement;
    const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
    path.dispatchEvent(event);

    expect(host.onConnectionRightClicked).toHaveBeenCalledWith('conn-42');
  });

  // 14. Context menu prevention
  it('should prevent default on wire right-click', async () => {
    const { element } = await setup({
      wireDescriptors: [createWireDescriptor()],
    });
    const path = getWirePaths(element)[0] as SVGPathElement;
    const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
    const preventSpy = vi.spyOn(event, 'preventDefault');
    path.dispatchEvent(event);

    expect(preventSpy).toHaveBeenCalled();
  });

  // 15. Rejection flash
  it('should add --rejection CSS class when rejectionFlash is true', async () => {
    const { element } = await setup({ rejectionFlash: true });
    const board = element.querySelector('.power-grid-board') as HTMLElement;
    expect(board.classList.contains('power-grid-board--rejection')).toBe(true);
  });

  // 16. No rejection flash by default
  it('should not have --rejection CSS class by default', async () => {
    const { element } = await setup();
    const board = element.querySelector('.power-grid-board') as HTMLElement;
    expect(board.classList.contains('power-grid-board--rejection')).toBe(false);
  });

  // 17. Empty services
  it('should render 0 source ports when no services provided', async () => {
    const { element } = await setup({ services: [] });
    expect(getSourcePorts(element).length).toBe(0);
  });

  // 18. Empty components
  it('should render 0 target ports when no components provided', async () => {
    const { element } = await setup({ components: [] });
    expect(getTargetPorts(element).length).toBe(0);
  });

  // 19. Empty wires
  it('should render 0 wire paths when no wire descriptors provided', async () => {
    const { element } = await setup({ wireDescriptors: [] });
    expect(getWirePaths(element).length).toBe(0);
  });

  // 20. Panel backgrounds
  it('should render two panel background rects', async () => {
    const { element } = await setup();
    const panels = getPanelBgs(element);
    expect(panels.length).toBe(2);
  });
});
