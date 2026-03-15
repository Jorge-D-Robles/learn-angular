import {
  Component,
  OnDestroy,
  computed,
  inject,
  signal,
} from '@angular/core';
import { MINIGAME_ENGINE } from '../../../core/minigame/minigame-engine.tokens';
import { KeyboardShortcutService } from '../../../core/minigame/keyboard-shortcut.service';
import { TerminalHackCodePanelComponent } from './code-panel/code-panel';
import { TerminalHackLivePreviewComponent } from './live-preview/live-preview';
import { TerminalHackTestRunnerComponent } from './test-runner/test-runner';
import {
  TerminalHackEngine,
  HINT_SCORE_PENALTY,
  type PlayerFormElement,
  type FormPreview,
} from './terminal-hack.engine';
import type {
  FormElementType,
  FormToolType,
} from './terminal-hack.types';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

@Component({
  selector: 'app-terminal-hack',
  imports: [TerminalHackCodePanelComponent, TerminalHackLivePreviewComponent, TerminalHackTestRunnerComponent],
  templateUrl: './terminal-hack.component.html',
  styleUrl: './terminal-hack.component.scss',
})
export class TerminalHackComponent implements OnDestroy {
  private readonly engine = inject(MINIGAME_ENGINE, { optional: true }) as TerminalHackEngine | null;
  private readonly shortcuts = inject(KeyboardShortcutService);

  // --- Local UI state ---
  readonly selectedSlotId = signal<string | null>(null);
  readonly revealedHintCount = signal(0);
  readonly playerCode = signal('');
  readonly isTestsRunning = signal(false);

  // --- Engine-delegated signals (null-safe) ---
  readonly targetFormSpec = computed(() => this.engine?.targetFormSpec() ?? null);
  readonly placedElements = computed(() => this.engine?.placedElements() ?? new Map<string, PlayerFormElement>());
  readonly placedElementsArray = computed(() => Array.from(this.placedElements().values()));
  readonly formPreview = computed<FormPreview>(() =>
    this.engine?.formPreview() ?? { elements: [], formType: 'reactive', isComplete: false, completionRatio: 0 },
  );
  readonly testRunResult = computed(() => this.engine?.testRunResult() ?? null);
  readonly availableElements = computed<FormToolType[]>(() => [...(this.engine?.availableElements() ?? [])]);
  readonly localTimeRemaining = computed(() => this.engine?.localTimeRemaining() ?? 0);
  readonly timeLimit = computed(() => this.engine?.timeLimit() ?? 0);
  readonly levelHints = computed(() => this.engine?.levelHints() ?? []);
  readonly hintsUsedCount = computed(() => this.engine?.hintsUsedCount() ?? 0);
  readonly testCasesForRunner = computed(() => [...(this.engine?.testCases() ?? [])]);

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

  readonly placedElementIds = computed(() => new Set(this.placedElements().keys()));

  readonly completionPercent = computed(() => Math.round(this.formPreview().completionRatio * 100));

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

  onCodeChange(code: string): void {
    this.playerCode.set(code);
  }

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
    this.isTestsRunning.set(true);
    this.engine.runTestCases();
    setTimeout(() => this.isTestsRunning.set(false), 0);
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

}
