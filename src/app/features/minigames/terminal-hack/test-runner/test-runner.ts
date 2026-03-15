import {
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import type { FormTestCase } from '../terminal-hack.types';
import type { TestCaseResult } from '../terminal-hack.engine';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

@Component({
  selector: 'app-terminal-hack-test-runner',
  template: `
    <div class="test-runner"
         [class.test-runner--running]="isRunning()">

      @for (tc of testCases(); track tc.id; let i = $index) {
        <div class="test-runner__case"
             [class.test-runner__case--pass]="resultFor(tc.id)?.passed === true"
             [class.test-runner__case--fail]="resultFor(tc.id)?.passed === false"
             [class.test-runner__case--animating]="isRunning()"
             [style.animation-delay]="i * 80 + 'ms'">
          <span class="test-runner__description">{{ tc.description }}</span>
          <span class="test-runner__expected">{{ tc.expectedValid ? 'Valid' : 'Invalid' }}</span>
          @if (resultFor(tc.id); as result) {
            @if (result.passed) {
              <span class="test-runner__icon test-runner__icon--pass" aria-label="Passed">&#x2713;</span>
            } @else {
              <span class="test-runner__icon test-runner__icon--fail" aria-label="Failed">&#x2717;</span>
            }
          }
        </div>
      }

      @if (testResults() !== null) {
        <div class="test-runner__pass-rate">
          {{ passCount() }}/{{ totalCount() }} tests passed
        </div>
      }

      <button type="button"
              class="test-runner__run-btn"
              [disabled]="isRunning()"
              (click)="runTestsRequested.emit()">
        Run Tests
      </button>
    </div>
  `,
  styleUrl: './test-runner.scss',
})
export class TerminalHackTestRunnerComponent {
  // --- Inputs ---
  readonly testCases = input.required<FormTestCase[]>();
  readonly testResults = input<readonly TestCaseResult[] | null>(null);
  readonly isRunning = input<boolean>(false);

  // --- Outputs ---
  readonly runTestsRequested = output<void>();

  // --- Computed: result lookup map ---
  private readonly resultMap = computed(() => {
    const results = this.testResults();
    if (!results) return new Map<string, TestCaseResult>();
    const map = new Map<string, TestCaseResult>();
    for (const r of results) {
      map.set(r.testCaseId, r);
    }
    return map;
  });

  // --- Computed: pass count ---
  readonly passCount = computed(() => {
    const results = this.testResults();
    if (!results) return 0;
    return results.filter(r => r.passed).length;
  });

  // --- Computed: total count ---
  readonly totalCount = computed(() => {
    const results = this.testResults();
    if (!results) return 0;
    return results.length;
  });

  // --- Methods ---

  resultFor(testCaseId: string): TestCaseResult | undefined {
    return this.resultMap().get(testCaseId);
  }
}
