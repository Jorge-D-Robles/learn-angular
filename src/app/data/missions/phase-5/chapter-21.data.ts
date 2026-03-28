import type { StoryMissionContent, CodeChallengeStep } from '../../../core/curriculum';

export const CHAPTER_21_CONTENT: StoryMissionContent = {
  chapterId: 21,
  steps: [
    {
      stepType: 'narrative',
      narrativeText:
        'Chapter 20 covered the basics: apply a pipe, get a formatted string. But what if you need a ' +
        'specific date format? Or exactly two decimal places? Or you need to display a value that arrives ' +
        'as an Observable stream, updating in real time? Pipe parameters, chaining, and AsyncPipe give you ' +
        'that control.',
    },
    {
      stepType: 'code-example',
      narrativeText:
        'Pipes accept arguments after a colon. You can also chain pipes together — the output of one ' +
        'becomes the input of the next, reading left to right. Want a long date? Pass \'long\'. Need ' +
        'exactly two decimal places? Use the digit format string.',
      code: [
        "import { Component } from '@angular/core';",
        "import { DatePipe, DecimalPipe, UpperCasePipe } from '@angular/common';",
        '',
        '@Component({',
        "  selector: 'app-detailed-readout',",
        '  imports: [DatePipe, DecimalPipe, UpperCasePipe],',
        '  template: `',
        "    <p>Log Date: {{ timestamp | date:'long' }}</p>",
        "    <p>Pressure: {{ pressure | number:'1.2-2' }} kPa</p>",
        "    <p>Sector: {{ sectorName | uppercase | date:'short' }}</p>",
        '    <!-- Chaining: value flows left to right -->',
        '  `,',
        '})',
        'export class DetailedReadoutComponent {',
        '  timestamp = new Date();',
        '  pressure = 101.325;',
        "  sectorName = 'gamma wing';",
        '}',
      ].join('\n'),
      language: 'typescript',
      highlightLines: [8, 9, 10],
      explanation:
        'The colon after a pipe name introduces a parameter. date:\'long\' produces a verbose format like ' +
        '"March 28, 2025 at 10:30:00 AM." DecimalPipe\'s \'1.2-2\' means: at least 1 integer digit, ' +
        'minimum 2 and maximum 2 fraction digits — so 101.325 becomes 101.33. When you chain pipes with ' +
        'additional | operators, each one receives the previous pipe\'s output.',
    },
    {
      stepType: 'code-example',
      narrativeText:
        'Real-time data arrives as Observable streams — values that update over time. Without AsyncPipe, ' +
        'you\'d need to manually subscribe, store the value, and remember to unsubscribe when the component ' +
        'is destroyed. AsyncPipe handles all of that in a single template expression.',
      code: [
        "import { Component } from '@angular/core';",
        "import { AsyncPipe, DecimalPipe } from '@angular/common';",
        "import { Observable, interval, map } from 'rxjs';",
        '',
        '@Component({',
        "  selector: 'app-telemetry-feed',",
        '  imports: [AsyncPipe, DecimalPipe],',
        '  template: `',
        "    <p>Live Temp: {{ temperature$ | async | number:'1.1-1' }}K</p>",
        '    @if (alerts$ | async; as alertCount) {',
        '      <p>Active Alerts: {{ alertCount }}</p>',
        '    }',
        '  `,',
        '})',
        'export class TelemetryFeedComponent {',
        '  temperature$: Observable<number> = interval(1000).pipe(',
        '    map(() => 290 + Math.random() * 10),',
        '  );',
        '',
        '  alerts$: Observable<number> = interval(5000).pipe(',
        '    map(() => Math.floor(Math.random() * 5)),',
        '  );',
        '}',
      ].join('\n'),
      language: 'typescript',
      highlightLines: [2, 7, 9, 10, 16],
      explanation:
        'AsyncPipe subscribes to an Observable and renders whatever value it most recently emitted. ' +
        'When the component is destroyed, AsyncPipe unsubscribes automatically — no memory leaks, no ' +
        'cleanup code. You can chain it with other pipes (like number) and use it inside @if to ' +
        'conditionally render based on the stream\'s current value.',
    },
    {
      stepType: 'concept',
      narrativeText:
        'Parameters, chaining, and AsyncPipe round out the pipe toolkit. These three patterns cover ' +
        'the vast majority of template formatting needs.',
      conceptTitle: 'Pipe Parameters, Chaining, and AsyncPipe',
      conceptBody:
        'Parameters let you customize pipe behavior — pass a format string after a colon. Chaining ' +
        'feeds one pipe\'s output into the next, so you can stack transformations. AsyncPipe bridges ' +
        'the gap between reactive Observable streams and the template, handling subscribe/unsubscribe ' +
        'lifecycle so you don\'t have to.',
      keyPoints: [
        'Colon syntax passes arguments: date:\'long\', number:\'1.2-2\' — each pipe defines its own parameter format',
        'Chaining with multiple | operators applies transformations left-to-right in sequence',
        'AsyncPipe subscribes to an Observable, renders the latest value, and auto-unsubscribes on destroy',
        'Combine AsyncPipe with other pipes: {{ stream$ | async | number:\'1.0-2\' }} works seamlessly',
      ],
    },
    {
      stepType: 'code-challenge',
      prompt:
        'Calibrate the sensor formats. The mission date should display in \'fullDate\' format and the ' +
        'hull pressure needs exactly two decimal places. Add the right parameters to each pipe.',
      starterCode: [
        "import { Component } from '@angular/core';",
        "import { DatePipe, DecimalPipe } from '@angular/common';",
        '',
        '@Component({',
        "  selector: 'app-formatted-readout',",
        '  imports: [DatePipe, DecimalPipe],',
        '  template: `',
        '    <!-- TODO: Add a format argument to the pipe below -->',
        '    <p>Mission Date: {{ missionDate | date }}</p>',
        '    <!-- TODO: Add a precision argument to the pipe below -->',
        '    <p>Hull Pressure: {{ pressure | number }} kPa</p>',
        '  `,',
        '})',
        'export class FormattedReadoutComponent {',
        '  missionDate = new Date();',
        '  pressure = 101.325;',
        '}',
      ].join('\n'),
      language: 'typescript',
      validationRules: [
        {
          type: 'contains',
          value: "date:'fullDate'",
          errorMessage: "Pass the 'fullDate' format parameter to the date pipe",
        },
        {
          type: 'pattern',
          pattern: "number:'[^']*2-2",
          errorMessage: 'Set the decimal pipe format to show exactly 2 fraction digits',
        },
        {
          type: 'notContains',
          value: '{{ missionDate | date }}',
          errorMessage: 'Add a format parameter to the date pipe',
        },
        {
          type: 'notContains',
          value: '{{ pressure | number }}',
          errorMessage: 'Add a format parameter to the number pipe',
        },
      ],
      hints: [
        "Add a colon and format string after the pipe name: | date:'fullDate'",
        "For DecimalPipe, use | number:'1.2-2' — that means 1 integer digit minimum, exactly 2 fraction digits",
      ],
      successMessage:
        'Precise formatting, no guesswork. Pipe parameters give you exact control over how every ' +
        'value appears. Next: wiring up live Observable streams with AsyncPipe.',
      explanation:
        "Parameters follow the pipe name after a colon. DatePipe accepts named formats like 'fullDate' " +
        "and 'short', or custom pattern strings. DecimalPipe uses a digit info string where '1.2-2' means " +
        'at least 1 integer digit and exactly 2 fraction digits. The pipe handles the rest.',
    } satisfies CodeChallengeStep,
    {
      stepType: 'code-challenge',
      prompt:
        'Wire up the telemetry feed. Import AsyncPipe, register it in the component, and apply it to ' +
        'the Observable so Angular subscribes for you and displays the latest value.',
      starterCode: [
        "import { Component } from '@angular/core';",
        "import { Observable, of } from 'rxjs';",
        '',
        '// TODO: Import the pipe that subscribes to Observables',
        '',
        '@Component({',
        "  selector: 'app-telemetry-panel',",
        '  // TODO: Register the Observable subscriber pipe',
        '  imports: [],',
        '  template: `',
        '    <p>Live Temp: {{ temperature$ }}K</p>',
        '  `,',
        '})',
        'export class TelemetryPanelComponent {',
        '  temperature$: Observable<number> = of(295.3);',
        '}',
      ].join('\n'),
      language: 'typescript',
      validationRules: [
        {
          type: 'contains',
          value: 'AsyncPipe',
          errorMessage: 'Import AsyncPipe from @angular/common to subscribe to Observables in templates',
        },
        {
          type: 'contains',
          value: '| async',
          errorMessage: 'Apply the async pipe to temperature$ in the template',
        },
        {
          type: 'pattern',
          pattern: 'imports:.*AsyncPipe',
          flags: 's',
          errorMessage: "Add AsyncPipe to the component's imports array",
        },
        {
          type: 'notContains',
          value: '{{ temperature$ }}K',
          errorMessage: 'Pipe the Observable through async before displaying it',
        },
      ],
      hints: [
        "Import AsyncPipe from '@angular/common' and add it to the imports array",
        'Change {{ temperature$ }} to {{ temperature$ | async }} — Angular subscribes and renders the latest value',
      ],
      successMessage:
        'Live data, zero manual subscriptions. AsyncPipe subscribes, renders, and cleans up after itself. ' +
        'You\'re ready to build your own custom pipes in Chapter 22.',
      explanation:
        'Without AsyncPipe, you\'d write subscribe(), store the value in a field, and implement ngOnDestroy ' +
        'to unsubscribe. AsyncPipe collapses all that into one template expression. Import it from ' +
        '@angular/common and add it to your component\'s imports array — same workflow as any other pipe.',
    } satisfies CodeChallengeStep,
  ],
  completionCriteria: {
    description: 'Advanced formatting online!',
    minStepsViewed: 6,
  },
};
