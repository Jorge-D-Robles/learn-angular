import {
  Component,
  computed,
  effect,
  input,
  output,
  signal,
} from '@angular/core';
import { validateExpression } from './expression-validator';

@Component({
  selector: 'nx-expression-builder',
  template: `
    @if (mode() === 'guided') {
      <div class="expression-builder__guided">
        <select aria-label="Left operand" (change)="onLeftChange($event)">
          <option value="" disabled [selected]="leftOperand() === ''">Variable...</option>
          @for (v of variables(); track v) {
            <option [value]="v" [selected]="leftOperand() === v">{{ v }}</option>
          }
        </select>

        <select aria-label="Operator" (change)="onOperatorChange($event)">
          <option value="" disabled [selected]="operator() === ''">Op...</option>
          @for (op of operators(); track op) {
            <option [value]="op" [selected]="operator() === op">{{ op }}</option>
          }
        </select>

        <div class="expression-builder__right-group">
          <button type="button" class="expression-builder__toggle"
                  (click)="toggleRightType()"
                  [attr.aria-label]="rightIsVariable() ? 'Switch to literal value' : 'Switch to variable'">
            {{ rightIsVariable() ? 'var' : 'val' }}
          </button>
          @if (rightIsVariable()) {
            <select aria-label="Right operand variable" (change)="onRightChange($event)">
              <option value="" disabled [selected]="rightOperand() === ''">Variable...</option>
              @for (v of variables(); track v) {
                <option [value]="v" [selected]="rightOperand() === v">{{ v }}</option>
              }
            </select>
          } @else {
            <input type="text" aria-label="Right operand value"
                   [value]="rightOperand()" (input)="onRightInput($event)"
                   placeholder="Value..." />
          }
        </div>
      </div>
    } @else {
      <div class="expression-builder__raw">
        <input type="text" class="expression-builder__input"
               aria-label="Expression"
               [value]="value()"
               (input)="onRawInput($event)"
               [attr.aria-invalid]="!isValid() && value() !== ''"
               placeholder="e.g. item.color === 'red'" />
      </div>
    }

    @if (errorMessage() && currentExpression() !== '') {
      <div class="expression-builder__error" role="status" aria-live="polite">
        {{ errorMessage() }}
      </div>
    }
  `,
  styleUrl: './expression-builder.scss',
})
export class ExpressionBuilderComponent {
  readonly mode = input<'guided' | 'raw'>('guided');
  readonly variables = input<string[]>([]);
  readonly operators = input<string[]>([]);
  readonly value = input<string>('');

  readonly valueChange = output<string>();
  readonly expressionChange = output<string>();

  readonly leftOperand = signal('');
  readonly operator = signal('');
  readonly rightOperand = signal('');
  readonly rightIsVariable = signal(false);

  readonly assembledExpression = computed(() => {
    const left = this.leftOperand();
    const op = this.operator();
    const right = this.rightOperand();
    if (!left || !op || !right) {
      return '';
    }
    return `${left} ${op} ${right}`;
  });

  readonly currentExpression = computed(() =>
    this.mode() === 'guided' ? this.assembledExpression() : this.value(),
  );

  readonly validation = computed(() =>
    validateExpression(this.currentExpression(), this.variables(), this.operators()),
  );

  readonly isValid = computed(() => this.validation().valid);
  readonly errorMessage = computed(() => this.validation().error);

  constructor() {
    effect(() => {
      const incoming = this.value();
      if (this.mode() !== 'guided') return;
      if (incoming === this.assembledExpression()) return;
      this.parseIntoGuidedParts(incoming);
    }, { allowSignalWrites: true });
  }

  onLeftChange(event: Event): void {
    this.leftOperand.set((event.target as HTMLSelectElement).value);
    this.emitFromGuided();
  }

  onOperatorChange(event: Event): void {
    this.operator.set((event.target as HTMLSelectElement).value);
    this.emitFromGuided();
  }

  onRightChange(event: Event): void {
    this.rightOperand.set((event.target as HTMLSelectElement).value);
    this.emitFromGuided();
  }

  onRightInput(event: Event): void {
    this.rightOperand.set((event.target as HTMLInputElement).value);
    this.emitFromGuided();
  }

  toggleRightType(): void {
    this.rightIsVariable.update((v) => !v);
    this.rightOperand.set('');
    this.emitFromGuided();
  }

  onRawInput(event: Event): void {
    const raw = (event.target as HTMLInputElement).value;
    this.valueChange.emit(raw);
    const result = validateExpression(raw, this.variables(), this.operators());
    if (result.valid) {
      this.expressionChange.emit(raw);
    }
  }

  private emitFromGuided(): void {
    const assembled = this.assembledExpression();
    this.valueChange.emit(assembled);
    const result = this.validation();
    if (result.valid) {
      this.expressionChange.emit(assembled);
    }
  }

  private parseIntoGuidedParts(expr: string): void {
    if (!expr) {
      this.leftOperand.set('');
      this.operator.set('');
      this.rightOperand.set('');
      return;
    }

    const ops = this.operators();
    const foundOp = ops.find((op) => expr.includes(op));
    if (!foundOp) {
      this.leftOperand.set('');
      this.operator.set('');
      this.rightOperand.set('');
      return;
    }

    const opIndex = expr.indexOf(foundOp);
    this.leftOperand.set(expr.slice(0, opIndex).trim());
    this.operator.set(foundOp);
    this.rightOperand.set(expr.slice(opIndex + foundOp.length).trim());
  }
}
