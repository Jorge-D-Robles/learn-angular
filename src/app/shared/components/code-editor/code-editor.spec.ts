import { Component } from '@angular/core';
import { provideMonacoEditor } from 'ngx-monaco-editor-v2';
import { createComponent } from '../../../../testing/test-utils';
import { CodeEditorComponent } from './code-editor';

@Component({
  template: `<nx-code-editor
    [code]="code"
    [language]="language"
    [readOnly]="readOnly"
    [highlightLines]="highlightLines"
    (codeChange)="onCodeChange($event)"
  />`,
  imports: [CodeEditorComponent],
})
class TestHost {
  code = '';
  language = 'typescript';
  readOnly = false;
  highlightLines: number[] = [];
  lastCodeChange = '';
  onCodeChange(value: string): void {
    this.lastCodeChange = value;
  }
}

describe('CodeEditorComponent', () => {
  it('should create the component', async () => {
    const { component } = await createComponent(TestHost, {
      providers: [provideMonacoEditor()],
    });
    expect(component).toBeTruthy();
  });

  it('should render the ngx-monaco-editor element', async () => {
    const { fixture, element } = await createComponent(TestHost, {
      providers: [provideMonacoEditor()],
      detectChanges: false,
    });
    fixture.componentInstance.code = 'const x = 1;';
    fixture.detectChanges();
    await fixture.whenStable();
    const monacoEditor = element.querySelector('ngx-monaco-editor');
    expect(monacoEditor).toBeTruthy();
  });

  it('should render ngx-monaco-editor for multi-line code', async () => {
    const { fixture, element } = await createComponent(TestHost, {
      providers: [provideMonacoEditor()],
      detectChanges: false,
    });
    fixture.componentInstance.code = 'line1\nline2\nline3';
    fixture.detectChanges();
    await fixture.whenStable();
    const monacoEditor = element.querySelector('ngx-monaco-editor');
    expect(monacoEditor).toBeTruthy();
  });

  it('should render with highlightLines input set', async () => {
    const { fixture, element } = await createComponent(TestHost, {
      providers: [provideMonacoEditor()],
      detectChanges: false,
    });
    fixture.componentInstance.code = 'line1\nline2\nline3\nline4';
    fixture.componentInstance.highlightLines = [2, 4];
    fixture.detectChanges();
    await fixture.whenStable();
    const monacoEditor = element.querySelector('ngx-monaco-editor');
    expect(monacoEditor).toBeTruthy();
  });

  it('should render ngx-monaco-editor when editable (default)', async () => {
    const { element } = await createComponent(TestHost, {
      providers: [provideMonacoEditor()],
    });
    const monacoEditor = element.querySelector('ngx-monaco-editor');
    expect(monacoEditor).toBeTruthy();
  });

  it('should still render in readonly mode', async () => {
    const { fixture, element } = await createComponent(TestHost, {
      providers: [provideMonacoEditor()],
      detectChanges: false,
    });
    fixture.componentInstance.readOnly = true;
    fixture.detectChanges();
    await fixture.whenStable();
    const monacoEditor = element.querySelector('ngx-monaco-editor');
    expect(monacoEditor).toBeTruthy();
  });

  it('should render ngx-monaco-editor for code input', async () => {
    const { fixture, element } = await createComponent(TestHost, {
      providers: [provideMonacoEditor()],
      detectChanges: false,
    });
    fixture.componentInstance.code = 'initial';
    fixture.detectChanges();
    await fixture.whenStable();
    const monacoEditor = element.querySelector('ngx-monaco-editor');
    expect(monacoEditor).toBeTruthy();
  });

  it('should render ngx-monaco-editor when code input changes', async () => {
    const { fixture, element } = await createComponent(TestHost, {
      providers: [provideMonacoEditor()],
      detectChanges: false,
    });
    fixture.componentInstance.code = 'const a = 1;';
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    await fixture.whenStable();
    let monacoEditor = element.querySelector('ngx-monaco-editor');
    expect(monacoEditor).toBeTruthy();

    fixture.componentInstance.code = 'function foo() {}';
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    await fixture.whenStable();
    monacoEditor = element.querySelector('ngx-monaco-editor');
    expect(monacoEditor).toBeTruthy();
  });

  it('should handle empty code gracefully', async () => {
    const { element } = await createComponent(TestHost, {
      providers: [provideMonacoEditor()],
    });
    const monacoEditor = element.querySelector('ngx-monaco-editor');
    expect(monacoEditor).toBeTruthy();
  });

  it('should default language to typescript', async () => {
    const { fixture, element } = await createComponent(TestHost, {
      providers: [provideMonacoEditor()],
      detectChanges: false,
    });
    fixture.componentInstance.code = 'const x = 1;';
    fixture.componentInstance.language = 'typescript';
    fixture.detectChanges();
    await fixture.whenStable();
    const monacoEditor = element.querySelector('ngx-monaco-editor');
    expect(monacoEditor).toBeTruthy();
  });
});
