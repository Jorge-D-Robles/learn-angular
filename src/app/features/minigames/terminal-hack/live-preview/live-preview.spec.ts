import { Component } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { TerminalHackLivePreviewComponent } from './live-preview';
import type { TargetFormSpec } from '../terminal-hack.types';
import type { PlayerFormElement } from '../terminal-hack.engine';

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

const TWO_ELEMENT_SPEC: TargetFormSpec = {
  formName: 'loginForm',
  elements: [
    {
      id: 'e1',
      elementType: 'text',
      label: 'Username',
      name: 'username',
      validations: [{ type: 'required', errorMessage: 'Required' }],
    },
    {
      id: 'e2',
      elementType: 'email',
      label: 'Email',
      name: 'email',
      validations: [],
    },
  ],
  submitAction: 'onSubmit()',
  formType: 'reactive',
};

const EMPTY_SPEC: TargetFormSpec = {
  formName: 'emptyForm',
  elements: [],
  submitAction: 'onSubmit()',
  formType: 'reactive',
};

// ---------------------------------------------------------------------------
// Test host -- drives the sub-component via inputs/outputs
// ---------------------------------------------------------------------------

@Component({
  template: `<app-terminal-hack-live-preview
    [targetSpec]="targetSpec"
    [formElements]="formElements"
    (elementClicked)="onElementClicked($event)" />`,
  imports: [TerminalHackLivePreviewComponent],
})
class TestHost {
  targetSpec: TargetFormSpec = TWO_ELEMENT_SPEC;
  formElements: PlayerFormElement[] = [];
  onElementClicked = vi.fn();
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('TerminalHackLivePreviewComponent', () => {
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

  afterEach(() => {
    fixture?.destroy();
  });

  // --- 1. Rendering: form name header ---

  it('should display the targetSpec.formName in a header element', async () => {
    await setup({ targetSpec: TWO_ELEMENT_SPEC });
    const header = element.querySelector('.live-preview__header');
    expect(header).toBeTruthy();
    expect(header!.textContent).toContain('loginForm');
  });

  // --- 2. Rendering: form type badge ---

  it('should display the targetSpec.formType in a badge element', async () => {
    await setup({ targetSpec: TWO_ELEMENT_SPEC });
    const badge = element.querySelector('.live-preview__badge');
    expect(badge).toBeTruthy();
    expect(badge!.textContent).toContain('reactive');
  });

  // --- 3. Rendering: all target elements shown ---

  it('should render one preview slot per target element', async () => {
    await setup({ targetSpec: TWO_ELEMENT_SPEC });
    const slots = element.querySelectorAll('.live-preview__slot');
    expect(slots.length).toBe(2);
  });

  // --- 4. Rendering: element labels displayed ---

  it('should show each element label text in its preview slot', async () => {
    await setup({ targetSpec: TWO_ELEMENT_SPEC });
    const labels = element.querySelectorAll('.live-preview__label');
    expect(labels.length).toBe(2);
    expect(labels[0].textContent).toContain('Username');
    expect(labels[1].textContent).toContain('Email');
  });

  // --- 5. Rendering: element type shown ---

  it('should show the element type in each preview slot', async () => {
    await setup({ targetSpec: TWO_ELEMENT_SPEC });
    const types = element.querySelectorAll('.live-preview__type');
    expect(types.length).toBe(2);
    expect(types[0].textContent).toContain('text');
    expect(types[1].textContent).toContain('email');
  });

  // --- 6. Missing elements: dashed placeholder ---

  it('should apply --missing modifier when formElements is empty', async () => {
    await setup({ targetSpec: TWO_ELEMENT_SPEC, formElements: [] });
    const slots = element.querySelectorAll('.live-preview__slot');
    slots.forEach(slot => {
      expect(slot.classList.contains('live-preview__slot--missing')).toBe(true);
    });
  });

  // --- 7. Correct placement: green glow ---

  it('should apply --correct modifier when element has matching ID and type', async () => {
    await setup({
      targetSpec: TWO_ELEMENT_SPEC,
      formElements: [
        { elementId: 'e1', elementType: 'text', toolType: 'FormControl', validations: [] },
      ],
    });
    const slots = element.querySelectorAll('.live-preview__slot');
    expect(slots[0].classList.contains('live-preview__slot--correct')).toBe(true);
    expect(slots[1].classList.contains('live-preview__slot--missing')).toBe(true);
  });

  // --- 8. Incorrect placement: warning indicator ---

  it('should apply --incorrect modifier when element has matching ID but wrong type', async () => {
    await setup({
      targetSpec: TWO_ELEMENT_SPEC,
      formElements: [
        { elementId: 'e1', elementType: 'email', toolType: 'FormControl', validations: [] },
      ],
    });
    const slots = element.querySelectorAll('.live-preview__slot');
    expect(slots[0].classList.contains('live-preview__slot--incorrect')).toBe(true);
    expect(slots[0].classList.contains('live-preview__slot--correct')).toBe(false);
  });

  // --- 9. Reactive updates ---

  it('should update the DOM when formElements input changes at runtime', async () => {
    await setup({ targetSpec: TWO_ELEMENT_SPEC, formElements: [] });

    // Initially all missing
    const slots = element.querySelectorAll('.live-preview__slot--missing');
    expect(slots.length).toBe(2);

    // Add a correct element and run full change detection cycle
    host.formElements = [
      { elementId: 'e1', elementType: 'text', toolType: 'FormControl', validations: [] },
    ];
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();

    const correctSlots = element.querySelectorAll('.live-preview__slot--correct');
    expect(correctSlots.length).toBe(1);

    const missingSlots = element.querySelectorAll('.live-preview__slot--missing');
    expect(missingSlots.length).toBe(1);
  });

  // --- 10. Output: elementClicked emitted on click ---

  it('should emit elementClicked with element ID when a slot is clicked', async () => {
    await setup({ targetSpec: TWO_ELEMENT_SPEC });
    const slots = element.querySelectorAll('.live-preview__slot');
    (slots[0] as HTMLElement).click();
    expect(host.onElementClicked).toHaveBeenCalledWith('e1');
  });

  // --- 11. Output: elementClicked emitted on Enter key ---

  it('should emit elementClicked with element ID on Enter keydown', async () => {
    await setup({ targetSpec: TWO_ELEMENT_SPEC });
    const slots = element.querySelectorAll('.live-preview__slot');
    const firstSlot = slots[0] as HTMLElement;
    firstSlot.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    fixture.detectChanges();
    expect(host.onElementClicked).toHaveBeenCalledWith('e1');
  });

  // --- 12. Edge case: empty targetSpec ---

  it('should render 0 slots when targetSpec has no elements', async () => {
    await setup({ targetSpec: EMPTY_SPEC });
    const slots = element.querySelectorAll('.live-preview__slot');
    expect(slots.length).toBe(0);
  });

  // --- 13. Edge case: empty formElements ---

  it('should render all slots as missing when formElements is empty', async () => {
    await setup({ targetSpec: TWO_ELEMENT_SPEC, formElements: [] });
    const missingSlots = element.querySelectorAll('.live-preview__slot--missing');
    expect(missingSlots.length).toBe(2);
    const correctSlots = element.querySelectorAll('.live-preview__slot--correct');
    expect(correctSlots.length).toBe(0);
    const incorrectSlots = element.querySelectorAll('.live-preview__slot--incorrect');
    expect(incorrectSlots.length).toBe(0);
  });

  // --- 14. Terminal theme: host has live-preview class ---

  it('should have the live-preview CSS class on the root element', async () => {
    await setup();
    const root = element.querySelector('.live-preview');
    expect(root).toBeTruthy();
  });
});
