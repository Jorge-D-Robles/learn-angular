import {
  Component,
  computed,
  effect,
  input,
  output,
  signal,
} from '@angular/core';
import { CodeEditorComponent } from '../../../../shared/components/code-editor/code-editor';
import type { PipeBlock, PipeCategory } from '../data-relay.types';
import { PIPE_CATEGORY_COLORS } from '../data-relay.component';
import { applyPipeTransform } from '../pipe-transforms';

const SAMPLE_INPUTS: Record<PipeCategory, string> = {
  text: 'hello world',
  number: '1234.5678',
  date: '2026-03-15T12:00:00Z',
  custom: '42',
};

@Component({
  selector: 'app-pipe-config',
  imports: [CodeEditorComponent],
  template: `
    <div class="pipe-config__header">
      <span
        class="pipe-config__icon"
        [style.background-color]="categoryColor()"
      ></span>
      <span class="pipe-config__pipe-name">{{ pipe().pipeType }}</span>
    </div>
    <div class="pipe-config__params">
      @switch (pipeType()) {
        @case ('date') {
          <label class="pipe-config__param-label">Format
            <select
              class="pipe-config__select"
              [value]="editingParams()[0] ?? ''"
              (change)="onSelectChange($event)"
            >
              @for (opt of availableParams(); track opt) {
                <option [value]="opt">{{ opt }}</option>
              }
            </select>
          </label>
        }
        @case ('number') {
          <label class="pipe-config__param-label">Max fraction digits
            <input
              type="number"
              class="pipe-config__number-input"
              [value]="fractionDigits()"
              min="0"
              max="20"
              (input)="onNumberInput($event)"
            />
          </label>
        }
        @case ('text') {
          <div class="pipe-config__no-params">No parameters</div>
        }
        @case ('custom') {
          <span class="pipe-config__param-label">Transform function</span>
          <nx-code-editor
            [code]="editingParams()[0] ?? ''"
            [language]="'typescript'"
            (codeChange)="onCodeChange($event)"
          />
        }
      }
    </div>
    <div class="pipe-config__preview">
      <span class="pipe-config__preview-label">Preview</span>
      <span class="pipe-config__preview-input">{{ sampleInput() }}</span>
      <span class="pipe-config__preview-arrow">&rarr;</span>
      <span class="pipe-config__preview-output">{{ previewOutput() }}</span>
    </div>
    <div class="pipe-config__actions">
      <button class="pipe-config__apply-btn" (click)="onApply()">Apply</button>
      <button class="pipe-config__remove-btn" (click)="onRemove()">Remove</button>
    </div>
  `,
  styleUrl: './pipe-config.scss',
})
export class DataRelayPipeConfigComponent {
  // Inputs
  readonly pipe = input.required<PipeBlock>();
  readonly pipeType = input.required<PipeCategory>();
  readonly availableParams = input.required<string[]>();

  // Outputs
  readonly paramsChanged = output<string[]>();
  readonly pipeRemoved = output<void>();

  // Internal state
  readonly editingParams = signal<string[]>([]);

  // Constants exposed to template
  readonly categoryColors = PIPE_CATEGORY_COLORS;

  // Computed: category color for the icon
  readonly categoryColor = computed(() => PIPE_CATEGORY_COLORS[this.pipeType()]);

  // Computed: sample input based on pipe category
  readonly sampleInput = computed(() => SAMPLE_INPUTS[this.pipeType()]);

  // Computed: extract fraction digits from editing params for number inputs
  readonly fractionDigits = computed(() => {
    const params = this.editingParams();
    if (params.length === 0) return 3;
    const digitInfo = params[0];
    const parts = digitInfo.split('-');
    return parts.length > 1 ? parseInt(parts[parts.length - 1], 10) : 3;
  });

  // Computed: live preview output
  readonly previewOutput = computed(() => {
    const sample = this.sampleInput();
    const pipeBlock = this.pipe();
    const params = this.editingParams();
    return applyPipeTransform(sample, pipeBlock.pipeType, params, []);
  });

  // Sync editingParams when pipe input changes
  constructor() {
    effect(() => {
      this.editingParams.set([...this.pipe().params]);
    });
  }

  onSelectChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.editingParams.set([select.value]);
  }

  onNumberInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = parseInt(input.value, 10);
    const maxFraction = isNaN(digits) ? 3 : digits;
    this.editingParams.set([`1.0-${maxFraction}`]);
  }

  onCodeChange(code: string): void {
    this.editingParams.set([code]);
  }

  onApply(): void {
    this.paramsChanged.emit([...this.editingParams()]);
  }

  onRemove(): void {
    this.pipeRemoved.emit();
  }
}
