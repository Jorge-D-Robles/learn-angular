import {
  Component,
  OnDestroy,
  computed,
  inject,
  signal,
} from '@angular/core';
import { MINIGAME_ENGINE } from '../../../core/minigame/minigame-engine.tokens';
import { KeyboardShortcutService } from '../../../core/minigame/keyboard-shortcut.service';
import { CodeEditorComponent } from '../../../shared/components/code-editor/code-editor';
import {
  TerminalHackEngine,
  HINT_SCORE_PENALTY,
  type PlayerFormElement,
  type FormPreview,
} from './terminal-hack.engine';
import type {
  FormElementType,
  FormToolType,
  TargetFormSpec,
} from './terminal-hack.types';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

@Component({
  selector: 'app-terminal-hack',
  imports: [CodeEditorComponent],
  templateUrl: './terminal-hack.component.html',
  styleUrl: './terminal-hack.component.scss',
})
export class TerminalHackComponent implements OnDestroy {
  private readonly engine = inject(MINIGAME_ENGINE, { optional: true }) as TerminalHackEngine | null;
  private readonly shortcuts = inject(KeyboardShortcutService);

  // --- Local UI state ---
  readonly selectedSlotId = signal<string | null>(null);
  readonly revealedHintCount = signal(0);

  // --- Engine-delegated signals (null-safe) ---
  readonly targetFormSpec = computed(() => this.engine?.targetFormSpec() ?? null);
  readonly placedElements = computed(() => this.engine?.placedElements() ?? new Map<string, PlayerFormElement>());
  readonly formPreview = computed<FormPreview>(() =>
    this.engine?.formPreview() ?? { elements: [], formType: 'reactive', isComplete: false, completionRatio: 0 },
  );
  readonly testRunResult = computed(() => this.engine?.testRunResult() ?? null);
  readonly availableElements = computed(() => this.engine?.availableElements() ?? []);
  readonly localTimeRemaining = computed(() => this.engine?.localTimeRemaining() ?? 0);
  readonly timeLimit = computed(() => this.engine?.timeLimit() ?? 0);
  readonly levelHints = computed(() => this.engine?.levelHints() ?? []);
  readonly hintsUsedCount = computed(() => this.engine?.hintsUsedCount() ?? 0);

  // --- Derived signals (UI-only) ---
  readonly powerGaugeRatio = computed(() => {
    const limit = this.timeLimit();
    return limit > 0 ? this.localTimeRemaining() / limit : 1;
  });

  readonly powerGaugeColor = computed(() => {
    const ratio = this.powerGaugeRatio();
    if (ratio > 0.5) return '#00ff41';
    if (ratio > 0.25) return '#f97316';
    return '#ef4444';
  });

  readonly synthesizedCode = computed(() => {
    const spec = this.targetFormSpec();
    const placed = this.placedElements();
    if (!spec || placed.size === 0) return '// Place form elements to see code...';
    return this.buildFormCode(spec, placed);
  });

  readonly placedElementIds = computed(() => new Set(this.placedElements().keys()));

  readonly testResults = computed(() => this.testRunResult()?.testCaseResults ?? []);
  readonly allTestsPassed = computed(() => this.testRunResult()?.allPassed ?? false);
  readonly passRate = computed(() => this.testRunResult()?.passRate ?? 0);

  readonly canRunTests = computed(() => this.placedElements().size > 0);
  readonly passRatePercent = computed(() => Math.round(this.passRate() * 100));

  readonly completionPercent = computed(() => Math.round(this.formPreview().completionRatio * 100));

  readonly targetElements = computed(() => this.targetFormSpec()?.elements ?? []);
  readonly formName = computed(() => this.targetFormSpec()?.formName ?? '');
  readonly formType = computed(() => this.targetFormSpec()?.formType ?? 'reactive');

  readonly revealedHints = computed(() => {
    const count = this.revealedHintCount();
    return this.levelHints().slice(0, count);
  });

  readonly allHintsRevealed = computed(() => this.revealedHintCount() >= this.levelHints().length);

  readonly hintScorePenalty = HINT_SCORE_PENALTY;

  constructor() {
    if (!this.engine) return;

    this.shortcuts.register('enter', 'Run tests', () => this.onRunTests());
    this.shortcuts.register('escape', 'Reset', () => this.onReset());
  }

  // --- Public methods ---

  onSelectSlot(elementId: string): void {
    this.selectedSlotId.set(elementId);
  }

  onPlaceElement(elementId: string, elementType: FormElementType, toolType: FormToolType): void {
    this.engine?.submitAction({ type: 'place-element', elementId, elementType, toolType });
    this.selectedSlotId.set(null);
  }

  onToolSelected(toolType: FormToolType): void {
    const slotId = this.selectedSlotId();
    if (!slotId) return;
    const spec = this.targetFormSpec();
    if (!spec) return;
    const el = spec.elements.find(e => e.id === slotId);
    if (!el) return;
    this.onPlaceElement(slotId, el.elementType, toolType);
  }

  onRemoveElement(elementId: string): void {
    this.engine?.submitAction({ type: 'remove-element', elementId });
  }

  onRunTests(): void {
    if (!this.engine) return;
    this.engine.runTestCases();
  }

  onReset(): void {
    if (!this.engine) return;
    this.engine.reset();
    this.revealedHintCount.set(0);
    this.selectedSlotId.set(null);
  }

  onUseHint(): void {
    if (!this.engine) return;
    if (this.allHintsRevealed()) return;
    this.engine.recordHintUsed();
    this.revealedHintCount.update(c => c + 1);
  }

  ngOnDestroy(): void {
    this.shortcuts.unregister('enter');
    this.shortcuts.unregister('escape');
  }

  // --- Private helpers ---

  private buildFormCode(spec: TargetFormSpec, placed: ReadonlyMap<string, PlayerFormElement>): string {
    const lines: string[] = [];
    for (const [, el] of placed) {
      const specEl = spec.elements.find(e => e.id === el.elementId);
      const name = specEl?.name ?? el.elementId;
      const elType = el.elementType;
      const tool = el.toolType;

      if (tool === 'ngModel') {
        lines.push(`<input type="${elType}" [(ngModel)]="${name}">`);
      } else if (tool === 'FormControl') {
        lines.push(`<input type="${elType}" formControlName="${name}">`);
      } else {
        lines.push(`<input type="${elType}" [${tool}]="${name}">`);
      }
    }
    return lines.join('\n');
  }
}
