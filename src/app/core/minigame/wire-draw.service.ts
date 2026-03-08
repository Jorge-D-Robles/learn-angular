import { Injectable, signal, type Signal } from '@angular/core';

/** A registered wire endpoint (source or target). */
export interface WirePort {
  readonly id: string;
  readonly type: 'source' | 'target';
  readonly x: number;
  readonly y: number;
  readonly data?: unknown;
}

/** An established wire connection between two ports. */
export interface WireConnection {
  readonly id: string;
  readonly sourcePortId: string;
  readonly targetPortId: string;
}

/** Result of a wire completion attempt. */
export interface WireResult {
  readonly accepted: boolean;
  readonly sourcePortId: string;
  readonly targetPortId: string;
}

/** Viewport-relative coordinates. */
export interface WirePosition {
  readonly x: number;
  readonly y: number;
}

/** Connection validation predicate. */
type WireValidator = (sourcePort: WirePort, targetPort: WirePort) => boolean;

/**
 * Central wire-drawing interaction service.
 *
 * Models wire-drawing as a state machine: idle -> drawing -> idle.
 * Ports are registered by consuming components. The service is
 * rendering-agnostic — it works with abstract positions.
 *
 * Usage contract: the consuming component MUST call `reset()` in
 * its `ngOnDestroy` to clear stale state between games.
 */
@Injectable({ providedIn: 'root' })
export class WireDrawService {
  private readonly _phase = signal<'idle' | 'drawing'>('idle');
  private readonly _activeSourcePort = signal<WirePort | null>(null);
  private readonly _pointerPosition = signal<WirePosition>({ x: 0, y: 0 });
  private readonly _connections = signal<readonly WireConnection[]>([]);
  private readonly _lastResult = signal<WireResult | null>(null);
  private readonly _focusedPortId = signal<string | null>(null);
  private readonly _ports = new Map<string, WirePort>();
  private _validator: WireValidator = () => true;

  /** Current state machine phase. */
  readonly phase: Signal<'idle' | 'drawing'> = this._phase.asReadonly();

  /** Source port of wire being drawn, or null. */
  readonly activeSourcePort: Signal<WirePort | null> =
    this._activeSourcePort.asReadonly();

  /** Current pointer position for preview line rendering. */
  readonly pointerPosition: Signal<WirePosition> =
    this._pointerPosition.asReadonly();

  /** All established connections. */
  readonly connections: Signal<readonly WireConnection[]> =
    this._connections.asReadonly();

  /** Result of the last wire attempt (accepted/rejected). */
  readonly lastResult: Signal<WireResult | null> =
    this._lastResult.asReadonly();

  /** Currently keyboard-focused port id. */
  readonly focusedPortId: Signal<string | null> =
    this._focusedPortId.asReadonly();

  /** Register a port for wire operations. Replaces existing port with same id. */
  registerPort(port: WirePort): void {
    this._ports.set(port.id, port);
  }

  /** Unregister a port. No-op for unknown ids. */
  unregisterPort(id: string): void {
    this._ports.delete(id);
  }

  /** Look up a registered port by id. Returns undefined for unknown ids. */
  getPort(id: string): WirePort | undefined {
    return this._ports.get(id);
  }

  /** Begin a wire from a source port. No-op if already drawing, port unknown, or port is a target. */
  startWire(sourcePortId: string): void {
    if (this._phase() === 'drawing') {
      return;
    }
    const port = this._ports.get(sourcePortId);
    if (!port || port.type !== 'source') {
      return;
    }
    this._activeSourcePort.set(port);
    this._phase.set('drawing');
  }

  /** Update pointer position during drawing. No-op when idle. */
  updatePointer(position: WirePosition): void {
    if (this._phase() !== 'drawing') {
      return;
    }
    this._pointerPosition.set(position);
  }

  /**
   * Complete a wire at a target port.
   * Returns WireResult on valid attempt, null on no-op.
   */
  completeWire(targetPortId: string): WireResult | null {
    if (this._phase() !== 'drawing') {
      return null;
    }
    const targetPort = this._ports.get(targetPortId);
    if (!targetPort || targetPort.type !== 'target') {
      return null;
    }
    const sourcePort = this._activeSourcePort()!;
    const accepted = this._validator(sourcePort, targetPort);
    const result: WireResult = {
      accepted,
      sourcePortId: sourcePort.id,
      targetPortId: targetPort.id,
    };

    if (accepted) {
      const connection: WireConnection = {
        id: `${sourcePort.id}--${targetPort.id}`,
        sourcePortId: sourcePort.id,
        targetPortId: targetPort.id,
      };
      this._connections.update((conns) => [...conns, connection]);
    }

    this._lastResult.set(result);
    this._resetDrawingState();
    return result;
  }

  /** Cancel the current wire operation. No-op when idle. */
  cancelWire(): void {
    if (this._phase() !== 'drawing') {
      return;
    }
    this._resetDrawingState();
  }

  /** Remove a connection by id. No-op for unknown ids. */
  removeConnection(connectionId: string): void {
    this._connections.update((conns) =>
      conns.filter((c) => c.id !== connectionId),
    );
  }

  /** Remove all connections. If drawing, also cancels the active wire. */
  clearConnections(): void {
    this._connections.set([]);
    if (this._phase() === 'drawing') {
      this._resetDrawingState();
    }
  }

  /** Replace the connection validation predicate. */
  setValidator(predicate: WireValidator): void {
    this._validator = predicate;
  }

  /**
   * Cycle keyboard focus through ports sorted by position.
   * Sort order: ascending y, then ascending x as tiebreaker.
   */
  navigatePort(direction: 'next' | 'prev'): void {
    if (this._ports.size === 0) {
      return;
    }

    const sorted = this._getSortedPorts();
    const currentId = this._focusedPortId();

    if (currentId === null) {
      const idx = direction === 'next' ? 0 : sorted.length - 1;
      this._focusedPortId.set(sorted[idx].id);
      return;
    }

    const currentIdx = sorted.findIndex((p) => p.id === currentId);
    if (currentIdx === -1) {
      const idx = direction === 'next' ? 0 : sorted.length - 1;
      this._focusedPortId.set(sorted[idx].id);
      return;
    }

    let nextIdx: number;
    if (direction === 'next') {
      nextIdx = (currentIdx + 1) % sorted.length;
    } else {
      nextIdx = (currentIdx - 1 + sorted.length) % sorted.length;
    }
    this._focusedPortId.set(sorted[nextIdx].id);
  }

  /** Activate the currently focused port (Enter key). */
  activatePort(): void {
    const portId = this._focusedPortId();
    if (!portId) {
      return;
    }
    const port = this._ports.get(portId);
    if (!port) {
      return;
    }

    if (this._phase() === 'drawing') {
      if (port.type === 'target') {
        this.completeWire(portId);
      }
      // source port while drawing = no-op
    } else {
      if (port.type === 'source') {
        this.startWire(portId);
      }
    }
  }

  /** Full teardown: clears all state, ports, and connections. */
  reset(): void {
    this._resetDrawingState();
    this._connections.set([]);
    this._lastResult.set(null);
    this._focusedPortId.set(null);
    this._ports.clear();
  }

  /** Reset drawing-specific state. */
  private _resetDrawingState(): void {
    this._phase.set('idle');
    this._activeSourcePort.set(null);
    this._pointerPosition.set({ x: 0, y: 0 });
  }

  /** Sort ports by visual position: ascending y, then ascending x. */
  private _getSortedPorts(): WirePort[] {
    return [...this._ports.values()].sort((a, b) => {
      if (a.y !== b.y) {
        return a.y - b.y;
      }
      return a.x - b.x;
    });
  }
}
