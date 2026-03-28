import type { StoryMissionContent, CodeChallengeStep } from '../../../core/curriculum';

export const CHAPTER_16_CONTENT: StoryMissionContent = {
  chapterId: 16,
  steps: [
    {
      stepType: 'narrative',
      narrativeText:
        'The engineering diagnostic terminal requires a complex form with multiple related fields, dynamic ' +
        'sections, and programmatic control. Template-driven forms work for simple inputs, but reactive ' +
        "forms give you full control in TypeScript. Angular's ReactiveFormsModule, FormBuilder, and " +
        'FormGroup let you define form structure entirely in code.',
    },
    {
      stepType: 'code-example',
      narrativeText:
        'Set up a reactive form with FormBuilder. The form structure is defined in the component class, ' +
        'and the template binds to it with formGroup and formControlName.',
      code: [
        "import { Component, inject } from '@angular/core';",
        "import { ReactiveFormsModule, FormBuilder } from '@angular/forms';",
        '',
        '@Component({',
        "  selector: 'app-diagnostic',",
        '  imports: [ReactiveFormsModule],',
        '  template: `',
        '    <form [formGroup]="diagnosticForm">',
        '      <input formControlName="systemId" placeholder="System ID" />',
        '      <select formControlName="severity">',
        '        <option value="low">Low</option>',
        '        <option value="critical">Critical</option>',
        '      </select>',
        '      <textarea formControlName="description"></textarea>',
        '    </form>',
        '  `,',
        '})',
        'export class DiagnosticComponent {',
        '  private fb = inject(FormBuilder);',
        '',
        '  diagnosticForm = this.fb.group({',
        "    systemId: [''],",
        "    severity: ['low'],",
        "    description: [''],",
        '  });',
        '}',
      ].join('\n'),
      language: 'typescript',
      highlightLines: [2, 6, 8, 9, 19, 21],
      explanation:
        'ReactiveFormsModule enables reactive forms. FormBuilder.group() creates a FormGroup with named ' +
        'FormControls. The [formGroup] directive binds the form element to the group, and formControlName ' +
        'connects individual inputs to their controls.',
    },
    {
      stepType: 'code-example',
      narrativeText:
        'Reactive forms provide a rich API for reading and updating values programmatically — essential ' +
        'for diagnostic workflows that auto-populate or reset fields.',
      code: [
        '// Read all form values at once',
        'const values = this.diagnosticForm.value;',
        "// { systemId: 'ENG-01', severity: 'low', description: '' }",
        '',
        '// Read a single control value',
        "const severity = this.diagnosticForm.get('severity')?.value;",
        '',
        '// Update specific controls without affecting others',
        "this.diagnosticForm.patchValue({ severity: 'critical' });",
        '',
        '// Reset all controls to initial values',
        'this.diagnosticForm.reset();',
      ].join('\n'),
      language: 'typescript',
      highlightLines: [2, 6, 9, 12],
      explanation:
        '.value returns the current values of all controls in the group. .get() accesses individual ' +
        'controls by name. patchValue updates specific controls without affecting others, while reset ' +
        'clears all controls back to their initial values.',
    },
    {
      stepType: 'code-example',
      narrativeText:
        'The diagnostic terminal needs dynamic sections — crew can report multiple affected systems. ' +
        'FormArray holds a repeatable list of form groups.',
      code: [
        'export class DiagnosticComponent {',
        '  private fb = inject(FormBuilder);',
        '',
        '  diagnosticForm = this.fb.group({',
        '    systems: this.fb.array([this.createSystem()]),',
        '  });',
        '',
        '  get systems() {',
        "    return this.diagnosticForm.get('systems') as FormArray;",
        '  }',
        '',
        '  createSystem() {',
        "    return this.fb.group({ name: [''], status: [''] });",
        '  }',
        '',
        '  addSystem() {',
        '    this.systems.push(this.createSystem());',
        '  }',
        '}',
        '',
        '// Template:',
        '// @for (system of systems.controls; track $index) {',
        '//   <div [formGroupName]="$index">',
        '//     <input formControlName="name" />',
        '//     <input formControlName="status" />',
        '//   </div>',
        '// }',
      ].join('\n'),
      language: 'typescript',
      highlightLines: [5, 8, 9, 13, 17],
      explanation:
        'FormArray holds a dynamic list of controls or groups. Use push() to add entries and removeAt() ' +
        'to remove them. In the template, iterate with @for and bind each group by its index using ' +
        'formGroupName.',
    },
    {
      stepType: 'concept',
      narrativeText:
        'The engineering diagnostic terminal is configured. Here is the reactive forms model.',
      conceptTitle: 'Reactive Forms — FormBuilder, FormGroup, FormArray',
      conceptBody:
        'Reactive forms define form structure in TypeScript rather than the template. This gives you ' +
        'programmatic access to form values, validation state, and dynamic form manipulation. FormBuilder ' +
        'is a convenience for creating FormGroup and FormArray instances.',
      keyPoints: [
        'ReactiveFormsModule is required for reactive forms',
        'FormBuilder.group() creates a FormGroup with named controls',
        'FormControl values are accessible via .value and .get()',
        'FormArray supports dynamic, repeatable form sections',
        'patchValue and reset provide programmatic form manipulation',
      ],
    },
    {
      stepType: 'code-challenge',
      prompt:
        'Build a reactive diagnostic form! Import the reactive forms module, create a FormGroup ' +
        'with FormBuilder, and bind the template inputs to form controls.',
      starterCode: [
        "import { Component, inject } from '@angular/core';",
        "import { FormBuilder } from '@angular/forms';",
        '',
        '@Component({',
        "  selector: 'app-diagnostic',",
        '  // TODO: Add the reactive forms module to imports',
        '  imports: [],',
        '  template: `',
        '    <form>',
        '      <!-- TODO: Bind this form to a FormGroup and each input to a control -->',
        '      <input placeholder="System ID" />',
        '      <select>',
        '        <option value="low">Low</option>',
        '        <option value="critical">Critical</option>',
        '      </select>',
        '      <textarea placeholder="Description"></textarea>',
        '    </form>',
        '  `,',
        '})',
        'export class DiagnosticComponent {',
        '  private fb = inject(FormBuilder);',
        '',
        '  // TODO: Define a form group with systemId, severity, and description controls',
        '}',
      ].join('\n'),
      language: 'typescript',
      validationRules: [
        {
          type: 'contains',
          value: 'fb.group',
          errorMessage: 'Use FormBuilder.group() to create the reactive form group',
        },
        {
          type: 'pattern',
          pattern: 'formControlName',
          errorMessage: 'Bind each input to its control with the formControlName directive',
        },
        {
          type: 'contains',
          value: '[formGroup]',
          errorMessage: 'Bind the form element to the FormGroup with [formGroup]',
        },
        {
          type: 'contains',
          value: 'ReactiveFormsModule',
          errorMessage: 'Import ReactiveFormsModule to enable reactive forms',
        },
      ],
      hints: [
        'Add ReactiveFormsModule to the imports array, then use this.fb.group({}) to define controls',
        'Add [formGroup]="diagnosticForm" on the form tag and formControlName="fieldName" on each input',
      ],
      successMessage:
        'Diagnostic form is reactive! FormBuilder defines the structure and the template binds to it.',
      explanation:
        'ReactiveFormsModule enables reactive form directives. FormBuilder.group() creates a FormGroup ' +
        'with named controls. The [formGroup] directive binds the form element, and formControlName ' +
        'connects each input to its specific control.',
    } satisfies CodeChallengeStep,
    {
      stepType: 'code-challenge',
      prompt:
        'Add dynamic sections to the diagnostic form! Use a FormArray to let crew report ' +
        'multiple affected systems, with a method to add new entries.',
      starterCode: [
        "import { Component, inject } from '@angular/core';",
        "import { FormBuilder, FormArray, ReactiveFormsModule } from '@angular/forms';",
        '',
        '@Component({',
        "  selector: 'app-diagnostic',",
        '  imports: [ReactiveFormsModule],',
        '  template: `',
        '    <form [formGroup]="diagnosticForm">',
        '      <!-- TODO: Iterate over the systems array and bind each group -->',
        '    </form>',
        '    <button (click)="addSystem()">Add System</button>',
        '  `,',
        '})',
        'export class DiagnosticComponent {',
        '  private fb = inject(FormBuilder);',
        '',
        '  // TODO: Define diagnosticForm with a \'systems\' FormArray',
        '  diagnosticForm: any;',
        '',
        '  // TODO: Add a getter that casts the systems control to FormArray',
        '',
        '  // TODO: Write a createSystem method returning a FormGroup',
        '  // TODO: Write an addSystem method that pushes a new system',
        '}',
      ].join('\n'),
      language: 'typescript',
      validationRules: [
        {
          type: 'contains',
          value: 'fb.array',
          errorMessage: 'Use FormBuilder.array() to create a dynamic list of form groups',
        },
        {
          type: 'pattern',
          pattern: 'as FormArray',
          errorMessage: 'Cast the systems control to the FormArray type for proper access',
        },
        {
          type: 'contains',
          value: '.push(',
          errorMessage: 'Use push() to add new entries to the FormArray',
        },
        {
          type: 'contains',
          value: 'fb.group',
          errorMessage: 'Create each dynamic entry as a FormGroup with FormBuilder.group()',
        },
      ],
      hints: [
        'Use this.fb.group({ systems: this.fb.array([]) }) and cast the getter with as FormArray',
        'Write a createSystem() method returning fb.group({...}), then push it in addSystem()',
      ],
      successMessage:
        'Dynamic form sections online! Crew can report multiple affected systems with FormArray.',
      explanation:
        'FormArray holds a dynamic list of controls or groups. Use FormBuilder.array() to create it, ' +
        'cast the getter with as FormArray for type safety, and push new FormGroup entries to let ' +
        'users add repeated form sections.',
    } satisfies CodeChallengeStep,
  ],
  completionCriteria: {
    description: 'Engineering diagnostic configured!',
    minStepsViewed: 7,
  },
};
