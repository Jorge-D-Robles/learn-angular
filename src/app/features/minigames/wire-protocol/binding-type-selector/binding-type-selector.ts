import { Component, input, output } from '@angular/core';
import { WIRE_TYPE_COLORS, WireType } from '../wire-protocol.types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const WIRE_TYPE_OPTIONS = [
  { type: WireType.interpolation, label: '{{ }}', color: WIRE_TYPE_COLORS[WireType.interpolation], key: '1' },
  { type: WireType.property,      label: '[ ]',   color: WIRE_TYPE_COLORS[WireType.property],      key: '2' },
  { type: WireType.event,         label: '( )',    color: WIRE_TYPE_COLORS[WireType.event],         key: '3' },
  { type: WireType.twoWay,        label: '[( )]',  color: WIRE_TYPE_COLORS[WireType.twoWay],        key: '4' },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

@Component({
  selector: 'app-binding-type-selector',
  template: `
    <div class="binding-type-selector" role="radiogroup" aria-label="Wire type">
      @for (wt of wireTypeOptions; track wt.type) {
        <button class="binding-type-selector__btn"
                [class.binding-type-selector__btn--active]="selectedType() === wt.type"
                [class.binding-type-selector__btn--disabled]="!isAvailable(wt.type)"
                [style.--wire-color]="wt.color"
                [disabled]="!isAvailable(wt.type)"
                role="radio"
                [attr.aria-checked]="selectedType() === wt.type"
                [attr.aria-label]="wt.label + ' binding (key ' + wt.key + ')'"
                (click)="onSelect(wt.type)">
          <span class="binding-type-selector__key">{{ wt.key }}</span>
          {{ wt.label }}
        </button>
      }
    </div>
  `,
  styleUrl: './binding-type-selector.scss',
})
export class BindingTypeSelectorComponent {
  readonly wireTypeOptions = WIRE_TYPE_OPTIONS;

  // Inputs
  readonly selectedType = input.required<WireType>();
  readonly availableTypes = input<WireType[]>(Object.values(WireType));

  // Outputs
  readonly typeSelected = output<WireType>();

  isAvailable(type: WireType): boolean {
    return this.availableTypes().includes(type);
  }

  onSelect(type: WireType): void {
    if (!this.isAvailable(type)) return;
    this.typeSelected.emit(type);
  }
}
