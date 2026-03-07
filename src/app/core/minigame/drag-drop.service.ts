import { Injectable, signal, type Signal } from '@angular/core';

/** An item being dragged. */
export interface DragItem {
  readonly id: string;
  readonly data: unknown;
  readonly sourceElement: HTMLElement;
}

/** A registered drop zone. */
export interface DropZoneRegistration {
  readonly id: string;
  readonly element: HTMLElement;
  readonly predicate: (data: unknown) => boolean;
}

/** Viewport-relative coordinates (clientX/clientY). */
export interface DragPosition {
  readonly x: number;
  readonly y: number;
}

/** Result of a drop operation. */
export interface DropResult {
  readonly accepted: boolean;
  readonly zoneId: string;
  readonly data: unknown;
}

/**
 * Central drag-and-drop state management service.
 *
 * Manages drag lifecycle, zone registry, predicate evaluation,
 * and keyboard navigation state. Used by DraggableDirective and
 * DropZoneDirective.
 *
 * Usage contract: the consuming component MUST call `reset()` in
 * its `ngOnDestroy` to clear stale state between games.
 */
@Injectable({ providedIn: 'root' })
export class DragDropService {
  private readonly _isDragging = signal(false);
  private readonly _activeItem = signal<DragItem | null>(null);
  private readonly _pointerPosition = signal<DragPosition>({ x: 0, y: 0 });
  private readonly _hoveredZoneId = signal<string | null>(null);
  private readonly _keyboardMode = signal(false);
  private readonly _lastDropResult = signal<DropResult | null>(null);
  private readonly _zones = new Map<string, DropZoneRegistration>();

  /** Whether a drag operation is in progress. */
  readonly isDragging: Signal<boolean> = this._isDragging.asReadonly();

  /** The item currently being dragged. */
  readonly activeItem: Signal<DragItem | null> = this._activeItem.asReadonly();

  /** Current pointer position (viewport-relative). */
  readonly pointerPosition: Signal<DragPosition> =
    this._pointerPosition.asReadonly();

  /** ID of the drop zone currently hovered, or null. */
  readonly hoveredZoneId: Signal<string | null> =
    this._hoveredZoneId.asReadonly();

  /** Whether drag was initiated via keyboard. */
  readonly keyboardMode: Signal<boolean> = this._keyboardMode.asReadonly();

  /** Result of the last drop operation (read by DropZoneDirective). */
  readonly lastDropResult: Signal<DropResult | null> =
    this._lastDropResult.asReadonly();

  /** Begin a drag operation. No-op if already dragging. */
  startDrag(
    id: string,
    data: unknown,
    sourceElement: HTMLElement,
    keyboard = false,
  ): void {
    if (this._isDragging()) {
      return;
    }
    this._activeItem.set({ id, data, sourceElement });
    this._isDragging.set(true);
    this._keyboardMode.set(keyboard);
    this._lastDropResult.set(null);
  }

  /** Update pointer position and re-evaluate hovered zone. No-op if not dragging. */
  updatePosition(position: DragPosition): void {
    if (!this._isDragging()) {
      return;
    }
    this._pointerPosition.set(position);
    this._hoveredZoneId.set(this.getHoveredZone(position));
  }

  /**
   * End the drag and evaluate drop.
   * Sets `lastDropResult` BEFORE resetting `isDragging`/`activeItem`.
   * Returns null if not dragging or no zone hovered.
   */
  endDrag(): DropResult | null {
    if (!this._isDragging()) {
      return null;
    }

    const zoneId = this._hoveredZoneId();
    const item = this._activeItem();

    if (!zoneId || !item) {
      this._resetDragState();
      return null;
    }

    const zone = this._zones.get(zoneId);
    if (!zone) {
      this._resetDragState();
      return null;
    }

    const accepted = zone.predicate(item.data);
    const result: DropResult = {
      accepted,
      zoneId,
      data: item.data,
    };

    // Set lastDropResult BEFORE resetting drag state
    this._lastDropResult.set(result);
    this._resetDragState();
    return result;
  }

  /** Cancel the current drag operation. */
  cancelDrag(): void {
    this._lastDropResult.set(null);
    this._resetDragState();
  }

  /** Register a drop zone for hit-testing. */
  registerZone(
    id: string,
    element: HTMLElement,
    predicate: (data: unknown) => boolean,
  ): void {
    this._zones.set(id, { id, element, predicate });
  }

  /** Unregister a drop zone. */
  unregisterZone(id: string): void {
    this._zones.delete(id);
  }

  /** Hit-test: find which zone contains the given position. */
  getHoveredZone(position: DragPosition): string | null {
    for (const [id, zone] of this._zones) {
      const rect = zone.element.getBoundingClientRect();
      if (
        position.x >= rect.left &&
        position.x <= rect.right &&
        position.y >= rect.top &&
        position.y <= rect.bottom
      ) {
        return id;
      }
    }
    return null;
  }

  /**
   * Cycle through registered zones via keyboard.
   * Zones sorted by visual position (top then left via getBoundingClientRect).
   * First 'next' selects zone[0]. First 'prev' selects zone[last].
   * Wraps around at both ends.
   */
  navigateKeyboard(direction: 'next' | 'prev'): void {
    if (this._zones.size === 0) {
      return;
    }

    const sorted = this._getSortedZones();
    const currentId = this._hoveredZoneId();

    if (currentId === null) {
      // First navigation
      const idx = direction === 'next' ? 0 : sorted.length - 1;
      this._hoveredZoneId.set(sorted[idx].id);
      return;
    }

    const currentIdx = sorted.findIndex((z) => z.id === currentId);
    if (currentIdx === -1) {
      // Current zone no longer exists, start over
      const idx = direction === 'next' ? 0 : sorted.length - 1;
      this._hoveredZoneId.set(sorted[idx].id);
      return;
    }

    let nextIdx: number;
    if (direction === 'next') {
      nextIdx = (currentIdx + 1) % sorted.length;
    } else {
      nextIdx = (currentIdx - 1 + sorted.length) % sorted.length;
    }
    this._hoveredZoneId.set(sorted[nextIdx].id);
  }

  /** Full teardown: clears drag state AND zone registrations. */
  reset(): void {
    this._lastDropResult.set(null);
    this._resetDragState();
    this._zones.clear();
  }

  /** Reset drag-specific state (not zones). */
  private _resetDragState(): void {
    this._isDragging.set(false);
    this._activeItem.set(null);
    this._pointerPosition.set({ x: 0, y: 0 });
    this._hoveredZoneId.set(null);
    this._keyboardMode.set(false);
  }

  /** Sort zones by visual position: top first, then left. */
  private _getSortedZones(): DropZoneRegistration[] {
    return [...this._zones.values()].sort((a, b) => {
      const rectA = a.element.getBoundingClientRect();
      const rectB = b.element.getBoundingClientRect();
      if (rectA.top !== rectB.top) {
        return rectA.top - rectB.top;
      }
      return rectA.left - rectB.left;
    });
  }
}
