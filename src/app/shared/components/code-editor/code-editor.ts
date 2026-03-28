import {
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  linkedSignal,
  output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EditorComponent } from 'ngx-monaco-editor-v2';

const AUTO_HEIGHT_LINE_LIMIT = 25;

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
  private readonly hostEl = inject(ElementRef).nativeElement as HTMLElement;

  readonly code = input<string>('');
  readonly language = input<string>('typescript');
  readonly readOnly = input<boolean>(false);
  readonly highlightLines = input<number[]>([]);

  readonly codeChange = output<string>();

  /** Internal editable code — syncs from input, updated locally on typing. */
  readonly editableCode = linkedSignal(() => this.code());

  private editorInstance: import('monaco-editor').editor.IStandaloneCodeEditor | null = null;
  private decorationCollection: import('monaco-editor').editor.IEditorDecorationsCollection | null = null;

  /** True when code is short enough to show without scrolling. */
  private readonly autoHeight = computed(() => {
    const lineCount = (this.code().match(/\n/g) || []).length + 1;
    return lineCount <= AUTO_HEIGHT_LINE_LIMIT;
  });

  readonly editorOptions = computed(() => {
    const auto = this.autoHeight();
    return {
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
        vertical: (auto ? 'hidden' : 'auto') as 'hidden' | 'auto',
        horizontal: 'auto' as const,
      },
    };
  });

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

    if (this.autoHeight()) {
      this.fitToContent(editor);
      editor.onDidContentSizeChange(() => this.fitToContent(editor));
    }
  }

  /** Resize the host element to match Monaco's content height. */
  private fitToContent(editor: import('monaco-editor').editor.IStandaloneCodeEditor): void {
    const contentHeight = editor.getContentHeight();
    this.hostEl.style.height = `${contentHeight}px`;
    editor.layout();
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
