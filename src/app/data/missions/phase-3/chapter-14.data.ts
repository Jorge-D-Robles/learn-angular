import type { StoryMissionContent, CodeChallengeStep } from '../../../core/curriculum';

export const CHAPTER_14_CONTENT: StoryMissionContent = {
  chapterId: 14,
  steps: [
    {
      stepType: 'narrative',
      narrativeText:
        'The crew terminals are offline. Without input systems, crew cannot file reports, submit diagnostics, ' +
        'or log entries. To restore basic communication, you need forms — a way to capture structured input ' +
        "from crew members. Angular's template-driven forms provide a quick way to build simple input forms " +
        'using directives directly in the template.',
    },
    {
      stepType: 'code-example',
      narrativeText:
        'Here is a basic crew report form using template-driven forms. FormsModule enables ngModel for ' +
        'two-way data binding, and ngForm tracks the overall form state.',
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
        'FormsModule enables template-driven forms. ngModel creates two-way data binding between form ' +
        'controls and component properties. The name attribute is required for each ngModel control so ' +
        'Angular can register it with the form. The #reportForm template variable exposes the NgForm instance.',
    },
    {
      stepType: 'code-example',
      narrativeText:
        'The form captures input, but crew need to submit their reports. ngSubmit fires when the form is ' +
        'submitted, and the NgForm instance provides validation state.',
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
        'ngSubmit fires when the form is submitted. The template reference variable gives access to the ' +
        'NgForm instance with validation state — valid, invalid, dirty, and touched. Check form.valid ' +
        'before processing the submission to ensure all fields pass validation.',
    },
    {
      stepType: 'concept',
      narrativeText:
        'The first crew report is ready to file. Here is how template-driven forms work in Angular.',
      conceptTitle: 'Template-Driven Forms — FormsModule and ngModel',
      conceptBody:
        'Template-driven forms use directives (ngModel, ngForm) to create and manage form controls directly ' +
        'in the template. Angular tracks form state automatically — whether fields have been touched, ' +
        'changed, or validated — without requiring any setup in the component class.',
      keyPoints: [
        'FormsModule is required for template-driven forms',
        'ngModel provides two-way binding between inputs and component properties',
        'The name attribute is required for each ngModel control',
        'ngForm tracks aggregate form state (valid, invalid, dirty, touched)',
      ],
    },
    {
      stepType: 'code-challenge',
      prompt:
        'Build a crew report form! Add Angular template-driven form directives to capture ' +
        'crew member names and messages, then wire up the form submission.',
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
          errorMessage: 'Add a name attribute to each ngModel control — Angular requires it for registration',
        },
        {
          type: 'pattern',
          pattern: '\\(ngSubmit\\)',
          errorMessage: 'Add the (ngSubmit) event binding to handle form submission',
        },
        {
          type: 'notContains',
          value: 'onsubmit',
          errorMessage: 'Remove the plain HTML onsubmit — use Angular (ngSubmit) instead',
        },
      ],
      hints: [
        'Add [(ngModel)]="propertyName" and a name attribute to each input and textarea',
        'Replace onsubmit on the form tag with (ngSubmit)="yourMethod()"',
      ],
      successMessage:
        'Crew report form is live! Angular template-driven directives capture input and handle submission.',
      explanation:
        'ngModel creates two-way binding between form inputs and component properties. Each ngModel ' +
        'control requires a name attribute so Angular can register it with the form. (ngSubmit) replaces ' +
        'the plain HTML onsubmit to handle form submission the Angular way.',
    } satisfies CodeChallengeStep,
  ],
  completionCriteria: {
    description: 'You filed your first crew report!',
    minStepsViewed: 5,
  },
};
