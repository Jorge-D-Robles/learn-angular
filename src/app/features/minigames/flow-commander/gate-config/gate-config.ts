import {
  Component,
  computed,
  effect,
  input,
  output,
  signal,
} from '@angular/core';
import { ExpressionBuilderComponent } from '../../../../shared/components';
import { GateType, GATE_TYPE_COLORS } from '../pipeline.types';

const GATE_LABELS: Readonly<Record<GateType, string>> = {
  [GateType.if]: '@if Filter',
  [GateType.for]: '@for Duplicator',
  [GateType.switch]: '@switch Router',
};

@Component({
  selector: 'app-flow-commander-gate-config',
  imports: [ExpressionBuilderComponent],
  template: `
    <div class="gate-config">
      <div class="gate-config__header" [style.border-color]="gateColor()">
        <span class="gate-config__type-badge" [style.color]="gateColor()">
          {{ gateLabel() }}
        </span>
      </div>

      <div class="gate-config__body">
        @switch (gateType()) {
          @case (GateType.if) {
            <nx-expression-builder
              [mode]="tierMode()"
              [variables]="availableProperties()"
              [operators]="conditionOperators"
              [value]="condition()"
              (expressionChange)="onExpressionChange($event)" />
          }
          @case (GateType.for) {
            <span class="gate-config__field-label">Iteration source</span>
            <nx-expression-builder
              [mode]="'raw'"
              [variables]="availableProperties()"
              [operators]="conditionOperators"
              [value]="condition()"
              (valueChange)="onExpressionChange($event)" />
            <label class="gate-config__field-label" for="gate-track-input">Track expression</label>
            <input id="gate-track-input" type="text" class="gate-config__track-input"
                   aria-label="Track expression"
                   [value]="trackExpression()"
                   (input)="onTrackInput($event)"
                   placeholder="e.g. item.id" />
          }
          @case (GateType.switch) {
            <span class="gate-config__field-label">Switch on property</span>
            <nx-expression-builder
              [mode]="'raw'"
              [variables]="availableProperties()"
              [operators]="conditionOperators"
              [value]="condition()"
              (valueChange)="onExpressionChange($event)" />
            <p class="gate-config__hint">Case lanes are assigned automatically from unique property values.</p>
          }
        }
      </div>

      <div class="gate-config__footer">
        <button type="button" class="gate-config__cancel-btn" (click)="onCancel()">
          Cancel
        </button>
        <button type="button" class="gate-config__apply-btn" (click)="onApply()">
          Apply
        </button>
      </div>
    </div>
  `,
  styleUrl: './gate-config.scss',
})
export class FlowCommanderGateConfigComponent {
  // Template access to enum
  protected readonly GateType = GateType;

  // Inputs
  readonly gateType = input.required<GateType>();
  readonly currentCondition = input<string>('');
  readonly availableProperties = input<string[]>([]);
  readonly tierMode = input<'guided' | 'raw'>('guided');

  // Outputs
  readonly conditionApplied = output<string>();
  readonly cancelled = output<void>();

  // Internal state
  readonly condition = signal('');
  readonly trackExpression = signal('');

  // Computed
  readonly gateLabel = computed(() => GATE_LABELS[this.gateType()]);
  readonly gateColor = computed(() => GATE_TYPE_COLORS[this.gateType()]);

  // Constants for template
  readonly conditionOperators = ['===', '!=='];

  constructor() {
    effect(() => {
      const incoming = this.currentCondition();
      const type = this.gateType();

      if (type === GateType.for) {
        const separator = '; track ';
        const sepIndex = incoming.indexOf(separator);
        if (sepIndex >= 0) {
          this.condition.set(incoming.slice(0, sepIndex));
          this.trackExpression.set(incoming.slice(sepIndex + separator.length));
        } else {
          this.condition.set(incoming);
          this.trackExpression.set('');
        }
      } else {
        this.condition.set(incoming);
      }
    }, { allowSignalWrites: true });
  }

  onExpressionChange(expr: string): void {
    this.condition.set(expr);
  }

  onTrackInput(event: Event): void {
    this.trackExpression.set((event.target as HTMLInputElement).value);
  }

  onApply(): void {
    const type = this.gateType();

    if (type === GateType.for) {
      const track = this.trackExpression();
      const cond = this.condition();
      this.conditionApplied.emit(track ? cond + '; track ' + track : cond);
    } else {
      this.conditionApplied.emit(this.condition());
    }
  }

  onCancel(): void {
    this.cancelled.emit();
  }
}
