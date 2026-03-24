import {
  Component,
  computed,
  effect,
  input,
  output,
  signal,
} from '@angular/core';
import { ExpressionBuilderComponent } from '../../../../shared/components/expression-builder/expression-builder';
import type {
  ComputedNode,
  EffectNode,
  ReactorNodeType,
  SignalNode,
} from '../reactor-core.types';

/** Color map for the 3 primary reactor node types. */
export const NODE_TYPE_COLORS: Record<
  Extract<ReactorNodeType, 'signal' | 'computed' | 'effect'>,
  string
> = {
  signal: '#3B82F6',
  computed: '#22C55E',
  effect: '#F97316',
};

const EXPRESSION_OPERATORS = ['+', '-', '*', '/', '===', '!==', '>', '<', '>=', '<='];

@Component({
  selector: 'app-node-config',
  imports: [ExpressionBuilderComponent],
  template: `
    <div class="node-config__header">
      <span
        class="node-config__type-indicator"
        [style.background-color]="nodeTypeColor()"
      ></span>
      <span class="node-config__label">{{ node().label }}</span>
      <span class="node-config__type-badge">{{ node().type }}</span>
    </div>
    <div class="node-config__body">
      @switch (node().type) {
        @case ('signal') {
          <div class="node-config__type-selector">
            @for (t of valueTypes; track t) {
              <button
                class="node-config__type-btn"
                [class.node-config__type-btn--active]="editingValueType() === t"
                (click)="onValueTypeChange(t)"
              >{{ t }}</button>
            }
          </div>
          <span class="node-config__field-label">Value</span>
          @if (editingValueType() === 'boolean') {
            <label class="node-config__bool-label">
              <input
                type="checkbox"
                class="node-config__value-input"
                [checked]="editingValue() === true || editingValue() === 'true'"
                (change)="onBooleanChange($event)"
              />
              {{ editingValue() }}
            </label>
          } @else {
            <label class="node-config__input-label">
              <input
                [type]="editingValueType() === 'number' ? 'number' : 'text'"
                class="node-config__value-input"
                [value]="editingValue()"
                (input)="onValueChange($event)"
              />
            </label>
          }
        }
        @case ('computed') {
          <nx-expression-builder
            [variables]="availableDependencies()"
            [operators]="expressionOperators"
            [value]="editingExpression()"
            mode="raw"
            (expressionChange)="onExpressionChange($event)"
          />
          <div class="node-config__dependencies">
            <span class="node-config__field-label">Dependencies</span>
            @for (dep of availableDependencies(); track dep) {
              <label class="node-config__dep-item">
                <input
                  type="checkbox"
                  [checked]="editingDependencyIds().includes(dep)"
                  (change)="onDependencyToggle(dep, $event)"
                />
                {{ dep }}
              </label>
            }
          </div>
        }
        @case ('effect') {
          <label class="node-config__field-label">Action description
            <textarea
              class="node-config__action-textarea"
              [value]="editingAction()"
              (input)="onActionChange($event)"
            ></textarea>
          </label>
          <label class="node-config__cleanup-toggle">
            <input
              type="checkbox"
              [checked]="editingCleanup()"
              (change)="onCleanupToggle()"
            />
            Requires cleanup
          </label>
          <div class="node-config__dependencies">
            <span class="node-config__field-label">Dependencies</span>
            @for (dep of availableDependencies(); track dep) {
              <label class="node-config__dep-item">
                <input
                  type="checkbox"
                  [checked]="editingDependencyIds().includes(dep)"
                  (change)="onDependencyToggle(dep, $event)"
                />
                {{ dep }}
              </label>
            }
          </div>
        }
        @default {
          <div class="node-config__no-config">Node type not configurable</div>
        }
      }
    </div>
    <div class="node-config__actions">
      <button class="node-config__apply-btn" (click)="onApply()">Apply</button>
      <button class="node-config__cancel-btn" (click)="onCancel()">Cancel</button>
    </div>
  `,
  styleUrl: './node-config.scss',
})
export class ReactorCoreNodeConfigComponent {
  // Inputs
  readonly node = input.required<SignalNode | ComputedNode | EffectNode>();
  readonly availableDependencies = input.required<string[]>();

  // Outputs
  readonly nodeConfigured = output<SignalNode | ComputedNode | EffectNode>();
  readonly cancelled = output<void>();

  // Internal editing state (only 6 signals per reviewer override)
  readonly editingValue = signal<string | number | boolean>(0);
  readonly editingValueType = signal<'string' | 'number' | 'boolean'>('string');
  readonly editingExpression = signal('');
  readonly editingAction = signal('');
  readonly editingCleanup = signal(false);
  readonly editingDependencyIds = signal<string[]>([]);

  // Constants exposed to template
  readonly valueTypes: ('string' | 'number' | 'boolean')[] = ['string', 'number', 'boolean'];
  readonly expressionOperators = EXPRESSION_OPERATORS;

  // Computed: type indicator color
  readonly nodeTypeColor = computed(
    () => NODE_TYPE_COLORS[this.node().type as keyof typeof NODE_TYPE_COLORS] ?? '#3B82F6',
  );

  constructor() {
    effect(() => {
      const n = this.node();
      switch (n.type) {
        case 'signal':
          this.editingValue.set(n.initialValue);
          this.editingValueType.set(typeof n.initialValue as 'string' | 'number' | 'boolean');
          break;
        case 'computed':
          this.editingExpression.set(n.computationExpr);
          this.editingDependencyIds.set([...n.dependencyIds]);
          break;
        case 'effect':
          this.editingAction.set(n.actionDescription);
          this.editingDependencyIds.set([...n.dependencyIds]);
          this.editingCleanup.set(n.requiresCleanup ?? false);
          break;
      }
    }, { allowSignalWrites: true });
  }

  onValueChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.editingValue.set(input.value);
  }

  onBooleanChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.editingValue.set(input.checked);
  }

  onValueTypeChange(type: 'string' | 'number' | 'boolean'): void {
    this.editingValueType.set(type);
  }

  onExpressionChange(expr: string): void {
    this.editingExpression.set(expr);
  }

  onActionChange(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    this.editingAction.set(textarea.value);
  }

  onCleanupToggle(): void {
    this.editingCleanup.update(v => !v);
  }

  onDependencyToggle(dep: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.editingDependencyIds.update(ids =>
      checked ? [...ids, dep] : ids.filter(id => id !== dep),
    );
  }

  onApply(): void {
    const n = this.node();
    switch (n.type) {
      case 'signal': {
        const coerced = this.coerceValue();
        this.nodeConfigured.emit({ ...n, initialValue: coerced });
        break;
      }
      case 'computed':
        this.nodeConfigured.emit({
          ...n,
          computationExpr: this.editingExpression(),
          dependencyIds: this.editingDependencyIds(),
        });
        break;
      case 'effect':
        this.nodeConfigured.emit({
          ...n,
          actionDescription: this.editingAction(),
          dependencyIds: this.editingDependencyIds(),
          requiresCleanup: this.editingCleanup(),
        });
        break;
      default:
        // No-op for unsupported types
        break;
    }
  }

  onCancel(): void {
    this.cancelled.emit();
  }

  private coerceValue(): string | number | boolean {
    const raw = this.editingValue();
    switch (this.editingValueType()) {
      case 'number':
        return parseFloat(String(raw));
      case 'boolean':
        return raw === 'true' || raw === true;
      case 'string':
        return String(raw);
    }
  }
}
