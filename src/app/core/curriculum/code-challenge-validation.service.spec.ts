import { TestBed } from '@angular/core/testing';
import { CodeChallengeValidationService } from './code-challenge-validation.service';
import type {
  ContainsRule,
  PatternRule,
  NotContainsRule,
  LineCountRule,
  OrderRule,
  ValidationRule,
} from './story-mission-content.types';

describe('CodeChallengeValidationService', () => {
  let service: CodeChallengeValidationService;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    service = TestBed.inject(CodeChallengeValidationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // --- contains rule ---

  describe('contains rule', () => {
    it('should pass when code contains the exact substring', () => {
      const rule: ContainsRule = {
        type: 'contains',
        value: 'ngOnInit',
        errorMessage: 'Must contain ngOnInit',
      };
      const result = service.validateCode('ngOnInit() {}', [rule]);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should fail when code does not contain the substring', () => {
      const rule: ContainsRule = {
        type: 'contains',
        value: 'ngOnInit',
        errorMessage: 'Must contain ngOnInit',
      };
      const result = service.validateCode('constructor() {}', [rule]);
      expect(result.valid).toBe(false);
      expect(result.errors).toEqual(['Must contain ngOnInit']);
    });

    it('should be case-sensitive by default', () => {
      const rule: ContainsRule = {
        type: 'contains',
        value: 'NgOnInit',
        errorMessage: 'Must contain NgOnInit',
      };
      const result = service.validateCode('ngoninit() {}', [rule]);
      expect(result.valid).toBe(false);
    });

    it('should support case-insensitive matching when caseSensitive is false', () => {
      const rule: ContainsRule = {
        type: 'contains',
        value: 'NgOnInit',
        caseSensitive: false,
        errorMessage: 'Must contain NgOnInit',
      };
      const result = service.validateCode('ngoninit() {}', [rule]);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should handle empty value string (always passes)', () => {
      const rule: ContainsRule = {
        type: 'contains',
        value: '',
        errorMessage: 'Should not fire',
      };
      const result = service.validateCode('any code', [rule]);
      expect(result.valid).toBe(true);
    });
  });

  // --- pattern rule ---

  describe('pattern rule', () => {
    it('should pass when code matches the regex pattern', () => {
      const rule: PatternRule = {
        type: 'pattern',
        pattern: '@Component\\(',
        errorMessage: 'Must have @Component decorator',
      };
      const result = service.validateCode('@Component({ selector: "app-test" })', [rule]);
      expect(result.valid).toBe(true);
    });

    it('should fail when code does not match the pattern', () => {
      const rule: PatternRule = {
        type: 'pattern',
        pattern: '@Component\\(',
        errorMessage: 'Must have @Component decorator',
      };
      const result = service.validateCode('class TestComponent {}', [rule]);
      expect(result.valid).toBe(false);
      expect(result.errors).toEqual(['Must have @Component decorator']);
    });

    it('should support regex flags (e.g., i for case-insensitive)', () => {
      const rule: PatternRule = {
        type: 'pattern',
        pattern: 'hello world',
        flags: 'i',
        errorMessage: 'Must contain hello world',
      };
      const result = service.validateCode('HELLO WORLD', [rule]);
      expect(result.valid).toBe(true);
    });

    it('should handle multiline patterns with m flag', () => {
      const rule: PatternRule = {
        type: 'pattern',
        pattern: '^import',
        flags: 'm',
        errorMessage: 'Must have import at start of a line',
      };
      const code = 'const x = 1;\nimport { Foo } from "bar";';
      const result = service.validateCode(code, [rule]);
      expect(result.valid).toBe(true);
    });

    it('should return a descriptive error for invalid regex (not throw)', () => {
      const rule: PatternRule = {
        type: 'pattern',
        pattern: '(unclosed',
        errorMessage: 'Original error message',
      };
      const result = service.validateCode('any code', [rule]);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBe(1);
      expect(result.errors[0]).toContain('Invalid regex');
    });

    it('should not exhibit lastIndex drift when pattern has g flag', () => {
      const rule: PatternRule = {
        type: 'pattern',
        pattern: 'foo',
        flags: 'g',
        errorMessage: 'Must contain foo',
      };
      // Call twice to verify no lastIndex drift
      const result1 = service.validateCode('foo bar', [rule]);
      const result2 = service.validateCode('foo bar', [rule]);
      expect(result1.valid).toBe(true);
      expect(result2.valid).toBe(true);
    });
  });

  // --- notContains rule ---

  describe('notContains rule', () => {
    it('should pass when code does not contain the substring', () => {
      const rule: NotContainsRule = {
        type: 'notContains',
        value: 'var ',
        errorMessage: 'Do not use var',
      };
      const result = service.validateCode('const x = 1;', [rule]);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should fail when code contains the substring', () => {
      const rule: NotContainsRule = {
        type: 'notContains',
        value: 'var ',
        errorMessage: 'Do not use var',
      };
      const result = service.validateCode('var x = 1;', [rule]);
      expect(result.valid).toBe(false);
      expect(result.errors).toEqual(['Do not use var']);
    });

    it('should support case-insensitive matching when caseSensitive is false', () => {
      const rule: NotContainsRule = {
        type: 'notContains',
        value: 'VAR',
        caseSensitive: false,
        errorMessage: 'Do not use var',
      };
      const result = service.validateCode('var x = 1;', [rule]);
      expect(result.valid).toBe(false);
      expect(result.errors).toEqual(['Do not use var']);
    });
  });

  // --- lineCount rule ---

  describe('lineCount rule', () => {
    it('should pass when line count is within min and max bounds', () => {
      const rule: LineCountRule = {
        type: 'lineCount',
        min: 2,
        max: 5,
        errorMessage: 'Must be 2-5 lines',
      };
      const result = service.validateCode('line1\nline2\nline3', [rule]);
      expect(result.valid).toBe(true);
    });

    it('should fail when line count is below min', () => {
      const rule: LineCountRule = {
        type: 'lineCount',
        min: 3,
        errorMessage: 'Must be at least 3 lines',
      };
      const result = service.validateCode('line1\nline2', [rule]);
      expect(result.valid).toBe(false);
      expect(result.errors).toEqual(['Must be at least 3 lines']);
    });

    it('should fail when line count exceeds max', () => {
      const rule: LineCountRule = {
        type: 'lineCount',
        max: 2,
        errorMessage: 'Must be at most 2 lines',
      };
      const result = service.validateCode('line1\nline2\nline3', [rule]);
      expect(result.valid).toBe(false);
      expect(result.errors).toEqual(['Must be at most 2 lines']);
    });

    it('should pass when only min is specified and line count meets it', () => {
      const rule: LineCountRule = {
        type: 'lineCount',
        min: 2,
        errorMessage: 'Must be at least 2 lines',
      };
      const result = service.validateCode('line1\nline2\nline3', [rule]);
      expect(result.valid).toBe(true);
    });

    it('should pass when only max is specified and line count is under it', () => {
      const rule: LineCountRule = {
        type: 'lineCount',
        max: 5,
        errorMessage: 'Must be at most 5 lines',
      };
      const result = service.validateCode('line1\nline2', [rule]);
      expect(result.valid).toBe(true);
    });

    it('should count all lines including blank lines', () => {
      const rule: LineCountRule = {
        type: 'lineCount',
        min: 4,
        max: 4,
        errorMessage: 'Must be exactly 4 lines',
      };
      // 4 lines: "line1", "", "  ", "line4"
      const result = service.validateCode('line1\n\n  \nline4', [rule]);
      expect(result.valid).toBe(true);
    });

    it('should pass as no-op when both min and max are omitted', () => {
      const rule: LineCountRule = {
        type: 'lineCount',
        errorMessage: 'Should never fire',
      };
      const result = service.validateCode('anything', [rule]);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });
  });

  // --- order rule ---

  describe('order rule', () => {
    it('should pass when patterns appear in the correct order', () => {
      const rule: OrderRule = {
        type: 'order',
        patterns: ['import', 'class', 'export'],
        errorMessage: 'Must appear in order: import, class, export',
      };
      const code = 'import { X } from "y";\nclass Foo {}\nexport default Foo;';
      const result = service.validateCode(code, [rule]);
      expect(result.valid).toBe(true);
    });

    it('should fail when patterns appear in wrong order', () => {
      const rule: OrderRule = {
        type: 'order',
        patterns: ['class', 'import'],
        errorMessage: 'class must come before import',
      };
      const code = 'import { X } from "y";\nclass Foo {}';
      const result = service.validateCode(code, [rule]);
      expect(result.valid).toBe(false);
      expect(result.errors).toEqual(['class must come before import']);
    });

    it('should fail when a pattern is not found in the code', () => {
      const rule: OrderRule = {
        type: 'order',
        patterns: ['import', 'nonexistent'],
        errorMessage: 'Patterns not found in order',
      };
      const result = service.validateCode('import { X } from "y";', [rule]);
      expect(result.valid).toBe(false);
    });

    it('should handle a single pattern (passes if found)', () => {
      const rule: OrderRule = {
        type: 'order',
        patterns: ['import'],
        errorMessage: 'Must contain import',
      };
      const result = service.validateCode('import { X } from "y";', [rule]);
      expect(result.valid).toBe(true);
    });

    it('should handle duplicate patterns requiring distinct ordered occurrences', () => {
      const rule: OrderRule = {
        type: 'order',
        patterns: ['@if', '@if'],
        errorMessage: 'Must have two @if blocks',
      };
      // Two distinct @if occurrences
      const code = '@if (a) { } @if (b) { }';
      const result = service.validateCode(code, [rule]);
      expect(result.valid).toBe(true);
    });

    it('should fail duplicate patterns when only one occurrence exists', () => {
      const rule: OrderRule = {
        type: 'order',
        patterns: ['@if', '@if'],
        errorMessage: 'Must have two @if blocks',
      };
      const code = '@if (a) { }';
      const result = service.validateCode(code, [rule]);
      expect(result.valid).toBe(false);
    });

    it('should pass vacuously for empty patterns array', () => {
      const rule: OrderRule = {
        type: 'order',
        patterns: [],
        errorMessage: 'Should never fire',
      };
      const result = service.validateCode('any code', [rule]);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });
  });

  // --- Multiple rules (integration) ---

  describe('multiple rules', () => {
    it('should collect all errors when multiple rules fail (no short-circuit)', () => {
      const rules: ValidationRule[] = [
        { type: 'contains', value: 'import', errorMessage: 'Need import' },
        { type: 'contains', value: 'export', errorMessage: 'Need export' },
        { type: 'notContains', value: 'var', errorMessage: 'No var' },
      ];
      const result = service.validateCode('const x = 1;', [rules[0], rules[1], rules[2]]);
      expect(result.valid).toBe(false);
      expect(result.errors).toEqual(['Need import', 'Need export']);
      expect(result.passedRules).toBe(1);
      expect(result.totalRules).toBe(3);
    });

    it('should return valid:true and empty errors when all rules pass', () => {
      const rules: ValidationRule[] = [
        { type: 'contains', value: 'const', errorMessage: 'Need const' },
        { type: 'notContains', value: 'var', errorMessage: 'No var' },
      ];
      const result = service.validateCode('const x = 1;', rules);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
      expect(result.passedRules).toBe(2);
      expect(result.totalRules).toBe(2);
    });

    it('should return correct passedRules and totalRules counts', () => {
      const rules: ValidationRule[] = [
        { type: 'contains', value: 'a', errorMessage: 'a' },
        { type: 'contains', value: 'b', errorMessage: 'b' },
        { type: 'contains', value: 'c', errorMessage: 'c' },
      ];
      const result = service.validateCode('a and c', rules);
      expect(result.passedRules).toBe(2);
      expect(result.totalRules).toBe(3);
    });

    it('should return valid:true for an empty rules array', () => {
      const result = service.validateCode('any code', []);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
      expect(result.passedRules).toBe(0);
      expect(result.totalRules).toBe(0);
    });
  });

  // --- Edge cases ---

  describe('edge cases', () => {
    it('should handle empty code string', () => {
      const rules: ValidationRule[] = [
        { type: 'contains', value: 'something', errorMessage: 'Need something' },
      ];
      const result = service.validateCode('', rules);
      expect(result.valid).toBe(false);
      expect(result.errors).toEqual(['Need something']);
    });

    it('should handle code with only whitespace', () => {
      const rule: ContainsRule = {
        type: 'contains',
        value: 'code',
        errorMessage: 'Need code',
      };
      const result = service.validateCode('   \n  \n  ', [rule]);
      expect(result.valid).toBe(false);
    });
  });
});
