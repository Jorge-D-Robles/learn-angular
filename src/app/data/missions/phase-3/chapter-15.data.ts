import type { StoryMissionContent, CodeChallengeStep } from '../../../core/curriculum';

export const CHAPTER_15_CONTENT: StoryMissionContent = {
  chapterId: 15,
  steps: [
    {
      stepType: 'narrative',
      narrativeText:
        'Reports can be submitted, but crew want to see what they are typing before sending. A live preview ' +
        "lets them verify their input in real time — no surprises after hitting submit. Angular's ngModel " +
        'binding and value change events make this possible by keeping the component properties in sync ' +
        'with the form inputs as the user types.',
    },
    {
      stepType: 'code-example',
      narrativeText:
        'Build a real-time preview panel. Two-way binding with ngModel keeps the component property updated ' +
        'on every keystroke, and interpolation renders the live values.',
      code: [
        '@Component({',
        "  selector: 'app-report-preview',",
        '  imports: [FormsModule],',
        '  template: `',
        '    <form>',
        '      <input [(ngModel)]="crewName" name="crewName" placeholder="Name" />',
        '      <select [(ngModel)]="priority" name="priority">',
        '        <option value="normal">Normal</option>',
        '        <option value="urgent">Urgent</option>',
        '      </select>',
        '    </form>',
        '',
        '    <section class="preview">',
        '      <h3>Preview</h3>',
        '      <p>From: {{ crewName }}</p>',
        '      <p>Priority: {{ priority }}</p>',
        '    </section>',
        '  `,',
        '})',
        'export class ReportPreviewComponent {',
        "  crewName = '';",
        "  priority = 'normal';",
        '}',
      ].join('\n'),
      language: 'typescript',
      highlightLines: [6, 7, 15, 16],
      explanation:
        'Two-way binding with ngModel keeps the component property in sync with the input. Any template ' +
        'expression referencing that property — like {{ crewName }} — updates automatically as the user ' +
        'types. No manual event handling required.',
    },
    {
      stepType: 'code-example',
      narrativeText:
        'Sometimes you need more control over value changes — formatting input, counting characters, or ' +
        'triggering side effects on each keystroke. Split the ngModel binding to intercept changes.',
      code: [
        '@Component({',
        "  selector: 'app-report-preview',",
        '  imports: [FormsModule],',
        '  template: `',
        '    <input',
        '      [ngModel]="crewName"',
        '      (ngModelChange)="onNameChange($event)"',
        '      name="crewName"',
        '    />',
        '    <p>Characters: {{ charCount }}</p>',
        '  `,',
        '})',
        'export class ReportPreviewComponent {',
        "  crewName = '';",
        '  charCount = 0;',
        '',
        '  onNameChange(value: string): void {',
        '    this.crewName = value.toUpperCase();',
        '    this.charCount = value.length;',
        '  }',
        '}',
      ].join('\n'),
      language: 'typescript',
      highlightLines: [6, 7, 17, 18, 19],
      explanation:
        'Splitting [(ngModel)] into [ngModel] and (ngModelChange) gives you a hook to process the value ' +
        'before updating the property. This is useful for formatting, validation, or side effects on each ' +
        'keystroke. The $event parameter contains the new value from the input.',
    },
    {
      stepType: 'concept',
      narrativeText:
        'The real-time preview is live. Here is how Angular keeps form values and the view in sync.',
      conceptTitle: 'Reading Form Values — Two-Way Binding and Change Events',
      conceptBody:
        "ngModel's two-way binding keeps template and component in sync. For finer control, split the " +
        'binding into property binding [ngModel] and event binding (ngModelChange) to intercept and ' +
        'process values before they reach the component property.',
      keyPoints: [
        '[(ngModel)] is shorthand for [ngModel] + (ngModelChange)',
        'Component properties update in real-time as the user types',
        'Split binding allows value transformation before assignment',
        'Template expressions referencing bound properties re-evaluate automatically',
      ],
    },
    {
      stepType: 'code-challenge',
      prompt:
        'Split the two-way binding! Replace the banana-in-a-box syntax with separate property ' +
        'binding and event binding, then add a handler method that updates the character count.',
      starterCode: [
        '@Component({',
        "  selector: 'app-report-preview',",
        '  imports: [FormsModule],',
        '  template: `',
        '    <input',
        '      [(ngModel)]="crewName"',
        '      name="crewName"',
        '    />',
        '    <p>Characters: {{ charCount }}</p>',
        '  `,',
        '})',
        'export class ReportPreviewComponent {',
        "  crewName = '';",
        '  charCount = 0;',
        '',
        '  // TODO: Add a method that receives the new value and updates both properties',
        '}',
      ].join('\n'),
      language: 'typescript',
      validationRules: [
        {
          type: 'contains',
          value: '[ngModel]="',
          errorMessage: 'Use one-way property binding [ngModel] for the input value',
        },
        {
          type: 'contains',
          value: '(ngModelChange)',
          errorMessage: 'Use the (ngModelChange) event binding to intercept value changes',
        },
        {
          type: 'pattern',
          pattern: 'this\\.charCount\\s*=',
          errorMessage: 'Write a handler method that updates the charCount property',
        },
        {
          type: 'notContains',
          value: '[(ngModel)]',
          errorMessage: 'Split the [(ngModel)] banana-in-a-box into separate [ngModel] and (ngModelChange)',
        },
      ],
      hints: [
        'Replace [(ngModel)]="crewName" with [ngModel]="crewName" and add (ngModelChange)="onNameChange($event)"',
        'In the onNameChange method, assign the new value to crewName and set charCount to its length',
      ],
      successMessage:
        'Split binding active! The handler intercepts every change and updates the character count.',
      explanation:
        'Splitting [(ngModel)] into [ngModel] and (ngModelChange) gives you a hook to process each ' +
        'value change. The property binding pushes the current value to the input, and the event binding ' +
        'fires your handler with the new value before it reaches the component property.',
    } satisfies CodeChallengeStep,
  ],
  completionCriteria: {
    description: 'Real-time preview is live!',
    minStepsViewed: 5,
  },
};
