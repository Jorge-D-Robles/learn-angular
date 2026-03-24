import type { StoryMissionContent } from '../../../core/curriculum';

export const CHAPTER_21_CONTENT: StoryMissionContent = {
  chapterId: 21,
  steps: [
    {
      stepType: 'narrative',
      narrativeText:
        'Basic formatting is working, but the station\'s sensor arrays produce data in many different ' +
        'units and precisions. Some readings need long date formats, others need exactly two decimal ' +
        'places, and real-time telemetry streams arrive as Observables that update continuously. ' +
        'Advanced pipe techniques — parameters, chaining, and AsyncPipe — give you full control over ' +
        'how data is displayed.',
    },
    {
      stepType: 'code-example',
      narrativeText:
        'Pipes accept parameters separated by colons. You can also chain multiple pipes together, ' +
        'applying transformations in sequence from left to right.',
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
        'Pipe parameters follow the pipe name after a colon. DatePipe accepts format strings like ' +
        '\'long\', \'short\', or custom patterns. DecimalPipe\'s \'1.2-2\' means at least 1 integer digit, ' +
        'minimum 2 and maximum 2 fraction digits. Chain pipes with additional | operators — each pipe ' +
        'receives the output of the previous one.',
    },
    {
      stepType: 'code-example',
      narrativeText:
        'Real-time sensor telemetry arrives as Observable streams. AsyncPipe subscribes to an Observable ' +
        'in the template and automatically updates the display when new values arrive.',
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
        'AsyncPipe subscribes to an Observable and renders the latest emitted value. It also ' +
        'automatically unsubscribes when the component is destroyed, preventing memory leaks. ' +
        'You can chain AsyncPipe with other pipes and use it with @if to conditionally render ' +
        'based on the emitted value.',
    },
    {
      stepType: 'concept',
      narrativeText:
        'Advanced formatting is operational. Here is how pipe parameters, chaining, and AsyncPipe work.',
      conceptTitle: 'Advanced Pipe Patterns — Parameters, Chaining, and AsyncPipe',
      conceptBody:
        'Pipes become powerful when combined. Parameters customize formatting (date:\'long\', ' +
        'number:\'1.2-2\'), chaining applies multiple transformations in sequence, and AsyncPipe ' +
        'bridges reactive Observable streams into the template. AsyncPipe handles subscription ' +
        'lifecycle automatically.',
      keyPoints: [
        'Pipe parameters follow the pipe name after a colon (e.g., date:\'long\')',
        'Chain multiple pipes with | to apply transformations in sequence',
        'AsyncPipe subscribes to Observables and renders the latest value',
        'AsyncPipe automatically unsubscribes on component destruction',
      ],
    },
  ],
  completionCriteria: {
    description: 'Advanced formatting online!',
    minStepsViewed: 4,
  },
};
