import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { WireDrawService } from '../../../core/minigame/wire-draw.service';
import { createComponent } from '../../../../testing/test-utils';
import {
  SvgWireRendererComponent,
  WireDescriptor,
} from './svg-wire-renderer';

@Component({
  template: `<nx-svg-wire-renderer [wires]="wires" />`,
  imports: [SvgWireRendererComponent],
})
class TestHost {
  wires: WireDescriptor[] = [];
}

function wire(overrides: Partial<WireDescriptor> = {}): WireDescriptor {
  return {
    id: 'w1',
    startX: 10,
    startY: 20,
    endX: 90,
    endY: 80,
    color: '#3B82F6',
    animated: false,
    ...overrides,
  };
}

describe('SvgWireRendererComponent', () => {
  async function setup(overrides: Partial<TestHost> = {}) {
    const { fixture, component, element } = await createComponent(TestHost, {
      detectChanges: false,
    });
    Object.assign(fixture.componentInstance, overrides);
    fixture.detectChanges();
    await fixture.whenStable();
    return { fixture, component, element };
  }

  // --- Rendering (4 tests) ---

  it('creates the component', async () => {
    const { element } = await setup();
    expect(element.querySelector('nx-svg-wire-renderer')).toBeTruthy();
  });

  it('renders an SVG element with aria-hidden', async () => {
    const { element } = await setup({ wires: [wire()] });
    const svg = element.querySelector('nx-svg-wire-renderer svg');
    expect(svg).toBeTruthy();
    expect(svg!.getAttribute('aria-hidden')).toBe('true');
  });

  it('renders a path for each wire', async () => {
    const { element } = await setup({
      wires: [wire({ id: 'w1' }), wire({ id: 'w2' })],
    });
    const paths = element.querySelectorAll('.svg-wire__path');
    expect(paths.length).toBe(2);
  });

  it('renders correct bezier path d attribute', async () => {
    const { element } = await setup({
      wires: [
        wire({ startX: 10, startY: 20, endX: 90, endY: 80 }),
      ],
    });
    const path = element.querySelector('.svg-wire__path');
    expect(path).toBeTruthy();
    expect(path!.getAttribute('d')).toBe('M 10 20 C 42 20, 58 80, 90 80');
  });

  // --- Color application (2 tests) ---

  it('applies wire color as stroke', async () => {
    const { element } = await setup({
      wires: [wire({ color: '#EF4444' })],
    });
    const path = element.querySelector('.svg-wire__path');
    expect(path!.getAttribute('stroke')).toBe('#EF4444');
  });

  it('each wire uses its own color', async () => {
    const { element } = await setup({
      wires: [
        wire({ id: 'w1', color: '#EF4444' }),
        wire({ id: 'w2', color: '#22C55E' }),
      ],
    });
    const paths = element.querySelectorAll('.svg-wire__path');
    expect(paths[0].getAttribute('stroke')).toBe('#EF4444');
    expect(paths[1].getAttribute('stroke')).toBe('#22C55E');
  });

  // --- Animation (3 tests) ---

  it('renders flow overlay when animated is true', async () => {
    const { element } = await setup({
      wires: [wire({ animated: true })],
    });
    const flow = element.querySelector('.svg-wire__flow');
    expect(flow).toBeTruthy();
  });

  it('does not render flow overlay when animated is false', async () => {
    const { element } = await setup({
      wires: [wire({ animated: false })],
    });
    const flow = element.querySelector('.svg-wire__flow');
    expect(flow).toBeNull();
  });

  it('flow overlay has stroke-dasharray', async () => {
    const { element } = await setup({
      wires: [wire({ animated: true })],
    });
    const flow = element.querySelector('.svg-wire__flow');
    expect(flow!.getAttribute('stroke-dasharray')).toBe('8 12');
  });

  // --- Dynamic updates (2 tests) ---

  it('adding a wire renders a new path', async () => {
    const { fixture, element } = await setup({
      wires: [wire({ id: 'w1' })],
    });

    expect(element.querySelectorAll('.svg-wire__path').length).toBe(1);

    fixture.componentInstance.wires = [
      wire({ id: 'w1' }),
      wire({ id: 'w2' }),
    ];
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();

    expect(element.querySelectorAll('.svg-wire__path').length).toBe(2);
  });

  it('removing a wire removes its path', async () => {
    const { fixture, element } = await setup({
      wires: [wire({ id: 'w1' }), wire({ id: 'w2' })],
    });

    expect(element.querySelectorAll('.svg-wire__path').length).toBe(2);

    fixture.componentInstance.wires = [wire({ id: 'w1' })];
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();

    expect(element.querySelectorAll('.svg-wire__path').length).toBe(1);
  });

  // --- Empty state (1 test) ---

  it('renders no paths when wires is empty', async () => {
    const { element } = await setup({ wires: [] });
    const paths = element.querySelectorAll('.svg-wire__path');
    expect(paths.length).toBe(0);
  });

  // --- WireDrawService integration (6 tests) ---

  describe('WireDrawService integration', () => {
    let service: WireDrawService;

    async function setupWithService(overrides: Partial<TestHost> = {}) {
      const result = await setup(overrides);
      service = TestBed.inject(WireDrawService);
      return result;
    }

    afterEach(() => {
      service?.reset();
    });

    it('renders wires from WireDrawService connections', async () => {
      const { fixture, element } = await setupWithService();

      service.registerPort({ id: 'src-1', type: 'source', x: 10, y: 20 });
      service.registerPort({ id: 'tgt-1', type: 'target', x: 200, y: 300 });
      service.startWire('src-1');
      service.completeWire('tgt-1');

      fixture.detectChanges();
      await fixture.whenStable();

      const paths = element.querySelectorAll('.svg-wire__path');
      expect(paths.length).toBe(1);
    });

    it('renders preview wire during drawing phase', async () => {
      const { fixture, element } = await setupWithService();

      service.registerPort({ id: 'src-1', type: 'source', x: 10, y: 20 });
      service.startWire('src-1');
      service.updatePointer({ x: 200, y: 300 });

      fixture.detectChanges();
      await fixture.whenStable();

      const preview = element.querySelector('.svg-wire__preview');
      expect(preview).toBeTruthy();
    });

    it('preview wire disappears when drawing is cancelled', async () => {
      const { fixture, element } = await setupWithService();

      service.registerPort({ id: 'src-1', type: 'source', x: 10, y: 20 });
      service.startWire('src-1');
      service.updatePointer({ x: 200, y: 300 });

      fixture.detectChanges();
      await fixture.whenStable();
      expect(element.querySelector('.svg-wire__preview')).toBeTruthy();

      service.cancelWire();
      fixture.detectChanges();
      await fixture.whenStable();
      expect(element.querySelector('.svg-wire__preview')).toBeNull();
    });

    it('removing a connection reactively removes the wire', async () => {
      const { fixture, element } = await setupWithService();

      service.registerPort({ id: 'src-1', type: 'source', x: 10, y: 20 });
      service.registerPort({ id: 'tgt-1', type: 'target', x: 200, y: 300 });
      service.startWire('src-1');
      service.completeWire('tgt-1');

      fixture.detectChanges();
      await fixture.whenStable();
      expect(element.querySelectorAll('.svg-wire__path').length).toBe(1);

      service.removeConnection('src-1--tgt-1');
      fixture.detectChanges();
      await fixture.whenStable();
      expect(element.querySelectorAll('.svg-wire__path').length).toBe(0);
    });

    it('merges service wires with input wires', async () => {
      const { fixture, element } = await setupWithService({
        wires: [wire({ id: 'manual-1' })],
      });

      service.registerPort({ id: 'src-1', type: 'source', x: 10, y: 20 });
      service.registerPort({ id: 'tgt-1', type: 'target', x: 200, y: 300 });
      service.startWire('src-1');
      service.completeWire('tgt-1');

      fixture.detectChanges();
      await fixture.whenStable();

      const paths = element.querySelectorAll('.svg-wire__path');
      expect(paths.length).toBe(2);
    });

    it('falls back to input-only when no service', async () => {
      const { fixture, element } = await createComponent(TestHost, {
        detectChanges: false,
        providers: [{ provide: WireDrawService, useValue: null }],
      });
      fixture.componentInstance.wires = [wire({ id: 'w1' })];
      fixture.detectChanges();
      await fixture.whenStable();

      const paths = element.querySelectorAll('.svg-wire__path');
      expect(paths.length).toBe(1);
    });
  });
});
