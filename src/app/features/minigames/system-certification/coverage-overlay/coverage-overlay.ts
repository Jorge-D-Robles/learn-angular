import { Component, computed, input, output } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import type { SourceCodeLine, CoverageResult, CoverageLineState } from '../system-certification.types';

@Component({
  selector: 'app-coverage-overlay',
  imports: [DecimalPipe],
  template: `
    <div class="coverage-overlay">
      <button
        class="coverage-overlay__toggle"
        type="button"
        (click)="visibilityToggled.emit()"
      >
        {{ isVisible() ? 'Hide Coverage' : 'Show Coverage' }}
      </button>

      @if (coverageResult()) {
        <div class="coverage-overlay__gauge">
          <div class="coverage-overlay__gauge-track">
            <div
              class="coverage-overlay__gauge-fill"
              [style.width.%]="coverageResult()!.percentage"
            ></div>
          </div>
          <span class="coverage-overlay__gauge-label">
            {{ coverageResult()!.percentage | number:'1.0-0' }}%
          </span>
        </div>
      }

      @if (isVisible()) {
        <div class="coverage-overlay__source">
          @for (line of sourceLines(); track line.lineNumber) {
            <div
              class="coverage-overlay__line"
              [class.coverage-overlay__line--hint-pulse]="line.lineNumber === hintLineNumber() && isUncovered(line.lineNumber)"
              role="button"
              tabindex="0"
              (click)="lineClicked.emit(line.lineNumber)"
              (keydown.enter)="lineClicked.emit(line.lineNumber)"
              (keydown.space)="lineClicked.emit(line.lineNumber)"
            >
              <span class="coverage-overlay__line-number">{{ line.lineNumber }}</span>
              <span
                class="coverage-overlay__gutter"
                [class.coverage-overlay__gutter--covered]="getLineState(line) === 'covered'"
                [class.coverage-overlay__gutter--uncovered]="getLineState(line) === 'uncovered'"
                [class.coverage-overlay__gutter--partial]="getLineState(line) === 'partial'"
              ></span>
              <span class="coverage-overlay__content">{{ line.content }}</span>
            </div>
          }
        </div>
      }
    </div>
  `,
  styleUrl: './coverage-overlay.scss',
})
export class CoverageOverlayComponent {
  readonly sourceLines = input.required<readonly SourceCodeLine[]>();
  readonly coverageResult = input<CoverageResult | null>(null);
  readonly isVisible = input(true);
  readonly hintLineNumber = input<number | null>(null);

  readonly lineClicked = output<number>();
  readonly visibilityToggled = output<void>();

  private readonly uncoveredSet = computed(() => {
    const result = this.coverageResult();
    if (!result) return new Set<number>();
    return new Set(result.uncoveredLineNumbers);
  });

  isUncovered(lineNumber: number): boolean {
    return this.uncoveredSet().has(lineNumber);
  }

  getLineState(line: SourceCodeLine): CoverageLineState | null {
    const result = this.coverageResult();
    if (!result || !line.isTestable) return null;

    if (this.uncoveredSet().has(line.lineNumber)) {
      return 'uncovered';
    }

    if (line.isBranch) {
      return 'partial';
    }

    return 'covered';
  }
}
