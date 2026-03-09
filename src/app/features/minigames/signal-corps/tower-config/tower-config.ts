import {
  Component,
  computed,
  effect,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import {
  type InputTransform,
  type ParentBinding,
  type TowerConfig,
  type TowerInput,
  type TowerOutput,
  PORT_TYPE_COLORS,
  isTowerConfigComplete,
} from '../signal-corps.types';

export interface TowerConfigResult {
  readonly config: TowerConfig;
  readonly bindings: readonly ParentBinding[];
}

@Component({
  selector: 'app-signal-corps-tower-config',
  standalone: true,
  imports: [],
  template: `
    <div class="tower-config">
      <div class="tower-config__header">
        <span class="tower-config__title">{{ towerId() }} Configuration</span>
      </div>

      <!-- Input declarations -->
      <div class="tower-config__section">
        <h4 class="tower-config__section-title" [style.color]="portColors.input">Inputs</h4>
        @for (inp of editInputs(); track $index) {
          <div class="tower-config__row">
            <span class="tower-config__port-indicator tower-config__port-indicator--input"></span>
            <span>{{ inp.name }}: {{ inp.type }}{{ inp.required ? ' (required)' : '' }}{{ inp.transform ? ' [' + inp.transform + ']' : '' }}</span>
            <button class="tower-config__remove-btn" (click)="onRemoveInput($index)">Remove</button>
          </div>
        }
        <div class="tower-config__form">
          <input type="text" placeholder="name" aria-label="Input name"
            [value]="newInputName()" (input)="newInputName.set($any($event.target).value)" />
          <select aria-label="Input type" [value]="newInputType()" (change)="newInputType.set($any($event.target).value)">
            <option value="string">string</option>
            <option value="number">number</option>
            <option value="boolean">boolean</option>
            <option value="object">object</option>
          </select>
          <label class="tower-config__toggle">
            <input type="checkbox" [checked]="newInputRequired()" (change)="newInputRequired.set($any($event.target).checked)" /> required
          </label>
          <select aria-label="Transform" [value]="newInputTransform()" (change)="newInputTransform.set($any($event.target).value)">
            <option value="none">none</option>
            <option value="numberAttribute">numberAttribute</option>
            <option value="booleanAttribute">booleanAttribute</option>
          </select>
          <button class="tower-config__add-btn" (click)="onAddInput()" [disabled]="!newInputName() || inputNameDuplicate()">Add Input</button>
        </div>
        @if (inputNameDuplicate()) {
          <p class="tower-config__error">Duplicate input name</p>
        }
      </div>

      <!-- Output declarations -->
      <div class="tower-config__section">
        <h4 class="tower-config__section-title" [style.color]="portColors.output">Outputs</h4>
        @for (out of editOutputs(); track $index) {
          <div class="tower-config__row">
            <span class="tower-config__port-indicator tower-config__port-indicator--output"></span>
            <span>{{ out.name }}: {{ out.payloadType }}</span>
            <button class="tower-config__remove-btn" (click)="onRemoveOutput($index)">Remove</button>
          </div>
        }
        <div class="tower-config__form">
          <input type="text" placeholder="name" aria-label="Output name"
            [value]="newOutputName()" (input)="newOutputName.set($any($event.target).value)" />
          <select aria-label="Payload type" [value]="newOutputPayloadType()" (change)="newOutputPayloadType.set($any($event.target).value)">
            <option value="string">string</option>
            <option value="number">number</option>
            <option value="boolean">boolean</option>
            <option value="void">void</option>
          </select>
          <button class="tower-config__add-btn" (click)="onAddOutput()" [disabled]="!newOutputName() || outputNameDuplicate()">Add Output</button>
        </div>
        @if (outputNameDuplicate()) {
          <p class="tower-config__error">Duplicate output name</p>
        }
      </div>

      <!-- Wiring section -->
      <div class="tower-config__section">
        <h4 class="tower-config__section-title">Wiring</h4>
        @for (binding of editBindings(); track $index) {
          <div class="tower-config__row">
            <span>[{{ binding.bindingType }}] {{ binding.towerPortName }}
              @if (binding.parentProperty) { <- {{ binding.parentProperty }} }
              @if (binding.parentHandler) { <- {{ binding.parentHandler }} }
            </span>
            <button class="tower-config__remove-btn" (click)="onRemoveBinding($index)">Remove</button>
          </div>
        }
        <div class="tower-config__form">
          <select aria-label="Port name" (change)="onBindingPortSelected($any($event.target).value)">
            <option value="">-- port --</option>
            @for (inp of editInputs(); track inp.name) { <option [value]="inp.name">{{ inp.name }} (input)</option> }
            @for (out of editOutputs(); track out.name) { <option [value]="out.name">{{ out.name }} (output)</option> }
          </select>
          @if (newBindingType() === 'input') {
            <select aria-label="Parent property" [value]="newBindingParentValue()" (change)="newBindingParentValue.set($any($event.target).value)">
              <option value="">-- property --</option>
              @for (prop of parentProperties(); track prop) { <option [value]="prop">{{ prop }}</option> }
            </select>
          }
          @if (newBindingType() === 'output') {
            <select aria-label="Parent handler" [value]="newBindingParentValue()" (change)="newBindingParentValue.set($any($event.target).value)">
              <option value="">-- handler --</option>
              @for (handler of parentHandlers(); track handler) { <option [value]="handler">{{ handler }}</option> }
            </select>
          }
          <button class="tower-config__add-btn" (click)="onAddBinding()" [disabled]="!newBindingPortName() || !newBindingParentValue()">Wire</button>
        </div>
      </div>

      <!-- Footer -->
      <div class="tower-config__footer">
        <button class="tower-config__cancel-btn" (click)="onCancel()">Cancel</button>
        <button class="tower-config__apply-btn" (click)="onApply()" [disabled]="!canApply()">Apply</button>
      </div>
    </div>
  `,
  styleUrl: './tower-config.scss',
})
export class SignalCorpsTowerConfigComponent {
  // Inputs
  readonly tower = input.required<TowerConfig>();
  readonly bindings = input<readonly ParentBinding[]>([]);
  readonly parentProperties = input<string[]>([]);
  readonly parentHandlers = input<string[]>([]);
  readonly towerId = input<string>('');

  // Outputs
  readonly configApplied = output<TowerConfigResult>();
  readonly cancelled = output<void>();

  // Template access
  protected readonly portColors = PORT_TYPE_COLORS;

  // Internal edit signals
  readonly editInputs = signal<TowerInput[]>([]);
  readonly editOutputs = signal<TowerOutput[]>([]);
  readonly editBindings = signal<ParentBinding[]>([]);

  // New input form fields
  readonly newInputName = signal('');
  readonly newInputType = signal('string');
  readonly newInputRequired = signal(false);
  readonly newInputTransform = signal('none');

  // New output form fields
  readonly newOutputName = signal('');
  readonly newOutputPayloadType = signal('string');

  // New binding form fields
  readonly newBindingPortName = signal('');
  readonly newBindingType = signal<'input' | 'output'>('input');
  readonly newBindingParentValue = signal('');

  // Computed validations
  readonly inputNameDuplicate = computed(
    () => this.editInputs().some(i => i.name === this.newInputName()) && this.newInputName() !== '',
  );

  readonly outputNameDuplicate = computed(
    () => this.editOutputs().some(o => o.name === this.newOutputName()) && this.newOutputName() !== '',
  );

  readonly canApply = computed(() => {
    const config: TowerConfig = { inputs: this.editInputs(), outputs: this.editOutputs() };
    return isTowerConfigComplete(config) && !this.inputNameDuplicate() && !this.outputNameDuplicate();
  });

  constructor() {
    effect(() => {
      const t = this.tower();
      const b = this.bindings();
      untracked(() => {
        this.editInputs.set([...t.inputs]);
        this.editOutputs.set([...t.outputs]);
        this.editBindings.set([...b]);
      });
    }, { allowSignalWrites: true });
  }

  onAddInput(): void {
    const name = this.newInputName();
    if (!name || this.inputNameDuplicate()) return;

    const raw = this.newInputTransform();
    const newInput: TowerInput = {
      name,
      type: this.newInputType(),
      required: this.newInputRequired(),
      transform: raw === 'none' ? undefined : raw as InputTransform,
    };

    this.editInputs.update(inputs => [...inputs, newInput]);
    this.newInputName.set('');
    this.newInputType.set('string');
    this.newInputRequired.set(false);
    this.newInputTransform.set('none');
  }

  onRemoveInput(index: number): void {
    const removed = this.editInputs()[index];
    this.editInputs.update(inputs => inputs.filter((_, i) => i !== index));
    if (removed) {
      this.editBindings.update(bindings =>
        bindings.filter(b => b.towerPortName !== removed.name),
      );
    }
  }

  onAddOutput(): void {
    const name = this.newOutputName();
    if (!name || this.outputNameDuplicate()) return;

    const newOutput: TowerOutput = {
      name,
      payloadType: this.newOutputPayloadType(),
    };

    this.editOutputs.update(outputs => [...outputs, newOutput]);
    this.newOutputName.set('');
    this.newOutputPayloadType.set('string');
  }

  onRemoveOutput(index: number): void {
    const removed = this.editOutputs()[index];
    this.editOutputs.update(outputs => outputs.filter((_, i) => i !== index));
    if (removed) {
      this.editBindings.update(bindings =>
        bindings.filter(b => b.towerPortName !== removed.name),
      );
    }
  }

  onBindingPortSelected(portName: string): void {
    this.newBindingPortName.set(portName);
    this.newBindingParentValue.set('');

    const isInput = this.editInputs().some(i => i.name === portName);
    this.newBindingType.set(isInput ? 'input' : 'output');
  }

  onAddBinding(): void {
    const portName = this.newBindingPortName();
    const parentValue = this.newBindingParentValue();
    if (!portName || !parentValue) return;

    const bindingType = this.newBindingType();
    const binding: ParentBinding = {
      bindingType,
      towerPortName: portName,
      parentProperty: bindingType === 'input' ? parentValue : undefined,
      parentHandler: bindingType === 'output' ? parentValue : undefined,
    };

    this.editBindings.update(bindings => [...bindings, binding]);
    this.newBindingPortName.set('');
    this.newBindingParentValue.set('');
  }

  onRemoveBinding(index: number): void {
    this.editBindings.update(bindings => bindings.filter((_, i) => i !== index));
  }

  onApply(): void {
    const inputs: TowerInput[] = this.editInputs().map(inp => ({
      ...inp,
      transform: inp.transform === undefined ? undefined : inp.transform,
    }));

    const result: TowerConfigResult = {
      config: { inputs, outputs: [...this.editOutputs()] },
      bindings: [...this.editBindings()],
    };

    this.configApplied.emit(result);
  }

  onCancel(): void {
    this.cancelled.emit();
  }
}
