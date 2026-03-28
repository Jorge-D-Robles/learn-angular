import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideMonacoEditor } from 'ngx-monaco-editor-v2';
import { SystemCertificationComponent } from './system-certification.component';
import { SystemCertificationEngine } from './system-certification.engine';
import { MINIGAME_ENGINE } from '../../../core/minigame/minigame-engine.tokens';
import { KeyboardShortcutService } from '../../../core/minigame/keyboard-shortcut.service';
import {
  DifficultyTier,
  type MinigameLevel,
} from '../../../core/minigame/minigame.types';
import type {
  SystemCertificationLevelData,
  SourceCodeBlock,
  CertificationThreshold,
  CertificationHint,
} from './system-certification.types';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function createSourceCode(overrides?: Partial<SourceCodeBlock>): SourceCodeBlock {
  return {
    lines: [
      { lineNumber: 1, content: 'export class Greeter {', isTestable: false, isBranch: false },
      { lineNumber: 2, content: '  greet(name: string): string {', isTestable: true, isBranch: false },
      { lineNumber: 3, content: '    if (name === "") {', isTestable: true, isBranch: true },
      { lineNumber: 4, content: '      return "Hello, World!";', isTestable: true, isBranch: false },
      { lineNumber: 5, content: '    }', isTestable: false, isBranch: false },
      { lineNumber: 6, content: '    return `Hello, ${name}!`;', isTestable: true, isBranch: false },
      { lineNumber: 7, content: '  }', isTestable: false, isBranch: false },
      { lineNumber: 8, content: '}', isTestable: false, isBranch: false },
    ],
    testablePoints: [2, 3, 4, 6],
    branchPoints: [3],
    ...overrides,
  };
}

function createThreshold(overrides?: Partial<CertificationThreshold>): CertificationThreshold {
  return {
    minCoverage: 80,
    timeLimit: 300,
    maxRedundantTests: 1,
    ...overrides,
  };
}

function createHints(): CertificationHint[] {
  return [
    { order: 1, uncoveredLineNumber: 3, text: 'Test the branch when name is empty' },
    { order: 2, uncoveredLineNumber: 6, text: 'Test the branch when name is provided' },
  ];
}

function createTestLevelData(overrides?: Partial<SystemCertificationLevelData>): SystemCertificationLevelData {
  return {
    sourceCode: createSourceCode(),
    availableTestUtilities: ['testBed', 'componentFixture'],
    threshold: createThreshold(),
    hints: createHints(),
    ...overrides,
  };
}

function createLevel(data: SystemCertificationLevelData): MinigameLevel<SystemCertificationLevelData> {
  return {
    id: 'sc-test-01',
    gameId: 'system-certification',
    tier: DifficultyTier.Basic,
    conceptIntroduced: 'Testing',
    description: 'Test level',
    data,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('SystemCertificationComponent', () => {
  let engine: SystemCertificationEngine;
  let fixture: ComponentFixture<SystemCertificationComponent>;
  let component: SystemCertificationComponent;
  let shortcuts: KeyboardShortcutService;

  function setup(levelData?: SystemCertificationLevelData) {
    engine = new SystemCertificationEngine();
    engine.initialize(createLevel(levelData ?? createTestLevelData()));
    engine.start();

    TestBed.configureTestingModule({
      imports: [SystemCertificationComponent],
      providers: [
        provideMonacoEditor(),
        { provide: MINIGAME_ENGINE, useValue: engine },
      ],
    });

    fixture = TestBed.createComponent(SystemCertificationComponent);
    component = fixture.componentInstance;
    shortcuts = TestBed.inject(KeyboardShortcutService);
    fixture.detectChanges();
  }

  afterEach(() => {
    fixture?.destroy();
  });

  // --- 1. Rendering Tests ---

  describe('Rendering', () => {
    it('should create successfully with engine token provided', () => {
      setup();
      expect(component).toBeTruthy();
    });

    it('should create successfully without engine token (inert mode)', () => {
      TestBed.configureTestingModule({
        imports: [SystemCertificationComponent],
        providers: [provideMonacoEditor()],
      });
      const inertFixture = TestBed.createComponent(SystemCertificationComponent);
      inertFixture.detectChanges();
      expect(inertFixture.componentInstance).toBeTruthy();
      inertFixture.destroy();
    });

    it('should render source code viewer (read-only code editor)', () => {
      setup();
      const sourceEditor = fixture.nativeElement.querySelector('.system-certification__source-panel nx-code-editor');
      expect(sourceEditor).toBeTruthy();
    });

    it('should render test code editor (editable)', () => {
      setup();
      const testEditor = fixture.nativeElement.querySelector('.system-certification__test-panel nx-code-editor');
      expect(testEditor).toBeTruthy();
    });

    it('should render run tests button', () => {
      setup();
      const btn = fixture.nativeElement.querySelector('.system-certification__run-btn') as HTMLButtonElement;
      expect(btn).toBeTruthy();
      expect(btn.textContent).toContain('Run Tests');
    });

    it('should render hint button', () => {
      setup();
      const btn = fixture.nativeElement.querySelector('.system-certification__hint-btn') as HTMLButtonElement;
      expect(btn).toBeTruthy();
      expect(btn.textContent).toContain('Hint');
    });

    it('should render coverage overlay component', () => {
      setup();
      const overlay = fixture.nativeElement.querySelector('app-coverage-overlay');
      expect(overlay).toBeTruthy();
    });
  });

  // --- 2. Source Code Display Tests ---

  describe('Source Code Display', () => {
    it('should expose source code from engine', () => {
      setup();
      expect(component.sourceCode()).toBeTruthy();
      expect(component.sourceCode()!.lines.length).toBe(8);
    });

    it('should format source code content for display', () => {
      setup();
      const content = component.sourceCodeContent();
      expect(content).toContain('export class Greeter');
      expect(content).toContain('greet(name: string)');
    });

    it('should return empty string when no source code', () => {
      TestBed.configureTestingModule({
        imports: [SystemCertificationComponent],
        providers: [provideMonacoEditor()],
      });
      const inertFixture = TestBed.createComponent(SystemCertificationComponent);
      inertFixture.detectChanges();
      expect(inertFixture.componentInstance.sourceCodeContent()).toBe('');
      inertFixture.destroy();
    });
  });

  // --- 3. Test Editor Tests ---

  describe('Test Editor', () => {
    it('should update test code when editor emits', () => {
      setup();
      const testCode = "it('should greet', () => { expect(2).toBe(2); })";
      component.onTestCodeChange(testCode);
      expect(engine.testCode()).toBe(testCode);
    });

    it('should not throw when updating test code without engine', () => {
      TestBed.configureTestingModule({
        imports: [SystemCertificationComponent],
        providers: [provideMonacoEditor()],
      });
      const inertFixture = TestBed.createComponent(SystemCertificationComponent);
      inertFixture.detectChanges();
      expect(() => inertFixture.componentInstance.onTestCodeChange('some code')).not.toThrow();
      inertFixture.destroy();
    });

    it('should reject empty test code submission', () => {
      setup();
      component.onTestCodeChange('   ');
      // Empty test code is rejected by engine (INVALID_NO_CHANGE)
      expect(engine.testCode()).toBe('');
    });
  });

  // --- 4. Run Tests Tests ---

  describe('Run Tests', () => {
    it('should call engine.runTests() on run button click', () => {
      setup();
      const runSpy = vi.spyOn(engine, 'runTests');

      const btn = fixture.nativeElement.querySelector('.system-certification__run-btn') as HTMLButtonElement;
      btn.click();

      expect(runSpy).toHaveBeenCalled();
    });

    it('should display test runs remaining', () => {
      setup();
      const btn = fixture.nativeElement.querySelector('.system-certification__run-btn') as HTMLButtonElement;
      expect(btn.textContent).toContain('3');
    });

    it('should disable run button when test runs remaining is 0', () => {
      setup();
      engine.runTests();
      engine.runTests();
      engine.runTests();
      fixture.detectChanges();

      const btn = fixture.nativeElement.querySelector('.system-certification__run-btn') as HTMLButtonElement;
      expect(btn.disabled).toBe(true);
    });

    it('should display test results after running tests', () => {
      setup();
      const testCode = "it('covers line 2', () => { expect(2).toBe(2); })";
      engine.submitAction({ type: 'submit-test', testCode });
      engine.runTests();
      fixture.detectChanges();

      expect(component.testRunSummary()).toBeTruthy();
      expect(component.testRunSummary()!.totalTests).toBe(1);
    });

    it('should not throw when running tests without engine', () => {
      TestBed.configureTestingModule({
        imports: [SystemCertificationComponent],
        providers: [provideMonacoEditor()],
      });
      const inertFixture = TestBed.createComponent(SystemCertificationComponent);
      inertFixture.detectChanges();
      expect(() => inertFixture.componentInstance.onRunTests()).not.toThrow();
      inertFixture.destroy();
    });
  });

  // --- 5. Test Results Display Tests ---

  describe('Test Results Display', () => {
    it('should show passed test count', () => {
      setup();
      engine.submitAction({ type: 'submit-test', testCode: "it('test 2', () => { expect(2).toBe(2); })" });
      engine.runTests();
      fixture.detectChanges();

      const results = fixture.nativeElement.querySelector('.system-certification__results');
      expect(results).toBeTruthy();
      expect(results.textContent).toContain('1 passed');
    });

    it('should show no results before running tests', () => {
      setup();
      const results = fixture.nativeElement.querySelector('.system-certification__results');
      expect(results).toBeNull();
    });
  });

  // --- 6. Coverage Tests ---

  describe('Coverage', () => {
    it('should expose coverage result from engine', () => {
      setup();
      expect(component.coverage()).toBeNull();

      engine.submitAction({ type: 'submit-test', testCode: "it('test 2', () => { expect(2).toBe(2); })" });
      engine.runTests();

      expect(component.coverage()).toBeTruthy();
    });

    it('should toggle coverage overlay visibility', () => {
      setup();
      expect(component.coverageVisible()).toBe(false);

      component.onToggleCoverage();
      expect(component.coverageVisible()).toBe(true);

      component.onToggleCoverage();
      expect(component.coverageVisible()).toBe(false);
    });
  });

  // --- 7. Hint System Tests ---

  describe('Hint System', () => {
    it('should request hint from engine on hint button click', () => {
      setup();
      const submitSpy = vi.spyOn(engine, 'submitAction');

      const btn = fixture.nativeElement.querySelector('.system-certification__hint-btn') as HTMLButtonElement;
      btn.click();

      expect(submitSpy).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'use-hint' }),
      );
    });

    it('should expose hints revealed from engine', () => {
      setup();
      expect(component.hintsRevealed().length).toBe(0);

      engine.submitAction({ type: 'use-hint' });
      expect(component.hintsRevealed().length).toBe(1);
      expect(component.hintsRevealed()[0].text).toBe('Test the branch when name is empty');
    });

    it('should show latest hint line number for coverage overlay', () => {
      setup();
      expect(component.latestHintLineNumber()).toBeNull();

      engine.submitAction({ type: 'use-hint' });
      expect(component.latestHintLineNumber()).toBe(3);
    });

    it('should not throw when requesting hint without engine', () => {
      TestBed.configureTestingModule({
        imports: [SystemCertificationComponent],
        providers: [provideMonacoEditor()],
      });
      const inertFixture = TestBed.createComponent(SystemCertificationComponent);
      inertFixture.detectChanges();
      expect(() => inertFixture.componentInstance.onUseHint()).not.toThrow();
      inertFixture.destroy();
    });
  });

  // --- 8. Keyboard Shortcuts Tests ---

  describe('Keyboard Shortcuts', () => {
    it('should register shortcuts r, h, c, escape on init', () => {
      setup();
      const registered = shortcuts.getRegistered();
      expect(registered.find(r => r.key === 'r')).toBeDefined();
      expect(registered.find(r => r.key === 'h')).toBeDefined();
      expect(registered.find(r => r.key === 'c')).toBeDefined();
      expect(registered.find(r => r.key === 'escape')).toBeDefined();
    });

    it('should trigger runTests on r key', () => {
      setup();
      const runSpy = vi.spyOn(engine, 'runTests');

      const reg = shortcuts.getRegistered().find(r => r.key === 'r');
      reg?.callback();

      expect(runSpy).toHaveBeenCalled();
    });

    it('should trigger useHint on h key', () => {
      setup();
      const submitSpy = vi.spyOn(engine, 'submitAction');

      const reg = shortcuts.getRegistered().find(r => r.key === 'h');
      reg?.callback();

      expect(submitSpy).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'use-hint' }),
      );
    });

    it('should toggle coverage on c key', () => {
      setup();
      expect(component.coverageVisible()).toBe(false);

      const reg = shortcuts.getRegistered().find(r => r.key === 'c');
      reg?.callback();
      expect(component.coverageVisible()).toBe(true);

      reg?.callback();
      expect(component.coverageVisible()).toBe(false);
    });

    it('should unregister all shortcuts on destroy', () => {
      setup();
      const unregisterSpy = vi.spyOn(shortcuts, 'unregister');

      component.ngOnDestroy();

      expect(unregisterSpy).toHaveBeenCalledTimes(4);
      expect(unregisterSpy).toHaveBeenCalledWith('r');
      expect(unregisterSpy).toHaveBeenCalledWith('h');
      expect(unregisterSpy).toHaveBeenCalledWith('c');
      expect(unregisterSpy).toHaveBeenCalledWith('escape');
    });
  });

  // --- 9. Edge Cases ---

  describe('Edge Cases', () => {
    it('should handle engine with no source code gracefully', () => {
      setup(createTestLevelData({
        sourceCode: { lines: [], testablePoints: [], branchPoints: [] },
      }));
      expect(component.sourceCode()).toBeTruthy();
      expect(component.sourceCode()!.lines.length).toBe(0);
      expect(component.sourceCodeContent()).toBe('');
    });

    it('should handle no hints available', () => {
      setup(createTestLevelData({ hints: [] }));
      engine.submitAction({ type: 'use-hint' });
      expect(component.hintsRevealed().length).toBe(0);
    });

    it('should handle no engine gracefully for all actions', () => {
      TestBed.configureTestingModule({
        imports: [SystemCertificationComponent],
        providers: [provideMonacoEditor()],
      });
      const inertFixture = TestBed.createComponent(SystemCertificationComponent);
      inertFixture.detectChanges();
      const inertComponent = inertFixture.componentInstance;

      // These should not throw
      inertComponent.onRunTests();
      inertComponent.onUseHint();
      inertComponent.onTestCodeChange('some code');
      inertComponent.onToggleCoverage();

      expect(inertComponent.sourceCode()).toBeNull();
      expect(inertComponent.testRunSummary()).toBeNull();
      expect(inertComponent.coverage()).toBeNull();
      expect(inertComponent.hintsRevealed()).toEqual([]);
      inertFixture.destroy();
    });
  });
});
