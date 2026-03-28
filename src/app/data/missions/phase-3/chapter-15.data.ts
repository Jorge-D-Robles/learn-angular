import type { StoryMissionContent, CodeChallengeStep } from '../../../core/curriculum';

export const CHAPTER_15_CONTENT: StoryMissionContent = {
  chapterId: 15,
  steps: [
    {
      stepType: 'narrative',
      narrativeText:
        'You can capture input now, but what if crew want to preview their report before sending it? ' +
        'Right now they type into a void and hope for the best. A live preview shows exactly what ' +
        'the submitted data will look like -- no surprises after hitting submit. Angular\'s two-way ' +
        'binding already does most of the work. The twist is learning when to split it apart for ' +
        'more control.',
    },
    {
      stepType: 'code-example',
      narrativeText:
        'Because [(ngModel)] keeps the component property in sync on every keystroke, you can ' +
        'display the current value anywhere in your template with interpolation. The preview ' +
        'updates instantly -- no extra wiring needed.',
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
        'This is the payoff of two-way binding. crewName updates on every keystroke, and {{ crewName }} ' +
        're-renders automatically. No event listeners, no manual DOM updates. The component property ' +
        'is the single source of truth for both the input and the preview.',
    },
    {
      stepType: 'code-example',
      narrativeText:
        'Sometimes you need to intercept the value before it reaches the property. Maybe you want to ' +
        'force uppercase, count characters, or trigger a side effect. Split the "banana in a box" ' +
        'into its two halves: [ngModel] pushes data in, (ngModelChange) catches data coming out.',
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
        'Splitting [(ngModel)] into [ngModel] and (ngModelChange) gives you a middleware hook. The ' +
        'input sends the raw value to your handler via $event, and you decide what actually gets ' +
        'stored. Here, the value gets uppercased and a character count is computed before anything ' +
        'reaches the crewName property.',
    },
    {
      stepType: 'concept',
      narrativeText:
        'Two-way binding is convenient. Split binding is powerful. Knowing when to use which is the ' +
        'real skill here.',
      conceptTitle: 'Two-Way Binding vs Split Binding -- Choosing Your Level of Control',
      conceptBody:
        'Use [(ngModel)] when you just need the value to stay in sync -- no processing, no side ' +
        'effects. Split into [ngModel] + (ngModelChange) when you need to transform, validate, or ' +
        'react to every change. Both produce the same result; the split version just gives you a ' +
        'place to run code in between.',
      keyPoints: [
        '[(ngModel)] is syntactic sugar for [ngModel] + (ngModelChange) -- they\'re the same mechanism',
        'Split binding gives you a hook to transform or validate values before they reach the property',
        'The $event in (ngModelChange) is the new value, not a DOM event -- it\'s already unwrapped for you',
        'Template expressions referencing bound properties re-render automatically on every change',
      ],
    },
    {
      stepType: 'code-challenge',
      prompt:
        'Split the banana-in-a-box binding apart. Replace [(ngModel)] with separate [ngModel] ' +
        'and (ngModelChange) bindings, then write a handler that updates both crewName and charCount.',
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
        'Change [(ngModel)]="crewName" to [ngModel]="crewName" (ngModelChange)="onNameChange($event)"',
        'In onNameChange(value: string), set this.crewName = value and this.charCount = value.length',
      ],
      successMessage:
        'Split binding mastered! You can now intercept and process form values on every keystroke. ' +
        'Coming up: reactive forms for when you need even more control.',
      explanation:
        'The split gives you a function that runs on every change. [ngModel] keeps the input ' +
        'displaying the current value; (ngModelChange) hands you the new value before it\'s stored. ' +
        'Your handler is the gatekeeper -- transform, validate, or enrich the data before it lands.',
    } satisfies CodeChallengeStep,
  ],
  completionCriteria: {
    description: 'Real-time preview is live!',
    minStepsViewed: 5,
  },
};
