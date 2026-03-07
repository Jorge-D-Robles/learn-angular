import {
  Directive,
  ElementRef,
  EventEmitter,
  DestroyRef,
  HostListener,
  inject,
  input,
  Output,
} from '@angular/core';
import {
  DragDropService,
  type DragItem,
  type DragPosition,
  type DropResult,
} from '../../core/minigame/drag-drop.service';

/**
 * Makes an element draggable via pointer events and keyboard.
 *
 * Usage:
 *   <div [nxDraggable]="'item-1'" [nxDraggableData]="payload">...</div>
 *
 * Known limitation: `position: fixed` + `transform: translate()` breaks
 * if any ancestor has a CSS `transform`, `filter`, or `will-change`.
 */
@Directive({
  selector: '[nxDraggable]',
  host: {
    '[attr.tabindex]': '0',
    '[attr.aria-roledescription]': '"draggable"',
    '[class.nx-dragging]': '_isDraggingThis()',
  },
})
export class DraggableDirective {
  private readonly _service = inject(DragDropService);
  private readonly _elRef = inject(ElementRef<HTMLElement>);
  private readonly _destroyRef = inject(DestroyRef);

  /** Unique item ID. */
  readonly nxDraggable = input.required<string>();

  /** Payload data carried by the dragged item. */
  readonly nxDraggableData = input<unknown>(undefined);

  @Output() readonly nxDragStart = new EventEmitter<DragItem>();
  @Output() readonly nxDrag = new EventEmitter<DragPosition>();
  @Output() readonly nxDrop = new EventEmitter<DropResult>();
  @Output() readonly nxDragCancel = new EventEmitter<void>();

  private _activePointerId: number | null = null;

  constructor() {
    this._destroyRef.onDestroy(() => {
      if (this._isDraggingThis()) {
        if (this._activePointerId !== null) {
          try {
            this._elRef.nativeElement.releasePointerCapture(
              this._activePointerId,
            );
          } catch {
            // Pointer capture may already be released
          }
        }
        this._service.cancelDrag();
      }
    });
  }

  /** Whether this specific item is the one being dragged. */
  protected _isDraggingThis(): boolean {
    return (
      this._service.isDragging() &&
      this._service.activeItem()?.id === this.nxDraggable()
    );
  }

  @HostListener('pointerdown', ['$event'])
  onPointerDown(event: PointerEvent): void {
    const id = this.nxDraggable();
    if (!id) {
      return;
    }

    const el = this._elRef.nativeElement;
    this._service.startDrag(id, this.nxDraggableData(), el, false);

    if (this._isDraggingThis()) {
      this._activePointerId = event.pointerId;
      el.setPointerCapture(event.pointerId);
      this.nxDragStart.emit(this._service.activeItem()!);
    }
  }

  @HostListener('pointermove', ['$event'])
  onPointerMove(event: PointerEvent): void {
    if (!this._isDraggingThis()) {
      return;
    }
    const pos: DragPosition = { x: event.clientX, y: event.clientY };
    this._service.updatePosition(pos);
    this.nxDrag.emit(pos);
  }

  @HostListener('pointerup', ['$event'])
  onPointerUp(event: PointerEvent): void {
    if (!this._isDraggingThis()) {
      return;
    }
    this._releasePointer(event.pointerId);
    const result = this._service.endDrag();
    if (result) {
      this.nxDrop.emit(result);
    } else {
      this.nxDragCancel.emit();
    }
  }

  @HostListener('pointercancel', ['$event'])
  onPointerCancel(event: PointerEvent): void {
    if (!this._isDraggingThis()) {
      return;
    }
    this._releasePointer(event.pointerId);
    this._service.cancelDrag();
    this.nxDragCancel.emit();
  }

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'Enter':
        if (!this._service.isDragging()) {
          // Start keyboard drag
          const id = this.nxDraggable();
          if (!id) return;
          const el = this._elRef.nativeElement;
          this._service.startDrag(id, this.nxDraggableData(), el, true);
          if (this._isDraggingThis()) {
            this.nxDragStart.emit(this._service.activeItem()!);
          }
        } else if (this._isDraggingThis()) {
          // Drop via keyboard
          const result = this._service.endDrag();
          if (result) {
            this.nxDrop.emit(result);
          } else {
            this.nxDragCancel.emit();
          }
        }
        event.preventDefault();
        break;

      case 'ArrowDown':
      case 'ArrowRight':
        if (this._isDraggingThis()) {
          this._service.navigateKeyboard('next');
          event.preventDefault();
        }
        break;

      case 'ArrowUp':
      case 'ArrowLeft':
        if (this._isDraggingThis()) {
          this._service.navigateKeyboard('prev');
          event.preventDefault();
        }
        break;

      case 'Escape':
        if (this._isDraggingThis()) {
          this._service.cancelDrag();
          this.nxDragCancel.emit();
          event.preventDefault();
        }
        break;
    }
  }

  private _releasePointer(pointerId: number): void {
    try {
      this._elRef.nativeElement.releasePointerCapture(pointerId);
    } catch {
      // Pointer capture may already be released
    }
    this._activePointerId = null;
  }
}
