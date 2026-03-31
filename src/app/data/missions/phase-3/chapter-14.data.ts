import type { StoryMissionContent, CodeChallengeStep } from '../../../core/curriculum';

export const CHAPTER_14_CONTENT: StoryMissionContent = {
  chapterId: 14,
  steps: [
    {
      stepType: 'narrative',
      narrativeText:
        'You can display data, handle clicks, and navigate between views. The missing piece? Capturing ' +
        'input from users. Without forms, your app is read-only -- crew can\'t file reports, submit ' +
        'diagnostics, or log entries. Angular\'s template-driven forms are the fastest way to get a ' +
        'simple form working. You write the form in HTML, sprinkle in some directives, and Angular ' +
        'handles the rest.',
    },
    {
      stepType: 'code-example',
      narrativeText:
        'A template-driven form is basically HTML with superpowers. FormsModule unlocks the ngModel ' +
        'directive, which creates a live two-way connection between an input and a component property. ' +
        'Type in the input, the property updates. Change the property, the input updates.',
      code: [
        "import { Component } from '@angular/core';",
        "import { FormsModule } from '@angular/forms';",
        '',
        '@Component({',
        "  selector: 'app-crew-report',",
        '  imports: [FormsModule],',
        '  template: `',
        '    <form #reportForm="ngForm">',
        '      <label>',
        '        Crew Member',
        '        <input [(ngModel)]="crewName" name="crewName" />',
        '      </label>',
        '      <label>',
        '        Message',
        '        <textarea [(ngModel)]="message" name="message"></textarea>',
        '      </label>',
        '    </form>',
        '  `,',
        '})',
        'export class CrewReportComponent {',
        "  crewName = '';",
        "  message = '';",
        '}',
      ].join('\n'),
      language: 'typescript',
      highlightLines: [2, 6, 8, 11, 15],
      explanation:
        'The [(ngModel)] syntax looks strange -- Angular devs call it "banana in a box" because of ' +
        'the bracket-parenthesis shape. It\'s shorthand for combining [ngModel] (push data in) and ' +
        '(ngModelChange) (push data out). Each ngModel control needs a name attribute so Angular can ' +
        'track it within the form.',
    },
    {
      stepType: 'code-example',
      narrativeText:
        'Capturing input is only half the job. Crew need to actually submit their reports. The ' +
        'ngSubmit event fires when the form is submitted, and the NgForm reference gives you access ' +
        'to the form\'s overall state -- is it valid? Has anything been touched?',
      code: [
        '@Component({',
        "  selector: 'app-crew-report',",
        '  imports: [FormsModule],',
        '  template: `',
        '    <form #reportForm="ngForm" (ngSubmit)="submitReport(reportForm)">',
        '      <input [(ngModel)]="crewName" name="crewName" />',
        '      <textarea [(ngModel)]="message" name="message"></textarea>',
        '      <button type="submit">File Report</button>',
        '    </form>',
        '  `,',
        '})',
        'export class CrewReportComponent {',
        "  crewName = '';",
        "  message = '';",
        '',
        '  submitReport(form: NgForm): void {',
        '    if (form.valid) {',
        "      console.log('Report filed:', form.value);",
        '    }',
        '  }',
        '}',
      ].join('\n'),
      language: 'typescript',
      highlightLines: [5, 16, 17],
      explanation:
        '(ngSubmit) replaces the native HTML submit event and prevents the default page reload. ' +
        'The #reportForm template variable is your handle to the NgForm instance -- it tracks ' +
        'whether the form is valid, dirty (changed), or touched (interacted with). Always check ' +
        'form.valid before processing.',
    },
    {
      stepType: 'concept',
      narrativeText:
        'Template-driven forms are like filling out a paper form. You lay out the fields in HTML, ' +
        'and Angular keeps track of the state behind the scenes.',
      conceptTitle: 'Template-Driven Forms -- FormsModule, ngModel, ngSubmit',
      conceptBody:
        'With template-driven forms, the template is the source of truth. Angular reads your ngModel ' +
        'directives and automatically builds an internal model that tracks each field\'s value, ' +
        'validity, and interaction state. You don\'t write any form management code in the component ' +
        'class -- just properties to bind to.',
      keyPoints: [
        'FormsModule must be imported before any template-driven form directives work',
        '[(ngModel)] is "banana in a box" -- two-way binding that keeps inputs and properties in sync',
        'Every ngModel control needs a name attribute, or Angular can\'t register it with the form',
        'NgForm tracks aggregate state: valid/invalid, dirty/pristine, touched/untouched',
      ],
    },
    {
      stepType: 'code-challenge',
      prompt:
        'Turn this plain HTML form into an Angular template-driven form. Add ngModel bindings to ' +
        'each input, give them name attributes, and wire up form submission with ngSubmit.',
      starterCode: [
        '<form onsubmit="return false">',
        '  <!-- TODO: Add Angular form directive and binding to each input -->',
        '  <label>',
        '    Crew Member',
        '    <input type="text" />',
        '  </label>',
        '  <label>',
        '    Message',
        '    <textarea></textarea>',
        '  </label>',
        '  <button type="submit">File Report</button>',
        '</form>',
      ].join('\n'),
      language: 'html',
      validationRules: [
        {
          type: 'contains',
          value: 'ngModel',
          errorMessage: 'Use the ngModel directive to bind form inputs to component properties',
        },
        {
          type: 'pattern',
          pattern: 'name="\\w+"',
          errorMessage: 'Add a name attribute to each ngModel control. Angular requires it for registration',
        },
        {
          type: 'pattern',
          pattern: '\\(ngSubmit\\)',
          errorMessage: 'Add the (ngSubmit) event binding to handle form submission',
        },
        {
          type: 'notContains',
          value: 'onsubmit',
          errorMessage: 'Remove the plain HTML onsubmit. Use Angular (ngSubmit) instead',
        },
      ],
      hints: [
        'Add [(ngModel)]="propertyName" and name="propertyName" to both the input and the textarea',
        'Replace onsubmit="return false" on the form tag with (ngSubmit)="yourSubmitMethod()"',
      ],
      successMessage:
        'First crew report form is online! You\'ve connected HTML inputs to Angular\'s form system. ' +
        'Next: reading form values in real time so crew can preview what they\'re typing.',
      explanation:
        'Three changes turned plain HTML into an Angular form: [(ngModel)] for two-way binding, ' +
        'name attributes for form registration, and (ngSubmit) to handle submission without a page ' +
        'reload. That\'s the template-driven forms pattern in a nutshell.',
    } satisfies CodeChallengeStep,
  ],
  completionCriteria: {
    description: 'You filed your first crew report!',
    minStepsViewed: 5,
  },
};
