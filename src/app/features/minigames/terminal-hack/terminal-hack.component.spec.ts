import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { TerminalHackComponent } from './terminal-hack.component';
import { TerminalHackCodePanelComponent } from './code-panel/code-panel';
import { TerminalHackLivePreviewComponent } from './live-preview/live-preview';
import { TerminalHackTestRunnerComponent } from './test-runner/test-runner';
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

  async function asyncSetup(levelData?: Partial<TerminalHackLevelData>) {
    setup(levelData);
    await fixture.whenStable();
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
  });

  // --- 2. Code Panel Wiring Tests ---

  describe('Code Panel Wiring', () => {
    it('should render code panel child component when engine has targetFormSpec', async () => {
      await asyncSetup();
      const codePanel = fixture.nativeElement.querySelector('app-terminal-hack-code-panel');
      expect(codePanel).toBeTruthy();
    });

    it('should not render code panel when targetFormSpec is null (inert mode)', () => {
      TestBed.configureTestingModule({
        imports: [TerminalHackComponent],
      });
      const inertFixture = TestBed.createComponent(TerminalHackComponent);
      inertFixture.detectChanges();

      const codePanel = inertFixture.nativeElement.querySelector('app-terminal-hack-code-panel');
      expect(codePanel).toBeFalsy();
      inertFixture.destroy();
    });

    it('should bind targetSpec input to engine targetFormSpec', async () => {
      await asyncSetup();
      const codePanelDe = fixture.debugElement.query(By.directive(TerminalHackCodePanelComponent));
      const codePanelInstance = codePanelDe.componentInstance as TerminalHackCodePanelComponent;
      expect(codePanelInstance.targetSpec()).toEqual(engine.targetFormSpec());
    });

    it('should bind availableTools input to engine availableElements', async () => {
      await asyncSetup();
      const codePanelDe = fixture.debugElement.query(By.directive(TerminalHackCodePanelComponent));
      const codePanelInstance = codePanelDe.componentInstance as TerminalHackCodePanelComponent;
      expect(codePanelInstance.availableTools()).toEqual(engine.availableElements());
    });

    it('should forward codeChange output to playerCode signal', async () => {
      await asyncSetup();
      const textarea = fixture.nativeElement.querySelector('nx-code-editor textarea') as HTMLTextAreaElement;
      expect(textarea).toBeTruthy();

      textarea.value = 'const form = new FormGroup({});';
      textarea.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      expect(component.playerCode()).toBe('const form = new FormGroup({});');
    });

    it('should start with empty initialCode in code editor', async () => {
      await asyncSetup();
      const textarea = fixture.nativeElement.querySelector('nx-code-editor textarea') as HTMLTextAreaElement;
      expect(textarea).toBeTruthy();
      expect(textarea.value).toBe('');
    });
  });

  // --- 3. Element Placement Tests (method-level) ---

  describe('Element Placement', () => {
    it('should remove element via engine.submitAction with remove-element', () => {
      setup();
      const submitSpy = vi.spyOn(engine, 'submitAction');

      // Place an element first
      component.onPlaceElement('el-1', 'text', 'FormControl');
      fixture.detectChanges();

      // Remove the placed element
      component.onRemoveElement('el-1');
      fixture.detectChanges();

      expect(submitSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'remove-element',
          elementId: 'el-1',
        }),
      );
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

  // --- 5. Test Runner Wiring Tests ---

  describe('Test Runner Wiring', () => {
    it('should render the test runner child component', () => {
      setup();
      const testRunnerDe = fixture.debugElement.query(By.directive(TerminalHackTestRunnerComponent));
      expect(testRunnerDe).toBeTruthy();
    });

    it('should bind testCases input to engine testCases', async () => {
      await asyncSetup();
      const testRunnerDe = fixture.debugElement.query(By.directive(TerminalHackTestRunnerComponent));
      const childInstance = testRunnerDe.componentInstance as TerminalHackTestRunnerComponent;
      expect(childInstance.testCases()).toEqual(engine.testCases());
    });

    it('should bind testResults input: null before run, engine results after run', async () => {
      await asyncSetup();
      const testRunnerDe = fixture.debugElement.query(By.directive(TerminalHackTestRunnerComponent));
      const childInstance = testRunnerDe.componentInstance as TerminalHackTestRunnerComponent;

      // Before running tests, testResults should be null
      expect(childInstance.testResults()).toBeNull();

      // Place an element and run tests
      component.onPlaceElement('el-1', 'text', 'FormControl');
      component.onRunTests();
      fixture.detectChanges();

      expect(childInstance.testResults()).toEqual(engine.testRunResult()?.testCaseResults ?? null);
    });

    it('should set isTestsRunning to true during engine.runTestCases call', () => {
      setup();
      component.onPlaceElement('el-1', 'text', 'FormControl');
      fixture.detectChanges();

      vi.spyOn(engine, 'runTestCases').mockImplementation(() => {
        expect(component.isTestsRunning()).toBe(true);
        return null as any;
      });

      component.onRunTests();
    });

    it('should forward runTestsRequested output to engine.runTestCases via child button', async () => {
      await asyncSetup();
      const runSpy = vi.spyOn(engine, 'runTestCases');

      const testRunnerDe = fixture.debugElement.query(By.directive(TerminalHackTestRunnerComponent));
      const runBtn = testRunnerDe.nativeElement.querySelector('.test-runner__run-btn') as HTMLButtonElement;
      expect(runBtn).toBeTruthy();

      runBtn.click();
      fixture.detectChanges();

      expect(runSpy).toHaveBeenCalled();
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
      expect(fill.style.width).toBe('40%');
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

      const codePanel = inertFixture.nativeElement.querySelector('app-terminal-hack-code-panel');
      expect(codePanel).toBeFalsy();
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

  // --- 11. Live Preview Wiring ---

  describe('Live Preview Wiring', () => {
    it('should render live preview child component when engine has targetFormSpec', async () => {
      await asyncSetup();
      const livePreview = fixture.nativeElement.querySelector('app-terminal-hack-live-preview');
      expect(livePreview).toBeTruthy();
    });

    it('should not render live preview when targetFormSpec is null (inert mode)', () => {
      TestBed.configureTestingModule({
        imports: [TerminalHackComponent],
      });
      const inertFixture = TestBed.createComponent(TerminalHackComponent);
      inertFixture.detectChanges();

      const livePreview = inertFixture.nativeElement.querySelector('app-terminal-hack-live-preview');
      expect(livePreview).toBeFalsy();
      inertFixture.destroy();
    });

    it('should bind targetSpec input to engine targetFormSpec', async () => {
      await asyncSetup();
      const livePreviewDe = fixture.debugElement.query(By.directive(TerminalHackLivePreviewComponent));
      const livePreviewInstance = livePreviewDe.componentInstance as TerminalHackLivePreviewComponent;
      expect(livePreviewInstance.targetSpec()).toEqual(engine.targetFormSpec());
    });

    it('should pass empty formElements when no elements placed', async () => {
      await asyncSetup();
      const livePreviewDe = fixture.debugElement.query(By.directive(TerminalHackLivePreviewComponent));
      const livePreviewInstance = livePreviewDe.componentInstance as TerminalHackLivePreviewComponent;
      expect(livePreviewInstance.formElements()).toEqual([]);
    });

    it('should pass formElements after placement', async () => {
      await asyncSetup();
      component.onPlaceElement('el-1', 'text', 'FormControl');
      fixture.detectChanges();

      const livePreviewDe = fixture.debugElement.query(By.directive(TerminalHackLivePreviewComponent));
      const livePreviewInstance = livePreviewDe.componentInstance as TerminalHackLivePreviewComponent;
      expect(livePreviewInstance.formElements().length).toBe(1);
    });

    it('should forward elementClicked to selectedSlotId', async () => {
      await asyncSetup();
      const slot = fixture.nativeElement.querySelector('.live-preview__slot') as HTMLElement;
      expect(slot).toBeTruthy();
      slot.click();
      fixture.detectChanges();
      expect(component.selectedSlotId()).toBe('el-1');
    });
  });
});
