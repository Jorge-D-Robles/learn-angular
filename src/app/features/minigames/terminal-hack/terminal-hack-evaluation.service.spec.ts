import { TestBed } from '@angular/core/testing';
import {
  TerminalHackFormEvaluationService,
} from './terminal-hack-evaluation.service';
import type { PlayerFormElement } from './terminal-hack.engine';
import type {
  TargetFormSpec,
  FormTestCase,
  FormElementSpec,
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

function makePlacedElements(
  entries: [string, Partial<PlayerFormElement>][],
): ReadonlyMap<string, PlayerFormElement> {
  const map = new Map<string, PlayerFormElement>();
  for (const [key, partial] of entries) {
    map.set(key, {
      elementId: partial.elementId ?? key,
      elementType: partial.elementType ?? 'text',
      toolType: partial.toolType ?? 'FormControl',
      validations: partial.validations ?? [],
    });
  }
  return map;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('TerminalHackFormEvaluationService', () => {
  let service: TerminalHackFormEvaluationService;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [TerminalHackFormEvaluationService],
    });
    service = TestBed.inject(TerminalHackFormEvaluationService);
  });

  // =========================================================================
  // 1. Creation and initial state
  // =========================================================================
  describe('Creation and initial state', () => {
    it('should be created via TestBed', () => {
      expect(service).toBeTruthy();
    });

    it('getTestPassRate() returns 0 before any test run', () => {
      expect(service.getTestPassRate()).toBe(0);
    });
  });

  // =========================================================================
  // 2. evaluateForm
  // =========================================================================
  describe('evaluateForm', () => {
    it('correct placement returns all correctType/correctTool/correctValidations true', () => {
      const spec = makeTargetFormSpec();
      const placed = makePlacedElements([
        ['el-1', {
          elementType: 'text',
          toolType: 'FormControl',
          validations: [{ type: 'required', errorMessage: 'Username is required' }],
        }],
      ]);
      const results = service.evaluateForm(placed, spec);
      expect(results.length).toBe(1);
      expect(results[0].elementId).toBe('el-1');
      expect(results[0].correctType).toBe(true);
      expect(results[0].correctTool).toBe(true);
      expect(results[0].correctValidations).toBe(true);
      expect(results[0].missingValidations).toEqual([]);
    });

    it('wrong element type returns correctType false for that element', () => {
      const spec = makeTargetFormSpec();
      const placed = makePlacedElements([
        ['el-1', {
          elementType: 'email', // Wrong -- spec expects 'text'
          toolType: 'FormControl',
          validations: [{ type: 'required', errorMessage: 'Username is required' }],
        }],
      ]);
      const results = service.evaluateForm(placed, spec);
      expect(results[0].correctType).toBe(false);
      expect(results[0].correctTool).toBe(true);
    });

    it('wrong tool type (template-driven tool in reactive form) returns correctTool false', () => {
      const spec = makeTargetFormSpec({ formType: 'reactive' });
      const placed = makePlacedElements([
        ['el-1', {
          elementType: 'text',
          toolType: 'ngModel', // Template-driven tool in reactive form
          validations: [{ type: 'required', errorMessage: 'Username is required' }],
        }],
      ]);
      const results = service.evaluateForm(placed, spec);
      expect(results[0].correctTool).toBe(false);
    });

    it('missing validation returns correctValidations false with missingValidations list', () => {
      const spec = makeTargetFormSpec({
        elements: [
          {
            id: 'el-1',
            elementType: 'text',
            label: 'Username',
            name: 'username',
            validations: [
              { type: 'required', errorMessage: 'Required' },
              { type: 'minLength', params: 3, errorMessage: 'Too short' },
            ],
          },
        ],
      });
      const placed = makePlacedElements([
        ['el-1', {
          elementType: 'text',
          toolType: 'FormControl',
          validations: [{ type: 'required', errorMessage: 'Required' }],
          // Missing 'minLength' validation
        }],
      ]);
      const results = service.evaluateForm(placed, spec);
      expect(results[0].correctValidations).toBe(false);
      expect(results[0].missingValidations).toEqual(['minLength']);
    });

    it('empty placed map returns results for all spec elements with defaults', () => {
      const spec = makeTargetFormSpec();
      const placed: ReadonlyMap<string, PlayerFormElement> = new Map();
      const results = service.evaluateForm(placed, spec);
      expect(results.length).toBe(1);
      expect(results[0].correctType).toBe(false);
      expect(results[0].correctTool).toBe(false);
      expect(results[0].correctValidations).toBe(false);
    });
  });

  // =========================================================================
  // 3. runTestCases
  // =========================================================================
  describe('runTestCases', () => {
    it('all tests pass with correct form configuration', () => {
      const spec = makeTargetFormSpec();
      const placed = makePlacedElements([
        ['el-1', {
          elementType: 'text',
          toolType: 'FormControl',
          validations: [{ type: 'required', errorMessage: 'Username is required' }],
        }],
      ]);
      const testCases = [makeTestCase()];
      const result = service.runTestCases(placed, testCases, spec);
      expect(result.allPassed).toBe(true);
      expect(result.passRate).toBe(1.0);
      expect(result.passCount).toBe(1);
      expect(result.failCount).toBe(0);
    });

    it('test fails when element type is wrong', () => {
      const spec = makeTargetFormSpec();
      const placed = makePlacedElements([
        ['el-1', {
          elementType: 'email', // Wrong
          toolType: 'FormControl',
          validations: [{ type: 'required', errorMessage: 'Username is required' }],
        }],
      ]);
      const result = service.runTestCases(placed, [makeTestCase()], spec);
      expect(result.allPassed).toBe(false);
    });

    it('test fails when required validation missing (empty input expected invalid but form says valid)', () => {
      const spec = makeTargetFormSpec();
      const placed = makePlacedElements([
        ['el-1', {
          elementType: 'text',
          toolType: 'FormControl',
          // No validations set
        }],
      ]);
      const testCases = [
        makeTestCase({ id: 'tc-empty', inputValues: { username: '' }, expectedValid: false }),
      ];
      const result = service.runTestCases(placed, testCases, spec);
      expect(result.allPassed).toBe(false);
      expect(result.testCaseResults[0].expectedValid).toBe(false);
      expect(result.testCaseResults[0].actualValid).toBe(true);
    });

    it('multiple test cases: passRate = passCount / total', () => {
      const spec = makeTargetFormSpec();
      const placed = makePlacedElements([
        ['el-1', {
          elementType: 'text',
          toolType: 'FormControl',
          validations: [{ type: 'required', errorMessage: 'Required' }],
        }],
      ]);
      const testCases: FormTestCase[] = [
        makeTestCase({ id: 'tc-1', inputValues: { username: 'alice' }, expectedValid: true }),
        makeTestCase({ id: 'tc-2', inputValues: { username: '' }, expectedValid: false }),
        // This third test expects valid, but '' is invalid with required validation
        makeTestCase({ id: 'tc-3', inputValues: { username: '' }, expectedValid: true }),
      ];
      const result = service.runTestCases(placed, testCases, spec);
      // tc-1 passes (alice is valid, expectedValid=true)
      // tc-2 passes ('' is invalid, expectedValid=false)
      // tc-3 fails ('' is invalid, but expectedValid=true)
      expect(result.passCount).toBe(2);
      expect(result.failCount).toBe(1);
      expect(result.passRate).toBeCloseTo(2 / 3);
    });

    it('empty test cases array: allPassed false, passRate 0', () => {
      const spec = makeTargetFormSpec();
      const placed = makePlacedElements([
        ['el-1', { elementType: 'text', toolType: 'FormControl' }],
      ]);
      const result = service.runTestCases(placed, [], spec);
      expect(result.allPassed).toBe(false);
      expect(result.passRate).toBe(0);
    });

    it('expected errors mismatch causes test case failure', () => {
      const spec = makeTargetFormSpec({
        elements: [
          {
            id: 'el-1',
            elementType: 'text',
            label: 'Username',
            name: 'username',
            validations: [{ type: 'required', errorMessage: 'Required' }],
          },
        ],
      });
      const placed = makePlacedElements([
        ['el-1', {
          elementType: 'text',
          toolType: 'FormControl',
          validations: [{ type: 'required', errorMessage: 'Required' }],
        }],
      ]);
      const testCases = [
        makeTestCase({
          id: 'tc-err',
          inputValues: { username: '' },
          expectedValid: false,
          expectedErrors: { username: ['required', 'email'] }, // 'email' error not produced
        }),
      ];
      const result = service.runTestCases(placed, testCases, spec);
      expect(result.allPassed).toBe(false);
      expect(result.testCaseResults[0].passed).toBe(false);
      expect(result.testCaseResults[0].errorMismatches.length).toBeGreaterThan(0);
    });

    it('caches result for getTestPassRate', () => {
      const spec = makeTargetFormSpec();
      const placed = makePlacedElements([
        ['el-1', {
          elementType: 'text',
          toolType: 'FormControl',
          validations: [{ type: 'required', errorMessage: 'Required' }],
        }],
      ]);
      service.runTestCases(placed, [makeTestCase()], spec);
      expect(service.getTestPassRate()).toBe(1.0);
    });
  });

  // =========================================================================
  // 4. generatePreview
  // =========================================================================
  describe('generatePreview', () => {
    it('empty placed map returns empty preview with completionRatio 0', () => {
      const spec = makeTargetFormSpec();
      const placed: ReadonlyMap<string, PlayerFormElement> = new Map();
      const preview = service.generatePreview(placed, spec);
      expect(preview.elements).toEqual([]);
      expect(preview.completionRatio).toBe(0);
      expect(preview.isComplete).toBe(false);
    });

    it('placed elements appear in preview.elements', () => {
      const spec = makeTargetFormSpec();
      const placed = makePlacedElements([
        ['el-1', { elementType: 'text', toolType: 'FormControl' }],
      ]);
      const preview = service.generatePreview(placed, spec);
      expect(preview.elements.length).toBe(1);
      expect(preview.elements[0].elementId).toBe('el-1');
    });

    it('isComplete true when placed count >= spec elements count', () => {
      const spec = makeTargetFormSpec({
        elements: [
          { id: 'a', elementType: 'text', label: 'A', name: 'a', validations: [] },
          { id: 'b', elementType: 'email', label: 'B', name: 'b', validations: [] },
        ],
      });
      const placed = makePlacedElements([
        ['a', { elementType: 'text', toolType: 'FormControl' }],
        ['b', { elementType: 'email', toolType: 'FormControl' }],
      ]);
      const preview = service.generatePreview(placed, spec);
      expect(preview.isComplete).toBe(true);
      expect(preview.completionRatio).toBe(1);
    });

    it('formType matches spec formType', () => {
      const spec = makeTargetFormSpec({ formType: 'template-driven' });
      const placed: ReadonlyMap<string, PlayerFormElement> = new Map();
      const preview = service.generatePreview(placed, spec);
      expect(preview.formType).toBe('template-driven');
    });
  });

  // =========================================================================
  // 5. validateFormStructure
  // =========================================================================
  describe('validateFormStructure', () => {
    it('all elements present and correct type: valid true, empty missingElements/incorrectTypes', () => {
      const requiredElements: readonly FormElementSpec[] = [
        { id: 'el-1', elementType: 'text', label: 'Username', name: 'username', validations: [] },
      ];
      const placed = makePlacedElements([
        ['el-1', { elementType: 'text', toolType: 'FormControl' }],
      ]);
      const result = service.validateFormStructure(placed, requiredElements);
      expect(result.valid).toBe(true);
      expect(result.missingElements).toEqual([]);
      expect(result.incorrectTypes).toEqual([]);
    });

    it('missing element: valid false, element name in missingElements', () => {
      const requiredElements: readonly FormElementSpec[] = [
        { id: 'el-1', elementType: 'text', label: 'Username', name: 'username', validations: [] },
        { id: 'el-2', elementType: 'email', label: 'Email', name: 'email', validations: [] },
      ];
      const placed = makePlacedElements([
        ['el-1', { elementType: 'text', toolType: 'FormControl' }],
      ]);
      const result = service.validateFormStructure(placed, requiredElements);
      expect(result.valid).toBe(false);
      expect(result.missingElements).toContain('email');
    });

    it('wrong element type: valid false, element name in incorrectTypes', () => {
      const requiredElements: readonly FormElementSpec[] = [
        { id: 'el-1', elementType: 'text', label: 'Username', name: 'username', validations: [] },
      ];
      const placed = makePlacedElements([
        ['el-1', { elementType: 'email', toolType: 'FormControl' }], // Wrong type
      ]);
      const result = service.validateFormStructure(placed, requiredElements);
      expect(result.valid).toBe(false);
      expect(result.incorrectTypes).toContain('username');
    });

    it('empty placed map with required elements: all reported as missing', () => {
      const requiredElements: readonly FormElementSpec[] = [
        { id: 'el-1', elementType: 'text', label: 'Username', name: 'username', validations: [] },
        { id: 'el-2', elementType: 'email', label: 'Email', name: 'email', validations: [] },
      ];
      const placed: ReadonlyMap<string, PlayerFormElement> = new Map();
      const result = service.validateFormStructure(placed, requiredElements);
      expect(result.valid).toBe(false);
      expect(result.missingElements).toEqual(['username', 'email']);
      expect(result.incorrectTypes).toEqual([]);
    });
  });

  // =========================================================================
  // 6. getTestPassRate
  // =========================================================================
  describe('getTestPassRate', () => {
    it('returns 0 before any test run', () => {
      expect(service.getTestPassRate()).toBe(0);
    });

    it('returns correct pass rate after runTestCases', () => {
      const spec = makeTargetFormSpec();
      const placed = makePlacedElements([
        ['el-1', {
          elementType: 'text',
          toolType: 'FormControl',
          validations: [{ type: 'required', errorMessage: 'Required' }],
        }],
      ]);
      service.runTestCases(placed, [makeTestCase()], spec);
      expect(service.getTestPassRate()).toBe(1.0);
    });

    it('resets to 0 after reset()', () => {
      const spec = makeTargetFormSpec();
      const placed = makePlacedElements([
        ['el-1', {
          elementType: 'text',
          toolType: 'FormControl',
          validations: [{ type: 'required', errorMessage: 'Required' }],
        }],
      ]);
      service.runTestCases(placed, [makeTestCase()], spec);
      expect(service.getTestPassRate()).toBe(1.0);
      service.reset();
      expect(service.getTestPassRate()).toBe(0);
    });
  });

  // =========================================================================
  // 7. reset
  // =========================================================================
  describe('reset', () => {
    it('clears cached test pass rate', () => {
      const spec = makeTargetFormSpec();
      const placed = makePlacedElements([
        ['el-1', {
          elementType: 'text',
          toolType: 'FormControl',
          validations: [{ type: 'required', errorMessage: 'Required' }],
        }],
      ]);
      service.runTestCases(placed, [makeTestCase()], spec);
      service.reset();
      expect(service.getTestPassRate()).toBe(0);
    });

    it('can run tests again after reset', () => {
      const spec = makeTargetFormSpec();
      const placed = makePlacedElements([
        ['el-1', {
          elementType: 'text',
          toolType: 'FormControl',
          validations: [{ type: 'required', errorMessage: 'Required' }],
        }],
      ]);
      service.runTestCases(placed, [makeTestCase()], spec);
      service.reset();
      const result = service.runTestCases(placed, [makeTestCase()], spec);
      expect(result.allPassed).toBe(true);
      expect(service.getTestPassRate()).toBe(1.0);
    });
  });

  // =========================================================================
  // 8. Validation rule evaluation (extracted from engine)
  // =========================================================================
  describe('Validation rule evaluation', () => {
    // We test validation rules indirectly through runTestCases by crafting
    // specific test cases with input values and expected validity.

    it('required: empty string fails', () => {
      const spec = makeTargetFormSpec({
        elements: [
          { id: 'el-1', elementType: 'text', label: 'Name', name: 'name', validations: [{ type: 'required', errorMessage: 'R' }] },
        ],
      });
      const placed = makePlacedElements([
        ['el-1', { elementType: 'text', toolType: 'FormControl', validations: [{ type: 'required', errorMessage: 'R' }] }],
      ]);
      const result = service.runTestCases(placed, [
        makeTestCase({ inputValues: { name: '' }, expectedValid: false }),
      ], spec);
      expect(result.allPassed).toBe(true);
    });

    it('required: non-empty passes', () => {
      const spec = makeTargetFormSpec({
        elements: [
          { id: 'el-1', elementType: 'text', label: 'Name', name: 'name', validations: [{ type: 'required', errorMessage: 'R' }] },
        ],
      });
      const placed = makePlacedElements([
        ['el-1', { elementType: 'text', toolType: 'FormControl', validations: [{ type: 'required', errorMessage: 'R' }] }],
      ]);
      const result = service.runTestCases(placed, [
        makeTestCase({ inputValues: { name: 'hello' }, expectedValid: true }),
      ], spec);
      expect(result.allPassed).toBe(true);
    });

    it('email: valid email passes, invalid fails', () => {
      const spec = makeTargetFormSpec({
        elements: [
          { id: 'el-1', elementType: 'email', label: 'Email', name: 'email', validations: [{ type: 'email', errorMessage: 'E' }] },
        ],
      });
      const placed = makePlacedElements([
        ['el-1', { elementType: 'email', toolType: 'FormControl', validations: [{ type: 'email', errorMessage: 'E' }] }],
      ]);
      const validResult = service.runTestCases(placed, [
        makeTestCase({ inputValues: { email: 'a@b.com' }, expectedValid: true }),
      ], spec);
      expect(validResult.allPassed).toBe(true);
      const invalidResult = service.runTestCases(placed, [
        makeTestCase({ inputValues: { email: 'notanemail' }, expectedValid: false }),
      ], spec);
      expect(invalidResult.allPassed).toBe(true);
    });

    it('pattern: matching regex passes, non-matching fails', () => {
      const spec = makeTargetFormSpec({
        elements: [
          { id: 'el-1', elementType: 'text', label: 'Code', name: 'code', validations: [{ type: 'pattern', params: '^[A-Z]+$', errorMessage: 'P' }] },
        ],
      });
      const placed = makePlacedElements([
        ['el-1', { elementType: 'text', toolType: 'FormControl', validations: [{ type: 'pattern', params: '^[A-Z]+$', errorMessage: 'P' }] }],
      ]);
      const passResult = service.runTestCases(placed, [
        makeTestCase({ inputValues: { code: 'ABC' }, expectedValid: true }),
      ], spec);
      expect(passResult.allPassed).toBe(true);
      const failResult = service.runTestCases(placed, [
        makeTestCase({ inputValues: { code: 'abc' }, expectedValid: false }),
      ], spec);
      expect(failResult.allPassed).toBe(true);
    });

    it('min/max: numeric boundary', () => {
      const spec = makeTargetFormSpec({
        elements: [
          { id: 'el-1', elementType: 'number', label: 'Age', name: 'age', validations: [{ type: 'min', params: 18, errorMessage: 'M' }, { type: 'max', params: 99, errorMessage: 'X' }] },
        ],
      });
      const placed = makePlacedElements([
        ['el-1', { elementType: 'number', toolType: 'FormControl', validations: [{ type: 'min', params: 18, errorMessage: 'M' }, { type: 'max', params: 99, errorMessage: 'X' }] }],
      ]);
      // Value within bounds
      const passResult = service.runTestCases(placed, [
        makeTestCase({ inputValues: { age: '25' }, expectedValid: true }),
      ], spec);
      expect(passResult.allPassed).toBe(true);
      // Value below min
      const failResult = service.runTestCases(placed, [
        makeTestCase({ inputValues: { age: '10' }, expectedValid: false }),
      ], spec);
      expect(failResult.allPassed).toBe(true);
    });

    it('minLength/maxLength: string length boundary', () => {
      const spec = makeTargetFormSpec({
        elements: [
          { id: 'el-1', elementType: 'text', label: 'Name', name: 'name', validations: [{ type: 'minLength', params: 3, errorMessage: 'L' }, { type: 'maxLength', params: 10, errorMessage: 'X' }] },
        ],
      });
      const placed = makePlacedElements([
        ['el-1', { elementType: 'text', toolType: 'FormControl', validations: [{ type: 'minLength', params: 3, errorMessage: 'L' }, { type: 'maxLength', params: 10, errorMessage: 'X' }] }],
      ]);
      // Within bounds
      const passResult = service.runTestCases(placed, [
        makeTestCase({ inputValues: { name: 'hello' }, expectedValid: true }),
      ], spec);
      expect(passResult.allPassed).toBe(true);
      // Too short
      const failResult = service.runTestCases(placed, [
        makeTestCase({ inputValues: { name: 'ab' }, expectedValid: false }),
      ], spec);
      expect(failResult.allPassed).toBe(true);
    });

    it('custom: always passes (deferred to simulation)', () => {
      const spec = makeTargetFormSpec({
        elements: [
          { id: 'el-1', elementType: 'text', label: 'Name', name: 'name', validations: [{ type: 'custom', errorMessage: 'C' }] },
        ],
      });
      const placed = makePlacedElements([
        ['el-1', { elementType: 'text', toolType: 'FormControl', validations: [{ type: 'custom', errorMessage: 'C' }] }],
      ]);
      const result = service.runTestCases(placed, [
        makeTestCase({ inputValues: { name: 'anything' }, expectedValid: true }),
      ], spec);
      expect(result.allPassed).toBe(true);
    });
  });

  // =========================================================================
  // 9. Tool type validation
  // =========================================================================
  describe('Tool type validation', () => {
    it('validator tools valid for both form types', () => {
      // Reactive form with Validators.required tool
      const reactiveSpec = makeTargetFormSpec({ formType: 'reactive' });
      const placed = makePlacedElements([
        ['el-1', { elementType: 'text', toolType: 'Validators.required', validations: [{ type: 'required', errorMessage: 'R' }] }],
      ]);
      const reactiveResults = service.evaluateForm(placed, reactiveSpec);
      expect(reactiveResults[0].correctTool).toBe(true);

      // Template-driven form with same Validators.required tool
      const tdSpec = makeTargetFormSpec({ formType: 'template-driven' });
      const tdResults = service.evaluateForm(placed, tdSpec);
      expect(tdResults[0].correctTool).toBe(true);
    });

    it('template-driven tools valid only for template-driven', () => {
      const placed = makePlacedElements([
        ['el-1', { elementType: 'text', toolType: 'ngModel', validations: [{ type: 'required', errorMessage: 'R' }] }],
      ]);
      const tdSpec = makeTargetFormSpec({ formType: 'template-driven' });
      const tdResults = service.evaluateForm(placed, tdSpec);
      expect(tdResults[0].correctTool).toBe(true);

      const reactiveSpec = makeTargetFormSpec({ formType: 'reactive' });
      const reactiveResults = service.evaluateForm(placed, reactiveSpec);
      expect(reactiveResults[0].correctTool).toBe(false);
    });

    it('reactive tools valid only for reactive', () => {
      const placed = makePlacedElements([
        ['el-1', { elementType: 'text', toolType: 'FormControl', validations: [{ type: 'required', errorMessage: 'R' }] }],
      ]);
      const reactiveSpec = makeTargetFormSpec({ formType: 'reactive' });
      const reactiveResults = service.evaluateForm(placed, reactiveSpec);
      expect(reactiveResults[0].correctTool).toBe(true);

      const tdSpec = makeTargetFormSpec({ formType: 'template-driven' });
      const tdResults = service.evaluateForm(placed, tdSpec);
      expect(tdResults[0].correctTool).toBe(false);
    });
  });
});
