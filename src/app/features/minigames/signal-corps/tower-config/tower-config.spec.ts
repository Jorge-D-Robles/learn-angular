import { Component } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { SignalCorpsTowerConfigComponent, type TowerConfigResult } from './tower-config';
import type { ParentBinding, TowerConfig } from '../signal-corps.types';

@Component({
  template: `<app-signal-corps-tower-config
    [tower]="tower"
    [bindings]="bindings"
    [parentProperties]="parentProperties"
    [parentHandlers]="parentHandlers"
    [towerId]="towerId"
    (configApplied)="onApplied($event)"
    (cancelled)="onCancelled()" />`,
  imports: [SignalCorpsTowerConfigComponent],
})
class TestHost {
  tower: TowerConfig = { inputs: [], outputs: [] };
  bindings: ParentBinding[] = [];
  parentProperties = ['dataSource', 'title', 'count'];
  parentHandlers = ['onSelect', 'onDelete'];
  towerId = 'T1';
  onApplied = vi.fn();
  onCancelled = vi.fn();
}

describe('SignalCorpsTowerConfigComponent', () => {
  let fixture: ComponentFixture<TestHost>;
  let host: TestHost;
  let element: HTMLElement;

  async function setup(overrides: Partial<TestHost> = {}): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [TestHost],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHost);
    host = fixture.componentInstance;
    Object.assign(host, overrides);
    fixture.detectChanges();
    await fixture.whenStable();
    element = fixture.nativeElement as HTMLElement;
  }

  function getInputNameField(): HTMLInputElement {
    return element.querySelector('input[aria-label="Input name"]') as HTMLInputElement;
  }

  function getInputTypeSelect(): HTMLSelectElement {
    return element.querySelector('select[aria-label="Input type"]') as HTMLSelectElement;
  }

  function getTransformSelect(): HTMLSelectElement {
    return element.querySelector('select[aria-label="Transform"]') as HTMLSelectElement;
  }

  function getRequiredCheckbox(): HTMLInputElement {
    return element.querySelector('.tower-config__toggle input[type="checkbox"]') as HTMLInputElement;
  }

  function getOutputNameField(): HTMLInputElement {
    return element.querySelector('input[aria-label="Output name"]') as HTMLInputElement;
  }

  function getPayloadTypeSelect(): HTMLSelectElement {
    return element.querySelector('select[aria-label="Payload type"]') as HTMLSelectElement;
  }

  function getAddInputBtn(): HTMLButtonElement {
    const buttons = element.querySelectorAll<HTMLButtonElement>('.tower-config__add-btn');
    for (const btn of buttons) {
      if (btn.textContent?.trim() === 'Add Input') return btn;
    }
    throw new Error('Add Input button not found');
  }

  function getAddOutputBtn(): HTMLButtonElement {
    const buttons = element.querySelectorAll<HTMLButtonElement>('.tower-config__add-btn');
    for (const btn of buttons) {
      if (btn.textContent?.trim() === 'Add Output') return btn;
    }
    throw new Error('Add Output button not found');
  }

  function getWireBtn(): HTMLButtonElement {
    const buttons = element.querySelectorAll<HTMLButtonElement>('.tower-config__add-btn');
    for (const btn of buttons) {
      if (btn.textContent?.trim() === 'Wire') return btn;
    }
    throw new Error('Wire button not found');
  }

  function getRemoveButtons(): HTMLButtonElement[] {
    return Array.from(element.querySelectorAll<HTMLButtonElement>('.tower-config__remove-btn'));
  }

  function getPortNameSelect(): HTMLSelectElement {
    return element.querySelector('select[aria-label="Port name"]') as HTMLSelectElement;
  }

  function getApplyBtn(): HTMLButtonElement {
    return element.querySelector('.tower-config__apply-btn') as HTMLButtonElement;
  }

  function getCancelBtn(): HTMLButtonElement {
    return element.querySelector('.tower-config__cancel-btn') as HTMLButtonElement;
  }

  async function setInputValue(el: HTMLInputElement, value: string): Promise<void> {
    el.value = value;
    el.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    await fixture.whenStable();
  }

  async function setSelectValue(el: HTMLSelectElement, value: string): Promise<void> {
    el.value = value;
    el.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    await fixture.whenStable();
  }

  async function clickButton(btn: HTMLButtonElement): Promise<void> {
    btn.click();
    fixture.detectChanges();
    await fixture.whenStable();
  }

  async function addInput(
    name: string,
    type = 'string',
    required = false,
    transform = 'none',
  ): Promise<void> {
    await setInputValue(getInputNameField(), name);
    await setSelectValue(getInputTypeSelect(), type);
    if (required) {
      getRequiredCheckbox().click();
      fixture.detectChanges();
      await fixture.whenStable();
    }
    if (transform !== 'none') {
      await setSelectValue(getTransformSelect(), transform);
    }
    await clickButton(getAddInputBtn());
  }

  async function addOutput(name: string, payloadType = 'string'): Promise<void> {
    await setInputValue(getOutputNameField(), name);
    await setSelectValue(getPayloadTypeSelect(), payloadType);
    await clickButton(getAddOutputBtn());
  }

  // --- Test 1: Tower ID in header ---

  it('should render tower ID in header', async () => {
    await setup({ towerId: 'T1' });
    const title = element.querySelector('.tower-config__title');
    expect(title?.textContent?.trim()).toBe('T1 Configuration');
  });

  // --- Test 2: Display existing inputs ---

  it('should display existing inputs from tower config', async () => {
    await setup({
      tower: {
        inputs: [
          { name: 'color', type: 'string', required: false },
          { name: 'size', type: 'number', required: true },
        ],
        outputs: [],
      },
    });

    const rows = element.querySelectorAll('.tower-config__row');
    const texts = Array.from(rows).map(r => r.textContent?.trim());
    expect(texts.some(t => t?.includes('color: string'))).toBe(true);
    expect(texts.some(t => t?.includes('size: number') && t?.includes('(required)'))).toBe(true);
  });

  // --- Test 3: Add an input declaration ---

  it('should add an input declaration', async () => {
    await setup();

    await addInput('velocity', 'number');

    const rows = element.querySelectorAll('.tower-config__row');
    const texts = Array.from(rows).map(r => r.textContent?.trim());
    expect(texts.some(t => t?.includes('velocity: number'))).toBe(true);
  });

  // --- Test 4: Remove an input declaration ---

  it('should remove an input declaration', async () => {
    await setup();

    await addInput('velocity', 'number');

    let rows = element.querySelectorAll('.tower-config__row');
    expect(rows.length).toBe(1);

    const removeBtn = getRemoveButtons()[0];
    await clickButton(removeBtn);

    rows = element.querySelectorAll('.tower-config__row');
    const texts = Array.from(rows).map(r => r.textContent?.trim());
    expect(texts.some(t => t?.includes('velocity'))).toBe(false);
  });

  // --- Test 5: Toggle required flag ---

  it('should toggle required flag on new input', async () => {
    await setup();

    await addInput('active', 'boolean', true);

    const rows = element.querySelectorAll('.tower-config__row');
    const texts = Array.from(rows).map(r => r.textContent?.trim());
    expect(texts.some(t => t?.includes('(required)'))).toBe(true);
  });

  // --- Test 6: Select transform ---

  it('should select transform for new input', async () => {
    await setup();

    await addInput('count', 'number', false, 'numberAttribute');

    const rows = element.querySelectorAll('.tower-config__row');
    const texts = Array.from(rows).map(r => r.textContent?.trim());
    expect(texts.some(t => t?.includes('[numberAttribute]'))).toBe(true);
  });

  // --- Test 7: Display existing outputs ---

  it('should display existing outputs from tower config', async () => {
    await setup({
      tower: {
        inputs: [],
        outputs: [
          { name: 'clicked', payloadType: 'void' },
          { name: 'dataEmit', payloadType: 'string' },
        ],
      },
    });

    const rows = element.querySelectorAll('.tower-config__row');
    const texts = Array.from(rows).map(r => r.textContent?.trim());
    expect(texts.some(t => t?.includes('clicked: void'))).toBe(true);
    expect(texts.some(t => t?.includes('dataEmit: string'))).toBe(true);
  });

  // --- Test 8: Add an output declaration ---

  it('should add an output declaration', async () => {
    await setup();

    await addOutput('selected', 'number');

    const rows = element.querySelectorAll('.tower-config__row');
    const texts = Array.from(rows).map(r => r.textContent?.trim());
    expect(texts.some(t => t?.includes('selected: number'))).toBe(true);
  });

  // --- Test 9: Remove an output declaration ---

  it('should remove an output declaration', async () => {
    await setup();

    await addOutput('selected', 'number');

    let rows = element.querySelectorAll('.tower-config__row');
    expect(rows.length).toBe(1);

    const removeBtn = getRemoveButtons()[0];
    await clickButton(removeBtn);

    rows = element.querySelectorAll('.tower-config__row');
    const texts = Array.from(rows).map(r => r.textContent?.trim());
    expect(texts.some(t => t?.includes('selected'))).toBe(false);
  });

  // --- Test 10: Duplicate input name error ---

  it('should show duplicate name error for inputs', async () => {
    await setup();

    await addInput('foo', 'string');

    // Type "foo" again without adding
    await setInputValue(getInputNameField(), 'foo');

    const error = element.querySelector('.tower-config__error');
    expect(error?.textContent?.trim()).toBe('Duplicate input name');
  });

  // --- Test 11: Duplicate output name error ---

  it('should show duplicate name error for outputs', async () => {
    await setup();

    await addOutput('bar', 'string');

    // Type "bar" again without adding
    await setInputValue(getOutputNameField(), 'bar');

    const error = element.querySelector('.tower-config__error');
    expect(error?.textContent?.trim()).toBe('Duplicate output name');
  });

  // --- Test 12: Emit configApplied ---

  it('should emit configApplied with TowerConfigResult on Apply', async () => {
    await setup();

    await addInput('name', 'string');
    await addOutput('clicked', 'void');

    await clickButton(getApplyBtn());

    expect(host.onApplied).toHaveBeenCalledTimes(1);
    const result: TowerConfigResult = host.onApplied.mock.calls[0][0];
    expect(result.config.inputs.length).toBe(1);
    expect(result.config.inputs[0].name).toBe('name');
    expect(result.config.outputs.length).toBe(1);
    expect(result.config.outputs[0].name).toBe('clicked');
    expect(result.bindings).toEqual([]);
  });

  // --- Test 13: Emit cancelled ---

  it('should emit cancelled on Cancel', async () => {
    await setup();

    await clickButton(getCancelBtn());

    expect(host.onCancelled).toHaveBeenCalledTimes(1);
  });

  // --- Test 14: Disable Apply when empty ---

  it('should disable Apply when no inputs or outputs exist', async () => {
    await setup();

    const applyBtn = getApplyBtn();
    expect(applyBtn.disabled).toBe(true);
  });

  // --- Test 15: Wire input port to parent property ---

  it('should wire input port to parent property', async () => {
    await setup();

    await addInput('color', 'string');

    // Select the input port in the wiring dropdown
    const portSelect = getPortNameSelect();
    await setSelectValue(portSelect, 'color');

    // Select a parent property
    const propSelect = element.querySelector('select[aria-label="Parent property"]') as HTMLSelectElement;
    await setSelectValue(propSelect, 'dataSource');

    // Click Wire
    await clickButton(getWireBtn());

    const rows = element.querySelectorAll('.tower-config__row');
    const texts = Array.from(rows).map(r => r.textContent?.trim());
    expect(texts.some(t => t?.includes('[input]') && t?.includes('color') && t?.includes('dataSource'))).toBe(true);
  });

  // --- Test 16: Wire output port to parent handler with auto-detected binding type ---

  it('should wire output port to parent handler with auto-detected binding type', async () => {
    await setup();

    await addOutput('clicked', 'void');

    // Select the output port in the wiring dropdown
    const portSelect = getPortNameSelect();
    await setSelectValue(portSelect, 'clicked');

    // Should auto-detect output type and show handler dropdown
    const handlerSelect = element.querySelector('select[aria-label="Parent handler"]') as HTMLSelectElement;
    expect(handlerSelect).toBeTruthy();
    await setSelectValue(handlerSelect, 'onSelect');

    // Click Wire
    await clickButton(getWireBtn());

    const rows = element.querySelectorAll('.tower-config__row');
    const texts = Array.from(rows).map(r => r.textContent?.trim());
    expect(texts.some(t => t?.includes('[output]') && t?.includes('clicked') && t?.includes('onSelect'))).toBe(true);
  });

  // --- Test 17: Remove binding when its port is removed ---

  it('should remove binding when its port is removed', async () => {
    await setup();

    // Add an input and wire it
    await addInput('color', 'string');

    const portSelect = getPortNameSelect();
    await setSelectValue(portSelect, 'color');

    const propSelect = element.querySelector('select[aria-label="Parent property"]') as HTMLSelectElement;
    await setSelectValue(propSelect, 'dataSource');

    await clickButton(getWireBtn());

    // Verify binding exists
    let rows = element.querySelectorAll('.tower-config__row');
    let texts = Array.from(rows).map(r => r.textContent?.trim());
    expect(texts.some(t => t?.includes('[input]') && t?.includes('color'))).toBe(true);

    // Remove the input (first Remove button is the input's)
    const removeButtons = getRemoveButtons();
    const inputRemoveBtn = removeButtons[0];
    await clickButton(inputRemoveBtn);

    // Verify both input row and binding row are gone
    rows = element.querySelectorAll('.tower-config__row');
    texts = Array.from(rows).map(r => r.textContent?.trim());
    expect(texts.some(t => t?.includes('color'))).toBe(false);
  });
});
