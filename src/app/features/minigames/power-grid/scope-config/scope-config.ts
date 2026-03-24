import { Component, computed, effect, input, output, signal } from '@angular/core';
import type {
  ComponentNode,
  InjectionScope,
  ScopeRule,
  ServiceNode,
} from '../power-grid.types';
import { isScopeAllowed } from '../power-grid.types';
import { SCOPE_COLORS } from '../power-grid.component';

const SCOPE_OPTIONS: { value: InjectionScope; label: string }[] = [
  { value: 'root', label: 'Root' },
  { value: 'component', label: 'Component' },
  { value: 'hierarchical', label: 'Hierarchical' },
];

@Component({
  selector: 'app-scope-config',
  template: `
    <div class="scope-config__header">
      <span class="scope-config__service-name">{{ service().name }}</span>
      <span class="scope-config__service-type">{{ service().type }}</span>
    </div>
    <div class="scope-config__scopes">
      @for (opt of scopeOptions; track opt.value) {
        <button
          class="scope-config__scope-btn"
          [class.scope-config__scope-btn--active]="selectedScope() === opt.value"
          [style.border-color]="scopeColors[opt.value]"
          (click)="selectScope(opt.value)"
        >
          {{ opt.label }}
        </button>
      }
    </div>
    @if (showWarning()) {
      <div class="scope-config__warning">
        Short circuit — scope not allowed for this service
      </div>
    }
    <div class="scope-config__targets">
      @for (target of validTargets(); track target.id) {
        <button
          class="scope-config__target-btn"
          (click)="requestConnection(target.id)"
        >
          {{ target.name }}
        </button>
      } @empty {
        <div class="scope-config__empty">No valid targets</div>
      }
    </div>
  `,
  styleUrl: './scope-config.scss',
})
export class PowerGridScopeConfigComponent {
  // Inputs
  readonly service = input.required<ServiceNode>();
  readonly scopeRules = input.required<readonly ScopeRule[]>();
  readonly availableComponents = input.required<readonly ComponentNode[]>();

  // Outputs
  readonly scopeChanged = output<InjectionScope>();
  readonly connectionRequested = output<{
    serviceId: string;
    componentId: string;
    scope: InjectionScope;
  }>();

  // Internal state
  readonly selectedScope = signal<InjectionScope>('root');

  // Constants exposed to template
  readonly scopeOptions = SCOPE_OPTIONS;
  readonly scopeColors = SCOPE_COLORS;

  // Sync selectedScope when service input changes
  constructor() {
    effect(() => {
      this.selectedScope.set(this.service().providedIn);
    });
  }

  // Computed: is the current scope valid per scope rules?
  readonly isScopeValid = computed(() =>
    isScopeAllowed(this.service().id, this.selectedScope(), this.scopeRules()),
  );

  // Computed: show warning when scope is disallowed
  readonly showWarning = computed(() => !this.isScopeValid());

  // Computed: valid connection targets
  readonly validTargets = computed(() => {
    if (!this.isScopeValid()) return [];
    const serviceId = this.service().id;
    return this.availableComponents().filter(c =>
      c.requiredInjections.includes(serviceId),
    );
  });

  selectScope(scope: InjectionScope): void {
    this.selectedScope.set(scope);
    this.scopeChanged.emit(scope);
  }

  requestConnection(componentId: string): void {
    this.connectionRequested.emit({
      serviceId: this.service().id,
      componentId,
      scope: this.selectedScope(),
    });
  }
}
