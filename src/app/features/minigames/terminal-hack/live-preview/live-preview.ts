import {
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import type { FormElementSpec, TargetFormSpec } from '../terminal-hack.types';
import type { PlayerFormElement } from '../terminal-hack.engine';

// ---------------------------------------------------------------------------
// Local types
// ---------------------------------------------------------------------------

export interface PreviewSlot {
  readonly spec: FormElementSpec;
  readonly placed: PlayerFormElement | undefined;
  readonly status: 'missing' | 'correct' | 'incorrect';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

@Component({
  selector: 'app-terminal-hack-live-preview',
  template: `
    <div class="live-preview">
      <div class="live-preview__header">
        <span class="live-preview__form-name">{{ targetSpec().formName }}</span>
        <span class="live-preview__badge">{{ targetSpec().formType }}</span>
      </div>

      @for (slot of previewSlots(); track slot.spec.id) {
        <div class="live-preview__slot live-preview__slot--{{ slot.status }}"
             tabindex="0"
             role="button"
             (click)="onSlotClick(slot.spec.id)"
             (keydown.enter)="onSlotClick(slot.spec.id)">
          <span class="live-preview__label">{{ slot.spec.label }}</span>
          <span class="live-preview__type">{{ slot.spec.elementType }}</span>
          <div class="live-preview__input-mock">
            @if (slot.status === 'missing') {
              Missing
            }
          </div>
        </div>
      }
    </div>
  `,
  styleUrl: './live-preview.scss',
})
export class TerminalHackLivePreviewComponent {
  // --- Inputs ---
  readonly targetSpec = input.required<TargetFormSpec>();
  readonly formElements = input<PlayerFormElement[]>([]);

  // --- Outputs ---
  readonly elementClicked = output<string>();

  // --- Computed: lookup Map for O(1) matching ---
  private readonly formElementMap = computed(() => {
    const map = new Map<string, PlayerFormElement>();
    for (const el of this.formElements()) {
      map.set(el.elementId, el);
    }
    return map;
  });

  // --- Computed: preview slots ---
  readonly previewSlots = computed<PreviewSlot[]>(() => {
    const lookup = this.formElementMap();
    return this.targetSpec().elements.map(spec => {
      const placed = lookup.get(spec.id);
      let status: PreviewSlot['status'];
      if (!placed) {
        status = 'missing';
      } else if (placed.elementType === spec.elementType) {
        status = 'correct';
      } else {
        status = 'incorrect';
      }
      return { spec, placed, status };
    });
  });

  // --- Event handlers ---

  onSlotClick(elementId: string): void {
    this.elementClicked.emit(elementId);
  }
}
