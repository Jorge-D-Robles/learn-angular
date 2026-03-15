import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { TerminalHackComponent } from './terminal-hack.component';
import { TerminalHackEngine } from './terminal-hack.engine';
import { MINIGAME_ENGINE } from '../../../core/minigame/minigame-engine.tokens';
import { KeyboardShortcutService } from '../../../core/minigame/keyboard-shortcut.service';
import {
  DifficultyTier,
  type MinigameLevel,
} from '../../../core/minigame/minigame.types';
import type {
  TerminalHackLevelData,
  TargetFormSpec,
  FormTestCase,
} from './terminal-hack.types';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function makeTargetFormSpec(overrides: Partial<TargetFormSpec> = {}): TargetFormSpec {
  return {
    formName: 'TestForm',
    elements: [
      {
        id: 'el-1',
        elementType: 'text',
        label: 'Username',
        name: 'username',
        validations: [{ type: 'required', errorMessage: 'Username is required' }],
      },
    ],
    submitAction: 'onSubmit',
    formType: 'reactive',
    ...overrides,
  };
}

function makeTestCase(overrides: Partial<FormTestCase> = {}): FormTestCase {
  return {
    id: 'tc-1',
    description: 'Valid input',
    inputValues: { username: 'alice' },
    expectedValid: true,
    ...overrides,
  };
}

function makeLevelData(overrides: Partial<TerminalHackLevelData> = {}): TerminalHackLevelData {
  return {
    targetFormSpec: makeTargetFormSpec(),
    testCases: [makeTestCase()],
    availableElements: ['FormControl', 'Validators.required'],
    timeLimit: 120,
    hints: [
      { order: 1, text: 'Use FormControl for reactive forms' },
      { order: 2, text: 'Add Validators.required for the username field' },
    ],
    ...overrides,
  };
}

function makeLevel(
  overrides: Partial<TerminalHackLevelData> = {},
): MinigameLevel<TerminalHackLevelData> {
  return {
    id: 'th-test-01',
    gameId: 'terminal-hack',
    tier: DifficultyTier.Basic,
    conceptIntroduced: 'Reactive Forms',
    description: 'Test level',
    data: makeLevelData(overrides),
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('TerminalHackComponent', () => {
  let engine: TerminalHackEngine;
  let fixture: ComponentFixture<TerminalHackComponent>;
  let component: TerminalHackComponent;
  let shortcuts: KeyboardShortcutService;

  function setup(levelData?: Partial<TerminalHackLevelData>) {
    engine = new TerminalHackEngine();
    engine.initialize(makeLevel(levelData));
    engine.start();

    TestBed.configureTestingModule({
      imports: [TerminalHackComponent],
      providers: [
        { provide: MINIGAME_ENGINE, useValue: engine },
      ],
    });

    fixture = TestBed.createComponent(TerminalHackComponent);
    component = fixture.componentInstance;
    shortcuts = TestBed.inject(KeyboardShortcutService);
    fixture.detectChanges();
  }

  afterEach(() => {
    vi.useRealTimers();
    fixture?.destroy();
  });

  // --- 1. Rendering Tests ---

  describe('Rendering', () => {
    it('should create successfully with engine token provided', () => {
      setup();
      expect(component).toBeTruthy();
    });

    it('should create successfully without engine (inert mode)', () => {
      TestBed.configureTestingModule({
        imports: [TerminalHackComponent],
      });
      const inertFixture = TestBed.createComponent(TerminalHackComponent);
      inertFixture.detectChanges();
      expect(inertFixture.componentInstance).toBeTruthy();
      inertFixture.destroy();
    });

    it('should render target form spec panel with element labels', () => {
      setup();
      const specItems = fixture.nativeElement.querySelectorAll('.terminal-hack__spec-item');
      expect(specItems.length).toBe(1);
      expect(specItems[0].textContent).toContain('Username');
    });

    it('should render element palette with available elements from engine', () => {
      setup();
      const toolBtns = fixture.nativeElement.querySelectorAll('.terminal-hack__tool-btn');
      expect(toolBtns.length).toBe(2);
      expect(toolBtns[0].textContent).toContain('FormControl');
      expect(toolBtns[1].textContent).toContain('Validators.required');
    });
  });

  // --- 2. Target Form Preview Tests ---

  describe('Target Form Preview', () => {
    it('should display target form name from engine targetFormSpec', () => {
      setup();
      const heading = fixture.nativeElement.querySelector('.terminal-hack__left-panel h3');
      expect(heading.textContent).toContain('TestForm');
    });

    it('should list all target elements with label, type, and validation summary', () => {
      setup({
        targetFormSpec: makeTargetFormSpec({
          elements: [
            { id: 'el-1', elementType: 'text', label: 'Username', name: 'username', validations: [{ type: 'required', errorMessage: 'Required' }] },
            { id: 'el-2', elementType: 'email', label: 'Email', name: 'email', validations: [{ type: 'email', errorMessage: 'Invalid email' }] },
          ],
        }),
      });
      const specItems = fixture.nativeElement.querySelectorAll('.terminal-hack__spec-item');
      expect(specItems.length).toBe(2);
      expect(specItems[0].textContent).toContain('Username');
      expect(specItems[0].textContent).toContain('text');
      expect(specItems[1].textContent).toContain('Email');
      expect(specItems[1].textContent).toContain('email');
    });

    it('should show form type badge (template-driven or reactive)', () => {
      setup();
      const badge = fixture.nativeElement.querySelector('.terminal-hack__form-type');
      expect(badge.textContent).toContain('reactive');
    });
  });

  // --- 3. Element Placement Tests ---

  describe('Element Placement', () => {
    it('should call engine.submitAction with place-element on palette button click', () => {
      setup();
      const submitSpy = vi.spyOn(engine, 'submitAction');

      // First select a slot
      const specSlot = fixture.nativeElement.querySelector('.terminal-hack__spec-item');
      specSlot.click();
      fixture.detectChanges();

      // Then click a palette tool
      const toolBtn = fixture.nativeElement.querySelector('.terminal-hack__tool-btn');
      toolBtn.click();
      fixture.detectChanges();

      expect(submitSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'place-element',
          elementId: 'el-1',
          elementType: 'text',
          toolType: 'FormControl',
        }),
      );
    });

    it('should remove element via engine.submitAction with remove-element on click', () => {
      setup();
      const submitSpy = vi.spyOn(engine, 'submitAction');

      // Place an element first
      component.onPlaceElement('el-1', 'text', 'FormControl');
      fixture.detectChanges();

      // Click remove on the placed element
      component.onRemoveElement('el-1');
      fixture.detectChanges();

      expect(submitSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'remove-element',
          elementId: 'el-1',
        }),
      );
    });

    it('should show placed elements in the code preview panel', () => {
      setup();
      component.onPlaceElement('el-1', 'text', 'FormControl');
      fixture.detectChanges();

      const codeEditor = fixture.nativeElement.querySelector('nx-code-editor');
      expect(codeEditor).toBeTruthy();
    });

    it('should disable palette button for already-placed element slots', () => {
      setup();

      // Select the slot
      const specSlot = fixture.nativeElement.querySelector('.terminal-hack__spec-item');
      specSlot.click();
      fixture.detectChanges();

      // Place the element via method
      component.onPlaceElement('el-1', 'text', 'FormControl');
      fixture.detectChanges();

      // The slot should now show as filled
      const filledSlot = fixture.nativeElement.querySelector('.terminal-hack__spec-item--filled');
      expect(filledSlot).toBeTruthy();
    });
  });

  // --- 4. Live Preview Tests ---

  describe('Live Preview', () => {
    it('should display formPreview completion ratio as progress indicator', () => {
      setup();
      const progress = fixture.nativeElement.querySelector('.terminal-hack__completion');
      expect(progress).toBeTruthy();
      expect(progress.textContent).toContain('0%');
    });

    it('should update preview when new elements are placed', () => {
      setup();
      component.onPlaceElement('el-1', 'text', 'FormControl');
      fixture.detectChanges();

      const progress = fixture.nativeElement.querySelector('.terminal-hack__completion');
      expect(progress.textContent).toContain('100%');
    });

    it('should show isComplete indicator when all elements placed', () => {
      setup();
      component.onPlaceElement('el-1', 'text', 'FormControl');
      fixture.detectChanges();

      const completeIndicator = fixture.nativeElement.querySelector('.terminal-hack__complete-badge');
      expect(completeIndicator).toBeTruthy();
    });
  });

  // --- 5. Test Runner Tests ---

  describe('Test Runner', () => {
    it('should call engine.runTestCases() on "Run Tests" button click', () => {
      setup();
      const runSpy = vi.spyOn(engine, 'runTestCases');

      component.onPlaceElement('el-1', 'text', 'FormControl');
      fixture.detectChanges();

      const runBtn = fixture.nativeElement.querySelector('.terminal-hack__run-btn') as HTMLButtonElement;
      runBtn.click();
      fixture.detectChanges();

      expect(runSpy).toHaveBeenCalled();
    });

    it('should display pass/fail indicator per test case from TestRunResult', () => {
      vi.useFakeTimers();
      setup();

      component.onPlaceElement('el-1', 'text', 'FormControl');
      component.onRunTests();
      fixture.detectChanges();

      const testCases = fixture.nativeElement.querySelectorAll('.terminal-hack__test-case');
      expect(testCases.length).toBeGreaterThan(0);
      vi.useRealTimers();
    });

    it('should show overall pass rate from TestRunResult', () => {
      vi.useFakeTimers();
      setup();

      component.onPlaceElement('el-1', 'text', 'FormControl');
      component.onRunTests();
      fixture.detectChanges();

      const passRate = fixture.nativeElement.querySelector('.terminal-hack__pass-rate');
      expect(passRate).toBeTruthy();
      vi.useRealTimers();
    });

    it('should disable run button when no elements are placed', () => {
      setup();
      const runBtn = fixture.nativeElement.querySelector('.terminal-hack__run-btn') as HTMLButtonElement;
      expect(runBtn.disabled).toBe(true);
    });
  });

  // --- 6. Power Gauge Timer Tests ---

  describe('Power Gauge Timer', () => {
    it('should render power gauge bar with width proportional to time remaining', () => {
      setup();
      const fill = fixture.nativeElement.querySelector('.terminal-hack__power-gauge-fill') as HTMLElement;
      expect(fill).toBeTruthy();
      expect(fill.style.width).toBe('100%');
    });

    it('should change gauge color based on time ratio (green/orange/red)', () => {
      vi.useFakeTimers();
      setup({ timeLimit: 100 });

      // Time remaining = 100/100 = 1.0 -> green
      const fill = fixture.nativeElement.querySelector('.terminal-hack__power-gauge-fill') as HTMLElement;
      expect(fill.style.backgroundColor).toBe('rgb(0, 255, 65)');

      // Advance to 40% remaining -> orange zone (ratio=0.4, which is > 0.25 but <= 0.5)
      vi.advanceTimersByTime(60_000);
      fixture.detectChanges();
      expect(fill.style.backgroundColor).toBe('rgb(249, 115, 22)');

      // Advance to 10% remaining -> red zone (ratio=0.1, which is <= 0.25)
      vi.advanceTimersByTime(30_000);
      fixture.detectChanges();
      expect(fill.style.backgroundColor).toBe('rgb(239, 68, 68)');

      vi.useRealTimers();
    });

    it('should hide gauge when timeLimit is 0', () => {
      setup({ timeLimit: 0 });
      const gauge = fixture.nativeElement.querySelector('.terminal-hack__power-gauge');
      expect(gauge).toBeFalsy();
    });
  });

  // --- 7. Keyboard Shortcut Tests ---

  describe('Keyboard Shortcuts', () => {
    it('should register keyboard shortcuts on init', () => {
      setup();
      const registered = shortcuts.getRegistered();
      expect(registered.find(r => r.key === 'enter')).toBeDefined();
      expect(registered.find(r => r.key === 'escape')).toBeDefined();
    });

    it('should trigger run tests on enter key', () => {
      setup();
      const runSpy = vi.spyOn(component, 'onRunTests');

      const enterReg = shortcuts.getRegistered().find(r => r.key === 'enter');
      enterReg?.callback();

      expect(runSpy).toHaveBeenCalled();
    });

    it('should unregister shortcuts on destroy', () => {
      setup();
      const unregisterSpy = vi.spyOn(shortcuts, 'unregister');

      component.ngOnDestroy();

      expect(unregisterSpy).toHaveBeenCalledWith('enter');
      expect(unregisterSpy).toHaveBeenCalledWith('escape');
    });
  });

  // --- 8. Hint Button Tests ---

  describe('Hint Button', () => {
    it('should call engine.recordHintUsed when hint button clicked', () => {
      setup();
      const hintSpy = vi.spyOn(engine, 'recordHintUsed');

      const hintBtn = fixture.nativeElement.querySelector('.terminal-hack__hint-btn') as HTMLButtonElement;
      hintBtn.click();
      fixture.detectChanges();

      expect(hintSpy).toHaveBeenCalled();
    });

    it('should reveal next hint text when hint button is clicked', () => {
      setup();

      // No hints shown initially
      let hintTexts = fixture.nativeElement.querySelectorAll('.terminal-hack__hint-text');
      expect(hintTexts.length).toBe(0);

      // Click hint button
      const hintBtn = fixture.nativeElement.querySelector('.terminal-hack__hint-btn') as HTMLButtonElement;
      hintBtn.click();
      fixture.detectChanges();

      hintTexts = fixture.nativeElement.querySelectorAll('.terminal-hack__hint-text');
      expect(hintTexts.length).toBe(1);
      expect(hintTexts[0].textContent).toContain('Use FormControl for reactive forms');
    });

    it('should show point cost warning on hint button', () => {
      setup();
      const hintBtn = fixture.nativeElement.querySelector('.terminal-hack__hint-btn') as HTMLButtonElement;
      expect(hintBtn.textContent).toContain('-50');
    });

    it('should disable hint button when all hints are revealed', () => {
      setup();

      const hintBtn = fixture.nativeElement.querySelector('.terminal-hack__hint-btn') as HTMLButtonElement;
      // Reveal all 2 hints
      hintBtn.click();
      fixture.detectChanges();
      hintBtn.click();
      fixture.detectChanges();

      expect(hintBtn.disabled).toBe(true);
    });
  });

  // --- 9. Edge Cases ---

  describe('Edge Cases', () => {
    it('should handle null targetFormSpec gracefully (empty state)', () => {
      // Engine with no level data means null target spec initially
      TestBed.configureTestingModule({
        imports: [TerminalHackComponent],
      });
      const inertFixture = TestBed.createComponent(TerminalHackComponent);
      inertFixture.detectChanges();

      const specItems = inertFixture.nativeElement.querySelectorAll('.terminal-hack__spec-item');
      expect(specItems.length).toBe(0);
      inertFixture.destroy();
    });

    it('should handle engine returning null from runTestCases', () => {
      setup();
      vi.spyOn(engine, 'runTestCases').mockReturnValue(null);

      component.onPlaceElement('el-1', 'text', 'FormControl');
      component.onRunTests();
      fixture.detectChanges();

      // Should not crash, test results should stay null
      expect(component.testRunResult()).toBeNull();
    });

    it('should not crash when engine is not provided (inert mode)', () => {
      TestBed.configureTestingModule({
        imports: [TerminalHackComponent],
      });
      const inertFixture = TestBed.createComponent(TerminalHackComponent);
      inertFixture.detectChanges();

      const comp = inertFixture.componentInstance;
      // These should all be safe to call
      expect(() => comp.onPlaceElement('el-1', 'text', 'FormControl')).not.toThrow();
      expect(() => comp.onRemoveElement('el-1')).not.toThrow();
      expect(() => comp.onRunTests()).not.toThrow();
      expect(() => comp.onReset()).not.toThrow();
      expect(() => comp.onUseHint()).not.toThrow();
      inertFixture.destroy();
    });
  });

  // --- 10. Reset Tests ---

  describe('Reset', () => {
    it('should call engine.reset() and clear local UI state', () => {
      setup();
      const resetSpy = vi.spyOn(engine, 'reset');

      // Place an element and reveal a hint
      component.onPlaceElement('el-1', 'text', 'FormControl');
      component.onUseHint();
      fixture.detectChanges();

      component.onReset();
      fixture.detectChanges();

      expect(resetSpy).toHaveBeenCalled();
      expect(component.revealedHintCount()).toBe(0);
      expect(component.selectedSlotId()).toBeNull();
    });
  });
});
