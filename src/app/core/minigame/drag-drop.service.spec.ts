import { DragDropService } from './drag-drop.service';

/** Creates a mock HTMLElement with a controlled bounding rect. */
function mockElement(rect: Partial<DOMRect> = {}): HTMLElement {
  const el = document.createElement('div');
  el.getBoundingClientRect = () =>
    ({
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      top: 0,
      right: 100,
      bottom: 100,
      left: 0,
      ...rect,
      toJSON: () => ({}),
    }) as DOMRect;
  return el;
}

describe('DragDropService', () => {
  let service: DragDropService;

  beforeEach(() => {
    service = new DragDropService();
  });

  // --- Structural ---

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have correct initial signal values', () => {
    expect(service.isDragging()).toBe(false);
    expect(service.activeItem()).toBeNull();
    expect(service.pointerPosition()).toEqual({ x: 0, y: 0 });
    expect(service.hoveredZoneId()).toBeNull();
    expect(service.keyboardMode()).toBe(false);
    expect(service.lastDropResult()).toBeNull();
  });

  // --- startDrag ---

  describe('startDrag', () => {
    it('should set isDragging to true', () => {
      const el = mockElement();
      service.startDrag('item-1', { type: 'widget' }, el);
      expect(service.isDragging()).toBe(true);
    });

    it('should set activeItem with provided id, data, and sourceElement', () => {
      const el = mockElement();
      const data = { type: 'widget' };
      service.startDrag('item-1', data, el);
      const item = service.activeItem();
      expect(item).not.toBeNull();
      expect(item!.id).toBe('item-1');
      expect(item!.data).toBe(data);
      expect(item!.sourceElement).toBe(el);
    });

    it('should be a no-op if already dragging', () => {
      const el1 = mockElement();
      const el2 = mockElement();
      service.startDrag('item-1', 'data-1', el1);
      service.startDrag('item-2', 'data-2', el2);
      expect(service.activeItem()!.id).toBe('item-1');
    });
  });

  // --- updatePosition ---

  describe('updatePosition', () => {
    it('should update pointerPosition signal', () => {
      const el = mockElement();
      service.startDrag('item-1', null, el);
      service.updatePosition({ x: 150, y: 200 });
      expect(service.pointerPosition()).toEqual({ x: 150, y: 200 });
    });

    it('should update hoveredZoneId when position is over a registered zone', () => {
      const zoneEl = mockElement({
        top: 0,
        left: 0,
        right: 100,
        bottom: 100,
      });
      service.registerZone('zone-a', zoneEl, () => true);
      const el = mockElement();
      service.startDrag('item-1', null, el);
      service.updatePosition({ x: 50, y: 50 });
      expect(service.hoveredZoneId()).toBe('zone-a');
    });

    it('should set hoveredZoneId to null when position is outside all zones', () => {
      const zoneEl = mockElement({
        top: 0,
        left: 0,
        right: 100,
        bottom: 100,
      });
      service.registerZone('zone-a', zoneEl, () => true);
      const el = mockElement();
      service.startDrag('item-1', null, el);
      service.updatePosition({ x: 200, y: 200 });
      expect(service.hoveredZoneId()).toBeNull();
    });

    it('should be a no-op when not dragging', () => {
      service.updatePosition({ x: 100, y: 100 });
      expect(service.pointerPosition()).toEqual({ x: 0, y: 0 });
    });
  });

  // --- endDrag ---

  describe('endDrag', () => {
    it('should return accepted:true when predicate returns true', () => {
      const zoneEl = mockElement({
        top: 0,
        left: 0,
        right: 100,
        bottom: 100,
      });
      service.registerZone('zone-a', zoneEl, () => true);
      const el = mockElement();
      service.startDrag('item-1', 'payload', el);
      service.updatePosition({ x: 50, y: 50 });
      const result = service.endDrag();
      expect(result).not.toBeNull();
      expect(result!.accepted).toBe(true);
      expect(result!.zoneId).toBe('zone-a');
      expect(result!.data).toBe('payload');
    });

    it('should return accepted:false when predicate returns false', () => {
      const zoneEl = mockElement({
        top: 0,
        left: 0,
        right: 100,
        bottom: 100,
      });
      service.registerZone('zone-a', zoneEl, () => false);
      const el = mockElement();
      service.startDrag('item-1', 'payload', el);
      service.updatePosition({ x: 50, y: 50 });
      const result = service.endDrag();
      expect(result).not.toBeNull();
      expect(result!.accepted).toBe(false);
      expect(result!.zoneId).toBe('zone-a');
    });

    it('should return null when no zone is hovered', () => {
      const el = mockElement();
      service.startDrag('item-1', 'payload', el);
      const result = service.endDrag();
      expect(result).toBeNull();
    });

    it('should reset isDragging and activeItem after drop', () => {
      const zoneEl = mockElement({
        top: 0,
        left: 0,
        right: 100,
        bottom: 100,
      });
      service.registerZone('zone-a', zoneEl, () => true);
      const el = mockElement();
      service.startDrag('item-1', 'payload', el);
      service.updatePosition({ x: 50, y: 50 });
      service.endDrag();
      expect(service.isDragging()).toBe(false);
      expect(service.activeItem()).toBeNull();
    });

    it('should set lastDropResult signal on successful drop', () => {
      const zoneEl = mockElement({
        top: 0,
        left: 0,
        right: 100,
        bottom: 100,
      });
      service.registerZone('zone-a', zoneEl, () => true);
      const el = mockElement();
      service.startDrag('item-1', 'payload', el);
      service.updatePosition({ x: 50, y: 50 });
      service.endDrag();
      const lastResult = service.lastDropResult();
      expect(lastResult).not.toBeNull();
      expect(lastResult!.accepted).toBe(true);
      expect(lastResult!.zoneId).toBe('zone-a');
    });

    it('should return null when not dragging', () => {
      const result = service.endDrag();
      expect(result).toBeNull();
    });
  });

  // --- cancelDrag ---

  describe('cancelDrag', () => {
    it('should reset isDragging, activeItem, and pointerPosition', () => {
      const el = mockElement();
      service.startDrag('item-1', null, el);
      service.updatePosition({ x: 100, y: 200 });
      service.cancelDrag();
      expect(service.isDragging()).toBe(false);
      expect(service.activeItem()).toBeNull();
      expect(service.pointerPosition()).toEqual({ x: 0, y: 0 });
      expect(service.hoveredZoneId()).toBeNull();
      expect(service.lastDropResult()).toBeNull();
    });
  });

  // --- registerZone / unregisterZone ---

  describe('registerZone / unregisterZone', () => {
    it('should register a zone and use it for hit-testing', () => {
      const zoneEl = mockElement({
        top: 50,
        left: 50,
        right: 150,
        bottom: 150,
      });
      service.registerZone('zone-b', zoneEl, () => true);
      const el = mockElement();
      service.startDrag('item-1', null, el);
      service.updatePosition({ x: 100, y: 100 });
      expect(service.hoveredZoneId()).toBe('zone-b');
    });

    it('should unregister a zone so it no longer hit-tests', () => {
      const zoneEl = mockElement({
        top: 0,
        left: 0,
        right: 100,
        bottom: 100,
      });
      service.registerZone('zone-a', zoneEl, () => true);
      service.unregisterZone('zone-a');
      const el = mockElement();
      service.startDrag('item-1', null, el);
      service.updatePosition({ x: 50, y: 50 });
      expect(service.hoveredZoneId()).toBeNull();
    });
  });

  // --- navigateKeyboard ---

  describe('navigateKeyboard', () => {
    it('should cycle hoveredZoneId through registered zones on next', () => {
      const zone1 = mockElement({ top: 0, left: 0, right: 100, bottom: 100 });
      const zone2 = mockElement({
        top: 0,
        left: 200,
        right: 300,
        bottom: 100,
      });
      const zone3 = mockElement({
        top: 200,
        left: 0,
        right: 100,
        bottom: 300,
      });
      service.registerZone('z1', zone1, () => true);
      service.registerZone('z2', zone2, () => true);
      service.registerZone('z3', zone3, () => true);
      const el = mockElement();
      service.startDrag('item-1', null, el);

      // First next selects first zone (sorted by top then left)
      service.navigateKeyboard('next');
      expect(service.hoveredZoneId()).toBe('z1');
      service.navigateKeyboard('next');
      expect(service.hoveredZoneId()).toBe('z2');
      service.navigateKeyboard('next');
      expect(service.hoveredZoneId()).toBe('z3');
      // Wrap around
      service.navigateKeyboard('next');
      expect(service.hoveredZoneId()).toBe('z1');
    });

    it('should cycle backward on prev and wrap around', () => {
      const zone1 = mockElement({ top: 0, left: 0, right: 100, bottom: 100 });
      const zone2 = mockElement({
        top: 0,
        left: 200,
        right: 300,
        bottom: 100,
      });
      service.registerZone('z1', zone1, () => true);
      service.registerZone('z2', zone2, () => true);
      const el = mockElement();
      service.startDrag('item-1', null, el);

      // First prev selects last zone
      service.navigateKeyboard('prev');
      expect(service.hoveredZoneId()).toBe('z2');
      service.navigateKeyboard('prev');
      expect(service.hoveredZoneId()).toBe('z1');
      // Wrap around
      service.navigateKeyboard('prev');
      expect(service.hoveredZoneId()).toBe('z2');
    });

    it('should select zone[0] on first next call when hoveredZoneId is null', () => {
      const zone1 = mockElement({
        top: 100,
        left: 0,
        right: 100,
        bottom: 200,
      });
      const zone2 = mockElement({ top: 0, left: 0, right: 100, bottom: 100 });
      // Register zone1 first but zone2 should be first in visual order
      service.registerZone('z1', zone1, () => true);
      service.registerZone('z2', zone2, () => true);
      const el = mockElement();
      service.startDrag('item-1', null, el);

      service.navigateKeyboard('next');
      // z2 is at top=0, z1 is at top=100, so z2 comes first visually
      expect(service.hoveredZoneId()).toBe('z2');
    });
  });

  // --- reset ---

  describe('reset', () => {
    it('should clear drag state AND zone registrations', () => {
      const zoneEl = mockElement({
        top: 0,
        left: 0,
        right: 100,
        bottom: 100,
      });
      service.registerZone('zone-a', zoneEl, () => true);
      const el = mockElement();
      service.startDrag('item-1', null, el);
      service.updatePosition({ x: 50, y: 50 });

      service.reset();

      expect(service.isDragging()).toBe(false);
      expect(service.activeItem()).toBeNull();
      expect(service.pointerPosition()).toEqual({ x: 0, y: 0 });
      expect(service.hoveredZoneId()).toBeNull();
      expect(service.lastDropResult()).toBeNull();

      // Zone registrations are cleared — re-register and check
      service.startDrag('item-2', null, el);
      service.updatePosition({ x: 50, y: 50 });
      expect(service.hoveredZoneId()).toBeNull();
    });
  });
});
