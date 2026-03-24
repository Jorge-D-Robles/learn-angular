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
import { CoverageOverlayComponent } from './coverage-overlay/coverage-overlay';
import { SystemCertificationTestRunnerServiceImpl } from './system-certification-test-runner.service';
import type { SystemCertificationEngine } from './system-certification.engine';
import type {
  CoverageResult,
  TestRunSummary,
  CertificationHint,
  SourceCodeBlock,
} from './system-certification.types';

@Component({
  selector: 'app-system-certification',
  imports: [
    CodeEditorComponent,
    CoverageOverlayComponent,
  ],
  providers: [SystemCertificationTestRunnerServiceImpl],
  templateUrl: './system-certification.component.html',
  styleUrl: './system-certification.component.scss',
})
export class SystemCertificationComponent implements OnDestroy {
  private readonly engine = inject(MINIGAME_ENGINE, { optional: true }) as SystemCertificationEngine | null;
  private readonly shortcuts = inject(KeyboardShortcutService);

  // Local state
  readonly coverageVisible = signal(false);

  // Computed from engine (null-safe)
  readonly sourceCode = computed<SourceCodeBlock | null>(() => this.engine?.sourceCode() ?? null);
  readonly testCode = computed(() => this.engine?.testCode() ?? '');
  readonly coverage = computed<CoverageResult | null>(() => this.engine?.coverage() ?? null);
  readonly testRunSummary = computed<TestRunSummary | null>(() => this.engine?.testRunSummary() ?? null);
  readonly testRunsRemaining = computed(() => this.engine?.testRunsRemaining() ?? 0);
  readonly hintsUsed = computed(() => this.engine?.hintsUsed() ?? 0);
  readonly hintsRevealed = computed<readonly CertificationHint[]>(() => this.engine?.hintsRevealed() ?? []);
  readonly engineStatus = computed(() => this.engine?.status() ?? null);

  // Derived signals
  readonly sourceCodeContent = computed(() => {
    const sc = this.sourceCode();
    if (!sc || sc.lines.length === 0) return '';
    return sc.lines.map(l => l.content).join('\n');
  });

  readonly sourceLines = computed(() => this.sourceCode()?.lines ?? []);

  readonly latestHintLineNumber = computed<number | null>(() => {
    const hints = this.hintsRevealed();
    if (hints.length === 0) return null;
    return hints[hints.length - 1].uncoveredLineNumber;
  });

  constructor() {
    if (!this.engine) return; // inert mode

    // Keyboard shortcuts
    this.shortcuts.register('r', 'Run Tests', () => this.onRunTests());
    this.shortcuts.register('h', 'Hint', () => this.onUseHint());
    this.shortcuts.register('c', 'Toggle Coverage', () => this.onToggleCoverage());
    this.shortcuts.register('escape', 'Close', () => this.onEscape());
  }

  // --- Public methods ---

  onTestCodeChange(code: string): void {
    if (!this.engine) return;
    this.engine.submitAction({ type: 'submit-test', testCode: code });
  }

  onRunTests(): void {
    if (!this.engine) return;
    this.engine.runTests();
  }

  onUseHint(): void {
    if (!this.engine) return;
    this.engine.submitAction({ type: 'use-hint' });
  }

  onToggleCoverage(): void {
    this.coverageVisible.update(v => !v);
  }

  onEscape(): void {
    if (this.coverageVisible()) {
      this.coverageVisible.set(false);
    }
  }

  ngOnDestroy(): void {
    this.shortcuts.unregister('r');
    this.shortcuts.unregister('h');
    this.shortcuts.unregister('c');
    this.shortcuts.unregister('escape');
  }
}
