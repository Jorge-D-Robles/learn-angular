import {
  Component,
  computed,
  effect,
  input,
  output,
  signal,
} from '@angular/core';
import { CodeEditorComponent } from '../../../../shared/components/code-editor/code-editor';
import type { RouteEntry } from '../corridor-runner.types';

@Component({
  selector: 'app-corridor-runner-route-editor',
  imports: [CodeEditorComponent],
  template: `
    <div class="cr-route-editor">
      <nx-code-editor
        [code]="routeConfigText()"
        language="json"
        [highlightLines]="errorLineNumbers()"
        (codeChange)="onCodeChange($event)" />

      @if (parseError()) {
        <div class="cr-route-editor__error" role="alert">
          {{ parseError() }}
        </div>
      }

      @if (validationErrors().length > 0) {
        <ul class="cr-route-editor__validation-errors" role="alert">
          @for (err of validationErrors(); track err) {
            <li>{{ err }}</li>
          }
        </ul>
      }

      <button type="button"
              class="cr-route-editor__lock-btn"
              [disabled]="hasErrors() || disabled()"
              (click)="onLockRoutes()">
        Lock Routes
      </button>
    </div>
  `,
  styleUrl: './route-editor.scss',
})
export class CorridorRunnerRouteEditorComponent {
  // --- Inputs ---
  readonly initialConfig = input<RouteEntry[]>([]);
  readonly availableComponents = input<string[]>([]);
  readonly disabled = input(false);

  // --- Outputs ---
  readonly configChanged = output<RouteEntry[]>();
  readonly configSubmitted = output<void>();

  // --- Internal state ---
  readonly routeConfigText = signal('');
  readonly parseError = signal<string | null>(null);
  readonly validationErrors = signal<string[]>([]);

  // --- Computed ---
  readonly hasErrors = computed(
    () => !!this.parseError() || this.validationErrors().length > 0,
  );

  readonly errorLineNumbers = computed<number[]>(() => {
    const errors = this.validationErrors();
    if (errors.length === 0) return [];

    const lines = this.routeConfigText().split('\n');
    const entryStartLines: number[] = [];

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trimStart().startsWith('{')) {
        entryStartLines.push(i + 1); // 1-based line numbers
      }
    }

    const result: number[] = [];
    for (const err of errors) {
      const match = err.match(/^Entry (\d+):/);
      if (match) {
        const entryIndex = parseInt(match[1], 10) - 1;
        if (entryIndex < entryStartLines.length) {
          result.push(entryStartLines[entryIndex]);
        }
      }
    }
    return result;
  });

  // --- Seeding flag ---
  private _seeded = false;

  constructor() {
    effect(() => {
      const config = this.initialConfig();
      if (config.length > 0 && !this._seeded) {
        this._seeded = true;
        this.routeConfigText.set(JSON.stringify(config, null, 2));
      }
    });
  }

  // --- Methods ---

  onCodeChange(text: string): void {
    this.routeConfigText.set(text);

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      this.parseError.set('Invalid JSON');
      this.validationErrors.set([]);
      return;
    }

    if (!Array.isArray(parsed)) {
      this.parseError.set('Must be an array');
      this.validationErrors.set([]);
      return;
    }

    this.parseError.set(null);

    const available = this.availableComponents();
    const errors: string[] = [];

    for (let i = 0; i < parsed.length; i++) {
      const entry = parsed[i] as Record<string, unknown>;
      const entryNum = i + 1;

      if (typeof entry['path'] !== 'string') {
        errors.push(`Entry ${entryNum}: missing 'path'`);
      }

      if (
        entry['component'] &&
        available.length > 0 &&
        !available.includes(entry['component'] as string)
      ) {
        errors.push(`Entry ${entryNum}: unknown component '${entry['component']}'`);
      }

      if (entry['redirectTo'] !== undefined && !entry['pathMatch']) {
        errors.push(`Entry ${entryNum}: 'redirectTo' requires 'pathMatch'`);
      }
    }

    this.validationErrors.set(errors);

    if (errors.length === 0) {
      this.configChanged.emit(parsed as RouteEntry[]);
    }
  }

  onLockRoutes(): void {
    if (!this.hasErrors() && !this.disabled()) {
      this.configSubmitted.emit();
    }
  }
}
