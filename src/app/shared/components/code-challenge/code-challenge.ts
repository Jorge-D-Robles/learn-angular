import {
  Component,
  computed,
  effect,
  inject,
  input,
  linkedSignal,
  output,
  signal,
  untracked,
} from '@angular/core';
import type {
  CodeChallengeStep,
  CodeChallengeValidationResult,
} from '../../../core/curriculum/story-mission-content.types';
import { CodeChallengeValidationService } from '../../../core/curriculum/code-challenge-validation.service';
import { CodeEditorComponent } from '../code-editor/code-editor';

@Component({
  selector: 'nx-code-challenge',
  imports: [CodeEditorComponent],
  host: { '(keydown)': 'onKeydown($event)' },
  template: `
    <div class="code-challenge">
      <!-- Prompt -->
      <div class="code-challenge__prompt" [innerHTML]="challenge().prompt"></div>

      <!-- Editor -->
      <nx-code-editor
        [code]="currentCode()"
        [language]="challenge().language"
        [readOnly]="isEditorReadOnly()"
        (codeChange)="onCodeChange($event)" />

      <!-- Actions row -->
      <div class="code-challenge__actions">
        <button type="button" class="code-challenge__submit"
                [disabled]="state() === 'passed' || currentCode().trim() === ''"
                (click)="submit()"
                aria-label="Check code">
          Check Code
        </button>
        @if (attempts() > 0) {
          <span class="code-challenge__attempts">Attempt {{ attempts() }}</span>
        }
      </div>

      <!-- Feedback -->
      @if (state() === 'failed' && lastResult(); as result) {
        <div class="code-challenge__feedback code-challenge__feedback--error" role="status" aria-live="polite">
          <ul>
            @for (error of result.errors; track error) {
              <li>{{ error }}</li>
            }
          </ul>
        </div>
      }

      @if (state() === 'passed') {
        <div class="code-challenge__feedback code-challenge__feedback--success" role="status" aria-live="polite">
          {{ challenge().successMessage }}
        </div>
      }

      <!-- Hints -->
      @if (canShowHints() && state() !== 'passed') {
        <div class="code-challenge__hints">
          @if (remainingHints() > 0) {
            <button type="button" class="code-challenge__hint-btn" (click)="revealHint()">
              Show Hint ({{ remainingHints() }} remaining)
            </button>
          }
          @if (visibleHints().length > 0) {
            <ul class="code-challenge__hint-list">
              @for (hint of visibleHints(); track $index) {
                <li>{{ hint }}</li>
              }
            </ul>
          }
        </div>
      }

      <!-- Explanation (after pass) -->
      @if (state() === 'passed') {
        <div class="code-challenge__explanation">
          {{ challenge().explanation }}
        </div>
      }
    </div>
  `,
  styleUrl: './code-challenge.scss',
})
export class CodeChallengeComponent {
  private readonly validationService = inject(CodeChallengeValidationService);

  readonly challenge = input.required<CodeChallengeStep>();
  readonly challengeIndex = input<number>(0);
  readonly challengeCompleted = output<void>();

  readonly state = signal<'editing' | 'failed' | 'passed'>('editing');
  readonly currentCode = linkedSignal(() => this.challenge().starterCode);
  readonly attempts = signal(0);
  readonly hintsRevealed = signal(0);
  readonly lastResult = signal<CodeChallengeValidationResult | null>(null);

  readonly isEditorReadOnly = computed(() => this.state() === 'passed');
  readonly canShowHints = computed(() => this.attempts() >= 2 && (this.challenge().hints?.length ?? 0) > 0);
  readonly remainingHints = computed(() => (this.challenge().hints?.length ?? 0) - this.hintsRevealed());
  readonly visibleHints = computed(() => this.challenge().hints?.slice(0, this.hintsRevealed()) ?? []);

  constructor() {
    // Reset non-code state when challenge input changes
    effect(() => {
      this.challenge(); // track
      untracked(() => {
        this.state.set('editing');
        this.attempts.set(0);
        this.hintsRevealed.set(0);
        this.lastResult.set(null);
      });
    });
  }

  onCodeChange(code: string): void {
    this.currentCode.set(code);
  }

  submit(): void {
    if (this.state() === 'passed') return;
    const result = this.validationService.validateCode(
      this.currentCode(),
      this.challenge().validationRules,
    );
    this.attempts.update(a => a + 1);
    this.lastResult.set(result);
    if (result.valid) {
      this.state.set('passed');
      this.challengeCompleted.emit();
    } else {
      this.state.set('failed');
    }
  }

  revealHint(): void {
    if (this.remainingHints() > 0) {
      this.hintsRevealed.update(n => n + 1);
    }
  }

  onKeydown(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      this.submit();
    }
  }
}
