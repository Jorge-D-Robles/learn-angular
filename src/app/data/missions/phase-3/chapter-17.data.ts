import type { StoryMissionContent } from '../../../core/curriculum';

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
  ],
  completionCriteria: {
    description: 'Data integrity verified!',
    minStepsViewed: 4,
  },
};
