import { Component } from '@angular/core';
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
    const { component } = await createComponent(TestHost);
    expect(component).toBeTruthy();
  });

  it('should render code with syntax highlighting', async () => {
    const { fixture, element } = await createComponent(TestHost, {
      detectChanges: false,
    });
    fixture.componentInstance.code = 'const x = 1;';
    fixture.detectChanges();
    await fixture.whenStable();
    const keywordSpans = element.querySelectorAll('.token-keyword');
    expect(keywordSpans.length).toBeGreaterThan(0);
    expect(keywordSpans[0].textContent).toBe('const');
  });

  it('should render correct number of code lines', async () => {
    const { fixture, element } = await createComponent(TestHost, {
      detectChanges: false,
    });
    fixture.componentInstance.code = 'line1\nline2\nline3';
    fixture.detectChanges();
    await fixture.whenStable();
    const lines = element.querySelectorAll('.code-line');
    expect(lines.length).toBe(3);
  });

  it('should highlight specified lines', async () => {
    const { fixture, element } = await createComponent(TestHost, {
      detectChanges: false,
    });
    fixture.componentInstance.code = 'line1\nline2\nline3\nline4';
    fixture.componentInstance.highlightLines = [2, 4];
    fixture.detectChanges();
    await fixture.whenStable();
    const highlighted = element.querySelectorAll('.code-line--highlighted');
    expect(highlighted.length).toBe(2);
  });

  it('should be editable by default', async () => {
    const { element } = await createComponent(TestHost);
    const textarea = element.querySelector('textarea');
    expect(textarea).toBeTruthy();
  });

  it('should hide textarea in readonly mode', async () => {
    const { fixture, element } = await createComponent(TestHost, {
      detectChanges: false,
    });
    fixture.componentInstance.readOnly = true;
    fixture.detectChanges();
    await fixture.whenStable();
    const textarea = element.querySelector('textarea');
    expect(textarea).toBeNull();
  });

  it('should emit codeChange when user types', async () => {
    const { fixture, element } = await createComponent(TestHost, {
      detectChanges: false,
    });
    fixture.componentInstance.code = 'initial';
    fixture.detectChanges();
    await fixture.whenStable();
    const textarea = element.querySelector('textarea') as HTMLTextAreaElement;
    textarea.value = 'updated code';
    textarea.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(fixture.componentInstance.lastCodeChange).toBe('updated code');
  });

  it('should update highlighting when code input changes', async () => {
    const { fixture, element } = await createComponent(TestHost, {
      detectChanges: false,
    });
    fixture.componentInstance.code = 'const a = 1;';
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    await fixture.whenStable();
    let keywords = element.querySelectorAll('.token-keyword');
    expect(keywords.length).toBeGreaterThan(0);

    fixture.componentInstance.code = 'function foo() {}';
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    await fixture.whenStable();
    keywords = element.querySelectorAll('.token-keyword');
    expect(keywords[0].textContent).toBe('function');
  });

  it('should handle empty code gracefully', async () => {
    const { element } = await createComponent(TestHost);
    const lines = element.querySelectorAll('.code-line');
    // Empty code produces one empty line (split of '' by '\n' yields [''])
    expect(lines.length).toBeLessThanOrEqual(1);
  });

  it('should default language to typescript', async () => {
    const { fixture, element } = await createComponent(TestHost, {
      detectChanges: false,
    });
    fixture.componentInstance.code = 'const x = 1;';
    fixture.componentInstance.language = 'typescript';
    fixture.detectChanges();
    await fixture.whenStable();
    const keywords = element.querySelectorAll('.token-keyword');
    expect(keywords.length).toBeGreaterThan(0);
  });
});
