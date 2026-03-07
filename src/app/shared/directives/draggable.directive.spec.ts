import { Component } from '@angular/core';
import { createComponent } from '../../../testing/test-utils';
import { DraggableDirective } from './draggable.directive';
import { DragDropService, type DropResult } from '../../core/minigame/drag-drop.service';
import { vi } from 'vitest';

@Component({
  template: `
    <div
      [nxDraggable]="itemId"
      [nxDraggableData]="itemData"
      (nxDragStart)="onDragStart($event)"
      (nxDrag)="onDrag($event)"
      (nxDrop)="onDrop($event)"
      (nxDragCancel)="onDragCancel()"
    >
      Drag me
    </div>
  `,
  imports: [DraggableDirective],
})
class TestHost {
  itemId = 'test-item';
  itemData: unknown = { type: 'widget' };
  onDragStart = vi.fn();
  onDrag = vi.fn();
  onDrop = vi.fn();
  onDragCancel = vi.fn();
}

describe('DraggableDirective', () => {
  let service: DragDropService;

  beforeEach(() => {
    service = new DragDropService();
  });

  async function setup() {
    const result = await createComponent(TestHost, {
      providers: [{ provide: DragDropService, useValue: service }],
    });
    const draggableEl = result.element.querySelector('div') as HTMLElement;
    return { ...result, draggableEl };
  }

  it('should set tabindex=0 and aria-roledescription=draggable on host (no role=button)', async () => {
    const { draggableEl } = await setup();
    expect(draggableEl.getAttribute('tabindex')).toBe('0');
    expect(draggableEl.getAttribute('aria-roledescription')).toBe('draggable');
    expect(draggableEl.getAttribute('role')).toBeNull();
  });

  it('should call service.startDrag on pointerdown and emit nxDragStart', async () => {
    const startSpy = vi.spyOn(service, 'startDrag');
    const { fixture, draggableEl } = await setup();
    const event = new PointerEvent('pointerdown', {
      pointerId: 1,
      clientX: 10,
      clientY: 20,
      bubbles: true,
    });
    // Mock setPointerCapture since jsdom doesn't support it
    draggableEl.setPointerCapture = vi.fn();
    draggableEl.dispatchEvent(event);
    fixture.detectChanges();

    expect(startSpy).toHaveBeenCalledWith(
      'test-item',
      { type: 'widget' },
      draggableEl,
      false,
    );
    expect(fixture.componentInstance.onDragStart).toHaveBeenCalled();
  });

  it('should call service.updatePosition on pointermove and emit nxDrag', async () => {
    const updateSpy = vi.spyOn(service, 'updatePosition');
    const { fixture, draggableEl } = await setup();

    // Start drag first
    draggableEl.setPointerCapture = vi.fn();
    draggableEl.dispatchEvent(
      new PointerEvent('pointerdown', {
        pointerId: 1,
        clientX: 10,
        clientY: 20,
        bubbles: true,
      }),
    );
    fixture.detectChanges();

    // Move pointer
    draggableEl.dispatchEvent(
      new PointerEvent('pointermove', {
        pointerId: 1,
        clientX: 50,
        clientY: 60,
        bubbles: true,
      }),
    );
    fixture.detectChanges();

    expect(updateSpy).toHaveBeenCalledWith({ x: 50, y: 60 });
    expect(fixture.componentInstance.onDrag).toHaveBeenCalled();
  });

  it('should call service.endDrag on pointerup and emit nxDrop when result is non-null', async () => {
    const dropResult: DropResult = {
      accepted: true,
      zoneId: 'zone-1',
      data: { type: 'widget' },
    };
    const endSpy = vi.spyOn(service, 'endDrag').mockReturnValue(dropResult);
    const { fixture, draggableEl } = await setup();

    // Start drag first
    draggableEl.setPointerCapture = vi.fn();
    draggableEl.releasePointerCapture = vi.fn();
    draggableEl.dispatchEvent(
      new PointerEvent('pointerdown', {
        pointerId: 1,
        bubbles: true,
      }),
    );
    fixture.detectChanges();

    // Pointer up
    draggableEl.dispatchEvent(
      new PointerEvent('pointerup', { pointerId: 1, bubbles: true }),
    );
    fixture.detectChanges();

    expect(endSpy).toHaveBeenCalled();
    expect(fixture.componentInstance.onDrop).toHaveBeenCalledWith(dropResult);
  });

  it('should call service.cancelDrag on pointercancel and emit nxDragCancel', async () => {
    const cancelSpy = vi.spyOn(service, 'cancelDrag');
    const { fixture, draggableEl } = await setup();

    // Start drag first
    draggableEl.setPointerCapture = vi.fn();
    draggableEl.releasePointerCapture = vi.fn();
    draggableEl.dispatchEvent(
      new PointerEvent('pointerdown', {
        pointerId: 1,
        bubbles: true,
      }),
    );
    fixture.detectChanges();

    // Pointer cancel
    draggableEl.dispatchEvent(
      new PointerEvent('pointercancel', { pointerId: 1, bubbles: true }),
    );
    fixture.detectChanges();

    expect(cancelSpy).toHaveBeenCalled();
    expect(fixture.componentInstance.onDragCancel).toHaveBeenCalled();
  });

  it('should start keyboard drag on Enter key when not dragging', async () => {
    const startSpy = vi.spyOn(service, 'startDrag');
    const { fixture, draggableEl } = await setup();

    draggableEl.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
    );
    fixture.detectChanges();

    expect(startSpy).toHaveBeenCalledWith(
      'test-item',
      { type: 'widget' },
      draggableEl,
      true,
    );
  });

  it('should navigate zones on arrow keys during keyboard drag', async () => {
    const navSpy = vi.spyOn(service, 'navigateKeyboard');
    const { fixture, draggableEl } = await setup();

    // Start keyboard drag
    draggableEl.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
    );
    fixture.detectChanges();

    // Arrow down -> next
    draggableEl.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }),
    );
    fixture.detectChanges();
    expect(navSpy).toHaveBeenCalledWith('next');

    // Arrow right -> next
    draggableEl.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }),
    );
    fixture.detectChanges();
    expect(navSpy).toHaveBeenCalledWith('next');

    // Arrow up -> prev
    draggableEl.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }),
    );
    fixture.detectChanges();
    expect(navSpy).toHaveBeenCalledWith('prev');

    // Arrow left -> prev
    draggableEl.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }),
    );
    fixture.detectChanges();
    expect(navSpy).toHaveBeenCalledWith('prev');
  });

  it('should cancel drag on Escape key', async () => {
    const cancelSpy = vi.spyOn(service, 'cancelDrag');
    const { fixture, draggableEl } = await setup();

    // Start keyboard drag
    draggableEl.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
    );
    fixture.detectChanges();

    // Escape
    draggableEl.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    );
    fixture.detectChanges();

    expect(cancelSpy).toHaveBeenCalled();
    expect(fixture.componentInstance.onDragCancel).toHaveBeenCalled();
  });

  it('should apply nx-dragging class when this item is being dragged', async () => {
    const { fixture, draggableEl } = await setup();
    expect(draggableEl.classList.contains('nx-dragging')).toBe(false);

    // Start drag
    draggableEl.setPointerCapture = vi.fn();
    draggableEl.dispatchEvent(
      new PointerEvent('pointerdown', {
        pointerId: 1,
        bubbles: true,
      }),
    );
    fixture.detectChanges();

    expect(draggableEl.classList.contains('nx-dragging')).toBe(true);
  });
});
