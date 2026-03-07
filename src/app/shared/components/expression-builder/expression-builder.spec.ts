import { Component } from '@angular/core';
import { createComponent } from '../../../../testing/test-utils';
import { ExpressionBuilderComponent } from './expression-builder';

@Component({
  template: `<nx-expression-builder
    [mode]="mode" [variables]="variables" [operators]="operators"
    [value]="value"
    (valueChange)="onValueChange($event)"
    (expressionChange)="onExpressionChange($event)"
  />`,
  imports: [ExpressionBuilderComponent],
})
class TestHost {
  mode: 'guided' | 'raw' = 'guided';
  variables = ['x', 'y', 'color'];
  operators = ['===', '!==', '>', '<'];
  value = '';
  onValueChange = vi.fn((v: string) => { this.value = v; });
  onExpressionChange = vi.fn();
}

describe('ExpressionBuilderComponent', () => {
  it('should create the component', async () => {
    const { component } = await createComponent(TestHost);
    expect(component).toBeTruthy();
  });

  it('should render left and operator dropdowns in guided mode', async () => {
    const { element } = await createComponent(TestHost);
    const leftSelect = element.querySelector('select[aria-label="Left operand"]');
    const opSelect = element.querySelector('select[aria-label="Operator"]');
    expect(leftSelect).toBeTruthy();
    expect(opSelect).toBeTruthy();
  });

  it('should assemble expression from guided selections', async () => {
    const { fixture, element } = await createComponent(TestHost);
    const host = fixture.componentInstance;

    const leftSelect = element.querySelector('select[aria-label="Left operand"]') as HTMLSelectElement;
    leftSelect.value = 'x';
    leftSelect.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    const opSelect = element.querySelector('select[aria-label="Operator"]') as HTMLSelectElement;
    opSelect.value = '===';
    opSelect.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    const rightInput = element.querySelector('input[aria-label="Right operand value"]') as HTMLInputElement;
    rightInput.value = '5';
    rightInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(host.onValueChange).toHaveBeenCalledWith('x === 5');
  });

  it('should emit expressionChange only when valid', async () => {
    const { fixture, element } = await createComponent(TestHost);
    const host = fixture.componentInstance;

    // Select left only — partial expression
    const leftSelect = element.querySelector('select[aria-label="Left operand"]') as HTMLSelectElement;
    leftSelect.value = 'x';
    leftSelect.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(host.onExpressionChange).not.toHaveBeenCalled();

    // Complete the expression
    const opSelect = element.querySelector('select[aria-label="Operator"]') as HTMLSelectElement;
    opSelect.value = '===';
    opSelect.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    const rightInput = element.querySelector('input[aria-label="Right operand value"]') as HTMLInputElement;
    rightInput.value = '5';
    rightInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(host.onExpressionChange).toHaveBeenCalledWith('x === 5');
  });

  it('should render text input in raw mode', async () => {
    const { fixture, element } = await createComponent(TestHost, { detectChanges: false });
    fixture.componentInstance.mode = 'raw';
    fixture.detectChanges();
    await fixture.whenStable();

    const rawInput = element.querySelector('input[aria-label="Expression"]');
    const selects = element.querySelectorAll('select');
    expect(rawInput).toBeTruthy();
    expect(selects.length).toBe(0);
  });

  it('should emit valueChange on raw input', async () => {
    const { fixture, element } = await createComponent(TestHost, { detectChanges: false });
    fixture.componentInstance.mode = 'raw';
    fixture.detectChanges();
    await fixture.whenStable();

    const rawInput = element.querySelector('input[aria-label="Expression"]') as HTMLInputElement;
    rawInput.value = 'x === 5';
    rawInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(fixture.componentInstance.onValueChange).toHaveBeenCalledWith('x === 5');
  });

  it('should show validation error for invalid raw expression', async () => {
    const { fixture, element } = await createComponent(TestHost, { detectChanges: false });
    fixture.componentInstance.mode = 'raw';
    fixture.detectChanges();
    await fixture.whenStable();

    const rawInput = element.querySelector('input[aria-label="Expression"]') as HTMLInputElement;
    rawInput.value = 'foo === 5';
    rawInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const errorEl = element.querySelector('.expression-builder__error');
    expect(errorEl).toBeTruthy();
    expect(errorEl?.textContent?.trim()).toBe('Unknown variable: foo');
  });

  it('should emit expressionChange for valid raw expression', async () => {
    const { fixture, element } = await createComponent(TestHost, { detectChanges: false });
    fixture.componentInstance.mode = 'raw';
    fixture.detectChanges();
    await fixture.whenStable();

    const rawInput = element.querySelector('input[aria-label="Expression"]') as HTMLInputElement;
    rawInput.value = 'x === 5';
    rawInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(fixture.componentInstance.onExpressionChange).toHaveBeenCalledWith('x === 5');
  });

  it('should preserve value when switching from guided to raw mode', async () => {
    const { fixture, element } = await createComponent(TestHost);
    const host = fixture.componentInstance;

    // Build expression in guided mode
    const leftSelect = element.querySelector('select[aria-label="Left operand"]') as HTMLSelectElement;
    leftSelect.value = 'x';
    leftSelect.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    const opSelect = element.querySelector('select[aria-label="Operator"]') as HTMLSelectElement;
    opSelect.value = '===';
    opSelect.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    const rightInput = element.querySelector('input[aria-label="Right operand value"]') as HTMLInputElement;
    rightInput.value = '5';
    rightInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    // Switch to raw mode
    host.mode = 'raw';
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    await fixture.whenStable();

    const rawInput = element.querySelector('input[aria-label="Expression"]') as HTMLInputElement;
    expect(rawInput.value).toBe('x === 5');
  });

  it('should clear validation error when expression becomes valid', async () => {
    const { fixture, element } = await createComponent(TestHost, { detectChanges: false });
    fixture.componentInstance.mode = 'raw';
    fixture.detectChanges();
    await fixture.whenStable();

    const rawInput = element.querySelector('input[aria-label="Expression"]') as HTMLInputElement;

    // Type invalid expression
    rawInput.value = 'foo === 5';
    rawInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(element.querySelector('.expression-builder__error')).toBeTruthy();

    // Fix expression
    rawInput.value = 'x === 5';
    rawInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(element.querySelector('.expression-builder__error')).toBeNull();
  });

  it('should update toggle button aria-label on click', async () => {
    const { fixture, element } = await createComponent(TestHost);

    const toggleBtn = element.querySelector('.expression-builder__toggle') as HTMLButtonElement;
    expect(toggleBtn.getAttribute('aria-label')).toBe('Switch to variable');

    toggleBtn.click();
    fixture.detectChanges();
    expect(toggleBtn.getAttribute('aria-label')).toBe('Switch to literal value');
  });
});
