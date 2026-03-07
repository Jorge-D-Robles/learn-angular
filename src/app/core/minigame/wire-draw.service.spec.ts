import { WireDrawService } from './wire-draw.service';

describe('WireDrawService', () => {
  let service: WireDrawService;

  beforeEach(() => {
    service = new WireDrawService();
  });

  // --- Structural ---

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have correct initial signal values', () => {
    expect(service.phase()).toBe('idle');
    expect(service.activeSourcePort()).toBeNull();
    expect(service.pointerPosition()).toEqual({ x: 0, y: 0 });
    expect(service.connections()).toEqual([]);
    expect(service.lastResult()).toBeNull();
    expect(service.focusedPortId()).toBeNull();
  });

  // --- Port Registration ---

  describe('registerPort', () => {
    it('should add a port to the registry', () => {
      service.registerPort({ id: 'src-1', type: 'source', x: 10, y: 20 });
      service.startWire('src-1');
      expect(service.phase()).toBe('drawing');
    });

    it('should replace an existing port with the same id', () => {
      service.registerPort({ id: 'src-1', type: 'source', x: 10, y: 20 });
      service.registerPort({ id: 'src-1', type: 'source', x: 30, y: 40 });
      service.startWire('src-1');
      expect(service.activeSourcePort()!.x).toBe(30);
      expect(service.activeSourcePort()!.y).toBe(40);
    });
  });

  describe('unregisterPort', () => {
    it('should remove a port from the registry', () => {
      service.registerPort({ id: 'src-1', type: 'source', x: 10, y: 20 });
      service.unregisterPort('src-1');
      service.startWire('src-1');
      expect(service.phase()).toBe('idle');
    });

    it('should be a no-op for unknown ids', () => {
      expect(() => service.unregisterPort('nonexistent')).not.toThrow();
    });
  });

  // --- Wire Initiation (startWire) ---

  describe('startWire', () => {
    it('should transition phase to drawing', () => {
      service.registerPort({ id: 'src-1', type: 'source', x: 10, y: 20 });
      service.startWire('src-1');
      expect(service.phase()).toBe('drawing');
    });

    it('should set activeSourcePort', () => {
      const port = { id: 'src-1', type: 'source' as const, x: 10, y: 20 };
      service.registerPort(port);
      service.startWire('src-1');
      expect(service.activeSourcePort()).toEqual(port);
    });

    it('should be a no-op if port is not registered', () => {
      service.startWire('unknown');
      expect(service.phase()).toBe('idle');
      expect(service.activeSourcePort()).toBeNull();
    });

    it('should be a no-op if port is a target port', () => {
      service.registerPort({ id: 'tgt-1', type: 'target', x: 10, y: 20 });
      service.startWire('tgt-1');
      expect(service.phase()).toBe('idle');
      expect(service.activeSourcePort()).toBeNull();
    });

    it('should be a no-op if already drawing', () => {
      service.registerPort({ id: 'src-1', type: 'source', x: 10, y: 20 });
      service.registerPort({ id: 'src-2', type: 'source', x: 30, y: 40 });
      service.startWire('src-1');
      service.startWire('src-2');
      expect(service.activeSourcePort()!.id).toBe('src-1');
    });
  });

  // --- Pointer Updates ---

  describe('updatePointer', () => {
    it('should update pointerPosition when drawing', () => {
      service.registerPort({ id: 'src-1', type: 'source', x: 10, y: 20 });
      service.startWire('src-1');
      service.updatePointer({ x: 150, y: 200 });
      expect(service.pointerPosition()).toEqual({ x: 150, y: 200 });
    });

    it('should be a no-op when idle', () => {
      service.updatePointer({ x: 100, y: 100 });
      expect(service.pointerPosition()).toEqual({ x: 0, y: 0 });
    });
  });

  // --- Wire Completion (completeWire) ---

  describe('completeWire', () => {
    beforeEach(() => {
      service.registerPort({ id: 'src-1', type: 'source', x: 10, y: 20 });
      service.registerPort({
        id: 'tgt-1',
        type: 'target',
        x: 100,
        y: 200,
      });
    });

    it('should add a connection when predicate accepts', () => {
      service.startWire('src-1');
      const result = service.completeWire('tgt-1');
      expect(result).not.toBeNull();
      expect(result!.accepted).toBe(true);
      expect(result!.sourcePortId).toBe('src-1');
      expect(result!.targetPortId).toBe('tgt-1');
      expect(service.connections().length).toBe(1);
      expect(service.lastResult()!.accepted).toBe(true);
    });

    it('should set lastResult.accepted=false when predicate rejects', () => {
      service.setValidator(() => false);
      service.startWire('src-1');
      const result = service.completeWire('tgt-1');
      expect(result).not.toBeNull();
      expect(result!.accepted).toBe(false);
      expect(service.connections().length).toBe(0);
      expect(service.lastResult()!.accepted).toBe(false);
    });

    it('should transition phase back to idle', () => {
      service.startWire('src-1');
      service.completeWire('tgt-1');
      expect(service.phase()).toBe('idle');
      expect(service.activeSourcePort()).toBeNull();
    });

    it('should be a no-op when idle', () => {
      const result = service.completeWire('tgt-1');
      expect(result).toBeNull();
      expect(service.connections().length).toBe(0);
    });

    it('should be a no-op if port is not registered', () => {
      service.startWire('src-1');
      const result = service.completeWire('unknown');
      expect(result).toBeNull();
      expect(service.phase()).toBe('drawing');
    });

    it('should be a no-op if port is a source port', () => {
      service.registerPort({ id: 'src-2', type: 'source', x: 50, y: 60 });
      service.startWire('src-1');
      const result = service.completeWire('src-2');
      expect(result).toBeNull();
      expect(service.phase()).toBe('drawing');
    });

    it('should generate connection id as sourceId--targetId', () => {
      service.startWire('src-1');
      service.completeWire('tgt-1');
      expect(service.connections()[0].id).toBe('src-1--tgt-1');
    });
  });

  // --- Wire Cancellation ---

  describe('cancelWire', () => {
    it('should transition from drawing to idle', () => {
      service.registerPort({ id: 'src-1', type: 'source', x: 10, y: 20 });
      service.startWire('src-1');
      service.updatePointer({ x: 100, y: 100 });
      service.cancelWire();
      expect(service.phase()).toBe('idle');
      expect(service.activeSourcePort()).toBeNull();
      expect(service.pointerPosition()).toEqual({ x: 0, y: 0 });
    });

    it('should be a no-op when idle', () => {
      expect(() => service.cancelWire()).not.toThrow();
      expect(service.phase()).toBe('idle');
    });
  });

  // --- Connection Removal ---

  describe('removeConnection', () => {
    it('should remove a connection by id', () => {
      service.registerPort({ id: 'src-1', type: 'source', x: 10, y: 20 });
      service.registerPort({
        id: 'tgt-1',
        type: 'target',
        x: 100,
        y: 200,
      });
      service.startWire('src-1');
      service.completeWire('tgt-1');
      expect(service.connections().length).toBe(1);
      service.removeConnection('src-1--tgt-1');
      expect(service.connections().length).toBe(0);
    });

    it('should be a no-op for unknown connection id', () => {
      expect(() => service.removeConnection('nonexistent')).not.toThrow();
    });
  });

  // --- Validation Predicate ---

  describe('setValidator', () => {
    it('should replace the connection predicate', () => {
      service.registerPort({
        id: 'src-1',
        type: 'source',
        x: 10,
        y: 20,
        data: 'string',
      });
      service.registerPort({
        id: 'tgt-1',
        type: 'target',
        x: 100,
        y: 200,
        data: 'number',
      });
      service.setValidator(
        (source, target) => source.data === target.data,
      );
      service.startWire('src-1');
      const result = service.completeWire('tgt-1');
      expect(result!.accepted).toBe(false);
    });

    it('default validator should accept all connections', () => {
      service.registerPort({ id: 'src-1', type: 'source', x: 10, y: 20 });
      service.registerPort({
        id: 'tgt-1',
        type: 'target',
        x: 100,
        y: 200,
      });
      service.startWire('src-1');
      const result = service.completeWire('tgt-1');
      expect(result!.accepted).toBe(true);
    });
  });

  // --- Keyboard Navigation ---

  describe('navigatePort', () => {
    it('next should cycle through ports sorted by position', () => {
      // y=0 x=200 first by y, then y=0 x=100 — wait, ascending x: x=100 < x=200
      // So sorted order: port-a (y=0,x=100), port-b (y=0,x=200), port-c (y=100,x=0)
      service.registerPort({
        id: 'port-a',
        type: 'source',
        x: 100,
        y: 0,
      });
      service.registerPort({
        id: 'port-b',
        type: 'target',
        x: 200,
        y: 0,
      });
      service.registerPort({
        id: 'port-c',
        type: 'source',
        x: 0,
        y: 100,
      });

      service.navigatePort('next');
      expect(service.focusedPortId()).toBe('port-a');
      service.navigatePort('next');
      expect(service.focusedPortId()).toBe('port-b');
      service.navigatePort('next');
      expect(service.focusedPortId()).toBe('port-c');
      // Wrap around
      service.navigatePort('next');
      expect(service.focusedPortId()).toBe('port-a');
    });

    it('prev should cycle backward with wraparound', () => {
      service.registerPort({
        id: 'port-a',
        type: 'source',
        x: 100,
        y: 0,
      });
      service.registerPort({
        id: 'port-b',
        type: 'target',
        x: 200,
        y: 0,
      });

      // First prev selects last port
      service.navigatePort('prev');
      expect(service.focusedPortId()).toBe('port-b');
      service.navigatePort('prev');
      expect(service.focusedPortId()).toBe('port-a');
      // Wrap around
      service.navigatePort('prev');
      expect(service.focusedPortId()).toBe('port-b');
    });

    it('should set focusedPortId', () => {
      service.registerPort({
        id: 'port-a',
        type: 'source',
        x: 10,
        y: 20,
      });
      service.navigatePort('next');
      expect(service.focusedPortId()).toBe('port-a');
    });

    it('should be a no-op with zero ports', () => {
      expect(() => service.navigatePort('next')).not.toThrow();
      expect(service.focusedPortId()).toBeNull();
    });
  });

  describe('activatePort', () => {
    it('should startWire when focused on a source port', () => {
      service.registerPort({
        id: 'src-1',
        type: 'source',
        x: 10,
        y: 20,
      });
      service.navigatePort('next'); // focuses src-1
      service.activatePort();
      expect(service.phase()).toBe('drawing');
      expect(service.activeSourcePort()!.id).toBe('src-1');
    });

    it('should completeWire when focused on a target port and drawing', () => {
      service.registerPort({
        id: 'src-1',
        type: 'source',
        x: 10,
        y: 20,
      });
      service.registerPort({
        id: 'tgt-1',
        type: 'target',
        x: 100,
        y: 200,
      });
      service.startWire('src-1');
      service.navigatePort('next'); // focuses src-1 (first sorted)
      service.navigatePort('next'); // focuses tgt-1 (second sorted)
      service.activatePort();
      expect(service.phase()).toBe('idle');
      expect(service.connections().length).toBe(1);
    });

    it('should be a no-op when no port is focused', () => {
      expect(() => service.activatePort()).not.toThrow();
      expect(service.phase()).toBe('idle');
    });

    it('on a source port while drawing should be a no-op', () => {
      service.registerPort({
        id: 'src-1',
        type: 'source',
        x: 10,
        y: 20,
      });
      service.registerPort({
        id: 'src-2',
        type: 'source',
        x: 30,
        y: 40,
      });
      service.startWire('src-1');
      service.navigatePort('next'); // focuses src-1
      service.navigatePort('next'); // focuses src-2
      service.activatePort();
      expect(service.phase()).toBe('drawing');
      expect(service.activeSourcePort()!.id).toBe('src-1');
    });
  });

  // --- Reset ---

  describe('reset', () => {
    it('should clear all state and port registrations', () => {
      service.registerPort({ id: 'src-1', type: 'source', x: 10, y: 20 });
      service.registerPort({
        id: 'tgt-1',
        type: 'target',
        x: 100,
        y: 200,
      });
      service.startWire('src-1');
      service.completeWire('tgt-1');
      service.navigatePort('next');

      service.reset();

      expect(service.phase()).toBe('idle');
      expect(service.activeSourcePort()).toBeNull();
      expect(service.connections()).toEqual([]);
      expect(service.focusedPortId()).toBeNull();
      expect(service.lastResult()).toBeNull();
      expect(service.pointerPosition()).toEqual({ x: 0, y: 0 });

      // Ports are cleared — startWire should be a no-op
      service.startWire('src-1');
      expect(service.phase()).toBe('idle');
    });
  });

  describe('clearConnections', () => {
    it('should remove all connections but preserve ports', () => {
      service.registerPort({ id: 'src-1', type: 'source', x: 10, y: 20 });
      service.registerPort({
        id: 'tgt-1',
        type: 'target',
        x: 100,
        y: 200,
      });
      service.startWire('src-1');
      service.completeWire('tgt-1');
      expect(service.connections().length).toBe(1);

      service.clearConnections();
      expect(service.connections()).toEqual([]);

      // Ports are still registered — startWire should work
      service.startWire('src-1');
      expect(service.phase()).toBe('drawing');
    });

    it('during drawing phase should also cancel the active wire', () => {
      service.registerPort({ id: 'src-1', type: 'source', x: 10, y: 20 });
      service.registerPort({
        id: 'tgt-1',
        type: 'target',
        x: 100,
        y: 200,
      });
      service.startWire('src-1');
      service.updatePointer({ x: 50, y: 50 });

      service.clearConnections();

      expect(service.phase()).toBe('idle');
      expect(service.activeSourcePort()).toBeNull();
      expect(service.pointerPosition()).toEqual({ x: 0, y: 0 });
    });
  });
});
