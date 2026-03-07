import { Component } from '@angular/core';
import { createComponent } from '../../../testing/test-utils';
import { DropZoneDirective } from './drop-zone.directive';
import { DragDropService } from '../../core/minigame/drag-drop.service';
import { vi } from 'vitest';

@Component({
  template: `
    <div
      [nxDropZone]="zoneId"
      [nxDropZonePredicate]="predicate"
      (nxDropZoneEnter)="onEnter($event)"
      (nxDropZoneLeave)="onLeave()"
      (nxDropZoneDrop)="onDrop($event)"
    >
      Drop here
    </div>
  `,
  imports: [DropZoneDirective],
})
class TestHost {
  zoneId = 'zone-1';
  predicate: (data: unknown) => boolean = () => true;
  onEnter = vi.fn();
  onLeave = vi.fn();
  onDrop = vi.fn();
}

describe('DropZoneDirective', () => {
  let service: DragDropService;

  beforeEach(() => {
    service = new DragDropService();
  });

  async function setup(overrides?: Partial<TestHost>) {
    const result = await createComponent(TestHost, {
      providers: [{ provide: DragDropService, useValue: service }],
      detectChanges: false,
    });
    if (overrides) {
      Object.assign(result.component, overrides);
    }
    result.fixture.detectChanges();
    await result.fixture.whenStable();
    return result;
  }

  it('should register zone with service on init', async () => {
    const registerSpy = vi.spyOn(service, 'registerZone');
    await setup();
    expect(registerSpy).toHaveBeenCalledWith(
      'zone-1',
      expect.any(HTMLElement),
      expect.any(Function),
    );
  });

  it('should unregister zone with service on destroy', async () => {
    const unregisterSpy = vi.spyOn(service, 'unregisterZone');
    const { fixture } = await setup();
    fixture.destroy();
    expect(unregisterSpy).toHaveBeenCalledWith('zone-1');
  });

  it('should apply nx-drop-zone--active class when isDragging is true', async () => {
    const { fixture, element } = await setup();
    const zoneEl = element.querySelector('div') as HTMLElement;
    expect(zoneEl.classList.contains('nx-drop-zone--active')).toBe(false);

    // Start a drag operation
    const srcEl = document.createElement('div');
    service.startDrag('item-1', 'data', srcEl);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(zoneEl.classList.contains('nx-drop-zone--active')).toBe(true);
  });

  it('should apply nx-drop-zone--hover class when this zone is hovered', async () => {
    const { fixture, element } = await setup();
    const zoneEl = element.querySelector('div') as HTMLElement;

    // Start drag and hover over zone
    const srcEl = document.createElement('div');
    service.startDrag('item-1', 'data', srcEl);

    // Mock getBoundingClientRect on the registered element
    // The service registered the actual div element, so we need to
    // set up hit-testing by re-registering with a mock rect
    service.unregisterZone('zone-1');
    const mockEl = document.createElement('div');
    mockEl.getBoundingClientRect = () =>
      ({
        top: 0,
        left: 0,
        right: 200,
        bottom: 200,
        x: 0,
        y: 0,
        width: 200,
        height: 200,
        toJSON: () => ({}),
      }) as DOMRect;
    service.registerZone('zone-1', mockEl, () => true);

    service.updatePosition({ x: 100, y: 100 });
    fixture.detectChanges();
    await fixture.whenStable();

    expect(zoneEl.classList.contains('nx-drop-zone--hover')).toBe(true);
  });

  it('should emit nxDropZoneDrop when lastDropResult matches this zone', async () => {
    const { fixture, component } = await setup();

    // Start drag, set up zone, drop
    const srcEl = document.createElement('div');
    service.startDrag('item-1', 'payload', srcEl);

    // Re-register zone with mock element for hit-testing
    service.unregisterZone('zone-1');
    const mockEl = document.createElement('div');
    mockEl.getBoundingClientRect = () =>
      ({
        top: 0,
        left: 0,
        right: 200,
        bottom: 200,
        x: 0,
        y: 0,
        width: 200,
        height: 200,
        toJSON: () => ({}),
      }) as DOMRect;
    service.registerZone('zone-1', mockEl, () => true);

    service.updatePosition({ x: 50, y: 50 });
    service.endDrag();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.onDrop).toHaveBeenCalledWith(
      expect.objectContaining({
        accepted: true,
        zoneId: 'zone-1',
        data: 'payload',
      }),
    );
  });

  it('should use default predicate (accept all) when none provided', async () => {
    const registerSpy = vi.spyOn(service, 'registerZone');
    await createComponent(
      // Component without predicate input
      (() => {
        @Component({
          template: `<div [nxDropZone]="'zone-default'">Drop here</div>`,
          imports: [DropZoneDirective],
        })
        class NoPredHost {}
        return NoPredHost;
      })(),
      {
        providers: [{ provide: DragDropService, useValue: service }],
      },
    );

    expect(registerSpy).toHaveBeenCalledWith(
      'zone-default',
      expect.any(HTMLElement),
      expect.any(Function),
    );

    // The default predicate should accept everything
    const registeredPredicate = registerSpy.mock.calls[0][2];
    expect(registeredPredicate('anything')).toBe(true);
    expect(registeredPredicate(null)).toBe(true);
  });
});
