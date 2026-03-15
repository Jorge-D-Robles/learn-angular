import {
  Component,
  effect,
  input,
  output,
  signal,
} from '@angular/core';
import { CodeEditorComponent } from '../../../../shared/components/code-editor/code-editor';
import type {
  FormElementSpec,
  FormToolType,
  TargetFormSpec,
} from '../terminal-hack.types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const ALL_FORM_TOOL_TYPES: readonly FormToolType[] = [
  'ngModel',
  'ngSubmit',
  'FormControl',
  'FormGroup',
  'FormArray',
  'FormBuilder',
  'Validators.required',
  'Validators.email',
  'Validators.pattern',
  'Validators.min',
  'Validators.max',
  'Validators.minLength',
  'Validators.maxLength',
  'customValidator',
  'asyncValidator',
  'crossFieldValidator',
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

@Component({
  selector: 'app-terminal-hack-code-panel',
  imports: [CodeEditorComponent],
  template: `
    <div class="code-panel">
      <div class="code-panel__left">
        @for (el of targetSpec().elements; track el.id) {
          <div class="code-panel__spec-item"
               [class.code-panel__spec-item--required]="hasRequiredValidation(el)">
            <span class="code-panel__spec-label">{{ el.label }}</span>
            <span class="code-panel__spec-type">{{ el.elementType }}</span>
            @for (v of el.validations; track v.type) {
              <span class="code-panel__spec-validation">{{ v.type }}</span>
            }
          </div>
        }
      </div>

      <div class="code-panel__right">
        <div class="code-panel__toolbar" role="toolbar" aria-label="Form tools">
          @for (tool of allFormToolTypes; track tool) {
            <button type="button"
                    class="code-panel__tool-btn"
                    [class.code-panel__tool-btn--dimmed]="!isAvailable(tool)"
                    [attr.aria-disabled]="!isAvailable(tool)"
                    [attr.aria-label]="tool + ' tool'">
              {{ tool }}
            </button>
          }
        </div>

        <nx-code-editor
          [code]="_code()"
          [readOnly]="false"
          (codeChange)="onEditorCodeChange($event)" />

        <span class="code-panel__cursor">_</span>
      </div>
    </div>
  `,
  styleUrl: './code-panel.scss',
})
export class TerminalHackCodePanelComponent {
  // --- Inputs ---
  readonly targetSpec = input.required<TargetFormSpec>();
  readonly initialCode = input<string>('');
  readonly availableTools = input<FormToolType[]>([]);

  // --- Outputs ---
  readonly codeChange = output<string>();

  // --- Internal state ---
  readonly _code = signal('');
  private _seeded = false;

  // --- Template constants ---
  readonly allFormToolTypes = ALL_FORM_TOOL_TYPES;

  constructor() {
    effect(() => {
      const code = this.initialCode();
      if (!this._seeded) {
        this._seeded = true;
        this._code.set(code);
      }
    });
  }

  // --- Methods ---

  hasRequiredValidation(el: FormElementSpec): boolean {
    return el.validations.some(v => v.type === 'required');
  }

  isAvailable(tool: FormToolType): boolean {
    return this.availableTools().includes(tool);
  }

  onEditorCodeChange(code: string): void {
    this._code.set(code);
    this.codeChange.emit(code);
  }
}
