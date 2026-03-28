import {
  Component,
  computed,
  ElementRef,
  input,
  linkedSignal,
  output,
  viewChild,
} from '@angular/core';
import { tokenize, Token } from './syntax-highlight';

interface CodeLine {
  readonly tokens: Token[];
  readonly highlighted: boolean;
}

@Component({
  selector: 'nx-code-editor',
  template: `
    <div class="code-editor">
      <pre class="code-display" #codeDisplay><code>@for (line of lines(); track $index) {<span class="code-line" [class.code-line--highlighted]="line.highlighted">@for (token of line.tokens; track $index) {<span [class]="'token-' + token.type">{{ token.text }}</span>}
</span>}
</code></pre>
      @if (!readOnly()) {
        <textarea
          class="code-textarea"
          [value]="editableCode()"
          (input)="onInput($event)"
          (scroll)="onScroll($event)"
          spellcheck="false"
          autocomplete="off"
        ></textarea>
      }
    </div>
  `,
  styleUrl: './code-editor.scss',
})
export class CodeEditorComponent {
  readonly code = input<string>('');
  readonly language = input<string>('typescript');
  readonly readOnly = input<boolean>(false);
  readonly highlightLines = input<number[]>([]);

  readonly codeChange = output<string>();

  readonly preRef = viewChild<ElementRef>('codeDisplay');

  /** Internal editable code — syncs from input, updated locally on typing. */
  readonly editableCode = linkedSignal(() => this.code());

  readonly lines = computed<CodeLine[]>(() => {
    const allTokens = tokenize(this.editableCode(), this.language());
    const highlightSet = new Set(this.highlightLines());

    // Split tokens into lines by splitting on '\n' within token text
    const result: CodeLine[] = [];
    let currentLineTokens: Token[] = [];

    for (const token of allTokens) {
      const parts = token.text.split('\n');
      for (let i = 0; i < parts.length; i++) {
        if (i > 0) {
          // Newline boundary: push current line and start a new one
          result.push({
            tokens: currentLineTokens,
            highlighted: highlightSet.has(result.length + 1),
          });
          currentLineTokens = [];
        }
        if (parts[i] !== '') {
          currentLineTokens.push({ text: parts[i], type: token.type });
        }
      }
    }

    // Push the final line
    result.push({
      tokens: currentLineTokens,
      highlighted: highlightSet.has(result.length + 1),
    });

    return result;
  });

  onInput(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    this.editableCode.set(textarea.value);
    this.codeChange.emit(textarea.value);
  }

  onScroll(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    const pre = this.preRef()?.nativeElement as HTMLElement | undefined;
    if (pre) {
      pre.scrollTop = textarea.scrollTop;
      pre.scrollLeft = textarea.scrollLeft;
    }
  }
}
