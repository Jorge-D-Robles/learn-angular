import {
  Directive,
  ElementRef,
  EventEmitter,
  OnInit,
  OnDestroy,
  Output,
  effect,
  inject,
  input,
} from '@angular/core';
import {
  DragDropService,
  type DragItem,
  type DropResult,
} from '../../core/minigame/drag-drop.service';

/**
 * Marks an element as a valid drop target.
 *
 * Usage:
 *   <div [nxDropZone]="'slot-1'" [nxDropZonePredicate]="canAccept">...</div>
 *
 * CSS classes applied:
 * - `nx-drop-zone--active`: when any drag operation is in progress
 * - `nx-drop-zone--hover`: when this zone is the currently hovered target
 *
 * No stylesheet is created -- consumers style these classes.
 */
@Directive({
  selector: '[nxDropZone]',
  host: {
    '[class.nx-drop-zone--active]': '_service.isDragging()',
    '[class.nx-drop-zone--hover]': '_isHovered()',
  },
})
export class DropZoneDirective implements OnInit, OnDestroy {
  /** @internal Exposed for host binding. */
  protected readonly _service = inject(DragDropService);
  private readonly _elRef = inject(ElementRef<HTMLElement>);

  /** Unique zone ID. */
  readonly nxDropZone = input.required<string>();

  /** Predicate to decide whether to accept dropped data. Defaults to accept all. */
  readonly nxDropZonePredicate = input<(data: unknown) => boolean>(
    () => true,
  );

  @Output() readonly nxDropZoneEnter = new EventEmitter<DragItem>();
  @Output() readonly nxDropZoneLeave = new EventEmitter<void>();
  @Output() readonly nxDropZoneDrop = new EventEmitter<DropResult>();

  private _wasHovered = false;

  constructor() {
    // Watch hoveredZoneId for enter/leave emissions
    effect(() => {
      const hovered = this._isHovered();
      if (hovered && !this._wasHovered) {
        const item = this._service.activeItem();
        if (item) {
          this.nxDropZoneEnter.emit(item);
        }
      } else if (!hovered && this._wasHovered) {
        this.nxDropZoneLeave.emit();
      }
      this._wasHovered = hovered;
    });

    // Watch lastDropResult for drop emissions
    effect(() => {
      const result = this._service.lastDropResult();
      if (result && result.zoneId === this.nxDropZone()) {
        this.nxDropZoneDrop.emit(result);
      }
    });
  }

  /** Whether this zone is currently hovered. */
  protected _isHovered(): boolean {
    return this._service.hoveredZoneId() === this.nxDropZone();
  }

  ngOnInit(): void {
    this._service.registerZone(
      this.nxDropZone(),
      this._elRef.nativeElement,
      this.nxDropZonePredicate(),
    );
  }

  ngOnDestroy(): void {
    this._service.unregisterZone(this.nxDropZone());
  }
}
