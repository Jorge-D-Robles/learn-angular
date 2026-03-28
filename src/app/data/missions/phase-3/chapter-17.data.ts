import type { StoryMissionContent, CodeChallengeStep } from '../../../core/curriculum';

export const CHAPTER_17_CONTENT: StoryMissionContent = {
  chapterId: 17,
  steps: [
    {
      stepType: 'narrative',
      narrativeText:
        'Diagnostic reports are reaching Mission Control, but corrupted data is causing system failures. ' +
        'Every form submission needs validation — required fields, format checks, and custom rules. ' +
        'Angular provides built-in validators and lets you create custom ones to enforce data integrity ' +
        'before any report leaves the terminal.',
    },
    {
      stepType: 'code-example',
      narrativeText:
        'Add built-in validators to reactive form controls. Each validator is a function passed as the ' +
        'second argument when creating a control.',
      code: [
        "import { Validators } from '@angular/forms';",
        '',
        'diagnosticForm = this.fb.group({',
        "  systemId: ['', [Validators.required, Validators.minLength(3)]],",
        "  severity: ['low', Validators.required],",
        "  code: ['', [Validators.required, Validators.pattern(/^SYS-\\d{4}$/)]],",
        '});',
        '',
        '// Template error messages:',
        "// @if (diagnosticForm.get('systemId')?.hasError('required')) {",
        '//   <span class="error">System ID is required</span>',
        '// }',
        "// @if (diagnosticForm.get('code')?.hasError('pattern')) {",
        '//   <span class="error">Code must match SYS-XXXX format</span>',
        '// }',
      ].join('\n'),
      language: 'typescript',
      highlightLines: [1, 4, 5, 6, 10, 13],
      explanation:
        'Validators are functions that check form control values. Angular provides built-in validators ' +
        '(required, minLength, maxLength, pattern, and more). Pass them as the second argument when ' +
        'creating a control. Use hasError() in the template to show specific error messages.',
    },
    {
      stepType: 'code-example',
      narrativeText:
        'Built-in validators cover common cases, but the station needs custom rules — like verifying ' +
        'that system codes follow the station naming convention.',
      code: [
        "import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';",
        '',
        'export function stationCodeValidator(): ValidatorFn {',
        '  return (control: AbstractControl): ValidationErrors | null => {',
        '    const value = control.value as string;',
        '    if (!value) {',
        '      return null; // Let required validator handle empty',
        '    }',
        "    const valid = /^NX-[A-Z]{2}-\\d{3}$/.test(value);",
        "    return valid ? null : { stationCode: { value } };",
        '  };',
        '}',
        '',
        '// Usage:',
        "// code: ['', [Validators.required, stationCodeValidator()]]",
        '',
        '// Template:',
        "// @if (form.get('code')?.hasError('stationCode')) {",
        '//   <span>Invalid station code format</span>',
        '// }',
      ].join('\n'),
      language: 'typescript',
      highlightLines: [1, 3, 4, 9, 10],
      explanation:
        'A custom validator is a function that receives an AbstractControl and returns a validation error ' +
        'object or null. The error object key becomes the error name you check with hasError(). Wrap ' +
        'validators in factory functions for reusability and parameterization.',
    },
    {
      stepType: 'concept',
      narrativeText:
        'Data integrity is verified. Here is how Angular validation protects form submissions.',
      conceptTitle: 'Forms Validation — Built-in and Custom Validators',
      conceptBody:
        'Validation ensures form data meets requirements before submission. Angular validators are ' +
        'composable functions that return null for valid values or an error object for invalid ones. ' +
        'Combine built-in validators with custom ones for comprehensive data integrity.',
      keyPoints: [
        'Validators.required, minLength, maxLength, and pattern cover common cases',
        'Custom validators return null (valid) or an error object (invalid)',
        'hasError() checks for specific validation failures in the template',
        'Multiple validators compose as an array on a single control',
      ],
    },
    {
      stepType: 'code-challenge',
      prompt:
        'Protect the diagnostic form! Add built-in validators to enforce required fields, ' +
        'minimum lengths, and format patterns, then show error messages in the template.',
      starterCode: [
        "import { Component, inject } from '@angular/core';",
        "import { FormBuilder, ReactiveFormsModule } from '@angular/forms';",
        '',
        '@Component({',
        "  selector: 'app-diagnostic',",
        '  imports: [ReactiveFormsModule],',
        '  template: `',
        '    <form [formGroup]="diagnosticForm">',
        '      <input formControlName="systemId" placeholder="System ID" />',
        '      <input formControlName="code" placeholder="Code (SYS-XXXX)" />',
        '      <!-- TODO: Add validation error messages for each field -->',
        '    </form>',
        '  `,',
        '})',
        'export class DiagnosticComponent {',
        '  private fb = inject(FormBuilder);',
        '',
        "  diagnosticForm = this.fb.group({",
        "    systemId: [''],",
        "    code: [''],",
        '    // TODO: Add validators to each control',
        '  });',
        '}',
      ].join('\n'),
      language: 'typescript',
      validationRules: [
        {
          type: 'contains',
          value: 'Validators.required',
          errorMessage: 'Add Validators.required to enforce mandatory fields',
        },
        {
          type: 'pattern',
          pattern: 'Validators\\.pattern',
          errorMessage: 'Add Validators.pattern to enforce a format rule',
        },
        {
          type: 'pattern',
          pattern: 'hasError\\(',
          errorMessage: 'Use hasError() in the template to show specific validation messages',
        },
        {
          type: 'contains',
          value: 'Validators.minLength',
          errorMessage: 'Add Validators.minLength to enforce a minimum length',
        },
      ],
      hints: [
        'Import Validators from @angular/forms, then pass an array like [Validators.required, Validators.minLength(3)] as the second element',
        'Use diagnosticForm.get(\'fieldName\')?.hasError(\'required\') in @if blocks to show error messages',
      ],
      successMessage:
        'Validation shields are up! Built-in validators enforce data integrity before submission.',
      explanation:
        'Validators are functions passed as the second argument when creating a control. Angular provides ' +
        'built-in validators like required, minLength, and pattern. Use hasError() in the template to ' +
        'check for specific validation failures and display targeted error messages.',
    } satisfies CodeChallengeStep,
    {
      stepType: 'code-challenge',
      prompt:
        'Create a custom validator! Write a ValidatorFn factory that checks whether a value ' +
        'matches the Nexus Station code format (NX-XX-999).',
      starterCode: [
        "import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';",
        '',
        '// TODO: Implement the validator — check that the value matches NX-XX-999 format',
        'export function stationCodeValidator(): ValidatorFn {',
        '  return (control) => {',
        '    // TODO: Get the control value',
        '    // TODO: Return null if empty (let required handle it)',
        '    // TODO: Test the value against the pattern /^NX-[A-Z]{2}-\\d{3}$/',
        '    // TODO: Return null if valid, or an error object with key \'stationCode\' if invalid',
        '  };',
        '}',
      ].join('\n'),
      language: 'typescript',
      validationRules: [
        {
          type: 'contains',
          value: ': ValidatorFn',
          errorMessage: 'Annotate the return type as ValidatorFn for type safety',
        },
        {
          type: 'pattern',
          pattern: 'control\\.value',
          errorMessage: 'Read the control\'s value using control.value',
        },
        {
          type: 'pattern',
          pattern: 'return\\s+null',
          errorMessage: 'Return null when the value passes validation',
        },
        {
          type: 'pattern',
          pattern: 'return.*\\{.*stationCode',
          flags: 's',
          errorMessage: 'Return an error object with the key \'stationCode\' when validation fails',
        },
        {
          type: 'pattern',
          pattern: '\\.test\\(',
          errorMessage: 'Use a RegExp test to validate the value format',
        },
      ],
      hints: [
        'Access the value with control.value, then use a RegExp like /^NX-[A-Z]{2}-\\d{3}$/.test(value)',
        'Return null for valid values and { stationCode: { value } } for invalid ones',
      ],
      successMessage:
        'Custom validator deployed! The station code format is enforced by your ValidatorFn.',
      explanation:
        'A custom ValidatorFn factory returns a function that receives an AbstractControl and returns ' +
        'null for valid values or an error object for invalid ones. The error object key becomes the ' +
        'name you check with hasError() in the template. Use RegExp.test() to validate format patterns.',
    } satisfies CodeChallengeStep,
  ],
  completionCriteria: {
    description: 'Data integrity verified!',
    minStepsViewed: 6,
  },
};
