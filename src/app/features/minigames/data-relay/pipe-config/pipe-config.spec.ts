import { Component, signal } from '@angular/core';
import { createComponent } from '../../../../../testing/test-utils';
import type { PipeBlock, PipeCategory } from '../data-relay.types';
import { DataRelayPipeConfigComponent } from './pipe-config';

// ---------------------------------------------------------------------------
// Test data factories
// ---------------------------------------------------------------------------

function createPipeBlock(overrides?: Partial<PipeBlock>): PipeBlock {
  return {
    id: 'pb-1',
    pipeType: 'uppercase',
    params: [],
    position: 0,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Test host
// ---------------------------------------------------------------------------

@Component({
  template: `
    <app-pipe-config
      [pipe]="pipe()"
      [pipeType]="pipeType()"
      [availableParams]="availableParams()"
      (paramsChanged)="onParamsChanged($event)"
      (pipeRemoved)="onPipeRemoved()"
    />
  `,
  imports: [DataRelayPipeConfigComponent],
})
class TestHost {
  pipe = signal<PipeBlock>(createPipeBlock());
  pipeType = signal<PipeCategory>('text');
  availableParams = signal<string[]>([]);
  onParamsChanged = vi.fn();
  onPipeRemoved = vi.fn();
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getPipeConfig(el: HTMLElement): HTMLElement {
  return el.querySelector('app-pipe-config') as HTMLElement;
}

function getApplyButton(el: HTMLElement): HTMLButtonElement | null {
  return el.querySelector('.pipe-config__apply-btn');
}

function getRemoveButton(el: HTMLElement): HTMLButtonElement | null {
  return el.querySelector('.pipe-config__remove-btn');
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('DataRelayPipeConfigComponent', () => {
  async function setup(overrides: {
    pipe?: PipeBlock;
    pipeType?: PipeCategory;
    availableParams?: string[];
  } = {}) {
    const { fixture, element } = await createComponent(TestHost, {
      detectChanges: false,
    });

    const host = fixture.componentInstance;
    if (overrides.pipe) host.pipe.set(overrides.pipe);
    if (overrides.pipeType) host.pipeType.set(overrides.pipeType);
    if (overrides.availableParams) host.availableParams.set(overrides.availableParams);

    fixture.detectChanges();
    await fixture.whenStable();
    return { fixture, host, element };
  }

  // 1. Creation
  it('should create the component', async () => {
    const { element } = await setup();
    expect(getPipeConfig(element)).toBeTruthy();
  });

  // 2. Pipe name display
  it('should render the pipe type name in the header', async () => {
    const { element } = await setup({
      pipe: createPipeBlock({ pipeType: 'date' }),
      pipeType: 'date',
    });
    const pipeName = element.querySelector('.pipe-config__pipe-name') as HTMLElement;
    expect(pipeName).toBeTruthy();
    expect(pipeName.textContent).toContain('date');
  });

  // 3. Type icon color
  it('should apply the pipe category color to the icon', async () => {
    const { element } = await setup({
      pipe: createPipeBlock({ pipeType: 'date' }),
      pipeType: 'date',
    });
    const icon = element.querySelector('.pipe-config__icon') as HTMLElement;
    expect(icon).toBeTruthy();
    // PIPE_CATEGORY_COLORS.date = '#F97316' => rgb(249, 115, 22)
    expect(icon.style.backgroundColor).toBe('rgb(249, 115, 22)');
  });

  // 4. Date params: dropdown rendering
  it('should render a select dropdown when pipeType is date', async () => {
    const { element } = await setup({
      pipe: createPipeBlock({ pipeType: 'date', params: ['mediumDate'] }),
      pipeType: 'date',
      availableParams: ['short', 'mediumDate', 'longDate', 'fullDate'],
    });
    const select = element.querySelector('.pipe-config__select') as HTMLSelectElement;
    expect(select).toBeTruthy();
    const options = Array.from(select.querySelectorAll('option'));
    expect(options.length).toBe(4);
    expect(options.map(o => o.value)).toEqual(['short', 'mediumDate', 'longDate', 'fullDate']);
  });

  // 5. Date params: change emission
  it('should emit paramsChanged with selected value when Apply is clicked for date type', async () => {
    const { fixture, host, element } = await setup({
      pipe: createPipeBlock({ pipeType: 'date', params: ['mediumDate'] }),
      pipeType: 'date',
      availableParams: ['short', 'mediumDate', 'longDate'],
    });

    const select = element.querySelector('.pipe-config__select') as HTMLSelectElement;
    select.value = 'longDate';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    const applyBtn = getApplyButton(element)!;
    applyBtn.click();
    fixture.detectChanges();

    expect(host.onParamsChanged).toHaveBeenCalledWith(['longDate']);
  });

  // 6. Number params: number input rendering
  it('should render a number input when pipeType is number', async () => {
    const { element } = await setup({
      pipe: createPipeBlock({ pipeType: 'decimal', params: ['1.0-2'] }),
      pipeType: 'number',
    });
    const numberInput = element.querySelector('.pipe-config__number-input') as HTMLInputElement;
    expect(numberInput).toBeTruthy();
    expect(numberInput.type).toBe('number');
  });

  // 7. Number params: change emission
  it('should emit paramsChanged with digit info string when Apply is clicked for number type', async () => {
    const { fixture, host, element } = await setup({
      pipe: createPipeBlock({ pipeType: 'decimal', params: ['1.0-3'] }),
      pipeType: 'number',
    });

    const numberInput = element.querySelector('.pipe-config__number-input') as HTMLInputElement;
    // Simulate setting the value to 4 (max fraction digits)
    numberInput.value = '4';
    numberInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const applyBtn = getApplyButton(element)!;
    applyBtn.click();
    fixture.detectChanges();

    expect(host.onParamsChanged).toHaveBeenCalledWith(['1.0-4']);
  });

  // 8. Text params: no-params message
  it('should show "No parameters" message when pipeType is text', async () => {
    const { element } = await setup({
      pipe: createPipeBlock({ pipeType: 'uppercase' }),
      pipeType: 'text',
    });
    const noParams = element.querySelector('.pipe-config__no-params') as HTMLElement;
    expect(noParams).toBeTruthy();
    expect(noParams.textContent!.toLowerCase()).toContain('no parameters');

    // No select or number input should be present
    expect(element.querySelector('.pipe-config__select')).toBeNull();
    expect(element.querySelector('.pipe-config__number-input')).toBeNull();
  });

  // 9. Custom params: code editor rendering
  it('should render nx-code-editor when pipeType is custom', async () => {
    const { element } = await setup({
      pipe: createPipeBlock({ pipeType: 'custom', params: ['return value;'] }),
      pipeType: 'custom',
    });
    const codeEditor = element.querySelector('nx-code-editor') as HTMLElement;
    expect(codeEditor).toBeTruthy();
  });

  // 10. Custom params: change emission
  it('should emit paramsChanged with code from editor when Apply is clicked for custom type', async () => {
    const { fixture, host, element } = await setup({
      pipe: createPipeBlock({ pipeType: 'custom', params: ['return value;'] }),
      pipeType: 'custom',
    });

    // Simulate code change by finding the textarea inside nx-code-editor
    const textarea = element.querySelector('nx-code-editor textarea') as HTMLTextAreaElement;
    if (textarea) {
      textarea.value = 'return value.toUpperCase();';
      textarea.dispatchEvent(new Event('input'));
      fixture.detectChanges();
    }

    const applyBtn = getApplyButton(element)!;
    applyBtn.click();
    fixture.detectChanges();

    expect(host.onParamsChanged).toHaveBeenCalledWith(['return value.toUpperCase();']);
  });

  // 11. Live preview: initial
  it('should show sample input and transformed output on render', async () => {
    const { element } = await setup({
      pipe: createPipeBlock({ pipeType: 'uppercase', params: [] }),
      pipeType: 'text',
    });
    const preview = element.querySelector('.pipe-config__preview') as HTMLElement;
    expect(preview).toBeTruthy();

    const previewInput = element.querySelector('.pipe-config__preview-input') as HTMLElement;
    expect(previewInput).toBeTruthy();
    expect(previewInput.textContent).toContain('hello world');

    const previewOutput = element.querySelector('.pipe-config__preview-output') as HTMLElement;
    expect(previewOutput).toBeTruthy();
    expect(previewOutput.textContent).toContain('HELLO WORLD');
  });

  // 12. Live preview: updates on param change
  it('should update preview output when param changes', async () => {
    const { fixture, element } = await setup({
      pipe: createPipeBlock({ pipeType: 'date', params: ['mediumDate'] }),
      pipeType: 'date',
      availableParams: ['short', 'mediumDate', 'longDate'],
    });

    const previewOutput = element.querySelector('.pipe-config__preview-output') as HTMLElement;
    const initialText = previewOutput.textContent;

    // Change the dropdown to longDate
    const select = element.querySelector('.pipe-config__select') as HTMLSelectElement;
    select.value = 'longDate';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    await fixture.whenStable();

    const updatedText = element.querySelector('.pipe-config__preview-output')!.textContent;
    // longDate format should differ from mediumDate
    expect(updatedText).not.toBe(initialText);
  });

  // 13. Pipe removal
  it('should emit pipeRemoved when remove button is clicked', async () => {
    const { fixture, host, element } = await setup();
    const removeBtn = getRemoveButton(element)!;
    expect(removeBtn).toBeTruthy();

    removeBtn.click();
    fixture.detectChanges();

    expect(host.onPipeRemoved).toHaveBeenCalled();
  });

  // 14. Empty availableParams
  it('should handle empty availableParams gracefully for date type', async () => {
    const { element } = await setup({
      pipe: createPipeBlock({ pipeType: 'date', params: [] }),
      pipeType: 'date',
      availableParams: [],
    });
    const select = element.querySelector('.pipe-config__select') as HTMLSelectElement;
    expect(select).toBeTruthy();
    const options = Array.from(select.querySelectorAll('option'));
    expect(options.length).toBe(0);
  });
});
