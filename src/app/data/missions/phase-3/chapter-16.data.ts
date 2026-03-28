import type { StoryMissionContent, CodeChallengeStep } from '../../../core/curriculum';

export const CHAPTER_16_CONTENT: StoryMissionContent = {
  chapterId: 16,
  steps: [
    {
      stepType: 'narrative',
      narrativeText:
        'Template-driven forms from Chapters 14-15 are great for simple inputs. But what about a ' +
        'diagnostic terminal with 20 fields, dynamic sections that crew can add or remove, and ' +
        'values that need to be set programmatically? You need the form defined in code, not HTML. ' +
        'That\'s reactive forms -- you build the form structure in TypeScript with FormBuilder, and ' +
        'the template just binds to it.',
    },
    {
      stepType: 'code-example',
      narrativeText:
        'Think of reactive forms like building a form in a spreadsheet. You define every cell ' +
        '(control) in code, set its initial value, and then connect it to the UI. FormBuilder is ' +
        'the helper that makes creating FormGroups and FormControls concise.',
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
        'The form structure lives in the component class, not the template. fb.group() creates a ' +
        'FormGroup containing named FormControls, each with an initial value. In the template, ' +
        '[formGroup] binds the <form> to the group, and formControlName connects each input to its ' +
        'specific control. The template is just the display layer.',
    },
    {
      stepType: 'code-example',
      narrativeText:
        'Because the form lives in code, you can read and change values programmatically. Need to ' +
        'auto-fill a field after an API call? Reset the form after submission? Grab the current ' +
        'values for logging? All straightforward.',
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
        '.value gives you a snapshot of every control in the group as a plain object. .get() drills ' +
        'into individual controls by name. patchValue updates only the fields you specify -- the ' +
        'rest stay untouched. reset() wipes everything back to the initial state. Try doing this ' +
        'with template-driven forms -- it\'s much harder.',
    },
    {
      stepType: 'code-example',
      narrativeText:
        'Here\'s where reactive forms really pull ahead: dynamic form sections. What if crew need ' +
        'to report multiple affected systems, and they don\'t know how many until they\'re filling ' +
        'out the form? FormArray holds a repeatable list of form groups.',
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
        'FormArray is a list of controls or groups that can grow and shrink at runtime. push() adds ' +
        'a new entry, removeAt() drops one. In the template, you iterate with @for and bind each ' +
        'group by its index. This pattern is common for "add another" UIs -- addresses, phone ' +
        'numbers, and here, affected systems.',
    },
    {
      stepType: 'concept',
      narrativeText:
        'Why two kinds of forms? Template-driven forms are fast to write for simple cases. ' +
        'Reactive forms give you programmatic control for complex ones. Most production Angular ' +
        'apps lean heavily on reactive forms.',
      conceptTitle: 'Reactive Forms -- Control From Code',
      conceptBody:
        'Reactive forms move the form definition from the template into TypeScript. The component ' +
        'class owns the form structure, validation rules, and values. The template is a thin binding ' +
        'layer. This separation makes testing easier, dynamic forms possible, and complex validation ' +
        'manageable.',
      keyPoints: [
        'ReactiveFormsModule is a separate import from FormsModule -- use one or both, but know which is which',
        'FormBuilder.group() is a concise factory for FormGroup + FormControls -- less boilerplate than new FormGroup()',
        'patchValue updates specific fields without resetting the whole form -- setValue requires all fields',
        'FormArray enables dynamic, repeatable sections that can\'t be done with template-driven forms alone',
        'Because the form lives in code, unit testing is straightforward -- no DOM needed',
      ],
    },
    {
      stepType: 'code-challenge',
      prompt:
        'Convert this template to a reactive form. Import ReactiveFormsModule, create a FormGroup ' +
        'with FormBuilder, and bind the template inputs to your controls.',
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
        'Add ReactiveFormsModule to the component\'s imports array, then define diagnosticForm = this.fb.group({...})',
        'On the <form> tag add [formGroup]="diagnosticForm", then on each input add formControlName="fieldName"',
      ],
      successMessage:
        'Reactive form is wired up! The form structure lives in code and the template just binds ' +
        'to it. Next: adding dynamic sections with FormArray.',
      explanation:
        'Three pieces connect a reactive form: ReactiveFormsModule enables the directives, ' +
        'fb.group() defines the form structure in code, and [formGroup] + formControlName bind ' +
        'the template to that structure. The component class is in control.',
    } satisfies CodeChallengeStep,
    {
      stepType: 'code-challenge',
      prompt:
        'Add dynamic sections to the diagnostic form. Create a FormArray so crew can report ' +
        'multiple affected systems, with a method to add new entries on the fly.',
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
        'Initialize with this.fb.group({ systems: this.fb.array([]) }) and add a getter that casts with as FormArray',
        'createSystem() returns this.fb.group({ name: [\'\'], status: [\'\'] }), and addSystem() calls this.systems.push(this.createSystem())',
      ],
      successMessage:
        'Dynamic form sections are live! Crew can add as many affected systems as they need. ' +
        'Up next: validation to make sure the data is actually good before it goes anywhere.',
      explanation:
        'FormArray is the key to dynamic forms. fb.array() creates the container, push() adds ' +
        'entries, and the getter with as FormArray gives you type-safe access. Each entry is its ' +
        'own FormGroup, so every row has its own set of controls.',
    } satisfies CodeChallengeStep,
  ],
  completionCriteria: {
    description: 'Engineering diagnostic configured!',
    minStepsViewed: 7,
  },
};
