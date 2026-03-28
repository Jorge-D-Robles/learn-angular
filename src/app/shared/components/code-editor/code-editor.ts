import {
  Component,
  computed,
  effect,
  input,
  linkedSignal,
  output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EditorComponent } from 'ngx-monaco-editor-v2';

@Component({
  selector: 'nx-code-editor',
  imports: [FormsModule, EditorComponent],
  template: `
    <ngx-monaco-editor
      [options]="editorOptions()"
      [ngModel]="editableCode()"
      (ngModelChange)="onCodeChange($event)"
      (onInit)="onEditorInit($event)" />
  `,
  styleUrl: './code-editor.scss',
})
export class CodeEditorComponent {
  readonly code = input<string>('');
  readonly language = input<string>('typescript');
  readonly readOnly = input<boolean>(false);
  readonly highlightLines = input<number[]>([]);

  readonly codeChange = output<string>();

  /** Internal editable code — syncs from input, updated locally on typing. */
  readonly editableCode = linkedSignal(() => this.code());

  private editorInstance: import('monaco-editor').editor.IStandaloneCodeEditor | null = null;
  private decorationCollection: import('monaco-editor').editor.IEditorDecorationsCollection | null = null;

  readonly editorOptions = computed(() => ({
    theme: 'vs-dark',
    language: this.language(),
    readOnly: this.readOnly(),
    automaticLayout: true,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    fontSize: 14,
    tabSize: 2,
    lineNumbersMinChars: 3,
    renderLineHighlight: 'none' as const,
    overviewRulerLanes: 0,
    scrollbar: {
      vertical: 'auto' as const,
      horizontal: 'auto' as const,
    },
  }));

  constructor() {
    effect(() => {
      const lines = this.highlightLines();
      this.applyHighlightLines(lines);
    });
  }

  onCodeChange(value: string): void {
    this.editableCode.set(value);
    this.codeChange.emit(value);
  }

  onEditorInit(editor: import('monaco-editor').editor.IStandaloneCodeEditor): void {
    this.editorInstance = editor;
    this.applyHighlightLines(this.highlightLines());
  }

  private applyHighlightLines(lines: number[]): void {
    if (!this.editorInstance) return;

    const decorations = lines.map(line => ({
      range: {
        startLineNumber: line,
        startColumn: 1,
        endLineNumber: line,
        endColumn: 1,
      },
      options: {
        isWholeLine: true,
        className: 'nx-highlight-line',
      },
    }));

    if (this.decorationCollection) {
      this.decorationCollection.set(decorations);
    } else {
      this.decorationCollection =
        this.editorInstance.createDecorationsCollection(decorations);
    }
  }
}
