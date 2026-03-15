import { Component } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { TerminalHackCodePanelComponent, ALL_FORM_TOOL_TYPES } from './code-panel';
import type { TargetFormSpec, FormToolType } from '../terminal-hack.types';

// ---------------------------------------------------------------------------
// Test host -- drives the sub-component via inputs/outputs
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

@Component({
  template: `<app-terminal-hack-code-panel
    [targetSpec]="targetSpec"
    [initialCode]="initialCode"
    [availableTools]="availableTools"
    (codeChange)="onCodeChange($event)" />`,
  imports: [TerminalHackCodePanelComponent],
})
class TestHost {
  targetSpec: TargetFormSpec = TWO_ELEMENT_SPEC;
  initialCode = '';
  availableTools: FormToolType[] = [];
  onCodeChange = vi.fn();
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('TerminalHackCodePanelComponent', () => {
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

  // --- 1. Rendering: target spec elements ---

  it('should render spec items matching the number of elements in targetSpec', async () => {
    await setup({ targetSpec: TWO_ELEMENT_SPEC });
    const items = element.querySelectorAll('.code-panel__spec-item');
    expect(items.length).toBe(2);
    expect(items[0].textContent).toContain('Username');
    expect(items[1].textContent).toContain('Email');
    // Type badges
    expect(items[0].textContent).toContain('text');
    expect(items[1].textContent).toContain('email');
  });

  // --- 2. Rendering: required fields highlighted ---

  it('should add --required class to elements with a required validation rule', async () => {
    await setup({ targetSpec: TWO_ELEMENT_SPEC });
    const items = element.querySelectorAll('.code-panel__spec-item');
    // e1 has required validation
    expect(items[0].classList.contains('code-panel__spec-item--required')).toBe(true);
    // e2 has no validations
    expect(items[1].classList.contains('code-panel__spec-item--required')).toBe(false);
  });

  // --- 3. Rendering: code editor present ---

  it('should render the nx-code-editor element', async () => {
    await setup();
    const editor = element.querySelector('nx-code-editor');
    expect(editor).toBeTruthy();
  });

  // --- 4. Rendering: code editor receives initialCode ---

  it('should pass initialCode to the code editor', async () => {
    await setup({ initialCode: '// starter' });
    const textarea = element.querySelector('nx-code-editor textarea') as HTMLTextAreaElement;
    expect(textarea).toBeTruthy();
    expect(textarea.value).toBe('// starter');
  });

  // --- 5. Rendering: tool palette buttons ---

  it('should render enabled tool buttons for availableTools', async () => {
    await setup({ availableTools: ['FormControl', 'Validators.required'] });
    const enabledBtns = element.querySelectorAll(
      '.code-panel__tool-btn:not(.code-panel__tool-btn--dimmed)',
    );
    const labels = Array.from(enabledBtns).map(b => b.textContent?.trim());
    expect(labels).toContain('FormControl');
    expect(labels).toContain('Validators.required');
  });

  // --- 6. Rendering: all FormToolType values shown with unavailable dimmed ---

  it('should show all FormToolType values with unavailable ones dimmed', async () => {
    await setup({ availableTools: ['FormControl'] });
    const allBtns = element.querySelectorAll('.code-panel__tool-btn');
    expect(allBtns.length).toBe(ALL_FORM_TOOL_TYPES.length);

    const enabledBtns = element.querySelectorAll(
      '.code-panel__tool-btn:not(.code-panel__tool-btn--dimmed)',
    );
    expect(enabledBtns.length).toBe(1);
    expect(enabledBtns[0].textContent?.trim()).toBe('FormControl');

    const dimmedBtns = element.querySelectorAll('.code-panel__tool-btn--dimmed');
    expect(dimmedBtns.length).toBe(ALL_FORM_TOOL_TYPES.length - 1);
  });

  // --- 7. Output: codeChange emitted on editor input ---

  it('should emit codeChange when the code editor emits a change', async () => {
    await setup({ initialCode: '// start' });
    const textarea = element.querySelector('nx-code-editor textarea') as HTMLTextAreaElement;
    expect(textarea).toBeTruthy();

    // Simulate user typing
    textarea.value = '// updated code';
    textarea.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(host.onCodeChange).toHaveBeenCalledWith('// updated code');
  });

  // --- 8. Retro theme: host has code-panel class ---

  it('should have the code-panel CSS class on the root element', async () => {
    await setup();
    const panel = element.querySelector('.code-panel');
    expect(panel).toBeTruthy();
  });

  // --- 9. Retro theme: cursor blink element present ---

  it('should render a cursor blink element as a real DOM span', async () => {
    await setup();
    const cursor = element.querySelector('.code-panel__cursor');
    expect(cursor).toBeTruthy();
    expect(cursor?.tagName.toLowerCase()).toBe('span');
  });

  // --- 10. ARIA: toolbar role on palette ---

  it('should have role="toolbar" on the palette and aria-label on each tool button', async () => {
    await setup({ availableTools: ['FormControl'] });
    const toolbar = element.querySelector('[role="toolbar"]');
    expect(toolbar).toBeTruthy();

    const btns = element.querySelectorAll('.code-panel__tool-btn');
    btns.forEach(btn => {
      expect(btn.getAttribute('aria-label')).toBeTruthy();
    });
  });

  // --- 11. Edge case: empty targetSpec ---

  it('should render 0 spec items when targetSpec has no elements', async () => {
    await setup({ targetSpec: EMPTY_SPEC });
    const items = element.querySelectorAll('.code-panel__spec-item');
    expect(items.length).toBe(0);
  });

  // --- 12. Edge case: empty initialCode ---

  it('should render without errors when initialCode is empty', async () => {
    await setup({ initialCode: '' });
    const editor = element.querySelector('nx-code-editor');
    expect(editor).toBeTruthy();
  });

  // --- 13. Edge case: empty availableTools ---

  it('should render all tool buttons as dimmed when availableTools is empty', async () => {
    await setup({ availableTools: [] });
    const allBtns = element.querySelectorAll('.code-panel__tool-btn');
    expect(allBtns.length).toBe(ALL_FORM_TOOL_TYPES.length);

    const dimmedBtns = element.querySelectorAll('.code-panel__tool-btn--dimmed');
    expect(dimmedBtns.length).toBe(ALL_FORM_TOOL_TYPES.length);

    const enabledBtns = element.querySelectorAll(
      '.code-panel__tool-btn:not(.code-panel__tool-btn--dimmed)',
    );
    expect(enabledBtns.length).toBe(0);
  });
});
