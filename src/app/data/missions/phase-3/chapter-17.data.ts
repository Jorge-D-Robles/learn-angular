import type { StoryMissionContent, CodeChallengeStep } from '../../../core/curriculum';

export const CHAPTER_17_CONTENT: StoryMissionContent = {
  chapterId: 17,
  steps: [
    {
      stepType: 'narrative',
      narrativeText:
        'Your forms accept anything right now. A crew member could submit an empty report, type ' +
        '"asdfgh" as a system code, or leave critical fields blank. That\'s how corrupted data ' +
        'reaches Mission Control and causes system failures. Validation is the bouncer at the door ' +
        '-- checking every piece of data before it goes anywhere. Angular provides built-in ' +
        'validators and a clean pattern for writing your own.',
    },
    {
      stepType: 'code-example',
      narrativeText:
        'Validators are just functions that Angular runs against a control\'s value. You pass them ' +
        'as the second argument when creating a control. If the value is valid, the validator ' +
        'returns null. If not, it returns an error object describing what went wrong.',
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
        'Multiple validators compose as an array on a single control. Angular runs all of them and ' +
        'collects the errors. In the template, hasError() lets you check for a specific failure by ' +
        'name -- \'required\', \'minlength\', \'pattern\' -- so you can show targeted messages instead ' +
        'of a generic "invalid field" warning.',
    },
    {
      stepType: 'code-example',
      narrativeText:
        'Built-in validators handle the common stuff. But what about station-specific rules, like ' +
        'verifying a system code matches NX-XX-999 format? That\'s a custom validator -- a factory ' +
        'function that returns a validator function.',
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
        'The factory pattern (a function that returns a function) lets you parameterize validators ' +
        'later -- imagine stationCodeValidator(\'NX\') vs stationCodeValidator(\'SX\') for different ' +
        'station prefixes. The error object key (\'stationCode\') becomes the name you check with ' +
        'hasError() in the template. Return null for valid, an object for invalid.',
    },
    {
      stepType: 'concept',
      narrativeText:
        'Validation is composable by design. Stack as many validators as you need on a single ' +
        'control, mix built-in with custom, and Angular runs them all.',
      conceptTitle: 'Validation -- Guarding Your Forms',
      conceptBody:
        'Every validator follows the same contract: take a control, return null or an error object. ' +
        'This uniformity means built-in and custom validators are interchangeable. You can compose ' +
        'them freely, test them in isolation (they\'re just functions), and reuse them across forms.',
      keyPoints: [
        'Built-in validators (required, minLength, maxLength, pattern) cover 80% of cases -- reach for custom only when you need domain-specific rules',
        'Custom validators return null for valid, { errorName: details } for invalid -- the error key is what hasError() checks',
        'The factory pattern makes validators reusable and parameterizable -- stationCodeValidator() today, configurable tomorrow',
        'Validators run on every value change, so keep them lightweight -- no HTTP calls in synchronous validators',
      ],
    },
    {
      stepType: 'code-challenge',
      prompt:
        'Lock down the diagnostic form. Add Validators.required, Validators.minLength, and ' +
        'Validators.pattern to the controls, then add @if blocks in the template that show error ' +
        'messages using hasError().',
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
        'Import Validators, then pass an array like [Validators.required, Validators.minLength(3)] as the second element in each control\'s array',
        'In the template, use @if (diagnosticForm.get(\'systemId\')?.hasError(\'required\')) { <span>...</span> } for each rule',
      ],
      successMessage:
        'Validation is enforced! Bad data gets rejected before it reaches Mission Control. ' +
        'One more step: writing a custom validator for station-specific rules.',
      explanation:
        'Validators slot into the second position of a control\'s definition array. Angular ' +
        'runs them on every change and updates the control\'s error state. hasError() in the ' +
        'template lets you show the right message for the right failure.',
    } satisfies CodeChallengeStep,
    {
      stepType: 'code-challenge',
      prompt:
        'Write a custom validator from scratch. Create a ValidatorFn factory that checks whether ' +
        'a value matches the Nexus Station code format: NX-XX-999 (two uppercase letters, three digits).',
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
        'Read the value with control.value, guard against empty strings by returning null early, then test with /^NX-[A-Z]{2}-\\d{3}$/.test(value)',
        'Return null when the regex passes, and { stationCode: { value } } when it fails -- the key name is what you\'ll use with hasError()',
      ],
      successMessage:
        'Custom validator deployed! You can now enforce any domain-specific rule on any form ' +
        'control. Built-in and custom validators compose together seamlessly.',
      explanation:
        'A custom validator is a function that takes a control and returns null or an error object. ' +
        'The factory wrapper lets you add parameters later. The error key you choose becomes ' +
        'the string you pass to hasError() in the template -- that\'s the only contract.',
    } satisfies CodeChallengeStep,
  ],
  completionCriteria: {
    description: 'Data integrity verified!',
    minStepsViewed: 6,
  },
};
